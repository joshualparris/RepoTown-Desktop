// Explicit fictional design alternatives, metres, +x east, +z south.
// Planning data is not an approval, survey, traffic count or utility connection.
export const CORE_ROADS = [
 ...Array.from({length:8},(_,i)=>({id:`street-${i+1}`,a:{x:-348,z:-145+i*46},b:{x:348,z:-145+i*46},width:9,reserve:null,footpath:1.6,status:'existing',speed:30})),
 ...[-338,-208,-78,52,182,312].map((x,i)=>({id:`avenue-${i}`,a:{x,z:-204},b:{x,z:204},width:7,reserve:null,footpath:0,status:'existing',speed:30}))
];
const road=(id,x1,z1,x2,z2,width=8)=>({id,a:{x:x1,z:z1},b:{x:x2,z:z2},width,reserve:20,footpath:2,status:'design',speed:30,lanes:2,parking:'off-carriageway',junctionControl:'give-way-to-east-west',truckAccess:true});
const parcel=(id,x0,z0,w,d,use,roadId)=>({id,x:x0+w/2,z:z0+d/2,w,d,use,roadId,status:'unserviced-design',buildable:false});
function neighbourhood(south=false){
 const roads=[road('local-south',-208,-245,462,-245),road('local-north',-208,-335,462,-335),
 ...[-208,52,312].map((x,i)=>road(`core-link-${i}`,x,-145,x,-335)),road('employment-access',462,-245,462,-335)];
 const parcels=[];
 for(let block=0;block<2;block++)for(let row=0;row<2;row++)for(let i=0;i<12;i++){
  // Three frontage sizes: 16/20/24m, total 240m per block, all 35m deep.
  const widths=[16,20,24],w=widths[i%3],offset=Math.floor(i/3)*60+widths.slice(0,i%3).reduce((a,b)=>a+b,0);
  parcels.push(parcel(`home-${block}-${row}-${i}`, -198+block*260+offset,row?-325:-290,w,35,'residential',row?'local-north':'local-south'));
 }
 parcels.push(parcel('campus',62,-425,120,80,'community','local-north'),parcel('park',182,-425,120,80,'park','local-north'));
 parcels.push(parcel('employment-1',472,-335,60,40,'employment','employment-access'),parcel('employment-2',472,-295,60,40,'employment','employment-access'));
 const buffers=[parcel('employment-buffer',322,-325,130,70,'buffer',null)];
 if(south){
  // Same demand and lot dimensions; reflection gives a fair geographic comparison.
  // Road links connect to street [address redacted] 1. Existing rail interfaces remain.
  for(const r of roads){r.a.z=32-r.a.z;r.b.z=32-r.b.z;}
  for(const p of [...parcels,...buffers])p.z=32-p.z;
 }
 return {id:south?'C':'B',name:south?'Southern neighbourhoods and employment edge':'Northern neighbourhoods and employment edge',roads,parcels,buffers,assumedDwellings:48,assumedCampusTripsPerPeakHour:30,assumedEmploymentTripsPerPeakHour:20,officialAddresses:false};
}
export function alternatives(legacyParcels,legacyRoads){
 const A={id:'A',name:'Existing twelve-reserve perimeter concept',roads:legacyRoads.map(r=>({id:r.id,a:{x:r.w>r.d?r.x-r.w/2:r.x,z:r.w>r.d?r.z:r.z-r.d/2},b:{x:r.w>r.d?r.x+r.w/2:r.x,z:r.w>r.d?r.z:r.z+r.d/2},width:Math.min(r.w,r.d),reserve:null,footpath:0,status:'concept',speed:30})),parcels:legacyParcels.map(p=>({...p,use:p.zone.startsWith('R')?'residential-reserve':'other-reserve',roadId:null,status:'concept',buildable:false})),buffers:[],assumedDwellings:null,officialAddresses:false};
 return [A,neighbourhood(),neighbourhood(true),southernBypass()];
}
export const NORTHERN_PLAN=neighbourhood();
export const rect=p=>({x0:p.x-p.w/2,x1:p.x+p.w/2,z0:p.z-p.d/2,z1:p.z+p.d/2});
export const overlap=(a,b)=>a.x0<b.x1-1e-7&&a.x1>b.x0+1e-7&&a.z0<b.z1-1e-7&&a.z1>b.z0+1e-7;
export function roadRect(r,reserve=false){const h=(reserve?r.reserve??r.width:r.width)/2;return {x0:Math.min(r.a.x,r.b.x)-(r.a.x===r.b.x?h:0),x1:Math.max(r.a.x,r.b.x)+(r.a.x===r.b.x?h:0),z0:Math.min(r.a.z,r.b.z)-(r.a.z===r.b.z?h:0),z1:Math.max(r.a.z,r.b.z)+(r.a.z===r.b.z?h:0)};}
export function frontage(p,r){
 const a=rect(p),b=roadRect(r,true),horizontal=r.a.z===r.b.z;
 const contact=horizontal?Math.abs(a.z0-b.z1)<1e-6||Math.abs(a.z1-b.z0)<1e-6:Math.abs(a.x0-b.x1)<1e-6||Math.abs(a.x1-b.x0)<1e-6;
 const length=horizontal?Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0):Math.min(a.z1,b.z1)-Math.max(a.z0,b.z0);
 return contact&&length>0?length:0;
}
export function accessPoint(p,r){return r.a.z===r.b.z?{x:p.x,z:r.a.z}:{x:r.a.x,z:p.z};}
// Split axis-aligned centrelines at every real junction and access point.
export function graph(roads,extra=[]){
 const on=(p,r)=>Math.abs((r.b.x-r.a.x)*(p.z-r.a.z)-(r.b.z-r.a.z)*(p.x-r.a.x))<1e-6&&p.x>=Math.min(r.a.x,r.b.x)-1e-6&&p.x<=Math.max(r.a.x,r.b.x)+1e-6&&p.z>=Math.min(r.a.z,r.b.z)-1e-6&&p.z<=Math.max(r.a.z,r.b.z)+1e-6;
 const points=roads.flatMap(r=>[r.a,r.b]).concat(extra),nodes=new Map(),edges=[];
 for(const a of roads)for(const b of roads){if(a.a.z===a.b.z&&b.a.x===b.b.x){const p={x:b.a.x,z:a.a.z};if(on(p,a)&&on(p,b))points.push(p);}}
 const key=p=>`${p.x},${p.z}`;
 for(const r of roads){const ps=[...new Map(points.filter(p=>on(p,r)).map(p=>[key(p),p])).values()].sort((a,b)=>a.x-b.x||a.z-b.z);
  for(const p of ps)nodes.set(key(p),{...p,id:key(p),edges:[]});
  for(let i=1;i<ps.length;i++)edges.push({a:key(ps[i-1]),b:key(ps[i]),length:Math.hypot(ps[i].x-ps[i-1].x,ps[i].z-ps[i-1].z),roadId:r.id,status:r.status});
 }
 for(const e of edges){nodes.get(e.a).edges.push({to:e.b,length:e.length,roadId:e.roadId});nodes.get(e.b).edges.push({to:e.a,length:e.length,roadId:e.roadId});}
 const components=[],seen=new Set();for(const id of nodes.keys()){if(seen.has(id))continue;const stack=[id],part=[];seen.add(id);while(stack.length){const n=stack.pop();part.push(n);for(const e of nodes.get(n).edges)if(!seen.has(e.to)){seen.add(e.to);stack.push(e.to);}}components.push(part);}
 return {nodes:[...nodes.values()],edges,components};
}
export function distances(g,source,closedRoad=null){const ns=new Map(g.nodes.map(n=>[n.id,n])),d=new Map([[source,0]]),open=new Set([source]);while(open.size){const id=[...open].reduce((a,b)=>d.get(a)<=d.get(b)?a:b);open.delete(id);for(const e of ns.get(id)?.edges||[]){if(e.roadId===closedRoad)continue;const nd=d.get(id)+e.length;if(nd<(d.get(e.to)??Infinity)){d.set(e.to,nd);open.add(e.to);}}}return d;}
export function planAddresses(plan){
 const records=[];for(const r of plan.roads){const along=r.a.z===r.b.z?'x':'z',cross=along==='x'?'z':'x',dir=Math.sign(r.b[along]-r.a[along]);
  for(const side of [-1,1]){const lots=plan.parcels.filter(p=>p.roadId===r.id&&Math.sign(p[cross]-r.a[cross])===side).sort((a,b)=>dir*(a[along]-b[along]));
   // +z is south. Eastbound left is north; southbound left is east.
   const left=along==='x'?side===-dir:side===dir;
   lots.forEach((p,i)=>records.push({parcelId:p.id,number:2*i+(left?1:2),roadId:r.id,roadName:`Plan ${r.id} Road`,side:left?'left':'right',datum:r.a,status:'fictional-provisional',official:false,legacyKey:null}));
  }
 }return records;
}

