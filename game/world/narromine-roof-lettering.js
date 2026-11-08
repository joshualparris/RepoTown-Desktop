// Exact roof-slope projection for the historic ROYAL HOTEL painted lettering.
// Uses the SAME oriented frame, eave height and pitch as hipRoof() in narromine.js.
// The mapped roof geometry is evidence-grounded; the sign's original paint placement
// and scale are photo interpretations, NOT a surveyed offset.
export function roofLetteringSurface({ L, W, cx, cz, yaw }, wallHeight, pitch, lift = 0.10) {
  if (![L, W, cx, cz, yaw, wallHeight, pitch, lift].every(Number.isFinite)) return null;
  if (L <= 0 || W <= 0 || pitch <= 0 || pitch >= Math.PI / 2 || lift <= 0) return null;
  const slopeOnX = W > L;
  const half = Math.min(L, W) / 2;
  const ridgeLength = Math.abs(W - L);
  const textSpan = Math.min(12, ridgeLength * 0.88);
  if (textSpan <= 2.5) return null;
  const rise = half * Math.tan(pitch);
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const place = (alongRidge, fractionUpSlope) => {
    // West-facing/south-facing hip slope, 10 cm outward along its normal.
    const across = -half + half * fractionUpSlope - Math.sin(pitch) * lift;
    const lx = slopeOnX ? across : alongRidge;
    const lz = slopeOnX ? alongRidge : across;
    return [cx + lx * cos + lz * sin,
      wallHeight + rise * fractionUpSlope + Math.cos(pitch) * lift,
      cz - lx * sin + lz * cos];
  };
  return Object.freeze({
    positions: Object.freeze([
      ...place(-textSpan / 2, 0.12), ...place(textSpan / 2, 0.12),
      ...place(-textSpan / 2, 0.88), ...place(textSpan / 2, 0.88),
    ]),
    uv: Object.freeze([0, 0, 1, 0, 0, 1, 1, 1]),
    triangles: Object.freeze([0, 2, 1, 1, 2, 3]),
    liftM: lift,
    ridgeLengthM: ridgeLength,
    textSpanM: textSpan,
    slopeOnX,
  });
}
