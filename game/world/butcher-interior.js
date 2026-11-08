import { createKit, ROOM } from './interior-kit.js';

// The Butcher, laid out like a traditional country butcher:
//   • White-tiled walls with a red band, sawdust-pale lino, and a long glass-fronted refrigerated display
//     counter across the back (lamb, sausages, mince, chops) with a till, scales and a price board.
//   • Behind the counter: a rail of hanging carcasses, a heavy chopping block, a bandsaw, a mincer and a
//     cool-room door. A knife rack and apron hooks line the right wall; a pie warmer and sauce shelf sit by the door.
export const BUTCHER_LAYOUT = Object.freeze({ counterZ: -5.5, staff: { x: 0.8, z: -6.7 }, staffUse: { x: 0.8, z: -4.3 } });

export function buildButcherInterior(site, makeLabel, roomTitle = 'Butcher') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, solid, text, add, model } = k;
  const { W, BACK, EDGE } = ROOM;
  const CZ = BUTCHER_LAYOUT.counterZ;
  group.add(new THREE.HemisphereLight(0xffffff, 0x7a6a66, 2.2));
  const RED = 0xa8322c, TILE = 0xf2f2ee, STEEL = 0xc2c7cc, GLASS = 0xcfe8ee, MEAT = 0xc4504a, WOODD = 0x5a4332;
  k.shell({ wall: TILE, ceiling: 0xf6f6f2, floor: 0xd8d2c4 });
  for (let i = 0; i < 14; i++) for (let j = 0; j < 9; j++) box(0.96, 0.012, 1.9, -6.5 + i, 0.004, -11.4 + j * 1.9, (i + j) % 2 ? 0xd8d2c4 : 0xcbc4b4);
  box(W - 0.5, 0.35, 0.05, 0, 1.4, BACK + 0.14, RED);
  for (const sx of [-EDGE + 0.14, EDGE - 0.14]) box(0.05, 0.35, 17.4, sx, 1.4, -3, RED);
  for (const [x, z] of [[-4, 0], [4, 0], [-4, -4], [4, -4]]) box(1.6, 0.05, 0.4, x, 3.75, z, 0xfafafa, { e: 0xffffff });

  // ── refrigerated display counter, full width ──
  solid(8.8, 1.05, 0.9, 0, 0.52, CZ, 0xdfe3e4); box(8.9, 0.05, 1.0, 0, 1.08, CZ, STEEL); box(8.8, 0.5, 0.06, 0, 0.3, CZ + 0.47, RED);
  box(8.6, 0.5, 0.04, 0, 1.4, CZ + 0.42, GLASS, { a: 0.35 });
  for (let i = 0; i < 8; i++) {                                                                                              // trays of meat behind the glass
    const x = -3.9 + i * 1.1, c = [MEAT, 0xe0a090, 0x8a3a30, 0xd8805a][i % 4];
    box(0.9, 0.06, 0.5, x, 1.15, CZ + 0.1, 0xf4f4f0); box(0.8, 0.1, 0.4, x, 1.22, CZ + 0.1, c); box(0.25, 0.14, 0.02, x, 1.3, CZ + 0.36, 0x25301f);
  }
  for (let i = 0; i < 5; i++) cyl(0.04, 0.04, 0.5, 0.2 + i * 0.1, 1.2, CZ + 0.15, 0xe0a070, {}, 6).rotation.z = Math.PI / 2;      // sausage links
  box(0.4, 0.22, 0.4, -4.2, 1.24, CZ - 0.2, 0x2d3036); box(0.5, 0.05, 0.4, 3.6, 1.14, CZ - 0.2, 0x8d949a); cyl(0.2, 0.2, 0.06, 3.6, 1.22, CZ - 0.2, STEEL);   // till and scales
  box(2.4, 1.0, 0.05, -3.0, 2.8, BACK + 0.15, 0x25301f); text('Lamb · Chops · Sausages', -3.0, 2.8, BACK + 0.4);
  text(site.name, 0, 3.6, CZ - 0.4, 'room');

  // ── behind the counter: carcass rail, block, saw, mincer, cool room ──
  box(7.6, 0.08, 0.1, 0, 3.4, BACK + 1.6, STEEL); for (const x of [-3, -1.8, -0.6, 3.0, 4.2]) { cyl(0.01, 0.01, 0.4, x, 3.2, BACK + 1.6, STEEL, {}, 5); box(0.3, 1.1, 0.2, x, 2.5, BACK + 1.6, [0xe0a090, 0xd89080][Math.abs(x * 3 | 0) % 2]); }
  solid(1.0, 0.9, 1.0, -4.8, 0.45, -8.2, WOODD); box(0.9, 0.08, 0.9, -4.8, 0.94, -8.2, 0xc8a070); box(0.04, 0.3, 0.2, -4.6, 1.15, -8.2, STEEL);
  solid(0.9, 1.4, 0.7, 2.0, 0.7, -9.6, 0x9aa0a6); box(0.5, 0.06, 0.5, 2.0, 1.45, -9.6, STEEL);
  solid(0.7, 0.9, 0.6, 3.2, 0.45, -9.6, 0x9aa0a6); cyl(0.12, 0.2, 0.3, 3.2, 1.05, -9.6, STEEL, {}, 10);
  solid(2.0, 3.0, 0.4, 5.6, 1.5, BACK + 0.4, 0xdfe6e4); box(1.6, 2.4, 0.04, 5.6, 1.3, BACK + 0.64, 0xcfe8ee, { a: 0.4 });
  for (let i = 0; i < 14; i++) { cyl(0.012, 0.012, 0.3, -3.6 + i * 0.55, 3.2, BACK + 1.2, STEEL, {}, 5); box(0.12, 0.2, 0.08, -3.6 + i * 0.55, 3.0, BACK + 1.2, i % 2 ? 0xe0a090 : 0xb5504a); }   // butcher's hooks, sausages and bacon
  for (let i = 0; i < 10; i++) box(0.4, 0.04, 0.3, -6.2 + i * 0.12, 1.0 + (i % 3) * 0.01, 3.2, 0xf2f2ee);
  // ── knife rack, apron hooks, pie warmer and sauces by the door ──
  box(0.06, 0.12, 1.4, EDGE - 0.2, 1.7, -1.5, 0x4a3a30); for (let i = 0; i < 7; i++) box(0.03, 0.4, 0.05, EDGE - 0.24, 1.45, -2.0 + i * 0.2, STEEL);
  for (let i = 0; i < 3; i++) box(0.04, 0.8, 0.5, EDGE - 0.16, 1.1, 0.4 + i * 0.7, [0xf2f2ee, RED, 0xf2f2ee][i]);
  solid(1.2, 0.9, 0.7, 5.6, 0.45, 5.0, 0xdfe3e4); box(1.1, 0.5, 0.6, 5.6, 1.15, 5.0, GLASS, { a: 0.4 }); for (let i = 0; i < 4; i++) ball(0.13, 5.3 + i * 0.2, 1.0, 5.0, 0xc4904a);
  solid(1.4, 1.6, 0.4, -5.8, 0.8, 5.0, WOODD); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) box(0.12, 0.2, 0.12, -6.3 + c * 0.2, 0.3 + r * 0.4, 5.0, [RED, 0xe8c030, 0x5a3a20][(r + c) % 3]);
  model('pictureframe_small_B', 3.0, 5.88, Math.PI, { h: 0.5 }, 1.9);

  add('counter', 'Butcher counter', 'civic-ledger', 'Lamb comes from the Sheep Station and is cut to order here. Pay, or open the Town Ledger.', BUTCHER_LAYOUT.staffUse.x, BUTCHER_LAYOUT.staffUse.z);
  add('display', 'Cold display', 'info', 'Chops, mince, sausages and roasts sit on trays under the glass. The butcher refills them from the cool room as they sell.', -2.4, -4.3);
  add('block', 'Chopping block', 'info', 'The block has been planed flat every year for decades. Lamb arrives from the Sheep Station and is broken down back here.', -4.8, -4.3);
  add('knives', 'Knife rack', 'info', 'Cleavers, boning knives and a steel for sharpening hang along the right wall beside the aprons.', 5.4, -0.2);
  return k.finish({ staff: { pos: BUTCHER_LAYOUT.staff, use: BUTCHER_LAYOUT.staffUse } });
}
