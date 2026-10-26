import {
  ThemeMode,
  VisualEffect,
  CodeFontFamily,
  ThemeConfig,
  StoredUserSettingsV2,
  SETTINGS_SCHEMA_VERSION,
  UserThemeOverrides,
} from '../types/themeSchema';

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}

export function validateThemeMode(mode: unknown, fallback: ThemeMode = 'dark'): ThemeMode {
  const validModes: ThemeMode[] = ['dark', 'midnight', 'glass', 'light'];
  if (typeof mode === 'string' && validModes.includes(mode as ThemeMode)) {
    return mode as ThemeMode;
  }
  return fallback;
}

export function validateVisualEffect(effect: unknown, fallback: VisualEffect = 'none'): VisualEffect {
  const validEffects: VisualEffect[] = ['none', 'sakura', 'rain', 'stars'];
  if (typeof effect === 'string' && validEffects.includes(effect as VisualEffect)) {
    return effect as VisualEffect;
  }
  return fallback;
}

export function validateFontFamily(
  font: unknown,
  fallback: CodeFontFamily = 'JetBrains Mono'
): CodeFontFamily {
  const validFonts: CodeFontFamily[] = ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'];
  if (typeof font === 'string' && validFonts.includes(font as CodeFontFamily)) {
    return font as CodeFontFamily;
  }
  return fallback;
}

export function validateHexColor(color: unknown, fallback = '#a78bfa'): string {
  if (typeof color === 'string') {
    const trimmed = color.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
      return trimmed;
    }
  }
  return fallback;
}

export function sanitizeThemeConfig(raw: Partial<ThemeConfig> | null | undefined, fallback: ThemeConfig): ThemeConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...fallback };
  }

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fallback.id;
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : fallback.name;
  const description = typeof raw.description === 'string' ? raw.description : fallback.description;
  const imagePath = typeof raw.imagePath === 'string' && raw.imagePath.trim() ? raw.imagePath.trim() : fallback.imagePath;
  const thumbnailPath = typeof raw.thumbnailPath === 'string' && raw.thumbnailPath.trim() ? raw.thumbnailPath.trim() : fallback.thumbnailPath;
  const accentColor = validateHexColor(raw.accentColor, fallback.accentColor);
  const mode = validateThemeMode(raw.mode, fallback.mode);
  const overlayOpacity = clampNumber(raw.overlayOpacity, 0.0, 1.0, fallback.overlayOpacity);
  const blur = clampNumber(raw.blur, 0, 20, fallback.blur);
  const brightness = clampNumber(raw.brightness, 50, 130, fallback.brightness);
  const contrast = clampNumber(raw.contrast, 80, 130, fallback.contrast);
  const cardGlassOpacity = clampNumber(raw.cardGlassOpacity, 0.2, 1.0, fallback.cardGlassOpacity);
  const fontFamily = validateFontFamily(raw.fontFamily, fallback.fontFamily);
  const effect = validateVisualEffect(raw.effect, fallback.effect);
  const soundEnabled = typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : fallback.soundEnabled;
  const soundVolume = clampNumber(raw.soundVolume, 0.0, 1.0, fallback.soundVolume);
  const confettiEnabled = typeof raw.confettiEnabled === 'boolean' ? raw.confettiEnabled : fallback.confettiEnabled;
  const isCustom = typeof raw.isCustom === 'boolean' ? raw.isCustom : Boolean(fallback.isCustom);

  return {
    id,
    name,
    description,
    imagePath,
    thumbnailPath,
    accentColor,
    mode,
    overlayOpacity,
    blur,
    brightness,
    contrast,
    cardGlassOpacity,
    fontFamily,
    effect,
    soundEnabled,
    soundVolume,
    confettiEnabled,
    isCustom,
  };
}

export function sanitizeUserThemeOverrides(raw: unknown): UserThemeOverrides {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, any>;
  const result: UserThemeOverrides = {};

  if (o.mode !== undefined) result.mode = validateThemeMode(o.mode);
  if (o.accentColor !== undefined) result.accentColor = validateHexColor(o.accentColor);
  if (o.overlayOpacity !== undefined) result.overlayOpacity = clampNumber(o.overlayOpacity, 0.0, 1.0, 0.72);
  if (o.blur !== undefined) result.blur = clampNumber(o.blur, 0, 20, 0);
  if (o.brightness !== undefined) result.brightness = clampNumber(o.brightness, 50, 130, 100);
  if (o.contrast !== undefined) result.contrast = clampNumber(o.contrast, 80, 130, 100);
  if (o.cardGlassOpacity !== undefined) result.cardGlassOpacity = clampNumber(o.cardGlassOpacity, 0.2, 1.0, 0.78);
  if (o.fontFamily !== undefined) result.fontFamily = validateFontFamily(o.fontFamily);
  if (o.ambientEffect !== undefined) result.ambientEffect = validateVisualEffect(o.ambientEffect);

  return result;
}

export function sanitizeStoredUserSettingsV2(
  raw: any,
  fallback: StoredUserSettingsV2
): StoredUserSettingsV2 {
  if (!raw || typeof raw !== 'object') {
    return { ...fallback };
  }

  const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : fallback.enabled;
  const activeThemeId = typeof raw.activeThemeId === 'string' && raw.activeThemeId.trim()
    ? raw.activeThemeId.trim()
    : fallback.activeThemeId;
  const quickSwitchVisible = typeof raw.quickSwitchVisible === 'boolean'
    ? raw.quickSwitchVisible
    : fallback.quickSwitchVisible;

  const audioSettings = {
    enabled: typeof raw.audioSettings?.enabled === 'boolean'
      ? raw.audioSettings.enabled
      : fallback.audioSettings.enabled,
    volume: clampNumber(raw.audioSettings?.volume, 0.0, 1.0, fallback.audioSettings.volume),
  };

  const animationSettings = {
    celebrationEnabled: typeof raw.animationSettings?.celebrationEnabled === 'boolean'
      ? raw.animationSettings.celebrationEnabled
      : fallback.animationSettings.celebrationEnabled,
    ambientEffect: validateVisualEffect(
      raw.animationSettings?.ambientEffect,
      fallback.animationSettings.ambientEffect
    ),
  };

  const themeOverrides: Record<string, UserThemeOverrides> = {};
  if (raw.themeOverrides && typeof raw.themeOverrides === 'object') {
    for (const [themeId, overrides] of Object.entries(raw.themeOverrides)) {
      if (typeof themeId === 'string' && overrides) {
        themeOverrides[themeId] = sanitizeUserThemeOverrides(overrides);
      }
    }
  }

  const customThemes: ThemeConfig[] = Array.isArray(raw.customThemes)
    ? raw.customThemes.map((c: any) => sanitizeThemeConfig(c, fallback.currentConfig))
    : [];

  const currentConfig = sanitizeThemeConfig(raw.currentConfig, fallback.currentConfig);

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    enabled,
    activeThemeId,
    quickSwitchVisible,
    audioSettings,
    animationSettings,
    themeOverrides,
    customThemes,
    currentConfig,
  };
}
