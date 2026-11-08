// The bakers' kitchen: a supervised bread batch the visitor can help run (src/world/bakery-production.js).
// It uses the bakery's real flour and adds real loaves to the sales rack; hourly baking carries on as normal.
import { bakeryInventory, superviseBread } from '../world/bakery-production.js';
import { GOODS } from '../world/life.js';
import { esc } from './interactions.js';

const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString('en-AU') : '0');
const minsLeft = (b, life) => (!b?.readyAt ? 0 : Math.max(0, Math.ceil(b.readyAt - (life.day * 1440 + life.minute))));
const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

export function bakeryKitchenPanel(life, note = '') {
  const s = bakeryInventory(life), b = s.batch;
  const stage = b ? ({
    weighed:'Ingredients weighed; mix and knead next.',mixed:'Mixed; shape eight loaves.',shaping:`Shaped ${b.shapes}/8 loaves.`,shaped:'Tray shaped; start proofing.',cooling:`Cooling (${minsLeft(b,life)} town minutes remaining); pack afterwards.`,proofing: `Dough is proofing (${minsLeft(b, life)} town minutes to go).`,
    baking: `Loaves are baking (${minsLeft(b, life)} town minutes to go).`,
    finished: b.day === life.day ? 'Eight loaves were cooled, packed and placed in saleable stock today.' : 'Yesterday\'s batch is done. You can start another.',
  }[b.phase] || 'Ready') : 'No batch started yet.';
  const roster = s.bakers.map((v) => esc(`${v.name} (${v.job}, ${clock(v.start)}–${clock(v.end)})`)).join(', ') || 'No assigned staff';
  const run = (action, where) => () => { const z = superviseBread(life, action); return bakeryKitchenPanel(life, z.message); };
  return {
    title: 'Bakery kitchen', wide: true,
    body: `${note ? `<p><b>${esc(note)}</b></p>` : ''}
      <p>The bakers let you lend a hand with a batch. Close this panel and operate the labelled mixer, deck-oven and cooling-rack stations in the 3D shop. Weigh 2000 g, mix and knead, shape eight loaves, proof for 40 town minutes, bake for 25, cool for six, then pack. Ingredients are reserved once; bread becomes saleable only after packing. Pastry hygiene rules apply: hand wash first, benches clean, ovens guarded. This is a game, not a live oven controller.</p>
      <p><b>Town time:</b> ${esc(s.time)}, day ${fmt(s.day)} · ${s.bakeryOpen ? 'shop open' : 'shop closed'} · ${s.working.length} baker(s) on shift now</p>
      <h3>What's in the bakery</h3>
      <p><b>Flour:</b> ${fmt(s.flour)} bags · <b>eggs:</b> ${fmt(s.eggs)} · <b>milk:</b> ${fmt(s.milk)} · <b>lamb:</b> ${fmt(s.meat)} · <b>veg:</b> ${fmt(s.vegetables)}</p>
      <p><b>Bread on the rack:</b> ${fmt(s.bread)} loaves at $${GOODS.bread.price} · <b>pies:</b> ${fmt(s.pies)} at $${GOODS.pie.price}</p>
      <p><b>Your batch:</b> ${esc(stage)}</p>
      <p><b>Bakers:</b> ${roster}</p>
      <p class="dim">The bakery also bakes by itself every hour while the bakers work. A hand-run batch is limited to one per town day.</p>`,
    actions: [
      {label:'Wash hands and sanitise bench',run:()=>bakeryKitchenPanel(life,superviseBread(life,'wash').message)},
      ...(!b||b.phase==='finished'?[1000,2000,3000].map(n=>({label:'Weigh '+n+' g flour',run:()=>bakeryKitchenPanel(life,superviseBread(life,'weigh',n).message)})):[]),
      ...({weighed:['mix'],mixed:['shape'],shaping:['shape'],shaped:['proof'],proofing:['oven'],baking:['unload'],cooling:['pack']}[b?.phase]||[]).map(action=>({label:action==='shape'?'Shape next loaf':action.replace('-', ' '),run:run(action)})),
    ],
  };
}
