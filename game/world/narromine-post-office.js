// Narromine's actual Post Office frontage is mapped from NSW Spatial Services and
// street photographs. The ground-floor postal retail room below is INTERPRETIVE:
// no public interior floor survey, staff roster, private mail or live Australia Post
// integration was used. Do not claim a certified floor plan or real transactions.
import * as THREE from 'three';
import { geoToWorld, toWorld, DETAILED, polyRect, onTownStreet } from './narromine-layout.js';
import { NARROMINE_POSTAL_PERSON, postalState, POSTAL_WALK_ROUTE_LOCAL } from './narromine-postal-character.js';
import { siteToGeo } from './narromine-kieraths-data.js';
import { buildPostInterior, POST_LAYOUT } from './post-interior.js';
import { makeDistinctPerson } from './npc-wardrobe.js';

export const NARROMINE_POST_OFFICE_ID = 'narromine-post-office';
export const NARROMINE_POST_OFFICE_SAVE_ID = 'NARROMINE-PO';
export const NARROMINE_POST_OFFICE_NAME = 'Narromine Post Office';
export const NARROMINE_POST_OFFICE_ADDRESS = '[address redacted], Narromine NSW';

// Exterior approach under the north-side cantilevered awning, at the steps
// shown in the NSW-traced exterior. The step polygon's northern edge is near
// -32.231975, 148.239310. Both poses are *outside* the solid building and
// are deliberately separated so fast travel doesn't immediately auto-enter.
const [entryX, entryZ] = geoToWorld(-32.231961, 148.239304);
const [outsideX, outsideZ] = geoToWorld(-32.231944, 148.239304);
export const NARROMINE_POST_OFFICE_ENTRANCE = Object.freeze({
  x: entryX, z: entryZ, yaw: Math.PI,
  outside: Object.freeze({ x: outsideX, z: outsideZ, yaw: Math.PI }),
  returnPose: Object.freeze({ x: outsideX, z: outsideZ, yaw: 0 }),
  radius: 1.28,
});
export const nearNarrominePostOfficeDoor = (pos) =>
  !!pos && Math.hypot(pos.x - entryX, pos.z - entryZ) <= NARROMINE_POST_OFFICE_ENTRANCE.radius;

export function postOfficeExteriorGrounded() {
  const b = DETAILED.find(d => d.id === NARROMINE_POST_OFFICE_ID);
  if (!b) return false;
  const steps = b.props.find(p => p.kind === 'steps');
  if (!steps) return false;
  const rects = DETAILED.flatMap(d => d.parts.map(p => polyRect(p.pts)));
  const outsideClear = [NARROMINE_POST_OFFICE_ENTRANCE, NARROMINE_POST_OFFICE_ENTRANCE.outside].every(p =>
    !rects.some(r => p.x >= r.x0 - .45 && p.x <= r.x1 + .45 && p.z >= r.z0 - .45 && p.z <= r.z1 + .45));
  const stepCentre = steps.pts.reduce((acc,p) => ({x:acc.x+p[0]/steps.pts.length,z:acc.z+p[1]/steps.pts.length}),{x:0,z:0});
  return outsideClear && Math.hypot(entryX-stepCentre.x,entryZ-stepCentre.z)<4.0;
}

