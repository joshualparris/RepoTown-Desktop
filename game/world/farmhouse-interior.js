import * as THREE from 'three';
import { glassMesh } from './windows.js';
import { FLOOR_SURFACE_Y } from './floor-surfaces.js';
import { makeSeat } from './seats.js';

// An occupied, working Central-West NSW family farmhouse, not a retail shop.
// 9 separate zones, a sheltered entrance, flyscreens, kitchen/pantry, mudroom,
// living room, farm office, two bedrooms, family bathroom and working laundry.
// All navigation runs through a broad central hallway with unobstructed doors.
const EDGE=8.8,HALL=1.4,FRONT=6,REAR=-16.5,HEIGHT=4.15,WALL=.18;
const ZONES=[
  {name:'Boot room & mudroom',side:-1,z0:.6,z1:6,floor:0xc6b9a4},
  {name:'Family living room',side:1,z0:.6,z1:6,floor:0x916f50},
  {name:'Country kitchen & dining',side:-1,z0:-5.5,z1:.6,floor:0xc1a883},
  {name:'Farm office',side:1,z0:-5.5,z1:.6,floor:0x936f4e},
  {name:'Main bedroom',side:-1,z0:-11,z1:-5.5,floor:0x9b795c},
  {name:'Children’s bedroom',side:1,z0:-11,z1:-5.5,floor:0xb08b66},
  {name:'Family bathroom',side:-1,z0:REAR,z1:-11,floor:0xd4d0c3},
  {name:'Laundry & linen',side:1,z0:REAR,z1:-11,floor:0xbbbdb0}
];
export const FARMHOUSE_ROOMS=['Entry passage',...ZONES.map(z=>z.name),'Walk-in pantry'];

