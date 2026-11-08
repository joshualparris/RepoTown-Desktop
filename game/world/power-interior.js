import { createKit, ROOM } from './interior-kit.js';
import { glassMesh } from './windows.js';
import { POWER_EDGES } from './power-grid.js';

// Power Station: a remote-town hybrid diesel–solar–battery station of the kind that runs Lord Howe
// Island (three 300 kW diesel generating sets, a solar farm, a battery and a microgrid controller) and
// Horizon Power's Western Australian towns. The simulation behind it is life.js utilitiesHour (solar
// first, the diesels burn a drum per 15 units for the rest) and power-grid.js (the ten feeders).
//   • Control room behind the street door: the operator's SCADA desk facing a mimic panel of the town's
//     network, its lamps showing the live state of every feeder; the logbook and permit-to-work board.
//   • Switchroom: a breaker cubicle per feeder with live indicator lamps (red closed, green open, as on
//     Australian switchgear), the synchronising panel, rubber mats and the arc-flash suit cabinet.
//   • Battery and inverter room: battery racks, the solar inverters, the microgrid controller, its
//     air-conditioner and the gas fire-suppression cylinders.
//   • Engine hall: three diesel generating sets with radiators and exhaust stacks, the fuel day tank with
//     its sight gauge (the station's real fuel stock), the transfer pump, oil drums and a gantry crane.
export const POWER_LAYOUT = Object.freeze({ ctrlZ: 1, hallZ: -4, westX: -2, eastX: 2, staff: { x: -2.2, z: 3.4 }, staffUse: { x: -0.9, z: 3.4 } });
export const SET_KW = 300;

// What the station is doing right now, from the town's live state (or a quiet default without it).
export function stationState(site, life) {
  const c = life?.civic, grid = c?.powerGrid, supply = c?.supply || {};
  const hour = life ? Math.floor(life.minute / 60) : 12, day = hour >= 7 && hour <= 18;
  const solar = day ? ({ sunny: 25, cloudy: 14, windy: 18, rainy: 8 })[c?.weather] ?? 0 : 0;
  const thermal = Math.max(0, (supply.power || 0) - solar);
  const running = thermal > 0 ? Math.min(3, Math.ceil(thermal / 20)) : 0;
  const edges = Object.fromEntries(POWER_EDGES.map((e) => {
    const s = grid?.edges?.find((x) => x.id === e.id);
    return [e.id, { failed: !!s?.failed, flow: s?.flow ?? 0, capacity: e.capacity }];
  }));
  return { solar: Math.min(solar, supply.power || 0), thermal, running, demand: supply.powerDemand || 0, served: grid?.served ?? supply.power ?? 0, edges, fuel: Math.round(site.stock?.fuel || 0), ok: supply.ok !== false };
}

