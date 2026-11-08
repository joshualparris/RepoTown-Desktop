import {createPopulationView} from './population-view.js';
import { buildPubFacade, PUB_ENVELOPE } from './pub-envelope.js';
import { townDate } from './town-calendar.js';
import { solarPosition, solarDaylight, solarWarmth } from './solar-position.js';
import { buildExpansionFacade } from './town-expansion-facades.js';
import { buildPostFacade } from './post-facade.js';
import { shopLightingOn, interiorPalette } from './lighting.js';
import * as THREE from 'three';
import {pilotMains} from './electrical-pilot.js';
import { makeSeat } from './seats.js';
import { SIGNAL_CROSSINGS, crossingState } from './traffic-signals.js';
import { Builder, GLASS } from './builder.js';
import { civicRoofTop } from './civic-roof-height.js';
import { buildSignBoards } from './shop-signs.js';
import { PROPS } from './props.js';
import { pose } from './npcs.js';
import { makeDistinctPerson } from './npc-wardrobe.js';
import { createResidentModels } from './resident-models.js';
import { facilityAccess, openingHoursLabel } from './facility-access.js';
import { TownLife, GOODS, RAIL_Z, trainX, FIELD_Z0, FIELD_Z1, SEC_PER_MIN, LOT_X, AVENUES } from './life.js';
import { RAIL_GAUGE, RAIL_CROSSINGS, RAIL_DEPOT_PLATFORM_SETBACK, RAIL_DEPOT_PLATFORM_DEPTH, withinLevelCrossing, railSideYardClear, railGateBoxes, railClearanceAudit } from './rail-corridor.js';

// Draws the town simulation (src/world/life.js): the high street and farms on street 8,
// fields, livestock, the freight train, delivery trucks, villagers, doorstep parcels and
// the sky's day–night cycle. The simulation decides; this file only shows it.

const LOT8_Z = 7 * 46 - 3.5 * 46;          // centre z of the street-8 lots
const WOOD = 0x8a6545, DARK = 0x33363b, WHITE = 0xf2efe6, RED = 0xb8413a, ROOF = 0x5b6670;
const STORE = 'repository-town.life.v1';

// ── Goods on display ──────────────────────────────────────────────────────
// One instanced mesh per display; its visible count follows the stock.
const GOOD_GEO = {
  bread: [new THREE.BoxGeometry(0.34, 0.16, 0.18), [0xc98b4a, 0xb7773a, 0xd8a060]],
  pie: [new THREE.CylinderGeometry(0.15, 0.15, 0.08, 10), [0xd9a05b, 0xc88c48]],
  veg: [new THREE.SphereGeometry(0.13, 8, 6), [0x5aa040, 0xe07a2a, 0xc23b2b, 0x7a3f8a, 0x8fbf3a]],
  fruit: [new THREE.SphereGeometry(0.11, 8, 6), [0xc8302a, 0xf2c23a, 0xf28a2a, 0x9bc93a]],
  eggs: [new THREE.BoxGeometry(0.3, 0.09, 0.14), [0xf3ead8, 0xe8d9bf]],
  milk: [new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8), [0xfafafa]],
  lamb: [new THREE.BoxGeometry(0.24, 0.09, 0.17), [0xb5414a, 0xc45a5a]],
  coffee: [new THREE.BoxGeometry(0.2, 0.3, 0.12), [0x5a3a24, 0x6a4430]],
  tea: [new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8), [0x2f7a5a, 0x7a2f3a, 0x2f4a7a]],
  grain: [new THREE.SphereGeometry(0.28, 8, 6), [0xc8a860, 0xbf9f55]],
  flour: [new THREE.SphereGeometry(0.28, 8, 6), [0xf0ece0, 0xe6e0d0]],
  parcel: [new THREE.BoxGeometry(0.36, 0.26, 0.3), [0xb08a5a, 0xa47c4c, 0xc29a68]],
};
GOOD_GEO.grain[0].scale(1, 0.7, 0.8); GOOD_GEO.flour[0].scale(1, 0.7, 0.8);
const goodMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

function display(parent, good, slots, readStock, full) {
  const [geo, colours] = GOOD_GEO[good];
  const mesh = new THREE.InstancedMesh(geo, goodMat, slots.length);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  slots.forEach((s, i) => { m.makeRotationY(s.r || 0).setPosition(s.x, s.y, s.z); mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.set(colours[i % colours.length])); });
  parent.add(mesh);
  return { mesh, update() { const n = readStock() || 0; mesh.count = n <= 0 ? 0 : Math.max(1, Math.min(slots.length, Math.round((n / (full || slots.length)) * slots.length))); } };
}
// Rows of items on a table top or in crates: w × d area centred on (x, z) at height y.
function grid(x, y, z, w, d, cols, rows, layers = 1, lift = 0.1) {
  const out = [];
  for (let l = 0; l < layers; l++) for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ x: x - w / 2 + (i + 0.5) * (w / cols), y: y + l * lift, z: z - d / 2 + (j + 0.5) * (d / rows), r: ((i * 7 + j * 3) % 5) * 0.2 });
  return out;
}

// ── Buildings ─────────────────────────────────────────────────────────────
// Every building is authored in its lot's frame: street side +z, front wall at z = +7.
function shopfront(b, w, d, h, wall, trim, stripes) {
  b.box(wall, w, h, d, 0, h / 2, 7 - d / 2);
  b.box(trim, w + 0.4, 0.6, d + 0.4, 0, h + 0.3, 7 - d / 2);
  for (const x of [-w * 0.28, w * 0.28]) { b.box(GLASS, w * 0.32, 1.9, 0.08, x, 1.65, 7.04); b.box(trim, w * 0.34, 0.12, 0.14, x, 0.65, 7.06); }
  // A glazed shop door in a timber frame, with a brass pull.
  b.box(0x3a2a1e, 1.5, 2.4, 0.06, 0, 1.2, 7.04); b.box(GLASS, 1.1, 1.75, 0.03, 0, 1.4, 7.08); b.box(0xc9a85a, 0.05, 0.36, 0.05, 0.48, 1.15, 7.11);
  b.box(0x22252a, w * 0.62, 0.8, 0.12, 0, h - 0.55, 7.08);
  if (stripes) { const n = Math.round(w / 1.2); for (let i = 0; i < n; i++) b.add('box', stripes[i % 2], w / n, 0.08, 2.0, -w / 2 + (i + 0.5) * (w / n), 3.05, 7.95, 0.35, 0, 0); }
}
function table(b, x, z, w = 2.4, d = 0.9, top = WOOD) {
  b.solid(w, d, x, z);
  b.block(top, w, 0.08, d, x, 0.82, z);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.block(0x5a4030, 0.08, 0.82, 0.08, x + sx * (w / 2 - 0.1), 0, z + sz * (d / 2 - 0.1));
}
function crate(b, x, z, w = 0.9, d = 0.6, y = 0) { b.solid(w, d, x, z); b.block(0x9a7448, w, 0.3, d, x, y, z); }
function shed(b, w, d, h, wall, roof, z0 = 7) {
  b.box(wall, w, h, d, 0, h / 2, z0 - d / 2);
  const r = Math.hypot(w / 2 + 0.4, 1.6), ang = Math.atan2(1.6, w / 2 + 0.4);
  b.add('box', roof, r, 0.15, d + 0.8, -(w / 2 + 0.4) / 2, h + 0.8, z0 - d / 2, 0, 0, ang);
  b.add('box', roof, r, 0.15, d + 0.8, (w / 2 + 0.4) / 2, h + 0.8, z0 - d / 2, 0, 0, -ang);
  b.box(0x3a2a1e, 2.6, 2.8, 0.06, 0, 1.4, z0 + 0.03);
}
// Big ones are oaks for woodcutting (skills.js); every tree here can be chopped.
function tree(b, x, z, s = 1, leaf = 0x4e8a46) { b.solid(0.6 * s, 0.6 * s, x, z); b.tree({ type: s >= 1.05 ? 'oak' : 'tree' }, () => { b.cyl(0x6a4a2a, 0.22 * s, 2.4 * s, x, 1.2 * s, z); b.ball(leaf, 1.5 * s, x, 3.2 * s, z); }); }
function fence(b, x0, x1, z0, z1, gateX) {
  const rail = (ax, az, bx, bz) => { b.solid(Math.max(0.3, Math.abs(bx - ax)), Math.max(0.3, Math.abs(bz - az)), (ax + bx) / 2, (az + bz) / 2); const len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az) + Math.PI / 2; for (const y of [0.45, 0.9]) b.box(0xd8cdb8, len, 0.08, 0.06, (ax + bx) / 2, y, (az + bz) / 2, ry); for (let s = 0; s <= len; s += 2.5) b.block(0xc8bca5, 0.1, 1.05, 0.1, ax + (bx - ax) * (s / len), 0, az + (bz - az) * (s / len)); };
  rail(x0, z1, x1, z1); rail(x0, z0, x0, z1); rail(x1, z0, x1, z1);
  if (gateX === undefined) rail(x0, z0, x1, z0); else { rail(x0, z0, gateX - 1.6, z0); rail(gateX + 1.6, z0, x1, z0); }
}

// Painted name boards (src/world/shop-signs.js), in each lot's frame: [x, y, z, w, h, background, lettering].
// Shopfronts paint over their existing board (w × h of the building decides its size).
const SHOPFRONT = { store: [14, 5], bakery: [12, 4.6], cafe: [12, 4.4], greengrocer: [12, 4.4], butcher: [11, 4.4], post: [11, 4.6], clinic: [12, 4.6] };
export const SIGN_AT = {
  // Permanent painted nameplates exactly over the currently blank upper shopfront
  // panels (y = facade height - 0.55, z = front 7.13). Unlike nearby name
  // sprites, these remain readable even when proximity labels are hidden.
  soyfarm: [0, 3.75, 7.135, 7.12, 0.69, '#254632', '#f7f2df'],
  soyplant: [0, 4.75, 7.135, 8.36, 0.71, '#264c57', '#f3f7f5'],
  pub: [0, 3.91, 7.15, 7, 0.65, '#1f3a2a', '#f1e3b5'], hall: [0, 7.1, 7.99, 11, 0.62, '#d8d2c4', '#3a3226'],
  school: [0, 3.9, 7.07, 6, 0.7, '#f3ead2', '#2a3a5a'], depot: [0, 3.9, 7.07, 6, 0.7, '#2b2118', '#f1e3b5'],
  mill: [0, 3.2, 4.06, 2.6, 0.55, '#f3ead2', '#3a2a1e'], bank: [0, 5.62, 7.83, 9, 0.55, '#e8e2d2', '#3a3226'],
  power: [-2, 3.4, 7.09, 5, 0.6, '#e8c23a', '#222222'], waterworks: [-4, 2.95, 5.58, 4.4, 0.5, '#e9eef2', '#1f4a6a'],
  sewage: [0, 2.6, 7.09, 4.2, 0.45, '#e6e2d6', '#3a4a3a'], fire: [0, 5.3, 7.13, 5, 0.6, '#f2efe6', '#b83a32'],
  recycling: [0, 3.4, 7.09, 5, 0.55, '#2f5a2a', '#f2efe6'], landfill: [0, 2.1, 6.73, 3.6, 0.45, '#e6e2d6', '#3a3226'],
  foundry: [0, 4.55, 7.09, 6.5, 0.7, '#2a2420', '#ff9a4a'], hotel: [0, 8.3, 7.12, 6.2, 0.8, '#f3dfb1', '#5a3a22'],
  realty: [0, 4.14, 7.16, 9.3, 0.62, '#234c47', '#f4e8d2'],
  realestate:[0,4.05,7.1,7.2,0.5,'#e9e1d0','#453827'],
  dealership:[0,4.05,7.1,7.2,0.5,'#c8d6e2','#1d4267'],
  mechanic:[0,4.05,7.1,7.2,0.5,'#273940','#f2c74a'],
  police:[0,4.35,7.16,8.8,.60,'#20395b','#f2e9d4'],
  ambulance:[0,4.20,7.16,8.4,.57,'#f2f5ef','#b02d35'],
  court:[0,5.60,7.16,9.0,.64,'#eee6d7','#343c51'],
  solicitor:[0,4.11,7.16,9.2,.57,'#264a43','#f4ece0'],
  securityhq:[0,4.18,7.13,9.8,.62,'#203951','#f6eaca'],
  securityoffice:[0,4.15,7.13,9.0,.59,'#243c52','#e9f0eb'],
  locksmith:[0,4.18,7.13,9.0,.60,'#7e5531','#fcf1ce'],
};
const SHOP_COLOURS = { store: ['#2f6b8c', '#f6f1e2'], bakery: ['#8a5a2a', '#f8ecd2'], cafe: ['#e8d8b8', '#2f5a4a'], greengrocer: ['#3f7a3a', '#f6f1e2'], butcher: ['#b8413a', '#ffffff'], post: ['#b8413a', '#ffffff'], clinic: ['#ffffff', '#2a5a78'] };

