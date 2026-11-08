// Evidence-first visual filter. Mapillary *triangulated feature detection*
// coordinates are NOT surveyed sign-post positions. Preserve immutable source
// objects and keep the questionable ones available in a URL QA mode; do not
// manufacture replacement GPS positions or alter regulatory road rules.
// See docs/NARROMINE_MAPILLARY_SIGN_LANE_AUDIT_2026-11-06.md.
import {NARROMINE_MAPILLARY_OBJECTS} from './narromine-mapillary-data.js';
export const DETECTED_SIGN_TYPES=Object.freeze([
  'speed','speedEnd','warning','direction','stop','giveway',
  'keepLeft','noEntry','trafficLight'
]);
const kinds=new Set(DETECTED_SIGN_TYPES);
export const SIGN_POSITION_ERROR_MARGIN_M=0.35;
export function classifyMapillarySign(o){
  if(!kinds.has(o?.type))return {sign:false,withhold:false,status:'other-object'};
  const {x,z,cx,cz,ux,uz,roadW}=o;
  if(![x,z,cx,cz,ux,uz,roadW].every(Number.isFinite)||roadW<=0||
      Math.abs(Math.hypot(ux,uz)-1)>0.05)
    return {sign:true,withhold:true,status:'no-reliable-road-frame',id:o.id};
  const signedLateral=(x-cx)*(-uz)+(z-cz)*ux;
  const clearanceFromEdge=Math.abs(signedLateral)-roadW/2;
  const withhold=clearanceFromEdge<=SIGN_POSITION_ERROR_MARGIN_M;
  const reason=withhold
    ? (o.type==='keepLeft'?'unverified-median-island':'triangulated-sign-carriageway-overlap')
    : 'clear-of-snapped-carriageway';
  return {sign:true,withhold,status:reason,id:o.id,type:o.type,seen:o.seen,
    signedLateralM:+signedLateral.toFixed(2),
    clearanceFromRoadEdgeM:+clearanceFromEdge.toFixed(2),
    roadWidthM:roadW};
}
export const SIGN_LANE_REVIEW=Object.freeze(NARROMINE_MAPILLARY_OBJECTS
  .map(classifyMapillarySign).filter(x=>x.sign&&x.withhold).map(Object.freeze));
export const SIGN_LANE_AUDIT=Object.freeze({
  detected:NARROMINE_MAPILLARY_OBJECTS.filter(x=>kinds.has(x.type)).length,
  withheld:SIGN_LANE_REVIEW.length,
  safe:NARROMINE_MAPILLARY_OBJECTS.filter(x=>kinds.has(x.type)).length-SIGN_LANE_REVIEW.length,
});
export function allowMapillarySignDisplay(o,rawQa=false){
  // Explicit visual QA may show every original location, *not* evidence
  // that the location is accurate. The normal town withholds doubtful posts.
  return rawQa||!classifyMapillarySign(o).withhold;
}
