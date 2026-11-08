// Physical land titles are independent of GitHub repository authorship.
// 28-day simulation year: values are fictional Town Dollars, not actual NSW valuations.
// Council assets cannot be sold, and tenancies survive a change of landlord.
import { nswIndicativeQuote } from './nsw-property-law.js';
import { houseAddress, placeAddress } from './addresses.js';
const round=n=>Math.round(n*100)/100;
const dutyFor=p=>nswIndicativeQuote(p.value).scaledTownDuty;
export const PROPERTY_YEAR=28;
export const PROPERTY_RULES=Object.freeze({deposit:0.2,transfer:0.03,agency:0.02,conveyancing:20,mortgageDaily:0.0008,loanDays:112});
export const publicSites=new Set(['hall','square','school','clinic','depot','post','fire','power','waterworks','sewage','recycling','landfill','bank']);
const aliases={
  pub:'The Merged Branch leasehold',cafe:'Commit Cafe leasehold',hotel:'Railway Hotel leasehold',
  realestate:'Property Office',dealership:'Motor Sales',mechanic:'Motor Workshop',
};
const businessPrices={
  store:11500,bakery:9800,cafe:8200,greengrocer:7500,butcher:8800,pub:18500,hotel:27000,
  mill:18000,sheep:34000,dairy:25000,coop:16000,orchard:22000,garden:20000,silo:28000,
  foundry:32000,realestate:9200,dealership:15000,mechanic:12500,farmhouse:5100,
};
export function propertyKey(type,id){return (type==='house'?'H:':'B:')+id;}
function cash(me){return (me.wallet||0)+(me.bank||0);}
function spend(me,amount){
  if(cash(me)+1e-6<amount)return false;
  const wallet=Math.min(me.wallet||0,amount);
  me.wallet=round(me.wallet-wallet);me.bank=round(me.bank-(amount-wallet));
  return true;
}
function pay(me,amount){me.bank=round((me.bank||0)+amount);}
function write(state,text,day) {
  state.journal.unshift({day,text});
  state.journal.length=Math.min(100,state.journal.length);
}
export function initialiseProperties(life){
  const parcels={};
  for(const [i,h] of life.homes.entries()){
    const residents=life.villagers.filter(v=>v.home.coordinate===h.coordinate);
    const occupant=residents[0]||null;
    const tenure=occupant?.household?.tenure;
    const value=2800+(i%9)*320+(i%11===0?1200:0);
    const title=tenure==='owned'||tenure==='mortgage'
      ? 'resident:'+occupant.name
      : occupant ? (i%3===0?'Town Housing Trust':'Town Property Cooperative') : 'Town Property Cooperative';
    parcels[propertyKey('house',h.coordinate)]={
      id:propertyKey('house',h.coordinate),name:houseAddress(h.coordinate)+' · '+h.name,kind:'house',
      address:houseAddress(h.coordinate),legacyAddress:h.coordinate,owner:title,tenant:occupant?.name||null,
      occupants:residents.map(v=>v.name),
      jointOwners:title.startsWith('resident:')&&residents.length>1?residents.map(v=>v.name):[],
      occupied:!!occupant,value,rent:8,
      // More vacant houses are genuinely listed as the larger workforce moves in.
      // All 188 legal titles, existing tenancies and ownership stay unchanged.
      listed:(!occupant&&i%5===0)||(!!occupant&&tenure==='rent'&&i%19===0),protected:false,condition:78+i%20,
    };
  }
  for(const p of life.places.values()){
    let owner=publicSites.has(p.id)?'Town Council':p.kind==='farm'?'Agricultural Cooperative':
      p.id==='farmhouse'?'Agricultural Cooperative':'High Street Property Trust';
    const occupant=p.kind==='home'?'Farm families':publicSites.has(p.id)?'Public service':p.name;
    parcels[propertyKey('business',p.id)]={
      id:propertyKey('business',p.id),name:placeAddress(p)+' · '+p.name,kind:p.kind==='farm'?'farm':p.kind==='home'?'residential':'commercial',
      address:placeAddress(p),legacyAddress:p.side==='north'?placeAddress(p):(p.side==='south'?'South ':'')+p.col+'8',owner,tenant:occupant,occupied:true,
      value:businessPrices[p.id]||9500,rent:publicSites.has(p.id)?0:p.kind==='farm'?55:22,
      listed:false,protected:publicSites.has(p.id),condition:80,
    };
  }
  // Distinct opening balances for market counterparties, not minted on each sale.
  const state={version:1,parcels,accounts:{'Town Property Cooperative':150000,'Town Housing Trust':80000,'High Street Property Trust':85000,'Agricultural Cooperative':125000,'Property Office':1200},
    reserve:175000,liens:{},playerLease:null,journal:[],lastDay:1};
  life.civic.property=state;
  return state;
}
// Saved-property IDs, tenants, mortgages and leases remain immutable. Only
// public-facing addresses/names migrate in place when an older save is loaded.
export function upgradePropertyAddresses(life) {
  const deeds=life.civic?.property?.parcels;
  if (!deeds) return;
  for(const h of life.homes||[]) {
    const deed=deeds[propertyKey('house',h.coordinate)]; if(!deed)continue;
    deed.address=houseAddress(h.coordinate);deed.legacyAddress=h.coordinate;
    deed.name=deed.address+' · '+h.name;
    // Old saves predate married households: add secondary occupants without
    // changing the legal primary tenant or title owner.
    const residents=life.villagers.filter(v=>v.home.coordinate===h.coordinate).map(v=>v.name);
    if(!Array.isArray(deed.occupants))
      deed.occupants=deed.tenant==='visitor'?['visitor']:deed.tenant?residents:[];
    if(!Array.isArray(deed.jointOwners))
      deed.jointOwners=typeof deed.owner==='string'&&deed.owner.startsWith('resident:')?residents:[];
  }
  for(const p of life.places.values()){
    const id=propertyKey('business',p.id);
    let deed=deeds[id];
    if(!deed && p.expansion){
      // Existing v1 saves know only the original 46 premises. Add 2026
      // infill property records without resetting savings, land titles or leases.
      const isPublic=publicSites.has(p.id);
      deed={id,name:'',kind:'commercial',address:'',legacyAddress:'',
        owner:isPublic?'Town Council':'High Street Property Trust',
        tenant:isPublic?'Public service':p.name,occupied:true,
        occupants:[],jointOwners:[],value:9500,rent:isPublic?0:22,
        listed:false,protected:isPublic,condition:80};
      deeds[id]=deed;
    }
    if(!deed)continue;
    deed.address=placeAddress(p);
    deed.legacyAddress=p.side==='north'?deed.address:(p.side==='south'?'South ':'')+p.col+'8';
    deed.name=deed.address+' · '+p.name;
  }
}
export const registry=life=>{upgradePropertyAddresses(life);return life.civic.property;};
export function propertyReport(life) {
  const s=registry(life),entries=Object.values(s.parcels);
  return {total:entries.length,owned:entries.filter(p=>p.owner==='visitor'),
    forSale:entries.filter(p=>p.listed&&!p.protected),tenanted:entries.filter(p=>p.tenant),
    public:entries.filter(p=>p.protected).length,
    debt:Object.values(s.liens).reduce((a,b)=>a+b.balance,0),
    playerLease:s.playerLease,journal:s.journal.slice(0,12),reserve:s.reserve};
}
export const closingCosts=p=>round(dutyFor(p)+PROPERTY_RULES.conveyancing);
export const depositFor=p=>round(p.value*PROPERTY_RULES.deposit+closingCosts(p));
export function buyProperty(life,id){
  const s=registry(life),p=s.parcels[id],me=life.civic.player;
  if(!p||!p.listed||p.protected||p.owner==='visitor')return 'That title is not currently available for sale.';
  if(life.civic.credit?.loan)return 'Clear your existing personal loan before applying for a property mortgage.';
  const owner=p.owner,loan=round(p.value*(1-PROPERTY_RULES.deposit)),upfront=depositFor(p);
  if(cash(me)<upfront)return 'You need '+upfront+' Town Dollars for the deposit, duty and conveyancing. You have '+round(cash(me))+'.';
  if(s.reserve<loan)return 'The Community Bank does not have enough property lending funds available.';
  if(!spend(me,upfront))return 'Insufficient cleared funds.';
  const duty=dutyFor(p),fee=round(p.value*PROPERTY_RULES.agency);
  s.reserve=round(s.reserve-loan);
  // Transfer price comes from the bank advance plus the buyer's equity.
  s.accounts[owner]=round((s.accounts[owner]||0)+p.value-fee);
  s.accounts['Property Office']=round(s.accounts['Property Office']+fee+PROPERTY_RULES.conveyancing);
  life.civic.treasury=round(life.civic.treasury+duty);
  s.liens[id]={balance:loan,rate:PROPERTY_RULES.mortgageDaily,term:PROPERTY_RULES.loanDays,paid:0,arrears:0};
  p.owner='visitor';p.jointOwners=[];p.listed=false;
  write(s,'Acquired '+p.name+' for $'+p.value+' with mortgage $'+loan+'; existing tenant '+(p.tenant||'none')+'.',life.day);
  life.log('Settlement completed for '+p.name+'. The title is registered to you.');
  return 'Settlement complete. You own '+p.name+'. Mortgage $'+loan+'. '+(p.tenant?'The tenant remains under their existing lease.':'The property is vacant.');
}
export function listProperty(life,id){
  const s=registry(life),p=s.parcels[id];
  if(!p||p.owner!=='visitor')return 'You do not hold this title.';
  p.listed=!p.listed;
  return p.listed?'Listed '+p.name+' with the estate agent. Tenants remain protected.':'Sale listing withdrawn.';
}
export function sellProperty(life,id){
  const s=registry(life),p=s.parcels[id],me=life.civic.player;
  if(!p||p.owner!=='visitor'||!p.listed)return 'Only your listed property can be sold.';
  const price=round(p.value*0.98),fee=round(price*PROPERTY_RULES.agency),debt=s.liens[id]?.balance||0;
  const proceeds=round(price-fee-debt),buyer='Town Property Cooperative';
  if(proceeds<0)return 'The sale would leave negative equity; repay the mortgage first.';
  if(s.accounts[buyer]<price)return 'No buyer has the cleared funds to settle this purchase.';
  s.accounts[buyer]=round(s.accounts[buyer]-price);
  s.accounts['Property Office']=round(s.accounts['Property Office']+fee);
  s.reserve=round(s.reserve+debt);delete s.liens[id];
  pay(me,proceeds);p.owner=buyer;p.jointOwners=[];p.listed=false;
  if(s.playerLease===id)s.playerLease=null;
  write(s,'Sold '+p.name+' for $'+price+'; selling fee $'+fee+', loan discharged $'+debt+'.',life.day);
  return 'Sale settled: $'+price+' sale, $'+fee+' commission, $'+debt+' mortgage discharged; $'+proceeds+' to your savings.';
}
export function leaseProperty(life,id){
  const s=registry(life),p=s.parcels[id],me=life.civic.player;
  if(!p||p.kind!=='house'||p.tenant||p.owner==='visitor'||s.playerLease)return 'That home is not available for a new lease.';
  // Four seven-day in-game weeks: escrow is held, not paid to the landlord.
  const bond=p.rent*28;
  if(!spend(me,bond))return 'You need $'+bond+' for the refundable rental bond.';
  p.tenant='visitor';p.occupants=['visitor'];p.occupied=true;s.playerLease=id;s.bond=bond;
  write(s,'Leased '+p.name+' to visitor; $'+bond+' bond held.',life.day);
  return 'Lease signed for '+p.name+'. Rent $'+p.rent+'/day, bond $'+bond+' held. You can inspect the property in town.';
}
export function endLease(life){
  const s=registry(life);if(!s.playerLease)return 'You have no recorded tenancy.';
  const p=s.parcels[s.playerLease];if(!p)return 'Missing tenancy record.';
  p.tenant=null;p.occupants=[];p.occupied=false;const refund=s.bond||0;pay(life.civic.player,refund);
  write(s,'Lease ended at '+p.name+'; bond '+refund+' returned.',life.day);
  s.playerLease=null;s.bond=0;
  return 'Lease ended. $'+refund+' bond refunded. You return to rented temporary accommodation.';
}
export function receiveTenantRent(life,v,amount){
  if(!(amount>0))return 0;
  const s=registry(life),p=s.parcels[propertyKey('house',v.home.coordinate)];
  if(!p)return amount; // legacy council receipt
  const owner=p.owner;
  if(owner==='Town Council')return amount;
  if(owner==='visitor')pay(life.civic.player,amount);
  else if(owner.startsWith('resident:')) {
    const landlord=life.villagers.find(n=>n.name===owner.slice(9));
    if(landlord)landlord.wallet=round(landlord.wallet+amount);
  } else s.accounts[owner]=round((s.accounts[owner]||0)+amount);
  return 0; // portion routed to the legal owner rather than the council
}
export function propertyDay(life){
  const s=registry(life);
  if(!s||s.lastDay===life.day)return;
  s.lastDay=life.day;
  const me=life.civic.player;
  const agentWage=Math.min(12,s.accounts['Property Office']);
  s.accounts['Property Office']=round(s.accounts['Property Office']-agentWage);
  s.accounts.agentWages=round((s.accounts.agentWages||0)+agentWage);
  for(const p of Object.values(s.parcels).filter(p=>p.owner==='visitor')){
    const lien=s.liens[p.id];
    if(lien){
      const interest=round(lien.balance*lien.rate),due=round(Math.min(lien.balance+interest,Math.max(8,lien.balance/lien.term)+interest)+lien.arrears);
      const available=Math.min(cash(me),due),payment=round(available);
      if(payment)spend(me,payment);
      lien.balance=round(Math.max(0,lien.balance+interest-payment));
      lien.arrears=round(Math.max(0,due-payment));
      s.reserve=round(s.reserve+payment);
      if(lien.balance===0){delete s.liens[p.id];write(s,'Mortgage discharged on '+p.name,life.day);}
    }
    const rates=p.kind==='house'?2:p.kind==='farm'?7:4;
    const ratesOwed=round(rates+(p.ratesArrears||0));
    const ratesPaid=round(Math.min(ratesOwed,cash(me)));
    if(ratesPaid>0){spend(me,ratesPaid);life.civic.treasury=round(life.civic.treasury+ratesPaid);}
    p.ratesArrears=round(ratesOwed-ratesPaid);
    // Buildings deteriorate slowly. Maintenance work is paid for separately.
    p.condition=Math.max(10,round(p.condition-0.05));
  }
}
export function visitorRentAccount(life,amount){
  const s=registry(life),id=s?.playerLease;
  if(!id)return amount;
  const p=s.parcels[id];if(!p)return amount;
  s.accounts[p.owner]=round((s.accounts[p.owner]||0)+amount);
  return 0;
}
