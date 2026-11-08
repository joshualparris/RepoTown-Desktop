// Fictional town-day contracts. Statutory NSW intervals are displayed as real
// reference law, while the game has its own clearly-labelled compressed timing.
import { nswIndicativeQuote, NSW_GUIDANCE } from './nsw-property-law.js';
const r2=n=>Math.round(n*100)/100;
export const GAME_CONVEYANCING=Object.freeze({coolingDays:5,settlementDays:7,depositFraction:0.1,
  // Three percent was a former approximation; now the 2026/27 NSW duty
  // bracket is computed on an illustrative 100-AUD-per-town-dollar scenario.
  conveyancing:20});
const cash=p=>(p.wallet||0)+(p.bank||0);
const take=(p,n)=>{if(cash(p)+0.001<n)return false;const w=Math.min(p.wallet,n);p.wallet=r2(p.wallet-w);p.bank=r2(p.bank-(n-w));return true;};
const credit=(p,n)=>{p.bank=r2(p.bank+n);};
export function ensureContracts(life){return life.civic.property.contracts??=( {} );}
export function contractQuote(life,id){
 const p=life.civic.property.parcels[id];if(!p)return null;
 const q=nswIndicativeQuote(p.value);
 return {id,price:p.value,indicativeAUD:q.exampleAUD,nswDutyAUD:q.dutyAUD,
   gameDuty:q.scaledTownDuty,gameDeposit:r2(p.value*GAME_CONVEYANCING.depositFraction),
   gameBuyerDeposit:r2(p.value*.2),coolingDays:GAME_CONVEYANCING.coolingDays,
   settlementDays:GAME_CONVEYANCING.settlementDays,
   note:q.title};
}
export function exchangePurchase(life,id){
 const p=life.civic.property.parcels[id],me=life.civic.player,contracts=ensureContracts(life);
 if(!p||p.protected||!p.listed||p.owner==='visitor')return 'This property has no available contract for sale.';
 if(contracts[id])return 'A contract has already been exchanged for this title.';
 const quote=contractQuote(life,id),deposit=quote.gameDeposit;
 if(!take(me,deposit))return 'Exchange requires a $'+deposit+' deposit in cleared funds.';
 const c={id,buyer:'visitor',seller:p.owner,price:p.value,deposit,
   exchanged:life.day,coolOffUntil:life.day+GAME_CONVEYANCING.coolingDays,
   settleDay:life.day+GAME_CONVEYANCING.settlementDays,status:'exchanged',
   dutyQuote:quote};
 contracts[id]=c;life.civic.property.escrow=r2((life.civic.property.escrow||0)+deposit);
 life.civic.property.journal.unshift({day:life.day,text:'Exchanged contract at '+p.address+', '+deposit+' held in agency trust.'});
 return 'Contracts exchanged. $'+deposit+' deposit held in trust; cooling-off ends day '+c.coolOffUntil+
   ', anticipated settlement day '+c.settleDay+'. NSW real-world five BUSINESS-day cooling-off applies to ordinary residential private treaty; this is a compressed game timeline.';
}
export function rescindContract(life,id){
 const state=life.civic.property,c=ensureContracts(life)[id],p=state.parcels[id];
 if(!c||c.status!=='exchanged')return 'No open contract to withdraw from.';
 if(life.day>c.coolOffUntil)return 'Cooling-off has ended. A solicitor must advise on any contractual exit.';
 const fee=r2(c.price*NSW_GUIDANCE.withdrawalPenalty),refund=r2(c.deposit-fee);
 credit(life.civic.player,refund);state.escrow=r2((state.escrow||0)-c.deposit);
 state.accounts[c.seller]=r2((state.accounts[c.seller]||0)+fee);
 c.status='rescinded';delete state.contracts[id];
 return 'Cooling-off exercised. '+refund+' refunded; '+fee+' forfeited to vendor (0.25% modeled NSW penalty).';
}
export function settlePurchase(life,id,buy){
 const state=life.civic.property,c=ensureContracts(life)[id],p=state.parcels[id];
 if(!c||c.status!=='exchanged')return 'No exchanged purchase contract.';
 if(life.day<c.settleDay)return 'Settlement cannot occur before day '+c.settleDay+'.';
 if(p.owner!==c.seller||!p.listed)return 'Seller or listing has changed. Settlement suspended for conveyancer review.';
 // Return trust balance to the purchaser at settlement to count against the
 // existing 20% finance deposit; buy() then deducts all closing funds once.
 state.escrow=r2((state.escrow||0)-c.deposit);credit(life.civic.player,c.deposit);
 const outcome=buy(life,id);
 if(!/Settlement complete/.test(outcome)){
   if(!take(life.civic.player,c.deposit))throw new Error('Escrow refund accounting failure');
   state.escrow=r2(state.escrow+c.deposit);
   return 'Settlement delayed: '+outcome;
 }
 c.status='settled';delete state.contracts[id];
 return outcome+' NSW 2026/27 duty reference: $'+c.dutyQuote.nswDutyAUD.toLocaleString('en-AU')+
   ' on illustrative AUD $'+c.dutyQuote.indicativeAUD.toLocaleString('en-AU')+' scenario (not a property appraisal).';
}
export function contractReport(life,id){return ensureContracts(life)[id]||null;}
