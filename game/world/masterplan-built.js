// Builds the selected master plan (alternative D, research/masterplan/README.md) into the town:
// named, connected roads that tie into Street 8, surveyed parcels with boundary posts and
// numbered letterboxes, and street addresses. The geometry and numbering come from
// masterplan-model.js so the audit, the 3D town, driving and the map all share one source.
//
// Addressing follows the NSW urban convention used by councils applying the NSW Address
// Policy and User Manual: sequential numbers from the road's datum (its town end), odd on the
// left and even on the right when travelling away from the datum. These are fictional
// in-game addresses, not Geographical Names Board approvals.
import * as THREE from 'three';
import { Builder } from './builder.js';
import { COUNTRY_HOMES, countryDesign, buildCountryHome } from './country-homes.js';
import { exteriorColliders } from './exterior-collision.js';
import { estateStreetLightLocations } from './estate-lighting.js';
import { lightingLevel } from './lighting.js';
import { SELECTED_PLAN, CORE_ROADS, planAddresses, roadRect, graph } from './masterplan-model.js';

// Fictional names: native plants for residential streets, working names for the farm and
// employment links. Links that continue an existing avenue line keep one name end to end.
export const PLAN_ROAD_NAMES = Object.freeze({
  'local-south': 'Wattle Street',
  'local-north': 'Banksia Street',
  'southern-edge': 'Grevillea Street',
  'western-link': 'Acacia Road',
  'core-link-0': 'Kurrajong Road',
  'core-link-1': 'Bottlebrush Road',
  'core-link-2': 'Silo Lane',
  'employment-access': 'Saleyards Road',
});

const USE_LABEL = { residential: 'Residential lot', community: 'Community campus', park: 'Neighbourhood park', employment: 'Employment lot', buffer: 'Landscape buffer' };

export const PLAN_ROADS = Object.freeze(SELECTED_PLAN.roads.map((r) => Object.freeze({ ...r, name: PLAN_ROAD_NAMES[r.id] || r.id })));
export const ESTATE_LAMPS = estateStreetLightLocations(PLAN_ROADS);

const ADDRESS_RECORDS = planAddresses(SELECTED_PLAN);
export const PLAN_PARCELS = Object.freeze(SELECTED_PLAN.parcels.map((p) => {
  const a = ADDRESS_RECORDS.find((x) => x.parcelId === p.id);
  const roadName = a ? PLAN_ROAD_NAMES[a.roadId] : null;
  return Object.freeze({
    ...p,
    label: USE_LABEL[p.use] || p.use,
    number: a ? a.number : null,
    roadName,
    side: a ? a.side : null,
    address: a && roadName ? `${a.number} ${roadName}` : null,
    areaM2: p.w * p.d,
  });
}));

// One driveable road surface list for player driving: the existing streets and avenues
// bounded to their drawn extents (they used to be treated as infinitely long) plus the plan.
const pad = (rect, m) => ({ x0: rect.x0 - m, x1: rect.x1 + m, z0: rect.z0 - m, z1: rect.z1 + m });
export const DRIVEABLE_RECTS = Object.freeze([...CORE_ROADS, ...PLAN_ROADS].map((r) => Object.freeze(pad(roadRect(r), 0.5))));
export function onPlannedOrCoreRoad(x, z) {
  return DRIVEABLE_RECTS.some((b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1);
}

// Junctions between plan roads and the existing streets, for signs and the map.
export function planJunctions() {
  const g = graph([...CORE_ROADS, ...PLAN_ROADS]);
  const byId = new Map([...CORE_ROADS, ...PLAN_ROADS].map((r) => [r.id, r]));
  return g.nodes.filter((n) => {
    const ids = new Set(n.edges.map((e) => e.roadId));
    return ids.size > 1 && [...ids].some((id) => PLAN_ROAD_NAMES[id]);
  }).map((n) => ({ x: n.x, z: n.z, roads: [...new Set(n.edges.map((e) => e.roadId))].map((id) => byId.get(id)?.name || id) }));
}

// One culturally informed, distinct procedural design for every one of 195 countries.
// The full country catalogue maps 1:1 onto exactly 195 residential parcels; all earlier
// parcel IDs remain unchanged for game-save compatibility.
export const PLAN_HOMES = Object.freeze(PLAN_PARCELS.filter((p) => p.use === 'residential').map((p, i) => {
  const design = countryDesign(i, p.w);
  const road = PLAN_ROADS.find((r) => r.id === p.roadId);
  // Homes front a street: north-side lots face south; south-side lots face north.
  const facesNorth = road.a.z === road.b.z && road.a.z < p.z;
  return Object.freeze({
    parcelId: p.id, address: p.address, number: p.number,
    country: design.country, tradition: design.tradition, region: design.region,
    style: design.profile, design, facesNorth, x: p.x,
    frontZ: facesNorth ? p.z - p.d / 2 + 6 : p.z + p.d / 2 - 6,
  });
}));
if (PLAN_HOMES.length !== COUNTRY_HOMES.length)
  throw new Error('Every country must have a corresponding residential plot');

export function homeWalkway(home) {
  const p=PLAN_PARCELS.find(q=>q.id===home.parcelId);
  const r=PLAN_ROADS.find(q=>q.id===p.roadId);
  // Each entrance joins the centreline of the nearest existing footpath,
  // without forcing walkers onto the eight-metre carriageway.
  const sidewalkZ=r.a.z+Math.sign(home.frontZ-r.a.z)*(r.width/2+1.6);
  return {x:home.x,z0:Math.min(home.frontZ,sidewalkZ),z1:Math.max(home.frontZ,sidewalkZ),
    width:1.6,roadId:r.id,lengthM:Math.abs(home.frontZ-sidewalkZ)};
}

// A wall plaque beside the front door: the street number large, the country beneath, as on a
// real house sign. Painted onto a canvas so it is part of the house, not a floating label.
function housePlaque(number, country) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 256; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#f4efe2'; g.fillRect(0, 0, 256, 160);
  g.strokeStyle = '#2b2b2b'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 152);
  g.fillStyle = '#1f1f1f'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 84px Georgia, serif'; g.fillText(String(number), 128, 58);
  let size = 44; g.font = `${size}px Georgia, serif`;
  while (g.measureText(country).width > 232 && size > 20) { size -= 2; g.font = `${size}px Georgia, serif`; }
  g.fillText(country, 128, 124);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.6), new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 }));
  m.name = `House sign ${number} · ${country}`;
  return m;
}

