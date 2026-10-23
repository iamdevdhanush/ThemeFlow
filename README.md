# ThemeFlow — Multi-Platform Theme Studio (LeetCode & Codeforces)

**ThemeFlow** is a production-quality Chrome and Brave extension (Manifest V3) that transforms the visual appearance of both **LeetCode** and **Codeforces** with atmospheric wallpapers, customizable frosted glassmorphism, high-contrast dark themes, ambient visual effects, and verdict celebrations.

---

## 🌐 Supported Platforms

| Platform | Host Match Patterns | Adapter | Scoped Stylesheet |
| :--- | :--- | :--- | :--- |
| **LeetCode** | `*://leetcode.com/*`<br>`*://*.leetcode.com/*` | [`LeetCodeAdapter`](file:///d:/ThemeFlow/src/platforms/leetcode/leetcodeAdapter.ts) | [`leetcode.css`](file:///d:/ThemeFlow/src/platforms/leetcode/leetcode.css) |
| **Codeforces** | `*://codeforces.com/*`<br>`*://*.codeforces.com/*` | [`CodeforcesAdapter`](file:///d:/ThemeFlow/src/platforms/codeforces/codeforcesAdapter.ts) | [`codeforces.css`](file:///d:/ThemeFlow/src/content/codeforces.css) |

---

## 🏗️ Multi-Platform Architecture

```text
ThemeFlow Extension
├── src/core/               # Shared Core Theme Engine
│   └── themeEngine.ts     # Injects background & overlay DOM, sets CSS variables, manages effects
├── src/platforms/          # Separate Platform Adapters & Scoped Styles
│   ├── leetcode/
│   │   ├── leetcodeAdapter.ts  # Watches [data-e2e-locator="submission-result"] verdicts & mounts pill
│   │   └── leetcode.css        # Scoped to body.themeflow-leetcode (overrides --layer-*, Monaco, etc.)
│   └── codeforces/
│       ├── codeforcesAdapter.ts # Watches .verdict-accepted table mutations & mounts pill
│       └── codeforces.css       # Scoped to body.themeflow-codeforces (.roundbox, MathJax, etc.)
├── src/effects/            # Shared Visual FX & Celebrations
│   ├── particles.ts       # Canvas Sakura, Rain, Stars (pauses when hidden, respects reduced-motion)
│   └── confetti.ts        # Dual-cannon confetti burst on Accepted verdicts
├── src/audio/              # Shared Verdict Audio Engine
│   └── soundPlayer.ts     # Synthesized Web Audio API chimes & bundled WAV fallback
├── src/storage/            # Shared Settings & Wallpaper Persistence
│   └── storage.ts         # chrome.storage.local sync + IndexedDB custom wallpaper engine
├── src/popup/              # Quick Theme Popup with Platform Indicator
│   └── Popup.tsx          # Detects active tab platform (LeetCode / Codeforces / Studio)
└── src/studio/             # Full Theme Studio Customizer
    └── Studio.tsx         # Dual-platform interactive preview switcher (LeetCode & Codeforces)
```

---

## 📸 Discovered Background Images & Theme Catalog

All 8 pre-bundled wallpapers from the [`IMAGES/`](file:///d:/ThemeFlow/IMAGES) folder are supported across both LeetCode and Codeforces:

| Filename | Format | Dimensions | File Size | Theme ID | Theme Name | Accent Color |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [`galaxy.jpg`](file:///d:/ThemeFlow/IMAGES/galaxy.jpg) | JPEG | 5903 &times; 3766 | 5.57 MB | `cosmic-void` | **Cosmic Void** | `#a78bfa` (Lavender) |
| [`japan_street.avif`](file:///d:/ThemeFlow/IMAGES/japan_street.avif) | AVIF/HEIF | 2040 &times; 1409 | 207.7 KB | `neo-tokyo` | **Neo Tokyo Dusk** | `#f472b6` (Sakura Pink) |
| [`boy_focus.jpg`](file:///d:/ThemeFlow/IMAGES/boy_focus.jpg) | JPEG | 1280 &times; 720 | 137.2 KB | `midnight-focus` | **Midnight Focus** | `#60a5fa` (Sky Blue) |
| [`girl_desktop.jpg`](file:///d:/ThemeFlow/IMAGES/girl_desktop.jpg) | JPEG | 1920 &times; 1080 | 151.9 KB | `cyber-workstation` | **Cyber Workstation** | `#c084fc` (Violet) |
| [`laptop_desk.jpg`](file:///d:/ThemeFlow/IMAGES/laptop_desk.jpg) | JPEG | 2048 &times; 1152 | 151.9 KB | `zen-workspace` | **Zen Workspace** | `#34d399` (Emerald) |
| [`sunset.avif`](file:///d:/ThemeFlow/IMAGES/sunset.avif) | AVIF/HEIF | 2400 &times; 1500 | 138.6 KB | `golden-dusk` | **Golden Dusk** | `#fbbf24` (Amber Gold) |
| [`sikera_sunset.jpg`](file:///d:/ThemeFlow/IMAGES/sikera_sunset.jpg) | JPEG | 1529 &times; 860 | 247.3 KB | `velvet-horizon` | **Velvet Horizon** | `#f87171` (Coral Rose) |
| [`halloween.jpg`](file:///d:/ThemeFlow/IMAGES/halloween.jpg) | JPEG | 1920 &times; 1281 | 116.3 KB | `mystic-hallow` | **Mystic Hallow** | `#fb923c` (Pumpkin Glow) |

---

## 🚀 Loading into Brave or Chrome

The production build is in the **[`d:\ThemeFlow\dist`](file:///d:/ThemeFlow/dist)** directory.

1. Open **Brave** or **Google Chrome**.
2. Navigate to:
   - **Brave**: `brave://extensions`
   - **Chrome**: `chrome://extensions`
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left toolbar.
5. Select the folder:
   ```text
   d:\ThemeFlow\dist
   ```
6. The extension is now active on both **LeetCode** and **Codeforces**.

---

## 🧪 Testing Guide

### 1. LeetCode Testing (`leetcode.com`)
1. Navigate to any problem on LeetCode, e.g.:
   ```text
   https://leetcode.com/problems/two-sum/
   ```
2. Click the **ThemeFlow** extension icon in your browser toolbar.
3. Verify the platform banner reads: **`LeetCode • Active`**.
4. Select any theme card (e.g. `Neo Tokyo Dusk`, `Midnight Focus`).
5. Notice the frosted surfaces, translucent Monaco editor, glowing problem header, and ambient wallpaper.
6. Submit a solution or click "Run Code": when an Accepted result is returned, the victory chime and celebration burst will fire (if enabled).

### 2. Codeforces Testing (`codeforces.com`)
1. Navigate to any problem on Codeforces, e.g.:
   ```text
   https://codeforces.com/problemset/problem/4/A
   ```
2. Click the **ThemeFlow** extension icon.
3. Verify the platform banner reads: **`Codeforces • Active`**.
4. Observe the applied theme, high-contrast MathJax formulas, and the floating ThemeFlow quick pill in the bottom-right corner.

### 3. Theme Studio Testing (`studio.html`)
1. Open the full studio via the popup button or right-clicking extension &rarr; Options.
2. In the top bar of the Studio preview, toggle between:
   - **`LeetCode Preview`**: Displays `1. Two Sum`, `Easy` badge, copyable Example 1, and Monaco-styled C++ solution editor.
   - **`Codeforces Preview`**: Displays `1985D - Manhattan Permutations`, MathJax summation equation, and C++ template.
3. Adjust sliders (Darkness, Blur, Brightness, Panel Opacity) and verify the preview updates in real time.
4. Click **`Simulate Accepted (AC)`** to test confetti and audio feedback.

---

## 🛠️ Build Commands

```bash
# Typecheck TypeScript (0 errors)
npm run typecheck

# Build complete production extension into dist/
npm run build
```