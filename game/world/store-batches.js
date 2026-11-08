import { pilotMains } from './electrical-pilot.js';

// Batch metadata reconciles against the existing authoritative stock totals.
// Reserving/returning a carton moves its exact batch; it never manufactures stock.
const shelfLife={bread:2,milk:3,eggs:7,coffee:30,tea:30};
const suppliers={bread:'bakery',milk:'dairy',eggs:'coop',coffee:'depot',tea:'depot'};
const chilled=g=>['milk','eggs'].includes(g);
const clock=t=>t.day*1440+t.minute;
const order=(a,b)=>a.expires-b.expires||a.id-b.id;
export const SAFE_TEMP=5,PROBE_WITHIN=120;                 // °C at the dock; town minutes to probe
const CREDITABLE=['Damaged packaging','Warm on arrival'];
export function storeBatches(t){
 const s=t.civic.storeBatches??={next:1,lots:[],quarantine:[],claims:[],lastAt:clock(t)};
 const stock=t.place('store').stock;
 for(const good of Object.keys(shelfLife)){
  const have=Math.max(0,stock[good]||0),tracked=s.lots.filter(b=>b.good===good).reduce((n,b)=>n+b.n,0);
  if(have>tracked){const n=have-tracked;s.lots.push({id:s.next++,good,n,shelf:0,received:t.day,expires:t.day+shelfLife[good],supplier:suppliers[good],warm:0});}
  let remove=tracked-have;
  for(const b of s.lots.filter(b=>b.good===good).sort(order)){const n=Math.min(Math.max(0,remove),b.n);b.n-=n;b.shelf=Math.max(0,b.shelf-n);remove-=n;}
 }
 s.lots=s.lots.filter(b=>b.n>0);
 return s;
}
export function batchLabel(b){return '#'+b.id+' '+b.good+' · received day '+b.received+' · use by day '+b.expires+' · '+b.n+' units'+(chilled(b.good)?' · cold exposure '+Math.ceil(b.warm||0)+' min':'');}
export function reserveBatch(t,good,batchId,max=3){
 const s=storeBatches(t),available=s.lots.filter(b=>b.good===good&&b.n>b.shelf).sort(order),b=available[0];
 if(!b)return {ok:false,message:'No backroom batch of '+good+' is available.'};
 if(b.probe==='pending')return {ok:false,message:'Batch #'+b.id+' is a chilled delivery still on the dock. Probe its temperature at receiving first.'};
 if(batchId!==undefined&&Number(batchId)!==b.id)return {ok:false,message:'Use first-expiring batch #'+b.id+' before newer stock. Read the date labels.'};
 if(b.expires<=t.day)return {ok:false,message:'This batch is past its game use-by date. Quarantine it.'};
 const n=Math.min(max,b.n-b.shelf);b.n-=n;t.place('store').stock[good]-=n;
 return {ok:true,carton:{good,n,batch:{...b,n,shelf:0},pickedAt:clock(t),warm:b.warm||0},message:'Carrying '+n+' '+good+' from batch #'+b.id+', use by day '+b.expires+'.'};
}
export function cartonUnsafe(t,carton){return carton.batch?.expires<=t.day||(chilled(carton.good)&&(carton.warm||0)+clock(t)-(carton.pickedAt??clock(t))>=120);}
export function restoreBatch(t,carton,onShelf=false){
 const s=storeBatches(t);
 if(cartonUnsafe(t,carton)){s.quarantine.push({...carton.batch,n:carton.n,good:carton.good,reason:'Date / cold exposure',returned:false});return false;}
 const info=carton.batch||{id:s.next++,good:carton.good,received:t.day,expires:t.day+shelfLife[carton.good],supplier:suppliers[carton.good],warm:0};
 let b=s.lots.find(x=>x.id===info.id);if(!b){b={...info,n:0,shelf:0};s.lots.push(b);}
 b.n+=carton.n;b.shelf+=onShelf?carton.n:0;b.warm=(carton.warm||0)+(chilled(carton.good)?clock(t)-(carton.pickedAt??clock(t)):0);
 t.place('store').stock[carton.good]=(t.place('store').stock[carton.good]||0)+carton.n;
 return true;
}
export function quarantineBatch(t,good){
 const s=storeBatches(t),b=s.lots.filter(b=>b.good===good&&b.n>b.shelf).sort(order)[0];if(!b)return null;
 b.n--;t.place('store').stock[good]--;const q={...b,n:1,shelf:0,reason:'Damaged packaging',returned:false};s.quarantine.push(q);return q;
}
export function returnToSupplier(t,id){
 const s=storeBatches(t),q=s.quarantine.find(q=>q.id===Number(id)&&!q.returned);
 if(!q)return {ok:false,message:'This quarantined batch has already been returned, or does not exist.'};
 q.returned=true;
 // Only an invoiced delivery that was faulty on arrival (damaged, or warm at the dock) earns a
 // credit, and it is paid back out of the supplier's own till: money moves, it is never created.
 // Stock that spoiled in storage is the store's loss, and without an invoice there is nothing to credit.
 const supplier=t.place(q.supplier),claimable=q.unitCost>0&&CREDITABLE.some(r=>q.reason?.startsWith(r));
 const credit=claimable&&supplier?Math.min(Math.round(q.n*q.unitCost*100)/100,Math.max(0,supplier.till)):0;
 if(credit){supplier.till-=credit;t.place('store').till+=credit;}
 s.claims.push({id:s.claims.length+1,batch:q.id,good:q.good,n:q.n,supplier:q.supplier,status:'returned',day:t.day,credit});
 return {ok:true,credit,message:'Batch #'+q.id+' returned to '+(supplier?.name||'supplier')+'. '+(credit?'Credit note: $'+credit.toFixed(2)+' paid back to the store.':claimable?'The supplier has no money to credit right now.':'No credit: '+(q.unitCost>0?'it spoiled in storage, which is the store’s loss.':'there is no invoice for this stock.'))};
}
export function tickStoreBatches(t){
 if(!t.civic.storeBatches)return;
 const s=storeBatches(t),stock=t.place('store').stock;let wasted=0;
 const elapsed=Math.max(0,clock(t)-(s.lastAt??clock(t)));s.lastAt=clock(t);
 const pilot=pilotMains(t,'B:store');
 const powered=pilot===null?t.gridPowered('bakery'):pilot;
 for(const b of s.lots)if(chilled(b.good)&&!powered)b.warm=(b.warm||0)+elapsed;
 for(const b of s.lots){if(b.expires<=t.day||(chilled(b.good)&&(b.warm||0)>=240)){stock[b.good]=Math.max(0,(stock[b.good]||0)-b.n);wasted+=b.n;b.n=0;}}
 s.lots=s.lots.filter(b=>b.n>0);
 if(wasted){t.stats.wasted+=wasted;t.rubbish(wasted);t.log('General Store date rotation removed '+wasted+' expired / cold-chain failed units before sale.');}
}

