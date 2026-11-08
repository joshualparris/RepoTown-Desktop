// Interpretive street-facing residential details for mapped Narromine footprints.
// Footprints and roof heights come from source data; individual private door/window
// locations have NOT been surveyed. No new colliders or access rights are created.
import * as THREE from 'three';
import { FILL_HOUSES, nearestSegment } from './narromine-layout.js';

const MAX_FRONTAGE_DISTANCE = 80;
export function houseStreetFacade(h, nearest) {
  if (!nearest || nearest.d > MAX_FRONTAGE_DISTANCE ||
      h.w < 3.5 || h.d < 3.5 || h.w > 42 || h.d > 42) return null;
  const c = Math.cos(h.yaw), s = Math.sin(h.yaw);
  const dx = nearest.px - h.x, dz = nearest.pz - h.z;
  const u = dx * c - dz * s, v = dx * s + dz * c;
  // A ray from the footprint centre to the nearest mapped street selects the
  // closest rectangular wall, correctly handling rotated and corner footprints.
  const sideX = Math.abs(u) / (h.w / 2) > Math.abs(v) / (h.d / 2);
  const xLocal = sideX ? Math.sign(u || 1) * (h.w / 2 + .12) : 0;
  const zLocal = sideX ? 0 : Math.sign(v || 1) * (h.d / 2 + .12);
  return {
    x: h.x + xLocal * c + zLocal * s,
    z: h.z - xLocal * s + zLocal * c,
    yaw: h.yaw + (sideX ? Math.PI / 2 : 0),
    span: sideX ? h.d : h.w,
  };
}

export function addNarromineResidentialFacades(group, homes = FILL_HOUSES, nearest = nearestSegment, resolvedDoors = []) {
  // When the simulation has already resolved a walk-in household entrance, use
  // THAT exact threshold for its visible door; do not paint a second, unusable door.
  const accessible = new Map(resolvedDoors.map(({ home, door }) => [
    home.x.toFixed(1) + ',' + home.z.toFixed(1), door,
  ]));
  const max = homes.length, box = new THREE.BoxGeometry(1, 1, 1);
  const mesh = (name, colour, capacity) => {
    const m = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: colour }), capacity);
    m.name = name; m.count = 0; m.frustumCulled = false;
    group.add(m); return m;
  };
  const doors = mesh('Narromine residential doors · interpretive', 0xffffff, max);
  const lintels = mesh('Residential door lintels', 0xe8e0d2, max);
  const jambs = mesh('Residential door frames', 0xe8e0d2, max * 2);
  const knobs = mesh('Residential door handles', 0xc8b47e, max);
  const windows = mesh('Residential front windows · interpretive', 0x9bc2ce, max * 2);
  const sills = mesh('Residential window sills', 0xd7cfc0, max * 2);
  const object = new THREE.Object3D();
  const put = (m, x, y, z, yaw, w, h, d) => {
    object.position.set(x, y, z); object.rotation.set(0, yaw, 0);
    object.scale.set(w, h, d); object.updateMatrix();
    m.setMatrixAt(m.count++, object.matrix);
  };
  let frontageCount = 0;
  for (const home of homes) {
    let front = houseStreetFacade(home, nearest(home.x, home.z));
    if (!front) continue;
    const actual = accessible.get(home.x.toFixed(1) + ',' + home.z.toFixed(1));
    if (actual?.out) {
      const dx = actual.out.x - actual.x, dz = actual.out.z - actual.z;
      const length = Math.hypot(dx, dz) || 1, nx = dx / length, nz = dz / length;
      front = { ...front, x: actual.x + nx * .12, z: actual.z + nz * .12,
        yaw: Math.atan2(nx, nz) };
    }
    const { x, z, yaw, span } = front;
    const nx = Math.sin(yaw), nz = Math.cos(yaw);
    const tx = Math.cos(yaw), tz = -Math.sin(yaw);
    const tone = ((home.tone ?? 0) + 5) % 5;
    const colours = [0x425c61, 0x6d4038, 0x344c36, 0x6b5540, 0x46516a];
    const doorWidth = Math.min(1.18, span * .25);
    put(doors, x, 1.13, z, yaw, doorWidth, 2.23, .075);
    doors.setColorAt(doors.count - 1, new THREE.Color(colours[tone]));
    put(lintels, x, 2.30, z, yaw, doorWidth + .23, .16, .16);
    for (const side of [-1, 1]) {
      put(jambs, x + tx * side * (doorWidth / 2 + .06), 1.13,
        z + tz * side * (doorWidth / 2 + .06), yaw, .12, 2.28, .16);
    }
    put(knobs, x + tx * doorWidth * .36 + nx * .055, 1.04,
      z + tz * doorWidth * .36 + nz * .055, yaw, .065, .15, .07);
    // Illustrative glazing only when there is room either side of the door.
    if (span >= 7.2) for (const side of [-1, 1]) {
      const wx = x + tx * side * (Math.min(2.3, span * .3));
      const wz = z + tz * side * (Math.min(2.3, span * .3));
      put(windows, wx, 1.66, wz, yaw, 1.05, 1.12, .075);
      put(sills, wx, 1.04, wz + nz * .07, yaw, 1.25, .12, .20);
    }
    frontageCount++;
  }
  for (const m of [doors, lintels, jambs, knobs, windows, sills]) {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }
  group.userData.residentialFacadeCount = frontageCount;
  return { homes: homes.length, facades: frontageCount, doors: doors.count,
    windows: windows.count, interpretive: true };
}
