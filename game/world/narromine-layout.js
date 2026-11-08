// Narromine, a separate town reached by driving west along the Mitchell Highway (A32).
// Pure data (no three.js) so driving, collision and tests share one source.
//
// The town is the real one: streets, buildings, parks, rail, water and named places come from
// an OpenStreetMap export (narromine-osm-data.js, made by tools/narromine-osm.mjs;
// map data © OpenStreetMap contributors, ODbL). Only the drive between the towns is compressed:
// the real Dubbo–Narromine trip is about 40 km (≈30 min); the game road is about 2.5 km
// (≈90 s at 100 km/h) and its signs state the real distance. It meets the real Mitchell Highway
// at the eastern edge of the export, from where the highway becomes Dandaloo Street.
// Facts and sources: docs/NARROMINE_RESEARCH_AND_PLAN_2026-11-03.md.
import { NARROMINE_OSM as OSM } from './narromine-osm-data.js';
import { NARROMINE_FOOTPRINTS } from './narromine-footprints-data.js';
import { NARROMINE_FOOTPRINT_LIDAR } from './narromine-footprint-lidar-data.js';
export { OSM };
import { NARROMINE_BUILDINGS } from './narromine-buildings-data.js';
import { NARROMINE_LIDAR } from './narromine-lidar-data.js';
import { NARROMINE_COURTHOUSE_CADASTRAL_LOTS } from './narromine-courthouse-evidence.js';
import { NARROMINE_AVIATION_CADASTRAL_LOTS } from './narromine-aviation-evidence.js';
import { NARROMINE_NW_DANDALOO_INTEGRATION_SPEC } from './narromine-nw-dandaloo-evidence.js';
const LIDAR = NARROMINE_LIDAR.heights;

export const HIGHWAY_Z = -7;                 // continues Repository Town's Street 4
export const HIGHWAY = Object.freeze({ id: 'mitchell-highway', name: 'Mitchell Highway (A32)', x0: -2870, x1: -343, z: HIGHWAY_Z, width: 9, speed: 100 });
// Map metres (x east, z south) → game world: the export's highway edge sits at the road's west end.
export const OFFSET = Object.freeze({ x: HIGHWAY.x0, z: HIGHWAY_Z });
export const toWorld = ([x, z]) => [OFFSET.x + x, OFFSET.z + z];
// Latitude/longitude → game world, with the same projection the OpenStreetMap converter used.
const RAD = Math.PI / 180, EARTH = 6371008.8, COS_ANCHOR = Math.cos(OSM.anchor.lat * RAD);
export const geoToWorld = (lat, lon) => toWorld([(lon - OSM.anchor.lon) * RAD * EARTH * COS_ANCHOR, -(lat - OSM.anchor.lat) * RAD * EARTH]);
const E = OSM.extent;
export const REGION = Object.freeze({ x0: OFFSET.x + E.x0 - 40, x1: OFFSET.x + Math.max(E.x1, 0) + 40, z0: OFFSET.z + E.z0 - 40, z1: OFFSET.z + E.z1 + 40 });
export const CORRIDOR_HALF = 45;             // fenced paddock strip either side of the highway

// Real streets in world coordinates, as polylines with a carriageway width.
export const STREETS = Object.freeze(OSM.roads.map((r) => Object.freeze({ name: r.name, kind: r.kind, width: r.width, pts: r.pts.map(toWorld) })));

// Spatial grid of road segments so "is this point on a road?" stays cheap every frame.
const CELL = 40, grid = new Map();
const key = (cx, cz) => cx + ',' + cz;
for (const s of STREETS) for (let i = 1; i < s.pts.length; i++) {
  const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], pad = s.width / 2 + 1;
  for (let cx = Math.floor((Math.min(ax, bx) - pad) / CELL); cx <= Math.floor((Math.max(ax, bx) + pad) / CELL); cx++)
    for (let cz = Math.floor((Math.min(az, bz) - pad) / CELL); cz <= Math.floor((Math.max(az, bz) + pad) / CELL); cz++) {
      const k = key(cx, cz); if (!grid.has(k)) grid.set(k, []); grid.get(k).push({ ax, az, bx, bz, half: s.width / 2 + 0.5 });
    }
}
const segDist = (x, z, s) => { const dx = s.bx - s.ax, dz = s.bz - s.az, l = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l)); return Math.hypot(x - s.ax - t * dx, z - s.az - t * dz); };
export const onTownStreet = (x, z) => (grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) || []).some((s) => segDist(x, z, s) <= s.half);
export const nearTownStreet = (x, z, margin) => (grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) || []).some((s) => segDist(x, z, s) <= s.half + margin);

