import { UserSettings, ThemeConfig } from '../../types/theme';
import { fireAcceptedCelebration } from '../../effects/confetti';
import { playAcceptedSound, playRejectedSound } from '../../audio/soundPlayer';

export class LeetCodeAdapter {
  private observer: MutationObserver | null = null;
  private alertedVerdicts = new Set<string>();
  private quickPill: HTMLElement | null = null;

  public init(settings: UserSettings): void {
    this.initVerdictWatcher(settings);
    if (settings.quickSwitchVisible && settings.enabled) {
      this.renderQuickPill(settings.currentConfig);
    }
  }

  public update(settings: UserSettings): void {
    if (!settings.enabled || !settings.quickSwitchVisible) {
      this.removeQuickPill();
    } else {
      this.renderQuickPill(settings.currentConfig);
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
          const key = `lc_ac_${Date.now()}`;
          // throttle triggers within 4 seconds
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

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private renderQuickPill(config: ThemeConfig): void {
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    this.removeQuickPill();
  }
}
