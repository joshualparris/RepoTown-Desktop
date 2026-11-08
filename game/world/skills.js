// Skills: RuneScape-style XP and levels, woodcutting and firemaking (docs/RUNESCAPE_ROADMAP.md).
// Pure rules, no three.js. Everything lives on the player record (life.civic.player) or on
// life.civic.woodlot, so it saves and restores with the rest of the game.
//   me.skills = { woodcutting: { xp }, firemaking: { xp } }
//   me.logs   = { logs: n, oak_logs: n, willow_logs: n }
//   life.civic.woodlot = { trees: { [treeId]: { stumpUntil } }, fires: [{ id, x, z, log, until }] }
import { addItem, equip, hasItem, items } from './inventory.js';

export const SKILLS = Object.freeze({
  woodcutting: { name: 'Woodcutting', icon: '🪓', about: 'Chop trees at the Woodlot with a hatchet. Oaks need level 15, willows level 30.' },
  firemaking: { name: 'Firemaking', icon: '🔥', about: 'Light logs with a tinderbox. Better logs need a higher level and burn longer.' },
  cooking: { name: 'Cooking', icon: '🍳', about: 'Cook raw food on a fire you lit. Higher levels burn food less and unlock better meals.' },
});
export const MAX_LEVEL = 99;
export const BAG_SLOTS = 28;

// The classic curve: level L needs floor(sum over l < L of floor(l + 300·2^(l/7)) / 4) XP,
// so level 2 is 83 XP, level 15 is 2,411, level 30 is 13,363 and level 99 is 13,034,431.
const XP_TABLE = [0, 0];
for (let l = 1, points = 0; l < MAX_LEVEL; l++) { points += Math.floor(l + 300 * 2 ** (l / 7)); XP_TABLE.push(Math.floor(points / 4)); }
export const xpForLevel = (level) => XP_TABLE[Math.max(1, Math.min(MAX_LEVEL, level))];
export function levelForXp(xp) { let l = 1; while (l < MAX_LEVEL && xp >= XP_TABLE[l + 1]) l++; return l; }

export function skillState(me) {
  me.skills ??= {};
  for (const id of Object.keys(SKILLS)) if (!me.skills[id] || !Number.isFinite(me.skills[id].xp)) me.skills[id] = { xp: 0 };
  me.logs ??= {};
  return me.skills;
}
export const level = (me, skill) => levelForXp(skillState(me)[skill].xp);

// Adds XP and says so; a new level gets its own message.
export function addXp(me, skill, xp) {
  const s = skillState(me)[skill], before = levelForXp(s.xp);
  s.xp = Math.min(200_000_000, Math.round((s.xp + xp) * 10) / 10);
  const after = levelForXp(s.xp);
  return { xp, level: after, levelUp: after > before,
    message: after > before ? `🎉 ${SKILLS[skill].icon} ${SKILLS[skill].name} level ${after}!${unlockNote(skill, after, before)}` : '' };
}
function unlockNote(skill, after, before) {
  const unlocks = skill === 'woodcutting' ? Object.values(TREES)
    : skill === 'cooking' ? Object.values(RECIPES).map((r) => ({ name: r.name, level: r.level }))
    : Object.values(LOGS).map((l) => ({ name: l.name, level: l.fireLevel }));
  const verb = skill === 'woodcutting' ? 'chop' : skill === 'cooking' ? 'cook' : 'burn';
  const got = unlocks.filter((u) => u.level > before && u.level <= after).map((u) => u.name.toLowerCase());
  return got.length ? ` You can now ${verb} ${got.join(' and ')}.` : '';
}

export function skillsReport(me) {
  return Object.entries(SKILLS).map(([id, s]) => {
    const xp = skillState(me)[id].xp, lv = levelForXp(xp), next = lv < MAX_LEVEL ? xpForLevel(lv + 1) : null, from = xpForLevel(lv);
    return { id, ...s, xp, level: lv, nextXp: next, progress: next ? (xp - from) / (next - from) : 1 };
  });
}

// ── Woodcutting ──────────────────────────────────────────────────────────────
// A normal tree falls after one log; oaks and willows give several before they fall.
export const TREES = Object.freeze({
  tree: { name: 'Tree', level: 1, xp: 25, log: 'logs', fellChance: 1, respawn: 30, difficulty: 1 },
  oak: { name: 'Oak', level: 15, xp: 37.5, log: 'oak_logs', fellChance: 1 / 6, respawn: 60, difficulty: 1.6 },
  willow: { name: 'Willow', level: 30, xp: 67.5, log: 'willow_logs', fellChance: 1 / 8, respawn: 90, difficulty: 2.2 },
});
export const LOGS = Object.freeze({
  logs: { name: 'Logs', icon: '🪵', fireLevel: 1, xp: 40, burn: 30, price: 4 },
  oak_logs: { name: 'Oak logs', icon: '🪵', fireLevel: 15, xp: 60, burn: 45, price: 9 },
  willow_logs: { name: 'Willow logs', icon: '🪵', fireLevel: 30, xp: 90, burn: 60, price: 16 },
});

