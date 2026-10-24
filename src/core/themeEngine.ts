import { UserSettings, ThemeConfig } from '../types/theme';
import { getCustomImageFromDB } from '../storage/storage';
import { EffectManager } from '../effects/particles';

export class ThemeEngine {
  private effectManager: EffectManager;
  private bgLayer: HTMLElement | null = null;
  private overlayLayer: HTMLElement | null = null;

  constructor() {
    this.effectManager = new EffectManager();
  }

  private ensureLayers(): { bgLayer: HTMLElement; overlayLayer: HTMLElement } {
    const target = document.body || document.documentElement;

    if (!this.bgLayer) {
      this.bgLayer = document.getElementById('themeflow-bg-layer');
      if (!this.bgLayer && target) {
        this.bgLayer = document.createElement('div');
        this.bgLayer.id = 'themeflow-bg-layer';
        target.prepend(this.bgLayer);
      }
    }

    if (!this.overlayLayer) {
      this.overlayLayer = document.getElementById('themeflow-overlay-layer');
      if (!this.overlayLayer && target) {
        this.overlayLayer = document.createElement('div');
        this.overlayLayer.id = 'themeflow-overlay-layer';
        target.prepend(this.overlayLayer);
      }
    }

    return {
      bgLayer: this.bgLayer || document.createElement('div'),
      overlayLayer: this.overlayLayer || document.createElement('div'),
    };
  }

  public async resolveImageUrl(config: ThemeConfig): Promise<string> {
    if (config.isCustom && config.id) {
      const dbUrl = await getCustomImageFromDB(config.id);
      if (dbUrl) return dbUrl;
      if (config.imagePath.startsWith('data:')) return config.imagePath;
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL(config.imagePath);
    }
    return config.imagePath.startsWith('/') ? config.imagePath : '/' + config.imagePath;
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

    // Calculate coordinated surface colors based on user mode and overlay settings
    let overlayColor = `rgba(10, 10, 16, ${config.overlayOpacity})`;
    let panelBg = `rgba(20, 20, 28, ${config.cardGlassOpacity})`;
    let panelSecondary = `rgba(15, 15, 22, ${Math.min(0.95, config.cardGlassOpacity + 0.08)})`;
    let editorBg = `rgba(13, 13, 19, ${Math.max(0.88, config.cardGlassOpacity)})`;
    let toolbarBg = `rgba(18, 18, 25, ${config.cardGlassOpacity})`;
    let textPrimary = '#f3f4f6';
    let textSecondary = '#9ca3af';
    let border = 'rgba(255, 255, 255, 0.08)';

    if (config.mode === 'midnight') {
      overlayColor = `rgba(0, 0, 0, ${Math.max(0.85, config.overlayOpacity)})`;
      panelBg = `rgba(8, 8, 12, ${Math.max(0.9, config.cardGlassOpacity)})`;
      panelSecondary = `rgba(5, 5, 8, ${Math.max(0.94, config.cardGlassOpacity)})`;
      editorBg = `rgba(6, 6, 9, 0.96)`;
      toolbarBg = `rgba(9, 9, 13, 0.94)`;
      border = 'rgba(255, 255, 255, 0.06)';
    } else if (config.mode === 'glass') {
      overlayColor = `rgba(15, 15, 25, ${config.overlayOpacity * 0.75})`;
      panelBg = `rgba(22, 22, 34, ${config.cardGlassOpacity * 0.75})`;
      panelSecondary = `rgba(18, 18, 28, ${config.cardGlassOpacity * 0.8})`;
      editorBg = `rgba(14, 14, 22, ${Math.max(0.82, config.cardGlassOpacity * 0.85)})`;
      toolbarBg = `rgba(20, 20, 30, ${config.cardGlassOpacity * 0.75})`;
      border = 'rgba(255, 255, 255, 0.12)';
    } else if (config.mode === 'light') {
      overlayColor = `rgba(240, 242, 245, ${config.overlayOpacity * 0.9})`;
      panelBg = `rgba(255, 255, 255, ${config.cardGlassOpacity * 0.9})`;
      panelSecondary = `rgba(248, 249, 251, 0.95)`;
      editorBg = `rgba(255, 255, 255, 0.96)`;
      toolbarBg = `rgba(245, 247, 250, 0.92)`;
      textPrimary = '#111827';
      textSecondary = '#4b5563';
      border = 'rgba(0, 0, 0, 0.08)';
    }

    // Standard ThemeFlow Custom Properties (Section 4 Specification)
    root.style.setProperty('--tf-page-bg', 'transparent');
    root.style.setProperty('--tf-panel-bg', panelBg);
    root.style.setProperty('--tf-panel-secondary', panelSecondary);
    root.style.setProperty('--tf-editor-bg', editorBg);
    root.style.setProperty('--tf-toolbar-bg', toolbarBg);
    root.style.setProperty('--tf-text-primary', textPrimary);
    root.style.setProperty('--tf-text-secondary', textSecondary);
    root.style.setProperty('--tf-border', border);
    root.style.setProperty('--tf-accent', config.accentColor);
    root.style.setProperty('--tf-accent-glow', `${config.accentColor}44`);
    root.style.setProperty('--tf-success', '#4ade80');
    root.style.setProperty('--tf-error', '#f87171');
    root.style.setProperty('--tf-code-font', `'${config.fontFamily}', Consolas, monospace`);

    // Backwards compatibility variables
    root.style.setProperty('--tf-bg-card', panelBg);
    root.style.setProperty('--tf-border-color', border);

    // Apply background image and filters
    const imgUrl = await this.resolveImageUrl(config);
    bgLayer.style.backgroundImage = `url("${imgUrl}")`;
    bgLayer.style.filter = `brightness(${config.brightness}%) contrast(${config.contrast}%) blur(${config.blur}px)`;
    overlayLayer.style.backgroundColor = overlayColor;

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
