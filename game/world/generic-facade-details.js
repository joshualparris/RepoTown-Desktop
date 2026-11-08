import { genericProfileForSite } from './generic-business-fitouts.js';
import { GLASS } from './builder.js';
import { REMAINING_PROFILES } from './generic-remaining-fitouts.js';
// FICTIONAL Repository Town only; never imported by real Narromine facades.
// Called at the very end of the generic facade, after all bespoke returns.
export function addGenericFacadeDetails(b,site,{w,h,face,trim,accent}) {
  if(site.expansion!==true)return null;
  const key=genericProfileForSite(site);
  if(!key)return null;
  const frame=0xd9d6c9,metal=0x65716d,base=0x827565;
  // Clear entrance, recessed-looking surround, handles and a shallow canopy.
  b.box(GLASS,1.62,2.65,.09,0,1.4,face+.17);
  for(const x of [-.9,.9])b.box(frame,.1,2.9,.16,x,1.45,face+.22);
  b.box(frame,1.9,.1,.16,0,2.9,face+.22);
  b.box(metal,.045,.32,.12,.65,1.35,face+.32);
  b.box(base,2.05,.035,.42,0,.018,face+.22);
  b.box(trim,2.7,.12,.85,0,3.13,face+.35);
  for(const x of [-3.55,3.55])b.box(base,5.0,.33,.14,x,.165,face+.13);
  // Flush downpipes and corner piers stay out of the walking approach.
  for(const x of [-w/2+.17,w/2-.17]){
    b.box(trim,.22,h-.18,.16,x,(h-.18)/2,face+.05);
    b.cyl(metal,.035,h-.45,x,(h-.45)/2,face+.16);
  }
  const rural=site.style==='rural'||site.style==='workshop';
  const windows=rural?[{x:3,half:1.64,bottom:1.28,top:3.14}]:
    [{x:-4,half:1.39,bottom:.82,top:3.32},{x:4,half:1.39,bottom:.82,top:3.32}];
  for(const v of windows){
    for(const x of [v.x-v.half,v.x+v.half])b.box(frame,.09,v.top-v.bottom,.15,x,(v.top+v.bottom)/2,face+.17);
    b.box(frame,v.half*2+.1,.09,.21,v.x,v.top,face+.18);
  }
  if(key==='salon'||key==='beauty'){
    for(const cx of [-4,4])for(let i=0;i<5;i++){
      b.box([accent,0xc8b191,0xe5dece][i%3],.18,.3,.08,cx-.7+i*.34,1.14,face+.23);
      b.box(metal,.09,.055,.08,cx-.7+i*.34,1.315,face+.23);
    }
    if(key==='salon')for(let i=0;i<7;i++)b.box([0xc7d0cb,0x9d514b,0x536e88][i%3],.16,.11,.13,1.24,1.15+i*.11,face+.24);
  }else if(key==='laundry'){
    for(const x of [2.4,3.3]){
      b.box(0xd6d8cc,.7,.9,.1,x,1.8,face+.2);
      b.cyl(0x4c636c,.21,.05,x,1.7,face+.29,Math.PI/2);
    }
  }else if(key==='clothing'){
    for(const cx of [-4,4]){
      b.box(metal,1.8,.035,.07,cx,2.35,face+.23);
      for(let i=0;i<5;i++)b.box([accent,0xa98164,0x718896][i%3],.24,.73,.08,cx-.65+i*.32,1.93,face+.23);
    }
  }else if(key==='rural'||key==='irrigation'){
    for(let i=0;i<4;i++){
      b.box(key==='rural'?0xb9ad82:0x8ba3a5,.4,.65,.08,1.95+i*.66,1.78,face+.24);
      b.box(accent,.26,.16,.018,1.95+i*.66,1.8,face+.29);
    }
  }else if(key==='employment'){
    for(const cx of [-4,4])for(const x of [-.7,0,.7])b.box(0xe3ddc8,.5,.75,.04,cx+x,1.9,face+.2);
  }else if(key==='homewares'){
    for(const cx of [-4,4])for(const x of [-.65,.1,.7]){
      b.box(0xbca17e,.35,.32,.08,cx+x,1.35,face+.22);
      b.box(accent,.45,.14,.1,cx+x,1.59,face+.22);
    }
  }else if(REMAINING_PROFILES[key]){
    // Respect the actual bays: workshop/rural has ONE window, not two.
    // All details remain shallow and collision-free; no garage/door relocation.
    const privateService=['rehabilitation','podiatry','nursing','wellbeing','optical','counselling','support','veterinary','funeral','amenities'].includes(key);
    for(const v of windows){
      if(privateService){
        b.box(0xa8c3bf,v.half*2-.12,.78,.035,v.x,1.55,face+.235);
        b.box(accent,.48,.12,.045,v.x,2.25,face+.245);
      }else if(['workshop','fieldservice','vehicle','wash','logistics'].includes(key)){
        b.box(metal,2.4,.07,.1,v.x,1.38,face+.23);
        for(let i=0;i<3;i++){
          const x=v.x-.8+i*.8;
          if(key==='workshop'||key==='vehicle'){
            b.cyl(0x35444a,.25,.07,x,1.69,face+.26,Math.PI/2);
            b.cyl(metal,.1,.08,x,1.69,face+.28,Math.PI/2);
          }else{
            b.box(0xb5a184,.55,.45,.08,x,1.65,face+.24);
            b.box(frame,.18,.12,.025,x,1.67,face+.29);
          }
        }
      }else if(['museum','gifts','specialistRetail','photography'].includes(key)){
        for(const dx of [-.72,.72]){
          b.box(base,.58,.26,.09,v.x+dx,1.13,face+.23);
          b.box([accent,0xab8f69][dx>0?1:0],.35,.44,.08,v.x+dx,1.48,face+.24);
          b.box(frame,.35,.09,.025,v.x+dx,1.88,face+.25);
        }
      }else if(key==='florist'){
        for(const dx of [-.75,0,.75]){
          b.box(base,.32,.32,.09,v.x+dx,1.14,face+.23);
          b.box(0x668257,.055,.45,.07,v.x+dx,1.49,face+.24);
          b.box(0xc99794,.29,.2,.08,v.x+dx,1.72,face+.25);
        }
      }else{
        // Legible opening-hours/service cards with a clear upper daylight bay.
        for(const dx of [-.65,.65]){
          b.box(frame,.85,.82,.045,v.x+dx,1.78,face+.23);
          for(let i=0;i<3;i++)b.box(accent,.53,.035,.02,v.x+dx,1.97-i*.17,face+.26);
        }
      }
      b.box(trim,v.half*2+.18,.11,.22,v.x,v.bottom-.04,face+.17);
    }
  }
  return key;
}
