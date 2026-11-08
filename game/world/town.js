import * as THREE from 'three';
import { permittedTracksideLight } from './rail-corridor.js';
import { createStreetLighting, lightingLevel, STREET_LIGHT_BUDGET, householdLightingOn } from './lighting.js';
import { Builder } from './builder.js';
import { drawBuilderTree } from './tree-models.js';
import { buildExterior } from './exterior.js';
import { exteriorColliders } from './exterior-collision.js';
import { houseEntranceZone } from './house-entrance.js';
import { buildYeovalCampus } from './yeoval-campus.js';
import { buildBrackenCampus } from './bracken-campus.js';
import { buildOutskirts } from './town-planning.js';

// Town layout: 26 columns (A–Z) × 8 rows (streets). Every house faces +z onto its
// street. Rows are merged into one mesh each so the whole town is ~10 draw calls.
export const LOT_X = 26, LOT_Z = 46;
const COLS = 26;

// Lots in every fifth column back onto an avenue (on the left of columns A, F, K…, on the right of
// E, J, O…): their yard objects stay 8.4 m from the lot centre on that side, off the avenue's kerb.
export function yardLimitsFor(coordinate) {
  const col = coordinate.charCodeAt(0) - 65;
  return { left: col % 5 === 0 ? 8.4 : undefined, right: (col + 1) % 5 === 0 ? 8.4 : undefined };
}
export function lotPosition(coordinate) {
  const col = coordinate.charCodeAt(0) - 65, row = parseInt(coordinate.slice(1), 10) - 1;
  return { x: (col - (COLS - 1) / 2) * LOT_X, z: row * LOT_Z - 3.5 * LOT_Z, row, col };
}

