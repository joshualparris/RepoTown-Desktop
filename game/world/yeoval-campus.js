// Yeoval Aged Care campus, based on publicly visible imagery at 3–[address redacted],
// Yeoval NSW and UPA's public description. This is an interpretive reconstruction,
// NOT an as-built survey, evacuation drawing or operational floor plan.
// Local +z faces Lord Street (north); rotation PI maps it to town-world -z.
import { Builder, GLASS } from './builder.js';

export const YEOVAL_SITE = Object.freeze({
  id:'yeoval-aged-care', name:'Yeoval Aged Care',
  realAddress:'3–[address redacted], Yeoval NSW 2868',
  sourceRepository:'TownResident/YeovalAgedCare',
  x:-171, z:-260, rotation:Math.PI,
  // Approximate inferred footprints, metres; no cadastral or measured plan is available.
  wings:Object.freeze([
    {id:'north',x:0,z:9.5,w:79,d:19},
    {id:'connector',x:11,z:-3.5,w:7,d:7},
    {id:'south',x:11,z:-16,w:43,d:18},
    {id:'west-service',x:53,z:9,w:18,d:12},
  ]),
  // Pixel-calibrated: image 20m scale bar ~130px; ~79m north, ~43m south.
  // Positive local X rotates to geographic west; the entrance/south wing are ~11m west.
  front:19, entry:Object.freeze({x:-182,z:-279}),
  approach:Object.freeze({x:-182,z:-282.5}),
  scaleStatus:'aerial-image scale-bar estimates (~6.5px/m); NOT surveyed',
  visualPeriod:'June [address redacted] View plus older public photographs',
});

