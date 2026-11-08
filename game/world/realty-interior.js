import {createKit} from './interior-kit.js';
import {agencyBoard,agencyDisplayText} from './realty-listings.js';

// NSW regional high-street agency, separate from a bank or retail shop.
// Display data is pulled from real town addresses; no fictitious title deed,
// asking price, rental bond or trust-account authorisation is created here.
export const REALTY_LAYOUT=Object.freeze({
  site:'M8',
  zones:[
    'Reception and waiting',
    'Property window displays',
    'Sales and agent workstations',
    'Private client meeting room',
    'Property management and records'
  ],
  staff:{x:-4.75,z:1.25},staffUse:{x:-2.45,z:2.45}
});
export function buildRealtyInterior(site,makeLabel,life=null){
  const k=createKit(site,makeLabel,'Repository Realty agency');
  const {THREE,group,box,solid,cyl,ball,text,add,seat,model}=k;
  const C={wall:0xe8e0d1,cream:0xf2ece1,oak:0xa17c51,wood:0x7c5737,
    teal:0x2b625e,blue:0x397d95,navy:0x273744,brass:0xd1aa65,
    glass:0xb5d5d8,grey:0x8b9a9b,green:0x61876b,white:0xf4f2e9,ink:0x242f35};
  k.shell({wall:C.wall,ceiling:0xf3efe7,floor:0xb6a68d,frontSill:.87,sideSill:1.4});
  group.add(new THREE.HemisphereLight(0xfff3dc,0x6a7b84,1.85));
  // Lightweight hardwood-plank flooring, inviting central accessible
  // circulation route, and distinct private-office carpet zones.
  for(let i=0;i<14;i++)box(.9,.012,17.7,-6.51+i,0.007,-3,i%3===0?0xb39a7a:0xbda887);
  box(2.68,.017,17.35,0,.025,-2.65,0xcbc4b0);
  for(const z of [-8.6,-2.3,2.6])box(2.3,.018,.06,0,.046,z,0x8f8172);
  for(const [x,z,w,d,c] of [[-4.3,2.8,5.0,5.5,0xd2c5af],[4.3,2.8,5.0,5.5,0xd3c4a7],
    [-4.3,-2.7,5.0,5.4,0xb1b5b2],[4.3,-2.7,5.0,5.4,0xa6b3b1],
    [-4.4,-9.0,4.9,5.2,0xb8b6ab],[4.4,-9.0,4.9,5.2,0xb4b0a5]])
    box(w,.016,d,x,.029,z,c);
  // Main entry and interior wayfinding: all text kept inside the room.
  text('REPOSITORY REALTY',0,3.70,5.38,'room');
  text('SALES · RENTALS · PROPERTY MANAGEMENT',0,3.32,5.38,'room');
  text('WELCOME / RECEPTION',-4.48,3.17,4.98,'room');
  text('PROPERTIES & LOCAL AREA',4.45,3.17,4.98,'room');
  text('SALES CONSULTANTS',-4.42,3.13,-.1,'room');
  text('PRIVATE CONSULTATIONS',4.4,3.13,-.1,'room');
  text('LEASES / CONTRACT RECORDS',0,3.23,-11.7,'room');
  for(const z of [4.7,1,-3,-7.7,-10.6])
    for(const x of [-4.5,0,4.5]){
      box(1.50,.09,.34,x,4.22,z,0xb6b8b4);
      box(1.39,.025,.26,x,4.16,z,0xe4f1e8,{e:0x7f8987});
    }
  // Discreet interior shopfront listing frames, warm timber surrounds and
  // address cards. Do not represent unverified home addresses as active sales.
  const cards=agencyBoard(life);
  for(const x of [2.82,4.18,5.54]){
    for(let j=0;j<3;j++){
      const z=4.35-j*1.25;
      box(1.11,1.02,.09,x,1.63,z,C.wood);
      box(1.03,.93,.024,x,1.65,z+.056,C.white);
      box(.92,.43,.028,x,1.91,z+.072,[C.teal,C.blue,C.green][j]);
      box(.80,.085,.032,x,1.47,z+.076,C.ink);
      box(.62,.055,.032,x,1.30,z+.077,C.brass);
      if(cards[j*3+Math.round((x-2.82)/1.36)])
        box(.14,.06,.036,x-.31,1.35,z+.08,C.navy);
    }
  }
  // Public reception with desk, monitor, brochure holder, customer service
  // bell, printer and paper files. Staff position behind counter.
  solid(2.85,1.04,.95,-4.72,.52,2.39,C.wood);
  box(2.96,.065,1.04,-4.72,1.075,2.39,C.cream);
  box(2.9,.40,.05,-4.72,.48,2.89,C.teal);
  box(.76,.52,.08,-5.05,1.47,2.23,C.ink);
  box(.68,.42,.02,-5.05,1.48,2.29,0x367c83,{e:0x174346});
  for(let i=0;i<9;i++)box(.08,.025,.10,-5.5+i*.125,1.11,2.56,C.grey);
  cyl(.09,.075,.10,-4.15,1.14,2.63,C.brass);
  box(.45,.075,.28,-3.93,1.15,2.24,C.grey);
  for(let i=0;i<6;i++)box(.35,.018,.24,-3.91,1.20+i*.018,2.23,C.white);
  solid(.48,.88,.35,-6.40,.44,4.15,C.teal);
  for(let i=0;i<4;i++)box(.42,.18,.09,-6.40,.28+i*.20,4.35,
    [C.brass,C.white,C.green,C.blue][i]);
  // Waiting chairs and magazine table (do not obstruct the walking spine).
  for(const z of [4.10,5.05]){
    seat('reception-chair-'+z,'chair',-3.2,z,Math.PI);
    if(!model('chair_B_wood',-3.2,z,Math.PI,{w:.48,d:.52,h:.86})){
      box(.49,.09,.47,-3.2,.45,z,C.wood);
      box(.49,.47,.065,-3.2,.67,z-.23,C.wood);
      for(const dx of [-.19,.19])for(const dz of [-.18,.18])
        box(.046,.40,.045,-3.2+dx,.22,z+dz,C.ink);
    }
  }
  solid(.65,.49,.52,-4.30,.25,4.66,C.wood);
  box(.76,.04,.60,-4.30,.50,4.66,C.cream);
  for(let i=0;i<4;i++)box(.27,.013,.18,-4.50+i*.10,.55,4.70,
    [C.teal,C.gold||C.brass,C.blue,C.green][i]);

  // Active in-game address directory with no fictional deed or sale.
  const directory=agencyDisplayText(life);
  add('reception','Agency reception and enquiries','info',
    'Ask about a property, inspection, rental application or appraisal. Staff must check a vendor or landlord authority before advertising a real listing.',-2.44,2.45);
  add('directory','Local property address directory','info',directory,2.41,3.60);
  add('sales','Sales display and property appraisal','info',
    directory+' Appraisals are indicative until an owner authorises a listing. No home is automatically for sale.',2.41,1.85);
  add('rental','Rental availability board','info',
    'The agency displays rental stock only after landlord authority, tenancy status, rent and inspection date have been recorded. No unverified vacancy is offered as available.',2.41,4.80);
  add('map','Neighbourhood and local services','info',
    'Market Square is directly across High Street; the bank, post office, school, farms and working businesses are all accessible through this simulated town.',2.42,.73);

  // Sales office with two actual desks, filing, monitors and display boards.
  // Desk footprints sit away from the centre aisle.
  const desk=(x,z)=>{
    solid(1.60,.75,.80,x,.375,z,C.wood);
    box(1.68,.065,.88,x,.79,z,C.cream);
    box(.58,.39,.055,x-.26,1.08,z-.15,C.ink);
    box(.51,.32,.020,x-.26,1.08,z-.113,0x317987,{e:0x17444a});
    box(.41,.020,.20,x+.18,.83,z+.18,C.grey);
    cyl(.08,.08,.12,x+.57,.88,z-.19,C.white);
    box(.21,.04,.10,x+.49,.83,z+.29,C.brass);
    seat('sales-agent-'+x+','+z,'chair',x,z-.77,0);
    box(.48,.085,.48,x,.44,z-.79,C.navy);
    box(.48,.43,.06,x,.66,z-.99,C.navy);
  };
  desk(-4.70,-1.35);
  desk(-4.70,-4.12);
  for(const z of [-2.3,-5.0]){
    seat('sales-client-'+z,'chair',-4.70,z,Math.PI);
    box(.46,.075,.50,-4.70,.44,z,C.oak);
    box(.47,.48,.07,-4.70,.67,z+.21,C.wood);
  }
  box(2.75,1.12,.055,-4.45,2.58,.19,C.cream);
  for(let i=0;i<10;i++){
    const x=-5.50+(i%5)*.54,y=2.80-Math.floor(i/5)*.42;
    box(.37,.27,.020,x,y,.23,[C.teal,C.green,C.blue,C.brass][i%4]);
  }
  add('agents','Meet a sales or leasing consultant','info',
    'An agency representative can discuss inspections and explain the simulated town. Commissions, seller authority, licence supervision and contracts require recorded transactions, not decorative buttons.',-2.43,-1.35);
  add('inspections','Inspection diary and appointment calendar','info',
    'Private inspections require access approval and an available time. Only properties entered in the authoritative town register may appear as confirmed appointments.',-2.43,-3.60);
  add('valuations','Comparable sales and appraisal records','info',
    'An appraisal depends on recent comparable completed sales and property condition. This office does not invent sold prices or claim legal valuations for undocumented transactions.',-2.43,-5.15);

  // Private meeting room with closed-looking but non-colliding glass screen,
  // short sightline walls and an open entry at the corridor.
  for(const z of [-.85,-2.75,-4.68])
    box(.075,2.45,1.24,2.82,1.65,z,C.glass,{a:.28});
  box(.07,2.45,.65,2.82,1.65,-5.31,C.wood);
  box(.07,2.45,.60,2.82,1.65,-.18,C.wood);
  box(3.23,.055,.08,4.83,3.40,-5.52,C.wood);
  // Conference table and client chairs, all away from interaction points.
  solid(1.38,.75,1.68,5.00,.375,-2.83,C.oak);
  box(1.47,.052,1.74,5.00,.79,-2.83,C.cream);
  for(const z of [-1.65,-3.95]){
    seat('meeting-'+z,'chair',5.1,z,Math.PI);
    box(.50,.07,.52,5.1,.45,z,C.teal);
    box(.50,.46,.07,5.1,.65,z-.19,C.navy);
  }
  for(let i=0;i<5;i++)box(.38,.025,.28,4.35+i*.30,.84,-2.67,
    [C.cream,C.green,C.brass,C.white,C.blue][i%5]);
  box(.65,.42,.045,6.54,1.78,-3.48,C.navy);
  box(.54,.30,.01,6.54,1.80,-3.45,C.blue);
  add('meeting','Private sales and rental consultations','info',
    'Meet privately about an offer, tenancy or contract. Customer identity documents, finance and confidential files stay away from public window displays.',2.42,-2.45);
  add('contracts','Agency agreements and disclosure','info',
    'NSW agency work requires appropriate licences and supervision. Sales and tenancy terms must be documented; a deposit or bond is not taken without the correct authority and accounting controls.',2.42,-4.35);

  // Property management at the rear: manager desks, secure files and key
  // cabinets instead of a public transactional trust-account terminal.
  text('PROPERTY MANAGEMENT / FILES',0,3.02,-11.60,'room');
  for(const x of [-5.65,-3.8,3.8,5.65]){
    solid(.92,1.55,.62,x,.775,-9.45,C.wood);
    for(let i=0;i<4;i++){
      box(.74,.07,.42,x,.36+i*.33,-9.45,C.grey);
      box(.16,.095,.03,x-.23,.43+i*.33,-9.09,C.brass);
    }
  }
  solid(2.40,.84,.95,-4.8,.42,-7.30,C.wood);
  box(2.52,.05,1.01,-4.8,.86,-7.30,C.cream);
  box(.78,.51,.07,-5.20,1.18,-7.45,C.ink);
  box(.69,.40,.015,-5.20,1.19,-7.405,C.blue,{e:0x234d50});
  box(.68,.56,.23,5.45,1.24,-7.20,C.wood);
  for(let i=0;i<10;i++){
    box(.045,.17,.06,5.17+(i%5)*.14,1.13+Math.floor(i/5)*.25,-7.06,
      i%3?C.grey:C.brass);
  }
  // Staff kitchenette and utility station in rear right, screened from visitors.
  solid(1.62,.86,.65,5.65,.43,-10.95,C.oak);
  box(1.69,.05,.70,5.65,.88,-10.95,C.cream);
  box(.54,.05,.39,6.05,.91,-10.95,C.grey);
  box(.35,.045,.23,6.04,.94,-10.95,C.navy);
  box(.08,.24,.08,5.80,1.05,-10.72,C.grey);
  box(.34,.30,.27,5.20,1.10,-10.95,C.white);
  solid(.72,.84,.61,3.85,.42,-10.93,0xb4bfc0);
  for(const x of [-5.88,5.92])box(.12,.32,.12,x,.22,-6.5,C.green);
  add('management','Rental management and maintenance requests','info',
    'Managers record authorised repairs, tenancy inspections, arrears follow-up and communications between tenant, owner and trades. No simulated rent is debited without a recorded lease.',-2.43,-7.75);
  add('keys','Secure property keys and access logs','info',
    'Restricted key storage is separate from the public listing window. Only authorised employees can issue keys and record a sign-out.',2.43,-7.40);
  add('records','Tenancy records and privacy','info',
    'Contracts, condition reports, ID checks, privacy and retention records must be secured. The office shows locked records cupboards, not personal information about real people.',2.43,-9.35);
  add('trust','Trust accounting and principal supervision','info',
    'NSW agencies must have a class 1 licensee in charge. Only an authorised licensee in charge may approve trust-account withdrawals. This office has no player-operable trust withdrawal control.',-2.43,-9.40);
  add('kitchen','Staff kitchenette and first-aid point','info',
    'A simple sink, kettle, mugs, small refrigerator, first aid and staff noticeboard provide basic workplace amenity.',2.43,-10.90);
  add('ledger','Town property and finances','civic-ledger',
    'Review actual town finances and public-service information in the Town Ledger. Agency window displays are a property directory until legal title and sale records are implemented.',-2.43,4.58);

  const roomBounds=[
    {x0:-7,x1:-1.36,z0:.3,z1:6},
    {x0:1.36,x1:7,z0:.3,z1:6},
    {x0:-7,x1:-1.36,z0:-6.15,z1:.3},
    {x0:1.36,x1:7,z0:-6.15,z1:.3},
    {x0:-7,x1:7,z0:-12,z1:-6.15}
  ];
  const rooms=REALTY_LAYOUT.zones.map((name,i)=>({
    name,...roomBounds[i],w:roomBounds[i].x1-roomBounds[i].x0,
    d:roomBounds[i].z1-roomBounds[i].z0,parent:-1
  }));
  for(let i=0;i<k.interactables.length;i++){
    const item=k.interactables[i],scene=k.sceneObjects[i],room=
      rooms.findIndex(r=>item.pos.x>=r.x0&&item.pos.x<=r.x1&&item.pos.z>=r.z0&&item.pos.z<=r.z1);
    if(room<0)throw Error('Agency hotspot outside room '+item.key);
    item.room=room;item.roomName=rooms[room].name;scene.room=room;
  }
  for(const type of ['glazed-listing-windows','reception-desk','address-directory','sales-desks',
    'client-meeting-suite','secured-records','key-control','staff-kitchenette'])
    k.placedProps.push({type,room:0});
  return k.finish({realtyLayout:true,rooms,
    staff:{pos:REALTY_LAYOUT.staff,use:REALTY_LAYOUT.staffUse},
    agencyListings:cards});
}
