import {
  StoredUserSettingsV2,
  SETTINGS_SCHEMA_VERSION,
  ThemeConfig,
  UserThemeOverrides,
} from '../types/themeSchema';
import { themeRegistry } from '../themes/themeRegistry';
import { sanitizeStoredUserSettingsV2, sanitizeThemeConfig } from './validation';

export const STORAGE_KEY_V2 = 'themeflow_settings_v2';
export const LEGACY_STORAGE_KEY_V1 = 'themeflow_user_settings_v1';
export const BACKUP_STORAGE_KEY_V1 = 'themeflow_user_settings_v1_backup';

export function createDefaultSettingsV2(): StoredUserSettingsV2 {
  const defaultTheme = themeRegistry.getDefault();
  const defaultConfig = themeRegistry.definitionToConfig(defaultTheme);

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    enabled: true,
    activeThemeId: defaultTheme.id,
    quickSwitchVisible: true,
    audioSettings: {
      enabled: false,
      volume: 0.7,
    },
    animationSettings: {
      celebrationEnabled: true,
      ambientEffect: 'none',
    },
    themeOverrides: {},
    customThemes: [],
    currentConfig: defaultConfig,
  };
}

export function isV2Settings(data: unknown): data is StoredUserSettingsV2 {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, any>;
  return obj.schemaVersion === SETTINGS_SCHEMA_VERSION && typeof obj.currentConfig === 'object';
}

/**
 * Pure function to transform legacy v1 user settings into validated v2 settings.
 * Idempotent: If passed an object already in v2 format, it simply validates and returns it.
 */
export function migrateV1ToV2(v1: any): StoredUserSettingsV2 {
  const defaults = createDefaultSettingsV2();

  if (!v1 || typeof v1 !== 'object') {
    return defaults;
  }

  // If already v2, sanitize and return without re-migrating
  if (isV2Settings(v1)) {
    return sanitizeStoredUserSettingsV2(v1, defaults);
  }

  const enabled = typeof v1.enabled === 'boolean' ? v1.enabled : defaults.enabled;
  const activeThemeId = typeof v1.activeThemeId === 'string' && v1.activeThemeId.trim()
    ? v1.activeThemeId.trim()
    : defaults.activeThemeId;
  const quickSwitchVisible = typeof v1.quickSwitchVisible === 'boolean'
    ? v1.quickSwitchVisible
    : defaults.quickSwitchVisible;

  // Preserve audio and animation settings from v1 currentConfig
  const legacyConfig = v1.currentConfig || {};
  const audioSettings = {
    enabled: typeof legacyConfig.soundEnabled === 'boolean' ? legacyConfig.soundEnabled : false,
    volume: typeof legacyConfig.soundVolume === 'number' && Number.isFinite(legacyConfig.soundVolume)
      ? Math.max(0, Math.min(1, legacyConfig.soundVolume))
      : 0.7,
  };

  const animationSettings = {
    celebrationEnabled: typeof legacyConfig.confettiEnabled === 'boolean'
      ? legacyConfig.confettiEnabled
      : true,
    ambientEffect: legacyConfig.effect || 'none',
  };

  // Preserve custom uploaded themes
  const customThemes: ThemeConfig[] = Array.isArray(v1.customThemes)
    ? v1.customThemes.map((c: any) => sanitizeThemeConfig(c, defaults.currentConfig))
    : [];

  // Build themeOverrides for active theme if user customized properties
  const themeOverrides: Record<string, UserThemeOverrides> = {};
  if (typeof activeThemeId === 'string' && activeThemeId && v1.currentConfig) {
    const def = themeRegistry.get(activeThemeId);
    if (def) {
      const overrides: UserThemeOverrides = {};
      let hasOverrides = false;

      if (legacyConfig.mode && legacyConfig.mode !== def.tokens.defaultMode) {
        overrides.mode = legacyConfig.mode;
        hasOverrides = true;
      }
      if (legacyConfig.accentColor && legacyConfig.accentColor !== def.tokens.accentColor) {
        overrides.accentColor = legacyConfig.accentColor;
        hasOverrides = true;
      }
      if (typeof legacyConfig.overlayOpacity === 'number' && legacyConfig.overlayOpacity !== def.tokens.surfaces.overlayOpacity) {
        overrides.overlayOpacity = legacyConfig.overlayOpacity;
        hasOverrides = true;
      }
      if (typeof legacyConfig.blur === 'number' && legacyConfig.blur !== def.tokens.surfaces.blur) {
        overrides.blur = legacyConfig.blur;
        hasOverrides = true;
      }
      if (typeof legacyConfig.brightness === 'number' && legacyConfig.brightness !== def.tokens.surfaces.brightness) {
        overrides.brightness = legacyConfig.brightness;
        hasOverrides = true;
      }
      if (typeof legacyConfig.contrast === 'number' && legacyConfig.contrast !== def.tokens.surfaces.contrast) {
        overrides.contrast = legacyConfig.contrast;
        hasOverrides = true;
      }
      if (typeof legacyConfig.cardGlassOpacity === 'number' && legacyConfig.cardGlassOpacity !== def.tokens.surfaces.cardGlassOpacity) {
        overrides.cardGlassOpacity = legacyConfig.cardGlassOpacity;
        hasOverrides = true;
      }
      if (legacyConfig.fontFamily && legacyConfig.fontFamily !== def.tokens.typography.fontFamily) {
        overrides.fontFamily = legacyConfig.fontFamily;
        hasOverrides = true;
      }
      if (legacyConfig.effect && legacyConfig.effect !== 'none') {
        overrides.ambientEffect = legacyConfig.effect;
        hasOverrides = true;
      }

      if (hasOverrides) {
        themeOverrides[activeThemeId] = overrides;
      }
    }
  }

  // Resolve currentConfig safely
  const resolvedCurrent = themeRegistry.resolveConfig(
    activeThemeId,
    themeOverrides[activeThemeId],
    customThemes,
    {
      soundEnabled: audioSettings.enabled,
      soundVolume: audioSettings.volume,
      confettiEnabled: animationSettings.celebrationEnabled,
    }
  );

  const rawCandidate: StoredUserSettingsV2 = {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    enabled,
    activeThemeId,
    quickSwitchVisible,
    audioSettings,
    animationSettings,
    themeOverrides,
    customThemes,
    currentConfig: sanitizeThemeConfig(resolvedCurrent, defaults.currentConfig),
  };

  return sanitizeStoredUserSettingsV2(rawCandidate, defaults);
}

