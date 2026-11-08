// itch.io release readiness gate. Everything Josh needs to publish the free
// itch.io page (docs/ITCH_ONBOARDING.md) is checked locally:
// artwork at documented sizes, 3-5 screenshots, runbook, packaging config.
// No network calls, no accounts, no publication — scaffold only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const failed = [];
const check = (name, ok, detail = '') => {
  console.log((ok ? 'PASS' : 'FAIL').padEnd(6) + name.padEnd(46) + (ok ? detail : ' <-- ' + detail));
  if (!ok) failed.push(name);
};

// PNG (IHDR) and JPEG (SOF) dimension parse.
const dims = (p) => {
  try {
    const b = fs.readFileSync(path.join(root, p));
    if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xFF && b[1] === 0xD8) {
      let i = 2;
      while (i < b.length - 10) {
        if (b[i] !== 0xFF) { i++; continue; }
        const m = b[i + 1], len = b.readUInt16BE(i + 2);
        if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC)
          return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        i += 2 + len;
      }
    }
    return null;
  } catch { return null; }
};

// --- 1. page artwork at itch.io documented sizes ---
const specs = [
  ['store/itch/cover.png', 630, 500],   // itch recommended cover (315:250 aspect)
  ['store/itch/social.png', 1200, 630], // open-graph share card
  ['store/itch/banner.png', 1920, 480], // page banner
];
for (const [p, w, h] of specs) {
  const d = dims(p);
  check('itch ' + p, !!d && d.w === w && d.h === h, d ? d.w + 'x' + d.h : 'missing');
}

// --- 2. screenshots: 3-5 at 1920x1080 (itch recommends 3-5) ---
const shots = fs.readdirSync(path.join(root, 'store', 'screenshots'))
  .filter(f => /^\d\d-.*\.png$/.test(f));
const okShots = shots.filter(f => {
  const d = dims(path.join('store', 'screenshots', f));
  return d && d.w === 1920 && d.h === 1080;
});
check('>= 3 store screenshots 1920x1080 (itch wants 3-5 uploaded)', okShots.length >= 3,
  okShots.length + ' usable of ' + shots.length + ' found; runbook uploads 5');

// --- 3. runbook + generator + scripts ---
check('itch onboarding runbook', fs.existsSync(path.join(root, 'docs', 'ITCH_ONBOARDING.md')));
check('itch asset generator', fs.existsSync(path.join(root, 'tools', 'itch-assets.mjs')));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
check('npm run itch:assets script', pkg.scripts['itch:assets'] === 'node tools/itch-assets.mjs');
check('npm run itch:ready script', pkg.scripts['itch:ready'] === 'node tools/itch-readiness.mjs');

// --- 4. the Windows zip the page will distribute ---
check('packaging config produces zip', /electron-builder --win .*\bzip\b/.test(pkg.scripts['package:windows'] || ''),
  pkg.scripts['package:windows'] || 'missing');

// --- 5. offline claim in the runbook matches the offline test ---
check('offline interactions test exists', fs.existsSync(path.join(root, 'tests', 'offline-interactions.mjs')));

console.log('======================================================================================');
if (failed.length) {
  console.log(failed.length + ' check(s) FAILED:');
  for (const f of failed) console.log(' - ' + f);
  process.exit(1);
}
console.log('All itch.io readiness checks passed.');
console.log('Publishing is free and manual: follow docs/ITCH_ONBOARDING.md.');
console.log('GOG (free, curated) and Steam (US$100, recoupable) remain open later.');
