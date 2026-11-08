// Narromine railway in 3D: sleepers and two steel rails on every mapped OSM line, and a drivable
// grain train parked in Narromine yard. Track logic lives in narromine-rail-network.js.
//
// The train is an original, unbranded model of the kind of train that really works Narromine: a
// six-axle diesel-electric locomotive hauling covered grain hopper wagons (see the evidence notes in
// narromine-rail-network.js). No operator livery or trademark is copied.
import * as THREE from 'three';
import { RAIL, STREETS } from './narromine-layout.js';
import { buildRailNetwork, createTrainPath, RAIL_GAUGE_M, RAIL_TOP_Y, SPEED_LIMIT_KMH } from './narromine-rail-network.js';

const SLEEPER_SPACING = 0.68;   // concrete sleepers, ~1,470 per km
const LOCO = { length: 22, width: 2.95, height: 4.25 };
const HOPPER = { length: 15.5, width: 2.95, height: 3.9 };
const HOPPERS = 6;
const COUPLER_GAP = 1.0;
export const CONSIST_LENGTH = LOCO.length + HOPPERS * (HOPPER.length + COUPLER_GAP);
// Through freights on the Main Western line, driven by the game. Times are game times chosen to
// spread trains through the day; real paths vary with the harvest and are published only to
// operators (ARTC train alteration advices list grain, ballast and general freight through here).
export const FREIGHT_TIMETABLE = Object.freeze([
  Object.freeze({ id: 'Grain train to Dubbo', from: 'nw', at: 6 * 60 + 10, hoppers: 10 }),
  Object.freeze({ id: 'Empty grain train to Nevertire', from: 'dubbo', at: 10 * 60 + 25, hoppers: 10 }),
  Object.freeze({ id: 'Ballast train to Dubbo', from: 'nw', at: 14 * 60 + 40, hoppers: 6 }),
  Object.freeze({ id: 'General freight to Nevertire', from: 'dubbo', at: 19 * 60 + 35, hoppers: 8 }),
  Object.freeze({ id: 'Grain train to Dubbo', from: 'nw', at: 2 * 60 + 50, hoppers: 10 }),
  Object.freeze({ id: 'Empty grain train to Nevertire', from: 'dubbo', at: 8 * 60 + 15, hoppers: 10 }),
  Object.freeze({ id: 'General freight to Dubbo', from: 'nw', at: 12 * 60 + 5, hoppers: 8 }),
  Object.freeze({ id: 'Grain train to Dubbo', from: 'nw', at: 17 * 60 + 20, hoppers: 10 }),
  Object.freeze({ id: 'Empty grain train to Nevertire', from: 'dubbo', at: 22 * 60 + 40, hoppers: 10 }),
]);
// Nine trains a day, matching the NSW level crossing register's figure for the Dandaloo Street
// crossing on the Main Western line (Transport for NSW open data, crossing 717).
const FREIGHT_RUN_KMH = 60, SIGNAL_GAP = 250, CROSSING_WARN = 200;
const ACCEL = 0.32, SERVICE_BRAKE = 0.55, EMERGENCY_BRAKE = 1.1, RESISTANCE = 0.03, REVERSE_MAX = 15 / 3.6;

