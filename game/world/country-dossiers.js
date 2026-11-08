// Researched country houses and households, one country at a time (see docs/COUNTRY_DOSSIERS.md).
// A dossier replaces the generic three-room plan in country-interiors.js with a floor plan,
// fit-out, exterior details and residents for one country. Residents are long-dead historical
// figures and their families, drawn only from published biographies; the sources are listed in
// each dossier and shown in game. Where sources disagree, the dossier says so.
// Coordinates are house-local metres: x across the front, z front (+d/2) to back (-d/2).

const Q = Math.PI / 2;

// ── Australia: Federation-era weatherboard cottage, Sydney, early 1900 ─────────────────────────
// Plan: a central hall from the front door, front parlour and front bedroom either side, a rear
// kitchen across the back, and a lean-to wash-house in the rear corner. Weatherboard walls,
// corrugated iron roof, bullnose verandah with turned posts and fretwork, brick chimney, and a
// corrugated rainwater tank at the side. Lawson family as they were before sailing for London.
function australiaPlan(w, d) {
  const kz = -d / 2 + 3.2, hall = 0.95, wash = -w / 2 + 2.2, T = 0.14;
  const rooms = [
    { name: 'Front parlour', x0: -w / 2 + T, x1: -hall - T / 2, z0: kz + T / 2, z1: d / 2 - T },
    { name: 'Hall', x0: -hall + T / 2, x1: hall - T / 2, z0: kz + T / 2, z1: d / 2 - T },
    { name: 'Front bedroom', x0: hall + T / 2, x1: w / 2 - T, z0: kz + T / 2, z1: d / 2 - T },
    { name: 'Kitchen', x0: wash + T / 2, x1: w / 2 - T, z0: -d / 2 + T, z1: kz - T / 2 },
    { name: 'Lean-to wash-house', x0: -w / 2 + T, x1: wash - T / 2, z0: -d / 2 + T, z1: kz - T / 2 },
  ];
  // Internal walls as rectangles; gaps are the doorways.
  const walls = [
    [-w / 2, -0.55, kz - T / 2, kz + T / 2], [0.55, w / 2, kz - T / 2, kz + T / 2],          // hall opens into the kitchen
    [-hall - T / 2, -hall + T / 2, kz, kz + 1.0], [-hall - T / 2, -hall + T / 2, kz + 2.05, d / 2 - 0.9],   // parlour door
    [hall - T / 2, hall + T / 2, kz, kz + 1.0], [hall - T / 2, hall + T / 2, kz + 2.05, d / 2 - 0.9],       // bedroom door
    [wash - T / 2, wash + T / 2, -d / 2, -d / 2 + 1.55], [wash - T / 2, wash + T / 2, -d / 2 + 2.6, kz],      // wash-house door
  ].map(([x0, x1, z0, z1]) => ({ x0, x1, z0, z1 }));
  const fixtures = [
    // Parlour, used as Henry's writing room: fireplace on the side wall (chimney outside), desk under the front window.
    { type: 'fireplace', label: 'Parlour fireplace (cast-iron grate, timber mantel)', x: -w / 2 + 0.5, z: kz + 3.1, rot: Q, room: 0 },
    { type: 'desk', label: "Henry's writing desk", x: -w / 2 + 1.15, z: d / 2 - 0.68, room: 0 },
    { type: 'chair', label: 'Bentwood chair', x: -w / 2 + 1.15, z: d / 2 - 1.45, room: 0 },
    { type: 'bookshelf', label: 'Books and bound copies of The Bulletin', x: -w / 2 + 1.25, z: kz + 0.36, room: 0 },
    { type: 'rug', label: 'Parlour rug on polished floorboards', x: -w / 2 + 1.9, z: kz + 2.6, room: 0 },
    // Hall: the clock and runner of a Federation hall.
    { type: 'clock', label: 'Hall clock', x: -0.62, z: kz + 3.9, rot: Q, room: 1 },
    // Front bedroom: double bed, the baby's cot under the window, wardrobe.
    { type: 'bed', label: 'Iron-framed double bed', x: w / 2 - 1.05, z: kz + 1.3, room: 2 },
    { type: 'crib', label: "Baby Bertha's cot", x: w / 2 - 1.0, z: d / 2 - 0.6, room: 2 },
    { type: 'wardrobe', label: 'Cedar wardrobe', x: hall + 0.48, z: d / 2 - 1.55, rot: Q, room: 2 },
    // Kitchen: the room the family lived in; wood-fired fuel stove on the back wall.
    { type: 'stove', label: 'Cast-iron wood fuel stove', x: 0.2, z: -d / 2 + 0.55, room: 3 },
    { type: 'pantry', label: 'Kitchen dresser: crockery, flour and tea', x: w / 2 - 1.05, z: -d / 2 + 0.43, room: 3 },
    { type: 'kitchenSink', label: 'Sink and cold tap from the tank', x: w / 2 - 0.55, z: kz - 1.35, rot: Q, room: 3 },
    { type: 'table', label: 'Scrubbed pine kitchen table', x: 0.95, z: kz - 1.45, room: 3 },
    { type: 'cabinet', label: 'Coolgardie safe (evaporative food cooler)', x: wash + 0.65, z: -d / 2 + 0.45, room: 3 },
    // Wash-house: tin bath and the wash copper; the toilet is a backyard closet, as was usual.
    { type: 'bathtub', label: 'Tin bath', x: -w / 2 + 0.66, z: -d / 2 + 1.45, rot: Q, room: 4 },
    { type: 'barrel', label: 'Wash copper and tubs', x: wash - 0.55, z: -d / 2 + 0.82, rot: Q, room: 4 },
  ];
  return { rooms, walls, fixtures };
}


