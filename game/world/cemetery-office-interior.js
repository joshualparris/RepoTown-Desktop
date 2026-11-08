import * as THREE from 'three';
import { makeSeat } from './seats.js';
import { CEMETERY_LAYOUT as L } from './cemetery-office-layout.js';

// Purpose-built memorial office, rather than a generic retail counter.
// Public information is fictional; no personal interment records, burial
// orders, customer agreements or real-world bookings are loaded or displayed.
export function buildCemeteryOfficeInterior(site,makeLabel){
 const group=new THREE.Group();group.name='Inside '+site.name;
 const colliders=[],interactables=[],sceneObjects=[],seats=[],placedProps=[],windows=[];
 const geos=new Map(),mats=new Map();
 const mat=(c,a=1)=>{const k=c+':'+a;if(!mats.has(k))mats.set(k,new THREE.MeshLambertMaterial({
  color:c,transparent:a<1,opacity:a,depthWrite:a>=1,side:THREE.DoubleSide
 }));return mats.get(k)};
 const box=(w,h,d,x,y,z,c,a=1)=>{
  const key=[w,h,d].join(':');let g=geos.get(key);
  if(!g){g=new THREE.BoxGeometry(w,h,d);geos.set(key,g)}
  const m=new THREE.Mesh(g,mat(c,a));m.position.set(x,y,z);group.add(m);return m;
 };
 const solid=(w,h,d,x,y,z,c)=>{
  box(w,h,d,x,y,z,c);
  colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});
 };
 const text=(label,x,y,z,kind='room')=>{
  const m=makeLabel(label,kind);m.position.set(x,y,z);m.userData.labelKind=kind;group.add(m);
 };
 const add=(key,label,body,x,z,room=0,action='info')=>{
  const pos=new THREE.Vector3(x,0,z);
  interactables.push({key:site.id+':'+key,type:'civic',label,pos,room,
   roomName:['Welcome and records enquiries','Private family consultation','Staff records review'][room],
   act:{do:action,title:label,text:body,civicId:site.id}});
  sceneObjects.push({type:'civic',label,room,pos:{x,z},interactive:true});
 };
 const C={brick:0xe4dbcd,cream:0xf7f2e8,wood:0x90735b,dark:0x5b584e,
  sage:0x789286,bronze:0xa0845b,stone:0xb8b3ab,tile:0xcec5b8,
  slate:0x51636b,glass:0xb9d3dc,leaf:0x608063,floral:0xe2b3b3,soft:0xd6d5ca};
 // Quiet, evenly lit, low-glare building with visible courtyard windows.
 box(12,.17,9,0,-.085,2.5,C.tile).name='floor-slab';
 for(let z=-1.7;z<7;z+=.65)box(11.74,.011,.025,0,.005,z,0xb3a89a);
 box(12,.23,9,0,4.27,2.5,C.cream).name='ceiling-slab';
 solid(12,1.0,.18,0,.50,-1.90,C.brick);
 box(12,3.3,.18,0,2.65,-1.90,C.brick);
 for(const x of [-5.90,5.90]){
  solid(.19,.85,9,x,.425,2.5,C.brick);
  box(.05,2.55,8.25,x,2.13,2.5,C.glass,.19);
  for(const z of [-1.45,2.50,6.55])box(.075,3.05,.14,x,2.08,z,C.wood);
 }
 // Broad protected front windows and one 2.5m wide real middle exit.
 for(const x of [-3.65,3.65]){
  solid(4.43,.80,.18,x,.40,6.90,C.brick);
  box(4.35,2.47,.045,x,2.06,6.90,C.glass,.20);
  box(4.35,.84,.18,x,3.66,6.90,C.brick);
  box(.09,2.4,.11,x,2.04,6.98,C.wood);
 }
 for(const x of [-1.26,1.26])box(.075,3.0,.12,x,1.56,6.94,C.wood);
 box(2.52,.21,.18,0,3.34,6.93,C.wood);
 box(2.46,2.98,.04,0,1.53,6.95,C.glass,.14);
 box(.07,2.93,.06,0,1.53,7.02,C.wood);
 for(const x of [-.38,.38])box(.035,.34,.10,x,1.53,7.08,C.bronze);
 box(2.6,.025,.88,0,.02,6.18,C.slate);
 text('Exit to front garden',0,3.10,6.55);
 // Quiet, partially enclosed counselling room at rear left. Partitions have
 // a genuine 1.40m open doorway; never place a collider across the gap.
 solid(.16,3.32,2.40,-2.24,1.66,-.64,C.brick);
 solid(1.45,3.32,.13,-5.18,1.66,.60,C.brick);
 solid(.82,3.32,.13,-2.65,1.66,.60,C.brick);
 box(1.4,.13,.13,-3.77,3.24,.60,C.wood);
 text('Private family room',-4.12,2.82,.45);
 // Family chairs are seated furniture, not fake impassable solid boxes.
 for(const x of [-4.90,-3.18]){
  box(.78,.13,.72,x,.47,-1.18,C.wood);
  box(.78,.78,.13,x,.91,-1.52,C.sage);
  for(const dx of [-.26,.26])box(.06,.44,.06,x+dx,.23,-1.18,C.dark);
  seats.push(makeSeat(site.id+':consult:'+x,'chair',x,-1.08,0,{room:1,roomName:'Private family consultation'}));
 }
 box(.80,.10,.58,-4.03,.55,-1.27,C.wood);
 box(.50,.12,.34,-4.03,.70,-1.27,C.cream);
 box(.20,.28,.17,-4.35,.77,-1.29,C.leaf);
 text('Quiet conversation',-3.82,2.7,-1.63);
 // Right rear records room is physically reachable by an actual doorway, but
 // all interactions stay explanatory: no identity, contact or historic records.
 solid(.17,3.35,2.50,2.63,1.68,-.63,C.brick);
 solid(1.49,3.35,.13,3.37,1.68,.66,C.brick);
 solid(.57,3.35,.13,5.67,1.68,.66,C.brick);
 box(1.26,.14,.13,4.72,3.22,.66,C.wood);
 text('Records · staff supervised',4.55,2.95,.45);
 for(const x of [3.22,5.33]){
  solid(.55,1.65,.52,x,.82,-1.22,C.slate);
  for(const y of [.34,.76,1.19]){box(.40,.08,.055,x,y,-.91,C.soft);box(.13,.025,.07,x,y,-.87,C.bronze);}
 }
 box(.80,.65,.53,4.30,.34,-1.41,C.wood);
 box(.60,.43,.08,4.30,.98,-1.47,C.slate);
 box(.53,.33,.08,4.30,.98,-1.40,C.glass);
 box(.42,.04,.22,4.30,.70,-1.22,C.soft);
 // Open public reception, with a lower service section for seated guests.
 solid(2.60,.89,.66,L.reception.x,.445,L.reception.z,C.wood);
 box(2.71,.075,.73,L.reception.x,.92,L.reception.z,C.cream);
 box(.84,.08,.50,.75,.75,-.47,C.cream);
 box(.66,.38,.09,-1.15,1.30,-.86,C.slate);
 box(.54,.28,.10,-1.15,1.30,-.78,C.glass);
 box(.55,.07,.25,-1.15,1.04,-.45,C.soft);
 for(let i=0;i<5;i++)box(.08,.18,.04,-.32+i*.18,1.05,-.41,C.soft);
 text('Visitor reception and enquiries',-.5,2.56,-1.66);
 // Cemetery section map and plot-location guide along left wall.
 box(.16,2.20,2.45,-5.50,2.0,2.55,C.wood);
 box(.08,2.0,2.22,-5.38,2.0,2.55,C.cream);
 for(let i=0;i<7;i++){
  const z=1.66+i*.27;
  box(.09,.08,1.65,-5.30,2.6-i*.24,z,i%2?C.sage:C.bronze);
 }
 text('Memorial directory and sections',-4.6,3.0,2.52);
 // Visitor seating near daylight, with genuine registered sitting surfaces.
 for(const x of [-3.65,3.65]){
  box(1.60,.12,.55,x,.49,4.75,C.wood);
  box(1.60,.62,.10,x,.85,4.49,C.sage);
  for(const dx of [-.65,.65])box(.075,.48,.08,x+dx,.25,4.75,C.dark);
  seats.push(makeSeat(site.id+':waiting:'+x,'bench',x,4.75,Math.PI,{room:0,roomName:'Welcome and records enquiries'}));
 }
 // Sample plaques and photographs are anonymised: no actual grave names.
 box(.18,2.12,2.8,5.47,1.68,2.85,C.stone);
 for(let i=0;i<3;i++){
  const z=1.9+i*.85;
  box(.10,.48,.59,5.28,1.48,z,C.bronze);
  box(.11,.04,.42,5.19,1.43,z,C.soft);
 }
 text('Memorial styles · sample only',4.42,3.1,2.90);
 // Maintenance/flower display and discreet free water nearby, not a chapel.
 box(1.05,.13,.62,-4.6,.82,5.78,C.wood);
 for(let i=0;i<5;i++){
  const x=-4.97+i*.19;
  box(.13,.27,.14,x,1.02,5.7,C.sage);
  box(.16,.08,.15,x,1.2,5.7,i%2?C.floral:C.cream);
 }
 box(.43,.83,.35,5.40,.42,5.97,C.slate);
 box(.37,.09,.31,5.40,.89,5.97,C.soft);
 // Public area is gently lit; in-use rooms have their own ceiling lights.
 group.add(new THREE.HemisphereLight(0xffffff,0x80705f,2.15));
 for(const x of [-4.0,0,4.0])for(const z of [-.4,2.7,5.6]){
  box(.80,.055,.28,x,4.08,z,0xffe9cc);
  const lamp=new THREE.PointLight(0xffebd8,.43,8);
  lamp.position.set(x,3.95,z);group.add(lamp);
 }
 // Interactions never expose or generate actual sensitive information.
 add('enquiries','Speak to cemetery officer',
  'Discuss cemetery opening information, memorial locations, maintenance and planning appointments. This is a fictional office; the Town Ledger does not make burial arrangements or sign legal agreements.',
  L.reception.useX,L.reception.useZ,0,'civic-ledger');
 add('map','Search memorial garden map',
  'Find a section using the fictional memorial garden map. For real Dubbo records, Dubbo Regional Council provides Memorial Mapper and formal cemetery-record enquiries. No real people or graves are indexed here.',
  -4.28,2.58);
 add('samples','View memorial design samples',
  'Inspect anonymous plaque and stone finishes, lettering space and durability. Actual memorial installation needs operator approval, any relevant heritage consent and the interment right holder’s authorisation.',
  4.0,2.77);
 add('flowers','Remembrance flowers and quiet reflection',
  'A peaceful waiting area for families. Visitors may bring personal flowers subject to the cemetery’s own safety and maintenance rules.',
  -3.38,5.64);
 add('consult','Private family consultation',
  'Family discussions may cover arrangements, cultural or religious requirements, memorial options and interment rights. Detailed enquiries are handled privately by authorised cemetery staff.',
  -3.77,-.08,1);
 add('records','How cemetery records are protected',
  'The model illustrates secure interment-right registers, plot maps and operational records. No actual confidential records are accessible. NSW cemetery operators must follow retention and recordkeeping requirements.',
  4.68,-.18,2);
 add('rights','Ask about interment rights',
  'Interment rights are governed by NSW cemetery law. Before a real interment an operator checks the interment right and issues a written order for interment; this model does not issue orders.',
  1.92,1.70);
 add('maintenance','Report memorial maintenance',
  'Ask the cemetery operator about safe headstone work, cemetery grounds upkeep, memorial placement and approvals. Avoid moving or disturbing grave fixtures without permission.',
  3.76,5.78);
 placedProps.push(...['reception','confidential-consultation','staff-records','memorial-map','sample-plaques','seating','quiet-flowers','water-point'].map(type=>({type,room:0})));
 windows.push({axis:'z',at:6.90,s:-5.75,e:-1.38,out:1},{axis:'z',at:6.90,s:1.38,e:5.75,out:1},
  {axis:'x',at:-5.9,s:1.1,e:5.8,out:-1},{axis:'x',at:5.9,s:1.1,e:5.8,out:1});
 return {group,colliders,interactables,sceneObjects,placedProps,seats,windows,
  cemeteryOfficeLayout:L,
  rooms:[
   {name:'Welcome and records enquiries',x0:-6,x1:6,z0:.67,z1:7,w:12,d:6.33,parent:-1},
   {name:'Private family consultation',x0:-5.95,x1:-2.22,z0:-1.90,z1:.61,w:3.73,d:2.51,parent:0},
   {name:'Staff records review',x0:2.62,x1:5.95,z0:-1.90,z1:.67,w:3.33,d:2.57,parent:0}
  ],doors:[],dynamics:[],sight:[],bounds:{x0:-6,x1:6,z0:-2,z1:7},
  spawn:new THREE.Vector3(0,0,4.72),exitZone:{...L.exit},
  staff:{pos:{x:L.reception.staffX,z:L.reception.staffZ},use:{x:L.reception.useX,z:L.reception.useZ}}};
}
