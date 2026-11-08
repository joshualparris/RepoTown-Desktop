import {labelVisible} from '../world/interior.js';
import {nearestSeat} from '../world/seats.js';

// Select only objects the visitor can reach from this side of a wall/door.
// Use the same wall and live door geometry as the interior label visibility.
export function pickInteriorInteraction(interior,at,forward,eyeHeight=1.65){
  if(!interior)return null;
  const eye={x:at.x,y:eyeHeight,z:at.z};
  const visible=pos=>{
    // Wall-mounted props sit exactly on the inner wall plane. Stop just short
    // of their surface so their own mounting wall does not hide the object.
    const dx=pos.x-eye.x,dz=pos.z-eye.z,d=Math.hypot(dx,dz),f=d>0?Math.max(0,d-.03)/d:0;
    return labelVisible(eye,{x:eye.x+dx*f,y:Math.min(1.1,eyeHeight),z:eye.z+dz*f},interior.sight);
  };
  let pick=null,best=Infinity;
  for(const x of interior.interactables||[]){
    const dx=x.pos.x-at.x,dz=x.pos.z-at.z,d=Math.hypot(dx,dz);
    if(d>2.6||!visible(x.pos))continue;
    const dot=d<.01?1:(dx*forward.x+dz*forward.z)/d;
    if(dot<.2&&d>1.2)continue;
    const score=d-1.6*dot;if(score<best){best=score;pick=x;}
  }
  const seat=nearestSeat((interior.seats||[]).filter(s=>!s.occupiedBy&&visible(s.pos)),at,forward,2.6);
  if(seat){
    const d=Math.hypot(seat.pos.x-at.x,seat.pos.z-at.z);
    const facing=d<.01?1:((seat.pos.x-at.x)*forward.x+(seat.pos.z-at.z)*forward.z)/d;
    if(!pick||d-.7*facing<best-.35)return {...seat,act:{do:'sit',title:seat.label}};
  }
  if(pick)return pick;
  let selected=null,rank=Infinity;
  for(const item of interior.furniture||[]){
    const dx=item.pos.x-at.x,dz=item.pos.z-at.z,d=Math.hypot(dx,dz);
    if(d>2.4||!visible(item.pos))continue;
    const facing=d<.01?1:(dx*forward.x+dz*forward.z)/d;
    if(facing<.25&&d>1.1)continue;
    const score=d-.7*facing;if(score<rank){rank=score;selected=item;}
  }
  return selected;
}
