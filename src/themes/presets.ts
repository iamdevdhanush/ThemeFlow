import { ThemePreset, ThemeConfig, UserSettings } from '../types/theme';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'cosmic-void',
    name: 'Cosmic Void',
    description: 'Infinite deep space nebula with stellar purple and indigo hues.',
    filename: 'galaxy.jpg',
    thumbnail: 'thumbnails/galaxy.webp',
    accentColor: '#a78bfa', // Lavender
    defaultMode: 'dark',
    defaultOverlay: 0.72,
    defaultBlur: 0,
    tags: ['Sci-Fi', 'Space', 'Dark'],
  },
  {
    id: 'neo-tokyo',
    name: 'Neo Tokyo Dusk',
    description: 'Atmospheric rainy alleyway glowing with tranquil evening lanterns.',
    filename: 'japan_street.avif',
    thumbnail: 'thumbnails/japan_street.webp',
    accentColor: '#f472b6', // Sakura Pink
    defaultMode: 'glass',
    defaultOverlay: 0.68,
    defaultBlur: 0,
    tags: ['Anime', 'Rain', 'Atmospheric'],
  },
  {
    id: 'midnight-focus',
    name: 'Midnight Focus',
    description: 'Moody late-night coding session under soft cinematic lamplight.',
    filename: 'boy_focus.jpg',
    thumbnail: 'thumbnails/boy_focus.webp',
    accentColor: '#60a5fa', // Sky Blue
    defaultMode: 'dark',
    defaultOverlay: 0.70,
    defaultBlur: 0,
    tags: ['Focus', 'Cozy', 'Night'],
  },
  {
    id: 'cyber-workstation',
    name: 'Cyber Workstation',
    description: 'Modern multi-monitor developer setup with calm ambient glow.',
    filename: 'girl_desktop.jpg',
    thumbnail: 'thumbnails/girl_desktop.webp',
    accentColor: '#c084fc', // Violet
    defaultMode: 'dark',
    defaultOverlay: 0.72,
    defaultBlur: 0,
    tags: ['Desk', 'Aesthetic', 'Purple'],
  },
  {
    id: 'zen-workspace',
    name: 'Zen Workspace',
    description: 'Clean minimalist desk with warm afternoon sunlight and foliage.',
    filename: 'laptop_desk.jpg',
    thumbnail: 'thumbnails/laptop_desk.webp',
    accentColor: '#34d399', // Emerald
    defaultMode: 'glass',
    defaultOverlay: 0.68,
    defaultBlur: 0,
    tags: ['Minimal', 'Green', 'Clean'],
  },
  {
    id: 'golden-dusk',
    name: 'Golden Dusk',
    description: 'Breathtaking sunset casting warm amber gradients across the horizon.',
    filename: 'sunset.avif',
    thumbnail: 'thumbnails/sunset.webp',
    accentColor: '#fbbf24', // Amber Gold
    defaultMode: 'dark',
    defaultOverlay: 0.68,
    defaultBlur: 0,
    tags: ['Sunset', 'Warm', 'Sky'],
  },
  {
    id: 'velvet-horizon',
    name: 'Velvet Horizon',
    description: 'Dreamy twilight skyline with gentle pastel clouds and quiet evening.',
    filename: 'sikera_sunset.jpg',
    thumbnail: 'thumbnails/sikera_sunset.webp',
    accentColor: '#f87171', // Coral Rose
    defaultMode: 'dark',
    defaultOverlay: 0.70,
    defaultBlur: 0,
    tags: ['Twilight', 'Sunset', 'Clouds'],
  },
  {
    id: 'mystic-hallow',
    name: 'Mystic Hallow',
    description: 'Enchanting nocturnal forest illuminated by warm lantern glow.',
    filename: 'halloween.jpg',
    thumbnail: 'thumbnails/halloween.webp',
    accentColor: '#fb923c', // Pumpkin Glow
    defaultMode: 'dark',
    defaultOverlay: 0.74,
    defaultBlur: 0,
    tags: ['Fantasy', 'Warm', 'Nocturnal'],
  },
];

export function presetToConfig(preset: ThemePreset): ThemeConfig {
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
    soundEnabled: false, // Muted by default per specification
    soundVolume: 0.7,
    confettiEnabled: true,
  };
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = presetToConfig(THEME_PRESETS[0]);

export const DEFAULT_USER_SETTINGS: UserSettings = {
  enabled: true,
  activeThemeId: THEME_PRESETS[0].id,
  customThemes: [],
  currentConfig: DEFAULT_THEME_CONFIG,
  quickSwitchVisible: true,
};
