// Repository Town's stable Australian civil calendar. Day 1 = Monday 26 October 2026.
// UTC arithmetic is intentional: game days must never drift under DST, phone timezone,
// system clock changes or save/reload. This is town time, not the player's actual date.
export const FIRST_TOWN_DATE='2026-10-26';
const EPOCH=Date.UTC(2026,9,26), DAY_MS=86400000;
const WEEKDAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
let dateCacheDay=0,dateCache=null;
export function townWeekday(day=1){const n=Number.isFinite(day)?Math.max(1,Math.trunc(day)):1;return n%7;}
export function townDate(day=1){
 const n=Number.isFinite(day)?Math.max(1,Math.trunc(day)):1;
 if(n===dateCacheDay)return dateCache;
 const date=new Date(EPOCH+(n-1)*DAY_MS);
 const weekday=date.getUTCDay(),month=date.getUTCMonth(),dayOfMonth=date.getUTCDate(),year=date.getUTCFullYear();
 dateCacheDay=n;
 dateCache=Object.freeze({day:n,year,month:month+1,dayOfMonth,weekday,weekdayName:WEEKDAYS[weekday],
  iso:date.toISOString().slice(0,10),weekend:weekday===0||weekday===6,
  label:`${WEEKDAYS[weekday]} ${dayOfMonth} ${MONTHS[month]} ${year}`});
 return dateCache;
}
export function isWeekend(day){const w=townWeekday(day);return w===0||w===6;}
export function townDateLabel(day){return townDate(day).label;}

// Public service visitor and business hours. A null result is *closed*, not
// a 24-hour service. Operational emergency and farm duties continue separately.
// These are fictional town trading policies, NOT claims about real NSW businesses.
const WEEKDAY_ONLY=new Set([
 'school','tafe','university','bank','post','hall','court','solicitor',
 'realty','realestate','dealership','mechanic','trades','mill','soyplant',
 'foundry','recycling','landfill','securityoffice','locksmith'
]);
export function weekdayOnlyWorkplace(id){return WEEKDAY_ONLY.has(id);}
const SATURDAY_ONLY=new Set(['greengrocer','butcher','hardware']);
const ESSENTIAL=new Set(['police','ambulance','fire','power','waterworks','sewage',
 'hotel','depot','securityhq','sheep','dairy','coop','orchard','garden','silo','soyfarm']);
const NON_ROTATING=new Set(['police','ambulance','fire','power','waterworks','sewage','hotel','depot','securityhq']);
const WEEKEND_TRADERS=new Set(['store','bakery','cafe','pub','clinic']);
export function venueHoursOnDay(place,day,baseOpens=place?.opens,baseCloses=place?.closes){
 if(!place)return null;
 const weekday=townWeekday(day);
 if(weekday!==0&&weekday!==6)return [baseOpens,baseCloses];
 if(WEEKDAY_ONLY.has(place.id))return null;
 if(weekday===0 && SATURDAY_ONLY.has(place.id))return null;
 if(ESSENTIAL.has(place.id)||place.kind==='park'||place.kind==='home')return [baseOpens,baseCloses];
 const saturday=weekday===6;
 if(place.id==='pub')return [saturday?11*60:12*60,saturday?23*60:21*60];
 if(place.id==='cafe')return [8*60,saturday?17*60:16*60];
 if(place.id==='bakery')return [7*60,saturday?17*60:14*60];
 if(place.id==='store')return [8*60,saturday?18*60:16*60];
 if(place.id==='clinic')return saturday?[9*60,13*60]:null;
 if(SATURDAY_ONLY.has(place.id))return [9*60,Math.min(baseCloses,15*60)];
 if(WEEKEND_TRADERS.has(place.id))return [baseOpens,baseCloses];
 // Provisional expansion venues with no weekend staffing do not silently open.
 if(place.expansion)return null;
 return [baseOpens,baseCloses];
}
// A venue with 2+ employees runs an alternating weekend roster; the *same*
// person gets a day off, while the other works. Nobody is duplicated to staff
// an empty building; the normal physical-presence gate still applies.
// Single-worker essential workplaces retain coverage. Other workers at closed
// venues get their Saturday/Sunday free, rather than commuting to a locked door.
export function residentWorksToday(day,worker,place=null,colleagues=1){
 const hours=venueHoursOnDay(place||{id:worker?.work},day);
 if(!hours)return false;
 if(!isWeekend(day))return true;
 const id=place?.id||worker?.work;
 if(NON_ROTATING.has(id)||id==='home'||worker?.job==='security guard')return true;
 if(Array.isArray(colleagues)&&colleagues.length>1){
  const order=colleagues.findIndex(w=>w.id===worker?.id);
  return (Math.max(0,order)%2)===(townWeekday(day)===6?0:1);
 }
 if(colleagues>1)return (Math.abs(worker?.id||0)%2)===(townWeekday(day)===6?0:1);
 return true;
}
