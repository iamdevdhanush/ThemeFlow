import { UserSettings, ThemeConfig } from '../types/theme';
import { StoredUserSettingsV2, SETTINGS_SCHEMA_VERSION, UserThemeOverrides } from '../types/themeSchema';
import { DEFAULT_USER_SETTINGS } from '../themes/presets';
import { themeRegistry } from '../themes/themeRegistry';
import {
  STORAGE_KEY_V2,
  LEGACY_STORAGE_KEY_V1,
  runSafeStorageMigration,
  migrateV1ToV2,
  StorageAdapter,
  createDefaultSettingsV2,
} from './migration';
import { sanitizeStoredUserSettingsV2 } from './validation';

export {
  STORAGE_KEY_V2,
  LEGACY_STORAGE_KEY_V1,
  BACKUP_STORAGE_KEY_V1,
} from './migration';

const DB_NAME = 'ThemeFlowDB';
const DB_VERSION = 1;
const IMAGE_STORE = 'custom_images';

const customImageMemoryCache = new Map<string, string>();

function isExtensionOrigin(): boolean {
  if (typeof location !== 'undefined' && location.protocol) {
    return location.protocol === 'chrome-extension:';
  }
  return true;
}

// Helper for IndexedDB to store custom uploaded wallpapers safely without exceeding chrome.storage quotas
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveCustomImageToIndexedDB(id: string, dataUrl: string): Promise<void> {
  customImageMemoryCache.set(id, dataUrl);
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE, 'readwrite');
      const store = tx.objectStore(IMAGE_STORE);
      store.put({ id, dataUrl, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[ThemeFlow Storage] IndexedDB put error:', err);
  }
}

async function getCustomImageFromIndexedDB(id: string): Promise<string | null> {
  if (customImageMemoryCache.has(id)) {
    return customImageMemoryCache.get(id)!;
  }
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(IMAGE_STORE, 'readonly');
      const store = tx.objectStore(IMAGE_STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result ? req.result.dataUrl : null;
        if (result) customImageMemoryCache.set(id, result);
        resolve(result);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function deleteCustomImageFromIndexedDB(id: string): Promise<void> {
  customImageMemoryCache.delete(id);
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(IMAGE_STORE, 'readwrite');
      const store = tx.objectStore(IMAGE_STORE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

export async function saveCustomImageToDB(id: string, dataUrl: string): Promise<void> {
  if (!id || !dataUrl) return;

  if (isExtensionOrigin()) {
    return saveCustomImageToIndexedDB(id, dataUrl);
  }

  // If in content script on external host page, route through background worker
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'save_custom_image', id, dataUrl },
          (res) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
          }
        );
      });
      return;
    } catch (err) {
      console.warn('[ThemeFlow Storage] Failed to route saveCustomImage through runtime message:', err);
    }
  }

  return saveCustomImageToIndexedDB(id, dataUrl);
}

export async function getCustomImageFromDB(id: string): Promise<string | null> {
  if (!id) return null;

  if (customImageMemoryCache.has(id)) {
    return customImageMemoryCache.get(id)!;
  }

  if (isExtensionOrigin()) {
    return getCustomImageFromIndexedDB(id);
  }

  // In content script on external host page (leetcode.com / codeforces.com), fetch from extension background worker
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'get_custom_image', id },
          (res) => {
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(res);
            }
          }
        );
      });
      if (response && response.status === 'ok' && response.dataUrl) {
        customImageMemoryCache.set(id, response.dataUrl);
        return response.dataUrl;
      }
    } catch (err) {
      console.warn('[ThemeFlow Storage] Failed to fetch custom image from background worker:', err);
    }
  }

  return getCustomImageFromIndexedDB(id);
}

export async function deleteCustomImageFromDB(id: string): Promise<void> {
  if (!id) return;
  customImageMemoryCache.delete(id);

  if (isExtensionOrigin()) {
    return deleteCustomImageFromIndexedDB(id);
  }

  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      await new Promise<void>((resolve) => {
        chrome.runtime.sendMessage({ action: 'delete_custom_image', id }, () => resolve());
      });
      return;
    } catch {
      // ignore
    }
  }

  return deleteCustomImageFromIndexedDB(id);
}

