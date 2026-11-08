// Bicycle model footprint: the wheels are centred 0.55m ahead/behind the
// rider, and the handlebar/frame extends about 0.40m across. Testing only the
// cyclist's centre lets the front wheel enter a lamp post or wall.
export const BIKE_HALF_WHEELBASE = 0.55;
export const BIKE_WHEEL_CLEARANCE = 0.43;

// Heading is unit travel vector (dx,dz). Return false if either wheel or the
// rider would intersect a pole, building, truck or other world collider.
export function bicycleClear(world, x, z, dx, dz, extra = 0) {
  if (!world?.hits) return true;
  const len = Math.hypot(dx, dz);
  if (!len || !Number.isFinite(len)) return false;
  const ux = dx / len, uz = dz / len, r = BIKE_WHEEL_CLEARANCE + extra;
  for (const a of [-BIKE_HALF_WHEELBASE, 0, BIKE_HALF_WHEELBASE]) {
    if (world.hits(x + ux * a, z + uz * a, r)) return false;
  }
  return true;
}

// Cycle in the dedicated road-edge track until close to the destination,
// where riders dismount before moving onto the pedestrian footpath.
// Drivers occupy lanes nearer the road centre; lamp posts sit at ±6.0m.
export function cyclingRoute(points, start, end, roadAt) {
  if (points.length < 2) return points;
  const out = points.map(p => ({...p}));
  const ra = roadAt(start.z), rb = roadAt(end.z);
  const sideA = start.z >= ra ? 1 : -1, sideB = end.z >= rb ? 1 : -1;
  const startCycleZ = ra + sideA * 3.65;
  const endCycleZ = rb + sideB * 3.65;
  // Entrances and exits remain unmodified; the cycle lane occupies road
  // edges only while travelling, never the final shop doorstep itself.
  out[0].z = startCycleZ;
  out[out.length-2].z = endCycleZ;
  if (out.length > 3) {
    out[1].z = startCycleZ;
    out[out.length-3].z = endCycleZ;
  }
  // Dismount point before crossing the pavement to a doorstep.
  out.splice(out.length - 1, 0, {
    x: end.x, z: endCycleZ, dismount: true,
  });
  return out;
}
