import { createKit, ROOM } from './interior-kit.js';
import { FLOOR_SURFACE_Y } from './floor-surfaces.js';

// The Community Bank, laid out like a small branch of a real retail bank:
//
//   • Entrance vestibule and an ATM bay on the right-hand wall, just inside the door.
//   • A roped queue lane that leads customers down the middle of the hall towards the tellers.
//   • Tellers at the back of the hall, far from the door: three windows behind a counter topped with
//     clear acrylic screens, deal trays, speaker grilles and frosted privacy dividers. Only one window
//     is staffed at a time, as in a quiet branch; the others show "window closed".
//   • Advice: two open banker desks along the customer path on the left, plus a glass-walled private
//     office for loans and business banking. Waiting lounge on the right.
//   • Staff side: back office, cash-handling kit, and a round vault door beside a wall of
//     safe-deposit boxes.
//
// Research notes: real branches place tellers away from the entrance for security and put advisers
// where customers pass them; teller counters carry barrier glass with deal trays; modern branches add
// private meeting rooms and ATMs; vaults sit behind the tellers.
export const BANK_LAYOUT = Object.freeze({
  counterZ: -5.4,
  windows: [-3.4, 0.6, 4.6],
  staff: { x: 0.6, z: -6.6 },
  staffUse: { x: 0.6, z: -4.2 },
});

