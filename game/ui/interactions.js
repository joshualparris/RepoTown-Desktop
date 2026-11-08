// Interaction behaviours. Each returns panel content {title, body, actions}
// and may mutate per-exhibit state (counter, step, quiz answer).
// Archive behaviours are async (they load repo-data.json); callers await the result.
// `ctx.activate(key)` turns on the exhibit's animation; `ctx.toggle(key)` flips it.
import { TOYS } from './toys.js';
import { ARCHIVE } from './archive.js';
import { npcBehaviour } from './npc.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const state = new Map();
let audio = null;

function tone(notes) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audio.currentTime;
    notes.forEach((f, i) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = f; o.type = 'triangle';
      g.gain.setValueAtTime(0.0001, t0 + i * 0.22); g.gain.exponentialRampToValueAtTime(0.25, t0 + i * 0.22 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.22 + 0.4);
      o.connect(g).connect(audio.destination); o.start(t0 + i * 0.22); o.stop(t0 + i * 0.22 + 0.45);
    });
    return true;
  } catch { return false; }
}

const remember = (key, v) => { const s = state.get(key) || []; s.unshift(v); state.set(key, s.slice(0, 6)); };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const DICE = [4, 6, 8, 10, 12, 20, 100];

// Dice keep their own history; buttons re-roll, switch die, or roll with advantage.
function rollDice(x, sides, mode) {
  const r = () => 1 + Math.floor(Math.random() * sides);
  const a = r(), b = mode === 'normal' ? null : r();
  const roll = b === null ? a : mode === 'adv' ? Math.max(a, b) : Math.min(a, b);
  remember(x.key, roll);
  const crit = sides === 20 && roll === 20 ? ' <span class="crit">Natural 20!</span>' : sides === 20 && roll === 1 ? ' <span class="crit">Critical fail.</span>' : '';
  const pair = b === null ? '' : `<p class="dim">${mode === 'adv' ? 'Advantage' : 'Disadvantage'}: rolled ${a} and ${b}, kept ${roll}.</p>`;
  const actions = [{ label: `Roll d${sides} again`, run: () => rollDice(x, sides, mode) }];
  if (x.act.set) {
    for (const d of DICE) if (d !== sides) actions.push({ label: `d${d}`, run: () => rollDice(x, d, 'normal') });
    actions.push({ label: 'Advantage', run: () => rollDice(x, 20, 'adv') }, { label: 'Disadvantage', run: () => rollDice(x, 20, 'dis') });
  }
  return { title: x.act.title || x.label, body: `<p class="big">🎲 d${sides}: <strong data-result="${roll}">${roll}</strong>${crit}</p>${pair}<p>${esc(x.act.text)}</p><p class="dim">Recent: ${state.get(x.key).join(', ')}</p>`, actions: [...actions, ...linkButton(x.act.url)] };
}

const linkButton = (url, text = 'Open ↗') => (url ? [{ label: text, url }] : []);

