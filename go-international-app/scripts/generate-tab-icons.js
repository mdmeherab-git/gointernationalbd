// Generates simple black-glyph-on-transparent tab bar icons (matching the
// existing home.png/explore.png style: 24/48/72px @1x/@2x/@3x, template
// rendering mode tints them at runtime).
const path = require('node:path');
const sharp = require('sharp');

const OUT_DIR = path.resolve(__dirname, '../assets/images/tabIcons');

const ICONS = {
  jobs: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="8" width="17" height="11" rx="2" fill="none" stroke="black" stroke-width="1.6"/>
      <path d="M9 8V6.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6.5V8" fill="none" stroke="black" stroke-width="1.6"/>
      <line x1="3.5" y1="13" x2="20.5" y2="13" stroke="black" stroke-width="1.6"/>
    </svg>`,
  applications: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="4" width="14" height="17" rx="2" fill="none" stroke="black" stroke-width="1.6"/>
      <rect x="9" y="3" width="6" height="3" rx="1" fill="black"/>
      <line x1="8" y1="11" x2="16" y2="11" stroke="black" stroke-width="1.6"/>
      <line x1="8" y1="15" x2="16" y2="15" stroke="black" stroke-width="1.6"/>
      <line x1="8" y1="19" x2="13" y2="19" stroke="black" stroke-width="1.6"/>
    </svg>`,
  visa: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="black" stroke-width="1.6"/>
      <ellipse cx="12" cy="12" rx="3.6" ry="8.5" fill="none" stroke="black" stroke-width="1.6"/>
      <line x1="3.5" y1="12" x2="20.5" y2="12" stroke="black" stroke-width="1.6"/>
    </svg>`,
  account: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" fill="none" stroke="black" stroke-width="1.6"/>
      <path d="M4.5 20c1-4 4.2-6 7.5-6s6.5 2 7.5 6" fill="none" stroke="black" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`,
};

async function main() {
  for (const [name, svg] of Object.entries(ICONS)) {
    const buf = Buffer.from(svg);
    await sharp(buf, { density: 300 }).resize(24, 24).png().toFile(path.join(OUT_DIR, `${name}.png`));
    await sharp(buf, { density: 300 }).resize(48, 48).png().toFile(path.join(OUT_DIR, `${name}@2x.png`));
    await sharp(buf, { density: 300 }).resize(72, 72).png().toFile(path.join(OUT_DIR, `${name}@3x.png`));
  }
  console.log('Tab icons generated in', OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
