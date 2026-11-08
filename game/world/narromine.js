// Draws the Mitchell Highway west from Repository Town and the real town of Narromine at its end
// (data: narromine-layout.js / narromine-osm-data.js, map data © OpenStreetMap contributors).
// Everything is merged per colour into a few meshes. The highway corridor is always drawn; the
// town is drawn only once the player has driven out west (update()), so it costs almost nothing
// while you are in Repository Town.
import * as THREE from 'three';
import { buildKieraths } from './narromine-kieraths.js';
import { roofLetteringSurface } from './narromine-roof-lettering.js';
import { buildNarromineHotel, NARROMINE_HOTEL_ID, hotelForecourtPolygon } from './narromine-hotel.js';
import { buildNarromineRoyalHotel, ROYAL_HOTEL_REPLACED_IDS } from './narromine-royal-hotel.js';
import { buildNarromineRailwayPrecinct } from './narromine-railway-precinct.js';
import { NARROMINE_TREES } from './narromine-trees-data.js';
import { createLiDARTreeForest } from './tree-models.js';
import { buildNarromineFurniture } from './narromine-furniture.js';
import { buildNarromineLotLines } from './narromine-lot-lines.js';
import { buildNarromineMapillaryObjects } from './narromine-mapillary-objects.js';
import { NARROMINE_FURNITURE } from './narromine-furniture-data.js';
import { NARROMINE_RAILWAY_INTEGRATION_SPEC } from './narromine-railway-evidence.js';
import { buildNarromineCourthousePrecinct } from './narromine-courthouse-precinct.js';
import { buildNarromineStAugustines, ST_AUGUSTINES_OSM_INDEX } from './narromine-st-augustines.js';
import { NARROMINE_COURTHOUSE_INTEGRATION_SPEC } from './narromine-courthouse-evidence.js';
import { buildNarromineAviationPrecinct } from './narromine-aviation-precinct.js';
import { buildNarromineAirfield } from './narromine-airfield.js';
import { buildFlightLandscape } from './narromine-flight-landscape.js';
import { NARROMINE_AVIATION_INTEGRATION_SPEC } from './narromine-aviation-evidence.js';
import { buildNarromineNwDandalooBlock } from './narromine-nw-dandaloo-block.js';
import { NARROMINE_NW_DANDALOO_INTEGRATION_SPEC } from './narromine-nw-dandaloo-evidence.js';
const RAILWAY_SUPPRESSED_OSM = new Set([
  ...NARROMINE_RAILWAY_INTEGRATION_SPEC.suppressedOsmBuildingIndices,
  ...NARROMINE_COURTHOUSE_INTEGRATION_SPEC.suppressedOsmBuildingIndices,
  ST_AUGUSTINES_OSM_INDEX, // replace only the generic St Augustine's church extrusion
  ...NARROMINE_AVIATION_INTEGRATION_SPEC.suppressedOsmBuildingIndices,
  ...NARROMINE_NW_DANDALOO_INTEGRATION_SPEC.suppressedOsmBuildingIndices,
]);
const NW_DANDALOO_SUPPRESSED_FILL = new Set(NARROMINE_NW_DANDALOO_INTEGRATION_SPEC.suppressedFillShopNames);
import { estimatedShopfrontProfile, facadeBays, landmarkFacadeSpec } from './narromine-facade-profiles.js';
import { PHYSIO_FACADE, buildNarrominePhysiotherapyFacade } from './narromine-mainstreet-physio.js';
import { buildDisjointRoadSurfaces, kerbReturns } from './narromine-road-surfaces.js';
import { clipFootpathsOutsideForecourt } from './narromine-forecourt-footpaths.js';
import { shouldRenderMappedPaint } from './narromine-road-paint-guards.js';
import { createNarromineSurfaceMaterial } from './narromine-surface-materials.js';
import { buildDandalooStreetscape } from './narromine-dandaloo-streetscape.js';
import { rotatedBoxCollider } from './narromine-collision-footprints.js';
import { NARROMINE_ROOF_COLOURS } from './narromine-roof-colours-data.js';
import { NARROMINE_ROOF_FORMS } from './narromine-roof-forms-data.js';
import { NARROMINE_POST_OFFICE_ENTRANCE, NARROMINE_POST_OFFICE_ID } from './narromine-post-office.js';
import { buildNarrominePostOfficeRoof, isPostOfficeRoofPart, POST_OFFICE_EAVE_H } from './narromine-post-office-roof.js';
import { HIGHWAY, HIGHWAY_Z, REGION, CORRIDOR_HALF, STREETS, BUILDINGS, AREAS, WATER, RAIL, PLACES, FILL_SHOPS, FILL_HOUSES, FRONTAGES, DETAILED, polyRect, inPoly, nearTownStreet, boundaryColliders } from './narromine-layout.js';

const SHOW_WEST_OF = -1300;   // past Repository Town's last houses (x ≈ -1330)

function boardTexture(lines, { bg = '#0b5a2d', fg = '#ffffff', w = 512, h = 256, border = '#ffffff' } = {}) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = border; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  const size = Math.floor((h - 40) / Math.max(lines.length, 1) * 0.62);
  lines.forEach((t, i) => { let s = size; g.font = `bold ${s}px Arial`; while (g.measureText(t).width > w - 40 && s > 12) g.font = `bold ${--s}px Arial`; g.fillText(t, w / 2, 20 + (i + 0.5) * (h - 40) / lines.length); });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
