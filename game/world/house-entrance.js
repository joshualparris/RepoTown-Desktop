// A house's visual door and collision gap are real, but entrance detection
// must begin far enough outside the facade for mobile/low-FPS movement.
// The old +0.6m sensor left only ~0.19m beyond the collision radius; a
// single low-FPS walking step could pass completely over the usable area.
export function houseEntranceZone(doorPos, fp) {
  if (!doorPos || !fp?.door || !Number.isFinite(doorPos.x) || !Number.isFinite(doorPos.z))
    throw new TypeError('House entrance needs a real door');
  const halfWidth = fp.door.w / 2 - 0.15;
  if (!(halfWidth > 0)) throw new RangeError('House doorway is too narrow');
  return {
    x0: doorPos.x - halfWidth, x1: doorPos.x + halfWidth,
    z0: doorPos.z - 0.1, z1: doorPos.z + 2.25,
  };
}