// ── New Zealand: the Sheppards' kauri bay villa, Christchurch, 1893 ─────────────────────────────
// Plan after Kate Sheppard's villa at [address redacted] (built 1888): a hall bisecting the plan, front
// parlour with the bay window and front bedroom, the dining room where the 1893 suffrage petition
// was pasted into its 274 m roll, and the kitchen with its coal range at the back. Kauri floors,
// double-hung sash windows, corrugated iron roof, two chimneys, macrocarpa hedge and front gates.
function newZealandPlan(w, d) {
  const hall = 0.95, T = 0.14;
  const rooms = [
    { name: 'Parlour', x0: -w / 2 + T, x1: -hall - T / 2, z0: T / 2, z1: d / 2 - T },
    { name: 'Hall', x0: -hall + T / 2, x1: hall - T / 2, z0: -d / 2 + T, z1: d / 2 - T },
    { name: 'Front bedroom', x0: hall + T / 2, x1: w / 2 - T, z0: T / 2, z1: d / 2 - T },
    { name: 'Dining room', x0: -w / 2 + T, x1: -hall - T / 2, z0: -d / 2 + T, z1: -T / 2 },
    { name: 'Kitchen', x0: hall + T / 2, x1: w / 2 - T, z0: -d / 2 + T, z1: -T / 2 },
  ];
  const walls = [[-w / 2, -hall, -T / 2, T / 2], [hall, w / 2, -T / 2, T / 2]];
  for (const x of [-hall, hall]) for (const [z0, z1] of [[-d / 2, -2.3], [-1.25, 1.25], [2.3, d / 2]]) walls.push([x - T / 2, x + T / 2, z0, z1]);
  const fixtures = [
    { type: 'fireplace', label: 'Parlour fireplace, timber mantel', x: -w / 2 + 0.5, z: 2.4, rot: Q, room: 0 },
    { type: 'piano', label: 'Upright piano (typical of the era)', x: -w / 2 + 1.35, z: 0.5, room: 0 },
    { type: 'sofa', label: 'Horsehair sofa in the bay window', x: -w / 2 + 1.6, z: d / 2 - 0.75, room: 0 },
    { type: 'lamp', label: 'Kerosene lamp', x: -1.5, z: 3.6, room: 0 },
    { type: 'rug', label: 'Parlour rug on kauri floorboards', x: -2.9, z: 2.2, room: 0 },
    { type: 'clock', label: 'Hall clock', x: -0.62, z: 3.4, rot: Q, room: 1 },
    { type: 'bed', label: 'Brass bed', x: w / 2 - 1.05, z: 1.3, room: 2 },
    { type: 'wardrobe', label: 'Kauri wardrobe', x: hall + 0.48, z: d / 2 - 1.0, rot: Q, room: 2 },
    { type: 'cabinet', label: 'Washstand with jug and basin', x: w / 2 - 0.75, z: d / 2 - 0.45, room: 2 },
    { type: 'table', label: 'Dining table: the 1893 suffrage petition was pasted into one roll here', x: -2.9, z: -2.2, room: 3 },
    { type: 'chair', label: 'Dining chair', x: -4.0, z: -2.2, room: 3 },
    { type: 'fireplace', label: 'Dining-room fireplace', x: -w / 2 + 0.5, z: -2.4, rot: Q, room: 3 },
    { type: 'cabinet', label: 'Sideboard', x: -2.0, z: -d / 2 + 0.45, room: 3 },
    { type: 'bookStack', label: 'Petition sheets and paste pot', x: -3.5, z: -d / 2 + 0.6, room: 3 },
    { type: 'stove', label: 'Cast-iron coal range', x: 3.0, z: -d / 2 + 0.55, room: 4 },
    { type: 'kitchenSink', label: 'Scullery sink', x: w / 2 - 0.55, z: -2.0, rot: Q, room: 4 },
    { type: 'pantry', label: 'Kitchen dresser', x: 2.6, z: -0.4, room: 4 },
    { type: 'table', label: 'Kitchen table', x: 3.0, z: -2.0, room: 4 },
  ];
  return { rooms, walls: walls.map(([x0, x1, z0, z1]) => ({ x0, x1, z0, z1 })), fixtures };
}

