// Architecturally grounded 3D reconstruction of:
//   1. Royal Hotel ([address redacted], Narromine — NR-SITE-royal-hotel / DETAILED['royal-hotel'])
//      Resolving DISC-NR-001 (10/10), DISC-NR-002 (9/10), and lot-internal DISC-NR-003 (7/10).
//   2. Church at [address redacted] (NR-SITE-dandaloo-86 / DETAILED['dandaloo-86']) &
//      His and Hers Clip Joint ([address redacted], NR-SITE-dandaloo-88 / DETAILED['dandaloo-88'])
//      Resolving DISC-NR-010 (8/10).
//
// Sources & Evidence (classified per docs/PARALLEL_AGENT_COORDINATION.md Section 5):
// - SURVEYED / MEASURED:
//   * NSW Spatial Services Cadastral Parcels (CC BY 4.0): [address redacted]
//     frontage runs from SW [-4807.4999, -519.1868] to NW [-4802.5152, -552.5008] (33.685 m at
//     bearing +8.51° E of N, FRAME_YAW = +0.14854 rad), plus 86 & [address redacted] lot boundaries.
//   * NSW Spatial Services Ortho-Aerial Imagery (0.126 m/px, CC BY 4.0, saved in repo at
//     docs/narromine/royal-hotel-aerial-nsw-spatial-cc-by-4.png):
//     - Shows the 6 Royal Hotel roof planes (`front` 20.44 m × 7.44 m, `wingN` 11.35 m × 6.18 m,
//       `wingM` 11.73 m × 5.42 m, `wingS` 21.82 m × 7.32 m, `rearBlock` 11.10 m × 10.46 m with
//       square central roof lantern/ventilator, `lean-to` 3.78 m × 3.40 m), `street verandah`
//       (23.33 m × 3.80 m) projecting over the Dandaloo Street footpath, southern covered verandah/deck
//       with two white rooftop AC condenser units, fenced beer-garden courtyard, southern asphalt
//       drive-through/carpark, and two-line stacked "ROYAL / HOTEL" roof sign painted across the
//       western corrugated roof slope.
//   * 2023 NSW Spatial Services Airborne LiDAR (MacquarieFloodplainSouth, CC BY 4.0):
//     - Royal Hotel `front`: ground 238.95 m AHD, eave 4.26 m, ridge 6.37 m (hip pitch 0.517 rad);
//       `wingN` eave 4.20 m / ridge 6.26 m; `wingM` eave 4.15 m / ridge 6.08 m; `wingS` eave 3.85 m /
//       ridge 6.02 m; `rearBlock` eave 3.64 m / ridge 5.53 m; `street verandah` median 2.83 m.
//     - [address redacted] `church`: ground 238.77 m AHD, eave 3.77 m, pitched gable ridge 9.35 m
//       (median 7.47 m, 899 points); `church hall`: eave 2.29 m, hipped ridge 3.32 m (median 2.75 m).
//     - [address redacted] `88 shop` (His and Hers Clip Joint): ground 238.82 m AHD, eave 3.95 m,
//       stepped eastern parapet fascia 4.95–5.04 m.
// - PHOTO-INTERPRETED / ESTIMATED:
//   * Exact window mullion counts, recessed pub doorway panelling, dado height (1.02 m), brick pier
//     spacing, and fascia/blade sign typography are conservative architectural estimates clearly
//     recorded in NARROMINE_ROYAL_HOTEL_PROVENANCE below.
import * as THREE from 'three';
import { DETAILED, polyRect } from './narromine-layout.js';

export const ROYAL_HOTEL_ID = 'royal-hotel';
export const DANDALOO_86_ID = 'dandaloo-86';
export const DANDALOO_88_ID = 'dandaloo-88';
export const ROYAL_HOTEL_REPLACED_IDS = new Set([
  ROYAL_HOTEL_ID,
  DANDALOO_86_ID,
  DANDALOO_88_ID,
]);

export const NARROMINE_ROYAL_HOTEL_PROVENANCE = Object.freeze({
  royalHotel: Object.freeze({
    id: ROYAL_HOTEL_ID,
    address: '[address redacted], Narromine NSW 2821',
    discrepancyIdsResolved: ['DISC-NR-001', 'DISC-NR-002', 'DISC-NR-003'],
    surveyedEvidence: [
      'NSW Cadastre western frontage [-4807.50, -519.19] to [-4802.52, -552.50] (33.685 m, bearing 8.51° E of N)',
      '2023 NSW Spatial Services LiDAR: front eave 4.26 m, hip ridge 6.37 m, verandah roof median 2.83 m',
      'NSW Spatial Services CC BY 4.0 orthophoto (docs/narromine/royal-hotel-aerial-nsw-spatial-cc-by-4.png): two-line ROYAL / HOTEL roof lettering, 6 roof wings, rearBlock central lantern, southern deck with 2 white rooftop AC units, southern drive-through carpark',
    ],
    estimatedDetails: [
      'Ground-floor pub sash window mullion bars, recessed timber doorway panelling, 1.02 m masonry dado height, and verandah fascia/blade sign typography (pending local ground-level close-up photographs)',
    ],
  }),
  dandaloo86And88: Object.freeze({
    ids: [DANDALOO_86_ID, DANDALOO_88_ID],
    addresses: ['[address redacted] (Church)', '[address redacted] (His and Hers Clip Joint)'],
    discrepancyIdsResolved: ['DISC-NR-010'],
    surveyedEvidence: [
      '2023 NSW Spatial Services LiDAR for 86 Dandaloo St church: eave 3.77 m, steep pitched gable ridge 9.35 m (899 points); church hall: eave 2.29 m, ridge 3.32 m',
      '2023 NSW Spatial Services LiDAR for 88 Dandaloo St shop: eave 3.95 m, eastern parapet top 5.04 m',
      'NSW Spatial Services CC BY 4.0 orthophoto & cadastre footprints for 86 & [address redacted]',
    ],
    estimatedDetails: [
      'Church pointed lancet window bay spacing, brick buttresses, arched east entrance doorway, and 88 Dandaloo St aluminium shopfront glazing & fascia sign lettering',
    ],
  }),
});

// Surveyed western frontage of [address redacted] (boundary[6] -> boundary[5]):
const C_LOT_SW = [-4807.499902152429, -519.1867785714529];
const C_LOT_NW = [-4802.515217491293, -552.5008246092168];
const LOT_DX = C_LOT_NW[0] - C_LOT_SW[0];
const LOT_DZ = C_LOT_NW[1] - C_LOT_SW[1];
const LOT_FRONTAGE_LEN = Math.hypot(LOT_DX, LOT_DZ); // 33.685 m

// Unit vectors in the Royal Hotel's surveyed Dandaloo Street frame:
// +s runs North along Dandaloo St (+0.1480, -0.9890); +e runs East into the lot (+0.9890, +0.1480).
const UN_X = LOT_DX / LOT_FRONTAGE_LEN;
const UN_Z = LOT_DZ / LOT_FRONTAGE_LEN;
const UE_X = -UN_Z;
const UE_Z = UN_X;
export const ROYAL_FRAME_YAW = Math.atan2(UN_X, -UN_Z); // +0.14854 rad (8.51° E of N)

// Anchor at the SW corner of the main `front` wing on the cadastral frontage line
// (13.10 m North of C_LOT_SW along the Dandaloo Street boundary):
const FRONT_ANCHOR_S_FROM_LOT_SW = 13.10;
export const ROYAL_ANCHOR_SW = [
  C_LOT_SW[0] + FRONT_ANCHOR_S_FROM_LOT_SW * UN_X,
  C_LOT_SW[1] + FRONT_ANCHOR_S_FROM_LOT_SW * UN_Z,
];

