import * as THREE from 'three';

// Text sprites drawn to canvas. Sizes are tuned per kind so room names read from
// the doorway while prop labels stay small enough not to clutter the view.
const STYLE = {
  house: { font: 'bold 44px system-ui', bg: '#101a2cee', fg: '#ffffff', scale: 0.0075 },
  street: { font: 'bold 40px system-ui', bg: '#1f5135ee', fg: '#ffffff', scale: 0.012 },
  room: { font: 'bold 36px system-ui', bg: '#00000099', fg: '#fff6d8', scale: 0.0062 },
  interactive: { font: 'bold 30px system-ui', bg: '#0f4a6add', fg: '#ffffff', scale: 0.0052 },
  prop: { font: '28px system-ui', bg: '#2a2a2acc', fg: '#f2f2f2', scale: 0.0046 },
};

export function makeLabel(text, kind = 'prop') {
  const st = STYLE[kind] || STYLE.prop;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = st.font;
  const shown = text.length > 48 ? text.slice(0, 47) + '…' : text;
  const w = Math.ceil(ctx.measureText(shown).width) + 36, h = 64;
  c.width = w; c.height = h;
  ctx.font = st.font;
  ctx.fillStyle = st.bg;
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, 14); ctx.fill();
  if (kind === 'interactive') { ctx.strokeStyle = '#7fe0ff'; ctx.lineWidth = 4; ctx.stroke(); }
  ctx.fillStyle = st.fg; ctx.textBaseline = 'middle';
  ctx.fillText(shown, 18, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Labels must obey the same depth buffer as walls, columns and shopfronts.
  // depthWrite stays off so transparent letter edges do not occlude scenery.
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, depthWrite: false, depthTest: true, alphaTest: 0.04,
  }));
  sprite.scale.set(w * st.scale, h * st.scale, 1);
  // Long names should not extend over adjacent rooms, doors or buildings.
  const maxWidth = {house:4.6,street:6,room:3.4,interactive:2.9,prop:2.6}[kind] || 2.6;
  if (sprite.scale.x > maxWidth) {
    const factor = maxWidth / sprite.scale.x;
    sprite.scale.multiplyScalar(factor);
  }
  sprite.userData.text = text;
  sprite.userData.labelKind = kind;
  return sprite;
}

// Keep the entire camera-facing sign within a room, not just its centre.
// A sprite is a billboard, so its horizontal half-width may extend in X or Z
// depending on where the player stands. Reserve that margin on both axes.
export function containLabel(sprite, room, inset = 0.24) {
  const width = room.x1 - room.x0, depth = room.z1 - room.z0;
  const available = Math.max(0.25, Math.min(width, depth) - inset * 2);
  if (sprite.scale.x > available) sprite.scale.multiplyScalar(available / sprite.scale.x);
  const margin = sprite.scale.x / 2 + inset;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  sprite.position.x = clamp(sprite.position.x, room.x0 + margin, room.x1 - margin);
  sprite.position.z = clamp(sprite.position.z, room.z0 + margin, room.z1 - margin);
  if (Number.isFinite(room.y1)) {
    const half = sprite.scale.y / 2;
    sprite.position.y = clamp(sprite.position.y, (room.y0 ?? 0) + half + 0.12, room.y1 - half - 0.12);
  }
  return sprite;
}

export function disposeLabel(sprite) {
  sprite.material.map?.dispose();
  sprite.material.dispose();
}