// ── Cooking (docs/RUNESCAPE_ROADMAP.md item 9) ───────────────────────────────
// Cook a raw bag good on a fire you lit. The raw ingredient is consumed; a bad
// roll burns it and wastes it; success turns it into a cooked meal that feeds
// the player's hunger through needs.js FOOD_ENERGY.
export const RECIPES = Object.freeze({
  lamb: { name: 'lamb', icon: '🍖', level: 1, xp: 30, burnBase: 0.30, output: 'cooked_lamb', cookedName: 'roast lamb' },
  veg: { name: 'vegetables', icon: '🥕', level: 8, xp: 40, burnBase: 0.22, output: 'cooked_veg', cookedName: 'roast vegetables' },
});
export const burnChance = (recipe, cookingLevel) => Math.min(0.9, Math.max(0.02, recipe.burnBase - (cookingLevel - 1) * 0.006));
export function canCook(me, recipeId) {
  const r = RECIPES[recipeId];
  if (!r) return 'That cannot be cooked.';
  if (level(me, 'cooking') < r.level) return `You need Cooking level ${r.level} to cook ${r.name}.`;
  if (!(me.bag?.[recipeId] > 0)) return `You have no ${r.name} to cook.`;
  return null;
}
// One attempt at a fire; the caller (main.js) first checks the player stands
// beside a live fire. Pure rules here, so it tests and saves deterministically.
export function cookFood(me, recipeId, rand = Math.random) {
  const why = canCook(me, recipeId);
  if (why) return { ok: false, message: why };
  const r = RECIPES[recipeId];
  me.bag[recipeId]--;
  if (rand() < burnChance(r, level(me, 'cooking'))) return { ok: true, burned: true, message: `You burn the ${r.name}. Try again.` };
  me.bag[r.output] = (me.bag[r.output] || 0) + 1;
  const gain = addXp(me, 'cooking', r.xp);
  return { ok: true, cooked: r.output, levelUp: gain.levelUp, message: gain.message || `You cook the ${r.name} into ${r.cookedName}. +${r.xp} Cooking XP` };
}
// Swings every 2.4 seconds, as in RuneScape; this is the chance one swing gets a log.
export const SWING_SECONDS = 2.4;
export function chopChance(lv, tree) { return Math.max(0.08, Math.min(0.9, (0.35 + (lv - tree.level) * 0.012) / tree.difficulty)); }

const nowMin = (life) => life.day * 1440 + life.minute;
export function woodlotState(life) {
  const w = (life.civic.woodlot ??= {});
  if (!w.trees || typeof w.trees !== 'object') w.trees = {};
  if (!Array.isArray(w.fires)) w.fires = [];
  return w;
}
export const isStump = (life, treeId) => (woodlotState(life).trees[treeId]?.stumpUntil || 0) > nowMin(life);
export const logCount = (me) => Object.values(me.logs || {}).reduce((n, c) => n + (c || 0), 0);
// Each tool takes a slot and each log takes a slot, as in RuneScape's 28-slot inventory.
export const bagUsed = (me) => items(me).length + logCount(me);

// Whether the player can start chopping this tree, and why not.
export function canChop(life, me, tree) {
  const t = TREES[tree.type];
  if (!hasItem(me, 'hatchet')) return 'You need a hatchet. Central West Hardware & Timber sells them.';
  if (level(me, 'woodcutting') < t.level) return `You need Woodcutting level ${t.level} to chop ${t.name === 'Oak' ? 'an oak' : 'a ' + t.name.toLowerCase()}.`;
  if (isStump(life, tree.id)) return 'Only a stump is left. It will grow back.';
  if (bagUsed(me) >= BAG_SLOTS) return `Your bag is full (${BAG_SLOTS} slots). Sell or burn some logs.`;
  return null;
}
// One swing of the hatchet. Returns { ok, log?, felled?, stop?, message, levelUp? }.
export function swing(life, me, tree, rand = Math.random) {
  const why = canChop(life, me, tree);
  if (why) return { ok: false, stop: true, message: why };
  const t = TREES[tree.type];
  if (rand() >= chopChance(level(me, 'woodcutting'), t)) return { ok: true, message: `You swing your hatchet at the ${t.name.toLowerCase()}.` };
  me.logs[t.log] = (me.logs[t.log] || 0) + 1; me.logsCut = (me.logsCut || 0) + 1;
  const gain = addXp(me, 'woodcutting', t.xp), felled = rand() < t.fellChance;
  if (felled) woodlotState(life).trees[tree.id] = { stumpUntil: nowMin(life) + t.respawn };
  const full = bagUsed(me) >= BAG_SLOTS;
  return { ok: true, log: t.log, felled, stop: felled || full, levelUp: gain.levelUp,
    message: gain.message || `You get some ${LOGS[t.log].name.toLowerCase()}. +${t.xp} Woodcutting XP${felled ? ' — the tree falls.' : ''}${full ? ' Your bag is full.' : ''}` };
}

