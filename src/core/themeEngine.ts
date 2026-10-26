import { UserSettings, ThemeConfig, ThemeMode } from '../types/theme';
import { getCustomImageFromDB } from '../storage/storage';
import { EffectManager } from '../effects/particles';

export interface CalculatedSurfaces {
  overlayColor: string;
  panelBg: string;
  panelSecondary: string;
  editorBg: string;
  toolbarBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  link: string;
  border: string;
}

export function computeSurfaceTokens(
  mode: ThemeMode,
  overlayOpacity: number,
  cardGlassOpacity: number
): CalculatedSurfaces {
  let overlayColor = `rgba(10, 10, 16, ${Math.min(0.85, overlayOpacity * 0.7)})`;
  let panelBg = `rgba(18, 18, 26, ${Math.min(0.85, cardGlassOpacity * 0.85)})`;
  let panelSecondary = `rgba(14, 14, 20, ${Math.min(0.90, cardGlassOpacity * 0.90)})`;
  let editorBg = `rgba(12, 12, 18, ${Math.min(0.92, cardGlassOpacity * 0.92)})`;
  let toolbarBg = `rgba(16, 16, 24, ${Math.min(0.85, cardGlassOpacity * 0.85)})`;
  let textPrimary = '#f3f4f6';
  let textSecondary = '#9ca3af';
  let textMuted = '#94a3b8';
  let link = '#7dd3fc';
  let border = 'rgba(255, 255, 255, 0.08)';

  if (mode === 'midnight') {
    overlayColor = `rgba(0, 0, 0, ${Math.max(0.75, overlayOpacity * 0.85)})`;
    panelBg = 'rgba(8, 8, 12, 0.88)';
    panelSecondary = 'rgba(5, 5, 8, 0.92)';
    editorBg = 'rgba(6, 6, 9, 0.94)';
    toolbarBg = 'rgba(9, 9, 13, 0.90)';
    border = 'rgba(255, 255, 255, 0.06)';
  } else if (mode === 'glass') {
    overlayColor = `rgba(12, 12, 20, ${overlayOpacity * 0.5})`;
    panelBg = 'rgba(20, 20, 32, 0.65)';
    panelSecondary = 'rgba(16, 16, 26, 0.72)';
    editorBg = 'rgba(14, 14, 22, 0.78)';
    toolbarBg = 'rgba(18, 18, 28, 0.68)';
    border = 'rgba(255, 255, 255, 0.12)';
  } else if (mode === 'light') {
    overlayColor = `rgba(240, 242, 245, ${overlayOpacity * 0.85})`;
    panelBg = 'rgba(255, 255, 255, 0.88)';
    panelSecondary = 'rgba(248, 249, 251, 0.92)';
    editorBg = 'rgba(255, 255, 255, 0.95)';
    toolbarBg = 'rgba(245, 247, 250, 0.90)';
    textPrimary = '#111827';
    textSecondary = '#4b5563';
    textMuted = '#6b7280';
    link = '#2563eb';
    border = 'rgba(0, 0, 0, 0.08)';
  }

  return {
    overlayColor,
    panelBg,
    panelSecondary,
    editorBg,
    toolbarBg,
    textPrimary,
    textSecondary,
    textMuted,
    link,
    border,
  };
}

export class ThemeEngine {
  private effectManager: EffectManager;
  private bgLayer: HTMLElement | null = null;
  private overlayLayer: HTMLElement | null = null;

  constructor() {
    this.effectManager = new EffectManager();
  }

  public ensureLayers(): { bgLayer: HTMLElement; overlayLayer: HTMLElement } {
    const target = document.body || document.documentElement;

    // Prepend overlay layer first, then background layer so background is lowest in DOM
    if (!this.overlayLayer || !this.overlayLayer.parentNode) {
      this.overlayLayer = document.getElementById('themeflow-overlay-layer');
      if (!this.overlayLayer && target) {
        this.overlayLayer = document.createElement('div');
        this.overlayLayer.id = 'themeflow-overlay-layer';
        this.overlayLayer.setAttribute('aria-hidden', 'true');
        this.overlayLayer.style.pointerEvents = 'none';
        target.prepend(this.overlayLayer);
      }
    }

    if (!this.bgLayer || !this.bgLayer.parentNode) {
      this.bgLayer = document.getElementById('themeflow-bg-layer');
      if (!this.bgLayer && target) {
        this.bgLayer = document.createElement('div');
        this.bgLayer.id = 'themeflow-bg-layer';
        this.bgLayer.setAttribute('aria-hidden', 'true');
        this.bgLayer.style.pointerEvents = 'none';
        target.prepend(this.bgLayer);
      }
    }

    return {
      bgLayer: this.bgLayer || document.createElement('div'),
      overlayLayer: this.overlayLayer || document.createElement('div'),
    };
  }