export function buildBankInterior(site, makeLabel, roomTitle = 'Banking hall') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, torus, solid, blocker, text, add, mat, geo } = k;
  const { W, FRONT, BACK, EDGE } = ROOM;
  const CZ = BANK_LAYOUT.counterZ;

  group.add(new THREE.HemisphereLight(0xfff6e6, 0x6b6558, 2.0));
  const warm = new THREE.PointLight(0xffe6bd, 1.0, 15, 1.6); warm.position.set(0, 3.7, -0.5); group.add(warm);

  const PLASTER = 0xeee6d3, STONE = 0xdcd7cb, STONE2 = 0xc9c3b5, DARK = 0x4a3223, WOOD = 0x6e4a31, BRASS = 0xc9a24a,
    BLUE = 0x2f5d7c, CARPET = 0x40607a, MARBLE = 0xece8df, STEEL = 0xb9bec4, STEEL2 = 0x8d9399, GLASS = 0xcfe8ee,
    GREEN = 0x5f8a4e, LEATHER = 0x5b3a2a;

  k.shell({ wall: PLASTER, ceiling: 0xf3ecdc, frontSill: 1.4, sideSill: 1.4 });   // sills clear the 1.37 m panelling
  // Panelled dado (dark timber with a brass rail) round the hall; brand-blue frieze near the ceiling.
  for (const sx of [-EDGE + 0.15, EDGE - 0.15]) { box(0.06, 1.35, 17.6, sx, 0.67, -3, DARK); box(0.1, 0.05, 17.6, sx, 1.37, -3, BRASS); }
  box(W - 0.5, 1.35, 0.06, 0, 0.67, BACK + 0.15, DARK); box(W - 0.5, 0.05, 0.1, 0, 1.37, BACK + 0.15, BRASS);
  for (const sx of [-4, 4]) { box(5.7, 1.35, 0.06, sx, 0.67, FRONT - 0.15, DARK); box(5.7, 0.05, 0.1, sx, 1.37, FRONT - 0.15, BRASS); }
  box(W - 0.5, 0.16, 0.5, 0, 3.65, BACK + 0.5, BLUE);
  for (const sx of [-EDGE + 0.2, EDGE - 0.2]) box(0.06, 0.16, 17.6, sx, 3.65, -3, BLUE);

  // ── floors: stone with a subtle tile pattern; carpet in the advice and lounge zones; timber for staff ──
  box(W - 0.5, 0.02, 10.9, 0, 0.005, 0.65, STONE);
  const tiles = [];
  for (let ix = 0; ix < 14; ix++) for (let iz = 0; iz < 11; iz++) if ((ix + iz) % 2 === 0) tiles.push([-6.5 + ix, -4.5 + iz]);
  const tilePat = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat(STONE2), tiles.length);
  const m4 = new THREE.Matrix4(), qf = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  tiles.forEach(([x, z], i) => { m4.compose(new THREE.Vector3(x, FLOOR_SURFACE_Y.tilePattern, z), qf, new THREE.Vector3(1, 1, 1)); tilePat.setMatrixAt(i, m4); });
  group.add(tilePat);
  box(3.3, 0.024, 7.2, -5.2, 0.03, 2.3, CARPET);            // advice zone
  box(3.1, 0.024, 4.2, 5.3, 0.03, -1.5, CARPET);            // lounge
  box(W - 0.5, 0.02, 6.4, 0, 0.005, -8.95, 0x8a6d4e);       // staff side
  box(2.2, 0.03, 1.2, 0, 0.03, 5.0, BLUE);                  // door mat
  box(2.4, 0.02, 0.06, 0, 0.03, 3.0, BRASS);                // brass threshold strip across the entrance hall

  // ── ceiling: coffered grid of timber beams and downlights; ceiling cameras ──
  for (const x of [-3.5, 0, 3.5]) box(0.16, 0.22, 17.4, x, 4.5, -3, DARK);
  for (const z of [4, -0.2, -4.4, -8.6]) box(13.4, 0.22, 0.16, 0, 4.5, z, DARK);
  for (const x of [-5.25, -1.75, 1.75, 5.25]) for (const z of [1.9, -2.3]) cyl(0.18, 0.18, 0.04, x, 4.54, z, 0xfff0c8, { e: 0xffe2a0 }, 14);
  for (const x of [-3.5, 0, 3.5]) box(1.2, 0.05, 0.3, x, 4.52, -9.0, 0xfff6e0, { e: 0xfff0c0 });
  for (const [x, z] of [[-6.5, 5.3], [6.5, 5.3], [-6.5, -4.2], [6.5, -4.2]]) { box(0.2, 0.12, 0.2, x, 4.3, z, 0x222222); ball(0.12, x, 4.2, z, 0x303030, { s: [1, 0.7, 1] }); }

  // ── ATM bay on the right wall, just inside the door ──
  for (const z of [2.7, 4.2]) {
    solid(0.8, 1.75, 0.75, 6.4, 0.88, z, 0x3b4148);
    box(0.05, 0.38, 0.48, 6.0, 1.35, z, 0x6fb8e8, { e: 0x3f93c8 });                  // screen
    box(0.08, 0.2, 0.3, 6.0, 1.0, z, 0x2a2e33); box(0.04, 0.05, 0.28, 6.0, 0.86, z, 0x111111);   // keypad, cash slot
    box(0.04, 0.03, 0.12, 6.0, 1.12, z - 0.34, 0x111111);                              // card reader
    box(0.7, 0.3, 0.7, 6.4, 1.95, z, 0xf3f3f3, { e: 0xdfeeff });                       // lit header
    text('ATM', 5.95, 2.0, z);
  }
  box(0.05, 1.2, 0.5, 6.0, 0.8, 3.45, 0x5a636c);                                      // privacy divider between machines
  text('ATM', 5.4, 2.55, 3.45, 'room');

  // ── forms and brochure stand by the door, plant ──
  solid(0.6, 1.4, 0.4, -2.4, 0.7, 4.4, 0x7a7e84);
  for (let i = 0; i < 4; i++) box(0.5, 0.28, 0.04, -2.4, 0.35 + i * 0.3, 4.22, [BLUE, 0xe6d3a0, GREEN, 0xd5dbe0][i], { rx: -0.35 });
  solid(0.5, 0.5, 0.5, -6.4, 0.25, 5.3, 0x9b5a3c); ball(0.42, -6.4, 0.95, 5.3, GREEN, { s: [1, 1.2, 1] });

  // ── queue lane: brass stanchions and red velvet ropes leading to the tellers ──
  for (const x of [-1.15, 1.15]) {
    for (const z of [2.0, -1.6]) { cyl(0.15, 0.17, 0.04, x, 0.02, z, BRASS, {}, 12); cyl(0.03, 0.03, 0.95, x, 0.5, z, BRASS, {}, 8); ball(0.07, x, 1.0, z, BRASS); }
    cyl(0.02, 0.02, 3.6, x, 0.88, 0.2, 0x8a1f2b, { rx: Math.PI / 2 }, 6);
    blocker(0.08, 3.6, x, 0.2);
  }
  box(2.2, 0.01, 0.05, 0, 0.03, -2.2, 0xe2c14d);            // "wait here" line
  text('Please queue here for the next teller', 0, 1.6, 2.1);

  // ── advice desks along the path (left), each with banker, monitor and two customer chairs ──
  const desk = (x, z, label) => {
    solid(1.8, 0.75, 0.8, x, 0.375, z, WOOD); box(1.9, 0.05, 0.9, x, 0.78, z, 0x8b6a4a);
    box(0.5, 0.32, 0.04, x, 1.0, z - 0.1, 0x222428); box(0.5, 0.28, 0.02, x, 1.0, z - 0.08, 0x8fc4e8, { e: 0x4f94c8 }); box(0.08, 0.2, 0.08, x, 0.9, z - 0.12, 0x333333);
    box(0.3, 0.015, 0.1, x, 0.82, z + 0.05, 0x222222);                                          // keyboard
    box(0.22, 0.05, 0.08, x + 0.65, 0.84, z + 0.2, BRASS);                                      // name plate
    cyl(0.06, 0.05, 0.1, x - 0.7, 0.86, z - 0.1, 0xd0d4d8, {}, 8);                              // pen pot
    box(0.12, 0.1, 0.12, x - 0.35, 0.86, z + 0.2, 0xf4f4ee);                                    // tissue box
    for (const cx of [x - 0.5, x + 0.5]) { solid(0.5, 0.46, 0.5, cx, 0.23, z + 0.85, LEATHER); box(0.46, 0.5, 0.06, cx, 0.7, z + 1.08, LEATHER); }
    solid(0.55, 0.5, 0.55, x, 0.25, z - 0.85, 0x2c2f34); box(0.5, 0.55, 0.06, x, 0.75, z - 1.1, 0x2c2f34);
    text(label, x, 1.75, z - 0.2);
  };
  desk(-5.0, 3.4, 'Advice desk'); desk(-5.0, 1.0, 'Advice desk');

  // ── private office: glass walls with a door gap, meeting table and chairs ──
  const OX0 = -EDGE + 0.2, OX1 = -3.7, OZ0 = -4.6, OZ1 = -1.4;
  for (const [x0, x1, z0, z1] of [[OX0, OX1, OZ1 - 0.05, OZ1 + 0.05], [OX1 - 0.05, OX1 + 0.05, OZ0, -3.6], [OX1 - 0.05, OX1 + 0.05, -2.6, OZ1]]) {
    const w = x1 - x0, d = z1 - z0;
    box(w, 2.4, d, (x0 + x1) / 2, 1.2, (z0 + z1) / 2, GLASS, { a: 0.22 }); blocker(Math.max(w, 0.1), Math.max(d, 0.1), (x0 + x1) / 2, (z0 + z1) / 2);
    box(w + (w > d ? 0 : 0.06), 0.06, d + (d > w ? 0 : 0.06), (x0 + x1) / 2, 2.43, (z0 + z1) / 2, DARK);
    box(w + (w > d ? 0 : 0.06), 0.05, d + (d > w ? 0 : 0.06), (x0 + x1) / 2, 0.03, (z0 + z1) / 2, DARK);
  }
  box(0.06, 2.4, 0.06, OX1, 1.2, -3.6, DARK); box(0.06, 2.4, 0.06, OX1, 1.2, -2.6, DARK);                     // door posts
  box(0.06, 2.4, 0.06, OX0 + 0.0, 1.2, OZ1, DARK); box(0.06, 2.4, 0.06, OX1, 1.2, OZ1, DARK);
  box(3.1, 0.02, 3.0, -5.3, 0.03, -3.0, 0x7a8a96);                                                        // office rug
  solid(1.3, 0.74, 1.3, -5.3, 0.37, -3.0, 0x8b6a4a); cyl(0.65, 0.65, 0.05, -5.3, 0.77, -3.0, 0x9a7656, {}, 20);
  for (const [cx, cz] of [[-6.2, -3.0], [-5.3, -3.9], [-5.3, -2.1], [-4.4, -3.0]]) solid(0.45, 0.46, 0.45, cx, 0.23, cz, LEATHER);
  box(0.4, 0.015, 0.3, -5.3, 0.82, -3.0, 0xf6f3ec); box(0.12, 0.2, 0.12, -5.0, 0.9, -3.2, GREEN);
  box(2.0, 1.1, 0.04, -5.4, 1.7, -4.55, 0xf7f7f2);                                                          // whiteboard on the counter-side wall
  text('Loans & business banking', -5.3, 2.7, -1.4);

  // ── waiting lounge (right): sofa, armchair, coffee table, magazines, plant ──
  solid(0.9, 0.5, 2.1, 6.3, 0.25, -1.6, LEATHER); box(0.16, 0.6, 2.1, 6.72, 0.78, -1.6, LEATHER); box(0.8, 0.12, 1.9, 6.3, 0.56, -1.6, 0x6b4634);
  solid(0.8, 0.45, 0.8, 5.3, 0.22, 0.2, LEATHER); box(0.14, 0.55, 0.8, 5.72, 0.72, 0.2, LEATHER);
  solid(0.7, 0.4, 1.0, 5.1, 0.2, -1.6, 0x8b6a4a); box(0.62, 0.02, 0.4, 5.1, 0.43, -1.5, 0xc0553d); box(0.5, 0.02, 0.3, 5.1, 0.45, -1.7, BLUE);
  solid(0.5, 0.5, 0.5, 6.45, 0.25, -3.8, 0x9b5a3c); ball(0.4, 6.45, 0.95, -3.8, GREEN, { s: [1, 1.2, 1] });
  text('Waiting area', 5.3, 1.7, -0.7);

  // ── THE TELLER COUNTER ──
  blocker(W - 0.24, 1.1, 0, CZ);
  box(W - 0.24, 1.1, 1.1, 0, 0.55, CZ, WOOD);
  box(W - 0.3, 0.9, 0.06, 0, 0.55, CZ + 0.58, DARK);                                    // panelled front
  for (let i = 0; i < 10; i++) box(1.2, 0.7, 0.03, -6.2 + i * 1.38, 0.55, CZ + 0.62, 0x7a5338);
  box(W - 0.1, 0.06, 1.3, 0, 1.13, CZ, MARBLE);
  box(W - 0.1, 0.04, 0.06, 0, 1.17, CZ + 0.62, BRASS);
  const windows = BANK_LAYOUT.windows, open = 1;
  windows.forEach((c, i) => {
    const staffed = i === open;
    // clear acrylic screen with brass frame, speaker grille and a deal tray
    box(2.7, 1.0, 0.03, c, 1.68, CZ - 0.12, GLASS, { a: 0.2 });
    box(2.76, 0.04, 0.06, c, 2.19, CZ - 0.12, BRASS); box(2.76, 0.04, 0.06, c, 1.17, CZ - 0.12, BRASS);
    for (const sx of [-1.36, 1.36]) box(0.04, 1.04, 0.06, c + sx, 1.68, CZ - 0.12, BRASS);
    cyl(0.1, 0.1, 0.02, c - 0.5, 1.55, CZ - 0.1, 0x2a2a2a, { rx: Math.PI / 2 }, 14);
    box(0.6, 0.03, 0.42, c + 0.55, 1.17, CZ + 0.02, STEEL); box(0.5, 0.025, 0.32, c + 0.55, 1.19, CZ + 0.02, STEEL2);
    cyl(0.008, 0.008, 0.35, c - 0.95, 1.2, CZ + 0.3, BRASS, { rz: Math.PI / 2 }, 5); cyl(0.012, 0.012, 0.12, c - 0.78, 1.21, CZ + 0.3, 0x1a3a8a, { rz: Math.PI / 2 }, 6);   // pen on a chain
    // number plate above each window
    box(0.42, 0.42, 0.06, c, 2.75, CZ + 0.1, 0x1b1d22); box(0.34, 0.34, 0.02, c, 2.75, CZ + 0.14, staffed ? 0x7be08f : 0xe06a6a, { e: staffed ? 0x44b05a : 0xb03a3a });
    text(String(i + 1), c, 2.75, CZ + 0.25, 'room');
    text(staffed ? 'Window open' : 'Window closed', c, 2.3, CZ + 0.22);
    // staff side: monitor, keyboard, cash drawer, receipt printer, stool
    box(0.55, 0.36, 0.04, c, 1.5, CZ - 0.4, 0x1c1d20); box(0.5, 0.3, 0.02, c, 1.5, CZ - 0.38, staffed ? 0x8fc4e8 : 0x15171a, staffed ? { e: 0x4f94c8 } : {}); box(0.1, 0.2, 0.1, c, 1.3, CZ - 0.42, 0x333333);
    box(0.4, 0.015, 0.14, c, 1.17, CZ - 0.25, 0x222222);
    box(0.5, 0.16, 0.4, c + 1.0, 1.22, CZ - 0.3, 0x40454c); box(0.18, 0.12, 0.14, c - 0.9, 1.2, CZ - 0.3, 0xe8e8e0);
    cyl(0.22, 0.2, 0.05, c, 0.75, CZ - 1.1, 0x2c2f34, {}, 12); cyl(0.04, 0.04, 0.7, c, 0.38, CZ - 1.1, 0x555555, {}, 6);
    // floor-standing cash trolley under the counter on staff side
    box(0.6, 0.5, 0.4, c + 1.0, 0.25, CZ - 0.9, 0x40454c);
  });
  // frosted privacy dividers between windows, standing out into the hall
  for (const dx of [-1.4, 2.6]) { box(0.04, 1.1, 0.95, dx, 1.65, CZ + 1.0, 0xf2f6f8, { a: 0.55 }); blocker(0.06, 0.95, dx, CZ + 1.0); }
  // counting machine and coin counter at the open window
  box(0.5, 0.3, 0.45, 2.0, 1.28, CZ - 0.45, 0x5a636c); box(0.34, 0.06, 0.28, 2.0, 1.46, CZ - 0.45, 0x2a2e33);
  box(0.9, 0.04, 0.5, 0.6 + 1.4, 1.2, CZ - 0.9, 0x222428);
  // header beam: sign, hours board and a wall clock
  box(W - 0.4, 0.9, 0.28, 0, 4.0, -6.2, DARK);
  box(5.0, 0.62, 0.05, 0, 4.0, -6.04, BLUE); box(5.1, 0.7, 0.04, 0, 4.0, -6.06, BRASS);
  text(site.name, 0, 4.0, -6.0, 'room');
  box(2.4, 0.62, 0.05, -4.6, 4.0, -6.04, 0x1b1d22); box(2.4, 0.62, 0.05, 4.6, 4.0, -6.04, 0x1b1d22);
  text('Open 9:00 – 4:00', -4.6, 4.1, -5.98); text('Weekdays', -4.6, 3.85, -5.98);
  text('Savings · Loans · Cash', 4.6, 4.1, -5.98); text('Town Credits', 4.6, 3.85, -5.98);
  cyl(0.3, 0.3, 0.05, -6.2, 3.3, -5.97, 0xf3f0e8, { rx: Math.PI / 2 }, 22); box(0.02, 0.22, 0.02, -6.2, 3.38, -5.94, 0x222222); box(0.14, 0.02, 0.02, -6.14, 3.3, -5.94, 0x222222);
  text('Teller counter', 0.6, 1.95, CZ + 0.55);
  k.placedProps.push({ type: 'counter', room: 0 });

  // ── VAULT door, safe-deposit wall and back office (staff side, visible over the counter) ──
  const vz = BACK + 0.45, vx = 4.4, vy = 1.55;
  box(3.3, 3.3, 0.3, vx, vy, BACK + 0.2, 0x5b6066);
  cyl(1.5, 1.5, 0.45, vx, vy, vz, 0x6a6f75, { rx: Math.PI / 2 }, 28);
  cyl(1.22, 1.22, 0.4, vx, vy, vz + 0.2, 0xaeb3b9, { rx: Math.PI / 2 }, 28);
  torus(0.62, 0.05, vx, vy, vz + 0.42, STEEL2);
  for (let a = 0; a < 6; a++) { const ang = a * Math.PI / 3; box(1.2, 0.07, 0.06, vx, vy, vz + 0.42, 0x6a6f75, { rz: ang }); }
  cyl(0.18, 0.18, 0.14, vx, vy, vz + 0.46, BRASS, { rx: Math.PI / 2 }, 14);
  for (let a = 0; a < 12; a++) { const ang = a * Math.PI / 6; cyl(0.06, 0.06, 0.1, vx + Math.cos(ang) * 1.32, vy + Math.sin(ang) * 1.32, vz + 0.22, STEEL2, { rx: Math.PI / 2 }, 6); }
  cyl(0.24, 0.24, 0.08, vx - 0.95, vy + 0.95, vz + 0.44, 0x222428, { rx: Math.PI / 2 }, 16); ball(0.05, vx - 0.95, vy + 0.95, vz + 0.5, BRASS);        // time-lock dial
  box(0.22, 0.32, 0.06, vx + 1.0, vy - 0.3, vz + 0.44, 0x2a2e33); box(0.14, 0.1, 0.02, vx + 1.0, vy - 0.15, vz + 0.48, 0x8fe0a8, { e: 0x4fb88a });         // keypad
  for (const hy of [-0.8, 0.8]) cyl(0.07, 0.07, 0.3, vx - 1.5, vy + hy, vz + 0.15, 0x5b6066, {}, 8);                                                          // hinges
  text('Vault', vx, 3.55, BACK + 0.9, 'room');
  // wall of safe-deposit boxes
  const cols = 10, rows = 8, bx0 = -5.8, bw = 0.42, bh = 0.3;
  box(cols * bw + 0.2, rows * bh + 0.2, 0.1, bx0 + (cols - 1) * bw / 2, 0.3 + (rows - 1) * bh / 2 + 0.15, BACK + 0.2, 0x4a4f55);
  const doorsM = new THREE.InstancedMesh(geo('sdb', () => new THREE.BoxGeometry(0.38, 0.26, 0.04)), mat(0xc9a24a), cols * rows);
  const holesM = new THREE.InstancedMesh(geo('sdh', () => new THREE.CylinderGeometry(0.02, 0.02, 0.03, 6)), mat(0x1a1a1a), cols * rows);
  const qh = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), one = new THREE.Vector3(1, 1, 1), id = new THREE.Quaternion();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, x = bx0 + c * bw, y = 0.3 + r * bh + 0.15;
    m4.compose(new THREE.Vector3(x, y, BACK + 0.28), id, one); doorsM.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x + 0.1, y, BACK + 0.31), qh, one); holesM.setMatrixAt(i, m4);
  }
  group.add(doorsM, holesM);
  text('Safe deposit boxes', bx0 + 1.8, 3.3, BACK + 0.6);
  // back office: two desks with monitors, filing cabinets, water cooler, photocopier, ledger shelves
  for (const dx of [-5.2, -2.4]) {
    box(1.6, 0.74, 0.8, dx, 0.37, -8.2, WOOD); box(1.7, 0.05, 0.9, dx, 0.77, -8.2, 0x8b6a4a);
    box(0.5, 0.32, 0.04, dx, 1.0, -8.4, 0x222428); box(0.46, 0.28, 0.02, dx, 1.0, -8.38, 0x8fc4e8, { e: 0x4f94c8 });
    cyl(0.24, 0.22, 0.06, dx, 0.5, -7.4, 0x2c2f34, {}, 12); cyl(0.04, 0.04, 0.45, dx, 0.25, -7.4, 0x555555, {}, 6);
  }
  for (let i = 0; i < 3; i++) { box(0.5, 1.3, 0.6, -6.5, 0.65, -7.0 - i * 0.6, 0x7e848a); box(0.46, 0.02, 0.02, -6.22, 0.9, -7.0 - i * 0.6, STEEL); }
  cyl(0.2, 0.2, 0.9, -6.5, 0.45, -10.0, 0xdfe6ea, {}, 12); cyl(0.17, 0.17, 0.5, -6.5, 1.15, -10.0, GLASS, { a: 0.5 }, 12);
  box(0.9, 1.0, 0.7, 1.4, 0.5, -11.0, 0xdcdcd6); box(0.8, 0.1, 0.6, 1.4, 1.05, -11.0, 0x333333);
  for (const y of [1.2, 1.8, 2.4]) { box(0.4, 0.04, 2.6, 6.7, y, -8.6, WOOD); for (let i = 0; i < 9; i++) box(0.3, 0.3, 0.2, 6.7, y + 0.17, -9.8 + i * 0.28, [0x3f6a8a, 0x7a3f3a, 0x4f6a4a, 0xc9a24a][i % 4]); }

  // ── interactions ──
  add('counter', 'Teller counter', 'civic-ledger', 'Deposit and withdraw Town Credits, check your savings, and see the Town Ledger.', 0.6, -4.2);
  add('atm', 'ATM', 'info', 'Two cash machines sit just inside the door for quick withdrawals and balance checks. For deposits and savings, use the teller counter.', 5.4, 3.45);
  add('advice', 'Advice desks', 'info', 'Bankers sit at open desks along the customer path to help with accounts and savings goals. Villagers keep their savings here too.', -3.0, 2.2);
  add('loans', 'Loans & business office', 'info', 'The glass-walled office is for private conversations about loans and business banking, away from the queue.', -2.9, -3.1);
  add('vault', 'Vault & safe deposit boxes', 'info', 'The vault door and the wall of safe-deposit boxes sit behind the tellers, out of customers\' reach. The town\'s savings and the council\'s treasury are recorded here.', 4.6, -4.2);
  add('lounge', 'Waiting area', 'info', 'A sofa and an armchair for waiting your turn. Tellers are at the back of the hall, so everyone passes the advice desks on the way.', 4.3, -1.6);
  k.placedProps.push({ type: 'noticeboard', room: 0 });

  return k.finish({ staff: { pos: BANK_LAYOUT.staff, use: BANK_LAYOUT.staffUse } });
}
