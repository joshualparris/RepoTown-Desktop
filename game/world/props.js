// Procedural prop library. Each prop is authored around its own origin, facing +z
// (towards the room centre when placed against a wall), resting on y = 0.
// `w`/`d` is the collision footprint; `label` is the generic public name used when a
// brief's own label must be withheld (private repositories).
// `o.c` is the brief's colour override, `o.a` its accent, `o.key` the interaction key
// that animated parts respond to.

import { GENERIC_BUSINESS_PROPS } from './generic-business-props.js';
const WOOD = 0x8a6545, DARK = 0x3b3f46, METAL = 0x9aa3ad, WHITE = 0xe9e6dd, SCREEN = 0x56c8e8, GREEN = 0x5d9a55, RED = 0xb8504a, GOLD = 0xd8b44a;

const P = {};
const def = (type, label, w, d, build, extra = {}) => { P[type] = { type, label, w, d, build, solid: true, ...extra }; };
const dyn = (b, o, kind, color, s, pos, type, more = {}) =>
  b.dynamic(kind, color, s[0], s[1], s[2], pos[0], pos[1], pos[2], { type, key: o.key, ...more });

// ── Furniture ──────────────────────────────────────────────────────────────
def('desk', 'Desk', 1.8, 0.9, (b, o) => {
  b.block(o.c || WOOD, 1.8, 0.08, 0.9, 0, 0.72, 0);
  for (const x of [-0.8, 0.8]) b.block(o.c || WOOD, 0.08, 0.72, 0.8, x, 0, 0);
});
def('table', 'Table', 1.6, 1.0, (b, o) => {
  if (b.model('table_medium_long', 0, 0, 0, 0, { w: 1.6, d: 1.0, h: 0.76, color: o.c, tint: 0.25 })) return;
  b.block(o.c || WOOD, 1.6, 0.08, 1.0, 0, 0.74, 0);
  for (const x of [-0.7, 0.7]) for (const z of [-0.4, 0.4]) b.block(o.c || WOOD, 0.08, 0.74, 0.08, x, 0, z);
});
def('roundTable', 'Round table', 1.3, 1.3, (b, o) => { b.cyl(o.c || WOOD, 0.65, 0.07, 0, 0.75, 0); b.cyl(DARK, 0.08, 0.72, 0, 0.36, 0); b.cyl(DARK, 0.35, 0.04, 0, 0.02, 0); });
def('chair', 'Chair', 0.6, 0.6, (b, o) => {
  if (b.model(o.c ? 'chair_B_wood' : 'chair_A_wood', 0, 0, 0, 0, { w: 0.5, d: 0.52, h: 0.92, color: o.c, tint: 0.3 })) return;
  b.block(o.c || WOOD, 0.5, 0.06, 0.5, 0, 0.45, 0); b.block(o.c || WOOD, 0.5, 0.55, 0.06, 0, 0.5, -0.22);
  for (const x of [-0.2, 0.2]) for (const z of [-0.2, 0.2]) b.block(DARK, 0.05, 0.45, 0.05, x, 0, z);
}, { solid: false });
def('sofa', 'Sofa', 2.2, 0.9, (b, o) => { if (b.model('couch_pillows', 0, 0, 0, 0, { w: 2.2, d: 0.95, h: 0.86, color: o.c, tint: 0.2 })) return; const c = o.c || 0x6a7fa8; b.block(c, 2.2, 0.45, 0.9, 0, 0, 0); b.block(c, 2.2, 0.5, 0.25, 0, 0.45, -0.32); for (const x of [-1, 1]) b.block(c, 0.22, 0.3, 0.9, x, 0.45, 0); });
def('bed', 'Bed', 1.6, 2.1, (b, o) => { if (b.model('bed_double_A', 0, 0, 0, 0, { w: 1.6, d: 2.1, h: 0.72, color: o.c, tint: 0.15 })) return; b.block(WOOD, 1.6, 0.4, 2.1, 0, 0, 0); b.block(WHITE, 1.5, 0.15, 2.0, 0, 0.4, 0); b.block(o.c || 0x7d93c4, 1.5, 0.08, 1.3, 0, 0.55, 0.35); b.block(WHITE, 0.6, 0.12, 0.35, -0.35, 0.55, -0.75); b.block(WHITE, 0.6, 0.12, 0.35, 0.35, 0.55, -0.75); b.block(WOOD, 1.6, 0.7, 0.08, 0, 0.4, -1.03); });
def('bookshelf', 'Bookshelf', 1.6, 0.45, (b, o) => {
  b.block(o.c || 0x6e4e33, 1.6, 2.2, 0.4, 0, 0, -0.02);
  const cols = [0x446a7b, 0x967a42, 0x8d5365, 0x4f7d55, 0xc9b27c, 0x6b5c94];
  for (let s = 0; s < 4; s++) for (let i = 0; i < 9; i++) b.block(cols[(i * 7 + s * 3) % 6], 0.13, 0.36 + ((i + s) % 3) * 0.04, 0.3, -0.66 + i * 0.165, 0.12 + s * 0.52, 0.06);
});
def('cabinet', 'Cabinet', 1.0, 0.5, (b, o) => { if (b.model('cabinet_small', 0, 0, 0, 0, { w: 1.0, d: 0.5, h: 1.0, color: o.c, tint: 0.25 })) return; b.block(o.c || 0x7b6a58, 1.0, 1.2, 0.5, 0, 0, 0); b.box(DARK, 0.9, 0.02, 0.02, 0, 0.6, 0.26); b.box(GOLD, 0.06, 0.06, 0.04, 0.1, 0.9, 0.27); });
def('counter', 'Counter', 2.4, 0.7, (b, o) => { b.block(o.c || 0x9c8062, 2.4, 0.9, 0.7, 0, 0, 0); b.block(o.a || 0xe0d6bd, 2.5, 0.06, 0.75, 0, 0.9, 0); });
def('bench', 'Bench', 1.8, 0.5, (b, o) => { b.block(o.c || WOOD, 1.8, 0.08, 0.45, 0, 0.42, 0); for (const x of [-0.75, 0.75]) b.block(DARK, 0.08, 0.42, 0.4, x, 0, 0); }, { solid: false });
// Three concentric rug fabrics have progressively higher top surfaces so mobile depth buffers never z-fight.
def('rug', 'Rug', 2.6, 1.8, (b, o) => { const e = b.matrix?.elements || [], pick = Math.abs(Math.round((e[12] || 0) * 7 + (e[14] || 0) * 3)) % 4; if (b.model?.(['rug_rectangle_A', 'rug_oval_A', 'rug_rectangle_stripes_A', 'rug_oval_B'][pick], 0, 0.012, 0, 0, { w: 2.6, d: 1.8, h: 0.03, color: o.c, tint: 0.55 })) return; b.block(o.c || 0xa45d4f, 2.6, 0.02, 1.8, 0, 0.012, 0); b.block(o.a || GOLD, 2.2, 0.02, 1.4, 0, 0.030, 0); b.block(o.c || 0xa45d4f, 1.8, 0.02, 1.0, 0, 0.048, 0); }, { solid: false });
def('lamp', 'Lamp', 0.5, 0.5, (b, o) => { if (b.model('lamp_standing', 0, 0, 0, 0, { w: 0.42, d: 0.42, h: 1.6 })) { dyn(b, o, 'cone', o.c || 0xf5dfa0, [0.3, 0.26, 0.3], [0, 1.42, 0], 'glow', { emissive: true, always: !o.key }); return; } b.cyl(DARK, 0.2, 0.04, 0, 0.02, 0); b.cyl(DARK, 0.03, 1.5, 0, 0.75, 0); dyn(b, o, 'cone', o.c || 0xf5dfa0, [0.5, 0.4, 0.5], [0, 1.55, 0], 'glow', { emissive: true, always: !o.key }); }, { solid: false });
def('plant', 'Plant', 0.6, 0.6, (b, o) => { const e = b.matrix.elements; if (Math.abs(Math.round(e[12] + e[14] * 5)) % 3 === 0 && b.model('cactus_medium_A', 0, 0, 0, 0, { w: 0.5, d: 0.5, h: 0.6 })) return; b.cyl(0xa0624a, 0.22, 0.4, 0, 0.2, 0); for (let i = 0; i < 5; i++) b.ball(o.c || GREEN, 0.22, Math.cos(i * 1.3) * 0.18, 0.6 + (i % 3) * 0.18, Math.sin(i * 1.3) * 0.18); }, { solid: false });
def('pottedTree', 'Potted tree', 0.9, 0.9, (b, o) => { b.cyl(0x8c5a3c, 0.35, 0.55, 0, 0.27, 0); b.cyl(WOOD, 0.07, 1.4, 0, 1.2, 0); b.ball(o.c || 0x4e8a46, 0.6, 0, 2.1, 0); b.ball(o.c || 0x4e8a46, 0.42, 0.3, 1.8, 0.1); });
def('fireplace', 'Fireplace', 1.8, 0.6, (b, o) => { b.block(o.c || 0x8d7d6e, 1.8, 1.4, 0.6, 0, 0, -0.1); b.block(0x2a2420, 1.0, 0.75, 0.3, 0, 0, 0.12); b.block(o.c || 0x8d7d6e, 2.0, 0.12, 0.7, 0, 1.4, -0.1); dyn(b, o, 'cone', 0xff8a2b, [0.45, 0.5, 0.3], [0, 0.3, 0.15], 'glow', { emissive: true, always: !o.key }); });
def('piano', 'Piano', 1.6, 0.7, (b, o) => { b.block(o.c || 0x1f1d22, 1.6, 1.3, 0.55, 0, 0, -0.1); b.block(o.c || 0x1f1d22, 1.6, 0.1, 0.35, 0, 0.75, 0.3); for (let i = 0; i < 14; i++) b.block(WHITE, 0.1, 0.03, 0.2, -0.68 + i * 0.105, 0.85, 0.33); for (let i = 0; i < 9; i++) b.block(0x111111, 0.06, 0.04, 0.12, -0.6 + i * 0.15, 0.88, 0.28); b.block(DARK, 0.9, 0.45, 0.4, 0, 0, 0.75); });
def('clock', 'Grandfather clock', 0.6, 0.4, (b, o) => { b.block(o.c || 0x5b3d26, 0.6, 2.1, 0.4, 0, 0, 0); b.cyl(WHITE, 0.22, 0.04, 0, 1.75, 0.21, Math.PI / 2); dyn(b, o, 'box', GOLD, [0.05, 0.5, 0.03], [0, 0.9, 0.21], 'slide', { amount: 0.1, always: true }); });
def('wardrobe', 'Wardrobe', 1.4, 0.6, (b, o) => { b.block(o.c || 0x7a5a3c, 1.4, 2.2, 0.6, 0, 0, 0); b.box(DARK, 0.02, 2.0, 0.02, 0, 1.1, 0.31); });
def('stool', 'Stool', 0.45, 0.45, (b, o) => { b.cyl(o.c || RED, 0.2, 0.06, 0, 0.7, 0); b.cyl(METAL, 0.03, 0.7, 0, 0.35, 0); }, { solid: false });
def('shelf', 'Wall shelf', 1.4, 0.35, (b, o) => { if (b.model('shelf_B_large_decorated', 0, 1.05, 0.02, 0, { w: 1.4, d: 0.32, h: 0.6 })) { b.model('shelf_B_small_decorated', 0, 1.75, 0.02, 0, { w: 0.9, d: 0.3, h: 0.5 }); return; } for (let s = 0; s < 3; s++) b.block(o.c || WOOD, 1.4, 0.05, 0.3, 0, 0.8 + s * 0.5, 0); for (let i = 0; i < 5; i++) b.block([RED, GOLD, SCREEN, GREEN, WHITE][i], 0.18, 0.22, 0.18, -0.5 + i * 0.25, 0.85 + (i % 3) * 0.5, 0); });

