/**
 * ThemeFlow Signature Anime Impact Frame & Victory Celebration
 * 
 * Creative Direction: "The Victory Moment"
 * A handcrafted, high-performance success sequence inspired by
 * anime impact frames, manga action speed lines, and modern rhythm-game victory treatments.
 * 
 * Sequence Lifecycle:
 * Phase 1 — Impact (0–250 ms):
 *   - Localized directional katana speed slash cutting across verdict anchor.
 *   - Snappy counter-accent slash and localized manga speed-line needles.
 *   - Restrained emerald-white radial shockwave aura. Zero full-screen flash or camera shake.
 * 
 * Phase 2 — Victory Reveal (250–800 ms):
 *   - High-contrast chamfered HUD victory badge with obsidian-emerald surface.
 *   - Crisp vector typography and checkmark crest (100% sharp, zero blur filters).
 *   - Snappy anime entrance (scale 0.86 -> 1.02 -> 1.0) with natural settling.
 *   - Sleek anime diagonal light sweep glint.
 *   - Stable viewport-relative anchor clamping that never covers code or controls.
 * 
 * Phase 3 — Energy Release (800–1500 ms):
 *   - Restrained burst of localized manga diamond shards and pinpoint sparks.
 *   - Outward radial velocity with natural aerodynamic drag (no upward draft into editor).
 *   - Strictly bounded within a tight halo around the verdict badge (never scattering across whole page).
 * 
 * Phase 4 — Settle & Cleanup (1500–2000 ms):
 *   - Graceful scale and opacity fade.
 *   - Full DOM and memory release by 1900ms, restoring pristine page state.
 *   - Zero leftover timers, animation frames, or DOM nodes.
 * 
 * Non-blocking & Accessible:
 * - Container and all children strictly pointer-events: none.
 * - Respects prefers-reduced-motion.
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
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Cancel any running celebration to prevent overlapping animations
  stopAcceptedCelebration();

  const {
    anchorElement = null,
    themeAccent = '#34d399',
    verdictText = 'ACCEPTED',
  } = options;

  // Compute origin coordinates with robust clamping
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // Viewport-relative fallback: eye-level center-top, above code editor and console controls
  let originX = winW / 2;
  let originY = Math.min(winH * 0.36, 280);

  if (anchorElement && typeof anchorElement.getBoundingClientRect === 'function') {
    const rect = anchorElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const rawX = rect.left + rect.width / 2;
      const rawY = rect.top + rect.height / 2;
      // Accept anchor if within or reasonably adjacent to viewport
      if (rawX >= -100 && rawX <= winW + 100 && rawY >= -100 && rawY <= winH + 100) {
        originX = rawX;
        originY = rawY;
      }
    }
  }

  // Viewport bounds clamp: ensure badge and burst remain fully visible without clipping
  const minX = Math.min(180, winW / 2);
  const maxX = Math.max(minX, winW - 180);
  const minY = Math.min(80, winH / 2);
  const maxY = Math.max(minY, winH - 90);

  originX = Math.max(minX, Math.min(maxX, originX));
  originY = Math.max(minY, Math.min(maxY, originY));

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

  // Phase 1: SVG Directional Katana Slash & Manga Speed Lines (0-250ms)
  const impactSvg = createImpactBurstSvg(originX, originY, themeAccent, winW, winH);
  container.appendChild(impactSvg);

  // Phase 2: Crisp Anime Victory HUD Treatment Badge (200-1800ms)
  const victoryBadge = createVictoryBadge(originX, originY, verdictText, themeAccent);
  container.appendChild(victoryBadge);

  // Phase 3: Localized Manga Energy Shards & Particle Canvas (300-1500ms)
  const canvas = document.createElement('canvas');
  canvas.width = winW;
  canvas.height = winH;
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

  // Particle System Simulation: Strictly Localized Energy Shards
  let animId: number | null = null;
  let isCleanedUp = false;
  const ctx = canvas.getContext('2d');
  const particles = spawnLocalizedParticles(originX, originY, themeAccent);
  const startTime = performance.now();

  function render(now: number) {
    if (isCleanedUp) return;
    const elapsed = now - startTime;
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Particles activate as victory badge settles (from ~250ms onward)
    if (elapsed > 250 && elapsed < 1650) {
      const progress = Math.min(1, (elapsed - 250) / 1350);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // Kinetic air drag without upward draft: particles decelerate naturally in place
        p.vx *= 0.935;
        p.vy *= 0.935;
        p.rotation += p.rotSpeed;
        p.alpha = Math.max(0, 1 - Math.pow(progress, 1.4));

        // Enforce localized radius containment around origin
        const distFromOrigin = Math.hypot(p.x - originX, p.y - originY);
        if (distFromOrigin > 140) {
          p.alpha *= Math.max(0, 1 - (distFromOrigin - 140) / 30);
        }

        if (p.alpha <= 0.01) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha * p.baseAlpha;

        if (p.shape === 'shard') {
          // Elongated manga energy shard / kinetic diamond
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.6, 0);
          ctx.lineTo(0, -p.size * 2.2);
          ctx.lineTo(p.size * 0.6, 0);
          ctx.lineTo(0, p.size * 2.2);
          ctx.closePath();
          ctx.fill();
        } else {
          // Pinpoint spark with soft glow
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    if (elapsed < 1850) {
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

  // Auto-cleanup by 1900ms (strictly under 2000ms design limit)
  setTimeout(teardown, 1920);
}

/**
 * Creates anime-style directional katana slashes, speed needles & localized shock ring
 */