// ── Firemaking ───────────────────────────────────────────────────────────────
export function canLight(me, log) {
  const l = LOGS[log];
  if (!l) return 'Those will not burn.';
  if (!hasItem(me, 'tinderbox')) return 'You need a tinderbox. Central West Hardware & Timber sells them.';
  if (!(me.logs?.[log] > 0)) return `You have no ${l.name.toLowerCase()}.`;
  if (level(me, 'firemaking') < l.fireLevel) return `You need Firemaking level ${l.fireLevel} to burn ${l.name.toLowerCase()}.`;
  return null;
}
// One try with the tinderbox; a fire lasts `burn` town minutes where you stand.
export function lightFire(life, me, log, at, rand = Math.random) {
  const why = canLight(me, log);
  if (why) return { ok: false, message: why };
  const l = LOGS[log];
  if (rand() >= Math.min(0.95, 0.55 + level(me, 'firemaking') * 0.012)) return { ok: true, lit: false, message: 'You strike the tinderbox, but the logs do not catch. Try again.' };
  me.logs[log]--;
  const w = woodlotState(life), fire = { id: (w.nextFire = (w.nextFire || 0) + 1), x: at.x, z: at.z, log, until: nowMin(life) + l.burn };
  w.fires.push(fire);
  const gain = addXp(me, 'firemaking', l.xp);
  return { ok: true, lit: true, fire, levelUp: gain.levelUp, message: gain.message || `The ${l.name.toLowerCase()} catch and burn. +${l.xp} Firemaking XP` };
}
export function liveFires(life) {
  const w = woodlotState(life), t = nowMin(life);
  w.fires = w.fires.filter((f) => f.until > t);
  return w.fires;
}

// ── The timber yard at Central West Hardware & Timber ───────────────────────────
export const TOOLS = Object.freeze({ hatchet: { price: 25 }, tinderbox: { price: 6 } });
export function buyTool(me, tool, till) {
  if (!TOOLS[tool]) return { ok: false, message: 'Not sold here.' };
  if (hasItem(me, tool)) return { ok: false, message: `You already have a ${tool}.` };
  if ((me.wallet || 0) < TOOLS[tool].price) return { ok: false, message: `A ${tool} costs $${TOOLS[tool].price}; you have $${(me.wallet || 0).toFixed(2)}.` };
  if (bagUsed(me) >= BAG_SLOTS) return { ok: false, message: 'Your bag is full.' };
  me.wallet = Math.round((me.wallet - TOOLS[tool].price) * 100) / 100;
  addItem(me, tool);
  till.cash = Math.round((till.cash + TOOLS[tool].price) * 100) / 100;
  return { ok: true, message: `You buy a ${tool} for $${TOOLS[tool].price}.` };
}
// The Woodlot tool rack, like the starter-tool spawns in Lumbridge: a free hatchet and
// tinderbox for anyone who has none, at any hour, so woodcutting never waits for a shop.
// Tools only, never money; one of each per player, so the rack can't be farmed for resale.
export function takeRackTools(me) {
  const got = [];
  for (const tool of ['hatchet', 'tinderbox']) {
    if (hasItem(me, tool)) continue;
    if (bagUsed(me) >= BAG_SLOTS) return { ok: false, message: got.length ? `You take a ${got[0]}, but your bag is full.` : 'Your bag is full.' };
    const id = addItem(me, tool); got.push(tool);
    if (tool === 'hatchet') equip(me, id);
  }
  if (!got.length) return { ok: false, message: 'You already have a hatchet and a tinderbox. The rack is for anyone without.' };
  return { ok: true, message: `You take ${got.map((t) => 'a ' + t).join(' and ')} from the Woodlot rack.${got.includes('hatchet') ? ' Hatchet in hand: walk up to a tree and chop.' : ''}` };
}
// The yard buys logs out of its own till: money moves, it is never created.
export function sellLogs(me, log, till) {
  const n = me.logs?.[log] || 0, l = LOGS[log];
  if (!l || !n) return { ok: false, message: 'You have none of those to sell.' };
  const can = Math.min(n, Math.floor((till.cash || 0) / l.price));
  if (!can) return { ok: false, message: 'The timber yard cannot afford to buy logs right now.' };
  me.logs[log] -= can; me.logsSold = (me.logsSold || 0) + can;
  const paid = can * l.price;
  me.wallet = Math.round(((me.wallet || 0) + paid) * 100) / 100;
  till.cash = Math.round((till.cash - paid) * 100) / 100;
  return { ok: true, message: `The timber yard buys ${can} ${l.name.toLowerCase()} for $${paid}.` };
}
