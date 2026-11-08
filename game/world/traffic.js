// Oriented 2D vehicle-footprint checks for town traffic. Truck meshes are
// 2.2m wide and ~6.6m bumper-to-bumper, including the tray and cab.
// SAT axes account for trucks turning into loading bays; testing only the
// distance between their centres let the long corners clip through neighbours.
export const TRUCK_HALF_WIDTH = 1.16;
export const TRUCK_HALF_LENGTH = 3.5;
function dot(a,b) { return a.x*b.x + a.z*b.z; }
function axes(vehicle) {
  const forward={x:Math.sin(vehicle.heading),z:Math.cos(vehicle.heading)};
  return {forward, side:{x:forward.z,z:-forward.x}};
}
export function trucksOverlap(a,b,clearance=0.15) {
  if(!a || !b) return false;
  const delta={x:b.x-a.x,z:b.z-a.z};
  const aa=axes(a), bb=axes(b);
  // Four separating axes (both long and short axes of both trucks).
  for(const axis of [aa.forward,aa.side,bb.forward,bb.side]) {
    const projection=Math.abs(dot(delta,axis));
    const reachA=Math.abs(dot(aa.forward,axis))*TRUCK_HALF_LENGTH+
      Math.abs(dot(aa.side,axis))*TRUCK_HALF_WIDTH;
    const reachB=Math.abs(dot(bb.forward,axis))*TRUCK_HALF_LENGTH+
      Math.abs(dot(bb.side,axis))*TRUCK_HALF_WIDTH;
    if(projection >= reachA+reachB+clearance) return false;
  }
  return true;
}
