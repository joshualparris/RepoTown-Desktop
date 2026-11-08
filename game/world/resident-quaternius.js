// Quaternius Universal Base Characters + Universal Animation Library, adapted for Repository Town.
//
// Assets (CC0, Quaternius):
//   Universal Base Characters[Standard] — Superhero_Male_FullBody / Superhero_Female_FullBody,
//     hair/eye/body base-colour textures. Textures are downscaled to 512 px; normal/roughness maps
//     are intentionally omitted for phone memory and bandwidth.
//   Universal Animation Library[Standard] — selected clips only (UAL1_Standard.glb, trimmed).
//
// This module is deliberately independent of the procedural figure. It keeps one identity record
// (skin/hair/eye colour, gender, height) stable across reloads and provides a small animation
// controller. It is an experimental style: the procedural figure remains the default until the
// side-by-side comparison has been reviewed.
import * as THREE from 'three';

const CLIP_STATE = Object.freeze({
  idle: 'Idle_Loop', walk: 'Walk_Loop', jog: 'Jog_Fwd_Loop', talk: 'Idle_Talking_Loop',
  sit: 'Sitting_Idle_Loop', eat: 'Sitting_Idle_Loop', drive: 'Driving_Loop', carry: 'Walk_Loop',
  work: 'Interact', sleep: 'Sitting_Idle_Loop',
});
const BASE_URL = 'assets/people/quaternius/';
const TAU = Math.PI * 2;

let templatePromise = null;
export function loadQuaterniusTemplate(base = BASE_URL) {
  if (templatePromise) return templatePromise;
  templatePromise = (async () => {
    const [{ GLTFLoader }, { clone: skeletonClone }, textures] = await Promise.all([
      import('../vendor/GLTFLoader.js'),
      import('../vendor/SkeletonUtils.js'),
      loadTextures(base),
    ]);
    const loader = new GLTFLoader();
    const [male, female, anim] = await Promise.all([
      loader.loadAsync(base + 'Superhero_Male_FullBody.gltf'),
      loader.loadAsync(base + 'Superhero_Female_FullBody.gltf'),
      loader.loadAsync(base + 'ual1-trimmed.glb'),
    ]);
    const variants = [
      { scene: male.scene, height: 1.75, label: 'male' },
      { scene: female.scene, height: 1.75, label: 'female' },
    ];
    return { variants, clips: anim.animations, textures, skeletonClone };
  })();
  return templatePromise;
}

async function loadTextures(base) {
  const loader = new THREE.TextureLoader();
  const load = (file) => new Promise((resolve) => loader.load(base + file, (t) => { t.colorSpace = THREE.SRGBColorSpace; resolve(t); }, undefined, () => resolve(null)));
  const [male, maleLight, female, femaleLight] = await Promise.all([
    load('T_Body_Male.png'), load('T_Body_Male_Light.png'),
    load('T_Body_Female.png'), load('T_Body_Female_Light.png'),
  ]);
  return { male, maleLight, female, femaleLight };
}

function tintMaterial(material, identity, opts) {
  const m = material.clone();
  const name = String(m.name || '');
  if (/h ?air|eyebrow/i.test(name)) {
    m.color.setHex(identity.hair.base);
    if (identity.hair.base > 0xb0aaa0) m.color.multiplyScalar(1.05);
  } else if (/eye/i.test(name)) {
    m.color.setHex(identity.eyes.colour);
  }
  if (/hair/i.test(name) && identity.hair.style === 'bald') m.visible = false;
  return m;
}

// Build one rigged person. Returns {root, mixer, actions, setState, update, setLod, dispose}.
export function createQuaterniusFigure(identity, template, options = {}) {
  if (!template) throw new Error('Quaternius template not loaded');
  const female = identity.gender === 'female';
  const variant = template.variants[female ? 1 : 0];
  const root = template.skeletonClone(variant.scene);
  const height = Number.isFinite(identity.body.height) ? identity.body.height : 1.75;
  const scale = Math.max(.45, Math.min(1.18, height / 1.75));
  root.scale.setScalar(scale);
  root.position.y = 0;
  // Tint hair/eyes and choose the light/dark body texture by a stable identity bit.
  const useLight = (identity.seed >>> 9) % 2 === 0;
  const bodyTexture = female ? (useLight ? template.textures.femaleLight : template.textures.female) : (useLight ? template.textures.maleLight : template.textures.male);
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    o.material = mats.map((m) => {
      const n = String(m.name || '');
      if (/hair|eyebrow/i.test(n) && identity.hair.style === 'bald') o.visible = false;
      if (/superhero/i.test(n) && bodyTexture) { const c = m.clone(); c.map = bodyTexture; c.needsUpdate = true; return c; }
      return tintMaterial(m, identity, options);
    });
    if (o.material.length === 1) o.material = o.material[0];
    o.frustumCulled = false;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  // Everyday-clothing overlay: a simple torso shirt attached to the chest bone so it follows
  // the rig while hiding most of the superhero torso texture. Arms/legs remain the base texture.
  const shirt = attachShirt(root, identity, options);
  const mixer = new THREE.AnimationMixer(root);
  const actions = {};
  for (const [state, clipName] of Object.entries(CLIP_STATE)) {
    const clip = template.clips.find((c) => c.name === clipName);
    if (clip) actions[state] = mixer.clipAction(clip);
  }
  let current = null, state = 'idle', lod = 0, ready = false;
  const setState = (next) => {
    if (state === next && current) return;
    state = next;
    const action = actions[next] || actions.idle;
    if (action && action !== current) {
      action.reset().setEffectiveWeight(1).fadeIn(.2).play();
      if (current) current.fadeOut(.2);
      current = action;
    }
  };
  const update = (dt) => { mixer.update(dt); ready = true; };
  const setLod = (level) => {
    lod = Math.max(0, Math.min(2, level | 0));
    // Skinned meshes are inexpensive on draw calls; far LOD only hides the shirt detail.
    if (shirt) shirt.visible = lod < 2;
  };
  const dispose = () => { mixer.stopAllAction(); root.removeFromParent(); };
  setState('idle');
  return { root, mixer, actions, setState, update, setLod, dispose, state: () => state, isReady: () => ready, identity };
}

function attachShirt(root, identity, options = {}) {
  const spine = findBone(root, ['spine_02', 'spine_01', 'spine_03']);
  if (!spine) return null;
  root.updateMatrixWorld(true);
  const pos = spine.getWorldPosition(new THREE.Vector3());
  const shirt = new THREE.Mesh(
    new THREE.CylinderGeometry(.21, .19, .46, 10, 1, false),
    new THREE.MeshLambertMaterial({ color: options.shirtColour ?? identity.clothing.shirt })
  );
  shirt.position.copy(pos); shirt.position.y += .02;
  shirt.scale.set(1, 1, .72);
  shirt.castShadow = shirt.receiveShadow = true;
  // Preserve the world transform while parenting to the animated chest bone.
  root.add(shirt); shirt.position.copy(pos); shirt.updateMatrixWorld(true);
  spine.attach(shirt);
  return shirt;
}

function findBone(root, names) {
  let found = null;
  root.traverse((o) => { if (!found && o.isBone && names.includes(o.name)) found = o; });
  return found;
}

// Convenience for the comparison page: one call per identity.
export async function buildQuaterniusPerson(identity, base = BASE_URL) {
  const template = await loadQuaterniusTemplate(base);
  return createQuaterniusFigure(identity, template, { identity });
}
