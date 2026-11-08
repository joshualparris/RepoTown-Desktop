// End-to-end shell test: launch the REAL Electron app (main.cjs) under Xvfb,
// verify the achievements bridge is injected, the game boots, and driving a
// workplay state through window.__town triggers an achievement toast + unlock.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let app;
try {
  app = await electron.launch({
    args: [root, '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    env: { ...process.env, STEAM_ACHIEVEMENTS: '1' },
    timeout: 90000,
  });
  const page = await app.firstWindow({ timeout: 90000 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.waitForFunction(() => window.__town?.state && document.getElementById('loading')?.hidden === true, null, { timeout: 180000 });

  // 1. Bridge injected and preload surface present.
  assert(await page.evaluate(() => !!window.__townAchievementsBridge), 'achievements bridge injected');
  assert(await page.evaluate(() => !!window.desktop && typeof window.desktop.reportState === 'function'), 'preload contextBridge surface exposed');
  const api = await page.evaluate(() => window.desktop.achievementAPI());
  assert(Array.isArray(api) && api.length >= 10, 'achievement API returns the full list');

  // 2. Simulated unlock: the bridge polls __town; drive a state that satisfies
  //    predicates (enter a house => HOME_VISIT) and wait for the toast event.
  const toast = page.evaluate(() => new Promise(resolve => {
    const t = setTimeout(() => resolve(null), 20000);
    window.desktop.onAchievement(a => { clearTimeout(t); resolve(a); });
    // Force the poll path by entering a house through the public API.
    const c = window.__town.houses[0]?.coordinate;
    if (c) window.__town.enterHome(c);
  }));
  const unlocked = await toast;
  assert(unlocked && unlocked.id, 'an achievement unlocked and reached the page: ' + JSON.stringify(unlocked));
  assert(await page.evaluate(() => !!document.querySelector('#hud')), 'HUD still present (page intact, no truncation)');

  // 3. No page errors from the injected bridge.
  assert.equal(errors.length, 0, 'uncaught page exceptions: ' + errors.slice(0, 3).join(' | '));
  console.log('PASS: Electron shell boots with achievements bridge; unlock toast delivered (' + unlocked.id + ').');
} finally {
  await app?.close().catch(() => {});
}
