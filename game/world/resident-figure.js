// Detailed, jointed human figures for residents.
//
// The figure is deliberately built from a small set of shared primitives plus a per-identity
// face, hair and outfit. It keeps the skeleton/joint contract of npcs.js (`legs`, `knees`,
// `arms`, `elbows`, `head`, `phase`) so every existing walker, seat, interaction and LOD path
// continues to work, while adding a real face, age/body proportions, activity clothing and
// natural poses. No textures or network fetches: this is cheap enough to draw many people on
// a phone, and the detail group is dropped beyond a short distance.
import * as THREE from 'three';
import { identityFor, outfitFor, blend } from './resident-identity.js';

const materials = new Map();
const geometries = new Map();
const mat = (colour, opts = null) => {
  const key = opts ? colour + ':' + JSON.stringify(opts) : String(colour);
  if (!materials.has(key)) materials.set(key, new THREE.MeshLambertMaterial({ color: colour, ...(opts || {}) }));
  return materials.get(key);
};
const geo = (kind) => {
  if (!geometries.has(kind)) {
    const [name, ...args] = kind.split(':').map((v, i) => i ? Number(v) : v);
    const g = name === 'box' ? new THREE.BoxGeometry(1, 1, 1)
      : name === 'ball' ? new THREE.SphereGeometry(1, 12, 9)
        : name === 'cyl' ? new THREE.CylinderGeometry(.5, .5, 1, 12)
          : name === 'capsule' ? new THREE.CapsuleGeometry(.5, 1, 5, 10)
            : name === 'cone' ? new THREE.ConeGeometry(.5, 1, 10)
              : new THREE.BoxGeometry(1, 1, 1);
    geometries.set(kind, g);
  }
  return geometries.get(kind);
};
const BOX = 'box', BALL = 'ball', CYL = 'cyl', CAP = 'capsule', CONE = 'cone';
// While an outfit is being rebuilt every garment mesh (including sleeves attached to arm
// bones, legwear on knee bones and hats on the head) is recorded here so the next outfit can
// remove all of it. Without this, switching home/work/rain repeatedly accumulated geometry.
let garmentCollector = null;
function add(parent, kind, colour, size, pos, rot = null, opts = null) {
  const m = new THREE.Mesh(geo(kind), mat(colour, opts));
  m.scale.set(...size);
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  parent.add(m);
  if (garmentCollector) garmentCollector.push(m);
  return m;
}
const ring = (parent, colour, size, pos, rot, opts) => add(parent, 'cyl', colour, size, pos, rot, opts);

// A torso with a chest, waist and belly rather than a featureless tube. Rings are unit-height
// and scaled per person; the small hips/chest groups let clothing follow the same silhouette.
const TORSO = (() => {
  const rings = [[0, .19, .125], [.18, .205, .138], [.42, .235, .155], [.46, .25, .16], [.58, .225, .135]];
  const pos = [], idx = [];
  for (const [y, w, d] of rings) pos.push(-w, y, -d, w, y, -d, w, y, d, -w, y, d);
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < 4; j++) {
    const a = i * 4 + j, b = i * 4 + (j + 1) % 4, c = (i + 1) * 4 + j, d = (i + 1) * 4 + (j + 1) % 4;
    idx.push(a, c, b, b, c, d);
  }
  idx.push(0, 1, 2, 0, 2, 3); const t = (rings.length - 1) * 4; idx.push(t, t + 2, t + 1, t, t + 3, t + 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
})();

const SHOE = 'shoe';
function skinMaterial(identity, which = 'base') { return identity.skin[which] ?? identity.skin.base; }

