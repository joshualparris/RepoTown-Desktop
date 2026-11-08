import * as THREE from 'three';
import {AERODROME,runwayVector,aircraftParking} from './narromine-airfield-data.js';

// Airfield drawables are deliberately separate from the existing photo-matched
// museum/apron meshes. Source-grounded lengths and bearings, approximate
// placement and ground treatment; never advertise these as survey geometry.
export function buildNarromineAirfield(parent) {
  const group=new THREE.Group();group.name='YNRM sealed runways, gliding strips and taxiway';
  parent.add(group);
  const surfaces={
    asphalt:new THREE.MeshLambertMaterial({color:0x383b3e,polygonOffset:true,polygonOffsetFactor:-1}),
    concrete:new THREE.MeshLambertMaterial({color:0x656b6d,polygonOffset:true,polygonOffsetFactor:-2}),
    grass:new THREE.MeshLambertMaterial({color:0x9eaa65,polygonOffset:true,polygonOffsetFactor:-1}),
    white:new THREE.MeshBasicMaterial({color:0xf3f2e5,depthWrite:false}),
    yellow:new THREE.MeshBasicMaterial({color:0xeac84a,depthWrite:false}),
    glider:new THREE.MeshBasicMaterial({color:0xed9a31,depthWrite:false}),
  };
  const h=(deg)=>deg*Math.PI/180;
  function slab(x,z,w,l,headingDeg,mat,y=0.085) {
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,0.035,l),mat);
    m.rotation.y=-h(headingDeg);m.position.set(x,y,z);m.receiveShadow=true;group.add(m);return m;
  }
  function mark(x,z,w,l,headingDeg,mat,y=0.13) {
    return slab(x,z,w,l,headingDeg,mat,y);
  }
  function segment(a,b,width,mat,y=0.095) {
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
    if(len<0.1)return;
    const m=new THREE.Mesh(new THREE.BoxGeometry(width,0.04,len),mat);
    m.rotation.y=-Math.atan2(dx,-dz);m.position.set((a.x+b.x)/2,y,(a.z+b.z)/2);group.add(m);
  }
  function runwayText(str,x,z,headingDeg) {
    // Geometry tests construct Narromine in Node without a DOM or canvas.
    // Pavement text is a browser-only label, never a precondition for terrain.
    if(typeof document==='undefined') return;
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,256,320);ctx.fillStyle='#ffffff';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 220px Arial, sans-serif';
    ctx.fillText(str,128,160);
    const texture=new THREE.CanvasTexture(canvas);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(12,14),
      new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    m.rotation.set(-Math.PI/2,-h(headingDeg),0,'YXZ');
    m.position.set(x,0.155,z);group.add(m);
  }
  function paintRunway(r) {
    const v=runwayVector(r);
    slab(r.x,r.z,r.width,r.length,r.headingDeg,surfaces.asphalt);
    for(let offset=-r.length/2+56;offset<r.length/2-55;offset+=60)
      mark(r.x+v.x*offset,r.z+v.z*offset,0.55,30,r.headingDeg,surfaces.white,0.124);
    for(const sign of [-1,1]){
      // Aiming/threshold bars at both ends: 8 evenly spaced white strips.
      const displaced=sign<0?(r.displacedStartM||0):(r.displacedEndM||0);
      const base=(sign<0?-r.length/2+12:r.length/2-12)+(sign<0?displaced:-displaced);
      for(let k=-3.5;k<=3.5;k++){
        const px=r.x+v.x*base+(-v.z)*k*3.15;
        const pz=r.z+v.z*base+v.x*k*3.15;
        mark(px,pz,1.65,24,r.headingDeg,surfaces.white,0.145);
      }
      const t=(sign<0?-r.length/2+75:r.length/2-75)+(sign<0?displaced:-displaced);
      const label=r.id.split('/')[sign<0?0:1];
      runwayText(label,r.x+v.x*t,r.z+v.z*t,sign<0?r.headingDeg:r.headingDeg+180);
    }
    // Paired edge markers: exactly one mesh per position, avoiding z-fighting.
    for(let d=35;d<r.length-35;d+=60) {
      const along=-r.length/2+d;
      for(const side of [-1,1]) {
        const off=side*(r.width/2-0.5);
        mark(r.x+v.x*along-v.z*off,r.z+v.z*along+v.x*off,0.19,1.5,r.headingDeg,surfaces.white,0.138);
      }
    }
  }
  // Gliding strips have orange gable markers in the real ERSA; geometry is an
  // interpretive location until georeferenced aerodrome control points are obtained.
  for(const r of AERODROME.grassStrips) {
    slab(r.x,r.z,r.width,r.length,r.headingDeg,surfaces.grass,0.062);
    const v=runwayVector(r);
    for(let d=-r.length/2+25;d<r.length/2-25;d+=80)for(const side of [-1,1]){
      const off=side*(r.width/2-2);
      mark(r.x+v.x*d-v.z*off,r.z+v.z*d+v.x*off,0.7,3.4,r.headingDeg,surfaces.glider,0.125);
    }
  }
  for(const r of AERODROME.runways)paintRunway(r);
  // Apron model continues south-west of the separately verified museum
  // complex; avoid covering its hangars/exhibit features.
  slab(-5818,-2200,155,92,0,surfaces.concrete,0.074);
  const taxi=[
    {x:-5818,z:-2217},{x:-5772,z:-2295},{x:-5745,z:-2370}
  ];
  for(let i=1;i<taxi.length;i++){
    segment(taxi[i-1],taxi[i],13,surfaces.asphalt,0.105);
    segment(taxi[i-1],taxi[i],0.23,surfaces.yellow,0.141);
  }
  for(const park of aircraftParking()){
    mark(park.x,park.z,0.3,22,park.headingDeg,surfaces.yellow,0.14);
  }
  // Apron taxi/parking markings; the pilots' access gate remains pedestrian-
  // reachable and existing museum doors remain unchanged.
  for(let x=-5870;x<=-5750;x+=20)mark(x,-2215,0.18,7,0,surfaces.yellow,0.13);
  return {group,runways:AERODROME.runways,parking:aircraftParking(),
    stats:{sealedRunways:2,grassStrips:3,fullScaledLengths:true,positionSurveyVerified:false}};
}
