import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { modelGeometry } from './furniture.js';

// Accumulates coloured primitives in a local frame and merges them into one
// vertex-coloured mesh, so a whole house costs one draw call on Android GPUs.
// Animated parts (spinning fans, blinking lights) must stay separate meshes,
// so they go through `dynamic()` instead of the merged buffer.
const tmpColor = new THREE.Color();
const shared = {
  box: new THREE.BoxGeometry(1, 1, 1),
  // Low segment counts: the town draws thousands of these, and phones pay per vertex.
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  cone: new THREE.ConeGeometry(0.5, 1, 10),
  sphere: new THREE.SphereGeometry(0.5, 10, 7),
  pyramid: new THREE.ConeGeometry(0.71, 1, 4),
  torus: new THREE.TorusGeometry(0.5, 0.12, 6, 14),
};
shared.pyramid.rotateY(Math.PI / 4);

export const solidMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
// Window glass colour shared with exterior.js; a builder with `glass = []` sets those
// panes aside so the town can light them at night (src/world/town.js).
export const GLASS = 0x9fd3ea;

// Every scenery tree in the town's merged meshes, so woodcutting can chop any of them: the vertices
// each tree occupies in its merged mesh, so a felled tree can collapse to a stump and later regrow.
const CHOPPABLE = [];
export const choppableTrees = () => CHOPPABLE;

export class Builder {
  constructor() {
    this.parts = [];
    this.dynamics = [];
    this.stack = [new THREE.Matrix4()];
    this.solids = [];   // world-space {x0,x1,z0,z1} footprints of things the player must not walk through
  }