// Face detail is one reusable builder so the same eye spacing/nose/jaw can be reused by the
// rigged-model path later without duplicating feature maths.
export function buildHead(identity, { detail = true, talking = false } = {}) {
  const head = new THREE.Group();
  const f = identity.face, e = identity.eyes, s = identity.skin;
  const w = .205 * f.width, h = .235 * f.height, d = .19;
  add(head, BALL, s.base, [w, h, d], [0, 0, 0]);
  // Jaw and chin give the face an actual shape; the cheekbones sit slightly proud.
  add(head, BALL, s.base, [w * .78 * f.jaw, h * .56, d * .86], [0, -h * .46, d * .04]);
  add(head, BALL, s.shade, [w * .34 * f.chin, h * .28, d * .3], [0, -h * .8, d * .24]);
  for (const side of [-1, 1]) add(head, BALL, s.base, [w * .24 * f.cheek, h * .22, d * .38], [side * w * .52, -h * .14, d * .6]);
  // Ears, tucked against the head with a small lobe.
  for (const side of [-1, 1]) {
    add(head, BALL, s.shade, [.024, .041, .022], [side * w * .99, -h * .04, .005]);
    add(head, BALL, s.under, [.014, .019, .016], [side * w * 1.0, -h * .17, .01]);
  }
  const detailGroup = new THREE.Group(); detailGroup.name = 'face-detail'; head.add(detailGroup);
  const micro = new THREE.Group(); micro.name = 'face-micro'; detailGroup.add(micro);
  const simple = new THREE.Group(); simple.name = 'face-simple'; simple.visible = false; head.add(simple);
  const lids = [];
  const ex = .072 * e.spacing, ey = .028, ez = d * .93;
  const eyeColour = e.colour;
  for (const side of [-1, 1]) {
    add(detailGroup, BALL, 0xf6f1e7, [.024 * e.size, .0155 * e.size, .009], [side * ex, ey, ez]);
    add(detailGroup, BALL, eyeColour, [.0115 * e.size, .012 * e.size, .006], [side * ex, ey, ez + .004]);
    add(micro, BALL, 0x141414, [.0052 * e.size, .0062 * e.size, .0025], [side * ex, ey, ez + .0075]);
    add(micro, BALL, 0xf8f8f2, [.0028, .0028, .0015], [side * ex - .003, ey + .003, ez + .009]);
    // Upper/lower lids and a crease; the lids are what blink.
    lids.push(add(detailGroup, BALL, s.lid, [.032 * e.size, .008 * e.lid, .012], [side * ex, ey + .014, ez + .001]));
    add(detailGroup, BALL, s.shade, [.026 * e.size, .004, .009], [side * ex, ey - .011, ez + .002]);
    add(micro, BOX, s.lid, [.028 * e.size, .0018, .002], [side * ex, ey + .022, ez + .003]);
    // Brows follow the face's brow weight and tilt.
    const brow = add(detailGroup, BALL, identity.hair.base, [.036 * f.brow, .0055, .008], [side * ex, ey + .044 + e.tilt * .018, ez + .001]);
    brow.rotation.z = side * e.tilt * .55 + (side < 0 ? .06 : -.06);
    add(simple, BALL, eyeColour, [.022 * e.size, .012 * e.size, .008], [side * ex, ey, ez + .002]);
  }
  // Nose: bridge, tip and two nostrils.
  add(detailGroup, BOX, s.shade, [.022 * f.noseWidth, .056 * f.noseLength, .026], [0, -.005, d * .96]);
  add(detailGroup, BALL, s.base, [.026 * f.noseWidth, .019, .03], [0, -.043 * f.noseLength, d * 1.02]);
  for (const side of [-1, 1]) add(micro, BALL, s.under, [.006, .004, .004], [side * .014 * f.noseWidth, -.052, d * 1.01]);
  // Lips and smile line.
  add(detailGroup, BALL, s.lip, [.04 * f.lip, .0095, .011], [0, -.088, d * .97]);
  add(detailGroup, BALL, s.lip, [.038 * f.lip, .008, .01], [0, -.099, d * .965]);
  add(micro, BOX, blend(s.lip, 0x4a2424, .35), [.062, .0015, .002], [0, -.096, d * .98]);
  for (const side of [-1, 1]) add(micro, BALL, s.lip, [.0045, .004, .003], [side * .034, -.084, d * .975]);
  // Cheek warmth and freckles are deliberately subtle at phone scale.
  for (const side of [-1, 1]) add(detailGroup, BALL, s.blush, [.026, .014, .006], [side * .096, -.032, d * .9], null, { transparent: true, opacity: .5 });
  if (f.freckles) for (let i = 0; i < 11; i++) {
    const side = i % 2 ? 1 : -1, x = side * (.055 + (i * 37 % 40) / 1000), y = -.018 + (i * 53 % 25) / 1000;
    add(micro, BALL, blend(s.base, 0x8a5a3a, .35), [.0022, .0022, .001], [x, y, d * .93]);
  }
  if (f.mole) add(micro, BALL, s.under, [.0035, .0035, .0015], [f.mole.x, f.mole.y, d * .93]);
  if (f.wrinkles) {
    for (const side of [-1, 1]) for (let i = 0; i < 2; i++) add(micro, BOX, s.shade, [.028, .0013, .0015], [side * (.075 + i * .009), .055 + i * .009, d * .92], null, { transparent: true, opacity: .35 });
    add(micro, BOX, s.shade, [.05, .0013, .0015], [0, .105, d * .9], null, { transparent: true, opacity: .25 });
    for (const side of [-1, 1]) add(micro, BOX, s.shade, [.0013, .028, .0015], [side * .055, -.065, d * .89], null, { transparent: true, opacity: .3 });
  }
  // Facial hair.
  const fh = identity.accessories.facialHair;
  if (fh !== 'none') {
    const hair = blend(identity.hair.base, s.base, fh === 'stubble' ? .42 : .12);
    if (fh === 'moustache' || fh === 'full') add(detailGroup, BALL, hair, [.043, .009, .01], [0, -.066, d * .99]);
    if (fh === 'goatee' || fh === 'full') add(detailGroup, BALL, hair, [.025, .035, .012], [0, -.112, d * .95]);
    if (fh === 'full') {
      add(detailGroup, BALL, hair, [.088, .08, .03], [0, -.13, d * .82]);
      for (const side of [-1, 1]) add(detailGroup, BALL, hair, [.035, .07, .022], [side * .083, -.09, d * .82]);
    }
    if (fh === 'stubble') for (const side of [-1, 1]) add(detailGroup, BALL, hair, [.075, .07, .022], [side * .06, -.11, d * .86], null, { transparent: true, opacity: .55 });
  }
  // Glasses: fine rims and lenses, not heavy bars.
  if (identity.accessories.glasses) {
    const lens = identity.accessories.sunglasses ? 0x2a2f36 : 0xb9d3df;
    for (const side of [-1, 1]) {
      add(detailGroup, 'cyl', 0x3a3a3a, [.036, .003, .036], [side * ex, ey + .002, ez + .016], [Math.PI / 2, 0, 0]);
      add(detailGroup, 'cyl', lens, [.031, .0015, .031], [side * ex, ey + .002, ez + .017], [Math.PI / 2, 0, 0], { transparent: true, opacity: .38 });
      add(detailGroup, BOX, 0x3a3a3a, [.006, .003, .09], [side * .106, ey + .008, .11]);
    }
    add(detailGroup, BOX, 0x3a3a3a, [.025, .003, .003], [0, ey + .008, ez + .016]);
  }
  if (identity.accessories.hearingAid) add(detailGroup, BALL, 0x8f9aa3, [.012, .017, .008], [w * .99, -.06, -.02]);
  if (identity.accessories.earrings) for (const side of [-1, 1]) add(micro, BALL, 0xd8b45a, [.006, .012, .006], [side * w * 1.01, -h * .22, .0]);
  return { head, detail: detailGroup, micro, simple, lids, mouth: { x: 0, y: -.09, z: d * .97 } };
}

