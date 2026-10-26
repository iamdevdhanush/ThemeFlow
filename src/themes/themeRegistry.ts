import {
  ThemeDefinition,
  UserThemeOverrides,
  THEME_SCHEMA_VERSION,
  SurfaceTokens,
} from '../types/themeSchema';
import { ThemeConfig, ThemePreset, ThemeMode, VisualEffect, CodeFontFamily } from '../types/theme';
import { BUILTIN_THEMES } from './definitions';

export class ThemeRegistry {
  private static instance: ThemeRegistry | null = null;
  private themes = new Map<string, ThemeDefinition>();

  private constructor() {
    for (const theme of BUILTIN_THEMES) {
      this.themes.set(theme.id, theme);
    }
  }

  public static getInstance(): ThemeRegistry {
    if (!ThemeRegistry.instance) {
      ThemeRegistry.instance = new ThemeRegistry();
    }
    return ThemeRegistry.instance;
  }

  public register(theme: ThemeDefinition): void {
    const validation = this.validateThemeDefinition(theme);
    if (!validation.valid) {
      throw new Error(`Invalid theme definition "${theme?.id}": ${validation.errors.join(', ')}`);
    }
    this.themes.set(theme.id, theme);
  }

  public get(id: string): ThemeDefinition | undefined {
    return this.themes.get(id);
  }

  public getDefault(): ThemeDefinition {
    const first = BUILTIN_THEMES[0];
    return this.themes.get(first.id) || first;
  }

  public getAll(): ThemeDefinition[] {
    return Array.from(this.themes.values());
  }

  public has(id: string): boolean {
    return this.themes.has(id);
  }

