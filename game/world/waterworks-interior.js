import { createKit, ROOM } from './interior-kit.js';

// A walkable regional water-treatment works, with clearly separated clean
// control/testing and mechanical process zones. The arrangement is an
// educational interpretation, not a specification for any actual NSW facility.
// Membrane filtration and UV disinfection are site-specific technologies.
// See docs/WATERWORKS_INTERIOR.md for provenance and design limitations.
export const WATERWORKS_LAYOUT = Object.freeze({
  site: 'J8', aisle: {x0:-1.35,x1:1.35,z0:-11.7,z1:5.7},
  staff: {x:-4.25,z:1.05}, staffUse:{x:-4.25,z:3.78}
});

const zones = [
  {name:'Operations control office', x0:-7,x1:-1.35,z0:0.5,z1:6},
  {name:'Water quality laboratory',x0:1.35,x1:7,z0:0.5,z1:6},
  {name:'Membrane filtration gallery',x0:-7,x1:-1.35,z0:-6.0,z1:0.5},
  {name:'UV disinfection gallery',x0:1.35,x1:7,z0:-6.0,z1:0.5},
  {name:'Pumps and maintenance gallery',x0:-7,x1:7,z0:-12,z1:-6.0}
].map((r,i)=>({...r,w:r.x1-r.x0,d:r.z1-r.z0,parent:i===0?-1:0}));

