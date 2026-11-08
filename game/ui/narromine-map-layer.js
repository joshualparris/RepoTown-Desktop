// A lightweight, geographic 2D overlay for the separate driveable Narromine town.
// Uses the exact same projected OSM/NSW-traced geometry as the 3D scene.
// No invented roads, private addresses, external maps, or runtime network requests.
import {
  ARRIVAL, HIGHWAY, REGION, STREETS, BUILDINGS, DETAILED, AREAS, WATER, RAIL,
  PLACES, inPoly,
} from '../world/narromine-layout.js';

export const NARROMINE_MAP_DESTINATION = Object.freeze({
  id: 'narromine', kind: 'region', name: 'Narromine', address: 'Narromine, NSW',
  x: ARRIVAL.x, z: ARRIVAL.z,
  fact: 'Real mapped Narromine, connected by the in-game shortened Mitchell Highway. Select a landmark to explore.',
});

const labelledPlaces = PLACES.map((p) => Object.freeze({
  ...p, id: 'narromine:' + p.name, kind: 'narromine-place',
}));
const coles = PLACES.find((p) => p.name === 'Coles');
const arcadeSite = coles ? [{
  id: 'narromine:kieraths', kind: 'narromine-place',
  name: "Kierath's Shopping Square", address: 'Beside Coles, Dandaloo Street, Narromine',
  x: coles.x, z: coles.z,
  fact: 'Approximate shopping-square site marker shared with Coles, NOT a surveyed arcade entrance. The shop/courtyard model is still being refined.',
}] : [];
export const NARROMINE_MAP_SEARCH = Object.freeze([
  NARROMINE_MAP_DESTINATION, ...labelledPlaces, ...arcadeSite,
]);

const areaColours = {
  park: '#a7c996', cemetery: '#b0c5a1', school: '#dccda6', parking: '#afb2ad',
  retail: '#d9ceba', industrial: '#c8bfb5', sports_centre: '#aac8b4',
  pitch: '#a3d38d', swimming_pool: '#82bfd5',
};
const bounds = (pts) => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  return { x0, x1, z0, z1 };
};
const intersects = (pts, v) => {
  if (!pts?.length) return false;
  const b = bounds(pts);
  return b.x1 >= v.x0 && b.x0 <= v.x1 && b.z1 >= v.z0 && b.z0 <= v.z1;
};
const namedLabels = new Set([
  'Coles', 'Narromine Post Office', 'Royal Hotel', 'Narromine Hotel',
  'Narromine Pharmacy', 'Narromine RSL Club', 'Narromine Aviation Museum',
]);

export function drawNarromineMap(ctx, { project, view, width, height, scale, label }) {
  const v = { x0: view.x - width / (2 * scale), x1: view.x + width / (2 * scale),
    z0: view.z - height / (2 * scale), z1: view.z + height / (2 * scale) };
  const paint = (pts, colour, stroke = null, lw = 1) => {
    if (!intersects(pts, v)) return;
    ctx.beginPath();
    pts.forEach(([x, z], i) => { const p = project(x, z); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    ctx.closePath();
    ctx.fillStyle = colour; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  };
  const line = (pts, colour, lw) => {
    if (!intersects(pts, v)) return;
    ctx.beginPath();
    pts.forEach(([x, z], i) => { const p = project(x, z); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    ctx.strokeStyle = colour; ctx.lineWidth = lw; ctx.stroke();
  };
  // The connecting highway also gives an overview landmark between the two towns.
  if (HIGHWAY.x1 >= v.x0 && HIGHWAY.x0 <= v.x1 && HIGHWAY.z >= v.z0 - 12 && HIGHWAY.z <= v.z1 + 12) {
    line([[HIGHWAY.x0, HIGHWAY.z], [HIGHWAY.x1, HIGHWAY.z]], '#bfb5a2', Math.max(2, (HIGHWAY.width + 5) * scale));
    line([[HIGHWAY.x0, HIGHWAY.z], [HIGHWAY.x1, HIGHWAY.z]], '#66696b', Math.max(1.5, HIGHWAY.width * scale));
  }
  if (REGION.x1 < v.x0 || REGION.x0 > v.x1 || REGION.z1 < v.z0 || REGION.z0 > v.z1) return;

  for (const a of AREAS) paint(a.pts, areaColours[a.kind] || '#cbd8bd');
  for (const w of WATER) {
    if (w.closed) paint(w.pts, '#70a9c8');
    else line(w.pts, '#70a9c8', Math.max(1.5, (w.kind === 'river' ? 20 : 4) * scale));
  }
  for (const r of RAIL) line(r.pts, '#856b4e', Math.max(1.5, 2.5 * scale));
  for (const s of STREETS) {
    line(s.pts, '#bbb5a8', Math.max(2, (s.width + 3.5) * scale));
    line(s.pts, s.kind === 'service' ? '#888986' : '#666b6c', Math.max(1.5, s.width * scale));
  }
  for (const b of BUILDINGS) paint(b.pts, '#c9bba8', '#786d60', 0.6);
  for (const d of DETAILED) for (const p of d.parts) {
    const colour = d.id === 'dandaloo-82' ? '#b9c2c5' :
      d.id === 'narromine-post-office' ? '#b87860' : '#c8b9a6';
    paint(p.pts, colour, '#786d60', 0.85);
  }
  if (scale >= 0.65) {
    for (const p of PLACES) {
      if (p.x < v.x0 || p.x > v.x1 || p.z < v.z0 || p.z > v.z1) continue;
      const q = project(p.x, p.z);
      ctx.beginPath(); ctx.arc(q.x, q.y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#943e31'; ctx.fill();
      if (namedLabels.has(p.name)) label(p.name, p.x, p.z - 9 / scale, { size: 11, color: '#334b45', bold: true });
    }
    if (scale > 1.1) {
      const seen = new Set();
      for (const s of STREETS) {
        if (!s.name || seen.has(s.name) || !intersects(s.pts, v) || s.pts.length < 2) continue;
        const a = s.pts[0], b = s.pts[s.pts.length - 1];
        const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
        if (mx < v.x0 || mx > v.x1 || mz < v.z0 || mz > v.z1) continue;
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) * scale < 80) continue;
        seen.add(s.name);
        label(s.name, mx, mz, { size: 10, color: '#3e4f49' });
      }
    }
  }
}

export function hitNarromineMap(x, z, pad = 3) {
  const maxD = Math.max(7, pad);
  let closest = null, dist = maxD;
  for (const p of labelledPlaces) {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < dist) { closest = p; dist = d; }
  }
  if (closest) return closest;
  for (const d of DETAILED) if (d.parts.some((part) => inPoly(x, z, part.pts))) {
    return { id: d.id, kind: 'narromine-building', name: d.name, address: d.address,
      x, z, fact: 'Detailed outline traced from NSW Spatial Services imagery; wall and roof heights may be approximate.' };
  }
  return null;
}
