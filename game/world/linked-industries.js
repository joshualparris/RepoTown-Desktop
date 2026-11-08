// Linked industries (rebuilt on current main from the unmerged Oct 2026 branch
// feat/town-realism-linked-industries-20261020). Everything here uses businesses
// that already exist in the town instead of adding competing ones:
//  - Farm animals at the Sheep Station, Dairy and Chook Shed have health, feed and water.
//    Only healthy, fed, watered animals count towards farm output.
//  - Regional Stockfeed & Produce sells feed to the farms from finite, invoiced stock.
//  - Repository Veterinary Surgery treats sick animals with finite veterinary kits,
//    billed to the farm, during its staffed hours (a visiting rural vet).
//  - Town Trades & Maintenance builds a farm cooperative workshop extension in stages,
//    buying timber, cement, fixings and steel from Central West Hardware & Timber.
//  - Kegs for The Merged Branch come from a fictional regional brewery in Dubbo by rail
//    (the town has no brewery), topping up the pub's finite supplier stock with an invoice.
// State lives in civic.industries so it is saved with the rest of the town. Pure logic, no three.js.
import { pubVenue } from './pub-venue.js';

const HERDS = { sheep: ['sheep', 12], dairy: ['cow', 7], coop: ['hen', 16] };
export const FARM_ANIMAL_SITES = Object.freeze(Object.keys(HERDS));
export const BUILD_STAGES = Object.freeze(['foundation', 'framing', 'services', 'roof', 'commissioned']);
// Materials each stage consumes, bought from the hardware store.
const STAGE_MATERIALS = [{ cement: 6, timber: 2 }, { timber: 8, fixings: 3 }, { fixings: 4, steel: 2 }, { steel: 3, timber: 4 }];
const PRICES = { feed: 2, medkit: 15, timber: 12, cement: 9, fixings: 7, steel: 14 };       // retail, per unit
const WHOLESALE = { feed: 1, medkit: 9, timber: 7, cement: 5, fixings: 4, steel: 9 };      // what the shop pays its supplier
const FEED_PER_DAY = { sheep: 3, dairy: 4, coop: 2 }, VET_FEE = 34, KEG_L = 50;
// Five days without rain is normal weather, not a drought. A maintained
// rural pasture may support livestock through several weeks without rain.
const PASTURE_DRY_DAYS = 18, REGIONAL_FEED_ACCOUNT_LIMIT = 500;
const clamp = (v) => Math.max(0, Math.min(100, v));
// About one animal in 250 falls mildly ill on a given day, chosen by a fixed hash of day and animal.
const illness = (day, id) => { let h = day * 2654435761 >>> 0; for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h % 250 === 0; };

export function industries(t) {
  const s = t.civic.industries ??= { version: 1, herds: null, feedDay: 0, cases: [], visits: [], log: [], invoices: [], stock: { stockfeed: { feed: 60 }, vet: { medkit: 6 }, hardware: { timber: 20, cement: 12, fixings: 10, steel: 6 } }, farmFeed: { sheep: 9, dairy: 12, coop: 6 }, project: null, kegsDelivered: 0, imports: 0, accounts: {} };
  s.imports ??= 0; s.accounts ??= {}; s.supplierDebt ??= {};
  if (!s.herds) s.herds = Object.fromEntries(Object.entries(HERDS).map(([farm, [species, n]]) => [farm, Array.from({ length: n }, (_, i) => ({ id: farm + '-' + String(i + 1).padStart(2, '0'), species, health: 86 + (i % 12), fed: true, watered: true, isolated: false, caseId: null }))]));
  s.project ??= { name: 'Farm cooperative workshop extension', builder: 'trades', supplier: 'hardware', stage: 0, hours: 0, onSite: {}, startedDay: t.day, finishedDay: null };
  return s;
}
const note = (t, s, text) => { s.log.unshift({ day: t.day, minute: Math.floor(t.minute), text }); s.log.length = Math.min(60, s.log.length); t.log(text); };
const staffed = (t, id) => t.villagers.some((v) => v.work === id && v.step?.kind === 'work' && !(v.path?.length));
const place = (t, id) => t.places.get(id);

