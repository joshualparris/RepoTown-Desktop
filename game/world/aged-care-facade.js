import {GLASS} from './builder.js';
import {AGED_CARE as L} from './aged-care-layout.js';

// RTBUILD-016: small regional homelike aged-care annex, *not* a real as-built facility.
// Walls are built as separate panels, rather than a solid box hiding its windows.
export function buildAgedCareFacade(b) {
 const C={brick:0xb78f78,cream:0xeee1cb,roof:0x5c776c,trim:0x415950,
  glass:GLASS,wood:0x96704f,garden:0x65966a,stone:0x999c86,iron:0x566363,
  light:0xf8e1b8};
 const mid=(L.front+L.rear)/2;
 b.box(C.stone,L.w,.13,L.d,0,.065,mid);
 // Side and rear walls, pitched roof, and repeated low residential windows.
 b.box(C.brick,L.w,3.42,.20,0,1.71,L.rear+.10);
 for(const x of [-L.w/2+.10,L.w/2-.10]) {
   b.box(C.cream,.20,1.02,L.d,x,.51,mid);
   b.box(C.cream,.20,1.06,L.d,x,3.47,mid);
   for(const z of [-1.95,1.0,3.95]) {
     b.box(C.glass,.05,1.90,2.20,x,2.00,z);
     b.box(C.wood,.09,.09,2.25,x,2.0,z);
   }
 }
 // Front horizontal wall is interrupted by a genuine central door opening.
 for(const x of [-4.7,4.7]) {
   b.box(C.brick,3.60,.82,.20,x,.41,L.front-.10);
   b.box(C.glass,3.34,2.3,.06,x,2.0,L.front+.03);
   b.box(C.cream,3.60,.80,.20,x,3.55,L.front-.10);
   b.box(C.trim,.09,2.31,.12,x,2.00,L.front+.10);
 }
 for(const x of [-1.78,1.78])b.box(C.cream,.40,4.4,.22,x,2.2,L.front-.07);
 b.box(C.cream,3.20,.85,.22,0,3.98,L.front-.1);
 b.box(C.glass,2.55,3.05,.035,0,1.58,L.front+.05);
 b.box(C.wood,.08,2.75,.08,0,1.58,L.front+.12);
 for(const x of [-.33,.33])b.box(C.iron,.04,.34,.12,x,1.5,L.front+.17);
 // Country-house low hip-like roof; readable porch and weather protection.
 b.box(C.roof,13.65,.34,11.7,0,4.55,mid);
 b.box(C.trim,14,.14,12,0,4.78,mid);
 b.box(C.roof,5.0,.22,2.25,0,3.93,L.front+1.0);
 for(const x of [-2.20,2.20]) {
   b.box(C.wood,.22,3.5,.22,x,1.76,L.front+1.98);
   b.box(C.stone,.44,.40,.42,x,.2,L.front+1.98);
 }
 b.box(C.cream,5,.46,.20,0,3.54,L.front+2.06); // entry sign band
 b.box(C.wood,2.5,.08,2.3,0,.035,L.front+1.07); // step-free visual walkway
 for(const x of [-5.40,5.40]) {
   b.box(C.wood,1.20,.35,.50,x,.20,L.front+1.47);
   for(const dx of [-.32,0,.32]){
     b.cyl(C.iron,.035,.43,x+dx,.45,L.front+1.45);
     b.ball(C.garden,.31,x+dx,.82,L.front+1.45);
   }
 }
 // Rest seating away from doorway, porch luminaires and handrail-like guides.
 b.box(C.wood,1.5,.12,.48,-4.5,.53,L.front+2.25);
 b.box(C.wood,1.5,.65,.09,-4.5,.84,L.front+2.02);
 for(const x of [-4.75,-4.0])b.box(C.iron,.06,.47,.07,x,.27,L.front+2.22);
 for(const x of [-1.45,1.45])b.box(C.light,.26,.055,.18,x,3.77,L.front+.91);
 return {w:L.w,d:L.d,front:L.front};
}
