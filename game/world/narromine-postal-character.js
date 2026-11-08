// A FICTIONAL Narromine character, NOT a real Australia Post employee or property resident.
// Their home is an existing OSM building footprint, not an invented street number.
// Calendar and dates come from Repository Town's stable civil calendar.
import { townDate } from './town-calendar.js';
import { NARROMINE_OSM } from './narromine-osm-data.js';

export const NARROMINE_POSTAL_PERSON = Object.freeze({
  id:'narromine:post-office:leah-bennett',
  name:'Leah Bennett',
  age:38, birthday:'14 May',
  job:'fictional postal retail officer',
  home:Object.freeze({osmIndex:203,street:'Terangion Street (West)',label:'Leah’s mapped home (fictional occupancy)',address:null,
    note:'The mapped single-storey house is OSM building index 203. The real house number and real occupants are unknown and deliberately not invented.'}),
  household:Object.freeze({relationship:'single',partner:null,children:[],
    pet:{name:'Mabel',kind:'elderly rescue kelpie-cross',age:10},
    relatives:['Younger brother Oliver lives in Dubbo; they usually ring on Sunday nights',
      'Her mum Denise lives in Dubbo; she visits every few weeks']}),
  personality:'Unhurried, quietly funny, conscientious and a little private. Likes to make customers feel unhurried, but can be too hard on herself after a difficult interaction.',
  backstory:'Grew up in the Central West, returned to Narromine after several years in Orange. Has worked in customer-facing postal services for eight years. The house is fictional occupancy of a real mapped footprint, not a claim about an actual resident.',
  habits:['Carries a small reusable shopping bag to work on Tuesdays and Thursdays.',
    'Buys groceries at the real Coles beside Kierath\'s Shopping Square.',
    'Walks Mabel before work and after getting home; never leaves her in a car outside the supermarket.',
    'Often cooks enough dinner for tomorrow\'s lunch and checks on the garden after sunset in summer.',
    'Brings her own lunch and takes a full meal break rather than eating at the counter.'],
  hopes:['Save enough for an interstate trip with her mother','Finish a small community oral-history scrapbook'],
  worries:['Her aging dog has slowed down','The parcel rush before Christmas can be exhausting'],
  conversation:Object.freeze({
    hello:'G’day. I’m Leah. Are you after the postal counter, or did you want to know a bit about Narromine?',
    work:'I like helping people get things sorted. There can be a queue, though. I try not to rush somebody just because the next person is waiting.',
    home:'I live in a little place near Terangion Street. It’s just me and Mabel, my old kelpie-cross. The place is nothing fancy, but it’s home.',
    family:'I’m single, no kids. I’m close with my brother Oliver and Mum in Dubbo. Mabel is very much family too.',
    groceries:'Coles is just by the shopping square. I usually grab a few things Tuesday and Thursday after work, then do the big shop on Saturday.',
    offDuty:'When I’m not here, I’m probably walking Mabel, cooking, reading, doing the garden or catching up with family.',
    boundaries:'I can tell you a bit about myself, but I won’t share private customer details or pretend I know real postal staff.'
  })
});

// NSW Government public holiday dates for the two verified calendar years.
// Bank Holiday (August) is NOT included: it is not a general NSW public holiday.
// Local exceptions, special trading changes, personal leave and roster swaps are unknown.
export const NSW_POSTAL_PUBLIC_HOLIDAYS=Object.freeze(new Set([
  '2026-01-01','2026-01-26','2026-04-03','2026-04-04','2026-04-05','2026-04-06','2026-04-25','2026-04-27',
  '2026-06-08','2026-10-05','2026-12-25','2026-12-26','2026-12-28',
  '2027-01-01','2027-01-26','2027-03-26','2027-03-27','2027-03-28','2027-03-29','2027-04-25','2027-04-26',
  '2027-06-14','2027-10-04','2027-12-25','2027-12-26','2027-12-27','2027-12-28'
]));
export const POSTAL_HOURS=Object.freeze({weekday:[9*60,17*60],weekend:null});
export const COLES_HOURS=Object.freeze({weekday:[6*60,21*60],sunday:[7*60,21*60]});
export const POSTAL_HOME_OSM_BUILDING_INDEX=203;
export const POSTAL_WALK_ROUTE_LOCAL=Object.freeze([
  [-2067,-322.7],[-2058.8,-305.5],[-2006.2,-297.6],[-1990.6,-295.3],
  [-1960.4,-497.5],[-1951.7,-556.1],[-1950.1,-567.1],[-1945.8,-595.6],
  [-1932.9,-682.4],[-1924.5,-738.8],[-1920.7,-763.7],[-1919.9,-769.3],
  [-1916.6,-791.2],[-1914.4,-806.3],[-1905.9,-846.2],[-1909.7,-858.4],
  [-1911.1,-870.2],[-1909.7,-878],[-1905.6,-906.6],[-1901.7,-934.0],
  [-1921.2,-946.6]
].map(p=>Object.freeze(p)));
const HOUSE=NARROMINE_OSM.buildings[POSTAL_HOME_OSM_BUILDING_INDEX];
if(!HOUSE || HOUSE.kind!=='house' || HOUSE.levels!==1 || HOUSE.name)
  throw new Error('Leah’s exact mapped residential house OSM index changed: review the assignment before rendering.');
