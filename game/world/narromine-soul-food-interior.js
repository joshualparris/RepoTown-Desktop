// Bespoke public-facing *interpretive* Soul Food Depot & Gallery (Narromine) interior.
// The original site is a converted citrus packing shed. No measured shop plan has been
// published: rooms are a clearly fictional spatial arrangement of verified functions.
// Evidence: docs/narromine/interiors/SOUL_FOOD_DEPOT_2026-11-06.md
import * as THREE from 'three';

export const SOUL_FOOD_EVIDENCE=Object.freeze({
  name:'Soul Food Depot & Gallery',
  address:'1–[address redacted], Narromine NSW 2821',
  location:'Culling Street end of Dandaloo; OSM building #195 is only a proximity-based candidate',
  verifiedFloorplan:false, verifiedEntrance:false, verifiedHeadcount:false,
  officialWebsite:'https://www.soulfooddepot.com.au/',
  categories:Object.freeze(['former citrus packing shed', 'espresso and restaurant',
    'art-lined gallery', 'homewares and decor', 'Loading Dock takeaway window',
    'commercial kitchen and catering', 'licensed bar', 'event room',
    'meeting room (up to 20 boardroom)', 'boardroom (up to 12)', 'courtyard']),
  uncertainty:'The dimensions, relative positions, entry door, on-site occupancy and exact current arrangements are not independently surveyed.'
});
export function soulFoodOpen(weekday,minute){
  if(!Number.isInteger(weekday)||weekday<0||weekday>6||!Number.isFinite(minute))return false;
  const first=weekday===0?480:450;
  return minute>=first&&minute<900;
}
const station=(type,title,text)=>[type,title,{do:'info',station:true,title,text:
  text+' Service is verified on the venue website; the workstation placement and fictional staff are not.'}];