// ── Technology ─────────────────────────────────────────────────────────────
def('computer', 'Computer', 1.2, 0.7, (b, o) => {
  P.desk.build(b, { c: o.c || 0x6f665b });
  b.block(DARK, 0.9, 0.55, 0.06, 0, 0.9, -0.15); dyn(b, o, 'box', o.a || SCREEN, [0.82, 0.47, 0.02], [0, 1.175, -0.11], 'glow', { emissive: true, always: !o.key });
  b.block(DARK, 0.6, 0.03, 0.2, 0, 0.8, 0.15);
});
def('monitorWall', 'Monitor wall', 2.6, 0.4, (b, o) => {
  b.block(DARK, 2.6, 0.1, 0.3, 0, 0, 0);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { b.box(DARK, 0.82, 0.52, 0.06, -0.86 + i * 0.86, 1.2 + r * 0.56, 0); dyn(b, o, 'box', [o.a || SCREEN, 0x7ee08a, 0xf2c14e][(i + r) % 3], [0.76, 0.46, 0.02], [-0.86 + i * 0.86, 1.2 + r * 0.56, 0.04], 'glow', { emissive: true, always: !o.key }); }
  b.block(DARK, 0.1, 0.95, 0.1, 0, 0.1, 0);
});
def('serverRack', 'Server rack', 0.8, 0.9, (b, o) => {
  b.block(o.c || 0x2b313a, 0.8, 2.1, 0.9, 0, 0, 0);
  for (let i = 0; i < 8; i++) { b.box(0x444c57, 0.7, 0.18, 0.02, 0, 0.25 + i * 0.23, 0.46); dyn(b, o, 'box', i % 3 ? 0x6cf08a : 0xf2a33a, [0.05, 0.05, 0.02], [0.28, 0.25 + i * 0.23, 0.475], 'blink', { emissive: true, always: !o.key }); }
});
def('laptop', 'Laptop', 0.9, 0.6, (b, o) => { P.table.build(b, { c: o.c || 0x786a5a }); b.box(METAL, 0.45, 0.02, 0.32, 0, 0.8, 0.05); b.box(METAL, 0.45, 0.3, 0.02, 0, 0.95, -0.11, 0); dyn(b, o, 'box', o.a || SCREEN, [0.4, 0.25, 0.01], [0, 0.95, -0.095], 'glow', { emissive: true, always: !o.key }); }, { w: 1.6, d: 1.0 });
def('phoneStand', 'Phone display', 0.6, 0.6, (b, o) => { b.block(DARK, 0.5, 1.0, 0.5, 0, 0, 0); b.box(0x222222, 0.22, 0.42, 0.03, 0, 1.25, 0, 0); dyn(b, o, 'box', o.a || SCREEN, [0.19, 0.37, 0.01], [0, 1.25, 0.02], 'glow', { emissive: true, always: !o.key }); });
def('terminal', 'Terminal', 0.8, 0.7, (b, o) => { b.block(o.c || 0x5c6670, 0.8, 1.0, 0.6, 0, 0, 0); b.box(o.c || 0x5c6670, 0.8, 0.6, 0.3, 0, 1.25, -0.1); dyn(b, o, 'box', o.a || 0x4ef08a, [0.6, 0.42, 0.02], [0, 1.25, 0.06], 'glow', { emissive: true, always: !o.key }); b.box(DARK, 0.7, 0.05, 0.3, 0, 1.0, 0.2); });
def('printer3d', '3D printer', 0.9, 0.9, (b, o) => { b.block(DARK, 0.9, 0.08, 0.9, 0, 0, 0); for (const x of [-0.4, 0.4]) b.block(METAL, 0.06, 1.2, 0.06, x, 0, -0.4); b.block(METAL, 0.9, 0.06, 0.06, 0, 1.2, -0.4); dyn(b, o, 'box', o.a || 0xf28f3b, [0.12, 0.12, 0.12], [0, 0.95, -0.3], 'slide', { amount: 0.3 }); b.block(o.a || 0xf28f3b, 0.3, 0.3, 0.3, 0, 0.08, 0); });
def('robotArm', 'Robot arm', 1.0, 1.0, (b, o) => { b.cyl(DARK, 0.35, 0.3, 0, 0.15, 0); const c = o.c || 0xf2a33a; dyn(b, o, 'cyl', c, [0.2, 1.0, 0.2], [0, 0.8, 0], 'spin', { speed: 1.2 }); b.box(c, 0.16, 0.9, 0.16, 0.3, 1.5, 0, 0); b.ball(DARK, 0.15, 0.3, 2.0, 0); });
def('drone', 'Drone', 0.9, 0.9, (b, o) => { P.table.build(b, { c: 0x6c6c6c }); dyn(b, o, 'box', o.c || DARK, [0.6, 0.08, 0.6], [0, 1.1, 0], 'bob', { amount: 0.15 }); for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) b.cyl(METAL, 0.12, 0.02, x, 1.17, z); }, { w: 1.6, d: 1.0 });
def('satelliteDish', 'Satellite dish', 1.2, 1.2, (b, o) => { b.cyl(METAL, 0.06, 1.2, 0, 0.6, 0); b.add('sphere', o.c || WHITE, 1.2, 0.4, 1.2, 0, 1.3, 0.1, -0.7); b.cyl(DARK, 0.03, 0.5, 0, 1.4, 0.35, -0.7); });
def('antenna', 'Antenna mast', 0.6, 0.6, (b, o) => { b.cyl(METAL, 0.05, 2.6, 0, 1.3, 0); for (let i = 0; i < 4; i++) b.box(METAL, 0.7 - i * 0.12, 0.03, 0.03, 0, 1.4 + i * 0.35, 0); dyn(b, o, 'sphere', 0xff4040, [0.1, 0.1, 0.1], [0, 2.65, 0], 'blink', { emissive: true, always: true }); }, { solid: false });
def('solarPanel', 'Solar panel', 1.6, 1.0, (b, o) => { b.block(METAL, 0.08, 0.6, 0.08, 0, 0, 0); b.add('box', o.c || 0x22406a, 1.6, 0.05, 1.0, 0, 0.75, 0, -0.5); });
def('battery', 'Battery bank', 1.2, 0.6, (b, o) => { for (let i = 0; i < 3; i++) { b.block(o.c || 0x3d6f9e, 0.35, 1.0, 0.5, -0.4 + i * 0.4, 0, 0); dyn(b, o, 'box', 0x6cf08a, [0.2, 0.08, 0.02], [-0.4 + i * 0.4, 0.8, 0.26], 'blink', { emissive: true, always: !o.key }); } });
def('circuitBoard', 'Circuit board table', 1.6, 1.0, (b, o) => { P.table.build(b, { c: 0x5e5446 }); b.box(o.c || 0x1f7a4d, 1.2, 0.03, 0.7, 0, 0.8, 0); for (let i = 0; i < 6; i++) b.box(i % 2 ? DARK : GOLD, 0.15, 0.06, 0.12, -0.4 + (i % 3) * 0.4, 0.83, -0.15 + Math.floor(i / 3) * 0.3); });
def('workbench', 'Workbench', 2.2, 0.9, (b, o) => {
  b.block(o.c || 0x8b6d4b, 2.2, 0.1, 0.9, 0, 0.85, 0); for (const x of [-1, 1]) b.block(DARK, 0.1, 0.85, 0.8, x, 0, 0);
  b.block(DARK, 2.0, 0.05, 0.7, 0, 0.3, 0); b.block(RED, 0.4, 0.2, 0.25, -0.6, 0.95, 0.1); b.cyl(METAL, 0.05, 0.4, 0.3, 0.97, 0.1, 0, Math.PI / 2); b.block(0x2e5c8a, 0.5, 0.08, 0.3, 0.6, 0.95, -0.1);
});
def('toolWall', 'Tool wall', 2.0, 0.2, (b, o) => { b.block(o.c || 0xc9b48f, 2.0, 1.4, 0.06, 0, 0.8, -0.05); const t = [RED, METAL, 0x2e5c8a, GOLD, DARK]; for (let i = 0; i < 10; i++) b.box(t[i % 5], 0.08, 0.35 + (i % 3) * 0.12, 0.05, -0.85 + i * 0.19, 1.5 - (i % 2) * 0.55, 0.02); }, { solid: false });
def('partsBins', 'Parts bins', 1.4, 0.5, (b, o) => { b.block(DARK, 1.4, 1.6, 0.45, 0, 0, 0); for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) b.box([o.c || 0x2e7cc4, RED, GOLD, GREEN][(r + i) % 4], 0.28, 0.25, 0.1, -0.48 + i * 0.32, 0.25 + r * 0.38, 0.22); });
def('oscilloscope', 'Oscilloscope bench', 1.6, 1.0, (b, o) => { P.table.build(b, { c: 0x66615a }); b.block(o.c || 0xc9c3b2, 0.6, 0.35, 0.4, -0.3, 0.78, -0.1); dyn(b, o, 'box', 0x6cf08a, [0.3, 0.2, 0.01], [-0.35, 0.97, 0.105], 'glow', { emissive: true, always: !o.key }); b.block(RED, 0.25, 0.2, 0.3, 0.45, 0.78, 0); });
def('router', 'Network switch', 0.8, 0.5, (b, o) => { b.block(o.c || 0x2b313a, 0.8, 0.9, 0.5, 0, 0, 0); for (let i = 0; i < 8; i++) dyn(b, o, 'box', 0x6cf08a, [0.04, 0.04, 0.02], [-0.3 + i * 0.085, 0.75, 0.26], 'blink', { emissive: true, always: true }); for (let i = 0; i < 4; i++) b.box([0x2e7cc4, GOLD, RED, GREEN][i], 0.04, 0.6, 0.04, -0.25 + i * 0.16, 1.2, -0.15); });
def('hologram', 'Hologram table', 1.4, 1.4, (b, o) => { b.cyl(DARK, 0.7, 0.8, 0, 0.4, 0); b.cyl(o.a || SCREEN, 0.6, 0.03, 0, 0.82, 0); dyn(b, o, 'sphere', o.c || SCREEN, [0.7, 0.7, 0.7], [0, 1.45, 0], 'spin', { emissive: true, speed: 1 }); });
def('robot', 'Robot', 0.8, 0.8, (b, o) => { const c = o.c || 0xb9c2cc; b.block(c, 0.6, 0.8, 0.4, 0, 0.6, 0); b.block(c, 0.45, 0.4, 0.35, 0, 1.45, 0); for (const x of [-0.15, 0.15]) { b.block(DARK, 0.15, 0.6, 0.15, x, 0, 0); dyn(b, o, 'sphere', SCREEN, [0.1, 0.1, 0.05], [x, 1.68, 0.18], 'glow', { emissive: true, always: true }); } for (const x of [-0.4, 0.4]) b.block(c, 0.12, 0.6, 0.12, x, 0.8, 0); b.cyl(METAL, 0.02, 0.25, 0, 1.97, 0); });
def('consolePanel', 'Control console', 2.0, 0.9, (b, o) => {
  b.block(o.c || 0x39424f, 2.0, 0.9, 0.8, 0, 0, 0); b.add('box', o.c || 0x39424f, 2.0, 0.08, 0.7, 0, 1.0, 0.05, -0.45);
  for (let i = 0; i < 10; i++) dyn(b, o, 'box', [0x6cf08a, 0xf2a33a, 0xff5050, SCREEN][i % 4], [0.1, 0.04, 0.1], [-0.8 + i * 0.18, 1.03, 0.1 - (i % 2) * 0.15], 'blink', { emissive: true, always: !o.key });
});
def('projector', 'Projector screen', 2.6, 0.4, (b, o) => { b.block(DARK, 0.06, 2.2, 0.06, -1.3, 0, 0); b.block(DARK, 0.06, 2.2, 0.06, 1.3, 0, 0); dyn(b, o, 'box', o.c || 0xf1f1e8, [2.5, 1.5, 0.03], [0, 1.4, 0], 'glow', { emissive: true }); });
def('tv', 'Television', 1.6, 0.5, (b, o) => { b.block(WOOD, 1.6, 0.5, 0.45, 0, 0, 0); b.box(0x111111, 1.4, 0.82, 0.06, 0, 1.0, -0.1); dyn(b, o, 'box', o.a || SCREEN, [1.3, 0.72, 0.02], [0, 1.0, -0.065], 'glow', { emissive: true }); });
def('arcadeCabinet', 'Arcade cabinet', 0.8, 0.8, (b, o) => { const c = o.c || 0x6a3fb0; b.block(c, 0.8, 1.9, 0.75, 0, 0, 0); b.block(DARK, 0.7, 0.5, 0.05, 0, 1.15, 0.36); dyn(b, o, 'box', o.a || 0x6cf0e0, [0.62, 0.42, 0.02], [0, 1.4, 0.39], 'glow', { emissive: true, always: true }); b.add('box', c, 0.8, 0.12, 0.35, 0, 0.98, 0.45, 0.3); b.ball(RED, 0.05, -0.15, 1.08, 0.5); b.ball(GOLD, 0.04, 0.12, 1.06, 0.52); });
def('pinball', 'Pinball machine', 0.8, 1.6, (b, o) => { const c = o.c || 0xc04a8a; b.add('box', c, 0.75, 0.3, 1.5, 0, 0.95, 0, 0.12); for (const x of [-0.3, 0.3]) for (const z of [-0.6, 0.6]) b.block(METAL, 0.05, 0.85, 0.05, x, 0, z); b.block(c, 0.75, 0.8, 0.1, 0, 1.1, -0.75); dyn(b, o, 'sphere', METAL, [0.1, 0.1, 0.1], [0, 1.15, 0], 'slide', { amount: 0.25, always: true }); });
def('speaker', 'Speaker', 0.6, 0.5, (b, o) => { b.block(o.c || 0x26282c, 0.6, 1.2, 0.5, 0, 0, 0); b.cyl(0x555a60, 0.2, 0.03, 0, 0.45, 0.26, Math.PI / 2); b.cyl(0x555a60, 0.1, 0.03, 0, 0.95, 0.26, Math.PI / 2); });
def('microphone', 'Microphone', 0.5, 0.5, (b, o) => { b.cyl(DARK, 0.2, 0.03, 0, 0.02, 0); b.cyl(METAL, 0.02, 1.5, 0, 0.75, 0); b.ball(o.c || 0x777777, 0.08, 0, 1.55, 0, 1.4); }, { solid: false });
def('nfcReader', 'NFC tag reader', 0.6, 0.6, (b, o) => { b.block(o.c || 0xdedad0, 0.5, 1.0, 0.5, 0, 0, 0); b.box(DARK, 0.35, 0.03, 0.35, 0, 1.02, 0); dyn(b, o, 'torus', o.a || SCREEN, [0.3, 0.3, 0.3], [0, 1.08, 0], 'glow', { emissive: true }); });
def('radio', 'Radio', 0.9, 0.5, (b, o) => { P.cabinet.build(b, { c: o.c || 0x8d6c4c }); b.block(o.c || 0x6e4d30, 0.7, 0.4, 0.3, 0, 1.2, 0); b.cyl(GOLD, 0.1, 0.03, -0.15, 1.4, 0.16, Math.PI / 2); b.cyl(METAL, 0.01, 0.6, 0.25, 1.9, 0); });
def('vinyl', 'Record player', 1.0, 0.6, (b, o) => { P.cabinet.build(b, { c: o.c || 0x5a3e2b }); b.block(DARK, 0.6, 0.12, 0.45, 0, 1.2, 0); dyn(b, o, 'cyl', 0x111111, [0.38, 0.02, 0.38], [0, 1.33, 0], 'spin', { speed: 4 }); });
def('camera', 'Camera on tripod', 0.8, 0.8, (b, o) => { for (let i = 0; i < 3; i++) b.add('cyl', DARK, 0.04, 1.4, 0.04, Math.cos(i * 2.1) * 0.2, 0.68, Math.sin(i * 2.1) * 0.2, Math.sin(i * 2.1) * 0.25, 0, -Math.cos(i * 2.1) * 0.25); b.block(o.c || 0x2b2b2b, 0.3, 0.22, 0.2, 0, 1.38, 0); b.cyl(0x111111, 0.07, 0.15, 0, 1.49, 0.15, Math.PI / 2); }, { solid: false });
def('guitar', 'Guitar', 0.6, 0.5, (b, o) => { b.block(DARK, 0.4, 0.05, 0.3, 0, 0, 0); b.ball(o.c || 0xb5651d, 0.25, 0, 0.45, 0, 1.3); b.ball(o.c || 0xb5651d, 0.18, 0, 0.8, 0, 1.2); b.box(0x3a2a1a, 0.06, 0.7, 0.04, 0, 1.3, 0); }, { solid: false });