const centre=HOUSE.pts.reduce((p,q)=>[p[0]+q[0]/HOUSE.pts.length,p[1]+q[1]/HOUSE.pts.length],[0,0]);
if(Math.hypot(centre[0]-(-2066.5375),centre[1]-(-332.5875))>2)
  throw new Error('Leah’s mapped house location no longer matches the walking route.');

const row=(start,end,place,activity,phase='personal')=>Object.freeze({start,end,place,activity,phase});
const DAILY_WORK=Object.freeze([
  row(0,375,'home','Asleep; Mabel is curled up in her bed'),
  row(375,400,'home','Wake, shower, put the kettle on'),
  row(400,430,'neighbourhood','Quiet morning dog walk around the neighbourhood','dog-walk'),
  row(430,460,'home','Breakfast, pack a homemade lunch and refill Mabel’s water'),
  row(460,502,'home','Get dressed and ready; check keys and reusable shopping bag'),
  row(502,518,'route:home-post','Walk toward Dandaloo Street on local streets','commute'),
  row(518,540,'post-office','Arrive early; prepare the counter and check the day’s mail','setup'),
  row(540,630,'post-office','Serve customers: letters, stamps and parcels','counter'),
  row(630,640,'post-office-break','Ten-minute morning tea break; another colleague covers','break'),
  row(640,760,'post-office','Serve customers and arrange outgoing parcels','counter'),
  row(760,790,'post-office-break','Thirty-minute uninterrupted lunch; reheats food and sits down','lunch'),
  row(790,915,'post-office','Counter service, parcel enquiries and PO-box work','counter'),
  row(915,925,'post-office-break','Ten-minute afternoon break; colleague covers','break'),
  row(925,1020,'post-office','Afternoon service and end-of-day mail checks','counter'),
  row(1020,1032,'post-office','Balance the fictional till, tidy the workspace and leave','close')
]);
function weekdayTail(weekday){
 const groceries=(weekday===2||weekday===4);
 return groceries ? [
   row(1032,1038,'route:post-coles','Walk to Coles next door','commute'),
   row(1038,1060,'coles','Buy fresh food and a few pantry staples; use a basket','groceries'),
   row(1060,1080,'route:coles-home','Walk home carrying two light bags','commute'),
   row(1080,1105,'neighbourhood','Walk Mabel and put the shopping away','dog-walk'),
   row(1105,1150,'home','Cook and eat dinner, make tomorrow’s lunch'),
   row(1150,1210,'home','Dishes, washing and a little gardening'),
   row(1210,1290,'home','Read, scrapbook or message family'),
   row(1290,1320,'home','Quiet wind-down and prepare for bed'),
   row(1320,1440,'home','Sleep')
 ] : [
   row(1032,1048,'route:post-home','Walk home along local streets','commute'),
   row(1048,1085,'neighbourhood','Evening dog walk with Mabel','dog-walk'),
   row(1085,1130,'home','Cook, eat dinner and pack tomorrow’s lunch'),
   row(1130,1210,'home','Dishes, washing, gardening and a quiet cuppa'),
   row(1210,1290,'home','Read, scrapbook or phone a friend'),
   row(1290,1320,'home','Wind down, prepare clothes for morning'),
   row(1320,1440,'home','Sleep')
 ];
}
const SATURDAY=Object.freeze([
 row(0,435,'home','Sleep in a little'),
 row(435,480,'home','Breakfast and tidy the kitchen'),
 row(480,540,'neighbourhood','Long dog walk with Mabel','dog-walk'),
 row(540,555,'route:home-coles','Walk to Coles with a shopping list','commute'),
 row(555,600,'coles','Weekly grocery shop: fresh produce, proteins and pantry staples','groceries'),
 row(600,625,'route:coles-home','Carry groceries home and refrigerate perishables promptly','commute'),
 row(625,750,'home','Laundry, clean kitchen and prepare meals'),
 row(750,840,'neighbourhood','Visit the town centre for a coffee and a stroll','leisure'),
 row(840,1035,'home','Gardening, reading and house chores'),
 row(1035,1080,'neighbourhood','Evening dog walk','dog-walk'),
 row(1080,1170,'home','Cook dinner, eat and clean up'),
 row(1170,1320,'home','Relax with a book or film'),
 row(1320,1440,'home','Sleep')
]);
const SUNDAY=Object.freeze([
 row(0,450,'home','Sleep'),
 row(450,510,'home','Slow breakfast and check on the garden'),
 row(510,570,'neighbourhood','Long dog walk','dog-walk'),
 row(570,750,'home','Housework, pot plants and reading'),
 row(750,825,'home','Lunch and weekend meal preparation'),
 row(825,960,'neighbourhood','Visit local park and meet friends for a stroll','leisure'),
 row(960,1050,'home','Plan meals and prepare lunches for work'),
 row(1050,1100,'neighbourhood','Evening dog walk','dog-walk'),
 row(1100,1170,'home','Cook and eat dinner'),
 row(1170,1260,'home','Phone Mum or Oliver in Dubbo'),
 row(1260,1320,'home','Wind down; get ready for Monday'),
 row(1320,1440,'home','Sleep')
]);
const HOLIDAY=Object.freeze([
 row(0,450,'home','Sleep; no fictional public postal shift'),
 row(450,510,'home','Breakfast and take it slowly'),
 row(510,570,'neighbourhood','Walk Mabel in the cooler part of the morning','dog-walk'),
 row(570,780,'home','Read, garden and do chores; observe holiday shop closures'),
 row(780,900,'home','Lunch and make a call to family'),
 row(900,1050,'neighbourhood','Walk around town or visit friends','leisure'),
 row(1050,1110,'neighbourhood','Dog walk','dog-walk'),
 row(1110,1320,'home','Dinner, quiet time and wind down'),
 row(1320,1440,'home','Sleep')
]);
export function postalDayPlan(day){
 const d=townDate(day);
 if(NSW_POSTAL_PUBLIC_HOLIDAYS.has(d.iso))return HOLIDAY;
 if(d.weekday===6)return SATURDAY;
 if(d.weekday===0)return SUNDAY;
 return [...DAILY_WORK,...weekdayTail(d.weekday)];
}
export function postalState(day,minute){
 const date=townDate(day),m=((Number(minute)%1440)+1440)%1440;
 const plan=postalDayPlan(day);
 const slot=plan.find(s=>m>=s.start&&m<s.end);
 if(!slot)throw new Error('Postal NPC schedule has an uncovered time interval: '+date.iso+' '+m);
 return Object.freeze({id:NARROMINE_POSTAL_PERSON.id,name:NARROMINE_POSTAL_PERSON.name,
   date:date.iso,weekday:date.weekdayName,minute:m,place:slot.place,phase:slot.phase,activity:slot.activity,
   since:slot.start,until:slot.end,
   atCounter:slot.phase==='counter',atColes:slot.place==='coles',atHome:slot.place==='home',
   atPostOffice:slot.place.startsWith('post-office'),
   onShift:slot.place.startsWith('post-office'),
   isHoliday:NSW_POSTAL_PUBLIC_HOLIDAYS.has(date.iso),
   isWorkday:date.weekday>=1&&date.weekday<=5&&!NSW_POSTAL_PUBLIC_HOLIDAYS.has(date.iso),
   shopOpen:date.weekday!==0?m>=360&&m<1260:m>=420&&m<1260});
}
export const postalFormatTime=minute=>String(Math.floor(minute/60)%24).padStart(2,'0')+':'+String(Math.floor(minute%60)).padStart(2,'0');
export function postalScheduleText(day){
 return postalDayPlan(day).map(s=>postalFormatTime(s.start)+'–'+postalFormatTime(s.end)+'  '+s.activity).join('\n');
}