// Hair silhouettes. Each style is a handful of rounded masses around the head; long styles add
// a back/side mass so the silhouette is readable from behind on the street.
export function buildHair(identity) {
  const g = new THREE.Group(); g.name = 'hair';
  const h = identity.hair, s = identity.skin, f = identity.face;
  const base = h.base, hi = h.highlight;
  const w = .205 * f.width, hh = .235 * f.height, d = .19;
  const style = h.style;
  if (style === 'bald') { add(g, BALL, hi, [w * .93, hh * .35, d * .55], [0, hh * .42, -.02], null, { transparent: true, opacity: .25 }); return g; }
  if (style === 'buzz' || style === 'undercut') {
    add(g, BALL, base, [w * 1.01, hh * .62, d * 1.01], [0, hh * .42, -.012]);
    if (style === 'undercut') add(g, BALL, hi, [w * .98, hh * .32, d * .78], [0, hh * .62, -.04]);
    return g;
  }
  // Cap of hair over the skull, with a slight side part and a readable fringe.
  add(g, BALL, base, [w * 1.035, hh * .72, d * 1.02], [0, hh * .36, -.026]);
  add(g, BALL, hi, [w * .58, hh * .22, d * .7], [h.part * .045, hh * .62, -.02]);
  add(g, BALL, base, [w * .84, hh * .18, d * .28], [h.part * .035, hh * .54, d * .62]);
  if (style !== 'curly' && style !== 'wavy') add(g, BOX, hi, [w * .48, hh * .05, d * .08], [h.part * .05, hh * .48, d * .66], [0, 0, h.part * -.1]);
  if (style === 'short' || style === 'short-side') {
    for (const side of [-1, 1]) add(g, BALL, base, [w * .28, hh * .2, d * .42], [side * w * .72, hh * .12, -.02]);
    if (style === 'short-side') add(g, BOX, hi, [w * .62, hh * .06, d * .1], [h.part * .02, hh * .5, d * .68], [0, 0, h.part * -.08]);
    return g;
  }
  if (style === 'curly' || style === 'wavy') {
    const n = style === 'curly' ? 14 : 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = .85 + (i % 3) * .06;
      add(g, BALL, i % 4 === 0 ? hi : base, [w * .22 * r, hh * .2 * r, d * .22 * r],
        [Math.cos(a) * w * .72, hh * .4 + Math.sin(a) * hh * .28, -.02 + Math.sin(a * 2) * .04]);
    }
    if (style === 'wavy') for (const side of [-1, 1]) add(g, BALL, base, [w * .22, hh * .38, d * .22], [side * w * .82, hh * .04, -.04]);
    return g;
  }
  if (style === 'long' || style === 'bob' || style === 'braids' || style === 'ponytail' || style === 'bun') {
    const long = style === 'long' || style === 'braids';
    add(g, BALL, base, [w * 1.08, hh * .85, d * .9], [0, hh * .1, -.12]);
    for (const side of [-1, 1]) add(g, BALL, base, [w * .24, hh * (long ? .72 : .42), d * .32], [side * w * .8, hh * (long ? -.32 : -.12), -.04]);
    if (style === 'bob') for (const side of [-1, 1]) add(g, BALL, hi, [w * .2, hh * .2, d * .22], [side * w * .55, hh * .12, -.22]);
    if (style === 'long') for (const side of [-1, 1]) add(g, BALL, base, [w * .18, hh * .42, d * .2], [side * w * .55, -hh * .55, -.18]);
    if (style === 'ponytail') {
      add(g, BALL, base, [w * .25, hh * .32, d * .24], [0, hh * .38, -.28]);
      add(g, BALL, base, [w * .18, hh * .5, d * .2], [0, hh * .02, -.36]);
      add(g, BALL, hi, [w * .1, hh * .12, d * .11], [0, hh * .22, -.32]);
    }
    if (style === 'bun') {
      add(g, BALL, base, [w * .34, hh * .34, d * .32], [0, hh * .78, -.13]);
      add(g, BALL, hi, [w * .12, hh * .12, d * .12], [0, hh * .58, -.16]);
    }
    if (style === 'braids') for (const side of [-1, 1]) {
      add(g, BALL, base, [w * .13, hh * .82, d * .14], [side * w * .86, -hh * .25, -.02]);
      for (let i = 0; i < 3; i++) add(g, BALL, hi, [w * .14, hh * .12, d * .15], [side * w * .88, -hh * (.58 + i * .18), -.02]);
    }
    return g;
  }
  return g;
}

