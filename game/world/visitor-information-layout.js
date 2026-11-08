// RTBUILD-070: Fictional O5-N visitor information building. Local +Z faces road;
// townlife rotates its street facade to world -Z. Game metres are a design
// envelope only, not survey measurements of the real Dubbo VIC.
export const VISITOR_LAYOUT=Object.freeze({
  w:12,d:9,front:7,rear:-2,roofEave:4.15,roofRidge:5.58,
  doorHalfWidth:1.30,
  foyer:Object.freeze({x0:-1.30,x1:1.30,z0:1.0,z1:7.0}),
  accessibleWC:Object.freeze({x0:2.5,x1:5.85,z0:-1.85,z1:1.60,
    entryX0:3.55,entryX1:4.85}),
  counter:Object.freeze({x:-2.75,z:0.32,staffX:-2.75,staffZ:-0.65,visitorX:-2.5,visitorZ:1.45}),
  brochure:Object.freeze({x:-5.3,z:4.7}),
  localProducts:Object.freeze({x:-2.80,z:3.7}),
  itinerary:Object.freeze({x:3.25,z:2.5}),
  exit:Object.freeze({x0:-1.3,x1:1.3,z0:6.83,z1:8.16}),
});