// Reuse the game's *existing* modelled postal interior (counter, scales,
// parcel collection, PO boxes, packing bench, back-of-house sorting).
// Its counter is Narromine-specific and never opens Repository Town's ledger.
export function buildNarrominePostOfficeInterior(makeLabel, day = 1, minute = 540) {
  const site = { id: NARROMINE_POST_OFFICE_ID, name: NARROMINE_POST_OFFICE_NAME };
  const built = buildPostInterior(site, makeLabel, 'Narromine postal retail (illustrative)');
  const counter = built.interactables.find(i => i.key === NARROMINE_POST_OFFICE_ID + ':counter');
  if (!counter) throw new Error('Missing Narromine postal counter');
  counter.label = 'Speak with postal counter staff';
  counter.act = { do: 'narromine-postal-counter', title: 'Narromine Post Office · Service counter' };

  // Interpretive display: general postal services only, no real tracking,
  // employee names, purchases, PO box addresses or personal information.
  const pos = new THREE.Vector3(-2.8,0,2.2);
  const notice = {
    key: NARROMINE_POST_OFFICE_ID + ':heritage',
    type: 'civic',label:'Post Office history and model information',
    room:0,roomName:'Narromine postal retail (illustrative)',pos,
    act:{do:'info',title:'Narromine Post Office · History',
      text:'The Narromine Post Office opened as Narramine on 20 October 1882, when the railway reached town, and was renamed in 1900. The outside building reflects historic street photographs and the NSW cadastral footprint. This ground-floor retail space is an interpretive reconstruction, not a measured floor plan. Postal payments, collection IDs and private mail data are not simulated.'}
  };
  built.interactables.push(notice);
  built.sceneObjects.push({type:'civic',label:notice.label,room:0,pos:{x:pos.x,z:pos.z},interactive:true});
  const sign=makeLabel?.('NARROMINE POST OFFICE · 74 DANDALOO ST','room');
  if(sign){sign.position.set(0,3.55,-5.25);built.group.add(sign);}
  const board=makeLabel?.('INTERPRETIVE INTERIOR · NOT A SURVEY','interactive');
  if(board){board.position.set(-2.8,2.25,2.2);built.group.add(board);}

  // Leah is completely fictional. Her stable actor ID is intentionally unrelated
  // to Repository Town’s own postal worker and unrelated to real post-office staff.
  const leah = makeDistinctPerson(NARROMINE_POSTAL_PERSON.id);
  leah.group.position.set(POST_LAYOUT.staff.x, 0, POST_LAYOUT.staff.z);
  leah.group.rotation.y = 0;
  leah.group.name = 'Leah Bennett · Narromine postal retail';
  built.group.add(leah.group);

  // Another generic employee covers her brief paid tea breaks and meal break.
  // No claim is made about actual staffing, shift coverage or a real employee.
  const relief = makeDistinctPerson('narromine:post-office:fictional-relief');
  relief.group.position.set(POST_LAYOUT.staff.x, 0, POST_LAYOUT.staff.z);
  relief.group.rotation.y = 0;
  relief.group.name = 'Fictional relief postal colleague';
  built.group.add(relief.group);

  const greeting = {
    key: NARROMINE_POST_OFFICE_ID + ':leah',
    type:'npc',person:true,label:'Talk to Leah Bennett',
    room:0,roomName:'Narromine postal retail (illustrative)',
    pos:new THREE.Vector3(2.9,0,-4.25),
    act:{do:'narromine-postal-person',title:'Leah Bennett · Postal retail officer'}
  };
  built.interactables.push(greeting);
  const updatePostalStaff = (d, m) => {
    const s=postalState(d,m), at=s.atCounter;
    leah.group.visible=at;
    relief.group.visible=s.atPostOffice&&!at&&['break','lunch'].includes(s.phase);
    const i=built.interactables.indexOf(greeting);
    if(at&&i<0)built.interactables.push(greeting);
    if(!at&&i>=0)built.interactables.splice(i,1);
    return s;
  };
  updatePostalStaff(day,minute);
  return {...built,people:[],narrominePostal:true,narrominePostalStaff:leah.group,
    updatePostalStaff,fictionalWorkerId:NARROMINE_POSTAL_PERSON.id};
}

