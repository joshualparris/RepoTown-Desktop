// Three.js 3D architectural and historical reconstruction of the Narromine
// Aviation Museum & Aerodrome Precinct (Tom Perry Drive / Mitchell Highway A32,
// Lot 122 DP 1126499, Narromine LEP 2011 Schedule 5 Item I12).
//
// Supports both:
//   1) Standalone mode: `buildNarromineAviationPrecinct()` returns
//      `{ group, colliders, spots, stats, heritage, cadastralLots, buildings, exhibits, access, integrationSpec }`
//      with geometries merged by material colour.
//   2) Integrated mode: `buildNarromineAviationPrecinct({ box, push, strip, flatPoly, plane, boardTexture, colliders, spots })`
//      feeds directly into `src/world/narromine.js`'s spatial tile batcher.
import * as THREE from 'three';
import {
  NARROMINE_AVIATION_HERITAGE,
  NARROMINE_AVIATION_CADASTRAL_LOTS,
  NARROMINE_AVIATION_BUILDINGS,
  NARROMINE_AVIATION_EXHIBITS,
  NARROMINE_AVIATION_ACCESS,
  NARROMINE_AVIATION_INTEGRATION_SPEC,
} from './narromine-aviation-evidence.js';

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

function sliceSegmentColliders(a, b, thickness = 0.45, stepM = 2.0) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.ceil(len / stepM));
  const half = thickness * 0.5;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    const x0 = a[0] + (b[0] - a[0]) * t0;
    const z0 = a[1] + (b[1] - a[1]) * t0;
    const x1 = a[0] + (b[0] - a[0]) * t1;
    const z1 = a[1] + (b[1] - a[1]) * t1;
    out.push({
      x0: Math.min(x0, x1) - half,
      x1: Math.max(x0, x1) + half,
      z0: Math.min(z0, z1) - half,
      z1: Math.max(z0, z1) + half,
    });
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

function addTriFace(push, colour, p0, p1, p2) {
  const ax = p1[0] - p0[0];
  const az = p1[2] - p0[2];
  const bx = p2[0] - p0[0];
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

function addHippedRoof4(push, box, roofColour, ridgeColour, pts, eaveY, ridgeY, overhang = 0.35) {
  const cx = (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) * 0.25;
  const cz = (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) * 0.25;
  const expanded = pts.map(([x, z]) => {
    const dx = x - cx;
    const dz = z - cz;
    const d = Math.hypot(dx, dz) || 1;
    return [x + (dx / d) * overhang, z + (dz / d) * overhang];
  });
  const [c0, c1, c2, c3] = expanded.map(([x, z]) => [x, eaveY, z]);
  const m30 = [(c3[0] + c0[0]) * 0.5, (c3[2] + c0[2]) * 0.5];
  const m12 = [(c1[0] + c2[0]) * 0.5, (c1[2] + c2[2]) * 0.5];
  const r0 = [m30[0] * 0.65 + cx * 0.35, ridgeY, m30[1] * 0.65 + cz * 0.35];
  const r1 = [m12[0] * 0.65 + cx * 0.35, ridgeY, m12[1] * 0.65 + cz * 0.35];
  addTriFace(push, roofColour, c3, c0, r0);
  addQuadFace(push, roofColour, c0, c1, r1, r0);
  addTriFace(push, roofColour, c1, c2, r1);
  addQuadFace(push, roofColour, c2, c3, r0, r1);

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

function addEdgeWindows(box, frameColour, glassColour, sillColour, a, b, polyCenter, count, yMid, winW, winH) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  const mx = (a[0] + b[0]) * 0.5;
  const mz = (a[1] + b[1]) * 0.5;
  let nx = -uz;
  let nz = ux;
  if ((mx - polyCenter[0]) * nx + (mz - polyCenter[1]) * nz < 0) {
    nx = -nx;
    nz = -nz;
  }
  const yaw = -Math.atan2(dz, dx);
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const wx = a[0] + dx * t;
    const wz = a[1] + dz * t;
    box(frameColour, winW + 0.16, winH + 0.16, 0.08, wx + nx * 0.05, yMid, wz + nz * 0.05, yaw);
    box(glassColour, winW, winH, 0.06, wx + nx * 0.09, yMid, wz + nz * 0.09, yaw);
    box(sillColour, winW + 0.24, 0.09, 0.14, wx + nx * 0.09, yMid - winH * 0.5 - 0.04, wz + nz * 0.09, yaw);
    box(frameColour, winW, 0.05, 0.08, wx + nx * 0.11, yMid, wz + nz * 0.11, yaw);
  }
}

