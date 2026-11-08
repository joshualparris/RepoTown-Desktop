import {ABS_DUBBO,apportion,lifeStage} from './abs-dubbo.js';
import {isWeekend} from './town-calendar.js';

const FIRST=['Alex','Charlie','Jamie','Morgan','Taylor','Robin','Casey','Avery','Quinn','Rory','Sam','Cameron','Frankie','Drew','Reese','Blair','Lee','Kerry','Jesse','Rowan'];
const LAST=['Banks','Bell','Cove','Dale','Field','Green','Hill','Lake','Marsh','North','Oak','Park','Reed','Stone','Vale'];
const hash=s=>{let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const stable=(a,b)=>a.coordinate.localeCompare(b.coordinate,undefined,{numeric:true});
// Original workers remain the same objects with unchanged IDs, homes, jobs and savings.
// Synthetic household relations/ages are a constrained model, never actual Dubbo microdata.
export function createPopulation(homes,workers){
  const ordered=[...homes].sort(stable), count=Math.max(workers.length,Math.round(homes.length*ABS_DUBBO.householdSize));
  const counts=apportion(count,ABS_DUBBO.ageCounts);
  const ages=counts.flatMap((n,band)=>Array.from({length:n},(_,i)=>band*5+i%5)); // 85+ capped at 89, explicit modelling choice
  const takeAge=(min,max=89,seed=0)=>{const options=ages.map((a,i)=>({a,i})).filter(x=>x.a>=min&&x.a<=max);let i=options.length?options[seed%options.length].i:-1;if(i<0)i=ages.findIndex(a=>a>=min);if(i<0)throw new Error('Infeasible age constraints');return ages.splice(i,1)[0];};
  const households=ordered.map(home=>({coordinate:home.coordinate,home,members:workers.filter(v=>v.home.coordinate===home.coordinate),kind:'lone',familyType:null}));
  const residents=[...workers], additional=[];
  // Marriage years constrain adulthood; never make an established married worker a child.
  const priority=[...workers].sort((a,b)=>(a.job==='retired'?-100:0)-(b.job==='retired'?-100:0)||(a.marriageYear||9999)-(b.marriageYear||9999)||a.id-b.id);
  for(const v of priority){
    v.age=takeAge(v.job==='retired'?65:v.marriageYear?Math.max(25,2026-v.marriageYear+18):18,89,hash(v.populationId||v.name));
    v.lifeStage=lifeStage(v.age);v.populationId='worker:'+v.id;
  }
  let serial=0;
  const add=(h,age,relation='adult')=>{
    const n=serial++,name=FIRST[n%FIRST.length]+' '+LAST[Math.floor(n/FIRST.length)%LAST.length]+(n>=300?' '+(1+Math.floor(n/300)):'');
    const v={id:'resident:'+n,populationId:'resident:'+n,name,age,lifeStage:lifeStage(age),home:h.home,relation,
      x:h.home.door.x,z:h.home.door.z+2,inside:true,path:[],heading:0,activity:'at home',
      job:age<5?'preschool child':age<18?'school student':age>=65?'retired resident':'resident',
      maritalStatus:'never married',gender:null};
    h.members.push(v);residents.push(v);additional.push(v);return v;
  };
  const [familyTarget,loneTarget,groupTarget]=apportion(households.length,Object.values(ABS_DUBBO.householdCounts));
  const existingCouples=households.filter(h=>h.members.length===2&&h.members[0].spouseId===h.members[1].id);
  for(const h of existingCouples){h.kind='family';h.familyType='coupleWithoutChildren';}
  const singles=households.filter(h=>h.members.length===1);
  const empty=households.filter(h=>!h.members.length);
  // Preserve occupied homes. At full-town size this produces 128 family, 53 lone, 7 group homes.
  for(const h of singles.slice(loneTarget,loneTarget+groupTarget)){
    h.kind='group';add(h,takeAge(18),'housemate');
  }
  for(const h of singles.slice(loneTarget+groupTarget)){h.kind='family';h.familyType='oneParent';}
  const familyCounts=apportion(familyTarget,Object.values(ABS_DUBBO.familyCounts));
  let coupleNeed=Math.max(0,familyCounts[0]+familyCounts[1]-existingCouples.length);
  let otherNeed=familyCounts[3];
  for(const h of empty){
    h.kind='family';
    if(coupleNeed>0){h.familyType='coupleWithoutChildren';coupleNeed--;add(h,takeAge(25),'partner');add(h,takeAge(25),'partner');}
    else if(otherNeed>0){h.familyType='other';otherNeed--;add(h,takeAge(18),'relative');add(h,takeAge(18),'relative');}
    else {h.familyType='oneParent';add(h,takeAge(25,60),'parent');}
  }
  const couples=households.filter(h=>h.familyType==='coupleWithoutChildren');
  // Prefer younger families for dependent children. Existing spouse backstories remain intact.
  const childCouples=[...couples].sort((a,b)=>Math.min(...a.members.map(v=>v.age))-Math.min(...b.members.map(v=>v.age))||stable(a,b)).slice(0,familyCounts[1]);
  for(const h of childCouples)h.familyType='coupleWithChildren';
  const childHomes=households.filter(h=>['coupleWithChildren','oneParent'].includes(h.familyType));
  for(const h of childHomes)for(const v of h.members)v.relation='parent';
  const minors=ages.filter(a=>a<18).reverse();for(const age of minors){ages.splice(ages.indexOf(age),1);
    const eligible=childHomes.filter(h=>h.members.some(v=>v.relation==='parent'&&v.age>=age+18&&v.age<=age+50));
    const h=eligible.sort((a,b)=>a.members.filter(v=>v.relation==='child').length-b.members.filter(v=>v.relation==='child').length||Math.max(...a.members.filter(v=>v.relation==='parent').map(v=>v.age))-Math.max(...b.members.filter(v=>v.relation==='parent').map(v=>v.age))||stable(a,b))[0];
    if(!h)throw new Error('No age-compatible parent');add(h,age,'child');
  }
  for(const h of childHomes.filter(h=>!h.members.some(v=>v.relation==='child'))){
    const parent=h.members.find(v=>v.relation==='parent');
    const i=ages.findIndex(a=>a>=18&&a<=parent.age-18);
    if(i>=0){add(h,ages.splice(i,1)[0],'adult child');continue;}
    // No spare adult fits this young parent: move an age-compatible child from the fullest family.
    const donor=childHomes.filter(d=>d!==h&&d.members.filter(v=>v.relation==='child').length>1)
      .sort((a,b)=>b.members.filter(v=>v.relation==='child').length-a.members.filter(v=>v.relation==='child').length||stable(a,b))
      .find(d=>d.members.some(v=>v.relation==='child'&&v.age<=parent.age-18));
    if(!donor)throw new Error('No compatible adult child');
    const kid=donor.members.find(v=>v.relation==='child'&&v.age<=parent.age-18);
    donor.members.splice(donor.members.indexOf(kid),1);h.members.push(kid);
  }
  // Adult offspring/relatives complete exact age totals without moving established workers.
  while(ages.length){const age=ages.shift();const h=[...childHomes].sort((a,b)=>a.members.length-b.members.length||stable(a,b))[0]||households[0];
    const parent=h.members.find(v=>v.relation==='parent'&&v.age>=age+18);
    add(h,age,parent?'adult child':'relative');
  }
  const maleTarget=apportion(count,Object.values(ABS_DUBBO.sex))[0];
  let males=residents.filter(v=>v.gender==='male').length;
  for(const v of residents.filter(v=>!v.gender).sort((a,b)=>hash(a.populationId)-hash(b.populationId))){v.gender=males<maleTarget?'male':'female';if(v.gender==='male')males++;}
  for(const h of households){for(const v of h.members){v.householdOccupants=h.members.length;v.householdId=h.coordinate;}
    for(const v of h.members.filter(v=>v.age<18)){v.guardianIds=h.members.filter(p=>p.relation==='parent').map(p=>p.populationId);}
  }
  // Registered marital status is distinct from living together or having children.
  const maritalTargets=apportion(residents.filter(v=>v.age>=15).length,Object.values(ABS_DUBBO.maritalCounts15Plus));
  let married=residents.filter(v=>v.maritalStatus==='married').length;
  for(const h of couples.filter(h=>h.members.every(v=>typeof v.id==='string'))){
    const [a,b]=h.members;
    const formal=married+2<=maritalTargets[0];if(formal)married+=2;
    for(const [v,partner] of [[a,b],[b,a]]){v.partnerId=partner.populationId;v.partnerName=partner.name;v.maritalStatus=formal?'married':'never married';v.relationshipType=formal?'married':'de facto';}
  }
  for(const v of residents)if(v.maritalStatus==='single')v.maritalStatus='never married';
  for(const [status,min,target] of [['widowed',50,maritalTargets[3]],['divorced',30,maritalTargets[2]],['separated',25,maritalTargets[1]]]){
    const eligible=residents.filter(v=>v.age>=min&&v.maritalStatus==='never married'&&!v.partnerId)
      .sort((a,b)=>hash(a.populationId)-hash(b.populationId));
    for(const v of eligible.slice(0,target))v.maritalStatus=status;
  }
  const pop={version:1,baseline:ABS_DUBBO,households,residents,additional,ageTargets:counts};
  return pop;
}
export function populationReport(pop){
  if(!pop)return null;
  const r=pop.residents,ageCounts=ABS_DUBBO.ageCounts.map((_,i)=>r.filter(v=>Math.min(17,Math.floor(v.age/5))===i).length);
  return {population:r.length,workers:r.length-pop.additional.length,households:pop.households.length,
    under18:r.filter(v=>v.age<18).length,older:r.filter(v=>v.age>=65).length,
    male:r.filter(v=>v.gender==='male').length,female:r.filter(v=>v.gender==='female').length,
    medianAge:[...r].sort((a,b)=>a.age-b.age)[Math.floor(r.length/2)]?.age,
    ageCounts,householdCounts:Object.fromEntries(['family','lone','group'].map(k=>[k,pop.households.filter(h=>h.kind===k).length])),
    familyCounts:Object.fromEntries(Object.keys(ABS_DUBBO.familyCounts).map(k=>[k,pop.households.filter(h=>h.familyType===k).length]))};
}
// School attendance is a weekday timetable; holidays are not modelled yet.
export function residentSchedule(v,day,minute){
  if(minute<420||minute>=1200)return {at:'home',activity:'asleep at home',inside:true};
  if(v.age>=5&&v.age<18&&!isWeekend(day)&&minute>=450&&minute<900)return {at:'school',activity:'at school',inside:true};
  // Young children stay on their home plot; no unaccompanied road journeys.
  if(v.age<5)return {at:'home',activity:'at home with family',inside:true};
  const offset=Number(v.id.split(':')[1])%45;
  if(minute>=930+offset&&minute<1080+offset)return {at:'garden',activity:v.age<18?'playing near home':'outside at home',inside:false};
  return {at:'home',activity:v.age>=65?'relaxing at home':'at home',inside:true};
}
