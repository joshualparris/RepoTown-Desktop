import { createKit, ROOM } from './interior-kit.js';

// The School and Library, laid out like a small country school with a community library:
//   • A librarian's desk at the back right with a returns trolley and card catalogue; tall bookshelves
//     line the left wall and two island stacks run down the middle-left, with reading tables on the right.
//   • A classroom corner at the front left: a blackboard on the wall, rows of student desks, a globe and
//     a wall chart; children's bean bags and a picture-book bin near the door.
export const SCHOOL_LAYOUT = Object.freeze({ deskZ: -5.6, staff: { x: 2.4, z: -6.7 }, staffUse: { x: 2.4, z: -4.3 } });

export function buildSchoolInterior(site, makeLabel, roomTitle = 'School and library') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, solid, text, add, model } = k;
  const { W, BACK, EDGE } = ROOM;
  const DZ = SCHOOL_LAYOUT.deskZ;
  group.add(new THREE.HemisphereLight(0xfff8e6, 0x6a6458, 2.1));
  const WOOD = 0x9a7650, WOODD = 0x5d422b, BLUE = 0x3f6fa0, RED = 0xb34a3a, CREAM = 0xf2ecd9, BOARD = 0x2b4a3a;
  const SPINES = [0xb34a3a, 0x3f6fa0, 0x5f8a4e, 0xe8c040, 0x7a4a8a, 0xc8a070, 0x2f6a78, 0xd8803a];
  k.shell({ wall: 0xede6d2, ceiling: 0xf7f3e8, floor: 0xb89d72 });
  for (let i = 0; i < 14; i++) box(0.96, 0.014, 17.4, -6.5 + i, 0.004, -3, i % 2 ? 0xa88c62 : 0xb89d72);
  box(W - 0.5, 0.9, 0.05, 0, 0.45, BACK + 0.14, BLUE); box(0.05, 0.9, 17.4, EDGE - 0.14, 0.45, -3, BLUE);
  for (const [x, z] of [[-4, 0], [4, 0], [-4, -5], [4, -5]]) box(1.6, 0.05, 0.4, x, 3.75, z, 0xfafafa, { e: 0xffffff });
  box(3.0, 0.03, 2.0, 3.2, 0.02, 0.0, 0x9a4a3a); box(2.7, 0.02, 1.7, 3.2, 0.04, 0.0, 0xd8b868);                       // reading rug

  // ── librarian desk, returns trolley, card catalogue ──
  solid(4.6, 1.05, 0.9, 2.4, 0.52, DZ, WOOD); box(4.7, 0.06, 1.0, 2.4, 1.08, DZ, 0xd8c39a); box(4.6, 0.5, 0.06, 2.4, 0.3, DZ + 0.47, BLUE);
  box(0.45, 0.3, 0.05, 1.4, 1.35, DZ - 0.1, 0x2d3036); box(0.4, 0.22, 0.02, 1.4, 1.36, DZ - 0.07, 0x8fc4e8, { e: 0x4f94c8 });   // computer
  for (let i = 0; i < 6; i++) box(0.3, 0.06, 0.22, 3.5, 1.14 + i * 0.06, DZ + 0.1, SPINES[i]);                                // stamped books awaiting shelving
  text(site.name, 2.4, 3.5, BACK + 0.3, 'room'); text('Library desk', 2.4, 2.0, DZ - 0.2);
  solid(0.8, 0.9, 0.5, 5.9, 0.45, -8.6, WOODD); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) box(0.16, 0.2, 0.04, 5.9 - 0.3 + c * 0.2, 0.2 + r * 0.26, -8.34, 0xd8c39a);   // card catalogue
  solid(1.0, 0.8, 0.6, -1.0, 0.4, -9.4, 0xaeb5ba); for (let i = 0; i < 8; i++) box(0.2, 0.28, 0.4, -1.4 + i * 0.12, 0.95, -9.4, SPINES[i]);   // returns trolley
  model('lamp_standing', 5.9, -6.5, 0, { h: 1.6 });

  // ── shelving: wall run on the left and two island stacks ──
  solid(0.6, 2.4, 8.4, -EDGE + 0.4, 1.2, -6.2, WOODD);
  for (let r = 0; r < 5; r++) for (let i = 0; i < 28; i++) box(0.34, 0.3, 0.07, -EDGE + 0.72, 0.4 + r * 0.42, -10.2 + i * 0.3, SPINES[(i + r) % 8]);
  for (const x of [-3.8, -2.2]) {
    solid(0.55, 2.0, 5.0, x, 1.0, -7.0, WOODD);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 16; i++) for (const s of [-1, 1]) box(0.07, 0.3, 0.2, x + s * 0.29, 0.35 + r * 0.45, -9.4 + i * 0.3, SPINES[(i * 3 + r) % 8]);
  }
  text('Fiction · History · Farming', -EDGE + 0.9, 2.8, -6.2); text('Non-fiction', -3.0, 2.5, -9.7);

  // ── reading tables ──
  for (const z of [-2.0, 2.0]) {
    if (!model('table_medium_long', 5.0, z, Math.PI / 2, { w: 1.1, d: 2.2 })) box(1.0, 0.08, 2.2, 5.0, 0.76, z, WOOD);
    k.blocker(1.2, 2.3, 5.0, z);
    for (const dz of [-0.6, 0.6]) for (const dx of [-0.85, 0.85]) model('chair_A_wood', 5.0 + dx, z + dz, dx > 0 ? Math.PI / 2 : -Math.PI / 2, { h: 0.9 });
  }
  box(0.4, 0.04, 0.3, 5.0, 0.82, -2.0, 0xf4f4f0); box(0.3, 0.03, 0.22, 5.0, 0.82, 2.0, 0xe8c040);

  // ── classroom corner (front left): blackboard, desks, globe, wall chart ──
  box(0.05, 1.3, 3.4, -EDGE + 0.16, 1.9, 2.8, BOARD); box(0.06, 0.05, 3.5, -EDGE + 0.16, 1.2, 2.8, WOODD); box(0.08, 0.04, 0.8, -EDGE + 0.2, 1.24, 2.8, 0xf4f4f0);
  text('Today: Reading & Sums', -EDGE + 0.5, 2.0, 2.8);
  for (const [x, z] of [[-5.0, -0.2], [-2.8, -0.2], [-5.0, 2.0], [-2.8, 2.0], [-5.0, 4.2], [-2.8, 4.2]]) {
    solid(1.0, 0.75, 0.6, x, 0.4, z, WOOD); box(1.05, 0.04, 0.65, x, 0.78, z, 0xd8c39a);
    model('chair_stool_wood', x, z + 0.6, 0, { h: 0.5 }) || box(0.35, 0.4, 0.35, x, 0.22, z + 0.6, WOODD);
    box(0.3, 0.03, 0.22, x, 0.82, z, [RED, BLUE, 0x5f8a4e][Math.abs((x * 3 + z) | 0) % 3]);
  }
  cyl(0.02, 0.02, 0.5, -1.2, 0.5, 4.8, 0x8d949a, {}, 6); ball(0.22, -1.2, 0.95, 4.8, 0x3f6fa0);                              // globe
  box(0.9, 1.2, 0.04, 6.4, 1.9, 4.0, 0xf2ecd9); text('Alphabet', 6.35, 1.9, 4.0);
  for (let i = 0; i < 4; i++) { ball(0.4, -6.0 + (i % 2) * 0.9, 0.3, 5.2 - Math.floor(i / 2) * 0.0 - 0.6 * (i % 2) * 0, [0xd8452f, 0x3f6fa0, 0xe8c040, 0x5f9a54][i]); }  // bean bags by the door
  model('pictureframe_large_A', 0, 5.88, Math.PI, { h: 0.9 }, 1.8);
  model('cactus_small_A', 6.3, 5.3, 0, { h: 0.5 });

  add('desk', 'Library desk', 'civic-ledger', 'Borrow a book with your town library card, ask the librarian for a recommendation, or open the Town Ledger.', SCHOOL_LAYOUT.staffUse.x, SCHOOL_LAYOUT.staffUse.z);
  add('stacks', 'Library shelves', 'info', 'Fiction, local history and farming manuals fill the stacks. The oldest books are the farming almanacs from the town\'s first season.', -5.2, -6.0);
  add('reading', 'Reading tables', 'info', 'Quiet tables for reading and homework. Locals read the papers here, and the older kids help the little ones sound out words.', 3.4, 0.0);
  add('class', 'Blackboard and desks', 'info', 'The school day runs from half past eight until three. The teacher chalks the day\'s reading and sums on the board before the bell.', -4.0, 1.9);
  return k.finish({ staff: { pos: SCHOOL_LAYOUT.staff, use: SCHOOL_LAYOUT.staffUse } });
}
