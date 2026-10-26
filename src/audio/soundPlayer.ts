// Sound player for ThemeFlow verdicts

let audioContext: AudioContext | null = null;
let suspendTimer: any = null;

function scheduleAudioSuspend(): void {
  if (typeof window === 'undefined') return;
  if (suspendTimer) {
    clearTimeout(suspendTimer);
  }
  suspendTimer = setTimeout(() => {
    if (audioContext && audioContext.state === 'running') {
      audioContext.suspend().catch(() => {});
    }
  }, 10000);
}

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  scheduleAudioSuspend();
  return audioContext;
}

export function cleanupAudio(): void {
  if (suspendTimer) {
    clearTimeout(suspendTimer);
    suspendTimer = null;
  }
  if (audioContext) {
    if (audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
    }
    audioContext = null;
  }
}

/**
 * Synthesizes a sparkling ascending victory chime (Accepted)
 */
function playSyntheticAcChime(volume: number) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0.00, d: 0.4 }, // C5
      { f: 659.25, t: 0.09, d: 0.4 }, // E5
      { f: 783.99, t: 0.18, d: 0.4 }, // G5
      { f: 1046.50, t: 0.27, d: 0.6 }, // C6
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0.001, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.28 * volume, now + note.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    });
  } catch (err) {
    console.warn('Synthetic AC chime failed:', err);
  }
}

/**
 * Synthesizes a soft, gentle reminder chime (Rejected)
 */
function playSyntheticWaChime(volume: number) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [
      { f: 440.00, t: 0.00, d: 0.25 }, // A4
      { f: 349.23, t: 0.12, d: 0.35 }, // F4
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0.001, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.2 * volume, now + note.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    });
  } catch (err) {
    console.warn('Synthetic WA chime failed:', err);
  }
}

export function playAcceptedSound(volume = 0.7, soundEnabled = false): void {
  if (!soundEnabled || volume <= 0) return;

  // Try loading bundled sound file first
  try {
    let soundUrl = '/sounds/ac.wav';
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      soundUrl = chrome.runtime.getURL('sounds/ac.wav');
    }
    const audio = new Audio(soundUrl);
    audio.volume = Math.max(0, Math.min(1, volume));
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to Web Audio synthesis if file play fails or blocked
        playSyntheticAcChime(volume);
      });
    }
  } catch {
    playSyntheticAcChime(volume);
  }
}

export function playRejectedSound(volume = 0.7, soundEnabled = false): void {
  if (!soundEnabled || volume <= 0) return;

  try {
    let soundUrl = '/sounds/wa.wav';
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      soundUrl = chrome.runtime.getURL('sounds/wa.wav');
    }
    const audio = new Audio(soundUrl);
    audio.volume = Math.max(0, Math.min(1, volume));
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        playSyntheticWaChime(volume);
      });
    }
  } catch {
    playSyntheticWaChime(volume);
  }
}
