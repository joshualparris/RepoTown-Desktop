// Narromine Post Office ([address redacted], Lot 2 DP814749): one continuous
// L-shaped hipped roof over the two-storey north wing and Dandaloo Street wing.
//
// Evidence (DISC-NR-007):
// - Plan and positions: the traced `north wing` and `Dandaloo Street front` parts
//   in narromine-buildings-data.js (NSW Spatial Services imagery, LiDAR-aligned).
// - Roof form: docs/narromine/narromine-post-office-aerial-nsw-spatial-cc-by-4.png
//   shows six planes: north wing north/south slopes with a west hip, Dandaloo wing
//   east/west slopes with a south hip, an NE outer hip and an inner valley, and both
//   ridges meeting at one point (no step, so one ridge height).
// - Heights: 2023 NSW LiDAR for those parts. Eave = north wing p5 (the Dandaloo
//   part's p5 is pulled down by its awning); ridge = mean p98 of both parts.
// - Hip-end insets: measured on the orthophoto after georeferencing it to the
//   lot's NE/SE cadastre corners (0.042 m/px). The orthophoto roof is displaced
//   ~3 m east by height parallax, so only proportions are taken from it: west hip
//   apex 0.59 x wing depth, south hip apex 0.38 x wing width (+/- ~0.5 m).
// ESTIMATED: the 0.45 m eave overhang and fascia depth; no section drawing was used.
import * as THREE from 'three';
import { DETAILED } from './narromine-layout.js';
import { NARROMINE_POST_OFFICE_ID } from './narromine-post-office.js';

export const POST_OFFICE_ROOF_PARTS = new Set(['north wing', 'Dandaloo Street front']);
export const isPostOfficeRoofPart = (id, name) => id === NARROMINE_POST_OFFICE_ID && POST_OFFICE_ROOF_PARTS.has(name);

const OVERHANG = 0.45, WEST_HIP_RATIO = 0.59, SOUTH_HIP_RATIO = 0.38;
const COLOUR = Object.freeze({ roof: 0xc8cac6, capping: 0xb2b5b1, fascia: 0xf4f4f0 });

// Roof geometry in world coordinates, worked out in a frame aligned with the
// Dandaloo wing: u runs along its north edge (east), v across it (south).
export function postOfficeRoofPlan(detailed = DETAILED) {
  const site = detailed.find(d => d.id === NARROMINE_POST_OFFICE_ID);
  const north = site?.parts.find(p => p.name === 'north wing');
  const front = site?.parts.find(p => p.name === 'Dandaloo Street front');
  if (!north?.lidar || !front?.lidar) throw new Error('Post Office wings or their LiDAR are missing: stop rather than invent a roof');
  const [o] = front.pts, ex = front.pts[1][0] - o[0], ez = front.pts[1][1] - o[1], el = Math.hypot(ex, ez);
  const ux = ex / el, uz = ez / el, vx = -uz, vz = ux;
  const U = ([x, z]) => (x - o[0]) * ux + (z - o[1]) * uz, V = ([x, z]) => (x - o[0]) * vx + (z - o[1]) * vz;
  const mean = (pts, f) => pts.reduce((s, p) => s + f(p), 0) / pts.length;
  // Both quads are traced NW, NE, SE, SW. The shared east wall averages both tracings (0.2 m apart).
  const [nNW, nNE, nSE, nSW] = north.pts, [fNW, fNE, fSE, fSW] = front.pts;
  const uW = mean([nNW, nSW], U) - OVERHANG, uE = mean([nNE, nSE, fNE, fSE], U) + OVERHANG;
  const vN = mean([nNW, nNE], V) - OVERHANG, vNS = mean([nSW, nSE], V) + OVERHANG;
  const uFW = mean([fNW, fSW], U) - OVERHANG, vS = mean([fSW, fSE], V) + OVERHANG;
  const eave = north.lidar[2], ridge = (north.lidar[3] + front.lidar[3]) / 2;
  const vr = (vN + vNS) / 2, ur = (uFW + uE) / 2;
  const L = {
    A: [uW, vN, eave], B: [uE, vN, eave], C: [uE, vS, eave], D: [uFW, vS, eave], E: [uFW, vNS, eave], F: [uW, vNS, eave],
    W: [uW + WEST_HIP_RATIO * (vNS - vN), vr, ridge], J: [ur, vr, ridge], S: [ur, vS - SOUTH_HIP_RATIO * (uE - uFW), ridge],
  };
  const world = ([u, v, y]) => [o[0] + u * ux + v * vx, y, o[1] + u * uz + v * vz];
  const P = Object.fromEntries(Object.entries(L).map(([k, p]) => [k, world(p)]));
  const facets = {
    northSlope: ['A', 'B', 'J', 'W'], eastSlope: ['B', 'C', 'S', 'J'], southHip: ['C', 'D', 'S'],
    dandalooWestSlope: ['D', 'E', 'J', 'S'], northWingSouthSlope: ['E', 'F', 'W', 'J'], westHip: ['F', 'A', 'W'],
  };
  const lines = {
    ridge: [['W', 'J'], ['J', 'S']], hip: [['A', 'W'], ['F', 'W'], ['B', 'J'], ['C', 'S'], ['D', 'S']], valley: [['E', 'J']],
    eave: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'A']],
  };
  // Height of the roof surface above a plan point (from the facet over it), or null outside the roof.
  const heightAt = (x, z) => {
    const u = U([x, z]), v = V([x, z]);
    for (const ids of Object.values(facets)) for (let i = 1; i + 1 < ids.length; i++) {
      const [p0, p1, p2] = [L[ids[0]], L[ids[i]], L[ids[i + 1]]];
      const det = (p1[1] - p2[1]) * (p0[0] - p2[0]) + (p2[0] - p1[0]) * (p0[1] - p2[1]);
      const a = ((p1[1] - p2[1]) * (u - p2[0]) + (p2[0] - p1[0]) * (v - p2[1])) / det;
      const b = ((p2[1] - p0[1]) * (u - p2[0]) + (p0[0] - p2[0]) * (v - p2[1])) / det;
      if (a >= -1e-6 && b >= -1e-6 && a + b <= 1 + 1e-6) return a * p0[2] + b * p1[2] + (1 - a - b) * p2[2];
    }
    return null;
  };
  const frontCentre = [mean(front.pts, p => p[0]), mean(front.pts, p => p[1])];
  return { eave, ridge, overhang: OVERHANG, points: P, local: L, facets, lines, heightAt, frontCentre,
    arms: { north: { uW, uE, vN, vS: vNS }, dandaloo: { uW: uFW, uE, vN, vS } }, frame: { origin: o, u: [ux, uz], v: [vx, vz] } };
}
export const POST_OFFICE_EAVE_H = postOfficeRoofPlan().eave;

