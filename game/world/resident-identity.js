// Persistent, deterministic human identity for every resident.
//
// One identity record is derived from the immutable simulation id and the person's known
// facts (age, gender, job, role). Faces, hair, body proportions, height, clothing palette,
// gait and voice all come from that record, so the same person looks the same at home, at
// work, in Coles, on the street and behind the wheel. Nothing here depends on the renderer
// or on a frame counter: the same id produces the same person on every load and every device.
//
// All people are fictional. The identity system never adds a real address, roster or private
// fact; it only styles a person the simulation already owns.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// FNV-1a over UTF-16 code points, then mulberry32. Stable across Node and browsers.
export function hashString(value) {
  let h = 2166136261;
  for (const ch of String(value ?? 'resident')) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, list) => list[Math.floor(rng() * list.length) % list.length];
const between = (rng, a, b) => a + (b - a) * rng();
const chance = (rng, p) => rng() < p;

// Natural ranges rather than a handful of repeated tokens. Skin tones span fair through
// deep brown with warm/neutral/cool undertones; hair includes the greys people actually have.
const SKIN = [
  { base: 0xf3d3b5, shade: 0xe1b995, under: 0xc98f6f }, // fair warm
  { base: 0xf0c7a5, shade: 0xd9a77f, under: 0xbd8765 }, // light warm
  { base: 0xe8b48d, shade: 0xce9169, under: 0xb47755 }, // light tan
  { base: 0xd99a6c, shade: 0xbd7950, under: 0x9e5f3c }, // tan
  { base: 0xc6865a, shade: 0xa9653e, under: 0x8a4d2d }, // brown
  { base: 0xa96a43, shade: 0x8a4d2d, under: 0x6d381f }, // deep brown
  { base: 0x8a5030, shade: 0x6d381f, under: 0x522715 }, // deep
  { base: 0x6b3a22, shade: 0x522715, under: 0x3c1b0e }, // very deep
  { base: 0xe6b9a1, shade: 0xc9917a, under: 0xac715c }, // fair cool/rosy
  { base: 0xb97b55, shade: 0x965a39, under: 0x774225 }, // medium warm
];
const HAIR = [
  { base: 0x1c1714, hi: 0x32271f }, // black-brown
  { base: 0x2e2118, hi: 0x4a3524 }, // dark brown
  { base: 0x4b3222, hi: 0x6d4a32 }, // brown
  { base: 0x6f4a2c, hi: 0x91643d }, // chestnut
  { base: 0x9a6a38, hi: 0xbd8a52 }, // auburn/light brown
  { base: 0xc49a5f, hi: 0xdfbd85 }, // dark blonde
  { base: 0xdcc08a, hi: 0xefd9ad }, // blonde
  { base: 0x8d8a84, hi: 0xb3afa7 }, // salt and pepper
  { base: 0xb9b5ae, hi: 0xd8d4cc }, // grey
  { base: 0xf0ece4, hi: 0xffffff }, // white
  { base: 0x7a2f24, hi: 0x9d4a36 }, // red
  { base: 0x3b2a3f, hi: 0x5b4260 }, // dyed plum
  { base: 0x23404a, hi: 0x37616d }, // dyed teal
];
const EYES = [0x3b2a1e, 0x2d2620, 0x4a6b3f, 0x5b7f7a, 0x47708f, 0x7a5b3e, 0x6b6f75, 0x8a6a2f];
const SHIRT_HUES = [0x2f5f8a, 0x8c3f3a, 0x3f6b4a, 0x9a6a2f, 0x5c4a7a, 0x2f6f75, 0x9a4f6a, 0x6a5a4a, 0x4a5a6a, 0xb08a4a, 0x3a7a5a, 0x7a3a4a];
const TROUSER_HUES = [0x2b3648, 0x3b3a42, 0x3d4c38, 0x5a4436, 0x253b42, 0x5c4b3d, 0x3f4452, 0x1f2a36, 0x6b5a48];
const HAIR_STYLES = ['short', 'short-side', 'buzz', 'curly', 'wavy', 'long', 'bob', 'ponytail', 'bun', 'braids', 'bald', 'undercut'];
const FACE_SHAPES = ['oval', 'round', 'square', 'long', 'heart', 'diamond'];
const BUILDS = ['slim', 'athletic', 'average', 'solid', 'round', 'tall-lean'];
const GAITS = ['steady', 'brisk', 'easy', 'shuffling', 'upright', 'rolling'];

