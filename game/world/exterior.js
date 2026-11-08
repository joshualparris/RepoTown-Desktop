import { PROPS } from './props.js';
import { yardSite } from './exterior-collision.js';
import { GLASS } from './builder.js';

// Exterior architecture. Every style builds around the lot origin with the front
// door facing +z (the street). A style returns the solid footprint used for
// collision, plus the door position the town uses for the enterable doorway.
const DARK = 0x3b3f46, STONE = 0x9a958c, WOOD = 0x8a6545;

function windows(b, w, d, h, floors, color, opts = {}) {
  const per = Math.max(1, Math.floor(w / 2.6));
  for (let f = 0; f < floors; f++) {
    const y = 1.3 + f * 3;
    if (y + 1 > h) break;
    for (let i = 0; i < per; i++) {
      const x = -w / 2 + (i + 0.5) * (w / per);
      if (f === 0 && Math.abs(x - (opts.doorX || 0)) < 1.5) continue;
      b.box(color, 1.0, opts.tall ? 1.6 : 1.1, 0.08, x, y + 0.5, d / 2 + 0.03);
      b.box(0xf2f0e8, 1.15, 0.1, 0.12, x, y - 0.1, d / 2 + 0.05);
    }
    for (const s of [-1, 1]) for (let i = 0; i < Math.max(1, Math.floor(d / 3)); i++) b.box(color, 0.08, 1.1, 0.9, s * (w / 2 + 0.03), y + 0.5, -d / 2 + (i + 0.5) * (d / Math.max(1, Math.floor(d / 3))));
  }
}

// Front wall carries a door gap so the doorway reads as open when the leaf swings.
function shell(b, w, d, h, wall, doorX = 0, doorW = 1.6) {
  b.box(wall, w, h, d - 0.3, 0, h / 2, -0.15);
  const left = doorX - doorW / 2 + w / 2, right = w / 2 - (doorX + doorW / 2);
  if (left > 0) b.box(wall, left, h, 0.3, -w / 2 + left / 2, h / 2, d / 2 - 0.15);
  if (right > 0) b.box(wall, right, h, 0.3, w / 2 - right / 2, h / 2, d / 2 - 0.15);
  b.box(wall, doorW, h - 2.5, 0.3, doorX, 2.5 + (h - 2.5) / 2, d / 2 - 0.15);
  b.box(0x1e1a17, doorW, 2.5, 0.05, doorX, 1.25, d / 2 - 0.32);
}

function gable(b, w, d, h, color, overhang = 0.4) {
  const r = Math.hypot(w / 2 + overhang, w * 0.35);
  const ang = Math.atan2(w * 0.35, w / 2 + overhang);
  b.add('box', color, r, 0.18, d + overhang * 2, -(w / 2 + overhang) / 2, h + w * 0.175, 0, 0, 0, ang);
  b.add('box', color, r, 0.18, d + overhang * 2, (w / 2 + overhang) / 2, h + w * 0.175, 0, 0, 0, -ang);
  // Triangular gable ends approximated with stacked bars.
  for (let i = 0; i < 6; i++) b.box(color === 0xffffff ? 0xeeeeee : 0xd8cfc0, w * (1 - i / 6) * 0.98, w * 0.35 / 6, 0.2, 0, h + (i + 0.5) * w * 0.35 / 6, d / 2 - 0.1);
}

const door = (x = 0, w = 1.6) => ({ x, w });

