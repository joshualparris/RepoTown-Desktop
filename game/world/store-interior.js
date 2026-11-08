import { createKit, ROOM, signFace } from './interior-kit.js';

// The General Store, laid out like an Australian country general store:
//   • A basket stack, a newspaper and magazine rack and a bright produce table just inside the door.
//   • Two double-sided gondola shelves down the shop, with the long walls lined in shelving, so
//     customers wander past tins, packets and dry goods on the way to the back.
//   • Glass-door chillers for milk, eggs and butter along the right wall; a bread rack by the counter.
//   • A full-width service counter at the back with a till, scales, lolly jars and a coffee machine;
//     the storeroom, stock boxes and a pallet sit behind it.
// Shelves follow the live stock: a bare shelf has fewer tins and packets on it.
export const STORE_LAYOUT = Object.freeze({ counterZ: -5.6, staff: { x: -1.2, z: -6.75 }, staffUse: { x: -1.2, z: -4.4 } });

export function buildStoreInterior(site, makeLabel, roomTitle = 'General Store') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, solid, text, add } = k;
  const { W, FRONT, BACK, EDGE } = ROOM;
  const CZ = STORE_LAYOUT.counterZ;
  group.add(new THREE.HemisphereLight(0xfff4de, 0x6b6050, 2.0));
  const tube = new THREE.PointLight(0xfff2d6, 1.0, 16, 1.6); tube.position.set(0, 3.8, -1.5); group.add(tube);

  const CREAM = 0xe8dfc8, TIMBER = 0x9a7650, DARKW = 0x5d422b, SHELF = 0x7a5a3a, RED = 0xb34a3a, GREEN = 0x5f8a4e, STEEL = 0xc2c7cc, GLASS = 0xcfe8ee;
  k.shell({ wall: CREAM, ceiling: 0xf6f2e8, floor: 0xc9b99a });
  // timber floorboards, a green skirting stripe and a brick-red feature band
  for (let i = 0; i < 14; i++) box(0.96, 0.014, 17.4, -6.5 + i, 0.004, -3, i % 2 ? 0xb89d72 : 0xc4a97c);
  box(W - 0.5, 0.18, 0.05, 0, 0.1, BACK + 0.14, GREEN);
  for (const sx of [-EDGE + 0.14, EDGE - 0.14]) box(0.05, 0.18, 17.4, sx, 0.1, -3, GREEN);
  box(W - 0.5, 0.2, 0.1, 0, 3.7, BACK + 0.2, RED);
  // fluorescent tubes
  for (const z of [3, -1.5, -6]) for (const x of [-3.5, 3.5]) box(1.5, 0.06, 0.18, x, 4.5, z, 0xfffbe8, { e: 0xfff1c4 });
  // door mat and a swing sign
  box(2.2, 0.03, 1.2, 0, 0.02, 5.0, 0x55402e); box(0.5, 0.35, 0.04, 1.4, 2.7, FRONT - 0.1, 0xf4f0e0); text('Open', 1.4, 2.95, FRONT - 0.3, 'room');

  // ── stock-driven fill ──
  const goods = Object.keys(site.target || {}), stock = site.stock || {};
  const frac = goods.length ? Math.max(0.2, Math.min(1, goods.reduce((s, g) => s + Math.min(1, (stock[g] || 0) / (site.target[g] || 1)), 0) / goods.length)) : 1;
  const PACK = [0xc9553d, 0xe3b04b, 0x4f7fa6, 0x6f9a54, 0xd8d0b8, 0x8a5a8e];
  // Tins and packets are collected here and drawn as two instanced meshes at the end (two draw
  // calls instead of several hundred, which matters on phones).
  const tins = [], packs = [];
  const stockRow = (x, y, z, len, axis, i0) => {          // a row of tins/packets along a shelf, thinned when stock is low
    const n = Math.floor(len / 0.22);
    for (let i = 0; i < n; i++) {
      if ((i * 37 + Math.round(i0) * 11) % 100 / 100 > frac) continue;
      const c = PACK[Math.abs(Math.round(i * 5 + i0)) % PACK.length], h = 0.2 + (Math.abs(Math.round(i * 7 + i0)) % 3) * 0.04;
      const px = axis === 'x' ? x - len / 2 + 0.11 + i * 0.22 : x, pz = axis === 'z' ? z - len / 2 + 0.11 + i * 0.22 : z;
      (Math.round(i + i0) % 3 === 0 ? tins : packs).push({ x: px, y: y + h / 2, z: pz, h, c });
    }
  };

  // ── wall shelving down both long walls ──
  for (const side of [-1, 1]) {
    const x = side * (EDGE - 0.35);
    if (side === 1) { /* right wall is the chiller bank near the front half, shelving behind */ }
    const z0 = side === -1 ? 3.6 : -3.0, z1 = side === -1 ? -5.1 : -5.1;
    const len = z0 - z1, zc = (z0 + z1) / 2;
    // Open frame: no opaque backing volume under the shelf faces. Leave a
    // measurable gap between shelves, end posts and side rails to avoid z-fighting.
    for (const end of [-1, 1]) box(0.08, 2.1, 0.08, x, 1.05, zc + end * (len / 2 - 0.04), DARKW);
    box(0.08, 2.1, Math.max(0.1, len - 0.16), x + side * 0.22, 1.05, zc, SHELF);
    for (const y of [0.35, 0.85, 1.35, 1.85]) {
      box(0.38, 0.04, len - 0.20, x - side * 0.01, y, zc, TIMBER);
      stockRow(x - side * 0.06, y + 0.02, zc, len - 0.3, 'z', Math.round(y * 10));
    }
  }
  // glass-door chillers: milk, eggs and butter
  solid(0.9, 2.1, 4.4, EDGE - 0.55, 1.05, -0.7, 0xd9dde0);
  box(0.06, 1.9, 4.2, EDGE - 1.02, 1.05, -0.7, GLASS, { a: 0.35 });
  for (const y of [0.4, 0.9, 1.4, 1.85]) { box(0.8, 0.03, 4.2, EDGE - 0.55, y, -0.7, STEEL); for (let i = 0; i < 12; i++) box(0.2, 0.24, 0.2, EDGE - 0.82, y + 0.14, -2.7 + i * 0.35, i % 3 === 0 ? 0x4f7fa6 : i % 3 === 1 ? 0xf3efe2 : 0xe3b04b); }
  box(4.3, 0.2, 0.9, EDGE - 0.55, 2.2, -0.7, 0x2a6f9a, { e: 0x1c4f70 }); text('Milk · Eggs · Butter', EDGE - 1.1, 2.75, -0.7);

  // ── two double-sided gondolas ──
  for (const gx of [-3.6, 3.6]) {
    // The shelf carcass used to be a solid box with four shelf slabs buried inside it.
    // Their coplanar faces fought the depth buffer (grey flashing lines). Build an
    // open-backed metal frame instead, with shelf slabs sitting clear of the uprights.
    // A thin centre spine, open on both faces so the stock shows from each aisle.
    box(0.06, 1.75, 5.3, gx, 0.88, -0.2, 0x8c8f93); k.blocker(1.0, 5.4, gx, -0.2);
    for(const ez of [-2.85,2.45])box(0.9,1.7,0.08,gx,0.85,ez,0x8c8f93);
    for (const y of [0.3, 0.75, 1.2, 1.6]) { box(0.78, 0.04, 5.16, gx, y, -0.2, 0xb4b8bc); stockRow(gx - 0.2, y + 0.02, -0.2, 5.0, 'z', gx * 3 + y * 7); stockRow(gx + 0.2, y + 0.02, -0.2, 5.0, 'z', gx * 5 + y * 3); }
    box(1.0, 0.3, 0.06, gx, 1.95, -0.2, RED);                 // end-cap header
    solid(1.1, 0.9, 0.5, gx, 0.45, 2.75, RED); stockRow(gx, 0.9, 2.75, 1.0, 'x', gx * 9); text('Specials', gx, 1.4, 2.75);
  }
  // Hanging aisle signs, printed so they read from the door.
  for (const [gx, words] of [[-3.6, 'Dry goods · Baking'], [3.6, 'Pantry · Tins · Tea']]) {
    box(1.6, 0.34, 0.04, gx, 2.6, 0.2, 0x7a2f26); for (const dx of [-0.6, 0.6]) box(0.02, 1.8, 0.02, gx + dx, 3.6, 0.2, 0x777777);
    signFace(THREE, group, words, 1.56, 0.3, gx, 2.6, 0.225, '#7a2f26');
  }

  // ── produce table, basket stack, newspapers ──
  solid(2.0, 0.8, 1.0, 0, 0.4, -1.2, TIMBER);
  box(2.1, 0.06, 1.1, 0, 0.82, -1.2, 0xb6925e);
  for (let i = 0; i < 5; i++) { box(0.4, 0.14, 0.4, -0.78 + i * 0.4, 0.92, -1.2, 0xc79a56); for (let j = 0; j < 4; j++) ball(0.07, -0.88 + i * 0.4 + (j % 2) * 0.14, 1.06, -1.28 + (j >> 1) * 0.14, [0xd8452f, 0xe39a2f, 0x7fb04a, 0xe8c63a, 0x9b3a6a][i]); }
  text('Fresh today', 0, 1.6, -1.2);
  for (let i = 0; i < 4; i++) box(0.4, 0.12, 0.3, -5.6, 0.07 + i * 0.12, 4.7, 0xc23b32);   // baskets
  solid(0.7, 1.3, 0.35, 5.8, 0.65, 4.8, 0x5a4a3a); for (let i = 0; i < 4; i++) box(0.6, 0.24, 0.04, 5.8, 0.4 + i * 0.28, 4.62, [0xf0e6c8, 0xd9e8f0, 0xf0d6d0, 0xe0e8d0][i]);
  text('Papers & mags', 5.8, 1.7, 4.8);

  // ── service counter, full width, with till, scales, jars and a coffee machine ──
  solid(W - 0.4, 1.0, 0.9, 0, 0.5, CZ, 0x6b4d33);
  box(W - 0.3, 0.07, 1.0, 0, 1.03, CZ, 0xcfc4ac);
  box(6.5, 0.05, 0.05, -1.5, 0.95, CZ + 0.47, 0xc9a24a);
  box(0.5, 0.3, 0.45, -0.6, 1.2, CZ, 0x2d3036); box(0.4, 0.22, 0.02, -0.6, 1.3, CZ + 0.24, 0x8fc4e8, { e: 0x4f94c8 });
  box(0.4, 0.06, 0.4, -2.4, 1.1, CZ + 0.05, STEEL); box(0.04, 0.3, 0.04, -2.4, 1.28, CZ + 0.05, STEEL);   // scales
  for (let i = 0; i < 5; i++) { cyl(0.1, 0.1, 0.26, 1.5 + i * 0.3, 1.2, CZ + 0.2, 0xcfe8ee, { a: 0.6 }, 10); ball(0.05, 1.5 + i * 0.3, 1.38, CZ + 0.2, [0xd8452f, 0xe39a2f, 0x7fb04a, 0xe8c63a, 0xb04aa0][i]); }
  box(0.45, 0.45, 0.5, 4.6, 1.3, CZ, 0x2b2f35); cyl(0.04, 0.04, 0.1, 4.45, 1.1, CZ + 0.3, STEEL, {}, 6); text('Coffee', 4.6, 1.95, CZ + 0.1);
  solid(2.0, 1.3, 0.6, 4.7, 0.65, CZ + 1.5, 0xc23b32); for (let i = 0; i < 3; i++) box(1.8, 0.05, 0.5, 4.7, 0.3 + i * 0.4, CZ + 1.5, 0xe8d8b8);   // bread rack
  for (let i = 0; i < 6; i++) { cyl(0.11, 0.11, 0.26, 3.9 + (i % 3) * 0.3, 0.42 + Math.floor(i / 3) * 0.4, CZ + 1.5, 0xc79a56, { rz: Math.PI / 2 }, 8); }
  text('Fresh bread', 4.7, 1.85, CZ + 1.5);
  // back wall: stock shelves, cordial and tea; storeroom door; boxes and a pallet
  for (const y of [0.5, 1.1, 1.7, 2.3]) { box(10.5, 0.05, 0.4, 0.8, y, BACK + 0.3, TIMBER); stockRow(0.8, y + 0.03, BACK + 0.3, 10, 'x', y * 13); }
  box(1.4, 2.4, 0.08, -5.6, 1.2, BACK + 0.12, 0x6a5a4a); ball(0.04, -5.2, 1.2, BACK + 0.2, 0xc9a24a);
  for (let i = 0; i < 6; i++) box(0.7, 0.5, 0.6, 5.4 + (i % 2) * 0.8, 0.28 + Math.floor(i / 2) * 0.5, -10.8, 0xb8985c);
  box(1.4, 0.15, 1.2, 4.2, 0.08, -9.2, 0x8a6a40);
  text(site.name, 0, 3.55, CZ - 0.2, 'room');
  text('Shop counter', 0, 1.95, CZ - 0.1);

  add('counter', 'Shop counter', 'civic-ledger', 'Eggs, milk, flour, tea and bread arrive from the farms and the freight train. Pay here, or open the Town Ledger.', STORE_LAYOUT.staffUse.x, STORE_LAYOUT.staffUse.z);
  add('produce', 'Fresh produce table', 'info', 'Fruit and vegetables from the Market Garden and the Orchard sit out on the table by the door.', 0, -2.5);
  add('chiller', 'Chillers', 'info', 'Milk from the Dairy and eggs from the Chook Shed are kept cold in the glass-door chillers along the right wall.', 5.3, -0.7);
  add('shelves', 'Pantry shelves', 'info', 'Flour, tea, coffee and tinned goods fill the gondolas and wall shelves. They thin out when a delivery is late.', -1.3, 2.6);
  add('papers', 'Papers and magazines', 'info', 'The rack by the door has the week\'s papers, magazines and a notice or two from the Town Hall.', 4.6, 3.6);
  k.placedProps.push({ type: 'noticeboard', room: 0 });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  for (const [list, geo, name] of [[packs, new THREE.BoxGeometry(0.17, 1, 0.16), 'store-packets'], [tins, new THREE.CylinderGeometry(0.07, 0.07, 1, 10), 'store-tins']]) {
    if (!list.length) continue;
    const m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), list.length);
    list.forEach((p, i) => { m4.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(1, p.h, 1)); m.setMatrixAt(i, m4); m.setColorAt(i, col.setHex(p.c)); });
    m.name = name; group.add(m);
  }
  return k.finish({ staff: { pos: STORE_LAYOUT.staff, use: STORE_LAYOUT.staffUse } });
}