// ── Exhibit 1: 1903 Wright Flyer Full-Scale Replica (VH-XWF) ────────────────
function buildWrightFlyerExhibit(box, push, cx, cz, yaw) {
  const baseY = 2.35; // Elevated on central steel display pylons so visitors can walk underneath & around
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const local = (lx, ly, lz, ry = 0) => [
    cx + lx * cos - lz * sin,
    ly,
    cz + lx * sin + lz * cos,
    yaw + ry,
  ];
  const place = (c, w, h, d, lx, ly, lz, ry = 0) => {
    const [wx, wy, wz, wry] = local(lx, ly, lz, ry);
    box(c, w, h, d, wx, wy, wz, wry);
  };

  // Display dais & twin vertical steel mounting stanchions (compact 1.6m × 1.1m base)
  place(0x2b4257, 2.2, 0.12, 1.4, 0, 0.12, 0);
  place(0xd4af37, 2.3, 0.04, 1.5, 0, 0.07, 0);
  place(0x4a525a, 0.12, baseY - 0.1, 0.12, -0.65, baseY * 0.5, 0);
  place(0x4a525a, 0.12, baseY - 0.1, 0.12, 0.65, baseY * 0.5, 0);

  // Lower & upper doped-linen biplane wings (12.3 m wingspan × 1.98 m chord)
  const wingSpan = 12.3;
  const wingChord = 1.98;
  const gap = 1.65;
  const linen = 0xf2ead7;
  const spruce = 0x8b5a2b;
  place(linen, wingSpan, 0.06, wingChord, 0, baseY, 0);
  place(linen, wingSpan, 0.06, wingChord, 0, baseY + gap, 0);
  // Leading & trailing spruce wing spars
  for (const wy of [baseY, baseY + gap]) {
    place(spruce, wingSpan + 0.1, 0.08, 0.07, 0, wy, -wingChord * 0.46);
    place(spruce, wingSpan + 0.1, 0.08, 0.07, 0, wy, wingChord * 0.46);
  }
  // 9 pairs of vertical interplane spruce struts
  for (let i = -4; i <= 4; i++) {
    const sx = i * 1.45;
    place(spruce, 0.05, gap, 0.05, sx, baseY + gap * 0.5, -wingChord * 0.36);
    place(spruce, 0.05, gap, 0.05, sx, baseY + gap * 0.5, wingChord * 0.36);
  }

  // Forward twin-boom undercarriage skids & biplane canard elevator (3.6 m span)
  for (const sx of [-0.55, 0.55]) {
    place(spruce, 0.07, 0.07, 4.2, sx, baseY - 0.35, -1.35);
    place(spruce, 0.06, 0.42, 0.06, sx, baseY - 0.16, -3.2);
  }
  place(linen, 3.6, 0.04, 0.75, 0, baseY - 0.1, -3.25);
  place(linen, 3.6, 0.04, 0.75, 0, baseY + 0.45, -3.25);
  place(spruce, 0.05, 0.55, 0.05, -1.5, baseY + 0.18, -3.25);
  place(spruce, 0.05, 0.55, 0.05, 1.5, baseY + 0.18, -3.25);

  // Rear twin outriggers & double vertical rudder
  for (const sx of [-0.55, 0.55]) {
    place(spruce, 0.06, 0.06, 3.1, sx, baseY + 0.35, 1.45);
    place(spruce, 0.06, 0.06, 3.1, sx, baseY + gap - 0.2, 1.45);
  }
  place(linen, 0.05, 1.45, 0.68, -0.28, baseY + 0.85, 2.85);
  place(linen, 0.05, 1.45, 0.68, 0.28, baseY + 0.85, 2.85);

  // Horizontal 4-cylinder Wright engine & twin pusher propellers (2.5 m blades)
  place(0x2f3438, 0.55, 0.38, 0.72, 0.38, baseY + 0.22, 0.05);
  for (const px of [-1.45, 1.45]) {
    place(0x5c646b, 0.08, 0.08, 0.85, px, baseY + 0.72, 0.85);
    place(spruce, 2.5, 0.18, 0.05, px, baseY + 0.72, 1.28, 0);
  }
}

// ── Exhibit 2: 1930s Corben Super Ace (VH-UXP) Parasol Monoplane ────────────
function buildCorbenSuperAceExhibit(box, cx, cz, yaw) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const place = (c, w, h, d, lx, ly, lz, ry = 0) => {
    const wx = cx + lx * cos - lz * sin;
    const wz = cz + lx * sin + lz * cos;
    box(c, w, h, d, wx, ly, wz, yaw + ry);
  };
  const crimson = 0xb52b2b;
  const silver = 0xd8dde2;
  const dark = 0x25292e;

  // Display barrier & floor mat
  place(0x374754, 7.6, 0.03, 5.4, 0, 0.065, 0);
  // Fuselage & nose cowling
  place(crimson, 0.78, 0.82, 4.4, 0, 1.05, 0.2);
  place(silver, 0.72, 0.76, 1.15, 0, 1.08, -2.25);
  // 2-blade tractor propeller
  place(0x5c4028, 1.75, 0.14, 0.05, 0, 1.12, -2.88);
  // High parasol wing (8.2 m span × 1.35 m chord) with crimson sunburst stripe
  place(silver, 8.2, 0.08, 1.35, 0, 2.02, -0.35);
  place(crimson, 7.8, 0.09, 0.45, 0, 2.03, -0.55);
  // Cabane & lift struts
  for (const s of [-1, 1]) {
    place(dark, 0.05, 1.05, 0.05, s * 0.35, 1.52, -0.45);
    place(dark, 0.06, 1.35, 0.06, s * 1.35, 1.45, -0.35);
    // Main landing gear legs & tyres
    place(dark, 0.07, 0.75, 0.07, s * 0.65, 0.55, -1.15);
    place(0x1c1e21, 0.18, 0.48, 0.48, s * 0.78, 0.29, -1.15);
  }
  // Tailplane & vertical fin
  place(crimson, 2.3, 0.06, 0.65, 0, 1.12, 2.25);
  place(crimson, 0.07, 0.95, 0.78, 0, 1.48, 2.22);
}

