import { initTradeOperations,worksite,advanceFieldRepairs,advanceHardwareShipments,orderHardwareShipment } from './trade-operations.js';
// NSW-inspired town trades and education. All money/durations are fictional
// and compressed for playability; awards and licences are NOT real credentials.
// This module never bypasses the existing council network repair system.
export const TRADE_STAFF=Object.freeze([
 {id:'ella',name:'Ella Morgan',trade:'electrical',job:'licensed electrician',licence:'NSW electrical contractor',qualified:true},
 {id:'sam',name:'Samir Patel',trade:'plumbing',job:'licensed plumber',licence:'NSW plumbing contractor',qualified:true},
 {id:'noah',name:'Noah Reed',trade:'building',job:'licensed builder',licence:'NSW general building contractor',qualified:true},
 {id:'ivy',name:'Ivy Chen',trade:'it',job:'computer repair technician',licence:null,qualified:true},
 {id:'asha',name:'Asha Green',trade:'painting',job:'painting and decorating contractor',
  licence:'FICTIONAL town painting/decorating contractor credential — not a real NSW licence',qualified:true},
 {id:'kai',name:'Kai Bell',trade:'electrical',job:'first-year electrical apprentice',licence:null,qualified:false,supervisor:'ella'},
 {id:'mia',name:'Mia Harris',trade:'plumbing',job:'plumbing apprentice',licence:null,qualified:false,supervisor:'sam'}
]);
export const HARDWARE=Object.freeze({
 timber:{name:'Treated framing timber',price:11,initial:18},
 fasteners:{name:'Fasteners and brackets',price:4,initial:30},
 pipe:{name:'Copper pipe and fittings',price:15,initial:16},
 cable:{name:'Approved wiring and fittings',price:19,initial:14},
 switch:{name:'RCD and switchgear',price:34,initial:8},
 seal:{name:'Washers and sealant',price:6,initial:18},
 paint:{name:'Exterior paint',price:16,initial:10},
 parts:{name:'Repair parts',price:12,initial:12}
});
export const REPAIR_TYPES=Object.freeze({
 leakingTap:{label:'Leaking kitchen tap',trade:'plumbing',materials:{seal:2,pipe:1},labour:45,hours:2,asset:'house',risk:'Isolate supply and pressure-test before handover.'},
 blockedDrain:{label:'Blocked drain',trade:'plumbing',materials:{pipe:2,seal:1},labour:70,hours:3,asset:'house',risk:'Confirm drainage category and test for leaks.'},
 faultySwitch:{label:'Faulty lighting circuit',trade:'electrical',materials:{cable:1,switch:1},labour:85,hours:3,asset:'house',risk:'De-energise, isolate, test dead, verify protection; licensed electrical worker only.'},
 stormDamage:{label:'Damaged verandah timber',trade:'building',materials:{timber:4,fasteners:3,paint:1},labour:90,hours:4,asset:'house',risk:'Assess structural safety; licensed/supervised building contractor where required.'},
 repaintExterior:{label:'Exterior painting and weatherproofing',trade:'painting',materials:{paint:3,seal:2},
  labour:145,hours:6,asset:'house',
  risk:'Inspect historic fabric, surface preparation, lead-paint risk, weather and falls protection; verify NSW licensing requirements if this were real work.'},
 laptop:{label:'Faulty community laptop',trade:'it',materials:{parts:2},labour:40,hours:2,asset:'community',risk:'Protect personal data and return parts for recycling.'}
});
export const QUALIFICATIONS=Object.freeze([
 {id:'hsc',title:'NSW Higher School Certificate (HSC)',provider:'school',level:null,days:5,fee:0,requires:null},
 {id:'cert1',title:'Certificate I – Skills for Work',provider:'tafe',level:1,days:2,fee:12,requires:null},
 {id:'cert2',title:'Certificate II – Construction Pathways',provider:'tafe',level:2,days:3,fee:25,requires:'cert1'},
 {id:'electro3',title:'Certificate III – Electrotechnology Electrician',provider:'tafe',level:3,days:6,fee:65,requires:'cert2',apprenticeship:true},
 {id:'plumb3',title:'Certificate III – Plumbing',provider:'tafe',level:3,days:6,fee:65,requires:'cert2',apprenticeship:true},
 {id:'cert4',title:'Certificate IV – Building and Construction',provider:'tafe',level:4,days:5,fee:80,requires:'electro3'},
 {id:'diploma',title:'Diploma – Building and Construction',provider:'tafe',level:5,days:6,fee:105,requires:'cert4'},
 {id:'advanced',title:'Advanced Diploma – Building Design',provider:'tafe',level:6,days:6,fee:130,requires:'diploma'},
 {id:'bachelor',title:'Bachelor of Engineering (Civil)',provider:'university',level:7,days:10,fee:210,requires:'hsc'},
 {id:'honours',title:'Bachelor Honours – Engineering',provider:'university',level:8,days:5,fee:105,requires:'bachelor'},
 {id:'gradcert',title:'Graduate Certificate – Project Management',provider:'university',level:8,days:4,fee:85,requires:'bachelor'},
 {id:'graddiploma',title:'Graduate Diploma – Project Management',provider:'university',level:8,days:6,fee:135,requires:'gradcert'},
 {id:'masters',title:'Master of Engineering',provider:'university',level:9,days:8,fee:190,requires:'honours'},
 {id:'doctorate',title:'Doctor of Philosophy (Engineering)',provider:'university',level:10,days:14,fee:300,requires:'masters'}
]);
const round=x=>Math.round(x*100)/100;
const held=me=>(me.wallet||0)+(me.bank||0);
function pay(me,amount){
 if(held(me)<amount)return false;
 const cash=Math.min(me.wallet,amount);
 me.wallet=round(me.wallet-cash);me.bank=round(me.bank-(amount-cash));return true;
}
export function initialiseTradeEducation(life){
 if(life.civic.tradeEducation?.version===1)return initTradeOperations(life,life.civic.tradeEducation);
 life.civic.tradeEducation={
  version:1,next:1,hardwareCash:440,contractorCash:520,
  stock:Object.fromEntries(Object.entries(HARDWARE).map(([id,g])=>[id,g.initial])),
  orders:[],receipts:[],qualifications:[],activeCourse:null,lastStudyDay:0
 };
 return initTradeOperations(life,life.civic.tradeEducation);
}
export function tradeEducationReport(life){return initialiseTradeEducation(life);}
export function repairQuote(id){
 const def=REPAIR_TYPES[id];if(!def)return null;
 const materials=Object.entries(def.materials).reduce((n,[item,qty])=>n+HARDWARE[item].price*qty,0);
 const inspection=15;
 return {...def,id,materialsCost:materials,inspection,total:materials+def.labour+inspection};
}
export function orderRepair(life,id){
 const t=initialiseTradeEducation(life),q=repairQuote(id);
 if(!q)return 'Unknown repair type.';
 if(t.orders.some(o=>o.type===id&&!['completed','cancelled'].includes(o.status)))return 'There is already an open ticket for that fault.';
 const site=worksite(life,id);
 const ticket={id:'R-'+String(t.next++).padStart(3,'0'),type:id,siteId:site?.id||null,status:'quoted',day:life.day,paid:0,progress:0,inspection:q.inspection,worker:null};
 t.orders.push(ticket);t.orders=t.orders.slice(-40);
 return `Fault report ${ticket.id} registered. Written quote $${q.total} includes inspection $${q.inspection}, parts $${q.materialsCost}, labour $${q.labour}. Accept the quote to book work.`;
}
export function acceptRepair(life,ticketId){
 const t=initialiseTradeEducation(life),o=t.orders.find(x=>x.id===ticketId);
 if(!o||o.status!=='quoted')return 'No outstanding quote for that ticket.';
 const q=repairQuote(o.type),staff=TRADE_STAFF.find(x=>x.trade===q.trade&&x.qualified&&(x.licence||q.trade==='it'));
 if(!staff)return 'No appropriately qualified tradesperson is available. Unlicensed apprentices cannot work alone.';
 for(const [id,n] of Object.entries(q.materials))if((t.stock[id]||0)<n)return 'Cannot accept: '+HARDWARE[id].name+' is out of stock at the hardware store.';
 if(!pay(life.civic.player,q.total))return 'Insufficient money in wallet and bank for the written quote of $'+q.total+'.';
 for(const [id,n] of Object.entries(q.materials))t.stock[id]-=n;
 t.hardwareCash=round(t.hardwareCash+q.materialsCost);
 o.worker=staff.id;o.status='assigned';o.paid=q.total;o.progress=0;
 // Quoted labour + inspection held in escrow until completed inspection.
 o.escrow=q.labour+q.inspection;
 life.log('Repair '+o.id+' booked: '+staff.name+' ('+staff.job+'). Materials supplied by Hardware & Timber.');
 return `Accepted ${o.id}: $${q.total} debited; ${staff.name} assigned. Labour and inspection funds are in escrow until signed off.`;
}
export function cancelRepair(life,ticketId){
 const t=initialiseTradeEducation(life),o=t.orders.find(x=>x.id===ticketId);
 if(!o||!['quoted','assigned'].includes(o.status))return 'Ticket cannot be cancelled now.';
 if(o.status==='assigned'){
  const q=repairQuote(o.type);
  for(const [id,n] of Object.entries(q.materials))t.stock[id]+=n;
  t.hardwareCash=round(t.hardwareCash-q.materialsCost);
  life.civic.player.bank=round(life.civic.player.bank+o.paid);
  o.escrow=0; // Unstarted booking: full refund including materials.
 }
 o.status='cancelled';return 'Ticket '+o.id+' cancelled. Unstarted payments refunded and materials returned to stock.';
}
export function buyHardware(life,id,qty=1){
 const t=initialiseTradeEducation(life),g=HARDWARE[id];if(!g)return 'Not stocked.';
 if(!Number.isInteger(qty)||qty<1||qty>10)return 'Choose 1–10 units.';
 if(t.stock[id]<qty)return 'Insufficient stock: '+g.name+'.';
 const total=g.price*qty;
 if(!pay(life.civic.player,total))return 'You need $'+total+' in wallet or bank.';
 t.stock[id]-=qty;t.hardwareCash=round(t.hardwareCash+total);
 const bag=life.civic.player.bag;bag[id]=(bag[id]||0)+qty;
 t.receipts.unshift({day:life.day,text:'Bought '+qty+' '+g.name+' for $'+total});t.receipts.length=Math.min(30,t.receipts.length);
 return 'Bought '+qty+' '+g.name+' for $'+total+'. Added to your bag.';
}
export function enrolQualification(life,id){
 const t=initialiseTradeEducation(life),q=QUALIFICATIONS.find(x=>x.id===id);
 if(!q)return 'This qualification is not offered.';
 if(t.activeCourse)return 'Finish your current course before enrolling in another.';
 if(t.qualifications.includes(id))return 'Already completed this qualification.';
 if(q.requires&&!t.qualifications.includes(q.requires))return 'Entry requirement: '+QUALIFICATIONS.find(x=>x.id===q.requires).title+'.';
 if(!pay(life.civic.player,q.fee))return 'Insufficient funds for $'+q.fee+' tuition.';
 t.activeCourse={id,days:0,startDay:life.day,lastDay:0,assessmentPending:false,assessmentAttempts:0,attendance:[]};
 t.hardwareCash=round(t.hardwareCash+(q.provider==='tafe'?q.fee:0));
 t.contractorCash=round(t.contractorCash+(q.provider==='university'?q.fee:0));
 life.log('Enrolled in '+q.title+'.');
 return 'Enrolled in '+q.title+'. Classes and assessments require '+q.days+' in-game study days. This is an in-game award, not a real credential.';
}
// Physical freight deliveries draw either from the Foundry's existing parts
// or from paid off-town suppliers; no infinite automatic warehouse stock.
export function bookHardwareDelivery(life,item,count=5){
 const t=initialiseTradeEducation(life);
 return orderHardwareShipment(life,t,item,count,HARDWARE);
}
export function advanceTownTradeOperations(life,minutes){
 const t=initialiseTradeEducation(life);
 advanceHardwareShipments(life,t,minutes);
 advanceFieldRepairs(life,t,minutes,TRADE_STAFF,repairQuote);
}
const completionAnswer=(q)=>q.provider==='school'?'sources':q.provider==='university'?'evidence':'safety';
export function attendPlacement(life){
 const t=initialiseTradeEducation(life),c=t.activeCourse,q=QUALIFICATIONS.find(v=>v.id===c?.id);
 if(!q?.apprenticeship)return 'Enrol in Certificate III apprenticeship training first.';
 if(life.playerAt!=='trades')return 'Attend Town Trades & Maintenance in person with the trade supervisor.';
 if(life.minute<8*60||life.minute>=17*60)return 'Supervised placement runs 08:00–17:00.';
 if(t.playerPlacement.lastDay===life.day)return 'One supervised placement shift per town day.';
 const trade=q.id==='electro3'?'electrical':'plumbing',lead=TRADE_STAFF.find(v=>v.trade===trade&&v.qualified&&v.licence);
 if(!lead)return 'No licensed supervisor on shift.';
 t.playerPlacement.lastDay=life.day;
 t.playerPlacement[trade]=(t.playerPlacement[trade]||0)+3;
 t.playerPlacement.verified.push({day:life.day,trade,hours:3,supervisor:lead.name,assessment:'toolbox talk, workplace hazards and supervised practice'});
 t.playerPlacement.verified=t.playerPlacement.verified.slice(-90);
 return 'Logged 3 hours of supervised '+trade+' practical work with '+lead.name+'.';
}
export function sitAssessment(life,answer){
 const t=initialiseTradeEducation(life),c=t.activeCourse,q=QUALIFICATIONS.find(v=>v.id===c?.id);
 if(!c||!q||!c.assessmentPending)return 'Complete all scheduled teaching sessions first.';
 if(life.playerAt!==q.provider)return 'Attend '+life.place(q.provider).name+' for your assessment.';
 c.assessmentAttempts=(c.assessmentAttempts||0)+1;
 if(answer!==completionAnswer(q))return 'Assessment not passed. Review safe practice and evidence; you may try again.';
 if(q.apprenticeship){
  const trade=q.id==='electro3'?'electrical':'plumbing';
  if((t.playerPlacement[trade]||0)<12)return 'You need 12 documented supervised placement hours before assessment sign-off.';
 }
 t.qualifications.push(q.id);t.activeCourse=null;
 t.receipts.unshift({day:life.day,text:'Coursework and competency assessment completed: '+q.title+' (fictional town award)'});
 life.log('Graduation at '+life.place(q.provider).name+': '+q.title+'. No NSW occupational licence has been issued.');
 return 'Passed the final assessment. '+q.title+' recorded in your town transcript; a licence is a separate application.';
}
export function applyTownTradeLicence(life,trade){
 const t=initialiseTradeEducation(life),qid=trade==='electrical'?'electro3':trade==='plumbing'?'plumb3':null;
 if(!qid)return 'Only electrical and plumbing applications are simulated.';
 if(!t.qualifications.includes(qid))return 'Complete the relevant Certificate III and practical assessment first.';
 if((t.playerPlacement[trade]||0)<12)return 'Insufficient verified supervised work experience.';
 if(t.licences[trade])return 'Application already submitted or granted.';
 if(!pay(life.civic.player,35))return 'The fictional regulator charges a $35 processing fee.';
 t.regulatorCash=(t.regulatorCash||0)+35;
 t.licences[trade]={status:'under-review',submitted:life.day,reviewDay:life.day+2,trade};
 return 'Fictional '+trade+' licence application submitted for review; no permission granted yet.';
}
export function advanceTradeEducation(life){
 const t=initialiseTradeEducation(life),course=t.activeCourse;
 // Class credit requires the actual player at the correct institution during
 // its teaching window. One recorded attendance per day; no remote auto-grading.
 if(course&&life.minute>=15*60&&life.minute<16*60&&course.lastDay!==life.day&&
     life.playerAt===QUALIFICATIONS.find(q=>q.id===course.id)?.provider){
  course.days++;course.lastDay=life.day;
  course.attendance||=[];
  course.attendance.push({day:life.day,site:life.playerAt,session:'guided lesson, tutorial and workshop'});
  const q=QUALIFICATIONS.find(q=>q.id===course.id);
  if(course.days>=q.days){course.assessmentPending=true;life.log(q.title+' teaching complete; final competency assessment is available at '+life.place(q.provider).name+'.');}
 }
 for(const [trade,application] of Object.entries(t.licences||{})){
  if(application.status==='under-review'&&life.day>=application.reviewDay){
   const q=trade==='electrical'?'electro3':'plumb3';
   application.status=t.qualifications.includes(q)&&(t.playerPlacement[trade]||0)>=12?'approved-town-only':'rejected';
   life.log('Town licensing office reviewed '+trade+' application: '+application.status+'. This is a fictional game credential.');
  }
 }
}
