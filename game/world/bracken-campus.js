// Bracken House Dubbo — public-reference architectural massing.
// The *geometry is an interpretive game model*, not a real as-built plan or care map.
// The public imagery shows a sprawling single-storey pitched-roof courtyard building,
// driveway from Bracken Way, PV panels and adjacent separate Oxley village houses.
import {Builder,GLASS} from './builder.js';

export const BRACKEN_SITE=Object.freeze({
  id:'bracken-house',name:'Bracken House',
  realAddress:'[address redacted], Dubbo NSW 2830',
  x:58,z:-288,rotation:-Math.PI/2,entryAxis:'west',
  // Image calibration: ~100ft scale bar ~117 pixels => 3.84px/m.
  // Building envelope around 81×96m; individual bar sizes are provisional.
  wings:Object.freeze([
    {id:'north',x:-28,z:0,w:25,d:96},
    {id:'south',x:28,z:0,w:25,d:96},
    {id:'east',x:0,z:-34,w:56,d:28},
    {id:'west',x:0,z:34,w:56,d:28},
  ]),
  courtyard:Object.freeze({x0:-15.5,x1:15.5,z0:-20,z1:20}),
  // The portico opens west onto Bracken Way, not across Macquarie Street.
  front:48,entry:Object.freeze({x:10,z:-300.5}),
  approach:Object.freeze({x:6,z:-300.5}),
  scaleStatus:'estimated with 100ft screenshot scale bar, not surveyed',
  visualPeriod:'public aerial and facade/interior photographs, some older than 2026',
});
export function brackenWorld(x,z){
  // 90 degree rotation: +local Z points west, +local X points south.
  return {x:BRACKEN_SITE.x-z,z:BRACKEN_SITE.z+x};
}
const STONE=0xe7e2d7,ROOF=0x989d9e,ROOFEDGE=0x757b7c,
  BRICK=0xb67960,REDBOARD=0x984e45,WINDOW=0x8babb7,WOOD=0xa78967,
  ROAD=0x4f5151,PLANT=0x587d49,IRON=0x4d5f65;
