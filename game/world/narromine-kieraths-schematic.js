// Phase 1 provisional registration of Josh's 3 Nov 2026 commercial diagram.
// This is a CADASTRE-BOUNDED SCHEMATIC FIT, *not* an orthophoto control-point survey.
// Pixels refer to the original 619 x 459 plan screenshot (not a cropped/resized image).
// IMPORTANT: the diagram has 1–4, 8–10 as distinct dark/pink units, while '5–7'
// appears INSIDE THE BLUE COLES/MAJOR TENANCY outline. Do not manufacture two
// separate exterior shop buildings for 5–7 from this evidence.
const imageSize = Object.freeze([619, 459]);
// Map schematic horizontal direction to actual north/south parcel separation;
// map diagram top (rear car park) toward actual west and bottom toward eastern
// Dandaloo frontage. Bound using four existing cadastral parcel corners.
// These ties are a *visual fit* to the 76 Dandaloo boundary and not measured
// homologous plan/orthophoto control points. Residual error is unknown.
export const KIERATHS_SCHEMATIC_TIES = Object.freeze([
  { pixel: [341, 390], geo: [-32.2323505, 148.2393169], description: 'south side / street end, 76 parcel' },
  { pixel: [426, 390], geo: [-32.2321954, 148.2393443], description: 'north side / street end, 76 parcel' },
  { pixel: [341, 177], geo: [-32.2322446, 148.2384965], description: 'south side / rear end, 76 parcel' },
  { pixel: [426, 177], geo: [-32.2320939, 148.2385461], description: 'north side / rear end, 76 parcel' },
]);
const interp = (a, b, t) => a + (b - a) * t;
export function schematicPixelToGeo([px, py]) {
  const u = (px - 341) / (426 - 341), v = (py - 177) / (390 - 177);
  // Bilinear map of the cadastral parcel quadrilateral.
  // No exact door coordinate accuracy is claimed.
  const [sStreet, nStreet, sRear, nRear] = KIERATHS_SCHEMATIC_TIES.map(p => p.geo);
  const south = sRear.map((val, i) => interp(val, sStreet[i], v));
  const north = nRear.map((val, i) => interp(val, nStreet[i], v));
  return south.map((val, i) => interp(val, north[i], u));
}
const rect = (x0, y0, x1, y1) => [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
// Traced to approximately 2–5 pixels from the user-supplied small screenshot;
// angled details are polygon outlines only. Listed IDs are plan labels, NOT
// claims about modern tenants, surveyed lease lines, or verified door locations.
// Printed areas are leased-unit measurements read from the screenshot, not
// inferred from screenshot dimensions. Unit 2's small print remains uncertain.
export const KIERATHS_SCHEMATIC_UNITS = Object.freeze([
  { id: '1', areaM2: 34, pixel: rect(341,362,370,390), provenance: 'pink front-left unit beside Dandaloo' },
  { id: '2', areaM2: null, pixel: [[341,331],[355,331],[370,345],[370,362],[341,362]], provenance: 'diagonal shop beside Coles; printed floor area illegible' },
  { id: '3', areaM2: 22, pixel: [[370,301],[383,287],[399,306],[399,345],[374,345],[357,321]], provenance: 'angled central courtyard shop' },
  { id: '4', areaM2: 45, pixel: [[399,304],[426,304],[426,356],[416,356],[399,343]], provenance: 'right-hand central courtyard shop' },
  { id: '5–7', areaM2: null, pixel: [[341,177],[371,177],[371,284],[357,300],[341,300]], provenance: '5–7 printed within blue M01 / major Coles tenancy; NOT separately outlined arcade buildings', ambiguous: true, embeddedIn: 'M01' },
  { id: '8', areaM2: 20, pixel: rect(383,282,426,303), provenance: 'thin unit immediately rearward of unit 3' },
  { id: '9', areaM2: 42, pixel: rect(383,250,426,282), provenance: 'middle rear-side unit' },
  { id: '10', areaM2: 49, pixel: rect(383,177,426,217), provenance: 'rear-side unit nearest rear parking; its entrance is beside, not through, this unit' },
]);
export const KIERATHS_SCHEMATIC_REGISTRATION = Object.freeze({
  imageSize,
  controlPointType: 'PROVISIONAL VISUAL PARCEL-CORNER FIT',
  surveyed: false,
  measuredRmsResidualMetres: null,
  accuracy: 'unknown',
  planRightIs: 'north / toward Post Office',
  planBottomIs: 'east / Dandaloo Street',
  planTopIs: 'west / rear parking',
  note: 'Not a metric floor plan. Distances in the diagram may be distorted or schematised.',
});