function speedTexture(n) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(14, 2, 100, 124); x.strokeStyle = '#000'; x.lineWidth = 3; x.strokeRect(14, 2, 100, 124);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.strokeStyle = '#c8102e'; x.lineWidth = 9; x.beginPath(); x.arc(64, 58, 36, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#000'; x.font = `bold ${n >= 100 ? 30 : 36}px Arial`; x.fillText(String(n), 64, 60); x.font = 'bold 14px Arial'; x.fillText('km/h', 64, 110);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const ROAD_COLOUR = { trunk: 0x45484b, primary: 0x46494c, secondary: 0x47494b, tertiary: 0x4a4c4e, unclassified: 0x4d4f50, residential: 0x4f5153, service: 0x5a5b5a, living_street: 0x55575a, track: 0x9b8566 };
const AREA_COLOUR = { park: 0x7fae64, pitch: 0x8cc06a, golf_course: 0x79ad5d, cemetery: 0x8a9a7a, school: 0xc7b88f, industrial: 0xa49c90, retail: 0xb9ada0, parking: 0x6a6b6c, sports_centre: 0x9fb8a6, swimming_pool: 0x5aa9d6, track: 0xb47a5a, farmyard: 0xb9a675, residential: null };
// OSM buildings tagged man_made=silo: the four round bins by the station yard (osm indices 20-23).
const SILO_CYLINDERS = new Set([20, 21, 22, 23]);
// OSM man_made=silo outlines 90-170 m across: open grain storage bunkers (osm 15, 16, 17), drawn as
// low tarped stacks at their LiDAR-measured height.
const GRAIN_BUNKERS = new Set([15, 16, 17]);
const BUILDING_STYLE = (b) => {
  // Measured LiDAR height (median roof height above ground) wins over tag- or kind-based guesses.
  const k = b.kind, base = b.lidar ? Math.max(2.4, b.lidar[4]) : b.levels ? b.levels * 3.4 : null;
  if (GRAIN_BUNKERS.has(b.osmIndex)) return [b.lidar ? Math.max(1.5, b.lidar[4]) : 4, 0x3b4239];
  if (k === 'hangar') return [base || 7.5, 0xb8bcbf];
  if (k === 'church') return [base || 8, 0xc2a07a];
  if (k === 'hospital') return [base || 6, 0xd9d4c8];
  if (k === 'fire_station') return [base || 6, 0xb5463a];
  if (k === 'shed' || k === 'roof') return [base || 4, 0x9da3a6];
  if (k === 'commercial' || /pub|hotel|bank|supermarket|post/.test(b.amenity) || b.name) return [base || 5.2, 0xcdb994];
  return [base || 4.2, 0xbfae92];
};

export function buildNarromine(parent, makeLabel = null) {
  const root = new THREE.Group(); root.name = 'Mitchell Highway and Narromine';
  const town = new THREE.Group(); town.name = 'Narromine town (OpenStreetMap)'; root.add(town);
  const buckets = { road: new Map(), town: new Map() }; let bucket = buckets.road, target = root;
  // Town geometry is grouped by colour AND 300 m tile, so each tile's mesh can be skipped when it
  // is off-screen or beyond the fog (one huge mesh would always be drawn).
  const TILE = 300;
  const push = (c, g) => {
    let k = c;
    if (bucket === buckets.town) { g.computeBoundingBox(); const b = g.boundingBox; k = c + '|' + Math.floor((b.min.x + b.max.x) / 2 / TILE) + ',' + Math.floor((b.min.z + b.max.z) / 2 / TILE); }
    if (!bucket.has(k)) bucket.set(k, []); bucket.get(k).push(g);
  };
  const box = (c, w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); push(c, g); };
  // A flat strip along a segment (a road, footpath, river or rail piece); pieces overlap at joints.
  const strip = (c, ax, az, bx, bz, width, y, h = 0.03) => {
    const len = Math.hypot(bx - ax, bz - az); if (len < 0.05) return;
    box(c, len + width * 0.5, h, width, (ax + bx) / 2, y, (az + bz) / 2, -Math.atan2(bz - az, bx - ax));
  };
  const flatPoly = (c, pts, y) => {
    const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(shape); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); push(c, g);
  };
  const plane = (tex, w, h, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), tex ? new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.3 }) : new THREE.MeshLambertMaterial({ color: 0x0b5a2d }));
    m.position.set(x, y, z); m.rotation.y = ry; target.add(m); return m;
  };
  const z = HIGHWAY_Z, L = HIGHWAY.x1 - HIGHWAY.x0, cx = (HIGHWAY.x0 + HIGHWAY.x1) / 2;

  // ── The drive (always drawn) ────────────────────────────────────────────
  box(0x8fa86a, L, 0.1, CORRIDOR_HALF * 2 + 20, cx, -0.12, z);
  box(0x4a4d50, L, 0.03, HIGHWAY.width, cx, 0.06, z);   // sits just above Repository Town's ground layers
  for (let x = HIGHWAY.x0 + 6; x < HIGHWAY.x1 - 4; x += 12) box(0xf0ead2, 4, 0.035, 0.14, x, 0.08, z);
  for (const s of [-1, 1]) box(0xf0ead2, L, 0.034, 0.12, cx, 0.08, z + s * (HIGHWAY.width / 2 - 0.3));
  for (let x = HIGHWAY.x0 + 20; x < -1350; x += 50) for (const s of [-1, 1]) { box(0xeeeeee, 0.12, 1.0, 0.12, x, 0.5, z + s * 6.2); box(s < 0 ? 0xd23a2a : 0xe8e8e8, 0.13, 0.12, 0.13, x, 0.9, z + s * 6.2); }
  const crops = [0xc9b25d, 0x6f9a52, 0xa98e62, 0xd3bd6c, 0x7ea35a];
  for (let x = HIGHWAY.x0 + 40, i = 0; x < -1360; x += 120, i++) for (const s of [-1, 1]) {
    const c = crops[(i + (s > 0 ? 2 : 0)) % crops.length];
    box(c, 112, 0.05, CORRIDOR_HALF - 12, x + 56, -0.05, z + s * (CORRIDOR_HALF / 2 + 6));
    if (c === 0x6f9a52) for (let k = 0; k < 24; k++) box(0xf4f2ea, 0.5, 0.4, 0.5, x + 6 + (k * 37) % 104, 0.25, z + s * (14 + (k * 13) % 26));
  }
  for (const s of [-1, 1]) { box(0x8a8a8a, L - 30, 0.04, 0.04, cx, 1.0, z + s * 11); for (let x = HIGHWAY.x0 + 10; x < -1350; x += 8) box(0x6b5236, 0.1, 1.2, 0.1, x, 0.6, z + s * 11); }
  for (let x = HIGHWAY.x0 + 30, i = 0; x < -1360; x += 26 + (i * 7) % 15, i++) {
    const tz = z - 36 - (i * 5) % 7, h = 9 + (i % 4) * 1.5;
    box(0xd9d2c4, 0.6, h, 0.6, x, h / 2, tz);
    box(0x5f7d4a, 6 + (i % 3), 4, 6 + (i % 2), x, h + 1, tz); box(0x6d8a55, 4, 3, 4, x + 1.5, h - 1, tz + 1);
  }
  for (let x = HIGHWAY.x0 + 300; x < -1500; x += 520) {
    box(0x9aa4aa, 60, 0.3, 0.3, x, 3.2, z + 30, 0.35);
    for (let k = -2; k <= 2; k++) { const px = x + k * 13 * Math.cos(0.35), pz = z + 30 - k * 13 * Math.sin(0.35); box(0x7f8a90, 0.25, 3.2, 0.25, px, 1.6, pz); box(0x33363a, 0.9, 0.9, 0.3, px, 0.45, pz); }
  }
  box(0x8c7f72, L, 0.25, 3.2, cx, 0.05, z + 22);
  for (const s of [-1, 1]) box(0x6d6a66, L, 0.14, 0.08, cx, 0.3, z + 22 + s * 0.72);
  for (let x = HIGHWAY.x0; x < -1350; x += 3) box(0x5b4632, 0.25, 0.1, 2.4, x, 0.22, z + 22);
  // Signs (Australia drives on the left: westbound drivers' left is +z).
  const pole = (x, zz, h = 2.6) => box(0x8a8f94, 0.08, h, 0.08, x, h / 2, zz);
  const W = Math.PI / 2, Eb = -Math.PI / 2;   // faces seen by westbound / eastbound drivers
  pole(-420, z + 7); plane(speedTexture(100), 0.8, 0.8, -420, 2.45, z + 7, W);
  pole(-470, z + 8, 3.4); pole(-470, z + 11, 3.4);
  plane(boardTexture(['Mitchell Highway  A32', 'Narromine  40 km', '(real distance)']), 4.4, 2.2, -470, 3.1, z + 9.5, W);
  pole(-2700, z + 9, 3); pole(-2700, z + 13, 3);
  plane(boardTexture(['Welcome to', 'NARROMINE'], { bg: '#1e4f86' }), 5, 2.4, -2700, 2.9, z + 11, W);
  pole(-2660, z - 9, 3.4); pole(-2660, z - 12, 3.4);
  plane(boardTexture(['Dubbo  40 km', 'Repository Town']), 4.4, 2.2, -2660, 3.1, z - 10.5, Eb);

  // ── The town (drawn only out west) ──────────────────────────────────────
  bucket = buckets.town; target = town;
  box(0xa3b07a, REGION.x1 - REGION.x0, 0.1, REGION.z1 - REGION.z0, (REGION.x0 + REGION.x1) / 2, -0.12, (REGION.z0 + REGION.z1) / 2);
  for (const a of AREAS) { const c = AREA_COLOUR[a.kind]; if (c) flatPoly(c, a.pts, a.kind === 'swimming_pool' ? 0.02 : 0.004); }
  for (const w of WATER) {
    if (w.closed) flatPoly(0x4f88a8, w.pts, 0.01);
    else for (let i = 1; i < w.pts.length; i++) strip(w.kind === 'river' ? 0x4f88a8 : 0x5c94b0, ...w.pts[i - 1], ...w.pts[i], w.kind === 'river' ? 40 : 5, 0.008, 0.02);
  }
  // Ballast bed only; sleepers and steel rails are built by narromine-trains.js on the same mapped lines.
  for (const r of RAIL) for (let i = 1; i < r.pts.length; i++) strip(0x8c7f72, ...r.pts[i - 1], ...r.pts[i], 3.2, 0.05, 0.25);
  // The old overlapping strips had coplanar top faces at every intersection
  // and bend; their full-width footpath slabs also intersected the asphalt.
  // Split the mapped ribbons into disjoint polygons before THREE triangulation.
  // This also cuts out the always-visible highway at the Narromine town seam.
  // OSM surface tags: a street that runs along an OSM unpaved way is drawn as a gravel track (no kerb,
  // no generated footpath).
  const nearLine = (lines, x, z, m) => lines.some(pts => pts.some((b, i) => { if (!i) return false; const a = pts[i - 1], dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) < m; }));
  // Split each street into runs of segments that are wholly paved or wholly unpaved (by segment midpoint).
  const SURFACE_STREETS = STREETS.flatMap(st => {
    const runs = []; let cur = null;
    for (let i = 1; i < st.pts.length; i++) {
      const [a, b] = [st.pts[i - 1], st.pts[i]], unpaved = nearLine(NARROMINE_FURNITURE.unpaved, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 3);
      if (!cur || cur.unpaved !== unpaved) { cur = { unpaved, pts: [a] }; runs.push(cur); }
      cur.pts.push(b);
    }
    return runs.map(r => ({ ...st, kind: r.unpaved ? 'track' : st.kind, pts: r.pts }));
  });
  // Footpaths: concrete footpaths belong to the main roads and the town-centre streets; Narromine's
  // residential streets mostly have grass or gravel verges (OSM maps almost no sidewalks here, so this is
  // the honest default rather than a footpath on both sides of every street).
  const TOWN_CENTRE = [-4790, -800], TOWN_CENTRE_RADIUS = 450;
  for (const st of SURFACE_STREETS) {
    const main = /^(trunk|primary|secondary)$/.test(st.kind);
    const central = st.pts.some(([x, z]) => Math.hypot(x - TOWN_CENTRE[0], z - TOWN_CENTRE[1]) < TOWN_CENTRE_RADIUS);
    if (!main && !central) st.footpath = false;
  }
  // Owner's photo (Mapillary, west along Derribong Avenue from the hotel): red brick-paved footpath on the
  // north side only, gravel verge on the south. Its points run east, so north is on the left.
  for (const st of SURFACE_STREETS) if (st.name === 'Derribong Avenue' && st.pts.some(([x, z]) => Math.hypot(x - TOWN_CENTRE[0], z - TOWN_CENTRE[1]) < TOWN_CENTRE_RADIUS)) {
    const eastward = st.pts.at(-1)[0] > st.pts[0][0]; st.footpathSide = eastward ? 'left' : 'right'; st.paving = 'red-brick';
  }
  const roadSurfaces = buildDisjointRoadSurfaces(SURFACE_STREETS, { highway: HIGHWAY });
  // No generic footpath across a detailed site's own sealed ground (the Narromine Hotel forecourt is
  // one sealed apron out to the street centrelines, as in the owner's Mapillary comparison).
  const HOTEL_FORECOURT = hotelForecourtPolygon();
  for (const s of clipFootpathsOutsideForecourt(roadSurfaces.footpaths, HOTEL_FORECOURT))
    flatPoly(s.paving === 'red-brick' ? 0xa4563f : 0xbdb6a8, s.pts, 0.076);
  for (const s of roadSurfaces.asphalt) flatPoly(ROAD_COLOUR[s.kind] ?? 0x4f5153, s.pts, 0.075);
  // Curved kerb returns at junctions, 3 mm under the carriageway so overlaps never flicker.
  for (const s of roadSurfaces.fillets) flatPoly(ROAD_COLOUR[s.kind] ?? 0x4f5153, s.pts, 0.072);
  // OSM-mapped footways and paths: concrete where sealed, gravel where unpaved; zebra-white at crossings.
  for (const f of NARROMINE_FURNITURE.footways || []) {
    const colour = f.kind === 'crossing' ? 0xe9e7df : f.surface === 'unpaved' ? 0xb19c80 : 0xbdb6a8, wdt = f.kind === 'cycleway' ? 2.5 : f.kind === 'crossing' ? 2.4 : 1.6;
    for (let i = 1; i < f.pts.length; i++) strip(colour, ...f.pts[i - 1], ...f.pts[i], wdt, f.kind === 'crossing' ? 0.079 : 0.077, 0.004);
  }
  // Main-road line marking as on the real A32 through town (owner's Mapillary comparison at the hotel):
  // solid white edge lines inside each kerb, and a broken centre line on two-way main roads. Lines break
  // where another street joins, so side streets stay open. Positions are approximate (OSM gives the
  // centreline and width, not the paint).
  {
    const MAIN = /^(trunk|primary|secondary)$/, others = STREETS.filter(s => s.pts.length > 1);
    const nearOtherStreet = (st, x, z) => others.some(o => o !== st && o.name !== st.name && o.pts.some((b, i) => { if (!i) return false; const a = o.pts[i - 1], dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) < (o.width || 7) / 2 + 2.5; }));
    // The edge line turns the corner with the kerb: follow each curved kerb return on a main road,
    // 0.6 m in from the kerb, as in the owner's photo at the hotel corner.
    const arcs = []; kerbReturns(SURFACE_STREETS, undefined, arcs);
    for (const { O, r, a1, da, kinds } of arcs) {
      if (!kinds.some(k => MAIN.test(k))) continue;
      const R = r + 0.6, steps = Math.max(4, Math.ceil(Math.abs(da) * R / 1.2));
      for (let k = 0; k < steps; k++) {
        const t0 = a1 + da * k / steps, t1 = a1 + da * (k + 1) / steps;
        const p0 = [O[0] + Math.cos(t0) * R, O[1] + Math.sin(t0) * R], p1 = [O[0] + Math.cos(t1) * R, O[1] + Math.sin(t1) * R];
        box(0xf4f2ea, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.05, 0.01, 0.12, (p0[0] + p1[0]) / 2, 0.081, (p0[1] + p1[1]) / 2, -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
      }
    }
    for (const st of STREETS) {
      if (!MAIN.test(st.kind)) continue;
      const centre = st.kind !== 'trunk' && !nearLine(NARROMINE_FURNITURE.laned, st.pts[0][0], st.pts[0][1], 3);   // trunk ways here are one-way carriageways
      for (let i = 1; i < st.pts.length; i++) {
        const [ax, az] = st.pts[i - 1], [bx, bz] = st.pts[i], len = Math.hypot(bx - ax, bz - az); if (len < 1) continue;
        const ux = (bx - ax) / len, uz = (bz - az) / len, nx = -uz, nz = ux, yaw = -Math.atan2(bz - az, bx - ax), edge = st.width / 2 - 0.6;
        for (let d = 0; d + 3 <= len; d += 3) {
          const mx = ax + ux * (d + 1.5), mz = az + uz * (d + 1.5);
          if (nearOtherStreet(st, mx, mz)) continue;
          for (const side of [-1, 1]) box(0xf4f2ea, 3, 0.01, 0.12, mx + nx * edge * side, 0.081, mz + nz * edge * side, yaw);
          if (centre && Math.floor(d / 3) % 4 === 0) box(0xf4f2ea, 3, 0.01, 0.1, mx, 0.081, mz, yaw);
        }
      }
    }
  }
  // Broken centre line (3 m line, 9 m gap, the Australian standard) only on ways OSM tags with 2+ lanes.
  for (const pts of NARROMINE_FURNITURE.laned) {
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
      const ux = (bx - ax) / len, uz = (bz - az) / len, yaw = -Math.atan2(bz - az, bx - ax);
      for (let d = carry; d + 3 <= len; d += 12) {
        const mx = ax + ux * (d + 1.5), mz = az + uz * (d + 1.5);
        if (shouldRenderMappedPaint(mx, mz, REGION)) box(0xf2f0e6, 3, 0.01, 0.1, mx, 0.082, mz, yaw);
      }
      carry = (carry - len) % 12; if (carry < 0) carry += 12;
    }
  }
  // OSM-aligned Dandaloo streetscape: no duplicate road or building geometry.
  // Verge items must not sit inside buildings, detailed lots or other roads/driveways.
  const streetscapeClear = (x, z, r, mode) => mode === 'kerb' ? !inPoly(x, z, hotelForecourtPolygon()) : !DETAILED.some((d) => inPoly(x, z, d.boundary)) &&
    !BUILDINGS.some((b) => { const q = polyRect(b.pts); return x > q.x0 - r && x < q.x1 + r && z > q.z0 - r && z < q.z1 + r; }) &&
    ![...FILL_SHOPS, ...FILL_HOUSES].some((g) => Math.hypot(g.x - x, g.z - z) < 7 + r) &&
    !STREETS.some((st) => st.name !== 'Dandaloo Street' && st.pts.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < st.width / 2 + r + 1));
  buildDandalooStreetscape({ streets: STREETS, push, box, flatPoly, strip, clear: streetscapeClear });
  // Real buildings, raised from their mapped outlines.
  const colliders = [...boundaryColliders()], spots = [];
  for (const b of BUILDINGS) {
    if (RAILWAY_SUPPRESSED_OSM.has(b.osmIndex)) continue;
    if (Math.abs(b.pts[0][0] - (-4813.8)) < 0.5 && Math.abs(b.pts[0][1] - (-734.3)) < 0.5) continue;
    // Grain silos mapped in OSM (man_made=silo, ways 451700972-75): round concrete bins drawn as
    // cylinders from their outline, wall to the LiDAR eave and a conical cap to the LiDAR ridge.
    if (SILO_CYLINDERS.has(b.osmIndex) && b.lidar) {
      const cx = b.pts.reduce((s, p) => s + p[0], 0) / b.pts.length, cz = b.pts.reduce((s, p) => s + p[1], 0) / b.pts.length;
      const r = b.pts.reduce((s, p) => s + Math.hypot(p[0] - cx, p[1] - cz), 0) / b.pts.length, eave = b.lidar[2], ridge = b.lidar[3];
      const wall = new THREE.CylinderGeometry(r, r, eave, 24); wall.translate(cx, eave / 2, cz); push(0xcfc9bd, wall);
      const cap = new THREE.ConeGeometry(r * 1.02, Math.max(0.3, ridge - eave), 24); cap.translate(cx, eave + Math.max(0.3, ridge - eave) / 2, cz); push(0xb9b4aa, cap);
      colliders.push({ ...polyRect(b.pts), top: Math.max(eave, ridge), source: 'osm-silo' });
      continue;
    }
    const [h, standardColour] = BUILDING_STYLE(b);
    // OSM:186 is a photographed white-render physiotherapy facade, not generic tan.
    const colour = b.osmIndex === PHYSIO_FACADE.osmIndex ? 0xf0eee9 : standardColour;
    const shape = new THREE.Shape(b.pts.map(([x, zz]) => new THREE.Vector2(x, -zz)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); push(colour, g);
    // Collide with the outline's box, unless the outline is very irregular or the box covers a street.
    const r = polyRect(b.pts), area = Math.abs(b.pts.reduce((s, p, i) => { const q = b.pts[(i + 1) % b.pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
    if (area > 0.55 * (r.x1 - r.x0) * (r.z1 - r.z0) && !nearTownStreet((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 0)) colliders.push({ ...r, poly: b.pts, top: h, source: 'osm-building', osmIndex: b.osmIndex });
  }
  // Stand-ins for unmapped named places: still ESTIMATED rectangles, never survey footprints.
  // Reusable facade elements remain batched by material/tile and have NO new collision boxes.
  const roofGeo = () => { const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); g.rotateY(Math.PI / 4); return g; };
  const placeBox = (c, w, h, d, cx, y, cz, yaw) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateY(yaw); g.translate(cx, y, cz); push(c, g); };
  const storefront = ({ a, b, toward, name = '', profile, wallHeight = 4.6 }) => {
    const [ax, az] = a, [bx, bz] = b, dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
    if (len < 2.4) return;
    const n = Math.hypot(...toward) || 1, nx = toward[0] / n, nz = toward[1] / n;
    const yaw = -Math.atan2(dz, dx), height = Math.max(3.7, wallHeight);
    const at = (t, out = 0.12) => [ax + dx * t + nx * out, az + dz * t + nz * out];
    const facade = at(0.5, 0.10);
    // Wall surface, pilasters, window lintel, fascia and a thin roof-edge coping.
    placeBox(profile.wall, len - 0.04, 2.95, 0.07, ...[facade[0], 1.50, facade[1], yaw]);
    placeBox(profile.trim, len, 0.18, 0.13, ...[facade[0], 3.02, facade[1], yaw]);
    placeBox(profile.trim, len, 0.48, 0.12, ...[facade[0], 3.53, facade[1], yaw]);
    const coping = at(0.5, 0.10);
    placeBox(profile.roofEdge, len + 0.12, 0.13, 0.2, coping[0], height - 0.1, coping[1], yaw);
    for (const t of [0.005, 0.995]) {
      const [x, z] = at(t, 0.18);
      placeBox(profile.pier, 0.2, 3.02, 0.13, x, 1.5, z, yaw);
    }
    const bays = facadeBays(len);
    for (const bay of bays) {
      const [x, z] = at(bay.t, 0.19), w = bay.width, y0 = 0.75, h = 1.95;
      placeBox(profile.frame, w + 0.17, h + 0.18, 0.09, x, y0 + h / 2, z, yaw);
      const glassAt = at(bay.t, 0.255);
      if (bay.door) {
        // Door is visual only; no fabricated walk-in entrance or collider.
        placeBox(profile.door, Math.min(1.12, w - 0.1), 2.45, 0.06, glassAt[0], 1.28, glassAt[1], yaw);
        placeBox(profile.glass, Math.min(0.88, w - 0.2), 1.14, 0.04, glassAt[0], 1.81, glassAt[1] + 0, yaw);
        const handleAt = at(bay.t + 0.015, 0.30);
        placeBox(profile.handle, 0.05, 0.31, 0.05, handleAt[0], 1.20, handleAt[1], yaw);
      } else {
        placeBox(profile.glass, w, h, 0.05, glassAt[0], y0 + h / 2, glassAt[1], yaw);
        placeBox(profile.frame, 0.07, h, 0.08, glassAt[0], y0 + h / 2, glassAt[1], yaw);
        placeBox(profile.frame, w, 0.06, 0.08, glassAt[0], 1.55, glassAt[1], yaw);
        placeBox(profile.trim, w + 0.11, 0.12, 0.15, glassAt[0], y0 - 0.03, glassAt[1], yaw);
      }
    }
    // Names come from OSM and can be historic; no inferred brand logos or current-tenancy claims.
    if (name && typeof document !== 'undefined') {
      const tex = boardTexture([name.toUpperCase()], { bg: '#e8e2d6', fg: '#33312d', border: '#59534c', w: 1024, h: 160 });
      const [x, z] = at(0.5, 0.28);
      plane(tex, Math.min(len - 0.6, 10), 0.37, x, 3.52, z, Math.atan2(nx, nz));
    }
  };
  const HOUSE_WALLS = [0xd8cdb6, 0xc9a98a, 0xbfc4bd, 0xd6c9a4, 0xa98a74], HOUSE_ROOFS = [0x6e3b32, 0x5a5f66, 0x8a8f8c, 0x7a4a3a, 0x4f5a52];
  // Wall and roof heights for a traced footprint: LiDAR eave/ridge when measured, else the dataset's estimate.
  const footprintHeights = (h) => {
    const wall = h.lidar ? Math.max(2.2, h.lidar[1]) : h.h > 0 ? Math.min(10, Math.max(2.4, h.h * 0.62)) : 3.0;
    return { wall, roofH: h.lidar ? Math.max(0.25, h.lidar[2] - wall) : h.h > 0 ? Math.min(5, Math.max(0.5, h.h - wall)) : 2.2 };
  };
  const NOT_SHOPFRONT = new Set(['place_of_worship', 'guest_house']);
  const roofColour = (h, fallback) => NARROMINE_ROOF_COLOURS[h.x.toFixed(1) + ',' + h.z.toFixed(1)] ?? fallback;
  // ── Detailed buildings (traced quads from NSW aerial imagery; see narromine-buildings-data.js) ──
  // Each part is an oriented quad: walls are a box along its first edge, roofs are built in that frame.
  const frame = (pts) => { const [a, b, , d] = pts, L = Math.hypot(b[0] - a[0], b[1] - a[1]), Wd = Math.hypot(d[0] - a[0], d[1] - a[1]);
    const cx = pts.reduce((s, p) => s + p[0], 0) / 4, cz = pts.reduce((s, p) => s + p[1], 0) / 4; return { L, W: Wd, cx, cz, yaw: -Math.atan2(b[1] - a[1], b[0] - a[0]) }; };
  const hipRoof = (c, pts, wallH, pitch = 0.42) => {
    const { L, W: w2, cx, cz, yaw } = frame(pts), alongX = L >= w2, half = Math.min(L, w2) / 2, h = half * Math.tan(pitch);
    const x0 = -L / 2, x1 = L / 2, z0 = -w2 / 2, z1 = w2 / 2, y0 = wallH, y1 = wallH + h;
    const ra = alongX ? [x0 + half, 0] : [0, z0 + half], rb = alongX ? [x1 - half, 0] : [0, z1 - half];
    const A = [x0, y0, z0], B = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1], P = [ra[0], y1, ra[1]], Q = [rb[0], y1, rb[1]];
    const tris = alongX ? [A, P, Q, A, Q, B, B, Q, C, C, Q, P, C, P, D, D, P, A] : [A, B, P, B, Q, P, B, C, Q, C, D, Q, D, P, Q, D, A, P];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3)); g.rotateY(yaw); g.translate(cx, 0, cz); g.computeVertexNormals(); push(c, g);
    // Thin metal ridge flashing follows the measured eave/ridge profile; not an invented roof volume.
    const ridgeLength = Math.max(L, w2) - Math.min(L, w2);
    if (ridgeLength > 0.8) box(new THREE.Color(c).multiplyScalar(0.9).getHex(), ridgeLength + 0.12, 0.09, 0.15,
      cx, y1 + 0.025, cz, alongX ? yaw : yaw + Math.PI / 2);
  };
  // Coles: a proper two-plane pitched roof with bright triangular gable ends,
  // unlike the old generic flat/shallow shed volumes. Ridge runs along quad edge 0→1.
  const gableRoof = (c, pts, wallH, pitch = 0.23, gableColour = 0xf2f0eb, trim = null) => {
    const { L, W: w, cx, cz, yaw } = frame(pts), y1 = wallH + w * 0.5 * Math.tan(pitch);
    const xl = -L / 2, xr = L / 2, zn = -w / 2, zs = w / 2, y0 = wallH;
    const roofVerts = [
      xl,y0,zn, xr,y0,zn, xr,y1,0, xl,y0,zn, xr,y1,0, xl,y1,0,
      xl,y1,0, xr,y1,0, xr,y0,zs, xl,y1,0, xr,y0,zs, xl,y0,zs
    ];
    const gbVerts = [
      xl,y0,zn, xl,y0,zs, xl,y1,0,
      xr,y0,zs, xr,y0,zn, xr,y1,0
    ];
    for (const [colour, verts] of [[c, roofVerts], [gableColour, gbVerts]]) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.rotateY(yaw); geo.translate(cx, 0, cz); geo.computeVertexNormals(); push(colour, geo);
    }
    // Ridge flashing and both eave gutters track the existing pitched planes.
    const metal = new THREE.Color(c).multiplyScalar(0.9).getHex();
    box(metal, L + 0.16, 0.10, 0.15, cx, y1 + 0.02, cz, yaw);
    for (const side of [-1, 1]) box(metal, L + 0.12, 0.10, 0.13,
      cx + Math.sin(yaw) * side * w / 2, y0 + 0.025,
      cz + Math.cos(yaw) * side * w / 2, yaw);
    if (!trim) return;
    // Painted bargeboards on each gable end (and optional cross finials at the apex), in the roof's local frame.
    const local = (g, x, y, z) => { g.translate(x, y, z); g.rotateY(yaw); g.translate(cx, 0, cz); return g; };
    const rise = y1 - y0, slope = Math.hypot(w / 2, rise), a = Math.atan2(rise, w / 2);
    for (const [end, ox] of [[xl, -0.06], [xr, 0.06]]) {
      for (const sgn of [-1, 1]) { const g = new THREE.BoxGeometry(0.1, 0.3, slope + 0.35); g.rotateX(sgn * a); push(trim.barge ?? 0xf4f2ec, local(g, end + ox, (y0 + y1) / 2 + 0.05, sgn * w / 4)); }
      if (trim.cross?.includes(end === xl ? 'start' : 'end')) {
        push(trim.crossColour ?? 0xd9d2c4, local(new THREE.BoxGeometry(0.12, 1.0, 0.12), end + ox, y1 + 0.55, 0));
        push(trim.crossColour ?? 0xd9d2c4, local(new THREE.BoxGeometry(0.12, 0.12, 0.55), end + ox, y1 + 0.75, 0));
      }
    }
  };
  const footprintRoof = (colour, h, wall, roofH, wallColour) => {
    const form = NARROMINE_ROOF_FORMS[h.x.toFixed(1) + ',' + h.z.toFixed(1)], W = h.w + 0.8, D = h.d + 0.8;
    const c = Math.cos(h.yaw), s = Math.sin(h.yaw), at = (u, v) => [h.x + u * c + v * s, h.z - u * s + v * c];
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => at(a * W / 2, b * D / 2));
    if (!form) { const r = roofGeo(); r.scale(W, roofH, D); r.rotateY(h.yaw); r.translate(h.x, wall + roofH / 2, h.z); push(colour, r); return; }
    if (form === 'flat') { placeBox(colour, W, 0.15, D, h.x, wall + 0.075, h.z, h.yaw); return; }
    if (form.startsWith('hip')) { hipRoof(colour, pts, wall, Math.atan(roofH / (Math.min(W, D) / 2))); return; }
    if (form.startsWith('gable')) {
      const alongW = form.endsWith('w');
      gableRoof(colour, alongW ? pts : [pts[1], pts[2], pts[3], pts[0]], wall, Math.atan(roofH / ((alongW ? D : W) / 2)), wallColour);
      return;
    }
    // Skillion: one plane rising across w or d to the high side, closed with wall-coloured ends.
    const alongW = form.endsWith('w'), hi = form.includes('+') ? 1 : -1;
    const y = (u, v) => wall + roofH * (((alongW ? u / W : v / D) * hi) + 0.5);
    const P = (u, v, yy) => { const [px, pz] = at(u, v); return [px, yy ?? y(u, v), pz]; };
    const [u0, u1, v0, v1] = [-W / 2, W / 2, -D / 2, D / 2];
    const top = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v0), P(u1, v1), P(u0, v1)];
    const sides = [];
    const quad = (a, b) => { sides.push(P(...a, wall), P(...b, wall), P(...b), P(...a, wall), P(...b), P(...a)); };
    quad([u0, v0], [u1, v0]); quad([u1, v0], [u1, v1]); quad([u1, v1], [u0, v1]); quad([u0, v1], [u0, v0]);
    for (const [col, tris, up] of [[colour, top, true], [wallColour, sides, false]]) {
      const flat = [];
      for (let i = 0; i < tris.length; i += 3) {
        let [a, b, d] = tris.slice(i, i + 3);
        const n = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).cross(new THREE.Vector3(...d).sub(new THREE.Vector3(...a)));
        const out = up ? n.y : n.x * ((a[0] + b[0] + d[0]) / 3 - h.x) + n.z * ((a[2] + b[2] + d[2]) / 3 - h.z);
        if (out < 0) [b, d] = [d, b];
        flat.push(...a, ...b, ...d);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3)); g.computeVertexNormals(); push(col, g);
    }
  };

  for (const f of FILL_SHOPS) {
    if (NW_DANDALOO_SUPPRESSED_FILL.has(f.name)) continue;
    const profile = estimatedShopfrontProfile({ name: f.name, kind: f.kind });
    if (!f.generic) {
      // Named place on its real traced footprint. No verandah: nothing evidences one.
      const { wall, roofH } = footprintHeights(f);
      placeBox(NOT_SHOPFRONT.has(f.kind) ? HOUSE_WALLS[0] : profile.wall, f.w, wall, f.d, f.x, wall / 2, f.z, f.yaw);
      footprintRoof(roofColour(f, HOUSE_ROOFS[2]), f, wall, roofH, NOT_SHOPFRONT.has(f.kind) ? HOUSE_WALLS[0] : profile.wall);
      if (!NOT_SHOPFRONT.has(f.kind)) storefront({ ...f.frontEdge, name: f.name, profile, wallHeight: wall });
      colliders.push({ ...rotatedBoxCollider(f, 'poi-footprint'), top: wall + roofH });
      continue;
    }
    placeBox(profile.wall, f.w, 4.6, f.d, f.x, 2.3, f.z, f.yaw);
    placeBox(profile.trim, f.w + 0.3, 0.7, f.d + 0.3, f.x, 4.95, f.z, f.yaw);
    // Verandah over the footpath, between the shop front and the kerb.
    const [fx, fz] = f.front, vx = (fx + f.x) / 2 + (fx - f.x) * 0.25, vz = (fz + f.z) / 2 + (fz - f.z) * 0.25;
    placeBox(profile.roofEdge, f.w, 0.12, 3, vx, 3.1, vz, f.yaw);
    const direction = [fx - f.x, fz - f.z], dl = Math.hypot(...direction) || 1;
    const nx = direction[0] / dl, nz = direction[1] / dl, ux = Math.cos(f.yaw), uz = -Math.sin(f.yaw);
    const x = f.x + nx * (f.d / 2 + 0.02), z = f.z + nz * (f.d / 2 + 0.02);
    storefront({ a: [x - ux * f.w / 2, z - uz * f.w / 2], b: [x + ux * f.w / 2, z + uz * f.w / 2],
      toward: direction, name: f.name, profile, wallHeight: 4.6 });
    colliders.push({ ...rotatedBoxCollider(f, 'poi-shop'), top: 5.3 });
  }
  for (const h of FILL_HOUSES) {
    // Real traced footprint; total height from its measured estimate when known (else a 3 m wall + 2.2 m roof).
    // LiDAR-measured eave and ridge win (1,265 footprints); else the footprint dataset's height estimate.
    const { wall, roofH } = footprintHeights(h);
    placeBox(HOUSE_WALLS[h.tone], h.w, wall, h.d, h.x, wall / 2, h.z, h.yaw);
    footprintRoof(roofColour(h, HOUSE_ROOFS[h.tone]), h, wall, roofH, HOUSE_WALLS[h.tone]);
    colliders.push({ ...rotatedBoxCollider(h, 'microsoft-footprint'), top: wall + roofH });
  }
  // OSM power poles, transmission towers and lines, give-way signs and bus stops.
  buildNarromineFurniture(town, colliders);
  buildNarromineLotLines(town); // optional ?lots=1-only NSW cadastre QA, no colliders
  // Signs, crossings, stop lines and street furniture where Mapillary photos detected them.
  buildNarromineMapillaryObjects(town);
  // 2023 NSW LiDAR locations and canopy sizes are authoritative; natural morphology is illustrative.
  // Keep identical trunk collision footprints and no extra invented Narromine tree locations.
  const liDARForest = createLiDARTreeForest(NARROMINE_TREES, colliders);
  town.add(liDARForest.group);
  // Mapped OSM main-street facades: the EDGE is data-grounded; facade materials,
  // mullions, piers and doors are visual approximations (see facade profiles).
  for (const f of FRONTAGES) {
    if (RAILWAY_SUPPRESSED_OSM.has(BUILDINGS[f.building]?.osmIndex)) continue;
    if (BUILDINGS[f.building]?.osmIndex === PHYSIO_FACADE.osmIndex) continue; // photo-matched, not duplicate generic frontage
    const [ax, az] = f.a, [bx, bz] = f.b, len = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const tl = Math.hypot(...f.toward) || 1, ox = f.toward[0] / tl, oz = f.toward[1] / tl, yaw = -Math.atan2(bz - az, bx - ax);
    const depth = Math.min(3, Math.max(1.5, f.d - 1)), profile = estimatedShopfrontProfile({ name: f.name, street: f.street });
    placeBox(profile.roofEdge, len, 0.12, depth, mx + ox * depth / 2, 3.1, mz + oz * depth / 2, yaw);
    for (let t = 0.5; t < len; t += 4) {
      const px = ax + (bx - ax) * t / len + ox * (depth - 0.2), pz = az + (bz - az) * t / len + oz * (depth - 0.2);
      box(profile.pier, 0.14, 3.1, 0.14, px, 1.55, pz);
    }
    storefront({ a: f.a, b: f.b, toward: f.toward, name: f.name, profile,
      wallHeight: BUILDING_STYLE(BUILDINGS[f.building])[0] });
  }
  // Physiotherapy: photo-matched street-facing relief on the existing OSM:186 footprint.
  const physioBuilding = BUILDINGS.find(b => b.osmIndex === PHYSIO_FACADE.osmIndex);
  if (physioBuilding) buildNarrominePhysiotherapyFacade({
    THREE, building: physioBuilding, push,
    addSign: ({ name, x, y, z, width, height, normal }) => {
      if (typeof document === 'undefined') return;
      const tex = boardTexture(['NARROMINE', 'PHYSIOTHERAPY'],
        { bg: '#316e70', fg: '#f7f7ec', border: '#d4e9e5', w: 1024, h: 160 });
      plane(tex, width, height, x, y, z, Math.atan2(normal[0], normal[1]));
    },
  });
  // Wall features placed along one edge of a part, from street photos: t runs 0..1 from pts[edge[0]]
  // to pts[edge[1]], y is height in metres, and everything sits just proud of the wall.
  const along = (p, edge) => {
    const A = p.pts[edge[0]], B = p.pts[edge[1]], fr = frame(p.pts), ex = B[0] - A[0], ez = B[1] - A[1], len = Math.hypot(ex, ez);
    const mx = (A[0] + B[0]) / 2, mz = (A[1] + B[1]) / 2, ol = Math.hypot(mx - fr.cx, mz - fr.cz) || 1, ox = (mx - fr.cx) / ol, oz = (mz - fr.cz) / ol;
    // The wall is a box in the part's frame, which can stand slightly proud of a skewed traced edge;
    // snap each feature onto the box face that this edge belongs to so nothing is buried in the wall.
    const ux = Math.cos(-fr.yaw), uz = Math.sin(-fr.yaw), axes = [[ux, uz, fr.L / 2], [-ux, -uz, fr.L / 2], [-uz, ux, fr.W / 2], [uz, -ux, fr.W / 2]];
    const [nx, nz, half] = axes.reduce((m, a) => (a[0] * ox + a[1] * oz > m[0] * ox + m[1] * oz ? a : m));
    const at = (t, out = 0.06) => { const qx = A[0] + ex * t, qz = A[1] + ez * t, d = (qx - fr.cx) * nx + (qz - fr.cz) * nz, k = Math.max(0, half - d) + out; return [qx + nx * k, qz + nz * k]; };
    // Run features along the wall face (not the skewed edge) so long bands and signs stay on the surface.
    const sgn = Math.sign(ex * -nz + ez * nx) || 1, tx = -nz * sgn, tz = nx * sgn;
    return { len: Math.abs(ex * tx + ez * tz), yaw: -Math.atan2(tz, tx), face: Math.atan2(nx, nz), at, ox: nx, oz: nz };
  };
  const grid = (e, t0, t1, y0, y1, cols, rows, glass, frameC, out) => {
    const w = e.len * (t1 - t0), [x, z] = e.at((t0 + t1) / 2, out), h = y1 - y0;
    placeBox(glass, w, h, 0.08, x, y0 + h / 2, z, e.yaw);
    for (let i = 0; i <= cols; i++) { const [qx, qz] = e.at(t0 + (t1 - t0) * i / cols, out + 0.03); placeBox(frameC, 0.09, h, 0.1, qx, y0 + h / 2, qz, e.yaw); }
    for (let j = 0; j <= rows; j++) placeBox(frameC, w, 0.09, 0.1, x + e.ox * 0.03, y0 + h * j / rows, z + e.oz * 0.03, e.yaw);
  };
  const feature = (p, F) => {
    const e = along(p, F.edge), t = F.t;
    if (F.kind === 'glazing') grid(e, t[0], t[1], F.y[0], F.y[1], F.cols, F.rows, 0x1f272d, 0x2b2f33, 0.12);
    if (F.kind === 'band') grid(e, t[0], t[1], F.y[0], F.y[1], F.panes, 1, 0x9fb3c2, 0xf4f4f0, 0.12);
    if (F.kind === 'panel') { const [x, z] = e.at((t[0] + t[1]) / 2, 0.03 + (F.layer || 0) * 0.03), h = F.y[1] - F.y[0]; placeBox(F.colour, e.len * (t[1] - t[0]), h, 0.04, x, F.y[0] + h / 2, z, e.yaw); }
    // Windows and doors: a frame, glass (or a door leaf), an optional brick head and sash bar; t may be a list.
    if (F.kind === 'window' || F.kind === 'door') for (const tt of Array.isArray(t) ? t : [t]) {
      const [x, z] = e.at(tt, 0.07), h = F.y[1] - F.y[0], w = F.w || 1.0, door = F.kind === 'door';
      placeBox(F.frame ?? 0xf4f4f0, w + 0.2, h + 0.2, 0.08, x, F.y[0] + h / 2, z, e.yaw); const [gx, gz] = e.at(tt, 0.1);
      placeBox(F.glass ?? F.colour ?? (door ? 0x514137 : 0x9fb3c2), w, h, 0.06, gx, F.y[0] + h / 2, gz, e.yaw);
      if (door) { const [hx, hz] = e.at(tt + 0.018, 0.16); placeBox(0xe5dbbc, 0.045, 0.25, 0.05, hx, F.y[0] + 1.0, hz, e.yaw); }
      if (F.sash && !door) placeBox(F.frame ?? 0xf4f4f0, w, 0.06, 0.08, gx, F.y[0] + h / 2, gz, e.yaw);
      if (door && F.fanlight) placeBox(0x9fb3c2, w, 0.35, 0.07, gx, F.y[1] - 0.2, gz, e.yaw);
      if (F.head) { const [hx, hz] = e.at(tt, 0.1); placeBox(F.head, w + 0.4, 0.28, 0.1, hx, F.y[1] + 0.24, hz, e.yaw); }
      if (F.ac) { const [ax, az] = e.at(tt, 0.35); placeBox(0xe6e6e2, w * 0.7, 0.45, 0.6, ax, F.y[1] - 0.35, az, e.yaw); } }
    if (F.kind === 'pier') { const [x, z] = e.at(t, F.out ?? 0.15), h = F.y[1] - F.y[0]; placeBox(F.colour ?? 0xbdb6ad, F.w || 0.55, h, F.d || F.w || 0.55, x, F.y[0] + h / 2, z, e.yaw); }
    // Pointed (Gothic) openings: lancet windows and arched doors, a surround then the glass/leaf.
    if (F.kind === 'lancet' || F.kind === 'archdoor') {
      const door = F.kind === 'archdoor', w = F.w ?? (door ? 1.3 : 0.5), h = F.y[1] - F.y[0], peak = w * (door ? 0.45 : 0.75);
      const shape = (ww, hh, pk) => { const sh = new THREE.Shape(); sh.moveTo(-ww / 2, 0); sh.lineTo(ww / 2, 0); sh.lineTo(ww / 2, hh);
        sh.quadraticCurveTo(ww / 2, hh + pk * 0.75, 0, hh + pk); sh.quadraticCurveTo(-ww / 2, hh + pk * 0.75, -ww / 2, hh); return sh; };
      const ts = Array.isArray(t) ? t : [t];
      for (const tt of ts) for (const [ww, hh, pk, colour, out] of [[w + 0.24, h + 0.06, peak + 0.12, F.surround ?? 0xc9a27e, 0.05], [w, h, peak, door ? (F.colour ?? 0xa8262c) : (F.colour ?? 0x2b3a44), 0.09]]) {
        const g = new THREE.ShapeGeometry(shape(ww, hh, pk), 6), [x, z] = e.at(tt, out);
        g.rotateY(e.face); g.translate(x, F.y[0] - (ww - w) / 2 * 0, z); push(colour, g);
      }
    }
    if (F.kind === 'sign' && typeof document !== 'undefined') {
      const tex = boardTexture(F.text, { bg: F.bg, fg: F.fg, border: F.bg, w: F.px || 1024, h: Math.round((F.px || 1024) * F.h / F.w) });
      if (F.blade) { const [x, z] = e.at(t, F.out); box(F.bgHex, 0.12, F.h, F.w, x, F.y, z, e.yaw + Math.PI / 2);
        plane(tex, F.w, F.h, x + Math.sin(e.yaw + Math.PI / 2) * 0.07, F.y, z + Math.cos(e.yaw + Math.PI / 2) * 0.07, e.face + Math.PI / 2); plane(tex, F.w, F.h, x - Math.sin(e.yaw + Math.PI / 2) * 0.07, F.y, z - Math.cos(e.yaw + Math.PI / 2) * 0.07, e.face - Math.PI / 2); }
      else { const [x, z] = e.at(t, F.out ?? 0.16); plane(tex, F.w, F.h, x, F.y, z, e.face); }
    }
  };
  const GROUND = { asphalt: [0x3f4244, 0.05], grass: [0x7fa65d, 0.03], paving: [0xb8ac98, 0.055], gravel: [0xa89a84, 0.045] };
  for (const d of DETAILED) {
    if (d.id === NARROMINE_HOTEL_ID || ROYAL_HOTEL_REPLACED_IDS.has(d.id)) continue;
    const ROOF = 0xc8cac6, WALL = 0xe3d8c2;   // galvanised roofs as in the aerial; wall colour assumed (cream render/paint)
    for (const g of d.ground) flatPoly(GROUND[g.kind][0], g.pts, GROUND[g.kind][1]);
    for (const p of d.parts) {
      const f = frame(p.pts), guessH = p.wall || (p.storeys === 2 ? 7.6 : 3.8);
      // LiDAR: [year, ground, eave p5, ridge p98, median, n, density]. A hipped/gabled roof's median sits about 30%
      // of the way from eave to ridge, so eave = (median - 0.3 ridge) / 0.7; flat/skillion parts use the median.
      const Ld = p.lidar, pitched = p.roof === 'hip' || p.roof === 'gable';
      // Post Office wings share one L-shaped roof (narromine-post-office-roof.js); walls stop at its eave.
      const poRoof = isPostOfficeRoofPart(d.id, p.name);
      // Parts traced straight from a LiDAR profile carry exact wall and ridge heights (p.ridgeH) and skip the estimate.
      const wallH = poRoof ? POST_OFFICE_EAVE_H : p.ridgeH ? guessH : Ld ? Math.max(2.4, pitched ? (Ld[4] - 0.3 * Ld[3]) / 0.7 : Ld[4]) : guessH;
      const ridgeTop = p.ridgeH ?? (Ld ? Ld[3] : null), span = p.roof === 'gable' ? f.W : Math.min(f.L, f.W);
      const pitch = ridgeTop && pitched ? Math.min(0.9, Math.max(0.05, Math.atan(Math.max(0, ridgeTop - wallH) / (span / 2)))) : p.pitch;
      // Upper-floor features were placed for the guessed height; stretch heights above the ground floor to fit.
      const fitY = (y) => (Ld && !p.ridgeH && y > 3.4 && guessH > 3.4 ? 3.4 + (y - 3.4) * (wallH - 3.4) / (guessH - 3.4) : y);
      box(p.wallColour ?? WALL, f.L, wallH, f.W, f.cx, wallH / 2, f.cz, f.yaw);
      for (const F of p.features || []) feature(p, { ...F, y: Array.isArray(F.y) ? F.y.map(fitY) : fitY(F.y) });
      // Hotel facades: the mapped street-edge and verandah are grounded, but the
      // window and doorway positions below are explicitly ESTIMATED details.
      const hotel = landmarkFacadeSpec(d.id, p.name);
      // Photo-matched parts (p.features from Street View) supersede these estimates.
      if (hotel && !p.features) for (const bay of facadeBays(along(p, hotel.edge).len, { maxBays: 7, targetWidth: 3.2 })) {
        const edge = hotel.edge;
        if (bay.door) feature(p, { kind: 'door', edge, t: bay.t, w: 1.15, y: [0.08, 2.55] });
        else feature(p, { kind: 'window', edge, t: bay.t, w: Math.min(1.35, bay.width - 0.2), y: [1.0, 2.55] });
        if (hotel.storeys === 2) feature(p, { kind: 'window', edge, t: bay.t,
          w: Math.min(1.2, bay.width - 0.25), y: [fitY(4.65), fitY(6.15)] });
      }
      if (p.fascia && !poRoof) box(0xf4f4f0, f.L + 0.5, 0.35, f.W + 0.5, f.cx, wallH - 0.05, f.cz, f.yaw);   // white roof edge
      if (p.mast && !poRoof) { box(0xb0b2b4, 0.1, 4, 0.1, f.cx, wallH + 2, f.cz); box(0xb0b2b4, 1.4, 0.06, 0.06, f.cx, wallH + 3.4, f.cz); }
      const RC = p.roofColour ?? ROOF;
      if (poRoof) { /* built once for both wings below */ }
      else if (p.roof === 'hip') hipRoof(RC, p.pts, wallH, pitch);
      else if (p.roof === 'gable') gableRoof(RC, p.pts, wallH, pitch, p.gableColour ?? p.wallColour, p.trim);
      else box(RC, f.L + 0.4, 0.1, f.W + 0.4, f.cx, wallH + 0.1, f.cz, f.yaw);
      if (p.storeys === 2 && !p.features && !landmarkFacadeSpec(d.id, p.name)) for (const side of [-1, 1]) for (let t = -f.L / 2 + 1.5; t < f.L / 2 - 1; t += 3) { // upper-floor windows on the long faces
        const ox = Math.cos(-f.yaw) * t - Math.sin(-f.yaw) * side * (f.W / 2 + 0.03), oz = Math.sin(-f.yaw) * t + Math.cos(-f.yaw) * side * (f.W / 2 + 0.03);
        box(0x34434f, 1.0, 1.6, 0.06, f.cx + ox, fitY(5.6), f.cz + oz, f.yaw); }
      // The collider top is the tallest rendered roof plane (ridge for pitched,
      // actual cap for flat). A 12/25/50m super-jump can reach/clear the building
      // without making any ground-level doorway or road collider passable.
      const roofTop = Math.max(wallH,
        pitched ? (Number.isFinite(ridgeTop) ? ridgeTop : wallH + Math.tan(pitch ?? 0.42) * span / 2) : wallH + 0.15);
      if (d.id === 'dandaloo-82' && p.name.startsWith('Coles ')) {
        // Coles walls are skewed against the adjacent Kierath's arcade. A
        // single axis-aligned bounding rectangle wrongly fills the open air
        // passage at its diagonal NW edge, making the real courtyard unreachable.
        // Segment the actual traced quad *edges* instead. Preserve solid walls
        // and keep all unrelated detailed-building colliders unchanged.
        for (let edge = 0; edge < p.pts.length; edge++) {
          const a = p.pts[edge], b = p.pts[(edge + 1) % p.pts.length];
          const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const sections = Math.max(1, Math.ceil(length / 0.48));
          for (let i = 0; i < sections; i++) {
            const t0 = i / sections, t1 = (i + 1) / sections;
            const x0 = a[0] + (b[0] - a[0]) * t0, x1 = a[0] + (b[0] - a[0]) * t1;
            const z0 = a[1] + (b[1] - a[1]) * t0, z1 = a[1] + (b[1] - a[1]) * t1;
            colliders.push({ x0: Math.min(x0, x1) - 0.10, x1: Math.max(x0, x1) + 0.10,
              z0: Math.min(z0, z1) - 0.10, z1: Math.max(z0, z1) + 0.10, top: roofTop });
          }
        }
      } else colliders.push({ ...polyRect(p.pts), top: roofTop });
      if (p.roofText && pitched && typeof document !== 'undefined') {
        // Align painted letters to the actual pitched LiDAR-adjusted hip face,
        // not the former world-axis plane hard-coded to 0.42 rad.
        const surface = roofLetteringSurface(f, wallH, pitch ?? 0.42);
        if (surface) {
          const canvas = document.createElement('canvas');
          canvas.width = 1024; canvas.height = 256;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#8e2a26';
          ctx.font = 'bold 150px Arial';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(p.roofText, 512, 135);
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(surface.positions, 3));
          geometry.setAttribute('uv', new THREE.Float32BufferAttribute(surface.uv, 2));
          geometry.setIndex(surface.triangles);
          geometry.computeVertexNormals();
          const material = new THREE.MeshLambertMaterial({
            map: texture, transparent: true, depthWrite: false,
            side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1,
          });
          const lettering = new THREE.Mesh(geometry, material);
          lettering.name = `${d.id}:${p.name}:roof-lettering`;
          town.add(lettering);
        }
      }
    }
    // Verandahs: posts along the outer (kerb) edge; two-level ones get a balcony floor, balustrade and iron-lace frieze.
    for (const v of d.verandahs) {
      // Measured verandah roof height when the survey sees it clearly (dense points, below the main roof);
      // awnings tucked under a roof overhang read as the roof and are ignored.
      const Lv = v.lidar && v.lidar[6] >= 1.5 && v.lidar[4] < 8.5 ? v.lidar[4] : null;
      const f = frame(v.pts), [oa, ob] = [v.pts[v.outer[0]], v.pts[v.outer[1]]], top = Lv ?? (v.levels === 2 ? 7.0 : 3.25);
      // Photographed verandahs carry their own colours (posts, balustrade/lace, roof, fascia); otherwise defaults.
      const vRoof = v.roofColour ?? (v.lace ? 0x8a6a52 : ROOF), POST = v.postColour ?? (v.lace ? 0xeae6dc : 0x6f6a62), LACE = v.laceColour ?? POST, FASCIA = v.fasciaColour ?? POST;
      if (v.cantilever) { box(v.colour ?? 0xf2f0ea, f.L, 0.3, f.W, f.cx, Lv ?? v.height, f.cz, f.yaw); continue; }   // cantilevered awning, no posts
      box(vRoof, f.L, 0.1, f.W, f.cx, top, f.cz, f.yaw);
      const ex = ob[0] - oa[0], ez = ob[1] - oa[1], len = Math.hypot(ex, ez), n = Math.max(2, Math.round(len / 3.2));
      const ix = (f.cx - (oa[0] + ob[0]) / 2), iz = (f.cz - (oa[1] + ob[1]) / 2), il = Math.hypot(ix, iz) || 1, inX = ix / il * 0.25, inZ = iz / il * 0.25;
      const eyaw = -Math.atan2(ez, ex), mx = (oa[0] + ob[0]) / 2 + inX, mz = (oa[1] + ob[1]) / 2 + inZ;
      for (let i = 0; i <= n; i++) { const t = i / n; box(POST, 0.14, top, 0.14, oa[0] + ex * t + inX, top / 2, oa[1] + ez * t + inZ); }
      if (v.levels === 2) {
        box(0x7d6a55, f.L, 0.2, f.W, f.cx, top * 0.5, f.cz, f.yaw);                       // balcony floor
        box(FASCIA, len, 0.08, 0.1, mx, top * 0.5 + 1.05, mz, eyaw); box(LACE, len, 0.9, 0.04, mx, top * 0.5 + 0.6, mz, eyaw); // balustrade rail and panel
        box(FASCIA, len, 0.3, 0.06, mx, top * 0.5 - 0.05, mz, eyaw);   // balcony fascia
      }
      if (v.lace) { box(LACE, len, 0.45, 0.03, mx, top - 0.3, mz, eyaw); box(LACE, len, 0.35, 0.03, mx, top * 0.5 - 0.42, mz, eyaw); } // upper and lower lace friezes
      if (v.fasciaColour) box(FASCIA, len, 0.22, 0.06, mx, top + 0.05, mz, eyaw);   // roof fascia
      if (v.signs && typeof document !== 'undefined') for (const s of v.signs) {
        const tex = boardTexture(s.text, { bg: s.bg, fg: s.fg, border: s.border ?? s.bg, w: s.px || 1024, h: Math.round((s.px || 1024) * s.h / s.w) });
        const sx = oa[0] + ex * s.t + inX * 0.6, sz = oa[1] + ez * s.t + inZ * 0.6, face = Math.atan2(-ix, -iz);
        if (s.blade) { box(s.bgHex ?? 0xf4f4f0, 0.1, s.h, s.w, sx, s.y, sz, eyaw + Math.PI / 2);
          plane(tex, s.w, s.h, sx + Math.sin(eyaw + Math.PI / 2) * 0.06, s.y, sz + Math.cos(eyaw + Math.PI / 2) * 0.06, face + Math.PI / 2);
          plane(tex, s.w, s.h, sx - Math.sin(eyaw + Math.PI / 2) * 0.06, s.y, sz - Math.cos(eyaw + Math.PI / 2) * 0.06, face - Math.PI / 2); }
        else plane(tex, s.w, s.h, sx, s.y, sz, face);
      }
    }
    for (const g of d.ground) if (g.tables) { const cy = polyRect(g.pts);
      for (let i = 0; i < g.tables; i++) { const tx = cy.x0 + 2 + i * 3.2, tz = (cy.z0 + cy.z1) / 2; box(0x5c4632, 1.6, 0.06, 0.8, tx, 0.75, tz); box(0x5c4632, 1.6, 0.05, 0.3, tx, 0.45, tz - 0.75); box(0x5c4632, 1.6, 0.05, 0.3, tx, 0.45, tz + 0.75); } }
    for (const pr of d.props) {
      if (pr.kind === 'postbox') { const [x, z] = pr.at; box(0xd4202f, 0.55, 1.3, 0.45, x, 0.65, z); box(0xd4202f, 0.6, 0.1, 0.5, x, 1.35, z); box(0xffffff, 0.3, 0.3, 0.02, x, 1.05, z + 0.24); colliders.push({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3 }); }
      if (pr.kind === 'pier') { const [x, z] = pr.at; box(0xbdb6ad, 0.55, pr.h, 0.55, x, pr.h / 2, z); colliders.push({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3 }); }
      if (pr.kind === 'lamp') { const [x, z] = pr.at; box(0x2f4a3c, 0.16, 6, 0.16, x, 3, z); const dx = pr.dx ?? 0.6, dz = pr.dz ?? 0; box(0x2f4a3c, 0.1 + Math.abs(dx) * 2, 0.1, 0.1 + Math.abs(dz) * 2, x + dx, 6.1, z + dz); box(0x2f4a3c, 0.5, 0.25, 0.5, x + dx * 2, 5.85, z + dz * 2); }
      if (pr.kind === 'hedge') { const f = frame(pr.pts); flatPoly(0x8a3b2c, pr.pts, 0.06); box(0x55752f, f.L - 0.6, pr.h || 0.8, f.W - 0.6, f.cx, (pr.h || 0.8) / 2, f.cz, f.yaw); }
      if (pr.kind === 'steps') { const f = frame(pr.pts); for (let i = 0; i < 3; i++) box(0xcfc9be, f.L, 0.15 * (i + 1), f.W * (1 - i / 3), f.cx, 0.075 * (i + 1), f.cz, f.yaw); }
      if (pr.kind === 'fence' || pr.kind === 'rail') { const [ax, az] = pr.a, [bx, bz] = pr.b, l = Math.hypot(bx - ax, bz - az), y = -Math.atan2(bz - az, bx - ax), c = pr.kind === 'fence' ? 0xc8352e : 0xb8bcbf;
        placeBox(c, l, 0.06, 0.06, (ax + bx) / 2, 1.0, (az + bz) / 2, y); placeBox(c, l, 0.05, 0.05, (ax + bx) / 2, 0.5, (az + bz) / 2, y);
        for (let k = 0; k <= Math.ceil(l / (pr.kind === 'fence' ? 0.15 : 1.5)); k++) { const q = k / Math.ceil(l / (pr.kind === 'fence' ? 0.15 : 1.5)); box(c, 0.04, 1.0, 0.04, ax + (bx - ax) * q, 0.5, az + (bz - az) * q); } }
      if (pr.kind === 'bullnose') {   // curved (bullnose) shop awning with alternating stripes, from a to b, projecting d metres
        const [ax, az] = pr.a, [bx, bz] = pr.b, l = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / l, uz = (bz - az) / l, n = Math.round(l / 0.35);
        for (let i = 0; i < n; i++) { const g = new THREE.CylinderGeometry(pr.d, pr.d, l / n, 10, 1, true, 0, Math.PI / 2);
          g.rotateZ(Math.PI / 2); g.rotateY(-Math.atan2(uz, ux)); const t = (i + 0.5) / n;
          g.translate(ax + (bx - ax) * t + pr.ox * 0.0, pr.y, az + (bz - az) * t); push(i % 2 ? 0xf2f2ee : 0x7f8a8f, g); } }
      if (pr.kind === 'trolleybay') { const [ax, az] = pr.a, [bx, bz] = pr.b, l = Math.hypot(bx - ax, bz - az), y = -Math.atan2(bz - az, bx - ax);
        for (const off of [-0.8, 0.8]) { const nx = -(bz - az) / l * off, nz = (bx - ax) / l * off; placeBox(0xb8bcbf, l, 0.06, 0.06, (ax + bx) / 2 + nx, 0.95, (az + bz) / 2 + nz, y); }
        for (let k = 0; k < 4; k++) { const t = 0.15 + k * 0.22; box(0xb3262b, 0.55, 0.9, 0.85, ax + (bx - ax) * t, 0.5, az + (bz - az) * t); } }
      if (pr.kind === 'board') { const [x, z] = pr.at; box(0xb8bcbf, 0.08, pr.h, 0.08, x - 0.6, pr.h / 2, z); box(0xb8bcbf, 0.08, pr.h, 0.08, x + 0.6, pr.h / 2, z);
        if (typeof document !== 'undefined') plane(boardTexture(pr.text, { bg: pr.bg, fg: pr.fg, border: pr.bg, w: 512, h: 384 }), 1.6, 1.2, x, pr.h - 0.4, z, pr.face ?? 0); }
      if (pr.kind === 'palm') { const [x, z] = pr.at, h = pr.h || 9; const t = new THREE.CylinderGeometry(0.35, 0.55, h, 8); t.translate(x, h / 2, z); push(0x6b5a45, t);
        for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, g = new THREE.BoxGeometry(3.4, 0.06, 0.55); g.translate(1.7, 0, 0); g.rotateZ(-0.35 - (k % 2) * 0.25); g.rotateY(a); g.translate(x, h, z); push(0x4f6b32, g); } }
      if (pr.kind === 'statue') { const [x, z] = pr.at; box(0x9e9b95, 1.0, 0.9, 1.0, x, 0.45, z); box(0xdedbd4, 0.5, 0.55, 0.6, x, 1.18, z); box(0xdedbd4, 0.42, 0.5, 0.35, x, 1.6, z - 0.08); const g = new THREE.SphereGeometry(0.2, 8, 6); g.translate(x, 2.0, z - 0.08); push(0xdedbd4, g); colliders.push({ x0: x - 0.5, x1: x + 0.5, z0: z - 0.5, z1: z + 0.5 }); }   // median statue; small so lanes stay clear
      if (pr.kind === 'redbays') flatPoly(0xb3262b, pr.pts, 0.07);
      // Flagpole with a simple flag: 'aus' (blue ensign), 'nsw' (blue state ensign), 'aboriginal' (black, red, yellow sun).
      if (pr.kind === 'flagpole') { const [x, z] = pr.at, h = pr.h ?? 8; box(0xe8e8e8, 0.1, h, 0.1, x, h / 2, z); colliders.push({ x0: x - 0.15, x1: x + 0.15, z0: z - 0.15, z1: z + 0.15 });
        const fy = h - 0.6; if (pr.flag === 'aboriginal') { box(0x111111, 1.5, 0.45, 0.03, x + 0.8, fy + 0.22, z); box(0xc0262c, 1.5, 0.45, 0.03, x + 0.8, fy - 0.23, z); const sun = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12); sun.rotateX(Math.PI / 2); sun.translate(x + 0.8, fy, z); push(0xf2c21b, sun); }
        else { box(0x1f3a8a, 1.5, 0.9, 0.03, x + 0.8, fy, z); box(0xc0262c, 0.5, 0.3, 0.035, x + 0.3, fy + 0.3, z); } }
      // Solar array lying on a roof slope: pts = [low edge A, low edge B, high edge B, high edge A], inset from the edges.
      if (pr.kind === 'solar') { const q = pr.pts, cx = q.reduce((s, p) => s + p[0], 0) / 4, cz = q.reduce((s, p) => s + p[1], 0) / 4, ins = (p) => [cx + (p[0] - cx) * 0.9, cz + (p[1] - cz) * 0.9];
        const [a, b, c, d] = q.map(ins), lo = pr.yLow + 0.12, hi = pr.yHigh + 0.12, v = [a[0], lo, a[1], b[0], lo, b[1], c[0], hi, c[1], a[0], lo, a[1], c[0], hi, c[1], d[0], hi, d[1]];
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); push(0x1d2a44, g); }
      // Brick chimney rising h metres above y, with a corbelled cap.
      if (pr.kind === 'chimney') { const [x, z] = pr.at; box(pr.colour ?? 0xa04b36, 0.7, pr.h, 0.55, x, pr.y + pr.h / 2, z); box(pr.colour ?? 0xa04b36, 0.85, 0.18, 0.7, x, pr.y + pr.h - 0.05, z); }
      // Ornamental parapet at a corner: a rendered pedestal with a scrolled pediment and crest, facing 'face'.
      if (pr.kind === 'pediment') { const [x, z] = pr.at, y = pr.y, fy = pr.face, c = pr.colour ?? 0xdcc9a0;
        placeBox(c, 2.6, 1.4, 0.5, x, y + 0.7, z, fy); placeBox(c, 2.9, 0.2, 0.62, x, y + 1.45, z, fy);
        placeBox(c, 1.6, 0.7, 0.45, x, y + 1.9, z, fy); placeBox(c, 0.7, 0.5, 0.4, x, y + 2.45, z, fy);
        for (const s of [-1, 1]) { const sx = x + Math.cos(-fy) * s * 1.2, sz = z + Math.sin(-fy) * s * 1.2; box(c, 0.35, 0.5, 0.35, sx, y + 1.8, sz); const b = new THREE.SphereGeometry(0.2, 8, 6); b.translate(sx, y + 2.15, sz); push(c, b); } }
      // A flat sign at a point and height, facing yaw 'face' (used for verandah name boards).
      if (pr.kind === 'facesign' && typeof document !== 'undefined') { const [x, z] = pr.at; plane(boardTexture(pr.text, { bg: pr.bg, fg: pr.fg, border: pr.border ?? pr.bg, w: 1024, h: Math.round(1024 * pr.h / pr.w) }), pr.w, pr.h, x, pr.y, z, pr.face); }
      // Octagonal brick bellcote with a little tiled cap and cross, seated on a roof at height y.
      if (pr.kind === 'bellcote') { const [x, z] = pr.at, y = pr.y;
        const b = new THREE.CylinderGeometry(0.55, 0.6, 0.9, 8); b.translate(x, y + 0.45, z); push(0xa65a40, b);
        const o = new THREE.CylinderGeometry(0.42, 0.42, 0.55, 8, 1, true); o.translate(x, y + 1.18, z); push(0x2a2522, o);
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 8; box(0xa65a40, 0.14, 0.55, 0.14, x + Math.cos(a) * 0.48, y + 1.18, z + Math.sin(a) * 0.48); }
        const c = new THREE.ConeGeometry(0.72, 0.6, 8); c.translate(x, y + 1.75, z); push(0xb5603f, c);
        box(0xd9d2c4, 0.08, 0.6, 0.08, x, y + 2.3, z); box(0xd9d2c4, 0.34, 0.08, 0.08, x, y + 2.4, z); }
      if (pr.kind === 'cooler') { const [x, z] = pr.at; box(0xdcdcd6, 1.1, 0.9, 1.1, x, pr.y + 0.45, z); box(0xc4c4be, 0.5, 0.35, 0.5, x, pr.y + 1.05, z); }
      if (pr.kind === 'shed') { const f = frame(pr.pts); box(0xb9c3c9, f.L, 2.1, f.W, f.cx, 1.05, f.cz, f.yaw); box(0xa3adb3, f.L + 0.15, 0.08, f.W + 0.15, f.cx, 2.15, f.cz, f.yaw); colliders.push(polyRect(pr.pts)); }
      // Low capped block wall with piers along a run a→b; 'gaps' are [t0,t1] fractions left open (gates, paths).
      if (pr.kind === 'blockwall') { const [ax, az] = pr.a, [bx, bz] = pr.b, l = Math.hypot(bx - ax, bz - az), yw = -Math.atan2(bz - az, bx - ax), h = pr.h ?? 0.85;
        const open = (q) => (pr.gaps || []).some(([g0, g1]) => q > g0 && q < g1), n = Math.max(1, Math.round(l / 0.5));
        let start = null;
        const flush = (q) => { if (start === null) return; const t0 = start, t1 = q, mx = ax + (bx - ax) * (t0 + t1) / 2, mz = az + (bz - az) * (t0 + t1) / 2, len = l * (t1 - t0);
          placeBox(pr.colour ?? 0xc9a985, len, h, 0.3, mx, h / 2, mz, yw); placeBox(0xb89a78, len, 0.08, 0.38, mx, h + 0.04, mz, yw);
          const xa = ax + (bx - ax) * t0, za = az + (bz - az) * t0, xb = ax + (bx - ax) * t1, zb = az + (bz - az) * t1;
          // Colliders in ~1 m pieces so a slanted wall never blocks a whole axis-aligned rectangle.
          const k = Math.max(1, Math.ceil(len)); for (let j = 0; j < k; j++) { const p0x = xa + (xb - xa) * j / k, p0z = za + (zb - za) * j / k, p1x = xa + (xb - xa) * (j + 1) / k, p1z = za + (zb - za) * (j + 1) / k;
            colliders.push({ x0: Math.min(p0x, p1x) - 0.15, x1: Math.max(p0x, p1x) + 0.15, z0: Math.min(p0z, p1z) - 0.15, z1: Math.max(p0z, p1z) + 0.15 }); } start = null; };
        for (let i = 0; i <= n; i++) { const q = i / n; if (open(q) || i === n) { if (i === n && !open(q) && start === null) start = q; flush(q); } else if (start === null) start = q; }
        for (let k = 0; k <= Math.floor(l / 3.2); k++) { const q = k * 3.2 / l; if (!open(q)) box(pr.colour ?? 0xc9a985, 0.45, h + 0.25, 0.45, ax + (bx - ax) * q, (h + 0.25) / 2, az + (bz - az) * q); } }
      if (pr.kind === 'planter') { const f = frame(pr.pts); box(0x9c8f7c, f.L, 0.45, f.W, f.cx, 0.22, f.cz, f.yaw); box(0x5f8a3f, f.L - 0.2, 0.08, f.W - 0.2, f.cx, 0.47, f.cz, f.yaw); }
      if (pr.kind === 'chimney') { const [x, z] = pr.at, y0 = pr.y ?? 9.2, h = pr.h ?? 2.6;
        box(pr.colour ?? 0x9e4b38, 0.75, h, 0.75, x, y0 + h / 2, z); box(0x873d2d, 0.9, 0.22, 0.9, x, y0 + h + 0.05, z); }
      if (pr.kind === 'parapet') { const [ax, az] = pr.a, [bx, bz] = pr.b, l = Math.hypot(bx - ax, bz - az), yw = -Math.atan2(bz - az, bx - ax), mx = (ax + bx) / 2, mz = (az + bz) / 2, c = pr.colour ?? 0xe6dac2;
        placeBox(c, l, pr.h, 0.35, mx, pr.y + pr.h / 2, mz, yw); placeBox(c, l * 0.52, pr.h * 0.55, 0.36, mx, pr.y + pr.h * 1.25, mz, yw);
        box(c, 0.46, pr.h + 0.55, 0.46, ax, pr.y + (pr.h + 0.55) / 2, az); box(c, 0.46, pr.h + 0.55, 0.46, bx, pr.y + (pr.h + 0.55) / 2, bz);
        if (pr.text && typeof document !== 'undefined') { const fc = pr.face ?? Math.atan2(bz - az, -(bx - ax));
          plane(boardTexture(pr.text, { bg: pr.bg ?? '#e6dac2', fg: pr.fg ?? '#2b3a44', border: pr.border ?? '#b8aa90', w: 512, h: 256 }), l * 0.82, pr.h * 0.9, mx + Math.sin(fc) * 0.2, pr.y + pr.h * 0.62, mz + Math.cos(fc) * 0.2, fc); } }
    }
    for (const [tx, tz] of d.trees) { box(0x8f8577, 0.5, 4, 0.5, tx, 2, tz); const g3 = new THREE.SphereGeometry(4.2, 8, 6); g3.scale(1, 0.7, 1); g3.translate(tx, 6.5, tz); push(0x5d7d43, g3); }
  }
  // Actual corner entrance at the Post Office's north-side steps. The external
  // masonry stays solid, but the visible glazing is a real indoor transition:
  // approach the door or press E/✋ at the marked threshold to enter.
  const postalFacade=DETAILED.find(d=>d.id===NARROMINE_POST_OFFICE_ID)?.parts.find(p=>p.name==='north wing');
  if(postalFacade){
    const wall=along(postalFacade,[0,1]), [dx,dz]=wall.at(.655,0.20);
    placeBox(0xf4f0ea,1.62,2.63,0.12,dx,1.32,dz,wall.yaw);
    placeBox(0x293a48,1.39,2.31,0.13,dx+wall.ox*.08,1.17,dz+wall.oz*.08,wall.yaw);
    placeBox(0xb74339,0.72,0.55,0.09,dx+wall.ox*.13,2.25,dz+wall.oz*.13,wall.yaw);
    placeBox(0xb7c3c9,0.04,1.20,0.05,dx+wall.ox*.19,1.30,dz+wall.oz*.19,wall.yaw);
  }
  if(makeLabel){
    const sign=makeLabel('ENTER POST OFFICE · ✋ / E','interactive');
    sign.position.set(NARROMINE_POST_OFFICE_ENTRANCE.x,2.35,NARROMINE_POST_OFFICE_ENTRANCE.z);
    town.add(sign);
  }
  spots.push({key:'narromine:post-office:entrance',label:'Enter Narromine Post Office',
    pos:new THREE.Vector3(NARROMINE_POST_OFFICE_ENTRANCE.x,0,NARROMINE_POST_OFFICE_ENTRANCE.z),
    narromineEnter:true});

  // Main-thread batch-merged geometry; live walkable arcade, retaining Post Office entrance.
  buildNarromineHotel({ push, box, flatPoly, town, colliders });
  buildNarrominePostOfficeRoof({ push, box });
  buildNarromineRoyalHotel({ push, box, flatPoly, plane, boardTexture, town, colliders });
  buildKieraths({ box, push, strip, flatPoly, plane, boardTexture, colliders, spots });
  buildNarromineRailwayPrecinct({ box, push, strip, flatPoly, plane, boardTexture, colliders, spots });
  buildNarromineCourthousePrecinct({ box, push, strip, flatPoly, plane, boardTexture, colliders, spots });
  buildNarromineStAugustines({ push, colliders, spots, town });
  buildNarromineAviationPrecinct({ box, push, strip, flatPoly, plane, boardTexture, colliders, spots });
  // Complete YNRM runway surfaces live separately from the museum's verified geometry.
  const airfield = buildNarromineAirfield(town);
  // Thin, batched agricultural underlay extends real-town visibility to the
  // fictional settlement during aerial traversal; mapped surfaces stay above it.
  const flightLandscape = buildFlightLandscape(root);
  buildNarromineNwDandalooBlock({ box, push, strip, flatPoly, plane, boardTexture, colliders, spots });
  // Named places: a sign over each, and an E-prompt with what it is, its address and any history.
  for (const p of PLACES) {
    if (makeLabel) { const l = makeLabel(p.name, 'interactive'); l.position.set(p.x, 5.4, p.z); l.scale.multiplyScalar(0.8); town.add(l); }
    const text = [p.kindLabel + (p.address ? ' · ' + p.address : ''), p.fact].filter(Boolean).join(' — ');
    spots.push({ key: 'narromine:' + p.name, label: p.name, pos: new THREE.Vector3(p.x, 0, p.z), text });
  }
  pole(-2742, z - 9, 2.4); plane(boardTexture(['Map data', '© OpenStreetMap contributors'], { bg: '#ffffff', fg: '#222222', border: '#222222' }), 2.6, 1.3, -2742, 2.2, z - 9, Eb);

  const materials = new Map();
  const material = (c, side) => { const k = c + ':' + side; if (!materials.has(k)) materials.set(k, createNarromineSurfaceMaterial(c, side)); return materials.get(k); };
  for (const [name, map] of Object.entries(buckets)) for (const [k, geos] of map) {
    const c = typeof k === 'string' ? Number(k.split('|')[0]) : k, geo = mergeGeos(geos); geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, material(c, name === 'town' ? THREE.DoubleSide : THREE.FrontSide));
    mesh.matrixAutoUpdate = false; (name === 'town' ? town : root).add(mesh);
  }
  town.visible = false;
  parent.add(root);
  const update = (pos, airborne = false) => {
    const show = airborne || pos.x < SHOW_WEST_OF;
    if (town.visible !== show) town.visible = show;
    if (show) liDARForest.update(pos, airborne, typeof performance !== 'undefined' ? performance.now() * 0.001 : 0);
  };
  return { group: town, root, colliders, spots, update, airfield, flightLandscape };
}

// Minimal geometry merge (position + normal), avoiding a dependency on BufferGeometryUtils here.
function mergeGeos(geos) {
  let n = 0; for (const g of geos) n += g.index ? g.index.count : g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  for (const g0 of geos) {
    const g = g0.index ? g0.toNonIndexed() : g0; if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position.array, q = g.attributes.normal.array;
    pos.set(p, o); nor.set(q, o); o += p.length; g.dispose(); if (g !== g0) g0.dispose();
  }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return m;
}
