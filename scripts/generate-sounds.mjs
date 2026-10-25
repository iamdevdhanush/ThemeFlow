import fs from 'node:fs';
import path from 'node:path';

const soundsDir = path.resolve('public/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Generate simple 16-bit mono PCM WAV
function createWavBuffer(sampleRate, samples) {
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16-bit

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // write samples with soft limiter
  for (let i = 0; i < samples.length; i++) {
    // Soft saturation tanh-like limiter to prevent harsh digital clipping
    let s = samples[i];
    if (s > 1.0) s = 1.0 - Math.exp(-s);
    else if (s < -1.0) s = -1.0 + Math.exp(s);
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  return buffer;
}

/**
 * Generates signature Anime Finisher Victory Sound Effect (ac.wav):
 * 1. 0.00s–0.12s: High-speed metallic blade slice & whoosh (noise sweep + resonant pitch)
 * 2. 0.09s–0.28s: Decisive cinematic impact sub-thud (150Hz -> 45Hz punch)
 * 3. 0.16s–1.10s: Radiant, crystal victory harmonic chord (E5, G#5, B5, E6, G#6 shimmer)
 */
function generateAnimeFinisherSound() {
  const sampleRate = 44100;
  const duration = 1.25;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);

  // 1. Blade Slice Whoosh (0.00s - 0.14s)
  const sliceSamples = Math.floor(0.14 * sampleRate);
  let noiseState = 0.5;
  for (let i = 0; i < sliceSamples; i++) {
    const t = i / sampleRate;
    const progress = t / 0.14;
    // Fast frequency sweep
    const sweepFreq = 800 + Math.sin(progress * Math.PI) * 3200;
    // Filtered noise + high sine bite
    noiseState = (noiseState * 0.72) + ((Math.random() * 2 - 1) * 0.28);
    const env = Math.sin(progress * Math.PI) * 0.42;
    const tone = Math.sin(2 * Math.PI * sweepFreq * t) * 0.25;
    samples[i] += (noiseState + tone) * env;
  }

  // 2. Cinematic Impact Sub-Punch (0.09s - 0.35s)
  const impactStart = Math.floor(0.09 * sampleRate);
  const impactDuration = 0.26;
  const impactSamples = Math.floor(impactDuration * sampleRate);
  for (let i = 0; i < impactSamples; i++) {
    const idx = impactStart + i;
    if (idx >= totalSamples) break;
    const t = i / sampleRate;
    // Exponential pitch drop from 160Hz to 40Hz
    const freq = 40 + 120 * Math.exp(-t * 22);
    const env = Math.exp(-t * 14) * 0.65;
    samples[idx] += Math.sin(2 * Math.PI * freq * t) * env;
  }

  // 3. Triumphant Crystalline Chord (0.16s - 1.25s)
  // Harmonic E Major Radiant Chime (E5, G#5, B5, E6, G#6)
  const chordNotes = [
    { freq: 659.25, start: 0.14, decay: 4.5, amp: 0.22 },  // E5
    { freq: 830.61, start: 0.16, decay: 4.8, amp: 0.20 },  // G#5
    { freq: 987.77, start: 0.18, decay: 5.2, amp: 0.18 },  // B5
    { freq: 1318.51, start: 0.20, decay: 5.8, amp: 0.22 }, // E6
    { freq: 1661.22, start: 0.22, decay: 6.5, amp: 0.15 }, // G#6
  ];

  for (const note of chordNotes) {
    const startIdx = Math.floor(note.start * sampleRate);
    for (let i = startIdx; i < totalSamples; i++) {
      const t = (i - startIdx) / sampleRate;
      const decay = Math.exp(-t * note.decay);
      // Pure sine + crystal 2nd harmonic sparkle
      const s = (
        Math.sin(2 * Math.PI * note.freq * t) * 0.75 +
        Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.25
      ) * decay * note.amp;
      samples[i] += s;
    }
  }

  return createWavBuffer(sampleRate, samples);
}

// 2. Rejected Chime: Soft two-tone reminder (A4 -> F4)
function generateWaChime() {
  const sampleRate = 44100;
  const duration = 0.5;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);

  const notes = [
    { freq: 440.00, start: 0.00, dur: 0.25 }, // A4
    { freq: 349.23, start: 0.12, dur: 0.35 }, // F4
  ];

  for (const note of notes) {
    const startIdx = Math.floor(note.start * sampleRate);
    const endIdx = Math.min(totalSamples, startIdx + Math.floor(note.dur * sampleRate));
    for (let i = startIdx; i < endIdx; i++) {
      const t = (i - startIdx) / sampleRate;
      const decay = Math.exp(-t * 8.0);
      const sample = Math.sin(2 * Math.PI * note.freq * t) * decay * 0.25;
      samples[i] += sample;
    }
  }

  return createWavBuffer(sampleRate, samples);
}

fs.writeFileSync(path.join(soundsDir, 'ac.wav'), generateAnimeFinisherSound());
fs.writeFileSync(path.join(soundsDir, 'wa.wav'), generateWaChime());
console.log('Successfully generated Anime Finisher sound (public/sounds/ac.wav) and wa.wav');