export function buildFarmhouseInterior(site,makeLabel){
  const group=new THREE.Group();group.name='Farmhouse · occupied home';
  const colliders=[],interactables=[],sceneObjects=[],placedProps=[],dynamics=[],meshes=[],seats=[];
  const byColour=new Map(),materials=new Map();
  const material=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshLambertMaterial({color:c}));return materials.get(c);};
  const box=(w,h,d,x,y,z,color)=>{
    if(!byColour.has(color))byColour.set(color,[]);
    byColour.get(color).push({w,h,d,x,y,z});
  };
  const solid=(w,h,d,x,y,z,color)=>{
    box(w,h,d,x,y,z,color);
    colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});
  };
  const walls=(x0,x1,z0,z1)=>solid(x1-x0,HEIGHT,z1-z0,(x0+x1)/2,HEIGHT/2,(z0+z1)/2,0xeee4d2);
  const sprite=(text,x,z,room=-1)=>{
    const s=makeLabel(text,room===-1?'room':'interactive');
    s.position.set(x,room===-1?3.15:2.25,z);
    s.userData.labelKind=room===-1?'room':'interactive';
    group.add(s);
  };
  const add=(key,label,text,x,z,room,action='info',opts={})=>{
    const pos=new THREE.Vector3(x,0,z);
    interactables.push({key:'farmhouse:'+key,label,room,roomName:FARMHOUSE_ROOMS[room],pos,
      act:{do:action,title:label,text,...opts}});
    sceneObjects.push({type:'farmhouse',label,room,pos:{x,z},interactive:true});
    placedProps.push({type:key,room});
  };
  const flat=(x,z,w,d,color,y=FLOOR_SURFACE_Y.finish)=>box(w,.025,d,x,y,z,color);
  const seat=(key,type,x,z,yaw=Math.PI)=>{
    const zone=ZONES.findIndex(q=>z>=q.z0&&z<=q.z1&&
      (q.side<0?x< -HALL:x>HALL));
    const room=Math.max(0,zone+1);
    const s=makeSeat('farmhouse:seat:'+key,type,x,z,yaw,
      {room,roomName:FARMHOUSE_ROOMS[room]});
    if(s)seats.push(s);
  };
  const chair=(x,z)=>{solid(.65,.75,.62,x,.37,z,0x6d4b32);box(.63,.8,.13,x,1.09,z-.22,0x85613d);seat('chair-'+x+'-'+z,'chair',x,z);};
  const rug=(x,z,w,d,color)=>flat(x,z,w,d,color,FLOOR_SURFACE_Y.rug);
  const shelf=(x,z,w,d,h,color=0x765d42)=>{
    solid(w,h,d,x,h/2,z,color);
    for(let y=.55;y<h;y+=.66)box(w-.10,.07,d+.06,x,y,z,0xad8961);
  };
  const lamp=(key,x,y,z)=>{
    box(.18,1.0,.18,x,y-.5,z,0x77634a);
    const shade=new THREE.Mesh(new THREE.CylinderGeometry(.42,.65,.50,12),new THREE.MeshLambertMaterial({
      color:0xfbe8b8,emissive:0xffc04b,emissiveIntensity:0}));
    shade.position.set(x,y,z);group.add(shade);
    shade.userData.anim={key,type:'glow',always:false,phase:0};
    dynamics.push(shade);
  };
  const panes=[];   // window glass, see src/world/windows.js
  group.add(new THREE.HemisphereLight(0xf9f7e8,0x675c50,2.25));
  // Shared timber floors; tiled wet rooms and a practical concrete-like boot room.
  box(EDGE*2,.20,FRONT-REAR,0,-.11,(FRONT+REAR)/2,0x8b6e52);
  for(const q of ZONES){
    flat(q.side*(EDGE+HALL)/2,(q.z0+q.z1)/2,EDGE-HALL-.15,q.z1-q.z0-.12,q.floor);
  }
  flat(0,(FRONT+REAR)/2,HALL*2-.12,FRONT-REAR-.2,0xa38161);
  // Exposed painted rafters, pale ceiling with suspended pendants.
  box(EDGE*2,.2,FRONT-REAR,0,HEIGHT+.10,(FRONT+REAR)/2,0xeee2c6);
  for(let z=REAR+1.8;z<FRONT;z+=3.8)box(EDGE*2,.17,.30,0,HEIGHT-.03,z,0x866a4e);
  // Outer brick/weatherboard perimeter; entrance has a real gap, so no
  // 'wall teleport' collider across the front doorway.
  walls(-EDGE,EDGE,REAR,REAR+WALL);
  walls(-EDGE,-1.22,FRONT-WALL,FRONT);
  walls(1.22,EDGE,FRONT-WALL,FRONT);
  box(2.5,.26,.27,0,3.0,FRONT,0x785c45);
  for(const side of [-1,1]){
    for(const q of ZONES.filter(q=>q.side===side)){
      const center=(q.z0+q.z1)/2,length=q.z1-q.z0;
      // Wooden sill below windows and upper wall above windows. Full
      // collision plane keeps players inside; a translucent pane gives
      // visual light without pretending there's an accessible exit.
      solid(.18,.98,length,side*EDGE,.49,center,0xd8c1a0);
      box(.18,HEIGHT-2.85,length,side*EDGE,2.85+(HEIGHT-2.85)/2,center,0xeee4d2);
      const paneLen=Math.min(1.85,length-1.1);
      for(const d of [-1,1]){
        const seg=(length-paneLen)/2;
        box(.18,1.87,seg,side*EDGE,1.94,center+d*(paneLen+seg)/2,0xeee4d2);
      }
      panes.push({w:.035,h:1.68,d:paneLen,x:side*(EDGE+.02),y:1.91,z:center});
      box(.10,.10,paneLen+.14,side*(EDGE+.07),1.01,center,0x7f654b);
      box(.10,.10,paneLen+.14,side*(EDGE+.07),2.81,center,0x7f654b);
      box(.11,1.9,.08,side*(EDGE+.08),1.94,center,0x7f654b);
      // Collision is independent of the visible open glass.
      colliders.push({x0:side*EDGE-.12,x1:side*EDGE+.12,z0:q.z0,z1:q.z1});
    }
  }
  // Half-height side zones separated by real partition walls. Doorways
  // are 1.9m wide in the central passage, enough for player radius .35.
  for(const q of ZONES){
    const cx=q.side*HALL,zDoor=(q.z0+q.z1)/2,opening=.98;
    walls(cx-WALL/2,cx+WALL/2,q.z0,zDoor-opening);
    walls(cx-WALL/2,cx+WALL/2,zDoor+opening,q.z1);
    box(.23,.18,1.95,cx,2.65,zDoor,0x785d41);
    // Open wooden door leaf and architrave do not obstruct circulation.
    box(.10,2.55,.13,cx,1.28,zDoor-opening,0x8e7152);
    const xDoor=q.side*(HALL+1.65);
    sprite(q.name,xDoor,zDoor,-1);
  }
  // Room-to-room partitions on either side. Keep the corridor unbroken.
  for(const z of [.6,-5.5,-11]) {
    walls(-EDGE,-HALL,z-WALL/2,z+WALL/2);
    walls(HALL,EDGE,z-WALL/2,z+WALL/2);
  }
  // Floorboards, runner rugs, family photo frames, hall telephone and
  // flyscreen (hinged visually open so it cannot trap the player).
  for(let z=REAR+1;z<FRONT-1;z+=2.4)rug(0,z,1.7,1.72,0x89684c);
  box(.06,1.5,1.1,-1.26,2.45,2.4,0x80664d);
  box(.05,1.17,.90,-1.2,2.46,2.4,0xb7b9a0);
  add('family-notices','Read the family and farm noticeboard',
    'Jobs this week: check fences, order fencing wire, collect feed, ring the mechanic and prepare Sunday lunch. School notes and a family birthday card are pinned beside the jobs list.',
    0,2.4,0);
  // A broad timber verandah, with posts and corrugated-iron-coloured awning.
  // It is an architectural view at the entrance; the live town remains outside.
  box(EDGE*2+.4,.17,2.3,0,3.8,FRONT+1.15,0x6c777c);
  box(EDGE*2+.4,.13,2.3,0,-.02,FRONT+1.15,0x997653);
  for(const x of [-8.1,-4.2,4.2,8.1])box(.19,3.7,.19,x,1.84,FRONT+2.05,0x806046);

  // BOOT ROOM: dirty-to-clean workflow, farming boots, raincoats, hats.
  solid(2.4,.47,.62,-6.25,.25,3.3,0x785b3e); // bench
  for(const x of [-6.85,-5.65])seat('mudroom-'+x,'bench',x,3.3);
  for(const x of [-7.3,-6.5,-5.7]) {
    box(.42,.48,.72,x,.23,1.34,0x414c38); // gumboots
    box(.48,.08,.55,x,.50,1.43,0x353b33);
  }
  for(const x of [-7.8,-6.9,-6]){
    box(.07,.80,.07,x,2.4,5.40,0x6a5946); // wall hooks
    box(.55,1.10,.18,x,1.75,5.30,x===-6.9?0xa39b67:0x4a664b);
  }
  box(1.0,.40,.7,-3.45,.86,1.55,0xd0d3c2); // utility sink
  box(.05,.30,.07,-3.45,1.16,1.55,0x878d85);
  box(1.0,.25,1.0,-4.1,.12,5,0x755b40); // dog water station
  add('mudroom-boots','Put on gumboots',
    'The family leaves muddy boots on this rack before going further indoors. Take a pair of gumboots for paddock work. Sun hats, wet-weather coats, dog leads and a torch hang above the bench.',
    -4.2,3.20,1);
  add('mudroom-sink','Wash up after farm work',
    'A deep utility sink is for scrubbing soil off hands and rinsing dusty equipment. Work clothes go straight into the laundry rather than across the carpet.',
    -3.8,1.20,1);

  // LIVING ROOM: sofas, rug, books, old combustion fireplace, radio.
  rug(5.30,3.20,4.8,3.15,0x87745f);
  solid(2.9,.82,.88,5.35,.42,2.12,0x6e766b);
  for(const x of [4.45,5.35,6.25])seat('living-sofa-'+x,'sofa',x,2.12,Math.PI);
  box(2.76,.70,.22,5.35,1.12,1.83,0x7d877a);
  solid(1.3,.47,.75,5.20,.24,3.65,0x816243);
  for(const z of [1.0,5.45])shelf(8.15,z,.55,.8,2.4,0x71583d);
  solid(1.35,1.45,.58,3.05,.74,1.55,0x534b42); // wood stove
  box(.93,.72,.06,3.05,.95,1.88,0x26282b);
  const fire=new THREE.Mesh(new THREE.BoxGeometry(.75,.52,.045),
    new THREE.MeshLambertMaterial({color:0xff742a,emissive:0xff4218,emissiveIntensity:0}));
  fire.position.set(3.05,.95,1.92);
  fire.userData.anim={type:'glow',key:'farmhouse:fireplace',phase:1};
  dynamics.push(fire);group.add(fire);
  box(.15,2.35,.15,2.75,2.80,1.28,0x6f6454); // stovepipe
  lamp('farmhouse:lamplight',7.6,2.35,2.6);
  box(1.0,.28,.65,7.75,.15,4.7,0x7f5a3a); // dog basket
  add('fireplace','Light the slow-combustion wood heater',
    'A small wood-burning heater warms the sitting room on cold winter evenings. Keep the flue clear, use seasoned timber and never leave the fire unattended.',
    3.65,2.0,2,'toggle',{on:'The fire catches. Warm light flickers through the stove glass.',
                               off:'The wood heater is left unlit.'});
  add('lamplight','Turn on the reading light',
    'A warm table lamp is useful for reading while the rest of the house is winding down.',
    7.05,3.0,2,'toggle',{on:'The reading lamp glows softly.',off:'The reading lamp switches off.'});
  add('living-books','Browse the family bookshelf',
    'Dog-eared novels, local history, a first-aid book, children’s stories, seed catalogues and a worn atlas are tucked beside the radio.',
    6.6,5.2,2);

  // COUNTRY KITCHEN/DINING: table, chairs, stove, sink, fridge.
  rug(-4.1,-1.45,3.3,2.4,0xb8a88b);
  solid(2.1,.73,1.15,-4.20,.76/2,-1.4,0x8b643f);
  for(const x of [-5.30,-3.10])chair(x,-1.43);
  for(const z of [-2.35,-.5])chair(-4.2,z);
  solid(1.58,.88,.70,-3.6,.44,-4.90,0xd1b9a0); // stove
  box(1.48,.13,.74,-3.6,.95,-4.90,0x535353);
  for(const x of [-4.05,-3.15])for(const z of [-5.10,-4.72])box(.25,.03,.25,x,1.04,z,0x353638);
  solid(.83,1.93,.84,-2.20,.97,-4.83,0xe6e0d2); // fridge
  solid(2.2,.88,.63,-5.20,.44,.0,0x7e735f); // sink bench
  box(.85,.1,.43,-5.48,.93,.0,0xa1a4a3);
  box(.05,.45,.05,-5.50,1.18,.0,0x8e958f);
  solid(1.1,1.6,.43,-2.05,2.45,-3.25,0x987552); // cupboard
  box(.8,.20,.55,-4.5,.12,-4.4,0x8b6b4d); // pet bowl
  const kettle=new THREE.Mesh(new THREE.CylinderGeometry(.24,.30,.37,12),
    new THREE.MeshLambertMaterial({color:0xabb6ad}));
  kettle.position.set(-3.8,1.17,-4.78);group.add(kettle);
  const steam=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),
    new THREE.MeshLambertMaterial({color:0xe0e5e3,transparent:true,opacity:.67}));
  steam.position.set(-3.8,1.6,-4.78);
  steam.userData.anim={type:'bob',key:'farmhouse:kettle',always:false,
    base:{x:-3.8,y:1.6,z:-4.78},phase:1,amount:.23};
  dynamics.push(steam);group.add(steam);
  add('kettle','Boil the kettle',
    'A jug boils for tea while someone checks the weather. The morning starts early when there are animals to feed and gates to open.',
    -3.20,-3.7,3,'toggle',{on:'The kettle begins to steam.',off:'The kettle goes quiet.'});
  add('dining-table','Set the family dining table',
    'A solid timber table gets used for breakfast, paperwork, homework and evening meals. Mismatched mugs, placemats and chairs make it a working family space.',
    -3.1,-.6,3,'toggle',{on:'Plates and cups are set for the next family meal.',off:'The table is cleared after lunch.'});
  add('sink','Wash dishes at the kitchen sink',
    'Hot running water, a draining rack and tea towels sit under the kitchen window. There are vegetable scraps ready for compost.',
    -4.6,-.12,3);
  // Pantry off the kitchen: a real separated space accessed from the
  // rear of the kitchen. Open the plan to keep the aisle navigable.
  const pantry={name:'Walk-in pantry',x0:-8.63,x1:-6.10,z0:-5.50,z1:-1.45};
  // Short dividing wall at x -6.1; 1.4-metre doorway opening around z -3.
  walls(-6.18,-6.02,-5.5,-3.85);
  walls(-6.18,-6.02,-2.45,-1.45);
  for(const z of [-5.00,-3.8,-2.3]){
    shelf(-8.05,z,.62,.85,1.55,0x66543e);
    for(const y of [.58,1.05,1.55]) {
      box(.17,.25,.17,-7.71,y,z,0xb58d55); // jam/preserves
      box(.22,.35,.20,-8.10,y,z-.2,0x8a7e53); // flour, tea tins
    }
  }
  add('pantry','Inspect the walk-in pantry',
    'Shelves hold flour, tea, rice, rolled oats, preserves, oil, spare tins and jars of home-made chutney. Feed chemicals and fuel are not stored in the family pantry.',
    -6.87,-3.20,9);
  sprite('Walk-in pantry',-7.12,-2.07,-1);

  // FARM OFFICE: on-farm work, not a shop register.
  solid(2.35,.81,1.03,5.3,.405,-4.35,0x75573f);
  box(1.0,.55,.08,5.3,1.15,-4.85,0x282d2c); // monitor
  box(.69,.045,.31,5.3,.85,-4.05,0x8a8880); // keyboard
  chair(5.4,-2.95);
  shelf(8.13,-3.5,.55,1.90,2.5);
  box(1.40,.70,.08,4.0,2.35,.55,0x5b5445); // farm map frame
  box(1.26,.59,.03,4.0,2.35,.60,0xc8d0be);
  for(const x of [3.75,4.1,4.43])box(.10,.35,.03,x,2.32,.64,0x6a8d6f);
  box(.46,.12,.32,6.35,.89,-4.15,0x373f42); // handheld UHF radio
  for(const x of [2.5,2.9,3.3])box(.15,.38,.31,x,1.23,-4.75,0x9d8d6b); // invoices
  add('farm-diary','Read the farm work diary',
    'Today’s checklist: check water troughs, inspect fence lines, contact the stock agent, fuel the ute, follow up the machinery service and organise feed deliveries.',
    5.05,-3.1,4);
  add('farm-radio','Use the UHF farm radio',
    'A UHF radio helps coordinate workers around the property. This is a simulated farm scene: no actual radio transmission is made.',
    6.45,-3.7,4,'toggle',{on:'The UHF radio switches on with a burst of static.',off:'The radio is switched off.'});
  add('weather','Check the weather and rainfall notes',
    'The farm office tracks rainfall, soil moisture, paddock movements and weather forecasts to plan work. These are fictional in-game notes, not a live weather forecast.',
    4.25,.10,4);

  // MAIN BEDROOM: lived-in, family laundry on a chair, framed photo.
  rug(-5.16,-8.15,3.5,3.8,0xaaa08c);
  solid(2.35,.54,2.1,-5.15,.32,-8.05,0x9b907e);
  box(2.35,.66,.18,-5.15,.78,-9.10,0x765c4b);
  for(const x of [-6.13,-4.17]){
    box(.94,.13,.36,x,.66,-7.37,0xdcd5c5); // pillows
    solid(.56,.6,.5,x+Math.sign(x+5.15)*1.18,.32,-8.6,0x6f593f);
  }
  solid(1.33,2.4,.58,-8.05,1.2,-7.5,0x7b6143); // wardrobe
  box(.06,.05,.05,-7.32,1.3,-7.6,0xcebd7b);
  add('bedroom-photo','Look at family photos',
    'A framed family photo, a wedding picture and an old black-and-white farm portrait sit on the bedside chest. This room is private and lived in, not a showroom.',
    -3.0,-8.4,5);
  add('bedroom-wardrobe','Open the bedroom wardrobe',
    'Everyday clothes, boots for going into town and spare blankets are packed next to a suitcase. The bedroom is a private retreat after long work days.',
    -6.95,-7.1,5);

  // CHILDREN’S ROOM: bed, a desk, toys and books.
  rug(5.40,-8.35,4.1,2.9,0xac967a);
  solid(1.27,.50,2.12,6.78,.28,-8.18,0x92a99c);
  box(1.26,.52,.13,6.78,.72,-9.20,0x79583e);
  box(.88,.17,.37,6.74,.62,-7.45,0xe3e0ce);
  solid(1.18,.71,.60,3.16,.38,-9.5,0x987150); // homework desk
  chair(3.12,-8.56);
  shelf(8.11,-6.25,.55,.91,1.64,0x896946);
  for(const x of [4.48,4.85,5.22])box(.35,.35,.35,x,.23,-7.03,[0xbe7a48,0x82a3b5,0xa8a65b][Math.round((x-4.48)/.37)]);
  add('kids-room','Look around the children’s bedroom',
    'Schoolbooks, artwork, a favourite stuffed animal, dusty boots and a small reading lamp are mixed among neatly stacked clothes. Children’s rooms are made for living in.',
    4.3,-8.3,6);
  add('homework','Look at homework and drawings',
    'The desk has a workbook, coloured pencils and a hand-drawn picture of the farm animals, alongside notes from school.',
    3.05,-8.2,6);

  // BATHROOM: practical family bath and shower with actual fixtures.
  flat(-5,-13.9,6.9,4.6,0xc6d1d1,FLOOR_SURFACE_Y.wetTile);
  solid(1.0,.83,.78,-3.02,.41,-11.95,0xe3e2d8); // vanity
  box(1.15,1.02,.04,-3.02,2.10,-11.95,0x86aeb3); // mirror
  solid(1.72,.58,.98,-6.13,.32,-14.6,0xd9ddd8); // bath
  solid(.72,.58,.67,-7.57,.29,-11.88,0xe6e5df); // toilet
  box(.75,.31,.58,-7.57,.73,-12.10,0xf5f0e7);
  box(.10,1.95,.08,-7.45,1.70,-14.9,0x9fa49d); // shower plumbing
  box(.89,.055,.90,-7.40,2.65,-14.90,0xbfc8c7);
  add('bathroom-sink','Wash your hands',
    'The bathroom has a basin, mirror, bath, shower and toilet. Towels hang to dry. Keep the floor clear so wet work boots do not track mud in.',
    -3.15,-11.2,7);
  add('bath','Check the family bathroom',
    'A proper bathroom with hot water, a bath for the kids and a separate shower is important for a working family.',
    -5.0,-14.15,7);

  // LAUNDRY: washer, deep sink, linen, clothes, utility products.
  solid(1.0,.88,.95,7.42,.44,-14.80,0xe4e1d6); // washer
  box(.6,.6,.035,7.42,.50,-14.305,0x7f999f); // washer door
  solid(1.0,.93,.86,5.97,.47,-14.86,0xc9c9bf); // dryer
  solid(1.55,.88,.75,3.35,.44,-14.77,0xa7a99f); // laundry sink
  box(1.15,.16,.44,3.35,.91,-14.77,0xcfd3cf);
  shelf(8.08,-12.05,.55,1.2,2.2,0x8f8065); // linen
  box(.75,.45,.65,3.18,.23,-12.2,0xa68e70); // laundry basket
  box(1.8,.045,.55,5.15,.92,-11.95,0xb7ada5); // ironing board
  add('washer','Start the washing machine',
    'Muddy work shirts and jeans go in separately from bedding. A real farmhouse laundry is busy after paddock work, sport and school.',
    6.45,-14.05,8,'toggle',{on:'The washing machine starts its cycle.',off:'The machine is switched off.'});
  add('laundry-sink','Rinse farm clothes',
    'A deep trough handles dirty clothes, dog towels and equipment that should never be washed in the kitchen sink.',
    3.30,-13.55,8);

  // Details that keep it human: rugs, framed art, rainwater tank reference,
  // a landline, household bills, sewing basket, tea towels and clocks.
  box(.86,.66,.055,1.65,2.65,5.23,0x796348); // wall landscape
  box(.75,.55,.03,1.65,2.65,5.27,0xa8aa80);
  box(.35,.35,.25,1.27,1.6,-.5,0xd9d2c7); // old landline
  box(.10,.58,.10,0,.33,-13.5,0x987c56); // corridor umbrella stand
  lamp('farmhouse:kitchen-light',-3.8,3.6,-2.7);
  add('kitchen-light','Switch the kitchen light',
    'A warm overhead light helps with early breakfasts before sunrise.',
    -3.15,-2.9,3,'toggle',{on:'The kitchen light illuminates the table.',off:'The kitchen light goes out.'});

  // Batch static furniture by colour: only ~30 draw calls rather than
  // hundreds of meshes, to keep phone GPU load reasonable.
  const unit=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4();
  for(const [colour,entries] of byColour){
    const mesh=new THREE.InstancedMesh(unit,material(colour),entries.length);
    entries.forEach((e,i)=>{
      matrix.makeScale(e.w,e.h,e.d);
      matrix.setPosition(e.x,e.y,e.z);
      mesh.setMatrixAt(i,matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    group.add(mesh);meshes.push(mesh);
  }
  group.userData.staticBatches=meshes.length;
  // The first room must have z1=FRONT; main.js uses it to detect the exit.
  const rooms=[{name:FARMHOUSE_ROOMS[0],x0:-HALL,x1:HALL,z0:REAR,z1:FRONT},
    ...ZONES.map(q=>({name:q.name,x0:q.side<0?-EDGE:HALL,x1:q.side<0?-HALL:EDGE,z0:q.z0,z1:q.z1})),
    {...pantry,name:'Walk-in pantry'}];
  group.add(glassMesh(panes));
  return {group,colliders,interactables,seats,sceneObjects,placedProps,rooms,
    doors:[],dynamics,sight:[],people:[],
    bounds:{x0:-EDGE,x1:EDGE,z0:REAR,z1:FRONT},
    spawn:new THREE.Vector3(0,0,FRONT-2.4),
    exitZone:{x0:-1.05,x1:1.05,z0:FRONT-.1,z1:FRONT+1.2}};
}