function trackMeshes(parent) {
  const sleepers = [], rails = [];
  for (const way of RAIL) {
    let carry = 0;
    for (let i = 1; i < way.pts.length; i++) {
      const [ax, az] = way.pts[i - 1], [bx, bz] = way.pts[i], len = Math.hypot(bx - ax, bz - az);
      if (len < 0.01) continue;
      const yaw = -Math.atan2(bz - az, bx - ax);
      for (let d = carry; d < len; d += SLEEPER_SPACING) sleepers.push([ax + (bx - ax) * d / len, az + (bz - az) * d / len, yaw]);
      carry = (carry - len) % SLEEPER_SPACING; if (carry < 0) carry += SLEEPER_SPACING;
      rails.push({ ax, az, bx, bz, len, yaw });
    }
  }
  const sleeperMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 0.16, 2.5),
    new THREE.MeshLambertMaterial({ color: 0x9a948a }), sleepers.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  sleepers.forEach(([x, z, yaw], i) => { q.setFromAxisAngle(up, yaw); m.compose(new THREE.Vector3(x, 0.255, z), q, one); sleeperMesh.setMatrixAt(i, m); });
  sleeperMesh.name = 'Narromine railway sleepers'; parent.add(sleeperMesh);
  // Both rails of every segment in one merged geometry (one draw call).
  const pos = [], idx = [];
  const half = RAIL_GAUGE_M / 2 + 0.035, w = 0.035, y0 = 0.335, y1 = RAIL_TOP_Y;
  for (const r of rails) {
    const ux = (r.bx - r.ax) / r.len, uz = (r.bz - r.az) / r.len, nx = -uz, nz = ux;
    for (const side of [-1, 1]) {
      const ox = nx * half * side, oz = nz * half * side, base = pos.length / 3;
      for (const [s, t] of [[-w, y0], [w, y0], [w, y1], [-w, y1]]) {
        pos.push(r.ax + ox + nx * s, t, r.az + oz + nz * s, r.bx + ox + nx * s, t, r.bz + oz + nz * s);
      }
      // 4 long faces (bottom, outer, top, inner) between consecutive corner pairs.
      for (let f = 0; f < 4; f++) { const a = base + f * 2, b = base + ((f + 1) % 4) * 2; idx.push(a, a + 1, b + 1, a, b + 1, b); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const railMesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x8a8d90, side: THREE.DoubleSide })); railMesh.name = 'Narromine railway rails';
  parent.add(railMesh);
  return { sleepers: sleepers.length, railSegments: rails.length };
}

function box(group, mat, w, h, d, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); group.add(m); return m; }
function bogies(group, length, mat) {
  for (const z of [-length / 2 + 2.6, length / 2 - 2.6]) {
    box(group, mat, 2.4, 0.55, 3.4, 0, RAIL_TOP_Y + 0.55, z);
    for (const dz of [-1.2, 0, 1.2]) for (const side of [-1, 1]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.14, 12), mat);
      wh.rotation.z = Math.PI / 2; wh.position.set(side * (RAIL_GAUGE_M / 2), RAIL_TOP_Y + 0.46, z + dz); group.add(wh);
    }
  }
}
// Local axes: forward is -z, so a car's group.rotation.y = -heading - PI/2 aims it along the track.
function locomotive() {
  const g = new THREE.Group(), L = LOCO.length;
  const body = new THREE.MeshLambertMaterial({ color: 0x2f3b45 }), stripe = new THREE.MeshLambertMaterial({ color: 0xf2c230 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x1d1f22 }), glass = new THREE.MeshLambertMaterial({ color: 0x9fc3d4 });
  const deck = RAIL_TOP_Y + 1.25;
  box(g, dark, LOCO.width, 0.35, L, 0, deck, 0);                                   // underframe and walkway
  box(g, dark, 2.2, 0.9, 6, 0, deck - 0.6, 0);                                      // fuel tank
  box(g, body, 2.3, 2.6, L - 7.5, 0, deck + 1.47, 2.6);                             // long hood
  box(g, body, LOCO.width - 0.1, 2.75, 3.6, 0, deck + 1.55, -L / 2 + 4.6);           // cab
  box(g, glass, LOCO.width - 0.2, 0.85, 0.06, 0, deck + 2.25, -L / 2 + 2.78);        // windscreen
  box(g, body, LOCO.width - 0.3, 1.35, 2.0, 0, deck + 0.85, -L / 2 + 1.8);          // short nose
  box(g, stripe, LOCO.width - 0.28, 0.32, 0.04, 0, deck + 0.75, -L / 2 + 0.79);      // high-visibility nose band
  box(g, stripe, LOCO.width, 0.12, L, 0, deck + 0.2, 0);                             // yellow sole bar
  for (const side of [-1, 1]) box(g, stripe, 0.04, 0.05, L - 1, side * (LOCO.width / 2 - 0.05), deck + 1.1, 0); // handrails
  box(g, dark, 0.6, 0.4, 1.0, 0, deck + 2.95, 6);                                   // exhaust stack
  const lamp = new THREE.MeshLambertMaterial({ color: 0xfff4c8, emissive: 0xfff0b0, emissiveIntensity: 0.8 });
  for (const side of [-0.6, 0.6]) box(g, lamp, 0.25, 0.25, 0.06, side, deck + 1.35, -L / 2 + 0.78);
  bogies(g, L, dark);
  g.name = 'Narromine grain train locomotive';
  return g;
}
function hopper(n) {
  const g = new THREE.Group(), L = HOPPER.length, deck = RAIL_TOP_Y + 1.15;
  const shell = new THREE.MeshLambertMaterial({ color: n % 3 === 1 ? 0xb9b4a9 : 0xc8c3b6 }), dark = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
  box(g, dark, HOPPER.width - 0.2, 0.3, L, 0, deck, 0);
  box(g, shell, HOPPER.width, 2.3, L - 1.4, 0, deck + 1.5, 0);                     // covered hopper body
  box(g, shell, HOPPER.width - 0.5, 0.25, L - 1.6, 0, deck + 2.75, 0);              // roof with hatches
  for (const z of [-L / 4, 0, L / 4]) box(g, shell, 1.4, 0.9, 1.6, 0, deck - 0.35, z); // discharge chutes
  bogies(g, L, dark);
  g.name = 'Narromine covered grain hopper';
  return g;
}

