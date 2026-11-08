import {deliveryState,deliveryAction} from '../world/delivery-work.js';
import {WORK_CONTRACTS,contractsReport,contractAction} from '../world/work-contracts.js';
import {collectWageDebt, employerFunds, debtFor} from '../world/visitor-payroll.js';
import {takeBreak} from '../world/jobs.js';
// Town accounts: where the town's money sits (council, Commonwealth, NSW, the bank, shops, people),
// what each business earned and paid, and the recent double-entry journal (src/world/finance.js).
import { esc } from './interactions.js';
import { JOB_BOARD, MAX_SHIFTS_PER_DAY,jobOffer } from '../world/jobs.js';

const d = (n) => '$' + Number(n || 0).toLocaleString('en-AU',{maximumFractionDigits:2});

export function economyPanel(life, back) {
  const r = life.economyReport(), f = r.daily, t = r.lifetime;
  const biz = r.biz.map((b) => `<tr><td>${esc(b.name)}</td><td>${d(b.till)}</td><td>${d(b.sales)}</td><td>${d(b.wages)}</td><td>${d(b.rates + b.utilities)}</td><td>${d(b.result)}</td><td>${b.unpaid ? d(b.unpaid) : '–'}</td></tr>`).join('');
  const rows = r.entries.map((e) => `<tr><td>Day ${e.day}</td><td>${esc(e.memo)}</td><td>${esc(e.debit)} → ${esc(e.credit)}</td><td>${d(e.amount)}</td></tr>`).join('') || '<tr><td colspan="4">Nothing recorded yet</td></tr>';
  return {
    title: '📊 Town accounts', wide: true,
    body: `<p><b>Money in town:</b> ${d(r.total)} — all of it counted below. Money only moves between these pots; none is made from nothing.</p>
      <table class="ledger"><tr><th>Council</th><th>Commonwealth</th><th>NSW</th><th>Community bank pool</th><th>Shop tills</th><th>Villagers</th><th>You</th></tr>
      <tr><td>${d(r.council)}</td><td>${d(r.commonwealth)}</td><td>${d(r.nsw)}</td><td>${d(r.bank)}</td><td>${d(r.tills)}</td><td>${d(r.people)}</td><td>${d(r.visitor)}</td></tr></table>
      <h3>Today · lifetime</h3>
      <p>PAYG income tax to the Commonwealth: <b>${d(f.tax)}</b> · ${d(t.tax)}<br>
      NSW health and school wages: <b>${d(f.stateWages)}</b> · ${d(t.stateWages)} · council wages: <b>${d(f.councilWages)}</b> · ${d(t.councilWages)}<br>
      Business rates: <b>${d(f.rates)}</b> · ${d(t.rates)} · utilities: <b>${d(f.utilities)}</b> · ${d(t.utilities)} · household rent: <b>${d(f.rent)}</b> · ${d(t.rent)}<br>
      Grants to council: <b>${d(f.grants)}</b> · ${d(t.grants)}</p>
      <p>Owed and not yet paid: your rent ${d(r.rentArrears)} and power ${d(r.powerArrears)} · your employer wage debt ${d(r.visitorWageDebt)} · contract funds reserved ${d(r.workEscrow)} · villagers' wage arrears ${d(r.wageArrears)} · villagers' rate arrears ${d(r.rateArrears)} · business bills ${d(f.unpaid)}.</p>
      <h3>Businesses</h3><table class="ledger"><tr><th>Business</th><th>Till</th><th>Sales</th><th>Wages paid</th><th>Rates + utilities</th><th>Result</th><th>Bills owed</th></tr>${biz}</table>
      <h3>Recent transfers</h3><table class="ledger"><tr><th>Day</th><th>What</th><th>From → to</th><th>Amount</th></tr>${rows}</table>
      <p class="dim">Fictional Town Dollars for a 24-minute day, not real Australian rates. Commonwealth and NSW grants last only while their treasuries do.</p>`,
    actions: back ? [{ label: 'Back', run: back }] : [],
  };
}

