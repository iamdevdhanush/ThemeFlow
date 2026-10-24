/**
 * ThemeFlow Signature Anime Impact Frame & Victory Celebration
 * 
 * A handcrafted, high-performance success animation sequence inspired by
 * anime impact frames and modern rhythm-game victory treatments.
 * 
 * Sequence Lifecycle:
 * 1. Impact (0-200ms): Manga-style speed-line slash burst originating from verdict.
 * 2. Victory (200-900ms): Sleek glowing emerald chamfered ACCEPTED badge with shimmer sweep.
 * 3. Release (900-1800ms): Floating energy sparks and ethereal shards that drift and dissolve.
 * 4. Cleanup (by 2000ms): Full DOM and memory release, restoring pristine page state.
 * 
 * Performance & UX:
 * - Pure vanilla DOM + SVG + Canvas; zero external runtime dependencies.
 * - Entire overlay is pointer-events: none; never blocks clicks, typing, or scrolling.
 * - Strictly respects prefers-reduced-motion.
 */

export interface CelebrationOptions {
  anchorElement?: HTMLElement | null;
  themeAccent?: string;
  verdictText?: string;
}

let activeCelebrationTeardown: (() => void) | null = null;

export function fireAcceptedCelebration(options: CelebrationOptions = {}): void {
  // Respect reduced motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Cancel any currently running celebration to prevent overlapping animations
  if (activeCelebrationTeardown) {
    activeCelebrationTeardown();
    activeCelebrationTeardown = null;
  }

  const {
    anchorElement = null,
    themeAccent = '#a78bfa',
    verdictText = 'ACCEPTED',
  } = options;

  // Calculate center of animation
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
  ensureStyles();

  // 1. Create SVG Impact Slash Burst (0-240ms)
  const impactSvg = createImpactBurstSvg(originX, originY, themeAccent);
  container.appendChild(impactSvg);

  // 2. Create Compact Glowing Victory Badge (200-1800ms)
  const victoryBadge = createVictoryBadge(originX, originY, verdictText, themeAccent);
  container.appendChild(victoryBadge);

  // 3. Create Lightweight Particle Spark Canvas (300-1800ms)
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

  // Particle System
  let animId: number | null = null;
  const ctx = canvas.getContext('2d');
  const particles = spawnParticles(originX, originY, themeAccent);
  const startTime = performance.now();

  function render(now: number) {
    const elapsed = now - startTime;
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (elapsed > 180) {
      const progress = Math.min(1, (elapsed - 180) / 1600);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // Gentle gravity
        p.vx *= 0.985; // Drag
        p.rotation += p.rotSpeed;
        p.alpha = Math.max(0, 1 - Math.pow(progress, 1.4));

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha * p.baseAlpha;

        if (p.shape === 'shard') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(0, -p.size * 2.2);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(0, p.size * 2.2);
          ctx.closePath();
          ctx.fill();
        } else {
          // Circular spark with soft bloom
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
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

  // Teardown handler
  const teardown = () => {
    if (animId !== null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    activeCelebrationTeardown = null;
  };

  activeCelebrationTeardown = teardown;

  // Auto cleanup at 2000ms
  setTimeout(teardown, 2000);
}

/**
 * Creates anime-style radial speed lines & slash burst
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
    animation: 'tfImpactFadeOut 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  });

  const numSlashes = 12;
  const innerRadius = 18;
  const outerRadius = 140;

  for (let i = 0; i < numSlashes; i++) {
    const angle = (i * (360 / numSlashes) + (Math.random() * 12 - 6)) * (Math.PI / 180);
    const lengthMult = 0.75 + Math.random() * 0.5;
    const r1 = innerRadius + Math.random() * 12;
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

  // Central shock ring
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('cx', cx.toFixed(1));
  ring.setAttribute('cy', cy.toFixed(1));
  ring.setAttribute('r', '24');
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', '#4ade80');
  ring.setAttribute('stroke-width', '2.5');
  ring.style.animation = 'tfShockRing 0.35s cubic-bezier(0.1, 0.8, 0.2, 1) forwards';
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
    padding: '10px 22px',
    background: 'linear-gradient(135deg, rgba(10, 18, 14, 0.94) 0%, rgba(14, 22, 18, 0.96) 100%)',
    border: '1.5px solid #4ade80',
    borderRadius: '12px',
    boxShadow: `0 0 28px rgba(74, 222, 128, 0.45), 0 12px 40px rgba(0, 0, 0, 0.7), inset 0 0 16px rgba(74, 222, 128, 0.15)`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    animation: 'tfBadgePop 1.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    overflow: 'hidden',
  });

  // Highlight sweep overlay
  const sweep = document.createElement('div');
  Object.assign(sweep.style, {
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%)',
    transform: 'translateX(-150%) skewX(-25deg)',
    animation: 'tfHighlightSweep 0.9s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#062414" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;
  badge.appendChild(iconWrap);

  // Text content
  const textCol = document.createElement('div');
  Object.assign(textCol.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: '1.2',
  });

  const subLabel = document.createElement('span');
  subLabel.textContent = 'THEMEFLOW VERDICT';
  Object.assign(subLabel.style, {
    fontFamily: "'JetBrains Mono', Consolas, monospace",
    fontSize: '9.5px',
    fontWeight: '700',
    letterSpacing: '0.18em',
    color: '#86efac',
    textTransform: 'uppercase',
  });

  const mainLabel = document.createElement('span');
  mainLabel.textContent = text;
  Object.assign(mainLabel.style, {
    fontFamily: "'JetBrains Mono', Consolas, monospace",
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '0.14em',
    color: '#ffffff',
    textShadow: '0 0 12px rgba(74, 222, 128, 0.5)',
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
  const count = 22; // Restrained count for elegance

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.4;
    particles.push({
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2, // Initial upward lift
      size: 2.5 + Math.random() * 3.5,
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

function ensureStyles(): void {
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

    @keyframes tfShockRing {
      0% {
        r: 12px;
        opacity: 1;
        stroke-width: 4px;
      }
      100% {
        r: 120px;
        opacity: 0;
        stroke-width: 0.5px;
      }
    }

    @keyframes tfImpactFadeOut {
      0% { opacity: 1; }
      70% { opacity: 0.9; }
      100% { opacity: 0; }
    }

    @keyframes tfBadgePop {
      0% {
        transform: translate(-50%, -50%) scale(0.65);
        opacity: 0;
        filter: blur(6px);
      }
      18% {
        transform: translate(-50%, -50%) scale(1.06);
        opacity: 1;
        filter: blur(0px);
      }
      30% {
        transform: translate(-50%, -50%) scale(1.0);
        opacity: 1;
      }
      82% {
        transform: translate(-50%, -50%) scale(1.0);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(0.92);
        opacity: 0;
        filter: blur(4px);
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
