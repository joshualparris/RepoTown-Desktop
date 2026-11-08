import {tickOccupationWork} from './occupation-work.js';
import { tickWorkplay } from './workplay.js';
import { payroll, closeTimesheet, settlePayslip, employerFunds, debtFor, ensureFloat, repayFloats } from './visitor-payroll.js';

export const JOB_BOARD = Object.freeze([
  {id:'soy-field-hand',site:'soyfarm',name:'Soybean field hand',minutes:45,pay:30,tasks:['field-preparation','crop-irrigation','crop-scouting'],blurb:'Sow inoculated seed, irrigate and inspect a real soybean paddock'},
  {id:'soy-production-operator',site:'soyplant',name:'Plant-drink production operator',minutes:75,pay:52,tasks:['intake-quality','wet-grinding','pack-and-label'],blurb:'Trace a soybean batch through washing, hydration, grinding, heat safety and chilled packaging'},
  {id:'cafe-all-rounder',site:'cafe',name:'Café all-rounder',minutes:40,pay:28,tasks:['take-orders','prepare-orders','table-service'],blurb:'Take customer orders, make drinks and food, and deliver to numbered tables'},
  { id: 'bakery-assistant', site: 'bakery', name: 'Bakery assistant', minutes: 35, pay: 24, tasks: ['wash-hands', 'prep-bench', 'cooling'], blurb: 'Help shape, tray and pack baked goods' },
  {id:'poultry-hand',site:'coop',name:'Poultry farmhand',minutes:35,pay:24,tasks:['feed-hens','collect-eggs','store-eggs'],blurb:'Feed hens from real grain, collect eggs and pack them for town deliveries'},
  { id: 'farm-hand', site: 'garden', name: 'Market Garden hand', minutes: 45, pay: 30, tasks: ['water-plants', 'weed-beds', 'pack-produce'], blurb: 'Water, weed and collect produce' },
  {id:'delivery-driver',site:'depot',name:'Delivery driver',minutes:60,pay:40,tasks:['accept-manifest','load-parcels','confirm-receipt'],blurb:'Load real freight, drive the employer van and get business receipts'},
  { id: 'depot-sorter', site: 'depot', name: 'Rail Depot parcel sorter', minutes: 40, pay: 28, tasks: ['sort-freight', 'verify-manifest', 'stack-parcels'], blurb: 'Sort incoming freight and secure parcels' },
  { id: 'store-stocker', site: 'store', name: 'General Store shelf stocker', minutes: 35, pay: 24, tasks: ['check-expiry', 'refill-shelves', 'count-stock'], blurb: 'Count stock, check dates and refill shelves' },
  { id: 'post-assistant', site: 'post', name: 'Post Office assistant', minutes: 30, pay: 22, tasks: ['sort-mail', 'label-parcels', 'prepare-route'], blurb: 'Sort letters into the delivery rounds' },
  {id:'maintenance-assistant',site:'hall',name:'Supervised maintenance apprentice',minutes:45,pay:30,tasks:['diagnose-fault','isolate-equipment','repair-test'],blurb:'Diagnose and repair the actual Town Hall work lamp with a supervisor'},
  { id: 'civic-cleaner', site: 'hall', name: 'Town Hall caretaker', minutes: 35, pay: 25, tasks: ['clean-floors', 'empty-bins', 'inspect-floor'], blurb: 'Tidy public areas and inspect facilities' },
]);
export const MAX_SHIFTS_PER_DAY = 12; // safety ceiling; paid time is the primary daily limit
export const MAX_PAID_MINUTES_PER_DAY = 480; // eight game hours, not two arbitrary short jobs
const TASK_GAP = 5; // town minutes between duties

export const freshJobs = () => ({ active: null, done: {}, earned: 0, spent: 0, receipts: [] });
function jobs(life) {
  const c = life.civic;
  if (!c.jobs || typeof c.jobs !== 'object') c.jobs = freshJobs();
  const j = c.jobs;
  if(!Number.isFinite(j.earned))j.earned=0;
  if(!Number.isFinite(j.spent))j.spent=0;
  if (!Array.isArray(j.receipts)) j.receipts = [];
  if (!j.done || typeof j.done !== 'object') j.done = {};
  return j;
}
export function jobOffer(life,def){const shifts=payroll(life).skills[def.site]?.shifts||0;const grade=shifts>=6?'Experienced':shifts>=3?'Certified':'Supervised trainee';return {...def,pay:Math.round(def.pay*(shifts>=6?1.25:shifts>=3?1.1:1)*100)/100,grade};}
const byId = (id) => JOB_BOARD.find((x) => x.id === id);
const nowMin = (life) => life.day * 1440 + life.minute;
const clean = (s) => String(s || '').slice(0, 90);