// ── Knowledge & research ───────────────────────────────────────────────────
def('globe', 'Globe', 0.7, 0.7, (b, o) => { b.cyl(WOOD, 0.25, 0.05, 0, 0.02, 0); b.cyl(WOOD, 0.04, 0.8, 0, 0.4, 0); dyn(b, o, 'sphere', o.c || 0x3d7fc0, [0.6, 0.6, 0.6], [0, 1.1, 0], 'spin', { speed: 0.8, always: !o.key }); b.ring(GOLD, 0.33, 0, 1.1, 0, 0.4); });
def('mapTable', 'Map table', 2.0, 1.4, (b, o) => { P.table.build(b, { c: 0x6b4f35 }); b.box(o.c || 0xd9c79a, 1.9, 0.02, 1.3, 0, 0.83, 0); for (let i = 0; i < 6; i++) b.box([GREEN, 0x4a8bc2, 0xa47c4a][i % 3], 0.3 + (i % 2) * 0.2, 0.025, 0.25, -0.6 + (i % 3) * 0.6, 0.845, -0.35 + Math.floor(i / 3) * 0.6); dyn(b, o, 'cone', RED, [0.08, 0.25, 0.08], [0.2, 0.98, 0.1], 'bob', { amount: 0.08 }); }, { w: 2.0, d: 1.4 });
def('chalkboard', 'Chalkboard', 2.4, 0.3, (b, o) => { b.block(WOOD, 2.4, 1.4, 0.08, 0, 0.8, -0.05); b.block(o.c || 0x2f4a3a, 2.2, 1.2, 0.04, 0, 0.9, 0); for (let i = 0; i < 4; i++) b.box(WHITE, 1.2 - i * 0.2, 0.03, 0.01, -0.3, 1.8 - i * 0.22, 0.03); }, { solid: false });
def('corkboard', 'Cork board', 2.0, 0.2, (b, o) => { b.block(o.c || 0xb48a5a, 2.0, 1.2, 0.05, 0, 1.0, -0.05); const n = [0xf6e27a, 0xf2a6a6, 0xa6d4f2, 0xc3f2a6, WHITE]; for (let i = 0; i < 9; i++) b.box(n[i % 5], 0.3, 0.3, 0.01, -0.7 + (i % 5) * 0.35, 1.25 - Math.floor(i / 5) * 0.45 + (i % 2) * 0.06, 0); for (let i = 0; i < 3; i++) b.box(RED, 0.9, 0.01, 0.01, -0.3 + i * 0.2, 1.1 + i * 0.1, 0.01, 0.4); }, { solid: false });
def('cardCatalog', 'Card catalogue', 1.2, 0.6, (b, o) => { b.block(o.c || 0x7b5534, 1.2, 1.3, 0.55, 0, 0, 0); for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) { b.box(0x9c7350, 0.25, 0.2, 0.02, -0.42 + i * 0.28, 0.17 + r * 0.24, 0.28); b.box(GOLD, 0.06, 0.03, 0.02, -0.42 + i * 0.28, 0.17 + r * 0.24, 0.3); } });
def('lectern', 'Lectern', 0.7, 0.6, (b, o) => { b.block(o.c || 0x6a4a2e, 0.5, 1.0, 0.4, 0, 0, 0); b.add('box', o.c || 0x6a4a2e, 0.7, 0.06, 0.55, 0, 1.1, 0.05, 0.35); b.add('box', WHITE, 0.55, 0.03, 0.4, 0, 1.13, 0.06, 0.35); }, { solid: false });
def('telescope', 'Telescope', 1.0, 1.0, (b, o) => { for (let i = 0; i < 3; i++) b.add('cyl', WOOD, 0.04, 1.3, 0.04, Math.cos(i * 2.1) * 0.25, 0.62, Math.sin(i * 2.1) * 0.25, Math.sin(i * 2.1) * 0.3, 0, -Math.cos(i * 2.1) * 0.3); b.add('cyl', o.c || 0xc6a15b, 0.22, 1.5, 0.22, 0, 1.45, 0.1, 0.9); b.add('cyl', o.c || 0xc6a15b, 0.28, 0.2, 0.28, 0, 1.8, 0.6, 0.9); });
def('microscope', 'Microscope', 1.6, 1.0, (b, o) => { P.table.build(b, { c: WHITE }); b.box(DARK, 0.3, 0.05, 0.25, 0, 0.8, 0); b.add('box', o.c || 0xe0e0e0, 0.08, 0.45, 0.08, 0, 1.02, -0.08, 0.2); b.cyl(DARK, 0.05, 0.25, 0, 1.18, 0.05, 0.4); }, { w: 1.6, d: 1.0 });
def('specimenJars', 'Specimen shelf', 1.4, 0.4, (b, o) => { P.shelf.build(b, { c: o.c || WOOD }); for (let s = 0; s < 3; s++) for (let i = 0; i < 4; i++) b.cyl(o.a || 0x9fd8c8, 0.1, 0.25, -0.5 + i * 0.33, 0.95 + s * 0.5, 0.05); });
def('filingCabinet', 'Filing cabinet', 0.6, 0.7, (b, o) => { b.block(o.c || 0x8e969c, 0.6, 1.4, 0.7, 0, 0, 0); for (let i = 0; i < 4; i++) { b.box(0x777f86, 0.55, 0.3, 0.02, 0, 0.2 + i * 0.34, 0.36); b.box(DARK, 0.15, 0.03, 0.03, 0, 0.27 + i * 0.34, 0.38); } });
def('timelineWall', 'Timeline wall', 3.0, 0.2, (b, o) => { b.block(o.c || 0xdedbd2, 3.0, 1.4, 0.05, 0, 0.7, -0.05); b.box(DARK, 2.8, 0.04, 0.02, 0, 1.4, 0); for (let i = 0; i < 7; i++) { dyn(b, o, 'sphere', [RED, GOLD, SCREEN, GREEN][i % 4], [0.14, 0.14, 0.06], [-1.3 + i * 0.43, 1.4, 0.02], 'glow', { emissive: true }); b.box(WHITE, 0.32, 0.22, 0.01, -1.3 + i * 0.43, i % 2 ? 1.75 : 1.05, 0.01); } }, { solid: false });
def('easel', 'Easel', 0.9, 0.7, (b, o) => { b.add('box', WOOD, 0.06, 1.8, 0.06, -0.3, 0.9, 0, 0.1, 0, 0.15); b.add('box', WOOD, 0.06, 1.8, 0.06, 0.3, 0.9, 0, 0.1, 0, -0.15); b.add('box', WOOD, 0.06, 1.7, 0.06, 0, 0.85, -0.35, -0.3); b.box(WHITE, 0.8, 0.6, 0.03, 0, 1.25, 0.08); b.box(o.c || 0x6aa0d8, 0.7, 0.25, 0.01, 0, 1.15, 0.1); b.ball(o.a || GOLD, 0.08, 0.15, 1.35, 0.1); }, { solid: false });
def('pinMap', 'Pin map', 2.2, 0.2, (b, o) => { b.block(WOOD, 2.2, 1.4, 0.05, 0, 0.8, -0.05); b.box(o.c || 0xc9dfc0, 2.0, 1.2, 0.02, 0, 1.5, 0); for (let i = 0; i < 7; i++) b.box(0x6a9fd0, 0.3 + (i % 3) * 0.1, 0.2, 0.01, -0.8 + (i % 4) * 0.5, 1.2 + Math.floor(i / 4) * 0.5, 0.01); for (let i = 0; i < 6; i++) dyn(b, o, 'sphere', RED, [0.07, 0.07, 0.07], [-0.7 + i * 0.28, 1.3 + (i % 3) * 0.2, 0.04], 'blink', { emissive: true }); }, { solid: false });
def('bookStack', 'Book stacks', 1.0, 0.8, (b, o) => { for (let s = 0; s < 3; s++) for (let i = 0; i < 4 + s; i++) b.block([0x446a7b, 0x967a42, 0x8d5365, 0x4f7d55][(i + s) % 4], 0.35, 0.08, 0.25, -0.35 + s * 0.35, i * 0.08, (i % 2) * 0.05); });
def('scrollRack', 'Scroll rack', 1.4, 0.5, (b, o) => { b.block(o.c || 0x6e4e33, 1.4, 1.8, 0.45, 0, 0, 0); for (let r = 0; r < 4; r++) for (let i = 0; i < 5; i++) b.cyl(0xe8dcb5, 0.07, 0.38, -0.5 + i * 0.25, 0.25 + r * 0.42, 0.05, Math.PI / 2); });
def('archiveBoxes', 'Archive boxes', 1.6, 0.6, (b, o) => { for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) b.block(o.c || 0xb89a6c, 0.5, 0.35, 0.55, -0.52 + i * 0.52, r * 0.36, 0); for (let i = 0; i < 9; i++) b.box(WHITE, 0.2, 0.08, 0.01, -0.52 + (i % 3) * 0.52, 0.2 + Math.floor(i / 3) * 0.36, 0.28); });
def('familyTree', 'Family tree mural', 2.6, 0.2, (b, o) => { b.block(o.c || 0xe8e0c8, 2.6, 2.0, 0.05, 0, 0.3, -0.05); b.box(0x6b4a2a, 0.15, 1.2, 0.02, 0, 0.9, 0); for (let i = 0; i < 3; i++) b.box(0x6b4a2a, 1.6 - i * 0.4, 0.06, 0.02, 0, 1.3 + i * 0.3, 0); for (let i = 0; i < 9; i++) dyn(b, o, 'sphere', [GREEN, GOLD, 0x8fbf6a][i % 3], [0.2, 0.2, 0.06], [-0.8 + (i % 5) * 0.4 + (i > 4 ? 0.2 : 0), 1.3 + Math.floor(i / 5) * 0.6, 0.03], 'glow', { emissive: true }); }, { solid: false });
def('podium', 'Podium', 0.8, 0.6, (b, o) => { b.block(o.c || 0x3a5f8a, 0.8, 1.1, 0.6, 0, 0, 0); b.block(o.a || GOLD, 0.6, 0.12, 0.05, 0, 0.8, 0.31); }, {});
def('trophyCase', 'Trophy case', 1.4, 0.5, (b, o) => { b.block(WOOD, 1.4, 1.8, 0.45, 0, 0, 0); for (let s = 0; s < 3; s++) for (let i = 0; i < 3; i++) { b.cyl(o.c || GOLD, 0.08, 0.2, -0.4 + i * 0.4, 0.35 + s * 0.55, 0.05); b.ball(o.c || GOLD, 0.11, -0.4 + i * 0.4, 0.5 + s * 0.55, 0.05, 0.7); } });

