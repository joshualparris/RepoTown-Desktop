// Three.js 3D architectural reconstruction of the North-West Dandaloo Street
// Heritage, Civic & Commercial Block (38–[address redacted], Narromine NSW 2821),
// corresponding to comparison screenshots #31–#44 and #47–#50.
//
// Works both:
//   1) Standalone: `buildNarromineNwDandalooBlock()` returns
//      `{ group, colliders, spots, stats, buildings, integrationSpec }`
//      with geometries merged by material colour for draw-call efficiency.
//   2) Integrated: `buildNarromineNwDandalooBlock({ box, push, strip, flatPoly, plane, boardTexture, colliders, spots })`
//      feeds directly into `src/world/narromine.js`'s spatial tile batcher.
//
// Feature-scoped per `docs/PARALLEL_AGENT_COORDINATION.md`:
//   - Replaces flat generic OSM extrusions `osm:179`, `osm:180`, `osm:183`,
//     `osm:184`, `osm:185` (52–[address redacted]) and generic `FILL_SHOPS`
//     boxes for `Narromine Baptist Church` (44 Dandaloo St), `Narromine
//     Battlers Mate` (42 Dandaloo St), and `Aqua West` (38–40 Dandaloo St).
//   - Explicitly leaves `osm:186` (50 Dandaloo St — Narromine Physiotherapy,
//     claimed in PR #338) and Dandaloo Street median/kerb/lamp geometry
//     (claimed in PR #336) completely untouched.

import * as THREE from 'three';
import {
  NARROMINE_NW_DANDALOO_INTEGRATION_SPEC,
  NARROMINE_NW_DANDALOO_BUILDINGS,
} from './narromine-nw-dandaloo-evidence.js';

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

export function sliceQuadColliders(pts, minSlices = 3, stepM = 2.8) {
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

function polyCentre(pts) {
  let sx = 0;
  let sz = 0;
  for (const [x, z] of pts) {
    sx += x;
    sz += z;
  }
  return [sx / pts.length, sz / pts.length];
}

// Compute an oriented edge frame from vertex A to vertex B whose outward normal
// points away from the polygon's interior centroid.
export function edgeFrame(pts, iA, iB) {
  const a = pts[iA];
  const b = pts[iB];
  const [cx, cz] = polyCentre(pts);
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz) || 1;
  const tx = dx / len;
  const tz = dz / len;
  const mx = (a[0] + b[0]) * 0.5;
  const mz = (a[1] + b[1]) * 0.5;
  let nx = -tz;
  let nz = tx;
  if (nx * (mx - cx) + nz * (mz - cz) < 0) {
    nx = -nx;
    nz = -nz;
  }
  const yaw = -Math.atan2(tz, tx);
  const faceYaw = Math.atan2(nx, nz);
  const at = (t, out = 0) => [
    a[0] + dx * t + nx * out,
    a[1] + dz * t + nz * out,
  ];
  return { a, b, len, tx, tz, nx, nz, yaw, faceYaw, mx, mz, at };
}

function addExtrudedPrism(push, colour, pts, y0, y1) {
  if (y1 <= y0) return;
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  if (y0 !== 0) g.translate(0, y0, 0);
  g.computeVertexNormals();
  push(colour, g);
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

// Hipped roof over a 4-point quad `pts = [NW, NE, SE, SW]`, with ridge along
// the longer dimension and slight eave overhang.
function addHippedRoofQuad(push, box, roofColour, ridgeColour, pts, eaveY, ridgeY, overhang = 0.30) {
  const [cx, cz] = polyCentre(pts);
  const exp = pts.map(([x, z]) => {
    const dx = x - cx;
    const dz = z - cz;
    const d = Math.hypot(dx, dz) || 1;
    return [x + (dx / d) * overhang, z + (dz / d) * overhang];
  });
  const d01 = Math.hypot(exp[1][0] - exp[0][0], exp[1][1] - exp[0][1]);
  const d12 = Math.hypot(exp[2][0] - exp[1][0], exp[2][1] - exp[1][1]);
  const A = [exp[0][0], eaveY, exp[0][1]];
  const B = [exp[1][0], eaveY, exp[1][1]];
  const C = [exp[2][0], eaveY, exp[2][1]];
  const D = [exp[3][0], eaveY, exp[3][1]];

  if (d01 >= d12) {
    const mW = [(exp[0][0] + exp[3][0]) * 0.5, (exp[0][1] + exp[3][1]) * 0.5];
    const mE = [(exp[1][0] + exp[2][0]) * 0.5, (exp[1][1] + exp[2][1]) * 0.5];
    const r0 = [mW[0] + (mE[0] - mW[0]) * 0.22, ridgeY, mW[1] + (mE[1] - mW[1]) * 0.22];
    const r1 = [mW[0] + (mE[0] - mW[0]) * 0.78, ridgeY, mW[1] + (mE[1] - mW[1]) * 0.78];
    addQuadFace(push, roofColour, A, B, r1, r0);
    addQuadFace(push, roofColour, C, D, r0, r1);
    addTriFace(push, roofColour, B, C, r1);
    addTriFace(push, roofColour, D, A, r0);
    const rLen = Math.hypot(r1[0] - r0[0], r1[2] - r0[2]);
    const rYaw = -Math.atan2(r1[2] - r0[2], r1[0] - r0[0]);
    box(ridgeColour, rLen + 0.16, 0.10, 0.16, (r0[0] + r1[0]) * 0.5, ridgeY + 0.03, (r0[2] + r1[2]) * 0.5, rYaw);
  } else {
    const mN = [(exp[0][0] + exp[1][0]) * 0.5, (exp[0][1] + exp[1][1]) * 0.5];
    const mS = [(exp[3][0] + exp[2][0]) * 0.5, (exp[3][1] + exp[2][1]) * 0.5];
    const r0 = [mN[0] + (mS[0] - mN[0]) * 0.22, ridgeY, mN[1] + (mS[1] - mN[1]) * 0.22];
    const r1 = [mN[0] + (mS[0] - mN[0]) * 0.78, ridgeY, mN[1] + (mS[1] - mN[1]) * 0.78];
    addQuadFace(push, roofColour, B, C, r1, r0);
    addQuadFace(push, roofColour, D, A, r0, r1);
    addTriFace(push, roofColour, A, B, r0);
    addTriFace(push, roofColour, C, D, r1);
    const rLen = Math.hypot(r1[0] - r0[0], r1[2] - r0[2]);
    const rYaw = -Math.atan2(r1[2] - r0[2], r1[0] - r0[0]);
    box(ridgeColour, rLen + 0.16, 0.10, 0.16, (r0[0] + r1[0]) * 0.5, ridgeY + 0.03, (r0[2] + r1[2]) * 0.5, rYaw);
  }
}

// Gable roof with ridge running from midpoint of edge (1,2) (front) to midpoint
// of edge (0,3) (rear), so the triangular gable faces the street (edge 1->2).
function addStreetFacingGableRoof(push, box, roofColour, gableColour, bargeColour, pts, eaveY, ridgeY) {
  const [p0, p1, p2, p3] = pts;
  const frontMid = [(p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5];
  const rearMid = [(p0[0] + p3[0]) * 0.5, (p0[1] + p3[1]) * 0.5];
  const A = [p0[0], eaveY, p0[1]];
  const B = [p1[0], eaveY, p1[1]];
  const C = [p2[0], eaveY, p2[1]];
  const D = [p3[0], eaveY, p3[1]];
  const RF = [frontMid[0], ridgeY, frontMid[1]];
  const RR = [rearMid[0], ridgeY, rearMid[1]];

  // Two roof slopes
  addQuadFace(push, roofColour, A, B, RF, RR);
  addQuadFace(push, roofColour, C, D, RR, RF);

  // Triangular gable ends (front and rear)
  const frontFrame = edgeFrame(pts, 1, 2);
  const rearFrame = edgeFrame(pts, 3, 0);
  const frontW = frontFrame.len;
  const rise = ridgeY - eaveY;
  for (const fr of [frontFrame, rearFrame]) {
    const shape = new THREE.Shape();
    shape.moveTo(-fr.len * 0.5, eaveY);
    shape.lineTo(fr.len * 0.5, eaveY);
    shape.lineTo(0, ridgeY);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false });
    g.translate(0, 0, -0.07);
    g.rotateY(fr.yaw);
    g.translate(fr.mx, 0, fr.mz);
    g.computeVertexNormals();
    push(gableColour, g);
  }

  // Bargeboards along the front gable raking edges and ridge flashing
  const slopeLen = Math.hypot(frontW * 0.5, rise);
  const slopeAngle = Math.atan2(rise, frontW * 0.5);
  for (const side of [-1, 1]) {
    const g = new THREE.BoxGeometry(slopeLen + 0.18, 0.14, 0.18);
    g.rotateZ(-side * slopeAngle);
    g.translate(side * frontW * 0.25, eaveY + rise * 0.5 + 0.03, 0);
    g.rotateY(frontFrame.yaw);
    const [bx, bz] = frontFrame.at(0.5, 0.08);
    g.translate(bx, 0, bz);
    push(bargeColour, g);
  }
  const ridgeLen = Math.hypot(frontMid[0] - rearMid[0], frontMid[1] - rearMid[1]);
  const ridgeYaw = -Math.atan2(frontMid[1] - rearMid[1], frontMid[0] - rearMid[0]);
  box(bargeColour, ridgeLen + 0.20, 0.10, 0.16, (frontMid[0] + rearMid[0]) * 0.5, ridgeY + 0.03, (frontMid[1] + rearMid[1]) * 0.5, ridgeYaw);
}

