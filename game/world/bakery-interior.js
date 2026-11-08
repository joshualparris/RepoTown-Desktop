import * as THREE from 'three';
import { highStreetShell } from './interior-kit.js';
import { FLOOR_SURFACE_Y } from './floor-surfaces.js';

// The High Street bakery, laid out the way a real neighbourhood bakery works:
//
//   • Front of house (door end): a tiled customer floor, a bread wall of baskets, a display table,
//     a few café seats by the window and a chalkboard sign.
//   • The counter, which divides the shop from the kitchen: glass pastry case, pie warmer, cake
//     stands, register, bagging station and bread slicer — baker serves from behind it.
//   • Production kitchen (back), visible over the counter like an open-plan artisan bakery:
//     deck ovens under an extraction hood, spiral mixer, proofer cabinet, stainless prep island,
//     marble pastry bench, trolley racks of cooling loaves, flour sacks, sink and ingredient shelves.
//
// Shelves reflect the real simulation: loaves on the bread wall and pies in the warmer follow the
// bakery's stock (`site.out`), and a "sold out" board appears when the shelves are bare.
const W = 14, D = 18, FRONT = 6, BACK = -12, EDGE = 7, WALL = 0.24;
const COUNTER_Z = -5.4;          // counter centre line; customers stand at z > -4.85

export const BAKERY_LAYOUT = Object.freeze({ counterZ: COUNTER_Z, staff: { x: 3.4, z: -6.6 }, staffUse: { x: 3.4, z: -4.2 } });

