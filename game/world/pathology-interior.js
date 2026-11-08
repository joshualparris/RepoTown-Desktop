// H7-N: fictional independent NSW specimen collection centre.
// References: NPAAC Approved Pathology Collection Centres (2013, current),
// AusHFG B.0550 rev7 and Patient Bay - Specimen Collection rev5.
// Visual educational model only; not an accredited clinical facility.
import {createKit} from './interior-kit.js';
export const PATHOLOGY_PLAN=Object.freeze({areas:['waiting','check-in','collection bay one','collection bay two','specimen dispatch','hand hygiene'],specimenRoute:['collect','label at chair','secure transport','laboratory'],publicRoute:'front entrance to two private bays'});
export function buildPathologyInterior(site,makeLabel){
 const k=createKit(site,makeLabel,'Riverbend Pathology');
 const {THREE,group,box,solid,cyl,ball,text,add}=k;
 const C={wall:0xc7d9d4,teal:0x397b78,navy:0x2c5265,wood:0xa68a6a,cream:0xe6e0d2,metal:0x899ba2,red:0xa95b4c};
 k.shell({wall:C.wall,ceiling:0xe3e9e3,floor:0xa5b7b1,frontSill:.78,sideSill:1.05});
 group.add(new THREE.HemisphereLight(0xfaf3e6,0x7c9e9b,1.8));
 box(13.4,.016,5.3,0,.015,3.15,0xb6a48a);
 box(2.35,.018,11.8,0,.02,-5.4,0x668f8c);
 box(13.5,.28,.13,0,3.55,-11.7,C.teal);
 text('RIVERBEND PATHOLOGY',0,3.2,-11.55,'room');
 // Waiting chairs, armrests, appointment check-in, information and hand sanitiser.
 for(const x of [-5.5,-4.15,-2.8]){
  solid(.78,.46,.68,x,.23,2.6,C.navy);
  box(.8,.66,.12,x,.79,2.86,C.navy);
  for(const dx of [-.4,.4])box(.09,.48,.65,x+dx,.64,2.6,C.wood);
 }
 solid(2.7,.84,.72,4.3,.42,1.7,C.teal);
 box(2.75,.07,.8,4.3,.88,1.7,C.wood);
 box(.5,.36,.09,4.75,1.27,1.46,C.navy);
 box(.38,.26,.02,4.75,1.27,1.51,0x7ab9c3,{e:0x347b8a});
 box(.28,.42,.2,1.65,1.28,4.3,0x8bb8ac);
 text('CHECK IN',4.2,2.3,1.65);
 text('WAITING AREA',-4.4,2.2,2.6);
 // Two screened patient collection bays, one each side of a wide central corridor.
 // Rear partitions have real open door gaps (not solid decorative walls).
 for(const side of [-1,1]){
  const sx=side*4.35, partitionX=side*1.2;
  solid(.16,3.0,2.45,partitionX,1.5,-10.65,C.wall);
  solid(.16,3.0,1.7,partitionX,1.5,-5.85,C.wall);
  box(.17,.28,1.9,partitionX,3.04,-8.0,C.teal);
  solid(5.55,3.0,.14,side*4.18,1.5,-4.9,C.wall);
  // Clinical reclining chair and arm supports, with free space around it.
  solid(.9,.45,1.35,sx,.46,-8.15,C.navy);
  box(.87,.13,.8,sx,.78,-7.92,0x6c9da5,{rx:-.25});
  box(.88,.15,.57,sx,.99,-8.62,0x6c9da5,{rx:.4});
  for(const dx of [-.48,.48])box(.1,.16,.75,sx+dx,.85,-8.1,C.metal);
  box(.54,.13,.38,sx,1.19,-8.93,0x6c9da5);
  // Collector's clean work surface, basin, alcohol rub, sharps and waste.
  solid(1.15,.78,.55,side*6.0,.39,-10.65,C.metal);
  box(1.2,.07,.6,side*6.0,.81,-10.65,C.cream);
  box(.45,.09,.33,side*5.85,.88,-10.65,0x719fac);
  box(.13,.28,.1,side*5.85,1.09,-10.85,C.metal);
  box(.32,.42,.32,side*5.9,.21,-9.5,0xc4a36d);
  box(.33,.43,.3,side*6.05,.22,-9.0,C.red);
  // Labelled specimen dispatch shelf kept on staff side.
  box(1.0,.08,.5,side*5.75,1.7,-6.2,C.wood);
  for(let i=0;i<3;i++)cyl(.065,.065,.25,side*(5.45+i*.28),1.86,-6.2,0xa6bdc1);
  text(side<0?'COLLECTION ROOM 1':'COLLECTION ROOM 2',sx,2.6,-11.15);
  for(const z of [-9.8,-6.6])box(.92,.07,.45,sx,4.38,z,0xf5e9cb,{e:0xe4dfc6});
 }
 // Backlit wayfinding and a patient information board.
 box(2.7,1.05,.07,-4.55,2.55,5.78,C.teal);
 box(2.4,.72,.08,-4.55,2.52,5.7,0xd8e8dd);
 box(2.6,.45,.07,3.6,3.1,5.75,C.navy);
 text('COLLECTION ROOMS',0,2.8,-4.6);
 text('EXIT',0,2.8,5.55);
 add('checkin','Check in for pathology','civic-ledger','Staff confirm identity and request forms before specimen collection.',1.5,1.6);
 add('waiting','Wait for your turn','info','Comfortable seating supports patients waiting for routine or timed tests.',-1.5,2.5);
 add('bay1','Explore collection room 1','info','A reclining chair, arm supports, handwash basin, sharps disposal and labelling bench.',-2.4,-8.0);
 add('bay2','Explore collection room 2','info','A second private collection space with space for a collector and patient.',2.4,-8.0);
 add('dispatch','Specimen transport','info','Collected samples are identified, labelled and dispatched under controlled transport procedures.',0,-10.4);
 return k.finish({pathologyLayout:PATHOLOGY_PLAN,staff:{pos:{x:4.5,z:.5},use:{x:1.5,z:1.6}}});
}
