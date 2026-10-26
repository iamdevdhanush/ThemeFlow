/**
 * ThemeFlow — SEAM: Cinematic Anime Motion Sequence Engine
 * 
 * Implemented strictly according to "Theme Semantic Motion Design.md".
 * 
 * Visual Architecture:
 * - 0.00s–0.30s [Tension]: Subtle workspace desaturation (-35%), corner ink washes creep inward,
 *   trembling white hairline at (X: 180, Y: 120). Center workspace remains pristine.
 * - 0.30s–0.40s [The Cut]: Hairline snaps into extreme diagonal acceleration (bottom-left to upper-right)
 *   with an incandescent white core (3.0px) and violet-cyan dispersion fringe (4.5px).
 * - 0.40s–0.48s [Impact Frame]: 3 frames of high-contrast B&W manga impact flash and outer speed rays,
 *   with a controlled 4px impact jolt.
 * - 0.48s–0.90s [The Seam Opens]: Diagonal incision widens like cut paper; ~20 needle-thin diamond sparks
 *   travel along vector with aerodynamic deceleration (vx *= 0.91). Zero floating confetti.
 * - 0.90s–1.10s [The Reveal]: Tapered black ink-brush ribbon reveals crisp paper-white ACCEPTED typography
 *   with a vermillion circular AC seal stamped decisively on the right with scale-and-rotation settle.
 * - 1.10s–1.70s [Victory Hold]: 45° delicate white-cyan light sweep crosses ribbon; seal holds with pressed-paper depth.
 * - 1.70s–2.20s [Resolution & Restoration]: Ribbon cleaves along diagonal and slides away; seam retracts
 *   into a hairline and dissolves; corner ink recedes; 100% workspace restoration by 2.20s.
 */

export interface CelebrationOptions {
  anchorElement?: HTMLElement | null;
  themeAccent?: string;
  verdictText?: string;
}

let activeCelebrationTeardown: (() => void) | null = null;

/**
 * Immediately cancels and cleans up any active celebration.
 */
export function stopAcceptedCelebration(): void {
  if (activeCelebrationTeardown) {
    activeCelebrationTeardown();
    activeCelebrationTeardown = null;
  }
}

/**
 * Triggers the authoritative ThemeFlow SEAM celebration sequence.
 */
export function fireAcceptedCelebration(options: CelebrationOptions = {}): void {
  // Respect user preference for reduced motion
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Teardown any running instance to prevent overlapping animations
  stopAcceptedCelebration();

  const {
    verdictText = 'ACCEPTED',
  } = options;

  const winW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // Root container: locked camera, fixed 16:9 or full viewport, pointer-transparent
  const container = document.createElement('div');
  container.id = 'themeflow-anime-celebration';
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '9999999',
    overflow: 'hidden',
    userSelect: 'none',
  });

  // Inject scoped keyframes
  ensureSeamStyles();

  // 1. Scene 1 — Tension: Desaturation Filter & Corner Ink Washes
  const desaturateOverlay = document.createElement('div');
  desaturateOverlay.className = 'tf-seam-desaturate';
  container.appendChild(desaturateOverlay);

  const cornerWashes = createCornerInkWashes();
  container.appendChild(cornerWashes);

  // 2. Scene 1 & 2 — Hairline & Diagonal Blade Cut SVG
  const bladeSvg = createBladeCutSvg(winW, winH);
  container.appendChild(bladeSvg);

  // 3. Scene 3 — Monochrome Manga Impact Frame (Flash & Outer Speed Rays)
  const impactFrame = createMangaImpactFrame(winW, winH);
  container.appendChild(impactFrame);

  // 4. Scene 4 — The Seam Opens & Directional Sparks Canvas
  const sparksCanvas = document.createElement('canvas');
  sparksCanvas.className = 'tf-seam-sparks';
  sparksCanvas.width = winW;
  sparksCanvas.height = winH;
  Object.assign(sparksCanvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  });
  container.appendChild(sparksCanvas);

  // 5. Scene 5 & 6 — The Reveal: Tapered Ink-Brush Ribbon, Typography & Vermillion Seal
  const revealRibbon = createInkBrushRibbon(winW, winH, verdictText);
  container.appendChild(revealRibbon);

  document.body.appendChild(container);

  // Animate Sparks Simulation (Scene 4: 0.48s – 0.90s)
  let animId: number | null = null;
  let isCleanedUp = false;
  const ctx = sparksCanvas.getContext('2d');
  const sparks = spawnDirectionalSparks(winW, winH);
  const startTime = performance.now();

  function render(now: number) {
    if (isCleanedUp) return;
    const elapsed = (now - startTime) / 1000; // seconds

    if (ctx) {
      ctx.clearRect(0, 0, sparksCanvas.width, sparksCanvas.height);

      if (elapsed >= 0.46 && elapsed <= 0.96) {
        const progress = (elapsed - 0.46) / 0.50;

        for (const s of sparks) {
          s.prevX = s.x;
          s.prevY = s.y;

          s.x += s.vx;
          s.y += s.vy;

          // Aerodynamic deceleration along cut vector
          s.vx *= 0.912;
          s.vy *= 0.912;

          s.alpha = Math.max(0, 1 - Math.pow(progress, 1.4));
          if (s.alpha <= 0.01) continue;

          ctx.save();
          ctx.globalAlpha = s.alpha;

          // Draw needle-thin directional diamond spark
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.prevX, s.prevY);
          ctx.lineTo(s.x, s.y);
          if (typeof ctx.stroke === 'function') {
            ctx.stroke();
          }

          ctx.restore();
        }
      }
    }

    if (elapsed < 2.20) {
      animId = requestAnimationFrame(render);
    }
  }

  animId = requestAnimationFrame(render);

  // Complete Restoration & Teardown at exactly 2.20s (2200ms)
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
  setTimeout(teardown, 2200);
}

