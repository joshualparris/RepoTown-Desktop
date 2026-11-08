// Generates Steam store capsule artwork at the EXACT dimensions Steam Direct
// requires, by rendering an SVG design in headless Chromium and screenshotting.
// These are clean branded drafts: replace with painted key art whenever ready,
// but the pipeline guarantees dimensions are never wrong.
// Run: npm run store:capsules  ->  store/capsules/*.png + desktop/assets/icon.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outCaps = path.join(root, 'store', 'capsules');
fs.mkdirSync(outCaps, { recursive: true });

// Game palette (from the desktop shell / game styles).
const BG = '#0d1e29', BG2 = '#123c3c', TEAL = '#52c6b5', CREAM = '#f3faf9', SAND = '#f0e2c0', AMBER = '#ffb264';

// Isometric lot-grid town motif: rows of small blocks + a road, echoing the
// game's courtyard-grid world. All SVG so it scales to any capsule size.
function scene(w, h, opts = {}) {
  // Width-aware type sizes: "REPOSITORY TOWN" is ~9.3em wide, the subtitle ~27em.
  const titleSize = Math.min(Math.round((opts.titleSize || 92) * (w > h ? 1 : 0.8)), Math.round(w / 10.8));
  const subSize = Math.min(Math.round((opts.subSize || 30) * (w > h ? 1 : 0.8)), Math.round(w / 30));
  const noSub = opts.sub === false;
  const titleY = Math.round(h * (noSub ? 0.42 : 0.32));
  const subY = titleY + Math.round(titleSize * 0.78);
  const s = Math.max(w, h) / 900;
  // Isometric lot-grid town: rows auto-fit so nothing ever spills past the frame.
  const bw = 64 * s, bh = 34 * s, gapX = 26 * s, gapY = 18 * s;
  const cols = 9;
  const gridW = cols * bw + (cols - 1) * gapX;
  const blockBottom = Math.min(h * 0.95, h - 12 * s);
  // Roof peaks rise up to ~90*s above the grid start; keep them clear of text.
  const roofClear = 90 * s;
  let rows = 3, y0 = 0, gridH = 0;
  for (let tryRows = 3; tryRows >= 1; tryRows--) {
    gridH = tryRows * (bh + gapY);
    const candidate = Math.max(h * 0.60, noSub ? titleY + titleSize * 0.3 + roofClear : subY + subSize * 1.2 + roofClear);
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
  const stars = opts.stars === false ? '' : `<text x="${w / 2}" y="${h * 0.15}" font-size="${Math.round(30 * s)}" fill="${AMBER}" text-anchor="middle" letter-spacing="${7 * s}">\u2605\u2605\u2605\u2605\u2605</text>`;
  const sub = noSub ? '' : `<text x="${w / 2}" y="${subY}" font-family="system-ui, sans-serif" font-size="${subSize}" fill="${TEAL}" text-anchor="middle" textLength="${Math.round(w * 0.66)}" lengthAdjust="spacingAndGlyphs">A LIVING GRID OF NEIGHBOURS, WORK &amp; MEMORY</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG}"/><stop offset="1" stop-color="${BG2}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w * 0.82}" cy="${h * 0.16}" r="${Math.min(w, h) * 0.34}" fill="${TEAL}" opacity="0.08"/>
  <circle cx="${w * 0.16}" cy="${h * 0.2}" r="${Math.min(w, h) * 0.2}" fill="${AMBER}" opacity="0.07"/>
  ${stars}
  <text x="${w / 2}" y="${titleY}" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="${titleSize}" fill="${CREAM}" text-anchor="middle" textLength="${Math.round(w * 0.84)}" lengthAdjust="spacingAndGlyphs">REPOSITORY TOWN</text>
  ${sub}
  ${blocks.join('')}${ground}
</svg>`;
}


const SPECS = [
  ['header.png', 916, 430, {}],
  ['small.png', 462, 174, { stars: false, sub: false }],
  ['main.png', 616, 353, {}],
  ['library.png', 300, 170, { stars: false, sub: false }],
  ['hero.png', 3840, 1240, {}],
];
function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BG}"/><stop offset="1" stop-color="${BG2}"/></linearGradient></defs>
  <rect width="512" height="512" rx="108" fill="url(#g)"/>
  <circle cx="256" cy="240" r="170" fill="${TEAL}" opacity="0.10"/>
  <text x="256" y="212" font-size="150" fill="${AMBER}" text-anchor="middle">\u2605</text>
  <g fill="${TEAL}">
    <rect x="96" y="300" width="72" height="72" rx="10" opacity="0.9"/>
    <rect x="188" y="332" width="72" height="40" rx="10" opacity="0.65"/>
    <rect x="280" y="300" width="72" height="72" rx="10" opacity="0.9"/>
    <rect x="372" y="332" width="44" height="40" rx="10" opacity="0.65"/>
    <rect x="96" y="388" width="320" height="14" rx="7" opacity="0.4"/>
  </g>
</svg>`;
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [name, w, h, opts] of SPECS) {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<body style="margin:0">${scene(w, h, opts)}</body>`);
    await page.screenshot({ path: path.join(outCaps, name), type: 'png' });
    console.log('wrote store/capsules/' + name + ' (' + w + 'x' + h + ')');
  }
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<body style="margin:0">${iconSvg()}</body>`);
  await page.screenshot({ path: path.join(root, 'desktop', 'assets', 'icon.png'), type: 'png' });
  console.log('wrote desktop/assets/icon.png (512x512)');
} finally { await browser.close(); }
