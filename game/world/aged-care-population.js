// Lightweight indoor residents and staff. A capped number of representative
// people are actually rendered; full nominal cohorts exist in the care model.
// Never place an authentic staff station, secure door or medical record.
import * as THREE from 'three';
import {makeDistinctPerson} from './npc-wardrobe.js';
import {CARE_FACILITIES,careResidents,careOnDuty,careActivity,careOccupancyReport} from './aged-care-operations.js';
const LOCATIONS={
 'bracken-house':[
 [-11.3,43.1],[-27,27],[-24,9],[-29,-22],[28,-20],[22,34],
 [-24,24],[-26,12],[26,11],[-34,3],[34,4],[-28,-7],[-24,-28],
 [25,-32],[29,26],[-26,38],[24,-2],[-21,-2],[31,-35]
 ],
 'yeoval-aged-care':[
 [0,13],[-24,8],[14,-17],[-13,-17],[11,-4],[-13,8],[-29,6],
 [22,8],[-20,10],[18,-20],[-5,11],[3,7],[0,-18],[12,-22],
 [24,11],[-23,4],[-12,5],[19,-15],[-5,-19]
 ]
};
function safe(p,colliders){
 return !colliders.some(c=>{
  const x=Math.max(c.x0,Math.min(p[0],c.x1)),z=Math.max(c.z0,Math.min(p[1],c.z1));
  return (x-p[0])**2+(z-p[1])**2<.58**2;
 });
}
function locationSlots(id,interior,count){
 const existing=LOCATIONS[id]||[],picked=[];
 for(const q of existing)if(safe(q,interior.colliders)&&picked.every(p=>Math.hypot(q[0]-p[0],q[1]-p[1])>=2.2)){
   picked.push(q);if(picked.length>=count)return picked;
 }
 for(const room of interior.rooms){
  if(room.w<5||room.d<5)continue;
  for(let x=room.x0+1.2;x<room.x1-1.2;x+=2.8)
   for(let z=room.z0+1.2;z<room.z1-1.2;z+=2.8){
    const q=[x,z];
    if(safe(q,interior.colliders)&&picked.every(p=>Math.hypot(q[0]-p[0],q[1]-p[1])>=2.2)){
      picked.push(q);if(picked.length>=count)return picked;
    }
   }
 }
 return picked;
}
const ROLE_ORDER=['rn','en','pcw','chef','kitchen','activities','admin','cleaning','laundry','manager','physio','maintenance','chaplain'];
function representative(onDuty,n=7){
 const seen={};const result=[];
 for(const role of ROLE_ORDER){
  for(const p of onDuty)if(p.role===role){
   const max=role==='rn'?2:role==='pcw'?2:1;
   if((seen[role]||0)>=max)continue;
   seen[role]=(seen[role]||0)+1;
   result.push(p);if(result.length>=n)return result;
  }
 }
 return result;
}
export function populateCareCampus(id,interior,life,makeLabel){
 const f=CARE_FACILITIES[id];if(!f)return [];
 const residents=careResidents(id),staffCount=7,residentCount=5;
 const slots=locationSlots(id,interior,staffCount+residentCount+1);
 const models=[],people=[];
 let cachedDay=0,cachedMinute=-1;
 const create=(slot,kind)=>{
  if(!slots[slot])return null;
  const p=slots[slot],fig=makeDistinctPerson('fictional-agedcare:'+id+':'+kind+':'+slot);
  // Clearly legible role silhouettes. Uniforms distinguish RN navy, EN teal,
  // personal-care lilac and kitchen whites; visitors retain everyday clothing.
  if(kind==='staff'){
    const colours=[0x345d86,0x345d86,0x3c8d80,0x856ca8,0x856ca8,0xe6e5dc,0xc2b9ad];
    const tunic=new THREE.Mesh(new THREE.BoxGeometry(.70,.58,.43),
      new THREE.MeshLambertMaterial({color:colours[slot%colours.length]}));
    tunic.position.set(0,1.15,.01);fig.group.add(tunic);
    const tag=new THREE.Mesh(new THREE.BoxGeometry(.16,.11,.012),
      new THREE.MeshLambertMaterial({color:0xf3f5ed}));
    tag.position.set(.21,1.32,.235);fig.group.add(tag);
  }
  fig.group.position.set(p[0],0,p[1]);
  const tag=makeLabel(kind==='staff'?'Care team':'Resident','interactive');
  tag.position.set(0,2.45,0);tag.userData.labelKind='interactive';
  fig.group.add(tag);interior.group.add(fig.group);
  const loc=new THREE.Vector3(p[0],0,p[1]);
  const key='care:'+id+':'+kind+':'+slot;
  const name=kind==='staff'?'Care team member':'Resident';
  const hotspot={key,type:'civic',label:'Meet '+name,pos:loc,room:0,
    roomName:'Aged care (illustrative)',act:{do:'info',title:name,text:'Fictional aged-care simulation.'}};
  const scene={type:'person',label:name,pos:{x:p[0],z:p[1]},room:0,interactive:true};
  const worker={key,group:fig.group,tag,pos:loc,room:0,activity:'',plan:()=>[],talking:false,
   update(dt,t,player){
    const distance=player?.pos?Math.hypot(player.pos.x-p[0],player.pos.z-p[1]):Infinity;
    tag.visible=fig.group.visible&&distance<5.5;
    // Gentle idle head turning; staff stay at assigned accessible stations.
    fig.head.rotation.y=Math.sin(t*.43+slot)*.13;
    fig.group.rotation.y=Math.sin(t*.25+slot)*.16;
   }};
  people.push(worker);models.push({kind,slot,worker,hotspot,scene});
  return worker;
 };
 for(let i=0;i<staffCount;i++)create(i,'staff');
 for(let i=0;i<residentCount;i++)create(i+staffCount,'resident');
 const boardPosition=slots[staffCount+residentCount]||interior.spawn;
 const board={
  key:'care:'+id+':noticeboard',label:'View simulated care staffing and resident activities',
  type:'civic',room:0,roomName:'Care information',pos:new THREE.Vector3(boardPosition[0]??boardPosition.x,0,boardPosition[1]??boardPosition.z),
  act:{do:'info',title:f.name+' · simulated staffing',
    text:'Care services in this game are fictional. No clinical records or real staffing rosters are reproduced.'}
 };
 interior.interactables.push(board);
 // A visible large blue resident-life and shift notice at an accessible location.
 const plaque=new THREE.Mesh(new THREE.BoxGeometry(1.5,.85,.065),
   new THREE.MeshLambertMaterial({color:0x32687a}));
 plaque.position.set(board.pos.x,1.62,board.pos.z);
 interior.group.add(plaque);
 const boardLabel=makeLabel('Care team · shift and resident life','interactive');
 boardLabel.position.set(board.pos.x,2.15,board.pos.z);
 interior.group.add(boardLabel);
 function sync(force=false){
  const day=life.day,minute=Math.floor(life.minute);
  if(!force&&day===cachedDay&&minute===cachedMinute)return;
  cachedDay=day;cachedMinute=minute;
  const report=careOccupancyReport(id,day,minute),on=representative(report.staff);
  const roles=Object.entries(report.metrics.roles).map(([k,v])=>k.toUpperCase()+' '+v+' shift slots').join(', ');
  board.act.text=f.name+' fictional population: '+f.capacity+' residents'+(f.lavenderPlaces?' (including 20 in a simulated dementia-support cohort)':'')+
    '. On this shift: '+report.staffCount+' staff, '+report.rn+' RN, '+report.en+' EN, '+report.careWorkers+
    ' personal care/AIN. Illustrative scheduled capacity '+report.metrics.directMinutesPerResident+
    ' direct care minutes per resident/day, including '+report.metrics.rnMinutesPerResident+
    ' RN minutes. Day roster slots: '+roles+'. These are NOT real UPA rosters, delivered-care totals, clinical plans or verified occupancy.';
  for(const model of models){
   const {kind,slot,worker,hotspot,scene}=model;
   const subject=kind==='staff'?on[slot]:residents[(slot-staffCount+Math.floor(day/3))%residents.length];
   const visible=!!subject&&(kind==='staff'||(minute>=7*60&&minute<21*60?slot-staffCount<5:slot-staffCount<2));
   worker.group.visible=visible;
   const lists=[[interior.interactables,hotspot],[interior.sceneObjects,scene]];
   for(const [list,item] of lists){
    const i=list.indexOf(item);
    if(visible&&i<0)list.push(item);
    if(!visible&&i>=0)list.splice(i,1);
   }
   if(!visible)continue;
   const role=kind==='staff'?subject.job:'Resident';
   const action=kind==='staff'?(
      subject.role==='rn'?'checking observations, assessing and supervising clinical care':
      subject.role==='en'?'delivering delegated nursing care with RN oversight':
      subject.role==='pcw'?'supporting meals, movement and personal preferences':
      subject.role==='chef'||subject.role==='kitchen'?'preparing and serving resident-selected meals':
      subject.role==='activities'?'organising activities and social connection':
      subject.role==='admin'?'welcoming visitors and coordinating reception':
      'supporting clean, safe, homelike operations'
    ):careActivity(minute,subject.index,id);
   const text=kind==='staff'?subject.name+' · '+role+'. Currently '+action+'. Fictional staff member, assigned to the '+subject.shift+
       ' shift; no verified real UPA staff identity or shift is shown.':
       subject.name+' · age '+subject.age+'. '+action+'. Fictional resident character. No real resident records, care needs or room number are modelled.';
   hotspot.label='Meet '+subject.name+' · '+role;
   hotspot.act.title=subject.name+' · '+role;hotspot.act.text=text;
   scene.label=subject.name+' · '+role;
   worker.activity=action;
   worker.name=subject.name;
  }
 }
 sync(true);
 // Hook into main's existing inside.people animation; no separate render loop.
 if(people.length) {
  const original=people[0].update.bind(people[0]);
  people[0].update=(...args)=>{sync();original(...args);};
 }
 return people;
}
