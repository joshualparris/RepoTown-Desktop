// Non-overlapping Narromine asphalt and footpath surfaces from real mapped centrelines.
// The old renderer placed coplanar road boxes over one another at every bend and
// intersection; full-width footpath boxes also sat under asphalt. That caused
// visible z-fighting and giant flashing road/footpath wedges when moving.
// Convex difference preserves precise oblique corners and never rasterises roads.
const EPS = 1e-7;
const AREA_EPS = 1e-5;
const GRID = 64;

const area = (pts) => Math.abs(pts.reduce((a, p, i) => {
  const q = pts[(i + 1) % pts.length];
  return a + p[0] * q[1] - q[0] * p[1];
}, 0)) * 0.5;
const bounds = (pts) => pts.reduce((b, [x, z]) => ({
  x0: Math.min(b.x0, x), x1: Math.max(b.x1, x),
  z0: Math.min(b.z0, z), z1: Math.max(b.z1, z),
}), { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity });
const overlaps = (a, b) => a.x0 < b.x1 - EPS && b.x0 < a.x1 - EPS &&
  a.z0 < b.z1 - EPS && b.z0 < a.z1 - EPS;

// Counter-clockwise in world [x,z], preserving the original extensions at
// segment ends for connected bends and branches.
export function roadQuad(ax, az, bx, bz, width) {
  const length = Math.hypot(bx - ax, bz - az);
  if (length < 0.05 || width <= 0) return null;
  const ux = (bx - ax) / length, uz = (bz - az) / length;
  const vx = -uz, vz = ux, hl = (length + width * 0.5) / 2, hw = width / 2;
  const cx = (ax + bx) / 2, cz = (az + bz) / 2;
  return [[cx - ux * hl - vx * hw, cz - uz * hl - vz * hw],
    [cx + ux * hl - vx * hw, cz + uz * hl - vz * hw],
    [cx + ux * hl + vx * hw, cz + uz * hl + vz * hw],
    [cx - ux * hl + vx * hw, cz - uz * hl + vz * hw]];
}

function clipHalfPlane(pts, a, b, keepInside) {
  if (!pts.length) return [];
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const signed = p => dx * (p[1] - a[1]) - dz * (p[0] - a[0]);
  const out = [];
  let prev = pts[pts.length - 1], dp = signed(prev);
  for (const cur of pts) {
    const dc = signed(cur), prevIn = keepInside ? dp >= -EPS : dp <= EPS;
    const curIn = keepInside ? dc >= -EPS : dc <= EPS;
    if (prevIn !== curIn) {
      const t = Math.max(0, Math.min(1, dp / (dp - dc)));
      out.push([prev[0] + (cur[0] - prev[0]) * t,
        prev[1] + (cur[1] - prev[1]) * t]);
    }
    if (curIn) out.push(cur);
    prev = cur; dp = dc;
  }
  return out;
}

// The exterior fragments are disjoint; the sole interior remainder advances
// to the next cutter half-plane. All fragments remain convex.
export function subtractConvex(subject, cutter) {
  if (!overlaps(bounds(subject), bounds(cutter))) return [subject];
  let remainder = subject;
  const pieces = [];
  for (let i = 0; i < cutter.length && remainder.length >= 3; i++) {
    const a = cutter[i], b = cutter[(i + 1) % cutter.length];
    const outside = clipHalfPlane(remainder, a, b, false);
    if (outside.length >= 3 && area(outside) > AREA_EPS) pieces.push(outside);
    remainder = clipHalfPlane(remainder, a, b, true);
  }
  return pieces;
}