export function buildTown(scene, houses, streets) {
  const group = new THREE.Group();
  scene.add(group);
  const colliders = [];
  const width = COLS * LOT_X + 60, depth = 8 * LOT_Z + 60;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(width + 400, depth + 400), new THREE.MeshLambertMaterial({ color: 0x79b46f }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  group.add(ground);
  // Southern concept reserves and the disconnected concept strips are superseded by the built
  // master plan (src/world/masterplan-built.js), which main.js adds with its labels.
  const outskirts = buildOutskirts(group, { omitParcels: ['S-R1', 'S-AG1', 'S-AG2'], roads: false });

  const deco = new Builder();
  for (let r = 0; r < 8; r++) {
    const z = r * LOT_Z - 3.5 * LOT_Z + 16;
    deco.box(0x4b4f55, width - 40, 0.04, 9, 0, 0.02, z);
    for (let i = 0; i < 60; i++) deco.box(0xf2efe6, 2.2, 0.05, 0.2, -width / 2 + 30 + i * (width - 60) / 60, 0.03, z);
    deco.box(0xc9c4b8, width - 40, 0.08, 1.6, 0, 0.04, z - 5.3);
    deco.box(0xc9c4b8, width - 40, 0.08, 1.6, 0, 0.04, z + 5.3);
    // Kerb, gutter and painted edge lines, broken at each cross avenue like a real kerb return.
    const stops = [-width / 2 + 20];
    for (let c = 0; c <= COLS; c += 5) stops.push((c - COLS / 2) * LOT_X - 4.2, (c - COLS / 2) * LOT_X + 4.2);
    stops.push(width / 2 - 20);
    for (let i = 0; i + 1 < stops.length; i += 2) {
      const x0 = stops[i], x1 = stops[i + 1], len = x1 - x0, cx = (x0 + x1) / 2;
      if (len < 2) continue;
      for (const side of [-1, 1]) {
        deco.box(0x9a968c, len, 0.13, 0.2, cx, 0.065, z + side * 4.6);        // kerb stones, a little proud of the footpath
        deco.box(0x383b40, len, 0.046, 0.55, cx, 0.023, z + side * 4.22);     // gutter
        deco.box(0xe9e6da, len, 0.052, 0.09, cx, 0.026, z + side * 3.65);     // white edge line
      }
    }
  }
  // Cross avenues every 5 columns so the grid is walkable without zig-zagging between yards.
  for (let c = 0; c <= COLS; c += 5) deco.box(0x55595f, 7, 0.035, depth - 20, (c - COLS / 2) * LOT_X, 0.018, 0);
  // Border trees frame the town and hide the ground edge.
  for (let i = 0; i < 70; i++) {
    for (const z of [-371, depth / 2 + 6]) {
      const x = -width / 2 + i * width / 70;
      drawBuilderTree(deco, { x, z, scale: 1, trunkHeight: 3, crownCenter: 4.2, crownRadius: 2.2,
        leaf: [0x4e8a46, 0x5a9a50, 0x467e40][i % 3], seed: i + (z < 0 ? 100 : 0) });
    }
  }
  // Street lamps on both footpaths: poles merge into the street mesh, the lamp heads into
  // one emissive mesh plus a bounded pool of real downward lights near the player.
  const heads = new Builder(); heads.glass = [];
  const lampSources = [];
  for (let r = 0; r < 8; r++) {
    const z = r * LOT_Z - 3.5 * LOT_Z + 16;
    for (let x = -width / 2 + 36; x < width / 2 - 30; x += 26) {
      for (const side of [-1, 1]) {
        const lz = z + side * 6.0, lx = x + (side > 0 ? 13 : 0);
        if (!permittedTracksideLight(lz - side * 0.85)) continue;
        deco.cyl(0x2f3338, 0.08, 4.2, lx, 2.1, lz);
        deco.solid(0.5, 0.5, lx, lz);           // the pole is solid; the arm and lamp head are overhead
        deco.box(0x2f3338, 0.08, 0.08, 0.9, lx, 4.15, lz - side * 0.4);
        deco.box(0x2a2c30, 0.55, 0.05, 0.32, lx + 3.5, 0.05, z + side * 4.22);           // stormwater grate
        for (let g = 0; g < 4; g++) deco.box(0x4a4d52, 0.04, 0.052, 0.28, lx + 3.5 - 0.18 + g * 0.12, 0.052, z + side * 4.22);
        deco.box(0x2f3338, 0.52, 0.12, 0.52, lx, 4.16, lz - side * 0.85);
        heads.box(0x9fd3ea, 0.42, 0.06, 0.42, lx, 4.06, lz - side * 0.85);
        lampSources.push({x:lx,y:4.02,z:lz-side*.85,roadward:-side*2.5});
      }
    }
  }
  // Town Guide kiosk at the starting square (between the M4 road and the footpath).
  const guideZ = lotPosition('M4').z + 12.8;
  deco.cyl(0x6b4a2e, 0.12, 1.8, 0, 0.9, guideZ);
  deco.box(0x3a5a78, 1.5, 1.0, 0.14, 0, 1.75, guideZ);
  deco.box(0xf4efe4, 1.32, 0.82, 0.16, 0, 1.75, guideZ);
  deco.box(0xd99b38, 1.62, 0.14, 0.24, 0, 2.3, guideZ);
  deco.solid(1.7, 0.4, 0, guideZ);              // the sign board is solid so nobody walks through it
  group.add(deco.build());
  colliders.push(...deco.solids);
  const lampMat = new THREE.MeshLambertMaterial({ color: 0xfff1c8, emissive: 0xffd27a, emissiveIntensity: 0 });
  const lamps = new THREE.Mesh(Builder.merge(heads.glass), lampMat);
  group.add(lamps);
  const lightBudget = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 4 : STREET_LIGHT_BUDGET;
  const streetLighting = createStreetLighting(group, lampSources, lightBudget);

  // One mesh per house: frustum culling then skips houses behind or beyond the fog.
  const lots = new Map();
  // Window glass goes into three town-wide meshes: households that go to bed early,
  // late, and the night owls, so lights go out across town in stages (setNight).
  const panes = [[], [], []];
  const pilotWindows=[];
  for (const [n, h] of houses.entries()) {
    const lot = lotPosition(h.coordinate);
    const hb = new Builder(); hb.glass = [];
    const fp = buildExterior(hb, h.ext, h.ext, yardLimitsFor(h.coordinate));
    const cohort=(n * 7) % 10 < 5 ? 0 : (n * 7) % 10 < 9 ? 1 : 2;
    for (const g of hb.glass)g.translate(lot.x,0,lot.z);
    if (/^[K-Q]7$/.test(h.coordinate)){
      const glass=Builder.merge(hb.glass);
      if(glass){const material=new THREE.MeshLambertMaterial({vertexColors:true,emissive:0xffb45a,emissiveIntensity:0});
        group.add(new THREE.Mesh(glass,material));pilotWindows.push({id:'H:'+h.coordinate,material,cohort});}
    } else for (const g of hb.glass)panes[cohort].push(g);
    const mesh = hb.build();
    mesh.position.set(lot.x, 0, lot.z);
    group.add(mesh);
    // A single solid rectangular footprint blocked every visible front door.
    // Reserve the real 3D doorway and keep the rest of the building solid.
    colliders.push(...exteriorColliders(fp,lot.x,lot.z));
    for (const y of fp.yard) colliders.push({ x0: lot.x + y.x0, x1: lot.x + y.x1, z0: lot.z + y.z0, z1: lot.z + y.z1, top: y.top ?? 1.5 });   // yard objects can be jumped onto
    const doorPos = new THREE.Vector3(lot.x + fp.door.x, 0, lot.z + fp.front);
    lots.set(h.coordinate, { house: h, lot, fp, doorPos, mesh });
  }

  // Front doors are individual hinged leaves so they can swing open on approach.
  const doors = [];
  for (const { house, doorPos, fp } of lots.values()) {
    const hinge = new THREE.Group();
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(fp.door.w - 0.08, 2.42, 0.1), new THREE.MeshLambertMaterial({ color: house.ext.door || 0x6b4a2e }));
    leaf.position.set((fp.door.w - 0.08) / 2, 1.21, 0);
    hinge.add(leaf);
    hinge.position.set(doorPos.x - fp.door.w / 2 + 0.04, 0, doorPos.z + 0.02);
    hinge.userData = { open: 0, coordinate: house.coordinate, centre: doorPos.clone() };
    group.add(hinge);
    doors.push(hinge);
  }
  const doorZones = [...lots.values()].map(({ house, doorPos, fp }) => ({
    coordinate: house.coordinate, ...houseEntranceZone(doorPos, fp),
  }));

  const windowMats = panes.map(() => new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0xffb45a, emissiveIntensity: 0 }));
  panes.forEach((p, i) => { const g = Builder.merge(p); if (g) group.add(new THREE.Mesh(g, windowMats[i])); });
  let estateLighting=null;
  function attachEstateLighting(estate){estateLighting=estate;streetLighting.addSources(estate.streetLampSources);}
  // dark: 0 by day … 1 at night. minute: town clock, for bedtimes and early risers.
  function setNight(dark, minute, eye = {x:0,z:0}, powered = true,perHousePower=()=>powered) {
    const on = [0,1,2].map(cohort=>householdLightingOn(minute,cohort));
    windowMats.forEach((m, i) => { m.emissiveIntensity = on[i] ? dark * 0.95 : dark * 0.05; });
    for(const w of pilotWindows)w.material.emissiveIntensity=perHousePower(w.id)?(on[w.cohort]?dark*.95:dark*.05):0;
    lampMat.emissiveIntensity = powered ? 1.2 * lightingLevel(dark) : 0;
    streetLighting.update(eye, dark, powered);
    // Estate bulb meshes and the original town rig obey one shared clock/grid.
    estateLighting?.setNight(dark, powered);
  }

  const campuses = [buildYeovalCampus(group, colliders),buildBrackenCampus(group,colliders)];
  return { group, ground, colliders, campuses, lots, doors, doorZones, streets, guidePos: new THREE.Vector3(0, 0, guideZ), bounds: { width, depth }, outskirts, streetLighting, lampSources, setNight, attachEstateLighting };
}

// Street-name signs at both ends of each street, plus the Town Guide sign near spawn.
export function streetSigns(group, streets, makeLabel) {
  streets.forEach((name, r) => {
    const z = r * LOT_Z - 3.5 * LOT_Z + 16;
    for (const x of [-(COLS / 2) * LOT_X - 8, (COLS / 2) * LOT_X + 8]) {
      const s = makeLabel(`${name} · row ${r + 1}`, 'street');
      s.position.set(x, 3.6, z);
      group.add(s);
    }
  });
  const guideLabel = makeLabel('🗺️ Town Guide', 'interactive');
  guideLabel.position.set(0, 2.75, lotPosition('M4').z + 12.8);
  group.add(guideLabel);
}
