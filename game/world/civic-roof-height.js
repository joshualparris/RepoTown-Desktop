// Calculate a building's physical standing/collision roof top from the same
// Builder primitives used to render it. This is deliberately NOT a blanket
// world height: poles, canopies, signs and unrelated street solids must keep
// their own collision rules.
export function civicRoofTop(parts, footprint) {
  if (!Array.isArray(parts) || !footprint ||
    ![footprint.x0, footprint.x1, footprint.z0, footprint.z1].every(Number.isFinite)) return null;
  const w = footprint.x1 - footprint.x0, d = footprint.z1 - footprint.z0;
  if (w <= 0 || d <= 0) return null;
  let top = null;
  for (const geometry of parts) {
    if (!geometry || typeof geometry.computeBoundingBox !== 'function') continue;
    geometry.computeBoundingBox();
    const b = geometry.boundingBox;
    if (!b || !Number.isFinite(b.max.y)) continue;
    // A roof panel or main building block spans a significant fraction of the
    // building footprint in both axes. Thin signboards, antennas and posts do not.
    const overlapX = Math.max(0, Math.min(b.max.x, footprint.x1) - Math.max(b.min.x, footprint.x0));
    const overlapZ = Math.max(0, Math.min(b.max.z, footprint.z1) - Math.max(b.min.z, footprint.z0));
    if (overlapX < w * 0.45 || overlapZ < d * 0.45 || b.max.y < 2.2) continue;
    top = Math.max(top ?? 0, b.max.y);
  }
  // Small separation stops the feet from intersecting a horizontal roof skin.
  return top === null ? null : Math.round((top + 0.03) * 1000) / 1000;
}