// Same identity in the outdoor town, shown ONLY during travel or outdoor leisure.
// The route follows actual OSM street vertices, not a straight line through buildings.
// There is no claim of a surveyed pedestrian route or an actual street address.
export function createNarrominePostalOutdoorActor(parent,makeLabel) {
  const actor=makeDistinctPerson(NARROMINE_POSTAL_PERSON.id);
  actor.group.name='Leah Bennett · fictional Narromine resident';
  parent.add(actor.group);
  // Mabel actually accompanies Leah on the outdoor dog-walk slots; she is
  // hidden during work/commuting and is never left at the Coles entrance.
  // Deliberately simple reusable meshes rather than a second fake human NPC.
  const mabel=new THREE.Group();
  mabel.name='Mabel · Leah Bennett’s elderly kelpie-cross';
  mabel.position.set(.78,0,.25);
  const fur=new THREE.MeshLambertMaterial({color:0x8b593a}),
    dark=new THREE.MeshLambertMaterial({color:0x503828}),
    tan=new THREE.MeshLambertMaterial({color:0xc79b66}),
    collar=new THREE.MeshLambertMaterial({color:0x9c3c39});
  const dogPart=(geo,material,x,y,z,parent=mabel)=>{
    const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  };
  dogPart(new THREE.BoxGeometry(.34,.38,.79),fur,0,.48,0);
  dogPart(new THREE.BoxGeometry(.31,.35,.34),tan,0,.55,.4);
  dogPart(new THREE.SphereGeometry(.20,9,7),fur,0,.71,.51);
  dogPart(new THREE.BoxGeometry(.24,.12,.25),dark,0,.59,.72);
  for(const x of [-.19,.19])for(const z of [-.27,.30])
    dogPart(new THREE.CylinderGeometry(.052,.058,.46,7),fur,x,.24,z);
  for(const x of [-.12,.12]){
    const ear=dogPart(new THREE.ConeGeometry(.095,.24,6),dark,x,.96,.44);
    ear.rotation.z=x<0?.2:-.2;
  }
  dogPart(new THREE.BoxGeometry(.36,.07,.34),collar,0,.62,.41);
  const tail=dogPart(new THREE.CylinderGeometry(.048,.07,.44,7),fur,0,.63,-.51);
  tail.rotation.x=-.55;
  actor.group.add(mabel);
  const tag=makeLabel?.('Leah Bennett · local postal worker','interactive');
  if(tag){tag.position.set(0,2.25,0);actor.group.add(tag);}
  const route=POSTAL_WALK_ROUTE_LOCAL.map(toWorld);
  const distance=[0];
  for(let i=1;i<route.length;i++)distance.push(distance[i-1]+Math.hypot(route[i][0]-route[i-1][0],route[i][1]-route[i-1][1]));
  const interpolate=(vertices,t)=>{
    const lengths=[0];
    for(let i=1;i<vertices.length;i++)lengths.push(lengths[i-1]+Math.hypot(vertices[i][0]-vertices[i-1][0],vertices[i][1]-vertices[i-1][1]));
    const target=lengths.at(-1)*Math.max(0,Math.min(1,t));
    let i=1;while(i<lengths.length-1&&lengths[i]<target)i++;
    const len=lengths[i]-lengths[i-1],p=len>0?(target-lengths[i-1])/len:0;
    const a=vertices[i-1],b=vertices[i];
    return {x:a[0]+(b[0]-a[0])*p,z:a[1]+(b[1]-a[1])*p,yaw:-Math.atan2(b[1]-a[1],b[0]-a[0])};
  };
  const coles=geoToWorld(...siteToGeo([-10,-25.35]));
  const last=route.at(-1);
  // Two real buildings lie between the north-side Post Office entrance and
  // Coles. Follow the unobstructed Dandaloo Street footpath, then bend into
  // Kierath's open-air passage. Never interpolate through postal masonry.
  const finish=[last,...[[21,-60],[21,-34],[10.5,-21.2],[0,-23.5],[-10,-25.35]].map(p=>geoToWorld(...siteToGeo(p)))];
  const getPose=(state)=>{
    const q=(state.minute-state.since)/(state.until-state.since);
    if(state.place==='route:home-post')return interpolate(route,q);
    if(state.place==='route:post-home')return interpolate([...route].reverse(),q);
    if(state.place==='route:home-coles')return interpolate([...route,...finish.slice(1)],q);
    if(state.place==='route:coles-home')return interpolate([...finish].reverse().concat([...route].reverse().slice(1)),q);
    if(state.place==='route:post-coles')return interpolate(finish,q);
    // Outdoor walks stay in the vicinity of her mapped house, not inside walls.
    if(state.phase==='dog-walk')return interpolate([route[1],route[2],route[1]],q);
    if(state.phase==='leisure')return interpolate([last,route.at(-3),last],q);
    return null;
  };
  const update=(day,minute,playerPos=null)=>{
    const state=postalState(day,minute);
    const pose=getPose(state);
    actor.group.visible=!!pose;
    mabel.visible=state.phase==='dog-walk';
    if(mabel.visible)tail.rotation.z=Math.sin(state.minute*.55)*.18;
    if(pose){
      actor.group.position.set(pose.x,0,pose.z);
      actor.group.rotation.y=pose.yaw;
      if(tag)tag.visible=!!playerPos&&Math.hypot(playerPos.x-pose.x,playerPos.z-pose.z)<5;
    }
    return state;
  };
  update(1,540);
  return {group:actor.group,update,identity:NARROMINE_POSTAL_PERSON.id};
}
