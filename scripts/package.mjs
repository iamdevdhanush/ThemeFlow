import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const releaseDir = path.resolve('release');
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const manifest = JSON.parse(fs.readFileSync('dist/manifest.json', 'utf-8'));
const version = manifest.version || '1.1.0';
const zipName = `themeflow-v${version}.zip`;
const zipPath = path.join(releaseDir, zipName);

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log(`Creating release ZIP package: ${zipName}...`);

try {
  // Use PowerShell Compress-Archive for reliable zip creation on Windows
  const distContent = path.resolve('dist/*');
  const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${distContent}' -DestinationPath '${zipPath}' -Force"`;
  execSync(psCommand, { stdio: 'inherit' });

  const zipStat = fs.statSync(zipPath);
  console.log(`\n[SUCCESS] Packaged release archive created!`);
  console.log(`  Archive: ${zipPath}`);
  console.log(`  ZIP Size: ${(zipStat.size / (1024 * 1024)).toFixed(2)} MB (${(zipStat.size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error('[ERROR] Failed to package zip archive:', err.message);
  process.exit(1);
}
