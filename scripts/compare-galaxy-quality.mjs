import sharp from 'sharp';
import fs from 'node:fs';

async function compareQuality() {
  const origPath = 'IMAGES/galaxy.jpg';
  const meta = await sharp(origPath).metadata();
  console.log(`Original: ${meta.width}x${meta.height}, ${meta.format}, size: ${(fs.statSync(origPath).size / 1024 / 1024).toFixed(2)} MB`);

  // Target width 2560 (QHD resolution, aspect ratio preserved: 2560 x 1634)
  const targetWidth = 2560;
  const targetHeight = Math.round(targetWidth * (meta.height / meta.width));
  console.log(`Target Dimensions: ${targetWidth}x${targetHeight}`);

  // 1. JPEG quality 88
  const jpeg88 = await sharp(origPath)
    .resize({ width: targetWidth, height: targetHeight, fit: 'inside' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  console.log(`JPEG 2560 q88: ${(jpeg88.length / 1024).toFixed(1)} KB`);

  // 2. JPEG quality 85
  const jpeg85 = await sharp(origPath)
    .resize({ width: targetWidth, height: targetHeight, fit: 'inside' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  console.log(`JPEG 2560 q85: ${(jpeg85.length / 1024).toFixed(1)} KB`);

  // 3. WebP quality 85
  const webp85 = await sharp(origPath)
    .resize({ width: targetWidth, height: targetHeight, fit: 'inside' })
    .webp({ quality: 85 })
    .toBuffer();
  console.log(`WebP 2560 q85: ${(webp85.length / 1024).toFixed(1)} KB`);

  // Compare pixels: downsample original to 2560x1634 raw and compare against jpeg88 raw
  const rawOrig = await sharp(origPath)
    .resize({ width: targetWidth, height: targetHeight, fit: 'inside' })
    .raw()
    .toBuffer();

  const rawJpeg88 = await sharp(jpeg88).raw().toBuffer();

  const rawWebp85 = await sharp(webp85).raw().toBuffer();
  let mseWebp = 0;
  for (let i = 0; i < rawOrig.length; i++) {
    const diff = rawOrig[i] - rawWebp85[i];
    mseWebp += diff * diff;
  }
  mseWebp = mseWebp / rawOrig.length;
  const psnrWebp = 10 * Math.log10((255 * 255) / mseWebp);
  console.log(`PSNR of WebP q85 vs original (downsampled): ${psnrWebp.toFixed(2)} dB`);
}

compareQuality().catch(console.error);
