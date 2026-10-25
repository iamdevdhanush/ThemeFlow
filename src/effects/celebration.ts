/**
 * ThemeFlow — Signature Anime Impact Celebration Engine
 * 
 * Rebuilt from scratch per Creative Direction: "ANIME IMPACT"
 * Inspired by manga impact frames, katana speed-line cuts, and high-performance
 * rhythm/fighting game achievement sequences.
 * 
 * Key Architectural Guarantees:
 * 1. Strictly Localized & Clipped: No full-page canvas/overlays. All slashes,
 *    speed lines, and energy shards are clipped to a bounded celebration region (420x180)
 *    anchored directly to the result panel. Never covers the editor, navigation, or problem statement.
 * 2. 100% Crisp Vector Graphics: No blur filters on text or badges. Subpixel antialiasing
 *    and precision SVG geometry at every frame.
 * 3. Controlled 4-Phase Lifecycle:
 *    - Phase 1 (0–250 ms): Quick directional emerald energy slash with clipped manga speed lines.
 *    - Phase 2 (250–850 ms): Snappy anime victory reveal with checkmark crest, sharp typography,
 *      and diagonal light sweep glint.
 *    - Phase 3 (850–1400 ms): Deliberate, elegant burst of 12 angular emerald shards with kinetic drag.
 *    - Phase 4 (1400–2000 ms): Smooth ease-out, complete DOM and RAF teardown by 1880ms.
 * 4. Zero Layout Shifts & Non-Blocking: pointer-events: none on container and all children.
 * 5. Respects prefers-reduced-motion.
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

  // Cancel any running celebration to prevent overlapping instances
  stopAcceptedCelebration();

  const {
    anchorElement = null,
    themeAccent = '#34d399',
    verdictText = 'ACCEPTED',
  } = options;

  const winW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // Bounded celebration box dimensions (strictly localized!)
  const boxW = 420;
  const boxH = 180;

  // Calculate anchor coordinates with stable, deliberate fallback
  let originX = Math.round(winW * 0.5);
  let originY = Math.round(Math.min(winH * 0.38, 280));

  if (anchorElement && typeof anchorElement.getBoundingClientRect === 'function') {
    const rect = anchorElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const rawX = rect.left + rect.width / 2;
      const rawY = rect.top + rect.height / 2;

      // Only accept if within or reasonably adjacent to visible viewport
      if (rawX >= -50 && rawX <= winW + 50 && rawY >= -50 && rawY <= winH + 50) {
        originX = rawX;
        originY = rawY;
      }
    }
  }

  // Viewport bounds clamp: ensure the 420x180 container never clips outside the screen edges
  const minX = Math.min(boxW / 2 + 12, winW / 2);
  const maxX = Math.max(minX, winW - boxW / 2 - 12);
  const minY = Math.min(boxH / 2 + 12, winH / 2);
  const maxY = Math.max(minY, winH - boxH / 2 - 12);

  originX = Math.max(minX, Math.min(maxX, originX));
  originY = Math.max(minY, Math.min(maxY, originY));

  // Create isolated, strictly bounded container (NO full-page overlay!)
  const container = document.createElement('div');
  container.id = 'themeflow-anime-celebration';
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, {
    position: 'fixed',
    left: `${originX}px`,
    top: `${originY}px`,
    width: `${boxW}px`,
    height: `${boxH}px`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: '9999999',
    overflow: 'hidden',
  });

  // Inject scoped keyframes if not already present
  ensureAnimeImpactStyles();

  // Internal center coordinates relative to the 420x180 container
  const localCx = boxW / 2;
  const localCy = boxH / 2;

  // 1. Phase 1: Directional Katana Slash & Manga Speed Lines (0-250ms)
  const impactSvg = createImpactSvg(localCx, localCy, boxW, boxH, themeAccent);
  container.appendChild(impactSvg);

  // 2. Phase 2: Anime Victory Reveal HUD Treatment Badge (200-1800ms)
  const victoryBadge = createAnimeVictoryBadge(localCx, localCy, verdictText, themeAccent);
  container.appendChild(victoryBadge);

  // 3. Phase 3: Clipped Localized Energy Shards Canvas (300-1400ms)
  const canvas = document.createElement('canvas');
  canvas.width = boxW;
  canvas.height = boxH;
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

  // Localized Shard Simulation (strictly clipped inside 420x180 container!)
  let animId: number | null = null;
  let isCleanedUp = false;
  const ctx = canvas.getContext('2d');
  const particles = spawnEmeraldShards(localCx, localCy, themeAccent);
  const startTime = performance.now();

  function render(now: number) {
    if (isCleanedUp) return;
    const elapsed = now - startTime;
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (elapsed > 240 && elapsed < 1500) {
      const progress = Math.min(1, (elapsed - 240) / 1260);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // High kinetic aerodynamic drag: particles decelerate rapidly in place (no upward drift!)
        p.vx *= 0.925;
        p.vy *= 0.925;
        p.rotation += p.rotSpeed;
        p.alpha = Math.max(0, 1 - Math.pow(progress, 1.35));

        if (p.alpha <= 0.01) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha * p.baseAlpha;

        if (p.shape === 'shard') {
          // Sharp manga kinetic diamond shard
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.6, 0);
          ctx.lineTo(0, -p.size * 2.2);
          ctx.lineTo(p.size * 0.6, 0);
          ctx.lineTo(0, p.size * 2.2);
          ctx.closePath();
          ctx.fill();
        } else {
          // Crisp pinpoint spark
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    if (elapsed < 1820) {
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

  // Auto-cleanup by 1880ms (strictly within design target)
  setTimeout(teardown, 1880);
}

/**
 * Creates anime-style directional katana slash, manga speed lines, and localized shock ring
 */
