// Exact horizontal outline for the *rendered* yawed rectangular building mesh.
// Three.js BoxGeometry.rotateY(yaw) transforms x by +sin(yaw)*z and
// z by -sin(yaw)*x. Preserve the existing AABB as CollisionWorld's fast broadphase.
export function rotatedBoxFootprint(x, z, width, depth, yaw = 0) {
  if (![x,z,width,depth,yaw].every(Number.isFinite) || width <= 0 || depth <= 0)
    throw new RangeError('rotatedBoxFootprint needs finite coordinates, positive dimensions and yaw');
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [
    [-width/2,-depth/2], [width/2,-depth/2],
    [width/2,depth/2], [-width/2,depth/2],
  ].map(([dx,dz]) => [x + c*dx + s*dz, z - s*dx + c*dz]);
}

export function rotatedBoxCollider({ x, z, w, d, yaw = 0, rect }, source = 'rotated-building') {
  if (!rect || ![rect.x0,rect.x1,rect.z0,rect.z1].every(Number.isFinite))
    throw new TypeError('rotatedBoxCollider needs the existing broadphase rect');
  // The layout source already carries the measured/rendered polygon: reuse it exactly.
  // Derive only as fallback for future POI builders that supply an AABB alone.
  return { ...rect, poly: rect.poly || rotatedBoxFootprint(x, z, w, d, yaw), source };
}
