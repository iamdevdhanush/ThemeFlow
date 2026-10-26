/**
 * ThemeFlow — Signature Anime Impact "Domain Expansion" Celebration Engine
 * 
 * Creative Direction: "Domain Expansion"
 * High-octane manga impact frames, dramatic dimensional backdrop, massive multi-layer
 * diagonal energy slash, expanding shockwave rings, directional shard burst, and a bold,
 * authoritative victory reveal.
 * 
 * Core Architectural Principles:
 * 1. Test Result Region Anchored: Targets and bounds the celebration strictly to the
 *    enclosing Test Result panel (or deliberate fallback). Does not cover code editor or navigation.
 * 2. Localized Dimensional Dimming: Briefly dims ONLY the immediate celebration region
 *    with a dark obsidian-emerald aura, providing immense contrast for the neon effects.
 * 3. High-Visibility Multi-Layer Slash: 3-layer diagonal energy blade (18px neon flare + 7px core
 *    + incandescent white blade + traveling comet head) spanning the entire region.
 * 4. Observable Expanding Shockwaves: Primary emerald shockwave + compression echo ripple
 *    expanding smoothly outward from the impact focal point.
 * 5. Directional Shard Kinetics: Sharp diamond shards launched along shockwave vectors with
 *    aerodynamic drag and motion vectors.
 * 6. Hero Victory Reveal: Clean, commanding typography (32px bold ACCEPTED) + glowing vector
 *    checkmark seal with diagonal glint sweep. Zero miniature HUD clutter or tiny labels.
 * 7. Clean Lifecycle & Restoration: 1.8–2.0s duration with complete teardown, 0 layout shifts.
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
 * Calculates the bounding rectangle of the Test Result region or stable fallback.
 */
function resolveCelebrationRegion(anchorElement: HTMLElement | null, winW: number, winH: number): {
  rect: { left: number; top: number; width: number; height: number };
  focusX: number;
  focusY: number;
} {
  let targetPanel: HTMLElement | null = null;
  let anchorRect: DOMRect | null = null;

  if (anchorElement && typeof anchorElement.getBoundingClientRect === 'function') {
    anchorRect = anchorElement.getBoundingClientRect();
    if (typeof anchorElement.closest === 'function') {
      targetPanel = anchorElement.closest(
        '.flexlayout__tab, [data-layout-path*="console"], [data-layout-path*="result"], [class*="tab-pane"], [class*="result-pane"], [class*="submission-result"], [data-layout-path]'
      ) || anchorElement.closest('div[class*="container"], [class*="panel"], [class*="content"]') || anchorElement.parentElement;
    }
  }

  let regionLeft = 0;
  let regionTop = 0;
  let regionW = 0;
  let regionH = 0;

  // Case 1: Enclosing Test Result panel found with reasonable size
  if (targetPanel && typeof targetPanel.getBoundingClientRect === 'function') {
    const pRect = targetPanel.getBoundingClientRect();
    if (pRect.width >= 280 && pRect.height >= 140 && pRect.left < winW && pRect.top < winH) {
      regionW = Math.round(Math.min(pRect.width, winW - 32));
      regionH = Math.round(Math.min(pRect.height, winH - 32));
      regionLeft = Math.round(pRect.left);
      regionTop = Math.round(pRect.top);
    }
  }

  // Case 2: Anchor element available (e.g. the verdict span itself)
  if (regionW === 0 && anchorRect && anchorRect.width > 0 && anchorRect.height > 0) {
    regionW = Math.round(Math.min(Math.max(anchorRect.width * 2.4, 560), winW - 32));
    regionH = Math.round(Math.min(Math.max(anchorRect.height * 4.0, 300), winH - 32));
    regionLeft = Math.round(anchorRect.left + anchorRect.width / 2 - regionW / 2);
    regionTop = Math.round(anchorRect.top + anchorRect.height / 2 - regionH / 2);
  }

  // Case 3: Stable deliberate fallback
  if (regionW === 0) {
    regionW = Math.round(Math.min(620, winW - 32));
    regionH = Math.round(Math.min(320, winH - 40));
    regionLeft = Math.round((winW - regionW) / 2);
    regionTop = Math.round(Math.min(winH * 0.35, 260));
  }

  // Viewport bounds clamp to prevent bleeding off-screen
  regionLeft = Math.max(12, Math.min(winW - regionW - 12, regionLeft));
  regionTop = Math.max(12, Math.min(winH - regionH - 12, regionTop));

  // Determine local focal point (cx, cy) inside the region
  let focusX = regionW / 2;
  let focusY = regionH / 2;

  if (anchorRect && anchorRect.width > 0) {
    const rawFocusX = (anchorRect.left + anchorRect.width / 2) - regionLeft;
    const rawFocusY = (anchorRect.top + anchorRect.height / 2) - regionTop;

    // Keep focus within comfortable bounds of the region
    focusX = Math.max(regionW * 0.22, Math.min(regionW * 0.78, rawFocusX));
    focusY = Math.max(regionH * 0.25, Math.min(regionH * 0.75, rawFocusY));
  }

  return {
    rect: { left: regionLeft, top: regionTop, width: regionW, height: regionH },
    focusX: Math.round(focusX),
    focusY: Math.round(focusY),
  };
}

