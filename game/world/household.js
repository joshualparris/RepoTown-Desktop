import { pilotMains } from './electrical-pilot.js';

// Villager households: what each home holds and how the people in it live there. Pure logic, no
// three.js, deterministic (no Math.random or wall clock). life.js calls in from its hourly step,
// its daily close and the villagers' plans; townpanels and the house interiors read the results.
//
// One owner for each piece of home state, kept on the villager:
//   v.larder     food in the pantry, fridge and freezer, as batches that age and spoil
//   v.household  tenure and housing payments, metered power and water, bills, budget, inbox,
//                chores (dishes, laundry, lawn, garden, mailbox) and the home's climate
// Figures are fictional Town Dollars and abstract units for a 24-minute game day.

const DAY = 24 * 60;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const r2 = (n) => Math.round(n * 100) / 100;
export const now = (life) => life.day * DAY + life.minute;

// ── Seasons and weather ──────────────────────────────────────────────────────
// A town year is four seven-day seasons, starting in spring (the game opens in October).
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const season = (day) => SEASONS[Math.floor(((day - 1) % 28) / 7)];
// Inland New South Wales: hot summer afternoons, frosty winter mornings. Coldest near 5am, warmest at 3pm.
const CLIMATE = { spring: [18, 7], summer: [26, 8], autumn: [17, 7], winter: [9, 7] };
const WEATHER_SHIFT = { sunny: 2, cloudy: -1, windy: 0, rainy: -3 };   // inland hot days come with hot, gusty winds
export function outdoorTemp(day, minute, weather = 'sunny') {
  const [mean, swing] = CLIMATE[season(day)], h = minute / 60;
  const spell = ((day * 37) % 7) - 3;   // each day a little warmer or cooler than the season's average
  return Math.round((mean + spell + swing * Math.cos(((h - 15) / 24) * 2 * Math.PI) + (WEATHER_SHIFT[weather] || 0)) * 10) / 10;
}

// Australian Fire Danger Rating System levels (Moderate, High, Extreme, Catastrophic; "No rating" on
// low-risk days), from the day's hottest temperature and the weather. A town stand-in for the Bureau's
// forecast, not a real calculation: hot and windy is the dangerous combination.
export const FIRE_DANGER = ['No rating', 'Moderate', 'High', 'Extreme', 'Catastrophic'];
export function fireDanger(day, weather = 'sunny') {
  const peak = outdoorTemp(day, 15 * 60, weather);
  if (weather === 'rainy' || peak < 18) return { level: 0, name: FIRE_DANGER[0], peak };
  const wind = weather === 'windy';
  const level = peak >= 40 && wind ? 4 : (peak >= 35 && wind) || peak >= 40 ? 3 : (peak >= 30 && wind) || peak >= 33 ? 2 : 1;
  return { level, name: FIRE_DANGER[level], peak };
}

// ── Food storage ─────────────────────────────────────────────────────────────
// Shelf life in town minutes for each place a food can be kept. Missing entries mean "don't keep it there".
const SHELF = {
  bread: { pantry: 4 * DAY, fridge: 6 * DAY, freezer: 40 * DAY },
  pie: { pantry: 0.5 * DAY, fridge: 3 * DAY, freezer: 40 * DAY },
  milk: { pantry: 0.25 * DAY, fridge: 8 * DAY },
  eggs: { pantry: 10 * DAY, fridge: 28 * DAY },
  veg: { pantry: 3 * DAY, fridge: 9 * DAY, freezer: 60 * DAY },
  fruit: { pantry: 6 * DAY, fridge: 14 * DAY },
  lamb: { pantry: 0.15 * DAY, fridge: 4 * DAY, freezer: 90 * DAY },
};
// Chilled foods follow the Australian 2-hour/4-hour rule: four hours without a working fridge and out they go.
const CHILLED = new Set(['milk', 'lamb', 'pie']);
const HOME_STORE = { bread: 'pantry', fruit: 'pantry', milk: 'fridge', eggs: 'fridge', veg: 'fridge', lamb: 'fridge', pie: 'fridge' };
const FRIDGE_KEEP = { lamb: 1, bread: 3 };   // more than this goes in the freezer
export const PERISHABLES = Object.keys(SHELF);

