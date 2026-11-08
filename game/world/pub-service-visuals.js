import {PUB_SERVICE_EDGES} from './pub-standards.js';
// Positions in the fictional interior scene. Boundary ports stand for yard/town assets;
// these are schematic x-ray routes, never surveyed installation/clearance drawings.
const P={lift:[-2.15,1.2,3.4],'cellar-vent':[-6.5,-.6,-5],'keg-cooler':[-2.3,-2.3,-11],'cellar-sump':[3,-2.9,-11.1],'cellar-basin':[3,-2.3,-9.5],'upper-lights':[0,8.2,-3],'cellar-keg':[-5.7,-2.9,-9.6],'beer-riser':[-1,-1,-7.7],'beer-taps':[-2.4,1.44,-5.3],'outside-co2':[-6.8,.4,-4],'beverage-regulator':[-6.7,.8,-4],
 'town-gas':[-6.8,.1,-6],'gas-meter':[-6.6,.4,-6],ata:[-6.4,2,-6.4],'desk-phone':[1.8,1.3,-5.6],'mobile-carrier':[6.7,3.4,5.8],handset:[2,1.3,-5.6],'radio-transmitter':[-6.8,3.5,5.8],'radio-antenna':[-5.8,3.6,-2],radio:[-5.6,2.5,-2],'tv-transmitter':[6.8,3.5,5.8],'tv-aerial':[6.7,3.7,-1],television:[6.8,2.4,-3.6],'lpg-depot':[-6.8,.1,5.8],'delivery-truck':[-6.8,.1,-4],
 'kitchen-waste':[-4,.7,-8.2],'bar-recycling':[3,.4,-5.6],'general-bin':[6.7,.4,-9],'recycling-bin':[6.7,.4,-10],'collector':[6.8,.1,-11.5],
 'town-water':[-6.8,.2,-11.5],'water-meter':[-6.8,.4,-7.3],backflow:[-6.4,.4,-7.3],'water-isolator':[-6,.4,-7.3],
 wc:[6.28,.4,-11.1],wc2:[2.35,.4,-11.1],basin:[4.26,.8,-11.02],basin2:[3.15,.8,-10.2],prep:[-4.4,.9,-8.7],dishwasher:[-4.55,.5,-10.8],'bar-water':[1.4,1,-5.2],heater:[-6.8,1,-11.5],
 'sanitary-lateral':[6.5,.08,-11.6],'town-sewer':[6.8,.08,-11.8],'grease-arrestor':[-6.8,.08,-11.3],'trade-lateral':[-5,.08,-11.8],roof:[0,4.4,-3],gutters:[6.8,4.4,-3],downpipes:[6.8,.15,-11.4],'storm-outlet':[6.8,.08,-11.8],
 'lpg-store':[-6.8,.4,-8.5],regulator:[-6.8,1.2,-8.5],'gas-isolator':[-6.3,1.2,-9.3],cooker:[-6.3,.9,-10.4],switchboard:[-6.8,1.4,-7.3],'cold-room':[-2.5,2.3,-10.8],lights:[0,3.5,-1],network:[-6.7,2.1,-6.4],carrier:[-6.8,2.5,5.8],eftpos:[3,1.2,-5.6]
};
export function pubServiceLayers(THREE,group){
 const colors={electricity:0xffcd38,water:0x38baff,sewer:0xb07949,gas:0xf3a257,internet:0xb783ff,waste:0x72ce76,stormwater:0x72d8ce,telephone:0xdce5ef,mobile:0xf391ca,radio:0x9ecce3,television:0xb3d951,fuel:0xe87853,beer:0xeec35e},layers={};
 for(const [id,color]of Object.entries(colors)){const g=new THREE.Group();g.name='Pub utility '+id;g.visible=false;group.add(g);layers[id]=g;
 const mat=new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.85});
 for(const e of PUB_SERVICE_EDGES.filter(e=>(e.utility==='sanitary'||e.utility==='trade'?'sewer':e.utility==='beverage-gas'?'gas':e.utility)===id)){
  const a=P[e.from],b=P[e.to];if(!a||!b)throw Error('Missing schematic pub asset '+e.id);
  const pts=[new THREE.Vector3(...a),new THREE.Vector3(b[0],a[1],a[2]),new THREE.Vector3(b[0],b[1],a[2]),new THREE.Vector3(...b)];
  for(let i=1;i<pts.length;i++){const d=pts[i].clone().sub(pts[i-1]),length=d.length();if(length<.001)continue;const m=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,length,6),mat);m.position.copy(pts[i-1]).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.name=e.id;m.renderOrder=20;g.add(m);}
 }
 }
 return layers;
}
