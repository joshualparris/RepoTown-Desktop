// Repository Fresh Supermarket (F7-N): compact NSW independent grocer.
// References: FSANZ Standard 3.2.2 display/storage, NSW Food Authority cold chain,
// SafeWork NSW supermarket hazardous manual tasks. This is a simulation, not certification.
import {createKit} from './interior-kit.js';
export const SUPERMARKET_PLAN=Object.freeze({
  width:14,depth:18,entry:{x:0,z:3.75},minimumCentralRoute:2.4,
  coldDisplayTargetC:5,frozenDisplay:'frozen hard',
  zones:['produce','dry groceries','dairy and chilled','frozen','checkout','staff stock receiving']
});
export function buildSupermarketInterior(site,makeLabel){
 const k=createKit(site,makeLabel,'Independent supermarket');
 const {THREE,group,box,solid,text,add}=k;
 const C={wall:0xe9e8df,shelf:0x8e9185,white:0xe7efeb,green:0x53866d,red:0xa85e4d,steel:0x6c7e83,blue:0x4c8299};
 k.shell({wall:C.wall,ceiling:0xf6f7f2,floor:0xb6beb8,frontSill:.7,sideSill:.9});
 group.add(new THREE.HemisphereLight(0xfffcf0,0x78847e,1.9));
 text('REPOSITORY FRESH · LOCAL GROCER',0,3.4,-11.6,'room');
 // Three long gondolas: realistic sightlines and broad parallel shopping aisles.
 const productColours=[0xa8bc75,0xd7b774,0xa66b55,0x719fa9,0x8e8fb4,0xe4d7a8];
 for(const x of [-4.9,-2.3,.3]){
   solid(.85,1.65,5.1,x,.825,-5.0,C.shelf);
   for(const side of [-1,1])for(let level=0;level<3;level++){
     box(.12,.055,4.9,x+side*.43,.32+level*.47,-5.0,C.white);
     for(let j=0;j<15;j++)box(.23,.28,.23,x+side*.55,.51+level*.47,-7.3+j*.32,productColours[(j+level)%productColours.length]);
   }
 }
 text('PANTRY · CEREAL · PASTA',-3.6,2.35,-8.2);
 // Produce stands: distinct open baskets, not a refrigerated raw meat counter.
 for(const [x,z] of [[-5.3,1.9],[-3.35,1.9],[-5.3,-.1],[-3.35,-.1]]){
   solid(1.45,.65,1.1,x,.325,z,0x92704e);
   box(1.4,.07,1.05,x,.7,z,0x795b42);
   for(let i=0;i<4;i++)for(let j=0;j<3;j++)k.ball(.12,x-.48+i*.3,.84,z-.32+j*.29,[0x83a55a,0xc58b42,0xc45b42][(i+j)%3]);
 }
 text('FRESH FRUIT AND VEGETABLES',-4.3,2.3,1.0);
 // Enclosed chilled and frozen cabinets on rear/right walls. Contents are protected.
 // Door-front glazing is deliberately visible; cabinet carcasses are solid obstacles.
 for(const x of [2.0,3.5,5.0]){
   solid(1.2,2.3,.75,x,1.15,-10.95,C.steel);
   box(1.05,1.9,.045,x,1.2,-10.52,0x93c7d2,{a:.43});
   box(.055,1.2,.09,x+.43,1.25,-10.44,C.white);
   for(let j=0;j<3;j++)for(let i=0;i<3;i++)box(.22,.24,.17,x-.32+i*.32,.48+j*.52,-10.47,productColours[(i+j)%6]);
 }
 text('CHILLED DAIRY · KEEP AT 5°C OR BELOW',3.6,2.6,-11.45);
 for(const z of [-7.4,-5.9,-4.4]){
   solid(.75,1.7,1.15,6.1,.85,z,C.blue);
   box(.065,1.5,.98,5.69,.87,z,0xb8d9e2,{a:.5});
   box(.07,.75,.09,5.61,1.0,z+.36,C.white);
 }
 text('FROZEN FOOD · KEEP FROZEN HARD',5.25,2.55,-7.8);
 // Checkout counter, scanner, conveyor and low bagging shelf. Customer approaches from aisle.
 solid(2.7,.82,.78,3.35,.41,2.2,C.steel);
 box(2.8,.08,.88,3.35,.86,2.2,C.white);
 box(1.15,.045,.58,2.75,.92,2.2,0x344f58);
 box(.48,.42,.09,4.18,1.22,2.03,0x263d45);
 box(.42,.3,.02,4.18,1.24,2.08,0x7bb4a8,{e:0x37796b});
 box(.7,.18,.55,4.5,.8,2.95,0xb5b8ac);
 text('CHECKOUT · EXPRESS',3.4,2.15,2.1);
 // Staff receiving is behind the public shelves. Heavy cartons on low pallets.
 for(const x of [-5.3,-3.7,-2.1]){
   box(1.1,.16,1.1,x,.11,-10.5,0x977957);
   for(let j=0;j<2;j++)box(.9,.55,.8,x,.48+j*.57,-10.5,0xb6a078);
 }
 text('STOCK RECEIVING · STAFF ONLY',-4.0,2.35,-11.4);
 // Flat entrance, shopping baskets, waste bins and uniform LED-style luminaires.
 box(2.25,.025,2.4,0,.02,4.5,0xcbd2c9);
 for(let i=0;i<3;i++)box(.48,.35,.38,-1.2+i*.53,.2,4.65,C.green);
 box(.5,.78,.48,5.9,.39,4.4,0x4b6362);
 for(const x of [-4.7,0,4.7])for(const z of [-8.4,-3.3,1.7])box(1.4,.06,.52,x,4.38,z,0xfff7e7,{e:0xffebca});
 text('EXIT',0,2.8,5.5);
 add('checkout','Pay for groceries','civic-ledger','Scan your shopping, confirm the total, and collect your receipt.',1.5,2.1);
 add('produce','Browse local produce','info','Fresh fruit and vegetables are displayed separately from raw meat and other potentially hazardous foods.',-2.0,1.6);
 add('pantry','Browse pantry staples','info','Packaged pasta, rice, cereals and tinned goods are organised by aisle.',1.55,-4.5);
 add('dairy','Browse chilled dairy','info','Temperature-controlled cabinets should hold potentially hazardous foods at 5°C or below.',1.1,-9.5);
 add('frozen','Browse frozen foods','info','Frozen food should remain frozen hard; staff check and record display temperatures.',4.5,-4.0);
 add('stock','Ask about stock availability','info','Staff rotate stock and separate deliveries from customer walkways.',1.3,-7.5);
 return k.finish({supermarketLayout:SUPERMARKET_PLAN,staff:{pos:{x:4.2,z:1.0},use:{x:1.5,z:2.1}}});
}
