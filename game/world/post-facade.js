// Fictional rural Australian post office frontage, not an Australia Post
// licensed brand or surveyed example. Coordinates are local to the town lot;
// the public entrance remains x=0, z=[address redacted] collision.
export const POST_FACADE = Object.freeze({
  width: 11, depth: 9, height: 4.6, entryX: 0, frontZ: 7,
  awningY: 3.24, pickupX: 3.84, boxesX: -3.84, postboxX: 4.6
});

export function buildPostFacade(b, { shopfront, RED = 0xb8413a, DARK = 0x33363b }) {
  const G = POST_FACADE;
  const STONE=0xd4c5ab, CREAM=0xf1eadb, METAL=0x72838a, GREY=0xaeb8bd, GLASS=0x9fd3ea;
  shopfront(b,G.width,G.depth,G.height,STONE,RED,null);
  // Brick plinth, shallow lintel cornice, downpipes, gently projecting
  // lightweight awning. Avoid columns in the walking route or storefront.
  b.box(0x9c8571,11.18,.39,.16,0,.20,7.12);
  b.box(CREAM,11.3,.19,.34,0,4.02,7.12);
  for(const x of [-5.41,5.41]){
    b.box(0xbca890,.3,3.7,.28,x,1.95,7.12);
    b.box(METAL,.085,3.2,.10,x,1.74,7.31);
    b.box(METAL,.14,.14,.34,x,.19,7.39);
  }
  b.box(RED,11.6,.20,2.0,0,G.awningY,7.96); // canopy top / fascia
  b.box(CREAM,11.46,.10,1.85,0,G.awningY-.17,7.94); // soffit
  b.box(0x8c3031,11.5,.24,.12,0,G.awningY-.025,8.92);
  for(const x of [-4.2,-1.5,1.5,4.2]){
    b.box(CREAM,.78,.035,.19,x,G.awningY-.26,8.17);
    b.box(METAL,.045,.36,1.2,x,3.50,7.64);
  }
  // Recessed-style letterbox bank on one side of the street frontage, each
  // door with individual lock and number plate, facing the pavement.
  b.box(METAL,2.48,2.17,.10,G.boxesX,1.72,7.18);
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
    const x=G.boxesX-1.01+col*.505,y=.90+row*.39;
    b.box(0xd6dce0,.475,.35,.045,x,y,7.25);
    b.box(0x50585f,.26,.024,.052,x,y+.087,7.29);
    b.box(0xa08d66,.045,.04,.056,x+.17,y-.042,7.29);
  }
  b.box(CREAM,2.58,.19,.09,G.boxesX,2.93,7.18);
  // Secure attended parcel collection hatch. It is illustrative: no rear
  // public door is invented and no opening is cut through the facade.
  b.box(METAL,1.50,1.52,.1,G.pickupX,1.87,7.22);
  b.box(GLASS,1.21,.72,.045,G.pickupX,2.13,7.29);
  b.box(0xb9c4c7,1.28,.105,.31,G.pickupX,1.49,7.44);
  b.box(RED,1.46,.22,.08,G.pickupX,2.77,7.31);
  // Freestanding public posting box to the right, beyond the central
  // entrance. Graphics and collar are decorative and do not impede access.
  b.block(RED,.66,1.22,.51,G.postboxX,0,8.21);
  b.ball(RED,.33,G.postboxX,1.22,8.21);
  b.box(DARK,.43,.045,.045,G.postboxX,1.02,8.49);
  b.box(CREAM,.40,.17,.04,G.postboxX,.65,8.49);
  b.box(0x9b2e32,.82,.10,.76,G.postboxX,.03,8.21);
  // Inclusive-looking level entry threshold is decorative, not a claim that
  // an access audit, real grade, ramp design or permit has been completed.
  b.box(0xb8b7b3,2.38,.055,1.22,0,.04,7.77);
  // Exterior CCTV dome and parcel-cage ventilation grille.
  b.box(METAL,.20,.17,.26,-2.13,3.00,7.32);
  b.ball(DARK,.125,-2.13,2.89,7.42);
  b.box(METAL,1.12,.36,.10,3.06,3.93,7.21);
  for(let i=0;i<5;i++)b.box(DARK,.86,.025,.02,3.06,3.81+i*.055,7.28);
  return {w:G.width,d:G.depth};
}
