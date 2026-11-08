// Evidence-conservative, world-space surface detail for batched Narromine meshes.
// Geometry is already translated to world coordinates and mergeGeos() drops UVs.
// These compact procedural patterns therefore require no photo assets, extra meshes,
// UV rewrites or additional draw calls. Base colours remain source-controlled in
// narromine.js, narromine-facade-profiles.js and individual landmark builders.
import * as THREE from 'three';

const COLOURS = Object.freeze({
  asphalt: [0x45484b, 0x46494c, 0x47494b, 0x4a4c4e, 0x4d4f50, 0x4f5153,
    0x5a5b5a, 0x55575a, 0x4a4d50, 0x3f4244, 0x616366],
  concrete: [0xbdb6a8, 0xbdb5a8, 0xb8ac98],
  brick: [0x995741, 0x9b4b38, 0xa56f57, 0x895c4a],
  render: [0xb99178, 0xc7b8a0, 0xb9b6a9, 0xd1b79a, 0xd8cdb6,
    0xc9a98a, 0xbfc4bd, 0xd6c9a4, 0xa98a74, 0xcdb994, 0xbfae92,
    0xc2a07a, 0xd9d4c8, 0xb8bcbf, 0xe6dac2],
  metalRoof: [0x929ba0, 0x9da3a6, 0x6e3b32, 0x5a5f66, 0x8a8f8c,
    0x7a4a3a, 0x4f5a52],
  glass: [0x344c58, 0x354e5d, 0x1f272d, 0x9fb3c2],
});
const ROLE_BY_COLOUR = new Map(Object.entries(COLOURS)
  .flatMap(([kind, colours]) => colours.map(colour => [colour, kind])));

export function narromineSurfaceKind(colour) {
  return ROLE_BY_COLOUR.get(Number(colour)) ?? null;
}

// All patterns use actual world-metres, and fwidth hides sub-pixel detail.
// The slight tonal variation is a conservative visual treatment, NOT a claim
// to reproduce an individual real building's exact bricks or roof sheets.
const sharedGLSL = `
varying vec3 vNarromineSurfacePos;
varying vec3 vNarromineSurfaceNormal;
float nrHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float nrNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(nrHash(i), nrHash(i + vec2(1.0, 0.0)), f.x),
             mix(nrHash(i + vec2(0.0, 1.0)), nrHash(i + vec2(1.0)), f.x), f.y);
}
// Procedural detail finer than one fragment pixel aliases as the camera moves.
// Fade towards the noise's mean (0.5), rather than introducing a distance
// cutoff or geometry overlay that would produce visible transitions.
float nrFilteredNoise(vec2 p) {
  float pixelFootprint = max(fwidth(p.x), fwidth(p.y));
  float weight = 1.0 - smoothstep(0.45, 1.0, pixelFootprint);
  return mix(0.5, nrNoise(p), weight);
}
vec2 nrPlaneUV() {
  vec3 n = abs(normalize(vNarromineSurfaceNormal));
  return n.y > max(n.x, n.z) ? vNarromineSurfacePos.xz :
         n.x > n.z ? vNarromineSurfacePos.zy : vNarromineSurfacePos.xy;
}
float nrGridLine(vec2 uv, float width) {
  vec2 edge = min(fract(uv), 1.0 - fract(uv));
  vec2 antialias = max(fwidth(uv) * 1.3, vec2(0.001));
  vec2 seams = 1.0 - smoothstep(vec2(width), vec2(width) + antialias, edge);
  return max(seams.x, seams.y);
}
`;

const PATTERNS = Object.freeze({
  asphalt: `
    vec2 p = vNarromineSurfacePos.xz;
    float fine = nrFilteredNoise(p * 3.6);
    float broad = nrFilteredNoise(p * 0.43);
    return vec3(0.94 + 0.045 * fine + 0.025 * broad);`,
  concrete: `
    vec2 p = vNarromineSurfacePos.xz;
    float joints = nrGridLine(p / 1.65, 0.006);
    float fleck = nrFilteredNoise(p * 2.1);
    return vec3((0.975 + 0.035 * fleck) * (1.0 - 0.08 * joints));`,
  brick: `
    vec2 p = nrPlaneUV();
    float course = floor(p.y / 0.076);
    vec2 bond = vec2(p.x / 0.23 + mod(course, 2.0) * 0.5, p.y / 0.076);
    float joint = nrGridLine(bond, 0.055);
    float brickPixelFootprint = max(fwidth(bond.x), fwidth(bond.y));
    float brickWeight = 1.0 - smoothstep(0.45, 1.0, brickPixelFootprint);
    float brickVariation = mix(0.5, nrHash(vec2(floor(bond.x), course)), brickWeight);
    return vec3((0.90 + 0.17 * brickVariation) * (1.0 - 0.24 * joint));`,
  render: `
    vec2 p = nrPlaneUV();
    float variation = nrFilteredNoise(p * 0.84);
    float fine = nrFilteredNoise(p * 4.3);
    return vec3(0.962 + variation * 0.047 + fine * 0.018);`,
  metalRoof: `
    vec2 p = vNarromineSurfacePos.xz;
    float phase = p.x / 0.195;
    float visible = 1.0 - smoothstep(0.26, 0.60, fwidth(phase));
    float rib = 0.5 + 0.5 * cos(phase * 6.2831853);
    float oxidisation = nrFilteredNoise(p * 0.62);
    return vec3(0.95 + visible * 0.085 * rib + 0.025 * oxidisation);`,
  glass: `
    vec2 p = nrPlaneUV();
    float variation = nrFilteredNoise(p * 0.3);
    return vec3(0.96 + variation * 0.05);`,
});

const SURFACE_SETTINGS = Object.freeze({
  asphalt: { roughness: 0.99, metalness: 0 },
  concrete: { roughness: 0.95, metalness: 0 },
  brick: { roughness: 0.92, metalness: 0 },
  render: { roughness: 0.93, metalness: 0 },
  metalRoof: { roughness: 0.67, metalness: 0.25 },
  glass: { roughness: 0.22, metalness: 0.05 },
});

export function createNarromineSurfaceMaterial(colour, side = THREE.FrontSide) {
  const kind = narromineSurfaceKind(colour);
  if (!kind) return new THREE.MeshLambertMaterial({ color: colour, side });

  const material = new THREE.MeshStandardMaterial({
    color: colour, side, ...SURFACE_SETTINGS[kind],
  });
  material.userData.narromineSurfaceKind = kind;
  material.customProgramCacheKey = () => 'narromine-world-surface-v2:' + kind;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vNarromineSurfacePos;\nvarying vec3 vNarromineSurfaceNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvNarromineSurfacePos = transformed;\nvNarromineSurfaceNormal = normal;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + sharedGLSL + '\nvec3 narromineSurfaceFactor() {' + PATTERNS[kind] + '\n}')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= narromineSurfaceFactor();');
  };
  return material;
}