const batch = (g, n, store, wear = 0) => ({ g, n, store, wear: Math.round(wear * 1e4) / 1e4 });

// Turns the old pantry counts (saves before households existed) into dated batches.
export function larderFrom(counts) {
  if (Array.isArray(counts)) return counts.filter((b) => b && SHELF[b.g] && b.n > 0 && SHELF[b.g][b.store]).map((b) => batch(b.g, Math.floor(b.n), b.store, clamp(Number(b.wear) || 0, 0, 0.99)));
  return Object.entries(counts || {}).filter(([g, n]) => SHELF[g] && n > 0).map(([g, n], i) => batch(g, Math.floor(n), HOME_STORE[g], 0.1 + i * 0.05));
}

// Food that can be eaten now: frozen meat must thaw first.
export const foodCount = (v, g) => v.larder.reduce((n, b) => n + (b.g === g && !(b.store === 'freezer' && g === 'lamb') ? b.n : 0), 0);
export const heldCount = (v, g) => v.larder.reduce((n, b) => n + (b.g === g ? b.n : 0), 0);
export const hasFood = (v, need) => Object.entries(need || {}).every(([g, n]) => foodCount(v, g) >= n);

// Uses the oldest usable food first.
export function takeFood(v, need) {
  for (const [g, n0] of Object.entries(need || {})) {
    let n = n0;
    const usable = v.larder.filter((b) => b.g === g && !(b.store === 'freezer' && g === 'lamb')).sort((a, b) => b.wear - a.wear);
    for (const b of usable) { const t = Math.min(n, b.n); b.n -= t; n -= t; if (!n) break; }
  }
  v.larder.splice(0,v.larder.length,...v.larder.filter((b) => b.n > 0));
}

// Unpacks shopping: chilled things in the fridge, bulk meat and spare bread in the freezer.
export function stowFood(v, bag) {
  for (const [g, n] of Object.entries(bag || {})) {
    if (!SHELF[g] || !(n > 0)) continue;
    let left = n;
    const keep = FRIDGE_KEEP[g];
    if (keep !== undefined && HOME_STORE[g] !== 'freezer') {
      const room = Math.max(0, keep - v.larder.filter((b) => b.g === g && b.store !== 'freezer').reduce((s, b) => s + b.n, 0));
      if (room > 0) { const t = Math.min(room, left); v.larder.push(batch(g, t, HOME_STORE[g])); left -= t; }
      if (left > 0) v.larder.push(batch(g, left, 'freezer'));
    } else v.larder.push(batch(g, left, HOME_STORE[g]));
  }
}

const STORE_NAME = { pantry: 'pantry', fridge: 'fridge', freezer: 'freezer' };
const UNIT = { bread: ['loaf', 'loaves'], pie: ['pie', 'pies'], milk: ['litre of milk', 'litres of milk'], eggs: ['half-dozen eggs', 'half-dozen eggs'], veg: ['bag of vegies', 'bags of vegies'], fruit: ['bag of fruit', 'bags of fruit'], lamb: ['kilo of lamb', 'kilos of lamb'] };
const say = (g, n) => `${n} ${UNIT[g][n === 1 ? 0 : 1]}`;
export function larderLines(v) {
  return ['fridge', 'freezer', 'pantry'].map((s) => {
    // Batches of the same food in the same state read as one line.
    const lines = new Map();
    for (const b of v.larder.filter((x) => x.store === s).sort((a, b) => b.wear - a.wear)) {
      const state = b.wear > 0.8 ? 'use today' : b.wear > 0.55 ? 'use soon' : 'fresh', key = b.g + state;
      lines.set(key, { good: b.g, state, n: (lines.get(key)?.n || 0) + b.n });
    }
    return { store: s, items: [...lines.values()].map((i) => ({ ...i, text: say(i.good, i.n) })) };
  });
}
export function larderSummary(v) {
  const parts = [];
  for (const s of larderLines(v)) for (const i of s.items) parts.push(`${i.text} in the ${STORE_NAME[s.store]}${i.state === 'fresh' ? '' : ' (' + i.state + ')'}`);
  return parts.join(', ') || 'nothing much';
}