// ── Food & health ──────────────────────────────────────────────────────────
def('stove', 'Stove', 1.0, 0.7, (b, o) => { b.block(o.c || 0xd9d4ca, 1.0, 0.9, 0.7, 0, 0, 0); b.box(0x222222, 0.7, 0.4, 0.02, 0, 0.45, 0.36); for (const x of [-0.25, 0.25]) for (const z of [-0.15, 0.15]) dyn(b, o, 'cyl', 0xff6a2b, [0.28, 0.02, 0.28], [x, 0.92, z], 'glow', { emissive: true }); b.cyl(METAL, 0.18, 0.2, 0.25, 1.02, 0.15); });
def('fridge', 'Fridge', 0.8, 0.7, (b, o) => { b.block(o.c || 0xeef0f2, 0.8, 1.9, 0.7, 0, 0, 0); b.box(0xcfd3d6, 0.78, 0.02, 0.02, 0, 1.3, 0.36); b.box(METAL, 0.04, 0.4, 0.04, 0.32, 1.55, 0.38); b.box(METAL, 0.04, 0.4, 0.04, 0.32, 0.85, 0.38); });
def('pantry', 'Pantry shelves', 1.6, 0.45, (b, o) => { b.block(o.c || 0xbfa27a, 1.6, 2.0, 0.42, 0, 0, 0); const f = [0xe0a33a, RED, GREEN, 0xd8c890, 0x8b5a2b, 0xf2e2b0]; for (let s = 0; s < 4; s++) for (let i = 0; i < 6; i++) (i % 2 ? b.cyl(f[(i + s) % 6], 0.08, 0.25, -0.62 + i * 0.25, 0.2 + s * 0.48, 0.08) : b.block(f[(i + s) % 6], 0.16, 0.3, 0.16, -0.62 + i * 0.25, 0.08 + s * 0.48, 0.08)); });
def('fruitBowl', 'Fruit bowl table', 1.3, 1.3, (b, o) => { P.roundTable.build(b, { c: o.c || WOOD }); b.ball(WHITE, 0.3, 0, 0.82, 0, 0.35); for (let i = 0; i < 6; i++) b.ball([RED, 0xf2a33a, GREEN, 0xe8d24a][i % 4], 0.09, Math.cos(i) * 0.15, 0.92, Math.sin(i) * 0.15); });
def('herbGarden', 'Herb planter', 1.6, 0.6, (b, o) => { b.block(o.c || 0x8a5a3a, 1.6, 0.6, 0.55, 0, 0, 0); b.block(0x4a3424, 1.5, 0.05, 0.45, 0, 0.6, 0); for (let i = 0; i < 7; i++) b.ball([0x4f9a4a, 0x6ab35a, 0x3e7d3a][i % 3], 0.13, -0.62 + i * 0.2, 0.75, (i % 2) * 0.1 - 0.05, 1.3); });
def('treadmill', 'Treadmill', 0.9, 1.8, (b, o) => { b.block(DARK, 0.8, 0.15, 1.8, 0, 0, 0); dyn(b, o, 'box', 0x444444, [0.6, 0.02, 1.4], [0, 0.17, 0], 'slide', { amount: 0.05 }); for (const x of [-0.38, 0.38]) b.block(METAL, 0.05, 1.2, 0.05, x, 0, -0.8); b.block(o.c || DARK, 0.8, 0.3, 0.15, 0, 1.2, -0.8); });
def('yogaMat', 'Yoga mat', 0.8, 1.9, (b, o) => { b.block(o.c || 0x7a5ab8, 0.7, 0.02, 1.8, 0, 0, 0); b.cyl(o.c || 0x7a5ab8, 0.1, 0.7, 0, 0.1, -0.85, 0, Math.PI / 2); }, { solid: false });
def('dumbbells', 'Weight rack', 1.4, 0.6, (b, o) => { b.block(DARK, 1.4, 0.6, 0.5, 0, 0, 0); for (let i = 0; i < 5; i++) { b.cyl(o.c || 0x444444, 0.09 + i * 0.01, 0.1, -0.55 + i * 0.27, 0.68, -0.1, 0, Math.PI / 2); b.cyl(o.c || 0x444444, 0.09 + i * 0.01, 0.1, -0.55 + i * 0.27, 0.68, 0.1, 0, Math.PI / 2); } });
def('heartMonitor', 'Heart monitor', 0.7, 0.6, (b, o) => { b.block(METAL, 0.06, 1.3, 0.06, 0, 0, 0); b.block(o.c || 0xe8e8e8, 0.6, 0.45, 0.35, 0, 1.3, 0); dyn(b, o, 'box', 0x6cf08a, [0.5, 0.3, 0.02], [0, 1.52, 0.18], 'blink', { emissive: true, always: !o.key }); b.cyl(DARK, 0.25, 0.05, 0, 0.03, 0); });
def('medicineCabinet', 'Medicine cabinet', 1.0, 0.4, (b, o) => { b.block(o.c || WHITE, 1.0, 1.0, 0.35, 0, 0.9, 0); b.box(RED, 0.3, 0.08, 0.02, 0, 1.5, 0.18); b.box(RED, 0.08, 0.3, 0.02, 0, 1.5, 0.18); }, { solid: false });
def('sleepPod', 'Sleep pod', 1.4, 2.2, (b, o) => { b.block(o.c || 0xd8dde6, 1.3, 0.5, 2.1, 0, 0, 0); b.add('sphere', 0x8fb7d9, 1.25, 0.8, 2.0, 0, 0.55, 0, 0); dyn(b, o, 'box', 0x6f7bd8, [1.0, 0.02, 0.1], [0, 0.52, 1.06], 'glow', { emissive: true, always: !o.key }); });
def('scale', 'Scales', 0.6, 0.6, (b, o) => { b.block(o.c || 0xdfe3e6, 0.5, 0.08, 0.5, 0, 0, 0); b.block(METAL, 0.06, 1.0, 0.06, 0, 0.08, -0.2); b.block(DARK, 0.35, 0.25, 0.1, 0, 1.05, -0.2); }, { solid: false });
def('waterCooler', 'Water cooler', 0.5, 0.5, (b, o) => { b.block(WHITE, 0.45, 1.0, 0.45, 0, 0, 0); b.cyl(o.c || 0x8fc7ef, 0.18, 0.45, 0, 1.25, 0); }, {});
def('coffeeMachine', 'Coffee bar', 1.4, 0.7, (b, o) => { P.counter.build(b, { c: o.c || 0x5b4130, a: 0x3a2a20 }); b.block(METAL, 0.45, 0.5, 0.35, -0.6, 0.96, -0.1); dyn(b, o, 'cyl', WHITE, [0.12, 0.12, 0.12], [-0.6, 1.05, 0.12], 'bob', { amount: 0.03 }); for (let i = 0; i < 4; i++) b.cyl(WHITE, 0.05, 0.1, 0.1 + i * 0.18, 1.01, 0.1); }, { w: 2.4, d: 0.75 });
def('cafeTable', 'Café table', 1.6, 1.6, (b, o) => { P.roundTable.build(b, { c: o.c || 0xe8e0d0 }); for (let i = 0; i < 3; i++) b.at(Math.cos(i * 2.1) * 0.95, 0, Math.sin(i * 2.1) * 0.95, -i * 2.1 + Math.PI / 2, () => P.chair.build(b, { c: o.a || 0x5a7a9a })); b.cyl(WHITE, 0.05, 0.1, 0.1, 0.83, 0); });

