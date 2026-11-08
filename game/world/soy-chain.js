// Repository Town soybean production: a compressed 28-day agricultural year.
// Modelled stages, amounts and temperature indicators are GAME abstractions,
// not processing instructions, NSW food-business approval or HACCP validation.
// Every incoming bag and outgoing bottle remains finite and saved.
const clock=t=>t.day*1440+t.minute;
export const SOY_GROW_DAYS=7,SOY_COLD_LIMIT=240,SOY_SHELF_DAYS=3;
const ok=(message)=>({ok:true,message}),no=message=>({ok:false,message});
export function soyState(t){
 return t.civic.soy??=( {version:1,
   field:{phase:'fallow',plantedDay:0,wateredDay:0,irrigations:0,scoutedDay:0,scouts:0},
   batch:null,lots:[],cafeLots:[],next:1,waste:0,history:[],lastAutoHour:-1
 });
}
const record=(s,t,message)=>{s.history.unshift('Day '+t.day+' '+t.time()+': '+message);s.history.length=Math.min(32,s.history.length)};
const powered=t=>t.gridPowered('industry')&&t.civic.supply.waterOk;
const liquid=t=>t.place('waterworks').stock.water||0;
export function soyAction(t,site,action,automated=false){
 const s=soyState(t),farm=t.place('soyfarm'),plant=t.place('soyplant'),f=s.field,now=clock(t);
 if(!automated&&!(t.playerAt===site&&t.civic.jobs?.active?.site===site))
   return no('You must clock in to the soybean farm or plant shift before operating this equipment.');
 const complete=(step,message)=>{
   if(!automated){
     const task={sow:'field-preparation',irrigate:'crop-irrigation',inspect:'crop-scouting',
       clean:'intake-quality',grind:'wet-grinding',filter:'wet-grinding',pack:'pack-and-label'}[step];
     if(task)t.doTask(task);
   }
   return ok(message);
 };
 if(site==='soyfarm'){
  if(action==='sow'){
   if(f.phase!=='fallow')return no('A soybean crop is already growing. Rotate paddocks between harvests.');
   if((farm.out.soybeans||0)<2)return no('Keep two bags of viable, tested soybean seed for the next sowing.');
   farm.out.soybeans-=2;Object.assign(f,{phase:'growing',plantedDay:t.day,wateredDay:0,irrigations:0,scoutedDay:0,scouts:0});
   record(s,t,'Two bags of certified seed allocated to the summer paddock; crop planted.');return complete(action,'Soy planted in the irrigated paddock. This town uses a compressed seven-day growing season.');
  }
  if(action==='irrigate'){
   if(f.phase!=='growing')return no('There is no live soybean crop to irrigate.');
   if(f.wateredDay===t.day)return no('Paddock already watered today.');
   if(!t.civic.supply.waterOk||liquid(t)<1)return no('Irrigation requires available treated water; the pumps or reservoir are unavailable.');
   t.place('waterworks').stock.water--;f.irrigations++;f.wateredDay=t.day;
   record(s,t,'Irrigated soybean crop; one reservoir unit consumed.');return complete(action,'Drip irrigation logged. Water was deducted from the working reservoir.');
  }
  if(action==='inspect'){
   if(f.phase!=='growing')return no('No standing crop to inspect.');
   if(f.scoutedDay===t.day)return no('Crop was already scouted today.');
   f.scoutedDay=t.day;f.scouts++;
   const stress=f.irrigations<1?'Water stress risk.':'Leaf rust / pest check recorded; no obvious signs.';
   record(s,t,'Soy crop scouted: '+stress);return complete(action,stress+' Harvest is possible from day '+(f.plantedDay+SOY_GROW_DAYS)+'.');
  }
  if(action==='harvest'){
   if(f.phase!=='growing')return no('Plant a crop before harvesting.');
   if(t.day-f.plantedDay<SOY_GROW_DAYS)return no('Soy pods are not mature yet. Harvest from day '+(f.plantedDay+SOY_GROW_DAYS)+'.');
   if(f.scouts<1)return no('Inspect the crop before harvest to assess damage and seed quality.');
   const lost=Math.max(0,2-Math.min(2,f.irrigations))*4;
   const yieldBags=Math.max(4,18-lost-(t.civic.weather==='rainy'?2:0));
   if((farm.out.soybeans||0)+yieldBags>80)return no('The dry seed store is full; dispatch previous harvested beans first.');
   farm.out.soybeans=(farm.out.soybeans||0)+yieldBags;
   Object.assign(f,{phase:'fallow',plantedDay:0});
   t.stats.harvested.soybeans=(t.stats.harvested.soybeans||0)+yieldBags;
   record(s,t,'Harvested '+yieldBags+' bags of food-grade soybeans; '+lost+' bags lost to irrigation stress.');return complete(action,'Harvest completed: '+yieldBags+' bags of dry beans to the shed. Two bags must be retained for the next planting.');
  }
  return no('Unknown soybean field task.');
 }
 if(site!=='soyplant')return no('Unknown soybean workplace.');
 const b=s.batch;
 if(action==='clean'){
   if(b)return no('Finish or reject the current batch before starting another.');
   if((plant.stock.soybeans||0)<2)return no('Waiting for two bags of soybean deliveries from the farm.');
   if(!t.civic.supply.waterOk||liquid(t)<1)return no('No safe process water available; batch cannot start.');
   plant.stock.soybeans-=2;t.place('waterworks').stock.water--;
   s.batch={id:'SOY-'+s.next++,stage:'cleaned',started:now,readyAt:now,beans:2,water:1};
   record(s,t,'Dry beans graded, damaged seeds rejected, washed and batch '+s.batch.id+' opened.');
   return complete(action,'Beans weighed, sorted and washed. Batch '+s.batch.id+' logged with one water unit used.');
 }
 if(!b)return no('Begin at raw soybean intake; no batch in progress.');
 if(action==='soak'){
   if(b.stage!=='cleaned')return no('Beans must be graded and washed before soaking.');
   b.stage='soaking';b.readyAt=now+120;record(s,t,b.id+' placed in supervised covered hydration vessel.');
   return complete(action,'Hydration started. Covered, food-safe tank needs 120 town minutes before wet grinding.');
 }
 if(action==='grind'){
   if(b.stage!=='soaking'||now<b.readyAt)return no('Beans need to finish the supervised soaking interval first.');
   if(!powered(t)||liquid(t)<1)return no('Grinding needs running power, potable process water and working pumps.');
   t.place('waterworks').stock.water--;b.water++;b.stage='ground';return complete(action,'Hydrated beans wet-ground with one additional process-water unit.');
 }
 if(action==='filter'){
   if(b.stage!=='ground')return no('Wet grinding must be completed before filtering.');
   b.stage='filtered';b.okara=1;return complete(action,'Fine slurry filtered. Soy pulp separated and held for controlled disposal.');
 }
 if(action==='heat'){
   if(b.stage!=='filtered')return no('Filter the soy extract before the heat-treatment stage.');
   if(!powered(t))return no('Safety interlock: no power or town water. Do not bypass the heat process.');
   b.stage='heating';b.readyAt=now+30;return complete(action,'Validated industrial heat cycle simulated; a 30-town-minute interlock prevents early release.');
 }
 if(action==='pack'){
   if(b.stage!=='heating'||now<b.readyAt)return no('Heat-treatment holding time incomplete. Uncooked soy extract must never be bottled.');
   if(!powered(t))return no('Packaging blocked: required electricity and sanitation services unavailable.');
   if((plant.out.soymilk||0)+6>48)return no('The chilled finished-goods store is full.');
   const lot={id:b.id,n:6,packedDay:t.day,expiresDay:t.day+SOY_SHELF_DAYS,allergen:'SOY'};
   s.lots.push(lot);plant.out.soymilk=(plant.out.soymilk||0)+lot.n;s.batch=null;
   s.waste++;t.rubbish(1);
   record(s,t,'Packaged six chilled soy-drink cartons labelled '+lot.id+' / SOY allergen / use-by Day '+lot.expiresDay+'.');
   return complete(action,'Six sealed soy-drink cartons chilled and labelled. Batch '+lot.id+'; SOY allergen and use-by Day '+lot.expiresDay+'.');
 }
 if(action==='reject'){
   if(!b)return no('No unsealed batch remains.');
   s.batch=null;s.waste+=2;t.rubbish(2);record(s,t,'Rejected '+b.id+' and destroyed unsealed product.');
   return complete(action,'Batch '+b.id+' quarantined and discarded; reserved ingredients are not returned to stock.');
 }
 return no('Unknown soy-processing operation.');
}
function throwOut(t,n,why){
 if(n<=0)return;
 const s=soyState(t);s.waste+=n;t.stats.wasted=(t.stats.wasted||0)+n;t.rubbish(n);t.log('Soy quality hold: '+n+' cartons destroyed — '+why+'.');record(s,t,n+' cartons discarded: '+why);
}
export function reconcileCafeSoy(t){
 const s=soyState(t),cafe=t.place('cafe');
 // Sales may consume the stock directly in both café order engines.
 const physical=Math.max(0,cafe.stock.soymilk||0);
 let excess=s.cafeLots.reduce((n,b)=>n+b.n,0)-physical;
 for(const lot of s.cafeLots)if(excess>0){const taken=Math.min(excess,lot.n);lot.n-=taken;excess-=taken;}
 s.cafeLots=s.cafeLots.filter(b=>b.n>0);
}
export function takeSoyShipment(t,n){
 const s=soyState(t),plant=t.place('soyplant');
 if((plant.out.soymilk||0)<n)return null;
 const picked=[];let remaining=n;
 for(const lot of s.lots){
  const move=Math.min(remaining,lot.n);if(move){picked.push({...lot,n:move});lot.n-=move;remaining-=move;}
  if(!remaining)break;
 }
 if(remaining)return null;
 s.lots=s.lots.filter(x=>x.n>0);
 plant.out.soymilk-=n;
 return picked;
}
export function deliverSoyShipment(t,truck){
 const s=soyState(t),n=truck.load?.n||0,age=clock(t)-(truck.load?.loadedAt??clock(t));
 const bad=(truck.load?.soyLots||[]).some(b=>b.expiresDay<t.day);
 if(age>SOY_COLD_LIMIT||bad||!t.gridPowered('bakery')){
   throwOut(t,n,age>SOY_COLD_LIMIT?'refrigerated journey exceeded maximum':'expired or receiving cooler unpowered');
   return false;
 }
 reconcileCafeSoy(t);
 for(const lot of truck.load.soyLots||[])s.cafeLots.push({...lot});
 return true;
}
export function soyHourly(t){
 const s=soyState(t),stamp=t.day*24+Math.floor(t.minute/60);
 if(s.lastAutoHour===stamp)return;
 s.lastAutoHour=stamp;
 const working=id=>t.villagers.some(v=>v.work===id&&v.step?.kind==='work'&&!v.path?.length);
 const f=s.field,h=Math.floor(t.minute/60);
 // Actual visible crop grows, yellows and disappears on harvest rather than being permanent scenery.
 t.place('soyfarm').growth=f.phase==='growing'?Math.max(.05,Math.min(1,(t.day-f.plantedDay)/SOY_GROW_DAYS)):0;
 // An on-site professional does regular crop husbandry, rather than minting grain every hour.
 if(working('soyfarm')&&t.open(t.place('soyfarm'))){
  if(f.phase==='fallow'&&h===8&&(t.place('soyfarm').out.soybeans||0)>=2)soyAction(t,'soyfarm','sow',true);
  if(f.phase==='growing'){
   if(h===9&&(t.day-f.plantedDay)%2===0)soyAction(t,'soyfarm','irrigate',true);
   if(h===11)soyAction(t,'soyfarm','inspect',true);
   if(h===14&&t.day-f.plantedDay>=SOY_GROW_DAYS)soyAction(t,'soyfarm','harvest',true);
  }
 }
 if(working('soyplant')&&t.open(t.place('soyplant'))){
  const next=!s.batch?'clean':{cleaned:'soak',soaking:'grind',ground:'filter',filtered:'heat',heating:'pack'}[s.batch.stage];
  if(next)soyAction(t,'soyplant',next,true);
 }
 reconcileCafeSoy(t);
 for(const [placeId,where] of [['soyplant','lots'],['cafe','cafeLots']]){
  const p=t.place(placeId),stock=placeId==='soyplant'?p.out:p.stock;
  const expired=s[where].filter(b=>b.expiresDay<t.day);
  if(expired.length){
   const qty=expired.reduce((n,b)=>n+b.n,0);
   stock.soymilk=Math.max(0,(stock.soymilk||0)-qty);
   s[where]=s[where].filter(b=>b.expiresDay>=t.day);
   throwOut(t,qty,'passed labelled chilled use-by date');
  }
 }
 if(s.batch&&clock(t)-s.batch.started>1440){
  const b=s.batch;s.batch=null;s.waste+=2;t.rubbish(2);record(s,t,'Unfinished '+b.id+' quarantined after overnight interruption.');
 }
}
export function soyReport(t){
 const s=soyState(t);
 return {field:{...s.field,age:s.field.phase==='growing'?t.day-s.field.plantedDay:0},
  farmBeans:t.place('soyfarm').out.soybeans||0,processorBeans:t.place('soyplant').stock.soybeans||0,
  batch:s.batch&&{...s.batch},ready:t.place('soyplant').out.soymilk||0,
  cafe:t.place('cafe').stock.soymilk||0,lots:s.lots,cafeLots:s.cafeLots,
  waste:s.waste,history:s.history.slice(0,12)};
}