const inRect = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
export const HIGHWAY_RECT = Object.freeze({ x0: HIGHWAY.x0 - 1, x1: HIGHWAY.x1, z0: HIGHWAY.z - HIGHWAY.width / 2 - 0.5, z1: HIGHWAY.z + HIGHWAY.width / 2 + 0.5 });
// The open highway between the towns (100 km/h): not the town end of Street 4 or Narromine's streets.
export const onOpenHighway = (x, z) => x > HIGHWAY.x0 + 40 && x < -400 && Math.abs(z - HIGHWAY.z) <= HIGHWAY.width / 2 + 0.5;
export const onNarromineRoad = (x, z) => inRect(HIGHWAY_RECT, x, z) || (x < REGION.x1 && onTownStreet(x, z));

// Buildings in world coordinates. Unnamed outlines stay unnamed; private homes were stripped of
// names and addresses by the converter.
// Buildings modelled in detail from aerial imagery and the cadastre (see narromine-buildings-data.js).
const W = (pts) => pts.map(([lat, lon]) => geoToWorld(lat, lon));
export const DETAILED = Object.freeze(NARROMINE_BUILDINGS.map((d) => Object.freeze({ ...d, boundary: W(d.boundary), trees: W(d.trees),
  parts: d.parts.map((p) => ({ ...p, pts: W(p.pts), lidar: LIDAR[d.id + '|' + p.name] || null })), verandahs: d.verandahs.map((v) => ({ ...v, pts: W(v.pts), lidar: LIDAR[d.id + '|' + v.name] || null })),
  ground: d.ground.map((g) => ({ ...g, pts: W(g.pts) })),
  // Props carry a point (at), an outline (pts) or a run between two points (a, b).
  props: (d.props || []).map((p) => ({ ...p, ...Object.fromEntries(['at', 'a', 'b'].filter((k) => p[k]).map((k) => [k, W([p[k]])[0]])), ...(p.pts ? { pts: W(p.pts) } : {}) })) })));
// Mapped outlines whose centre lies in a detailed lot are left out: the detailed model replaces them.
const centreOf = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
export const BUILDINGS = Object.freeze(OSM.buildings.map((b, i) => Object.freeze({ ...b, osmIndex: i, pts: b.pts.map(toWorld), lidar: LIDAR['osm:' + i] || null }))
  .filter((b) => !DETAILED.some((d) => inPoly(...centreOf(b.pts), d.boundary))));
export const AREAS = Object.freeze(OSM.areas.map((a) => Object.freeze({ ...a, pts: a.pts.map(toWorld) })));
export const WATER = Object.freeze(OSM.water.map((w) => Object.freeze({ ...w, pts: w.pts.map(toWorld) })));
export const RAIL = Object.freeze(OSM.rail.map((r) => Object.freeze({ pts: r.pts.map(toWorld) })));
export function polyRect(pts) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  // poly: the true outline. CollisionWorld uses the box to find candidates and the outline to decide,
  // so a building at an angle to the grid no longer blocks the street beside it with its box corners.
  return { x0, x1, z0, z1, poly: pts.map(([x, z]) => [x, z]) };
}

// Spelling corrections for the map data, and sourced history for places that have it.
const NAME_FIX = { 'Narromine Aviation Muesum': 'Narromine Aviation Museum', 'Narrmine Physiotherapy': 'Narromine Physiotherapy',
  // OSM labels a point at 86 Dandaloo "Anglican Church"; the Churches Australia directory puts St Mary's Anglican at 148.
  'Anglican Church': 'Church ([address redacted], denomination unverified)' };