// A truck has just unloaded at the General Store (life.js truckArrived adds the stock first): record
// the invoiced lot with its real supplier and cost. Chilled loads wait on the dock for a probe.
// Whole degrees from the arrival minute (the town clock runs in fractional minutes).
export function deliveryTemp(t,good,n){const h=(Math.floor(t.day*1440+t.minute)*31+good.length*17+n*7)%97;return h<3?6+(h%4):2+(h%3);}
export function noteStoreDelivery(t,good,n,from,paid){
 if(!(good in shelfLife)||!n)return null;
 const stock=t.place('store').stock;stock[good]-=n;const s=storeBatches(t);stock[good]+=n;
 const lot={id:s.next++,good,n,shelf:0,received:t.day,expires:t.day+shelfLife[good],supplier:from||suppliers[good],warm:0,unitCost:Math.round(paid/n*100)/100,arrived:clock(t)};
 if(chilled(good)){lot.temp=deliveryTemp(t,good,n);lot.probe='pending';}
 s.lots.push(lot);return lot;
}
export function probeBatch(t,id){
 const s=storeBatches(t),b=s.lots.find(b=>b.id===Number(id)&&b.probe==='pending');
 if(!b)return {ok:false,message:'That delivery has already been checked.'};
 if(b.temp>SAFE_TEMP){
  t.place('store').stock[b.good]=Math.max(0,(t.place('store').stock[b.good]||0)-b.n);
  s.quarantine.push({...b,shelf:0,reason:'Warm on arrival ('+b.temp+' °C)',returned:false});b.n=0;s.lots=s.lots.filter(x=>x.n>0);
  return {ok:true,rejected:true,message:b.good+' probed at '+b.temp+' °C, above '+SAFE_TEMP+' °C: rejected into the returns cage for a supplier credit.'};
 }
 b.probe='accepted';return {ok:true,message:b.good+' probed at '+b.temp+' °C: accepted into the cold room, use by day '+b.expires+'.'};
}
// Staff probe arrivals and do the 16:00 supplier returns themselves when nobody is on a store shift.
// On the player's shift, a chilled load left unprobed for two hours is binned as unsafe.
export function storeStaffRoutines(t,playerOnShift){
 if(!t.civic.storeBatches)return;
 const s=storeBatches(t);
 for(const b of s.lots.filter(b=>b.probe==='pending')){
  if(!playerOnShift){probeBatch(t,b.id);continue;}
  if(clock(t)-(b.arrived??clock(t))<=PROBE_WITHIN)continue;
  t.place('store').stock[b.good]=Math.max(0,(t.place('store').stock[b.good]||0)-b.n);t.stats.wasted+=b.n;t.rubbish(b.n);
  t.log(b.n+' '+b.good+' sat on the General Store dock unprobed for over two hours and was thrown out.');b.n=0;
 }
 s.lots=s.lots.filter(b=>b.n>0);
 if(!playerOnShift&&t.minute>=16*60&&s.returnsDay!==t.day){s.returnsDay=t.day;for(const q of s.quarantine.filter(q=>!q.returned))returnToSupplier(t,q.id);}
}
