// Regulatory road signs, placed from the road network rather than by hand, so every junction is
// controlled and every road is posted. Follows the NSW conventions (Transport for NSW traffic
// signs register, Australian Standard AS 1742): drivers keep left, signs stand on the left of the
// approach, east-west streets have priority (masterplan-model.js junctionControl), so north-south
// approaches get GIVE WAY (R1-2), or STOP (R1-1) where an estate road meets the High Street.
// Speed: 50 km/h urban default (R4-1), 40 km/h High Street shopping strip, 40 km/h school zone
// (R4-225, shown here as a plain sign; the real one has flashing lights and times).
// Signalised junctions get no priority signs. Poles are thin and non-solid, like real sign posts
// people brush past, so they never change walking or driving routes.
import * as THREE from 'three';
import { CORE_ROADS, graph } from './masterplan-model.js';
import { PLAN_ROADS, onPlannedOrCoreRoad } from './masterplan-built.js';
import { SIGNAL_CROSSINGS } from './traffic-signals.js';

const horizontal = (r) => r.a.z === r.b.z;
const half = (r) => r.width / 2;
// Driving on the left: facing (fx, fz) in a world where -z is north, the left-hand side is (fz, -fx).
const leftOf = (fx, fz) => ({ x: fz, z: -fx });

export function planRoadSigns({ highStreet = null, schools = [] } = {}) {
  const roads = [...CORE_ROADS, ...PLAN_ROADS], byId = new Map(roads.map((r) => [r.id, r]));
  const g = graph(roads), nodeById = new Map(g.nodes.map((n) => [n.id, n])), signs = [];
  const add = (type, road, at, f, back, extra = {}) => {
    const l = leftOf(f.x, f.z), side = half(road) + 1.3;
    // Step back along the road until the post is clear of every carriageway (a crossing avenue, say).
    for (let k = 0; k < 12; k++, back += 3) {
      const x = at.x - f.x * back + l.x * side, z = at.z - f.z * back + l.z * side;
      if (!onPlannedOrCoreRoad(x, z)) { signs.push({ type, road: road.id, x, z, yaw: Math.atan2(f.x, f.z), ...extra }); return; }
    }
  };
  for (const n of g.nodes) {
    const ids = [...new Set(n.edges.map((e) => e.roadId))];
    if (ids.length < 2) continue;
    if (SIGNAL_CROSSINGS.some((s) => Math.hypot(s.x - n.x, s.z - n.z) < 3)) continue;
    const ew = ids.map((id) => byId.get(id)).filter(horizontal);
    if (!ew.length) continue;                       // two north-south roads meeting: a bend, not a junction
    const crossHalf = Math.max(...ew.map(half));
    for (const e of n.edges) {
      const road = byId.get(e.roadId);
      if (horizontal(road)) continue;               // priority road: no control sign
      const other = nodeById.get(e.to);
      const len = Math.hypot(n.x - other.x, n.z - other.z); if (len < 1) continue;
      const f = { x: (n.x - other.x) / len, z: (n.z - other.z) / len };   // travelling towards the junction
      const meetsHighStreet = highStreet && Math.abs(n.z - highStreet.z) < 1 && road.status === 'design';
      // Overlapping road records (an avenue stub under an estate road) share one approach: one sign, the stronger.
      const approach = `${n.x},${n.z}:${Math.sign(f.x)},${Math.sign(f.z)}`, type = meetsHighStreet ? 'stop' : 'giveway';
      const prior = signs.find((s) => s.approach === approach);
      if (prior) { if (type === 'stop') prior.type = 'stop'; continue; }
      add(type, road, n, f, crossHalf + 2.5, { junction: `${n.x},${n.z}`, approach });
    }
  }
  // Speed limits: one sign per direction after junctions (repeaters), [address redacted] strip.
  for (const r of roads) {
    const h = horizontal(r), lo = h ? Math.min(r.a.x, r.b.x) : Math.min(r.a.z, r.b.z), hi = h ? Math.max(r.a.x, r.b.x) : Math.max(r.a.z, r.b.z);
    const fixed = h ? r.a.z : r.a.x;
    const cuts = [lo, hi, ...g.nodes.filter((n) => n.edges.some((e) => e.roadId === r.id) && new Set(n.edges.map((e) => e.roadId)).size > 1).map((n) => h ? n.x : n.z)]
      .filter((v) => v >= lo && v <= hi).sort((a, b) => a - b).filter((v, i, a) => !i || v - a[i - 1] > 1);
    for (let i = 0; i + 1 < cuts.length; i++) {
      // Long blocks are posted after every junction; short (46 m) avenue blocks every third block.
      const a = cuts[i], b = cuts[i + 1]; if (b - a < 30 || (b - a < 60 && i % 3)) continue;
      for (const dir of [1, -1]) {
        const start = dir > 0 ? a + Math.min(18, (b - a) / 3) : b - Math.min(18, (b - a) / 3), at = h ? { x: start, z: fixed } : { x: fixed, z: start };
        const f = h ? { x: dir, z: 0 } : { x: 0, z: dir };
        const onHigh = highStreet && h && Math.abs(fixed - highStreet.z) < 1 && start >= highStreet.x0 && start <= highStreet.x1;
        add(onHigh ? 'speed40' : 'speed50', r, at, f, 0);
      }
    }
  }
  // School zone: both approaches along the street in front of each school, 60 m out.
  for (const s of schools) {
    const r = roads.filter(horizontal).sort((p, q) => Math.abs(p.a.z - s.z) - Math.abs(q.a.z - s.z))[0];
    if (!r) continue;
    for (const dir of [1, -1]) add('school40', r, { x: s.x - dir * 60, z: r.a.z }, { x: dir, z: 0 }, 0);
  }
  return signs;
}

