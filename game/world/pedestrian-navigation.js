// Bounded local A* pedestrian navigation on top of the existing street
// footpath routes. NPCs don't stop forever when the player blocks a waypoint.
// The grid only activates near an obstruction (no cost for clear routes).
const GRID=0.72, PERSONAL=1.34, MAX_EXPANSIONS=350;
const hypot=Math.hypot;
const dist=(a,b)=>hypot(a.x-b.x,a.z-b.z);
export const CONVERSATION_SECONDS=15;
export function activeConversation(selected,elapsed,distance,limit=CONVERSATION_SECONDS){
  return !!selected && elapsed<limit && distance<4.2;
}
export function blockersOnSegment(start,end,blockers,reach=3.7){
  const dx=end.x-start.x,dz=end.z-start.z,length=hypot(dx,dz);
  if(length<1e-6)return [];
  const ux=dx/length,uz=dz/length;
  return blockers.filter(o=>{
    const ox=o.x-start.x,oz=o.z-start.z,ahead=ox*ux+oz*uz;
    const lateral=Math.abs(ox*uz-oz*ux);
    return ahead>-.25 && ahead<Math.min(length,reach)+1 &&
      lateral<PERSONAL+(o.radius||0)*.1;
  });
}
function clearSegment(from,to,blockers,world){
  const length=dist(from,to),steps=Math.max(1,Math.ceil(length/.18));
  for(let k=1;k<=steps;k++){
    const t=k/steps;
    if(!clear({x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t},blockers,world))return false;
  }
  return true;
}
function clear(pos,blockers,world){
  if(world?.hits?.(pos.x,pos.z,.45))return false;
  return blockers.every(b=>dist(pos,b)>=(b.limit??Math.max(PERSONAL,(b.radius||.6)+.66)));
}
// Returns a series of distinct, collision-free local waypoints and then
// rejoins the original footpath route. No instantaneous position teleport.
// null: unobstructed; []: no safe bypass (yield and retry next tick).
// Distance along start→goal (within `reach`) to the first fixed obstacle — a shed, bin, lamp or
// wall corner in the town's collision world — or null when the way is clear. The first and last
// metre are ignored: doorsteps and pavement edges legitimately sit right beside walls.
export function staticBlockOnSegment(start,goal,world,reach=3.7){
  if(!world?.hits)return null;
  const length=dist(start,goal),end=Math.min(length-1,reach);
  for(let a=.6;a<=end;a+=.2){
    const t=a/length;
    if(world.hits(start.x+(goal.x-start.x)*t,start.z+(goal.z-start.z)*t,.4))return a;
  }
  return null;
}
export function pedestrianDetour(start,goal,blockers=[],world=null){
  const length=dist(start,goal);
  if(length<.05)return null;
  // Someone who has already come within personal space (they stepped up beside the walker) may
  // only not be approached any closer; otherwise every step away looks blocked and the walker
  // freezes beside them for good.
  const near=blockersOnSegment(start,goal,blockers).map(b=>{
    const need=Math.max(PERSONAL,(b.radius||.6)+.66),now=dist(start,b);
    return now<need?{...b,limit:Math.max(.3,now-.02)}:b;
  });
  const wall=near.length?null:staticBlockOnSegment(start,goal,world);
  if(!near.length&&wall===null)return null;
  const dx=(goal.x-start.x)/length,dz=(goal.z-start.z)/length;
  const targetDist=Math.min(length,Math.max(4.2,Math.min(6.5,(near.length?dist(start,near[0]):wall)+2.8)));
  const target={x:start.x+dx*targetDist,z:start.z+dz*targetDist};
  const limit=Math.ceil((targetDist+2.9)/GRID);
  const cross=(x,z)=>Math.abs((x-start.x)*dz-(z-start.z)*dx);
  const coord=(ix,iz)=>({x:start.x+ix*GRID,z:start.z+iz*GRID});
  const open=[{ix:0,iz:0,g:0,f:dist(start,target),parent:null}],best=new Map([['0,0',0]]);
  const steps=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  let result=null,nearest=null;
  for(let expanded=0;open.length&&expanded<MAX_EXPANSIONS;expanded++){
    open.sort((a,b)=>a.f-b.f||a.g-b.g||a.ix-b.ix||a.iz-b.iz);
    const node=open.shift(),key=node.ix+','+node.iz;
    if(node.g>best.get(key)+1e-6)continue;
    const p=coord(node.ix,node.iz),remain=dist(p,target);
    // Avoid treating an occupied business doorway as impossible to reach:
    // a safe spot near its threshold is an acceptable place to queue.
    if(remain<GRID*.9 && clear(p,near,world)){result=node;break;}
    if(!nearest||remain<nearest.remain)nearest={node,remain};
    for(const [ix,iz] of steps){
      const nx=node.ix+ix,nz=node.iz+iz;
      if(Math.abs(nx)>limit||Math.abs(nz)>limit)continue;
      const p=coord(nx,nz);
      const ahead=(p.x-start.x)*dx+(p.z-start.z)*dz;
      if(ahead<-.9||ahead>targetDist+1.4||cross(p.x,p.z)>2.85)continue;
      if(!clear(p,near,world)||!clearSegment(coord(node.ix,node.iz),p,near,world))continue;
      // A diagonal step may not cut through an obstacle corner.
      if(ix&&iz&&(!clear(coord(node.ix+ix,node.iz),near,world)||!clear(coord(node.ix,node.iz+iz),near,world)))continue;
      const g=node.g+GRID*(ix&&iz?Math.SQRT2:1),k=nx+','+nz;
      if(g>= (best.get(k)??Infinity)-.00001)continue;
      best.set(k,g);
      open.push({ix:nx,iz:nz,g,f:g+dist(p,target),parent:node});
    }
  }
  if(!result)result=nearest?.remain<1.25?nearest.node:null;
  if(!result)return [];
  const points=[];
  for(let n=result;n?.parent;n=n.parent)points.push(coord(n.ix,n.iz));
  points.reverse();
  // Simplify redundant collinear grid nodes, preserving the around-obstacle
  // bend, so NPC movement stays smooth and game saves stay compact.
  const waypoints=[];
  for(let i=0;i<points.length;i++){
    const a=waypoints.at(-1),b=points[i],next=points[i+1];
    if(a&&next){
      const abx=b.x-a.x,abz=b.z-a.z,bcx=next.x-b.x,bcz=next.z-b.z;
      if(Math.abs(abx*bcz-abz*bcx)<.04&&abx*bcx+abz*bcz>0)continue;
    }
    waypoints.push({...b,detour:true});
  }
  return waypoints;
}
export function canFinishNearOccupiedDoor(person,goal,blockers,tolerance=2.1){
  return dist(person,goal)<tolerance && blockers.some(b=>dist(goal,b)<1.4);
}