// ── Appliances ───────────────────────────────────────────────────────────────
// Every villager home has the lot; the house interiors show them and these figures run them.
export const APPLIANCES = [
  ['fridge', 'Fridge', 'kitchen'], ['freezer', 'Chest freezer', 'laundry'], ['pantry', 'Pantry', 'kitchen'],
  ['oven', 'Oven and cooktop', 'kitchen'], ['sink', 'Kitchen sink and mixer tap', 'kitchen'], ['crockery', 'Plates, bowls and cutlery', 'kitchen'],
  ['shower', 'Shower', 'bathroom'], ['toilet', 'Toilet', 'bathroom'], ['basin', 'Bathroom basin', 'bathroom'],
  ['washer', 'Washing machine', 'laundry'], ['clothesline', 'Clothesline', 'yard'], ['hotwater', 'Electric hot-water system', 'laundry'],
  ['couch', 'Couch', 'living'], ['tv', 'Television', 'living'], ['aircon', 'Reverse-cycle air conditioner (heats and cools)', 'living'],
  ['computer', 'Home computer (banking and email)', 'study'], ['bed', 'Bed', 'bedroom'], ['lights', 'Lights and light switches', 'every room'],
  ['switchboard', 'Meter box and switchboard', 'outside'], ['mailbox', 'Letterbox', 'front fence'], ['garden', 'Garden beds', 'yard'],
  ['sprinkler', 'Garden sprinkler on a timer', 'yard'], ['mower', 'Lawn mower', 'shed'], ['shed', 'Garden shed', 'yard'],
];
// Abstract power units an hour, and water units per use.
const POWER = { fridge: 0.08, freezer: 0.06, lights: 0.12, oven: 0.5, climate: 0.45, tv: 0.08, computer: 0.06, washer: 0.25, hotwater: 0.3 };
const WATER = { shower: 0.35, washer: 0.3, dishes: 0.08, cook: 0.05, toilet: 0.03, sprinkler: 0.5, hose: 0.3 };
export const TARIFF = { power: 0.4, water: 0.5 };     // dollars per unit, billed weekly by the council
const COMFORT = { low: 17, high: 26 };

// ── Money at home ────────────────────────────────────────────────────────────
export const HOUSING = { rent: 8, repayment: 8, mortgageRate: 0.0015, billDays: 7, payWithin: 4, lateFee: 1, inboxMax: 16 };
const OWNERS = new Set(['retired']);
const BUYERS = new Set(['programmer', 'mayor', 'nurse', 'teacher', 'bank teller', 'station master', 'power operator', 'publican', 'butcher', 'baker', 'miller']);
function tenureFor(v) {
  if (OWNERS.has(v.job)) return 'owned';
  if (v.job === 'student') return 'rent';
  if (BUYERS.has(v.job)) return 'mortgage';
  return v.id % 3 === 0 ? 'mortgage' : 'rent';
}

export function freshHousehold(v) {
  const tenure = tenureFor(v);
  return {
    tenure,
    mortgage: tenure === 'mortgage' ? { balance: 900 + (v.id * 37) % 600, repaid: 0 } : null,
    meter: { power: 0, water: 0 }, usage: { power: 0, water: 0 }, bills: [], seq: 0,
    budget: null, income: [], spent: { food: 0, out: 0 }, inbox: [], lastFinance: 0,
    dishes: 0, laundry: 2 + (v.id % 3), lawn: 3 + (v.id % 5), garden: 70, mail: 0,
    indoor: 20, climate: 'off', lights: false, fridgeOff: 0, threwOut: 0,
  };
}

