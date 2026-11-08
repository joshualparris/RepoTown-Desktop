// Tap-to-walk (docs/RUNESCAPE_ROADMAP.md, engine step 2): A* over a walkable grid laid on the
// town's real colliders, then shortened to the fewest straight legs that stay clear. Walking
// itself stays free and smooth; the grid only plans the route. Pure logic, no three.js:
// `blocked(x, z)` says whether a body standing there would hit something.
export const CELL = 0.5;
// Enough for detours of a few hundred metres (round the rail corridor to the level crossing).
const MAX_NODES = 40000;
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

// Route from `from` to `to` (or to the nearest reachable cell within `near` metres of it).
// Returns [{x, z}, …] ending at the goal, [] if already there, or null if no route.
export function findPath(from, to, blocked, { near = 0, maxNodes = MAX_NODES } = {}) {
  const sx = Math.round(from.x / CELL), sz = Math.round(from.z / CELL);
  const gx = Math.round(to.x / CELL), gz = Math.round(to.z / CELL);
  const reach = Math.max(near / CELL, 0.75);
  const atGoal = (x, z) => Math.hypot(x - gx, z - gz) <= reach && (near > 0 || !blocked(x * CELL, z * CELL));
  if (atGoal(sx, sz)) return [];
  const key = (x, z) => x * 100003 + z;
  const h = (x, z) => { const dx = Math.abs(x - gx), dz = Math.abs(z - gz); return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz); };
  const open = heap(), came = new Map(), cost = new Map([[key(sx, sz), 0]]);
  open.push({ x: sx, z: sz, g: 0, f: h(sx, sz) });
  const free = new Map(), isFree = (x, z) => { const k = key(x, z); if (!free.has(k)) free.set(k, !blocked(x * CELL, z * CELL)); return free.get(k); };
  let expanded = 0;
  while (open.size() && expanded++ < maxNodes) {
    const cur = open.pop();
    if (cur.g > cost.get(key(cur.x, cur.z))) continue;
    if (atGoal(cur.x, cur.z)) return smooth(from, unwind(came, key, cur.x, cur.z, sx, sz), blocked);
    for (const [dx, dz, c] of DIRS) {
      const nx = cur.x + dx, nz = cur.z + dz;
      if (!isFree(nx, nz)) continue;
      // No cutting corners past a wall: a diagonal step needs both side cells clear.
      if (dx && dz && (!isFree(cur.x + dx, cur.z) || !isFree(cur.x, cur.z + dz))) continue;
      const g = cur.g + c, k = key(nx, nz);
      if (g >= (cost.get(k) ?? Infinity)) continue;
      cost.set(k, g); came.set(k, [cur.x, cur.z]); open.push({ x: nx, z: nz, g, f: g + h(nx, nz) });
    }
  }
  return null;
}
// A binary min-heap on f, so long detours stay quick on a phone.
function heap() {
  const a = [];
  return {
    size: () => a.length,
    push(n) { a.push(n); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } },
    pop() {
      const top = a[0], last = a.pop();
      if (a.length) {
        a[0] = last; let i = 0;
        for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l].f < a[m].f) m = l; if (r < a.length && a[r].f < a[m].f) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; }
      }
      return top;
    },
  };
}
function unwind(came, key, x, z, sx, sz) {
  const cells = [];
  while (x !== sx || z !== sz) { cells.push({ x: x * CELL, z: z * CELL }); [x, z] = came.get(key(x, z)); }
  return cells.reverse();
}
// Line of sight between two points, sampled every quarter cell.
export function clearLine(a, b, blocked) {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (CELL / 2)));
  for (let i = 1; i <= n; i++) if (blocked(a.x + (b.x - a.x) * i / n, a.z + (b.z - a.z) * i / n)) return false;
  return true;
}
// String-pulling: keep a waypoint only where the straight line to a later one is blocked.
function smooth(from, cells, blocked) {
  const out = []; let anchor = from, i = 0;
  while (i < cells.length) {
    let j = cells.length - 1;
    while (j > i && !clearLine(anchor, cells[j], blocked)) j--;
    out.push(cells[j]); anchor = cells[j]; i = j + 1;
  }
  return out;
}