// Local-to-world transform is intentionally explicit so the collision footprint,
// entry pose, and visual layout cannot drift apart during future edits.
export function yeovalWorld(x,z) {
  return {x:YEOVAL_SITE.x-x,z:YEOVAL_SITE.z-z};
}
const ROAD=0x4e5052, KERB=0xb5aea0, BRICK=0xb77f60, PALE=0xd5c7b2;
const METAL=0xc6c9c5, SHADE=0x9aa7a3, GREEN=0x547844;
function wing(b,{x,z,w,d},tag) {
  const h=3.65;
  // Four actual facade walls, not an opaque box blocking the front entrance.
  b.box(BRICK,w,h,.24,x,h/2,z-d/2+.12);
  for(const side of [-1,1]) b.box(BRICK,.24,h,d,x+side*(w/2-.12),h/2,z);
  if(tag==='north'){
    const entryX=11, opening=2.8, leftW=entryX-opening/2-(x-w/2), rightW=x+w/2-(entryX+opening/2);
    b.box(BRICK,leftW,h,.24,x-w/2+leftW/2,h/2,z+d/2-.12);
    b.box(BRICK,rightW,h,.24,entryX+opening/2+rightW/2,h/2,z+d/2-.12);
    // A real headpiece above the 2.8m-wide glazed public doorway.
    b.box(BRICK,2.8,h-2.75,.24,entryX,2.75+(h-2.75)/2,z+d/2-.12);
  } else b.box(BRICK,w,h,.24,x,h/2,z+d/2-.12);
  // The distinct shallow corrugated hip and gable roof profiles stay single storey.
  b.box(METAL,w+.9,.18,d+.9,x,h+.10,z);
  b.box(SHADE,w+.25,.13,d*.48,x,h+.53,z);
  for(const rz of [-1,1]) b.box(0xe0e1db,w+.6,.09,.23,x,h+.25,z+rz*(d/2+.13));
  // Regular domestic-scale glazed bays with frames, rather than commercial curtain walls.
  const count=Math.max(2,Math.floor((w-3)/5.6));
  for(let i=0;i<count;i++){
    const xx=x-w/2+2.2+i*(w-4.4)/(count-1);
    for(const side of [-1,1]){
      // The entry is in the middle of the north wing, not an ordinary bedroom.
      if(tag==='north'&&side>0&&Math.abs(xx-11)<4.3) continue;
      b.box(0xe2ddd0,1.52,1.56,.10,xx,1.94,z+side*(d/2+.06));
      b.box(GLASS,1.34,1.38,.12,xx,1.94,z+side*(d/2+.14));
      b.box(0xddd4c4,.075,1.44,.13,xx,1.95,z+side*(d/2+.23));
      b.box(0xe6ddce,1.48,.09,.15,xx,1.14,z+side*(d/2+.18));
    }
  }
  for(const xx of [-w/2,w/2]){
    b.box(0xe8ddc9,.12,2.2,1.7,x+xx+Math.sign(xx)*.06,1.85,z);
  }
}
// Height stays deliberately modest: neither historic photos nor aerials indicate upper storeys.
export function buildYeovalCampus(group, colliders) {
  const s=YEOVAL_SITE, b=new Builder();
  // Road on the existing F/K avenue axis; new northern land is outside the 26x8 lots.
  b.box(ROAD,7.0,.045,240,37,.026,-30); // existing x=-[address redacted] extended north
  b.box(ROAD,100,.044,8.0,0,.023,27);  // virtual Lord Street north frontage
  for(const dz of [-3.95,3.95])b.box(KERB,100,.12,.14,0,.065,27+dz);
  // Landscaped apron and western access/parking area.
  b.box(0xc4b79b,83,.035,8,0,.012,23);
  b.box(ROAD,12,.05,43,46,.035,-3);
  for(let i=0;i<7;i++){
    const zz=-21+i*6.0;
    b.box(0xe8e6dd,.11,.055,5.4,49,.065,zz);
  }
  // Drive positions and planting are illustrative, not mapped traffic-engineering data.
  for(const [x,z] of [[31,22],[25,22],[-27,22],[35,-28],[-31,-29]]) {
    b.cyl(0x846c4a,.14,2.2,x,1.10,z);
    b.ball(GREEN,1.4,x,2.62,z);
  }
  for(const w of s.wings) wing(b,w,w.id);
  // Northern front door + hipped entrance portico; glass leaves mark the accessible entrance.
  b.box(0xd3c2a8,9.0,.19,6,11,3.02,21.4);
  for(const x of [7,15])for(const z of [19.5,24])b.cyl(0xb4a38d,.20,2.88,x,1.44,z);
  b.box(0x786959,2.7,2.7,.12,11,1.38,19.10);
  b.box(GLASS,2.28,2.28,.14,11,1.38,19.21);
  b.box(0xc3b5a1,.08,2.28,.18,11,1.38,19.32);
  b.box(0x9d8770,2.9,.11,.55,11,.055,19.56);
  b.box(0x78b5c6,2.5,.82,.06,16.8,3.15,19.3); // UPA sign panel
  b.box(0xe3ddcd,.11,.35,.07,16.8,3.14,19.35);
  // A recognisable sheltered connecting spine and modest rear courtyard.
  b.box(0xbcc5bd,7.3,.17,7.4,11,3.83,-3.5);
  b.box(0x9cb598,26,.025,8,11,.026,-29);
  for(const x of [3,19]){b.box(0x9f8466,1.25,.08,0.8,x,.51,-29);b.box(0x806445,.12,.44,.12,x-.4,.23,-29);}
  // Rainwater tanks seen east of the rear building in imagery.
  for(const [x,z] of [[-28,-22],[-32,-22],[-28,-27]]) {
    b.cyl(0x9b9f96,1.25,2.3,x,1.15,z);
    b.cyl(0xd0d3cb,1.31,.12,x,2.35,z);
  }
  const mesh=b.build();
  // Geometries are local; group rotation makes real north the image's frontage.
  mesh.position.set(s.x,0,s.z);mesh.rotation.y=s.rotation;mesh.name='Yeoval public-reference campus';group.add(mesh);
  // House-shaped collision union with a clear 2.6m entrance; not a blanket bounding box.
  const rect=(x0,x1,z0,z1)=>{
    const a=yeovalWorld(x0,z0),c=yeovalWorld(x1,z1);
    colliders.push({x0:Math.min(a.x,c.x),x1:Math.max(a.x,c.x),z0:Math.min(a.z,c.z),z1:Math.max(a.z,c.z)});
  };
  rect(-39.5,9.65,0,19); rect(12.35,39.5,0,19);
  rect(9.65,12.35,0,17.5); // clear north doorway at x=+11
  rect(7.5,14.5,-7,0);
  rect(-10.5,32.5,-25,-7);
  rect(44,62,3,15); // detached west roof, attribution uncertain
  return { ...s, mesh, door:{...s.entry}, facing:'north' };
}