  // Records a solid footprint (w × d, centred on x,z in the current frame) so the town can
  // collide with it. Works inside `at()` frames; the box is re-fitted to a world AABB.
  solid(w, d, x, z) {
    const e = this.matrix.elements, hw = w / 2, hd = d / 2;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const lx = x + sx * hw, lz = z + sz * hd;
      const wx = e[0] * lx + e[8] * lz + e[12], wz = e[2] * lx + e[10] * lz + e[14];
      x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); z0 = Math.min(z0, wz); z1 = Math.max(z1, wz);
    }
    this.solids.push({ x0, x1, z0, z1 });
  }

  get matrix() {
    return this.stack[this.stack.length - 1];
  }

  // Builds a tree with `fn` and remembers which parts it is made of (type: 'tree' | 'oak' | 'willow').
  tree(info, fn) {
    const start = this.parts.length;
    fn();
    (this.trees ??= []).push({ start, end: this.parts.length, type: info.type || 'tree' });
  }

  // Runs `fn` in a translated/rotated frame; props are authored around their own origin.
  at(x, y, z, rotY, fn) {
    const m = new THREE.Matrix4().makeRotationY(rotY || 0).setPosition(x, y, z);
    this.stack.push(this.matrix.clone().multiply(m));
    try { fn(); } finally { this.stack.pop(); }
  }

  add(kind, color, sx, sy, sz, x, y, z, rx = 0, ry = 0, rz = 0) {
    const g = shared[kind].clone();
    const local = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sx, sy, sz),
    );
    g.applyMatrix4(this.matrix.clone().multiply(local));
    paint(g, color);
    (this.glass && color === GLASS ? this.glass : this.parts).push(g);
    return g;
  }

  box(color, w, h, d, x, y, z, ry = 0) { return this.add('box', color, w, h, d, x, y, z, 0, ry, 0); }
  // Box resting on y (bottom face at y) — the common case for furniture.
  block(color, w, h, d, x, y, z, ry = 0) { return this.add('box', color, w, h, d, x, y + h / 2, z, 0, ry, 0); }
  cyl(color, r, h, x, y, z, rx = 0, rz = 0) { return this.add('cyl', color, r * 2, h, r * 2, x, y, z, rx, 0, rz); }
  cone(color, r, h, x, y, z) { return this.add('cone', color, r * 2, h, r * 2, x, y, z); }
  ball(color, r, x, y, z, sy = 1) { return this.add('sphere', color, r * 2, r * 2 * sy, r * 2, x, y, z); }
  pyramid(color, w, h, d, x, y, z) { return this.add('pyramid', color, w, h, d, x, y, z); }
  ring(color, r, x, y, z, rx = 0) { return this.add('torus', color, r * 2, r * 2, r * 2, x, y, z, rx); }

  // A real furniture model fitted to {w,h,d} in the current frame (facing +z, standing on y).
  // Returns false when models are not loaded, so the caller can build its box version instead.
  model(name, x, y, z, ry, fit) {
    const g = modelGeometry(name, fit);
    if (!g) return false;
    g.deleteAttribute('uv');   // parts are merged without uv (see paint)
    g.applyMatrix4(this.matrix.clone().multiply(new THREE.Matrix4().makeRotationY(ry || 0).setPosition(x, y, z)));
    this.parts.push(g);
    return true;
  }

  // A separately animated mesh positioned in the current frame.
  dynamic(kind, color, sx, sy, sz, x, y, z, anim) {
    const mat = new THREE.MeshLambertMaterial({ color, emissive: anim.emissive ? color : 0x000000, emissiveIntensity: 0 });
    const mesh = new THREE.Mesh(shared[kind], mat);
    mesh.scale.set(sx, sy, sz);
    const world = this.matrix.clone().multiply(new THREE.Matrix4().setPosition(x, y, z));
    mesh.applyMatrix4(world);
    mesh.userData.anim = { ...anim, base: mesh.position.clone(), baseRot: mesh.rotation.y, phase: this.dynamics.length };
    this.dynamics.push(mesh);
    return mesh;
  }

  // Merges loose geometries (e.g. collected glass) into one; null when there are none.
  static merge(geometries) {
    if (!geometries.length) return null;
    const merged = mergeGeometries(geometries, false);
    for (const g of geometries) g.dispose();
    return merged;
  }

  build() {
    const group = new THREE.Group();
    if (this.parts.length) {
      // Vertex offsets of each part in the merged mesh, for the trees recorded by tree().
      const offsets = [0];
      for (const p of this.parts) offsets.push(offsets.at(-1) + p.attributes.position.count);
      const merged = mergeGeometries(this.parts, false);
      for (const p of this.parts) p.dispose();
      const mesh = new THREE.Mesh(merged, solidMaterial);
      group.add(mesh);
      for (const t of this.trees || []) if (t.end > t.start)
        CHOPPABLE.push({ id: 'scenery:' + CHOPPABLE.length, type: t.type, mesh, vStart: offsets[t.start], vCount: offsets[t.end] - offsets[t.start] });
    }
    this.trees = [];
    for (const d of this.dynamics) group.add(d);
    this.parts = [];
    return group;
  }
}

function paint(geometry, color) {
  tmpColor.set(color);
  const n = geometry.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = tmpColor.r; arr[i * 3 + 1] = tmpColor.g; arr[i * 3 + 2] = tmpColor.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  // Merging requires identical attribute sets; uv is unused by vertex-coloured Lambert.
  geometry.deleteAttribute('uv');
}

// Advances the simple declarative animations attached by `dynamic()`.
export function animate(dynamics, t, active) {
  // An interior without animation data must not crash game rendering.
  if (dynamics == null) return;
  for (const m of dynamics) {
    const a = m.userData.anim;
    const on = a.always || active.has(a.key);
    const p = a.phase * 0.7;
    if (a.type === 'spin') m.rotation.y = a.baseRot + (on ? t * (a.speed || 2) : 0);
    else if (a.type === 'bob') m.position.y = a.base.y + (on ? Math.sin(t * 3 + p) * (a.amount || 0.12) : 0);
    else if (a.type === 'glow') m.material.emissiveIntensity = on ? 0.6 + 0.4 * Math.sin(t * 4 + p) : 0;
    else if (a.type === 'blink') m.material.emissiveIntensity = on ? (Math.sin(t * 9 + p * 3) > 0 ? 1 : 0.1) : 0;
    else if (a.type === 'slide') m.position.x = a.base.x + (on ? Math.sin(t * 1.5 + p) * (a.amount || 0.4) : 0);
  }
}
