// Stateful town-minute logistics. Jobs and deliveries only finish after a
// simulated physical journey, actual time on site and sign-off, never on booking.
// Locations are the existing real 3-D town coordinates; no random teleporting.
export const REPAIR_SITES=Object.freeze({
 leakingTap:'cafe',blockedDrain:'sewage',faultySwitch:'store',
 stormDamage:'pub',repaintExterior:'pub',laptop:'school'
});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clone=(p)=>({x:p.x,z:p.z});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const round=(n)=>Math.round(n*100)/100;
const ROAD_Z=179.4; // lane alongside the street-8 service precinct
export function worksite(life,type,id=null){
 const site=life.place(id||REPAIR_SITES[type]);
 return site?{id:site.id,name:site.name,front:clone(site.front)}:null;
}
export function vanRoute(from,to){
 // Do not drive through shop walls: depart through the curb cut,
 // use High Street carriageway, and arrive at the proper forecourt.
 return [clone(from),{x:from.x,z:ROAD_Z},{x:to.x,z:ROAD_Z},clone(to)];
}
export function driveRoute(vehicle,minutes,speed=22){
 let remaining=Math.max(0,minutes)*speed;
 while(remaining>0&&vehicle.route?.length){
  const pt=vehicle.route[0],d=dist(vehicle.pos,pt);
  if(d<0.02){vehicle.pos=clone(pt);vehicle.route.shift();continue;}
  const moved=Math.min(d,remaining);
  vehicle.heading=Math.atan2(pt.x-vehicle.pos.x,pt.z-vehicle.pos.z);
  vehicle.pos.x+=(pt.x-vehicle.pos.x)*moved/d;
  vehicle.pos.z+=(pt.z-vehicle.pos.z)*moved/d;
  remaining-=moved;
  if(moved>=d-0.02){vehicle.pos=clone(pt);vehicle.route.shift();}
 }
 return !vehicle.route?.length;
}
const ready=(life)=>life.minute>=7*60&&life.minute<17*60;
export function initTradeOperations(life,t){
 if(!t.dispatch)t.dispatch={crewVan:null,truckId:'TRD-01',lastDay:0};
 if(!Array.isArray(t.deliveries))t.deliveries=[];
 if(!Array.isArray(t.invoices))t.invoices=[];
 if(!t.apprentices)t.apprentices={
  kai:{name:'Kai Bell',trade:'electrical',supervisor:'ella',hours:0,units:[],qualified:false},
  mia:{name:'Mia Harris',trade:'plumbing',supervisor:'sam',hours:0,units:[],qualified:false}
 };
 if(!t.playerPlacement)t.playerPlacement={electrical:0,plumbing:0,verified:[],lastDay:0};
 if(!t.licences)t.licences={};
 if(!Array.isArray(t.academicEvents))t.academicEvents=[];
 return t;
}
const bill=(t,life,text)=>{t.invoices.unshift({day:life.day,text});t.invoices.length=Math.min(30,t.invoices.length);};
export function orderHardwareShipment(life,t,item,count,hardware,source='rail'){
 initTradeOperations(life,t);
 if(!hardware[item]||!Number.isInteger(count)||count<1||count>20)return 'Order between 1 and 20 stocked items.';
 if(t.deliveries.some(s=>s.item===item&&s.status!=='delivered'&&s.status!=='cancelled'))
  return 'An earlier '+hardware[item].name+' shipment is already outstanding.';
 const foundry=life.place('foundry'),q=count*hardware[item].price;
 const cost=Math.ceil(q*0.60)+7;
 if(t.hardwareCash<cost)return 'Hardware supplier lacks '+cost+' Town Dollars for wholesale stock and freight.';
 if(item==='parts'&&(foundry?.out?.parts||0)<count)return 'Foundry has not manufactured '+count+' spare parts yet.';
 if(item==='parts'){foundry.out.parts-=count;foundry.till+=cost;}
 t.hardwareCash=round(t.hardwareCash-cost);
 const from=life.place(item==='parts'?'foundry':'depot'),dest=life.place('hardware');
 const order={id:'INV-'+String(t.next++).padStart(3,'0'),item,count,source:item==='parts'?'foundry':source,
  cost,status:'awaiting-dispatch',createdDay:life.day,createdMinute:life.minute,
  vehicle:{pos:clone(from.front),heading:0,route:vanRoute(from.front,dest.front)}};
 t.deliveries.push(order);
 bill(t,life,order.id+' ordered '+count+' '+hardware[item].name+'; '+cost+' paid to '+(item==='parts'?'Foundry':'regional supplier')+'.');
 return 'Ordered '+count+' '+hardware[item].name+'; delivery '+order.id+' booked from '+order.source+'.';
}
export function advanceHardwareShipments(life,t,minutes){
 initTradeOperations(life,t);
 for(const s of t.deliveries){
  if(s.status==='delivered'||s.status==='cancelled')continue;
  if(!ready(life))continue;
  if(s.status==='awaiting-dispatch')s.status='in-transit';
  if(!driveRoute(s.vehicle,minutes,20))continue;
  s.status='delivered';s.deliveredDay=life.day;
  t.stock[s.item]=(t.stock[s.item]||0)+s.count;
  bill(t,life,s.id+' delivered '+s.count+' '+s.item+' to Central West Hardware.');
  life.log('Hardware freight '+s.id+' arrived at the goods receiving bay.');
 }
 t.deliveries=t.deliveries.slice(-35);
}
const qualified=(staff,type)=>staff?.qualified&&(type==='it'||Boolean(staff.licence));
export function advanceFieldRepairs(life,t,minutes,staff,quotes){
 initTradeOperations(life,t);
 const depot=life.place('trades');
 for(const o of t.orders){
  if(o.status==='completed'&&o.field?.phase==='return'){
   driveRoute(o.field.van,minutes,19);
   if(!o.field.van.route.length)o.field.phase='depot';
   continue;
  }
  if(!['assigned','in-progress'].includes(o.status))continue;
  if(!ready(life))continue;
  const q=quotes(o.type),worker=staff.find(x=>x.id===o.worker);
  if(!q||!qualified(worker,q.trade)){o.status='inspection-hold';continue;}
  if(!o.field){
   const site=worksite(life,o.type,o.siteId);
   if(!site){o.status='inspection-hold';continue;}
   const occupied=t.orders.some(other=>other!==o&&['assigned','in-progress'].includes(other.status)&&other.worker===o.worker&&other.field?.phase!=='depot');
   if(occupied)continue;
   const apprentice=staff.find(x=>x.supervisor===worker.id);
   o.field={siteId:site.id,siteName:site.name,supervisor:worker.id,apprentice:apprentice?.id||null,
    phase:'loading',elapsed:0,notes:['Crew allocated; job materials reserved at Hardware & Timber'],
    van:{pos:clone(depot.front),heading:0,route:[]}};
  }
  const f=o.field;
  if(f.phase==='loading'){
   f.elapsed+=minutes;
   if(f.elapsed<10)continue;
   f.phase='enroute';f.elapsed=0;
   const site=worksite(life,o.type,o.siteId);f.van.route=vanRoute(depot.front,site.front);
   f.notes.push('Crew signed out tools, loaded van and left the depot');
   life.log(worker.name+' departed Town Trades & Maintenance for '+site.name+'.');
  }else if(f.phase==='enroute'){
   if(!driveRoute(f.van,minutes,19))continue;
   f.phase='safety';f.elapsed=0;f.notes.push('Crew arrived at '+f.siteName+' and established a safe work area');
  }else if(f.phase==='safety'){
   f.elapsed+=minutes;
   if(f.elapsed<15)continue;
   f.phase='working';f.elapsed=0;o.status='in-progress';
   f.notes.push('Site risk assessment and relevant isolation completed');
  }else if(f.phase==='working'){
   f.elapsed+=minutes;o.progress=round(f.elapsed/60);
   if(f.elapsed<q.hours*60)continue;
   f.phase='inspection';f.elapsed=0;
   f.notes.push('Repair complete; awaiting licensed tests and sign-off');
  }else if(f.phase==='inspection'){
   f.elapsed+=minutes;
   if(f.elapsed<20)continue;
   if(!qualified(worker,q.trade)){o.status='inspection-hold';continue;}
   o.status='completed';o.completedDay=life.day;o.signedOffBy=worker.id;
   t.contractorCash=round(t.contractorCash+(o.escrow||0));o.escrow=0;
   life.stats.repairs=(life.stats.repairs||0)+1;
   f.notes.push(worker.name+' tested and signed off work. Site secured.');
   if(f.apprentice&&t.apprentices[f.apprentice]){
    const a=t.apprentices[f.apprentice],hours=q.hours;
    a.hours=round(a.hours+hours);
    a.units.push({day:life.day,job:o.id,siteId:f.siteId,supervisor:worker.name,hours,
      competence:q.trade+' supervised work, inspection and safe handover'});
    a.units=a.units.slice(-50);
    life.log(a.name+' logged '+hours+' supervised '+q.trade+' hours with '+worker.name+'.');
   }
   t.receipts.unshift({day:life.day,text:o.id+' completed at '+f.siteName+' and signed off by '+worker.name+'; '+q.risk});
   t.receipts=t.receipts.slice(0,30);
   life.log('Repair '+o.id+' completed and signed off on site.');
   f.phase='return';f.van.route=vanRoute(worksite(life,o.type,o.siteId).front,depot.front);
  }
 }
}
