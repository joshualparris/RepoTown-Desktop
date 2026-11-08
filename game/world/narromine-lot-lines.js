// Optional single-draw-call cadastral QA overlay. No solids or colliders.
// It is built ONLY when ?lots=1, so regular visits allocate no extra geometry.
import * as THREE from 'three';
import {narromineLots,clipSegmentToRect} from './narromine-lots.js';
import {toWorld,REGION} from './narromine-layout.js';
export const LOT_LINE_Y=.12;
export const lotLinesRequested=()=>typeof location!=='undefined'&&new URLSearchParams(location.search).get('lots')==='1';
export function buildNarromineLotLines(parent,{visible=lotLinesRequested()}={}){
  if(!visible)return {lines:null,lotCount:0,segmentCount:0,enabled:false};
  const lots=narromineLots(),pos=[];
  for(const {pts} of lots)for(let i=0;i<pts.length;i++){
    const [ax,az]=toWorld(pts[i]),[bx,bz]=toWorld(pts[(i+1)%pts.length]);
    const c=clipSegmentToRect(ax,az,bx,bz,REGION);
    if(c)pos.push(c[0],LOT_LINE_Y,c[1],c[2],LOT_LINE_Y,c[3]);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  const lines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xffd23f}));
  lines.name='Narromine cadastral lot boundaries (NSW Spatial Services, debug ?lots=1)';
  lines.frustumCulled=false;
  parent.add(lines);
  return {lines,lotCount:lots.length,segmentCount:pos.length/6,enabled:true};
}
