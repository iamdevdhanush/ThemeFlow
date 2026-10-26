import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicIconsDir = path.resolve('public/icons');
if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#181824"/>
      <stop offset="100%" stop-color="#0c0c14"/>
    </linearGradient>
    <linearGradient id="flowGrad1" x1="60" y1="120" x2="450" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="50%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </linearGradient>
    <linearGradient id="flowGrad2" x1="100" y1="380" x2="420" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="70%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)"/>
  <rect width="510" height="510" x="1" y="1" rx="127" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>

  <!-- Glowing Flow Waves -->
  <g filter="url(#glow)">
    <!-- Wave 1 -->
    <path d="M96 350 C160 390 220 280 290 240 C360 200 400 240 430 200 C450 173 420 140 370 140 C300 140 240 220 180 260 C120 300 80 290 96 350 Z" 
          fill="url(#flowGrad1)" fill-opacity="0.85"/>
    <!-- Wave 2 (Flowing T-F motif) -->
    <path d="M120 180 C180 140 250 170 320 150 C380 130 420 160 410 200 C400 240 330 230 270 270 C200 320 150 380 110 350 C80 320 100 230 120 180 Z" 
          fill="url(#flowGrad2)" fill-opacity="0.9" style="mix-blend-mode: screen;"/>
  </g>

  <!-- Central Sparkle Accent -->
  <circle cx="340" cy="180" r="10" fill="#ffffff" filter="drop-shadow(0 0 8px #ffffff)"/>
  <circle cx="160" cy="320" r="6" fill="#c084fc" filter="drop-shadow(0 0 6px #c084fc)"/>
</svg>
`;

async function generateIcons() {
  const sizes = [16, 32, 48, 128, 512];
  const force = process.argv.includes('--force');
  const allExist = sizes.every(s => {
    const p = path.join(publicIconsDir, `icon${s}.png`);
    return fs.existsSync(p) && fs.statSync(p).size > 0;
  }) && fs.existsSync(path.join(publicIconsDir, 'icon.svg'));

  if (!force && allExist) {
    console.log('[OK] All required icons (16, 32, 48, 128, 512) already exist. Skipping generation (use --force to regenerate).');
    return;
  }

  for (const size of sizes) {
    const outPath = path.join(publicIconsDir, `icon${size}.png`);
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated icon ${size}x${size} -> ${outPath}`);
  }

  // Also write SVG source
  fs.writeFileSync(path.join(publicIconsDir, 'icon.svg'), svgIcon.trim(), 'utf-8');
}

generateIcons().catch(console.error);
