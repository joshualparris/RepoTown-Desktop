import {pubStaffRefusal} from './pub-venue.js';
// Synthetic venue operations and independently isolated building services.
// Game checks are not NCC certification, licences or competent-person inspection.
export const PUB_SERVICE_EDGES = Object.freeze([
 ['water','town-water','water-meter'],['water','water-meter','backflow'],['water','backflow','water-isolator'],
 ...['wc','wc2','basin','basin2','prep','dishwasher','bar-water','heater','cellar-basin'].map(id=>['water','water-isolator',id]),
 ['sanitary','cellar-basin','cellar-sump'],['sanitary','cellar-sump','sanitary-lateral'],['sanitary','wc2','sanitary-lateral'],['sanitary','basin2','sanitary-lateral'],['sanitary','wc','sanitary-lateral'],['sanitary','basin','sanitary-lateral'],['sanitary','sanitary-lateral','town-sewer'],
 ['trade','prep','grease-arrestor'],['trade','dishwasher','grease-arrestor'],['trade','grease-arrestor','trade-lateral'],['trade','trade-lateral','town-sewer'],
 ['stormwater','roof','gutters'],['stormwater','gutters','downpipes'],['stormwater','downpipes','storm-outlet'],
 ['gas','town-gas','gas-meter'],['gas','gas-meter','regulator'],['gas','lpg-store','regulator'],['gas','regulator','gas-isolator'],['gas','gas-isolator','cooker'],
 ...['cooker','heater','cold-room','lights','network','television','radio','dishwasher','lift','cellar-vent','keg-cooler','cellar-sump','upper-lights'].map(id=>['electricity','switchboard',id]),
 ['beer','cellar-keg','keg-cooler'],['beer','keg-cooler','beer-riser'],['beer','beer-riser','beer-taps'],['beverage-gas','outside-co2','beverage-regulator'],['beverage-gas','beverage-regulator','cellar-keg'],
 ['internet','carrier','network'],['internet','network','eftpos'],
 ['telephone','network','ata'],['telephone','ata','desk-phone'],['mobile','mobile-carrier','handset'],['radio','radio-transmitter','radio-antenna'],['radio','radio-antenna','radio'],['television','tv-transmitter','tv-aerial'],['television','tv-aerial','television'],['fuel','lpg-depot','delivery-truck'],['fuel','delivery-truck','lpg-store'],
 ['waste','kitchen-waste','general-bin'],['waste','bar-recycling','recycling-bin'],['waste','general-bin','collector'],['waste','recycling-bin','collector']
].map(([utility,from,to])=>Object.freeze({id:'pub:'+utility+':'+from+':'+to,utility,from,to})));
export function pubStandards(life){
 life.civic ||= {};
 const s=life.civic.pubStandards ||= {version:1,failed:[],alarm:false,gasLeak:false,rcdTrip:false,detectorFault:false,exhaustFault:false,clean:true,soap:true,towels:true,pests:false,verifiedAdult:false,intoxicated:false,licenceScenario:true,foodSupervisor:true,foodTraining:true,allergenConfirmed:false,inspections:[],events:[],stormStoredL:0,stormDischargedL:0,stormOverflowL:0,disposedKg:0,wcPrivacy:false};
 s.disposedOilL ??= 0;s.disposedGreaseKg ??= 0;
 return s;
}
export function validPubStandards(s){
 if(!s||s.version!==1||!Array.isArray(s.failed)||s.failed.length>100||!s.failed.every(x=>typeof x==='string'&&x.length<100))return false;
 for(const k of ['alarm','gasLeak','rcdTrip','detectorFault','exhaustFault','clean','soap','towels','pests','verifiedAdult','intoxicated','licenceScenario','foodSupervisor','foodTraining','allergenConfirmed','wcPrivacy'])if(typeof s[k]!=='boolean')return false;
 for(const k of ['stormStoredL','stormDischargedL','stormOverflowL','disposedKg'])if(!Number.isFinite(s[k])||s[k]<0||s[k]>1e12)return false;
 for(const k of ['disposedOilL','disposedGreaseKg'])if(s[k]!==undefined&&(!Number.isFinite(s[k])||s[k]<0||s[k]>1e12))return false;
 return Array.isArray(s.inspections)&&s.inspections.length<=20&&s.inspections.every(x=>x&&typeof x==='object'&&typeof x.result==='string')&&Array.isArray(s.events)&&s.events.length<=30&&s.events.every(x=>typeof x==='string'&&x.length<1000);
}
export function pubConnected(life,utility,from,to){
 const s=pubStandards(life),seen=new Set([from]),q=[from];if(s.failed.includes(from)||s.failed.includes(to))return false;
 for(let i=0;i<q.length;i++){if(q[i]===to)return true;for(const e of PUB_SERVICE_EDGES)if(e.utility===utility&&e.from===q[i]&&!seen.has(e.to)&&!s.failed.includes(e.id)&&!s.failed.includes(e.to)){seen.add(e.to);q.push(e.to);}}
 return false;
}
export function pubActualPatrons(life){return (life.villagers||[]).filter(v=>v.inside&&v.step?.at==='pub'&&v.step.kind!=='work').length;}
export function pubAdmission(life){if(!life.civic)return {allowed:true};const s=pubStandards(life);if(s.alarm||s.gasLeak)return {allowed:false,reason:'evacuation',message:'Pub closed for an active emergency. Both exits remain available to leave.'};if(pubActualPatrons(life)>=24)return {allowed:false,reason:'capacity',message:'The pub is at its 24-patron gameplay limit; wait for a patron to leave.'};return {allowed:true};}
export function pubFoodGate(life){const s=pubStandards(life);return !s.alarm&&!s.gasLeak&&!s.rcdTrip&&!s.exhaustFault&&s.clean&&s.soap&&s.towels&&!s.pests&&s.foodSupervisor&&s.foodTraining&&pubConnected(life,'gas',life.civic.pubVenue?.gasSource==='natural'?'town-gas':'lpg-store','cooker')&&pubConnected(life,'electricity','switchboard','cooker')&&pubConnected(life,'trade','prep','town-sewer')&&pubConnected(life,'trade','dishwasher','town-sewer')&&pubConnected(life,'water','town-water','prep')&&pubConnected(life,'water','town-water','dishwasher');}
export function pubAlcoholRefusal(life,good='pub_beer'){const s=pubStandards(life),u=life.civic.pubUtilities;if(good==='pub_beer'&&(!pubConnected(life,'beer','cellar-keg','beer-taps')||!pubConnected(life,'beverage-gas','outside-co2','cellar-keg')))return 'Beer service isolated at the cellar or beverage-gas branch.';if(s.alarm||s.gasLeak)return 'Alcohol service stopped during emergency.';if(!s.licenceScenario)return 'Alcohol service stopped: fictional licence scenario disabled.';const staff=pubStaffRefusal(life);if(staff)return staff;if(!s.verifiedAdult)return 'Alcohol refused — adult ID required: tap “Confirm character is 18+” at the top of this pub menu.';if(s.intoxicated)return 'Alcohol refused: patron is flagged intoxicated; offer water and assistance.';if(!u?.waterValve||life.civic.supply.waterOk===false||!pubConnected(life,'water','town-water','bar-water'))return 'Alcohol service stopped: free potable drinking water is unavailable.';return null;}
function log(s,text){s.events.unshift(text);s.events=s.events.slice(0,30);return text;}
export function pubStandardsAction(life,action){const s=pubStandards(life),u=life.civic.pubUtilities;
 if(action==='confirm-adult'){s.verifiedAdult=true;return log(s,'Adult ID confirmed: your character is 18+. Return to the pub menu to order.');}
 const toggle={adult:'verifiedAdult',intoxicated:'intoxicated',licence:'licenceScenario',supervisor:'foodSupervisor',training:'foodTraining',allergens:'allergenConfirmed',clean:'clean',soap:'soap',towels:'towels',pests:'pests',privacy:'wcPrivacy',detector:'detectorFault',exhaust:'exhaustFault'};
 if(toggle[action]){s[toggle[action]]=!s[toggle[action]];return log(s,action+' status changed.');}
 if(action.startsWith('fault:')){const id=action.slice(6);const allowed=new Set(PUB_SERVICE_EDGES.flatMap(e=>[e.id,e.from,e.to]));if(!allowed.has(id))return 'Unknown service asset.';s.failed=s.failed.includes(id)?s.failed.filter(x=>x!==id):[...s.failed,id];return log(s,id+' '+(s.failed.includes(id)?'isolated':'restored')+'.');}
 if(action==='fire'||action==='gas-leak'){
  if(action==='gas-leak')s.gasLeak=true;s.alarm=true;if(u)u.lpgValve=false;
  const muster=life.place?.('square')?.front;
  if(muster&&life.goThen)for(const v of life.villagers||[])if(v.step?.at==='pub'){v.inside=false;life.goThen(v,muster,{kind:'idle',at:'square',dur:15,activity:'at the pub drill assembly area'});}
  return log(s,'Emergency drill: cooking and alcohol stopped, LPG isolated, occupants directed to Market Square. Use either clear exit.');
 }
 if(action==='reset-emergency'){s.alarm=false;s.gasLeak=false;return log(s,'Simulation emergency cleared after scenario assessment; LPG stays isolated until deliberately reopened.');}
 if(action==='rcd'){s.rcdTrip=!s.rcdTrip;return log(s,'Kitchen RCD '+(s.rcdTrip?'tripped; cooking isolated':'reset after simulated fault clearance')+'.');}
 if(action==='grease'){s.disposedGreaseKg+=u?.greaseKg||0;if(u)u.greaseKg=0;return log(s,'Grease pump-out recorded at contractor boundary; removed mass retained in ledger.');}
 if(action==='collect'){s.disposedOilL+=u?.oilL||0;s.disposedKg+=(u?.binsKg||0)+(u?.recyclingKg||0);if(u){u.binsKg=0;u.recyclingKg=0;u.oilL=0;}return log(s,'Collection recorded at off-site contractor boundary; removed mass retained in ledger.');}
 if(action==='inspect'){
  const faults=[s.alarm&&'alarm active',s.gasLeak&&'gas leak',s.detectorFault&&'detector fault',s.exhaustFault&&'extraction fault',s.rcdTrip&&'RCD trip',!s.clean&&'cleaning required',!s.soap&&'soap missing',!s.towels&&'towels missing',s.pests&&'pests',s.failed.length&&'isolated services'].filter(Boolean);
  const result=faults.length?'FAILED simulation inspection: '+faults.join(', '):'Simulation functional inspection passed; qualified design review and actual approvals remain unverified.';
  s.inspections.unshift({day:life.day||1,minute:life.minute||0,result,officialApproval:false});s.inspections=s.inspections.slice(0,20);return log(s,result);
 }
 return 'Unknown venue action.';
}
export function tickPubStandards(life,minutes){const s=pubStandards(life),u=life.civic.pubUtilities;if(!u||minutes<=0)return;
 // Rainfall is a declared scenario forcing (mm/h), not a measured local storm.
 const rain=Math.max(0,Number(u.rainMmHour)||0)*252*.9*minutes/60;
 if(pubConnected(life,'stormwater','roof','storm-outlet')){const released=Math.min(s.stormStoredL,120*minutes);s.stormStoredL-=released;s.stormDischargedL+=rain+released;}
 else{const held=Math.min(Math.max(0,500-s.stormStoredL),rain);s.stormStoredL+=held;s.stormOverflowL+=rain-held;}
}
