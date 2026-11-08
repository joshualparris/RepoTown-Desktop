// Architecturally grounded 3D reconstruction of the Narromine Hotel ([address redacted],
// corner of Derribong Avenue, Lot 13 DP519453).
//
// Sources & Evidence:
// 1. Cadastral parcel Lot 13 DP519453 (~2,097 m²) and 0.126 m/px ortho-aerial imagery
//    (NSW Spatial Services, CC BY 4.0).
// 2. 2023 NSW Spatial Services airborne LiDAR (MacquarieFloodplainSouth, CC BY 4.0):
//    two-storey wings eave ~8.85–9.16 m, hipped roof ridge ~10.91–11.09 m; two-level
//    verandah roof ~7.13–7.49 m; rear/west single-storey wings ~3.36–4.22 m.
// 3. Street View reference photographs (frames 102238.751 to 102257.437, visual reference):
//    - U-shaped two-storey hotel with flush cream-rendered street facades (#e6dac2) over a
//      ~1.05 m warm grey-brown masonry dado (#867e74), and exposed red face-brickwork on the
//      upper north wall above the adjoining single-storey charcoal shopfront.
//    - 45° splayed south-east corner with arched and stepped "1901 / NARROMINE HOTEL"
//      parapet and flanking return parapet wings with piers and finials.
//    - Four corbelled red-brick chimneys with cream necking mouldings and terracotta pots.
//    - Two-storey wraparound verandah (7 bays on Dandaloo St + 1 splayed SE corner bay +
//      6 bays on Derribong Ave) with heritage-green posts/rails (#2c4c32) and open cream
//      Victorian cast-iron lacework friezes, brackets and balustrade panels (#efe8d6).
//    - Verified bay-by-bay window/door arrangement and signage ("NARROMINE HOTEL MOTEL"
//      corner fascia, arched upper corner blade sign, "LOCAL LIQUOR", "TAB").
import * as THREE from 'three';
import { DETAILED, polyRect } from './narromine-layout.js';

export const NARROMINE_HOTEL_ID = 'narromine-hotel';

// Surveyed SE corner ([-32.2341612123, 148.2389982566]) and NE frontage corner
// ([-32.2339190143, 148.2390410152]) of Lot 13 DP519453 in world coordinates (metres).
const C_SE = [-4819.9751, -707.1051];
const C_NE = [-4815.9536, -734.0363];
const DX_N = C_NE[0] - C_SE[0], DZ_N = C_NE[1] - C_SE[1];
const FRONTAGE_LEN = Math.hypot(DX_N, DZ_N); // 27.232 m

// Unit vectors in the hotel's surveyed street frame:
// +s runs North along Dandaloo St frontage; +w runs West into the lot along Derribong Ave.
const UN_X = DX_N / FRONTAGE_LEN, UN_Z = DZ_N / FRONTAGE_LEN; // [+0.1476, -0.9890] (North)
const UW_X = DZ_N / FRONTAGE_LEN, UW_Z = -DX_N / FRONTAGE_LEN; // [-0.9890, -0.1476] (West)
const FRAME_YAW = Math.atan2(UN_X, -UN_Z); // ~ +0.1481 rad (8.49° E of N)

// Convert local hotel coordinates (s = north along Dandaloo, w = west along Derribong)
// to world [x, z].
// The sealed forecourt in front of the hotel (both street frontages), in world [x, z]. The general
// street builder must not draw footpaths across it.
export function hotelForecourtPolygon() {
  return [hotelToWorld(-16.0, 26.0), hotelToWorld(-16.0, -20.0), hotelToWorld(46.0, -20.0), hotelToWorld(46.0, -3.75),
    hotelToWorld(-1.10, -3.75), hotelToWorld(-3.75, -1.10), hotelToWorld(-3.75, 26.0)];
}

export function hotelToWorld(s, w) {
  return [
    C_SE[0] + s * UN_X + w * UW_X,
    C_SE[1] + s * UN_Z + w * UW_Z,
  ];
}

// Transform a BufferGeometry defined in right-handed local coords:
//   lx = -w (East of SE corner, so Dandaloo wall is lx = 0, footpath is lx > 0)
//   ly = y  (Height above ground)
//   lz = -s (South of SE corner, so Derribong wall is lz = 0, footpath is lz > 0)
//
// In this right-handed local frame, any BoxGeometry(width, height, depth) or
// PlaneGeometry(width, height) rotated by `wallYaw = Math.atan2(nlx, nlz)` has:
//   - its +Z axis (depth / front normal) pointing along (nlx, nlz) (outward toward the street),
//   - its +X axis (width) running left-to-right along the wall/bay when viewed from outside!
// Canonical wallYaws:
//   - South face (Derribong Ave, outward = +lz): wallYaw = 0
//   - 45° SE Splay (outward = (+lx + lz)/√2):    wallYaw = Math.PI / 4
//   - East face (Dandaloo St, outward = +lx):    wallYaw = Math.PI / 2
//   - North face (outward = -lz):                wallYaw = Math.PI
function toWorldGeo(geo, s = 0, y = 0, w = 0, wallYaw = 0) {
  if (wallYaw) geo.rotateY(wallYaw);
  geo.translate(-w, y, -s);
  geo.rotateY(FRAME_YAW);
  geo.translate(C_SE[0], 0, C_SE[1]);
  return geo;
}

