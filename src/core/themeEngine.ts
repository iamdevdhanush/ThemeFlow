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
    if (!this.bgLayer) {
      this.bgLayer = document.getElementById('themeflow-bg-layer');
      if (!this.bgLayer) {
        this.bgLayer = document.createElement('div');
        this.bgLayer.id = 'themeflow-bg-layer';
        document.body.prepend(this.bgLayer);
      }
    }

    if (!this.overlayLayer) {
      this.overlayLayer = document.getElementById('themeflow-overlay-layer');
      if (!this.overlayLayer) {
        this.overlayLayer = document.createElement('div');
        this.overlayLayer.id = 'themeflow-overlay-layer';
        document.body.prepend(this.overlayLayer);
      }
    }

    return { bgLayer: this.bgLayer, overlayLayer: this.overlayLayer };
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

    // Apply standard CSS variables
    root.style.setProperty('--tf-accent', config.accentColor);
    root.style.setProperty('--tf-accent-glow', `${config.accentColor}44`);
    root.style.setProperty('--tf-code-font', `'${config.fontFamily}', Consolas, monospace`);

    // Calculate surface colors
    let overlayColor = `rgba(10, 10, 16, ${config.overlayOpacity})`;
    let cardBg = `rgba(20, 20, 28, ${config.cardGlassOpacity})`;
    let textPrimary = '#f3f4f6';

    if (config.mode === 'midnight') {
      overlayColor = `rgba(0, 0, 0, ${Math.max(0.85, config.overlayOpacity)})`;
      cardBg = `rgba(8, 8, 12, ${Math.max(0.9, config.cardGlassOpacity)})`;
    } else if (config.mode === 'glass') {
      overlayColor = `rgba(15, 15, 25, ${config.overlayOpacity * 0.75})`;
      cardBg = `rgba(22, 22, 34, ${config.cardGlassOpacity * 0.75})`;
    } else if (config.mode === 'light') {
      overlayColor = `rgba(240, 242, 245, ${config.overlayOpacity * 0.9})`;
      cardBg = `rgba(255, 255, 255, ${config.cardGlassOpacity * 0.9})`;
      textPrimary = '#111827';
    }

    root.style.setProperty('--tf-bg-card', cardBg);
    root.style.setProperty('--tf-text-primary', textPrimary);

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