export function southernBypass(){
 const p=neighbourhood(true);p.id='D';p.name='Southern neighbourhoods with farm-clear eastern tie-in and world-homes stage';
 const r=p.roads.find(r=>r.id==='core-link-2');r.a.x=338;r.b.x=338;
 // Stage 2: 147 additional homes, in three rows of 49. These lie west of the
 // existing 48-lot neighbourhood, never on the old north-of-town reserves.
 // Roads connect at the west and east, so pedestrians and drivers can loop.
 const WEST=-1330, EAST=-208;
 for (const id of ['local-south','local-north']) p.roads.find(r=>r.id===id).a.x=WEST;
 const kurrajong=p.roads.find(r=>r.id==='core-link-0');kurrajong.b.z=457;
 p.roads.push(road('southern-edge',WEST,457,EAST,457),road('western-link',WEST,277,WEST,457));
 const rows=[
  {name:'wattle-west',roadId:'local-south',z0:232},
  {name:'banksia-west',roadId:'local-north',z0:322},
  {name:'grevillea-west',roadId:'southern-edge',z0:412},
 ];
 for (const row of rows) for(let i=0;i<49;i++) {
  p.parcels.push(parcel(row.name+'-'+String(i+1).padStart(2,'0'), -1310+20*i,row.z0,20,35,'residential',row.roadId));
 }
 p.assumedDwellings=195;
 return p;
}
export const SELECTED_PLAN=southernBypass();
