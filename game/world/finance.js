import { householdDay } from './household.js';
import { bankReceives } from './credit.js';
import { receiveTenantRent, visitorRentAccount } from './property.js';
// Public and household finance on top of the town's money model (life.civic): finite Commonwealth
// and NSW treasuries, PAYG income tax, council grants, the visitor's rent and power bills, household
// and business arrears, business utilities, and a double-entry journal. Every transfer moves money
// from one finite balance to another; the only money that appears is the opening endowment of each
// treasury, which the soak test counts in town money. Figures are fictional Town Dollars for a
// 24-minute game day, not real Australian rates.
export const RATES = Object.freeze({
  paygPercent: 15,        // simplified whole-dollar PAYG withholding on wages
  visitorRent: 8,         // per town day, from day 2
  visitorPower: 2,
  businessUtilities: 3,   // per private business per town day
  councilReserve: 6000,   // grants top the council up towards this level; a rich council needs none
  federalGrant: 600,      // most the Commonwealth pays the council in a day
  stateGrant: 300,        // most NSW pays the council in a day
  gstTopUp: 400,          // most the Commonwealth passes to NSW in a day (the GST pool)
  stateReserve: 15000,
  federalStart: 180000,   // opening allocation for 171 residents (formerly 40000 for 38)
  stateStart: 112500,     // same per-resident allocation; existing saves retain their balances
  arrearsCapWages: 6,     // unpaid wage arrears stop growing after this many shifts
  journalMax: 120,
});

const r2 = (n) => Math.round(n * 100) / 100;
const num = (n) => (Number.isFinite(n) && n >= 0 ? r2(n) : 0);

export function freshFinance() {
  return {
    federal: RATES.federalStart, state: RATES.stateStart,
    rentArrears: 0, powerArrears: 0, visitorPaid: 0,
    entries: [], seq: 0, lastClosedDay: 1,
    daily: blank(), lifetime: blank(), biz: {},
  };
}
const blank = () => ({ tax: 0, rates: 0, utilities: 0, rent: 0, grants: 0, councilWages: 0, stateWages: 0, unpaid: 0 });

export function fin(life) {
  const c = life.civic;
  if (!c.finance || typeof c.finance !== 'object') c.finance = freshFinance();
  const f = c.finance;
  for (const k of ['federal', 'state', 'rentArrears', 'powerArrears', 'visitorPaid']) f[k] = num(f[k]);
  if (!Array.isArray(f.entries)) f.entries = [];
  if (!f.daily) f.daily = blank();
  if (!f.lifetime) f.lifetime = blank();
  if (!f.biz) f.biz = {};
  return f;
}

export function record(life, from, to, amount, memo) {
  const f = fin(life);
  if (!(amount > 0)) return;
  f.entries.unshift({ id: ++f.seq, day: life.day, minute: Math.floor(life.minute), debit: String(from).slice(0, 40), credit: String(to).slice(0, 40), amount: r2(amount), memo: String(memo).slice(0, 100) });
  if (f.entries.length > RATES.journalMax) f.entries.length = RATES.journalMax;
}

function revenue(life, type, amount) {
  const f = fin(life);
  f.daily[type] = r2((f.daily[type] || 0) + amount);
  f.lifetime[type] = r2((f.lifetime[type] || 0) + amount);
}
export const bizStats = (life, id) => { const f = fin(life); return (f.biz[id] ||= { sales: 0, wages: 0, utilities: 0, rates: 0, unpaid: 0, supplies: 0 }); };

// A sale at a till (called from TownLife.sale): the shop's gross takings.
export function noteSale(life, shop, price) { bizStats(life, shop.id).sales = r2(bizStats(life, shop.id).sales + price); }
export function noteRates(life, place, amount) { bizStats(life, place.id).rates = r2(bizStats(life, place.id).rates + amount); revenue(life, 'rates', amount); record(life, 'business:' + place.id, 'council', amount, place.name + ' business rates'); }