export function receipt(life, type, text, amount) {
  const j = jobs(life);
  j.receipts.unshift({ day: life.day, type: clean(type), text: clean(text), amount: Math.round(amount * 100) / 100 });
  if (j.receipts.length > 40) j.receipts.length = 40;
  if (type === 'purchase') j.spent = Math.round((j.spent + Math.abs(amount)) * 100) / 100;
}

export const supervisors = (life, site) => life.villagers.filter((v) => v.work === site && v.step?.kind === 'work' && !v.path?.length);
export function current(life) { const a = jobs(life).active;if(a&&a.day!==life.day){closeShift(life,a,'Day ended');return null;}return a||null; }
const doneToday = (life) => (jobs(life).done[life.day] || []);
export const paidMinutesToday = life => {
  const slips=payroll(life).slips.filter(s=>s.day===life.day);
  const recorded=slips.reduce((n,s)=>n+Math.max(0,Math.min(480,s.minutes||0)),0);
  // Migrate earlier saves where completed jobs were recorded without payslips.
  return recorded || (slips.length ? 0 : doneToday(life).reduce((n,id)=>n+(byId(id)?.minutes||0),0));
};
export const shiftsToday = life => {
  const count=payroll(life).slips.filter(s=>s.day===life.day).length;
  return count || doneToday(life).length;
};

export function startJob(life, id) {
  const j = jobs(life), def = byId(id), site = def && life.place(def.site);
  if (!def) return { ok: false, message: 'Unknown job.' };
  if (current(life)) { const a=current(life); const workplace=life.place(a.site); return { ok:false, message:'You are already working at '+(workplace?.name||a.site)+'. Finish that shift there, or cancel it from any workplace job panel first.' }; }
  const used=paidMinutesToday(life),count=shiftsToday(life);
  if (used + def.minutes > MAX_PAID_MINUTES_PER_DAY) return {ok:false,message:'Daily paid work limit reached: '+used+'/'+MAX_PAID_MINUTES_PER_DAY+' minutes already worked. Come back tomorrow.'};
  if (count>=MAX_SHIFTS_PER_DAY) return {ok:false,message:'Daily shift safety limit reached. Come back tomorrow.'};
  if (!life.open(site)) return { ok: false, message: `${site.name} is closed right now.` };
  const offer=jobOffer(life,def);
  if (!debtFor(life,def.site)) ensureFloat(life,def.site,offer.pay);
  if (employerFunds(life,def.site)<offer.pay || debtFor(life,def.site)>0) return {ok:false,message:'This employer cannot fund a new shift. Existing wage debts must be paid first.'};
  j.active = { id, site: def.site, day: life.day, startedAt:nowMin(life), worked: 0, required: def.minutes, pay: offer.pay, grade:offer.grade, tasks: [], lastTaskAt: -999, breakRemaining:0, breakTaken:0, away:0 };
  return { ok: true, message: `Shift started at ${site.name}. Stay inside while the staff are working.` };
}

// Called every simulated minute: the shift only advances while the visitor is inside the workplace
// with a staff member on duty.
export function tickJobs(life, minutes) {
  if (life.minute >= 20 * 60 && life.civic.wageFloatDay !== life.day) { life.civic.wageFloatDay = life.day; repayFloats(life); }
  tickWorkplay(life);
  tickOccupationWork(life,minutes);
  const a = jobs(life).active;
  if (!a) return;
  if (a.day !== life.day) { closeShift(life,a,'Day ended'); return; }
  if(a.hands?.earned)for(const task of a.hands.earned)if(!a.tasks.includes(task))performTask(life,task);
  const dt=Math.max(0,Number(minutes)||0);
  if ((life.playerAt === a.site && supervisors(life, a.site).length) || (a.id==='delivery-driver'&&['loaded','completed'].includes(life.civic.deliveryWork?.route?.status)&&!life.civic.deliveryWork.route.returnedAt&&(life.workVehicleDriving||life.civic.deliveryWork.route.lines.some(l=>l.to===life.playerAt&&!l.delivered)))) {
    const credited=Math.min(dt,Math.max(0,a.required-a.worked));
    a.worked+=credited;
    if(a.breakRemaining>0){const rest=Math.min(credited,a.breakRemaining);a.breakRemaining-=rest;a.breakTaken=(a.breakTaken||0)+rest;}
  } else a.away=(a.away||0)+dt;
}

