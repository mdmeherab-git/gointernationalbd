// One-off script to generate GO International BD branded app icons/splash
// from the website's public/logo.svg. Run with: node scripts/generate-brand-assets.js
const path = require('node:path');
const sharp = require('sharp');

const SVG_PATH = path.resolve(__dirname, '../../public/logo.svg');
const OUT_DIR = path.resolve(__dirname, '../assets/images');

const NAVY = '#0B2A55';
const WHITE = '#ffffff';

async function renderMarkOnBackground(size, background, markScale) {
  const markSize = Math.round(size * markScale);
  const mark = await sharp(SVG_PATH, { density: 600 })
    .resize(markSize, markSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function renderMarkTransparent(size, markScale) {
  const markSize = Math.round(size * markScale);
  const mark = await sharp(SVG_PATH, { density: 600 })
    .resize(markSize, markSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function toWhiteSilhouette(pngBuffer) {
  const img = sharp(pngBuffer).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, alpha: 1 };
}

async function main() {
  // 1. Generic app icon (1024x1024, white background, logo mark at 68%).
  const icon = await renderMarkOnBackground(1024, hexToRgb(WHITE), 0.68);
  await sharp(icon).toFile(path.join(OUT_DIR, 'icon.png'));

  // 2. Android adaptive icon — foreground (transparent, logo within the
  //    ~66% safe zone so it isn't clipped by circular/rounded-square masks).
  const foreground = await renderMarkTransparent(1024, 0.5);
  await sharp(foreground).toFile(path.join(OUT_DIR, 'android-icon-foreground.png'));

  // 3. Android adaptive icon — background (solid white, flat).
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: hexToRgb(WHITE) } })
    .png()
    .toFile(path.join(OUT_DIR, 'android-icon-background.png'));

  // 4. Android adaptive icon — monochrome (white silhouette on transparent,
  //    for Android 13+ Material You themed icons).
  const monoSource = await renderMarkTransparent(1024, 0.5);
  const mono = await toWhiteSilhouette(monoSource);
  await sharp(mono).toFile(path.join(OUT_DIR, 'android-icon-monochrome.png'));

  // 5. Splash icon — logo mark alone, transparent background (composited
  //    onto app.json's configured splash backgroundColor at runtime).
  const splash = await renderMarkTransparent(600, 0.9);
  await sharp(splash).toFile(path.join(OUT_DIR, 'splash-icon.png'));

  // 6. Favicon (web) — small square, white background.
  const favicon = await renderMarkOnBackground(196, hexToRgb(WHITE), 0.68);
  await sharp(favicon).resize(48, 48).toFile(path.join(OUT_DIR, 'favicon.png'));

  console.log('Brand assets generated in', OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
