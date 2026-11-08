import { createKit, ROOM } from './interior-kit.js';

// Working farm sheds. Every shed shares a timber-and-iron shell, a concrete floor, a farm-office bench at the
// back with a tally board, hay bales, a tool wall and a wall-mounted gate; each then adds the gear of its own job:
//   sheep: shearing stand, wool press and bales, a pen.   dairy: milking bail, steel vat and churns.
//   coop: nesting boxes, egg grading bench and straw.     orchard: fruit bins, ladders and a packing bench.
//   garden: seedling benches, potting bench and crates.   silo: grain hopper and auger, sacks on pallets, scales.
export const FARM_LAYOUT = Object.freeze({ counterZ: -5.6, staff: { x: 0, z: -6.7 }, staffUse: { x: 0, z: -4.4 } });
export const FARM_SHED_IDS = Object.freeze(['sheep', 'dairy', 'coop', 'orchard', 'garden', 'silo']);

const INFO = {
  sheep: { a: ['Shearing stand', 'The shearer works the stand each season. Fleeces are skirted on the table and pressed into wool bales by the right wall.'], b: ['Sheep pen', 'Merinos wait in the pen to be drafted, crutched or shorn. The Butcher takes the lamb.'], c: ['Wool press', 'A bale press and a stack of wool packs. The wool clip is the farm\'s second crop after lamb.'], sign: 'Shearing · Drafting · Wool' },
  dairy: { a: ['Milking bail', 'Cows come in two at a time at dawn. The bail is hosed down after every milking.'], b: ['Milk vat', 'The steel vat chills the morning milk before the truck takes it to the bakery, café and store.'], c: ['Milk churns', 'Old steel churns still stand by the door, now used for cream and for show.'], sign: 'Milking · Cooling · Cream' },
  coop: { a: ['Nesting boxes', 'The hens lay in the straw boxes along the wall. The keeper gathers eggs twice a morning.'], b: ['Egg grading bench', 'Eggs are wiped, candled and graded by size here, then packed for the store and the bakery.'], c: ['Feed bins', 'Layer pellets and scratch grain for the flock, kept in rodent-proof bins.'], sign: 'Eggs · Grading · Feed' },
  orchard: { a: ['Fruit bins', 'Bins of apples, oranges and lemons wait here for the truck. Pickers fill a bin in a morning.'], b: ['Packing bench', 'Fruit is sorted, wrapped and packed into trays for the Greengrocer and the café.'], c: ['Picking ladders', 'Three-legged orchard ladders lean in the corner. They\'re steadier on soft ground than a four-legged one.'], sign: 'Apples · Oranges · Lemons' },
  garden: { a: ['Seedling benches', 'Trays of lettuce, tomato and pumpkin seedlings sprout under the window.'], b: ['Potting bench', 'Seeds are sown and cuttings potted here. The compost heap is outside the back door.'], c: ['Produce crates', 'Washed vegetables are stacked in crates for the Greengrocer and the café kitchen.'], sign: 'Seeds · Seedlings · Veg' },
  silo: { a: ['Grain hopper', 'Harvested wheat is augered into the hopper and bagged or trucked to the Flour Mill.'], b: ['Grain sacks', 'Sacks of milling wheat stack on pallets, ready for the freight truck.'], c: ['Weigh scales', 'Every load is weighed and recorded in the tally book on the way in and out.'], sign: 'Wheat · Weighing · Freight' },
};
const TALLY = { sheep: 'Lamb', dairy: 'Milk', coop: 'Eggs', orchard: 'Fruit', garden: 'Veg', silo: 'Grain' };

