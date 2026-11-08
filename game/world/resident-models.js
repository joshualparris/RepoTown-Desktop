// Settings → Resident style. The town's residents can be drawn as the original block figures
// ("classic") or as animated, rigged models (CC0, see assets/people/LICENSE-Quaternius-CC0.txt).
// Each resident keeps their own colours and build, chosen from their identity seed, so a person
// looks the same every visit. Models are loaded only when a style needs them, and only residents
// near the player wear one (far away the block figure stands in), so phones stay smooth.
import * as THREE from 'three';
import { loadQuaterniusTemplate, createQuaterniusFigure } from './resident-quaternius.js';

export const RESIDENT_STYLES = Object.freeze([
  { id: 'quaternius', label: 'Quaternius rigged · default', note: 'Rigged male/female Universal Base Characters with Universal Animation Library walk, talk, sit and driving clips. The default resident style; compare it with Classic on the resident model review page.' },
  { id: 'classic', label: 'Classic figures · optional', note: 'The original block-built residents, kept as an optional lighter style.' },
  { id: 'cartoon', label: 'Cartoon', note: 'Rounded cartoon people with hair and clothes in each resident’s own colours.' },
  { id: 'storybook', label: 'Storybook · five characters', note: 'Five animated public-domain KayKit characters; fantasy-styled, without weapons. Nearby residents only.' },
  { id: 'mannequin', label: 'Mannequin · colourful', note: 'Smoothly animated life-size mannequins in each resident’s clothing colours; they talk, sit and drive.' },
  { id: 'mannequin-grey', label: 'Mannequin · art-class grey', note: 'The same animated mannequins in a calm neutral grey.' },
]);
const STORE = 'town-resident-style';
const NEAR = 45, FAR = 52;            // metres: wear a model inside NEAR, drop it beyond FAR

// What each style loads and which clip plays for each activity.
const KINDS = {
  cartoon: { file: 'casual.glb', clips: { walk: 'Walk', carry: 'Walk_Carry', idle: 'Idle', talk: 'Idle', ride: 'Idle' }, height: 1.7 },
  storybook: {files:['kaykit-knight.glb','kaykit-barbarian.glb','kaykit-mage.glb','kaykit-rogue.glb','kaykit-rogue-hooded.glb'],clips:{walk:'Walk',carry:'Walk',idle:'Idle',talk:'Talk',ride:'Sit'},height:1.75},
  mannequin: { file: 'mannequin.glb', clips: { walk: 'Walk_Loop', carry: 'Walk_Loop', idle: 'Idle_Loop', talk: 'Idle_Talking_Loop', ride: 'Driving_Loop' }, height: 1.74 },
};
const kindOf = (style) => style === 'cartoon' ? 'cartoon' : style === 'storybook' ? 'storybook' : style.startsWith('mannequin') ? 'mannequin' : style === 'quaternius' ? 'quaternius' : null;

export function savedResidentStyle() {
  try { const s = localStorage.getItem(STORE); return RESIDENT_STYLES.some((x) => x.id === s) ? s : 'quaternius'; } catch { return 'quaternius'; }
}
export function saveResidentStyle(id) {
  try { localStorage.setItem(STORE, id); } catch { /* private mode: the choice lasts this visit */ }
}

const templates = new Map();   // kind -> Promise<{ scene, clips, height }>
function loadKind(kind, base) {
  if (!templates.has(kind)) templates.set(kind, (async () => {
    const [{ GLTFLoader }] = await Promise.all([import('../vendor/GLTFLoader.js')]);
    const files=KINDS[kind].files||[KINDS[kind].file];
    // The storybook pack stores idle/walking clips ONLY in the Knight donor.
    // The other four GLBs share its bone names but contain no animation buffers.
    const gltfs=await Promise.all(files.map(file=>new GLTFLoader().loadAsync(base+file)));
    const variants=gltfs.map(gltf=>{
      gltf.scene.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(gltf.scene,true);
      return {scene:gltf.scene,height:Math.max(.5,box.max.y-box.min.y),floor:box.min.y};
    });
    if(kind==='storybook'&& !gltfs[0].animations.some(a=>a.name==='Walk'))
      throw new Error('KayKit storybook donor is missing Walk animation');
    return {...variants[0],variants,clips:gltfs[0].animations};
  })());
  return templates.get(kind);
}

const HAIR = [0x271c19, 0x503423, 0x8d552b, 0xbd8d4c, 0xdbbf84, 0x3c3236, 0xb5a9a1, 0x7c3132];
const SKIN = [0xe2b48c, 0xc68e63, 0x8d5a3b, 0xf1c9a5, 0xa8714a, 0x6b4430];
// Colours for one resident's model, from the same appearance record the block figures use.
function colourModel(root, kind, style, look) {
  const seed = look.seed >>> 0, skin = SKIN[(seed >>> 4) % SKIN.length];
  const tint = kind === 'cartoon'
    ? { Skin: skin, Face: skin, Shirt: look.shirt, Pants: look.trousers, Hair: look.hair ?? HAIR[(seed >>> 5) % HAIR.length], Belt: 0x2f2620 }
    : style === 'mannequin-grey' ? { M_Main: 0xd9d4ca, M_Joints: 0x8e877c } : { M_Main: look.shirt, M_Joints: look.trousers };
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;   // skinned bounds are the bind pose; never pop out mid-stride
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    o.material = mats.map((m) => { const c = m.clone(); if (tint[m.name] != null) c.color.setHex(tint[m.name]); return c; });
    if (o.material.length === 1) o.material = o.material[0];
  });
}

