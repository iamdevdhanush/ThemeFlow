import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Code2,
  Monitor,
  Moon,
  Sun,
  Eye,
  Sliders,
  Copy,
  ChevronDown,
  Palette,
  CheckCircle2,
} from 'lucide-react';
import {
  ThemeConfig,
  ThemeMode,
  VisualEffect,
  CodeFontFamily,
} from '../types/theme';
import { ThemeBookItem } from './ThemeBook';
import { computeSurfaceTokens } from '../core/themeEngine';
import './ThemeDetail.css';

interface ThemeDetailProps {
  themeItem: ThemeBookItem;
  config: ThemeConfig;
  isActiveTheme: boolean;
  onBackToAtelier: () => void;
  onApplyTheme: (themeId: string) => void;
  onUpdateConfig: (partial: Partial<ThemeConfig>) => Promise<void>;
  onSimulateAc: (e?: React.MouseEvent<HTMLElement>) => void;
  onSimulateWa: () => void;
  onResetThemeDefaults: () => void;
  isTransitioning: boolean;
}

const ACCENT_COLORS = [
  { name: 'Lavender Violet', hex: '#a78bfa' },
  { name: 'Sky Cyan', hex: '#38bdf8' },
  { name: 'Emerald Mint', hex: '#34d399' },
  { name: 'Sakura Pink', hex: '#f472b6' },
  { name: 'Golden Amber', hex: '#fbbf24' },
  { name: 'Coral Red', hex: '#f87171' },
  { name: 'Cyber Purple', hex: '#c084fc' },
  { name: 'Indigo Pulse', hex: '#818cf8' },
];

