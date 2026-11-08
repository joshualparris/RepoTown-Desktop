// Saved visitor wage liabilities. Closing work and transferring cash are separate:
// an empty employer cannot erase a timesheet, and retrying a payment cannot pay twice.
import { withholdVisitor, record, bizStats } from './finance.js';
import { recordEarning } from './credit.js';
const publicSites = new Set(['hall','school','clinic','post','depot','square']);
export const cents = n => Math.round(Math.max(0, Number(n) || 0) * 100) / 100;
export function payroll(life) {
  const j = life.civic.jobs??={active:null,done:{},earned:0,spent:0,receipts:[]};
  j.payroll ??= { next:1, slips:[], skills:{} };
  return j.payroll;
}
// Small private businesses keep a wage float so a visitor's shift can be offered even when the
// till is empty. The council lends it from the treasury, at most one shift's pay per business per
// day, and the business repays it from its till in the evening: money moves, it is never created.
export const FLOAT_RESERVE = 20;   // till kept back for the next morning before repaying the float
export function wageFloat(life, site) { const f = life.civic.wageFloats ??= {}; return f[site] ??= { balance:0, owed:0, day:0 }; }
export function ensureFloat(life, site, pay) {
  if (publicSites.has(site)) return 0;
  const f = wageFloat(life, site), till = Math.max(0, life.place(site)?.till || 0);
  if (f.day === life.day || till + f.balance >= pay) return 0;
  const lend = cents(Math.min(pay - till - f.balance, Math.max(0, life.civic.treasury)));
  if (!lend) return 0;
  life.civic.treasury = cents(life.civic.treasury - lend); f.balance = cents(f.balance + lend); f.owed = cents(f.owed + lend); f.day = life.day;
  record(life, 'council', 'business:' + site, lend, 'Wage float lent to ' + (life.place(site)?.name || site));
  return lend;
}
export function repayFloats(life) {
  for (const [site, f] of Object.entries(life.civic.wageFloats || {})) {
    const p = life.place(site); if (!p || !f.owed) continue;
    // Unused float goes straight back; then the till repays what was spent, above its reserve.
    const back = cents(Math.min(f.balance, f.owed)); f.balance = cents(f.balance - back); f.owed = cents(f.owed - back);
    const fromTill = cents(Math.min(f.owed, Math.max(0, p.till - FLOAT_RESERVE))); p.till = cents(p.till - fromTill); f.owed = cents(f.owed - fromTill);
    if (back + fromTill) { life.civic.treasury = cents(life.civic.treasury + back + fromTill); record(life, 'business:' + site, 'council', cents(back + fromTill), 'Wage float repaid by ' + p.name); }
  }
}
export function employerFunds(life, site) {
  return cents(publicSites.has(site) ? life.civic.treasury : (life.place(site)?.till || 0) + (life.civic.wageFloats?.[site]?.balance || 0));
}
export function debtFor(life, site) {
  return cents(payroll(life).slips.filter(s=>!site||s.site===site).reduce((n,s)=>n+s.gross-s.paid,0));
}
export function closeTimesheet(life, shift, def, reason) {
  const p=payroll(life);
  if (shift.slipId) return p.slips.find(s=>s.id===shift.slipId);
  const minutes=Math.min(shift.required,Math.max(0,shift.worked||0));
  const gross=cents(shift.pay * minutes / shift.required);
  const s={id:p.next++,site:shift.site,job:shift.id,name:def.name,day:shift.day,
    closedDay:life.day,reason,minutes,hours:minutes/60,rate:shift.pay*60/shift.required,
    gross,paid:0,tax:0,net:0,breakMinutes:shift.breakTaken||0,
    awayMinutes:shift.away||0,duties:[...shift.tasks],requiredDuties:[...def.tasks],
    startedAt:shift.startedAt??shift.day*1440,closedAt:life.day*1440+life.minute};
  shift.slipId=s.id; p.slips.unshift(s);
  // Retain every unpaid liability; bound only fully paid historical statements.
  let settled=0;p.slips=p.slips.filter(x=>x.paid<x.gross||++settled<=120);
  if (minutes>=shift.required && def.tasks.every(k=>shift.tasks.includes(k))) {
    const skill=p.skills[shift.site]??={shifts:0,duties:0,qualification:'Supervised trainee'};
    skill.shifts++;skill.duties+=shift.tasks.length;
    skill.qualification=skill.shifts>=6?'Experienced town worker':skill.shifts>=3?'Town workplace certificate':'Supervised trainee';
  }
  return s;
}
export function settlePayslip(life, slip) {
  const due=cents(slip.gross-slip.paid), paid=Math.min(due,employerFunds(life,slip.site));
  if (!paid) return 0;
  if (publicSites.has(slip.site)) life.civic.treasury=cents(life.civic.treasury-paid);
  else {
    // The wage float pays first; the till covers the rest.
    const f=life.civic.wageFloats?.[slip.site],fromFloat=f?Math.min(f.balance,paid):0;
    if (fromFloat) f.balance=cents(f.balance-fromFloat);
    const p=life.place(slip.site);p.till=cents(p.till-(paid-fromFloat));
  }
  life.civic.player.wallet=cents(life.civic.player.wallet+paid);
  // Withhold against cumulative gross so splitting arrears into payments cannot
  // evade whole-dollar PAYG rounding. Tax only cash actually received.
  const tax=withholdVisitor(life,paid,slip.paid);
  slip.paid=cents(slip.paid+paid);slip.tax+=tax;slip.net=cents(slip.paid-slip.tax);
  const net=cents(paid-tax),j=life.civic.jobs;
  j.earned=cents(j.earned+net);recordEarning(life,net);
  bizStats(life,slip.site).wages=cents(bizStats(life,slip.site).wages+paid);
  record(life,publicSites.has(slip.site)?'council':'business:'+slip.site,'visitor',paid,'Visitor wage · timesheet '+slip.id);
  j.receipts.unshift({day:life.day,type:'wage',text:slip.name+', TD '+paid+' gross, TD '+tax+' PAYG',amount:net});
  j.receipts.length=Math.min(j.receipts.length,40);
  return paid;
}
export function collectWageDebt(life) {
  // Oldest work is paid first. No other employer or treasury covers private debts.
  let paid=0;
  for(const s of [...payroll(life).slips].reverse())paid+=settlePayslip(life,s);
  return {ok:paid>0,message:paid?'TD '+cents(paid)+' gross wage debt paid. See payslips for PAYG and balance.':'No payment available. Your unpaid wages remain saved.'};
}