// Returns { w, d } of the solid front block so the town can collide with it.
const BUILD = {
  securityhq(b) {
    shopfront(b,14,10,5.2,0x869baa,0x243e58,[0x243e58,0xd7dfdd]);
    b.box(0x243e58,14.4,.35,1.3,0,4.13,7.7);
    for(const x of [-4.8,4.8]) { b.box(0xc9dbe1,1.15,1.25,.06,x,2.1,7.16); b.box(0x203951,1.15,.13,.08,x,1.31,7.19); }
    return {w:14,d:10};
  },
  securityoffice(b) {
    shopfront(b,14,10,4.9,0xc0c7c4,0x354c62,null);
    b.box(0x243c52,14.2,.34,1.15,0,4.10,7.7);
    for(const x of [-4.8,4.8]) b.box(0xb7cdd2,1.35,1.7,.06,x,2.12,7.17);
    return {w:14,d:10};
  },
  locksmith(b) {
    shopfront(b,14,10,4.9,0xd1b18a,0x6e482f,[0x996e43,0xe6c592]);
    for(const x of [-4.6,4.6]) {
      b.box(0xdcbf88,2.2,1.2,.07,x,2.45,7.18);
      b.box(0x594638,2.0,.12,.09,x,1.72,7.2);
    }
    return {w:14,d:10};
  },
  soyfarm(b) {
    shopfront(b, 12, 8, 4.3, 0xb6a982, 0x568047, [0x79984d, 0xd7c78b]);
    // Seed-grading shed, rainwater tanks and a small covered loading platform.
    b.cyl(0x839b8f, 0.85, 2.2, 4.6, 1.1, 3.0);
    b.box(0x916d45, 2.2, 0.2, 1.2, -4.2, 0.45, 9.5);
    return {w:12,d:8};
  },
  soyplant(b) {
    shopfront(b, 14, 9, 5.3, 0xc5d4d4, 0x477d88, [0x598a96, 0xe3f1ee]);
    b.cyl(0xabbfc7, 1.1, 3.1, -4.5, 1.55, 2.3);
    b.cyl(0x9eb1bb, .8, 2.5, 4.2, 1.25, 2.5);
    b.box(0x7297a2, 3.8, .5, 1.1, 0, 2.0, 1.1);
    return {w:14,d:9};
  },
  store(b) { shopfront(b, 14, 10, 5, 0xd9c8a0, 0x6a4a2e, [0x2f6b8c, WHITE]); table(b, -4.2, 8.6); table(b, 4.2, 8.6); return { w: 14, d: 10 }; },
  bakery(b) { shopfront(b, 12, 9, 4.6, 0xf0dcc0, 0x8a5a2a, [0xc8553d, 0xf2e2c2]); table(b, -3.6, 8.6); table(b, 3.6, 8.6); b.cyl(0x9a958c, 0.45, 2.2, 4.5, 5.6, 0.5); return { w: 12, d: 9 }; },
  cafe(b) {
    shopfront(b, 12, 9, 4.4, 0x2f5a4a, 0xe8d8b8, [0x2f5a4a, 0xe8d8b8]);
    for (const [x, z] of [[-4, 9.4], [4, 9.4]]) { b.cyl(WHITE, 0.5, 0.06, x, 0.78, z); b.cyl(DARK, 0.05, 0.78, x, 0.39, z); b.cyl(0xd04848, 0.05, 2.4, x, 1.2, z); b.cone(0xe86a4a, 1.5, 0.6, x, 2.5, z); for (const s of [-1, 1]) b.block(0x6a4a2e, 0.4, 0.45, 0.4, x + s * 0.8, 0, z); }
    return { w: 12, d: 9 };
  },
  greengrocer(b) {
    shopfront(b, 12, 9, 4.4, 0xe8e0c8, 0x3f7a3a, [0x3f7a3a, 0xf2efe6]);
    // Tiered crates sit 0.3 m nearer the window so the queue slots (front z 9.3) and the footpath stay clear of them.
    for (const x of [-4.2, -3.1, 3.1, 4.2]) for (const [z, y] of [[7.9, 0.55], [8.6, 0.25]]) { crate(b, x, z, 1.0, 0.65, y - 0.25); b.block(0x6a5030, 1.0, y - 0.25, 0.6, x, 0, z); }
    return { w: 12, d: 9 };
  },
  butcher(b) {
    shopfront(b, 11, 9, 4.4, 0xf2f2f2, 0xb8413a, [0xb8413a, WHITE]);
    for (const x of [-3.4, 3.4]) { b.block(0xe8e8e8, 2.4, 0.9, 0.9, x, 0, 8.4); b.box(GLASS, 2.4, 0.4, 0.9, x, 1.1, 8.4); }
    return { w: 11, d: 9 };
  },
  pub(b) {
    return buildPubFacade(b,{GLASS,DARK,WOOD});
  },
  post(b) { return buildPostFacade(b,{shopfront,RED,DARK}); },
  hall(b) {
    b.box(0xd8d2c4, 18, 7, 12, 0, 3.5, 1); b.box(0xb8b2a4, 19, 0.8, 13, 0, 7.4, 1);
    for (let i = 0; i < 6; i++) b.cyl(WHITE, 0.35, 6.4, -6.25 + i * 2.5, 3.2, 7.6);
    b.box(0xc8c2b4, 16, 0.3, 2.4, 0, 0.15, 8.0); b.pyramid(0xb8b2a4, 16, 2.2, 3, 0, 8.9, 7.4);
    b.box(0xd8d2c4, 4, 6, 4, 0, 10.8, 1); b.pyramid(0x4a5560, 4.6, 3, 4.6, 0, 15.3, 1);
    b.box(0x2a1e18, 2.2, 3.2, 0.06, 0, 1.6, 7.05);
    for (const x of [-6, -3, 3, 6]) b.box(GLASS, 1.2, 2.2, 0.08, x, 2.0, 7.05);
    return { w: 18, d: 12 };
  },
  school(b) {
    b.box(0xd89a6a, 18, 5, 10, 0, 2.5, 2); b.box(0x8a3a2a, 18.6, 0.6, 11, 0, 5.3, 2);
    for (let i = 0; i < 6; i++) if (i !== 2 && i !== 3) b.box(GLASS, 1.6, 1.6, 0.08, -7.2 + i * 2.9, 2.2, 7.04);
    b.box(0x2a3a5a, 2.4, 2.6, 0.06, 0, 1.3, 7.04);
    b.block(0xb0b0b0, 0.12, 9, 0.12, 7.5, 0, 9); b.box(0x2f5aa8, 1.6, 1.0, 0.04, 8.3, 8.3, 9);
    for (const x of [-5.5, -3.5]) b.add('box', DARK, 0.08, 2.6, 0.08, x, 1.3, -6, 0, 0, 0); b.box(DARK, 2.2, 0.08, 0.08, -4.5, 2.6, -6);
    return { w: 18, d: 10 };
  },
  clinic(b) {
    shopfront(b, 12, 9, 4.6, WHITE, 0x7ab0c8, null);
    return { w: 12, d: 9 };
  },
  depot(b) {
    b.box(0xb88a5a, 14, 5, 8, 0, 2.5, 3); b.box(0x4a3a2a, 16, 0.4, 10, 0, 5.2, 3);
    b.box(0x2a1e18, 2, 2.6, 0.06, 0, 1.3, 7.04); for (const x of [-4.5, 4.5]) b.box(GLASS, 1.6, 1.6, 0.08, x, 2, 7.04);
    // This historic town-centre site is now the freight dispatch warehouse.
    // The physically connected platform is modelled at the north rail terminal
    // instead of teleporting a 350 m long platform into this building mesh.
    return { w: 14, d: 8 };
  },
  mill(b) {
    b.cyl(0xe8e0d0, 3, 10, 0, 5, 1); b.cone(0x5a4a3a, 3.4, 3, 0, 11.5, 1);
    b.box(0x2a1e18, 1.6, 2.4, 0.06, 0, 1.2, 4.0);
    b.box(0xc8bca5, 6, 3, 4, 6, 1.5, 4.5); b.box(0x7a6a5a, 6.4, 0.2, 4.4, 6, 3.1, 4.5);
    return { w: 7, d: 6, front: 4 };
  },
  farmhouse(b) {
    b.box(0xf0e6d0, 13, 4, 9, 0, 2, 2.5); const r = 7.2;
    b.add('box', 0x8a3a2a, r, 0.15, 10, -3.3, 5.3, 2.5, 0, 0, 0.5); b.add('box', 0x8a3a2a, r, 0.15, 10, 3.3, 5.3, 2.5, 0, 0, -0.5);
    b.box(0x9a8a72, 13, 0.15, 2.2, 0, 3, 8.1); for (const x of [-6, -2, 2, 6]) b.cyl(WHITE, 0.1, 3, x, 1.5, 9);
    for (const x of [-4, 4]) b.box(GLASS, 1.4, 1.4, 0.08, x, 1.8, 7.04); b.box(0x3a2a1e, 1.4, 2.4, 0.06, 0, 1.2, 7.04);
    b.cyl(0x8a8a8a, 1.6, 0.4, 8.5, 9, -4); b.block(0x9a958c, 0.25, 9, 0.25, 8.5, 0, -4);
    return { w: 13, d: 9, front: 7 };
  },
  square(b) {
    b.box(0xc9c0ac, 24, 0.05, 30, 0, 0.03, -4);
    b.cyl(0xbab6ae, 2.6, 0.7, 0, 0.35, -4); b.cyl(0x6fb8e0, 2.3, 0.1, 0, 0.66, -4); b.cyl(0xbab6ae, 0.35, 2, 0, 1, -4); b.ball(0xbab6ae, 0.6, 0, 2.1, -4);
    for (const [x, z, r] of [[-6, -4, Math.PI / 2], [6, -4, -Math.PI / 2], [0, 3, Math.PI], [0, -11, 0]]) b.at(x, 0, z, r, () => { b.solid(2, 0.7, 0, 0); b.block(WOOD, 2, 0.08, 0.6, 0, 0.45, 0); b.block(WOOD, 2, 0.5, 0.08, 0, 0.5, -0.3); b.block(DARK, 0.1, 0.45, 0.5, -0.9, 0, 0); b.block(DARK, 0.1, 0.45, 0.5, 0.9, 0, 0); });
    for (const [x, z] of [[-11.2, -13.6], [11.2, -13.6], [-9, 5], [9, 5], [-9, -4.5], [9, -4.5]]) tree(b, x, z, 1.1, 0x5a9a50);   // rear trees in the corners, clear of the market sites
    // Market stalls are set up only on market mornings (farmers-market.js).
    return null;
  },
};
// Civic sites across the road (authored like the rest: street side +z, front wall at z = +7).
Object.assign(BUILD, {
  police(b){
    // Brick rural NSW police station, public reception one side and
    // separated secure custody entry to the rear (no public jail access).
    b.box(0xc7b9a4,14,5.0,10,0,2.5,2);
    b.box(0x283e59,14.5,.48,10.6,0,5.23,2);
    b.box(0x385575,14.5,1.04,.4,0,5.85,6.85);
    for(const x of [-4.7,-2.8,2.8,4.7]){
      b.box(GLASS,1.56,1.94,.07,x,2.16,7.11);
      b.box(0xe4e7e6,1.66,.12,.12,x,3.18,7.15);
      b.box(0x4e6176,.13,2.04,.12,x,2.13,7.17);
    }
    b.box(0x243b52,1.8,2.85,.12,0,1.43,7.13);
    b.box(GLASS,1.55,2.35,.03,0,1.45,7.22);
    b.box(0xdddccf,.06,.40,.12,.64,1.43,7.29);
    b.box(0x354d61,4.2,.16,1.3,0,3.58,7.62);
    b.box(0xeee9d6,1.6,.78,.06,-5.32,2.6,7.22);
    b.box(0x284a65,1.41,.51,.07,-5.32,2.63,7.27);
    // Secure steel-gated custody sallyport is at rear, off the public sidewalk.
    for(const x of [-5.5,5.5])b.box(0x34404b,.22,2.7,.17,x,1.35,-3.07);
    return {w:14,d:10};
  },
  ambulance(b){
    // Regional ambulance operations and secure two-bay equipment area.
    b.box(0xe9e9e1,14,5.1,10,0,2.55,2);
    b.box(0xb73741,14.6,.32,10.5,0,5.30,2);
    for(const x of [-3.72,3.72]){
      b.box(0xdde3e1,4.7,3.22,.08,x,1.65,7.13);
      for(const y of [.86,1.65,2.44])b.box(0x9ebfc1,4.62,.075,.1,x,y,7.18);
      b.box(0xb83740,4.68,.25,.07,x,3.26,7.20);
    }
    b.box(GLASS,1.50,2.4,.065,0,1.46,7.24);
    b.box(0xb6363e,1.74,.22,.1,0,2.85,7.27);
    // Marked simulated vehicle spaces, no pedestrians obstructing entrance.
    for(const x of [-4.8,4.8]){
      b.block(0xeceae0,2.48,.05,3.9,x,.025,10.1);
      b.block(0xb32f3e,.17,.055,3.9,x-1.15,.030,10.1);
    }
    return {w:14,d:10};
  },
  court(b){
    // Modest Local Court, not a prison: formal stone facade, shaded
    // entrance and public hearing windows with discrete registry sign.
    b.box(0xddd4bf,14,6.1,10,0,3.05,2);
    b.box(0x6a665b,14.4,.38,10.6,0,6.27,2);
    b.box(0xe2dccd,14.6,.36,2.2,0,5.04,7.51);
    for(const x of [-5,-3,3,5]){
      b.cyl(0xeee7d4,.28,4.3,x,2.25,7.65);
      b.box(0xd3cbbb,.72,.23,.70,x,4.40,7.65);
    }
    for(const x of [-5.6,5.6])b.box(GLASS,1.34,2.1,.07,x,2.4,7.15);
    b.box(0x493a32,2.1,3.25,.09,0,1.63,7.15);
    b.box(0xd4d7cc,1.6,2.1,.05,0,1.58,7.25);
    b.box(0xd5aa63,.08,.45,.08,.72,1.46,7.33);
    b.box(0xb6ac97,2.8,.13,1.2,0,.10,8.05);
    return {w:14,d:10};
  },
  solicitor(b){
    // Plain commercial solicitors' rooms, glazed reception and private
    // offices, visibly not a police or court building.
    shopfront(b,14,10,4.9,0xe2dac8,0x264940,null);
    b.box(0x264940,14.5,.28,1.70,0,3.55,7.75);
    for(const x of [-4.6,-2.9,2.9,4.6]){
      b.box(0xf8f2e6,1.3,.75,.036,x,2.04,7.19);
      b.box(0x295e5a,1.13,.12,.039,x,2.31,7.22);
      b.box(0x9a967f,.72,.06,.039,x,1.83,7.22);
    }
    return {w:14,d:10};
  },
  realty(b) {
    // Distinct small-town NSW real estate shopfront, southwest face of
    // Market Square. A low heritage-style parapet, timber awning, two big
    // listing windows and a recognisable glass entry facing the main street.
    b.box(0xe2dccf,14,4.85,10,0,2.425,2);
    b.box(0x45635f,14.6,.40,10.6,0,5.08,2);
    b.box(0x314e49,14.8,1.0,.48,0,5.57,6.79);
    for(const x of [-5.6,5.6]){
      b.box(0xbba682,.26,5.03,.32,x,2.52,7.08);
      b.box(0xbaa786,.24,.75,.32,x,4.79,7.1);
    }
    // Symmetrical plate-glass listing window bays and deep bronze mullions.
    for(const x of [-3.88,3.88]){
      b.box(0x9dbcc2,5.50,2.71,.065,x,2.29,7.08);
      b.box(0x344c4d,5.54,.10,.10,x,.90,7.12);
      b.box(0x344c4d,5.54,.09,.11,x,3.66,7.12);
      for(const sx of [-2.73,0,2.73])
        b.box(0x344c4d,.10,2.78,.13,x+sx,2.27,7.13);
      for(let i=0;i<5;i++){
        const sx=x-1.77+(i%3)*1.76,y=2.69-Math.floor(i/3)*.99;
        b.box(0xf4f1e9,1.17,.81,.028,sx,y,7.173);
        b.box([0x3d836c,0x396e83,0x9fa77c][i%3],1.10,.34,.032,sx,y+.20,7.195);
        b.box(0x233f44,.80,.045,.038,sx,y-.20,7.215);
      }
    }
    // Recessed-glass entry with visible door hardware and an unobstructed
    // street-door approach; frame remains graphical, not a solid barrier.
    b.box(0x284643,2.0,3.25,.10,0,1.62,7.12);
    b.box(0x9fbec2,1.74,2.86,.028,0,1.64,7.19);
    b.box(0xbda974,.08,.46,.11,.73,1.49,7.28);
    b.box(0x284643,.10,2.88,.10,0,1.60,7.23);
    b.box(0xebe3d0,2.2,.14,.8,0,.10,7.59);
    // Timber verandah awning and pressed-metal details.
    b.box(0x745c46,15.0,.19,2.75,0,3.77,7.8);
    b.box(0xe5dac4,15.04,.065,.20,0,3.62,9.12);
    for(const x of [-6.3,-4.3,-2.3,0,2.3,4.3,6.3])
      b.box(0xb1a084,.09,.34,2.30,x,3.63,7.94);
    // Shop hours, agency notice and accessible entry signs.
    b.box(0xe8e3d6,1.12,.81,.032,1.38,2.15,7.21);
    b.box(0x456b62,.89,.13,.034,1.38,2.32,7.235);
    b.box(0xb2bcab,1.25,.25,.03,0,.18,8.13);
    b.box(0x5f705c,1.8,.06,.44,0,.05,8.07);
    return {w:14,d:10};
  },
  hotel(b) {
    // A two-storey NSW country railway hotel (like Dubbo's own, now the Civic Hotel on Talbragar and
    // Darling Streets): rendered brick, guest rooms upstairs opening onto a first-floor balcony with a
    // cast-iron lace balustrade, a ground-floor verandah over the footpath on slender posts, and the
    // hotel's name painted on the parapet above, where the balcony can't hide it.
    b.box(0xd9b894,14,7,10,0,3.5,2);
    b.box(0x774b36,15,0.6,11,0,7.3,2);
    b.box(0x8b6549,15.2,0.25,11.2,0,7.65,2);
    b.box(0xd9b894,14,1.3,0.3,0,8.3,6.95);                     // parapet carrying the name
    b.box(0x8b6549,14.3,0.14,0.42,0,9.0,6.95);
    for(const y of [2.2,5.2])for(const x of [-5,-2.8,2.8,5])
      b.box(GLASS,1.3,1.6,0.08,x,y,7.05);
    for(const x of [-1.6,1.6])b.box(0x4e3528,0.9,2.2,0.08,x,4.6,7.07);   // French doors onto the balcony
    b.box(0x4e3528,2.2,2.7,0.08,0,1.35,7.08);
    b.box(0x816044,2.5,0.17,1.7,0,0.15,8.0);
    // Verandah over the footpath, balcony above it.
    const V=9.3;
    for(const x of [-6.6,-3.6,-1.5,1.5,3.6,6.6]){b.cyl(0x2f3a33,0.07,3.4,x,1.7,V);b.cyl(0x2f3a33,0.06,2.6,x,4.9,V);}   // posts frame the doorway
    b.box(0x9c7a58,14.4,0.18,2.4,0,3.45,8.15);                 // balcony floor = verandah ceiling
    b.box(0x3a2a20,14.4,0.28,0.1,0,3.3,V+0.03);                // fascia
    // Lace balustrade: top and bottom rails with close-set balusters, lace rosettes and a frieze.
    b.box(0x2f3a33,13.4,0.06,0.06,0,4.55,V);b.box(0x2f3a33,13.4,0.05,0.05,0,3.62,V);
    for(let x=-6.4;x<=6.45;x+=0.22)b.box(0x2f3a33,0.025,0.9,0.025,x,4.08,V);
    for(let x=-6.4;x<=6.45;x+=0.44)b.box(0x2f3a33,0.16,0.16,0.02,x,4.08,V,Math.PI/4);
    b.box(0x2f3a33,13.4,0.22,0.03,0,6.05,V);
    b.box(0x6f7d74,14.6,0.1,2.6,0,6.3,8.15);                   // verandah roof (corrugated iron)
    for(let x=-6.9;x<=6.95;x+=0.5)b.box(0x5f6d64,0.06,0.05,2.6,x,6.37,8.15);
    return {w:14,d:10,posts:[-6.6,-3.6,-1.5,1.5,3.6,6.6].map((x)=>[x,V])};
  },
  bank(b) {
    b.box(0xd8d0c0, 14, 6, 10, 0, 3, 2); b.box(0xa89a80, 15, 0.6, 11, 0, 6.3, 2);
    for (let i = 0; i < 4; i++) b.cyl(WHITE, 0.3, 5.2, -4.5 + i * 3, 2.6, 7.5);
    b.box(0x8a7a60, 13, 0.3, 2, 0, 0.15, 7.8); b.box(0x2a1e18, 1.8, 2.8, 0.06, 0, 1.4, 7.05);
    for (const x of [-5, 5]) b.box(GLASS, 1.4, 2, 0.08, x, 2.2, 7.05);
    return { w: 14, d: 10 };
  },
  power(b) {
    b.box(0x8a9098, 12, 6, 10, -2, 3, 2); b.cyl(0x6a6a70, 0.7, 14, -6, 7, 0); b.cyl(0xc8c4bc, 2.4, 9, 5, 4.5, 0);
    for (let i = 0; i < 6; i++) b.add('box', 0x23324a, 2.2, 0.08, 1.4, -6 + i * 2.4, 0.9, -5.5, -0.5, 0, 0);
    b.box(0x2a2a2a, 2, 2.6, 0.06, -2, 1.3, 7.05); b.box(0xe8c23a, 3, 0.4, 0.06, -2, 3.3, 7.05);
    return { w: 14, d: 10 };
  },
  waterworks(b) {
    b.cyl(0x8ab0c8, 4, 6, 3, 3, -1); b.cone(0x6a8aa8, 4.3, 1.2, 3, 6.6, -1); b.box(0xc8c0b0, 6, 3.5, 5, -4, 1.75, 3);
    b.box(0x2a2a2a, 1.4, 2.4, 0.06, -4, 1.2, 5.55); b.cyl(0x5a7a9a, 0.3, 4, -1, 2, 5);
    return { w: 14, d: 10 };
  },
  sewage(b) {
    for (const [x, z] of [[-3.5, 0], [3.5, 0]]) { b.cyl(0x9a9a92, 3, 1.2, x, 0.6, z); b.cyl(0x5a6a4a, 2.7, 0.05, x, 1.2, z); }
    b.box(0xb8b0a0, 5, 3, 4, 0, 1.5, 5); b.box(0x2a2a2a, 1.4, 2.2, 0.06, 0, 1.1, 7.05);
    return { w: 13, d: 8 };
  },
  fire(b) {
    b.box(0xb83a32, 13, 6, 10, 0, 3, 2); b.box(0x7a2a24, 13.6, 0.5, 10.6, 0, 6.25, 2);
    for (const x of [-3.2, 3.2]) { b.box(0xe8e4dc, 4.6, 4.2, 0.06, x, 2.1, 7.05); for (let i = 1; i < 5; i++) b.box(0xb0aca4, 4.6, 0.06, 0.08, x, i * 0.85, 7.08); }
    b.cyl(0xb83a32, 1.2, 9, 6.5, 4.5, -2); b.box(0xd0d0d0, 2.6, 0.5, 0.06, 0, 5.3, 7.06);
    return { w: 14, d: 10 };
  },
  recycling(b) {
    shed(b, 12, 8, 4, 0x6a9a5a, 0x4a5a4a);
    for (let i = 0; i < 4; i++) b.block([0x3a7ab8, 0xe0b040, 0x5aa040, 0xb8413a][i], 1.4, 1.3, 1.1, -4.5 + i * 3, 0, 8.4);
    return { w: 12, d: 8 };
  },
  landfill(b) {
    for (const [x, z, r] of [[-3, -1, 3.2], [3, 0, 2.6]]) b.ball(0x7a6a50, r, x, 0, z, 0.45);
    b.box(0xb8b0a0, 4, 2.6, 3, 0, 1.3, 5.2); fence(b, -6.5, 6.5, -6, 6.6);
    return { w: 13, d: 12 };
  },
  realestate(b){
    shopfront(b,14,10,4.9,0xe8decf,0x6b5845,null);
    for(const x of [-5.2,-3.4,3.4,5.2])b.box(GLASS,1.0,1.7,0.05,x,2.0,7.1);
    return {w:14,d:10};
  },
  dealership(b){
    shopfront(b,14,10,4.9,0xc3d1dc,0x315d7c,null);
    for(const x of [-4,4]){
      b.block(0x456e91,1.65,0.9,2.8,x,0,9.3);
      b.box(GLASS,1.5,.5,1.7,x,1.1,9.3);
      for(const ax of [-.85,.85])for(const az of [-1,1])b.cyl(0x242729,.3,.23,x+ax,.32,9.3+az,Math.PI/2);
    }
    return {w:14,d:10};
  },
  mechanic(b){
    shed(b,14,10,5,0xa6adaf,0x555e63);
    for(const x of [-3.6,3.6])b.box(0xd5d9da,3.9,3.5,.06,x,1.75,7.12);
    b.box(0x3f525e,13.6,.55,.1,0,4.05,7.16);
    return {w:14,d:10};
  },
  hardware(b){
    shopfront(b,14,10,5.0,0xbca88b,0x3c5145,[0xe5b54a,0x456b57]);
    for(const x of [-5.0,-3.4,3.4,5.0]){
      b.block(0xa77e52,.2,2.0,.25,x,1.8,9.5);
      b.box(0xe5be66,1.3,.1,.36,x,3.0,7.15);
    }
    for(const x of [-5,5]){b.block(0x875e39,.65,.7,1.0,x,0,10.3);b.box(0xe4c39b,.65,.2,1.1,x,.72,10.3);}
    return {w:14,d:10};
  },
  trades(b){
    shopfront(b,14,10,5.1,0xb2bec1,0x40546d,[0x426d85,0xd2d6d8]);
    for(const x of [-4.5,4.5]){
      b.block(0xe8ebee,2.0,1.0,3.0,x,0,10.0);
      b.box(0x407ea6,1.6,.6,.06,x,2.15,7.2);
    }
    for(const x of [-5,5]){b.cyl(0x2d3339,.35,.18,x,.32,10.5,Math.PI/2);}
    return {w:14,d:10};
  },
  tafe(b){
    shopfront(b,14,10,5.3,0xdac4a0,0x8a4839,[0xc57f45,0xffe2ac]);
    b.box(0x784e36,14.3,.35,10.4,0,5.4,2.0);
    for(const x of [-5,5]){b.block(0xaf6952,1.3,1.4,1.2,x,0,9.7);b.box(0xe4d1af,1.3,.1,.45,x,1.48,9.7);}
    return {w:14,d:10};
  },
  university(b){
    shopfront(b,14,10,6.2,0xe0dacb,0x3e5870,[0x5c789c,0xf0e9dc]);
    b.box(0x334a5a,14.5,.32,10.4,0,6.25,2.0);
    for(const x of [-5.7,5.7]){b.cyl(0xf0ebda,.35,5.1,x,2.65,9.0);b.box(0x506b89,.82,.38,.55,x,5.1,9.0);}
    b.box(0x688bab,5.4,.22,.12,0,4.2,7.2);
    return {w:14,d:10};
  },
  foundry(b) {
    b.box(0x6a5a50, 14, 7, 10, 0, 3.5, 2); b.box(0x4a4a4a, 14.6, 0.5, 10.6, 0, 7.25, 2);
    for (const x of [-4, 3]) b.cyl(0x4a4040, 0.6, 12, x, 6, -1);
    b.box(0x2a2a2a, 4, 4, 0.06, 0, 2, 7.05);
    return { w: 14, d: 10 };
  },
});