export function buildPowerInterior(site, makeLabel, roomTitle = 'Power station', life = null) {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, torus, solid, text, add, model, blocker } = k;
  const { W, D, FRONT, BACK, EDGE, WALL } = ROOM;
  const H = 4.6, { ctrlZ: CZ, hallZ: HZ, westX: WX, eastX: EX } = POWER_LAYOUT;
  const st = stationState(site, life);
  const PAINT = 0xd7dbd8, GREY = 0x8d959b, DARK = 0x2b2f35, YELLOW = 0xe7c12e, RED = 0xd8322c, GREEN = 0x2ea84a, ENGINE = 0x2f6f5a, STEEL = 0xb7bdc3;
  group.add(new THREE.HemisphereLight(0xffffff, 0x5a6066, 2.0));
  const panes = [], windows = [];

  // Walls with openings ({ s, e, y0, y1, glass }): solid sills, open doorways, glazed windows.
  const wall = (axis, at, a, b, openings = [], t = 0.18, col = PAINT) => {
    const seg = (s, e, y0, y1, collide) => {
      if (e - s < 0.01 || y1 - y0 < 0.01) return;
      const w = e - s, c = (s + e) / 2;
      axis === 'z' ? box(w, y1 - y0, t, c, (y0 + y1) / 2, at, col) : box(t, y1 - y0, w, at, (y0 + y1) / 2, c, col);
      if (collide) axis === 'z' ? blocker(w, t, c, at) : blocker(t, w, at, c);
    };
    let x = a;
    for (const o of [...openings].sort((p, q) => p.s - q.s)) {
      seg(x, o.s, 0, H, true); seg(o.s, o.e, 0, o.y0, o.y0 > 0); seg(o.s, o.e, o.y1, H, false);
      if (o.glass) {
        const c = (o.s + o.e) / 2, w = o.e - o.s, y = (o.y0 + o.y1) / 2, h = o.y1 - o.y0;
        panes.push(axis === 'z' ? { w, h, d: 0.04, x: c, y, z: at } : { w: 0.04, h, d: w, x: at, y, z: c });
        if (o.out) windows.push({ axis, at, s: o.s, e: o.e, out: o.out });
      }
      if (o.y0 === 0) for (const s of [o.s, o.e]) axis === 'z' ? box(0.08, o.y1, t + 0.06, s, o.y1 / 2, at, GREY) : box(t + 0.06, o.y1, 0.08, at, o.y1 / 2, s, GREY);
      x = o.e;
    }
    seg(x, b, 0, H, true);
  };

  // ── floors, ceiling, outer walls ──
  box(W, 0.24, FRONT - CZ, 0, -0.12, (FRONT + CZ) / 2, 0x9fa8a4);                        // control room: anti-static vinyl
  box(W, 0.24, CZ - HZ, 0, -0.12, (CZ + HZ) / 2, 0x7d8580);                              // switchroom, battery room
  box(W, 0.24, HZ - BACK, 0, -0.12, (HZ + BACK) / 2, 0x6f7a74);                          // engine hall: painted concrete
  box(W, 0.27, D, 0, H + 0.1, -3, 0xe6e8e6);
  wall('z', FRONT, -EDGE, EDGE, [{ s: -5.6, e: -3.4, y0: 0.9, y1: 2.6, glass: true, out: 1 }, { s: -1.05, e: 1.05, y0: 0, y1: 2.6 }, { s: 3.4, e: 5.6, y0: 0.9, y1: 2.6, glass: true, out: 1 }], WALL);
  box(2.15, 0.06, 0.6, 0, 0.02, FRONT, 0xb9b8ae);
  wall('x', -EDGE, BACK, FRONT, [], WALL);
  wall('x', EDGE, BACK, FRONT, [{ s: 2.1, e: 3.9, y0: 1.0, y1: 2.6, glass: true, out: 1 }, { s: -10.5, e: -6.0, y0: 2.6, y1: 3.8, glass: true, out: 1 }], WALL);   // control-room window; high engine-hall vents
  wall('z', BACK, -EDGE, EDGE, [{ s: -6.4, e: 6.4, y0: 2.4, y1: 3.6 }], WALL);                                                 // radiator air outlet
  for (let i = 0; i < 16; i++) box(12.8, 0.04, 0.1, 0, 2.45 + i * 0.075, BACK + 0.02, 0x5a6066);                                   // louvres

  // ── partitions ──
  wall('z', CZ, -EDGE, EDGE, [{ s: -5.1, e: -3.9, y0: 0, y1: 2.3 }, { s: -0.9, e: 0.9, y0: 0, y1: 2.3 }, { s: 3.9, e: 5.1, y0: 0, y1: 2.3 }]);
  wall('x', WX, HZ, CZ); wall('x', EX, HZ, CZ);
  wall('z', HZ, -EDGE, EDGE, [{ s: -0.7, e: 0.7, y0: 0, y1: 2.3 }, { s: -5.6, e: -3.2, y0: 1.2, y1: 2.2, glass: true }]);      // engine-hall door; switchroom viewing window
  for (const [c, words, col] of [[-4.5, 'SWITCHROOM · AUTHORISED ONLY', 0xd8892e], [0, 'ENGINE HALL · HEARING PROTECTION', 0x2a6db0], [4.5, 'BATTERY ROOM', 0x2e8b57]]) {
    box(1.9, 0.32, 0.03, c, 2.6, CZ + 0.1, col); text(words, c, 2.95, CZ + 0.4, 'prop');
  }
  box(1.6, 0.3, 0.03, 0, 2.6, HZ + 0.1, YELLOW); text('DANGER · ENGINES START AUTOMATICALLY', 0, 2.95, HZ + 0.4, 'prop');

  // ── control room ──
  // Mimic panel of the town network on the west wall: the generator, the junction and every feeder, a lamp
  // each, lit from the live grid (red = closed and live, green = open or faulted).
  box(0.08, 2.0, 4.4, -EDGE + 0.16, 2.1, 3.5, 0x3a4048);
  box(0.03, 1.85, 4.25, -EDGE + 0.22, 2.1, 3.5, 0x9fb3a8);
  const busY = 2.75;
  box(0.02, 0.05, 3.8, -EDGE + 0.24, busY, 3.5, DARK);                                                            // the bus
  POWER_EDGES.forEach((e, i) => {
    const z = 1.75 + i * 0.39, s = st.edges[e.id], live = !s.failed && s.flow > 0;
    box(0.02, 0.9, 0.03, -EDGE + 0.24, busY - 0.45, z, DARK);
    ball(0.06, -EDGE + 0.26, 1.75, z, s.failed ? GREEN : live ? RED : 0xe6a12e, { e: s.failed ? 0x0a4010 : live ? 0x601010 : 0x604010 });
    box(0.01, 0.1, 0.32, -EDGE + 0.24, 1.5, z, 0xf6f2e6);
  });
  for (let g = 0; g < 3; g++) { torus(0.12, 0.025, -EDGE + 0.25, 3.25, 2.4 + g * 0.55, DARK, { ry: Math.PI / 2 }); ball(0.05, -EDGE + 0.26, 3.25, 2.4 + g * 0.55, g < st.running ? RED : GREEN, { e: g < st.running ? 0x601010 : 0x0a4010 }); }
  box(0.02, 0.25, 0.5, -EDGE + 0.24, 3.25, 4.4, YELLOW); text('Network mimic', -EDGE + 0.7, 3.4, 3.5, 'prop');
  // The operator's SCADA desk facing the mimic, with three screens and the alarm printer.
  solid(1.0, 0.75, 3.2, -3.0, 0.375, 3.5, 0xc8ccd0); box(1.05, 0.04, 3.25, -3.0, 0.77, 3.5, 0x8d959b);
  for (let i = 0; i < 3; i++) { box(0.05, 0.42, 0.7, -3.35, 1.05, 2.5 + i * 0.95, DARK); box(0.02, 0.36, 0.64, -3.38, 1.05, 2.5 + i * 0.95, [0x2a6db0, 0x2e8b57, 0x56c8e8][i], { e: [0x0a2850, 0x0a3018, 0x18485a][i] }); }
  box(0.35, 0.2, 0.4, -2.75, 0.88, 4.9, 0xeeeeee); box(0.3, 0.01, 0.25, -2.6, 0.99, 4.9, 0xfafaf0);
  model('chair_A', -2.2, 3.4, -Math.PI / 2, { h: 0.95 });
  // Logbook stand and the permit-to-work / isolation board on the east wall.
  solid(0.6, 1.05, 0.5, 2.6, 0.525, 1.7, 0x7a7f86); box(0.5, 0.04, 0.38, 2.6, 1.08, 1.7, 0xf2ead6);
  box(0.06, 1.2, 1.8, EDGE - 0.15, 1.9, 5.0, 0xf6f6f2); for (let i = 0; i < 10; i++) box(0.03, 0.14, 0.09, EDGE - 0.2, 2.25 - Math.floor(i / 5) * 0.4, 4.3 + (i % 5) * 0.3, [RED, YELLOW, 0xf6f6f2][i % 3]);
  text('Permits and isolations', EDGE - 0.6, 2.85, 5.0, 'prop');
  box(0.12, 0.3, 0.25, EDGE - 0.15, 1.4, 1.55, RED); ball(0.07, EDGE - 0.24, 1.4, 1.55, 0xb81f1f); text('Emergency stop', EDGE - 0.6, 1.9, 1.55, 'prop');

  // ── switchroom ──
  box(WX + EDGE - 0.4, 0.015, CZ - HZ - 0.4, (WX - EDGE) / 2, 0.008, (CZ + HZ) / 2, 0x1b1d20);                // rubber insulating mat
  POWER_EDGES.forEach((e, i) => {                                                                              // one breaker cubicle per feeder
    const x = -EDGE + 0.45 + i * 0.47, z = HZ + 0.45, s = st.edges[e.id], closed = !s.failed;
    solid(0.45, 2.2, 0.7, x, 1.1, z, 0xc9cdd0);
    box(0.4, 0.5, 0.02, x, 1.6, z + 0.36, 0xb0b6ba); box(0.08, 0.16, 0.04, x, 1.0, z + 0.37, DARK);
    ball(0.035, x - 0.08, 2.0, z + 0.37, closed ? RED : 0x5a2a2a, { e: closed ? 0x701010 : 0 }); ball(0.035, x + 0.08, 2.0, z + 0.37, closed ? 0x1f4a2a : GREEN, { e: closed ? 0 : 0x0a5018 });
    box(0.36, 0.08, 0.01, x, 2.25, z + 0.36, 0xf6f6f2);
  });
  // Synchronising panel: frequency and voltage meters and the synchroscope.
  solid(0.7, 2.0, 0.55, -EDGE + 0.4, 1.0, CZ - 1.2, 0xc9cdd0);
  for (let i = 0; i < 2; i++) { cyl(0.11, 0.11, 0.03, -EDGE + 0.69, 1.7, CZ - 1.4 + i * 0.4, 0xf6f6f2, { rz: Math.PI / 2 }, 16); }
  cyl(0.15, 0.15, 0.03, -EDGE + 0.69, 1.25, CZ - 1.2, 0xf6f6f2, { rz: Math.PI / 2 }, 18); box(0.01, 0.02, 0.24, -EDGE + 0.71, 1.25, CZ - 1.2, RED);
  // Arc-flash suit cabinet and the fire extinguisher (CO2 for electrical fires).
  solid(0.6, 2.0, 0.5, WX - 0.4, 1.0, CZ - 0.5, 0xe6a12e); box(0.4, 0.6, 0.02, WX - 0.4, 1.4, CZ - 0.76, DARK);
  cyl(0.1, 0.1, 0.6, WX - 0.3, 0.3, -1.6, DARK, {}, 10); box(0.12, 0.12, 0.08, WX - 0.3, 0.65, -1.6, RED);

  // ── battery and inverter room ──
  for (let i = 0; i < 4; i++) {                                                                                 // battery racks with status LEDs
    const x = EX + 0.7 + i * 1.05;
    solid(0.9, 2.1, 0.7, x, 1.05, HZ + 0.45, 0xeef0f2);
    for (let r = 0; r < 6; r++) box(0.8, 0.02, 0.02, x, 0.3 + r * 0.32, HZ + 0.81, 0xb0b6ba);
    for (let r = 0; r < 6; r++) ball(0.02, x + 0.33, 0.4 + r * 0.32, HZ + 0.82, 0x3cc04a, { e: 0x1a6020 });
  }
  for (let i = 0; i < 3; i++) { box(0.12, 0.8, 0.6, EDGE - 0.2, 1.6, CZ - 0.8 - i * 0.9, 0xd8dcdf); ball(0.03, EDGE - 0.27, 1.85, CZ - 0.8 - i * 0.9, 0x3cc04a, { e: 0x1a6020 }); box(0.02, 0.15, 0.3, EDGE - 0.27, 1.5, CZ - 0.8 - i * 0.9, 0x1b1d20); }   // solar inverters
  blocker(0.3, 2.8, EDGE - 0.2, CZ - 1.7);
  solid(0.7, 2.0, 0.5, EX + 0.45, 1.0, CZ - 0.45, 0x5a6470); box(0.5, 0.35, 0.02, EX + 0.45, 1.5, CZ - 0.71, 0x56c8e8, { e: 0x18485a });   // microgrid controller
  box(0.9, 0.3, 0.22, 5.2, 3.7, CZ - 0.2, 0xf4f5f6);                                                                                         // air conditioner
  for (let i = 0; i < 2; i++) cyl(0.13, 0.13, 1.3, 6.4 - i * 0.3, 0.65, CZ - 0.25, RED, {}, 10);                                         // gas suppression cylinders

  // ── engine hall: three generating sets ──
  // Each set: a green diesel engine coupled to its alternator on a steel skid, the radiator at the back,
  // its exhaust silencer and stack rising through the roof, and a local control panel with a run lamp.
  const SETS = [-4.6, 0, 4.6], SZ0 = -11.0, SZ1 = -6.6;
  SETS.forEach((x, g) => {
    const run = g < st.running;
    solid(1.8, 0.25, SZ1 - SZ0 + 0.4, x, 0.125, (SZ0 + SZ1) / 2, DARK);                                  // skid
    box(1.3, 1.5, 2.4, x, 1.0, SZ0 + 1.9, ENGINE);                                                         // engine block
    for (let c = 0; c < 6; c++) box(0.2, 0.18, 0.25, x + (c % 2 ? 0.25 : -0.25), 1.84, SZ0 + 0.95 + Math.floor(c / 2) * 0.75, 0x245a48);   // cylinder heads
    box(1.4, 1.4, 1.5, x, 0.95, SZ1 - 0.75, 0x23324a);                                                     // alternator
    box(1.6, 2.0, 0.3, x, 1.25, SZ0 - 0.1, 0x3a3f46); for (let r = 0; r < 12; r++) box(1.5, 0.02, 0.02, x, 0.35 + r * 0.16, SZ0 + 0.06, 0x7a8288);   // radiator
    cyl(0.22, 0.22, 1.0, x, 2.4, SZ0 + 1.2, STEEL, { rz: Math.PI / 2 }, 12);                               // silencer
    cyl(0.12, 0.12, H - 2.5, x - 0.5, 2.45 + (H - 2.5) / 2, SZ0 + 1.2, 0x8a8f96, {}, 10);                // exhaust stack
    box(0.5, 0.7, 0.25, x + 1.1, 1.35, SZ1 - 0.2, 0xc9cdd0); solid(0.3, 0.9, 0.3, x + 1.1, 0.45, SZ1 - 0.2, GREY);   // local control panel
    ball(0.05, x + 1.1, 1.6, SZ1 - 0.06, run ? GREEN : 0x2a4a2a, { e: run ? 0x0a6020 : 0 });
    text(`Generator ${g + 1} · ${run ? 'running' : 'standby'}`, x, 3.0, SZ1 - 0.3, 'prop');
  });
  for (const x of [-6.9, 6.9]) box(0.15, 0.25, 8, x, H - 0.4, (BACK + HZ) / 2, YELLOW);                    // gantry crane runway
  box(13.6, 0.35, 0.3, 0, H - 0.55, -5.6, YELLOW); box(0.4, 0.4, 0.4, -2.3, H - 0.9, -5.6, DARK); cyl(0.01, 0.01, 1.2, -2.3, H - 1.7, -5.6, DARK, {}, 4); box(0.2, 0.15, 0.1, -2.3, H - 2.35, -5.6, YELLOW);   // gantry crane, parked over the walkway
  // Fuel day tank with its sight gauge (filled to the station's real fuel stock), transfer pump, drums.
  const fill = Math.max(0.05, Math.min(1, st.fuel / 160));
  solid(1.0, 1.8, 1.2, -EDGE + 0.6, 0.9, -5.0, 0xcfd4d6); box(0.04, 1.5, 0.08, -EDGE + 1.12, 0.95, -4.5, 0xe8f2f6, { a: 0.6 });
  box(0.05, 1.5 * fill, 0.06, -EDGE + 1.13, 0.2 + 0.75 * fill, -4.5, 0xd8a83a);
  text('Day tank', -EDGE + 0.9, 2.2, -5.0, 'prop');
  solid(0.6, 0.6, 0.5, -EDGE + 0.5, 0.3, -6.3, 0x2a6db0); cyl(0.05, 0.05, 1.2, -EDGE + 0.5, 1.2, -6.3, STEEL, {}, 6);
  for (let i = 0; i < 4; i++) cyl(0.29, 0.29, 0.88, EDGE - 0.45, 0.44, -10.6 + i * 0.62, [0x3a6a9a, 0x3a6a9a, 0xb83a32, 0x3a6a9a][i], {}, 14);
  blocker(0.65, 2.5, EDGE - 0.45, -9.67);
  // Hearing-protection station and the walkway lines.
  box(0.5, 0.6, 0.12, 2.0, 1.5, HZ - 0.2, 0xf6f6f2); for (let i = 0; i < 3; i++) torus(0.07, 0.025, 1.85 + i * 0.15, 1.45, HZ - 0.3, YELLOW, { rx: Math.PI / 2 });
  for (const z of [HZ - 1.3, SZ1 + 0.4]) box(13, 0.012, 0.1, 0, 0.006, z, YELLOW);
  for (const [lx, lz] of [[-4, -6], [0, -6], [4, -6], [-4, -10], [0, -10], [4, -10]]) box(0.25, 0.06, 2.0, lx, H - 0.08, lz, 0xffffff, { e: 0xffffff });
  for (const [lx, lz] of [[-4, 3.5], [0, 3.5], [4, 3.5], [-4.5, -1.5], [4.5, -1.5]]) box(1.2, 0.05, 0.3, lx, H - 0.05, lz, 0xffffff, { e: 0xffffff });

  // ── things to use ──
  const supply = `${st.served} of ${st.demand} units an hour supplied: ${st.solar} from the solar farm, ${st.thermal} from the diesels.`;
  add('scada', 'SCADA desk', 'civic-ledger', `The operator's screens: generation, demand, every feeder and the fuel stock. ${supply}`, POWER_LAYOUT.staffUse.x, POWER_LAYOUT.staffUse.z);
  add('mimic', 'Network mimic panel', 'info', `A map of the town's network with a lamp for every feeder: red means the breaker is closed and live, green means it's open or faulted, amber means it's closed but carrying nothing. ${POWER_EDGES.filter((e) => st.edges[e.id].failed).length ? 'Faulted now: ' + POWER_EDGES.filter((e) => st.edges[e.id].failed).map((e) => e.id).join(', ') + '. Repairs are ordered at the Town Hall.' : 'Every feeder is closed.'}`, -5.4, 3.5);
  add('log', 'Station logbook', 'info', 'Every start, stop, fault, fuel delivery and switching operation is written up here, signed and timed.', 2.6, 2.6);
  add('permits', 'Permit-to-work board', 'info', 'Before anyone works on equipment it is isolated, locked and tagged; the permits and personal danger tags hang here until the job is signed off.', 5.9, 5.0);
  add('estop', 'Emergency stop', 'info', 'Shuts every generator down at once. It has never been pressed for real.', 6.1, 1.6);
  add('breakers', 'Feeder breakers', 'info', `One cubicle for each of the ${POWER_EDGES.length} feeders, from the main feed to the east and west neighbourhoods. Each has a red lamp (closed) and a green lamp (open).`, -4.5, -2.4);
  add('sync', 'Synchronising panel', 'info', 'Before a second generator joins the bus, its speed and voltage are matched to the running set; the synchroscope needle must be at twelve o\'clock when the breaker closes.', -5.4, -0.2);
  add('arcflash', 'Arc-flash suit cabinet', 'info', 'Switching on the high-voltage board is done in a flame-resistant suit, hood and gloves, kept here.', -3.0, -0.6);
  add('battery', 'Battery racks', 'info', 'Lithium-ion batteries soak up the midday solar and cover the evening peak, so the diesels can stay off for longer.', 4.0, -2.4);
  add('inverters', 'Solar inverters', 'info', `They turn the solar farm's direct current into mains power. Right now: ${st.solar} units an hour.`, 5.6, -0.7);
  add('controller', 'Microgrid controller', 'info', 'Decides minute by minute how much comes from the sun, the battery and the diesels, starting a generator only when it is needed.', 3.6, -0.5);
  add('gen1', 'Generator 1', 'info', `A ${SET_KW} kW diesel generating set. ${st.running >= 1 ? 'Running now.' : 'On standby, ready to start automatically.'} The diesels burn about one drum of fuel for every 15 units the sun can't cover.`, -3.0, -5.8);
  add('gen2', 'Generator 2', 'info', `A ${SET_KW} kW diesel generating set. ${st.running >= 2 ? 'Running now.' : 'On standby.'} Sets take turns so their running hours stay even.`, 1.6, -5.8);
  add('gen3', 'Generator 3', 'info', `A ${SET_KW} kW diesel generating set. ${st.running >= 3 ? 'Running now: the town is drawing hard.' : 'On standby for the evening peak or a cloudy day.'}`, 6.0, -5.8);
  add('daytank', 'Fuel day tank', 'info', `The engines draw from this tank, topped up from the big tank outside. The station holds ${st.fuel} drums of diesel; trucks bring more from the Rail Depot when it runs low.`, -5.3, -4.9);
  add('crane', 'Gantry crane', 'info', 'The overhead crane lifts cylinder heads and alternators when a set is overhauled.', -2.3, -4.9);

  const rooms = [
    { name: 'Control room', x0: -EDGE, x1: EDGE, z0: CZ, z1: FRONT },
    { name: 'Switchroom', x0: -EDGE, x1: WX, z0: HZ, z1: CZ },
    { name: 'Corridor', x0: WX, x1: EX, z0: HZ, z1: CZ },
    { name: 'Battery and inverter room', x0: EX, x1: EDGE, z0: HZ, z1: CZ },
    { name: 'Engine hall', x0: -EDGE, x1: EDGE, z0: BACK, z1: HZ },
  ].map((r, i) => ({ ...r, w: r.x1 - r.x0, d: r.z1 - r.z0, parent: i ? 0 : -1 }));
  const roomAt = (x, z) => Math.max(0, rooms.findIndex((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1));
  for (const it of k.interactables) { it.room = roomAt(it.pos.x, it.pos.z); it.roomName = rooms[it.room].name; }
  for (const o of k.sceneObjects) o.room = roomAt(o.pos.x, o.pos.z);
  group.add(glassMesh(panes));
  text(site.name, 0, 3.9, 4.0, 'room');
  return k.finish({ rooms, windows, staff: { pos: POWER_LAYOUT.staff, use: POWER_LAYOUT.staffUse } });
}
