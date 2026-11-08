import {pubStandards} from './pub-standards.js';
import { pilotMains } from './electrical-pilot.js';

// A roster is not proof of presence: council work can send somebody elsewhere.
export function workingAt(worker, siteId, place = null) {
  // Accept either the existing (worker, id, place) API or the site's object.
  // A scheduled employee is not proof of a physically staffed building.
  const site=typeof siteId==='object'?siteId:place;
  const id=typeof siteId==='object'?siteId?.id:siteId;
  if(worker?.step?.kind!=='work'||worker.step.at!==id)return false;
  const front=site?.front;
  if(Number.isFinite(worker.x)&&Number.isFinite(worker.z)&&
     Number.isFinite(front?.x)&&Number.isFinite(front?.z)){
    // Remaining commute waypoints may not reflect a person actually at the
    // counter. Use their physical position, including deeper reception areas.
    if(Math.hypot(worker.x-front.x,worker.z-front.z)<=8.5)return true;
    // Farm employees can be on-site in a genuine paddock, not the office.
    const field=site?.field;
    return !!field&&worker.x>=field.x0&&worker.x<=field.x1&&
      worker.z>=field.z0&&worker.z<=field.z1;
  }
  // Older callsites and lightweight fixtures without a physical site retain
  // the original conservative no-remaining-journey rule.
  return !(worker.path?.length);
}

// "the Bakery", but "The Merged Branch" (never "the The Merged Branch"); capital=true starts a sentence.
export const theName = (place, capital = false) => /^the /i.test(place.name) ? place.name : (capital ? 'The ' : 'the ') + place.name;

// Retail counters need an actual worker, not merely an opening-hours sign.
const RETAIL = new Set(['store','bakery','greengrocer','butcher','cafe','pub','supermarket']);
export function shopService(town, place) {
  if(place.id==='pub'){const s=pubStandards(town);if(s.alarm||s.gasLeak)return {available:false,reason:'emergency',message:'Pub service stopped for an emergency drill.'};}
  if (!town.open(place)) return {available:false, reason:'closed', message:`${place.name} is closed.`};
  const power=pilotMains(town,'B:'+place.id);
  if(power===false)return {available:false,reason:'power-outage',message:`${place.name}: no mains electricity. Till and refrigerated food sales cannot operate.`};
  const staff = town.villagers.filter(v => workingAt(v, place.id, place));
  if (RETAIL.has(place.id) && !staff.length)
    return {available:false, reason:'unstaffed', message:`${place.name}: waiting for staff. Nobody is at the counter to serve you.`};
  return {available:true, reason:'serving', staff, message:staff.length ? `Serving now: ${staff.map(v=>v.name).join(', ')}.` : 'Open.'};
}