// Restock a business from its regional supplier: real money leaves its till.
function restock(t, s, id, good, upTo) {
  // Regional suppliers give trade credit (30-day account): stock arrives now, the shop pays as it can.
  const p = place(t, id), have = s.stock[id][good] || 0, n = upTo - have;
  if (!p || n <= 0) return;
  const cost = n * WHOLESALE[good];
  s.supplierDebt[id] = (s.supplierDebt[id] || 0) + cost; s.stock[id][good] = have + n;
  s.invoices.unshift({ day: t.day, business: id, good, quantity: n, total: cost }); s.invoices.length = Math.min(40, s.invoices.length);
}
// A business sells to another: stock moves, money moves, GST goes through the town's normal sale().
// A farm short of cash can take feed on account (the stockfeed store's usual practice) and settles later.
function trade(t, s, from, to, good, n, onAccount = false) {
  const seller = place(t, from), buyer = place(t, to), price = n * PRICES[good];
  if (!seller || !buyer || (s.stock[from][good] || 0) < n) return false;
  if (buyer.till < price) {
    if (!onAccount) return false;
    s.stock[from][good] -= n; s.accounts[to] = (s.accounts[to] || 0) + price; return true;
  }
  s.stock[from][good] -= n; buyer.till -= price; t.sale(seller, price); return true;
}
function paySuppliers(t, s) {
  for (const [id, owed] of Object.entries(s.supplierDebt)) {
    const p = place(t, id), pay = Math.min(owed, Math.max(0, (p?.till || 0) - 20));
    if (pay <= 0) continue;
    p.till -= pay; s.imports += pay; s.supplierDebt[id] = owed - pay;
    if (s.supplierDebt[id] <= 0) delete s.supplierDebt[id];
  }
}
function settleAccounts(t, s) {
  for (const [id, owed] of Object.entries(s.accounts)) {
    const buyer = place(t, id), pay = Math.min(owed, Math.max(0, (buyer?.till || 0) - 40));   // keep a small float
    if (pay <= 0) continue;
    buyer.till -= pay; t.sale(place(t, 'stockfeed'), pay); s.accounts[id] = owed - pay;
    if (s.accounts[id] <= 0) delete s.accounts[id];
  }
}

export function reportSickAnimal(t, farm, animalId) {
  const s = industries(t), a = s.herds[farm]?.find((x) => x.id === animalId);
  if (!a) return 'Animal not found in the herd.';
  if (a.caseId) return 'Existing veterinary case ' + a.caseId + '.';
  a.health = Math.min(a.health, 50); a.isolated = true;
  a.caseId = 'VET-' + String(s.cases.length + 1).padStart(4, '0');
  s.cases.push({ id: a.caseId, farm, animalId, openedDay: t.day, status: 'waiting for the vet', treatedDay: null });
  note(t, s, `${place(t, farm)?.name || farm}: ${animalId} is unwell and isolated; veterinary case ${a.caseId} opened.`);
  return 'Veterinary case ' + a.caseId + ' opened; the animal is isolated until the vet sees it.';
}

// Share of a farm's animals that can produce today (1 for farms without animals).
export function animalProductionFactor(t, farm) {
  const herd = industries(t).herds[farm];
  if (!herd) return 1;
  return herd.filter((a) => !a.isolated && a.health >= 60 && a.fed && a.watered).length / herd.length;
}

function careDay(t, s) {
  if (s.feedDay === t.day) return;
  s.feedDay = t.day;
  const water = !!t.civic.supply?.waterOk;
  // Sheep and cattle graze; after five rainless days the pasture is short and they need bought feed.
  // Hens eat wheat from the farm's own grain store (main's Chook Shed already orders grain), topped up with feed.
  s.dryDays = t.civic.weather === 'rainy' ? 0 : (s.dryDays || 0) + 1;
  for (const [farm, herd] of Object.entries(s.herds)) {
    const need = FEED_PER_DAY[farm], p = place(t, farm);
    const grazing = farm !== 'coop' && s.dryDays < PASTURE_DRY_DAYS, grain = farm === 'coop' && (p?.stock.grain || 0) > 0;
    // Regional rural feed merchants provide a genuine 30-day trade account
    // when the local produce store is unstaffed. A farm that exhausts both
    // pasture and local feed may still buy seven days' feed on invoice; this
    // stays finite and unpaid credit is a LIABILITY, not invented cash.
    // Stock cannot appear without a recorded external supplier invoice.
    if(!grazing&&!grain&&(s.farmFeed[farm]||0)<need){
      const qty=need*7,cost=WHOLESALE.feed*qty,debt=s.supplierDebt[farm]||0;
      if(p&&debt+cost<=REGIONAL_FEED_ACCOUNT_LIMIT){
        s.farmFeed[farm]=(s.farmFeed[farm]||0)+qty;
        s.supplierDebt[farm]=debt+cost;
        s.invoices.unshift({day:t.day,business:farm,good:'regional emergency stock feed',
          quantity:qty,total:cost,terms:'30-day account'});
        s.invoices.length=Math.min(40,s.invoices.length);
        note(t,s,`${p.name} received ${qty} feed bags from the regional rural supplier on account (${cost}).`);
      }
    }
    const bought = !grazing && !grain && (s.farmFeed[farm] || 0) >= need;
    if (bought) s.farmFeed[farm] -= need;
    const fed = grazing || grain || bought;
    if (!fed) note(t, s, `${p?.name || farm} ran out of ${farm === 'coop' ? 'grain and ' : 'pasture and '}stock feed; its animals went hungry today.`);
    for (const a of herd) {
      a.fed = fed; a.watered = water;
      a.health = clamp(a.health + (fed && water ? 2 : -6));
      if (a.health >= 70 && illness(t.day, a.id)) a.health = 45;       // occasional mild illness (own hash: leaves the town's random stream alone)
      if (a.health < 60 && !a.caseId) reportSickAnimal(t, farm, a.id);
    }
  }
}

