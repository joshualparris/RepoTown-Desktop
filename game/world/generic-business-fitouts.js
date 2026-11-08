// Opt-in category plans replacing ONLY the old SHOP/OFFICE/WORKSHOP fallback.
// Interpretive game layouts, not surveyed interiors of real Narromine businesses.
import {REMAINING_PROFILES,REMAINING_CIVIC_SITES,REMAINING_KIND_PROFILES,LEGACY_GENERIC_CIVIC_SITES} from './generic-remaining-fitouts.js';
const S=(type,label)=>[type,label,{do:'info',title:label,text:'Type-appropriate simulated workstation; the real premises have not been surveyed.',station:true}];
const room=(name,props,w=10,d=8)=>({name,w,d,props});
export const GENERIC_PROFILES=Object.freeze({
  ...REMAINING_PROFILES,
  salon:{title:'Styling salon',floor:0xb6a796,walls:0xe9e1d4,accent:0x566e68,
    rooms:[room('Styling floor',[S('salonStation','Styling station'),'salonStation','salonStation','mirror','cashRegister','chair'],12,10),
      room('Wash and colour',[S('salonWash','Wash station'),'salonWash','basin','cabinet','foldingBench']),
      room('Staff and linen',['washingMachine','cabinet','coffeeMachine','chair'],8,7)]},
  beauty:{title:'Beauty studio',floor:0xc4b6aa,walls:0xeee4df,accent:0x927b7c,
    rooms:[room('Reception and consultation',[S('counter','Consultation reception'),'chair','chair','mirror','shelf']),
      room('Private treatment room',[S('treatmentCouch','Treatment couch'),'basin','cabinet','stool','lamp']),
      room('Clean linen and preparation',['foldingBench','cabinet','washingMachine'],8,7)]},
  clothing:{title:'Clothing showroom',floor:0xad9273,walls:0xe9e2d6,accent:0x52695b,
    rooms:[room('Clothing showroom',[S('cashRegister','Sales counter'),'garmentRail','garmentRail','garmentRail','mirror'],12,10),
      room('Fitting room',['mirror','bench','garmentRail'],7,7),
      room('Stock and dispatch',[S('foldingBench','Stock preparation'),'shelf','crates'],8,7)]},
  laundry:{title:'Laundry',floor:0x929d9b,walls:0xe1e9e5,accent:0x4d7d8d,
    rooms:[room('Wash and dry',[S('laundryStack','Laundry service station'),'laundryStack','laundryStack','laundryStack','bench'],12,10),
      room('Folding and collection',[S('foldingBench','Folding and collection'),'foldingBench','shelf','trolley']),
      room('Service and supplies',['basin','cabinet','shelf'],7,7)]},
  property:{title:'Property office',floor:0xb8ac99,walls:0xe7e5dc,accent:0x5d737a,
    rooms:[room('Listings and reception',[S('counter','Property reception'),'propertyDisplay','propertyDisplay','chair','chair'],11,9),
      room('Private consultation',[S('desk','Consultation desk'),'computer','chair','chair','filingCabinet']),
      room('Records and staff',['filingCabinet','cabinet','coffeeMachine'],8,7)]},
  employment:{title:'Employment and training',floor:0xafa99d,walls:0xe3e8e3,accent:0x637c74,
    rooms:[room('Reception and waiting',[S('counter','Appointments and reception'),'chair','chair','noticeBoard']),
      room('Private interview',[S('desk','Interview desk'),'computer','chair','chair','filingCabinet']),
      room('Job-search and training',[S('desk','Job-search workstation'),'computer','desk','computer','noticeBoard'],11,9)]},
  rural:{title:'Rural supplies',floor:0x92918a,walls:0xe2dece,accent:0x6c7c53,
    rooms:[room('Feed and farm supplies',[S('cashRegister','Rural supplies counter'),'feedMerchandise','feedMerchandise','shelf'],12,10),
      room('Equipment and fittings',[S('workbench','Parts and service'),'irrigationStand','partsBins','toolWall']),
      room('Stock and dispatch',['feedMerchandise','crates','trolley'],10,8)]},
  irrigation:{title:'Irrigation supplies',floor:0x969b94,walls:0xe3e3d7,accent:0x577d88,
    rooms:[room('Pumps and fittings',[S('counter','Fittings counter'),'irrigationStand','irrigationStand','partsBins'],12,9),
      room('Service workshop',[S('workbench','Service bench'),'toolWall','partsBins','basin']),
      room('Parts store',['shelf','crates','irrigationStand'],9,8)]},
  homewares:{title:'Homewares shop',floor:0xb7a185,walls:0xebe5d9,accent:0x8b725b,
    rooms:[room('Homewares displays',[S('cashRegister','Sales counter'),'shelf','crockery','table','lamp'],12,10),
      room('Furniture and textiles',['sofa','garmentRail','cabinet','foldingBench'],10,9),
      room('Stock and packing',[S('workbench','Packing bench'),'shelf','crates'],9,8)]},
});
const KIND_PROFILE=Object.freeze({...REMAINING_KIND_PROFILES,hairdresser:'salon',beauty:'beauty',clothes:'clothing',
  fashion_accessories:'clothing',laundry:'laundry',estate_agent:'property',employment_agency:'employment',
  agrarian:'rural',trade:'irrigation',houseware:'homewares',second_hand:'homewares',charity:'homewares'});
// These expansion IDs were using the same generic office shell. Nothing else
// is eligible, even when a dedicated facade happens to share a style/kind.
export const GENERIC_CIVIC_SITES=Object.freeze({...REMAINING_CIVIC_SITES,hairdresser:'salon',beauty:'beauty',laundry:'laundry',
  opshop:'clothing',farmsupplies:'rural',stockfeed:'rural',irrigation:'irrigation',
  employment:'employment',homewares:'homewares'});
export const genericProfileForKind=kind=>KIND_PROFILE[kind]||null;
export const genericProfileForSite=site=>LEGACY_GENERIC_CIVIC_SITES[site.id]||
  (site.expansion===true ? GENERIC_CIVIC_SITES[site.id]||null : null);
