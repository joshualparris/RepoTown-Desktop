import {createKit} from './interior-kit.js';
import {soyReport} from './soy-chain.js';

// Two purpose-built, fully walkable industrial interiors. All machine controls
// sit on the clear work aisle, not inside colliders. Each 3D item operates the
// real finite crop/batch state rather than advancing a decorative popup.
export function buildSoyInterior(site,makeLabel,life){
 const farm=site.id==='soyfarm',k=createKit(site,makeLabel, farm?'Soybean seed shed & field office':'Plant-based drinks processing plant');
 const {THREE,group,box,solid,cyl,ball,text,interactables,sceneObjects}=k;
 k.shell({wall:farm?0x8b9c70:0xd6e0df,ceiling:farm?0x8e8a79:0xe9eded,floor:farm?0x998d74:0x9caeb0,frontSill:.7,sideSill:1.1});
 group.add(new THREE.HemisphereLight(0xe5f7ff,0x67664e,1.6));
 const light=new THREE.PointLight(0xeaf6e9,1.4,18);light.position.set(0,3.7,-2);group.add(light);
 const steel=0x859fa8,seed=0xc2a671;
 // Keep the centre aisle clear from spawn (0,3.75) to back-office counter.
 solid(4.4,.84,.75,0,.42,-9.7,0x59666b);
 box(4.4,.06,.88,0,.88,-9.7,steel);
 text(farm?'FIELD RECORDS · Gwydir soy':'BATCH QA · SOY ALLERGEN',0,2.6,-9.35,'room');
 for(const x of [-5.6,5.6])for(const z of [-7.6,-3.7,.4]){
  const colour=farm?0x846842:steel;
  solid(1.25,.9,1.6,x,.45,z,colour);
  box(1.1,.08,1.5,x,.95,z,farm?0x9d7b48:0xcbdadc);
 }
 if(farm){
  for(let i=0;i<18;i++){
   const x=-5.65+(i%3)*.28,z=-7.95+Math.floor(i/3)*.18;
   ball(.11,x,1.07,z,i%4===0?0x86ab57:0x648940);
  }
  for(let i=0;i<8;i++){
   const x=5.45+(i%2)*.31,z=.0+Math.floor(i/2)*.25;
   ball(.13,x,1.03,z,seed);
  }
  for(let i=0;i<7;i++)box(.06,.85,.06,-5.6+i*.48,1.34,-4.1,0x709b50);
  cyl(.43,.48,.9,5.6,1.43,-3.7,0x84b5bf);
 }else{
  for(const z of [-7.6,-3.7,.4]){
   cyl(.53,.53,.9,-5.6,1.42,z,0xb3c4c9);
   cyl(.08,.09,.46,-5.6,2.12,z,0x829399);
   box(.08,.55,.06,-4.92,1.38,z,0x5e7b86);
   for(let i=0;i<5;i++)box(.17,.25,.17,5.35+i*.12,1.17,z-.3+i*.17,0xe5f0e9);
  }
  box(1.9,.72,.2,0,1.9,-9.34,0x283d44);
 }
 const stages=farm?[
  ['sow','Plant soybean seed',-3.25,-7.0],
  ['irrigate','Irrigation pump',3.1,-5.0],
  ['inspect','Scout crop and pests',-3.1,-.9],
  ['harvest','Harvest and quality check',3.1,2.1]
 ]:[
  ['clean','Grade and wash soybeans',-3.1,-7.0],
  ['soak','Hydration vessel',3.1,-7],
  ['grind','Wet grinder',-3.1,-3.8],
  ['filter','Filter / okara separator',3.1,-3.8],
  ['heat','Heat-process safety interlock',-3.1,-.6],
  ['pack','Pack, label and chill',3.1,-.6],
  ['reject','Quarantine / discard failed batch',-3.1,2.2]
 ];
 for(const [action,label,x,z] of stages){
  const sprite=makeLabel(label,'interactive');sprite.position.set(x,1.9,z);
  sprite.userData.labelKind='interactive';group.add(sprite);
  interactables.push({key:'soy:'+site.id+':'+action,label,type:'civic',room:0,roomName:site.name,
   pos:new THREE.Vector3(x,0,z),act:{do:'soy-action',action,civicId:site.id}});
  sceneObjects.push({type:'civic',label,room:0,pos:{x,z},interactive:true});
  box(.48,.62,.12,x,.83,z-.45,farm?0x73994a:0x5c9eab);
  box(.26,.07,.13,x,1.15,z-.36,0xc9d6d9);
 }
 const readyLamp=cyl(.14,.14,.12,0,1.15,-9.3,0x4e8d61,{e:0x23482f});
 const kpi=()=>{const r=soyReport(life),ready=farm?r.field.phase==='growing':r.batch?.stage==='heating';
  readyLamp.material.color.setHex(ready?0xf1bc58:0x4e8d61);};
 const result=k.finish({staff:{pos:{x:0,z:-10.3},use:{x:0,z:-8.65}},soyVisuals:kpi});
 // Farm/processing inspector can open town ledger and view all inventory.
 k.add('trace','Batch and crop ledger','civic-ledger','Trace farm inputs, production, expiry and refrigerated delivery to the café.',0,-8.65);
 return result;
}
