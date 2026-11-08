// Typed, low-poly 2026 infill shopfronts. Facades face local +Z;
// townlife places and rotates them to face existing roads from north-side plots.
// Geometry is phase-one massing, NOT a completed NCC, petrol, clinical or childcare approval.
import { GLASS } from './builder.js';
import { buildAgedCareFacade } from './aged-care-facade.js';
import { buildBusInterchangeFacade } from './bus-interchange-facade.js';
import { buildVisitorInformationFacade } from './visitor-information-facade.js';
import { buildCemeteryOfficeFacade } from './cemetery-office-facade.js';
import { addGenericFacadeDetails } from './generic-facade-details.js';
import { genericProfileForSite } from './generic-business-fitouts.js';
const styles=Object.freeze({
 heritage:[0xbb8d72,0x755340,0x7e3c31],
 civic:[0xc8bda7,0x546873,0x334d60],
 health:[0xdce2e0,0x508b9c,0x35687e],
 tech:[0x536476,0x25344a,0x60c5c8],
 retail:[0xcbb597,0x7b5946,0x6f9a9c],
 nursery:[0x879a72,0x376a45,0x8db77b],
 rural:[0xb6a58a,0x65756b,0x45664c],
 workshop:[0x9ba6ae,0x485665,0x3f6170],
 sports:[0xb2b99c,0x2b6467,0x5d9c81],
 school:[0xe1bc8e,0x8d6b5b,0xc08a57],
 park:[0xc7cfbc,0x4c8565,0x72a36f],
 pool:[0xe0e7e4,0x347d9b,0x68b7cf],
 fuel:[0xece7d8,0x2e5378,0xd34b40],
 carwash:[0xe1e7e8,0x487c94,0x67b2cc],
});
export function expansionFootprint(style){
  return Object.freeze({w:style==='agedcare'?13:style==='fuel'?13:style==='nursery'?13:style==='park'?10:12,
    d:style==='agedcare'?11:style==='park'?7:style==='fuel'?11:9});
}
export function buildExpansionFacade(b,site){
 if(site.id==='busstop')return buildBusInterchangeFacade(b);
 if(site.id==='visitorcentre')return buildVisitorInformationFacade(b);
 if(site.id==='cemetery')return buildCemeteryOfficeFacade(b);
 if(site.id==='agedcare')return buildAgedCareFacade(b);
 const pal=styles[site.style]||styles.retail;
 const [wall,trim,accent]=pal,{w,d}=expansionFootprint(site.style);
 const h=site.style==='heritage'?5.1:site.style==='rural'?5:4.2;
 const face=7,centre=face-d/2;
 if(site.style==='park'||site.style==='nursery'){
   b.box(0xa7a58b,w,.09,d,0,.04,centre);
   b.box(wall,5,2.9,3.3,0,1.45,face-2.6);
   b.box(trim,5.45,.16,3.65,0,3,face-2.6);
   b.box(0x3e3830,1.35,2.25,.07,0,1.2,face-.88);
   for(const x of [-4,-2,2,4])for(const z of [1.4,3.4]){
     b.cyl(0x8e704b,.42,.35,x,.18,z);
     b.ball(accent,.56,x,.9,z);
   }
   if(site.style==='park'){
     b.box(0xb8c2b5,1.2,1.9,1.3,-2,1,4.8);
     b.box(0xd8d0bf,1.1,.16,1.4,2,1.4,3.6);
     b.box(0x4b866b,.15,2.1,.15,3,1.2,2.8);
   }
   return {w,d,front:7};
 }
 // A7-N library: civic entry and glazed reading bays instead of an opaque retail block.
 if(site.id==='library'){
   b.box(0xb8ad9c,w,.12,d,0,.06,centre);
   b.box(0xb68c6e,w,4.5,d,0,2.25,centre);
   b.box(0x6a4d3d,w+.45,.4,d+.3,0,4.7,centre);
   b.box(0x5e716f,w+.5,.68,.35,0,4.12,face-.08);
   // The entrance is a visible glazed double leaf, flanked by large reading windows.
   for(const x of [-3.8,3.8]){
     b.box(0x514e48,3.3,2.6,.11,x,2.05,face+.065);
     b.box(GLASS,3.05,2.36,.13,x,2.05,face+.13);
     b.box(0xd6c4a0,.12,2.5,.16,x,2.05,face+.23);
     b.box(0xd6c4a0,3.2,.1,.16,x,.82,face+.23);
   }
   b.box(0x4c5958,2.4,3.25,.12,0,1.68,face+.09);
   b.box(GLASS,2.12,2.9,.13,0,1.64,face+.17);
   b.box(0xd6c4a0,.09,2.9,.17,0,1.64,face+.24);
   for(const x of [-.25,.25])b.box(0xc3ae88,.045,.28,.15,x,1.5,face+.28);
   b.box(0x9baba8,3.0,.1,1.4,0,.05,face+.72);
   for(const x of [-5.7,5.7])b.box(0x6e5141,.3,4.0,.32,x,2.0,face+.1);
   return {w,d,front:7};
 }
 // B7-N: health-services storefront, readable dispensary identity and glazed entrance.
 if(site.id==='pharmacy'){
   b.box(0xc4d2d0,w,.12,d,0,.06,centre);
   b.box(0xdce5e2,w,4.3,d,0,2.15,centre);
   b.box(0x557d88,w+.35,.3,d+.3,0,4.42,centre);
   b.box(0x35687e,w+.45,.72,.4,0,3.82,face-.12);
   for(const x of [-3.7,3.7]){
     b.box(0x607f8b,3.35,2.45,.12,x,2.0,face+.07);
     b.box(GLASS,3.08,2.22,.14,x,2.0,face+.15);
     b.box(0xe8eeee,.1,2.25,.18,x,2.0,face+.23);
   }
   b.box(0x5c7d86,2.35,3.05,.12,0,1.58,face+.09);
   b.box(GLASS,2.15,2.82,.14,0,1.58,face+.17);
   b.box(0xdce8e7,.08,2.8,.17,0,1.58,face+.25);
   b.box(0x4e9688,.85,.2,.12,-5.3,3.3,face+.25);
   b.box(0x4e9688,.2,.85,.12,-5.3,3.3,face+.26);
   b.box(0xa9c5c3,3.1,.08,1.5,0,.04,face+.75);
   return {w,d,front:7};
 }
 // C7-N computer shop: glazed demo bays, broad entrance, projecting canopy.
 if(site.id==='repotech'){
   b.box(0xaab7be,w,.12,d,0,.06,centre);
   b.box(0x526676,w,4.25,d,0,2.125,centre);
   b.box(0x263b4b,w+.4,.33,d+.35,0,4.43,centre);
   b.box(0x60c5c8,w+.5,.7,.38,0,3.86,face-.1);
   for(const x of [-3.8,3.8]){
     b.box(0x263c4c,3.35,2.5,.13,x,2.05,face+.09);
     b.box(GLASS,3.12,2.3,.14,x,2.05,face+.18);
     b.box(0xb4cbd2,.1,2.4,.16,x,2.05,face+.27);
     b.box(0x395f70,1.35,.6,.15,x,1.35,face+.34);
   }
   b.box(0x243c4a,2.3,3.1,.12,0,1.6,face+.1);
   b.box(GLASS,2.08,2.9,.14,0,1.6,face+.18);
   b.box(0x91bdc4,.07,2.9,.18,0,1.6,face+.27);
   b.box(0x3a6476,4.1,.16,1.1,0,3.25,face+.65);
   b.box(0xaac3ca,3.2,.08,1.35,0,.04,face+.75);
   return {w,d,front:7};
 }
 // F7-N: independent grocer with generous street-facing produce windows.
 if(site.id==='supermarket'){
   b.box(0xb8c3b8,w,.12,d,0,.06,centre);
   b.box(0xe4e5d9,w,4.3,d,0,2.15,centre);
   b.box(0x457e65,w+.45,.35,d+.35,0,4.4,centre);
   b.box(0x467f66,w+.55,.72,.38,0,3.82,face-.12);
   for(const x of [-3.75,3.75]){
     b.box(0x426f64,3.35,2.55,.13,x,2.04,face+.09);
     b.box(GLASS,3.12,2.33,.14,x,2.04,face+.18);
     b.box(0xd8e6dc,.09,2.4,.17,x,2.04,face+.26);
     b.box(0x9b7953,2.3,.45,.45,x,.83,face+.42);
   }
   b.box(0x355e56,2.3,3.12,.12,0,1.62,face+.1);
   b.box(GLASS,2.08,2.9,.14,0,1.62,face+.18);
   b.box(0xe0ede8,.08,2.88,.17,0,1.62,face+.27);
   b.box(0x739e80,4.3,.18,1.25,0,3.18,face+.7);
   b.box(0xbccbc0,3.1,.09,1.3,0,.04,face+.72);
   return {w,d,front:7};
 }
 // H7-N: Riverbend Pathology with sheltered, step-free clinical shopfront.
 if(site.id==='pathology'){
  b.box(0x849f99,w,.12,d,0,.06,centre);
  b.box(0xc4d5cc,w,4.2,d,0,2.1,centre);
  b.box(0x2e6c70,w+.4,.36,d+.35,0,4.4,centre);
  b.box(0x2e6c70,w+.4,.74,.4,0,3.8,face-.1);
  for(const x of [-3.8,3.8]){
   b.box(0x345e68,3.5,2.8,.13,x,2.0,face+.08);
   b.box(GLASS,3.2,2.55,.14,x,2.0,face+.17);
   b.box(0xb6d2c9,3.25,.65,.16,x,1.0,face+.28);
  }
  b.box(0x2c5961,2.35,3.15,.13,0,1.62,face+.12);
  b.box(GLASS,2.16,2.92,.14,0,1.62,face+.2);
  b.box(0xb9d7d1,.08,2.9,.16,0,1.62,face+.27);
  b.box(0x9eb7ad,3.4,.15,1.1,0,3.15,face+.6);
  b.box(0xb2b5ac,3.1,.08,1.2,0,.04,face+.7);
  return {w,d,front:7};
 }
 // E7-N dental practice: light clinical facade, waiting-room glazing and level entry.
 if(site.id==='dentist'){
   b.box(0xb7c8c7,w,.12,d,0,.06,centre);
   b.box(0xe2edeb,w,4.25,d,0,2.125,centre);
   b.box(0x537f90,w+.35,.32,d+.3,0,4.42,centre);
   b.box(0x438b9a,w+.45,.7,.38,0,3.82,face-.12);
   for(const x of [-3.7,3.7]){
     b.box(0x4d7480,3.35,2.55,.12,x,2.03,face+.08);
     b.box(GLASS,3.1,2.33,.13,x,2.03,face+.16);
     b.box(0xe2edeb,.09,2.35,.15,x,2.03,face+.25);
     b.box(0x94b5b8,2.9,.65,.16,x,1.05,face+.28);
   }
   b.box(0x426975,2.32,3.1,.12,0,1.62,face+.1);
   b.box(GLASS,2.08,2.85,.14,0,1.62,face+.17);
   b.box(0xd3e7e8,.08,2.86,.16,0,1.62,face+.26);
   b.box(0x5d9eac,3.6,.16,1.2,0,3.18,face+.62);
   b.box(0xc3d4d0,3.0,.08,1.4,0,.04,face+.75);
   return {w,d,front:7};
 }
 // A6-N: Gumleaf Outfitters, country clothing and boots. Glazed display windows.
 if(site.id==='clothing'){
   b.box(0x92765d,w,.12,d,0,.06,centre);
   b.box(0xbca184,w,4.2,d,0,2.1,centre);
   b.box(0x315b49,w+.45,.42,d+.35,0,4.35,centre);
   b.box(0x315b49,w+.4,.78,.4,0,3.8,face-.1);
   for(const x of [-3.8,3.8]){
     b.box(0x5e493b,3.45,2.8,.13,x,2.0,face+.07);
     b.box(GLASS,3.25,2.58,.14,x,2.0,face+.17);
     b.box(0xc5ac8c,3.3,.48,.17,x,.96,face+.28);
     b.box(0x315b49,.1,2.6,.18,x,2.0,face+.27);
   }
   b.box(0x315b49,2.35,3.2,.14,0,1.65,face+.11);
   b.box(GLASS,2.16,2.95,.15,0,1.65,face+.2);
   b.box(0xbca184,.08,3.0,.16,0,1.65,face+.28);
   b.box(0xb98c4e,3.8,.15,1.0,0,3.15,face+.55);
   b.box(0xbca184,3.1,.08,1.15,0,.04,face+.6);
   return {w,d,front:7};
 }
 if(site.style==='fuel'){
   b.box(0x565f60,12,.07,10.8,0,.03,1.5);
   b.box(wall,7,3.6,4.2,0,1.8,1);
   b.box(trim,7.4,.28,4.5,0,3.76,1);
   b.box(trim,12.4,.34,4.5,0,4.2,5.15);
   for(const x of [-5.4,5.4])for(const z of [3.1,6.9])b.cyl(0x747b84,.12,4.0,x,2,z);
   for(const x of [-2.7,2.7]){b.box(0xe1e4e4,.72,1.25,.7,x,.75,5.8);b.box(accent,.65,.25,.72,x,1.42,5.8);}
   b.box(GLASS,4.2,1.8,.08,0,2.05,3.13);
   return {w,d,front:7};
 }
 if(site.style==='carwash'){
   b.box(0x5e6670,w,.08,d,0,.04,centre);
   for(const x of [-3.5,3.5]){
     for(const sx of [-1.6,1.6])b.box(trim,.22,3.5,.5,x+sx,1.75,2.4);
     b.box(accent,3.55,.36,5.1,x,3.65,3.4);
     b.box(GLASS,2.1,1.2,.06,x,2,2.8);
   }
   return {w,d,front:7};
 }
 if(site.style==='sports'){
   b.box(0x6b8979,w,.07,d,0,.035,centre);
   b.box(wall,9,3.7,4.3,0,1.85,1.0);
   b.box(trim,9.4,.3,4.5,0,3.85,1);
   b.box(accent,w,.07,.14,0,.09,6.5);
   for(const x of [-3.8,3.8])b.box(GLASS,1.7,1.3,.08,x,2,3.2);
   return {w,d,front:7};
 }
 // Consistent realistic parapet and window bays; varied wall, roof and signage per industry.
 b.box(wall,w,h,d,0,h/2,centre);
 b.box(trim,w+.5,.38,d+.4,0,h+.14,centre);
 b.box(accent,w+.6,.8,.43,0,h-.05,face-.15); // name fascia above shop front
 if(site.style==='rural'||site.style==='workshop'){
   b.box(0x58616b,4.1,3.1,.09,-3,1.55,face+.04);
   for(let y=.55;y<2.9;y+=.6)b.box(0xbfc5c9,4.07,.045,.1,-3,y,face+.1);
   b.box(GLASS,3.2,1.8,.08,3,2.2,face+.07);
 }else{
   for(const x of [-4,4]){
     b.box(GLASS,2.65,2.4,.08,x,2.07,face+.065);
     b.box(trim,.12,2.5,.10,x,2.1,face+.12);
     b.box(trim,2.76,.1,.1,x,.85,face+.12);
   }
   if(!genericProfileForSite(site)){
     b.box(GLASS,1.75,2.9,.09,0,1.5,face+.10);
     b.box(trim,.12,.4,.14,.7,1.5,face+.2);
   }
 }
 if(site.style==='tech')for(const x of [-4,4])b.box(0x2e6073,1.5,.65,.1,x,2.5,face+.19);
 if(site.style==='health')b.box(0x4e9688,.62,.62,.10,-5.3,3.6,face+.21);
 if(site.style==='school')for(const x of [-5,5])b.box(0x7b977c,.12,2.0,.12,x,1,face+1.6);
 if(site.style==='pool')b.box(0x4d9cbd,4,.14,1.3,0,.1,face+1.6);
 // Explicit allowlist at fallback tail: never touches a bespoke facade above.
 const genericFacade=addGenericFacadeDetails(b,site,{w,h,face,trim,accent});
 return {w,d,front:7,...(genericFacade?{genericFacade}:{})};
}
