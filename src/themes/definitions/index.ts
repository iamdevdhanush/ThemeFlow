import { ThemeDefinition, THEME_SCHEMA_VERSION } from '../../types/themeSchema';

export const cosmicVoidTheme: ThemeDefinition = {
  schemaVersion: THEME_SCHEMA_VERSION,
  id: 'cosmic-void',
  version: '1.0.0',
  name: 'Cosmic Void',
  description: 'Infinite deep space nebula with stellar purple and indigo hues.',
  tags: ['Sci-Fi', 'Space', 'Dark'],
  supportedPlatforms: ['leetcode', 'codeforces'],
  assets: {
    wallpaper: 'IMAGES/galaxy.jpg',
    thumbnail: 'thumbnails/galaxy.webp',
    fallbackColor: '#0c0d14',
  },
  tokens: {
    defaultMode: 'dark',
    accentColor: '#a78bfa',
    accentGlow: 'rgba(167, 139, 250, 0.35)',
    surfaces: {
      overlayOpacity: 0.72,
      blur: 0,
      brightness: 100,
      contrast: 100,
      cardGlassOpacity: 0.78,
    },
    typography: {
      fontFamily: 'JetBrains Mono',
    },
  },
  celebration: {
    effectId: 'domain-expansion',
    durationMs: 1980,
  },
  soundProfile: {
    profileId: 'anime-finisher',
    acSoundPath: 'sounds/ac.wav',
    waSoundPath: 'sounds/wa.wav',
  },
  ambientEffect: 'none',
};

export const neoTokyoTheme: ThemeDefinition = {
  schemaVersion: THEME_SCHEMA_VERSION,
  id: 'neo-tokyo',
  version: '1.0.0',
  name: 'Neo Tokyo Dusk',
  description: 'Atmospheric rainy alleyway glowing with tranquil evening lanterns.',
  tags: ['Anime', 'Rain', 'Atmospheric'],
  supportedPlatforms: ['leetcode', 'codeforces'],
  assets: {
    wallpaper: 'IMAGES/japan_street.avif',
    thumbnail: 'thumbnails/japan_street.webp',
    fallbackColor: '#120d18',
  },
  tokens: {
    defaultMode: 'glass',
    accentColor: '#f472b6',
    accentGlow: 'rgba(244, 114, 182, 0.35)',
    surfaces: {
      overlayOpacity: 0.68,
      blur: 0,
      brightness: 100,
      contrast: 100,
      cardGlassOpacity: 0.78,
    },
    typography: {
      fontFamily: 'JetBrains Mono',
    },
  },
  celebration: {
    effectId: 'domain-expansion',
    durationMs: 1980,
  },
  soundProfile: {
    profileId: 'anime-finisher',
    acSoundPath: 'sounds/ac.wav',
    waSoundPath: 'sounds/wa.wav',
  },
  ambientEffect: 'none',
};

export const midnightFocusTheme: ThemeDefinition = {
  schemaVersion: THEME_SCHEMA_VERSION,
  id: 'midnight-focus',
  version: '1.0.0',
  name: 'Midnight Focus',
  description: 'Moody late-night coding session under soft cinematic lamplight.',
  tags: ['Focus', 'Cozy', 'Night'],
  supportedPlatforms: ['leetcode', 'codeforces'],
  assets: {
    wallpaper: 'IMAGES/boy_focus.jpg',
    thumbnail: 'thumbnails/boy_focus.webp',
    fallbackColor: '#0b1018',
  },
  tokens: {
    defaultMode: 'dark',
    accentColor: '#60a5fa',
    accentGlow: 'rgba(96, 165, 250, 0.35)',
    surfaces: {
      overlayOpacity: 0.70,
      blur: 0,
      brightness: 100,
      contrast: 100,
      cardGlassOpacity: 0.78,
    },
    typography: {
      fontFamily: 'JetBrains Mono',
    },
  },
  celebration: {
    effectId: 'domain-expansion',
    durationMs: 1980,
  },
  soundProfile: {
    profileId: 'anime-finisher',
    acSoundPath: 'sounds/ac.wav',
    waSoundPath: 'sounds/wa.wav',
  },
  ambientEffect: 'none',
};

export const cyberWorkstationTheme: ThemeDefinition = {
  schemaVersion: THEME_SCHEMA_VERSION,
  id: 'cyber-workstation',
  version: '1.0.0',
  name: 'Cyber Workstation',
  description: 'Modern multi-monitor developer setup with calm ambient glow.',
  tags: ['Desk', 'Aesthetic', 'Purple'],
  supportedPlatforms: ['leetcode', 'codeforces'],
  assets: {
    wallpaper: 'IMAGES/girl_desktop.jpg',
    thumbnail: 'thumbnails/girl_desktop.webp',
    fallbackColor: '#120b18',
  },
  tokens: {
    defaultMode: 'dark',
    accentColor: '#c084fc',
    accentGlow: 'rgba(192, 132, 252, 0.35)',
    surfaces: {
      overlayOpacity: 0.72,
      blur: 0,
      brightness: 100,
      contrast: 100,
      cardGlassOpacity: 0.78,
    },
    typography: {
      fontFamily: 'JetBrains Mono',
    },
  },
  celebration: {
    effectId: 'domain-expansion',
    durationMs: 1980,
  },
  soundProfile: {
    profileId: 'anime-finisher',
    acSoundPath: 'sounds/ac.wav',
    waSoundPath: 'sounds/wa.wav',
  },
  ambientEffect: 'none',
};

