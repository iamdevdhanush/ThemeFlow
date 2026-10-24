import { UserSettings, ThemeConfig } from '../../types/theme';
import { fireAcceptedCelebration } from '../../effects/celebration';
import { playAcceptedSound, playRejectedSound } from '../../audio/soundPlayer';

export class LeetCodeAdapter {
  private observer: MutationObserver | null = null;
  private htmlObserver: MutationObserver | null = null;
  private seenVerdictElements = new WeakSet<Element>();
  private alertedSubmissionKeys = new Set<string>();
  private submissionPending = false;
  private submissionPendingTime = 0;
  private quickPill: HTMLElement | null = null;
  private weAddedDarkClass = false;
  private boundClickHandler: ((e: MouseEvent) => void) | null = null;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  public init(settings: UserSettings): void {
    this.recordExistingVerdictsBaseline();
    this.attachSubmissionListeners();
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

  /**
   * Pre-records existing verdicts on initial page load to prevent historical
   * submissions or "Solved" badges from falsely triggering celebrations.
   */
  private recordExistingVerdictsBaseline(): void {
    const existing = document.querySelectorAll(
      '[data-e2e-locator="submission-result"], .text-green-s, [class*="text-green-s"], .text-red-s, [class*="text-red-s"]'
    );
    existing.forEach((el) => {
      this.seenVerdictElements.add(el);
    });
  }

  /**
   * Listens for user interactions that initiate a submission (Submit button click or Ctrl/Cmd+Enter).
   */
  private attachSubmissionListeners(): void {
    this.boundClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const submitBtn = target.closest(
        'button[data-e2e-locator="console-submit-button"], button[data-cy="submit-code-btn"], button'
      );
      if (submitBtn) {
        const text = submitBtn.textContent?.trim().toLowerCase() || '';
        if (text.includes('submit')) {
          this.submissionPending = true;
          this.submissionPendingTime = Date.now();
        }
      }
    };

    this.boundKeyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        this.submissionPending = true;
        this.submissionPendingTime = Date.now();
      }
    };

    document.addEventListener('click', this.boundClickHandler, true);
    document.addEventListener('keydown', this.boundKeyHandler, true);
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

    this.observer = new MutationObserver((mutations) => {
      if (!settings.enabled) return;
      const config = settings.currentConfig;

      // Track LeetCode judging/pending status transition
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'characterData') {
          const target = m.target as HTMLElement;
          const text = target.textContent?.trim().toLowerCase() || '';
          if (text.includes('pending') || text.includes('judging')) {
            this.submissionPending = true;
            this.submissionPendingTime = Date.now();
          }
        }
      }

      // Check for Accepted verdict
      const acceptedEls = document.querySelectorAll(
        '[data-e2e-locator="submission-result"], [class*="text-green-s"], .text-green-s'
      );

      acceptedEls.forEach((el) => {
        const text = el.textContent?.trim() || '';
        const lower = text.toLowerCase();

        // Must be exactly "Accepted" (not "Solved", not "Accepted Solutions")
        if (lower === 'accepted' || lower.startsWith('accepted')) {
          if (this.seenVerdictElements.has(el)) return;

          // Only fire if submission was triggered within the last 60 seconds
          const isRecentSubmission = this.submissionPending && (Date.now() - this.submissionPendingTime < 60000);

          if (isRecentSubmission) {
            const uniqueKey = `lc_${Date.now()}_${text}`;
            if (!this.alertedSubmissionKeys.has(uniqueKey)) {
              this.alertedSubmissionKeys.add(uniqueKey);
              this.seenVerdictElements.add(el);
              this.submissionPending = false;

              if (config.confettiEnabled) {
                fireAcceptedCelebration({
                  anchorElement: el as HTMLElement,
                  themeAccent: config.accentColor,
                  verdictText: 'ACCEPTED',
                });
              }

              if (config.soundEnabled) {
                playAcceptedSound(config.soundVolume, true);
              }
            }
          } else {
            // Baseline/historical element, mark as seen
            this.seenVerdictElements.add(el);
          }
        }
      });

      // Check for Rejected verdict (Wrong Answer, Runtime Error, etc.)
      const rejectedEls = document.querySelectorAll(
        '[data-e2e-locator="submission-result"], [class*="text-red-s"], .text-red-s'
      );

      rejectedEls.forEach((el) => {
        const text = el.textContent?.trim().toLowerCase() || '';
        if (
          text.includes('wrong answer') ||
          text.includes('runtime error') ||
          text.includes('time limit exceeded') ||
          text.includes('memory limit exceeded') ||
          text.includes('compile error')
        ) {
          if (this.seenVerdictElements.has(el)) return;

          const isRecentSubmission = this.submissionPending && (Date.now() - this.submissionPendingTime < 60000);
          this.seenVerdictElements.add(el);

          if (isRecentSubmission) {
            this.submissionPending = false;
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
    if (this.boundClickHandler) {
      document.removeEventListener('click', this.boundClickHandler, true);
      this.boundClickHandler = null;
    }
    if (this.boundKeyHandler) {
      document.removeEventListener('keydown', this.boundKeyHandler, true);
      this.boundKeyHandler = null;
    }
    this.removeQuickPill();
    if (this.weAddedDarkClass) {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      this.weAddedDarkClass = false;
    }
  }
}
