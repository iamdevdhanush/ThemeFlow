import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const imagesDir = path.resolve('IMAGES');
const outputThumbnailsDir = path.resolve('public/thumbnails');

if (!fs.existsSync(outputThumbnailsDir)) {
  fs.mkdirSync(outputThumbnailsDir, { recursive: true });
}

async function inspectAndGenerate() {
  const files = fs.readdirSync(imagesDir);
  console.log(`Found ${files.length} files in ${imagesDir}:`);

  const results = [];

  for (const file of files) {
    const fullPath = path.join(imagesDir, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    try {
      const metadata = await sharp(fullPath).metadata();
      const info = {
        filename: file,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        space: metadata.space,
        channels: metadata.channels,
        sizeBytes: stat.size,
        hasAlpha: metadata.hasAlpha,
      };
      results.push(info);

      // Generate a clean, crisp 480px width thumbnail in WebP format
      const thumbName = `${path.parse(file).name}.webp`;
      const thumbPath = path.join(outputThumbnailsDir, thumbName);
      await sharp(fullPath)
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(thumbPath);

      console.log(`[OK] ${file}: ${info.width}x${info.height} (${info.format}), size: ${(stat.size / 1024).toFixed(1)} KB -> thumb: ${thumbName}`);
    } catch (err) {
      console.error(`[ERROR] Failed to process ${file}:`, err.message);
    }
  }

  // Also write metadata summary JSON for extension usage
  fs.writeFileSync(
    path.resolve('src/theme-image-data.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log(`Wrote image metadata to src/theme-image-data.json`);
}

// Ensure src directory exists
if (!fs.existsSync(path.resolve('src'))) {
  fs.mkdirSync(path.resolve('src'), { recursive: true });
}

inspectAndGenerate();
