// Presentation/admission policy only: never delete residents, jobs or saved progress.
export const ACTIVITY_KEY = 'repository-town.activity.v1';
export const ACTIVITY_MODES = Object.freeze({
  calm: Object.freeze({ pedestrians: 14, walkers: 10, movingCars: 24, parkedCars: 40, share: .25 }),
  standard: Object.freeze({ pedestrians: Infinity, walkers: 36, movingCars: 400, parkedCars: Infinity, share: 1 })
});
export function activitySample(id) {
  let hash = 2166136261;
  for (const char of String(id)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}
export function createTownActivity(storage) {
  let mode = 'calm';
  try { if (storage?.getItem(ACTIVITY_KEY) === 'standard') mode = 'standard'; } catch {}
  return {
    get mode() { return mode; },
    get limits() { return ACTIVITY_MODES[mode]; },
    set(value) {
      mode = value === 'standard' ? 'standard' : 'calm';
      try { storage?.setItem(ACTIVITY_KEY, mode); } catch {}
      return mode;
    },
    admits(id) { return activitySample(id) < ACTIVITY_MODES[mode].share; },
    outdoor(residents, eye) {
      if (mode === 'standard') return null;
      const near = residents.filter(v => !v.inside && Math.hypot(v.x-eye.x,v.z-eye.z)<95)
        .sort((a,b) => Number(!!b.engaged)-Number(!!a.engaged) ||
          Math.hypot(a.x-eye.x,a.z-eye.z)-Math.hypot(b.x-eye.x,b.z-eye.z));
      const chosen = [];
      for (const v of near) {
        if (v.engaged || (chosen.length < ACTIVITY_MODES.calm.pedestrians &&
          chosen.every(other => Math.hypot(v.x-other.x,v.z-other.z)>=3.2) &&
          chosen.filter(other => Math.hypot(v.x-other.x,v.z-other.z)<12).length<3)) chosen.push(v);
      }
      return new Set(chosen);
    }
  };
}
