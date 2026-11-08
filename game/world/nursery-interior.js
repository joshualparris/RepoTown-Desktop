// Wambuul Nursery & Garden Centre: researched retail nursery floor, not a generic desk shell.
// Source notes: docs/NURSERY_REALISM_2026-10-27.md. Game units approximate metres.
import {createKit} from './interior-kit.js';
export const NURSERY_ZONES=Object.freeze(['Plant advice and checkout','Indoor plants','Native and drought-tolerant stock','Seedlings and propagation','Pots, mulch and tools','Water-wise gardening']);
export function buildNurseryInterior(site,makeLabel){
 const k=createKit(site,makeLabel,'Nursery & garden centre');
 const {group,box,solid,cyl,ball,text,add}=k;
 const C={wall:0xe3dfcb,wood:0x88694a,bench:0x6d7b67,leaf:0x497b42,dark:0x31552d,soil:0x564330,cream:0xf5eedb,metal:0x6d8585};
 k.shell({wall:C.wall,ceiling:0xe7e9df,floor:0xb3b6a9,frontSill:.7,sideSill:.9});
 group.add(new k.THREE.HemisphereLight(0xfff8df,0x627c70,2.4));
 // The centre aisle remains unobstructed from the entry to the rear service zone.
 box(2.5,.035,17.2,0,.025,-3,0xc5c5b4);
 text('WAMBUUL NURSERY',0,3.25,-11.65,'room');
 text('PLANTS · GARDENS · ADVICE',0,2.8,-11.6);
 // Low checkout on the east, with till and reusable shopping baskets.
 solid(2.8,.82,.7,4.75,.41,3.65,C.wood);
 box(.65,.35,.12,5.35,1.04,3.5,0x3b4b4e);
 box(.8,.09,.45,3.8,.85,3.6,C.metal);
 text('CHECKOUT',4.7,2.2,4.25);
 // Lightweight raised plant benches with under-bench clearance, not solid walls.
 function bench(x,z,w,d){
  box(w,.10,d,x,.82,z,C.bench);
  for(const sx of [-1,1])for(const sz of [-1,1])box(.09,.79,.09,x+sx*(w/2-.13),.4,z+sz*(d/2-.13),C.metal);
  // Collide with the actual footprint while keeping a central 2.5m aisle.
  k.blocker(w,d,x,z);
 }
 function pot(x,z,size=.18,leaf=0x508748){
  cyl(size*.83,size, size*1.05,x,.94+size*.52,z,0xb57a54);
  cyl(.025,.035,size*.9,x,1.06+size,z,C.dark);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(size*.75,x+Math.cos(a)*size*.65,1.18+size,z+Math.sin(a)*size*.65,leaf);}
 }
 // West: native stock and hardy shrubs. East: indoor plants and flowering pots.
 for(const x of [-4.8,4.8])for(const z of [-8.3,-4.8,-1.3]){
  bench(x,z,2.6,2.05);
  for(const dx of [-.82,0,.82])for(const dz of [-.62,0,.62])
   pot(x+dx,z+dz,.16+(Math.abs(dx)<.1?.035:0),x<0?0x6a8b54:0x438a65);
 }
 text('NATIVE & WATER-WISE',-4.65,2.45,-9.5);
 text('INDOOR & FLOWERING',4.65,2.45,-9.5);
 // Front-left seasonal seedlings: lower benches and seed trays.
 bench(-4.75,2.8,2.7,1.7);
 for(let i=0;i<4;i++)for(let j=0;j<3;j++){
  box(.55,.10,.37,-5.7+i*.63,.92,2.28+j*.47,C.soil);
  for(let n=0;n<3;n++)ball(.075,-5.52+i*.63+n*.13,1.06,2.28+j*.47,0x6ca44b);
 }
 text('SEEDLINGS',-4.75,2.15,3.9);
 // Rear: bagged potting mix, stacked pots and hand tools; keep back-of-house storage illustrative.
 for(let i=0;i<6;i++){
  box(.8,.48,.45,-5.75+i*.92,.24,-10.8,[0x9c916c,0xb0a27e,0x8b8b68][i%3]);
  box(.72,.1,.35,-5.75+i*.92,.52,-10.8,0x547454);
 }
 for(let i=0;i<5;i++)cyl(.3,.24,.34,3.4+i*.55,.22,-10.8,0xa87551);
 text('POTTING MIX · POTS',-2.3,2.25,-11.1);
 // Irrigation demonstration and water-saving sign, without an exposed wet walking surface.
 box(1.5,.12,.55,4.7,1.1,-7.9,C.metal);
 box(.07,1.5,.07,4.0,1.4,-7.9,0x677b86);
 box(1.5,.85,.04,4.7,2.15,-8.0,0x719e9a);
 text('WATER WISE',4.7,2.75,-8.1);
 // Recessed-looking lighting strips with modest practical illumination.
 for(const x of [-4,0,4])for(const z of [-8,-3,2]){
  box(1.7,.07,.35,x,4.38,z,0xfff4d7,{e:0xffdca1});
  const lamp=new k.THREE.PointLight(0xfff4df,.3,7);lamp.position.set(x,3.85,z);group.add(lamp);
 }
 text('EXIT',0,2.65,5.5);
 add('advice','Ask about plant care','info','Staff can help choose climate-suitable plants and advise on soil, sunlight and watering.',3.0,3.1);
 add('natives','Browse native plants','info','Native and drought-tolerant stock suits many inland NSW gardens; match the species to local conditions.',-2.9,-7.3);
 add('indoor','Browse indoor plants','info','Indoor plants have different light, drainage and humidity needs. Check labels before buying.',3.0,-4.8);
 add('seedlings','Choose seedlings','info','Seedling trays are raised for easy browsing; keep new plants protected from frost and heat.',-2.9,2.1);
 add('potting','Find pots and potting mix','info','Choose free-draining media and pots with drainage holes; keep heavy bags near the loading area.',-2.5,-10.1);
 add('water','Water-saving advice','info','Watering should match plant needs. Capture runoff and avoid mixing drainage from unhealthy stock.',3.0,-7.5);
 return k.finish({nurseryZones:NURSERY_ZONES,staff:{pos:{x:4.75,z:2.75},use:{x:4.75,z:3.65}}});
}
