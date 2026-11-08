// Evidence-led Dandaloo Street surface plan. Coordinates are Repository Town world metres.
// OSM provides the *road centrelines*; planting, parking markings and furniture spacing
// remain estimates pending photographic/survey alignment. Never imply survey accuracy.
// Source: OSM 2026-11-03; Narromine Shire Dandaloo St South streetscape design (2019);
// NSW 42 Dandaloo St SEE (2023); Josh's 2026-11-04 side-by-side visual comparisons.
// Google Street View images are NOT copied into this repository.

export const DANDALOO_STREETSCAPE_EVIDENCE = Object.freeze({
  alignment: 'OpenStreetMap Dandaloo Street dual trunk-road centrelines (2026-11-03)',
  physicalDetails: 'Narromine Shire Dandaloo Street South streetscape plan and 2023 planning photos',
  photographs: 'Josh 2026-11-[address redacted] View vs game comparisons; reference only',
  confidence: Object.freeze({
    dualRoadPosition: 'mapped',
    medianFootprint: 'derived from mapped road-edge clearance; requires survey',
    angleParkingSpacing: 'approximate, 60-degree illustrative',
    lampsTreesPalmPositions: 'unverified individual positions: not rendered pending object-level evidence',
  }),
});

// Leave the mapped Burraway, Nymagee and Meringo intersections open. The two
// OSM carriageways split at Burraway (~z -853) and meet near Meringo (~z -1184).
// Gaps around crossings avoid decorating through moving traffic or cross-streets.
export const LANDSCAPED_BANDS = Object.freeze([
  Object.freeze({ upperZ: -877, lowerZ: -932 }),
  Object.freeze({ upperZ: -979, lowerZ: -1165 }),
]);

export function roadXAtZ(road, z) {
  for (let i = 1; i < road.pts.length; i++) {
    const a = road.pts[i - 1], b = road.pts[i];
    if (z >= Math.min(a[1], b[1]) - 1e-6 && z <= Math.max(a[1], b[1]) + 1e-6
      && Math.abs(b[1] - a[1]) > 1e-5) {
      const t = (z - a[1]) / (b[1] - a[1]);
      return a[0] + (b[0] - a[0]) * t;
    }
  }
  return null;
}

export function findDandalooCarriageways(streets) {
  const roads = streets.filter(s => s.name === 'Dandaloo Street' && s.kind === 'trunk'
    && roadXAtZ(s, -1050) !== null && roadXAtZ(s, -1100) !== null);
  if (roads.length !== 2) throw Error('Expected two OSM Dandaloo carriageways near Nymagee/Meringo; found ' + roads.length);
  return roads.sort((a, b) => roadXAtZ(a, -1050) - roadXAtZ(b, -1050));
}

export function planDandalooStreetscape(streets) {
  const [west, east] = findDandalooCarriageways(streets);
  const medians = [], kerbs = [], pavers = [], parking = [], trees = [], lamps = [];
  const at = z => {
    const wx = roadXAtZ(west, z), ex = roadXAtZ(east, z);
    if (wx === null || ex === null) throw Error('Unmapped Dandaloo median point at z=' + z);
    // Clear each full carriageway plus 0.[address redacted] edge.
    const clear = ex - wx - (west.width + east.width) / 2 - 0.90;
    if (clear < 1.1) throw Error('Mapped median clearance too narrow at z=' + z);
    const cx = (wx + ex) / 2, hw = Math.min(4.2, clear) / 2;
    return { wx, ex, cx, hw };
  };
  const quad = (a, b, halfWidth) => [
    [a[0] - halfWidth, a[1]], [a[0] + halfWidth, a[1]],
    [b[0] + halfWidth, b[1]], [b[0] - halfWidth, b[1]],
  ];
  for (const band of LANDSCAPED_BANDS) {
    for (let z = band.upperZ; z > band.lowerZ; z -= 7) {
      const zz = Math.max(z - 7, band.lowerZ);
      const a = at(z), b = at(zz);
      // Disjoint quad boundaries at a shared z: no coplanar overlap.
      medians.push({ pts: [
        [a.cx - a.hw, z], [a.cx + a.hw, z],
        [b.cx + b.hw, zz], [b.cx - b.hw, zz],
      ], grass: Math.floor(Math.abs(z)) % 3 !== 0 });
      for (const side of [-1, 1]) {
        const innerA = a.cx + side * a.hw, innerB = b.cx + side * b.hw;
        kerbs.push({ a: [innerA, z], b: [innerB, zz], kind: 'median' });
        const external = side < 0 ? { x0: a.wx - west.width / 2, x1: b.wx - west.width / 2 }
          : { x0: a.ex + east.width / 2, x1: b.ex + east.width / 2 };
        kerbs.push({ a: [external.x0, z], b: [external.x1, zz], kind: 'outside' });
        // The mapped 2.5-m sidewalk strip remains traversable. This red-brick
        // surface is only a visual overlay; no raised obstruction/collider.
        const offset = side < 0 ? -1.25 : 1.25;
        pavers.push({ pts: quad([external.x0 + offset, z], [external.x1 + offset, zz], 1.0) });
      }
    }
    for (let z = band.upperZ - 7; z > band.lowerZ + 7; z -= 6.0) {
      const a = at(z), b = at(z - 2.15);
      // Painted 60-degree rear-to-kerb bay separator: 3.7 m inward, 2.15 m along.
      parking.push({ a: [a.wx - west.width / 2 + 0.17, z],
        b: [b.wx - west.width / 2 + 3.87, z - 2.15], side: 'west' });
      parking.push({ a: [a.ex + east.width / 2 - 0.17, z],
        b: [b.ex + east.width / 2 - 3.87, z - 2.15], side: 'east' });
    }
  }
  // NR-REAL-001: road centrelines and photographs of the general street do not
  // establish individual object positions. The former 11 trees and nine lamps
  // used indicative z coordinates, not a geolocated inventory. Keep these lists
  // empty until each object has dated location-specific evidence. This is NOT a
  // claim that real northern Dandaloo Street has no vegetation or streetlights.
  // Separately evidenced site-owned vegetation is rendered by its own builder.
  return { medians, kerbs, pavers, parking, trees, lamps, source: DANDALOO_STREETSCAPE_EVIDENCE };
}