// ── Games & fantasy ────────────────────────────────────────────────────────
def('chessboard', 'Chess table', 1.2, 1.2, (b, o) => {
  P.table.build(b, { c: 0x5a3e2b });
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) b.box((r + f) % 2 ? 0x3a2a1a : 0xe8dcc0, 0.11, 0.02, 0.11, -0.385 + f * 0.11, 0.79, -0.385 + r * 0.11);
  for (let i = 0; i < 8; i++) { b.cyl(WHITE, 0.03, 0.09, -0.385 + i * 0.11, 0.84, 0.275); b.cyl(0x222222, 0.03, 0.09, -0.385 + i * 0.11, 0.84, -0.275); }
  dyn(b, o, 'cone', o.a || WHITE, [0.08, 0.2, 0.08], [0.055, 0.9, 0.385], 'bob', { amount: 0.1 });
}, { w: 1.6, d: 1.0 });
def('diceTable', 'Dice table', 1.6, 1.6, (b, o) => { P.roundTable.build(b, { c: o.c || 0x2e5a3a }); b.cyl(0x2a6a3a, 0.55, 0.02, 0, 0.8, 0); for (let i = 0; i < 4; i++) dyn(b, o, 'box', [RED, WHITE, 0x4a7ad8, GOLD][i], [0.12, 0.12, 0.12], [-0.25 + i * 0.17, 0.87, (i % 2) * 0.15], 'spin', { speed: 6 }); });
def('treasureChest', 'Treasure chest', 1.0, 0.6, (b, o) => { b.block(o.c || 0x7a4a24, 1.0, 0.5, 0.6, 0, 0, 0); b.add('cyl', o.c || 0x7a4a24, 0.6, 1.0, 0.6, 0, 0.5, 0, 0, 0, Math.PI / 2); for (const x of [-0.35, 0.35]) b.block(GOLD, 0.06, 0.82, 0.62, x, 0, 0); dyn(b, o, 'sphere', GOLD, [0.5, 0.2, 0.3], [0, 0.6, 0], 'glow', { emissive: true }); });
def('swordRack', 'Weapon rack', 1.4, 0.4, (b, o) => { b.block(WOOD, 1.4, 0.1, 0.3, 0, 0.1, 0); b.block(WOOD, 1.4, 0.1, 0.3, 0, 1.3, 0); for (let i = 0; i < 4; i++) { b.box(o.c || 0xc8ced6, 0.07, 1.3, 0.02, -0.5 + i * 0.33, 0.85, 0.05); b.box(GOLD, 0.25, 0.05, 0.05, -0.5 + i * 0.33, 0.3, 0.05); } }, {});
def('shield', 'Shield display', 1.0, 0.3, (b, o) => { b.add('cyl', o.c || 0x7a2a2a, 0.9, 0.08, 0.9, 0, 1.4, -0.05, Math.PI / 2); b.add('cyl', o.a || GOLD, 0.35, 0.1, 0.35, 0, 1.4, -0.02, Math.PI / 2); b.box(o.a || GOLD, 0.08, 0.8, 0.02, 0, 1.4, 0.0); }, { solid: false });
def('banner', 'Banner', 0.9, 0.2, (b, o) => { b.block(WOOD, 1.0, 0.06, 0.06, 0, 2.5, -0.05); b.box(o.c || 0x7a2a6a, 0.8, 1.6, 0.02, 0, 1.7, -0.05); b.box(o.a || GOLD, 0.35, 0.35, 0.03, 0, 1.9, -0.03); }, { solid: false });
def('throne', 'Throne', 1.2, 1.0, (b, o) => { b.block(DARK, 1.2, 0.3, 1.0, 0, 0, 0); b.block(o.c || 0x7a2a2a, 0.8, 0.15, 0.7, 0, 0.6, 0.05); b.block(o.a || GOLD, 0.9, 1.9, 0.15, 0, 0.3, -0.42); for (const x of [-0.45, 0.45]) b.block(o.a || GOLD, 0.12, 0.5, 0.7, x, 0.6, 0); b.ball(o.a || GOLD, 0.12, -0.4, 2.3, -0.42); b.ball(o.a || GOLD, 0.12, 0.4, 2.3, -0.42); });
def('crystal', 'Crystal', 0.8, 0.8, (b, o) => { b.cyl(0x6a6a7a, 0.4, 0.3, 0, 0.15, 0); dyn(b, o, 'pyramid', o.c || 0x9d7ae8, [0.45, 1.2, 0.45], [0, 0.95, 0], 'spin', { emissive: true, speed: 0.8, always: !o.key }); });
def('portal', 'Portal', 2.0, 0.6, (b, o) => { for (const x of [-0.9, 0.9]) b.block(0x6a6a7a, 0.4, 2.6, 0.5, x, 0, 0); b.block(0x6a6a7a, 2.2, 0.4, 0.5, 0, 2.6, 0); dyn(b, o, 'box', o.c || 0x7a5ae8, [1.4, 2.5, 0.06], [0, 1.3, 0], 'glow', { emissive: true, always: !o.key }); });
def('cauldron', 'Cauldron', 1.0, 1.0, (b, o) => { b.ball(0x2a2a2a, 0.5, 0, 0.45, 0, 0.8); dyn(b, o, 'cyl', o.c || 0x6cf08a, [0.75, 0.04, 0.75], [0, 0.8, 0], 'glow', { emissive: true, always: !o.key }); for (let i = 0; i < 3; i++) b.cyl(0x2a2a2a, 0.05, 0.2, Math.cos(i * 2.1) * 0.35, 0.05, Math.sin(i * 2.1) * 0.35); });
def('torch', 'Wall torch', 0.4, 0.3, (b, o) => { b.block(WOOD, 0.08, 0.6, 0.08, 0, 1.3, 0); dyn(b, o, 'cone', o.c || 0xffa23a, [0.2, 0.35, 0.2], [0, 2.05, 0], 'glow', { emissive: true, always: true }); }, { solid: false });
// A resident: the person who lives in the house and talks to visitors (src/ui/npc.js).
def('resident', 'Resident', 0.8, 0.6, (b, o) => {
  const shirt = o.c || 0x3f6fb5, legs = o.a || 0x2f3440, skin = 0xe2b48c;
  for (const x of [-0.11, 0.11]) { b.block(legs, 0.16, 0.8, 0.2, x, 0, 0); b.block(0x2a2420, 0.18, 0.08, 0.26, x, 0, 0.03); }
  b.block(shirt, 0.48, 0.62, 0.26, 0, 0.8, 0);
  for (const x of [-0.31, 0.31]) { b.block(shirt, 0.12, 0.52, 0.14, x, 0.88, 0); b.ball(skin, 0.07, x, 0.86, 0); }
  b.cyl(skin, 0.07, 0.1, 0, 1.47, 0);
  b.ball(skin, 0.17, 0, 1.68, 0);
  b.ball(0x3b2a1e, 0.175, 0, 1.75, -0.03, 0.55);
  for (const x of [-0.06, 0.06]) b.ball(0x1d1d1d, 0.025, x, 1.7, 0.155);
}, { solid: false, walker: true });
def('statue', 'Statue', 1.0, 1.0, (b, o) => { const c = o.c || 0xbab6ae; b.block(c, 0.9, 0.6, 0.9, 0, 0, 0); b.block(c, 0.4, 0.9, 0.3, 0, 0.6, 0); b.ball(c, 0.18, 0, 1.68, 0); for (const x of [-0.27, 0.27]) b.block(c, 0.12, 0.7, 0.12, x, 0.8, 0); });
def('runeStone', 'Rune stone', 0.9, 0.6, (b, o) => { b.add('box', o.c || 0x787880, 0.8, 1.8, 0.4, 0, 0.9, 0, 0, 0, 0.05); for (let i = 0; i < 4; i++) dyn(b, o, 'box', o.a || SCREEN, [0.3, 0.06, 0.02], [0, 0.6 + i * 0.3, 0.21], 'glow', { emissive: true }); });
def('armorStand', 'Armour stand', 0.7, 0.6, (b, o) => { b.cyl(WOOD, 0.3, 0.06, 0, 0.03, 0); b.cyl(WOOD, 0.04, 1.2, 0, 0.6, 0); b.block(o.c || 0x9aa3ad, 0.6, 0.7, 0.35, 0, 1.0, 0); b.ball(o.c || 0x9aa3ad, 0.17, 0, 1.92, 0); });
def('potionShelf', 'Potion shelf', 1.4, 0.4, (b, o) => { P.shelf.build(b, { c: o.c || 0x5a3e2b }); for (let s = 0; s < 3; s++) for (let i = 0; i < 5; i++) { b.ball([0x9d7ae8, 0x6cf08a, RED, SCREEN, GOLD][(i + s) % 5], 0.08, -0.5 + i * 0.25, 0.95 + s * 0.5, 0.05); b.cyl(0xe0d6bd, 0.025, 0.08, -0.5 + i * 0.25, 1.05 + s * 0.5, 0.05); } });
def('campfire', 'Campfire', 1.2, 1.2, (b, o) => { for (let i = 0; i < 8; i++) b.ball(0x7a7a7a, 0.13, Math.cos(i * 0.785) * 0.45, 0.08, Math.sin(i * 0.785) * 0.45); for (let i = 0; i < 3; i++) b.add('cyl', 0x6a4a2a, 0.08, 0.7, 0.08, 0, 0.15, 0, Math.PI / 2, i, 0); dyn(b, o, 'cone', o.c || 0xff8a2b, [0.4, 0.6, 0.4], [0, 0.45, 0], 'glow', { emissive: true, always: !o.key }); });
def('tent', 'Tent', 2.2, 2.2, (b, o) => { b.add('pyramid', o.c || 0xc87a3a, 2.2, 1.8, 2.2, 0, 0.9, 0); b.box(0x2a2420, 0.7, 1.0, 0.02, 0, 0.5, 0.8); });
def('mushroom', 'Giant mushroom', 1.0, 1.0, (b, o) => { b.cyl(0xe8e0d0, 0.15, 1.1, 0, 0.55, 0); b.ball(o.c || RED, 0.55, 0, 1.15, 0, 0.5); for (let i = 0; i < 5; i++) b.ball(WHITE, 0.07, Math.cos(i * 1.3) * 0.3, 1.32, Math.sin(i * 1.3) * 0.3); });
def('wagon', 'Wagon', 2.0, 1.2, (b, o) => { b.block(o.c || 0x8a5a3a, 1.8, 0.4, 1.0, 0, 0.5, 0); for (const x of [-0.6, 0.6]) for (const z of [-0.55, 0.55]) b.cyl(0x4a3020, 0.35, 0.08, x, 0.35, z, Math.PI / 2); b.box(0xe8dcb5, 1.6, 0.6, 0.9, 0, 1.2, 0); });
def('barrel', 'Barrels', 1.2, 0.7, (b, o) => { for (const x of [-0.32, 0.32]) { b.cyl(o.c || 0x8a5a3a, 0.3, 0.9, x, 0.45, 0); b.ring(0x3a3a3a, 0.3, x, 0.2, 0, Math.PI / 2); b.ring(0x3a3a3a, 0.3, x, 0.7, 0, Math.PI / 2); } });
def('crates', 'Crates', 1.4, 1.0, (b, o) => { const c = o.c || 0xa87e4e; b.block(c, 0.7, 0.7, 0.7, -0.35, 0, 0); b.block(c, 0.7, 0.7, 0.7, 0.36, 0, 0.1); b.block(c, 0.6, 0.6, 0.6, 0, 0.7, 0.05); }, {});
def('cardTable', 'Card table', 1.6, 1.0, (b, o) => { P.table.build(b, { c: 0x5a3e2b }); b.box(o.c || 0x2e6a4a, 1.5, 0.02, 0.9, 0, 0.79, 0); for (let i = 0; i < 6; i++) dyn(b, o, 'box', i % 2 ? WHITE : 0xf2e8d0, [0.18, 0.01, 0.26], [-0.55 + i * 0.22, 0.81, (i % 3) * 0.08 - 0.08], 'bob', { amount: 0.06 }); });
def('boardGame', 'Board game table', 1.6, 1.0, (b, o) => { P.table.build(b, { c: WOOD }); b.box(o.c || 0xe8d8a0, 1.0, 0.02, 0.8, 0, 0.79, 0); for (let i = 0; i < 12; i++) b.box([RED, 0x4a7ad8, GREEN, GOLD][i % 4], 0.12, 0.021, 0.12, -0.42 + (i % 6) * 0.17, 0.8, -0.3 + Math.floor(i / 6) * 0.6); for (let i = 0; i < 4; i++) dyn(b, o, 'cone', [RED, 0x4a7ad8, GREEN, GOLD][i], [0.07, 0.15, 0.07], [-0.2 + i * 0.13, 0.88, 0], 'bob', { amount: 0.08 }); });
def('dungeonDoor', 'Dungeon gate', 1.8, 0.4, (b, o) => { b.block(0x5a5a62, 1.8, 2.6, 0.3, 0, 0, -0.1); b.block(0x2a2420, 1.1, 2.0, 0.1, 0, 0, 0.06); for (let i = 0; i < 5; i++) b.box(o.c || 0x3a3a3a, 0.06, 2.0, 0.06, -0.4 + i * 0.2, 1.0, 0.12); }, { solid: false });
def('spaceship', 'Starship model', 1.6, 1.6, (b, o) => { b.cyl(DARK, 0.5, 0.6, 0, 0.3, 0); const c = o.c || 0xc8d0dc; dyn(b, o, 'cone', c, [0.5, 1.2, 0.5], [0, 1.4, 0], 'bob', { amount: 0.12, always: !o.key }); b.box(c, 1.2, 0.05, 0.3, 0, 1.05, 0); });
def('planetModel', 'Planetarium model', 1.4, 1.4, (b, o) => { b.cyl(DARK, 0.3, 0.8, 0, 0.4, 0); dyn(b, o, 'sphere', o.c || 0xf2a33a, [0.5, 0.5, 0.5], [0, 1.2, 0], 'spin', { speed: 0.5, always: true }); for (let i = 0; i < 3; i++) dyn(b, o, 'sphere', [SCREEN, RED, GREEN][i], [0.15, 0.15, 0.15], [0.45 + i * 0.2, 1.2, 0], 'spin', { speed: 1 + i * 0.5, always: !o.key }); });
def('reactor', 'Reactor core', 1.4, 1.4, (b, o) => { b.cyl(0x4a4f58, 0.7, 0.4, 0, 0.2, 0); for (let i = 0; i < 4; i++) b.cyl(METAL, 0.08, 2.0, Math.cos(i * 1.57) * 0.55, 1.2, Math.sin(i * 1.57) * 0.55); dyn(b, o, 'cyl', o.c || 0x5ae8f0, [0.7, 1.6, 0.7], [0, 1.2, 0], 'glow', { emissive: true, always: !o.key }); });
def('cryoPod', 'Cryo pod', 1.0, 1.0, (b, o) => { b.cyl(METAL, 0.5, 0.2, 0, 0.1, 0); dyn(b, o, 'cyl', o.c || 0x8fd8ef, [0.8, 1.9, 0.8], [0, 1.15, 0], 'glow', { emissive: true }); b.cyl(METAL, 0.5, 0.2, 0, 2.2, 0); });
def('airlock', 'Airlock door', 2.0, 0.4, (b, o) => { b.block(0x5a606a, 2.0, 2.6, 0.3, 0, 0, -0.1); dyn(b, o, 'box', o.c || 0xc8d0dc, [0.8, 2.1, 0.05], [-0.4, 1.05, 0.08], 'slide', { amount: 0.4 }); dyn(b, o, 'box', o.c || 0xc8d0dc, [0.8, 2.1, 0.05], [0.4, 1.05, 0.08], 'slide', { amount: -0.4 }); }, { solid: false });

