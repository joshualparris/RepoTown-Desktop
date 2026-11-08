// End-to-end shell test: launch the REAL Electron app (main.cjs) under Xvfb,
// verify the achievements bridge is injected, the game boots, and driving a
// workplay state through window.__town triggers an achievement toast + unlock.
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let app;
try {
  app = await electron.launch({
    // --no-sandbox: required on CI runners where chrome-sandbox lacks SUID.
    args: [root, '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    env: { ...process.env, STEAM_ACHIEVEMENTS: '1', RT_ACHIEVEMENTS_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ach-e2e-')) },
    timeout: 90000,
  });
  const page = await app.firstWindow({ timeout: 90000 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Attach the toast listener BEFORE the game finishes booting: the fresh
  // progress dir means the boot-state achievement (the game now starts inside
  // the Railway Hotel room => HOME_VISIT) fires as soon as the bridge's first
  // poll runs, which can precede this test's later waitForFunction.
  const toast = page.evaluate(() => new Promise(resolve => {
    const t = setTimeout(() => resolve(null), 45000);
    const wait = setInterval(() => {
      if (!window.desktop?.onAchievement) return;
      clearInterval(wait);
      window.desktop.onAchievement(a => { clearTimeout(t); resolve(a); });
    }, 250);
  }));
  await page.waitForFunction(() => window.__town?.state && document.getElementById('loading')?.hidden === true, null, { timeout: 180000 });

  // 1. Bridge injected and preload surface present.
  assert(await page.evaluate(() => !!window.__townAchievementsBridge), 'achievements bridge injected');
  assert(await page.evaluate(() => !!window.desktop && typeof window.desktop.reportState === 'function'), 'preload contextBridge surface exposed');
  const api = await page.evaluate(() => window.desktop.achievementAPI());
  assert(Array.isArray(api) && api.length >= 10, 'achievement API returns the full list');

  // 2. The bridge polls __town on its own; with fresh progress the boot state
  //    itself unlocks an achievement (the game starts inside the hotel room).
  //    Nudge the poll by reporting a synthetic town state too.
  await page.evaluate(() => window.desktop.reportState({ mode: 'town' }, null));
  const unlocked = await toast;
  assert(unlocked && unlocked.id, 'an achievement unlocked and reached the page: ' + JSON.stringify(unlocked));
  assert(await page.evaluate(() => !!document.querySelector('#hud')), 'HUD still present (page intact, no truncation)');

  // 3. No page errors from the injected bridge.
  assert.equal(errors.length, 0, 'uncaught page exceptions: ' + errors.slice(0, 3).join(' | '));
  console.log('PASS: Electron shell boots with achievements bridge; unlock toast delivered (' + unlocked.id + ').');
} finally {
  await app?.close().catch(() => {});
}
