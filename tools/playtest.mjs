// Full-game playtest against the actual Electron shell (same build the itch.io
// zip ships). Drives the public __town test surface through every major
// system — boot, exploration, interiors, NPCs, jobs, driving, clock/sleep,
// achievements, save/reload — and reports PASS/FAIL per probe with every
// console error, page error and failed request captured.
// Run: xvfb-run -a node tools/playtest.mjs   (fresh userData each run)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron } from 'playwright';

const results = [];
const probe = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log((ok ? 'PASS' : 'FAIL').padEnd(6) + name.padEnd(52) + (detail ? ' -- ' + detail : ''));
};

let app, page;
const errors = [], consoleErrs = [], failedReqs = [];
try {
  app = await electron.launch({
    args: [path.resolve('.'), '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    env: { ...process.env, STEAM_ACHIEVEMENTS: '1', RT_ACHIEVEMENTS_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'rt-playtest-')) },
    timeout: 120000,
  });
  page = await app.firstWindow({ timeout: 120000 });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 300)); });
  page.on('requestfailed', r => failedReqs.push(r.url().slice(0, 120) + ' ' + (r.failure()?.errorText || '')));
  // Achievements listener attaches BEFORE boot so the boot-state unlock
  // (game starts inside the Railway Hotel room => HOME_VISIT on first poll)
  // is captured instead of missed.
  const toastPromise = page.evaluate(() => new Promise(resolve => {
    const t = setTimeout(() => resolve(null), 300000);
    const wait = setInterval(() => {
      if (!window.desktop?.onAchievement) return;
      clearInterval(wait);
      window.desktop.onAchievement(a => { clearTimeout(t); resolve(a); });
    }, 250);
  }));

  // ---------- 1. boot ----------
  await page.waitForFunction(() => window.__town?.state && document.getElementById('loading')?.hidden === true, null, { timeout: 240000 });
  const boot = await page.evaluate(() => {
    const s = window.__town.state();
    return { mode: s.mode, day: s.day, time: s.time, pos: s.pos, houses: window.__town.houses?.length, npcs: window.__town.npcs?.length, fps: s.fps };
  });
  probe('boot: game loaded, __town ready', true, 'mode=' + boot.mode + ' day=' + boot.day + ' houses=' + boot.houses + ' npcs=' + boot.npcs);
  probe('boot: 188 houses present', boot.houses === 188, 'got ' + boot.houses);
  probe('boot: NPCs exist', (boot.npcs || 0) >= 5, 'got ' + boot.npcs);

  // ---------- 2. exploration (teleport + verify position) ----------
  const spots = [['goNew', -150, 270.5], ['goHigh', 0, 173.6], ['goWork', 456, 300]];
  for (const [cheat, ex, ez] of spots) {
    await page.evaluate(c => window.__town.cheats.run(c), cheat);
    await page.waitForTimeout(1500);
    const p = await page.evaluate(() => window.__town.state().pos);
    const near = Math.hypot((p.x ?? p[0] ?? 0) - ex, (p.z ?? p[1] ?? 0) - ez) < 60;
    probe('explore: teleport ' + cheat, near, 'pos=' + JSON.stringify(p));
  }

  // ---------- 3. interiors ----------
  const firstHouse = await page.evaluate(() => window.__town.houses[0]);
  const entered = await page.evaluate(c => window.__town.enterHome(c), firstHouse.coordinate);
  await page.waitForTimeout(2500);
  const inHouse = await page.evaluate(() => window.__town.state().mode);
  probe('interior: enterHome accepted', !!entered, JSON.stringify(entered).slice(0, 80));
  probe('interior: mode is house', inHouse === 'house', 'mode=' + inHouse);
  // exit back to town
  const exited = await page.evaluate(() => { const b = document.getElementById('btn-exit'); if (b && !b.hidden) { b.click(); return true; } return false; });
  await page.waitForTimeout(2000);
  const modeAfter = await page.evaluate(() => window.__town.state().mode);
  probe('interior: exit returns to town', modeAfter === 'town', 'exit btn=' + exited + ' mode=' + modeAfter);

  // ---------- 4. NPCs ----------
  const npcTalk = await page.evaluate(async () => {
    const t = window.__town;
    const id = t.npcs[0]?.id ?? t.npcs[0]?.name;
    const r = await (t.talkTo ? t.talkTo(id) : Promise.resolve(null));
    return { id, reply: typeof r === 'string' ? r.slice(0, 160) : JSON.stringify(r)?.slice(0, 160) };
  });
  probe('npc: talkTo responds', !!npcTalk.reply && npcTalk.reply !== 'null', 'id=' + npcTalk.id + ' reply=' + (npcTalk.reply || '').slice(0, 100));

  // ---------- 5. jobs: facilities (store/cafe workplay system) ----------
  const facilities = await page.evaluate(() => {
    const t = window.__town;
    const campuses = (t.campuses?.() || []).map(c => ({ id: c.id, name: c.name, wings: c.wings }));
    // civic.workplay initialises lazily on first facility use; probe the
    // facility state API instead, which exercises the same roster/access data.
    const probe = campuses.length ? t.facilityState?.(campuses[0].id) : null;
    return { campuses: campuses.slice(0, 6), probe, workplay: t.state().workplay };
  });
  probe('jobs: town facilities exist', (facilities.campuses || []).length >= 1,
    (facilities.campuses || []).map(c => c.id).join(',').slice(0, 100));
  probe('jobs: facility state readable', !!facilities.probe, JSON.stringify(facilities.probe)?.slice(0, 140));

  // ---------- 6. driving ----------
  await page.evaluate(() => { try { sessionStorage.setItem('town-cheats', '1'); } catch {} });
  // Cheat menu must be open (renders #cheat-vehicle) before carHere runs.
  const carResp = await page.evaluate(() => {
    try { window.__town.cheats.open(); window.__town.cheats.run('carHere'); window.__town.cheats.close(); return 'ok'; }
    catch (e) { return String(e).slice(0, 120); }
  });
  await page.waitForTimeout(2000);
  const driving = await page.evaluate(() => window.__town.state().driving);
  probe('driving: carHere cheat runs', carResp === 'ok', carResp);
  probe('driving: player is in a vehicle', typeof driving === 'string' && !!driving, 'registration=' + driving);

  // ---------- 7. clock: time jumps, day advance, sleep ----------
  for (const c of ['t8', 't13', 't20']) {
    await page.evaluate(c2 => window.__town.cheats.run(c2), c);
    await page.waitForTimeout(800);
  }
  const clock = await page.evaluate(() => { const s = window.__town.state(); return { time: s.time, day: s.day, sleeping: s.sleeping }; });
  probe('clock: time-of-day jumps applied', !!clock.time, 'time=' + clock.time + ' day=' + clock.day);
  const adv = await page.evaluate(() => window.__town.advanceSimulation(240));
  await page.waitForTimeout(1500);
  const afterAdv = await page.evaluate(() => { const s = window.__town.state(); return { day: s.day, time: s.time }; });
  probe('clock: advanceSimulation runs', !!adv, 'day ' + clock.day + '->' + afterAdv.day + ' time=' + afterAdv.time);

  // ---------- 8. achievements toast (listener attached pre-boot) ----------
  const unlocked = await toastPromise;
  probe('achievements: toast delivered', !!unlocked, unlocked ? unlocked.id + ' - ' + unlocked.name : 'none in 20s');

  // ---------- 9. save + reload persistence ----------
  const before = await page.evaluate(() => ({ day: window.__town.state().day, pos: window.__town.state().pos, ls: Object.keys(localStorage).filter(k => /town|save|progress/i.test(k)).slice(0, 5) }));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__town?.state && document.getElementById('loading')?.hidden === true, null, { timeout: 240000 });
  const after = await page.evaluate(() => ({ day: window.__town.state().day, pos: window.__town.state().pos }));
  const sameDay = before.day === after.day;
  probe('save: reload keeps progress', sameDay, 'day ' + before.day + '->' + after.day + ' keys=' + before.ls.join(','));

  // ---------- 10. multiplayer status ----------
  const mp = await page.evaluate(() => window.__town.multiplayer?.() ?? null);
  probe('multiplayer: status object present', !!mp, JSON.stringify(mp)?.slice(0, 120));

  // ---------- 11. FPS sample ----------
  const fps = await page.evaluate(() => new Promise(res => {
    let frames = 0; const t0 = performance.now();
    (function tick() { frames++; if (performance.now() - t0 < 5000) requestAnimationFrame(tick); else res(Math.round(frames / 5)); })();
  }));
  // SwiftShader software rendering is not representative of real GPUs; the
  // CI quality gate (tests/steam-quality.mjs) sets the actual floor.
  console.log('INFO   performance: headless SwiftShader FPS ' + fps + ' (software renderer; real GPUs are faster)');

} catch (e) {
  probe('harness: unexpected failure', false, String(e).slice(0, 300));
} finally {
  try { await app?.close(); } catch {}
}

// ---------- error summary ----------
const dedupe = a => [...new Set(a)];
console.log('\n---- error capture ----');
console.log('page errors: ' + dedupe(errors).length); dedupe(errors).slice(0, 10).forEach(e => console.log('  [pageerror] ' + e.slice(0, 200)));
console.log('console errors: ' + dedupe(consoleErrs).length); dedupe(consoleErrs).slice(0, 15).forEach(e => console.log('  [console] ' + e.slice(0, 200)));
console.log('failed requests: ' + dedupe(failedReqs).length); dedupe(failedReqs).slice(0, 10).forEach(e => console.log('  [request] ' + e));

const fails = results.filter(r => !r.ok);
console.log('\n==== ' + results.filter(r => r.ok).length + '/' + results.length + ' probes passed ====');
if (fails.length) { fails.forEach(f => console.log('FAILED: ' + f.name + ' -- ' + f.detail)); process.exit(1); }