// The visitor's wallet: cash, savings, what is owed, recent receipts.
export function walletPanel(life, opts = {}) {
  const me = life.civic.player, r = life.economyReport(), j = life.jobsReport(), cr = life.creditReport();
  const rows = j.receipts.map((x) => `<tr><td>Day ${x.day}</td><td>${esc(x.text)}</td><td>${x.amount ? (x.amount > 0 ? '+' : '–') + d(Math.abs(x.amount)) : ''}</td></tr>`).join('') || '<tr><td colspan="3">No receipts yet</td></tr>';
  const bag = Object.entries(me.bag || {}).filter(([, n]) => n > 0).map(([k, n]) => `${esc(k)} × ${n}`).join(', ') || 'nothing yet';
  return {
    title: '💳 Wallet', wide: true,
    body: `<p><b>Wallet:</b> ${d(me.wallet)} · <b>Savings at the bank:</b> ${d(me.bank)} · <b>Total:</b> ${d(me.wallet + me.bank)}</p>
      <p><b>Earned from work and trading:</b> ${d(cr.earned)} · <b>Spent in shops:</b> ${d(j.spent)} · <b>Bag:</b> ${bag}</p>
      <p><b>Overdue:</b> rent ${d(r.rentArrears)}, power ${d(r.powerArrears)} · <b>Loan:</b> ${cr.loan ? d(cr.loan.owed) + ' owing, due day ' + cr.loan.due : 'none'}</p>
      <p class="dim">Daily rent is charged only for an active signed lease; household electricity is charged only while you occupy a home. Hotel stays are paid at reception. PAYG is withheld from wages.</p>
      <p><b>Wages still owed to you:</b> TD ${d(j.wageDebt)}</p><h3>Recent receipts</h3><table class="ledger"><tr><th>When</th><th>What</th><th>Change</th></tr>${rows}</table>`,
    actions: [
      {label:'Timesheets and payslips',run:()=>payslipPanel(life,()=>walletPanel(life,opts))},
      { label: '💼 Paid jobs', run: () => jobBoardPanel(life, opts) },
      { label: '📊 Town accounts', run: () => economyPanel(life, () => walletPanel(life, opts)) },
    ],
  };
}

export function jobBoardPanel(life, opts = {}) {
  const j = life.jobsReport();
  const rows = JOB_BOARD.map((x) => {
    x=jobOffer(life,x);const p = life.place(x.site), done = j.doneToday.includes(x.id);
    return `<tr><td>${esc(x.name)}</td><td>${esc(p.name)}</td><td>${x.minutes} min</td><td>${d(x.pay)}</td><td>${done ? 'Worked today · more possible' : !life.open(p) ? 'Closed' : employerFunds(life,x.site)<x.pay||debtFor(life,x.site)>0 ? 'Not hiring: funds / wages owed' : 'Hiring'}</td></tr>`;
  }).join('');
  return {
    title: '💼 Paid jobs', wide: true,
    body: `<p>Earn real wages by working a shift inside a workplace while its staff are on duty. Up to eight paid town hours per day (480 minutes), subject to workplace hours, available funds and a safety limit of ${MAX_SHIFTS_PER_DAY} separate shifts. Repeat shifts at the same employer are possible. Private employers pay from their own tills; public jobs use council funds. PAYG goes to the Commonwealth. Unpaid wages remain employer debt. Earned time survives early clock-out and midnight; task errors never reduce it. A five-minute paid break is available after 15 minutes. Figures are fictional Town Dollars.</p>
      <table class="ledger"><tr><th>Job</th><th>Where</th><th>Time</th><th>Pay</th><th>Today</th></tr>${rows}</table>
      ${j.active ? `<p><b>Current shift:</b> ${esc(JOB_BOARD.find((x) => x.id === j.active.id).name)} · ${Math.floor(j.active.worked)}/${j.active.required} town minutes</p>` : ''}`,
    actions: [
      ...(opts.go ? JOB_BOARD.map((x) => ({ label: `Go to ${life.place(x.site).name}`, run: () => { opts.go(x.site); return null; } })) : []),
      { label: '💳 Wallet', run: () => walletPanel(life, opts) },
    ],
  };
}

