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
  Activity,
} from 'lucide-react';
import {
  UserSettings,
  ThemeConfig,
  ThemeMode,
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
} from '../storage/storage';
import { playAcceptedSound, playRejectedSound } from '../audio/soundPlayer';
import { fireAcceptedCelebration, stopAcceptedCelebration } from '../effects/celebration';
import { EffectManager } from '../effects/particles';
import { computeSurfaceTokens } from '../core/themeEngine';
import './Studio.css';

const ACCENT_COLORS = [
  '#a78bfa', // Lavender / Violet
  '#38bdf8', // Cyan
  '#34d399', // Emerald
  '#f472b6', // Sakura Pink
  '#fbbf24', // Amber
  '#f87171', // Coral Red
  '#c084fc', // Purple
  '#818cf8', // Indigo
];

export const Studio: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [previewBgUrl, setPreviewBgUrl] = useState<string>('');
  const [previewPlatform, setPreviewPlatform] = useState<'leetcode' | 'codeforces'>('leetcode');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const effectManagerRef = useRef<EffectManager | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getSettings().then((loaded) => {
      setSettings(loaded);
      setLoading(false);
    });

    effectManagerRef.current = new EffectManager();
    return () => {
      stopAcceptedCelebration();
      effectManagerRef.current?.destroy();
    };
  }, []);

  const config = settings.currentConfig;

  // Resolve background image whenever config changes
  useEffect(() => {
    let active = true;
    async function updateBg() {
      if (config.isCustom && config.id) {
        const dbUrl = await getCustomImageFromDB(config.id);
        if (active && dbUrl) {
          setPreviewBgUrl(dbUrl);
          return;
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

  const handleSelectPreset = async (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newConfig = presetToConfig(preset);
    const updatedSettings: UserSettings = {
      ...settings,
      activeThemeId: preset.id,
      currentConfig: newConfig,
    };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, AVIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10MB limit. Please upload an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const customId = `custom_${Date.now()}`;
      await saveCustomImageToDB(customId, dataUrl);

      const customConfig: ThemeConfig = {
        ...config,
        id: customId,
        name: file.name.replace(/\.[^/.]+$/, '').slice(0, 20) || 'Custom Wallpaper',
        description: 'User uploaded custom background wallpaper.',
        imagePath: dataUrl,
        thumbnailPath: dataUrl,
        isCustom: true,
      };

      const updatedSettings: UserSettings = {
        ...settings,
        activeThemeId: customId,
        customThemes: [customConfig, ...settings.customThemes],
        currentConfig: customConfig,
      };

      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
    };
    reader.readAsDataURL(file);
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset ThemeFlow to default settings?')) {
      setSettings(DEFAULT_USER_SETTINGS);
      await saveSettings(DEFAULT_USER_SETTINGS);
    }
  };

  const handleSimulateAc = (e?: React.MouseEvent<HTMLElement>) => {
    // Anchor realistically near the problem verdict / preview workbench
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
  };

  const handleSimulateWa = () => {
    playRejectedSound(config.soundVolume, true);
  };

  const handleCopySample = () => {
    const textToCopy = previewPlatform === 'leetcode' ? '[2,7,11,15]\n9' : '2\n3 2\n4 4';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="studio-loading-view">
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
            <p className="brand-subtitle">Anime-inspired workspace themes for competitive programming</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="status-badge" title="Extension active on LeetCode and Codeforces">
            <span className="status-dot" />
            <span className="status-text">Active on LeetCode & Codeforces</span>
          </div>

          <div className="header-divider" />

          <button
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
              <Layers size={13} />
              <span>Atmosphere</span>
              <span className="section-badge">{THEME_PRESETS.length}</span>
            </div>

            {/* Consistent Two-Column Theme Gallery */}
            <div className="wallpaper-grid">
              {THEME_PRESETS.map((preset) => {
                const isActive = settings.activeThemeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`wallpaper-card ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset.id)}
                    aria-pressed={isActive}
                    title={`Select ${preset.name} theme`}
                  >
                    <div className="wallpaper-thumb-box">
                      <img src={preset.thumbnail} alt="" loading="lazy" />
                      {isActive && (
                        <div className="wallpaper-active-pill">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="wallpaper-meta">
                      <span className="wallpaper-name">{preset.name}</span>
                      <span className="wallpaper-mode-tag">{preset.defaultMode}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Wallpaper Upload Card */}
            <div
              className="upload-card"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              title="Click to upload a custom wallpaper image"
            >
              <div className="upload-icon-wrap">
                <Upload size={14} />
              </div>
              <div className="upload-copy">
                <span className="upload-title">Upload Custom Wallpaper</span>
                <span className="upload-hint">PNG, JPG, WebP, AVIF up to 10MB</span>
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
              <Monitor size={13} />
              <span>Appearance</span>
            </div>

            {/* Surface Mode Selector */}
            <div className="control-group">
              <span className="control-group-title">Surface Mode</span>
              <div className="mode-selector">
                <button
                  type="button"
                  className={`mode-btn ${config.mode === 'dark' ? 'active' : ''}`}
                  onClick={() => updateConfig({ mode: 'dark' })}
                >
                  <Moon size={13} />
                  <span>Deep Dark</span>
                </button>
                <button
                  type="button"
                  className={`mode-btn ${config.mode === 'midnight' ? 'active' : ''}`}
                  onClick={() => updateConfig({ mode: 'midnight' })}
                >
                  <Moon size={13} />
                  <span>OLED Black</span>
                </button>
                <button
                  type="button"
                  className={`mode-btn ${config.mode === 'glass' ? 'active' : ''}`}
                  onClick={() => updateConfig({ mode: 'glass' })}
                >
                  <Eye size={13} />
                  <span>Frosted</span>
                </button>
                <button
                  type="button"
                  className={`mode-btn ${config.mode === 'light' ? 'active' : ''}`}
                  onClick={() => updateConfig({ mode: 'light' })}
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
                <span className="control-val">{Math.round(config.overlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0.1"
                max="0.95"
                step="0.01"
                value={config.overlayOpacity}
                onChange={(e) => updateConfig({ overlayOpacity: parseFloat(e.target.value) })}
              />
            </div>

            {/* Panel Glass Opacity */}
            <div className="control-row">
              <div className="control-label-row">
                <span className="control-label">Panel Opacity</span>
                <span className="control-val">{Math.round(config.cardGlassOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0.3"
                max="0.98"
                step="0.02"
                value={config.cardGlassOpacity}
                onChange={(e) => updateConfig({ cardGlassOpacity: parseFloat(e.target.value) })}
              />
            </div>

            {/* Accent Color Palette */}
            <div className="control-group">
              <div className="control-label-row">
                <span className="control-label">Accent Color</span>
                <span className="control-val mono">{config.accentColor.toUpperCase()}</span>
              </div>
              <div className="color-presets-row">
                {ACCENT_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    className={`color-swatch ${config.accentColor.toLowerCase() === col.toLowerCase() ? 'active' : ''}`}
                    style={{ backgroundColor: col }}
                    onClick={() => updateConfig({ accentColor: col })}
                    aria-label={`Select accent color ${col}`}
                    title={col}
                  />
                ))}
                <label className="custom-color-picker" title="Pick custom color">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => updateConfig({ accentColor: e.target.value })}
                  />
                  <Palette size={12} />
                </label>
              </div>
            </div>
          </section>

          {/* SECTION 3: FOCUS & MOTION */}
          <section className="sidebar-section">
            <div className="section-heading">
              <Sliders size={13} />
              <span>Focus & Motion</span>
            </div>

            {/* Background Blur */}
            <div className="control-row">
              <div className="control-label-row">
                <span className="control-label">Wallpaper Blur</span>
                <span className="control-val">{config.blur}px</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0"
                max="20"
                step="1"
                value={config.blur}
                onChange={(e) => updateConfig({ blur: parseInt(e.target.value, 10) })}
              />
            </div>

            {/* Brightness */}
            <div className="control-row">
              <div className="control-label-row">
                <span className="control-label">Wallpaper Brightness</span>
                <span className="control-val">{config.brightness}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="40"
                max="130"
                step="5"
                value={config.brightness}
                onChange={(e) => updateConfig({ brightness: parseInt(e.target.value, 10) })}
              />
            </div>

            {/* Visual Ambient Effect */}
            <div className="control-row">
              <div className="control-label-row">
                <span className="control-label">Visual Ambient Particles</span>
              </div>
              <select
                className="select-input"
                value={config.effect}
                onChange={(e) => updateConfig({ effect: e.target.value as VisualEffect })}
              >
                <option value="none">None (Clean & Still)</option>
                <option value="sakura">Gentle Sakura Petals</option>
                <option value="rain">Subtle Raindrops</option>
                <option value="stars">Twinkling Night Stars</option>
              </select>
            </div>

            {/* Acceptance Celebration Toggle */}
            <label className="checkbox-control">
              <input
                type="checkbox"
                checked={config.confettiEnabled}
                onChange={(e) => updateConfig({ confettiEnabled: e.target.checked })}
              />
              <div className="checkbox-copy">
                <span className="checkbox-title">Anime Impact Celebration</span>
                <span className="checkbox-desc">Speed-line frame and victory badge on Accepted</span>
              </div>
            </label>
          </section>

          {/* SECTION 4: ADVANCED SETTINGS (Compact Expandable Disclosure) */}
          <section className="sidebar-section advanced-section">
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              aria-expanded={advancedOpen}
            >
              <div className="advanced-toggle-label">
                <Code2 size={13} />
                <span>Advanced Settings</span>
              </div>
              <ChevronDown
                size={14}
                className={`advanced-chevron ${advancedOpen ? 'rotated' : ''}`}
              />
            </button>

            {advancedOpen && (
              <div className="advanced-drawer">
                {/* Code Font */}
                <div className="control-row">
                  <div className="control-label-row">
                    <span className="control-label">Code Editor Font</span>
                  </div>
                  <select
                    className="select-input"
                    value={config.fontFamily}
                    onChange={(e) => updateConfig({ fontFamily: e.target.value as CodeFontFamily })}
                  >
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="Fira Code">Fira Code</option>
                    <option value="Consolas">Consolas</option>
                    <option value="monospace">Standard Monospace</option>
                  </select>
                </div>

                {/* Verdict Sound Feedback Toggle & Volume */}
                <div className="control-row">
                  <div className="control-label-row">
                    <span className="control-label">Verdict Audio Chimes</span>
                    <button
                      type="button"
                      className="btn-mini-sound"
                      onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
                    >
                      {config.soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
                      <span>{config.soundEnabled ? 'Enabled' : 'Muted'}</span>
                    </button>
                  </div>

                  {config.soundEnabled && (
                    <div className="sub-control-slider">
                      <div className="control-label-row">
                        <span className="sub-label">Volume</span>
                        <span className="control-val">{Math.round(config.soundVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        className="range-slider"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={config.soundVolume}
                        onChange={(e) => updateConfig({ soundVolume: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}
                </div>

                {/* Test Audio Chimes */}
                <div className="audio-test-grid">
                  <button
                    type="button"
                    className="btn-sound-test"
                    onClick={() => playAcceptedSound(config.soundVolume, true)}
                  >
                    <Volume2 size={11} />
                    <span>Test AC Chime</span>
                  </button>
                  <button
                    type="button"
                    className="btn-sound-test"
                    onClick={() => playRejectedSound(config.soundVolume, true)}
                  >
                    <Volume2 size={11} />
                    <span>Test WA Sound</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          <footer className="sidebar-footer">
            <span>ThemeFlow v1.0 • Settings auto-saved to Chrome Storage</span>
          </footer>
        </aside>

        {/* Right Main Live Preview Pane */}
        <main className="studio-preview-pane" aria-label="Interactive Platform Preview">
          {/* Wallpaper Layer with tuned filter */}
          <div
            className="preview-bg-underlay"
            style={{
              backgroundImage: `url("${previewBgUrl}")`,
              filter: `brightness(${config.brightness}%) contrast(${config.contrast}%) blur(${config.blur}px)`,
            }}
          />
          {/* Restrained Backdrop Tint Overlay */}
          <div
            className="preview-tint-overlay"
            style={{
              backgroundColor: previewOverlayColor,
            }}
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
              <div className="platform-nav-tabs">
                <button
                  type="button"
                  className={`platform-tab ${previewPlatform === 'leetcode' ? 'active' : ''}`}
                  onClick={() => setPreviewPlatform('leetcode')}
                >
                  <span className="platform-tab-dot lc-dot" />
                  <span>LeetCode Preview</span>
                </button>

                <button
                  type="button"
                  className={`platform-tab ${previewPlatform === 'codeforces' ? 'active' : ''}`}
                  onClick={() => setPreviewPlatform('codeforces')}
                >
                  <span className="platform-tab-dot cf-dot" />
                  <span>Codeforces Preview</span>
                </button>
              </div>

              <div className="preview-sim-cluster">
                <button
                  type="button"
                  className="btn-sim-ac"
                  onClick={handleSimulateAc}
                  title="Simulate genuine Accepted submission and test animation"
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
              <div className="preview-workbench">
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
              <div className="preview-workbench">
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

            {/* Subtle Guidance Footer */}
            <div className="disclaimer-banner">
              ThemeFlow Studio provides real-time workspace theming for LeetCode &amp; Codeforces. Background wallpapers create subtle environment atmosphere without degrading syntax readability.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
