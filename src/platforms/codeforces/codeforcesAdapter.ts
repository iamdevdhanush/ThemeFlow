import { UserSettings, ThemeConfig } from '../../types/theme';
import { fireAcceptedCelebration } from '../../effects/confetti';
import { playAcceptedSound, playRejectedSound } from '../../audio/soundPlayer';

export class CodeforcesAdapter {
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

      // Check for accepted verdicts
      const acceptedElements = document.querySelectorAll(
        '.verdict-accepted, span[submissionverdict="OK"]'
      );
      acceptedElements.forEach((el) => {
        const row = el.closest('tr');
        const submissionId = row?.getAttribute('data-submission-id') || el.textContent?.trim() || '';
        const key = `cf_ac_${submissionId}`;

        if (submissionId && !this.alertedVerdicts.has(key)) {
          this.alertedVerdicts.add(key);
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
        const key = `cf_wa_${submissionId}`;

        if (submissionId && !this.alertedVerdicts.has(key)) {
          this.alertedVerdicts.add(key);
          if (config.soundEnabled) {
            playRejectedSound(config.soundVolume, true);
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
    if (!document.body) return;

    if (!this.quickPill) {
      this.quickPill = document.createElement('div');
      this.quickPill.id = 'themeflow-quick-pill';
      this.quickPill.title = 'ThemeFlow Codeforces: Click to open Theme Studio';
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
      <span class="tf-pill-text">Codeforces • ${config.name}</span>
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
