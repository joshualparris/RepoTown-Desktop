// Narromine Aerodrome YNRM game geometry. Airservices ERSA (2025/2026) is
// authoritative for runway designations and dimensions; threshold placement
// here is an approximate aerial-aligned interpretation, NOT survey data.
// World: X east, Z south, metres; runway heading uses true degrees.
export const AERODROME = Object.freeze({
  icao: 'YNRM', iata: 'QRM', elevationFeet: 782, name: 'Narromine Aerodrome',
  positionSource: 'approximate game reconstruction; not a surveyed aerodrome chart',
  museum: Object.freeze({x:-5722.5,z:-2053.2}),
  apron: Object.freeze({x:-5818,z:-2175}),
  entry: Object.freeze({x:-5806,z:-2174,yaw:Math.PI}),
  runways: Object.freeze([
    Object.freeze({id:'11/29', headingDeg:121, length:1521, width:30, displacedStartM:0, displacedEndM:258, x:-6290, z:-2700, surface:'asphalt'}),
    Object.freeze({id:'04/22', headingDeg:54, length:1100, width:30, displacedStartM:87, displacedEndM:0, x:-6290, z:-2700, surface:'asphalt'}),
  ]),
  grassStrips: Object.freeze([
    Object.freeze({id:'11/29 glider',headingDeg:121,length:812,width:60,x:-6445,z:-2820,surface:'grass'}),
    Object.freeze({id:'04/22 glider',headingDeg:54,length:1042,width:80,x:-6400,z:-2600,surface:'grass'}),
    Object.freeze({id:'18/36 glider',headingDeg:0,length:846,width:80,x:-6650,z:-2620,surface:'grass'}),
  ]),
});
export function runwayVector(runway) {
  const h=runway.headingDeg*Math.PI/180;
  return {x:Math.sin(h),z:-Math.cos(h)};
}
export function runwayEnd(runway, atStart=true) {
  const v=runwayVector(runway), t=(atStart?-1:1)*runway.length/2;
  return {x:runway.x+v.x*t,z:runway.z+v.z*t};
}
export function runwayLocal(runway,x,z) {
  const v=runwayVector(runway), dx=x-runway.x,dz=z-runway.z;
  return {along:dx*v.x+dz*v.z,cross:dx*(-v.z)+dz*v.x};
}
export function isRunway(x,z,margin=0) {
  return AERODROME.runways.some(r=>{
    const p=runwayLocal(r,x,z);
    return Math.abs(p.along)<=r.length/2+margin && Math.abs(p.cross)<=r.width/2+margin;
  });
}
export function aircraftParking() {
  return [
    {id:'trainer', name:'High-wing flight trainer',x:-5818,z:-2175,headingDeg:121},
    {id:'sport', name:'Low-wing sport aircraft',x:-5834,z:-2178,headingDeg:121},
  ];
}
