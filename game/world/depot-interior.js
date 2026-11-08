import { createKit } from './interior-kit.js';

// Compact rail freight house: receive → store → pack → dispatch.
// References and simulation limits: docs/RAIL_DEPOT_INTERIOR.md.
export function buildDepotInterior(site, makeLabel) {
  const k = createKit(site, makeLabel, 'Rail Depot freight house');
  const { box, solid, cyl, torus, text, add } = k;
  const steel=0x3c525c, orange=0xd58735, wood=0xa78358, cream=0xddd6c5;
  k.shell({wall:0xb7beb8, floor:0x858b89, ceiling:0xd6dbd4});
  // Concrete joints, overhead steelwork and shielded strip lights.
  for (const z of [-10,-6,-2,2]) {
    box(13.6,.009,.018,0,.006,z,0x656e6c);
    box(13.5,.18,.15,0,4.3,z,steel);
    for (const x of [-3,3]) {
      box(1.7,.12,.35,x,4.15,z,steel);
      box(1.5,.025,.24,x,4.075,z,0xfff2cf,{e:0x77715c});
    }
  }
  // A continuous marked pedestrian spine; bays never overlap it.
  box(2,.012,15.5,0,.012,-2.1,0x556f65);
  for (const x of [-1.05,1.05]) box(.07,.014,15.5,x,.014,-2.1,0xe9d57b);
  text('RAIL DEPOT · Dispatch office',-3.9,2.8,2.2);
  text('PEDESTRIAN ROUTE',0,.28,-3);
  // Office is an open L-shaped booth with a staff entrance at its rear.
  solid(.13,1.15,3.7,-6.05,.575,1.3,steel);
  solid(3.5,1.05,.75,-3.9,.525,1.3,cream);
  box(3.7,.08,.9,-3.9,1.09,1.3,wood);
  box(.7,.48,.08,-4.6,1.48,1.2,steel);
  box(.58,.35,.015,-4.6,1.49,1.25,0x8eaaa2);
  box(.18,.2,.16,-4.6,1.2,1.2,steel);
  box(.65,.025,.22,-4.6,1.15,.95,0x394343);
  box(.45,.28,.38,-2.8,1.26,1.3,0x586467); // label printer
  box(.28,.01,.26,-2.8,1.13,1.6,0xe8e6d7);
  for(let i=0;i<3;i++) box(.32,.04,.4,-3.6+i*.35,1.15,1.3,[0x7b8871,0x8f5b42,0xb59c59][i]);
  solid(.65,.5,.65,-4,.25,-.35,steel);
  box(.65,.6,.1,-4,.8,-.62,0x6d7b72);
  solid(2.3,2.8,.12,-4.5,1.4,-1.2,cream);
  box(2,.95,.08,-4.5,2.2,-1.1,wood);
  for(let i=0;i<4;i++) box(.35,.58,.015,-5.15+i*.43,2.2,-1.045,0xe5dfc7);
  // A short visitor bench and parcel collection ledge near the entrance.
  solid(2,.5,.6,-4.2,.25,4.5,wood);
  box(2,.6,.1,-4.2,.8,4.75,wood);
  add('dispatch','Freight dispatch ledger','civic-ledger','Current depot stock and town freight services.',-3.9,2.45);
  add('office','Dispatch office','info','Consignment records, a computer and label printer at the freight clerk’s desk. Open the freight ledger to check current stock and deliveries.',-2.3,.1);
  // Separate, labelled racks on opposite sides. Goods reflect stock at entry.
  const stock={};
  for(const key of ['coffee','tea','parcel']) stock[key]=Math.max(0,Math.floor(Number(site.out?.[key])||0));
  const carton=(x,y,z,color=0xb69b70)=>{
    box(.48,.36,.42,x,y,z,color);
    box(.07,.008,.43,x,y+.184,z,0xd6c49b);
    box(.18,.12,.009,x,y,z+.215,0xeee4c9);
  };
  for(const [x,key,color] of [[-5.3,'coffee',0x9c7853],[5.3,'tea',0x7d9167]]) {
    for(const px of [x-.95,x+.95]) for(const z of [-6.9,-3.7]) solid(.1,2.9,.1,px,1.45,z,steel);
    // Conservative whole-rack collider prevents walking under shelving.
    k.blocker(2.05,3.4,x,-5.3);
    for(const y of [.22,1.1,1.98]) {
      box(2.05,.09,3.4,x,y,-5.3,steel);
      for(const z of [-6.99,-3.61]) box(2.05,.12,.06,x,y,z,orange);
    }
    for(let i=0;i<Math.min(stock[key],24);i++) carton(x+((i%2)-.5)*.7,.445+Math.floor(i/8)*.88,-6.45+(Math.floor(i/2)%4)*.75,color);
    text(key==='coffee'?'A · COFFEE':'B · TEA',x,3.15,-5.3);
  }
  add('storage','Dry freight storage','info',`Stock when you entered: ${stock.coffee} coffee, ${stock.tea} tea. Separate labelled racks leave the central pedestrian route clear. Check the live ledger for changes.`,0,-5.3);
  // Receiving and outbound staging occupy different rear bays.
  const bay=(x,label)=>{
    for(const sx of [-1.25,1.25]) box(.06,.012,2.25,x+sx,.015,-9.6,orange);
    for(const z of [-10.72,-8.48]) box(2.5,.012,.06,x,.015,z,orange);
    text(label,x,2.8,-10.8);
  };
  const pallet=(x,z)=>{
    solid(1.2,.14,.95,x,.07,z,wood);
    for(let i=0;i<5;i++) box(.19,.035,.95,x-.48+i*.24,.158,z,0xc0a477);
  };
  bay(-3.8,'RECEIVING · Check & sort'); bay(3.8,'DISPATCH · Collection');
  pallet(-3.8,-9.7); pallet(3.8,-9.7);
  for(let i=0;i<Math.min(stock.parcel,12);i++) carton((i<6?-3.8:3.8)+((i%2)-.5)*.52,.38+Math.floor((i%6)/2)*.38,-9.7);
  // Closed goods shutter: no false doorway or opening into the outside void.
  box(3.3,3.1,.11,0,1.55,-11.8,steel);
  for(let i=0;i<17;i++) box(3.15,.025,.03,0,.15+i*.17,-11.72,0x8c9694);
  box(.65,.06,.07,0,.6,-11.65,0x202d30);
  text('GOODS SHUTTER · Closed',0,3.5,-11.65);
  add('receiving','Receiving inspection','info','The receiving bay has space for checking and sorting consignments before storage. The goods shutter is closed. Fuel and ore handling stays in the outdoor yard.',-3.8,-8);
  add('outbound','Dispatch staging','info',`${stock.parcel} parcels recorded when you entered. Outbound staging is separate from receiving. The displays show a selection of consignments; check the live ledger for current totals.`,3.8,-8);
  // Packing bench and scale between storage and dispatch, outside the main aisle.
  solid(2.1,.9,.85,3.5,.45,-1.5,steel);
  box(2.2,.07,.95,3.5,.94,-1.5,wood);
  box(.65,.1,.55,3.05,1.025,-1.5,0xb2b9b6);
  box(.07,.4,.07,3.05,1.22,-1.8,steel);
  box(.4,.2,.07,3.05,1.42,-1.8,0x313e40);
  box(.32,.12,.012,3.05,1.42,-1.755,0x829b80); // no invented live weight
  cyl(.16,.16,.55,4.1,1.24,-1.5,0xbfa579,{rx:Math.PI/2});
  torus(.1,.035,3.7,1.03,-1.4,0xd6b666,{rx:Math.PI/2});
  add('packing','Weighing and packing bench','info','A platform scale, wrapping roll and tape station form the depot’s packing workbench.',3.5,-.45);
  // Parked hand pallet truck; collider includes forks and handle footprint.
  k.blocker(1,1.6,-1.95,-9.7);
  for(const x of [-2.22,-1.68]) {
    box(.18,.13,1.3,x,.13,-9.6,orange);
    cyl(.1,.1,.14,x,.1,-9.05,0x253033,{rz:Math.PI/2});
  }
  box(.8,.32,.25,-1.95,.22,-10.2,orange);
  box(.09,1.05,.08,-1.95,.8,-10.2,steel);
  torus(.2,.035,-1.95,1.36,-10.2,steel);
  // Driver rest corner: lockers, kitchenette, handwashing sink and table.
  for(const x of [4.65,5.3,5.95]) {
    solid(.6,1.95,.6,x,.975,4.95,steel);
    box(.5,1.8,.025,x,1,4.63,0x87958d);
    box(.04,.16,.04,x+.16,1.1,4.6,0x222e30);
    for(let j=0;j<3;j++) box(.25,.025,.012,x,1.65+j*.07,4.605,steel);
  }
  solid(1.7,.9,.65,5.75,.45,2.4,cream);
  box(1.8,.06,.75,5.75,.93,2.4,0xc5ccca);
  box(.65,.025,.47,5.35,.967,2.4,steel);
  cyl(.025,.025,.35,5.35,1.13,2.65,0xbec6c4);
  box(.03,.03,.2,5.35,1.3,2.56,0xbec6c4);
  cyl(.14,.14,.27,6.2,1.1,2.4,0xe4dfce);
  solid(1.25,.72,.7,3.1,.36,3.8,wood);
  for(const z of [2.95,4.65]) solid(1.25,.42,.35,3.1,.21,z,steel);
  solid(.5,.6,.5,6.2,.3,.55,steel);
  text('DRIVER REST AREA',4.5,2.7,3.8);
  add('rest','Driver rest and handwashing','info','A break table, lockers, handwashing sink, kettle and waste bin give staff a place away from freight handling.',4.25,1.1);
  // Fire point by the public entrance, outside all circulation routes.
  cyl(.13,.13,.5,1.6,1.05,5.6,0xaf3b2c);
  box(.12,.07,.12,1.6,1.34,5.6,steel);
  text('EXIT',0,3.2,5.7);
  return k.finish({depotLayout:true,stockAtEntry:stock,staff:{pos:{x:-3.2,z:.15},use:{x:-3.9,z:2.45}}});
}
