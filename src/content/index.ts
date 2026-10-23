import { UserSettings, ThemeConfig } from '../types/theme';
import { getSettings, subscribeToSettingsChanges, getCustomImageFromDB } from '../storage/storage';
import { EffectManager } from '../effects/particles';
import { fireAcceptedCelebration } from '../effects/confetti';
import { playAcceptedSound, playRejectedSound } from '../audio/soundPlayer';

let currentSettings: UserSettings | null = null;
const effectManager = new EffectManager();
const alertedVerdicts = new Set<string>();

// Ensure background DOM layers exist
function ensureBackgroundLayers(): { bgLayer: HTMLElement; overlayLayer: HTMLElement } {
  let bgLayer = document.getElementById('themeflow-bg-layer');
  if (!bgLayer) {
    bgLayer = document.createElement('div');
    bgLayer.id = 'themeflow-bg-layer';
    document.body.prepend(bgLayer);
  }

  let overlayLayer = document.getElementById('themeflow-overlay-layer');
  if (!overlayLayer) {
    overlayLayer = document.createElement('div');
    overlayLayer.id = 'themeflow-overlay-layer';
    document.body.prepend(overlayLayer);
  }

  return { bgLayer, overlayLayer };
}

// Convert image relative path to browser runtime URL
async function resolveImageUrl(config: ThemeConfig): Promise<string> {
  if (config.isCustom && config.id) {
    const dbUrl = await getCustomImageFromDB(config.id);
    if (dbUrl) return dbUrl;
    if (config.imagePath.startsWith('data:')) return config.imagePath;
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    return chrome.runtime.getURL(config.imagePath);
  }
  return config.imagePath;
}

// Apply theme configuration to document
async function applyTheme(settings: UserSettings) {
  currentSettings = settings;

  const { bgLayer, overlayLayer } = ensureBackgroundLayers();

  if (!settings.enabled) {
    document.documentElement.classList.remove('themeflow-active');
    document.body.classList.remove('themeflow-active');
    bgLayer.style.display = 'none';
    overlayLayer.style.display = 'none';
    effectManager.stop();
    removeQuickPill();
    return;
  }

  document.documentElement.classList.add('themeflow-active');
  document.body.classList.add('themeflow-active');
  bgLayer.style.display = 'block';
  overlayLayer.style.display = 'block';

  const config = settings.currentConfig;
  const root = document.documentElement;

  // Set CSS variables
  root.style.setProperty('--tf-accent', config.accentColor);
  root.style.setProperty('--tf-accent-glow', `${config.accentColor}44`);
  root.style.setProperty('--tf-code-font', `'${config.fontFamily}', Consolas, monospace`);

  // Compute surface colors based on mode
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

  // Background image & filters
  const imgUrl = await resolveImageUrl(config);
  bgLayer.style.backgroundImage = `url("${imgUrl}")`;
  bgLayer.style.filter = `brightness(${config.brightness}%) contrast(${config.contrast}%) blur(${config.blur}px)`;
  overlayLayer.style.backgroundColor = overlayColor;

  // Visual effects
  effectManager.setEffect(config.effect);

  // Quick pill
  if (settings.quickSwitchVisible) {
    renderQuickPill(config);
  } else {
    removeQuickPill();
  }
}

// Render floating pill in bottom right of Codeforces
function renderQuickPill(config: ThemeConfig) {
  let pill = document.getElementById('themeflow-quick-pill');
  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'themeflow-quick-pill';
    pill.title = 'ThemeFlow: Click to open Theme Studio';
    pill.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'open_studio' });
      }
    });
    document.body.appendChild(pill);
  }

  pill.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="m4.93 4.93 4.24 4.24"></path>
      <path d="m14.83 9.17 4.24-4.24"></path>
      <path d="m14.83 14.83 4.24 4.24"></path>
      <path d="m9.17 14.83-4.24 4.24"></path>
    </svg>
    <span class="tf-pill-text">${config.name}</span>
  `;
}

function removeQuickPill() {
  const pill = document.getElementById('themeflow-quick-pill');
  if (pill && pill.parentNode) {
    pill.parentNode.removeChild(pill);
  }
}

// Watch Codeforces submission tables for verdicts
function initVerdictWatcher() {
  const observer = new MutationObserver(() => {
    if (!currentSettings || !currentSettings.enabled) return;
    const config = currentSettings.currentConfig;

    // Check for accepted verdicts
    const acceptedElements = document.querySelectorAll('.verdict-accepted, span[submissionverdict="OK"]');
    acceptedElements.forEach((el) => {
      const row = el.closest('tr');
      const submissionId = row?.getAttribute('data-submission-id') || el.textContent?.trim() || '';
      const key = `ac_${submissionId}`;

      if (submissionId && !alertedVerdicts.has(key)) {
        alertedVerdicts.add(key);
        if (config.confettiEnabled) {
          fireAcceptedCelebration();
        }
        if (config.soundEnabled) {
          playAcceptedSound(config.soundVolume, true);
        }
      }
    });

    // Check for rejected verdicts
    const rejectedElements = document.querySelectorAll(
      '.verdict-rejected, span[submissionverdict="WRONG_ANSWER"], span[submissionverdict="TIME_LIMIT_EXCEEDED"], span[submissionverdict="MEMORY_LIMIT_EXCEEDED"]'
    );
    rejectedElements.forEach((el) => {
      const row = el.closest('tr');
      const submissionId = row?.getAttribute('data-submission-id') || el.textContent?.trim() || '';
      const key = `wa_${submissionId}`;

      if (submissionId && !alertedVerdicts.has(key)) {
        alertedVerdicts.add(key);
        if (config.soundEnabled) {
          playRejectedSound(config.soundVolume, true);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// Initialization
async function init() {
  const settings = await getSettings();
  await applyTheme(settings);

  subscribeToSettingsChanges(async (newSettings) => {
    await applyTheme(newSettings);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVerdictWatcher);
  } else {
    initVerdictWatcher();
  }
}

init().catch(console.error);