// The shift screen for one workplace, opened from its counter panel.
export function jobPanel(life, site, back) {
  const defs=JOB_BOARD.filter(x=>x.site===site),j=life.jobsReport(),active=j.active;
  const local=active?.site===site?active:null,other=active&&!local?active:null;
  const p=life.place(site),supervisors=life.jobSupervisors(site);
  const flash=msg=>{const result=jobPanel(life,site,back);result.body='<p><b>'+esc(msg)+'</b></p>'+result.body;return result;};
  const currentDef=active&&JOB_BOARD.find(x=>x.id===active.id);
  let body='<p><b>Employer:</b> '+esc(p.name)+' · <b>Time:</b> '+esc(life.time())+
    ' · <b>On duty:</b> '+esc(supervisors.map(x=>x.name).join(', ')||'no one right now')+'</p>';
  if(site==='store')body+='<p>Receiving bay → carry real cartons → correct shelf. Quarantine the damaged batch, refill six units and count the visible marked sections.</p>';
  if(site==='cafe')body+='<p>Take real customer orders → prepare drinks or food → collect trays → deliver to the correct numbered table → clear dishes. Choose tickets at the order rail.</p>';
  const actions=[];
  const route=deliveryState(life).route;
  if(route){body+='<h3>Delivery route #'+route.id+'</h3><p>'+esc(route.status)+' · '+route.lines.map(l=>(l.delivered?'✓ ':'☐ ')+esc(l.good)+' ×'+l.n+' → '+esc(life.place(l.to).name)).join(' · ')+'</p>';if(route.lines.some(l=>l.to===site&&!l.delivered))actions.push({label:'Unload work van and confirm receipt here',run:()=>flash(deliveryAction(life,'unload',site).message)});}
  if(site==='depot')for(const [action,label]of [['manifest','Accept delivery manifest'],['load','Load correct parcels into work van'],['return','Return work van and undelivered cargo'],['cancel','Cancel unstarted delivery route']])actions.push({label,run:()=>flash(deliveryAction(life,action).message)});
  if(other){
    const employer=life.place(other.site);
    body+='<p><b>You already have an active shift:</b> '+esc(currentDef?.name||other.id)+
      ' at <b>'+esc(employer?.name||other.site)+'</b> · '+Math.floor(other.worked)+'/'+other.required+
      ' town minutes. Your progress remains saved while you visit other buildings, but working elsewhere does not count towards this shift.</p>'+
      '<p>Return to '+esc(employer?.name||other.site)+' to complete your duties, or cancel this shift before starting here.</p>';
    actions.push({label:'Cancel '+(currentDef?.name||'current shift')+' · keep earned pay',run:()=>flash(life.cancelJob().message)});
  }else if(local){
    const def=currentDef;
    body+='<p><b>Active shift:</b> '+esc(def.name)+' · '+Math.floor(local.worked)+'/'+local.required+
      ' town minutes worked · pays '+d(local.pay)+'</p>'+
      '<p><b>Duties:</b> '+def.tasks.map(k=>(local.tasks.includes(k)?'✅ ':'☐ ')+esc(k.replace(/-/g,' '))).join(' · ')+'</p>'+
      '<p>Close this panel and use the labelled 3D work stations. Work time only counts while you are inside this workplace with a supervisor present.</p>';
    body+='<p>Paid break: '+Number(local.breakTaken||0).toFixed(1)+' min taken · '+Number(local.breakRemaining||0).toFixed(1)+' min remaining. Away / unsupervised: '+Number(local.away||0).toFixed(1)+' min (unpaid). Earned gross so far: TD '+d(local.pay*local.worked/local.required)+'.</p>';
    actions.push({label:'Take five-minute paid break',run:()=>flash(takeBreak(life).message)});
    const ready=local.worked>=local.required;
    actions.push({label:ready?'✅ Clock out and collect '+d(local.pay):'Check shift progress',
      run:()=>flash(ready?life.finishJob().message:'Still '+Math.ceil(Math.max(0,local.required-local.worked))+
        ' town minutes to work; '+def.tasks.filter(k=>!local.tasks.includes(k)).length+' duties remaining.')});
    actions.push({label:'Clock out early · keep earned pay',run:()=>flash(life.cancelJob().message)});
  }else{
    body+='<p>No shift started here. Paid work today: '+(j.paidMinutesToday||0)+'/'+(j.paidMinutesLimit||480)+' town minutes · '+j.shiftsToday+' shifts completed.</p>';
    for(const base of defs){const def=jobOffer(life,base);actions.push({label:'Start '+def.name+' · '+def.minutes+' min · '+d(def.pay),
      run:()=>flash(life.startJob(def.id).message)});}
  }
  if(WORK_CONTRACTS[site]){
    const contract=contractsReport(life).active,offer=WORK_CONTRACTS[site];
    body+='<h3>Fixed-scope contract</h3><p>'+esc(offer.scope)+' Agreed price: TD '+d(offer.price)+'. Unlocks after three complete supervised shifts. Funds are reserved at acceptance.</p>';
    if(contract?.site===site){body+='<p>Contract #'+contract.id+' accepted; payment reserved.</p>';actions.push({label:'Submit contract work for acceptance',run:()=>flash(contractAction(life,site,'submit').message)},{label:'Cancel contract · no fee',run:()=>flash(contractAction(life,site,'cancel').message)});}
    else actions.push({label:'Accept fixed-scope contract',run:()=>flash(contractAction(life,site,'accept').message)});
  }
  actions.push({label:'Timesheets and payslips',run:()=>payslipPanel(life,()=>jobPanel(life,site,back))});
  actions.push({label:'💳 Wallet',run:()=>walletPanel(life)});
  if(back)actions.push({label:'Back',run:back});
  return {title:'💼 Work at '+p.name,body,actions,wide:true};
}

