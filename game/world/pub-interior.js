import {addPubVerticalCore,PUB_SHAFT_CUTS} from './pub-vertical-core.js';
import {installPubPresentation} from './pub-presentation.js';
import {pubServiceLayers} from './pub-service-visuals.js';
import {addPubPlant} from './pub-plant.js';
import {pubConnected,pubStandards} from './pub-standards.js';
import {PUB_PHYSICAL_PLAN_2026,pubExitLayout} from './pub-physical-plan-2026.js';
import {PUB_ENVELOPE,pubFacadeCoordinate} from './pub-envelope.js';
import {pubHistoryDescription} from './pub-history.js';
import { pubUtilities, pubStatus } from './pub-utilities.js';
import { createKit, ROOM } from './interior-kit.js';
import {PUB_KITCHEN_LAYOUT} from './pub-kitchen-layout.js';

// The Merged Branch, laid out like an Australian country pub:
//   • A long timber bar at the back with beer taps, a glass-and-spirit back-bar, a till and bar stools.
//   • A bistro dining area with set tables, a lounge corner with a fireplace and armchairs on the left,
//     a pool table and dartboard on the right, a keno/TAB screen, a menu board and a cold room door behind the bar.
//   • A clear aisle down the middle from the door to the bar.
export const PUB_LAYOUT = Object.freeze({ counterZ: -5.6, staff: { x: 0.8, z: -6.75 }, staffUse: { x: .4, z: -3.2 } });