function makeConsist(parent, hoppers) {
  const cars = [locomotive(), ...Array.from({ length: hoppers }, (_, i) => hopper(i))], offsets = []; let off = 0;
  for (const c of cars) { const L = c === cars[0] ? LOCO.length : HOPPER.length; offsets.push([off, L]); off += L + COUPLER_GAP; parent.add(c); }
  return { cars, offsets, length: off - COUPLER_GAP };
}
function placeConsist(consist, path) {
  return consist.cars.map((c, i) => {
    const [o, L] = consist.offsets[i], f = path.pointAt(path.s - o - 2.6), r = path.pointAt(path.s - o - L + 2.6), mid = path.pointAt(path.s - o - L / 2);
    const heading = Math.atan2(f.z - r.z, f.x - r.x);
    c.position.set(mid.x, 0, mid.z); c.rotation.y = -heading - Math.PI / 2;
    return { x: mid.x, z: mid.z, heading, L };
  });
}
function outline({ x, z, heading, L }) {
  const c = Math.cos(heading), s = Math.sin(heading), hw = LOCO.width / 2, hl = L / 2;
  const poly = [[hl, hw], [-hl, hw], [-hl, -hw], [hl, -hw]].map(([a, b]) => [x + a * c - b * s, z + a * s + b * c]);
  const xs = poly.map(p => p[0]), zs = poly.map(p => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), poly, train: true };
}
// Level crossings: wherever a mapped street crosses a mapped track. Each gets a boom gate on both
// approaches and flashing red lights; booms come down while any train is within 200 m.
// Official names from OSM level_crossing nodes (sourced there from the NSW level crossings on public
// roads open dataset; ref = operator inventory number), at their game positions.
// Protection type per crossing from the NSW "level crossings on public roads" register (Transport
// for NSW open data, CC BY): [address redacted] half booms + flashing lights; [address redacted]
// flashing lights only; 718, 1107, 1108, 1109 and 1867 stop signs only.
export const CROSSING_CONTROL = Object.freeze({ 717: 'boom', 716: 'lights', 718: 'stop', 1107: 'stop', 1108: 'stop', 1109: 'stop', 1867: 'stop' });
export const LEVEL_CROSSING_NAMES = Object.freeze([
  [-4790, -776, 'Dandaloo Street Rail Level Crossing', '717'], [-5501, -845, 'Derribong Street (Dandaloo Road) Rail Level Crossing', '1109'],
  [-6457, -2153, 'McNamaras Lane Rail Level Crossing', '718'], [-5689, -239, 'Backwater Road Rail Level Crossing', '1108'],
  [-6119, 546, 'Wingfield Road Rail Level Crossing', '1107'], [-4052, -379, 'Manildra Street Rail Level Crossing', '716'],
  [-5488, -863, 'Silo Access Road (Dandaloo Road) Rail Level Crossing', '1867'],
].map(([x, z, name, ref]) => Object.freeze({ x, z, name, ref, control: CROSSING_CONTROL[ref] || 'stop' })));
function findCrossings() {
  const out = [];
  const segs = RAIL.flatMap(w => w.pts.slice(1).map((b, i) => [w.pts[i], b]));
  for (const st of STREETS) for (let i = 1; i < st.pts.length; i++) {
    const p = st.pts[i - 1], q = st.pts[i];
    for (const [a, b] of segs) {
      const d = (q[0] - p[0]) * (b[1] - a[1]) - (q[1] - p[1]) * (b[0] - a[0]); if (Math.abs(d) < 1e-9) continue;
      const t = ((a[0] - p[0]) * (b[1] - a[1]) - (a[1] - p[1]) * (b[0] - a[0])) / d, u = ((a[0] - p[0]) * (q[1] - p[1]) - (a[1] - p[1]) * (q[0] - p[0])) / d;
      if (t < 0 || t > 1 || u < 0 || u > 1) continue;
      const x = p[0] + t * (q[0] - p[0]), z = p[1] + t * (q[1] - p[1]);
      if (out.some(c => Math.hypot(c.x - x, c.z - z) < 12)) continue;
      const l = Math.hypot(q[0] - p[0], q[1] - p[1]), ux = (q[0] - p[0]) / l, uz = (q[1] - p[1]) / l;
      const official = LEVEL_CROSSING_NAMES.find(n => Math.hypot(n.x - x, n.z - z) < 15);
      out.push({ x, z, ux, uz, width: st.width || 7, street: st.name || 'road', name: official?.name || (st.name || 'Road') + ' level crossing', ref: official?.ref || null, control: official?.control || 'stop' });
    }
  }
  return out;
}
function buildCrossing(parent, c) {
  const nx = -c.uz, nz = c.ux, half = c.width / 2, booms = [];
  const pole = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 }), armMat = new THREE.MeshLambertMaterial({ color: 0xf4f4f4 }), red = new THREE.MeshLambertMaterial({ color: 0x5a1010, emissive: 0xff2020, emissiveIntensity: 0 });
  for (const side of [-1, 1]) {
    // Each approach: the gate stands on the driver's left (Australia drives on the left), 5.5 m from the track.
    const bx = c.x - c.ux * 5.5 * side + nx * (half + 0.6) * -side, bz = c.z - c.uz * 5.5 * side + nz * (half + 0.6) * -side;
    if (c.control === 'stop') {                 // passive: a stop sign and a railway crossing sign on a post
      box(parent, pole, 0.1, 2.4, 0.1, bx, 1.2, bz);
      const sign = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 8), new THREE.MeshLambertMaterial({ color: 0xc8202a }));
      sign.rotation.x = Math.PI / 2; sign.rotation.z = Math.PI / 8; sign.rotation.y = Math.atan2(c.ux * side, c.uz * side); sign.position.set(bx, 2.1, bz); parent.add(sign);
      booms.push({ pivot: null, lamps: [], bx, bz });
      continue;
    }
    box(parent, pole, 0.22, 3.2, 0.22, bx, 1.6, bz);
    const lamps = [box(parent, red, 0.32, 0.32, 0.12, bx, 2.7, bz), box(parent, red, 0.32, 0.32, 0.12, bx, 2.25, bz)];
    if (c.control === 'lights') { booms.push({ pivot: null, lamps, bx, bz }); continue; }
    const pivot = new THREE.Group(); pivot.position.set(bx, 1.15, bz); pivot.rotation.order = 'YXZ';
    const dirX = nx * side, dirZ = nz * side;                 // arm reaches across the approach lanes
    pivot.rotation.y = Math.atan2(-dirZ, dirX);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(c.width * 0.55 + 0.6, 0.12, 0.12), armMat); arm.position.x = (c.width * 0.55 + 0.6) / 2; pivot.add(arm);
    parent.add(pivot);
    booms.push({ pivot, lamps, bx, bz, dirX, dirZ, reach: c.width * 0.55 + 0.6 });
  }
  return { ...c, booms, down: 0 };
}