// Whole-dollar PAYG: withheld from a wage that has already reached the worker's wallet.
export function withhold(life, v, gross) {
  const amount = Math.floor(gross * RATES.paygPercent / 100);
  if (amount <= 0 || v.wallet < amount) return 0;
  const f = fin(life);
  v.wallet -= amount; f.federal = r2(f.federal + amount);
  revenue(life, 'tax', amount);
  record(life, 'npc:' + v.name, 'commonwealth', amount, 'PAYG income tax');
  return amount;
}

// PAYG on the visitor's wages, taken from the wallet that was just paid.
export function withholdVisitor(life, gross, priorGross = 0) {
  const me = life.civic.player, amount = Math.floor(r2(priorGross + gross) * RATES.paygPercent / 100) - Math.floor(priorGross * RATES.paygPercent / 100);
  if (amount <= 0 || me.wallet < amount) return 0;
  const f = fin(life);
  me.wallet = r2(me.wallet - amount); f.federal = r2(f.federal + amount);
  revenue(life, 'tax', amount);
  record(life, 'visitor', 'commonwealth', amount, 'PAYG income tax on your wages');
  return amount;
}

// Draw a payment from the NSW treasury first for school and clinic jobs, falling back to the council.
export function stateFunded(site) { return site === 'school' || site === 'clinic'; }
export function drawState(life, amount) {
  const f = fin(life), take = Math.min(f.state, amount);
  if (take > 0) { f.state = r2(f.state - take); revenue(life, 'stateWages', take); record(life, 'nsw', 'wages', take, 'NSW health and education payroll'); }
  return take;
}
// One-off NSW small-business establishment grant (fictional, NSW-inspired): at 8:00 on day 1
// each private business gets opening working capital from the finite NSW treasury, so a new
// shop can make payroll before its first sales. Sized on its staff; paid once per save.
export const STARTUP_GRANT = Object.freeze({ base: 300, perStaff: 150, at: 8 * 60 });
export function startupGrants(life, businesses) {
  const f = fin(life);
  if (f.startupGrantsPaid || (life.day === 1 && life.minute < STARTUP_GRANT.at)) return 0;
  f.startupGrantsPaid = true;
  let total = 0;
  for (const p of businesses) {
    const staff = life.villagers.filter((v) => v.work === p.id).length;
    const amount = Math.min(STARTUP_GRANT.base + STARTUP_GRANT.perStaff * staff, f.state);
    if (amount <= 0) break;
    f.state = r2(f.state - amount); p.till = r2(p.till + amount); total = r2(total + amount);
    record(life, 'nsw', 'business:' + p.id, amount, p.name + ' small-business establishment grant');
  }
  if (total) { revenue(life, 'startupGrants', total); life.log(`NSW small-business establishment grants paid: $${Math.round(total)} to ${businesses.length} local businesses.`); }
  return total;
}
export function noteCouncilWage(life, amount) { if (amount > 0) { revenue(life, 'councilWages', amount); record(life, 'council', 'wages', amount, 'Council payroll'); } }

// Daily grants are needs-based, as for a real country council: the Commonwealth and NSW only top the
// council up when it is below its reserve, and the Commonwealth passes the GST pool to NSW when NSW
// runs low. Every dollar moves from a treasury that actually holds it.
export function dailyGrants(life) {
  const f = fin(life), c = life.civic;
  const gst = Math.min(RATES.gstTopUp, Math.max(0, RATES.stateReserve - f.state), f.federal);
  if (gst > 0) { f.federal = r2(f.federal - gst); f.state = r2(f.state + gst); record(life, 'commonwealth', 'nsw', gst, 'GST distribution to NSW'); }
  // Keep the original per-resident operating reserve after roster expansion.
  // Grants still debit finite state/federal accounts and obey their existing caps.
  const reserve=RATES.councilReserve*Math.max(1,(life.villagers?.length||38)/38);
  const need = Math.max(0, reserve - c.treasury);
  // Council transfers scale with the number of staffed households. Both caps remain
  // limited by the real finite Commonwealth and NSW balances, so wages cannot mint cash.
  const extra = Math.max(0, (life.villagers?.length || 38) - 38);
  const fed = Math.min(RATES.federalGrant + 24 * extra, f.federal, need);
  const st = Math.min(RATES.stateGrant + 12 * extra, f.state, Math.max(0, need - fed));
  f.federal = r2(f.federal - fed); f.state = r2(f.state - st);
  c.treasury = r2(c.treasury + fed + st);
  if (fed) record(life, 'commonwealth', 'council', fed, 'Commonwealth local services grant');
  if (st) record(life, 'nsw', 'council', st, 'NSW local infrastructure grant');
  revenue(life, 'grants', fed + st);
  return fed + st;
}