/**
 * Triggers the signature ThemeFlow "Domain Expansion" anime impact celebration sequence.
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

  // Resolve target Test Result region and focal coordinates
  const { rect, focusX, focusY } = resolveCelebrationRegion(anchorElement, winW, winH);

  // Create isolated, strictly bounded container anchored to Test Result region
  const container = document.createElement('div');
  container.id = 'themeflow-anime-celebration';
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: 'none',
    zIndex: '9999999',
    overflow: 'hidden',
    borderRadius: '8px',
  });

  // Inject scoped keyframes if not present
  ensureDomainExpansionStyles();

  // 1. Domain Dimensional Dimming Backdrop (dims ONLY this immediate celebration region)
  const backdrop = createDomainBackdrop(themeAccent);
  container.appendChild(backdrop);

  // 2. High-Visibility Multi-Layer Energy Slash & Directional Speed Lines SVG
  const slashSvg = createDomainSlashSvg(rect.width, rect.height, focusX, focusY, themeAccent);
  container.appendChild(slashSvg);

  // 3. Directional Angular Shard Physics Canvas
  const canvas = document.createElement('canvas');
  canvas.width = rect.width;
  canvas.height = rect.height;
  Object.assign(canvas.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  });
  container.appendChild(canvas);

  // 4. Hero Victory Reveal (Clean, Bold, Commanding Typography + Vector Seal)
  const victoryReveal = createDomainVictoryReveal(focusX, focusY, verdictText, themeAccent);
  container.appendChild(victoryReveal);

  document.body.appendChild(container);

  // Directional Shards Simulation
  let animId: number | null = null;
  let isCleanedUp = false;
  const ctx = canvas.getContext('2d');
  const particles = spawnDirectionalShards(focusX, focusY, themeAccent);
  const startTime = performance.now();

  function render(now: number) {
    if (isCleanedUp) return;
    const elapsed = now - startTime;
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (elapsed > 180 && elapsed < 1600) {
      const progress = Math.min(1, (elapsed - 180) / 1420);

      for (const p of particles) {
        // Record trail history for speed lines
        p.prevX = p.x;
        p.prevY = p.y;

        p.x += p.vx;
        p.y += p.vy;

        // Kinetic aerodynamic drag: rapid initial burst then deceleration in place
        p.vx *= 0.908;
        p.vy *= 0.908;
        p.rotation += p.rotSpeed;
        p.alpha = Math.max(0, 1 - Math.pow(progress, 1.25));

        if (p.alpha <= 0.01) continue;

        ctx.save();
        ctx.globalAlpha = p.alpha * p.baseAlpha;

        if (p.shape === 'shard') {
          // Sharp polygonal diamond shard
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.7, 0);
          ctx.lineTo(0, -p.size * 2.4);
          ctx.lineTo(p.size * 0.7, 0);
          ctx.lineTo(0, p.size * 2.4);
          ctx.closePath();
          ctx.fill();
        } else {
          // Dynamic kinetic energy spark with streak trail
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.prevX, p.prevY);
          ctx.lineTo(p.x, p.y);
          if (typeof ctx.stroke === 'function') {
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    }

    if (elapsed < 1980) {
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

  // Auto-cleanup by 1980ms (completes in ~2.0s without residual shifts)
  setTimeout(teardown, 1980);
}

/**
 * Creates the localized dimensional backdrop dimming ONLY the celebration region.
 */
