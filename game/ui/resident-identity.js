// Stable, public-safe names for the 188 house-resident slots.
// Coordinates determine identity, not render order, save state or PR merge order.
// Every lot on the eight original streets has a distinct display name.
const GIVEN = Object.freeze(['Ada','Bram','Cleo','Dorian','Edie','Finn','Greta','Hugo','Iris','Jasper','Kit','Lena','Milo','Nell','Otis','Pip','Quinn','Rosa','Sol','Tess','Uma','Vic','Wren','Xavi','Yara','Zed']);
const FAMILY = Object.freeze(['Anderson','Bennett','Clarke','Dawson','Ellis','Fletcher','Graham','Harris','Irwin','Jones','Kelly','Lawson','Mitchell','Nolan','Owen','Parker','Reid','Saunders','Taylor','Underwood','Vaughan','Walker','Young','Abbott','Burke','Campbell','Dean','Foster','Grant','Hughes','McKenzie']);

export function residentName(coordinate) {
  const match = /^([A-Z])([1-8])$/.exec(String(coordinate || ''));
  if (!match) return 'Town resident';
  const col = match[1].charCodeAt(0) - 65;
  const row = Number(match[2]) - 1;
  // Give each row different first and family name combinations.
  // No two lots A1–Z8 share a full name; keeping the same coordinate is stable.
  return GIVEN[(col + row * 7) % GIVEN.length] + ' ' + FAMILY[(col * 3 + row * 2) % FAMILY.length];
}
