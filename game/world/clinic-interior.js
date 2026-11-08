import { createKit, ROOM } from './interior-kit.js';

// The Clinic, laid out like a country GP clinic:
//   • Reception counter at the back with a sign-in tablet, a dispensing hatch and a medicine fridge behind.
//   • A waiting room on the left with rows of chairs, a kids' corner, a magazine rack and a health noticeboard.
//   • Two consulting rooms down the right side with partition walls and door gaps: an exam couch, a doctor's
//     desk, a basin and a privacy curtain; a hand-sanitiser station and scales near the entrance.
export const CLINIC_LAYOUT = Object.freeze({ counterZ: -5.5, staff: { x: -1.0, z: -6.7 }, staffUse: { x: -1.0, z: -4.3 } });

export function buildClinicInterior(site, makeLabel, roomTitle = 'Health clinic') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, solid, blocker, text, add, model } = k;
  const { W, BACK, EDGE } = ROOM;
  const CZ = CLINIC_LAYOUT.counterZ;
  group.add(new THREE.HemisphereLight(0xf4fffb, 0x8a9a96, 2.2));
  const TEAL = 0x5aa8a0, WHITE = 0xf4f6f6, GREYB = 0xcdd5d6, WOOD = 0xb89a74, GREEN = 0x5f8a4e, STEEL = 0xc4c8cc;
  k.shell({ wall: 0xe6f0ee, ceiling: 0xf7fbfa, floor: 0xcdd9d6 });
  for (let i = 0; i < 14; i++) for (let j = 0; j < 9; j++) box(0.96, 0.012, 1.9, -6.5 + i, 0.004, -11.4 + j * 1.9, (i + j) % 2 ? 0xcdd9d6 : 0xc2d0cc);
  box(W - 0.5, 1.0, 0.06, 0, 0.5, BACK + 0.15, TEAL);
  for (const sx of [-EDGE + 0.15, EDGE - 0.15]) box(0.06, 1.0, 17.4, sx, 0.5, -3, TEAL);
  box(2.2, 0.03, 1.2, 0, 0.02, 5.0, 0x7a8a88);
  for (const [x, z] of [[-4, 1], [-4, -3], [0, 1], [4, 3]]) box(1.6, 0.05, 0.4, x, 3.75, z, 0xffffff, { e: 0xffffff });
  box(1.2, 0.5, 0.05, 0, 2.9, 5.95, 0xe8f4f2); box(0.3, 0.06, 0.04, 0, 2.9, 5.9, 0xc43c32); box(0.06, 0.3, 0.04, 0, 2.9, 5.9, 0xc43c32);   // medical cross over the door inside

  // ── reception ──
  solid(7.6, 1.05, 0.9, -1.0, 0.52, CZ, WHITE); box(7.7, 0.06, 1.0, -1.0, 1.08, CZ, 0xcfe0de); box(7.6, 0.5, 0.06, -1.0, 0.3, CZ + 0.47, TEAL);
  box(0.4, 0.28, 0.04, -2.5, 1.35, CZ + 0.1, 0x2d3036); box(0.34, 0.2, 0.02, -2.5, 1.37, CZ + 0.13, 0x8fc4e8, { e: 0x4f94c8 });   // sign-in tablet
  box(0.46, 0.28, 0.42, -0.2, 1.25, CZ, 0x2d3036); box(0.38, 0.2, 0.02, -0.2, 1.3, CZ + 0.22, 0x8fc4e8, { e: 0x4f94c8 });
  box(0.7, 0.5, 0.05, -4.0, 1.45, CZ - 0.2, 0xcfe8ee, { a: 0.35 }); box(0.7, 0.04, 0.4, -4.0, 1.15, CZ - 0.1, STEEL);  // dispensing hatch
  cyl(0.08, 0.08, 0.2, 1.4, 1.2, CZ + 0.2, 0x3f8f5f, {}, 10); cyl(0.04, 0.04, 0.06, 1.4, 1.34, CZ + 0.2, STEEL, {}, 8);   // hand gel
  text(site.name, -1.0, 3.5, CZ - 0.4, 'room'); text('Reception · Bookings · Scripts', -1.0, 2.0, CZ - 0.1);
  // medicine fridge, records cabinets, kettle bench behind the counter
  solid(1.0, 1.8, 0.7, 5.2, 0.9, -10.6, 0xdde2e4); box(0.9, 1.6, 0.04, 5.2, 0.9, -10.22, 0xcfe8ee, { a: 0.4 });
  for (const x of [-5.4, -4.2, -3.0]) { solid(1.0, 1.6, 0.6, x, 0.8, BACK + 0.45, GREYB); for (let d = 0; d < 4; d++) { box(0.9, 0.34, 0.02, x, 0.25 + d * 0.38, BACK + 0.77, 0xdde4e6); box(0.2, 0.04, 0.03, x, 0.3 + d * 0.38, BACK + 0.8, STEEL); } }
  solid(1.6, 0.9, 0.5, 2.6, 0.45, BACK + 0.4, WOOD); cyl(0.07, 0.07, 0.16, 2.2, 1.0, BACK + 0.4, 0xe8e8e8, {}, 10);
  for (const y of [1.5, 2.0]) box(2.0, 0.04, 0.3, -1.0, y, BACK + 0.3, WOOD);
  for (let i = 0; i < 12; i++) box(0.12, 0.2, 0.1, -1.9 + i * 0.16, 1.62 + (i % 2) * 0.5, BACK + 0.3, [0xe8e8e8, 0x6aa0c8, 0xe8b830, 0xc87878][i % 4]);

  // ── waiting room (left) ──
  for (const z of [1.8, -0.2, -2.2]) for (const [x, n] of [[-5.6, 4]]) { for (let c = 0; c < n; c++) { if (!model('chair_C', x - 0.3, z - 0.9 + c * 0.6, Math.PI / 2, { w: 0.5, d: 0.55, h: 0.9 })) { box(0.55, 0.08, 0.5, x - 0.3 + c * 0, 0.45, z - 0.9 + c * 0.6, 0x3a6a8a); box(0.08, 0.5, 0.5, x - 0.55, 0.75, z - 0.9 + c * 0.6, 0x3a6a8a); box(0.04, 0.45, 0.04, x - 0.3, 0.22, z - 0.9 + c * 0.6, STEEL); } } blocker(0.7, 2.4, x - 0.4, z - 0.3); }
  for (const z of [1.8, -0.2, -2.2]) for (let c = 0; c < 4; c++) { if (!model('chair_C', -3.7, z - 0.9 + c * 0.6, -Math.PI / 2, { w: 0.5, d: 0.55, h: 0.9 })) { box(0.55, 0.08, 0.5, -3.7, 0.45, z - 0.9 + c * 0.6, 0x3a6a8a); box(0.08, 0.5, 0.5, -3.45, 0.75, z - 0.9 + c * 0.6, 0x3a6a8a); box(0.04, 0.45, 0.04, -3.7, 0.22, z - 0.9 + c * 0.6, STEEL); } } 
  blocker(0.7, 7.6, -3.65, -0.1);
  solid(0.8, 0.5, 0.8, -4.65, 0.25, 4.3, WOOD); for (let i = 0; i < 5; i++) box(0.3, 0.02, 0.22, -4.8 + (i % 3) * 0.1, 0.52 + i * 0.015, 4.3, [0xe8b830, 0xc87878, 0x6aa0c8, 0x7fb070, 0xe8e8e8][i]);   // magazines
  // kids' corner
  box(2.0, 0.03, 1.8, -5.6, 0.03, 4.0, 0xe8c840); for (const [x, z, c] of [[-6.2, 3.6, 0xc43c32], [-5.8, 4.5, 0x3a78c8], [-5.2, 3.8, 0x5f9a54]]) { box(0.3, 0.3, 0.3, x, 0.2, z, c); } cyl(0.25, 0.25, 0.04, -5.2, 0.5, 4.5, 0xe8e8e8, {}, 12);
  solid(0.4, 1.6, 0.7, 6.45, 0.8, 4.6, 0xe8ecec); box(0.3, 0.3, 0.02, 6.25, 1.2, 4.6, 0xcfe8ee, { a: 0.5 }); text('Hand sanitiser · Masks', 6.2, 1.9, 4.6);
  for (const [z, f] of [[-3.5, 'pictureframe_large_A'], [-1.0, 'pictureframe_medium'], [1.2, 'pictureframe_small_C']]) model(f, -EDGE + 0.1, z, Math.PI / 2, { h: 0.7 }, 1.65);
  model('cactus_small_A', -6.3, 5.4, 0, { w: 0.4, d: 0.4, h: 0.5 });
  box(2.0, 1.3, 0.06, -6.9, 2.2, 3.0, 0xe9e4d4); text('Flu clinic · Immunisations · Mental health', -6.8, 2.2, 3.1);
  cyl(0.3, 0.3, 0.05, -2.2, 0.03, 4.0, 0x5aa8a0, {}, 16); box(0.5, 0.05, 0.5, -2.2, 0.9, 4.0, STEEL); box(0.04, 0.9, 0.04, -2.2, 0.45, 4.0, STEEL);  // scales

  // ── consulting rooms (right): two rooms each 3.6 deep, partitions with door gaps ──
  const room = (z0, z1, label) => {
    const x0 = 2.2, x1 = EDGE - 0.1;
    box(x1 - x0, 0.1, z1 - z0, (x0 + x1) / 2, 0.01, (z0 + z1) / 2, 0xe0ece9);
    // partition along the x0 side (with a 1.1 door gap), and a dividing wall at z1 (front face of the room)
    const gz = (z0 + z1) / 2;
    solid(0.1, 2.4, (gz - 0.55) - z0, x0, 1.2, (z0 + gz - 0.55) / 2, WHITE); solid(0.1, 2.4, z1 - (gz + 0.55), x0, 1.2, (gz + 0.55 + z1) / 2, WHITE);
    solid(x1 - x0, 2.4, 0.1, (x0 + x1) / 2, 1.2, z0, WHITE);
    // couch, desk, chairs, basin, curtain, sharps bin
    solid(0.8, 0.6, 2.0, x1 - 0.7, 0.3, (z0 + z1) / 2 - 0.5, 0x3a6a8a); box(0.8, 0.12, 0.5, x1 - 0.7, 0.66, z0 + 1.2, 0x2a557a); box(0.84, 0.03, 2.0, x1 - 0.7, 0.62, (z0 + z1) / 2 - 0.5, 0xe8f0f0);
    solid(1.2, 0.76, 0.6, x0 + 1.4, 0.38, z0 + 0.6, WOOD); box(0.4, 0.03, 0.3, x0 + 1.2, 0.78, z0 + 0.6, 0xe8e8e8); box(0.3, 0.2, 0.04, x0 + 1.9, 0.92, z0 + 0.5, 0x2d3036);
    box(0.4, 0.4, 0.4, x0 + 1.4, 0.3, z0 + 1.35, 0x3a6a8a); box(0.4, 0.4, 0.4, x0 + 2.2, 0.3, z0 + 1.2, 0x3a6a8a);
    solid(0.5, 0.9, 0.4, x1 - 0.4, 0.45, z1 - 0.5, 0xe8ecec); cyl(0.14, 0.14, 0.04, x1 - 0.4, 0.95, z1 - 0.5, STEEL, {}, 10); box(0.02, 0.2, 0.02, x1 - 0.4, 1.1, z1 - 0.6, STEEL);
    box(0.04, 1.8, 1.4, x1 - 1.4, 1.1, (z0 + z1) / 2 + 0.9, 0xb0d8d0, { a: 0.55 });
    cyl(0.1, 0.1, 0.22, x0 + 0.35, 0.11, z1 - 0.3, 0xc43c32, {}, 10);
    text(label, (x0 + x1) / 2, 2.55, z0 + 0.2);
  };
  room(-11.4, -7.2, 'Consulting room 1'); room(-6.9, -2.7, 'Consulting room 2');

  add('counter', 'Reception counter', 'civic-ledger', 'Book an appointment, collect a script or open the Town Ledger. The clinic runs 8am to 5pm; the nurse and GP are paid by NSW Health.', CLINIC_LAYOUT.staffUse.x, CLINIC_LAYOUT.staffUse.z);
  add('waiting', 'Waiting room', 'info', 'Rows of chairs, a kids\' corner and a rack of magazines. Locals wait their turn here for flu shots and check-ups.', -2.2, 2.4);
  add('consult', 'Consulting rooms', 'info', 'Two consulting rooms with an exam couch, a desk and a basin. The GP sees one patient at a time behind the privacy curtain.', 1.3, -1.6);
  add('notices', 'Health noticeboard', 'info', 'Posters on flu shots, immunisation days, hand-washing and mental health supports. A hand-sanitiser station stands by the door.', -4.6, 2.2);
  return k.finish({ staff: { pos: CLINIC_LAYOUT.staff, use: CLINIC_LAYOUT.staffUse } });
}