export const zenWorkspaceTheme: ThemeDefinition = {
  schemaVersion: THEME_SCHEMA_VERSION,
  id: 'zen-workspace',
  version: '1.0.0',
  name: 'Zen Workspace',
  description: 'Clean minimalist desk with warm afternoon sunlight and foliage.',
  tags: ['Minimal', 'Green', 'Clean'],
  supportedPlatforms: ['leetcode', 'codeforces'],
  assets: {
    wallpaper: 'IMAGES/laptop_desk.jpg',
    thumbnail: 'thumbnails/laptop_desk.webp',
    fallbackColor: '#0a1612',
  },
  tokens: {
    defaultMode: 'glass',
    accentColor: '#34d399',
    accentGlow: 'rgba(52, 211, 153, 0.35)',
    surfaces: {
      overlayOpacity: 0.68,
      blur: 0,
      brightness: 100,
      contrast: 100,
      cardGlassOpacity: 0.78,
    },
    typography: {
      fontFamily: 'JetBrains Mono',
    },
  },
  celebration: {
    effectId: 'domain-expansion',
    durationMs: 1980,
  },
  soundProfile: {
    profileId: 'anime-finisher',
    acSoundPath: 'sounds/ac.wav',
    waSoundPath: 'sounds/wa.wav',
  },
  ambientEffect: 'none',
};

export const goldenDuskTheme: ThemeDefinition = {
  schemaVersion: THEME_SCHEMA_VERSION,
  id: 'golden-dusk',
  version: '1.0.0',
  name: 'Golden Dusk',
  description: 'Breathtaking sunset casting warm amber gradients across the horizon.',
  tags: ['Sunset', 'Warm', 'Sky'],
  supportedPlatforms: ['leetcode', 'codeforces'],
  assets: {
    wallpaper: 'IMAGES/sunset.avif',
    thumbnail: 'thumbnails/sunset.webp',
    fallbackColor: '#1a1309',
  },
  tokens: {
    defaultMode: 'dark',
    accentColor: '#fbbf24',
    accentGlow: 'rgba(251, 191, 36, 0.35)',
    surfaces: {
      overlayOpacity: 0.68,
      blur: 0,
      brightness: 100,
      contrast: 100,
      cardGlassOpacity: 0.78,
    },
    typography: {
      fontFamily: 'JetBrains Mono',
    },
  },
  celebration: {
    effectId: 'domain-expansion',
    durationMs: 1980,
  },
  soundProfile: {
    profileId: 'anime-finisher',
    acSoundPath: 'sounds/ac.wav',
    waSoundPath: 'sounds/wa.wav',
  },
  ambientEffect: 'none',
};

export const velvetHorizonTheme: ThemeDefinition = {
  schemaVersion: THEME_SCHEMA_VERSION,
  id: 'velvet-horizon',
  version: '1.0.0',
  name: 'Velvet Horizon',
  description: 'Dreamy twilight skyline with gentle pastel clouds and quiet evening.',
  tags: ['Twilight', 'Sunset', 'Clouds'],
  supportedPlatforms: ['leetcode', 'codeforces'],
  assets: {
    wallpaper: 'IMAGES/sikera_sunset.jpg',
    thumbnail: 'thumbnails/sikera_sunset.webp',
    fallbackColor: '#180c10',
  },
  tokens: {
    defaultMode: 'dark',
    accentColor: '#f87171',
    accentGlow: 'rgba(248, 113, 113, 0.35)',
    surfaces: {
      overlayOpacity: 0.70,
      blur: 0,
      brightness: 100,
      contrast: 100,
      cardGlassOpacity: 0.78,
    },
    typography: {
      fontFamily: 'JetBrains Mono',
    },
  },
  celebration: {
    effectId: 'domain-expansion',
    durationMs: 1980,
  },
  soundProfile: {
    profileId: 'anime-finisher',
    acSoundPath: 'sounds/ac.wav',
    waSoundPath: 'sounds/wa.wav',
  },
  ambientEffect: 'none',
};

export const mysticHallowTheme: ThemeDefinition = {
  schemaVersion: THEME_SCHEMA_VERSION,
  id: 'mystic-hallow',
  version: '1.0.0',
  name: 'Mystic Hallow',
  description: 'Enchanting nocturnal forest illuminated by warm lantern glow.',
  tags: ['Fantasy', 'Warm', 'Nocturnal'],
  supportedPlatforms: ['leetcode', 'codeforces'],
  assets: {
    wallpaper: 'IMAGES/halloween.jpg',
    thumbnail: 'thumbnails/halloween.webp',
    fallbackColor: '#160d07',
  },
  tokens: {
    defaultMode: 'dark',
    accentColor: '#fb923c',
    accentGlow: 'rgba(251, 146, 60, 0.35)',
    surfaces: {
      overlayOpacity: 0.74,
      blur: 0,
      brightness: 100,
      contrast: 100,
      cardGlassOpacity: 0.78,
    },
    typography: {
      fontFamily: 'JetBrains Mono',
    },
  },
  celebration: {
    effectId: 'domain-expansion',
    durationMs: 1980,
  },
  soundProfile: {
    profileId: 'anime-finisher',
    acSoundPath: 'sounds/ac.wav',
    waSoundPath: 'sounds/wa.wav',
  },
  ambientEffect: 'none',
};

export const BUILTIN_THEMES: ThemeDefinition[] = [
  cosmicVoidTheme,
  neoTokyoTheme,
  midnightFocusTheme,
  cyberWorkstationTheme,
  zenWorkspaceTheme,
  goldenDuskTheme,
  velvetHorizonTheme,
  mysticHallowTheme,
];