// Farm sheds on the lots, with the paddocks across the road.
const FARM_SHED = {
  sheep: [16, 9, 4, 0xa8a8a0, 0x7a8590], dairy: [16, 10, 4.2, WHITE, 0x5b6670], coop: [10, 7, 3, 0xd8c8a0, 0x8a5a3a],
  orchard: [12, 8, 3.6, 0xc8a878, 0x6a5040], garden: [10, 7, 3.2, 0x8aa070, 0x5a6a50], silo: [14, 10, 5, 0xa83a2a, 0x5a5a5a],
};

// What each farm grows in its field.
function buildField(p, group, statics, glass) {
  const f = p.field, cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2, w = f.x1 - f.x0, d = f.z1 - f.z0;
  const b = statics;
  b.box(0x7a5a3a, w, 0.03, d, cx, 0.015, cz);            // tilled soil or pasture base
  const dyn = { update() {} };
  if (p.id === 'soyfarm') {
    // Soy plants are crop rows, not livestock. One instanced mesh keeps phone draw calls low.
    const rows=8,per=12;
    const geo=new THREE.SphereGeometry(.24,7,5);
    const mat=new THREE.MeshLambertMaterial({color:0x65a04b});
    const crop=new THREE.InstancedMesh(geo,mat,rows*per);
    const tr=new THREE.Matrix4();
    for(let i=0;i<rows;i++)for(let j=0;j<per;j++){
      tr.makeTranslation(f.x0+1+(j+.5)*(w-2)/per,.35,f.z0+1+(i+.5)*(d-2)/rows);
      crop.setMatrixAt(i*per+j,tr);
    }
    crop.instanceMatrix.needsUpdate=true;group.add(crop);
    dyn.update=()=>{crop.visible=p.growth>0.01;crop.scale.y=.2+Math.min(1,p.growth)*3;};
  } else if (p.id === 'silo' || p.id === 'garden') {
    const rows = p.id === 'silo' ? 10 : 8, per = p.id === 'silo' ? 1 : 14;
    const geo = p.id === 'silo' ? new THREE.BoxGeometry(w - 2, 1, 1.4) : new THREE.SphereGeometry(0.32, 8, 6);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const crop = new THREE.InstancedMesh(geo, mat, rows * per);
    const m = new THREE.Matrix4(), c = new THREE.Color();
    const veg = [0x4f9a3a, 0x6fb84a, 0x3a7a3a, 0x8a5aa0, 0xe07a2a];
    for (let j = 0, k = 0; j < rows; j++) for (let i = 0; i < per; i++, k++) {
      m.makeTranslation(per === 1 ? cx : f.x0 + 1.4 + i * ((w - 2.8) / (per - 1)), 0.02, f.z0 + 2 + j * ((d - 4) / (rows - 1)));
      crop.setMatrixAt(k, m); crop.setColorAt(k, c.set(p.id === 'silo' ? 0xffffff : veg[j % veg.length]));
    }
    group.add(crop);
    const green = new THREE.Color(0x6aa83a), gold = new THREE.Color(0xe0c060);
    dyn.update = () => {
      const g = p.growth;
      crop.scale.y = p.id === 'silo' ? 0.1 + g * 1.0 : 0.3 + g * 0.9;
      if (p.id === 'silo') mat.color.copy(green).lerp(gold, Math.max(0, (g - 0.5) * 2));
    };
    if (p.id === 'garden') { for (let i = 0; i < 2; i++) b.block(0x6a8a5a, 0.3, 0.3, d - 3, f.x0 + 3 + i * (w - 6), 0, cz); }
  } else if (p.id === 'orchard') {
    b.box(0x5f9a4a, w, 0.03, d, cx, 0.02, cz);
    const trees = [];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = f.x0 + 2.8 + i * ((w - 5.6) / 3), z = f.z0 + 3 + j * ((d - 6) / 3); tree(b, x, z, 0.8, 0x3f7a3a); trees.push({ x, z }); }
    const slots = trees.flatMap((t, ti) => Array.from({ length: 7 }, (_, k) => ({ x: t.x + Math.cos(k * 0.9 + ti) * 1.0, y: 2.2 + (k % 3) * 0.45, z: t.z + Math.sin(k * 0.9 + ti) * 1.0 })));
    const fruit = display(group, 'fruit', slots, () => Math.round(p.growth * 100), 100);
    dyn.update = () => fruit.update();
  } else {
    // Livestock paddocks: pasture, a fence with a gate on the road side, a trough.
    b.box(0x6fae58, w, 0.03, d, cx, 0.02, cz);
    fence(b, f.x0 + 0.5, f.x1 - 0.5, f.z0 + 0.5, f.z1 - 0.5, cx);
    b.solid(2.4, 0.7, cx + 6, f.z1 - 3); b.block(0x8a8a8a, 2.4, 0.5, 0.7, cx + 6, 0, f.z1 - 3);
    const kind = { sheep: { n: 12, body: [0.9, 0.62, 1.2], bodyC: 0xf2efe6, head: 0x2a2420, y: 0.62 }, dairy: { n: 7, body: [1.1, 1.0, 2.0], bodyC: 0xf5f2ea, head: 0x2a2420, y: 1.0 }, coop: { n: 16, body: [0.3, 0.3, 0.38], bodyC: 0xa8582a, head: 0xd83a2a, y: 0.3 } }[p.id];
    if (p.id === 'coop') b.at(cx - 6, 0, f.z1 - 4, 0, () => { b.solid(3, 2.2, 0, 0); b.block(0xc89a5a, 3, 1.8, 2.2, 0, 0.4, 0); b.pyramid(0x8a4a2a, 3.6, 1, 2.8, 0, 2.7, 0); for (const sx of [-1.2, 1.2]) b.block(DARK, 0.12, 0.4, 0.12, sx, 0, 0); });
    const bodyGeo = new THREE.SphereGeometry(0.5, 10, 7), headGeo = new THREE.SphereGeometry(0.5, 8, 6);
    const bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshLambertMaterial({ color: kind.bodyC }), kind.n);
    const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshLambertMaterial({ color: kind.head }), kind.n);
    const patches = p.id === 'dairy' ? new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 6, 5), new THREE.MeshLambertMaterial({ color: 0x1d1d1d }), kind.n) : null;
    group.add(bodies, heads); if (patches) group.add(patches);
    const herd = Array.from({ length: kind.n }, (_, i) => ({ x: f.x0 + 2 + ((i * 37) % 17) / 17 * (w - 4), z: f.z0 + 2 + ((i * 53) % 13) / 13 * (d - 4), h: i, tx: 0, tz: 0, wait: i % 4 }));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const place = (a, t) => {
      const bob = p.id === 'coop' && a.wait > 0 ? Math.max(0, Math.sin(t * 9 + a.h)) * 0.12 : 0;
      q.setFromAxisAngle(up, a.h);
      m.compose(v.set(a.x, kind.y, a.z), q, s.set(...kind.body)); bodies.setMatrixAt(a.i, m);
      const hx = Math.sin(a.h) * kind.body[2] * 0.55, hz = Math.cos(a.h) * kind.body[2] * 0.55;
      m.compose(v.set(a.x + hx, kind.y + kind.body[1] * 0.3 - bob * 3, a.z + hz), q, s.set(kind.body[0] * 0.5, kind.body[1] * 0.55, kind.body[0] * 0.55)); heads.setMatrixAt(a.i, m);
      if (patches) { m.compose(v.set(a.x + 0.2, kind.y + 0.25, a.z - 0.2), q, s.set(0.7, 0.6, 0.9)); patches.setMatrixAt(a.i, m); }
    };
    herd.forEach((a, i) => { a.i = i; a.tx = a.x; a.tz = a.z; place(a, 0); });
    const speed = p.id === 'coop' ? 0.8 : 0.35;
    dyn.update = (dt, t, near) => {
      if (!near) return;
      for (const a of herd) {
        if (a.wait > 0) a.wait -= dt;
        else {
          const dx = a.tx - a.x, dz = a.tz - a.z, dd = Math.hypot(dx, dz);
          if (dd < 0.2) { a.tx = f.x0 + 2 + Math.random() * (w - 4); a.tz = f.z0 + 2 + Math.random() * (d - 4); a.wait = 2 + Math.random() * 8; }
          else { a.x += (dx / dd) * speed * dt; a.z += (dz / dd) * speed * dt; a.h = Math.atan2(dx, dz); }
        }
        place(a, t);
      }
      bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true; if (patches) patches.instanceMatrix.needsUpdate = true;
    };
  }
  return dyn;
}

