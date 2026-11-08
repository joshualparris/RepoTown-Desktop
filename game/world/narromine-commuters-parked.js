// Off-carriageway commuter parking for Narromine residents working in Repository Town.
// Cars remain linked to their own worker, model and roster. Only geometrically clear,
// separate modelled parking pockets between civic lots may host a car. The road
// carriageway, footpath, cross avenues and shop door fronts are never fallback bays.
// Fictional town design; these are not verified real-world parking authorisations.
import {loadVehicleModels,VEHICLE_MODELS} from './narromine-vehicle-models.js';
import {dayPlan} from './narromine-population.js';
import {AVENUES} from './life.js';
import {vehicleFootprintsOverlap} from './vehicle-occupancy.js';

const LOT_M=26, TOWN_EDGE=335, HALF_WIDTH=0.95;
// Town kerb is ±1.[address redacted] centre; the footpath is around ±5.3 m.
// The nearest vehicle bumper is >=7.[address redacted] centre, beyond the footpath.
export const PARKING_NEAR_BUMPER_M=7.8;
const GAPS=[9.0,11.5,14.0,16.5];
const LOT_SHIFTS=[0,-1,1,-2,2];

export function createRepoTownCommuterParking(parent,pop,life,{models=typeof document!=='undefined',parkingClear=()=>true,activity}={}){
  const commuters=pop.people.filter(p=>p.repoTownJob&&p.car);
  let real=null,parked=[];
  if(models)loadVehicleModels(parent,{max:Math.max(64,commuters.length)})
    .then(r=>{real=r;real.draw(parked);})
    .catch(e=>console.warn('Repository Town commuter vehicle models unavailable',e));

  function update(weekday,minute){
    const out=[];
    for(const person of commuters){
      if(out.length >= (activity?.limits.parkedCars ?? Infinity)) break;
      if(activity && !activity.admits(person.car)) continue;
      const household=pop.households[+person.household.slice(3)];
      const step=dayPlan(person,household,weekday,pop.workplaces)
        .find(s=>minute>=s.from&&minute<s.to);
      if(step?.kind!=='work')continue;
      const place=life.places.get(person.repoTownJob.id);
      const car=pop.cars[+person.car.slice(4)];
      if(!place?.curb||!car)continue;
      const L=car.length??VEHICLE_MODELS[car.model??0].length;
      const side=place.side==='north'||place.side==='south'?1:-1;
      const roadZ=place.curb.z-side*1.7;
      const z=roadZ+side*(PARKING_NEAR_BUMPER_M+L/2);
      const yaw=side>0?Math.PI:0; // perpendicular bays, noses toward the adjacent road
      let chosen=null;
      for(const lotShift of LOT_SHIFTS){
        if(chosen)break;
        for(const flank of [-1,1]){
          if(chosen)break;
          for(const gap of GAPS){
            const x=place.curb.x+lotShift*LOT_M+flank*gap;
            if(Math.abs(x)+HALF_WIDTH>TOWN_EDGE)continue;
            // Cross avenues run north-south; keep body + sight line out of them.
            if(AVENUES.some(avenue=>Math.abs(x-avenue)<3.5+HALF_WIDTH+1.5))continue;
            const candidate={x,z,yaw,model:car.model,colour:car.colour,L,widthM:HALF_WIDTH*2,
              owner:person.name,place:person.repoTownJob.name,carId:car.id,parked:true};
            if(out.some(other=>vehicleFootprintsOverlap(candidate,other,0.6)))continue;
            // The actual game's static world validates furniture, doors, fences
            // and buildings; no road or sidewalk fallback if every bay is blocked.
            if(!parkingClear(candidate))continue;
            chosen=candidate;break;
          }
        }
      }
      if(chosen)out.push(chosen);
    }
    parked=out;
    real?.draw(parked);
    return parked;
  }
  const colliders=player=>parked.filter(c=>Math.hypot(c.x-player.x,c.z-player.z)<60)
    .map(c=>({x0:c.x-HALF_WIDTH,x1:c.x+HALF_WIDTH,z0:c.z-c.L/2,z1:c.z+c.L/2,traffic:true}));
  return {update,colliders,get parked(){return parked;}};
}
