// Internal finish layer ONLY for the shared non-dossier country-home fallback.
// Deliberately not a claim about a country's vernacular or a measured floor plan.
export function addGenericCountryDetails(b,home,plan){
  const {w,d,splitZ,bathDoor,bedDoor}=plan,half=w/2,depth=d/2;
  const trim=home.design.trim,grout=0xb8c1bc,tile=0xdce3da;
  const finishes=[];
  for(let i=0;i<plan.rooms.length;i++){
    const r=plan.rooms[i],rw=r.x1-r.x0,rd=r.z1-r.z0;
    const cx=(r.x0+r.x1)/2,cz=(r.z0+r.z1)/2;
    // Surface finishes sit above the old slab, not on it (no z-fighting).
    b.box(i===1?tile:i===2?0xb3a08a:0xc5b49d,rw,.006,rd,cx,-.005,cz);
    if(i===1){
      for(let x=r.x0+.45;x<r.x1;x+=.45)b.box(grout,.012,.002,rd,x,-.0005,cz);
      for(let z=r.z0+.45;z<r.z1;z+=.45)b.box(grout,rw,.002,.012,cx,-.0005,z);
    }else{
      for(let x=r.x0+.28;x<r.x1;x+=.28)b.box(0x9f8d79,.008,.002,rd,x,-.0005,cz);
    }
    // Ceiling fittings, not extra dynamic lights.
    b.cyl(0xeee6cf,.19,.06,cx,2.94,cz);
    b.cyl(0xf6edcc,.15,.012,cx,2.902,cz);
    finishes.push({room:i,type:i===1?'wet-area-tile':i===2?'bedroom-floor':'living-floor'});
  }
  // Perimeter skirting/cornice. Segment the front skirting around the entry.
  for(const x of [-half+.19,half-.19]){
    b.box(trim,.025,.12,d-.38,x,.06,0);
    b.box(0xebe7dc,.045,.09,d-.38,x,2.82,0);
  }
  b.box(trim,w-.38,.12,.025,0,.06,-depth+.19);
  for(const side of [-1,1]){
    const span=half-1.08;
    b.box(trim,span,.12,.025,side*(1.08+span/2),.06,depth-.19);
  }
  for(const [x,z,opening] of [[0,depth-.19,1.75],[bathDoor,splitZ,1.12],[bedDoor,splitZ,1.12]]){
    for(const side of [-1,1])b.box(trim,.055,2.32,.05,x+side*(opening/2+.03),1.16,z+.1);
    b.box(trim,opening+.115,.07,.05,x,2.355,z+.1);
  }
  // Washable splashback and subtle bathroom wall tile, not invented windows.
  b.box(tile,.015,.68,2.65,-half+.195,1.35,1.9);
  const bath=plan.rooms[1],span=bath.z1-bath.z0;
  b.box(tile,.015,1.45,span,-half+.195,.84,(bath.z0+bath.z1)/2);
  for(let z=bath.z0+.45;z<bath.z1;z+=.45)b.box(grout,.018,1.45,.012,-half+.205,.84,z);
  for(const y of [.4,.85,1.3])b.box(grout,.018,.012,span,-half+.205,y,(bath.z0+bath.z1)/2);
  return {evidenceLevel:'generic-gameplay-not-country-survey',finishes,layoutChanged:false};
}
