// Shared exterior collision/placement rules. Pure geometry; no browser/Three.js.
// A building is solid except for the real door opening, so its sensor is reachable.
const EPS = 0.001;
export const PLAYER_RADIUS = 0.46;
export function exteriorColliders(fp, x, z) {
  if (!fp || !fp.door) throw new TypeError('Exterior footprint needs a door');
  const left = x - fp.w / 2, right = x + fp.w / 2;
  const back = z - fp.d / 2, front = z + (fp.front ?? fp.d / 2) - 0.05;
  const half = fp.door.w / 2;
  const dLeft = Math.max(left, x + fp.door.x - half);
  const dRight = Math.min(right, x + fp.door.x + half);
  if (dLeft >= dRight || front <= back) return [{x0:left,x1:right,z0:back,z1:front,...(Number.isFinite(fp.h)?{top:fp.h*0.75}:{})}];
  // An alcove 1.8 m deep lets the player cross the doorway's trigger plane
  // without also walking through the rest of the house.
  const rearEnd = Math.max(back,front - 1.8);
  const parts = [
    {x0:left,x1:dLeft,z0:back,z1:front},
    {x0:dRight,x1:right,z0:back,z1:front},
    {x0:dLeft,x1:dRight,z0:back,z1:rearEnd},
  ];
  // Roofs can be landed on (a big cheat jump): the top is taken at three-quarters of the overall
  // height, roughly the middle of a pitched roof.
  const top = Number.isFinite(fp.h) ? fp.h * 0.75 : undefined;
  return parts.filter(p=>p.x1-p.x0>EPS && p.z1-p.z0>EPS).map(p=>top===undefined?p:{...p,top});
}
export function overlapping(a,b,pad=0){
  return a.x0 < b.x1+pad-EPS && a.x1 > b.x0-pad+EPS &&
    a.z0 < b.z1+pad-EPS && a.z1 > b.z0-pad+EPS;
}
export function rotatedYardFootprint(prop,x,z) {
  // Exterior models face 90 degrees to the lot, so plan their actual
  // rotated size, not their unrotated source dimensions.
  const w=Number(prop.d)||0,d=Number(prop.w)||0;
  return {x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2};
}
export function doorApproach(fp) {
  const centre=fp.door.x,front=fp.front ?? fp.d/2;
  // Includes a player's shoulders, an open door leaf and access to the path.
  const half=fp.door.w/2 + PLAYER_RADIUS + 0.35;
  return {x0:centre-half,x1:centre+half,z0:front-1.0,z1:front+5.5};
}
// `limits` narrows the yard on a side that backs onto an avenue (src/world/town.js), so no shed
// or bin stands on the avenue's kerb where people walk.
export function yardSite(fp,prop,slot,occupied=[],limits={}) {
  // +z is the road; no yard object may extend onto its footpath or the
  // adjacent lot. The west/east reserve keeps neighbours separated.
  const left=limits.left??11.9, right=limits.right??11.9, back=-15.5, front=10.0, margin=0.35;
  const body={x0:-fp.w/2,x1:fp.w/2,z0:-fp.d/2,z1:fp.front??fp.d/2};
  const access=doorApproach(fp);
  // Preserve the authored slot first. Search alternate places only when it
  // would visibly intersect a wall, another object or the door route.
  const candidates=[slot];
  for(const zz of [fp.front+3.6,fp.front+1.9,fp.front+5.5,-fp.d/4,-fp.d/2-2.6]){
    for(const xx of [-fp.w/2-2.2,fp.w/2+2.2,-8.7,8.7,-5,5,0])
      candidates.push([xx,zz]);
  }
  for(const [x,z] of candidates){
    const box=rotatedYardFootprint(prop,x,z);
    if(box.x0<-left||box.x1>right||box.z0<back||box.z1>front)continue;
    if(overlapping(box,body,margin)||overlapping(box,access,margin))continue;
    if(occupied.some(y=>overlapping(box,y,margin)))continue;
    return {x,z,box};
  }
  // Reject a physically impossible object rather than creating a road hazard.
  return null;
}