// Start of each town day (day 2 onwards): the visitor's rent and power, villagers' rate arrears,
// and every private business's utilities. Nothing overdrafts; shortfalls become arrears.
export function dailyClose(life) {
  const f = fin(life), c = life.civic, me = c.player;
  if (f.lastClosedDay >= life.day) return;
  f.lastClosedDay = life.day;
  f.daily = blank();
  // The visitor's household bills.
  const bill = (due, field, label) => {
    let owe = f[field] + due, paid = 0;
    for (const pot of ['wallet', 'bank']) { const take = Math.min(owe, Math.floor(me[pot])); if (take > 0) { me[pot] -= take; owe -= take; paid += take; } }
    f[field] = owe;
    const councilPaid = label === 'rent' ? visitorRentAccount(life,paid) : paid;
    c.treasury = r2(c.treasury + councilPaid); f.visitorPaid += paid;
    if (paid) { revenue(life, label === 'rent' ? 'rent' : 'utilities', paid); record(life, 'visitor', 'council', paid, 'Your ' + label); }
    if (owe > 0) f.daily.unpaid = r2(f.daily.unpaid + owe);
  };
  // No rent without an actual lease. A hotel guest pays the hotel on booking;
  // a homeowner only pays property ownership costs and utility use, not rent.
  // Existing historic arrears are still collectible, but no phantom daily charges accrue.
  const pr=c.property;
  const lease=pr?.playerLease&&pr.parcels?.[pr.playerLease];
  const ownerOccupied=!!pr&&Object.values(pr.parcels||{}).some(p=>
    p.owner==='visitor'&&p.kind==='house'&&(!p.tenant||p.tenant==='visitor'));
  const occupying=!!(lease?.tenant==='visitor'||ownerOccupied);
  bill(lease?.tenant==='visitor' ? lease.rent : 0, 'rentArrears', 'rent');
  bill(occupying ? RATES.visitorPower : 0, 'powerArrears', 'power');
  if (f.rentArrears + f.powerArrears > 0) life.log('Your rent and power are overdue. Pay them at the Community Bank.');
  // Villager households (src/world/household.js): renters pay the council's housing office, buyers
  // repay the Community Bank, and overdue power and water bills are collected by direct debit.
  const closedHomes=new Set();
  for (const v of life.villagers) {
    const home=v.household||v;
    if(closedHomes.has(home))continue;
    closedHomes.add(home);
    const h = householdDay(life, v);
    const landlordRent=receiveTenantRent(life,v,h.rentPaid||0);
    const publicPaid = Math.max(0,r2(h.council-(h.rentPaid||0)+landlordRent));
    if (publicPaid > 0) { c.treasury = r2(c.treasury + publicPaid); revenue(life, 'rent', publicPaid); }
    if (h.bank > 0) { bankReceives(life, h.bank); record(life, 'npc:' + v.name, 'community bank', h.bank, 'Home-loan repayment'); }
    v.housingArrears = Math.min(80, h.owed);
    for(const partner of life.villagers)if(partner!==v&&partner.household===v.household)partner.housingArrears=v.housingArrears;
    if (v.housingArrears > 0) f.daily.unpaid = r2(f.daily.unpaid + v.housingArrears);
  }
  // Private businesses pay utilities from the till, then any bills they still owe.
  for (const p of life.places.values()) {
    if (p.kind === 'home' || p.kind === 'utility' || !p.target || ['hall', 'school', 'clinic', 'post', 'depot', 'square', 'bank'].includes(p.id)) continue;
    const s = bizStats(life, p.id), due = RATES.businessUtilities + s.unpaid, pay = Math.min(due, Math.max(0, Math.floor(p.till)));
    if (pay > 0) { p.till -= pay; c.treasury = r2(c.treasury + pay); s.utilities = r2(s.utilities + pay); revenue(life, 'utilities', pay); record(life, 'business:' + p.id, 'council', pay, p.name + ' utilities'); }
    s.unpaid = r2(due - pay);
    if (s.unpaid > 0) f.daily.unpaid = r2(f.daily.unpaid + s.unpaid);
  }
}

