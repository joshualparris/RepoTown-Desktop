import * as THREE from 'three';
import { emergencyState } from './emergency-justice.js';

// Lightweight visual layer for the fictional dispatch state machine.
// Each allocated service has one vehicle; crew only appear after reaching the scene.
const PALETTE = {
  police: {body:0xf2f2ee,stripe:0x27518c,light:0x2c67f8,crew:0x254a81},
  ambulance: {body:0xf2f1e8,stripe:0xbe293b,light:0x3b74ff,crew:0x275849},
  fire: {body:0xc92e28,stripe:0xf1e57f,light:0xee3535,crew:0xd5bd50}
};
const box=(parent,color,w,h,d,x,y,z)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
    new THREE.MeshLambertMaterial({color}));
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
};
function makeUnit(service){
  const p=PALETTE[service],group=new THREE.Group(),body=new THREE.Group();
  group.add(body);
  const length=service==='fire'?5.9:service==='ambulance'?5.0:4.3;
  box(body,0x262b31,2.25,.6,length,0,.65,0);
  box(body,p.body,2.18,1.45,length-.25,0,1.55,0);
  box(body,p.stripe,2.22,.31,length-.22,0,1.42,0);
  box(body,0x253b4b,1.94,.60,.11,0,2.05,-length/2+.12);
  box(body,p.light,1.16,.16,.35,0,2.4,0);
  for(const x of [-1.05,1.05])for(const z of [-length*.32,length*.32]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.24,10),
      new THREE.MeshLambertMaterial({color:0x17191b}));
    wheel.rotation.z=Math.PI/2;wheel.position.set(x,.5,z);body.add(wheel);
  }
  const responders=[];
  for(let i=0;i<(service==='ambulance'?2:service==='fire'?3:2);i++){
    const person=new THREE.Group();
    box(person,p.crew,.55,.95,.38,0,1.05,0);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.27,8,6),new THREE.MeshLambertMaterial({color:0xc79976}));
    head.position.y=1.72;person.add(head);
    person.visible=false;group.add(person);responders.push(person);
  }
  return {group,body,responders};
}
const now=life=>(life.day-1)*1440+life.minute;
const blend=(a,b,f)=>a+(b-a)*Math.max(0,Math.min(1,f));
export function createEmergencyResponseVisuals(life,town){
  const units=new Map(),root=new THREE.Group();
  root.name='Visible 000 emergency response';
  town.group.add(root);
  function update(time=0){
    const state=emergencyState(life),minute=now(life),active=new Set();
    for(const incident of state.incidents){
      if(!incident.location)continue;
      const finish=incident.closedAt??(incident.status==='resolved'?minute:Infinity);
      if(minute>finish+2)continue;
      for(const [index,service] of incident.dispatched.entries()){
        if(!PALETTE[service])continue;
        const key=incident.id+':'+service;active.add(key);
        let unit=units.get(key);
        if(!unit){unit=makeUnit(service);root.add(unit.group);units.set(key,unit);}
        const home=life.place(service),destination=incident.location;
        if(!home)continue;
        const start={x:home.x,z:home.side==='south'?home.curb?.z??home.z-9:home.z+9};
        // Travel on the main road, then turn toward the reported location.
        const roadZ=home.side==='south'?start.z-3:start.z+3;
        const roadTarget={x:destination.x,z:roadZ};
        const age=minute-incident.at;
        const progress=Math.max(0,Math.min(1,(age-1)/4));
        let x,z;
        if(progress<.18){x=blend(start.x,start.x,progress/.18);z=blend(start.z,roadZ,progress/.18);}
        else if(progress<.78){x=blend(start.x,roadTarget.x,(progress-.18)/.60);z=roadZ;}
        else{x=destination.x;z=blend(roadZ,destination.z+3.5,(progress-.78)/.22);}
        // The scene simulation reports arrival at minute five; never show responders before that.
        const arrived=age>=5&&['on-scene','investigating','resolved'].includes(incident.status);
        unit.group.position.set(x,0,z);
        const facing=progress<.18?Math.sign(roadZ-start.z):progress<.78?Math.sign(destination.x-start.x):Math.sign(destination.z-roadZ);
        unit.body.rotation.y=progress<.18?(facing<0?Math.PI:0):progress<.78?(facing<0?-Math.PI/2:Math.PI/2):(facing<0?Math.PI:0);
        unit.responders.forEach((r,i)=>{
          r.visible=arrived;
          r.position.set((i-1)*.95,0,arrived?2.1+index*1.7:0);
        });
        const lamp=unit.body.children[4]; // light bar, after chassis, body, stripe, windshield
        if(lamp?.material?.color)lamp.material.color.setHex(Math.floor(time*6)%2?0xffffff:PALETTE[service].light);
      }
    }
    for(const [key,unit] of units)if(!active.has(key)){
      root.remove(unit.group);unit.group.traverse(o=>{
        o.geometry?.dispose();
        if(o.material&&!Array.isArray(o.material))o.material.dispose();
      });units.delete(key);
    }
  }
  return {update,count:()=>units.size};
}
