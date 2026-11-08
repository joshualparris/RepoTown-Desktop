// Repository Town desktop achievement set.
//
// Steam achievements are defined here as pure predicates over the game's
// public test API (window.__town.state() and window.__town.multiplayer()).
// The game/ snapshot is NEVER edited: the desktop shell injects a bridge
// (desktop/assets/achievements-bridge.js) that polls the API and forwards
// snapshots to this module in the main process, which evaluates progress,
// persists unlocks in Electron's userData (Steam stores its own copy once
// Steamworks is wired), and tells Steam when the real integration is live.
//
// Rules for this set (mirrors the game's accessibility-first design):
//   - every achievement is reachable in normal play, no grind walls
//   - no achievement requires multiplayer (Steam offline must work)
//   - multiplayer has its own two achievements but only needs ONE connection

'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ACHIEVEMENTS = [
  { id: 'TOWN_ARRIVAL',     name: 'Welcome to Repository Town', desc: 'Set foot in the town.', icon: 'town',   test: s => s && s.mode === 'town' },
  { id: 'HOME_VISIT',       name: 'House Call',                 desc: 'Step inside someone\u2019s house.', icon: 'house', test: s => s && s.mode === 'house' },
  { id: 'MEET_NEIGHBOUR',   name: 'Say Hello',                  desc: 'Come within talking distance of a neighbour.', icon: 'wave',   test: s => s && !!s.nearNPC },
  { id: 'STORE_KEEPER',     name: 'Shelf Stocker',              desc: 'Restock the shop shelves during a shift.', icon: 'store',  test: s => s && s.workplay && (s.workplay.store?.restocked > 0) },
  { id: 'BARISTA',          name: 'Caf\u00e9 Service',          desc: 'Serve a customer at the caf\u00e9.', icon: 'cafe',   test: s => s && s.workplay && (s.workplay.cafe?.served > 0) },
  { id: 'DISHES',           name: 'Sink Shift',                 desc: 'Wash five dishes during caf\u00e9 work.', icon: 'sink',   test: s => s && s.workplay && (s.workplay.cafe?.washed >= 5) },
  { id: 'TAKE_A_SEAT',      name: 'Park Life',                  desc: 'Take a seat somewhere in town.', icon: 'seat',   test: s => s && !!s.seated },
  { id: 'ON_THE_ROAD',      name: 'On the Road',                desc: 'Drive a vehicle.', icon: 'car',    test: s => s && !!s.driving },
  { id: 'SUNDAY_DRIVER',    name: 'Sunday Driver',              desc: 'Take a drive on a Sunday.', icon: 'sunday', test: s => s && !!s.driving && /sun/i.test(String(s.weekday || '')) },
  { id: 'SLEEP_TIGHT',      name: 'Rest Easy',                  desc: 'Sleep through the night.', icon: 'sleep',  test: s => s && s.sleeping === true },
  { id: 'DAY_TWO',          name: 'First Sunrise',              desc: 'Live to see a second day in town.', icon: 'sunrise', test: s => s && Number(s.day) >= 2 },
  { id: 'GOING_PUBLIC',     name: 'A Town With People',         desc: 'Connect to the shared town once.', icon: 'users',  test: s => s && s.multiplayer && s.multiplayer.connected === true },
  { id: 'PLAY_TOGETHER',    name: 'Grid Buddies',               desc: 'Be in the shared town with someone else.', icon: 'together', test: s => s && s.multiplayer && s.multiplayer.connected === true && Number(s.multiplayer.players) > 1 },
];

const PROGRESS_FILE = 'steam-achievements.json';

// ---- persistence (userData-scoped; no identifiers, no cloud) ----
let store = null; // Map id -> { unlockedAt: ISO }

function loadProgress(userDataPath) {
  store = new Map();
  try {
    const raw = fs.readFileSync(path.join(userDataPath, PROGRESS_FILE), 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') for (const [id, v] of Object.entries(parsed)) {
      if (typeof v?.unlockedAt === 'string') store.set(id, v);
    }
  } catch { /* first run */ }
  return store;
}

function saveProgress(userDataPath) {
  if (!store) return;
  const obj = {};
  for (const [id, v] of store) obj[id] = v;
  try { fs.mkdirSync(userDataPath, { recursive: true }); fs.writeFileSync(path.join(userDataPath, PROGRESS_FILE), JSON.stringify(obj, null, 2)); } catch { /* best-effort */ }
}

// Evaluate a snapshot; returns [{id, name, desc}] for NEWLY unlocked achievements.
function evaluate(state, multiplayerInfo, userDataPath) {
  if (!store) loadProgress(userDataPath);
  const s = { ...(state || {}) };
  if (multiplayerInfo) s.multiplayer = multiplayerInfo;
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (store.has(a.id)) continue;
    let ok = false;
    try { ok = !!a.test(s); } catch { ok = false; }
    if (ok) { store.set(a.id, { unlockedAt: new Date().toISOString() }); newly.push(a); }
  }
  if (newly.length) saveProgress(userDataPath);
  return newly;
}

function progressSummary() {
  if (!store) return { unlocked: 0, total: ACHIEVEMENTS.length };
  return { unlocked: store.size, total: ACHIEVEMENTS.length };
}

module.exports = { ACHIEVEMENTS, evaluate, loadProgress, progressSummary, PROGRESS_FILE };
