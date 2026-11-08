// Kierath's Shopping Square: WGS84 anchored, plan-derived APPROXIMATE footprint.
// The 619x459 commercial diagram was bilinearly fitted to NSW traced 76 Dandaloo
// cadastral corners. Registration has no independent orthophoto tie-point residual;
// all door/tenancy positions are estimates, NEVER represented as survey geometry.
import { schematicPixelToGeo, KIERATHS_SCHEMATIC_UNITS } from './narromine-kieraths-schematic.js';

export const KIERATHS_ORIGIN = Object.freeze({ lat: -32.2325, lon: 148.2392 });
const METRES_PER_DEGREE = 111195;
const EAST_METRES_PER_DEGREE = METRES_PER_DEGREE * Math.cos(KIERATHS_ORIGIN.lat * Math.PI / 180);
export const siteToGeo = ([x, z]) => [KIERATHS_ORIGIN.lat - z / METRES_PER_DEGREE, KIERATHS_ORIGIN.lon + x / EAST_METRES_PER_DEGREE];
export const geoToSite = ([lat, lon]) => [(lon - KIERATHS_ORIGIN.lon) * EAST_METRES_PER_DEGREE, (KIERATHS_ORIGIN.lat - lat) * METRES_PER_DEGREE];
export const planPixelToSite = p => geoToSite(schematicPixelToGeo(p));
const closedArea = pts => Math.abs(pts.reduce((sum, p, i) => {
  const q = pts[(i + 1) % pts.length]; return sum + p[0] * q[1] - q[0] * p[1];
}, 0) / 2);
const centroid = pts => pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0,0]);
const targetArea = Object.freeze({ 1: 34, 2: 27, 3: 22, 4: 45, 8: 20, 9: 42, 10: 49 });
// Unit 2 = 27m² is only a visual-size estimate; the other target areas are
// legible on the user screenshot. These do not replace a surveyed lease outline.
// Centroid shrinking preserves approximate placement while constraining each
// polygon's area to the printed tenancy area; no false precision on the edges.
export const KIERATHS_SHOPS = Object.freeze(KIERATHS_SCHEMATIC_UNITS
  .filter(s => /^\d+$/.test(s.id))
  .map(s => {
    const raw = s.pixel.map(planPixelToSite), c = centroid(raw);
    const factor = Math.sqrt(targetArea[s.id] / closedArea(raw));
    const pts = raw.map(([x, z]) => Object.freeze([c[0] + (x - c[0]) * factor, c[1] + (z - c[1]) * factor]));
    return Object.freeze({ number: Number(s.id), pts: Object.freeze(pts), 
      areaM2: targetArea[s.id], areaVerified: s.areaM2 !== null,
      confidence: 'schematic-estimate', source: 'commercial diagram + NSW traced 76 Dandaloo parcel' });
  }));
export const KIERATHS_UNIT_IDS = Object.freeze([1,2,3,4,5,6,7,8,9,10]);
export const KIERATHS_EMBEDDED_UNITS = Object.freeze([5,6,7]); // M01 blue zone, no independent external building meshes

// Route follows the white pedestrian circulation between the physically separate
// shops, west-to-east: rear parking -> narrow rear passage -> offset junction ->
// wider street forecourt. Intermediate points resolve around the angled shop 3.
// The commercial diagram is schematic, so route widths are accessibility estimates.
const walkPixels = [
  [377,180],[377,220],[376,243],[376,268],[375,290],
  [362,305],[350,319],[352,326],[373,347],[381,353],
  [382,370],[380,387],
];
export const KIERATHS_ROUTE = Object.freeze(walkPixels.map(p => Object.freeze(planPixelToSite(p))));
export const KIERATHS_COURTYARD = Object.freeze([
  [373,350],[399,346],[420,365],[416,389],[369,389],[367,366]
].map(p => Object.freeze(planPixelToSite(p))));
export const KIERATHS_KIOSK = Object.freeze({ at: planPixelToSite([399,380]), radius: 1.4, height: 2.65 });
export const KIERATHS_CANOPY = Object.freeze({
  back: planPixelToSite([377,179]), front: planPixelToSite([377,201]), width: 7.2, eaves: 3.1, crown: 4.8,
});
// Historical parking trace retained until photo/orthophoto registration can
// establish actual wheel bays; not represented as a cadastral car-park survey.
export const KIERATHS_REAR_PARKING = Object.freeze([
  [-59.5, -43.6], [-43.1, -41.1], [-43.0, -28.2], [-62.0, -30.4],
].map(p => Object.freeze(p)));
export const KIERATHS_PROVENANCE = Object.freeze({
  plan: '619x459 commercial schematic: M01 (2,157 m²), units 1–4 and 8–10 outlined, 5–7 inside blue M01; image-fit estimated',
  aerial: 'NSW cadastral lot 76 / 82 / 74 Dandaloo outlines from narromine-buildings-data.js, original NSW aerial tracing',
  historical: 'User-supplied street and arcade photos, mixed dates, not verified 2026 current occupancy',
  metricAccuracy: 'unknown; provisional bilinear plan-to-lot fit, no orthophoto pixel control-point residual',
});
