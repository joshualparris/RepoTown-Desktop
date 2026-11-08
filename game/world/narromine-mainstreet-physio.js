// Narromine main-street photo-matched frontage — osm:186 only.
// The OSM 2026-11-03 polygon and 2023 NSW Spatial Services class-6 LiDAR remain
// authoritative for placement/height. Details not resolved from street photos
// are intentionally labelled estimated; no imported Google imagery or textures.
export const PHYSIO_FACADE = Object.freeze({
  osmIndex: 186,
  buildingId: 'NR-OSM-0187',
  businessName: 'Narromine Physiotherapy',
  edge: Object.freeze([1, 2]), // east, Dandaloo Street-facing OSM outline edge
  surveyedLidar: Object.freeze({ year: 2023, eaveProxyM: 3.78, ridgeProxyM: 8.07 }),
  source: 'OSM building osm:186 + NSW 2023 LiDAR + owner comparison screenshot #45 (reference only)',
  provenance: Object.freeze({
    footprint: 'mapped-osm',
    ridgeEnvelope: 'lidar-proxy',
    parapetSilhouette: 'photo-matched-estimated-dimensions',
    windowsDoorsAwningColours: 'photo-interpreted-estimated-dimensions',
    signageTenantDate: 'historical-streetview-unverified-current',
  }),
});

export function physiotherapyFrontEdge(building) {
  if (building?.osmIndex !== PHYSIO_FACADE.osmIndex) return null;
  const [aIndex, bIndex] = PHYSIO_FACADE.edge;
  const a = building.pts[aIndex], b = building.pts[bIndex];
  if (!a || !b) throw new Error('Physiotherapy frontage: surveyed edge missing');
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const length = Math.hypot(dx, dz);
  if (length < 8 || length > 17) throw new Error('Physiotherapy frontage: unexpected OSM edge length');
  const out = [dz / length, -dx / length];
  // The frontage faces east toward Dandaloo Street, not into the deep building.
  if (out[0] < 0.9) throw new Error('Physiotherapy frontage: outline orientation changed');
  return Object.freeze({
    a: Object.freeze([...a]), b: Object.freeze([...b]), length, yaw: -Math.atan2(dz, dx),
    tangent: Object.freeze([dx / length, dz / length]), outward: Object.freeze(out),
    midpoint: Object.freeze([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]),
  });
}

