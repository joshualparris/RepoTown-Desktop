// Narromine homes, workplaces and Coles share the collision-aware indoor walker
// already used by Repository Town. The simulation roster is authoritative;
// these are rendered, locally roaming figures rather than extra invented people.
import * as THREE from 'three';
import { CollisionWorld } from '../engine/collision.js';
import { Walker, houseWander, rankKitchens } from './npcs.js';

const roomAt = (rooms, pos) => Math.max(0, rooms.findIndex(r =>
  pos.x >= r.x0 && pos.x <= r.x1 && pos.z >= r.z0 && pos.z <= r.z1));

export function animateNarromineResidents(built, actors, makeLabel, clock = () => 600) {
  const world = new CollisionWorld(built.colliders);
  const kitchens = rankKitchens(built.placedProps || [], built.rooms);
  const people = [];
  for (const actor of actors) {
    const position = new THREE.Vector3(actor.x, 0, actor.z);
    const walker = new Walker(actor.figure, position, {
      speed: actor.speed ?? 0.9, name: actor.name,
    });
    walker.key = 'narromine:' + actor.id;
    walker.room = roomAt(built.rooms, position);
    walker.activity = actor.activity || 'going about the day';
    walker.heading = actor.yaw ?? 0;
    walker.group.rotation.y = walker.heading;
    // Shops have no household meal cycle. Residents still use the same
    // collision-aware route planner, but retain their correct job/activity.
    const domestic = !!actor.domestic;
    const base = houseWander(built.rooms, built.openings || [], world,
      domestic ? clock : () => 600, domestic ? kitchens : []);
    const plan = actor.roam === false
      ? (w) => [{ x: w.pos.x, z: w.pos.z, pause: 4 }]
      : (w) => {
          const route = base(w);
          if (!domestic) w.activity = actor.activity || 'working';
          return route;
        };
    plan.collisionWorld = world;
    walker.plan = plan; // immediately clears full-body collisions before first render
    walker.room = roomAt(built.rooms, walker.pos);
    walker.onMove = (pos) => {
      walker.room = roomAt(built.rooms, pos);
      if (actor.record) { actor.record.x = pos.x; actor.record.z = pos.z; }
    };
    walker.wait = actor.roam === false ? 3 : 0.4 + (people.length % 4) * 0.4;
    const tag = makeLabel?.(actor.label || actor.name, 'interactive');
    if (tag) {
      tag.position.set(0, 2.2 / (walker.group.scale.y || 1), 0);
      tag.userData.labelKind = 'interactive';
      walker.group.add(tag);
      walker.tag = tag;
    }
    built.group.add(walker.group);
    if (actor.record) { actor.record.x = walker.pos.x; actor.record.z = walker.pos.z; }
    people.push(walker);
  }
  built.people = people;
  return people;
}
