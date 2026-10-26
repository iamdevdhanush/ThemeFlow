import fs from 'node:fs';
import path from 'node:path';

// Configurable warning thresholds
const WARN_FILE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB
const WARN_TOTAL_SIZE_BYTES = 10.0 * 1024 * 1024; // 10.0 MB

const distDir = path.resolve('dist');

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validates that a relative path exists in distDir with EXACT case sensitivity.
 * On Windows, NTFS is case-insensitive, so fs.existsSync alone is insufficient.
 */
function verifyExactCase(relativeFilePath) {
  const segments = relativeFilePath.replace(/^[/\\]+/, '').split(/[/\\]/);
  let currentDir = distDir;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!fs.existsSync(currentDir)) {
      return { ok: false, reason: `Directory missing: ${path.relative(distDir, currentDir)}` };
    }

    const entries = fs.readdirSync(currentDir);
    const exactMatch = entries.find((e) => e === segment);
    const caseInsensitiveMatch = entries.find((e) => e.toLowerCase() === segment.toLowerCase());

    if (!exactMatch) {
      if (caseInsensitiveMatch) {
        return {
          ok: false,
          reason: `Case mismatch: expected "${segment}", but found "${caseInsensitiveMatch}" on disk`,
        };
      }
      return { ok: false, reason: `Not found: "${segment}" in "${path.relative(distDir, currentDir) || '.'}"` };
    }

    currentDir = path.join(currentDir, segment);
  }

  const stat = fs.statSync(currentDir);
  return { ok: true, isFile: stat.isFile(), size: stat.size };
}

