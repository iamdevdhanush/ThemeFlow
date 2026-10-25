/**
 * ThemeFlow — SEAM: Cinematic Anime Acceptance Animation
 * 
 * Master Motion Sequence: 8-Frame Storyboard Implementation
 * - Frame 01 (0.00–0.30s): TENSION — Subtle workspace desaturation, corner ink gather, hairline tremor.
 * - Frame 02 (0.30–0.40s): THE CUT — Brilliant white-hot diagonal slash (BL to TR) with violet-cyan fringe.
 * - Frame 03 (0.40–0.48s): IMPACT FRAME — High-contrast B&W manga impact frame with radial ink speed rays & 3px jolt.
 * - Frame 04 (0.48–0.90s): THE SEAM OPENS — Incision widens like parted paper with 20 directional kinetic sparks.
 * - Frame 05 (0.90–1.10s): THE REVEAL — Tapered black sumi-e ink-brush stroke with crisp ACCEPTED typography & vermillion AC seal.
 * - Frame 06 (1.10–1.70s): VICTORY HOLD — Held composition, delicate light sweep along the slash/lettering.
 * - Frame 07 (1.70–2.00s): RESOLUTION — Brush stroke cleaves along cut diagonal and slides away, seam retracts.
 * - Frame 08 (2.00–2.20s): BACK TO NORMAL — Complete teardown, 100% page restoration with 0 layout shifts.
 * 
 * Strict Palette:
 * - Charcoal black: #0C0D10
 * - Deep charcoal: #14161B
 * - Paper white: #F8FAFC
 * - Violet accent: #8B5CF6
 * - Cyan accent: #06B6D4
 * - Vermillion seal: #E11D48
 */

export interface CelebrationOptions {
  anchorElement?: HTMLElement | null;
  themeAccent?: string;
  verdictText?: string;
}

let activeCelebrationTeardown: (() => void) | null = null;

/**
 * Immediately cancels and cleans up any currently active celebration.
 */
export function stopAcceptedCelebration(): void {
  if (activeCelebrationTeardown) {
    activeCelebrationTeardown();
    activeCelebrationTeardown = null;
  }
}

/**
 * Triggers the SEAM Cinematic Anime Acceptance Animation.
 */
