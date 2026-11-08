// Focused follow-up probes for the playtest: job facilities (store/cafe),
// and driving (cheat unlock must be set before page load, hence the reload).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron } from 'playwright';

let app, page;
const consoleErrs = [], pageErrs = [];
try {
  app = await electron.launch({
    args: [path.resolve('.'), '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    env: { ...process.env, STEAM_ACHIEVEMENTS: '1', RT_ACHIEVEMENTS_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'rt-playtest2-')) },
    timeout: 120000,
  });
  page = await app.firstWindow({ timeout: 120000 });
  page.on('pageerror', e => pageErrs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 200)); });

  await page.waitForFunction(() => window.__town?.state && document.getElementById('loading')?.hidden === true, null, { timeout: 240000 });

  // ---- 1. job facilities ----
  const facilities = await page.evaluate(() => {
    const t = window.__town;
    const ids = ['store', 'cafe', 'mill', 'depot', 'post', 'bakery'];
    const out = {};
    for (const id of ids) {
      try { const f = t.facilityState(id); out[id] = f ? { open: f.open, minute: f.minute, workers: (f.workers || []).length } : null; }
      catch (e) { out[id] = 'ERR ' + String(e).slice(0, 60); }
    }
    return out;
  });
  for (const [id, f] of Object.entries(facilities)) {
    console.log((f ? 'PASS' : 'FAIL').padEnd(6) + 'facility ' + id.padEnd(10) + ' ' + JSON.stringify(f));
  }

  // ---- 2. driving: unlock cheat flag BEFORE load, then reload ----
  await page.evaluate(() => { try { sessionStorage.setItem('town-cheats', '1'); } catch {} });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__town?.state && document.getElementById('loading')?.hidden === true, null, { timeout: 240000 });
  const car = await page.evaluate(() => {
    try {
      window.__town.cheats.open();
      const r = window.__town.cheats.run('carHere');
      window.__town.cheats.close();
      return { ok: true, result: r?.message || (r === undefined ? 'ran (no message)' : JSON.stringify(r).slice(0, 120)) };
    } catch (e) { return { ok: false, err: String(e).slice(0, 140) }; }
  });
  await page.waitForTimeout(2500);
  const driveState = await page.evaluate(() => {
    const s = window.__town.state();
    return { driving: s.driving, nearby: s.nearbyVehicle, speed: s.speed };
  });
  console.log((car.ok ? 'PASS' : 'FAIL').padEnd(6) + 'driving: carHere cheat runs  ' + (car.ok ? car.result : car.err));
  console.log((typeof driveState.driving === 'string' && driveState.driving ? 'PASS' : 'FAIL').padEnd(6) + 'driving: player in vehicle    registration=' + driveState.driving + ' nearby=' + driveState.nearby);

  // drive a little: accelerate via input? At minimum the dashboard should show.
  const dash = await page.evaluate(() => ({ visible: !document.getElementById('driving-dashboard')?.hidden, hud: document.getElementById('clock')?.textContent }));
  console.log('INFO   driving: dashboard present  ' + JSON.stringify(dash));

} catch (e) {
  console.log('FAIL   harness: ' + String(e).slice(0, 300));
} finally {
  try { await app?.close(); } catch {}
}
console.log('---- page errors: ' + pageErrs.length + '; console errors: ' + consoleErrs.length);
pageErrs.slice(0, 5).forEach(e => console.log('  [pageerror] ' + e.slice(0, 180)));
consoleErrs.slice(0, 8).forEach(e => console.log('  [console] ' + e));