function buildHomes(root) {
  const colliders = [];
  for (const h of PLAN_HOMES) {
    const b = new Builder(); b.glass = [];
    const fp = buildCountryHome(b, h.design);
    // Position so the front wall sits on frontZ; rotate π for north-facing lots.
    const cz = h.facesNorth ? h.frontZ + fp.front : h.frontZ - fp.front;
    const mesh = b.build(); mesh.position.set(h.x, 0, cz); if (h.facesNorth) mesh.rotation.y = Math.PI;
    mesh.name = `${h.address} · ${h.country} (${h.tradition})`; root.add(mesh);
    const plaque = h.number ? housePlaque(h.number, h.country) : null;
    if (plaque) { plaque.position.set(fp.door.x + fp.door.w / 2 + 0.85, 1.8, fp.front + 0.04); mesh.add(plaque); }
    const glass = Builder.merge(b.glass);
    if (glass) { const g = new THREE.Mesh(glass, new THREE.MeshLambertMaterial({ vertexColors: true })); g.position.copy(mesh.position); g.rotation.y = mesh.rotation.y; root.add(g); }
    for (const c of [...exteriorColliders(fp, 0, 0), ...fp.yard]) {
      // Rotating π about the house origin mirrors both axes.
      const ext = c.top != null ? { top: c.top } : {};
      colliders.push(h.facesNorth ? { x0: h.x - c.x1, x1: h.x - c.x0, z0: cz - c.z1, z1: cz - c.z0, ...ext } : { x0: h.x + c.x0, x1: h.x + c.x1, z0: cz + c.z0, z1: cz + c.z1, ...ext });
    }
  }
  return colliders;
}

