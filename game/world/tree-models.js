// Reusable tree rendering for Narromine's dated NSW LiDAR canopy observations and fictional RepoTown.
// Position/height/crown radius are measured; silhouette/foliage type/colour are illustrative, NOT species IDs.
// No new real-world tree locations are generated here. Reuse the existing trunk collisions, not the crowns.
import * as THREE from 'three';

const TILE = 240;
const UP = new THREE.Vector3(0, 1, 0);
const TRUNK_NEAR = new THREE.CylinderGeometry(0.67, 1, 1, 9);
const TRUNK_FAR = new THREE.CylinderGeometry(0.67, 1, 1, 6);
const BRANCH = new THREE.CylinderGeometry(0.42, 1, 1, 6);
const CROWN_NEAR = new THREE.IcosahedronGeometry(1, 1);
const CROWN_FAR = new THREE.IcosahedronGeometry(1, 0);
const BARK_MATERIAL = new THREE.MeshLambertMaterial({ color: 0xb3a18f });
const FAR_BARK = new THREE.MeshLambertMaterial({ color: 0x8b8174 });
const FAR_LEAVES = new THREE.MeshLambertMaterial({ color: 0xffffff });

function hash(n) {
  const v = Math.sin(n * 127.1 + 17.9) * 43758.5453;
  return v - Math.floor(v);
}
function tintFor(i) {
  // Neutral mixed greens, not purported species classifications.
  return new THREE.Color().setHSL(0.235 + hash(i + 2) * 0.065, 0.23 + hash(i + 3) * 0.19, 0.29 + hash(i + 4) * 0.16);
}
function makeWindMaterial() {
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const clock = { value: 0 };
  material.onBeforeCompile = shader => {
    shader.uniforms.treeWindTime = clock;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\nuniform float treeWindTime;'
    ).replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float treePhase = instanceMatrix[3].x * 0.027 + instanceMatrix[3].z * 0.019;
        float treeGust = sin(treeWindTime * 0.88 + treePhase + position.y * 1.9);
        transformed.x += treeGust * 0.022;
        transformed.z += sin(treeWindTime * 0.71 + treePhase * 1.7) * 0.017;
      #endif`
    );
  };
  // Shared uniform: every tree tile moves without a separate JS animation per leaf.
  return { material, clock };
}
function instance(geometry, material, count, name) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.castShadow = false; // thousands of moving crowns should not multiply shadow passes on phones
  mesh.receiveShadow = true;
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  return mesh;
}
function finish(mesh) {
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
}

/**
 * A single geographically faithful forest with per-tile, distance-aware detailed/cheap models.
 * @param {Array<[number,number,number,number]>} points [worldX,worldZ,LiDAR height,crown radius].
 * @param {Array} colliders Existing mutable gameplay collider list; add exactly one trunk per record.
 * @returns {{ group: THREE.Group, update: (position: object, airborne?: boolean, timeSeconds?: number) => void, stats: object }}
 */
