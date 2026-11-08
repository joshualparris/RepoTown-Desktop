import { createKit } from './interior-kit.js';

// P8: a SMALL regional recycling transfer, sorting and reuse depot.
// This 14 x 18 m building is NOT a full industrial materials recovery facility.
// Design informed by Sustainability Victoria's MRF process and SafeWork NSW
// recycling/moving-plant guidance. See docs/RECYCLING_CENTRE_INTERIOR.md.
export const RECYCLING_LAYOUT=Object.freeze({
  site:'P8', aisle:{x0:-1.35,x1:1.35,z0:-11.7,z1:5.8},
  zones:[
    'Receival and weigh-in desk',
    'Reuse and repair assessment',
    'Manual pre-sorting and safety',
    'Separation demonstration gallery',
    'Baled materials and dispatch'
  ],
  staff:{x:-4.8,z:1.05},staffUse:{x:-2.38,z:2.2}
});

export function buildRecyclingInterior(site,makeLabel,life=null){
  const k=createKit(site,makeLabel,'Recycling Centre and reuse depot');
  const {THREE,group,box,solid,cyl,torus,ball,text,add}=k;
  const C={floor:0xb5bdaf,wall:0xcbd7c7,steel:0x53646c,frame:0x344c54,
    pale:0xe2e8d9,green:0x418d62,blue:0x4586a4,gold:0xe4b45a,
    red:0xd15e50,orange:0xcc9144,wood:0x98734f,card:0xb99a69,
    glass:0x9dc6c7,plastic:0x6ba5ad,paper:0xdfd6b2,dark:0x263940};
  k.shell({wall:C.wall,ceiling:0xe4e9e1,floor:C.floor,frontSill:1.05,sideSill:1.35});
  group.add(new THREE.HemisphereLight(0xdbeef0,0x837d6b,1.70));
  // Marked visitor corridor stays free of all machine colliders; this is a
  // supervised indoor visitor gallery and all moving plant is powered off.
  box(2.65,.014,17.4,0,.015,-2.7,0x688e7d);
  for(const x of [-1.34,1.34])box(.065,.018,17.40,x,.034,-2.7,C.gold);
  for(let i=0;i<18;i++)box(.30,.018,.046,0,.045,5.25-i*.94,0xd6e9de);
  for(const z of [.30,-6.20])box(13.4,.02,.10,0,.048,z,C.gold);
  for(const z of [-10,-7,-4.0,-1,2,4.55]){
    box(13.2,.14,.16,0,4.28,z,C.steel);
    for(const x of [-4.5,0,4.5]){
      box(1.45,.09,.32,x,4.12,z,0xadbcb9);
      box(1.33,.025,.25,x,4.063,z,0xf1f4e9,{e:0xa0aab0});
    }
  }
  const labelStrip=(title,x,z)=>text(title,x,3.07,z);
  const led=(x,y,z,c)=>box(.10,.07,.02,x,y,z,c,{e:c});
  const scale=(x,z)=>{
    solid(1.14,.21,.86,x,.105,z,C.steel);
    box(1.0,.035,.71,x,.235,z,0xbac8c5);
    box(.12,.90,.11,x-.43,.69,z-.32,C.frame);
    box(.53,.37,.09,x-.43,1.20,z-.31,C.dark);
    box(.43,.22,.014,x-.43,1.20,z-.265,0x1f7a8c,{e:0x145068});
  };
  const crate=(x,z,c,contents=0)=>{
    solid(.88,.63,.72,x,.315,z,c);
    for(const dx of [-.36,.36])for(const dz of [-.27,.27])
      box(.045,.59,.045,x+dx,.33,z+dz,C.wood);
    for(let i=0;i<contents;i++){
      box(.12,.10,.13,x+(i%3-1)*.22,.68+(i%2)*.08,
        z+(Math.floor(i/3)-1)*.15,[C.paper,C.blue,C.green][i%3]);
    }
  };
  const guard=(x,z,length=2.5)=>{
    for(const dx of [-length/2,0,length/2])cyl(.038,.038,1.03,x+dx,.515,z,C.gold);
    box(length,.052,.055,x,1.06,z,C.gold);
    box(length,.033,.05,x,.60,z,C.gold);
    for(const dx of [-length/2,length/2])box(.13,.22,.13,x+dx,.11,z,C.orange);
  };
  const diagram=(x,z)=>{
    box(2.80,1.30,.055,x,2.60,z,C.pale);
    const cols=[C.blue,C.green,C.gold,C.red,C.blue];
    for(let i=0;i<5;i++){
      box(.40,.31,.018,x-1.06+i*.53,2.69,z+.034,cols[i]);
      if(i<4)box(.12,.04,.025,x-.79+i*.53,2.69,z+.055,C.frame);
    }
    box(2.35,.11,.023,x,2.16,z+.041,C.dark);
  };
  // Front-left: receival desk, certified weight check, paperwork/traffic
  // management, with the operative behind the counter, not on player aisle.
  labelStrip('RECEIVAL / CHECK-IN',-4.40,5.25);
  solid(2.75,1.04,1.12,-4.8,.52,2.34,C.steel);
  box(2.81,.065,1.18,-4.8,1.07,2.34,C.pale);
  box(.85,.58,.08,-5.25,1.48,2.04,C.frame);
  box(.73,.44,.015,-5.25,1.50,2.10,0x27616d,{e:0x163b48});
  for(let i=0;i<5;i++)led(-5.46+i*.11,1.50,2.14,i%2?C.green:C.blue);
  for(let i=0;i<8;i++)box(.09,.035,.08,-5.52+i*.14,1.13,2.6,C.dark);
  scale(-5.50,-.20);
  solid(.74,1.56,.58,-6.20,.78,4.30,C.frame);
  for(let i=0;i<4;i++)box(.53,.028,.02,-6.2,.35+i*.35,4.0,C.pale);
  diagram(-4.32,5.75);
  add('weighin','Receival register and weighbridge','civic-ledger',
    'Incoming loads are documented and checked for contamination before acceptance. The town ledger holds simulated goods and municipal collection records.',-2.38,2.30);
  add('scales','Goods-in scale and acceptance log','info',
    'Loads are weighed, categorised and directed to the correct bay. This small depot models a scale and log, not an operable truck weighbridge.',-2.40,.92);
  add('safety','Visitor induction and vehicle separation','info',
    'Marked public walkways are separated from forklifts, unloading zones, conveyors and compactors. Visitors stay out of operating plant areas.',-2.38,4.77);

  // Front-right: reuse before recycling. Test bench, small appliance
  // disassembly/display, covered battery e-waste quarantine and tool storage.
  labelStrip('REUSE / INSPECTION',4.35,5.25);
  solid(1.02,.90,3.10,5.55,.45,2.65,C.wood);
  box(1.07,.075,3.16,5.55,.945,2.65,0xd9d3c4);
  for(let i=0;i<8;i++){
    const z=1.50+(i%4)*.56,x=5.38+Math.floor(i/4)*.42;
    box(.36,.09,.27,x,1.04,z,i%3===0?C.blue:C.frame);
    box(.31,.21,.035,x,1.23,z-.12,0x253d47);
  }
  box(.82,1.09,.10,6.35,2.03,4.10,C.frame);
  for(let i=0;i<10;i++){
    box(.05,.12,.03,5.99+(i%5)*.17,2.30-Math.floor(i/5)*.46,4.18,i%3?C.steel:C.orange);
  }
  solid(.88,1.28,.66,6.15,.64,-.14,C.red);
  box(.76,.35,.017,6.15,1.17,.19,C.pale);
  box(.38,.11,.02,6.15,1.19,.21,C.dark);
  // Model quarantine is separated from ordinary recycling and does not
  // assert that battery acceptance is permitted at a specific NSW site.
  for(const x of [3.80,4.65])crate(x,.65,C.green,2);
  add('repair','Repair and reuse triage bench','info',
    'Usable items are assessed for safe repair or donation before material recovery. Electrical test, data sanitisation and donation approval are separate real-world procedures.',2.40,2.60);
  add('ewaste','Quarantined batteries and e-waste','info',
    'Batteries and e-waste require suitable segregation and approved collection routes. Damaged batteries must not go through ordinary kerbside MRF sorting.',2.40,.60);
  add('tools','Tool shadowboard and safety inspection','info',
    'Workers inspect hand tools and record defects before servicing materials. This is a visual model, not a workplace induction or certified safety plan.',2.40,4.60);

  // Middle-left: enclosed receiving hopper, guarded manually supervised
  // pre-sort conveyor, reject bin and fixed barriers, not a player-operated belt.
  labelStrip('PRE-SORT / CONTAMINATION',-4.45,.05);
  solid(2.65,.34,3.90,-4.75,.48,-3.20,C.steel);
  box(2.55,.055,3.78,-4.75,.68,-3.20,C.dark);
  for(let i=0;i<23;i++)box(2.49,.016,.055,-4.75,.72,-5.04+i*.167,0x8b9b9a);
  for(let i=0;i<16;i++){
    const x=-5.68+(i%4)*.60,z=-4.72+Math.floor(i/4)*.88;
    box(.34,.16,.24,x,.81,z,[C.card,C.paper,C.blue,C.green][i%4]);
  }
  for(const x of [-6.08,-3.43]){
    for(const z of [-4.9,-3.6,-2.3,-1.45])cyl(.045,.045,1.10,x,.56,z,C.gold);
    box(.042,.050,3.48,x,1.08,-3.20,C.gold);
  }
  guard(-4.75,-5.60,2.75);
  crate(-5.88,-.72,C.red,3);
  crate(-3.91,-.72,C.orange,2);
  box(.38,.45,.18,-3.05,1.42,-2.60,C.frame);
  led(-3.05,1.48,-2.49,C.green);
  add('presort','Guarded pre-sort conveyor','info',
    'Trained staff remove contamination before mechanical sorting. Films, bagged recycling and tanglers can jam equipment. The conveyor display cannot be operated by the player.',-2.40,-3.2);
  add('rejects','Contamination and rejected material','info',
    'Soft plastics, batteries, food contamination and tanglers are diverted to appropriate streams. Not everything collected can be recycled.',-2.40,-.92);

  // Middle-right: a compact *illustrative* sorting line, not a real full
  // MRF installed in a shop-sized hall. Magnets pick ferrous metal, optical
  // sorters distinguish materials and eddy-current separation is conceptual.
  labelStrip('MATERIAL SEPARATION',4.50,.05);
  solid(2.80,.40,3.86,4.87,.54,-3.15,C.frame);
  box(2.74,.035,3.68,4.87,.76,-3.15,C.dark);
  for(let i=0;i<18;i++){
    const x=3.72+(i%4)*.73,z=-4.78+Math.floor(i/4)*.82;
    box(.21,.11,.18,x,.87,z,[C.blue,C.paper,C.orange,C.green][i%4]);
  }
  solid(2.88,.45,.55,4.87,1.64,-4.11,C.blue);
  box(2.50,.32,.12,4.87,1.93,-4.11,C.frame);
  for(let i=0;i<6;i++)led(4.20+i*.26,1.91,-4.02,i%2?C.orange:C.green);
  box(.50,1.16,.51,6.24,1.28,-1.77,C.steel);
  box(.38,.37,.021,6.24,1.59,-1.48,0x236378,{e:0x14576d});
  for(let i=0;i<7;i++)box(.24,.10,.14,3.76+i*.32,1.04,-2.08,C.card);
  guard(4.84,-5.59,2.7);
  add('magnet','Ferrous magnet demonstration','info',
    'In larger materials recovery facilities magnets remove steel from mixed recyclables. This short guarded display illustrates the process without running machinery.',2.40,-4.40);
  add('optical','Optical and non-ferrous separation','info',
    'Optical sorting identifies some papers and plastics; eddy-current machines can separate non-ferrous metals. These are illustrative models, not active machines.',2.40,-1.82);

  // Rear-left: segregated bales, shrink-wrap straps, labels, pallets, compact
  // static baler. Rear-right: dispatch pallets and vehicle exclusion area.
  labelStrip('STORAGE / OUTBOUND MATERIALS',0,-11.72);
  const recyclables=Math.max(0,Math.round(Number(site?.stock?.recyclables)||0));
  const scrap=Math.max(0,Math.round(Number(site?.stock?.scrap)||0));
  const outbound=Math.max(0,Math.round(Number(site?.out?.scrap)||0));
  const baleCount=Math.min(12,Math.floor(recyclables/3));
  const bale=(x,z,c)=>{
    solid(.85,.75,.82,x,.375,z,c);
    for(const y of [.20,.64])box(.89,.035,.045,x,y,z+.425,C.steel);
    for(const dx of [-.29,.29])box(.05,.79,.85,x+dx,.39,z,C.steel);
    box(.42,.17,.02,x,.48,z+.435,C.pale);
    box(.29,.04,.022,x,.49,z+.451,C.dark);
  };
  // Initial few pallet platforms are always present; bales reflect actual
  // simulated inventory and can be empty.
  for(let i=0;i<12;i++){
    const x=-5.75+(i%3)*1.10,z=-10.8+Math.floor(i/3)*1.15;
    if(i<baleCount)bale(x,z,[C.card,C.paper,C.blue][i%3]);
    else if(i%3===0){
      for(const dz of [-.32,.32])box(.90,.10,.14,x,.10,z+dz,C.wood);
    }
  }
  // Static guarded horizontal compactor display beyond the visitor railing.
  solid(1.16,1.60,1.25,-4.12,.80,-8.05,C.steel);
  box(.75,.51,.045,-4.12,1.34,-7.40,C.frame);
  for(let i=0;i<4;i++)led(-4.39+i*.18,1.30,-7.37,i===0?C.red:C.green);
  for(const z of [-8.4,-9.7])crate(4.15,z,C.gold,0);
  for(const z of [-8.4,-9.7])crate(5.40,z,C.blue,0);
  solid(.66,1.05,.78,6.16,.525,-10.76,C.frame);
  box(.52,.49,.02,6.16,.70,-10.34,C.pale);
  for(let i=0;i<5;i++)led(5.96+i*.11,.82,-10.322,i%2?C.green:C.orange);
  for(const x of [-5.0,4.8])guard(x,-6.8,2.45);
  add('baler','Cardboard and plastics baler display','info',
    'Clean, sorted paper, cardboard and plastics can be compressed into strapped bales. The baler is guarded, shown idle and cannot be operated from this public gallery.',-2.40,-8.10);
  add('bales','Sorted material bale inventory','info',
    'The model displays '+baleCount+' small stock-based bales from '+recyclables+
    ' simulated recyclable units when you entered. Inventory and materials change with the town clock.',-2.40,-10.50);
  add('dispatch','Dispatch pallets and recovered metal','civic-ledger',
    'Town recycling stock is '+recyclables+' recyclable units, '+scrap+
    ' scrap units awaiting shipment, and '+outbound+
    ' scrap units staged for dispatch. These are simulated snapshots; the live Ledger tracks town industry.',2.40,-9.50);
  add('glass','Glass handling and specialist processing','info',
    'Glass is commonly separated for crushing and further processing offsite. Glass belongs in dedicated containment, not exposed shattered piles on the visitor walkway.',2.40,-7.40);
  add('forklift','Loading bay vehicle exclusion zone','info',
    'Forklifts and heavy trucks require separate routes and controlled loading bays. This interior is a guarded educational annex with no operating forklift traffic.',2.40,-10.75);

  // Visible emergency information and PPE rack kept away from the exit.
  box(1.90,1.01,.055,5.48,2.5,5.75,C.pale);
  for(let i=0;i<6;i++)box(.29,.19,.021,4.75+(i%3)*.58,2.73-Math.floor(i/3)*.36,5.79,
    i%3===0?C.red:i%3===1?C.gold:C.green);
  box(.18,.68,.17,-6.40,1.02,5.1,C.red);
  box(.18,.11,.19,-6.40,1.40,5.1,C.dark);
  text('EXIT / CLEAN WALKWAY',0,3.49,5.75);
  text('AUTHORISED WORKERS ONLY',0,.21,-6.2);

  // Scene-aware hotspot room metadata, never all falsely attributed to lobby.
  const bounds=[
    {x0:-7,x1:-1.36,z0:.30,z1:6},
    {x0:1.36,x1:7,z0:.30,z1:6},
    {x0:-7,x1:-1.36,z0:-6.2,z1:.30},
    {x0:1.36,x1:7,z0:-6.2,z1:.30},
    {x0:-7,x1:7,z0:-12,z1:-6.2}
  ];
  const rooms=RECYCLING_LAYOUT.zones.map((name,i)=>({
    name,...bounds[i],w:bounds[i].x1-bounds[i].x0,d:bounds[i].z1-bounds[i].z0,parent:-1
  }));
  for(let i=0;i<k.interactables.length;i++){
    const it=k.interactables[i],obj=k.sceneObjects[i];
    const room=rooms.findIndex(r=>it.pos.x>=r.x0&&it.pos.x<=r.x1&&it.pos.z>=r.z0&&it.pos.z<=r.z1);
    if(room<0)throw Error('Recycling hotspot outside gallery: '+it.key);
    it.room=room;it.roomName=rooms[room].name;obj.room=room;
  }
  // Inventory comes from the existing economy; this display adds no fake
  // production, economic credits, labour or claimed recycling certifications.
  const snapshot={recyclables,scrap,outbound,bales:baleCount,
    homeKerbside:Number.isFinite(life?.civic?.homes?.recyclables)?
      life.civic.homes.recyclables:null};
  add('town-ledger','Recycling Centre town ledger','civic-ledger',
    'This is a snapshot of '+recyclables+' recyclable units on site and '+
    scrap+' recovered scrap units, with '+outbound+' staged for dispatch. '+
    'Use the Ledger for live town figures. No physical processing is claimed by this exhibit.',-2.40,3.85);
  // The final added hotspot belongs to the receival gallery.
  const last=k.interactables.at(-1),sceneLast=k.sceneObjects.at(-1);
  last.room=0;last.roomName=rooms[0].name;sceneLast.room=0;
  for(const type of ['weigh-in','reuse-bench','e-waste-quarantine','presort-conveyor',
    'magnet-separator','optical-demo','baling','outbound-pallets','material-bays',
    'vehicle-safety-barriers','visitor-route']){
    k.placedProps.push({type,room:0});
  }
  return k.finish({recyclingLayout:true,rooms,
    staff:{pos:RECYCLING_LAYOUT.staff,use:RECYCLING_LAYOUT.staffUse},
    recyclingSnapshot:snapshot});
}
