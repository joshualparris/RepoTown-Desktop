// The OSM lane export contains roads extending tens of kilometres outside the
// modelled Narromine town. Only generate paint in the actual loaded town bounds.
// A 4 m guard band retains complete 3 m dashes straddling the playable border.
// Keep using the existing OSM coordinates; do not shift the lane centre lines.
export function shouldRenderMappedPaint(x, z, region, pad = 4) {
  if (!region || !Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(pad) || pad < 0) return false;
  return x >= region.x0 - pad && x <= region.x1 + pad &&
    z >= region.z0 - pad && z <= region.z1 + pad;
}
