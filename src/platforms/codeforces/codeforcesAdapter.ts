import { UserSettings, ThemeConfig } from '../../types/theme';
import { verdictTriggerController } from '../../effects/verdictTriggerController';
import { QuickPillController } from '../common/QuickPillController';

export class CodeforcesAdapter {
  private observer: MutationObserver | null = null;
  private alertedVerdicts = new Set<string>();
  private historicalSubmissionIds = new Set<string>();
  private evaluatingSubmissions = new Set<string>();
  private quickPill = new QuickPillController({ platformName: 'Codeforces' });
  private boundSubmitHandler: ((e: MouseEvent) => void) | null = null;

  public init(settings: UserSettings): void {
    this.recordExistingSubmissionsBaseline();
    this.attachSubmitListener();
    this.initVerdictWatcher(settings);
    if (settings.quickSwitchVisible && settings.enabled) {
      this.quickPill.render(settings.currentConfig);
    }
  }

  public update(settings: UserSettings): void {
    if (!settings.enabled || !settings.quickSwitchVisible) {
      this.quickPill.remove();
    } else {
      this.quickPill.render(settings.currentConfig);
    }
  }

  /**
   * Pre-records existing submissions present on initial page load so historical
   * submissions in tables never trigger celebration.
   */
  private recordExistingSubmissionsBaseline(): void {
    const existingRows = document.querySelectorAll('tr[data-submission-id]');
    existingRows.forEach((row) => {
      const id = row.getAttribute('data-submission-id');
      if (id) {
        this.historicalSubmissionIds.add(id);
      }
    });

    // Also mark any pre-rendered verdict spans as baseline
    const existingVerdicts = document.querySelectorAll(
      '.verdict-accepted, .verdict-rejected, span[submissionverdict]'
    );
    existingVerdicts.forEach((el) => {
      const row = el.closest('tr');
      const id = row?.getAttribute('data-submission-id') || el.id || '';
      if (id) {
        this.historicalSubmissionIds.add(id);
      }
    });
  }

  private attachSubmitListener(): void {
    this.boundSubmitHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const submitBtn = target.closest('input[type="submit"], button');
      if (submitBtn) {
        const val = (submitBtn.getAttribute('value') || submitBtn.textContent || '').toLowerCase();
        if (val.includes('submit')) {
          // User initiated a new submission
        }
      }
    };
    document.addEventListener('click', this.boundSubmitHandler, true);
  }

  private initVerdictWatcher(settings: UserSettings): void {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      if (!settings.enabled) return;
      const config = settings.currentConfig;

      // Track submissions currently evaluating / running
      const testingElements = document.querySelectorAll(
        'span[submissionverdict="TESTING"], span[submissionverdict="UNKNOWN"], .verdict-waiting'
      );
      testingElements.forEach((el) => {
        const row = el.closest('tr');
        const submissionId = row?.getAttribute('data-submission-id');
        if (submissionId) {
          this.evaluatingSubmissions.add(submissionId);
        }
      });

      // Check for confirmed accepted verdicts
      const acceptedElements = document.querySelectorAll(
        '.verdict-accepted, span[submissionverdict="OK"]'
      );

      acceptedElements.forEach((el) => {
        const row = el.closest('tr');
        const submissionId = row?.getAttribute('data-submission-id') || el.textContent?.trim() || '';
        const key = `cf_ac_${submissionId}`;

        // Skip historical submissions that were present on page load
        if (submissionId && this.historicalSubmissionIds.has(submissionId) && !this.evaluatingSubmissions.has(submissionId)) {
          return;
        }

        if (submissionId && !this.alertedVerdicts.has(key)) {
          this.alertedVerdicts.add(key);
          this.evaluatingSubmissions.delete(submissionId);

          verdictTriggerController.triggerAccepted({
            anchorElement: el as HTMLElement,
            config,
            verdictText: 'ACCEPTED',
          });
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

        if (submissionId && this.historicalSubmissionIds.has(submissionId) && !this.evaluatingSubmissions.has(submissionId)) {
          return;
        }

        if (submissionId && !this.alertedVerdicts.has(key)) {
          this.alertedVerdicts.add(key);
          this.evaluatingSubmissions.delete(submissionId);

          verdictTriggerController.triggerRejected({ config });
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
    if (this.boundSubmitHandler) {
      document.removeEventListener('click', this.boundSubmitHandler, true);
      this.boundSubmitHandler = null;
    }
    this.quickPill.destroy();
  }
}