function createImpactSvg(cx: number, cy: number, w: number, h: number, accentColor: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  Object.assign(svg.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    shapeRendering: 'geometricPrecision',
    animation: 'tfImpactSvgFade 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    pointerEvents: 'none',
  });

  // Localized aura gradient
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <radialGradient id="tf-impact-aura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5" />
      <stop offset="30%" stop-color="#22c55e" stop-opacity="0.32" />
      <stop offset="70%" stop-color="${accentColor}" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
    </radialGradient>
  `;
  svg.appendChild(defs);

  // 1. Localized Aura Shockwave
  const aura = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  aura.setAttribute('cx', cx.toFixed(1));
  aura.setAttribute('cy', cy.toFixed(1));
  aura.setAttribute('r', '85');
  aura.setAttribute('fill', 'url(#tf-impact-aura)');
  aura.style.animation = 'tfAuraBurst 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(aura);

  // 2. Primary Directional Katana Slash (Fast anime angle: -22°)
  const slash1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  slash1.setAttribute('x1', (cx - 150).toFixed(1));
  slash1.setAttribute('y1', (cy + 46).toFixed(1));
  slash1.setAttribute('x2', (cx + 150).toFixed(1));
  slash1.setAttribute('y2', (cy - 46).toFixed(1));
  slash1.setAttribute('stroke', '#ffffff');
  slash1.setAttribute('stroke-width', '2.6');
  slash1.setAttribute('stroke-linecap', 'round');
  slash1.style.animation = 'tfKatanaCut1 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(slash1);

  // 3. Counter-Accent Slash (+30°)
  const slash2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  slash2.setAttribute('x1', (cx - 100).toFixed(1));
  slash2.setAttribute('y1', (cy - 38).toFixed(1));
  slash2.setAttribute('x2', (cx + 100).toFixed(1));
  slash2.setAttribute('y2', (cy + 38).toFixed(1));
  slash2.setAttribute('stroke', '#4ade80');
  slash2.setAttribute('stroke-width', '1.8');
  slash2.setAttribute('stroke-linecap', 'round');
  slash2.style.animation = 'tfKatanaCut2 0.22s 0.02s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(slash2);

  // 4. Clipped Manga Speed Needles (6 crisp vector accents aligned with slice direction)
  const needleAngles = [-35, -20, 10, 145, 160, 190];
  for (let i = 0; i < needleAngles.length; i++) {
    const rad = needleAngles[i] * (Math.PI / 180);
    const r1 = 30 + (i % 2) * 8;
    const r2 = 72 + (i % 3) * 14;

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
    needle.setAttribute('stroke-width', '1.6');
    needle.setAttribute('stroke-linecap', 'round');
    needle.style.animation = 'tfMangaNeedle 0.24s cubic-bezier(0.1, 0.9, 0.2, 1) forwards';
    svg.appendChild(needle);
  }

  // 5. Central Shock Ring
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('cx', cx.toFixed(1));
  ring.setAttribute('cy', cy.toFixed(1));
  ring.setAttribute('r', '12');
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', '#4ade80');
  ring.setAttribute('stroke-width', '2.0');
  ring.style.animation = 'tfShockRing 0.26s cubic-bezier(0.1, 0.8, 0.2, 1) forwards';
  svg.appendChild(ring);

  return svg;
}

/**
 * Creates high-contrast anime Victory treatment badge (100% sharp vector typography, zero blur)
 */
function createAnimeVictoryBadge(cx: number, cy: number, text: string, accentColor: string): HTMLElement {
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
    padding: '9px 18px',
    background: 'linear-gradient(135deg, rgba(4, 15, 8, 0.96) 0%, rgba(8, 26, 15, 0.98) 100%)',
    border: '1.5px solid #22c55e',
    borderRadius: '7px',
    boxShadow: '0 0 20px rgba(34, 197, 94, 0.35), 0 8px 24px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.16)',
    animation: 'tfVictorySequence 1.80s cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
    width: '5px',
    height: '5px',
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
    width: '5px',
    height: '5px',
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
    animation: 'tfGlintSweep 0.65s 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    pointerEvents: 'none',
  });
  badge.appendChild(glint);

  // Vector Anime Diamond Crest with Crisp Checkmark
  const iconWrap = document.createElement('div');
  Object.assign(iconWrap.style, {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 12px rgba(34, 197, 94, 0.65)',
    flexShrink: '0',
  });
  iconWrap.innerHTML = `
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
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

  // Primary Crisp ACCEPTED Label (100% sharp vector typography)
  const mainLabel = document.createElement('span');
  mainLabel.textContent = text;
  Object.assign(mainLabel.style, {
    fontSize: '16.5px',
    fontWeight: '800',
    letterSpacing: '0.16em',
    color: '#ffffff',
    textShadow: '0 0 12px rgba(34, 197, 94, 0.55)',
  });
  textCol.appendChild(mainLabel);

  badge.appendChild(textCol);

  // Right-hand HUD Status Indicator Tag
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