// ── Nature & animals ───────────────────────────────────────────────────────
def('giraffe', 'Giraffe', 1.4, 0.8, (b, o) => {
  const c = o.c || 0xe0a650, s = 0x7a4a24;
  for (const x of [-0.4, 0.4]) for (const z of [-0.2, 0.2]) b.block(c, 0.1, 1.2, 0.1, x, 0, z);
  b.block(c, 1.1, 0.5, 0.5, 0, 1.2, 0); for (let i = 0; i < 6; i++) b.box(s, 0.15, 0.12, 0.52, -0.4 + i * 0.16, 1.45 - (i % 2) * 0.2, 0);
  b.add('box', c, 0.18, 1.6, 0.18, 0.5, 2.2, 0, 0, 0, -0.35); b.block(c, 0.4, 0.2, 0.2, 0.85, 2.85, 0); b.cyl(s, 0.03, 0.15, 0.75, 3.1, 0.06); b.cyl(s, 0.03, 0.15, 0.75, 3.1, -0.06);
});
def('monkey', 'Siamang on climbing frame', 1.4, 1.4, (b, o) => { for (const x of [-0.6, 0.6]) b.block(WOOD, 0.1, 2.4, 0.1, x, 0, 0); b.block(WOOD, 1.3, 0.08, 0.08, 0, 2.3, 0); b.cyl(0x8a7a5a, 0.02, 0.8, -0.2, 1.9, 0); dyn(b, o, 'sphere', o.c || 0x2a2420, [0.35, 0.4, 0.3], [0.1, 1.85, 0], 'slide', { amount: 0.3, always: !o.key }); }, {});
def('smallCreature', 'Small creature', 0.8, 0.5, (b, o) => { b.ball(o.c || 0x7a5a3a, 0.25, 0, 0.25, 0, 0.6); b.ball(o.c || 0x7a5a3a, 0.14, 0.28, 0.3, 0); b.box(o.a || 0x3a3a3a, 0.22, 0.04, 0.14, 0.45, 0.28, 0); b.box(o.c || 0x7a5a3a, 0.25, 0.04, 0.2, -0.3, 0.12, 0); }, { solid: false });
def('bird', 'Bird perch', 0.6, 0.6, (b, o) => { b.cyl(WOOD, 0.04, 1.6, 0, 0.8, 0); b.box(WOOD, 0.6, 0.04, 0.04, 0, 1.6, 0); dyn(b, o, 'sphere', o.c || 0x3a8ad8, [0.25, 0.3, 0.2], [0.1, 1.78, 0], 'bob', { amount: 0.05, always: true }); }, { solid: false });
def('aquarium', 'Aquarium', 1.8, 0.7, (b, o) => { b.block(DARK, 1.8, 0.8, 0.7, 0, 0, 0); b.block(o.c || 0x6fb7e0, 1.7, 0.9, 0.6, 0, 0.8, 0); for (let i = 0; i < 4; i++) dyn(b, o, 'sphere', [0xf2a33a, RED, GOLD, 0xf2e2b0][i], [0.18, 0.1, 0.06], [-0.5 + i * 0.3, 1.1 + (i % 2) * 0.25, 0.1], 'slide', { amount: 0.4, always: true }); b.block(GREEN, 0.1, 0.4, 0.1, -0.6, 0.8, -0.1); });
def('horse', 'Horse', 1.8, 0.7, (b, o) => { const c = o.c || 0x7a4a2a; for (const x of [-0.55, 0.55]) for (const z of [-0.18, 0.18]) b.block(c, 0.12, 0.9, 0.12, x, 0, z); b.block(c, 1.4, 0.55, 0.5, 0, 0.9, 0); b.add('box', c, 0.3, 0.8, 0.25, 0.75, 1.55, 0, 0, 0, -0.6); b.block(c, 0.45, 0.22, 0.22, 1.05, 1.8, 0); b.box(0x2a1a10, 0.06, 0.6, 0.1, -0.75, 1.0, 0); b.box(0x2a1a10, 0.5, 0.15, 0.06, 0.65, 1.8, 0, -0.6); });
def('tree', 'Tree', 1.4, 1.4, (b, o) => { b.cyl(0x6a4a2a, 0.15, 2.2, 0, 1.1, 0); b.ball(o.c || 0x4e8a46, 0.85, 0, 2.6, 0); b.ball(o.c || 0x5a9a50, 0.6, 0.5, 2.2, 0.2); b.ball(o.c || 0x467e40, 0.55, -0.45, 2.3, -0.2); }, { w: 0.6, d: 0.6 });
def('rock', 'Boulders', 1.4, 1.2, (b, o) => { b.ball(o.c || 0x8a8a8a, 0.55, 0, 0.35, 0, 0.7); b.ball(o.c || 0x7a7a7a, 0.35, 0.55, 0.22, 0.25, 0.7); });
def('pond', 'Pond', 2.4, 1.8, (b, o) => { b.add('cyl', 0x8a8a7a, 2.4, 0.15, 1.8, 0, 0.07, 0); dyn(b, o, 'cyl', o.c || 0x4a8ac8, [2.1, 0.05, 1.5], [0, 0.14, 0], 'glow', { emissive: true }); b.ball(GREEN, 0.15, 0.4, 0.18, 0.2, 0.3); });
def('fence', 'Fence', 2.4, 0.2, (b, o) => { for (let i = 0; i < 5; i++) b.block(o.c || 0xc8a87a, 0.1, 1.0, 0.1, -1.1 + i * 0.55, 0, 0); for (const y of [0.35, 0.8]) b.block(o.c || 0xc8a87a, 2.4, 0.08, 0.05, 0, y, 0); });
def('hay', 'Hay bales', 1.6, 0.8, (b, o) => { for (const x of [-0.42, 0.42]) b.block(o.c || 0xd8c070, 0.8, 0.5, 0.7, x, 0, 0); b.block(o.c || 0xd8c070, 0.8, 0.5, 0.7, 0, 0.5, 0); });
def('beehive', 'Beehives', 1.4, 0.6, (b, o) => { for (const x of [-0.4, 0.4]) { b.block(WOOD, 0.6, 0.2, 0.5, x, 0, 0); for (let i = 0; i < 3; i++) b.block(o.c || 0xf2d06a, 0.55, 0.25, 0.45, x, 0.2 + i * 0.26, 0); } dyn(b, o, 'sphere', 0x2a2a2a, [0.06, 0.06, 0.06], [0, 1.2, 0.3], 'slide', { amount: 0.5, always: true }); });
def('flowerBed', 'Flower bed', 2.0, 0.8, (b, o) => { b.block(0x8a5a3a, 2.0, 0.3, 0.8, 0, 0, 0); for (let i = 0; i < 12; i++) b.ball([RED, GOLD, 0xd87ac8, WHITE, o.c || 0x7a7ad8][i % 5], 0.1, -0.85 + (i % 6) * 0.34, 0.45, -0.2 + Math.floor(i / 6) * 0.4); }, {});

