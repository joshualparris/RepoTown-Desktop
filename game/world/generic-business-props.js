// New, opt-in fixtures for generic fit-outs only. Never replace existing props.
// All geometry is authored locally; no photographs or surveyed-location claims.
import {GENERIC_REMAINING_PROPS} from './generic-remaining-props.js';
const STEEL=0x939b9b, DARK=0x303a3c, CREAM=0xe7e0d2, WOOD=0x967252;
const make=(type,label,w,d,build)=>({type,label,w,d,solid:true,build});
export const GENERIC_BUSINESS_PROPS={
  ...GENERIC_REMAINING_PROPS,
  treatmentCouch:make('treatmentCouch','Treatment couch',.95,1.9,(b)=>{
    for(const x of [-.33,.33])for(const z of [-.72,.72])b.block(STEEL,.06,.62,.06,x,0,z);
    b.box(CREAM,.86,.15,1.7,0,.7,0);b.add('box',CREAM,.86,.1,.55,0,.86,-.62,-.35);
    b.box(0xd4c6b7,.75,.04,.9,0,.8,.24);b.box(STEEL,.78,.04,1.5,0,.4,0);
  }),
  salonStation:make('salonStation','Styling chair and mirror',1.65,1.9,(b)=>{
    b.block(WOOD,1.6,.86,.35,0,0,-.72);
    b.box(DARK,1.18,1.35,.06,0,1.7,-.84);
    b.box(0xb6d0d0,1.06,1.22,.025,0,1.7,-.795);
    b.cyl(STEEL,.32,.08,0,.04,.12);b.cyl(STEEL,.065,.4,0,.26,.12);
    b.box(DARK,.65,.12,.65,0,.52,.12);b.box(DARK,.65,.55,.12,0,.81,-.18);
    for(const x of [-.37,.37])b.box(DARK,.09,.12,.57,x,.74,.1);
    b.box(STEEL,.5,.035,.22,0,.24,.68);
    for(let i=0;i<3;i++)b.block([0x597e72,0xc6b18b,0xe1dacb][i],.09,.2,.09,-.47+i*.16,.88,-.65);
    b.box(DARK,.22,.04,.13,.42,.9,-.62);
  }),
  salonWash:make('salonWash','Reclining wash chair and basin',1.45,2.05,(b)=>{
    b.block(DARK,.67,.45,.85,0,0,.2);
    b.add('box',0x4c5854,.66,.55,.13,0,.69,-.18,-.45);
    b.cyl(CREAM,.4,.2,0,.95,-.59);b.cyl(0x6e8587,.3,.03,0,1.055,-.59);
    b.cyl(STEEL,.025,.24,.27,1.13,-.72);b.cyl(STEEL,.022,.16,.27,1.23,-.65,Math.PI/2);
    for(const x of [-.4,.4])b.box(DARK,.1,.1,.6,x,.69,.21);
  }),
  garmentRail:make('garmentRail','Garment rail',1.95,.75,(b)=>{
    for(const x of [-.88,.88]){b.cyl(STEEL,.025,1.8,x,.9,0);b.box(STEEL,.18,.05,.65,x,.04,0);}
    b.box(STEEL,1.85,.04,.04,0,1.75,0);
    for(let i=0;i<7;i++){
      const x=-.7+i*.23,c=[0x4d6e7c,0xc4a177,0x8b6160,0x73836a][i%4];
      b.box(c,.2,.64,.31,x,1.2,0);b.box(c,.26,.16,.38,x,1.54,0);
      b.box(WOOD,.23,.025,.025,x,1.65,0);
    }
  }),
  laundryStack:make('laundryStack','Stacked washer and dryer',1.16,1.14,(b)=>{
    b.block(CREAM,1.08,2.12,.86,0,0,0);
    for(const y of [.55,1.58]){
      b.cyl(DARK,.31,.055,0,y,.46,Math.PI/2);
      b.cyl(STEEL,.275,.065,0,y,.49,Math.PI/2);
      b.cyl(0x49656d,.225,.07,0,y,.515,Math.PI/2);
      b.box(0x313c43,.34,.09,.04,-.17,y+.39,.455);
      b.cyl(DARK,.035,.04,.31,y+.39,.47,Math.PI/2);
    }
    b.box(STEEL,1.08,.025,.88,0,1.07,0);
  }),
  foldingBench:make('foldingBench','Folding bench and linen',2.05,.95,(b)=>{
    b.block(STEEL,2,.08,.9,0,.85,0);
    for(const x of [-.87,.87])b.block(STEEL,.08,.85,.8,x,0,0);
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)b.box([0xd7c9b2,0x688a92,0x959d83][i],.43,.055,.55,-.6+i*.6,.98+j*.055,0);
    b.box(CREAM,1.65,.12,.55,0,.18,0);
  }),
  feedMerchandise:make('feedMerchandise','Feed and seed merchandise',2.1,.8,(b)=>{
    for(const x of [-.98,.98])b.block(DARK,.055,2.05,.7,x,0,0);
    for(const y of [.15,.8,1.45]){
      b.box(WOOD,2.04,.055,.76,0,y,0);
      for(let i=0;i<4;i++){
        const x=-.73+i*.49;b.block([0xc6b488,0xb7bca0,0xc09d76][i%3],.4,.46,.57,x,y+.04,0);
        b.box(0x496b50,.27,.15,.015,x,y+.29,.295);
      }
    }
  }),
  irrigationStand:make('irrigationStand','Pipe fittings and valve display',1.95,.75,(b)=>{
    b.block(0xb3aa90,1.85,1.9,.1,0,0,-.27);
    for(let i=0;i<4;i++){
      const x=-.67+i*.44;b.cyl(0x668995,.04,.85,x,1,-.16);
      b.cyl(STEEL,.05,.23,x,1.4,-.05,Math.PI/2);
      b.box(0x3d6380,.21,.04,.04,x,.96,-.07);
    }
    b.block(DARK,1.9,.5,.65,0,0,0);
    for(let i=0;i<5;i++)b.box(0x7895a5,.26,.2,.22,-.7+i*.35,.62,.12);
  }),
  propertyDisplay:make('propertyDisplay','Property listing display',2.1,.4,(b)=>{
    b.block(WOOD,2.05,1.95,.09,0,0,-.1);
    for(const x of [-.63,0,.63])for(const y of [.6,1.3]){
      b.box(CREAM,.52,.57,.035,x,y,-.035);
      b.box(0x94a5a0,.44,.27,.015,x,y+.07,-.01);
      b.box(DARK,.34,.025,.02,x,y-.13,0);b.box(0x86928c,.27,.018,.02,x,y-.19,0);
    }
  }),
};