function createDomainBackdrop(accentColor: string): HTMLElement {
  const backdrop = document.createElement('div');
  backdrop.className = 'tf-domain-dim';
  Object.assign(backdrop.style, {
    position: 'absolute',
    inset: '0',
    background: 'radial-gradient(ellipse at center, rgba(3, 20, 10, 0.85) 0%, rgba(1, 10, 5, 0.92) 65%, rgba(0, 0, 0, 0.97) 100%)',
    border: `1.5px solid ${accentColor}`,
    boxShadow: `inset 0 0 60px rgba(16, 185, 129, 0.32), 0 12px 36px rgba(0, 0, 0, 0.9)`,
    borderRadius: '8px',
    animation: 'tfDomainDim 1.95s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    pointerEvents: 'none',
  });
  return backdrop;
}

/**
 * Creates the high-visibility multi-layer energy slash, speed lines, and expanding shockwaves.
 */
function createDomainSlashSvg(w: number, h: number, cx: number, cy: number, accentColor: string): SVGSVGElement {
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

  // Diagonal slash coordinates spanning across the region from top-right to bottom-left
  const slashX1 = Math.round(cx + w * 0.58);
  const slashY1 = Math.round(cy - h * 0.52);
  const slashX2 = Math.round(cx - w * 0.58);
  const slashY2 = Math.round(cy + h * 0.52);
  const slashLength = Math.round(Math.hypot(slashX2 - slashX1, slashY2 - slashY1));

  // Max shockwave radius to comfortably cover the region
  const maxShockRadius = Math.round(Math.max(w, h) * 0.58);

  // 1. Observable Primary Expanding Emerald Shockwave Ring
  const shockwave1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  shockwave1.setAttribute('cx', String(cx));
  shockwave1.setAttribute('cy', String(cy));
  shockwave1.setAttribute('r', String(maxShockRadius));
  shockwave1.setAttribute('fill', 'none');
  shockwave1.setAttribute('stroke', '#86efac');
  shockwave1.setAttribute('stroke-width', '5.5');
  shockwave1.style.transformOrigin = `${cx}px ${cy}px`;
  shockwave1.style.animation = 'tfDomainShockPrimary 0.85s 0.10s cubic-bezier(0.12, 0.9, 0.2, 1) forwards';
  svg.appendChild(shockwave1);

  // 2. Observable Compression Echo Shockwave Ring (secondary ripple)
  const shockwave2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  shockwave2.setAttribute('cx', String(cx));
  shockwave2.setAttribute('cy', String(cy));
  shockwave2.setAttribute('r', String(Math.round(maxShockRadius * 0.78)));
  shockwave2.setAttribute('fill', 'none');
  shockwave2.setAttribute('stroke', '#38bdf8');
  shockwave2.setAttribute('stroke-width', '3.0');
  shockwave2.style.transformOrigin = `${cx}px ${cy}px`;
  shockwave2.style.animation = 'tfDomainShockSecondary 0.75s 0.18s cubic-bezier(0.14, 0.86, 0.25, 1) forwards';
  svg.appendChild(shockwave2);

  // 3. Directional Manga Speed Lines (parallel to slash vector across celebration region)
  const angle = Math.atan2(slashY2 - slashY1, slashX2 - slashX1);
  const normalAngle = angle + Math.PI / 2;
  const speedOffsets = [-90, -50, -20, 20, 50, 90];

  for (let i = 0; i < speedOffsets.length; i++) {
    const offset = speedOffsets[i];
    const lineLen = 140 + (i % 3) * 60;
    const startShift = -lineLen / 2 + (i % 2 === 0 ? 30 : -30);

    const ox = cx + Math.cos(normalAngle) * offset;
    const oy = cy + Math.sin(normalAngle) * offset;

    const lx1 = ox + Math.cos(angle) * startShift;
    const ly1 = oy + Math.sin(angle) * startShift;
    const lx2 = ox + Math.cos(angle) * (startShift + lineLen);
    const ly2 = oy + Math.sin(angle) * (startShift + lineLen);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', lx1.toFixed(1));
    line.setAttribute('y1', ly1.toFixed(1));
    line.setAttribute('x2', lx2.toFixed(1));
    line.setAttribute('y2', ly2.toFixed(1));
    line.setAttribute('stroke', i % 2 === 0 ? '#4ade80' : '#ffffff');
    line.setAttribute('stroke-width', (2.2 + (i % 2) * 1.2).toFixed(1));
    line.setAttribute('stroke-linecap', 'round');
    line.style.animation = `tfMangaSpeedLine 0.32s ${(i * 0.02).toFixed(2)}s cubic-bezier(0.1, 0.9, 0.2, 1) forwards`;
    svg.appendChild(line);
  }

  // 4. Multi-Layer Energy Slash
  // Layer 4a: Outer Neon Emerald Flare (Broad luminous glow)
  const slashHalo = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  slashHalo.setAttribute('x1', String(slashX1));
  slashHalo.setAttribute('y1', String(slashY1));
  slashHalo.setAttribute('x2', String(slashX2));
  slashHalo.setAttribute('y2', String(slashY2));
  slashHalo.setAttribute('stroke', '#10b981');
  slashHalo.setAttribute('stroke-width', '24');
  slashHalo.setAttribute('stroke-linecap', 'round');
  slashHalo.style.strokeDasharray = `${slashLength} ${slashLength}`;
  slashHalo.style.strokeDashoffset = String(slashLength);
  slashHalo.style.animation = 'tfSlashGlow 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(slashHalo);

  // Layer 4b: Inner Vibrant Energy Beam
  const slashCore = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  slashCore.setAttribute('x1', String(slashX1));
  slashCore.setAttribute('y1', String(slashY1));
  slashCore.setAttribute('x2', String(slashX2));
  slashCore.setAttribute('y2', String(slashY2));
  slashCore.setAttribute('stroke', '#4ade80');
  slashCore.setAttribute('stroke-width', '8');
  slashCore.setAttribute('stroke-linecap', 'round');
  slashCore.style.strokeDasharray = `${slashLength} ${slashLength}`;
  slashCore.style.strokeDashoffset = String(slashLength);
  slashCore.style.animation = 'tfSlashCore 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(slashCore);

  // Layer 4c: Incandescent White Center Blade
  const slashBlade = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  slashBlade.setAttribute('x1', String(slashX1));
  slashBlade.setAttribute('y1', String(slashY1));
  slashBlade.setAttribute('x2', String(slashX2));
  slashBlade.setAttribute('y2', String(slashY2));
  slashBlade.setAttribute('stroke', '#ffffff');
  slashBlade.setAttribute('stroke-width', '3.2');
  slashBlade.setAttribute('stroke-linecap', 'round');
  slashBlade.style.strokeDasharray = `${slashLength} ${slashLength}`;
  slashBlade.style.strokeDashoffset = String(slashLength);
  slashBlade.style.animation = 'tfSlashBlade 0.48s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(slashBlade);

  // 5. Focal Impact Starburst / Diamond Flash
  const starburst = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const sSize = 36;
  const dPath = `
    M ${cx} ${cy - sSize}
    Q ${cx} ${cy} ${cx + sSize} ${cy}
    Q ${cx} ${cy} ${cx} ${cy + sSize}
    Q ${cx} ${cy} ${cx - sSize} ${cy}
    Q ${cx} ${cy} ${cx} ${cy - sSize}
    Z
  `;
  starburst.setAttribute('d', dPath);
  starburst.setAttribute('fill', '#ffffff');
  starburst.style.transformOrigin = `${cx}px ${cy}px`;
  starburst.style.animation = 'tfImpactStarburst 0.35s 0.08s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  svg.appendChild(starburst);

  return svg;
}

