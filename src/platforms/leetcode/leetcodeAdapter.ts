import { UserSettings, ThemeConfig } from '../../types/theme';
import { fireAcceptedCelebration } from '../../effects/confetti';
import { playAcceptedSound, playRejectedSound } from '../../audio/soundPlayer';

export class LeetCodeAdapter {
  private observer: MutationObserver | null = null;
  private htmlObserver: MutationObserver | null = null;
  private alertedVerdicts = new Set<string>();
  private quickPill: HTMLElement | null = null;
  private weAddedDarkClass = false;

  public init(settings: UserSettings): void {
    this.syncNativeThemeState(settings);
    this.initHtmlObserver(settings);
    this.initVerdictWatcher(settings);
    if (settings.quickSwitchVisible && settings.enabled) {
      this.renderQuickPill(settings.currentConfig);
    }
  }

  public update(settings: UserSettings): void {
    this.syncNativeThemeState(settings);
    if (!settings.enabled || !settings.quickSwitchVisible) {
      this.removeQuickPill();
    } else {
      this.renderQuickPill(settings.currentConfig);
    }
  }

  private initHtmlObserver(settings: UserSettings): void {
    if (this.htmlObserver) return;

    this.htmlObserver = new MutationObserver(() => {
      if (settings.enabled && settings.currentConfig.mode !== 'light') {
        if (!document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          this.weAddedDarkClass = true;
        }
      }
    });

    this.htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
  }

  private syncNativeThemeState(settings: UserSettings): void {
    if (!settings.enabled) {
      if (this.weAddedDarkClass) {
        document.documentElement.classList.remove('dark');
        document.documentElement.removeAttribute('data-theme');
        this.weAddedDarkClass = false;
      }
      return;
    }

    const config = settings.currentConfig;
    if (config.mode !== 'light') {
      if (!document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        this.weAddedDarkClass = true;
      }
    } else {
      if (this.weAddedDarkClass) {
        document.documentElement.classList.remove('dark');
        document.documentElement.removeAttribute('data-theme');
        this.weAddedDarkClass = false;
      }
    }
  }

  private initVerdictWatcher(settings: UserSettings): void {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      if (!settings.enabled) return;
      const config = settings.currentConfig;

      // Check for LeetCode Accepted verdict
      const acceptedEls = document.querySelectorAll(
        '[data-e2e-locator="submission-result"], .text-green-s, [class*="text-green-s"]'
      );
      acceptedEls.forEach((el) => {
        const text = el.textContent?.trim().toLowerCase() || '';
        if (text.includes('accepted')) {
          if (!this.alertedVerdicts.has('lc_ac_recent')) {
            this.alertedVerdicts.add('lc_ac_recent');
            setTimeout(() => this.alertedVerdicts.delete('lc_ac_recent'), 4000);

            if (config.confettiEnabled) {
              fireAcceptedCelebration();
            }
            if (config.soundEnabled) {
              playAcceptedSound(config.soundVolume, true);
            }
          }
        }
      });

      // Check for LeetCode Wrong Answer / Runtime Error
      const rejectedEls = document.querySelectorAll(
        '.text-red-s, [class*="text-red-s"]'
      );
      rejectedEls.forEach((el) => {
        const text = el.textContent?.trim().toLowerCase() || '';
        if (
          text.includes('wrong answer') ||
          text.includes('runtime error') ||
          text.includes('time limit exceeded')
        ) {
          if (!this.alertedVerdicts.has('lc_wa_recent')) {
            this.alertedVerdicts.add('lc_wa_recent');
            setTimeout(() => this.alertedVerdicts.delete('lc_wa_recent'), 4000);

            if (config.soundEnabled) {
              playRejectedSound(config.soundVolume, true);
            }
          }
        }
      });
    });

    if (!document.body) return;

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private renderQuickPill(config: ThemeConfig): void {
    if (!document.body) return;

    if (!this.quickPill) {
      this.quickPill = document.createElement('div');
      this.quickPill.id = 'themeflow-quick-pill';
      this.quickPill.title = 'ThemeFlow LeetCode: Click to open Theme Studio';
      this.quickPill.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: 'open_studio' });
        }
      });
      document.body.appendChild(this.quickPill);
    }

    this.quickPill.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="m4.93 4.93 4.24 4.24"></path>
        <path d="m14.83 9.17 4.24-4.24"></path>
        <path d="m14.83 14.83 4.24 4.24"></path>
        <path d="m9.17 14.83-4.24 4.24"></path>
      </svg>
      <span class="tf-pill-text">LeetCode • ${config.name}</span>
    `;
  }

  private removeQuickPill(): void {
    if (this.quickPill && this.quickPill.parentNode) {
      this.quickPill.parentNode.removeChild(this.quickPill);
      this.quickPill = null;
    }
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.htmlObserver) {
      this.htmlObserver.disconnect();
      this.htmlObserver = null;
    }
    this.removeQuickPill();
    if (this.weAddedDarkClass) {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      this.weAddedDarkClass = false;
    }
  }
}
