/**
 * ThemeFlow Signature Anime Impact Frame & Victory Celebration
 * 
 * A handcrafted, high-performance success sequence inspired by
 * anime impact frames, manga action lines, and modern rhythm-game victory treatments.
 * 
 * Sequence Lifecycle:
 * 1. Impact (0-200ms): Manga-style speed-line slash burst & cross-slash localized around verdict.
 * 2. Victory (200-900ms): Sleek chamfered obsidian-emerald ACCEPTED badge with diagonal highlight sweep.
 * 3. Release (900-1800ms): Lightweight floating energy shards and sparks drifting naturally.
 * 4. Cleanup (by 2000ms): Full DOM and memory release, restoring pristine page state.
 * 
 * Non-blocking & Accessible:
 * - Entire container and children are pointer-events: none; never blocks clicks, typing, or scrolling.
 * - Strictly respects prefers-reduced-motion.
 * - Zero external animation libraries or remote assets.
 */

export interface CelebrationOptions {
  anchorElement?: HTMLElement | null;
  themeAccent?: string;
  verdictText?: string;
}

let activeCelebrationTeardown: (() => void) | null = null;

/**
 * Immediately cancels and cleans up any currently active celebration.
 * Safe to call at any time (e.g. during page navigation or component teardown).
 */
export function stopAcceptedCelebration(): void {
  if (activeCelebrationTeardown) {
    activeCelebrationTeardown();
    activeCelebrationTeardown = null;
  }
}

/**
 * Triggers the signature ThemeFlow anime impact celebration sequence.
 */
export function fireAcceptedCelebration(options: CelebrationOptions = {}): void {
  // Respect user preference for reduced motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Cancel any running celebration to prevent overlapping animations
  stopAcceptedCelebration();

  const {
    anchorElement = null,
    themeAccent = '#a78bfa',
    verdictText = 'ACCEPTED',
  } = options;

  // Calculate center coordinates for the impact burst
  let originX = window.innerWidth / 2;
  let originY = window.innerHeight * 0.42;

  if (anchorElement && typeof anchorElement.getBoundingClientRect === 'function') {
    const rect = anchorElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight) {
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }
  }

  // Ensure origin is comfortably within the viewport
  originX = Math.max(160, Math.min(window.innerWidth - 160, originX));
  originY = Math.max(120, Math.min(window.innerHeight - 120, originY));

  // Create isolated container
  const container = document.createElement('div');
  container.id = 'themeflow-anime-celebration';
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '9999999',
    overflow: 'hidden',
  });

  // Inject scoped keyframes if not already present
  ensureCelebrationStyles();

  // 1. Create SVG Impact Burst & Cross-Slashes (0-220ms)
  const impactSvg = createImpactBurstSvg(originX, originY, themeAccent);
  container.appendChild(impactSvg);

  // 2. Create Compact Glowing Victory Badge (180-1800ms)
  const victoryBadge = createVictoryBadge(originX, originY, verdictText, themeAccent);
  container.appendChild(victoryBadge);

  // 3. Create Lightweight Particle Spark Canvas (200-1800ms)
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  Object.assign(canvas.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  });
  container.appendChild(canvas);

  document.body.appendChild(container);

  // Particle System Simulation
  let animId: number | null = null;
  let isCleanedUp = false;
  const ctx = canvas.getContext('2d');
  const particles = spawnParticles(originX, originY, themeAccent);
  const startTime = performance.now();

  function render(now: number) {
    if (isCleanedUp) return;
    const elapsed = now - startTime;
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (elapsed > 180) {
      const progress = Math.min(1, (elapsed - 180) / 1620);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.035; // Gentle upward atmospheric buoyancy
        p.vx *= 0.982; // Drag
        p.vy *= 0.982;
        p.rotation += p.rotSpeed;
        p.alpha = Math.max(0, 1 - Math.pow(progress, 1.35));

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha * p.baseAlpha;

        if (p.shape === 'shard') {
          // Elongated manga energy shard / diamond
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.7, 0);
          ctx.lineTo(0, -p.size * 2.4);
          ctx.lineTo(p.size * 0.7, 0);
          ctx.lineTo(0, p.size * 2.4);
          ctx.closePath();
          ctx.fill();
        } else {
          // Circular spark with soft bloom
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    if (elapsed < 1950) {
      animId = requestAnimationFrame(render);
    }
  }

  animId = requestAnimationFrame(render);

  // Complete teardown handler
  const teardown = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (animId !== null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    if (activeCelebrationTeardown === teardown) {
      activeCelebrationTeardown = null;
    }
  };

  activeCelebrationTeardown = teardown;

  // Auto-cleanup by 2000ms
  setTimeout(teardown, 1980);
}

/**
 * Creates anime-style radial speed lines, triangular shards & cross-slash burst
 */
