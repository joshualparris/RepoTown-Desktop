// Publicly researched, intentionally interpretive Yeoval Aged Care walk-through.
// Do not use for wayfinding, resident placement, security or evacuation decisions.
// Exact internal walls have NOT been verified from architectural drawings.
import * as THREE from 'three';
import { Builder, GLASS } from './builder.js';
import { YEOVAL_SITE } from './yeoval-campus.js';

const WALL=0xe9e1d1, CEIL=0xf8f7f3, TRIM=0xba9c7b, CARPET=0xb6a995, BRICK=0xb57f64;
const STEEL=0xa2aaaa, BED=0xe0e3e3, BLUE=0x668a9d, GREEN=0x82a47f;
const P={north:17,south:-28.5,west:-35,east:35};
const within=(x,z,r)=>({x0:x-r,x1:x+r,z0:z-r,z1:z+r});
export function buildYeovalInterior(makeLabel) {
  const b=new Builder(),group=new THREE.Group();
  group.name='Yeoval residential care — interpretive public preview';
  const colliders=[],interactables=[],placedProps=[],seats=[],windows=[],sceneObjects=[];
  const rooms=[
    {name:'North entrance and reception',x0:-5,x1:5,z0:9.7,z1:17,w:10,d:7.3,parent:-1},
    {name:'Northern residential wing',x0:-35,x1:35,z0:0,z1:17,w:70,d:17,parent:0},
    {name:'Central connecting passage',x0:-4.8,x1:4.8,z0:-12,z1:9,w:9.6,d:21,parent:1},
    {name:'Southern residential and dining wing',x0:-21.5,x1:21.5,z0:-28.5,z1:-11,w:43,d:17.5,parent:2},
  ];
  const box=(w,h,d,x,y,z,c)=>b.box(c,w,h,d,x,y,z);
  const solid=(w,h,d,x,y,z,c)=>{
    box(w,h,d,x,y,z,c);
    colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});
  };
  const label=(value,x,y,z,kind='room')=>{
    const s=makeLabel(value,kind);s.position.set(x,y,z);s.userData.labelKind=kind;group.add(s);
  };
  const info=(key,title,detail,x,z)=>{
    const pos=new THREE.Vector3(x,0,z);
    interactables.push({key:'yeoval:'+key,type:'civic',label:title,room:0,
      roomName:'Yeoval Aged Care',pos,act:{do:'info',title,text:detail}});
    sceneObjects.push({type:'civic',label:title,room:0,pos:{x,z},interactive:true});
  };
  const bed=(x,z,double=false)=>{
    const w=double?2.05:1.15;
    solid(w,.54,2.18,x,.34,z,0xd5cabd);
    box(w,.20,1.85,x,.64,z,BED);
    box(w,.15,.50,x,.82,z+.73,0xffffff);
    box(w,.20,.12,x,.76,z-1.05,TRIM);
    box(.40,.55,.43,x+w/2+.35,.30,z+.60,0x9d8068);
    box(.11,.28,.1,x+w/2+.35,.74,z+.65,0xb7d3db); // bedside call control
    box(.13,.15,.06,x+w/2+.45,.82,z+.66,BLUE);
    placedProps.push({type:double?'doubleBed':'bed',room:1,pos:{x,z}});
  };
  const chair=(x,z,c=BLUE,ry=0)=>{
    b.at(x,0,z,ry,()=>{
      box(.67,.15,.64,0,.53,0,c);
      box(.67,.64,.13,0,.90,-.28,c);
      for(const sx of [-.26,.26])for(const sz of [-.24,.24])box(.08,.48,.08,sx,.25,sz,0x8a6c53);
    });
    placedProps.push({type:'chair',room:3,pos:{x,z}});
  };
  const table=(x,z)=>{
    solid(1.5,.09,.9,x,.78,z,0xa98b6f);
    for(const dx of [-.55,.55])for(const dz of [-.29,.29])box(.10,.72,.1,x+dx,.37,z+dz,0x8a6c53);
  };
  const panel=(x,z,w,d,color=CARPET)=>box(w,.045,d,x,.025,z,color);
  // Each footprint has its own floor/ceiling instead of a false monolithic rectangle.
  for(const [x,z,w,d] of [[0,8.5,70,17],[0,-5.5,9.8,12.6],[0,-20,43,17]]){
    box(w,.20,d,x,-.13,z,CARPET);
    box(w,.15,d,x,3.25,z,CEIL);
  }
  // Outer boundary, with the north-facing public entry genuinely open.
  solid(33.7,3.15,.22,-18.15,1.575,17,WALL);
  solid(33.7,3.15,.22,18.15,1.575,17,WALL);
  box(2.6,.42,.24,0,2.95,17,WALL);
  solid(30.1,3.15,.20,-19.95,1.575,0,WALL);
  solid(30.1,3.15,.20,19.95,1.575,0,WALL);
  for(const x of [-35,35])solid(.20,3.15,17,x,1.575,8.5,WALL);
  for(const x of [-4.9,4.9])solid(.19,3.15,12.5,x,1.575,-5.8,WALL);
  solid(43,3.15,.21,0,1.575,-28.5,WALL);
  for(const x of [-21.5,21.5])solid(.22,3.15,17.5,x,1.575,-19.75,WALL);
  // Southern wing front wall leaves a central accessible 3m corridor opening.
  for(const [x,w] of [[-13,17],[13,17]])solid(w,3.15,.20,x,1.575,-11,WALL);
  // North-wing corridor (east-west), central spine (north-south), southern corridor.
  panel(0,8,68,3.2,0xc3b6a2);
  panel(0,-6,3.1,12,0xc3b6a2);
  panel(0,-20,41,3.2,0xc3b6a2);
  // Hand rails are wall-mounted well above the floor and intentionally nonblocking.
  for(const z of [6.2,10.0])for(const [x,w] of [[-22,24],[22,24]])
    box(w,.09,.12,x,.89,z,TRIM);
  for(const x of [-4.72,4.72])box(.12,.09,10.6,x,.89,-6.1,TRIM);
  for(const z of [-18.3,-21.9])for(const [x,w] of [[-12,13],[12,13]])
    box(w,.09,.12,x,.89,z,TRIM);
  // External windows align with public aerial and street-level imagery only by rhythm,
  // not with surveyed bedroom positions. Decorative glazing is NOT a real plan.
  for(let x=-30;x<=30;x+=6){
    if(Math.abs(x)<4)continue;
    for(const z of [17.02,.02]){
      box(1.65,1.25,.045,x,1.87,z,GLASS);
      box(.07,1.28,.06,x,1.87,z+.04,0xf1e8d9);
      windows.push({axis:'z',at:z,s:x-.825,e:x+.825,out:z>8?1:-1});
    }
  }
  for(let x=-18;x<=18;x+=6)for(const z of [-28.48,-10.99]){
    box(1.5,1.28,.055,x,1.85,z,GLASS);
  }
  // Twelve illustrative residential bedroom bays and their walkable doorway gaps.
  const nxs=[-28,-19,-10,10,19,28];
  for(const x of nxs){
    for(const side of [1,-1]){
      const zWall=side>0?10.0:6.0,centre=side>0?13.5:3.0;
      // No door-shaped wall blocks the central 1.5m approach into each bay.
      const start=x-3.9,end=x+3.9,gap=0.78;
      solid(3.9-gap,2.55,.13,(start+x-gap)/2,1.275,zWall,WALL);
      solid(3.9-gap,2.55,.13,(x+gap+end)/2,1.275,zWall,WALL);
      box(1.55,.17,.16,x,2.76,zWall,WALL);
      const bx=x+(x>0?.8:-.8);
      // With x room centres ±10 etc beds face along the enclosed bay depth.
      bed(bx,centre+(side>0?1.0:-.35),false);
    }
  }
  // Rear wing has a series of bedrooms, communal dining and lounge.
  for(const x of [-16,-10,10,16]){
    const rearZ=-24.5;
    bed(x,rearZ,false);
    box(4.0,.08,.10,x,1.10,-21.9,TRIM);
  }
  // Communal dining: small groups, never large unbroken banquet tables.
  for(const x of [-12,-8]) {
    table(x,-15.0);
    chair(x-.95,-15.0,0x91ac80,Math.PI/2);
    chair(x+.95,-15.0,0xa9819d,-Math.PI/2);
  }
  // Southern sitting nook and family visits.
  for(const x of [9,12,15]){
    chair(x,-15.3,x%2?BLUE:GREEN);
  }
  table(12.0,-13.8);
  // Front reception / nursing call point; visual counter is NOT an operational station plan.
  solid(3.1,1.0,.75,-2.1,.52,13.45,0xb8a58e);
  box(2.7,.06,.30,-2.1,1.05,13.45,0xf0e8de);
  box(.55,.34,.08,-2.6,1.32,13.0,0x4e626d);
  box(.39,.22,.04,-2.6,1.32,13.08,GLASS);
  box(.25,.38,.10,-.9,1.22,13.15,0x6aa181);
  for(const [x,z] of [[-1.4,10.8],[2,11.0]])chair(x,z,0x9ab5b0);
  // Small public viewing garden patio beneath the southern-facing windows.
  box(16,.05,3,0,.03,-31,0xd0c6ac);
  for(const x of [-7,7]){box(.95,.35,.62,x,.21,-31,0x887051);b.ball(0x608449,.55,x,.82,-31);}
  // Ceiling luminaires illuminate corridors and communal rooms.
  for(const [x,z] of [[0,14],[-24,8],[-12,8],[12,8],[24,8],[0,-5],[0,-18],[-11,-15],[12,-15]]){
    box(2.0,.06,.50,x,3.11,z,0xfff5da);
  }
  b.box(0xefe1bd,2.7,.08,.65,0,3.0,17.20);
  group.add(b.build());
  for(const [x,z,r] of [[0,11,26],[-22,8,30],[22,8,30],[0,-12,23],[12,-19,25],[-12,-19,25]]){
    const light=new THREE.PointLight(0xffe9c6,7.5,r,1.5);
    light.position.set(x,2.75,z);group.add(light);
  }
  group.add(new THREE.HemisphereLight(0xffffff,0x8b7769,1.1));
  label('Reception and visitors',0,2.25,14.5);
  label('Northern residential wing',0,2.5,8);
  label('Communal dining',-11,2.1,-14.1);
  label('Residents\' sitting lounge',12,2.1,-17);
  info('welcome','About Yeoval Aged Care','Real facility: 3–[address redacted], Yeoval NSW. UPA provides nursing care, respite, dementia-specific support, meals, bedrooms and co-located community services. This walkthrough is an illustrative reconstruction, not a floor plan.',2.2,13.6);
  info('rooms','Resident accommodation','UPA describes both single and shared resident rooms, with care assistance and emergency-call systems. Bed placements in this simulation are not verified.',-18,8.2);
  info('dining','Meals and dining','UPA confirms meals served in a communal dining room. The dining room was reconstructed during renovation joining formerly separate buildings. The exact room position here is an estimate.',-11,-18.0);
  info('services','Nursing and community care','Yeoval offers residential aged care, home care, a co-located community health centre and related allied-health/community programs.',1.6,-6);
  info('evidence','Model accuracy and privacy','Exterior wing arrangement, portico, metal roof and general colours are drawn from the publicly supplied [address redacted] View and aerial screenshot. Interior wall positions are illustrative: never use the model for emergency access or resident navigation.',2.2,10.5);
  // NOTE: leave front door unblocked; the global game exit sensor uses z1.
  return {group,colliders,interactables,placedProps,sceneObjects,seats,windows,
    rooms,doors:[],dynamics:[],walkers:[],sight:[],
    bounds:{x0:-35.1,x1:35.1,z0:-28.6,z1:17.2},
    spawn:new THREE.Vector3(0,0,14.25),
    exitZone:{x0:-1.3,x1:1.3,z0:16.9,z1:18.6},
    campusSite:YEOVAL_SITE};
}
