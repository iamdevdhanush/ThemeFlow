import { ThemeConfig } from '../types/theme';
import { fireAcceptedCelebration, stopAcceptedCelebration } from './celebration';
import { playAcceptedSound, playRejectedSound } from '../audio/soundPlayer';

export interface AcceptedVerdictContext {
  anchorElement?: HTMLElement | null;
  config: ThemeConfig;
  verdictText?: string;
}

export interface RejectedVerdictContext {
  config: ThemeConfig;
}

export class VerdictTriggerController {
  private static instance: VerdictTriggerController | null = null;

  public static getInstance(): VerdictTriggerController {
    if (!VerdictTriggerController.instance) {
      VerdictTriggerController.instance = new VerdictTriggerController();
    }
    return VerdictTriggerController.instance;
  }

  /**
   * Orchestrates the Accepted celebration and sound.
   * Enforces:
   * 1. Confetti/Celebration preference check (config.confettiEnabled)
   * 2. Reduced motion check (handled in fireAcceptedCelebration)
   * 3. Audio preferences (config.soundEnabled, config.soundVolume)
   * 4. Cancellation of any prior active celebration
   */
  public triggerAccepted(context: AcceptedVerdictContext): void {
    const { anchorElement = null, config, verdictText = 'ACCEPTED' } = context;

    if (config.confettiEnabled) {
      fireAcceptedCelebration({
        anchorElement,
        themeAccent: config.accentColor,
        verdictText,
      });
    }

    if (config.soundEnabled) {
      playAcceptedSound(config.soundVolume, true);
    }
  }

  /**
   * Orchestrates the Rejected sound reminder.
   * Terminates active celebration and plays soft rejected chime.
   */
  public triggerRejected(context: RejectedVerdictContext): void {
    const { config } = context;

    // Immediately stop any active celebration if a failed verdict arrives
    stopAcceptedCelebration();

    if (config.soundEnabled) {
      playRejectedSound(config.soundVolume, true);
    }
  }

  /**
   * Cancels and cleans up any active celebration.
   */
  public stop(): void {
    stopAcceptedCelebration();
  }
}

export const verdictTriggerController = VerdictTriggerController.getInstance();
