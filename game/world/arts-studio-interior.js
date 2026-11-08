// Repository Arts & Makers Studio (N7-N). Laid out like a regional community arts centre:
// a small gallery and reception at the street, dry studios (painting, textiles, printmaking)
// either side of a clear central aisle, the wet ceramics area at the back beside a clay-trap
// sink, and the kiln in its own ventilated room. Educational model, not a certified fit-out.
import {createKit} from './interior-kit.js';
export const ARTS_STUDIO_PLAN=Object.freeze({
 aisle:{x0:-1,x1:1},
 kilnRoom:{x0:3.4,x1:7,z0:-12,z1:-8.5,door:{z0:-10.6,z1:-9.6}},
 zones:['gallery and reception','painting studio','textiles and weaving','printmaking','ceramics','kiln room'],
 safety:['kiln in separate ventilated room with canopy hood','clay-trap sink','eyewash at the sink','flammable liquids cabinet','wet-clean clay dust (no dry sweeping)','first aid kit'],
});
export function buildArtsStudioInterior(site,makeLabel){
 const k=createKit(site,makeLabel,'Arts & makers studio');
 const {THREE,group,box,cyl,ball,torus,solid,text,add,model,seat}=k;
 // Round studio stools: a timber seat on a steel post and foot ring (registered as seats).
 const stool=(x,z,h)=>{cyl(.17,.17,.05,x,h-.025,z,0x9a7148);cyl(.025,.025,h-.05,x,(h-.05)/2,z,steel);torus(.14,.012,x,.25,z,steel,{rx:Math.PI/2});cyl(.2,.2,.02,x,.01,z,steel);seat('stool:'+x+':'+z,'stool',x,z,0);};
 const wood=0xb08a5e,ply=0xd9c39a,steel=0x8d969b,white=0xf1eee6,clay=0x9c6b4e,canvas=0xf3efe4;
 k.shell({wall:0xeee9de,ceiling:0xf7f5ef,floor:0x9fa3a0,frontSill:.6,sideSill:1.0});
 group.add(new THREE.HemisphereLight(0xffffff,0x8a8478,2.2));
 text('REPOSITORY ARTS & MAKERS STUDIO',0,3.6,-11.65,'room');

 // ── Gallery and reception (street end) ─────────────────────────────────
 // Reception desk with the class book; staff stand behind it, visitors at the front.
 solid(2.4,1.0,.7,-4.5,.5,2.2,wood);
 box(2.5,.06,.8,-4.5,1.03,2.2,ply);
 box(.42,.3,.05,-5.1,1.25,2.05,0x2f3a44);
 box(.5,.04,.35,-4.1,1.07,2.3,0xe8dcc2);
 text('Reception · class bookings',-4.5,2.3,2.2);
 // Freestanding gallery wall with a picture-hanging rail and members' works for sale.
 solid(.25,2.6,3.6,5.7,1.3,2.6,white);
 box(.06,.04,3.6,5.55,2.55,2.6,steel);
 for(const [z,w,h,c] of [[1.3,.8,.6,0x4f7a9a],[2.4,.6,.8,0xc9874f],[3.6,.9,.65,0x6d8f5a]]){
  box(.04,h+.08,w+.08,5.55,1.6,z,0x3a2e25);
  box(.03,h,w,5.53,1.6,z,c);
  box(.03,.02,.02,5.55,2.2,z,steel);           // hanging wire up to the rail
 }
 // Plinths with ceramics from the member exhibition.
 for(const [x,z] of [[3.6,3.9],[3.6,1.6]]){
  solid(.5,.95,.5,x,.475,z,white);
  cyl(.11,.08,.28,x,1.09,z,[0x5f8aa0,0xb9733f][z>2?0:1]);
 }
 text('Members exhibition',4.6,2.9,2.6);
 // Coat hooks and aprons by the door.
 box(1.6,.06,.08,-5.9,1.75,5.7,steel);
 for(let i=0;i<4;i++)box(.32,.75,.04,-6.4+i*.35,1.35,5.65,[0x2f5f7a,0x9a4a3a,0x5d7a45,0xc79a3a][i]);

 // ── Painting studio (west, middle) ────────────────────────────────────
 for(const z of [-1.2,-4.6]){
  solid(3.4,.82,1.5,-4.4,.41,z,ply);
  box(3.4,.04,1.5,-4.4,.84,z,0xcfc3ad);
  for(const [dx,c] of [[-1,0x2f6f9f],[.2,0xd5a83a],[1.1,0xb0423a]]){
   box(.18,.06,.12,-4.4+dx,.89,z,c);           // paint palettes and pots
   cyl(.05,.05,.14,-4.4+dx+.2,.93,z+.3,0xeaeae2);
  }
  for(const sx of [-1,1])for(const sz of [-1,1])stool(-4.4+sx*1.1,z+sz*1.05,.7);
 }
 // Easels with work in progress along the west wall, clear of the side window sill.
 for(const z of [-7.0,-8.3]){
  for(const dx of [-.28,.28])box(.05,1.75,.05,-6.25+dx,.88,z,0x8a6a45);
  box(.05,1.6,.05,-6.25,.8,z-.35,0x8a6a45);
  box(.75,.03,.12,-6.25,.8,z+.02,0x8a6a45);
  box(.62,.8,.03,-6.25,1.25,z+.05,canvas);
  box(.5,.6,.01,-6.25,1.27,z+.075,z>-7.5?0x6a9a7a:0xd89060);
  k.blocker(.7,.6,-6.25,z);
 }
 // Drying rack for wet paintings and prints.
 solid(.8,1.3,.6,-6.35,.65,-5.5,steel);
 for(let i=0;i<8;i++)box(.7,.02,.5,-6.35,.25+i*.14,-5.5,0xd8d2c4);
 text('Painting studio',-4.4,2.6,-2.9);

 // ── Textiles and weaving (east, middle) ───────────────────────────────
 solid(3.0,.78,1.2,4.6,.39,-1.6,wood);
 for(const x of [3.7,5.4]){
  box(.55,.32,.3,x,.95,-1.6,0xe9e7e0);         // sewing machines
  box(.18,.18,.24,x+.22,1.18,-1.6,0xe9e7e0);
  model('chair_A_wood',x,-.6,Math.PI,{h:.9});
 }
 // Floor loom: frame, warp threads and a bench.
 solid(1.4,1.5,1.0,4.9,.75,-4.6,0x7a5a3a);
 for(let i=0;i<14;i++)box(.012,1.0,.012,4.3+i*.09,1.0,-4.1,[0xd9c7a0,0x9a4a3a,0x2f5f7a][i%3]);
 box(1.2,.42,.35,4.9,.21,-3.6,0x7a5a3a);
 // Yarn and fabric shelving on the east wall.
 solid(.5,2.0,2.0,6.6,1.0,-6.4,wood);
 for(let r=0;r<4;r++)for(let i=0;i<4;i++)ball(.11,6.45,.35+r*.45,-7.1+i*.42,[0xc94a4a,0xe0b44a,0x4a7ac9,0x5aa36a,0x9a6ac0][(r+i)%5]);
 text('Textiles & weaving',4.9,2.6,-2.9);

 // ── Printmaking (east of the aisle, rear) ─────────────────────────────
 // Etching press: steel bed, rollers and the star wheel, on a heavy stand.
 solid(1.6,.8,.9,2.2,.4,-7.2,0x4e5559);
 box(1.9,.06,.7,2.2,.86,-7.2,steel);
 cyl(.11,.11,.85,2.2,1.02,-7.2,0x3c4245,{rx:Math.PI/2});
 cyl(.04,.04,.6,2.2,1.02,-6.65,0x3c4245,{rx:Math.PI/2});
 for(let i=0;i<4;i++)box(.04,.5,.04,2.2,1.02,-6.35,0x3c4245,{rx:i*Math.PI/4});
 text('Etching press',2.2,2.3,-7.2);

 // ── Ceramics (west, rear): wheels, wedging table, greenware shelves ───
 for(const x of [-5.6,-3.8]){
  solid(.7,.5,.9,x,.25,-10.2,0x6a7378);         // wheel body and splash pan
  cyl(.3,.3,.08,x,.56,-10.2,0x9aa3a8);
  cyl(.12,.14,.12,x,.66,-10.2,clay);           // a pot on the wheel head
  stool(x,-9.35,.55);
 }
 // Wedging table: heavy bench with a plaster top and a cutting wire.
 solid(1.5,.85,.8,-2.2,.43,-8.4,wood);
 box(1.4,.06,.7,-2.2,.88,-8.4,0xe6e1d6);
 box(.02,.4,.02,-2.2,1.1,-8.75,steel);
 for(const dx of [-.4,.3])box(.25,.18,.2,-2.2+dx,.99,-8.35,clay);
 // Greenware and bisque shelves along the back wall.
 solid(2.6,2.0,.5,-5.0,1.0,-11.6,steel);
 for(let r=0;r<4;r++)for(let i=0;i<6;i++)cyl(.08,.06,.16,-6.1+i*.44,.4+r*.45,-11.5,r<2?0xc8b8a5:0xe7ddd0);
 text('Greenware · bisque',-5.0,2.4,-11.4);
 // Clay-trap sink with an eyewash station beside it; clay never goes down a normal drain.
 solid(1.6,.9,.65,-1.6,.45,-11.55,0xc9ced1);
 box(1.3,.18,.5,-1.6,.92,-11.55,0xb3bbbf);
 box(.06,.4,.06,-1.6,1.25,-11.75,steel);
 box(.5,.35,.4,-1.6,.17,-11.4,0x5b6468);       // the clay trap under the sink
 box(.3,.3,.12,-.45,1.45,-11.82,0x2e9a55);    // eyewash sign and bottles
 text('Clay trap sink · eyewash',-1.2,2.3,-11.4);
 // Clay bins.
 for(const z of [-8.65,-9.15])cyl(.22,.22,.6,-6.5,.3,z,0x3a6a8a);
 k.blocker(.5,.5,-6.5,-8.9);

 // ── Kiln room (east, rear): separate, ventilated, door-gapped ─────────
 const K=ARTS_STUDIO_PLAN.kilnRoom;
 solid(.2,3.2,K.door.z0-K.z0,K.x0,1.6,(K.z0+K.door.z0)/2,0xdedad0);
 solid(.2,3.2,K.z1-K.door.z1,K.x0,1.6,(K.door.z1+K.z1)/2,0xdedad0);
 box(.2,1.4,K.door.z1-K.door.z0,K.x0,3.9,(K.door.z0+K.door.z1)/2,0xdedad0);
 solid(K.x1-K.x0,3.2,.2,(K.x0+K.x1)/2,1.6,K.z1,0xdedad0);
 box(.08,2.2,.06,K.x0,1.1,K.door.z0-.03,0x6f5343);
 box(.08,2.2,.06,K.x0,1.1,K.door.z1+.03,0x6f5343);
 box(.06,.3,.6,K.x0-.12,2.45,(K.door.z0+K.door.z1)/2,0xf2c230);
 text('KILN ROOM · HOT SURFACES',K.x0-.3,2.9,(K.door.z0+K.door.z1)/2);
 // Fire-resistant floor plate, front-loading electric kiln on its stand, and a canopy hood with duct.
 box(2.6,.02,2.4,5.6,.015,-10.6,0x7d7f80);
 solid(1.2,1.25,1.1,5.8,.63,-11.0,0x8a8174);
 box(1.0,.9,.04,5.8,.7,-10.43,0x5f5a52);
 box(.22,.16,.05,6.25,1.1,-10.42,0x1f2a33,{e:0x2bd06a});
 box(1.7,.35,1.5,5.8,2.85,-11.0,steel);
 box(.35,1.2,.35,5.8,3.95,-11.2,steel);
 text('Electric kiln · extraction hood',5.6,2.4,-10.2);

 // ── Shared fittings ───────────────────────────────────────────────────
 // Yellow flammable liquids cabinet for solvents, turps and spray fixative.
 solid(.9,1.6,.5,6.5,.8,-8.0,0xf2c230);
 box(.5,.1,.02,6.5,1.4,-7.74,0xc9302c);
 text('Flammable liquids',6.3,2.1,-7.9);
 // Class timetable whiteboard, first-aid kit and a mop station for wet-cleaning clay dust.
 box(2.4,1.2,.04,0,2.0,-11.85,0xffffff);
 for(let r=0;r<5;r++)box(2.0,.03,.01,0,2.4-r*.2,-11.82,[0x2f5f9a,0x9a3a3a,0x2f7a45][r%3]);
 box(.4,.3,.12,-6.85,1.6,-3.6,0x2e9a55);
 box(.12,.12,.13,-6.79,1.6,-3.6,0xffffff);
 cyl(.18,.18,.35,1.6,.18,-11.4,0xe2c044);
 box(.03,1.1,.03,1.7,.7,-11.4,0x9a8a6a);
 // Visitor bench by the gallery.
 solid(1.6,.45,.45,2.0,.225,4.9,wood);
 seat('gallerybench','bench',2.0,4.6,0);

 add('reception','Book a class','civic-ledger','Ask the art tutor about term classes, open studio sessions, kiln firing and studio membership.',-4.5,3.2);
 add('gallery','Members exhibition','info','Paintings and ceramics by studio members hang on the gallery rail; works are labelled with the artist and price.',4.6,2.6);
 add('painting','Painting studio','info','Shared tables, easels and a drying rack. Water-based paints are used here; solvents stay in the flammable cabinet.',-2.3,-2.9);
 add('textiles','Sewing machines and floor loom','info','Sewing, quilting and weaving classes. The loom is warped ready for the next tapestry project.',2.4,-2.6);
 add('press','Etching press','info','Inked plates and damp paper pass under the roller to pull a print. Prints dry on the rack in the painting studio.',.9,-7.2);
 add('ceramics','Pottery wheels and wedging table','info','Wedge clay to remove air before throwing. Clay dust is wet-mopped, never dry-swept, to keep fine silica out of the air.',-3.2,-7.3);
 add('sink','Clay-trap sink','info','Rinse tools here: the trap under the sink settles clay so it does not block the drains. The eyewash is beside it.',-1.6,-10.5);
 add('kiln','Electric kiln','info','Bisque and glaze firings run overnight at about 1000 to 1240 °C. The room has its own extraction hood and is kept closed while firing.',4.4,-10.1);
 add('safety','Flammable liquids cabinet','info','Turpentine, mineral spirits and spray fixative are stored in this ventilated, self-closing cabinet away from heat.',5.6,-7.4);
 return k.finish({artsStudioLayout:ARTS_STUDIO_PLAN,staff:{pos:{x:-4.5,z:1.2},use:{x:-4.5,z:3.2}}});
}