export const STYLES = {
  cottage(b, s) {
    const w = 9, d = 8, h = 3.6; shell(b, w, d, h, s.walls); gable(b, w, d, h, s.roof); windows(b, w, d, h, 1, GLASS);
    b.box(s.trim, 3, 0.15, 1.6, 0, 3.0, d / 2 + 0.8); for (const x of [-1.3, 1.3]) b.cyl(s.trim, 0.08, 3.0, x, 1.5, d / 2 + 1.5);
    return { w, d, h: h + 3.2, door: door() };
  },
  townhouse(b, s) {
    const w = 8, d = 8, h = 7.2; shell(b, w, d, h, s.walls); b.box(s.roof, w + 0.6, 0.5, d + 0.6, 0, h + 0.25, 0); windows(b, w, d, h, 2, GLASS, { tall: true });
    b.box(s.trim, w + 0.2, 0.25, 0.4, 0, 3.4, d / 2 + 0.1); b.box(s.trim, 2.6, 0.12, 1.2, 0, 3.6, d / 2 + 0.6);
    for (let i = 0; i < 4; i++) b.box(s.trim, 0.06, 0.9, 0.06, -1.2 + i * 0.8, 4.0, d / 2 + 1.15);
    return { w, d, h: h + 0.5, door: door() };
  },
  tower(b, s) {
    const r = 3.6, h = 13; b.cyl(s.walls, r, h, 0, h / 2, 0); b.cone(s.roof, r + 0.6, 4.5, 0, h + 2.25, 0);
    for (let f = 0; f < 4; f++) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + f * 0.4 + 0.3; b.box(GLASS, 0.7, 1.1, 0.1, Math.sin(a) * (r + 0.02), 2 + f * 3, Math.cos(a) * (r + 0.02), a); }
    b.box(0x1e1a17, 1.6, 2.5, 0.4, 0, 1.25, r - 0.25); b.box(s.trim, 2.2, 0.3, 0.6, 0, 2.7, r + 0.1);
    return { w: r * 2, d: r * 2, h: h + 4.5, door: door(0), front: r };
  },
  dome(b, s) {
    const r = 5.2; b.cyl(s.walls, r, 2.2, 0, 1.1, 0); b.ball(s.roof, r, 0, 2.2, 0, 0.75); b.ring(s.trim, r, 0, 2.2, 0, Math.PI / 2);
    b.box(s.walls, 2.4, 2.8, 2.4, 0, 1.4, r - 0.6); b.box(s.roof, 2.6, 0.3, 2.6, 0, 2.9, r - 0.6); b.box(0x1e1a17, 1.6, 2.5, 0.05, 0, 1.25, r + 0.62);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.39; if (Math.abs(Math.sin(a)) < 0.3 && Math.cos(a) > 0) continue; b.box(GLASS, 0.9, 0.7, 0.1, Math.sin(a) * r, 1.3, Math.cos(a) * r, a); }
    return { w: r * 2, d: r * 2, h: 6.2, door: door(0), front: r + 0.6 };
  },
  warehouse(b, s) {
    const w = 13, d = 10, h = 5.5; shell(b, w, d, h, s.walls, -3.5); gable(b, w, d, h, s.roof, 0.35);
    b.box(s.trim, 4.5, 4.2, 0.12, 2.5, 2.1, d / 2 + 0.05); for (let i = 0; i < 9; i++) b.box(0x6d737a, 4.4, 0.06, 0.14, 2.5, 0.3 + i * 0.45, d / 2 + 0.1);
    b.box(s.trim, 2.4, 0.2, 1.2, -3.5, 2.8, d / 2 + 0.6);
    return { w, d, h: h + 2.5, door: door(-3.5) };
  },
  observatory(b, s) {
    const w = 10, d = 9, h = 4.2; shell(b, w, d, h, s.walls, -2); b.box(s.trim, w + 0.4, 0.3, d + 0.4, 0, h + 0.15, 0);
    b.cyl(s.walls, 2.8, 1.6, 1.5, h + 1.1, -0.8); b.ball(s.roof, 2.8, 1.5, h + 1.9, -0.8); b.box(DARK, 1.0, 2.8, 0.4, 1.5, h + 2.3, 1.2);
    b.add('cyl', 0xc6a15b, 0.35, 3, 0.35, 1.5, h + 3.4, 1.0, 0.8); windows(b, w, d, h, 1, GLASS, { doorX: -2 });
    return { w, d, h: h + 4.7, door: door(-2) };
  },
  castle(b, s) {
    const w = 12, d = 10, h = 6.5; shell(b, w, d, h, s.walls);
    for (let i = 0; i < 7; i++) b.box(s.walls, 1, 0.9, 0.6, -w / 2 + 0.5 + i * (w - 1) / 6, h + 0.45, d / 2 - 0.3);
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) { b.cyl(s.walls, 1.5, h + 3, x, (h + 3) / 2, z); b.cone(s.roof, 1.8, 3, x, h + 4.5, z); }
    b.box(s.trim, 2.2, 0.5, 0.5, 0, 2.8, d / 2 + 0.05); for (let i = 0; i < 5; i++) b.box(DARK, 0.08, 2.4, 0.08, -0.7 + i * 0.35, 1.25, d / 2 + 0.2);
    return { w: w + 2, d: d + 2, h: h + 6, door: door(), front: d / 2 + 0.2 };
  },
  cave(b, s) {
    const c = s.walls; b.ball(c, 6, 0, 1.5, -1, 0.75); b.ball(c, 3.5, -4, 1.2, 0.8, 0.8); b.ball(c, 3.2, 4.2, 1.0, 1.2, 0.8); b.ball(s.roof, 3.8, 0.5, 5, -2, 0.6);
    b.box(0x15110e, 2.4, 3.0, 2.0, 0, 1.5, 3.3); for (let i = 0; i < 5; i++) b.cone(s.trim, 0.25, 0.8, -1 + i * 0.5, 3.3, 4.3);
    for (const x of [-1.6, 1.6]) b.cyl(DARK, 0.08, 2.2, x, 1.1, 4.6);
    return { w: 12, d: 9, h: 7, door: door(0, 2.0), front: 4.6 };
  },
  greenhouse(b, s) {
    const w = 10, d = 9, h = 3.2; b.box(s.walls, w, 0.9, d, 0, 0.45, 0); for (const x of [-w / 2, -w / 4, 0, w / 4, w / 2]) for (const z of [-d / 2, d / 2]) b.box(s.trim, 0.12, h, 0.12, x, h / 2, z);
    b.box(GLASS, w - 0.2, h - 0.9, 0.06, 0, (h + 0.9) / 2, -d / 2); for (const x of [-w / 2 + 1.7, w / 2 - 1.7]) b.box(GLASS, w / 2 - 2.5, h - 0.9, 0.06, x, (h + 0.9) / 2, d / 2);
    for (const x of [-w / 2, w / 2]) b.box(GLASS, 0.06, h - 0.9, d, x, (h + 0.9) / 2, 0);
    gable(b, w, d, h, s.roof, 0.35); b.box(0x1e1a17, 1.6, 2.5, 0.05, 0, 1.25, d / 2 + 0.02);
    for (let i = 0; i < 6; i++) b.ball(0x5a9a50, 0.5, -3.6 + i * 1.45, 1.4, -3);
    return { w, d, h: h + 4.5, door: door() };
  },
  lighthouse(b, s) {
    b.cyl(s.walls, 3.6, 3, 0, 1.5, 0); for (let i = 0; i < 5; i++) b.cyl(i % 2 ? s.trim : s.walls, 2.4 - i * 0.18, 2.6, 0, 4.3 + i * 2.6, 0);
    b.cyl(GLASS, 1.6, 2, 0, 18.3, 0); b.cone(s.roof, 1.9, 1.8, 0, 20.2, 0); b.box(0x1e1a17, 1.6, 2.5, 0.4, 0, 1.25, 3.35);
    return { w: 7.2, d: 7.2, h: 21, door: door(0), front: 3.6, beacon: [0, 18.3, 0] };
  },
  barn(b, s) {
    const w = 11, d = 10, h = 4.5; shell(b, w, d, h, s.walls, 0, 2.6); gable(b, w, d, h, s.roof, 0.3);
    for (const sx of [-1, 1]) b.add('box', 0xf2efe6, 2.8, 0.15, 0.1, sx * 0.65, 1.3, d / 2 + 0.05, 0, 0, sx * 0.85);
    b.box(0xf2efe6, 3, 0.15, 0.1, 0, 2.6, d / 2 + 0.05); b.box(s.trim, 1.6, 1.2, 0.1, 0, h + 1.6, d / 2 + 0.05);
    return { w, d, h: h + 4, door: door(0, 2.6) };
  },
  pagoda(b, s) {
    const w = 8, d = 8, h = 3.3; shell(b, w, d, h, s.walls);
    for (let t = 0; t < 3; t++) { const sz = w + 2 - t * 2; b.pyramid(s.roof, sz * 1.25, 1.1, sz * 1.25, 0, h + 0.55 + t * 2.6, 0); if (t < 2) b.box(s.walls, sz - 2.5, 1.6, sz - 2.5, 0, h + 1.9 + t * 2.6, 0); }
    b.cone(s.trim, 0.3, 2, 0, h + 7.8, 0); for (const x of [-w / 2 - 0.3, w / 2 + 0.3]) b.box(s.trim, 0.35, h, 0.35, x, h / 2, d / 2 + 0.2);
    return { w, d, h: h + 9, door: door() };
  },
  modern(b, s) {
    const w = 11, d = 9, h = 3.4; shell(b, w, d, h, s.walls, -3); b.box(s.walls, 7, h, d - 1, 1.8, h * 1.5, -0.5); b.box(s.roof, w + 1, 0.25, d + 1, 0, h + 0.1, 0); b.box(s.roof, 7.6, 0.25, d - 0.4, 1.8, h * 2 + 0.1, -0.5);
    b.box(GLASS, 5.5, h - 0.6, 0.08, 1.8, h * 1.5, d / 2 - 0.95); b.box(GLASS, 5, 2.4, 0.08, 2.2, 1.6, d / 2 + 0.05);
    return { w, d, h: h * 2 + 0.3, door: door(-3) };
  },
  ship(b, s) {
    b.add('box', s.walls, 13, 3, 6, 0, 1.5, 0); b.add('cone', s.walls, 6, 4, 3, 7.5, 1.5, 0, 0, 0, -Math.PI / 2); b.box(s.trim, 13.5, 0.3, 6.2, 0, 3.1, 0);
    b.box(s.roof, 5, 2.5, 4, -2.5, 4.4, 0); for (const x of [-4.5, -1, 2.5]) b.cyl(GLASS, 0.4, 0.1, x, 1.8, 3.02, Math.PI / 2);
    b.cyl(WOOD, 0.18, 9, 2.5, 7.5, 0); b.box(0xf2efe6, 0.05, 4.5, 3.6, 2.6, 8, 0);
    b.box(0x1e1a17, 1.6, 2.4, 0.08, -2.5, 1.2, 3.02);
    return { w: 16, d: 6.4, h: 12, door: door(-2.5), front: 3.1 };
  },
  factory(b, s) {
    const w = 13, d = 10, h = 5; shell(b, w, d, h, s.walls, 3.5);
    for (let i = 0; i < 4; i++) b.add('box', s.roof, 3.4, 0.2, d, -4.8 + i * 3.25, h + 0.9, 0, 0, 0, 0.55);
    for (let i = 0; i < 4; i++) b.add('box', GLASS, 0.1, 1.6, d - 0.2, -3.5 + i * 3.25, h + 0.8, 0);
    b.cyl(s.trim, 0.7, 7, -5, h + 3.5, -3); b.cyl(s.trim, 0.55, 5, -3.2, h + 2.5, -3.5); windows(b, w, d, h, 1, GLASS, { doorX: 3.5 });
    return { w, d, h: h + 7, door: door(3.5) };
  },
  temple(b, s) {
    const w = 12, d = 10, h = 5.5; b.box(s.trim, w + 2, 0.6, d + 2, 0, 0.3, 0); b.box(s.trim, w + 1, 0.6, d + 1, 0, 0.9, 0);
    shell(b, w - 3, d - 2, h, s.walls); for (let i = 0; i < 6; i++) b.cyl(0xf2efe6, 0.35, h, -w / 2 + 0.8 + i * (w - 1.6) / 5, h / 2 + 1.2, d / 2 - 0.2);
    b.box(s.roof, w + 1, 0.5, d + 1, 0, h + 1.45, 0); b.pyramid(s.roof, w * 1.15, 2.2, d * 1.0, 0, h + 2.8, 0);
    return { w: w + 2, d: d + 2, h: h + 4, door: door(), front: d / 2 + 1 };
  },
  treehouse(b, s) {
    b.cyl(0x6a4a2a, 1.2, 9, 0, 4.5, -1); b.ball(0x4e8a46, 5, 0, 11, -1); b.ball(0x5a9a50, 3, 3.5, 9, 1); b.ball(0x467e40, 3, -3.6, 9.5, 0);
    b.box(s.walls, 7, 3, 6, 0, 6.5, 0); b.pyramid(s.roof, 8.4, 2.4, 7.4, 0, 9.2, 0); b.box(s.trim, 8, 0.25, 7.4, 0, 4.9, 0.4);
    b.box(s.walls, 3.4, 3, 2.6, 0, 1.5, 2.2); b.box(0x1e1a17, 1.6, 2.4, 0.05, 0, 1.2, 3.52); b.box(GLASS, 1.2, 1, 0.1, 2, 6.8, 3.02); b.box(GLASS, 1.2, 1, 0.1, -2, 6.8, 3.02);
    for (let i = 0; i < 6; i++) b.box(WOOD, 0.8, 0.06, 0.2, 2.8, 0.6 + i * 0.75, 3.4);
    return { w: 8, d: 7.4, h: 16, door: door(0), front: 3.5 };
  },
  bunker(b, s) {
    b.add('box', s.walls, 12, 3, 9, 0, 1.5, 0); gable(b, 12, 9, 3, s.roof, 0.2);
    b.box(s.trim, 3.4, 3.2, 1.2, 0, 1.6, 5.0); b.box(0x1e1a17, 1.8, 2.5, 0.05, 0, 1.25, 5.62); for (let i = 0; i < 4; i++) b.box(0xe8c23a, 0.4, 0.2, 0.05, -1.2 + i * 0.8, 3.0, 5.62);
    b.cyl(DARK, 0.3, 2, 4, 4.8, -1); b.cyl(DARK, 0.3, 1.5, -4, 4.5, 1);
    return { w: 12, d: 10.2, h: 6, door: door(0, 1.8), front: 5.6 };
  },
  library(b, s) {
    const w = 12, d = 10, h = 6.5; b.box(s.trim, w + 1, 0.8, d + 1, 0, 0.4, 0); shell(b, w, d, h, s.walls); windows(b, w, d, h, 2, GLASS, { tall: true });
    for (let i = 0; i < 4; i++) b.cyl(0xf2efe6, 0.4, h, -3 + i * 2, h / 2 + 0.8, d / 2 + 1.0); b.box(s.roof, 8, 0.6, 2.4, 0, h + 1.1, d / 2 + 0.6); b.pyramid(s.roof, 9, 1.6, 2.4, 0, h + 2.2, d / 2 + 0.6);
    b.box(s.roof, w + 0.6, 0.6, d + 0.6, 0, h + 0.3, 0);
    return { w: w + 1, d: d + 2.4, h: h + 3, door: door(), front: d / 2 + 1.3 };
  },
  shopfront(b, s) {
    const w = 10, d = 8, h = 6.5; shell(b, w, d, h, s.walls, 3); windows(b, w, d, h, 2, GLASS);
    b.box(GLASS, 5.5, 2.4, 0.1, -1.5, 1.5, d / 2 + 0.03); for (let i = 0; i < 6; i++) b.add('box', i % 2 ? 0xf2efe6 : s.trim, 1.7, 0.08, 1.8, -4.1 + i * 1.65, 3.2, d / 2 + 0.8, 0.35);
    b.box(s.roof, w + 0.4, 0.8, d + 0.4, 0, h + 0.4, 0); b.box(s.trim, w, 0.8, 0.1, 0, 3.9, d / 2 + 0.05);
    return { w, d, h: h + 0.8, door: door(3) };
  },
  chapel(b, s) {
    const w = 8, d = 12, h = 5; shell(b, w, d, h, s.walls); gable(b, w, d, h, s.roof, 0.3); b.box(s.walls, 2.8, 5, 2.8, 0, h + 2.5, d / 2 - 1.6); b.pyramid(s.roof, 3.6, 4.5, 3.6, 0, h + 7.2, d / 2 - 1.6);
    for (const x of [-w / 2 - 0.03, w / 2 + 0.03]) for (let i = 0; i < 3; i++) b.box(0xb88ad8, 0.08, 2.2, 0.9, x, 2.6, -3.5 + i * 3);
    b.ball(0xb88ad8, 0.8, 0, h + 1.8, d / 2 + 0.05, 1);
    return { w, d, h: h + 9.5, door: door() };
  },
  lab(b, s) {
    const w = 12, d = 9, h = 4; shell(b, w, d, h, s.walls); b.box(s.roof, w + 0.4, 0.3, d + 0.4, 0, h + 0.15, 0); b.box(GLASS, w - 1, 1.6, 0.08, 0, 2.4, d / 2 + 0.04);
    b.cyl(s.trim, 1.4, 2.5, -3.5, h + 1.4, -1.5); b.cyl(s.trim, 1.0, 3.2, -1, h + 1.7, -2); for (let i = 0; i < 3; i++) b.box(0x8a9098, 0.4, 0.4, d - 1, 3 + i * 0.8, h + 0.5, -0.5);
    return { w, d, h: h + 3.4, door: door() };
  },
  cafe(b, s) {
    const w = 10, d = 8, h = 3.8; shell(b, w, d, h, s.walls, 2.5); gable(b, w, d, h, s.roof, 0.5);
    b.box(GLASS, 5, 2.2, 0.08, -2, 1.5, d / 2 + 0.03); for (let i = 0; i < 5; i++) b.add('box', i % 2 ? 0xf2efe6 : s.trim, 2.1, 0.08, 1.5, -4 + i * 2, 3.1, d / 2 + 0.7, 0.3);
    return { w, d, h: h + 3.6, door: door(2.5) };
  },
  garage(b, s) {
    const w = 12, d = 9, h = 4.2; shell(b, w, d, h, s.walls, 4.2, 1.4); b.box(s.roof, w + 0.4, 0.4, d + 0.4, 0, h + 0.2, 0);
    for (const x of [-3.8, 0.6]) { b.box(s.trim, 3.6, 3.2, 0.1, x, 1.6, d / 2 + 0.05); for (let i = 0; i < 7; i++) b.box(0x7a8088, 3.5, 0.05, 0.12, x, 0.3 + i * 0.45, d / 2 + 0.1); }
    return { w, d, h: h + 0.4, door: door(4.2, 1.4) };
  },
  windmill(b, s) {
    b.cyl(s.walls, 3.6, 6, 0, 3, 0); b.cyl(s.walls, 2.8, 4, 0, 8, 0); b.cone(s.roof, 3.3, 3, 0, 11.5, 0);
    b.box(0x1e1a17, 1.6, 2.5, 0.4, 0, 1.25, 3.35); b.cyl(DARK, 0.25, 1.2, 0, 10.5, 3.2, Math.PI / 2);
    return { w: 7.2, d: 7.2, h: 13, door: door(0), front: 3.6, sails: [0, 10.5, 3.8] };
  },
  stable(b, s) {
    const w = 13, d = 8, h = 3.6; shell(b, w, d, h, s.walls, 1.7); gable(b, w, d, h, s.roof, 0.6);
    for (let i = 0; i < 4; i++) if (i !== 2) { const x = -4.9 + i * 3.3; b.box(s.trim, 1.6, 1.2, 0.1, x, 0.6, d / 2 + 0.05); b.box(0x1e1a17, 1.6, 1.3, 0.05, x, 1.85, d / 2 + 0.02); }
    b.box(s.trim, 1.2, 1.2, 0.2, 0, h + 1.3, d / 2 + 0.1); b.cone(s.trim, 0.8, 1.6, 0, h + 5, 0);
    return { w, d, h: h + 5.8, door: door(1.7) };
  },
  arcade(b, s) {
    const w = 11, d = 9, h = 5.5; shell(b, w, d, h, s.walls); b.box(s.roof, w + 0.4, 0.4, d + 0.4, 0, h + 0.2, 0);
    for (let i = 0; i < 6; i++) b.box([0xff4fd8, 0x4ff0ff, 0xfff04f][i % 3], 0.3, 4, 0.12, -5 + i * 2, 2.6, d / 2 + 0.05);
    b.box(s.trim, 8, 1.4, 0.3, 0, h + 1.1, d / 2 - 0.2); b.box(GLASS, 2.2, 1.6, 0.08, -3.2, 1.6, d / 2 + 0.04); b.box(GLASS, 2.2, 1.6, 0.08, 3.2, 1.6, d / 2 + 0.04);
    return { w, d, h: h + 1.9, door: door(), neon: true };
  },
  clocktower(b, s) {
    const w = 8, d = 8, h = 4; shell(b, w, d, h, s.walls); b.box(s.roof, w + 0.4, 0.4, d + 0.4, 0, h + 0.2, 0);
    b.box(s.walls, 3.6, 9, 3.6, 0, h + 4.5, -1); b.pyramid(s.roof, 4.8, 3.5, 4.8, 0, h + 10.75, -1); b.cyl(0xf2efe6, 1.3, 0.2, 0, h + 7, 0.85, Math.PI / 2); b.cyl(DARK, 0.15, 0.25, 0, h + 7, 0.95, Math.PI / 2);
    b.box(DARK, 0.1, 1.1, 0.05, 0, h + 7.4, 1.0); windows(b, w, d, h, 1, GLASS);
    return { w, d, h: h + 12.5, door: door() };
  },
  cabin(b, s) {
    const w = 9, d = 7, h = 3.2; shell(b, w, d, h, s.walls); gable(b, w, d, h, s.roof, 0.7);
    // Log courses stop either side of the door so the doorway stays readable.
    for (let i = 0; i < 9; i++) for (const sx of [-1, 1]) b.cyl(i % 2 ? s.walls : s.trim, 0.18, w / 2 - 0.5, sx * (w / 4 + 0.65), 0.2 + i * 0.36, d / 2 + 0.02, 0, Math.PI / 2);
    b.box(STONE, 1.2, h + 4, 1.2, w / 2 - 1, (h + 4) / 2, -1.5); windows(b, w, d, h, 1, GLASS);
    return { w, d, h: h + 4, door: door() };
  },
  terrace(b, s) {
    const w = 12, d = 8, h = 7; shell(b, w, d, h, s.walls); windows(b, w, d, h, 2, GLASS, { tall: true }); b.box(s.roof, w + 0.4, 0.5, d + 0.4, 0, h + 0.25, 0);
    b.box(s.trim, w, 0.2, 1.4, 0, 3.6, d / 2 + 0.7); for (let i = 0; i < 13; i++) b.box(s.trim, 0.06, 1.0, 0.06, -5.9 + i * 0.98, 4.2, d / 2 + 1.35);
    for (const x of [-4, 0, 4]) b.box(s.trim, 0.3, 6.5, 0.3, x === 0 ? -5.5 : x, 3.25, d / 2 + 1.3);
    return { w, d, h: h + 0.5, door: door() };
  },
  spaceport(b, s) {
    b.cyl(s.walls, 5.5, 2.5, 0, 1.25, 0); b.ball(GLASS, 4.5, 0, 2.5, 0, 0.5); b.ring(s.trim, 5.5, 0, 2.5, 0, Math.PI / 2);
    b.box(s.walls, 2.4, 2.6, 2.4, 0, 1.3, 5.2); b.box(0x1e1a17, 1.6, 2.5, 0.05, 0, 1.25, 6.42); b.cone(s.roof, 0.9, 6, -4.5, 3, -4); b.cyl(s.roof, 0.9, 3, -4.5, 1.5, -4);
    return { w: 11, d: 12.8, h: 7, door: door(0), front: 6.4 };
  },
  mansion(b, s) {
    const w = 14, d = 10, h = 7; shell(b, w, d, h, s.walls); windows(b, w, d, h, 2, GLASS, { tall: true }); b.pyramid(s.roof, w * 1.12, 3, d * 1.15, 0, h + 1.5, 0);
    for (let i = 0; i < 4; i++) b.cyl(0xf2efe6, 0.3, 4, -2.25 + i * 1.5, 2, d / 2 + 1.4); b.box(s.trim, 5.4, 0.4, 2.2, 0, 4.2, d / 2 + 1.1);
    for (const x of [-5, 5]) b.box(STONE, 0.9, 3, 0.9, x, h + 1.8, -2);
    return { w, d, h: h + 3, door: door() };
  },
  gatehouse(b, s) {
    const w = 12, d = 7, h = 5; shell(b, w, d, h, s.walls); for (const x of [-w / 2 + 1.5, w / 2 - 1.5]) { b.box(s.walls, 3.2, h + 3.5, d + 0.6, x, (h + 3.5) / 2, 0); b.pyramid(s.roof, 4.2, 3, d + 1.4, x, h + 5, 0); }
    b.box(s.trim, 3, 0.3, 0.3, 0, 2.7, d / 2 + 0.05); b.box(s.roof, 5.4, 0.4, d + 0.4, 0, h + 0.2, 0); windows(b, w, d, h, 1, GLASS);
    return { w, d: d + 0.6, h: h + 6.5, door: door() };
  },
  mill(b, s) {
    const w = 10, d = 8, h = 5; shell(b, w, d, h, s.walls, -1.5); gable(b, w, d, h, s.roof); b.cyl(0x6a4a2a, 2.4, 0.6, w / 2 + 0.5, 2.4, 0, 0, Math.PI / 2);
    for (let i = 0; i < 8; i++) b.add('box', WOOD, 0.15, 4.4, 0.6, w / 2 + 0.85, 2.4, 0, i * Math.PI / 8); windows(b, w, d, h, 1, GLASS, { doorX: -1.5 });
    return { w: w + 1.6, d, h: h + 3.5, door: door(-1.5) };
  },
};

