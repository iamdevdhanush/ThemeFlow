# ThemeFlow — Premium Codeforces Theme Studio

**ThemeFlow** is a production-quality Chrome and Brave extension (Manifest V3) that elevates the visual experience of Codeforces with atmospheric wallpapers, customizable glassmorphism, high-contrast dark themes, ambient visual effects, and verdict celebrations.

Designed to make competitive programming personal, atmospheric, and distraction-free while strictly preserving the legibility of mathematical notation, problem statements, code blocks, contest navigation, and submission forms.

---

## 📸 Discovered Background Images & Theme Catalog

Every original image in the `IMAGES/` directory was inspected, preserved, and mapped to an atmospheric theme:

| Filename | Format | Dimensions | File Size | Theme Name | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `galaxy.jpg` | JPEG | 5903 &times; 3766 | 5.57 MB | **Cosmic Void** | Infinite deep space nebula with stellar purple and indigo hues. |
| `japan_street.avif` | AVIF | 2040 &times; 1409 | 207.7 KB | **Neo Tokyo Dusk** | Atmospheric rainy alleyway glowing with tranquil evening lanterns. |
| `boy_focus.jpg` | JPEG | 1280 &times; 720 | 137.2 KB | **Midnight Focus** | Moody late-night coding session under soft cinematic lamplight. |
| `girl_desktop.jpg` | JPEG | 1920 &times; 1080 | 151.9 KB | **Cyber Workstation** | Modern multi-monitor developer setup with calm ambient glow. |
| `laptop_desk.jpg` | JPEG | 2048 &times; 1152 | 151.9 KB | **Zen Workspace** | Clean minimalist desk with warm afternoon sunlight and foliage. |
| `sunset.avif` | AVIF | 2400 &times; 1500 | 138.6 KB | **Golden Dusk** | Breathtaking sunset casting warm amber gradients across the horizon. |
| `sikera_sunset.jpg` | JPEG | 1529 &times; 860 | 247.3 KB | **Velvet Horizon** | Dreamy twilight skyline with gentle pastel clouds and quiet evening. |
| `halloween.jpg` | JPEG | 1920 &times; 1281 | 116.3 KB | **Mystic Hallow** | Enchanting nocturnal forest illuminated by warm lantern glow. |

> **Asset Integrity:** Original high-resolution image files in `IMAGES/` remain untouched. Optimized 480px WebP thumbnails are automatically generated in `dist/thumbnails/` for fast popup and studio rendering.

---

## 🚀 Loading into Brave or Chrome

The production build has already been generated in the **`dist/`** directory.

### Quick Load:
1. Open **Brave** or **Google Chrome**.
2. Navigate to:
   - In Brave: `brave://extensions`
   - In Chrome: `chrome://extensions`
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left toolbar.
5. Select the `dist/` directory from this repository:
   ```text
   d:\ThemeFlow\dist
   ```
6. **ThemeFlow** is now installed and active! Pin the extension icon to your browser toolbar for quick access.

---

## 🎨 Features & Architecture

### 1. Quick Theme Popup (`popup.html`)
- Compact 340px-wide charcoal interface following modern design standards.
- Master toggle switch to immediately activate or bypass theming.
- Card gallery with image previews, theme titles, and short descriptions.
- Selected state indicator with lavender border, glow, and checkmark badge.
- One-click launcher to open the full **Theme Studio**.

### 2. Full Theme Studio (`studio.html`)
- Dedicated extension page with near-black backdrop and purple accents.
- **Header**: Live extension status badge, "Reset to Defaults", and direct "Open Codeforces" launcher.
- **Theme Gallery**: Full grid of all 8 discovered wallpapers + custom upload trigger.
- **Custom Wallpaper Upload**: Supports user-uploaded PNG, JPEG, WebP, and AVIF up to 10MB. Stored safely in browser IndexedDB to prevent `chrome.storage.local` quota overflow.
- **Surface Modes**: Deep Dark, OLED Midnight Black, Frosted Glass, and Classic Tint.
- **Live Atmosphere Controls**: Real-time sliders for overlay darkness (0–95%), background blur (0–20px), wallpaper brightness (40–130%), and panel opacity (30–98%).
- **Accent Color Presets**: Quick palette (Lavender, Cyan, Emerald, Sakura Pink, Amber, Coral, Violet) plus a custom hex color picker.
- **Code Typography**: Switch editor and problem monospace fonts between JetBrains Mono, Fira Code, Consolas, and system monospace.
- **Visual Ambient Effects**:
  - Gentle falling Sakura petals.
  - Subtle rainy weather streaks.
  - Twinkling night stars.
  - Pauses automatically when tab is hidden (`document.hidden`) and respects `prefers-reduced-motion`.
- **Verdict Audio & Celebrations**:
  - Muted by default per specification.
  - Master volume slider and instant sound testing.
  - Dual celebration burst (confetti) and victory chime for Accepted (AC) submissions.
  - Soft reminder tone for Rejected / Wrong Answer (WA) submissions.
  - Built-in Web Audio API synthesis ensuring zero audio lag and 100% offline functionality.
- **Interactive Codeforces Preview**:
  - Realistic Codeforces contest problem header ("1985D - Manhattan Permutations").
  - Problem statement with stylized math notation and copyable sample input/output.
  - Syntax-highlighted C++ competitive programming code editor with line numbers.
  - Interactive "Simulate Accepted (AC)" and "Simulate WA" buttons to test animations and audio directly in the Studio.

### 3. Codeforces Content Script & Scoped Styling
- Matches `*://codeforces.com/*` and `*://*.codeforces.com/*`.
- Inserts a non-intrusive `#themeflow-bg-layer` and `#themeflow-overlay-layer` behind content with zero scroll-lag.
- Deeply themes Codeforces components (`#pageContent`, `.roundbox`, `.side-box`, `.menu-list-container`, `.rtable`, `.datatable`, `.sample-test`, `.ace_editor`).
- **MathJax & Formula Protection**: Keeps MathJax SVGs and tex spans bright, crisp, and high-contrast.
- **Verdict Observer**: MutationObserver monitors submission status tables (`.verdict-accepted`, `span[submissionverdict='OK']`) and automatically triggers celebrations upon receiving an Accepted verdict.
- **Floating Quick Switcher**: Discreet pill widget in the bottom-right corner of Codeforces pages for one-click access to the Theme Studio.

---

## 🛠️ Development & Build Commands

```bash
# Install dependencies
npm install

# Run TypeScript typecheck (0 errors)
npm run typecheck

# Start local dev server (for live UI development)
npm run dev

# Inspect original images and generate optimized thumbnails
npm run inspect

# Build complete production extension into dist/
npm run build
```

---

## 🧪 Testing Checklist

- [x] All 8 discovered wallpapers in `IMAGES/` decoded and mapped to themes.
- [x] Thumbnails generated in WebP format without modifying original images.
- [x] Production build generated in `dist/` with valid `manifest.json`.
- [x] Tested in browser subagent: Theme selection persists and updates preview in real-time.
- [x] Verified popup UI matches compact charcoal card specification.
- [x] Verified Theme Studio problem workbench, code editor, sliders, and controls.
- [x] Verified confetti burst and audio triggers on AC simulation.
- [x] Sound defaults to muted and requires explicit user enablement.
- [x] IndexedDB custom wallpaper upload validated with size and format bounds.
- [x] Content script and scoped CSS tested for MathJax contrast and Codeforces layout integrity.