export function payslipPanel(life,back) {
  const j=life.jobsReport();
  const slips=j.payslips.map(s=>`<tr><td>#${s.id} · day ${s.day}<br>${esc(s.name)}<br>${esc(s.reason)}<br>${s.duties.length}/${s.requiredDuties.length} duties · ${s.awayMinutes.toFixed(1)} unpaid away min</td><td>${s.kind==='contract'?'Agreed fixed price':s.hours.toFixed(3)+' h<br>TD '+d(s.rate)+' / h<br>'+s.breakMinutes.toFixed(1)+' paid break min'}</td><td>TD ${d(s.gross)}</td><td>TD ${d(s.paid)}</td><td>TD ${d(s.tax)}</td><td>TD ${d(s.net)}</td><td>TD ${d(s.gross-s.paid)}</td></tr>`).join('');
  const skills=Object.entries(j.skills).map(([site,s])=>esc(life.place(site)?.name||site)+': '+esc(s.qualification)+' · '+s.shifts+' verified shifts').join('<br>')||'No supervised shifts completed yet.';
  return {title:'Timesheets and payslips',wide:true,body:`<p>Fictional Town Dollars. Gross earned = paid town minutes × agreed rate. Breaks are included in paid hours. PAYG is withheld only on money received; the unpaid balance remains a debt of that employer. Rework never reduces earned time.</p><p><b>Unpaid balance: TD ${d(j.wageDebt)}</b></p><table class="ledger"><tr><th>Timesheet</th><th>Hours and rate</th><th>Earned gross</th><th>Paid gross</th><th>PAYG</th><th>Take-home</th><th>Owed</th></tr>${slips||'<tr><td colspan="7">No closed shifts yet.</td></tr>'}</table><h3>Supervised workplace experience</h3><p>${skills}</p><p>Complete all duties and a full shift for training credit. Three complete shifts earn a town workplace certificate, unlock fixed-scope contracts and raise future quoted wages by 10%. Six earn experienced-worker status and a 25% higher quoted rate. Each employer must fund the agreed rate before hiring. These are game awards.</p>`,actions:[{label:'Collect available unpaid wages',run:()=>{const r=collectWageDebt(life),p=payslipPanel(life,back);p.body='<p role="status">'+esc(r.message)+'</p>'+p.body;return p;}},...(back?[{label:'Back',run:back}]:[])]};
}