// Restores or creates both owners of home state on a villager, accepting older saves.
export function ensureHousehold(v) {
  if (!Array.isArray(v.larder)) v.larder = larderFrom(v.larder || v.pantry);
  delete v.pantry;
  if (v.household?.ready) return v.household;
  // First call, or a household restored from a save: fill in anything missing, in place.
  const base = freshHousehold(v), h = v.household && typeof v.household === 'object' ? v.household : {};
  for (const [k, val] of Object.entries(base)) if (h[k] === undefined || (Array.isArray(val) && !Array.isArray(h[k]))) h[k] = val;
  for (const k of ['meter', 'usage', 'spent']) h[k] = { ...base[k], ...(h[k] && typeof h[k] === 'object' ? h[k] : {}) };
  Object.defineProperty(h, 'ready', { value: true, enumerable: false });
  v.household = h;
  return h;
}

export function mail(life, v, from, subject, body, extra = {}) {
  const h = v.household;
  h.inbox.unshift({ id: ++h.seq, day: life.day, time: fmt(life.minute), from, subject, body, read: false, ...extra });
  if (h.inbox.length > HOUSING.inboxMax) h.inbox.length = HOUSING.inboxMax;
}
const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

// Wages land in the household's books and as a payslip email.
export function noteIncome(life, v, gross, tax) {
  const h = v.household; if (!h || !(gross > 0)) return;
  h.income.unshift({ day: life.day, amount: r2(gross - tax) });
  if (h.income.length > 14) h.income.length = 14;
  mail(life, v, v.work === 'home' ? 'Client accounts' : 'Payroll', `Payslip for Day ${life.day}`, `Gross $${r2(gross)}, PAYG tax $${tax}, paid to you $${r2(gross - tax)}.`, { kind: 'payslip' });
}
// Shopping and eating out count against the week's budget.
export function noteSpend(v, kind, amount) { if (v.household && amount > 0) v.household.spent[kind] = r2((v.household.spent[kind] || 0) + amount); }
// Whether this week's budget still has room for a meal out (no budget yet means no limit).
export function canAfford(v, kind, amount) {
  const b = v.household?.budget; if (!b) return true;
  return (v.household.spent[kind] || 0) + amount <= b[kind] + 0.01;
}

// Takes a payment from the wallet, then the savings account. Returns what was paid.
function payFrom(v, amount) {
  let paid = 0;
  for (const pot of ['wallet', 'savings']) {
    const take = Math.min(amount - paid, Math.max(0, Math.floor((v[pot] || 0) * 100) / 100));
    if (take > 0) { v[pot] = r2((v[pot] || 0) - take); paid = r2(paid + take); }
  }
  return paid;
}

// Shared spouses contribute to one home's bills, without merging their personal wallets.
function payHomeFrom(life,v,amount){
 const members=(life.villagers||[]).filter(p=>p.home?.coordinate===v.home?.coordinate&&p.household===v.household);
 if(members.length<2)return payFrom(v,amount);
 let paid=0;const share=amount/members.length;
 for(const p of members)paid=r2(paid+payFrom(p,share));
 for(const p of members)if(paid<amount)paid=r2(paid+payFrom(p,r2(amount-paid)));
 return paid;
}

