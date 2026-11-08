// Performance-bounded sun shadows for the large merged Three.js town.
// Shadow maps are centred near the player; only nearby geometry renders into
// the 256–2048px map. Huge distant grids, terrain and roads RECEIVE shadows
// but never cast them. Outdoor models can cast at geographically correct angles.
import * as THREE from 'three';
export const SHADOW_STORAGE_KEY = 'repository-town.sun-shadows.v1';
export const SHADOW_LEVELS = Object.freeze({
  off: {pixels:0,range:0,interval:Infinity},
  minimal: {pixels:256,range:48,interval:0.55},
  low: {pixels:512,range:68,interval:0.38},
  medium: {pixels:1024,range:105,interval:0.23},
  high: {pixels:2048,range:140,interval:0.13},
});
export const SHADOW_CHOICES = Object.freeze(['auto','off','low','medium','high']);
export function loadShadowChoice(storage) {
  try { const value=storage?.getItem(SHADOW_STORAGE_KEY); return SHADOW_CHOICES.includes(value)?value:'auto'; }
  catch { return 'auto'; }
}
export function shadowDefaultLevel(coarse) { return coarse?'low':'medium'; }

export function configureOutdoorShadows(town,narromine,masterplan=null,townLife=null) {
  let casters=0,receivers=0;
  const mark = (mesh,casts,receives) => {
    if (!mesh?.isMesh) return;
    mesh.castShadow=casts; mesh.receiveShadow=receives;
    casters+=Number(casts); receivers+=Number(receives);
  };
  town.ground.receiveShadow=true;receivers++;
  // Individual existing houses are already frustum culled, and their builders
  // include roof and tree geometry, so each is a cheap, locally bounded caster.
  for(const lot of town.lots.values())lot.mesh.traverse(o=>{if(o.isMesh)mark(o,true,true)});
  for(const door of town.doors)door.traverse(o=>{if(o.isMesh)mark(o,true,true)});
  // Flat local road, paving and green surfaces receive shadows without making
  // the enormous street mesh cast shadows from road paint or kerb tops.
  for(const o of town.group.children){
    if(o.isMesh && !o.castShadow)mark(o,false,true);
  }
  // All 195 new estate homes have individual local meshes, but the roads,
  // survey plots and lamp-pole batches must never be made gigantic casters.
  if(masterplan?.group)for(const child of masterplan.group.children){
    const house=child.isGroup&&child.name.includes(' · ');
    child.traverse(o=>{if(o.isMesh)mark(o,!!house,!o.material?.transparent)});
  }
  // The shops, pub, post office and municipal sites on original Street 8
  // are built separately from the original 208 homes.
  if(townLife?.life?.places)for(const place of townLife.life.places.values()){
    const parts=townLife.building(place.id);
    if(!parts.length)continue;
    parts[0]?.traverse(o=>{if(o.isMesh)mark(o,true,true)});
    for(const extra of parts.slice(1))extra.traverse(o=>{if(o.isMesh)mark(o,false,true)});
  }
  // Plot and roadside ground receivers only, never large landscape casters.
  town.outskirts?.group?.traverse(o=>{if(o.isMesh)mark(o,false,true)});
  // Narromine's mapped buildings, trees and roofs are tile-batched by colour,
  // so inspect *local geometry* (not world position -3km) and avoid caster
  // passes over flat roads and pavement. Shadow casting remains tile culled.
  narromine.group.traverse(o=>{
    if(!o.isMesh)return;
    if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
    const b=o.geometry.boundingBox;
    const raised=b.max.y>1.2 && b.max.y-b.min.y>0.6;
    mark(o,raised,true);
  });
  // Highway's enormous shared geometric strips MUST NOT cast, even when they
  // contain occasional roadside trees. Those few silhouettes remain unshadowed.
  for(const o of narromine.root.children)if(o.isMesh)mark(o,false,true);
  return {casters,receivers};
}

