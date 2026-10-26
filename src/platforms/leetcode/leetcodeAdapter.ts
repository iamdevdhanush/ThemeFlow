import { UserSettings, ThemeConfig } from '../../types/theme';
import { verdictTriggerController } from '../../effects/verdictTriggerController';
import { QuickPillController } from '../common/QuickPillController';

export class LeetCodeAdapter {
  private observer: MutationObserver | null = null;
  private htmlObserver: MutationObserver | null = null;
  private seenVerdictElements = new WeakSet<Element>();
  private alertedSubmissionKeys = new Set<string>();
  private submissionPending = false;
  private submissionPendingTime = 0;
  private currentSubmissionSessionId: string | null = null;
  private quickPill = new QuickPillController({ platformName: 'LeetCode' });
  private weAddedDarkClass = false;
  private boundClickHandler: ((e: MouseEvent) => void) | null = null;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private boundPopstateHandler: (() => void) | null = null;
  private lastUrl = '';
  private currentSettings: UserSettings | null = null;
  private reapplyCallback: (() => Promise<void>) | null = null;

  public init(settings: UserSettings, reapplyCallback?: () => Promise<void>): void {
    this.currentSettings = settings;
    if (reapplyCallback) {
      this.reapplyCallback = reapplyCallback;
    }
    this.lastUrl = typeof window !== 'undefined' ? window.location.href : '';
    this.ensureThemeClasses(settings);
    this.recordExistingVerdictsBaseline();
    this.attachSubmissionListeners();
    this.attachNavigationListeners();
    this.syncNativeThemeState(settings);
    this.initHtmlObserver(settings);
    this.initVerdictWatcher(settings);
    if (settings.quickSwitchVisible && settings.enabled) {
      this.quickPill.render(settings.currentConfig);
    }
  }

  public update(settings: UserSettings): void {
    this.currentSettings = settings;
    this.ensureThemeClasses(settings);
    this.syncNativeThemeState(settings);
    if (!settings.enabled || !settings.quickSwitchVisible) {
      this.quickPill.remove();
    } else {
      this.quickPill.render(settings.currentConfig);
    }
  }

  /**
   * Resiliently enforces themeflow-active and themeflow-leetcode classes on both html and body
   * preventing Next.js hydration or client router from stripping theme classes.
   */
  public ensureThemeClasses(settings: UserSettings): void {
    if (!settings.enabled || typeof document === 'undefined') return;

    if (document.documentElement && !document.documentElement.classList.contains('themeflow-leetcode')) {
      document.documentElement.classList.add('themeflow-active', 'themeflow-leetcode');
    }
    if (document.body && !document.body.classList.contains('themeflow-leetcode')) {
      document.body.classList.add('themeflow-active', 'themeflow-leetcode');
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
    if (typeof window !== 'undefined' && window.location.href !== this.lastUrl) {
      this.lastUrl = window.location.href;
      verdictTriggerController.stop();
      this.cancelPendingSubmission();
      this.recordExistingVerdictsBaseline();

      // Ensure theme classes and background layers persist across SPA route transitions
      if (this.currentSettings && this.currentSettings.enabled) {
        this.ensureThemeClasses(this.currentSettings);
        if (this.reapplyCallback) {
          this.reapplyCallback().catch((err) => {
            console.warn('[ThemeFlow] SPA reapply warning:', err);
          });
        }
        if (this.currentSettings.quickSwitchVisible) {
          this.quickPill.render(this.currentSettings.currentConfig);
        }
      }
    }
  }

  private initHtmlObserver(settings: UserSettings): void {
    if (this.htmlObserver) return;

    const enforceTheme = () => {
      const active = this.currentSettings || settings;
      if (!active.enabled) return;
      this.ensureThemeClasses(active);

      if (active.currentConfig.mode !== 'light' && typeof document !== 'undefined' && document.documentElement) {
        if (!document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          this.weAddedDarkClass = true;
        }
      }
    };

    this.htmlObserver = new MutationObserver(() => {
      enforceTheme();
    });

    if (typeof document !== 'undefined' && document.documentElement) {
      this.htmlObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme'],
      });
    }

    if (typeof document !== 'undefined' && document.body) {
      this.htmlObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
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

  /**
   * Checks whether a mutation target belongs to Monaco editor typing / cursor movements.
   * Used to filter out keystroke noise and avoid layout thrashing.
   */
  private isEditorMutationTarget(node: Node | null): boolean {
    if (!node) return false;
    const el = node.nodeType === 1 ? (node as Element) : node.parentElement;
    if (!el) return false;
    if (typeof el.closest === 'function') {
      return Boolean(
        el.closest(
          '.monaco-editor, .view-line, .view-lines, .monaco-mouse-cursor-text, .overflow-guard, #themeflow-anime-celebration, #themeflow-overlay-layer, #themeflow-bg-layer'
        )
      );
    }
    return false;
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

      let hasNonEditorMutation = false;

      // Track LeetCode judging/pending status transition
      for (const m of mutations) {
        if (this.isEditorMutationTarget(m.target)) {
          continue;
        }
        hasNonEditorMutation = true;

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

      // If no submission is pending and all mutations were isolated to Monaco editor keystrokes,
      // skip expensive full-DOM queries to preserve high-performance coding responsiveness.
      if (!this.submissionPending && !hasNonEditorMutation) {
        return;
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

              verdictTriggerController.triggerAccepted({
                anchorElement: el as HTMLElement,
                config,
                verdictText: 'ACCEPTED',
              });
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
            verdictTriggerController.triggerRejected({ config });
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

  public destroy(): void {
    verdictTriggerController.stop();
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
    this.quickPill.destroy();
    if (this.weAddedDarkClass) {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      this.weAddedDarkClass = false;
    }
  }
}
