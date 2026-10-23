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

  // write samples
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  return buffer;
}

// 1. Accepted Chime: Pleasant ascending triad (C5, E5, G5, C6) with smooth exponential decay
function generateAcChime() {
  const sampleRate = 44100;
  const duration = 0.8;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);

  const notes = [
    { freq: 523.25, start: 0.00, dur: 0.5 }, // C5
    { freq: 659.25, start: 0.10, dur: 0.5 }, // E5
    { freq: 783.99, start: 0.20, dur: 0.5 }, // G5
    { freq: 1046.50, start: 0.30, dur: 0.5 }, // C6
  ];

  for (const note of notes) {
    const startIdx = Math.floor(note.start * sampleRate);
    const endIdx = Math.min(totalSamples, startIdx + Math.floor(note.dur * sampleRate));
    for (let i = startIdx; i < endIdx; i++) {
      const t = (i - startIdx) / sampleRate;
      const decay = Math.exp(-t * 6.0);
      // Sine wave with subtle harmonics for a warm marimba/glass chime feel
      const sample = (
        Math.sin(2 * Math.PI * note.freq * t) * 0.7 +
        Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.2 +
        Math.sin(2 * Math.PI * note.freq * 3 * t) * 0.1
      ) * decay * 0.28;
      samples[i] += sample;
    }
  }

  return createWavBuffer(sampleRate, samples);
}

// 2. Rejected Chime: Gentle, soft two-tone reminder (A4 -> F4)
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

fs.writeFileSync(path.join(soundsDir, 'ac.wav'), generateAcChime());
fs.writeFileSync(path.join(soundsDir, 'wa.wav'), generateWaChime());
console.log('Successfully generated public/sounds/ac.wav and public/sounds/wa.wav');
