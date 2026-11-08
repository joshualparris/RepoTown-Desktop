// Three.js reconstruction of the Narromine Railway Station precinct
// (Main Western Line, 497.554 km from Sydney; Narromine LEP 2011 Item I11).
//
// Works both:
//   1) Standalone: `buildNarromineRailwayPrecinct()` returns `{ group, colliders, spots, stats, evidence }`
//      with geometries merged by material colour for draw-call efficiency.
//   2) Integrated: `buildNarromineRailwayPrecinct({ box, push, strip, flatPoly, plane, boardTexture, colliders, spots })`
//      feeds directly into `src/world/narromine.js`'s spatial tile batcher.
import * as THREE from 'three';
function mergeGeometries(geos) {
  let n = 0;
  for (const g of geos) n += g.index ? g.index.count : g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let o = 0;
  for (const g0 of geos) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, o);
    nor.set(g.attributes.normal.array, o);
    o += g.attributes.position.array.length;
    if (g !== g0) g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return m;
}
import {
  NARROMINE_RAILWAY_HERITAGE,
  NARROMINE_RAILWAY_BUILDINGS,
  NARROMINE_RAILWAY_PLATFORM,
  NARROMINE_RAILWAY_FORECOURT,
  NARROMINE_RAILWAY_TRACKS,
  NARROMINE_RAILWAY_PRECINCT_GEOJSON,
  NARROMINE_RAILWAY_INTEGRATION_SPEC,
} from './narromine-railway-evidence.js';

//Compute oriented frame { cx, cz, L, W, ux, uz, nx, nz, yaw } from a 4-point quad
//where edge 0->1 is the primary longitudinal axis.
export function quadFrame(pts) {
  const [p0, p1, p2, p3] = pts;
  const cx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4;
  const cz = (p0[1] + p1[1] + p2[1] + p3[1]) / 4;
  const dx = p1[0] - p0[0];
  const dz = p1[1] - p0[1];
  const L = Math.hypot(dx, dz) || 1;
  const ux = dx / L;
  const uz = dz / L;
  // Normal pointing from edge 0->1 toward edge 3->2
  const mx01 = (p0[0] + p1[0]) / 2;
  const mz01 = (p0[1] + p1[1]) / 2;
  const mx32 = (p3[0] + p2[0]) / 2;
  const mz32 = (p3[1] + p2[1]) / 2;
  const wx = mx32 - mx01;
  const wz = mz32 - mz01;
  const W = Math.hypot(wx, wz) || 1;
  const nx = wx / W;
  const nz = wz / W;
  const yaw = -Math.atan2(dz, dx);
  return { cx, cz, L, W, ux, uz, nx, nz, yaw };
}

// Slice an angled quad into tight axis-aligned bounding boxes so its diagonal
// never blocks adjacent walkways, platforms, or roads.
export function sliceQuadColliders(pts, minSlices = 4, stepM = 1.8) {
  const [a, b, c, d] = pts;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const slices = Math.max(minSlices, Math.ceil(len / stepM));
  const out = [];
  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    const corners = [
      [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0],
      [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1],
      [d[0] + (c[0] - d[0]) * t1, d[1] + (c[1] - d[1]) * t1],
      [d[0] + (c[0] - d[0]) * t0, d[1] + (c[1] - d[1]) * t0],
    ];
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, z] of corners) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (z < z0) z0 = z;
      if (z > z1) z1 = z;
    }
    out.push({ x0, x1, z0, z1 });
  }
  return out;
}