const FACTS = {
  "St Mary's Anglican Church": 'Foundation stone laid 22 May 1929 by Bishop Horace Crotty; opened 16 July 1933; a further stone laid 27 October 1959. (Churches Australia directory, from the stones)',
  'Royal Hotel': 'Built in 1890; once a Cobb & Co coach stop. (Aussietowns)',
  'Narromine Post Office': 'Opened as the Narramine Post Office on 20 October 1882, the day the railway reached town; renamed Narromine in November 1900. (Premier Postal, via Wikipedia)',
  'Narromine Hotel': 'Built in 1901 as the Federal Hotel; known for the iron lace on its upper veranda. (Aussietowns)',
  'The Court House Hotel': 'First established by David Fitch in 1889, on the corner of Burraway and Merilba Streets. (Aussietowns)',
  'Narromine Aviation Museum': 'Opened in 2002 at the aerodrome (Lot 122 DP 1126499, Narromine LEP 2011 Item I12), home of WWII RAAF No. 5 Elementary Flying Training School (1940–44), where about 2,800 pilots trained. Exhibits include CAC Sabre A94-915, a flying 1903 Wright Flyer replica, a Corben Super Ace, a Rolls-Royce Merlin Mk 25 engine, and the RAAF No. 5 EFTS 33-plaque Memorial Wall. (Narromine Aviation Museum / AWM)',
  'Narromine Aero Club': 'Founded in 1929 — one of Australia’s oldest regional aero clubs, visited by Sir Charles Kingsford Smith, Nancy-Bird Walton, and Jean Batten, sharing the Tom Perry Drive aerodrome terminal complex with the Narromine Aviation Museum. (Visit NSW / Wikipedia)',
  'Narromine Gliding Club': 'Post-WWII thermal soaring and gliding centre at Narromine Aerodrome (YNRM, Lot 122 DP 1126499), hosting national and international gliding championships and weekend joy flights. (Visit NSW / Narromine Aviation Museum)',
  'Tom Perry Park': 'Home of a Glenn McGrath statue. (Wikipedia)',
  'Narromine Railway Station': 'Opened 1 May 1883 on the Main Western Line (497.554 km from Sydney); closed to regular passenger trains on 20 October 1975 and restored as an NSW TrainLink coach stop. Listed as Item I11 on the Narromine LEP 2011 Heritage Schedule (Lot 4 DP 1012153).',
  'Former Narromine Courthouse (1898)': 'Built c. 1898 under NSW Government Architect Walter Liberty Vernon at [address redacted] (Lot 6, Section 17, DP 758759; Narromine LEP 2011 Heritage Item I5 "Courthouse (former)"); later used as a local museum and Narromine Car Club clubrooms.',
  'Narromine Courthouse': 'Operational NSW Local Court at [address redacted] (Lot 10, Section 17, DP 758759), featuring a western colonnade portico, central courtroom clerestory monitor, and registry wing.',
  'Narromine Police Station': 'Located at [address redacted] on the corner of Burraway and Merilba Streets (Lot 5, Section 17, DP 758759, osm:174), wrapping around the 1898 Former Courthouse lot with surveyed 2011 NSW Spatial Services LiDAR heights (3.16 m eave, 6.39 m ridge).',
  'HubnSpoke': 'Narromine Shire Council co-working and business incubator hub at [address redacted] (Lot 2 & Lot 12, Section 17, DP 758759), housed in a circular radial-roofed building with a central open atrium oculus.',
};
const KIND_LABEL = (k) => String(k || 'place').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
export const PLACES = Object.freeze(OSM.places.map((p) => {
  const name = NAME_FIX[p.name] || p.name, [x, z] = toWorld([p.x, p.z]);
  const ADDRESS_FIX = {
    'Narromine Courthouse': '[address redacted]',
    'Narromine Police Station': '[address redacted]',
    'Narromine Aviation Museum': 'Tom Perry Drive (Lot 122 DP 1126499)',
    'Narromine Aero Club': 'Tom Perry Drive (Lot 122 DP 1126499)',
  };
  const address = (p.number && p.street ? `${p.number} ${p.street}` : p.street) || ADDRESS_FIX[name] || '';
  return Object.freeze({ name, kind: p.kind, kindLabel: KIND_LABEL(p.kind), address, x, z, fact: FACTS[name] || '' });
}).concat(EXTRA_PLACES()));
// Places sourced outside OpenStreetMap, positioned at their detailed building (e.g. St Mary's, missing from OSM).
function EXTRA_PLACES() {
  const at = (id) => { const d = DETAILED.find((b) => b.id === id), p = d && d.parts[0].pts; return p && [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]; };
  const sm = at('st-marys-anglican');
  const extra = sm ? [Object.freeze({ name: "St Mary's Anglican Church", kind: 'place_of_worship', kindLabel: 'Place of worship', address: '[address redacted]', x: sm[0], z: sm[1], fact: FACTS["St Mary's Anglican Church"] })] : [];
  extra.push(Object.freeze({ name: 'Narromine Railway Station', kind: 'railway_station', kindLabel: 'Railway station', address: 'Derribong Avenue (Narromine Station Access)', x: -4708.8, z: -710.2, fact: FACTS['Narromine Railway Station'] }));
  extra.push(Object.freeze({ name: 'Former Narromine Courthouse (1898)', kind: 'historic_courthouse', kindLabel: 'Heritage former courthouse (LEP Item I5)', address: '[address redacted]', x: -4590.5, z: -766.5, fact: FACTS['Former Narromine Courthouse (1898)'] }));
  extra.push(Object.freeze({ name: 'Narromine Gliding Club', kind: 'aerodrome', kindLabel: 'Gliding & soaring centre', address: 'Tom Perry Drive (Lot 122 DP 1126499)', x: -5628.4, z: -2023.2, fact: FACTS['Narromine Gliding Club'] }));
  // Published public destination pin, not surveyed entrance or floor plan.
  const soulPin=geoToWorld(-32.227273,148.2407647);
  extra.push(Object.freeze({name:'Soul Food Depot & Gallery',kind:'cafe',kindLabel:'Cafe, gallery and event venue',
    address:'1–[address redacted]',x:soulPin[0],z:soulPin[1],
    fact:'Former citrus packing shed, cafe and gallery since 2014, Loading Dock takeaway, catering and meeting rooms. Waze destination pin; actual tenancy frontage and doorway are UNVERIFIED.'}));
  return extra;
}