export function buildBakeryInterior(site, makeLabel, roomTitle = 'Bakery') {
  const group = new THREE.Group();
  group.name = 'Inside ' + site.name;
  const colliders = [], interactables = [], sceneObjects = [], placedProps = [];
  group.add(new THREE.HemisphereLight(0xfff3dc, 0x6b5a48, 2.0));
  const warm = new THREE.PointLight(0xffd9a0, 1.1, 14, 1.6); warm.position.set(0, 3.6, -1.5); group.add(warm);
  const glow = new THREE.PointLight(0xff8a3d, 0.9, 7, 1.8); glow.position.set(-1.6, 1.4, -9.8); group.add(glow);

  // ── helpers ──
  const mats = new Map(), geos = new Map();
  const mat = (c, o = {}) => {
    const k = c + '|' + (o.e ?? '') + '|' + (o.a ?? 1) + '|' + (o.side ?? 0);
    if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: c, emissive: o.e ?? 0x000000, emissiveIntensity: o.e ? 0.55 : 0, transparent: (o.a ?? 1) < 1, opacity: o.a ?? 1, side: o.side ?? THREE.FrontSide }));
    return mats.get(k);
  };
  const geo = (k, make) => { if (!geos.has(k)) geos.set(k, make()); return geos.get(k); };
  const put = (g, c, x, y, z, o = {}) => {
    const m = new THREE.Mesh(g, mat(c, o));
    m.position.set(x, y, z);
    if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz;
    if (o.s) m.scale.set(...o.s);
    group.add(m); return m;
  };
  const box = (w, h, d, x, y, z, c, o) => put(geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), c, x, y, z, o);
  const cyl = (rt, rb, h, x, y, z, c, o, seg = 12, open = false) => put(geo(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), c, x, y, z, { side: open ? THREE.DoubleSide : undefined, ...o });
  const ball = (r, x, y, z, c, o) => put(geo(`s${r}`, () => new THREE.SphereGeometry(r, 10, 7)), c, x, y, z, o);
  const solid = (w, h, d, x, y, z, c, o) => { box(w, h, d, x, y, z, c, o); colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 }); };
  const blocker = (w, d, x, z) => colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  const text = (label, x, y, z, kind = 'interactive') => {
    const s = makeLabel(label, kind); s.position.set(x, y, z); s.userData.labelKind = kind; s.renderOrder = 12; group.add(s);
  };

  // ── colours ──
  const PLASTER = 0xefe2c6, TILE = 0xf5f2ea, WOOD = 0x8a6340, DARKWOOD = 0x5c4029, STEEL = 0xbfc4c9, STEEL2 = 0x9aa0a6,
    CRUST = 0xc98b3f, DARKCRUST = 0x8d5424, GOLD = 0xe2b25d, CREAM = 0xf3e6c6, ACCENT = 0xdca765, TERRA = 0xa4684a,
    GLASS = 0xcfe8ee, WICKER = 0xb98c52, RED = 0x9b3b32, GREEN = 0x5f8a4e;

  // ── shell: same footprint, door gap and spawn as every High Street room ──
  box(W, 0.24, D, 0, -0.12, -3, 0xb9a88f);
  box(W, 0.27, D, 0, 4.7, -3, 0xf0e8d6);
  // Sills clear the 1.3 m tiled dado; the café seats sit at the front windows.
  const shell = highStreetShell({ box, solid, wall: PLASTER, frontSill: 1.3, sideSill: 1.3 });
  group.add(shell.glass);
  // White tiled dado along the side and back walls, with a wooden rail on top.
  for (const sx of [-EDGE + 0.15, EDGE - 0.15]) { box(0.06, 1.25, D - 0.4, sx, 0.62, -3, TILE); box(0.1, 0.07, D - 0.4, sx, 1.27, -3, WOOD); }
  box(W - 0.5, 1.25, 0.06, 0, 0.62, BACK + 0.15, TILE); box(W - 0.5, 0.07, 0.1, 0, 1.27, BACK + 0.15, WOOD);
  box(W - 0.5, 0.16, 0.5, 0, 3.65, BACK + 0.5, ACCENT);
  // Front-wall inner dado either side of the door.
  for (const sx of [-4, 4]) { box(5.7, 1.25, 0.06, sx, 0.62, FRONT - 0.15, TILE); box(5.7, 0.07, 0.1, sx, 1.27, FRONT - 0.15, WOOD); }

  // ── floors: black-and-cream chequerboard for customers, quarry tile in the kitchen ──
  box(W - 0.5, 0.02, 10.9, 0, 0.005, 0.65, CREAM);
  const tiles = [];
  for (let ix = 0; ix < 14; ix++) for (let iz = 0; iz < 11; iz++) if ((ix + iz) % 2 === 0) tiles.push([-6.5 + ix, -4.5 + iz]);
  const checker = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat(0x3a3632), tiles.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  tiles.forEach(([x, z], i) => { m4.compose(new THREE.Vector3(x, FLOOR_SURFACE_Y.tilePattern, z), q, new THREE.Vector3(1, 1, 1)); checker.setMatrixAt(i, m4); });
  group.add(checker);
  box(W - 0.5, 0.02, 6.4, 0, 0.005, -8.95, TERRA);
  box(2.2, 0.03, 1.2, 0, 0.03, 5.0, RED);                                   // door mat

  // ── lighting fixtures: pendants over the counter, strip lights over the kitchen ──
  for (const x of [-5.2, -1.7, 1.7, 5.2]) {
    cyl(0.015, 0.015, 1.1, x, 4.05, -3.9, 0x333333);
    cyl(0.12, 0.34, 0.3, x, 3.38, -3.9, 0xd8cdb8, {}, 14, true);
    cyl(0.1, 0.1, 0.05, x, 3.27, -3.9, 0xfff0c8, { e: 0xffd98a });
  }
  for (const x of [-4.4, 0, 4.4]) box(1.6, 0.08, 0.3, x, 4.52, -9.2, 0xfff6e0, { e: 0xfff0c0 });
  for (const x of [-4.5, 0, 4.5]) box(1.4, 0.1, 0.5, x, 4.5, 1.2, 0xffe6ad, { e: 0xffce7a });

  // ── food builders ──
  const boule = (x, y, z, c = CRUST) => { ball(0.15, x, y + 0.08, z, c, { s: [1, 0.62, 1] }); box(0.02, 0.01, 0.2, x, y + 0.17, z, 0xf1dcae, { ry: 0.7 }); };
  const tinLoaf = (x, y, z, c = CRUST, ry = 0) => { box(0.3, 0.12, 0.14, x, y + 0.06, z, c, { ry }); box(0.3, 0.06, 0.12, x, y + 0.15, z, DARKCRUST, { ry }); };
  const baguette = (x, y, z, ry = 0, rot = Math.PI / 2) => cyl(0.04, 0.04, 0.6, x, y, z, 0xd29a4f, { rz: rot, ry }, 8);
  const roll = (x, y, z, c = CRUST) => ball(0.07, x, y + 0.04, z, c, { s: [1, 0.7, 1] });
  const pie = (x, y, z) => { cyl(0.1, 0.085, 0.06, x, y + 0.03, z, GOLD, {}, 12); cyl(0.07, 0.07, 0.02, x, y + 0.07, z, 0xb8742f, {}, 10); };
  const cream = (x, y, z, c = 0xf6e7b8) => { box(0.16, 0.05, 0.1, x, y + 0.025, z, 0xe9c680); box(0.15, 0.03, 0.09, x, y + 0.065, z, c); };
  const lamington = (x, y, z) => box(0.09, 0.08, 0.09, x, y + 0.04, z, 0x4f3322);
  const doughnut = (x, y, z, c = 0xf4d9a8) => put(geo('dn', () => new THREE.TorusGeometry(0.06, 0.03, 6, 12)), c, x, y + 0.035, z, { rx: Math.PI / 2 });
  const croissant = (x, y, z, ry = 0) => put(geo('cr', () => new THREE.TorusGeometry(0.06, 0.032, 6, 10, 4.2)), 0xd9a24f, x, y + 0.04, z, { rx: Math.PI / 2, rz: ry });
  const tray = (w, d, x, y, z) => box(w, 0.02, d, x, y + 0.01, z, STEEL2);
  const basket = (x, y, z, r = 0.3, h = 0.2) => { cyl(r, r * 0.85, h, x, y + h / 2, z, WICKER, {}, 12, true); cyl(r * 0.85, r * 0.85, 0.02, x, y + 0.01, z, DARKWOOD, {}, 12); };

  // ── stock levels from the live simulation ──
  const out = site.out || {};
  const breadN = out.bread ?? 24, pieN = out.pie ?? 6;
  const BREAD_SLOTS = 20, bread = Math.max(0, Math.min(1, breadN / 24));
  const filled = Math.round(bread * BREAD_SLOTS);

  // ── BREAD WALL: four shelves of baskets along the right wall ──
  const BZ0 = 0.4, BZ1 = 4.4, BX = 6.55;
  blocker(0.8, BZ1 - BZ0 + 0.3, BX, (BZ0 + BZ1) / 2);
  const bzc = (BZ0 + BZ1) / 2, blen = BZ1 - BZ0 + 0.3;
  box(0.05, 2.1, blen, EDGE - 0.2, 1.05, bzc, DARKWOOD);                                  // back panel
  for (const ez of [BZ0 - 0.15, BZ1 + 0.15, bzc]) box(0.7, 2.1, 0.07, BX, 1.05, ez, DARKWOOD); // uprights
  const levels = [0.38, 0.9, 1.42, 1.94];
  let slot = 0;
  levels.forEach((ly, li) => {
    box(0.74, 0.06, BZ1 - BZ0 + 0.3, BX - 0.0, ly, (BZ0 + BZ1) / 2, WOOD);
    for (let i = 0; i < 5; i++, slot++) {
      const z = BZ0 + 0.4 + i * 0.8, x = BX - 0.12, have = slot < filled;
      basket(x, ly + 0.03, z, 0.27, 0.16);
      if (!have) continue;
      if (li === 0) { boule(x, ly + 0.1, z - 0.08); boule(x, ly + 0.1, z + 0.12, 0xb87636); }
      else if (li === 1) { tinLoaf(x, ly + 0.08, z - 0.08, 0xc99552, Math.PI / 2); tinLoaf(x, ly + 0.08, z + 0.1, 0xa06a32, Math.PI / 2); }
      else if (li === 2) { for (const dz of [-0.14, 0, 0.14]) baguette(x, ly + 0.25, z + dz, 0.05 * dz, Math.PI / 2 - 0.12); }
      else { for (const [dx, dz] of [[-0.06, -0.08], [0.06, -0.06], [0, 0.07], [-0.07, 0.1]]) roll(x + dx, ly + 0.1, z + dz, i % 2 ? CRUST : 0xd8a35a); }
    }
  });
  box(0.04, 0.5, BZ1 - BZ0 + 0.2, BX - 0.34, 2.45, (BZ0 + BZ1) / 2, 0x2f3d34);
  text(breadN > 0 ? 'Fresh bread today' : 'Sold out — more soon', BX - 0.9, 2.55, (BZ0 + BZ1) / 2);
  text(`${Math.round(breadN)} loaves on the shelves`, BX - 0.9, 2.25, (BZ0 + BZ1) / 2);
  placedProps.push({ type: 'shelves', room: 0 });

  // ── DISPLAY TABLE with baskets and a cake stand (customers walk around it) ──
  solid(0.95, 0.85, 2.0, 3.9, 0.425, 2.4, WOOD);
  box(1.05, 0.05, 2.1, 3.9, 0.87, 2.4, 0xe7d9bd);
  basket(3.9, 0.9, 1.8, 0.28, 0.14); for (const dz of [-0.05, 0.1]) cream(3.9, 1.0, 1.8 + dz * 2, 0xf6e7b8);
  basket(3.9, 0.9, 2.5, 0.28, 0.14); for (const [dx, dz] of [[-0.08, 0], [0.08, 0.06], [0, -0.1]]) roll(3.9 + dx, 1.0, 2.5 + dz, 0xd8a35a);
  cyl(0.18, 0.18, 0.02, 3.9, 0.95, 3.1, 0xf3f0e8, {}, 14); cyl(0.04, 0.04, 0.12, 3.9, 0.9, 3.1, 0xf3f0e8, {}, 8);
  for (let a = 0; a < 6; a++) croissant(3.9 + Math.cos(a) * 0.1, 0.98, 3.1 + Math.sin(a) * 0.1, a);
  text('Fresh from the oven', 3.9, 1.5, 2.4);

  // ── A-frame chalkboard by the door ──
  solid(0.8, 1.0, 0.4, 2.35, 0.5, 4.9, 0x2f3d34);
  box(0.76, 0.9, 0.04, 2.35, 0.55, 4.72, 0x2f3d34, { rx: -0.12 });
  text('Today: bread · pies · buns', 2.35, 1.25, 4.9);

  // ── SEATING by the front window: wall bench, two round tables, chairs ──
  solid(0.7, 0.5, 3.3, -6.55, 0.25, 2.0, DARKWOOD);
  box(0.12, 0.55, 3.3, -6.84, 0.78, 2.0, 0x7a4a3a);
  box(0.62, 0.1, 3.2, -6.55, 0.55, 2.0, 0xb5624e);
  for (const tz of [3.3, 0.4]) {
    solid(0.9, 0.74, 0.9, -4.5, 0.37, tz, 0xe6d2ad);
    cyl(0.5, 0.5, 0.05, -4.5, 0.77, tz, 0xe8dcc0, {}, 18); cyl(0.07, 0.1, 0.72, -4.5, 0.38, tz, 0x333333, {}, 8);
    cyl(0.07, 0.07, 0.14, -4.5, 0.86, tz, 0xf0f0ea, {}, 10); cyl(0.04, 0.04, 0.08, -4.5, 0.92, tz + 0.12, GREEN, {}, 6);   // cup and bud vase
    for (const [cx, cz] of [[-3.7, tz], [-4.5, tz + (tz > 1 ? 0.8 : -0.8)]]) {
      solid(0.46, 0.46, 0.46, cx, 0.23, cz, DARKWOOD);
      box(0.42, 0.05, 0.42, cx, 0.46, cz, 0xcaa56a); box(0.42, 0.45, 0.05, cx + (cx > -4 ? 0.2 : 0), 0.72, cz + (cx > -4 ? 0 : (tz > 1 ? 0.2 : -0.2)), DARKWOOD, { ry: cx > -4 ? Math.PI / 2 : 0 });
    }
  }
  text('Café corner', -4.5, 1.7, 1.85);
  // Pot plants in the front corners and a shelf of cookbooks above the bench.
  for (const px of [-6.45, 6.45]) { solid(0.5, 0.5, 0.5, px, 0.25, 5.3, 0x9b5a3c); ball(0.4, px, 0.95, 5.3, GREEN, { s: [1, 1.2, 1] }); }
  box(0.2, 0.05, 2.4, -6.85, 2.15, 2.0, WOOD); for (let i = 0; i < 7; i++) box(0.14, 0.26, 0.08, -6.82, 2.3, 1.0 + i * 0.3, [RED, 0x3f6a8a, GOLD, GREEN][i % 4]);

  // ── THE COUNTER ──
  // Left half is a low tiled base under a glass pastry case; right half is the full-height working
  // counter with a marble top. The kitchen stays visible through and over the glass.
  blocker(W - 0.24, 1.1, 0, COUNTER_Z);
  const CASE_X0 = -6.76, CASE_X1 = -0.9, caseW = CASE_X1 - CASE_X0, caseCx = (CASE_X0 + CASE_X1) / 2;
  box(caseW, 0.62, 1.1, caseCx, 0.31, COUNTER_Z, WOOD);
  box(caseW, 0.5, 0.06, caseCx, 0.32, COUNTER_Z + 0.58, TILE);
  const RX0 = CASE_X1, RW = EDGE - 0.12 - RX0, RCX = (RX0 + EDGE - 0.12) / 2;
  box(RW, 1.2, 1.1, RCX, 0.6, COUNTER_Z, WOOD);
  box(RW, 0.5, 0.06, RCX, 0.32, COUNTER_Z + 0.58, TILE);
  box(RW + 0.1, 0.06, 1.3, RCX, 1.22, COUNTER_Z, 0xe9e5dc);                  // marble top
  // glass case: front pane, top pane, steel frame rails, an upper shelf, two rows of trays on each level
  box(caseW, 0.72, 0.03, caseCx, 0.98, COUNTER_Z + 0.5, GLASS, { a: 0.22 });
  box(caseW, 0.03, 1.06, caseCx, 1.35, COUNTER_Z, GLASS, { a: 0.22 });
  box(caseW, 0.04, 0.05, caseCx, 1.35, COUNTER_Z + 0.5, STEEL); box(caseW, 0.04, 0.05, caseCx, 0.63, COUNTER_Z + 0.5, STEEL);
  for (const sx of [CASE_X0, CASE_X1]) box(0.05, 0.72, 1.06, sx, 0.98, COUNTER_Z, GLASS, { a: 0.25 });
  box(caseW, 0.025, 0.95, caseCx, 1.0, COUNTER_Z - 0.02, GLASS, { a: 0.4 });
  const goods = [
    (x, y, z, i) => cream(x, y, z, i % 2 ? 0xf6e7b8 : 0xf0c8d0), (x, y, z) => lamington(x, y, z), (x, y, z, i) => doughnut(x, y, z, i % 2 ? 0xf4d9a8 : 0xe8a6b6),
    (x, y, z) => croissant(x, y, z, 0.3), (x, y, z) => pie(x, y, z), (x, y, z) => cream(x, y, z, 0xffffff),
  ];
  const caseSlots = Math.floor(caseW / 0.42);
  for (const [lvl, base] of [[0, 0.62], [1, 1.0]]) for (let i = 0; i < caseSlots; i++) {
    const x = CASE_X0 + 0.3 + i * 0.42;
    for (const [dz, row] of [[0.2, 0], [-0.2, 1]]) { tray(0.38, 0.34, x, base + 0.0, COUNTER_Z + dz); goods[(i + row * 2 + lvl * 3) % goods.length](x, base + 0.02, COUNTER_Z + dz, i); }
  }
  // cake stands with domes on top of the case
  for (const [x, c] of [[-5.6, 0xf4b6c2], [-3.4, 0xf3ead2]]) {
    cyl(0.04, 0.04, 0.16, x, 1.45, COUNTER_Z + 0.1, 0xf3f0e8, {}, 8); cyl(0.2, 0.2, 0.02, x, 1.54, COUNTER_Z + 0.1, 0xf3f0e8, {}, 16);
    cyl(0.15, 0.15, 0.12, x, 1.61, COUNTER_Z + 0.1, c, {}, 14);
    ball(0.21, x, 1.64, COUNTER_Z + 0.1, GLASS, { a: 0.3, s: [1, 0.8, 1] });
  }
  // tip jar and hand bell on the working counter
  cyl(0.08, 0.08, 0.16, 2.0, 1.33, COUNTER_Z + 0.35, GLASS, { a: 0.4 }, 10);
  cyl(0.06, 0.07, 0.04, 2.4, 1.27, COUNTER_Z + 0.35, 0xc9a24a, {}, 10);
  // pie warmer: heated glass cabinet at the near end of the working counter
  box(1.2, 0.7, 0.6, 0.45, 1.6, COUNTER_Z - 0.1, STEEL2); box(1.12, 0.5, 0.04, 0.45, 1.6, COUNTER_Z + 0.22, GLASS, { a: 0.3 });
  box(1.1, 0.04, 0.5, 0.45, 1.5, COUNTER_Z - 0.1, 0xffb066, { e: 0xff9a4a });
  for (let i = 0; i < Math.min(6, Math.ceil(pieN / 2)); i++) pie(0.05 + (i % 3) * 0.4, 1.52, COUNTER_Z - 0.1 + (i < 3 ? 0.1 : -0.15));
  text(pieN > 0 ? `Hot pies · ${Math.round(pieN)} ready` : 'Pies out soon', 0.45, 2.25, COUNTER_Z + 0.1);
  // register, card reader, bag stack and bread slicer (right half)
  box(0.5, 0.16, 0.4, 3.4, 1.33, COUNTER_Z + 0.05, 0x2e2e33); box(0.4, 0.3, 0.05, 3.4, 1.52, COUNTER_Z - 0.1, 0x2e2e33, { rx: -0.3 }); box(0.3, 0.2, 0.04, 3.4, 1.54, COUNTER_Z - 0.09, 0x6fc2a0, { e: 0x3f9e7c, rx: -0.3 });
  box(0.16, 0.04, 0.22, 4.0, 1.27, COUNTER_Z + 0.25, 0x222222, { rz: 0.15 });
  for (let i = 0; i < 6; i++) box(0.34, 0.012, 0.22, 4.7, 1.26 + i * 0.012, COUNTER_Z + 0.2, 0xd8bf94);
  box(0.9, 0.5, 0.55, 5.9, 1.52, COUNTER_Z + 0.05, STEEL); box(0.7, 0.04, 0.4, 5.9, 1.79, COUNTER_Z + 0.05, 0x333333); box(0.04, 0.3, 0.45, 5.7, 1.62, COUNTER_Z + 0.05, 0x333333);
  tinLoaf(5.9, 1.25, COUNTER_Z + 0.3, 0xc99552);
  // hinged counter flap (staff gate) and brass hinge
  box(0.8, 0.08, 1.2, -0.5, 1.26, COUNTER_Z, 0x9a7650); cyl(0.025, 0.025, 0.1, -0.92, 1.26, COUNTER_Z, 0xc9a24a, { rz: Math.PI / 2 }, 6);
  // header beam with the shop sign and two chalkboard menus
  box(W - 0.4, 0.9, 0.28, 0, 4.1, -6.2, DARKWOOD);
  for (const x of [-4.2, 4.2]) { box(2.4, 0.7, 0.05, x, 4.1, -6.04, 0x2f3d34); box(2.5, 0.8, 0.04, x, 4.1, -6.06, WOOD); }
  text(site.name, 0, 4.1, -6.0, 'room');
  text('Bread · Rolls · Sourdough', -4.2, 4.2, -5.98); text('Pies · Pastries · Cakes', 4.2, 4.2, -5.98);
  text('Open 4:30 am', -4.2, 3.9, -5.98); text('Baked fresh daily', 4.2, 3.9, -5.98);
  text('Bread counter', 0.6, 1.95, COUNTER_Z + 0.55);
  placedProps.push({ type: 'counter', room: 0 });

  // ── KITCHEN (visible over the counter) ──
  const kz = BACK + 1.0;
  // deck ovens: two stacks of three decks under an extraction hood
  for (const ox of [-3.2, 0.1]) {
    box(2.6, 1.9, 1.5, ox, 0.95, kz, STEEL);
    for (let d = 0; d < 3; d++) {
      box(2.2, 0.42, 0.04, ox, 0.45 + d * 0.55, kz + 0.77, 0x241913);
      box(1.8, 0.28, 0.02, ox, 0.45 + d * 0.55, kz + 0.795, 0xff9a4a, { e: 0xff7a22 });
      cyl(0.02, 0.02, 1.9, ox, 0.62 + d * 0.55, kz + 0.84, 0x555555, { rz: Math.PI / 2 }, 6);
    }
    box(2.7, 0.55, 1.7, ox, 3.1, kz, STEEL2); box(0.5, 1.4, 0.5, ox, 3.9, kz - 0.2, STEEL2);
  }
  // spiral mixer
  box(0.9, 0.9, 1.2, 3.5, 0.45, kz - 0.1, 0x8f2f2a); cyl(0.42, 0.34, 0.5, 3.5, 1.15, kz + 0.2, STEEL, {}, 16); cyl(0.04, 0.04, 0.6, 3.5, 1.4, kz + 0.2, STEEL2, {}, 6); box(0.7, 0.35, 0.5, 3.5, 1.65, kz - 0.35, 0x8f2f2a);
  ball(0.3, 3.5, 1.4, kz + 0.2, 0xf1e6cc, { s: [1, 0.5, 1] });
  // proofer cabinet with trays of dough
  box(1.0, 2.0, 0.9, 5.7, 1.0, kz, 0xdfe3e6); box(0.8, 1.7, 0.04, 5.7, 1.0, kz + 0.47, GLASS, { a: 0.35 });
  for (let i = 0; i < 5; i++) { box(0.7, 0.02, 0.7, 5.7, 0.35 + i * 0.33, kz, STEEL2); for (const dx of [-0.2, 0, 0.2]) ball(0.08, 5.7 + dx, 0.42 + i * 0.33, kz + 0.1, 0xf1e6cc, { s: [1, 0.7, 1] }); }
  // stainless prep island with dough, scales, rolling pin and banneton baskets
  box(3.6, 0.9, 1.0, 0.2, 0.45, -8.2, STEEL2); box(3.6, 0.06, 1.1, 0.2, 0.93, -8.2, STEEL); box(3.4, 0.05, 0.9, 0.2, 0.3, -8.2, STEEL2);
  box(1.0, 0.012, 0.7, -0.8, 0.965, -8.2, 0xf6f3ec);                                   // dusted flour
  for (const [x, z] of [[-1.0, -8.3], [-0.6, -8.0], [-0.4, -8.4]]) ball(0.13, x, 1.03, z, 0xf1e6cc, { s: [1, 0.6, 1] });
  cyl(0.03, 0.03, 0.6, 0.0, 1.0, -8.0, 0xd9b982, { rz: Math.PI / 2 }, 8);
  for (const x of [1.0, 1.5]) cyl(0.18, 0.14, 0.14, x, 1.05, -8.3, 0xb98c52, {}, 12);
  box(0.28, 0.1, 0.22, 1.9, 1.0, -8.1, 0x333333); box(0.2, 0.01, 0.16, 1.9, 1.06, -8.1, 0x9ee0c0, { e: 0x4fb88a });
  // marble pastry bench along the left wall, trolley racks of cooling loaves
  box(0.9, 0.9, 2.2, -6.4, 0.45, -7.6, WOOD); box(0.95, 0.06, 2.3, -6.4, 0.93, -7.6, 0xe9e5dc);
  for (let i = 0; i < 4; i++) { ball(0.1, -6.4, 1.0, -8.2 + i * 0.4, 0xf3d9a4, { s: [1, 0.6, 1] }); }
  for (const rz of [-9.2, -10.6]) {
    for (const [dx, dz] of [[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]]) cyl(0.02, 0.02, 1.8, -6.1 + dx * 0.6, 0.9, rz + dz * 0.6, 0x666666, {}, 6);
    for (let i = 0; i < 5; i++) { tray(0.55, 0.45, -6.1, 0.2 + i * 0.36, rz); tinLoaf(-6.1, 0.22 + i * 0.36, rz, i % 2 ? CRUST : 0xb87636, Math.PI / 2); }
  }
  // flour sacks (from the Mill), sink and ingredient shelving
  for (const [x, y, z] of [[6.2, 0.1, -7.3], [6.2, 0.1, -7.95], [6.2, 0.3, -7.6], [5.6, 0.1, -7.6]]) { box(0.55, 0.2, 0.75, x, y + 0.1, z, 0xeee3c8, { ry: 0.1 }); box(0.3, 0.08, 0.02, x, y + 0.12, z + 0.38, 0x8d5424); }
  text('Flour · from the Mill', 6.0, 1.0, -7.6);
  box(0.9, 0.9, 1.1, 6.3, 0.45, -9.4, STEEL2); box(0.7, 0.1, 0.8, 6.3, 0.9, -9.4, 0x707479); cyl(0.025, 0.025, 0.35, 6.55, 1.15, -9.4, STEEL, {}, 6);
  for (const y of [1.6, 2.1, 2.6]) { box(0.35, 0.05, 3.0, 6.7, y, -9.0, WOOD); for (let i = 0; i < 5; i++) cyl(0.12, 0.12, 0.28, 6.7, y + 0.16, -10.2 + i * 0.6, i % 2 ? 0xe9e4d8 : 0xc9a24a, {}, 10); }
  // clock and wall rail of utensils
  cyl(0.28, 0.28, 0.05, 3.2, 3.4, BACK + 0.2, 0xf3f0e8, { rx: Math.PI / 2 }, 20); box(0.02, 0.2, 0.02, 3.2, 3.48, BACK + 0.24, 0x222222); box(0.14, 0.02, 0.02, 3.26, 3.4, BACK + 0.24, 0x222222);
  cyl(0.015, 0.015, 3.0, 0, 2.6, BACK + 0.2, 0x666666, { rz: Math.PI / 2 }, 6);
  for (let i = 0; i < 7; i++) box(0.05, 0.4, 0.02, -1.3 + i * 0.45, 2.38, BACK + 0.2, i % 2 ? 0xc9c9c9 : 0x8a6340);

  // ── interactions and the scene description used by NPC awareness ──
  const add = (key, label, doWhat, body, x, z) => {
    const pos = new THREE.Vector3(x, 0, z);
    interactables.push({ key: site.id + ':' + key, type: 'civic', label, room: 0, roomName: roomTitle, pos, act: { do: doWhat, title: label, text: body, civicId: site.id } });
    sceneObjects.push({ type: 'civic', label, room: 0, pos: { x, z }, interactive: true });
  };
  add('counter', 'Bread counter', 'civic-ledger', 'Buy fresh bread and pies, or open the Town Ledger.', 0.6, -4.2);
  add('pastries', 'Pastry case', 'info', 'The glass case holds cream buns, lamingtons, doughnuts, croissants and meat pies. The pie warmer keeps the day\'s pies hot. Pies are made each day from flour, lamb and vegetables.', -4.6, -4.2);
  add('kitchen', 'Bakery kitchen', 'bakery-kitchen', 'Through the counter you can see the deck ovens, spiral mixer, proofer and the cooling racks. Bakers start at half past four: dough is mixed and shaped, proved warm and humid, then baked on the oven decks.', -2.2, -4.2);
  // Supervised batch controls at the customer-visible demonstration counter.
  // The professional production equipment remains behind the staffed kitchen barrier.
  add('mixer-control', 'Supervised mixer · start bread batch', 'bakery-production', 'Two bags of real flour are mixed by the baker; proofing takes 40 town minutes.', -3.9, -3.3);
  interactables.at(-1).act.action='mix';
  add('oven-control', 'Supervised deck oven · load proofed dough', 'bakery-production', 'The baker loads proofed dough into the guarded deck oven for 25 town minutes.', 0, -3.3);
  interactables.at(-1).act.action='oven';
  add('rack-control', 'Cooling rack · unload finished batch', 'bakery-production', 'The baker confirms the bread is finished before eight saleable loaves are added to inventory.', 3.6, -3.3);
  interactables.at(-1).act.action='unload';
  text('Mixer',-3.9,1.72,-3.3);
  text('Oven',0,1.72,-3.3);
  text('Cooling rack',3.6,1.72,-3.3);
  add('breadwall', 'Bread wall', 'info', `Sourdough boules, tin loaves, baguettes and rolls sit in baskets on the bread wall. ${Math.round(breadN)} loaves are out right now. Flour arrives from the Mill, so no flour means no bread.`, 5.4, 2.4);
  add('cafe', 'Café corner', 'info', 'Two small tables and a bench by the window, for a pie and a cuppa while the bread cools.', -3.0, 1.9);
  placedProps.push({ type: 'noticeboard', room: 0 });

  const rooms = [{ name: roomTitle, x0: -EDGE, x1: EDGE, z0: BACK, z1: FRONT, w: W, d: D, parent: -1 }];
  return {
    group, colliders, interactables, sceneObjects, placedProps, rooms,
    doors: [], dynamics: [], sight: [],
    staff: { pos: BAKERY_LAYOUT.staff, use: BAKERY_LAYOUT.staffUse },
    windows: shell.windows,
    bounds: { x0: -EDGE, x1: EDGE, z0: BACK, z1: FRONT },
    spawn: new THREE.Vector3(0, 0, FRONT - 2.25),
    exitZone: { x0: -1.05, x1: 1.05, z0: FRONT - 0.1, z1: FRONT + 1.2 },
  };
}