function makeHippedRoofGeometry(pts, eaveH, ridgeH) {
  const f = quadFrame(pts);
  const rise = Math.max(0.25, ridgeH - eaveH);
  const inset = Math.min(f.L * 0.42, f.W * 0.5);
  const ridgeHalfL = Math.max(0.2, f.L / 2 - inset);
  const p = [
    pts[0],
    pts[1],
    pts[2],
    pts[3],
    [f.cx - f.ux * ridgeHalfL, f.cz - f.uz * ridgeHalfL],
    [f.cx + f.ux * ridgeHalfL, f.cz + f.uz * ridgeHalfL],
  ];
  const V = (idx, y) => [p[idx][0], y, p[idx][1]];
  const tri = (a, b, c) => [...a, ...b, ...c];
  const verts = [
    ...tri(V(0, eaveH), V(1, eaveH), V(5, ridgeH)),
    ...tri(V(0, eaveH), V(5, ridgeH), V(4, ridgeH)),
    ...tri(V(2, eaveH), V(3, eaveH), V(4, ridgeH)),
    ...tri(V(2, eaveH), V(4, ridgeH), V(5, ridgeH)),
    ...tri(V(3, eaveH), V(0, eaveH), V(4, ridgeH)),
    ...tri(V(1, eaveH), V(2, eaveH), V(5, ridgeH)),
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}

function makeGableRoofGeometry(pts, eaveH, ridgeH) {
  const f = quadFrame(pts);
  const halfL = f.L / 2;
  const p = [
    pts[0],
    pts[1],
    pts[2],
    pts[3],
    [f.cx - f.ux * halfL, f.cz - f.uz * halfL],
    [f.cx + f.ux * halfL, f.cz + f.uz * halfL],
  ];
  const V = (idx, y) => [p[idx][0], y, p[idx][1]];
  const tri = (a, b, c) => [...a, ...b, ...c];
  const slopeVerts = [
    ...tri(V(0, eaveH), V(1, eaveH), V(5, ridgeH)),
    ...tri(V(0, eaveH), V(5, ridgeH), V(4, ridgeH)),
    ...tri(V(2, eaveH), V(3, eaveH), V(4, ridgeH)),
    ...tri(V(2, eaveH), V(4, ridgeH), V(5, ridgeH)),
  ];
  const gableVerts = [
    ...tri(V(3, eaveH), V(0, eaveH), V(4, ridgeH)),
    ...tri(V(1, eaveH), V(2, eaveH), V(5, ridgeH)),
  ];
  const slopeGeo = new THREE.BufferGeometry();
  slopeGeo.setAttribute('position', new THREE.Float32BufferAttribute(slopeVerts, 3));
  slopeGeo.computeVertexNormals();
  const gableGeo = new THREE.BufferGeometry();
  gableGeo.setAttribute('position', new THREE.Float32BufferAttribute(gableVerts, 3));
  gableGeo.computeVertexNormals();
  return { slopeGeo, gableGeo };
}

export function buildNarromineRailwayPrecinct(ctx = {}) {
  const group = ctx.parent || new THREE.Group();
  if (!ctx.parent) group.name = 'NarromineRailwayPrecinct';

  const colliders = ctx.colliders || [];
  const spots = ctx.spots || [];
  const localBuckets = new Map();

  const push = ctx.push || ((colour, geo) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.deleteAttribute('uv');
    if (!localBuckets.has(colour)) localBuckets.set(colour, []);
    localBuckets.get(colour).push(g);
  });

  const box = ctx.box || ((colour, w, h, d, x, y, z, ry = 0) => {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    push(colour, g);
  });

  const strip = ctx.strip || ((colour, ax, az, bx, bz, w, y = 0.04, h = 0.08) => {
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz);
    if (len < 0.05) return;
    box(colour, len + w * 0.25, h, w, (ax + bx) / 2, y - h / 2, (az + bz) / 2, -Math.atan2(dz, dx));
  });

  const flatPoly = ctx.flatPoly || ((colour, pts, y = 0.03) => {
    if (pts.length < 3) return;
    const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    g.translate(0, y, 0);
    push(colour, g);
  });

  // Shared precinct material palette so standalone & tiled builds stay within <= 20 draw calls
  const P = Object.freeze({
    brick: 0x964b3b,       // Station face brick & platform brick wall
    plinth: 0x6d362b,      // Darker brick base plinth & ridge capping
    pier: 0x7f3d30,        // Engaged brick pilasters
    trim: 0xe6dcc8,        // Cream rendered sills, lintels, copings & white railway fencing
    signWhite: 0xf4f1e8,   // Heritage station nameboards & lamp globes
    roofTile: 0x8d4532,    // Terracotta Marseilles roof tiles & post caps
    awningRoof: 0x6e767a,  // Corrugated steel awning & yard roofs
    corrugatedWall: 0x9aa09d, // Eastern goods shed corrugated cladding
    weatherboard: 0xc8bfa8,   // Level crossing relay hut cladding
    asphalt: 0x525559,     // Forecourt & platform asphalt surfaces
    ballast: 0x85796d,     // Crushed basalt track ballast
    steelDark: 0x33383c,   // Structural steel posts, lamp standards, sign borders & frames
    railSteel: 0x585c60,   // Running rails & goods doors
    windowGlass: 0x2f4450, // Station & shelter glazing
    timber: 0x5b4634,      // Timber doors, benches, loading stage & sleepers
    tactileYellow: 0xd8a828, // Platform safety tactile strip
    coachOrange: 0xd87a22, // NSW TrainLink coach stop band
    coachBlue: 0x1f4e78,   // Transport for NSW / TrainLink blue band
  });

  // ── 1. Forecourt Paving & NSW TrainLink Regional Coach Stop ───────────────
  const forecourt = NARROMINE_RAILWAY_FORECOURT;
  flatPoly(P.asphalt, forecourt.forecourtPavingWorld, 0.055);
  // Concrete kerb between Narromine Station Access and station forecourt apron
  strip(
    P.trim,
    forecourt.forecourtPavingWorld[0][0],
    forecourt.forecourtPavingWorld[0][1],
    forecourt.forecourtPavingWorld[1][0],
    forecourt.forecourtPavingWorld[1][1],
    0.22,
    0.14,
    0.12
  );

  // NSW TrainLink Coach Stop Shelter & Totem Sign (documented current use; estimated exact bay)
  {
    const cs = forecourt.coachStop;
    const sf = quadFrame(cs.shelterPtsWorld);
    // Concrete pad
    box(P.trim, sf.L + 0.4, 0.10, sf.W + 0.4, sf.cx, 0.05, sf.cz, sf.yaw);
    // Steel posts, glazed rear screen, cantilevered shelter roof, bench seat
    for (const s of [-1, 1]) {
      const px = sf.cx + sf.ux * (s * (sf.L / 2 - 0.18)) + sf.nx * (sf.W / 2 - 0.15);
      const pz = sf.cz + sf.uz * (s * (sf.L / 2 - 0.18)) + sf.nz * (sf.W / 2 - 0.15);
      box(P.steelDark, 0.09, 2.45, 0.09, px, 1.25, pz, sf.yaw);
    }
    const backX = sf.cx + sf.nx * (sf.W / 2 - 0.12);
    const backZ = sf.cz + sf.nz * (sf.W / 2 - 0.12);
    box(P.windowGlass, sf.L - 0.35, 1.55, 0.05, backX, 1.35, backZ, sf.yaw);
    box(P.steelDark, sf.L - 0.25, 0.07, 0.08, backX, 2.15, backZ, sf.yaw);
    box(P.awningRoof, sf.L + 0.35, 0.10, sf.W + 0.35, sf.cx, 2.50, sf.cz, sf.yaw);
    box(P.coachOrange, sf.L + 0.37, 0.08, 0.06, sf.cx - sf.nx * (sf.W / 2 + 0.15), 2.52, sf.cz - sf.nz * (sf.W / 2 + 0.15), sf.yaw);
    box(P.timber, sf.L - 0.9, 0.08, 0.42, sf.cx + sf.nx * 0.15, 0.52, sf.cz + sf.nz * 0.15, sf.yaw);
    // Coach stop timetable totem blade
    const totemX = sf.cx - sf.ux * (sf.L / 2 + 0.85);
    const totemZ = sf.cz - sf.uz * (sf.L / 2 + 0.85);
    box(P.signWhite, 0.32, 2.25, 0.10, totemX, 1.15, totemZ, sf.yaw);
    box(P.coachOrange, 0.34, 0.42, 0.11, totemX, 2.02, totemZ, sf.yaw);
    box(P.coachBlue, 0.34, 0.28, 0.11, totemX, 1.65, totemZ, sf.yaw);
    // Open-front shelter remains walkable so passengers can stand under the canopy at the coach stop spot.
  }

  // ── 2. Passenger Side Platform 1 (`NARROMINE_RAILWAY_PLATFORM`) ───────────
  const plat = NARROMINE_RAILWAY_PLATFORM;
  const pf = quadFrame(plat.ptsWorld);
  const platH = 0.42; // Visual deck height relative to y=0 player ground plane (evidence heightM=0.95m above rail)
  {
    // Main platform deck and brick trackside wall
    box(P.brick, pf.L, platH - 0.10, pf.W - 0.12, pf.cx, (platH - 0.10) / 2, pf.cz, pf.yaw);
    // Asphalt platform surface
    box(P.asphalt, pf.L, 0.10, pf.W, pf.cx, platH - 0.05, pf.cz, pf.yaw);
    // White concrete trackside coping edge (along edge 3->2, i.e. +n side)
    const copingX = pf.cx + pf.nx * (pf.W / 2 - 0.18);
    const copingZ = pf.cz + pf.nz * (pf.W / 2 - 0.18);
    box(P.trim, pf.L + 0.1, 0.11, 0.38, copingX, platH - 0.03, copingZ, pf.yaw);
    // Yellow tactile safety strip 0.65 m back from coping edge
    const tacX = pf.cx + pf.nx * (pf.W / 2 - 0.68);
    const tacZ = pf.cz + pf.nz * (pf.W / 2 - 0.68);
    box(P.tactileYellow, pf.L - 4.0, 0.02, 0.32, tacX, platH + 0.005, tacZ, pf.yaw);

    // Sloped end ramps (5.5 m at SW and NE ends)
    for (const endSign of [-1, 1]) {
      const rampLen = plat.rampLengthM;
      const rx = pf.cx + pf.ux * endSign * (pf.L / 2 + rampLen / 2 - 0.1);
      const rz = pf.cz + pf.uz * endSign * (pf.L / 2 + rampLen / 2 - 0.1);
      box(P.asphalt, rampLen, platH * 0.55, pf.W - 0.2, rx, platH * 0.275, rz, pf.yaw);
    }

    // Heritage double-sided station nameboards ("NARROMINE") on white timber/steel posts
    for (const sb of plat.signboards) {
      const sbU = sb.id?.endsWith('west') ? -15.5 : 15.5;
      const sx = pf.cx + pf.ux * sbU - pf.nx * 0.35, sz = pf.cz + pf.uz * sbU - pf.nz * 0.35;
      for (const postOffset of [-1.35, 1.35]) {
        const px = sx + pf.ux * postOffset;
        const pz = sz + pf.uz * postOffset;
        box(P.signWhite, 0.12, 1.95, 0.12, px, platH + 0.975, pz, pf.yaw);
        box(P.roofTile, 0.16, 0.08, 0.16, px, platH + 1.98, pz, pf.yaw);
      }
      // White signboard with dark border & station name band
      box(P.signWhite, 3.10, 0.62, 0.09, sx, platH + 1.52, sz, pf.yaw);
      box(P.steelDark, 2.92, 0.46, 0.11, sx, platH + 1.52, sz, pf.yaw);
      box(P.signWhite, 2.80, 0.34, 0.12, sx, platH + 1.52, sz, pf.yaw);
      if (ctx.boardTexture && ctx.plane && typeof document !== 'undefined') {
        const tex = ctx.boardTexture([sb.text, sb.subtitle], {
          bg: '#f4f1e8',
          fg: '#1e2226',
          border: '#23272a',
          w: 1024,
          h: 220,
        });
        const faceYaw = pf.yaw;
        ctx.plane(tex, 2.85, 0.54, sx - pf.nx * 0.08, platH + 1.52, sz - pf.nz * 0.08, faceYaw);
        ctx.plane(tex, 2.85, 0.54, sx + pf.nx * 0.08, platH + 1.52, sz + pf.nz * 0.08, faceYaw + Math.PI);
      }
    }

    // Heritage platform timber benches and lamp standards
    for (const offsetU of [-19.5, -8.5, 8.5, 19.5]) {
      const bx = pf.cx + pf.ux * offsetU - pf.nx * 0.55;
      const bz = pf.cz + pf.uz * offsetU - pf.nz * 0.55;
      box(P.steelDark, 1.85, 0.42, 0.48, bx, platH + 0.21, bz, pf.yaw);
      box(P.timber, 1.95, 0.07, 0.52, bx, platH + 0.45, bz, pf.yaw);
      box(P.timber, 1.95, 0.42, 0.07, bx - pf.nx * 0.22, platH + 0.68, bz - pf.nz * 0.22, pf.yaw);
    }
    for (const lampU of [-34, -21, -7, 7, 21, 34]) {
      const lx = pf.cx + pf.ux * lampU - pf.nx * 0.25;
      const lz = pf.cz + pf.uz * lampU - pf.nz * 0.25;
      box(P.steelDark, 0.11, 3.6, 0.11, lx, platH + 1.8, lz, pf.yaw);
      box(P.steelDark, 0.08, 0.08, 0.65, lx + pf.nx * 0.28, platH + 3.55, lz + pf.nz * 0.28, pf.yaw);
      box(P.signWhite, 0.26, 0.18, 0.26, lx + pf.nx * 0.52, platH + 3.44, lz + pf.nz * 0.52, pf.yaw);
    }
  }

  // ── 3. Main Brick Station Building (`osm:29` / `NR-OSM-0030`) ─────────────
  const station = NARROMINE_RAILWAY_BUILDINGS[0];
  const spineFrame = quadFrame(station.partsWorld[0].pts);
  const pavFrame = quadFrame(station.partsWorld[1].pts);
  {
    // Build both surveyed parts (32.16 m main spine + 15.49 m projecting platform pavilion)
    for (const part of station.partsWorld) {
      const f = quadFrame(part.pts);
      const wallH = part.eaveH;
      // Brick plinth, face-brick wall mass, cream stringcourse/lintel band, and eaves fascia
      box(P.plinth, f.L + 0.06, 0.62, f.W + 0.06, f.cx, 0.31, f.cz, f.yaw);
      box(P.brick, f.L, wallH, f.W, f.cx, wallH / 2, f.cz, f.yaw);
      box(P.trim, f.L + 0.08, 0.16, f.W + 0.08, f.cx, 2.68, f.cz, f.yaw);
      box(P.trim, f.L + 0.36, 0.22, f.W + 0.36, f.cx, wallH - 0.08, f.cz, f.yaw);

      // Hipped terracotta tile roof (measured 2023 LiDAR eave 3.45 m, ridge 5.45 m / 5.85 m)
      push(P.roofTile, makeHippedRoofGeometry(part.pts, wallH, part.ridgeH));
      // Ridge capping beam
      const inset = Math.min(f.L * 0.42, f.W * 0.5);
      const ridgeLen = Math.max(0.4, f.L - inset * 2);
      box(P.plinth, ridgeLen, 0.14, 0.18, f.cx, part.ridgeH + 0.03, f.cz, f.yaw);

      // Tight sliced AABB colliders along the oriented quad
      for (const col of sliceQuadColliders(part.pts, 6, 1.6)) {
        colliders.push(col);
      }
    }

    // Brick chimneys with terracotta chimney pots on the main spine
    for (const chimU of [-8.8, 8.8]) {
      const cx = spineFrame.cx + spineFrame.ux * chimU;
      const cz = spineFrame.cz + spineFrame.uz * chimU;
      box(P.brick, 0.85, 2.55, 0.85, cx, 4.95, cz, spineFrame.yaw);
      box(P.trim, 0.96, 0.14, 0.96, cx, 6.18, cz, spineFrame.yaw);
      box(P.roofTile, 0.24, 0.35, 0.24, cx - spineFrame.ux * 0.18, 6.40, cz - spineFrame.uz * 0.18, spineFrame.yaw);
      box(P.roofTile, 0.24, 0.35, 0.24, cx + spineFrame.ux * 0.18, 6.40, cz + spineFrame.uz * 0.18, spineFrame.yaw);
    }

    // Engaged brick pilasters & fenestration along the 32.16 m forecourt elevation (edge 0->1, -n face)
    const forecourtFaceOffset = -spineFrame.W / 2 - 0.04;
    for (let u = -15.2; u <= 15.21; u += 3.8) {
      const px = spineFrame.cx + spineFrame.ux * u + spineFrame.nx * forecourtFaceOffset;
      const pz = spineFrame.cz + spineFrame.uz * u + spineFrame.nz * forecourtFaceOffset;
      box(P.pier, 0.28, 3.35, 0.12, px, 1.68, pz, spineFrame.yaw);
    }

    // Forecourt windows and central double entrance doors (estimated bay rhythm)
    for (const bayU of [-13.3, -9.5, -5.7, -1.9, 1.9, 5.7, 9.5, 13.3]) {
      const wx = spineFrame.cx + spineFrame.ux * bayU + spineFrame.nx * (forecourtFaceOffset - 0.03);
      const wz = spineFrame.cz + spineFrame.uz * bayU + spineFrame.nz * (forecourtFaceOffset - 0.03);
      if (Math.abs(bayU) < 2.2) {
        // Double timber station entry doors facing forecourt (visual only, no interior portal)
        box(P.trim, 1.56, 2.48, 0.10, wx, 1.28, wz, spineFrame.yaw);
        box(P.timber, 1.36, 2.34, 0.12, wx, 1.22, wz, spineFrame.yaw);
        box(P.windowGlass, 1.16, 0.42, 0.14, wx, 2.12, wz, spineFrame.yaw);
      } else {
        // Multi-pane double-hung sash window with cream frame and brick sill
        box(P.trim, 1.24, 1.58, 0.09, wx, 1.78, wz, spineFrame.yaw);
        box(P.windowGlass, 1.06, 1.40, 0.11, wx, 1.78, wz, spineFrame.yaw);
        box(P.trim, 1.08, 0.06, 0.13, wx, 1.78, wz, spineFrame.yaw);
        box(P.trim, 1.36, 0.12, 0.16, wx, 0.95, wz, spineFrame.yaw);
      }
    }

    // Forecourt entrance porch canopy over the central doors
    {
      const canopyDepth = 1.75;
      const canopyW = 6.2;
      const cx = spineFrame.cx + spineFrame.nx * (-spineFrame.W / 2 - canopyDepth / 2);
      const cz = spineFrame.cz + spineFrame.nz * (-spineFrame.W / 2 - canopyDepth / 2);
      box(P.awningRoof, canopyW, 0.12, canopyDepth, cx, 3.08, cz, spineFrame.yaw);
      box(P.trim, canopyW + 0.12, 0.24, canopyDepth + 0.12, cx, 3.12, cz, spineFrame.yaw);
      for (const s of [-1, 1]) {
        const postX = cx + spineFrame.ux * (s * (canopyW / 2 - 0.22)) - spineFrame.nx * (canopyDepth / 2 - 0.15);
        const postZ = cz + spineFrame.uz * (s * (canopyW / 2 - 0.22)) - spineFrame.nz * (canopyDepth / 2 - 0.15);
        box(P.steelDark, 0.11, 3.05, 0.11, postX, 1.525, postZ, spineFrame.yaw);
      }
    }

    // Central platform pavilion elevation (edge 4->5, +n face onto Platform 1)
    const pavFaceOffset = pavFrame.W / 2 + 0.04;
    for (const bayU of [-6.0, -3.0, 0.0, 3.0, 6.0]) {
      const wx = pavFrame.cx + pavFrame.ux * bayU + pavFrame.nx * pavFaceOffset;
      const wz = pavFrame.cz + pavFrame.uz * bayU + pavFrame.nz * pavFaceOffset;
      if (Math.abs(bayU) < 0.5) {
        // Central station master / booking hall doorway and ticket window onto Platform 1
        box(P.trim, 1.48, 2.35, 0.10, wx, platH + 1.18, wz, pavFrame.yaw);
        box(P.timber, 1.28, 2.22, 0.12, wx, platH + 1.12, wz, pavFrame.yaw);
        box(P.windowGlass, 1.06, 0.38, 0.14, wx, platH + 1.98, wz, pavFrame.yaw);
      } else {
        box(P.trim, 1.18, 1.52, 0.09, wx, platH + 1.52, wz, pavFrame.yaw);
        box(P.windowGlass, 1.00, 1.34, 0.11, wx, platH + 1.52, wz, pavFrame.yaw);
        box(P.trim, 1.02, 0.06, 0.13, wx, platH + 1.52, wz, pavFrame.yaw);
        box(P.trim, 1.30, 0.11, 0.15, wx, platH + 0.72, wz, pavFrame.yaw);
      }
    }

    // Cantilevered Platform Verandah / Awning along the south-east platform face (photo-matched)
    const awn = plat.awningWorld;
    const af = quadFrame(awn.pts);
    box(P.trim, af.L, 0.09, af.W, af.cx, awn.eaveHeightM - 0.04, af.cz, af.yaw);
    box(P.awningRoof, af.L + 0.16, 0.10, af.W + 0.16, af.cx, awn.eaveHeightM + 0.04, af.cz, af.yaw);
    box(P.trim, af.L + 0.22, 0.24, 0.10, af.cx + af.nx * (af.W / 2), awn.eaveHeightM + 0.02, af.cz + af.nz * (af.W / 2), af.yaw);
    // Steel cantilever brackets / knee braces under the platform awning
    for (let u = -af.L / 2 + 2.0; u <= af.L / 2 - 1.5; u += 3.5) {
      const bx = af.cx + af.ux * u;
      const bz = af.cz + af.uz * u;
      box(P.steelDark, 0.09, 0.12, af.W - 0.2, bx, awn.eaveHeightM - 0.12, bz, af.yaw);
    }
  }

  // ── 4. Eastern Goods / Yard Office (`osm:28`) & Crossing Relay Hut (`osm:198`) ──
  for (const bld of NARROMINE_RAILWAY_BUILDINGS.slice(1)) {
    const f = quadFrame(bld.footprintWorld);
    const eaveH = bld.lidar.eaveProxyM;
    const ridgeH = bld.lidar.ridgeProxyM;
    const isGoods = bld.id === 'narromine-railway-goods-office';
    const wallColour = isGoods ? P.corrugatedWall : P.weatherboard;

    box(P.plinth, f.L + 0.08, 0.35, f.W + 0.08, f.cx, 0.175, f.cz, f.yaw);
    box(wallColour, f.L, eaveH, f.W, f.cx, eaveH / 2, f.cz, f.yaw);
    box(P.steelDark, f.L + 0.24, 0.16, f.W + 0.24, f.cx, eaveH - 0.06, f.cz, f.yaw);

    const { slopeGeo, gableGeo } = makeGableRoofGeometry(bld.footprintWorld, eaveH, ridgeH);
    push(P.awningRoof, slopeGeo);
    push(wallColour, gableGeo);

    // Goods shed sliding freight doors and loading stage (osm:28) or relay hut door (osm:198)
    if (isGoods) {
      for (const side of [-1, 1]) {
        for (const bayU of [-4.2, 4.2]) {
          const dx = f.cx + f.ux * bayU + f.nx * side * (f.W / 2 + 0.04);
          const dz = f.cz + f.uz * bayU + f.nz * side * (f.W / 2 + 0.04);
          box(P.steelDark, 2.85, 2.55, 0.10, dx, 1.32, dz, f.yaw);
          box(P.railSteel, 2.65, 2.42, 0.12, dx, 1.26, dz, f.yaw);
        }
      }
      // Timber/concrete goods loading stage on the south-east siding side
      const stageX = f.cx + f.nx * (f.W / 2 + 0.95);
      const stageZ = f.cz + f.nz * (f.W / 2 + 0.95);
      box(P.timber, f.L - 1.2, 0.85, 1.8, stageX, 0.425, stageZ, f.yaw);
    } else {
      const dx = f.cx + f.nx * (f.W / 2 + 0.04);
      const dz = f.cz + f.nz * (f.W / 2 + 0.04);
      box(P.trim, 1.15, 2.15, 0.09, dx, 1.10, dz, f.yaw);
      box(P.timber, 0.98, 2.02, 0.11, dx, 1.05, dz, f.yaw);
      // Trackside signalling relay cabinet beside the level crossing hut
      box(P.corrugatedWall, 1.4, 1.55, 0.65, f.cx - f.ux * (f.L / 2 + 1.2), 0.78, f.cz - f.uz * (f.L / 2 + 1.2), f.yaw);
    }

    for (const c of sliceQuadColliders(bld.footprintWorld, 4, 2.0)) {
      colliders.push(c);
    }
  }

  // ── 5. White Railway Boundary Fencing (leaving wide pedestrian gates) ─────
  for (const fence of forecourt.fencesWorld) {
    const [ax, az] = fence.a;
    const [bx, bz] = fence.b;
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz);
    const yaw = -Math.atan2(dz, dx);
    const mx = (ax + bx) / 2;
    const mz = (az + bz) / 2;
    // Top and middle white rails
    box(P.trim, len, 0.07, 0.07, mx, 1.08, mz, yaw);
    box(P.trim, len, 0.07, 0.07, mx, 0.58, mz, yaw);
    const posts = Math.max(2, Math.round(len / 2.6));
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      box(P.trim, 0.11, 1.22, 0.11, ax + dx * t, 0.61, az + dz * t, yaw);
    }
  }

  // ── 6. Precinct Track Sleepers & Standard-Gauge Steel Rails ───────────────
  for (const track of NARROMINE_RAILWAY_TRACKS) {
    const pts = track.ptsWorld;
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1];
      const [bx, bz] = pts[i];
      const dx = bx - ax;
      const dz = bz - az;
      const len = Math.hypot(dx, dz);
      if (len < 0.5) continue;
      const ux = dx / len;
      const uz = dz / len;
      const nx = -uz;
      const nz = ux;
      const yaw = -Math.atan2(dz, dx);

      // Crushed basalt ballast shoulder (only in standalone mode; narromine.js draws base RAIL ballast)
      if (!ctx.push) {
        strip(P.ballast, ax, az, bx, bz, 3.3, 0.06, 0.12);
      }
      // Twin standard-gauge (1.435 m) steel running rails above the rail bed
      for (const railSide of [-0.7175, 0.7175]) {
        strip(
          P.railSteel,
          ax + nx * railSide,
          az + nz * railSide,
          bx + nx * railSide,
          bz + nz * railSide,
          0.11,
          0.355,
          0.07
        );
      }
      // Timber sleepers spaced every 2.2 m along precinct tracks
      for (let d = 1.0; d < len; d += 2.2) {
        box(P.timber, 0.24, 0.05, 2.45, ax + ux * d, 0.305, az + uz * d, yaw);
      }
    }
  }

  // ── 7. Information / Heritage Spots & Optional Labels ─────────────────────
  const platformSpotPos = [-4703.2, -723.5];
  const stationFact =
    'Opened 1 May 1883 on the Main Western Line (497.554 km from Sydney); closed to regular passenger trains on 20 October 1975 and restored as an NSW TrainLink coach stop. Listed as Item I11 on the Narromine LEP 2011 Heritage Schedule (Lot 4 DP 1012153).';
  const coachFact =
    'Active regional road coach stop connecting Narromine with Dubbo, Parkes, Broken Hill and Lightning Ridge services.';
  spots.push(
    {
      key: 'narromine:railway-station:platform',
      label: 'Narromine Railway Station · Platform 1',
      name: 'Narromine Railway Station',
      kind: 'railway_station',
      kindLabel: 'Heritage railway station & NSW TrainLink coach stop',
      address: 'Derribong Avenue (Narromine Station Access)',
      x: platformSpotPos[0],
      z: platformSpotPos[1],
      pos: new THREE.Vector3(platformSpotPos[0], 0, platformSpotPos[1]),
      fact: stationFact,
      text: `Narromine Railway Station · Platform 1 (Main Western Line, 497.554 km) — ${stationFact}`,
    },
    {
      key: 'narromine:railway-station:coach-stop',
      label: 'Narromine Station Coach Stop',
      name: 'Narromine Station Coach Stop',
      kind: 'bus_stop',
      kindLabel: 'NSW TrainLink regional coach stop',
      address: 'Narromine Station Access',
      x: forecourt.coachStop.atWorld[0],
      z: forecourt.coachStop.atWorld[1],
      pos: new THREE.Vector3(forecourt.coachStop.atWorld[0], 0, forecourt.coachStop.atWorld[1]),
      fact: coachFact,
      text: `NSW TrainLink regional coach stop · Narromine Station Access — ${coachFact}`,
    }
  );

  if (typeof ctx.makeLabel === 'function') {
    const lbl = ctx.makeLabel('Narromine Railway Station');
    if (lbl) {
      lbl.position.set(station.centreWorld[0], station.lidar.ridgeProxyM + 2.8, station.centreWorld[1]);
      group.add(lbl);
    }
  }

  // If running standalone (no external `ctx.push` provided), merge each colour bucket
  // into a single Mesh per material colour and attach to `group`.
  let meshCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;
  if (!ctx.push) {
    for (const [colour, geos] of localBuckets) {
      const merged = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      if (!merged) continue;
      const posAttr = merged.getAttribute('position');
      if (posAttr) {
        vertexCount += posAttr.count;
        triangleCount += Math.floor(posAttr.count / 3);
      }
      const mesh = new THREE.Mesh(
        merged,
        new THREE.MeshLambertMaterial({ color: colour, side: THREE.DoubleSide })
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      meshCount++;
    }
  }

  return {
    group,
    colliders,
    spots,
    stats: {
      meshCount,
      colourBuckets: localBuckets.size,
      vertexCount,
      triangleCount,
      colliderCount: colliders.length,
    },
    evidence: {
      heritage: NARROMINE_RAILWAY_HERITAGE,
      buildings: NARROMINE_RAILWAY_BUILDINGS,
      platform: NARROMINE_RAILWAY_PLATFORM,
      forecourt: NARROMINE_RAILWAY_FORECOURT,
      tracks: NARROMINE_RAILWAY_TRACKS,
      geoJson: NARROMINE_RAILWAY_PRECINCT_GEOJSON,
      integrationSpec: NARROMINE_RAILWAY_INTEGRATION_SPEC,
    },
  };
}