// Yard and roof features. Positions are relative to the house footprint so they
// never block the front door path (x ∈ [-1.2, 1.2] in front of the door).
const yardSlots = (fp) => [
  [-fp.w / 2 - 2.2, fp.d / 2 - 0.5], [fp.w / 2 + 2.2, fp.d / 2 - 0.5], [-fp.w / 2 - 2.2, -fp.d / 4],
  [fp.w / 2 + 2.2, -fp.d / 4], [-fp.w / 3, fp.d / 2 + 3.2], [fp.w / 3 + 1.5, fp.d / 2 + 3.2],
];

export const FEATURES = {
  chimney: (b, fp, s) => { b.box(0x9a6a5a, 1, 3, 1, fp.w / 2 - 1.4, fp.h - 1, -fp.d / 4); },
  antenna: (b, fp) => b.at(-fp.w / 4, fp.h - 0.5, -fp.d / 4, 0, () => PROPS.antenna.build(b, {})),
  dish: (b, fp) => b.at(fp.w / 4, fp.h - 0.6, 0, 0.6, () => PROPS.satelliteDish.build(b, {})),
  solar: (b, fp) => { for (let i = 0; i < 3; i++) b.add('box', 0x22406a, 1.6, 0.06, 1.1, -1.8 + i * 1.8, fp.h - 0.2, -fp.d / 4, -0.4); },
  roofGarden: (b, fp) => { for (let i = 0; i < 5; i++) b.ball(0x5a9a50, 0.55, -2 + i, fp.h + 0.2, -fp.d / 5 + (i % 2) * 0.6); },
  weathervane: (b, fp) => { b.cyl(0x3b3f46, 0.04, 1.6, 0, fp.h + 0.6, 0); b.box(0xd8b44a, 1.0, 0.25, 0.04, 0, fp.h + 1.3, 0); },
  bell: (b, fp, s) => { b.box(s.trim, 1.6, 1.6, 1.6, 0, fp.h + 0.6, -fp.d / 4); b.ball(0xd8b44a, 0.45, 0, fp.h + 0.6, -fp.d / 4 + 0.5, 1.2); },
  flagRoof: (b, fp, s) => { b.cyl(0x9aa3ad, 0.05, 2.6, 0, fp.h + 1.2, 0); b.box(s.trim, 1.3, 0.8, 0.04, 0.68, fp.h + 2.1, 0); },
};

