import confetti from 'canvas-confetti';

export function fireAcceptedCelebration(): void {
  // Respect reduced motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Dual side cannon burst for exciting, sleek celebration
  try {
    const count = 70;
    const defaults = {
      origin: { y: 0.8 },
      colors: ['#a78bfa', '#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#ffffff'],
      disableForReducedMotion: true,
    };

    confetti({
      ...defaults,
      particleCount: count,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.85 },
    });

    confetti({
      ...defaults,
      particleCount: count,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.85 },
    });
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}
