import { GLASS } from './builder.js';
import { BUS_LAYOUT as L } from './bus-interchange-layout.js';

// A small regional interchange: real sheltered stand, not a solid park shed.
// The glass side screens, 2.5 m open doorway and steel canopy match the
// playable waiting room. One boarding point only: no imaginary second bus bay.
export function buildBusInterchangeFacade(b){
  const STEEL=0x394a55, CONCRETE=0xb4b8b2, BLUE=0x164c79;
  const SIGN=0xf0bb35, TACTILE=0xe7c743;
  const front=L.face, rear=L.rear, half=L.width/2;
  // Shaded paved apron up to the kerb, with a defined boarding hardstand.
  b.box(CONCRETE,9.8,.08,2.4,0,.045,8.4);
  b.box(0x8d948f,9.8,.15,.12,0,.075,9.58); // 150 mm visual kerb, no walking collider
  b.box(0xbec2bc,9.8,.12,L.depth,0,.06,3.5);
  // Roof canopy and drip edge: passengers are sheltered from sun and rain.
  b.box(0x415d68,10.3,.23,7.65,0,3.36,3.65);
  b.box(0x263a43,10.45,.12,.27,0,3.28,7.34);
  for(const x of [-4.74,4.74]){
    for(const z of [.42,6.72])b.box(STEEL,.13,3.2,.13,x,1.62,z);
    b.box(STEEL,.1,.18,6.2,x,2.95,3.53);
    // Low plinth plus transparent side screens; cross-visibility for safety.
    b.box(0xb3b6ad,.12,.35,6.1,x,.18,3.4);
    b.box(GLASS,.035,2.45,5.95,x,1.6,3.42);
    b.box(STEEL,.085,.075,6.0,x,2.83,3.42);
  }
  // Rear safety/wind screen with high and low glazing, not a blank wall.
  b.box(0x8e9e9d,9.35,.65,.12,0,.34,.27);
  b.box(GLASS,9.22,2.08,.045,0,1.72,.27);
  for(const x of [-3.2,0,3.2])b.box(STEEL,.1,2.6,.12,x,1.55,.27);
  // Entrance face is physically open in the centre for pedestrian flow.
  for(const x of [-3.1,3.1]){
    b.box(GLASS,3.55,2.52,.035,x,1.5,6.87);
    b.box(STEEL,3.66,.11,.11,x,2.88,6.87);
    b.box(STEEL,.12,2.96,.12,x<0?-1.25:1.25,1.5,6.87);
  }
  b.box(BLUE,3.0,.43,.12,0,3.04,6.94);
  // Separate stop pole deliberately away from the actual boarding manoeuvring space.
  b.cyl(STEEL,.055,3.12,L.signs.stopX,1.56,L.signs.stopZ);
  b.box(SIGN,.54,.64,.10,L.signs.stopX,2.86,L.signs.stopZ);
  b.box(BLUE,.43,.42,.11,L.signs.stopX,2.91,L.signs.stopZ+.01);
  // Contrasting directional guidance and warning indicators in the apron.
  for(let i=0;i<5;i++){
    b.box(TACTILE,.10,.012,.43,L.signs.tactileX,0.117,7.22+i*.26);
  }
  for(const dx of [-.20,0,.20])for(const dz of [-.20,0,.20])
    b.cyl(TACTILE,.065,.018,L.signs.tactileX+dx,.13,L.signs.tactileZ+dz);
  // A waiting bench is sheltered and outside the centred access way.
  for(const x of [2.85,3.65])b.box(STEEL,.08,.53,.08,x,.54,2.75);
  b.box(0x96a9ae,2.05,.10,.50,3.2,.52,2.75);
  b.box(0x96a9ae,2.05,.55,.08,3.2,.87,2.45);
  // Timetable case and services map: at eye height, protected behind glass.
  b.box(BLUE,1.9,1.55,.11,-3.0,1.75,1.0);
  b.box(0xdce7e8,1.72,1.3,.04,-3.0,1.73,1.07);
  for(let i=0;i<5;i++)b.box(i%2?BLUE:0x7898ab,1.35,.05,.044,-3.0,2.16-i*.20,1.1);
  // Dedicated power-efficient downlights under the shelter roof.
  for(const x of [-3.3,0,3.3])for(const z of [1.7,5.5])
    b.box(0xfff0bf,1.1,.06,.35,x,3.19,z);
  return {w:L.width,d:L.depth,front:L.face};
}
