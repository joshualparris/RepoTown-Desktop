// Walk-in homes for Narromine's residents (narromine-population.js). Every resident's house gets the rooms
// people actually live in: a lounge, a kitchen with a fridge, pantry and stove, a bathroom, a laundry, and a
// bedroom for each sleeper (couples share a double bed; young siblings share). The fridge and pantry show
// what that household really has: stocked on its last Coles trip, used up meal by meal since.
// Interiors use the same builder as Repository Town homes. Front doors face the household's street.
import { buildInterior } from './interior.js';
import { dayPlan } from './narromine-population.js';
import { townDate } from './town-calendar.js';
import { makeDistinctPerson } from './npc-wardrobe.js';
import { animateNarromineResidents } from './narromine-indoor-life.js';

// What one person's share of a Coles shop is, and what each person uses a day.
// Households shop about three times a week (including stops on the way home from work), so each shop
// covers about 2.4 days of what a person eats (DAILY below).
export const SHOP = { milk: 1, bread: 0.36, eggs: 1.2, meat: 1, veg: 2.4, fruit: 2.4, cereal: 0.17 };
const DAILY = { milk: 0.4, bread: 0.15, eggs: 0.5, meat: 0.4, veg: 1, fruit: 1, cereal: 0.07 };
const UNITS = { milk: 'L of milk', bread: 'loaves of bread', eggs: 'eggs', meat: 'meat portions', veg: 'serves of vegetables', fruit: 'pieces of fruit', cereal: 'boxes of cereal' };

// Front door: the footprint edge facing the street, and where you stand when you come back out.
export function homeDoor(home) {
  // The actual rendered footprint uses local X=(cos,-sin), Z=(sin,cos).
  // Choose the wall intersected by the street-facing ray, then put the
  // doorway at that wall's MIDPOINT. The old support-function calculation
  // could place its sensor beyond the wall, particularly on angled houses.
  const c = Math.cos(home.yaw), s = Math.sin(home.yaw);
  const dx = home.kerb.x - home.x, dz = home.kerb.z - home.z;
  const u = dx * c - dz * s, v = dx * s + dz * c;
  const width = Math.abs(u) / Math.max(.1, home.w / 2);
  const depth = Math.abs(v) / Math.max(.1, home.d / 2);
  const nx = width > depth ? Math.sign(u || 1) * c : Math.sign(v || 1) * s;
  const nz = width > depth ? -Math.sign(u || 1) * s : Math.sign(v || 1) * c;
  const half = width > depth ? home.w / 2 : home.d / 2;
  const door = { x: home.x + nx * half, z: home.z + nz * half };
  return { ...door, out: { x: door.x + nx * 2.2, z: door.z + nz * 2.2, yaw: Math.atan2(-nx, -nz) } };
}

// Candidate midpoints of the four ACTUAL rotated walls, street-facing first.
// The ray-selected facade threshold takes precedence, so its visible door,
// collision sensor and exit pose cannot point to different walls.
export function doorCandidates(home) {
  const c = Math.cos(home.yaw), s = Math.sin(home.yaw);
  const axes = [[c, -s, home.w / 2], [-c, s, home.w / 2], [s, c, home.d / 2], [-s, -c, home.d / 2]];
  const kx = home.kerb.x - home.x, kz = home.kerb.z - home.z;
  const doors = axes.map(([ux, uz, h]) => {
    const door = { x: home.x + ux * h, z: home.z + uz * h };
    return { ...door, out: { x: door.x + ux * 2.2, z: door.z + uz * 2.2, yaw: Math.atan2(-ux, -uz) }, facing: ux * kx + uz * kz };
  });
  doors.sort((a, b) => b.facing - a.facing);
  return [homeDoor(home), ...doors.filter((d) => Math.hypot(d.x - homeDoor(home).x, d.z - homeDoor(home).z) > .05)];
}
// First candidate whose doorstep is free within 1.3 m and whose approach (1.5–4 m out) is clear.
export function pickDoor(cands, probe) {
  for (const d of cands) {
    const ux = d.out.x - d.x, uz = d.out.z - d.z, L = Math.hypot(ux, uz) || 1;
    let free = false; for (let t = 0; t <= 1.3 && !free; t += 0.1) free = !probe(d.x + ux / L * t, d.z + uz / L * t, 0.4);
    if (!free) continue;
    let clear = true; for (let t = 1.5; t <= 4 && clear; t += 0.25) clear = !probe(d.x + ux / L * t, d.z + uz / L * t, 0.4);
    if (clear) return d;
  }
  return null;
}
export function createNarromineHomeIndex(population) {
  const CELL = 30, grid = new Map(), key = (x, z) => Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
  let doors = population.homes.map((h) => ({ home: h, door: homeDoor(h), cands: doorCandidates(h) }));
  const reindex = () => { grid.clear(); for (const d of doors) { const k = key(d.door.x, d.door.z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(d); } };
  reindex();
  return {
    get doors() { return doors; },
    // Move each door to a wall the player can actually reach (probe(x, z, r) → true when blocked).
    resolve(probe) { const before = doors.length; doors = doors.filter((d) => { const p = pickDoor(d.cands, probe); if (p) d.door = p; return !!p; }); reindex(); return { kept: doors.length, dropped: before - doors.length }; },
    // The home whose front door is within reach of this point (null if none).
    near(pos, reach = 1.4) {
      let best = null, bd = reach;
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const d of grid.get((Math.floor(pos.x / CELL) + dx) + ',' + (Math.floor(pos.z / CELL) + dz)) || []) {
        const dist = Math.hypot(pos.x - d.door.x, pos.z - d.door.z); if (dist < bd) { bd = dist; best = d; }
      }
      return best;
    },
  };
}

