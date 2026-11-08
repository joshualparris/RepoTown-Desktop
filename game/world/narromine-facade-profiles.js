// Evidence-tagged, deterministic visual treatments for Narromine's UNSURVEYED facades.
// NSW aerial/LiDAR constrain mapped footprints and roof heights; they DO NOT give
// window rhythm, paint, tenant identity or door positions. These treatments are
// deliberately labelled estimated, even when the building's footprint is surveyed.
// Keep this pure (no Three.js or browser dependency) for tests and future fidelity UI.

const PALETTES = Object.freeze([
  Object.freeze({ wall: 0xb99178, pier: 0x986e5d, trim: 0xe5d9c6, roofEdge: 0x958d80 }),
  Object.freeze({ wall: 0xc7b8a0, pier: 0xa58b74, trim: 0xeee5d5, roofEdge: 0x7d8282 }),
  Object.freeze({ wall: 0xa56f57, pier: 0x895c4a, trim: 0xdccfbb, roofEdge: 0x80868a }),
  Object.freeze({ wall: 0xb9b6a9, pier: 0x92948e, trim: 0xe8e6dd, roofEdge: 0x676e70 }),
  Object.freeze({ wall: 0xd1b79a, pier: 0xb39272, trim: 0xf1e5d3, roofEdge: 0x777a7a }),
]);
const WINDOW = Object.freeze({ glass: 0x344c58, frame: 0x33383b, door: 0x46565a, handle: 0xc6c0ad });
const checksum = (value) => {
  let h = 2166136261;
  for (const ch of String(value).toLowerCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

export function estimatedShopfrontProfile({ name = '', kind = '', street = '' } = {}) {
  const key = [name, kind, street].join('|');
  const palette = PALETTES[checksum(key) % PALETTES.length];
  const category = /hotel|pub|tavern/i.test(name + ' ' + kind) ? 'country-hotel'
    : /garage|service_station|industrial|hardware|mechanic/i.test(name + ' ' + kind) ? 'service-workshop'
    : /post_office|library|museum|civic|town_hall/i.test(name + ' ' + kind) ? 'civic-shop'
    : 'main-street-shop';
  return Object.freeze({
    key: category, evidenceLevel: 'estimated',
    sources: Object.freeze(['osm-street-or-place', 'regional-architectural-interpretation']),
    wall: palette.wall, pier: palette.pier, trim: palette.trim,
    roofEdge: palette.roofEdge, ...WINDOW,
  });
}

// Bay centre positions are relative to the mapped wall's start, never extra
// road-side volumes. One visually marked doorway per frontage; NO door collider
// or playable entry is introduced by these purely cosmetic details.
export function facadeBays(span, { maxBays = 8, targetWidth = 3.25 } = {}) {
  if (!Number.isFinite(span) || span < 2.4) return [];
  const n = Math.max(1, Math.min(maxBays, Math.floor(span / targetWidth)));
  return Object.freeze(Array.from({ length: n }, (_, index) => Object.freeze({
    t: (index + 0.5) / n, width: Math.min(2.6, span / n - 0.65),
    door: index === Math.floor(n / 2),
  })));
}

// Historical hotel street edges are identified from cadastral quads and the
// position of their surveyed verandahs. Window/door rhythm is NOT measured.
// edge indices use the four corners in narromine-buildings-data.js.
const HOTEL_FRONTS = Object.freeze({
  'royal-hotel|front': Object.freeze({ edge: Object.freeze([3, 0]), storeys: 1, evidenceLevel: 'estimated', evidence: 'aerial front/roof and verandah traced; street fenestration inferred' }),
  'narromine-hotel|Dandaloo Street wing': Object.freeze({ edge: Object.freeze([1, 2]), storeys: 2, evidenceLevel: 'estimated', evidence: 'aerial wing/iron-lace verandah known; opening positions inferred' }),
  'narromine-hotel|Derribong Avenue wing': Object.freeze({ edge: Object.freeze([2, 3]), storeys: 2, evidenceLevel: 'estimated', evidence: 'aerial corner wing and two-level verandah known; opening positions inferred' }),
});
export function landmarkFacadeSpec(buildingId, partName) {
  return HOTEL_FRONTS[buildingId + '|' + partName] ?? null;
}