/**
 * Creates the clean, commanding victory reveal (100% sharp typography, vector seal, no tiny HUD clutter).
 */
function createDomainVictoryReveal(cx: number, cy: number, text: string, accentColor: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'tf-domain-victory';
  Object.assign(wrap.style, {
    position: 'absolute',
    left: `${cx}px`,
    top: `${cy}px`,
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    animation: 'tfVictoryRevealSequence 1.95s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    userSelect: 'none',
    pointerEvents: 'none',
  });

  // Vector Emerald Victory Seal with Cardinal Notches & Bold Checkmark
  const seal = document.createElement('div');
  seal.className = 'tf-victory-seal';
  Object.assign(seal.style, {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(4, 15, 8, 0.95) 75%)',
    border: `2px solid #22c55e`,
    boxShadow: '0 0 24px rgba(34, 197, 94, 0.75), 0 0 45px rgba(16, 185, 129, 0.35)',
    position: 'relative',
  });

  seal.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="display:block;">
      <!-- Cardinal anime tick notches -->
      <line x1="24" y1="2" x2="24" y2="7" stroke="#86efac" stroke-width="2.2" stroke-linecap="round" />
      <line x1="24" y1="41" x2="24" y2="46" stroke="#86efac" stroke-width="2.2" stroke-linecap="round" />
      <line x1="2" y1="24" x2="7" y2="24" stroke="#86efac" stroke-width="2.2" stroke-linecap="round" />
      <line x1="41" y1="24" x2="46" y2="24" stroke="#86efac" stroke-width="2.2" stroke-linecap="round" />
      <!-- Bold Vector Checkmark -->
      <polyline points="14,24 22,32 35,17" stroke="#ffffff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
  wrap.appendChild(seal);

  // Typography Container
  const titleBox = document.createElement('div');
  Object.assign(titleBox.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '2px 14px',
  });

  // Hero ACCEPTED Title
  const title = document.createElement('div');
  title.className = 'tf-victory-title';
  title.textContent = text;
  Object.assign(title.style, {
    fontSize: '28px',
    fontWeight: '900',
    letterSpacing: '0.22em',
    color: '#ffffff',
    textTransform: 'uppercase',
    textShadow: '0 0 22px rgba(74, 222, 128, 0.95), 0 0 48px rgba(16, 185, 129, 0.65)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif",
    lineHeight: '1.1',
    WebkitFontSmoothing: 'antialiased',
    textRendering: 'geometricPrecision',
  });
  titleBox.appendChild(title);

  // Clean Subtitle
  const sub = document.createElement('div');
  sub.className = 'tf-victory-sub';
  sub.textContent = 'SUBMISSION VERIFIED';
  Object.assign(sub.style, {
    fontSize: '10.5px',
    fontWeight: '800',
    letterSpacing: '0.36em',
    color: '#86efac',
    textTransform: 'uppercase',
    marginTop: '4px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif",
  });
  titleBox.appendChild(sub);

  // Diagonal Light Sweep Glint
  const glint = document.createElement('div');
  Object.assign(glint.style, {
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.85) 50%, rgba(74, 222, 128, 0.75) 60%, transparent 80%)',
    transform: 'translateX(-150%) skewX(-24deg)',
    animation: 'tfTitleGlintSweep 0.68s 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    pointerEvents: 'none',
  });
  titleBox.appendChild(glint);

  wrap.appendChild(titleBox);

  return wrap;
}