function addGarment(fig, outfit, identity) {
  const g = fig.clothing;
  while (g.children.length) g.remove(g.children[0]);
  if (fig._garmentParts) for (const part of fig._garmentParts) part.parent?.remove(part);
  fig._garmentParts = [];
  garmentCollector = fig._garmentParts;
  const s = identity.skin, b = identity.body, base = identity.clothing;
  const top = outfit.top, bottom = outfit.bottom;
  const torsoColour = top.colour;
  // Torso overlay: the same sculpted profile as the body, scaled just outside it, so the
  // garment covers the chest and waist instead of showing as a small floating medallion.
  const torsoOverlay = new THREE.Mesh(TORSO, mat(torsoColour));
  torsoOverlay.scale.set(b.torso * 1.045, 1.012, b.torso * 1.045);
  torsoOverlay.position.y = .948;
  g.add(torsoOverlay);
  add(g, BALL, torsoColour, [.235 * b.shoulder, .095, .148], [0, 1.515, 0]);
  if (b.belly > 0) add(g, BALL, torsoColour, [.19 * b.torso, .17 + b.belly, .158 * b.torso], [0, 1.08, .02]);
  if (top.style === 'shirt' || top.style === 'uniform' || top.style === 'polo' || top.style === 'work') {
    add(g, BOX, blend(torsoColour, 0xffffff, .18), [.2, .18, .02], [0, 1.42, .145]);
    for (let i = 0; i < 3; i++) add(g, BALL, blend(torsoColour, 0x111111, .45), [.008, .008, .006], [0, 1.34 - i * .07, .165]);
    if (top.tie) add(g, BOX, 0x6a2a2a, [.032, .22, .012], [0, 1.36, .163]);
    if (top.collar) {
      for (const side of [-1, 1]) add(g, BOX, blend(torsoColour, 0xffffff, .22), [.07, .035, .022], [side * .055, 1.52, .1], [0, 0, side * .35]);
    }
  }
  if (top.style === 'jumper' || top.style === 'cardigan') {
    add(g, BOX, blend(torsoColour, 0xffffff, .12), [.22, .28, .018], [0, 1.3, .15]);
    for (let i = 0; i < 3; i++) add(g, BALL, blend(torsoColour, 0x111111, .35), [.008, .008, .006], [0, 1.4 - i * .07, .166]);
  }
  if (top.style === 'tee' || top.style === 'tshirt') {
    add(g, BOX, blend(torsoColour, 0x111111, .12), [.24, .022, .01], [0, 1.47, .15]);
  }
  if (top.style === 'pyjama') for (let i = 0; i < 4; i++) add(g, BOX, blend(torsoColour, 0xffffff, .3), [.24, .01, .012], [0, 1.18 + i * .09, .158]);
  if (top.hiVis) {
    for (const y of [1.19, 1.38]) add(g, BOX, 0xd8e04a, [.255, .035, .02], [0, y, .153]);
    add(g, BOX, 0xefefef, [.255, .012, .021], [0, 1.28, .154]);
  }
  if (top.pattern === 'stripe') for (let i = 0; i < 5; i++) add(g, BOX, blend(torsoColour, 0xffffff, .3), [.235, .014, .012], [0, 1.12 + i * .08, .155]);
  if (top.pattern === 'check') for (let i = 0; i < 3; i++) for (let j = -1; j <= 1; j++) add(g, BOX, blend(torsoColour, 0x111111, .2), [.012, .2, .01], [j * .07, 1.32, .156]);
  // Sleeves: follow the upper arm and forearm; short sleeves stop above the elbow.
  for (const side of [-1, 1]) {
    const arm = fig.arms[side < 0 ? 0 : 1];
    add(arm, BALL, torsoColour, [.12, .132, .125], [0, -.04, 0]);
    add(arm, CYL, torsoColour, [.15 * b.arm, .27, .15 * b.arm], [0, -.18, 0]);
    if (top.sleeves === 'long') add(fig.elbows[side < 0 ? 0 : 1], CYL, torsoColour, [.125 * b.arm, .22, .125 * b.arm], [0, -.1, 0]);
    else add(fig.elbows[side < 0 ? 0 : 1], BALL, s.base, [.052, .105, .052], [0, -.11, 0]);
  }
  // Bottom: pelvis and upper/lower legs; shorts and skirts change what remains skin.
  const lowerColour = bottom.colour;
  add(g, BALL, lowerColour, [.215 * b.hip, .18, .145 * b.hip], [0, .95, 0]);
  for (const side of [-1, 1]) {
    const leg = fig.legs[side < 0 ? 0 : 1], knee = fig.knees[side < 0 ? 0 : 1];
    if (bottom.kind === 'shorts') {
      add(leg, CYL, lowerColour, [.16 * b.leg, .28, .16 * b.leg], [0, -.16, 0]);
      add(knee, CYL, s.base, [.1, .32, .1], [0, -.15, 0]);
    } else if (bottom.kind === 'pyjama') {
      add(leg, CYL, lowerColour, [.155 * b.leg, .38, .155 * b.leg], [0, -.18, 0]);
      add(knee, CYL, lowerColour, [.12, .36, .12], [0, -.17, 0]);
    } else if (bottom.kind === 'towel') {
      add(leg, CYL, s.base, [.13, .36, .13], [0, -.17, 0]);
      add(knee, CYL, s.base, [.1, .34, .1], [0, -.16, 0]);
    } else {
      add(leg, CYL, lowerColour, [.155 * b.leg, .39, .155 * b.leg], [0, -.19, 0]);
      add(knee, BALL, lowerColour, [.092, .088, .096], [0, 0, 0]);
      add(knee, CYL, lowerColour, [.12, .36, .12], [0, -.17, 0]);
    }
    // Shoes: at the foot end of each knee group.
    const shoe = outfit.shoes || { colour: 0x24262a, kind: 'shoes' };
    if (shoe.kind === 'barefoot' || outfit.barefoot) add(knee, BALL, s.base, [.095, .045, .15], [0, -.39, .045]);
    else {
      add(knee, BALL, s.base, [.07, .04, .09], [0, -.365, .025]);
      add(knee, BOX, shoe.colour, [.14, .07, .27], [0, -.39, .085]);
      if (shoe.kind === 'boots') add(knee, CYL, shoe.colour, [.13, .12, .13], [0, -.31, .01]);
    }
  }
  // Outerwear and aprons.
  if (outfit.outer) {
    const o = outfit.outer, open = o.open;
    if (o.kind === 'blazer' || o.kind === 'coat' || o.kind === 'jacket' || o.kind === 'raincoat') {
      for (const side of [-1, 1]) add(g, BALL, o.colour, [.09, .31, .12], [side * .17, 1.32, 0]);
      add(g, BALL, o.colour, [.25, .2, .12], [0, 1.42, -.03]);
      if (open) add(g, BOX, blend(o.colour, 0xffffff, .16), [.02, .44, .02], [0, 1.3, .16]);
      if (o.kind === 'raincoat') { add(g, BOX, 0x1a2a34, [.26, .02, .02], [0, 1.18, .16]); add(g, BALL, 0x1a2a34, [.26, .1, .04], [0, 1.54, .06]); }
      for (const side of [-1, 1]) {
        add(fig.arms[side < 0 ? 0 : 1], CYL, o.colour, [.16, .28, .16], [0, -.18, 0]);
        add(fig.elbows[side < 0 ? 0 : 1], CYL, o.colour, [.13, .22, .13], [0, -.1, 0]);
      }
    } else if (o.kind === 'jumper') {
      add(g, BALL, o.colour, [.255, .3, .165], [0, 1.33, 0]);
      for (const side of [-1, 1]) add(fig.arms[side < 0 ? 0 : 1], CYL, o.colour, [.158, .27, .158], [0, -.18, 0]);
    }
  }
  if (outfit.apron) {
    add(g, BOX, outfit.apron.colour, [.28, .52, .022], [0, 1.12, .166]);
    for (const side of [-1, 1]) add(g, BOX, outfit.apron.colour, [.035, .36, .02], [side * .12, 1.38, .155], [0, 0, side * .18]);
    add(g, BOX, blend(outfit.apron.colour, 0x111111, .2), [.2, .012, .023], [0, 1.26, .178]);
  }
  if (outfit.gloves) for (const side of [-1, 1]) add(fig.elbows[side < 0 ? 0 : 1], BALL, 0x3a3a32, [.06, .09, .06], [0, -.2, 0]);
  if (outfit.badge) add(g, BOX, 0xf0f0e8, [.06, .035, .008], [.12, 1.34, .17]);
  if (outfit.lanyard) {
    add(g, BOX, 0x2a5a8a, [.006, .32, .006], [-.07, 1.34, .165], [0, 0, .16]);
    add(g, BOX, 0xf0f0e8, [.05, .03, .006], [-.095, 1.18, .168]);
  }
  if (outfit.scarf) {
    add(g, 'cyl', outfit.scarf.colour, [.24, .04, .22], [0, 1.56, 0]);
    add(g, BOX, outfit.scarf.colour, [.09, .26, .02], [.05, 1.42, .14], [0, 0, .08]);
  }
  if (outfit.bag) {
    add(g, BOX, blend(base.trousers, 0x111111, .2), [.2, .26, .08], [.24, .98, .02]);
    add(g, BOX, blend(base.trousers, 0x111111, .3), [.016, .42, .016], [-.06, 1.3, .1], [0, 0, -.28]);
  }
  if (outfit.headwear) {
    const hw = outfit.headwear;
    if (hw.kind === 'cap') {
      add(fig.head, BALL, hw.colour, [.215, .09, .2], [0, .225, -.01]);
      add(fig.head, BOX, hw.colour, [.2, .025, .14], [0, .18, .12]);
    } else if (hw.kind === 'beanie') {
      add(fig.head, BALL, hw.colour, [.22, .14, .2], [0, .23, 0]);
      add(fig.head, 'cyl', hw.colour, [.45, .05, .43], [0, .17, 0]);
    } else {
      add(fig.head, 'cyl', hw.colour, [.42, .035, .36], [0, .27, 0]);
      add(fig.head, 'cyl', hw.colour, [.23, .17, .21], [0, .36, 0]);
    }
  }
  garmentCollector = null;
}