async function verifyAssets() {
  console.log('--- ThemeFlow Asset & Build Integrity Verification ---');

  if (!fs.existsSync(distDir)) {
    console.error('[FAIL] dist/ directory does not exist! Run npm run build first.');
    process.exit(1);
  }

  const errors = [];
  const warnings = [];

  // 1. Inspect manifest.json
  const manifestPath = path.join(distDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push('dist/manifest.json is missing');
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (err) {
    errors.push(`Failed to parse dist/manifest.json: ${err.message}`);
  }

  // 2. Validate manifest references
  if (manifest) {
    // Icons
    if (manifest.icons) {
      for (const [size, iconRel] of Object.entries(manifest.icons)) {
        const res = verifyExactCase(iconRel);
        if (!res.ok) {
          errors.push(`Manifest icon [${size}]: ${res.reason} (${iconRel})`);
        }
      }
    }

    // Action popup
    if (manifest.action?.default_popup) {
      const res = verifyExactCase(manifest.action.default_popup);
      if (!res.ok) errors.push(`Manifest action default_popup: ${res.reason}`);
    }

    // Action icons
    if (manifest.action?.default_icon) {
      for (const [size, iconRel] of Object.entries(manifest.action.default_icon)) {
        const res = verifyExactCase(iconRel);
        if (!res.ok) errors.push(`Manifest action icon [${size}]: ${res.reason}`);
      }
    }

    // Options page
    if (manifest.options_page) {
      const res = verifyExactCase(manifest.options_page);
      if (!res.ok) errors.push(`Manifest options_page: ${res.reason}`);
    }

    // Service worker
    if (manifest.background?.service_worker) {
      const res = verifyExactCase(manifest.background.service_worker);
      if (!res.ok) errors.push(`Manifest service_worker: ${res.reason}`);
    }

    // Content scripts
    if (manifest.content_scripts) {
      for (const cs of manifest.content_scripts) {
        for (const js of cs.js || []) {
          const res = verifyExactCase(js);
          if (!res.ok) errors.push(`Content script JS: ${res.reason}`);
        }
        for (const css of cs.css || []) {
          const res = verifyExactCase(css);
          if (!res.ok) errors.push(`Content script CSS: ${res.reason}`);
        }
      }
    }
  }

  // 3. Validate Built-in Theme Asset References from definitions
  const defFile = fs.readFileSync('src/themes/definitions/index.ts', 'utf-8');
  const wallpaperMatches = [...defFile.matchAll(/wallpaper:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const thumbnailMatches = [...defFile.matchAll(/thumbnail:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const acMatches = [...defFile.matchAll(/acSoundPath:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const waMatches = [...defFile.matchAll(/waSoundPath:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);

  console.log(`\nValidating theme definitions (${wallpaperMatches.length} themes)...`);

  for (const wp of wallpaperMatches) {
    const res = verifyExactCase(wp);
    if (!res.ok) {
      errors.push(`Theme wallpaper asset missing/mismatched: ${res.reason} (${wp})`);
    }
  }

  for (const thumb of thumbnailMatches) {
    const res = verifyExactCase(thumb);
    if (!res.ok) {
      errors.push(`Theme thumbnail asset missing/mismatched: ${res.reason} (${thumb})`);
    }
  }

  const soundAssets = new Set([...acMatches, ...waMatches]);
  for (const sound of soundAssets) {
    const res = verifyExactCase(sound);
    if (!res.ok) {
      errors.push(`Theme sound asset missing/mismatched: ${res.reason} (${sound})`);
    }
  }

  // 4. Scan all files in dist and calculate breakdown & sizes
  function getAllFiles(dir) {
    let results = [];
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(getAllFiles(fullPath));
      } else {
        results.push({
          relPath: path.relative(distDir, fullPath).replace(/\\/g, '/'),
          size: stat.size,
        });
      }
    }
    return results;
  }

  const allDistFiles = getAllFiles(distDir);
  let totalSizeBytes = 0;

  console.log('\n--- Production Bundle Asset Inventory ---');
  allDistFiles.sort((a, b) => b.size - a.size);

  const categories = {
    Wallpapers: [],
    Thumbnails: [],
    Sounds: [],
    Icons: [],
    'Code & HTML': [],
    Other: [],
  };

  for (const file of allDistFiles) {
    totalSizeBytes += file.size;

    if (file.size > WARN_FILE_SIZE_BYTES) {
      warnings.push(`Large asset: "${file.relPath}" is ${formatBytes(file.size)} (exceeds ${formatBytes(WARN_FILE_SIZE_BYTES)})`);
    }

    if (file.relPath.startsWith('IMAGES/')) categories.Wallpapers.push(file);
    else if (file.relPath.startsWith('thumbnails/')) categories.Thumbnails.push(file);
    else if (file.relPath.startsWith('sounds/')) categories.Sounds.push(file);
    else if (file.relPath.startsWith('icons/')) categories.Icons.push(file);
    else if (file.relPath.endsWith('.js') || file.relPath.endsWith('.css') || file.relPath.endsWith('.html')) categories['Code & HTML'].push(file);
    else categories.Other.push(file);
  }

  for (const [cat, files] of Object.entries(categories)) {
    const catTotal = files.reduce((sum, f) => sum + f.size, 0);
    console.log(`\n[${cat}] (${files.length} files, Total: ${formatBytes(catTotal)})`);
    for (const f of files) {
      console.log(`  - ${f.relPath.padEnd(36)} ${formatBytes(f.size).padStart(10)}`);
    }
  }

  console.log('\n----------------------------------------');
  console.log(`Total Package Size: ${formatBytes(totalSizeBytes)} across ${allDistFiles.length} files`);

  if (totalSizeBytes > WARN_TOTAL_SIZE_BYTES) {
    warnings.push(`Total package size ${formatBytes(totalSizeBytes)} exceeds warning threshold of ${formatBytes(WARN_TOTAL_SIZE_BYTES)}`);
  }

  // 5. Version synchronization check
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  console.log(`\nVersion Check: package.json v${pkg.version} vs manifest.json v${manifest?.version}`);
  if (pkg.version !== manifest?.version) {
    errors.push(`Version mismatch: package.json has v${pkg.version} but manifest.json has v${manifest?.version}`);
  }

  // Summary
  if (warnings.length > 0) {
    console.log('\n[WARNINGS]');
    for (const w of warnings) console.warn(`  ! ${w}`);
  }

  if (errors.length > 0) {
    console.error('\n[BUILD INTEGRITY ERRORS]');
    for (const e of errors) console.error(`  X ${e}`);
    console.error(`\nVerification FAILED with ${errors.length} error(s).`);
    process.exit(1);
  }

  console.log(`\n[PASS] All required assets, manifest references, and casing checks verified successfully!`);
}

verifyAssets().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