// ── Exhibit 3: Rolls-Royce Merlin Mk 25 V12 Aero Engine Stand ───────────────
function buildMerlinEngineExhibit(box, cx, cz, yaw) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const place = (c, w, h, d, lx, ly, lz, ry = 0) => {
    const wx = cx + lx * cos - lz * sin;
    const wz = cz + lx * sin + lz * cos;
    box(c, w, h, d, wx, ly, wz, yaw + ry);
  };
  // Heavy tubular steel display cradle
  place(0x2b4257, 1.35, 0.14, 2.35, 0, 0.13, 0);
  place(0x4a5560, 0.95, 0.75, 1.85, 0, 0.55, 0);
  // Crankcase, 60-degree V12 cylinder banks, supercharger & reduction gear
  place(0x1f2326, 0.68, 0.58, 1.65, 0, 1.15, -0.05);
  place(0x2d3238, 0.32, 0.36, 1.35, -0.24, 1.42, -0.05);
  place(0x2d3238, 0.32, 0.36, 1.35, 0.24, 1.42, -0.05);
  // Brass/copper 6-stub exhaust manifolds on each bank
  for (let i = 0; i < 6; i++) {
    const lz = -0.58 + i * 0.21;
    place(0xb8863b, 0.14, 0.08, 0.11, -0.42, 1.44, lz);
    place(0xb8863b, 0.14, 0.08, 0.11, 0.42, 1.44, lz);
  }
  // Rear supercharger volute & front propeller reduction housing
  place(0x889098, 0.62, 0.62, 0.38, 0, 1.16, 0.92);
  place(0x7c848c, 0.42, 0.44, 0.45, 0, 1.22, -1.02);
  place(0xc8cfd6, 0.16, 0.16, 0.32, 0, 1.24, -1.32);
}