// Daily housing payment (direct debit): rent to the council's housing office, or the mortgage
// repayment to the Community Bank. Returns { council, bank } amounts paid for the town's books.
export function payHousing(life, v) {
  const h = ensureHousehold(v), out = { council: 0, bank: 0, owed: 0, rentPaid: 0 };
  if (h.tenure === 'owned' && !(v.housingArrears > 0)) return out;
  const m = h.mortgage, base = h.tenure === 'rent' ? HOUSING.rent : m ? Math.min(HOUSING.repayment, r2(m.balance * (1 + HOUSING.mortgageRate))) : 0;
  const due = r2(base + (v.housingArrears || 0));
  if (!(due > 0)) return out;
  const paid = payHomeFrom(life,v,due);
  if (!m) { out.council = paid; if(h.tenure==='rent')out.rentPaid=Math.min(paid,HOUSING.rent+(v.housingArrears||0)); }
  else {
    out.bank = paid;
    const interest = r2(m.balance * HOUSING.mortgageRate);
    m.balance = r2(Math.max(0, m.balance + interest - paid)); m.repaid = r2(m.repaid + paid);
    if (m.balance === 0) { h.tenure = 'owned'; h.mortgage = null; mail(life, v, 'Community Bank', 'Your home loan is paid off', 'Congratulations — the house is yours. No more repayments.', { kind: 'bank' }); }
  }
  out.owed = r2(due - paid);
  if (out.owed > 0) mail(life, v, h.tenure === 'rent' ? 'Council housing office' : 'Community Bank', h.tenure === 'rent' ? 'Rent payment short' : 'Missed home-loan repayment', `We could only collect $${paid} of $${due} today. Please top up your account.`, { kind: 'notice' });
  return out;
}

// Weekly metered power and water bill, emailed and due within four days.
function issueBill(life, v) {
  const h = v.household;
  const power = r2(h.meter.power * TARIFF.power), water = r2(h.meter.water * TARIFF.water);
  const amount = Math.ceil((power + water) * 100) / 100;
  if (amount <= 0) return;
  const bill = { id: ++h.seq, day: life.day, power: r2(h.meter.power), water: r2(h.meter.water), amount, due: life.day + HOUSING.payWithin, paid: false };
  h.bills.push(bill); if (h.bills.length > 8) h.bills.shift();
  h.meter = { power: 0, water: 0 };
  mail(life, v, 'Town Council utilities', `Power and water bill: $${amount}`, `Power ${bill.power} units ($${power}), water ${bill.water} units ($${water}). Please pay by Day ${bill.due}.`, { kind: 'bill', bill: bill.id });
}

// Pays bills that are due (at the computer, or by direct debit once overdue). Returns dollars paid to the council.
function settleBills(life, v, late) {
  let toCouncil = 0;
  for (const b of v.household.bills) {
    if (b.paid || (late && life.day <= b.due)) continue;
    const amount = r2(b.amount + (late ? HOUSING.lateFee : 0)), paid = payHomeFrom(life,v,amount);
    toCouncil = r2(toCouncil + paid);
    if (paid >= amount) { b.paid = true; if (late) mail(life, v, 'Town Council utilities', 'Overdue bill collected', `Bill ${b.id} was overdue, so $${amount} (with a $${HOUSING.lateFee} late fee) was taken by direct debit.`, { kind: 'notice' }); }
    else { b.amount = r2(amount - paid); }
  }
  return toCouncil;
}

// Daily close for one household: housing payment, weekly bill, overdue collection, fresh laundry.
export function householdDay(life, v) {
  const h = ensureHousehold(v);
  const out = payHousing(life, v);
  if (life.day % HOUSING.billDays === 0) issueBill(life, v);
  out.council = r2(out.council + settleBills(life, v, true));
  h.laundry += 2;
  h.lawn += { spring: 3, summer: 2, autumn: 1.5, winter: 0.5 }[season(life.day)] * (h.garden > 40 ? 1 : 0.5);
  if (life.day % 7 === 1) h.spent = { food: 0, out: 0 };    // budgets run Monday to Sunday
  return out;
}

