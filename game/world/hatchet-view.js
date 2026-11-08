// The hatchet in your hands, swung like RuneScape's woodcutting loop: a slow wind-up over the
// shoulder, a fast chop into the trunk with a little recoil, then back up again; wood chips fly
// on every hit. main.js plays the thunk and rolls for logs on the impacts this reports.
import * as THREE from 'three';

export const CHOP_PERIOD = 1.2;   // seconds per swing; logs are rolled on every second swing (2.4 s)
const REST = 0.35, RAISED = -1.15, STRUCK = 1.05;
const ease = (k) => k * k * (3 - 2 * k);

export function createHatchetView(camera, scene) {
  // Pivot at the grip, so rotation swings the head in an arc.
  const pivot = new THREE.Group(); pivot.position.set(0.34, -0.36, -0.62); pivot.visible = false; camera.add(pivot);
  const wood = new THREE.MeshLambertMaterial({ color: 0x7a5232 }), steel = new THREE.MeshLambertMaterial({ color: 0x9aa2ab, emissive: 0x111418 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.5, 8), wood); handle.position.y = 0.2;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.17), steel); head.position.set(0, 0.42, -0.06);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 0.03), steel); edge.position.set(0, 0.42, -0.155);
  pivot.add(handle, head, edge); pivot.rotation.set(REST, 0.15, -0.2);

  // Wood chips: a small pool reused every hit.
  const chipMat = new THREE.MeshLambertMaterial({ color: 0xd9b98a }), chipGeo = new THREE.BoxGeometry(0.06, 0.03, 0.05);
  const chips = Array.from({ length: 10 }, () => { const m = new THREE.Mesh(chipGeo, chipMat); m.visible = false; scene.add(m); return { m, v: new THREE.Vector3(), life: 0 }; });
  function burst(at, towards) {
    for (const c of chips) {
      c.m.position.set(at.x, 1 + Math.random() * 0.3, at.z); c.m.visible = true; c.life = 0.7;
      c.v.set(towards.x * 1.5 + (Math.random() - 0.5) * 2.4, 1.6 + Math.random() * 1.6, towards.z * 1.5 + (Math.random() - 0.5) * 2.4);
    }
  }

  let started = null, lastPhase = 0;
  // chopping: true while a chop is under way; holding: the hatchet is in your hand.
  // Returns true on the frame the blade bites the trunk.
  function update(dt, t, { chopping = false, holding = false } = {}) {
    for (const c of chips) if (c.life > 0) {
      c.life -= dt; c.v.y -= 9.8 * dt; c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += dt * 12; c.m.rotation.y += dt * 9;
      if (c.life <= 0 || c.m.position.y < 0.02) { c.life = 0; c.m.visible = false; }
    }
    pivot.visible = chopping || holding;
    if (!chopping) { started = null; pivot.rotation.x += (REST + Math.sin(t * 2) * 0.02 - pivot.rotation.x) * Math.min(1, dt * 10); pivot.position.z = -0.62; return false; }
    if (started === null) { started = t; lastPhase = 0; }
    const phase = ((t - started) % CHOP_PERIOD) / CHOP_PERIOD;
    // 0-0.62 wind-up over the shoulder; 0.62-0.72 the chop; 0.72-0.85 recoil in the wood; then lift.
    pivot.rotation.x = phase < 0.62 ? REST + (RAISED - REST) * ease(phase / 0.62)
      : phase < 0.72 ? RAISED + (STRUCK - RAISED) * ease((phase - 0.62) / 0.1)
      : phase < 0.85 ? STRUCK - 0.12 * Math.sin(((phase - 0.72) / 0.13) * Math.PI)
      : STRUCK + (REST - STRUCK) * ease((phase - 0.85) / 0.15);
    pivot.position.z = -0.62 - (phase > 0.62 && phase < 0.85 ? 0.08 : 0);   // leaning into the stroke
    const impact = lastPhase < 0.72 && phase >= 0.72;
    lastPhase = phase;
    return impact;
  }
  return { update, burst, get visible() { return pivot.visible; }, get angle() { return pivot.rotation.x; } };
}
