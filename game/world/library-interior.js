// Sir Reginald Repo Public Library (A7-N): a single-level NSW country public library.
// Based on State Library NSW People Places: clear accessible circulation, distinct zones,
// low sightline-friendly stacks, reading desks, public ICT and children's story corner.
// Dimensions are game metres, not a certified NCC or AS 1428.1 assessment.
import { createKit } from './interior-kit.js';
export const LIBRARY_PLAN=Object.freeze({entrance:{x:0,z:3.75},centralClearance:2.4,staffUse:{x:2.6,z:-4.7},zones:['Borrowing and returns','Adult collection','Children and families','Public computers','Local studies and reading']});
export function buildLibraryInterior(site,makeLabel){
 const k=createKit(site,makeLabel,'Public library');
 const {group,box,solid,text,add,model}=k;
 const C={wall:0xe8dfcb,wood:0x927354,carpet:0x9ca9a6,blue:0x376d87,ink:0x283b45,cream:0xf7f0dd,green:0x6e987a};
 k.shell({wall:C.wall,ceiling:0xf7f4ec,floor:C.carpet,frontSill:.65,sideSill:.8});
 group.add(new k.THREE.HemisphereLight(0xfff9e8,0x687c85,2.2));
 // Entry threshold is flat, and the centre 2.4m-wide circulation route is kept clear.
 box(2.5,.025,3.8,0,.02,3.75,0xc4c9c0);
 text('PUBLIC LIBRARY',0,3.4,-11.7,'room');
 text('BORROW · READ · LEARN',0,2.9,-11.65);
 // Low accessible returns and service counter; behind the counter is staff workspace.
 solid(3.6,.85,.75,3.1,.425,-6.25,C.wood);
 box(3.6,.07,.84,3.1,.88,-6.25,C.cream);
 box(.65,.4,.08,3.9,1.28,-6.5,C.ink);
 box(.55,.28,.05,3.9,1.3,-6.43,0x87b7c7,{e:0x356c8b});
 box(.85,.15,.5,5.6,.75,-5.8,C.blue);
 for(let i=0;i<8;i++)box(.19,.28,.32,1.8+i*.18,.98,-6.25,[0x6685a0,0xa56b4c,0x7d9a66,0xc7aa64][i%4]);
 text('Loans and returns',3.3,2.2,-6.3);
 // Shelves align along the west wall, with two shorter island ranges to preserve sightlines.
 const colours=[0x376d87,0x9d5747,0x8b9357,0xc4a66a,0x796b9c,0x548d84];
 function stack(x,z,length,depth=.6){
   solid(depth,1.65,length,x,.825,z,C.wood);
   for(let row=0;row<3;row++)for(let i=0;i<Math.floor(length/.18);i++){
     const zz=z-length/2+.12+i*.18;
     for(const side of [-1,1])box(.07,.3,.12,x+side*(depth/2+.035),.38+row*.48,zz,colours[(i+row)%colours.length]);
   }
 }
 stack(-6.15,-6.7,7.0,.65);
 stack(-4.25,-7.4,4.2,.55);
 stack(-2.55,-7.4,4.2,.55);
 text('Fiction and non-fiction',-5.1,2.35,-9.3);
 // Quiet local-studies tables, generous circulation around the furniture.
 for(const z of [-9.1,-6.6]){
   solid(1.7,.75,.8,5.1,.375,z,C.wood);
   box(1.8,.055,.9,5.1,.77,z,C.cream);
   box(.5,.025,.34,5.1,.81,z,0xe4e9e8);
   model('chair_A_wood',5.1,z+1.05,Math.PI,{h:.9});
 }
 text('Local history and quiet study',5.0,2.45,-10.3);
 // Public access computers along the east wall; no equipment protrudes into the central path.
 for(const z of [-2.4,.25]){
   solid(1.7,.75,.75,5.15,.375,z,C.wood);
   box(.8,.48,.055,5.15,1.12,z-.14,C.ink);
   box(.7,.36,.015,5.15,1.13,z-.10,0x6c9daf,{e:0x4b7d9e});
   box(.65,.04,.26,5.15,.79,z+.15,0xd5d8d8);
   model('chair_A_wood',5.15,z+1.02,Math.PI,{h:.9});
 }
 text('Public computers and catalogue',5.2,2.3,.25);
 // Children's low shelves, washable rug, picture books and story seating.
 box(4.7,.03,3.4,-4.3,.03,2.6,0x6c9b91);
 for(const [x,z] of [[-5.65,1.25],[-3.35,1.25]]){
   solid(.65,.85,1.35,x,.425,z,C.wood);
   for(let i=0;i<7;i++)box(.35,.28,.055,x+(i%2?-.08:.08),.96,z-.5+i*.16,colours[i%6]);
 }
 for(const [x,z,c] of [[-5.5,3.5,0xc48b68],[-3.9,3.5,0x6d89b5],[-5.0,4.55,0x7c9d72]])k.ball(.37,x,.3,z,c);
 text('Children and story time',-4.5,2.2,2.0);
 // Wayfinding, visible exit and ceiling luminaire rows (game approximation).
 box(1.9,.48,.05,0,2.8,5.75,C.green);
 text('EXIT',0,2.75,5.58);
 for(const x of [-4.7,0,4.7])for(const z of [-8.7,-3.5,1.7]){
   box(1.4,.07,.5,x,4.38,z,0xfff3d1,{e:0xffe6a8});
   const lamp=new k.THREE.PointLight(0xfff3dc,.34,7);lamp.position.set(x,3.9,z);group.add(lamp);
 }
 // Interaction hotspots are on clear walking-side approaches, not inside fixtures.
 add('loans','Borrow or return a book','civic-ledger','The librarian can help with library membership, lending, renewals and returns.',2.6,-4.75);
 add('fiction','Browse the collection','info','Fiction, reference and non-fiction are organised by subject. Return books to the loans counter.',-3.45,-4.8);
 add('children','Children’s story time','info','Picture books, family reading and supervised story sessions are held in the children’s area.',-2.2,2.4);
 add('computers','Use a public computer','info','Public catalogue terminals and accessible computers provide digital literacy and research access.',3.5,-.9);
 add('history','Local history collection','info','Research the town’s past through newspapers, photographs and local studies resources.',3.55,-8.8);
 add('quiet','Quiet reading desks','info','Study desks are provided away from the children’s corner, with task lighting and reading materials.',3.55,-7.3);
 return k.finish({libraryLayout:LIBRARY_PLAN,staff:{pos:{x:3.1,z:-7.25},use:LIBRARY_PLAN.staffUse}});
}