// ── Transport, trade & community ───────────────────────────────────────────
def('truck', 'Removal truck', 3.4, 1.6, (b, o) => { b.block(o.c || 0xe8e8e8, 2.4, 1.6, 1.5, -0.4, 0.4, 0); b.block(o.a || 0x2e7cc4, 0.9, 1.1, 1.5, 1.2, 0.4, 0); b.box(SCREEN, 0.05, 0.4, 1.2, 1.66, 1.2, 0); for (const x of [-1.2, 0.2, 1.2]) for (const z of [-0.75, 0.75]) b.cyl(0x222222, 0.35, 0.25, x, 0.35, z, Math.PI / 2); });
def('van', 'Service van', 2.8, 1.4, (b, o) => { b.block(o.c || 0x2e7cc4, 2.6, 1.3, 1.3, 0, 0.35, 0); b.box(SCREEN, 0.05, 0.45, 1.1, 1.31, 1.25, 0); for (const x of [-0.85, 0.85]) for (const z of [-0.65, 0.65]) b.cyl(0x222222, 0.3, 0.22, x, 0.3, z, Math.PI / 2); b.box(WHITE, 1.4, 0.3, 0.02, -0.2, 1.1, 0.66); });
def('bicycle', 'Bicycle', 1.6, 0.4, (b, o) => { for (const x of [-0.55, 0.55]) b.ring(DARK, 0.33, x, 0.35, 0, 0); b.add('box', o.c || RED, 1.0, 0.05, 0.05, 0, 0.6, 0, 0, 0, 0.1); b.add('box', o.c || RED, 0.05, 0.5, 0.05, -0.1, 0.55, 0, 0, 0, 0.3); b.box(DARK, 0.25, 0.04, 0.12, -0.15, 0.85, 0); }, { solid: false });
def('trolley', 'Hand trolley', 0.8, 0.8, (b, o) => { b.block(o.c || RED, 0.6, 0.05, 0.5, 0, 0.1, 0); b.block(o.c || RED, 0.06, 1.3, 0.06, -0.25, 0.1, -0.22); b.block(o.c || RED, 0.06, 1.3, 0.06, 0.25, 0.1, -0.22); b.block(0xa87e4e, 0.5, 0.5, 0.4, 0, 0.15, 0.02); }, { solid: false });
def('cashRegister', 'Shop counter', 2.0, 0.7, (b, o) => { P.counter.build(b, { c: o.c || 0x7a5a3a }); b.block(DARK, 0.5, 0.3, 0.4, 0.5, 0.96, 0); dyn(b, o, 'box', 0x6cf08a, [0.3, 0.1, 0.02], [0.5, 1.2, 0.21], 'glow', { emissive: true }); }, { w: 2.4, d: 0.75 });
def('safe', 'Safe', 0.8, 0.8, (b, o) => { b.block(o.c || 0x4a4f58, 0.8, 1.0, 0.8, 0, 0, 0); b.cyl(METAL, 0.15, 0.05, 0, 0.55, 0.41, Math.PI / 2); dyn(b, o, 'box', GOLD, [0.04, 0.2, 0.02], [0, 0.55, 0.44], 'spin', { speed: 3 }); });
def('coinStack', 'Coin stacks', 1.0, 0.8, (b, o) => { P.table.build(b, { c: 0x5a3e2b }); for (let i = 0; i < 5; i++) for (let j = 0; j <= i; j++) b.cyl(o.c || GOLD, 0.08, 0.03, -0.4 + i * 0.2, 0.8 + j * 0.035, 0); }, { w: 1.6, d: 1.0 });
def('chartBoard', 'Chart board', 2.0, 0.3, (b, o) => { b.block(WHITE, 2.0, 1.3, 0.05, 0, 0.8, -0.05); for (let i = 0; i < 7; i++) dyn(b, o, 'box', [GREEN, 0x4a7ad8, GOLD][i % 3], [0.18, 0.15 + ((i * 37) % 9) * 0.1, 0.02], [-0.75 + i * 0.25, 1.0 + ((i * 37) % 9) * 0.05, 0.0], 'glow', { emissive: true }); b.block(DARK, 0.06, 0.8, 0.06, 0, 0, 0); }, { solid: false });
def('piggyBank', 'Piggy bank', 0.6, 0.6, (b, o) => { b.block(WOOD, 0.5, 0.8, 0.5, 0, 0, 0); b.ball(o.c || 0xf2a6b6, 0.25, 0, 1.05, 0, 0.8); b.cyl(o.c || 0xf2a6b6, 0.08, 0.1, 0.25, 1.05, 0, 0, Math.PI / 2); });
def('ledgerDesk', 'Ledger desk', 1.8, 0.9, (b, o) => { P.desk.build(b, { c: o.c || 0x5a3e2b }); b.box(0xe8dcc0, 0.6, 0.04, 0.4, -0.3, 0.82, 0); b.box(0x2a4a2a, 0.3, 0.06, 0.4, 0.4, 0.83, 0); b.cyl(0x222222, 0.01, 0.15, 0.1, 0.85, 0.1, 0, 1.2); });
def('noticeBoard', 'Notice board', 1.6, 0.4, (b, o) => { for (const x of [-0.75, 0.75]) b.block(WOOD, 0.08, 2.0, 0.08, x, 0, 0); b.block(o.c || 0x2e5c8a, 1.5, 1.0, 0.05, 0, 0.9, 0); for (let i = 0; i < 6; i++) b.box([WHITE, 0xf6e27a, 0xa6d4f2][i % 3], 0.35, 0.3, 0.01, -0.45 + (i % 3) * 0.45, 1.15 + Math.floor(i / 3) * -0.4 + 0.2, 0.03); }, { solid: false });
def('stage', 'Stage', 3.0, 1.6, (b, o) => { b.block(o.c || 0x5a3e2b, 3.0, 0.4, 1.6, 0, 0, 0); b.block(o.a || 0x7a2a2a, 3.0, 2.4, 0.1, 0, 0.4, -0.75); for (const x of [-1.2, 1.2]) dyn(b, o, 'cone', 0xfff2c0, [0.2, 0.25, 0.2], [x, 2.7, -0.4], 'glow', { emissive: true }); }, {});
def('pews', 'Pews', 2.4, 1.6, (b, o) => { for (const z of [-0.5, 0.5]) { b.block(o.c || 0x6a4a2e, 2.4, 0.08, 0.45, 0, 0.42, z); b.block(o.c || 0x6a4a2e, 2.4, 0.5, 0.06, 0, 0.5, z - 0.22); for (const x of [-1.15, 1.15]) b.block(o.c || 0x6a4a2e, 0.08, 0.9, 0.5, x, 0, z); } });
def('candles', 'Candle stand', 0.8, 0.6, (b, o) => { b.block(o.c || GOLD, 0.7, 0.9, 0.06, 0, 0, 0); for (let i = 0; i < 5; i++) { b.cyl(WHITE, 0.04, 0.25 - (i % 2) * 0.08, -0.28 + i * 0.14, 1.0, 0); dyn(b, o, 'cone', 0xffc23a, [0.05, 0.1, 0.05], [-0.28 + i * 0.14, 1.18 - (i % 2) * 0.04, 0], 'glow', { emissive: true, always: !o.key }); } }, {});
def('flag', 'Flagpole', 0.5, 0.5, (b, o) => { b.cyl(METAL, 0.04, 3.0, 0, 1.5, 0); dyn(b, o, 'box', o.c || 0x2e7cc4, [1.0, 0.6, 0.02], [0.52, 2.65, 0], 'bob', { amount: 0.04, always: true }); }, { solid: false });
def('donationBox', 'Donation box', 0.6, 0.6, (b, o) => { b.block(WOOD, 0.4, 0.9, 0.4, 0, 0, 0); b.block(o.c || 0xc8d8e8, 0.5, 0.45, 0.5, 0, 0.9, 0); b.box(DARK, 0.25, 0.02, 0.04, 0, 1.36, 0); }, {});
def('mailbox', 'Post boxes', 1.2, 0.5, (b, o) => { b.block(o.c || RED, 1.2, 1.3, 0.45, 0, 0, 0); for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) b.box(DARK, 0.3, 0.04, 0.02, -0.38 + i * 0.38, 0.35 + r * 0.35, 0.23); });
def('balloons', 'Balloons', 0.8, 0.8, (b, o) => { b.block(DARK, 0.3, 0.2, 0.3, 0, 0, 0); for (let i = 0; i < 5; i++) { b.cyl(0xdddddd, 0.005, 1.4, Math.cos(i * 1.25) * 0.15, 0.9, Math.sin(i * 1.25) * 0.15); dyn(b, o, 'sphere', [RED, GOLD, 0x4a7ad8, GREEN, 0xd87ac8][i], [0.32, 0.4, 0.32], [Math.cos(i * 1.25) * 0.3, 1.7 + (i % 2) * 0.2, Math.sin(i * 1.25) * 0.3], 'bob', { amount: 0.08, always: true }); } }, { solid: false });
def('toyBlocks', 'Alphabet blocks', 1.2, 1.0, (b, o) => { const c = [RED, GOLD, 0x4a7ad8, GREEN, 0xd87ac8]; for (let i = 0; i < 10; i++) b.block(c[i % 5], 0.28, 0.28, 0.28, -0.45 + (i % 4) * 0.3, Math.floor(i / 4) * 0.28, (i % 2) * 0.15 - 0.1 + Math.floor(i / 4) * 0.05); }, {});
def('rockingHorse', 'Rocking horse', 1.2, 0.5, (b, o) => { b.add('cyl', WOOD, 1.2, 0.08, 0.4, 0, 0.1, 0, 0, 0, 0); b.block(o.c || 0xe8c890, 0.8, 0.35, 0.3, 0, 0.45, 0); b.add('box', o.c || 0xe8c890, 0.2, 0.5, 0.2, 0.4, 0.95, 0, 0, 0, -0.4); b.block(RED, 0.3, 0.06, 0.32, -0.05, 0.8, 0); }, {});
def('trophy', 'Trophy plinth', 0.6, 0.6, (b, o) => { b.block(DARK, 0.5, 1.0, 0.5, 0, 0, 0); b.cyl(o.c || GOLD, 0.08, 0.2, 0, 1.1, 0); dyn(b, o, 'sphere', o.c || GOLD, [0.35, 0.3, 0.35], [0, 1.35, 0], 'spin', { emissive: true, speed: 1 }); }, {});
def('lantern', 'Lantern post', 0.5, 0.5, (b, o) => { b.cyl(0x2a2a2a, 0.05, 2.2, 0, 1.1, 0); b.block(0x2a2a2a, 0.3, 0.05, 0.3, 0, 2.2, 0); dyn(b, o, 'box', o.c || 0xffd27a, [0.25, 0.35, 0.25], [0, 2.45, 0], 'glow', { emissive: true, always: true }); b.pyramid(0x2a2a2a, 0.35, 0.2, 0.35, 0, 2.72, 0); }, { solid: false });
def('ladder', 'Ladder', 0.6, 0.3, (b, o) => { for (const x of [-0.25, 0.25]) b.add('box', o.c || WOOD, 0.06, 2.6, 0.06, x, 1.3, 0, 0.15); for (let i = 0; i < 7; i++) b.box(o.c || WOOD, 0.5, 0.04, 0.05, 0, 0.3 + i * 0.33, -0.05 + i * 0.05); }, { solid: false });
def('mirror', 'Mirror', 0.9, 0.2, (b, o) => { b.block(o.c || GOLD, 0.9, 1.8, 0.05, 0, 0.3, -0.05); b.box(0xcfe3f0, 0.75, 1.6, 0.02, 0, 1.2, -0.02); }, { solid: false });
// ── Household fittings (villager homes, src/world/household.js) ─────────────
const BENCH = 0xe4ddd0, TOP = 0x8f8a82, CHROME = 0xc8ced4, TILE = 0xdfe8ec;
def('freezer', 'Chest freezer', 1.2, 0.7, (b, o) => { b.block(o.c || 0xf2f3f4, 1.2, 0.86, 0.7, 0, 0, 0); b.box(0xd6d9dc, 1.18, 0.04, 0.68, 0, 0.88, 0); b.box(CHROME, 0.3, 0.04, 0.04, 0, 0.8, 0.37); dyn(b, o, 'box', 0x6cf08a, [0.05, 0.05, 0.02], [0.5, 0.75, 0.36], 'blink', { emissive: true, always: true }); });
def('kitchenSink', 'Kitchen sink', 1.8, 0.65, (b, o) => { b.block(o.c || BENCH, 1.8, 0.88, 0.62, 0, 0, 0); b.box(TOP, 1.82, 0.04, 0.65, 0, 0.9, 0); b.box(0xb9c2c8, 0.7, 0.03, 0.42, -0.3, 0.9, 0.02); b.box(0x6d7880, 0.6, 0.02, 0.34, -0.3, 0.885, 0.02); b.cyl(CHROME, 0.025, 0.36, -0.3, 1.08, -0.24); b.cyl(CHROME, 0.02, 0.22, -0.3, 1.25, -0.14, Math.PI / 2); for (let i = 0; i < 3; i++) b.box(0x7a5a3c, 0.5, 0.02, 0.02, 0.5, 0.75 - i * 0.28, 0.32); });
def('crockery', 'Plates, bowls and cutlery', 1.2, 0.45, (b, o) => { b.block(o.c || BENCH, 1.2, 0.88, 0.45, 0, 0, 0); b.box(TOP, 1.22, 0.04, 0.47, 0, 0.9, 0); for (let i = 0; i < 6; i++) b.cyl(0xf6f4ee, 0.13, 0.02, -0.35, 0.93 + i * 0.022, 0); for (let i = 0; i < 4; i++) b.cyl(0xe8f0f6, 0.09, 0.05, 0.05 + (i % 2) * 0.2, 0.95 + Math.floor(i / 2) * 0.06, -0.05); b.cyl(0x7a8890, 0.07, 0.16, 0.42, 1.0, 0.05); for (let i = 0; i < 4; i++) b.box(CHROME, 0.015, 0.12, 0.015, 0.4 + (i % 2) * 0.03, 1.12, 0.03 + i * 0.01); b.box(0x7a5a3c, 0.4, 0.02, 0.02, 0, 0.75, 0.23); });
def('toilet', 'Toilet', 0.55, 0.75, (b, o) => { b.block(0xf8f8f6, 0.4, 0.42, 0.5, 0, 0, 0.08); b.box(0xf8f8f6, 0.44, 0.05, 0.52, 0, 0.44, 0.08); b.block(0xf8f8f6, 0.5, 0.42, 0.2, 0, 0.42, -0.25); b.box(CHROME, 0.08, 0.02, 0.05, 0.1, 0.85, -0.25); });
def('shower', 'Shower', 1.0, 1.0, (b, o) => { b.block(TILE, 1.0, 0.06, 1.0, 0, 0, 0); b.box(0xcfe3f0, 0.02, 2.0, 0.98, 0.49, 1.05, 0); b.box(0xcfe3f0, 0.98, 2.0, 0.02, 0, 1.05, 0.49); b.box(TILE, 1.0, 2.1, 0.04, 0, 1.05, -0.5); b.cyl(CHROME, 0.02, 0.5, -0.3, 1.9, -0.44); b.cyl(CHROME, 0.1, 0.03, -0.3, 2.0, -0.32); b.box(CHROME, 0.12, 0.12, 0.04, 0.1, 1.2, -0.46); }, { solid: false });
def('basin', 'Bathroom basin', 0.9, 0.5, (b, o) => { b.block(o.c || 0xe8e2d6, 0.9, 0.82, 0.48, 0, 0, 0); b.box(0xf8f8f6, 0.5, 0.06, 0.36, 0, 0.85, 0.02); b.cyl(CHROME, 0.02, 0.2, 0, 0.98, -0.18); b.box(0xcfe3f0, 0.7, 0.8, 0.02, 0, 1.6, -0.23); });
def('aircon', 'Reverse-cycle air conditioner', 1.0, 0.3, (b, o) => { b.box(0xf4f5f6, 1.0, 0.3, 0.24, 0, 2.3, -0.02); b.box(0xd8dcdf, 0.9, 0.04, 0.02, 0, 2.18, 0.11); dyn(b, o, 'box', 0x6cb8f0, [0.04, 0.04, 0.02], [0.4, 2.36, 0.11], 'blink', { emissive: true, always: true }); }, { solid: false });
def('switchboard', 'Switchboard', 0.6, 0.2, (b, o) => { b.box(0xb9bfc4, 0.55, 0.7, 0.12, 0, 1.6, -0.02); b.box(0x8d959b, 0.5, 0.65, 0.02, 0, 1.6, 0.05); for (let i = 0; i < 6; i++) b.box(i === 0 ? RED : 0x2f3338, 0.05, 0.1, 0.03, -0.17 + i * 0.07, 1.68, 0.07); }, { solid: false });
// Back yards.
def('shed', 'Garden shed', 3.0, 2.4, (b, o) => { b.block(o.c || 0x7e8b6e, 3.0, 2.1, 2.4, 0, 0, 0); b.add('box', 0x9aa3ad, 3.3, 0.06, 2.7, 0, 2.2, 0, 0.12); b.box(0x5e6a50, 0.9, 1.8, 0.04, 0.6, 0.9, 1.21); b.box(CHROME, 0.04, 0.12, 0.04, 0.9, 0.95, 1.24); });
def('mower', 'Lawn mower', 0.6, 1.4, (b, o) => { b.block(0xc33b2f, 0.55, 0.28, 0.6, 0, 0.1, 0.35); for (const x of [-0.27, 0.27]) for (const z of [0.1, 0.6]) b.cyl(0x222222, 0.1, 0.06, x, 0.1, z, 0, Math.PI / 2); b.add('box', DARK, 0.04, 0.9, 0.04, -0.22, 0.75, -0.05, -0.6); b.add('box', DARK, 0.04, 0.9, 0.04, 0.22, 0.75, -0.05, -0.6); b.box(DARK, 0.48, 0.04, 0.04, 0, 1.12, -0.33); });
def('clothesline', 'Rotary clothesline', 2.6, 2.6, (b, o) => { b.cyl(CHROME, 0.04, 2.1, 0, 1.05, 0); for (let i = 0; i < 4; i++) b.add('box', CHROME, 2.6, 0.03, 0.03, 0, 1.9, 0, 0, i * Math.PI / 4); for (const r of [0.45, 0.8, 1.15]) for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; b.add('box', 0xdddddd, r * 1.414, 0.015, 0.015, Math.cos(a) * r * 0.707, 1.91, Math.sin(a) * r * 0.707, 0, -a + Math.PI / 2); } }, { solid: false });
def('acUnit', 'Air-conditioner outdoor unit', 0.9, 0.4, (b, o) => { b.block(0xe9eaeb, 0.9, 0.65, 0.35, 0, 0.1, 0); b.cyl(0x3b3f46, 0.22, 0.02, -0.15, 0.42, 0.18, Math.PI / 2); b.block(0x9aa3ad, 0.9, 0.1, 0.35, 0, 0, 0); });
def('sprinkler', 'Garden sprinkler', 0.4, 0.4, (b, o) => { b.cyl(0x2e7d32, 0.12, 0.05, 0, 0.03, 0); b.cyl(0xd8b44a, 0.025, 0.25, 0, 0.17, 0); b.add('box', 0x2e7d32, 0.5, 0.03, 0.03, 0, 0.3, 0, 0, 0.5); }, { solid: false });
def('vegiePatch', 'Vegie patch', 2.4, 1.2, (b, o) => { b.block(0x8a6a4a, 2.4, 0.3, 1.2, 0, 0, 0); b.block(0x4a3424, 2.2, 0.04, 1.0, 0, 0.3, 0); for (let i = 0; i < 10; i++) b.ball([0x4f9a4a, 0x6ab35a, 0xd8503a][i % 3], 0.12, -0.9 + (i % 5) * 0.45, 0.42, -0.22 + Math.floor(i / 5) * 0.44); });
def('letterbox', 'Letterbox', 0.4, 0.4, (b, o) => { b.cyl(0x6b4a2a, 0.05, 1.0, 0, 0.5, 0); b.box(o.c || RED, 0.34, 0.3, 0.42, 0, 1.12, 0); b.box(0x222222, 0.2, 0.03, 0.02, 0, 1.18, 0.22); }, { solid: false });
def('meterBox', 'Meter box', 0.5, 0.15, (b, o) => { b.box(0xd8dcdf, 0.45, 0.6, 0.15, 0, 1.4, 0); b.box(0x9aa3ad, 0.4, 0.04, 0.16, 0, 1.15, 0); }, { solid: false });
def('washingMachine', 'Washing machine', 0.7, 0.7, (b, o) => { b.block(o.c || WHITE, 0.7, 0.9, 0.7, 0, 0, 0); b.cyl(0x8fb7d9, 0.22, 0.05, 0, 0.45, 0.36, Math.PI / 2); dyn(b, o, 'cyl', 0xc8d8e8, [0.3, 0.02, 0.3], [0, 0.45, 0.39], 'spin', { speed: 5 }); });
def('bathtub', 'Bathtub', 1.8, 0.9, (b, o) => { b.block(o.c || WHITE, 1.8, 0.6, 0.85, 0, 0, 0); b.block(0x8fc7ef, 1.6, 0.04, 0.65, 0, 0.55, 0); });
def('crib', 'Cot', 1.4, 0.8, (b, o) => { b.block(o.c || WHITE, 1.3, 0.15, 0.7, 0, 0.4, 0); for (let i = 0; i < 8; i++) for (const z of [-0.35, 0.35]) b.block(o.c || WHITE, 0.04, 0.6, 0.04, -0.6 + i * 0.17, 0.4, z); b.block(0xf2c6d6, 1.2, 0.1, 0.6, 0, 0.55, 0); });
def('sandpit', 'Sand pit', 2.0, 2.0, (b, o) => { for (const [x, z, w, d] of [[0, -0.95, 2, 0.1], [0, 0.95, 2, 0.1], [-0.95, 0, 0.1, 2], [0.95, 0, 0.1, 2]]) b.block(WOOD, w, 0.25, d, x, 0, z); b.block(o.c || 0xe8d8a0, 1.8, 0.15, 1.8, 0, 0, 0); b.cone(RED, 0.12, 0.25, 0.3, 0.25, 0.2); }, { solid: false });
def('signpost', 'Signpost', 0.8, 0.4, (b, o) => { b.cyl(WOOD, 0.05, 2.0, 0, 1.0, 0); for (let i = 0; i < 3; i++) b.add('box', o.c || 0xe8dcb5, 0.8, 0.18, 0.04, 0.2 - (i % 2) * 0.4, 1.4 + i * 0.25, 0, 0, i * 0.5 - 0.5, 0); }, { solid: false });
def('well', 'Wishing well', 1.4, 1.4, (b, o) => { b.cyl(o.c || 0x8a8a8a, 0.6, 0.7, 0, 0.35, 0); dyn(b, o, 'cyl', 0x2a5a8a, [1.0, 0.02, 1.0], [0, 0.6, 0], 'glow', { emissive: true }); for (const x of [-0.55, 0.55]) b.block(WOOD, 0.08, 1.6, 0.08, x, 0.7, 0); b.add('pyramid', 0x7a3a2a, 1.6, 0.5, 1.0, 0, 2.5, 0); });
def('anvil', 'Anvil & forge', 1.6, 1.0, (b, o) => { b.block(0x5a5a62, 0.8, 0.8, 0.8, -0.4, 0, 0); dyn(b, o, 'box', o.c || 0xff6a2b, [0.6, 0.1, 0.6], [-0.4, 0.82, 0], 'glow', { emissive: true, always: !o.key }); b.block(0x6a5a4a, 0.3, 0.5, 0.3, 0.5, 0, 0); b.block(DARK, 0.6, 0.2, 0.3, 0.5, 0.5, 0); });
def('loom', 'Weaving loom', 1.6, 0.8, (b, o) => { for (const x of [-0.7, 0.7]) b.block(WOOD, 0.08, 1.6, 0.6, x, 0, 0); b.block(WOOD, 1.5, 0.08, 0.08, 0, 1.5, 0); for (let i = 0; i < 10; i++) b.box([o.c || 0xc85a5a, GOLD, 0x5a7ac8][i % 3], 0.1, 1.0, 0.02, -0.55 + i * 0.12, 0.95, 0); });
def('gearWall', 'Gear mechanism', 2.0, 0.3, (b, o) => { b.block(0x5a5048, 2.0, 2.0, 0.05, 0, 0.3, -0.05); for (let i = 0; i < 4; i++) dyn(b, o, 'torus', [GOLD, METAL, 0xb87333, GOLD][i], [0.6 - i * 0.08, 0.6 - i * 0.08, 0.6], [-0.65 + i * 0.45, 1.3 + (i % 2) * 0.45, 0.03], 'spin', { speed: i % 2 ? -1.5 : 1.5, always: !o.key }); }, { solid: false });

