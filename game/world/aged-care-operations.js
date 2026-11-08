// Fictional resident and workforce simulation for the TWO researched UPA-style
// campuses in Repository Town. NO real residents, personnel, shifts, bed occupancy,
// clinical records or restricted layout information. Names deliberately invented.
// BrackenHouse and YeovalAgedCare public research, audited 27 Oct 2026.
export const CARE_FACILITIES=Object.freeze({
 'bracken-house':Object.freeze({id:'bracken-house',name:'Bracken House',capacity:72,lavenderPlaces:20,
   source:'private research notes (Bracken House)',capacityConfidence:'72–74 reported; 72 is a gameplay assumption',
   shifts:{rn:[3,2,2],en:[2,2,1],pcw:[9,8,4],chef:[1,1,0],kitchen:[2,1,0],
     activities:[2,1,0],cleaning:[2,1,0],laundry:[1,1,0],admin:[2,0,0],
     maintenance:[1,0,0],physio:[1,0,0],manager:[1,0,0],chaplain:[1,0,0]}}),
 'yeoval-aged-care':Object.freeze({id:'yeoval-aged-care',name:'Yeoval Aged Care',capacity:25,lavenderPlaces:0,
   source:'private research notes (Yeoval aged care)',capacityConfidence:'25 places referenced publicly, actual occupancy unverified',
   shifts:{rn:[1,1,1],en:[1,1,0],pcw:[3,3,1],chef:[1,1,0],kitchen:[1,1,0],
     activities:[1,0,0],cleaning:[1,1,0],laundry:[1,0,0],admin:[1,0,0],
     maintenance:[1,0,0],physio:[1,0,0],manager:[1,0,0],chaplain:[0,0,0]}})
});
export const CARE_SHIFTS=Object.freeze([
 {id:'day',label:'Morning',start:7*60,end:15*60},
 {id:'evening',label:'Afternoon',start:15*60,end:23*60},
 {id:'night',label:'Night',start:23*60,end:7*60}
]);
export const CARE_ROLES=Object.freeze({
 rn:'Registered nurse (RN)',en:'Enrolled nurse (EN)',pcw:'Personal care worker / AIN',
 chef:'Cook / chef',kitchen:'Kitchen and catering assistant',activities:'Lifestyle and activities officer',
 cleaning:'Environmental services cleaner',laundry:'Laundry assistant',
 admin:'Administration / reception',maintenance:'Maintenance officer',
 physio:'Visiting physiotherapist',manager:'Clinical care manager',chaplain:'Pastoral care / chaplain'
});
const FIRST=['Avery','Billie','Camryn','Dion','Emery','Finley','Gale','Harper','Indigo','Jesse','Kendall','Lane','Morgan','Noel','Parker','Quinn','Riley','Sage','Taylor','Val','Wren','Zara','Abel','Claudia','Elliot','Frances','Gareth','Imogen','Jaya','Kieran','Leah','Miriam','Nathaniel','Odette','Pia','Reuben','Sabrina','Tobias','Una','Victor','Willow','Yasmine','Zac','Alice','Benjamin','Celia','Daphne','Eric','Flora','Gordon','Heidi','Ivan','Josie','Keith','Lydia','Max','Nina','Owen','Phoebe','Rohan','Susan','Tom','Violet','Walter'];
const LAST=['Mercer','Bell','Nolan','Hughes','Bennett','Morris','Khan','Griffiths','Nguyen','Price','Walker','Taylor','Fletcher','Young','Patel','Ross','Wright','Stewart','Turner','Webb','Clarke','Martin','Gray','Evans','Wilson','King','Ng','Thomas','Harris','Sutton','Cole','Olsen','Baker','Chen','Singh','Brown','Brooks','Mason','Doyle','Scott'];
const ROLES_OFFDAY=new Set(['admin','maintenance','physio','manager','chaplain']);
const stableName=(i,offset)=>FIRST[(i*13+offset*5)%FIRST.length]+' '+LAST[(i*17+offset*3+Math.floor(i/FIRST.length))%LAST.length];
const POOLS=new Map(),RESIDENTS=new Map();
const cleanDay=d=>Math.max(1,Math.trunc(Number(d)||1));
function pool(id){
 if(POOLS.has(id))return POOLS.get(id);
 const facility=CARE_FACILITIES[id];if(!facility)return [];
 let staff=[],serial=0;
 for(const [role,slots] of Object.entries(facility.shifts)){
   const weeklySlots=slots.reduce((a,b)=>a+b,0)*7;
   const size=Math.max(...slots,0,Math.ceil(weeklySlots/5));
   for(let n=0;n<size;n++)staff.push(Object.freeze({
     id:id+':staff:'+serial,name:stableName(serial,id==='bracken-house'?2:9),
     role,job:CARE_ROLES[role],facility:id,staffIndex:serial++,staffRoleIndex:n
   }));
 }
 POOLS.set(id,Object.freeze(staff));return POOLS.get(id);
}
export function careStaff(id){return pool(id);}
export function careResidents(id){
 if(RESIDENTS.has(id))return RESIDENTS.get(id);
 const f=CARE_FACILITIES[id];if(!f)return [];
 const people=Array.from({length:f.capacity},(_,i)=>Object.freeze({
   id:id+':resident:'+i,name:stableName(i+130,id==='bracken-house'?14:21),
   age:66+(i*11+(id==='bracken-house'?3:9))%36,facility:id,
   household:i<f.lavenderPlaces?'Lavender Wing (fictional cohort)':'Residential household',
   status:'Fictional resident; no real health information',index:i
 }));
 RESIDENTS.set(id,Object.freeze(people));return RESIDENTS.get(id);
}
export function careShiftAt(minute){
 const m=((Math.floor(minute)%1440)+1440)%1440;
 return m<7*60?2:m<15*60?0:m<23*60?1:2;
}
function rosterFromIndex(id,day,shiftIndex){
 const facility=CARE_FACILITIES[id];if(!facility)return [];
 const date=cleanDay(day),weekend=[0,6].includes(date%7);
 const on=[];
 for(const [role,counts] of Object.entries(facility.shifts)){
   if(ROLES_OFFDAY.has(role) && (shiftIndex!==0||weekend))continue;
   if(role==='chaplain' && date%7!==1)continue;
   const group=pool(id).filter(p=>p.role===role), count=counts[shiftIndex]||0;
   const daySlots=counts.reduce((a,b)=>a+b,0);
   const before=counts.slice(0,shiftIndex).reduce((a,b)=>a+b,0);
   for(let k=0;k<count;k++){
     // Weekly modulo rotation: staff work ~4–5 shifts/week; each shift
     // has different actual people. Never create an infinite 24-hour worker.
     const worker=group[((date-1)*daySlots+before+k)%group.length];
     if(worker)on.push({...worker,shift:CARE_SHIFTS[shiftIndex].id,day:date,
       start:CARE_SHIFTS[shiftIndex].start,end:CARE_SHIFTS[shiftIndex].end});
   }
 }
 return on;
}
export function careRoster(id,day,shiftIndex){return rosterFromIndex(id,day,shiftIndex);}
export function careOnDuty(id,day,minute){
 const shiftIndex=careShiftAt(minute);
 // 00:00–07:00 belongs to the shift that commenced the previous day.
 return rosterFromIndex(id,minute<7*60?Math.max(1,cleanDay(day)-1):day,shiftIndex);
}
export function careDailyMetrics(id,day){
 const f=CARE_FACILITIES[id];if(!f)return null;
 let direct=0,rn=0;const roles={};
 for(let shift=0;shift<3;shift++)for(const person of rosterFromIndex(id,day,shift)){
   roles[person.role]=(roles[person.role]||0)+1;
   if(['rn','en','pcw'].includes(person.role))direct+=8*60;
   if(person.role==='rn')rn+=8*60;
 }
 return {facility:id,day,simulatedResidents:f.capacity,lavenderPlaces:f.lavenderPlaces,
  directMinutesPerResident:Math.round(10*direct/f.capacity)/10,
  rnMinutesPerResident:Math.round(10*rn/f.capacity)/10,careMinutes:direct,rnMinutes:rn,
  roles,assumption:'Fictional scheduled staffing capacity only, not delivered care, funded target or verified UPA roster'};
}
export function careActivity(minute,index,site){
 const h=(minute%1440)/60;
 if(h<6.5)return 'sleeping or receiving night-time assistance';
 if(h<9)return 'breakfast and morning personal care';
 if(h<11.5)return index%3===0?'gardening and morning fresh air':'morning tea and supported activities';
 if(h<13.5)return 'having lunch and choosing meals';
 if(h<16.5)return index%4===0?'resting in a private room':'spending time in the communal lounge';
 if(h<19)return 'dinner and evening social time';
 if(h<21.5)return index%3===0?'reading and talking with family':'relaxing with evening entertainment';
 return 'evening personal care and settling for bed';
}
// Choose vacant actual SOUTHERN grid houses (row 8, then 7 and 6); no duplicate
// allocations over existing 171 employed NPC homes or fictional care facilities.
// Three care-worker housemates per share-house is a game assumption.
export function assignCareHousing(careWorkers,availableCoordinates,existingOccupied){
 const vacant=[...availableCoordinates].filter(c=>/^[A-Z][1-8]$/.test(c)&&
   Number(c.slice(1))>=6&&!existingOccupied.has(c));
 vacant.sort((a,b)=>Number(b.slice(1))-Number(a.slice(1))||a.localeCompare(b));
 const groups=new Map(),allocation=new Map();
 for(let i=0;i<careWorkers.length;i++){
   const coordinate=vacant[Math.floor(i/3)];
   if(!coordinate)break;
   const staff={...careWorkers[i],homeCoordinate:coordinate};
   if(!groups.has(coordinate))groups.set(coordinate,[]);
   groups.get(coordinate).push(staff);allocation.set(staff.id,coordinate);
 }
 return {houses:groups,allocations:allocation,staffHoused:allocation.size,totalStaff:careWorkers.length};
}
export function careOccupancyReport(id,day,minute){
 const facility=CARE_FACILITIES[id];if(!facility)return null;
 const staff=careOnDuty(id,day,minute);
 return {facility:facility.name,day,minute,residents:facility.capacity,
  verifiedOccupancy:false,staffCount:staff.length,rn:staff.filter(w=>w.role==='rn').length,
  en:staff.filter(w=>w.role==='en').length,careWorkers:staff.filter(w=>w.role==='pcw').length,
  staff,metrics:careDailyMetrics(id,day)};
}