export function buildFarmInterior(site, makeLabel, roomTitle = 'Farm shed') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, solid, text, add, model } = k;
  const { W, BACK, EDGE } = ROOM;
  const CZ = FARM_LAYOUT.counterZ, id = site.id, I = INFO[id] || INFO.garden;
  group.add(new THREE.HemisphereLight(0xfff0d6, 0x5e5240, 2.0));
  const lamp = new THREE.PointLight(0xffe2b0, 1.0, 16, 1.6); lamp.position.set(0, 3.8, -2); group.add(lamp);
  const WOOD = 0x9a7650, WOODD = 0x5d422b, IRON = 0x8d949a, HAY = 0xd8b858, CRATE = 0xc2995e;
  k.shell({ wall: 0xa68a62, ceiling: 0x8d949a, floor: 0xa9a59a });
  for (let i = 0; i < 14; i++) box(0.96, 0.02, 17.4, -6.5 + i, 0.005, -3, i % 2 ? 0xa09c92 : 0xb1ada2);        // concrete slabs
  for (let i = 0; i < 14; i++) box(0.12, 2.6, 0.04, -6.4 + i, 1.8, BACK + 0.14, 0x9aa0a6);                     // corrugated iron ribs on the back wall
  for (const x of [-4, 4]) for (const z of [-1, -6]) box(1.6, 0.05, 0.4, x, 3.75, z, 0xfafafa, { e: 0xffffff });

  // ── farm office bench with tally board ──
  solid(5.4, 1.0, 0.8, 0, 0.5, CZ, WOODD); box(5.5, 0.06, 0.9, 0, 1.03, CZ, WOOD); box(5.4, 0.5, 0.05, 0, 0.3, CZ + 0.42, 0x4a6a3a);
  box(0.4, 0.04, 0.3, -1.2, 1.08, CZ + 0.05, 0xf4f4f0); box(0.1, 0.1, 0.1, 1.0, 1.1, CZ, 0xb34a3a); cyl(0.06, 0.06, 0.1, 1.4, 1.1, CZ, 0xc2c7cc, {}, 8);
  box(2.4, 1.3, 0.05, 0, 2.4, BACK + 0.2, 0x25301f); text(`${TALLY[id] || 'Stock'} tally`, 0, 2.5, BACK + 0.4); text(site.name, 0, 3.5, CZ - 0.3, 'room');
  text(I.sign, 0, 1.9, CZ - 0.2);
  model('lamp_standing', 3.6, -6.9, 0, { h: 1.6 });

  // ── common farm props: hay bales, tool wall, buckets ──
  for (let i = 0; i < 5; i++) solid(0.9, 0.5, 0.45, 5.7 - (i % 3) * 0.0, 0.25 + Math.floor(i / 3) * 0.5, -8.6 + (i % 3) * 0.5 - (i > 2 ? 0.25 : 0), HAY);
  for (let i = 0; i < 6; i++) { box(0.04, 0.9, 0.04, -EDGE + 0.14, 1.9, -3 + i * 0.35, 0x4a3a30); box(0.04, 0.05, 0.3, -EDGE + 0.14, 1.4 + (i % 2) * 0.1, -3 + i * 0.35, IRON); }
  for (let i = 0; i < 3; i++) cyl(0.2, 0.17, 0.3, -6.2, 0.15, 5.0 - i * 0.5, i % 2 ? 0x3f6fa0 : IRON, {}, 10);
  model('pictureframe_small_C', 4.8, 5.88, Math.PI, { h: 0.4 }, 1.9);

  // ── shed fabric: weatherboards, rafters, straw, boots, barrow and trough ──
  for (let i = 0; i < 32; i++) for (const sx of [-EDGE + 0.15, EDGE - 0.15]) box(0.03, 1.2, 0.5, sx, 0.8, -11.6 + i * 0.55, i % 2 ? 0x8e7550 : 0x9a8058);
  for (let i = 0; i < 9; i++) box(W - 0.4, 0.14, 0.14, 0, 4.2, -11.2 + i * 2.0, WOODD);
  for (let i = 0; i < 6; i++) box(0.14, 0.5, 0.14, -6.7 + (i % 2) * 13.4, 3.9, -10 + Math.floor(i / 2) * 5, WOODD);
  for (let i = 0; i < 80; i++) box(0.5, 0.012, 0.04, -5.5 + ((i * 37) % 11) * 1.1, 0.03, -3.5 + ((i * 17) % 13) * 0.75, HAY).rotation.y = i * 0.7;
  for (let i = 0; i < 6; i++) { cyl(0.08, 0.1, 0.3, -6.3 + (i % 3) * 0.22, 0.15, -9.6 + (i >> 2) * 0.3, 0x2f2a26, {}, 8); }
  solid(0.9, 0.45, 0.5, 2.6, 0.3, -9.8, 0x4a6a3a); box(0.9, 0.05, 0.5, 2.6, 0.55, -9.8, IRON); cyl(0.2, 0.2, 0.05, 3.2, 0.12, -9.8, 0x222222, {}, 10);       // wheelbarrow
  solid(1.8, 0.5, 0.5, -3.0, 0.25, -9.8, IRON); box(1.7, 0.05, 0.4, -3.0, 0.5, -9.8, 0x5a8aa0, { a: 0.7 });                                              // water trough
  for (const x of [-3.5, 3.5]) { cyl(0.01, 0.01, 0.5, x, 3.95, -5, IRON, {}, 5); box(0.28, 0.3, 0.28, x, 3.55, -5, 0xffe2b0, { e: 0xffce7a }); }

  // ── gear of the trade ──
  if (id === 'sheep') {
    solid(1.6, 0.2, 1.6, -4.4, 0.1, -1.5, WOOD); box(0.06, 1.6, 0.06, -4.4, 1.0, -1.5, IRON); box(0.9, 0.04, 0.04, -4.4, 1.7, -1.5, IRON);                 // shearing stand + handpiece drop
    solid(1.4, 0.9, 1.2, -4.4, 0.45, 1.4, 0xd8cdb0); for (let i = 0; i < 3; i++) ball(0.35, -4.7 + i * 0.3, 1.1, 1.4, 0xf2ecd9);                              // fleece table
    solid(1.2, 1.2, 1.2, 4.6, 0.6, -1.5, 0xe8dfc8); box(1.0, 0.05, 1.0, 4.6, 1.22, -1.5, 0xc8c0a8); box(0.1, 1.8, 0.1, 4.6, 2.1, -1.5, IRON);             // wool press
    for (let i = 0; i < 4; i++) solid(0.9, 0.8, 0.7, 5.5 + (i % 2) * 0.0, 0.4, 0.8 + i * 0.8, 0xe8dfc8);                                                 // wool bales
    box(2.6, 0.04, 0.05, 2.6, 0.5, 3.4, WOOD); box(2.6, 0.04, 0.05, 2.6, 0.9, 3.4, WOOD); box(0.08, 1.0, 0.08, 1.3, 0.5, 3.4, WOODD); box(0.08, 1.0, 0.08, 3.9, 0.5, 3.4, WOODD);
    model('cactus_small_B', 5.2, 5.2, 0, { h: 0.5 });
  } else if (id === 'dairy') {
    for (const z of [-2.5, 0.5]) { solid(0.2, 1.0, 2.2, -5.3, 0.5, z, IRON); box(1.2, 0.08, 2.0, -4.7, 0.6, z, IRON); box(0.06, 0.4, 2.0, -4.1, 0.9, z, 0x3f6fa0); }       // bail rails
    solid(1.4, 1.4, 2.4, 4.8, 0.7, -2.0, 0xc2c7cc); cyl(0.7, 0.7, 1.4, 4.8, 0.7, -2.0, 0xdfe3e4, {}, 16); box(0.5, 0.2, 0.5, 4.8, 1.5, -2.0, 0x9aa0a6);   // steel vat
    for (let i = 0; i < 5; i++) { cyl(0.2, 0.17, 0.7, 4.0 + (i % 3) * 0.5, 0.35, 2.6 + Math.floor(i / 3) * 0.5, 0xc2c7cc, {}, 10); }     // churns
    solid(0.9, 0.7, 0.9, -4.4, 0.35, 3.2, WOODD); for (let i = 0; i < 4; i++) box(0.3, 0.32, 0.3, -4.7 + (i % 2) * 0.35, 0.86, 3.0 + (i >> 1) * 0.35, 0xf4f4f0);
  } else if (id === 'coop') {
    solid(0.6, 2.0, 7.0, -EDGE + 0.4, 1.0, -2.0, WOOD); for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) { box(0.5, 0.3, 0.7, -EDGE + 0.7, 0.35 + r * 0.6, -5.0 + c * 0.85, HAY); box(0.1, 0.04, 0.5, -EDGE + 1.0, 0.2 + r * 0.6, -5.0 + c * 0.85, WOODD); }
    solid(2.2, 0.9, 0.9, 4.6, 0.45, -1.5, WOOD); box(2.3, 0.05, 1.0, 4.6, 0.92, -1.5, 0xd8c39a); for (let i = 0; i < 9; i++) ball(0.08, 4.0 + (i % 5) * 0.2, 1.0, -1.7 + (i >> 2) * 0.35, i % 3 ? 0xe8d8b8 : 0xc8a070);
    for (let i = 0; i < 3; i++) solid(0.6, 0.8, 0.6, 5.7, 0.4, 1.2 + i * 0.9, 0x8d949a);   // feed bins
    for (let i = 0; i < 5; i++) cyl(0.25, 0.2, 0.2, -2.8 + (i % 3) * 0.5, 0.1, 3.0 + (i >> 1) * 0.45, 0xc9a35a, {}, 10);
  } else if (id === 'orchard') {
    for (let i = 0; i < 4; i++) { solid(1.2, 0.9, 1.2, -4.8 + (i % 2) * 0.0, 0.45, -3.0 + i * 1.5, CRATE); for (let j = 0; j < 7; j++) ball(0.11, -5.1 + (j % 3) * 0.3, 1.0, -3.2 + i * 1.5 + (j >> 2) * 0.3, [0xd8452f, 0xe39a2f, 0xe8c63a, 0x9fc040][i]); }
    solid(2.6, 0.9, 1.0, 4.6, 0.45, -1.5, WOOD); box(2.7, 0.05, 1.1, 4.6, 0.92, -1.5, 0xd8c39a); for (let i = 0; i < 6; i++) box(0.4, 0.1, 0.3, 3.8 + i * 0.3, 1.0, -1.5, CRATE);
    for (let i = 0; i < 3; i++) { box(0.05, 2.2, 0.05, 3.6 + i * 0.35, 1.1, 3.6, 0x9a7650).rotation.z = 0.12; box(0.05, 2.2, 0.05, 3.9 + i * 0.35, 1.1, 3.6, 0x9a7650).rotation.z = -0.12; }
    model('cactus_medium_A', -6.0, 5.2, 0, { h: 0.8 });
  } else if (id === 'garden') {
    for (const z of [-3.0, 0.0]) { solid(1.2, 0.85, 2.6, -4.8, 0.42, z, WOOD); for (let i = 0; i < 12; i++) box(0.3, 0.06, 0.4, -5.1 + (i % 3) * 0.32, 0.9, z - 1.0 + (i >> 2) * 0.55, 0x4a3a30); for (let i = 0; i < 12; i++) ball(0.08, -5.1 + (i % 3) * 0.32, 1.0, z - 1.0 + (i >> 2) * 0.55, [0x5fa03a, 0x7fb04a][i % 2]); }
    solid(2.4, 0.9, 1.0, 4.6, 0.45, -1.5, WOOD); box(2.5, 0.05, 1.1, 4.6, 0.92, -1.5, 0x8a6a4a); for (let i = 0; i < 4; i++) cyl(0.12, 0.1, 0.18, 3.8 + i * 0.4, 1.05, -1.5, 0xb36b3a, {}, 10);
    for (let i = 0; i < 6; i++) solid(0.7, 0.4, 0.5, 5.3, 0.2 + (i % 2) * 0.4, 1.2 + (i >> 1) * 0.6, CRATE);
    torusRing(k, 4.0, 3.6);
  } else {
    solid(1.6, 2.6, 1.6, -4.6, 1.3, -2.0, 0xc2c7cc); cyl(0.2, 0.7, 1.0, -4.6, 2.9, -2.0, 0xc2c7cc, {}, 14); box(0.3, 0.3, 3.0, -3.2, 1.2, -0.5, IRON).rotation.y = 0.6;       // hopper + auger
    for (let i = 0; i < 8; i++) solid(0.8, 0.28, 0.5, 4.8 + (i % 2) * 0.0, 0.14 + Math.floor(i / 4) * 0.3, -3.6 + (i % 4) * 0.7, 0xd8c8a0);                              // grain sacks on pallets
    box(1.6, 0.08, 2.4, 4.6, 0.05, 2.0, WOODD); for (let i = 0; i < 6; i++) solid(0.7, 0.3, 0.45, 4.6 - 0.35 + (i % 2) * 0.7, 0.3 + (i >> 2) * 0.3, 1.4 + (i >> 1) * 0.5, 0xd8c8a0);
    box(1.6, 0.06, 1.2, -4.2, 0.04, 2.8, 0x5a6068); box(0.3, 0.8, 0.1, -4.2, 0.5, 2.2, 0x2d3036);   // floor scales
  }
  add('counter', 'Farm office bench', 'civic-ledger', `${site.name} keeps its tally here. Pay, check what the farm has produced, or open the Town Ledger.`, FARM_LAYOUT.staffUse.x, FARM_LAYOUT.staffUse.z);
  add('a', I.a[0], 'info', I.a[1], -2.9, -1.5);
  add('b', I.b[0], 'info', I.b[1], 2.9, -1.5);
  add('c', I.c[0], 'info', I.c[1], id === 'dairy' || id === 'orchard' ? 2.8 : -2.5, 3.0);
  return k.finish({ staff: { pos: FARM_LAYOUT.staff, use: FARM_LAYOUT.staffUse } });
}

function torusRing(k, x, z) { k.torus(0.4, 0.04, x, 0.06, z, 0x3a6a3a, { rx: Math.PI / 2 }); }   // coiled hose
