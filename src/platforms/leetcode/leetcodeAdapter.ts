import { UserSettings, ThemeConfig } from '../../types/theme';
import { fireAcceptedCelebration, stopAcceptedCelebration } from '../../effects/celebration';
import { playAcceptedSound, playRejectedSound } from '../../audio/soundPlayer';

export class LeetCodeAdapter {
  private observer: MutationObserver | null = null;
  private htmlObserver: MutationObserver | null = null;
  private seenVerdictElements = new WeakSet<Element>();
  private alertedSubmissionKeys = new Set<string>();
  private submissionPending = false;
  private submissionPendingTime = 0;
  private currentSubmissionSessionId: string | null = null;
  private quickPill: HTMLElement | null = null;
  private weAddedDarkClass = false;
  private boundClickHandler: ((e: MouseEvent) => void) | null = null;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private boundPopstateHandler: (() => void) | null = null;
  private lastUrl = '';

  public init(settings: UserSettings): void {
    this.lastUrl = window.location.href;
    this.recordExistingVerdictsBaseline();
    this.attachSubmissionListeners();
    this.attachNavigationListeners();
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
   * Explicitly avoids triggering for "Submissions" tab navigation or historical views.
   */
  private attachSubmissionListeners(): void {
    this.boundClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // If user clicked on a tab header (e.g. "Submissions", "Solutions", "Editorial", "Description")
      // immediately cancel any pending submission state to prevent historical records from alerting.
      const tabOrNavLink = target.closest(
        '[role="tab"], a[href*="/submissions/"], [data-layout-path*="submissions"], [class*="tab-item"]'
      );
      if (tabOrNavLink) {
        const text = tabOrNavLink.textContent?.trim().toLowerCase() || '';
        if (text.includes('submission') || text.includes('solution') || text.includes('editorial') || text.includes('description')) {
          this.cancelPendingSubmission();
          return;
        }
      }

      // Check for genuine LeetCode submit button
      const submitBtn = target.closest(
        'button[data-e2e-locator="console-submit-button"], button[data-cy="submit-code-btn"], button'
      );

      if (submitBtn) {
        const text = submitBtn.textContent?.trim().toLowerCase() || '';
        const isExplicitSubmitBtn = Boolean(
          submitBtn.matches('button[data-e2e-locator="console-submit-button"], button[data-cy="submit-code-btn"]')
        );

        // Disallow matching tabs or generic buttons like "Submissions"
        const isSubmitAction = isExplicitSubmitBtn || text === 'submit' || text === 'submit code' || (text.startsWith('submit') && !text.includes('submission'));

        if (isSubmitAction) {
          this.startPendingSubmission();
        }
      }
    };

    this.boundKeyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        this.startPendingSubmission();
      }
    };

    document.addEventListener('click', this.boundClickHandler, true);
    document.addEventListener('keydown', this.boundKeyHandler, true);
  }

  private startPendingSubmission(): void {
    this.submissionPending = true;
    this.submissionPendingTime = Date.now();
    this.currentSubmissionSessionId = `lc_sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private cancelPendingSubmission(): void {
    this.submissionPending = false;
    this.currentSubmissionSessionId = null;
  }

  /**
   * Observes SPA navigation to reset state and stop celebrations between problems.
   */
  private attachNavigationListeners(): void {
    this.boundPopstateHandler = () => {
      this.handleUrlChange();
    };
    window.addEventListener('popstate', this.boundPopstateHandler);
  }

  private handleUrlChange(): void {
    if (window.location.href !== this.lastUrl) {
      this.lastUrl = window.location.href;
      stopAcceptedCelebration();
      this.cancelPendingSubmission();
      this.recordExistingVerdictsBaseline();
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

    this.observer = new MutationObserver((mutations) => {
      // Check for URL change during SPA transitions
      if (window.location.href !== this.lastUrl) {
        this.handleUrlChange();
      }

      if (!settings.enabled) return;
      const config = settings.currentConfig;

      // Track LeetCode judging/pending status transition
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'characterData') {
          const target = m.target as HTMLElement;
          const text = target.textContent?.trim().toLowerCase() || '';
          if (text.includes('pending') || text.includes('judging')) {
            if (!this.submissionPending) {
              this.startPendingSubmission();
            } else {
              this.submissionPendingTime = Date.now();
            }
          }
        }
      }

      // Check for Accepted verdict
      const acceptedEls = document.querySelectorAll(
        '[data-e2e-locator="submission-result"], [class*="text-green-s"], .text-green-s, [class*="text-sd-green"]'
      );

      acceptedEls.forEach((el) => {
        const text = el.textContent?.trim() || '';
        const lower = text.toLowerCase();

        // Must strictly indicate "Accepted" (not "Solved", not "Accepted Solutions")
        if (lower === 'accepted' || lower.startsWith('accepted')) {
          if (this.seenVerdictElements.has(el)) return;

          // Never trigger for items in historical submission tables, lists, or links
          const isHistoricalList = Boolean(
            el.closest('table, [role="table"], [role="row"], [class*="submission-list"], [data-layout-path*="submissions"], a[href*="/submissions/"]')
          );

          if (isHistoricalList) {
            this.seenVerdictElements.add(el);
            return;
          }

          // Must be initiated by an active submission session within the last 45 seconds
          const isRecentSubmission = this.submissionPending && (Date.now() - this.submissionPendingTime < 45000);

          if (isRecentSubmission && this.currentSubmissionSessionId) {
            const sessionKey = this.currentSubmissionSessionId;

            if (!this.alertedSubmissionKeys.has(sessionKey)) {
              this.alertedSubmissionKeys.add(sessionKey);
              this.seenVerdictElements.add(el);
              this.submissionPending = false;
              this.currentSubmissionSessionId = null;

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
            // Mark baseline or unconfirmed element as seen
            this.seenVerdictElements.add(el);
          }
        }
      });

      // Check for Rejected verdict (Wrong Answer, Runtime Error, Time Limit Exceeded, etc.)
      const rejectedEls = document.querySelectorAll(
        '[data-e2e-locator="submission-result"], [class*="text-red-s"], .text-red-s, [class*="text-sd-red"]'
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
          this.seenVerdictElements.add(el);

          // If a pending submission failed, terminate pending state immediately
          // Failed verdicts must NEVER trigger the celebration!
          if (this.submissionPending && (Date.now() - this.submissionPendingTime < 45000)) {
            this.submissionPending = false;
            this.currentSubmissionSessionId = null;
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
    stopAcceptedCelebration();
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
    if (this.boundPopstateHandler) {
      window.removeEventListener('popstate', this.boundPopstateHandler);
      this.boundPopstateHandler = null;
    }
    this.removeQuickPill();
    if (this.weAddedDarkClass) {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      this.weAddedDarkClass = false;
    }
  }
}