export function createNarromineTrains(parent) {
  const net = buildRailNetwork(RAIL), track = trackMeshes(parent);
  // Park facing south-east on the Narromine yard loop (OSM way 2), clear of the main line.
  const yard = RAIL[2].pts;
  const start = [];
  for (const p of yard) start.push(net.nodes.find(n => Math.hypot(n.x - p[0], n.z - p[1]) < 1.6).id);
  const lengths = start.slice(1).reduce((a, id, i) => a.concat(a[i] + Math.hypot(net.nodes[id].x - net.nodes[start[i]].x, net.nodes[id].z - net.nodes[start[i]].z)), [0]);
  const startS = Math.min(lengths.at(-1) - 5, CONSIST_LENGTH + 40);
  const path = createTrainPath(net, start, startS);
  const mine = makeConsist(parent, HOPPERS), cars = mine.cars;
  let speed = 0, driving = false, pref = 'straight', message = '', penalty = false, horn = 0;
  const place = () => placeConsist(mine, path);
  let placed = place();
  const head = () => path.pointAt(path.s);
  // A loaded grain train (21 t axle load) is held to 60 km/h even where the line allows more (ARTC RAS I4).
  function limitKmh() { const p = head(); return Math.min(net.limitKmh(p.a, p.b), SPEED_LIMIT_KMH.loadedGrain); }
  // Collision: each car's true rotated outline, so the train blocks only where it is.
  // Freight trains run by the game, and the level crossings they close.
  const endNode = (pt) => net.nodes.find(n => Math.hypot(n.x - pt[0], n.z - pt[1]) < 1.6).id;
  const ENDS = { nw: endNode(RAIL[1].pts[0]), dubbo: endNode(RAIL[7].pts.at(-1)) };
  const ranToday = new Map();
  let freight = null;
  const crossings = findCrossings().map(c => buildCrossing(parent, c));
  function spawnFreight(entry) {
    const startNode = ENDS[entry.from], nodes = [startNode, [...net.adj.get(startNode)][0]];
    const consist = makeConsist(parent, entry.hoppers);
    let len = 0;
    while (len < consist.length + 10) {
      const nx = net.next(nodes.at(-2), nodes.at(-1), 'straight'); if (nx === null) break;
      len += Math.hypot(net.nodes[nx].x - net.nodes[nodes.at(-1)].x, net.nodes[nx].z - net.nodes[nodes.at(-1)].z); nodes.push(nx);
    }
    const fpath = createTrainPath(net, nodes, consist.length + 2);
    freight = { entry, consist, path: fpath, speed: 0, placed: placeConsist(consist, fpath), held: false };
  }
  function despawnFreight() { for (const c of freight.consist.cars) parent.remove(c); freight = null; }
  function freightUpdate(dt) {
    if (!freight) return;
    const h = freight.path.pointAt(freight.path.s);
    // Signal protection: hold short while the player's train is within 250 m ahead or across the line.
    // Signal protection: hold only if the player's train is actually on this train's track within
    // 250 m ahead (sampled along the path), not merely nearby on the yard loop or a siding.
    const ahead = [h], P = freight.path.path; let prev = P[P.length - 2], cur = P[P.length - 1], walked = 0, last = h;
    while (walked < SIGNAL_GAP && cur != null) {
      const n = net.nodes[cur], seg = Math.hypot(n.x - last.x, n.z - last.z);
      for (let d = 8; d < seg; d += 8) ahead.push({ x: last.x + (n.x - last.x) * d / seg, z: last.z + (n.z - last.z) * d / seg });
      ahead.push(n); walked += seg; last = n;
      const nx = net.next(prev, cur, 'straight'); prev = cur; cur = nx;
    }
    const blocked = placed.some(p => ahead.some(a => Math.hypot(p.x - a.x, p.z - a.z) < p.L / 2 + 3));
    freight.held = blocked;
    const limit = Math.min(FREIGHT_RUN_KMH, net.limitKmh(h.a, h.b)) / 3.6, target = blocked ? 0 : limit;
    freight.speed += Math.max(-SERVICE_BRAKE * 2 * dt, Math.min(ACCEL * dt, target - freight.speed));
    if (freight.speed > 0.01) {
      const r = freight.path.move(freight.speed * dt, freight.consist.length, 'straight');
      freight.placed = placeConsist(freight.consist, freight.path);
      if (r.blocked === 'end') despawnFreight();
    }
  }
  function crossingUpdate(dt) {
    // Close for a moving train within 200 m, or for any train standing across the road.
    const trainsNow = [{ cars: placed, moving: Math.abs(speed) > 0.3 }].concat(freight ? [{ cars: freight.placed, moving: freight.speed > 0.3 }] : []);
    for (const c of crossings) {
      const near = trainsNow.some(t => t.cars.some(p => Math.hypot(p.x - c.x, p.z - c.z) < (t.moving ? CROSSING_WARN : 4) + p.L / 2));
      c.closed = near;
      c.down = Math.max(0, Math.min(1, c.down + (near ? 1 : -1) * dt / 6));   // booms take ~6 s
      const flash = near && Math.floor(performance.now() / 500) % 2;
      for (const b of c.booms) { if (b.pivot) b.pivot.rotation.z = (1 - c.down) * 1.45; if (b.lamps.length) { b.lamps[0].material.emissiveIntensity = near ? (flash ? 1.4 : 0) : 0; b.lamps[1].material.emissiveIntensity = near ? (flash ? 0 : 1.4) : 0; } }
    }
  }
  function tick(dt, clock) {
    if (clock && Number.isFinite(clock.minute)) for (const e of FREIGHT_TIMETABLE) {
      if (!freight && ranToday.get(e.id) !== clock.day && clock.minute >= e.at && clock.minute < e.at + 90) { ranToday.set(e.id, clock.day); spawnFreight(e); }
    }
    freightUpdate(dt); crossingUpdate(dt);
  }
  // Collision: each car's true rotated outline, and booms that are down block the road.
  function colliders() {
    const out = placed.map(outline);
    if (freight) out.push(...freight.placed.map(outline));
    for (const c of crossings) if (c.down > 0.6) for (const b of c.booms) {
      if (!b.pivot) continue;          // only boom gates physically close the road
      const ex = b.bx + b.dirX * b.reach, ez = b.bz + b.dirZ * b.reach, px = -b.dirZ * 0.15, pz = b.dirX * 0.15;
      const poly = [[b.bx + px, b.bz + pz], [ex + px, ez + pz], [ex - px, ez - pz], [b.bx - px, b.bz - pz]];
      const xs = poly.map(p => p[0]), zs = poly.map(p => p[1]);
      out.push({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), poly, boom: true });
    }
    return out;
  }
  function cab() { const p = placed[0]; return { x: p.x + Math.cos(p.heading) * (LOCO.length / 2 - 4.6), z: p.z + Math.sin(p.heading) * (LOCO.length / 2 - 4.6), heading: p.heading }; }
  function near(pos, range = 5) { const c = cab(); return !driving && Math.hypot(pos.x - c.x, pos.z - c.z) < range; }
  function board() {
    driving = true; speed = 0; penalty = false; pref = 'straight';
    const p = head();
    return 'You are in the cab on the ' + net.lineName(p.a, p.b) + '. W/S or joystick forward/back: power and brake (hold back when stopped to reverse slowly). A/D or the junction buttons choose the route at the next junction. E to step down when stopped.';
  }
  function exit(player) {
    if (Math.abs(speed) > 0.3) return 'Stop the train completely before stepping down.';
    driving = false; speed = 0;
    const c = cab(), side = 3.2, nx = -Math.sin(c.heading), nz = Math.cos(c.heading);
    player?.place(c.x + nx * side, c.z + nz * side, 0);
    return 'Handbrake applied. You stepped down from the locomotive beside the track.';
  }
  function setRoute(p) { pref = p; message = 'Next junction: ' + (p === 'straight' ? 'straight on' : 'take the ' + p); return message; }
  function update(dt, input) {
    if (driving && input) {
      const m = input.movement(); input.takeLook();
      if (m.x < -0.5) setRoute('left'); else if (m.x > 0.5) setRoute('right');
      const thr = -m.z, limit = limitKmh() / 3.6;
      if (penalty) { speed = Math.max(0, speed - EMERGENCY_BRAKE * dt); if (speed === 0) { penalty = false; message = 'Train stopped. Penalty brake released.'; } }
      else if (speed > 0.05 || (speed >= -0.05 && thr > 0)) {
        if (thr > 0) speed += thr * ACCEL * dt; else if (thr < 0) speed = Math.max(0, speed + thr * SERVICE_BRAKE * dt);
        else speed = Math.max(0, speed - RESISTANCE * dt);
      } else if (speed <= 0.05) {          // stopped or reversing: back = slow reverse, forward = brake
        if (thr < 0) speed = Math.max(-REVERSE_MAX, speed + thr * ACCEL * 0.5 * dt);
        else speed = Math.min(0, speed + (thr > 0 ? SERVICE_BRAKE : RESISTANCE) * dt);
      }
      // Train protection: a penalty brake applies well over the limit, as on real Australian lines.
      if (speed > limit + 15 / 3.6 && !penalty) { penalty = true; message = 'Overspeed! Penalty brake applied. Limit ' + Math.round(limit * 3.6) + ' km/h.'; }
      else if (speed > limit + 2 / 3.6 && !penalty) message = 'Over the ' + Math.round(limit * 3.6) + ' km/h limit — ease off.';
    }
    if (Math.abs(speed) > 0.001) {
      const r = path.move(speed * dt, CONSIST_LENGTH, pref);
      if (r.junction && pref !== 'straight') pref = 'straight';
      if (r.blocked) { speed = 0; message = r.blocked === 'end' ? 'End of the line: buffer stop ahead. Reverse to continue.' : 'The rear of the train reached the end of the track.'; }
      placed = place();
    }
    if (horn > 0) horn -= dt;
    return driving;
  }
  function state() {
    const p = head();
    return { driving, speedKmh: Math.round(speed * 3.6), limitKmh: limitKmh(), route: pref, line: net.lineName(p.a, p.b),
      head: { x: p.x, z: p.z }, cab: cab(), cars: cars.length, length: Math.round(CONSIST_LENGTH), track, penalty,
      freight: freight ? { id: freight.entry.id, speedKmh: Math.round(freight.speed * 3.6), held: freight.held, head: (({ x, z }) => ({ x, z }))(freight.path.pointAt(freight.path.s)) } : null,
      crossings: crossings.map(c => ({ x: Math.round(c.x), z: Math.round(c.z), street: c.street, name: c.name, ref: c.ref, control: c.control, closed: !!c.closed, down: +c.down.toFixed(2) })) };
  }
  return {
    update, tick, board, exit, near, cab, colliders, setRoute, state,
    // True when a closed crossing's road is within 12 m of (x, z): road traffic waits there.
    crossingClosedNear(x, z) { return crossings.some(c => c.closed && Math.hypot(c.x - x, c.z - z) < 12); },
    runFreight(i = 0) { if (freight) despawnFreight(); spawnFreight(FREIGHT_TIMETABLE[i]); return FREIGHT_TIMETABLE[i].id; },
    sound() { horn = 1.2; return 'Horn: two long blasts.'; },
    get driving() { return driving; }, get message() { return message; }, clearMessage() { message = ''; },
    network: net,
  };
}
