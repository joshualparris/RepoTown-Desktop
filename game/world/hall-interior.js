import {TOWN_ORIGIN,townChronicleNotice} from './town-origin.js';
import { createKit, ROOM } from './interior-kit.js';

// The Town Hall, laid out like a country meeting rooms:
//   • A public service counter on the right at the back (rates, requests, the Town Ledger), with a records
//     room door and the General Manager's office behind it.
//   • A meeting room on the left: a raised dais with the mayor's chair, a curved council table with
//     named seats, a lectern and flags, and rows of public-gallery chairs facing it.
//   • A noticeboard of council decisions, an honour board, a ballot box and a framed town map in the foyer.
export const HALL_LAYOUT = Object.freeze({ counterZ: -5.5, staff: { x: 3.4, z: -6.7 }, staffUse: { x: 3.4, z: -4.3 } });

export function buildHallInterior(site, makeLabel, roomTitle = 'Town Hall') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, solid, blocker, text, add, model } = k;
  const { W, BACK, EDGE } = ROOM;
  const CZ = HALL_LAYOUT.counterZ;
  group.add(new THREE.HemisphereLight(0xfff6e4, 0x7a6c58, 1.9));
  const WOOD = 0x6d4a30, DARKW = 0x3f2b1c, BLUE = 0x2f4f7f, CARPET = 0x6a2f33, CREAM = 0xf0e8d6, GOLD = 0xc9a24a, GREEN = 0x3f6f4f;
  k.shell({ wall: 0xe6d9bf, ceiling: 0xf0e8d6, floor: 0x9a7e5f });
  for (let i = 0; i < 14; i++) box(0.96, 0.014, 17.4, -6.5 + i, 0.004, -3, i % 2 ? 0x8f7354 : 0x9a7e5f);       // timber floor
  box(2.0, 0.02, 9.5, 0, 0.02, 0.5, CARPET);                                                                 // runner from the door
  box(2.2, 0.03, 1.2, 0, 0.03, 5.0, 0x4a3a30);
  box(W - 0.5, 1.2, 0.06, 0, 0.6, BACK + 0.15, DARKW);                                                       // dado panelling
  for (const sx of [-EDGE + 0.15, EDGE - 0.15]) box(0.06, 1.2, 17.4, sx, 0.6, -3, DARKW);
  for (const x of [-5.5, -3.5, 3.5, 5.5]) cyl(0.25, 0.25, 4.0, x, 2.0, 5.5, 0xf2ecde, {}, 14);               // foyer columns
  for (const [x, z] of [[-3, 1], [3, 1], [-3, -3], [3, -3]]) { cyl(0.01, 0.01, 0.6, x, 3.7, z, 0x222222, {}, 4); cyl(0.3, 0.55, 0.3, x, 3.3, z, 0xf4e4b4, { e: 0xffd890 }, 14); }

  // ── public counter (right) ──
  solid(6.6, 1.05, 0.9, 3.3, 0.52, CZ, WOOD); box(6.7, 0.06, 1.0, 3.3, 1.08, CZ, DARKW); box(6.6, 0.4, 0.06, 3.3, 0.5, CZ + 0.47, BLUE);
  for (const x of [1.5, 3.4, 5.3]) { box(0.4, 0.26, 0.4, x, 1.25, CZ, 0x2d3036); box(0.34, 0.2, 0.02, x, 1.28, CZ + 0.22, 0x8fc4e8, { e: 0x4f94c8 }); }
  box(0.4, 0.2, 0.3, 6.1, 1.2, CZ + 0.1, GOLD); cyl(0.05, 0.05, 0.3, 6.1, 1.4, CZ + 0.1, GOLD, {}, 8);              // service bell
  text(site.name, 3.3, 3.5, CZ - 0.4, 'room'); text('Rates · Requests · Records', 3.3, 2.0, CZ - 0.1);
  for (const x of [1.0, 3.0, 5.0]) { solid(1.4, 1.8, 0.5, x, 0.9, BACK + 0.4, 0x7a5a3a); for (let r = 0; r < 4; r++) box(1.3, 0.04, 0.45, x, 0.3 + r * 0.45, BACK + 0.42, 0x8c6a48); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) box(0.16, 0.34, 0.3, x - 0.55 + c * 0.22, 0.5 + r * 0.45, BACK + 0.42, [0xd8c8a0, 0x6a8aa8, 0x8a5a4a][(r + c) % 3]); }   // records shelves
  box(1.2, 2.2, 0.08, 6.4, 1.1, BACK + 0.12, 0x6a5a4a); text('Records', 6.4, 2.6, BACK + 0.3);

  // ── meeting room (left): dais, table, lectern, flags, gallery ──
  box(6.0, 0.3, 3.2, -3.7, 0.15, -10.2, DARKW); blocker(6.0, 3.2, -3.7, -10.2);                                  // dais
  box(6.0, 0.05, 3.2, -3.7, 0.32, -10.2, CARPET);
  solid(1.0, 0.5, 0.8, -3.7, 0.55, -10.6, DARKW); box(1.0, 0.9, 0.12, -3.7, 1.15, -11.0, 0x4a2a22); box(0.2, 0.3, 0.1, -3.7, 1.5, -10.98, GOLD);   // mayor's chair
  solid(4.4, 0.78, 0.9, -3.7, 0.55, -8.9, WOOD); box(4.5, 0.05, 1.0, -3.7, 0.95, -8.9, DARKW);                    // council table
  for (let i = 0; i < 5; i++) { box(0.4, 0.04, 0.1, -5.6 + i * 0.95, 1.0, -8.5, GOLD); box(0.35, 0.02, 0.28, -5.6 + i * 0.95, 0.99, -8.9, CREAM); cyl(0.04, 0.04, 0.2, -5.4 + i * 0.95, 1.05, -9.1, 0x3a78c8, {}, 8); box(0.45, 0.45, 0.45, -5.6 + i * 0.95, 0.55, -9.5, 0x3a2a22); }
  solid(0.5, 1.1, 0.5, -0.2, 0.55, -6.9, WOOD); box(0.5, 0.1, 0.4, -0.2, 1.15, -6.9, DARKW);                       // lectern
  for (const [x, c] of [[-6.4, BLUE], [-1.3, 0x1a4a8a]]) { cyl(0.03, 0.03, 3.2, x, 1.9, -11.5, 0xc4c8cc, {}, 6); box(0.9, 0.6, 0.02, x + 0.45, 3.2, -11.5, c); }   // flags
  box(2.4, 1.5, 0.06, -3.7, 2.6, BACK + 0.15, 0x5a4332); box(2.2, 1.3, 0.04, -3.7, 2.6, BACK + 0.2, 0xe8dec0); text('Our Town · Our Council', -3.7, 2.6, BACK + 0.3);
  for (const r of [0, 1, 2, 3]) for (let c = 0; c < 5; c++) { const x = -5.7 + c * 0.9, z = -4.3 + r * 1.1; if (model('chair_B_wood', x, z, Math.PI, { w: 0.5, d: 0.5, h: 0.9 })) continue; box(0.5, 0.06, 0.5, x, 0.45, z, 0x3a2a22); box(0.5, 0.5, 0.06, x, 0.75, z + 0.25, 0x3a2a22); box(0.04, 0.45, 0.04, x - 0.2, 0.22, z, 0x222222); box(0.04, 0.45, 0.04, x + 0.2, 0.22, z, 0x222222); }
  blocker(5.0, 0.7, -3.4, -4.3 - 0.0); blocker(5.0, 0.7, -3.4, -3.2); blocker(5.0, 0.7, -3.4, -2.1); blocker(5.0, 0.7, -3.4, -1.0);

  // ── foyer: noticeboard, honour board, ballot box, town map ──
  box(2.4, 1.3, 0.06, EDGE - 0.15, 2.0, 1.0, 0xc8a878); box(0.02, 1.1, 2.2, EDGE - 0.17, 2.0, 1.0, 0xd8b888); text('Council decisions', EDGE - 0.3, 2.0, 1.0);
  box(0.06, 1.0, 1.8, -EDGE + 0.12, 1.9, 2.5, 0x3a2a22); for (let i = 0; i < 6; i++) box(0.02, 0.08, 1.4, -EDGE + 0.17, 1.55 + i * 0.12, 2.5, GOLD); text('Honour board · Past mayors', -EDGE + 0.3, 2.55, 2.5);
  solid(0.5, 0.9, 0.5, 5.6, 0.45, 2.2, 0x3a2a22); box(0.5, 0.05, 0.5, 5.6, 0.92, 2.2, WOOD); box(0.26, 0.02, 0.04, 5.6, 0.95, 2.2, 0x111111); text('Ballot box', 5.6, 1.5, 2.2);
  box(1.8, 1.2, 0.06, 5.0, 2.4, 5.85, 0xd8c8a0); box(1.6, 1.0, 0.04, 5.0, 2.4, 5.8, 0xa8c898); text('Town map', 5.0, 2.4, 5.7);
  for (const [x, f] of [[-4.6, 'pictureframe_large_A'], [-2.6, 'pictureframe_medium'], [2.6, 'pictureframe_small_A']]) model(f, x, 5.88, Math.PI, { h: 0.8 }, 2.0);
  model('lamp_standing', -6.2, 3.8, 0, { w: 0.45, d: 0.45, h: 1.7 });
  solid(0.9, 0.8, 0.5, -5.6, 0.4, 5.0, WOOD); for (let i = 0; i < 5; i++) box(0.3, 0.02, 0.22, -5.8 + (i % 3) * 0.2, 0.82 + i * 0.012, 5.0, [CREAM, 0xe8d8b0, 0xd8e0e8][i % 3]);   // brochures

  // Repository Town founding history: an exhibit, not a claim of a legally gazetted NSW municipality.
  text('Repo’s Stores · 1883', -6.1, 2.72, 2.5);
  add('founding', 'Town origins · Sir Reginald Repo', 'info', townChronicleNotice(), -4.7, 3.5);
  add('geography', 'Where is Repository Town?', 'info', 'Candidate fictional NSW map anchor: '+TOWN_ORIGIN.site.latitude.toFixed(6)+', '+TOWN_ORIGIN.site.longitude.toFixed(6)+'. About 4.7 km in a straight line southwest of Minore. Repository Town exists here in our alternative universe, with town-zoned RU5 Village land. Real NSW GIS: MINORE 2830, Dubbo Regional Council, Lot 105 DP835474, RU1 agricultural zoning. Only the fictional land zoning differs; no real development permit is implied. River, flood and grid/road/water source realism still matters.',-3.2,4.3);
  add('counter', 'Public counter', 'civic-ledger', 'Pay rates, lodge a request or open the Town Ledger. The council meets here on its meeting days; the Town Ledger shows the budget, votes and repairs.', HALL_LAYOUT.staffUse.x, HALL_LAYOUT.staffUse.z);
  add('chamber', 'Meeting room', 'info', 'Five councillors sit at the table below the mayor\'s chair. Meetings are open to the public, and the gallery seats fill on a big vote.', -3.0, -6.2);
  add('notices', 'Council noticeboard', 'info', 'Decisions, budgets and works notices go up here. Roads, power and water repairs are decided in chamber and carried out by council crews.', 5.2, 0.4);
  add('ballot', 'Ballot box', 'info', 'Residents vote for mayor here every few weeks. Each resident gets one vote, and the count is posted on the board.', 4.4, 3.0);
  return k.finish({ staff: { pos: HALL_LAYOUT.staff, use: HALL_LAYOUT.staffUse } });
}