  /**
   * Transforms a ThemeDefinition into a ThemeConfig, applying any optional user overrides.
   */
  public definitionToConfig(
    def: ThemeDefinition,
    overrides?: UserThemeOverrides,
    extraProps?: { soundEnabled?: boolean; soundVolume?: number; confettiEnabled?: boolean }
  ): ThemeConfig {
    const surfaces = def.tokens.surfaces;
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      imagePath: def.assets.wallpaper,
      thumbnailPath: def.assets.thumbnail,
      accentColor: overrides?.accentColor ?? def.tokens.accentColor,
      mode: overrides?.mode ?? def.tokens.defaultMode,
      overlayOpacity: overrides?.overlayOpacity ?? surfaces.overlayOpacity,
      blur: overrides?.blur ?? surfaces.blur,
      brightness: overrides?.brightness ?? surfaces.brightness,
      contrast: overrides?.contrast ?? surfaces.contrast,
      cardGlassOpacity: overrides?.cardGlassOpacity ?? surfaces.cardGlassOpacity,
      fontFamily: overrides?.fontFamily ?? def.tokens.typography.fontFamily,
      effect: overrides?.ambientEffect ?? def.ambientEffect ?? 'none',
      soundEnabled: extraProps?.soundEnabled ?? false,
      soundVolume: extraProps?.soundVolume ?? 0.7,
      confettiEnabled: extraProps?.confettiEnabled ?? true,
      isCustom: false,
    };
  }

  /**
   * Resolves the active ThemeConfig from a theme ID, user overrides, and optional custom uploaded themes.
   */
  public resolveConfig(
    themeId: string,
    overrides?: UserThemeOverrides,
    customThemes?: ThemeConfig[],
    extraProps?: { soundEnabled?: boolean; soundVolume?: number; confettiEnabled?: boolean }
  ): ThemeConfig {
    // 1. Check custom user-uploaded themes first
    if (customThemes && customThemes.length > 0) {
      const custom = customThemes.find((c) => c.id === themeId);
      if (custom) {
        return {
          ...custom,
          accentColor: overrides?.accentColor ?? custom.accentColor,
          mode: overrides?.mode ?? custom.mode,
          overlayOpacity: overrides?.overlayOpacity ?? custom.overlayOpacity,
          blur: overrides?.blur ?? custom.blur,
          brightness: overrides?.brightness ?? custom.brightness,
          contrast: overrides?.contrast ?? custom.contrast,
          cardGlassOpacity: overrides?.cardGlassOpacity ?? custom.cardGlassOpacity,
          fontFamily: overrides?.fontFamily ?? custom.fontFamily,
          effect: overrides?.ambientEffect ?? custom.effect,
          soundEnabled: extraProps?.soundEnabled ?? custom.soundEnabled ?? false,
          soundVolume: extraProps?.soundVolume ?? custom.soundVolume ?? 0.7,
          confettiEnabled: extraProps?.confettiEnabled ?? custom.confettiEnabled ?? true,
        };
      }
    }

    // 2. Resolve registered built-in theme or fall back to default
    const def = this.get(themeId) || this.getDefault();
    return this.definitionToConfig(def, overrides, extraProps);
  }

  /**
   * Converts a ThemeDefinition into legacy ThemePreset for full backward compatibility
   */
  public toLegacyPreset(def: ThemeDefinition): ThemePreset {
    const filename = def.assets.wallpaper.replace(/^IMAGES\//, '').replace(/^images\//, '');
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      filename,
      thumbnail: def.assets.thumbnail,
      accentColor: def.tokens.accentColor,
      defaultMode: def.tokens.defaultMode,
      defaultOverlay: def.tokens.surfaces.overlayOpacity,
      defaultBlur: def.tokens.surfaces.blur,
      tags: def.tags ? [...def.tags] : undefined,
    };
  }

  /**
   * Strictly validates a theme definition to ensure no code injection, missing fields, or invalid values
   */
  public validateThemeDefinition(theme: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!theme || typeof theme !== 'object') {
      return { valid: false, errors: ['Theme definition must be a non-null object'] };
    }

    const t = theme as Record<string, any>;

    if (t.schemaVersion !== THEME_SCHEMA_VERSION) {
      errors.push(`Invalid or missing schemaVersion: expected "${THEME_SCHEMA_VERSION}", received "${t.schemaVersion}"`);
    }

    if (typeof t.id !== 'string' || !/^[a-z0-9-]+$/.test(t.id)) {
      errors.push(`Invalid theme id "${t.id}": must be non-empty kebab-case (a-z, 0-9, -)`);
    }

    if (typeof t.name !== 'string' || t.name.trim().length === 0) {
      errors.push('Theme name must be a non-empty string');
    }

    if (!Array.isArray(t.supportedPlatforms) || t.supportedPlatforms.length === 0) {
      errors.push('supportedPlatforms must be a non-empty array');
    }

    if (!t.assets || typeof t.assets !== 'object') {
      errors.push('assets must be an object');
    } else {
      if (typeof t.assets.wallpaper !== 'string' || t.assets.wallpaper.trim().length === 0) {
        errors.push('assets.wallpaper must be a non-empty string path');
      }
      if (typeof t.assets.thumbnail !== 'string' || t.assets.thumbnail.trim().length === 0) {
        errors.push('assets.thumbnail must be a non-empty string path');
      }
    }

    if (!t.tokens || typeof t.tokens !== 'object') {
      errors.push('tokens must be an object');
    } else {
      const validModes: ThemeMode[] = ['dark', 'midnight', 'glass', 'light'];
      if (!validModes.includes(t.tokens.defaultMode)) {
        errors.push(`tokens.defaultMode must be one of: ${validModes.join(', ')}`);
      }

      if (typeof t.tokens.accentColor !== 'string' || !t.tokens.accentColor.startsWith('#')) {
        errors.push('tokens.accentColor must be a valid hex color string');
      }

      const surfaces = t.tokens.surfaces;
      if (!surfaces || typeof surfaces !== 'object') {
        errors.push('tokens.surfaces must be an object');
      } else {
        if (typeof surfaces.overlayOpacity !== 'number' || surfaces.overlayOpacity < 0 || surfaces.overlayOpacity > 1) {
          errors.push('tokens.surfaces.overlayOpacity must be a number between 0.0 and 1.0');
        }
        if (typeof surfaces.blur !== 'number' || surfaces.blur < 0 || surfaces.blur > 20) {
          errors.push('tokens.surfaces.blur must be a number between 0 and 20');
        }
        if (typeof surfaces.brightness !== 'number' || surfaces.brightness < 50 || surfaces.brightness > 130) {
          errors.push('tokens.surfaces.brightness must be a number between 50 and 130');
        }
        if (typeof surfaces.contrast !== 'number' || surfaces.contrast < 80 || surfaces.contrast > 130) {
          errors.push('tokens.surfaces.contrast must be a number between 80 and 130');
        }
        if (typeof surfaces.cardGlassOpacity !== 'number' || surfaces.cardGlassOpacity < 0.2 || surfaces.cardGlassOpacity > 1) {
          errors.push('tokens.surfaces.cardGlassOpacity must be a number between 0.2 and 1.0');
        }
      }

      const typography = t.tokens.typography;
      if (!typography || typeof typography !== 'object') {
        errors.push('tokens.typography must be an object');
      } else {
        const validFonts: CodeFontFamily[] = ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'];
        if (!validFonts.includes(typography.fontFamily)) {
          errors.push(`tokens.typography.fontFamily must be one of: ${validFonts.join(', ')}`);
        }
      }
    }

    if (t.ambientEffect) {
      const validEffects: VisualEffect[] = ['none', 'sakura', 'rain', 'stars'];
      if (!validEffects.includes(t.ambientEffect)) {
        errors.push(`ambientEffect must be one of: ${validEffects.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const themeRegistry = ThemeRegistry.getInstance();