  public async resolveImageUrl(config: ThemeConfig): Promise<string> {
    if (config.isCustom && config.id) {
      try {
        const dbUrl = await getCustomImageFromDB(config.id);
        if (dbUrl && (dbUrl.startsWith('data:') || dbUrl.startsWith('blob:'))) {
          return dbUrl;
        }
      } catch (err) {
        console.warn('[ThemeFlow] Error resolving custom image from DB:', err);
      }

      if (config.imagePath && (config.imagePath.startsWith('data:') || config.imagePath.startsWith('blob:'))) {
        return config.imagePath;
      }

      console.warn(`[ThemeFlow] Custom wallpaper image record not found for theme "${config.name || config.id}". Falling back to default asset.`);
    }

    let cleanPath = (config.imagePath || '').replace(/^[\\/]+/, '').replace(/^\.\//, '');
    if (!cleanPath || cleanPath.startsWith('custom_') || cleanPath.startsWith('data:') || cleanPath.startsWith('blob:')) {
      cleanPath = 'IMAGES/galaxy.jpg';
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL(cleanPath);
    }
    return '/' + cleanPath;
  }

  public async apply(settings: UserSettings, platformClass: string): Promise<void> {
    const { bgLayer, overlayLayer } = this.ensureLayers();

    if (!settings.enabled) {
      document.documentElement.classList.remove('themeflow-active', platformClass);
      document.body.classList.remove('themeflow-active', platformClass);
      bgLayer.style.display = 'none';
      overlayLayer.style.display = 'none';
      this.effectManager.stop();
      return;
    }

    document.documentElement.classList.add('themeflow-active', platformClass);
    document.body.classList.add('themeflow-active', platformClass);
    bgLayer.style.display = 'block';
    overlayLayer.style.display = 'block';

    const config = settings.currentConfig;
    const root = document.documentElement;

    const surfaces = computeSurfaceTokens(config.mode, config.overlayOpacity, config.cardGlassOpacity);

    // Standard ThemeFlow Custom Properties
    root.style.setProperty('--tf-page-bg', 'transparent');
    root.style.setProperty('--tf-panel-bg', surfaces.panelBg);
    root.style.setProperty('--tf-panel-secondary', surfaces.panelSecondary);
    root.style.setProperty('--tf-editor-bg', surfaces.editorBg);
    root.style.setProperty('--tf-toolbar-bg', surfaces.toolbarBg);
    root.style.setProperty('--tf-text-primary', surfaces.textPrimary);
    root.style.setProperty('--tf-text-secondary', surfaces.textSecondary);
    root.style.setProperty('--tf-text-muted', surfaces.textMuted);
    root.style.setProperty('--tf-link', surfaces.link);
    root.style.setProperty('--tf-border', surfaces.border);
    root.style.setProperty('--tf-accent', config.accentColor);
    root.style.setProperty('--tf-accent-glow', `${config.accentColor}44`);
    root.style.setProperty('--tf-success', '#4ade80');
    root.style.setProperty('--tf-error', '#f87171');
    root.style.setProperty('--tf-code-font', `'${config.fontFamily}', Consolas, monospace`);

    // Backwards compatibility variables
    root.style.setProperty('--tf-bg-card', surfaces.panelBg);
    root.style.setProperty('--tf-border-color', surfaces.border);

    // Apply background image and filters with fallback verification
    const imgUrl = await this.resolveImageUrl(config);
    bgLayer.style.backgroundImage = `url("${imgUrl}")`;
    bgLayer.style.filter = `brightness(${config.brightness}%) contrast(${config.contrast}%) blur(${config.blur}px)`;
    overlayLayer.style.backgroundColor = surfaces.overlayColor;

    // Verify image loading with diagnostic reporting
    const preloader = new Image();
    preloader.onload = () => {
      console.log(`[ThemeFlow] Active wallpaper verified and loaded successfully: ${imgUrl}`);
    };
    preloader.onerror = (e) => {
      console.warn(`[ThemeFlow] Wallpaper failed to load from: "${imgUrl}". Falling back to default Cosmic Void asset. Error:`, e);
      if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        const fallbackUrl = chrome.runtime.getURL('IMAGES/galaxy.jpg');
        bgLayer.style.backgroundImage = `url("${fallbackUrl}")`;
      }
    };
    preloader.src = imgUrl;

    // Visual effect
    this.effectManager.setEffect(config.effect);
  }

  public disable(platformClass: string): void {
    document.documentElement.classList.remove('themeflow-active', platformClass);
    document.body.classList.remove('themeflow-active', platformClass);
    if (this.bgLayer) this.bgLayer.style.display = 'none';
    if (this.overlayLayer) this.overlayLayer.style.display = 'none';
    this.effectManager.stop();
  }

  public destroy(): void {
    this.effectManager.destroy();
    if (this.bgLayer?.parentNode) this.bgLayer.parentNode.removeChild(this.bgLayer);
    if (this.overlayLayer?.parentNode) this.overlayLayer.parentNode.removeChild(this.overlayLayer);
    this.bgLayer = null;
    this.overlayLayer = null;
  }
}
