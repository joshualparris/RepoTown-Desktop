import { AVENUES, FIELD_Z0, FIELD_Z1, RAIL_Z } from './life.js';

// What the player is standing on, for footstep sound. Pure maths on the town layout (no three.js):
//   asphalt  — street and avenue carriageways        concrete — footpaths beside the streets
//   paver    — the High Street forecourts            dirt     — the farm fields south of street 8
//   gravel   — rail ballast                          grass    — everything else (lots, yards, verges)
// Inside buildings the floor comes from roomFloor().
const LOT_Z = 46, LOT8_Z = 7 * LOT_Z - 3.5 * LOT_Z, ROAD = (r) => r * LOT_Z - 3.5 * LOT_Z + 16;
const ROAD_HALF = 4.5, FOOTPATH_OUT = 6.1, AVENUE_HALF = 3.5, PAVER_X0 = -184, PAVER_X1 = 131;

export function surfaceAt(x, z) {
  if (Math.abs(z - RAIL_Z) < 2.2) return 'gravel';
  for (const a of AVENUES) if (Math.abs(x - a) < AVENUE_HALF) return 'asphalt';
  const r = Math.max(0, Math.min(7, Math.round((z - ROAD(0)) / LOT_Z))), dz = z - ROAD(r), adz = Math.abs(dz);
  if (adz < ROAD_HALF) return 'asphalt';
  if (adz < FOOTPATH_OUT) return 'concrete';
  if (r === 7 && x > PAVER_X0 && x < PAVER_X1) {
    if (dz < 0 && z > LOT8_Z + 6.4) return 'paver';
    if (dz > 0 && z < FIELD_Z0) return 'paver';
  }
  if (z >= FIELD_Z0 && z <= FIELD_Z1) return 'dirt';
  return 'grass';
}

const FLOORS = {
  cafe: 'tile', bakery: 'tile', butcher: 'tile', post: 'tile', clinic: 'tile', bank: 'tile',
  store: 'timber', greengrocer: 'timber', pub: 'timber', hall: 'timber', school: 'timber', farmhouse: 'timber', house: 'timber',
  hotel: 'carpet', sheep: 'straw', coop: 'straw',
};
export const roomFloor = (id) => FLOORS[id] || 'concrete';
export const SURFACE_NAMES = Object.freeze(['asphalt', 'concrete', 'paver', 'dirt', 'gravel', 'grass', 'timber', 'tile', 'carpet', 'straw']);
