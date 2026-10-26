import { ThemePreset, ThemeConfig, UserSettings } from '../types/theme';
import { themeRegistry } from './themeRegistry';

/**
 * Built-in Theme Presets derived from the centralized ThemeRegistry.
 * Maintained for backward compatibility with legacy consumers.
 */
export const THEME_PRESETS: ThemePreset[] = themeRegistry
  .getAll()
  .map((def) => themeRegistry.toLegacyPreset(def));

export function presetToConfig(preset: ThemePreset): ThemeConfig {
  const def = themeRegistry.get(preset.id);
  if (def) {
    return themeRegistry.definitionToConfig(def);
  }
  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    imagePath: `IMAGES/${preset.filename}`,
    thumbnailPath: preset.thumbnail,
    accentColor: preset.accentColor,
    mode: preset.defaultMode,
    overlayOpacity: preset.defaultOverlay,
    blur: preset.defaultBlur,
    brightness: 100,
    contrast: 100,
    cardGlassOpacity: 0.78,
    fontFamily: 'JetBrains Mono',
    effect: 'none',
    soundEnabled: false,
    soundVolume: 0.7,
    confettiEnabled: true,
  };
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = themeRegistry.definitionToConfig(
  themeRegistry.getDefault()
);

export const DEFAULT_USER_SETTINGS: UserSettings = {
  enabled: true,
  activeThemeId: themeRegistry.getDefault().id,
  customThemes: [],
  currentConfig: DEFAULT_THEME_CONFIG,
  quickSwitchVisible: true,
};
