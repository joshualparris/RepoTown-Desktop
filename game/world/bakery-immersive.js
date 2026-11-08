import {workAssetFault} from './occupation-work.js';
import * as THREE from 'three';
import { superviseBread } from './bakery-production.js';
const M=(color)=>new THREE.MeshLambertMaterial({color});
const block=(parent,color,w,h,d,x,y,z)=>{
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(color));m.position.set(x,y,z);parent.add(m);return m;
};
const now=l=>l.day*1440+l.minute;
function bakeryState(life){
 life.civic.bakeryHands??={day:life.day,shapes:0,kneads:0,holding:null,order:null,served:0,sequence:0,cooledAt:null};
 const s=life.civic.bakeryHands;
 if(s.day!==life.day){Object.assign(s,{day:life.day,shapes:0,kneads:0,holding:null,order:null,sequence:0,cooledAt:null});}
 return s;
}
export function installBakeryImmersion(built,life,camera,makeLabel){
 const root=new THREE.Group();root.name='Animated bakery handling';built.group.add(root);
 const dough=new THREE.Mesh(new THREE.SphereGeometry(.24,12,8),M(0xe6d7b5));
 dough.scale.set(1.4,.5,1);dough.position.set(-1.4,1.20,-3.45);root.add(dough);
 const mixerPaddle=block(root,0x9ba3a1,.42,.05,.1,-1.4,1.4,-3.45);
 const mixerStatus=block(root,0x729e6d,.1,.1,.1,-1.6,1.65,-3.45);
 const tray=new THREE.Group();tray.position.set(1.3,1.13,-3.45);root.add(tray);
 block(tray,0x929ba0,1,.045,.62,0,0,0);
 const rolls=[];
 for(let i=0;i<4;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.12,9,6),M(0xe2c9a3));m.scale.set(1,.64,1);m.position.set((i%2-.5)*.45,.12,(Math.floor(i/2)-.5)*.26);tray.add(m);rolls.push(m);}
 const door=new THREE.Group();door.position.set(-.5,1.1,-3.53);root.add(door);
 block(door,0x636971,1.15,.58,.07,0,0,0);
 block(door,0x273039,.7,.35,.085,0,0,.07);
 const hands=new THREE.Group();hands.name='First-person bakery hands';camera.add(hands);
 const left=block(hands,0xc99877,.20,.22,.60,-.38,-.38,-.80),right=block(hands,0xc99877,.20,.22,.60,.38,-.38,-.80);
 const carried=block(hands,0x9ba0a4,.95,.045,.55,0,-.48,-.95);
 const packageMesh=block(hands,0xc99654,.4,.25,.29,0,-.37,-.96);
 const added=[];
 const station=(key,label,x,z)=>{
  const tag=makeLabel(label,'interactive');tag.position.set(x,1.9,z);tag.userData.labelKind='interactive';built.group.add(tag);
  const item={key:'bakery-immersive:'+key,label,type:'civic',room:0,roomName:'Bakery',pos:new THREE.Vector3(x,0,z),act:{do:'bakery-immersive',action:key}};
  built.interactables.push(item);added.push(item);
 };
 station('knead','Knead dough',-1.4,-2.65);
 station('shape','Shape next loaf',-.35,-2.65);
 station('take-tray','Pick up baking tray',1.3,-2.65);
 station('oven','Open oven / load tray',2.6,-2.65);
 station('rack','Cooling rack / collect',3.8,-2.65);
 function act(action){
  const s=bakeryState(life),bakery=life.place('bakery'),batch=life.civic.bakeryBatch;
  if(['knead','shape','take-tray','oven','rack'].includes(action)){
   if(action==='take-tray'&&batch?.phase==='shaped'){s.holding='tray';return superviseBread(life,'proof').message;}
   if(action==='oven'){const result=superviseBread(life,'oven');if(result.ok)s.holding=null;return result.message;}
   if(action==='rack')return superviseBread(life,batch?.phase==='baking'?'unload':'pack').message;
   if(action==='knead'){const result=superviseBread(life,'mix');if(result.ok)s.kneads=4;return result.message;}
   if(action==='shape'){const result=superviseBread(life,'shape');if(result.ok)s.shapes=Math.ceil((batch?.shapes||0)/2);return result.message;}
   return 'Weigh and shape the complete batch before carrying it to the proofer.';
  }
  return 'Unknown bakery station.';
 }
 function update(dt,time){
  const s=bakeryState(life),batch=life.civic.bakeryBatch;
  const faulty=workAssetFault(life,'bakery-mixer');mixerPaddle.rotation.y=faulty?0:time*2;mixerStatus.material.color.setHex(faulty?0xb95a43:0x729e6d);
  dough.scale.y=.5+Math.min(1,s.kneads/4)*.26+.07*Math.sin(time*5);
  rolls.forEach((r,i)=>r.visible=i<s.shapes);
  tray.visible=s.holding!=='tray';
  const open=batch?.phase==='proofing'||s.holding==='tray';
  door.rotation.x+=( (open?-.9:0)-door.rotation.x)*Math.min(1,dt*6);
  hands.visible=!!s.holding || (time%8<.8&&s.kneads>0);
  carried.visible=s.holding==='tray';packageMesh.visible=['bread','pie'].includes(s.holding);
  const swing=.025*Math.sin(time*7);hands.position.y=s.holding?swing:0;

 }
 function dispose(){
  camera.remove(hands);
  hands.traverse(o=>{o.geometry?.dispose();if(o.material?.dispose)o.material.dispose();});
 }
 return {act,update,dispose};
}