// Additive names only: no existing prop or bespoke geometry is replaced.
for (const [key, value] of Object.entries(GENERIC_BUSINESS_PROPS)) {
  if (P[key]) throw new Error('Generic fixture must not replace existing prop: '+key);
  P[key]=value;
}
export const PROPS = P;
export const PROP_TYPES = Object.keys(P);

// Footprint for collision/placement; some props wrap a larger base and override w/d.
export function footprint(type) {
  const p = P[type];
  return { w: p.w, d: p.d };
}

// Height of a prop's top surface in metres: what the player stands on after jumping onto it.
// Anything not listed is treated as 1 m high.
const STAND_TOP = { desk: .76, table: .76, roundTable: .76, cafeTable: .76, cardTable: .76, diceTable: .76, ledgerDesk: .8, mapTable: .85,
  bed: .6, sofa: .45, bench: .45, stool: .65, chair: .45, cabinet: .9, counter: 1.0, crates: .8, barrel: .9, stove: .9, kitchenSink: .9,
  bathtub: .6, toilet: .45, basin: .85, workbench: .9, treasureChest: .55, piano: 1.15, pews: .5, washingMachine: .9, freezer: .9,
  crib: .9, rug: .02, fireplace: 1.1, filingCabinet: 1.3, trolley: .9, hay: 1.0, bookshelf: 2.2, wardrobe: 2.2, fridge: 1.9, pantry: 2.0,
  clock: 2.1, serverRack: 2.1, arcadeCabinet: 1.9, shed: 2.3, wagon: 1.2, truck: 2.6, van: 2.2, rock: .9, cashRegister: 1.1 };
export function standTop(type) { return STAND_TOP[type] ?? 1.0; }
// Small things a player can pick up and carry (built as their own meshes, not merged).
export const PORTABLE = new Set(['lamp', 'plant', 'fruitBowl', 'bookStack', 'globe', 'guitar', 'radio', 'trophy',
  'candles', 'toyBlocks', 'laptop', 'camera', 'crates', 'coinStack', 'piggyBank', 'lantern', 'microscope', 'specimenJars', 'vinyl', 'boardGame', 'chessboard']);