// ── Exhibit 4: Outdoor CAC CA-27 Sabre Mk 32 (A94-915) Gate Guardian ────────
function buildSabreGateGuardian(box, push, plane, boardTexture, cx, cz, yaw) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const place = (c, w, h, d, lx, ly, lz, ry = 0) => {
    const wx = cx + lx * cos - lz * sin;
    const wz = cz + lx * sin + lz * cos;
    box(c, w, h, d, wx, ly, wz, yaw + ry);
  };

  // Stepped circular/octagonal concrete memorial base & lawn plinth
  const baseGeo = new THREE.CylinderGeometry(3.1, 3.4, 0.28, 12);
  baseGeo.translate(cx, 0.18, cz);
  push(0xc9c3b6, baseGeo);
  const innerGeo = new THREE.CylinderGeometry(1.6, 1.9, 0.45, 12);
  innerGeo.translate(cx, 0.52, cz);
  push(0x9a968e, innerGeo);

  // Raked steel mounting pylon supporting the Sabre at y = 2.55 m (eye-level viewing height)
  place(0x3d4852, 0.36, 1.95, 0.55, 0, 1.55, 0.25);
  place(0x2b343b, 0.85, 0.16, 1.25, 0, 2.45, 0.15);

  const jetY = 2.72;
  const silver = 0xd2d7dc;
  const polished = 0xe6ebf0;
  const navy = 0x1b3b73;
  const red = 0xc8242b;
  const canopyGlass = 0x35566e;

  // Main Sabre fuselage (11.4 m length) with nose air intake & tailpipe
  place(silver, 1.32, 1.28, 8.6, 0, jetY, 0);
  place(polished, 1.15, 1.12, 2.1, 0, jetY + 0.12, -5.1);
  // Dark nose intake aperture & radar lip
  place(0x1a1e22, 0.78, 0.68, 0.25, 0, jetY + 0.10, -6.12);
  place(red, 0.96, 0.86, 0.22, 0, jetY + 0.11, -5.98);
  // Rear exhaust tailcone
  place(0x52585e, 1.05, 1.05, 1.4, 0, jetY - 0.08, 4.8);
  // Bubble cockpit canopy & anti-glare olive nose panel
  place(0x3a4638, 0.75, 0.08, 1.85, 0, jetY + 0.68, -3.55);
  place(canopyGlass, 0.88, 0.62, 2.45, 0, jetY + 0.88, -1.65);
  place(silver, 0.78, 0.42, 2.6, 0, jetY + 0.74, 0.85);

  // 35-degree swept wings (11.3 m total wingspan) + underwing drop tanks
  for (const s of [-1, 1]) {
    place(silver, 5.2, 0.14, 1.85, s * 2.85, jetY - 0.12, 0.55, s * 0.52);
    // Wingtip red flash
    place(red, 0.55, 0.16, 1.35, s * 5.25, jetY - 0.12, 1.75, s * 0.52);
    // RAAF wing roundel accent
    place(navy, 0.75, 0.17, 0.75, s * 3.4, jetY - 0.11, 0.85, s * 0.52);
    place(red, 0.32, 0.18, 0.32, s * 3.4, jetY - 0.10, 0.85, s * 0.52);
    // Underwing drop tank
    place(silver, 0.42, 0.42, 2.95, s * 2.55, jetY - 0.58, 0.45);
    place(red, 0.44, 0.44, 0.45, s * 2.55, jetY - 0.58, -0.88);
  }

  // Swept horizontal tailplane & tall swept vertical tail fin with RAAF fin flash
  place(silver, 4.1, 0.11, 1.15, 0, jetY + 0.05, 4.55);
  place(silver, 0.16, 2.35, 1.85, 0, jetY + 1.55, 4.25);
  place(red, 0.18, 0.42, 1.45, 0, jetY + 2.45, 4.35);
  place(0xf5f5f0, 0.18, 0.35, 1.35, 0, jetY + 2.08, 4.35);
  place(navy, 0.18, 0.35, 1.35, 0, jetY + 1.72, 4.35);

  if (boardTexture && plane) {
    const tex = boardTexture(
      ['CAC CA-27 SABRE Mk 32 · A94-915', 'RAAF AVON-SABRE GATE GUARDIAN'],
      { bg: '#1b3b73', fg: '#ffffff', border: '#d4af37', w: 768, h: 256 }
    );
    if (tex) {
      plane(tex, 2.4, 0.8, cx, 1.25, cz - 3.25, 0);
      plane(tex, 2.4, 0.8, cx, 1.25, cz + 3.25, Math.PI);
    }
  }
}

// ── Exhibit 5: WWII RAAF No. 5 EFTS Memorial Wall (33 Plaques) ──────────────
function buildRaafMemorialWall(box, flatPoly, plane, boardTexture, cx, cz) {
  // Paved memorial terrace
  flatPoly(
    0xc4baa6,
    [
      [cx - 5.2, cz - 2.6],
      [cx + 5.2, cz - 2.6],
      [cx + 5.2, cz + 1.8],
      [cx - 5.2, cz + 1.8],
    ],
    0.056
  );

  // Stepped red-brick memorial wall (8.4 m total span) with central sandstone tablet
  box(0x6e3529, 8.6, 0.28, 0.65, cx, 0.18, cz);
  box(0x8c4333, 8.4, 1.65, 0.48, cx, 1.12, cz);
  box(0x8c4333, 3.4, 0.68, 0.50, cx, 2.25, cz);
  // Side-wing sandstone coping caps (leaving the central raised tablet unobstructed) & upper cap
  box(0xe2d7c1, 2.5, 0.12, 0.56, cx - 2.95, 1.98, cz);
  box(0xe2d7c1, 2.5, 0.12, 0.56, cx + 2.95, 1.98, cz);
  box(0xe2d7c1, 3.6, 0.12, 0.58, cx, 2.62, cz);
  for (const s of [-1, 1]) {
    box(0x7a392b, 0.68, 2.15, 0.68, cx + s * 4.2, 1.12, cz);
    box(0xe2d7c1, 0.78, 0.14, 0.78, cx + s * 4.2, 2.22, cz);
  }

  // 33 Individual Bronze Commemorative Plaques (3 rows × 11 columns across both faces/wings)
  let plaquesBuilt = 0;
  for (let row = 0; row < 3; row++) {
    const py = 0.68 + row * 0.42;
    for (let col = 0; col < 11; col++) {
      const px = cx - 3.5 + col * 0.7;
      box(0x593e25, 0.48, 0.28, 0.54, px, py, cz);
      box(0xc49a45, 0.42, 0.22, 0.56, px, py, cz);
      plaquesBuilt++;
    }
  }

  if (boardTexture && plane) {
    const tex = boardTexture(
      [
        'RAAF No. 5 EFTS & No. 8 OTU MEMORIAL WALL',
        '1940–1944 · ~2,800 TIGER MOTH GRADUATES · 33 PLAQUES',
      ],
      { bg: '#2b2118', fg: '#f0d58c', border: '#c49a45', w: 1024, h: 256 }
    );
    if (tex) {
      plane(tex, 3.2, 0.62, cx, 2.24, cz - 0.28, Math.PI);
      plane(tex, 3.2, 0.62, cx, 2.24, cz + 0.28, 0);
    }
  }
  return plaquesBuilt;
}

