import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Real windows for interiors: a gap in the outside wall above a sill, filled with faint glass.
// The town is drawn first from the matching spot in the street (src/main.js renderIndoors), so
// whatever is going on outside — villagers, trucks, weather, night — shows through the glass.
export const SILL = 0.9, HEAD = 2.4;
export const windowGlass = new THREE.MeshLambertMaterial({ color: 0xd8eef8, transparent: true, opacity: 0.12, depthWrite: false });

// One mesh for all of a building's panes: [{ w, h, d, x, y, z }] → Mesh (null when there are none).
export function glassMesh(panes) {
  if (!panes.length) return null;
  const mesh = new THREE.Mesh(mergeGeometries(panes.map((p) => new THREE.BoxGeometry(p.w, p.h, p.d).translate(p.x, p.y, p.z))), windowGlass);
  mesh.renderOrder = 5;
  mesh.name = 'window glass';
  return mesh;
}

// Evenly spaced windows (centre ± w/2) along a free stretch of outside wall [a, b].
export function spreadWindows(a, b, w = 1.5, gap = 3.2) {
  const len = b - a;
  if (len < w + 0.5) return [];
  const n = Math.max(1, Math.floor(len / gap));
  return Array.from({ length: n }, (_, i) => { const c = a + (len * (i + 0.5)) / n; return [c - w / 2, c + w / 2]; });
}

// Maps an interior's own frame onto the town: its front door (door, in interior coordinates)
// sits on the building's real front door (at, in town coordinates), turned by `turn`
// (0 when the building faces +z like the houses, π for the south-side civic buildings).
export function townView(door, at, turn = 0) {
  const c = Math.cos(turn), s = Math.sin(turn), spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turn);
  return {
    point(x, z) { const dx = x - door.x, dz = z - door.z; return { x: at.x + c * dx + s * dz, z: at.z - s * dx + c * dz }; },
    // Copies an indoor camera to where it would stand in the town.
    place(camera, target) {
      const p = this.point(camera.position.x, camera.position.z);
      target.position.set(p.x, camera.position.y, p.z);
      target.quaternion.copy(spin).multiply(camera.quaternion);
      return target;
    },
  };
}
