// Public-safe authored stories for two tall buildings. V7 intentionally stays generic.
const info = (title, text) => ({ do: 'info', title, text });
const room = (name, props, w = 10, d = 9) => ({ name, w, d, props });
export const UPPER_FLOOR_PLANS = {
  V7: [
    { title: 'Family floor', layout: 'hub', rooms: [
      room('Upstairs landing', [['bench', 'Landing seat'], ['plant', 'Houseplant']]),
      room('Quiet bedrooms', [['bed', 'Cosy bed'], ['wardrobe', 'Clothes cupboard'], ['lamp', 'Bedside light', info('Evening light', 'A warm lamp to wind down.')], ['bookshelf', 'Bedtime stories', info('Storytime', 'Choose a bedtime story.')]]),
      room('Reading study', [['desk', 'Writing desk'], ['laptop', 'Study laptop', info('Study time', 'A quiet place to learn.')], ['bookshelf', 'Reading shelves'], ['chessboard', 'Chess set', info('Chess', 'The board is ready for a friendly game.')]]),
    ]},
    { title: 'Attic and sky lookout', layout: 'hub', rooms: [
      room('Attic landing', [['lantern', 'Attic lantern'], ['crates', 'Old boxes']]),
      room('Creative workshop', [['workbench', 'Craft bench'], ['loom', 'Weaving loom', info('Create something', 'Make something in the hobby room.')], ['easel', 'Painting easel'], ['treasureChest', 'Memory chest', info('Memory chest', 'A collection of old treasures.')]]),
      room('Sky lookout', [['telescope', 'Star telescope', info('Stargazing', 'Look out over the rooftops.')], ['planetModel', 'Solar system model'], ['herbGarden', 'Herb planters'], ['bench', 'Lookout seat']]),
    ]},
  ],
  W7: [
    { title: 'Navigation deck', layout: 'hub', rooms: [
      room('Navigator landing', [['banner', 'Sailing banner'], ['lantern', 'Deck lantern']]),
      room('Chart room', [['mapTable', 'Sword Coast charts', info('Read the charts', 'Trace imagined harbours and ocean routes.')], ['globe', 'World globe', info('Explore the map', 'Plan a voyage across the seas.')], ['pinMap', 'Harbour routes'], ['scrollRack', 'Navigation scrolls']]),
      room('Mariners lounge', [['sofa', 'Captain’s seat'], ['radio', 'Sea radio', info('Sea stories', 'Hear imagined reports from the coast.')], ['bookshelf', 'Voyage journals'], ['chessboard', 'Strategy board']]),
    ]},
    { title: 'Beacon and observatory', layout: 'hub', rooms: [
      room('Keeper landing', [['lantern', 'Beacon lamp'], ['clock', 'Watch clock']]),
      room('Lantern chamber', [['crystal', 'Glowing beacon', info('Light the beacon', 'Guide imagined ships safely home.')], ['consolePanel', 'Beacon controls', info('Beacon controls', 'Inspect the lighthouse mechanism.')], ['battery', 'Backup power'], ['gearWall', 'Lamp machinery']]),
      room('Sea observatory', [['telescope', 'Coastal telescope', info('Scan the horizon', 'Search the imaginary Sword Coast.')], ['mapTable', 'Captain’s map'], ['lectern', 'Keeper’s log', info('Keeper’s log', 'Record weather, vessels and sightings.')], ['flag', 'Signal flag']]),
    ]},
  ],
};

// Transfer is a rescue/data logistics lighthouse, not another copy of SwordCoast.
UPPER_FLOOR_PLANS.X7 = [
  { title:'Transfer operations deck', layout:'hub', rooms:[
    room('Dispatch landing', [['noticeBoard','Shift instructions'],['lantern','Safety light']]),
    room('Transfer control', [['computer','Transfer console',info('Transfer status','Review a simulated transfer manifest and check that every item arrives safely.')],['serverRack','Secure transfer storage'],['router','Network link'],['chartBoard','Transfer queue',info('Transfer queue','Check which items are waiting, moving or complete.')]]),
    room('Rescue logistics', [['mapTable','Rescue routes',info('Route planner','Plot a safe fictional route between harbours.')],['crates','Supplies'],['radio','Dispatch radio'],['filingCabinet','Delivery records']]),
  ]},
  { title:'Beacon and preservation loft', layout:'hub', rooms:[
    room('Keeper landing', [['lantern','Beacon lantern'],['clock','Watch clock']]),
    room('Signal lookout', [['telescope','Coast lookout',info('Watch the horizon','Survey distant vessels and the shoreline.')],['antenna','Signal mast'],['consolePanel','Beacon panel',info('Safety signals','Review the lighthouse signal checklist.')],['flag','Harbour flag']]),
    room('Preservation loft', [['archiveBoxes','Sealed archives'],['terminal','Verification terminal',info('Integrity check','Compare a simulated manifest against its recorded checksums.')],['safe','Secure documents'],['ledgerDesk','Dispatch ledger',info('Departure log','Inspect the transfer and recovery log.')]]),
  ]},
];

