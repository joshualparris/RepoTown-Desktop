// Street objects at the positions Mapillary detected them (narromine-mapillary-data.js): road signs,
// zebra crossings, stop lines, benches, bike racks, traffic lights, mailboxes, hydrants and roadside
// cabinets. Sign faces turn to the traffic that reads them (Australia keeps left). Nothing here is solid:
// a triangulated position can be a metre or two out, and must never become an invisible wall.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRegulatorySignFace, REGULATORY_SIGN_TYPES } from './narromine-regulatory-signs.js';
import { NARROMINE_MAPILLARY_OBJECTS as OBJ } from './narromine-mapillary-data.js';
import {allowMapillarySignDisplay} from './narromine-mapillary-sign-placement.js';

const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
const textCache = new Map();
// PR #441: camera-detected objects projected onto the Narromine Hotel carriageway.
// Preserve the raw observation counts, but do not render without measured positions.
export const MISPLACED_HOTEL_ROAD_OBJECT_IDS = new Set(['222123616053691', '1870715210337913', '1870715420337892']);
// Australian speed sign: white panel, red ring, black number. Plain white when there is no DOM (tests).
function speedMaterial(v) {
  if (textCache.has(v)) return textCache.get(v);
  let m = mat(0xf4f4f0);
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas'); c.width = 128; c.height = 160; const g = c.getContext('2d');
    g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 128, 160); g.strokeStyle = '#c8202a'; g.lineWidth = 12;
    g.beginPath(); g.arc(64, 80, 50, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#111'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(v), 64, 82);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; m = new THREE.MeshLambertMaterial({ map: t });
  }
  textCache.set(v, m); return m;
}

export function buildNarromineMapillaryObjects(target) {
  const parent = new THREE.Group();   // built here, then merged into one mesh per material (few draw calls)
  const post = mat(0xb8bcbf), white = mat(0xf2f0ea), add = (geo, m, x, y, z, yaw = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = yaw; parent.add(o); return o; };
  const counts = {};
  // Normal gameplay never invents a new post location for an automatic
  // detection that projects over a carriageway. The public audit mode
  // ?mapillarySigns=raw restores every raw triangulated pin for comparison.
  const rawQa=typeof location!=='undefined'&&
    new URLSearchParams(location.search).get('mapillarySigns')==='raw';
  for (const o of OBJ) {
    counts[o.type] = (counts[o.type] || 0) + 1;
    if (MISPLACED_HOTEL_ROAD_OBJECT_IDS.has(o.id)) continue;
    if(!allowMapillarySignDisplay(o,rawQa))continue;
    // Facing: a sign's face normal points against the traffic that reads it. Road direction (ux, uz).
    const faceYaw = Math.atan2(o.ux * o.facing, o.uz * o.facing), roadYaw = -Math.atan2(o.uz, o.ux);
    const sign = (geo, m, h = 2.2) => { add(new THREE.CylinderGeometry(0.04, 0.04, h, 6), post, o.x, h / 2, o.z); add(geo, m, o.x, h + 0.1, o.z, faceYaw); };
    if (REGULATORY_SIGN_TYPES.includes(o.type)) {
      const h = ['keepLeft', 'noEntry'].includes(o.type) ? 1.6 : 2.2;
      add(new THREE.CylinderGeometry(0.04, 0.04, h, 6), post, o.x, h / 2, o.z);
      const face = createRegulatorySignFace(o.type);
      face.position.set(o.x, h + 0.1, o.z); face.rotation.y = faceYaw; parent.add(face);
      continue;
    }
    switch (o.type) {
      case 'speed': sign(new THREE.BoxGeometry(0.6, 0.75, 0.03), speedMaterial(o.value)); break;
      case 'speedEnd': sign(new THREE.BoxGeometry(0.6, 0.75, 0.03), mat(0xe8e8e2)); break;
      case 'warning': sign(new THREE.BoxGeometry(0.6, 0.6, 0.03).rotateZ(Math.PI / 4), mat(0xf2c230)); break;
      case 'direction': {                 // green guide sign on two posts
        for (const s of [-0.5, 0.5]) add(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), post, o.x + Math.cos(faceYaw) * s, 1.3, o.z - Math.sin(faceYaw) * s);
        add(new THREE.BoxGeometry(1.5, 0.8, 0.04), mat(0x1f6b3a), o.x, 2.4, o.z, faceYaw); break;
      }
      case 'trafficLight': add(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 6), mat(0x2b2b2b), o.x, 1.6, o.z); add(new THREE.BoxGeometry(0.32, 0.9, 0.25), mat(0x1c1c1c), o.x, 3.0, o.z, faceYaw); break;
      case 'bench': add(new THREE.BoxGeometry(1.8, 0.08, 0.45), mat(0x6b4a33), o.x, 0.45, o.z, roadYaw); add(new THREE.BoxGeometry(1.8, 0.4, 0.06), mat(0x6b4a33), o.x - Math.sin(roadYaw) * 0, 0.7, o.z, roadYaw); break;
      case 'bikeRack': add(new THREE.TorusGeometry(0.4, 0.03, 6, 12, Math.PI), post, o.x, 0, o.z, roadYaw); break;
      case 'mailbox': add(new THREE.BoxGeometry(0.5, 1.2, 0.4), mat(0xd4202f), o.x, 0.6, o.z, roadYaw); break;
      case 'hydrant': add(new THREE.CylinderGeometry(0.1, 0.12, 0.7, 8), mat(0xe6c22a), o.x, 0.35, o.z); break;
      case 'cabinet': add(new THREE.BoxGeometry(0.9, 1.2, 0.45), mat(0x8f9a8f), o.x, 0.6, o.z, roadYaw); break;
      case 'zebra': {                     // stripes across the road at the crossing, road width wide
        const n = Math.max(4, Math.round(o.roadW / 1.0));
        for (let k = 0; k < n; k++) { const off = -o.roadW / 2 + 0.5 + k * (o.roadW - 1) / (n - 1);
          add(new THREE.BoxGeometry(3.0, 0.012, 0.5), white, o.cx - o.uz * off, 0.083, o.cz + o.ux * off, roadYaw); }
        break;
      }
      case 'stopLine': {                  // across the lane on the object's side of the centreline
        const side = Math.sign((o.x - o.cx) * -o.uz + (o.z - o.cz) * o.ux) || 1, off = side * o.roadW / 4;
        add(new THREE.BoxGeometry(0.3, 0.012, o.roadW / 2 - 0.3), white, o.cx - o.uz * off, 0.083, o.cz + o.ux * off, roadYaw); break;
      }
    }
  }
  // Bake every object's transform and merge by material: hundreds of meshes become a handful.
  parent.updateMatrixWorld(true);
  const byMat = new Map();
  parent.traverse(o => { if (!o.isMesh) return; const key = o.material.map ? o.material.uuid : 'c' + o.material.color.getHex() + ':side' + o.material.side;
    if (!byMat.has(key)) byMat.set(key, { material: o.material, geos: [] });
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); if (!o.material.map) g.deleteAttribute('uv'); g.applyMatrix4(o.matrixWorld); byMat.get(key).geos.push(g); });
  for (const { material, geos } of byMat.values()) {
    const merged = mergeGeometries(geos, false); if (merged) target.add(new THREE.Mesh(merged, material));
  }
  return counts;
}