interface LocalizedShard {
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

function spawnEmeraldShards(cx: number, cy: number, accentColor: string): LocalizedShard[] {
  const particles: LocalizedShard[] = [];
  const palette = ['#4ade80', '#86efac', '#38bdf8', accentColor, '#ffffff'];
  const count = 14; // Restrained count: small, deliberate, elegant burst

  for (let i = 0; i < count; i++) {
    const angle = (i * (Math.PI * 2 / count)) + (Math.random() - 0.5) * 0.4;
    const speed = 1.5 + Math.random() * 2.2;

    const spawnX = cx + (Math.random() - 0.5) * 40;
    const spawnY = cy + (Math.random() - 0.5) * 14;

    particles.push({
      x: spawnX,
      y: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.0 + Math.random() * 2.2,
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

function ensureAnimeImpactStyles(): void {
  if (document.getElementById('themeflow-anime-keyframes')) return;

  const style = document.createElement('style');
  style.id = 'themeflow-anime-keyframes';
  style.textContent = `
    /* Phase 1: Directional Katana Cut 1 */
    @keyframes tfKatanaCut1 {
      0% {
        stroke-dasharray: 0 320;
        opacity: 0;
      }
      25% {
        opacity: 1;
      }
      100% {
        stroke-dasharray: 320 0;
        opacity: 0;
      }
    }

    /* Phase 1: Counter-Accent Cut 2 */
    @keyframes tfKatanaCut2 {
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

    /* Phase 1: Clipped Manga Speed Needles */
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

    /* Phase 1: Restrained Localized Aura Shockwave */
    @keyframes tfAuraBurst {
      0% {
        r: 16px;
        opacity: 0.95;
      }
      100% {
        r: 90px;
        opacity: 0;
      }
    }

    /* Phase 1: Central Shock Ring */
    @keyframes tfShockRing {
      0% {
        r: 6px;
        opacity: 1;
        stroke-width: 3.0px;
      }
      100% {
        r: 75px;
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
        transform: translate(-50%, -50%) scale(0.85);
        opacity: 0;
      }
      14% {
        transform: translate(-50%, -50%) scale(1.02);
        opacity: 1;
      }
      22% {
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

    /* Phase 2: Diagonal Glint Sweep */
    @keyframes tfGlintSweep {
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
