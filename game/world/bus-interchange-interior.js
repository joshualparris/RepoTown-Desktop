import * as THREE from 'three';
import { makeSeat } from './seats.js';
import { BUS_LAYOUT as L } from './bus-interchange-layout.js';

// Purpose-built 10 m × 7 m public waiting shelter matching its actual exterior.
// This is a fictional community interchange, not a claim of live NSW bus services.
export function buildBusInterchangeInterior(site,makeLabel){
 const group=new THREE.Group();group.name='Inside '+site.name;
 const colliders=[],interactables=[],sceneObjects=[],placedProps=[],seats=[],windows=[];
 const materials=new Map(),geometries=new Map();
 const mat=(c,alpha=1)=>{const key=c+':'+alpha;if(!materials.has(key))materials.set(key,new THREE.MeshLambertMaterial({color:c,transparent:alpha<1,opacity:alpha,depthWrite:alpha===1,side:THREE.DoubleSide}));return materials.get(key);};
 const box=(w,h,d,x,y,z,c,alpha=1)=>{
   const key=w+','+h+','+d;let geo=geometries.get(key);
   if(!geo){geo=new THREE.BoxGeometry(w,h,d);geometries.set(key,geo);}
   const m=new THREE.Mesh(geo,mat(c,alpha));m.position.set(x,y,z);group.add(m);return m;
 };
 const solid=(w,h,d,x,y,z,c)=>{box(w,h,d,x,y,z,c);colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});};
 const label=(name,x,y,z)=>{const sprite=makeLabel(name,'interactive');sprite.position.set(x,y,z);sprite.userData.labelKind='interactive';group.add(sprite);return sprite;};
 const add=(key,title,body,x,z,act='info')=>{
   const pos=new THREE.Vector3(x,0,z);
   interactables.push({key:site.id+':'+key,type:'civic',label:title,room:0,roomName:'Passenger waiting and information',pos,
     act:{do:act,title,text:body,civicId:site.id}});
   sceneObjects.push({type:'civic',label:title,room:0,pos:{x,z},interactive:true});
 };
 const C={floor:0xb8bdb8,wall:0x96a7ad,roof:0x506c79,steel:0x344b56,blue:0x235b89,white:0xe7edf0,
   glass:0xb0d8e1,yellow:0xeac849,seat:0xa6b6bb,board:0x263d51};
 // Level, slip-resistant-looking simulated paving; no false steps or kerb collisions.
 box(L.width,.14,L.depth,0,-.07,3.5,C.floor).name='floor-slab';
 box(L.width,.22,L.depth,0,3.37,3.5,C.roof).name='ceiling-slab';
 // Rear wind screen and side glazing are transparent, letting travellers see arrivals.
 solid(L.width,.65,.15,0,.325,.14,C.wall);
 box(9.65,2.18,.045,0,1.72,.14,C.glass,.24);
 for(const x of [-3.25,0,3.25])solid(.095,2.73,.13,x,1.65,.16,C.steel);
 for(const x of [-4.84,4.84]){
   solid(.16,.52,L.depth,x,.26,3.5,C.wall);
   box(.04,2.42,5.85,x,1.67,3.55,C.glass,.24);
   for(const z of [.55,3.55,6.55])solid(.08,2.82,.10,x,1.54,z,C.steel);
 }
 // Street-facing main entrance is central, 2.5 m clear; NEVER close it with glass.
 for(const x of [-3.1,3.1]){
   solid(3.65,.48,.13,x,.24,6.87,C.wall);
   box(3.60,2.33,.045,x,1.67,6.87,C.glass,.20);
   solid(3.70,.12,.13,x,2.91,6.87,C.steel);
 }
 for(const x of [-1.25,1.25])solid(.10,3.12,.13,x,1.56,6.87,C.steel);
 box(2.5,.16,.14,0,3.15,6.88,C.yellow);
 box(2.6,.04,1.0,0,.02,6.12,0x727b7c); // recessed-looking flat entry mat
 // Wall-timetable and legible contrasting printed strips, with no invented live times.
 box(2.4,2.1,.12,-4.45,1.75,4.22,C.board);
 box(2.15,1.78,.035,-4.36,1.75,4.22,C.white);
 for(let i=0;i<7;i++)box(1.65,.075,.04,-4.32,2.35-i*.22,4.25,i%2?0x7896ab:C.blue);
 label('Routes & timetable (fictional)',-3.3,2.6,4.10);
 // Small staffed enquiries kiosk near the back wall, not a full transport agency.
 solid(2.35,.84,.63,-3.16,.42,1.52,0x6a8291);
 box(2.48,.07,.72,-3.16,.88,1.52,0xd7e1e2);
 box(.58,.43,.08,-3.53,1.15,1.16,C.board);
 box(.46,.29,.09,-3.53,1.16,1.22,0x80c4d3);
 box(.12,.06,.18,-3.53,.96,1.45,C.steel); // staff terminal
 box(2.25,.52,.06,-3.16,2.5,.35,C.blue);
 label('Information and assistance',-2.75,2.2,1.42);
 // Sheltered metal seating (two priority positions), with a maintained centre aisle.
 for(const z of [2.1,4.25]){
   solid(1.65,.09,.48,3.38,.48,z,C.seat);
   box(1.65,.54,.10,3.38,.89,z-.22,C.seat);
   for(const x of [2.7,4.06])box(.075,.47,.09,x,.22,z,C.steel);
   box(.09,.28,.43,2.64,.73,z,C.steel);box(.09,.28,.43,4.12,.73,z,C.steel);
   seats.push(makeSeat(site.id+':priority:'+z,'bench',3.38,z,Math.PI,{room:0,roomName:'Passenger waiting and information',label:'Priority seating'}));
 }
 box(1.9,.48,.06,3.42,2.17,5.48,C.blue);
 label('Priority seating and clear waiting spaces',2.85,2.42,5.34);
 // Bin and drinking-water bottle filler are against a wall away from the aisle.
 solid(.5,.88,.5,4.28,.44,1.0,0x637b7f);
 box(.39,.04,.39,4.28,.91,1.0,0x253b42);
 solid(.38,.94,.34,-4.28,.47,1.08,C.steel);
 box(.30,.08,.27,-4.28,.97,1.08,C.white);
 // Six bright under-canopy luminaires; emergency luminaire near egress.
 group.add(new THREE.HemisphereLight(0xffffff,0x6f7680,2.1));
 for(const x of [-3.25,0,3.25])for(const z of [2.05,5.25]){
   box(.85,.06,.29,x,3.20,z,0xfff1c9);
   const light=new THREE.PointLight(0xfff3d8,.46,8);light.position.set(x,3.13,z);group.add(light);
 }
 box(.6,.26,.08,1.73,2.95,6.64,0x6baa68);
 label('EXIT',1.73,2.95,6.48);
 // Interaction points are in free space; no simulated fares or real-time feeds.
 add('information','Ask at information desk',
   'The bus liaison can explain the fictional local service map, accessible boarding point and lost-property procedure. This is not a real-time Transport for NSW service.',-1.91,2.47,'civic-ledger');
 add('timetable','Read timetable and route map',
   'Fictional Repository Town services only. Confirm the destination, bay, service notices and departure time on an official operator display in real life. No live bus feed is connected.',-3.15,4.32);
 add('boarding','Find the accessible boarding point',
   'Follow the tactile route toward the street-facing yellow bus stop sign. A clear hardstand, ramp deployment space and a raised kerb are shown in the model. Never enter the traffic lane to wait.',-1.05,5.63);
 add('priority','Priority seating and wheelchair spaces',
   'Two priority waiting positions are kept away from the centre aisle. Allow room for wheelchair turning, prams and mobility aids; passengers boarding via a ramp should move to the dedicated hardstand.',1.75,4.36);
 add('safety','Safety and emergency assistance',
   'Shelter lighting and clear sightlines improve personal safety. In a real emergency call 000. Report damage, broken lighting or a missing bus stop sign to the operator or council.',1.70,1.7);
 placedProps.push({type:'timetable',room:0},{type:'priority-seating',room:0},{type:'shelter',room:0},{type:'information-desk',room:0});
 // Four outdoor views match the exterior shelter glazing and show the real street.
 windows.push({axis:'z',at:6.87,s:-4.85,e:-1.3,out:1},
              {axis:'z',at:6.87,s:1.3,e:4.85,out:1},
              {axis:'x',at:-4.84,s:1,e:5.6,out:-1},
              {axis:'x',at:4.84,s:1,e:5.6,out:1});
 return {group,colliders,interactables,sceneObjects,placedProps,seats,windows,
   busInterchangeLayout:L,rooms:[{name:'Passenger waiting and information',x0:-5,x1:5,z0:0,z1:7,w:10,d:7,parent:-1}],
   doors:[],dynamics:[],sight:[],bounds:{x0:-5,x1:5,z0:0,z1:7},
   spawn:new THREE.Vector3(0,0,4.5),exitZone:{x0:-L.entryHalfWidth,x1:L.entryHalfWidth,z0:6.8,z1:8.2},
   staff:{pos:{x:-3.25,z:.65},use:{x:-1.91,z:2.47}}};
}