export function createLiDARTreeForest(points, colliders = []) {
  const group = new THREE.Group();
  group.name = '2023 NSW LiDAR measured trees — approximate silhouettes';
  const tiles = new Map();
  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i];
    const ix = Math.floor(x / TILE), iz = Math.floor(z / TILE), key = ix + ':' + iz;
    if (!tiles.has(key)) tiles.set(key, { x: (ix + 0.5) * TILE, z: (iz + 0.5) * TILE, records: [] });
    tiles.get(key).records.push(i);
  }
  const wind = makeWindMaterial();
  const temp = new THREE.Matrix4(), quat = new THREE.Quaternion(), axis = new THREE.Vector3();
  const pos = new THREE.Vector3(), scale = new THREE.Vector3();
  const barkTint = new THREE.Color();
  const tileViews = [];
  for (const tile of tiles.values()) {
    const n = tile.records.length, close = new THREE.Group(), distant = new THREE.Group();
    close.name = 'Detailed trunks / branches / canopy';
    distant.name = 'Distant low-poly tree silhouettes';
    const trunks = instance(TRUNK_NEAR, BARK_MATERIAL, n, 'Detailed tapered trunks');
    const branches = instance(BRANCH, BARK_MATERIAL, n * 3, 'Branch structure');
    const leaves = instance(CROWN_NEAR, wind.material, n * 5, 'Irregular wind-responsive foliage');
    const farTrunks = instance(TRUNK_FAR, FAR_BARK, n, 'Distant trunks');
    const farCrowns = instance(CROWN_FAR, FAR_LEAVES, n, 'Distant canopies');
    tile.records.forEach((i, k) => {
      const [x, z, observedH, observedR] = points[i];
      const height = Math.max(3.5, observedH);
      const radius = Math.max(1, observedR);
      const trunkH = height * 0.42;
      const trunkR = Math.min(0.45, 0.12 + height * 0.015);
      const crownH = Math.max(1.5, height - trunkH * 0.85);
      const crownBase = height - crownH;
      const crownTint = tintFor(i);
      const offset = hash(i + 11) * Math.PI * 2;
      const variation = hash(i + 23);
      // Identical measured footprint/height and the same old gameplay trunk collider.
      colliders.push({ x0: x - trunkR - 0.1, x1: x + trunkR + 0.1, z0: z - trunkR - 0.1, z1: z + trunkR + 0.1 });
      temp.compose(pos.set(x, trunkH / 2, z), quat.identity(), scale.set(trunkR, trunkH, trunkR));
      trunks.setMatrixAt(k, temp);
      farTrunks.setMatrixAt(k, temp);
      barkTint.setHSL(0.073 + hash(i + 42) * 0.023, 0.13 + hash(i + 43) * 0.15, 0.32 + hash(i + 44) * 0.13);
      trunks.setColorAt(k, barkTint);
      // One coarse crown preserves canopy radius and observed total height from a distance.
      temp.compose(pos.set(x, height - crownH / 2, z), quat.identity(), scale.set(radius, crownH / 2, radius));
      farCrowns.setMatrixAt(k, temp);
      farCrowns.setColorAt(k, crownTint);
      // Three tapered, non-identical branches grow out from the trunk into the canopy.
      for (let j = 0; j < 3; j++) {
        const angle = offset + j * Math.PI * 2 / 3;
        const rise = trunkH * (0.28 + j * 0.1);
        const spread = Math.min(radius * 0.48, height * 0.2) * (0.75 + 0.15 * j);
        const dx = Math.cos(angle) * spread, dz = Math.sin(angle) * spread, dy = trunkH * (0.38 + j * 0.035);
        axis.set(dx, dy, dz);
        const length = axis.length();
        quat.setFromUnitVectors(UP, axis.normalize());
        temp.compose(pos.set(x + dx / 2, rise + dy / 2, z + dz / 2), quat,
          scale.set(Math.max(0.07, trunkR * 0.43), length, Math.max(0.07, trunkR * 0.43)));
        branches.setMatrixAt(k * 3 + j, temp);
        branches.setColorAt(k * 3 + j, barkTint);
      }
      // Five staggered overlapping masses give a layered silhouette rather than one giant green ball.
      for (let j = 0; j < 5; j++) {
        const a = offset + j * 2.39996;
        const s = j === 0 ? 0 : 0.34 + hash(i * 13 + j) * 0.16;
        const lateral = radius * s;
        const yRatio = j === 0 ? 0.55 : 0.49 + hash(i * 19 + j) * 0.22;
        const lobeR = radius * (j === 0 ? 0.62 : 0.42 + hash(i * 7 + j) * 0.15);
        const lobeH = crownH * (j === 0 ? 0.46 : 0.28 + variation * 0.09);
        quat.setFromAxisAngle(UP, a * 0.33);
        temp.compose(pos.set(x + Math.cos(a) * lateral, crownBase + yRatio * crownH, z + Math.sin(a) * lateral),
          quat, scale.set(lobeR, lobeH, lobeR * (0.84 + hash(i * 29 + j) * 0.3)));
        leaves.setMatrixAt(k * 5 + j, temp);
        leaves.setColorAt(k * 5 + j, crownTint.clone().multiplyScalar(0.83 + hash(i * 37 + j) * 0.28));
      }
    });
    for (const m of [trunks, branches, leaves, farTrunks, farCrowns]) finish(m);
    close.add(trunks, branches, leaves);
    distant.add(farTrunks, farCrowns);
    distant.visible = true;
    close.visible = false;
    group.add(close, distant);
    tileViews.push({ x: tile.x, z: tile.z, close, distant });
  }

  function update(position, airborne = false, timeSeconds = 0) {
    if (!position) return;
    const mobile = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    const near = airborne ? 180 : mobile ? 290 : 430;
    const threshold = near + TILE * 0.5;
    const threshold2 = threshold * threshold;
    for (const tile of tileViews) {
      const dx = tile.x - position.x, dz = tile.z - position.z;
      const high = dx * dx + dz * dz < threshold2;
      if (tile.close.visible !== high) {
        tile.close.visible = high;
        tile.distant.visible = !high;
      }
    }
    wind.clock.value = Number.isFinite(timeSeconds) ? timeSeconds : 0;
  }

  return { group, update, stats: Object.freeze({ trees: points.length, tiles: tiles.size, trunkColliders: points.length, highLobesPerTree: 5 }) };
}

// Lightweight, more natural silhouette for *existing* fictional RepoTown trees.
// Keep calling b.tree around this for woodcutting: the parts still merge into the same vertex range.
export function drawBuilderTree(b, { x, z, scale: s = 1, trunkHeight = 2.4, crownCenter = 3.2, crownRadius = 1.5, leaf = 0x4e8a46, seed = 0 }) {
  const trunk = 0x6b5140;
  const h = trunkHeight * s, y = crownCenter * s, r = crownRadius * s;
  b.cyl(trunk, 0.22 * s, h, x, h / 2, z);
  for (let j = 0; j < 3; j++) {
    const a = j * Math.PI * 2 / 3 + seed * 0.73;
    const spread = r * 0.37;
    b.cyl(j % 2 ? 0x78604b : 0x64503d, 0.095 * s, h * 0.37,
      x + Math.cos(a) * spread * 0.42, h * 0.81, z + Math.sin(a) * spread * 0.42,
      Math.sin(a) * 0.65, -Math.cos(a) * 0.65);
  }
  const colours = [leaf, leaf, leaf, leaf, leaf];
  for (let j = 0; j < 5; j++) {
    const angle = j * 2.39996 + seed;
    const spread = j === 0 ? 0 : r * (0.3 + (j % 2) * 0.08);
    const lobe = r * (j === 0 ? 0.63 : 0.49 + (j % 2) * 0.04);
    b.ball(colours[j], lobe,
      x + Math.cos(angle) * spread, y + (j === 0 ? 0.11 : (j % 2 ? 0.28 : -0.12)) * s,
      z + Math.sin(angle) * spread, 0.82 + (j % 3) * 0.08);
  }
}
