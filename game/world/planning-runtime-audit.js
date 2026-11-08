import * as THREE from 'three';
// Read-only actual rendered geometry. Conservative AABBs include roofs/awnings.
export function runtimePlanningAudit(town,townLife){
 const bounds=objects=>{const box=new THREE.Box3();for(const o of objects){o.updateWorldMatrix(true,true);box.union(new THREE.Box3().setFromObject(o));}return box.isEmpty()?null:{x0:box.min.x,x1:box.max.x,z0:box.min.z,z1:box.max.z,y0:box.min.y,y1:box.max.y};};
 return {units:'fictional metres; conservative visual AABBs, not surveyed walls',buildings:[
 ...[...town.lots.values()].map(l=>({id:'H:'+l.house.coordinate,extent:bounds([l.mesh]),door:{x:l.doorPos.x,z:l.doorPos.z}})),
 ...[...townLife.life.places.values()].map(p=>({id:'B:'+p.id,extent:bounds(townLife.building(p.id)),door:p.door,field:p.field||null}))],colliders:[...town.colliders,...townLife.colliders]};
}