export function buildWaterworksInterior(site, makeLabel, life=null) {
  const k=createKit(site,makeLabel,'Water Works treatment facility');
  const {THREE,group,box,solid,cyl,torus,text,add}=k;
  const C={floor:0xc5d0d0, wall:0xd7e3e2, steel:0x667983, frame:0x465c67,
    blue:0x378db7, aqua:0x73bac1, pipe:0x74929c, cream:0xe8ece7,
    amber:0xe7b444, green:0x55a97a, red:0xc74738, screen:0x174c60};
  k.shell({floor:C.floor,wall:C.wall,ceiling:0xe8f0ef,frontSill:1.1,sideSill:1.3});
  group.add(new THREE.HemisphereLight(0xd4efff,0x879c9d,1.8));

  // Non-colliding coloured floor zones, joint lines, a continuous 2.7m
  // centre pedestrian aisle and safety floor markings.
  for(const [x,w,z,d,c] of [[-4.16,5.55,3.05,5.55,0xd8e2df],
    [4.16,5.55,3.05,5.55,0xe1e9e6],[-4.16,5.55,-2.8,6.15,0xa5c1c0],
    [4.16,5.55,-2.8,6.15,0xa3bfcb],[0,13.65,-9,5.65,0x9bb0b4]])
    box(w,.012,d,x,.018,z,c);
  box(2.60,.013,17.3,0,.036,-2.7,0x617f78);
  for(const x of [-1.30,1.30])box(.045,.018,17.3,x,.048,-2.7,C.amber);
  for(let i=0;i<14;i++)box(.30,.018,.065,0,.050,5.0-i*1.2,0xdce6df);
  for(const z of [-6.1,0.55]) {
    box(13.35,.019,.09,0,.061,z,C.amber);
    for(const x of [-6.1,6.1])box(.09,.019,.62,x,.061,z,C.amber);
  }
  // Ceiling service beams and industrial linear luminaires.
  for(const z of [-10,-7,-4,-1,2,4.5]) {
    box(13.3,.16,.16,0,4.3,z,C.frame);
    for(const x of [-4.2,0,4.2]) {
      box(1.5,.10,.38,x,4.11,z,0xa2b8bc);
      box(1.38,.025,.26,x,4.047,z,0xe3f7ff,{e:0xa7bac0});
    }
  }
  // Overhead distribution pipework, kept clear of player/camera sight lines.
  for(const x of [-6.35,6.35]) {
    box(.22,.22,15.5,x,3.57,-2.5,C.blue);
    for(const z of [-9,-5,-1,2]) {
      cyl(.20,.20,.33,x,3.56,z,C.steel,{rz:Math.PI/2});
      box(.44,.035,.035,x,3.76,z,C.amber);
    }
  }
  const instrument=(x,y,z,labelColor=C.green)=>{
    box(.32,.39,.12,x,y,z,C.frame);
    box(.23,.21,.015,x,y+.03,z+.07,C.screen,{e:0x185f68});
    box(.12,.045,.018,x,y-.10,z+.075,labelColor);
    for(let i=0;i<4;i++)box(.022,.025,.012,x-.09+i*.06,y+.07,z+.083,0xc6e8e1);
  };
  const gauge=(x,y,z)=>{
    cyl(.23,.23,.075,x,y,z,C.cream,{rx:Math.PI/2},12);
    cyl(.17,.17,.078,x,y,z+.02,0xebf2e9,{rx:Math.PI/2},12);
    box(.095,.013,.018,x+.035,y+.05,z+.064,C.red,{rz:.6});
  };
  // Control office: glazing and an open entrance rather than a hidden
  // inaccessible room behind a full-height wall.
  text('OPERATIONS CONTROL',-4.55,3.05,5.38);
  solid(2.6,.90,.95,-4.25,.45,2.45,C.frame);
  box(2.66,.065,1.02,-4.25,.96,2.45,0xe6e6da);
  box(.9,.54,.09,-4.65,1.39,2.30,C.frame);
  box(.79,.42,.02,-4.65,1.40,2.36,C.screen,{e:0x174b67});
  for(let i=0;i<6;i++)box(.085,.06,.022,-4.91+i*.1,1.44,2.378,i%2?C.green:C.blue);
  box(.65,.49,.075,-3.75,1.33,2.34,C.frame);
  box(.55,.38,.02,-3.75,1.34,2.39,0x47829c,{e:0x31556b});
  for(const x of [-5.65,-5.05]) {
    solid(.52,.58,.50,x,.29,1.1,C.steel);
    box(.60,.08,.50,x,.64,1.1,0x385363);
  }
  solid(.75,1.78,.52,-6.30,.89,4.4,C.steel);
  for(let i=0;i<5;i++)box(.52,.025,.012,-6.30,.35+i*.28,4.13,0x9caeae);
  box(2.5,1.16,.055,-4.05,2.32,5.76,0xe7efe7);
  for(let i=0;i<14;i++)box(.12,.12,.015,-5.12+(i%7)*.32,2.56-Math.floor(i/7)*.24,5.81,i%4===0?C.amber:C.blue);
  instrument(-2.15,1.6,2.25);
  add('scada','Control room and monitoring','civic-ledger',
    'The control-room desk displays pump duty, storage and the town water-services ledger. These are simulated readings, not a certified plant-control system.',-4.25,3.78);

  // Laboratory, with reachable sample bench, jars, turbidity meter and a
  // handwashing station. No chemicals are dispensed by gameplay.
  text('WATER QUALITY LAB',4.2,3.05,5.38);
  solid(1.0,.9,3.15,5.45,.45,2.40,0xe8eeee);
  box(1.08,.08,3.22,5.45,.95,2.40,0x7b9da8);
  for(const z of [1.35,2.05,2.75,3.45]) {
    cyl(.13,.13,.31,5.32,1.14,z,0xb5edf5,{a:.53});
    cyl(.11,.11,.028,5.32,1.30,z,C.cream);
    box(.19,.13,.19,5.62,1.08,z,C.steel);
  }
  solid(.78,1.25,.53,6.24,.625,-.05,C.steel);
  box(.6,.48,.035,5.93,1.45,-.05,0xcde2e5);
  box(.58,.30,.08,5.96,1.48,.01,C.screen);
  box(.26,.20,.06,5.85,1.52,.07,C.green);
  // Single basin / sample bottle-rinse sink.
  box(.64,.04,.52,4.53,.96,4.58,C.steel);
  box(.42,.055,.30,4.53,.98,4.58,0x547784);
  box(.07,.29,.06,4.40,1.15,4.73,C.steel);
  box(.32,.05,.05,4.55,1.3,4.73,C.steel);
  for(let i=0;i<12;i++)box(.07,.11,.07,5.0+(i%4)*.28,1.02,3.65+Math.floor(i/4)*.29,[C.blue,C.aqua,C.green][i%3]);
  instrument(2.17,1.35,2.1,C.amber);
  add('samples','Water samples and testing','info',
    'Operators test treated water using sampling bottles, bench instruments and recorded procedures. The visual instruments are illustrative; laboratory results are not invented.',3.65,2.4);
  add('wash','Laboratory handwashing station','info',
    'Staff rinse sampling tools and wash their hands at a dedicated sink away from the electrical control equipment.',3.3,4.5);

  // Membrane gallery: three pressure-vessel skids with manifolds, gauges,
  // service clearances and an accessible inspection hotspot.
  text('MEMBRANE FILTRATION',-4.3,3.06,.1);
  for(let i=0;i<3;i++){
    const z=-1.45-i*1.40;
    solid(2.8,.34,.56,-5.10,.17,z,C.frame); // support footprint
    cyl(.37,.37,2.6,-5.15,1.22,z,C.cream,{rz:Math.PI/2},12);
    for(const x of [-6.20,-4.05])torus(.37,.055,x,1.22,z,C.blue,{ry:Math.PI/2});
    box(2.85,.12,.15,-5.10,1.70,z,C.pipe);
    for(const x of [-6.20,-4.05])box(.08,.51,.10,x,.68,z,C.steel);
    gauge(-3.57,1.20,z);
  }
  box(.15,.20,5.0,-3.40,1.75,-3.1,C.blue);
  for(const z of [-4.3,-3.0,-1.7])cyl(.14,.14,.28,-3.45,1.75,z,C.pipe,{rx:Math.PI/2});
  instrument(-2.10,1.32,-2.45);
  add('membranes','Membrane filtration skid','info',
    'Parallel filtration vessels and their pipe headers represent a compact membrane treatment step. Actual membrane type, capacity, pressure and water quality vary by plant.',-3.05,-2.4);
  add('filters','Filtration pressure gauges','info',
    'Pressure indicators help operators recognise filter fouling and plan cleaning. No numerical pressure is displayed without a simulated measurement.',-3.05,-4.5);

  // UV disinfection: protected tubes inside serviceable contact vessels,
  // with no exposed irradiation and no false player-triggered UV control.
  text('UV DISINFECTION',4.40,3.06,.1);
  for(const z of [-1.8,-3.8]){
    solid(3.6,.32,.64,4.75,.16,z,C.frame);
    cyl(.39,.39,3.22,4.70,1.04,z,0x8aadb8,{rz:Math.PI/2},12);
    for(const x of [3.30,6.10]){
      torus(.43,.06,x,1.04,z,C.steel,{ry:Math.PI/2});
      box(.12,.58,.09,x,.53,z,C.steel);
    }
    box(3.0,.13,.14,4.70,1.55,z,C.pipe);
    gauge(2.68,1.30,z);
  }
  for(let i=0;i<8;i++)box(.08,.07,.04,3.55+i*.35,1.82,-1.8,i%2?C.green:C.blue);
  solid(.78,1.30,.42,6.35,.65,-4.7,C.frame);
  instrument(6.35,1.35,-4.43,C.green);
  add('uv','Enclosed UV disinfection equipment','info',
    'Enclosed UV reactors are a possible disinfection barrier after filtration. Covers remain closed and interlocked; UV light is never exposed in this walk-through.',2.55,-2.0);
  add('uv-controls','UV safety and monitoring','info',
    'Lamp status and maintenance controls are represented in the equipment cabinet. A real operator follows validated procedures and interlocks before servicing.',2.6,-4.35);

  // Back-of-plant pumping gallery and maintenance bench.
  // Pump footprints stay to either side of the central exit/inspection aisle.
  text('PUMP AND MAINTENANCE GALLERY',0,3.1,-11.75);
  for(const x of [-5.5,-3.55]){
    solid(1.28,.30,2.1,x,.15,-9.55,C.frame);
    cyl(.48,.48,.95,x,1.05,-9.8,C.blue,{rx:Math.PI/2},12);
    cyl(.33,.33,.8,x,1.02,-8.93,C.steel,{rx:Math.PI/2},12);
    for(const y of [.82,1.18])torus(.35,.06,x,y,-8.92,C.frame);
    box(.65,.20,.25,x,1.28,-10.50,C.amber);
    gauge(x,1.9,-9.55);
  }
  for(const x of [4.15,5.75]){
    solid(1.15,.78,1.15,x,.39,-9.85,0x6f939d);
    cyl(.45,.45,.6,x,1.10,-9.85,0x9ec6d0,{},12);
    for(let i=0;i<8;i++)box(.11,.08,.14,x+(i%4-1.5)*.23,1.47,-10.05+Math.floor(i/4)*.4,C.frame);
    gauge(x,2.02,-9.85);
  }
  solid(1.9,.85,.68,5.72,.425,-7.10,0xa2aaa9);
  box(1.94,.065,.72,5.72,.88,-7.10,0xd0d3ce);
  for(let i=0;i<10;i++)box(.12,.19,.06,4.9+(i%5)*.27,1.03,-7.36+(Math.floor(i/5)*.2),[C.steel,C.amber,C.frame][i%3]);
  solid(.70,1.8,.52,6.27,.90,-11.10,C.frame);
  for(let i=0;i<5;i++)box(.45,.03,.014,6.26,.33+i*.30,-10.83,0xabbaba);
  instrument(-2.07,1.50,-8.8,C.amber);
  add('pumps','Duty and standby pumps','info',
    'A duty/standby pump bank feeds the distribution side of the works. The town sim models supply availability and power; the pump housings do not represent individual real-world machinery ratings.',-2.45,-9.3);
  add('reservoir','Storage and distribution','civic-ledger',
    'Inspect town water demand, supply and reservoir stock in the live Town Ledger. The physical vessels here represent distribution equipment.',2.45,-9.35);
  add('maintenance','Workshop and lockout equipment','info',
    'Tool storage, isolation records and service bench support preventative maintenance. Real plant access and work require trained operators and safety procedures.',3.55,-7.10);
  add('emergency','Safety and emergency procedures','info',
    'Emergency isolation and incident response information belongs with the plant operator. This walk-through does not provide controls for real equipment.',-2.45,-7.4);

  // Safety, fire point and all labels stay outside the centre aisle.
  cyl(.14,.14,.55,-6.50,1.05,5.3,C.red);
  box(.14,.09,.14,-6.50,1.38,5.3,C.frame);
  text('EMERGENCY EXIT',0,3.55,5.73);
  text('CLEAR WALKWAY',0,.20,-5.8);

  const supply=life?.civic?.supply||{};
  const stored=Number.isFinite(site?.stock?.water)?Math.round(site.stock.water):null;
  const demand=Number.isFinite(supply.waterDemand)?Math.round(supply.waterDemand):null;
  const available=Number.isFinite(supply.water)?Math.round(supply.water):null;
  const status=life?.civic ? (supply.waterOk===false?'Water supply constrained.':'Water availability is represented by the town simulation.') :
    'Live water status is available in the Town Ledger during gameplay.';
  const liveInfo=status+(stored!==null?' Reservoir stock: '+stored+' simulated units.':'')+
    (demand!==null?' Demand: '+demand+' simulated units.':'')+
    (available!==null?' Supplied: '+available+' simulated units.':'')+
    ' These are snapshot values from when the room was entered, not certified plant readings.';
  add('status','Town water-supply snapshot','info',liveInfo,-2.35,4.75);
  for(const type of ['control-console','water-lab','membrane-skids','uv-reactors','pump-bank','maintenance-bench'])
    k.placedProps.push({type,room:0});
  return k.finish({waterworksLayout:true,rooms:zones,
    staff:{pos:WATERWORKS_LAYOUT.staff,use:WATERWORKS_LAYOUT.staffUse},
    waterSnapshot:{stored,demand,available,ok:supply.waterOk??null}
  });
}
