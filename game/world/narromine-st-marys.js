// St Mary's Anglican Church, [address redacted], Narromine: the walk-in nave.
// Built from a published interior photograph (pointed chancel arch with a painted text band,
// a five-light stained-glass east window, dark open timber roof, patterned encaustic tiles, timber
// pews, altar with a green frontal and communion rail) at the size measured by the 2023 NSW LiDAR
// (nave about 24 x 11 m, eaves 4.5 m, ridge 9.6 m). INTERPRETIVE: the glass subjects, furnishings
// layout, font and fittings not visible in the photograph are reconstructed, not surveyed.
import * as THREE from 'three';
import { createKit } from './interior-kit.js';
import { geoToWorld, DETAILED } from './narromine-layout.js';

export const ST_MARYS_ID = 'st-marys-anglican';
export const ST_MARYS_SAVE_ID = 'NARROMINE-ST-MARYS';
export const ST_MARYS_NAME = "St Mary's Anglican Church";
export const ST_MARYS_ADDRESS = '[address redacted], Narromine NSW';

// The porch doors are on the north face of the low porch wing, under the bellcote (see the
// archdoor feature in narromine-buildings-data.js). The trigger sits clear of the wing's collider.
function porchDoor() {
  const b = DETAILED.find((d) => d.id === ST_MARYS_ID), lean = b?.parts.find((p) => p.name === 'north lean-to');
  if (!lean) return null;
  const [p0, p1, , p3] = lean.pts, t = 0.72, door = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
  const ix = p3[0] - p0[0], iz = p3[1] - p0[1], il = Math.hypot(ix, iz), out = [-ix / il, -iz / il];   // outward = away from the nave
  const at = (d) => ({ x: door[0] + out[0] * d, z: door[1] + out[1] * d });
  const faceIn = Math.atan2(out[0], out[1]);           // yaw that looks back at the door (yaw 0 = -z)
  return { door, out, at, faceIn };
}
const pd = porchDoor();
export const ST_MARYS_ENTRANCE = Object.freeze(pd ? {
  ...pd.at(2.0), yaw: pd.faceIn, radius: 1.1,
  outside: Object.freeze({ ...pd.at(3.9), yaw: pd.faceIn }),
  returnPose: Object.freeze({ ...pd.at(3.9), yaw: pd.faceIn + Math.PI }),
} : { x: 0, z: 0, yaw: 0, radius: 0, outside: { x: 0, z: 0, yaw: 0 }, returnPose: { x: 0, z: 0, yaw: 0 } });
export const nearStMarysDoor = (pos) => !!pd && !!pos && Math.hypot(pos.x - ST_MARYS_ENTRANCE.x, pos.z - ST_MARYS_ENTRANCE.z) <= ST_MARYS_ENTRANCE.radius;

const HALF = 5.2, WEST = 6, EAST = -17.4, EAVE = 4.4, RIDGE = 8.8, ARCH_Z = -12, RAIL_Z = -14.6;
const CREAM = 0xe8dcbc, TIMBER = 0x5a3c27, DARK = 0x3a2719, PEW = 0x6b4428;

const canvasTex = (w, h, draw) => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const pointed = (w, h, pk) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h);
  s.quadraticCurveTo(w / 2, h + pk * 0.75, 0, h + pk); s.quadraticCurveTo(-w / 2, h + pk * 0.75, -w / 2, h); return s; };

