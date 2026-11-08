import * as THREE from 'three';
import {AERODROME,aircraftParking,runwayEnd,runwayVector,isRunway} from './narromine-airfield-data.js';
import {FLIGHT_TYPES,initialFlight,advanceFlight} from './flight-dynamics.js';

// Accessible light-aircraft game flying: full third-person chase and cockpit
// cameras, taxi/takeoff/stall/descent/landing, and two independently boardable
// aircraft. Numbers are plausible but not a certified flight simulator.
export function createPlayerFlight({parent,player,camera,input,touch=false}) {
  const models=new Map(),parking=aircraftParking();
  let active=null,view=0,notice='';
  const control={roll:0,pitch:0,throttle:0};
  const mats={
    white:new THREE.MeshLambertMaterial({color:0xf2f2ee}),
    blue:new THREE.MeshLambertMaterial({color:0x165c98}),
    red:new THREE.MeshLambertMaterial({color:0xb32d32}),
    grey:new THREE.MeshLambertMaterial({color:0x525f66}),
    black:new THREE.MeshLambertMaterial({color:0x22272c}),
    glass:new THREE.MeshPhongMaterial({color:0x3d667e,shininess:65,transparent:true,opacity:0.83,side:THREE.DoubleSide}),
    steel:new THREE.MeshLambertMaterial({color:0xbbbfc5}),
  };
  function box(parent0,mat,w,h,d,x,y,z){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;parent0.add(m);return m;
  }
  function cylinder(parent0,mat,r0,r1,len,x,y,z,rotZ=Math.PI/2){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,len,12),mat);
    m.rotation.z=rotZ;m.position.set(x,y,z);m.castShadow=true;parent0.add(m);return m;
  }
  function makeModel(id){
    const root=new THREE.Group();root.name='Pilotable '+FLIGHT_TYPES[id].name;
    const body=new THREE.Group();root.add(body);
    const accent=id==='sport'?mats.red:mats.blue;
    // Fuselage longitudinal axis -Z: nose forward, tail at +Z.
    const shell=new THREE.Mesh(new THREE.CylinderGeometry(0.63,0.48,6.7,12),mats.white);
    shell.rotation.x=Math.PI/2;shell.position.set(0,0,0.15);body.add(shell);shell.castShadow=true;
    const nose=new THREE.Mesh(new THREE.ConeGeometry(0.55,1.35,12),accent);
    nose.rotation.x=-Math.PI/2;nose.position.set(0,0,-3.75);body.add(nose);nose.castShadow=true;
    box(body,accent,0.12,0.10,4.8,0,-0.27,-0.05);
    const high=id==='trainer',wingY=high?0.8:0.03;
    const wing=box(body,mats.white,high?10.7:8.2,0.18,1.6,0,wingY,-0.45);
    box(body,accent,high?10.2:7.7,0.035,0.31,0,wingY+0.105,-0.92);
    // Cockpit canopy and actual visible pilot seat/console for the cockpit view.
    const canopy=box(body,mats.glass,1.15,0.78,1.55,0,0.54,-1.25);
    box(body,mats.grey,0.72,0.18,0.35,0,0.06,-1.6);
    box(body,mats.black,0.55,0.12,0.35,0,-0.06,-1.55);
    box(body,mats.grey,3.7,0.12,0.78,0,0.08,2.72);
    box(body,accent,0.19,1.18,0.75,0,0.54,3.04);
    if(high)for(const side of [-1,1]){
      const strut=box(body,mats.grey,0.095,1.75,0.09,side*2.7,-0.04,-0.25);
      strut.rotation.z=side*0.27;
    }
    const prop=new THREE.Group();prop.position.set(0,0,-4.45);body.add(prop);
    box(prop,mats.black,0.21,2.55,0.10,0,0,0);
    const hub=new THREE.Mesh(new THREE.SphereGeometry(0.24,10,8),mats.steel);prop.add(hub);
    // Fixed landing gear (game logic checks grounding, not wheel suspension).
    for(const side of [-1,1]){
      box(body,mats.grey,0.09,1.10,0.09,side*1.15,-0.63,0.32);
      const wheel=new THREE.Mesh(new THREE.TorusGeometry(0.29,0.13,8,12),mats.black);
      wheel.rotation.y=Math.PI/2;wheel.position.set(side*1.15,-1.25,0.35);body.add(wheel);
    }
    const noseWheel=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.105,8,12),mats.black);
    noseWheel.rotation.y=Math.PI/2;noseWheel.position.set(0,-1.26,-2.35);body.add(noseWheel);
    // Wingtip navigation lights, not operational lighting guidance.
    for(const side of [-1,1]){
      const light=new THREE.Mesh(new THREE.SphereGeometry(0.095,8,6),
        new THREE.MeshBasicMaterial({color:side<0?0xff4e42:0x4bd878}));
      light.position.set(side*(high?5.38:4.12),wingY, -0.4);body.add(light);
    }
    return {root,body,prop,canopy};
  }
  for(const p of parking){
    const rig=makeModel(p.id),s=initialFlight(p.id,p);
    rig.root.position.set(s.x,1.57,s.z);rig.root.rotation.y=-s.heading;
    parent.add(rig.root);
    models.set(p.id,{...rig,s});
  }

  // On phones the controls are held by pointer, not toggled. Buttons are
  // hidden while walking; they never alter the walking joystick.
  const panel=document.createElement('section');
  panel.id='narromine-flight-hud';panel.hidden=true;
  panel.setAttribute('aria-label','Aircraft flight instruments and controls');
  panel.style.cssText='position:fixed;right:8px;top:96px;z-index:48;max-width:min(330px,60vw);background:rgba(12,30,43,.90);color:#fff;border:1px solid #92acba;border-radius:12px;padding:9px;font:12px/1.45 system-ui;box-shadow:0 3px 14px #0005;pointer-events:auto';
  const instruments=document.createElement('div');instruments.id='flight-instruments';instruments.setAttribute('role','status');instruments.setAttribute('aria-live','off');
  instruments.style.cssText='font-variant-numeric:tabular-nums;white-space:pre-line;margin-bottom:7px';
  panel.append(instruments);
  const buttonRow=document.createElement('div');
  buttonRow.style.cssText='display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end';
  const buttons=[];
  function button(label,fn){
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.style.cssText='color:#fff;border:1px solid #728a9c;background:#25455b;border-radius:7px;padding:7px;min-height:34px;cursor:pointer';
    b.addEventListener('click',()=>{notice=fn();b.blur();});buttonRow.append(b);buttons.push(b);return b;
  }
  button('🎥 View',()=>cycleView());
  const lineupButton=button('↗ Line up 11',()=>lineUp());
  button('🚶 Exit',()=>exit());
  panel.append(buttonRow);
  const mobileControls=document.createElement('div');
  mobileControls.style.cssText='display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px;margin-top:7px';
  if(touch){
    for(const [label,axis,value] of [
      ['Throttle +','throttle',1],['Throttle −','throttle',-1],
      ['◀ Bank','roll',-1],['Bank ▶','roll',1],
      ['↑ Nose','pitch',1],['↓ Nose','pitch',-1]]) {
      const b=document.createElement('button');b.type='button';b.textContent=label;
      b.style.cssText='background:#25455b;color:white;border:1px solid #718ca0;border-radius:6px;min-height:42px;padding:7px;touch-action:none;user-select:none';
      const down=e=>{e.preventDefault();control[axis]=value;b.setPointerCapture?.(e.pointerId);};
      const up=e=>{e.preventDefault();if(control[axis]===value)control[axis]=0;};
      b.addEventListener('pointerdown',down);
      for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,up);
      mobileControls.append(b);
    }
    panel.append(mobileControls);
  }
  document.body.append(panel);
  function nearest(p=player.pos){
    if(active)return null;
    let best=null,bestD=5.2;
    for(const parked of parking){
      const s=models.get(parked.id).s,d=Math.hypot(p.x-s.x,p.z-s.z);
      if(d<bestD){bestD=d;best=parked.id;}
    }
    return best;
  }
  function board(id=nearest()){
    if(active)return 'Already in an aircraft.';
    const rig=models.get(id);
    if(!rig)return 'Walk to a parked aircraft at Narromine Aerodrome.';
    active=id;view=0;panel.hidden=false;
    input.reset();
    return 'Engine running · '+FLIGHT_TYPES[id].name+'. W/S throttle; A/D steer/bank; ↑/↓ pitch; V cockpit/chase; R line up runway 11. E exits only when stopped.';
  }
  function exit(){
    if(!active)return 'Not piloting an aircraft.';
    const s=models.get(active).s;
    if(!s.onGround||s.airspeed>2.0)return 'Land and stop the aircraft before leaving the cockpit.';
    const x=s.x+Math.cos(s.heading)*4.3,z=s.z+Math.sin(s.heading)*4.3;
    active=null;panel.hidden=true;input.reset();
    player.place(x,z,-s.heading);
    return 'Exited the aircraft. The aeroplane remains parked where you stopped.';
  }
  function lineUp(){
    if(!active)return 'Board an aircraft first.';
    const s=models.get(active).s;
    if(!s.onGround)return 'Land before using assisted runway line-up.';
    const r=AERODROME.runways[0],end=runwayEnd(r,true),v=runwayVector(r);
    s.x=end.x+v.x*72;s.z=end.z+v.z*72;s.heading=r.headingDeg*Math.PI/180;
    s.throttle=0;s.airspeed=0;s.pitch=0;s.bank=0;s.verticalSpeed=0;
    control.throttle=0;control.pitch=0;control.roll=0;
    // This is an explicit game assist, not physical taxiing: a player who
    // accelerated off-runway can always recover without a long ground roll.
    return 'Assisted game line-up: runway 11 (speed reset). Hold Throttle +, then hold ↑ Nose above 100 km/h.';
  }
  function cycleView(){view=(view+1)%2;return view===1?'Cockpit view.':'Chase camera.';}
  function poseCamera(s){
    const sn=Math.sin(s.heading),cs=Math.cos(s.heading),eye=s.altitude+2.7;
    if(view===1){
      camera.position.set(s.x+sn*1.35,eye,s.z-cs*1.35);
      camera.rotation.set(s.pitch,-s.heading,-s.bank*0.32,'YXZ');
    }else{
      camera.position.set(s.x-sn*19,s.altitude+11.5,s.z+cs*19);
      camera.lookAt(s.x+sn*52,s.altitude+3.2+s.pitch*25,s.z-cs*52);
    }
  }
  function update(dt){
    // Aircraft stay parked and visible when not active.
    if(!active)return false;
    const s=models.get(active).s;
    const keys=input.keys;
    const axes={
      throttle:Math.max(-1,Math.min(1,(keys.has('w')?1:0)-(keys.has('s')?1:0)+control.throttle)),
      roll:Math.max(-1,Math.min(1,(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+control.roll)),
      pitch:Math.max(-1,Math.min(1,(keys.has('arrowup')?1:0)-(keys.has('arrowdown')?1:0)+control.pitch)),
    };
    if(keys.has('r')&&!lastR){notice=lineUp();}
    lastR=keys.has('r');
    const wasGround=s.onGround;
    advanceFlight(s,axes,dt,isRunway);
    if(wasGround&&!s.onGround)notice='Airborne! Fly towards Repository Town to the east. Reduce throttle and descend to land.';
    const rig=models.get(active);
    rig.prop.rotation.z+=dt*(s.throttle*36+15);
    rig.body.rotation.set(s.pitch,0,-s.bank,'YXZ');
    rig.root.position.set(s.x,s.altitude+1.57,s.z);
    rig.root.rotation.y=-s.heading;
    player.pos.set(s.x,0,s.z);player.yaw=-s.heading;player.pitch=0;
    input.takeLook();input.takeTaps();
    poseCamera(s);
    // A moving taxi aircraft can still be relocated to the runway by an
    // explicit user press. Disable only in flight, never trap phone players.
    lineupButton.disabled=!s.onGround;
    instruments.textContent=FLIGHT_TYPES[s.id].name+' · YNRM\n'+
      'Speed '+Math.round(s.airspeed*3.6)+' km/h · AGL '+Math.round(s.altitude*3.28084)+' ft\n'+
      'Heading '+String(Math.round(s.heading*180/Math.PI)%360).padStart(3,'0')+'° · Power '+Math.round(s.throttle*100)+'%\n'+
      (s.onGround?'GROUND / TAXI':'AIRBORNE')+
      (s.onGround&&!isRunway(s.x,s.z)?'\nOFF RUNWAY · Tap ↗ Line up 11 to reset before take-off.':'')+
      (s.onGround&&isRunway(s.x,s.z)&&s.airspeed>=FLIGHT_TYPES[s.id].takeoffSpeed?'\nHold ↑ Nose to lift off.':'')+
      (notice?'\n'+notice:'');
    return true;
  }
  let lastR=false;
  function state(){
    const s=active?models.get(active).s:null;
    return {flying:!!active,aircraft:active,view,controls:{...control},runways:AERODROME.runways.map(r=>({id:r.id,length:r.length,width:r.width})),
      state:s?{...s}:null,parking:parking.map(p=>({id:p.id,name:p.name,x:models.get(p.id).s.x,z:models.get(p.id).s.z}))};
  }
  return {near:nearest,board,exit,lineUp,cycleView,update,state,
    get flying(){return !!active;},get message(){return notice;},clearMessage(){notice='';}};
}