// The minute (from the town's start) a household last finished a Coles shop, looking back up to 8 days.
function lastShop(population, hh, day, minute) {
  const adults = hh.members.map((id) => population.people[+id.slice(3)]).filter((p) => p.age >= 18);
  for (let d = day; d >= Math.max(1, day - 8); d--) {
    const wd = townDate(d).weekday;
    let best = null;
    for (const p of adults) for (const s of dayPlan(p, hh, wd, population.workplaces)) if (s.kind === 'shop' && (d < day || s.to <= minute)) best = Math.max(best ?? 0, s.to);
    if (best !== null) return d * 1440 + best;
  }
  return null;
}
// What is in a household's fridge and pantry right now.
export function fridgeAt(population, hh, day, minute) {
  const n = hh.members.length, shop = lastShop(population, hh, day, minute);
  const days = shop === null ? 4 : (day * 1440 + minute - shop) / 1440;
  const out = {};
  // After a shop the fridge holds that shop plus about two days left over from before.
  for (const k of Object.keys(SHOP)) out[k] = Math.max(0, Math.round(((SHOP[k] + DAILY[k] * 2) * n - DAILY[k] * n * days) * 10) / 10);
  return { items: out, daysSinceShop: Math.round(days * 10) / 10, needsShop: Object.entries(out).some(([k, v]) => v < DAILY[k] * n * 1.5) };
}
export const describeFridge = (f) => Object.entries(f.items).map(([k, v]) => (k === 'milk' || k === 'bread' || k === 'cereal' ? v : Math.round(v)) + ' ' + UNITS[k]).join(', ');

// Who is at home right now and what they are doing.
export function occupants(population, hh, day, minute) {
  const wd = townDate(day).weekday;
  return hh.members.map((id) => population.people[+id.slice(3)]).map((p) => {
    const step = dayPlan(p, hh, wd, population.workplaces).find((s) => minute >= s.from && minute < s.to);
    const where = !step || step.at === 'home' ? 'home' : step.at === 'coles' ? 'at Coles' : step.kind === 'school' || step.at === p.school ? 'at school' : 'at work';
    return { person: p, home: where === 'home', doing: where === 'home' ? (step?.kind || 'home') : where };
  });
}

