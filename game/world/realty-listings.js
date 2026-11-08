// Read-only storefront view of real Repository Town addresses.
// Advertised title, legally binding sales and trust-money flows must come from
// the authoritative property registry, not manufactured by this visual model.
export function agencyBoard(life) {
  const homes=Array.isArray(life?.homes)?life.homes:[];
  const residents=Array.isArray(life?.villagers)?life.villagers:[];
  const byHome=new Map(residents.filter(v=>v.home?.coordinate).map(v=>[v.home.coordinate,v]));
  const samples=[...homes].filter(h=>h&&typeof h.coordinate==='string')
    .sort((a,b)=>a.coordinate.localeCompare(b.coordinate))
    .filter((_,i)=>i%Math.max(1,Math.floor(homes.length/9))===0).slice(0,9);
  return samples.map(home=>{
    const resident=byHome.get(home.coordinate);
    return {
      coordinate:home.coordinate,
      name:home.name||'Repository house',
      occupancy:resident?'Occupied':'Occupancy unverified',
      tenure:resident?.tenure||null,
      // No property is marked for sale without a verified listing.
      listed:false, askingPrice:null, rentPerWeek:null
    };
  });
}
export function agencyDisplayText(life) {
  const rows=agencyBoard(life);
  if(!rows.length)return 'Property records are not connected. No genuine listings can be advertised.';
  return rows.map(r=>r.coordinate+' · '+r.name+' ('+r.occupancy+')').join('; ')+
    '. This is a local property directory, not a for-sale or for-rent listing. No vendor authority or contract has been recorded.';
}