export const ThemeDetail: React.FC<ThemeDetailProps> = ({
  themeItem,
  config,
  isActiveTheme,
  onBackToAtelier,
  onApplyTheme,
  onUpdateConfig,
  onSimulateAc,
  onSimulateWa,
  onResetThemeDefaults,
  isTransitioning,
}) => {
  const [previewPlatform, setPreviewPlatform] = useState<'leetcode' | 'codeforces'>('leetcode');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate coordinated surface tokens based on current config
  const previewSurfaces = computeSurfaceTokens(config.mode, config.overlayOpacity, config.cardGlassOpacity);
  const previewOverlayColor = previewSurfaces.overlayColor;
  const previewCardBg = previewSurfaces.panelBg;
  const previewCardBorder = previewSurfaces.border;
  const previewTextPrimary = previewSurfaces.textPrimary;

  const handleCopySample = () => {
    const textToCopy = previewPlatform === 'leetcode' ? '[2,7,11,15]\n9' : '2\n3 2\n4 4';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`theme-detail-container ${isTransitioning ? 'detail-transitioning' : ''}`}>
      {/* Detail Top Action Bar */}
      <div className="detail-action-bar">
        <div className="detail-back-cluster">
          <button
            type="button"
            className="btn-back-atelier"
            onClick={onBackToAtelier}
            title="Return to 3D Theme Atelier (Esc)"
          >
            <ArrowLeft size={14} />
            <span>Theme Atelier</span>
          </button>

          <div className="detail-title-group">
            <h1 className="detail-theme-heading" style={{ color: config.accentColor }}>
              {config.name || themeItem.name}
            </h1>
            {isActiveTheme ? (
              <span className="detail-active-chip">
                <Check size={11} strokeWidth={3} />
                <span>Active on Platforms</span>
              </span>
            ) : (
              <span className="detail-inactive-chip">Previewing</span>
            )}
          </div>
        </div>

        <div className="detail-main-actions">
          <button
            type="button"
            className="btn-detail-reset"
            onClick={onResetThemeDefaults}
            title="Reset this theme's configuration to default values"
          >
            <RotateCcw size={12} />
            <span>Reset Config</span>
          </button>

          <button
            type="button"
            className={`btn-detail-apply ${isActiveTheme ? 'is-active' : ''}`}
            onClick={() => onApplyTheme(config.id)}
            title="Activate this theme on LeetCode & Codeforces"
          >
            {isActiveTheme ? (
              <>
                <CheckCircle2 size={14} />
                <span>Applied to Platforms</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Activate Theme</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Two-Column Atelier Workstation */}
      <div className="detail-workstation-grid">
        {/* Left Column: Customization & Token Controls */}
        <div className="detail-controls-panel">
          {/* SECTION: SURFACE & LIGHTING */}
          <section className="detail-section">
            <div className="detail-section-head">
              <Monitor size={14} className="section-icon" />
              <span>Surface Mode</span>
            </div>

            <div className="detail-mode-grid" role="radiogroup" aria-label="Surface Mode">
              <button
                type="button"
                role="radio"
                aria-checked={config.mode === 'dark'}
                className={`detail-mode-btn ${config.mode === 'dark' ? 'active' : ''}`}
                onClick={() => onUpdateConfig({ mode: 'dark' })}
              >
                <Moon size={13} />
                <span>Deep Dark</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={config.mode === 'midnight'}
                className={`detail-mode-btn ${config.mode === 'midnight' ? 'active' : ''}`}
                onClick={() => onUpdateConfig({ mode: 'midnight' })}
              >
                <Moon size={13} className="oled-icon" />
                <span>OLED Black</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={config.mode === 'glass'}
                className={`detail-mode-btn ${config.mode === 'glass' ? 'active' : ''}`}
                onClick={() => onUpdateConfig({ mode: 'glass' })}
              >
                <Eye size={13} />
                <span>Frosted Glass</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={config.mode === 'light'}
                className={`detail-mode-btn ${config.mode === 'light' ? 'active' : ''}`}
                onClick={() => onUpdateConfig({ mode: 'light' })}
              >
                <Sun size={13} />
                <span>Classic Tint</span>
              </button>
            </div>
          </section>

          {/* SECTION: ATMOSPHERE SLIDERS */}
          <section className="detail-section">
            <div className="detail-section-head">
              <Sliders size={14} className="section-icon" />
              <span>Atmosphere &amp; Filters</span>
            </div>

            <div className="detail-slider-row">
              <div className="slider-label-row">
                <span className="slider-label">Overlay Darkness</span>
                <span className="slider-val mono">{Math.round(config.overlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0.1"
                max="0.95"
                step="0.01"
                value={config.overlayOpacity}
                onChange={(e) => onUpdateConfig({ overlayOpacity: parseFloat(e.target.value) })}
                style={{
                  background: `linear-gradient(to right, var(--tf-accent) 0%, var(--tf-accent) ${
                    ((config.overlayOpacity - 0.1) / 0.85) * 100
                  }%, rgba(255, 255, 255, 0.08) ${((config.overlayOpacity - 0.1) / 0.85) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                }}
              />
            </div>

            <div className="detail-slider-row">
              <div className="slider-label-row">
                <span className="slider-label">Panel Opacity</span>
                <span className="slider-val mono">{Math.round(config.cardGlassOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0.3"
                max="0.98"
                step="0.02"
                value={config.cardGlassOpacity}
                onChange={(e) => onUpdateConfig({ cardGlassOpacity: parseFloat(e.target.value) })}
                style={{
                  background: `linear-gradient(to right, var(--tf-accent) 0%, var(--tf-accent) ${
                    ((config.cardGlassOpacity - 0.3) / 0.68) * 100
                  }%, rgba(255, 255, 255, 0.08) ${((config.cardGlassOpacity - 0.3) / 0.68) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                }}
              />
            </div>

            <div className="detail-slider-row">
              <div className="slider-label-row">
                <span className="slider-label">Wallpaper Blur</span>
                <span className="slider-val mono">{config.blur}px</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0"
                max="20"
                step="1"
                value={config.blur}
                onChange={(e) => onUpdateConfig({ blur: parseInt(e.target.value, 10) })}
                style={{
                  background: `linear-gradient(to right, var(--tf-accent) 0%, var(--tf-accent) ${
                    (config.blur / 20) * 100
                  }%, rgba(255, 255, 255, 0.08) ${(config.blur / 20) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                }}
              />
            </div>

            <div className="detail-slider-row">
              <div className="slider-label-row">
                <span className="slider-label">Wallpaper Brightness</span>
                <span className="slider-val mono">{config.brightness}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="40"
                max="130"
                step="5"
                value={config.brightness}
                onChange={(e) => onUpdateConfig({ brightness: parseInt(e.target.value, 10) })}
                style={{
                  background: `linear-gradient(to right, var(--tf-accent) 0%, var(--tf-accent) ${
                    ((config.brightness - 40) / 90) * 100
                  }%, rgba(255, 255, 255, 0.08) ${((config.brightness - 40) / 90) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                }}
              />
            </div>

            {/* Accent Color Palette */}
            <div className="detail-slider-row">
              <div className="slider-label-row">
                <span className="slider-label">Theme Accent Color</span>
                <span className="slider-val mono">{config.accentColor.toUpperCase()}</span>
              </div>
              <div className="detail-swatches-row" role="radiogroup" aria-label="Accent Color">
                {ACCENT_COLORS.map((col) => {
                  const isSelected = config.accentColor.toLowerCase() === col.hex.toLowerCase();
                  return (
                    <button
                      key={col.hex}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`detail-swatch ${isSelected ? 'active' : ''}`}
                      style={{ backgroundColor: col.hex }}
                      onClick={() => onUpdateConfig({ accentColor: col.hex })}
                      title={`${col.name} (${col.hex})`}
                    />
                  );
                })}
                <label className="custom-color-picker" title="Pick custom HEX color">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => onUpdateConfig({ accentColor: e.target.value })}
                  />
                  <Palette size={13} />
                </label>
              </div>
            </div>
          </section>

          {/* SECTION: PARTICLES & CELEBRATION */}
          <section className="detail-section">
            <div className="detail-section-head">
              <Sparkles size={14} className="section-icon" />
              <span>Focus &amp; Effects</span>
            </div>

            <div className="detail-slider-row">
              <div className="slider-label-row">
                <span className="slider-label">Ambient Atmosphere Effect</span>
              </div>
              <div className="select-wrap">
                <select
                  className="select-input"
                  value={config.effect}
                  onChange={(e) => onUpdateConfig({ effect: e.target.value as VisualEffect })}
                >
                  <option value="none">None (Clean &amp; Minimal)</option>
                  <option value="sakura">Gentle Sakura Petals</option>
                  <option value="rain">Subtle Raindrops</option>
                  <option value="stars">Twinkling Night Stars</option>
                </select>
                <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
              </div>
            </div>

            <div className="toggle-control-item">
              <div className="toggle-copy">
                <span className="toggle-title">Anime Impact Celebration</span>
                <span className="toggle-desc">Speed-line energy slash on Accepted</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.confettiEnabled}
                className={`switch-toggle ${config.confettiEnabled ? 'checked' : ''}`}
                onClick={() => onUpdateConfig({ confettiEnabled: !config.confettiEnabled })}
              >
                <span className="switch-thumb" />
              </button>
            </div>
          </section>

          {/* SECTION: ADVANCED AUDIO & TYPOGRAPHY */}
          <section className="detail-section advanced-section">
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              aria-expanded={advancedOpen}
            >
              <div className="advanced-toggle-label">
                <Code2 size={14} className="section-icon" />
                <span>Advanced &amp; Sound Settings</span>
              </div>
              <ChevronDown
                size={14}
                className={`advanced-chevron ${advancedOpen ? 'rotated' : ''}`}
                aria-hidden="true"
              />
            </button>

            {advancedOpen && (
              <div className="advanced-drawer">
                <div className="detail-slider-row">
                  <div className="slider-label-row">
                    <span className="slider-label">Code Editor Font</span>
                  </div>
                  <div className="select-wrap">
                    <select
                      className="select-input"
                      value={config.fontFamily}
                      onChange={(e) => onUpdateConfig({ fontFamily: e.target.value as CodeFontFamily })}
                    >
                      <option value="JetBrains Mono">JetBrains Mono</option>
                      <option value="Fira Code">Fira Code</option>
                      <option value="Consolas">Consolas</option>
                      <option value="monospace">Standard Monospace</option>
                    </select>
                    <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
                  </div>
                </div>

                <div className="detail-slider-row">
                  <div className="slider-label-row">
                    <span className="slider-label">Verdict Audio Chimes</span>
                    <button
                      type="button"
                      className={`btn-mini-sound ${config.soundEnabled ? 'active' : ''}`}
                      onClick={() => onUpdateConfig({ soundEnabled: !config.soundEnabled })}
                    >
                      {config.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      <span>{config.soundEnabled ? 'Enabled' : 'Muted'}</span>
                    </button>
                  </div>

                  {config.soundEnabled && (
                    <div className="sub-control-slider">
                      <div className="slider-label-row">
                        <span className="sub-label">Volume</span>
                        <span className="slider-val mono">{Math.round(config.soundVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        className="range-slider"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={config.soundVolume}
                        onChange={(e) => onUpdateConfig({ soundVolume: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}
                </div>

                <div className="audio-test-grid">
                  <button
                    type="button"
                    className="btn-sound-test"
                    onClick={() => onSimulateAc()}
                  >
                    <Volume2 size={12} />
                    <span>Test AC Chime</span>
                  </button>
                  <button
                    type="button"
                    className="btn-sound-test"
                    onClick={onSimulateWa}
                  >
                    <Volume2 size={12} />
                    <span>Test WA Sound</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Live Interactive Platform Preview Workbench */}
        <div className="detail-preview-panel">
          <div className="detail-preview-stage">
            {/* Background Wallpaper Layer */}
            <div
              className="preview-bg-underlay"
              style={{
                backgroundImage: `url("${themeItem.wallpaperUrl || themeItem.thumbnailUrl}")`,
                filter: `brightness(${config.brightness}%) contrast(${config.contrast}%) blur(${config.blur}px)`,
              }}
              aria-hidden="true"
            />
            {/* Coordinated Atmosphere Tint Layer */}
            <div
              className="preview-tint-overlay"
              style={{
                backgroundColor: previewOverlayColor,
              }}
              aria-hidden="true"
            />

            <div className="preview-content">
              {/* Top Bar: Platform Selector & Simulation Buttons */}
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
                    onClick={onSimulateAc}
                    title="Simulate Accepted submission with victory impact frame"
                  >
                    <Check size={13} strokeWidth={2.5} />
                    <span>Simulate AC</span>
                  </button>
                  <button
                    type="button"
                    className="btn-sim-wa"
                    onClick={onSimulateWa}
                    title="Simulate Wrong Answer sound"
                  >
                    <span>Simulate WA</span>
                  </button>
                </div>
              </div>

              {/* LEETCODE WORKBENCH */}
              {previewPlatform === 'leetcode' && (
                <div className="preview-workbench" role="tabpanel" aria-label="LeetCode Theme Preview">
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

              {/* CODEFORCES WORKBENCH */}
              {previewPlatform === 'codeforces' && (
                <div className="preview-workbench" role="tabpanel" aria-label="Codeforces Theme Preview">
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

              {/* Simulated Floating Quick Pill */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
