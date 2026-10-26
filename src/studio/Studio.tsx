import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  ExternalLink,
  BookOpen,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  UserSettings,
  ThemeConfig,
} from '../types/theme';
import {
  DEFAULT_USER_SETTINGS,
  presetToConfig,
  THEME_PRESETS,
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
import { ThemeBook, ThemeBookItem } from './ThemeBook';
import { ThemeDetail } from './ThemeDetail';
import './Studio.css';

interface ToastState {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

export const Studio: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'atelier' | 'detail'>('atelier');
  const [selectedThemeItem, setSelectedThemeItem] = useState<ThemeBookItem | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const effectManagerRef = useRef<EffectManager | null>(null);
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

  // Update visual ambient effect when active config changes
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

    // If currently viewing details, update selectedThemeItem config
    if (selectedThemeItem) {
      setSelectedThemeItem({
        ...selectedThemeItem,
        accentColor: updatedConfig.accentColor,
        mode: updatedConfig.mode,
        config: updatedConfig,
      });
    }
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

  // 1. Direct Theme Activation (from 3D Book or Detail View)
  const handleSelectTheme = async (themeId: string) => {
    // A. Built-in presets
    const preset = THEME_PRESETS.find((p) => p.id === themeId);
    if (preset) {
      const newConfig = presetToConfig(preset);
      const updatedSettings: UserSettings = {
        ...settings,
        activeThemeId: preset.id,
        currentConfig: newConfig,
      };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
      showToast(`Activated "${preset.name}" on LeetCode & Codeforces!`, 'success');
      return;
    }

    // B. Custom themes
    const custom = (settings.customThemes || []).find((c) => c.id === themeId);
    if (custom) {
      const updatedSettings: UserSettings = {
        ...settings,
        activeThemeId: custom.id,
        currentConfig: { ...custom },
      };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
      showToast(`Activated custom theme "${custom.name}"!`, 'success');
    }
  };

  // 2. 3D Transition to Dedicated Details View
  const handleOpenDetail = (themeItem: ThemeBookItem) => {
    setIsTransitioning(true);
    setSelectedThemeItem(themeItem);

    // If theme is not currently active, load its default configuration into currentConfig for preview
    if (settings.activeThemeId !== themeItem.id) {
      const updatedConfig = { ...themeItem.config };
      setSettings((prev) => ({
        ...prev,
        currentConfig: updatedConfig,
      }));
    }

    setTimeout(() => {
      setViewMode('detail');
      setIsTransitioning(false);
    }, 380);
  };

  // 3. 3D Transition back to 3D Book Atelier
  const handleBackToAtelier = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setViewMode('atelier');
      setIsTransitioning(false);
    }, 350);
  };

  // 4. Custom Theme Deletion
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

      // If we were on detail view for the deleted theme, return to atelier
      if (viewMode === 'detail' && selectedThemeItem?.id === customId) {
        handleBackToAtelier();
      }
    } catch (err: any) {
      showToast('Failed to delete custom wallpaper: ' + (err?.message || 'Error'), 'error');
    }
  };

  // 5. Custom Upload Process
  const handleUploadFile = async (file: File) => {
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
      await saveSettings(updatedSettings);
      showToast(`Custom theme "${customName}" added to 3D Atelier!`, 'success');
    } catch (err: any) {
      console.error('[ThemeFlow] Custom upload error:', err);
      showToast('Failed to upload custom wallpaper: ' + (err?.message || 'Unknown error'), 'error');
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset ThemeFlow to default settings?')) {
      setSettings(DEFAULT_USER_SETTINGS);
      await saveSettings(DEFAULT_USER_SETTINGS);
      showToast('ThemeFlow reset to factory defaults', 'info');
    }
  };

  const handleResetThemeDefaults = async () => {
    if (!selectedThemeItem) return;
    const defaultConf = selectedThemeItem.config;
    await updateConfig(defaultConf);
    showToast(`Reset "${selectedThemeItem.name}" to defaults`, 'info');
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
    const previewArea = (document.querySelector('.preview-workbench') || e?.currentTarget) as HTMLElement | null;
    const anchor = badge || previewArea || null;

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

  if (loading) {
    return (
      <div className="studio-loading-view" role="status" aria-live="polite">
        <div className="studio-loading-spinner" />
        <p>Loading ThemeFlow 3D Atelier...</p>
      </div>
    );
  }

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
              <span className="studio-tag">Atelier 3D</span>
            </div>
            <p className="brand-subtitle">Cinematic workspace personalization for competitive programmers</p>
          </div>
        </div>

        {/* View Switcher Tabs (3D Atelier vs Detail Workstation) */}
        <div className="header-view-nav" role="tablist" aria-label="Studio View Switcher">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'atelier'}
            className={`header-view-tab ${viewMode === 'atelier' ? 'active' : ''}`}
            onClick={handleBackToAtelier}
          >
            <BookOpen size={13} />
            <span>3D Theme Atelier</span>
          </button>

          {selectedThemeItem && (
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'detail'}
              className={`header-view-tab ${viewMode === 'detail' ? 'active' : ''}`}
              onClick={() => handleOpenDetail(selectedThemeItem)}
            >
              <Sliders size={13} />
              <span>{selectedThemeItem.name}</span>
            </button>
          )}
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

      {/* DUAL MODE VIEWPORT: 3D BOOK ATELIER vs DEDICATED THEME DETAIL */}
      {viewMode === 'atelier' ? (
        <ThemeBook
          activeThemeId={settings.activeThemeId}
          customThemes={settings.customThemes}
          onSelectTheme={handleSelectTheme}
          onOpenDetail={handleOpenDetail}
          onDeleteCustomTheme={handleDeleteCustomTheme}
          onUploadFile={handleUploadFile}
          isTransitioning={isTransitioning}
          initialThemeId={selectedThemeItem?.id || settings.activeThemeId}
        />
      ) : selectedThemeItem ? (
        <ThemeDetail
          themeItem={selectedThemeItem}
          config={config}
          isActiveTheme={settings.activeThemeId === selectedThemeItem.id}
          onBackToAtelier={handleBackToAtelier}
          onApplyTheme={handleSelectTheme}
          onUpdateConfig={updateConfig}
          onSimulateAc={handleSimulateAc}
          onSimulateWa={handleSimulateWa}
          onResetThemeDefaults={handleResetThemeDefaults}
          isTransitioning={isTransitioning}
        />
      ) : (
        <ThemeBook
          activeThemeId={settings.activeThemeId}
          customThemes={settings.customThemes}
          onSelectTheme={handleSelectTheme}
          onOpenDetail={handleOpenDetail}
          onDeleteCustomTheme={handleDeleteCustomTheme}
          onUploadFile={handleUploadFile}
          isTransitioning={isTransitioning}
        />
      )}
    </div>
  );
};
