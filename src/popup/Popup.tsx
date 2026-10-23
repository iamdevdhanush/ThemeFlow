import React, { useEffect, useState } from 'react';
import { Check, Sparkles, ExternalLink, Sliders, Globe } from 'lucide-react';
import { UserSettings } from '../types/theme';
import { SupportedPlatform, detectPlatformFromUrl } from '../types/platform';
import { THEME_PRESETS, presetToConfig, DEFAULT_USER_SETTINGS } from '../themes/presets';
import { getSettings, saveSettings } from '../storage/storage';
import './Popup.css';

export const Popup: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<SupportedPlatform>('unknown');

  useEffect(() => {
    getSettings().then((loaded) => {
      setSettings(loaded);
      setLoading(false);
    });

    // Detect current active tab platform
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]?.url) {
          const detected = detectPlatformFromUrl(tabs[0].url);
          setPlatform(detected);
        }
      });
    } else if (typeof window !== 'undefined') {
      setPlatform(detectPlatformFromUrl(window.location.href));
    }
  }, []);

  const handleToggleEnabled = async () => {
    const updated: UserSettings = {
      ...settings,
      enabled: !settings.enabled,
    };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleSelectPreset = async (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const newConfig = presetToConfig(preset);
    const updated: UserSettings = {
      ...settings,
      activeThemeId: preset.id,
      currentConfig: newConfig,
    };

    setSettings(updated);
    await saveSettings(updated);
  };

  const handleOpenStudio = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({ url: chrome.runtime.getURL('studio.html') });
    } else {
      window.open('studio.html', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="popup-container" style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading themes...</p>
      </div>
    );
  }

  const activeId = settings.activeThemeId;

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="popup-header">
        <div className="header-left">
          <div className="logo-badge">
            <Sparkles size={16} />
          </div>
          <div className="header-titles">
            <h1>ThemeFlow</h1>
            <p>Codeforces & LeetCode</p>
          </div>
        </div>

        <label className="switch" title={settings.enabled ? 'ThemeFlow Active' : 'ThemeFlow Disabled'}>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={handleToggleEnabled}
          />
          <span className="slider"></span>
        </label>
      </header>

      {/* Platform Status Banner */}
      <div className="platform-banner">
        <div className="platform-banner-left">
          <Globe size={13} />
          <span className="platform-label">Platform:</span>
          {platform === 'leetcode' && (
            <span className={`platform-badge leetcode ${settings.enabled ? 'active' : 'paused'}`}>
              LeetCode • {settings.enabled ? 'Active' : 'Paused'}
            </span>
          )}
          {platform === 'codeforces' && (
            <span className={`platform-badge codeforces ${settings.enabled ? 'active' : 'paused'}`}>
              Codeforces • {settings.enabled ? 'Active' : 'Paused'}
            </span>
          )}
          {platform === 'unknown' && (
            <span className="platform-badge neutral">
              Universal Studio Ready
            </span>
          )}
        </div>
      </div>

      {/* Main Theme Selection Cards */}
      <main className="popup-content">
        <div className="section-label">Select Workspace Theme</div>

        {THEME_PRESETS.map((preset) => {
          const isSelected = activeId === preset.id;
          return (
            <div
              key={preset.id}
              className={`theme-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectPreset(preset.id)}
            >
              <div className="theme-preview-box">
                <img
                  src={preset.thumbnail}
                  alt={preset.name}
                  className="theme-thumb"
                  loading="lazy"
                />
                {isSelected && (
                  <div className="check-indicator">
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                )}
              </div>

              <div className="theme-info">
                <div className="theme-title-row">
                  <span className="theme-name">{preset.name}</span>
                </div>
                <p className="theme-desc">{preset.description}</p>
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer Actions */}
      <footer className="popup-footer">
        <button className="btn-open-studio" onClick={handleOpenStudio}>
          <Sliders size={15} />
          <span>Open Full Theme Studio</span>
          <ExternalLink size={13} style={{ opacity: 0.8 }} />
        </button>
      </footer>
    </div>
  );
};
