import * as THREE from 'three';

// Long-range aviation-only underlay for the 8 km Narromine–Repository Town
// flight corridor. Not asserted to be mapped cadastre or precise crop cover.
// Existing mapped OSM roads, LiDAR trees and buildings remain above the base.
export function buildFlightLandscape(parent) {
  const group=new THREE.Group();group.name='Airborne corridor - illustrative agricultural cover';
  parent.add(group);
  // Fill empty space beyond the relatively narrow pedestrian ground extents.
  const green=new THREE.Mesh(new THREE.PlaneGeometry(14000,11600),
    new THREE.MeshLambertMaterial({color:0x819b62,side:THREE.DoubleSide,depthWrite:true}));
  green.rotation.x=-Math.PI/2;green.position.set(-3300,-0.55,-1600);
  green.receiveShadow=true;group.add(green);
  // Batched, deterministically seeded crop fields keep the long-distance
  // views coherent without 300+ extra GPU draw calls.
  const kinds=[0xc4b06c,0x9caa6e,0x789255,0xb39a62,0xa4ad7a,0xd1bd80];
  let seed=0x59c432ad;
  function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;}
  const rows=[...Array(kinds.length)].map(()=>[]);
  const baseGeom=new THREE.BoxGeometry(1,1,1);
  for(let x=-9750;x<3100;x+=510)for(let z=-6700;z<3100;z+=430){
    // Keep random variation mild enough to look like agricultural paddocks,
    // not a perlin/noisy simulation or a fabricated cadastral survey.
    const w=380+random()*120,d=285+random()*95;
    const px=x+random()*62,pz=z+random()*60;
    const idx=Math.floor(random()*kinds.length);
    const m=new THREE.Matrix4().compose(new THREE.Vector3(px,-0.465,pz),
      new THREE.Quaternion(),new THREE.Vector3(w,0.035,d));
    rows[idx].push(m);
  }
  const chunks=[];
  for(let i=0;i<kinds.length;i++){
    const arr=rows[i],mat=new THREE.MeshLambertMaterial({color:kinds[i],polygonOffset:true,polygonOffsetFactor:1});
    const mesh=new THREE.InstancedMesh(baseGeom,mat,arr.length);
    mesh.name='Illustrative fields '+i;
    arr.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));
    mesh.instanceMatrix.needsUpdate=true;
    mesh.receiveShadow=true;
    group.add(mesh);chunks.push(mesh);
  }
  return {group,base:green,fields:chunks,patches:rows.reduce((n,r)=>n+r.length,0),
    evidence:'illustrative agricultural ground texture, not licensed parcel boundaries'};
}