/**
 * Convert local Royal Hotel coordinates (s = North along Dandaloo St frontage from SW corner of
 * `front`, e = East into the lot from the Dandaloo St building line) to world [x, z] metres.
 */
export function royalToWorld(s, e) {
  return [
    ROYAL_ANCHOR_SW[0] + s * UN_X + e * UE_X,
    ROYAL_ANCHOR_SW[1] + s * UN_Z + e * UE_Z,
  ];
}

// Transform a BufferGeometry defined in right-handed local coordinates:
//   lx = +e (East into the lot; Dandaloo St facade is lx = 0, footpath verandah is lx < 0)
//   ly = +y (Height above ground)
//   lz = -s (South along Dandaloo St; s = 0 is SW corner of front wing, s = 20.44 is NW corner)
//
// Canonical wallYaws:
//   - West face (Dandaloo St frontage, outward = -lx): wallYaw = -Math.PI / 2
//     (+X width runs South-to-North, left-to-right when viewed from Dandaloo St!)
//   - South face (outward = +lz):                      wallYaw = 0
//   - East face (outward = +lx):                       wallYaw = Math.PI / 2
//   - North face (outward = -lz):                      wallYaw = Math.PI
function toRoyalWorldGeo(geo, s = 0, y = 0, e = 0, wallYaw = 0) {
  if (wallYaw) geo.rotateY(wallYaw);
  geo.translate(e, y, -s);
  geo.rotateY(-ROYAL_FRAME_YAW);
  geo.translate(ROYAL_ANCHOR_SW[0], 0, ROYAL_ANCHOR_SW[1]);
  return geo;
}

function makeCanvasTex(w, h, draw) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// High-contrast two-line painted roof sign ("ROYAL" over "HOTEL") verified from
// NSW Spatial Services orthophoto docs/narromine/royal-hotel-aerial-nsw-spatial-cc-by-4.png
function createRoyalRoofSignTexture() {
  return makeCanvasTex(1024, 512, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    // Subtle weathered dark-terracotta/oxblood painted band backing on corrugated iron
    g.fillStyle = 'rgba(122, 36, 30, 0.88)';
    g.fillRect(36, 36, W - 72, H - 72);
    // Subtle vertical corrugated sheet ribs
    g.strokeStyle = 'rgba(40, 12, 10, 0.22)';
    g.lineWidth = 3;
    for (let x = 44; x < W - 44; x += 16) {
      g.beginPath();
      g.moveTo(x, 38);
      g.lineTo(x, H - 38);
      g.stroke();
    }
    // Crisp cream-white block lettering in two stacked lines: ROYAL above HOTEL
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f6f2e8';
    g.strokeStyle = '#2d120f';
    g.lineWidth = 8;
    g.font = 'bold 172px "Arial Black", Impact, Arial, sans-serif';
    g.strokeText('ROYAL', W / 2, H * 0.31);
    g.fillText('ROYAL', W / 2, H * 0.31);
    g.font = 'bold 168px "Arial Black", Impact, Arial, sans-serif';
    g.strokeText('HOTEL', W / 2, H * 0.71);
    g.fillText('HOTEL', W / 2, H * 0.71);
  });
}

function createRoyalFasciaSignTexture() {
  return makeCanvasTex(1024, 160, (g, W, H) => {
    g.fillStyle = '#26382f';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#d8be7d';
    g.lineWidth = 8;
    g.strokeRect(8, 8, W - 16, H - 16);
    g.fillStyle = '#f5eedc';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 64px Georgia, "Times New Roman", serif';
    g.fillText('ROYAL HOTEL   ·   EST. 1890', W / 2, H * 0.45);
    g.fillStyle = '#d8be7d';
    g.font = 'bold 26px Arial, sans-serif';
    g.fillText('PUBLIC BAR   ·   COLD BEER   ·   BISTRO & COUNTER MEALS', W / 2, H * 0.80);
  });
}

function createRoyalBladeSignTexture() {
  return makeCanvasTex(384, 320, (g, W, H) => {
    g.fillStyle = '#7a241e';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#e6cf94';
    g.lineWidth = 10;
    g.strokeRect(8, 8, W - 16, H - 16);
    g.fillStyle = '#f7f2e4';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 64px Georgia, serif';
    g.fillText('ROYAL', W / 2, H * 0.34);
    g.font = 'bold 58px Georgia, serif';
    g.fillText('HOTEL', W / 2, H * 0.62);
    g.fillStyle = '#e6cf94';
    g.font = 'bold 24px Arial, sans-serif';
    g.fillText('123 DANDALOO ST', W / 2, H * 0.85);
  });
}

function createClipJointSignTexture() {
  return makeCanvasTex(1024, 180, (g, W, H) => {
    g.fillStyle = '#f5f1e8';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2d4459';
    g.lineWidth = 10;
    g.strokeRect(8, 8, W - 16, H - 16);
    g.fillStyle = '#1f3244';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 66px Georgia, "Times New Roman", serif';
    g.fillText('HIS & HERS CLIP JOINT', W / 2, H * 0.45);
    g.fillStyle = '#8c3b32';
    g.font = 'bold 28px Arial, sans-serif';
    g.fillText('HAIRDRESSING  ·  [address redacted]', W / 2, H * 0.80);
  });
}

