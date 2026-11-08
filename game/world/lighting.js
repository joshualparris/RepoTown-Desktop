import * as THREE from 'three';

// Rendering units are metres. Intensities are artistic approximations for the
// pinned r160 Lambert renderer, not a claim of compliance with measured lux.
export const STREET_LIGHT_BUDGET = 6;
export const lightingLevel = dark => THREE.MathUtils.smoothstep(dark, 0.12, 0.65);

// Reuse a fixed set of downward luminaires, rather than hundreds of real lights.
// Their actual mounting points never move: only nearby fixtures receive a slot.
export function createStreetLighting(parent, sources, budget = STREET_LIGHT_BUDGET) {
  const rig = new THREE.Group(); rig.name = 'Street lighting'; parent.add(rig);
  const slots = Array.from({ length: budget }, () => {
    const light = new THREE.SpotLight(0xffe1b0, 0, 23, 1.18, 0.65, 2);
    light.name = 'Shielded street luminaire'; light.castShadow = false;
    rig.add(light, light.target); return light;
  });
  let lastX = Infinity, lastZ = Infinity, selected = [];
  // Main-town and estate lamps share one budget; adding new roads never
  // creates hundreds of simultaneous mobile GPU light passes.
  const allSources=[...sources];
  function addSources(extra){allSources.push(...extra);lastX=Infinity;lastZ=Infinity;}
  function update(eye, dark, powered = true) {
    const level = powered ? lightingLevel(dark) : 0;
    // Selection is spatial, independent of frame rate or town clock speed.
    if (Math.hypot(eye.x - lastX, eye.z - lastZ) > 2) {
      lastX = eye.x; lastZ = eye.z;
      selected = allSources.map(s => ({ s, d: Math.hypot(s.x-eye.x, s.z-eye.z) }))
        .filter(e => e.d < 52).sort((a,b) => a.d-b.d).slice(0,budget).map(e=>e.s);
    }
    slots.forEach((light, i) => {
      const s = selected[i];
      light.intensity = s ? (s.estate ? 195 : 105) * level : 0;
      light.visible = !!s && level > 0;
      if (!s) return;
      light.position.set(s.x, s.y, s.z);
      light.target.position.set(s.x + (s.roadwardX || 0), 0,
        s.z + (s.roadwardZ ?? s.roadward ?? 0));
    });
  }
  return { rig, slots, update, addSources, get sourceCount(){return allSources.length;} };
}

export function interiorPalette(id) {
  return ['pub','cafe','bakery','hotel','farmhouse'].includes(id)
    ? { colour: 0xffd8a3, fill: 0xffefda, intensity: 18, pendant: true }
    : { colour: 0xfff2df, fill: 0xf4f6ff, intensity: 34 };
}

// A local electric circuit independent of the outdoor clock. The hemisphere
// approximates bounced room light; visible ceiling fittings provide direct light.
export function addInteriorLighting(group, id,options={}) {
  const palette=interiorPalette(id),pendant=options.pendant??palette.pendant,rig=new THREE.Group();
  rig.name = 'Interior electric lighting';
  let hasFill = false;
  group.traverse(o => { if (o.isHemisphereLight || o.isAmbientLight) hasFill = true; });
  if (!hasFill) rig.add(new THREE.HemisphereLight(palette.fill, 0x77716a, 1.65));
  const material = new THREE.MeshLambertMaterial({ color: 0xfffaf1,
    emissive: palette.colour, emissiveIntensity: 0.85 });
  for(const [x,z]of options.positions||[[-3.5,1.5],[-3.5,-6.5],[3.5,1.5],[3.5,-6.5]]) {
    const y=options.height??(pendant?3.65:4.38),ceiling=options.ceiling??4.5;
    const housing = new THREE.Mesh(pendant
      ? new THREE.ConeGeometry(.32,.23,12,1,true)
      : new THREE.BoxGeometry(1.65,.10,.58),
      new THREE.MeshLambertMaterial({color:pendant?0x82623b:0x626a70}));
    housing.position.set(x,y+.10,z); rig.add(housing);
    if(pendant){
      const cable=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,ceiling-y,6),housing.material);
      cable.position.set(x,(ceiling+y)/2,z);rig.add(cable);
    }
    const diffuser = new THREE.Mesh(pendant
      ? new THREE.CylinderGeometry(.26,.26,.035,12)
      : new THREE.BoxGeometry(1.5,.035,.45),material);
    diffuser.position.set(x,y,z); rig.add(diffuser);
    // A downward emitter avoids a bright, physically impossible halo above a
    // flush ceiling fitting. The fill approximates indirect reflected light.
    const light = new THREE.SpotLight(palette.colour, palette.intensity, 14, 1.18, .65, 2);
    light.position.set(x,y-.05,z); light.target.position.set(x,0,z);
    rig.add(light,light.target);
  }
  group.add(rig);
  // Store the site for power updates, never infer it from a translated display name.
  group.userData.lightingSite = id;
  const circuits=[];
  group.traverse(o=>{if(o.isLight)circuits.push({light:o,intensity:o.intensity});});
  group.userData.updateLighting=powered=>{
    for(const circuit of circuits)circuit.light.intensity=powered?circuit.intensity:0;
    material.emissiveIntensity=powered ? .85 : 0;
  };
  return rig;
}

export function shopLightingOn(place, minute) {
  // Trading lights, plus a short opening/closing preparation interval. Essential
  // services and occupied hotels have lights even outside public reception hours.
  if (['hotel','police','ambulance','fire','power','waterworks','sewage'].includes(place.id)) return true;
  const opens = Number.isFinite(place.opens) ? place.opens : 8*60;
  const closes = Number.isFinite(place.closes) ? place.closes : 18*60;
  const m = ((minute%1440)+1440)%1440;
  if(place.kind==='home')return m>=5.5*60 && m<22.5*60;
  if(closes-opens>=1440)return true;
  const start = ((opens-30)%1440+1440)%1440, end = (closes+30)%1440;
  return start < end ? m>=start && m<end : m>=start || m<end;
}

export function householdLightingOn(minute, cohort=0) {
  const m=((minute%1440)+1440)%1440;
  return [m>=330 && m<1320, m>=360 && m<1410, m<60 || m>=360][cohort] ?? false;
}
