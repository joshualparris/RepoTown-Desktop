export function discoveryProgress(houses = [], visited = new Set()) {
  const seen = new Set();
  let found = 0, total = 0, next = null;
  for (const house of houses) {
    const coordinate = house?.coordinate;
    if (typeof coordinate !== 'string' || coordinate.length === 0 || seen.has(coordinate)) continue;
    seen.add(coordinate);
    total++;
    if (visited.has(coordinate)) found++;
    else if (!next) next = house;
  }
  return { found, total, remaining: total - found, percent: total ? Math.round(found / total * 100) : 0, next };
}
