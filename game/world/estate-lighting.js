// Deterministic street-light points along the selected development streets.
// All positions are fictional design metres, not Australian Standards photometric approval.
// A physical pole belongs behind a footpath; its luminaire cantilevers toward the road.
// Do not put poles through junctions, rail reservations, existing homes or carriageways.
export const ESTATE_LAMP_SPACING_M = 38;
export const ESTATE_LAMP_HEIGHT_M = 6.2;
export const ESTATE_LAMP_JUNCTION_CLEARANCE_M = 11;
const EPS=1e-6;
const within=(n,a,b)=>n>=Math.min(a,b)-EPS&&n<=Math.max(a,b)+EPS;
export function estateStreetLightLocations(roads,spacing=ESTATE_LAMP_SPACING_M){
 const lights=[];
 const crossings=(x,z,own)=>{
   // Keep a refuge at perpendicular intersections, with plenty of clear
   // turning room for larger vehicles and at each road terminus.
   return roads.some(r=>r.id!==own&&(
     (Math.abs(r.a.x-r.b.x)<EPS&&within(x,r.a.x-ESTATE_LAMP_JUNCTION_CLEARANCE_M,r.a.x+ESTATE_LAMP_JUNCTION_CLEARANCE_M)&&within(z,r.a.z,r.b.z))||
     (Math.abs(r.a.z-r.b.z)<EPS&&within(z,r.a.z-ESTATE_LAMP_JUNCTION_CLEARANCE_M,r.a.z+ESTATE_LAMP_JUNCTION_CLEARANCE_M)&&within(x,r.a.x,r.b.x))
   ));
 };
 for(const road of roads){
   const horizontal=Math.abs(road.a.z-road.b.z)<EPS;
   const length=Math.hypot(road.b.x-road.a.x,road.b.z-road.a.z);
   const dx=(road.b.x-road.a.x)/length,dz=(road.b.z-road.a.z)/length;
   const footpath=road.footpath||2;
   const offset=road.width/2+footpath+0.95;
   // Stagger sides for near-uniform coverage; neither edge of the road
   // receives a duplicate pole at the same chainage.
   for(const side of [-1,1]){
     for(let t=18+(side>0?spacing/2:0);t<length-12;t+=spacing){
       const cx=road.a.x+dx*t,cz=road.a.z+dz*t;
       if(crossings(cx,cz,road.id))continue;
       const x=cx+(horizontal?0:side*offset),z=cz+(horizontal?side*offset:0);
       const towardX=horizontal?0:-side, towardZ=horizontal?-side:0;
       const arm=2.05; // lamp over the verge / gutter, never a low obstruction
       const hx=x+towardX*arm,hz=z+towardZ*arm;
       lights.push(Object.freeze({
         id:road.id+'-'+side+'-'+Math.round(t),roadId:road.id,x,z,
         headX:hx,headZ:hz,height:ESTATE_LAMP_HEIGHT_M,
         roadwardX:towardX*2.1,roadwardZ:towardZ*2.1,roadward:horizontal?towardZ*2.1:0,
         distanceToCentre:offset,
         distanceAlong:t,
       }));
     }
   }
 }
 return Object.freeze(lights);
}
export const nightLightLevel=(daylight)=>Math.max(0,Math.min(1,(0.55-daylight)/0.45));