export interface StorageAdapter {
  get(keys: string[]): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
}

/**
 * Orchestrates the full, safe migration in persistent storage:
 * 1. Checks if v2 settings already exist. If valid, returns them (idempotent).
 * 2. If only v1 settings exist:
 *    a. Saves a backup to BACKUP_STORAGE_KEY_V1.
 *    b. Migrates v1 to v2 format with bounds validation.
 *    c. Saves v2 settings to STORAGE_KEY_V2.
 *    d. Leaves v1 untouched for rollback safety until verified.
 * 3. If neither exists or storage is corrupt: initializes with safe v2 defaults.
 */
export async function runSafeStorageMigration(storage: StorageAdapter): Promise<StoredUserSettingsV2> {
  const defaults = createDefaultSettingsV2();

  try {
    const data = await storage.get([STORAGE_KEY_V2, LEGACY_STORAGE_KEY_V1]);
    const v2Data = data[STORAGE_KEY_V2];
    const v1Data = data[LEGACY_STORAGE_KEY_V1];

    // Case 1: V2 settings exist and are valid
    if (isV2Settings(v2Data)) {
      return sanitizeStoredUserSettingsV2(v2Data, defaults);
    }

    // Case 2: Only legacy V1 exists
    if (v1Data && typeof v1Data === 'object') {
      console.log('[ThemeFlow Migration] Migrating legacy v1 settings to versioned v2 format...');

      // 1. Save original backup
      await storage.set({ [BACKUP_STORAGE_KEY_V1]: v1Data });

      // 2. Perform conversion
      const migrated = migrateV1ToV2(v1Data);

      // 3. Write migrated v2 settings
      await storage.set({ [STORAGE_KEY_V2]: migrated });
      console.log('[ThemeFlow Migration] Successfully migrated to v2 settings and verified backup.');

      return migrated;
    }

    // Case 3: Fresh install or corrupt state -> initialize defaults
    await storage.set({ [STORAGE_KEY_V2]: defaults });
    return defaults;
  } catch (err) {
    console.error('[ThemeFlow Migration] Migration failed with error, falling back to safe defaults:', err);
    return defaults;
  }
}