// A short, human-readable occupation from what the simulation already knows.
export function occupationLabel(person = {}) {
  const kind = String(person.workplaceKind || person.kind || '').toLowerCase();
  const job = String(person.job || '').toLowerCase();
  const name = String(person.workplaceName || person.workplace || '');
  const age = Number.isFinite(person.age) ? person.age : null;
  // Pupils are pupils regardless of the building they attend. A school workplace must
  // never turn an 8-year-old into a teacher.
  if (person.role === 'child' || (age !== null && age < 18)) return age !== null && age < 5 ? 'preschool child' : 'student';
  if (/student|pupil|school child/.test(job)) return 'student';
  if (job === 'retired' || job === 'retiree') return 'retired';
  const byKind = {
    supermarket: 'supermarket team member', school: 'teacher', hospital: 'nurse', townhall: 'council officer',
    government: 'public servant', social_facility: 'support worker', doctors: 'doctor', pharmacy: 'pharmacist',
    police: 'police officer', post_office: 'postal worker', bank: 'bank teller', pub: 'publican', bar: 'bar attendant',
    cafe: 'café worker', bakery: 'baker', restaurant: 'cook', butcher: 'butcher', fuel: 'console operator',
    car_repair: 'mechanic', tyres: 'tyre fitter', library: 'librarian', courthouse: 'court officer',
    fire_station: 'firefighter', estate_agent: 'real estate agent', hairdresser: 'hairdresser', beauty: 'beautician',
    clothes: 'retail assistant', fashion_accessories: 'retail assistant', houseware: 'retail assistant',
    alcohol: 'liquor store worker', charity: 'op-shop worker', second_hand: 'op-shop worker', jewelry: 'jeweller',
    laundry: 'laundry worker', car: 'car salesperson', car_wash: 'car washer', caravan: 'caravan park worker',
    camp_site: 'caretaker', guest_house: 'hospitality worker', museum: 'museum guide', physiotherapist: 'physiotherapist',
    educational_institution: 'trainer', coworking: 'co-working host', animal_shelter: 'animal carer',
    sports_centre: 'sports instructor', golf_course: 'greenkeeper', railway_station: 'station assistant',
    aerodrome: 'aerodrome worker', community_centre: 'community worker', agrarian: 'farm worker', trade: 'tradesperson',
    hvac: 'air-conditioning technician', accounting: 'accountant', lawyer: 'solicitor',
  };
  if (byKind[kind]) return byKind[kind];
  if (job) return job;
  if (/school/.test(name)) return 'teacher';
  if (/hospital|health|medical/.test(name)) return 'health worker';
  if (/council|shire/.test(name)) return 'council officer';
  return person.age != null && person.age >= 67 ? 'retired' : person.age != null && person.age < 18 ? 'student' : 'resident';
}

// Which layer of clothing an activity calls for. The figure uses this to swap garments and
// accessories instead of drawing the same outfit in bed, at work and in the rain.
export function outfitContext(person = {}, { activity = 'home', minute = 8 * 60, weather = 'sunny', day = 1, indoor = false } = {}) {
  const a = String(activity || 'home').toLowerCase();
  const job = String(person.job || '').toLowerCase();
  const kind = String(person.workplaceKind || person.kind || '').toLowerCase();
  const age = Number.isFinite(person.age) ? person.age : 35;
  const night = minute < 6 * 60 || minute >= 21 * 60;
  const sleep = /sleep|asleep|bed/.test(a);
  const wash = /shower|bath|wash|hygiene/.test(a);
  const work = /work|shift|school|class|station|patrol|service/.test(a) && !sleep;
  const shop = /shop|coles|grocer|errand/.test(a);
  const eat = /breakfast|dinner|lunch|eat|meal/.test(a);
  const exercise = /jog|run|exercise|sport|walk dog/.test(a);
  let mode = 'home';
  if (sleep) mode = 'sleep';
  else if (wash) mode = 'wash';
  else if (work) mode = 'work';
  else if (shop) mode = 'shop';
  else if (eat) mode = 'home';
  else if (exercise) mode = 'exercise';
  else if (night) mode = 'night';
  return {
    mode, activity: a, job, kind, age, minute, weather, day, indoor,
    school: /school|class/.test(a) || (age >= 5 && age <= 17 && /school/.test(String(person.job || ''))),
    worker: work,
    jobKind: kind || job,
  };
}

