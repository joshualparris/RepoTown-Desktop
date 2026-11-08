// Research-based physical details for the fictional rural post office.
// Postal retail services, PO-box access, handover and back-of-house handling
// follow common Australian practices; game geometry is NOT surveyed or certified.
export const POST_OPERATIONS = Object.freeze({
 publicRoute: Object.freeze([{x:0,z:4},{x:0,z:1},{x:0,z:-2},{x:0,z:-4.2}]),
 accessibleUse: Object.freeze({x:3.7,z:-4.16}),
 pickupUse: Object.freeze({x:3.15,z:-4.16}),
 boxUse: Object.freeze({x:-5.5,z:-1.0}),
 packingUse: Object.freeze({x:3.35,z:-.45}),
 staffUse: Object.freeze({x:.8,z:-6.7})
});

export function addPostOperationalDetails(k){
 const {box,solid,cyl,text,add,blocker}=k;
 const RED=0xb8413a, STEEL=0xa5b4ba, DARK=0x34444b, CREAM=0xf4f2eb;
 // Intentionally collision-free wayfinding, no queue barrier in the central
 // route; customer queue, packing and PO boxes can all be walked to.
 for(let i=0;i<5;i++){
   box(.08,.008,.67,-1.16,.017,3.7-i*1.52,0x84999b).name='post:queue-floor-dash:'+i;
   box(.08,.008,.67,1.16,.017,3.7-i*1.52,0x84999b);
 }
 box(1.5,.018,.40,0,.025,-3.65,0xc3d9d4).name='post:queue-wait-line';
 for(const z of [-3.55,-1.55,.45,2.45])
   box(.16,.009,.20,0,.022,z,0xb7413a);
 text('QUEUE · please wait',0,.08,-3.62);
 // Low section at the near end of the counter, writing shelf and enquiry
 // pad. The worktop is reachable from public circulation without claiming
 // compliance to any particular counter/access standard.
 box(1.27,.055,.46,3.53,.87,-4.84,STEEL).name='post:low-counter-shelf';
 blocker(1.27,.46,3.53,-4.84); // protruding customer-side shelf
 box(.76,.018,.34,3.55,.915,-4.77,CREAM).name='post:signing-pad';
 box(.12,.08,.08,3.91,.97,-4.8,DARK);
 text('Assisted service',3.5,1.70,-4.82);
 // Scanning, label printer and dispatch workbench are on the STAFF side;
 // no fake public scanning or private mail labels are shown.
 solid(1.85,.80,.78,.65,.40,-9.18,0x79878a);
 box(1.90,.07,.84,.65,.85,-9.18,STEEL).name='post:dispatch-workbench';
 box(.54,.35,.36,.08,1.05,-9.17,DARK).name='post:label-printer';
 box(.31,.04,.29,.08,1.28,-8.98,CREAM);
 box(.45,.23,.28,.95,1.04,-9.23,0x43545c).name='post:barcode-scanner';
 box(.12,.055,.32,.95,1.20,-9.14,0x7ed3af);
 for(let i=0;i<6;i++){
   const x=-.11+(i%3)*.76,z=-10.42+Math.floor(i/3)*.49;
   box(.62,.09,.36,x,.85,z,[0xb84339,0xc3b597,0x7c9aab][i%3]).name='post:outgoing-tray:'+i;
   box(.43,.03,.20,x,.91,z,CREAM);
 }
 // Parcel cage behind counter: open wire lattice, floor kept free around it.
 // The left/right location is in the back-of-house zone, not the front queue.
 for(const x of [3.28,5.38]){
   box(.07,1.95,.06,x,1.13,-8.85,DARK);
   for(const z of [-9.50,-8.20])box(.075,1.95,.06,x,1.13,z,DARK);
 }
 for(const z of [-9.50,-8.20])for(const y of [.35,.80,1.25,1.70])
   box(2.2,.055,.06,4.33,y,z,DARK);
 for(const z of [-9.44,-9.01,-8.58])
   box(.63,.27,.35,4.06,.16,z,0xb99364).name='post:collection-parcel';
 box(1.85,.12,.72,4.33,.13,-8.85,0x8f9794).name='post:parcel-cage-base';
 blocker(2.20,1.30,4.33,-8.85); // the staff-only cage is genuinely solid
 text('SCAN · SORT · HOLD',4.25,2.45,-8.45);
 // Staff safety and inspection realism: compact hand trolley, grounded
 // wheels, fire extinguisher and a clearly separated customer display.
 box(.80,.09,.58,-4.63,.16,-8.72,0x777d76).name='post:mail-trolley-bed';
 blocker(.80,.58,-4.63,-8.72);
 for(const x of [-4.93,-4.33])for(const z of [-8.92,-8.48])
   cyl(.09,.09,.13,x,.075,z,DARK);
 box(.055,1.04,.055,-5.01,.63,-8.88,STEEL);
 box(.79,.045,.05,-4.63,1.12,-8.88,STEEL);
 for(let i=0;i<4;i++)
   box(.33,.36,.20,-4.86+i*.20,.45,-8.77,[0xb4c0c6,0xc6a16c,0xd8d0b3,0xa9b6c3][i]);
 box(.12,.65,.13,5.95,1.25,-6.98,RED).name='post:extinguisher';
 box(.26,.12,.14,5.95,1.62,-6.98,DARK);
 // Retail display by the right wall with shelf stock stacked ABOVE the
 // floor, leaving the walking aisle to the counter and writing bench free.
 box(.38,1.82,2.26,6.45,1.10,.38,STEEL).name='post:stationery-wall-rack';
 blocker(.38,2.26,6.45,.38);
 for(const z of [-.37,.28,.93]){
   box(.40,.055,.58,6.38,.55,z,DARK);
   box(.40,.055,.58,6.38,1.18,z,DARK);
   for(let i=0;i<3;i++){
     box(.22,.38,.08,6.15,1.37,z-.18+i*.18,[CREAM,0xe2cc97,0xd3e0e4][i]);
     box(.21,.21,.26,6.17,.70,z-.18+i*.18,0xd7bc86);
   }
 }
 // Simplified postal workflow information: these hotspots are informational,
 // not fabricated payments, ID checks or tracking events.
 add('assisted','Assisted postal service','info','A lower writing shelf offers a more approachable counter position. Real accessibility and staff assistance depend on the actual premises.',POST_OPERATIONS.accessibleUse.x,POST_OPERATIONS.accessibleUse.z);
 add('collection','Parcel collection','info','A team member checks the collection notification and suitable ID before releasing an item. This fictional model never reveals customer records.',POST_OPERATIONS.pickupUse.x,POST_OPERATIONS.pickupUse.z);
 add('dispatch','Parcel acceptance and sorting','info','Parcel labels and barcodes are checked, weighed and scanned before sorted items move into the secure dispatch area. The handling stages are illustrative, not a live tracking system.',-.25,-7.05);
 add('mail-slot','Street posting box','info','Letters placed in a public posting box are collected and transferred to mail sorting. Posted collection times and prices vary; no real lodgement is recorded.',4.93,4.40);
 add('supplies','Packaging and satchels','info','A rural post office commonly stocks envelopes, flat-rate satchels, mailers and shipping boxes. Packaging sizes and actual availability vary.',5.45,1.45);
}
