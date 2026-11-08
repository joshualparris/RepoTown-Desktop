// A civic doorway is a WORLD transition outside the solid exterior collider.
// Both south-side industrial sites and the new row 2–7 north-facing infill have
// street entrances toward -Z. Legacy High Street shops face +Z.
export const civicStreetDirection = place =>
  place?.side === 'south' || place?.side === 'north' ? -1 : 1;
export function civicEntranceZone(place) {
  if(civicStreetDirection(place)<0)return {
    x0:place.door.x-1.0,x1:place.door.x+1.0,
    z0:place.door.z-1.55,z1:place.door.z+0.20
  };
  return {
    x0:place.door.x-0.93,x1:place.door.x+0.93,
    z0:place.door.z-0.12,z1:place.door.z+1.35
  };
}
export function atCivicEntrance(place,pos) {
  if(!place||!pos)return false;
  const b=civicEntranceZone(place);
  return pos.x>b.x0&&pos.x<b.x1&&pos.z>=b.z0&&pos.z<=b.z1;
}
export function closedCivicDoorPose(place,pos) {
  // Put the visitor OUTSIDE the entire sensor, not in a repeat-trigger loop.
  // Keep the direction they were facing so the rejection feels natural.
  return {x:pos.x,z:place.door.z + civicStreetDirection(place)*1.90};
}