export const COUNTRY_DOSSIERS = Object.freeze({
  Australia: Object.freeze({
    country: 'Australia',
    era: 'early 1900, Sydney',
    house: 'Federation-era weatherboard cottage',
    summary: 'A four-room weatherboard cottage with a rear lean-to: central hall, front parlour and bedroom, a kitchen across the back where the family lived, and a wash-house with the tin bath and copper. Corrugated iron roof, bullnose verandah with turned posts and fretwork, brick chimney and a corrugated rainwater tank.',
    exterior: { wall: 0xe6dcc3, roof: 0x8d9397, trim: 0x7a2e26, chimney: 0x8b4a3a, tank: 0xa7adb1, chimneys: [{ side: -1, z: (d) => -d / 2 + 6.3 }] },
    plan: australiaPlan,
    residents: [
      { id: 'henry-lawson', name: 'Henry Lawson', emoji: '✒️', life: '1867–1922', age: 32, room: 0, x: -2.9, z: 3.0, face: 0, shirt: 0x2e2c31, trousers: 0x2a2a2e,
        role: 'Writer and poet. In Repo Town he writes at home and takes his copy to the newsagent.',
        bio: [
          'Born 17 June 1867 on the Grenfell goldfields, New South Wales. Partly deaf from childhood.',
          "Writer of bush stories and verse, including 'The Drover's Wife' and the collection While the Billy Boils (1896); many pieces first appeared in The Bulletin.",
          'Married Bertha Bredt in Sydney on 15 April 1896. The couple taught at the Māori school at Mangamaunu, near Kaikōura, New Zealand, in 1897, and took the children to London in 1900.',
          'He struggled with alcohol for much of his life; the marriage was dissolved in 1903. He died in Sydney in 1922.',
        ],
        day: ['Early: tea and bread by the kitchen stove', 'Morning: writing at the parlour desk', 'Afternoon: walks into town with copy for the newsagent', 'Evening: reading and letters by lamplight'],
        wears: 'Dark three-piece suit, high collar and a full moustache, as in his portraits of the period.' },
      { id: 'bertha-lawson', name: 'Bertha Lawson', emoji: '🧺', life: '1876–1957', age: 24, room: 3, x: 1.9, z: -3.35, face: Math.PI, shirt: 0x4a3b55, trousers: 0x3b3046,
        role: 'Runs the household with two small children.',
        bio: [
          'Born Bertha Bredt; married Henry Lawson on 15 April 1896 in Sydney, aware of his drinking.',
          'Mother of Jim (Joseph) and Bertha; taught with Henry at Mangamaunu in 1897 and went with him to London in 1900.',
          'The marriage was dissolved in 1903; she brought up the children in Sydney.',
        ],
        day: ['Dawn: lights the fuel stove, feeds the baby', 'Morning: washing day in the wash-house copper (Mondays), baking, shopping at the greengrocer', 'Afternoon: mending, the children', 'Evening: tea at the kitchen table'],
        wears: 'Long skirt, high-necked blouse with puffed sleeves, hair worn up.' },
      { id: 'jim-lawson', name: 'Jim Lawson', emoji: '🧒', life: 'born 1897 or 1898', age: 2, child: true, room: 3, x: -0.4, z: -3.2, face: 0, shirt: 0x2f4f7f, trousers: 0x2f4f7f,
        role: "Henry and Bertha's son, Joseph, called Jim.",
        bio: ['Joseph Henry Lawson, known as Jim. Sources give his birth as 1897 or 10 February 1898.'],
        day: ['Plays in the kitchen and the back yard while his mother works'], wears: 'Smock or sailor suit, usual for a small boy of the time.' },
    ],
    babies: [{ name: 'Baby Bertha Lawson', fixtureLabel: "Baby Bertha's cot", bio: 'Bertha Marie Louise Lawson. Sources give her birth as 1899 or 11 February 1900.' }],
    caveats: 'The Lawsons\' exact Sydney address in early 1900 is not established here; the cottage is a typical Federation weatherboard of the period, not their house. Typical-of-the-era details (food, clothes, fittings) are marked as such.',
    sources: [
      ['Wikipedia: Henry Lawson (summarising the Australian Dictionary of Biography)', 'https://en.wikipedia.org/wiki/Henry_Lawson'],
      ['Susannah Fullerton: 17 June 1867, Henry Lawson is born', 'https://susannahfullerton.com.au/17-june-1867-henry-lawson-is-born'],
      ['WikiTree: Henry Lawson family record', 'https://wikitree.com/wiki/Lawson-2051'],
      ['State Library Victoria, La Trobe Journal 28', 'https://latrobejournal.slv.vic.gov.au/latrobejournal/issue/latrobe-28/t1-g-t1.html'],
      ['WA heritage inventory: Federation bungalow, weatherboard, corrugated iron, bullnose verandah, turned posts', 'https://inherit.dplh.wa.gov.au/Public/Inventory/PrintSingleRecord/6da728e9-e825-4aa7-8282-2440d20e710d'],
      ['Hornsby Shire heritage information sheets', 'https://www.hornsby.nsw.gov.au/__data/assets/pdf_file/0016/130327/Heritage-Information-Sheets.pdf'],
      ['Metters Limited (Australian wood fuel stoves from 1891)', 'https://en.wikipedia.org/wiki/Metters_Limited'],
      ['Museums Victoria collections: ice chest and Coolgardie safe', 'https://collections.museumsvictoria.com.au/items/400958'],
    ],
  }),
  'New Zealand': Object.freeze({
    country: 'New Zealand',
    era: '1893, Christchurch',
    house: 'Kauri bay villa',
    summary: "After Kate Sheppard's own villa at [address redacted], Christchurch (built 1888, now Te Whare Waiutuutu Kate Sheppard House): a hall bisecting the plan, parlour with a bay window, front bedroom, the dining room where the 1893 women's suffrage petition was pasted into a 274 m roll, and a kitchen with a coal range. Kauri floors, double-hung sash windows, corrugated iron roof, two chimneys, a macrocarpa hedge and front gates.",
    exterior: { wall: 0xeee6d2, roof: 0x9a3b30, trim: 0x3f5a46, chimney: 0x8b4a3a, chimneys: [{ side: -1, z: () => 2.4 }, { side: -1, z: () => -2.4 }], bay: -1, hedge: 0x3f6b3a },
    plan: newZealandPlan,
    residents: [
      { id: 'kate-sheppard', name: 'Kate Sheppard', emoji: '🗳️', life: '1847 or 1848–1934', room: 3, x: -2.9, z: -1.35, face: Math.PI, shirt: 0x2f3442, trousers: 0x2a2d38,
        role: "Suffragist. In Repo Town she campaigns from the Town Hall and gathers signatures in the street.",
        bio: [
          'Born Katherine Wilson Malcolm in Liverpool on 10 March; sources give the year as 1847 or 1848. Moved to Christchurch with her family in 1868.',
          'Married Walter Allen Sheppard, a Christchurch grocer and general merchant, on 21 July 1871.',
          "Led the Women's Christian Temperance Union campaign for the vote. The 1893 petition, with nearly 32,000 women's signatures, was pasted together at this dining table into a roll 274 m long.",
          'The Electoral Act became law on 19 September 1893: New Zealand women voted in that year\'s general election, the first in a self-governing country to do so.',
          'She lived at the Clyde Road villa from 1888 to 1902 and died in Christchurch on 13 July 1934.',
        ],
        day: ['Morning: letters and petition sheets at the dining table', 'Late morning: a meeting at the Town Hall', 'Afternoon: collecting signatures on the High Street', 'Evening: writing articles and speeches'],
        wears: 'Dark high-necked dress with a narrow waist, hair parted and drawn back, a white camellia (the suffragists\' emblem) on her lapel.' },
      { id: 'walter-sheppard', name: 'Walter Sheppard', emoji: '🧾', life: 'died 1915', room: 0, x: -2.3, z: 2.9, face: Math.PI, shirt: 0x3b3a36, trousers: 0x2b2a27,
        role: 'Grocer and general merchant. In Repo Town he works at the General Store.',
        bio: ['Walter Allen Sheppard, a grocer and general merchant in Christchurch, married Kate on 21 July 1871.', 'Christchurch City Libraries record him as a city councillor in 1868.', 'He died in Bath, England, on 24 July 1915.'],
        day: ['Early: opens the shop', 'Day: serving and ordering stock at the General Store', 'Evening: the newspaper in the parlour'],
        wears: 'Dark frock coat or sack suit, waistcoat with watch chain, beard (typical of the era).' },
      { id: 'douglas-sheppard', name: 'Douglas Sheppard', emoji: '📚', life: '1880–1910', scale: 0.82, room: 4, x: 4.2, z: -3.6, face: -Math.PI / 2, shirt: 0x34485e, trousers: 0x2b2f38,
        role: 'Schoolboy, aged 12. In Repo Town he goes to the School.',
        bio: ['Their only son, born in Christchurch on 8 October 1880; about seven when the family moved into the villa in 1888.', 'He died in 1910.'],
        day: ['Morning: walks to school', 'Afternoon: home for tea in the kitchen', 'Evening: homework at the kitchen table'],
        wears: 'Norfolk jacket, knickerbockers and long socks (typical of the era).' },
    ],
    babies: [],
    caveats: "The layout follows the Sheppards' villa (hall through the middle, dining room for the petition) but is scaled to this lot; the real villa had about eight rooms and stands on an acre. Era details marked 'typical' are not documented for this family.",
    sources: [
      ['Te Ara: Sheppard, Katherine Wilson (Dictionary of New Zealand Biography)', 'https://teara.govt.nz/en/biographies/2s20/sheppard-katherine-wilson'],
      ['NZHistory: Kate Sheppard', 'https://nzhistory.net.nz/people/kate-sheppard'],
      ['Christchurch City Libraries: Kate Sheppard (1847-1934)', 'https://my.christchurchcitylibraries.com/kate-sheppard/'],
      ['Wikipedia: Kate Sheppard', 'https://en.wikipedia.org/wiki/Kate_Sheppard'],
      ['Heritage New Zealand List 9325: Kate Sheppard House', 'https://www.heritage.org.nz/the-list/details/9325'],
      ['Christchurch District Plan: statement of significance, Kate Sheppard House', 'https://districtplan.ccc.govt.nz/Images/DistrictPlanImages/Statement%20of%20Significance/Christchurch/HID%20127.pdf'],
      ['The Conversation: Kate Sheppard\'s Christchurch home opens as a museum', 'https://theconversation.com/the-epicentre-of-womens-suffrage-kate-sheppards-christchurch-home-finally-opens-as-a-public-museum-151828'],
      ['Christchurch District Plan: 1898 bay villa (hall bisecting the plan, sash windows)', 'https://districtplan.ccc.govt.nz/Images/DistrictPlanImages/Statement%20of%20Significance/Christchurch/HID%20383.pdf'],
    ],
  }),
});

export function dossierFor(country) { return COUNTRY_DOSSIERS[country] || null; }

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function residentPanel(dossier, r) {
  const list = (xs) => '<ul>' + xs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  return {
    title: `${r.name} (${r.life})`,
    body: `<p><b>${esc(r.role)}</b></p>${list(r.bio)}<p><b>A day in Repo Town</b> (typical of the era):</p>${list(r.day)}<p><b>Wears:</b> ${esc(r.wears)}</p>` +
      `<p><small>${esc(dossier.caveats)}</small></p><p><small>Sources: ${dossier.sources.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join('; ')}</small></p>`,
    actions: [],
  };
}
export function housePanel(dossier) {
  return { title: `${dossier.house} · ${dossier.country}, ${dossier.era}`, body: `<p>${esc(dossier.summary)}</p><p><small>${esc(dossier.caveats)}</small></p>`, actions: [] };
}