interface DirectionalShard {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
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

function spawnDirectionalShards(cx: number, cy: number, accentColor: string): DirectionalShard[] {
  const particles: DirectionalShard[] = [];
  const palette = ['#ffffff', '#86efac', '#4ade80', '#22c55e', '#38bdf8', accentColor];
  const count = 18; // Deliberate, impactful burst

  for (let i = 0; i < count; i++) {
    // Angular distribution aligned with shockwave expansion
    const angle = (i * (Math.PI * 2 / count)) + (Math.random() - 0.5) * 0.35;
    const speed = 4.2 + Math.random() * 4.6;

    const spawnX = cx + Math.cos(angle) * (6 + Math.random() * 12);
    const spawnY = cy + Math.sin(angle) * (6 + Math.random() * 12);

    particles.push({
      x: spawnX,
      y: spawnY,
      prevX: spawnX,
      prevY: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.2 + Math.random() * 2.8,
      color: palette[Math.floor(Math.random() * palette.length)],
      shape: Math.random() > 0.45 ? 'shard' : 'spark',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.12,
      alpha: 1,
      baseAlpha: 0.85 + Math.random() * 0.15,
    });
  }

  return particles;
}

function ensureDomainExpansionStyles(): void {
  if (document.getElementById('themeflow-domain-keyframes')) return;

  const style = document.createElement('style');
  style.id = 'themeflow-domain-keyframes';
  style.textContent = `
    /* Localized Domain Dimming Sequence */
    @keyframes tfDomainDim {
      0% {
        opacity: 0;
        transform: scale(0.97);
      }
      8% {
        opacity: 1;
        transform: scale(1.0);
      }
      80% {
        opacity: 1;
        transform: scale(1.0);
      }
      100% {
        opacity: 0;
        transform: scale(0.98);
      }
    }

    /* Primary Observable Expanding Shockwave Ring */
    @keyframes tfDomainShockPrimary {
      0% {
        transform: scale(0.04);
        opacity: 1;
        stroke-width: 7px;
      }
      50% {
        opacity: 0.85;
      }
      100% {
        transform: scale(1.0);
        opacity: 0;
        stroke-width: 0.8px;
      }
    }

    /* Secondary Compression Shockwave Ripple */
    @keyframes tfDomainShockSecondary {
      0% {
        transform: scale(0.05);
        opacity: 0.9;
        stroke-width: 4.5px;
      }
      100% {
        transform: scale(1.0);
        opacity: 0;
        stroke-width: 0.5px;
      }
    }

    /* Directional Manga Speed Lines */
    @keyframes tfMangaSpeedLine {
      0% {
        stroke-dasharray: 0 200;
        opacity: 0;
      }
      35% {
        opacity: 1;
      }
      100% {
        stroke-dasharray: 200 0;
        opacity: 0;
      }
    }

    /* High-Visibility Multi-Layer Energy Slash */
    @keyframes tfSlashGlow {
      0% {
        stroke-dashoffset: 800;
        opacity: 0;
      }
      20% {
        opacity: 0.95;
      }
      50% {
        stroke-dashoffset: 0;
        opacity: 0.85;
      }
      100% {
        stroke-dashoffset: 0;
        opacity: 0;
      }
    }

    @keyframes tfSlashCore {
      0% {
        stroke-dashoffset: 800;
        opacity: 0;
      }
      22% {
        opacity: 1;
      }
      45% {
        stroke-dashoffset: 0;
        opacity: 0.95;
      }
      100% {
        stroke-dashoffset: 0;
        opacity: 0;
      }
    }

    @keyframes tfSlashBlade {
      0% {
        stroke-dashoffset: 800;
        opacity: 0;
      }
      24% {
        opacity: 1;
      }
      40% {
        stroke-dashoffset: 0;
        opacity: 1;
      }
      100% {
        stroke-dashoffset: 0;
        opacity: 0;
      }
    }

    /* Impact Focal Starburst */
    @keyframes tfImpactStarburst {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      30% {
        transform: scale(1.7);
        opacity: 1;
      }
      100% {
        transform: scale(0.2);
        opacity: 0;
      }
    }

    /* Victory Reveal Sequence (Zero Blur, Bold Authority) */
    @keyframes tfVictoryRevealSequence {
      0% {
        transform: translate(-50%, -50%) scale(0.72);
        opacity: 0;
      }
      14% {
        transform: translate(-50%, -50%) scale(1.06);
        opacity: 1;
      }
      22% {
        transform: translate(-50%, -50%) scale(1.0);
        opacity: 1;
      }
      80% {
        transform: translate(-50%, -50%) scale(1.0);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(0.96);
        opacity: 0;
      }
    }

    /* Diagonal Light Glint Sweep Across Victory Typography */
    @keyframes tfTitleGlintSweep {
      0% {
        transform: translateX(-150%) skewX(-24deg);
      }
      100% {
        transform: translateX(250%) skewX(-24deg);
      }
    }
  `;
  document.head.appendChild(style);
}