// One controller for the whole town: owns the chosen style and every resident's model.
export function createResidentModels({ base = 'assets/people/' } = {}) {
  let style = typeof document === 'undefined' ? 'classic' : savedResidentStyle();
  let ready = null, SkeletonUtils = null, version = 0, pending = Promise.resolve();
  const live = new Set();

  async function prepare() {
    const kind = kindOf(style); if (!kind) { ready = null; return; }
    const v = ++version;
    try {
      if (kind === 'quaternius') {
        const t = await loadQuaterniusTemplate(base + 'quaternius/');
        if (v === version) ready = { kind, ...t };
        return;
      }
      SkeletonUtils ||= await import('../vendor/SkeletonUtils.js');
      const t = await loadKind(kind, base);
      if (v === version) ready = { kind, ...t };
    } catch (err) {
      console.warn('Resident style unavailable, keeping classic figures:', err);
      if (v === version) { ready = null; style = 'classic'; }
    }
  }
  function drop(p) {
    if (!p.model) return;
    if (p.model.quat) p.model.quat.dispose();
    else { p.model.mixer.stopAllAction(); p.fig.group.remove(p.model.root); }
    p.model = null; live.delete(p);
    for (const o of p.body) o.visible = true;
  }
  function wear(p) {
    const look = p.fig.group.userData.residentAppearance || { seed: 1, shirt: 0x6a7a8a, trousers: 0x333a44 };
    if (ready.kind === 'quaternius') {
      const identity = look.descriptor;
      if (!identity) return;
      const q = createQuaterniusFigure(identity, ready);
      // The procedural group carries the age/build scale. Divide it out so the rigged
      // model is exactly the identity's height rather than double-shrunk for children.
      const pg = p.fig.group.scale;
      q.root.scale.set(q.root.scale.x / (pg.x || 1), q.root.scale.y / (pg.y || 1), q.root.scale.z / (pg.z || 1));
      p.model = { root: q.root, mixer: q.mixer, actions: q.actions, state: null, style, quat: q };
      p.fig.group.add(q.root); live.add(p);
      for (const o of p.body) o.visible = false;
      return;
    }
    const variant=ready.kind==='storybook'?ready.variants[(look.seed>>>5)%ready.variants.length]:ready;
    const root = SkeletonUtils.clone(variant.scene);
    colourModel(root, ready.kind, style, look);
    // Same height spread as the block figures' builds; their group already carries that scale.
    const s = KINDS[ready.kind].height / variant.height;
    root.scale.setScalar(s); root.position.y = -variant.floor * s;
    const mixer = new THREE.AnimationMixer(root), actions = {};
    for (const [state, name] of Object.entries(KINDS[ready.kind].clips)) {
      const clip = ready.clips.find((c) => c.name === name); if (clip) actions[state] = mixer.clipAction(clip);
    }
    p.model = { root, mixer, actions, state: null, style, variant:ready.kind==='storybook'?(look.seed>>>5)%ready.variants.length:0 };
    p.fig.group.add(root); live.add(p);
    for (const o of p.body) o.visible = false;
    // Offset the cycle so neighbours don't step in lock-step.
    mixer.setTime(((look.seed >>> 7) % 100) / 37);
  }
  // Called once per frame per visible resident. Returns true when the model is drawing them.
  function update(p, { dt, dist, moving, speed, talking, riding, carrying, seated = false }) {
    if (p.model && (p.model.style !== style || !ready)) drop(p);
    if (!ready) return false;
    if (!p.model && dist > NEAR) return false;
    if (p.model && dist > FAR) { drop(p); return false; }
    if (!p.model) wear(p);
    const m = p.model, want = riding ? 'ride' : seated ? 'sit' : moving ? (carrying ? 'carry' : 'walk') : talking ? 'talk' : 'idle';
    if (m.quat) {
      m.quat.setState(want === 'ride' ? 'drive' : want);
      m.quat.update(dt);
      return true;
    }
    const next = m.actions[want] || m.actions.idle;
    if (m.state !== want && next) {
      const prev = m.current; next.reset().setEffectiveWeight(1).fadeIn(0.25).play();
      if (prev && prev !== next) prev.fadeOut(0.25);
      m.current = next; m.state = want;
    }
    // Feet keep pace with the ground: the clips walk at about 1.4 m/s.
    if (m.current) m.current.timeScale = want === 'walk' || want === 'carry' ? THREE.MathUtils.clamp(speed / 1.4, 0.55, 2.2) : 1;
    m.mixer.update(dt);
    return true;
  }
  function hide(p) { if (p.model) drop(p); }
  function setStyle(id) {
    if (!RESIDENT_STYLES.some((x) => x.id === id)) return style;
    style = id; saveResidentStyle(id);
    for (const p of [...live]) drop(p);
    ready = null; pending = prepare();
    return style;
  }
  pending = prepare();
  return { update, hide, setStyle, style: () => style, ready: () => !!ready, wearing: () => live.size, whenReady: () => pending.then(() => !!ready) };
}