function buildProps(fig, identity) {
  const props = new THREE.Group(); props.name = 'props'; fig.posture.add(props);
  const bag = new THREE.Group();
  add(bag, BOX, blend(identity.clothing.trousers, 0x111111, .1), [.28, .22, .18], [0, 0, 0]);
  add(bag, BOX, identity.clothing.accent, [.05, .18, .02], [0, .12, .1]);
  bag.scale.setScalar(.8); bag.position.set(.27, .9, .12); bag.visible = false; props.add(bag);
  const box = new THREE.Group();
  add(box, BOX, 0xb08a5a, [.38, .3, .3], [0, 0, 0]);
  add(box, BOX, 0xe0d8c8, [.4, .025, .32], [0, .15, 0]);
  box.position.set(0, 1.05, .32); box.visible = false; props.add(box);
  const food = new THREE.Group();
  add(food, 'cyl', 0xe8e0cc, [.17, .02, .17], [0, 0, 0]);
  add(food, BALL, 0xd8a45a, [.07, .04, .06], [0, .02, .02]);
  add(food, BOX, 0xc0b090, [.02, .005, .16], [.04, .01, 0]);
  food.position.set(.18, 1.42, .28); food.visible = false; props.add(food);
  const tool = new THREE.Group();
  add(tool, 'cyl', 0x8a6a3a, [.025, .7, .025], [0, .35, 0]);
  add(tool, BOX, 0x6a6a6a, [.14, .06, .04], [0, .7, 0]);
  tool.position.set(.3, .9, .1); tool.rotation.z = -.3; tool.visible = false; props.add(tool);
  const umbrella = new THREE.Group();
  add(umbrella, 'cyl', 0x2a2a2a, [.012, .8, .012], [0, .4, 0]);
  add(umbrella, 'cone', 0x2f4a5a, [.65, .28, .65], [0, .82, 0], [Math.PI, 0, 0]);
  umbrella.position.set(.34, .9, .1); umbrella.visible = false; props.add(umbrella);
  return { group: props, bag, box, food, tool, umbrella };
}