function inferAge(person) {
  if (Number.isFinite(person.age)) return person.age;
  const j = String(person.job || '').toLowerCase();
  if (/baby|toddler|preschool/.test(j)) return 4;
  if (/student|pupil/.test(j)) return 15;
  if (/retired|senior/.test(j)) return 72;
  return 35;
}

function inferGender(person, rng) {
  if (person.gender === 'male' || person.gender === 'female') return person.gender;
  return rng() < 0.49 ? 'male' : 'female';
}

// Main identity record. `person` is optional; ids alone still produce a stable, plausible adult.
export function identityFor(id, person = {}, options = {}) {
  const key = String(id ?? person.id ?? person.populationId ?? person.name ?? 'resident');
  // Phenotype is immutable: only the stable id seeds skin, hair, eyes, face and body.
  // Role/job/workplace changes may change clothing and occupation, never the person's look.
  const rng = seededRandom(hashString(key));
  const age = clamp(Math.round(inferAge(person)), 0, 100);
  const gender = inferGender(person, rng);
  const child = age < 13, teen = age >= 13 && age < 18, senior = age >= 68;
  const skin = pick(rng, SKIN);
  const hair = age >= 65 || (age >= 55 && chance(rng, 0.35)) ? pick(rng, [HAIR[7], HAIR[8], HAIR[9]]) : pick(rng, HAIR);
  const faceShape = pick(rng, FACE_SHAPES);
  const build = child ? pick(rng, ['slim', 'average', 'average', 'solid']) : senior ? pick(rng, ['slim', 'average', 'solid', 'round']) : pick(rng, BUILDS);
  const heightM = child
    ? 0.55 + age * 0.075 + between(rng, -0.04, 0.05)
    : teen ? 1.42 + (age - 13) * 0.075 + between(rng, -0.04, 0.05)
      : senior ? between(rng, 1.55, 1.85) : between(rng, 1.55, 1.98);
  const shirtHue = pick(rng, SHIRT_HUES);
  const trouserHue = pick(rng, TROUSER_HUES);
  // Hair is weighted by age and presentation rather than picked evenly: bald and
  // undercut silhouettes are uncommon, and most women keep long/bob/up styles.
  const femaleStyles = ['long', 'long', 'bob', 'bob', 'ponytail', 'ponytail', 'bun', 'braids', 'wavy', 'curly', 'short', 'short-side'];
  const maleStyles = ['short', 'short', 'short', 'short-side', 'short-side', 'buzz', 'curly', 'wavy', 'undercut', 'long', 'bald'];
  const childStyles = ['short', 'short', 'bob', 'bob', 'ponytail', 'curly', 'braids', 'short-side'];
  const seniorFemale = ['bob', 'bob', 'bun', 'short', 'wavy'];
  const seniorMale = ['short', 'short', 'short-side', 'buzz', 'bald'];
  const hairStyleBase = pick(rng, child ? childStyles : senior ? (gender === 'female' ? seniorFemale : seniorMale) : gender === 'female' ? femaleStyles : maleStyles);
  const hairStyle = hairStyleBase;
  const beardRoll = rng();
  const facialHair = child || gender === 'female' ? 'none' : beardRoll < 0.34 ? 'none' : beardRoll < 0.52 ? 'stubble' : beardRoll < 0.72 ? 'moustache' : beardRoll < 0.9 ? 'goatee' : 'full';
  const glassesRoll = rng();
  const glasses = child ? glassesRoll < 0.18 : glassesRoll < 0.33;
  const styleRoll = rng();
  const identity = {
    id: key,
    name: String(person.name || person.first || key),
    firstName: String(person.first || person.name || key).split(' ')[0],
    age, gender, child, teen, senior,
    occupation: occupationLabel(person),
    job: String(person.job || ''),
    workplaceKind: String(person.workplaceKind || person.kind || ''),
    workplaceName: String(person.workplaceName || ''),
    role: String(person.role || (child ? 'child' : 'adult')),
    skin: {
      base: skin.base,
      shade: skin.shade,
      under: skin.under,
      blush: blend(skin.base, 0xd4776f, 0.22),
      lip: blend(skin.base, 0x9a4f4a, 0.58),
      lid: blend(skin.shade, 0x6d4636, 0.25),
    },
    hair: {
      base: hair.base,
      highlight: hair.hi,
      style: hairStyle,
      length: ['long', 'bob', 'braids', 'ponytail'].includes(hairStyle) ? 'long' : ['short', 'short-side', 'curly', 'wavy', 'undercut'].includes(hairStyle) ? 'short' : 'cropped',
      volume: between(rng, 0.88, 1.12),
      part: rng() < 0.5 ? -1 : 1,
      texture: pick(rng, ['straight', 'straight', 'wavy', 'wavy', 'curly']),
    },
    eyes: {
      colour: pick(rng, EYES),
      spacing: between(rng, 0.94, 1.06),
      size: between(rng, 0.9, 1.1),
      tilt: between(rng, -0.12, 0.12),
      lid: between(rng, 0.85, 1.15),
    },
    face: {
      shape: faceShape,
      width: between(rng, 0.93, 1.08) * (child ? 1.08 : 1),
      height: between(rng, 0.95, 1.06),
      jaw: between(rng, 0.9, 1.12),
      chin: between(rng, 0.88, 1.12),
      cheek: between(rng, 0.9, 1.12),
      noseWidth: between(rng, 0.88, 1.14),
      noseLength: between(rng, 0.9, 1.1),
      lip: between(rng, 0.88, 1.15),
      brow: between(rng, 0.88, 1.14),
      wrinkles: senior ? between(rng, 0.35, 1) : 0,
      freckles: chance(rng, 0.18),
      mole: chance(rng, 0.14) ? { x: between(rng, -0.1, 0.1), y: between(rng, -0.06, 0.05) } : null,
    },
    body: {
      height: heightM,
      build,
      shoulder: between(rng, 0.92, 1.08) * (gender === 'male' ? 1.04 : 0.98),
      torso: between(rng, 0.92, 1.08),
      belly: build === 'round' ? 0.12 : build === 'solid' ? 0.055 : between(rng, -0.01, 0.035),
      hip: between(rng, 0.9, 1.1),
      leg: between(rng, 0.94, 1.06),
      arm: between(rng, 0.94, 1.06),
      neck: between(rng, 0.9, 1.1),
      posture: senior ? between(rng, 0.5, 0.9) : between(rng, 0, 0.28),
      hand: between(rng, 0.9, 1.1),
    },
    clothing: {
      shirt: shirtHue,
      trousers: trouserHue,
      accent: blend(shirtHue, 0xffffff, 0.3),
      warm: pick(rng, [0x7a3a2f, 0x4a5a6a, 0x6a5a3a, 0x3f4a3a, 0x6a4a5a]),
      cool: pick(rng, [0x3a5a7a, 0x4a7a6a, 0x8a8a7a, 0x6a7a8a, 0x5a6a4a]),
      palette: [shirtHue, trouserHue, blend(shirtHue, 0xffffff, 0.3)],
      fit: pick(rng, ['regular', 'regular', 'regular', 'slim', 'relaxed']),
      style: styleRoll < 0.45 ? 'casual' : styleRoll < 0.72 ? 'smart-casual' : styleRoll < 0.9 ? 'practical' : 'formal',
      pattern: pick(rng, ['plain', 'plain', 'plain', 'stripe', 'check', 'print']),
    },
    accessories: {
      glasses,
      sunglasses: glasses && chance(rng, 0.25),
      hat: !child && !glasses && chance(rng, 0.18),
      cap: !child && !glasses && chance(rng, 0.12),
      beanie: !child && !glasses && chance(rng, 0.1),
      scarf: chance(rng, 0.2),
      earrings: gender === 'female' && age >= 12 && chance(rng, 0.45),
      watch: age >= 14 && chance(rng, 0.4),
      bag: age >= 14 && chance(rng, 0.35),
      lanyard: chance(rng, 0.12),
      badge: chance(rng, 0.5),
      hearingAid: senior && chance(rng, 0.16),
      facialHair,
      umbrella: false,
    },
    gait: {
      style: pick(rng, GAITS),
      stride: between(rng, 0.9, 1.12),
      bounce: between(rng, 0.55, 1.35),
      sway: between(rng, 0, 1),
      armSwing: between(rng, 0.7, 1.2),
      headTilt: between(rng, -0.08, 0.08),
      speed: between(rng, 0.9, 1.12),
    },
    voice: {
      pitch: between(rng, child ? 1.18 : gender === 'female' ? 1.04 : 0.9, child ? 1.4 : gender === 'female' ? 1.2 : 1.02),
      pace: between(rng, 0.9, 1.12),
      timbre: pick(rng, ['warm', 'clear', 'soft', 'bright', 'dry']),
    },
    handedness: rng() < 0.11 ? 'left' : 'right',
    seed: hashString(key),
    outfit: null,
  };
  identity.outfit = outfitFor(identity, options);
  return identity;
}

