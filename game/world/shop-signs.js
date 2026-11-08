import * as THREE from 'three';
import { lightingLevel, shopLightingOn } from './lighting.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Painted name boards for the high street: every sign is a strip in one canvas atlas and one
// merged mesh, so the whole street's lettering costs a single draw call.
// signs: [{ text, x, y, z, w, h, rotY = 0, bg = '#f3ead2', fg = '#2b2118', cross = false }]
// (x, y, z) is the board centre in town coordinates; it faces +z before rotY is applied.
const ROW = 96, WIDTH = 1024;
// WebGL's minimum guaranteed MAX_TEXTURE_SIZE is 4096. A single canvas for
// every shop previously grew to 22080 pixels and was silently downscaled.
// Keep each colour and lighting atlas below that hardware limit.
const MAX_SIGNS_PER_ATLAS = 32;
export function buildSignBoards(signs) {
  if (!signs.length || typeof document === 'undefined') return null;
  if (signs.length <= MAX_SIGNS_PER_ATLAS) return buildSignBoardBatch(signs);
  const group = new THREE.Group();
  group.name = 'shop signs';
  const batches = [];
  for (let i = 0; i < signs.length; i += MAX_SIGNS_PER_ATLAS) {
    const batch = buildSignBoardBatch(signs.slice(i, i + MAX_SIGNS_PER_ATLAS));
    group.add(batch);
    batches.push(batch);
  }
  // townlife.js updates the same public lighting callback each game minute.
  group.userData.setLighting = (...args) => {
    for (const batch of batches) batch.userData.setLighting(...args);
  };
  return group;
}
function buildSignBoardBatch(signs) {
  if (!signs.length || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH; canvas.height = ROW * signs.length;
  const c = canvas.getContext('2d');
  const parts = signs.map((s, i) => {
    const used = Math.min(WIDTH, Math.round(ROW * (s.w / s.h)));
    const y0 = i * ROW;
    c.fillStyle = s.bg || '#f3ead2'; c.fillRect(0, y0, used, ROW);
    c.strokeStyle = s.fg || '#2b2118'; c.lineWidth = 5; c.strokeRect(6, y0 + 6, used - 12, ROW - 12);
    let left = 18;
    if (s.cross) {                            // the clinic's red cross, painted beside its name
      c.fillStyle = '#c62f2f'; const m = y0 + ROW / 2;
      c.fillRect(left + 20, m - 30, 20, 60); c.fillRect(left, m - 10, 60, 20); left += 76;
    }
    c.fillStyle = s.fg || '#2b2118'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const text = s.text.toUpperCase();
    let size = 58; c.font = `bold ${size}px Georgia, 'Times New Roman', serif`;
    while (size > 18 && c.measureText(text).width > used - left - 24) { size -= 2; c.font = `bold ${size}px Georgia, 'Times New Roman', serif`; }
    c.fillText(text, (left + used - 6) / 2, y0 + ROW / 2 + 3);
    const g = new THREE.PlaneGeometry(s.w, s.h);
    const uv = g.attributes.uv, v0 = 1 - (i + 1) / signs.length, v1 = 1 - i / signs.length, u1 = used / WIDTH;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * u1, v0 + uv.getY(k) * (v1 - v0));
    g.rotateY(s.rotY || 0);
    g.translate(s.x, s.y, s.z);
    return g;
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  // Emissive so townlife.js can floodlight the boards after dark.
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshLambertMaterial({ map: texture, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 0 }));
  mesh.name = 'shop signs';
  // Baked downward wall-wash preserves painted colours and dark lettering.
  const wash = document.createElement('canvas'); wash.width=canvas.width; wash.height=canvas.height;
  const washContext=wash.getContext('2d'), washTexture=new THREE.CanvasTexture(wash);
  washTexture.colorSpace=THREE.SRGBColorSpace;
  mesh.material.emissiveMap=washTexture; mesh.material.emissive.setHex(0xffead0);
  mesh.material.emissiveIntensity=0;
  const fixtures=[];
  for(const s of signs){
    if(!s.place)continue;
    const angle=s.rotY||0, offset=.23;
    const fixture=new THREE.BoxGeometry(Math.min(s.w*.65,2.2),.10,.20);
    fixture.rotateY(angle);
    fixture.translate(s.x+Math.sin(angle)*offset,s.y+s.h/2+.12,s.z+Math.cos(angle)*offset);
    fixtures.push(fixture);
  }
  if(fixtures.length){
    mesh.add(new THREE.Mesh(mergeGeometries(fixtures),new THREE.MeshLambertMaterial({color:0x42464a})));
    fixtures.forEach(g=>g.dispose());
  }
  let lastState='';
  mesh.userData.setLighting=(dark,powered,minute)=>{
    mesh.material.emissiveIntensity=powered ? lightingLevel(dark)*.7 : 0;
    const on=signs.map(s=>!s.place||shopLightingOn(s.place,minute));
    const state=on.join(',');
    if(state===lastState)return;
    lastState=state;
    washContext.globalCompositeOperation='source-over';
    washContext.fillStyle='#000'; washContext.fillRect(0,0,WIDTH,wash.height);
    for(let i=0;i<signs.length;i++)if(on[i]){
      const y=i*ROW;
      washContext.drawImage(canvas,0,y,WIDTH,ROW,0,y,WIDTH,ROW);
      const gradient=washContext.createLinearGradient(0,y,0,y+ROW);
      gradient.addColorStop(0,'rgba(0,0,0,0.05)');gradient.addColorStop(1,'rgba(0,0,0,0.70)');
      washContext.fillStyle=gradient;washContext.fillRect(0,y,WIDTH,ROW);
    }
    washTexture.needsUpdate=true;
  };
  return mesh;
}