// ── Exhibit 6: Narromine Soaring Centre 15 m Standard-Class Sailplane ───────
function buildSailplaneGlider(box, cx, cz, yaw) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const place = (c, w, h, d, lx, ly, lz, ry = 0) => {
    const wx = cx + lx * cos - lz * sin;
    const wz = cz + lx * sin + lz * cos;
    box(c, w, h, d, wx, ly, wz, yaw + ry);
  };
  const white = 0xf5f7fa;
  const red = 0xd42c2c;
  const canopy = 0x2b4c66;

  // Streamlined fiberglass fuselage (6.8 m length)
  place(white, 0.62, 0.68, 3.6, 0, 0.78, -0.8);
  place(white, 0.34, 0.38, 3.2, 0, 0.82, 2.4);
  place(canopy, 0.54, 0.42, 1.95, 0, 1.02, -1.15);
  // High-aspect-ratio 15.0 m wingspan with red wingtips & winglets
  place(white, 15.0, 0.07, 0.78, 0, 0.92, -0.35);
  for (const s of [-1, 1]) {
    place(red, 0.95, 0.08, 0.68, s * 7.1, 0.93, -0.35);
    place(red, 0.06, 0.48, 0.42, s * 7.52, 1.15, -0.35);
  }
  // T-tail vertical fin & high horizontal tailplane
  place(white, 0.08, 1.35, 0.68, 0, 1.45, 3.75);
  place(white, 2.45, 0.06, 0.45, 0, 2.12, 3.82);
  place(red, 0.09, 0.35, 0.62, 0, 1.92, 3.78);
}

// ── Aerodrome Rotating Beacon Tower & Windsock ──────────────────────────────
function buildBeaconAndWindsock(box, push, beaconPos, windsockPos) {
  const [bx, bz] = beaconPos;
  // 4-leg tapered steel lattice tower (11.5 m high)
  for (const sx of [-0.9, 0.9]) {
    for (const sz of [-0.9, 0.9]) {
      box(0x7c858e, 0.14, 10.5, 0.14, bx + sx * 0.65, 5.25, bz + sz * 0.65);
    }
  }
  for (const y of [2.5, 5.0, 7.5, 10.0]) {
    const w = 1.6 - y * 0.06;
    box(0x8d969f, w, 0.10, w, bx, y, bz);
  }
  // Upper beacon platform & green/white aerodrome rotating light head
  box(0x454e56, 1.5, 0.14, 1.5, bx, 10.55, bz);
  box(0xd93829, 0.35, 0.65, 0.35, bx, 10.95, bz);
  box(0x2ecc71, 0.55, 0.42, 0.28, bx - 0.22, 11.45, bz);
  box(0xf5f7fa, 0.55, 0.42, 0.28, bx + 0.22, 11.45, bz);

  // Windsock mast & 5 alternating orange/white windsock rings
  const [wx, wz] = windsockPos;
  box(0xe2e6ea, 0.12, 6.4, 0.12, wx, 3.2, wz);
  box(0xe2e6ea, 1.2, 0.06, 0.06, wx + 0.6, 6.2, wz);
  for (let i = 0; i < 5; i++) {
    const r0 = 0.38 - i * 0.05;
    const r1 = 0.33 - i * 0.05;
    const seg = new THREE.CylinderGeometry(r1, r0, 0.48, 10);
    seg.rotateZ(-Math.PI / 2 - 0.12);
    seg.translate(wx + 0.55 + i * 0.46, 5.85 - i * 0.06, wz);
    push(i % 2 === 0 ? 0xe85d1a : 0xf5f7fa, seg);
  }
}

