// Stable, lightweight resident styling. Shared meshes/materials keep this cheap on phones.
// Does not mutate the simulation, saved records, NPC keys or dialogue voices.
import * as THREE from 'three';
import { identityFor, outfitFor, appearanceSignature } from './resident-identity.js';
import { makeResidentFigure } from './resident-figure.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const BALL = new THREE.SphereGeometry(1, 9, 7);
const CYL = new THREE.CylinderGeometry(.5, .5, 1, 10);
const materials = new Map();
const mat = c => {
  if (!materials.has(c)) materials.set(c, new THREE.MeshLambertMaterial({ color: c }));
  return materials.get(c);
};
function add(parent, geo, colour, size, pos) {
  const obj = new THREE.Mesh(geo, mat(colour));
  obj.scale.set(...size);
  obj.position.set(...pos);
  parent.add(obj);
  return obj;
}
export function residentSeed(identity) {
  const key = String(identity ?? 'resident');
  let hash = 2166136261;
  for (const ch of key) {
    hash ^= ch.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
const ink = 0x252c3d;
const hairTones = [0x271c19, 0x503423, 0x8d552b, 0xbd8d4c, 0xdbbf84, 0x3c3236, 0xb5a9a1, 0x7c3132];
const trouserTones = [0x2b3648, 0x41404c, 0x3d4c38, 0x6e5142, 0x253b42, 0x6a594d, 0x464451];
const accessories = [0xe9d8ba, 0xf1aa76, 0xa6b9df, 0xdabb6b, 0xc9d7c2, 0xb4a2cd, 0xe9c3cb];
export function appearanceFor(identity) {
  const seed = residentSeed(identity);
  // Character-specific clothing hue: no sequential same-blue/uniform clones.
  const shirt = new THREE.Color().setHSL((seed % 360) / 360, .34 + ((seed >>> 9) % 25) / 100, .34 + ((seed >>> 14) % 22) / 100).getHex();
  return {
    seed,
    shirt,
    trousers: trouserTones[(seed >>> 3) % trouserTones.length],
    hair: hairTones[(seed >>> 5) % hairTones.length],
    accent: accessories[(seed >>> 12) % accessories.length],
    hairStyle: (seed >>> 8) % 8,
    clothing: (seed >>> 16) % 7,
    glasses: (seed >>> 21) % 5 === 0,
    facialHair: (seed >>> 23) % 5 === 0,
    build: (seed >>> 25) % 6,
  };
}
export function makeDistinctPerson(identity, resident = null, context = {}) {
  const key = String(identity ?? resident?.populationId ?? resident?.id ?? 'resident');
  const face = identityFor(key, resident || {}, context);
  const look = appearanceFor(key, resident);
  const age = Number.isFinite(resident?.age) ? resident.age : face.age;
  if (age < 18) look.facialHair = false;
  if (age >= 65) look.hair = 0xb9b5ae;
  const fig = makeResidentFigure(face, resident || {}, { ...context, activity: context.activity || 'home' });
  // Keep the established clearance/scale contract: adults stay near 1.0 wide; children
  // and teens are shorter. The detailed figure itself carries the individual proportions.
  const buildWidth = { slim: .94, athletic: 1.02, average: 1, solid: 1.06, round: 1.08, 'tall-lean': .96 }[face.body.build] || 1;
  const ageScale = face.body.height / 1.82;
  fig.group.scale.set(buildWidth, ageScale, buildWidth);
  // A stable direct-child outfit marker preserves the existing renderer contract. The real
  // clothing is nested under the posture group so it can sit, lie and turn with the body.
  const anchor = new THREE.Group(); anchor.userData.isOutfit = true; anchor.userData.anchor = true; fig.group.add(anchor);
  fig.group.userData.residentAppearance = {
    ...look, identity: key, age, descriptor: face,
    height: face.body.height, build: face.body.build, hairStyle: face.hair.style,
    clothingStyle: face.clothing.style, signature: appearanceSignature(face),
  };
  return fig;
}
