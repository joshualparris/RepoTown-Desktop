// Three.js reconstruction of the disambiguated Narromine Courthouse, Police &
// Civic Precinct on Section 17, DP 758759 (bounded by Burraway Street and
// Merilba Street, Narromine NSW 2821).
//
// Works both:
//   1) Standalone: `buildNarromineCourthousePrecinct()` returns
//      `{ group, colliders, spots, stats, disambiguation, cadastralLots, buildings, integrationSpec }`
//      with geometries merged by material colour for draw-call efficiency.
//   2) Integrated: `buildNarromineCourthousePrecinct({ box, push, strip, flatPoly, plane, boardTexture, colliders, spots })`
//      feeds directly into `src/world/narromine.js`'s spatial tile batcher.
import * as THREE from 'three';
import {
  NARROMINE_COURTHOUSE_DISAMBIGUATION,
  NARROMINE_COURTHOUSE_CADASTRAL_LOTS,
  NARROMINE_COURTHOUSE_BUILDINGS,
  NARROMINE_COURTHOUSE_ACCESS,
  NARROMINE_COURTHOUSE_INTEGRATION_SPEC,
} from './narromine-courthouse-evidence.js';

function mergeGeometries(geos) {
  let n = 0;
  for (const g of geos) n += g.index ? g.index.count : g.attributes.position.count;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
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

export function sliceQuadColliders(pts, minSlices = 3, stepM = 3.0) {
  const [a, b, c, d] = pts;
  const len = Math.hypot(d[0] - a[0], d[1] - a[1]);
  const slices = Math.max(minSlices, Math.ceil(len / stepM));
  const out = [];
  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    const corners = [
      [a[0] + (d[0] - a[0]) * t0, a[1] + (d[1] - a[1]) * t0],
      [b[0] + (c[0] - b[0]) * t0, b[1] + (c[1] - b[1]) * t0],
      [b[0] + (c[0] - b[0]) * t1, b[1] + (c[1] - b[1]) * t1],
      [a[0] + (d[0] - a[0]) * t1, a[1] + (d[1] - a[1]) * t1],
    ];
    let x0 = Infinity;
    let x1 = -Infinity;
    let z0 = Infinity;
    let z1 = -Infinity;
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

function addQuadWall(push, colour, [x0, z0], [x1, z1], y0, y1) {
  if (Math.hypot(x1 - x0, z1 - z0) < 1e-3 || y1 <= y0) return;
  const verts = new Float32Array([
    x0, y0, z0,
    x1, y0, z1,
    x1, y1, z1,
    x0, y0, z0,
    x1, y1, z1,
    x0, y1, z0,
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  g.computeVertexNormals();
  push(colour, g);
}

function addExtrudedFootprintWalls(push, colour, pts, y0, y1) {
  for (let i = 0; i < pts.length; i++) {
    addQuadWall(push, colour, pts[i], pts[(i + 1) % pts.length], y0, y1);
  }
}

function addTriFace(push, colour, p0, p1, p2) {
  const ax = p1[0] - p0[0];
  const ay = p1[1] - p0[1];
  const az = p1[2] - p0[2];
  const bx = p2[0] - p0[0];
  const by = p2[1] - p0[1];
  const bz = p2[2] - p0[2];
  const ny = az * bx - ax * bz;
  const verts =
    ny >= 0
      ? new Float32Array([...p0, ...p1, ...p2])
      : new Float32Array([...p0, ...p2, ...p1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  g.computeVertexNormals();
  push(colour, g);
}

function addQuadFace(push, colour, p0, p1, p2, p3) {
  addTriFace(push, colour, p0, p1, p2);
  addTriFace(push, colour, p0, p2, p3);
}

function addHippedRoof4(push, box, roofColour, ridgeColour, pts, eaveY, ridgeY, longAxis = '1-2', overhang = 0.35) {
  const cx = (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) * 0.25;
  const cz = (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) * 0.25;
  const expanded = pts.map(([x, z]) => {
    const dx = x - cx;
    const dz = z - cz;
    const d = Math.hypot(dx, dz) || 1;
    return [x + (dx / d) * overhang, z + (dz / d) * overhang];
  });
  const [c0, c1, c2, c3] = expanded.map(([x, z]) => [x, eaveY, z]);

  let r0;
  let r1;
  if (longAxis === '1-2') {
    const m01 = [(c0[0] + c1[0]) * 0.5, (c0[2] + c1[2]) * 0.5];
    const m23 = [(c2[0] + c3[0]) * 0.5, (c2[2] + c3[2]) * 0.5];
    r0 = [m01[0] * 0.62 + cx * 0.38, ridgeY, m01[1] * 0.62 + cz * 0.38];
    r1 = [m23[0] * 0.62 + cx * 0.38, ridgeY, m23[1] * 0.62 + cz * 0.38];
    addTriFace(push, roofColour, c0, c1, r0);
    addQuadFace(push, roofColour, c1, c2, r1, r0);
    addTriFace(push, roofColour, c2, c3, r1);
    addQuadFace(push, roofColour, c3, c0, r0, r1);
  } else {
    const m12 = [(c1[0] + c2[0]) * 0.5, (c1[2] + c2[2]) * 0.5];
    const m30 = [(c3[0] + c0[0]) * 0.5, (c3[2] + c0[2]) * 0.5];
    r0 = [m30[0] * 0.62 + cx * 0.38, ridgeY, m30[1] * 0.62 + cz * 0.38];
    r1 = [m12[0] * 0.62 + cx * 0.38, ridgeY, m12[1] * 0.62 + cz * 0.38];
    addTriFace(push, roofColour, c3, c0, r0);
    addQuadFace(push, roofColour, c0, c1, r1, r0);
    addTriFace(push, roofColour, c1, c2, r1);
    addQuadFace(push, roofColour, c2, c3, r0, r1);
  }

  // Metal ridge flashing cap along r0 -> r1
  const rdx = r1[0] - r0[0];
  const rdz = r1[2] - r0[2];
  const rLen = Math.hypot(rdx, rdz);
  if (rLen > 0.4) {
    box(
      ridgeColour,
      rLen + 0.16,
      0.10,
      0.18,
      (r0[0] + r1[0]) * 0.5,
      ridgeY + 0.03,
      (r0[2] + r1[2]) * 0.5,
      -Math.atan2(rdz, rdx)
    );
  }
}

function addGabledRoof4(push, box, roofColour, gableColour, ridgeColour, pts, eaveY, ridgeY) {
  const c0 = [pts[0][0], eaveY, pts[0][1]];
  const c1 = [pts[1][0], eaveY, pts[1][1]];
  const c2 = [pts[2][0], eaveY, pts[2][1]];
  const c3 = [pts[3][0], eaveY, pts[3][1]];
  const r0 = [(pts[3][0] + pts[0][0]) * 0.5, ridgeY, (pts[3][1] + pts[0][1]) * 0.5];
  const r1 = [(pts[1][0] + pts[2][0]) * 0.5, ridgeY, (pts[1][1] + pts[2][1]) * 0.5];
  addQuadFace(push, roofColour, c0, c1, r1, r0);
  addQuadFace(push, roofColour, c2, c3, r0, r1);
  addTriFace(push, gableColour, c1, c2, r1);
  addTriFace(push, gableColour, c3, c0, r0);
  const rdx = r1[0] - r0[0];
  const rdz = r1[2] - r0[2];
  const rLen = Math.hypot(rdx, rdz);
  if (rLen > 0.4) {
    box(
      ridgeColour,
      rLen + 0.2,
      0.10,
      0.18,
      (r0[0] + r1[0]) * 0.5,
      ridgeY + 0.03,
      (r0[2] + r1[2]) * 0.5,
      -Math.atan2(rdz, rdx)
    );
  }
}

/**
 * Places framed windows (with sill and optional horizontal sash bar) along edge a -> b,
 * offset slightly outward along the exterior normal of a counter-clockwise / clockwise polygon.
 */
function addEdgeWindows(box, frameColour, glassColour, sillColour, a, b, polyCenter, count, yMid, winW, winH, hasSash = true) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz) || 1;
  const yaw = -Math.atan2(dz, dx);
  const mx = (a[0] + b[0]) * 0.5;
  const mz = (a[1] + b[1]) * 0.5;
  // Outward unit normal pointing away from polygon centre
  let nx = -(b[1] - a[1]) / len;
  let nz = (b[0] - a[0]) / len;
  if ((mx - polyCenter[0]) * nx + (mz - polyCenter[1]) * nz < 0) {
    nx = -nx;
    nz = -nz;
  }
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const wx = a[0] + dx * t + nx * 0.06;
    const wz = a[1] + dz * t + nz * 0.06;
    box(frameColour, winW + 0.16, winH + 0.16, 0.10, wx, yMid, wz, yaw);
    box(glassColour, winW, winH, 0.08, wx + nx * 0.03, yMid, wz + nz * 0.03, yaw);
    box(sillColour, winW + 0.24, 0.09, 0.16, wx + nx * 0.04, yMid - winH * 0.5 - 0.05, wz + nz * 0.04, yaw);
    if (hasSash) {
      box(frameColour, winW + 0.04, 0.06, 0.10, wx + nx * 0.04, yMid, wz + nz * 0.04, yaw);
    }
  }
}

export function buildNarromineCourthousePrecinct(ctx = {}) {
  const group = ctx.parent || new THREE.Group();
  if (!ctx.parent) group.name = 'NarromineCourthousePrecinct';

  const colliders = ctx.colliders || [];
  const spots = ctx.spots || [];
  const localBuckets = new Map();

  const push =
    ctx.push ||
    ((colour, geo) => {
      const g = geo.index ? geo.toNonIndexed() : geo;
      g.deleteAttribute('uv');
      if (!localBuckets.has(colour)) localBuckets.set(colour, []);
      localBuckets.get(colour).push(g);
    });

  const box =
    ctx.box ||
    ((colour, w, h, d, x, y, z, ry = 0) => {
      const g = new THREE.BoxGeometry(w, h, d);
      if (ry) g.rotateY(ry);
      g.translate(x, y, z);
      push(colour, g);
    });

  const flatPoly =
    ctx.flatPoly ||
    ((colour, pts, y = 0.03) => {
      if (pts.length < 3) return;
      const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
      const g = new THREE.ShapeGeometry(shape);
      g.rotateX(-Math.PI / 2);
      g.translate(0, y, 0);
      push(colour, g);
    });

  // Precinct colour palette (<= 16 colours for single-pass material batching)
  const P = Object.freeze({
    heritageWeatherboard: 0xede5d4, // 1898 Former Courthouse painted weatherboards
    heritageTrim: 0x5c2f24,         // Deep heritage russet-brown timber trim, doors & valence
    heritagePost: 0xf4f0e6,         // Crisp off-white verandah posts, window sashes & bargeboards
    brickPlinth: 0x7c3f32,          // Heritage red-brown foundation brickwork & chimneys
    galvRoof: 0x9aa2a8,             // Weathered corrugated galvanised iron roof
    ridgeDark: 0x60676c,            // Metal ridge flashing & gutters
    lockupWall: 0xdfd7c6,           // 1898 rear lock-up outbuilding masonry/weatherboard
    policeBrick: 0x8e4c3b,          // Police Station face-brick dado
    policeUpperWall: 0xe8e0cf,      // Police Station rendered/weatherboard upper wall
    policeRoof: 0x6c757d,           // Police Station corrugated steel roof
    policeBlue: 0x163e73,           // NSW Police blue signage & Sillitoe band
    courtBuffBrick: 0xc8a982,       // 47 Merilba St Local Court buff/tan institutional brickwork
    courtDarkBrick: 0x634b3b,       // 47 Merilba St plinth & colonnade pier base brick
    courtFascia: 0xe6dfd3,          // 47 Merilba St deep off-white institutional fascia & clerestory
    hubWall: 0xe8e4dc,              // 37 Burraway St Hub n Spoke warm rendered circular drum
    hubAccent: 0x2f5d62,            // 37 Burraway St Hub n Spoke deep teal-slate fascia & mullions
    hubRoof: 0xb0b7bd,              // 37 Burraway St Hub n Spoke radial Colorbond roof
    glass: 0x29445a,                // Architectural window & atrium glazing
    concretePath: 0xc7c2b8,         // Forecourt paving, steps & verandah decks
    atriumTurf: 0x4c6b42,           // Hub n Spoke central open atrium garden
  });

  const [formerCourt, policeStation, localCourt, hubNSpoke] = NARROMINE_COURTHOUSE_BUILDINGS;

  // ── 1. [address redacted]: Former Narromine Courthouse (1898, LEP Item I5) ──
  {
    const fp = formerCourt.footprintWorld;
    const vp = formerCourt.verandahWorld;
    const lp = formerCourt.lockupWorld;
    const { eaveHeightM, ridgeHeightM, lockupEaveM, lockupRidgeM } = formerCourt.dimensionsM;
    const center = formerCourt.centreWorld;

    // Brick foundation plinth (0 -> 0.45 m), weatherboard walls (0.45 -> 3.22 m), and eave frieze (3.22 -> 3.35 m)
    addExtrudedFootprintWalls(push, P.brickPlinth, fp, 0.0, 0.45);
    addExtrudedFootprintWalls(push, P.heritageWeatherboard, fp, 0.45, eaveHeightM - 0.13);
    addExtrudedFootprintWalls(push, P.heritageTrim, fp, eaveHeightM - 0.13, eaveHeightM);
    addHippedRoof4(push, box, P.galvRoof, P.ridgeDark, fp, eaveHeightM, ridgeHeightM, '1-2', 0.38);

    // Corner timber quoin pilasters on all 4 corners of the 1898 Courthouse
    const wallYaw = -Math.atan2(fp[1][1] - fp[0][1], fp[1][0] - fp[0][0]);
    for (const [cx, cz] of fp) {
      box(P.heritageTrim, 0.22, eaveHeightM, 0.22, cx, eaveHeightM * 0.5, cz, wallYaw);
    }

    // Corbelled red-brick heritage chimney on NW side wall
    const chX = (fp[3][0] + fp[0][0]) * 0.5 + 0.35;
    const chZ = (fp[3][1] + fp[0][1]) * 0.5 - 0.25;
    box(P.brickPlinth, 0.72, 6.0, 0.72, chX, 3.0, chZ, wallYaw);
    box(P.heritageTrim, 0.86, 0.18, 0.86, chX, 6.05, chZ, wallYaw);

    // Front Burraway Street skillion verandah (vp[0..1] front edge at y=2.55m -> vp[2..3] wall at y=3.08m)
    flatPoly(P.concretePath, vp, 0.15);
    addExtrudedFootprintWalls(push, P.brickPlinth, vp, 0.0, 0.15);
    addQuadFace(
      push,
      P.galvRoof,
      [vp[0][0], 2.55, vp[0][1]],
      [vp[1][0], 2.55, vp[1][1]],
      [vp[2][0], 3.08, vp[2][1]],
      [vp[3][0], 3.08, vp[3][1]]
    );

    // 4 turned white timber verandah posts + russet valence beam along front edge (vp[0] -> vp[1])
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      const px = vp[0][0] + (vp[1][0] - vp[0][0]) * t;
      const pz = vp[0][1] + (vp[1][1] - vp[0][1]) * t;
      box(P.heritagePost, 0.15, 2.45, 0.15, px, 1.35, pz, wallYaw);
      box(P.heritageTrim, 0.22, 0.18, 0.22, px, 2.42, pz, wallYaw);
    }
    const vMidX = (vp[0][0] + vp[1][0]) * 0.5;
    const vMidZ = (vp[0][1] + vp[1][1]) * 0.5;
    const vLen = Math.hypot(vp[1][0] - vp[0][0], vp[1][1] - vp[0][1]);
    box(P.heritageTrim, vLen + 0.15, 0.24, 0.14, vMidX, 2.46, vMidZ, wallYaw);

    // Front panelled timber courthouse door + glazed fanlight + double-hung sash windows
    const frontMidX = (fp[0][0] + fp[1][0]) * 0.5;
    const frontMidZ = (fp[0][1] + fp[1][1]) * 0.5;
    box(P.heritagePost, 1.32, 2.45, 0.14, frontMidX, 1.38, frontMidZ, wallYaw);
    box(P.heritageTrim, 1.12, 2.10, 0.16, frontMidX, 1.22, frontMidZ, wallYaw);
    box(P.glass, 1.06, 0.32, 0.18, frontMidX, 2.42, frontMidZ, wallYaw);

    addEdgeWindows(box, P.heritagePost, P.glass, P.heritageTrim, fp[0], fp[1], center, 2, 1.85, 0.92, 1.38, true);
    addEdgeWindows(box, P.heritagePost, P.glass, P.heritageTrim, fp[1], fp[2], center, 4, 1.85, 1.02, 1.42, true);
    addEdgeWindows(box, P.heritagePost, P.glass, P.heritageTrim, fp[3], fp[0], center, 4, 1.85, 1.02, 1.42, true);

    // Signboard on Burraway Street verandah fascia
    const vOutDx = vMidX - frontMidX;
    const vOutDz = vMidZ - frontMidZ;
    const vOutLen = Math.hypot(vOutDx, vOutDz) || 1;
    const vFaceYaw = Math.atan2(vOutDx / vOutLen, vOutDz / vOutLen);
    if (ctx.boardTexture && ctx.plane && typeof document !== 'undefined') {
      const tex = ctx.boardTexture(
        ['FORMER COURT HOUSE (1898)', '35 BURRAWAY ST · LEP ITEM I5'],
        { bg: '#5c2f24', fg: '#f6efe2', border: '#e6dcc8', w: 1024, h: 200 }
      );
      ctx.plane(
        tex,
        3.6,
        0.52,
        vMidX + (vOutDx / vOutLen) * 0.12,
        2.72,
        vMidZ + (vOutDz / vOutLen) * 0.12,
        vFaceYaw
      );
    }

    // Historic 1898 Rear Lock-up Outbuilding on Lot 6
    const lockCenter = [
      (lp[0][0] + lp[1][0] + lp[2][0] + lp[3][0]) * 0.25,
      (lp[0][1] + lp[1][1] + lp[2][1] + lp[3][1]) * 0.25,
    ];
    addExtrudedFootprintWalls(push, P.brickPlinth, lp, 0.0, 0.38);
    addExtrudedFootprintWalls(push, P.lockupWall, lp, 0.38, lockupEaveM);
    addHippedRoof4(push, box, P.galvRoof, P.ridgeDark, lp, lockupEaveM, lockupRidgeM, '0-1', 0.28);
    addEdgeWindows(box, P.heritageTrim, P.glass, P.brickPlinth, lp[0], lp[1], lockCenter, 2, 2.08, 0.62, 0.52, false);

    colliders.push(...sliceQuadColliders(fp, 4, 3.2));
    colliders.push(...sliceQuadColliders(lp, 2, 3.2));
  }

  // ── 2. [address redacted]: Narromine Police Station & Residence (osm:174) ────
  {
    const [mainWing, northWing] = policeStation.partsWorld;
    const mainCenter = [
      (mainWing.pts[0][0] + mainWing.pts[1][0] + mainWing.pts[2][0] + mainWing.pts[3][0]) * 0.25,
      (mainWing.pts[0][1] + mainWing.pts[1][1] + mainWing.pts[2][1] + mainWing.pts[3][1]) * 0.25,
    ];
    const northCenter = [
      (northWing.pts[0][0] + northWing.pts[1][0] + northWing.pts[2][0] + northWing.pts[3][0]) * 0.25,
      (northWing.pts[0][1] + northWing.pts[1][1] + northWing.pts[2][1] + northWing.pts[3][1]) * 0.25,
    ];

    // Main SW residence/station wing (hipped roof, surveyed 2011 LiDAR eave 3.16 m, ridge 5.95 m)
    addExtrudedFootprintWalls(push, P.policeBrick, mainWing.pts, 0.0, 1.35);
    addExtrudedFootprintWalls(push, P.policeUpperWall, mainWing.pts, 1.35, mainWing.eaveH);
    addHippedRoof4(push, box, P.policeRoof, P.ridgeDark, mainWing.pts, mainWing.eaveH, mainWing.ridgeH, '1-2', 0.38);
    addEdgeWindows(box, P.heritagePost, P.glass, P.policeBrick, mainWing.pts[0], mainWing.pts[1], mainCenter, 3, 1.80, 1.05, 1.25, true);
    addEdgeWindows(box, P.heritagePost, P.glass, P.policeBrick, mainWing.pts[3], mainWing.pts[0], mainCenter, 3, 1.80, 1.05, 1.25, true);

    // North-west to south-east administrative/charge wing (gabled roof, LiDAR eave 3.16 m, ridge 6.39 m)
    addExtrudedFootprintWalls(push, P.policeBrick, northWing.pts, 0.0, 1.35);
    addExtrudedFootprintWalls(push, P.policeUpperWall, northWing.pts, 1.35, northWing.eaveH);
    addGabledRoof4(
      push,
      box,
      P.policeRoof,
      P.policeUpperWall,
      P.ridgeDark,
      northWing.pts,
      northWing.eaveH,
      northWing.ridgeH
    );
    addEdgeWindows(box, P.heritagePost, P.glass, P.policeBrick, northWing.pts[0], northWing.pts[1], northCenter, 4, 1.80, 1.10, 1.25, true);
    addEdgeWindows(box, P.heritagePost, P.glass, P.policeBrick, northWing.pts[2], northWing.pts[3], northCenter, 4, 1.80, 1.10, 1.25, true);

    // NSW Police blue identification band & Merilba Street corner entry signage
    const pCornerX = -4603.2;
    const pCornerZ = -787.2;
    const pYaw = -Math.atan2(
      mainWing.pts[0][1] - mainWing.pts[3][1],
      mainWing.pts[0][0] - mainWing.pts[3][0]
    );
    box(P.policeBlue, 3.8, 0.44, 0.24, pCornerX, 2.68, pCornerZ, pYaw);
    box(P.heritagePost, 3.82, 0.12, 0.26, pCornerX, 2.42, pCornerZ, pYaw);
    box(P.heritagePost, 1.36, 2.25, 0.16, pCornerX + 0.12, 1.15, pCornerZ + 0.08, pYaw);
    box(P.policeBlue, 1.16, 2.12, 0.18, pCornerX + 0.10, 1.10, pCornerZ + 0.06, pYaw);
    box(P.glass, 0.92, 0.95, 0.20, pCornerX + 0.08, 1.55, pCornerZ + 0.05, pYaw);
    if (ctx.boardTexture && ctx.plane && typeof document !== 'undefined') {
      const tex = ctx.boardTexture(
        ['NARROMINE POLICE STATION', '[address redacted] · NSW POLICE'],
        { bg: '#163e73', fg: '#ffffff', border: '#ffffff', w: 1024, h: 200 }
      );
      ctx.plane(tex, 3.6, 0.50, pCornerX - 0.22, 2.68, pCornerZ - 0.12, -Math.PI * 0.65);
    }

    // Northern police vehicle garage outbuilding on Lot 5
    const gp = policeStation.garageWorld;
    addExtrudedFootprintWalls(push, P.policeUpperWall, gp, 0.0, 2.90);
    addHippedRoof4(push, box, P.policeRoof, P.ridgeDark, gp, 2.90, 3.75, '0-1', 0.25);

    colliders.push(...sliceQuadColliders(mainWing.pts, 3, 3.5));
    colliders.push(...sliceQuadColliders(northWing.pts, 4, 3.5));
    colliders.push(...sliceQuadColliders(gp, 2, 3.5));
  }

  // ── 3. [address redacted]: Narromine Courthouse (NSW Local Court) ────────────
  {
    const sp = localCourt.spineWorld;
    const pp = localCourt.porticoWorld;
    const ew = localCourt.eastWingWorld;
    const cl = localCourt.clerestoryWorld;
    const ax = localCourt.annexWorld;
    const { eaveHeightM, ridgeHeightM, clerestoryTopM, porticoEaveM, annexEaveM } =
      localCourt.dimensionsM;
    const spineCenter = localCourt.centreWorld;
    const eastCenter = [
      (ew[0][0] + ew[1][0] + ew[2][0] + ew[3][0]) * 0.25,
      (ew[0][1] + ew[1][1] + ew[2][1] + ew[3][1]) * 0.25,
    ];
    const clCenter = [
      (cl[0][0] + cl[1][0] + cl[2][0] + cl[3][0]) * 0.25,
      (cl[0][1] + cl[1][1] + cl[2][1] + cl[3][1]) * 0.25,
    ];

    // Main north-south institutional buff-brick spine (26.0 m × 11.45 m)
    addExtrudedFootprintWalls(push, P.courtDarkBrick, sp, 0.0, 0.55);
    addExtrudedFootprintWalls(push, P.courtBuffBrick, sp, 0.55, eaveHeightM - 0.30);
    addExtrudedFootprintWalls(push, P.courtFascia, sp, eaveHeightM - 0.30, eaveHeightM);
    addHippedRoof4(push, box, P.policeRoof, P.ridgeDark, sp, eaveHeightM, ridgeHeightM, '1-2', 0.42);

    // Eastern courtroom wing (9.25 m × 9.15 m)
    addExtrudedFootprintWalls(push, P.courtDarkBrick, ew, 0.0, 0.55);
    addExtrudedFootprintWalls(push, P.courtBuffBrick, ew, 0.55, eaveHeightM - 0.30);
    addExtrudedFootprintWalls(push, P.courtFascia, ew, eaveHeightM - 0.30, eaveHeightM);
    addHippedRoof4(push, box, P.policeRoof, P.ridgeDark, ew, eaveHeightM, ridgeHeightM, '0-1', 0.38);

    // Raised central courtroom clerestory monitor (3.65 m -> 5.75 m) with clerestory ribbon windows
    addExtrudedFootprintWalls(push, P.courtBuffBrick, cl, eaveHeightM, clerestoryTopM - 0.25);
    addExtrudedFootprintWalls(push, P.courtFascia, cl, clerestoryTopM - 0.25, clerestoryTopM);
    addHippedRoof4(push, box, P.policeRoof, P.ridgeDark, cl, clerestoryTopM, clerestoryTopM + 0.55, '0-1', 0.32);
    addEdgeWindows(box, P.courtFascia, P.glass, P.courtDarkBrick, cl[0], cl[1], clCenter, 3, 4.85, 1.65, 0.62, false);
    addEdgeWindows(box, P.courtFascia, P.glass, P.courtDarkBrick, cl[2], cl[3], clCenter, 3, 4.85, 1.65, 0.62, false);
    addEdgeWindows(box, P.courtFascia, P.glass, P.courtDarkBrick, cl[3], cl[0], clCenter, 2, 4.85, 1.35, 0.62, false);

    // Covered western Merilba Street entry portico with 5 brick colonnade piers
    flatPoly(P.concretePath, pp, 0.16);
    addExtrudedFootprintWalls(push, P.courtDarkBrick, pp, 0.0, 0.16);
    addExtrudedFootprintWalls(push, P.courtFascia, pp, porticoEaveM - 0.42, porticoEaveM);
    flatPoly(P.policeRoof, pp, porticoEaveM + 0.02);
    const portYaw = -Math.atan2(pp[3][1] - pp[0][1], pp[3][0] - pp[0][0]);
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const px = pp[0][0] + (pp[3][0] - pp[0][0]) * t;
      const pz = pp[0][1] + (pp[3][1] - pp[0][1]) * t;
      box(P.courtDarkBrick, 0.42, 0.55, 0.42, px, 0.28, pz, portYaw);
      box(P.courtBuffBrick, 0.36, porticoEaveM - 0.95, 0.36, px, 0.55 + (porticoEaveM - 0.95) * 0.5, pz, portYaw);
    }

    // Glazed entry doors & 4-bay institutional windows aligned between the 5 colonnade piers
    addEdgeWindows(box, P.courtFascia, P.glass, P.courtDarkBrick, sp[3], sp[0], spineCenter, 4, 2.05, 1.35, 1.45, false);
    const doorX = (sp[3][0] + sp[0][0]) * 0.5 - 0.08;
    const doorZ = (sp[3][1] + sp[0][1]) * 0.5;
    box(P.courtFascia, 1.95, 2.50, 0.16, doorX, 1.32, doorZ, portYaw);
    box(P.courtDarkBrick, 1.78, 2.38, 0.18, doorX - 0.02, 1.26, doorZ, portYaw);
    box(P.glass, 1.56, 2.15, 0.20, doorX - 0.04, 1.30, doorZ, portYaw);
    addEdgeWindows(box, P.courtFascia, P.glass, P.courtDarkBrick, sp[0], sp[1], spineCenter, 3, 2.05, 1.25, 1.45, false);
    addEdgeWindows(box, P.courtFascia, P.glass, P.courtDarkBrick, sp[2], sp[3], spineCenter, 3, 2.05, 1.25, 1.45, false);
    addEdgeWindows(box, P.courtFascia, P.glass, P.courtDarkBrick, ew[1], ew[2], eastCenter, 2, 2.15, 1.35, 1.25, false);

    // North-east registry/security annex
    addExtrudedFootprintWalls(push, P.courtBuffBrick, ax, 0.0, annexEaveM);
    addHippedRoof4(push, box, P.policeRoof, P.ridgeDark, ax, annexEaveM, annexEaveM + 0.65, '1-2', 0.25);

    // Civic flagpole on Merilba Street forecourt
    box(P.heritagePost, 0.10, 6.8, 0.10, -4604.2, 3.4, -834.5, 0);
    box(P.policeBlue, 1.35, 0.72, 0.04, -4603.5, 6.3, -834.5, 0);

    // Merilba Street "NARROMINE COURT HOUSE" signboard on western portico fascia (facing west toward Merilba St)
    const portMidX = (pp[0][0] + pp[3][0]) * 0.5;
    const portMidZ = (pp[0][1] + pp[3][1]) * 0.5;
    const portDx = pp[0][0] - pp[1][0];
    const portDz = pp[0][1] - pp[1][1];
    const portD = Math.hypot(portDx, portDz) || 1;
    const westFaceYaw = Math.atan2(portDx / portD, portDz / portD);
    if (ctx.boardTexture && ctx.plane && typeof document !== 'undefined') {
      const tex = ctx.boardTexture(
        ['NARROMINE COURT HOUSE', 'NSW LOCAL COURT · 47 MERILBA ST'],
        { bg: '#3b2b1d', fg: '#f5efe6', border: '#c8a982', w: 1024, h: 200 }
      );
      ctx.plane(
        tex,
        5.2,
        0.52,
        portMidX + (portDx / portD) * 0.12,
        porticoEaveM - 0.21,
        portMidZ + (portDz / portD) * 0.12,
        westFaceYaw
      );
    }

    colliders.push(...sliceQuadColliders(sp, 5, 4.0));
    colliders.push(...sliceQuadColliders(ew, 2, 4.0));
    colliders.push(...sliceQuadColliders(ax, 2, 3.5));
  }

  // ── 4. [address redacted]: Hub n Spoke Circular Atrium Co-Working Building ──
  {
    const [cx, cz] = hubNSpoke.centreWorld;
    const {
      coreOuterRadiusM: rOut,
      atriumInnerRadiusM: rIn,
      fanWingOuterRadiusM: rFan,
      coreEaveHeightM: yEave,
      coreApexHeightM: yApex,
      fanWingEaveHeightM: yFan,
      segments,
    } = hubNSpoke.dimensionsM;

    const outerPts = [];
    const innerPts = [];
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      outerPts.push([cx + Math.cos(a) * rOut, cz + Math.sin(a) * rOut]);
      innerPts.push([cx + Math.cos(a) * rIn, cz + Math.sin(a) * rIn]);
    }

    // Outer 16-sided drum wall + deep teal fascia + co-working windows
    for (let i = 0; i < segments; i++) {
      const a = outerPts[i];
      const b = outerPts[(i + 1) % segments];
      addQuadWall(push, P.hubWall, a, b, 0.0, yEave - 0.34);
      addQuadWall(push, P.hubAccent, a, b, yEave - 0.34, yEave);
      if (i % 2 === 0) {
        addEdgeWindows(box, P.hubAccent, P.glass, P.hubAccent, a, b, [cx, cz], 1, 1.85, 1.55, 1.35, false);
      }
    }

    // Central open circular atrium oculus (glazed courtyard ring + inner garden turf)
    flatPoly(P.atriumTurf, innerPts, 0.08);
    for (let i = 0; i < segments; i++) {
      const a = innerPts[(i + 1) % segments];
      const b = innerPts[i];
      addQuadWall(push, P.glass, a, b, 0.0, yEave);
      addQuadWall(push, P.hubAccent, a, b, yEave - 0.18, yEave + 0.25);
    }

    // Radial pitched annular roof rising from outer drum (rOut, yEave) to mid-ring (rMid, yApex)
    // and sloping down to the open central oculus ring (rIn, yEave + 0.25)
    const rMid = (rOut + rIn) * 0.52;
    for (let i = 0; i < segments; i++) {
      const i1 = (i + 1) % segments;
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = (i1 / segments) * Math.PI * 2;
      const m0 = [cx + Math.cos(a0) * rMid, yApex, cz + Math.sin(a0) * rMid];
      const m1 = [cx + Math.cos(a1) * rMid, yApex, cz + Math.sin(a1) * rMid];
      const o0 = [outerPts[i][0], yEave, outerPts[i][1]];
      const o1 = [outerPts[i1][0], yEave, outerPts[i1][1]];
      const n0 = [innerPts[i][0], yEave + 0.25, innerPts[i][1]];
      const n1 = [innerPts[i1][0], yEave + 0.25, innerPts[i1][1]];
      addQuadFace(push, P.hubRoof, o0, o1, m1, m0);
      addQuadFace(push, P.hubRoof, m0, m1, n1, n0);
    }

    // Two curved fan-shaped outer wing sectors (west & south sectors visible in NSW aerial imagery)
    const fanSectors = [
      [2, 6],   // South / Burraway Street entrance fan wing
      [7, 11],  // West fan wing
    ];
    for (const [s0, s1] of fanSectors) {
      const aStart = (s0 / segments) * Math.PI * 2;
      const aEnd = (s1 / segments) * Math.PI * 2;
      // Side radial close-off walls for each fan sector
      addQuadWall(
        push,
        P.hubWall,
        [cx + Math.cos(aStart) * rOut, cz + Math.sin(aStart) * rOut],
        [cx + Math.cos(aStart) * rFan, cz + Math.sin(aStart) * rFan],
        0.0,
        yFan
      );
      addQuadWall(
        push,
        P.hubWall,
        [cx + Math.cos(aEnd) * rFan, cz + Math.sin(aEnd) * rFan],
        [cx + Math.cos(aEnd) * rOut, cz + Math.sin(aEnd) * rOut],
        0.0,
        yFan
      );
      for (let i = s0; i < s1; i++) {
        const i1 = (i + 1) % segments;
        const a0 = (i / segments) * Math.PI * 2;
        const a1 = (i1 / segments) * Math.PI * 2;
        const f0 = [cx + Math.cos(a0) * rFan, cz + Math.sin(a0) * rFan];
        const f1 = [cx + Math.cos(a1) * rFan, cz + Math.sin(a1) * rFan];
        addQuadWall(push, P.hubWall, f0, f1, 0.0, yFan - 0.26);
        addQuadWall(push, P.hubAccent, f0, f1, yFan - 0.26, yFan);
        addEdgeWindows(box, P.hubAccent, P.glass, P.hubAccent, f0, f1, [cx, cz], 1, 1.65, 1.55, 1.25, false);
        addQuadFace(
          push,
          P.hubRoof,
          [f0[0], yFan, f0[1]],
          [f1[0], yFan, f1[1]],
          [outerPts[i1][0], yEave - 0.08, outerPts[i1][1]],
          [outerPts[i][0], yEave - 0.08, outerPts[i][1]]
        );
      }
    }

    if (ctx.boardTexture && ctx.plane && typeof document !== 'undefined') {
      const tex = ctx.boardTexture(
        ['HUB N SPOKE · 37 BURRAWAY ST', 'NARROMINE CO-WORKING & BUSINESS HUB'],
        { bg: '#2f5d62', fg: '#f4f1ea', border: '#e8e4dc', w: 1024, h: 200 }
      );
      const aSign = (4.5 / segments) * Math.PI * 2;
      const nxSign = Math.cos(aSign);
      const nzSign = Math.sin(aSign);
      const rMidFan = rFan * Math.cos(Math.PI / segments);
      const sx = cx + nxSign * (rMidFan + 0.14);
      const sz = cz + nzSign * (rMidFan + 0.14);
      const signYaw = -Math.atan2(-nxSign, nzSign);
      box(P.hubAccent, 4.5, 0.56, 0.14, cx + nxSign * (rMidFan + 0.05), yFan - 0.18, cz + nzSign * (rMidFan + 0.05), signYaw);
      ctx.plane(tex, 4.4, 0.50, sx, yFan - 0.18, sz, Math.atan2(nxSign, nzSign));
    }

    const rCol = rOut * 0.86;
    colliders.push({ x0: cx - rCol, x1: cx + rCol, z0: cz - rCol, z1: cz + rCol });
  }

  // ── 5. Forecourt Paths, Boundary Fences & Interactive Heritage Spots ────────
  for (const path of NARROMINE_COURTHOUSE_ACCESS.burrawayEntryPathsWorld) {
    flatPoly(P.concretePath, path.pts, 0.068);
  }

  for (const fence of NARROMINE_COURTHOUSE_ACCESS.fencesWorld) {
    const dx = fence.b[0] - fence.a[0];
    const dz = fence.b[1] - fence.a[1];
    const len = Math.hypot(dx, dz) || 1;
    const yaw = -Math.atan2(dz, dx);
    const mx = (fence.a[0] + fence.b[0]) * 0.5;
    const mz = (fence.a[1] + fence.b[1]) * 0.5;
    box(P.heritagePost, len, 1.05, 0.09, mx, 0.525, mz, yaw);
  }

  const ep = NARROMINE_COURTHOUSE_ACCESS.pedestrianEntryPointsWorld;
  spots.push(
    {
      key: 'narromine:former-courthouse-35-burraway',
      label: 'Former Narromine Courthouse (1898 · 35 Burraway St)',
      name: 'Former Narromine Courthouse (1898)',
      kind: 'historic_courthouse',
      kindLabel: 'Heritage former courthouse (1898, LEP Item I5)',
      address: '[address redacted]',
      x: ep.formerCourthouseFront[0],
      z: ep.formerCourthouseFront[1],
      pos: new THREE.Vector3(ep.formerCourthouseFront[0], 0, ep.formerCourthouseFront[1]),
      text:
        '[address redacted] (Lot 6, Section 17, DP 758759) — Narromine LEP 2011 Heritage Item I5 "Courthouse (former)". Built c. 1898 under NSW Government Architect Walter Liberty Vernon with a corrugated iron hipped roof, front verandah, and rear lock-up; later used as a local museum and Narromine Car Club clubrooms.',
    },
    {
      key: 'narromine:courthouse-47-merilba',
      label: 'Narromine Courthouse (NSW Local Court · 47 Merilba St)',
      name: 'Narromine Courthouse',
      kind: 'courthouse',
      kindLabel: 'NSW Local Court',
      address: '[address redacted]',
      x: ep.localCourtFront[0],
      z: ep.localCourtFront[1],
      pos: new THREE.Vector3(ep.localCourtFront[0], 0, ep.localCourtFront[1]),
      text:
        '[address redacted] (Lot 10, Section 17, DP 758759) — The operational Narromine Local Court house fronting Merilba Street, featuring a covered western colonnade portico, central courtroom clerestory monitor, and registry wing.',
    },
    {
      key: 'narromine:police-station-49-merilba',
      label: 'Narromine Police Station (49 Merilba St)',
      name: 'Narromine Police Station',
      kind: 'police',
      kindLabel: 'NSW Police Station & Residence',
      address: '[address redacted]',
      x: ep.policeStationCorner[0],
      z: ep.policeStationCorner[1],
      pos: new THREE.Vector3(ep.policeStationCorner[0], 0, ep.policeStationCorner[1]),
      text:
        '[address redacted] / Corner of Burraway & Merilba Streets (Lot 5, Section 17, DP 758759, osm:174) — Narromine Police Station & Residence wrapping around the 1898 Former Courthouse lot, with surveyed 2011 NSW Spatial Services LiDAR heights (3.16 m eave, 6.39 m ridge).',
    },
    {
      key: 'narromine:hub-n-spoke-37-burraway',
      label: 'Hub n Spoke (37 Burraway St)',
      name: 'HubnSpoke',
      kind: 'coworking',
      kindLabel: 'Council co-working & business incubator hub',
      address: '[address redacted]',
      x: ep.hubNSpokeFront[0],
      z: ep.hubNSpokeFront[1],
      pos: new THREE.Vector3(ep.hubNSpokeFront[0], 0, ep.hubNSpokeFront[1]),
      text:
        '[address redacted] (Lot 2 & Lot 12, Section 17, DP 758759) — Hub n Spoke, Narromine Shire Council’s circular radial-roofed co-working and business incubator building built around a central open circular atrium oculus.',
    }
  );

  // If running standalone (no external `ctx.push` provided), merge each colour bucket
  // into a single Mesh per material colour and attach to `group`.
  let meshCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;
  if (!ctx.push) {
    for (const [colour, geos] of localBuckets) {
      const merged = mergeGeometries(geos);
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
    disambiguation: NARROMINE_COURTHOUSE_DISAMBIGUATION,
    cadastralLots: NARROMINE_COURTHOUSE_CADASTRAL_LOTS,
    buildings: NARROMINE_COURTHOUSE_BUILDINGS,
    integrationSpec: NARROMINE_COURTHOUSE_INTEGRATION_SPEC,
  };
}
