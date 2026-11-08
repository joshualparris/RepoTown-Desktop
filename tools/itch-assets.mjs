// Generates itch.io page artwork at the sizes itch documents for game pages:
//   cover  630x500   (315:250 aspect, min 315x250 — used in browse/search grids)
//   social 1200x630  (open-graph share card)
//   banner 1920x480  (page banner)
// Screenshots are NOT regenerated: store/screenshots/*.png (1920x1080) are
// uploaded as-is — itch recommends 3-5 of them.
// Run: npm run itch:assets  ->  store/itch/*.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'store', 'itch');
fs.mkdirSync(out, { recursive: true });

const BG = '#0d1e29', BG2 = '#123c3c', TEAL = '#52c6b5', CREAM = '#f3faf9', SAND = '#f0e2c0', AMBER = '#ffb264';

// Same isometric lot-grid motif as the Steam capsules (tools/capsules.mjs)
// so the storefronts look like one brand.
function scene(w, h, opts = {}) {
  const titleSize = Math.min(Math.round((opts.titleSize || 92) * (w > h ? 1 : 0.8)), Math.round(w / 10.8));
  const noSub = true;
  const titleY = Math.round(h * (noSub ? 0.42 : 0.32));
  const s = Math.min(Math.max(w, h) / 900, w / 950);
  const bw = 64 * s, bh = 34 * s, gapX = 26 * s, gapY = 18 * s;
  const cols = 9;
  const gridW = cols * bw + (cols - 1) * gapX;
  const blockBottom = Math.min(h * 0.95, h - 12 * s);
  const roofClear = 90 * s;
  let rows = 3, y0 = 0, gridH = 0;
  for (let tryRows = 3; tryRows >= 1; tryRows--) {
    gridH = tryRows * (bh + gapY);
    const candidate = Math.max(h * 0.60, titleY + titleSize * 0.3 + roofClear);
    if (candidate + gridH <= blockBottom) { rows = tryRows; y0 = candidate; break; }
    if (tryRows === 1) { rows = 1; y0 = Math.min(Math.max(candidate, h * 0.60), Math.max(blockBottom - gridH, h * 0.60)); }
  }
  const x0 = (w - gridW) / 2;
  const blocks = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = x0 + c * (bw + gapX), y = y0 + r * (bh + gapY);
    const hgt = (10 + ((r * 7 + c * 13) % 5) * 9) * s;
    const tone = ['#1d4a48', '#245a52', '#2f6b5c', '#1a4247'][(r + c) % 4];
    blocks.push(`<g><polygon points="${x},${y} ${x + bw},${y} ${x + bw + bw * .5},${y - bh * .5} ${x + bw * .5},${y - bh * .5}" fill="${tone}"/>`
      + `<polygon points="${x + bw},${y} ${x + bw * 1.5},${y - bh * .5} ${x + bw * 1.5},${y - bh * .5 - hgt} ${x + bw},${y - hgt}" fill="#173a3d"/>`
      + `<polygon points="${x + bw},${y - hgt} ${x + bw * 1.5},${y - bh * .5 - hgt} ${x + bw * .5},${y - bh - hgt} ${x},${y - hgt}" fill="${TEAL}" opacity="${0.55 + ((r + c) % 3) * 0.15}"/>`
      + `<polygon points="${x},${y - hgt} ${x + bw * .5},${y - bh * .5 - hgt} ${x + bw},${y - hgt} ${x + bw * .5},${y + bh * .5 - hgt}" fill="#2b6d62"/></g>`);
  }
  const ground = `<rect x="${w * 0.08}" y="${Math.min(y0 + gridH - 4 * s, h - 8 * s)}" width="${w * 0.84}" height="${5 * s}" rx="${2.5 * s}" fill="${AMBER}" opacity="0.35"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG}"/><stop offset="1" stop-color="${BG2}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w * 0.82}" cy="${h * 0.16}" r="${Math.min(w, h) * 0.34}" fill="${TEAL}" opacity="0.08"/>
  <circle cx="${w * 0.16}" cy="${h * 0.2}" r="${Math.min(w, h) * 0.2}" fill="${AMBER}" opacity="0.07"/>
  <text x="${w / 2}" y="${titleY}" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="${titleSize}" fill="${CREAM}" text-anchor="middle" textLength="${Math.round(w * 0.84)}" lengthAdjust="spacingAndGlyphs">REPOSITORY TOWN</text>
  ${blocks.join('')}${ground}
</svg>`;
  return opts.title === false ? svg.replace(/<text[^>]*>REPOSITORY TOWN<\/text>/, '') : svg;
}

const SPECS = [
  ['cover.png', 630, 500, {}],
  ['social.png', 1200, 630, {}],
  ['banner.png', 1920, 480, { title: false }], // decorative texture, like the Steam hero
];

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [name, w, h, opts] of SPECS) {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<body style="margin:0">${scene(w, h, opts)}</body>`);
    await page.screenshot({ path: path.join(out, name), type: 'png' });
    console.log('wrote store/itch/' + name + ' (' + w + 'x' + h + ')');
  }
} finally { await browser.close(); }
console.log('Screenshots for the itch page: use the existing store/screenshots/*.png (itch wants 3-5).');