// Arrival: the Royal Hotel's footpath on Dandaloo Street (search "Narromine" lands here).
const royal = PLACES.find((p) => p.name === 'Royal Hotel');
// Arrive on the Dandaloo Street centreline nearest the Royal Hotel, facing north along the street. The
// centreline is kept free of colliders (tests/narromine-roads-drivable-browser.mjs); the old offset from
// the hotel's map pin ended up inside the detailed hotel model.
export const ARRIVAL = Object.freeze((() => {
  const target = royal ? [royal.x, royal.z] : [OFFSET.x - 1900, OFFSET.z - 600];
  let best = null;
  for (const st of STREETS) if (st.name === 'Dandaloo Street') for (let i = 1; i < st.pts.length; i++) {
    const [a, b] = [st.pts[i - 1], st.pts[i]], dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((target[0] - a[0]) * dx + (target[1] - a[1]) * dz) / l)), x = a[0] + t * dx, z = a[1] + t * dz, d = Math.hypot(x - target[0], z - target[1]);
    if (!best || d < best.d) best = { d, x, z };
  }
  return best ? { x: best.x, z: best.z, yaw: 0 } : { x: target[0], z: target[1], yaw: 0 };
})());

// Invisible fences: the highway corridor and Narromine's region, open only where the road runs.
export function boundaryColliders() {
  const t = 5, gap = CORRIDOR_HALF, z = HIGHWAY_Z, R = REGION;
  return [
    { x0: R.x1, x1: -1490, z0: z - gap - t, z1: z - gap }, { x0: R.x1, x1: -1490, z0: z + gap, z1: z + gap + t },
    { x0: R.x0 - t, x1: R.x0, z0: R.z0, z1: R.z1 },
    { x0: R.x0, x1: R.x1, z0: R.z0 - t, z1: R.z0 }, { x0: R.x0, x1: R.x1, z0: R.z1, z1: R.z1 + t },
    { x0: R.x1, x1: R.x1 + t, z0: R.z0, z1: z - gap }, { x0: R.x1, x1: R.x1 + t, z0: z + gap, z1: R.z1 },
  ];
}

