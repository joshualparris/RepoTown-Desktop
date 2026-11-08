// Captures REAL in-game screenshots for the Steam store page by booting the
// actual game in headless Chromium (WebGL via SwiftShader) against a local
// server, staging scenes through the game's public window.__town API, and
// saving 1920x1080 PNGs. No game files are modified.
// Run: npm run store:screenshots  ->  store/screenshots/*.png
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameDir = path.join(root, 'game');
const outDir = path.join(root, 'store', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });
// Own port (8093) so this never fights the dev server on 8091.
const PORT = Number(process.env.SHOTS_PORT || 8093), HOST = '127.0.0.1', BASE = `http://${HOST}:${PORT}`;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, BASE);
    if (url.origin !== BASE || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(403); return res.end(); }
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const full = path.resolve(gameDir, '.' + p);
    if (full !== gameDir && !full.startsWith(gameDir + path.sep)) { res.writeHead(403); return res.end(); }
    const stat = fs.statSync(full);
    if (!stat.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream', 'content-length': stat.size, 'cache-control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(full).pipe(res);
  } catch { res.writeHead(404); res.end(); }
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  await new Promise(r => server.listen(PORT, HOST, r));
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  // Pre-unlock the playtest cheat menu (password-gated dev tool) so vehicle
  // staging works; the menu itself is closed before any shot is taken.
  await page.addInitScript(() => { try { sessionStorage.setItem('town-cheats', '1'); } catch { /* private mode */ } });
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(BASE + '/') || u.startsWith(BASE)) return route.continue();
    return route.abort('blockedbyclient'); // never contact third parties, same rule as the desktop shell
  });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => {
    const t = window.__town;
    return t && typeof t.state === 'function' && document.getElementById('loading')?.hidden === true;
  }, null, { timeout: 180000 });

  // Close any first-run help/settings overlays so shots are clean.
  for (const id of ['help', 'settings', 'npc-roster']) {
    await page.evaluate(id => { const el = document.getElementById(id); if (el) el.hidden = true; }, id);
  }
  await page.evaluate(() => { document.getElementById('title-screen')?.remove?.(); });

  // Scene staging uses the game's public test surface only: __town.place
  // (teleport + facing), __town.cheats (clock), __town.enterHome, __town.talkTo.
  // Every stage is VERIFIED from state() before the shot is kept, and UI panels
  // are closed between shots so one scene never bleeds into the next.
  const GO_NEW = [-150, 270.5, Math.PI], GO_HIGH = [0, 173.6, 0], GO_WORK = [456, 300, Math.PI];
  async function place(x, z, yaw) { await page.evaluate(([x, z, yaw]) => window.__town.place(x, z, yaw), [x, z, yaw]); }
  async function clock(cmd, advance) { await page.evaluate(([cmd, advance]) => { window.__town.cheats.run(cmd); if (advance) window.__town.advanceSimulation(advance); }, [cmd, advance || 0]); }
  async function tidy() {
    await page.evaluate(() => {
      try { window.__town.closePanel(); } catch { /* none */ }
      const r = document.getElementById('npc-roster'); if (r) r.hidden = true;
      const card = document.getElementById('card'); if (card) card.hidden = true; // property info card lingers after exits
    });
    await page.keyboard.press('Escape').catch(() => {});
  }
  async function verify(label, ok) {
    const st = await page.evaluate(() => { const s = window.__town.state(); return { mode: s.mode, time: s.time, pos: s.pos, driving: s.driving, near: s.near, chatOpen: (() => { try { return window.__town.npcChat().open; } catch { return false; } })() }; });
    console.log('  state ' + label + ': ' + JSON.stringify(st));
    return ok(st);
  }
  async function shot(name, caption, stage, settle, check) {
    await tidy();
    try { await stage(); } catch (e) { console.warn('stage failed for ' + name + ': ' + e.message); }
    await sleep(settle);
    if (check && !(await verify(name, check))) { console.warn('SKIPPED ' + name + ' (stage did not take effect)'); return; }
    // Headless Chromium has no microphone; hide mic badges AFTER they render, plus the cheat-vehicle readout.
    await page.evaluate(() => {
      for (const b of document.querySelectorAll('button, span, div, p, small, footer')) {
        const t = (b.textContent || '').trim();
        if ((/Recording unavailable|Cloudflare AI|Groq|Fictional AI characters|ElevenLabs/i.test(t)) && t.length < 220 && !b.querySelector('div, span, p')) { b.style.display = 'none'; }
      }
      const dm = document.getElementById('drive-model'); if (dm) dm.style.display = 'none';
    });
    await page.screenshot({ path: path.join(outDir, name + '.png'), type: 'png' });
    console.log('captured ' + name + ' - ' + caption);
  }

  // 1. Suburban street, early morning (default 07:00).
  await shot('01-morning-street', 'A quiet street in the new neighbourhood',
    () => place(...GO_NEW), 2500, st => st.mode === 'town');
  // 2. High Street from the opposite side, afternoon.
  await shot('02-afternoon-high-street', 'Afternoon on the High Street',
    async () => { await place(...GO_HIGH); await clock('t13'); }, 3000, st => st.mode === 'town' && st.time >= '13:00');
  // 3. The civic square at dusk, windows lighting up.
  await shot('03-evening-square', 'Evening: the windows light up around the square',
    async () => { await place(...GO_HIGH); await clock('t20'); }, 3000, st => st.mode === 'town' && st.time >= '20:00');
  // 4. Late night under the street lights (Saleyards Road).
  await shot('04-night-street', 'Late night under the street lights',
    async () => { await place(...GO_WORK); await clock('t20', 180); }, 3000, st => st.mode === 'town');
  // 5. Inside a home.
  await shot('05-inside-a-house', 'Step inside a neighbour\u2019s home',
    () => page.evaluate(() => { const c = window.__town.houses[0]?.coordinate; if (c) window.__town.enterHome(c); }), 3500, st => st.mode === 'house');
  // 6. DRAFT: talking with a neighbour. Kept out of the store set (prefix 'draft-')
  // until the upstream chat UI shows the character beside the panel; retake then.
  await shot('draft-06-meet-a-neighbour', 'Stop and talk with a neighbour',
    async () => {
      await page.evaluate(() => {
        window.__town.cheats.run('t13'); // daytime backdrop
        window.__town.meetVillager(0);   // stand face-to-face with a resident
        const n = window.__town.npcs.find(x => !/guide/i.test((x.name || '') + ' ' + (x.id || ''))) || window.__town.npcs[0];
        let opened = false;
        try { window.__town.talkTo(n.id); opened = window.__town.npcChat().open; } catch { /* try next */ }
        if (!opened) { try { window.__town.talkTo(window.__town.npcs[0].id); opened = window.__town.npcChat().open; } catch { /* last try below */ } }
        return opened;
      });
    }, 3000, st => st.mode === 'town' && st.chatOpen);
  // 7. Optional driving shot - only kept if a vehicle is actually entered.
  await shot('06-driving', 'Take a drive through the neighbourhood',
    async () => {
      await page.evaluate(() => { window.__town.cheats.run('goNew'); window.__town.cheats.open(); window.__town.cheats.run('carHere'); window.__town.cheats.close(); });
    }, 4500, st => !!st.driving);

  // Captions file for the store page draft.
  fs.writeFileSync(path.join(outDir, 'captions.json'), JSON.stringify({
    generated: new Date().toISOString(), source: 'in-game capture, headless Chromium WebGL',
    shots: fs.readdirSync(outDir).filter(f => /^\d\d-.*\.png$/.test(f)).sort().map(f => ({
      file: f,
      caption: {
        '01-morning-street.png': 'A quiet street in the new neighbourhood',
        '02-afternoon-high-street.png': 'Afternoon on the High Street',
        '03-evening-square.png': 'Evening: the windows light up around the square',
        '04-night-street.png': 'Late night under the street lights',
        '05-inside-a-house.png': 'Step inside a neighbour\u2019s home',
        '06-driving.png': 'Take a drive through the neighbourhood',
      }[f] || '',
    })),
  }, null, 2));
  console.log('wrote store/screenshots/captions.json');
  await context.close();
} finally {
  await browser.close();
  server.close();
}