// ── Vehicles ──────────────────────────────────────────────────────────────
const lightMat = new THREE.MeshLambertMaterial({ color: 0xfff6d8, emissive: 0xfff0c0, emissiveIntensity: 0 });
const tailMat = new THREE.MeshLambertMaterial({ color: 0x8a1a1a, emissive: 0xff2a1a, emissiveIntensity: 0 });
function makeTruck(colour) {
  const b = new Builder();
  b.block(colour, 2.1, 1.6, 2.0, 0, 0.55, 2.2);                    // cab, facing +z
  b.box(GLASS, 1.9, 0.7, 0.06, 0, 1.75, 3.21);
  b.block(0x5a5f66, 2.2, 0.25, 4.4, 0, 0.6, -1.2);                   // tray
  for (const x of [-1.08, 1.08]) b.block(0x5a5f66, 0.06, 0.5, 4.4, x, 0.85, -1.2);
  b.block(0x5a5f66, 2.2, 0.5, 0.06, 0, 0.85, -3.38);
  for (const z of [2.2, -0.4, -2.4]) for (const x of [-1.05, 1.05]) b.cyl(0x1d1d1d, 0.42, 0.3, x, 0.42, z, 0, Math.PI / 2);
  const g = b.build();
  const lights = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.2, 0.05), lightMat); lights.position.set(0, 1.0, 3.22); g.add(lights);
  const tails = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.05), tailMat.clone()); tails.position.set(0, 0.9, -3.42); g.add(tails);
  const load = new THREE.InstancedMesh(new THREE.BoxGeometry(0.85, 0.6, 0.85), new THREE.MeshLambertMaterial({ color: 0x9a7448 }), 10);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 10; i++) { m.makeTranslation(-0.48 + (i % 2) * 0.96, 1.15 + Math.floor(i / 6) * 0.62, 0.6 - Math.floor((i % 6) / 2) * 1.0 - (i >= 6 ? 0.5 : 0)); load.setMatrixAt(i, m); }
  load.count = 0; g.add(load);
  return { group: g, load, tails };
}
function makeTrain() {
  const b = new Builder();
  b.block(0x2a5a3a, 10, 3, 2.8, 0, 0.6, 0); b.box(0x1d1d1d, 2.6, 1.4, 2.4, 4.0, 4.3, 0); b.cyl(0x1d1d1d, 0.35, 1, -3.5, 4.1, 0);
  for (let i = 0; i < 4; i++) { const x = -11.5 - i * 11; b.block([0x8a4a2a, 0x5a6a7a, 0x8a7a4a, 0x6a3a3a][i], 10, 2.6, 2.8, x, 0.6, 0); }
  for (let x = 4; x > -56; x -= 2.5) for (const z of [-RAIL_GAUGE/2, RAIL_GAUGE/2]) b.cyl(0x1d1d1d, 0.45, 0.25, x, 0.67, z, Math.PI / 2);
  return b.build();
}
// A simple bicycle for villagers riding across town.
function makeBike() {
  const b = new Builder();
  for (const z of [-0.55, 0.55]) b.add('torus', 0x1d1d1d, 0.68, 0.68, 0.68, 0, 0.34, z, 0, Math.PI / 2, 0); // wheels upright, along +z
  b.box(0x2f6bb8, 0.06, 0.06, 1.0, 0, 0.62, 0); b.box(0x2f6bb8, 0.06, 0.5, 0.06, 0, 0.6, -0.15); b.box(0x2a2a2a, 0.5, 0.05, 0.05, 0, 0.98, 0.5);
  return b.build();
}

// Shirts by job, so a baker looks like a baker from across the street.
const UNIFORM = { farmer: 0x5b7a3a, 'dairy hand': 0x3a6a8a, 'poultry keeper': 0x8a6a3a, shearer: 0x6a5a4a, miller: 0xd8d0c0, baker: 0xf4f0e8, barista: 0x2f5a4a, cook: 0xf4f0e8,
  'security guard':0x233e55, 'security dispatcher':0x354a64, 'security duty supervisor':0x304b61,
  'security receptionist':0x4b6175, 'qualified locksmith':0x86624a, 'locksmith apprentice':0x9b754e,
  grocer: 0x3f7a3a, shopkeeper: 0x2f6b8c, butcher: 0xb8413a, publican: 0x5a3a2a, postie: 0xc83a2a, 'truck driver': 0xe88a2a, teacher: 0x7a4a8a, nurse: 0x7ab0d8, mayor: 0x2a2a3a,
  'station master': 0x2a3a5a, programmer: 0x4a4a5a, retired: 0xa88a6a, student: 0x2f5aa8, artist: 0xd86a8a };

// ── Sky ───────────────────────────────────────────────────────────────────
const GREY = new THREE.Color(0x9aa3ad), DAY_SKY = new THREE.Color(0x96c9f0), NIGHT_SKY = new THREE.Color(0x0b1430), DUSK = new THREE.Color(0xf0a070);
function makeStars() {
  const n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.3, r = 160; pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false }));
}

