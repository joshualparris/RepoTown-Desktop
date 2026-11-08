// Dandaloo Street streetscape props. Visually restrained and tile-batched through
// buildNarromine's existing push() material buckets; no duplicate road/asphalt meshes.
// Furniture needs individual location evidence; unsupported placements stay unrendered.
import * as THREE from 'three';
import { planDandalooStreetscape, planDandalooSouth } from './narromine-dandaloo-streetscape-data.js';

const KERB = 0xb9b4aa, PARK_LINE = 0xeee9dc, LAMP = 0x47604b;
const addCylinder = (push, colour, topR, botR, h, x, y, z, sides = 8) => {
  const g = new THREE.CylinderGeometry(topR, botR, h, sides);
  g.translate(x, y, z); push(colour, g);
};
const addBall = (push, colour, x, y, z, sx, sy, sz, detail = 1) => {
  const g = new THREE.IcosahedronGeometry(1, detail);
  g.scale(sx, sy, sz); g.translate(x, y, z); push(colour, g);
};
const addArm = (push, colour, a, b, r = 0.075) => {
  const aa = new THREE.Vector3(...a), bb = new THREE.Vector3(...b);
  const delta = bb.clone().sub(aa), len = delta.length();
  if (len < 0.01) return;
  const g = new THREE.CylinderGeometry(r * 0.86, r, len, 6);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), delta.normalize()));
  g.translate(...aa.clone().add(bb).multiplyScalar(0.5).toArray());
  push(colour, g);
};

function makeFloweringTree(push, item, flower) {
  const { x, z } = item;
  // Trunk, fork and uneven branch architecture rather than a green box canopy.
  const height = 4.3 + ((Math.round(Math.abs(z)) % 4) * 0.22);
  addCylinder(push, 0x76634d, 0.22, 0.30, height, x, height / 2, z, 9);
  for (const [dx, dz, lift] of [[-1.3, -0.7, 1.1], [1.55, 0.35, 1.3], [0.35, 1.4, 1.0]])
    addArm(push, 0x75624b, [x, height - 0.8, z], [x + dx, height + lift, z + dz], 0.10);
  const clumps = [
    [-1.55, 0, 0.6, 2.0, 1.4, 1.6], [1.45, 0.45, 0.7, 2.2, 1.4, 1.6],
    [0.1, -1.45, 1.1, 2.1, 1.65, 1.75], [0.4, 1.5, 0.5, 1.7, 1.3, 1.5],
    [0, 0, 1.85, 2.1, 1.55, 1.6],
  ];
  clumps.forEach(([dx, dz, dy, sx, sy, sz], i) =>
    addBall(push, flower ? [0xdadfcb, 0xf1efdf, 0xcbd8b9][i % 3]
      : [0x5f7e43, 0x739452, 0x89a461][i % 3],
    x + dx, height + dy, z + dz, sx, sy, sz));
  // Mulch/planting at the kerb extension, visual only.
  addCylinder(push, 0x816f51, 0.70, 0.70, 0.055, x, 0.105, z, 10);
}

function makePalm(push, item) {
  const { x, z } = item, h = 7.3;
  addCylinder(push, 0x78654b, 0.17, 0.33, h, x, h / 2, z, 10);
  addBall(push, 0x5b7443, x, h + 0.06, z, 0.52, 0.4, 0.52);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx;
    const pts = [], samples = [
      { t: 0, y: h + 0.15, w: 0.06 },
      { t: 1.2, y: h + 0.75, w: 0.35 },
      { t: 2.6, y: h + 0.05, w: 0.26 },
      { t: 4.2, y: h - 1.45, w: 0.01 },
    ];
    for (let j = 0; j < samples.length - 1; j++) {
      const A = samples[j], B = samples[j + 1];
      const vertex = (s, sign) => [x + dx * s.t + px * s.w * sign,
        s.y, z + dz * s.t + pz * s.w * sign];
      pts.push(...vertex(A, -1), ...vertex(A, 1), ...vertex(B, -1),
        ...vertex(A, 1), ...vertex(B, 1), ...vertex(B, -1));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.computeVertexNormals();
    push(i % 3 === 0 ? 0x4a723b : 0x68884a, g);
  }
}