// ── Stand-ins where the map has no outline (marked `generic`) ─────────────────────────────
// OpenStreetMap has every street but only some buildings: most houses and several shopfronts
// are unmapped. So that the town reads as the real one, the game adds:
//  • a shopfront at each named place that has no mapped outline, facing its nearest street;
//  • plain houses along residential streets, kept clear of mapped buildings, places, parks,
//    schools, sports grounds, water and other roads.
// These are placed from the map but are not surveyed; they are never named.
export function inPoly(x, z, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
const centre = (pts) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
const BUILDING_CENTRES = BUILDINGS.map((b) => ({ c: centre(b.pts), r: polyRect(b.pts), pts: b.pts }));
const nearMapped = (x, z, d) => BUILDING_CENTRES.some((b) => x > b.r.x0 - d && x < b.r.x1 + d && z > b.r.z0 - d && z < b.r.z1 + d);
const KEEP_CLEAR = new Set(['park', 'pitch', 'golf_course', 'cemetery', 'school', 'sports_centre', 'swimming_pool', 'track', 'parking', 'industrial', 'retail', 'farmyard']);
const inDetailed = (x, z) => DETAILED.some((d) => inPoly(x, z, d.boundary)) || NARROMINE_COURTHOUSE_CADASTRAL_LOTS.some((l) => inPoly(x, z, l.ringWorld)) || NARROMINE_AVIATION_CADASTRAL_LOTS.some((l) => inPoly(x, z, l.ringWorld)) || (x > -4606 && x < -4568 && z > -862 && z < -814);
const inArea = (x, z) => inDetailed(x, z) || AREAS.some((a) => KEEP_CLEAR.has(a.kind) && inPoly(x, z, a.pts)) || WATER.some((w) => w.closed && inPoly(x, z, w.pts));
export function nearestSegment(x, z) {
  let best = null;
  for (const s of STREETS) for (let i = 1; i < s.pts.length; i++) {
    const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l)), px = ax + t * dx, pz = az + t * dz, d = Math.hypot(x - px, z - pz);
    if (!best || d < best.d) best = { d, px, pz, s, angle: Math.atan2(dz, dx) };
  }
  return best;
}
// Box with centre, size along/across the street, rotation (yaw about y), and its world AABB.
const placed = [];
const SHOP_FOOTPRINTS = [];
const NW_DANDALOO_FILL = new Set(NARROMINE_NW_DANDALOO_INTEGRATION_SPEC.suppressedFillShopNames);
const footprint = (cx, cz, w, d, yaw) => { const c = Math.cos(yaw), s = Math.sin(yaw), hx = Math.abs(c) * w / 2 + Math.abs(s) * d / 2, hz = Math.abs(s) * w / 2 + Math.abs(c) * d / 2;
  // Corners of the rotated box (local x along (cos, -sin), local z along (sin, cos), as placeBox rotates).
  const poly = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [cx + a * c * w / 2 + b * s * d / 2, cz - a * s * w / 2 + b * c * d / 2]);
  return { x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz, poly }; };
const overlapsPlaced = (r) => placed.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.z0 < q.z1 && r.z1 > q.z0);
const clearOfStreets = (r) => { for (let x = r.x0; x <= r.x1; x += 2) for (let z = r.z0; z <= r.z1; z += 2) if (nearTownStreet(x, z, 1.5)) return false; return true; };
// Railway corridor: invented stand-in buildings keep at least 6 m from any mapped track centreline.
const RAIL_SEGMENTS = OSM.rail.flatMap((r) => r.pts.map(toWorld).slice(1).map((b, i, arr) => [i ? arr[i - 1] : toWorld(r.pts[0]), b]));
const nearRail = (x, z, m) => RAIL_SEGMENTS.some(([a, b]) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) < m; });
const clearOfRail = (r) => !(r.poly || [[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]]).some(([x, z]) => nearRail(x, z, 6)) && !nearRail((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 6);

// Street centreline samples every 2 m in an 8 m grid, so a footprint that a mapped road runs through
// (a carport over a driveway, or a small misalignment between the two sources) is left out and the
// road stays drivable.
const STREET_SAMPLES = (() => { const g = new Map(); for (const s of STREETS) for (let i = 1; i < s.pts.length; i++) {
  const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], n = Math.ceil(Math.hypot(bx - ax, bz - az) / 2);
  for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n, key = Math.floor(x / 8) + ',' + Math.floor(z / 8); if (!g.has(key)) g.set(key, []); g.get(key).push([x, z]); } } return g; })();
