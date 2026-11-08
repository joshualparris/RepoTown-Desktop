import { createKit } from './interior-kit.js';

// A compact roller mill, not a miniature copy of a full industrial plant.
// Reference process and deliberate simplifications: docs/FLOUR_MILL_INTERIOR_2026-10-20.md.
export function buildMillInterior(site, makeLabel, roomTitle='Flour Mill') {
  const k=createKit(site,makeLabel,roomTitle);
  const {THREE,group,box,solid,cyl,torus,text,add,placedProps}=k;
  const C={wall:0xe1dfd3,floor:0x8d908a,steel:0xb4bec1,green:0x466d63,dark:0x293b3c,wood:0x9b7951,sack:0xd6bf8c,yellow:0xe6ba41};
  k.shell({wall:C.wall,floor:C.floor,ceiling:0xe9e8df,frontSill:0.9,sideSill:1.4});
  group.add(new THREE.HemisphereLight(0xfff8e7,0x56616a,2.1));
  for(const x of [-4,0,4])for(const z of [-9,-3,3]){
    box(1.6,.10,.3,x,4.43,z,C.steel);box(1.4,.03,.22,x,4.36,z,0xfff5d6,{e:0xffe4b0});
  }
  // A continuous two-metre visitor/inspection aisle; machinery stays outside it.
  for(const x of [-1.55,1.55])box(.055,.012,14.8,x,.012,-2.3,C.yellow);
  for(const z of [2,-1,-4,-9.7]){
    box(.06,.014,.55,0,.016,z,C.yellow);box(.38,.014,.06,0,.016,z-.23,C.yellow);
  }
  text('Flour Mill · S8',0,3.5,-10.9,'room');
  text('Grain → clean → mill → sift → pack',0,2.95,-10.9,'room');
  const fixture=(type)=>placedProps.push({type,room:0});
  const pallet=(x,z)=>{
    solid(2,.15,1.5,x,.075,z,C.wood);
    for(let i=0;i<5;i++)box(.32,.06,1.5,x-.8+i*.4,.18,z,0xb59365);
  };
  const bags=(x,z,count)=>{
    const n=Math.max(0,Math.min(12,Math.ceil(Number(count)||0)));
    for(let i=0;i<n;i++){
      const bx=x-.58+(i%3)*.58,bz=z-.38+(Math.floor(i/3)%2)*.72,y=.38+Math.floor(i/6)*.34;
      box(.52,.32,.62,bx,y,bz,C.sack);box(.30,.12,.013,bx,y,bz+.318,0xf4edda);
      box(.26,.025,.016,bx,y,bz+.328,C.green);
    }
  };
  // Raw wheat and finished flour are kept in separate marked bays, raised off the floor.
  pallet(-4.6,3.5);bags(-4.6,3.5,site.stock?.grain||0);fixture('grain-pallet');
  pallet(4.6,3.5);bags(4.6,3.5,site.out?.flour||0);fixture('flour-pallet');
  text('Wheat intake',-4.6,1.7,3.5);text('Flour dispatch',4.6,1.7,3.5);
  // Sack trolley parked beside dispatch, outside the entry route.
  solid(.6,.13,.75,6,.12,1.7,C.green);
  for(const x of [5.72,6.28]){cyl(.13,.13,.10,x,.18,2.0,C.dark,{rz:Math.PI/2});box(.04,1.1,.04,x,.7,2.02,C.steel);}
  box(.6,.04,.04,6,1.24,2.02,C.steel);fixture('sack-trolley');
  // Intake grate, closed cleaner/destoner and a conditioning hopper.
  solid(2.0,.65,1.7,-4.6,.325,.25,C.green);
  for(let i=0;i<9;i++)box(.07,.04,1.55,-5.42+i*.205,.68,.25,C.steel);
  solid(2.4,1.8,1.8,-4.6,.9,-2.7,0xd9ddd7);
  for(let i=0;i<4;i++)box(1.8,.08,.06,-4.6,.45+i*.32,-1.76,C.green);
  cyl(.18,.18,.7,-4.6,2.12,-2.7,C.steel);
  solid(1.3,2.4,1.3,-5.9,1.2,-5.1,C.green);
  cyl(.56,.3,.65,-5.9,2.7,-5.1,C.steel);
  fixture('grain-cleaner');fixture('conditioning-bin');
  text('Cleaning & conditioning',-4.5,2.9,-2.7);
  // Enclosed break/reduction roller units; no exposed drive belts in the visitor area.
  for(const z of [-7.4,-10.0]){
    solid(2.4,1.4,1.7,-4.6,.7,z,C.green);
    box(2.0,.7,.08,-4.6,.9,z+.89,0xe3e4dc);
    for(const x of [-5.2,-4.0]){
      cyl(.25,.25,.08,x,.88,z+.96,C.dark,{rx:Math.PI/2});
      torus(.19,.025,x,.88,z+1.02,C.steel);
      box(.025,.3,.025,x,.88,z+1.03,C.steel);
    }
    cyl(.55,.25,.65,-4.6,1.75,z,C.steel);
    box(.14,.22,.08,-3.55,1.22,z+.97,C.yellow);
    cyl(.055,.055,.05,-3.55,1.25,z+1.03,0xb52a27,{rx:Math.PI/2});
  }
  fixture('roller-mills');text('Guarded roller mills',-4.5,2.8,-8.5);
  // Plansifter cabinets, bolted doors and separate product outlets.
  solid(2.5,2.5,2.2,4.6,1.25,-9.5,0xd9ddd7);
  for(const x of [3.95,5.25]){
    box(1.13,2.1,.06,x,1.35,-8.36,C.green);
    for(const y of [.45,1.05,1.65,2.25])box(.82,.04,.04,x,y,-8.31,C.steel);
    box(.07,.4,.08,x+.35,1.3,-8.27,C.dark);
  }
  fixture('plansifter');text('Sifting & grading',4.6,3.0,-9.4);
  // Bagging station: hopper, filling spout, platform scale, sealer and sample bench.
  solid(2.1,.25,1.6,4.6,.125,-4.0,C.dark);
  for(const x of [3.75,5.45])solid(.10,2.6,.10,x,1.3,-4,C.steel);
  cyl(.65,.22,.8,4.6,2.5,-4,C.steel);cyl(.12,.12,.55,4.6,1.83,-4,C.steel);
  box(.55,.75,.55,4.6,.72,-4,C.sack);box(.44,.25,.12,5.55,1.3,-3.6,C.dark);
  box(.33,.15,.02,5.55,1.3,-3.53,0xa6c8ae);fixture('bagging-scale');
  solid(2,.85,.8,4.6,.425,-.3,C.steel);
  box(.6,.35,.4,5.0,1.05,-.3,C.green);box(.7,.05,.5,4.2,.89,-.3,0xf4edda);
  for(let i=0;i<3;i++)cyl(.09,.09,.18,4.1+i*.3,1.0,-.3,C.sack);
  fixture('quality-bench');text('Weigh · seal · batch record',4.6,2,-1.6);
  // Closed dust extraction ductwork follows the machines, clear above walking headroom.
  for(const x of [-4.6,4.6]){
    cyl(.14,.14,12.5,x,3.75,-3.2,C.steel,{rx:Math.PI/2});
    for(const z of [-9.5,-4,.3])cyl(.10,.10,1.1,x,3.2,z,C.steel);
  }
  cyl(.14,.14,9.2,0,3.75,-10.6,C.steel,{rz:Math.PI/2});
  solid(1.0,2.5,.75,6.2,1.25,-6.7,C.steel);fixture('dust-extraction');
  // Staff desk at the rear: smaller than the old retail counter, with walk-around access.
  solid(2.7,1.0,.9,0,.5,-6.4,C.wood);
  box(2.8,.06,1,0,1.03,-6.4,0xddd9c5);
  box(.55,.08,.35,-.65,1.1,-6.4,C.dark);box(.5,.34,.06,-.65,1.3,-6.58,C.dark);
  box(.42,.25,.02,-.65,1.3,-6.54,0x92b5a2);
  box(.48,.035,.34,.6,1.08,-6.35,0xf4edda);fixture('dispatch-desk');
  // Separate handwash, maintenance cabinet, coats, and fire equipment.
  solid(.8,.9,.6,6.35,.45,-11.2,C.steel);box(.6,.08,.45,6.35,.92,-11.2,C.dark);
  cyl(.025,.025,.35,6.55,1.12,-11.2,C.steel);box(.22,.04,.04,6.45,1.3,-11.2,C.steel);
  solid(1.4,1.8,.55,-2.0,.9,-11.4,C.green);fixture('maintenance-cabinet');fixture('handwash');
  cyl(.12,.12,.55,-6.5,.65,4.8,0xa3312b);box(.25,.15,.08,-6.5,1,4.8,C.dark);
  text('Exit',0,2.8,5.2,'room');
  add('counter','Mill dispatch and production ledger','civic-ledger','Current grain, flour, workers and deliveries.',0,-5.25);
  add('intake','Wheat intake and cleaning','info','Wheat arrives from the Wheat Farm. The grated intake feeds a cleaner and destoner before conditioning. Raw grain is kept separate from bagged flour.',-2.6,.3);
  add('rollers','Inspect the guarded roller mills','info','Break rolls open the wheat; reduction rolls grind the separated material finer. Drives are enclosed. The town simulation models this as staffed grain-to-flour production.',-2.6,-8.3);
  add('sifter','Inspect the plansifter','info','Sieves separate flour from larger particles for further milling. These cabinets represent that process; individual particle sizes are not simulated.',2.6,-8.3);
  add('packing','Bagging and batch-control bench','info','A filling spout feeds bags on a scale. Sealing and batch records follow at the bench, before flour moves to the dispatch pallet.',2.6,-2.5);
  add('dispatch','Flour stock and outgoing deliveries','civic-ledger','Open the live mill ledger to check flour awaiting collection for the bakery.',2.6,3.5);
  add('hygiene','Handwash and dust-control inspection','info','A separate handwash basin, enclosed extraction ducts and a maintenance cabinet support a clean work area. This is a simplified game interior, not an operating manual.',2.6,-10.7);
  return k.finish({staff:{pos:{x:0,z:-7.65},use:{x:0,z:-5.25}},millLayout:true});
}
