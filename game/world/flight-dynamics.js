// Deterministic, frame-rate-independent arcade flight model calibrated to a
// light training aeroplane. It is a GAME simulation, not certified flight software.
export const FLIGHT_TYPES=Object.freeze({
  trainer:Object.freeze({name:'High-wing flight trainer',maxSpeed:68,takeoffSpeed:28,stallSpeed:22,cruiseSpeed:47,acceleration:6.0,bankRate:1.35,rollRate:0.58}),
  sport:Object.freeze({name:'Low-wing sport aircraft',maxSpeed:86,takeoffSpeed:34,stallSpeed:27,cruiseSpeed:60,acceleration:8.0,bankRate:1.65,rollRate:0.69}),
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function initialFlight(id='trainer',position={x:-5818,z:-2175,headingDeg:121}) {
  if(!FLIGHT_TYPES[id])throw Error('Unknown aircraft type');
  return {id,x:position.x,z:position.z,altitude:0,heading:position.headingDeg*Math.PI/180,
    pitch:0,bank:0,airspeed:0,verticalSpeed:0,throttle:0,engine:true,onGround:true,
    landed:true,totalDistance:0,hardLandings:0};
}
export function advanceFlight(s,controls,seconds,runwayCheck=()=>true) {
  if(!s.engine)return s;
  const cfg=FLIGHT_TYPES[s.id],dt=clamp(seconds,0,0.15);
  const throttleInput=clamp(controls.throttle||0,-1,1),rollInput=clamp(controls.roll||0,-1,1),pitchInput=clamp(controls.pitch||0,-1,1);
  s.throttle=clamp(s.throttle+throttleInput*dt*0.48,0,1);
  const target=cfg.maxSpeed*s.throttle;
  const drag=s.onGround?2.9:1.1;
  s.airspeed=clamp(s.airspeed+clamp(target-s.airspeed,-drag*dt-cfg.acceleration*dt,cfg.acceleration*dt),0,cfg.maxSpeed);
  const bankTarget=rollInput*(s.onGround?0.05:0.58);
  s.bank+=(bankTarget-s.bank)*Math.min(1,dt*cfg.bankRate*3);
  const pitchTarget=pitchInput*(s.onGround?0.13:0.27);
  s.pitch+=(pitchTarget-s.pitch)*Math.min(1,dt*1.7);
  // Taxi turns at walking pace; airborne turns depend on bank and speed.
  const turn=s.onGround?rollInput*clamp(s.airspeed/10,0,1)*0.33:
    Math.sin(s.bank)*9.81/Math.max(s.airspeed,15)*cfg.rollRate;
  s.heading=(s.heading+turn*dt+Math.PI*2)%(Math.PI*2);
  const runway=runwayCheck(s.x,s.z);
  if(s.onGround && runway && s.airspeed>=cfg.takeoffSpeed && s.pitch>0.045){
    s.onGround=false;s.landed=false;s.verticalSpeed=1.3;
  }
  if(!s.onGround){
    const stall=s.airspeed<cfg.stallSpeed;
    // Flight path seeks the commanded pitch while excess speed provides lift.
    const targetVS=stall?-4.5:clamp(s.airspeed*Math.sin(s.pitch)*0.62+(s.airspeed-cfg.cruiseSpeed)*0.065,-9,9);
    s.verticalSpeed+=(targetVS-s.verticalSpeed)*Math.min(1,dt*(stall?1.9:1.2));
    s.altitude=Math.max(0,s.altitude+s.verticalSpeed*dt);
    if(s.altitude===0 && s.verticalSpeed<0) {
      if(s.verticalSpeed< -3.5)s.hardLandings++;
      s.onGround=true;s.landed=true;s.verticalSpeed=0;s.pitch=0;s.bank=0;
      s.airspeed=Math.min(s.airspeed,50);
    }
  }else{s.altitude=0;s.verticalSpeed=0;}
  const d=s.airspeed*dt;
  s.x+=Math.sin(s.heading)*d;s.z-=Math.cos(s.heading)*d;
  s.totalDistance+=d;
  return s;
}
