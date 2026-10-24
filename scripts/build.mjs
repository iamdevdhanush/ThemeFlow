import { build } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

async function buildExtension() {
  console.log('--- Step 1: Building Popup and Studio pages ---');
  await build({
    configFile: false,
    plugins: [react()],
    base: '',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: path.resolve('popup.html'),
          studio: path.resolve('studio.html'),
        },
      },
    },
  });

  console.log('--- Step 2: Building Content Script (IIFE) ---');
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/content/index.ts'),
        name: 'ThemeFlowContent',
        formats: ['iife'],
        fileName: () => 'content.js',
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
    },
  });

  console.log('--- Step 3: Building Background Service Worker (ES) ---');
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/background/index.ts'),
        name: 'ThemeFlowBackground',
        formats: ['es'],
        fileName: () => 'background.js',
      },
    },
  });

  console.log('--- Step 4: Copying Static Assets to dist/ ---');
  // Copy manifest.json
  fs.copyFileSync('manifest.json', 'dist/manifest.json');
  console.log('Copied manifest.json');

  // Copy codeforces.css and leetcode.css
  fs.copyFileSync('src/content/codeforces.css', 'dist/codeforces.css');
  fs.copyFileSync('src/platforms/leetcode/leetcode.css', 'dist/leetcode.css');
  console.log('Copied codeforces.css and leetcode.css');

  // Copy IMAGES folder to dist/IMAGES and dist/images
  const distImagesDir = path.resolve('dist/IMAGES');
  const distImagesDirLower = path.resolve('dist/images');
  if (!fs.existsSync(distImagesDir)) {
    fs.mkdirSync(distImagesDir, { recursive: true });
  }
  if (!fs.existsSync(distImagesDirLower)) {
    fs.mkdirSync(distImagesDirLower, { recursive: true });
  }
  const imageFiles = fs.readdirSync('IMAGES');
  for (const file of imageFiles) {
    const src = path.join('IMAGES', file);
    fs.copyFileSync(src, path.join(distImagesDir, file));
    fs.copyFileSync(src, path.join(distImagesDirLower, file));
  }
  console.log(`Copied ${imageFiles.length} original images to dist/IMAGES and dist/images`);

  // Ensure public assets (thumbnails, icons, sounds) are copied to dist/
  const publicDir = path.resolve('public');
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, path.resolve('dist'), { recursive: true });
    console.log('Copied public/ assets (thumbnails, icons, sounds) to dist/');
  }

  console.log('\n[SUCCESS] Production extension build complete! Loadable from: dist/');
}

buildExtension().catch((err) => {
  console.error('[BUILD ERROR]', err);
  process.exit(1);
});
