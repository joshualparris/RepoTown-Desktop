import {CAFE_TABLES} from './work-recipes.js';
// The real TownLife roster drives visible civic visitors. This is presentation
// only: it never invents a customer, spends money, or advances the town clock.
import * as THREE from 'three';
import { pose } from './npcs.js';
import { makeDistinctPerson } from './npc-wardrobe.js';

// Full-body clearance, not a point-sized foot collision.
const RADIUS = 0.35, GRID = 0.55, PERSONAL_SPACE = 0.85;
const length = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
const collision = (boxes,x,z,r=RADIUS) =>
  boxes.some(b=>b.radius!=null
    ? Math.hypot(x-b.x,z-b.z)<r+b.radius
    : x+r>b.x0 && x-r<b.x1 && z+r>b.z0 && z-r<b.z1);
const inBounds = (b,x,z,r=RADIUS)=> x>b.x0+r && x<b.x1-r && z>b.z0+r && z<b.z1-r;
const clear = (p,boxes,bounds,r=RADIUS) =>
  inBounds(bounds,p.x,p.z,r)&&!collision(boxes,p.x,p.z,r);
// Sweep a person-sized circle continuously along a segment. Sparse samples
// previously missed table corners between checkpoints and stranded customers.
export function clearWalk(from,to,boxes,bounds,r=RADIUS){
  if(!clear(from,boxes,bounds,r)||!clear(to,boxes,bounds,r))return false;
  for(const b of boxes){
    if(b.radius!=null){
      const dx=to.x-from.x,dz=to.z-from.z,length2=dx*dx+dz*dz;
      const t=length2?Math.max(0,Math.min(1,((b.x-from.x)*dx+(b.z-from.z)*dz)/length2)):0;
      if(Math.hypot(from.x+dx*t-b.x,from.z+dz*t-b.z)<r+b.radius)return false;
      continue;
    }
    let lo=0,hi=1,intersects=true;
    for(const axis of ['x','z']){
      const origin=from[axis],delta=to[axis]-origin;
      const min=b[axis+'0']-r,max=b[axis+'1']+r;
      if(Math.abs(delta)<1e-10){
        if(origin<min||origin>max){intersects=false;break;}
      }else{
        const a=(min-origin)/delta,c=(max-origin)/delta;
        lo=Math.max(lo,Math.min(a,c));hi=Math.min(hi,Math.max(a,c));
        if(lo>hi){intersects=false;break;}
      }
    }
    if(intersects&&lo<=hi)return false;
  }
  return true;
}
// Only called when a visitor changes destinations, never on each frame.
// Grid A* preserves furniture collisions, with no diagonal corner-cutting.
export function routeVisitor(start,end,boxes,bounds,r=RADIUS) {
  if(!clear(start,boxes,bounds,r)||!clear(end,boxes,bounds,r))return null;
  if(clearWalk(start,end,boxes,bounds,r))return [{...end}];
  const at=(i,j)=>({x:start.x+i*GRID,z:start.z+j*GRID});
  const key=(i,j)=>i+','+j;
  const open=[{i:0,j:0,g:0,f:length(start,end),prev:null}];
  const seen=new Map([[key(0,0),0]]);
  const limitX=Math.ceil((bounds.x1-bounds.x0)/GRID)+2;
  const limitZ=Math.ceil((bounds.z1-bounds.z0)/GRID)+2;
  const moves=[[1,0],[-1,0],[0,1],[0,-1]];
  let finish=null;
  for(let k=0;k<2400 && open.length;k++){
    open.sort((a,b)=>a.f-b.f||a.g-b.g);
    const n=open.shift(),p=at(n.i,n.j);
    if(n.g>seen.get(key(n.i,n.j))+1e-6)continue;
    if(length(p,end)<1.1&&clearWalk(p,end,boxes,bounds,r)){finish=n;break;}
    for(const [di,dj] of moves){
      const i=n.i+di,j=n.j+dj;
      if(Math.abs(i)>limitX||Math.abs(j)>limitZ)continue;
      const q=at(i,j);
      if(!clear(q,boxes,bounds,r)||!clearWalk(p,q,boxes,bounds,r))continue;
      const cost=n.g+GRID,k2=key(i,j);
      if(cost>= (seen.get(k2)??Infinity)-1e-6)continue;
      seen.set(k2,cost);
      open.push({i,j,g:cost,f:cost+length(q,end),prev:n});
    }
  }
  if(!finish)return null; // Not an excuse to walk through a wall.
  const points=[];
  for(let node=finish;node?.prev;node=node.prev)points.push(at(node.i,node.j));
  points.reverse();points.push({...end});
  const smooth=[],origin={...start};
  for(let i=0;i<points.length;){
    let j=points.length-1;
    while(j>i&&!clearWalk(origin,points[j],boxes,bounds,r))j--;
    const point=points[j];smooth.push(point);
    origin.x=point.x;origin.z=point.z;i=j+1;
  }
  return smooth;
}
function* seatLandings(seat,boxes,bounds){
  for(const d of [0.78,1.05,1.35]){
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,pt={x:seat.pos.x+Math.cos(a)*d,z:seat.pos.z+Math.sin(a)*d};
      if(clear(pt,boxes,bounds))yield pt;
    }
  }
}
const nearSeat=(seat,boxes,bounds)=>seatLandings(seat,boxes,bounds).next().value||null;
export function visitorsForSite(life,siteId,staffId=null){
  return life.villagers.filter(v=>v.inside&&!v.path?.length&&v.step?.at===siteId &&
    (['buy','eatout','snack'].includes(v.step.kind) ||
     (siteId==='pub'&&v.step.kind==='idle') ||
     (v.step.kind==='work'&&v.id!==staffId)));
}
export function createShopVisitors(site,life,interior,makeLabel,people){
  const entries=new Map(),group=interior.group,boxes=interior.colliders,bounds=interior.bounds;
  const entry={x:0,z:Math.min(bounds.z1-0.65,4.7)};
  const counter=site.id==='cafe'||site.id==='pub'
    ? {x:1.3,z:-3.7} : {x:2.7,z:-3.5};
  // Furniture A* alone doesn't prevent two human models sharing the same floor.
  const otherPeople=(p)=>people.filter(o=>o!==p&&o.pos&&o.state!=='gone'&&o.group?.visible!==false);
  const actorClear=(at,p,player,gap=PERSONAL_SPACE)=> {
    if (!clear(at,boxes,bounds)) return false;
    if (player?.pos && length(at,player.pos)<gap) return false;
    return otherPeople(p).every(o=>length(at,o.pos)>=gap);
  };
  const targetReserved=(at,p)=>[...entries.values()].some(o=>o!==p&&o.standTarget&&
    o.state!=='gone'&&length(at,o.standTarget)<PERSONAL_SPACE);
  // One space per waiting customer. Includes target reservations for walkers
  // who haven't reached the counter yet; IDs determine reproducible ordering.
  const standingSpot=(p,player)=>{
    const options=[];
    for(let row=0;row<9;row++)for(let col=0;col<9;col++) {
      const lane=col===0?0:(col%2?1:-1)*Math.ceil(col/2);
      options.push({x:counter.x+lane*.96,z:counter.z+row*1.02});
    }
    return options.find(pt=>actorClear(pt,p,player)&&!targetReserved(pt,p))||null;
  };
  // A busy doorway holds late arrivals outside the rendered room until there
  // is physical clearance; never instantiate an entire queue at one coordinate.
  const spawnSpot=(player)=>{
    for(const z of [entry.z,entry.z-.95,entry.z-1.9])
      for(const x of [1.25,-1.25,2.1,-2.1,0])
        if(actorClear({x,z},null,player))return {x,z};
    return null;
  };
  const positionAt=(p,target)=>{p.pos.x=target.x;p.pos.z=target.z;p.group.position.set(target.x,0,target.z);};
  let currentPlayer=null;
  // A* must see other actors and the player as temporary blockers. Otherwise
  // it replans the identical straight route through someone's body forever.
  const movingBlockers=p=>{
    const blockers=[];
    const add=pos=>{
      if(!pos)return;
      // Match actorClear's circular spacing. A square's expanded corners
      // wrongly classified a safely stopped patron as already inside a blocker,
      // making every subsequent route search fail at its starting point.
      blockers.push({x:pos.x,z:pos.z,radius:PERSONAL_SPACE-RADIUS});
    };
    if(currentPlayer?.pos)add(currentPlayer.pos);
    for(const other of otherPeople(p))add(other.pos);
    return blockers;
  };
  const setDestination=(p,destination)=>{
    const path=routeVisitor(p.pos,destination,[...boxes,...movingBlockers(p)],bounds);
    if(!path)return false;
    p.route=path;p.state='walking';p.retryGoal={...destination};return true;
  };
  const routeToSeat=(p,player)=>{
    if(!p.seat)return false;
    for(const landing of seatLandings(p.seat,boxes,bounds)){
      if(!actorClear(landing,p,player))continue;
      if(setDestination(p,landing)){
        p.landing=landing;p.next='seating';p.standTarget=null;p.queueSlot=null;return true;
      }
    }
    // Keep the chair reserved and retry when the aisle clears. A blocked
    // approach must neither strand the patron forever nor teleport them.
    p.route=[];p.state='waiting';p.next='seating';p.retryGoal={...p.landing};p.standTarget=null;p.queueSlot=null;
    return false;
  };
  const vacantSeats=(reserved,playerSeat)=> (interior.seats||[]).filter(s=>
    s.key!==playerSeat && !reserved.has(s.key) && !s.occupiedBy &&
    (['pub','cafe'].includes(site.id) ? ['chair','stool','sofa','armchair','bench'].includes(s.type) : true));
  const reserveSeat=(p,reserved,playerSeat)=>{
    const ticket=site.id==='cafe'?life.civic?.workplay?.cafe?.tickets.find(o=>o.id===p.v.step?.workTicket):null;
    const table=ticket&&CAFE_TABLES[ticket.table-1];
    const options=vacantSeats(reserved,playerSeat).filter(s=>!table||Math.hypot(s.pos.x-table[0],s.pos.z-table[1])<.85)
      .map(s=>({s,landing:nearSeat(s,boxes,bounds)})).filter(x=>x.landing)
      .sort((a,b)=>length(a.landing,p.pos)-length(b.landing,p.pos));
    for(const {s,landing} of options){
      if(routeVisitor(p.pos,landing,boxes,bounds)){
        p.seat=s;p.landing=landing;reserved.add(s.key);s.occupiedBy=p.v.name;return true;
      }
    }
    return false;
  };
  const wantsSeat=v=> ['cafe','pub'].includes(site.id) &&
    (v.step?.kind==='eatout'||v.step?.kind==='idle') && !v.step?.queue;
  const addPerson=(v,existing,reserved,playerSeat,player)=>{
    const spawn=existing?entry:spawnSpot(player);
    if(!spawn)return null; // try on the next update after the doorway clears
    const fig=makeDistinctPerson('villager:'+v.id+':'+v.name+':'+(v.job||''),v);
    const seed=fig.group.userData.residentAppearance.seed;
    const pos=new THREE.Vector3(spawn.x,0,spawn.z);
    const tag=makeLabel(v.name,'interactive');tag.position.y=2.35;
    fig.group.add(tag);group.add(fig.group);
    const p={v,key:'visitor:'+v.id,name:v.name,pos,group:fig.group,fig,tag,room:0,
      activity:v.activity,route:[],state:'waiting',seat:null,talking:false,exit:false,
      phase:seed*.071,speed:v.bike?1.2:1.05};
    entries.set(v.id,p);people.push(p);
    // When entering a building that already has customers, display them at their
    // current activity instead of replaying their entrance from the beginning.
    if(wantsSeat(v)&&reserveSeat(p,reserved,playerSeat)){
      if(existing){positionAt(p,p.seat.pos);p.state='seated';}
      else {
        // A busy service counter is a queue of distinct spots, not a single
        // point that every arriving patron must occupy.
        const service=standingSpot(p,player);
        if(service){p.standTarget=service;setDestination(p,service);}
        else setDestination(p,p.landing);
      }
      p.next='service';
    }else{
      const destination=standingSpot(p,player);
      if(!destination){
        // A full room doesn't gain another overlapping body.
        group.remove(p.group);entries.delete(v.id);people.splice(people.indexOf(p),1);
        return null;
      }
      p.standTarget=destination;
      if(existing)positionAt(p,destination);
      else if(!setDestination(p,destination)){p.state='waiting';}
      p.next='counter';
    }
    const hotspot={key:p.key,type:'npc',label:'Talk to '+v.name,person:true,
      room:0,roomName:interior.rooms[0]?.name||site.name,pos:p.pos,
      act:{do:'npc',name:v.name,role:'villager',job:v.job}};
    p.hotspot=hotspot;interior.interactables.push(hotspot);
    return p;
  };
  const advance=(p,dt,t,player)=>{
    const v=p.v;p.activity=p.exit?'leaving '+site.name:v.activity;
    if(p.talking){p.tag.visible=false;return;}
    let moved=false;
    if(p.state==='walking'&&p.route.length){
      const goal=p.route[0],dx=goal.x-p.pos.x,dz=goal.z-p.pos.z,d=Math.hypot(dx,dz);
      if(d<0.11)p.route.shift();
      else{
        const move=Math.min(d,Math.min(dt,.1)*p.speed);
        const ux=dx/d,uz=dz/d;
        // Give way to patrons, staff and the player. Local left/right steering
        // avoids moving through other bodies while retaining furniture-safe A*.
        const options=[[ux,uz],
          [ux*.707-uz*.707,uz*.707+ux*.707],
          [ux*.707+uz*.707,uz*.707-ux*.707]];
        for(const [vx,vz] of options){
          const next={x:p.pos.x+vx*move,z:p.pos.z+vz*move};
          if(!clearWalk(p.pos,next,boxes,bounds)&&move>0)continue;
          // A seated patron's occupied chair is also a solid human presence.
          if(!actorClear(next,p,player))continue;
          p.pos.x=next.x;p.pos.z=next.z;
          p.group.rotation.y=Math.atan2(vx,vz);moved=true;break;
        }
        if(!moved)p.blockedFor=(p.blockedFor||0)+Math.min(dt,.1);
        else p.blockedFor=0;
        if(p.blockedFor>1.2){
          // Replan around the current human obstacle, not the stale straight
          // route. Waiting is safer than moving through another person.
          p.blockedFor=0;
          const destination=p.retryGoal||p.route[p.route.length-1]||p.standTarget||p.landing||counter;
          if(p.seat&&p.next==='seating')routeToSeat(p,player);
          else if(!setDestination(p,destination)){
            p.retryGoal={...destination};p.route=[];p.state='waiting';
          }
        }
      }
    }
    if(p.state==='walking'&&!p.route.length){
      if(p.exit)p.state='gone';
      else if(p.seat&&p.next==='service'){
        // Queue by the counter first; once served, head to the reserved chair.
        p.state='service';p.serviceDelay=1.6;p.standTarget=null;
      }else if(p.seat&&p.next==='seating'){
        positionAt(p,p.seat.pos);p.state='seated';
      }else p.state='standing';
    }
    if(p.state==='service'){
      p.serviceDelay-=dt;
      if(p.serviceDelay<=0&&!v.step?.queue){
        routeToSeat(p,player);
      }
    }
    pose(p.fig,dt,t+p.phase,moved,false);
    if(p.state==='seated'){
      p.group.position.set(p.seat.pos.x,-0.38,p.seat.pos.z);
      p.fig.legs[0].rotation.x=-1.25;p.fig.legs[1].rotation.x=-1.25;
      p.fig.arms[0].rotation.x=-0.3;p.fig.arms[1].rotation.x=-0.3;
      p.group.rotation.y=p.seat.yaw-Math.PI;
    }else p.group.position.set(p.pos.x,moved?0.035*Math.abs(Math.sin(t*8+p.phase)):0,p.pos.z);
    if(p.state==='seated'){p.pos.x=p.seat.pos.x;p.pos.z=p.seat.pos.z;}
    p.tag.visible=length(p.pos,player.pos)>2.4&&p.state!=='gone';
  };
  let initial=true;
  function update(dt,t,player){
    currentPlayer=player;
    const reserved=new Set(),playerSeat=player.seated?.key||null;
    for(const s of interior.seats||[])delete s.occupiedBy;
    for(const p of entries.values())if(p.seat&&!p.exit&&p.state!=='gone'){
      if(p.seat.key!==playerSeat){reserved.add(p.seat.key);p.seat.occupiedBy=p.v.name;}
      else{p.seat=null;p.state='standing';p.route=[];}
    }
    const visible=visitorsForSite(life,site.id,
      people.find(p=>p.key==='staff:'+site.id)?.v?.id);
    const active=new Set(visible.map(v=>v.id));
    for(const v of visible){
      if(!entries.has(v.id))addPerson(v,initial,reserved,playerSeat,player);
    }
    for(const p of entries.values()){
      if(!active.has(p.v.id)&&!p.exit){
        p.exit=true;
        if(p.seat){
          // The model stands up beside its former chair before walking away.
          // Starting a route inside a solid sofa would otherwise fail.
          if(p.landing)positionAt(p,p.landing);
          delete p.seat.occupiedBy;reserved.delete(p.seat.key);p.seat=null;
        }
        if(!setDestination(p,entry))p.state='gone';
      }
      // Customers who were waiting for actual counter service must take a
      // seat after being served, not stay motionless at the till.
      if(!p.exit&&!p.seat&&wantsSeat(p.v)&&
         reserveSeat(p,reserved,playerSeat)){
        routeToSeat(p,player);
      }
      if(p.state==='waiting' && t>=(p.retryAt||0)){
        // Throttle A* on mobile; a full aisle may remain blocked for seconds.
        p.retryAt=t+.75;
        const goal=p.retryGoal||p.standTarget||(p.seat?p.landing:null)||(p.exit?entry:null);
        if(p.seat&&p.next==='seating')routeToSeat(p,player);
        else if(goal && actorClear(goal,p,player) &&
           (p.exit||!targetReserved(goal,p)))setDestination(p,goal);
      }
      if(p.state==='standing'&&p.seat&&p.next==='service'&&!p.exit){
        routeToSeat(p,player);
      }
      const ticket=site.id==='cafe'?life.civic?.workplay?.cafe?.tickets.find(o=>o.id===p.v.step?.workTicket):null;
      if(ticket?.state==='queue'&&!p.exit){
        const line=life.civic.workplay.cafe.tickets.filter(o=>o.state==='queue').sort((a,b)=>a.created-b.created||a.id-b.id);
        const index=line.findIndex(o=>o.id===ticket.id),dest={x:1.2,z:-3.6+index*.98};
        if(p.queueSlot!==index){if(setDestination(p,dest))p.queueSlot=index;}
      }
      if(p.state!=='gone')advance(p,dt,t,player);
      if(p.state==='gone'){
        group.remove(p.group);
        const hotspotIndex=interior.interactables.indexOf(p.hotspot);
        if(hotspotIndex>=0)interior.interactables.splice(hotspotIndex,1);
        const personIndex=people.indexOf(p);
        if(personIndex>=0)people.splice(personIndex,1);
        entries.delete(p.v.id);
      }
    }
    initial=false;
  }
  return {update,entries};
}