// Build one detailed person. Returns the same joint contract as npcs.makePerson plus helpers.
export function makeResidentFigure(identityOrId, person = {}, options = {}) {
  const identity = typeof identityOrId === 'object' ? identityOrId : identityFor(identityOrId, person, options);
  const g = new THREE.Group();
  const posture = new THREE.Group(); posture.name = 'posture'; g.add(posture);
  const body = identity.body;
  const skin = identity.skin;
  const clothing = new THREE.Group(); clothing.name = 'clothing'; posture.add(clothing);
  const outfit = identity.outfit || outfitFor(identity, options);
  // A deliberately cheap far-distance proxy: seven meshes, same height and palette. It keeps
  // the street busy beyond 55 m without paying for 100 detailed parts per person.
  const proxy = new THREE.Group(); proxy.name = 'resident-lod-proxy'; proxy.visible = false; g.add(proxy);
  {
    const pw = .94;
    add(proxy, BALL, blend(outfit.top.colour, 0x111111, .18), [.24 * body.torso, .28, .15], [0, 1.36, 0]);
    add(proxy, BALL, skin.base, [.19 * pw, .22, .18], [0, 1.82, 0]);
    add(proxy, BALL, identity.hair.base, [.2 * pw, .1, .19], [0, 1.98, -.01]);
    for (const side of [-1, 1]) {
      add(proxy, 'cyl', outfit.bottom.colour, [.14, .78, .14], [side * .12, .44, 0]);
      add(proxy, 'cyl', outfit.top.colour, [.12, .58, .12], [side * .3, 1.15, 0]);
    }
  }
  // Body. Height is applied by the caller (makeDistinctPerson) so age/build keep the
  // long-standing group.scale contract used by collision clearance and tests.
  add(posture, BALL, skin.base, [.195 * body.hip, .15, .145 * body.hip], [0, .95, 0]);
  const torso = new THREE.Mesh(TORSO, mat(skin.base));
  torso.scale.set(body.torso, 1, body.torso); torso.position.y = .95; posture.add(torso);
  if (body.belly > 0) add(posture, BALL, skin.base, [.18 * body.torso, .16 + body.belly, .15 * body.torso], [0, 1.08, .02]);
  add(posture, BALL, skin.base, [.225 * body.shoulder, .09, .14], [0, 1.52, 0]);
  add(posture, 'cyl', skin.base, [.095 * body.neck, .11, .09 * body.neck], [0, 1.595, 0]);
  const head = new THREE.Group(); head.position.set(0, 1.805, 0); posture.add(head);
  const headParts = buildHead(identity, options);
  head.add(headParts.head);
  const hair = buildHair(identity); head.add(hair);
  const legs = [], knees = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(side * .125 * body.hip, .88, 0); posture.add(hip);
    add(hip, 'cyl', skin.base, [.15 * body.leg, .4, .15 * body.leg], [0, -.2, 0]);
    const knee = new THREE.Group(); knee.position.y = -.4; hip.add(knee);
    add(knee, BALL, skin.base, [.085, .085, .09], [0, 0, 0]);
    add(knee, 'cyl', skin.base, [.12 * body.leg, .37, .12 * body.leg], [0, -.185, .005]);
    add(knee, BALL, 0x24262a, [.12, .07, .18], [0, -.385, .08]);
    legs.push(hip); knees.push(knee);
  }
  const arms = [], elbows = [], hands = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group(); shoulder.position.set(side * .29 * body.shoulder, 1.465, 0); posture.add(shoulder);
    add(shoulder, BALL, skin.base, [.115, .125, .12], [0, -.04, 0]);
    add(shoulder, 'cyl', skin.base, [.122 * body.arm, .27, .122 * body.arm], [0, -.19, 0]);
    const elbow = new THREE.Group(); elbow.position.y = -.33; shoulder.add(elbow);
    add(elbow, 'cyl', skin.base, [.108 * body.arm, .22, .108 * body.arm], [0, -.11, 0]);
    const hand = add(elbow, BALL, skin.base, [.074, .09, .07], [0, -.255, .005]);
    for (let f = 0; f < 4; f++) add(elbow, 'cyl', skin.base, [.017 * body.hand, .075, .017 * body.hand], [(-.03 + f * .02), -.305, .015]);
    arms.push(shoulder); elbows.push(elbow); hands.push(hand);
  }
  const fig = {
    group: g, posture, head, legs, knees, arms, elbows, hands, clothing, face: headParts,
    props: buildProps({ posture, arms, elbows, head }, identity), proxy,
    identity, outfit, phase: (identity.seed % 997) * .137,
    activity: options.activity || 'home', lod: 0, _outfitKey: outfit.key,
    _blink: 0, _breath: 0,
  };
  addGarment(fig, outfit, identity);
  // The existing renderer expects an outfit group it can hide when a rigged model takes over.
  clothing.userData.isOutfit = true;
  // Activity clothing can be swapped without rebuilding the body.
  fig.setOutfit = (nextOutfit, context = {}) => {
    if (nextOutfit?.key && nextOutfit.key === fig._outfitKey) return;
    fig.outfit = nextOutfit || outfitFor(identity, context);
    fig._outfitKey = fig.outfit.key;
    addGarment(fig, fig.outfit, identity);
    fig.props.bag.visible = !!fig.outfit.bag;
  };
  fig.setActivity = (activity, context = {}) => {
    fig.activity = activity;
    if (context.outfit) fig.setOutfit(context.outfit, context);
    else if (context.weather != null || context.minute != null || context.jobKind != null || context.mode != null) {
      fig.setOutfit(outfitFor(identity, { ...context, activity }), context);
    }
  };
  // LOD: 0 full face/hands, 1 no micro detail, 2 silhouette only. Hair and eyes remain readable.
  // Manual calls (Studio, screenshots) take precedence over the automatic distance sensor.
  fig.setLod = (level = 0, { manual = true } = {}) => {
    if (manual) fig.lodMode = 'manual';
    level = Math.max(0, Math.min(3, level | 0));
    if (fig.lod === level) return;
    fig.lod = level;
    fig.face.micro.visible = level < 1;
    fig.face.detail.visible = level < 2;
    fig.face.simple.visible = level === 2;
    fig.hands.forEach((h) => { h.visible = level < 2; });
    if (fig.proxy) fig.proxy.visible = level >= 3;
    fig.posture.visible = level < 3;
  };
  g.userData.residentAppearance = identity;
  g.userData.setLod = fig.setLod;
  g.userData.setActivity = fig.setActivity;
  g.userData.setOutfit = fig.setOutfit;
  g.userData.isResidentFigure = true;
  g.userData.advancedPose = (dt, t, moving, faceForward) => poseResident(fig, dt, t, moving, faceForward);
  // Automatic distance LOD without any renderer edits: one invisible sensor mesh reports
  // its distance to the active camera each frame and picks the LOD tier. This keeps the
  // busy street cheap (proxy far away, full face near) while leaving pub-audited renderer
  // files untouched. The sensor is one negligible draw call per visible person.
  const sensor = new THREE.Mesh(new THREE.SphereGeometry(.001, 2, 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
  sensor.name = 'resident-lod-sensor'; sensor.frustumCulled = false; sensor.renderOrder = 999; g.add(sensor);
  const sensorWorld = new THREE.Vector3();
  sensor.onBeforeRender = (renderer, scene, camera) => {
    if (fig.lodMode === 'manual') return;
    sensor.getWorldPosition(sensorWorld);
    const d = sensorWorld.distanceTo(camera.position);
    fig.setLod(d > 48 ? 3 : d > 24 ? 2 : d > 12 ? 1 : 0, { manual: false });
  };
  // Apply the initial outfit key and initial pose.
  fig.props.bag.visible = !!outfit.bag;
  poseResident(fig, 1 / 60, 0, false, false);
  return fig;
}

const ease = (r, v, k) => r + (v - r) * Math.min(1, k);
export function poseResident(fig, dt, t, moving, faceForward = moving) {
  const id = fig.identity, b = id.body, gait = id.gait, ph = Number.isFinite(fig.phase) ? fig.phase : 0;
  const speedScale = moving ? 1 : 0;
  const swing = moving ? Math.sin(t * 7 * gait.speed + ph) * .55 * gait.stride : 0;
  const bounce = moving ? Math.abs(Math.sin(t * 7 * gait.speed + ph)) * .035 * gait.bounce : 0;
  const sit = /sit|eat|meal|desk|lunch|dinner|breakfast|cafe|pub|car|drive/.test(fig.activity) && !/stand|walk|work at station/.test(fig.activity);
  const sleep = /sleep|asleep|bed/.test(fig.activity);
  const carry = /carry|shopping|parcel|box|grocer/.test(fig.activity);
  const eat = /eat|meal|breakfast|dinner|lunch/.test(fig.activity);
  const work = /work|shift|serving|stacking|cooking|cleaning|building|repair/.test(fig.activity);
  const talk = /talk|chat|convers/.test(fig.activity);
  const k = Math.min(1, dt * 10);
  // Root posture: sit, lie or stand. The group origin remains on the ground for callers.
  const targetY = sleep ? .62 : sit ? -.43 : bounce;
  const targetRX = sleep ? -Math.PI / 2 : 0;
  fig.posture.position.y = ease(fig.posture.position.y, targetY, k);
  fig.posture.rotation.x = ease(fig.posture.rotation.x, targetRX, Math.min(1, dt * 5));
  if (sleep) fig.posture.position.z = ease(fig.posture.position.z, -.15, k);
  // Legs.
  const thigh = sleep ? .05 : sit ? -Math.PI / 2 : swing;
  const shin = sleep ? -.05 : sit ? Math.PI / 2 : moving ? Math.max(0, -swing) * .7 : 0;
  fig.legs[0].rotation.x = ease(fig.legs[0].rotation.x, thigh, k);
  fig.legs[1].rotation.x = ease(fig.legs[1].rotation.x, sleep ? -.05 : sit ? -Math.PI / 2 : -swing, k);
  fig.knees[0].rotation.x = ease(fig.knees[0].rotation.x, shin, k);
  fig.knees[1].rotation.x = ease(fig.knees[1].rotation.x, sleep ? -.05 : sit ? Math.PI / 2 : moving ? Math.max(0, swing) * .7 : 0, k);
  // Arms: walk swing, rest at side, or hold food/tool/bag.
  let armA = moving ? -swing * .8 * gait.armSwing : 0;
  let armB = moving ? swing * .8 * gait.armSwing : 0;
  let elbowA = moving ? .1 : .04, elbowB = moving ? .1 : .04;
  if (sit) { armA = -.18; armB = -.18; elbowA = .55; elbowB = .55; }
  if (carry) { armA = -.72; armB = -.72; elbowA = .35; elbowB = .35; }
  if (eat) { armB = -1.15; elbowB = 1.45; armA = -.25; elbowA = .45; }
  if (work) { armA = -.9 + Math.sin(t * 2.3 + ph) * .12; armB = -.55 + Math.cos(t * 2.0 + ph) * .1; elbowA = .55; elbowB = .4; }
  if (talk) { armA = -.35 + Math.sin(t * 1.9 + ph) * .12; elbowA = .7; }
  fig.arms[0].rotation.x = ease(fig.arms[0].rotation.x, armA, k);
  fig.arms[1].rotation.x = ease(fig.arms[1].rotation.x, armB, k);
  fig.elbows[0].rotation.x = ease(fig.elbows[0].rotation.x, elbowA, k);
  fig.elbows[1].rotation.x = ease(fig.elbows[1].rotation.x, elbowB, k);
  // A little lateral sway and shoulder counter-rotation for a natural walk.
  fig.arms[0].rotation.z = ease(fig.arms[0].rotation.z, moving ? .06 + Math.sin(t * 7 * gait.speed + ph) * .04 * gait.sway : .04, k);
  fig.arms[1].rotation.z = ease(fig.arms[1].rotation.z, moving ? -.06 - Math.sin(t * 7 * gait.speed + ph) * .04 * gait.sway : -.04, k);
  // Head: face forward, glance around when idle, look at a conversation partner handled by caller.
  if (faceForward) fig.head.rotation.y = ease(fig.head.rotation.y, 0, k);
  else fig.head.rotation.y = Math.sin(t * .7 + ph) * .5;
  fig.head.rotation.x = ease(fig.head.rotation.x, sleep ? .2 : b.posture * .35 + (eat ? .08 : 0) + (moving ? Math.sin(t * 3.5 + ph) * .015 : 0), k);
  fig.head.rotation.z = ease(fig.head.rotation.z, id.gait.headTilt, k);
  // Blink roughly every 3-6 seconds, deterministic by identity.
  fig._blink = (fig._blink || 0) + dt;
  const blinkPeriod = 3.2 + (id.seed % 17) / 10;
  const blink = fig._blink % blinkPeriod < .12;
  for (const lid of fig.face.lids) lid.scale.y = blink ? .0015 : .008 * id.eyes.lid;
  // Talking mouth: a tiny open/close on the lower lip; keep it bounded.
  const mouth = fig.face.detail.children.find((m) => m.scale.x > .03 && m.scale.x < .06 && m.position.y < -.08);
  if (mouth) mouth.scale.y = ease(mouth.scale.y, talk || eat ? .014 + Math.abs(Math.sin(t * 9 + ph)) * .012 : .008, k);
  // Props visibility. A shopper carries bags; other carrying work uses the parcel box.
  const bagCarry = carry && /bag|shopping|grocer|parcel/.test(fig.activity);
  fig.props.bag.visible = bagCarry || (!!fig.outfit.bag && !carry);
  fig.props.box.visible = carry && !bagCarry;
  fig.props.food.visible = eat;
  fig.props.tool.visible = work;
  fig.props.umbrella.visible = !!fig.outfit.umbrella;
  fig.props.umbrella.rotation.z = ease(fig.props.umbrella.rotation.z, 0, k);
  fig.props.group.visible = fig.props.bag.visible || fig.props.box.visible || fig.props.food.visible || fig.props.tool.visible || fig.props.umbrella.visible;
}
