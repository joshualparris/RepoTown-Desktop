// Signalised High Street pedestrian crossing, inspired by the traffic-light
// behaviour in IsoCity (amilich/isometric-city, MIT licence).
// This is an independent implementation for Repository Town's 3D coordinate
// system and its deterministic town clock; no IsoCity source was copied.
// IsoCity: https://github.com/amilich/isometric-city
// Licence: https://github.com/amilich/isometric-city/blob/main/LICENSE
//
// Town roads run east-west. The first crossing is on High Street where a
// north-south avenue reaches the shops; traffic uses left-hand lanes.
// Everything is derived from town time: there are no timers, random phase
// changes, browser-only state, or frame-rate-dependent signal transitions.

export const SIGNAL_CROSSINGS=Object.freeze([
  Object.freeze({id:'high-street-avenue',x:52,z:177})
]);
export const SIGNAL_CYCLE_SECONDS=72;

// 42 s through-traffic green, 6 s amber, 2 s all-red clearance,
// 18 s pedestrian walk, 4 s all-red clearance.
export function crossingState(minute,secondsPerTownMinute=3){
  const seconds=((minute*secondsPerTownMinute)%SIGNAL_CYCLE_SECONDS+SIGNAL_CYCLE_SECONDS)%SIGNAL_CYCLE_SECONDS;
  if(seconds<42)return {vehicles:'green',pedestrians:'wait',remaining:42-seconds};
  if(seconds<48)return {vehicles:'amber',pedestrians:'wait',remaining:48-seconds};
  if(seconds<50)return {vehicles:'red',pedestrians:'wait',remaining:50-seconds};
  if(seconds<68)return {vehicles:'red',pedestrians:'walk',remaining:68-seconds};
  return {vehicles:'red',pedestrians:'wait',remaining:72-seconds};
}

// Cars/trucks already beyond their stop line must finish traversing the
// junction when it changes: never trap a vehicle in the pedestrian crossing.
// Truck centres wait 5.8 m before the painted crossing, allowing 3.3 m of
// vehicle body and 2.5 m clearance. Opposite-direction traffic is symmetric.
export function mustStopAtCrossing(from,to,minute,{crossings=SIGNAL_CROSSINGS,roadHalfWidth=4.8,frontClearance=5.8}={}){
  if(crossingState(minute).vehicles==='green')return false;
  const dx=to.x-from.x;
  if(Math.abs(dx)<1e-6)return false;
  const direction=Math.sign(dx);
  for(const crossing of crossings){
    if(Math.abs(from.z-crossing.z)>roadHalfWidth||Math.abs(to.z-crossing.z)>roadHalfWidth)continue;
    const stop=crossing.x-direction*frontClearance;
    // Only block when first reaching the stop line, not when already past it.
    if((stop-from.x)*direction>1e-5 && (stop-to.x)*direction<=1e-5)return true;
  }
  return false;
}
