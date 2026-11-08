import {GLASS} from './builder.js';
import {CEMETERY_LAYOUT as L} from './cemetery-office-layout.js';

// Regional NSW cemetery administrative office: low brick building, welcoming
// shaded glazed entry, modest gardens and memorial samples, NEVER a fake chapel
// or burial plots crammed onto a 12m infill shop site.
export function buildCemeteryOfficeFacade(b){
 const C={brick:0xa88471,brick2:0x956b5d,trim:0xe5dccb,roof:0x596b67,
  ridge:0x384e4c,metal:0x5d655f,paving:0xb5b2a5,stone:0xb7b0a4,grass:0x62795c,
  bronze:0x947b56,wood:0x80624f,light:0xffebce};
 const front=L.front,rear=L.rear,mid=(front+rear)/2,ang=Math.atan2(L.roofRidge-L.wallHeight,6);
 b.box(C.paving,L.w,.12,L.d,0,.06,mid); // single accessible level (visual only)
 // Brick plinth and carefully framed front bays; centre glass entrance stays visible.
 b.box(C.brick,L.w,L.wallHeight,.22,0,L.wallHeight/2,rear+.10);
 for(const x of [-5.88,5.88])b.box(C.brick,.24,L.wallHeight,L.d,x,L.wallHeight/2,mid);
 for(const x of [-3.75,3.75]){
  b.box(C.brick,4.3,.82,.22,x,.41,front-.10);
  b.box(C.brick,4.3,1.08,.22,x,3.66,front-.10);
  b.box(C.trim,4.14,2.27,.10,x,2.00,front+.015);
  b.box(GLASS,3.96,2.07,.07,x,2.00,front+.09);
  b.box(C.trim,.105,2.13,.10,x,2.00,front+.16);
  b.box(C.trim,4.15,.085,.13,x,2.55,front+.19);
  b.box(C.trim,4.15,.085,.13,x,.94,front+.19);
 }
 b.box(C.trim,2.65,.27,.18,0,3.9,front);
 b.box(GLASS,2.4,3.05,.065,0,1.64,front+.075);
 b.box(C.trim,.07,3.04,.09,0,1.64,front+.16);
 for(const x of [-.37,.37])b.box(C.bronze,.04,.40,.13,x,1.55,front+.2);
 // Traditional hip-like corrugated metal gables, ridge and rain gutters.
 const len=Math.hypot(6.0,L.roofRidge-L.wallHeight)+.32;
 for(const side of [-1,1]){
  b.add('box',C.roof,len,.17,L.d+.7,side*3.0,(L.wallHeight+L.roofRidge)/2,mid,0,0,-side*ang);
  for(let i=1;i<=8;i++){
   let x=side*i*.62,y=L.roofRidge-Math.abs(x)*(L.roofRidge-L.wallHeight)/6+.10;
   b.box(C.ridge,.055,.045,L.d+.65,x,y,mid);
  }
 }
 b.box(C.ridge,.25,.21,L.d+.75,0,L.roofRidge+.03,mid);
 // Full-width veranda rain cover and recessed porch have three ample entrances
 // between posts; no solid column blocks the centre door.
 b.box(C.roof,12.3,.19,1.12,0,3.68,front+.50);
 b.box(C.trim,12.4,.14,.21,0,3.45,front+1.04);
 for(const x of [-5.35,-2.05,2.05,5.35]){
  b.box(C.trim,.20,3.45,.20,x,1.73,front+.96);
  b.box(C.stone,.37,.38,.37,x,.19,front+.96);
 }
 b.box(C.paving,3.18,.055,1.75,0,.05,front+.85);
 // Plants, simple seating and an upright illustrative MEMORIAL SAMPLE stone;
 // no deceased names, inscriptions, dates, religious assumptions or real graves.
 for(const x of [-5.0,5.0]){
  b.box(C.wood,1.35,.4,.55,x,.2,front+1.70);
  for(const dx of [-.45,0,.45]){
   b.cyl(C.grass,.17,.45,x+dx,.58,front+1.7);
   b.ball(0x6c916c,.29,x+dx,.93,front+1.7);
  }
 }
 b.box(C.stone,.92,1.32,.27,-3.6,.71,front+1.87);
 b.box(C.bronze,.64,.36,.03,-3.6,1.02,front+2.04);
 b.box(C.stone,1.24,.24,.54,-3.6,.12,front+1.87);
 for(const x of [3.32,4.40])b.box(C.metal,.065,.43,.07,x,.35,front+1.78);
 b.box(C.wood,1.55,.12,.48,3.86,.60,front+1.78);
 b.box(C.wood,1.55,.5,.07,3.86,.88,front+1.55);
 // Rainwater management: dark roof-edge gutters and genuine visible vertical
 // downpipes discharge toward planting, not into the public door threshold.
 for(const side of [-1,1]){
   b.box(C.metal,.13,.16,L.d+.8,side*6.05,L.wallHeight-.04,mid);
   for(const z of [rear+.75,front-1.3]){
     b.box(C.metal,.105,3.55,.11,side*5.92,1.82,z);
     b.box(C.metal,.23,.12,.26,side*5.79,.14,z);
   }
 }
 // Brick soldier courses and matching lintels give the garden office
 // visual material depth rather than a featureless rectangle.
 for(const x of [-3.75,3.75]){
   b.box(C.brick2,4.27,.16,.10,x,3.18,front+.13);
   b.box(C.trim,4.29,.12,.14,x,.82,front+.16);
   for(const dx of [-1.40,-.70,.70,1.40])
     b.box(C.brick2,.06,.28,.12,x+dx,3.36,front+.15);
 }
 // A secure records plaque and visible wheelchair-friendly waiting route.
 b.box(C.wood,2.35,.36,.09,0,3.29,front+1.06);
 for(const x of [-3.2,0,3.2])b.box(C.light,.68,.06,.23,x,3.55,front+.52);
 return {w:L.w,d:L.d,front:L.front};
}
