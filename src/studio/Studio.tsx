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
  Globe,
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
import { fireAcceptedCelebration } from '../effects/confetti';
import { EffectManager } from '../effects/particles';
import './Studio.css';

const ACCENT_COLORS = [
  '#a78bfa', // Lavender
  '#38bdf8', // Cyan
  '#34d399', // Emerald
  '#f472b6', // Sakura Pink
  '#fbbf24', // Amber
  '#f87171', // Coral Red
  '#c084fc', // Violet
  '#818cf8', // Indigo
];

export const Studio: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [previewBgUrl, setPreviewBgUrl] = useState<string>('');
  const [previewPlatform, setPreviewPlatform] = useState<'leetcode' | 'codeforces'>('leetcode');
  const effectManagerRef = useRef<EffectManager | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getSettings().then((loaded) => {
      setSettings(loaded);
      setLoading(false);
    });

    effectManagerRef.current = new EffectManager();
    return () => {
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

  // Update effect preview
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

  const handleSimulateAc = () => {
    if (config.confettiEnabled) {
      fireAcceptedCelebration({
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
    const textToCopy = previewPlatform === 'leetcode' ? '[2,7,11,15]\n9' : '4\n1 2 4 3';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="studio-container" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading ThemeFlow Studio...</p>
      </div>
    );
  }

  // Dynamic surface colors
  let previewOverlayColor = `rgba(10, 10, 16, ${config.overlayOpacity})`;
  let previewCardBg = `rgba(20, 20, 28, ${config.cardGlassOpacity})`;
  let previewTextPrimary = '#f3f4f6';

  if (config.mode === 'midnight') {
    previewOverlayColor = `rgba(0, 0, 0, ${Math.max(0.85, config.overlayOpacity)})`;
    previewCardBg = `rgba(8, 8, 12, ${Math.max(0.9, config.cardGlassOpacity)})`;
  } else if (config.mode === 'glass') {
    previewOverlayColor = `rgba(15, 15, 25, ${config.overlayOpacity * 0.75})`;
    previewCardBg = `rgba(22, 22, 34, ${config.cardGlassOpacity * 0.75})`;
  } else if (config.mode === 'light') {
    previewOverlayColor = `rgba(240, 242, 245, ${config.overlayOpacity * 0.9})`;
    previewCardBg = `rgba(255, 255, 255, ${config.cardGlassOpacity * 0.9})`;
    previewTextPrimary = '#111827';
  }

  return (
    <div className="studio-container">
      {/* Studio Header */}
      <header className="studio-header">
        <div className="header-brand">
          <div className="studio-logo">
            <Sparkles size={20} />
          </div>
          <div className="studio-title-group">
            <h1>
              ThemeFlow
              <span className="studio-tag">Studio</span>
            </h1>
            <p>Make your coding space your own.</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="status-badge">
            <span className="status-dot"></span>
            <span>Live on LeetCode & Codeforces</span>
          </div>

          <button className="btn-secondary" onClick={handleResetDefaults} title="Reset all settings to default">
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <a
            href="https://leetcode.com/problemset/"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ textDecoration: 'none', color: '#fb923c' }}
          >
            <span>LeetCode</span>
            <ExternalLink size={13} />
          </a>

          <a
            href="https://codeforces.com"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <span>Codeforces</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </header>

      {/* Main Studio Layout */}
      <div className="studio-layout">
        {/* Left Sidebar Customization Controls */}
        <aside className="studio-sidebar">
          {/* Theme Gallery */}
          <div className="sidebar-section">
            <div className="section-heading">
              <Layers size={14} />
              <span>Background Themes ({THEME_PRESETS.length})</span>
            </div>

            <div className="wallpaper-grid">
              {THEME_PRESETS.map((preset) => {
                const isActive = settings.activeThemeId === preset.id;
                return (
                  <div
                    key={preset.id}
                    className={`wallpaper-card ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset.id)}
                  >
                    <div className="wallpaper-thumb-box">
                      <img src={preset.thumbnail} alt={preset.name} loading="lazy" />
                      {isActive && (
                        <div className="wallpaper-active-badge">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="wallpaper-name" title={preset.name}>
                      {preset.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Upload Custom Wallpaper */}
            <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              <span>Upload Custom Wallpaper</span>
              <p>Supports PNG, JPG, WebP, AVIF up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCustomUpload}
              />
            </div>
          </div>

          {/* Surface & Panel Appearance */}
          <div className="sidebar-section">
            <div className="section-heading">
              <Monitor size={14} />
              <span>Surface & Theme Mode</span>
            </div>

            <div className="mode-selector">
              <button
                className={`mode-btn ${config.mode === 'dark' ? 'active' : ''}`}
                onClick={() => updateConfig({ mode: 'dark' })}
              >
                <Moon size={14} />
                <span>Deep Dark</span>
              </button>
              <button
                className={`mode-btn ${config.mode === 'midnight' ? 'active' : ''}`}
                onClick={() => updateConfig({ mode: 'midnight' })}
              >
                <Moon size={14} />
                <span>OLED Black</span>
              </button>
              <button
                className={`mode-btn ${config.mode === 'glass' ? 'active' : ''}`}
                onClick={() => updateConfig({ mode: 'glass' })}
              >
                <Eye size={14} />
                <span>Frosted Glass</span>
              </button>
              <button
                className={`mode-btn ${config.mode === 'light' ? 'active' : ''}`}
                onClick={() => updateConfig({ mode: 'light' })}
              >
                <Sun size={14} />
                <span>Classic Tint</span>
              </button>
            </div>
          </div>

          {/* Tuning Sliders */}
          <div className="sidebar-section">
            <div className="section-heading">
              <Sliders size={14} />
              <span>Atmosphere & Visibility</span>
            </div>

            {/* Overlay Darkness */}
            <div className="control-row">
              <div className="control-label">
                <span>Overlay Darkness</span>
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

            {/* Background Blur */}
            <div className="control-row">
              <div className="control-label">
                <span>Background Blur</span>
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
              <div className="control-label">
                <span>Wallpaper Brightness</span>
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

            {/* Card Glass Opacity */}
            <div className="control-row">
              <div className="control-label">
                <span>Panel Opacity</span>
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
          </div>

          {/* Accent Color Palette */}
          <div className="sidebar-section">
            <div className="section-heading">
              <Sparkles size={14} />
              <span>Accent Color</span>
            </div>
            <div className="color-presets">
              {ACCENT_COLORS.map((col) => (
                <div
                  key={col}
                  className={`color-swatch ${config.accentColor === col ? 'active' : ''}`}
                  style={{ backgroundColor: col }}
                  onClick={() => updateConfig({ accentColor: col })}
                  title={col}
                />
              ))}
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => updateConfig({ accentColor: e.target.value })}
                title="Custom Color"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                }}
              />
            </div>
          </div>

          {/* Typography */}
          <div className="sidebar-section">
            <div className="section-heading">
              <Code2 size={14} />
              <span>Code Editor Font</span>
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

          {/* Visual Effects & Audio */}
          <div className="sidebar-section">
            <div className="section-heading">
              <Sparkles size={14} />
              <span>Atmosphere & Sounds</span>
            </div>

            <div className="audio-grid">
              {/* Effect selector */}
              <div className="control-row">
                <div className="control-label">
                  <span>Visual Ambient Effect</span>
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

              {/* Sound toggle & volume */}
              <div className="control-row">
                <div className="control-label">
                  <span>Verdict Sound Feedback</span>
                  <button
                    className="btn-test-sound"
                    style={{ padding: '3px 8px' }}
                    onClick={() => updateConfig({ soundEnabled: !config.soundEnabled })}
                  >
                    {config.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                    <span>{config.soundEnabled ? 'Enabled' : 'Muted'}</span>
                  </button>
                </div>
                {config.soundEnabled && (
                  <input
                    type="range"
                    className="range-slider"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={config.soundVolume}
                    onChange={(e) => updateConfig({ soundVolume: parseFloat(e.target.value) })}
                  />
                )}
              </div>

              {/* Test Audio Buttons */}
              <div className="audio-test-row">
                <button className="btn-test-sound" onClick={() => playAcceptedSound(config.soundVolume, true)}>
                  <Volume2 size={12} />
                  <span>Test AC Chime</span>
                </button>
                <button className="btn-test-sound" onClick={() => playRejectedSound(config.soundVolume, true)}>
                  <Volume2 size={12} />
                  <span>Test WA Sound</span>
                </button>
              </div>

              {/* Confetti toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.confettiEnabled}
                  onChange={(e) => updateConfig({ confettiEnabled: e.target.checked })}
                />
                <span>Confetti on Accepted Verdict</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Main Interactive Preview */}
        <main className="studio-preview-pane">
          {/* Live Background Underlay */}
          <div
            className="preview-bg-underlay"
            style={{
              backgroundImage: `url("${previewBgUrl}")`,
              filter: `brightness(${config.brightness}%) contrast(${config.contrast}%) blur(${config.blur}px)`,
            }}
          />
          <div
            className="preview-tint-overlay"
            style={{
              backgroundColor: previewOverlayColor,
            }}
          />

          <div className="preview-content">
            {/* Top Bar / Platform Switcher & Simulation */}
            <div
              className="preview-top-bar"
              style={{
                backgroundColor: previewCardBg,
                borderColor: 'var(--studio-border)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Platform Switcher Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className={`btn-secondary ${previewPlatform === 'leetcode' ? 'active-platform' : ''}`}
                  onClick={() => setPreviewPlatform('leetcode')}
                  style={{
                    padding: '4px 12px',
                    borderColor: previewPlatform === 'leetcode' ? '#fb923c' : 'var(--studio-border)',
                    color: previewPlatform === 'leetcode' ? '#fb923c' : 'inherit',
                    backgroundColor: previewPlatform === 'leetcode' ? 'rgba(251, 146, 60, 0.15)' : 'transparent',
                    fontWeight: 600,
                  }}
                >
                  <span>LeetCode Preview</span>
                </button>

                <button
                  className={`btn-secondary ${previewPlatform === 'codeforces' ? 'active-platform' : ''}`}
                  onClick={() => setPreviewPlatform('codeforces')}
                  style={{
                    padding: '4px 12px',
                    borderColor: previewPlatform === 'codeforces' ? config.accentColor : 'var(--studio-border)',
                    color: previewPlatform === 'codeforces' ? config.accentColor : 'inherit',
                    backgroundColor: previewPlatform === 'codeforces' ? `${config.accentColor}22` : 'transparent',
                    fontWeight: 600,
                  }}
                >
                  <span>Codeforces Preview</span>
                </button>
              </div>

              <div className="preview-sim-buttons">
                <button className="btn-sim-ac" onClick={handleSimulateAc} title="Test AC celebration">
                  <Check size={14} />
                  <span>Simulate Accepted (AC)</span>
                </button>
                <button className="btn-sim-wa" onClick={handleSimulateWa} title="Test WA chime">
                  <span>Simulate WA</span>
                </button>
              </div>
            </div>

            {/* LEETCODE PREVIEW */}
            {previewPlatform === 'leetcode' && (
              <div className="preview-workbench">
                {/* LeetCode Description Card */}
                <div
                  className="preview-panel"
                  style={{
                    backgroundColor: previewCardBg,
                    backdropFilter: 'blur(16px)',
                    color: previewTextPrimary,
                  }}
                >
                  <div className="panel-header-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ color: config.accentColor }}>1. Two Sum</h2>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#4ade80',
                          background: 'rgba(74, 222, 128, 0.15)',
                          padding: '2px 8px',
                          borderRadius: 9999,
                        }}
                      >
                        Easy
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={13} /> Solved
                    </span>
                  </div>

                  <div className="panel-body">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: 4 }}>
                        Array
                      </span>
                      <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: 4 }}>
                        Hash Table
                      </span>
                    </div>

                    <p>
                      Given an array of integers <code style={{ color: config.accentColor }}>nums</code> and an integer <code style={{ color: config.accentColor }}>target</code>, return <em>indices of the two numbers such that they add up to target</em>.
                    </p>

                    <p>
                      You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the <em>same</em> element twice.
                    </p>

                    <div className="sample-box">
                      <div className="sample-head">
                        <span>Example 1</span>
                        <button
                          onClick={handleCopySample}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copied ? '#4ade80' : '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                          }}
                        >
                          <Copy size={11} />
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="sample-code" style={{ fontFamily: `'${config.fontFamily}', monospace` }}>
Input: nums = [2,7,11,15], target = 9{"\n"}
Output: [0,1]{"\n"}
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
                      </pre>
                    </div>
                  </div>
                </div>

                {/* LeetCode Monaco Code Editor Card */}
                <div
                  className="preview-panel"
                  style={{
                    backgroundColor: previewCardBg,
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="editor-tabs">
                    <div
                      className="editor-tab active"
                      style={{
                        borderBottomColor: config.accentColor,
                        color: config.accentColor,
                      }}
                    >
                      <Code2 size={13} />
                      <span>Solution.cpp</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
                      C++ • Auto
                    </span>
                  </div>

                  <div className="code-editor-box">
                    <div
                      className="editor-content-area"
                      style={{ fontFamily: `'${config.fontFamily}', monospace` }}
                    >
                      <div className="line-numbers">
                        {Array.from({ length: 15 }, (_, i) => (
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

            {/* CODEFORCES PREVIEW */}
            {previewPlatform === 'codeforces' && (
              <div className="preview-workbench">
                {/* Problem Statement Card */}
                <div
                  className="preview-panel"
                  style={{
                    backgroundColor: previewCardBg,
                    backdropFilter: 'blur(16px)',
                    color: previewTextPrimary,
                  }}
                >
                  <div className="panel-header-bar">
                    <h2 style={{ color: config.accentColor }}>D. Manhattan Permutations</h2>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Rating: 1400</span>
                  </div>

                  <div className="panel-body">
                    <div className="meta-stats">
                      <span>Time limit: 2.0s</span>
                      <span>•</span>
                      <span>Memory limit: 256MB</span>
                      <span>•</span>
                      <span>Standard I/O</span>
                    </div>

                    <p>
                      A permutation <i style={{ fontFamily: 'KaTeX_Math, "Times New Roman", serif', fontSize: '15px' }}>p</i> of length <i style={{ fontFamily: 'KaTeX_Math, "Times New Roman", serif', fontSize: '15px' }}>n</i> is an array containing each integer from <span style={{ fontFamily: 'KaTeX_Main, "Times New Roman", serif' }}>1</span> to <i style={{ fontFamily: 'KaTeX_Math, "Times New Roman", serif', fontSize: '15px' }}>n</i> exactly once.
                      The <em>Manhattan value</em> of a permutation <i style={{ fontFamily: 'KaTeX_Math, "Times New Roman", serif', fontSize: '15px' }}>p</i> is defined as:
                    </p>

                    <div
                      style={{
                        padding: '12px 18px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: 8,
                        fontFamily: '"Times New Roman", Cambria, serif',
                        fontSize: 18,
                        letterSpacing: '0.04em',
                        textAlign: 'center',
                        color: config.accentColor,
                      }}
                    >
                      <i>S</i>(<i>p</i>) = <span style={{ fontSize: '20px' }}>&sum;</span><sub style={{ fontSize: '11px' }}><i>i</i>=1</sub><sup style={{ fontSize: '11px' }}><i>n</i></sup> |<i>p</i><sub><i>i</i></sub> &minus; <i>i</i>|
                    </div>

                    <p>
                      Given <i style={{ fontFamily: 'KaTeX_Math, "Times New Roman", serif', fontSize: '15px' }}>n</i> and <i style={{ fontFamily: 'KaTeX_Math, "Times New Roman", serif', fontSize: '15px' }}>k</i>, determine if there exists a permutation <i style={{ fontFamily: 'KaTeX_Math, "Times New Roman", serif', fontSize: '15px' }}>p</i> of length <i style={{ fontFamily: 'KaTeX_Math, "Times New Roman", serif', fontSize: '15px' }}>n</i> such that <i>S</i>(<i>p</i>) = <i>k</i>.
                      If such a permutation exists, output <code style={{ color: config.accentColor, fontWeight: 600 }}>Yes</code> followed by the permutation.
                    </p>

                    <div className="sample-box">
                      <div className="sample-head">
                        <span>Sample 1 Input</span>
                        <button
                          onClick={handleCopySample}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copied ? '#4ade80' : '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                          }}
                        >
                          <Copy size={11} />
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="sample-code" style={{ fontFamily: `'${config.fontFamily}', monospace` }}>
                        4{"\n"}1 2 4 3
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Code Editor Preview Panel */}
                <div
                  className="preview-panel"
                  style={{
                    backgroundColor: previewCardBg,
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="editor-tabs">
                    <div
                      className="editor-tab active"
                      style={{
                        borderBottomColor: config.accentColor,
                        color: config.accentColor,
                      }}
                    >
                      <Code2 size={13} />
                      <span>solution.cpp</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
                      C++20 (GCC 13-64)
                    </span>
                  </div>

                  <div className="code-editor-box">
                    <div
                      className="editor-content-area"
                      style={{ fontFamily: `'${config.fontFamily}', monospace` }}
                    >
                      <div className="line-numbers">
                        {Array.from({ length: 18 }, (_, i) => (
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
                        <div>    <span className="code-comment">// Manhattan value must be even</span></div>
                        <div>    <span className="code-keyword">if</span> (k % <span className="code-num">2</span> != <span className="code-num">0</span>) &#123;</div>
                        <div>        cout &lt;&lt; <span className="code-string">"No\n"</span>;</div>
                        <div>        <span className="code-keyword">return</span>;</div>
                        <div>    &#125;</div>
                        <div>    vector&lt;<span className="code-type">int</span>&gt; p(n + <span className="code-num">1</span>);</div>
                        <div>    iota(p.begin(), p.end(), <span className="code-num">0</span>);</div>
                        <div>    <span className="code-comment">// Construct maximal swaps</span></div>
                        <div>    cout &lt;&lt; <span className="code-string">"Yes\n"</span>;</div>
                        <div>&#125;</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Clarification */}
            <div className="disclaimer-banner">
              Interactive Studio Preview • Real-time theme customization for LeetCode & Codeforces • Changes persist automatically
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
