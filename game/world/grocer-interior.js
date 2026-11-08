import { createKit, ROOM } from './interior-kit.js';

// The Greengrocer, laid out like a country fruit-and-veg shop:
//   • Sloped timber display stands of crates down both walls (fruit on the right, vegetables on the left),
//     with a clear centre aisle, hanging scales over the counter and chalkboard prices on every crate.
//   • A counter at the back with a till, brown paper bags and a scale; a cool room, boxes and a hand
//     trolley behind it; a striped awning over the front window and a bin of loose potatoes by the door.
export const GROCER_LAYOUT = Object.freeze({ counterZ: -5.6, staff: { x: -1.2, z: -6.75 }, staffUse: { x: -1.2, z: -4.4 } });

export function buildGrocerInterior(site, makeLabel, roomTitle = 'Greengrocer') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, solid, text, add, model } = k;
  const { W, BACK, EDGE } = ROOM;
  const CZ = GROCER_LAYOUT.counterZ;
  group.add(new THREE.HemisphereLight(0xfffbe8, 0x6a6a4a, 2.1));
  const GREEN = 0x4f8a3e, CREAM = 0xf0ead6, WOOD = 0x9a7650, WOODD = 0x5d422b, CRATE = 0xc2995e;
  k.shell({ wall: 0xf1ecd8, ceiling: 0xf8f5ea, floor: 0xc9b48c });
  for (let i = 0; i < 14; i++) box(0.96, 0.014, 17.4, -6.5 + i, 0.004, -3, i % 2 ? 0xbfa77c : 0xcdb68a);
  for (let i = 0; i < 14; i++) box(1, 0.5, 0.05, -6.5 + i, 0.25, BACK + 0.14, i % 2 ? GREEN : 0xe8f0d8);           // green and white dado
  for (const x of [-4, 0, 4]) box(1.6, 0.05, 0.4, x, 3.75, -2, 0xfafafa, { e: 0xffffff });
  for (let i = 0; i < 10; i++) box(0.6, 0.04, 1.6, -2.7 + i * 0.6, 3.35 + (i % 2) * 0.01, 5.2, i % 2 ? GREEN : 0xf2f2e6);   // awning stripes over the door window

  // ── counter ──
  solid(8.8, 1.05, 0.9, 0, 0.52, CZ, WOOD); box(8.9, 0.06, 1.0, 0, 1.08, CZ, 0xd8c39a); box(8.8, 0.6, 0.06, 0, 0.3, CZ + 0.47, GREEN);
  box(0.4, 0.22, 0.4, -1.2, 1.22, CZ + 0.05, 0x2d3036); box(0.34, 0.14, 0.02, -1.2, 1.26, CZ + 0.27, 0x8fc4e8, { e: 0x4f94c8 });   // till
  box(0.5, 0.05, 0.4, 1.4, 1.14, CZ + 0.1, 0x8d949a); cyl(0.2, 0.2, 0.06, 1.4, 1.22, CZ + 0.1, 0xc2c7cc);                          // scale
  for (let i = 0; i < 5; i++) box(0.22, 0.28, 0.1, 2.4 + i * 0.12, 1.24, CZ + 0.1, 0xb9894e);                                         // paper bags
  box(2.2, 0.8, 0.05, 0, 2.45, BACK + 0.2, 0x25301f); text(site.name, 0, 3.4, CZ - 0.4, 'room'); text('Fresh · Local · Seasonal', 0, 2.45, CZ - 0.3);
  for (let i = 0; i < 3; i++) { box(0.9, 0.04, 0.5, -2.8 + i * 1.0, 1.12, CZ - 0.05, CRATE); for (let j = 0; j < 5; j++) ball(0.09, -3.05 + i * 1.0 + j * 0.12, 1.22, CZ - 0.05, [0xd8452f, 0xe8c63a, 0x7fb04a][i]); }

  // ── behind the counter: cool room, boxes, hand trolley ──
  solid(3.2, 3.0, 0.6, 4.6, 1.5, BACK + 0.5, 0xdfe6e4); box(2.9, 2.6, 0.04, 4.6, 1.4, BACK + 0.84, 0xcfe8ee, { a: 0.4 });
  for (let i = 0; i < 6; i++) box(0.6, 0.3, 0.45, -5.2 + (i % 3) * 0.65, 0.16 + Math.floor(i / 3) * 0.32, BACK + 0.6, CRATE);
  box(0.5, 0.05, 0.4, -3.6, 0.4, BACK + 0.8, 0x5a6068); cyl(0.08, 0.08, 0.04, -3.8, 0.1, BACK + 1.0, 0x222222, {}, 10);

  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) cyl(0.09, 0.09, 0.22, -6.0 + c * 0.38, 1.9 + r * 0.45, BACK + 0.35, [0xd8452f, 0xe8c63a, 0x7fb04a][(r + c) % 3], {}, 8);   // jars of preserves on the back shelf
  box(3.6, 0.05, 0.4, -4.2, 1.78, BACK + 0.35, WOODD); box(3.6, 0.05, 0.4, -4.2, 2.23, BACK + 0.35, WOODD); box(3.6, 0.05, 0.4, -4.2, 2.68, BACK + 0.35, WOODD);
  // ── produce stands: sloped crates down both walls, centre aisle clear ──
  const stand = (x, fruit) => {
    solid(1.4, 0.8, 7.2, x, 0.4, -0.2, WOODD);
    for (let i = 0; i < 6; i++) {
      const z = -3.2 + i * 1.2;
      box(1.2, 0.18, 1.0, x, 0.88, z, CRATE); box(1.2, 0.04, 0.04, x, 0.92, z + 0.5, 0xe8dcc0);
      const cols = fruit ? [[0xd8452f, 0xe8c63a], [0xe39a2f, 0x7fb04a], [0xe8c63a, 0x9b3a6a], [0xb4ad7a, 0xd8452f], [0xe39a2f, 0xe8c63a], [0x7fb04a, 0xd8452f]][i] : [[0x5f9a3a, 0xe39a2f], [0xb36b3a, 0x7fb04a], [0xd8452f, 0xe8e8a0], [0x6b8a3a, 0x8a3a6a], [0xc8a050, 0x5f9a3a], [0xe8a030, 0x7fb04a]][i];
      for (let j = 0; j < 8; j++) ball(0.1, x - 0.4 + (j % 4) * 0.27, 1.04 + (j >> 2) * 0.08, z - 0.2 + (j >> 2) * 0.35, cols[j % 2]);
      box(0.3, 0.2, 0.02, x, 1.12, z + 0.54, 0x25301f);
    }
  };
  stand(-5.0, false); stand(5.0, true);
  text('Vegetables', -5.0, 2.6, -1.0); text('Fruit', 5.0, 2.6, -1.0);
  // ── loose potato bin and basket stack by the door; baskets and framed picture ──
  solid(0.9, 0.7, 0.9, -3.0, 0.35, 4.4, WOODD); box(0.8, 0.12, 0.8, -3.0, 0.76, 4.4, 0x9b7a4a);
  for (let i = 0; i < 4; i++) cyl(0.3, 0.26, 0.2, 3.2, 0.1 + i * 0.2, 4.6, 0xc9a35a, {}, 10);
  model('pictureframe_medium', 0, 5.88, Math.PI, { h: 0.7 }, 1.9);
  model('cactus_medium_B', 6.1, 5.2, 0, { h: 0.9 });

  add('counter', 'Produce counter', 'civic-ledger', 'Fruit and vegetables from the Orchard and the Market Garden are weighed here. Pay, or open the Town Ledger.', GROCER_LAYOUT.staffUse.x, GROCER_LAYOUT.staffUse.z);
  add('veg', 'Vegetable stand', 'info', 'Market Garden vegetables go onto the left-hand stand each morning, washed and stacked in crates. Prices are chalked on the crates.', -3.3, -0.5);
  add('fruit', 'Fruit stand', 'info', 'Apples, oranges and lemons from the Orchard sit on the right-hand stand. The greengrocer rearranges them as the day goes on.', 3.3, -0.5);
  add('scales', 'Hanging scales', 'info', 'Everything here is sold by weight on the old brass scales over the counter. The greengrocer keeps about twenty of each in stock.', 2.4, -4.4);
  return k.finish({ staff: { pos: GROCER_LAYOUT.staff, use: GROCER_LAYOUT.staffUse } });
}
