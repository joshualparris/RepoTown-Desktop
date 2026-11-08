// Steam achievements: definition sanity + predicate coverage against synthetic
// game states (the same shape the bridge forwards from window.__town.state()).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { ACHIEVEMENTS, evaluate, loadProgress } = require('../desktop/achievements.cjs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ach-'));

// --- definition sanity ---
assert.ok(ACHIEVEMENTS.length >= 10, 'a Steam launch wants at least 10 achievements');
const ids = new Set(ACHIEVEMENTS.map(a => a.id));
assert.equal(ids.size, ACHIEVEMENTS.length, 'achievement ids are unique');
assert.ok(ACHIEVEMENTS.every(a => /^[A-Z][A-Z0-9_]{2,40}$/.test(a.id)), 'ids are Steam-API-safe (ASCII, stable)');
assert.ok(ACHIEVEMENTS.every(a => typeof a.name === 'string' && a.name.length <= 100 && a.name.trim().length > 0), 'names present and within Steam length limits');
assert.ok(ACHIEVEMENTS.every(a => typeof a.desc === 'string' && a.desc.length > 0), 'descriptions present');
assert.ok(ACHIEVEMENTS.every(a => typeof a.test === 'function'), 'every achievement has a predicate');
const mpOnly = ACHIEVEMENTS.filter(a => a.id === 'GOING_PUBLIC' || a.id === 'PLAY_TOGETHER');
assert.equal(mpOnly.length, 2, 'exactly two multiplayer achievements');
assert.ok(ACHIEVEMENTS.length - mpOnly.length >= 10, 'at least 10 achievements reachable fully offline');

// --- predicate coverage ---
const offline = ACHIEVEMENTS.filter(a => !mpOnly.includes(a));
const unlockedOffline = new Set();
for (const a of offline) {
  // Build the minimal state that satisfies this predicate by mining the source
  // for the fields it reads - instead, feed a superset state per family.
}
const townState = { mode: 'town', sleeping: false, driving: null, seated: null, workplay: null, day: 1, weekday: 'Monday', nearNPC: null };
const fullState = {
  mode: 'house', sleeping: true, driving: 'CT-915', seated: { key: 's1' },
  workplay: { store: { restocked: 3 }, cafe: { served: 2, washed: 6 } },
  day: 2, weekday: 'Sunday', nearNPC: 'npc-nell',
};
// A fresh player with nothing done unlocks only the arrival-family achievements.
loadProgress(tmp);
const first = evaluate(townState, null, tmp);
assert(first.some(a => a.id === 'TOWN_ARRIVAL'), 'arrival unlocks from a plain town state');
assert(!first.some(a => a.id === 'HOME_VISIT'), 'house achievement not granted while in town');
// A maxed state unlocks every offline achievement.
const second = evaluate(fullState, null, tmp);
for (const a of offline) {
  assert(second.some(x => x.id === a.id) || first.some(x => x.id === a.id) || a.id === 'TOWN_ARRIVAL',
    a.id + ' unlocks from the full offline state');
}
assert(!second.some(a => mpOnly.includes(a)), 'multiplayer achievements never unlock from offline state');
// Multiplayer unlock path.
const third = evaluate(townState, { connected: true, players: 1 }, tmp);
assert(third.some(a => a.id === 'GOING_PUBLIC'), 'connection unlocks GOING_PUBLIC');
assert(!third.some(a => a.id === 'PLAY_TOGETHER'), 'solo connection does not unlock PLAY_TOGETHER');
const fourth = evaluate(townState, { connected: true, players: 2 }, tmp);
assert(fourth.some(a => a.id === 'PLAY_TOGETHER'), 'a second player unlocks PLAY_TOGETHER');
// Persistence: nothing re-unlocks.
const fifth = evaluate(fullState, { connected: true, players: 2 }, tmp);
assert.equal(fifth.length, 0, 'unlocks are persisted, not repeated');
// Malformed snapshots never throw.
assert.doesNotThrow(() => evaluate(null, null, tmp));
assert.doesNotThrow(() => evaluate({ mode: 42, workplay: 'broken' }, { connected: 'maybe' }, tmp));

// --- bridge injection only when the flag is on ---
const main = fs.readFileSync(new URL('../desktop/main.cjs', import.meta.url), 'utf8');
assert(main.includes('achievements-bridge.js'), 'main.cjs serves the achievements bridge');
assert(main.includes("STEAM_ACHIEVEMENTS!=='0'"), 'achievements can be disabled via env');
const bridge = fs.readFileSync(new URL('../desktop/assets/achievements-bridge.js', import.meta.url), 'utf8');
assert(bridge.includes('__town') && bridge.includes('reportState'), 'bridge reads the public game API and reports to main');
assert(!/require\(|import\s/.test(bridge), 'bridge is plain browser JS with no module or Node access');

// --- preload stays minimal ---
const preload = fs.readFileSync(new URL('../desktop/preload.cjs', import.meta.url), 'utf8');
assert(preload.includes('contextBridge.exposeInMainWorld'), 'preload exposes via contextBridge only');
for (const banned of ['executeJavaScript', 'nodeIntegration: true', 'require(\'child_process']) {
  assert(!preload.includes(banned), 'preload must not contain ' + banned);
}

console.log('PASS: ' + ACHIEVEMENTS.length + ' Steam achievements defined, predicates covered, offline-first, bridge injected safely.');