function vetHour(t, s) {
  if (!staffed(t, 'vet') || !t.open(place(t, 'vet'))) return;
  const vetPlace = place(t, 'vet');
  for (const c of s.cases.filter((x) => x.status !== 'treated')) {
    const farm = place(t, c.farm), a = s.herds[c.farm]?.find((x) => x.id === c.animalId);
    if (!a) { c.status = 'treated'; continue; }
    if ((s.stock.vet.medkit || 0) < 1) { c.status = 'waiting for veterinary supplies'; continue; }
    if (farm.till < VET_FEE) { c.status = 'waiting for the farm to pay'; continue; }
    s.stock.vet.medkit--; farm.till -= VET_FEE; t.sale(vetPlace, VET_FEE);
    a.health = Math.max(75, a.health); a.isolated = false; a.caseId = null;
    c.status = 'treated'; c.treatedDay = t.day;
    s.visits.unshift({ caseId: c.id, farm: c.farm, day: t.day, fee: VET_FEE }); s.visits.length = Math.min(30, s.visits.length);
    note(t, s, `The visiting vet treated ${a.id} at ${farm.name} ($${VET_FEE}, one veterinary kit).`);
    break;                                                          // one farm visit per hour
  }
}

function buildHour(t, s) {
  const p = s.project;
  if (p.finishedDay || !staffed(t, p.builder) || !t.open(place(t, p.builder))) return;
  const need = STAGE_MATERIALS[p.stage];
  // Buy what this stage still needs from the hardware store (only while it is staffed and open).
  for (const [good, n] of Object.entries(need)) {
    const short = n - (p.onSite[good] || 0);
    if (short > 0 && staffed(t, p.supplier) && t.open(place(t, p.supplier)) && trade(t, s, p.supplier, p.builder, good, short)) p.onSite[good] = (p.onSite[good] || 0) + short;
  }
  if (!Object.entries(need).every(([g, n]) => (p.onSite[g] || 0) >= n)) return;
  if (++p.hours < 6) return;                                        // six crew-hours per stage
  for (const [g, n] of Object.entries(need)) p.onSite[g] -= n;
  p.stage++; p.hours = 0;
  note(t, s, `Town Trades finished the ${BUILD_STAGES[p.stage - 1]} of the ${p.name}.`);
  if (p.stage === 4) { p.finishedDay = t.day; note(t, s, `The ${p.name} is complete and commissioned.`); }
}

// Kegs by rail from a fictional Dubbo brewery when the pub's supplier stock runs low.
function kegHour(t, s) {
  const v = pubVenue(t), pub = place(t, 'pub');
  if (v.beerDepotL >= 150 || !pub) return;
  const cost = 4 * 160;                                              // four 50 L kegs at a wholesale price
  if (pub.till < cost) return;
  pub.till -= cost; s.imports += cost; v.beerDepotL += 4 * KEG_L; s.kegsDelivered += 4;
  s.invoices.unshift({ day: t.day, business: 'pub', good: 'beer keg (Dubbo brewery, by rail)', quantity: 4, total: cost }); s.invoices.length = Math.min(40, s.invoices.length);
  note(t, s, 'Four 50 L kegs arrived by rail from the Dubbo brewery for The Merged Branch.');
}

// Called once per town hour from TownLife.
export function industriesHour(t, h) {
  const s = industries(t);
  careDay(t, s);
  if (h === 7) {
    restock(t, s, 'stockfeed', 'feed', 80); restock(t, s, 'vet', 'medkit', 6);
    for (const [g, n] of Object.entries({ timber: 20, cement: 12, fixings: 10, steel: 6 })) restock(t, s, 'hardware', g, n);
  }
  // Farms buy feed from the produce store when they are down to two days' worth.
  if (staffed(t, 'stockfeed') && t.open(place(t, 'stockfeed')))
    for (const farm of FARM_ANIMAL_SITES) if ((s.farmFeed[farm] || 0) < FEED_PER_DAY[farm] * 3 && trade(t, s, 'stockfeed', farm, 'feed', FEED_PER_DAY[farm] * 7, true)) s.farmFeed[farm] += FEED_PER_DAY[farm] * 7;   // a week's feed, enough to cover a weekend
  if (h === 17) { settleAccounts(t, s); paySuppliers(t, s); }
  vetHour(t, s); buildHour(t, s); kegHour(t, s);
}

export function industryReport(t) {
  const s = industries(t);
  return {
    herds: Object.fromEntries(Object.entries(s.herds).map(([f, h]) => [f, { animals: h.length, healthy: h.filter((a) => !a.isolated && a.health >= 60).length, isolated: h.filter((a) => a.isolated).length, feed: s.farmFeed[f] || 0 }])),
    cases: s.cases.slice(-8), visits: s.visits.slice(0, 8), stock: JSON.parse(JSON.stringify(s.stock)),
    project: { ...s.project, stageName: BUILD_STAGES[s.project.stage] }, kegsDelivered: s.kegsDelivered,
    invoices: s.invoices.slice(0, 10), log: s.log.slice(0, 10),
  };
}
export function herdReport(t, farm) {
  return (industries(t).herds[farm] || []).map((a) => ({ id: a.id, species: a.species, health: Math.round(a.health), isolated: a.isolated, fed: a.fed, watered: a.watered, caseId: a.caseId }));
}