export function buildNarrominePostOfficeRoof({ push, box }, plan = postOfficeRoofPlan()) {
  const { points: P, eave } = plan;
  // Roof planes, wound to face up.
  const tris = [];
  for (const ids of Object.values(plan.facets)) for (let i = 1; i + 1 < ids.length; i++) {
    let t = [P[ids[0]], P[ids[i]], P[ids[i + 1]]];
    const a = new THREE.Vector3(...t[0]), n = new THREE.Vector3().subVectors(new THREE.Vector3(...t[1]), a)
      .cross(new THREE.Vector3().subVectors(new THREE.Vector3(...t[2]), a));
    if (n.y < 0) t = [t[0], t[2], t[1]];
    tris.push(...t.flat());
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris, 3));
  g.computeVertexNormals(); push(COLOUR.roof, g);
  // Thin bar along a 3D segment (ridge capping, hip/valley flashing, fascia board).
  const bar = (c, a, b, w, h, lift = 0) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
    const geo = new THREE.BoxGeometry(len, h, w), dir = d.normalize(), flat = new THREE.Vector3(dir.x, 0, dir.z).normalize();
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(flat, dir).multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(flat.z, flat.x))));
    geo.translate((A.x + B.x) / 2, (A.y + B.y) / 2 + lift, (A.z + B.z) / 2); push(c, geo);
  };
  for (const kind of ['ridge', 'hip', 'valley']) for (const [a, b] of plan.lines[kind])
    bar(COLOUR.capping, P[a], P[b], kind === 'ridge' ? 0.3 : 0.22, 0.06, 0.03);
  // Continuous white fascia round the whole eave, and a boxed soffit back to the walls.
  for (const [a, b] of plan.lines.eave) bar(COLOUR.fascia, P[a], P[b], 0.06, 0.32, -0.12);
  const { frame: { origin: o, u, v } } = plan;
  for (const r of Object.values(plan.arms)) {
    const cu = (r.uW + r.uE) / 2, cv = (r.vN + r.vS) / 2;
    box(COLOUR.fascia, r.uE - r.uW, 0.04, r.vS - r.vN, o[0] + cu * u[0] + cv * v[0], eave - 0.28, o[1] + cu * u[1] + cv * v[1],
      -Math.atan2(u[1], u[0]));
  }
  // The antenna mast keeps its previous plan position, now seated on the roof.
  const [mx, mz] = plan.frontCentre, base = plan.heightAt(mx, mz) ?? plan.ridge;
  box(0xb0b2b4, 0.1, 4, 0.1, mx, base + 2, mz); box(0xb0b2b4, 1.4, 0.06, 0.06, mx, base + 3.4, mz);
  return plan;
}
