// Visible street services for the master-plan estate, answering the in-game parts of the 195-home
// planning audit (docs/195_HOME_DUBBO_PLANNING_CODE_AUDIT_2026-10-27.md items 4-6): stormwater
// kerb inlet pits, sewer manholes, fire hydrants with their blue raised pavement markers, telecom
// pits and pad-mount transformers. They show where services run; they are not an engineering
// design, and the audit's survey, capacity and certification items still apply to any real site.
// Layout follows common NSW practice: kerb inlets at regular spacing on both kerbs, sewer in the
// carriageway, hydrants in the verge with a blue marker on the road centre, telecom pits in the
// verge, kiosk substations at the property boundary. Only the transformers are solid.
import * as THREE from 'three';
import { CORE_ROADS } from './masterplan-model.js';
import { PLAN_ROADS } from './masterplan-built.js';
import { estateStreetLightLocations } from './estate-lighting.js';

const SPACING = { inlet: 30, manhole: 80, hydrant: 90, telecom: 60, transformer: 220 };
const JUNCTION_CLEAR = 14;

export function planCivilWorks(roads = PLAN_ROADS) {
  const all = [...CORE_ROADS, ...roads], items = [];
  const lamps = estateStreetLightLocations(roads);
  const nearJunction = (x, z, self) => all.some((o) => o.id !== self.id && (o.a.z === o.b.z
    ? Math.abs(z - o.a.z) < JUNCTION_CLEAR + o.width / 2 && x >= Math.min(o.a.x, o.b.x) - JUNCTION_CLEAR && x <= Math.max(o.a.x, o.b.x) + JUNCTION_CLEAR
    : Math.abs(x - o.a.x) < JUNCTION_CLEAR + o.width / 2 && z >= Math.min(o.a.z, o.b.z) - JUNCTION_CLEAR && z <= Math.max(o.a.z, o.b.z) + JUNCTION_CLEAR));
  const clearOfLamps = (x, z) => !lamps.some((l) => Math.hypot(l.x - x, l.z - z) < 1.5);
  for (const r of roads) {
    const h = r.a.z === r.b.z, len = h ? Math.abs(r.b.x - r.a.x) : Math.abs(r.b.z - r.a.z);
    const start = h ? Math.min(r.a.x, r.b.x) : Math.min(r.a.z, r.b.z), half = r.width / 2;
    const at = (t, off) => h ? { x: start + t, z: r.a.z + off } : { x: r.a.x + off, z: start + t };
    const place = (kind, t, off, extra = {}) => {
      const p = at(t, off);
      if (t < 6 || t > len - 6 || nearJunction(p.x, p.z, r) || !clearOfLamps(p.x, p.z)) return false;
      items.push({ kind, road: r.id, ...p, horizontal: h, ...extra }); return true;
    };
    for (let t = SPACING.inlet / 2; t < len; t += SPACING.inlet) for (const s of [-1, 1]) place('inlet', t, s * (half + 0.25), { side: s });
    for (let t = SPACING.manhole / 2; t < len; t += SPACING.manhole) place('manhole', t, 0);
    for (let t = SPACING.hydrant / 2, n = 0; t < len; t += SPACING.hydrant, n++) {
      const s = n % 2 ? 1 : -1;
      if (place('hydrant', t, s * (half + 3.4), { side: s })) items.push({ kind: 'marker', road: r.id, ...at(t, s * 0.4), horizontal: h });
    }
    for (let t = SPACING.telecom / 3, n = 0; t < len; t += SPACING.telecom, n++) place('telecom', t, (n % 2 ? 1 : -1) * (half + 4.4));
    for (let t = SPACING.transformer / 2, n = 0; t < len; t += SPACING.transformer, n++) place('transformer', t, (n % 2 ? -1 : 1) * (half + 5.2));
  }
  return items;
}

export function buildCivilWorks(group, roads = PLAN_ROADS) {
  const items = planCivilWorks(roads), root = new THREE.Group(); root.name = 'Estate services';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const kinds = {
    inlet: { geo: new THREE.BoxGeometry(1.0, 0.04, 0.45), color: 0x2a2c30, y: 0.03 },
    manhole: { geo: new THREE.CylinderGeometry(0.32, 0.32, 0.04, 14), color: 0x3c3f43, y: 0.03 },
    hydrant: { geo: new THREE.BoxGeometry(0.08, 1.0, 0.08), color: 0xf2c200, y: 0.5 },        // yellow marker post
    hydrantPlate: { geo: new THREE.BoxGeometry(0.22, 0.28, 0.02), color: 0xffffff, y: 0.95, from: 'hydrant' },
    hydrantLid: { geo: new THREE.BoxGeometry(0.45, 0.05, 0.3), color: 0xd8c000, y: 0.04, from: 'hydrant', shift: 0.6 },
    marker: { geo: new THREE.BoxGeometry(0.1, 0.03, 0.1), color: 0x1e6fd9, y: 0.03 },          // blue RRPM
    telecom: { geo: new THREE.BoxGeometry(0.6, 0.06, 0.4), color: 0x9a9a92, y: 0.03 },
    transformer: { geo: new THREE.BoxGeometry(1.4, 1.5, 1.0), color: 0x4d6b4f, y: 0.75 },
  };
  for (const [name, k] of Object.entries(kinds)) {
    const list = items.filter((i) => i.kind === (k.from || name)); if (!list.length) continue;
    const mesh = new THREE.InstancedMesh(k.geo, new THREE.MeshLambertMaterial({ color: k.color, ...(name === 'marker' ? { emissive: 0x1e6fd9, emissiveIntensity: 0.4 } : {}) }), list.length);
    list.forEach((i, n) => {
      q.setFromAxisAngle(up, i.horizontal ? 0 : Math.PI / 2);
      const toward = k.shift ? (i.side || 1) * -k.shift : 0;
      const pos = new THREE.Vector3(i.x + (i.horizontal ? 0 : toward), k.y, i.z + (i.horizontal ? toward : 0));
      m4.compose(pos, q, new THREE.Vector3(1, 1, 1)); mesh.setMatrixAt(n, m4);
    });
    mesh.name = name; root.add(mesh);
  }
  group.add(root);
  const colliders = items.filter((i) => i.kind === 'transformer').map((i) => {
    const w = i.horizontal ? 0.7 : 0.5, d = i.horizontal ? 0.5 : 0.7;
    return { x0: i.x - w, x1: i.x + w, z0: i.z - d, z1: i.z + d };
  });
  return { group: root, items, colliders };
}
