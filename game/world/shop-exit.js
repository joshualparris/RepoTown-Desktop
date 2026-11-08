import { civicStreetDirection } from './civic-entrance.js';
// Spawn on the pavement in front of the real facade: new north-facing infill
// and south-side industrial sites face -Z, legacy High Street sites face +Z.
// The doorway must remain behind the player; yaw 0 looks -Z, Math.PI looks +Z.
export function civicExitPose(site, colliders, radius = 0.46) {
  if (!site || !site.door || !Number.isFinite(site.door.x) || !Number.isFinite(site.door.z))
    throw new TypeError('Civic exit requires a door position');
  const side = civicStreetDirection(site);
  const collides = (x,z) => (colliders||[]).some(c=>{
    const cx=Math.max(c.x0,Math.min(c.x1,x)),cz=Math.max(c.z0,Math.min(c.z1,z));
    return (x-cx)**2+(z-cz)**2 < radius**2;
  });
  // Footpath distance also keeps the player beyond the auto-enter door sensor.
  // Choose outward-facing yaw on both sides rather than looking back at the door.
  const outwardYaw = side > 0 ? Math.PI : 0;
  for(const offset of [3.2,4.2,5.2,6.2,7.2,8.2,9.2,10.2]){
    const z=site.door.z+side*offset;
    for(const xoff of [0,-1.6,1.6,-3.2,3.2]){
      const x=site.door.x+xoff;
      if(!collides(x,z))return {x,z,yaw:outwardYaw};
    }
  }
  // Never return a collision-intersecting point. The caller can use the
  // safe town-centre respawn rather than trap the user inside geometry.
  return null;
}