// Buildings with architecturally meaningful upper storeys. A tall decorative
// chimney or dome alone does not add imaginary floors to a single-storey house.
export const STOREYS_BY_STYLE = Object.freeze({
  lighthouse:3, tower:3, clocktower:3, castle:3, pagoda:3, windmill:3,
  townhouse:2, modern:2, terrace:2, mansion:2, treehouse:2,
  observatory:2, library:2, shopfront:2, gatehouse:2, factory:2,
});
// Authored per-architecture themes, with a distinct purpose on each level.
// All wording remains public-safe even if a building is a private project.
const themed = (title, rooms) => ({
  title,layout:'hub',rooms:rooms.map(([name,props])=>room(name,props)),
});
const themes = {
  lighthouse:[
    themed('Harbour navigation',[
      ['Navigator landing',['lantern','bench']],
      ['Chart office',['mapTable','globe','pinMap','scrollRack']],
      ['Radio room',['radio','consolePanel','battery','noticeBoard']],
    ]),
    themed('Lantern lookout',[
      ['Keeper landing',['clock','lantern']],
      ['Beacon maintenance',['crystal','gearWall','consolePanel','toolWall']],
      ['Sea observatory',['telescope','mapTable','flag','ledgerDesk']],
    ]),
  ],
  tower:[
    themed('Tower archives',[
      ['Stone landing',['torch','bench']],['Map and records',['mapTable','bookshelf','scrollRack','filingCabinet']],
      ['Guard room',['shield','swordRack','noticeBoard','lantern']],
    ]),
    themed('Sky observatory',[
      ['High landing',['banner','lantern']],['Observatory',['telescope','planetModel','globe','clock']],
      ['Lookout watch',['pinMap','radio','flag','mapTable']],
    ]),
  ],
  clocktower:[
    themed('Clockworks floor',[
      ['Service landing',['bench','lamp']],['Gear workshop',['gearWall','workbench','toolWall','oscilloscope']],
      ['Timekeeper office',['clock','ledgerDesk','chalkboard','filingCabinet']],
    ]),
    themed('Bell and lookout',[
      ['Bell landing',['lantern','banner']],['Bell chamber',['clock','gearWall','consolePanel','toolWall']],
      ['City lookout',['telescope','mapTable','flag','bench']],
    ]),
  ],
  castle:[
    themed('Castle residence',[
      ['Grand landing',['banner','armorStand']],['Royal library',['bookshelf','scrollRack','desk','globe']],
      ['Guest chamber',['bed','wardrobe','fireplace','lamp']],
    ]),
    themed('Battlements',[
      ['Upper landing',['shield','torch']],['Watch room',['telescope','mapTable','swordRack','pinMap']],
      ['Treasure vault',['treasureChest','safe','trophyCase','crystal']],
    ]),
  ],
  pagoda:[
    themed('Quiet learning deck',[
      ['Timber landing',['lantern','plant']],['Study chamber',['bookshelf','lectern','desk','scrollRack']],
      ['Reflection room',['yogaMat','bench','candles','plant']],
    ]),
    themed('Sky lantern level',[
      ['Upper landing',['lantern','flowerBed']],['Tea and craft loft',['cafeTable','fruitBowl','loom','easel']],
      ['Mountain lookout',['telescope','globe','lantern','bench']],
    ]),
  ],
  windmill:[
    themed('Milling machinery',[
      ['Mill landing',['barrel','lantern']],['Gear floor',['gearWall','workbench','toolWall','anvil']],
      ['Grain store',['crates','pantry','scale','noticeBoard']],
    ]),
    themed('Wind observation',[
      ['Upper landing',['lantern','bench']],['Rotor controls',['consolePanel','battery','chartBoard','clock']],
      ['Wind lookout',['telescope','flag','mapTable','clock']],
    ]),
  ],
  townhouse:themed('Family living upstairs',[
    ['Upper landing',['bench','plant']],['Bedroom',['bed','wardrobe','lamp','mirror']],
    ['Study',['desk','bookshelf','laptop','chessboard']],
  ]),
  modern:themed('Contemporary mezzanine',[
    ['Mezzanine landing',['bench','plant']],['Creative studio',['computer','desk','easel','bookshelf']],
    ['Roof lounge',['sofa','lamp','pottedTree','telescope']],
  ]),
  terrace:themed('Terrace upper rooms',[
    ['Upper landing',['plant','mirror']],['Family rooms',['bed','wardrobe','lamp','bookshelf']],
    ['Balcony lounge',['sofa','cafeTable','herbGarden','telescope']],
  ]),
  mansion:themed('Mansion upper suite',[
    ['Gallery landing',['statue','trophyCase']],['Private library',['bookshelf','desk','globe','piano']],
    ['Guest suite',['bed','wardrobe','mirror','fireplace']],
  ]),
  treehouse:themed('Canopy rooms',[
    ['Canopy landing',['plant','lantern']],['Tree-top den',['sofa','bookshelf','boardGame','rug']],
    ['Forest lookout',['telescope','bird','herbGarden','bench']],
  ]),
  observatory:themed('Observatory viewing deck',[
    ['Observation landing',['planetModel','lamp']],['Telescope platform',['telescope','globe','chartBoard','computer']],
    ['Star atlas room',['bookshelf','mapTable','planetModel','chalkboard']],
  ]),
  library:themed('Upper reading gallery',[
    ['Book landing',['bookStack','plant']],['Archive stacks',['bookshelf','cardCatalog','archiveBoxes','scrollRack']],
    ['Research gallery',['desk','computer','globe','filingCabinet']],
  ]),
  shopfront:themed('Shop upstairs',[
    ['Staff landing',['noticeBoard','clock']],['Stock office',['desk','computer','filingCabinet','shelf']],
    ['Rest room',['sofa','coffeeMachine','bookshelf','plant']],
  ]),
  gatehouse:themed('Gatekeeper upper watch',[
    ['Upper landing',['torch','banner']],['Watch post',['telescope','mapTable','flag','radio']],
    ['Records room',['bookshelf','ledgerDesk','filingCabinet','noticeBoard']],
  ]),
  factory:themed('Factory mezzanine',[
    ['Mezzanine landing',['lantern','noticeBoard']],['Controls',['consolePanel','chartBoard','router','battery']],
    ['Quality workshop',['workbench','toolWall','scale','partsBins']],
  ]),
};
// Add accessible interactables to each non-landing room instead of simply
// creating decorative copies of the same old ground-floor furniture.
function prepareTheme(theme, house, floor) {
  const seed = [...house.coordinate].reduce((s,c)=>s*31+c.charCodeAt(0),17);
  const accent = ['trophy','radio','plant','globe','clock','mapTable'][Math.abs(seed+floor)%6];
  return {
    ...theme,
    rooms:theme.rooms.map((r,i)=>({
      ...r,name:r.name,props:[
        ...r.props.map(p=>typeof p==='string'?[p]:[...p]),
        ...(i===0?[]:[[accent,'Featured ' + accent,info('Explore ' + r.name,
          'Discover what happens in this part of the building.')]]),
      ],
    })),
  };
}
export function upperPlansFor(house) {
  if (!house) return [];
  if (UPPER_FLOOR_PLANS[house.coordinate]) return UPPER_FLOOR_PLANS[house.coordinate];
  const total = STOREYS_BY_STYLE[house.ext?.style] || 1;
  const templates = themes[house.ext?.style];
  if (!templates || total <= 1) return [];
  return (Array.isArray(templates)?templates:[templates]).slice(0,total-1)
    .map((p,i)=>prepareTheme(p,house,i+1));
}
export function floorCountFor(house) { return 1 + upperPlansFor(house).length; }
export const hasUpperFloors = house => typeof house === 'string'
  ? Object.prototype.hasOwnProperty.call(UPPER_FLOOR_PLANS, house)
  : floorCountFor(house) > 1;
export function navigationForFloor(index, count = 3) {
  return { up: index < count - 1 ? index + 1 : null, down: index > 0 ? index - 1 : null,
    lift: Array.from({ length: count }, (_, i) => i) };
}
