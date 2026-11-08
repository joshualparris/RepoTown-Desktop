import * as THREE from 'three';
import { pilotNetwork, pilotReport, pilotIsEnabled } from './electrical-pilot.js';

// The physical line routing follows the RTU-[address redacted] geometry.
// Below-ground MV/LV routes are X-RAY inspection drawings, never floating
// overhead 22 kV conductors or an assertion of surveyed pole locations.
export function createElectricalPilotVisuals(townGroup,life){
  const N=pilotNetwork();
  const overlay=new THREE.Group(), permanent=new THREE.Group();
  overlay.name='RTU electricity underground x-ray overlay';
  permanent.name='RTU pole and service pilot';
  townGroup.add(overlay,permanent);
  const lineMats=new Map(),litMeters=[],serviceIds=new Set();
  const mkLine=(route,color,y,opacity=0.78,sag=0)=>{
    const vertices=[];
    for(const p of route)vertices.push(p.x,y,p.z);
    let pts=route.map(p=>new THREE.Vector3(p.x,y,p.z));
    // Overhead service cables hang in a gentle catenary between pole and house, not a ruler line.
    if(sag>0&&pts.length>=2){const a=pts[0],b=pts[pts.length-1];pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(new THREE.Vector3(a.x+(b.x-a.x)*t,y-sag*4*t*(1-t),a.z+(b.z-a.z)*t));}}
    const geometry=new THREE.BufferGeometry().setFromPoints(pts);
    const mat=new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity,depthTest:true});
    return {mesh:new THREE.Line(geometry,mat),material:mat};
  };
  const poleGeometry=new THREE.CylinderGeometry(0.085,0.11,4.6,6);
  const poleMat=new THREE.MeshLambertMaterial({color:0x7b7366});
  const seenPoles=new Set();
  const box=(at,w,h,d,color,group)=>{
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));
    o.position.set(at.x,h/2,at.z);group.add(o);return o;
  };
  for(const e of N.edges){
    if(e.type==='external_not_georeferenced'||e.type==='voltage_conversion')continue;
    const service=e.type==='service_drop',isMv=e.voltageKv>=22;
    const height=service?3.9:isMv?0.27:0.31;
    const {mesh,material}=mkLine(e.route,service?0x1c1c1c:isMv?0xffbe38:0x56c5ed,height,service?1:0.92,service?0.35:0);
    mesh.userData.edgeId=e.id;lineMats.set(e.id,material);if(service)serviceIds.add(e.id);
    (service?permanent:overlay).add(mesh);
    if(service && e.route.length){
      const a=e.route[0],key=a.x+':'+a.z;
      if(!seenPoles.has(key)){
        seenPoles.add(key);
        const pole=new THREE.Mesh(poleGeometry,poleMat);
        pole.position.set(a.x,2.3,a.z);permanent.add(pole);
        box({x:a.x,z:a.z},0.23,0.13,0.35,0x5a6065,permanent).position.y=4.55;
      }
    }
  }
  for(const t of N.transformers){
    box(t.position,1.2,1.45,0.8,0x898d7a,overlay);
    const n=box({x:t.position.x,z:t.position.z-0.43},0.75,0.26,0.05,0xd7b94b,overlay);
    n.position.y=1.16;
  }
  for(const s of N.sites){
    const p=s.meterPosition;if(!p)continue;
    const mark=box({x:p.x,z:p.z},0.38,0.58,0.18,0xd4d8d1,overlay);
    mark.position.y=1.68;
    mark.userData.propertyId=s.id;litMeters.push(mark);
  }
  let previousKey='';
  function update(){
    if(!pilotIsEnabled(life)){overlay.visible=false;permanent.visible=false;return;}
    const state=life.civic.electricalPilot,report=pilotReport(life);
    overlay.visible=state.overlay;permanent.visible=true;
    const key=state.faults.join('|')+'|'+state.overlay+'|'+Math.floor(life.minute/10);
    if(key===previousKey)return;previousKey=key;
    const failed=new Set(state.faults);
    for(const [id,mat] of lineMats){
      const dead=failed.has(id);
      // Outside the wiring view a healthy service drop is just a black cable.
      if(serviceIds.has(id)&&!state.overlay&&!dead){mat.color.setHex(0x1c1c1c);mat.opacity=1;continue;}
      mat.color.setHex(dead?0xdf4b4b:id.startsWith('MV-')?0xffbe38:0x69cce9);
      mat.opacity=dead?1:0.8;
    }
    for(const m of litMeters){
      const s=report.siteById[m.userData.propertyId];
      m.material.color.setHex(s?.mains?0xa8d8ac:s?.backup?0xf6e0a1:0xb86666);
    }
  }
  return {overlay,permanent,update,dispose(){
    for(const group of [overlay,permanent]){
      group.traverse(o=>{o.geometry?.dispose();if(o.material&&o.material!==poleMat)o.material.dispose();});
      townGroup.remove(group);
    }
    poleGeometry.dispose();poleMat.dispose();
  }};
}

// Many house interiors currently have global non-electrical ambient light.
// Give targeted pilot interiors a genuine per-service light circuit.
export function attachPilotInteriorLighting(group,propertyId){
  if(!group||!pilotNetwork().siteIds.includes(propertyId))return;
  const lighting=[];
  group.traverse(o=>{if(o.isLight)lighting.push([o,o.intensity]);});
  const prior=group.userData.updateLighting;
  group.userData.lightingSite=propertyId;
  group.userData.updateLighting=on=>{
    if(prior)prior(on);
    for(const [o,intensity] of lighting)o.intensity=on?intensity:0;
  };
}
