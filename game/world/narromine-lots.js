// NSW Spatial Services public cadastral lot outlines, not real fences, walls or house locations.
// The data are 0.1m delta encoded in Narromine's OSM local x-east, z-south metre frame.
import { NARROMINE_LOTS } from './narromine-lots-data.js';
export function decodeLots(data = NARROMINE_LOTS) {
  return data.lots.map(([lot, plan, d]) => {
    let x=d[0], z=d[1]; const pts=[[x/10,z/10]];
    for(let i=2;i<d.length;i+=2){x+=d[i];z+=d[i+1];pts.push([x/10,z/10]);}
    return {lot,plan,label:lot?`${lot}//${plan}`:plan,pts};
  });
}
let cache=null;
export const narromineLots=()=>cache||(cache=decodeLots());
export function clipSegmentToRect(ax,az,bx,bz,R){
  let t0=0,t1=1;const dx=bx-ax,dz=bz-az;
  for(const [p,q] of [[-dx,ax-R.x0],[dx,R.x1-ax],[-dz,az-R.z0],[dz,R.z1-az]]){
    if(p===0){if(q<0)return null;continue;}
    const r=q/p;
    if(p<0){if(r>t1)return null;if(r>t0)t0=r;}
    else{if(r<t0)return null;if(r<t1)t1=r;}
  }
  return [ax+t0*dx,az+t0*dz,ax+t1*dx,az+t1*dz];
}
export {NARROMINE_LOTS};