// The visitor settles overdue household bills at the bank.
export function payBills(life) {
  const f = fin(life), c = life.civic, me = c.player;
  if (!life.open(life.place('bank'))) return 'The bank is closed (9:00–16:00).';
  let owe = f.rentArrears + f.powerArrears;
  if (owe <= 0) return 'You have no overdue bills.';
  let paid = 0;
  for (const pot of ['wallet', 'bank']) { const take = Math.min(owe, Math.floor(me[pot])); if (take > 0) { me[pot] -= take; owe -= take; paid += take; } }
  if (paid <= 0) return 'You have nothing to pay with.';
  const rent = Math.min(f.rentArrears, paid); f.rentArrears -= rent; f.powerArrears -= paid - rent;
  c.treasury = r2(c.treasury + paid); f.visitorPaid += paid;
  record(life, 'visitor', 'council', paid, 'Overdue rent and power');
  return `Paid $${paid} of overdue bills. $${f.rentArrears + f.powerArrears} still owing.`;
}

export function overdue(life) { const f = fin(life); return f.rentArrears + f.powerArrears; }

// Money held by the three tiers of government and the lending pool, for the books and the soak test.
export function governmentMoney(life) { const f = fin(life); return f.federal + f.state; }

export function economyReport(life) {
  const f = fin(life), c = life.civic, cr = life.creditReport();
  const biz = [...life.places.values()].filter((p) => p.target && p.kind !== 'home').map((p) => {
    const s = f.biz[p.id] || { sales: 0, wages: 0, utilities: 0, rates: 0, unpaid: 0, supplies: 0 };
    return { id: p.id, name: p.name, till: Math.round(p.till), sales: Math.round(s.sales), wages: Math.round(s.wages), rates: Math.round(s.rates), utilities: Math.round(s.utilities), unpaid: Math.round(s.unpaid), result: Math.round(s.sales - s.wages - s.rates - s.utilities) };
  });
  const people = life.villagers.reduce((n, v) => n + v.wallet + (v.savings || 0), 0);
  const tills = [...life.places.values()].reduce((n, p) => n + p.till, 0);
  const workEscrow=c.workContracts?.active?.escrow||0;
  const visitorWageDebt=(c.jobs?.payroll?.slips||[]).reduce((n,s)=>n+Math.max(0,s.gross-s.paid),0);
  return {
    workEscrow,visitorWageDebt,
    council: r2(c.treasury), commonwealth: f.federal, nsw: f.state, bank: cr.capital,
    people: Math.round(people), tills: Math.round(tills), visitor: Math.round(c.player.wallet + c.player.bank),
    total: Math.round(people + tills + c.treasury + f.federal + f.state + cr.capital + c.player.wallet + c.player.bank + workEscrow),
    rentArrears: f.rentArrears, powerArrears: f.powerArrears,
    daily: { ...f.daily }, lifetime: { ...f.lifetime },
    wageArrears: life.villagers.reduce((n, v) => n + (v.wageArrears || 0), 0),
    rateArrears: life.villagers.reduce((n, v) => n + (v.rateArrears || 0) + (v.housingArrears || 0), 0),
    biz, entries: f.entries.slice(0, 16),
  };
}
