// Optional fixed-scope work. The employer reserves its own money when both
// sides agree; wages and training shifts remain separate from this contract.
import {workState} from './workplay.js';
import {payroll,cents,closeTimesheet,settlePayslip} from './visitor-payroll.js';
export const WORK_CONTRACTS=Object.freeze({
 store:{title:'Six-unit shelf replenishment',price:12,units:6,metric:'restocked',scope:'Move six real backroom products to their correct sales shelves. Employer supplies stock; no worker expenses.'},
 cafe:{title:'Two complete table services',price:16,units:2,metric:'cleared',scope:'Prepare and deliver two real customer orders, then clear their tables. Employer supplies ingredients and equipment; no worker expenses.'}
});
function state(life){return life.civic.workContracts??={next:1,active:null,history:[]};}
export function contractsReport(life){return structuredClone(state(life));}
export function contractAction(life,site,action){
 const s=state(life),def=WORK_CONTRACTS[site],p=life.place(site);
 if(!def)return {ok:false,message:'No fixed-scope contract is offered here.'};
 const fail=message=>({ok:false,message});
 if(action==='accept'){
  if(s.active)return fail('Complete or cancel your existing contract first.');
  if((payroll(life).skills[site]?.shifts||0)<3)return fail('Complete three supervised shifts here to unlock independent contract responsibility.');
  if((p.till||0)<def.price)return fail('The employer cannot fund the agreed price.');
  p.till=cents(p.till-def.price);
  s.active={id:s.next++,site,title:def.title,scope:def.scope,price:def.price,expenses:0,escrow:def.price,started:workState(life)[site][def.metric],units:def.units,acceptedDay:life.day,status:'accepted'};
  return {ok:true,message:'Agreed: '+def.scope+' TD '+def.price+' reserved by the employer. Complete work during supervised shifts; submit for acceptance afterwards.'};
 }
 const a=s.active;
 if(!a||a.site!==site)return fail('There is no accepted contract here.');
 if(action==='cancel'){
  p.till=cents(p.till+a.escrow);a.escrow=0;a.status='cancelled';
 }else if(action==='submit'){
  if(life.playerAt!==site||!life.jobSupervisors(site).length)return fail('Submit at the workplace while its supervisor is present.');
  const delivered=Math.max(0,workState(life)[site][def.metric]-a.started);
  if(delivered<a.units)return fail(delivered+'/'+a.units+' accepted units. Rework and continue; your wages are unaffected.');
  // Transfer reserved funds back into the same employer pot only within this
  // synchronous acceptance transaction, then pay through the saved ledger.
  p.till=cents(p.till+a.escrow);a.escrow=0;
  const slip=closeTimesheet(life,{id:'contract:'+a.id,site,day:life.day,worked:1,required:1,pay:a.price,tasks:[],startedAt:life.day*1440+life.minute},{name:a.title,tasks:['contract-acceptance']},'Contract accepted');
  slip.kind='contract';slip.hours=null;slip.rate=null;slip.minutes=0;
  settlePayslip(life,slip);a.slipId=slip.id;a.status='paid';
 }else return fail('Unknown contract action.');
 s.history.unshift({...a});s.history.length=Math.min(40,s.history.length);s.active=null;
 return {ok:true,message:action==='cancel'?'Contract cancelled. Employer funds returned; no wage deduction.':'Work accepted and contract paid once. See the itemised payslip.'};
}
