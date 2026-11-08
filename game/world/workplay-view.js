import {storeBatches,batchLabel,SAFE_TEMP} from './store-batches.js';
import * as THREE from 'three';
import {STORE_GOODS,CAFE_TABLES,recipeFor,orderRecipe} from './work-recipes.js';
import {workState,storeState,useStore,useCafe,isWorking} from './workplay.js';
import {choices,skillPanel} from '../ui/work-panels.js';
import {esc} from '../ui/interactions.js';
const mesh=(root,geo,color,x,y,z)=>{const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color}));m.position.set(x,y,z);root.add(m);return m;};
export function installWorkplay(built,site,makeLabel,life,{openPanel,closePanel,status,sound,getVisitors}){
 if(!['store','cafe'].includes(site.id))return null;
 const root=new THREE.Group();root.name='Interactive '+site.name+' work';built.group.add(root);
 const geo=new THREE.BoxGeometry(1,1,1),cyl=new THREE.CylinderGeometry(.12,.1,.19,12),actors=[];
 const box=(c,w,h,d,x,y,z)=>{const m=mesh(root,geo,c,x,y,z);m.scale.set(w,h,d);return m;};
 const add=(id,label,x,z,action,arg)=>{
  const tag=makeLabel(label,'interactive');tag.position.set(x,1.9,z);built.group.add(tag);
  const item={key:'workplay:'+site.id+':'+id,label,type:'civic',room:0,roomName:site.name,pos:new THREE.Vector3(x,0,z),act:{do:'workplay',action,arg}};
  built.interactables.push(item);actors.push({tag,item});return item;
 };
 const carry=new THREE.Group();root.add(carry);
 const carton=mesh(carry,new THREE.BoxGeometry(.65,.42,.48),0xb4874e,0,0,0);
 const tray=mesh(carry,new THREE.CylinderGeometry(.38,.38,.025,20),0x83705b,0,-.13,0);
 const carriedCup=mesh(carry,cyl,0xf4ecdd,0,.0,0);
 const carriedFood=new THREE.Group();carry.add(carriedFood);
 mesh(carriedFood,new THREE.CylinderGeometry(.25,.25,.025,16),0xf2e7cf,0,-.08,0);
 const meal=mesh(carriedFood,new THREE.SphereGeometry(.17,12,7),0xd4a35e,0,0,0);meal.scale.y=.4;
 let pitcher=null,pan=null,kitchenFood=null,coffeeCup=null,liquid=null,stream=null,steam=[],ovenLight=null,animation=null,elapsed=0,tillMarker=null;
 const shelfMeshes={};
 if(site.id==='store'){
  add('receiving','Receiving bay · pick up / return carton',-5.2,3.3,'receiving');
  box(0x7d6250,.9,.62,.65,-5.3,.31,3.5);for(let i=0;i<3;i++)box(0xb48c53,.34,.24,.3,-5.45+(i%2)*.38,.75+Math.floor(i/2)*.26,3.5);
  add('dates','Inspect damaged batch / returns cage',-5.15,-3.8,'inspect');box(0x725a4b,.8,.6,.6,-5.3,.3,-4.2);
  add('dry','Dry goods shelf · coffee and tea',-2.55,-2,'shelve','dry');
  add('bakery','Bread shelf',2.5,-2,'shelve','bakery');
  add('chilled','Chilled shelf · milk and eggs',5.1,.1,'shelve','chilled');
  add('count','Stocktake clipboard',1.7,3.8,'count');box(0x8d694a,.55,.05,.36,1.7,1.1,3.8);
  for(const[g,def]of Object.entries(STORE_GOODS)){
   const x=def.zone==='dry'?-3.02:def.zone==='bakery'?3.02:5.95,z=def.zone==='dry'?-2.4:def.zone==='bakery'?-2.4:-1.4;
   const offset=g==='tea'||g==='eggs'?.42:0;const arr=[];
   const side=def.zone==='dry'?1:-1;box(0x254d4a,.03,.32,1.55,x-side*.09,1.34+offset,z+.6);
   const sign=makeLabel('WORK STOCK · '+def.name,'interactive');sign.scale.multiplyScalar(.45);sign.position.set(x+side*.16,1.66+offset,z+.6);built.group.add(sign);
   for(let i=0;i<6;i++)arr.push(box(def.colour,.15,.22,.15,x,1.34+offset,z+i*.24));shelfMeshes[g]=arr;
  }
 }else{
  // Replace decorative machine hotspots with working equipment, retaining ordinary counter service.
  const old=built.interactables.findIndex(i=>i.key==='cafe:machine');if(old>=0)built.interactables.splice(old,1);
  add('orders','TILL · take next customer order',1.3,-3.6,'take');
  // Landmark persists when proximity hotspot labels temporarily disappear.
  tillMarker=makeLabel('TILL / TAKE ORDERS','interactive');tillMarker.position.set(1.3,2.45,-3.6);built.group.add(tillMarker);
  box(0x263c41,.5,.3,.38,1.3,1.28,-4.05);box(0xced5cc,.32,.07,.24,1.3,1.48,-4.05);
  add('rail','Order rail · choose ticket',2.5,-4.25,'rail');
  add('barista','Grinder / espresso / tea station',-2.3,-4.2,'prepare','barista');
  add('kitchen','Kitchen · cook, grill and bake ticket',4.9,-7.4,'prepare','kitchen');
  add('fridge','Fridge · inspect ingredients',3.35,-7.3,'fridge');
  box(0x9ba9ad,.7,1.7,.65,3.35,.85,-7.95);box(0x40545a,.45,.06,.05,3.35,1.1,-7.6);
  add('dishwasher','Dishwasher · wash dirty crockery',3.25,-6.55,'dishwasher');
  box(0x758e93,.9,.75,.65,3.25,.38,-6.45);box(0x293a42,.65,.33,.05,3.25,.47,-6.1);
  add('pass','Kitchen pass · collect finished tray',4.8,-4.7,'collect');
  box(0x667170,1.2,1,.65,4.9,.5,-8.3);box(0x2b2c2a,1,.45,.03,4.9,.6,-7.95);
  ovenLight=box(0xd38736,.85,.08,.03,4.9,.66,-7.92);
  box(0x87918e,1.25,.08,.8,4.9,1.05,-8.3);
  pitcher=mesh(root,new THREE.CylinderGeometry(.1,.08,.25,12),0xb9c5c8,-2.05,1.55,-5.12);
  pan=mesh(root,new THREE.CylinderGeometry(.3,.25,.055,16),0x333c39,4.9,1.14,-8.3);
  kitchenFood=mesh(root,new THREE.SphereGeometry(.2,12,7),0xe9b851,4.9,1.2,-8.3);kitchenFood.scale.y=.25;
  coffeeCup=mesh(root,cyl,0xf4ecdd,-2.3,1.21,-5.15);
  liquid=mesh(root,new THREE.CylinderGeometry(.092,.092,.012,12),0x70472c,-2.3,1.23,-5.15);
  stream=mesh(root,new THREE.CylinderGeometry(.013,.013,.2,6),0xb07d43,-2.3,1.4,-5.15);
  for(let i=0;i<6;i++){const m=mesh(root,new THREE.SphereGeometry(.045,6,4),0xcad8ce,-2.3,1.5,-5.15);m.material.transparent=true;m.material.opacity=.3;steam.push(m);}
  CAFE_TABLES.forEach(([x,z],i)=>{
   const tag=makeLabel('Table '+(i+1),'interactive');tag.position.set(x,1.65,z);built.group.add(tag);
   // Use from the clear aisle next to a table rather than from its solid centre.
   add('table-'+(i+1),'Table '+(i+1)+' · deliver / clear',x+(x<0?.95:-.95),z,'table',i+1);
   const cup=mesh(root,cyl,0xf3e7d0,x,.9,z);cup.visible=false;
   const plate=mesh(root,new THREE.CylinderGeometry(.24,.24,.025,18),0xece2cb,x,.83,z);plate.visible=false;
   actors.push({table:i+1,cup,plate});
  });
 }
 const hud=typeof document==='undefined'?{style:{},remove(){}}:document.createElement('div');hud.id='workplay-hud';hud.style.cssText='position:fixed;left:12px;top:100px;max-width:min(310px,75vw);padding:10px 13px;background:#102c32e8;color:#f3eedc;border:1px solid #729d98;border-radius:12px;z-index:20;pointer-events:none;font:13px system-ui;white-space:pre-line';if(typeof document!=='undefined')document.body.append(hud);
 const feedback=typeof document==='undefined'?{hidden:true,remove(){}}:document.createElement('div');
 feedback.id='workplay-feedback';
 if(typeof document!=='undefined'){feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.style.cssText='position:fixed;left:12px;right:12px;bottom:clamp(155px,22vh,240px);max-width:480px;margin:auto;padding:11px 14px;border-radius:12px;background:#152c32f2;color:#fff;border:2px solid #a6c2a8;z-index:65;pointer-events:none;font:600 14px/1.4 system-ui;box-shadow:0 3px 14px #0009';document.body.append(feedback);}
 feedback.hidden=true;let feedbackUntil=0;
 const notify=(message,ok=true)=>{status(message);feedback.textContent=(ok?'Done: ':'Not yet: ')+message;feedback.hidden=false;feedbackUntil=Date.now()+10000;};
 const say=r=>{notify(r.message,r.ok);if(r.ok)sound?.('success');return r;};
 // An action inside a modal must return a visible result panel. Sending
 // status() alone leaves the old buttons on screen (and hides the answer on mobile).
 const inspectionResult=r=>{
  const cage=storeBatches(life).quarantine.filter(q=>!q.returned);
  const total=cage.reduce((n,b)=>n+b.n,0);
  return choices(r.ok?'Batch action recorded':'Batch action not completed',
   '<p role="status" aria-live="polite"><strong>'+esc(r.message)+'</strong></p>'+
   '<p>Returns cage: '+total+' isolated unit'+(total===1?'':'s')+'. Damaged stock must not be offered for sale.</p>',
   [{label:r.ok?'Review returns cage':'Try again',run:()=>inspectionPanel()},
    {label:'Close and continue shift',run:()=>{closePanel();return null;}}]);
 };
 const inspectionPanel=()=>choices('Batch inspection',
  '<p>The delivery label says <b>damaged / do not sell</b>. Check packaging and date labels before filling shelves. What should happen to this carton?</p>',
  storeBatches(life).quarantine.filter(q=>!q.returned).map(q=>({
   label:'Return quarantined '+batchLabel(q)+' to supplier',
   run:()=>inspectionResult(say(useStore(life,'supplier-return',q.id)))
  })).concat([
   {label:'Put it straight on the shelf',run:()=>inspectionResult(say(useStore(life,'inspect','sell')))},
   {label:'Isolate in the returns cage',run:()=>inspectionResult(say(useStore(life,'inspect','quarantine')))}
  ]));
 const selectOrder=()=>{
  const c=workState(life).cafe;const list=c.tickets.filter(o=>!['cancelled','cleared'].includes(o.state));
  const options=list.map(o=>({label:'#'+o.id+' · '+o.name+' · '+orderRecipe(o).name+' · table '+o.table+' · '+o.state+' · '+Math.max(0,Math.ceil((o.patience||90)-(life.day*1440+life.minute-o.created)))+' min patience',run:()=>{say(useCafe(life,'select',o.id));return null;}}));
  const selected=list.find(o=>o.id===c.selected&&!['served','dirty'].includes(o.state));
  if(selected)options.push({label:'Cancel selected unserved order',run:()=>{say(useCafe(life,'cancel'));return null;}});
  if(!list.length)notify('No active tickets on the rail yet. Take an order at the labelled TILL when a customer arrives.',false);
  options.push({label:'Return to café shift',run:()=>{closePanel();return null;}});
  openPanel(choices('Café ticket rail',list.length?'<p>Choose the ticket, then prepare it at the named kitchen or barista station.</p>':'<p>No active orders yet. The TILL is at the front service counter; villagers will queue there as they arrive.</p>',options));
 };
 function use(item){
  const{action,arg}=item.act;
  if(site.id==='store'){
   if(action==='receiving'){
    const s=storeState(life);openPanel(choices('General Store · receiving','<p>Collect a carton, carry it to the correct shelf and use the shelf to unpack it. Six units complete the refill duty. Cartons contain real saleable stock.</p>',s.carton?[{label:'Return carried carton',run:()=>{say(useStore(life,'return'));return null;}}]:storeBatches(life).lots.filter(b=>b.probe==='pending').map(b=>({label:'Probe chilled delivery '+batchLabel(b)+' (accept at '+SAFE_TEMP+' °C or below)',run:()=>{say(useStore(life,'probe',b.id));return null;}})).concat(storeBatches(life).lots.filter(b=>b.n>b.shelf&&b.probe!=='pending').map(b=>({label:'Pick up '+batchLabel(b),run:()=>{say(useStore(life,'pickup',{good:b.good,batchId:b.id}));return null;}})))));return;
   }
   if(action==='inspect'){openPanel(inspectionPanel());return;}
   if(action==='count'){
    const s=storeState(life),target=Object.values(s.shelves).reduce((n,v)=>n+Math.min(6,v),0);
    openPanel({title:'Stocktake · count marked shelf sections',body:'<p>Count the coloured products in the five marked sections (coffee, tea, bread, milk and eggs). Each section displays up to six units. Enter the combined visible count.</p><label>Count <input id="work-stock-count" type="number" min="0" max="30" inputmode="numeric"></label><button id="work-submit-count">Record count</button>',actions:[],mount:root=>{root.querySelector('#work-submit-count').onclick=()=>{const r=say(useStore(life,'count',root.querySelector('#work-stock-count').value));if(r.ok)closePanel();};}});return;
   }
   say(useStore(life,action,arg));return;
  }
  if(action==='rail'){selectOrder();return;}
  if(action==='fridge'){const r=say(useCafe(life,'fridge'));if(r.ok)openPanel(choices('Café fridge · current stock','<p>'+esc(r.message)+'</p><p>Stock is consumed only when you start a selected ticket at its preparation station.</p>',[{label:'Back to café',run:()=>{closePanel();return null;}}]));return;}
  if(action==='dishwasher'){say(useCafe(life,'dishwasher'));return;}
  if(action==='take'){say(useCafe(life,'take'));return;}
  if(action==='table'){
   const c=workState(life).cafe;
   if(c.held){const held=c.tickets.find(o=>o.id===c.held),person=getVisitors?.()?.get(held?.customer);if(person&&person.state!=='seated'){notify('Wait for '+held.name+' to reach their table before delivering.',false);return;}say(useCafe(life,'deliver',arg));}
   else{const o=c.tickets.find(o=>o.table===arg&&['served','dirty'].includes(o.state));if(o){c.selected=o.id;say(useCafe(life,'clear',arg));}else notify('This table is already empty and clean. No dishes to clear. Take a new order at the TILL, or collect a ready tray at the pass.',false);}
   return;
  }
  const r=say(useCafe(life,action,arg));
  if(r.milkChoice){openPanel(choices('Select the ticket’s milk','<p>Read the ticket and use the matching jug. Dietary requests affect the actual reserved ingredients.</p>',['dairy','skim','oat','soy'].map(milk=>({label:({dairy:'Full-cream (dairy)',skim:'Skim',oat:'Oat',soy:'Soy'})[milk]+' milk',run:()=>{say(useCafe(life,'milk',milk));return null;}}))));return;}
  if(r.mini){
   animation={kind:r.mini[0].split(':').at(-1),start:elapsed};
   openPanel(skillPanel(r.mini,score=>{
    animation=null;
    if(score<.35){notify('Outside the target zone. Retry this step; the ingredients are still at your station.',false);closePanel();return;}
    const done=say(useCafe(life,'finish-step',r.mini[0],score));closePanel();
   },()=>{animation=null;},sound));
  }
 }
 let hudText='',refresh=0;
 function update(dt,player){
  if(animation&&typeof document!=='undefined'&&!document.getElementById('work-skill'))animation=null;
  elapsed+=dt;refresh-=dt;const state=workState(life),active=isWorking(life,site.id);
  hud.hidden=!active;carry.visible=false;if(tillMarker)tillMarker.visible=active;feedback.hidden=!active||Date.now()>feedbackUntil;
  if(site.id==='store'){
   const s=storeState(life);for(const[g,arr]of Object.entries(shelfMeshes))arr.forEach((m,i)=>m.visible=i<Math.min(6,s.shelves[g]));
   if(active&&s.carton){carry.visible=true;carton.visible=true;tray.visible=false;carriedCup.visible=false;carriedFood.visible=false;carton.material.color.set(STORE_GOODS[s.carton.good].colour);}
   const a=life.civic.jobs?.active;
   const str='GENERAL STORE SHIFT\n'+(s.carton?'Carrying '+s.carton.n+' '+STORE_GOODS[s.carton.good].name+' → '+STORE_GOODS[s.carton.good].zone:'Receiving bay → correct shelf')+'\nRestocked: '+(a?.hands?.restocked||0)+'/6 units\nInspect damaged batch · refill · stocktake';if(str!==hudText){hud.textContent=str;hudText=str;}
  }else{
   const c=state.cafe,o=c.tickets.find(x=>x.id===(c.held||c.selected));
   if(active&&c.held){carry.visible=true;carton.visible=false;tray.visible=true;const food=['food','oven'].includes(orderRecipe(o).kind);carriedCup.visible=!food;carriedFood.visible=food;}
   for(const a of actors)if(a.table){const ticket=c.tickets.find(o=>o.table===a.table&&['served','dirty'].includes(o.state));a.cup.visible=!!ticket;a.plate.visible=!!ticket;if(ticket)a.cup.material.color.set(ticket.state==='dirty'?0xa38b68:0xf2ecde);}
   if(coffeeCup){const preparing=!!animation;pitcher.rotation.z=preparing&&animation.kind==='pour'?-.55:0;pitcher.position.y=1.55+(preparing?Math.sin(elapsed*3)*.025:0);stream.material.color.setHex(animation?.kind==='pour'?0xf4ead2:0x99704a);pan.rotation.z=preparing&&animation.kind==='cook'?Math.sin(elapsed*4)*.04:0;kitchenFood.material.color.setHex(preparing&&['cook','bake'].includes(animation.kind)?0xc48b3f:0xe9b851);stream.visible=preparing&&['extract','pour','fill'].includes(animation.kind);liquid.scale.y=preparing?.5+(Math.sin(elapsed*2)+1)/2:1;steam.forEach((m,i)=>{m.visible=preparing&&['steam','steep'].includes(animation.kind);m.position.y=1.4+((elapsed*.4+i*.12)% .6);m.position.x=-2.3+Math.sin(elapsed*2+i)*.08;m.material.opacity=.35*(1-(m.position.y-1.4)/.6);});coffeeCup.rotation.z=preparing&&animation.kind==='pour'?Math.sin(elapsed*2)*.12:0;ovenLight.material.emissive.setHex(preparing&&['cook','bake'].includes(animation.kind)?0xff7711:0x000000);}
   const str='CAFÉ SHIFT · '+c.tickets.filter(o=>o.state==='queue').length+' queuing\n'+(o?'#'+o.id+' '+o.name+' · '+orderRecipe(o).name+'\nTABLE '+o.table+' · '+o.state:'TILL at counter → wait for a customer')+'\n'+c.served+' served · '+c.cleared+' tables cleared · '+(c.dirtyDishes||0)+' dishes to wash · $'+(c.tips||0)+' tips';if(str!==hudText){hud.textContent=str;hudText=str;}
  }
  if(carry.visible){const f=player.forward();carry.position.set(player.pos.x+f.x*.72,player.eye-.55,player.pos.z+f.z*.72);carry.rotation.y=player.yaw;carry.rotation.z=Math.sin(elapsed*4)*.015;}
  for(const a of actors)if(a.tag)a.tag.visible=active&&Math.hypot(a.item.pos.x-player.pos.x,a.item.pos.z-player.pos.z)>2.3;
 }
 return {use,update,customer(v){if(site.id!=='cafe'||!isWorking(life,'cafe')||!v)return false;const c=workState(life).cafe,o=c.tickets.find(o=>o.id===v.step?.workTicket);if(!o)return false;if(o.state==='queue')say(useCafe(life,'take',v.id));else if(c.held){const person=getVisitors?.()?.get(o.customer);if(person&&person.state!=='seated')notify('Let the customer reach their table first.',false);else say(useCafe(life,'deliver',o.table));}else{c.selected=o.id;notify('#'+o.id+' · '+v.name+' · '+orderRecipe(o).name+' · table '+o.table+' · '+o.state);}return true;},dispose:()=>{hud.remove();feedback.remove();},root};
}
