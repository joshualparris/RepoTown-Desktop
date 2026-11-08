// Read-only quantitative audit. Does not pretend planned strips are driveable roads.
import {OUTSKIRT_PARCELS,PLANNED_ROADS} from './town-planning.js';
const intersects=(a,b)=>Math.abs(a.x-b.x)*2<a.w+b.w&&Math.abs(a.z-b.z)*2<a.d+b.d;
const touching=(a,b,tolerance=1)=>Math.abs(a.x-b.x)*2<=a.w+b.w+2*tolerance&&Math.abs(a.z-b.z)*2<=a.d+b.d+2*tolerance;
export function auditOutskirts(){
 const parcels=OUTSKIRT_PARCELS.map(p=>{
  const touchingRoads=PLANNED_ROADS.filter(r=>touching(p,r,1)).map(r=>r.id);
  const intersectingRoads=PLANNED_ROADS.filter(r=>intersects(p,r)).map(r=>r.id);
  return {id:p.id,zone:p.zone,areaM2:p.w*p.d,hectares:Math.round(p.w*p.d/100)/100,frontageRoadIds:touchingRoads,roadOverlaps:intersectingRoads,hasReservedRoadFrontage:touchingRoads.length>0};
 });
 const roadJunctions=[];
 for(let i=0;i<PLANNED_ROADS.length;i++)for(let j=i+1;j<PLANNED_ROADS.length;j++){
  const a=PLANNED_ROADS[i],b=PLANNED_ROADS[j];
  if(intersects(a,b))roadJunctions.push([a.id,b.id]);
 }
 return {parcels,roadJunctions,unfronted:parcels.filter(p=>!p.hasReservedRoadFrontage).map(p=>p.id),roadIntrusions:parcels.filter(p=>p.roadOverlaps.length).map(p=>({id:p.id,roads:p.roadOverlaps})),farmAreaHa:parcels.filter(p=>p.zone.startsWith('RU')).reduce((sum,p)=>sum+p.hectares,0)};
}
