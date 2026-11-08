// Shared real-world footprints for both simulation villagers and independently
// animated street NPCs. Never move only the meshes: positions are authoritative.
// One person uses roughly 0.58m of ground radius; greetings and queues keep
// their own space instead of stacking on one point outside a shop.
export const PEDESTRIAN_RADIUS = 0.61;
export const PEDESTRIAN_GAP = 1.28;

// Mutable broad phase: update buckets after every correction, including across
// negative cell boundaries. Preserve caller order so crowd resolution stays stable.
function pedestrianGrid(entries, cellSize=6) {
  const cells=new Map(), keys=new Map();
  const key=p=>`${Math.floor(p.x/cellSize)},${Math.floor(p.z/cellSize)}`;
  function update(i){
    const k=key(entries[i].pos),old=keys.get(i);
    if(k===old)return false;
    if(old!==undefined){const bucket=cells.get(old);bucket.delete(i);if(!bucket.size)cells.delete(old);}
    if(!cells.has(k))cells.set(k,new Set());
    cells.get(k).add(i);keys.set(i,k);return true;
  }
  entries.forEach((_,i)=>update(i));
  return {crowded:[...cells.values()].some(bucket=>bucket.size>12),update,near(pos,r,min=0){
    const found=[];
    for(let x=Math.floor((pos.x-r)/cellSize);x<=Math.floor((pos.x+r)/cellSize);x++)
      for(let z=Math.floor((pos.z-r)/cellSize);z<=Math.floor((pos.z+r)/cellSize);z++)
        for(const i of cells.get(`${x},${z}`)||[])if(i>=min)found.push(i);
    return found.sort((a,b)=>a-b);
  }};
}

function fallbackDirection(a,b) {
  // Two NPCs can load at exactly the same position. A stable identity-based
  // angle prevents NaNs and random jitter across frames and game saves.
  const id=String(a.id)+'/'+String(b.id);
  let n=2166136261;
  for(const c of id){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}
  const angle=((n>>>0)%6283)/1000;
  return {x:Math.cos(angle),z:Math.sin(angle)};
}
function canPlace(item,x,z,world,r) {
  if(!Number.isFinite(x)||!Number.isFinite(z))return false;
  if(world?.hits?.(x,z,r))return false;
  const guard=item.guard;
  return !guard||guard(x,z);
}
function move(item,dx,dz,world) {
  if(item.fixed)return 0;
  const {pos}=item,oldX=pos.x,oldZ=pos.z;
  const r=item.radius??PEDESTRIAN_RADIUS;
  // Move without crossing walls, roadside vehicles, tables or door frames.
  const choices=[
    [dx,dz],[dx,0],[0,dz],
    [dz*.7,-dx*.7],[-dz*.7,dx*.7]
  ];
  for(const [x,z] of choices) {
    if(Math.hypot(x,z)<1e-7)continue;
    if(canPlace(item,oldX+x,oldZ+z,world,r)){
      pos.x=oldX+x;pos.z=oldZ+z;
      return Math.hypot(x,z);
    }
  }
  return 0;
}
// Positions are {id, pos:{x,z}, radius?, fixed?, guard?}.
// Deterministic ordering uses caller order; both stationary and moving people
// are included so standing workers aren't allowed to merge with visitors.
export function separatePedestrians(people,{world=null,gap=PEDESTRIAN_GAP,passes=5}={}) {
  const entries=people.filter(p=>p?.pos&&Number.isFinite(p.pos.x)&&Number.isFinite(p.pos.z));
  let grid=entries.length>=64?pedestrianGrid(entries):null;
  if(grid?.crowded)grid=null; // Dense piles benefit from the simple pair loop until dispersed.
  const maxRadius=Math.max(PEDESTRIAN_RADIUS,...entries.map(p=>p.radius??PEDESTRIAN_RADIUS));
  let corrected=0;
  for(let pass=0;pass<passes;pass++){
    let touched=false;
    for(let i=0;i<entries.length;i++){
      const a=entries[i],reach=Math.max(gap,(a.radius??PEDESTRIAN_RADIUS)+maxRadius+.05);
      let candidates=grid?.near(a.pos,reach,i+1),cursor=i+1;
      while(grid?candidates.length:cursor<entries.length){
      const j=grid?candidates.shift():cursor++,b=entries[j];
      if(a.fixed&&b.fixed)continue;
      const target=Math.max(gap,(a.radius??PEDESTRIAN_RADIUS)+(b.radius??PEDESTRIAN_RADIUS)+.05);
      const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z;
      if(Math.abs(dx)>=target||Math.abs(dz)>=target)continue;
      const distance=Math.hypot(dx,dz);
      if(distance>=target-0.01)continue;
      const n=distance<1e-6?fallbackDirection(a,b):{x:dx/distance,z:dz/distance};
      // Split an overlap between free bodies; stationary visitors and people
      // chatting with the player can be respected with fixed=true.
      const push=Math.min(1.4,target-distance+0.015),share=a.fixed?1:b.fixed?0:.5;
      let moved=0;
      if(share<1)moved+=move(a,-n.x*push*(1-share),-n.z*push*(1-share),world);
      if(share>0)moved+=move(b,n.x*push*share,n.z*push*share,world);
      // If the near-side body is blocked by a wall, move the other instead.
      if(moved<push*.45){
        if(!a.fixed)moved+=move(a,-n.x*push*.9,-n.z*push*.9,world);
        if(moved<push*.45&&!b.fixed)moved+=move(b,n.x*push*.9,n.z*push*.9,world);
      }
      if(moved>1e-5){
        corrected++;touched=true;
        if(grid){grid.update(i);grid.update(j);
        // A correction can bring a later pair into range in this same pass.
        candidates=grid.near(a.pos,reach,j+1);
        }
      }
      }
    }
    if(!touched)break;
  }
  return corrected;
}


