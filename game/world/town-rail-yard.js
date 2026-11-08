// Original fictional Repository Town siding and shunter. The main-line 06:40
// train, its interlockings and Narromine's real-world railway remain untouched.
import * as THREE from 'three';
import { TownRailShunting, TOWN_YARD } from './town-rail-shunting.js';

const SAVE_KEY = 'repository-town-yard-shunting-v1';
const mat = colour => new THREE.MeshLambertMaterial({ color: colour });
function block(parent, colour, w, h, d, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(colour));
  m.position.set(x, y, z); parent.add(m); return m;
}
function wheel(parent, x, z) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.18, 10), mat(0x26282a));
  w.rotation.x = Math.PI / 2; w.position.set(x, 0.51, z); parent.add(w);
}
function makeLocomotive() {
  const g = new THREE.Group(); g.name = 'Repository Town yard shunting locomotive';
  block(g, 0x263b48, 13, 0.28, 2.75, 0, 1.1, 0);
  block(g, 0x44738a, 7.4, 2.4, 2.45, 1.0, 2.36, 0);
  block(g, 0x31536b, 3.2, 2.9, 2.75, -4.4, 2.60, 0);
  for (const side of [-1, 1]) {
    block(g, 0xa8d3dc, 1.4, 1.2, 0.06, -4.2, 2.95, side * 1.40);
    block(g, 0xf2c448, 11.8, 0.15, 0.08, 0, 1.68, side * 1.41);
    for (const x of [-4.8, -3.4, 3.4, 4.8]) wheel(g, x, side * 0.78);
  }
  block(g, 0xf2c448, 0.24, 0.4, 2.75, 6.52, 1.25, 0);
  block(g, 0x202327, 2.8, 0.48, 2.0, 0.5, 0.80, 0);
  return g;
}
function makeWagon(id) {
  const g = new THREE.Group(); g.name = 'Repository Town parcel wagon ' + id;
  block(g, 0x5f666e, 9, 0.38, 2.7, 0, 1.03, 0);
  block(g, 0x9d7d5d, 8.2, 2.3, 2.55, 0, 2.2, 0);
  block(g, 0xd2cab7, 8.4, 0.22, 2.68, 0, 3.44, 0);
  for (const side of [-1, 1]) for (const x of [-3, 3]) wheel(g, x, side * 0.78);
  const load = block(g, 0xe6b34c, 2.3, 0.45, 1.7, 0, 3.77, 0);
  load.visible = false;
  return { group: g, load };
}
function sleeperMesh(parent) {
  const n = Math.floor((TOWN_YARD.east - TOWN_YARD.west) / 0.72) + 1;
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.12, 2.55), mat(0x594c42), n);
  const transform = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    transform.makeTranslation(TOWN_YARD.west + i * 0.72, 0.13, TOWN_YARD.z);
    m.setMatrixAt(i, transform);
  }
  m.name = 'Repository Town yard sleepers'; parent.add(m);
}
function readSave(storage) {
  try { return JSON.parse(storage?.getItem(SAVE_KEY) || 'null'); } catch { return null; }
}
export function createTownRailYard(parent, life, storage = typeof localStorage === 'undefined' ? null : localStorage) {
  const root = new THREE.Group(); root.name = 'Repository Town fictional shunting yard'; parent.add(root);
  const xMid = (TOWN_YARD.west + TOWN_YARD.east) / 2, length = TOWN_YARD.east - TOWN_YARD.west;
  block(root, 0x87796c, length + 1, 0.10, 4.8, xMid, 0.03, TOWN_YARD.z);
  sleeperMesh(root);
  for (const offset of [-0.7175, 0.7175])
    block(root, 0x92989c, length, 0.115, 0.095, xMid, 0.225, TOWN_YARD.z + offset);
  for (const end of [TOWN_YARD.west + 0.2, TOWN_YARD.east - 0.2]) {
    block(root, 0x383c3c, 0.4, 1.1, 3.0, end, 0.65, TOWN_YARD.z);
    block(root, 0xd1b443, 0.07, 0.2, 2.55, end + (end < xMid ? 0.24 : -0.24), 1.0, TOWN_YARD.z);
  }
  // The nearby depot actually sits in row 8. This apron is a distinct rail-side
  // loading point, not an invented portal through the existing warehouse.
  block(root, 0xbcb29a, 15, 0.65, 2.6, TOWN_YARD.depotX, 0.34, TOWN_YARD.z - 4.45);
  block(root, 0xf1c74b, 15, 0.04, 0.14, TOWN_YARD.depotX, 0.69, TOWN_YARD.z - 3.35);
  const loco = makeLocomotive(); root.add(loco);
  const cars = ['RT-Y-01', 'RT-Y-02'].map(id => makeWagon(id));
  cars.forEach(c => root.add(c.group));
  const engine = new TownRailShunting(readSave(storage));
  let driving = false, saveElapsed = 0, lastMessage = '';
  function persist() {
    try { storage?.setItem(SAVE_KEY, JSON.stringify(engine.snapshot())); } catch { /* storage unavailable */ }
  }
  function render() {
    loco.position.set(engine.x, 0, TOWN_YARD.z);
    engine.carPositions().forEach((c, i) => {
      cars[i].group.position.set(c.x, 0, TOWN_YARD.z);
      cars[i].load.visible = c.load > 0;
      cars[i].load.material.color.setHex(c.staged ? 0x79bd88 : 0xe6b34c);
    });
  }
  render();
  function cab() { return { x: engine.x - 3.6, z: TOWN_YARD.z, heading: engine.speed < -0.05 ? Math.PI : 0 }; }
  function near(pos, radius = 5.2) {
    const c = cab(); return !driving && Math.hypot(pos.x - c.x, pos.z - c.z) < radius;
  }
  function board() {
    driving = true;
    return 'Yard cab: W/S (or touch joystick) for slow traction/braking, Space emergency brake, Q couple/uncouple, R load/stage parcels, E to get out. Siding only: main-line dispatch is not yet implemented.';
  }
  function exit(player) {
    if (!engine.stopped) return 'Stop the locomotive and secure the brake before stepping down.';
    driving = false; engine.speed = 0; persist();
    player?.place(engine.x - 3.6, TOWN_YARD.z - 3.9, 0);
    return 'Shunter stopped. You step down on the north side of the siding.';
  }
  function action(kind) {
    let result;
    if (kind === 'couple') {
      result = engine.couple();
      if (!result.ok && engine.coupled) result = engine.uncouple();
    } else if (kind === 'load') {
      result = engine.stage();
      if (!result.ok) result = engine.load(life.place('depot'));
      if (result.ok && result.message.includes('staged')) life.log?.(result.message);
    } else result = { ok: false, message: 'Unknown yard control.' };
    persist(); render(); lastMessage = result.message; return result.message;
  }
  function update(dt, input) {
    if (!driving) return;
    const m = input.movement();
    input.takeLook();
    engine.advance(dt, -m.z, input.keys.has(' '));
    render();
    saveElapsed += dt;
    if (saveElapsed >= 2) { saveElapsed = 0; persist(); }
    if (engine.message && engine.message !== lastMessage) lastMessage = engine.message;
  }
  function colliders() {
    const rect = (x, half) => ({ x0: x - half, x1: x + half, z0: TOWN_YARD.z - 1.45, z1: TOWN_YARD.z + 1.45, train: true });
    return [rect(engine.x, TOWN_YARD.locoLength / 2), ...engine.carPositions().map(w => rect(w.x, TOWN_YARD.wagonLength / 2))];
  }
  return { root, engine, board, exit, near, cab, update, action, colliders,
    state: () => ({ driving, ...engine.status() }),
    get driving() { return driving; }, get message() { return lastMessage; },
    clearMessage() { lastMessage = ''; engine.message = ''; }, persist };
}
