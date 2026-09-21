// Converts the website's public/flags/*.svg (255 files, one per ISO
// country code) into PNGs bundled with the mobile app, and generates a
// static require() map (Metro needs static string literals for require).
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const SRC_DIR = path.resolve(__dirname, '../../public/flags');
const OUT_DIR = path.resolve(__dirname, '../assets/flags');
const MAP_FILE = path.resolve(__dirname, '../src/lib/flags.ts');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.svg'));

  const codes = [];
  for (const file of files) {
    const code = file.replace(/\.svg$/, '');
    const svgPath = path.join(SRC_DIR, file);
    const pngPath = path.join(OUT_DIR, `${code}.png`);
    await sharp(svgPath, { density: 96, limitInputPixels: false })
      .resize(120, 90, { fit: 'cover' })
      .png()
      .toFile(pngPath);
    codes.push(code);
  }
  codes.sort();

  const lines = [
    '// GENERATED FILE — see scripts/generate-flags.js. Do not hand-edit.',
    '// Metro requires static string-literal paths, so this is a plain object',
    '// literal rather than a dynamic require(`./${code}.png`) call.',
    'export const FLAGS: Record<string, number> = {',
    ...codes.map((code) => `  '${code}': require('../../assets/flags/${code}.png'),`),
    '};',
    '',
  ];
  fs.writeFileSync(MAP_FILE, lines.join('\n'));
  console.log(`Generated ${codes.length} flags -> ${OUT_DIR}`);
  console.log(`Generated map -> ${MAP_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
