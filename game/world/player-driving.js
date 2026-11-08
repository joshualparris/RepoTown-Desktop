// Third-person, physically blocked vehicles. Uses the same Input joystick/keys
// and CollisionWorld as the pedestrian. Only owned, registered vehicles work.
import * as THREE from 'three';
import { VEHICLE_MODELS } from './vehicles.js';
import {updateCoolantTemperature} from './driving-instruments.js';
import { onPlannedOrCoreRoad } from './masterplan-built.js';
import { onNarromineRoad, onOpenHighway, HIGHWAY } from './narromine-layout.js';
import { lightingLevel } from './lighting.js';
import { nightLightLevel } from './estate-lighting.js';
import {vehicleSpec,intendedSpeedMs,accelerationMs2,transmissionFor,clamp as vehicleClamp} from './vehicle-dynamics.js';
const MODEL={hatch:[1.65,3.4,0x397fbc,11],sedan:[1.84,4.4,0xb1b9c4,12],
 ute:[1.9,4.7,0xb78648,11],van:[2.05,5.4,0xe8e3d8,9],truck:[2.25,6.6,0x9a4d40,8]};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const r2=n=>Math.round(n*100)/100;
export function modelMesh(model){
 const base=MODEL[model]||MODEL.hatch;
 const spec=vehicleSpec(model),w=spec.width,d=spec.length;
 const colour=({supercar:0xe02c23,gt:0x3c4a60,muscle:0x24262a,motorbike:0x202e56,scooter:0x78a5bd})[model]??base[2];
 const g=new THREE.Group(),bodyMat=new THREE.MeshLambertMaterial({color:colour}),windowMat=new THREE.MeshLambertMaterial({color:0x9dc3d4}),
  wheelMat=new THREE.MeshLambertMaterial({color:0x28282b}),
  lightMat=new THREE.MeshLambertMaterial({color:0xfff6d9,emissive:0xfff0c0,emissiveIntensity:0});
 const cube=(mat,x,y,z,ww,hh,dd)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(ww,hh,dd),mat);m.position.set(x,y,z);g.add(m);};
 if(spec.kind==='bike'){
   // Narrow tank, seat, handlebar and TWO fore/aft wheels; not a narrow box car.
   const wheelR=model==='scooter'?.29:.36;
   for(const z of [-d*.36,d*.36]){
     const wh=new THREE.Mesh(new THREE.CylinderGeometry(wheelR,wheelR,.13,16),wheelMat);
     wh.rotation.z=Math.PI/2;wh.position.set(0,wheelR,z);g.add(wh);
   }
   cube(bodyMat,0,.74,-.1,w*.77,.36,d*.56);
   cube(wheelMat,0,.97,d*.16,w*.68,.16,.65);
   cube(windowMat,0,1.17,-d*.30,w*.85,.055,.08);
   cube(bodyMat,0,.63,d*.27,w*.44,.28,.36);
   cube(lightMat,0,.93,-d*.49,.32,.25,.14);
 } else {
   const sports=['supercar','gt','muscle'].includes(model);
   const roofHeight=model==='supercar'?.25:sports?.42:.55;
   cube(bodyMat,0,model==='supercar'?.55:.65,0,w,model==='supercar'?.48:.68,d);
   cube(windowMat,0,model==='supercar'?.89:1.19,.04,w*.82,roofHeight,d*(model==='supercar'?.38:.47));
   if(model==='supercar'){
     // Fictional wedge silhouette, low nose, side intakes, rear diffuser and wing.
     cube(bodyMat,0,.43,-d*.40,w*.86,.28,d*.24);
     cube(wheelMat,0,.49,d*.48,w*.81,.19,.27);
     cube(wheelMat,0,1.10,d*.42,w*.92,.075,.22);
     for(const x of [-w*.43,w*.43])cube(wheelMat,x,.61,.17,.1,.24,.72);
   } else if(model==='muscle'){
     cube(bodyMat,0,.94,-d*.25,w*.68,.20,d*.28);
     cube(wheelMat,0,1.48,d*.39,w*.88,.07,.20);
   } else if(model==='gt'){
     cube(bodyMat,0,.68,-d*.43,w*.84,.30,d*.14);
   }
   for(const x of [-w*.49,w*.49])for(const z of [-d*.34,d*.34]){
     const wh=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.19,10),wheelMat);
     wh.rotation.z=Math.PI/2;wh.position.set(x,.38,z);g.add(wh);
   }
   for(const x of [-w*.3,w*.3])cube(lightMat,x,.76,-d*.5-.045,.31,.19,.12);
 }
 // Forward is local -Z in this car model. Both lamps and their targets share
 // the car's transform, so steering rotates the illuminated road area.
 const headlights=[];
 for(const x of (spec.kind==='bike'?[0]:[-w*.29,w*.29])){
   const lamp=new THREE.SpotLight(0xfff1da,0,62,.31,.58,1.4);
   lamp.name='Active vehicle low-beam headlight';
   lamp.position.set(x,spec.kind==='bike'?.92:.77,-d*.5-.12);
   lamp.target.position.set(x*.65,.06,-d*.5-32);
   lamp.castShadow=false;g.add(lamp,lamp.target);headlights.push(lamp);
 }
 g.userData.headlights={beams:headlights,lenses:lightMat,level:0};
 return g;
}
export function headlightLevel(daylight){return lightingLevel(nightLightLevel(daylight));}
export function setVehicleHeadlights(mesh,daylight,engineOn){
  const rig=mesh?.userData?.headlights;
  if(!rig)return 0;
  const level=engineOn?headlightLevel(daylight):0;
  rig.level=level;
  rig.lenses.emissiveIntensity=2.4*level;
  for(const beam of rig.beams){beam.intensity=1600*level;beam.visible=level>0.001;}
  return level;
}
export function roadAllows(x,z){
 // Streets, avenues and the master-plan roads, each bounded to its drawn extent: the old check
 // treated every street and avenue as infinitely long, so cars could leave the map along them.
 return onPlannedOrCoreRoad(x,z)||onNarromineRoad(x,z);   // + Mitchell Highway and Narromine streets
}
// Lane assist: with no steering input, gently steer towards the centre of the
// left-hand lane (Australia drives on the left). Probes the drivable road edges
// across the road at a look-ahead point, so it follows any road shape that
// roadAllows() knows. It never overrides the driver's own steering and does
// nothing on very wide or unknown surfaces. Returns the heading error in radians.
export function laneAssistSteer(x,z,yaw,speed,allows=roadAllows){
 if(speed<4)return 0;
 const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
 const ahead=clamp(speed*1.1,8,22),px=x+fx*ahead,pz=z+fz*ahead;
 if(!allows(x,z)||!allows(px,pz))return 0;
 const edge=(sx)=>{let d=0;while(d<14&&allows(px+rx*sx*(d+.25),pz+rz*sx*(d+.25)))d+=.25;return d;};
 const left=edge(-1),right=edge(1),width=left+right;
 if(width<4.5||width>=27)return 0;
 const target=(right-left)/2-width/4;          // offset of the left-lane centre, + = to the right
 return -Math.atan2(target,ahead);             // negative = turn right (yaw decreases)
}
export function createPlayerDriving(life,scene,collision,player,camera,input){
 const meshes=new Map();let active=null,speed=0,message='';
 // Camera views while driving, switched with V or the 🎥 button and remembered on this device.
 const VIEWS=['chase','rider','high'],VIEW_NAMES={chase:'Chase view',rider:"Rider's-eye view",high:'High view'};
 let view='chase';try{const saved=localStorage.getItem('town.driveView');if(VIEWS.includes(saved))view=saved;}catch{}
 let laneAssist=false;try{laneAssist=localStorage.getItem('town.laneAssist')==='on';}catch{}
 function siteSpawn(i,self){
   const site=life.place('dealership');
   if(!site)return null;
   // Use the marked roadside parking bays, not the busy doorway or a back
   // paddock with no road access. Only choose a currently clear space.
   const spots=[[9,1.0],[11,1.0],[-9,1.0],[-11,1.0],[9,-.6],[-9,-.6],[13,-.6],[-13,-.6]];
   for(let attempt=0;attempt<spots.length;attempt++){
     const [ox,oz]=spots[(attempt+i)%spots.length];
     const x=site.x+ox,z=site.curb.z+oz;
     if(!roadAllows(x,z)||collision.hits(x,z,1.25))continue;
     if(life.trucks.some(tr=>Math.hypot(tr.x-x,tr.z-z)<5))continue;
     if(life.villagers.some(person=>!person.inside&&Math.hypot(person.x-x,person.z-z)<3.5))continue;
     if((life.civic.motor?.owned||[]).some(v=>v!==self&&Number.isFinite(v.x)&&
       Math.hypot(v.x-x,v.z-z)<3.5))continue;
     return {x,z};
   }
   return null; // Never hide an unavailable parking spot by teleporting through traffic.
 }
 function sync(){
   const owned=life.civic.motor?.owned||[],ids=new Set(owned.map(v=>v.registration));
   for(const [reg,g] of meshes)if(!ids.has(reg)){scene.remove(g);meshes.delete(reg);if(active===reg){active=null;speed=0;}}
   owned.forEach((v,i)=>{
     if(!Number.isFinite(v.x)||!Number.isFinite(v.z)||v.parkingPending){
       const p=siteSpawn(i,v);
       if(p){v.x=p.x;v.z=p.z;v.yaw=0;v.speed=0;v.parkingPending=false;}
       else if(!Number.isFinite(v.x)||!Number.isFinite(v.z))return;
       // When every roadside bay is temporarily occupied, keep the vehicle
       // parked as titled until a clear bay exists; never spawn inside a wall.
     }
     if(!meshes.has(v.registration)){const g=modelMesh(v.model);scene.add(g);meshes.set(v.registration,g);}
     const g=meshes.get(v.registration);g.position.set(v.x,0,v.z);g.rotation.y=v.yaw||0;
     setVehicleHeadlights(g,life.daylight(),active===v.registration);
   });
 }
 function nearest(x=player.pos.x,z=player.pos.z,range=3.1){
   sync();let best=null,dist=range;
   for(const v of life.civic.motor?.owned||[]){
     const d=Math.hypot(v.x-x,v.z-z);
     if(d<dist){dist=d;best=v;}
   }
   return best;
 }
 function enter(v){
   if(v?.workVehicle==='depot'&&life.civic.jobs?.active?.id!=='delivery-driver'&&!(life.civic.deliveryWork?.route?.registration===v.registration&&!life.civic.deliveryWork.route.returnedAt&&['loaded','completed'].includes(life.civic.deliveryWork.route.status)))return 'Start a depot delivery shift to use the employer van.';
   if(!v||active)return 'Get out before entering another vehicle.';
   if(life.day>v.regoUntil||!v.roadworthy||v.condition<60)return 'Registration or roadworthy expired; see Town Motor Workshop.';
   if((v.fuel||0)<=0)return 'Fuel tank empty. Buy fuel at High Street Motors.';
   if(Math.hypot(player.pos.x-v.x,player.pos.z-v.z)>3.1)return 'Walk to the driver door to enter.';
   if(collision.hits(v.x,v.z,1.05))return 'The vehicle is blocked. Move it to a clear parking space before driving.';
   v.parkingPending=false;active=v.registration;speed=0;player.seated=null;input.reset();
   setVehicleHeadlights(meshes.get(active),life.daylight(),true);
   if(!Number.isFinite(v.coolantTemp))v.coolantTemp=22;
   return 'Engine started. W/S or joystick forwards/back; A/D or joystick steer; E or ✋ to get out when stopped.';
 }
 function exit(){
   if(!active)return 'Not driving.';
   if(Math.abs(speed)>.35)return 'Brake to a complete stop before exiting.';
   const v=life.civic.motor.owned.find(x=>x.registration===active);
   if(!v){active=null;return 'Vehicle unavailable.';}
   for(const radius of [2.1,2.7,3.4]){
     for(let i=0;i<16;i++){
       const angle=(v.yaw||0)+Math.PI/2+i*Math.PI/8,x=v.x+Math.cos(angle)*radius,z=v.z+Math.sin(angle)*radius;
       if(!collision.hits(x,z,player.radius+.1)){
         player.place(x,z,v.yaw);setVehicleHeadlights(meshes.get(active),life.daylight(),false);if(meshes.get(active))meshes.get(active).visible=true;
         active=null;speed=0;return 'Parked, handbrake on. You got out safely.';
       }
     }
   }
   return 'No clear place to exit; move to a parking bay.';
 }
 function update(dt){
   sync();if(!active)return false;
   const v=life.civic.motor.owned.find(x=>x.registration===active);
   if(!v){active=null;return false;}
   const m=input.movement();input.takeLook();
   if(input.consume('use')){message=exit();if(!active)return false;}
   const spec=vehicleSpec(v.model),top=spec.topKmh/3.6;
   // Automatic gears/RPM follow speed and throttle. Street speed limit applies to
   // all vehicles, including Ferraris, unless the user enables CHEAT closed-course.
   const throttle=-m.z;
   // Off-road is allowed (it is the driver's choice, legal or not) but slow and rough: grass, dirt and
   // footpaths cap cars at 30 km/h and bikes at 40, with four times the wear. Buildings, walls,
   // people and the world edge still stop the vehicle.
   const offRoad=!roadAllows(v.x,v.z),offRoadCap=(spec.kind==='bike'?40:30)/3.6;
   let desired=intendedSpeedMs(v.model,throttle,{unrestricted:v.cheat===true&&v.cheatUnrestricted===true,...(onOpenHighway(v.x,v.z)?{limitKmh:HIGHWAY.speed}:{})});
   if(offRoad)desired=clamp(desired,-offRoadCap*.5,offRoadCap);
   if(offRoad&&!v.offRoad)message='Off-road: rough going and extra wear. Driving on footpaths or parks is an offence in NSW.';
   if(!offRoad&&v.offRoad)message='Back on the road.';
   v.offRoad=offRoad;
   const accel=throttle<-.01?Math.min(3,accelerationMs2(v.model,speed,throttle)):accelerationMs2(v.model,speed,throttle);
   const braking=throttle===0?8.5:accel;
   speed+=clamp(desired-speed,-braking*dt,braking*dt);
   if(life.day>v.regoUntil||!v.roadworthy||v.condition<60||(v.fuel||0)<=0)speed=0;
   let yaw=v.yaw||0;
   if(Math.abs(speed)>.2)yaw-=m.x*(speed<0?-1:1)*clamp(Math.abs(speed)/Math.min(top,16),0,.9)*(spec.kind==='bike'?1.65:1.25)*dt;
   // Driver steering always wins; assist only acts hands-off, going forwards on a road.
   if(laneAssist&&Math.abs(m.x)<.08&&speed>0&&!offRoad)yaw+=clamp(laneAssistSteer(v.x,v.z,yaw,speed)*1.6,-.5,.5)*dt;
   // Swept substeps prevent a 50km/h+ car from jumping through pedestrians,
   // walls or road margins in a slow mobile frame.
   const steps=Math.max(1,Math.ceil(Math.abs(speed)*dt/.7));
   let distance=0,blocked=false;
   for(let step=0;step<steps;step++){
     const dx=-Math.sin(yaw)*speed*dt/steps,dz=-Math.cos(yaw)*speed*dt/steps;
     const nx=v.x+dx,nz=v.z+dz;
     // People and other vehicles stop the car only when it would move closer to them, so a car that
     // starts overlapping one (a cheat car summoned onto another) can always drive away.
     const closing=(o,r)=>{const now=Math.hypot(v.x-o.x,v.z-o.z),next=Math.hypot(nx-o.x,nz-o.z);return next<r&&next<now;};
     const pedestrian=life.villagers.some(p=>!p.inside&&closing(p,spec.kind==='bike'?1.25:2.2));
     const parked=(life.civic.motor.owned||[]).some(o=>o!==v&&Number.isFinite(o.x)&&closing(o,(spec.length+vehicleSpec(o.model).length)*.35));
     if(pedestrian||parked||collision.hits(nx,nz,Math.min(1.15,spec.width/2+.1))){blocked=true;break;}
     distance+=Math.hypot(dx,dz);v.x=nx;v.z=nz;
   }
   v.yaw=yaw;
   v.odometer=(v.odometer||0)+distance/1000;
   // The original game fuel economy is highly compressed; retain save-game
   // compatibility while differentiating heavy trucks and smaller bikes.
   v.fuel=Math.max(0,(v.fuel||0)-distance*(spec.kind==='bike'?.0012:v.model==='truck'?.0045:.003));
   v.condition=r2(Math.max(0,(v.condition||100)-distance*(offRoad?.00032:.00008)));
   if(v.condition<60)v.roadworthy=false;
   if(blocked){speed=0;message='Brake! Pedestrian, vehicle or obstruction ahead.';}
   v.speed=speed;
   const transmission=transmissionFor(v.model,speed,throttle);
   v.gear=transmission.gear;v.rpm=transmission.rpm;v.throttle=Math.max(0,Math.min(1,throttle));   // accelerator position, for engine load in vehicle-audio.js
   v.coolantTemp=updateCoolantTemperature(v.coolantTemp,dt,speed,v.condition);
   player.pos.set(v.x,0,v.z);player.yaw=v.yaw||0;player.pitch=0;
   placeCamera(v,spec);
   return true;
 }
 // The camera looks well down the road, so the vehicle sits low in the frame instead of filling it
 // (on the motorbike the rider's back used to hide where you were going).
 function placeCamera(v,spec){
   const sin=Math.sin(v.yaw||0),cos=Math.cos(v.yaw||0),mesh=meshes.get(v.registration);
   if(mesh)mesh.visible=view!=='rider';
   if(view==='rider'){
     const eye=spec.kind==='bike'?1.55:v.model==='truck'?2.4:1.25;
     camera.position.set(v.x-sin*.2,eye,v.z-cos*.2);
     camera.lookAt(v.x-sin*25,eye-.6,v.z-cos*25);
     return;
   }
   const high=view==='high',follow=(spec.kind==='bike'?6:9+(v.model==='truck'?4:0))*(high?1.8:1),height=high?11:spec.kind==='bike'?3.4:4.6;
   camera.position.set(v.x+sin*follow,height,v.z+cos*follow);
   camera.lookAt(v.x-sin*(high?14:10),high?0:1,v.z-cos*(high?14:10));
 }
 function cycleView(){
   view=VIEWS[(VIEWS.indexOf(view)+1)%VIEWS.length];
   try{localStorage.setItem('town.driveView',view);}catch{}
   const v=activeVehicle();if(v)placeCamera(v,vehicleSpec(v.model));
   return VIEW_NAMES[view]+' (V or 🎥 to change)';
 }
 function toggleLaneAssist(){
   laneAssist=!laneAssist;try{localStorage.setItem('town.laneAssist',laneAssist?'on':'off');}catch{}
   return laneAssist?'Lane assist ON: let go of steering and the car keeps to the left lane. Steer any time to take over. K or the lane button switches it off.':'Lane assist OFF.';
 }
 function activeVehicle(){return active?life.civic.motor.owned.find(v=>v.registration===active)||null:null;}
 function headlightStatus(){const rig=meshes.get(active)?.userData?.headlights;
   return {active:!!active,on:!!rig&&rig.level>0.01,level:rig?.level||0,beamCount:rig?.beams.length||0,
     beamsLit:rig?.beams.filter(b=>b.intensity>0).length||0};}
 return {sync,nearest,enter,exit,update,activeVehicle,headlightStatus,cycleView,toggleLaneAssist,get laneAssist(){return laneAssist;},get view(){return view;},get driving(){return !!active;},get message(){return message;},clearMessage(){message='';}};
}