function createImpactBurstSvg(cx: number, cy: number, accentColor: string, winW: number, winH: number): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${winW} ${winH}`);
  Object.assign(svg.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    shapeRendering: 'geometricPrecision',
    animation: 'tfImpactSvgFade 0.30s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  });

  // Localized aura gradient definition
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <radialGradient id="tf-impact-aura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
      <stop offset="25%" stop-color="#4ade80" stop-opacity="0.30" />
      <stop offset="60%" stop-color="${accentColor}" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#22c55e" stop-opacity="0" />
    </radialGradient>
  `;
  svg.appendChild(defs);

  // 1. Restrained Localized Aura Burst
  const aura = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  aura.setAttribute('cx', cx.toFixed(1));
  aura.setAttribute('cy', cy.toFixed(1));
  aura.setAttribute('r', '110');
  aura.setAttribute('fill', 'url(#tf-impact-aura)');
  aura.style.animation = 'tfAuraBurst 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(aura);

  // 2. Primary Directional Katana Slash (Fast diagonal slice across verdict anchor)
  const slash1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  slash1.setAttribute('x1', (cx - 130).toFixed(1));
  slash1.setAttribute('y1', (cy + 38).toFixed(1));
  slash1.setAttribute('x2', (cx + 130).toFixed(1));
  slash1.setAttribute('y2', (cy - 38).toFixed(1));
  slash1.setAttribute('stroke', '#ffffff');
  slash1.setAttribute('stroke-width', '2.8');
  slash1.setAttribute('stroke-linecap', 'round');
  slash1.style.animation = 'tfKatanaSlash1 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(slash1);

  // 3. Counter-Accent Anime Slash
  const slash2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  slash2.setAttribute('x1', (cx - 95).toFixed(1));
  slash2.setAttribute('y1', (cy - 36).toFixed(1));
  slash2.setAttribute('x2', (cx + 95).toFixed(1));
  slash2.setAttribute('y2', (cy + 36).toFixed(1));
  slash2.setAttribute('stroke', '#4ade80');
  slash2.setAttribute('stroke-width', '2.0');
  slash2.setAttribute('stroke-linecap', 'round');
  slash2.style.animation = 'tfKatanaSlash2 0.24s 0.02s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(slash2);

  // 4. Localized Manga Speed Needles (8 tightly grouped directional accents)
  const needleAngles = [15, 45, 105, 135, 195, 225, 285, 315];
  for (let i = 0; i < needleAngles.length; i++) {
    const rad = needleAngles[i] * (Math.PI / 180);
    const r1 = 26 + (i % 2) * 8;
    const r2 = 68 + (i % 3) * 16;

    const x1 = cx + Math.cos(rad) * r1;
    const y1 = cy + Math.sin(rad) * r1;
    const x2 = cx + Math.cos(rad) * r2;
    const y2 = cy + Math.sin(rad) * r2;

    const needle = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    needle.setAttribute('x1', x1.toFixed(1));
    needle.setAttribute('y1', y1.toFixed(1));
    needle.setAttribute('x2', x2.toFixed(1));
    needle.setAttribute('y2', y2.toFixed(1));
    needle.setAttribute('stroke', i % 2 === 0 ? '#4ade80' : '#ffffff');
    needle.setAttribute('stroke-width', i % 2 === 0 ? '2' : '1.5');
    needle.setAttribute('stroke-linecap', 'round');
    needle.style.animation = 'tfMangaNeedle 0.24s cubic-bezier(0.1, 0.9, 0.2, 1) forwards';
    svg.appendChild(needle);
  }

  // 5. Central Anime Shock Ring
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('cx', cx.toFixed(1));
  ring.setAttribute('cy', cy.toFixed(1));
  ring.setAttribute('r', '14');
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', '#4ade80');
  ring.setAttribute('stroke-width', '2.2');
  ring.style.animation = 'tfShockRing 0.28s cubic-bezier(0.1, 0.8, 0.2, 1) forwards';
  svg.appendChild(ring);

  return svg;
}