// Helper to draw a multi-pane sash window on an edge frame
function addSashWindow(box, fr, t, y0, y1, w, {
  frameColour = 0xf4f2ec,
  glassColour = 0x243442,
  sillColour = 0xf4f2ec,
  keystoneColour = null,
  out = 0.08,
} = {}) {
  const h = y1 - y0;
  const yc = y0 + h * 0.5;
  const [fx, fz] = fr.at(t, out);
  box(frameColour, w + 0.18, h + 0.18, 0.08, fx, yc, fz, fr.yaw);
  const [gx, gz] = fr.at(t, out + 0.03);
  box(glassColour, w, h, 0.06, gx, yc, gz, fr.yaw);
  // Horizontal meeting rail and vertical muntin bars
  const [mx, mz] = fr.at(t, out + 0.055);
  box(frameColour, w, 0.06, 0.04, mx, yc, mz, fr.yaw);
  box(frameColour, 0.05, h, 0.04, mx, yc, mz, fr.yaw);
  // Projecting sill
  const [sx, sz] = fr.at(t, out + 0.06);
  box(sillColour, w + 0.28, 0.10, 0.14, sx, y0 - 0.04, sz, fr.yaw);
  // Classical lintel and keystone
  if (keystoneColour !== null) {
    const [lx, lz] = fr.at(t, out + 0.06);
    box(keystoneColour, w + 0.30, 0.22, 0.12, lx, y1 + 0.12, lz, fr.yaw);
    const [kx, kz] = fr.at(t, out + 0.09);
    box(keystoneColour, 0.28, 0.34, 0.15, kx, y1 + 0.16, kz, fr.yaw);
  }
}

