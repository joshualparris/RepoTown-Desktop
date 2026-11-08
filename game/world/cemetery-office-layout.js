// Fictional 12m × 9m single-storey regional cemetery office, NOT a survey or
// as-built plan. Local +Z faces the established road; game places M5-N at 180°.
export const CEMETERY_LAYOUT=Object.freeze({
 w:12,d:9,front:7,rear:-2,wallHeight:4.2,roofRidge:5.6,doorHalfWidth:1.25,
 foyer:Object.freeze({x0:-6,x1:6,z0:-2,z1:7}),
 counselling:Object.freeze({x0:-5.95,x1:-2.22,z0:-1.9,z1:.58,entryX0:-4.5,entryX1:-3.08}),
 records:Object.freeze({x0:2.62,x1:5.95,z0:-1.9,z1:.66,entryX0:4.13,entryX1:5.38}),
 reception:Object.freeze({x:-.5,z:-.45,useX:-.5,useZ:1.07,staffX:-.5,staffZ:-1.35}),
 information:Object.freeze({x:-5.32,z:2.6}),
 memorial:Object.freeze({x:5.15,z:2.65}),
 exit:Object.freeze({x0:-1.25,x1:1.25,z0:6.84,z1:8.25})
});
