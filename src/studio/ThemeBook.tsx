import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Eye,
  Sliders,
  Trash2,
  Upload,
  Layers,
  ArrowRight,
  Palette,
  Maximize2,
} from 'lucide-react';
import { ThemeConfig } from '../types/theme';
import { THEME_PRESETS, presetToConfig } from '../themes/presets';
import { BUILTIN_THEMES } from '../themes/definitions';
import './ThemeBook.css';

export interface ThemeBookItem {
  id: string;
  name: string;
  description: string;
  wallpaperUrl: string;
  thumbnailUrl: string;
  accentColor: string;
  mode: string;
  tags: string[];
  isCustom?: boolean;
  config: ThemeConfig;
}

interface ThemeBookProps {
  activeThemeId: string;
  customThemes: ThemeConfig[];
  onSelectTheme: (themeId: string) => void;
  onOpenDetail: (theme: ThemeBookItem) => void;
  onDeleteCustomTheme: (customId: string, e: React.MouseEvent) => void;
  onUploadFile: (file: File) => Promise<void>;
  isTransitioning: boolean;
  initialThemeId?: string;
}

export const ThemeBook: React.FC<ThemeBookProps> = ({
  activeThemeId,
  customThemes,
  onSelectTheme,
  onOpenDetail,
  onDeleteCustomTheme,
  onUploadFile,
  isTransitioning,
  initialThemeId,
}) => {
  // Assemble full theme list (built-in definitions + user custom themes)
  const items: ThemeBookItem[] = useMemo(() => {
    const builtinItems: ThemeBookItem[] = BUILTIN_THEMES.map((def) => {
      const preset = THEME_PRESETS.find((p) => p.id === def.id);
      const conf: ThemeConfig = preset ? presetToConfig(preset) : {
        id: def.id,
        name: def.name,
        description: def.description,
        imagePath: def.assets.wallpaper,
        thumbnailPath: def.assets.thumbnail,
        accentColor: def.tokens.accentColor,
        mode: def.tokens.defaultMode,
        overlayOpacity: def.tokens.surfaces.overlayOpacity,
        blur: def.tokens.surfaces.blur,
        brightness: def.tokens.surfaces.brightness,
        contrast: def.tokens.surfaces.contrast,
        cardGlassOpacity: def.tokens.surfaces.cardGlassOpacity,
        fontFamily: def.tokens.typography.fontFamily,
        effect: (def.ambientEffect ?? 'none') as ThemeConfig['effect'],
        soundEnabled: false,
        soundVolume: 0.7,
        confettiEnabled: true,
      };

      const cleanWallpaper = def.assets.wallpaper.replace(/^[\\/]+/, '').replace(/^\.\//, '');
      const wallpaperUrl = typeof chrome !== 'undefined' && chrome.runtime?.getURL
        ? chrome.runtime.getURL(cleanWallpaper)
        : '/' + cleanWallpaper;

      const cleanThumb = def.assets.thumbnail.replace(/^[\\/]+/, '').replace(/^\.\//, '');
      const thumbnailUrl = typeof chrome !== 'undefined' && chrome.runtime?.getURL
        ? chrome.runtime.getURL(cleanThumb)
        : '/' + cleanThumb;

      return {
        id: def.id,
        name: def.name,
        description: def.description,
        wallpaperUrl,
        thumbnailUrl,
        accentColor: def.tokens.accentColor,
        mode: def.tokens.defaultMode,
        tags: def.tags || ['Anime', 'Workspace'],
        isCustom: false,
        config: conf,
      };
    });

    const customItems: ThemeBookItem[] = (customThemes || []).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || 'User uploaded custom atmosphere theme.',
      wallpaperUrl: c.imagePath || '',
      thumbnailUrl: c.thumbnailPath || c.imagePath || '',
      accentColor: c.accentColor || '#a78bfa',
      mode: c.mode || 'dark',
      tags: ['Custom', 'User'],
      isCustom: true,
      config: c,
    }));

    return [...builtinItems, ...customItems];
  }, [customThemes]);

  // Initial index selection
  const [currentIndex, setCurrentIndex] = useState(() => {
    const targetId = initialThemeId || activeThemeId;
    const found = items.findIndex((item) => item.id === targetId);
    return found >= 0 ? found : 0;
  });

  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentItem = items[currentIndex] || items[0];

  const handleNext = () => {
    if (isFlipping || items.length <= 1) return;
    setIsFlipping(true);
    setFlipDirection('next');
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 400);
  };

  const handlePrev = () => {
    if (isFlipping || items.length <= 1) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 400);
  };

  const handleJumpToIndex = (idx: number) => {
    if (idx === currentIndex || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection(idx > currentIndex ? 'next' : 'prev');
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 350);
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (currentItem) onOpenDetail(currentItem);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, currentItem, isFlipping]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = '';
      await onUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingUpload(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingUpload(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingUpload(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await onUploadFile(file);
    }
  };

  const isActiveTheme = currentItem && currentItem.id === activeThemeId;

  return (
    <div className={`theme-atelier-container ${isTransitioning ? 'stage-transitioning' : ''}`}>
      {/* Atelier Stage Header */}
      <div className="atelier-stage-header">
        <div className="atelier-heading">
          <span className="atelier-tag">3D Theme Atelier</span>
          <h1 className="atelier-title">The Curated Folio</h1>
          <p className="atelier-subtitle">
            Explore dimensional theme spreads inspired by visual novel and manga atmosphere.
          </p>
        </div>

        {/* Quick Page Indicator & Upload Trigger */}
        <div className="atelier-header-controls">
          <div className="page-counter-pill">
            <span className="current-page-num">{String(currentIndex + 1).padStart(2, '0')}</span>
            <span className="page-sep">/</span>
            <span className="total-pages-num">{String(items.length).padStart(2, '0')}</span>
          </div>

          <button
            type="button"
            className="btn-atelier-upload"
            onClick={() => fileInputRef.current?.click()}
            title="Upload custom wallpaper image"
          >
            <Upload size={13} />
            <span>Upload Custom</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* 3D BOOK DISPLAY STAGE */}
      <div
        className="book-3d-stage"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDraggingUpload && (
          <div className="book-drag-overlay">
            <Upload size={32} />
            <span>Drop image to create custom theme spread</span>
          </div>
        )}

        {/* Ambient Stage Glow based on active theme accent */}
        <div
          className="book-ambient-glow"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${currentItem.accentColor}28 0%, transparent 70%)`,
          }}
        />

        {/* Navigation Arrows */}
        <button
          type="button"
          className="book-nav-arrow book-nav-prev"
          onClick={handlePrev}
          title="Previous theme (Left Arrow)"
          aria-label="Previous theme"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          type="button"
          className="book-nav-arrow book-nav-next"
          onClick={handleNext}
          title="Next theme (Right Arrow)"
          aria-label="Next theme"
        >
          <ChevronRight size={22} />
        </button>

        {/* THE 3D OPEN BOOK SPREAD */}
        <div className={`open-book-spread ${isFlipping ? `flipping-${flipDirection}` : ''}`}>
          {/* Central Spine shadow */}
          <div className="book-spine-crease" />

          {/* LEFT PAGE: Visual Story, Typography & Atmosphere Spec */}
          <div className="book-page book-page-left">
            <div className="page-inner-scrim" />
            
            <div className="page-header-meta">
              <span className="page-category-label">Atmosphere Specimen</span>
              <span className="page-mode-badge">
                {currentItem.mode} surface
              </span>
            </div>

            <div className="page-content-flow">
              <div className="theme-number-label">
                THEME #{String(currentIndex + 1).padStart(2, '0')}
              </div>

              <h2 className="page-theme-title">
                {currentItem.name}
              </h2>

              <p className="page-theme-desc">
                {currentItem.description}
              </p>

              <div className="page-tags-row">
                {currentItem.tags.map((tag) => (
                  <span key={tag} className="page-tag-chip">
                    {tag}
                  </span>
                ))}
                {currentItem.isCustom && (
                  <span className="page-tag-chip custom-chip">
                    Custom Upload
                  </span>
                )}
              </div>

              {/* Palette & Specimen Bar */}
              <div className="page-specimen-box">
                <div className="specimen-label-row">
                  <span>Palette &amp; Accent</span>
                  <span className="specimen-hex" style={{ color: currentItem.accentColor }}>
                    {currentItem.accentColor.toUpperCase()}
                  </span>
                </div>
                <div className="specimen-swatch-bar">
                  <div className="specimen-swatch-fill" style={{ backgroundColor: currentItem.accentColor }} />
                  <div className="specimen-swatch-fill" style={{ backgroundColor: `${currentItem.accentColor}99` }} />
                  <div className="specimen-swatch-fill" style={{ backgroundColor: `${currentItem.accentColor}44` }} />
                  <div className="specimen-swatch-fill" style={{ backgroundColor: '#111218' }} />
                </div>
              </div>
            </div>

            <div className="page-footer-actions">
              <button
                type="button"
                className={`btn-apply-theme ${isActiveTheme ? 'is-active' : ''}`}
                onClick={() => onSelectTheme(currentItem.id)}
                title="Apply this theme immediately to LeetCode and Codeforces"
              >
                {isActiveTheme ? (
                  <>
                    <Check size={14} strokeWidth={2.5} />
                    <span>Active on Platforms</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Apply Theme</span>
                  </>
                )}
              </button>

              {currentItem.isCustom && (
                <button
                  type="button"
                  className="btn-page-delete"
                  onClick={(e) => onDeleteCustomTheme(currentItem.id, e)}
                  title="Delete this custom theme"
                  aria-label="Delete custom theme"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT PAGE: High-Art Wallpaper Plate & Detail Reveal Button */}
          <div
            className="book-page book-page-right"
            onClick={() => onOpenDetail(currentItem)}
            title="Click to open detailed Atelier view"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenDetail(currentItem);
              }
            }}
          >
            <div className="page-art-frame">
              <img
                src={currentItem.wallpaperUrl || currentItem.thumbnailUrl}
                alt={currentItem.name}
                className="page-art-image"
                loading="eager"
              />
              <div className="page-art-vignette" />
              
              {isActiveTheme && (
                <div className="art-active-seal">
                  <Check size={12} strokeWidth={3} />
                  <span>ACTIVE</span>
                </div>
              )}

              {/* Floating Inspect Pill */}
              <div className="page-art-inspect-pill">
                <span>Inspect &amp; Customize</span>
                <ArrowRight size={13} className="inspect-arrow" />
              </div>
            </div>

            <div className="page-art-caption">
              <div className="caption-text-group">
                <span className="caption-heading">{currentItem.name}</span>
                <span className="caption-sub">Press Space or Enter to open dedicated workstation</span>
              </div>
              <Maximize2 size={13} className="caption-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* QUICK THUMBNAIL SPREAD STRIP (Dock Navigator) */}
      <div className="book-dock-navigator" role="tablist" aria-label="Theme quick switcher">
        {items.map((theme, idx) => {
          const isSelected = idx === currentIndex;
          const isActive = theme.id === activeThemeId;
          return (
            <button
              key={theme.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`dock-theme-item ${isSelected ? 'selected' : ''} ${isActive ? 'active-platform' : ''}`}
              onClick={() => handleJumpToIndex(idx)}
              title={`${theme.name}${isActive ? ' (Active)' : ''}`}
            >
              <div className="dock-thumb-box">
                <img src={theme.thumbnailUrl || theme.wallpaperUrl} alt="" loading="lazy" />
                {isActive && <div className="dock-active-dot" style={{ backgroundColor: theme.accentColor }} />}
              </div>
              <span className="dock-theme-title">{theme.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