/**
 * Creates high-contrast anime Victory HUD badge (100% crisp vector & typography, zero blur)
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
    gap: '14px',
    padding: '10px 22px',
    background: 'linear-gradient(135deg, rgba(5, 14, 9, 0.97) 0%, rgba(9, 24, 15, 0.98) 100%)',
    border: '1.5px solid #22c55e',
    borderRadius: '8px',
    boxShadow: `0 0 24px rgba(34, 197, 94, 0.35), 0 8px 30px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.16)`,
    animation: 'tfVictorySequence 1.82s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    overflow: 'hidden',
    userSelect: 'none',
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    textRendering: 'geometricPrecision',
  });

  // Manga Corner Accent Brackets (Top-Left & Bottom-Right HUD aesthetics)
  const cornerTL = document.createElement('div');
  Object.assign(cornerTL.style, {
    position: 'absolute',
    top: '3px',
    left: '3px',
    width: '6px',
    height: '6px',
    borderTop: '2px solid #86efac',
    borderLeft: '2px solid #86efac',
    pointerEvents: 'none',
  });
  badge.appendChild(cornerTL);

  const cornerBR = document.createElement('div');
  Object.assign(cornerBR.style, {
    position: 'absolute',
    bottom: '3px',
    right: '3px',
    width: '6px',
    height: '6px',
    borderBottom: '2px solid #86efac',
    borderRight: '2px solid #86efac',
    pointerEvents: 'none',
  });
  badge.appendChild(cornerBR);

  // Diagonal Anime Glint Sweep Overlay
  const glint = document.createElement('div');
  Object.assign(glint.style, {
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.45) 48%, rgba(74, 222, 128, 0.5) 52%, transparent 80%)',
    transform: 'translateX(-160%) skewX(-20deg)',
    animation: 'tfAnimeGlint 0.65s 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    pointerEvents: 'none',
  });
  badge.appendChild(glint);

  // Vector Anime Diamond Crest with Crisp Checkmark
  const iconWrap = document.createElement('div');
  Object.assign(iconWrap.style, {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 14px rgba(34, 197, 94, 0.65)',
    flexShrink: '0',
  });
  iconWrap.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;
  badge.appendChild(iconWrap);

  // Typography Column
  const textCol = document.createElement('div');
  Object.assign(textCol.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: '1.25',
  });

  // Micro Sub-Header with Theme Accent Pip
  const subLabel = document.createElement('div');
  Object.assign(subLabel.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });

  const subText = document.createElement('span');
  subText.textContent = 'THEMEFLOW // AC';
  Object.assign(subText.style, {
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.22em',
    color: '#86efac',
    textTransform: 'uppercase',
  });
  subLabel.appendChild(subText);

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
  textCol.appendChild(subLabel);

  // Primary Crisp ACCEPTED Label
  const mainLabel = document.createElement('span');
  mainLabel.textContent = text;
  Object.assign(mainLabel.style, {
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '0.16em',
    color: '#ffffff',
    textShadow: '0 0 12px rgba(34, 197, 94, 0.55)',
  });
  textCol.appendChild(mainLabel);

  badge.appendChild(textCol);

  // Right-hand HUD Rating / Status Indicator Tag
  const statusTag = document.createElement('div');
  Object.assign(statusTag.style, {
    marginLeft: '6px',
    padding: '3px 7px',
    border: '1px solid rgba(74, 222, 128, 0.35)',
    borderRadius: '4px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    fontSize: '9.5px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    color: '#86efac',
  });
  statusTag.textContent = 'VERIFIED';
  badge.appendChild(statusTag);

  return badge;
}

interface LocalizedParticle {
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

function spawnLocalizedParticles(cx: number, cy: number, accentColor: string): LocalizedParticle[] {
  const particles: LocalizedParticle[] = [];
  const palette = ['#4ade80', '#86efac', '#38bdf8', accentColor, '#ffffff'];
  const count = 18; // Restrained count: clean, impactful, zero clutter

  for (let i = 0; i < count; i++) {
    const angle = (i * (Math.PI * 2 / count)) + (Math.random() - 0.5) * 0.4;
    const speed = 1.6 + Math.random() * 2.8;

    // Emitter boundary: tight perimeter around victory badge
    const spawnX = cx + (Math.random() - 0.5) * 50;
    const spawnY = cy + (Math.random() - 0.5) * 16;

    particles.push({
      x: spawnX,
      y: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.2 + Math.random() * 2.4,
      color: palette[Math.floor(Math.random() * palette.length)],
      shape: Math.random() > 0.4 ? 'shard' : 'spark',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      alpha: 1,
      baseAlpha: 0.8 + Math.random() * 0.2,
    });
  }

  return particles;
}

function ensureCelebrationStyles(): void {
  if (document.getElementById('themeflow-celebration-keyframes')) return;

  const style = document.createElement('style');
  style.id = 'themeflow-celebration-keyframes';
  style.textContent = `
    /* Phase 1: Directional Katana Slashes */
    @keyframes tfKatanaSlash1 {
      0% {
        stroke-dasharray: 0 300;
        opacity: 0;
      }
      25% {
        opacity: 1;
      }
      100% {
        stroke-dasharray: 300 0;
        opacity: 0;
      }
    }

    @keyframes tfKatanaSlash2 {
      0% {
        stroke-dasharray: 0 240;
        opacity: 0;
      }
      25% {
        opacity: 0.9;
      }
      100% {
        stroke-dasharray: 240 0;
        opacity: 0;
      }
    }

    @keyframes tfMangaNeedle {
      0% {
        stroke-dasharray: 0 100;
        opacity: 0.1;
      }
      40% {
        opacity: 1;
      }
      100% {
        stroke-dasharray: 100 0;
        opacity: 0;
      }
    }

    @keyframes tfAuraBurst {
      0% {
        r: 20px;
        opacity: 0.95;
      }
      100% {
        r: 120px;
        opacity: 0;
      }
    }

    @keyframes tfShockRing {
      0% {
        r: 8px;
        opacity: 1;
        stroke-width: 3.5px;
      }
      100% {
        r: 95px;
        opacity: 0;
        stroke-width: 0.5px;
      }
    }

    @keyframes tfImpactSvgFade {
      0% { opacity: 1; }
      75% { opacity: 0.85; }
      100% { opacity: 0; }
    }

    /* Phase 2: Crisp Victory Entrance & Settle (Zero Blurs) */
    @keyframes tfVictorySequence {
      0% {
        transform: translate(-50%, -50%) scale(0.86);
        opacity: 0;
      }
      14% {
        transform: translate(-50%, -50%) scale(1.02);
        opacity: 1;
      }
      24% {
        transform: translate(-50%, -50%) scale(0.995);
        opacity: 1;
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
        transform: translate(-50%, -50%) scale(0.96);
        opacity: 0;
      }
    }

    /* Phase 2: Diagonal Anime Glint Sweep */
    @keyframes tfAnimeGlint {
      0% {
        transform: translateX(-160%) skewX(-20deg);
      }
      100% {
        transform: translateX(260%) skewX(-20deg);
      }
    }
  `;
  document.head.appendChild(style);
}