// Existing road probes use lateral ±1.6 m with a 1.12 m body radius.
// Street centreline points are sampled every <=2 m: include the extra <=1 m
// longitudinal uncertainty in the source-conflict envelope (3.1 m).
// We omit uncertain ML stand-in buildings where this narrow DRIVING envelope
// conflicts with mapped public streets. This does NOT establish absence of a
// building at its real-world location; it flags conflicting source geometry.
export const ROAD_LANE_SOURCE_CLEARANCE = 3.1;
const crossesStreet = (r) => { const margin = ROAD_LANE_SOURCE_CLEARANCE;
  for (let gx = Math.floor((r.x0 - margin) / 8); gx <= Math.floor((r.x1 + margin) / 8); gx++) for (let gz = Math.floor((r.z0 - margin) / 8); gz <= Math.floor((r.z1 + margin) / 8); gz++)
  for (const [x, z] of STREET_SAMPLES.get(gx + ',' + gz) || []) if (inPoly(x, z, r.poly) || r.poly.some((p, i) => { const q = r.poly[(i + 1) % r.poly.length], dx = q[0] - p[0], dz = q[1] - p[1], l = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / l)); return Math.hypot(x - p[0] - t * dx, z - p[1] - t * dz) < margin; })) return true; return false; };
const wallOnCarriageway = (r) => STREETS.some((s) => s.pts.some((q, i) => { if (!i) return false;
  const [ax, az] = s.pts[i - 1], [bx, bz] = q, n = Math.ceil(Math.hypot(bx - ax, bz - az) / 1);
  for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n;
    if (x < r.x0 - 12 || x > r.x1 + 12 || z < r.z0 - 12 || z > r.z1 + 12) continue;
    if (inPoly(x, z, r.poly) || r.poly.some((p, j) => { const o = r.poly[(j + 1) % r.poly.length], dx = o[0] - p[0], dz = o[1] - p[1], l = dx * dx + dz * dz || 1,
      t = Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / l)); return Math.hypot(x - p[0] - t * dx, z - p[1] - t * dz) < s.width / 2 + 0.25; })) return true; }
  return false; }));
export const FILL_SHOPS = Object.freeze(PLACES.flatMap((p) => {
  if (DETAILED.some((d) => d.name === p.name) || BUILDING_CENTRES.some((b) => inPoly(p.x, p.z, b.pts)) || nearMapped(p.x, p.z, 4) || inArea(p.x, p.z)) return [];
  const n = nearestSegment(p.x, p.z); if (!n || n.d > 45) return [];
  // Front on the property line: half the road, a 3 m footpath, then the shop 14 deep behind it.
  const nx = (p.x - n.px) / (n.d || 1), nz = (p.z - n.pz) / (n.d || 1), set = n.s.width / 2 + 3 + 7;
  const cx = n.px + nx * set, cz = n.pz + nz * set, yaw = -n.angle, r = footprint(cx, cz, 10, 14, yaw);
  if (overlapsPlaced(r) || !clearOfStreets(r) || !clearOfRail(r)) return [];
  // A place that sits inside a traced building footprint is that building: draw its real outline and
  // height instead of the 10 x 14 m stand-in (which also hid the outline from FILL_HOUSES). The named
  // place corroborates the outline, so a service lane beside it is fine, but not a road on or inside it.
  // Places drawn by the NW Dandaloo block keep the stand-in, which that module replaces.
  const fp = !NW_DANDALOO_FILL.has(p.name) && NARROMINE_FOOTPRINTS.find(([x, z, w, d, fy]) => inPoly(p.x, p.z, footprint(x, z, w, d, fy).poly));
  const fr = fp && footprint(fp[0], fp[1], fp[2], fp[3], fp[4]);
  if (fr && !overlapsPlaced(fr) && clearOfRail(fr) && !wallOnCarriageway(fr)) {
    // Kept out of the box list: FILL_HOUSES skips by exact outline, so neighbours are not lost to its bounding box.
    SHOP_FOOTPRINTS.push(fr.poly);
    const [x, z, w, d, fy, h] = fp;
    // Shop front: the outline edge whose midpoint is closest to a mapped street.
    let front = null;
    for (let i = 0; i < 4; i++) { const a = fr.poly[i], b = fr.poly[(i + 1) % 4], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], s = nearestSegment(m[0], m[1]);
      if (s && (!front || s.d < front.d)) front = { a, b, d: s.d, toward: [s.px - m[0], s.pz - m[1]] }; }
    const lidar = NARROMINE_FOOTPRINT_LIDAR[x.toFixed(1) + ',' + z.toFixed(1)] || null;
    return [Object.freeze({ generic: false, source: 'microsoft-footprint', name: p.name, kind: p.kind, x, z, w, d, yaw: fy, h, lidar,
      frontEdge: Object.freeze({ a: front.a, b: front.b, toward: front.toward }), rect: Object.freeze(fr) })];
  }
  placed.push(r);
  return [Object.freeze({ generic: true, name: p.name, kind: p.kind, x: cx, z: cz, w: 10, d: 14, yaw, front: Object.freeze([n.px + nx * (n.s.width / 2 + 1.5), n.pz + nz * (n.s.width / 2 + 1.5)]), rect: Object.freeze(r) })];
}));

