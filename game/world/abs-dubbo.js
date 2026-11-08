// ABS 2021 Census QuickStats, Dubbo Urban Centre and Locality ONLY.
// Retrieved 27 October 2026. Counts are privacy-perturbed: normalise each table independently.
export const ABS_DUBBO = Object.freeze({
  year:2021, area:'UCL112006', name:'Dubbo Urban Centre and Locality',
  source:'https://www.abs.gov.au/census/find-census-data/quickstats/2021/UCL112006',
  population:38783, medianAge:35, privateDwellings:16221, families:9770,
  householdSize:2.5, childrenPerFamilyWithChildren:1.9,
  sex:{male:18604,female:20184},
  ageCounts:[2983,2759,2618,2184,2333,3357,3153,2623,2102,2057,2079,2052,2079,1744,1548,1237,975,896],
  householdCounts:{family:9525,lone:3970,group:523},
  familyCounts:{coupleWithoutChildren:3732,coupleWithChildren:3915,oneParent:1956,other:175},
  maritalCounts15Plus:{married:13084,separated:1110,divorced:2627,widowed:1851,neverMarried:11748},
  labourForce15Plus:{inLabourForce:19114,notInLabourForce:8695,notStated:2616},
  tenureCounts:{owned:3713,mortgage:4606,rented:5134,other:319,notStated:240},
  vehiclesCounts:{none:831,one:5205,two:5345,threePlus:2388,notStated:248},
  pets:null, computerUse:null, retirement:null,
});
// Largest remainder: exact total and less than one-person error per category.
export function apportion(total, weights) {
  if(!Number.isSafeInteger(total)||total<0||!weights.length||weights.some(x=>!Number.isFinite(x)||x<0))throw new Error('Invalid population allocation');
  const sum=weights.reduce((a,b)=>a+b,0);if(!sum)throw new Error('Empty population weights');
  const raw=weights.map(w=>w/sum*total), result=raw.map(Math.floor);
  const order=raw.map((v,i)=>({i,r:v-result[i]})).sort((a,b)=>b.r-a.r||a.i-b.i);
  const remaining=total-result.reduce((a,b)=>a+b,0);
  for(let n=0;n<remaining;n++)result[order[n].i]++;
  return result;
}
export function lifeStage(age){return age<5?'preschool':age<13?'child':age<18?'teenager':age<65?'adult':'older adult';}