// Sign faces drawn once to canvases (browser only; tests run without a DOM and get plain colours).
function face(type) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); x.textAlign = 'center'; x.textBaseline = 'middle';
  if (type === 'stop') {
    x.fillStyle = '#c8102e'; x.beginPath();
    for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; x.lineTo(64 + 62 * Math.cos(a), 64 + 62 * Math.sin(a)); }
    x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#fff'; x.font = 'bold 38px Arial'; x.fillText('STOP', 64, 66);
  } else if (type === 'giveway') {
    x.fillStyle = '#c8102e'; x.beginPath(); x.moveTo(4, 10); x.lineTo(124, 10); x.lineTo(64, 122); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(24, 22); x.lineTo(104, 22); x.lineTo(64, 98); x.fill();
    x.fillStyle = '#000'; x.font = 'bold 15px Arial'; x.fillText('GIVE', 64, 40); x.fillText('WAY', 64, 57);
  } else {
    const n = type === 'speed50' ? '50' : '40';
    x.fillStyle = '#fff'; x.fillRect(14, 2, 100, 124);
    x.strokeStyle = '#000'; x.lineWidth = 3; x.strokeRect(14, 2, 100, 124);
    if (type === 'school40') { x.fillStyle = '#000'; x.font = 'bold 15px Arial'; x.fillText('SCHOOL', 64, 18); x.fillText('ZONE', 64, 112); }
    const cy = type === 'school40' ? 65 : 58;
    x.fillStyle = '#fff'; x.strokeStyle = '#c8102e'; x.lineWidth = 9; x.beginPath(); x.arc(64, cy, 36, 0, Math.PI * 2); x.fill(); x.stroke();
    x.fillStyle = '#000'; x.font = 'bold 36px Arial'; x.fillText(n, 64, cy + 2);
    if (type !== 'school40') { x.font = 'bold 14px Arial'; x.fillText('km/h', 64, 110); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const FALLBACK = { stop: 0xc8102e, giveway: 0xc8102e, speed50: 0xffffff, speed40: 0xffffff, school40: 0xffeb3b };

export function buildRoadSigns(group, opts = {}) {
  const signs = planRoadSigns(opts), root = new THREE.Group(); root.name = 'Road signs';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), poles = new THREE.InstancedMesh(poleGeo, new THREE.MeshLambertMaterial({ color: 0x8a8f94 }), signs.length);
  signs.forEach((s, i) => { m4.compose(new THREE.Vector3(s.x, 1.3, s.z), q.identity(), one); poles.setMatrixAt(i, m4); });
  root.add(poles);
  const backMat = new THREE.MeshLambertMaterial({ color: 0x9aa0a6 });
  for (const type of Object.keys(FALLBACK)) {
    const list = signs.filter((s) => s.type === type); if (!list.length) continue;
    const tex = face(type);
    // Retroreflective sheeting: a little self-light keeps faces legible at dawn, dusk and under headlights.
    const mat = new THREE.MeshLambertMaterial(tex ? { map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.35, transparent: true, alphaTest: 0.3 } : { color: FALLBACK[type] });
    const size = type === 'stop' || type === 'giveway' ? 0.9 : 0.75, tall = type.startsWith('speed') || type === 'school40' ? size * 1.25 : size;
    const plate = new THREE.PlaneGeometry(size, tall);
    const mesh = new THREE.InstancedMesh(plate, mat, list.length), back = new THREE.InstancedMesh(plate, backMat, list.length);
    // The face looks back at the approaching driver and is bolted to the front of the pole, so
    // the pole stays behind it; the reverse is a plain grey sheet, not a mirror-image face.
    const n = new THREE.Vector3();
    list.forEach((s, i) => {
      q.setFromAxisAngle(up, s.yaw + Math.PI); n.set(0, 0, 1).applyQuaternion(q);
      m4.compose(new THREE.Vector3(s.x + n.x * 0.06, 2.45, s.z + n.z * 0.06), q, one); mesh.setMatrixAt(i, m4);
      q.setFromAxisAngle(up, s.yaw);
      m4.compose(new THREE.Vector3(s.x + n.x * 0.055, 2.45, s.z + n.z * 0.055), q, one); back.setMatrixAt(i, m4);
    });
    mesh.name = type; back.name = type + '-back'; root.add(mesh, back);
  }
  group.add(root);
  return { group: root, signs };
}
