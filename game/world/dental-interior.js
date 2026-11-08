// Repository Dental E7-N: fictional Australian dental practice.
// Research: ADA IPC Guidelines (2026 fifth amended edition), NSW Dental Council
// infection-control guidance and AS 5369:2023 reprocessing principles.
// Illustrative layout only, not a compliance or clinical certification.
import {createKit} from './interior-kit.js';
export const DENTAL_PLAN=Object.freeze({zones:['reception and waiting','consultation operatory','dirty instrument receiving','clean inspection and packaging','sterilisation','sterile storage'],reprocessingFlow:['dirty','wash','inspect','package','sterilise','store'],clinicalFloor:'impervious sealed non-slip',publicRoute:'front entry to reception',staffOnly:['reprocessing','sterile store']});
export function buildDentalInterior(site,makeLabel){
 const k=createKit(site,makeLabel,'Dental clinic');
 const {THREE,group,box,solid,text,add,cyl,ball}=k;
 const C={wall:0xb2c7c3,blue:0x32647a,white:0xf1f5f3,steel:0x70838b,seat:0x386a77,teal:0x408c7e,dark:0x243f51};
 k.shell({wall:C.wall,ceiling:0xd4e0d8,floor:0x967b63,frontSill:.75,sideSill:1.05});
 // Warm oak-look waiting room, colourful wayfinding and a continuous contrasting corridor.
 box(13.1,.012,5.7,0,.013,2.8,0x977f67);
 box(2.0,.014,10.1,.01,.017,-6.85,0x4f827e);
 for(const x of [-5.6,-4.2,-2.8])box(.66,.04,.45,x,.51,2.5,0xb7c6ad);
 for(const x of [-5.2,-3.5])box(.72,.85,.06,x,1.85,5.78,0x477e76);
 box(3.1,.8,.06,3.65,3.7,5.78,0x2f6d79);
 box(2.8,.2,.09,3.65,3.2,5.7,0xd9ad78);
 group.add(new THREE.HemisphereLight(0xf7fcff,0x6e8989,2.1));
 text('WATTLE STREET DENTAL',0,3.35,-11.65,'room');
 // Waiting/reception: front of house, seating, check-in and brochure rack.
 solid(3.0,.85,.75,3.7,.425,1.5,C.blue);
 box(3.1,.07,.84,3.7,.89,1.5,C.white);
 box(.6,.4,.08,4.35,1.26,1.32,C.dark);
 box(.48,.29,.02,4.35,1.27,1.37,0x85bbc9,{e:0x3d798d});
 for(const x of [-5.6,-4.2,-2.8]){solid(.75,.5,.68,x,.25,2.5,C.seat);box(.76,.6,.12,x,.83,2.8,C.seat);}
 box(1.3,.09,.8,-4.4,.45,3.7,0xa7b6b4);
 text('RECEPTION · APPOINTMENTS',3.7,2.4,1.3);
 text('WAITING AREA',-4.4,2.2,2.6);
 // Clinical bay occupies left rear, with handwash and an instrument tray.
 // A glazed partition separates it visually from the public waiting area.
 // The previous full-height partitions sealed off the surgeries. Split the walls
 // into real segments and leave a 1.7 m patient doorway from the central corridor.
 solid(.16,3.2,3.9,-.7,1.6,-10.05,C.wall);
 solid(.16,3.2,1.35,-.7,1.6,-5.0,C.wall);
 box(1.72,.28,.17,-.7,3.05,-6.8,0x32647a);
 solid(6.0,3.2,.16,-3.9,1.6,-4.05,C.wall);
 box(2.3,2.5,.055,-3.2,1.55,-4.0,0xa8cbd0,{a:.28});
 // Dental room has an actual open doorway in its east wall, not a painted door.
 box(.08,2.45,.09,-.7,1.22,-7.62,0x426e74);
 // Dental chair: adjustable-style base, reclined cushion, headrest and lamp arm.
 solid(1.2,.35,2.15,-4.3,.58,-8.0,0x607f8b);
 box(1.08,.24,1.25,-4.3,.89,-7.55,0x77a7b4,{rx:-.2});
 box(1.06,.23,.9,-4.3,1.03,-8.48,0x77a7b4,{rx:.45});
 box(.62,.2,.36,-4.3,1.34,-8.92,0x77a7b4);
 cyl(.12,.12,2.1,-5.75,1.25,-8.4,C.steel);
 box(1.2,.09,.22,-5.25,2.4,-8.4,C.steel);
 box(.65,.11,.5,-4.85,2.35,-8.4,0xfaf5d8,{e:0xffe7a4});
 solid(1.55,.82,.62,-5.9,.41,-10.7,C.steel);
 box(1.6,.08,.7,-5.9,.87,-10.7,C.white);
 box(.55,.06,.4,-5.5,.95,-10.7,0x7fa9b5);
 box(.6,.15,.45,-2.1,.9,-10.5,C.white);
 box(.55,.5,.08,-2.1,1.3,-10.65,C.dark);
 box(.43,.38,.02,-2.1,1.3,-10.59,0x87b5c0,{e:0x3c8196});
 text('DENTAL OPERATORY',-4.2,2.5,-11.2);
 // Staff-only reprocessing area on right rear. Instrument flow is one-way,
 // with distinct dirty receiving, wash, inspection, steriliser and clean storage.
 // Reprocessing can be visited in the simulation but is labelled staff-only in practice.
 // The 1.8 m opening prevents the central corridor ending in a solid wall.
 solid(.18,3.2,3.55,1.35,1.6,-10.23,C.wall);
 solid(.18,3.2,1.35,1.35,1.6,-5.03,C.wall);
 box(1.82,.25,.2,1.35,3.08,-7.67,0x32647a);
 solid(5.2,3.2,.16,4.0,1.6,-4.35,C.wall);
 box(2.3,.08,.08,1.35,2.35,-7.67,0xd4b16e);
 const stages=[
  {x:2.05,name:'DIRTY',c:0xa86857},
  {x:3.0,name:'WASH',c:0x6a9eac},
  {x:4.0,name:'INSPECT',c:0x90a99a},
  {x:5.0,name:'STERILISE',c:0x7195a7},
  {x:6.05,name:'STORE',c:0x84a98a}
 ];
 for(const s of stages){
   solid(.83,.8,.7,s.x,.4,-10.85,C.steel);
   box(.82,.07,.72,s.x,.84,-10.85,s.c);
 }
 box(.56,.09,.4,3.0,.93,-10.85,0x637d86);
 box(.58,.55,.48,5.0,1.18,-10.85,0xd6e3e4);
 box(.4,.18,.06,5.0,1.26,-10.56,0x5c7d85);
 box(.63,1.45,.55,6.15,1.25,-8.7,0xe7eeee);
 for(let i=0;i<4;i++)box(.54,.045,.5,6.15,.65+i*.33,-8.7,0x8faeab);
 text('REPROCESSING · STAFF ONLY',4.1,2.5,-11.45);
 // Hand hygiene, clinical waste, sharps and PPE.
 box(.68,.12,.45,-2.05,.92,-5.05,0xcbd9db);
 box(.15,.38,.12,-2.05,1.13,-5.35,C.steel);
 box(.34,.5,.34,-1.9,.25,-6.2,0xd6ab6b);
 box(.4,.65,.35,-2.15,.33,-6.95,0xa9675a);
 box(.8,.6,.12,-6.15,2.1,-6.2,0xc3d6d5);
 // Clinical fixtures are washable; no carpets or upholstered sofas in treatment.
 for(const x of [-4.7,0,4.7])for(const z of [-8.7,-3.5,1.5])
   box(1.4,.07,.5,x,4.38,z,0xf6f8ef,{e:0xe8f2e6});
 text('EXIT',0,2.8,5.55);
 add('reception','Check in for an appointment','civic-ledger','Reception confirms your appointment and assists with consent and treatment information.',1.5,1.4);
 add('waiting','Wait for the dentist','info','The waiting room is separated from the clinical treatment and instrument reprocessing areas.',-1.25,2.3);
 add('operatory','Explore the dental surgery','info','Walk through the open doorway on your left to see the dental chair, examination light and clinical equipment.',-2.0,-6.8);
 add('infection','Explore instrument sterilisation','info','The room on your right models a one-way dirty-to-clean sequence. In a real practice, this is staff-only.',2.4,-7.7);
 add('hygiene','Infection prevention','info','Staff use hand hygiene, cleanable clinical surfaces, appropriate PPE and documented sterilisation monitoring.',0,-3.0);
 return k.finish({dentalLayout:DENTAL_PLAN,staff:{pos:{x:3.9,z:.5},use:{x:1.5,z:1.4}}});
}
