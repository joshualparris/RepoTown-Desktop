import * as THREE from 'three';

// Real furniture models (KayKit "Furniture Bits", CC0, see assets/furniture/LICENSE-KayKit-CC0.txt).
// Loaded once in the browser; the atlas colours are baked into vertex colours so a house's furniture
// still merges into the house's single draw call. Without a browser (the Node tests) nothing loads and
// every caller falls back to its box-built furniture.
const models = new Map();   // name → { geo, size: {w,h,d} } with the model standing on y = 0, centred on x/z
let loading = null;

export const FURNITURE = [
  'armchair', 'bed_double_A', 'bed_single_A', 'cabinet_small', 'cabinet_medium', 'cabinet_medium_decorated', 'cabinet_small_decorated',
  'chair_A', 'chair_A_wood', 'chair_B', 'chair_B_wood', 'chair_C', 'chair_stool', 'chair_stool_wood', 'couch', 'couch_pillows',
  'table_small', 'table_medium', 'table_medium_long', 'table_low', 'shelf_B_large_decorated', 'shelf_B_small_decorated',
  'lamp_standing', 'lamp_table', 'pictureframe_large_A', 'pictureframe_large_B', 'pictureframe_medium', 'pictureframe_small_A',
  'pictureframe_small_B', 'pictureframe_small_C', 'cactus_medium_A', 'cactus_small_A', 'book_set', 'pillow_A',
];

export const furnitureReady = () => models.size > 0;

export function loadFurniture(base = 'assets/furniture/') {
  if (loading) return loading;
  if (typeof document === 'undefined') return (loading = Promise.resolve(0));
  loading = (async () => {
    const { GLTFLoader } = await import('../vendor/GLTFLoader.js');
    const loader = new GLTFLoader();
    let atlas = null;   // ImageData of the shared colour atlas, read once
    const readAtlas = (img) => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, c.width, c.height);
    };
    const col = new THREE.Color();
    await Promise.all(FURNITURE.map(async (name) => {
      try {
        const gltf = await loader.loadAsync(base + name + '.gltf');
        gltf.scene.updateMatrixWorld(true);
        const parts = [];
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          if (!atlas && o.material?.map?.image) atlas = readAtlas(o.material.map.image);
          let g = o.geometry.clone();
          g.applyMatrix4(o.matrixWorld);
          if (g.index) g = g; else { const idx = []; for (let i = 0; i < g.attributes.position.count; i++) idx.push(i); g.setIndex(idx); }
          for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
          if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
          const n = g.attributes.position.count, uv = g.attributes.uv, arr = new Float32Array(n * 3);
          for (let i = 0; i < n; i++) {
            let r = 0.7, gg = 0.7, b = 0.7;
            if (atlas) {
              const px = Math.min(atlas.width - 1, Math.max(0, Math.floor(uv.getX(i) * atlas.width)));
              const py = Math.min(atlas.height - 1, Math.max(0, Math.floor(uv.getY(i) * atlas.height)));
              const o4 = (py * atlas.width + px) * 4;
              col.setRGB(atlas.data[o4] / 255, atlas.data[o4 + 1] / 255, atlas.data[o4 + 2] / 255, THREE.SRGBColorSpace);
              r = col.r; gg = col.g; b = col.b;
            }
            arr[i * 3] = r; arr[i * 3 + 1] = gg; arr[i * 3 + 2] = b;
          }
          g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
          parts.push(g);
        });
        if (!parts.length) return;
        const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
        const geo = parts.length === 1 ? parts[0] : mergeGeometries(parts, false);
        geo.computeBoundingBox();
        const bb = geo.boundingBox;
        geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);   // stand on the floor, centred
        geo.computeBoundingBox();
        const s = new THREE.Vector3(); geo.boundingBox.getSize(s);
        models.set(name, { geo, size: { w: s.x, h: s.y, d: s.z } });
      } catch (e) { /* a missing model just means the box-built fallback is used */ }
    }));
    return models.size;
  })();
  return loading;
}

// A positioned copy of a model's geometry fitted to {w,h,d} (any omitted axis follows the first given one),
// facing +z, standing at y. `tint` (0..1) blends the model's colours toward `color`. Null when not loaded.
export function modelGeometry(name, { w, h, d, color, tint = 0.3, mirror = false } = {}) {
  const m = models.get(name);
  if (!m) return null;
  const uni = w ? w / m.size.w : h ? h / m.size.h : d ? d / m.size.d : 1;
  const sx = (w ? w / m.size.w : uni) * (mirror ? -1 : 1), sy = h ? h / m.size.h : uni, sz = d ? d / m.size.d : uni;
  const g = m.geo.clone();
  g.scale(sx, sy, sz);
  if (mirror) { const idx = g.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 1]; idx[i + 1] = t; } }
  if (color !== undefined && tint > 0) {
    const c = new THREE.Color(color), a = g.attributes.color;
    for (let i = 0; i < a.count; i++) a.setXYZ(i, a.getX(i) * (1 - tint) + c.r * tint, a.getY(i) * (1 - tint) + c.g * tint, a.getZ(i) * (1 - tint) + c.b * tint);
  }
  return g;
}
