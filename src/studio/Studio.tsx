import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Sliders,
  Check,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Code2,
  Monitor,
  Moon,
  Sun,
  Eye,
  Layers,
  Copy,
  ChevronDown,
  Palette,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  Droplets,
  CloudRain,
  Star,
  Zap,
} from 'lucide-react';
import {
  UserSettings,
  ThemeConfig,
  VisualEffect,
  CodeFontFamily,
} from '../types/theme';
import {
  THEME_PRESETS,
  DEFAULT_USER_SETTINGS,
  presetToConfig,
} from '../themes/presets';
import {
  getSettings,
  saveSettings,
  saveCustomImageToDB,
  getCustomImageFromDB,
  deleteCustomImageFromDB,
} from '../storage/storage';
import { playAcceptedSound, playRejectedSound } from '../audio/soundPlayer';
import { fireAcceptedCelebration, stopAcceptedCelebration } from '../effects/celebration';
import { EffectManager } from '../effects/particles';
import { computeSurfaceTokens } from '../core/themeEngine';
import './Studio.css';

interface AccentColorOption {
  name: string;
  hex: string;
}

const ACCENT_COLORS: AccentColorOption[] = [
  { name: 'Lavender Violet', hex: '#a78bfa' },
  { name: 'Sky Cyan', hex: '#38bdf8' },
  { name: 'Emerald Mint', hex: '#34d399' },
  { name: 'Sakura Pink', hex: '#f472b6' },
  { name: 'Golden Amber', hex: '#fbbf24' },
  { name: 'Coral Red', hex: '#f87171' },
  { name: 'Cyber Purple', hex: '#c084fc' },
  { name: 'Indigo Pulse', hex: '#818cf8' },
];

interface ToastState {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

export const Studio: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [previewBgUrl, setPreviewBgUrl] = useState<string>('');
  const [previewPlatform, setPreviewPlatform] = useState<'leetcode' | 'codeforces'>('leetcode');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const effectManagerRef = useRef<EffectManager | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ id: Date.now(), text, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  useEffect(() => {
    getSettings().then((loaded) => {
      setSettings(loaded);
      setLoading(false);
    });

    effectManagerRef.current = new EffectManager();
    return () => {
      stopAcceptedCelebration();
      effectManagerRef.current?.destroy();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const config = settings.currentConfig;

  // Resolve background image whenever config changes
  useEffect(() => {
    let active = true;
    async function updateBg() {
      if (config.isCustom && config.id) {
        try {
          const dbUrl = await getCustomImageFromDB(config.id);
          if (active && dbUrl) {
            setPreviewBgUrl(dbUrl);
            return;
          }
        } catch (err) {
          console.warn('[ThemeFlow Studio] Failed to fetch custom image from DB:', err);
        }
      }
      if (active) {
        const cleanPath = (config.imagePath || '').replace(/^[\\/]+/, '').replace(/^\.\//, '') || 'IMAGES/galaxy.jpg';
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          setPreviewBgUrl(chrome.runtime.getURL(cleanPath));
        } else {
          setPreviewBgUrl('/' + cleanPath);
        }
      }
    }
    updateBg();
    return () => {
      active = false;
    };
  }, [config.imagePath, config.isCustom, config.id]);

  // Update visual ambient effect
  useEffect(() => {
    if (effectManagerRef.current) {
      effectManagerRef.current.setEffect(config.effect);
    }
  }, [config.effect]);

  const updateConfig = async (partial: Partial<ThemeConfig>) => {
    const updatedConfig: ThemeConfig = {
      ...config,
      ...partial,
    };
    const updatedSettings: UserSettings = {
      ...settings,
      currentConfig: updatedConfig,
    };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  const createThumbnail = (dataUrl: string, maxWidth = 360, maxHeight = 200): Promise<string> => {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        return resolve(dataUrl);
      }
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const thumb = canvas.toDataURL('image/webp', 0.8) || canvas.toDataURL('image/jpeg', 0.8);
            resolve(thumb || dataUrl);
            return;
          }
        } catch {
          // Fallback if canvas is tainted or unsupported
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleSelectPreset = async (presetId: string) => {
    // 1. Built-in presets
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const newConfig = presetToConfig(preset);
      const updatedSettings: UserSettings = {
        ...settings,
        activeThemeId: preset.id,
        currentConfig: newConfig,
      };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
      return;
    }

    // 2. Custom themes
    const custom = (settings.customThemes || []).find((c) => c.id === presetId);
    if (custom) {
      const updatedSettings: UserSettings = {
        ...settings,
        activeThemeId: custom.id,
        currentConfig: { ...custom },
      };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
    }
  };

  const handleDeleteCustomTheme = async (customId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this custom wallpaper?')) {
      return;
    }

    try {
      await deleteCustomImageFromDB(customId);
      const updatedCustom = (settings.customThemes || []).filter((c) => c.id !== customId);

      let nextActiveId = settings.activeThemeId;
      let nextConfig = settings.currentConfig;

      if (settings.activeThemeId === customId) {
        const defaultPreset = THEME_PRESETS[0]; // cosmic-void
        nextActiveId = defaultPreset.id;
        nextConfig = presetToConfig(defaultPreset);
      }

      const updatedSettings: UserSettings = {
        ...settings,
        activeThemeId: nextActiveId,
        customThemes: updatedCustom,
        currentConfig: nextConfig,
      };

      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
      showToast('Custom wallpaper deleted', 'info');
    } catch (err: any) {
      showToast('Failed to delete custom wallpaper: ' + (err?.message || 'Error'), 'error');
    }
  };

  const processUploadedFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];
    if (!file.type.startsWith('image/') && !validTypes.includes(file.type)) {
      showToast('Please upload a valid image file (PNG, JPG, WebP, AVIF).', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size exceeds 10MB limit. Please upload an image under 10MB.', 'error');
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });

