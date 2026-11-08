// N5-N is a compact fictional NSW community interchange, not a coach terminal.
// Local +Z is the street facade. TownLife rotates this model 180° for row 5-N.
// Dimensions in game metres; physical standards are reference principles only.
export const BUS_LAYOUT = Object.freeze({
  width: 10, depth: 7, face: 7, rear: 0, height: 3.45,
  entryHalfWidth: 1.25,
  waiting: Object.freeze({x0:-4.7,x1:4.7,z0:0.25,z1:6.75}),
  centralClear: Object.freeze({x0:-1.25,x1:1.25,z0:0.7,z1:7}),
  boarding: Object.freeze({x:-3.25,z:8.65,width:3.15,depth:2.25}),
  priority: Object.freeze([{x:3.45,z:4.75},{x:3.45,z:3.15}]),
  assistance: Object.freeze({x:-3.25,z:1.15,visitorX:-2.0,visitorZ:2.45}),
  signs: Object.freeze({stopX:-4.65,stopZ:8.15,tactileX:-3.25,tactileZ:8.78}),
});
export const BUS_DESIGN_REFERENCES = Object.freeze([
  'TfNSW TS 04951.4 (2024): accessible boarding point, 150 mm kerb where built, seating, shade, clear paths.',
  'AHRC accessible bus stop guideline: 2070 x 1540 mm wheelchair manoeuvring zone and >=1200 mm continuous clear path.',
  'TfNSW Bus Stop Urban Design Guideline (2025): four zones, sightlines, passenger information and shelter.'
]);