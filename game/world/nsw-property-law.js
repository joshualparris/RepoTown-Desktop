// NSW rules sourced from Revenue NSW and NSW Fair Trading; assessed separately
// from the game's fictional Town-Dollar values. Effective 1 July 2026.
export const NSW_DUTY_2026=Object.freeze([
 {upTo:18000,base:0,above:0,per100:1.25},
 {upTo:38000,base:225,above:18000,per100:1.5},
 {upTo:103000,base:525,above:38000,per100:1.75},
 {upTo:387000,base:1662,above:103000,per100:3.5},
 {upTo:1290000,base:11602,above:387000,per100:4.5},
 {upTo:Infinity,base:52237,above:1290000,per100:5.5},
]);
export const NSW_GUIDANCE=Object.freeze({
 year:'2026/27',coolingOffBusinessDays:5,withdrawalPenalty:0.0025,
 normalAuctionCoolingOff:false,ordinaryDeposit:0.1,offPlanCoolingOffBusinessDays:10,
 saleSettlementWeeksTypically:6,retailDisclosureDays:7,
 residentialRentArrearsBeforeNotice:14,nonpaymentNoticeDays:14,
 residentialRentIncreaseMinimumDays:365,
 revenue:'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty/understanding-transfer-duty/calculate-transfer-duty',
 contract:'https://www.nsw.gov.au/housing-and-construction/buying-and-selling-property/buying-property-nsw/contracts-and-deposits',
 eviction:'https://www.nsw.gov.au/housing-and-construction/rules/eviction-of-a-tenant-from-a-rental-property',
 retail:'https://www.smallbusiness.nsw.gov.au/help/common-questions/lease-disclosure-statements'
});
const r2=n=>Math.round(n*100)/100;
export function nswTransferDuty(aud,opts={}){
 if(!Number.isFinite(aud)||aud<0)throw new RangeError('Property value must be positive AUD');
 // Does not assume first-home concessions, surcharge purchaser duty, premium
 // residential duty, exemptions, or unusual land sizes. Seek Revenue NSW quotes.
 const band=NSW_DUTY_2026.find(b=>aud<=b.upTo);
 return Math.max(20,Math.round((band.base+(aud-band.above)/100*band.per100)*100)/100);
}
export function nswIndicativeQuote(townDollarValue){
 // Only a reference scenario. It is NOT an appraisal of a Repository Town lot.
 const exampleAUD=townDollarValue*100;
 return {exampleAUD,dutyAUD:nswTransferDuty(exampleAUD),scaledTownDuty:r2(nswTransferDuty(exampleAUD)/100),
  title:'Reference scenario only: fictional lot x100, not its actual NSW market value.'};
}
export const legalLeaseNotes=(kind)=>kind==='commercial'?
 'NSW retail leases: lessor disclosure generally at least seven days before entry; disclose rent, outgoings, repairs, term, options and permitted use. Non-retail commercial leases may follow different contractual rules.' :
 'NSW residential: no-grounds eviction is not permitted. Written valid-ground notice, statutory periods, NCAT orders and sheriff enforcement where required. Never evict just because a title is sold.';
