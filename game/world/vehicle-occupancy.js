// Full oriented vehicle-to-vehicle footprint occupancy, with a small buffer.
// Cars and trucks can turn through a junction without the corners passing through
// another actor; comparing centres or only a point at the bumper is insufficient.
// Pure math: the same code runs in the game and deterministic Node regressions.
function basis(c) {
  const yaw=Number(c.yaw??0);
  return {
    along: {x:Math.sin(yaw),z:Math.cos(yaw)},
    across:{x:Math.cos(yaw),z:-Math.sin(yaw)},
    length:Math.max(0.1,Number(c.L??c.length??4.4))/2,
    width:Math.max(0.1,Number(c.widthM??1.9))/2
  };
}
const dot=(a,b)=>a.x*b.x+a.z*b.z;
export function vehicleFootprintsOverlap(a,b,clearance=0.15) {
  if(!a||!b)return false;
  if(![a.x,a.z,b.x,b.z].every(Number.isFinite))return true;
  const A=basis(a), B=basis(b), delta={x:b.x-a.x,z:b.z-a.z};
  const radius=(c,axis)=>Math.abs(dot(c.along,axis))*c.length+
    Math.abs(dot(c.across,axis))*c.width;
  return [A.along,A.across,B.along,B.across].every(axis=>
    Math.abs(dot(delta,axis))<radius(A,axis)+radius(B,axis)+clearance);
}
export function carIncreasingSeparation(before,after,other) {
  const old=Math.hypot(before.x-other.x,before.z-other.z);
  const next=Math.hypot(after.x-other.x,after.z-other.z);
  return Number.isFinite(old)&&Number.isFinite(next)&&next>old+0.02;
}
