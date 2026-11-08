// Bracken House public-image architectural interpretation — NOT a room-by-room floor plan.
// No actual security, staff station, locked wing boundaries or clinical record positions.
// The 74 licensed beds include 20 dementia-specific according to 2025 Australian government
// material; here furniture density is illustrative, not a resident census.
import * as THREE from 'three';
import {Builder,GLASS} from './builder.js';
import {makeSeat} from './seats.js';
import {BRACKEN_SITE} from './bracken-campus.js';

const C={wall:0xf1ece2,brick:0xa96e56,carpet:0xbaa995,ceiling:0xf8f5ee,
  trim:0xbdab91,wood:0x9d795b,purple:0x93467e,lime:0x8eac6d,
  blue:0x8eabb4,steel:0x818c90,care:0xe1e3df,green:0x83a374};
export function buildBrackenInterior(makeLabel){
  const b=new Builder(),group=new THREE.Group();group.name='Bracken House public-reference walkthrough';
  const colliders=[],interactables=[],placedProps=[],seats=[],windows=[],sceneObjects=[];
  const rooms=[
    {name:'Main Bracken Way entrance and reception',x0:-16,x1:-8,z0:38,z1:48,w:8,d:10,parent:-1},
    {name:'Courtyard residential corridor — north wing',x0:-40.5,x1:-15.5,z0:-48,z1:48,w:25,d:96,parent:0},
    {name:'West residential wing',x0:-15.5,x1:15.5,z0:20,z1:48,w:31,d:28,parent:1},
    {name:'East residential wing',x0:-15.5,x1:15.5,z0:-48,z1:-20,w:31,d:28,parent:1},
    {name:'South residential wing',x0:15.5,x1:40.5,z0:-48,z1:48,w:25,d:96,parent:1},
    {name:'Landscaped courtyard',x0:-15.5,x1:15.5,z0:-20,z1:20,w:31,d:40,parent:1},
    {name:'Dining and living',x0:-36,x1:-17,z0:-19,z1:18,w:19,d:37,parent:1},
    {name:'Chapel and reflection',x0:16,x1:36,z0:20,z1:43,w:20,d:23,parent:4},
  ];
  const box=(w,h,d,x,y,z,c)=>b.box(c,w,h,d,x,y,z);
  const solid=(w,h,d,x,y,z,c)=>{box(w,h,d,x,y,z,c);
    colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});};
  const info=(key,label,text,x,z)=>{
    const pos=new THREE.Vector3(x,0,z);
    interactables.push({key:'bracken:'+key,type:'civic',label,room:0,
      roomName:'Bracken House public reference',pos,act:{do:'info',title:label,text}});
    sceneObjects.push({type:'civic',label,pos:{x,z},room:0,interactive:true});
  };
  const label=(t,x,z,y=2.4)=>{const object=makeLabel(t,'room');object.position.set(x,y,z);object.userData.labelKind='room';group.add(object);};
  const seat=(x,z,color,ry=0,key='visitor')=>{
    // Low soft armchair, with a registered sitting interaction.
    b.at(x,0,z,ry,()=>{
      box(.80,.26,.75,0,.54,0,color);
      box(.80,.69,.19,0,.98,-.31,color);
      for(const side of [-1,1])box(.13,.39,.70,side*.37,.63,0,color);
      for(const dx of [-.30,.30])for(const dz of [-.30,.30])
        box(.09,.34,.09,dx,.17,dz,C.wood);
    });
    seats.push(makeSeat('bracken:chair:'+key+':'+x+':'+z,'armchair',x,z,Math.PI+ry,{room:0,roomName:'Bracken sitting space'}));
    placedProps.push({type:'armchair',room:0,pos:{x,z}});
  };
  const bed=(x,z,key)=>{
    solid(1.15,.55,2.15,x,.35,z,0x9ba5aa);
    box(1.14,.22,1.85,x,.69,z,C.care);
    box(1.04,.10,.52,x,.85,z+.62,0xffffff);
    box(.43,.54,.45,x+.88,.31,z+.53,C.wood);
    box(.18,.23,.09,x+1.02,.77,z+.62,C.blue);
    placedProps.push({type:'careBed',room:1,pos:{x,z},key});
  };
  const roundTable=(x,z,r=.85)=>{
    b.cyl(0xb7a080,r,.12,x,.77,z);
    b.cyl(C.steel,.09,.67,x,.40,z);
    solid(.52,.08,.50,x,.07,z,C.wood);
  };
  // Floor slabs form the ring and are not a blank 96×81m solid rectangle;
  // the central courtyard has grass and sky, as seen from satellite.
  for(const [x,z,w,d] of [[-28,0,25,96],[28,0,25,96],[0,-34,56,28],[0,34,56,28]]){
    box(w,.22,d,x,-.13,z,C.carpet);
    box(w,.16,d,x,3.83,z,C.ceiling);
  }
  // Hallway is a continuous loop along courtyard glazing; north-west foyer has true 3m gap.
  solid(.25,3.55,96,-40.5,1.775,0,C.wall);
  solid(.25,3.55,96,40.5,1.775,0,C.wall);
  solid(81,3.55,.25,0,1.775,-48,C.wall);
  solid(26.6,3.55,.25,-27.2,1.775,48,C.wall);
  solid(50,3.55,.25,15.5,1.775,48,C.wall);
  box(2.8,.69,.25,-12.5,3.17,48,C.wall);
  // Glazed courtyard-facing walls interrupted by generous courtyard threshold openings.
  for(const [x,len] of [[-15.5,16.5],[15.5,16.5]]){
    solid(.17,1.0,len,x,.5,-11.7,C.brick);
    solid(.17,1.0,len,x,.5,11.7,C.brick);
    for(const z of [-11.7,11.7])box(.05,2.26,6.6,x,2.37,z,GLASS);
  }
  for(const z of [-20,20]){
    solid(12,1.0,.17,-9.5,.5,z,C.brick);
    solid(12,1.0,.17,9.5,.5,z,C.brick);
    for(const x of [-9.5,9.5])box(6.0,2.3,.055,x,2.3,z,GLASS);
  }
  // Safety handrails follow the long brick-lined corridors shown in UPA photos.
  for(const x of [-39.7,-16.1,16.1,39.7])
    for(const z of [-33,0,33])box(.12,.10,22,x,.90,z,C.wood);
  for(const z of [-46.6,-20.5,20.5,46.6])
    for(const x of [-26,26])box(22,.10,.12,x,.90,z,C.wood);
  // Explicit bedroom bays only where public-facing interpretation is appropriate.
  // No door-number assertion or hidden operational map of real bedrooms.
  let number=0;
  for(const [xx,room] of [[-33,1],[33,4]]){
    for(let z=-42;z<=42;z+=6.0){
      bed(xx,z,++number);
      box(1.6,2.25,.08,xx+Math.sign(-xx)*4.5,1.2,z+2.1,0xb5a590);
      // Ensuite cue: frosted panel and basin, not a real private-room plan.
      box(.84,1.94,.065,xx+1.8,1.35,z-1.4,0xc2cdcc);
      box(.54,.15,.39,xx+1.6,.81,z-1.0,0xf7f8f4);
    }
  }
  for(const zz of [-39,39]){
    for(let x=-9;x<=9;x+=6.0){
      bed(x,zz,++number);
      box(.65,1.7,.07,x+2,1.25,zz-1.6,0xc7cbc4);
    }
  }
  // Dining room: pink/lime upholstered chairs and circular tables visible in photos.
  for(const z of [-11,0,11]){
    for(const x of [-29,-23]){
      roundTable(x,z);
      seat(x-1.5,z,C.purple,Math.PI/2,'dining');
      seat(x+1.5,z,C.lime,-Math.PI/2,'dining');
    }
  }
  // Glass-screen lounge, acoustical ceiling strips, bright colours and courtyard views.
  box(.045,2.65,18,-17.7,2.08,0,GLASS);
  for(const z of [-13,-6,1,8,15]){
    box(1.95,.065,3.2,-24,3.55,z,0xbca884);
    box(.16,.18,3.2,-24,3.48,z,0x806f53);
  }
  for(const [x,z,c] of [[-32,26,C.blue],[-28,27,C.blue],[24,-2,C.blue],[29,-3,C.lime],
                         [23,8,C.purple],[27,9,C.lime]])seat(x,z,c,0,'lounge');
  roundTable(-30,29,.58);roundTable(25,4,.65);
  // On-site chapel as published by UPA; its precise position is NOT evidenced.
  for(let q=0;q<4;q++){
    const x=20+q*4.2;
    box(3.0,.24,.65,x,.69,32,C.wood);
    for(const t of [-1.35,1.35])box(.10,.72,.10,x+t,.39,32,C.wood);
    box(3.0,.71,.15,x,1.0,31.8,C.wood);
  }
  box(.14,1.6,.12,21,2.20,43,C.wood);box(.98,.14,.12,21,2.40,43,C.wood);
  // Serving area, cafe corner, library, and hair salon are public *functions*,
  // but no operational staff access or store layouts are claimed.
  solid(3.0,.99,.83,-24,.54,-42,0xcdb99a);
  for(const x of [-33,-30,-27]){
    box(.65,1.55,.32,x,1.3,-44,C.wood);
    for(const y of [.72,1.18,1.67])box(.60,.08,.29,x,y,-43.8,0x6b8b8d);
  }
  box(1.15,1.9,.18,32,2.0,-40,0x9ea8a8);
  for(const [x,z] of [[-12.5,44.5],[-22,24],[-24,-30],[25,25]]){
    box(2.5,.07,.67,x,3.48,z,0xfff4d9);
  }
  // Garden route between courtyard seating and the bedrooms, outdoor lawn + paving.
  box(31,.09,40,0,-.035,0,0x82a06c);
  box(3.0,.04,39.5,0,.035,0,0xc5bda8);
  box(30.5,.04,2.9,0,.04,0,0xc5bda8);
  for(const [x,z] of [[-9,-13],[10,13],[9,-12]]) {
    b.cyl(C.wood,.14,1.55,x,.8,z);b.ball(C.green,1.2,x,2.1,z);
  }
  // Paned skylight clerestories and corridor lighting.
  for(const [x,z] of [[-30,-30],[-30,0],[-30,30],[30,-30],[30,0],[30,30],
                      [-11,29],[11,29],[-10,-31],[10,-31]]){
    const l=new THREE.PointLight(0xffecce,6,24,1.4);
    l.position.set(x,3.2,z);group.add(l);
  }
  group.add(new THREE.HemisphereLight(0xffffff,0x917e6c,1.05));
  group.add(b.build());
  label('Bracken House visitors and reception',-12.5,44.9);
  label('Courtyard — landscaped garden',0,0);
  label('Dining room',-24,6);
  label('Residents living room',-29,29);
  label('Chapel and reflection',22,38);
  label('Resident corridor',33,-23);
  info('welcome','About Bracken House','UPA Bracken House, [address redacted], Dubbo. Government sources describe 74 beds including a 20-bed dementia-specific unit. This is an architectural interpretation, not an actual resident or fire-safety floor plan.',-9.5,44.1);
  info('lavender','Lavender Wing','Bracken House provides a secure 20-bed dementia-specific Lavender Wing, with garden and recreation amenities. This public simulation deliberately does not map the real secured doors or security arrangements.',18,-7);
  info('chapel','Chapel and spiritual life','UPA describes an on-site chapel and reflection area with weekly services. This chapel location is an interpretation of the published facility amenities.',26,38);
  info('dining','Fresh meals and dining','The home has on-site meal preparation and communal dining. Photos show green and purple upholstered chairs, glazed partitions and broad acoustic ceiling panels.',-24,9);
  info('courtyard','Courtyard and gardens','Aerial imagery shows the distinctive roof-ring central courtyard. Public material describes BBQ, garden and recreation areas including aviaries and a fish pond. Exact positions remain unverified.',2.7,4);
  info('care','Residential care rooms','Published descriptions mention spacious single bedrooms with ensuites, bedside furniture, nurse-call and 24-hour nursing. Only examples are modelled: this is not a map of occupied rooms.',-22,-27);
  info('amenities','Publicly listed amenities','UPA lists a cafe corner, salon, activity room, library, laundry, courtyards and chapel. Staff-only equipment and real clinical rooms are not reproduced.',28,15);
  info('reference','Model accuracy notice','Exterior massing was derived from the user-supplied Bracken House aerial and public photographs. Footprints, layouts, door locations, room allocations and dimensions are not verified against as-built plans.',-12.7,40.8);
  return {group,colliders,interactables,sceneObjects,placedProps,seats,windows,
    rooms,doors:[],dynamics:[],sight:[],people:[],
    bounds:{x0:-40.6,x1:40.6,z0:-48.2,z1:48.4},
    spawn:new THREE.Vector3(-12.5,0,45.0),
    exitZone:{x0:-14.0,x1:-11.0,z0:47.7,z1:49.0},
    campusSite:BRACKEN_SITE};
}
