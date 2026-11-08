// Your bag: money, equipment you can hold (torch), food and goods, and market purchases.
import { GOODS } from '../world/life.js';
import { ITEM_TYPES, items, equip, unequip, equippedType, toggleTorch, torchLit } from '../world/inventory.js';
import { LOGS, RECIPES, BAG_SLOTS, bagUsed } from '../world/skills.js';
import { HARDWARE } from '../world/trade-education.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// lightFire(log) lights a fire where the player stands (main.js knows where that is).
export function inventoryPanel(me, { carried = null, drop = null, onChange = () => {}, lightFire = null, cook = null } = {}) {
  const panel = () => inventoryPanel(me, { carried, drop, onChange, lightFire, cook });
  const act = (label, fn) => ({ label, run: () => { const msg = fn(); onChange(); const p = panel(); p.body = `<p><b>${esc(msg)}</b></p>` + p.body; return p; } });
  const actions = [];
  const held = equippedType(me);
  const rows = items(me).map((it) => {
    const t = ITEM_TYPES[it.type], isHeld = me.equipped === it.id;
    if (isHeld) {
      actions.push(act('Put away the ' + t.name.toLowerCase(), () => unequip(me)));
      if (it.type === 'torch') actions.push(act(torchLit(me) ? 'Switch torch off (F)' : 'Switch torch on (F)', () => toggleTorch(me)));
    } else actions.push(act('Hold the ' + t.name.toLowerCase(), () => equip(me, it.id)));
    if (drop) actions.push(act('Drop the ' + t.name.toLowerCase(), () => drop(it.id)));
    return `<li>${t.icon} <b>${t.name}</b>${isHeld ? ' · in your hand' + (it.type === 'torch' ? (torchLit(me) ? ', on' : ', off') : '') : ''}<br><small>${esc(t.about)}</small></li>`;
  });
  // Logs stack in the bag; each one takes a slot.
  const logs = Object.entries(me.logs || {}).filter(([k, n]) => n > 0 && LOGS[k]).map(([k, n]) => {
    if (lightFire) actions.push(act(`🔥 Light ${LOGS[k].name.toLowerCase()} here`, () => lightFire(k)));
    return `<li>${LOGS[k].icon} ${n} × ${LOGS[k].name}</li>`;
  });
  const goods = Object.entries(me.bag || {}).filter(([, n]) => n > 0).map(([k, n]) => {
    if (cook && RECIPES[k]) actions.push(act(`🍳 Cook ${RECIPES[k].name} here`, () => cook(k)));
    return `<li>${n} × ${esc(GOODS[k]?.name || HARDWARE[k]?.name || k)}</li>`;
  });
  const market = Object.entries(me.marketGoods || {}).filter(([, n]) => n > 0).map(([k, n]) => `<li>${n} × ${esc(k)}</li>`);
  const list = (xs, empty) => xs.length ? `<ul>${xs.join('')}</ul>` : `<p><small>${empty}</small></p>`;
  return {
    title: '🎒 Your bag',
    body: `<p>💵 Wallet: $${(me.wallet || 0).toFixed(2)}${held ? ` · holding: ${ITEM_TYPES[held].icon} ${ITEM_TYPES[held].name}` : ''}${carried ? ` · carrying: ${esc(carried)}` : ''}</p>` +
      `<h3>Equipment</h3>${list(rows, 'Nothing yet. A torch is waiting at the Town Guide kiosk.')}` +
      `<h3>Logs · ${bagUsed(me)}/${BAG_SLOTS} slots</h3>${list(logs, 'None. Chop trees at the Town Woodlot with a hatchet; light them with a tinderbox.')}` +
      `<h3>Food and goods</h3>${list(goods, 'Empty. Shops and the farmers\' market sell food that goes in here.')}` +
      `<h3>From the market</h3>${list(market, 'Nothing yet. The market runs on the 1st and 3rd Saturday mornings.')}`,
    actions,
  };
}
