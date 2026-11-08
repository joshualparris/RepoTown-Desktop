import {fin,record} from './finance.js';
// Employer-owned van uses the ordinary collision, steering, fuel and wear model.
// Cargo stays in the saved van until physically unloaded or returned to depot.
const r=(ok,message)=>({ok,message});
export function deliveryState(t){return t.civic.deliveryWork??={next:1,route:null,history:[]};}
const near=(v,p)=>Math.hypot(v.x-p.curb.x,v.z-p.curb.z)<22;
export function deliveryAction(t,action,site=t.playerAt){
 const s=deliveryState(t),a=t.civic.jobs?.active,depot=t.place('depot'),motor=t.civic.motor;
 const job=a?.id==='delivery-driver'&&a.day===t.day;
 const van=motor.owned.find(v=>v.workVehicle==='depot');
 const duty=key=>{if(!job)return;a.hands??={earned:[],scores:[]};if(!a.hands.earned.includes(key))a.hands.earned.push(key);t.doTask(key);};
 if(action==='manifest'){
  if(!job||t.playerAt!=='depot'||!t.jobSupervisors('depot').length)return r(false,'Start the delivery shift and collect its manifest from the depot supervisor.');
  if(s.route&&(!['completed','returned'].includes(s.route.status)||(s.route.status==='completed'&&!s.route.returnedAt)))return r(false,'Finish or physically return the current route first.');
  const lines=[['coffee','cafe'],['tea','store'],['parcel','post']].filter(([g,to])=>(depot.out[g]||0)>=2&&((t.place(to).target?.[g]||20)-(t.place(to).stock[g]||0))>=2).slice(0,2).map(([good,to])=>({good,to,n:2,delivered:false}));
  if(!lines.length)return r(false,'No manifest has both available freight and a business needing it. Wait for train stock and customer demand.');
  s.route={id:s.next++,lines,status:'accepted',startedDay:t.day};duty('accept-manifest');return r(true,'Manifest agreed: '+lines.map(l=>l.good+' ×'+l.n+' → '+t.place(l.to).name).join('; ')+'. Employer provides the van, stock and fuel.');
 }
 const route=s.route;if(!route)return r(false,'Accept a depot manifest first.');
 if(action==='load'){
  if(!job||t.playerAt!=='depot'||!t.jobSupervisors('depot').length)return r(false,'Load at the supervised depot.');
  if(route.status!=='accepted')return r(false,'This route is already loaded or closed.');
  if(route.lines.some(l=>(depot.out[l.good]||0)<l.n))return r(false,'Manifest stock changed. Cancel the unstarted route and request a new one.');
  let v=van;
  if(!v){v={registration:'RT-WORK',model:'van',owner:'Rail Freight Cooperative',workVehicle:'depot',condition:95,roadworthy:true,regoUntil:t.day+28,price:0,odometer:0,fuel:0,x:depot.x+17,z:depot.curb.z,yaw:Math.PI/2};motor.owned.push(v);}
  if(!near(v,depot)||Math.abs(v.speed||0)>.35)return r(false,'Park the work van at the depot before loading.');
  const service=v.condition<70||!v.roadworthy,renew=(v.regoUntil-t.day)<2,cost=(service?82:0)+(renew?30:0);
  if(cost>t.civic.treasury||(service&&motor.parts<1))return r(false,'Employer cannot fund required vehicle servicing/registration or is waiting for workshop parts. No cargo loaded and no worker expense.');
  if(service){t.civic.treasury-=82;motor.garageCash+=82;motor.parts--;v.condition=Math.min(100,v.condition+28);v.roadworthy=v.condition>=60;v.lastService=t.day;v.serviceDue=t.day+14;record(t,'council','motor-workshop',82,'Employer van service');}
  if(renew){t.civic.treasury-=30;fin(t).state+=30;v.regoUntil=Math.max(t.day,v.regoUntil)+28;record(t,'council','state',30,'Employer van registration');}
  if(!v.roadworthy)return r(false,'The employer van needs further workshop repairs before cargo can be loaded. Worker funds are unchanged.');
  if(v.fuel<6){if(!(depot.out.fuel>=1))return r(false,'Employer fuel is unavailable; wait for train supplies.');depot.out.fuel--;v.fuel=Math.min(30,v.fuel+10);}
  for(const l of route.lines)depot.out[l.good]-=l.n;
  route.status='loaded';route.registration=v.registration;route.startOdometer=v.odometer||0;duty('load-parcels');return r(true,'Correct parcels secured in RT-WORK, parked on the road beside the depot. Walk to its driver door and drive the displayed route. Exit after stopping before unloading inside each business.');
 }
 if(action==='cancel'){
  if(route.status!=='accepted')return r(false,'Loaded cargo must be physically returned to the depot.');route.status='returned';return r(true,'Unstarted manifest cancelled; no stock or pay deducted.');
 }
 if(action==='unload'){
  if(route.status!=='loaded'||!van)return r(false,'No loaded van route.');
  const line=route.lines.find(l=>l.to===site&&!l.delivered),p=t.place(site);
  if(!line)return r(false,'No undelivered consignment for this business. Read the manifest.');
  if(t.playerAt!==site||t.workVehicleDriving||!near(van,p)||Math.abs(van.speed||0)>.35)return r(false,'Drive the work van here, park nearby, get out and bring the consignment to this counter.');
  if((van.odometer||0)<=route.startOdometer+.01)return r(false,'The loaded van must travel the route before receipt can be confirmed.');
  p.stock[line.good]=(p.stock[line.good]||0)+line.n;line.delivered=true;line.receivedDay=t.day;
  t.stats.deliveries++;t.stats.delivered[line.good]=(t.stats.delivered[line.good]||0)+line.n;
  if(route.lines.every(l=>l.delivered)){route.status='completed';duty('confirm-receipt');s.history.unshift(structuredClone(route));s.history.length=Math.min(20,s.history.length);}
  t.log('Delivery route '+route.id+': '+p.name+' signed for '+line.good+' ×'+line.n+'.');
  return r(true,p.name+' received usable '+line.good+' ×'+line.n+'. '+(route.status==='completed'?'All receipts confirmed. Return the van and clock out at the depot.':'Continue to the next stop.'));
 }
 if(action==='return'){
  if(!van||!near(van,depot)||Math.abs(van.speed||0)>.35||t.playerAt!=='depot'||t.workVehicleDriving)return r(false,'Park the work van at the depot and get out first.');
  if(route.status==='loaded'){for(const l of route.lines)if(!l.delivered)depot.out[l.good]=(depot.out[l.good]||0)+l.n;route.status='returned';}
  route.returnedAt=t.day*1440+t.minute;
  return r(true,'Work van returned. Undelivered parcels restored to depot stock once; earned wages remain saved.');
 }
 return r(false,'Unknown delivery action.');
}
