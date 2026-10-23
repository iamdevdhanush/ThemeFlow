export type ThemeMode = 'dark' | 'midnight' | 'glass' | 'light';
export type VisualEffect = 'none' | 'sakura' | 'rain' | 'stars';
export type CodeFontFamily = 'JetBrains Mono' | 'Fira Code' | 'Consolas' | 'monospace';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  filename: string; // File in IMAGES/
  thumbnail: string; // File in thumbnails/
  accentColor: string;
  defaultMode: ThemeMode;
  defaultOverlay: number;
  defaultBlur: number;
  tags?: string[];
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  imagePath: string; // Relative path or custom data URL
  thumbnailPath: string;
  accentColor: string;
  mode: ThemeMode;
  overlayOpacity: number; // 0.0 to 1.0 (darkness overlay)
  blur: number; // 0 to 20px
  brightness: number; // 50 to 130%
  contrast: number; // 80 to 130%
  cardGlassOpacity: number; // 0.2 to 1.0
  fontFamily: CodeFontFamily;
  effect: VisualEffect;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  confettiEnabled: boolean;
  isCustom?: boolean;
}

export interface UserSettings {
  enabled: boolean;
  activeThemeId: string;
  customThemes: ThemeConfig[];
  currentConfig: ThemeConfig;
  quickSwitchVisible: boolean;
}
