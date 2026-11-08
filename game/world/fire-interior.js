import { createKit, ROOM } from './interior-kit.js';
import { glassMesh } from './windows.js';

// Fire & Rescue: a country Fire and Rescue NSW station with retained (on-call) firefighters, laid out
// the way new and refurbished FRNSW stations are (Ulladulla, Wentworth Falls, Kingscliff, Cessnock):
//   • A twin engine bay behind the two roller doors seen from the street, with the personnel door
//     between them. Bay A holds the Class 2 pumper on its exhaust-extraction hose and shore-power lead;
//     bay B the hazmat trailer, a hose-drying rack and the workbench. Yellow lines keep a walkway clear.
//   • "Clean firefighter" zoning behind the bay: the dirty PPE and decontamination room (gear lockers,
//     washer-extractor, drying cabinet, decon shower) and the breathing-apparatus room (sets on charge,
//     cylinder fill station, test bench) open off the bay; the watchroom is the airlock to the clean
//     mess and training room, where turnout gear never goes.
//   • The watchroom has the turnout printer, radio console, pager chargers, a district map with
//     hydrants, and the station board with today's fire danger rating (src/ui/townpanels.js civicPanel).
export const FIRE_LAYOUT = Object.freeze({
  bayBack: -3, ppeX: -2.2, waX: 2.2, messZ: -7.5,
  staff: { x: 2.2, z: 1.0 }, staffUse: { x: 2.2, z: 2.6 },
});

