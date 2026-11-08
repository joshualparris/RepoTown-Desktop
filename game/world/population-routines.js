import {residentSchedule} from './population.js';
import {clearPedestrianSegment} from './pedestrian-progress.js';
import {pedestrianDetour} from './pedestrian-navigation.js';

// Additional residents are not employees: never pass them through wage/shop transaction code.
export function tickPopulation(life,minutes,route){
  for(const v of life.population?.additional||[]){
    const plan=residentSchedule(v,life.day,life.minute);
    if(v.destination!==plan.at){
      const slot=life.population.households.find(h=>h.coordinate===v.home.coordinate).members.indexOf(v);
      const home={x:v.home.door.x,z:v.home.door.z+2};
      const target=plan.at==='school'?life.place('school').front:plan.at==='garden'?{x:home.x+(slot%2?1:-1)*1.2,z:home.z+slot*.9}:home;
      v.destination=plan.at;v.target={...target};v.path=Math.hypot(v.x-target.x,v.z-target.z)<.1?[]:route(v,target);v.inside=false;
    }
    v.activity=v.path.length?(plan.at==='school'?'walking to school':'walking home'):plan.activity;
    let budget=Math.max(0,minutes)*3*(v.age>=75?1.0:v.age<13?1.15:1.4);
    while(budget>0&&v.path.length){
      const next=v.path[0],dx=next.x-v.x,dz=next.z-v.z,d=Math.hypot(dx,dz);
      if(d<.05){v.path.shift();continue;}
      const step=Math.min(d,budget,.5),to={x:v.x+dx/d*step,z:v.z+dz/d*step};
      if(life.railRoadBlocked(v,to,0,.45)){v.activity='waiting at railway crossing';break;}
      if(!clearPedestrianSegment(v,to,life.pedestrianWorld,.35)){
        // Retry at most once per simulated minute, not on every render frame.
        if(v.detourAt!==Math.floor(life.minute)){
          v.detourAt=Math.floor(life.minute);const detour=pedestrianDetour(v,next,[],life.pedestrianWorld);
          if(detour?.length)v.path.unshift(...detour);
        }
        break;
      }
      v.x=to.x;v.z=to.z;v.heading=Math.atan2(dx,dz);budget-=step;
      if(step>=d-.001)v.path.shift();
    }
    if(!v.path.length){v.inside=plan.inside;v.activity=plan.activity;}
  }
}
export function populationSnapshot(pop){return (pop?.additional||[]).map(v=>({id:v.id,x:v.x,z:v.z,heading:v.heading,inside:v.inside,path:v.path,destination:v.destination,target:v.target,activity:v.activity}));}
export function restorePopulation(pop,saved){
  const records=new Map((Array.isArray(saved)?saved:[]).map(v=>[v?.id,v]));
  for(const v of pop?.additional||[]){const s=records.get(v.id);if(!s||!Number.isFinite(s.x)||!Number.isFinite(s.z)||Math.abs(s.x)>1000||Math.abs(s.z)>1000||!Array.isArray(s.path)||s.path.length>200||s.path.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.abs(p.x)>1000||Math.abs(p.z)>1000))continue;
    Object.assign(v,{x:s.x,z:s.z,heading:Number.isFinite(s.heading)?s.heading:0,inside:!!s.inside,path:s.path.map(p=>({x:p.x,z:p.z})),destination:['home','garden','school'].includes(s.destination)?s.destination:undefined,target:s.target,activity:typeof s.activity==='string'?s.activity.slice(0,100):'at home'});
  }
}