export function createTownLife({ scene, town, makeLabel, sky, hemi, sun, fog, activity }) {
  const homes = [...town.lots.values()].map((l) => ({ coordinate: l.house.coordinate, name: l.house.name, door: { x: l.doorPos.x, z: l.doorPos.z } }));
  const life = new TownLife({ homes });
  let saved = null; try { saved = JSON.parse(localStorage.getItem(STORE)); } catch { /* blocked storage */ }
  // A save that is malformed or from a newer version is left untouched in storage rather than overwritten.
  let saveBlocked = false;
  if (saved) {
    if (saved.v === 1 && life.restore(saved.life)) life.speed = saved.speed || 1;
    else { saveBlocked = true; life.speed = 1; console.warn('[Repository Town] Saved town is unsupported or invalid; keeping it instead of overwriting it.'); }
  } else life.speed = 1;
  const save = () => { if (saveBlocked) return false; try { localStorage.setItem(STORE, JSON.stringify({ v: 1, life: life.snapshot(), speed: life.speed })); return true; } catch { return false; /* storage full or blocked */ } };

  const group = new THREE.Group(); town.group.add(group);
  // Crossing controller must resolve the depot BEFORE its initial gate update.
  const depot = life.place('depot');
  const colliders = [], spots = [], seats = [], displays = [], fields = [], labels = [];
  const statics = new Builder(); statics.glass = [];

  // Villagers' houses: letterbox and meter box out the front; air conditioner, shed and mower,
  // rotary clothesline, vegie patch and sprinkler in the back yard, well away from the footpaths.
  for (const v of life.villagers) {
    const lot = town.lots.get(v.home.coordinate); if (!lot) continue;
    const { fp } = lot, ox = lot.lot.x, oz = lot.lot.z, back = -fp.d / 2;
    const place = (type, x, z, rot = 0, solid = PROPS[type].solid) => {
      // A8–F8 have short yards backing onto the realigned rail reservation.
      // Never spawn detached equipment, a shed or foliage beneath a train.
      const asset=PROPS[type], assetDepth=Math.abs(Math.sin(rot))>.5?asset.w:asset.d;
      if(v.home.coordinate.endsWith('8') && !railSideYardClear(oz+z,assetDepth))return;
      statics.at(ox + x, 0, oz + z, rot, () => PROPS[type].build(statics, {}));
      if (solid) { const p = PROPS[type], side = Math.abs(Math.sin(rot)) > 0.5; statics.solid(side ? p.d : p.w, side ? p.w : p.d, ox + x, oz + z); }
    };
    const clear = (x, z) => !(fp.yardObjects || []).some((b) => x > b.x0 - 0.5 && x < b.x1 + 0.5 && z > b.z0 - 0.5 && z < b.z1 + 0.5);
    const lx = [1.5, -1.5, 2.4, -2.4].map((d) => fp.door.x + d).find((x) => clear(x, fp.front + 3.9));
    if (lx !== undefined) place('letterbox', lx, fp.front + 3.9, 0, false);
    place('meterBox', fp.w / 2 + 0.08, 0, Math.PI / 2, false);
    place('acUnit', fp.w / 2 - 1.2, back - 0.35, Math.PI);
    place('shed', -4.5, back - 7.5);
    place('mower', -2.3, back - 6.4, 0.3, false);
    place('clothesline', 2.6, back - 5.2);
    place('vegiePatch', 3.2, back - 9.6);
    place('sprinkler', 3.2, back - 8.3);
  }

  // Protected railway reservation between street 7 and the rear of row 8.
  // Render ballast FIRST, then sleepers and standard-gauge rail heads. Earlier
  // the track was at z=136, literally embedded in street 7's southern footpath.
  const half = town.bounds.width / 2, trackLength = half * 2 + 60;
  statics.box(0x82796c, trackLength, 0.08, 5.6, 0, 0.035, RAIL_Z); // ballast shoulder
  statics.box(0x68645e, trackLength, 0.08, 3.6, 0, 0.082, RAIL_Z); // compacted trackbed
  for (let x = -half - 30; x < half + 30; x += 0.75) {
    if (!withinLevelCrossing(x, 0.2))
      statics.box(0x594437, 0.24, 0.13, 2.6, x, 0.135, RAIL_Z);
  }
  for (const z of [RAIL_Z - RAIL_GAUGE/2, RAIL_Z + RAIL_GAUGE/2])
    statics.box(0x92989c, trackLength, 0.11, 0.095, 0, 0.222, z);
  // Road-crossing infill lies BELOW the running rail heads and gives paved
  // avenue approaches continuous access. Keep flangeways visible either side.
  for (const crossing of RAIL_CROSSINGS) {
    const x = crossing.x;
    statics.box(0x3b3d3f, 9.0, 0.06, RAIL_GAUGE-0.24, x, 0.155, RAIL_Z);
    for (const side of [-1, 1]) {
      statics.box(0x424548, 9.0, 0.06, 0.78, x, 0.155, RAIL_Z+side*1.22);
      // Approach warning signs are on the road verge, not inside the track gauge.
      const signX = x - 4.65, signZ = RAIL_Z + side*9.5;
      statics.cyl(0x747879, 0.07, 2.7, signX, 1.35, signZ);
      statics.box(0xf4f2e8, 1.15, 0.18, 0.09, signX, 2.6, signZ);
      statics.box(0xd92f32, 0.76, 0.13, 0.10, signX, 2.25, signZ);
    }
  }

  // Continuous, solid rail-side fencing with safe pedestrian/vehicle openings
  // only at the six level crossings. End-to-end fences prevent walking onto
  // the track between streets; fence solids share the player's collision world.
  const fenceEnds=[-half-30,...RAIL_CROSSINGS.flatMap(c=>[c.x-6.5,c.x+6.5]),half+30];
  for(let i=0;i+1<fenceEnds.length;i+=2){
    const a=fenceEnds[i],b=fenceEnds[i+1],len=b-a;
    if(len<=0)continue;
    for(const side of [-1,1]){
      const z=RAIL_Z+side*4.15,centre=(a+b)/2;
      for(const y of [0.65,1.32])statics.box(0x6e7676,len,0.08,0.1,centre,y,z);
      for(let x=a;x<=b;x+=4)statics.block(0x667274,0.12,1.48,0.14,x,0,z);
      statics.solid(len,0.25,centre,z);
    }
  }
  // Warning and road-user control gates live at the approach lines, clear of
  // the running rail / train envelope. Pavement remains accessible when open.
  // The real in-game train stops at the separate northern freight terminal.
  // Warehouse/depot R8 handles onward road dispatch; trackside infrastructure
  // is in its own world-space mesh, not merged into the R8 building shell.
  const terminal=life.place('depot'),tx=terminal.x;
  const apronZ=RAIL_Z+RAIL_DEPOT_PLATFORM_SETBACK;
  statics.box(0xb8b0a0,24,0.9,RAIL_DEPOT_PLATFORM_DEPTH,tx,0.45,apronZ);
  statics.box(0xe3c32f,24,0.025,0.14,tx,0.91,
    apronZ-RAIL_DEPOT_PLATFORM_DEPTH/2+0.25);
  statics.box(0x8a6545,10,0.20,2.6,tx,3.2,apronZ);
  for(const dx of [-4.5,4.5]){
    statics.block(0x8a6545,0.2,2.3,0.2,tx+dx,0,apronZ+1);
    statics.solid(0.3,0.3,tx+dx,apronZ+1);
  }
  // Accessible grade-level maintenance route on the landward side; no
  // platform ramp is asserted from a fictitious passenger train service.
  statics.box(0xaaa8a0,132,0.05,1.8,tx,0.025,RAIL_Z+9.2);
  statics.box(0x536b76,5,1.2,0.1,tx,3.5,apronZ+1.5);
  // On-site terminal and dispatch warehouse remain functionally distinct.
  // Each civic building is its own mesh (plus one for its glass), so it can be hidden while the
  // player is inside it and looking out of its windows (src/main.js renderFrame).
  const shopGlassMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0xffc070, emissiveIntensity: 0 });
  const buildings = new Map(), signs = [], shopGlazing = [];
  // Farms get a painted sign on two posts at the gate.
  const farmSign = (p) => {
    const x = p.x + 5.8, z = LOT8_Z + 8.2;
    for (const dx of [-1.2, 1.2]) { statics.solid(0.15, 0.15, x + dx, z); statics.block(WOOD, 0.12, 1.85, 0.12, x + dx, 0, z - 0.04); }
    signs.push({place:p, text: p.name, x, y: 1.5, z, w: 2.6, h: 0.6, bg: '#f3ead2', fg: '#3a2a1e' });
  };
  for (const p of life.places.values()) {
    // Permanently painted, readable opening-hour plaques on EVERY civic facade.
    // One shared atlas and merged mesh keeps these signs cheap on Android.
    // Operational 24h sites publish visitor reception hours, not factory hours.
    const south=p.side==='south';
    if(p.side==='north') { /* north-facing signs are authored after facade */ }
    else signs.push({place:p,text:openingHoursLabel(p),x:p.x+3.35,y:2.95,
      z:south?FIELD_Z0-0.25:LOT8_Z+7.28,
      w:4.35,h:0.40,rotY:south?Math.PI:0,bg:'#f2ead6',fg:'#302c25'});
    const b = new Builder(); b.glass = [];
    const finish = () => {
      const meshes = [b.build()], glass = Builder.merge(b.glass);
      if (glass) {
        const material = shopGlassMat.clone();
        material.emissive.setHex(interiorPalette(p.id).colour);
        meshes.push(new THREE.Mesh(glass, material));
        shopGlazing.push({place:p,material});
      }
      group.add(...meshes); colliders.push(...b.solids); buildings.set(p.id, meshes);
    };
    const kind = BUILD[p.id] ? p.id : p.kind === 'farm' ? 'farm' : p.kind === 'home' ? 'farmhouse' : p.kind === 'park' ? 'square' : p.id;
    let fp;
    // South-side civic sites face the street (−z) from across the road.
    if (p.side === 'south') {
      b.at(p.x, 0, FIELD_Z0 + 7, Math.PI, () => { fp = BUILD[p.id](b); });
      const southBlock = { x0: p.x - fp.w / 2, x1: p.x + fp.w / 2, z0: FIELD_Z0, z1: FIELD_Z0 + fp.d };
      const southRoof = civicRoofTop(b.parts, southBlock);
      colliders.push(southRoof === null ? southBlock : { ...southBlock, top: southRoof });
      // Verandah posts out on the footpath are solid too (local x/z turned to face the road).
      for (const [lx, lz] of fp.posts || []) colliders.push({ x0: p.x - lx - 0.1, x1: p.x - lx + 0.1, z0: FIELD_Z0 + 7 - lz - 0.1, z1: FIELD_Z0 + 7 - lz + 0.1 });
      // Keep the business name clear of the roofline and deep colonnades:
      // a freestanding, non-colliding sign just outside the south doorway.
      const sign = makeLabel(p.address+' · '+p.name, 'house');
      sign.position.set(p.x, 3.85, FIELD_Z0 - 4.6);
      group.add(sign); labels.push(sign);
      spots.push({ key: `place:${p.id}`, id: p.id, pos: new THREE.Vector3(p.x, 0, FIELD_Z0 - 2.4), label: `${p.name} — ${{ bank: 'your account', fire: 'station board', emergency: 'station board', hotel: 'reception', utility: 'the plant', industry: 'the works', farm: 'see how it\'s farmed' }[p.kind] || 'look inside'}` });
      const at = SIGN_AT[p.id];   // turned to face the road, like the building
      if (at) signs.push({place:p, text: p.name, x: p.x - at[0], y: at[1], z: FIELD_Z0 + 7 - at[2], w: at[3], h: at[4], rotY: Math.PI, bg: at[5], fg: at[6] });
      if(p.field)fields.push({p,...buildField(p,group,statics,statics.glass)});
      finish();
      continue;
    }
    // North-facing infill on an EXISTING road (e.g. Creative Court 7-N).
    // Massing fits within 12 m depth between the roadway and rear of row's houses.
    if (p.side === 'north') {
      b.at(p.x,0,p.originZ,Math.PI,()=>{fp=buildExpansionFacade(b,p);});
      const northBlock = fp ? { x0: p.x - fp.w / 2, x1: p.x + fp.w / 2,
        z0: p.originZ - 7, z1: p.originZ - 7 + fp.d } : null;
      const northRoof = northBlock ? civicRoofTop(b.parts, northBlock) : null;
      finish();
      // The facade front is p.originZ-7. The entire footprint stays behind it (+z).
      if(northBlock) colliders.push(northRoof === null ? northBlock : { ...northBlock, top: northRoof });
      const marker=makeLabel(p.address+' · '+p.name,'house');
      marker.position.set(p.x,3.6,p.originZ-10.8);group.add(marker);labels.push(marker);
      // Nameboard faces northwards onto existing road; no fake new street.
      signs.push({place:p,text:p.name,x:p.x,y:p.style==='heritage'?4.9:3.75,
        z:p.originZ-7.35,w:10.2,h:.57,rotY:Math.PI,
        bg:'#263b4e',fg:'#f5eddb'});
      signs.push({place:p,text:openingHoursLabel(p),x:p.x+3.0,y:2.95,
        z:p.originZ-7.35,w:4.3,h:.36,rotY:Math.PI,
        bg:'#f3e8d5',fg:'#293840'});
      spots.push({key:'place:'+p.id,id:p.id,pos:new THREE.Vector3(p.x,0,p.front.z),
        label:p.name+' — visit '+p.address});
      continue;
    }
    // The wheat farm's silos stand behind its shed, clear of the end of the avenue (9.5 m out).
    b.at(p.x, 0, LOT8_Z, 0, () => {
      if (kind === 'farm') { const [w, d, h, wall, roof] = FARM_SHED[p.id]; shed(b, w, d, h, wall, roof); fp = { w, d }; if (p.id === 'silo') { for (const x of [2.5, 6]) { b.solid(2.6, 2.6, x, -9); b.cyl(0xc8c8c0, 1.4, 9, x, 4.5, -9); b.cone(0xa8a8a0, 1.6, 1.4, x, 9.7, -9); } } }
      else fp = BUILD[kind](b);
    });
    const coreBlock = fp ? { x0: p.x - fp.w / 2, x1: p.x + fp.w / 2,
      z0: LOT8_Z + (fp.front ?? 7) - fp.d, z1: LOT8_Z + (fp.front ?? 7) } : null;
    const coreRoof = coreBlock ? civicRoofTop(b.parts, coreBlock) : null;
    finish();
    if (SHOPFRONT[p.id]) { const [w, h] = SHOPFRONT[p.id], [bg, fg] = SHOP_COLOURS[p.id]; signs.push({place:p, text: p.name, x: p.x, y: h - 0.55, z: LOT8_Z + 7.15, w: w * 0.6, h: 0.7, bg, fg, cross: p.id === 'clinic' }); }
    else if (SIGN_AT[p.id]) { const at = SIGN_AT[p.id]; signs.push({place:p, text: p.name, x: p.x + at[0], y: at[1], z: LOT8_Z + at[2], w: at[3], h: at[4], bg: at[5], fg: at[6] }); }
    else if (p.kind === 'farm') farmSign(p);
    if (fp) {
      const z0=LOT8_Z+(fp.front??7)-fp.d,z1=LOT8_Z+(fp.front??7);
      // Retain the outside-world solid body but leave the pub's actual front
      // doorway clear through the entry transition, including wheelchair radius.
      const roof = coreRoof === null ? {} : { top: coreRoof };
      if(p.id==='pub')colliders.push(
        {x0:p.x-fp.w/2,x1:p.x-1.05,z0,z1,...roof},
        {x0:p.x+1.05,x1:p.x+fp.w/2,z0,z1,...roof},
        {x0:p.x-1.05,x1:p.x+1.05,z0,z1:z1-.8,...roof});
      else colliders.push({x0:p.x-fp.w/2,x1:p.x+fp.w/2,z0,z1,...roof});
    }
    if (kind === 'square') {
      colliders.push({ x0: p.x - 2.7, x1: p.x + 2.7, z0: LOT8_Z - 6.7, z1: LOT8_Z - 1.3 });
      for(const [i,x,z,yaw] of [[0,-6,-4,Math.PI/2],[1,6,-4,-Math.PI/2],[2,0,3,Math.PI],[3,0,-11,0]])
        seats.push(makeSeat('square:bench:'+i,'bench',p.x+x,LOT8_Z+z,yaw,{label:'Market Square bench'}));
    }
    // Name board over the door.
    // Place signs forward of awnings, pillars and the Town Hall portico,
    // rather than embedding the billboard behind the roof or facade.
    const sign = makeLabel(p.address+' · '+p.name, 'house');
    sign.position.set(p.x, kind === 'square' ? 3.2 : 3.85,
      LOT8_Z + (kind === 'square' ? 11 : 12.4));
    group.add(sign); labels.push(sign);
    // The place's counter: stand on the footpath in front and press E.
    spots.push({ key: `place:${p.id}`, id: p.id, pos: new THREE.Vector3(p.x, 0, LOT8_Z + 10.4), label: p.kind === 'farm' ? `${p.name} — see how it's farmed` : p.kind === 'park' ? 'Market Square notice board' : p.id === 'hall' ? 'Town Hall — the Town Ledger' : `${p.name} — ${p.kind === 'shop' || p.kind === 'cafe' || p.kind === 'pub' ? 'see what\'s on the shelves' : 'look inside'}` });
    // Field across the road.
    if (p.field) fields.push({ p, ...buildField(p, group, statics, statics.glass) });
    // Goods on display, following the stock.
    const add = (good, slots, read, full) => displays.push(display(group, good, slots.map((s) => ({ ...s, x: s.x + p.x, z: s.z + LOT8_Z })), read, full));
    const st = (g) => () => p.stock[g], out = (g) => () => p.out[g];
    if (p.id === 'store') { add('eggs', grid(-4.8, 0.91, 8.6, 1.1, 0.7, 3, 3, 2), st('eggs'), 20); add('milk', grid(-3.6, 0.99, 8.6, 1.1, 0.7, 3, 3), st('milk'), 20); add('bread', grid(4.2, 0.95, 8.6, 2.2, 0.7, 5, 2), st('bread'), 10); add('flour', grid(-6.2, 0.18, 9.3, 0.6, 1.2, 1, 3, 2, 0.32), st('flour'), 10); add('coffee', grid(3.5, 1.25, 6.6, 2, 0.1, 6, 1), st('coffee'), 10); add('tea', grid(-3.5, 1.15, 6.6, 2, 0.1, 6, 1), st('tea'), 10); }
    if (p.id === 'bakery') { add('bread', grid(-3.6, 0.95, 8.6, 2.2, 0.7, 5, 3, 2, 0.16), out('bread'), 30); add('pie', grid(3.6, 0.9, 8.6, 2.2, 0.7, 5, 2), out('pie'), 12); add('flour', grid(-5.4, 0.18, 6.3, 0.1, 0.1, 1, 1).concat(grid(-5.4, 0.18, 5.6, 0.6, 1.2, 1, 3, 2, 0.32)), st('flour'), 12); }
    if (p.id === 'cafe') { add('pie', grid(-3.6, 1.0, 6.7, 2.4, 0.1, 6, 1), st('pie'), 6); add('bread', grid(3.6, 1.0, 6.7, 2.4, 0.1, 6, 1), st('bread'), 10); }
    if (p.id === 'greengrocer') { add('veg', [-4.2, -3.1].flatMap((x, i) => grid(x, i ? 0.42 : 0.42, 8.2, 0.85, 0.5, 3, 2).concat(grid(x, 0.12, 8.9, 0.85, 0.5, 3, 2))), st('veg'), 24); add('fruit', [3.1, 4.2].flatMap((x) => grid(x, 0.4, 8.2, 0.85, 0.5, 3, 2).concat(grid(x, 0.1, 8.9, 0.85, 0.5, 3, 2))), st('fruit'), 20); }
    if (p.id === 'butcher') add('lamb', [-3.4, 3.4].flatMap((x) => grid(x, 0.95, 8.4, 2.1, 0.7, 4, 2)), st('lamb'), 16);
    if (p.id === 'post') add('parcel', grid(-4.4, 0.13, 8.4, 1.2, 0.8, 2, 2, 3, 0.27), st('parcel'), 12);
    if (p.id === 'mill') { add('grain', grid(-4.6, 0.2, 5.6, 1.2, 1.6, 2, 3, 2, 0.32), st('grain'), 20); add('flour', grid(4.6, 0.2, 7.6, 2.4, 0.8, 4, 2, 2, 0.32), out('flour'), 20); }
    if (p.id === 'depot') { add('coffee', grid(-6, 1.05, RAIL_Z - LOT8_Z + 3.6, 1.6, 1, 4, 2, 2, 0.3), out('coffee'), 20); add('tea', grid(-3.6, 1.0, RAIL_Z - LOT8_Z + 3.6, 1.4, 1, 4, 2, 2, 0.18), out('tea'), 16); add('parcel', grid(5.5, 1.03, RAIL_Z - LOT8_Z + 3.6, 1.8, 1.2, 3, 2, 3, 0.27), out('parcel'), 18); }
    if (p.kind === 'farm') add(p.makes, grid(-5.2, p.makes === 'grain' ? 0.2 : 0.32, 8.4, 2.6, 1.0, 4, 2, 3, p.makes === 'grain' ? 0.32 : 0.14).map((s) => ({ ...s })), out(p.makes), 30);
    if (p.kind === 'farm' && p.makes !== 'grain') for (const x of [-6.2, -5.2, -4.2]) crate(statics, p.x + x, LOT8_Z + 8.4, 0.95, 1.0);
  }
  // Dedicated rail-depot delivery-vehicle parking: the three buses/trucks
  // have marked off-road bays (not parked in the 30 km/h traffic lanes).
  // Paint sits barely above the ground and does not obstruct pedestrians.
  for (let i=0; i<life.trucks.length; i++) {
    const bay=life.depotBay(i), x=bay.x,z=bay.z;
    statics.box(0x59636b,7.4,0.03,3.2,x,0.018,z);
    for (const side of [-1,1])
      statics.box(0xf2ecd1,0.10,0.045,3.1,x+side*3.7,0.044,z);
    statics.box(0xf2ecd1,7.3,0.045,0.10,x,0.044,z-1.58);
    statics.box(0xe0c35b,1.2,0.046,0.15,x,0.045,z+1.52);
  }
  // Painted zebra stripes mark the pedestrian-controlled crossing. These
  // surfaces are visual only, not solid obstacles in the walking/collision map.
  for(const crossing of SIGNAL_CROSSINGS){
    for(let i=-3;i<=3;i++)
      statics.box(0xf5f4e7,0.50,0.032,9.0,crossing.x+i*0.83,0.047,crossing.z);
    for(const sign of [-1,1])
      statics.box(0xf5eac9,0.14,0.037,4.8,
        crossing.x-sign*5.8,0.05,crossing.z+sign*1.8);
  }
  // A real main street: pavers from the footpath up to every shopfront (no lawn in between) and a
  // concrete kerb along both edges of the road. Gaps leave the avenue mouths and the depot's truck
  // bays clear.
  const STREET_Z = LOT8_Z + 16;
  const runs = (x0, x1, gaps) => {
    const cuts = [...AVENUES.map((a) => [a - 3.6, a + 3.6]), ...gaps].filter(([a, b]) => b > x0 && a < x1).sort((a, b) => a[0] - b[0]);
    const out = []; let at = x0;
    for (const [a, b] of cuts) { if (a > at) out.push([at, a]); at = Math.max(at, b); }
    if (x1 > at) out.push([at, x1]);
    return out;
  };
  // Street furniture on the pavement where one shop meets the next: a bench and a bin.
  const shopXs = [...life.places.values()].filter((q) => q.side !== 'south' && q.side !== 'north' && q.kind !== 'farm').map((q) => q.x).sort((a, b) => a - b);
  for (let i = 0; i + 1 < shopXs.length; i++) {
    const x = (shopXs[i] + shopXs[i + 1]) / 2, z = LOT8_Z + 8.3;
    if (AVENUES.some((a) => Math.abs(a - x) < 6)) continue;
    statics.solid(1.8, 0.6, x - 0.6, z);
    seats.push(makeSeat('street:bench:'+i,'bench',x-0.6,z,Math.PI,{label:'High Street bench'})); statics.block(WOOD, 1.8, 0.07, 0.5, x - 0.6, 0.45, z); statics.block(WOOD, 1.8, 0.45, 0.07, x - 0.6, 0.5, z - 0.25);
    for (const sx of [-1.45, 0.25]) statics.block(DARK, 0.08, 0.45, 0.5, x + sx, 0, z);
    statics.solid(0.5, 0.5, x + 1.1, z); statics.cyl(0x3f5a3a, 0.24, 0.9, x + 1.1, 0.45, z);
  }
  const depotX = life.place('depot').x;
  for (const [a, b] of runs(-186, 340, [[depotX - 22, depotX + 15]])) statics.box(0xcdc5b3, b - a, 0.07, 2.9, (a + b) / 2, 0.035, LOT8_Z + 8.45);
  for (const [a, b] of runs(-184, 131, [])) statics.box(0xcdc5b3, b - a, 0.07, 1.9, (a + b) / 2, 0.035, (STREET_Z + 6.1 + FIELD_Z0) / 2);
  for (const side of [-1, 1]) for (const [a, b] of runs(-330, 340, [])) statics.box(0xb9b4a8, b - a, 0.14, 0.2, (a + b) / 2, 0.07, STREET_Z + side * 4.6);
  group.add(statics.build());
  const signBoards = buildSignBoards(signs); if (signBoards) group.add(signBoards);
  // OPEN / CLOSED cards hanging in each shop's door glass, turned by the shop's real hours; a
  // faint glow stands in for the shop light behind them so CLOSED still reads after dark.
  const card = (text, colour) => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#f6f1e2'; x.fillRect(0, 0, 128, 64); x.strokeStyle = colour; x.lineWidth = 6; x.strokeRect(4, 4, 120, 56);
    x.fillStyle = colour; x.font = 'bold 34px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 64, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshLambertMaterial({ map: t, emissive: 0x6a6a6a, emissiveMap: t });
  };
  const doorCards = [];
  if (typeof document !== 'undefined') {
    const cardGeo = new THREE.PlaneGeometry(0.5, 0.25), openMat = card('OPEN', '#2f7a3a'), closedMat = card('CLOSED', '#b8413a');
    for (const id of Object.keys(SHOPFRONT)) {
      const q = life.place(id), m = new THREE.Mesh(cardGeo, openMat);
      m.position.set(q.x, 1.85, LOT8_Z + 7.12); group.add(m); doorCards.push({ q, m, openMat, closedMat });
    }
  }
  colliders.push(...statics.solids);
  const shopGlass = Builder.merge(statics.glass);
  if (shopGlass) group.add(new THREE.Mesh(shopGlass, shopGlassMat));

  // Dynamic signal heads: two visible poles, one per traffic approach.
  // Three emissive bulbs per head; no per-frame geometry or new point lights.
  const signalHeads=[];
  const mastGeo=new THREE.CylinderGeometry(0.09,0.12,3.7,8);
  const cabinetGeo=new THREE.BoxGeometry(0.62,1.60,0.44);
  const lampGeo=new THREE.SphereGeometry(0.19,10,8);
  const mastMat=new THREE.MeshLambertMaterial({color:0x666a70});
  const cabinetMat=new THREE.MeshLambertMaterial({color:0x222326});
  const lampColors={red:0xff3030,amber:0xffbb20,green:0x22e663};
  for(const site of SIGNAL_CROSSINGS){
    for(const side of [-1,1]){
      const head=new THREE.Group();
      head.position.set(site.x+side*7.4,0,site.z+side*6.3);
      const mast=new THREE.Mesh(mastGeo,mastMat);mast.position.y=1.85;head.add(mast);
      const box=new THREE.Mesh(cabinetGeo,cabinetMat);box.position.y=3.14;head.add(box);
      const bulbs={};
      for(const [name,y] of [['red',3.60],['amber',3.14],['green',2.68]]){
        const material=new THREE.MeshLambertMaterial({color:lampColors[name],emissive:0x050505});
        const light=new THREE.Mesh(lampGeo,material);
        light.position.set(0,y,0.26);head.add(light);bulbs[name]=material;
      }
      group.add(head);signalHeads.push(bulbs);
    }
  }
  let lastSignalPhase=null;
  function syncTrafficSignals(minute){
    const state=crossingState(minute),phase=state.vehicles;
    if(phase===lastSignalPhase)return;
    lastSignalPhase=phase;
    for(const bulbs of signalHeads)
      for(const [name,material] of Object.entries(bulbs))
        material.emissive.setHex(name===phase?lampColors[name]:0x050505);
  }
  syncTrafficSignals(life.minute);

  // Twelve paired boom arms, red warning lamps and crossing masts on six
  // north–south avenues. Controls derive from the SAME train timetable as the
  // rendered wagons; no random independent flashing or fake green lights.
  const railGates=[];
  const gateWhite=new THREE.MeshLambertMaterial({color:0xf5f3ec});
  const gateRed=new THREE.MeshLambertMaterial({color:0xc82828});
  const gateMast=new THREE.MeshLambertMaterial({color:0x5f6468});
  const gateLightOff=0x180707, gateLightOn=0xff3030;
  for(const crossing of RAIL_CROSSINGS){
    for(const approach of [-1,1]){
      const pivot=new THREE.Group();
      pivot.position.set(crossing.x-4.5,1.2,RAIL_Z+approach*7.4);
      const arm=new THREE.Mesh(new THREE.BoxGeometry(8,0.13,0.12),gateWhite);
      arm.position.x=4;pivot.add(arm);
      for(let j=0;j<6;j++){
        const patch=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.135,0.13),gateRed);
        patch.position.x=0.65+j*1.2; pivot.add(patch);
      }
      const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.13,2.5,8),gateMast);
      mast.position.set(crossing.x-4.5,1.25,RAIL_Z+approach*7.4);group.add(mast);
      const lamps=[];
      for(const dx of [-0.29,0.29]){
        const mat=new THREE.MeshLambertMaterial({color:0x9a2525,emissive:gateLightOff});
        const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.16,8,6),mat);
        bulb.position.set(crossing.x-4.5+dx,2.2,RAIL_Z+approach*7.4);
        group.add(bulb);lamps.push(mat);
      }
      group.add(pivot);railGates.push({crossing,pivot,lamps});
    }
  }
  function syncRailGates(minute){
    const flash=Math.floor(minute*8)%2===0;
    for(const gate of railGates){
      // One safety state drives actual road users, the player and the booms.
      // A fault keeps red warnings and gates down, and holds the freight train.
      const state=life.railGate(gate.crossing.x);
      gate.pivot.rotation.z=state.arm*Math.PI/2;
      gate.lamps.forEach((material,i)=>
        material.emissive.setHex(state.warning&&flash===(i===0)?gateLightOn:gateLightOff));
    }
  }
  syncRailGates(life.minute);

  // Windmill sails turn while the miller works.
  const mill = life.place('mill');
  const sb = new Builder(); for (let i = 0; i < 4; i++) sb.add('box', 0xe8e0d0, 0.9, 5, 0.08, Math.sin(i * Math.PI / 2) * 2.6, Math.cos(i * Math.PI / 2) * 2.6, 0, 0, 0, -i * Math.PI / 2);
  const sails = sb.build(); sails.position.set(mill.x, 9.5, LOT8_Z + 4.2); group.add(sails);
  // The tractor works the wheat paddock when a farmer is at work there.
  const silo = life.place('silo');
  const tb = new Builder(); tb.block(0x3a8a3a, 1.6, 1.0, 2.6, 0, 0.6, 0); tb.block(0x3a8a3a, 1.2, 1.2, 1.2, 0, 1.6, -0.5); tb.box(GLASS, 1.0, 0.8, 1.0, 0, 2.2, -0.5);
  for (const [x, z, r] of [[-0.95, -0.8, 0.75], [0.95, -0.8, 0.75], [-0.85, 0.9, 0.45], [0.85, 0.9, 0.45]]) tb.cyl(0x1d1d1d, r, 0.35, x, r, z, 0, Math.PI / 2);
  const tractor = tb.build(); group.add(tractor);
  const field = silo.field; let tractorS = 0;
  // Freight train.
  const train = makeTrain(); train.visible = false; train.position.set(0, 0, RAIL_Z);
  // The simulated freight runs WEST (decreasing x) on both legs. Rotate the
  // authored consist so the locomotive leads and its four wagons TRAIL east.
  train.rotation.y = Math.PI; group.add(train);
  // Trucks.
  const trucks = life.trucks.map((t, i) => { const v = makeTruck([0xd8562a, 0x2a6ab8, 0xe0b030][i]); group.add(v.group); return { t, ...v }; });
  // Service vehicles and crew are views of the persisted trade job lifecycle.
  // They are allocated once, then updated only when near the player.
  const serviceVan=makeTruck(0xf0ead5),hardwareFreight=makeTruck(0x4a8795);
  for(const v of [serviceVan,hardwareFreight]){
    v.group.scale.set(.66,.80,.78);v.group.visible=false;group.add(v.group);
    v.load.count=0;
  }
  const crewModels=new Map();
  const setCrew=(id,x,z,active,nearby)=>{
    if(!crewModels.has(id)){
      const fig=makeDistinctPerson('trade-crew:'+id);
      const tag=makeLabel(id==='kai'?'Kai · apprentice':id==='mia'?'Mia · apprentice':
        id==='sam'?'Samir · plumber':id==='ella'?'Ella · electrician':
        id==='noah'?'Noah · builder':'Ivy · IT technician','interactive');
      tag.position.y=2.2;fig.group.add(tag);group.add(fig.group);
      crewModels.set(id,{fig,tag});
    }
    const c=crewModels.get(id);
    c.fig.group.visible=active&&nearby;
    if(!c.fig.group.visible)return;
    c.fig.group.position.set(x,0,z);
    c.tag.visible=Math.hypot(x-eyeCached.x,z-eyeCached.z)<8;
  };
  const eyeCached={x:0,z:0};
  // Parcels waiting on doorsteps.
  const parcels = new THREE.InstancedMesh(GOOD_GEO.parcel[0], new THREE.MeshLambertMaterial({ color: 0xb08a5a }), 40);
  parcels.count = 0; group.add(parcels);
  let parcelSig = '';

  // Villagers.
  const residentModels = createResidentModels();
  const people = life.villagers.map((v, i) => {
    const fig = makeDistinctPerson('villager:'+v.id+':'+v.name+':'+(v.job||''),v);
    fig.phase = i * 1.7;
    const body = [...fig.group.children];   // the block figure; a chosen resident style hides it
    const bike = makeBike(); bike.visible = false; fig.group.add(bike);
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.18), new THREE.MeshLambertMaterial({ color: [0x3a7a3a, 0xc8a878, 0x2a5a8a][i % 3] })); bag.position.set(0.36, 0.72, 0.05); bag.visible = false; fig.group.add(bag);
    const tag = makeLabel(v.name, 'interactive'); tag.position.set(0, 2.25, 0); fig.group.add(tag);
    fig.group.position.set(v.x, 0, v.z); group.add(fig.group);
    return { v, fig, body, bike, bag, tag, heading: 0, last: { x: v.x, z: v.z }, key: `villager:${i}`, pos: new THREE.Vector3(v.x, 0, v.z), talking: false };
  });

  const populationView=createPopulationView(life,group,makeLabel);

  // Sky dressing.
  const stars = makeStars(); scene.add(stars);
  // Rain falls in a box around the player on rainy days.
  const rainPos = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) { rainPos[i * 3] = (Math.random() - 0.5) * 60; rainPos[i * 3 + 1] = Math.random() * 22; rainPos[i * 3 + 2] = (Math.random() - 0.5) * 60; }
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xaac4dd, size: 0.12, transparent: true, opacity: 0.6, depthWrite: false }));
  rain.visible = false; rain.frustumCulled = false; scene.add(rain);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf2efe0, fog: false })); scene.add(moon);
  // Visible, correctly positioned sun disk (the DirectionalLight alone is invisible).
  // ~0.8° angular diameter, against the actual solar azimuth/elevation.
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xfff0c4, fog: false, depthWrite: false }));
  sunDisc.name = 'Astronomical sun disk (Narromine)'; sunDisc.visible = false; scene.add(sunDisc);
  const hemiDay = new THREE.Color(0xffffff), hemiNight = new THREE.Color(0x7a8ac0), bg = new THREE.Color();
  const warmSun = new THREE.Color(0xffa25b), clearSun = new THREE.Color(0xfff3df);
  let lastSolar = null;

  // Town clock face on the Town Hall: a little canvas updated once a town minute.
  const hall = life.place('hall');
  const clockCanvas = document.createElement('canvas'); clockCanvas.width = 128; clockCanvas.height = 128;
  const clockTex = new THREE.CanvasTexture(clockCanvas); clockTex.colorSpace = THREE.SRGBColorSpace;
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({ map: clockTex }));
  clockFace.position.set(hall.x, 11.6, LOT8_Z + 3.02); group.add(clockFace);
  let clockMinute = -1;
  function drawClock(minute) {
    const c = clockCanvas.getContext('2d'); c.clearRect(0, 0, 128, 128);
    c.fillStyle = '#f6f1e2'; c.beginPath(); c.arc(64, 64, 62, 0, Math.PI * 2); c.fill(); c.lineWidth = 5; c.strokeStyle = '#2a2a2a'; c.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.fillStyle = '#2a2a2a'; c.fillRect(64 + Math.sin(a) * 50 - 2, 64 - Math.cos(a) * 50 - 2, 4, 4); }
    const hand = (a, len, w) => { c.lineWidth = w; c.beginPath(); c.moveTo(64, 64); c.lineTo(64 + Math.sin(a) * len, 64 - Math.cos(a) * len); c.stroke(); };
    hand(((minute / 60) % 12) / 12 * Math.PI * 2, 30, 6); hand((minute % 60) / 60 * Math.PI * 2, 46, 4);
    clockTex.needsUpdate = true;
  }

  // Seconds of real time per town minute at speed 1: SEC_PER_MIN. speed multiplies it.
  let saveTimer = 0, tick = 0;
  const events = [];   // sounds for the ambience: { kind: 'bell'|'horn', n?, x, z }
  let lastHour = Math.floor(life.minute / 60), hornDone = -1;
  let currentConversation=null,conversationElapsed=0;
  // `view` is set while the player is indoors and looking out of a window: the camera standing
  // at the matching spot in town (src/world/windows.js), so the street keeps moving out there.
  function update(dt, t, { player, mode, overview, camera, talkingTo, view = null }) {
    const inTown = mode === 'town', eye = view ? view.position : player.pos, skyCam = view || camera;
    life.obstacles = inTown ? [player.pos] : [];
    // Proximity alone is NOT consent to an endless conversation. Only the
    // explicitly opened interaction panel pauses a resident, for at most
    // 15 real seconds. Work, dinner and sleep resume even if it stays open.
    if(talkingTo!==currentConversation){currentConversation=talkingTo;conversationElapsed=0;}
    if(currentConversation)conversationElapsed+=Math.max(0,dt);
    for(const p of people){
      const d=Math.hypot(p.v.x-player.pos.x,p.v.z-player.pos.z);
      p.v.engaged=inTown&&!p.v.inside&&talkingTo===p&&conversationElapsed<15&&d<4.2;
    }
    let minutes = Math.min(dt, 0.25) * life.speed / SEC_PER_MIN;
    while (minutes > 0) { const step = Math.min(minutes, 0.5); life.tick(step); minutes -= step; }
    if ((saveTimer += dt) > 10) { saveTimer = 0; save(); }
    const m = life.minute;
    syncTrafficSignals(m);
    syncRailGates(m);
    if (Math.floor(m) !== clockMinute) { clockMinute = Math.floor(m); drawClock(m); }
    // The Town Hall bell strikes the hour; the freight train sounds its horn coming in.
    const hour = Math.floor(m / 60);
    if (hour !== lastHour) { lastHour = hour; if (hour >= 7 && hour <= 21) events.push({ kind: 'bell', n: hour % 12 || 12, x: hall.x, z: LOT8_Z }); }
    if (m >= 405 && m < 410 && hornDone !== life.day) { hornDone = life.day; events.push({ kind: 'horn', x: trainX(m, depot.x) ?? depot.x, z: RAIL_Z }); }

    // Sky and lights follow the clock everywhere; indoors only the town's state changes.
    // Solar coordinates are computed from Narromine's civil date and in-game
    // clock, NOT from the player's device time. Daylight and dawn now vary by season.
    const solar = solarPosition(townDate(life.day), m);
    lastSolar = { ...solar, gameDay: life.day, gameMinute: m };
    const day = solarDaylight(solar.elevation), dark = THREE.MathUtils.clamp((0.55 - day) / 0.45, 0, 1);
    // Name boards and opening-hours plaques are floodlit after dark, so they stay readable.
    // All single-mesh and batched sign atlases are lit by setLighting below.
    // A batched atlas is a THREE.Group, with no .material of its own.
    const dusk = solarWarmth(solar.elevation) * 0.50;
    bg.copy(NIGHT_SKY).lerp(DAY_SKY, day).lerp(DUSK, dusk);
    const weather = life.civic.weather, overcast = weather === 'rainy' ? 0.55 : weather === 'cloudy' ? 0.3 : 0;
    if (overcast) bg.lerp(GREY.clone().multiplyScalar(0.3 + 0.7 * day), overcast);
    if (inTown && !overview) { scene.background.copy(bg); fog.color.copy(bg); }
    else if (view) fog.color.copy(bg);
    else if (inTown) scene.background.copy(bg);
    hemi.intensity = (0.5 + 1.6 * day) * (1 - overcast * 0.35); hemi.color.copy(hemiNight).lerp(hemiDay, day);
    // Geographic north is world -Z; sunlight travels over the *northern* sky
    // at solar noon. A separate shadow rig relocates this directional ray
    // near the player without changing its azimuth or elevation.
    sun.position.set(solar.direction.x * 165, solar.direction.y * 165, solar.direction.z * 165);
    sun.intensity = 2.15 * day * (1 - overcast * 0.72);
    sun.color.copy(clearSun).lerp(warmSun, solarWarmth(solar.elevation) * 0.85);
    sunDisc.visible = (inTown || !!view) && !overview && solar.elevation > -1.4 && solar.elevation < 89.9 && weather !== 'rainy';
    if (sunDisc.visible) sunDisc.position.copy(skyCam.position).addScaledVector(
      new THREE.Vector3(solar.direction.x, solar.direction.y, solar.direction.z), 132);
    stars.visible = moon.visible = (inTown || !!view) && dark > 0.2 && !overcast;
    rain.visible = (inTown || !!view) && !overview && weather === 'rainy';
    if (rain.visible) {
      rain.position.set(skyCam.position.x, 0, skyCam.position.z);
      const a2 = rain.geometry.attributes.position;
      for (let i = 0; i < a2.count; i++) { let y = a2.getY(i) - dt * 14; if (y < 0) y += 22; a2.setY(i, y); }
      a2.needsUpdate = true;
    }
    if (stars.visible) { stars.position.copy(skyCam.position); stars.material.opacity = Math.min(1, dark * 1.2);
      moon.position.set(skyCam.position.x - solar.direction.x * 135,
        skyCam.position.y + Math.max(30, -solar.direction.y * 135), skyCam.position.z - solar.direction.z * 135); }
    // A blackout puts out the windows and street lamps (src/world/life.js utilities).
    const powered = life.civic.powerGrid ? life.civic.powerGrid.served > 0 : life.civic.supply.ok; // a local fault must not darken every lamp
    town.setNight(powered ? dark : 0, m, eye, powered, id=>pilotMains(life,id) ?? powered);
    for (const {place,material} of shopGlazing)
      material.emissiveIntensity = (pilotMains(life,'B:'+place.id) ?? powered) && shopLightingOn(place,m) ? dark*.75 : 0;
    signBoards?.userData.setLighting(dark, powered, m);
    // Electric circuits are separate from sunset and reception access.
    for(const child of scene.children)if(child.userData.updateLighting){
      const id=child.userData.lightingSite;
      const customer=['clinic','waterworks','sewage','bakery'].includes(id)?id:
        ['mill','foundry','soyplant'].includes(id)?'industry':null;
      const pilot=pilotMains(life,id.startsWith('H:')||id.startsWith('B:')?id:'B:'+id);
      child.userData.updateLighting(pilot??(customer?life.gridPowered(customer):powered));
    }
    for (const d of doorCards) d.m.material = facilityAccess(life, d.q).allowed ? d.openMat : d.closedMat;
    lightMat.emissiveIntensity = dark > 0.3 ? 1.4 : 0;  // vehicle headlights run on their own batteries
    eyeCached.x=eye.x;eyeCached.z=eye.z;
    if (!inTown && !view) return;

    // Moving things are only updated near the player; far ones are hidden by fog anyway.
    const near = (x, z, r) => Math.abs(x - eye.x) < r && Math.abs(z - eye.z) < r;
    const outdoorSelection = activity?.outdoor([...people.map(p=>p.v), ...(life.population?.additional||[])], eye);
    populationView.update(dt,t,eye,overview,outdoorSelection);
    for (const p of people) {
      const v = p.v, moved = Math.hypot(v.x - p.last.x, v.z - p.last.z);
      p.last.x = v.x; p.last.z = v.z; p.pos.set(v.x, 0, v.z);
      const show = !v.inside && !overview && near(v.x, v.z, 95) && (!outdoorSelection || outdoorSelection.has(v));
      p.fig.group.visible = show;
      if (!show) { residentModels.hide(p); continue; }
      const moving = moved > 0.0005 && !v.engaged;
      if (v.engaged) { const want = Math.atan2(player.pos.x - v.x, player.pos.z - v.z); p.heading += angleDiff(want, p.heading) * Math.min(1, dt * 4); }
      else if (moving) p.heading += angleDiff(v.heading ?? p.heading, p.heading) * Math.min(1, dt * 8);
      p.bike.visible = !!v.bike && !v.engaged && v.path.length > 0;
      p.bag.visible = !!v.carrying && !p.bike.visible;
      const riding=p.bike.visible;
      const modelled = residentModels.update(p, { dt, dist: Math.hypot(v.x - eye.x, v.z - eye.z), moving: moving && !riding, speed: moved / Math.max(dt, 1e-3), talking: !!v.engaged, riding, carrying: p.bag.visible });
      if (!modelled) pose(p.fig, dt, t, moving&&!riding, moving || v.engaged);
      if(riding && !modelled){
        const pedal=Math.sin(t*8+p.fig.phase)*0.38;
        p.fig.legs[0].rotation.x=0.32+pedal;
        p.fig.legs[1].rotation.x=0.32-pedal;
        p.fig.arms[0].rotation.x=-0.48;
        p.fig.arms[1].rotation.x=-0.48;
      }
      // Bicycle wheels already rest at y=.34; lifting the whole figure
      // another 32cm made the bikes hover visibly above the street.
      p.fig.group.position.set(v.x, riding ? 0 : modelled ? 0 : moving ? Math.abs(Math.sin(t * 7 + p.fig.phase)) * 0.04 : 0, v.z);
      p.fig.group.rotation.y = p.heading;
      const dist = Math.hypot(v.x - eye.x, v.z - eye.z);
      // This is the actual Repository Town villager renderer, not only the
      // separate population-view path. Without distance LOD, every visible
      // procedural resident retains its ~145 near-face meshes out to 95 m.
      p.fig.group.userData.setLod?.(dist > 45 ? 3 : dist > 22 ? 2 : dist > 10 ? 1 : 0);
      p.tag.visible = dist > 3 && !p.bubble;
      // A passing hello: a speech bubble for a few seconds, then quiet for a while.
      if (p.bubble && (p.bubbleT -= dt) <= 0) { p.fig.group.remove(p.bubble); p.bubble.material.map.dispose(); p.bubble.material.dispose(); p.bubble = null; }
      if (inTown && !p.bubble && dist < 7 && dist > 2.8 && t > (p.quietUntil || 0)) {
        p.bubble = makeLabel(`💬 ${greeting(v, m)}`, 'prop'); p.bubble.position.set(0, 2.35, 0); p.fig.group.add(p.bubble);
        p.bubbleT = 3.5; p.quietUntil = t + 40 + Math.random() * 40;
      }
    }
    for (const tr of trucks) {
      const t0 = tr.t;
      tr.group.visible = !overview && near(t0.x, t0.z, 120);
      tr.group.position.set(t0.x, 0, t0.z);
      tr.group.rotation.y = t0.heading;   // the simulation already turns at a realistic rate; smoothing would make the mesh lag its footprint
      tr.load.count = t0.load ? Math.min(10, Math.max(1, Math.round(t0.load.n / 2))) : 0;
      tr.tails.material.emissiveIntensity = t0.braking ? 1.6 : dark > 0.3 ? 0.7 : 0;
    }
    // Draw only the actual van on the road. Its location is advanced in
    // TownLife.tick, so opening a menu cannot teleport it to the worksite.
    const trade=life.civic.tradeEducation;
    const job=trade?.orders?.find(o=>o.field&&
      (o.status==='assigned'||o.status==='in-progress'||o.field.phase==='return'));
    const v=job?.field?.van;
    serviceVan.group.visible=!!v&&!overview&&near(v.pos.x,v.pos.z,105)&&job.field.phase!=='depot';
    if(serviceVan.group.visible){
      serviceVan.group.position.set(v.pos.x,0,v.pos.z);
      serviceVan.group.rotation.y=v.heading||0;
    }
    for(const c of crewModels.values())c.fig.group.visible=false;
    if(job?.field&&['safety','working','inspection'].includes(job.field.phase)){
      const f=job.field,site=life.place(f.siteId),p=site?.front;
      if(p){
        const onScreen=!overview&&near(p.x,p.z,70);
        setCrew(job.worker,p.x+.85,p.z+.45,true,onScreen);
        if(f.apprentice)setCrew(f.apprentice,p.x-1.05,p.z+.45,true,onScreen);
      }
    }
    const shipment=trade?.deliveries?.find(o=>o.status==='in-transit'&&o.vehicle);
    const sv=shipment?.vehicle;
    hardwareFreight.group.visible=!!sv&&!overview&&near(sv.pos.x,sv.pos.z,110);
    if(hardwareFreight.group.visible){
      hardwareFreight.group.position.set(sv.pos.x,0,sv.pos.z);
      hardwareFreight.group.rotation.y=sv.heading||0;
    }
    const tx = life.railTrainFront();
    train.visible = tx !== null && !overview; if (tx !== null) train.position.x = tx;
    // Sails spin while someone works the mill; the tractor drives up and down its paddock.
    if (life.villagers.some((v) => v.work === 'mill' && v.step?.kind === 'work' && !v.path.length)) sails.rotation.z -= dt * 0.9;
    const farming = life.villagers.some((v) => v.work === 'silo' && v.step?.kind === 'work' && !v.path.length);
    if (farming) tractorS += dt * 2.2;
    const lanes = 8, laneLen = field.x1 - field.x0 - 6, tot = lanes * laneLen, s = tractorS % (tot * 2), along = s % laneLen, lane = Math.floor(s / laneLen) % lanes, dir = lane % 2 ? -1 : 1;
    tractor.position.set(dir > 0 ? field.x0 + 3 + along : field.x1 - 3 - along, 0, field.z0 + 3 + lane * ((field.z1 - field.z0 - 6) / (lanes - 1)));
    tractor.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    if ((tick = (tick + 1) % 10) === 0) for (const d of displays) d.update();
    for (const f of fields) f.update(dt, t, near(f.p.x, (FIELD_Z0 + FIELD_Z1) / 2, 70));
    const sig = life.parcels.map((p) => p.coordinate).join();
    if (sig !== parcelSig) {
      parcelSig = sig; const mm = new THREE.Matrix4();
      life.parcels.slice(0, 40).forEach((p, i) => { mm.makeRotationY(i).setPosition(p.x, 0.13, p.z); parcels.setMatrixAt(i, mm); });
      parcels.count = Math.min(40, life.parcels.length); parcels.instanceMatrix.needsUpdate = true;
    }
  }

  // Clearance diagnostics are measured from real building/prop collider AABBs.
  // Rail-side fences sit outside the reserved envelope; crossing stop lines
  // are excluded by the explicitly marked level crossing footprints.
  const railClearanceConflicts=railClearanceAudit([...town.colliders,...colliders]);
  const previousRailClosure=new Map(),railEscapePermit=new Set();
  const railBarrierColliders=(playerX,playerZ)=>{
    const boxes=[];
    for(const c of RAIL_CROSSINGS){
      const closed=life.railGate(c.x).roadStop;
      const inside=Math.abs(playerZ-RAIL_Z)<7.3&&Math.abs(playerX-c.x)<6.2;
      // If a person was on the crossing WHEN the warnings began, let
      // them leave; never grant a new bypass once a closed gate is present.
      if(closed&&!previousRailClosure.get(c.x)&&inside)railEscapePermit.add(c.x);
      if(!closed)railEscapePermit.delete(c.x);
      previousRailClosure.set(c.x,closed);
      const escape=railEscapePermit.has(c.x);
      if(escape&&(!inside&&Math.abs(playerZ-RAIL_Z)>8.0))
        railEscapePermit.delete(c.x);
      if(closed&&!escape)boxes.push(...railGateBoxes(c.x));
    }
    const front=life.railTrainFront();
    if(Number.isFinite(front))boxes.push({
      x0:front-6,x1:front+55,z0:RAIL_Z-1.65,z1:RAIL_Z+1.65
    }); // real rolling-stock footprint, including wagons
    return boxes;
  };
  return { railClearanceConflicts,railBarrierColliders, life, group, colliders, spots, seats, people, populationView, residentModels, update, save, events, skyColour: bg, skyParts: [stars, rain, moon, sunDisc], solarState:()=>lastSolar, building: (id) => buildings.get(id) || [], placeFront: (id) => { const p = life.place(id); return p.side === 'north' ? { x:p.x,z:p.front.z,yaw:Math.PI } : p.side === 'south' ? { x: p.x, z: FIELD_Z0 - 4.4, yaw: Math.PI } : { x: p.x, z: LOT8_Z + 12.6, yaw: 0 }; } };
}

