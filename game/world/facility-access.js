import {pubAdmission} from './pub-standards.js';
// Public entry is different from 24-hour operations: treatment plants, emergency
// response and utilities keep working when their front reception is locked.
import { workingAt } from './shop-attendance.js';
import {venueHoursOnDay} from './town-calendar.js';

const RECEPTION_HOURS = Object.freeze({
  hotel: [7 * 60, 23 * 60],
  police: [7 * 60, 23 * 60],
  ambulance: [7 * 60, 19 * 60],
  fire: [7 * 60, 19 * 60],
  power: [8 * 60, 18 * 60],
  waterworks: [8 * 60, 18 * 60],
  sewage: [8 * 60, 18 * 60],
  farmhouse: [9 * 60, 17 * 60],
});
const SUPERVISED = new Set([
  'police','ambulance','fire','power','waterworks','sewage','landfill',
  'depot','mill','foundry','soyplant','soyfarm','school','clinic',
  'court','solicitor','recycling'
]);
const PERMANENT_HOSTS = new Set(['farmhouse','square','publicamenities','skatepark','communitygarden','busstop']); // named residents/market guides
const CLOCK = (m) => `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
export function visitorHours(place,day=null) {
  const base=RECEPTION_HOURS[place.id] || [place.opens, place.closes];
  return day===null?base:venueHoursOnDay(place,day,...base);
}
export function openingHoursLabel(place) {
  if(place.id==='square') return 'PUBLIC 24 HOURS';
  if(place.id==='busstop') return 'SHELTER 24 HOURS · HELP 08:00-17:30';
  if(place.id==='farmhouse') return 'VISITS BY APPOINTMENT';
  const [opens,closes]=visitorHours(place);
  const varied=!!venueHoursOnDay(place,7)&&!!venueHoursOnDay(place,6)&&venueHoursOnDay(place,7).join(',')===venueHoursOnDay(place,6).join(',')&&venueHoursOnDay(place,7).join(',')===visitorHours(place).join(',');
  return `${SUPERVISED.has(place.id)||RECEPTION_HOURS[place.id]?'RECEPTION':'HOURS'} ${CLOCK(opens)}-${CLOCK(closes)}${varied?'':' · CHECK WEEKEND HOURS'}`;
}
export function onSiteWorkers(town, place) {
  return (town.villagers || []).filter(v => workingAt(v, place.id, place));
}
export function facilityAccess(town, place) {
  if (!place) return { allowed:false, reason:'unknown', message:'This entrance is unavailable.' };
  if(place.id==='pub'){const a=pubAdmission(town);if(!a.allowed)return a;}
  if (place.id === 'square') return { allowed:true, reason:'public', message:'Public space is open.' };
  if (place.id === 'busstop') return { allowed:true, reason:'public', message:'The bus shelter and timetable area are public at all hours; staff assistance is limited to posted visitor hours.' };
  const shift = town.jobsReport?.()?.active;
  if (shift?.site === place.id && shift.day === town.day)
    return { allowed:true, reason:'employee', message:'Your current work shift gives you access to your workplace.' };
  // A paid hotel booking grants guest access to their room overnight even if
  // public reception has closed; unbooked visitors must wait until morning.
  const booking = place.id === 'hotel' && town.needsReport?.()?.booking;
  if (booking) return { allowed:true, reason:'guest', message:'Your hotel room key grants access after reception closes.' };
  const hours=visitorHours(place,town.day);
  if(!hours)return {allowed:false,reason:'closed-day',message:`${place.name} is closed to visitors today (${town.dateLabel?.()||'weekend'}). Check Town opening hours for the next trading day.${['police','ambulance','fire'].includes(place.id)?' Emergency response remains available; use 000 (Game) for emergencies.':''}`};
  const [opens,closes]=hours;
  if (!(town.minute >= opens && town.minute < closes))
    return { allowed:false, reason:'closed', message:`${place.name}: reception is locked. Visitor hours ${CLOCK(opens)}–${CLOCK(closes)}.${['police','ambulance','fire'].includes(place.id) ? ' Emergency services operate separately; use 000 (Game) for emergencies.' : ''}` };
  const staff = onSiteWorkers(town,place);
  // These are inspectable exterior/first-fit-out shells, NOT magically staffed shops.
  // The player can inspect provisional interiors to inform later detailed builds.
  if(place.expansion && !staff.length && !PERMANENT_HOSTS.has(place.id))
    return {allowed:true,reason:'preview-only',
      message:place.name+' is a first-stage building shell. You may inspect its layout, but no staffed commercial or clinical service is operating yet.'};
  if (!staff.length && !PERMANENT_HOSTS.has(place.id))
    return { allowed:false, reason:'unstaffed', message:`${place.name}: public entry is temporarily locked because no receptionist or authorised worker is on duty. Please return when staff are present.` };
  return { allowed:true, reason:SUPERVISED.has(place.id)?'supervised':'staffed',
    message:SUPERVISED.has(place.id)?`Welcome to ${place.name}. Report to the staff counter; workrooms and records are staff-only.`:`${place.name} is staffed and open.` };
}

// Public admission never authorises handling evidence, health supplies,
// dispatch radios or client records. A legitimate, current workplace shift
// may grant access when authorised by the corresponding supervisor.
const STAFF_ONLY_INTERACTIONS = Object.freeze({
  police:['dispatch','evidence','interview','custody'],
  ambulance:['call','crew','stock','decon','vehicle','vehicle2'],
  court:['bench','holding','consult'],
  solicitor:['office','consult','records'],
});
export function restrictedServiceAction(town, place, item) {
  if (!place || !item?.key) return null;
  const key = String(item.key).split(':').at(-1);
  if (!STAFF_ONLY_INTERACTIONS[place.id]?.includes(key)) return null;
  const shift=town.jobsReport?.()?.active;
  if (shift?.site === place.id && shift.day === town.day) return null;
  return `${item.label || 'This area'} is restricted to authorised staff and escorted visitors. Please speak to the receptionist; confidential records and equipment are not public exhibits.`;
}