function makeSwanNeckLamp(push, item) {
  const { x, z, where } = item;
  const side = where === 'west' ? 1 : where === 'east' ? -1 : 1;
  addCylinder(push, 0x536856, 0.18, 0.29, 0.43, x, 0.215, z);
  addCylinder(push, LAMP, 0.064, 0.083, 6.0, x, 3.23, z);
  const arm = [
    [x, 6.18, z], [x + side * 0.30, 6.48, z],
    [x + side * 0.85, 6.58, z], [x + side * 1.42, 6.42, z],
    [x + side * 1.80, 5.98, z],
  ];
  for (let i = 1; i < arm.length; i++) addArm(push, LAMP, arm[i - 1], arm[i], 0.057);
  addCylinder(push, 0x35513e, 0.10, 0.47, 0.28, x + side * 1.80, 5.89, z);
  addCylinder(push, 0xe5e2ce, 0.28, 0.28, 0.045, x + side * 1.80, 5.73, z);
}

// Timber power pole with a cross-arm and three insulators; wires sag between consecutive poles.
function makePowerPole(push, p) {
  addCylinder(push, 0x6e5b45, 0.13, 0.17, 10.5, p.x, 5.25, p.z, 8);
  const arm = new THREE.BoxGeometry(0.12, 0.12, 2.2); arm.translate(p.x, 9.9, p.z); push(0x5f4e3b, arm);
  for (const dz of [-0.9, 0, 0.9]) addCylinder(push, 0xd8dcd9, 0.05, 0.06, 0.18, p.x, 10.05, p.z + dz, 6);
}
function makeWires(push, a, b) {
  for (const dz of [-0.9, 0, 0.9]) {
    const n = 8, pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, sag = 0.55 * 4 * t * (1 - t);
      pts.push([a.x + (b.x - a.x) * t, 10.1 - sag, a.z + dz + (b.z - a.z) * t]); }
    for (let i = 1; i < pts.length; i++) addArm(push, 0x2b2b2b, pts[i - 1], pts[i], 0.012);
  }
}

export function buildDandalooStreetscape({ streets, push, box, flatPoly, strip, clear }) {
  const plan = planDandalooStreetscape(streets);
  // Asphalt is already produced by the exact polygon-clip road renderer; do not
  // restore the old overlapping road strips that caused z-fighting.
  for (const m of plan.medians) flatPoly(m.grass ? 0x879d5c : 0x78904c, m.pts, 0.103);
  for (const p of plan.pavers) flatPoly(0xa77f6e, p.pts, 0.112);
  for (const k of plan.kerbs) strip(KERB, ...k.a, ...k.b, 0.15, 0.129, 0.12);
  for (const p of plan.parking) strip(PARK_LINE, ...p.a, ...p.b, 0.105, 0.104, 0.022);
  // No synthetic hedge bands: their four former coordinates had no individual
  // location evidence. Restore only with a documented object-level survey.
  for (const item of plan.trees) {
    if (item.kind === 'palm') makePalm(push, item);
    else makeFloweringTree(push, item, item.kind === 'flowering');
  }
  for (const item of plan.lamps) makeSwanNeckLamp(push, item);
  // South of the Burraway split: kerbs, verge trees, lamps and the east-side power line.
  const south = planDandalooSouth(streets, clear);
  for (const k of south.kerbs) strip(KERB, ...k.a, ...k.b, 0.15, 0.129, 0.12);
  for (const item of south.trees) makeFloweringTree(push, item, item.kind === 'flowering');
  for (const item of south.lamps) makeSwanNeckLamp(push, item);
  south.poles.forEach((p, i) => { makePowerPole(push, p); if (i && Math.abs(p.z - south.poles[i - 1].z) < 90) makeWires(push, south.poles[i - 1], p); });
  return { ...plan, south };
}
