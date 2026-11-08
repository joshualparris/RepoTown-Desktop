// Real-looking vehicles for Narromine traffic: Kenney Car Kit 3.1 models (CC0, see
// assets/vehicles/LICENSE-Kenney-CarKit-CC0.txt), each scaled to the overall length of the common
// Australian vehicle it stands in for (manufacturer dimensions), and drawn as one instanced mesh per
// model so hundreds of cars cost about fifteen draw calls.
//
// Mix: Australian new-vehicle sales by segment (FCAI VFACTS, calendar 2024): SUVs about 58%, light
// commercials (mostly utes) about 23%, passenger cars about 17%, heavy vehicles about 2%. Narromine
// adds the working vehicles of a farm town: tray utes, a tractor on the road now and then, delivery
// trucks, and its own police, ambulance, fire and garbage trucks (all four services are based in town).
import * as THREE from 'three';

// file, real length (m) and what it stands in for, share of traffic, whether the body is repainted.
export const VEHICLE_MODELS = Object.freeze([
  { file: 'suv.glb', length: 4.60, standsFor: 'mid-size SUV (Toyota RAV4, Mazda CX-5)', share: 30, paint: true },
  { file: 'suv-luxury.glb', length: 4.98, standsFor: 'large 4WD (Toyota LandCruiser 300, Prado)', share: 22, paint: true },
  { file: 'truck.glb', length: 5.33, standsFor: 'dual-cab ute (Toyota HiLux, Ford Ranger)', share: 14, paint: true },
  { file: 'truck-flat.glb', length: 5.30, standsFor: 'tray-back farm ute (HiLux / LandCruiser 70 cab-chassis)', share: 7, paint: true },
  { file: 'hatchback-sports.glb', length: 4.37, standsFor: 'small hatch (Toyota Corolla, Hyundai i30)', share: 8, paint: true },
  { file: 'sedan.glb', length: 4.88, standsFor: 'mid-size sedan (Toyota Camry)', share: 6, paint: true },
  { file: 'sedan-sports.glb', length: 4.70, standsFor: 'sports sedan', share: 2, paint: true },
  { file: 'van.glb', length: 5.27, standsFor: 'van (Toyota HiAce LWB)', share: 4, paint: true },
  { file: 'delivery.glb', length: 7.0, standsFor: 'light rigid delivery truck (Isuzu NPR)', share: 2, paint: false },
  { file: 'delivery-flat.glb', length: 7.0, standsFor: 'light rigid tray truck', share: 1.5, paint: false },
  { file: 'tractor.glb', length: 4.6, standsFor: 'farm tractor on the road', share: 0.6, paint: true },
  { file: 'garbage-truck.glb', length: 9.5, standsFor: 'council garbage truck', share: 0.4, paint: false },
  { file: 'police.glb', length: 4.95, standsFor: 'NSW Police car (Narromine station)', share: 0.5, paint: false },
  { file: 'ambulance.glb', length: 6.0, standsFor: 'NSW Ambulance (Narromine station)', share: 0.3, paint: false },
  { file: 'firetruck.glb', length: 8.5, standsFor: 'Fire and Rescue NSW appliance (Narromine)', share: 0.1, paint: false },
]);
// Common Australian new-car colours: white is by far the most popular, then greys, silver, black,
// blue and red; a few greens and earth tones.
const PAINTS = [0xf2f2ee, 0xf2f2ee, 0xf2f2ee, 0xe9e9e4, 0x9aa1a8, 0x9aa1a8, 0x5d636b, 0x5d636b, 0xc0c4c8, 0x1d1f23, 0x1d1f23, 0x23406e, 0x2f5f9a, 0x8c1d1d, 0xb3262b, 0x3d4a3a, 0x8a7a5c, 0xd0c7b0];

export function pickVehicle(rand) {
  const total = VEHICLE_MODELS.reduce((s, m) => s + m.share, 0); let r = rand() * total;
  for (let i = 0; i < VEHICLE_MODELS.length; i++) if ((r -= VEHICLE_MODELS[i].share) <= 0) return i;
  return 0;
}
export const pickPaint = (rand) => PAINTS[Math.floor(rand() * PAINTS.length)];

// Loads the models (browser only) and returns { meshes, draw(cars) }. Each car carries
// { model, x, z, yaw, colour }.
export async function loadVehicleModels(parent, { base = 'assets/vehicles/', max = 160 } = {}) {
  const { GLTFLoader } = await import('../vendor/GLTFLoader.js');
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const loader = new GLTFLoader();
  let material = null;
  const kinds = await Promise.all(VEHICLE_MODELS.map(async (spec) => {
    const gltf = await loader.loadAsync(base + spec.file);
    gltf.scene.updateMatrixWorld(true);
    const geos = [];
    gltf.scene.traverse(o => { if (!o.isMesh) return; material ||= o.material;
      const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      geos.push(g); });
    const geo = mergeGeometries(geos, false);
    geo.computeBoundingBox(); const b = geo.boundingBox, len = b.max.z - b.min.z, s = spec.length / len;
    // Models face +z; sit the wheels on the road and centre the body on the car's position.
    geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); geo.scale(s, s, s);
    // Paint mask: the body colour sits in the second row of the shared colour atlas.
    const uv = geo.attributes.uv, paint = new Float32Array(uv.count);
    if (spec.paint) for (let i = 0; i < uv.count; i++) { const v = uv.getY(i); paint[i] = v >= 0.25 && v < 0.5 ? 1 : 0; }
    geo.setAttribute('paint', new THREE.BufferAttribute(paint, 1));
    return geo;
  }));
  // Shared material: atlas texture, with painted panels replaced by each car's own colour (keeping
  // the atlas's light-to-dark shading so panels still read as curved metal).
  const mat = material.clone();
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float paint;\nattribute vec3 tint;\nvarying float vPaint;\nvarying vec3 vTint;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaint = paint; vTint = tint;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPaint;\nvarying vec3 vTint;')
      .replace('#include <map_fragment>', '#include <map_fragment>\nfloat shade = clamp(dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)) * 1.9, 0.55, 1.15);\ndiffuseColor.rgb = mix(diffuseColor.rgb, vTint * shade, vPaint);');
  };
  const meshes = kinds.map((geo, i) => {
    const m = new THREE.InstancedMesh(geo, mat, max);
    m.geometry.setAttribute('tint', new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3));
    m.count = 0; m.frustumCulled = false; m.name = 'Narromine traffic ' + VEHICLE_MODELS[i].file; parent.add(m); return m;
  });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), col = new THREE.Color();
  function draw(cars) {
    for (const m of meshes) m.count = 0;
    for (const c of cars) {
      const m = meshes[c.model]; if (!m || m.count >= max) continue;
      q.setFromAxisAngle(up, c.yaw); m4.compose(p.set(c.x, 0.08, c.z), q, one); m.setMatrixAt(m.count, m4);
      col.setHex(c.colour).convertSRGBToLinear(); m.geometry.attributes.tint.setXYZ(m.count, col.r, col.g, col.b); m.count++;
    }
    for (const m of meshes) { m.instanceMatrix.needsUpdate = true; m.geometry.attributes.tint.needsUpdate = true; }
  }
  return { meshes, draw };
}
