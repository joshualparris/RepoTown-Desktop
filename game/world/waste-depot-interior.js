import {createKit} from './interior-kit.js';

// Q8 Waste Depot: a small, enclosed residual-waste transfer depot.
// NOT the P8 Recycling Centre, and NOT a visitor-accessible landfill cell.
// The area beyond the central pedestrian gallery is staff-only. Guidance:
// NSW EPA rural/regional transfer-station handbook, SafeWork NSW traffic and
// waste/plant guidance. This is illustrative, not an approved facility plan.
export const WASTE_DEPOT_LAYOUT=Object.freeze({
 site:'Q8',aisle:{x0:-1.35,x1:1.35,z0:-11.7,z1:5.85},
 zones:['Weigh-in / service office','Covered waste receival','Public safety route',
   'Controlled tipping bay','Quarantine and rejected loads','Compaction and skip transfer',
   'Drainage, ventilation and staff hygiene'],
 staff:{pos:{x:-4.50,z:1.3},use:{x:-3.22,z:3.2}}
});

export function buildWasteDepotInterior(site,makeLabel,life=null){
 const k=createKit(site,makeLabel,'Waste Depot · enclosed transfer station');
 const {THREE,group,box,solid,cyl,torus,text,add}=k;
 const c={floor:0x9fa5a0,wall:0xadb9b3,ceiling:0xc4cbc5,steel:0x51616a,
   beam:0x374952,yellow:0xe2b044,red:0xac4d40,green:0x5b896c,
   blue:0x53788c,concrete:0x858e90,cream:0xe3e0d4,glass:0xa7c6c3,
   dark:0x283841,wood:0x866c55,rubbish:0x6c6d5c};
 const whole=n=>Math.max(0,Math.floor(Number(n)||0));
 const atEntry={
   depotRubbish:whole(site.stock?.rubbish),
   homesAwaitingCollection:whole(life?.civic?.homes?.rubbish),
   countedDisposalToday:whole(life?.stats?.landfill)
 };
 k.shell({floor:c.floor,wall:c.wall,ceiling:c.ceiling,frontSill:1.05,sideSill:1.25});
 group.add(new THREE.HemisphereLight(0xe9eeea,0x727d78,1.65));
 // Pedestrian-only spine with contrasting nonslip visual surface.
 box(2.62,.014,17.5,0,.025,-2.7,0x748e87);
 for(const x of [-1.32,1.32])box(.085,.021,17.55,x,.042,-2.72,c.yellow);
 for(let z=5.1;z>-10.8;z-=1.3)box(.4,.014,.08,0,.045,z,0xcbd6cc);
 for(const z of [-5.8,-9.1])for(const x of [-1.52,1.52])
   box(.10,.018,.55,x,.055,z,c.red);
 // Steel portal frames and enclosed, serviceable ventilation.
 for(const z of [-10.8,-7.3,-3.8,-.30,3.4]){
   box(13.6,.22,.22,0,4.29,z,c.beam);
   for(const x of [-4.5,0,4.5]){
     box(1.45,.10,.28,x,4.14,z,c.steel);
     box(1.32,.028,.21,x,4.080,z,0xdfdfd1,{e:0x686e69});
   }
 }
 // Extraction duct with protected hood and roof vent, not a real measured
 // air-treatment installation.
 box(.56,.45,14.5,6.15,3.72,-2.9,c.steel);
 for(const z of [-9.4,-5.2,-1.2,2.3]){
   box(1.55,.12,.60,5.47,3.39,z,c.steel);
   box(.50,.45,.55,5.75,3.22,z,c.dark);
 }
 text('EXIT / VISITOR WALKWAY',0,3.45,5.55);
 text('AUTHORISED STAFF AND VEHICLES ONLY',0,3.12,-6.35);
 // Safety rails delineate workspaces. There is no public entry to the
 // compactor, active tipping apron or spill quarantine bay.
 const rail=(x,z,d,color=c.yellow)=>{
   for(const zz of [z-d/2,z+d/2])box(.11,1.5,.11,x,.75,zz,c.beam);
   for(const y of [.54,1.35])box(.08,.09,d,x,y,z,color);
 };
 // Public receival: service hatch, weigh-in register, clipboards, monitor,
 // labelled scale, desk and waiting bench. Not a generic shop till.
 text('WASTE RECEIVAL',-4.50,3.05,5.10);
 solid(3.25,.89,.90,-4.55,.445,2.4,c.beam);
 box(3.31,.09,.98,-4.55,.95,2.4,c.cream);
 box(.76,.48,.055,-5.12,1.40,2.20,c.dark);
 box(.67,.36,.018,-5.12,1.40,2.24,0x87a5a3,{e:0x244f50});
 box(.71,.025,.27,-5.12,1.08,2.65,c.steel);
 box(.56,.25,.38,-3.73,1.10,2.5,c.blue); // receipt printer
 for(let i=0;i<3;i++)box(.26,.03,.34,-4.17+i*.29,1.04,2.95,0xcac7a9);
 solid(.9,.28,.72,-6.05,.14,4.55,c.steel); // scale
 box(.80,.06,.65,-6.05,.31,4.55,0xaab5b1);
 solid(2.1,.43,.65,-4.10,.215,4.54,c.wood); // visitor bench
 add('weighin','Waste receival and load manifest','civic-ledger',
   'Register vehicle movements and municipal collections. The simulation tracks waste units, not measured tonnes or authorised weighbridge certificates.',-3.02,3.33);
 add('scale','Read receiving-scale and load policy','waste-depot-status',
   'A low loading platform and receipt printer help manage incoming vehicles. Trucks use the outdoor vehicle route; visitors stay inside the protected gallery.',-2.65,4.56);
 // Safety board and staff welfare area separated from processing lines.
 text('SITE RULES / INDUCTION',4.4,3.06,5.12);
 solid(2.2,1.3,.26,5.55,.65,4.55,c.steel);
 box(2.12,1.22,.03,5.55,1.50,4.71,c.cream);
 for(let i=0;i<5;i++){
   box(1.65,.035,.015,5.55,1.91-i*.18,4.735,i===0?c.red:c.dark);
 }
 solid(1.8,.50,.62,4.4,.25,2.14,c.wood);
 box(1.8,.55,.10,4.4,.82,1.85,c.steel);
 cyl(.16,.16,.62,6.4,.31,2.1,c.red);
 box(.11,.09,.10,6.4,.67,2.1,c.beam);
 add('site-rules','Read pedestrian and vehicle separation rules','waste-depot-status',
   'Safe waste transfer requires designated pedestrians, driver safety zones, guarded plant, clean escape routes and staff induction. This visitor gallery cannot access active machinery.',2.42,3.30);
 // Front-left refuse identification desk and reject tracking.
 text('LOAD INSPECTION',-4.3,2.98,.30);
 solid(2.65,.86,1.15,-4.75,.43,-1.45,c.steel);
 box(2.75,.075,1.23,-4.75,.91,-1.45,c.cream);
 box(.52,.10,.45,-5.42,1.02,-1.45,0x778d87); // sampling tray
 for(const x of [-4.6,-4.0,-3.45])
   box(.26,.40,.33,x,1.12,-1.45,[c.yellow,c.red,c.green][Math.round((x+4.6)/.6)]);
 for(const z of [-2.7,-3.6]){
   solid(1.45,.75,1.05,-5.85,.375,z,c.rubbish);
   box(1.25,.15,.96,-5.85,.84,z,0x88877b);
 }
 rail(-1.70,-2.0,5.1);
 add('screen','Inspect nonconforming-load screening','waste-depot-status',
   'Staff check incoming rubbish for prohibited items, sharps, chemical containers and battery hazards. Rejects are isolated and referred to approved downstream operators.',-2.42,-1.45);
 // Large, visible enclosed tipping bay: floor markings, bounded roll-off
 // skip containers, concrete retaining walls and enclosed rear shutter.
 text('COVERED TIP FLOOR',-4.45,2.95,-5.32);
 rail(-1.72,-8.15,6.0,c.red);
 box(5.0,.014,5.35,-4.55,.040,-8.86,c.concrete);
 for(const x of [-6.8,-2.3]){
   solid(.16,1.38,4.78,x,.69,-8.85,c.steel);
   for(const z of [-10.72,-9.70,-8.58,-7.42])box(.075,.075,.43,x,1.26,z,c.yellow);
 }
 // Trailer/skip body is closed and inaccessible; compact pile is decorative.
 solid(3.63,.25,4.12,-4.55,.125,-8.88,c.beam);
 for(let i=0;i<9;i++) {
   const x=-5.8+(i%3)*1.15,z=-10.02+Math.floor(i/3)*1.03;
   box(.85,.19,.79,x,.36+(i%3)*.1,z,[c.rubbish,0x74695b,c.green][i%3]);
 }
 text('TIPPING APRON · NO ENTRY',-4.4,3.03,-10.73);
 add('tipping','View the secured tipping apron','waste-depot-status',
   'Waste enters through vehicle-controlled tipping bays. People never walk beneath a raised tipper body or into an active loading apron. The game does not simulate truck unloading geometry.',-.05,-7.92);
 // Middle-right: compactor and roll-off container behind guards.
 text('COMPACTOR · LOCKED',4.2,3.04,.05);
 rail(1.72,-2.15,4.9,c.red);
 solid(3.55,1.68,2.05,4.57,.84,-2.58,c.beam);
 box(2.05,.63,.08,4.60,1.22,-1.50,c.blue);
 box(.67,.47,.07,6.12,1.30,-1.50,c.yellow);
 box(.27,.31,.075,6.15,1.30,-1.44,c.red);
 // hydraulic ram and guarded chute are behind the locked machine housing.
 cyl(.18,.18,1.30,3.74,1.64,-2.54,c.steel,{rz:Math.PI/2});
 box(.75,.19,.26,4.35,1.68,-2.54,0xadbdb8);
 add('compactor','Inspect guarded waste compaction unit','waste-depot-status',
   'A compactor and sealed roll-off container reduce handling movements. Its access guards and isolation points prevent public operation. There is no gameplay button to start it.',2.22,-2.56);
 // Rear right: quarantine shelter and spill kit, not ordinary refuse bays.
 text('REJECTED LOAD QUARANTINE',4.30,3.07,-5.35);
 rail(1.72,-8.65,5.80,c.yellow);
 solid(4.00,.18,4.50,4.55,.09,-8.80,c.steel); // contained base
 for(const x of [2.55,6.55])for(const z of [-10.96,-6.62])
   box(.10,2.75,.10,x,1.375,z,c.beam);
 for(const x of [2.55,6.55])box(.035,2.63,4.18,x,1.37,-8.8,c.glass,{a:.2});
 for(const z of [-10.95,-6.64])box(4.0,2.63,.04,4.55,1.37,z,c.glass,{a:.2});
 for(const [x,z,col] of [[3.56,-8.10,c.yellow],[5.52,-8.12,c.red],[4.6,-9.90,c.blue]]){
   box(.8,.73,.80,x,.365,z,col);
   box(.74,.07,.73,x,.76,z,c.dark);
   box(.30,.19,.022,x,.55,z+.41,c.red);
 }
 // Clearly marked spill-control kit and contained-drain representation.
 solid(.62,1.05,.53,6.25,.525,-5.80,c.green);
 box(.33,.34,.018,6.25,.7,-5.51,c.cream);
 box(.22,.08,.035,6.25,.7,-5.48,c.red);
 box(.28,.11,4.15,5.85,.035,-8.8,c.dark); // contained drain
 for(let i=0;i<7;i++)box(.04,.013,.42,5.85,.094,-10.47+i*.56,0xaeb8b2);
 add('quarantine','Review spill and hazardous-waste containment','waste-depot-status',
   'Problem waste is isolated in a contained and ventilated area with spill-response equipment. No hazardous liquids, batteries or sharps can be manipulated by visitors.',2.08,-8.3);
 add('drain','Inspect contained drainage and runoff design','waste-depot-status',
   'Bunds, roof cover, controlled drainage and litter screens aim to prevent contaminated washwater or rainfall leaving the handling area. This is a visual illustration, not a functioning treatment system.',2.08,-10.2);
 // A closed shutter signals outdoor truck loading is NOT player accessible.
 box(2.85,2.80,.09,0,1.43,-11.80,c.beam);
 for(let i=0;i<13;i++)box(2.76,.038,.07,0,.2+i*.19,-11.73,0x9ba7a3);
 text('VEHICLE SHUTTER · CLOSED',0,3.42,-11.50);
 add('dispatch','Read outbound disposal manifest','waste-depot-status',
   'Record accepted residual rubbish and its outbound handling separately from recyclable scrap next door. The current town game does not yet track the final licensed disposal destination.',.1,-10.1);
 const stock={rubbish:whole(site.stock?.rubbish),kerbside:whole(life?.civic?.homes?.rubbish),
   reportedDepositsToday:whole(life?.stats?.landfill)};
 return k.finish({wasteDepotLayout:true,layout:WASTE_DEPOT_LAYOUT,
   staff:WASTE_DEPOT_LAYOUT.staff,
   stockAtEntry:stock,
   safety:[
    'Public visitors remain in the protected pedestrian spine.',
    'The compactor, tipping apron, quarantine bay and external vehicle areas are out of bounds.',
    'All controls, weights, equipment and waste quantities are fictional and illustrative.'
   ]});
}
