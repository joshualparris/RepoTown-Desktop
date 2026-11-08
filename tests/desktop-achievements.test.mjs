// Real Electron shell under Xvfb/Windows: verify navigation, bridge injection,
// IPC achievement unlock, local persistence and visible toast. No Steam credentials.
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const progressDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ach-e2e-'));

let app;
try {
  app = await electron.launch({
    // --no-sandbox is required on CI runners without a SUID chrome-sandbox.
    args: [root, '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    env: { ...process.env, STEAM_ACHIEVEMENTS: '1', RT_ACHIEVEMENTS_DIR: progressDir },
    timeout: 90000,
  });
  const page = await app.firstWindow({ timeout: 90000 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // Electron 45's firstWindow can initially be about:blank. Evaluating a
  // long-lived promise before game navigation caused "Execution context was
  // destroyed" on CI. Wait for the actual loaded game document first.
  await page.waitForFunction(() => window.__town?.state &&
    document.getElementById('loading')?.hidden === true, null, { timeout: 180000 });

  assert(await page.evaluate(() => !!window.__townAchievementsBridge), 'achievements bridge injected');
  assert(await page.evaluate(() => !!window.desktop &&
    typeof window.desktop.reportState === 'function' &&
    typeof window.desktop.onAchievement === 'function'), 'isolated preload bridge exposed');
  const api = await page.evaluate(() => window.desktop.achievementAPI());
  assert(Array.isArray(api) && api.length >= 13, 'achievement API returns complete list');

  // Register AFTER game navigation, but BEFORE sending the diagnostic state.
  // Driving on Sunday is chosen because it cannot be earned during startup.
  // This tests transport/persistence/toast, not whether gameplay truly drives.
  const unlocked = await page.evaluate(() => new Promise(resolve => {
    const timeout = setTimeout(() => resolve(null), 30000);
    window.desktop.onAchievement(a => {
      if (a?.id === 'SUNDAY_DRIVER') {
        clearTimeout(timeout);
        resolve(a);
      }
    });
    window.desktop.reportState({ mode: 'town', driving: true, weekday: 'Sunday' }, null);
  }));
  assert.equal(unlocked?.id, 'SUNDAY_DRIVER', 'achievement IPC delivered after synthetic diagnostic state');

  // A visible in-game toast and the saved unlockedAt value are both required.
  await page.locator('[role="status"]').filter({ hasText: 'Sunday Driver' }).waitFor({ timeout: 25000 });
  const saved = JSON.parse(fs.readFileSync(path.join(progressDir, 'steam-achievements.json'), 'utf8'));
  assert.equal(typeof saved.SUNDAY_DRIVER?.unlockedAt, 'string', 'unlock persisted to local userData');
  assert(await page.evaluate(() => !!document.querySelector('#hud')), 'HUD intact');
  assert.deepEqual(errors, [], 'uncaught page errors: ' + errors.slice(0, 3).join(' | '));
  console.log('PASS: Electron game loaded; sandbox bridge, diagnostic unlock IPC, persisted achievement and visible toast verified.');
} finally {
  await app?.close().catch(() => {});
  fs.rmSync(progressDir, { recursive: true, force: true });
}
