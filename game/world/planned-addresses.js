// Provisional address registry for conceptual expansion parcels.
// No street number or road name is official until the road is connected and approved.
import {OUTSKIRT_PARCELS,PLANNED_ROADS} from './town-planning.js';
import {auditOutskirts} from './town-planning-audit.js';
export const PROVISIONAL_ROAD_NAMES=Object.freeze({
 'west-collector':'WC-01','east-collector':'EC-01',
 'north-connector':'NC-01','south-connector':'SC-01',
 'west-access':'WA-01','east-access':'EA-01'
});
export function plannedParcelAddresses(){
 const audit=auditOutskirts();
 return OUTSKIRT_PARCELS.map(p=>{
  const a=audit.parcels.find(q=>q.id===p.id);
  const roadId=a.frontageRoadIds.length===1?a.frontageRoadIds[0]:null;
  return Object.freeze({
   parcelId:p.id,legacyPropertyKey:null,siteId:null,
   roadId,provisionalRoadCode:roadId?PROVISIONAL_ROAD_NAMES[roadId]:null,
   roadName:null,streetNumber:null,locality:'Repository Town (fictional)',
   status:'unaddressed-concept',publicRoadAccessVerified:false,
   note:a.frontageRoadIds.length?'Adjacent to proposed road geometry only; not driveable or surveyed':'No adjacent proposed public road; redesign required'
  });
 });
}
export function validatePlannedAddress(a){
 if(!a||!OUTSKIRT_PARCELS.some(p=>p.id===a.parcelId))return false;
 if(a.status==='unaddressed-concept')return a.streetNumber===null&&a.roadName===null;
 return typeof a.roadName==='string'&&a.roadName.length>0&&Number.isInteger(a.streetNumber)&&a.streetNumber>0&&a.publicRoadAccessVerified===true;
}