class QuadIndex {
  constructor() { this.tiles = new Map(); this.quads = []; }
  cells(b) {
    const c = [];
    for (let x = Math.floor(b.x0 / GRID); x <= Math.floor(b.x1 / GRID); x++)
      for (let z = Math.floor(b.z0 / GRID); z <= Math.floor(b.z1 / GRID); z++) c.push(`${x},${z}`);
    return c;
  }
  add(quad) {
    const id = this.quads.length, b = bounds(quad);
    this.quads.push({ quad, b });
    for (const cell of this.cells(b)) {
      if (!this.tiles.has(cell)) this.tiles.set(cell, []);
      this.tiles.get(cell).push(id);
    }
  }
  find(quad) {
    const b = bounds(quad), ids = new Set();
    for (const cell of this.cells(b)) for (const id of this.tiles.get(cell) || []) ids.add(id);
    return [...ids].sort((a, b) => a - b).map(id => this.quads[id])
      .filter(entry => overlaps(b, entry.b)).map(entry => entry.quad);
  }
}

function priority(kind) {
  return ({ trunk: 8, primary: 7, secondary: 6, tertiary: 5,
    unclassified: 4, residential: 3, living_street: 2, service: 1, track: 0 })[kind] ?? 2;
}

// Kerb returns: where two streets meet at an angle, real kerbs turn the corner on a curve rather
// than meeting square. For each pair of neighbouring arms at a junction, fill the square corner
// between the two road edges with a circular fillet (radius KERB_RETURN_RADIUS, the usual size of an
// urban kerb return), as a fan of small convex triangles from the corner point.
export const KERB_RETURN_RADIUS = 9;
export function kerbReturns(streets, radius = KERB_RETURN_RADIUS, arcs = null) {
  const nodes = new Map(), key = ([x, z]) => Math.round(x * 2) + ',' + Math.round(z * 2);
  streets.forEach((st, si) => st.pts.forEach((p, i) => {
    const k = key(p); if (!nodes.has(k)) nodes.set(k, { p, arms: [] });
    const n = nodes.get(k);
    for (const j of [i - 1, i + 1]) if (j >= 0 && j < st.pts.length) {
      const q = st.pts[j], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz);
      if (l > 1) n.arms.push({ si, ux: dx / l, uz: dz / l, a: Math.atan2(dz, dx), hw: (st.width || 7) / 2, kind: st.kind, len: l });
    }
  }));
  const out = [];
  for (const { p, arms } of nodes.values()) {
    if (new Set(arms.map(a => a.si)).size < 2) continue;          // a bend in one street, not a junction
    arms.sort((x, y) => x.a - y.a);
    for (let i = 0; i < arms.length; i++) {
      const A = arms[i], B = arms[(i + 1) % arms.length];
      let th = B.a - A.a; if (th <= 0) th += Math.PI * 2;
      if (th < 0.35 || th > 2.8) continue;                          // nearly parallel or straight through
      // Edge of A on B's side and edge of B on A's side; their intersection is the square corner C.
      const nA = [-A.uz, A.ux], nB = [B.uz, -B.ux];
      const pA = [p[0] + nA[0] * A.hw, p[1] + nA[1] * A.hw], pB = [p[0] + nB[0] * B.hw, p[1] + nB[1] * B.hw];
      const det = A.ux * B.uz - A.uz * B.ux; if (Math.abs(det) < 1e-6) continue;
      const t = ((pB[0] - pA[0]) * B.uz - (pB[1] - pA[1]) * B.ux) / det;
      const C = [pA[0] + A.ux * t, pA[1] + A.uz * t];
      const r = Math.min(radius, A.len * 0.45 * Math.tan(th / 2), B.len * 0.45 * Math.tan(th / 2));
      if (r < 1) continue;
      const L = r / Math.tan(th / 2);
      const T1 = [C[0] + A.ux * L, C[1] + A.uz * L], T2 = [C[0] + B.ux * L, C[1] + B.uz * L];
      const bx = A.ux + B.ux, bz = A.uz + B.uz, bl = Math.hypot(bx, bz) || 1, h = r / Math.sin(th / 2);
      const O = [C[0] + bx / bl * h, C[1] + bz / bl * h];
      const a1 = Math.atan2(T1[1] - O[1], T1[0] - O[0]); let a2 = Math.atan2(T2[1] - O[1], T2[0] - O[0]);
      let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      const steps = Math.max(3, Math.ceil(Math.abs(da) / 0.26)), arc = [];
      for (let k = 0; k <= steps; k++) { const ang = a1 + da * k / steps; arc.push([O[0] + Math.cos(ang) * r, O[1] + Math.sin(ang) * r]); }
      const kind = priority(A.kind) <= priority(B.kind) ? A.kind : B.kind;
      if (arcs) arcs.push({ O, r, a1, da, kinds: [A.kind, B.kind] });
      for (let k = 1; k < arc.length; k++) {
        const tri = [C, arc[k - 1], arc[k]];
        // counter-clockwise like roadQuad
        const s2 = (tri[1][0] - tri[0][0]) * (tri[2][1] - tri[0][1]) - (tri[1][1] - tri[0][1]) * (tri[2][0] - tri[0][0]);
        out.push({ pts: s2 < 0 ? [tri[0], tri[2], tri[1]] : tri, kind });
      }
    }
  }
  return out;
}

