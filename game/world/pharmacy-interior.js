// Creative Court Pharmacy (B7-N). NSW community pharmacy-inspired layout.
// The model is educational: it does not certify an actual dispensary or fit-out.
import {createKit} from './interior-kit.js';
export const PHARMACY_PLAN=Object.freeze({dispensaryAreaM2:32,dispensaryBounds:{x0:-6,x1:6,z0:-11,z1:-8.3},publicAisleWidth:2.4,consultation:{x:4.8,z:-3.7},features:['secured dispensary','private consultation','temperature-monitored vaccine fridge','Schedule 8 safe','hot and cold sink','barcode scanner','public OTC shelves']});
export function buildPharmacyInterior(site,makeLabel){
 const k=createKit(site,makeLabel,'Community pharmacy');
 const {THREE,group,box,solid,text,add,model}=k;
 const blue=0x508b9c,white=0xe9f1ef,grey=0x71818b,wood=0xa8a69b;
 k.shell({wall:0xdce5e2,ceiling:0xf6f9f8,floor:0xb9c9c8,frontSill:.8,sideSill:1.05});
 group.add(new THREE.HemisphereLight(0xffffff,0x778c90,2.15));
 text('CREATIVE COURT PHARMACY',0,3.3,-11.65,'room');
 // The dispensary occupies a distinct rear zone (over 8 m²). A secure counter
 // separates the public from scheduled medicines; no public interaction enters it.
 solid(12,.98,.8,0,.49,-7.7,blue);
 box(12,.08,.9,0,1.02,-7.7,white);
 text('PRESCRIPTIONS · ASK THE PHARMACIST',0,2.45,-7.8);
 for(const x of [-5.4,-3.7,-2,-.3,1.4,3.1,4.8]){
   box(1.4,2.2,.38,x,1.3,-11.5,grey);
   for(let row=0;row<4;row++)for(let i=0;i<4;i++)box(.2,.24,.2,x-.43+i*.27,.48+row*.42,-11.2,[0xe7e3d2,0x8baac1,0xc7c7ad][(row+i)%3]);
 }
 // Distinct dispensary workbench, scanner, sink and cold-chain refrigerator.
 box(4.3,.9,.65,-2.9,.45,-9.2,wood);
 box(4.3,.09,.75,-2.9,.95,-9.2,white);
 box(.45,.42,.08,-4.3,1.34,-9.3,0x283c48);
 box(.22,.1,.13,-3.75,1.05,-9.0,0x263744);
 box(.75,.08,.52,-1.4,1.02,-9.2,0x899fa8);
 box(.58,.02,.35,-1.4,1.07,-9.2,0x586a72);
 box(.9,1.85,.8,5.6,.93,-10.1,0xf2f4f4);
 box(.55,.26,.04,5.6,1.5,-9.68,0x648ca1);
 box(.65,.8,.6,4.4,.4,-10.7,0x4a555c);
 text('Dispensary: staff only',0,2.1,-9.0);
 // The consultation room is visually enclosed with opaque partitions. It is not
 // represented as an open shop counter or used for storage.
 solid(.2,3.2,2.2,3.25,1.6,-4.85,white);
 solid(.2,3.2,.8,3.25,1.6,-1.95,white);
 box(.2,.75,1.4,3.25,2.82,-2.75,white);
 solid(3.3,3.2,.2,4.85,1.6,-5.95,white);
 solid(3.3,3.2,.2,4.85,1.6,-1.55,white);
 // Opaque door is set in the east wall facing the public circulation route.
 box(.09,2.35,.95,3.14,1.17,-2.35,0x9ab8bc,{a:.28});
 box(.05,.12,.12,3.07,1.12,-2.15,0x6d7373);
 box(1.5,.75,.7,5.2,.375,-4.5,wood);
 model('chair_A_wood',4.7,-3.1,0,{h:.9});
 model('chair_A_wood',5.7,-3.1,0,{h:.9});
 text('Private consultation',4.85,2.45,-5.7);
 // Retail shelves only in the public zone; the centre route remains free.
 for(const x of [-5.9,-4.45]){
   solid(.65,1.35,3.1,x,.675,-2.5,wood);
   for(let z=-3.75;z<-1.15;z+=.38)for(let row=0;row<3;row++)
     box(.24,.27,.22,x+.38,.35+row*.37,z,[0x6b9c9d,0xc8a46b,0xa5c2a6][row]);
 }
 for(const z of [1.4,3.4]){
   solid(1.15,1.25,.5,-5.9,.625,z,wood);
   for(let i=0;i<4;i++)box(.3,.45,.28,-5.65,.52,z-.16+i*.1,0x93b9a5);
 }
 // Queue markers, waiting bench and a clear flat entry threshold.
 for(const z of [-5.8,-4.2,-2.6])box(.75,.018,.08,-.25,.02,z,0x517f8c);
 solid(1.7,.45,.55,4.9,.225,2.8,wood);
 box(2.3,.02,2.5,0,.015,4.6,0xc5d3d1);
 text('EXIT',0,2.8,5.55);
 for(const x of [-4.7,0,4.7])for(const z of [-8.5,-3.1,2.4]){
   box(1.4,.06,.5,x,4.38,z,0xfff8e8,{e:0xfff1d3});
 }
 add('prescriptions','Prescription counter','civic-ledger','Ask a pharmacist about dispensing, medicines, repeat prescriptions and medication safety.',0,-6.3);
 add('otc','Health essentials','info','Browse over-the-counter health and personal care products; ask staff before choosing medicines.',-3.25,-.5);
 add('consult','Private consultation room','info','Ask the pharmacist about a confidential appointment. The consultation room is enclosed and separate from the dispensary.',2.25,-2.7);
 add('coldchain','Vaccine cold chain','info','The vaccine refrigerator is temperature-monitored and located behind the secure dispensary counter.',1.8,-6.3);
 add('security','Controlled medicines','info','Restricted medicines remain in the staff-only dispensary; Schedule 8 medicines require secured storage.',-1.6,-6.3);
 add('queue','Prescription collection queue','info','Wait behind the service line for the pharmacist to call your name.',-.3,-3.4);
 return k.finish({pharmacyLayout:PHARMACY_PLAN,staff:{pos:{x:0,z:-9.5},use:{x:0,z:-6.3}}});
}
