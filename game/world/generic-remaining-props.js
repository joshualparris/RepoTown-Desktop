// Additive, bounded fixtures for fallback buildings. Not surveyed real premises.
import {GLASS} from './builder.js';
const STEEL=0x929c9b,DARK=0x34444a,WHITE=0xe8e5dc,WOOD=0x9c7957;
const prop=(type,label,w,d,build)=>({type,label,w,d,solid:true,build});
export const GENERIC_REMAINING_PROPS={
  keyCuttingBench:prop('keyCuttingBench','Key-cutting machine and blank-key board',2.1,1.05,b=>{
    for(const x of [-.9,.9])b.block(STEEL,.08,.86,.9,x,0,0);
    b.box(WOOD,2.05,.1,1,0,.9,0);
    b.block(0x697f79,.75,.2,.45,-.2,.95,.12);
    b.cyl(STEEL,.13,.065,-.3,1.28,.2,Math.PI/2);
    b.box(DARK,.22,.1,.17,.15,1.15,.28);
    b.box(WOOD,2,1.1,.055,0,1.6,-.45);
    for(const y of [1.3,1.65,1.95])for(const x of [-.7,-.35,0,.35,.7]){
      b.cyl(0xc7ad68,.045,.025,x,y,-.405,Math.PI/2);
      b.box(0xc7ad68,.025,.12,.025,x,y-.09,-.405);
    }
  }),
  opticalDisplay:prop('opticalDisplay','Spectacle frames and dispensing display',2,.65,b=>{
    b.block(WHITE,1.95,1.9,.5,0,0,0);
    for(const y of [.8,1.15,1.5])for(const x of [-.65,0,.65]){
      for(const dx of [-.12,.12])b.box(DARK,.18,.09,.04,x+dx,y,.29);
      b.box(STEEL,.09,.025,.04,x,y,.29);
    }
  }),
  rehabSteps:prop('rehabSteps','Rehabilitation steps and handrails',1.8,2.4,b=>{
    for(let i=0;i<3;i++)b.block(0x78968d,1.5,.14*(i+1),.65,0,0,.7-i*.65);
    for(const x of [-.82,.82]){
      for(const z of [-.8,.8])b.cyl(STEEL,.035,1.1,x,.55,z);
      b.box(STEEL,.07,.07,2,x,1.1,0);
    }
  }),
  animalKennel:prop('animalKennel','Ventilated animal recovery kennel',1.8,1.14,b=>{
    b.block(WHITE,1.7,1.45,1,0,0,0);
    b.box(DARK,1.5,1.05,.04,0,.77,.51);
    for(let i=0;i<9;i++)b.box(STEEL,.025,1.05,.035,-.68+i*.17,.77,.54);
    b.box(0x8fa79b,1.4,.1,.7,0,.3,.08);
    b.cyl(STEEL,.11,.08,.45,.39,.4);
  }),
  parcelRack:prop('parcelRack','Labelled parcel sorting rack',2.2,1.1,b=>{
    for(const x of [-1,1])b.block(STEEL,.06,2.15,1,x,0,0);
    for(const y of [.15,.85,1.55]){
      b.box(STEEL,2.1,.06,1.05,0,y,0);
      for(const x of [-.7,0,.7]){
        b.block(0xb39770,.58,.46,.7,x,y+.04,0);
        b.box(WHITE,.18,.12,.012,x,y+.28,.357);
      }
    }
  }),
  printStation:prop('printStation','Production copier and print finishing',1.65,1.15,b=>{
    b.block(WHITE,1.3,1.12,.95,-.1,0,0);
    b.box(DARK,1.05,.07,.75,-.1,1.18,-.05);
    b.box(0x63888a,.35,.09,.22,.3,1.24,.3);
    b.box(STEEL,.35,.06,.7,.64,.78,.1);
    for(let i=0;i<4;i++)b.box(WHITE,.27,.018,.45,.64,.82+i*.02,.12);
  }),
  sewingStation:prop('sewingStation','Sewing machine and cutting table',2.1,1.1,b=>{
    for(const x of [-.85,.85])b.block(STEEL,.07,.85,.85,x,0,0);
    b.box(WOOD,2,.09,1,0,.9,0);
    b.block(WHITE,.66,.35,.3,-.3,.95,-.1);
    b.box(DARK,.26,.03,.34,-.06,.97,.05);
    b.cyl(0x8c5d57,.05,.13,-.5,1.36,-.12);
    b.box(0x6f8d91,.65,.025,.75,.55,.965,0);
  }),
  flowerDisplay:prop('flowerDisplay','Cut-flower buckets and bouquets',2,.95,b=>{
    b.block(WOOD,1.95,.18,.9,0,0,0);
    for(const x of [-.65,0,.65]){
      b.cyl(STEEL,.21,.42,x,.4,0);
      for(let i=0;i<5;i++){
        const dx=Math.sin(i*2.4)*.12,dz=Math.cos(i*2.4)*.12;
        b.cyl(0x557448,.014,.6,x+dx,.8,dz);
        b.ball([0xc68b83,0xd5b46e,0xb298b5][i%3],.11,x+dx,1.12+(i%2)*.08,dz);
      }
    }
  }),
  exhibitCase:prop('exhibitCase','Glazed exhibit display with caption',2,.95,b=>{
    b.block(WOOD,1.95,.7,.9,0,0,0);
    b.box(GLASS,1.85,.55,.8,0,.98,0);
    for(const x of [-.91,.91])b.box(STEEL,.045,.6,.83,x,.98,0);
    b.box(WHITE,.85,.11,.02,0,.56,.46);
    b.cyl(0xb09a70,.2,.25,0,.93,.04);
  }),
  photoBackdrop:prop('photoBackdrop','Portrait backdrop and studio lights',2.8,1.5,b=>{
    for(const x of [-1.1,1.1]){
      b.cyl(STEEL,.025,2.25,x,1.125,-.5);
      b.box(STEEL,.6,.04,.5,x,.03,-.5);
      b.box(DARK,.38,.48,.16,x,1.65,.45);
    }
    b.box(0xcac8bf,1.9,2.1,.04,0,1.2,-.55);
    b.box(0xcac8bf,1.9,.025,1.2,0,.025,.08);
  }),
  tyreRack:prop('tyreRack','Tyre storage rack',2.3,.9,b=>{
    for(const x of [-1.05,1.05])b.block(STEEL,.06,1.9,.8,x,0,0);
    for(const y of [.15,1.05]){
      b.box(STEEL,2.2,.06,.8,0,y,0);
      for(const x of [-.7,0,.7]){
        b.cyl(DARK,.32,.25,x,y+.36,0,Math.PI/2);
        b.cyl(STEEL,.13,.27,x,y+.36,.01,Math.PI/2);
      }
    }
  }),
  washEquipment:prop('washEquipment','Wash controls and coiled hose',1.7,.9,b=>{
    b.block(STEEL,1.6,2,.55,0,0,-.08);
    b.box(DARK,.45,.65,.08,-.4,1.3,.24);
    for(let i=0;i<6;i++)b.cyl(0x4f737a,.22-i*.018,.035,.4,1.25,.3+i*.025,Math.PI/2);
    b.box(0x7097a0,.12,1.4,.12,.65,.9,.2);
  }),
  teachingPool:prop('teachingPool','Small teaching pool with raised safety edge',4.2,5.5,b=>{
    b.block(0xc8d1c9,4.2,.15,5.5,0,0,0);
    b.box(0x579cae,3.7,.035,5,0,.16,0);
    for(const x of [-2,2])b.box(WHITE,.2,.3,5.5,x,.15,0);
    for(const z of [-2.65,2.65])b.box(WHITE,4,.3,.2,0,.15,z);
    for(const x of [-.45,.45])b.cyl(STEEL,.035,.8,x,.55,2.36);
    for(const z of [-1.8,-.6,.6,1.8])b.box(0xb1d3d3,3,.006,.04,0,.182,z);
  }),
};