      const thumbnailDataUrl = await createThumbnail(dataUrl, 360, 200);
      const customId = `custom_${Date.now()}`;
      await saveCustomImageToDB(customId, dataUrl);

      const customName = file.name.replace(/\.[^/.]+$/, '').slice(0, 24) || 'Custom Wallpaper';

      const customConfig: ThemeConfig = {
        ...config,
        id: customId,
        name: customName,
        description: 'User uploaded custom background wallpaper.',
        imagePath: dataUrl,
        thumbnailPath: thumbnailDataUrl,
        isCustom: true,
      };

      const updatedCustomThemes = [customConfig, ...(settings.customThemes || []).filter((c) => c.id !== customId)];

      const updatedSettings: UserSettings = {
        ...settings,
        activeThemeId: customId,
        customThemes: updatedCustomThemes,
        currentConfig: customConfig,
      };

      setSettings(updatedSettings);
      setPreviewBgUrl(dataUrl);
      await saveSettings(updatedSettings);
      showToast(`Custom wallpaper "${customName}" activated!`, 'success');
    } catch (err: any) {
      console.error('[ThemeFlow] Custom upload error:', err);
      showToast('Failed to upload custom wallpaper: ' + (err?.message || 'Unknown error'), 'error');
    }
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processUploadedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset ThemeFlow to default settings?')) {
      setSettings(DEFAULT_USER_SETTINGS);
      await saveSettings(DEFAULT_USER_SETTINGS);
      showToast('ThemeFlow reset to factory defaults', 'info');
    }
  };

  const handleToggleExtension = async () => {
    const nextEnabled = !settings.enabled;
    const updated: UserSettings = {
      ...settings,
      enabled: nextEnabled,
    };
    setSettings(updated);
    await saveSettings(updated);
    showToast(nextEnabled ? 'ThemeFlow enabled on LeetCode & Codeforces' : 'ThemeFlow disabled on platforms', 'info');
  };

  const handleSimulateAc = (e?: React.MouseEvent<HTMLElement>) => {
    const badge = (document.querySelector('.lc-status-solved') || document.querySelector('.cf-rating-badge')) as HTMLElement | null;
    const previewArea = document.querySelector('.preview-workbench') as HTMLElement | null;
    const anchor = badge || previewArea || e?.currentTarget || null;

    if (config.confettiEnabled) {
      fireAcceptedCelebration({
        anchorElement: anchor,
        themeAccent: config.accentColor,
        verdictText: 'ACCEPTED',
      });
    }
    playAcceptedSound(config.soundVolume, true);
    showToast('Simulating Accepted Celebration!', 'success');
  };

  const handleSimulateWa = () => {
    playRejectedSound(config.soundVolume, true);
    showToast('Playing Wrong Answer audio cue', 'info');
  };

  const handleCopySample = () => {
    const textToCopy = previewPlatform === 'leetcode' ? '[2,7,11,15]\n9' : '2\n3 2\n4 4';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast('Sample copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="studio-loading-view" role="status" aria-live="polite">
        <div className="studio-loading-spinner" />
        <p>Loading ThemeFlow Studio...</p>
      </div>
    );
  }

  // Calculate coordinated surface values for live preview using shared theme engine logic
  const previewSurfaces = computeSurfaceTokens(config.mode, config.overlayOpacity, config.cardGlassOpacity);
  const previewOverlayColor = previewSurfaces.overlayColor;
  const previewCardBg = previewSurfaces.panelBg;
  const previewCardBorder = previewSurfaces.border;
  const previewTextPrimary = previewSurfaces.textPrimary;

  return (
    <div className="studio-container">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`studio-toast studio-toast-${toast.type}`} role="alert">
          {toast.type === 'success' && <CheckCircle2 size={14} className="toast-icon" />}
          {toast.type === 'error' && <AlertCircle size={14} className="toast-icon" />}
          {toast.type === 'info' && <Info size={14} className="toast-icon" />}
          <span className="toast-text">{toast.text}</span>
        </div>
      )}

      {/* Refined Minimalist Header */}
      <header className="studio-header">
        <div className="header-brand">
          <div className="studio-logo" aria-hidden="true">
            <Sparkles size={16} />
          </div>
          <div className="studio-title-group">
            <div className="studio-brand-line">
              <span className="brand-name">ThemeFlow</span>
              <span className="studio-tag">Studio</span>
            </div>
            <p className="brand-subtitle">Developer workspace personalization for competitive programmers</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Extension Active Status & Master Switch */}
          <button
            type="button"
            className={`status-badge-btn ${settings.enabled ? 'is-enabled' : 'is-disabled'}`}
            onClick={handleToggleExtension}
            title={settings.enabled ? 'ThemeFlow is active on platforms. Click to disable.' : 'ThemeFlow is disabled. Click to enable.'}
            aria-pressed={settings.enabled}
          >
            <span className="status-dot" aria-hidden="true" />
            <span className="status-text">{settings.enabled ? 'Active on Platforms' : 'Extension Disabled'}</span>
          </button>

          <div className="header-divider" aria-hidden="true" />

          <button
            type="button"
            className="btn-header-secondary"
            onClick={handleResetDefaults}
            title="Reset all settings to default values"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          <a
            href="https://leetcode.com/problemset/"
            target="_blank"
            rel="noreferrer"
            className="btn-header-link lc-link"
            title="Open LeetCode problemset in new tab"
          >
            <span>LeetCode</span>
            <ExternalLink size={12} />
          </a>

          <a
            href="https://codeforces.com"
            target="_blank"
            rel="noreferrer"
            className="btn-header-link cf-link"
            title="Open Codeforces in new tab"
          >
            <span>Codeforces</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </header>

      {/* Main Studio Two-Pane Layout */}
      <div className="studio-layout">
        {/* Left Control Sidebar */}
        <aside className="studio-sidebar" aria-label="Theme Customization Controls">
          
          {/* SECTION 1: ATMOSPHERE */}
          <section className="sidebar-section">
            <div className="section-heading">
              <div className="heading-title-group">
                <Layers size={14} className="heading-icon" />
                <span>Atmosphere Presets</span>
              </div>
              <span className="section-badge">{THEME_PRESETS.length + (settings.customThemes?.length || 0)}</span>
            </div>

            {/* Consistent Two-Column Theme Gallery */}
            <div className="wallpaper-grid" role="radiogroup" aria-label="Theme Presets">
              {THEME_PRESETS.map((preset) => {
                const isActive = settings.activeThemeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`wallpaper-card ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset.id)}
                    title={`Select ${preset.name} theme`}
                  >
                    <div className="wallpaper-thumb-box">
                      <img src={preset.thumbnail} alt="" loading="lazy" />
                      <div className="wallpaper-gradient-scrim" />
                      {isActive && (
                        <div className="wallpaper-active-pill" aria-hidden="true">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="wallpaper-meta">
                      <span className="wallpaper-name" title={preset.name}>{preset.name}</span>
                      <span className="wallpaper-mode-tag">{preset.defaultMode}</span>
                    </div>
                  </button>
                );
              })}

              {/* User Uploaded Custom Wallpapers */}
              {(settings.customThemes || []).map((custom) => {
                const isActive = settings.activeThemeId === custom.id;
                return (
                  <button
                    key={custom.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`wallpaper-card custom-card ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(custom.id)}
                    title={`Select custom theme "${custom.name}"`}
                  >
                    <div className="wallpaper-thumb-box">
                      <img src={custom.thumbnailPath || custom.imagePath} alt="" loading="lazy" />
                      <div className="wallpaper-gradient-scrim" />
                      {isActive && (
                        <div className="wallpaper-active-pill" aria-hidden="true">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                      <button
                        type="button"
                        className="wallpaper-delete-btn"
                        onClick={(e) => handleDeleteCustomTheme(custom.id, e)}
                        title="Delete custom wallpaper"
                        aria-label={`Delete custom wallpaper ${custom.name}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="wallpaper-meta">
                      <span className="wallpaper-name" title={custom.name}>{custom.name}</span>
                      <span className="wallpaper-mode-tag custom-tag">Custom</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Wallpaper Upload Card with Drag & Drop */}
            <div
              className={`upload-card ${isDragging ? 'is-dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              title="Click or drag an image here to upload a custom wallpaper"
            >
              <div className="upload-icon-wrap" aria-hidden="true">
                <Upload size={15} />
              </div>
              <div className="upload-copy">
                <span className="upload-title">
                  {isDragging ? 'Drop Image to Upload' : 'Upload Custom Wallpaper'}
                </span>
                <span className="upload-hint">PNG, JPG, WebP, AVIF • Up to 10MB</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCustomUpload}
              />
            </div>
          </section>

          {/* SECTION 2: APPEARANCE */}
          <section className="sidebar-section">
            <div className="section-heading">
              <div className="heading-title-group">
                <Monitor size={14} className="heading-icon" />
                <span>Surface &amp; Lighting</span>
              </div>
            </div>

            {/* Surface Mode Segmented Selector */}
            <div className="control-group">
              <span className="control-group-title">Surface Mode</span>
              <div className="mode-selector" role="radiogroup" aria-label="Surface Mode">
                <button
                  type="button"
                  role="radio"
                  aria-checked={config.mode === 'dark'}
                  className={`mode-btn ${config.mode === 'dark' ? 'active' : ''}`}
                  onClick={() => updateConfig({ mode: 'dark' })}
                  title="Deep Dark: Balanced obsidian panels with refined transparency"
                >
                  <Moon size={13} />
                  <span>Deep Dark</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={config.mode === 'midnight'}
                  className={`mode-btn ${config.mode === 'midnight' ? 'active' : ''}`}
                  onClick={() => updateConfig({ mode: 'midnight' })}
                  title="OLED Black: High contrast pitch black surfaces"
                >
                  <Moon size={13} className="oled-icon" />
                  <span>OLED Black</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={config.mode === 'glass'}
                  className={`mode-btn ${config.mode === 'glass' ? 'active' : ''}`}
                  onClick={() => updateConfig({ mode: 'glass' })}
                  title="Frosted: Semi-translucent glass effect"
                >
                  <Eye size={13} />
                  <span>Frosted</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={config.mode === 'light'}
                  className={`mode-btn ${config.mode === 'light' ? 'active' : ''}`}
                  onClick={() => updateConfig({ mode: 'light' })}
                  title="Classic Tint: Daylight editorial appearance"
                >
                  <Sun size={13} />
                  <span>Classic Tint</span>
                </button>
              </div>
            </div>

            {/* Overlay Darkness Slider */}
            <div className="control-row">
              <div className="control-label-row">
                <span className="control-label">Overlay Darkness</span>
                <span className="control-val mono">{Math.round(config.overlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0.1"
                max="0.95"
                step="0.01"
                value={config.overlayOpacity}
                onChange={(e) => updateConfig({ overlayOpacity: parseFloat(e.target.value) })}
                style={{
                  background: `linear-gradient(to right, var(--tf-accent) 0%, var(--tf-accent) ${
                    ((config.overlayOpacity - 0.1) / 0.85) * 100
                  }%, rgba(255, 255, 255, 0.08) ${((config.overlayOpacity - 0.1) / 0.85) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                }}
                aria-label="Overlay darkness percentage"
              />
            </div>

            {/* Panel Glass Opacity */}
            <div className="control-row">
              <div className="control-label-row">
                <span className="control-label">Panel Opacity</span>
                <span className="control-val mono">{Math.round(config.cardGlassOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0.3"
                max="0.98"
                step="0.02"
                value={config.cardGlassOpacity}
                onChange={(e) => updateConfig({ cardGlassOpacity: parseFloat(e.target.value) })}
                style={{
                  background: `linear-gradient(to right, var(--tf-accent) 0%, var(--tf-accent) ${
                    ((config.cardGlassOpacity - 0.3) / 0.68) * 100
                  }%, rgba(255, 255, 255, 0.08) ${((config.cardGlassOpacity - 0.3) / 0.68) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                }}
                aria-label="Panel glass opacity percentage"
              />
            </div>

            {/* Accent Color Palette */}
            <div className="control-group">
              <div className="control-label-row">
                <span className="control-label">Accent Theme Color</span>
                <span className="control-val mono">{config.accentColor.toUpperCase()}</span>
              </div>
              <div className="color-presets-row" role="radiogroup" aria-label="Accent Color">
                {ACCENT_COLORS.map((col) => {
                  const isSelected = config.accentColor.toLowerCase() === col.hex.toLowerCase();
                  return (
                    <button
                      key={col.hex}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`color-swatch ${isSelected ? 'active' : ''}`}
                      style={{ backgroundColor: col.hex }}
                      onClick={() => updateConfig({ accentColor: col.hex })}
                      aria-label={`${col.name}: ${col.hex}`}
                      title={`${col.name} (${col.hex})`}
                    />
                  );
                })}
                <label className="custom-color-picker" title="Pick custom HEX color">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => updateConfig({ accentColor: e.target.value })}
                    aria-label="Custom accent color input"
                  />
                  <Palette size={13} />
                </label>
              </div>
            </div>
          </section>

          {/* SECTION 3: FOCUS & MOTION */}
          <section className="sidebar-section">
            <div className="section-heading">
              <div className="heading-title-group">
                <Sliders size={14} className="heading-icon" />
                <span>Focus &amp; Visuals</span>
              </div>
            </div>

            {/* Background Blur */}
            <div className="control-row">
              <div className="control-label-row">
                <span className="control-label">Wallpaper Blur</span>
                <span className="control-val mono">{config.blur}px</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0"
                max="20"
                step="1"
                value={config.blur}
                onChange={(e) => updateConfig({ blur: parseInt(e.target.value, 10) })}
                style={{
                  background: `linear-gradient(to right, var(--tf-accent) 0%, var(--tf-accent) ${
                    (config.blur / 20) * 100
                  }%, rgba(255, 255, 255, 0.08) ${(config.blur / 20) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                }}
                aria-label="Wallpaper blur in pixels"
              />
            </div>

            {/* Brightness */}
            <div className="control-row">
              <div className="control-label-row">
                <span className="control-label">Wallpaper Brightness</span>
                <span className="control-val mono">{config.brightness}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="40"
                max="130"
                step="5"
                value={config.brightness}
                onChange={(e) => updateConfig({ brightness: parseInt(e.target.value, 10) })}
                style={{
                  background: `linear-gradient(to right, var(--tf-accent) 0%, var(--tf-accent) ${
                    ((config.brightness - 40) / 90) * 100
                  }%, rgba(255, 255, 255, 0.08) ${((config.brightness - 40) / 90) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                }}
                aria-label="Wallpaper brightness percentage"
              />
            </div>

            {/* Visual Ambient Effect */}
            <div className="control-row">
              <div className="control-label-row">
                <span className="control-label">Ambient Atmosphere Effect</span>
              </div>
              <div className="select-wrap">
                <select
                  className="select-input"
                  value={config.effect}
                  onChange={(e) => updateConfig({ effect: e.target.value as VisualEffect })}
                  aria-label="Visual Ambient Effect"
                >
                  <option value="none">None (Clean &amp; Minimal)</option>
                  <option value="sakura">Gentle Sakura Petals</option>
                  <option value="rain">Subtle Raindrops</option>
                  <option value="stars">Twinkling Night Stars</option>
                </select>
                <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
              </div>
            </div>

            {/* Acceptance Celebration Toggle Switch */}
            <div className="toggle-control-item">
              <div className="toggle-copy">
                <span className="toggle-title">Anime Impact Celebration</span>
                <span className="toggle-desc">Speed-line energy slash &amp; victory badge on Accepted</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.confettiEnabled}
                className={`switch-toggle ${config.confettiEnabled ? 'checked' : ''}`}
                onClick={() => updateConfig({ confettiEnabled: !config.confettiEnabled })}
                title="Toggle celebration on Accepted submission"
              >
                <span className="switch-thumb" />
              </button>
            </div>
          </section>

          {/* SECTION 4: ADVANCED SETTINGS (Expandable Disclosure) */}
          <section className="sidebar-section advanced-section">
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              aria-expanded={advancedOpen}
            >
              <div className="advanced-toggle-label">
                <Code2 size={14} className="heading-icon" />
                <span>Advanced &amp; Audio Settings</span>
              </div>
              <ChevronDown
                size={14}
                className={`advanced-chevron ${advancedOpen ? 'rotated' : ''}`}
                aria-hidden="true"
              />
            </button>

            {advancedOpen && (
              <div className="advanced-drawer">
                {/* Code Font */}
                <div className="control-row">
                  <div className="control-label-row">
                    <span className="control-label">Code Editor Font</span>
                  </div>
                  <div className="select-wrap">
                    <select
                      className="select-input"
                      value={config.fontFamily}
                      onChange={(e) => updateConfig({ fontFamily: e.target.value as CodeFontFamily })}
                      aria-label="Code Editor Font Family"
                    >
                      <option value="JetBrains Mono">JetBrains Mono</option>
                      <option value="Fira Code">Fira Code</option>
                      <option value="Consolas">Consolas</option>
                      <option value="monospace">Standard Monospace</option>
                    </select>
                    <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
                  </div>
                </div>

                {/* Verdict Sound Feedback Toggle & Volume */}
                <div className="control-row">
                  <div className="control-label-row">
                    <span className="control-label">Verdict Audio Chimes</span>
                    <button
                      type="button"
                      className={`btn-mini-sound ${config.soundEnabled ? 'active' : ''}`}
                      onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
                      title={config.soundEnabled ? 'Audio chimes enabled' : 'Audio chimes muted'}
                    >
                      {config.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      <span>{config.soundEnabled ? 'Enabled' : 'Muted'}</span>
                    </button>
                  </div>

                  {config.soundEnabled && (
                    <div className="sub-control-slider">
                      <div className="control-label-row">
                        <span className="sub-label">Chime Volume</span>
                        <span className="control-val mono">{Math.round(config.soundVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        className="range-slider"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={config.soundVolume}
                        onChange={(e) => updateConfig({ soundVolume: parseFloat(e.target.value) })}
                        style={{
                          background: `linear-gradient(to right, var(--tf-accent) 0%, var(--tf-accent) ${
                            ((config.soundVolume - 0.1) / 0.9) * 100
                          }%, rgba(255, 255, 255, 0.08) ${((config.soundVolume - 0.1) / 0.9) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                        }}
                        aria-label="Sound volume percentage"
                      />
                    </div>
                  )}
                </div>

                {/* Test Audio Chimes */}
                <div className="audio-test-grid">
                  <button
                    type="button"
                    className="btn-sound-test"
                    onClick={() => {
                      playAcceptedSound(config.soundVolume, true);
                      showToast('Playing Accepted chime', 'success');
                    }}
                  >
                    <Volume2 size={12} />
                    <span>Test AC Chime</span>
                  </button>
                  <button
                    type="button"
                    className="btn-sound-test"
                    onClick={() => {
                      playRejectedSound(config.soundVolume, true);
                      showToast('Playing Rejected audio cue', 'info');
                    }}
                  >
                    <Volume2 size={12} />
                    <span>Test WA Sound</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          <footer className="sidebar-footer">
            <span className="footer-status">ThemeFlow v1.1 • Settings auto-synced to Chrome Storage</span>
          </footer>
        </aside>

        {/* Right Main Live Preview Pane */}
        <main className="studio-preview-pane" aria-label="Interactive Platform Preview">
          {/* Framed Interactive Preview Stage */}
          <div className="preview-stage">
            {/* Wallpaper Layer with tuned filter */}
            <div
              className="preview-bg-underlay"
              style={{
                backgroundImage: `url("${previewBgUrl}")`,
                filter: `brightness(${config.brightness}%) contrast(${config.contrast}%) blur(${config.blur}px)`,
              }}
              aria-hidden="true"
            />
            {/* Restrained Backdrop Tint Overlay */}
            <div
              className="preview-tint-overlay"
              style={{
                backgroundColor: previewOverlayColor,
              }}
              aria-hidden="true"
            />

            <div className="preview-content">
              {/* Workbench Top Bar: Platform Switcher & Simulators */}
              <div
                className="preview-top-bar"
                style={{
                  backgroundColor: previewCardBg,
                  borderColor: previewCardBorder,
                }}
              >
                <div className="platform-nav-tabs" role="tablist" aria-label="Platform Preview Selector">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewPlatform === 'leetcode'}
                    className={`platform-tab ${previewPlatform === 'leetcode' ? 'active' : ''}`}
                    onClick={() => setPreviewPlatform('leetcode')}
                  >
                    <span className="platform-tab-dot lc-dot" aria-hidden="true" />
                    <span>LeetCode Preview</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewPlatform === 'codeforces'}
                    className={`platform-tab ${previewPlatform === 'codeforces' ? 'active' : ''}`}
                    onClick={() => setPreviewPlatform('codeforces')}
                  >
                    <span className="platform-tab-dot cf-dot" aria-hidden="true" />
                    <span>Codeforces Preview</span>
                  </button>
                </div>

                <div className="preview-sim-cluster">
                  <button
                    type="button"
                    className="btn-sim-ac"
                    onClick={handleSimulateAc}
                    title="Simulate genuine Accepted submission and test celebration effect"
                  >
                    <Check size={13} strokeWidth={2.5} />
                    <span>Simulate AC</span>
                  </button>
                  <button
                    type="button"
                    className="btn-sim-wa"
                    onClick={handleSimulateWa}
                    title="Simulate Wrong Answer sound"
                  >
                    <span>Simulate WA</span>
                  </button>
                </div>
              </div>

              {/* LEETCODE INTERACTIVE PREVIEW */}
              {previewPlatform === 'leetcode' && (
                <div className="preview-workbench" role="tabpanel" aria-label="LeetCode Theme Preview">
                  {/* Problem Description Panel */}
                  <div
                    className="preview-panel"
                    style={{
                      backgroundColor: previewCardBg,
                      borderColor: previewCardBorder,
                      color: previewTextPrimary,
                    }}
                  >
                    <div className="panel-header-bar">
                      <div className="problem-meta-title">
                        <h2 style={{ color: config.accentColor }}>1. Two Sum</h2>
                        <span className="lc-diff-badge">Easy</span>
                      </div>
                      <span className="lc-status-solved">
                        <Check size={12} strokeWidth={3} />
                        <span>Solved</span>
                      </span>
                    </div>

                    <div className="panel-body">
                      <div className="topic-tags">
                        <span className="tag-pill">Array</span>
                        <span className="tag-pill">Hash Table</span>
                      </div>

                      <p>
                        Given an array of integers <code className="inline-code" style={{ color: config.accentColor }}>nums</code> and an integer <code className="inline-code" style={{ color: config.accentColor }}>target</code>, return <em>indices of the two numbers such that they add up to target</em>.
                      </p>

                      <p className="text-secondary">
                        You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.
                      </p>

                      <div className="sample-box">
                        <div className="sample-head">
                          <span>Example 1</span>
                          <button
                            type="button"
                            className="btn-copy-sample"
                            onClick={handleCopySample}
                            title="Copy testcase"
                          >
                            <Copy size={11} />
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre
                          className="sample-code"
                          style={{ fontFamily: `'${config.fontFamily}', Consolas, monospace` }}
                        >
Input: nums = [2,7,11,15], target = 9{"\n"}
Output: [0,1]{"\n"}
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Monaco-Style Code Editor Panel */}
                  <div
                    className="preview-panel editor-panel"
                    style={{
                      backgroundColor: previewCardBg,
                      borderColor: previewCardBorder,
                    }}
                  >
                    <div className="editor-tab-bar">
                      <div
                        className="editor-tab active"
                        style={{
                          borderBottomColor: config.accentColor,
                          color: config.accentColor,
                        }}
                      >
                        <Code2 size={12} />
                        <span>Solution.cpp</span>
                      </div>
                      <span className="editor-lang-tag">C++ • Auto</span>
                    </div>

                    <div className="code-editor-box">
                      <div
                        className="editor-content-area"
                        style={{ fontFamily: `'${config.fontFamily}', Consolas, monospace` }}
                      >
                        <div className="line-numbers" aria-hidden="true">
                          {Array.from({ length: 14 }, (_, i) => (
                            <div key={i + 1}>{i + 1}</div>
                          ))}
                        </div>

                        <div className="code-lines">
                          <div><span className="code-keyword">class</span> <span className="code-type">Solution</span> &#123;</div>
                          <div><span className="code-keyword">public</span>:</div>
                          <div>    <span className="code-type">vector&lt;int&gt;</span> <span className="code-fn">twoSum</span>(<span className="code-type">vector&lt;int&gt;&amp;</span> nums, <span className="code-type">int</span> target) &#123;</div>
                          <div>        <span className="code-type">unordered_map&lt;int, int&gt;</span> seen;</div>
                          <div>        <span className="code-keyword">for</span> (<span className="code-type">int</span> i = <span className="code-num">0</span>; i &lt; nums.size(); ++i) &#123;</div>
                          <div>            <span className="code-type">int</span> comp = target - nums[i];</div>
                          <div>            <span className="code-keyword">if</span> (seen.count(comp)) &#123;</div>
                          <div>                <span className="code-keyword">return</span> &#123;seen[comp], i&#125;;</div>
                          <div>            &#125;</div>
                          <div>            seen[nums[i]] = i;</div>
                          <div>        &#125;</div>
                          <div>        <span className="code-keyword">return</span> &#123;&#125;;</div>
                          <div>    &#125;</div>
                          <div>&#125;;</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CODEFORCES INTERACTIVE PREVIEW */}
              {previewPlatform === 'codeforces' && (
                <div className="preview-workbench" role="tabpanel" aria-label="Codeforces Theme Preview">
                  {/* Problem Statement Card */}
                  <div
                    className="preview-panel"
                    style={{
                      backgroundColor: previewCardBg,
                      borderColor: previewCardBorder,
                      color: previewTextPrimary,
                    }}
                  >
                    <div className="panel-header-bar">
                      <div className="problem-meta-title">
                        <h2 style={{ color: config.accentColor }}>D. Manhattan Permutations</h2>
                        <span className="cf-rating-badge">1400</span>
                      </div>
                      <div className="cf-breadcrumb-crumb">
                        <span>Div. 4</span>
                      </div>
                    </div>

                    <div className="panel-body">
                      <div className="meta-stats">
                        <span>Time: 2.0s</span>
                        <span>•</span>
                        <span>Memory: 256MB</span>
                        <span>•</span>
                        <span>Standard I/O</span>
                      </div>

                      <p>
                        A permutation <i>p</i> of length <i>n</i> is an array containing each integer from 1 to <i>n</i> exactly once.
                        The <em>Manhattan value</em> of a permutation <i>p</i> is defined as:
                      </p>

                      <div
                        className="math-formula-box"
                        style={{ color: config.accentColor }}
                      >
                        <i>S</i>(<i>p</i>) = &sum;<sub><i>i</i>=1</sub><sup><i>n</i></sup> |<i>p</i><sub><i>i</i></sub> &minus; <i>i</i>|
                      </div>

                      <p className="text-secondary">
                        Given <i>n</i> and <i>k</i>, determine if there exists a permutation <i>p</i> of length <i>n</i> such that <i>S</i>(<i>p</i>) = <i>k</i>.
                        If such a permutation exists, output <code className="inline-code" style={{ color: config.accentColor }}>Yes</code> followed by the permutation.
                      </p>

                      <div className="sample-box">
                        <div className="sample-head">
                          <span>Sample 1 Input &amp; Output</span>
                          <button
                            type="button"
                            className="btn-copy-sample"
                            onClick={handleCopySample}
                            title="Copy testcase"
                          >
                            <Copy size={11} />
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre
                          className="sample-code"
                          style={{ fontFamily: `'${config.fontFamily}', Consolas, monospace` }}
                        >
Input:{"\n"}2{"\n"}3 2{"\n"}4 4{"\n\n"}Output:{"\n"}Yes{"\n"}2 1 3{"\n"}Yes{"\n"}4 2 3 1
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Codeforces Solution Code Panel */}
                  <div
                    className="preview-panel editor-panel"
                    style={{
                      backgroundColor: previewCardBg,
                      borderColor: previewCardBorder,
                    }}
                  >
                    <div className="editor-tab-bar">
                      <div
                        className="editor-tab active"
                        style={{
                          borderBottomColor: config.accentColor,
                          color: config.accentColor,
                        }}
                      >
                        <Code2 size={12} />
                        <span>solution.cpp</span>
                      </div>
                      <span className="editor-lang-tag">C++20 (GCC 13-64)</span>
                    </div>

                    <div className="code-editor-box">
                      <div
                        className="editor-content-area"
                        style={{ fontFamily: `'${config.fontFamily}', Consolas, monospace` }}
                      >
                        <div className="line-numbers" aria-hidden="true">
                          {Array.from({ length: 15 }, (_, i) => (
                            <div key={i + 1}>{i + 1}</div>
                          ))}
                        </div>

                        <div className="code-lines">
                          <div><span className="code-keyword">#include</span> <span className="code-string">&lt;bits/stdc++.h&gt;</span></div>
                          <div><span className="code-keyword">using namespace</span> std;</div>
                          <div>&nbsp;</div>
                          <div><span className="code-type">void</span> <span className="code-fn">solve</span>() &#123;</div>
                          <div>    <span className="code-type">long long</span> n, k;</div>
                          <div>    cin &gt;&gt; n &gt;&gt; k;</div>
                          <div>    <span className="code-comment">// Manhattan sum must be even</span></div>
                          <div>    <span className="code-keyword">if</span> (k % <span className="code-num">2</span> != <span className="code-num">0</span>) &#123;</div>
                          <div>        cout &lt;&lt; <span className="code-string">"No\n"</span>;</div>
                          <div>        <span className="code-keyword">return</span>;</div>
                          <div>    &#125;</div>
                          <div>    vector&lt;<span className="code-type">int</span>&gt; p(n + <span className="code-num">1</span>);</div>
                          <div>    iota(p.begin(), p.end(), <span className="code-num">0</span>);</div>
                          <div>    cout &lt;&lt; <span className="code-string">"Yes\n"</span>;</div>
                          <div>&#125;</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulated Floating Quick Pill (Live Platform Indicator) */}
              <div className="preview-sim-pill-wrap" title="Simulated Quick-Switcher Pill (bottom-left corner of host platform)">
                <div className="preview-sim-quick-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m4.93 4.93 4.24 4.24" />
                    <path d="m14.83 9.17 4.24-4.24" />
                    <path d="m14.83 14.83 4.24 4.24" />
                    <path d="m9.17 14.83-4.24 4.24" />
                  </svg>
                  <span>{previewPlatform === 'leetcode' ? 'LeetCode' : 'Codeforces'} • {config.name}</span>
                </div>
                <span className="preview-sim-pill-hint">Live extension quick-switcher preview</span>
              </div>

              {/* Subtle Guidance Footer */}
              <div className="disclaimer-banner">
                ThemeFlow Studio provides coordinated workspace theming for LeetCode &amp; Codeforces. Background wallpapers create immersive coding atmosphere without degrading code or syntax clarity.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
