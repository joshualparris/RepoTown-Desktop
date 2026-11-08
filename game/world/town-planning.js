// Conceptual peri-urban structure plan for Repository Town.
// These are reserved, visibly delineated parcels, NOT approved NSW cadastral lots.
// Roads are illustrative and are not yet connected to vehicle routing or navigation.
import * as THREE from 'three';
export const OUTSKIRT_PARCELS=Object.freeze([
 {id:'W-R1',name:'Western cottages',zone:'R2',x:-426,z:-112,w:110,d:86,colour:0x98bd7d},
 {id:'W-R2',name:'Western family homes',zone:'R2',x:-426,z:4,w:110,d:102,colour:0x9bbf81},
 {id:'W-C1',name:'Western community reserve',zone:'RE1',x:-426,z:125,w:110,d:92,colour:0x6eab69},
 {id:'E-B1',name:'Eastern service businesses',zone:'E3',x:426,z:-116,w:110,d:100,colour:0xb5a27e},
 {id:'E-L1',name:'Eastern light industry',zone:'E4',x:426,z:18,w:110,d:128,colour:0xb0a18c},
 {id:'E-R1',name:'Eastern rural transition',zone:'RU4',x:426,z:143,w:110,d:92,colour:0xa5b77a},
 {id:'N-C1',name:'Northern civic reserve',zone:'SP2',x:-175,z:-310,w:180,d:115,colour:0x91af94},
 {id:'N-R1',name:'Northern medium-density housing',zone:'R3',x:30,z:-310,w:170,d:115,colour:0xa8bf93},
 {id:'N-R2',name:'Northern low-density housing',zone:'R2',x:226,z:-310,w:160,d:115,colour:0xa0bf88},
 {id:'S-R1',name:'Southern large-lot residential',zone:'R5',x:-220,z:305,w:190,d:120,colour:0xa9bd83},
 {id:'S-AG1',name:'Southern market gardens',zone:'RU4',x:10,z:310,w:220,d:130,colour:0x95b06f},
 {id:'S-AG2',name:'Southern grazing property',zone:'RU1',x:260,z:326,w:220,d:160,colour:0x8eaa69},
]);
export const PLANNED_ROADS=Object.freeze([
 {id:'west-collector',name:'Western Collector (proposed)',x:-350,z:0,w:9,d:530,role:'collector'},
 {id:'east-collector',name:'Eastern Collector (proposed)',x:350,z:0,w:9,d:530,role:'collector'},
 {id:'north-connector',name:'Northern Link (proposed)',x:0,z:-235,w:720,d:9,role:'collector'},
 {id:'south-connector',name:'Southern Link (proposed)',x:0,z:235,w:720,d:9,role:'collector'},
 {id:'west-access',name:'Western Access (proposed)',x:-394,z:0,w:56,d:7,role:'local'},
 {id:'east-access',name:'Eastern Access (proposed)',x:394,z:0,w:56,d:7,role:'local'},
]);
// Options let the live town drop concept reserves and unconnected concept road strips that the
// built master plan (masterplan-built.js) supersedes; the concept data itself stays as a record.
export function buildOutskirts(group,{omitParcels=[],roads=true}={}){
 const plots=new THREE.Group();plots.name='Future land-use reservations (concept only)';
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(2200,1150),new THREE.MeshLambertMaterial({color:0x80b571}));
 ground.rotation.x=-Math.PI/2;ground.position.set(-490,-.095,25);plots.add(ground);
 const roadMaterial=new THREE.MeshLambertMaterial({color:0x55585a});
 for(const road of roads?PLANNED_ROADS:[]){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(road.w,.025,road.d),roadMaterial);
  mesh.position.set(road.x,-.035,road.z);mesh.name=road.name;plots.add(mesh);
 }
 const materials=new Map();
 for(const p of OUTSKIRT_PARCELS.filter(q=>!omitParcels.includes(q.id))){
  if(!materials.has(p.colour))materials.set(p.colour,new THREE.MeshLambertMaterial({color:p.colour,transparent:true,opacity:.73}));
  const tile=new THREE.Mesh(new THREE.BoxGeometry(p.w,.035,p.d),materials.get(p.colour));
  tile.position.set(p.x,-.008,p.z);tile.name=p.id+' '+p.zone+' '+p.name;plots.add(tile);
  // Thin boundary strips denote proposed property extents, not fences or physical colliders.
  const lineMat=new THREE.MeshLambertMaterial({color:0x52634a});
  for(const side of [-1,1]){
   const h=new THREE.Mesh(new THREE.BoxGeometry(p.w,.055,.25),lineMat);h.position.set(p.x,.035,p.z+side*p.d/2);plots.add(h);
   const v=new THREE.Mesh(new THREE.BoxGeometry(.25,.055,p.d),lineMat);v.position.set(p.x+side*p.w/2,.035,p.z);plots.add(v);
  }
 }
 group.add(plots);
 return {parcels:OUTSKIRT_PARCELS,roads:PLANNED_ROADS,group:plots};
}