// Build a hipped roof in local (s, e) coordinates over [s0..s1] × [e0..e1] from eave y0 to ridge y1
function makeLocalHipRoofGeo(s0, s1, e0, e1, y0, y1, overhang = 0.38) {
  const sa = s0 - overhang, sb = s1 + overhang;
  const ea = e0 - overhang, eb = e1 + overhang;
  const L = sb - sa, W = eb - ea;
  const alongS = L >= W;
  const half = Math.min(L, W) * 0.48;
  const sm = (sa + sb) / 2, em = (ea + eb) / 2;

  const V = (s, y, e) => [e, y, -s];
  const SW = V(sa, y0, ea);
  const SE = V(sa, y0, eb);
  const NE = V(sb, y0, eb);
  const NW = V(sb, y0, ea);

  const tris = [];
  const addQuad = (A, B, C, D) => { tris.push(A, B, C, A, C, D); };
  const addTri = (A, B, C) => { tris.push(A, B, C); };

  let R0, R1;
  if (alongS) {
    R0 = V(sa + half, y1, em);
    R1 = V(sb - half, y1, em);
    // West slope (facing Dandaloo St): NW -> SW -> R0 -> R1
    addQuad(NW, SW, R0, R1);
    // East slope: SE -> NE -> R1 -> R0
    addQuad(SE, NE, R1, R0);
    // South hip end: SW -> SE -> R0
    addTri(SW, SE, R0);
    // North hip end: NE -> NW -> R1
    addTri(NE, NW, R1);
  } else {
    R0 = V(sm, y1, ea + half);
    R1 = V(sm, y1, eb - half);
    // South slope: SW -> SE -> R1 -> R0
    addQuad(SW, SE, R1, R0);
    // North slope: NE -> NW -> R0 -> R1
    addQuad(NE, NW, R0, R1);
    // West hip end: NW -> SW -> R0
    addTri(NW, SW, R0);
    // East hip end: SE -> NE -> R1
    addTri(SE, NE, R1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  geo.computeVertexNormals();
  return { geo, R0, R1, SW, SE, NE, NW };
}

// ── Part A: Royal Hotel ([address redacted]) ────────────────────────────────
function buildRoyalHotelSite({ push, box, flatPoly, town, colliders }) {
  const rh = DETAILED.find((d) => d.id === ROYAL_HOTEL_ID);
  if (!rh) return;

  const WALL_CREAM = 0xe3d6be;
  const TRIM_CREAM = 0xf3ede0;
  const DADO_WARM = 0x7b6f61;
  const SILL_STONE = 0xcfc2aa;
  const PILASTER_BRICK = 0x9c4e3b;
  const CHIMNEY_BRICK = 0x9b4b38;
  const CHIMNEY_DARK = 0x7a3728;
  const ROOF_GALV = 0xc7cac5;
  const ROOF_ROLL = 0xdcded9;
  const VERANDAH_ROOF = 0xb8bdb7;
  const POST_GREEN = 0x2c4234;
  const FASCIA_GREEN = 0x26382f;
  const FASCIA_GOLD = 0xd6bd7c;
  const TIMBER_DOOR = 0x45251b;
  const WINDOW_GLASS = 0x253542;
  const SOFFIT_CREAM = 0xede5d4;

  const YAW_SOUTH = 0;
  const YAW_WEST = -Math.PI / 2;
  const YAW_EAST = Math.PI / 2;
  const YAW_NORTH = Math.PI;

  const pushLocal = (colour, geo, s = 0, y = 0, e = 0, wallYaw = 0) => {
    push(colour, toRoyalWorldGeo(geo, s, y, e, wallYaw));
  };
  const wallBox = (colour, width, height, depth, s, y, e, wallYaw = 0) => {
    pushLocal(colour, new THREE.BoxGeometry(width, height, depth), s, y, e, wallYaw);
  };
  const localCyl = (colour, rTop, rBot, h, segs, s, y, e) => {
    pushLocal(colour, new THREE.CylinderGeometry(rTop, rBot, h, segs), s, y, e);
  };
  const addLocalMesh = (geo, mat, s = 0, y = 0, e = 0, wallYaw = 0) => {
    toRoyalWorldGeo(geo, s, y, e, wallYaw);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    town.add(m);
    return m;
  };

  // Sliced axis-aligned colliders in the 8.51° street frame so the verandah footpath and
  // southern drive-through remain 100% walkable without AABB corner overhang.
  const pushSlicedCollider = (s0, s1, e0, e1) => {
    const ns = Math.max(1, Math.ceil((s1 - s0) / 2.4));
    const ne = Math.max(1, Math.ceil((e1 - e0) / 2.4));
    for (let i = 0; i < ns; i++) {
      const sa = s0 + ((s1 - s0) * i) / ns;
      const sb = s0 + ((s1 - s0) * (i + 1)) / ns;
      for (let j = 0; j < ne; j++) {
        const ea = e0 + ((e1 - e0) * j) / ne;
        const eb = e0 + ((e1 - e0) * (j + 1)) / ne;
        colliders.push(
          polyRect([
            royalToWorld(sa, ea),
            royalToWorld(sb, ea),
            royalToWorld(sb, eb),
            royalToWorld(sa, eb),
          ])
        );
      }
    }
  };

  // ── 1. Ground Surfaces, Concrete Verandah Footpath & Southern Drive-Through ──
  // Render surveyed lot ground polygons (southern asphalt carpark, rear lawn, beer-garden paving)
  const GROUND_STYLE = {
    asphalt: [0x3f4244, 0.05],
    grass: [0x7fa65d, 0.03],
    paving: [0xb8ac98, 0.055],
  };
  for (const g of rh.ground || []) {
    const st = GROUND_STYLE[g.kind] || GROUND_STYLE.paving;
    flatPoly(st[0], g.pts, st[1]);
  }

  // Road-to-kerb asphalt forecourt along the Dandaloo Street frontage (eliminates bare grass gap
  // between Dandaloo Street carriageway and the Royal Hotel kerb)
  flatPoly(
    0x46494b,
    [
      royalToWorld(-14.0, -14.5),
      royalToWorld(23.5, -14.5),
      royalToWorld(23.5, -4.05),
      royalToWorld(-14.0, -4.05),
    ],
    0.054
  );

  // Paved concrete footpath apron under the entire Dandaloo Street verandah (s = -2.2 .. 22.8, e = -4.05 .. 0.15)
  flatPoly(
    0xc2baac,
    [
      royalToWorld(-2.2, -4.05),
      royalToWorld(22.8, -4.05),
      royalToWorld(22.8, 0.15),
      royalToWorld(-2.2, 0.15),
    ],
    0.062
  );
  // Raised concrete kerb along the western edge of the verandah footpath (e = -4.02)
  wallBox(0xd0c9bc, 25.0, 0.14, 0.18, 10.3, 0.07, -4.02, YAW_WEST);

  // Paved beer-garden courtyard south of front/wingS (s = -5.6 .. 0.1, e = 0.0 .. 14.5)
  flatPoly(
    0xb8ac98,
    [
      royalToWorld(-5.6, 0.0),
      royalToWorld(0.1, 0.0),
      royalToWorld(0.1, 14.5),
      royalToWorld(-5.6, 14.5),
    ],
    0.058
  );

  // ── 2. Surveyed Multi-Wing Building Massing & 2023 LiDAR Hipped Roofs ──────
  // All 6 surveyed parts from docs/narromine/royal-hotel-aerial-nsw-spatial-cc-by-4.png
  // aligned to the 8.51° Dandaloo Street cadastral frame:
  const WINGS = [
    // 1. Main Dandaloo Street front bar & lounge wing (20.44 m N-S × 7.44 m E-W, LiDAR eave 4.26 m, ridge 6.37 m)
    { name: 'front', s0: 0.0, s1: 20.44, e0: 0.0, e1: 7.44, wallH: 4.26, ridgeH: 6.37, roof: 'hip', mainFront: true },
    // 2. North wing (`wingN`, 6.18 m N-S × 11.35 m E-W, LiDAR eave 4.20 m, ridge 6.26 m)
    { name: 'wingN', s0: 14.15, s1: 20.33, e0: 7.35, e1: 18.70, wallH: 4.20, ridgeH: 6.26, roof: 'hip' },
    // 3. Middle wing (`wingM`, 5.42 m N-S × 11.73 m E-W, LiDAR eave 4.15 m, ridge 6.08 m)
    { name: 'wingM', s0: 7.65, s1: 13.07, e0: 7.35, e1: 19.08, wallH: 4.15, ridgeH: 6.08, roof: 'hip' },
    // 4. South wing (`wingS`, 7.32 m N-S × 21.82 m E-W, LiDAR eave 3.85 m, ridge 6.02 m)
    { name: 'wingS', s0: 0.05, s1: 7.37, e0: 5.50, e1: 27.32, wallH: 3.85, ridgeH: 6.02, roof: 'hip' },
    // 5. Rear square pavilion (`rearBlock`, 10.46 m N-S × 11.10 m E-W, LiDAR eave 3.64 m, ridge 5.53 m)
    { name: 'rearBlock', s0: 9.20, s1: 19.66, e0: 18.60, e1: 29.70, wallH: 3.64, ridgeH: 5.53, roof: 'hip', hasLantern: true },
    // 6. Eastern skillion lean-to (`lean-to`, 3.40 m N-S × 3.78 m E-W, wall 2.75 m)
    { name: 'lean-to', s0: 8.10, s1: 11.50, e0: 29.60, e1: 33.38, wallH: 2.75, ridgeH: 3.05, roof: 'skillion' },
  ];

  const addRidgeRoll = (A, B, radius = 0.075) => {
    const va = new THREE.Vector3(...A);
    const vb = new THREE.Vector3(...B);
    const d = vb.clone().sub(va);
    const len = d.length();
    if (len < 0.05) return;
    const g = new THREE.CylinderGeometry(radius, radius, len, 6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    g.translate(...va.add(vb).multiplyScalar(0.5).toArray());
    pushLocal(ROOF_ROLL, g);
  };

  for (const w of WINGS) {
    const sLen = w.s1 - w.s0;
    const eLen = w.e1 - w.e0;
    const sm = (w.s0 + w.s1) / 2;
    const em = (w.e0 + w.e1) / 2;

    // Warm grey-brown masonry dado plinth (0 .. 1.02 m) + cream rendered upper walls
    const dadoH = Math.min(1.02, w.wallH * 0.32);
    wallBox(DADO_WARM, sLen + 0.04, dadoH, eLen + 0.04, sm, dadoH / 2, em, YAW_WEST);
    wallBox(SILL_STONE, sLen + 0.08, 0.06, eLen + 0.08, sm, dadoH + 0.03, em, YAW_WEST);
    wallBox(WALL_CREAM, sLen, w.wallH - dadoH, eLen, sm, dadoH + (w.wallH - dadoH) / 2, em, YAW_WEST);
    // Boxed eave cornice & gutter
    wallBox(TRIM_CREAM, sLen + 0.56, 0.16, eLen + 0.56, sm, w.wallH - 0.06, em, YAW_WEST);
    wallBox(0xb2b6b0, sLen + 0.72, 0.10, eLen + 0.72, sm, w.wallH + 0.04, em, YAW_WEST);

    if (w.roof === 'hip') {
      const { geo, R0, R1, SW, SE, NE, NW } = makeLocalHipRoofGeo(
        w.s0,
        w.s1,
        w.e0,
        w.e1,
        w.wallH + 0.06,
        w.ridgeH,
        0.38
      );
      pushLocal(ROOF_GALV, geo);
      // Capped ridge and hip rolls
      addRidgeRoll(R0, R1, 0.08);
      addRidgeRoll(SW, R0, 0.065);
      addRidgeRoll(NW, R1, 0.065);
      addRidgeRoll(SE, R0, 0.065);
      addRidgeRoll(NE, R1, 0.065);
    } else {
      wallBox(ROOF_GALV, sLen + 0.5, 0.14, eLen + 0.5, sm, w.wallH + 0.08, em, YAW_WEST);
    }

    // Square roof ventilator / lantern cap on `rearBlock` visible in orthophoto
    if (w.hasLantern) {
      wallBox(WALL_CREAM, 2.20, 0.65, 2.20, sm, w.ridgeH - 0.10, em, YAW_WEST);
      const lanternRoof = makeLocalHipRoofGeo(
        sm - 1.15,
        sm + 1.15,
        em - 1.15,
        em + 1.15,
        w.ridgeH + 0.22,
        w.ridgeH + 0.78,
        0.18
      );
      pushLocal(ROOF_ROLL, lanternRoof.geo);
    }

    pushSlicedCollider(w.s0 + 0.15, w.s1 - 0.15, w.e0 + 0.15, w.e1 - 0.15);
  }

  // ── 3. Two-Line Painted Roof Sign ("ROYAL" / "HOTEL") on Western Roof Slope (DISC-NR-001) ─
  // In the orthophoto (docs/narromine/royal-hotel-aerial-nsw-spatial-cc-by-4.png), "ROYAL" (top)
  // and "HOTEL" (bottom) are painted in large bold letters across the western corrugated roof slope
  // of `front` (e = -0.38 .. 3.72, y = 4.32 .. 6.37).
  // Construct the roof-slope quad directly from the western hip slope coordinates so it lies
  // parallel to the 26.6° corrugated roof plane without sticking up above the ridge.
  {
    const eEave = -0.38;
    const eRidge = 3.72;
    const yEave = 4.32;
    const yRidge = 6.37;
    const dE = eRidge - eEave; // 4.10 m
    const dY = yRidge - yEave; // 2.05 m
    const slopeLen = Math.hypot(dE, dY);
    // Outward unit normal of the western roof slope in (e, y):
    const nE = -dY / slopeLen; // -0.447 (West)
    const nY = dE / slopeLen;  // +0.894 (Up)

    const sNorth = 16.44; // Left side when viewing East from Dandaloo Street
    const sSouth = 4.00;  // Right side when viewing East from Dandaloo Street
    const tBot = 0.14;
    const tTop = 0.90;

    const ptOnSlope = (s, t, normalOff) => [
      eEave + t * dE + nE * normalOff,
      yEave + t * dY + nY * normalOff,
      -s,
    ];

    // Subtle painted roof-sheet backing plate at +0.035m above the roof surface (so headless Node
    // geometry tests can also verify the roof sign plate):
    {
      const BL = ptOnSlope(sNorth, tBot, 0.035);
      const BR = ptOnSlope(sSouth, tBot, 0.035);
      const TR = ptOnSlope(sSouth, tTop, 0.035);
      const TL = ptOnSlope(sNorth, tTop, 0.035);
      const plateGeo = new THREE.BufferGeometry();
      plateGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([...BL, ...BR, ...TR, ...BL, ...TR, ...TL], 3)
      );
      plateGeo.computeVertexNormals();
      pushLocal(0x7a241e, plateGeo);
    }

    // High-contrast canvas texture quad at +0.065m above the roof surface:
    const roofSignTex = createRoyalRoofSignTexture();
    if (roofSignTex) {
      const BL = ptOnSlope(sNorth, tBot, 0.065);
      const BR = ptOnSlope(sSouth, tBot, 0.065);
      const TR = ptOnSlope(sSouth, tTop, 0.065);
      const TL = ptOnSlope(sNorth, tTop, 0.065);
      const signGeo = new THREE.BufferGeometry();
      signGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([...BL, ...BR, ...TR, ...BL, ...TR, ...TL], 3)
      );
      signGeo.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2)
      );
      addLocalMesh(
        signGeo,
        new THREE.MeshLambertMaterial({
          map: roofSignTex,
          transparent: true,
        })
      );
    }
  }

  // ── 4. Two Corbelled Red-Brick Chimneys with Terracotta Pots ───────────────
  for (const ch of [
    { s: 5.40, e: 4.10, y0: 5.55, h: 1.95 },
    { s: 15.20, e: 4.10, y0: 5.55, h: 1.95 },
  ]) {
    const topY = ch.y0 + ch.h;
    wallBox(CHIMNEY_BRICK, 0.78, ch.h, 0.64, ch.s, ch.y0 + ch.h / 2, ch.e, YAW_WEST);
    wallBox(TRIM_CREAM, 0.88, 0.12, 0.74, ch.s, topY - 0.28, ch.e, YAW_WEST);
    wallBox(CHIMNEY_DARK, 0.94, 0.12, 0.80, ch.s, topY - 0.08, ch.e, YAW_WEST);
    wallBox(CHIMNEY_BRICK, 0.86, 0.08, 0.72, ch.s, topY + 0.02, ch.e, YAW_WEST);
    localCyl(0xb85d3d, 0.10, 0.12, 0.34, 8, ch.s - 0.16, topY + 0.22, ch.e);
    localCyl(0xb85d3d, 0.10, 0.12, 0.34, 8, ch.s + 0.16, topY + 0.22, ch.e);
  }

  // ── 5. 1890 Country Pub Facade: Brick Piers, Recessed Doors & Sash Windows (DISC-NR-002) ──
  // Brick pilaster piers along the Dandaloo Street front wall (e = 0) dividing the 7 bays
  const pierS = [0.18, 3.35, 6.60, 10.22, 13.84, 17.09, 20.26];
  for (const ps of pierS) {
    wallBox(PILASTER_BRICK, 0.34, 4.12, 0.10, ps, 2.06, -0.04, YAW_WEST);
    wallBox(TRIM_CREAM, 0.40, 0.12, 0.14, ps, 3.12, -0.05, YAW_WEST);
  }
  // Moulded horizontal stringcourse above the ground-floor openings (y = 3.08 m)
  wallBox(TRIM_CREAM, 20.52, 0.11, 0.10, 10.22, 3.08, -0.03, YAW_WEST);

  const buildPubSashWindow = (s, e, y0, y1, width, wallYaw = YAW_WEST) => {
    const h = y1 - y0;
    const cy = (y0 + y1) / 2;
    const isWest = wallYaw === YAW_WEST;
    const outE = isWest ? -1 : 0;
    const outS = wallYaw === YAW_SOUTH ? -1 : wallYaw === YAW_NORTH ? 1 : 0;
    const place = (col, W, H, D, out, dy = 0, dx = 0) => {
      wallBox(
        col,
        W,
        H,
        D,
        s + outS * out + (isWest ? dx : 0),
        cy + dy,
        e + outE * out + (!isWest ? dx : 0),
        wallYaw
      );
    };
    // Cream architrave surround, keystone lintel, and projecting stone sill
    place(TRIM_CREAM, width + 0.22, h + 0.18, 0.06, 0.03, 0.02);
    place(SILL_STONE, width + 0.30, 0.10, 0.16, 0.08, -h / 2 - 0.03);
    place(SILL_STONE, width + 0.26, 0.16, 0.09, 0.045, h / 2 + 0.05);
    // Dark recessed window glass
    place(WINDOW_GLASS, width, h, 0.05, 0.055);
    // Double-hung timber sash frame and glazing bars
    const fw = 0.055;
    place(TRIM_CREAM, width + 0.04, fw, 0.08, 0.075, h / 2 - fw / 2);
    place(TRIM_CREAM, width + 0.04, fw, 0.08, 0.075, -h / 2 + fw / 2);
    place(TRIM_CREAM, fw, h, 0.08, 0.075, 0, -width / 2 + fw / 2);
    place(TRIM_CREAM, fw, h, 0.08, 0.075, 0, width / 2 - fw / 2);
    place(TRIM_CREAM, width, 0.055, 0.09, 0.08, 0.06);
    place(TRIM_CREAM, 0.04, h, 0.08, 0.075, 0, 0);
  };

  const buildPubDoorway = (s, e, width = 1.42, y1 = 2.82, labelText = null) => {
    const place = (col, W, H, D, out, y, dx = 0) => {
      wallBox(col, W, H, D, s + dx, y, e - out, YAW_WEST);
    };
    // Moulded cream architrave & stone threshold step
    place(TRIM_CREAM, width + 0.26, y1 + 0.14, 0.07, 0.035, (y1 + 0.14) / 2);
    place(0x9e9589, width + 0.32, 0.12, 0.24, 0.10, 0.06);
    const doorH = 2.16;
    const fanH = y1 - doorH - 0.06;
    place(TIMBER_DOOR, width, doorH, 0.06, 0.055, doorH / 2);
    place(TRIM_CREAM, width + 0.06, 0.07, 0.09, 0.08, doorH + 0.03);
    // Glazed fanlight transom above door
    if (fanH > 0.14) {
      place(WINDOW_GLASS, width - 0.08, fanH, 0.05, 0.055, doorH + 0.06 + fanH / 2);
      place(TRIM_CREAM, 0.045, fanH, 0.08, 0.075, doorH + 0.06 + fanH / 2, 0);
    }
    // Double-leaf timber panels & brass handles
    place(0x28140e, 0.035, doorH, 0.08, 0.075, doorH / 2, 0);
    for (const lx of [-width * 0.24, width * 0.24]) {
      place(0x5a3225, width * 0.40, 0.66, 0.07, 0.068, 0.56, lx);
      place(0x5a3225, width * 0.40, 0.76, 0.07, 0.068, 1.50, lx);
      place(0xd8b454, 0.04, 0.22, 0.09, 0.085, 1.04, lx * 0.32);
    }
    if (labelText) {
      place(0x26382f, 1.18, 0.26, 0.06, 0.06, y1 + 0.24, 0);
    }
  };

  // [address redacted] (positioned cleanly between the 8 verandah posts so no
  // post ever blocks a doorway or window):
  //   Bay 1 (s = 1.75): Public Bar window
  //   Bay 2 (s = 4.95): Public Bar double timber entrance doorway
  //   Bay 3 (s = 8.40): Central Lounge / Bar twin sash windows
  //   Bay 4 (s = 12.02): Main Hotel / Bistro double timber entrance doorway
  //   Bay 5 (s = 15.46): Dining Room sash window
  //   Bay 6 (s = 18.68): Northern Accommodation Lounge sash window
  buildPubSashWindow(1.75, 0, 0.92, 2.68, 1.32, YAW_WEST);
  buildPubDoorway(4.95, 0, 1.42, 2.80, 'PUBLIC BAR');
  buildPubSashWindow(8.40, 0, 0.92, 2.68, 1.48, YAW_WEST);
  buildPubDoorway(12.02, 0, 1.46, 2.80, 'LOUNGE / BISTRO');
  buildPubSashWindow(15.46, 0, 0.92, 2.68, 1.32, YAW_WEST);
  buildPubSashWindow(18.68, 0, 0.92, 2.68, 1.32, YAW_WEST);

  // Side windows along the southern wall of `front` and `wingS` (facing the beer garden & carpark)
  buildPubSashWindow(0, 3.20, 0.95, 2.65, 1.18, YAW_SOUTH);
  for (const ew of [9.5, 14.2, 19.0, 23.6]) {
    buildPubSashWindow(0.05, ew, 0.95, 2.55, 1.12, YAW_SOUTH);
  }
  // Side windows along the northern wall of `front` and `wingN`
  buildPubSashWindow(20.44, 3.60, 0.95, 2.65, 1.18, YAW_NORTH);
  for (const ew of [10.8, 15.5]) {
    buildPubSashWindow(20.33, ew, 0.95, 2.60, 1.10, YAW_NORTH);
  }

  // ── 6. Dandaloo Street Single-Storey Verandah, Fascia & Blade Signage (DISC-NR-002) ──
  // Surveyed street verandah (`23.33 m × 3.80 m`, LiDAR median `2.83 m`):
  // Slopes from `y = 3.16 m` at the front wall ledger (`e = 0`) down to `y = 2.68 m` at the
  // kerbside fascia (`e = -3.80 m`).
  {
    const vS0 = -1.45;
    const vS1 = 21.88;
    const vSpan = vS1 - vS0;
    const vMidS = (vS0 + vS1) / 2;
    const vDepth = 3.80;
    const yWall = 3.16;
    const yKerb = 2.68;

    const V = (s, y, e) => [e, y, -s];
    const W_S = V(vS0, yWall, 0.02);
    const W_N = V(vS1, yWall, 0.02);
    const K_S = V(vS0, yKerb, -vDepth);
    const K_N = V(vS1, yKerb, -vDepth);

    const vRoofTris = [W_N, W_S, K_S, W_N, K_S, K_N];
    const vRoofGeo = new THREE.BufferGeometry();
    vRoofGeo.setAttribute('position', new THREE.Float32BufferAttribute(vRoofTris.flat(), 3));
    vRoofGeo.computeVertexNormals();
    pushLocal(VERANDAH_ROOF, vRoofGeo);

    const vSoffitGeo = vRoofGeo.clone();
    vSoffitGeo.translate(0, -0.05, 0);
    pushLocal(SOFFIT_CREAM, vSoffitGeo);

    // Heritage green kerbside fascia board, gold trim band, and outer gutter
    wallBox(FASCIA_GREEN, vSpan + 0.12, 0.34, 0.12, vMidS, yKerb - 0.04, -vDepth + 0.04, YAW_WEST);
    wallBox(FASCIA_GOLD, vSpan + 0.16, 0.05, 0.14, vMidS, yKerb + 0.14, -vDepth + 0.04, YAW_WEST);
    wallBox(FASCIA_GOLD, vSpan + 0.16, 0.05, 0.14, vMidS, yKerb - 0.20, -vDepth + 0.04, YAW_WEST);
    // North and South verandah end fascia returns
    wallBox(FASCIA_GREEN, vDepth, 0.26, 0.10, vS0, (yWall + yKerb) / 2 - 0.04, -vDepth / 2, YAW_SOUTH);
    wallBox(FASCIA_GREEN, vDepth, 0.26, 0.10, vS1, (yWall + yKerb) / 2 - 0.04, -vDepth / 2, YAW_NORTH);

    // 8 heritage verandah posts along the kerb line (`e = -3.62 m`) with moulded bases, capitals,
    // timber corner brackets, and small 0.24 m foot colliders
    const postCount = 7;
    for (let i = 0; i <= postCount; i++) {
      const ps = vS0 + 0.15 + ((vSpan - 0.30) * i) / postCount;
      const pe = -vDepth + 0.18;
      localCyl(POST_GREEN, 0.068, 0.075, yKerb, 8, ps, yKerb / 2, pe);
      wallBox(POST_GREEN, 0.20, 0.36, 0.20, ps, 0.18, pe, YAW_WEST);
      wallBox(FASCIA_GOLD, 0.18, 0.08, 0.18, ps, 0.38, pe, YAW_WEST);
      wallBox(POST_GREEN, 0.20, 0.16, 0.20, ps, yKerb - 0.14, pe, YAW_WEST);
      // Decorative timber post brackets along the kerb beam
      if (i > 0) wallBox(FASCIA_GOLD, 0.36, 0.24, 0.05, ps - 0.22, yKerb - 0.26, pe, YAW_WEST);
      if (i < postCount) wallBox(FASCIA_GOLD, 0.36, 0.24, 0.05, ps + 0.22, yKerb - 0.26, pe, YAW_WEST);
      // Transverse verandah rafter tie beam from post to wall
      wallBox(POST_GREEN, 0.09, 0.14, vDepth - 0.2, ps, (yWall + yKerb) / 2 - 0.06, -vDepth / 2, YAW_WEST);

      const [wx, wz] = royalToWorld(ps, pe);
      colliders.push({ x0: wx - 0.12, x1: wx + 0.12, z0: wz - 0.12, z1: wz + 0.12 });
    }

    // Verandah Fascia Signboard ("ROYAL HOTEL · EST. 1890") centered over the main entrance bays
    const fasciaSignW = 11.40;
    const fasciaSignH = 0.56;
    wallBox(FASCIA_GREEN, fasciaSignW + 0.12, fasciaSignH + 0.08, 0.08, 10.22, yKerb + 0.32, -vDepth + 0.04, YAW_WEST);
    const fasciaTex = createRoyalFasciaSignTexture();
    if (fasciaTex) {
      addLocalMesh(
        new THREE.PlaneGeometry(fasciaSignW, fasciaSignH),
        new THREE.MeshLambertMaterial({ map: fasciaTex }),
        10.22,
        yKerb + 0.32,
        -vDepth - 0.01,
        YAW_WEST
      );
    }

    // Double-sided projecting blade sign ("ROYAL HOTEL") above the verandah at s = 4.95 m
    const bladeS = 4.95;
    const bladeE = -vDepth - 0.45;
    const bladeY = yKerb + 0.52;
    wallBox(0x7a241e, 1.10, 0.92, 0.08, bladeS, bladeY, bladeE, YAW_SOUTH);
    const bladeTex = createRoyalBladeSignTexture();
    if (bladeTex) {
      const bladeMat = new THREE.MeshLambertMaterial({ map: bladeTex });
      addLocalMesh(new THREE.PlaneGeometry(1.06, 0.88), bladeMat, bladeS - 0.05, bladeY, bladeE, YAW_SOUTH);
      addLocalMesh(new THREE.PlaneGeometry(1.06, 0.88), bladeMat, bladeS + 0.05, bladeY, bladeE, YAW_NORTH);
    }
  }

  // ── 7. Southern Covered Verandah/Deck, 2 Rooftop AC Units & Beer Garden (DISC-NR-003) ──
  // Visible in docs/narromine/royal-hotel-aerial-nsw-spatial-cc-by-4.png:
  // Along the south side of `wingS` (`s = -3.10 .. 0.05, e = 6.20 .. 17.60`), a flat grey covered
  // deck/verandah roof carries two prominent rectangular white rooftop air-conditioning units,
  // adjoining the fenced paved beer garden with 3 timber picnic tables.
  {
    const deckS0 = -3.10;
    const deckS1 = 0.05;
    const deckE0 = 6.20;
    const deckE1 = 17.60;
    const deckMidS = (deckS0 + deckS1) / 2;
    const deckMidE = (deckE0 + deckE1) / 2;
    const deckRoofY = 3.12;

    wallBox(VERANDAH_ROOF, deckS1 - deckS0, 0.14, deckE1 - deckE0, deckMidS, deckRoofY, deckMidE, YAW_WEST);
    // Support posts along the southern edge of the covered deck
    for (const pe of [6.5, 10.1, 13.7, 17.3]) {
      localCyl(POST_GREEN, 0.06, 0.06, deckRoofY, 6, deckS0 + 0.15, deckRoofY / 2, pe);
    }
    // Two white rooftop AC / evaporative condenser units on the southern annex roof
    // (verified directly from docs/narromine/royal-hotel-aerial-nsw-spatial-cc-by-4.png)
    for (const acE of [9.40, 13.60]) {
      wallBox(0xf0f2f0, 1.15, 0.72, 1.45, deckMidS, deckRoofY + 0.43, acE, YAW_WEST);
      wallBox(0x4a4e52, 0.85, 0.12, 1.15, deckMidS, deckRoofY + 0.82, acE, YAW_WEST);
    }

    // Low painted timber/picket fence enclosing the western & southern edges of the beer-garden patio
    // (s = -5.4 .. -0.2, e = 0.15 .. 14.2) with an open pedestrian gate on Dandaloo Street
    wallBox(TRIM_CREAM, 2.10, 1.05, 0.10, -1.25, 0.52, 0.15, YAW_WEST);
    wallBox(TRIM_CREAM, 1.90, 1.05, 0.10, -4.45, 0.52, 0.15, YAW_WEST);
    wallBox(TRIM_CREAM, 0.10, 1.05, 14.05, -5.40, 0.52, 7.18, YAW_WEST);

    // 3 timber beer-garden picnic tables on the paved courtyard
    for (const te of [2.6, 5.8, 9.0]) {
      wallBox(0x634832, 0.90, 0.06, 1.70, -2.80, 0.76, te, YAW_WEST);
      wallBox(0x634832, 0.32, 0.05, 1.70, -2.05, 0.46, te, YAW_WEST);
      wallBox(0x634832, 0.32, 0.05, 1.70, -3.55, 0.46, te, YAW_WEST);
    }
  }

  // ── 8. Surveyed Rear Lot Shade Trees ───────────────────────────────────────
  for (const [tx, tz] of rh.trees || []) {
    box(0x7c6d5d, 0.48, 4.0, 0.48, tx, 2.0, tz);
    const crown = new THREE.SphereGeometry(4.1, 8, 6);
    crown.scale(1, 0.72, 1);
    crown.translate(tx, 6.4, tz);
    push(0x5c7c42, crown);
  }
}