const info=(type,title,text)=>[type,title,{do:'info',title,text}];
export function soulFoodInteriorSpec(){
  return {
    layout:'grid',height:4.8,walls:0xb3aca0,floor:0x94948b,ceiling:0xaba6a0,
    doors:0x6e6154,light:0xffe9ba,
    rooms:[
      {name:'Soul Food · coffee and art-lined gallery (interpretive)',w:21,d:18,floor:0xaba59b,
        props:[
          station('counter','Cafe and Allpress coffee counter','The cafe serves Allpress coffee, breakfast, lunch, cakes and takeaway.'),
          station('coffeeMachine','Barista espresso machine','Coffee service is a prominent part of the real venue.'),
          info('cashRegister','Cafe point of sale','Ordering is illustrative; no real order or card payment occurs.'),
          info('cafeTable','Gallery dining table','A spacious dine-in gallery surrounds customers with artwork.'),
          'cafeTable','cafeTable','table','chair','chair','chair','chair','chair','chair','chair','chair','shelf'
        ]},
      {name:'Homewares, takeaway and licensed bar · locations unverified',w:14,d:18,floor:0xa8a195,
        props:[
          station('counter','Loading Dock takeaway collection','The actual venue operates a separate Loading Dock takeaway window; its wall position is not known.'),
          station('counter','Licensed bar and drinks enquiries','The venue advertises a licensed bar and wines from Orange and Hunter Valley.'),
          info('shelf','Homewares and local produce','Decor, gallery pieces and local products are featured by the venue; inventory is illustrative.'),
          'shelf','shelf','table','chair','chair','fridge','cashRegister'
        ]},
      {name:'Commercial kitchen and catering · no measured plan',w:11,d:18,floor:0xb3b6b4,
        props:[station('stove','Chef and hot food station','The venue advertises in-house cooking of seasonal meals and catering.'),
          station('workbench','Catering preparation','The business offers catering pickups, corporate packages and bespoke functions.'),
          'kitchenSink','fridge','freezer','pantry','crockery','crates','shelf']},
      {name:'Converted citrus-shed event room · reconstruction',w:21,d:22,floor:0x888883,
        props:[station('podium','Function hosting and presentations','The company advertises weddings, presentations, corporate functions and large celebrations.'),
          'table','table','table','table','table','chair','chair','chair','chair','chair','chair','chair','chair',
          'chair','chair','chair','chair','chair','chair','chair','chair','chair','chair','chair','chair']},
      {name:'Meeting room · capacity 20 advertised; layout inferred',w:14,d:12,floor:0xaaaaa4,
        props:[station('desk','Meeting and training enquiry','The real meeting room advertises up to 20 boardroom-style, 20 U-shape or 30 theatre-style seats.'),
          'table','table','chair','chair','chair','chair','chair','chair','noticeBoard','computer']},
      {name:'Boardroom · capacity 12 advertised; layout inferred',w:11,d:12,floor:0xa5a8a5,
        props:[station('desk','Boardroom booking','The real boardroom advertises 12 seats, a 75-inch screen, Wi-Fi, air-conditioning and whiteboard.'),
          'table','table','chair','chair','chair','chair','chair','chair','monitorWall','noticeBoard']}
    ]
  };
}
export function decorateSoulFoodInterior(built,makeLabel){
  const group=built.group;
  const mat=new Map();
  const material=(c,alpha=1)=>{
    const key=c+'|'+alpha;
    if(!mat.has(key))mat.set(key,new THREE.MeshLambertMaterial({color:c,transparent:alpha<1,opacity:alpha,depthWrite:alpha===1}));
    return mat.get(key);
  };
  const cube=(name,w,h,d,x,y,z,c,alpha=1)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(c,alpha));
    m.name=name;m.position.set(x,y,z);group.add(m);return m;
  };
  const room=built.rooms[0],event=built.rooms[3],fixtures=[];
  // Publicity explicitly describes zinc walls, washed timber, concrete and wire pendant lights.
  // The shapes are ORIGINAL, not copied images or claimed measurements.
  for(const r of [room,event]){
    const start=r.x0+.8,stop=r.x1-.8;
    const count=Math.max(2,Math.ceil((stop-start)/4.8));
    for(let i=0;i<count;i++){
      const x=start+(stop-start)*i/Math.max(1,count-1);
      cube('Exposed packing-shed overhead beam · interpretation',.15,.35,r.d-.55,
        x,4.33,(r.z0+r.z1)/2,0x806755);fixtures.push('packing-shed-beam');
    }
  }
  // Zinc-like corrugation along the event room back wall (not copied metal textures).
  const zincCount=Math.max(3,Math.floor((event.x1-event.x0)/.72));
  const zincMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.055,2.3,.04),material(0x777d7d),zincCount);
  const dummy=new THREE.Object3D();
  for(let i=0;i<zincCount;i++){
    dummy.position.set(event.x0+.3+i*(event.w-.6)/zincCount,2.45,event.z0+.18);
    dummy.updateMatrix();zincMesh.setMatrixAt(i,dummy.matrix);
  }
  zincMesh.name='Reused zinc corrugations · original procedural geometry';
  zincMesh.instanceMatrix.needsUpdate=true;group.add(zincMesh);
  // Original framed abstract colours; no real artist works reproduced.
  const art=[0x786d8c,0xb7774c,0x839676,0x9e745b,0x697c8b,0xc4a46a];
  for(let k=0;k<6;k++){
    const x=room.x0+1.55+k*(room.w-3.1)/5,z=room.z0+.25;
    cube('Gallery artwork frame · original abstract',1.15,.88,.06,x,2.35,z,0x403b35);
    cube('Original non-reproduction abstract art',.95,.70,.07,x,2.35,z+.05,art[k]);
  }
  // Wire-light silhouettes above event tables. Decorative, no collision.
  for(let k=0;k<4;k++){
    const x=event.x0+event.w*(k+1)/5,z=(event.z0+event.z1)/2;
    const lamp=new THREE.Mesh(new THREE.ConeGeometry(.40,.65,8,1,true),material(0x555451));
    lamp.name='Wire pendant-style event light · interpretation';lamp.position.set(x,3.85,z);
    lamp.rotation.x=Math.PI;group.add(lamp);
    cube('Warm event pendant diffuser',.35,.08,.35,x,3.46,z,0xffd698);
  }
  const hot=(key,title,body,x,z,ri)=>{
    built.interactables.push({key:'narromine-soulfood:'+key,label:title,type:'civic',room:ri,roomName:built.rooms[ri].name,
      pos:new THREE.Vector3(x,0,z),act:{do:'info',title,text:body+' This is an interpretive space; the exact room location is not surveyed.'}});
    built.sceneObjects.push({type:'civic',label:title,room:ri,pos:{x,z},interactive:true});
    if(typeof makeLabel==='function'){
      const label=makeLabel(title,'interactive');
      if(label){label.position.set(x,2.2,z);group.add(label);}
    }
  };
  hot('history','From citrus packing shed to gallery',
    'The official venue history describes converting a former citrus packing shed into a modern cafe and gallery in 2014.',room.x0+2.1,room.z1-3.2,0);
  hot('hours','Soul Food cafe opening times',
    'The venue cafe page lists Monday to Saturday 7:30am–3pm and Sunday 8am–3pm; older council listings disagree about Sunday. Event hours and public holidays need separate confirmation.',
    room.x1-2.2,room.z1-3.5,0);
  hot('events','Event room and courtyard booking',
    'The company advertises a large converted warehouse event room, plus a courtyard for smaller functions; sizes and present access routes are not measured.',
    event.x0+2.0,event.z1-3.2,3);
  hot('meeting','Meeting and boardroom capacities',
    'Published capacities are up to 20 boardroom-style in the meeting room and 12 in the dedicated boardroom; the displayed floor plan is not surveyed.',
    built.rooms[4].x0+1.8,built.rooms[4].z1-2.2,4);
  return {...built,soulFoodEvidence:SOUL_FOOD_EVIDENCE,soulFoodFixtures:fixtures,soulFoodLayoutVerified:false};
}
