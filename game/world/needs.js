// Physiology, food and paid lodgings. Town minutes, persistent and deterministic.
import { legacyHouseCoordinate } from './addresses.js';
// Neither meals nor shelter are magically free. No health/death punishment.
const clamp=(n)=>Math.max(0,Math.min(100,n));
export const HOTEL_RATE=24, HOTEL_ROOMS=4;
export const FOOD_ENERGY={bread:38,pie:55,fruit:34,veg:32,eggs:44,milk:30,lamb:56,cafe_roll:58,cafe_breakfast:80,cafe_flat_white:42,cafe_toastie:55,cafe_soup:45,pub_parmy:85,pub_roast:90,pub_pie:75,pub_tea:5,pub_coffee:5,cafe_pie:55,cafe_cream_bun:40,cafe_lamington:40,cafe_sausage_roll:50,cafe_coffee:5,store_coffee:5,store_cordial:8,store_tinned_food:28,store_butter:18,store_lollies:12,pub_soft_drink:8,pub_chips:35,cooked_lamb:85,cooked_veg:50};
export function startNeeds(t) {
  const p=t.civic.player;
  p.hunger=clamp(Number.isFinite(p.hunger)?p.hunger:32);
  p.fatigue=clamp(Number.isFinite(p.fatigue)?p.fatigue:22);
  p.lastSleptDay=Number.isInteger(p.lastSleptDay)?p.lastSleptDay:0;
  p.lastAte=typeof p.lastAte==='string'?p.lastAte:'';
  p.hotelBooking=p.hotelBooking&&typeof p.hotelBooking==='object'?p.hotelBooking:null;
  for(const v of t.villagers){
    v.fatigue=clamp(Number.isFinite(v.fatigue)?v.fatigue:20+(v.id%12));
    v.restedMinutes=Number.isFinite(v.restedMinutes)?v.restedMinutes:0;
    v.missedMeals=Number.isInteger(v.missedMeals)?v.missedMeals:0;
  }
  return p;
}
export function advanceNeeds(t,minutes) {
  const p=startNeeds(t);
  p.hunger=clamp(p.hunger+minutes*0.075);
  // Sitting is a gentle break, not a substitute for overnight sleep:
  // time and household charges continue while the visitor rests.
  p.fatigue=clamp(p.fatigue+minutes*(t.playerSeated ? -0.08 : 0.062));
  for(const v of t.villagers){
    const sleeping=v.step?.kind==='sleep'&&v.inside&&!v.path.length;
    // People regain energy only when actually home, not while travelling.
    v.fatigue=clamp(v.fatigue+(sleeping?-0.19:0.07)*minutes);
    if(sleeping)v.restedMinutes+=minutes;
    if(v.hunger>92&&v.fatigue>92&&v.job!=='student')v.memory='exhausted and struggling to find a meal';
  }
}
export function eatPlayer(t,good) {
  const p=t.civic.player;
  if(!Object.hasOwn(FOOD_ENERGY,good))return 'That item is not an edible meal.';
  if(!(p.bag[good]>0))return 'You do not have that food in your bag.';
  p.bag[good]--;
  p.hunger=clamp(p.hunger-FOOD_ENERGY[good]);
  p.lastAte=good+' (Day '+t.day+' '+t.time()+')';
  t.rubbish(1);t.stats.meals++;
  t.log('The visitor ate '+good+' from their supplies.');
  return 'You eat '+good+'. Hunger is now '+Math.round(p.hunger)+'%.';
}
export function hotelCheckIn(t) {
  const p=startNeeds(t),hotel=t.place('hotel');
  if(!hotel)return 'There is no hotel in town.';
  if(p.hotelBooking?.day===t.day)return 'You already have a room key for tonight.';
  const booked=hotel.bookings||[];
  const today=booked.filter(x=>x.day===t.day);
  if(today.length>=HOTEL_ROOMS)return 'The hotel is fully booked tonight.';
  if(p.wallet<HOTEL_RATE)return 'A room costs $'+HOTEL_RATE+'. You have $'+p.wallet+'. The 24-hour ATM outside the Community Bank pays out from your savings at any hour.';
  p.wallet-=HOTEL_RATE;
  t.sale(hotel,HOTEL_RATE);
  const room=[1,2,3,4].find(n=>!today.some(x=>x.room===n));
  hotel.bookings=[...booked.filter(x=>x.day>=t.day-1),{day:t.day,room,guest:'Player'}].slice(-12);
  p.hotelBooking={day:t.day,room};
  t.log('The visitor checked into the Railway Hotel, room '+room+'.');
  return 'Room '+room+' booked for $'+HOTEL_RATE+'. Find a guest bed to sleep.';
}
// A home is usable only after a signed lease or settlement with vacant possession.
// Buying an investment with an existing resident does not entitle the player to their bed.
export function playerHome(t, coordinate) {
  if (!coordinate || !t.civic.property?.parcels) return null;
  const legacy=legacyHouseCoordinate(coordinate);
  if (!legacy) return null;
  const id='H:'+legacy, state=t.civic.property, parcel=state.parcels[id];
  if (!parcel || parcel.kind!=='house') return null;
  if (state.playerLease===id && parcel.tenant==='visitor') return parcel;
  if (parcel.owner==='visitor' && (!parcel.tenant || parcel.tenant==='visitor')) return parcel;
  return null;
}
// Sleep choices share one clock and physiology model with the legacy hotel/home API.
export function sleepChoices(t) {
  const options=[
    {label:'Power nap · 30 minutes',duration:30,minutes:30},
    {label:'Rest · 1 hour',duration:60,minutes:60},
    {label:'Nap · 2 hours',duration:120,minutes:120},
    {label:'Sleep · 4 hours',duration:240,minutes:240},
    {label:'Sleep · 6 hours',duration:360,minutes:360},
    {label:'Full night · 8 hours',duration:480,minutes:480}
  ];
  if(t.minute>=18*60||t.minute<6*60){
    const minutes=(6*60-t.minute+1440)%1440||1440;
    if(minutes<=720)options.push({label:'Sleep until 06:00',duration:'morning',minutes});
  }
  return options;
}
function sleepLength(t, duration) {
  if(duration==null) return t.minute>=360&&t.minute<1080?120:((360-t.minute+1440)%1440||1440);
  if(duration==='morning')return t.minute>=1080||t.minute<360?((360-t.minute+1440)%1440||1440):null;
  return [30,60,120,240,360,480].includes(duration)?duration:null;
}
// The session splits a long sleep into small, real town ticks. UI can show time
// passing over several frames; tests and other callers can complete it immediately.
export function createSleepSession(t,site='hotel',room=null,duration=null) {
  const p=startNeeds(t);
  let label='the Railway Hotel';
  if(site==='home'){
    const parcel=playerHome(t,room);
    if(!parcel)return {ok:false,error:'This bed belongs to someone else. Rent or buy a vacant home before sleeping here.'};
    label=parcel.name;
  }else{
    const valid=p.hotelBooking&&(p.hotelBooking.day===t.day||(t.minute<360&&p.hotelBooking.day===t.day-1));
    if(site!=='hotel'||!valid)return {ok:false,error:'You need to book a hotel room for tonight first.'};
    if(room!==null&&room!==p.hotelBooking.room)return {ok:false,error:'Your key is for guest room '+p.hotelBooking.room+'.'};
  }
  const minutes=sleepLength(t,duration);
  if(!Number.isFinite(minutes)||minutes<1||minutes>720)return {ok:false,error:'Choose a valid rest duration (up to 12 hours).'};
  const fatigueBefore=p.fatigue;
  let elapsed=0, finished=false;
  const startDay=t.day, startTime=t.time();
  return {
    ok:true,minutes,startDay,startTime,
    get remaining(){return minutes-elapsed;},
    advance(amount) {
      if(finished)throw new Error('This rest has already ended.');
      if(!Number.isFinite(amount)||amount<=0)throw new Error('Rest progress must be positive.');
      const stepMinutes=Math.min(amount,minutes-elapsed);
      for(let done=0;done<stepMinutes;done+=0.5)t.tick(Math.min(0.5,stepMinutes-done));
      elapsed+=stepMinutes;
      return minutes-elapsed;
    },
    finish() {
      if(finished)throw new Error('This rest has already ended.');
      if(minutes-elapsed>0.00001)throw new Error('Rest cannot finish before its town time has elapsed.');
      finished=true;
      // Short naps help; long uninterrupted sleep restores more. Ordinary town
      // hunger accrues during the same hours, without extra arbitrary meal costs.
      const recovery=Math.min(95,Math.min(minutes,120)*0.35+Math.max(0,minutes-120)*0.12);
      p.fatigue=clamp(fatigueBefore-recovery);
      if(minutes>=240)p.lastSleptDay=t.day;
      if(site==='hotel'&&p.hotelBooking&&(t.day>p.hotelBooking.day&&t.minute>=360))
        p.hotelBooking=null;
      const action=minutes===120?'took a two-hour nap':minutes<=60?'rested':'slept';
      t.log('The visitor '+action+' at '+label+' for '+Math.round(minutes)+' minutes.');
      return 'You '+action+' at '+(site==='hotel'?'the hotel':label)+'. It is Day '+t.day+' '+t.time()+'. Fatigue '+Math.round(p.fatigue)+'%, hunger '+Math.round(p.hunger)+'%.';
    }
  };
}
export function sleepPlayer(t,site='hotel',room=null,duration=null) {
  const session=createSleepSession(t,site,room,duration);
  if(!session.ok)return session.error;
  while(session.remaining>0)session.advance(Math.min(12,session.remaining));
  return session.finish();
}
export function needsReport(t){
  const p=startNeeds(t),all=t.villagers;
  return {hunger:p.hunger,fatigue:p.fatigue,lastAte:p.lastAte,
    booking:p.hotelBooking,rate:HOTEL_RATE,rooms:HOTEL_ROOMS,
    hungry:all.filter(v=>v.hunger>65).length,exhausted:all.filter(v=>v.fatigue>70).length,
    sleeping:all.filter(v=>v.step?.kind==='sleep'&&v.inside).length,
    mealsToday:t.stats.meals};
}
