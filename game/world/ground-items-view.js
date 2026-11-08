import * as THREE from 'three';
import { ITEM_TYPES } from './inventory.js';
// Reconciles the saved world objects; meshes never own game state.
export function createGroundItemsView() {
  const meshes = new Map();
  const geometry = new THREE.CylinderGeometry(.05,.06,.3,10);
  const material = new THREE.MeshLambertMaterial({color:0xd9a400});
  function update(items, location, parent) {
    const live = new Set(items.map(i=>i.id));
    for (const [id,mesh] of meshes) if (!live.has(id)) {mesh.removeFromParent();meshes.delete(id);}
    const spots=[];
    for (const item of items) {
      if (!ITEM_TYPES[item.type] || item.location!==location) {const mesh=meshes.get(item.id);if(mesh)mesh.visible=false;continue;}
      let mesh=meshes.get(item.id);
      if (!mesh) {mesh=new THREE.Mesh(geometry,material);mesh.rotation.z=Math.PI/2;meshes.set(item.id,mesh);}
      if (mesh.parent!==parent) parent.add(mesh);
      mesh.position.set(item.x,item.y+.06,item.z);mesh.visible=true;
      spots.push({key:'item:'+item.id,itemId:item.id,pos:new THREE.Vector3(item.x,item.y,item.z),label:'Pick up the '+ITEM_TYPES[item.type].name.toLowerCase()});
    }
    return spots;
  }
  return {update};
}
