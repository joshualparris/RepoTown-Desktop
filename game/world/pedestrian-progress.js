// Frame-rate independent watchdog: crowd repulsion must not trap walkers in a
// back-and-forth loop around the same street corner or shop entrance.
// Takes TOWN minutes, not real seconds. State belongs to each actor.
export function routeProgress(actor, minutes, { tolerance = 0.45, stallMinutes = 3.5 } = {}) {
  const goal = actor.path?.[0];
  if (!goal) { actor.walkProgress = null; return false; }
  const distance = Math.hypot(goal.x - actor.x, goal.z - actor.z);
  if (!Number.isFinite(distance)) { actor.walkProgress = null; return false; }
  const key = `${actor.path.length}/${goal.x.toFixed(2)}/${goal.z.toFixed(2)}`;
  let state = actor.walkProgress;
  if (!state || state.key !== key) {
    actor.walkProgress = { key, best: distance, waiting: 0 };
    return false;
  }
  if (distance <= tolerance || distance < state.best - 0.32) {
    state.best = distance;
    state.waiting = 0;
    return false;
  }
  state.waiting += Math.max(0, Math.min(1, minutes));
  if (state.waiting < stallMinutes) return false;
  actor.walkProgress = { key, best: distance, waiting: 0 };
  return true;
}

export function clearPedestrianSegment(a, b, world, radius = 0.62) {
  if (!Number.isFinite(a.x + a.z + b.x + b.z)) return false;
  const distance = Math.hypot(b.x-a.x, b.z-a.z);
  for (let k = 1, n = Math.max(1, Math.ceil(distance / .3)); k <= n; k++) {
    const x = a.x+(b.x-a.x)*k/n, z = a.z+(b.z-a.z)*k/n;
    if (world?.hits?.(x,z,radius)) return false;
  }
  return true;
}

export function escapeCrowdWaypoint(actor, world = null, attempt = 0) {
  const target = actor.path?.[0];
  if (!target) return false;
  const dx = target.x-actor.x, dz = target.z-actor.z, d = Math.hypot(dx,dz);
  if (d < 0.01) return false;
  // Alternate passing sides on retries, but commit to one waypoint at a time.
  const side = attempt % 2 ? -1 : 1;
  const ahead = Math.min(2.5, d * .6), lateral = 2.05;
  for (const sign of [side, -side]) {
    const point = { x: actor.x+dx/d*ahead-sign*dz/d*lateral,
      z: actor.z+dz/d*ahead+sign*dx/d*lateral, detour: true };
    if (!clearPedestrianSegment(actor, point, world)) continue;
    if (!clearPedestrianSegment(point, target, world)) continue;
    actor.path.unshift(point);
    return true;
  }
  return false;
}
