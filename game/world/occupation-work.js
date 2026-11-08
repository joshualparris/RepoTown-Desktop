// Persistent hands-on duties. Choices validate physical work, and each output
// moves an existing resource or releases one finite daily production batch.
const now=t=>t.day*1440+t.minute;
const res=(ok,message)=>({ok,message});
export function occupationState(t){return t.civic.occupationWork??={freight:{next:1,held:null,ready:[],sent:0},post:{held:null,sent:0},coop:{day:0,fed:false,basket:0,packed:false},garden:{day:0,water:0,weeds:3,harvested:false,compost:0},hall:{day:0,tools:false,rubbish:3,bin:0,spill:true,wetUntil:0,cleaned:0},trades:{fault:'hall-lamp',stage:0,restored:false}};}
function active(t,site){const a=t.civic.jobs?.active;const at=site==='trades'?'hall':site;return a?.day===t.day&&a.site===at&&t.playerAt===at&&t.jobSupervisors(at).length&&!(a.breakRemaining>0)?a:null;}
function earn(t,a,task){a.hands??={earned:[],scores:[]};if(!a.hands.earned.includes(task))a.hands.earned.push(task);t.doTask(task);}
export function occupationOptions(t,site,task){
 const s=occupationState(t);
 if(site==='depot'){
  if(task==='sort-freight')return [{id:'collect',label:'Collect actual incoming consignment'},...['post','cafe','store'].map(id=>({id:'sort:'+id,label:'Sort to '+t.place(id).name}))];
  if(task==='verify-manifest')return [1,2,3,4,6].map(n=>({id:'weigh:'+n,label:'Record '+n+' kg and print destination label'}));
  return [{id:'heavy-base',label:'Load heavier carton at base; secure stack'},{id:'top',label:'Place heavy carton on top'},{id:'dispatch',label:'Dispatch a secured load on a free town truck'}];
 }
 if(site==='post'){
  if(task==='sort-mail')return [{id:'collect',label:'Collect one real parcel'},...t.homes.slice(0,3).map(h=>({id:'address:'+h.coordinate,label:'Sort for '+h.coordinate}))];
  if(task==='label-parcels')return [1,2,3].map(n=>({id:'label:'+n,label:'Weigh '+n+' kg; attach address label'}));
  return [{id:'bag',label:'Pack labelled parcel safely in route bag'},{id:'release',label:'Hand over route bag to the resident postie'}];
 }
 if(site==='coop')return task==='feed-hens'?[{id:'feed',label:'Measure one grain bag into the hen feeder'}]:task==='collect-eggs'?[{id:'eggs',label:'Collect two egg cartons from real farm output'}]:[{id:'pack-eggs',label:'Check and pack eggs in dispatch storage'}];
 if(site==='garden'){
  if(task==='water-plants')return [{id:'fill',label:'Fill watering can from finite town water'},{id:'water',label:'Water a crop row'}];
  if(task==='weed-beds')return [{id:'weed',label:'Pull weeds into compost basket'},{id:'compost',label:'Empty basket into compost store'}];
  return [{id:'harvest',label:'Harvest ripe crop from the field'},{id:'store',label:'Pack and store harvested vegetables for deliveries'}];
 }
 if(site==='hall'){
  if(task==='clean-floors')return [{id:'tools',label:'Collect gloves, litter picker and mop'},{id:'rubbish',label:'Pick up visible rubbish'},{id:'mop',label:'Place wet-floor sign and mop spill'}];
  if(task==='empty-bins')return [{id:'bin',label:'Empty collected rubbish into town waste collection'}];
  return [{id:'inspect',label:'Inspect dry safe floor and remove warning sign'}];
 }
 if(site==='trades')return task==='diagnose-fault'?[{id:'diagnose',label:'Diagnose Town Hall work lamp'},{id:'diagnose:tap',label:'Diagnose leaking Town Hall tap'},{id:'diagnose:mixer',label:'Diagnose Bakery mixer fault'}]:task==='isolate-equipment'?[{id:'isolate',label:'Supervisor isolates the game fixture'},{id:'parts',label:'Select one replacement part and insulated tool kit'}]:[{id:'repair',label:'Replace faulty fixture under supervision'},{id:'test',label:'Supervisor restores power and tests working lamp'}];
 return [];
}
export function useOccupation(t,site,task,action){
 const a=active(t,site);if(!a)return res(false,'Start this workplace shift; work on site with its supervisor outside your paid break.');
 const s=occupationState(t),p=t.place(site);
 if(!occupationOptions(t,site,task).some(o=>o.id===action))return res(false,'Use the correct station for this action.');
 if(site==='depot'){
  const f=s.freight;
  if(action==='collect'){
   if(f.held)return res(false,'Finish the carton already on the sorting trolley.');
   const route=[['parcel','post'],['coffee','cafe'],['tea','store']].find(([g])=>(p.out[g]||0)>=2);
   if(!route)return res(false,'No incoming freight. Wait for the train.');
   const [good,to]=route;p.out[good]-=2;f.held={id:f.next++,good,to,n:2,kg:2,stage:'unsorted'};
   return res(true,'Carton '+f.held.id+': '+good+' ×2, '+t.place(to).name+', 2 kg. Carry it to the correct destination pallet.');
  }
  const box=f.held;if(!box)return res(false,'Collect an incoming carton at the sorting station first.');
  if(action.startsWith('sort:')){
   if(action.slice(5)!==box.to)return res(false,'Wrong destination. Read the carton address again. No stock or wages lost.');
   box.stage='sorted';earn(t,a,'sort-freight');return res(true,'Sorted for '+t.place(box.to).name+'. Weigh and label this carton next.');
  }
  if(action.startsWith('weigh:')){
   if(box.stage!=='sorted')return res(false,'Sort to the correct destination first.');
   if(Number(action.slice(6))!==box.kg)return res(false,'Scale shows '+box.kg+' kg. Correct the label; no deduction.');
   box.stage='labelled';earn(t,a,'verify-manifest');return res(true,'Manifest reconciled: '+box.good+' ×'+box.n+', '+box.kg+' kg, '+t.place(box.to).name+'.');
  }
  if(action==='top')return res(false,'Unstable stack: put the heavier carton at the base and secure it. Try again.');
  if(action==='heavy-base'){
   if(box.stage!=='labelled')return res(false,'Weigh and label before loading.');
   box.stage='secured';return res(true,'Heavy carton placed at the base, labelled outward and secured. Dispatch when a truck is free.');
  }
  if(action==='dispatch'){
   if(box.stage!=='secured')return res(false,'Secure the labelled load first.');
   const truck=t.trucks.find(v=>!v.load&&!v.job&&!v.path.length&&Math.hypot(v.x-p.x,v.z-p.curb.z)<25);
   if(!truck)return res(false,'All town trucks are working. The secured load remains saved.');
   truck.job={from:'depot',to:box.to,good:box.good,n:box.n};truck.load={good:box.good,n:box.n};truck.leg='deliver';truck.wait=2;truck.state='carrying player-sorted freight to '+t.place(box.to).name;truck.path=t.routeTruck(truck,box.to);
   f.held=null;f.sent++;earn(t,a,'stack-parcels');return res(true,'Truck '+truck.id+' received the secured load. It must drive the route before the business receives usable stock.');
  }
 }
 if(site==='post'){
  const f=s.post;
  if(action==='collect'){
   if(f.held)return res(false,'Finish the current parcel first.');
   if(!(p.stock.parcel>0))return res(false,'No parcel stock. Depot freight must arrive first.');
   p.stock.parcel--;f.held={to:t.homes[f.sent%Math.min(3,t.homes.length)]?.coordinate,kg:1,stage:'unsorted'};
   if(!f.held.to){p.stock.parcel++;f.held=null;return res(false,'No address is available.');}
   return res(true,'Parcel address '+f.held.to+'; scale reads 1 kg. Sort to that round.');
  }
  const box=f.held;if(!box)return res(false,'Collect a parcel from incoming stock first.');
  if(action.startsWith('address:')){if(action.slice(8)!==box.to)return res(false,'Wrong address. Read '+box.to+' and sort again.');box.stage='sorted';earn(t,a,'sort-mail');return res(true,'Correct destination. Weigh and label next.');}
  if(action.startsWith('label:')){if(box.stage!=='sorted'||Number(action.slice(6))!==box.kg)return res(false,'Sort first, then record the actual 1 kg scale reading.');box.stage='labelled';earn(t,a,'label-parcels');return res(true,'Correct address and weight label attached.');}
  if(action==='bag'){if(box.stage!=='labelled')return res(false,'Label before loading the route bag.');box.stage='bagged';return res(true,'Parcel safely packed in route bag for '+box.to+'.');}
  if(action==='release'){
   if(box.stage!=='bagged')return res(false,'Prepare the safe route bag first.');
   // Existing postRound consumes post stock and creates actual doorstep parcels.
   // Return this exact reserved unit, ready for its postie; never create extras.
   p.stock.parcel++;(f.ready??=[]).push(box.to);f.sent++;f.held=null;earn(t,a,'prepare-route');return res(true,'Prepared parcel handed to the resident postie for the next round.');
  }
 }
 if(site==='coop'){
  const c=s.coop;
  if(c.day!==t.day&&!c.basket){c.day=t.day;c.fed=false;c.packed=false;}
  if(action==='feed'){if(c.fed)return res(false,'Hens already fed today.');if(!(p.stock.grain>=1))return res(false,'No grain feed. The Wheat Farm delivery must arrive.');p.stock.grain--;c.fed=true;earn(t,a,'feed-hens');return res(true,'One grain bag measured into the feeder. Hens fed; collect their actual egg output next.');}
  if(action==='eggs'){if(!c.fed||c.basket||c.packed)return res(false,'Feed first; each daily collection can be packed once.');if(!(p.out.eggs>=2))return res(false,'No ripe egg output yet. Wait for farm production.');p.out.eggs-=2;c.basket=2;earn(t,a,'collect-eggs');return res(true,'Two real egg cartons collected into your basket.');}
  if(action==='pack-eggs'){if(!c.basket)return res(false,'Collect the eggs first.');p.out.eggs=(p.out.eggs||0)+c.basket;c.basket=0;c.packed=true;earn(t,a,'store-eggs');return res(true,'Egg cartons checked, labelled and stored for town delivery; no extra eggs created.');}
 }
 if(site==='garden'){
  const g=s.garden;
  if(g.day!==t.day&&(g.day===0||g.harvested)){g.day=t.day;g.water=0;g.weeds=3;g.harvested=false;g.basket=0;g.crate=0;}
  if(action==='fill'){if(g.can)return res(false,'Your watering can is already full.');const water=t.place('waterworks').stock;if(!(water.water>=1))return res(false,'Town water is unavailable.');water.water--;g.can=2;return res(true,'Can filled: one unit drawn from the town reservoir.');}
  if(action==='water'){if(!g.can)return res(false,'Fill the watering can first.');if(g.water>=2)return res(false,'Both rows are watered; avoid wasting water.');g.can--;g.water++;if(g.water===2)earn(t,a,'water-plants');return res(true,'Watered row '+g.water+'/2. Visible crop care is saved.');}
  if(action==='weed'){if(!g.weeds)return res(false,'Beds are already weed-free.');g.weeds--;g.basket=(g.basket||0)+1;return res(true,'Weed pulled. '+g.weeds+' remain; basket '+g.basket+'.');}
  if(action==='compost'){if(g.weeds||!g.basket)return res(false,'Clear both beds before emptying the basket.');g.compost+=g.basket;g.basket=0;earn(t,a,'weed-beds');return res(true,'Weeds moved to compost storage; beds are clear.');}
  if(action==='harvest'){if(g.harvested||g.crate)return res(false,'This daily plot has already been harvested.');if(g.water<2||g.weeds)return res(false,'Water and weed the crop before harvesting.');if((p.out.veg||0)<3)return res(false,'The crop is not ripe yet. Wait for actual farm production.');p.out.veg-=3;g.crate=3;return res(true,'Three ripe vegetables picked into your crate, reserved from the farm harvest.');}
  if(action==='store'){if(!g.crate)return res(false,'Harvest a crate first.');p.out.veg=(p.out.veg||0)+g.crate;g.crate=0;g.harvested=true;earn(t,a,'pack-produce');return res(true,'Packed vegetables stored for the existing delivery trucks and residents’ meals. No new goods created.');}
 }
 if(site==='hall'){
  const h=s.hall;
  if(h.day!==t.day){h.day=t.day;h.rubbish=3;h.spill=true;h.wetUntil=0;h.tools=false;}
  if(action==='tools'){h.tools=true;return res(true,'Gloves, litter picker, mop and warning sign collected.');}
  if(!h.tools)return res(false,'Collect the cleaning equipment first.');
  if(action==='rubbish'){if(!h.rubbish)return res(false,'Visible litter is already collected.');h.rubbish--;h.bin++;return res(true,'Collected one piece of litter; '+h.rubbish+' remain.');}
  if(action==='mop'){if(h.rubbish)return res(false,'Pick up litter before mopping.');if(!h.spill)return res(false,'Spill already mopped. Wait for the floor to dry.');h.spill=false;h.wetUntil=now(t)+5;earn(t,a,'clean-floors');return res(true,'Spill mopped; wet-floor sign stays for five town minutes.');}
  if(action==='bin'){if(h.rubbish||!h.bin)return res(false,'Collect the visible rubbish before emptying the bin.');t.rubbish(h.bin);h.bin=0;earn(t,a,'empty-bins');return res(true,'Bin emptied into the town’s actual waste collection stream.');}
  if(action==='inspect'){if(h.spill||h.rubbish||h.bin)return res(false,'Finish the spill, litter and bins first.');if(now(t)<h.wetUntil)return res(false,'Still wet: leave the sign for '+Math.ceil(h.wetUntil-now(t))+' town minutes.');h.wetUntil=0;h.cleaned++;earn(t,a,'inspect-floor');return res(true,'Floor dry and clear. Warning sign removed; residents have a clean, safer space.');}
 }
 if(site==='trades'){
  const f=s.trades;f.assets??={};
  if(action.startsWith('diagnose')){
   if(f.stage>0&&f.stage<5)return res(false,'Finish the current isolated repair before diagnosing another asset.');
   const id=action==='diagnose:tap'?'hall-tap':action==='diagnose:mixer'?'bakery-mixer':'hall-lamp';
   if(f.assets[id]?.restored)return res(false,'This asset has already been repaired and tested. No repeat faults or charges.');
   f.fault=id;f.stage=1;f.restored=false;f.assets[id]={restored:false,failedAt:now(t)};
   earn(t,a,'diagnose-fault');return res(true,'Fault confirmed: '+id+'. Supervisor approved '+(id==='bakery-mixer'?2:1)+' replacement part(s). Isolate this game asset before repair.');
  }
  if(f.restored)return res(false,'This asset is already restored; choose another fault at the diagnostic station.');
  if(action==='isolate'&&f.stage===1){f.stage=2;return res(true,'Supervisor isolated the game fixture. Choose the correct replacement part and tools.');}
  if(action==='parts'&&f.stage===2){const stock=t.place('hall').stock;const needed=f.fault==='bakery-mixer'?2:1;if(!(stock.parts>=needed))return res(false,'No replacement part: Foundry must supply the Hall.');stock.parts-=needed;f.stage=3;earn(t,a,'isolate-equipment');return res(true,'One real Foundry part reserved; correct tools selected.');}
  if(action==='repair'&&f.stage===3){f.stage=4;return res(true,'Faulty module replaced under supervision. Test before acceptance.');}
  if(action==='test'&&f.stage===4){f.stage=5;f.restored=true;f.assets[f.fault]={...f.assets[f.fault],restored:true,testedAt:now(t)};t.stats.repairs=(t.stats.repairs||0)+1;earn(t,a,'repair-test');return res(true,'Supervisor test passed. '+f.fault+' restored: working light, stopped leak or functioning bakery mixer. Repair persists in the save.');}
  return res(false,'Follow diagnosis → supervisor isolation → parts/tools → repair → test. Incorrect steps never reduce wages.');
 }
 return res(false,'This action is not ready at this station.');
}

export function workAssetFault(t,id){return !!t.civic.occupationWork?.trades?.assets?.[id]&&!t.civic.occupationWork.trades.assets[id].restored;}
export function tickOccupationWork(t,minutes){
 if(!workAssetFault(t,'hall-tap'))return;
 const f=t.civic.occupationWork.trades;f.leakMinutes=(f.leakMinutes||0)+Math.max(0,minutes);
 const units=Math.floor(f.leakMinutes/60);if(!units)return;f.leakMinutes-=units*60;
 const water=t.place('waterworks').stock;water.water=Math.max(0,(water.water||0)-units);
}
