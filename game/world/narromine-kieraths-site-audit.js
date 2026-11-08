// Phase 1 cartographic evidence model for Kierath's Shopping Square.
// WGS84 positions from the NSW aerial/cadastre tracing in narromine-buildings-data.js;
// estimated tenancy footprints are exported separately, never described as surveyed.
// This file is DATA, not Three.js geometry. Consumers may show confidence/source labels.
import { NARROMINE_BUILDINGS } from './narromine-buildings-data.js';
import { schematicPixelToGeo, KIERATHS_SCHEMATIC_UNITS } from './narromine-kieraths-schematic.js';
import { siteToGeo, KIERATHS_ROUTE, KIERATHS_SHOPS, KIERATHS_KIOSK,
  KIERATHS_CANOPY, KIERATHS_REAR_PARKING, KIERATHS_UNIT_IDS, KIERATHS_EMBEDDED_UNITS, KIERATHS_COURTYARD } from './narromine-kieraths-data.js';

const required = (id) => {
  const b = NARROMINE_BUILDINGS.find(b => b.id === id);
  if (!b || !Array.isArray(b.boundary) || b.boundary.length < 4)
    throw new Error('Kieraths phase 1 requires NSW traced cadastre polygon: ' + id);
  return b;
};
const parcels = [
  ['dandaloo-76', 'Kierath\'s Shopping Square parcel'],
  ['dandaloo-82', 'Coles / 82 Dandaloo parcel'],
  ['narromine-post-office', 'Post Office / 74 Dandaloo parcel'],
];
const coord = ([lat, lon]) => [lon, lat]; // GeoJSON uses longitude, latitude
const ring = (latLon) => {
  const r = latLon.map(coord);
  if (r[0][0] !== r.at(-1)[0] || r[0][1] !== r.at(-1)[1]) r.push([...r[0]]);
  return r;
};
const feature = (id, label, geometry, source, confidence, extra = {}) => ({
  type: 'Feature', properties: { id, label, source, confidence, ...extra }, geometry,
});
const poly = (p) => ({ type: 'Polygon', coordinates: [ring(p)] });
const toGeo = (p) => siteToGeo(p);
const scoped = (p) => p.map(toGeo);
const layer = [];
for (const [id, label] of parcels) {
  const b = required(id);
  layer.push(feature(id, label, poly(b.boundary), 'NSW cadastral tracing in narromine-buildings-data.js', 'traced-boundary',
    { address: b.address, note: 'Original NSW lot trace; NOT the tenancies or surveyed individual doors' }));
}
// Schematic-derived overlay, intentionally kept SEPARATE from legacy in-game geometry.
// This shows where the supplied diagram suggests actual tenancy shapes should lie;
// it is not yet substituted for live geometry without aerial/photo fit verification.
for (const unit of KIERATHS_SCHEMATIC_UNITS) {
  layer.push(feature('schematic-unit-' + unit.id, 'Diagram unit ' + unit.id,
    poly(unit.pixel.map(schematicPixelToGeo)),
    'Josh-supplied commercial screenshot (visually traced) + approximate 76 parcel fit',
    'estimated', { diagramLabel: unit.id, sourcePixels: unit.pixel,
      ambiguous: Boolean(unit.ambiguous), note: unit.provenance + '; schematic, not surveyed or confirmed current tenant' }));
}
// Visual reference plan establishes number/order and connectivity, but not metric scale.
for (const s of KIERATHS_SHOPS)
  layer.push(feature('kieraths-unit-' + s.number, 'Physical exterior unit ' + s.number, poly(scoped(s.pts)),
    'Approximation from 3 Nov commercial diagram; check against aerial/control points', 'estimated',
    { unit: s.number, side: s.side, note: 'NOT a cadastral/shop-lease survey or confirmed current tenancy' }));
layer.push(feature('kieraths-courtyard', 'Open paved courtyard estimated boundary', poly(scoped(KIERATHS_COURTYARD)),
  'Commercial diagram + ground-level courtyard photograph', 'estimated',
  { note: 'Open to sky; supports walking/turning, no collider' }));
layer.push(feature('kieraths-walkway', 'Dandaloo to rear car park pedestrian centreline',
  { type: 'LineString', coordinates: KIERATHS_ROUTE.map(p => coord(toGeo(p))) },
  'Approximate game route constrained by 76 Dandaloo cadastre', 'estimated',
  { note: 'Clearance tested in narromine-layout.mjs; exact courtyard outline unregistered' }));
layer.push(feature('kieraths-kiosk', 'Round street-side kiosk',
  { type: 'Point', coordinates: coord(toGeo(KIERATHS_KIOSK.at)) },
  'Supplied commercial diagram + photos', 'estimated',
  { radius_m_estimate: KIERATHS_KIOSK.radius, note: 'Point approximate; radius not surveyed' }));
layer.push(feature('kieraths-rear-arch', 'Rear car park arched canopy axis',
  { type: 'LineString', coordinates: [KIERATHS_CANOPY.back, KIERATHS_CANOPY.front].map(p => coord(toGeo(p))) },
  'Historical rear-facing photograph, site diagram', 'estimated',
  { width_m_estimate: KIERATHS_CANOPY.width, note: 'Distinct from low street entrance awning' }));
layer.push(feature('kieraths-rear-parking', 'Rear parking approximate outline', poly(scoped(KIERATHS_REAR_PARKING)),
  'NSW cadastre constraints, historic photos', 'estimated'));
// Aerial masses are archived as visual evidence, NOT reinstated as collision solids.
for (const [i, b] of (required('dandaloo-76').originalAerialMassing || []).entries())
  layer.push(feature('historical-aerial-mass-' + (i + 1), b.name, poly(b.pts),
    'Historical NSW aerial massing (superseded by open-air passage evidence)', 'historical-unverified',
    { render: false, note: 'Not a valid shop polygon; must not obstruct arcade walkway' }));

export const KIERATHS_PHASE1_GEOJSON = Object.freeze({
  type: 'FeatureCollection',
  name: 'Kieraths Narromine: cadastre vs estimated arcade (WGS84)',
  features: layer,
});
export const KIERATHS_PHASE1_TOPOLOGY = Object.freeze({
  street: 'Dandaloo Street',
  sideStreet: 'Nymagee Street',
  separateParcels: ['dandaloo-76', 'dandaloo-82', 'narromine-post-office'],
  unitIds: KIERATHS_UNIT_IDS,
  separateExteriorShopIds: KIERATHS_SHOPS.map(s => s.number),
  embeddedInColes: KIERATHS_EMBEDDED_UNITS,
  circulation: { streetEnd: KIERATHS_ROUTE.at(-1), carParkEnd: KIERATHS_ROUTE[0], openToSky: true },
  canopy: { rear: 'kieraths-rear-arch', street: 'low/angular awning (image verified; not yet dimensioned)' },
  planRegistration: 'UNREGISTERED — schematic supplied without surveyed scale/control-point coordinates',
});
