import { UserSettings, ThemeConfig } from '../types/theme';
import { DEFAULT_USER_SETTINGS, THEME_PRESETS, presetToConfig } from '../themes/presets';

const STORAGE_KEY = 'themeflow_user_settings_v1';
const DB_NAME = 'ThemeFlowDB';
const DB_VERSION = 1;
const IMAGE_STORE = 'custom_images';

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

export async function saveCustomImageToDB(id: string, dataUrl: string): Promise<void> {
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
    console.warn('IndexedDB custom image store fallback:', err);
  }
}

export async function getCustomImageFromDB(id: string): Promise<string | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(IMAGE_STORE, 'readonly');
      const store = tx.objectStore(IMAGE_STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? req.result.dataUrl : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteCustomImageFromDB(id: string): Promise<void> {
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

export async function getSettings(): Promise<UserSettings> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      if (result && result[STORAGE_KEY]) {
        return mergeWithDefaults(result[STORAGE_KEY]);
      }
    } else if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return mergeWithDefaults(JSON.parse(raw));
      }
    }
  } catch (err) {
    console.error('Failed to get settings:', err);
  }
  return DEFAULT_USER_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function subscribeToSettingsChanges(callback: (settings: UserSettings) => void): () => void {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        callback(mergeWithDefaults(changes[STORAGE_KEY].newValue));
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  // Fallback storage event for web pages
  const windowListener = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        callback(mergeWithDefaults(JSON.parse(e.newValue)));
      } catch (err) {
        console.error(err);
      }
    }
  };
  window.addEventListener('storage', windowListener);
  return () => window.removeEventListener('storage', windowListener);
}

function mergeWithDefaults(saved: any): UserSettings {
  if (!saved || typeof saved !== 'object') {
    return DEFAULT_USER_SETTINGS;
  }
  return {
    ...DEFAULT_USER_SETTINGS,
    ...saved,
    currentConfig: {
      ...DEFAULT_USER_SETTINGS.currentConfig,
      ...(saved.currentConfig || {}),
    },
    customThemes: Array.isArray(saved.customThemes) ? saved.customThemes : [],
  };
}
