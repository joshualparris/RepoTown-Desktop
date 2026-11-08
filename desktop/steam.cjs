// Optional Steamworks integration for the desktop shell.
//
// steamworks.js is deliberately NOT a dependency of this repo: it ships a
// native module tied to Electron's ABI, and nothing here may require a paid
// Steam account or signing step to build. When Josh runs the real Steam
// onboarding (docs/STEAMWORKS_ONBOARDING.md):
//   1. npm i steamworks.js
//   2. put the App ID in steam_appid.txt next to the game exe (or app root)
//   3. rebuild native deps for Electron (electron-builder does this)
// Achievements then light up automatically - no code changes needed.
// Until then every call below is a safe offline no-op that logs its state.

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const log = (m) => console.log(new Date().toISOString() + ' ' + m);

let steamworks = null; // loaded module when available
let session = null;    // init() result when Steam is running and authorised
let lastError = null;
let appId = null;

function candidateAppIdPaths(app) {
  const exeDir = app ? path.dirname(app.getPath('exe')) : process.cwd();
  const roots = app ? [app.getAppPath(), app.isPackaged ? path.dirname(exeDir) : process.cwd(), exeDir] : [process.cwd()];
  const names = ['steam_appid.txt'];
  const paths = [];
  for (const root of roots) for (const name of names) paths.push(path.join(root, name));
  // Also accept an explicit env override (CI can inject without writing files).
  if (process.env.STEAM_APP_ID && /^\d{1,10}$/.test(process.env.STEAM_APP_ID)) return { env: process.env.STEAM_APP_ID, paths };
  return { env: null, paths };
}

function detectAppId(app) {
  const { env, paths } = candidateAppIdPaths(app);
  if (env) return env;
  for (const p of paths) {
    try {
      const txt = fs.readFileSync(p, 'utf8').trim();
      if (/^\d{1,10}$/.test(txt)) return txt;
    } catch { /* not present - fine */ }
  }
  return null;
}

function init(app) {
  if (session || lastError) return status();
  appId = detectAppId(app);
  try {
    steamworks = require('steamworks.js');
  } catch (e) {
    lastError = 'steamworks.js not installed (expected until Steam onboarding): ' + e.code;
    log('[steam] ' + lastError);
    return status();
  }
  if (!appId) {
    lastError = 'steamworks.js installed but no steam_appid.txt found';
    log('[steam] ' + lastError);
    return status();
  }
  try {
    session = steamworks.init(appId);
    log('[steam] Steamworks initialised (app ' + appId + ')');
  } catch (e) {
    lastError = 'Steamworks init failed (is the Steam client running?): ' + e.message;
    log('[steam] ' + lastError);
  }
  return status();
}

function status() {
  return { available: !!session, appId, error: lastError };
}

// Returns true when the achievement was actually submitted to Steam.
function unlock(id) {
  if (!session) return false;
  try {
    steamworks.activateAchievement(id); // steamworks.js API: idempotent server-side
    return true;
  } catch (e) {
    log('[steam] activateAchievement(' + id + ') failed: ' + e.message);
    return false;
  }
}

function shutdown() {
  if (!session) return;
  try { steamworks.shutdown(); } catch { /* ignore */ }
  session = null;
}

module.exports = { init, status, unlock, shutdown, detectAppId };
