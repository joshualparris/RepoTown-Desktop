// Landlord and occupier are legally distinct; sale never cancels a lease.
// No automatic eviction: notice -> opportunity to remedy -> independent order
// -> possession/warrant. This is educational, not actual legal advice.
import { legalLeaseNotes } from './nsw-property-law.js';
const r2=n=>Math.round(n*100)/100;
export function ensureTenancies(life){
 const s=life.civic.property;
 if(!s.tenancies)s.tenancies={};
 for(const p of Object.values(s.parcels)){
  if(s.tenancies[p.id]||!p.tenant||p.protected||p.owner==='resident:'+p.tenant)continue;
  const commercial=['commercial','farm'].includes(p.kind);
  s.tenancies[p.id]={id:p.id,kind:commercial?'commercial':'residential',landlord:p.owner,
    tenant:p.tenant,rent:p.rent,term:commercial?112:56,start:life.day,
    end:life.day+(commercial?112:56),outgoings:commercial?3:0,
    deposit:0,depositHeld:0,arrears:0,lastPaid:life.day,lastReview:life.day,
    lateSince:null,notice:null,order:null,condition:p.condition,
    permittedUse:commercial?p.name:'residence',
    disclosureServed:null,reviewMethod:'fixed 28-day anniversary',
    fitout:'tenant fittings; structural repairs by landlord',insurance:'operator public liability',
    status:'active',bondLedger:[],history:[]};
 }
 return s.tenancies;
}
export function leaseReport(life,id){return ensureTenancies(life)[id]||null;}
function recipient(life,owner,n){
 if(n<=0)return;
 const s=life.civic.property;
 if(owner==='visitor')life.civic.player.bank=r2(life.civic.player.bank+n);
 else if(owner==='Town Council')life.civic.treasury=r2(life.civic.treasury+n);
 else if(owner.startsWith('resident:')){
  const v=life.villagers.find(v=>v.name===owner.slice(9));
  if(v)v.wallet=r2(v.wallet+n);else s.accounts[owner]=r2((s.accounts[owner]||0)+n);
 }else s.accounts[owner]=r2((s.accounts[owner]||0)+n);
}
export function commercialRentDay(life){
 const leases=ensureTenancies(life);
 for(const l of Object.values(leases)){
  if(!['active','holding-over'].includes(l.status)||l.kind!=='commercial')continue;
  // Lease travels with its freehold title; landlord can change on settlement.
  const p=life.civic.property.parcels[l.id];
  if(!p)continue;
  l.landlord=p.owner;
  const operator=life.place(l.id.slice(2));
  if(!operator)continue;
  const due=r2(l.rent+l.outgoings);
  const payment=r2(Math.min(due+l.arrears,Math.max(0,operator.till||0)));
  operator.till=r2(operator.till-payment);
  recipient(life,p.owner,payment);
  l.arrears=r2(l.arrears+due-payment);
  if(l.arrears>0&&l.lateSince===null)l.lateSince=life.day;
  if(l.arrears<=0) {l.lateSince=null;if(l.notice?.ground==='rent-arrears')l.notice=null;}
  l.lastPaid=payment>0?life.day:l.lastPaid;
  if(life.day>=l.end&&l.status==='active'){l.status='holding-over';l.history.push({day:life.day,text:'Term expired; occupancy continues pending negotiated renewal.'});}
 }
}
export function issueCommercialDisclosure(life,id){
 const l=leaseReport(life,id),p=life.civic.property.parcels[id];
 if(!l||l.kind!=='commercial'||p.owner!=='visitor')return 'Only a commercial landlord can serve this disclosure.';
 l.disclosureServed=life.day;
 return 'Retail lease disclosure issued day '+life.day+'. Wait at least 7 town days to agree a renewal; it lists rent, outgoings, permitted use, works, term and options.';
}
export function renewCommercial(life,id){
 const l=leaseReport(life,id),p=life.civic.property.parcels[id];
 if(!l||p.owner!=='visitor'||l.kind!=='commercial')return 'You must own this commercial freehold.';
 if(!Number.isFinite(l.disclosureServed)||life.day-l.disclosureServed<7)return 'A landlord disclosure must be provided at least seven days before signing.';
 if(l.notice||l.order)return 'Resolve any existing lease dispute before renewal.';
 l.status='active';l.start=life.day;l.end=life.day+112;
 l.history.push({day:life.day,text:'Commercial lease renewed by agreement for 112 town days.'});
 return 'Signed commercial lease renewal. Existing tenant stays. New term ends day '+l.end+'.';
}
export function reviewCommercialRent(life,id){
 const l=leaseReport(life,id),p=life.civic.property.parcels[id];
 if(!l||p.owner!=='visitor'||l.kind!=='commercial')return 'You are not the commercial landlord.';
 if(life.day-l.lastReview<28)return 'Contractual rent review is permitted once per town year (28 days).';
 l.rent=r2(l.rent*1.03);l.lastReview=life.day;
 return 'Contractual rent review completed: $'+l.rent+'/day, a modeled 3% rise. Not a statutory NSW cap for commercial leases.';
}
export function tenancyNotice(life,id,ground){
 const l=leaseReport(life,id),p=life.civic.property.parcels[id];
 if(!l||p?.owner!=='visitor')return 'Only the recorded landlord can commence proceedings.';
 if(l.notice||l.order)return 'A notice or proceedings already exist.';
 if(ground!=='rent-arrears')return 'This game only supports documented non-payment grounds. Selling or wanting a different tenant is not sufficient.';
 if(l.kind==='residential'){
   if(!Number.isFinite(l.lateSince)||life.day-l.lateSince<14)return 'Residential rent must have been unpaid for at least 14 town days before a non-payment notice.';
 }else if(!(l.arrears>0))return 'There is no recorded commercial default.';
 l.notice={ground,issued:life.day,expires:life.day+14,served:true,tenant:l.tenant,appeal:true};
 l.history.push({day:life.day,text:'Written breach notice served with rights, remedy option and 14-day notice period.'});
 return 'Written notice served. Tenant can remedy the arrears; no lockout, no immediate eviction. Review after day '+l.notice.expires+'.';
}
export function applyTribunal(life,id){
 const l=leaseReport(life,id),p=life.civic.property.parcels[id];
 if(!l||p.owner!=='visitor'||!l.notice||life.day<l.notice.expires)return 'An eligible notice must expire before this stage.';
 if(l.arrears<=0){l.notice=null;return 'Default remedied; proceeding cancelled.';}
 l.order={applied:life.day,hear:life.day+4,decision:null,
   forum:l.kind==='residential'?'NSW Civil and Administrative Tribunal':'Retail tenancy mediation / competent court'};
 return 'Application lodged for independent review, hearing on town day '+l.order.hear+'. No order granted automatically.';
}
export function hearing(life,id){
 const l=leaseReport(life,id),p=life.civic.property.parcels[id];
 if(!l||p.owner!=='visitor'||!l.order||life.day<l.order.hear)return 'Hearing date has not arrived.';
 if(l.arrears<=0){l.order=null;l.notice=null;return 'Tenant remedied the default. Case dismissed.';}
 l.order.decision='possession-order';l.order.possessionDay=life.day+3;
 return 'Independent adjudicator in this simplified simulation granted a possession order. No physical removal before day '+l.order.possessionDay+'.';
}
export function enforcePossession(life,id){
 const l=leaseReport(life,id),p=life.civic.property.parcels[id];
 if(!l||p.owner!=='visitor'||l.order?.decision!=='possession-order'||life.day<l.order.possessionDay)
   return 'A valid possession order and enforcement date are required. Self-help lockouts are prohibited.';
 // Warrant/sheriff simulated only after ordered possession; tenant's current
 // physical character/home is not deleted, and the house is not reassigned.
 l.status='vacated';l.history.push({day:life.day,text:'Possession enforced under order; former tenant referred for alternative accommodation.'});
 if(l.kind==='commercial'){p.tenant=null;p.occupied=false;}
 else{
  // Residential character keeps their dwelling until relocation to a vacant
  // house is possible; no instant disappear/teleport on the street.
  const vacant=Object.values(life.civic.property.parcels).find(x=>x.kind==='house'&&!x.tenant&&x.id!==p.id&&!x.protected);
  const person=life.villagers.find(v=>v.name===l.tenant);
  if(!vacant||!person){l.status='pending-rehousing';return 'Possession order exists; safe rehousing is required. No tenant removed from their home.';}
  vacant.tenant=person.name;vacant.occupied=true;person.home=life.homes.find(h=>h.coordinate===vacant.address);
  p.tenant=null;p.occupied=false;
 }
 return 'Warrant executed only after a tribunal/court order. Occupant rehoused or premises lawfully surrendered.';
}
export function agreeSurrender(life,id){
 const l=leaseReport(life,id),p=life.civic.property.parcels[id];
 if(!l||p.owner!=='visitor')return 'Only a titled landlord can propose a surrender.';
 // Explicit acceptance from NPC/tenant must exist; no unilateral termination.
 if(!l.tenantConsent)return 'Tenant has not accepted mutual surrender. Continue the lease or formal dispute process.';
 l.status='vacated';p.tenant=null;p.occupied=false;return 'Mutually agreed surrender recorded.';
}
export function leaseOverview(life,id){
 const l=leaseReport(life,id);return l?
  { ...l,note:legalLeaseNotes(l.kind) }:null;
}
