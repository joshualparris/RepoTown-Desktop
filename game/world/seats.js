// Single source of truth for physical seats in houses, civic interiors and town.
// Seat hotspots are separate from ordinary exhibit interactions. World geometry
// stays intact while the player is seated; standing restores the safe approach spot.
export const SEAT_HEIGHT = Object.freeze({
  chair: 0.45, stool: 0.7, sofa: 0.44, couch: 0.44,
  bench: 0.45, pew: 0.45, pews: 0.45, throne: 0.55,
  armchair: 0.48, rockingChair: 0.46, recliner: 0.44,
});
export const isSeatType = (type) => Object.hasOwn(SEAT_HEIGHT, type);
export function makeSeat(key, type, x, z, yaw = Math.PI, options = {}) {
  if (!isSeatType(type)) return null;
  if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(yaw)) return null;
  const height = options.height ?? SEAT_HEIGHT[type];
  return {
    key, type, label: options.label || ({sofa:'Sofa',pews:'Church pew',throne:'Throne'}[type] || type.charAt(0).toUpperCase()+type.slice(1)),
    pos: {x,z}, yaw, eyeHeight: height + 0.75,
    room: options.room ?? 0, roomName: options.roomName || '',
    // Ordinary seats must be approached from a clear standing spot. The
    // collision engine still regards tables and furniture as solid.
  };
}
export function seatForProp(type, spot, key, options={}) {
  if (!isSeatType(type)) return null;
  return makeSeat(key,type,spot.x,spot.z,Math.PI+(spot.rot||0),options);
}
export function nearestSeat(seats, position, forward, maxRange=2.5) {
  let best=null,score=Infinity;
  for(const s of seats||[]) {
    const dx=s.pos.x-position.x,dz=s.pos.z-position.z;
    const d=Math.hypot(dx,dz);if(d>maxRange)continue;
    const facing=d<.1?1:(dx*forward.x+dz*forward.z)/d;
    if(facing<-.15&&d>1.1)continue;
    const rating=d-.7*facing;
    if(rating<score){score=rating;best=s;}
  }
  return best;
}
