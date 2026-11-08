import * as THREE from 'three';
import {makeSeat} from './seats.js';
import {containLabel} from '../ui/labels.js';
import {AGED_CARE as L} from './aged-care-layout.js';

// Small-household *illustration* on the P7-N infill lot, not a certified RACF.
// Every partition, bed and cabinet is drawn in the same reference frame as its collider;
// there are actual gaps into the bedrooms and an unobstructed central/front exit route.
export function buildAgedCareInterior(site,makeLabel){
 const group=new THREE.Group(); group.name='Inside '+site.name;
 const colliders=[],interactables=[],sceneObjects=[],placedProps=[],windows=[],seats=[];
 const materials=new Map(),geos=new Map();
 const C={wall:0xeadfcd,ceiling:0xf6f0e5,floor:0xc9b79e,wood:0x9a7654,teal:0x668c81,
  pale:0xe0e8df,blue:0x89a7b2,bed:0xf2f1e9,ink:0x3c4c50,steel:0x87928d,
  plant:0x668953,stone:0xb3b2aa,cream:0xfff0d2,brick:0xc8a38e};
 const mat=(c,a=1)=>{const k=c+':'+a;if(!materials.has(k))materials.set(k,new THREE.MeshLambertMaterial({
  color:c,transparent:a<1,opacity:a,depthWrite:a===1,side:THREE.DoubleSide}));return materials.get(k)};
 const box=(w,h,d,x,y,z,c,a=1)=>{
  const key=w+':'+h+':'+d;let g=geos.get(key);if(!g){g=new THREE.BoxGeometry(w,h,d);geos.set(key,g)}
  const m=new THREE.Mesh(g,mat(c,a));m.position.set(x,y,z);group.add(m);return m;
 };
 const solid=(w,h,d,x,y,z,c)=>{box(w,h,d,x,y,z,c);colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2})};
 const text=(value,x,y,z,kind='room')=>{const label=makeLabel(value,kind);label.position.set(x,y,z);
  label.userData.labelKind=kind;containLabel(label,{x0:-6.5,x1:6.5,z0:L.rear,z1:L.front,y0:0,y1:4.5});group.add(label)};
 const add=(id,title,body,x,z)=>{interactables.push({key:site.id+':'+id,type:'civic',room:0,
  roomName:'Seniors and aged care',label:title,pos:new THREE.Vector3(x,0,z),
  act:{do:'info',title,text:body,civicId:site.id}});
  sceneObjects.push({type:'civic',room:0,label:title,pos:{x,z},interactive:true})};
 const seat=(id,type,x,z,yaw)=>seats.push(makeSeat(site.id+':seat:'+id,type,x,z,yaw,
   {room:0,roomName:'Small household'}));
 // Floor, ceiling and outside enclosure. The door is truly unobstructed at x=-1.4..1.4.
 box(L.w,.18,L.d,0,-.09,L.centre,C.floor).name='floor-slab';
 box(L.w,.20,L.d,0,4.45,L.centre,C.ceiling).name='ceiling-slab';
 solid(L.w,.88,.18,0,.44,L.rear,C.wall);box(L.w,1.13,.18,0,3.87,L.rear,C.wall);
 box(L.w,.10,.18,0,2.96,L.rear,C.wood);
 for(const x of [-6.4,6.4]){
  solid(.18,.92,L.d,x,.46,L.centre,C.wall);
  box(.18,1.18,L.d,x,3.86,L.centre,C.wall);
  for(const z of [-2.25,1.15,4.4]){
   box(.06,2.70,2.35,x,2.03,z,C.blue,.34);
   box(.12,.10,2.36,x,1.01,z,C.wood);
   box(.10,.10,2.36,x,2.95,z,C.wood);
   windows.push({axis:'x',at:x,s:z-1.17,e:z+1.17,out:Math.sign(x)});
  }
 }
 // Front window bays plus a single central 2.8 m doorway.
 for(const x of [-4.72,4.72]){
  solid(3.48,.85,.18,x,.425,6.96,C.wall);
  box(3.48,.90,.18,x,4.00,6.96,C.wall);
  box(3.38,2.28,.06,x,2.03,6.97,C.blue,.27);
  box(.08,2.3,.10,x,2.03,7.04,C.wood);
  windows.push({axis:'z',at:6.96,s:x-1.70,e:x+1.70,out:1});
 }
 for(const x of [-1.64,1.64])solid(.26,4.4,.18,x,2.2,6.96,C.wall);
 box(2.95,.55,.18,0,4.12,6.96,C.wall);
 box(2.63,3.0,.035,0,1.52,6.99,C.blue,.12); // transparent automatic door, no collider
 box(.06,2.9,.08,0,1.52,7.06,C.wood);
 box(2.45,.025,.78,0,.023,6.42,C.ink); // non-trip entry mat
 text('Welcome · Seniors and aged care',0,3.52,6.15,'room');
 text('Exit to street',0,3.04,6.67);
 // Two clear resident-bedroom entries; the central corridor stays empty.
 for(const s of [-1,1]){
  const x=s*1.40;
  solid(.12,2.95,1.75,x,1.475,-3.12,C.wall);
  solid(.12,2.95,1.78,x,1.475,.11,C.wall);
  box(.15,.13,1.38,x,2.85,-1.56,C.wood); // overhead jamb
  box(.06,.90,4.85,s*1.23,1.04,-1.52,C.wood); // corridor handrail, low
  box(.04,.30,.09,s*1.34,1.15,-.96,C.steel); // door pull
 }
 // Bedrooms' front boundary separates private bedrooms from busy shared living.
 for(const x of [-3.9,3.9])solid(5.02,2.95,.13,x,1.475,1.05,C.wall);
 // Privacy ensuites located in both bedroom corners. Entry gaps are real.
 for(const s of [-1,1]){
  const outer=s*6.34;
  const bx=s*3.45;
  // resident bed / mattress / sheets / pillow and room lamp
  solid(1.34,.48,2.18,bx,.24,-1.34,C.wood);
  box(1.28,.24,2.05,bx,.61,-1.34,C.bed);
  box(1.22,.06,.48,bx,.76,-2.08,C.cream);
  box(1.15,.075,.90,bx,.77,-.65,s===-1?0xc3d1be:0xbad3cc);
  solid(.44,.57,.50,bx+s*1.04,.285,-1.93,C.wood);
  box(.24,.03,.17,bx+s*1.04,.61,-1.93,C.cream);
  // visible wall mounted nurse-call bell next to bed and identity artwork.
  box(.12,.18,.05,s*1.54,1.0,-1.08,0xcf7765);
  box(1.00,.65,.06,s*6.12,2.10,-.15,C.wood);
  box(.80,.46,.07,s*6.05,2.12,-.15,C.plant);
  // 1.72 x 1.65 m illustrative ensuite in rear outer corner; no door across access.
  const divider=s*4.76;
  solid(.11,2.75,1.30,divider,1.375,-3.31,C.wall);
  solid(.72,2.75,.11,s*5.98,1.375,-2.55,C.wall);
  // no solid wall covering the narrow ensuite entry near (s*4.76,-2.2)
  solid(.51,.47,.54,s*5.75,.235,-3.50,C.bed);
  box(.45,.08,.48,s*5.75,.51,-3.50,C.bed);
  box(.09,.48,.06,s*6.18,1.15,-3.50,C.steel);
  box(.50,.10,.30,s*5.08,.87,-3.48,C.bed);
  box(.05,.43,.05,s*5.08,1.11,-3.46,C.steel);
  text('Bedroom '+(s<0?'1':'2')+' · ensuite',bx,2.55,-3.78);
 }
 // Lounge and activities on left, domestic dining and servery on right.
 box(2.20,.05,2.10,-4.00,.03,3.75,C.teal);
 for(const z of [2.60,5.02]){
  solid(1.40,.34,.58,-4.18,.39,z,C.wood);
  box(1.42,.66,.10,-4.18,.85,z-.22,C.teal);
  seat('lounge-'+z,'sofa',-4.18,z,0);
 }
 solid(.85,.41,.75,-2.82,.20,3.85,C.wood);
 box(1.48,.10,.45,-5.77,1.1,2.85,C.wood);
 for(const x of [-5.2,-4.5,-3.8])box(.28,.32,.10,x,1.3,2.85,[C.blue,C.cream,C.teal][Math.round((x+5.2)/.7)]);
 text('Living · music · activities',-4.2,2.9,3.25);
 // Dining table deliberately leaves centre passage and side approach clear.
 solid(1.48,.07,1.60,4.0,.76,4.34,C.wood);
 for(const x of [2.88,5.12]){
  box(.46,.08,.46,x,.45,4.32,C.teal);
  box(.45,.50,.06,x,.72,4.08,C.wood);
  seat('dine-'+x,'chair',x,4.32,x>4?Math.PI/2:-Math.PI/2);
 }
 // Kitchenette against external wall; storage and sink are illustrative, not a working food-service plant.
 solid(.70,.85,1.95,5.90,.425,2.48,C.wood);
 box(.66,.07,1.90,5.90,.89,2.48,C.stone);
 box(.38,.03,.38,5.88,.93,1.95,C.steel);
 box(.035,.27,.035,5.88,1.10,1.95,C.steel);
 solid(.66,1.30,.68,5.89,.65,1.04,C.pale);
 text('Dining · drinks · kitchen',4.04,2.9,2.63);
 // Visitor reception / staff handover and clinical storage on front-mid wall.
 solid(1.75,.83,.58,-2.55,.415,1.92,C.wood);
 box(1.80,.09,.65,-2.55,.87,1.92,C.cream);
 box(.35,.31,.08,-2.70,1.20,1.80,C.ink);
 box(.27,.20,.03,-2.70,1.23,1.85,C.blue);
 text('Reception / care staff',-2.9,2.12,1.44,'interactive');
 // Secure medicine cabinet and dedicated clean/soiled equipment cupboards at corridor dead end.
 for(const [x,color] of [[-.83,C.pale],[0,C.wood],[.83,C.stone]]){
  solid(.65,1.45,.58,x,.725,-3.54,color);
  box(.16,.04,.03,x,1.08,-3.23,C.steel);
 }
 text('Clean | locked medicines | soiled',0,2.05,-3.25,'room');
 // Hand hygiene by staff station, discrete mobility-aid parking, and visual wayfinding.
 box(.41,.11,.37,-1.95,.84,1.40,C.bed);
 box(.07,.26,.05,-1.96,1.03,1.40,C.steel);
 for(const x of [-5.9,-5.3]){
  box(.055,.84,.06,x,.44,1.55,C.iron||C.steel);
 }
 for(const [x,z] of [[-3.3,2.28],[3.2,2.23],[-3.5,-.18],[3.5,-.18]]){
  box(.63,.08,.34,x,4.22,z,C.cream);
  const lamp=new THREE.PointLight(0xffedd0,.46,7);lamp.position.set(x,3.97,z);group.add(lamp);
 }
 group.add(new THREE.HemisphereLight(0xfffaf1,0x91836c,2.25));
 add('welcome','Meet the care team','This is a fictional small-household model of residential aged care. A real home includes staffing, safe medicines systems and regulated care; visiting this desk is not a real booking or clinical consultation.',-1.0,2.36);
 add('bedrooms','Visit resident bedrooms','Private sleeping spaces with beds, bedside belongings and illustrative ensuites. The two sample rooms are not proof of full aged-care facility capacity or accessibility certification.',0,-1.05);
 add('activities','Explore the residents lounge','A small, homelike lounge for conversation, games, music and time with family, rather than a commercial hospital waiting room.',-2.13,2.83);
 add('dining','See the communal dining space','Residents share meals with support for individual choice, food safety and dignity. Actual meal preparation and dietetics are not simulated.',2.2,3.50);
 add('handover','See care staff handover','Care notes, clinical handover, medicine security, infection control and escalation are important to real registered-nurse practice. This exhibit is educational, not a clinical system.',.90,-2.65);
 add('gardens','Access and outdoor design','Good residential aged care provides accessible, safe outdoor space with shade, rest areas, meaningful gardens and a clear return path. The tiny existing town plot cannot yet host a fully walkable resident courtyard.',4.65,5.50);
 placedProps.push(...['reception','resident-bedroom','resident-ensuite','nurse-call','dining','lounge',
  'care-staff','medication-cupboard','clean-utility','soiled-utility','kitchenette','hand-hygiene'].map(type=>({type,room:0})));
 return {group,colliders,interactables,sceneObjects,placedProps,seats,windows,
  rooms:L.rooms.map((r,i)=>({...r,w:r.x1-r.x0,d:r.z1-r.z0,parent:i===0?-1:0})),
  doors:L.bedroomDoors.map((d,i)=>({from:5,to:i+3,x:d.x,z:(d.z0+d.z1)/2,width:d.z1-d.z0})),
  bounds:{x0:-6.5,x1:6.5,z0:L.rear,z1:L.front},spawn:new THREE.Vector3(L.entry.x,0,L.entry.z),
  exitZone:{...L.exit},dynamics:[],sight:[],agedCareLayout:L,
  staff:{pos:{x:-2.55,z:1.12},use:{x:-1.42,z:2.05}}};
}