function getActiveStorageAdapter(): StorageAdapter | null {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return {
      get(keys: string[]): Promise<Record<string, any>> {
        return new Promise((resolve) => {
          chrome.storage.local.get(keys, (result) => {
            resolve(result || {});
          });
        });
      },
      set(items: Record<string, any>): Promise<void> {
        return new Promise((resolve, reject) => {
          chrome.storage.local.set(items, () => {
            if (chrome.runtime?.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      },
    };
  }

  if (typeof localStorage !== 'undefined') {
    return {
      async get(keys: string[]): Promise<Record<string, any>> {
        const out: Record<string, any> = {};
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              out[k] = JSON.parse(raw);
            } catch {
              // ignore invalid json
            }
          }
        }
        return out;
      },
      async set(items: Record<string, any>): Promise<void> {
        for (const [k, v] of Object.entries(items)) {
          localStorage.setItem(k, JSON.stringify(v));
        }
      },
    };
  }

  return null;
}

export async function getSettings(): Promise<UserSettings> {
  try {
    const adapter = getActiveStorageAdapter();
    if (adapter) {
      const v2 = await runSafeStorageMigration(adapter);
      return v2ToUserSettings(v2);
    }
  } catch (err) {
    console.error('[ThemeFlow Storage] Failed to get settings, falling back to defaults:', err);
  }
  return DEFAULT_USER_SETTINGS;
}

let saveQueue: Promise<void> = Promise.resolve();

export function saveSettings(settings: UserSettings): Promise<void> {
  saveQueue = saveQueue.then(async () => {
    try {
      const adapter = getActiveStorageAdapter();
      if (!adapter) return;

      // 1. Retrieve existing v2 to preserve existing themeOverrides across other themes
      const existingData = await adapter.get([STORAGE_KEY_V2]);
      const existingV2 = existingData[STORAGE_KEY_V2];
      const existingOverrides = (existingV2 && typeof existingV2 === 'object' && existingV2.themeOverrides)
        ? { ...existingV2.themeOverrides }
        : {};

      const incomingOverrides = (settings as any).themeOverrides || {};
      const mergedOverrides = { ...existingOverrides, ...incomingOverrides };

      // 2. Track overrides for active theme if user customized properties on a built-in theme
      const activeDef = themeRegistry.get(settings.activeThemeId);
      if (activeDef && settings.currentConfig && !settings.currentConfig.isCustom) {
        const activeOverrides: UserThemeOverrides = {};
        let hasOverrides = false;

        if (settings.currentConfig.mode && settings.currentConfig.mode !== activeDef.tokens.defaultMode) {
          activeOverrides.mode = settings.currentConfig.mode;
          hasOverrides = true;
        }
        if (settings.currentConfig.accentColor && settings.currentConfig.accentColor !== activeDef.tokens.accentColor) {
          activeOverrides.accentColor = settings.currentConfig.accentColor;
          hasOverrides = true;
        }
        if (typeof settings.currentConfig.overlayOpacity === 'number' && settings.currentConfig.overlayOpacity !== activeDef.tokens.surfaces.overlayOpacity) {
          activeOverrides.overlayOpacity = settings.currentConfig.overlayOpacity;
          hasOverrides = true;
        }
        if (typeof settings.currentConfig.blur === 'number' && settings.currentConfig.blur !== activeDef.tokens.surfaces.blur) {
          activeOverrides.blur = settings.currentConfig.blur;
          hasOverrides = true;
        }
        if (typeof settings.currentConfig.brightness === 'number' && settings.currentConfig.brightness !== activeDef.tokens.surfaces.brightness) {
          activeOverrides.brightness = settings.currentConfig.brightness;
          hasOverrides = true;
        }
        if (typeof settings.currentConfig.contrast === 'number' && settings.currentConfig.contrast !== activeDef.tokens.surfaces.contrast) {
          activeOverrides.contrast = settings.currentConfig.contrast;
          hasOverrides = true;
        }
        if (typeof settings.currentConfig.cardGlassOpacity === 'number' && settings.currentConfig.cardGlassOpacity !== activeDef.tokens.surfaces.cardGlassOpacity) {
          activeOverrides.cardGlassOpacity = settings.currentConfig.cardGlassOpacity;
          hasOverrides = true;
        }
        if (settings.currentConfig.fontFamily && settings.currentConfig.fontFamily !== activeDef.tokens.typography.fontFamily) {
          activeOverrides.fontFamily = settings.currentConfig.fontFamily;
          hasOverrides = true;
        }
        if (settings.currentConfig.effect && settings.currentConfig.effect !== 'none') {
          activeOverrides.ambientEffect = settings.currentConfig.effect;
          hasOverrides = true;
        }

        if (hasOverrides) {
          mergedOverrides[settings.activeThemeId] = activeOverrides;
        } else {
          delete mergedOverrides[settings.activeThemeId];
        }
      }

      // 3. Keep customThemes list in sync if active custom theme was updated
      const customThemes = (settings.customThemes || []).map((ct) => {
        if (ct.id === settings.activeThemeId && settings.currentConfig?.isCustom) {
          return { ...ct, ...settings.currentConfig };
        }
        return ct;
      });

      const v2Candidate: StoredUserSettingsV2 = {
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        enabled: settings.enabled,
        activeThemeId: settings.activeThemeId,
        quickSwitchVisible: settings.quickSwitchVisible,
        audioSettings: {
          enabled: settings.currentConfig.soundEnabled,
          volume: settings.currentConfig.soundVolume,
        },
        animationSettings: {
          celebrationEnabled: settings.currentConfig.confettiEnabled,
          ambientEffect: settings.currentConfig.effect,
        },
        themeOverrides: mergedOverrides,
        customThemes,
        currentConfig: settings.currentConfig,
      };

      const sanitized = sanitizeStoredUserSettingsV2(v2Candidate, createDefaultSettingsV2());

      // Save v2 and synchronize legacy v1 key so backward-compatible consumers read identical state
      await adapter.set({
        [STORAGE_KEY_V2]: sanitized,
        [LEGACY_STORAGE_KEY_V1]: settings,
      });
    } catch (err) {
      console.error('[ThemeFlow Storage] Failed to save settings:', err);
    }
  });

  return saveQueue;
}

export function subscribeToSettingsChanges(callback: (settings: UserSettings) => void): () => void {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local') {
        if (changes[STORAGE_KEY_V2]?.newValue) {
          const v2 = sanitizeStoredUserSettingsV2(changes[STORAGE_KEY_V2].newValue, createDefaultSettingsV2());
          callback(v2ToUserSettings(v2));
        } else if (changes[LEGACY_STORAGE_KEY_V1]?.newValue && !changes[STORAGE_KEY_V2]) {
          const v2 = migrateV1ToV2(changes[LEGACY_STORAGE_KEY_V1].newValue);
          callback(v2ToUserSettings(v2));
        }
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  // Fallback storage event for web pages
  const windowListener = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_V2 && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        const v2 = sanitizeStoredUserSettingsV2(parsed, createDefaultSettingsV2());
        callback(v2ToUserSettings(v2));
      } catch (err) {
        console.error(err);
      }
    } else if (e.key === LEGACY_STORAGE_KEY_V1 && e.newValue) {
      // If v2 key is already present in localStorage, ignore legacy event to avoid duplicate updates
      if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY_V2)) {
        return;
      }
      try {
        const v2 = migrateV1ToV2(JSON.parse(e.newValue));
        callback(v2ToUserSettings(v2));
      } catch (err) {
        console.error(err);
      }
    }
  };
  window.addEventListener('storage', windowListener);
  return () => window.removeEventListener('storage', windowListener);
}

function v2ToUserSettings(v2: StoredUserSettingsV2): UserSettings {
  const settings: UserSettings = {
    enabled: v2.enabled,
    activeThemeId: v2.activeThemeId,
    customThemes: v2.customThemes,
    currentConfig: v2.currentConfig,
    quickSwitchVisible: v2.quickSwitchVisible,
  };
  (settings as any).themeOverrides = v2.themeOverrides;
  return settings;
}