export function buildFireInterior(site, makeLabel, roomTitle = 'Fire station') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, torus, solid, text, add, model, blocker } = k;
  const { W, D, FRONT, BACK, EDGE, WALL } = ROOM;
  const H = 4.6, { bayBack: BB, ppeX: PX, waX: WX, messZ: MZ } = FIRE_LAYOUT;
  const RED = 0xb8322c, WALLC = 0xeceae4, BAYWALL = 0xd9d6cf, YELLOW = 0xe7c12e, STEEL = 0xb7bdc3, DARK = 0x2b2f35;
  const GOLD = 0xc9a24a, HELMET = 0xf2f2ee, GLASS = 0xcfe8ee, WOOD = 0x8a6a4a;
  group.add(new THREE.HemisphereLight(0xffffff, 0x6a6460, 2.1));
  const panes = [], windows = [];

  // ── floor, ceiling and outer walls ──
  box(W, 0.24, FRONT - BB, 0, -0.12, (FRONT + BB) / 2, 0x8e9297);                 // sealed concrete engine bay
  box(W, 0.24, BB - BACK, 0, -0.12, (BB + BACK) / 2, 0xbfc3bd);                    // non-slip vinyl behind it
  box(W, 0.27, D, 0, H + 0.1, -3, 0xf1efe9);
  solid(W, H, WALL, 0, H / 2, BACK, WALLC);
  // Side walls, with the shell's windows in the bay (same openings as every High Street building).
  const SILL = 1.4, HEAD = 2.9, WZ0 = -2.5, WZ1 = 1.5;
  for (const x of [-EDGE, EDGE]) {
    solid(WALL, SILL, D, x, SILL / 2, -3, BAYWALL);
    box(WALL, H - SILL, WZ0 - BACK, x, (H + SILL) / 2, (BACK + WZ0) / 2, BAYWALL);
    box(WALL, H - SILL, FRONT - WZ1, x, (H + SILL) / 2, (WZ1 + FRONT) / 2, BAYWALL);
    box(WALL, H - HEAD, WZ1 - WZ0, x, (H + HEAD) / 2, (WZ0 + WZ1) / 2, BAYWALL);
    panes.push({ w: 0.04, h: HEAD - SILL, d: WZ1 - WZ0, x, y: (SILL + HEAD) / 2, z: (WZ0 + WZ1) / 2 });
    windows.push({ axis: 'x', at: x, s: WZ0, e: WZ1, out: Math.sign(x) });
  }
  // Front wall: two sectional bay doors (closed, with a row of vision panels) either side of the
  // personnel door, as on the street front. Door slats, a red stripe and a "keep clear" line.
  for (const [x0, x1] of [[-EDGE, -6.3], [-1.7, -1.05], [1.05, 1.7], [6.3, EDGE]]) solid(x1 - x0, H, WALL, (x0 + x1) / 2, H / 2, FRONT, RED);
  box(2.1, H - 2.4, WALL, 0, (H + 2.4) / 2, FRONT, RED);
  for (const dx of [-4, 4]) {
    const DW = 4.6, VZ0 = 2.3, VZ1 = 2.75;
    box(DW, H - 4.1, WALL, dx, (H + 4.1) / 2, FRONT, RED);
    solid(DW, VZ0, 0.12, dx, VZ0 / 2, FRONT - 0.05, 0xe8e4dc);
    box(DW, 4.1 - VZ1, 0.12, dx, (4.1 + VZ1) / 2, FRONT - 0.05, 0xe8e4dc);
    for (let i = 1; i < 8; i++) if (Math.abs(i * 0.5 - (VZ0 + VZ1) / 2) > 0.3) box(DW, 0.03, 0.02, dx, i * 0.5, FRONT - 0.12, 0xb8b4ac);
    for (let i = 0; i <= 4; i++) box(0.12, VZ1 - VZ0, 0.12, dx - DW / 2 + 0.06 + i * (DW - 0.12) / 4, (VZ0 + VZ1) / 2, FRONT - 0.05, 0xe8e4dc);
    panes.push({ w: DW, h: VZ1 - VZ0, d: 0.04, x: dx, y: (VZ0 + VZ1) / 2, z: FRONT - 0.05 });
    windows.push({ axis: 'z', at: FRONT, s: dx - DW / 2, e: dx + DW / 2, out: 1 });
    box(0.3, 0.12, 0.08, dx, 1.0, FRONT - 0.16, DARK);                                  // door handle bar
    box(DW, 0.02, 0.15, dx, 0.011, FRONT - 0.5, YELLOW);                                // keep-clear line inside the door
    const bx = dx + Math.sign(dx) * (DW / 2 + 0.3);                                          // door push-buttons, on the outer pier
    box(0.25, 0.25, 0.12, bx, 1.4, FRONT - 0.18, 0x3a3d42);
    ball(0.05, bx, 1.46, FRONT - 0.25, 0x3cc04a); ball(0.05, bx, 1.34, FRONT - 0.25, 0xd8322c);
  }
  box(2.15, 0.06, 0.6, 0, 0.02, FRONT, 0xb9b8ae);
  group.add(glassMesh(panes));

  // ── partitions: bay | PPE + decon | BA room | watchroom / mess ──
  const doorGaps = [[-4.6, 1.2], [0, 1.2], [4.6, 1.2]];
  let x = -EDGE;
  for (const [c, w] of doorGaps) {
    if (c - w / 2 > x) solid(c - w / 2 - x, H, 0.16, (x + c - w / 2) / 2, H / 2, BB, WALLC);
    box(w, H - 2.3, 0.16, c, (H + 2.3) / 2, BB, WALLC);
    for (const s of [-1, 1]) box(0.06, 2.3, 0.2, c + s * w / 2, 1.15, BB, 0x8a8f96);              // door frames
    x = c + w / 2;
  }
  solid(EDGE - x, H, 0.16, (x + EDGE) / 2, H / 2, BB, WALLC);
  for (const px of [PX, WX]) solid(0.16, H, BB - BACK, px, H / 2, (BB + BACK) / 2, WALLC);
  solid(2.7 - WX, H, 0.16, (WX + 2.7) / 2, H / 2, MZ, WALLC);                                       // watchroom | mess, door at x 3.3
  box(1.2, H - 2.3, 0.16, 3.3, (H + 2.3) / 2, MZ, WALLC);
  solid(EDGE - 3.9, H, 0.16, (3.9 + EDGE) / 2, H / 2, MZ, WALLC);
  // Signs over the doors from the bay.
  for (const [c, words, col] of [[-4.6, 'PPE & DECON · DIRTY ZONE', 0xd8322c], [0, 'BREATHING APPARATUS', 0x2a6db0], [4.6, 'WATCHROOM · CLEAN ZONE', 0x2e8b57]]) {
    box(1.9, 0.32, 0.03, c, 2.6, BB + 0.1, col);
    text(words, c, 2.95, BB + 0.3, 'prop');
  }

  // ── engine bay ──
  // Lighting: long fluorescent battens and the station-alerting beacon over the doors.
  for (const lx of [-4, 0, 4]) for (const lz of [-1, 3]) box(0.25, 0.06, 2.4, lx, H - 0.08, lz, 0xffffff, { e: 0xffffff });
  cyl(0.12, 0.14, 0.2, 0, 2.8, FRONT - 0.25, 0xd8322c, { e: 0x601010 });
  box(0.5, 0.35, 0.05, -1.4, 3.1, FRONT - 0.15, DARK); text('Station alerting', -1.4, 3.6, FRONT - 0.5, 'prop');
  // Yellow walkway lines down the bay and round the pumper.
  for (const lx of [-1.2, 1.2]) box(0.12, 0.012, FRONT - BB - 0.4, lx, 0.006, (FRONT + BB) / 2, YELLOW);
  for (let i = 0; i < 6; i++) box(0.5, 0.013, 0.12, 0, 0.007, BB + 0.8 + i * 1.5, YELLOW);
  // Floor drains (the bay is hosed down after every job).
  for (const dz of [0, 4]) box(1.4, 0.014, 0.18, -4, 0.008, dz - 0.2, 0x4a4e54);

  // Bay A: the Class 2 pumper, nose to the door. Red body, white roof and bumper, roller-shutter
  // lockers down the side, rear pump panel, hose reels, ladders on the roof gantry and blue lights.
  const TX = -4, TZ0 = -1.6, TZ1 = 5.4, TW = 2.5;
  const tz = (TZ0 + TZ1) / 2;
  solid(TW, 0.5, TZ1 - TZ0, TX, 0.85, tz, DARK);                                                      // chassis
  for (const wz of [TZ1 - 1.2, TZ0 + 1.3, TZ0 + 2.6]) for (const s of [-1, 1]) { cyl(0.5, 0.5, 0.36, TX + s * (TW / 2 - 0.12), 0.5, wz, 0x1b1d20, { rz: Math.PI / 2 }, 16); cyl(0.26, 0.26, 0.38, TX + s * (TW / 2 - 0.12), 0.5, wz, STEEL, { rz: Math.PI / 2 }, 10); }
  box(TW, 2.0, 2.2, TX, 2.1, TZ1 - 1.1, RED);                                                          // crew cab
  box(TW - 0.3, 0.8, 0.04, TX, 2.55, TZ1 - 0.0, GLASS, { a: 0.6 });                                     // windscreen
  for (const s of [-1, 1]) box(0.04, 0.7, 1.2, TX + s * TW / 2, 2.5, TZ1 - 1.3, GLASS, { a: 0.6 });     // side windows
  box(TW, 0.2, 2.2, TX, 3.2, TZ1 - 1.1, 0xf4f4f0);                                                       // white cab roof
  box(1.4, 0.12, 0.25, TX, 3.36, TZ1 - 0.4, 0x2a5cd8, { e: 0x1838a0 });                                   // light bar
  for (const s of [-0.45, 0.45]) box(0.38, 0.13, 0.26, TX + s, 3.37, TZ1 - 0.4, 0xd83030, { e: 0x701010 });
  box(TW + 0.05, 0.35, 0.25, TX, 0.95, TZ1 + 0.05, 0xf4f4f0);                                           // bumper
  for (const s of [-1, 1]) { box(0.3, 0.15, 0.05, TX + s * 0.9, 1.35, TZ1 + 0.01, 0xfff6c8, { e: 0x807040 }); }
  box(1.4, 0.18, 0.04, TX, 1.7, TZ1 + 0.01, 0xf4f4f0); text('FIRE RESCUE', TX, 1.7, TZ1 + 0.25, 'prop');
  box(TW, 2.3, TZ1 - TZ0 - 2.2, TX, 2.25, (TZ0 + TZ1 - 2.2) / 2, RED);                                  // pump and locker body
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {                                                 // roller-shutter lockers
    const lz = TZ0 + 0.6 + i * 1.45;
    box(0.04, 1.6, 1.3, TX + s * (TW / 2 + 0.01), 2.05, lz, 0xc8ccd0);
    for (let j = 0; j < 8; j++) box(0.05, 0.02, 1.28, TX + s * (TW / 2 + 0.02), 1.3 + j * 0.2, lz, 0x9aa0a6);
  }
  box(TW - 0.2, 1.3, 0.05, TX, 2.0, TZ0 - 0.01, 0xc8ccd0);                                              // rear pump panel
  for (let i = 0; i < 4; i++) cyl(0.09, 0.09, 0.06, TX - 0.75 + i * 0.5, 1.75, TZ0 - 0.05, [0xd8322c, 0x2a6db0, 0xe7c12e, 0x2e8b57][i], { rx: Math.PI / 2 }, 10);
  for (let i = 0; i < 3; i++) cyl(0.07, 0.07, 0.08, TX - 0.5 + i * 0.5, 2.35, TZ0 - 0.05, 0xf4f4f0, { rx: Math.PI / 2 }, 10);  // gauges
  for (const s of [-1, 1]) torus(0.42, 0.11, TX + s * 0.85, 1.25, TZ0 + 0.35, 0xd8322c, { ry: Math.PI / 2 });   // hose reels
  box(TW - 0.3, 0.08, 4.4, TX, 3.45, (TZ0 + TZ1 - 2.2) / 2, STEEL);                                      // roof gantry
  for (const s of [-0.45, 0.45]) { box(0.08, 0.06, 4.2, TX + s, 3.55, (TZ0 + TZ1 - 2.2) / 2, 0xd9dde1); for (let r = 0; r < 12; r++) box(0.9, 0.03, 0.03, TX + s, 3.58, TZ0 + 0.3 + r * 0.35, 0xd9dde1); }
  text('Class 2 pumper', TX, 4.2, tz, 'prop');
  // Exhaust-extraction hose dropping from the ceiling rail onto the exhaust, and the yellow shore-power lead.
  box(0.12, 0.12, 7, TX + 1.6, H - 0.2, tz, STEEL);
  cyl(0.11, 0.11, 2.6, TX + 1.6, 2.9, TZ1 - 2.6, 0x2a2d31, {}, 10);
  box(0.4, 0.12, 0.25, TX + 1.5, 1.55, TZ1 - 2.6, 0x2a2d31);
  cyl(0.03, 0.03, 3.3, TX - TW / 2 - 0.25, 2.95, TZ1 - 1.9, YELLOW, {}, 6);
  box(0.12, 0.12, 0.12, TX - TW / 2 - 0.05, 1.3, TZ1 - 1.9, YELLOW);

  // Bay B: hazmat trailer, hose-drying rack along the wall, workbench and a fire-extinguisher stand.
  const HX = 4.2;
  solid(2.0, 1.6, 3.4, HX, 1.25, 1.9, 0xf4f4f0); box(2.02, 0.4, 3.42, HX, 0.55, 1.9, RED);
  box(2.04, 0.3, 3.0, HX, 1.4, 1.9, 0xe7c12e); text('HAZMAT', HX, 1.4, 3.75, 'prop');
  for (const s of [-1, 1]) { cyl(0.36, 0.36, 0.2, HX + s * 1.05, 0.36, 1.9, 0x1b1d20, { rz: Math.PI / 2 }, 14); }
  box(0.12, 0.12, 1.3, HX, 0.5, 4.2, DARK); torus(0.08, 0.03, HX, 0.5, 4.85, STEEL, { rx: Math.PI / 2 });
  solid(0.4, 3.6, 3.6, EDGE - 0.35, 1.8, 3.8, 0x9aa0a6);                                                    // hose-drying rack
  for (let i = 0; i < 9; i++) { box(0.06, 3.2, 0.12, EDGE - 0.6, 1.95, 2.2 + i * 0.4, [0xe9e6dd, 0xd8322c, 0xe9e6dd][i % 3]); box(0.12, 0.14, 0.18, EDGE - 0.6, 0.35, 2.2 + i * 0.4, 0xc0a040); }
  solid(1.8, 0.9, 0.6, 2.5, 0.45, BB + 0.42, 0x7a6a5a); box(1.8, 0.05, 0.65, 2.5, 0.92, BB + 0.42, 0x9a8a72);
  box(1.8, 1.0, 0.04, 2.5, 1.7, BB + 0.12, 0x4a4f56); for (let i = 0; i < 6; i++) box(0.05, 0.3, 0.05, 1.8 + i * 0.28, 1.6, BB + 0.17, STEEL);   // tool board
  for (const ex of [6.3, 6.6]) { cyl(0.1, 0.1, 0.55, ex, 0.5, BB + 0.3, RED, {}, 10); box(0.06, 0.12, 0.06, ex, 0.86, BB + 0.3, DARK); }
  // The fire danger rating arc sign high on the bay wall (the live rating is on the station board).
  box(0.06, 1.0, 2.2, EDGE - 0.16, 3.6, -0.5, 0xf4f4f0);
  for (let i = 0; i < 5; i++) box(0.04, 0.5, 0.42, EDGE - 0.2, 3.55 + Math.sin((i + 0.5) / 5 * Math.PI) * 0.2, -1.4 + i * 0.44, [0xf4f4f0, 0x3fa34d, 0x2f6fc0, 0xe6a12e, 0xd8322c][i]);
  box(0.04, 0.06, 0.7, EDGE - 0.22, 3.4, -0.6, DARK);
  text('Fire danger rating', EDGE - 0.6, 4.25, -0.5, 'prop');
  // First-aid kit and defibrillator by the personnel door.
  box(0.4, 0.4, 0.15, 1.45, 1.5, FRONT - 0.2, 0x2e8b57); box(0.06, 0.24, 0.16, 1.45, 1.5, FRONT - 0.21, 0xf4f4f0); box(0.24, 0.06, 0.16, 1.45, 1.5, FRONT - 0.21, 0xf4f4f0);
  box(0.4, 0.45, 0.15, -1.45, 1.5, FRONT - 0.2, 0x2fa04a); text('AED', -1.45, 2.05, FRONT - 0.45, 'prop');

  // ── PPE and decontamination room (dirty zone) ──
  box(PX + EDGE, 0.012, BB - BACK, (PX - EDGE) / 2, 0.005, (BB + BACK) / 2, 0x9fb0a6);
  for (let i = 0; i < 6; i++) {                                                                               // open gear lockers: tunic, overtrousers in boots, helmet
    const lz = BB - 1.0 - i * 1.15;
    box(0.05, 2.2, 1.05, -EDGE + 0.15, 1.1, lz, 0x5a6068);                                                 // open-front locker: back,
    for (const s of [-1, 1]) box(0.6, 2.2, 0.04, -EDGE + 0.45, 1.1, lz + s * 0.52, 0x6a7078);               // sides,
    box(0.6, 0.04, 1.05, -EDGE + 0.45, 2.25, lz, 0x6a7078); box(0.6, 0.04, 1.05, -EDGE + 0.45, 0.02, lz, 0x6a7078);   // top and floor
    box(0.3, 0.12, 0.04, -EDGE + 0.45, 2.35, lz, 0xf4f4f0);                                                // name tag
    box(0.3, 0.75, 0.62, -EDGE + 0.5, 1.4, lz, GOLD); box(0.32, 0.08, 0.64, -EDGE + 0.5, 1.4, lz, 0xd8d8a8);   // tunic with reflective band
    box(0.28, 0.55, 0.5, -EDGE + 0.5, 0.4, lz, GOLD); box(0.3, 0.25, 0.42, -EDGE + 0.55, 0.12, lz, DARK);       // trousers pulled down over boots
    ball(0.17, -EDGE + 0.5, 1.95, lz, i === 0 ? 0xf4f4f0 : 0xe7c12e, { s: [1, 0.8, 1] });                         // helmets (officer's white)
  }
  solid(0.75, 0.9, 0.7, -5.7, 0.45, BACK + 0.5, 0xeef0f2); torus(0.2, 0.04, -5.7, 0.5, BACK + 0.86, 0xb8c0c8); cyl(0.17, 0.17, 0.02, -5.7, 0.5, BACK + 0.86, 0x8fb7d9, { rx: Math.PI / 2 }, 14);   // washer-extractor
  solid(0.75, 2.0, 0.7, -4.75, 1.0, BACK + 0.5, 0xdfe3e6); box(0.6, 1.6, 0.03, -4.75, 1.1, BACK + 0.86, 0xc9d3da);   // drying cabinet
  solid(1.3, 0.1, 1.3, -3.0, 0.05, BACK + 0.75, 0xd8e4e8);                                                      // decon shower
  box(0.03, 2.1, 1.3, -3.65, 1.1, BACK + 0.75, GLASS, { a: 0.35 }); box(1.3, 2.1, 0.03, -3.0, 1.1, BACK + 1.4, GLASS, { a: 0.35 });
  cyl(0.02, 0.02, 0.5, -3.0, 2.15, BACK + 0.25, STEEL, {}, 6); cyl(0.12, 0.12, 0.03, -3.0, 2.1, BACK + 0.4, STEEL, {}, 10);
  box(0.6, 0.012, 0.6, -4.4, 0.012, BB - 1.4, 0x5a5f66);                                                       // hose-off floor sink
  box(1.1, 0.5, 0.03, -3.3, 2.0, BB - 0.1, 0xf4f4f0); text('Clean firefighter: wash, bag, shower', -3.3, 2.45, BB - 0.45, 'prop');

  // ── breathing apparatus room ──
  box(WX - PX - 0.16, 0.012, BB - BACK, 0, 0.005, (BB + BACK) / 2, 0xb6c2cc);
  for (let i = 0; i < 6; i++) {                                                                               // BA sets on wall brackets, on charge
    const bz = BB - 1.0 - i * 0.85;
    box(0.12, 0.5, 0.4, PX + 0.16, 1.5, bz, DARK);
    cyl(0.12, 0.12, 0.62, PX + 0.32, 1.45, bz, 0xe7c12e, {}, 10); cyl(0.05, 0.05, 0.08, PX + 0.32, 1.8, bz, STEEL, {}, 8);
    ball(0.13, PX + 0.32, 1.95, bz, 0x2b2f35, { s: [0.7, 1, 0.9] });
    ball(0.02, PX + 0.24, 1.2, bz + 0.12, i < 5 ? 0x3cc04a : 0xe6a12e, { e: i < 5 ? 0x1a6020 : 0x704010 });
  }
  blocker(0.5, 5.2, PX + 0.32, BB - 3.1);
  blocker(0.75, 6 * 1.15, -EDGE + 0.42, BB - 1.0 - 2.5 * 1.15);                                             // the gear lockers
  solid(1.5, 1.6, 0.7, -0.6, 0.8, BACK + 0.5, 0x3a5a7a); box(1.2, 0.5, 0.04, -0.6, 1.2, BACK + 0.86, 0x2b2f35);     // compressor
  for (let i = 0; i < 2; i++) ball(0.07, -0.95 + i * 0.4, 1.35, BACK + 0.88, 0xf4f4f0);
  solid(1.0, 1.4, 0.7, 0.9, 0.7, BACK + 0.5, 0x8a9198); box(0.8, 0.7, 0.03, 0.9, 0.9, BACK + 0.86, GLASS, { a: 0.4 });   // fill cabinet
  for (let i = 0; i < 2; i++) cyl(0.11, 0.11, 0.6, 0.7 + i * 0.4, 0.75, BACK + 0.55, 0xe7c12e, {}, 10);
  solid(0.7, 0.9, 1.6, WX - 0.5, 0.45, -7.4, 0x7a7f86); box(0.7, 0.05, 1.6, WX - 0.5, 0.92, -7.4, 0x9aa0a6);       // test bench
  box(0.3, 0.25, 0.3, WX - 0.5, 1.08, -7.0, 0x2b2f35); ball(0.13, WX - 0.5, 1.08, -7.8, 0x2b2f35, { s: [0.7, 1, 0.9] });
  box(1.6, 0.4, 0.03, 0, 2.5, BACK + 0.15, 0xf4f4f0); text('BA sets: check, wear, refill', 0, 2.95, BACK + 0.45, 'prop');

  // ── watchroom (the clean side starts here) ──
  box(EDGE - WX - 0.08, 0.012, BB - MZ, (WX + EDGE) / 2, 0.006, (BB + MZ) / 2, 0xcdd2cc);
  solid(2.4, 0.76, 0.7, 5.6, 0.38, MZ + 0.45, 0xb8a888); box(2.4, 0.04, 0.72, 5.6, 0.77, MZ + 0.45, 0xd0c4a8);   // desk
  box(0.5, 0.35, 0.06, 5.0, 1.0, MZ + 0.3, 0x1b1d20); box(0.46, 0.3, 0.02, 5.0, 1.0, MZ + 0.34, 0x56c8e8, { e: 0x18485a });   // CAD screen
  box(0.4, 0.2, 0.35, 4.6, 0.88, MZ + 0.5, 0xeeeeee); box(0.3, 0.02, 0.2, 4.6, 1.0, MZ + 0.62, 0xfafaf0);                    // turnout printer and its printout
  box(0.6, 0.25, 0.3, 6.3, 0.9, MZ + 0.4, DARK); box(0.08, 0.3, 0.06, 6.55, 1.15, MZ + 0.35, 0x1b1d20);                        // radio console and handset
  for (let i = 0; i < 4; i++) ball(0.025, 6.05 + i * 0.12, 0.98, MZ + 0.57, [0x3cc04a, 0xe6a12e, 0x3cc04a, 0xd83030][i], { e: 0x202020 });
  model('chair_A', 5.4, MZ + 1.2, Math.PI, { h: 0.9 });
  box(0.06, 0.7, 1.2, EDGE - 0.16, 1.6, -4.2, 0x3a3d42);                                                        // pager charging rack
  for (let i = 0; i < 8; i++) box(0.05, 0.1, 0.08, EDGE - 0.22, 1.4 + (i % 2) * 0.3, -4.7 + Math.floor(i / 2) * 0.32, 0x1b1d20);
  box(0.04, 1.3, 1.9, WX + 0.1, 1.7, -6.0, 0xe8e2c8);                                                            // district map
  for (let i = 0; i < 9; i++) ball(0.03, WX + 0.13, 1.2 + (i * 0.37) % 1.0, -6.8 + i * 0.19, 0x2a6db0);                    // hydrant pins
  box(1.4, 1.0, 0.04, 3.2, 1.7, BB - 0.14, 0xf8f8f6); box(1.45, 0.06, 0.06, 3.2, 1.18, BB - 0.16, 0xa0a6ac);                // station board
  text('Station board', 3.2, 2.5, BB - 0.5, 'prop');

  // ── mess and training room ──
  box(EDGE - WX - 0.08, 0.012, MZ - BACK, (WX + EDGE) / 2, 0.006, (MZ + BACK) / 2, 0xc9b79a);
  solid(3.6, 0.9, 0.65, 4.9, 0.45, BACK + 0.45, 0xe4ddd0); box(3.62, 0.04, 0.68, 4.9, 0.92, BACK + 0.45, 0x8f8a82);          // kitchen bench
  box(0.6, 0.02, 0.4, 4.4, 0.93, BACK + 0.45, 0x6d7880); cyl(0.02, 0.02, 0.3, 4.4, 1.08, BACK + 0.2, STEEL, {}, 6);
  cyl(0.15, 0.15, 0.4, 5.6, 1.12, BACK + 0.4, STEEL, {}, 10);                                                                 // hot-water urn
  solid(0.8, 1.9, 0.7, 3.0, 0.95, BACK + 0.45, 0xeef0f2);                                                                       // fridge
  solid(1.8, 0.76, 0.9, 4.6, 0.38, -9.6, WOOD); box(1.8, 0.05, 0.92, 4.6, 0.77, -9.6, 0xa07a54);                              // mess table
  for (const [cx, cz, r] of [[3.9, -10.3, 0], [5.3, -10.3, 0], [3.9, -8.9, Math.PI], [5.3, -8.9, Math.PI]]) model('chair_A_wood', cx, cz, r, { h: 0.9 });
  for (let i = 0; i < 4; i++) cyl(0.04, 0.035, 0.1, 4.0 + i * 0.4, 0.84, -9.6, 0xf4f4f0, {}, 8);
  box(0.06, 0.8, 1.4, EDGE - 0.16, 1.9, -9.2, 0x1b1d20); box(0.03, 0.72, 1.3, EDGE - 0.2, 1.9, -9.2, 0x2a6db0, { e: 0x0a2850 });   // training screen
  box(0.04, 1.2, 1.0, WX + 0.1, 1.8, -10.2, 0x6b4a2e); for (let i = 0; i < 6; i++) box(0.02, 0.06, 0.8, WX + 0.13, 2.25 - i * 0.16, -10.2, GOLD);   // honour board
  model('pictureframe_large_B', WX + 0.12, -8.4, Math.PI / 2, { h: 0.7 }, 1.6);
  for (const [lx, lz] of [[-4.6, -7.5], [0, -7.5], [4.6, -5.2], [4.6, -9.8]]) box(1.2, 0.05, 0.3, lx, H - 0.05, lz, 0xffffff, { e: 0xffffff });

  // ── things to use ──
  add('pumper', 'Class 2 pumper', 'info', 'The station\'s fire engine: a crew cab for four, a pump and tank of water at the back, hose reels and coiled hose, ladders on the roof, breathing apparatus behind the seats and rescue tools in the side lockers. It sits plugged in so its batteries and air brakes are always ready, nose to the door.', -2.1, 1.0);
  add('exhaust', 'Exhaust extraction and shore power', 'info', 'The flexible hose clips onto the exhaust so diesel fumes go straight outside when the engine starts; it pops off as the truck drives out. The yellow lead keeps the batteries charged and ejects itself too.', -2.1, 3.8);
  add('hazmat', 'Hazmat trailer', 'info', 'Hazardous-materials gear for spills on the highway or at the depot: absorbent, booms, drain covers, gas detectors and splash suits. It hooks onto the pumper when needed.', 4.2, 4.6);
  add('hose', 'Hose drying rack', 'info', 'Wet hose is washed, hung to dry so it doesn\'t rot, then rolled and put back on the truck. The tall tower outside is used the same way for long lengths.', 5.6, 4.0);
  add('rating', 'Fire danger rating sign', 'info', 'The arc sign shows today\'s rating from the Australian Fire Danger Rating System: Moderate, High, Extreme or Catastrophic. The station board in the watchroom has today\'s rating and advice.', 5.4, -1.2);
  add('ppc', 'Turnout gear lockers', 'info', 'Each firefighter\'s gold structural gear hangs ready: tunic, overtrousers pulled down over the boots so they can step straight in, gloves, flash hood and helmet. Dirty gear never goes past the watchroom.', -5.4, -6.0);
  add('washer', 'Washer-extractor and drying cabinet', 'info', 'Smoke-soiled gear is washed in the heavy-duty washer-extractor and dried in the cabinet, which takes a couple of hours, so everyone has a spare set.', -5.2, -9.8);
  add('decon', 'Decontamination shower', 'info', 'Back from a fire, crews bag their gear and shower here before going anywhere near the clean side of the station. Clean firefighter: wash, bag, shower.', -3.0, -8.8);
  add('basets', 'Breathing apparatus sets', 'info', 'Self-contained breathing apparatus on charge: a harness and cylinder of compressed air, a face mask and a telemetry tag. A green light means checked and full; amber means it needs a refill.', -0.9, -6.5);
  add('fill', 'Cylinder fill station', 'info', 'The compressor fills used cylinders inside a safety cabinet in case one bursts. Cylinders are pressure-tested on a schedule and the date is stamped on each one.', 0.1, -10.0);
  add('test', 'BA test bench', 'info', 'After every use each set is tested for leaks and its warning whistle checked before it goes back on the wall.', 0.8, -7.4);
  add('printer', 'Turnout printer', 'info', 'When a call comes in, the alerting system sounds the station, turns on the bay lights and prints the job here: the address, what\'s happening and the nearest hydrants. Retained firefighters\' pagers go off at the same time.', 4.6, -5.6);
  add('radio', 'Radio console', 'info', 'The crew stays in touch with the communication centre and other crews on the government radio network.', 6.2, -5.6);
  add('pagers', 'Pager charging rack', 'info', 'Retained firefighters are on call from home and work. They clip their pagers in here to charge after a drill.', 5.9, -4.2);
  add('map', 'District map', 'info', 'Every street in town, with the hydrants marked as blue pins. Crews check the map on the way out the door.', 3.3, -6.4);
  add('board', 'Station board', 'civic-ledger', 'Today\'s fire danger rating, who is on, and the town\'s networks.', 3.2, -4.2);
  add('kitchen', 'Station kitchen', 'info', 'The crew\'s tea room: fridge, urn and a sink. After Tuesday drill night everyone stays for a cuppa. No turnout gear past the watchroom door.', 4.9, -10.7);
  add('training', 'Training screen', 'info', 'Drill-night lessons: pump operation, road crash rescue, hazmat and bush fire safety. The training records go up to headquarters.', 5.9, -8.4);
  add('honour', 'Honour board', 'info', 'Long-service medals and the names of the station\'s captains, painted in gold over the decades.', 3.1, -10.5);

  // Which room each thing is in, for the game's approach logic and conversations.
  const rooms = [
    { name: 'Engine bay', x0: -EDGE, x1: EDGE, z0: BB, z1: FRONT },
    { name: 'PPE and decontamination room', x0: -EDGE, x1: PX, z0: BACK, z1: BB },
    { name: 'Breathing apparatus room', x0: PX, x1: WX, z0: BACK, z1: BB },
    { name: 'Watchroom', x0: WX, x1: EDGE, z0: MZ, z1: BB },
    { name: 'Mess and training room', x0: WX, x1: EDGE, z0: BACK, z1: MZ },
  ].map((r, i) => ({ ...r, w: r.x1 - r.x0, d: r.z1 - r.z0, parent: i ? 0 : -1 }));
  const roomAt = (x, z) => Math.max(0, rooms.findIndex((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1));
  for (const it of k.interactables) { it.room = roomAt(it.pos.x, it.pos.z); it.roomName = rooms[it.room].name; }
  for (const o of k.sceneObjects) o.room = roomAt(o.pos.x, o.pos.z);
  text(site.name, 0, 3.9, 0.5, 'room');
  return k.finish({ rooms, windows, staff: { pos: FIRE_LAYOUT.staff, use: FIRE_LAYOUT.staffUse } });
}
