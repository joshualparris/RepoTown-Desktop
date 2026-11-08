// Narromine residents on foot. Anyone who changes place without driving or riding in a car walks there on
// the footpath beside the road: teenagers to the high school, primary children whose parent doesn't drive
// them, adults with no car, and short hops of up to 2.5 km. Walks follow the same street routes as cars, at
// 1.3 m/s (children 1.1), on the side of the road set by the person. Only walkers near the player are drawn,
// as Repository Town's articulated figures with the walking animation.
import * as THREE from 'three';
import { dayPlan } from './narromine-population.js';
import { makePerson, pose } from './npcs.js';

const WALK = 1.3, MAX_WALK_M = 2500, RADIUS = 220, MAX_FIGURES = 36;
const SHIRTS = [0x3f6fb5, 0xb5473f, 0x4f8a4b, 0xd9a441, 0x6a4c93, 0x2f7f86, 0xc96b8a, 0x8a6a4f, 0x2f5f8a];

export function createNarrominePedestrians(commute, nodes, adj, parent = null, { activity } = {}) {
  const pop = commute.population;
  let planned = { key: null, walks: [] };
  // Every walk for a weekday: legs that are not covered by a car trip (as driver or passenger).
  function walks(weekday) {
    if (planned.key === weekday) return planned.walks;
    const inCar = new Set();
    for (const t of commute.trips(weekday)) { inCar.add(t.person + '@' + t.depart); for (const k of t.passengers || []) inCar.add(k + '@' + t.depart); }
    const out = [];
    for (const p of pop.people) {
      if (p.age < 5) continue;                                         // under-fives go with a parent
      const hh = pop.households[+p.household.slice(3)], plan = dayPlan(p, hh, weekday, pop.workplaces);
      let where = 'home';
      for (const step of plan) {
        if (step.at === where) continue;
        const from = where; where = step.at;
        if (inCar.has(p.id + '@' + step.from)) continue;
        // A school-run child rides with the parent at 8:25, so their own 8:25 'travel' is not a walk.
        if (hh.schoolRun?.kids.includes(p.id) && (step.kind === 'travel' || (from === hh.schoolRun.school && hh.schoolRun.pickup))) continue;
        if (p.drives && step.kind !== 'school') continue;
        if (p.ridesWith && (step.kind === 'travel' || step.at === 'home')) continue;      // rides with their partner               // drivers' legs are car trips (or walked hops under 150 m)
        const a = commute.pointOf(from, hh), b = commute.pointOf(step.at, hh); if (!a || !b || b.away) continue;
        const r = commute.route(commute.nearestNode(a.x, a.z), commute.nearestNode(b.x, b.z));
        if (!r || r.length > MAX_WALK_M || r.length < 60) continue;
        const speed = p.age < 12 ? 1.1 : WALK;
        out.push({ id: p.id + '@' + step.from, person: p.id, from, to: step.at, depart: step.from, path: r.path, length: r.length, duration: r.length / speed / 60, speed, side: (+p.id.slice(3)) % 2 ? 1 : -1, purpose: step.kind });
      }
    }
    planned = { key: weekday, walks: out };
    return out;
  }
  // Where a walker is: metres along the route → a point on the footpath (beside the road edge) and heading.
  function placeOnRoute(w, s) {
    let i = 0;
    while (i < w.path.length - 2) { const a = nodes[w.path[i]], b = nodes[w.path[i + 1]], L = Math.hypot(b.x - a.x, b.z - a.z); if (s < L) break; s -= L; i++; }
    const a = nodes[w.path[i]], b = nodes[w.path[i + 1]] || a, L = Math.hypot(b.x - a.x, b.z - a.z) || 1, ux = (b.x - a.x) / L, uz = (b.z - a.z) / L;
    const e = adj.get(w.path[i])?.find((q) => q.to === w.path[i + 1]), off = (e?.width || 7) / 2 + 1.6;
    const t = Math.min(1, s / L);
    return { x: a.x + (b.x - a.x) * t + uz * off * w.side, z: a.z + (b.z - a.z) * t - ux * off * w.side, yaw: Math.atan2(ux, uz) };
  }
  // Figures: a small pool reused for whoever is walking near the player.
  const pool = [], active = new Map();
  function figureFor(w) {
    let f = pool.pop();
    const p = pop.people[+w.person.slice(3)], seed = +p.id.slice(3);
    if (!f) { f = makePerson(seed * 13 + 5, SHIRTS[seed % SHIRTS.length], p.age < 18 ? 0x2f4f7f : 0x2f3440); parent?.add(f.group); }
    f.group.visible = true; f.group.scale.setScalar(p.age < 12 ? 0.72 : p.age < 16 ? 0.88 : 1); f.group.name = p.name;
    return f;
  }
  let clock = 0, lastWallClock = null;
  // Render/physics dt is capped when WebGL is slow. People still need to cover
  // physical distance in real time, rather than crawling at 0.3 m/s on phones.
  // Clamp long background-tab pauses so returning to the tab cannot teleport
  // a walker hundreds of metres in one frame.
  function update(dt, player, weekday, minute) {
    const wall = typeof performance !== 'undefined' ? performance.now() : null;
    const realDt = wall !== null && lastWallClock !== null
      ? Math.max(0, Math.min(1, (wall - lastWallClock) / 1000))
      : dt;
    lastWallClock = wall;
    clock += realDt;
    for (const w of walks(weekday)) {
      if (activity && !activity.admits(w.person)) continue;
      if (active.has(w.id) || minute < w.depart || minute >= w.depart + w.duration) continue;
      const s = (minute - w.depart) * 60 * w.speed, at = placeOnRoute(w, s);
      if (Math.hypot(at.x - player.x, at.z - player.z) > RADIUS || active.size >= (activity?.limits.walkers ?? MAX_FIGURES)) continue;
      const f = figureFor(w); f.walk = w; f.s = s; active.set(w.id, f);
    }
    for (const [id, f] of active) {
      f.s += f.walk.speed * realDt;
      const at = placeOnRoute(f.walk, f.s);
      if (f.s >= f.walk.length || Math.hypot(at.x - player.x, at.z - player.z) > RADIUS + 40) { f.group.visible = false; pool.push(f); active.delete(id); continue; }
      f.group.position.set(at.x, 0, at.z); f.group.rotation.y = at.yaw; if (parent) pose(f, realDt, clock, true);
    }
    return active.size;
  }
  const visible = () => [...active.entries()].map(([id, f]) => { const v = f.group.getWorldPosition?.(new f.group.position.constructor()); return { id, name: f.group.name, x: f.group.position.x, z: f.group.position.z, shown: f.group.visible, inScene: !!f.group.parent, parentShown: f.group.parent?.visible, world: v && [v.x, v.y, v.z].map(n => Math.round(n)), scale: f.group.scale.x, kids: f.group.children.length }; });
  return { walks, update, visible, placeOnRoute };
}
