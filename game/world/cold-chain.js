// Shop food that doesn't keep: daily markdown losses on perishable stock, and the cold rooms on the
// high street, which need power. Pure logic, deterministic; life.js calls in hourly and at day's end.
//
// High-street shops share the Mill and Bakery feeder (src/world/power-grid.js customer 'bakery').
// Chilled stock follows the Australian 2-hour/4-hour rule: after four hours without refrigeration
// it is unsafe and is thrown out.
import { COUNTERS } from './counter-queue.js';
import { pilotMains } from './electrical-pilot.js';
import { theName } from './shop-attendance.js';

// Share of each perishable shelf lost per day (stale, bruised or past its date). Whole units only,
// so a small shelf of two or three doesn't lose anything.
export const DAILY_LOSS = { bread: 0.15, pie: 0.25, milk: 0.05, lamb: 0.04, eggs: 0.02, veg: 0.08, fruit: 0.05 }; // soy uses labelled lots and explicit expiry
export const CHILLED = ['milk', 'oatmilk', 'soymilk', 'lamb'];
export const COLD_LIMIT = 240;   // town minutes without power before chilled stock is unsafe

const shelvesOf = (p) => [p.stock, p.out].filter(Boolean);

// Once an hour: cold rooms lose power with the bakery feeder; four hours off and chilled stock goes.
export function coldChainHour(life) {
  const legacyPowered = life.gridPowered('bakery');
  let tossed = 0;
  for (const id of COUNTERS) {
    const p = life.place(id);
    const pilot=pilotMains(life,'B:'+id);
    const powered=pilot===null?legacyPowered:pilot;
    p.coldOff = powered ? 0 : (p.coldOff || 0) + 60;
    if (p.coldOff < COLD_LIMIT) continue;
    const lost = [];
    for (const shelf of shelvesOf(p)) for (const g of CHILLED) if (shelf[g] > 0) { lost.push(`${shelf[g]} ${g}`); tossed += shelf[g]; shelf[g] = 0; }
    if (lost.length) life.log(`${theName(p, true)}'s cold room has been off for four hours: ${lost.join(' and ')} thrown out under the food-safety rule.`);
  }
  // Bottling plant's finished goods also need continuous cooling. Process rooms are
  // not part of the normal retail counter list, so handle the plant explicitly.
  const plant=life.place('soyplant');
  if(plant){
    plant.coldOff=life.gridPowered('industry')?0:(plant.coldOff||0)+60;
    if(plant.coldOff>=COLD_LIMIT&&(plant.out.soymilk||0)>0){
      const n=plant.out.soymilk;plant.out.soymilk=0;
      const soy=life.civic.soy;if(soy){soy.lots=[];soy.waste+=n;}
      tossed+=n;life.log('Plant-drink processing cooler lost power for four hours: '+n+' soy cartons disposed.');
    }
  }
  if (tossed) { life.stats.wasted = (life.stats.wasted || 0) + tossed; life.rubbish(tossed); }
  return tossed;
}

// At the end of the day: stale bread and pies, bruised fruit and veg, milk and meat at their dates.
export function shopWasteDay(life) {
  let total = 0;
  const notes = [];
  for (const id of COUNTERS) {
    const p = life.place(id);
    for (const shelf of shelvesOf(p)) for (const [g, rate] of Object.entries(DAILY_LOSS)) {
      const n = Math.floor((shelf[g] || 0) * rate);
      if (n > 0) { shelf[g] -= n; total += n; notes.push(`${n} ${g} at ${theName(p)}`); }
    }
  }
  if (total) {
    life.stats.wasted = (life.stats.wasted || 0) + total;
    life.rubbish(total);
    life.log(`Closing time: ${notes.slice(0, 3).join(', ')}${notes.length > 3 ? ' and more' : ''} went out as past their best.`);
  }
  return total;
}