export function buildStMarysInterior(makeLabel) {
  const site = { id: ST_MARYS_ID, name: ST_MARYS_NAME }, room = "St Mary's nave (interpretive)";
  const k = createKit(site, makeLabel, room), { group, box, solid, cyl, ball, seat, add } = k;
  const mesh = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; group.add(m); return m; };

  // Floor: timber under the pews; patterned encaustic tiles in the aisle and the chancel.
  box(HALF * 2, 0.24, WEST - EAST, 0, -0.12, (WEST + EAST) / 2, 0x6e4a30);
  const tiles = canvasTex(256, 256, (g) => {
    g.fillStyle = '#efe4cf'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = i * 64 + 32, y = j * 64 + 32; g.fillStyle = (i + j) % 2 ? '#8e2f23' : '#262322';
      g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x + 30, y); g.lineTo(x, y + 30); g.lineTo(x - 30, y); g.fill();
      g.fillStyle = '#c99a45'; g.fillRect(x - 5, y - 5, 10, 10);
    }
  });
  const tileMat = (rx, rz) => { if (!tiles) return new THREE.MeshLambertMaterial({ color: 0x9a5a40 }); const t = tiles.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return new THREE.MeshLambertMaterial({ map: t }); };
  const aisle = new THREE.PlaneGeometry(1.7, WEST - 0.5 - ARCH_Z); aisle.rotateX(-Math.PI / 2);
  mesh(aisle, tileMat(1.7, (WEST - 0.5 - ARCH_Z)), 0, 0.012, (WEST - 0.5 + ARCH_Z) / 2);
  // Chancel: two steps up, tiled throughout; the sanctuary a further step inside the rail.
  box(HALF * 2, 0.12, 0.45, 0, 0.06, ARCH_Z + 0.2, 0xb8a58a);
  box(HALF * 2, 0.24, ARCH_Z - 0.0 - EAST, 0, 0.0, (ARCH_Z + EAST) / 2, 0xb8a58a);
  const ch = new THREE.PlaneGeometry(HALF * 2, ARCH_Z - EAST); ch.rotateX(-Math.PI / 2);
  mesh(ch, tileMat(HALF * 2 / 1.2, (ARCH_Z - EAST) / 1.2), 0, 0.125, (ARCH_Z + EAST) / 2);
  box(HALF * 2, 0.12, EAST + 2.6 - EAST, 0, 0.18, EAST + 1.3, 0x8e2f23);

  // Walls: cream plaster above a dark timber dado; west wall has the doorway from the porch.
  for (const s of [-1, 1]) {
    solid(0.24, EAVE, WEST - EAST, s * (HALF + 0.12), EAVE / 2, (WEST + EAST) / 2, CREAM);
    box(0.05, 1.1, WEST - EAST, s * (HALF - 0.03), 0.55, (WEST + EAST) / 2, TIMBER);
  }
  solid(HALF * 2 + 0.5, EAVE, 0.24, 0, EAVE / 2, EAST - 0.12, CREAM);
  for (const s of [-1, 1]) solid(HALF - 1.0, EAVE, 0.24, s * (1.0 + (HALF - 1.0) / 2), EAVE / 2, WEST + 0.12, CREAM);
  box(2.0, EAVE - 2.6, 0.24, 0, 2.6 + (EAVE - 2.6) / 2, WEST + 0.12, CREAM);
  box(2.1, 0.12, 0.3, 0, 2.62, WEST + 0.05, TIMBER);
  // Gable triangles above the eaves at both ends.
  const gable = new THREE.Shape([new THREE.Vector2(-HALF - 0.24, 0), new THREE.Vector2(HALF + 0.24, 0), new THREE.Vector2(0, RIDGE - EAVE)]);
  for (const [z, ry] of [[EAST - 0.12, 0], [WEST + 0.12, Math.PI]]) mesh(new THREE.ShapeGeometry(gable), new THREE.MeshLambertMaterial({ color: CREAM, side: THREE.DoubleSide }), 0, EAVE, z, ry);

  // Open timber roof: boarded ceiling on the rafters, with collar-and-scissor trusses every 3 m.
  const run = HALF + 0.24, rise = RIDGE - EAVE, slope = Math.hypot(run, rise), a = Math.atan2(rise, run);
  for (const s of [-1, 1]) {
    const g = new THREE.PlaneGeometry(slope, WEST - EAST); g.rotateX(-Math.PI / 2); g.rotateZ(-s * a);
    mesh(g, new THREE.MeshLambertMaterial({ color: 0x4a3221, side: THREE.DoubleSide }), s * run / 2, EAVE + rise / 2, (WEST + EAST) / 2);
  }
  for (let z = WEST - 1.5; z > EAST; z -= 3) {
    for (const s of [-1, 1]) {
      box(slope, 0.22, 0.16, s * run / 2, EAVE + rise / 2 - 0.12, z, DARK, { rz: -s * a });
      const sc = Math.hypot(run * 0.9, rise * 0.55);
      box(sc, 0.16, 0.12, -s * run * 0.05, EAVE + rise * 0.42, z, DARK, { rz: s * Math.atan2(rise * 0.55, run * 0.9) });
    }
    box(run * 0.9, 0.18, 0.14, 0, EAVE + rise * 0.62, z, DARK);
    box(0.22, 0.5, 0.2, -HALF + 0.05, EAVE - 0.25, z, DARK); box(0.22, 0.5, 0.2, HALF - 0.05, EAVE - 0.25, z, DARK);
    // Hanging lantern on each truss.
    box(0.02, 1.4, 0.02, 0, EAVE + rise * 0.62 - 0.75, z, 0x222222);
    ball(0.2, 0, EAVE + rise * 0.62 - 1.55, z, 0xfff1c8, { e: 0xffe2a0 });
  }

  // Paired lancets in the side walls, glazed in pale amber cathedral glass.
  const amber = new THREE.MeshBasicMaterial({ color: 0xf1d48c, side: THREE.DoubleSide }), reveal = new THREE.MeshLambertMaterial({ color: 0xd2c3a1, side: THREE.DoubleSide });
  for (const s of [-1, 1]) for (let z = WEST - 3.0; z > ARCH_Z + 1; z -= 3) for (const dz of [-0.35, 0.35]) {
    mesh(new THREE.ShapeGeometry(pointed(0.56, 1.75, 0.38), 6), reveal, s * (HALF - 0.005), 1.55, z + dz, -s * Math.PI / 2);
    mesh(new THREE.ShapeGeometry(pointed(0.42, 1.7, 0.3), 6), amber, s * (HALF - 0.012), 1.6, z + dz, -s * Math.PI / 2);
  }

  // Five-light stained-glass east window with traceried roundels above the altar.
  const glass = canvasTex(512, 800, (g, W, H) => {
    g.clearRect(0, 0, W, H);
        const lights = [[60, 330, 66, 360], [148, 260, 66, 430], [236, 200, 72, 490], [324, 260, 66, 430], [412, 330, 66, 360]];
    for (const [x, top, w, h] of lights) {
      g.save(); g.beginPath(); g.moveTo(x, H - 20); g.lineTo(x + w, H - 20); g.lineTo(x + w, top + w * 0.6); g.quadraticCurveTo(x + w, top, x + w / 2, top - w * 0.4);
      g.quadraticCurveTo(x, top, x, top + w * 0.6); g.closePath(); g.clip();
      // Deep blue diamond quarries behind a standing figure under a gold canopy, with a ruby border.
      const li = lights.findIndex((l) => l[0] === x), robe = ['#b5302a', '#2f8a4e', '#f2e8d0', '#7b3fa0', '#c98a2a'][li];
      g.fillStyle = '#244a96'; g.fillRect(x, top - 60, w, H);
      g.strokeStyle = 'rgba(20,18,16,0.55)'; g.lineWidth = 2;
      for (let d = -H; d < H; d += 18) { g.beginPath(); g.moveTo(x + d, top - 60); g.lineTo(x + d + H, top - 60 + H); g.stroke(); g.beginPath(); g.moveTo(x + w - d, top - 60); g.lineTo(x + w - d - H, top - 60 + H); g.stroke(); }
      g.fillStyle = '#9e2723'; g.fillRect(x, top - 60, 7, H); g.fillRect(x + w - 7, top - 60, 7, H);
      const fy = top + 70, fh = Math.min(h * 0.62, H - 60 - fy);
      g.fillStyle = '#d9a83a'; g.beginPath(); g.moveTo(x + 8, fy - 6); g.lineTo(x + w / 2, fy - 46); g.lineTo(x + w - 8, fy - 6); g.closePath(); g.fill();   // canopy
      g.fillStyle = robe; g.beginPath(); g.moveTo(x + w / 2 - 10, fy + 20); g.lineTo(x + w / 2 + 10, fy + 20); g.lineTo(x + w - 10, fy + fh); g.lineTo(x + 10, fy + fh); g.closePath(); g.fill();
      g.fillStyle = '#f0c94e'; g.beginPath(); g.arc(x + w / 2, fy + 6, w * 0.2, 0, 7); g.fill();            // halo
      g.fillStyle = '#ecc8a0'; g.beginPath(); g.arc(x + w / 2, fy + 8, w * 0.12, 0, 7); g.fill();            // face
      g.fillStyle = '#3c6e3a'; g.fillRect(x + 7, fy + fh, w - 14, 26); g.fillStyle = '#f1e7c9'; g.fillRect(x + 12, fy + fh + 34, w - 24, 18);   // ground and inscription strip
      g.restore(); g.strokeStyle = '#1d1a18'; g.lineWidth = 6; g.stroke();
    }
    for (const [cx, cy, r] of [[180, 120, 46], [332, 120, 46], [256, 52, 40]]) {
      g.fillStyle = '#c7372f'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
      g.fillStyle = '#e8c04a'; g.beginPath(); g.arc(cx, cy, r * 0.55, 0, 7); g.fill();
      g.strokeStyle = '#1d1a18'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    }
  });
  mesh(new THREE.PlaneGeometry(3.6, 5.6), new THREE.MeshBasicMaterial(glass ? { map: glass, transparent: true, side: THREE.DoubleSide } : { color: 0x5577aa }), 0, 4.5, EAST + 0.02);
  // Panelled reredos below the window.
  box(4.6, 1.6, 0.08, 0, 1.0, EAST + 0.06, 0xd9c8a4); for (let i = -2; i <= 2; i++) box(0.06, 1.4, 0.1, i * 0.9, 1.0, EAST + 0.09, 0xb59a6c);

  // Chancel arch: a pointed opening in the cross wall, ringed by a maroon painted text band.
  const arch = new THREE.Shape(), S0 = 3.6, R = 3.8, C = 0.5;
  arch.moveTo(-HALF - 0.24, 0); arch.lineTo(-3.3, 0); arch.lineTo(-3.3, S0);
  for (let q = 0; q <= 16; q++) { const th = Math.PI - q / 16 * (Math.PI - Math.acos(-C / R)); arch.lineTo(C + R * Math.cos(th), S0 + R * Math.sin(th)); }
  for (let q = 16; q >= 0; q--) { const th = Math.PI - q / 16 * (Math.PI - Math.acos(-C / R)); arch.lineTo(-(C + R * Math.cos(th)), S0 + R * Math.sin(th)); }
  arch.lineTo(3.3, 0); arch.lineTo(HALF + 0.24, 0); arch.lineTo(HALF + 0.24, EAVE); arch.lineTo(0, RIDGE); arch.lineTo(-HALF - 0.24, EAVE);
  const archTex = canvasTex(1040, 880, (g) => {
    g.fillStyle = '#e8dcbc'; g.fillRect(0, 0, 1040, 880);
    const P = (x, y) => [520 + x * 100, 880 - y * 100], ring = (off) => { const pts = [[-3.3 - off, 0], [-3.3 - off, S0]];
      for (let q = 0; q <= 24; q++) { const th = Math.PI - q / 24 * (Math.PI - Math.acos(-C / R)); pts.push([C + (R + off) * Math.cos(th), S0 + (R + off) * Math.sin(th)]); }
      for (let q = 24; q >= 0; q--) { const th = Math.PI - q / 24 * (Math.PI - Math.acos(-C / R)); pts.push([-(C + (R + off) * Math.cos(th)), S0 + (R + off) * Math.sin(th)]); }
      pts.push([3.3 + off, S0], [3.3 + off, 0]); return pts; };
    g.lineJoin = 'round'; g.strokeStyle = '#7d2a2a'; g.lineWidth = 46; g.beginPath(); ring(0.3).forEach(([x, y], i) => (i ? g.lineTo : g.moveTo).call(g, ...P(x, y))); g.stroke();
    g.strokeStyle = '#c9a24a'; g.lineWidth = 4; for (const off of [0.07, 0.53]) { g.beginPath(); ring(off).forEach(([x, y], i) => (i ? g.lineTo : g.moveTo).call(g, ...P(x, y))); g.stroke(); }
    // Lettering follows the arch from springer to springer.
    const words = '+ GLORY TO GOD IN THE HIGHEST +', pts = ring(0.3).slice(1, -1);
    const segLen = []; let total = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segLen.push(d); total += d; }
    g.fillStyle = '#f2e3b3'; g.font = 'bold 30px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let c = 0; c < words.length; c++) {
      let d = total * (0.06 + 0.88 * c / (words.length - 1)), i = 0; while (i < segLen.length - 1 && d > segLen[i]) { d -= segLen[i]; i++; }
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], f = d / segLen[i], [px, py] = P(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
      g.save(); g.translate(px, py); g.rotate(Math.atan2(-(y1 - y0), x1 - x0)); g.fillText(words[c], 0, 0); g.restore();
    }
  });
  const archGeo = new THREE.ExtrudeGeometry(arch, { depth: 0.5, bevelEnabled: false, curveSegments: 4 }); archGeo.translate(0, 0, -0.25);
  if (archTex) { archTex.repeat.set(1 / ((HALF + 0.24) * 2), 1 / RIDGE); archTex.offset.set(0.5, 0); }
  const archMats = [new THREE.MeshLambertMaterial(archTex ? { map: archTex } : { color: CREAM }), new THREE.MeshLambertMaterial({ color: 0xdccfae })];
  mesh(archGeo, archMats, 0, 0, ARCH_Z);
  for (const s of [-1, 1]) k.blocker(HALF - 3.3 + 0.24, 0.6, s * (3.3 + (HALF + 0.24 - 3.3) / 2), ARCH_Z);

  // Pews: two blocks either side of the tiled centre aisle, facing the altar (yaw 0 looks east, -z).
  let rows = 0;
  for (let z = 3.1; z > ARCH_Z + 1.4; z -= 1.02, rows++) for (const s of [-1, 1]) {
    const x0 = s * 0.85, x1 = s * 4.95, cx = (x0 + x1) / 2, len = Math.abs(x1 - x0);
    box(len, 0.06, 0.42, cx, 0.45, z, PEW); box(len, 0.7, 0.06, cx, 0.8, z + 0.24, PEW); box(len, 0.05, 0.12, cx, 1.16, z + 0.24, DARK);
    for (const ex of [x0, x1]) box(0.07, 0.95, 0.58, ex, 0.48, z + 0.02, DARK);
    k.blocker(len, 0.22, cx, z + 0.24);
    seat(`pew-${s < 0 ? 'n' : 's'}-${rows}`, 'pews', s * 1.35, z - 0.02, 0, { label: 'Pew' });
  }

  // Sanctuary: communion rail with a central gate, altar with a green frontal, cross and candles.
  for (const s of [-1, 1]) {
    const cx = s * 2.6, len = 3.6;
    box(len, 0.08, 0.16, cx, 0.95, RAIL_Z, 0x7a5232); box(len, 0.08, 0.5, cx, 0.42, RAIL_Z - 0.2, 0x8a6a4a);
    for (let x = 0.9; x <= 4.4; x += 0.35) box(0.06, 0.7, 0.06, s * x, 0.6, RAIL_Z, 0x7a5232);
    k.blocker(len, 0.3, cx, RAIL_Z);
  }
  solid(2.5, 0.95, 1.0, 0, 0.72, EAST + 1.0, 0xf3efe4);
  box(2.3, 0.78, 0.04, 0, 0.66, EAST + 1.52, 0x2f6b3a); box(0.1, 0.6, 0.05, 0, 0.7, EAST + 1.55, 0xd8b44a); box(0.4, 0.1, 0.05, 0, 0.84, EAST + 1.55, 0xd8b44a);
  box(2.56, 0.05, 1.06, 0, 1.2, EAST + 1.0, 0xffffff);
  box(0.06, 0.7, 0.06, 0, 1.58, EAST + 0.85, 0xd8b44a); box(0.36, 0.06, 0.06, 0, 1.75, EAST + 0.85, 0xd8b44a);
  for (const s of [-1, 1]) { cyl(0.05, 0.08, 0.45, s * 0.85, 1.45, EAST + 0.85, 0xd8b44a); cyl(0.025, 0.025, 0.22, s * 0.85, 1.78, EAST + 0.85, 0xfffbe8); }
  for (const s of [-1, 1]) { cyl(0.18, 0.12, 0.6, s * 1.6, 1.25, EAST + 0.7, 0x8a6a4a); ball(0.28, s * 1.6, 1.7, EAST + 0.7, s < 0 ? 0xf2f2f2 : 0xe8d24a); }   // flowers
  solid(0.8, 0.95, 0.6, 3.9, 0.6, EAST + 2.4, TIMBER);   // sanctuary chair
  // Pulpit (north side of the arch) and lectern (south), in dark timber.
  cyl(0.62, 0.62, 1.1, -4.2, 0.85, ARCH_Z + 1.0, TIMBER, {}, 8); cyl(0.68, 0.68, 0.1, -4.2, 1.42, ARCH_Z + 1.0, DARK, {}, 8);
  box(0.6, 0.3, 0.7, -3.45, 0.15, ARCH_Z + 1.6, TIMBER); k.blocker(1.4, 1.4, -4.2, ARCH_Z + 1.0);
  box(0.12, 1.1, 0.12, 3.9, 0.55, ARCH_Z + 1.1, DARK); box(0.6, 0.06, 0.45, 3.9, 1.15, ARCH_Z + 1.1, DARK, { rx: 0.4 }); k.blocker(0.7, 0.6, 3.9, ARCH_Z + 1.1);
  // Hymn board, and a stone font by the door (interpretive).
  box(0.7, 1.0, 0.05, -HALF + 0.05, 2.3, ARCH_Z + 2.2, DARK, { ry: Math.PI / 2 });
  for (let i = 0; i < 4; i++) box(0.5, 0.14, 0.06, -HALF + 0.09, 2.62 - i * 0.22, ARCH_Z + 2.2, 0xf4efe0, { ry: Math.PI / 2 });
  cyl(0.45, 0.32, 0.25, -3.7, 0.95, WEST - 1.5, 0xcfc6b3, {}, 8); cyl(0.18, 0.28, 0.85, -3.7, 0.42, WEST - 1.5, 0xc4baa5, {}, 8); k.blocker(1.0, 1.0, -3.7, WEST - 1.5);

  const label = (text, kind, x, y, z) => { const s = makeLabel?.(text, kind); if (s) { s.position.set(x, y, z); group.add(s); } };
  label("ST MARY'S ANGLICAN CHURCH · NARROMINE", 'room', 0, 3.4, WEST - 0.4);
  label('INTERPRETIVE INTERIOR · NOT A SURVEY', 'interactive', 3.7, 2.1, WEST - 1.2);
  add('history', 'Foundation stones and history', 'info',
    "St Mary's foundation stone was laid on 22 May 1929 by the Bishop of Bathurst, Horace Crotty (K D Norman, Rector). The church opened on 16 July 1933, and a further stone was laid on 27 October 1959 by Bishop K Leslie (H G Redshaw, Rector). Source: Churches Australia directory, transcribing the stones.", 3.7, WEST - 1.2);
  add('east-window', 'Stained-glass east window', 'info',
    'A five-light east window with three traceried roundels, as in a published photograph of the sanctuary. The panel subjects and makers are not identified here, so the glass in this model is a simplified pattern, not a copy.', 0, RAIL_Z + 0.7);
  add('chancel-arch', 'Chancel arch', 'info',
    'A pointed chancel arch with a maroon painted band and gilt lettering, as photographed. The full inscription is not legible in the source photograph; "Glory to God in the highest" is a reconstruction.', -2.4, ARCH_Z + 1.4);
  add('model', 'About this model', 'info',
    "The building's size and roof heights come from the 2023 NSW Spatial Services LiDAR survey; the exterior from street photographs. Inside, the arch, east window, open timber roof, tiled aisle, pews, rail and altar follow a published photograph; the font, hymn board, chair and exact layout are interpretive. No service times, people or parish records are simulated.", -3.7, WEST - 2.6);

  return { ...k.finish({
    rooms: [{ name: room, x0: -HALF, x1: HALF, z0: EAST, z1: WEST, w: HALF * 2, d: WEST - EAST, parent: -1 }],
    bounds: { x0: -HALF, x1: HALF, z0: EAST, z1: WEST },
    spawn: new THREE.Vector3(0, 0, WEST - 2.4),
    exitZone: { x0: -1.0, x1: 1.0, z0: WEST - 0.1, z1: WEST + 1.2 },
    lightingOptions: { positions: [] },   // lit by the hanging lanterns and daylight fill, not office fittings
  }), people: [], narromineChurch: true, pewRows: rows };
}