export const BEHAVIOURS = {
  info: (x) => ({ title: x.act.title || x.label, body: `<p>${esc(x.act.text)}</p>`, actions: linkButton(x.act.url) }),
  link: (x) => ({ title: x.act.title || x.label, body: `<p>${esc(x.act.text)}</p>`, actions: linkButton(x.act.url, x.act.button || 'Open ↗') }),
  toggle: (x, ctx) => {
    const on = ctx.toggle(x.key);
    return { title: x.act.title || x.label, body: `<p>${esc(on ? x.act.on || x.act.text : x.act.off || 'Switched off.')}</p>`, actions: linkButton(x.act.url) };
  },
  play: (x) => {
    const ok = tone(x.act.notes || [262, 330, 392, 523]);
    return { title: x.act.title || x.label, body: `<p>${esc(x.act.text)}</p>${ok ? '' : '<p><em>Audio is unavailable in this browser.</em></p>'}`, actions: linkButton(x.act.url) };
  },
  dice: (x) => rollDice(x, x.act.sides || 20, 'normal'),
  coin: (x) => {
    const again = () => {
      const side = Math.random() < 0.5 ? 'Heads' : 'Tails';
      remember(x.key, side[0]);
      return { title: x.act.title || x.label, body: `<p class="big">🪙 <strong data-result="${side}">${side}</strong></p><p>${esc(x.act.text)}</p><p class="dim">Recent: ${state.get(x.key).join(' ')}</p>`, actions: [{ label: 'Flip again', run: again }, ...linkButton(x.act.url)] };
    };
    return again();
  },
  spin: (x) => {
    const opts = x.act.options || [];
    const again = () => {
      const pick = opts[Math.floor(Math.random() * opts.length)];
      return { title: x.act.title || x.label, body: `<p class="big">🎡 <strong data-result="${esc(pick)}">${esc(pick)}</strong></p><p>${esc(x.act.text)}</p><p class="dim">The wheel holds: ${opts.map(esc).join(' · ')}</p>`, actions: [{ label: 'Spin again', run: again }, ...linkButton(x.act.url)] };
    };
    return again();
  },
  draw: (x) => {
    const deck = x.act.cards || [];
    const again = () => {
      const left = state.get(x.key)?.length ? state.get(x.key) : shuffle(deck.map((_, i) => i));
      const i = left.shift(); state.set(x.key, left);
      return { title: x.act.title || x.label, body: `<p class="big">🃏 <strong data-result="${i}">${esc(deck[i])}</strong></p><p>${esc(x.act.text)}</p><p class="dim">${left.length} of ${deck.length} cards left before a reshuffle.</p>`, actions: [{ label: 'Draw another', run: again }, ...linkButton(x.act.url)] };
    };
    return again();
  },
  arcade: (x) => {
    const again = () => {
      const r = Math.random();
      const score = Math.round((r * r * 9000 + Math.random() * 1000) / 10) * 10;
      const best = Math.max(score, state.get(x.key) || 0); state.set(x.key, best);
      const msg = score >= best && score > 0 ? '🏆 New best score!' : score > 7000 ? 'So close.' : 'Game over.';
      return { title: x.act.title || x.label, body: `<p class="big">👾 Score: <strong data-result="${score}">${score}</strong></p><p>${msg} Best: ${best}</p><p>${esc(x.act.text)}</p>`, actions: [{ label: 'Play again', run: again }, ...linkButton(x.act.url)] };
    };
    return again();
  },
  game: (x) => ({
    title: x.act.title,
    body: `<p class="big">🕹 ${esc(x.act.title)}</p><p>${esc(x.act.text)}</p><p class="dim">Use ✕ Back to town (top right) to return to this room.</p>`,
    actions: [{ label: '▶ Play', play: { id: x.act.game, title: x.act.title } }],
  }),
  count: (x) => {
    const n = (state.get(x.key) || 0) + 1; state.set(x.key, n);
    return { title: x.act.title || x.label, body: `<p class="big">${esc(x.act.unit || 'Count')}: <strong data-result="${n}">${n}</strong></p><p>${esc(x.act.text)}</p>`, actions: linkButton(x.act.url) };
  },
  steps: (x) => {
    const list = x.act.steps || [];
    const i = state.has(x.key) ? (state.get(x.key) + 1) % list.length : 0; state.set(x.key, i);
    return { title: `${x.act.title || x.label} · ${i + 1}/${list.length}`, body: `<p data-result="${i}">${esc(list[i])}</p><p class="dim">Use again for the next step.</p>`, actions: linkButton(x.act.url) };
  },
  quiz: (x) => ({
    title: x.act.title || x.label,
    body: `<p>${esc(x.act.q)}</p>`,
    actions: (x.act.options || []).map((o, i) => ({ label: o, answer: i })),
    onAnswer: (i) => ({ title: x.act.title || x.label, body: `<p class="big">${i === x.act.answer ? '✅ Correct.' : '❌ Not quite.'}</p><p>${esc(x.act.explain || '')}</p>`, actions: linkButton(x.act.url), result: i === x.act.answer }),
  }),
};

Object.assign(BEHAVIOURS, ARCHIVE, TOYS, { npc: npcBehaviour });

export const BEHAVIOUR_NAMES = Object.keys(BEHAVIOURS);

export function runInteraction(x, ctx) {
  const fn = BEHAVIOURS[x.act.do];
  if (!fn) throw new Error('Unknown interaction ' + x.act.do);
  if (x.act.do !== 'toggle') ctx.activate(x.key);
  return fn(x, ctx);
}

export { esc };