export function buildNarrominePhysiotherapyFacade({ THREE, building, push, addSign = null }) {
  const face = physiotherapyFrontEdge(building);
  if (!face) return null;
  if (!THREE || typeof push !== 'function') throw new Error('Physiotherapy façade requires Three.js and a geometry sink');
  const w = face.length, n = face.outward, t = face.tangent;
  const WHITE = 0xf0eee9, WHITE_EDGE = 0xd5d7d5, DARK_RECESS = 0x70868b;
  const DARK_GLASS = 0x28424b, METAL = 0x9daaad, FRAME = 0xcdd5d4;
  const AWNING = 0x93b2b8, GREEN = 0x397b76;
  let geometryCount = 0;
  const emit = (colour, geometry) => { push(colour, geometry); geometryCount++; };
  const where = (along, outward = 0) => [
    face.a[0] + t[0] * along + n[0] * outward,
    face.a[1] + t[1] * along + n[1] * outward,
  ];
  const box = (colour, width, height, depth, along, y, outward) => {
    const [x, z] = where(along, outward);
    const geo = new THREE.BoxGeometry(width, height, depth);
    geo.rotateY(face.yaw);
    geo.translate(x, y, z);
    emit(colour, geo);
  };

  // Overlay: one street-facing render wall, not a second building footprint or collider.
  box(WHITE, w - 0.04, 5.80, 0.09, w / 2, 2.90, 0.15);

  // The photograph's identity comes from a convex central Dutch gable between
  // two squared side piers. Shape is photo-interpreted, NOT surveyed dimension.
  const profile = new THREE.Shape();
  profile.moveTo(-w / 2, 5.70);
  profile.lineTo(-w / 2, 7.05);
  profile.lineTo(-w * 0.40, 7.05);
  profile.lineTo(-w * 0.40, 6.08);
  profile.quadraticCurveTo(-w * 0.30, 6.03, -w * 0.24, 6.50);
  profile.quadraticCurveTo(-w * 0.12, 7.73, 0, 7.98);
  profile.quadraticCurveTo(w * 0.12, 7.73, w * 0.24, 6.50);
  profile.quadraticCurveTo(w * 0.30, 6.03, w * 0.40, 6.08);
  profile.lineTo(w * 0.40, 7.05);
  profile.lineTo(w / 2, 7.05);
  profile.lineTo(w / 2, 5.70);
  profile.closePath();
  const parapet = new THREE.ExtrudeGeometry(profile, {
    depth: 0.12, bevelEnabled: false, steps: 1, curveSegments: 16,
  });
  parapet.rotateY(face.yaw);
  parapet.translate(face.midpoint[0] + n[0] * 0.24, 0, face.midpoint[1] + n[1] * 0.24);
  emit(WHITE, parapet);

  // Vertical weathered pilasters and the shallow roof-line plaque.
  for (const along of [0.33, w - 0.33]) {
    box(WHITE_EDGE, 0.12, 1.40, 0.16, along, 6.31, 0.36);
    box(DARK_RECESS, 0.11, 0.62, 0.045, along, 6.63, 0.48);
  }
  box(WHITE_EDGE, 1.6, 0.35, 0.15, w / 2, 6.84, 0.39);
  box(WHITE_EDGE, 0.18, 0.60, 0.18, w / 2, 8.03, 0.35);

  // Recessed aluminium/glass shopfront: three bays and a centre cosmetic door.
  // These DO NOT invent accessible interiors or add collision geometry.
  const unit = (w - 1.3) / 3;
  for (let i = 0; i < 3; i++) {
    const s = 0.65 + (i + 0.5) * unit;
    box(FRAME, unit - 0.09, 2.55, 0.08, s, 1.60, 0.24);
    box(DARK_GLASS, unit - 0.25, 2.31, 0.08, s, 1.65, 0.30);
    box(FRAME, 0.055, 2.38, 0.12, s, 1.65, 0.35);
    box(FRAME, unit - 0.1, 0.06, 0.12, s, 2.14, 0.36);
    box(WHITE_EDGE, unit - 0.04, 0.10, 0.10, s, 0.36, 0.32);
    if (i === 1) {
      box(FRAME, 1.24, 2.40, 0.11, s, 1.58, 0.41);
      box(DARK_GLASS, 1.07, 2.23, 0.07, s, 1.58, 0.49);
      box(METAL, 0.055, 0.29, 0.065, s + 0.33, 1.20, 0.57);
    }
  }
  // Shallow corrugated verandah over the REAL footpath: no posts/meshes in
  // the road geometry contract; supports are visual only with no new collider.
  box(AWNING, w + 0.22, 0.12, 2.42, w / 2, 3.16, 1.38);
  box(GREEN, w + 0.22, 0.56, 0.11, w / 2, 2.99, 2.62);
  box(METAL, w + 0.24, 0.08, 0.14, w / 2, 3.26, 2.68);
  for (const along of [0.48, w - 0.48]) {
    box(METAL, 0.075, 2.95, 0.075, along, 1.49, 2.52);
  }
  // The tenant text is an historical photographed sign, not a claim that it
  // remains the current tenancy. The caller owns DOM texture creation.
  if (addSign) {
    const [x, z] = where(w / 2, 2.73);
    addSign({ name: PHYSIO_FACADE.businessName, x, z, y: 2.99,
      width: Math.min(w - 1.0, 10.0), height: 0.44, normal: n });
  }
  return Object.freeze({ osmIndex: PHYSIO_FACADE.osmIndex, geometryCount, front: face, collidersAdded: 0 });
}