function createImpactBurstSvg(cx: number, cy: number, accentColor: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  Object.assign(svg.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    animation: 'tfImpactFadeOut 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  });

  // Localized soft radial glow around verdict (no full-screen flash!)
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <radialGradient id="tf-impact-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4ade80" stop-opacity="0.32" />
      <stop offset="45%" stop-color="${accentColor}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
    </radialGradient>
  `;
  svg.appendChild(defs);

  // Localized burst aura circle
  const aura = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  aura.setAttribute('cx', cx.toFixed(1));
  aura.setAttribute('cy', cy.toFixed(1));
  aura.setAttribute('r', '140');
  aura.setAttribute('fill', 'url(#tf-impact-glow)');
  aura.style.animation = 'tfAuraExpand 0.24s cubic-bezier(0.1, 0.8, 0.2, 1) forwards';
  svg.appendChild(aura);

  // Manga speed-line slashes radiating outwards
  const numSlashes = 14;
  const innerRadius = 20;
  const outerRadius = 150;

  for (let i = 0; i < numSlashes; i++) {
    const angle = (i * (360 / numSlashes) + (Math.random() * 14 - 7)) * (Math.PI / 180);
    const lengthMult = 0.75 + Math.random() * 0.55;
    const r1 = innerRadius + Math.random() * 10;
    const r2 = outerRadius * lengthMult;

    const x1 = cx + Math.cos(angle) * r1;
    const y1 = cy + Math.sin(angle) * r1;
    const x2 = cx + Math.cos(angle) * r2;
    const y2 = cy + Math.sin(angle) * r2;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toFixed(1));
    line.setAttribute('y1', y1.toFixed(1));
    line.setAttribute('x2', x2.toFixed(1));
    line.setAttribute('y2', y2.toFixed(1));
    line.setAttribute('stroke', i % 3 === 0 ? accentColor : i % 2 === 0 ? '#4ade80' : '#ffffff');
    line.setAttribute('stroke-width', (2 + Math.random() * 2).toFixed(1));
    line.setAttribute('stroke-linecap', 'round');
    line.style.animation = 'tfSlashGrow 0.22s cubic-bezier(0.05, 0.9, 0.1, 1.0) forwards';
    svg.appendChild(line);
  }

  // Cross-cutting katana energy blades (anime impact slash)
  const slash1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  slash1.setAttribute('x1', (cx - 100).toFixed(1));
  slash1.setAttribute('y1', (cy - 35).toFixed(1));
  slash1.setAttribute('x2', (cx + 100).toFixed(1));
  slash1.setAttribute('y2', (cy + 35).toFixed(1));
  slash1.setAttribute('stroke', '#ffffff');
  slash1.setAttribute('stroke-width', '2.5');
  slash1.setAttribute('stroke-linecap', 'round');
  slash1.style.animation = 'tfCrossSlash 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(slash1);

  const slash2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  slash2.setAttribute('x1', (cx - 70).toFixed(1));
  slash2.setAttribute('y1', (cy + 40).toFixed(1));
  slash2.setAttribute('x2', (cx + 70).toFixed(1));
  slash2.setAttribute('y2', (cy - 40).toFixed(1));
  slash2.setAttribute('stroke', '#4ade80');
  slash2.setAttribute('stroke-width', '2');
  slash2.setAttribute('stroke-linecap', 'round');
  slash2.style.animation = 'tfCrossSlash 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(slash2);

  // Central shock ring
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('cx', cx.toFixed(1));
  ring.setAttribute('cy', cy.toFixed(1));
  ring.setAttribute('r', '20');
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', '#4ade80');
  ring.setAttribute('stroke-width', '2.5');
  ring.style.animation = 'tfShockRing 0.32s cubic-bezier(0.1, 0.8, 0.2, 1) forwards';
  svg.appendChild(ring);

  return svg;
}

/**
 * Creates high-contrast anime Victory treatment badge
 */
function createVictoryBadge(cx: number, cy: number, text: string, accentColor: string): HTMLElement {
  const badge = document.createElement('div');
  badge.className = 'tf-victory-badge';
  Object.assign(badge.style, {
    position: 'absolute',
    left: `${cx}px`,
    top: `${cy}px`,
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '9px 20px',
    background: 'linear-gradient(135deg, rgba(8, 16, 12, 0.95) 0%, rgba(12, 22, 16, 0.97) 100%)',
    border: '1.5px solid #22c55e',
    borderRadius: '10px',
    clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
    boxShadow: `0 0 28px rgba(34, 197, 94, 0.45), 0 10px 32px rgba(0, 0, 0, 0.75), inset 0 0 14px rgba(74, 222, 128, 0.18)`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    animation: 'tfBadgePop 1.85s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    overflow: 'hidden',
    userSelect: 'none',
  });

  // Highlight sweep overlay
  const sweep = document.createElement('div');
  Object.assign(sweep.style, {
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 45%, rgba(74, 222, 128, 0.4) 55%, transparent 100%)',
    transform: 'translateX(-150%) skewX(-25deg)',
    animation: 'tfHighlightSweep 0.85s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    pointerEvents: 'none',
  });
  badge.appendChild(sweep);

  // Anime crest icon (Geometric diamond with check)
  const iconWrap = document.createElement('div');
  Object.assign(iconWrap.style, {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #4ade80 0%, #10b981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 14px rgba(74, 222, 128, 0.6)',
    flexShrink: '0',
  });
  iconWrap.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#052011" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;
  badge.appendChild(iconWrap);

  // Text content column
  const textCol = document.createElement('div');
  Object.assign(textCol.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: '1.2',
  });

  const subLabel = document.createElement('div');
  Object.assign(subLabel.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });

  const subText = document.createElement('span');
  subText.textContent = 'THEMEFLOW // VERDICT';
  Object.assign(subText.style, {
    fontFamily: "'JetBrains Mono', Consolas, monospace",
    fontSize: '9.5px',
    fontWeight: '700',
    letterSpacing: '0.18em',
    color: '#86efac',
    textTransform: 'uppercase',
  });
  subLabel.appendChild(subText);

  // Theme accent pip indicating dynamic integration
  const accentPip = document.createElement('span');
  Object.assign(accentPip.style, {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: accentColor,
    boxShadow: `0 0 6px ${accentColor}`,
    display: 'inline-block',
  });
  subLabel.appendChild(accentPip);

  const mainLabel = document.createElement('span');
  mainLabel.textContent = text;
  Object.assign(mainLabel.style, {
    fontFamily: "'JetBrains Mono', Consolas, monospace",
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '0.15em',
    color: '#ffffff',
    textShadow: '0 0 12px rgba(74, 222, 128, 0.55)',
  });

  textCol.appendChild(subLabel);
  textCol.appendChild(mainLabel);
  badge.appendChild(textCol);

  return badge;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: 'shard' | 'spark';
  rotation: number;
  rotSpeed: number;
  alpha: number;
  baseAlpha: number;
}

function spawnParticles(cx: number, cy: number, accentColor: string): Particle[] {
  const particles: Particle[] = [];
  const palette = ['#4ade80', '#86efac', '#38bdf8', accentColor, '#ffffff'];
  const count = 20; // Lightweight, restrained count for elegance without clutter

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.0 + Math.random() * 3.2;
    particles.push({
      x: cx + (Math.random() - 0.5) * 36,
      y: cy + (Math.random() - 0.5) * 18,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.8, // Initial gentle impulse
      size: 2.2 + Math.random() * 3.0,
      color: palette[Math.floor(Math.random() * palette.length)],
      shape: Math.random() > 0.4 ? 'shard' : 'spark',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      alpha: 1,
      baseAlpha: 0.75 + Math.random() * 0.25,
    });
  }

  return particles;
}

function ensureCelebrationStyles(): void {
  if (document.getElementById('themeflow-celebration-keyframes')) return;

  const style = document.createElement('style');
  style.id = 'themeflow-celebration-keyframes';
  style.textContent = `
    @keyframes tfSlashGrow {
      0% {
        stroke-dasharray: 0 100;
        opacity: 0.2;
      }
      50% {
        opacity: 1;
      }
      100% {
        stroke-dasharray: 100 0;
        opacity: 0.9;
      }
    }

    @keyframes tfCrossSlash {
      0% {
        stroke-dasharray: 0 200;
        opacity: 0;
      }
      30% {
        opacity: 1;
      }
      100% {
        stroke-dasharray: 200 0;
        opacity: 0;
      }
    }

    @keyframes tfAuraExpand {
      0% {
        r: 30px;
        opacity: 0.9;
      }
      100% {
        r: 150px;
        opacity: 0;
      }
    }

    @keyframes tfShockRing {
      0% {
        r: 10px;
        opacity: 1;
        stroke-width: 4px;
      }
      100% {
        r: 110px;
        opacity: 0;
        stroke-width: 0.5px;
      }
    }

    @keyframes tfImpactFadeOut {
      0% { opacity: 1; }
      75% { opacity: 0.9; }
      100% { opacity: 0; }
    }

    @keyframes tfBadgePop {
      0% {
        transform: translate(-50%, -50%) scale(0.7);
        opacity: 0;
        filter: blur(5px);
      }
      16% {
        transform: translate(-50%, -50%) scale(1.05);
        opacity: 1;
        filter: blur(0px);
      }
      28% {
        transform: translate(-50%, -50%) scale(1.0);
        opacity: 1;
      }
      80% {
        transform: translate(-50%, -50%) scale(1.0);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(0.94);
        opacity: 0;
        filter: blur(3px);
      }
    }

    @keyframes tfHighlightSweep {
      0% {
        transform: translateX(-150%) skewX(-25deg);
      }
      100% {
        transform: translateX(250%) skewX(-25deg);
      }
    }
  `;
  document.head.appendChild(style);
}