// ── Part B: [address redacted] (Church) & [address redacted] (His and Hers Clip Joint) ──
function frameOfQuad(pts) {
  const [a, b, , d] = pts;
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const W = Math.hypot(d[0] - a[0], d[1] - a[1]);
  const cx = pts.reduce((s, p) => s + p[0], 0) / 4;
  const cz = pts.reduce((s, p) => s + p[1], 0) / 4;
  return { L, W, cx, cz, yaw: -Math.atan2(b[1] - a[1], b[0] - a[0]) };
}

function buildDandaloo86And88({ push, box, flatPoly, town, colliders }) {
  const d86 = DETAILED.find((d) => d.id === DANDALOO_86_ID);
  const d88 = DETAILED.find((d) => d.id === DANDALOO_88_ID);

  // Paved Dandaloo Street western footpath apron running continuously in front of 86 & 88 Dandaloo St
  // (x = -4801.5 .. -4790.5, z = -871.0 .. -832.0) so neither building sits on bare green grass
  flatPoly(
    0xc4bcad,
    [
      [-4801.5, -832.0],
      [-4791.0, -832.0],
      [-4788.8, -871.0],
      [-4797.5, -871.0],
    ],
    0.058
  );
  // Lawn/gravel church grounds inside 86 Dandaloo St lot
  if (d86) {
    flatPoly(0x7ca25a, d86.boundary, 0.032);
  }

  // ── 1. [address redacted]: Steep-Gabled Red-Brick Church & Rear Hall (DISC-NR-010) ──
  // 2023 LiDAR for `church`: ground 238.77 m AHD, eave 3.77 m, steep pitched gable ridge 9.35 m!
  if (d86) {
    const churchPart = d86.parts.find((p) => p.name === 'church');
    const hallPart = d86.parts.find((p) => p.name === 'church hall');

    if (churchPart) {
      const f = frameOfQuad(churchPart.pts);
      const eaveH = 3.85;
      const ridgeH = 9.35;
      const rise = ridgeH - eaveH; // 5.50 m steep Gothic gable rise!
      const BRICK_CHURCH = 0xa2513d;
      const BRICK_DARK = 0x823d2c;
      const STONE_TRIM = 0xe8dec9;
      const ROOF_TILE = 0x7c6a5c;
      const LANCET_GLASS = 0x22303d;

      const pushChurchLocal = (col, geo, lx = 0, ly = 0, lz = 0, ry = 0) => {
        if (ry) geo.rotateY(ry);
        geo.translate(lx, ly, lz);
        geo.rotateY(f.yaw);
        geo.translate(f.cx, 0, f.cz);
        push(col, geo);
      };
      const churchBox = (col, w, h, d, lx, ly, lz, ry = 0) => {
        pushChurchLocal(col, new THREE.BoxGeometry(w, h, d), lx, ly, lz, ry);
      };

      // Masonry plinth + red face-brick nave walls
      churchBox(BRICK_DARK, f.L + 0.12, 0.65, f.W + 0.12, 0, 0.325, 0);
      churchBox(STONE_TRIM, f.L + 0.18, 0.08, f.W + 0.18, 0, 0.68, 0);
      churchBox(BRICK_CHURCH, f.L, eaveH - 0.65, f.W, 0, 0.65 + (eaveH - 0.65) / 2, 0);

      // Triangular East & West brick gable end walls + pitched roof slopes + cream bargeboards
      {
        const halfL = f.L / 2;
        const halfW = f.W / 2;
        const ohL = 0.42;
        const ohW = 0.45;
        const drop = (ohW / halfW) * rise;
        const yEave = eaveH - drop;

        // East & West triangular brick gable walls
        const gTris = [
          // East gable (+halfL, facing Dandaloo St)
          [halfL, eaveH, -halfW],
          [halfL, ridgeH, 0],
          [halfL, eaveH, halfW],
          // West gable (-halfL)
          [-halfL, eaveH, halfW],
          [-halfL, ridgeH, 0],
          [-halfL, eaveH, -halfW],
        ];
        const gGeo = new THREE.BufferGeometry();
        gGeo.setAttribute('position', new THREE.Float32BufferAttribute(gTris.flat(), 3));
        gGeo.computeVertexNormals();
        pushChurchLocal(BRICK_CHURCH, gGeo);

        // Steep North & South pitched roof slopes (rising to 9.35 m LiDAR ridge)
        const x0 = -halfL - ohL;
        const x1 = halfL + ohL;
        const zN = -halfW - ohW;
        const zS = halfW + ohW;
        const rTris = [
          // North slope
          [x0, yEave, zN],
          [x1, yEave, zN],
          [x1, ridgeH + 0.06, 0],
          [x0, yEave, zN],
          [x1, ridgeH + 0.06, 0],
          [x0, ridgeH + 0.06, 0],
          // South slope
          [x1, yEave, zS],
          [x0, yEave, zS],
          [x0, ridgeH + 0.06, 0],
          [x1, yEave, zS],
          [x0, ridgeH + 0.06, 0],
          [x1, ridgeH + 0.06, 0],
        ];
        const rGeo = new THREE.BufferGeometry();
        rGeo.setAttribute('position', new THREE.Float32BufferAttribute(rTris.flat(), 3));
        rGeo.computeVertexNormals();
        pushChurchLocal(ROOF_TILE, rGeo);

        // Cream timber bargeboards on the East (Dandaloo St) & West gables + ridge capping
        const rafterLen = Math.hypot(halfW + ohW, rise + drop);
        const rafterAng = Math.atan2(rise + drop, halfW + ohW);
        for (const gx of [-halfL - ohL + 0.06, halfL + ohL - 0.06]) {
          for (const sgn of [-1, 1]) {
            const bg = new THREE.BoxGeometry(0.16, 0.22, rafterLen + 0.15);
            bg.rotateX(sgn * rafterAng);
            pushChurchLocal(
              STONE_TRIM,
              bg,
              gx,
              (yEave + ridgeH) / 2 + 0.04,
              (sgn * (halfW + ohW)) / 2
            );
          }
        }
        // Stone cross finial at the East (Dandaloo Street) gable apex (y = 9.35 .. 10.25 m)
        churchBox(STONE_TRIM, 0.14, 0.92, 0.14, halfL + 0.08, ridgeH + 0.46, 0);
        churchBox(STONE_TRIM, 0.12, 0.14, 0.56, halfL + 0.08, ridgeH + 0.64, 0);
      }

      // Stepped brick buttresses & pointed Gothic lancet windows along the South & North nave walls
      const buttressX = [-f.L * 0.44, -f.L * 0.22, 0, f.L * 0.22, f.L * 0.44];
      for (const side of [-1, 1]) {
        const zWall = side * (f.W / 2);
        for (const bx of buttressX) {
          churchBox(BRICK_DARK, 0.48, 2.85, 0.44, bx, 1.425, zWall + side * 0.20);
          churchBox(STONE_TRIM, 0.54, 0.14, 0.50, bx, 2.90, zWall + side * 0.20);
        }
        // 4 bays of paired pointed lancet windows between the buttresses
        for (let i = 0; i < buttressX.length - 1; i++) {
          const midX = (buttressX[i] + buttressX[i + 1]) / 2;
          for (const dx of [-0.75, 0.75]) {
            churchBox(STONE_TRIM, 0.72, 2.05, 0.08, midX + dx, 2.15, zWall + side * 0.03);
            churchBox(LANCET_GLASS, 0.52, 1.85, 0.10, midX + dx, 2.15, zWall + side * 0.04);
            churchBox(STONE_TRIM, 0.52, 0.28, 0.10, midX + dx, 3.22, zWall + side * 0.04);
          }
        }
      }

      // East Gable Frontage on Dandaloo Street (+f.L / 2):
      // Corner brick buttresses, pointed Gothic arched timber double doorway with stone surround,
      // concrete entrance steps, and a triple-lancet east sanctuary/gable window above!
      {
        const xEast = f.L / 2;
        for (const sgn of [-1, 1]) {
          churchBox(BRICK_DARK, 0.52, 3.45, 0.54, xEast + 0.22, 1.725, sgn * (f.W * 0.44));
          churchBox(STONE_TRIM, 0.58, 0.16, 0.60, xEast + 0.22, 3.52, sgn * (f.W * 0.44));
        }
        // Triple pointed lancet window in the upper East gable (y = 4.20 .. 7.15 m)
        for (const [lz, hLancet] of [
          [-1.35, 2.35],
          [0, 2.95],
          [1.35, 2.35],
        ]) {
          const yBase = 4.15;
          churchBox(STONE_TRIM, 0.10, hLancet + 0.24, 0.88, xEast + 0.04, yBase + hLancet / 2, lz);
          churchBox(LANCET_GLASS, 0.12, hLancet, 0.66, xEast + 0.05, yBase + hLancet / 2, lz);
        }
        // Pointed arched double timber entrance door at ground level on Dandaloo Street
        churchBox(STONE_TRIM, 0.14, 2.88, 1.96, xEast + 0.06, 1.44, 0);
        churchBox(0x5c291e, 0.16, 2.56, 1.56, xEast + 0.08, 1.28, 0);
        churchBox(STONE_TRIM, 0.18, 0.42, 1.32, xEast + 0.08, 2.74, 0);
        // Entrance steps projecting onto the Dandaloo St footpath
        churchBox(0xcfc7b8, 0.95, 0.16, 2.40, xEast + 0.48, 0.08, 0);
        churchBox(0xd8d0c2, 0.55, 0.30, 2.10, xEast + 0.28, 0.15, 0);
      }

      colliders.push(polyRect(churchPart.pts));
    }

    // Rear Church Hall (`church hall`, 2023 LiDAR eave 2.29 m, ridge 3.32 m)
    if (hallPart) {
      const fh = frameOfQuad(hallPart.pts);
      const wallH = 2.65;
      box(0xede6d6, fh.L, wallH, fh.W, fh.cx, wallH / 2, fh.cz, fh.yaw);
      box(0xc8cac6, fh.L + 0.45, 0.22, fh.W + 0.45, fh.cx, wallH + 0.12, fh.cz, fh.yaw);
      colliders.push(polyRect(hallPart.pts));
    }

    // Surveyed trees on [address redacted] lot
    for (const [tx, tz] of d86.trees || []) {
      box(0x7c6d5d, 0.48, 4.0, 0.48, tx, 2.0, tz);
      const g3 = new THREE.SphereGeometry(4.0, 8, 6);
      g3.scale(1, 0.72, 1);
      g3.translate(tx, 6.3, tz);
      push(0x5d7d43, g3);
    }
  }

  // ── 2. [address redacted]: His and Hers Clip Joint Shopfront (DISC-NR-010) ──
  // 2023 LiDAR for `88 shop`: ground 238.82 m AHD, wall 3.95 m, stepped eastern parapet 4.95–5.04 m.
  if (d88 && d88.parts[0]) {
    const shopPart = d88.parts[0];
    const f = frameOfQuad(shopPart.pts);
    const wallH = 3.95;
    const parapetH = 4.98;
    const SHOP_WALL = 0xdfd5c2;
    const SHOP_BRICK = 0x8e5240;
    const SHOP_TRIM = 0xf4f0e6;
    const AWNING_COL = 0x2d4459;
    const GLASS_COL = 0x233442;

    const pushShopLocal = (col, geo, lx = 0, ly = 0, lz = 0, ry = 0) => {
      if (ry) geo.rotateY(ry);
      geo.translate(lx, ly, lz);
      geo.rotateY(f.yaw);
      geo.translate(f.cx, 0, f.cz);
      push(col, geo);
    };
    const shopBox = (col, w, h, d, lx, ly, lz, ry = 0) => {
      pushShopLocal(col, new THREE.BoxGeometry(w, h, d), lx, ly, lz, ry);
    };
    const addShopMesh = (geo, mat, lx = 0, ly = 0, lz = 0, ry = 0) => {
      if (ry) geo.rotateY(ry);
      geo.translate(lx, ly, lz);
      geo.rotateY(f.yaw);
      geo.translate(f.cx, 0, f.cz);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat);
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      town.add(m);
      return m;
    };

    // Main commercial masonry box + corrugated skillion roof
    shopBox(SHOP_BRICK, f.L + 0.06, 0.85, f.W + 0.06, 0, 0.425, 0);
    shopBox(SHOP_WALL, f.L, wallH - 0.85, f.W, 0, 0.85 + (wallH - 0.85) / 2, 0);
    shopBox(0xc6c9c4, f.L + 0.36, 0.16, f.W + 0.36, 0, wallH + 0.08, 0);

    // Stepped Dandaloo Street eastern parapet wall (+f.L / 2) rising to 4.98 m (2023 LiDAR 5.04 m)
    const xEast = f.L / 2;
    shopBox(SHOP_WALL, 0.34, parapetH - wallH, f.W + 0.12, xEast - 0.12, wallH + (parapetH - wallH) / 2, 0);
    shopBox(SHOP_TRIM, 0.42, 0.42, f.W * 0.64, xEast - 0.10, parapetH + 0.18, 0);
    shopBox(AWNING_COL, 0.46, 0.12, f.W + 0.24, xEast - 0.10, parapetH + 0.02, 0);

    // Brick piers & large aluminium-framed display windows + recessed glass entry door on Dandaloo St
    for (const pz of [-f.W * 0.46, -f.W * 0.14, f.W * 0.14, f.W * 0.46]) {
      shopBox(SHOP_BRICK, 0.18, 3.20, 0.36, xEast + 0.05, 1.60, pz);
    }
    // North & South display windows
    for (const wz of [-f.W * 0.30, f.W * 0.30]) {
      shopBox(SHOP_TRIM, 0.10, 2.15, 2.05, xEast + 0.04, 1.72, wz);
      shopBox(GLASS_COL, 0.12, 1.95, 1.85, xEast + 0.05, 1.72, wz);
    }
    // Central glazed salon entrance doorway
    shopBox(SHOP_TRIM, 0.12, 2.55, 1.52, xEast + 0.04, 1.28, 0);
    shopBox(GLASS_COL, 0.14, 2.38, 1.28, xEast + 0.06, 1.22, 0);

    // Cantilevered footpath awning over Dandaloo Street (eave 3.25 m, projection 3.10 m East)
    const awnDepth = 3.10;
    const awnY = 3.25;
    shopBox(0xf2efe8, awnDepth, 0.18, f.W + 0.30, xEast + awnDepth / 2, awnY, 0);
    shopBox(AWNING_COL, 0.12, 0.36, f.W + 0.36, xEast + awnDepth + 0.02, awnY + 0.04, 0);

    // "HIS & HERS CLIP JOINT" fascia sign above the awning on the eastern parapet
    const clipTex = createClipJointSignTexture();
    if (clipTex) {
      addShopMesh(
        new THREE.PlaneGeometry(f.W * 0.86, 1.05),
        new THREE.MeshLambertMaterial({ map: clipTex }),
        xEast + 0.08,
        wallH + 0.42,
        0,
        Math.PI / 2
      );
    }

    // North side wall windows (visible when approaching from Nymagee / 86 Dandaloo St)
    for (const wx of [-f.L * 0.25, f.L * 0.18]) {
      shopBox(SHOP_TRIM, 1.45, 1.45, 0.08, wx, 1.85, -f.W / 2 - 0.03);
      shopBox(GLASS_COL, 1.25, 1.25, 0.10, wx, 1.85, -f.W / 2 - 0.04);
    }

    colliders.push(polyRect(shopPart.pts));
  }
}

export function buildNarromineRoyalHotel(ctx) {
  buildRoyalHotelSite(ctx);
  buildDandaloo86And88(ctx);
}