export function fireAcceptedCelebration(options: CelebrationOptions = {}): void {
  const isReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cancel any running celebration to prevent overlapping instances
  stopAcceptedCelebration();

  const { verdictText = 'ACCEPTED' } = options;

  const winW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 1080;

  // Handle reduced motion preference: restrained brief title + seal fade
  if (isReducedMotion) {
    runReducedMotionCelebration(verdictText, winW, winH);
    return;
  }

  // Create isolated, full-viewport transparent celebration overlay
  const container = document.createElement('div');
  container.id = 'themeflow-seam-celebration';
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

  // Inject scoped keyframes and styles
  ensureSeamStyles();

  // Frame 01: Tension Layer (Desaturation & 4-corner ink wash)
  const tensionLayer = createTensionLayer();
  container.appendChild(tensionLayer);

  // Frame 02 & 04: Diagonal Energy Slash & Opening Seam (SVG)
  const slashSvg = createEnergySlashSvg(winW, winH);
  container.appendChild(slashSvg);

  // Frame 03: High-Contrast B&W Manga Impact Frame (80ms flash)
  const impactLayer = createMangaImpactFrame(winW, winH);
  container.appendChild(impactLayer);

  // Frame 04: Directional Sparks Particle Canvas
  const sparksCanvas = document.createElement('canvas');
  sparksCanvas.width = winW;
  sparksCanvas.height = winH;
  Object.assign(sparksCanvas.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  });
  container.appendChild(sparksCanvas);

  // Frame 05 & 06: Ink-Brush Banner with ACCEPTED typography & Vermillion AC Seal
  const victoryBanner = createInkBrushVictoryBanner(verdictText);
  container.appendChild(victoryBanner);

  document.body.appendChild(container);

  // Directional Kinetic Sparks Simulation
  let animId: number | null = null;
  let isCleanedUp = false;
  const ctx = sparksCanvas.getContext('2d');
  const sparks = spawnSeamSparks(winW, winH);
  const startTime = performance.now();

  function render(now: number) {
    if (isCleanedUp) return;
    const elapsed = now - startTime;

    if (ctx) {
      ctx.clearRect(0, 0, sparksCanvas.width, sparksCanvas.height);

      // Sparks active from Frame 04 through Frame 06 (0.45s to 1.70s)
      if (elapsed >= 420 && elapsed <= 1750) {
        const progress = (elapsed - 420) / 1330;

        for (const p of sparks) {
          p.prevX = p.x;
          p.prevY = p.y;
          p.x += p.vx;
          p.y += p.vy;

          // Strong aerodynamic deceleration along the cut direction
          p.vx *= 0.932;
          p.vy *= 0.932;
          p.alpha = Math.max(0, 1 - Math.pow(progress, 1.3));

          if (p.alpha <= 0.01) continue;

          ctx.save();
          ctx.globalAlpha = p.alpha * p.baseAlpha;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.prevX, p.prevY);
          ctx.lineTo(p.x, p.y);
          if (typeof ctx.stroke === 'function') {
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    }

    if (elapsed < 2180) {
      animId = requestAnimationFrame(render);
    }
  }

  animId = requestAnimationFrame(render);

  // Complete Teardown Handler (Frame 08: Back to Normal at 2.20s)
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

  // Exact lifecycle: 2.18s auto-cleanup
  setTimeout(teardown, 2180);
}

/**
 * Fallback for reduced-motion preference: crisp, restrained fade of typography and seal.
 */
function runReducedMotionCelebration(text: string, winW: number, winH: number): void {
  const container = document.createElement('div');
  container.id = 'themeflow-seam-celebration';
  Object.assign(container.style, {
    position: 'fixed',
    top: '35%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 28px',
    background: '#0C0D10',
    border: '1.5px solid #E11D48',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
    pointerEvents: 'none',
    zIndex: '9999999',
    opacity: '0',
    transition: 'opacity 0.25s ease-out',
  });

  const label = document.createElement('span');
  label.textContent = text;
  Object.assign(label.style, {
    fontSize: '22px',
    fontWeight: '900',
    letterSpacing: '0.22em',
    color: '#F8FAFC',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif",
  });
  container.appendChild(label);

  const seal = document.createElement('div');
  Object.assign(seal.style, {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid #E11D48',
    color: '#E11D48',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
    fontSize: '13px',
    letterSpacing: '0.05em',
  });
  seal.textContent = 'AC';
  container.appendChild(seal);

  document.body.appendChild(container);

  requestAnimationFrame(() => {
    container.style.opacity = '1';
  });

  setTimeout(() => {
    container.style.opacity = '0';
    setTimeout(() => {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, 300);
  }, 1200);
}

/**
 * Frame 01 — TENSION Layer (0.00–0.30s)
 * Gathers subtle dark ink vignettes in the 4 screen corners and presents a faint trembling hairline.
 */
function createTensionLayer(): HTMLElement {
  const layer = document.createElement('div');
  layer.className = 'seam-tension-layer';
  Object.assign(layer.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    animation: 'seamTensionAnim 2.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    background: `
      radial-gradient(circle at 0% 0%, rgba(12, 13, 16, 0.72) 0%, transparent 45%),
      radial-gradient(circle at 100% 0%, rgba(12, 13, 16, 0.72) 0%, transparent 45%),
      radial-gradient(circle at 0% 100%, rgba(12, 13, 16, 0.72) 0%, transparent 45%),
      radial-gradient(circle at 100% 100%, rgba(12, 13, 16, 0.72) 0%, transparent 45%)
    `,
  });

  // Hairline tremor at upper left (0.00–0.30s)
  const tremor = document.createElement('div');
  Object.assign(tremor.style, {
    position: 'absolute',
    top: '12%',
    left: '8%',
    width: '80px',
    height: '1.2px',
    background: 'linear-gradient(90deg, transparent, #F8FAFC, transparent)',
    opacity: '0.8',
    transform: 'rotate(32deg)',
    animation: 'seamTremorAnim 0.30s ease-in-out forwards',
  });
  layer.appendChild(tremor);

  return layer;
}

/**
 * Frame 02 & Frame 04: The Cut and The Seam Opens (SVG)
 * Bottom-left to top-right diagonal energy arc with white core, violet-cyan fringes,
 * and opening incision gap.
 */
function createEnergySlashSvg(w: number, h: number): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  Object.assign(svg.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    shapeRendering: 'geometricPrecision',
    pointerEvents: 'none',
  });

  // Diagonal slash coordinates from bottom-left to top-right
  const x1 = -w * 0.08;
  const y1 = h * 1.08;
  const x2 = w * 1.08;
  const y2 = -h * 0.08;
  const slashLen = Math.hypot(x2 - x1, y2 - y1);

  // Defs: Violet-Cyan gradient & glow filters
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="seamCutGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#F8FAFC" stop-opacity="1" />
      <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.9" />
    </linearGradient>
    <filter id="seamVioletCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // Outer Cyan Dispersion Fringe
  const cyanAura = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  cyanAura.setAttribute('x1', String(x1));
  cyanAura.setAttribute('y1', String(y1));
  cyanAura.setAttribute('x2', String(x2));
  cyanAura.setAttribute('y2', String(y2));
  cyanAura.setAttribute('stroke', '#06B6D4');
  cyanAura.setAttribute('stroke-width', '18');
  cyanAura.setAttribute('stroke-linecap', 'round');
  cyanAura.setAttribute('opacity', '0.75');
  cyanAura.style.strokeDasharray = `${slashLen} ${slashLen}`;
  cyanAura.style.strokeDashoffset = String(slashLen);
  cyanAura.style.animation = 'seamCutAura 1.70s 0.28s cubic-bezier(0.85, 0, 0.15, 1) forwards';
  svg.appendChild(cyanAura);

  // Middle Violet Energy Fringe
  const violetBlade = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  violetBlade.setAttribute('x1', String(x1));
  violetBlade.setAttribute('y1', String(y1));
  violetBlade.setAttribute('x2', String(x2));
  violetBlade.setAttribute('y2', String(y2));
  violetBlade.setAttribute('stroke', '#8B5CF6');
  violetBlade.setAttribute('stroke-width', '7.5');
  violetBlade.setAttribute('stroke-linecap', 'round');
  violetBlade.style.strokeDasharray = `${slashLen} ${slashLen}`;
  violetBlade.style.strokeDashoffset = String(slashLen);
  violetBlade.style.animation = 'seamCutViolet 1.70s 0.29s cubic-bezier(0.85, 0, 0.15, 1) forwards';
  svg.appendChild(violetBlade);

  // Core Brilliant White-Hot Incision
  const whiteCore = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  whiteCore.setAttribute('x1', String(x1));
  whiteCore.setAttribute('y1', String(y1));
  whiteCore.setAttribute('x2', String(x2));
  whiteCore.setAttribute('y2', String(y2));
  whiteCore.setAttribute('stroke', '#F8FAFC');
  whiteCore.setAttribute('stroke-width', '3.2');
  whiteCore.setAttribute('stroke-linecap', 'round');
  whiteCore.style.strokeDasharray = `${slashLen} ${slashLen}`;
  whiteCore.style.strokeDashoffset = String(slashLen);
  whiteCore.style.animation = 'seamCutCore 1.70s 0.30s cubic-bezier(0.85, 0, 0.15, 1) forwards';
  svg.appendChild(whiteCore);

  // Frame 04: The Seam Opens — Two parallel separating incision lips (0.48s–1.70s)
  const seamLip1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seamLip1.setAttribute('x1', String(x1 - 6));
  seamLip1.setAttribute('y1', String(y1 - 10));
  seamLip1.setAttribute('x2', String(x2 - 6));
  seamLip1.setAttribute('y2', String(y2 - 10));
  seamLip1.setAttribute('stroke', 'rgba(139, 92, 246, 0.7)');
  seamLip1.setAttribute('stroke-width', '1.6');
  seamLip1.style.animation = 'seamLipLeft 1.40s 0.48s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(seamLip1);

  const seamLip2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seamLip2.setAttribute('x1', String(x1 + 6));
  seamLip2.setAttribute('y1', String(y1 + 10));
  seamLip2.setAttribute('x2', String(x2 + 6));
  seamLip2.setAttribute('y2', String(y2 + 10));
  seamLip2.setAttribute('stroke', 'rgba(6, 182, 212, 0.7)');
  seamLip2.setAttribute('stroke-width', '1.6');
  seamLip2.style.animation = 'seamLipRight 1.40s 0.48s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(seamLip2);

  // Frame 05 / 06 Glint Flare Star at Upper Intersection
  const flareCx = w * 0.58;
  const flareCy = h * 0.33;
  const starFlare = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const fRadius = 38;
  const starPath = `
    M ${flareCx} ${flareCy - fRadius}
    Q ${flareCx} ${flareCy} ${flareCx + fRadius} ${flareCy}
    Q ${flareCx} ${flareCy} ${flareCx} ${flareCy + fRadius}
    Q ${flareCx} ${flareCy} ${flareCx - fRadius} ${flareCy}
    Q ${flareCx} ${flareCy} ${flareCx} ${flareCy - fRadius}
    Z
  `;
  starFlare.setAttribute('d', starPath);
  starFlare.setAttribute('fill', '#FFFFFF');
  starFlare.style.transformOrigin = `${flareCx}px ${flareCy}px`;
  starFlare.style.animation = 'seamStarGlint 0.65s 0.88s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(starFlare);

  return svg;
}

/**
 * Frame 03 — IMPACT FRAME (0.40–0.48s)
 * 80ms high-contrast monochrome manga flash with radial ink speed rays and 3px jolt.
 */
function createMangaImpactFrame(w: number, h: number): HTMLElement {
  const frame = document.createElement('div');
  frame.className = 'seam-impact-frame';
  Object.assign(frame.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    opacity: '0',
    animation: 'seamImpactFlash 0.12s 0.40s steps(1, end) forwards',
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  Object.assign(svg.style, {
    width: '100%',
    height: '100%',
    shapeRendering: 'crispEdges',
  });

  const cx = w * 0.5;
  const cy = h * 0.5;

  // 16 aggressive manga ink speed rays radiating inward
  const rayCount = 18;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i * (Math.PI * 2 / rayCount)) + (Math.random() - 0.5) * 0.15;
    const outerR = Math.max(w, h) * 0.85;
    const innerR = 120 + (i % 3) * 60;

    const x1 = cx + Math.cos(angle) * outerR;
    const y1 = cy + Math.sin(angle) * outerR;
    const x2 = cx + Math.cos(angle) * innerR;
    const y2 = cy + Math.sin(angle) * innerR;

    const wedge = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const perpAngle = angle + Math.PI / 2;
    const wHalf = 6 + (i % 2) * 12;

    const px1 = x1 + Math.cos(perpAngle) * wHalf;
    const py1 = y1 + Math.sin(perpAngle) * wHalf;
    const px2 = x1 - Math.cos(perpAngle) * wHalf;
    const py2 = y1 - Math.sin(perpAngle) * wHalf;

    wedge.setAttribute('points', `${px1},${py1} ${px2},${py2} ${x2},${y2}`);
    wedge.setAttribute('fill', i % 2 === 0 ? '#0C0D10' : '#F8FAFC');
    svg.appendChild(wedge);
  }

  frame.appendChild(svg);
  return frame;
}

/**
 * Frame 05 & 06: Ink-Brush Banner, Typography ACCEPTED & Vermillion AC Seal
 * Organic horizontal sumi-e brush shape with real sharp typography and stamped vermillion seal.
 * Frame 07: Separates along cut diagonal line and slides away.
 */
function createInkBrushVictoryBanner(text: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'seam-victory-container';
  Object.assign(container.style, {
    position: 'absolute',
    top: '32%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    userSelect: 'none',
    animation: 'seamBannerSequence 2.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  });

  // Tapered Sumi-e Black Ink Brush Ribbon (SVG for crisp organic brush stroke edges)
  const brushWrap = document.createElement('div');
  brushWrap.className = 'seam-brush-wrapper';
  Object.assign(brushWrap.style, {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 36px 12px 42px',
    filter: 'drop-shadow(0 14px 34px rgba(0, 0, 0, 0.9))',
  });

  // Organic brush stroke background SVG (tapered bristles, natural manga ink contour)
  const brushSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  brushSvg.setAttribute('viewBox', '0 0 540 84');
  Object.assign(brushSvg.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    overflow: 'visible',
    pointerEvents: 'none',
  });

  brushSvg.innerHTML = `
    <!-- Top-left bristle flare -->
    <path d="M 18,36 C 8,40 2,42 0,44 C 8,46 16,45 28,43 Z" fill="#0C0D10" />
    <path d="M 28,26 C 14,30 6,34 2,36 C 12,38 22,37 38,34 Z" fill="#0C0D10" />
    <!-- Main organic brush body -->
    <path d="
      M 32,22
      C 80,16 160,18 270,17
      C 380,16 460,20 504,24
      C 524,26 536,32 540,42
      C 536,52 522,58 502,60
      C 450,65 370,64 270,66
      C 170,68 85,66 32,60
      C 16,58 6,52 2,42
      C 6,32 18,24 32,22
      Z"
      fill="#0C0D10"
      stroke="#14161B"
      stroke-width="1.5"
    />
    <!-- Bottom-right tapered bristles -->
    <path d="M 504,46 C 516,48 532,50 538,51 C 528,54 514,54 498,53 Z" fill="#0C0D10" />
    <path d="M 488,56 C 504,58 522,60 528,62 C 516,64 500,63 482,61 Z" fill="#0C0D10" />
  `;
  brushWrap.appendChild(brushSvg);

  // Content Row: ACCEPTED Typography + Stamped Vermillion Seal
  const contentRow = document.createElement('div');
  Object.assign(contentRow.style, {
    position: 'relative',
    zIndex: '2',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  });

  // Typography: ACCEPTED (Real HTML text, bold, sharp, paper white, forward slant)
  const textEl = document.createElement('span');
  textEl.className = 'seam-accepted-text';
  textEl.textContent = text;
  Object.assign(textEl.style, {
    fontSize: '34px',
    fontWeight: '900',
    letterSpacing: '0.24em',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif",
    transform: 'skewX(-6deg)',
    textShadow: '0 0 16px rgba(248, 250, 252, 0.4), 0 0 32px rgba(6, 182, 212, 0.3)',
    WebkitFontSmoothing: 'antialiased',
    textRendering: 'geometricPrecision',
  });
  contentRow.appendChild(textEl);

  // Stamped Vermillion Japanese-inspired Circular Seal with "AC"
  const seal = document.createElement('div');
  seal.className = 'seam-vermillion-seal';
  Object.assign(seal.style, {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    border: '2.5px solid #E11D48',
    background: 'radial-gradient(circle, rgba(225, 29, 72, 0.18) 0%, rgba(12, 13, 16, 0.95) 85%)',
    boxShadow: '0 0 18px rgba(225, 29, 72, 0.75), inset 0 0 10px rgba(225, 29, 72, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    animation: 'seamSealStamp 0.35s 0.92s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    transform: 'scale(0) rotate(-25deg)',
    opacity: '0',
  });

  seal.innerHTML = `
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
      <!-- Inner seal ring -->
      <circle cx="23" cy="23" r="18.5" stroke="#E11D48" stroke-width="1.2" stroke-dasharray="4 2" />
      <!-- Stylized crisp vector AC letters -->
      <text x="23" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="16" font-weight="900" fill="#E11D48" text-anchor="middle" letter-spacing="0.08em">AC</text>
    </svg>
  `;
  contentRow.appendChild(seal);

  brushWrap.appendChild(contentRow);

  // Frame 06: Delicate White-Cyan Light Sweep Glint across lettering
  const glint = document.createElement('div');
  Object.assign(glint.style, {
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(105deg, transparent 25%, rgba(248, 250, 252, 0.75) 50%, rgba(6, 182, 212, 0.6) 58%, transparent 75%)',
    transform: 'translateX(-160%) skewX(-24deg)',
    animation: 'seamLightSweep 0.55s 1.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    pointerEvents: 'none',
    zIndex: '3',
  });
  brushWrap.appendChild(glint);

  container.appendChild(brushWrap);
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
  baseAlpha: number;
}

/**
 * Spawns 18–20 elongated directional sparks traveling strictly along the 32° diagonal cut vector.
 */
function spawnSeamSparks(w: number, h: number): SeamSpark[] {
  const sparks: SeamSpark[] = [];
  const palette = ['#F8FAFC', '#8B5CF6', '#06B6D4', '#FFFFFF'];
  const count = 20;

  // Cut vector angle ~ 32 degrees (bottom-left to upper-right)
  const baseAngle = -Math.atan2(h, w);

  for (let i = 0; i < count; i++) {
    // Distributed along the diagonal trajectory
    const t = 0.2 + (i / count) * 0.6;
    const startX = w * t + (Math.random() - 0.5) * 40;
    const startY = h * (1 - t) + (Math.random() - 0.5) * 40;

    // Angle tightly aligned with the cut vector +/- 0.12 radians
    const angle = baseAngle + (Math.random() - 0.5) * 0.24;
    const speed = 7.0 + Math.random() * 6.5;

    sparks.push({
      x: startX,
      y: startY,
      prevX: startX,
      prevY: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1.8 + Math.random() * 1.6,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: 1,
      baseAlpha: 0.85 + Math.random() * 0.15,
    });
  }

  return sparks;
}

/**
 * Injects precision CSS keyframes matching the 8 storyboard frames.
 */
function ensureSeamStyles(): void {
  if (document.getElementById('themeflow-seam-keyframes')) return;

  const style = document.createElement('style');
  style.id = 'themeflow-seam-keyframes';
  style.textContent = `
    /* Frame 01: Tension Vignette & Hairline Tremor */
    @keyframes seamTensionAnim {
      0% { opacity: 0; }
      14% { opacity: 1; }
      78% { opacity: 1; }
      100% { opacity: 0; }
    }

    @keyframes seamTremorAnim {
      0% { transform: rotate(32deg) translate(0, 0); opacity: 0.2; }
      30% { transform: rotate(32deg) translate(0.8px, -0.6px); opacity: 0.9; }
      60% { transform: rotate(32deg) translate(-0.6px, 0.8px); opacity: 0.7; }
      100% { transform: rotate(32deg) translate(0, 0); opacity: 0; }
    }

    /* Frame 02: The Cut — Rapid diagonal blade stroke */
    @keyframes seamCutCore {
      0% { stroke-dashoffset: 2600; opacity: 0; }
      8% { opacity: 1; }
      22% { stroke-dashoffset: 0; opacity: 1; }
      75% { opacity: 1; }
      100% { opacity: 0; }
    }

    @keyframes seamCutViolet {
      0% { stroke-dashoffset: 2600; opacity: 0; }
      8% { opacity: 0.95; }
      24% { stroke-dashoffset: 0; opacity: 0.95; }
      75% { opacity: 0.85; }
      100% { opacity: 0; }
    }

    @keyframes seamCutAura {
      0% { stroke-dashoffset: 2600; opacity: 0; }
      8% { opacity: 0.8; }
      26% { stroke-dashoffset: 0; opacity: 0.8; }
      70% { opacity: 0.6; }
      100% { opacity: 0; }
    }

    /* Frame 03: Impact Frame — 80ms flash with 3px jolt */
    @keyframes seamImpactFlash {
      0% { opacity: 0; transform: translate(0, 0); }
      10% { opacity: 1; transform: translate(2px, -3px); }
      50% { opacity: 1; transform: translate(-1px, 2px); }
      90% { opacity: 0.8; transform: translate(0, 0); }
      100% { opacity: 0; transform: translate(0, 0); }
    }

    /* Frame 04: The Seam Opens — Separating incision lips */
    @keyframes seamLipLeft {
      0% { transform: translate(0, 0); opacity: 0; }
      20% { opacity: 0.9; }
      60% { transform: translate(-10px, -6px); opacity: 0.85; }
      100% { transform: translate(0, 0); opacity: 0; }
    }

    @keyframes seamLipRight {
      0% { transform: translate(0, 0); opacity: 0; }
      20% { opacity: 0.9; }
      60% { transform: translate(10px, 6px); opacity: 0.85; }
      100% { transform: translate(0, 0); opacity: 0; }
    }

    /* Flare Star Glint */
    @keyframes seamStarGlint {
      0% { transform: scale(0) rotate(0deg); opacity: 0; }
      30% { transform: scale(1.6) rotate(45deg); opacity: 1; }
      100% { transform: scale(0.2) rotate(90deg); opacity: 0; }
    }

    /* Frame 05 & 06 & 07: Banner Lifecycle & Split Resolution */
    @keyframes seamBannerSequence {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.75);
      }
      /* Frame 05: The Reveal (0.90–1.10s) */
      42% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.75);
      }
      48% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.05);
      }
      53% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.0);
      }
      /* Frame 06: Victory Hold (1.10–1.70s) */
      78% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.0);
      }
      /* Frame 07: Resolution (1.70–2.00s) — Cleaves along cut line */
      88% {
        opacity: 0.85;
        transform: translate(-46%, -53%) scale(0.98);
      }
      100% {
        opacity: 0;
        transform: translate(-42%, -56%) scale(0.92);
      }
    }

    /* Seal Stamp Animation */
    @keyframes seamSealStamp {
      0% {
        opacity: 0;
        transform: scale(1.8) rotate(-45deg);
      }
      60% {
        opacity: 1;
        transform: scale(0.92) rotate(4deg);
      }
      100% {
        opacity: 1;
        transform: scale(1.0) rotate(0deg);
      }
    }

    /* Light Sweep across brush lettering */
    @keyframes seamLightSweep {
      0% { transform: translateX(-160%) skewX(-24deg); }
      100% { transform: translateX(240%) skewX(-24deg); }
    }
  `;
  document.head.appendChild(style);
}