export function buildNarromineAviationPrecinct(ctx = null) {
  const standalone = !ctx;
  const group = new THREE.Group();
  group.name = 'Narromine Aviation Museum & Aerodrome Precinct';
  const buckets = new Map();
  const colliders = ctx?.colliders ?? [];
  const spots = ctx?.spots ?? [];

  const push =
    ctx?.push ??
    ((colour, geo) => {
      if (!buckets.has(colour)) buckets.set(colour, []);
      buckets.get(colour).push(geo);
    });

  const box =
    ctx?.box ??
    ((colour, w, h, d, x, y, z, ry = 0) => {
      const g = new THREE.BoxGeometry(w, h, d);
      if (ry) g.rotateY(ry);
      g.translate(x, y, z);
      push(colour, g);
    });

  const flatPoly =
    ctx?.flatPoly ??
    ((colour, pts, y) => {
      const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
      const g = new THREE.ShapeGeometry(sh);
      g.rotateX(-Math.PI / 2);
      g.translate(0, y, 0);
      push(colour, g);
    });

  const boardTexture = ctx?.boardTexture ?? null;
  const plane =
    ctx?.plane ??
    ((tex, w, h, x, y, z, ry) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshLambertMaterial({ color: 0x1e354a })
      );
      m.position.set(x, y, z);
      m.rotation.y = ry;
      group.add(m);
      return m;
    });

  // ── 1. Forecourt, Apron & Walkway Surfacing ───────────────────────────────
  // Museum & Aero Club eastern forecourt apron connecting Tom Perry Drive & Car Park
  flatPoly(
    0x9b9fa3,
    [
      [-5742.0, -2046.0],
      [-5702.0, -2040.5],
      [-5698.5, -2076.0],
      [-5738.0, -2078.0],
    ],
    0.048
  );

  // ── 2. Narromine Aviation Museum — Main Exhibition Hangar (osm:218) ───────
  const museumBldg = NARROMINE_AVIATION_BUILDINGS[0];
  const mQuad = museumBldg.mainSpanQuadWorld; // [NW, NE, SE, SW]
  const mCol = museumBldg.architecture.colours;
  const mEave = museumBldg.dimensionsM.eaveHeightM;
  const mRidge = museumBldg.dimensionsM.ridgeHeightM;
  const mYaw = -Math.atan2(mQuad[1][1] - mQuad[0][1], mQuad[1][0] - mQuad[0][0]);

  // Polished concrete exhibition hall floor
  flatPoly(mCol.floor, mQuad, 0.055);

  // North wall (mQuad[0] -> mQuad[1], 29.8 m) with central 7.7 m open visitor foyer doorway
  const n0 = mQuad[0];
  const n1 = mQuad[1];
  const nLeftEnd = [n0[0] + (n1[0] - n0[0]) * 0.36, n0[1] + (n1[1] - n0[1]) * 0.36];
  const nRightStart = [n0[0] + (n1[0] - n0[0]) * 0.62, n0[1] + (n1[1] - n0[1]) * 0.62];
  addQuadWall(push, mCol.wainscot, n0, nLeftEnd, 0, 1.35);
  addQuadWall(push, mCol.wall, n0, nLeftEnd, 1.35, mEave);
  addQuadWall(push, mCol.wainscot, nRightStart, n1, 0, 1.35);
  addQuadWall(push, mCol.wall, nRightStart, n1, 1.35, mEave);
  addQuadWall(push, mCol.wall, nLeftEnd, nRightStart, 3.2, mEave); // Lintel over north visitor doorway
  colliders.push(...sliceSegmentColliders(n0, nLeftEnd, 0.45));
  colliders.push(...sliceSegmentColliders(nRightStart, n1, 0.45));

  // East wall (mQuad[1] -> mQuad[2], 20.1 m) with wide 12.0 m open bi-fold hangar doors (t = 0.20..0.80)
  const e0 = mQuad[1];
  const e1 = mQuad[2];
  const eTopEnd = [e0[0] + (e1[0] - e0[0]) * 0.18, e0[1] + (e1[1] - e0[1]) * 0.18];
  const eBotStart = [e0[0] + (e1[0] - e0[0]) * 0.82, e0[1] + (e1[1] - e0[1]) * 0.82];
  addQuadWall(push, mCol.wall, e0, eTopEnd, 0, mEave);
  addQuadWall(push, mCol.wall, eBotStart, e1, 0, mEave);
  addQuadWall(push, mCol.trim, eTopEnd, eBotStart, 4.65, mEave); // Hangar door header fascia
  colliders.push(...sliceSegmentColliders(e0, eTopEnd, 0.45));
  colliders.push(...sliceSegmentColliders(eBotStart, e1, 0.45));

  // South & West walls of osm:218
  addQuadWall(push, mCol.wainscot, mQuad[2], mQuad[3], 0, 1.35);
  addQuadWall(push, mCol.wall, mQuad[2], mQuad[3], 1.35, mEave);
  addQuadWall(push, mCol.wainscot, mQuad[3], mQuad[0], 0, 1.35);
  addQuadWall(push, mCol.wall, mQuad[3], mQuad[0], 1.35, mEave);
  colliders.push(...sliceSegmentColliders(mQuad[2], mQuad[3], 0.45));
  colliders.push(...sliceSegmentColliders(mQuad[3], mQuad[0], 0.45));

  // Gabled exhibition hangar roof + internal portal steel trusses
  addGabledRoof4(push, box, mCol.roof, mCol.wall, mCol.ridge, mQuad, mEave, mRidge);
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const tx = (n0[0] + (n1[0] - n0[0]) * t + mQuad[3][0] + (mQuad[2][0] - mQuad[3][0]) * t) * 0.5;
    const tz = (n0[1] + (n1[1] - n0[1]) * t + mQuad[3][1] + (mQuad[2][1] - mQuad[3][1]) * t) * 0.5;
    box(mCol.truss, 0.16, 0.28, 19.6, tx, mEave - 0.15, tz, mYaw);
  }

  // Museum Signboards on North (Tom Perry Drive) & East (Forecourt) elevations
  if (boardTexture) {
    const northSign = boardTexture(
      ['NARROMINE AVIATION MUSEUM · EST. 2002', 'RAAF No. 5 EFTS HERITAGE PRECINCT (LEP I12)'],
      { bg: '#1e354a', fg: '#f5e6b3', border: '#d4af37', w: 1024, h: 256 }
    );
    if (northSign) {
      plane(northSign, 8.2, 1.15, -5725.5, 4.45, -2044.6, Math.PI + mYaw);
    }
    const eastSign = boardTexture(
      ['MAIN EXHIBITION HANGAR', '1903 WRIGHT FLYER REPLICA · CORBEN SUPER ACE · MERLIN Mk 25'],
      { bg: '#1e354a', fg: '#ffffff', border: '#d4af37', w: 1024, h: 220 }
    );
    if (eastSign) {
      plane(eastSign, 9.5, 0.95, -5709.8, 5.15, -2052.8, Math.PI / 2 + mYaw);
    }
  }

  // Interior Verified Exhibits inside osm:218
  buildWrightFlyerExhibit(box, push, -5725.2, -2054.8, mYaw);
  buildCorbenSuperAceExhibit(box, -5733.2, -2051.8, mYaw + 0.35);
  buildMerlinEngineExhibit(box, -5716.2, -2058.2, mYaw);
  // Compact collider for Corben Super Ace & Merlin Engine stand (leaving central hangar walkway completely open)
  colliders.push({ x0: -5735.5, x1: -5731.0, z0: -2053.8, z1: -2049.8 });
  colliders.push({ x0: -5717.2, x1: -5715.2, z0: -2059.4, z1: -2057.0 });

  // ── 3. Narromine Aero Club & Museum Terminal Complex (osm:1) ──────────────
  const aeroBldg = NARROMINE_AVIATION_BUILDINGS[1];
  const aCol = aeroBldg.architecture.colours;
  for (const wing of aeroBldg.wings) {
    const wPts = wing.pts;
    const wCenter = [
      (wPts[0][0] + wPts[1][0] + wPts[2][0] + wPts[3][0]) * 0.25,
      (wPts[0][1] + wPts[1][1] + wPts[2][1] + wPts[3][1]) * 0.25,
    ];
    for (let i = 0; i < 4; i++) {
      const a = wPts[i];
      const b = wPts[(i + 1) % 4];
      addQuadWall(push, aCol.plinth, a, b, 0, 0.85);
      addQuadWall(push, aCol.wall, a, b, 0.85, wing.eaveHeightM);
    }
    addHippedRoof4(push, box, aCol.roof, aCol.ridge, wPts, wing.eaveHeightM, wing.ridgeHeightM, 0.4);
    addEdgeWindows(box, aCol.trim, aCol.glass, aCol.trim, wPts[0], wPts[1], wCenter, wing.name === 'clubhouse-main-wing' ? 6 : 2, 2.2, 1.5, 1.35);
    addEdgeWindows(box, aCol.trim, aCol.glass, aCol.trim, wPts[2], wPts[3], wCenter, wing.name === 'clubhouse-main-wing' ? 6 : 2, 2.2, 1.5, 1.35);
    colliders.push(...sliceQuadColliders(wPts, 4, 3.0));
  }
  // Aero Club northern entry verandah canopy along Tom Perry Drive
  box(aCol.roof, 18.0, 0.16, 2.8, -5759.5, 3.25, -2058.8, mYaw);
  for (let i = -3; i <= 3; i++) {
    box(aCol.verandahPost, 0.14, 3.2, 0.14, -5759.5 + i * 2.8, 1.6, -2057.5 - i * 0.38);
  }
  if (boardTexture) {
    const aeroSign = boardTexture(
      ['NARROMINE AERO CLUB · FOUNDED 1929', 'PILOT LOUNGE · FLIGHT TRAINING · CHARTER'],
      { bg: '#2c4254', fg: '#ffffff', border: '#e8dcc4', w: 1024, h: 240 }
    );
    if (aeroSign) {
      plane(aeroSign, 6.8, 0.9, -5759.5, 3.85, -2057.4, Math.PI + mYaw);
    }
  }

  // ── 4. Outdoor Forecourt Monuments: CAC Sabre, RAAF Memorial Wall & Beacon ─
  buildSabreGateGuardian(box, push, plane, boardTexture, -5710.5, -2068.5, -0.45);
  colliders.push({ x0: -5712.4, x1: -5708.6, z0: -2070.4, z1: -2066.6 });

  const plaquesBuilt = buildRaafMemorialWall(box, flatPoly, plane, boardTexture, -5720.5, -2071.5);
  colliders.push({ x0: -5724.9, x1: -5716.1, z0: -2072.0, z1: -2071.0 });

  buildBeaconAndWindsock(box, push, [-5746.5, -2050.5], [-5712.0, -2082.0]);
  colliders.push({ x0: -5747.4, x1: -5745.6, z0: -2051.4, z1: -2049.6 });

  // ── 5. Surveyed Aerodrome Hangars (osm:2..7) & Gliding Club (osm:8, 217) ──
  for (const b of NARROMINE_AVIATION_BUILDINGS.slice(2)) {
    const pts = b.footprintWorld;
    const eave = b.dimensionsM.eaveHeightM;
    const ridge = b.dimensionsM.ridgeHeightM;
    const isHangar = b.role.includes('hangar');
    const isBellman = b.id === 'narromine-efts-bellman-hangar-7';
    const wallC = isBellman ? 0x6f7c6b : isHangar ? 0xc2c7cc : 0xdad2c2;
    const roofC = isBellman ? 0x566153 : isHangar ? 0x8f969c : 0x6a757d;
    const trimC = isBellman ? 0x3b4438 : 0x2c4254;

    // Concrete apron pad under each hangar
    flatPoly(0x8e9296, pts, 0.046);
    for (let i = 0; i < 4; i++) {
      addQuadWall(push, wallC, pts[i], pts[(i + 1) % 4], 0, eave);
    }
    addGabledRoof4(push, box, roofC, wallC, trimC, pts, eave, ridge);

    // Sliding hangar doors along primary frontage (pts[0] -> pts[1])
    const a = pts[0];
    const bPt = pts[1];
    const dx = bPt[0] - a[0];
    const dz = bPt[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    const yaw = -Math.atan2(dz, dx);
    const mx = (a[0] + bPt[0]) * 0.5;
    const mz = (a[1] + bPt[1]) * 0.5;
    const cPt = [(pts[0][0] + pts[2][0]) * 0.5, (pts[0][1] + pts[2][1]) * 0.5];
    let nx = -dz / len;
    let nz = dx / len;
    if ((mx - cPt[0]) * nx + (mz - cPt[1]) * nz < 0) {
      nx = -nx;
      nz = -nz;
    }
    if (isHangar) {
      const doorW = Math.min(len * 0.76, len - 2.4);
      const doorH = Math.max(3.6, eave - 0.85);
      box(0x4b535a, doorW, doorH, 0.14, mx + nx * 0.08, doorH * 0.5, mz + nz * 0.08, yaw);
      box(trimC, doorW + 0.6, 0.28, 0.22, mx + nx * 0.12, doorH + 0.14, mz + nz * 0.12, yaw);
    } else {
      addEdgeWindows(box, 0xf4f1ea, 0x2d4252, 0xf4f1ea, a, bPt, cPt, 4, 1.9, 1.35, 1.15);
    }
    colliders.push(...sliceQuadColliders(pts, 3, 4.0));
  }

  // Parked 15 m Standard-Class Sailplane Glider on the Gliding Club tie-down apron
  buildSailplaneGlider(box, -5628.0, -2034.0, 0.14);
  if (boardTexture) {
    const glideSign = boardTexture(
      ['NARROMINE GLIDING CLUB & SOARING CENTRE', 'WORLD-CLASS THERMAL SOARING · YNRM'],
      { bg: '#1e4b6e', fg: '#ffffff', border: '#f5f7fa', w: 1024, h: 240 }
    );
    if (glideSign) {
      plane(glideSign, 6.2, 0.85, -5628.4, 3.75, -2019.5, Math.PI + 0.15);
    }
  }

  // ── 6. Interactive Exhibit & Landmark Spots (`spots`) ─────────────────────
  for (const ex of NARROMINE_AVIATION_EXHIBITS) {
    spots.push({
      key: 'narromine:aviation:' + ex.id,
      label: ex.name,
      pos: new THREE.Vector3(ex.posWorld[0], 0, ex.posWorld[1]),
      text: `${ex.location} — ${ex.historicalFact}`,
    });
  }

  let totalTriangles = 0;
  if (standalone) {
    for (const [colour, geos] of buckets.entries()) {
      const merged = mergeGeometries(geos);
      totalTriangles += merged.attributes.position.count / 3;
      const mesh = new THREE.Mesh(
        merged,
        new THREE.MeshLambertMaterial({ color: colour, side: THREE.DoubleSide })
      );
      group.add(mesh);
    }
  }

  return {
    group,
    colliders,
    spots,
    stats: {
      buildingCount: NARROMINE_AVIATION_BUILDINGS.length,
      exhibitCount: NARROMINE_AVIATION_EXHIBITS.length,
      memorialPlaquesCount: plaquesBuilt,
      materialCount: buckets.size,
      triangleCount: totalTriangles,
      colliderCount: colliders.length,
    },
    heritage: NARROMINE_AVIATION_HERITAGE,
    cadastralLots: NARROMINE_AVIATION_CADASTRAL_LOTS,
    buildings: NARROMINE_AVIATION_BUILDINGS,
    exhibits: NARROMINE_AVIATION_EXHIBITS,
    access: NARROMINE_AVIATION_ACCESS,
    integrationSpec: NARROMINE_AVIATION_INTEGRATION_SPEC,
  };
}
