// Local-first social simulation for the walking villagers.
// Relationships are deliberately small and explainable: a seeded starting score,
// a bounded event log, and player actions that nudge the score over time.
import { VILLAGER_NAMES } from '../world/life.js';

const KEY = 'repository-town.social.v1';
const VILLAGERS = VILLAGER_NAMES;

const hash = (text) => [...String(text)].reduce((n, c) => ((n * 31) + c.charCodeAt(0)) >>> 0, 17);
const pairKey = (a, b) => [String(a), String(b)].sort().join('|');
const clamp = (n, min = -100, max = 100) => Math.max(min, Math.min(max, Math.round(n)));
const cleanName = (name) => String(name || '').replace(/[^A-Za-z -]/g, '').trim().slice(0, 40);

function initialScore(a, b) {
  const n = hash(pairKey(a, b)) % 100;
  if (n < 16) return -42 + (hash(a + b) % 13); // old grudges
  if (n < 48) return -12 + (hash(b + a) % 25); // uncertain neighbours
  return 34 + (hash(a + b + 'friends') % 26); // established affection
}

export function relationshipLabel(score) {
  return score >= 30 ? 'friend' : score <= -30 ? 'enemy' : 'neutral';
}

export function emptySocialState() {
  return { version: 1, relations: {}, playerTrust: {}, events: [] };
}

export function readSocial() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.version === 1 && raw.relations && raw.playerTrust && Array.isArray(raw.events)) return raw;
  } catch { /* private mode or malformed old state */ }
  return emptySocialState();
}

export function writeSocial(state) {
  const clean = {
    version: 1,
    relations: state.relations || {},
    playerTrust: state.playerTrust || {},
    events: (state.events || []).slice(-80),
  };
  try { localStorage.setItem(KEY, JSON.stringify(clean)); } catch { /* private mode */ }
  return clean;
}

function ensurePair(state, a, b) {
  if (!a || !b || a === b) return null;
  const key = pairKey(a, b);
  if (!Number.isFinite(state.relations[key])) state.relations[key] = initialScore(a, b);
  return key;
}

export function getRelationship(a, b, state = readSocial()) {
  const key = ensurePair(state, a, b);
  return key ? { score: state.relations[key], status: relationshipLabel(state.relations[key]) } : { score: 0, status: 'neutral' };
}

export function changeRelationship(a, b, delta, reason = 'a town moment', state = readSocial()) {
  const key = ensurePair(state, a, b);
  if (!key) return state;
  const before = state.relations[key];
  state.relations[key] = clamp(before + Number(delta || 0));
  state.events.push({ type: 'relationship', from: a, to: b, delta: clamp(state.relations[key] - before), reason: String(reason).slice(0, 140), at: Date.now() });
  return writeSocial(state);
}

export function changePlayerTrust(actor, delta, reason = 'a conversation', state = readSocial()) {
  const name = cleanName(actor);
  if (!name) return state;
  state.playerTrust[name] = clamp((state.playerTrust[name] || 0) + Number(delta || 0));
  state.events.push({ type: 'player', actor: name, delta: clamp(Number(delta || 0)), reason: String(reason).slice(0, 140), at: Date.now() });
  return writeSocial(state);
}

export function relationshipSummary(actor, state = readSocial()) {
  const rows = VILLAGERS.filter((name) => name !== actor).map((name) => ({ name, ...getRelationship(actor, name, state) }));
  return rows.sort((a, b) => b.score - a.score);
}

export function strongestRelationship(actor, state = readSocial()) {
  return relationshipSummary(actor, state)[0] || null;
}

export function socialGossip(actor, state = readSocial()) {
  const rows = relationshipSummary(actor, state);
  if (!rows.length) return 'The town is quiet today.';
  const friend = rows.find((r) => r.status === 'friend');
  const enemy = rows.find((r) => r.status === 'enemy');
  const neutral = rows.find((r) => r.status === 'neutral');
  if (friend && enemy) return `I've been getting on well with ${friend.name} lately, but ${enemy.name} and I still have an old score to settle. Ask me another day and I may tell you why.`;
  if (friend) return `${friend.name} is a good sort. We don't agree on everything, but they show up when it matters.`;
  if (enemy) return `Between us, ${enemy.name} and I are not exactly close. I would rather you heard both sides before taking anyone's word for it.`;
  return `${neutral?.name || rows[0].name} and I are still feeling each other out. That is how a town works sometimes.`;
}

export function socialContext(actor, state = readSocial()) {
  const rows = relationshipSummary(actor, state);
  const trust = state.playerTrust?.[actor] || 0;
  const friend = rows.find((r) => r.status === 'friend');
  const enemy = rows.find((r) => r.status === 'enemy');
  return {
    trust,
    friend: friend ? `${friend.name} (${friend.score})` : '',
    enemy: enemy ? `${enemy.name} (${enemy.score})` : '',
    gossip: socialGossip(actor, state),
    statuses: rows.slice(0, 5).map((r) => `${r.name}: ${r.status} (${r.score})`).join(', '),
  };
}

export function recordPlayerMessage(actor, message, state = readSocial()) {
  const text = String(message || '').toLowerCase();
  const names = VILLAGERS.filter((name) => name !== actor && text.includes(name.toLowerCase()));
  const positive = /\b(like|love|admire|trust|agree|brilliant|great|kind|helpful|friend)\b/.test(text);
  const negative = /\b(hate|dislike|awful|liar|annoying|enemy|rude|wrong|betray)\b/.test(text);
  if (names.length && (positive || negative)) {
    for (const target of names) changeRelationship(actor, target, positive ? 7 : -8, `the player spoke ${positive ? 'warmly' : 'harshly'} about ${target}`, state);
    changePlayerTrust(actor, positive ? 2 : -1, 'the player took a side in village gossip', state);
  } else if (/\b(thank|thanks|sorry|you helped|good job|i trust you)\b/.test(text)) {
    changePlayerTrust(actor, 4, 'the player showed appreciation', state);
  } else if (/\b(shut up|go away|hate you|leave me alone)\b/.test(text)) {
    changePlayerTrust(actor, -7, 'the player was hostile', state);
  }
  return state;
}

export function recordTownAction(actor, action, target = '', state = readSocial()) {
  const targetName = cleanName(target);
  if (action === 'completed errand' && targetName) {
    changeRelationship(actor, targetName, 6, `${actor} helped with an errand`, state);
    changePlayerTrust(actor, 5, 'the player followed through on an errand', state);
  }
  if (action === 'solved relic') changePlayerTrust(actor, 3, 'the player solved a Guild relic', state);
  return state;
}

export function villagerNames() { return [...VILLAGERS]; }
