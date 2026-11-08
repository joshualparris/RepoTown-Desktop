import {pubVenue} from './pub-venue.js';
import {routeVisitor} from './shop-visitors.js';
// Presentation follows successful, persisted service events; never charges money.
export function servicePhase(event,minute){const age=minute-event.at,prep=event.kind==='meal'?10:3;if(age<0||age>=60)return {kind:'idle',progress:0};if(age<prep)return {kind:event.kind==='meal'?'prepare':'pour',progress:Math.max(0,age/prep)};if(age<prep+9)return {kind:'carry',progress:(age-prep)/9};if(age<50)return {kind:'served',progress:1};return {kind:'return',progress:(age-50)/10};}
export function installPubPresentation(k){
 const {THREE,group,colliders}=k,bounds={x0:-7,x1:7,z0:-12,z1:6};let people=[],activeId=null,path=null,home=null,actor=null;
 const mesh=(geo,color)=>new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color}));
 const mug=new THREE.Group();mug.name='pub:served-drink';group.add(mug);const glass=new THREE.Mesh(new THREE.CylinderGeometry(.059,.054,.15,12),new THREE.MeshLambertMaterial({color:0xdcebf0,transparent:true,opacity:.25}));mug.add(glass);const liquid=mesh(new THREE.CylinderGeometry(.052,.047,.13,12),0xeac05a);mug.add(liquid);
 const foam=mesh(new THREE.CylinderGeometry(.054,.054,.018,12),0xf9f2df);mug.add(foam);foam.position.y=.075;
 const stream=mesh(new THREE.CylinderGeometry(.009,.009,.12,6),0xe2af42);stream.name='pub:beer-pour-stream';stream.position.set(-2.4,1.385,-5.3);group.add(stream);
 const plate=mesh(new THREE.CylinderGeometry(.17,.16,.025,18),0xf1eee2);plate.name='pub:moving-dish';const food=mesh(new THREE.SphereGeometry(.12,8,5),0xab6c39);food.scale.y=.25;food.position.y=.04;plate.add(food);group.add(plate);
 const tray=mesh(new THREE.CylinderGeometry(.22,.22,.025,16),0x68777d);tray.name='pub:service-tray';group.add(tray);
 const uniforms=new Map();
 const uniform=p=>{if(!p.v||p.v.work!=='pub'||uniforms.get(p)===p.v.id)return;const old=p.group.getObjectByName('pub:staff-uniform');if(old)p.group.remove(old);const g=new THREE.Group();g.name='pub:staff-uniform';const vest=mesh(new THREE.BoxGeometry(.42,.48,.08),p.v.id%2?0x244c68:0x244739);vest.position.set(0,1.25,.17);g.add(vest);const apron=mesh(new THREE.BoxGeometry(.43,.52,.065),0xe4ddc6);apron.position.set(0,.88,.19);g.add(apron);const badge=mesh(new THREE.BoxGeometry(.11,.045,.015),0xe8ca7a);badge.position.set(.12,1.38,.225);g.add(badge);p.group.add(g);uniforms.set(p,p.v.id)};
 const pointAt=(points,q)=>{const lengths=points.slice(1).map((b,i)=>Math.hypot(b.x-points[i].x,b.z-points[i].z));let d=Math.max(0,Math.min(1,q))*lengths.reduce((a,b)=>a+b,0);for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const f=lengths[i]?Math.min(1,d/lengths[i]):0;return{x:points[i].x+(points[i+1].x-points[i].x)*f,z:points[i].z+(points[i+1].z-points[i].z)*f}}d-=lengths[i]}return points[0]};
 return {attach:list=>{people=list},update:life=>{
  for(const p of people)if(p.v?.step?.kind==='work')uniform(p);
  const state=pubVenue(life),now=(life.day||1)*1440+(life.minute||0),event=life.civic.pubStandards?.alarm||life.civic.pubStandards?.gasLeak?null:state.services.find(e=>!e.returned&&now>=e.at&&now-e.at<60),phase=event?servicePhase(event,now):{kind:'idle'};
  stream.visible=mug.visible=plate.visible=tray.visible=false;
  if(!event){if(actor&&home){actor.pos.copy(home);actor.group.position.copy(home)}actor=null;activeId=null;return}
  if(event.id!==activeId){if(actor&&home){actor.pos.copy(home);actor.group.position.copy(home)}actor=people.find(p=>p.v?.work==='pub'&&p.v.step?.kind==='work'&&p.group.visible);home=actor?.pos.clone()||new THREE.Vector3(.8,0,-6.75);path=routeVisitor(home,{x:-1.1,z:-2.0},colliders,bounds);activeId=event.id;}
  if(phase.kind==='pour'&&event.kind==='beer'){stream.visible=!!actor;mug.visible=true;mug.position.set(-2.4,1.245,-5.3);const fill=Math.max(.05,phase.progress);liquid.scale.y=fill;liquid.position.y=-.065+.065*fill;foam.position.y=-.065+.13*fill;return}
  if(phase.kind==='prepare'){plate.visible=true;plate.position.set(-4.41,1.08,-8.82);return}
  const item=event.kind==='meal'?plate:mug;item.visible=true;item.scale.y=1;liquid.scale.y=1;liquid.position.y=0;foam.position.y=.065;
  if(phase.kind==='served'){item.position.set(-2.4,event.kind==='meal'?.83:.89,-1.2);if(actor&&path){const age=now-event.at,prep=event.kind==='meal'?10:3,p=pointAt([home,...path],1-Math.min(1,(age-prep-9)/9));actor.pos.set(p.x,0,p.z);actor.group.position.copy(actor.pos)}return}
  if(path&&actor&&['carry','return'].includes(phase.kind)){const points=[home,...path],p=pointAt(points,phase.kind==='return'?1-phase.progress:phase.progress);actor.pos.set(p.x,0,p.z);actor.group.position.copy(actor.pos);actor.group.rotation.y=Math.atan2(-2.4-p.x,-1.2-p.z);tray.visible=true;tray.position.set(p.x,1.05,p.z+.3);item.position.set(p.x,event.kind==='meal'?1.08:1.14,p.z+.3);}else item.position.set(-1.4,1.23,-5.4);
 }};
}
