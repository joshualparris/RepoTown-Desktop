// RTBUILD-016 — authored *fictional* regional NSW small-household aged-care annex.
// This compact infill plot is not a surveyed Yeoval/Bracken House plan or certified care home.
export const AGED_CARE = Object.freeze({
  w:13, d:11, front:7, rear:-4, centre:1.5, corridorHalf:1.3,
  entry:{x:0,z:5}, exit:{x0:-1.13,x1:1.13,z0:6.85,z1:8.2},
  rooms:Object.freeze([
    {id:'foyer',name:'Welcome and reception',x0:-6.4,x1:6.4,z0:1.1,z1:6.9},
    {id:'lounge',name:'Living and activities',x0:-6.3,x1:-1.5,z0:1.2,z1:6.8},
    {id:'dining',name:'Dining and kitchenette',x0:1.5,x1:6.3,z0:1.2,z1:6.8},
    {id:'room1',name:'Resident bedroom one',x0:-6.3,x1:-1.45,z0:-3.9,z1:1.0},
    {id:'room2',name:'Resident bedroom two',x0:1.45,x1:6.3,z0:-3.9,z1:1.0},
    {id:'corridor',name:'Resident passage and handover',x0:-1.3,x1:1.3,z0:-3.8,z1:1.4}
  ]),
  // Clear walkable 1.38 m gaps at each bedroom doorway, not decorative door decals.
  bedroomDoors:Object.freeze([{x:-1.4,z0:-2.25,z1:-0.87},{x:1.4,z0:-2.25,z1:-0.87}]),
  references:Object.freeze([
    'https://www.health.gov.au/resources/publications/national-aged-care-design-principles-and-guidelines',
    'https://www.upa.org.au/locations/dubbo/yeoval-aged-care/',
    'https://www.myagedcare.gov.au/find-a-provider/search/5jt9znlp-united-protestant-association-of-nsw-limited/aged-care-homes/bracken-house-dubbo-nkm7wg'
  ])
});