export function createSunShadows({renderer,scene,sun,storage,coarse=false,checkbox=null,select=null}) {
  if(!renderer?.shadowMap||!sun?.isDirectionalLight)throw new Error('Missing WebGL shadow map or directional sunlight');
  let preference=loadShadowChoice(storage),level='off';
  let elapsed=0,poor=0,good=0,autoReduced=false,changeCount=0;
  const target=sun.target;
  if(target.parent!==sun.parent) (sun.parent||scene).add(target);
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;
  sun.shadow.bias=-0.00017;
  sun.shadow.normalBias=0.035;
  sun.shadow.radius=1.9;
  sun.shadow.camera.near=1;
  sun.shadow.camera.far=340;
  // Avoid recompiling on every camera turn; only a Settings change can alter
  // shadow shader defines. Geometry and UVs are never rebuilt by the controller.
  const recompile=()=>scene.traverse(o=>{
    if(!o.isMesh||!o.material)return;
    for(const m of Array.isArray(o.material)?o.material:[o.material]) m.needsUpdate=true;
  });
  const choose=()=>preference==='auto'
    ? autoReduced?(coarse?'minimal':'low'):shadowDefaultLevel(coarse)
    :preference;
  const apply=()=>{
    const next=choose();
    if(next===level)return;
    const prevEnabled=renderer.shadowMap.enabled,conf=SHADOW_LEVELS[next];
    level=next;changeCount++;
    renderer.shadowMap.enabled=next!=='off';
    if(next!=='off'){
      const shadow=sun.shadow;
      if(shadow.mapSize.x!==conf.pixels||shadow.mapSize.y!==conf.pixels){
        shadow.map?.dispose(); shadow.map=null;
        shadow.mapSize.set(conf.pixels,conf.pixels);
      }
      shadow.camera.left=-conf.range;shadow.camera.right=conf.range;
      shadow.camera.top=conf.range;shadow.camera.bottom=-conf.range;
      shadow.camera.updateProjectionMatrix();
      renderer.shadowMap.needsUpdate=true;
    }
    if(prevEnabled!==renderer.shadowMap.enabled)recompile();
  };
  const setChoice=(choice)=>{
    if(!SHADOW_CHOICES.includes(choice))throw new RangeError('Unknown shadow setting');
    preference=choice;autoReduced=false;poor=0;good=0;
    try{storage?.setItem(SHADOW_STORAGE_KEY,choice)}catch{}
    apply();
    if(select)select.value=choice;
  };
  if(select){select.value=preference;select.addEventListener('change',()=>setChoice(select.value));}
  if(checkbox)checkbox.checked=preference!=='off';
  apply();
  return {
    setChoice,
    update({direction,elevation,eye,dt=0,weather='sunny',outside=true,frameSeconds=dt}){
      if(!direction||!eye)return;
      // The light's *position* and *target* move together, preserving the
      // exact solar azimuth/elevation when travelling several kilometres.
      const x=eye.x,z=eye.z;
      target.position.set(x,0,z);
      sun.position.set(x+direction.x*165, direction.y*165, z+direction.z*165);
      const lit=outside && elevation>0.4 && weather!=='night';
      sun.castShadow=level!=='off' && lit;
      if(!sun.castShadow)return;
      const frame=Math.min(0.2,Math.max(0,Number.isFinite(frameSeconds)?frameSeconds:0));
      if(preference==='auto' && frame>.001){
        if(frame>1/24){poor+=frame;good=0}
        else if(frame<1/48){good+=frame;poor=Math.max(0,poor-frame*.5)}
        else {poor=Math.max(0,poor-frame);good=0}
        if(!autoReduced&&poor>4.5){autoReduced=true;poor=0;apply()}
        else if(autoReduced&&good>20){autoReduced=false;good=0;apply()}
      }
      elapsed+=(Number.isFinite(dt)?Math.min(0.5,Math.max(0,dt)):0);
      if(elapsed>=SHADOW_LEVELS[level].interval || renderer.shadowMap.needsUpdate) {
        renderer.shadowMap.needsUpdate=true; elapsed=0;
      }
    },
    get state(){return {choice:preference,level,enabled:renderer.shadowMap.enabled,
      casting:sun.castShadow,pixels:SHADOW_LEVELS[level].pixels,range:SHADOW_LEVELS[level].range,
      autoReduced,changes:changeCount};},
  };
}
