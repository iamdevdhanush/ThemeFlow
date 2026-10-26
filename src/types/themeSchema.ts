import { ThemeMode, VisualEffect, CodeFontFamily, ThemeConfig, UserSettings } from './theme';
import { SupportedPlatform } from './platform';

export const THEME_SCHEMA_VERSION = '2.0.0';
export const SETTINGS_SCHEMA_VERSION = '2.0.0';

export interface SurfaceTokens {
  overlayOpacity: number;    // 0.0 to 1.0 (darkness overlay)
  blur: number;              // 0 to 20px
  brightness: number;        // 50 to 130%
  contrast: number;          // 80 to 130%
  cardGlassOpacity: number;  // 0.2 to 1.0
  panelBg?: string;          // Optional custom RGBA overrides
  panelSecondary?: string;
  editorBg?: string;
  toolbarBg?: string;
  border?: string;
}

export interface TypographyTokens {
  fontFamily: CodeFontFamily;
}

export interface ThemeAssets {
  wallpaper: string;         // Relative path or extension resource, e.g. "IMAGES/galaxy.jpg"
  thumbnail: string;         // Relative path, e.g. "thumbnails/galaxy.webp"
  fallbackColor?: string;     // Color to display if wallpaper fails to load
}

export interface CelebrationConfig {
  effectId: string;          // 'domain-expansion' | 'none'
  durationMs?: number;       // default 1980ms
  accentColorOverride?: string;
}

export interface SoundProfileConfig {
  profileId: string;         // 'anime-finisher' | 'none'
  acSoundPath?: string;      // default 'sounds/ac.wav'
  waSoundPath?: string;      // default 'sounds/wa.wav'
}

export interface ThemeDefinition {
  schemaVersion: typeof THEME_SCHEMA_VERSION;
  id: string;                // Stable kebab-case ID, e.g. "cosmic-void"
  version: string;           // Theme semantic version, e.g. "1.0.0"
  name: string;
  description: string;
  tags: string[];
  supportedPlatforms: SupportedPlatform[];
  assets: ThemeAssets;
  tokens: {
    defaultMode: ThemeMode;
    accentColor: string;
    accentGlow?: string;
    surfaces: SurfaceTokens;
    typography: TypographyTokens;
  };
  celebration?: CelebrationConfig;
  soundProfile?: SoundProfileConfig;
  ambientEffect?: VisualEffect;
}

export interface UserThemeOverrides {
  mode?: ThemeMode;
  accentColor?: string;
  overlayOpacity?: number;
  blur?: number;
  brightness?: number;
  contrast?: number;
  cardGlassOpacity?: number;
  fontFamily?: CodeFontFamily;
  ambientEffect?: VisualEffect;
}

export interface AudioSettings {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
}

export interface AnimationSettings {
  celebrationEnabled: boolean;
  ambientEffect: VisualEffect;
}

export interface StoredUserSettingsV2 {
  schemaVersion: typeof SETTINGS_SCHEMA_VERSION;
  enabled: boolean;
  activeThemeId: string;
  quickSwitchVisible: boolean;
  audioSettings: AudioSettings;
  animationSettings: AnimationSettings;
  themeOverrides: Record<string, UserThemeOverrides>;
  customThemes: ThemeConfig[];
  currentConfig: ThemeConfig;
}

export type { ThemeMode, VisualEffect, CodeFontFamily, ThemeConfig, UserSettings };
