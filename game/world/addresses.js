// Physical, road-relative plot addresses. Never replace legacy repository
// coordinates or the H:/B: property keys used by old saved games.
//
// In Repo Town's existing street geometry a numbered street lies immediately
// SOUTH of its row's repository houses. Thus the houses are the S frontage;
// the following row's N frontage is across that same street.
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const AUDIT_ROWS = 11; // 9-11 are planning bands, not constructed streets.
const RE_LEGACY = /^([A-Z])([1-8])$/;
const RE_PLOT = /^([A-Z])(1[01]|[1-9])[- ]?(N|S|NORTH|SOUTH)$/i;
export function houseAddress(coordinate) {
  const m = RE_LEGACY.exec(String(coordinate || '').toUpperCase());
  // Test harnesses and older fixture saves may contain synthetic IDs (e.g. H0).
  // Leave those untouched rather than fabricating an invalid physical plot.
  if (!m) return String(coordinate || '').toUpperCase();
  return m[1] + m[2] + '-S';
}
export function placeAddress(place) {
  if (!place || !LETTERS.includes(place.col) || place.col.length !== 1) throw new Error('Invalid site column');
  if(place.side==='north'){
    if(!Number.isInteger(place.row)||place.row<2||place.row>7)throw new Error('North-facing infill must use an already built road (rows 2–7)');
    return place.col+place.row+'-N';
  }
  return place.side === 'south' ? place.col + '9-N' : place.col + '8-S';
}
export function parseTownAddress(value) {
  const raw = String(value || '').trim().toUpperCase();
  const m = RE_PLOT.exec(raw);
  if (m) {const side=m[3][0];return { address:m[1]+m[2]+'-'+side, col:m[1], row:Number(m[2]), side, legacy:false };}
  const l = RE_LEGACY.exec(raw);
  if (l) return { address:l[0]+'-S', col:l[1], row:Number(l[2]), side:'S', legacy:true };
  return null;
}
// Resolve new visible deeds back to historical H: keys for sleeping and ownership.
// Never reinterpret an explicit north-only candidate as a south-side house.
export function legacyHouseCoordinate(address) {
  const parsed=parseTownAddress(address);
  if (!parsed) return String(address || '').trim().toUpperCase();
  return parsed.side==='S' && parsed.row<=8 ? parsed.col+parsed.row : null;
}
export function auditTownSlots(houses, places) {
  const slots = new Map();
  const set = (addr, change) => {
    const before = slots.get(addr);
    if (!before) throw new Error('Plot outside audited bounds: ' + addr);
    if (before.kind === 'house' || before.kind === 'site') throw new Error('Double-booked building plot: ' + addr);
    slots.set(addr, { ...before, ...change });
  };
  for (let row=1; row<=AUDIT_ROWS; row++) {
    for (const col of LETTERS) for (const side of ['N','S']) {
      const address = col+row+'-'+side;
      let kind='not-surveyed', note='No building in this registry; yard, clearance and utility survey required';
      if (row===1 && side==='N') { kind='boundary-not-surveyed'; note='Northern edge of existing house grid; not confirmed buildable'; }
      if (row===8 && side==='N') { kind='railway'; note='Existing rail line and railway clearance — not available for buildings'; }
      if (row===9 && side==='N') { kind='unassigned'; note='South side of existing row-[address redacted]: site registry will locate civic buildings'; }
      if (row===9 && side==='S') { kind='unbuilt-not-surveyed'; note='Behind row-9 north-facing sites. No row-[address redacted] has been built; check crop fields and yard footprints'; }
      if (row===9 && side==='S' && ('BTUVWXY'.includes(col))) { kind='farm-field'; note='Active farm field behind street frontage — protected agricultural use'; }
      if (row===10) { kind='planning-only'; note='Agricultural perimeter/planning band; not a surveyed street or vacant legal plot'; }
      if (row===11) { kind='planning-only'; note='Perimeter beyond built streets; not a surveyed street or vacant legal plot'; }
      slots.set(address,{address,row,col,side,kind,note});
    }
  }
  for (const h of houses) set(houseAddress(h.coordinate), { kind:'house', legacy:h.coordinate, name:h.name||'Repository house' });
  for (const p of places) set(placeAddress(p), { kind:'site', id:p.id, name:p.name, siteKind:p.kind, note:p.side==='south'?'Across existing row-[address redacted]':p.side==='north'?'New infill facing existing road '+(p.row-1)+' — no new street constructed':'On original row-8 lots' });
  const values=[...slots.values()];
  const count=(kind)=>values.filter(s=>s.kind===kind).length;
  return { slots:values, counts:{total:values.length,houses:count('house'),sites:count('site'),railway:count('railway'),fields:count('farm-field'),unbuiltNotSurveyed:count('unbuilt-not-surveyed'),notSurveyed:count('not-surveyed')+count('boundary-not-surveyed'),planningOnly:count('planning-only')} };
}