export function buildNarromineNwDandalooBlock(ctx = null) {
  const standalone = !ctx;
  const group = standalone ? new THREE.Group() : null;
  if (group) group.name = 'Narromine North-West Dandaloo Street Block (38–68 Dandaloo St)';
  const buckets = standalone ? new Map() : null;
  const colliders = ctx?.colliders ?? [];
  const spots = ctx?.spots ?? [];
  let geometryCount = 0;

  const push = (colour, geo) => {
    geometryCount++;
    if (ctx?.push) {
      ctx.push(colour, geo);
    } else {
      if (!buckets.has(colour)) buckets.set(colour, []);
      buckets.get(colour).push(geo);
    }
  };

  const box = (colour, w, h, d, x, y, z, ry = 0) => {
    if (ctx?.box) {
      geometryCount++;
      ctx.box(colour, w, h, d, x, y, z, ry);
    } else {
      const g = new THREE.BoxGeometry(w, h, d);
      if (ry) g.rotateY(ry);
      g.translate(x, y, z);
      push(colour, g);
    }
  };

  const placeOnEdge = (fr, colour, w, h, d, t, y, out = 0) => {
    const [x, z] = fr.at(t, out);
    box(colour, w, h, d, x, y, z, fr.yaw);
  };

  const signBoard = (lines, opts, w, h, x, y, z, faceYaw) => {
    if (ctx?.plane && ctx?.boardTexture && typeof document !== 'undefined') {
      const tex = ctx.boardTexture(lines, opts);
      ctx.plane(tex, w, h, x, y, z, faceYaw);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. [address redacted] — FORMER BANK / WARDI INSURANCE & AG COMMODITIES
  //    + CHILL-RITE CORNER BUILDING (osm:179, Screenshots #31–#36)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const spec = NARROMINE_NW_DANDALOO_BUILDINGS[0];
    const pts = spec.pts;
    const RED_BRICK = 0x9b4534;
    const DARK_BRICK = 0x7e3527;
    const WHITE_RENDER = 0xf3f0e8;
    const CREAM_TRIM = 0xe8e2d4;
    const PLINTH_GREY = 0x4b4e52;
    const ROOF_GALV = 0x7d848a;
    const DOOR_TIMBER = 0x4a3528;

    // Split the 26 m deep corner lot into the eastern 2-storey heritage bank
    // block (front 15.5 m along Nymagee St, wallH = 8.45 m, ridge = 10.20 m)
    // and the western 1-storey brick rear service wing (eave = 4.17 m).
    const splitT = 0.60;
    const p01 = [
      pts[1][0] + (pts[0][0] - pts[1][0]) * splitT,
      pts[1][1] + (pts[0][1] - pts[1][1]) * splitT,
    ];
    const p23 = [
      pts[2][0] + (pts[3][0] - pts[2][0]) * splitT,
      pts[2][1] + (pts[3][1] - pts[2][1]) * splitT,
    ];
    const frontBankPts = [p01, pts[1], pts[2], p23];
    const rearWingPts = [pts[0], p01, p23, pts[3]];

    // Main two-storey red-brick bank mass (y = 0..8.45 m) & hipped roof (10.20 m)
    addExtrudedPrism(push, RED_BRICK, frontBankPts, 0, 8.45);
    addHippedRoofQuad(push, box, ROOF_GALV, DARK_BRICK, frontBankPts, 8.45, 10.15, 0.25);

    // Rear single-storey red-brick service wing (y = 0..4.17 m, matching LiDAR 5th-percentile 4.17 m)
    addExtrudedPrism(push, RED_BRICK, rearWingPts, 0, 4.17);
    addHippedRoofQuad(push, box, ROOF_GALV, DARK_BRICK, rearWingPts, 4.17, 5.45, 0.20);

    // Two tall corbelled red-brick chimneys with white rendered necking bands (top = 10.86 m LiDAR ridge)
    for (const [cx, cz] of [
      [-4781.2, -976.8],
      [-4788.6, -978.1],
    ]) {
      box(RED_BRICK, 0.85, 2.55, 0.75, cx, 9.58, cz);
      box(WHITE_RENDER, 0.98, 0.22, 0.88, cx, 10.75, cz);
    }

    // Dandaloo Street East Façade (edge 1->2, length 10.54 m)
    const eastFace = edgeFrame(pts, 1, 2);
    // Ground-floor plinth
    placeOnEdge(eastFace, PLINTH_GREY, eastFace.len + 0.08, 0.58, 0.14, 0.5, 0.29, 0.06);

    // 4 rusticated ground-floor brick pilasters with white horizontal band courses
    for (const pt of [0.06, 0.34, 0.66, 0.94]) {
      placeOnEdge(eastFace, DARK_BRICK, 0.58, 4.05, 0.14, pt, 2.025, 0.07);
      for (const by of [1.15, 1.85, 2.55, 3.25]) {
        placeOnEdge(eastFace, WHITE_RENDER, 0.64, 0.16, 0.17, pt, by, 0.08);
      }
    }
    // Upper-storey corner brick pilasters (y = 4.55..8.45 m)
    for (const pt of [0.05, 0.95]) {
      placeOnEdge(eastFace, DARK_BRICK, 0.56, 3.90, 0.12, pt, 6.50, 0.06);
    }

    // Central classical white rendered entrance surround & pedimented hood (t = 0.50)
    placeOnEdge(eastFace, WHITE_RENDER, 2.15, 3.35, 0.18, 0.50, 1.675, 0.09);
    placeOnEdge(eastFace, WHITE_RENDER, 2.45, 0.28, 0.28, 0.50, 3.42, 0.13);
    placeOnEdge(eastFace, DOOR_TIMBER, 1.45, 2.55, 0.10, 0.50, 1.32, 0.14);
    placeOnEdge(eastFace, 0x9fb3c2, 1.40, 0.42, 0.08, 0.50, 2.88, 0.15);

    // Ground-floor flanking sash windows with white keystones (t = 0.20, 0.80)
    for (const wt of [0.20, 0.80]) {
      addSashWindow(box, eastFace, wt, 0.95, 2.95, 1.25, {
        frameColour: WHITE_RENDER,
        keystoneColour: WHITE_RENDER,
        out: 0.08,
      });
    }

    // Continuous white classical entablature & frieze band (y = 4.05..4.62 m)
    placeOnEdge(eastFace, WHITE_RENDER, eastFace.len + 0.22, 0.56, 0.20, 0.50, 4.33, 0.10);
    placeOnEdge(eastFace, CREAM_TRIM, eastFace.len + 0.30, 0.14, 0.26, 0.50, 4.64, 0.12);

    // Three signage panels along the Dandaloo St entablature: INSURANCE | WARDi | AG COMMODITIES
    for (const [st, wSign, lines, fg] of [
      [0.20, 2.6, ['INSURANCE'], '#1b4332'],
      [0.50, 2.4, ['WARDi'], '#9b2226'],
      [0.80, 2.8, ['AG COMMODITIES'], '#1b4332'],
    ]) {
      placeOnEdge(eastFace, 0xffffff, wSign, 0.42, 0.06, st, 4.33, 0.21);
      const [sx, sz] = eastFace.at(st, 0.25);
      signBoard(lines, { bg: '#ffffff', fg, border: '#2b2d42', w: 512, h: 128 }, wSign - 0.08, 0.38, sx, 4.33, sz, eastFace.faceYaw);
    }

    // Upper-storey continuous white sill course (y = 4.98 m) and 3 12-pane sash windows with keystones
    placeOnEdge(eastFace, WHITE_RENDER, eastFace.len + 0.16, 0.12, 0.16, 0.50, 4.98, 0.08);
    for (const wt of [0.20, 0.50, 0.80]) {
      addSashWindow(box, eastFace, wt, 5.05, 7.42, 1.25, {
        frameColour: WHITE_RENDER,
        keystoneColour: WHITE_RENDER,
        out: 0.08,
      });
    }

    // Top classical white cornice (y = 8.22..8.52 m) + Triangular Red-Brick Pediment (apex = 10.20 m)
    placeOnEdge(eastFace, WHITE_RENDER, eastFace.len + 0.34, 0.30, 0.32, 0.50, 8.37, 0.14);
    {
      const pedShape = new THREE.Shape();
      pedShape.moveTo(-eastFace.len * 0.46, 8.45);
      pedShape.lineTo(eastFace.len * 0.46, 8.45);
      pedShape.lineTo(0, 10.20);
      pedShape.closePath();
      const pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 0.28, bevelEnabled: false });
      pedGeo.translate(0, 0, -0.14);
      pedGeo.rotateY(eastFace.yaw);
      const [px, pz] = eastFace.at(0.50, 0.06);
      pedGeo.translate(px, 0, pz);
      pedGeo.computeVertexNormals();
      push(RED_BRICK, pedGeo);

      // White raking cornice mouldings on the triangular pediment + corner parapet piers
      const halfSpan = eastFace.len * 0.47;
      const pedRise = 10.26 - 8.45;
      const rakeLen = Math.hypot(halfSpan, pedRise);
      const rakeAng = Math.atan2(pedRise, halfSpan);
      for (const side of [-1, 1]) {
        const rg = new THREE.BoxGeometry(rakeLen + 0.20, 0.22, 0.34);
        rg.rotateZ(-side * rakeAng);
        rg.translate(side * halfSpan * 0.5, 8.45 + pedRise * 0.5, 0);
        rg.rotateY(eastFace.yaw);
        const [rx, rz] = eastFace.at(0.50, 0.12);
        rg.translate(rx, 0, rz);
        push(WHITE_RENDER, rg);
      }
      // Central white circular/tablet ornament in the pediment tympanum & corner piers
      placeOnEdge(eastFace, WHITE_RENDER, 0.85, 0.55, 0.16, 0.50, 9.15, 0.18);
      for (const pt of [0.03, 0.97]) {
        placeOnEdge(eastFace, RED_BRICK, 0.65, 0.95, 0.36, pt, 8.92, 0.08);
        placeOnEdge(eastFace, WHITE_RENDER, 0.78, 0.18, 0.44, pt, 9.45, 0.10);
      }
    }

    // Nymagee Street South Return Façade (edge 2->3, front two-storey bank portion t = 0..0.58)
    const southFace = edgeFrame(pts, 2, 3);
    placeOnEdge(southFace, PLINTH_GREY, southFace.len * 0.60, 0.58, 0.14, 0.30, 0.29, 0.06);
    placeOnEdge(southFace, WHITE_RENDER, southFace.len * 0.60, 0.52, 0.18, 0.30, 4.33, 0.09);
    placeOnEdge(southFace, WHITE_RENDER, southFace.len * 0.60, 0.28, 0.28, 0.30, 8.37, 0.12);
    for (const wt of [0.10, 0.23, 0.36, 0.49]) {
      addSashWindow(box, southFace, wt, 5.05, 7.42, 1.15, {
        frameColour: WHITE_RENDER,
        keystoneColour: WHITE_RENDER,
        out: 0.08,
      });
      addSashWindow(box, southFace, wt, 0.95, 2.95, 1.15, {
        frameColour: WHITE_RENDER,
        keystoneColour: WHITE_RENDER,
        out: 0.08,
      });
    }
    // Nymagee St entablature sign: WARDi INSURANCE
    {
      placeOnEdge(southFace, 0xffffff, 4.2, 0.42, 0.06, 0.24, 4.33, 0.19);
      const [sx, sz] = southFace.at(0.24, 0.23);
      signBoard(['WARDi INSURANCE'], { bg: '#ffffff', fg: '#9b2226', border: '#2b2d42', w: 512, h: 128 }, 4.0, 0.38, sx, 4.33, sz, southFace.faceYaw);
    }

    // Adjoining Northern CHILL-RITE Gable Workshop & Fenced Yard (z = -985 to -996.9, frames #34–#36)
    const crPts = spec.architecture.chillRiteWorkshopPts;
    addExtrudedPrism(push, 0xd8dad6, crPts, 0, 3.55);
    addStreetFacingGableRoof(push, box, 0x6f767c, 0xe4e6e2, 0x4f565c, crPts, 3.55, 4.95);
    const crFront = edgeFrame(crPts, 1, 2);
    // Roller shutter & workshop window on Chill-Rite front
    placeOnEdge(crFront, 0x8a9298, 2.8, 2.6, 0.10, 0.35, 1.30, 0.08);
    addSashWindow(box, crFront, 0.72, 1.05, 2.45, 1.6, { frameColour: 0xf4f4f0, out: 0.08 });
    // Corrugated cream boundary fence & double gate along the footpath between osm:179 and osm:180
    box(0xe2dec9, 0.14, 1.85, 4.2, -4774.6, 0.925, -994.8, eastFace.yaw);
    // Chill-Rite fascia banner & projecting sign near the NE corner of 68 Dandaloo
    {
      const [bx, bz] = crFront.at(0.50, 0.16);
      placeOnEdge(crFront, 0xffffff, 4.8, 0.62, 0.06, 0.50, 3.15, 0.12);
      signBoard(['CHILL-RITE', 'REFRIGERATION & AIR CONDITIONING'], { bg: '#ffffff', fg: '#154c79', border: '#1d3557', w: 512, h: 128 }, 4.6, 0.56, bx, 3.15, bz, crFront.faceYaw);
    }

    colliders.push(...sliceQuadColliders(pts, 4, 3.0));
    colliders.push(...sliceQuadColliders(crPts, 2, 3.5));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. 60–[address redacted] — MACQUARIE CLOTHING (osm:180, Screenshots #35–#37)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const spec = NARROMINE_NW_DANDALOO_BUILDINGS[1];
    const pts = spec.pts;
    const WHITE_WALL = 0xf4f3ef;
    const PARAPET_TRIM = 0xdadcd8;
    const COPING_DARK = 0x4a525a;
    const PLINTH_CHARCOAL = 0x2c3034;
    const TEAL_SIGN = 0x165b75;
    const POST_DARK = 0x2f353b;

    // Main painted-brick retail volume (y = 0..4.45 m) and low-slope roof behind parapet
    addExtrudedPrism(push, WHITE_WALL, pts, 0, 4.45);
    addHippedRoofQuad(push, box, 0x878e94, 0x6c7378, pts, 4.45, 4.95, 0.10);

    const front = edgeFrame(pts, 1, 2); // 6.[address redacted] frontage
    // Stepped white brick parapet: wing height 5.17 m, central tablet 5.94 m (matching 2023 LiDAR!)
    placeOnEdge(front, WHITE_WALL, front.len + 0.06, 1.45, 0.26, 0.50, 4.45, 0.08);
    placeOnEdge(front, WHITE_WALL, front.len * 0.54, 0.77, 0.28, 0.50, 5.55, 0.09);
    // Corner & step parapet piers + dark coping mouldings
    for (const pt of [0.03, 0.23, 0.77, 0.97]) {
      const hPier = pt > 0.2 && pt < 0.8 ? 2.35 : 1.60;
      placeOnEdge(front, PARAPET_TRIM, 0.36, hPier, 0.32, pt, 3.80 + hPier * 0.5, 0.11);
    }
    placeOnEdge(front, COPING_DARK, front.len + 0.18, 0.12, 0.34, 0.50, 5.20, 0.12);
    placeOnEdge(front, COPING_DARK, front.len * 0.56, 0.12, 0.36, 0.50, 5.96, 0.13);

    // Post-supported street verandah awning (y = 3.28 m, depth = 3.10 m over footpath)
    const vDepth = 3.10;
    placeOnEdge(front, 0xe8eae6, front.len + 0.16, 0.14, vDepth, 0.50, 3.28, vDepth * 0.5);
    placeOnEdge(front, 0xffffff, front.len + 0.20, 0.44, 0.10, 0.50, 3.40, vDepth + 0.02);
    // 3 slim verandah posts at outer kerb edge (leaving footpath unobstructed)
    for (const pt of [0.06, 0.50, 0.94]) {
      const [px, pz] = front.at(pt, vDepth - 0.18);
      box(POST_DARK, 0.11, 3.28, 0.11, px, 1.64, pz);
    }
    // Verandah fascia sign: MACQUARIE CLOTHING / LADIES & MENS WEAR
    {
      const [sx, sz] = front.at(0.50, vDepth + 0.08);
      signBoard(
        ['MACQUARIE CLOTHING', 'LADIES & MENS WEAR'],
        { bg: '#ffffff', fg: '#13506b', border: '#13506b', w: 1024, h: 192 },
        front.len - 0.16,
        0.40,
        sx,
        3.40,
        sz,
        front.faceYaw
      );
    }

    // Ground-floor glazed retail shopfront: dark plinth, 2 display windows + central recessed door
    placeOnEdge(front, PLINTH_CHARCOAL, front.len - 0.08, 0.65, 0.12, 0.50, 0.325, 0.06);
    for (const wt of [0.23, 0.77]) {
      placeOnEdge(front, POST_DARK, 2.15, 2.25, 0.10, wt, 1.75, 0.08);
      placeOnEdge(front, 0x263844, 1.98, 1.85, 0.06, wt, 1.62, 0.11);
      placeOnEdge(front, TEAL_SIGN, 1.98, 0.28, 0.08, wt, 2.70, 0.12);
    }
    // Central recessed glass entry door
    placeOnEdge(front, POST_DARK, 1.35, 2.45, 0.12, 0.50, 1.225, 0.04);
    placeOnEdge(front, 0x2b3e4c, 1.12, 2.30, 0.06, 0.50, 1.18, 0.07);

    colliders.push(...sliceQuadColliders(pts, 3, 2.8));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. [address redacted] — NARROMINE MEN'S SHED (osm:183, Screenshots #37–#39)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const spec = NARROMINE_NW_DANDALOO_BUILDINGS[2];
    const pts = spec.pts;
    const CREAM_RENDER = 0xeee7d7;
    const CREAM_DARK = 0xd6ccb8;
    const WHITE_FASCIA = 0xf7f6f2;
    const ROLLER_GREY = 0x848c92;
    const NAVY_TRIM = 0x1d3557;

    // Extrude the surveyed 12-vertex L-shaped workshop complex to 4.64 m LiDAR median
    addExtrudedPrism(push, CREAM_RENDER, pts, 0, 4.64);
    // Low-profile roof deck cap
    addExtrudedPrism(push, 0x7b8288, pts, 4.64, 4.82);

    // Front Dandaloo Street projecting wing (edge 5->6: [-4770.5,-1023.5] to [-4771.6,-1015.6], len 7.98 m)
    const front = edgeFrame(pts, 5, 6);
    // Stepped horizontal mid-century parapet rising to 5.66 m LiDAR ridge
    placeOnEdge(front, CREAM_RENDER, front.len + 0.12, 1.02, 0.28, 0.50, 5.15, 0.08);
    placeOnEdge(front, CREAM_DARK, front.len + 0.22, 0.16, 0.36, 0.50, 5.60, 0.12);

    // Deep post-supported street canopy awning (y = 3.35 m, depth = 3.20 m)
    const cDepth = 3.20;
    placeOnEdge(front, 0xdce0dd, front.len + 0.18, 0.16, cDepth, 0.50, 3.35, cDepth * 0.5);
    placeOnEdge(front, WHITE_FASCIA, front.len + 0.24, 0.48, 0.10, 0.50, 3.48, cDepth + 0.02);
    // South return fascia on the canopy (#38)
    {
      const [rx, rz] = front.at(0.99, cDepth * 0.5);
      box(WHITE_FASCIA, 0.10, 0.48, cDepth, rx, 3.48, rz, front.yaw);
    }
    // 3 canopy support posts near kerb edge
    for (const pt of [0.06, 0.50, 0.94]) {
      const [px, pz] = front.at(pt, cDepth - 0.18);
      box(0x52585e, 0.12, 3.35, 0.12, px, 1.675, pz);
    }
    // Front canopy fascia sign: NARROMINE MENS SHED
    {
      const [sx, sz] = front.at(0.50, cDepth + 0.08);
      signBoard(
        ['NARROMINE MENS SHED'],
        { bg: '#f7f6f2', fg: '#1d3557', border: '#c0262c', w: 1024, h: 192 },
        front.len - 0.20,
        0.42,
        sx,
        3.48,
        sz,
        front.faceYaw
      );
    }

    // Ground-floor workshop windows & double glass entry doors on the projecting wing
    placeOnEdge(front, 0x5d6268, front.len - 0.08, 0.52, 0.12, 0.50, 0.26, 0.05);
    addSashWindow(box, front, 0.24, 0.85, 2.65, 2.10, { frameColour: WHITE_FASCIA, out: 0.08 });
    placeOnEdge(front, WHITE_FASCIA, 1.85, 2.55, 0.12, 0.68, 1.275, 0.08);
    placeOnEdge(front, 0x263844, 1.62, 2.35, 0.06, 0.68, 1.22, 0.11);

    // Recessed southern wing (edge 7->8: [-4777.9,-1016.5] to [-4779.5,-1005.4], len 11.21 m)
    const southWing = edgeFrame(pts, 7, 8);
    // Corrugated steel roller-shutter door bay + large Men's Shed community billboard (#37–#38)
    placeOnEdge(southWing, ROLLER_GREY, 3.40, 2.95, 0.14, 0.28, 1.475, 0.08);
    placeOnEdge(southWing, NAVY_TRIM, 3.56, 0.16, 0.18, 0.28, 2.98, 0.10);
    placeOnEdge(southWing, WHITE_FASCIA, 4.60, 1.85, 0.10, 0.72, 2.55, 0.10);
    {
      const [bx, bz] = southWing.at(0.72, 0.16);
      signBoard(
        ['NARROMINE MENS SHED', 'TUES & THURS 9AM - 3PM', 'COMMUNITY WORKSHOP'],
        { bg: '#ffffff', fg: '#1d3557', border: '#c0262c', w: 512, h: 256 },
        4.40,
        1.70,
        bx,
        2.55,
        bz,
        southWing.faceYaw
      );
    }

    // Tight quad colliders for the two main L-wing rectangles so the front footpath & forecourt stay clear
    colliders.push(
      ...sliceQuadColliders(
        [
          [-4778.2, -1024.5],
          [-4770.5, -1023.5],
          [-4771.6, -1015.6],
          [-4779.3, -1016.6],
        ],
        2,
        3.0
      ),
      ...sliceQuadColliders(
        [
          [-4811.4, -1028.6],
          [-4777.9, -1024.0],
          [-4779.5, -1005.4],
          [-4814.0, -1010.3],
        ],
        4,
        3.5
      )
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. [address redacted] — NARROMINE USMC (UNITED SERVICES MEMORIAL CLUB)
  //    (osm:184, 31.52 m Two-Storey Club, Screenshots #40–#43)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const spec = NARROMINE_NW_DANDALOO_BUILDINGS[3];
    const pts = spec.pts;
    const BUFF_BRICK = 0xd8c3a2;
    const BUFF_PIER = 0xc6ae8b;
    const ZINC_SCREEN = 0x9aa3ab;
    const ZINC_RIB = 0x768088;
    const DARK_BRONZE_GLASS = 0x1e2830;
    const PORTICO_WHITE = 0xf4f3ef;
    const PLANTER_BRICK = 0xc2a682;
    const FOLIAGE_GREEN = 0x3b6e34;
    const FOLIAGE_LIGHT = 0x4f8442;

    // Ground-floor cream/buff face-brick podium (y = 0..4.15 m)
    addExtrudedPrism(push, BUFF_BRICK, pts, 0, 4.15);
    // Upper-storey vertical-ribbed zincalume architectural screen mass (y = 4.15..8.25 m, matching 8.07 m LiDAR median)
    addExtrudedPrism(push, ZINC_SCREEN, pts, 4.15, 8.25);
    // Rooftop plant/clerestory ridge volume set back from the street (y = 8.25..9.41 m, matching 9.41 m LiDAR ridge)
    const [cx, cz] = polyCentre(pts);
    const roofPlantPts = pts.map(([x, z]) => [cx + (x - cx) * 0.55, cz + (z - cz) * 0.55]);
    addExtrudedPrism(push, 0x7e878e, roofPlantPts, 8.25, 9.41);

    // Dandaloo Street East Façade (edge 1->2: [-4767.5,-1036.8] to [-4762.4,-1067.9], length 31.52 m)
    const front = edgeFrame(pts, 1, 2);

    // Continuous white/light-grey horizontal inter-storey band (y = 4.12 m) & top parapet coping (y = 8.32 m)
    placeOnEdge(front, PORTICO_WHITE, front.len + 0.20, 0.24, 0.24, 0.50, 4.12, 0.10);
    placeOnEdge(front, PORTICO_WHITE, front.len + 0.26, 0.26, 0.30, 0.50, 8.32, 0.12);

    // Upper-storey vertical zincalume architectural louver ribs every 0.85 m across the 31.52 m façade
    const ribCount = Math.floor(front.len / 0.85);
    for (let i = 0; i <= ribCount; i++) {
      const rt = i / ribCount;
      placeOnEdge(front, ZINC_RIB, 0.08, 4.02, 0.14, rt, 6.20, 0.08);
    }

    // 6 tall upper-storey dark-bronze vertical slot window bays (y = 4.55..7.75 m)
    for (const wt of [0.10, 0.24, 0.38, 0.52, 0.68, 0.84]) {
      placeOnEdge(front, 0x2c343b, 1.32, 3.25, 0.16, wt, 6.18, 0.10);
      placeOnEdge(front, DARK_BRONZE_GLASS, 1.12, 3.05, 0.10, wt, 6.18, 0.14);
      placeOnEdge(front, ZINC_RIB, 1.16, 0.08, 0.18, wt, 6.18, 0.15);
    }

    // Ground-floor cream-brick colonnade piers & dark-tinted bistro/lounge windows
    for (const pt of [0.03, 0.16, 0.30, 0.44, 0.58, 0.68, 0.96]) {
      placeOnEdge(front, BUFF_PIER, 0.55, 4.05, 0.22, pt, 2.025, 0.09);
    }
    for (const wt of [0.095, 0.23, 0.37, 0.51]) {
      placeOnEdge(front, 0x2b333a, 3.25, 2.35, 0.12, wt, 2.15, 0.07);
      placeOnEdge(front, DARK_BRONZE_GLASS, 3.05, 2.15, 0.08, wt, 2.15, 0.10);
    }

    // Continuous ground-floor brick planter boxes overflowing with lush green shrubs (t = 0.04..0.60, frames #40–#42)
    placeOnEdge(front, PLANTER_BRICK, front.len * 0.56, 0.88, 0.95, 0.32, 0.44, 0.52);
    placeOnEdge(front, 0xd8cdb8, front.len * 0.57, 0.10, 1.04, 0.32, 0.90, 0.52);
    for (let k = 0; k < 12; k++) {
      const kt = 0.06 + (k / 11) * 0.52;
      placeOnEdge(
        front,
        k % 2 === 0 ? FOLIAGE_GREEN : FOLIAGE_LIGHT,
        1.35,
        0.62 + (k % 3) * 0.12,
        0.78,
        kt,
        1.18,
        0.52
      );
    }

    // Projecting Northern Entry Portico / Porte-Cochère (t = 0.66..0.94, length 8.8 m, depth 3.4 m, frames #41–#43)
    const pDepth = 3.40;
    const pLen = front.len * 0.28;
    const pT = 0.80;
    // Flat portico roof & broad crisp white fascia reaching 4.41 m (matching LiDAR 4.41 m eave!)
    placeOnEdge(front, 0x7c848a, pLen, 0.22, pDepth, pT, 3.85, pDepth * 0.5);
    placeOnEdge(front, PORTICO_WHITE, pLen + 0.16, 0.72, 0.18, pT, 4.05, pDepth);
    // North & south return fascias of the portico
    for (const rt of [0.66, 0.94]) {
      placeOnEdge(front, PORTICO_WHITE, 0.18, 0.72, pDepth, rt, 4.05, pDepth * 0.5);
    }
    // 4 square cream-brick portico columns + white capitals
    for (const ct of [0.67, 0.755, 0.845, 0.93]) {
      placeOnEdge(front, BUFF_BRICK, 0.52, 3.70, 0.52, ct, 1.85, pDepth - 0.30);
      placeOnEdge(front, PORTICO_WHITE, 0.62, 0.18, 0.62, ct, 3.62, pDepth - 0.30);
    }
    // Glazed automatic double entry doors & tiled portico entry steps/ramp
    placeOnEdge(front, PORTICO_WHITE, 3.20, 2.95, 0.16, pT, 1.475, 0.10);
    placeOnEdge(front, DARK_BRONZE_GLASS, 2.85, 2.75, 0.10, pT, 1.42, 0.14);
    placeOnEdge(front, 0xc8c2b6, pLen + 0.20, 0.18, pDepth + 0.30, pT, 0.09, pDepth * 0.5);

    // Portico fascia sign: NARROMINE USMC / UNITED SERVICES MEMORIAL CLUB
    {
      const [sx, sz] = front.at(pT, pDepth + 0.11);
      signBoard(
        ['NARROMINE USMC', 'UNITED SERVICES MEMORIAL CLUB'],
        { bg: '#f4f3ef', fg: '#1b263b', border: '#b5985a', w: 1024, h: 192 },
        pLen - 0.30,
        0.58,
        sx,
        4.05,
        sz,
        front.faceYaw
      );
    }

    // Three White Flagpoles (h = 8.20 m) standing along the forecourt in front of the portico (#41–#43)
    for (const [ft, flagTopColour, flagBotColour] of [
      [0.69, 0x1d3a8a, 0xc0262c], // Australian Ensign
      [0.78, 0x1d3a8a, 0xffffff], // NSW State Ensign
      [0.87, 0x111111, 0xc0262c], // Memorial / Aboriginal Ensign
    ]) {
      const [fx, fz] = front.at(ft, pDepth + 0.55);
      box(0xf0f0ee, 0.10, 8.20, 0.10, fx, 4.10, fz);
      box(flagTopColour, 0.04, 0.44, 1.35, fx, 7.65, fz + 0.65, front.yaw);
      box(flagBotColour, 0.04, 0.44, 1.35, fx, 7.21, fz + 0.65, front.yaw);
    }

    // Tall Black Vertical Blade Sign (t = 0.61, y = 2.0..6.8 m, frames #40–#42)
    {
      const [bx, bz] = front.at(0.61, 1.45);
      box(0x181a1d, 0.18, 4.60, 1.25, bx, 4.40, bz, front.yaw);
      box(0x52585e, 0.14, 2.10, 0.14, bx, 1.05, bz);
    }

    colliders.push(...sliceQuadColliders(pts, 5, 3.0));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. [address redacted] — SINGLE-STOREY RED-BRICK HIPPED COTTAGE
  //    (osm:185, Screenshot #44)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const spec = NARROMINE_NW_DANDALOO_BUILDINGS[4];
    const pts = spec.pts;
    const COTTAGE_BRICK = 0x9c4836;
    const ROOF_GALV = 0x8a9296;
    const CREAM_TRIM = 0xf2ede0;

    // Single-storey red-brick cottage walls (y = 0..3.38 m LiDAR eave) & hipped roof (5.86 m LiDAR ridge)
    addExtrudedPrism(push, COTTAGE_BRICK, pts, 0, 3.38);
    addHippedRoofQuad(push, box, ROOF_GALV, 0x6e767a, pts, 3.38, 5.86, 0.32);

    // Red-brick chimney stack on the cottage roof
    box(COTTAGE_BRICK, 0.65, 1.45, 0.65, -4768.2, 5.45, -1075.2);

    const front = edgeFrame(pts, 1, 2); // 7.[address redacted] frontage
    // Cream timber eave fascia
    placeOnEdge(front, CREAM_TRIM, front.len + 0.30, 0.18, 0.22, 0.50, 3.32, 0.12);

    // Front verandah porch (depth = 1.95 m, y = 2.75 m) on 4 cream timber posts
    const vDepth = 1.95;
    placeOnEdge(front, ROOF_GALV, front.len * 0.88, 0.12, vDepth, 0.50, 2.78, vDepth * 0.5);
    placeOnEdge(front, CREAM_TRIM, front.len * 0.90, 0.18, 0.10, 0.50, 2.82, vDepth);
    for (const pt of [0.10, 0.37, 0.63, 0.90]) {
      const [px, pz] = front.at(pt, vDepth - 0.12);
      box(CREAM_TRIM, 0.11, 2.78, 0.11, px, 1.39, pz);
    }

    // Central timber cottage door + 2 flanking white multi-pane sash windows
    placeOnEdge(front, CREAM_TRIM, 1.12, 2.25, 0.10, 0.50, 1.125, 0.06);
    placeOnEdge(front, 0x5c3c28, 0.92, 2.12, 0.06, 0.50, 1.08, 0.09);
    for (const wt of [0.22, 0.78]) {
      addSashWindow(box, front, wt, 0.92, 2.28, 1.18, { frameColour: CREAM_TRIM, out: 0.07 });
    }

    // Low red-brick & white-pier front boundary fence along the footpath edge (#44)
    const fOut = 2.35;
    placeOnEdge(front, COTTAGE_BRICK, front.len * 0.38, 0.78, 0.22, 0.21, 0.39, fOut);
    placeOnEdge(front, COTTAGE_BRICK, front.len * 0.38, 0.78, 0.22, 0.79, 0.39, fOut);
    for (const pt of [0.04, 0.39, 0.61, 0.96]) {
      placeOnEdge(front, CREAM_TRIM, 0.34, 0.98, 0.34, pt, 0.49, fOut);
    }

    colliders.push(...sliceQuadColliders(pts, 3, 2.8));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. [address redacted] — NARROMINE BAPTIST CHURCH
  //    (Replaces generic FILL_SHOPS box, Screenshots #47–#48)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const spec = NARROMINE_NW_DANDALOO_BUILDINGS[5];
    const pts = spec.pts;
    const CHURCH_BRICK = 0x9b4635;
    const GABLE_WHITE = 0xf3f0e6;
    const ROOF_GALV = 0x7e868c;
    const HEDGE_GREEN = 0x3d6b33;
    const HEDGE_TOP = 0x4e7f40;

    // Exposed red-brick lower church hall walls (y = 0..3.15 m)
    addExtrudedPrism(push, CHURCH_BRICK, pts, 0, 3.15);
    // Street-facing white upper gable roof (y = 3.15..6.15 m)
    addStreetFacingGableRoof(push, box, ROOF_GALV, GABLE_WHITE, 0x3b4046, pts, 3.15, 6.15);

    const front = edgeFrame(pts, 1, 2); // 9.31 m east gable front
    // Central white-framed 3-light window on the lower red-brick wall (#47–#48)
    addSashWindow(box, front, 0.50, 0.95, 2.45, 2.35, { frameColour: GABLE_WHITE, out: 0.08 });

    // Horizontal sign across the white upper gable end: NARROMINE BAPTIST CHURCH + apex cross
    placeOnEdge(front, 0xffffff, 5.80, 0.68, 0.08, 0.50, 3.72, 0.14);
    placeOnEdge(front, 0x8c3b2e, 0.10, 0.68, 0.10, 0.50, 5.25, 0.15);
    placeOnEdge(front, 0x8c3b2e, 0.42, 0.10, 0.10, 0.50, 5.35, 0.15);
    {
      const [sx, sz] = front.at(0.50, 0.20);
      signBoard(
        ['NARROMINE BAPTIST CHURCH'],
        { bg: '#ffffff', fg: '#1d2d44', border: '#8c3b2e', w: 1024, h: 160 },
        5.65,
        0.60,
        sx,
        3.72,
        sz,
        front.faceYaw
      );
    }

    // Covered entry porch / porte-cochère on the northern (right) side of the church (#47–#48)
    placeOnEdge(front, GABLE_WHITE, 3.20, 0.16, 4.20, 0.02, 2.95, -1.20);
    for (const offOut of [-3.0, 0.6]) {
      const [px, pz] = front.at(-0.12, offOut);
      box(GABLE_WHITE, 0.14, 2.95, 0.14, px, 1.475, pz);
    }

    // Manicured green front boundary hedge along the footpath alignment (outward = 4.2 m) + white noticeboard
    placeOnEdge(front, HEDGE_GREEN, front.len + 1.8, 1.15, 0.95, 0.55, 0.575, 4.20);
    placeOnEdge(front, HEDGE_TOP, front.len + 1.7, 0.18, 0.88, 0.55, 1.18, 4.20);
    // White lawn noticeboard inside the hedge
    {
      const [nx, nz] = front.at(0.28, 2.85);
      box(GABLE_WHITE, 0.10, 1.75, 0.10, nx - 0.55, 0.875, nz);
      box(GABLE_WHITE, 0.10, 1.75, 0.10, nx + 0.55, 0.875, nz);
      box(GABLE_WHITE, 1.35, 0.85, 0.10, nx, 1.35, nz, front.yaw);
    }

    colliders.push(...sliceQuadColliders(pts, 3, 3.0));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. [address redacted] — NARROMINE BATTLERS MATE
  //    (Replaces generic FILL_SHOPS box, Screenshots #48–#49)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const spec = NARROMINE_NW_DANDALOO_BUILDINGS[6];
    const pts = spec.pts;
    const WHITE_WALL = 0xf4f3ee;
    const FOREST_GREEN = 0x235337;
    const SHADECLOTH_GREEN = 0x2b4c36;
    const ROOF_GALV = 0x848c90;

    // White-painted charity shop & nursery hall (y = 0..3.35 m) & gable roof with dark-green bargeboards (5.65 m)
    addExtrudedPrism(push, WHITE_WALL, pts, 0, 3.35);
    addStreetFacingGableRoof(push, box, ROOF_GALV, WHITE_WALL, FOREST_GREEN, pts, 3.35, 5.65);

    const front = edgeFrame(pts, 1, 2); // 9.[address redacted] frontage
    // Post-supported front verandah awning (y = 3.05 m, depth = 2.60 m) with dark-green & white fascia
    const vDepth = 2.60;
    placeOnEdge(front, ROOF_GALV, front.len * 0.92, 0.12, vDepth, 0.50, 3.05, vDepth * 0.5);
    placeOnEdge(front, FOREST_GREEN, front.len * 0.94, 0.42, 0.10, 0.50, 3.16, vDepth + 0.02);
    for (const pt of [0.08, 0.50, 0.92]) {
      const [px, pz] = front.at(pt, vDepth - 0.14);
      box(0x8a9298, 0.11, 3.05, 0.11, px, 1.525, pz);
    }
    // Verandah fascia sign: NARROMINE BATTLERS MATE
    {
      const [sx, sz] = front.at(0.50, vDepth + 0.08);
      signBoard(
        ['NARROMINE BATTLERS MATE', 'CHARITY SHOP & NURSERY'],
        { bg: '#235337', fg: '#ffffff', border: '#f4d068', w: 1024, h: 192 },
        front.len * 0.88,
        0.38,
        sx,
        3.16,
        sz,
        front.faceYaw
      );
    }

    // Ground-floor charity shop windows, entry door, and red/yellow charity sign panel
    placeOnEdge(front, FOREST_GREEN, 1.25, 2.25, 0.10, 0.50, 1.125, 0.06);
    for (const wt of [0.22, 0.78]) {
      addSashWindow(box, front, wt, 0.88, 2.25, 1.65, { frameColour: FOREST_GREEN, out: 0.07 });
    }
    placeOnEdge(front, 0xc82829, 2.20, 0.65, 0.08, 0.22, 2.68, 0.10);

    // Galvanised chain-link & green shadecloth plant nursery fence + plant tables on the front/south side (#48–#49)
    placeOnEdge(front, SHADECLOTH_GREEN, 4.20, 1.80, 0.12, 0.88, 0.90, 3.10);
    placeOnEdge(front, 0x9aa2a8, 4.28, 0.08, 0.16, 0.88, 1.84, 3.10);
    // Nursery plant benches with green foliage trays
    placeOnEdge(front, 0x6b5a45, 2.80, 0.75, 0.95, 0.82, 0.375, 1.85);
    placeOnEdge(front, 0x3f7536, 2.65, 0.38, 0.82, 0.82, 0.92, 1.85);

    colliders.push(...sliceQuadColliders(pts, 3, 3.0));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. 38–[address redacted] — AQUA WEST PUMPING & IRRIGATION SPECIALISTS
  //    (Replaces generic FILL_SHOPS box, Screenshot #50)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const spec = NARROMINE_NW_DANDALOO_BUILDINGS[7];
    const pts = spec.pts;
    const WHITE_WALL = 0xf5f6f8;
    const ROYAL_BLUE = 0x124e96;
    const AQUA_TEAL = 0x1b8a6b;
    const ALUM_FRAME = 0xb8c2c8;
    const SHOWROOM_GLASS = 0x223646;

    // Main white showroom hall (y = 0..4.95 m wing parapet) & roof deck
    addExtrudedPrism(push, WHITE_WALL, pts, 0, 4.95);
    addHippedRoofQuad(push, box, 0x828a90, 0x687076, pts, 4.85, 5.35, 0.10);

    const front = edgeFrame(pts, 1, 2); // 12.[address redacted] frontage
    // Stepped white parapet with peaked central triangular gable (apex = 6.35 m, frame #50)
    {
      const shape = new THREE.Shape();
      const hw = front.len * 0.5;
      shape.moveTo(-hw, 4.80);
      shape.lineTo(-hw, 5.10);
      shape.lineTo(-hw * 0.46, 5.10);
      shape.lineTo(0, 6.35);
      shape.lineTo(hw * 0.46, 5.10);
      shape.lineTo(hw, 5.10);
      shape.lineTo(hw, 4.80);
      shape.closePath();
      const g = new THREE.ExtrudeGeometry(shape, { depth: 0.26, bevelEnabled: false });
      g.translate(0, 0, -0.13);
      g.rotateY(front.yaw);
      const [px, pz] = front.at(0.50, 0.08);
      g.translate(px, 0, pz);
      g.computeVertexNormals();
      push(WHITE_WALL, g);
    }
    // Upper gable logo & title board: aqua west
    placeOnEdge(front, WHITE_WALL, 4.60, 0.88, 0.08, 0.50, 5.35, 0.22);
    {
      const [gx, gz] = front.at(0.50, 0.28);
      signBoard(
        ['aqua west', 'IRRIGATION · FILTRATION · PUMPING'],
        { bg: '#f5f6f8', fg: '#124e96', border: '#1b8a6b', w: 1024, h: 220 },
        4.45,
        0.82,
        gx,
        5.35,
        gz,
        front.faceYaw
      );
    }

    // Cantilevered street awning (y = 3.28 m, depth = 3.20 m) with bright ROYAL-BLUE fascia (#50)
    const aDepth = 3.20;
    placeOnEdge(front, 0xdce2e6, front.len + 0.16, 0.16, aDepth, 0.50, 3.28, aDepth * 0.5);
    placeOnEdge(front, ROYAL_BLUE, front.len + 0.24, 0.54, 0.12, 0.50, 3.42, aDepth + 0.02);
    // South & north return fascias in royal blue (`PIPES · PUMPS · TANKS` on south return)
    for (const rt of [0.01, 0.99]) {
      placeOnEdge(front, ROYAL_BLUE, 0.12, 0.54, aDepth, rt, 3.42, aDepth * 0.5);
    }
    {
      const [sx, sz] = front.at(0.50, aDepth + 0.10);
      signBoard(
        ['PUMPING & IRRIGATION SPECIALISTS'],
        { bg: '#124e96', fg: '#ffffff', border: '#ffffff', w: 1024, h: 160 },
        front.len - 0.24,
        0.48,
        sx,
        3.42,
        sz,
        front.faceYaw
      );
    }

    // Aluminium-framed glass showroom frontage (4 wide glazed bays + double glass doors)
    placeOnEdge(front, 0x3b4248, front.len - 0.10, 0.45, 0.12, 0.50, 0.225, 0.06);
    for (const bt of [0.15, 0.38, 0.62, 0.85]) {
      placeOnEdge(front, ALUM_FRAME, 2.55, 2.55, 0.10, bt, 1.68, 0.08);
      placeOnEdge(front, SHOWROOM_GLASS, 2.38, 2.35, 0.06, bt, 1.68, 0.11);
      placeOnEdge(front, ROYAL_BLUE, 2.38, 0.26, 0.08, bt, 2.82, 0.12);
    }

    colliders.push(...sliceQuadColliders(pts, 3, 3.2));
  }

  if (standalone) {
    for (const [colour, geos] of buckets.entries()) {
      const merged = mergeGeometries(geos);
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(
        merged,
        new THREE.MeshLambertMaterial({ color: colour, side: THREE.DoubleSide })
      );
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
    }
  }

  return {
    group,
    colliders,
    spots,
    stats: {
      buildingCount: NARROMINE_NW_DANDALOO_BUILDINGS.length,
      suppressedOsmCount: NARROMINE_NW_DANDALOO_INTEGRATION_SPEC.suppressedOsmBuildingIndices.length,
      suppressedFillShopCount: NARROMINE_NW_DANDALOO_INTEGRATION_SPEC.suppressedFillShopNames.length,
      geometryCount,
    },
    buildings: NARROMINE_NW_DANDALOO_BUILDINGS,
    integrationSpec: NARROMINE_NW_DANDALOO_INTEGRATION_SPEC,
  };
}