// Anticipate a pedestrian/cyclist ahead instead of waiting until two bodies
// overlap. This runs only in the visible scene, AFTER the deterministic town
// economy tick. It never delays work shifts, fuel trucks or payroll.
// An actor has {id,pos,goal:{x,z},speed,radius?,fixed?,guard?}.
export function steerPedestrians(people,{world=null,dt=1/60}={}) {
  const step=Math.max(0,Math.min(0.1,dt));
  if(!step)return 0;
  const entries=people.filter(p=>p?.pos&&Number.isFinite(p.pos.x)&&Number.isFinite(p.pos.z));
  const grid=pedestrianGrid(entries);
  const maxRadius=Math.max(PEDESTRIAN_RADIUS,...entries.map(p=>p.radius??PEDESTRIAN_RADIUS));
  let steered=0;
  for(let i=0;i<entries.length;i++){
    const a=entries[i];
    if(a.fixed||!a.goal||!Number.isFinite(a.goal.x)||!Number.isFinite(a.goal.z))continue;
    const gx=a.goal.x-a.pos.x,gz=a.goal.z-a.pos.z,remaining=Math.hypot(gx,gz);
    if(remaining<0.18)continue;
    const forward={x:gx/remaining,z:gz/remaining};
    // Right-hand passing: opposing walkers choose opposite world-space sides.
    // When the kerb is on the right, try the left rather than enter traffic.
    const right={x:forward.z,z:-forward.x};
    const sight=a.speed>3?5.0:3.0;
    let threat=null,best=Infinity;
    const reach=Math.hypot(sight,(a.radius??PEDESTRIAN_RADIUS)+maxRadius+.55);
    for(const j of grid.near(a.pos,reach)){
      const b=entries[j];
      if(b===a||!b.pos||!Number.isFinite(b.pos.x)||!Number.isFinite(b.pos.z))continue;
      const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z;
      const ahead=dx*forward.x+dz*forward.z;
      if(ahead<0.05||ahead>sight)continue;
      const lateral=Math.abs(dx*right.x+dz*right.z);
      const width=(a.radius??PEDESTRIAN_RADIUS)+(b.radius??PEDESTRIAN_RADIUS)+0.55;
      if(lateral>=width)continue;
      // Avoid upcoming collision, not someone walking away much faster.
      const ownSpeed=a.speed??1.5;
      const bg=b.goal?{x:b.goal.x-b.pos.x,z:b.goal.z-b.pos.z}:null;
      const bd=bg?Math.hypot(bg.x,bg.z):0;
      const along=bd>0.15?(bg.x*forward.x+bg.z*forward.z)/bd:0;
      if(along>0.8&&(b.speed??0)>=ownSpeed+0.4)continue;
      const score=ahead+lateral*0.35;
      if(score<best){best=score;threat=b;}
    }
    if(!threat)continue;
    const amount=Math.min(0.28,step*(a.speed??1.5)*1.7);
    const oldX=a.pos.x,oldZ=a.pos.z;
    const currentDistance=Math.hypot(oldX-threat.pos.x,oldZ-threat.pos.z);
    for(const dir of [1,-1]){
      const x=oldX+right.x*amount*dir,z=oldZ+right.z*amount*dir;
      if(!canPlace(a,x,z,world,a.radius??PEDESTRIAN_RADIUS))continue;
      // Do not steer a walker from the footpath into the vehicle lanes.
      const road=Math.round((oldZ+145)/46)*46-145;
      const oldKerb=oldZ-road,newKerb=z-road;
      if(Math.abs(oldKerb)>3.7&&Math.abs(oldKerb)<8&&
        (Math.sign(oldKerb)!==Math.sign(newKerb)||Math.abs(newKerb)<3.7))continue;
      const nextDistance=Math.hypot(x-threat.pos.x,z-threat.pos.z);
      if(currentDistance>1.4&&nextDistance<1.25)continue;
      a.pos.x=x;a.pos.z=z;grid.update(i);steered++;break;
    }
  }
  return steered;
}
