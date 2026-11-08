import {routeVisitor} from './shop-visitors.js';
import {occupationState,workAssetFault} from './occupation-work.js';
import * as THREE from 'three';
import { JOB_BOARD } from './jobs.js';

// Each step is an object the player must approach in 3D and use repeatedly.
// The stage is stored on the current paid shift, not on a disposable popup.
const STATIONS={
  store:[[-4.45,-2.6],[1.25,2.45],[4.55,-3.5]],
  bakery:[[-3.0,-1.7],[0.1,-1.7],[3.0,-1.7]],
  coop:[[-3.3,-2.5],[0.2,-2.4],[3.3,-2.5]],
  garden:[[-3.3,-2.5],[0.2,-2.4],[3.3,-2.5]],
  depot:[[-3.2,-2.4],[0.4,-2.6],[3.3,-2.5]],
  post:[[-3,-2.5],[0,-2.4],[3.1,-2.5]],
  hall:[[-3,-2.5],[0,-2.4],[3.1,-2.5]]
};
const CAPTIONS={
  'check-expiry':['Inspect date on carton','Separate old carton','Record the dated batch'],
  'refill-shelves':['Take box from delivery trolley','Put goods on lower shelf','Fill upper shelf'],
  'count-stock':['Count left-hand shelf','Count right-hand shelf','Record the inventory'],
  'wash-hands':['Turn on handwash tap','Wash hands','Dry hands'],
  'prep-bench':['Sanitise the preparation bench','Check recipe and measure flour','Mix, knead and shape dough onto trays'],
  cooling:['Check rack space and protect hot trays','Move cooled demonstration loaves to the rack','Bag and correctly label the bread'],
  'water-plants':['Fill watering can','Water first crop row','Water second crop row'],
  'weed-beds':['Pull weeds from bed one','Clear bed two','Put weeds in green bin'],
  'pack-produce':['Pick produce','Fill crate','Stack packed crate'],
  'sort-freight':['Collect incoming parcel','Sort parcel by destination','Place parcel on correct pallet'],
  'verify-manifest':['Read consignment label','Check freight manifest','Mark item received'],
  'stack-parcels':['Lift small parcel','Place parcel safely','Secure the stack'],
  'sort-mail':['Collect unsorted mail','Sort first delivery round','Sort second delivery round'],
  'label-parcels':['Check delivery address','Attach destination label','Put parcel in dispatch tub'],
  'prepare-route':['Check delivery sheet','Load mail bag','Ready delivery round'],
  'clean-floors':['Collect cleaning equipment','Mop first section','Mop second section'],
  'file-records':['Collect office files','Sort files by date','File in cabinet'],
  'inspect-lighting':['Inspect first fixture','Check second fixture','Record fault-free inspection']
};
const cube=(group,color,w,h,d,x,y,z)=>{
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));
 m.position.set(x,y,z);group.add(m);return m;
};
export function installPhysicalJobs(built,site,makeLabel,life){
 if(['store','cafe'].includes(site.id))return;
 const def=JOB_BOARD.find(d=>d.site===site.id&&['depot-sorter','civic-cleaner'].includes(d.id))||JOB_BOARD.find(d=>d.site===site.id);
 if(!def)return;
 const stations=STATIONS[site.id]||STATIONS.hall;
 const root=new THREE.Group();root.name='Hands-on workplace stations';built.group.add(root);
 const actors=[];
 const extras=[];
 if(site.id==='hall'){
   const lamp=cube(root,0x777b72,.28,.3,.28,4.7,2.1,-.8);
   const light=new THREE.PointLight(0xffe4a8,0,5);light.position.copy(lamp.position);root.add(light);
   const tap=cube(root,0xa5b4b8,.1,.3,.1,4.4,1,-.8),drip=cube(root,0x85c5df,.025,.35,.025,4.4,.7,-.8);
   const spill=cube(root,0x6e9da7,1.2,.014,.65,-2.6,.025,-.7);
   const sign=cube(root,0xe8bf37,.3,.4,.08,-1.8,.2,-.8);
   const litter=Array.from({length:3},(_,i)=>cube(root,0xc9bc9b,.15,.025,.2,-3+i*.3,.032,-.6+i*.18));
   extras.push(()=>{const s=occupationState(life),lit=s.trades.assets?.['hall-lamp']?.restored;light.intensity=lit?1.7:0;lamp.material.color.setHex(lit?0xffecaf:0x777b72);drip.visible=workAssetFault(life,'hall-tap');spill.visible=s.hall.spill;sign.visible=!!s.hall.wetUntil;litter.forEach((m,i)=>m.visible=i<s.hall.rubbish);});
 }
 if(site.id==='coop'){
  const feed=cube(root,0xc9b06a,.7,.1,.35,-3,.45,-1.2),eggs=Array.from({length:2},(_,i)=>cube(root,0xe7ddc4,.2,.15,.16,.3*i,.65,-1.2));
  extras.push(()=>{const s=occupationState(life).coop;feed.visible=s.fed;eggs.forEach(m=>m.visible=!!s.basket||s.packed);});
 }
 if(site.id==='garden'){
   const weeds=Array.from({length:3},(_,i)=>cube(root,0x435f32,.14,.3,.1,-2.9+i*.4,.15,-1.1));
   const crate=cube(root,0x8b613c,.65,.4,.5,3,.2,-1.2);
   extras.push(()=>{const s=occupationState(life).garden;weeds.forEach((m,i)=>m.visible=i<s.weeds);crate.visible=!!s.crate||s.harvested;});
 }
 def.tasks.forEach((task,index)=>{
   const preferred=stations[index];
   const candidates=[];for(let dx=-3;dx<=3;dx+=.5)for(let dz=-3;dz<=3;dz+=.5)candidates.push([preferred[0]+dx,preferred[1]+dz]);
   candidates.sort((a,b)=>Math.hypot(a[0]-preferred[0],a[1]-preferred[1])-Math.hypot(b[0]-preferred[0],b[1]-preferred[1]));
   const point=candidates.find(([x,z])=>!built.colliders.some(c=>x>c.x0-.65&&x<c.x1+.65&&z>c.z0-.65&&z<c.z1+.65)&&routeVisitor(built.spawn,{x,z},built.colliders,built.bounds,.3));
   if(!point)throw new Error('No reachable work station at '+site.id+':'+task);
   const [x,z]=point,g=new THREE.Group();
   g.position.set(x,0,z);root.add(g);
   // A small equipment trolley with physical products that change as work progresses.
   cube(g,site.id==='bakery'?0xa3b0b5:0x554b40,.92,.72,.62,0,.36,0);
   cube(g,0xd6b780,.98,.10,.68,0,.76,0);
   if(site.id==='bakery'){
     // Distinct equipment: blue handwash basin, steel flour bench, golden cooling rack.
     const equipment=[0x4a9dbb,0xe2dac3,0xd29a4f][index];
     cube(g,equipment,.79,.08,.45,0,.86,0);
     if(index===0)cube(g,0xd9eef0,.16,.25,.16,.30,1.03,-.12);
     if(index===1)cube(g,0xe9dfc7,.32,.09,.25,-.20,1.05,0);
     if(index===2)for(const h of [.32,.52])cube(g,0x999c9d,.86,.035,.51,0,h,.02);
   }
   const pieces=[];
   for(let n=0;n<3;n++){
     const isStore=site.id==='store',colour=isStore?([0xb88945,0x4c8d65,0x477ba2][n]):[0xc18c53,0x8aaf77,0x9f9d87][n];
     const item=cube(g,colour,.22,.27,.25,(n-1)*.26,.99,0);
     pieces.push(item);
   }
   const tag=makeLabel(task.replace(/-/g,' '),'interactive');
   tag.position.set(x,1.94,z);tag.userData.labelKind='interactive';built.group.add(tag);
   built.interactables.push({
     key:'job:'+site.id+':'+task,label:'Work: '+task.replace(/-/g,' '),
     type:'civic',room:0,roomName:site.name,pos:new THREE.Vector3(x,0,z),
     act:{do:'physical-job',task,index,civicId:site.id}
   });
   actors.push({task,shownTask:task,tag,pieces,index,item:built.interactables.at(-1)});
 });
 built.workStationVisuals=()=> {
   const shift=life.jobsReport().active;
   for(const update of extras)update();
   for(const a of actors){
     const currentTask=shift?.site===site.id?JOB_BOARD.find(d=>d.id===shift.id)?.tasks[a.index]||a.task:a.task;
     if(a.shownTask!==currentTask){const position=a.tag.position.clone();built.group.remove(a.tag);a.tag.material.map?.dispose();a.tag.material.dispose();a.tag=makeLabel(currentTask.replaceAll('-',' '),'interactive');a.tag.position.copy(position);a.tag.userData.labelKind='interactive';built.group.add(a.tag);a.shownTask=currentTask;}
     a.item.label='Work: '+currentTask.replaceAll('-',' ');
     const step=shift?.site===site.id?(shift.tasks.includes(currentTask)?3:(shift.progress?.[currentTask]||0)):0;
     a.pieces.forEach((mesh,n)=>{
       // Products travel off the trolley into a visible destination display.
       mesh.position.set((n-1)*.26,.99,0);
       if(n<step){mesh.position.set((n-1)*.27,1.25,.42);mesh.rotation.y=Math.PI/2;}
       else mesh.rotation.y=0;
     });
   }
 };
 built.workStationVisuals();
}
export function usePhysicalJob(life,task){
 const shift=life.jobsReport().active;
 if(shift&&(life.playerAt!==shift.site||!life.jobSupervisors(shift.site).length||shift.breakRemaining>0))return {ok:false,message:'Work on site with a supervisor, outside your paid rest break.'};
 if(!shift)return {ok:false,message:'Start a paid shift at the workplace counter first.'};
 const def=JOB_BOARD.find(d=>d.id===shift.id);
 if(!def?.tasks.includes(task))return {ok:false,message:'This station is not part of your current shift.'};
 if(shift.tasks.includes(task))return {ok:false,message:'This duty has already been completed.'};
 // Preparation and cooling are credited by the real weigh/mix/proof/oven/pack
 // chain. The old three-click practice trolleys must never consume extra flour
 // or award a duty for goods that were never produced.
 if(shift.site==='bakery'&&task!=='wash-hands')return {ok:false,message:'Use the Bakery kitchen production stations to prepare, bake, cool and pack real loaves. These duties are credited by real production, not practice trolley clicks.'};
 const stage=shift.progress?.[task]||0,steps=CAPTIONS[task]||[];
 if(stage<2){
   // Actual task state belongs to the shift, and persists in the save.
   const active=life.civic.jobs.active;active.progress??={};
   active.progress[task]=stage+1;
   return {ok:true,message:steps[stage]+'. '+(3-stage-1)+' step(s) remaining. Use this station again.'};
 }
 const r=life.doTask(task);
 if(r.ok){
   life.civic.jobs.active.progress??={};
   life.civic.jobs.active.progress[task]=3;
   if(task==='refill-shelves'){
     const store=life.place('store');
     if(store){
       // Store stock is the total owned quantity. Display stock is a subset
       // of that total, so moving cartons out of the storeroom creates no goods.
       store.displayStock??={};
       let moved=0;
       for(const good of ['flour','tea','coffee','bread','eggs','milk']){
         const total=Math.max(0,Math.floor(store.stock?.[good]||0));
         const displayed=Math.min(total,Math.max(0,Math.floor(store.displayStock[good]??Math.min(2,total))));
         const capacity=Math.min(total,Math.max(3,Math.ceil((store.target?.[good]||8)*.55)));
         const put=Math.min(3,Math.max(0,capacity-displayed),Math.max(0,total-displayed));
         store.displayStock[good]=displayed+put;moved+=put;
       }
       store.shelfRefills=(store.shelfRefills||0)+1;
       r.message='Moved '+moved+' units from storeroom to sales shelves without creating extra inventory. '+r.message;
     }
   }
 }
 return {...r,message:r.ok?steps[2]+'. '+r.message:r.message};
}