// A session at the home computer: read email, pay what's owing, set the week's budget.
export function doFinances(life, v) {
  const h = ensureHousehold(v);
  const paid = settleBills(life, v, false);
  const week = h.income.filter((x) => x.day > life.day - 7).reduce((n, x) => n + x.amount, 0);
  const income = week > 0 ? week : 60;
  const housing = h.tenure === 'rent' ? HOUSING.rent * 7 : h.tenure === 'mortgage' ? HOUSING.repayment * 7 : 0;
  const utilities = h.bills.length ? h.bills[h.bills.length - 1].amount : 18;
  const rates = 15 * 7;
  const food = Math.max(35, Math.round(income * 0.22));
  const free = Math.max(0, income - housing - utilities - rates - food);
  // Eating out comes from what's left over, plus a little of any savings cushion.
  const cushion = Math.max(0, (v.wallet || 0) + (v.savings || 0) - 200);
  const out = Math.round(Math.max(free * 0.6, income * 0.15) + cushion * 0.1);
  h.budget = { week: Math.ceil(life.day / 7), income: Math.round(income), housing, utilities: Math.round(utilities), rates, food, out, savings: Math.max(0, Math.round(free - out)) };
  for (const m of h.inbox) m.read = true;
  h.lastFinance = life.day;
  mail(life, v, v.name, `Budget for week ${h.budget.week}`, `Income $${h.budget.income}; ${h.tenure === 'rent' ? 'rent' : h.tenure === 'mortgage' ? 'home loan' : 'housing'} $${housing}; council rates $${rates}; power and water $${h.budget.utilities}; groceries $${food}; eating out $${out}; savings $${h.budget.savings}.`, { kind: 'budget', read: true });
  return paid;
}

// ── Each hour ────────────────────────────────────────────────────────────────
const atHome = (v) => v.inside && v.step?.at === 'home' && !v.path?.length;
// Which neighbourhood feeder the house hangs off (src/world/power-grid.js west-homes / east-homes).
export const feederFor = (v) => (v.home.door.x < 40 ? 'west-homes' : 'east-homes');