// Colour helper shared by identity and figure code. Operates on 24-bit RGB ints so the
// identity module stays pure and Node-testable without three.js.
export function blend(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

// Surface colours and garment layers for one activity. Returning a stable `key` lets the
// figure rebuild only when the outfit genuinely changes.
export function outfitFor(identity, context = {}) {
  const ctx = { ...outfitContext({ age: identity.age, job: identity.job, workplaceKind: identity.workplaceKind, name: identity.name }, context), ...context };
  const mode = ctx.mode || 'home';
  const jobKind = String(ctx.jobKind || ctx.job || '').toLowerCase();
  const age = identity.age;
  const hot = ctx.weather === 'sunny' && ctx.minute >= 10 * 60 && ctx.minute < 17 * 60;
  const cool = ctx.weather === 'rainy' || ctx.weather === 'windy' || ctx.minute < 7 * 60 || ctx.minute >= 19 * 60;
  const base = identity.clothing;
  const o = {
    key: '',
    top: { colour: base.shirt, style: 'tshirt', sleeves: 'short', collar: false, pattern: base.pattern, buttons: false, tie: false, hiVis: false },
    bottom: { colour: base.trousers, kind: 'trousers', length: 'full' },
    shoes: { colour: 0x2a2622, kind: 'shoes' },
    outer: null, apron: null, headwear: null, badge: false, lanyard: false,
    carry: null, umbrella: false, gloves: false, scarf: null, bag: identity.accessories.bag,
    work: false, uniform: null, sleep: false, barefoot: false,
  };
  if (mode === 'sleep') {
    o.top = { colour: blend(base.shirt, 0xc9d8e8, 0.45), style: 'pyjama', sleeves: 'long', collar: false, pattern: 'stripe', buttons: true, tie: false, hiVis: false };
    o.bottom = { colour: blend(base.trousers, 0x5c6b88, 0.45), kind: 'pyjama', length: 'full' };
    o.shoes = { colour: base.shirt, kind: 'socks' };
    o.sleep = true; o.bag = false;
  } else if (mode === 'wash') {
    o.top = { colour: 0xe8e3d8, style: 'towel', sleeves: 'none', collar: false, pattern: 'plain', buttons: false, tie: false, hiVis: false };
    o.bottom = { colour: 0xe8e3d8, kind: 'towel', length: 'short' };
    o.shoes = { colour: 0x9a8f80, kind: 'barefoot' }; o.barefoot = true; o.bag = false;
  } else if (mode === 'work') {
    o.work = true;
    const uniform = uniformFor(identity, jobKind, ctx);
    if (uniform) Object.assign(o, uniform);
    else {
      o.top = { colour: base.shirt, style: base.style === 'formal' ? 'shirt' : 'polo', sleeves: hot ? 'short' : 'long', collar: true, pattern: base.pattern, buttons: true, tie: base.style === 'formal', hiVis: false };
      o.bottom = { colour: base.trousers, kind: 'trousers', length: 'full' };
      o.shoes = { colour: 0x2a2622, kind: 'shoes' };
    }
    o.badge = !!identity.accessories.badge;
    o.lanyard = !!identity.accessories.lanyard;
    if (identity.accessories.glasses) o.glasses = true;
  } else if (mode === 'shop' || mode === 'night') {
    o.top = { colour: base.shirt, style: 'jumper', sleeves: 'long', collar: true, pattern: base.pattern, buttons: false, tie: false, hiVis: false };
    o.bottom = { colour: base.trousers, kind: 'trousers', length: 'full' };
    o.outer = { colour: cool ? base.warm : base.cool, kind: cool ? 'coat' : 'jacket', open: true };
  } else if (mode === 'exercise') {
    o.top = { colour: base.shirt, style: 'tee', sleeves: 'short', collar: false, pattern: 'plain', buttons: false, tie: false, hiVis: false };
    o.bottom = { colour: base.trousers, kind: 'shorts', length: 'short' };
    o.shoes = { colour: 0x3a3a42, kind: 'runners' };
  } else {
    o.top = { colour: base.shirt, style: hot ? 'tshirt' : 'jumper', sleeves: hot ? 'short' : 'long', collar: false, pattern: base.pattern, buttons: false, tie: false, hiVis: false };
    o.bottom = { colour: base.trousers, kind: hot ? 'shorts' : 'trousers', length: hot ? 'short' : 'full' };
    if (cool) o.outer = { colour: base.warm, kind: 'jumper', open: false };
  }
  if (age >= 5 && age < 18 && ctx.school) o.uniform = 'school';
  if (ctx.weather === 'rainy' && mode !== 'sleep') { o.outer = { colour: 0x2f4a5a, kind: 'raincoat', open: false }; o.umbrella = true; }
  if (cool && !o.outer && mode !== 'sleep' && mode !== 'wash') o.outer = { colour: base.cool, kind: 'jacket', open: true };
  if (identity.accessories.scarf && cool && mode !== 'sleep') o.scarf = { colour: base.accent, kind: 'scarf' };
  if (identity.accessories.glasses && mode !== 'sleep') o.glasses = true;
  if (identity.accessories.hat && mode !== 'sleep' && mode !== 'wash') o.headwear = { kind: 'hat', colour: base.warm };
  else if (identity.accessories.cap && mode !== 'sleep' && mode !== 'wash') o.headwear = { kind: 'cap', colour: base.shirt };
  else if (identity.accessories.beanie && cool) o.headwear = { kind: 'beanie', colour: base.cool };
  if (mode === 'work' && (jobKind === 'supermarket' || jobKind === 'cafe' || jobKind === 'bakery' || jobKind === 'bar' || jobKind === 'pub')) o.badge = true;
  o.key = [mode, o.top.style, o.top.colour, o.bottom.kind, o.bottom.colour, o.outer?.kind || '', o.outer?.colour || '', o.apron?.colour || '', o.uniform || '', o.headwear?.kind || '', o.gloves ? 'g' : '', o.carry || '', o.umbrella ? 'u' : '', o.bag ? 'b' : ''].join('|');
  return o;
}

function uniformFor(identity, kind, ctx) {
  const base = identity.clothing;
  const common = { bottom: { colour: 0x2f3440, kind: 'trousers', length: 'full' }, shoes: { colour: 0x24262a, kind: 'shoes' } };
  switch (kind) {
  case 'supermarket': return { top: { colour: 0xc8202a, style: 'polo', sleeves: 'short', collar: true, pattern: 'plain', buttons: true, tie: false, hiVis: false }, ...common, badge: true, uniform: 'coles' };
  case 'hospital': case 'doctors': return { top: { colour: 0x3f7f8a, style: 'scrubs', sleeves: 'short', collar: true, pattern: 'plain', buttons: false, tie: false, hiVis: false }, ...common, badge: true, uniform: 'scrubs' };
  case 'school': return { top: { colour: ctx.age < 18 ? 0x2f5f8a : 0x3a4a5a, style: 'shirt', sleeves: 'short', collar: true, pattern: 'plain', buttons: true, tie: ctx.age < 18, hiVis: false }, ...common, badge: true, uniform: 'school' };
  case 'police': return { top: { colour: 0x1c2f4a, style: 'uniform', sleeves: 'long', collar: true, pattern: 'plain', buttons: true, tie: false, hiVis: false }, bottom: { colour: 0x1c2f4a, kind: 'trousers', length: 'full' }, shoes: { colour: 0x14181e, kind: 'boots' }, badge: true, uniform: 'police' };
  case 'fire_station': return { top: { colour: 0x9b2226, style: 'uniform', sleeves: 'long', collar: true, pattern: 'plain', buttons: true, tie: false, hiVis: false }, ...common, uniform: 'fire' };
  case 'bakery': case 'butcher': case 'cafe': case 'restaurant': case 'pub': case 'bar': return { top: { colour: 0x2b2b2b, style: 'tee', sleeves: 'short', collar: false, pattern: 'plain', buttons: false, tie: false, hiVis: false }, apron: { colour: kind === 'butcher' ? 0xf2f2ee : 0x3f3f3f, kind: 'apron' }, ...common, badge: true, uniform: 'hospitality' };
  case 'car_repair': case 'tyres': case 'trade': case 'hvac': case 'agrarian': case 'car': return { top: { colour: 0x2f4a5a, style: 'work', sleeves: 'long', collar: true, pattern: 'plain', buttons: true, tie: false, hiVis: true }, ...common, shoes: { colour: 0x2a2420, kind: 'boots' }, gloves: true, uniform: 'tradie' };
  case 'post_office': return { top: { colour: 0xc8202a, style: 'polo', sleeves: 'short', collar: true, pattern: 'plain', buttons: true, tie: false, hiVis: false }, ...common, badge: true, uniform: 'post' };
  case 'bank': case 'estate_agent': case 'government': case 'townhall': case 'courthouse': return { top: { colour: 0xe8e3d8, style: 'shirt', sleeves: 'long', collar: true, pattern: 'plain', buttons: true, tie: true, hiVis: false }, bottom: { colour: 0x2b3648, kind: 'trousers', length: 'full' }, shoes: { colour: 0x24262a, kind: 'shoes' }, outer: { colour: 0x3a4a5a, kind: 'blazer', open: true }, badge: true, uniform: 'office' };
  case 'library': return { top: { colour: 0x4a5a6a, style: 'cardigan', sleeves: 'long', collar: true, pattern: 'plain', buttons: true, tie: false, hiVis: false }, ...common, badge: true, uniform: 'library' };
  case 'physiotherapist': return { top: { colour: 0x3f7f8a, style: 'polo', sleeves: 'short', collar: true, pattern: 'plain', buttons: true, tie: false, hiVis: false }, ...common, badge: true, uniform: 'clinic' };
  default: return null;
  }
}

// A concise description for the resident panel and tests. Never invents a real-world fact.
export function describeIdentity(identity) {
  const age = identity.age;
  const skin = ['deep', 'deep brown', 'brown', 'tan', 'light tan', 'fair'][Math.min(5, Math.floor((identity.skin.base & 0xff) / 45))];
  return `${identity.name}, ${age} · ${identity.occupation} · ${identity.body.height.toFixed(2)} m · ${skin} skin · ${identity.hair.style} ${identity.hair.base === 0xece6dc ? 'white' : 'hair'}`;
}

// A stable visual signature used by tests and by the roster UI to prove two people differ.
export function appearanceSignature(identity) {
  return [
    identity.skin.base, identity.hair.base, identity.hair.style, identity.eyes.colour,
    identity.face.shape, identity.face.jaw, identity.face.noseWidth, identity.body.build,
    identity.body.height.toFixed(2), identity.clothing.shirt, identity.clothing.trousers,
    identity.accessories.facialHair, identity.accessories.glasses ? 'glasses' : 'no-glasses',
  ].join('/');
}
