// Shop NPCs are sourced from the existing TownLife roster, not a second
// disconnected set of random names. Only explicitly named hosts cover public spaces.
import * as THREE from 'three';
import { Walker } from './npcs.js';
import { makeDistinctPerson } from './npc-wardrobe.js';
import { workingAt } from './shop-attendance.js';

// These three proprietors are local businesses, not pretend existing town employees.
const HOST_NAMES={square:'Market Guide',farmhouse:'Nell',realestate:'Harper',dealership:'Callum',mechanic:'Jo',hardware:'Penny Carter',trades:'Ella Morgan',tafe:'Ash Kumar',university:'Dr Anika Shah'};
const HOST_ROLES={realestate:'licensed property agent',dealership:'vehicle sales consultant',mechanic:'motor mechanic',hardware:'hardware and timber manager',trades:'NSW-licensed electrician and repair coordinator',tafe:'vocational skills trainer',university:'engineering lecturer and research supervisor'};


export function populateShopStaff(site,life,interior,makeLabel){
  const workers=life.villagers.filter(v=>v.work===site.id);
  // Keep the worker's real name, role, and home available to the conversation.
  const worker=workers.find(v=>workingAt(v,site.id,site)) || null;
  const name=worker?.name||HOST_NAMES[site.id]||site.name+' Guide';
  const job=worker?.job||HOST_ROLES[site.id]||(site.id==='farmhouse'?'farmhouse resident':site.kind==='farm'?'farm guide':'visitor assistant');
  const home=site.id==='farmhouse';
  const pos=home?new THREE.Vector3(-5.20,0,-3.65):interior.staff?new THREE.Vector3(interior.staff.pos.x,0,interior.staff.pos.z):new THREE.Vector3(2.65,0,-8.25);
  // The visual identity remains stable for this physical staff position.
  const model=makeDistinctPerson(worker
    ? 'villager:'+worker.id+':'+worker.name+':'+(worker.job||'')
    : 'host:'+site.id+':'+name+':'+job,worker);
  const npc=new Walker(model,pos,{name,speed:0.4});
  npc.heading=0; // Face towards the front door, behind the service counter.
  npc.group.rotation.y=0;
  npc.key='staff:'+site.id;
  npc.room=home?3:0;
  npc.activity=home?'at home organising family farm jobs':job+' at '+site.name;
  npc.v=worker;
  npc.workplace=site.name;
  // The counter blocks passage but not conversation: interaction hotspot
  // is on the customer's side, close enough to press E/✋ without clipping.
  const label=makeLabel(name+' · '+job,'interactive');
  label.position.set(0,2.28,0);
  label.userData.labelKind='interactive';
  npc.tag=label;
  npc.group.add(label);
  interior.group.add(npc.group);
  npc.plan=()=>[]; // Stay at the counter instead of walking through furniture.
  const posUse=home?new THREE.Vector3(-5.10,0,-3.10):interior.staff?new THREE.Vector3(interior.staff.use.x,0,interior.staff.use.z):new THREE.Vector3(2.6,0,-5.1);
  // Equal-position targets always select the earlier desk exhibit. Keep a
  // separate, clear conversation spot beside that desk, preserving its service.
  const targets=interior.interactables||[];
  if(targets.some(x=>Math.hypot(x.pos.x-posUse.x,x.pos.z-posUse.z)<.15)){
    for(const dx of [-.9,.9,-1.2,1.2]){
      const x=posUse.x+dx,z=posUse.z;
      if(targets.some(t=>Math.hypot(t.pos.x-x,t.pos.z-z)<.5))continue;
      if((interior.colliders||[]).some(b=>{
        const cx=Math.max(b.x0,Math.min(x,b.x1)),cz=Math.max(b.z0,Math.min(z,b.z1));
        return (x-cx)**2+(z-cz)**2<.4**2;
      }))continue;
      if(interior.bounds&&(x<interior.bounds.x0+.4||x>interior.bounds.x1-.4||z<interior.bounds.z0+.4||z>interior.bounds.z1-.4))continue;
      posUse.x=x;break;
    }
  }
  const hotspot={
    key:npc.key,label:'Talk to '+name,type:'npc',person:true,room:npc.room,
    roomName:interior.rooms[npc.room].name,pos:posUse,
    act:{do:'npc',name,role:'villager',workplace:site.name,job},
  };
  const scenePerson={type:'person',label:name+' ('+job+')',room:npc.room,
    pos:{x:pos.x,z:pos.z},interactive:true};
  const animate=npc.update.bind(npc);
  let shownWorker=worker;
  const sync=()=>{
    const current=life.villagers.find(v=>workingAt(v,site.id,site)) || null;
    // Only explicitly named hosts exist without a roster. Do not invent a
    // volunteer to cover every absent employee, closed shop or empty depot.
    const present=!!current || (!workers.length && !!HOST_NAMES[site.id] && (!HOST_ROLES[site.id] || life.open(site)));
    npc.group.visible=present;
    npc.v=current;
    for(const [list,item] of [[interior.interactables,hotspot],[interior.sceneObjects,scenePerson]]){
      const index=list.indexOf(item);
      if(present && index<0)list.push(item);
      if(!present && index>=0)list.splice(index,1);
    }
    if(!present){npc.talking=false;return false;}
    if(current!==shownWorker){
      shownWorker=current;
      npc.name=current?.name||HOST_NAMES[site.id];
      const role=current?.job||HOST_ROLES[site.id]||(home?'farmhouse resident':'market guide');
      hotspot.label='Talk to '+npc.name;
      Object.assign(hotspot.act,{name:npc.name,job:role});
      scenePerson.label=npc.name+' ('+role+')';
      const old=npc.tag;
      npc.group.remove(old);
      old.material?.map?.dispose();old.material?.dispose();
      npc.tag=makeLabel(npc.name+' · '+role,'interactive');
      npc.tag.position.set(0,2.28,0);npc.tag.userData.labelKind='interactive';
      npc.group.add(npc.tag);
    }
    npc.activity=current?.activity||(home?'at home organising family farm jobs':HOST_ROLES[site.id]?'serving customers at '+site.name:'welcoming visitors to the market');
    return true;
  };
  npc.update=(...args)=>{if(sync()){
    // Staff can be found at the desk, but their names appear only when a
    // visitor approaches: no floating labels filling the mobile screen.
    const visitor=args[2]?.pos;
    npc.tag.visible=!!visitor && Math.hypot(visitor.x-pos.x,visitor.z-pos.z)<5.5;
    animate(...args);
  }};
  sync();
  return [npc];
}