/**
 * Scene 1: Corner sumi-e ink washes creeping inward without obscuring the center.
 */
function createCornerInkWashes(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'tf-seam-ink-corners';
  Object.assign(wrap.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
  });

  const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  corners.forEach((c) => {
    const el = document.createElement('div');
    el.className = `tf-seam-corner tf-seam-corner-${c}`;
    wrap.appendChild(el);
  });

  return wrap;
}

/**
 * Scene 1 & 2: Trembling hairline at (X:180, Y:120) accelerating into a white-hot diagonal cut (34°).
 */
function createBladeCutSvg(w: number, h: number): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  Object.assign(svg.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    shapeRendering: 'geometricPrecision',
    pointerEvents: 'none',
  });

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <!-- Violet-Cyan Chromatic Energy Fringe Gradient -->
    <linearGradient id="tf-cut-fringe" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.95" />
      <stop offset="60%" stop-color="#a855f7" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.95" />
    </linearGradient>
  `;
  svg.appendChild(defs);

  // 1. Scene 1: Trembling hairline at (180, 120)
  const tremLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  tremLine.setAttribute('x1', '140');
  tremLine.setAttribute('y1', '120');
  tremLine.setAttribute('x2', '220');
  tremLine.setAttribute('y2', '120');
  tremLine.setAttribute('stroke', '#ffffff');
  tremLine.setAttribute('stroke-width', '1.2');
  tremLine.setAttribute('stroke-linecap', 'round');
  tremLine.style.animation = 'tfTrembleHairline 0.30s linear forwards';
  svg.appendChild(tremLine);

  // 2. Scene 2: Diagonal Cut Path from bottom-left (120, 960) to upper-right (1840, 80)
  const x1 = Math.round(w * 0.06);
  const y1 = Math.round(h * 0.92);
  const x2 = Math.round(w * 0.96);
  const y2 = Math.round(h * 0.08);
  const length = Math.round(Math.hypot(x2 - x1, y2 - y1));

  // 2a. Outer Violet-Cyan Dispersion Fringe (4.5px)
  const cutFringe = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  cutFringe.setAttribute('x1', String(x1));
  cutFringe.setAttribute('y1', String(y1));
  cutFringe.setAttribute('x2', String(x2));
  cutFringe.setAttribute('y2', String(y2));
  cutFringe.setAttribute('stroke', 'url(#tf-cut-fringe)');
  cutFringe.setAttribute('stroke-width', '7.5');
  cutFringe.setAttribute('stroke-linecap', 'round');
  cutFringe.style.strokeDasharray = `${length} ${length}`;
  cutFringe.style.strokeDashoffset = String(length);
  cutFringe.style.animation = 'tfBladeCutFringe 2.20s cubic-bezier(0.85, 0.0, 0.15, 1.0) forwards';
  svg.appendChild(cutFringe);

  // 2b. Solid Incandescent Paper White Core (3.0px)
  const cutCore = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  cutCore.setAttribute('x1', String(x1));
  cutCore.setAttribute('y1', String(y1));
  cutCore.setAttribute('x2', String(x2));
  cutCore.setAttribute('y2', String(y2));
  cutCore.setAttribute('stroke', '#ffffff');
  cutCore.setAttribute('stroke-width', '3.0');
  cutCore.setAttribute('stroke-linecap', 'round');
  cutCore.style.strokeDasharray = `${length} ${length}`;
  cutCore.style.strokeDashoffset = String(length);
  cutCore.style.animation = 'tfBladeCutCore 2.20s cubic-bezier(0.85, 0.0, 0.15, 1.0) forwards';
  svg.appendChild(cutCore);

  return svg;
}

/**
 * Scene 3: High-contrast monochrome manga impact frame with outer ink speed rays.
 */
function createMangaImpactFrame(w: number, h: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'tf-seam-impact-frame';
  Object.assign(wrap.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
  });

  // Negative diagonal swath flash
  const swath = document.createElement('div');
  swath.className = 'tf-seam-impact-swath';
  wrap.appendChild(swath);

  // Outer high-contrast black ink speed rays
  const raysSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  raysSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  raysSvg.className = 'tf-seam-speed-rays';
  Object.assign(raysSvg.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
  });

  const angles = [15, 32, 50, 195, 212, 230];
  angles.forEach((deg) => {
    const rad = deg * (Math.PI / 180);
    const cx = w / 2;
    const cy = h / 2;
    const r1 = Math.max(w, h) * 0.42;
    const r2 = Math.max(w, h) * 0.58;

    const x1 = cx + Math.cos(rad) * r1;
    const y1 = cy + Math.sin(rad) * r1;
    const x2 = cx + Math.cos(rad) * r2;
    const y2 = cy + Math.sin(rad) * r2;

    const ray = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ray.setAttribute('x1', x1.toFixed(1));
    ray.setAttribute('y1', y1.toFixed(1));
    ray.setAttribute('x2', x2.toFixed(1));
    ray.setAttribute('y2', y2.toFixed(1));
    ray.setAttribute('stroke', '#000000');
    ray.setAttribute('stroke-width', '4.2');
    ray.setAttribute('stroke-linecap', 'round');
    raysSvg.appendChild(ray);
  });

  wrap.appendChild(raysSvg);
  return wrap;
}

/**
 * Scene 5, 6 & 7: Tapered black ink-brush ribbon with ACCEPTED typography & vermillion AC seal.
 */
function createInkBrushRibbon(winW: number, winH: number, text: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tf-seam-reveal-container';
  Object.assign(container.style, {
    position: 'absolute',
    left: '50%',
    top: `${Math.round(winH * 0.28)}px`,
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  });

  // Ribbon wrapper that cleaves and slides away in Scene 7
  const ribbonWrap = document.createElement('div');
  ribbonWrap.className = 'tf-seam-ribbon-wrap';
  Object.assign(ribbonWrap.style, {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 28px',
    background: '#000000',
    color: '#f8fafc',
    borderRadius: '4px',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.95), inset 0 0 12px rgba(255, 255, 255, 0.08)',
    clipPath: 'polygon(0% 12%, 97% 0%, 100% 88%, 3% 100%)',
  });

  // Diagonal Light Sweep Glint across the ribbon (Scene 6: 1.10s – 1.70s)
  const glint = document.createElement('div');
  glint.className = 'tf-seam-ribbon-glint';
  ribbonWrap.appendChild(glint);

  // Typography Content Area
  const content = document.createElement('div');
  content.className = 'tf-seam-text-content';
  Object.assign(content.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginRight: '36px',
  });

  // Hero ACCEPTED Typography (Clean Neo-Grotesque / Paper White)
  const title = document.createElement('div');
  title.className = 'tf-seam-title';
  title.textContent = text;
  Object.assign(title.style, {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter Display', 'JetBrains Mono', Roboto, sans-serif",
    fontSize: '32px',
    fontWeight: '900',
    letterSpacing: '0.28em',
    color: '#f8fafc',
    textTransform: 'uppercase',
    textShadow: '0 0 16px rgba(255, 255, 255, 0.45), 0 0 32px rgba(139, 92, 246, 0.35)',
    lineHeight: '1.05',
    WebkitFontSmoothing: 'antialiased',
  });
  content.appendChild(title);

  // Subtitle
  const sub = document.createElement('div');
  sub.className = 'tf-seam-subtitle';
  sub.textContent = 'SUBMISSION VERIFIED';
  Object.assign(sub.style, {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'JetBrains Mono', sans-serif",
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.35em',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    marginTop: '5px',
  });
  content.appendChild(sub);

  ribbonWrap.appendChild(content);

  // Vermillion Japanese-Inspired AC Circular Seal Stamp (Scene 5: Stamps firmly at right end)
  const seal = document.createElement('div');
  seal.className = 'tf-seam-vermillion-seal';
  Object.assign(seal.style, {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #e11d48 0%, #dc2626 70%, #9f1239 100%)',
    border: '2px solid #fecdd3',
    boxShadow: '0 0 16px rgba(225, 29, 72, 0.65), inset 0 0 8px rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    position: 'relative',
  });

  seal.innerHTML = `
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none" style="display:block;">
      <!-- Outer gold-accented rim ticks -->
      <circle cx="23" cy="23" r="19" stroke="#fecdd3" stroke-width="1.2" stroke-dasharray="3 3" />
      <!-- Japanese-style stylized AC vector emblem -->
      <path d="M14 28 L19 14 L24 28 M16 24 L22 24" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M33 18 C30 14, 25 16, 25 21 C25 26, 30 28, 33 24" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" />
    </svg>
  `;
  ribbonWrap.appendChild(seal);

  container.appendChild(ribbonWrap);
  return container;
}

interface SeamSpark {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

/**
 * Scene 4: Exactly 18–20 needle-thin diamond sparks traveling along cut vector.
 */
function spawnDirectionalSparks(w: number, h: number): SeamSpark[] {
  const sparks: SeamSpark[] = [];
  const count = 20;

  // Diagonal cut vector angle ~34° (cos ~0.83, sin ~-0.55)
  const cutAngle = -Math.atan2(h * 0.84, w * 0.90);
  const palette = ['#ffffff', '#f8fafc', '#a855f7', '#06b6d4', '#8b5cf6'];

  const cx = w * 0.52;
  const cy = h * 0.48;

  for (let i = 0; i < count; i++) {
    // Vector alignment with slight dispersion
    const spread = (Math.random() - 0.5) * 0.35;
    const angle = cutAngle + spread;
    const speed = 7.0 + Math.random() * 8.5;

    const startSpread = (Math.random() - 0.5) * 160;
    const spawnX = cx + Math.cos(cutAngle) * startSpread;
    const spawnY = cy + Math.sin(cutAngle) * startSpread;

    sparks.push({
      x: spawnX,
      y: spawnY,
      prevX: spawnX,
      prevY: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1.5 + Math.random() * 1.5,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: 1,
    });
  }

  return sparks;
}

/**
 * Injects the complete 2.20s SEAM motion keyframe style sheet.
 */
function ensureSeamStyles(): void {
  if (document.getElementById('themeflow-seam-keyframes')) return;

  const style = document.createElement('style');
  style.id = 'themeflow-seam-keyframes';
  style.textContent = `
    /* Scene 1: Subtle Workspace Desaturation (0.00s–0.30s) */
    .tf-seam-desaturate {
      position: absolute;
      inset: 0;
      backdrop-filter: grayscale(35%);
      -webkit-backdrop-filter: grayscale(35%);
      pointer-events: none;
      animation: tfDesaturateSequence 2.20s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes tfDesaturateSequence {
      0% { opacity: 0; }
      14% { opacity: 1; }
      75% { opacity: 1; }
      100% { opacity: 0; }
    }

    /* Scene 1: Corner Sumi-e Ink Washes */
    .tf-seam-corner {
      position: absolute;
      width: 240px;
      height: 240px;
      pointer-events: none;
      background: radial-gradient(circle, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0) 70%);
      animation: tfCornerInkSequence 2.20s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .tf-seam-corner-top-left { top: 0; left: 0; }
    .tf-seam-corner-top-right { top: 0; right: 0; }
    .tf-seam-corner-bottom-left { bottom: 0; left: 0; }
    .tf-seam-corner-bottom-right { bottom: 0; right: 0; }
    @keyframes tfCornerInkSequence {
      0% { opacity: 0; transform: scale(0.6); }
      14% { opacity: 1; transform: scale(1.0); }
      75% { opacity: 1; transform: scale(1.0); }
      100% { opacity: 0; transform: scale(0.7); }
    }

    /* Scene 1: Trembling Hairline at (X:180, Y:120) */
    @keyframes tfTrembleHairline {
      0% { transform: translateY(0); opacity: 0; }
      20% { opacity: 1; transform: translateY(-0.8px); }
      40% { transform: translateY(0.8px); }
      60% { transform: translateY(-0.6px); }
      80% { transform: translateY(0.6px); }
      100% { transform: translateY(0); opacity: 0; }
    }

    /* Scene 2: Diagonal Blade Cut (0.30s–0.40s) */
    @keyframes tfBladeCutFringe {
      0% { stroke-dashoffset: 2400; opacity: 0; }
      13% { stroke-dashoffset: 2400; opacity: 0; }
      18% { stroke-dashoffset: 0; opacity: 1; }
      38% { opacity: 0.95; }
      75% { opacity: 0.85; stroke-dashoffset: 0; }
      100% { stroke-dashoffset: 0; opacity: 0; }
    }
    @keyframes tfBladeCutCore {
      0% { stroke-dashoffset: 2400; opacity: 0; }
      13% { stroke-dashoffset: 2400; opacity: 0; }
      17% { stroke-dashoffset: 0; opacity: 1; }
      38% { opacity: 1; }
      75% { opacity: 0.9; stroke-dashoffset: 0; }
      100% { stroke-dashoffset: 0; opacity: 0; }
    }

    /* Scene 3: Manga Impact Frame (0.40s–0.48s) */
    .tf-seam-impact-swath {
      position: absolute;
      inset: 0;
      background: linear-gradient(34deg, transparent 40%, rgba(255, 255, 255, 0.92) 49%, rgba(0, 0, 0, 0.95) 51%, transparent 60%);
      opacity: 0;
      animation: tfMangaSwathFlash 2.20s linear forwards;
    }
    @keyframes tfMangaSwathFlash {
      0% { opacity: 0; }
      17.5% { opacity: 0; }
      18.2% { opacity: 1; transform: translateY(-4px); } /* 4px camera jolt */
      20.5% { opacity: 0.8; transform: translateY(0); }
      22.0% { opacity: 0; }
      100% { opacity: 0; }
    }
    .tf-seam-speed-rays {
      opacity: 0;
      animation: tfMangaSpeedRays 2.20s linear forwards;
    }
    @keyframes tfMangaSpeedRays {
      0% { opacity: 0; }
      18.0% { opacity: 0; }
      18.5% { opacity: 1; }
      21.5% { opacity: 1; }
      22.5% { opacity: 0; }
      100% { opacity: 0; }
    }

    /* Scene 5, 6 & 7: Tapered Ink-Brush Ribbon Animation */
    .tf-seam-reveal-container {
      animation: tfRevealContainer 2.20s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes tfRevealContainer {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
      40% { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
      45% { opacity: 1; transform: translate(-50%, -50%) scale(1.02); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
      76% { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
      85% { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
      100% { opacity: 0; }
    }

    /* Ribbon Cleave and Slide in Scene 7 (1.70s–2.20s) */
    .tf-seam-ribbon-wrap {
      animation: tfRibbonCleave 2.20s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes tfRibbonCleave {
      0% { transform: none; }
      76% { transform: none; }
      88% { transform: translate(35px, -18px); opacity: 0.85; }
      100% { transform: translate(90px, -45px); opacity: 0; }
    }

    /* Vermillion Seal Stamp & Settle (Scene 5: Frame 62 / ~0.95s) */
    .tf-seam-vermillion-seal {
      animation: tfSealStamp 2.20s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    @keyframes tfSealStamp {
      0% { opacity: 0; transform: scale(2.2) rotate(-16deg); }
      41% { opacity: 0; transform: scale(2.2) rotate(-16deg); }
      44% { opacity: 1; transform: scale(1.12) rotate(4deg); }
      47% { opacity: 1; transform: scale(1.0) rotate(0deg); }
      100% { opacity: 1; transform: scale(1.0) rotate(0deg); }
    }

    /* Scene 6: Diagonal Light Sweep Glint Across Ribbon (1.10s–1.70s) */
    .tf-seam-ribbon-glint {
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.85) 50%, rgba(6, 182, 212, 0.7) 60%, transparent 80%);
      transform: translateX(-160%) skewX(-26deg);
      animation: tfRibbonGlintSweep 2.20s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      pointer-events: none;
    }
    @keyframes tfRibbonGlintSweep {
      0% { transform: translateX(-160%) skewX(-26deg); }
      50% { transform: translateX(-160%) skewX(-26deg); }
      68% { transform: translateX(260%) skewX(-26deg); }
      100% { transform: translateX(260%) skewX(-26deg); }
    }
  `;
  document.head.appendChild(style);
}
