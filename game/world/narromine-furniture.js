// OSM street furniture in 3D: timber power poles and steel transmission towers with sagging
// conductors between them, give-way signs and bus stop signs. Positions are OSM nodes
// (narromine-furniture-data.js). Pole and tower heights are not mapped: 11 m timber distribution poles
// and 27 m lattice 132 kV towers are typical NSW values, labelled as such.
import * as THREE from 'three';
import { NARROMINE_FURNITURE as F } from './narromine-furniture-data.js';
export const POLE_HEIGHT = 11, TOWER_HEIGHT = 27;

export function buildNarromineFurniture(parent, colliders) {
  const timber = new THREE.MeshLambertMaterial({ color: 0x6b5843 }), steel = new THREE.MeshLambertMaterial({ color: 0x9aa0a4 });
  const add = (geo, mat, x, y, z, yaw = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = yaw; parent.add(m); return m; };
  const poleAt = new Map(), key = (p) => p[0] + ',' + p[1];
  const yawAlong = (pts, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; return -Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const lineFor = new Map();
  for (const l of F.lines) l.pts.forEach((p, i) => lineFor.set(key(p), { l, i }));
  for (const p of F.poles) {
    const info = lineFor.get(key(p)), yaw = info ? yawAlong(info.l.pts, info.i) + Math.PI / 2 : 0;
    add(new THREE.CylinderGeometry(0.13, 0.17, POLE_HEIGHT, 7), timber, p[0], POLE_HEIGHT / 2, p[1]);
    add(new THREE.BoxGeometry(2.4, 0.12, 0.12), timber, p[0], POLE_HEIGHT - 0.4, p[1], yaw);
    poleAt.set(key(p), POLE_HEIGHT - 0.3);
    colliders.push({ x0: p[0] - 0.25, x1: p[0] + 0.25, z0: p[1] - 0.25, z1: p[1] + 0.25 });
  }
  for (const p of F.towers) {
    const info = lineFor.get(key(p)), yaw = info ? yawAlong(info.l.pts, info.i) + Math.PI / 2 : 0;
    const body = new THREE.CylinderGeometry(0.5, 3.2, TOWER_HEIGHT, 4, 1, true); body.rotateY(Math.PI / 4);
    const m = add(body, new THREE.MeshLambertMaterial({ color: 0x9aa0a4, wireframe: true }), p[0], TOWER_HEIGHT / 2, p[1], yaw);
    for (const h of [TOWER_HEIGHT - 2, TOWER_HEIGHT - 6]) add(new THREE.BoxGeometry(9, 0.25, 0.25), steel, p[0], h, p[1], yaw);
    poleAt.set(key(p), TOWER_HEIGHT - 2.2);
    colliders.push({ x0: p[0] - 2.6, x1: p[0] + 2.6, z0: p[1] - 2.6, z1: p[1] + 2.6 });
  }
  // Conductors: three per span, sagging 2% of the span, as one line-segment geometry.
  const v = [];
  for (const l of F.lines) for (let i = 1; i < l.pts.length; i++) {
    const a = l.pts[i - 1], b = l.pts[i], ha = poleAt.get(key(a)) ?? (l.kind === 'line' ? TOWER_HEIGHT - 2.2 : POLE_HEIGHT - 0.3), hb = poleAt.get(key(b)) ?? ha;
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1, nx = -dz / len, nz = dx / len, spread = l.kind === 'line' ? 3.6 : 1.0;
    for (const o of [-spread, 0, spread]) {
      let prev = null;
      for (let k = 0; k <= 8; k++) {
        const t = k / 8, sag = 4 * t * (1 - t) * len * 0.02;
        const pt = [a[0] + dx * t + nx * o, ha + (hb - ha) * t - sag, a[1] + dz * t + nz * o];
        if (prev) v.push(...prev, ...pt); prev = pt;
      }
    }
  }
  const wires = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(v, 3)), new THREE.LineBasicMaterial({ color: 0x2a2a2a }));
  wires.name = 'Narromine power conductors (OSM power lines)'; parent.add(wires);
  // Give-way signs: red-bordered white inverted triangle on a 2.1 m post, facing approaching traffic.
  const post = new THREE.MeshLambertMaterial({ color: 0xb8bcbf }), red = new THREE.MeshLambertMaterial({ color: 0xc8202a }), white = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
  const tri = (r) => { const s = new THREE.Shape(); s.moveTo(-r, r * 0.58); s.lineTo(r, r * 0.58); s.lineTo(0, -r * 1.15); s.closePath(); return new THREE.ShapeGeometry(s); };
  for (const [x, z, yaw] of F.giveway) {
    add(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6), post, x, 1.05, z);
    add(tri(0.45), red, x, 2.25, z, yaw); const inner = add(tri(0.32), white, x, 2.25, z, yaw); inner.translateZ(0.01);
  }
  for (const [x, z] of F.bus) {
    add(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), post, x, 1.2, z);
    add(new THREE.BoxGeometry(0.45, 0.6, 0.03), new THREE.MeshLambertMaterial({ color: 0x1f6f3a }), x, 2.3, z);
  }
  // Station footbridge over the line (OSM way 465612627, bridge=yes footway): a steel truss deck at
  // about 6.5 m (typical clearance over rail; not measured) with a stair down at each end along the
  // footway. Drawn without collision so it can never block the road or track below.
  {
    const A = [-4807.9, -782.2], B = [-4801.3, -793.2], len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const ux = (B[0] - A[0]) / len, uz = (B[1] - A[1]) / len, nx = -uz, nz = ux, yaw = -Math.atan2(uz, ux), H = 6.5, steelM = new THREE.MeshLambertMaterial({ color: 0xd9dcd8 });
    const at = (t, o, y) => [A[0] + ux * t + nx * o, y, A[1] + uz * t + nz * o];
    const beam = (p, q, r = 0.06) => { const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], l = Math.hypot(dx, dy, dz);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 5), steelM); m.position.set((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / l, dy / l, dz / l)); parent.add(m); };
    add(new THREE.BoxGeometry(len, 0.18, 2.0), new THREE.MeshLambertMaterial({ color: 0x8e8a82 }), (A[0] + B[0]) / 2, H, (A[1] + B[1]) / 2, yaw);   // deck
    const bays = 6;
    for (const o of [-1.05, 1.05]) {
      beam(at(0, o, H), at(len, o, H)); beam(at(0, o, H + 1.6), at(len, o, H + 1.6));                                      // bottom and top chords
      for (let k = 0; k <= bays; k++) { const t = len * k / bays; beam(at(t, o, H), at(t, o, H + 1.6)); if (k < bays) beam(at(t, o, H), at(t + len / bays, o, H + 1.6)); }
    }
    for (const t of [0, len]) for (const o of [-1.05, 1.05]) beam(at(t, o, 0), at(t, o, H), 0.12);                        // columns
    // Stairs: flights continuing along the footway from each end down to the ground.
    for (const [t0, dir] of [[0, -1], [len, 1]]) {
      const steps = 20, run = 11;
      for (let k = 0; k < steps; k++) { const t = t0 + dir * (k + 0.5) * run / steps, y = H - (k + 1) * H / steps;
        const [x, , z] = at(t, 0, 0); add(new THREE.BoxGeometry(run / steps + 0.02, 0.12, 1.6), new THREE.MeshLambertMaterial({ color: 0x8e8a82 }), x, y + 0.06, z, yaw); }
      for (const o of [-0.85, 0.85]) beam(at(t0, o, H + 1.0), at(t0 + dir * run, o, 1.0), 0.04);                           // handrails
    }
  }
  return { poles: F.poles.length, towers: F.towers.length, spans: v.length / 6, giveway: F.giveway.length, bus: F.bus.length };
}
