import * as THREE from 'three';
import { makeSeat } from './seats.js';
import { VISITOR_LAYOUT as L } from './visitor-information-layout.js';

// A small, genuine walkable visitor information room; neither a scaled
// photograph nor the generic 14 x [address redacted] fallback.
export function buildVisitorInformationInterior(site,makeLabel){
 const group=new THREE.Group();group.name='Inside '+site.name;
 const colliders=[],interactables=[],sceneObjects=[],placedProps=[],windows=[],seats=[];
 const mats=new Map(),geos=new Map();
 const mat=(colour,alpha=1)=>{const k=colour+':'+alpha;if(!mats.has(k))mats.set(k,new THREE.MeshLambertMaterial({
  color:colour,transparent:alpha<1,opacity:alpha,depthWrite:alpha===1,side:THREE.DoubleSide}));return mats.get(k)};
 const box=(w,h,d,x,y,z,colour,alpha=1)=>{
  const k=w+':'+h+':'+d;let geo=geos.get(k);if(!geo){geo=new THREE.BoxGeometry(w,h,d);geos.set(k,geo)}
  const m=new THREE.Mesh(geo,mat(colour,alpha));m.position.set(x,y,z);group.add(m);return m;
 };
 const solid=(w,h,d,x,y,z,c)=>{box(w,h,d,x,y,z,c);colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2})};
 const text=(label,x,y,z,kind='room')=>{const l=makeLabel(label,kind);l.position.set(x,y,z);l.userData.labelKind=kind;group.add(l)};
 const add=(key,label,body,x,z,act='info')=>{
  const pos=new THREE.Vector3(x,0,z);interactables.push({
    key:site.id+':'+key,type:'civic',room:0,roomName:'Travel information and local produce',label,pos,
    act:{do:act,title:label,text:body,civicId:site.id}});
  sceneObjects.push({type:'civic',room:0,label,pos:{x,z},interactive:true});
 };
 const C={cream:0xeaddc5,white:0xf3f1e7,wood:0x9d7551,green:0x6c8974,ink:0x263e46,
  tile:0xbc9f84,glass:0xbddde4,steel:0x687984,red:0xb56d56,leaf:0x66875b,
  pale:0xd3e2e5,yellow:0xe9c773};
 // Textured tiled hall floor, pitched-roof impression, visible daylight.
 box(L.w,.18,L.d,0,-.09,2.5,C.tile).name='floor-slab';
 for(let x=-5.5;x<6;x+=1.0)box(.018,.012,L.d-.3,x,.01,2.5,C.wood);
 for(let z=-1.5;z<7;z+=1.0)box(L.w-.3,.012,.016,0,.012,z,C.wood);
 box(L.w,.17,L.d,0,4.1,2.5,C.white).name='ceiling-slab';
 for(const x of [-5.9,5.9]){
  solid(.18,.82,L.d,x,.41,2.5,C.cream);
  box(.05,2.35,6.7,x,1.94,2.5,C.glass,.22);
  for(const z of [-1.75,2.5,6.75])box(.07,2.9,.16,x,1.86,z,C.wood);
 }
 // Rear and front walls are not monolithic blocks; large daylight windows flank a 2.6m door.
 solid(L.w,.84,.19,0,.42,L.rear+.1,C.cream);
 box(L.w,3.08,.17,0,2.39,L.rear+.1,C.cream);
 for(const x of [-3.65,3.65]){
  solid(4.45,.74,.19,x,.37,L.front-.1,C.cream);
  box(4.38,2.60,.05,x,2.02,L.front-.08,C.glass,.23);
  box(4.38,.74,.17,x,3.76,L.front-.1,C.cream);
  box(.09,2.4,.12,x,2.02,L.front+.03,C.wood);
 }
 // 2.6 metre central double glazed entrance, with no collider across the doorway.
 box(2.58,.15,.17,0,3.44,L.front-.1,C.wood);
 box(2.48,2.95,.035,0,1.53,L.front-.06,C.glass,.14);
 box(.085,2.9,.06,0,1.53,L.front+.02,C.wood);
 for(const x of [-.35,.35])box(.035,.4,.09,x,1.52,L.front+.10,C.steel);
 box(2.42,.025,.92,0,.022,6.28,C.ink); // flat recessed-looking entrance mat
 text('Exit to street',0,3.3,6.6);
 // Public reception: low front section for seated visitors, map files,
 // workstation (not an external booking system), phone and paper brochures.
 const counter=L.counter;
 solid(3.65,.83,.66,counter.x,.415,counter.z,C.wood);
 box(3.77,.09,.77,counter.x,.865,counter.z,C.white);
 box(.95,.03,.38,-1.30,.78,counter.z+.06,C.white); // lowered service surface
 box(.67,.43,.085,-3.37,1.25,-.1,C.ink);
 box(.56,.33,.09,-3.37,1.26,-.02,0x8fbdc7);
 box(.33,.08,.26,-3.12,.97,.16,C.steel);
 box(.26,.075,.17,-4.05,.94,.05,C.steel);
 for(const x of [-4,-3.45,-2.9,-2.35])box(.19,.04,.30,x,.95,.45,0xe2ca88);
 text('Local travel advice',-2.75,2.45,-1.54);
 // Travel map display and local guide strip on back wall.
 box(3.6,2.1,.08,.60,2.12,-1.7,C.green);
 box(3.39,1.9,.04,.60,2.10,-1.62,C.white);
 for(let i=0;i<7;i++){
  const x=-.76+(i%4)*.88,z=-1.57;
  box(.55,.34,.035,x,1.55+Math.floor(i/4)*.57,z,[0x669f80,0x8ca8b6,0xc9ae74,0x7b9496][i%4]);
 }
 text('Region map · local villages',.6,3.33,-1.48);
 // Free-standing brochure racks arranged at the left wall with the main aisle unblocked.
 for(const z of [2.12,3.52,4.92]){
  solid(.54,1.7,.76,-5.32,.85,z,C.white);
  for(const y of [.45,.86,1.27,1.60]){
   box(.49,.05,.68,-5.00,y,z,C.wood);
   for(let n=0;n<4;n++)
    box(.035,.29,.14,-4.97,y+.19,z-.21+n*.14,[0x4b91aa,0xbd9265,0x75a16a,0xb17f8b][n]);
  }
 }
 text('Maps · walks · local guides',-4.55,2.4,4.55);
 // Low island for locally made merchandise: hats, regional food and postcards.
 solid(1.20,.74,1.20,L.localProducts.x,.37,L.localProducts.z,C.white);
 box(1.3,.06,1.3,L.localProducts.x,.76,L.localProducts.z,C.wood);
 for(let i=0;i<12;i++){
  const x=-3.23+(i%4)*.29,z=3.27+Math.floor(i/4)*.32;
  box(.14,.28,.12,x,.93,z,[0xb69062,0xa2b37f,0xb87965,0x7198a0][i%4]);
 }
 text('Local makers',-2.8,2.3,3.72);
 // Right-side itinerary station, bench, free Wi-Fi / charge outlet.
 solid(.55,1.22,1.85,5.28,.61,3.0,C.white);
 box(.07,1.42,1.75,4.96,1.50,3.0,C.green);
 text('Things to see and do',4.30,2.65,3.0);
 solid(1.5,.11,.48,3.4,.47,5.0,C.wood);
 box(1.5,.52,.095,3.4,.87,4.79,C.wood);
 for(const x of [2.82,3.98])box(.07,.4,.08,x,.25,5.0,C.steel);
 seats.push(makeSeat(site.id+':visitor:bench','bench',3.4,5.0,Math.PI,{room:0,roomName:'Travel information and local produce'}));
 box(.66,.43,.075,4.65,2.80,5.0,C.green);
 text('Free Wi-Fi · charging',4.2,2.60,5.0);
 box(.38,.54,.38,5.36,.27,5.62,C.ink);
 // Compact coffee/water point, framed as a staffed display (not a claimed running kitchen).
 box(.58,.72,.55,5.27,.36,.40,C.wood);
 box(.48,.34,.40,5.27,.91,.40,C.steel);
 box(.28,.13,.18,5.27,1.12,.54,C.white);
 text('Drinking water',4.40,1.7,.40);
 // Small accessible-toilet inspired room: inward clear opening, no locked
 // fake door. Shower/toilet certifications are deliberately NOT claimed.
 const wc=L.accessibleWC;
 solid(.14,2.80,3.48,2.53,1.40,-.18,C.cream);
 solid(1.03,2.80,.12,3.04,1.4,1.54,C.cream);
 solid(1.01,2.80,.12,5.33,1.4,1.54,C.cream);
 // clear opening x=3.55..4.85 leaves a real passage into the room
 box(1.3,.18,.12,4.20,2.77,1.54,C.wood);
 // Toilet/basin/grab bars sit against perimeter walls, not in the doorway.
 solid(.59,.54,.70,5.14,.28,-1.10,C.white);
 box(.43,.06,.47,5.14,.60,-1.11,C.white);
 box(.48,.62,.11,5.14,.95,-1.68,C.white);
 solid(.54,.19,.46,2.98,.87,-1.12,C.white);
 box(.065,.16,.065,2.98,1.05,-1.30,C.steel);
 box(.045,.70,.05,5.63,1.25,-1.02,C.steel);
 box(.045,.05,.74,5.62,.95,-.80,C.steel);
 text('Accessible WC · illustrative',4.28,2.65,.96);
 // Public noticeboard by the doorway and recycling bin inside the wall zone.
 box(1.35,1.17,.08,5.28,2.17,6.0,C.green);
 for(let n=0;n<4;n++)box(.88,.12,.09,5.28,2.51-n*.27,6.07,[C.white,C.yellow,C.pale,C.white][n]);
 solid(.37,.75,.35,-5.43,.38,6.18,C.green);
 // Warm track lighting, skylight reflection and brighter task lamp at the counter.
 group.add(new THREE.HemisphereLight(0xffffff,0x85775e,2.3));
 for(const x of [-3.6,0,3.6])for(const z of [.2,3.4,5.95]){
  box(.83,.055,.21,x,3.96,z,0xfff1cd);
  const lamp=new THREE.PointLight(0xfff0d7,.40,8);lamp.position.set(x,3.82,z);group.add(lamp);
 }
 // Explore grounded tourist content, but never fabricate actual tickets, room
 // availability or paid orders that the game does not implement.
 add('advice','Talk to visitor information',
  'Ask the visitor officer for suggestions for a weekend, family visit or day trip. This fictional desk offers travel guidance and does not confirm real accommodation or event bookings.',counter.visitorX,counter.visitorZ,'civic-ledger');
 add('map','Explore the region map',
  'Inspiration from the Dubbo region: cultural attractions, local villages, bushwalking, parks and the nearby countryside. Check a current official map before real travel.',.65,.10);
 add('brochures','Browse visitor maps and guides',
  'Pick up information about regional routes, attractions, accessible activities and local stories. The brochures are fictional representations, not current timetables.',-4.21,4.00);
 add('souvenirs','Browse locally made gifts',
  'A rotating selection of local produce, postcards, craft and keepsakes is represented. The game has no real retail stock or checkout connection.',-1.42,3.72);
 add('itinerary','Plan things to do',
  'Ask about museums, food, outdoor experiences, family activities and day trips. Real opening hours and tickets must be confirmed directly with venues.',3.95,2.15);
 add('amenities','Locate visitor amenities',
  'The centre provides a visual example of an accessible toilet, nearby seat, travel charging point and drinking water. Real access compliance and on-site facilities are not certified here.',3.64,.90);
 add('rest','Find seating and Wi-Fi',
  'Take a seat near the window, read the guide or charge your device. These amenities illustrate a small regional tourism centre.',2.1,5.40);
 placedProps.push(...['information-counter','brochure-racks','local-products','maps','traveller-seating','accessible-toilet','drinking-water'].map(type=>({type,room:0})));
 windows.push({axis:'z',at:6.92,s:-5.75,e:-1.55,out:1},{axis:'z',at:6.92,s:1.55,e:5.75,out:1},
  {axis:'x',at:-5.9,s:.1,e:5.9,out:-1},{axis:'x',at:5.9,s:.1,e:5.9,out:1});
 return {group,colliders,interactables,sceneObjects,placedProps,windows,seats,
  visitorInformationLayout:L,rooms:[{name:'Travel information and local produce',x0:-6,x1:6,z0:-2,z1:7,w:12,d:9,parent:-1}],
  doors:[],dynamics:[],sight:[],bounds:{x0:-6,x1:6,z0:-2,z1:7},
  spawn:new THREE.Vector3(0,0,4.75),exitZone:{...L.exit},
  staff:{pos:{x:counter.staffX,z:counter.staffZ},use:{x:counter.visitorX,z:counter.visitorZ}}};
}
