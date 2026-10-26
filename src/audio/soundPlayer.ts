// Sound player for ThemeFlow verdicts

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Synthesizes the exact SEAM Anime Finisher audio sequence (Accepted):
 * 0.30s: short airy reverse swell
 * 0.34s: bright, tightly controlled katana whoosh
 * 0.40s: short, dry impact with restrained 95Hz low-frequency body
 * 0.95s: two ascending glass-bell notes with delicate shimmering tail
 */
function playSyntheticAcChime(volume: number) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. 0.30s: Airy reverse swell (bandpass filtered noise ramp)
    const swellBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
    const swellData = swellBuffer.getChannelData(0);
    for (let i = 0; i < swellData.length; i++) {
      const p = i / swellData.length;
      swellData[i] = (Math.random() * 2 - 1) * Math.pow(p, 2.5) * 0.28 * volume;
    }
    const swellSource = ctx.createBufferSource();
    swellSource.buffer = swellBuffer;
    const swellFilter = ctx.createBiquadFilter();
    swellFilter.type = 'bandpass';
    swellFilter.frequency.setValueAtTime(2400, now + 0.30);
    swellFilter.Q.setValueAtTime(2.0, now + 0.30);
    swellSource.connect(swellFilter);
    swellFilter.connect(ctx.destination);
    swellSource.start(now + 0.30);

    // 2. 0.34s: Katana blade whoosh (high-frequency sweep)
    const bladeOsc = ctx.createOscillator();
    const bladeGain = ctx.createGain();
    bladeOsc.type = 'triangle';
    bladeOsc.frequency.setValueAtTime(1200, now + 0.34);
    bladeOsc.frequency.exponentialRampToValueAtTime(3600, now + 0.37);
    bladeOsc.frequency.exponentialRampToValueAtTime(800, now + 0.40);

    bladeGain.gain.setValueAtTime(0.001, now + 0.34);
    bladeGain.gain.exponentialRampToValueAtTime(0.32 * volume, now + 0.36);
    bladeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.40);
    bladeOsc.connect(bladeGain);
    bladeGain.connect(ctx.destination);
    bladeOsc.start(now + 0.34);
    bladeOsc.stop(now + 0.40);

    // 3. 0.40s: Dry sub impact (95Hz pitch drop)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, now + 0.40);
    subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.48);

    subGain.gain.setValueAtTime(0.55 * volume, now + 0.40);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now + 0.40);
    subOsc.stop(now + 0.52);

    // 4. 0.95s: Two ascending crystal glass-bell notes (E6 at 1318.5Hz, G#6 at 1661.2Hz)
    const bellNotes = [
      { f: 1318.51, t: 0.95, d: 0.65 }, // E6
      { f: 1661.22, t: 1.05, d: 0.75 }, // G#6
    ];

    bellNotes.forEach((note) => {
      const bellOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(note.f, now + note.t);

      bellGain.gain.setValueAtTime(0.001, now + note.t);
      bellGain.gain.exponentialRampToValueAtTime(0.22 * volume, now + note.t + 0.015);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);

      bellOsc.connect(bellGain);
      bellGain.connect(ctx.destination);
      bellOsc.start(now + note.t);
      bellOsc.stop(now + note.t + note.d);
    });
  } catch (err) {
    console.warn('Synthetic SEAM AC audio failed:', err);
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