export function performTask(life, task) {
  const a = current(life), def = a && byId(a.id);
  if (!a || !def || !def.tasks.includes(task)) return { ok: false, message: 'That is not a duty on your current shift.' };
  if (life.playerAt !== a.site && !(a.id==='delivery-driver'&&task==='confirm-receipt'&&life.civic.deliveryWork?.route?.status==='completed')) return { ok: false, message: 'You need to be inside the workplace.' };
  if (!supervisors(life, a.site).length && !(a.id==='delivery-driver'&&task==='confirm-receipt'&&life.civic.deliveryWork?.route?.status==='completed')) return { ok: false, message: 'There is no one on duty to supervise you.' };
  if (a.breakRemaining>0) return {ok:false,message:'Enjoy your paid rest break before continuing this duty.'};
  if (a.tasks.includes(task)) return { ok: false, message: 'You already did that duty.' };
  const wait = TASK_GAP - (nowMin(life) - a.lastTaskAt);
  if (wait > 0) return { ok: false, message: `Give it ${Math.ceil(wait)} more town minutes before the next duty.` };
  a.tasks.push(task); a.lastTaskAt = nowMin(life);
  return { ok: true, message: `Done: ${task.replace(/-/g, ' ')}.` };
}

function closeShift(life,a,reason) {
  const j=jobs(life),def=byId(a.id);
  if(!def)return {ok:false,message:'Unknown saved shift; no payment made.'};
  const slip=closeTimesheet(life,a,def,reason);
  j.active=null;
  if(a.worked>0)j.done[a.day]=[...new Set([...(j.done[a.day]||[]),a.id])];
  for(const day of Object.keys(j.done))if(Number(day)<life.day-2)delete j.done[day];
  const paid=settlePayslip(life,slip),due=Math.round((slip.gross-slip.paid)*100)/100;
  return {ok:true,message:(reason==='Completed'?'Shift complete. ':reason+'. ')+
    'TD '+slip.gross+' earned gross; TD '+paid+' paid, TD '+slip.tax+' PAYG, TD '+slip.net+' take-home.'+
    (due?' Employer still owes TD '+due+'. Saved on payslip #'+slip.id+'.':'')};
}
export function abandonJob(life) {
  const a=current(life);
  if(!a)return {ok:false,message:'You have no shift.'};
  return closeShift(life,a,'Clocked out early');
}
export function takeBreak(life) {
  const a=current(life);
  if(!a||life.playerAt!==a.site||!supervisors(life,a.site).length)return {ok:false,message:'Be at your supervised workplace to start a break.'};
  if(a.worked<15)return {ok:false,message:'A five-minute paid break is available after 15 town minutes.'};
  if(a.breakTaken||a.breakRemaining||a.worked>=a.required)return {ok:false,message:'Your paid break has already been taken or the shift has ended.'};
  a.breakRemaining=Math.min(5,a.required-a.worked);
  return {ok:true,message:'Five-minute paid rest break started. Stay in the workplace; tasks resume afterwards.'};
}
export function finishJob(life) {
  const a=current(life);
  if(!a)return {ok:false,message:'You have no shift.'};
  if(life.playerAt!==a.site)return {ok:false,message:'Be inside the workplace to clock out.'};
  if(a.worked<a.required)return {ok:false,message:Math.ceil(a.required-a.worked)+' town minutes still to work. You may clock out early and keep earned pay.'};
  // Incomplete/reworked duties affect training credit, never wages already earned.
  return closeShift(life,a,'Completed');
}

export function jobsReport(life) {
  const j = jobs(life), a = current(life);
  return { active: a ? { ...a, tasks: [...a.tasks] } : null, earned: j.earned, spent: j.spent, receipts: j.receipts.slice(0, 9), payslips: structuredClone(payroll(life).slips), wageDebt:debtFor(life), skills:structuredClone(payroll(life).skills), shiftsToday: shiftsToday(life), paidMinutesToday:paidMinutesToday(life), paidMinutesLimit:MAX_PAID_MINUTES_PER_DAY, doneToday: [...doneToday(life)] };
}
