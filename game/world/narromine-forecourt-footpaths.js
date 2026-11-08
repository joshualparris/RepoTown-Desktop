// Clip generic mapped footpath fragments around a surveyed/detail-site forecourt.
// The prior centroid test either hid entire polygon fragments or left their corners
// drawn across the hotel forecourt. This operates on surface polygons only:
// no road, hotel, collider, entrance, or mapped path geometry is changed.
import { subtractConvex } from './narromine-road-surfaces.js';

const EPS = 1e-8;
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) -
  (b[1] - a[1]) * (c[0] - a[0]);
const signedArea = pts => pts.reduce((sum, p, i) => {
  const q = pts[(i + 1) % pts.length];
  return sum + p[0] * q[1] - q[0] * p[1];
}, 0) / 2;
const area = pts => Math.abs(signedArea(pts));

// Ear clipping decomposes the existing seven-point concave hotel outline into
// CCW triangles, which the road renderer's proven convex subtraction can handle.
// No rectangular bounding-box approximation and no new surface geometry inside.
export function forecourtTriangles(polygon) {
  if (polygon.length < 3) throw Error('Forecourt polygon requires three vertices');
  const pts = signedArea(polygon) >= 0 ? polygon.slice() : polygon.slice().reverse();
  if (area(pts) < EPS) throw Error('Degenerate forecourt outline');
  const remaining = pts.map((_, i) => i), triangles = [];
  while (remaining.length > 3) {
    let found = false;
    for (let i = 0; i < remaining.length; i++) {
      const a = pts[remaining[(i - 1 + remaining.length) % remaining.length]];
      const b = pts[remaining[i]];
      const c = pts[remaining[(i + 1) % remaining.length]];
      if (cross(a, b, c) <= EPS) continue;
      // A valid ear must contain no other vertex, including on its diagonal.
      const blocked = remaining.some(index => {
        const p = pts[index];
        return p !== a && p !== b && p !== c &&
          cross(a, b, p) >= -EPS &&
          cross(b, c, p) >= -EPS &&
          cross(c, a, p) >= -EPS;
      });
      if (blocked) continue;
      triangles.push([a, b, c]);
      remaining.splice(i, 1);
      found = true;
      break;
    }
    if (!found) throw Error('Self-intersecting or degenerate forecourt polygon');
  }
  triangles.push(remaining.map(i => pts[i]));
  if (Math.abs(triangles.reduce((sum, t) => sum + area(t), 0) - area(pts)) > 1e-5)
    throw Error('Forecourt triangle area mismatch');
  return triangles;
}

export function clipFootpathsOutsideForecourt(footpaths, forecourt) {
  const cutters = forecourtTriangles(forecourt);
  return footpaths.flatMap(surface => {
    let fragments = [surface.pts];
    for (const triangle of cutters)
      fragments = fragments.flatMap(fragment => subtractConvex(fragment, triangle));
    // Retain original paving / kind for every surviving piece.
    return fragments.filter(pts => area(pts) > 1e-5)
      .map(pts => ({ ...surface, pts }));
  });
}
