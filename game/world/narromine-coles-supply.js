// Coles Narromine's stock: what households buy comes off the shelves, and trucks bring more.
// A refrigerated rigid truck arrives from the east on the Mitchell Highway before opening (the main
// delivery, all categories) and a bread-and-milk van around 11 am. Shelves are filled back to capacity;
// what is left on them at any minute is capacity minus what Narromine's households have bought since.
// Quantities are game estimates sized to the households' own weekly shops (narromine-homes.js SHOP: one person's share of a shop covering about four days), not Coles data.
import { dayPlan } from './narromine-population.js';
import { SHOP } from './narromine-homes.js';

export const COLES_STOCK = Object.freeze({
  milk: { unit: 'L', label: 'milk', perPerson: SHOP.milk }, bread: { unit: 'loaves', label: 'bread', perPerson: SHOP.bread },
  eggs: { unit: 'eggs', label: 'eggs', perPerson: SHOP.eggs }, meat: { unit: 'portions', label: 'meat', perPerson: SHOP.meat },
  veg: { unit: 'serves', label: 'vegetables', perPerson: SHOP.veg }, fruit: { unit: 'pieces', label: 'fruit', perPerson: SHOP.fruit },
  cereal: { unit: 'boxes', label: 'cereal', perPerson: SHOP.cereal },
});
export const DELIVERIES = Object.freeze([
  { id: 'main', name: 'Coles refrigerated delivery truck', arrive: 5 * 60, unload: 60, goods: Object.keys(COLES_STOCK) },
  { id: 'van', name: 'bread and milk van', arrive: 11 * 60, unload: 25, goods: ['bread', 'milk'] },
]);

export function createColesSupply(pop) {
  const cache = new Map();
  // Every household shop that day: minute it ends and the amounts bought (per-person weekly shop).
  function shops(weekday) {
    if (cache.has(weekday)) return cache.get(weekday);
    const out = [];
    for (const hh of pop.households) {
      const n = hh.members.length;
      for (const id of hh.members) {
        const p = pop.people[+id.slice(3)]; if (p.age < 18) continue;
        for (const s of dayPlan(p, hh, weekday, pop.workplaces)) if (s.kind === 'shop') out.push({ at: s.to, household: hh.id, n });
      }
    }
    out.sort((a, b) => a.at - b.at);
    cache.set(weekday, out); return out;
  }
  // Shelf capacity: a busy day's demand plus a quarter, so the shelves rarely empty.
  const capacity = {};
  for (const k of Object.keys(COLES_STOCK)) {
    let peak = 0; for (let wd = 0; wd < 7; wd++) peak = Math.max(peak, shops(wd).reduce((s, x) => s + x.n * COLES_STOCK[k].perPerson, 0));
    capacity[k] = Math.ceil(peak * 1.25);
  }
  const lastRefill = (k, minute) => { let t = -1; for (const d of DELIVERIES) if (d.goods.includes(k) && minute >= d.arrive + d.unload) t = Math.max(t, d.arrive + d.unload); return t; };
  const bought = (weekday, k, from, to) => shops(weekday).filter((x) => x.at > from && x.at <= to).reduce((s, x) => s + x.n * COLES_STOCK[k].perPerson, 0);
  // On the shelves at a minute: filled to capacity by the latest delivery, less what has been bought since.
  // Before the morning truck, it is what was left at closing the day before.
  function stockAt(weekday, minute) {
    const out = {};
    for (const k of Object.keys(COLES_STOCK)) {
      const t = lastRefill(k, minute);
      const left = t >= 0 ? capacity[k] - bought(weekday, k, t, minute) : capacity[k] - bought((weekday + 6) % 7, k, lastRefill(k, 1439), 1440);
      out[k] = Math.max(0, Math.round(left));
    }
    return out;
  }
  return { shops, capacity, stockAt, deliveries: DELIVERIES };
}