// Every other building in town, from real traced footprints (Microsoft Global ML Building
// Footprints, ODbL; tools/narromine-footprints.mjs). These replace the invented stand-in houses that
// used to be generated along residential streets. Outlines already drawn from OSM or a detailed
// landmark site are skipped so nothing is doubled. Name kept for existing callers.
const FOOTPRINT_ROAD_OMISSIONS = [];
export const FILL_HOUSES = Object.freeze(NARROMINE_FOOTPRINTS.flatMap(([x, z, w, d, yaw, h]) => {
  if (x < REGION.x0 + 5 || x > REGION.x1 - 5 || z < REGION.z0 + 5 || z > REGION.z1 - 5) return [];
  const r = footprint(x, z, w, d, yaw);
  // Already modelled: centre inside a mapped OSM outline or detailed site, or a mapped outline's centre inside this one.
  if (BUILDING_CENTRES.some((b) => inPoly(x, z, b.pts) || inPoly(b.c[0], b.c[1], r.poly)) || inDetailed(x, z) || overlapsPlaced(r)) return [];
  if (SHOP_FOOTPRINTS.some((q) => inPoly(x, z, q))) return [];   // drawn as a named place
  if (!clearOfRail(r)) return [];
  if (crossesStreet(r)) {
    FOOTPRINT_ROAD_OMISSIONS.push(Object.freeze({ x, z, w, d, yaw,
      source: 'Microsoft Global ML Building Footprints', reason: 'mapped-road-driving-envelope-source-conflict' }));
    return [];
  }
  const lidar = NARROMINE_FOOTPRINT_LIDAR[x.toFixed(1) + ',' + z.toFixed(1)] || null;
  return [Object.freeze({ generic: false, source: 'footprint', x, z, w, d, yaw, h, lidar, rect: Object.freeze(r), tone: (Math.abs(Math.round(x * 7 + z * 13)) % 5) })];
}));

// Source-conflict omissions are audit candidates, not proof of actual vacant land.
export const FOOTPRINT_ROAD_CONFLICTS = Object.freeze(FOOTPRINT_ROAD_OMISSIONS);

// Main-street frontages of mapped buildings: the outline edge facing a through street within
// 14 m gets a veranda; a named place inside the outline names it. Map-derived, not surveyed.
export const FRONTAGES = Object.freeze(BUILDINGS.flatMap((b, bi) => {
  let best = null;
  for (let i = 0; i < b.pts.length; i++) {
    const [ax, az] = b.pts[i], [bx, bz] = b.pts[(i + 1) % b.pts.length], len = Math.hypot(bx - ax, bz - az);
    if (len < 5) continue;
    const n = nearestSegment((ax + bx) / 2, (az + bz) / 2);
    if (!n || n.d > 14 || !/^(trunk|primary|secondary|tertiary)$/.test(n.s.kind)) continue;
    // The edge must run roughly along the street.
    const along = Math.abs(Math.cos(Math.atan2(bz - az, bx - ax) - n.angle));
    if (along < 0.85) continue;
    if (!best || n.d < best.d) best = { a: [ax, az], b: [bx, bz], d: n.d, street: n.s.name, toward: [n.px - (ax + bx) / 2, n.pz - (az + bz) / 2] };
  }
  if (!best) return [];
  const named = PLACES.find((p) => inPoly(p.x, p.z, b.pts));
  return [Object.freeze({ building: bi, ...best, name: named?.name || '' })];
}));