export function buildPubInterior(site, makeLabel, roomTitle = 'Country pub') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, solid, text, add, blocker, model } = k;
  const { W, BACK, EDGE } = ROOM;
  const CZ = PUB_LAYOUT.counterZ;
  const doors = [], sight = [], fans=[];
  // Match the existing interior door animator. Leaf closes when away from its threshold.
  const door = (id, x0, x1, z) => {
    const width=x1-x0-.11, hinge=new THREE.Group(); hinge.name=id;
    const right=id==='pub:cold-room-door';hinge.position.set(right?x1-.055:x0+.055,0,z);
    const leaf=new THREE.Mesh(new THREE.BoxGeometry(width-.04,2.36,.08),new THREE.MeshLambertMaterial({color:0x56635b}));
    leaf.position.set((right?-1:1)*width/2,1.18,0); hinge.add(leaf);
    for(const dz of [-.08,.08]){const handle=new THREE.Mesh(new THREE.BoxGeometry(.22,.04,.04),new THREE.MeshLambertMaterial({color:0xc4c8cc}));handle.position.set((right?-1:1)*(width-.2),1,dz);hinge.add(handle);}
    hinge.userData={baseRot:0,open:0,centre:new THREE.Vector3((x0+x1)/2,0,z),swing:right||id==='pub:wc-door'||id==='pub:kitchen-door'?-1:1};
    if(id==='pub:rear-fire-exit'){const panic=new THREE.Mesh(new THREE.BoxGeometry(width-.3,.055,.07),new THREE.MeshLambertMaterial({color:0xb8c5ca}));panic.position.set(width/2,1.05,.11);panic.name='pub:panic-hardware';hinge.add(panic);}
    group.add(hinge);doors.push(hinge);
    sight.push({x0,x1,y0:0,y1:2.4,z0:z-.08,z1:z+.08,door:hinge});
    box(width,.3,.16,(x0+x1)/2,2.55,z,0xddd7c9);
  };
  group.add(new THREE.HemisphereLight(0xffe4c0, 0x5a4636, 1.7));
  const warm = new THREE.PointLight(0xffc880, 1.2, 16, 1.5); warm.position.set(0, 3.4, -1); group.add(warm);

  const WOOD = 0x6d4a30, DARKW = 0x3f2b1c, BRASS = 0xc9a24a, GREEN = 0x2f5a3f, LEATHER = 0x7a3b2c, STEEL = 0xc4c8cc;
  k.shell({ wall: 0x8a6a4e, ceiling: 0x4d382a, floor: 0x5a4030, rearExit:{x0:-1.05,x1:1.05},floorCuts:PUB_SHAFT_CUTS,ceilingCuts:PUB_SHAFT_CUTS });
  // Floor slab supplies the timber finish around the real stair/lift cutouts.   // plank floor
  box(2.2, 0.03, 1.2, 0, 0.02, 5.0, 0x3a2a20);                                                              // door mat
  // dado panelling, ceiling beams, wall lights
  for(const x of [-4.05,4.05])box(5.8,1.2,.06,x,.6,BACK+.15,DARKW);
  for (const sx of [-EDGE + 0.15, EDGE - 0.15]) box(0.06, 1.2, 17.4, sx, 0.6, -3, DARKW);
  for(let z=-10;z<=4;z+=3.5){if(z>0)box(5.4,.22,.25,3.8,3.7,z,DARKW);else box(W-.4,.22,.25,0,3.7,z,DARKW);}
  for (const [x, z] of [[4,1],[-4,-3],[4,-7]]) { cyl(0.01, 0.01, 0.7, x, 3.5, z, 0x222222, {}, 4); cyl(0.06, 0.28, 0.24, x, 3.0, z, 0x2f5a3f, { e: 0xffc060 }, 12); }

  // ── bar ──
  for(const [w,x]of [[6.3,-1.05],[1.1,3.65]]){solid(w,1.1,.9,x,.55,CZ,WOOD);box(w,.07,1.1,x,1.13,CZ,DARKW);box(w,.08,.1,x,.35,CZ+.5,BRASS);}
  for (const x of [-3, -2.4, -1.8]) { cyl(0.025, 0.025, 0.3, x, 1.32, CZ + 0.15, BRASS, {}, 8); box(0.06, 0.1, 0.1, x, 1.5, CZ + 0.15, [0xc9a24a, 0x2f5a3f, 0x8a2f2f][Math.round((x + 3) / 0.6) % 3]); }
  for (let i = 0; i < 6; i++) cyl(0.05, 0.04, 0.12, -0.5 + i * 0.18, 1.2, CZ - 0.1, 0xe8e0c8, { a: 0.7 }, 10);
  box(0.46, 0.28, 0.42, 3.5, 1.28, CZ, 0x2d3036); box(0.38, 0.2, 0.02, 3.5, 1.33, CZ + 0.22, 0x8fc4e8, { e: 0x4f94c8 });
  box(.05,.05,.18,-2.4,1.445,CZ+.24,BRASS);
  const barSeats=[-3.85,-2.85,-1.85,-.85,1.2,3.65];
  for(const [i,x]of barSeats.entries()){k.seat('barstool-'+i,'stool',x,CZ+1.25,0);cyl(.2,.2,.05,x,.72,CZ+1.25,LEATHER);cyl(.03,.03,.7,x,.35,CZ+1.25,0x2a2a2a);cyl(.2,.2,.02,x,.02,CZ+1.25,0x2a2a2a);blocker(.4,.4,x,CZ+1.25);}
  k.seat('bar-end-stool','stool',4.65,CZ,Math.PI/2);cyl(.2,.2,.05,4.65,.72,CZ,LEATHER);cyl(.03,.03,.7,4.65,.35,CZ,0x2a2a2a);blocker(.4,.4,4.65,CZ);
  // back-bar: mirror, shelves of bottles, glass rack, fridges
  // Split back-bar shelving around the rear exit. The centre aisle stays clear to the door.
  for(const sx of [-2.6,2.6]) box(2.45,1.5,.06,sx,2.2,BACK+.2,0xcfd8dc,{a:.5});
  for(const y of [1.4,1.9,2.4])for(const side of [-1,1]){
    box(2.45,.05,.3,side*2.6,y,BACK+.35,WOOD);
    for(let i=0;i<6;i++)cyl(.055,.055,.28,side*(1.55+i*.38),y+.16,BACK+.35,[0x2f5a3f,0x7a4a22,0xc9a24a,0x3a5a7a,0x8a2f2f][(i+Math.round(y*5))%5],{a:.9},8);
  }
  // Walk-in cold-room volume and door; no decorative fake entrance.
  solid(.12,2.7,2.6,-1.15,1.35,-10.65,0xe1e6e3);
  solid(.4,2.7,.12,-3.55,1.35,-9.3,0xe1e6e3);
  solid(.5,2.7,.12,-1.45,1.35,-9.3,0xe1e6e3);
  door('pub:cold-room-door',-3.35,-1.7,-9.3);
  solid(.4,1.5,1.8,-3.55,.75,-10.7,STEEL);
  text('Cold room · raw food below ready-to-eat',-2.5,2.4,-10.8);
  add('cold-room','Cold room and temperature log','pub-utilities','Persistent temperature exposure and food quarantine.',-2.4,-9.8);
  // Second sanitary cubicle: a separate ambulant design scenario, not a fixture-count approval.
  solid(.12,2.7,3.0,1.25,1.35,-10.4,0xddd7c9);
  solid(.6,2.7,.12,1.55,1.35,-8.9,0xddd7c9);
  solid(.6,2.7,.12,3.45,1.35,-8.9,0xddd7c9);
  door('pub:ambulant-wc-door',1.85,3.15,-8.9);
  blocker(.6,.8,2.35,-11.1);cyl(.3,.25,.4,2.35,.3,-11.1,0xf5f5ef);box(.6,.65,.22,2.35,.68,-11.55,0xf5f5ef);
  box(.55,.18,.45,3.15,.85,-10.2,STEEL);
  for(const x of [1.7,3])box(.04,.04,.8,x,.85,-11.1,STEEL);
  text('Ambulant WC · hand basin',2.5,2.7,-8.85);
  add('ambulant-wc','Second WC and basin','pub-utilities','Separate WC and hand basin connected to sanitary service.',2.4,-9.5);
  text(site.name, 0, 3.55, CZ - 0.5, 'room'); text('Bar · Meals · Keno', 0, 1.9, CZ - 0.1);
  // No fabricated construction age is shown on this architectural placeholder plaque.
  box(.07,.8,1.35,6.85,2.35,3.55,BRASS);box(.075,.64,1.17,6.8,2.35,3.55,DARKW);
  text('DATE UNKNOWN',6.45,2.45,3.55,'room');

  // ── bistro tables (right-front) and lounge (left) ──
  const table = (x, z) => {
    blocker(1.0, 1.0, x, z); for (const [dx, dz] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) box(0.06, 0.76, 0.06, x + dx, 0.38, z + dz, DARKW); box(1.1, 0.05, 1.1, x, 0.78, z, 0xe9e0d0);
    cyl(0.05, 0.05, 0.14, x, 0.88, z, 0xcfe8ee, { a: 0.6 }, 8);
    for (const [dx, dz, ry] of [[-0.8, 0, Math.PI / 2], [0.8, 0, -Math.PI / 2], [0, 0.8, Math.PI], [0, -0.8, 0]]) {
      k.seat('bistro-'+x+'-'+z+'-'+dx+'-'+dz,'chair',x+dx,z+dz,Math.PI+ry);
      const cx=x+dx,cz=z+dz,dirX=-dx/.8,dirZ=-dz/.8;
      blocker(.46,.46,cx,cz);box(.46,.05,.46,cx,.46,cz,DARKW);
      box(.46,.48,.055,cx-dirX*.2,.72,cz-dirZ*.2,DARKW,{ry:Math.atan2(dirX,dirZ)});
      for(const lx of [-.17,.17])for(const lz of [-.17,.17])box(.045,.44,.045,cx+lx,.22,cz+lz,DARKW);
    }
  };
  const tables=[[3.6,3],[5.7,4.4],[-2.4,-1.2]];
  for(const [x,z]of tables)table(x,z);
  // fireplace on the left wall
  solid(0.7, 1.6, 2.0, -6.55, 0.8, -4.0, 0x7a5a48); box(0.1, 0.8, 1.2, -6.18, 0.5, -4.0, 0x1a1410); box(0.08, 0.3, 0.9, -6.14, 0.3, -4.0, 0xff7a2a, { e: 0xff5a10 });
  box(0.9, 0.08, 2.2, -6.5, 1.65, -4.0, DARKW);
  // Pool moved forward to leave a service corridor to the rear bathroom.
  solid(1.12,.85,2.03,3.8,.43,-.7,WOOD); box(.915,.05,1.83,3.8,.87,-.7,GREEN);
  // keno / TAB screens, menu board, framed pictures
  box(.08,.8,1.4,6.8,2.4,-3.6,0x1b1d22);box(.04,.7,1.3,6.74,2.4,-3.6,0x2e6a94,{e:0x1e4a74}).name='pub:television';
  box(.06,1.2,1.2,-6.82,2.5,-5.8,0x1f2a24).name='pub:menu-board';text('Parmi · Roast · Pie of the day',-6.8,2.5,-5.75);
  for (const [x, y, f] of [[-5, 2.4, 'pictureframe_medium'], [-3.2, 2.5, 'pictureframe_large_A'], [2.5, 2.5, 'pictureframe_small_B']]) { if (model(f, x, BACK + 0.28, 0, { h: 0.7 }, y - 0.35)) continue; box(0.8, 0.6, 0.05, x, y, BACK + 0.2, DARKW); box(0.66, 0.46, 0.03, x, y, BACK + 0.23, 0xb8a98a); }
   model('cactus_medium_A', 6.3, 5.2, 0, { w: 0.5, d: 0.5, h: 0.6 });

  // finishing detail: beer mats, bunting, bar towels, glass rack, ceiling fans, brass rail, pool cues, stools' footrests
  for (const [x, z] of [[3.6, 3.0], [-3.6, 3.0]]) for (let i = 0; i < 4; i++) { cyl(0.05, 0.05, 0.01, x - 0.3 + (i % 2) * 0.6, 0.81, z - 0.3 + Math.floor(i / 2) * 0.6, 0xd9c8a0, {}, 10); }
  for (let i = 0; i < 24; i++) box(0.18, 0.22, 0.01, -6.6 + i * 0.57, 3.3 - Math.sin(i / 24 * Math.PI) * 0.0, -11.7 + 0.02, [0xc9553d, 0xe3b04b, 0x2f5a3f, 0x4f7fa6][i % 4]);
  for(const [w,x]of [[6.3,-1.05],[1.1,3.65]])box(w,.05,.05,x,.9,CZ+.55,BRASS);
  for(let i=0;i<9;i++)cyl(.04,.03,.14,-3.6+i*.2,2.6,BACK+.36,0xe8e0c8,{a:.6},8);
  box(1.8,.04,.3,-2.7,2.7,BACK+.36,WOOD);
  for(const [x,z]of [[-3.8,-2.0],[3.8,-.5],[0,2.5],[0,-2.5]]){cyl(.02,.02,.5,x,3.55,z,0x222222);const rotor=new THREE.Group();rotor.name='pub:ceiling-fan:'+fans.length;rotor.position.set(x,3.3,z);for(let blade=0;blade<4;blade++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(.7,.025,.12),new THREE.MeshLambertMaterial({color:0xb08a60}));mesh.position.set(Math.cos(blade*Math.PI/2)*.35,0,Math.sin(blade*Math.PI/2)*.35);mesh.rotation.y=-blade*Math.PI/2;rotor.add(mesh)}group.add(rotor);fans.push(rotor)}
  for (let i = 0; i < 4; i++) cyl(0.012, 0.012, 1.4, 4.6 + i * 0.2, 1.0, -5.0, 0x8a6a40, { rz: 0.12 }, 4);


  // Back-of-house: kitchen on left, sanitary compartment on right.
  solid(.12,2.7,3.8,3.8,1.35,-10,0xddd7c9);
  solid(1.0,2.7,.12,4.3,1.35,-8.1,0xddd7c9);
  solid(.72,2.7,.12,6.56,1.35,-8.1,0xddd7c9);
  door('pub:wc-door',4.8,6.2,-8.1);
  // Privacy offset in the corridor, NOT cutting across the wheelchair circulation inside the WC.
  // The outward-opening WC door provides privacy without a corridor baffle.
  box(2.8,.025,3.6,5.4,.025,-10.0,0xb9c6bd);
  text('WC · privacy door',5.5,2.8,-8.0);

  // Provisional WC remodel: fixture footprints and rear/side grab-rail representations.
  // Clearances remain UNVERIFIED until AS 1428.1 and an access professional review.
  cyl(.3,.25,.4,6.28,.3,-11.1,0xf5f5ef);box(.6,.65,.22,6.28,.68,-11.55,0xf5f5ef);
  blocker(.6,.8,6.28,-11.1);blocker(.7,.5,4.26,-11.02);
  box(.7,.18,.5,4.26,.85,-11.02,STEEL);cyl(.025,.025,.25,4.26,1.04,-11.22,STEEL);
  box(.04,.04,.8,6.75,.87,-11.05,0xc4c8cc).name='pub:wc-grab-rail';
  box(.6,.04,.04,6.3,.87,-11.68,0xc4c8cc);
  box(.3,.4,.12,4.0,1.3,-10.6,0xe5e8eb); // soap/towel dispenser
  text('To sewer · vented sanitary drain',5.4,1.8,-11.5);
  // Enclosed food room; 1.4 m opening into staff service corridor.
  solid(.12,2.7,4.9,-3.9,1.35,-9.35,0xdde4df);
  solid(.55,2.7,.12,-6.625,1.35,-6.9,0xdde4df);
  solid(.95,2.7,.12,-4.375,1.35,-6.9,0xdde4df);
  door('pub:kitchen-door',-6.35,-4.85,-6.9);
  // Working commercial galley: cooking and handwash on the exterior wall,
  // preparation and dirty return on the opposite wall. Furniture footprints
  // and visual models use the same values so the player can physically pass.
  // A game circulation layout is not an Australian building/food-fitout approval.
  box(2.82,.025,4.8,-5.43,.025,-9.4,0x777e7c).name='pub:kitchen:non-slip-floor';
  // Back-of-house needs wipe-clean, light-coloured envelope surfaces instead
  // of inheriting the pub's brown timber ceiling and tan wall treatment.
  // Thin surface panels have no collision footprint and never span the door.
  box(2.82,.065,4.82,-5.43,4.10,-9.4,0xe8ebeb).name='pub:kitchen:washable-ceiling';
  box(2.81,2.84,.045,-5.43,1.42,-11.82,0xdfe7e7).name='pub:kitchen:washable-rear-wall';
  box(.045,2.84,4.74,-6.86,1.42,-9.35,0xdbe4e4).name='pub:kitchen:washable-left-wall';
  box(.045,2.84,4.74,-4.035,1.42,-9.35,0xe9eded).name='pub:kitchen:washable-right-wall';
  for(const fixture of PUB_KITCHEN_LAYOUT.fixtures){
    box(fixture.w,fixture.h,fixture.d,fixture.x,fixture.h/2,fixture.z,STEEL).name='pub:kitchen:'+fixture.id;
    blocker(fixture.w,fixture.d,fixture.x,fixture.z);
  }

  // Commercial hot line: four burners, fry/griddle zone, splashback, oven and
  // real extraction canopy; no centre-of-room obstruction.
  const range=PUB_KITCHEN_LAYOUT.fixtures[0];
  box(.72,.045,2.07,range.x,.925,range.z,0x333f45).name='pub:kitchen:range-top';
  box(.055,1.12,2.28,-6.86,1.37,range.z,0xe5e8e6);
  for(const z of [-11.06,-10.58,-10.1,-9.61])
    cyl(.16,.16,.025,-6.51,.955,z,0x11191c,{},16);
  for(const z of [-10.9,-10.42,-9.94,-9.46])
    cyl(.045,.045,.03,-6.105,.77,z,0x23282b,{},12);
  box(.05,.08,.53,-6.09,.48,-10.56,0x525d62).name='pub:kitchen:oven-handle';
  box(.85,.34,2.36,-6.52,2.65,-10.3,0x9faeb6).name='pub:kitchen:extraction';
  for(const z of [-11.2,-10.9,-10.6,-10.3,-10,-9.7,-9.4])
    box(.64,.02,.055,-6.52,2.46,z,0x52636b);
  box(.35,1.08,.43,-6.53,3.34,-10.3,0xa4adb2).name='pub:kitchen:exhaust-duct';
  // Realistic compact prep fridge with ingredient bins, cutting board and
  // integrated splashback. All decorative shelf pieces are above the aisle.
  const prep=PUB_KITCHEN_LAYOUT.fixtures[2];
  box(.73,.06,1.53,prep.x,.94,prep.z,0xe5e9e7).name='pub:kitchen:prep-surface';
  box(.04,.68,1.56,-4.03,1.31,prep.z,0xdce4e6);
  for(const z of [-9.42,-8.95,-8.48]){
    box(.025,.055,.24,-4.77,.6,z,0x59666d);
    box(.26,.04,.26,-4.36,1.00,z,[0x467f4d,0xad6047,0xcbb16c][Math.round((z+9.42)/.47)]);
  }
  box(.36,.026,.52,-4.41,1.05,-8.82,0x5aab83).name='pub:kitchen:colour-coded-board';
  // Dedicated hand basin is separate from the dishwasher, with soap/towels.
  const hand=PUB_KITCHEN_LAYOUT.fixtures[1];
  box(.41,.055,.44,hand.x,.85,hand.z,0xe8eef0).name='pub:kitchen:hand-basin';
  box(.3,.018,.33,hand.x,.887,hand.z,0x566e79);
  cyl(.018,.018,.29,-6.54,1.08,-8.54,STEEL);
  box(.13,.025,.035,-6.54,1.23,-8.5,STEEL);
  box(.26,.07,.13,-6.73,1.62,-8.34,0xf2f5f5).name='pub:kitchen:handwash-sign';
  text('HANDS ONLY',-6.7,1.84,-8.32);
  // Dirty dishes return to the dishwasher and a separate raised clean rack;
  // hot pass is a shallow high shelf, not a waist-high obstacle in the door.
  const wash=PUB_KITCHEN_LAYOUT.fixtures[3];
  box(.72,.05,.84,wash.x,.89,wash.z,0xd7e3e5).name='pub:kitchen:wash-bench';
  box(.035,.045,.37,-4.77,.49,wash.z,0x667781);
  box(.65,.055,.4,-4.39,1.77,-11.56,0xb9c7cc).name='pub:kitchen:clean-rack';
  for(let n=0;n<4;n++)cyl(.12,.12,.025,-4.53+n*.09,1.83,-11.56,0xf5f3ec);
  box(.63,.05,.47,-4.41,1.72,-7.64,0xd7dde0).name='pub:kitchen:hot-pass';
  for(const z of [-7.76,-7.55])cyl(.12,.12,.02,-4.46,1.765,z,0xf5f5f0);
  // Off-floor dry storage, labelled ingredients and knives within the work
  // zone (never a freestanding trolley or a floor-collision hazard).
  box(.43,.055,1.07,-4.28,2.15,-9.04,0xc5d2d4).name='pub:kitchen:dry-shelf';
  for(const z of [-9.35,-9.09,-8.83,-8.57]){
    box(.19,.25,.17,-4.31,2.31,z,[0xc5ac65,0x96a874,0x9f6259,0xb6b6a7][Math.round((z+9.35)/.26)]);
    box(.018,.13,.06,-4.47,2.30,z,0xf1eee3);
  }
  for(const z of [-9.38,-9.11,-8.84])box(.025,.28,.055,-4.06,1.72,z,0x303b40);
  box(.32,.05,.28,-6.68,1.68,-7.65,0xc4d0d1).name='pub:kitchen:temperature-log';
  box(.28,.035,.42,-6.68,1.96,-7.65,0xf2efdf);

  // Diffused protected ceiling panels and glare-controlled task illumination. Lights
  // share the pub's actual breaker/blackout circuit; the output is artistic,
  // not measured lux. Avoid gloomy warm domestic pendants in a food workspace.
  const kitchenLenses=[];
  for(const [i,[x,z]] of [[-5.54,-8.35],[-5.52,-10.65]].entries()){
    box(1.08,.085,.67,x,3.84,z,0xb2bdc3).name='pub:kitchen:led-housing:'+(i+1);
    const lens=new THREE.Mesh(new THREE.BoxGeometry(1.0,.026,.59),
      new THREE.MeshLambertMaterial({color:0xf4faff,emissive:0xf1faff,emissiveIntensity:.85}));
    lens.name='pub:kitchen:led-panel:'+(i+1);lens.position.set(x,3.79,z);group.add(lens);kitchenLenses.push(lens);
    const light=new THREE.SpotLight(0xf3f8ff,24,6.4,1.17,.77,1.35);
    light.name='pub:kitchen:task-light:'+(i+1);
    light.position.set(x,3.72,z);light.target.position.set(x,0,z);
    group.add(light,light.target);
  }
  text('Kitchen · cook / prep / wash / pass',-4.8,2.7,-8.1);

  add('toilet','Toilet and hand washing','pub-utilities','Stored cistern water, sanitary drain and warm hand basin.',5.6,-9.2);
  add('kitchen','Working kitchen services','pub-utilities','Cooking, extraction, potable water and grease pre-treatment.',-5.52,-8.1);
  add('services','Utility meters and service diagram','pub-utilities','Inspect and test the pub connections.',-5.6,-6.5);
  // Physical hygiene / safety equipment. No claim of certified dimensions or capacity.
  for(const [id,x,z] of [['kitchen',-6.75,-8.3],['wc',4.0,-10.0]]){
    box(.17,.24,.12,x,1.3,z,0xf2f0df).name='pub:'+id+'-soap';
    box(.28,.35,.14,x,1.65,z,0xeeeeea).name='pub:'+id+'-towels';
  }
  text('Dirty return → dishwasher → clean rack',-4.6,1.6,-11.0);
  box(.4,.5,.12,-6.72,1.6,-6.0,0xd3332d).name='pub:fire-blanket';
  cyl(.11,.11,.55,-6.6,.8,-5.2,0xc62c28).name='pub:extinguisher';
  text('Fire blanket · extinguisher',-6.2,2.2,-6.0);
  cyl(.12,.12,.05,0,4.5,-1,0xf7f6eb).name='pub:smoke-alarm';
  // Two alternative openings are a design improvement, NOT proof of a safe exterior discharge.
  door('pub:rear-fire-exit',-1.05,1.05,BACK);
  box(1.1,.32,.09,0,2.85,BACK+.18,0x13743d,{e:0x39d979}).name='pub:rear-exit-sign';
  text('EXIT · REAR',0,2.85,BACK+.3);
  box(1.1,.32,.09,0,2.85,5.8,0x13743d,{e:0x39d979}).name='pub:exit-sign';
  text('EXIT',0,2.85,5.65);
  const emergency=new THREE.PointLight(0xe5f0ff,0,12,1.5);emergency.position.set(0,2.9,3);emergency.name='pub:emergency-light';group.add(emergency);
  const rearEmergency=new THREE.PointLight(0xe5f0ff,0,12,1.5);rearEmergency.position.set(0,2.9,-9.7);rearEmergency.name='pub:rear-emergency-light';group.add(rearEmergency);
  text('Free drinking water · ask at bar',1.1,1.7,CZ+.2);
  add('water-point','Free drinking water','pub-utilities','Potable water availability follows the water isolation valve.',2.6,-4.2);
  add('fire-safety','Fire equipment and evacuation','info','Fictional venue: stop service, use a clear available exit. Front and rear openings are modelled; the rear game route leads via the service yard to the street. Approved travel distances, required fire systems, lux design and real-world discharge rights remain UNVERIFIED.',-3.4,-3.0);
  add('rear-egress','Rear exit to service yard','pub-rear-exit','Leave through the rear landing and paved side route to the street. Game collision clearance is tested; legal boundaries, exit rules and fire schedule require independent assessment.',0,-10.6);
  add('access','Access route and sanitary review','info','A step-free interior route, larger WC enclosure, rails and 1.4 m design doorway are modelled. External grade, turning envelope, transfer side, hardware and NCC/AS 1428.1 compliance remain UNVERIFIED.',5.4,-8.3);
  add('capacity','Operational capacity · provisional','info','Scenario only: 24 patrons plus three workers. NOT an approved occupancy limit; exact sanitary fixture numbers and egress widths must be determined by a qualified designer.',0,4.9);
  // Diagrammatic service routes deliberately shown above head height; not surveyed pipe positions.
  const layers=pubServiceLayers(THREE,group);
  // Entire pub lighting (including former independent hemisphere fill) is
  // electrically switched. Emergency battery is deliberately limited to
  // essential loads and will not keep the dining-room lighting on.
  for(const [id,x,z] of [['wc',5.5,-9.5],['kitchen',-5.2,-8.5]]){const light=new THREE.PointLight(0xe5f0ff,0,6,1.5);light.position.set(x,2.8,z);light.name='pub:'+id+'-emergency-light';group.add(light);}
  const lampCircuits=[];
  group.traverse(o=>{if(o.isLight)lampCircuits.push({light:o,original:o.intensity});});
  group.userData.lightingSite='pub';
  group.userData.updateLighting=powered=>{
    for(const c of lampCircuits)c.light.intensity=powered?c.original:0;
  };
  let fanSpeed=0;
  const utilityVisuals=(life,dt=0)=>{
    const state=pubUtilities(life),status=pubStatus(life),ops=pubStandards(life);
    fanSpeed+=((status.power?3:0)-fanSpeed)*Math.min(1,dt*2);if(status.power)fanSpeed=Math.min(3,fanSpeed);for(const fan of fans)fan.rotation.y+=fanSpeed*dt;
    const tv=group.getObjectByName('pub:television');if(tv)tv.visible=status.television;
    const entry=group.getObjectByName('pub:cellar-entry-beacon'),cellar=life.civic.pubVenue.expansion;if(entry&&cellar){const alarm=cellar.gasAlarm||!cellar.monitorOk||!cellar.ventilation||!status.power||!pubConnected(life,'electricity','switchboard','cellar-vent');entry.material.color.setHex(alarm?0xe63b32:0x59af90);entry.material.emissive.setHex(alarm?0xe63b32:0x59af90);entry.material.emissiveIntensity=status.power||state.emergencyMinutes>0?.5:0;}
    const wc=doors.find(d=>d.name==='pub:wc-door');if(wc)wc.userData.privacy=ops.wcPrivacy;
    for(const [id,layer] of Object.entries(layers))layer.visible=state.overlay===id;
    // All ordinary electric fixtures follow this building's breaker as well as town supply.
    group.userData.updateLighting?.(status.power);
    emergency.intensity=!status.power&&state.emergencyMinutes>0?1.5:0;
    rearEmergency.intensity=!status.power&&state.emergencyMinutes>0?1.5:0;
    for(const id of ['wc','kitchen'])group.getObjectByName('pub:'+id+'-emergency-light').intensity=!status.power&&state.emergencyMinutes>0?1:0;
  };
  add('heritage','Hotel history · original construction unknown','info',pubHistoryDescription(),6.25,2.6);
  add('counter', 'Bar', 'civic-ledger', 'Pull up a stool. Order a meal or a drink at the bar, or open the Town Ledger.', PUB_LAYOUT.staffUse.x, PUB_LAYOUT.staffUse.z);
  add('taps', 'Beer taps', 'info', 'Four taps and a fridge of bottles. Licensed hours run from eleven in the morning to late; the publican serves responsibly.', -2.4, -3.2);
  add('menu', 'Menu board', 'info', 'Chicken parmi, the roast of the day and a pie with chips. The kitchen uses beef, chicken and vegies delivered from the farms and the butcher.', -6.3, -5.8);
  add('lounge','Bistro and electric hearth','info','Eight four-place tables, seven bar stools and a clear central access aisle. Decorative electric hearth; no solid-fuel fire.',0,-2.5);
  add('pool','Play pool','pub-pool','Two-player physics pool: aim, shot power, cushions, pockets and house-rule fouls.',2.5,-.8);
  add('keno','Keno terminal','pub-keno','Free numbers demonstration; no stakes, prizes or real operator.',5.6,-3.6);
  addPubPlant(k,site);
  addPubVerticalCore(k,0);
  const servicePresentation=installPubPresentation(k);
  const interior = k.finish({lightingOptions:{positions:[[-2,-3],[3.5,1.5],[-3.5,-6.5],[3.5,-6.5]]}, doors, sight, utilityVisuals, staff: { pos: PUB_LAYOUT.staff, use: PUB_LAYOUT.staffUse } });
  // k.finish installs the shared lighting circuit. Wrap it to switch the kitchen
  // diffusers too: an unpowered kitchen must not show glowing ceiling panels.
  const poweredLighting=group.userData.updateLighting;
  group.userData.updateLighting=powered=>{
    poweredLighting?.(powered);
    for(const lens of kitchenLenses)lens.material.emissiveIntensity=powered ? .85 : 0;
  };
  interior.attachPubStaff=servicePresentation.attach;interior.afterPeople=servicePresentation.update;
  interior.physicalPlan=PUB_PHYSICAL_PLAN_2026;
  interior.fireEgressDesign=pubExitLayout();
  interior.rearExitZone={x0:-1.05,x1:1.05,z0:BACK-.8,z1:BACK+1.15,dischargeVerified:false};
  // This room is a ground-level teleport scene, not a separately approved upstairs.
  const envelope=PUB_ENVELOPE;
  if(interior.bounds.x1-interior.bounds.x0!==envelope.widthM||
     interior.bounds.z1-interior.bounds.z0!==envelope.depthM||
     pubFacadeCoordinate(interior.bounds.z0)!==envelope.facade.rearZ||
     pubFacadeCoordinate(interior.bounds.z1)!==envelope.facade.frontZ)
    throw new Error('Pub interior dimensions disagree with the external building');
  interior.buildingEnvelope=envelope;
  interior.storey=0;
  interior.storeyCount=envelope.accessibleLevels;

  interior.rooms.push({name:'Kitchen',x0:-6.9,x1:-3.96,z0:-11.9,z1:-6.96,w:2.94,d:4.94,parent:0});
  interior.rooms.push({name:'Sanitary compartment',x0:3.86,x1:6.9,z0:-11.9,z1:-8.16,w:3.04,d:3.74,parent:0});
  interior.rooms.push({name:'Walk-in cold room',x0:-3.8,x1:-1.21,z0:-11.9,z1:-9.36,w:2.59,d:2.54,parent:0});
  interior.rooms.push({name:'Ambulant sanitary cubicle',x0:1.31,x1:3.74,z0:-11.9,z1:-8.96,w:2.43,d:2.94,parent:0});
  for(const item of interior.interactables){
    if(item.key===site.id+':kitchen')item.room=1;
    if(item.key===site.id+':toilet'||item.key===site.id+':wc-assist')item.room=2;
    if(item.key===site.id+':cold-room')item.room=3;
    if(item.key===site.id+':ambulant-wc')item.room=4;
    item.roomName=interior.rooms[item.room].name;
  }
  return interior;
}
