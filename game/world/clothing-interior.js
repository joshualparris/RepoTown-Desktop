// A6-N: independent Australian country-town clothing and footwear shop.
// Design references: NCC/AS1428.1 accessible routes, retail fitting room privacy,
// merchandising sightlines, POS, stockroom and customer journey.
// Illustrative game model, not a certified architectural plan.
import {createKit} from './interior-kit.js';
export const CLOTHING_PLAN=Object.freeze({areas:['entry and seasonal window','womenswear','menswear','footwear','fitting rooms','accessible fitting room','checkout','stockroom'],mainAisleMetres:2.2,fittingRooms:2});
export function buildClothingInterior(site,makeLabel){
 const k=createKit(site,makeLabel,'Gumleaf Outfitters');
 const {THREE,group,box,solid,cyl,ball,text,add}=k;
 const C={timber:0x9a7658,cream:0xe8d8bf,ink:0x283b40,forest:0x315c4e,brass:0xb98c4e,cloth:[0x9c594f,0x5b768b,0xb3a16e,0x6b655e,0x769482,0xb6787b]};
 k.shell({wall:0xc6b49b,ceiling:0xe3d7c4,floor:0x927b67,frontSill:.8,sideSill:1.15});
 group.add(new THREE.HemisphereLight(0xfff1d5,0x7e8d86,1.6));
 box(13.2,.015,5.1,0,.015,3.15,0xa9876b);
 box(2.25,.017,14.5,0,.02,-4.4,0xb69c7f);
 // Front feature: actual garment silhouettes on two freestanding mannequins.
 for(const [x,col] of [[-4.6,0x54745e],[4.8,0xb07866]]){
  cyl(.13,.17,.95,x,.48,4.35,0x6c635b);
  cyl(.25,.2,.22,x,1.03,4.35,0xc8aa86);
  box(.78,.93,.3,x,1.53,4.35,col);
  ball(.24,x,2.23,4.35,0xc8aa86);
 }
 // Checkout along right front wall with lower accessible section and card terminal.
 solid(2.6,.91,.72,4.55,.455,1.4,C.forest);
 solid(1.1,.72,.72,2.7,.36,1.4,C.forest);
 box(3.9,.065,.8,3.95,.95,1.4,C.timber);
 box(.32,.1,.26,4.9,1.06,1.35,C.ink);
 box(.48,.37,.08,5.25,1.35,1.12,C.ink);
 text('PAY HERE',4.2,2.45,1.25);
 // Sidewall rails and individual coloured garments with sleeves and hangers.
 for(const side of [-1,1])for(const z of [-1.0,-3.9,-6.8]){
  const x=side*5.95;
  box(.11,.1,2.45,x,2.15,z,C.brass);
  for(let i=0;i<7;i++){
   const zz=z-1.02+i*.34,col=C.cloth[(i+(side>0?2:0))%C.cloth.length];
   box(.56,.82,.12,x-side*.12,1.53,zz,col);
   box(.16,.38,.13,x-side*.48,1.76,zz,col);
   box(.08,.19,.08,x,2.04,zz,0x6e6a60);
  }
 }
 text('WOMENSWEAR',-5.2,3.0,-3.8);
 text('MENSWEAR',5.2,3.0,-3.8);
 // Centre island: two low folded-shirt display tables, away from clear central route.
 for(const x of [-3.15,3.15]){
  solid(2.1,.72,1.3,x,.36,-2.15,C.timber);
  for(let i=0;i<4;i++)box(.72,.06,.42,x+(i%2-.5)*.86,.77+Math.floor(i/2)*.08,-2.15,C.cloth[i]);
 }
 // Footwear display: wall shelving and distinct shoes, no solid obstacle in aisle.
 for(const z of [-8.9,-10.1]){
  box(3.3,.1,.55,-4.85,1.1,z,C.timber);
  box(3.3,.1,.55,-4.85,1.8,z,C.timber);
  for(const x of [-5.95,-4.85,-3.75]){
   box(.5,.18,.25,x,1.26,z,0x514b45);
   box(.5,.18,.25,x,1.95,z,0x9b704e);
  }
 }
 text('BOOTS & FOOTWEAR',-4.75,2.85,-10.9);
 // Fitting room walls split into short segments; two accessible walk-through entries.
 // Both entrances face the shared rear corridor at z=-8.1, with 1.55 m openings.
 for(const x of [2.25,5.0]){
  solid(.13,2.85,3.1,x,1.425,-10.3,0x8d806e);
 }
 solid(4.2,2.85,.12,4.25,1.425,-11.78,0x8d806e);
 // Open front at z=-8.8, with privacy returns rather than a collidable door.
 for(const x of [2.0,5.55])solid(.8,2.85,.12,x,1.425,-8.8,0x8d806e);
 box(1.6,.13,.14,3.65,2.78,-8.8,C.forest);
 box(.7,1.35,.05,3.6,1.55,-11.65,0x9eafaa);
 box(.75,.07,.42,3.6,.58,-10.95,C.timber);
 box(.12,.55,.11,4.4,1.6,-10.9,C.brass);
 text('FITTING ROOMS',3.7,3.22,-8.95);
 // Back-of-house stock handling: racks at rear-left, not blocking fitting-room route.
 for(const x of [-6.0,-4.85])for(const y of [.65,1.55,2.45]){
  box(.75,.1,1.5,x,y,-10.8,C.timber);
  for(const z of [-11.2,-10.65])box(.54,.3,.43,x,y+.2,z,0xb8a28a);
 }
 // Distinctive warm downlights and branded interior colour band.
 for(const x of [-4,0,4])for(const z of [-8,-3,2]){
  box(1.15,.065,.4,x,4.38,z,0xfff1d5,{e:0xffdca0});
 }
 box(13.6,.24,.15,0,3.55,-11.7,C.forest);
 text('GUMLEAF OUTFITTERS',0,3.2,-11.55,'room');
 text('EXIT',0,2.75,5.55);
 add('checkout','Pay for clothing','civic-ledger','A staffed point of sale with card terminal, returns counter and a lower accessible service section.',1.25,1.35);
 add('womenswear','Browse womenswear','info','Browse seasonal dresses, shirts and knitwear on wall rails and folded displays.',-3.4,-4.7);
 add('menswear','Browse menswear','info','Workwear, everyday shirts and country-town essentials.',3.2,-4.7);
 add('shoes','Try on footwear','info','Boots and shoes are arranged by size along the rear display.',-2.4,-9.4);
 add('fitting','Use fitting room','info','Walk into the open fitting area for a mirror, bench and hooks. No camera is installed inside.',3.6,-9.9);
 return k.finish({clothingLayout:CLOTHING_PLAN,staff:{pos:{x:4.5,z:.2},use:{x:1.25,z:1.35}}});
}