// Yard features reuse props; colour picks from the house palette for coherence.
export const YARD_PROPS = {
  garden: 'flowerBed', fence: 'fence', trees: 'tree', flag: 'flag', lanterns: 'lantern', mailbox: 'mailbox', bench: 'bench',
  telescope: 'telescope', crates: 'crates', van: 'van', truck: 'truck', bicycle: 'bicycle', beehives: 'beehive', pond: 'pond',
  statue: 'statue', campfire: 'campfire', wagon: 'wagon', rocks: 'rock', torches: 'torch', hay: 'hay', signpost: 'signpost',
  well: 'well', tent: 'tent', solarField: 'solarPanel', satellite: 'satelliteDish', mushrooms: 'mushroom', horse: 'horse',
  giraffe: 'giraffe', barrels: 'barrel', sandpit: 'sandpit', portal: 'portal', runeStone: 'runeStone', robot: 'robot',
  spaceship: 'spaceship', anvil: 'anvil', herbs: 'herbGarden', cafeTables: 'cafeTable', balloons: 'balloons', noticeBoard: 'noticeBoard',
  trophy: 'trophy', piano: 'piano', drone: 'drone', battery: 'battery', bird: 'bird', crystal: 'crystal', beacon: 'lantern',
};

export const FEATURE_NAMES = [...Object.keys(FEATURES), ...Object.keys(YARD_PROPS)];