// ── South Dandaloo Street (single carriageway): Narromine Hotel → St Mary's ─────────────────────
// OSM maps this stretch as one 9-m secondary road from the Burraway split (~z -853) south past
// Derribong Avenue to Terangion Street. Kerbs follow the mapped road edge; street trees, swan-neck
// lamps and the east-side power line are placed at regular, ESTIMATED spacing on the verges and are
// skipped wherever a cross street, driveway, mapped building or detailed lot would be in the way.
export const SOUTH_RANGE = Object.freeze({ upperZ: -846, lowerZ: -262 });
export const SOUTH_EVIDENCE = Object.freeze({
  alignment: 'OpenStreetMap Dandaloo Street secondary centreline (2026-11-03)',
  spacing: 'none: estimated trees, lamps and poles removed (owner direction 4 Nov 2026); kerbs follow the mapped road edge',
  note: 'Josh compares by eye with Street View; no Street View imagery is used as data.',
});

export function findDandalooSouth(streets) {
  const pieces = streets.filter(s => s.name === 'Dandaloo Street' && s.kind === 'secondary');
  const pts = pieces.flatMap(s => s.pts).filter(p => p[1] >= SOUTH_RANGE.upperZ - 10 && p[1] <= SOUTH_RANGE.lowerZ + 160);
  if (pts.length < 4) throw Error('South Dandaloo Street centreline not found');
  const uniq = [...new Map(pts.map(p => [p[0].toFixed(2) + ',' + p[1].toFixed(2), p])).values()];
  return { width: pieces[0].width, pts: uniq.sort((a, b) => a[1] - b[1]) };
}

// clear(x, z, r): true when a point (with radius r) is free of buildings, lots and other roads.
export function planDandalooSouth(streets, clear = () => true) {
  const road = findDandalooSouth(streets), half = road.width / 2, kerbs = [], trees = [], lamps = [], poles = [];
  // Cross streets and driveways meeting Dandaloo: decorations keep 10 m away from their mouths.
  const mouths = streets.filter(s => s.name !== 'Dandaloo Street' && s.pts.some(([x, z]) => {
    const cx = roadXAtZ(road, z); return cx !== null && z >= SOUTH_RANGE.upperZ && z <= SOUTH_RANGE.lowerZ && Math.abs(x - cx) < half + 3;
  })).map(s => s.pts.find(([x, z]) => { const cx = roadXAtZ(road, z); return cx !== null && Math.abs(x - cx) < half + 3; }));
  const nearMouth = (z, m = 10) => mouths.some(p => Math.abs(p[1] - z) < m);
  // Unit normal pointing east (+x side) at z, from the local road direction.
  const frame = (z) => { const cx = roadXAtZ(road, z), cx2 = roadXAtZ(road, z + 1); if (cx === null || cx2 === null) return null;
    const dx = cx2 - cx, l = Math.hypot(dx, 1); return { cx, nx: 1 / l, nz: -dx / l }; };
  for (let z = SOUTH_RANGE.upperZ; z < SOUTH_RANGE.lowerZ; z += 6) {
    const zz = Math.min(z + 6, SOUTH_RANGE.lowerZ), a = frame(z), b = frame(zz);
    if (!a || !b || nearMouth((z + zz) / 2, 6)) continue;
    for (const side of [-1, 1]) {
      // No kerb where the edge runs through sealed ground (e.g. the Narromine Hotel forecourt).
      const mx = (a.cx + b.cx) / 2 + side * (half + 0.08) * a.nx, mz = (z + zz) / 2 + side * (half + 0.08) * a.nz;
      if (!clear(mx, mz, 0, 'kerb')) continue;
      kerbs.push({ a: [a.cx + side * (half + 0.08) * a.nx, z + side * (half + 0.08) * a.nz],
      b: [b.cx + side * (half + 0.08) * b.nx, zz + side * (half + 0.08) * b.nz], side: side < 0 ? 'west' : 'east' });
    }
  }
  // Only mapped geometry is built. Street trees, lamps and power poles were spaced by estimate,
  // and the owner's Street View check (4 Nov 2026) found the trees were not there. Add each
  // feature back only at a surveyed position (OSM node, LiDAR detection or photo-matched point).
  return { kerbs, trees, lamps, poles, source: SOUTH_EVIDENCE };
}