export function buildDisjointRoadSurfaces(streets, { highway = null } = {}) {
  const segments = [];
  for (const street of streets) for (let i = 1; i < street.pts.length; i++) {
    const a = street.pts[i - 1], b = street.pts[i];
    const asphalt = roadQuad(...a, ...b, street.width);
    if (!asphalt) continue;
    const kerbed = street.footpath !== false && /^(trunk|primary|secondary|tertiary|residential|unclassified)$/.test(street.kind);
    // One-sided footpath (street.footpathSide 'left'|'right' of the drawing direction): a 2.5 m strip
    // beside the carriageway on that side only.
    let sideFoot = null;
    if (kerbed && street.footpathSide) {
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l, sgn = street.footpathSide === 'left' ? 1 : -1;
      const nx = uz * sgn, nz = -ux * sgn, w0 = street.width / 2, w1 = w0 + 2.5, ext = street.width * 0.25;
      const P = (t, o) => [a[0] + ux * t + nx * o, a[1] + uz * t + nz * o];
      sideFoot = [P(-ext, w0), P(l + ext, w0), P(l + ext, w1), P(-ext, w1)];
      const sg = sideFoot.reduce((acc, p, i) => { const q = sideFoot[(i + 1) % 4]; return acc + p[0] * q[1] - q[0] * p[1]; }, 0);
      if (sg < 0) sideFoot.reverse();
    }
    segments.push({ kind: street.kind, asphalt, paving: street.paving || null,
      footpath: kerbed ? (sideFoot || roadQuad(...a, ...b, street.width + 5)) : null,
      index: segments.length });
  }
  // Higher-order roads have priority at a junction, giving deterministic
  // materials without interpenetrating top surfaces.
  segments.sort((a, b) => priority(b.kind) - priority(a.kind) || a.index - b.index);
  const occupied = new QuadIndex();
  if (highway) occupied.add([
    [highway.x0, highway.z - highway.width / 2],
    [highway.x1, highway.z - highway.width / 2],
    [highway.x1, highway.z + highway.width / 2],
    [highway.x0, highway.z + highway.width / 2],
  ]);
  const asphalt = [], footpaths = [];
  const insert = (quad, dest, kind, paving = null) => {
    let parts = [quad];
    for (const blocker of occupied.find(quad)) {
      parts = parts.flatMap(part => subtractConvex(part, blocker));
      if (!parts.length) break;
    }
    for (const pts of parts) if (area(pts) > AREA_EPS) dest.push(paving ? { pts, kind, paving } : { pts, kind });
    // The union of original footprints is equivalent to all visible fragments.
    occupied.add(quad);
  };
  // Every street, including service streets, cuts through footpath footprints.
  for (const segment of segments) insert(segment.asphalt, asphalt, segment.kind);
  // Curved kerb returns at junctions (after the straight carriageways, before footpaths, so the
  // footpath is cut to the same curve).
  // Drawn whole just below the carriageway (no fragmenting), but they still cut the footpaths.
  const fillets = kerbReturns(streets);
  for (const f of fillets) occupied.add(f.pts);
  for (const segment of segments) if (segment.footpath) insert(segment.footpath, footpaths, segment.kind, segment.paving);
  return { asphalt, footpaths, fillets };
}