export function buildExterior(b, ext, colors, yardLimits = {}) {
  const style = STYLES[ext.style];
  if (!style) throw new Error('Unknown exterior style ' + ext.style);
  const s = { walls: colors.walls, roof: colors.roof, trim: colors.trim };
  const fp = style(b, s);
  fp.front = fp.front ?? fp.d / 2;
  const slots = yardSlots(fp);
  const yard = [];
  const occupied = [];
  let slot = 0;
  for (const f of ext.features || []) {
    if (FEATURES[f]) FEATURES[f](b, fp, s);
    else if (YARD_PROPS[f]) {
      const preferred = slots[slot++ % slots.length];
      const prop = PROPS[YARD_PROPS[f]];
      // All rendered yard objects reserve physical space, even visual-only
      // objects: decorative trees/props must not intersect walls or vehicles.
      const site = yardSite(fp,prop,preferred,occupied,yardLimits);
      if (!site) { (fp.skippedYard || (fp.skippedYard=[])).push(f); continue; }
      const {x,z,box}=site;
      const build = () => prop.build(b, { c: f === 'flag' || f === 'balloons' ? colors.trim : undefined });
      // Yard trees are choppable (skills.js), so they are recorded with b.tree().
      b.at(x, 0, z, x < 0 ? Math.PI / 2 : -Math.PI / 2, () => (f === 'trees' && b.tree ? b.tree({ type: 'tree' }, build) : build()));
      occupied.push(box);
      if (prop.solid) yard.push(box);
    } else throw new Error('Unknown exterior feature ' + f);
  }
  // Path and doormat give each front door a readable approach.
  b.box(0xc9bfa8, 1.8, 0.04, 4, fp.door.x, 0.02, fp.front + 2);
  fp.yard = yard;
  fp.yardObjects = occupied;
  return fp;
}
