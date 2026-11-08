// Only previously untyped fallbacks. Dedicated/FIT/evidence dispatch stays first.
const S=(type,label)=>[type,label,{do:'info',title:label,text:'Interpretive workstation; no measured interior survey.',station:true}];
const R=(name,props,w=11,d=9)=>({name,props,w,d});
function plan(title,items,{rear='STAFF & PREPARATION',accent=0x617e7c,rooms=null,placements=null}={}){
  const [a,b,c,d,e,f]=items;
  const clinical=/Physiotherapy|Podiatry|nursing|Wellbeing|Optical|counselling|support|Animal/.test(title);
  const industrial=/Repairs|Wash|Field-service|Parcels|Vehicle|Key-cutting/.test(title);
  const learning=/learning|Tutoring|activity/.test(title);
  const gallery=/Museum|Photography|chapel|Memorial/.test(title);
  const walls=clinical?0xe3ece7:industrial?0xd6dcd8:learning?0xf0e4cd:gallery?0xe8e0d2:0xe7e5db;
  const floor=clinical?0xa6bbb5:industrial?0x8c9693:learning?0xc5ae88:gallery?0xaf987b:0xb1aaa0;
  return {title,rearTitle:rear,accent,walls,floor,zone:clinical?0xcbd8d1:industrial?0xabb2aa:0xcbbca7,
    waiting:clinical||/Professional|Visitor|Court|Security/.test(title),
    plan:placements||[[a,-5.2,2.5,Math.PI/2],[b,-5.2,-3.4,Math.PI/2],
      [c,5.2,-1.2,-Math.PI/2],[d,5.2,-4.7,-Math.PI/2],[e,-4.5,-10.3,0],[f,4.5,-10.3,0]],
    rooms:rooms||[R(title,[S('counter',title+' reception'),a,b,'chair','noticeBoard']),
      R(rear,[S(c,title+' workstation'),d,e,f],12,10)]};
}
export const REMAINING_PROFILES={
  rehabilitation:plan('Physiotherapy and rehabilitation',['treatmentCouch','rehabSteps','treatmentCouch','basin','cabinet','foldingBench'],{rear:'LINEN & CLINICAL SUPPORT'}),
  podiatry:plan('Podiatry and foot care',['treatmentCouch','chair','cabinet','basin','medicineCabinet','foldingBench'],{rear:'INSTRUMENTS & CLINICAL SUPPORT'}),
  nursing:plan('Community nursing clinic',['treatmentCouch','medicineCabinet','basin','cabinet','desk','foldingBench'],{rear:'LINEN & CLINICAL SUPPORT'}),
  wellbeing:plan('Wellbeing consultation',['treatmentCouch','yogaMat','sofa','basin','cabinet','foldingBench'],{rear:'PRIVATE CONSULTATION'}),
  optical:plan('Optical dispensing',['opticalDisplay','opticalDisplay','chair','mirror','desk','cabinet'],{rear:'CONSULTATION & DISPENSING'}),
  counselling:plan('Private counselling',['sofa','chair','bookshelf','plant','desk','filingCabinet'],{rear:'PRIVATE CONSULTATION'}),
  fitness:plan('Exercise studio',['treadmill','dumbbells','yogaMat','bench','cabinet','basin'],{rear:'CHANGE & STORAGE'}),
  activity:plan('Community activity hall',['table','bookStack','noticeBoard','bench','cabinet','kitchenSink'],{rear:'ACTIVITY EQUIPMENT'}),
  support:plan('Accessible support centre',['sofa','table','noticeBoard','waterCooler','desk','cabinet'],{rear:'PRIVATE SUPPORT'}),
  veterinary:plan('Animal care',['animalKennel','treatmentCouch','animalKennel','basin','medicineCabinet','foldingBench'],{rear:'ANIMAL CARE & PREPARATION'}),
  workshop:plan('Repairs and parts',['workbench','tyreRack','toolWall','partsBins','cabinet','crates'],{rear:'TOOLS & PARTS'}),
  print:plan('Print and office supplies',['printStation','shelf','foldingBench','paperShelf','cabinet','crates'].map(x=>x==='paperShelf'?'bookStack':x),{rear:'PRINT FINISHING'}),
  childcare:plan('Early learning',['toyBlocks','rockingHorse','bookStack','table','crib','basin'],{rear:'REST & CARE'}),
  convenience:plan('Convenience store',['shelf','fridge','coffeeMachine','freezer','crates','cabinet'],{rear:'STOCK & STAFF'}),
  wash:plan('Wash-bay equipment',['washEquipment','workbench','washEquipment','basin','cabinet','crates'],{rear:'SERVICE EQUIPMENT'}),
  florist:plan('Florist and garden supplies',['flowerDisplay','pottedTree','flowerDisplay','workbench','basin','crates'],{rear:'BOUQUET PREPARATION'}),
  takeaway:plan('Takeaway kitchen',['stove','freezer','kitchenSink','fridge','workbench','pantry'],{rear:'DRY STORE & PREPARATION'}),
  news:plan('Newsagency',['bookStack','shelf','noticeBoard','shelf','cabinet','crates'],{rear:'DELIVERIES & STOCK'}),
  gifts:plan('Gifts and jewellery',['exhibitCase','shelf','exhibitCase','mirror','safe','workbench'],{rear:'STOCK & WRAPPING'}),
  photography:plan('Photography and framing',['photoBackdrop','camera','exhibitCase','workbench','cabinet','foldingBench'],{rear:'FRAMING & FINISHING'}),
  professional:plan('Professional consultation',['propertyDisplay','filingCabinet','desk','computer','filingCabinet','coffeeMachine'],{rear:'PRIVATE CONSULTATION'}),
  fieldservice:plan('Field-service depot',['workbench','cabinet','partsBins','basin','shelf','crates'],{rear:'EQUIPMENT & DISPATCH'}),
  logistics:plan('Parcels and storage',['parcelRack','parcelRack','trolley','workbench','parcelRack','crates'],{rear:'SORTING & DISPATCH'}),
  furniture:plan('Furniture showroom',['sofa','wardrobe','table','lamp','cabinet','foldingBench'],{rear:'STOCK & DELIVERY'}),
  funeral:plan('Memorial consultation',['sofa','flowerDisplay','pews','candles','desk','filingCabinet'],{rear:'PRIVATE ARRANGEMENTS'}),
  sewing:plan('Alterations studio',['sewingStation','garmentRail','mirror','foldingBench','cabinet','shelf'],{rear:'CUTTING & PRESSING'}),
  museum:plan('Museum gallery',['exhibitCase','timelineWall','exhibitCase','globe','archiveBoxes','workbench'],{rear:'COLLECTIONS & RESEARCH'}),
  chapel:plan('Community chapel',['pews','pews','lectern','piano','cabinet','candles'],{rear:'VESTRY & COMMUNITY'}),
  courts:plan('Sports changing and equipment',['bench','trophyCase','noticeBoard','bench','cabinet','basin'],{rear:'CHANGE & EQUIPMENT'}),
  pool:plan('Learn-to-swim teaching pool',['teachingPool','bench','basin','cabinet','shower','bench'],{rear:'CHANGE & EQUIPMENT',
    placements:[['teachingPool',-4.1,-1.5,0],['bench',5.2,-1.2,-Math.PI/2],['basin',5.2,-4.7,-Math.PI/2],['shower',-4.5,-10.3,0],['cabinet',4.5,-10.3,0]],
    rooms:[R('Pool reception',[S('counter','Pool reception'),'bench','noticeBoard']),R('Small teaching pool',[S('bench','Instructor station'),'teachingPool','bench','basin'],14,12),R('Changing',['shower','cabinet','bench'])]}),
  club:plan('Sporting club lounge',['sofa','trophyCase','cafeTable','coffeeMachine','kitchenSink','cabinet'],{rear:'MEMBERS & PREPARATION'}),
  visitor:plan('Visitor and park reception',['mapTable','noticeBoard','sofa','propertyDisplay','desk','filingCabinet'],{rear:'BOOKINGS & INFORMATION'}),
  showground:plan('Showground administration',['mapTable','trophyCase','noticeBoard','desk','filingCabinet','cabinet'],{rear:'EVENT OPERATIONS'}),
  theatre:plan('Community performance hall',['stage','speaker','pews','piano','garmentRail','cabinet'],{rear:'BACKSTAGE & COSTUMES'}),
  amenities:plan('Public amenities',['toilet','basin','toilet','basin','cabinet','washingMachine'],{rear:'CLEANING & SUPPLIES'}),
  study:plan('Tutoring and shared work',['desk','bookshelf','chalkboard','computer','desk','cabinet'],{rear:'STUDY & RESOURCES'}),
  aviation:plan('Flying club briefing',['mapTable','chartBoard','noticeBoard','radio','desk','cabinet'],{rear:'FLIGHT PLANNING'}),
  vehicle:plan('Vehicle sales and service',['chartBoard','tyreRack','desk','partsBins','workbench','cabinet'],{rear:'SERVICE & PARTS'}),
  beverages:plan('Packaged beverages',['shelf','fridge','shelf','cashRegister','crates','cabinet'],{rear:'DELIVERIES & STOCK'}),
  specialistRetail:plan('Specialist retail',['exhibitCase','shelf','exhibitCase','cabinet','safe','crates'],{rear:'SECURE STOCK'}),
  justice:plan('Court reception and hearing room',['noticeBoard','bench','lectern','pews','desk','filingCabinet'],{rear:'HEARING & RECORDS'}),
  security:plan('Security operations',['consolePanel','noticeBoard','monitorWall','filingCabinet','safe','radio'],{rear:'OPERATIONS & SECURE RECORDS'}),
  locksmith:plan('Key-cutting and lock repairs',['keyCuttingBench','partsBins','toolWall','exhibitCase','safe','workbench'],{rear:'REPAIRS & SECURE STOCK'}),
};
// Verified live legacy entries: shared office with text-only FITTINGS metadata,
// not dedicated builders. Their exterior builders remain completely untouched.
export const LEGACY_GENERIC_CIVIC_SITES=Object.freeze({securityhq:'security',securityoffice:'security',locksmith:'locksmith'});
export const REMAINING_CIVIC_SITES={
  publicamenities:'amenities',physio:'rehabilitation',podiatry:'podiatry',optometry:'optical',
  counselling:'counselling',gym:'fitness',youthcentre:'activity',communitynurse:'nursing',
  disabilitysupport:'support',sports:'courts',vet:'veterinary',ruralrepair:'workshop',officesupplies:'print',
  childcare:'childcare',fuelstop:'convenience',tyres:'workshop',carwash:'wash',florist:'florist',
  takeaway:'takeaway',newsagent:'news',giftshop:'gifts',photography:'photography',accountant:'professional',
  insurance:'professional',cleaning:'fieldservice',pestcontrol:'fieldservice',courier:'logistics',
  storage:'logistics',furniture:'furniture',bikeshop:'workshop',farmcontractor:'fieldservice',
  stockagent:'professional',machinery:'workshop',funeral:'funeral',freight:'logistics',sewing:'sewing',
  mensshed:'workshop',repaircafe:'workshop',communitygarden:'florist',museum:'museum',church:'chapel',
  skatepark:'courts',tennis:'courts',netball:'courts',pool:'pool',sportsclub:'club',caravanpark:'visitor',
  showground:'showground',theatre:'theatre',scouts:'activity',
};
export const REMAINING_KIND_PROFILES={
  hvac:'fieldservice',camp_site:'visitor',museum:'museum',coworking:'study',courthouse:'justice',
  animal_shelter:'veterinary',alternative:'wellbeing',social_facility:'support',tobacco:'specialistRetail',
  community_centre:'workshop',physiotherapist:'rehabilitation',guest_house:'visitor',jewelry:'gifts',
  photographer:'photography',educational_institution:'study',alcohol:'beverages',car_wash:'wash',
  car:'vehicle',golf_course:'club',caravan:'vehicle',aerodrome:'aviation',
};