// ── Procedural Canvas Textures (browser only; graceful fallback in headless Node) ──
function makeCanvasTex(w, h, draw, { repeatX = 1, repeatY = 1 } = {}) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function createLaceFriezeTexture() {
  return makeCanvasTex(512, 160, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const cream = '#f2ebd9', shadow = '#cabca0';
    // Top cast-iron mounting bar & moulded cornice strip
    g.fillStyle = cream;
    g.fillRect(0, 0, W, 16);
    g.fillStyle = shadow;
    g.fillRect(0, 14, W, 4);

    // Repeating Victorian fern-and-scroll openwork valance across the bay
    const units = 8, uw = W / units;
    for (let i = 0; i < units; i++) {
      const cx = (i + 0.5) * uw;
      // Vertical cast-iron spindles at unit boundaries and centres
      g.fillStyle = cream;
      g.fillRect(i * uw - 2.5, 14, 5, 76);
      g.fillRect(cx - 2, 14, 4, 66);

      // Upper filigree ring and quatrefoil petals
      g.strokeStyle = cream;
      g.lineWidth = 4.5;
      g.beginPath();
      g.arc(cx, 42, 14, 0, Math.PI * 2);
      g.stroke();

      g.lineWidth = 3;
      for (let a = 0; a < 4; a++) {
        const ang = a * Math.PI / 2 + Math.PI / 4;
        g.beginPath();
        g.arc(cx + Math.cos(ang) * 7, 42 + Math.sin(ang) * 7, 5, 0, Math.PI * 2);
        g.stroke();
      }

      // Sweeping S-scrolls linking to the neighbour spindles
      g.lineWidth = 4;
      for (const sgn of [-1, 1]) {
        g.beginPath();
        g.moveTo(cx + sgn * 14, 38);
        g.bezierCurveTo(cx + sgn * 24, 22, cx + sgn * 28, 58, cx + sgn * (uw / 2), 54);
        g.stroke();
        // Scalloped lower cusp arch with pendant drop finial
        g.beginPath();
        g.moveTo(cx, 76);
        g.quadraticCurveTo(cx + sgn * (uw * 0.25), 58, cx + sgn * (uw * 0.5), 88);
        g.stroke();
      }
      // Pendant drop spear at unit boundary and center
      g.fillStyle = cream;
      g.beginPath();
      g.arc(cx, 80, 4.5, 0, Math.PI * 2);
      g.moveTo(i * uw, 100);
      g.lineTo(i * uw - 5, 85);
      g.lineTo(i * uw + 5, 85);
      g.closePath();
      g.fill();
    }

    // Ornate curved cast-iron corner brackets at left and right ends of the bay
    for (const isRight of [false, true]) {
      g.save();
      if (isRight) {
        g.translate(W, 0);
        g.scale(-1, 1);
      }
      g.strokeStyle = cream;
      g.fillStyle = cream;
      g.lineWidth = 6.5;
      // Outer curved bracket rib springing from post (x=4, y=156) to frieze (x=94, y=76)
      g.beginPath();
      g.moveTo(4, 156);
      g.quadraticCurveTo(20, 86, 94, 76);
      g.stroke();
      // Vertical post-side mounting flange
      g.fillRect(0, 70, 8, 86);
      // Scroll rings filling the bracket spandrel
      g.lineWidth = 4.2;
      g.beginPath();
      g.arc(28, 100, 14, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(56, 86, 9, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(16, 128, 8, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
  });
}

function createLaceBalustradeTexture() {
  return makeCanvasTex(512, 220, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const cream = '#f2ebd9', shadow = '#c8baa0', green = '#2b4b31';
    // Top and bottom cast-iron framing bars
    g.fillStyle = cream;
    g.fillRect(0, 6, W, 9);
    g.fillRect(0, H - 15, W, 9);

    // 8 ornate vertical cast-iron balustrade panels across the bay
    const panels = 8, pw = W / panels;
    for (let i = 0; i < panels; i++) {
      const x0 = i * pw, cx = x0 + pw / 2;
      g.fillStyle = cream;
      g.fillRect(x0 - 2.5, 6, 5, H - 12);
      g.strokeStyle = cream;
      g.lineWidth = 4.2;

      // Upper and lower Victorian arches
      g.beginPath();
      g.arc(cx, 44, pw * 0.34, Math.PI, 0, false);
      g.stroke();
      g.beginPath();
      g.arc(cx, H - 44, pw * 0.34, 0, Math.PI, false);
      g.stroke();

      // Central floral rosette / roundel
      g.lineWidth = 4.8;
      g.beginPath();
      g.arc(cx, H / 2, pw * 0.32, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = shadow;
      g.beginPath();
      g.arc(cx, H / 2, 5.5, 0, Math.PI * 2);
      g.fill();

      // Diagonal scrollwork & vertical central stem
      g.strokeStyle = cream;
      g.lineWidth = 3.6;
      g.beginPath();
      g.moveTo(cx, 15);
      g.lineTo(cx, H - 15);
      g.moveTo(x0 + 8, 26);
      g.quadraticCurveTo(cx, H / 2, x0 + pw - 8, H - 26);
      g.moveTo(x0 + pw - 8, 26);
      g.quadraticCurveTo(cx, H / 2, x0 + 8, H - 26);
      g.stroke();

      // Paired C-scrolls above and below the central rosette
      for (const sy of [H * 0.28, H * 0.72]) {
        g.beginPath();
        g.arc(cx - 9, sy, 6, 0, Math.PI * 2);
        g.arc(cx + 9, sy, 6, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // Central heritage-green vertical dividing stanchion (visible in Street View photos)
    g.fillStyle = green;
    g.fillRect(W / 2 - 5, 0, 10, H);
  });
}

function createParapetFaceTexture() {
  return makeCanvasTex(512, 384, (g, W, H) => {
    // Warm cream rendered masonry background
    g.fillStyle = '#e6dac2';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(155,140,115,0.25)';
    g.lineWidth = 2;
    for (let y = 24; y < H; y += 28) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }

    // Semicircular recessed tympanum fan / sunburst motif in the upper arch
    const cx = W / 2, cy = 152, r = 84;
    g.fillStyle = '#d3c3a3';
    g.beginPath();
    g.arc(cx, cy, r, Math.PI, 0, false);
    g.closePath();
    g.fill();
    g.strokeStyle = '#36413e';
    g.lineWidth = 4;
    g.stroke();

    // Radiating sunburst flutes inside the arch
    g.strokeStyle = '#4a524c';
    g.lineWidth = 2.5;
    for (let i = 1; i < 9; i++) {
      const a = Math.PI + (i / 9) * Math.PI;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4));
      g.stroke();
    }

    // "1901" date inscription above the fan motif
    g.fillStyle = '#26302e';
    g.font = 'bold 34px Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('1901', cx, 46);

    // Moulded stringcourse band below the tympanum
    g.fillStyle = '#cbbba0';
    g.fillRect(36, 158, W - 72, 12);
    g.fillStyle = '#f2ead8';
    g.fillRect(36, 152, W - 72, 6);

    // "NARROMINE HOTEL" lettering across the main pediment frieze
    g.fillStyle = '#222d2b';
    g.font = 'bold 40px Georgia, serif';
    g.fillText('NARROMINE HOTEL', cx, 224);

    // Lower recessed frieze panel
    g.strokeStyle = '#b9aa8c';
    g.lineWidth = 4;
    g.strokeRect(54, 272, W - 108, 62);
  });
}

function createCornerFasciaSignTexture() {
  return makeCanvasTex(1024, 180, (g, W, H) => {
    g.fillStyle = '#f4f0e2';
    g.fillRect(0, 0, W, H);
    // Double heritage-green border
    g.strokeStyle = '#254429';
    g.lineWidth = 10;
    g.strokeRect(8, 8, W - 16, H - 16);
    g.lineWidth = 3;
    g.strokeRect(22, 22, W - 44, H - 44);
    // Condensed bold heritage green lettering matching 102248.643.jpg
    g.fillStyle = '#1f3d23';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 74px Georgia, "Times New Roman", serif';
    g.fillText('NARROMINE HOTEL MOTEL', W / 2, H * 0.46);
    g.font = 'bold 26px Arial, sans-serif';
    g.fillStyle = '#355839';
    g.fillText('COLD BEER  ·  BISTRO  ·  ACCOMMODATION', W / 2, H * 0.80);
  });
}

function createBladeSignTexture() {
  return makeCanvasTex(384, 384, (g, W, H) => {
    g.fillStyle = '#f6f5f0';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#3a352e';
    g.lineWidth = 8;
    g.strokeRect(6, 6, W - 12, H - 12);
    // Golden-amber arched crest at top (seen in 102248.643.jpg / 102250.791.jpg)
    g.strokeStyle = '#b88736';
    g.lineWidth = 12;
    g.beginPath();
    g.arc(W / 2, 165, 115, Math.PI * 1.12, -Math.PI * 0.12, false);
    g.stroke();
    g.fillStyle = '#d4a24c';
    g.beginPath();
    g.arc(W / 2, 145, 42, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2d251e';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'italic bold 44px Georgia, serif';
    g.fillText('Narromine', W / 2, 232);
    g.font = 'bold 48px Georgia, serif';
    g.fillText('HOTEL', W / 2, 288);
    g.font = 'bold 22px Arial, sans-serif';
    g.fillStyle = '#7a5228';
    g.fillText('EST. 1901', W / 2, 338);
  });
}

function createLocalLiquorTexture() {
  return makeCanvasTex(512, 112, (g, W, H) => {
    g.fillStyle = '#c8202b';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#f5c400';
    g.fillRect(10, H - 18, W - 20, 8);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 62px Arial, sans-serif';
    g.fillText('LOCAL LIQUOR', W / 2, H * 0.46);
  });
}

function createTabSignTexture() {
  return makeCanvasTex(256, 140, (g, W, H) => {
    g.fillStyle = '#1b6b3a';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 6;
    g.strokeRect(6, 6, W - 12, H - 12);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 78px Arial, sans-serif';
    g.fillText('TAB', W / 2, H * 0.54);
  });
}

function createRoadFingerboardTexture(lines, { bg = '#166839', headerBg = null, headerText = null } = {}) {
  return makeCanvasTex(512, 220, (g, W, H) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 8;
    g.strokeRect(6, 6, W - 12, H - 12);
    let y0 = 16;
    if (headerBg && headerText) {
      g.fillStyle = headerBg;
      g.fillRect(10, 10, W - 20, 54);
      g.fillStyle = '#ffffff';
      g.font = 'bold 34px Arial, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(headerText, W / 2, 37);
      y0 = 70;
    }
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const availH = H - y0 - 14;
    lines.forEach((line, i) => {
      g.font = 'bold 36px Arial, sans-serif';
      g.fillText(line, W / 2, y0 + (i + 0.5) * (availH / lines.length));
    });
  });
}

// ── Main Builder ─────────────────────────────────────────────────────────────
export function buildNarromineHotel({ push, box, flatPoly, town, colliders }) {
  const nh = DETAILED.find((d) => d.id === NARROMINE_HOTEL_ID);
  if (!nh) return;

  // Palette matched to Street View frames 102238–102257 & aerial imagery
  const CREAM_WALL = 0xe6dac2;
  const CREAM_TRIM = 0xf2ece0;
  const SILL_STONE = 0xd4c7ae;
  const DADO_GREY = 0x867e74;
  const RED_BRICK = 0x9b4b38;
  const BRICK_DARK = 0x7d3929;
  const ROOF_GALV = 0xc6c9c4;
  const ROOF_ROLL = 0xdadcd8;
  const GUTTER_COL = 0xb4b8b2;
  const HERITAGE_GREEN = 0x2c4c32;
  const LACE_CREAM = 0xefe8d6;
  const BALCONY_DECK = 0x735b44;
  const SOFFIT_CREAM = 0xede5d4;
  const TIMBER_DOOR = 0x42231a;
  const WINDOW_FRAME = 0x2a2e30;
  const WINDOW_GLASS = 0x23333e;
  const POT_TERRACOTTA = 0xb85d3d;
  const SHOP_CHARCOAL = 0x373a3d;

  const pushLocal = (colour, geo, s = 0, y = 0, w = 0, wallYaw = 0) => {
    push(colour, toWorldGeo(geo, s, y, w, wallYaw));
  };
  // Place a box in wall-aligned coordinates:
  //   width (X): horizontal span along the wall/bay
  //   height (Y): vertical height
  //   depth (Z): thickness perpendicular to the wall/bay (+Z points outward along wallYaw)
  const wallBox = (colour, width, height, depth, s, y, w, wallYaw = 0) => {
    pushLocal(colour, new THREE.BoxGeometry(width, height, depth), s, y, w, wallYaw);
  };
  const localCyl = (colour, rTop, rBot, h, segs, s, y, w) => {
    pushLocal(colour, new THREE.CylinderGeometry(rTop, rBot, h, segs), s, y, w);
  };

  // Add a textured mesh in local hotel coordinates directly to `town`
  const addLocalMesh = (geo, mat, s = 0, y = 0, w = 0, wallYaw = 0) => {
    toWorldGeo(geo, s, y, w, wallYaw);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    town.add(m);
    return m;
  };

  const YAW_SOUTH = 0;
  const YAW_SPLAY = Math.PI / 4;
  const YAW_EAST = Math.PI / 2;
  const YAW_NORTH = Math.PI;

  // ── 1. Ground Surfaces, Road Forecourt & Concrete Footpath Apron ───────────
  const GROUND_STYLE = { asphalt: [0x3f4244, 0.05], grass: [0x7fa65d, 0.03], paving: [0xb8ac98, 0.055], gravel: [0xa89a84, 0.045] };
  for (const g of nh.ground || []) {
    const st = GROUND_STYLE[g.kind] || GROUND_STYLE.gravel;
    flatPoly(st[0], g.pts, st[1]);
  }
  // Continuous road asphalt / angled-parking forecourt bridging from the hotel kerb out to
  // the Dandaloo Street and Derribong Avenue road centerlines (eliminates artificial grass gap).
  const roadForecourtPts = hotelForecourtPolygon();
  flatPoly(0x47494b, roadForecourtPts, 0.056);

  // Paved footpath apron beneath the Dandaloo St and Derribong Ave verandahs
  const apronPts = [
    hotelToWorld(-3.85, 23.6),
    hotelToWorld(-3.85, -1.10),
    hotelToWorld(-1.10, -3.85),
    hotelToWorld(40.2, -3.85),
    hotelToWorld(40.2, 0.2),
    hotelToWorld(0.2, 0.2),
    hotelToWorld(0.2, 23.6),
  ];
  flatPoly(0xbdb5a8, apronPts, 0.062);

  // Concrete kerb edging along the outer verandah footpath line
  wallBox(0xc9c2b6, 41.2, 0.14, 0.18, 19.5, 0.07, -3.82, YAW_EAST);
  wallBox(0xc9c2b6, 24.6, 0.14, 0.18, -3.82, 0.07, 11.2, YAW_SOUTH);
  wallBox(0xc9c2b6, 3.95, 0.14, 0.18, -2.46, 0.07, -2.46, YAW_SPLAY);

  // ── 2. Two-Storey U-Shaped Hotel Masonry Footprint & Walls (y = 0 .. 8.90 m) ─
  const EAVE_H = 8.90;
  const RIDGE_H = 10.95;
  const DADO_H = 1.05;
  const SPLAY = 1.65;

  const uFootprint = [
    [SPLAY, 0],
    [27.23, 0],
    [27.23, 24.80],
    [17.80, 24.80],
    [17.80, 9.20],
    [10.60, 9.20],
    [10.60, 23.40],
    [0, 23.40],
    [0, SPLAY],
  ];

  const extrudeFootprint = (ptsSW, y0, y1, expand = 0) => {
    const cx = ptsSW.reduce((a, p) => a + p[0], 0) / ptsSW.length;
    const cw = ptsSW.reduce((a, p) => a + p[1], 0) / ptsSW.length;
    const shapePts = ptsSW.map(([s, w]) => {
      const ds = s - cx, dw = w - cw, len = Math.hypot(ds, dw) || 1;
      const s2 = s + (expand ? (ds / len) * expand : 0);
      const w2 = w + (expand ? (dw / len) * expand : 0);
      return new THREE.Vector2(-w2, s2);
    });
    const sh = new THREE.Shape(shapePts);
    const g = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    g.translate(0, y0, 0);
    return g;
  };

  // Grey-brown painted masonry plinth/dado (y = 0 .. 1.05 m) and projecting dado cap
  pushLocal(DADO_GREY, extrudeFootprint(uFootprint, 0, DADO_H, 0.03));
  pushLocal(SILL_STONE, extrudeFootprint(uFootprint, DADO_H, DADO_H + 0.07, 0.055));
  // Main two-storey cream-rendered masonry walls (y = 1.05 .. 8.90 m)
  pushLocal(CREAM_WALL, extrudeFootprint(uFootprint, DADO_H, EAVE_H, 0));

  // Exposed heritage red face-brickwork on the upper north face of the north wing
  // (visible in Street View 102255.014.jpg above the single-storey northern shopfront)
  wallBox(RED_BRICK, 24.40, 4.95, 0.08, 27.25, 6.40, 12.35, YAW_NORTH);
  // Moulded mid-storey stringcourse & boxed eaves cornice along the street facades
  pushLocal(CREAM_TRIM, extrudeFootprint(uFootprint, EAVE_H - 0.22, EAVE_H, 0.08));
  pushLocal(SOFFIT_CREAM, extrudeFootprint(uFootprint, EAVE_H - 0.04, EAVE_H + 0.08, 0.42));
  pushLocal(GUTTER_COL, extrudeFootprint(uFootprint, EAVE_H + 0.02, EAVE_H + 0.16, 0.48));

  // Collision boxes for the three wings of the U-shaped hotel: split into ~2.5 m slices along
  // the skewed 8.5° street axes so an axis-aligned bounding box never clips the angled footpath.
  const pushSlicedCollider = (s0, s1, w0, w1) => {
    const ns = Math.max(1, Math.ceil((s1 - s0) / 2.5));
    const nw = Math.max(1, Math.ceil((w1 - w0) / 2.5));
    for (let i = 0; i < ns; i++) {
      const sa = s0 + ((s1 - s0) * i) / ns, sb = s0 + ((s1 - s0) * (i + 1)) / ns;
      for (let j = 0; j < nw; j++) {
        const wa = w0 + ((w1 - w0) * j) / nw, wb = w0 + ((w1 - w0) * (j + 1)) / nw;
        if (sa + wa < SPLAY * 0.9) continue;
        colliders.push(polyRect([hotelToWorld(sa, wa), hotelToWorld(sb, wa), hotelToWorld(sb, wb), hotelToWorld(sa, wb)]));
      }
    }
  };
  pushSlicedCollider(0.25, 10.6, 0.25, 23.4);
  pushSlicedCollider(10.6, 17.8, 0.25, 9.2);
  pushSlicedCollider(17.8, 27.2, 0.25, 24.8);

  // ── 3. Continuous Hipped Corrugated-Iron Roof & Ridge/Hip Rolls ────────────
  {
    const oh = 0.45;
    const y0 = EAVE_H + 0.08, y1 = RIDGE_H;
    const sS = -oh, sSC = 10.6 + oh, sNC = 17.8 - oh, sN = 27.23 + oh;
    const wE = -oh, wEC = 9.2 + oh, wSW = 23.4 + oh, wNW = 24.8 + oh;
    const sR1 = 5.10, sR2 = 22.52, wRE = 4.60;
    const wSW_ridge = 18.50, wNW_ridge = 20.10;

    const V = (s, y, w) => [-w, y, -s];
    const tris = [];
    const addQuad = (A, B, C, D) => { tris.push(A, B, C, A, C, D); };
    const addTri = (A, B, C) => { tris.push(A, B, C); };

    // Continuous East street-facing slope along Dandaloo Street
    const E_SE = V(sS, y0, wE), E_NE = V(sN, y0, wE);
    const R_SE = V(sR1, y1, wRE), R_NE = V(sR2, y1, wRE);
    addQuad(E_SE, E_NE, R_NE, R_SE);

    // South wing (Derribong Avenue): South slope, West hip end, North courtyard slope
    const S_SW = V(sS, y0, wSW), S_NW = V(sSC, y0, wSW), S_VAL = V(sSC, y0, wEC);
    const R_SW = V(sR1, y1, wSW_ridge), R_SVAL = V(sR1, y1, wEC);
    addQuad(E_SE, R_SE, R_SW, S_SW);
    addTri(S_SW, R_SW, S_NW);
    addQuad(S_NW, R_SW, R_SVAL, S_VAL);

    // North wing: North slope, West hip end, South courtyard slope
    const N_NE = E_NE, N_NW = V(sN, y0, wNW), N_SW = V(sNC, y0, wNW), N_VAL = V(sNC, y0, wEC);
    const R_NW = V(sR2, y1, wNW_ridge), R_NVAL = V(sR2, y1, wEC);
    addQuad(N_NE, N_NW, R_NW, R_NE);
    addTri(N_NW, N_SW, R_NW);
    addQuad(N_VAL, R_NVAL, R_NW, N_SW);

    // East wing inner (west) slope & valley returns
    addQuad(S_VAL, R_SVAL, R_NVAL, N_VAL);
    addTri(R_SE, R_SVAL, R_NVAL);
    addTri(R_SE, R_NVAL, R_NE);

    // Central courtyard cross-hipped roof (visible in aerial at px 800–865, py 500–565)
    const C_A = V(10.4, y0, 4.6), C_B = V(16.2, y0, 4.6), C_C = V(16.2, y0, 11.4), C_D = V(10.4, y0, 11.4);
    const C_R1 = V(13.3, y1 - 0.15, 4.6), C_R2 = V(13.3, y1 - 0.15, 9.2);
    addQuad(C_A, C_D, C_R2, C_R1);
    addQuad(C_B, C_R1, C_R2, C_C);
    addTri(C_D, C_C, C_R2);

    const roofGeo = new THREE.BufferGeometry();
    roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
    roofGeo.computeVertexNormals();
    pushLocal(ROOF_GALV, roofGeo);

    const roll = (p0, p1, radius = 0.085) => {
      const a = new THREE.Vector3(...V(...p0)), b = new THREE.Vector3(...V(...p1));
      const d = b.clone().sub(a), len = d.length();
      if (len < 0.05) return;
      const g = new THREE.CylinderGeometry(radius, radius, len, 6);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
      g.translate(...a.add(b).multiplyScalar(0.5).toArray());
      pushLocal(ROOF_ROLL, g);
    };
    roll([sR1, y1 + 0.04, wRE], [sR2, y1 + 0.04, wRE]);
    roll([sR1, y1 + 0.04, wRE], [sR1, y1 + 0.04, wSW_ridge]);
    roll([sR2, y1 + 0.04, wRE], [sR2, y1 + 0.04, wNW_ridge]);
    roll([sS, y0 + 0.04, wE], [sR1, y1 + 0.04, wRE], 0.075);
    roll([sN, y0 + 0.04, wE], [sR2, y1 + 0.04, wRE], 0.075);
    roll([sS, y0 + 0.04, wSW], [sR1, y1 + 0.04, wSW_ridge], 0.075);
    roll([sSC, y0 + 0.04, wSW], [sR1, y1 + 0.04, wSW_ridge], 0.075);
    roll([sN, y0 + 0.04, wNW], [sR2, y1 + 0.04, wNW_ridge], 0.075);
    roll([sNC, y0 + 0.04, wNW], [sR2, y1 + 0.04, wNW_ridge], 0.075);
  }

  // ── 4. Curved & Stepped SE Corner Parapet ("1901 / NARROMINE HOTEL") ───────
  {
    const py0 = EAVE_H - 0.02;
    const sc = 0.95, wc = 0.95;

    const pedShape = new THREE.Shape();
    const hw = 1.52;
    pedShape.moveTo(-hw, 0);
    pedShape.lineTo(hw, 0);
    pedShape.lineTo(hw, 1.18);
    pedShape.lineTo(1.12, 1.18);
    pedShape.lineTo(1.12, 1.38);
    pedShape.quadraticCurveTo(0.84, 1.40, 0.72, 1.56);
    pedShape.absarc(0, 1.50, 0.72, 0, Math.PI, false);
    pedShape.quadraticCurveTo(-0.84, 1.40, -1.12, 1.38);
    pedShape.lineTo(-1.12, 1.18);
    pedShape.lineTo(-hw, 1.18);
    pedShape.closePath();

    const pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 0.34, bevelEnabled: false });
    pedGeo.translate(0, 0, -0.17);
    pushLocal(CREAM_WALL, pedGeo, sc, py0, wc, YAW_SPLAY);

    // Raised 3D semicircular archivolt hood moulding around the central arch
    const archRim = new THREE.Shape();
    archRim.absarc(0, 1.50, 0.80, -0.05, Math.PI + 0.05, false);
    archRim.absarc(0, 1.50, 0.67, Math.PI + 0.05, -0.05, true);
    const rimGeo = new THREE.ExtrudeGeometry(archRim, { depth: 0.42, bevelEnabled: false });
    rimGeo.translate(0, 0, -0.21);
    pushLocal(CREAM_TRIM, rimGeo, sc, py0, wc, YAW_SPLAY);

    // Moulded horizontal stringcourses and flanking pier shafts/caps/finials on the pediment
    wallBox(CREAM_TRIM, 3.16, 0.10, 0.42, sc, py0 + 0.78, wc, YAW_SPLAY);
    wallBox(CREAM_TRIM, 3.20, 0.12, 0.42, sc, py0 + 0.06, wc, YAW_SPLAY);
    for (const sgn of [-1, 1]) {
      const ds = sgn * 0.94, dw = -sgn * 0.94;
      wallBox(CREAM_WALL, 0.38, 1.42, 0.42, sc + ds, py0 + 0.71, wc + dw, YAW_SPLAY);
      wallBox(CREAM_TRIM, 0.48, 0.12, 0.50, sc + ds, py0 + 1.46, wc + dw, YAW_SPLAY);
      wallBox(CREAM_TRIM, 0.34, 0.22, 0.34, sc + ds, py0 + 1.62, wc + dw, YAW_SPLAY);
      localCyl(CREAM_TRIM, 0.13, 0.13, 0.22, 10, sc + ds, py0 + 1.82, wc + dw);
    }

    // Textured front face of the corner pediment ("1901" + sunburst arch + "NARROMINE HOTEL")
    const parapetTex = createParapetFaceTexture();
    if (parapetTex) {
      const faceGeo = new THREE.ShapeGeometry(pedShape, 18);
      const pos = faceGeo.attributes.position;
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uvs[i * 2] = (pos.getX(i) + hw) / (2 * hw);
        uvs[i * 2 + 1] = pos.getY(i) / 2.25;
      }
      faceGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      faceGeo.translate(0, 0, 0.19);
      addLocalMesh(faceGeo, new THREE.MeshLambertMaterial({ map: parapetTex }), sc, py0, wc, YAW_SPLAY);
    }

    // East (Dandaloo St) return parapet wing: s = 2.05 .. 4.35 m at w = 0.08 m
    wallBox(CREAM_WALL, 2.30, 0.78, 0.30, 3.20, py0 + 0.39, 0.08, YAW_EAST);
    wallBox(CREAM_TRIM, 2.38, 0.09, 0.38, 3.20, py0 + 0.82, 0.08, YAW_EAST);
    wallBox(DADO_GREY, 1.60, 0.34, 0.33, 3.15, py0 + 0.42, 0.07, YAW_EAST);
    wallBox(CREAM_WALL, 0.44, 1.15, 0.42, 4.38, py0 + 0.58, 0.08, YAW_EAST);
    wallBox(CREAM_TRIM, 0.52, 0.11, 0.50, 4.38, py0 + 1.20, 0.08, YAW_EAST);
    localCyl(CREAM_TRIM, 0.12, 0.12, 0.22, 10, 4.38, py0 + 1.36, 0.08);

    // South (Derribong Ave) return parapet wing: w = 2.05 .. 4.35 m at s = 0.08 m
    wallBox(CREAM_WALL, 2.30, 0.78, 0.30, 0.08, py0 + 0.39, 3.20, YAW_SOUTH);
    wallBox(CREAM_TRIM, 2.38, 0.09, 0.38, 0.08, py0 + 0.82, 3.20, YAW_SOUTH);
    wallBox(DADO_GREY, 1.60, 0.34, 0.33, 0.07, py0 + 0.42, 3.15, YAW_SOUTH);
    wallBox(CREAM_WALL, 0.44, 1.15, 0.42, 0.08, py0 + 0.58, 4.38, YAW_SOUTH);
    wallBox(CREAM_TRIM, 0.52, 0.11, 0.50, 0.08, py0 + 1.20, 4.38, YAW_SOUTH);
    localCyl(CREAM_TRIM, 0.12, 0.12, 0.22, 10, 0.08, py0 + 1.36, 4.38);
  }

  // ── 5. Four Corbelled Red-Brick Chimneys with Terracotta Pots ──────────────
  const CHIMNEYS = [
    { s: 5.35, w: 2.35 },  // 1. SE chimney (just behind Bay 1/2 & corner parapet)
    { s: 20.65, w: 2.45 }, // 2. NE chimney (above Bay 5/6 on Dandaloo St)
    { s: 7.45, w: 13.50 }, // 3. SW chimney (on Derribong Ave wing near ridge)
    { s: 22.80, w: 14.20 } // 4. NW chimney (on north wing near ridge)
  ];
  for (const ch of CHIMNEYS) {
    const cy0 = 9.20, chH = 2.48, topY = cy0 + chH;
    wallBox(RED_BRICK, 0.86, chH, 0.66, ch.s, cy0 + chH / 2, ch.w, YAW_EAST);
    wallBox(BRICK_DARK, 0.90, chH - 0.5, 0.22, ch.s, cy0 + (chH - 0.5) / 2, ch.w, YAW_EAST);
    wallBox(CREAM_TRIM, 0.96, 0.14, 0.76, ch.s, topY - 0.42, ch.w, YAW_EAST);
    wallBox(RED_BRICK, 0.94, 0.09, 0.74, ch.s, topY - 0.16, ch.w, YAW_EAST);
    wallBox(BRICK_DARK, 1.02, 0.10, 0.82, ch.s, topY - 0.06, ch.w, YAW_EAST);
    wallBox(RED_BRICK, 1.08, 0.10, 0.88, ch.s, topY + 0.04, ch.w, YAW_EAST);
    wallBox(CREAM_TRIM, 0.96, 0.06, 0.76, ch.s, topY + 0.12, ch.w, YAW_EAST);
    for (const ds of [-0.22, 0.22]) {
      localCyl(POT_TERRACOTTA, 0.105, 0.125, 0.38, 10, ch.s + ds, topY + 0.34, ch.w);
      localCyl(0x231f1e, 0.08, 0.08, 0.06, 8, ch.s + ds, topY + 0.52, ch.w);
    }
  }

  // ── 6. Photographically Verified Windows, Doors & Facade Fixtures ──────────
  const faceVectors = (face) => {
    if (face === 'east') return { yaw: YAW_EAST, ns: 0, nw: -1, ts: 1, tw: 0 };
    if (face === 'south') return { yaw: YAW_SOUTH, ns: -1, nw: 0, ts: 0, tw: -1 };
    if (face === 'splay') return { yaw: YAW_SPLAY, ns: -Math.SQRT1_2, nw: -Math.SQRT1_2, ts: Math.SQRT1_2, tw: -Math.SQRT1_2 };
    return { yaw: YAW_NORTH, ns: 1, nw: 0, ts: 0, tw: 1 };
  };

  // Detailed 3D double-hung sash window builder
  const buildSashWindow = ({ s, w, y0, y1, width, face, ac = false, triple = false, archTop = false }) => {
    const h = y1 - y0, cy = (y0 + y1) / 2;
    const { yaw, ns, nw, ts, tw } = faceVectors(face);

    const place = (col, W, H, D, out, dy = 0, dx = 0) => {
      wallBox(col, W, H, D, s + ns * out + ts * dx, cy + dy, w + nw * out + tw * dx, yaw);
    };

    // Painted cream masonry surround / architrave & projecting stone sill
    place(CREAM_TRIM, width + 0.22, h + 0.18, 0.06, 0.03, 0.02);
    place(SILL_STONE, width + 0.32, 0.11, 0.16, 0.08, -h / 2 - 0.03);
    if (archTop) {
      place(CREAM_TRIM, width + 0.28, 0.18, 0.09, 0.045, h / 2 + 0.06);
      place(SILL_STONE, 0.22, 0.26, 0.13, 0.065, h / 2 + 0.08);
    }
    // Dark recessed window glazing
    place(WINDOW_GLASS, width, h, 0.05, 0.055);
    // Outer sash frame stiles and rails
    const fw = 0.06;
    place(CREAM_TRIM, width + 0.04, fw, 0.08, 0.075, h / 2 - fw / 2);
    place(CREAM_TRIM, width + 0.04, fw, 0.08, 0.075, -h / 2 + fw / 2);
    place(CREAM_TRIM, fw, h, 0.08, 0.075, 0, -width / 2 + fw / 2);
    place(CREAM_TRIM, fw, h, 0.08, 0.075, 0, width / 2 - fw / 2);
    // Horizontal meeting rail (double-hung sash)
    place(CREAM_TRIM, width, 0.055, 0.09, 0.08, 0.08);
    if (triple) {
      // 3-light window in Bay 3 upstairs: central sash + 2 sidelight mullions + upper transom
      place(CREAM_TRIM, 0.06, h, 0.09, 0.08, 0, -width * 0.24);
      place(CREAM_TRIM, 0.06, h, 0.09, 0.08, 0, width * 0.24);
      place(CREAM_TRIM, width, 0.05, 0.09, 0.08, h * 0.28);
    } else {
      place(WINDOW_FRAME, 0.035, h * 0.46, 0.07, 0.07, h * 0.24, 0);
    }
    // Optional window-mounted box air conditioner (Bay 1 upstairs)
    if (ac === 'box') {
      place(0xdad8d2, width * 0.72, 0.42, 0.50, 0.24, h * 0.22, 0);
      place(0x55585a, width * 0.64, 0.34, 0.04, 0.50, h * 0.22, 0);
    }
  };

  // Detailed 3D recessed pub doorway builder (with panelled timber leaves & glazed fanlight)
  const buildPubDoor = ({ s, w, y1 = 2.85, width = 1.40, face = 'east', doubleLeaf = false }) => {
    const { yaw, ns, nw, ts, tw } = faceVectors(face);
    const place = (col, W, H, D, out, y, dx = 0) => {
      wallBox(col, W, H, D, s + ns * out + ts * dx, y, w + nw * out + tw * dx, yaw);
    };

    // Cream moulded door surround & threshold step
    place(CREAM_TRIM, width + 0.26, y1 + 0.14, 0.07, 0.035, (y1 + 0.14) / 2);
    place(0x9e9589, width + 0.30, 0.12, 0.22, 0.09, 0.06);
    // Dark timber door leaf (0 .. 2.18 m) and glazed fanlight transom (2.22 .. y1)
    const doorH = 2.18, fanH = y1 - doorH - 0.06;
    place(TIMBER_DOOR, width, doorH, 0.06, 0.055, doorH / 2);
    place(CREAM_TRIM, width + 0.06, 0.07, 0.09, 0.08, doorH + 0.03);
    if (fanH > 0.15) {
      place(WINDOW_GLASS, width - 0.08, fanH, 0.05, 0.055, doorH + 0.06 + fanH / 2);
      if (doubleLeaf) place(CREAM_TRIM, 0.05, fanH, 0.08, 0.075, doorH + 0.06 + fanH / 2, 0);
    }
    const leaves = doubleLeaf ? [-width * 0.24, width * 0.24] : [0];
    const leafW = doubleLeaf ? width * 0.42 : width * 0.72;
    if (doubleLeaf) place(0x28140e, 0.035, doorH, 0.08, 0.075, doorH / 2, 0);
    for (const lx of leaves) {
      place(0x563024, leafW, 0.68, 0.07, 0.068, 0.56, lx);
      place(0x563024, leafW, 0.78, 0.07, 0.068, 1.52, lx);
      const hx = doubleLeaf ? lx * 0.35 : width * 0.32;
      place(0xd4b254, 0.04, 0.24, 0.09, 0.085, 1.05, hx);
    }
  };

  // ── 6a. Splayed SE Corner Wall Openings ──
  const splayMidS = SPLAY * 0.5, splayMidW = SPLAY * 0.5;
  buildPubDoor({ s: splayMidS, w: splayMidW, y1: 2.75, width: 1.25, face: 'splay', doubleLeaf: false });
  buildSashWindow({ s: splayMidS, w: splayMidW, y0: 4.35, y1: 6.32, width: 0.96, face: 'splay' });

  // ── 6b. Dandaloo Street (East) Facade — 7 Verandah Bays (South to North) ──
  buildSashWindow({ s: 2.85, w: 0, y0: 4.35, y1: 6.32, width: 0.98, face: 'east', ac: 'box' });
  buildSashWindow({ s: 6.35, w: 0, y0: 4.35, y1: 6.32, width: 0.98, face: 'east' });
  buildSashWindow({ s: 10.30, w: 0, y0: 4.35, y1: 6.32, width: 1.76, face: 'east', triple: true });
  buildSashWindow({ s: 14.35, w: 0, y0: 4.35, y1: 6.32, width: 0.98, face: 'east' });
  buildSashWindow({ s: 18.25, w: 0, y0: 4.35, y1: 6.32, width: 0.98, face: 'east' });
  buildSashWindow({ s: 21.85, w: 0, y0: 4.35, y1: 6.32, width: 0.98, face: 'east' });
  buildSashWindow({ s: 25.05, w: 0, y0: 4.35, y1: 6.32, width: 0.98, face: 'east' });

  // White split-system air-conditioner unit mounted near north end of upper east wall (102255.014.jpg)
  wallBox(0xededeb, 0.82, 0.56, 0.34, 26.35, 5.45, -0.18, YAW_EAST);
  wallBox(0x3a3d40, 0.48, 0.44, 0.04, 26.25, 5.45, -0.36, YAW_EAST);

  // Ground floor along Dandaloo Street (East wall, w = 0):
  buildSashWindow({ s: 3.15, w: 0, y0: 0.85, y1: 2.82, width: 1.15, face: 'east' });
  buildSashWindow({ s: 6.35, w: 0, y0: 0.80, y1: 2.88, width: 1.28, face: 'east' });
  // Two framed wall notices/plaques between Bay 2 bar window and Bay 3 double doors (102250.791.jpg)
  for (const ps of [7.85, 8.55]) {
    wallBox(0x4a3525, 0.52, 0.68, 0.05, ps, 1.62, -0.04, YAW_EAST);
    wallBox(0xdfd5c0, 0.42, 0.58, 0.06, ps, 1.62, -0.05, YAW_EAST);
  }
  // Main hotel double timber entrance doors in Bay 3 (s = 10.30) + small orange/terracotta sign above left
  buildPubDoor({ s: 10.30, w: 0, y1: 2.92, width: 1.56, face: 'east', doubleLeaf: true });
  wallBox(0xc95b2b, 0.52, 0.32, 0.06, 9.15, 2.72, -0.05, YAW_EAST);
  // Bay 4: LOCAL LIQUOR bottle-shop entrance door (s = 14.35)
  buildPubDoor({ s: 14.35, w: 0, y1: 2.45, width: 1.48, face: 'east', doubleLeaf: true });
  // Bay 5, 6, 7 ground floor windows & doorway
  buildSashWindow({ s: 18.25, w: 0, y0: 0.85, y1: 2.82, width: 1.18, face: 'east' });
  buildPubDoor({ s: 21.85, w: 0, y1: 2.82, width: 1.32, face: 'east', doubleLeaf: false });
  buildSashWindow({ s: 25.05, w: 0, y0: 0.85, y1: 2.82, width: 1.18, face: 'east' });

  // ── 6c. Derribong Avenue (South) Facade — 6 Verandah Bays (East to West) ──
  for (const wPos of [3.2, 6.8, 10.6, 14.4, 18.2, 21.4]) {
    buildSashWindow({ s: 0, w: wPos, y0: 4.35, y1: 6.32, width: 0.98, face: 'south' });
  }
  buildSashWindow({ s: 0, w: 3.2, y0: 0.85, y1: 2.82, width: 1.15, face: 'south', archTop: true });
  buildPubDoor({ s: 0, w: 6.4, y1: 2.80, width: 1.30, face: 'south', doubleLeaf: false });
  buildSashWindow({ s: 0, w: 9.6, y0: 0.85, y1: 2.82, width: 1.15, face: 'south', archTop: true });
  for (const nwPos of [11.4, 12.3, 13.2]) {
    wallBox(0xf0eee8, 0.72, 0.92, 0.06, -0.05, 1.55, nwPos, YAW_SOUTH);
  }
  buildPubDoor({ s: 0, w: 15.2, y1: 2.80, width: 1.30, face: 'south', doubleLeaf: false });
  buildSashWindow({ s: 0, w: 18.2, y0: 0.85, y1: 2.82, width: 1.15, face: 'south', archTop: true });
  buildSashWindow({ s: 0, w: 21.2, y0: 0.85, y1: 2.82, width: 1.15, face: 'south', archTop: true });

  // ── 6d. Exposed Red-Brick Upper North Wall Windows (102255.014.jpg) ──
  for (const wPos of [2.6, 6.2, 10.0]) {
    buildSashWindow({ s: 27.25, w: wPos, y0: 4.45, y1: 6.25, width: 0.92, face: 'north' });
  }

  // ── 7. Two-Storey Wraparound Verandah & Open Victorian Cast-Iron Lacework ──
  {
    const V_DEPTH = 3.55;
    const BALC_Y = 3.75;
    const RAIL_TOP_Y = 4.76;
    const RAIL_BOT_Y = 3.86;
    const EAVE_OUT_Y = 7.18;
    const EAVE_WALL_Y = 7.68;

    // 7 East bays (P_E0 .. P_E7) and 6 South bays (P_S0 .. P_S6), plus the 45° SE corner bay (P_S0 -> P_E0)
    const eastPostsS = [-0.85, 3.16, 7.17, 11.18, 15.19, 19.20, 23.21, 27.22];
    const southPostsW = [-0.85, 3.15, 7.15, 11.15, 15.15, 19.15, 23.15];

    const eastPosts = eastPostsS.map((s) => [s, -V_DEPTH]);
    const southPosts = southPostsW.map((w) => [-V_DEPTH, w]);

    // Continuous mid-level balcony deck (y = 3.75 m) wrapping the 45° corner without overlap
    const balcPoly = [
      [27.25, -0.02],
      [27.25, -V_DEPTH - 0.10],
      [-0.88, -V_DEPTH - 0.10],
      [-V_DEPTH - 0.10, -0.88],
      [-V_DEPTH - 0.10, 23.20],
      [-0.02, 23.20],
      [-0.02, SPLAY],
      [SPLAY, -0.02],
    ];
    pushLocal(SOFFIT_CREAM, extrudeFootprint(balcPoly, BALC_Y - 0.14, BALC_Y - 0.02, 0));
    pushLocal(BALCONY_DECK, extrudeFootprint(balcPoly, BALC_Y - 0.02, BALC_Y + 0.08, 0));

    // Continuous sloping galvanised verandah roof (y = 7.68 m at wall -> 7.18 m at outer eave)
    const V = (s, y, w) => [-w, y, -s];
    const vrOut = V_DEPTH + 0.22;
    const W_N = V(27.32, EAVE_WALL_Y, 0), W_EC = V(SPLAY, EAVE_WALL_Y, 0);
    const W_SC = V(0, EAVE_WALL_Y, SPLAY), W_W = V(0, EAVE_WALL_Y, 23.28);
    const O_N = V(27.32, EAVE_OUT_Y, -vrOut), O_EC = V(-0.90, EAVE_OUT_Y, -vrOut);
    const O_SC = V(-vrOut, EAVE_OUT_Y, -0.90), O_W = V(-vrOut, EAVE_OUT_Y, 23.28);

    const vRoofTris = [
      W_EC, W_N, O_N, W_EC, O_N, O_EC,
      W_SC, W_EC, O_EC, W_SC, O_EC, O_SC,
      W_W, W_SC, O_SC, W_W, O_SC, O_W,
    ];
    const vRoofGeo = new THREE.BufferGeometry();
    vRoofGeo.setAttribute('position', new THREE.Float32BufferAttribute(vRoofTris.flat(), 3));
    vRoofGeo.computeVertexNormals();
    pushLocal(ROOF_GALV, vRoofGeo);
    const vSoffitGeo = vRoofGeo.clone();
    vSoffitGeo.translate(0, -0.05, 0);
    pushLocal(SOFFIT_CREAM, vSoffitGeo);

    // Raised galvanised hip rolls at the two corner hip rafters of the verandah roof
    for (const [pA, pB] of [
      [[SPLAY, EAVE_WALL_Y + 0.03, 0], [-0.90, EAVE_OUT_Y + 0.03, -vrOut]],
      [[0, EAVE_WALL_Y + 0.03, SPLAY], [-vrOut, EAVE_OUT_Y + 0.03, -0.90]],
    ]) {
      const a = new THREE.Vector3(...V(...pA)), b = new THREE.Vector3(...V(...pB));
      const d = b.clone().sub(a), len = d.length();
      const g = new THREE.CylinderGeometry(0.055, 0.055, len, 6);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
      g.translate(...a.add(b).multiplyScalar(0.5).toArray());
      pushLocal(ROOF_ROLL, g);
    }

    // Build all 14 heritage-green verandah columns with moulded bases, mid-collars, capitals & foot colliders
    const allPosts = [...eastPosts, ...southPosts.slice(1)];
    for (const [ps, pw] of allPosts) {
      localCyl(HERITAGE_GREEN, 0.068, 0.075, EAVE_OUT_Y, 8, ps, EAVE_OUT_Y / 2, pw);
      wallBox(HERITAGE_GREEN, 0.21, 0.42, 0.21, ps, 0.21, pw, 0);
      wallBox(HERITAGE_GREEN, 0.17, 0.12, 0.17, ps, 0.46, pw, 0);
      wallBox(HERITAGE_GREEN, 0.19, 0.28, 0.19, ps, BALC_Y, pw, 0);
      wallBox(HERITAGE_GREEN, 0.20, 0.18, 0.20, ps, EAVE_OUT_Y - 0.12, pw, 0);
      const [wx, wz] = hotelToWorld(ps, pw);
      colliders.push({ x0: wx - 0.14, x1: wx + 0.14, z0: wz - 0.14, z1: wz + 0.14 });
    }
    // Yellow-and-red kerbside protective steel bollards on Derribong Ave (102238.751.jpg & 102248.643.jpg)
    for (const bw of [1.8, 5.2, 8.8]) {
      localCyl(0xe6b800, 0.06, 0.06, 0.95, 8, -V_DEPTH - 0.32, 0.48, bw);
      localCyl(0xc8202b, 0.063, 0.063, 0.18, 8, -V_DEPTH - 0.32, 0.82, bw);
    }

    // Open Victorian cast-iron lacework textures (alphaTest cutout so sky & facade show through!)
    const friezeTex = createLaceFriezeTexture();
    const balTex = createLaceBalustradeTexture();
    const friezeMat = friezeTex
      ? new THREE.MeshLambertMaterial({ map: friezeTex, alphaTest: 0.42, side: THREE.DoubleSide })
      : null;
    const balMat = balTex
      ? new THREE.MeshLambertMaterial({ map: balTex, alphaTest: 0.42, side: THREE.DoubleSide })
      : null;

    // Build a complete verandah bay between post A (s0, w0) and post B (s1, w1)
    // Because `wallBox` and `PlaneGeometry` share the exact same axes (width=X, height=Y, depth=Z),
    // every beam, gutter, handrail, bracket, and lace plane uses the exact same `bayYaw`!
    const buildVerandahBay = (s0, w0, s1, w1, { hasLowerFrieze = true } = {}) => {
      const ms = (s0 + s1) / 2, mw = (w0 + w1) / 2;
      const ds = s1 - s0, dw = w1 - w0, len = Math.hypot(ds, dw);
      const bayYaw = -Math.atan2(-ds, -dw);
      const span = Math.max(0.2, len - 0.13);

      // 1. Heritage-green structural beams & handrails (aligned along X = width of bay):
      wallBox(HERITAGE_GREEN, len + 0.06, 0.20, 0.14, ms, EAVE_OUT_Y - 0.06, mw, bayYaw);
      wallBox(GUTTER_COL, len + 0.10, 0.10, 0.18, ms, EAVE_OUT_Y + 0.06, mw, bayYaw);
      wallBox(HERITAGE_GREEN, len + 0.06, 0.28, 0.18, ms, BALC_Y - 0.02, mw, bayYaw);
      wallBox(HERITAGE_GREEN, span, 0.065, 0.08, ms, RAIL_TOP_Y, mw, bayYaw);
      wallBox(HERITAGE_GREEN, span, 0.055, 0.07, ms, RAIL_BOT_Y, mw, bayYaw);
      wallBox(HERITAGE_GREEN, 0.05, RAIL_TOP_Y - RAIL_BOT_Y, 0.05, ms, (RAIL_TOP_Y + RAIL_BOT_Y) / 2, mw, bayYaw);

      // 2. 3D cast-iron corner brackets & open filigree lacework panels:
      const upperFriezeH = 0.56, upperFriezeY = EAVE_OUT_Y - 0.14 - upperFriezeH / 2;
      const lowerFriezeH = 0.50, lowerFriezeY = BALC_Y - 0.14 - lowerFriezeH / 2;
      const balH = RAIL_TOP_Y - RAIL_BOT_Y - 0.04, balY = (RAIL_TOP_Y + RAIL_BOT_Y) / 2;

      for (const endSign of [-1, 1]) {
        for (const [fy, fh] of hasLowerFrieze ? [[upperFriezeY, upperFriezeH], [lowerFriezeY, lowerFriezeH]] : [[upperFriezeY, upperFriezeH]]) {
          for (let step = 0; step < 3; step++) {
            const frac = (step + 0.5) / 3;
            const bw = 0.12, bh = fh * (0.85 - frac * 0.45);
            const offsetAlong = endSign * (span / 2 - 0.06 - step * 0.12);
            const bs = ms + (ds / len) * offsetAlong;
            const bwPos = mw + (dw / len) * offsetAlong;
            wallBox(LACE_CREAM, bw, bh, 0.035, bs, fy + (fh - bh) / 2 - 0.04, bwPos, bayYaw);
          }
        }
      }

      if (friezeMat && balMat) {
        addLocalMesh(new THREE.PlaneGeometry(span, upperFriezeH), friezeMat, ms, upperFriezeY, mw, bayYaw);
        if (hasLowerFrieze) {
          addLocalMesh(new THREE.PlaneGeometry(span, lowerFriezeH), friezeMat, ms, lowerFriezeY, mw, bayYaw);
        }
        addLocalMesh(new THREE.PlaneGeometry(span, balH), balMat, ms, balY, mw, bayYaw);
      } else {
        wallBox(LACE_CREAM, span, 0.22, 0.03, ms, upperFriezeY + 0.12, mw, bayYaw);
        wallBox(LACE_CREAM, span * 0.92, balH * 0.85, 0.03, ms, balY, mw, bayYaw);
      }
    };

    // [address redacted]
    for (let i = 0; i < eastPosts.length - 1; i++) {
      buildVerandahBay(...eastPosts[i], ...eastPosts[i + 1]);
    }
    // 1 Splayed 45° SE Corner bay (P_S0 -> P_E0)
    buildVerandahBay(...southPosts[0], ...eastPosts[0], { hasLowerFrieze: true });
    // [address redacted]
    for (let i = 0; i < southPosts.length - 1; i++) {
      buildVerandahBay(...southPosts[i], ...southPosts[i + 1]);
    }
    // North end return (at s = 27.22, from wall w = 0 out to post w = -V_DEPTH)
    buildVerandahBay(27.22, 0, 27.22, -V_DEPTH);
    // West end return (at w = 23.15, from post s = -V_DEPTH in to wall s = 0)
    buildVerandahBay(-V_DEPTH, 23.15, 0, 23.15);

    // ── 8. Authentic Hotel Signage (Verified Proportions, Typography & Positions) ──
    // 8a. "NARROMINE HOTEL MOTEL" fascia sign across the 45° splayed SE corner balcony fascia
    const cornerMidS = (southPosts[0][0] + eastPosts[0][0]) / 2;
    const cornerMidW = (southPosts[0][1] + eastPosts[0][1]) / 2;
    const cornerSpan = Math.hypot(eastPosts[0][0] - southPosts[0][0], eastPosts[0][1] - southPosts[0][1]);
    const outSplay = 0.11 * Math.SQRT1_2;
    wallBox(0xf4f0e2, cornerSpan + 0.04, 0.54, 0.06, cornerMidS - outSplay, BALC_Y + 0.02, cornerMidW - outSplay, YAW_SPLAY);
    const fasciaTex = createCornerFasciaSignTexture();
    if (fasciaTex) {
      const fg = new THREE.PlaneGeometry(cornerSpan + 0.02, 0.52);
      addLocalMesh(
        fg,
        new THREE.MeshLambertMaterial({ map: fasciaTex }),
        cornerMidS - outSplay - 0.03,
        BALC_Y + 0.02,
        cornerMidW - outSplay - 0.03,
        YAW_SPLAY
      );
    }

    // 8b. Upper corner projecting blade sign ("Narromine Hotel" with arched top crest) on post P_E0
    // Projects radially South-East from post P_E0; its two faces look NE (3*PI/4) and SW (-PI/4).
    const [bPostS, bPostW] = eastPosts[0];
    const bladeOutS = bPostS - 0.46, bladeOutW = bPostW - 0.46;
    wallBox(0xf6f5f0, 1.06, 1.04, 0.08, bladeOutS, 6.12, bladeOutW, (3 * Math.PI) / 4);
    wallBox(HERITAGE_GREEN, 0.65, 0.05, 0.05, (bPostS + bladeOutS) / 2, 6.45, (bPostW + bladeOutW) / 2, (3 * Math.PI) / 4);
    wallBox(HERITAGE_GREEN, 0.65, 0.05, 0.05, (bPostS + bladeOutS) / 2, 5.75, (bPostW + bladeOutW) / 2, (3 * Math.PI) / 4);
    const bladeTex = createBladeSignTexture();
    if (bladeTex) {
      const bladeMat = new THREE.MeshLambertMaterial({ map: bladeTex });
      // Face looking North-East (toward Dandaloo St approach)
      addLocalMesh(
        new THREE.PlaneGeometry(1.04, 1.02),
        bladeMat,
        bladeOutS + 0.035,
        6.12,
        bladeOutW - 0.035,
        (3 * Math.PI) / 4
      );
      // Face looking South-West (toward Derribong Ave approach)
      addLocalMesh(
        new THREE.PlaneGeometry(1.04, 1.02),
        bladeMat,
        bladeOutS - 0.035,
        6.12,
        bladeOutW + 0.035,
        -Math.PI / 4
      );
    }

    // 8c. Red "LOCAL LIQUOR" wall sign above Bay 4 bottle-shop doorway (s = 14.35, y = 2.68 m)
    wallBox(0xc8202b, 2.36, 0.48, 0.06, 14.35, 2.68, -0.05, YAW_EAST);
    const liquorTex = createLocalLiquorTexture();
    if (liquorTex) {
      const lg = new THREE.PlaneGeometry(2.34, 0.46);
      addLocalMesh(lg, new THREE.MeshLambertMaterial({ map: liquorTex }), 14.35, 2.68, -0.09, YAW_EAST);
    }

    // 8d. Green "TAB" wall signs near the SE corner entrance (s = 2.05 on East wall & w = 2.05 on South wall)
    wallBox(0x1b6b3a, 0.80, 0.42, 0.05, 2.05, 2.38, -0.04, YAW_EAST);
    wallBox(0x1b6b3a, 0.80, 0.42, 0.05, -0.04, 2.38, 2.05, YAW_SOUTH);
    const tabTex = createTabSignTexture();
    if (tabTex) {
      const tabMat = new THREE.MeshLambertMaterial({ map: tabTex });
      addLocalMesh(new THREE.PlaneGeometry(0.78, 0.40), tabMat, 2.05, 2.38, -0.08, YAW_EAST);
      addLocalMesh(new THREE.PlaneGeometry(0.78, 0.40), tabMat, -0.08, 2.38, 2.05, YAW_SOUTH);
    }
  }

  // ── 9. Adjoining Single-Storey Northern Shopfront (Street View 102253–102257) ──
  {
    const s0 = 27.23, s1 = 41.20, sm = (s0 + s1) / 2, sLen = s1 - s0;
    const w0 = 0.15, w1 = 12.20, wm = (w0 + w1) / 2, wDepth = w1 - w0;
    const shH = 3.85;
    wallBox(SHOP_CHARCOAL, sLen, shH, wDepth, sm, shH / 2, wm, YAW_EAST);
    // Galvanised roof & fascia
    wallBox(ROOF_GALV, sLen + 0.30, 0.16, wDepth + 0.30, sm, shH + 0.08, wm, YAW_EAST);
    wallBox(0xd8dad6, sLen + 0.36, 0.24, 0.12, sm, shH - 0.04, w0 - 0.04, YAW_EAST);
    // White decorative lattice parapet on the northern half of the shopfront (s = 32.0 .. 41.2)
    wallBox(0xeceae2, 8.80, 0.95, 0.22, 36.60, shH + 0.48, w0 + 0.08, YAW_EAST);
    for (let k = 0; k < 16; k++) {
      wallBox(0x9a9890, 0.18, 0.65, 0.25, 32.60 + k * 0.52, shH + 0.48, w0 + 0.06, YAW_EAST);
    }
    // Glazed shopfront windows & central doorway with red/pink trim reveal (102255.014.jpg)
    wallBox(WINDOW_GLASS, 3.40, 2.25, 0.08, 29.80, 1.35, w0 - 0.02, YAW_EAST);
    wallBox(0xc9b8a8, 3.50, 0.10, 0.12, 29.80, 2.52, w0 - 0.03, YAW_EAST);
    wallBox(WINDOW_GLASS, 6.20, 2.25, 0.08, 36.20, 1.35, w0 - 0.02, YAW_EAST);
    wallBox(0xd45b65, 1.35, 2.35, 0.12, 35.10, 1.22, w0 - 0.04, YAW_EAST);
    wallBox(WINDOW_GLASS, 1.05, 2.15, 0.14, 35.10, 1.18, w0 - 0.05, YAW_EAST);
    pushSlicedCollider(s0, s1, w0, w1);
  }

  // ── 10. Rear Infill & West Outbuildings (from Aerial & 2023 LiDAR) ──────────
  const frameOf = (pts) => {
    const [a, b, , d] = pts;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const W = Math.hypot(d[0] - a[0], d[1] - a[1]);
    const cx = pts.reduce((s, p) => s + p[0], 0) / 4;
    const cz = pts.reduce((s, p) => s + p[1], 0) / 4;
    return { L, W, cx, cz, yaw: -Math.atan2(b[1] - a[1], b[0] - a[0]) };
  };
  const buildSimpleHip = (c, pts, wallH, ridgeTop) => {
    const { L, W: w2, cx, cz, yaw } = frameOf(pts);
    const alongX = L >= w2, half = Math.min(L, w2) / 2;
    const h = Math.max(0.6, (ridgeTop || wallH + 1.4) - wallH);
    const x0 = -L / 2 - 0.25, x1 = L / 2 + 0.25, z0 = -w2 / 2 - 0.25, z1 = w2 / 2 + 0.25;
    const y0 = wallH, y1 = wallH + h;
    const ra = alongX ? [x0 + half, 0] : [0, z0 + half];
    const rb = alongX ? [x1 - half, 0] : [0, z1 - half];
    const A = [x0, y0, z0], B = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1];
    const P = [ra[0], y1, ra[1]], Q = [rb[0], y1, rb[1]];
    const tris = alongX
      ? [A, P, Q, A, Q, B, B, Q, C, C, Q, P, C, P, D, D, P, A]
      : [A, B, P, B, Q, P, B, C, Q, C, D, Q, D, P, Q, D, A, P];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
    g.rotateY(yaw);
    g.translate(cx, 0, cz);
    g.computeVertexNormals();
    push(c, g);
  };

  for (const p of nh.parts) {
    if (p.storeys === 2) continue;
    const f = frameOf(p.pts);
    const Ld = p.lidar;
    const pitched = p.roof === 'hip';
    const wallH = Ld ? Math.max(2.6, pitched ? (Ld[4] - 0.3 * Ld[3]) / 0.7 : Ld[4]) : 3.5;
    const wallCol = p.name === 'rear infill' ? CREAM_WALL : 0xd8ceb8;
    box(wallCol, f.L, wallH, f.W, f.cx, wallH / 2, f.cz, f.yaw);
    box(GUTTER_COL, f.L + 0.35, 0.12, f.W + 0.35, f.cx, wallH - 0.04, f.cz, f.yaw);
    if (pitched) buildSimpleHip(ROOF_GALV, p.pts, wallH, Ld ? Ld[3] : wallH + 1.3);
    else box(ROOF_GALV, f.L + 0.4, 0.14, f.W + 0.4, f.cx, wallH + 0.08, f.cz, f.yaw);
    colliders.push(polyRect(p.pts));
  }

  // ── 11. Street-Corner Road Direction Signs, Utility Pole & Street Trees ────
  {
    localCyl(0x6e5d4b, 0.11, 0.14, 9.2, 8, -2.1, 4.6, -3.95);
    wallBox(0x8a8f94, 0.08, 0.08, 2.2, -2.1, 8.6, -5.0, YAW_SPLAY);

    // Pair of green/blue directional road fingerboards at the SE kerb (s = 1.45 .. 3.65, w = -4.25)
    for (const ps of [1.45, 2.55, 3.65]) {
      localCyl(0x9aa0a4, 0.04, 0.04, 2.35, 6, ps, 1.18, -4.25);
    }
    wallBox(0x166839, 1.15, 0.55, 0.05, 2.00, 1.85, -4.25, YAW_EAST + 0.15);
    wallBox(0x166839, 1.15, 0.62, 0.05, 3.10, 1.88, -4.25, YAW_EAST - 0.12);
    const sign1Tex = createRoadFingerboardTexture(['THE WATERING WHARF', 'Tullamore'], {
      bg: '#166839',
      headerBg: '#185a9d',
      headerText: 'HOSPITAL ->',
    });
    const sign2Tex = createRoadFingerboardTexture(['Dubbo', 'Nyngan'], {
      bg: '#166839',
      headerBg: '#185a9d',
      headerText: 'TOWN CENTRE ->',
    });
    if (sign1Tex && sign2Tex) {
      addLocalMesh(
        new THREE.PlaneGeometry(1.12, 0.52),
        new THREE.MeshLambertMaterial({ map: sign1Tex, side: THREE.DoubleSide }),
        2.00,
        1.85,
        -4.29,
        YAW_EAST + 0.15
      );
      addLocalMesh(
        new THREE.PlaneGeometry(1.12, 0.60),
        new THREE.MeshLambertMaterial({ map: sign2Tex, side: THREE.DoubleSide }),
        3.10,
        1.88,
        -4.29,
        YAW_EAST - 0.12
      );
    }

    // Suppress s=21.5: not individually located and obstructs verified hotel sightline.
    // Keep photo-evidenced northern kerb tree at s=33.8 (canopy size approximate).
    for (const ts of [33.8]) {
      const tw = -5.1;
      localCyl(0x6e5a47, 0.14, 0.18, 3.4, 7, ts, 1.7, tw);
      for (const [ds, dw] of [[-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45]]) {
        wallBox(0x7c664d, 0.07, 1.1, 0.07, ts + ds, 0.55, tw + dw, 0);
      }
      wallBox(0x7c664d, 0.96, 0.07, 0.96, ts, 0.95, tw, 0);
      const [wx, wz] = hotelToWorld(ts, tw);
      const c1 = new THREE.SphereGeometry(2.6, 8, 6);
      c1.scale(1, 0.78, 1);
      c1.translate(wx, 4.6, wz);
      push(0x6c7c53, c1);
    }
  }

  // Rear yard trees from aerial survey
  for (const [tx, tz] of nh.trees || []) {
    box(0x8f8577, 0.5, 4, 0.5, tx, 2, tz);
    const g3 = new THREE.SphereGeometry(4.2, 8, 6);
    g3.scale(1, 0.7, 1);
    g3.translate(tx, 6.5, tz);
    push(0x5d7d43, g3);
  }
}
