import sharp from 'sharp';

async function test() {
  const meta = await sharp('IMAGES/galaxy.jpg').metadata();
  console.log(`Original galaxy.jpg: ${meta.width}x${meta.height} (${meta.format})`);

  const w1920_85 = await sharp('IMAGES/galaxy.jpg').resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  console.log('WebP 1920 q85:', (w1920_85.length / 1024).toFixed(1) + ' KB');

  const w1920_80 = await sharp('IMAGES/galaxy.jpg').resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  console.log('WebP 1920 q80:', (w1920_80.length / 1024).toFixed(1) + ' KB');

  const w2560_80 = await sharp('IMAGES/galaxy.jpg').resize({ width: 2560, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  console.log('WebP 2560 q80:', (w2560_80.length / 1024).toFixed(1) + ' KB');
}

test().catch(console.error);