// Runs every household for one town hour. Returns the homes' power and water demand for that hour
// and anything that should be logged.
export function householdHour(life, hour) {
  const t = outdoorTemp(life.day, life.minute, life.civic.weather), dark = life.daylight() < 0.15;
  const restricted = life.civic.supply && life.civic.supply.waterOk === false;
  let power = 0, water = 0;
  const notes = [];
  const byHome=new Map();
  for(const v of life.villagers){
    if(!byHome.has(v.home.coordinate))byHome.set(v.home.coordinate,[]);
    byHome.get(v.home.coordinate).push(v);
  }
  for(const residents of byHome.values()){
    const v=residents[0],h=ensureHousehold(v);
    const home=residents.some(atHome),awakeResidents=residents.filter(p=>atHome(p)&&p.step?.kind!=='sleep');
    const awake=awakeResidents.length>0;
    const pilot=pilotMains(life,'H:'+v.home.coordinate);
    const powered=pilot===null?life.gridPowered(feederFor(v)):pilot;
    // Climate: the reverse-cycle unit holds 21° while someone is up (or when it's bitter or sweltering).
    const drift = t + 3;
    const extreme = drift < 10 || drift > 30;
    h.climate = powered && (awake || (home && extreme)) ? (drift < COMFORT.low ? 'heating' : drift > COMFORT.high ? 'cooling' : 'off') : 'off';
    h.indoor = h.climate === 'off' ? Math.round(drift * 10) / 10 : h.climate === 'heating' ? 20 : 23;
    h.lights = powered && awake && dark;
    let p = powered ? POWER.fridge + POWER.freezer : 0;
    if (h.lights) p += POWER.lights;
    if (h.climate !== 'off') p += POWER.climate;
    // Base refrigeration, lights and heating are shared ONCE; each awake adult adds use.
    let w=0;
    for(const person of awakeResidents){
      const k=person.step?.kind;
      if(powered&&k==='cook')p+=POWER.oven;
      if(powered&&k==='relax')p+=POWER.tv;
      if(powered&&(k==='finances'||(k==='work'&&person.work==='home')))p+=POWER.computer;
      if(powered&&k==='laundry')p+=POWER.washer;
      if(powered&&k==='shower')p+=POWER.hotwater;
      w+=WATER.toilet;
      if(k==='cook')w+=WATER.cook;
      if(k==='shower')w+=WATER.shower;
      if(k==='laundry')w+=WATER.washer;
      if(k==='dishes')w+=WATER.dishes;
    }
    // Garden: dries in the heat and wind, soaks up rain; the sprinkler runs at 6am if it's dry and
    // there are no water restrictions.
    h.garden = clamp(h.garden - (t > 25 ? 3 : t > 15 ? 1.6 : 0.8) + (life.civic.weather === 'rainy' ? 4 : 0), 0, 100);
    if (hour === 6 && h.garden < 45 && life.civic.weather !== 'rainy' && !restricted) { h.garden = 95; w += WATER.sprinkler; }
    // Fridge and freezer without power: after four hours chilled food in the fridge is unsafe; a closed
    // freezer stays frozen for about a day, then its contents thaw into the fridge to be used quickly.
    h.fridgeOff = powered ? 0 : h.fridgeOff + 60;
    if (h.fridgeOff === 240) {
      const tossed = v.larder.filter((b) => b.store === 'fridge' && CHILLED.has(b.g));
      if (tossed.length) {
        const n = tossed.reduce((s, b) => s + b.n, 0);
        v.larder.splice(0,v.larder.length,...v.larder.filter((b) => !tossed.includes(b)));
        h.threwOut += n; life.rubbish(n);
        v.memory = 'the power was off for hours, so the fridge food had to go';
        notes.push(`${v.name} threw out ${tossed.map((b) => say(b.g, b.n)).join(' and ')} after four hours without power.`);
      }
    }
    if (h.fridgeOff === 1440) for (const b of v.larder) if (b.store === 'freezer') { b.store = 'fridge'; b.wear = Math.max(b.wear, 0.7); }
    // Food ages; a warm summer pantry ages faster, and a fridge with no power is just a cupboard.
    const heat = t > 28 ? 1.5 : 1;
    let spoiled = [];
    for (const b of v.larder) {
      const where = !powered && b.store !== 'pantry' ? (b.store === 'freezer' ? 'fridge' : 'pantry') : b.store;
      const life_ = SHELF[b.g][where] || SHELF[b.g].pantry;
      b.wear = Math.round((b.wear + (60 / life_) * (where === 'pantry' ? heat : 1)) * 1e4) / 1e4;
      if (b.wear >= 1) spoiled.push(b);
    }
    if (spoiled.length) {
      v.larder.splice(0,v.larder.length,...v.larder.filter((b) => !spoiled.includes(b)));
      const n = spoiled.reduce((s, b) => s + b.n, 0);
      h.threwOut += n; life.rubbish(n);
      v.memory = `had to throw out ${spoiled.map((b) => say(b.g, b.n)).join(' and ')} that had gone off`;
      if (spoiled.length && h.threwOut % 5 === 0) notes.push(`${v.name} binned ${spoiled.map((b) => say(b.g, b.n)).join(' and ')} that had gone off.`);
    }
    // Meat comes out of the freezer to thaw in the fridge: overnight, or first thing for tonight's tea.
    if ((hour === 21 || hour === 7) && foodCount(v, 'lamb') === 0) { const f = v.larder.find((b) => b.g === 'lamb' && b.store === 'freezer'); if (f) { if (f.n > 1) { f.n--; v.larder.push(batch('lamb', 1, 'fridge', 0.3)); } else { f.store = 'fridge'; f.wear = Math.max(f.wear, 0.3); } } }
    h.meter.power = r2(h.meter.power + p); h.meter.water = r2(h.meter.water + w);
    h.usage.power = r2(h.usage.power + p); h.usage.water = r2(h.usage.water + w);
    power += p; water += w;
  }
  return { power: r2(power), water: r2(water), notes, outdoor: t };
}