// What a villager calls out as the player passes, from the time of day and what they're up to.
const JOB_LINES = { baker: 'Fresh loaves out the front!', farmer: "Wheat's coming on nicely.", 'dairy hand': 'Cows were grumpy this morning.', 'poultry keeper': 'Chooks are laying well!',
  shearer: 'Sheep need a haircut.', miller: 'Mill\'s turning today.', barista: 'Flat white?', cook: 'Brekkie till eleven!', grocer: 'Pumpkins are cheap today.', shopkeeper: 'Milk just came in.',
  butcher: 'Lamb chops on special.', publican: 'Pub opens at eleven!', postie: 'Nothing for you today!', 'truck driver': 'Mind the trucks, love.', teacher: 'School run again…',
  nurse: 'Keep your fluids up!', 'security guard':'Just checking the shopfronts on my round.',
  'qualified locksmith':'Need a lock repaired? Bring proof of authorisation.',
  mayor: 'Lovely town, isn\'t it?', 'station master': 'Train was on time!', programmer: 'Just one more bug…', retired: 'In my day…', student: 'Got homework.', artist: 'Look at that light!' };
function greeting(v, minute) {
  const h = minute / 60, pick = (a) => a[Math.floor(Math.random() * a.length)];
  if (v.step?.kind==='civic-speaker'&&!v.path.length) return pick(['Happy to answer questions about town services.', 'Council forum at the square today.']);
  if (v.step?.kind==='civic-audience'&&!v.path.length) return pick(['Just here to listen.', 'I have a few questions about local services.']);
  if (v.bike && v.path.length) return pick(['On your left!', 'Ding ding!', "Mornin'!"]);
  if (v.carrying) return pick(['Got the shopping!', 'Heavy bags, these.']);
  if (v.hunger > 70) return pick(['Starving, me.', "Can't wait for tea."]);
  if (Math.random() < 0.4) return JOB_LINES[v.job] || "G'day!";
  return h < 12 ? pick(["Mornin'!", "G'day!", 'Lovely morning.']) : h < 17 ? pick(["G'day!", 'Arvo!', 'Warm one today.']) : pick(["Evenin'!", 'Nearly tea time.', 'Night, love.']);
}

function angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
export { LOT_X, GOODS };
