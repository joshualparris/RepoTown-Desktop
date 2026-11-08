// Narromine Coles: playable, store-scale INTERPRETIVE supermarket.
// Exact inside floor plan, stock planograms, customer/staff identities and tenancy
// records were not available. The real site is Coles Narromine, 76–82 Dandaloo St.
// 40 x 52 m = 2080 m² display/supply simulation, not a measured floor plan.
import * as THREE from 'three';
import { geoToWorld } from './narromine-layout.js';
import { siteToGeo } from './narromine-kieraths-data.js';
import { makeDistinctPerson } from './npc-wardrobe.js';
import { animateNarromineResidents } from './narromine-indoor-life.js';
import { NARROMINE_POSTAL_PERSON, postalState, COLES_HOURS } from './narromine-postal-character.js';

export const NARROMINE_COLES_SAVE_ID='NARROMINE-COLES';
export const NARROMINE_COLES_NAME='Coles Narromine';
export const NARROMINE_COLES_ADDRESS='[address redacted], Narromine NSW';
// Enter from the open-air shopping-square passage beside the actual Coles hall,
// not through the adjacent unit 2 shell (the former entrance was INSIDE its collider).
// Local metres refer to the same Kierath's site origin as the modelled shopping court.
const [doorX,doorZ]=geoToWorld(...siteToGeo([-10,-25.35]));
// Exit pose sits 1.5 m east of the door line: the streetscape furniture on main
// occupies the spot straight outside the door.
const [returnX,returnZ]=geoToWorld(...siteToGeo([-8.5,-26.85]));
export const NARROMINE_COLES_ENTRANCE=Object.freeze({
  x:doorX,z:doorZ,yaw:Math.PI,
  outside:Object.freeze({x:returnX,z:returnZ,yaw:Math.PI}),
  returnPose:Object.freeze({x:returnX,z:returnZ,yaw:0}),
  radius:1.12
});
export const nearNarromineColesDoor=pos=>!!pos&&Math.hypot(pos.x-doorX,pos.z-doorZ)<=NARROMINE_COLES_ENTRANCE.radius;
export const COLES_INTERPRETIVE_PLAN=Object.freeze({
  width:40,depth:52,displayFloorM2:2080,verifiedFloorPlan:false,
  // Verified shop services, NOT evidence of the simulated aisle plan.
  serviceEvidence: Object.freeze({
    observedOn:'2026-11-04',
    store:'https://www.coles.com.au/find-stores/coles/nsw/narromine-5755',
    quietHour:'https://www.coles.com.au/about/accessibility-and-inclusion/quiet-hour',
    regularHours:'Mon–Sat 06:00–21:00, Sunday 07:00–21:00',
    carryToCar:true,
    specialityTrolleys:'ask store to confirm availability',
    reducedSound:'Monday–Friday 10:30–11:30',
    reducedLightAndSound:'Tuesday 10:30–11:30',
    limitations:'Hours, store services and holiday arrangements may change; no verified fixture or aisle measurements.'
  }),
  sources:['Coles store listing: Dandaloo Street, Narromine; published Mon-Sat 06:00–21:00, Sun 07:00–21:00',
    'NSW Spatial Services ground parcel + roof traced in narromine-buildings-data.js',
    'Coles section of historic exterior photograph supplied by Josh (not an interior survey)'],
  zones:Object.freeze(['entry and baskets','produce','bakery','meat and seafood','pantry aisles',
    'dairy and chilled','frozen','home and cleaning','checkouts','staff stock receiving'])
});
export function colesOpen(day,minute){
  const s=postalState(day,minute);
  // Hours provided by Coles are indicative and may vary on public holidays.
  if(s.isHoliday)return null; // Unknown real holiday roster: do not invent opening.
  const range=new Date(s.date+'T00:00:00Z').getUTCDay()===0?COLES_HOURS.sunday:COLES_HOURS.weekday;
  return minute>=range[0]&&minute<range[1];
}
// Official Coles NSW Quiet Hour roster (viewed 4 Nov 2026): reduced sound on
// weekdays 10:30–11:30, with reduced lighting ALSO listed for Tuesdays.
// Holiday arrangements are unverified; null intentionally means "unknown",
// not that a real service was available or unavailable. No live API is queried.
export function colesQuietHour(day, minute) {
  const s = postalState(day, minute);
  if (s.isHoliday) return null;
  const weekday = new Date(s.date + 'T00:00:00Z').getUTCDay();
  const reducedSound = weekday >= 1 && weekday <= 5 && minute >= 630 && minute < 690;
  return Object.freeze({ reducedSound, reducedLighting: weekday === 2 && reducedSound });
}
// people: {staff, visitors} residents (narromine-population.js whoIsAt) shown at checkouts, in the aisles and shopping.
export function buildNarromineColesInterior(makeLabel, day=1, minute=540, people=null) {
  const group=new THREE.Group();group.name='Narromine Coles · interpretive supermarket';
  const colliders=[],interactables=[],sceneObjects=[],windows=[
    {axis:'z',at:26,s:-19.8,e:-1.75,out:1},
    {axis:'z',at:26,s:1.75,e:19.8,out:1}
  ];
  const materials=new Map(),geos=new Map();
  const mat=(colour,opacity=1)=>{const key=colour+':'+opacity;if(!materials.has(key))
    materials.set(key,new THREE.MeshLambertMaterial({color:colour,transparent:opacity<1,opacity,side:THREE.FrontSide}));return materials.get(key);};
  const geom=(w,h,d)=>{const key=w+','+h+','+d;if(!geos.has(key))geos.set(key,new THREE.BoxGeometry(w,h,d));return geos.get(key);};
  const box=(w,h,d,x,y,z,c,a=1)=>{const m=new THREE.Mesh(geom(w,h,d),mat(c,a));m.position.set(x,y,z);group.add(m);return m;};
  const solid=(w,h,d,x,y,z,c)=>{box(w,h,d,x,y,z,c);colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});};
  const label=(str,x,y,z,kind='interactive')=>{const sprite=makeLabel?.(str,kind);if(sprite){sprite.position.set(x,y,z);group.add(sprite);}};
  const hot=(key,title,body,x,z)=>{const point=new THREE.Vector3(x,0,z);
    interactables.push({key:'narromine-coles:'+key,label:title,type:'civic',room:0,
      roomName:'Coles Narromine · interpretive retail',pos:point,
      act:{do:'info',title,text:body}});
    sceneObjects.push({type:'civic',label:title,room:0,pos:{x,z},interactive:true});};
  // Draw thousands of packets in a handful of instanced batches rather than
  // issuing a separate draw call for every packet on mobile/WebGL.
  const stockBatches=new Map();
  const stockPacket=(x,y,z,c)=>{if(!stockBatches.has(c))stockBatches.set(c,[]);
    stockBatches.get(c).push([x,y,z]);};
  const flushPackets=()=>{
    const dummy=new THREE.Object3D();
    for(const [colour,positions] of stockBatches){
      const mesh=new THREE.InstancedMesh(geom(.31,.32,.46),mat(colour),positions.length);
      mesh.name='Instanced supermarket pantry packets';
      positions.forEach((p,i)=>{dummy.position.set(...p);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
      mesh.instanceMatrix.needsUpdate=true;group.add(mesh);
    }
  };
  const C={wall:0xeee9df,floor:0xb8beb8,roof:0xf5f5ed,steel:0x7b848b,checkout:0x555d60,
    frame:0x424a4b,glass:0x9fced1,produce:0x588c54,wood:0x896749,red:0xce1939,chilled:0x91b0c1};
  // Proper 40 x 52 m floor with 3.4 m front-door gap, glazed store frontage,
  // perimeter walls, and separated stock-room opening (no customer access).
  box(40,.22,52,0,-.11,0,C.floor);
  box(40,.22,52,0,6.35,0,C.roof);
  solid(.24,6.3,52,-20,3.15,0,C.wall);
  solid(.24,6.3,52,20,3.15,0,C.wall);
  solid(40,6.3,.24,0,3.15,-26,C.wall);
  for(const side of [-1,1]){
    solid(18.3,1.0,.24,side*10.85,.5,26,C.wall);
    box(18.3,3.4,.08,side*10.85,2.7,26,C.glass,.43);
    box(18.3,1.9,.25,side*10.85,5.35,26,C.wall);
    for(let i=0;i<5;i++)box(.09,3.4,.14,side*(2.5+i*4),2.7,26,C.frame);
  }
  box(3.5,.4,.24,0,6.1,26,C.wall);
  // Entry lobby / paired sliding doors and waist-high shopping trolleys.
  box(3.3,3,.045,0,2.35,26,C.glass,.3);
  for(const x of [-1.65,1.65])box(.075,3.0,.10,x,2.35,26,C.frame);
  box(3.7,.08,3.8,0,.05,23.5,0xc4c9c4);
  label('COLES · NARROMINE',0,5.5,25.6,'room');
  label('INTERPRETIVE 3D STORE · NOT A MEASURED FLOORPLAN',0,4.55,24.8,'interactive');
  for(let i=0;i<8;i++){
    box(.78,.34,.52,-17+(i%4)*.91,.27,23.1-Math.floor(i/4)*.84,C.steel);
    box(.65,.08,.34,-17+(i%4)*.91,.48,22.94-Math.floor(i/4)*.84,0xced6d8);
  }
  label('TROLLEYS · BASKETS',-14.6,2.0,23.3);
  // This information stand occupies the existing clear customer lobby, adds no
  // new solid collider and does not imply that a particular trolley is available.
  label('ACCESSIBILITY · QUIET HOUR INFO',-3.8,2.55,23.1,'interactive');
  hot('accessibility','Accessibility and Quiet Hour information',
    'Coles Narromine lists carry-to-car assistance and speciality trolleys (ask the store about availability). Its published Quiet Hour reduces sound Monday to Friday, 10:30–11:30 am; on Tuesdays lighting is also listed as reduced. Hours, holiday arrangements and services can change. The model’s aisle layout is interpretive, not a verified Coles floor plan. Source: Coles official Narromine store and Quiet Hour pages, checked 4 November 2026.',
    -3.0,21.5);
  // Produce bay: low bins, visible content, aisle wide enough for trolleys.
  const veg=[0x78a447,0xc1b34b,0xcb5939,0x548b57,0xe39e41,0x85493e];
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
    const x=-15.6+col*3.65,z=14.7-row*3.2;
    solid(2.3,.9,1.52,x,.45,z,C.wood);
    box(2.23,.12,1.47,x,.96,z,0x594b39);
    for(let n=0;n<9;n++){const ox=(n%3-1)*.62,oz=(Math.floor(n/3)-1)*.38;
      const ball=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),mat(veg[(row+col+n)%veg.length]));
      ball.position.set(x+ox,1.16,z+oz);group.add(ball);}
  }
  label('FRESH FRUIT & VEG',-11,3.55,19);
  hot('produce','Browse fresh fruit and vegetables','Seasonal produce is grouped in open bins, with walkways clear for trolleys. Individual products and prices are illustrative, not a live Coles inventory.',-10.5,18.2);
  // Bakery / service area, not a claim of on-site bake-off machinery.
  solid(7.4,1.15,1.25,-14.8,.575,-5.6,C.wood);
  box(7.6,.10,1.32,-14.8,1.22,-5.6,0xe3d8be);
  label('BREAD · BAKERY',-14.5,2.9,-5.8);
  for(let i=0;i<12;i++)box(.55,.35,.34,-17.6+(i%6)*1.07,1.46,-5.65,0xc9a16a);
  hot('bakery','Browse bakery and bread','Loaves, rolls and packaged bakery goods; check labels and allergens in a real store.',-14, -3.5);
  // Gondolas: 7 long aisles with top caps, price rails, varied silhouettes.
  const aisleNames=['CEREAL · SPREADS','PASTA · RICE','TINNED GOODS','SNACKS · BISCUITS',
    'COFFEE · TEA','CLEANING · LAUNDRY','PETS · HOME'];
  const products=[0xe1bc70,0xa76858,0xb3c890,0x6499a5,0xdd8d48,0x8e8fb9,0xd7d2ad];
  for(let ai=0;ai<7;ai++){
    const x=-14.7+ai*4.55;
    solid(1.42,2.12,19.8,x,1.06,-16.0,0x9fa5a3);
    for(let side of [-1,1])for(let level=0;level<4;level++){
      box(.72,.08,19.5,x+side*.46,.34+level*.49,-16,0xededeb);
      for(let j=0;j<24;j++)stockPacket(x+side*.82,.53+level*.47,-25.1+j*.79,products[(ai+j+level)%products.length]);
    }
    label('AISLE '+(ai+1)+' · '+aisleNames[ai],x,3.05,-5.0);
  }
  hot('pantry','Browse pantry aisles','Seven product aisles divide packaged groceries into clearly labelled categories. Shelf labels are representative, not current products or Coles prices.',-1, -2.8);
  // Chilled perimeter: cabinets along rear and right walls with glass doors.
  for(let x=-17;x<=-6;x+=2.35){
    solid(2.15,2.55,1.15,x,1.275,-24.95,0x6d8690);
    box(1.98,2.32,.07,x,1.35,-24.33,C.glass,.44);
    for(let j=0;j<3;j++)for(let n=0;n<4;n++)box(.35,.32,.24,x-.7+n*.47,.52+j*.68,-24.19,
      [0xf0f0eb,0xd1b985,0xb8d7cc,0xd9d1f1][(j+n)%4]);
  }
  label('CHILLED · DAIRY · DELI',-10.4,3.45,-24.1);
  hot('chilled','Browse chilled food','Refrigerated dairy and prepared food. Cold-chain labels and temperature are illustrative; no live refrigeration sensors are connected.',-16.7,-20.5);
  for(let z=-20;z<=-7;z+=2.9){
    solid(1.25,2.5,2.45,18.7,1.25,z,0x7f9298);
    box(.08,2.15,2.26,18.02,1.34,z,C.glass,.4);
  }
  label('FROZEN FOOD',16.2,3.4,-17);
  hot('freezer','Browse frozen foods','Frozen food behind insulated doors. In reality, stock temperatures and handling need proper checks.',15.4,-12);
  flushPackets();
  // Front checkout line: four recognisable checkouts, scanner and bagging shelf.
  // Queuing approaches from behind them, not through gondolas.
  for(let n=0;n<4;n++){
    const x=5.7+n*3.35;
    solid(2.35,.9,2.95,x,.45,17.3,C.checkout);
    box(1.12,.055,1.45,x,.95,16.9,0x28323a);
    box(.52,.36,.18,x+.6,1.2,18.1,0x454a53);
    box(.45,.29,.06,x+.6,1.22,18.21,0x83bbb7);
    box(.6,.12,.8,x-1,.95,18.2,0xc2c5c2);
    label('CHECKOUT '+(n+1),x,2.38,19.1);
  }
  hot('checkout','Checkout and bagging','Queue, scan the goods, bag them and collect a receipt. This is a demonstration; there is no real transaction, price feed or payment.',1.65,18.7);
  // Safety: a clearly separated staff-only receiving zone at the rear.
  solid(7.8,3.4,.20,14.1,1.7,-25.0,0xb8bfc2);
  for(let n=0;n<4;n++)box(1.2,.7,1.2,10.8+(n%2)*1.6,.45+Math.floor(n/2)*.7,-23.8,0xb69c77);
  label('STAFF ONLY · STOCK RECEIVING',13.8,3.6,-25);
  // LED-style luminaires keep the large aisle geometry legible.
  for(let x=-16;x<=16;x+=8)for(let z=-21;z<=19;z+=10)box(2.2,.055,.62,x,6.12,z,0xfff9ed);
  group.add(new THREE.HemisphereLight(0xffffff,0x6d7a7e,2.0));
  // The same unique character appears here ONLY while her schedule places her
  // in this shop, never duplicated at her post-office counter.
  const leah=makeDistinctPerson(NARROMINE_POSTAL_PERSON.id);
  leah.group.name='Leah Bennett · Coles shopping';
  leah.group.position.set(-8.4,0,16.2);leah.group.rotation.y=1.1;
  group.add(leah.group);
  leah.group.visible=postalState(day,minute).atColes;
  // Residents on shift: the first four staff run the checkouts (standing behind them), the rest fill
  // shelves in the aisles. Shoppers walk the aisles and queue at the registers.
  const figureIds = [], figurePositions = [], actors = [];
  if (people) {
    const put = (p, x, z, yaw, activity = 'shopping', roam = true) => {
      const figure = makeDistinctPerson('narromine:' + p.id,
        { ...p, workplaceKind: 'supermarket', workplaceName: 'Coles Narromine' },
        { activity, jobKind: 'supermarket', minute, weather: 'sunny' });
      figure.group.name = p.name;
      const record = { id: p.id, x, z };
      figureIds.push(p.id); figurePositions.push(record);
      actors.push({ figure, id: p.id, name: p.name, label: p.first + ' ' + p.surname,
        x, z, yaw, activity, roam, record });
    };
    // Checkouts are staffed; shelf fillers and shoppers actually move through
    // the aisles, following a route checked against the same shelf colliders.
    people.staff.forEach((p, i) => i < 4
      ? put(p, 5.7 + i * 3.35, 16.0, 0, 'serving at checkout', false)
      : put(p, -12 + ((i * 7) % 24), -14 + ((i * 5) % 26),
          i % 2 ? Math.PI / 2 : -Math.PI / 2, 'restocking shelves', true));
    people.visitors.forEach((p, i) => i < 4
      ? put(p, 5.7 + i * 3.35, 19.6, Math.PI, 'shopping and queueing', true)
      : put(p, -15 + ((i * 11) % 30), -18 + ((i * 7) % 30),
          (i % 4) * Math.PI / 2, 'browsing groceries', true));
  }
  label('EXIT',0,3.5,25.45);
  const built = {group,colliders,interactables,sceneObjects,placedProps:[],seats:[],windows,rooms:[
    {name:'Coles Narromine · interpretive retail',x0:-20,x1:20,z0:-26,z1:26,w:40,d:52,parent:-1}
  ],doors:[],dynamics:[],sight:[],bounds:{x0:-20,x1:20,z0:-26,z1:26},
    spawn:new THREE.Vector3(0,0,22.5),exitZone:{x0:-1.7,x1:1.7,z0:25.9,z1:27.5},
    narromineColes:true,narrominePostalShopper:leah.group,figureIds,figurePositions,
    colesPlan:COLES_INTERPRETIVE_PLAN,
    updatePostalShopper:(day,minute)=>{leah.group.visible=postalState(day,minute).atColes;return leah.group.visible;}
  };
  animateNarromineResidents(built, actors, makeLabel, () => minute);
  return built;
}
