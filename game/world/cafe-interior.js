import { createKit, ROOM } from './interior-kit.js';

// The Commit Café, laid out like a small Australian café:
//   • Order-and-pay counter at the back with a three-group espresso machine, twin grinders, a glass
//     pastry cabinet, takeaway cups, a tip jar and a chalkboard menu above; the kitchen pass sits behind.
//   • A window bench with cushions and stools, a long communal table, and six small round tables with
//     bentwood chairs filling the middle of the room, with an aisle left clear down the centre.
//   • A self-serve water and condiment station on the right wall, a newspaper rack, plants and pendant lights.
export const CAFE_LAYOUT = Object.freeze({ counterZ: -5.5, staff: { x: 1.0, z: -6.7 }, staffUse: { x: 1.0, z: -4.3 } });

export function buildCafeInterior(site, makeLabel, roomTitle = 'Community café') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, solid, text, add, blocker, model } = k;
  const { W, FRONT, BACK, EDGE } = ROOM;
  const CZ = CAFE_LAYOUT.counterZ;
  group.add(new THREE.HemisphereLight(0xfff0d8, 0x6e5a48, 1.9));
  const warm = new THREE.PointLight(0xffd9a0, 1.1, 15, 1.6); warm.position.set(0, 3.5, -1.5); group.add(warm);

  const WALL = 0xe9d9bf, TERRA = 0xc4694a, WOOD = 0x9a6f48, DARKW = 0x4f3827, STEEL = 0xc4c8cc, STEEL2 = 0x8d9399, GREEN = 0x5f8a4e, CREAM = 0xf2eadb, SLATE = 0x2b2f2d;
  k.shell({ wall: WALL, ceiling: 0xf5ecdc, floor: 0xb89a74 });
  // terracotta tile band, herringbone-feel timber floor and brick feature wall behind the counter
  for (let i = 0; i < 14; i++) box(0.96, 0.014, 17.4, -6.5 + i, 0.004, -3, i % 2 ? 0xa98660 : 0xb89a74);
  box(W - 0.5, 1.1, 0.06, 0, 0.55, BACK + 0.15, TERRA);
  for (const sx of [-EDGE + 0.15, EDGE - 0.15]) box(0.06, 1.1, 17.4, sx, 0.55, -3, TERRA);
  for (let r = 0; r < 14; r++) for (let c = 0; c < 9; c++) box(1.3, 0.2, 0.05, -5.2 + c * 1.3 + (r % 2) * 0.65, 1.3 + r * 0.22, BACK + 0.16, (r + c) % 3 ? 0xb4553b : 0xa04a34);
  box(0.1, 3.3, 0.1, -6.5, 2.4, BACK + 0.2, DARKW);
  box(2.2, 0.03, 1.2, 0, 0.02, 5.0, 0x6b4a32);                                               // door mat
  // pendant lamps over the tables
  for (const [x, z] of [[-4.2, 2.8], [-1.6, 2.8], [-4.2, -0.8], [-1.6, -0.8], [1.6, 2.8], [4.2, 2.8]]) { cyl(0.01, 0.01, 1.3, x, 4.0, z, 0x222222, {}, 4); cyl(0.05, 0.3, 0.26, x, 3.3, z, 0xe8b04a, { e: 0xffd88a }, 12); }

  // ── counter ──
  solid(8.0, 1.05, 0.9, -0.4, 0.52, CZ, 0x5a3f2a);
  box(8.1, 0.06, 1.0, -0.4, 1.08, CZ, 0xe9e4d8);
  box(8.0, 0.4, 0.06, -0.4, 0.5, CZ + 0.47, TERRA);                                           // tiled front panel
  // espresso machine (three groups), grinders, cups, tip jar
  box(1.5, 0.45, 0.6, -2.3, 1.35, CZ - 0.05, STEEL); box(1.5, 0.08, 0.64, -2.3, 1.6, CZ - 0.05, STEEL2);
  for (const dx of [-0.45, 0, 0.45]) { cyl(0.05, 0.05, 0.14, -2.3 + dx, 1.12, CZ + 0.28, 0x2a2a2a, {}, 8); box(0.14, 0.03, 0.08, -2.3 + dx, 1.16, CZ + 0.34, 0x2a2a2a); }
  cyl(0.015, 0.015, 0.3, -3.05, 1.4, CZ + 0.28, STEEL2, { rx: 0.5 }, 5);
  for (const gx of [-0.6, -0.2]) { box(0.28, 0.5, 0.3, gx, 1.35, CZ - 0.1, 0x2b2b2b); cyl(0.1, 0.18, 0.28, gx, 1.72, CZ - 0.1, 0xc8a070, { a: 0.7 }, 10); }
  for (let i = 0; i < 3; i++) cyl(0.05, 0.04, 0.12, 0.6 + i * 0.12, 1.17, CZ + 0.1, 0xf4f0e8, {}, 10);
  for (let i = 0; i < 4; i++) cyl(0.05, 0.04, 0.1 + i * 0.01, 1.2 + i * 0.001, 1.17 + i * 0.1, CZ + 0.3, 0xf4f0e8, {}, 10);
  cyl(0.1, 0.1, 0.22, 2.2, 1.22, CZ + 0.3, 0xcfe8ee, { a: 0.55 }, 10); ball(0.04, 2.2, 1.3, CZ + 0.3, 0xe8c040);   // tip jar
  box(0.46, 0.28, 0.42, 3.2, 1.25, CZ, 0x2d3036); box(0.38, 0.2, 0.02, 3.2, 1.3, CZ + 0.22, 0x8fc4e8, { e: 0x4f94c8 });
  // glass pastry cabinet on the left end of the counter
  box(1.5, 0.9, 0.8, -3.8, 1.5, CZ + 0.02, 0xcfe8ee, { a: 0.35 }); box(1.5, 0.05, 0.85, -3.8, 1.05, CZ + 0.02, STEEL);
  for (const y of [1.25, 1.55]) { box(1.4, 0.03, 0.7, -3.8, y, CZ + 0.02, STEEL); for (let i = 0; i < 5; i++) cyl(0.1, 0.1, 0.07, -4.3 + i * 0.25, y + 0.06, CZ + 0.02, [0xe8c07a, 0xc88a52, 0xf0d9a0, 0xd8a0a0, 0xe8c07a][i], {}, 10); }
  // chalkboard menu above the counter, back-bar shelves and fridge
  box(5.2, 1.3, 0.08, -0.4, 2.75, BACK + 0.2, SLATE); box(5.3, 0.06, 0.1, -0.4, 3.43, BACK + 0.2, DARKW); box(5.3, 0.06, 0.1, -0.4, 2.07, BACK + 0.2, DARKW);
  for (let i = 0; i < 6; i++) box(1.8 - (i % 3) * 0.4, 0.04, 0.02, -2.2 + (i % 2) * 2.2, 3.15 - Math.floor(i / 2) * 0.25, BACK + 0.26, 0xf0eadc);
  text('Menu · Coffee · Brekkie · Lunch', -0.4, 3.78, BACK + 0.4, 'room');
  for (const y of [1.6, 2.0]) box(3.0, 0.05, 0.3, 5.0, y, BACK + 0.3, WOOD);
  for (let i = 0; i < 8; i++) cyl(0.06, 0.06, 0.2, 3.9 + i * 0.3, 1.72 + (i % 2) * 0.4, BACK + 0.3, [0xd8d0b8, 0x6f9a54, 0xc9553d][i % 3], {}, 8);
  solid(1.0, 1.9, 0.7, 5.6, 0.95, -10.6, 0xd9dde0); box(0.9, 1.7, 0.04, 5.6, 0.95, -10.22, 0xcfe8ee, { a: 0.4 });
  box(1.4, 2.2, 0.08, -6.0, 1.1, BACK + 0.12, 0x6a5a4a);                                      // kitchen door
  text(site.name, 0, 3.6, CZ - 0.4, 'room'); text('Order here', 0, 1.95, CZ - 0.1);

  // ── seating ──
  const table = (x, z) => {
    blocker(0.8, 0.8, x, z); cyl(0.05, 0.05, 0.74, x, 0.37, z, 0x3a3f44, {}, 8); cyl(0.22, 0.26, 0.03, x, 0.02, z, 0x3a3f44, {}, 14);   // pedestal table
    cyl(0.42, 0.42, 0.05, x, 0.78, z, 0xe9e0d0, {}, 20); cyl(0.04, 0.04, 0.2, x, 0.88, z, 0x8a7a6a, {}, 6); ball(0.06, x, 1.0, z, [0xd8452f, 0x7fb04a, 0xe8c63a][Math.abs(Math.round(x + z)) % 3]);
    for (const [dx, dz, ry] of [[-0.6, 0, Math.PI / 2], [0.6, 0, -Math.PI / 2], [0, 0.6, Math.PI], [0, -0.6, 0]]) {
      k.seat('table-'+x+'-'+z+'-'+dx+'-'+dz,'chair',x+dx,z+dz,Math.PI+ry);
      if (model('chair_B_wood', x + dx, z + dz, ry, { w: 0.46, d: 0.5, h: 0.86 })) continue;
      cyl(0.2, 0.2, 0.04, x + dx, 0.46, z + dz, WOOD, {}, 12); for (const a of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) box(0.03, 0.44, 0.03, x + dx + a[0], 0.22, z + dz + a[1], DARKW);
    }
  };
  for (const [x, z] of [[-4.2, 2.8], [-1.6, 2.8], [-4.2, -0.8], [-1.6, -0.8], [1.6, 2.8], [4.2, 2.8]]) table(x, z);
  // communal long table on the right
  solid(1.0, 0.78, 4.0, 4.4, 0.39, -1.4, WOOD); box(1.1, 0.06, 4.1, 4.4, 0.8, -1.4, 0xb08458);
  for (const z of [-2.8, -1.4, 0, ]) for (const sx of [-1, 1]) { k.seat('communal-'+z+'-'+sx,'stool',4.4+sx*.85,z,Math.PI+(sx>0?Math.PI/2:-Math.PI/2)); box(0.4, 0.05, 0.4, 4.4 + sx * 0.85, 0.5, z, DARKW); box(0.04, 0.5, 0.04, 4.4 + sx * 0.85, 0.25, z, 0x2a2a2a); }
  // window bench along the left wall with cushions
  solid(0.7, 0.5, 5.0, -6.35, 0.25, 1.0, WOOD); box(0.62, 0.12, 4.9, -6.35, 0.56, 1.0, 0x6a8f7a);
  for (const z of [-0.8,0.5,1.8,3.1]) k.seat('window-bench-'+z,'bench',-6.35,z,Math.PI*1.5);
  for (let i = 0; i < 4; i++) box(0.12, 0.34, 0.4, -6.5, 0.8, -0.8 + i * 1.3, [0xe8b04a, 0xc9553d, 0xf2eadb, 0x4f7fa6][i]);
  // water and condiment station, newspaper rack, plants
  solid(1.4, 0.95, 0.5, 3.6, 0.48, 5.25, WOOD); box(1.5, 0.05, 0.55, 3.6, 0.97, 5.25, 0xe9e4d8);
  cyl(0.1, 0.1, 0.3, 3.2, 1.15, 5.25, 0xcfe8ee, { a: 0.55 }, 10); for (let i = 0; i < 3; i++) cyl(0.04, 0.04, 0.1, 3.7 + i * 0.12, 1.05, 5.25, 0xf4f0e8, {}, 8);
  text('Water · Sugar · Napkins', 3.6, 1.65, 5.25);
  solid(0.5, 1.4, 0.3, -5.6, 0.7, 5.5, 0x5a4a3a); for (let i = 0; i < 3; i++) box(0.4, 0.3, 0.04, -5.6, 0.4 + i * 0.35, 5.33, [0xf0e6c8, 0xd9e8f0, 0xf0d6d0][i]);
  for (const [x, z, f] of [[-5.0, 5.88, 'pictureframe_medium'], [-2.8, 5.88, 'pictureframe_large_A'], [5.6, 5.88, 'pictureframe_small_B']]) model(f, x, z - 0.1, Math.PI, { h: 0.7 }, 1.9);
  for (const [x, z, f] of [[6.85, -4.0, 'pictureframe_medium'], [6.85, -1.0, 'pictureframe_small_A'], [6.85, 2.0, 'pictureframe_large_A']]) model(f, x - 0.1, z, -Math.PI / 2, { h: 0.7 }, 1.9);
  for (const [x, z] of [[-6.2, -4.2], [6.2, 3.8], [6.2, -8.0]]) { cyl(0.26, 0.2, 0.4, x, 0.2, z, 0xb4553b, {}, 10); for (let i = 0; i < 6; i++) ball(0.22, x + Math.cos(i) * 0.16, 0.8 + (i % 3) * 0.2, z + Math.sin(i) * 0.16, GREEN); }

  add('counter', 'Coffee counter', 'civic-ledger', 'Flat whites, brekkie and lunch. Order and pay at the counter, or open the Town Ledger.', CAFE_LAYOUT.staffUse.x, CAFE_LAYOUT.staffUse.z);
  add('menu', 'Chalkboard menu', 'info', 'Coffee, toasties, eggs and a pie of the day. The cook uses bread, eggs and milk delivered each morning; the coffee beans come in on the freight train.', -0.4, -4.3);
  add('machine', 'Espresso machine', 'info', 'A three-group machine and twin grinders. The barista grinds to order and steams the milk from the Dairy.', -2.3, -4.3);
  add('pastries', 'Pastry cabinet', 'info', 'The glass cabinet has the day\'s pastries from the Bakery down the road: cream buns, lamingtons and a few sausage rolls.', -3.8, -4.3);
  add('tables', 'Tables and window bench', 'info', 'Small tables for two or four, a long communal table and a cushioned bench in the window. Locals read the paper over a long black.', -2.9, 0.9);
  k.placedProps.push({ type: 'noticeboard', room: 0 });
  return k.finish({ staff: { pos: CAFE_LAYOUT.staff, use: CAFE_LAYOUT.staffUse } });
}
