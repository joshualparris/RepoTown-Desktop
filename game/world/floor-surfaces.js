// Shared decorative floor elevations. These are visual surfaces, never hitboxes.
// Separated top faces prevent z-fighting, especially on Android/WebGL GPUs.
export const FLOOR_SURFACE_Y=Object.freeze({
  finish:0.025, wetTile:0.047, rug:0.075,
  tilePattern:0.026, // 11mm above the 0.015m bank/bakery base slab top
});
export function coplanarFloorSurfaces(a,b,epsilon=0.004){
  if(Math.abs(a.y+a.h/2-b.y-b.h/2)>epsilon)return false;
  const overlapX=Math.min(a.x+a.w/2,b.x+b.w/2)-Math.max(a.x-a.w/2,b.x-b.w/2);
  const overlapZ=Math.min(a.z+a.d/2,b.z+b.d/2)-Math.max(a.z-a.d/2,b.z-b.d/2);
  return overlapX>0.02&&overlapZ>0.02;
}