function shell(b,w,tag){
  const {x,z,w:width,d:depth}=w,h=4.0;
  // Independent external walls — central courtyard remains open-air.
  b.box(BRICK,width,h,.24,x,h/2,z-depth/2+.12);
  if(tag==='west'){
    const gap=-12.5, half=1.4;
    const left=gap-half-(x-width/2),right=x+width/2-(gap+half);
    b.box(BRICK,left,h,.24,x-width/2+left/2,h/2,z+depth/2-.12);
    b.box(BRICK,right,h,.24,gap+half+right/2,h/2,z+depth/2-.12);
    b.box(BRICK,2.8,h-2.75,.24,gap,2.75+(h-2.75)/2,z+depth/2-.12);
  }else b.box(BRICK,width,h,.24,x,h/2,z+depth/2-.12);
  for(const side of [-1,1]) b.box(BRICK,.24,h,depth,x+side*(width/2-.12),h/2,z);
  // Metal roof with raised ridge and aluminium gutters along eaves.
  b.box(ROOF,width+.6,.16,depth+.6,x,4.07,z);
  b.box(ROOFEDGE,width+.32,.18,depth*.66,x,4.42,z);
  b.box(0xb6bbba,width+.5,.10,.22,x,4.24,z-depth/2);
  b.box(0xb6bbba,width+.5,.10,.22,x,4.24,z+depth/2);
  if(tag==='west'){
    // Bracken photos show red timber horizontal-louvre residential facades.
    for(let q=-22;q<=21;q+=2.9){
      for(let y=1.0;y<3.15;y+=.4)
        b.box(REDBOARD,.085,.105,3.8,q,y,depth/2+.17);
    }
  }
  // External room windows and projecting sunhoods.
  const n=Math.max(3,Math.floor((tag==='north'||tag==='south'?depth:width)/5.5));
  for(let i=0;i<n;i++){
    const d=-.5+(i+.5)/n;
    const t=2*d;
    const wx=tag==='east'||tag==='west'?x+t*(width/2-1.6):x+Math.sin(i*2.1)*.09,
      wz=tag==='north'||tag==='south'?z+t*(depth/2-1.6):z+Math.sin(i*2.3)*.09;
    if(tag==='west' && Math.abs(wx+12.5)<3 && i<n-3)continue;
    if(tag==='west'||tag==='east'){
      b.box(WINDOW,1.72,1.66,.09,wx,2.05,z+depth/2+.12);
      b.box(0xe2ddd1,1.85,.15,.36,wx,2.94,z+depth/2+.23);
    }else{
      for(const zz of [z-depth/2-.09,z+depth/2+.09]){
        b.box(WINDOW,.065,1.62,1.55,x+width/2+.06,2.06,wz);
        b.box(WOOD,.07,.11,1.75,x+width/2+.15,2.95,wz);
      }
    }
  }
}
export function buildBrackenCampus(group,colliders){
  const s=BRACKEN_SITE,b=new Builder();
  // A public-access driveway extending an existing northern avenue.
  b.box(ROAD,160,.055,7,7,.025,58); // local +X = world south; western road reaches original grid
  // Stand-alone west side parking, Bracken Way-style circulation and portico approach.
  b.box(ROAD,61,.04,14,-2,.020,65);
  b.box(0xd2cfc4,59,.025,6,-2,.03,54);
  for(let i=0;i<11;i++){
    const x=-24+i*4.9;
    b.box(0xe8e4d8,.12,.05,5,x,.055,60);
  }
  for(const wing of s.wings)shell(b,wing,wing.id);
  // Actual public entrance gap on local western face, not a blocked painted-on door.
  b.box(0xe4d9cb,9,.20,7,-12.5,3.55,51.1);
  for(const x of [-16.3,-8.7])for(const z of [49.2,54.2])
    b.cyl(0xc5b7a3,.19,3.35,x,1.69,z);
  b.box(IRON,2.7,2.8,.11,-12.5,1.4,48.20);
  b.box(GLASS,2.42,2.46,.12,-12.5,1.45,48.31);
  b.box(0xc2b59f,.07,2.4,.16,-12.5,1.42,48.41);
  b.box(0xe8e1d2,9,.18,1,-12.5,.05,48.5);
  b.box(0x79aeb0,3,.74,.07,-18.1,3.3,48.22);
  // Recognisable central open landscaped courtyard with pedestrian loop.
  b.box(0x749f62,30,.02,38,0,.025,0);
  for(const side of [-1,1]){
    b.box(0xd4cbb7,2.3,.035,36,side*12.8,.05,0);
    b.box(0xd4cbb7,25,.035,2.3,0,.05,side*16);
  }
  for(const [x,z] of [[-5,-6],[6,8],[-9,11]]){b.cyl(WOOD,.13,1.75,x,.87,z);b.ball(PLANT,1.45,x,2.3,z);}
  // Photographs show a bench and communal lawn; courtyard is open to the sky.
  for(const [x,z] of [[-2,-11],[7,3]]) {
    b.box(WOOD,2.4,.13,.67,x,.60,z);
    for(const q of [-.89,.89])b.box(IRON,.12,.55,.12,x+q,.32,z);
  }
  // Solar arrays on three roof segments visible in the aerial.
  for(const [x,z,wide,count] of [[-28,-25,false,6],[28,22,false,6],[0,-34,true,5]]){
    for(let i=0;i<count;i++){
      const sx=wide?x-19+i*8.0:x;
      const sz=wide?z:z-38+i*8.5;
      b.box(0x23384d,wide?3.5:5.5,.055,wide?5.7:3.4,sx,4.62,sz);
      b.box(0xb3c3cb,.05,.08,wide?5.75:3.5,sx,4.68,sz);
    }
  }
  // Two small roof monitor structures visible above the red residential facade.
  for(const z of [-16,18]){
    b.box(REDBOARD,8.5,1.2,7.0,3,5.02,z);
    b.box(ROOF,9.1,.12,7.5,3,5.70,z);
    b.box(WINDOW,6.6,.65,.08,3,5.2,z+3.55);
  }
  // Solar hot water / back-up facility massing only, not an operational security plan.
  b.box(0xc9c8bd,4.5,2.8,4.2,35,1.4,-56);
  for(const [x,z] of [[34,-58],[-37,-51],[37,52],[-37,53]]){
    b.cyl(0x7b6958,.20,2.0,x,1.0,z);
    b.ball(PLANT,1.7,x,2.75,z);
  }
  const mesh=b.build();mesh.position.set(s.x,0,s.z);mesh.rotation.y=s.rotation;
  mesh.name='Bracken House public-reference massing';group.add(mesh);
  const rect=(x0,x1,z0,z1)=>{
    const a=brackenWorld(x0,z0),c=brackenWorld(x1,z1);
    colliders.push({x0:Math.min(a.x,c.x),x1:Math.max(a.x,c.x),
      z0:Math.min(a.z,c.z),z1:Math.max(a.z,c.z)});
  };
  rect(-40.5,-15.5,-48,48);rect(15.5,40.5,-48,48);
  rect(-15.5,15.5,-48,-20);
  // West entry gap at x=-12.5 in the narrow western wing.
  rect(-15.5,-13.9,20,48);rect(-11.1,15.5,20,48);
  rect(-13.9,-11.1,20,46.2); // leave doorway physically clear
  return {...s,mesh,door:{...s.entry},facing:'west'};
}