// ── Things to do at home ─────────────────────────────────────────────────────
// The next chore or pastime for someone with free time, or null. Steps run at the doorstep target
// like every "at home" step (life.js goThen); `householdDone` applies the result when they finish.
export function homeTask(life, v, rand) {
  const h = ensureHousehold(v), m = life.minute, light = life.isDay(), weather = life.civic.weather;
  const unpaid = h.bills.some((b) => !b.paid);
  if ((unpaid && life.day >= Math.min(...h.bills.filter((b) => !b.paid).map((b) => b.due)) - 1) || life.day - h.lastFinance >= 7)
    return { kind: 'finances', dur: 20, activity: 'doing the household budget and email on the computer' };
  if (h.dishes >= 2) return { kind: 'dishes', dur: 12, activity: 'washing up the plates and cutlery at the kitchen sink' };
  if (h.mail > 0 && m >= 15 * 60) return { kind: 'mailbox', dur: 3, activity: 'checking the letterbox' };
  if (h.laundry >= 5 && light && m < 16 * 60) return { kind: 'laundry', dur: 25, activity: weather === 'rainy' ? 'doing a load of washing and hanging it inside' : 'doing a load of washing and pegging it on the clothesline' };
  if (h.lawn >= 8 && light && weather !== 'rainy' && m < 18 * 60) return { kind: 'mow', dur: 35, activity: 'mowing the lawn with the mower from the shed' };
  if (h.garden < 30 && light && life.civic.supply?.waterOk === false) return { kind: 'water', dur: 10, activity: 'watering the vegie patch with a bucket (water restrictions)' };
  if (h.garden < 30 && light && weather !== 'rainy') return { kind: 'water', dur: 12, activity: 'watering the garden with the hose' };
  if (m >= 19 * 60) return { kind: 'relax', dur: 45 + rand() * 30, activity: rand() < 0.7 ? 'watching TV on the couch' : 'reading on the couch' };
  return null;
}

export function householdDone(life, v, step) {
  const h = ensureHousehold(v);
  switch (step?.kind) {
    case 'cook': h.dishes += 1; break;
    case 'dishes': h.dishes = 0; break;
    case 'laundry': h.laundry = 0; break;
    case 'mow': h.lawn = 0; life.rubbish(1); break;
    case 'water': h.garden = 90; h.meter.water = r2(h.meter.water + WATER.hose); break;
    case 'mailbox': h.mail = 0; break;
    case 'finances': return { council: doFinances(life, v) };
    case 'shower': v.doneToday.shower = true; break;
    default: break;
  }
  return null;
}

// What the house panel, chat and tests show about a household.
export function householdReport(life, v) {
  const h = ensureHousehold(v);
  return {
    name: v.name, home: v.home.coordinate, tenure: h.tenure,
    housing: h.tenure === 'rent' ? `renting from the council housing office, $${HOUSING.rent} a day` : h.tenure === 'mortgage' ? `paying off a home loan with the Community Bank: $${h.mortgage.balance} left, $${HOUSING.repayment} a day` : 'owns the house outright',
    larder: larderLines(v), larderText: larderSummary(v), threwOut: h.threwOut,
    budget: h.budget, spent: { ...h.spent }, bills: h.bills.map((b) => ({ ...b })), inbox: h.inbox.slice(0, 8),
    climate: h.climate, indoor: h.indoor, outdoor: outdoorTemp(life.day, life.minute, life.civic.weather), season: season(life.day),
    lights: h.lights, dishes: h.dishes, laundry: h.laundry, lawn: Math.round(h.lawn), garden: Math.round(h.garden), mail: h.mail,
    usage: { ...h.usage }, meter: { ...h.meter }, wallet: v.wallet, savings: v.savings || 0,
    appliances: APPLIANCES.map(([id, name, room]) => ({ id, name, room })),
  };
}