export function buildMasterplan(group, makeLabel = null) {
  const root = new THREE.Group(); root.name = 'Master plan D: southern neighbourhood';
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  const asphalt = mat(0x4c4f52), path = mat(0xb9b4a8), line = mat(0xece6cf), lawn = mat(0x86b86e), lawnAlt = mat(0x7eaf68),
    post = mat(0x6e5a44), boxMat = mat(0x2f5d8c), parkMat = mat(0x6fae5a), campusMat = mat(0xa9b39a), workMat = mat(0xb3a586);
  const box = (m, w, h, d, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); root.add(o); return o; };

  for (const r of PLAN_ROADS) {
    const horizontal = r.a.z === r.b.z, len = horizontal ? Math.abs(r.b.x - r.a.x) : Math.abs(r.b.z - r.a.z);
    const cx = (r.a.x + r.b.x) / 2, cz = (r.a.z + r.b.z) / 2;
    // Carriageway, then a footpath inside each side of the 20 m reserve.
    box(asphalt, horizontal ? len + r.width : r.width, 0.03, horizontal ? r.width : len + r.width, cx, 0.012, cz).name = r.name;
    for (const s of [-1, 1]) {
      const off = r.width / 2 + 1.6;
      if (horizontal) box(path, len, 0.05, r.footpath, cx, 0.02, cz + s * off);
      else box(path, r.footpath, 0.05, len, cx + s * off, 0.02, cz);
    }
    // Dashed centre line.
    for (let t = 4; t < len - 2; t += 9) {
      const p = horizontal ? { x: Math.min(r.a.x, r.b.x) + t, z: cz } : { x: cx, z: Math.min(r.a.z, r.b.z) + t };
      box(line, horizontal ? 3 : 0.15, 0.035, horizontal ? 0.15 : 3, p.x, 0.03, p.z);
    }
  }

  for (const [i, p] of PLAN_PARCELS.entries()) {
    const m = p.use === 'park' ? parkMat : p.use === 'community' ? campusMat : p.use === 'employment' ? workMat : (i % 2 ? lawn : lawnAlt);
    box(m, p.w - 0.4, 0.04, p.d - 0.4, p.x, 0.005, p.z).name = `${p.id} ${p.address || p.label}`;
    // Corner survey posts mark the boundary without blocking movement.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(post, 0.12, 0.7, 0.12, p.x + sx * (p.w / 2 - 0.2), 0.35, p.z + sz * (p.d / 2 - 0.2));
    const road = PLAN_ROADS.find((r) => r.id === p.roadId);
    if (!road || !p.number) continue;
    // Letterbox at the road frontage, a metre inside the boundary.
    const horizontal = road.a.z === road.b.z;
    const dir = horizontal ? Math.sign(road.a.z - p.z) : Math.sign(road.a.x - p.x);
    const fx = horizontal ? p.x - p.w / 2 + 1.5 : p.x + dir * (p.w / 2 - 1);
    const fz = horizontal ? p.z + dir * (p.d / 2 - 1) : p.z - p.d / 2 + 1.5;
    box(post, 0.1, 1.0, 0.1, fx, 0.5, fz);
    box(boxMat, 0.45, 0.3, 0.3, fx, 1.1, fz);
    if (makeLabel) {
      const tag = makeLabel(`${p.number}`, 'interactive');
      tag.scale.multiplyScalar(0.45); tag.position.set(fx, 1.75, fz); root.add(tag);
      if (p.use !== 'residential') {
        const big = makeLabel(`${p.label} · ${p.address}`, 'house');
        big.position.set(p.x, 3.4, p.z); root.add(big);
      }
    }
  }

  if (makeLabel) {
    for (const j of planJunctions()) {
      const s = makeLabel(j.roads.join(' / '), 'street');
      s.scale.multiplyScalar(0.8); s.position.set(j.x + 6, 3.2, j.z + 6); root.add(s);
    }
  }
  // Physical links between every home and the street footpath (the old scene
  // had 195 front doors opening into uninterrupted grass). Merge for mobile.
  const access=new Builder();
  for(const h of PLAN_HOMES){
    const w=homeWalkway(h);
    access.box(0xd5c8b5,w.width,.045,w.lengthM+.3,w.x,.035,(w.z0+w.z1)/2);
  }
  root.add(access.build());
  // Every new estate road gets permanent, correctly spaced poles and a visible
  // luminaire head. A tiny shared set of actual spotlights follows the player
  // via town.streetLighting; the head meshes give persistent dusk illumination
  // without 200+ expensive mobile real-time lights.
  const poles=new Builder(), heads=new Builder();
  const streetLampSources=[];
  for(const l of ESTATE_LAMPS){
    poles.cyl(0x43494d,.11,l.height,l.x,l.height/2,l.z);
    poles.box(0x43494d,.085,.085,2.25,(l.x+l.headX)/2,l.height-.17,(l.z+l.headZ)/2,
      Math.abs(l.headX-l.x)>0?Math.PI/2:0);
    poles.box(0x31393e,.66,.20,.50,l.headX,l.height-.16,l.headZ,
      Math.abs(l.headX-l.x)>0?Math.PI/2:0);
    heads.box(0xffe4a4,.54,.075,.38,l.headX,l.height-.31,l.headZ,
      Math.abs(l.headX-l.x)>0?Math.PI/2:0);
    // A pole behind the 2m footpath has a real collision footprint.
    poles.solid(.38,.38,l.x,l.z);
    streetLampSources.push({x:l.headX,y:l.height-.36,z:l.headZ,
      roadwardX:l.roadwardX,roadwardZ:l.roadwardZ,estate:true});
  }
  root.add(poles.build());
  const lampHeads=new THREE.Mesh(Builder.merge(heads.parts),
    new THREE.MeshLambertMaterial({vertexColors:true,emissive:0xffd78c,emissiveIntensity:0}));
  lampHeads.name='Wattle, Banksia, Grevillea and connecting road luminaires';
  root.add(lampHeads);
  const setNight=(dark,powered=true)=>{
    lampHeads.material.emissiveIntensity=powered?1.5*lightingLevel(dark):0;
  };
  const homeColliders=buildHomes(root),lampColliders=poles.solids;
  const colliders=[...homeColliders,...lampColliders];
  group.add(root);
  return { group: root, roads: PLAN_ROADS, parcels: PLAN_PARCELS, homes: PLAN_HOMES,
    colliders, homeColliders, lampColliders, streetLampSources, lampHeads, setNight, lampPositions:ESTATE_LAMPS };
}