export function buildNarromineHomeInterior(population, home, makeLabel, day, minute) {
  const hh = population.households.find((h) => h.id === home.household);
  const people = hh.members.map((id) => population.people[+id.slice(3)]);
  const fridge = fridgeAt(population, hh, day, minute), who = occupants(population, hh, day, minute);
  const info = (title, text) => ({ do: 'info', title, text });
  const doing = { sleep: 'asleep', breakfast: 'having breakfast', dinner: 'having dinner', evening: 'relaxing', home: 'at home' };
  const whoText = who.map((o) => `${o.person.name} (${o.person.age}): ${o.home ? doing[o.doing] || 'at home' : o.doing}`).join('; ');
  // Every home is different: rooms sized from this house's traced outline, a layout that suits its shape,
  // its own colours and floors, and furniture for the people who actually live here.
  const H = (k) => { let h = 2166136261; for (const c of home.id + k) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
  const pickH = (k, list) => list[Math.floor(H(k) * list.length)];
  const oldest = Math.max(...people.map((p) => p.age));
  // Walls and floors typical of Narromine houses: older owners lean to 1970s–90s finishes.
  const WALLS = oldest > 65 ? [0xe9e2cf, 0xd9cdb0, 0xcfc4a8, 0xe6d8bd, 0xb89f7c] : [0xf2f0ea, 0xe7e4dc, 0xd9ddd6, 0xcfd8d2, 0xe9e1d3, 0xd4dbe2, 0xc9cfc1];
  const FLOORS = oldest > 65 ? [0x8a6b4a, 0x9c8a6e, 0xb3a184, 0x7d6a55] : [0xa98a64, 0xc2a57f, 0x8f8a83, 0xb7b1a6, 0x6e5a45, 0xd2c6b2];
  const walls = pickH('w', WALLS), floor = pickH('f', FLOORS), wet = pickH('t', [0xe8eef0, 0xdfe5e2, 0xf1ece4, 0xcfd6d8]);
  const usable = home.area * 0.85, roomArea = (share) => Math.max(36, usable * share);
  const aspect = Math.max(1, Math.max(home.w, home.d) / Math.min(home.w, home.d));
  const size = (a, k) => { const r = 1 + (H(k) - 0.5) * 0.5 * Math.min(aspect, 2); const w = Math.sqrt(a * r); return { w: Math.round(w * 10) / 10, d: Math.round(a / w * 10) / 10 }; };
  const kids = people.filter((p) => p.role === 'child'), couple = people.filter((p) => p.role === 'partner' || p.role === 'parent'), others = people.filter((p) => !couple.includes(p) && !kids.includes(p));
  const retired = people.some((p) => p.retired || p.age >= 67), babies = kids.filter((p) => p.age < 3), trade = people.some((p) => ['farm', 'graincorp'].includes(p.workplace) || /car_repair|tyres|trade|hvac|agrarian/.test(population.workplaces.find((w) => w.id === p.workplace)?.kind || ''));
  const HOBBY = [['guitar', 'Guitar'], ['piano', 'Piano'], ['treadmill', 'Treadmill'], ['easel', 'Easel and paints'], ['vinyl', 'Record player'], ['chessboard', 'Chess set'], ['aquarium', 'Fish tank'], ['bookshelf', 'Bookshelf'], ['dumbbells', 'Weights'], ['loom', 'Sewing and craft table'], ['radio', 'Radio'], ['pinball', 'Pinball machine']];
  const hobbies = HOBBY.filter((_, i) => H('h' + i) < 0.16).slice(0, 3);
  const lounge = [['sofa', 'Couch'], ['tv', 'Television', info('Television', 'The ' + hh.surname + ' household television.')], ['aircon', 'Air conditioner', info('Air conditioner', 'Split-system air conditioning: Narromine summers often pass 35°C.')], ['table', 'Who is home', info('The ' + hh.surname + ' household', whoText)], ...(H('rug') < 0.6 ? [['rug', 'Rug']] : []), ...(H('lamp') < 0.7 ? [['lamp', 'Lamp']] : []), ...(H('plant') < 0.5 ? [['plant', 'Pot plant']] : []), ...(retired ? [['clock', 'Mantel clock'], ['radio', 'Radio']] : []), ...(kids.length && H('game') < 0.6 ? [['boardGame', 'Board games']] : []), ...hobbies];
  const kitchen = [['fridge', 'Fridge', info('Fridge', describeFridge(fridge) + '. Last Coles shop ' + fridge.daysSinceShop + ' days ago' + (fridge.needsShop ? '; running low.' : '.'))], ['pantry', 'Pantry', info('Pantry', 'Cereal, tins, rice and pasta from Coles Narromine.')], ['stove', 'Oven and cooktop'], ['kitchenSink', 'Kitchen sink'], ['crockery', 'Plates and cutlery'], [people.length > 4 ? 'table' : pickH('kt', ['table', 'roundTable']), 'Kitchen table'], ...people.slice(0, 6).map((p) => ['chair', p.first + "'s chair"]), ...(H('coffee') < 0.45 ? [['coffeeMachine', 'Coffee machine']] : []), ...(H('fruit') < 0.6 ? [['fruitBowl', 'Fruit bowl']] : []), ...(H('herb') < 0.25 ? [['herbGarden', 'Herb pots']] : [])];
  const rooms = [
    { name: pickH('ln', ['Lounge', 'Living room', 'Family room']), ...size(roomArea(0.24), 'l'), walls, floor, props: lounge },
    { name: H('open') < 0.35 ? 'Kitchen and dining' : 'Kitchen', ...size(roomArea(0.15), 'k'), walls, floor: H('kf') < 0.5 ? wet : floor, props: kitchen },
    { name: H('bath') < 0.3 ? 'Bathroom' : 'Bathroom and toilet', ...size(Math.max(30, usable * 0.07), 'b'), walls: wet, floor: wet, props: [['shower', 'Shower'], ['toilet', 'Toilet'], ['basin', 'Basin and mirror'], ...(H('tub') < 0.45 ? [['bathtub', 'Bath']] : [])] },
    { name: 'Laundry', ...size(30, 'u'), walls: wet, floor: wet, props: [['washingMachine', 'Washing machine'], ['switchboard', 'Switchboard'], ...(H('fz') < 0.5 ? [['freezer', 'Chest freezer']] : []), ...(H('cl') < 0.4 ? [['clothesline', 'Clothes airer']] : [])] },
  ];
  const bed = (a) => roomArea(Math.min(0.13, 0.5 / Math.max(1, people.length)) + a);
  if (couple.length) rooms.push({ name: 'Main bedroom', ...size(bed(0.04), 'm'), walls, floor, props: [['bed', couple.length > 1 ? 'Double bed · ' + couple.map((p) => p.first).join(' & ') : 'Bed · ' + couple[0].first, info('Main bedroom', couple.map((p) => p.name).join(' and ') + '.')], ['wardrobe', 'Wardrobe'], ['lamp', 'Bedside lamp'], ...(babies.length === 1 && couple.length ? [['crib', 'Cot · ' + babies[0].first]] : []), ...(H('mir') < 0.5 ? [['mirror', 'Mirror']] : [])] });
  // Children up to two to a room (but not a teenager with a little one), furnished for their age.
  const kidRooms = [];
  for (const k of kids.filter((p) => p.age >= 3).sort((a, b) => a.age - b.age)) { const r = kidRooms.find((x) => x.length < 2 && Math.abs(x[0].age - k.age) <= 5); if (r) r.push(k); else kidRooms.push([k]); }
  if (babies.length > 1 || (babies.length && !couple.length)) rooms.push({ name: 'Nursery', ...size(bed(0), 'n'), walls: pickH('nw', [0xf3ecd6, 0xe1efe0, 0xd9e6f2]), floor, props: [...babies.map((p) => ['crib', 'Cot · ' + p.first, info(p.first + "'s cot", p.name + ', ' + p.age)]), ['wardrobe', 'Change table and drawers'], ['rockingHorse', 'Rocking chair']] });
  for (const g of kidRooms) {
    const teen = g.some((p) => p.age >= 13), small = g.every((p) => p.age < 8);
    rooms.push({ name: g.length > 1 ? g.map((p) => p.first).join(' and ') + "'s room" : g[0].first + "'s room", ...size(bed(0), 'c' + g[0].id), walls: pickH('cw' + g[0].id, [0xd9e6f2, 0xf2dfe6, 0xe1efe0, 0xf3ecd6, walls]), floor,
      props: [...g.map((p) => ['bed', 'Bed · ' + p.first, info(p.first + "'s bed", p.name + ', ' + p.age + (p.school ? ', goes to ' + (population.workplaces.find((w) => w.id === p.school)?.name || 'school') : ''))]),
        ...(small ? [['toyBlocks', 'Toys'], ['rockingHorse', 'Rocking horse']] : teen ? [['desk', 'Desk'], ['computer', 'Computer'], ...(H('sp' + g[0].id) < 0.5 ? [['speaker', 'Speaker']] : [])] : [['desk', 'Desk'], ['bookshelf', 'Books'], ['toyBlocks', 'Toys']]), ['wardrobe', 'Wardrobe']] });
  }
  for (const p of others) rooms.push({ name: p.first + "'s room", ...size(bed(0), 'o' + p.id), walls, floor, props: [['bed', 'Bed · ' + p.first, info(p.first + "'s bed", p.name + ', ' + p.age)], ['wardrobe', 'Wardrobe'], p.age >= 67 ? ['radio', 'Radio'] : p.age < 30 ? ['computer', 'Laptop and desk'] : ['lamp', 'Lamp']] });
  // A study for a household with someone working office hours from home; a shed for tradies and farm workers.
  if (people.some((p) => p.workplace && (H('wfh' + p.id) < 0.12))) rooms.push({ name: 'Study', ...size(30, 's'), walls, floor, props: [['desk', 'Desk'], ['computer', 'Computer'], ['filingCabinet', 'Filing cabinet'], ['bookshelf', 'Bookshelf']] });
  // A garage or shed is a DETACHED outbuilding, not a room in the dwelling.
  // Keep its inventory separate until a surveyed, clear yard placement exists;
  // never spawn the mower/workbench through a family-room wall.
  const outbuilding = trade || H('shed') < 0.25
    ? { name: trade ? 'Detached shed and workshop' : 'Detached garage', stored: [
      'workbench', 'tools', trade ? 'parts bins' : 'bicycle', ...(H('mow') < 0.6 ? ['lawn mower'] : [])
    ], modelledOutside: false } : null;
  // Layout by shape: long narrow houses run rooms in a row or deep; squarer ones gather round a hall.
  const layout = aspect > 1.7 ? pickH('lay', ['row', 'deep']) : pickH('lay', ['hub', 'grid', 'L', 'row']);
  const house = { repo: 'narromine-' + home.id, name: 'The ' + hh.surname + ' household', int: { layout, height: pickH('ht', [2.4, 2.7, 3.0, 3.3]), walls, floor, doors: pickH('dr', [0x7a5a3c, 0xf2efe8, 0x5a4634, 0xd8cfc0]), rooms } };
  // Rooms start at the house's real proportions; any room too small for its furniture grows 12% and tries again.
  let built = null;
  for (let tries = 0; tries < 14 && !built; tries++) {
    try { built = buildInterior(house, makeLabel); } catch (e) {
      const m = /no room for \w+ in "([^"]+)"/.exec(e.message); if (!m) throw e;
      const r = rooms.find((x) => x.name === m[1]); r.w = Math.round(r.w * 1.12 * 10) / 10; r.d = Math.round(r.d * 1.12 * 10) / 10;
    }
  }
  if (!built) throw new Error(house.repo + ': could not fit furniture');
  // The residents who are home, where their activity puts them: in bed asleep, in the kitchen at
  // breakfast or dinner, otherwise in the lounge. Children are drawn smaller.
  const roomCentre = (i) => { const r = built.rooms[i]; return { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 }; };
  const find = (t, label) => built.interactables.find((o) => o.type === t && (!label || o.label.includes(label)));
  let n = 0;
  const figureIds = [], figurePositions = [], awake = [];
  for (const o of who.filter((x) => x.home)) {
    const p = o.person;
    const activity = o.doing === 'sleep' ? 'asleep' : o.doing === 'breakfast' ? 'breakfast' : o.doing === 'dinner' ? 'dinner' : 'home';
    const figure = makeDistinctPerson('narromine:' + p.id, p, { activity, minute, weather: 'sunny' });
    const fig = figure.group;
    if (o.doing === 'sleep') {
      const bed = find('bed', p.first);
      if (bed) {
        fig.position.set(bed.pos.x + (n % 2 ? 0.45 : -0.45) * (bed.label.includes('&') ? 1 : 0), 0.62, bed.pos.z + 0.2);
        fig.rotation.set(-Math.PI / 2, 0, 0);
        built.group.add(fig);
        figureIds.push(p.id);
        figurePositions.push({ id: p.id, x: fig.position.x, z: fig.position.z });
        n++;
        continue;
      }
    }
    const anchor = o.doing === 'breakfast' || o.doing === 'dinner' ? find('fridge') : find('tv');
    let at = null;
    if (anchor) {
      const c = roomCentre(anchor.room), dx = c.x - anchor.pos.x, dz = c.z - anchor.pos.z;
      const D = Math.hypot(dx, dz) || 1;
      at = { x: anchor.pos.x + dx / D * (1.6 + (n % 3) * 0.7),
        z: anchor.pos.z + dz / D * (1.6 + (n % 3) * 0.7) + (n % 2 ? 0.6 : -0.6),
        yaw: Math.atan2(-dx, -dz) };
    }
    if (!at) { const c = roomCentre(0); at = { ...c, yaw: 0 }; }
    const record = { id: p.id, x: at.x, z: at.z };
    figureIds.push(p.id); figurePositions.push(record);
    awake.push({ figure, id: p.id, name: p.name, label: p.first + ' ' + p.surname + ', ' + p.age,
      ...at, activity: o.doing === 'breakfast' || o.doing === 'dinner' ? 'preparing a meal' : 'relaxing at home',
      domestic: true, roam: true, record });
    n++;
  }
  animateNarromineResidents(built, awake, makeLabel, () => minute);
  return { ...built, household: hh, fridge, occupants: who, figures: n, figureIds, figurePositions, outbuilding };
}
