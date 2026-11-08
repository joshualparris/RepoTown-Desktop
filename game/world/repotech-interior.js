// RepoTech Computers & Communications, C7-N.
// Fictional shop inspired by Australian repair/refurbishment operations.
// Spatial separation: public sales, repair intake, technician benches, secure
// data-bearing quarantine and tested/refurbished dispatch.
import {createKit} from './interior-kit.js';
export const REPOTECH_PLAN=Object.freeze({
  zones:['public sales and demo','service intake','repair benches','data quarantine','test and dispatch'],
  centralAisleWidth:2.4,privateDataZone:'staff-only',floorMetres:{width:14,depth:18}
});
export function buildRepoTechInterior(site,makeLabel){
 const k=createKit(site,makeLabel,'Computer sales and repair');
 const {THREE,group,box,solid,text,add,model}=k;
 const C={wall:0xd5e0e5,desk:0x667d8b,wood:0x8e979e,dark:0x293b4a,glass:0x91becb,green:0x689c82};
 k.shell({wall:C.wall,ceiling:0xf1f5f5,floor:0xaebfc7,frontSill:.72,sideSill:1});
 group.add(new THREE.HemisphereLight(0xf3fbff,0x6b7b8b,2.1));
 text('REPOTECH · COMPUTERS & COMMUNICATIONS',0,3.35,-11.65,'room');
 // Glazed street-facing sales displays, each with a working-height demo bench.
 for(const x of [-5.2,5.2]){
   solid(1.6,.8,.65,x,.4,2.2,C.wood);
   box(1.7,.07,.75,x,.83,2.2,0xe2e6e8);
   box(.88,.55,.06,x,1.24,2.02,C.dark);
   box(.76,.43,.012,x,1.25,2.055,0x629cae,{e:0x2b6c83});
   box(.75,.05,.36,x,.86,2.55,0x8c999e);
   box(.34,.04,.22,x,.9,2.5,0x323b44);
 }
 text('Laptops · desktops · phones',-4.8,2.35,3.2);
 // Repair intake counter is reachable from the centre, but staff work is behind it.
 solid(3.4,.95,.85,2.6,.475,-5.4,C.desk);
 box(3.45,.08,.94,2.6,.98,-5.4,0xdce5e7);
 box(.62,.45,.06,3.5,1.35,-5.5,C.dark);
 box(.5,.34,.015,3.5,1.36,-5.46,0x82c0cc,{e:0x3c7e91});
 box(.5,.04,.33,2.2,1.04,-5.2,0xbccad0);
 text('SERVICE DESK · CHECK-IN',2.8,2.25,-5.5);
 // Clear public central path from door to counter. Low accessory shelves are at left.
 for(const x of [-5.7,-4.1]){
   solid(.65,1.45,2.3,x,.725,-2.8,C.wood);
   for(let row=0;row<3;row++)for(let j=0;j<5;j++)
     box(.32,.27,.19,x+.36,.33+row*.43,-3.65+j*.4,[0x5c94a4,0x87979e,0x9ba87d][row]);
 }
 // Staff-only technical workbench zone at the rear, no publicly exposed drives.
 for(const x of [-4.9,-2.6]){
   solid(1.65,.8,.7,x,.4,-9.2,C.wood);
   box(1.7,.09,.78,x,.84,-9.2,0xd7dedf);
   box(.65,.5,.06,x,1.2,-9.43,C.dark);
   box(.52,.39,.012,x,1.22,-9.39,0x578c9e,{e:0x29677b});
   box(.85,.06,.38,x,.9,-8.9,0x434c52);
   box(.16,.4,.13,x-.65,1.12,-9.28,0x4a5963);
 }
 // Security cage with visible metal mesh and a closed storage door.
 // This is not a data-erasure certification: it represents segregated custody.
 solid(.13,2.7,2.6,1.55,1.35,-10.3,0x71818a);
 solid(3.25,2.7,.12,3.2,1.35,-11.6,0x71818a);
 box(.12,2.45,1.35,1.55,1.3,-9.5,0x8199a1,{a:.4});
 for(let j=0;j<5;j++)box(.055,2.6,.06,1.6,1.35,-11.3+j*.45,0xa6bac0);
 for(let j=0;j<4;j++)box(.8,.17,.55,2.3+j*.6,.45,-10.8,0x38434c);
 text('SECURE DATA QUARANTINE',3.8,2.3,-11.2);
 // Functional test bench and labelled outgoing-device shelf.
 solid(2.1,.78,.75,5.1,.39,-8.25,C.wood);
 box(2.15,.07,.83,5.1,.82,-8.25,0xe5e8e5);
 box(.72,.46,.07,5.2,1.2,-8.48,C.dark);
 box(.6,.35,.012,5.2,1.2,-8.43,0x81c6a0,{e:0x3c9b70});
 solid(.55,1.9,2.0,6.25,.95,-6.5,C.wood);
 for(let j=0;j<4;j++)box(.43,.12,1.75,6.25,.4+j*.43,-6.5,C.green);
 text('DIAGNOSTICS · TESTED STOCK',5.0,2.3,-7.8);
 // ESD bench mat, parts drawers, work instructions and task lighting.
 for(const x of [-4.9,-2.6])box(1.25,.018,.48,x,.89,-9.2,0x547b78);
 for(const x of [-4.7,0,4.7])for(const z of [-8.4,-3.4,1.5])
   box(1.4,.07,.5,x,4.4,z,0xf4f8f3,{e:0xe3f5ef});
 text('EXIT',0,2.75,5.5);
 // All interaction points are on the customer side of the service counter.
 add('intake','Book a computer repair','civic-ledger','Describe the fault, agree to diagnostic scope and obtain a written receipt before leaving a device.',.7,-4.3);
 add('sales','Browse refurbished computers','info','Ask about tested laptops and desktops, specifications, warranty and electrical safety checks.',-3.25,2.0);
 add('parts','Browse accessories','info','Chargers, keyboards, mice, network cables and spare parts are organised by compatibility.',-2.9,-2.2);
 add('privacy','Data privacy and secure handling','info','Staff keep data-bearing devices segregated. Sanitisation requires an appropriate verified process before resale or donation.',.4,-6.8);
 add('testing','Refurbishment quality checks','info','Devices are inspected, repaired, tested and documented before release. Electrical safety testing is performed by a competent person where required.',3.8,-6.8);
 add('reuse','Repair and reuse advice','info','Reuse is prioritised when safe and practical; non-repairable equipment is directed to appropriate e-waste recycling.',.8,-1.7);
 return k.finish({repoTechLayout:REPOTECH_PLAN,staff:{pos:{x:2.4,z:-6.9},use:{x:.7,z:-4.3}}});
}
