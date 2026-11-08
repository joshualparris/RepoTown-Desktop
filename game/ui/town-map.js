import { NARROMINE_MAP_DESTINATION, NARROMINE_MAP_SEARCH, drawNarromineMap, hitNarromineMap } from './narromine-map-layer.js';

// Interactive 2D town map: pinch or wheel to zoom, drag to pan, tap for a place's name and
// address, search by name/address, and follow the player. Works with touch, mouse and keys.
// World units are metres (+x east, +z south), drawn north-up.
const CSS = `
#town-map{position:fixed;inset:0;z-index:60;background:#dfe8d6;display:flex;flex-direction:column;touch-action:none;font:14px system-ui,sans-serif;color:#1d2a22}
#town-map[hidden]{display:none}
#town-map header{display:flex;gap:6px;align-items:center;padding:8px;background:#12363c;color:#fff;flex-wrap:wrap}
#town-map header b{margin-right:auto}
#town-map input{flex:1 1 160px;min-width:120px;padding:7px 9px;border-radius:7px;border:0;font:inherit}
#town-map button{min-height:38px;min-width:38px;padding:6px 10px;border-radius:7px;border:1px solid #83cbc2;background:#1d4b52;color:#fff;font:inherit}
#town-map button.map-region{background:#24615c;font-weight:600}
#town-map canvas{flex:1;width:100%;display:block;cursor:grab}
#town-map .info{position:absolute;left:10px;right:10px;bottom:10px;max-width:420px;background:#fffdf6;border:1px solid #9aa58e;border-radius:10px;padding:10px 12px;box-shadow:0 2px 10px #0003}
#town-map .info[hidden]{display:none}
#town-map .legend{position:absolute;right:10px;top:64px;background:#fffdf6e6;border-radius:8px;padding:6px 8px;font-size:12px;line-height:1.5}
@media (max-width:600px){#town-map .legend{display:none}}
`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function createTownMap({ getData, getPlayer, onOpen, onClose }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.id = 'town-map'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Town map');
  el.innerHTML = `<header><b>🗺️ Repository Town map</b><input id="town-map-search" type="search" placeholder="Search a name or address" aria-label="Search the map">
    <button id="town-map-in" aria-label="Zoom in">＋</button><button id="town-map-out" aria-label="Zoom out">－</button>
    <button id="town-map-me" title="Centre on you">📍 Me</button>
    <button id="town-map-repo" class="map-region" title="Show Repository Town">Repo Town</button>
    <button id="town-map-narromine" class="map-region" title="Show real Narromine, NSW">Narromine</button>
    <button id="town-map-close" aria-label="Close map">✕</button></header>
    <canvas aria-label="Map of Repository Town. Pinch or scroll to zoom, drag to pan, tap a place for its address."></canvas>
    <div class="legend"><div>▬ Street / road</div><div style="color:#7b5a3a">▬ Railway</div><div style="color:#4c8a3d">■ New parcel (plan D)</div><div style="color:#8a7a5a">▢ Future reserve</div><div style="color:#c0392b">● You</div></div>
    <div class="info" hidden></div>`;
  document.body.appendChild(el);
  const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d'), info = el.querySelector('.info');
  const view = { x: 0, z: 0, scale: 1 }; // scale = CSS pixels per metre
  let data = null, selected = null, timer = 0, open = false;
  const MIN = 0.35, MAX = 14;

  function size() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return r;
  }
  const W = () => canvas.getBoundingClientRect().width, H = () => canvas.getBoundingClientRect().height;
  const toScreen = (x, z) => ({ x: (x - view.x) * view.scale + W() / 2, y: (z - view.z) * view.scale + H() / 2 });
  const toWorld = (sx, sy) => ({ x: (sx - W() / 2) / view.scale + view.x, z: (sy - H() / 2) / view.scale + view.z });
  const rect = (x0, z0, x1, z1, fill, stroke, lw = 1) => {
    const a = toScreen(x0, z0), b = toScreen(x1, z1);
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y); }
  };
  const text = (t, x, z, { size = 12, color = '#1d2a22', bold = false, halo = true } = {}) => {
    const p = toScreen(x, z); ctx.font = `${bold ? '600 ' : ''}${size}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (halo) { ctx.lineWidth = 3; ctx.strokeStyle = '#ffffffd0'; ctx.strokeText(t, p.x, p.y); }
    ctx.fillStyle = color; ctx.fillText(t, p.x, p.y);
  };

  function draw() {
    if (!open) return;
    size(); data ||= getData();
    const s = view.scale;
    ctx.fillStyle = '#dfe8d6'; ctx.fillRect(0, 0, W(), H());
    // Narromine is geographically separate: draw its actual mapped features when in view.
    drawNarromineMap(ctx, { project: toScreen, view, width: W(), height: H(), scale: s, label: text });
    for (const r of data.reserves) { rect(r.x - r.w / 2, r.z - r.d / 2, r.x + r.w / 2, r.z + r.d / 2, '#e9e3cf', '#8a7a5a'); if (r.w * s > 160) text(`${r.name} (future reserve)`, r.x, r.z, { size: 11, color: '#6b5d40' }); }
    for (const f of data.fields) rect(f.x0, f.z0, f.x1, f.z1, '#cfdba8', '#9fb06a');
    for (const p of data.parcels) {
      const sel = selected?.kind === 'parcel' && selected.id === p.id;
      rect(p.x - p.w / 2, p.z - p.d / 2, p.x + p.w / 2, p.z + p.d / 2, sel ? '#f6d365' : p.use === 'park' ? '#a6d18c' : p.use === 'community' ? '#c9d2b8' : p.use === 'employment' ? '#d8cba8' : '#bfe0a8', '#4c8a3d', sel ? 2 : 0.8);
      if (s > 2.2 && p.number) text(String(p.number), p.x, p.z, { size: 10, color: '#2d4a25' });
      else if (p.use !== 'residential' && s > 0.8) text(p.label, p.x, p.z, { size: 11 });
    }
    for (const r of data.roads) {
      const hw = Math.max(r.width / 2, 1.2 / s), x0 = Math.min(r.a.x, r.b.x), x1 = Math.max(r.a.x, r.b.x), z0 = Math.min(r.a.z, r.b.z), z1 = Math.max(r.a.z, r.b.z);
      rect(x0 - (r.a.x === r.b.x ? hw : 0), z0 - (r.a.z === r.b.z ? hw : 0), x1 + (r.a.x === r.b.x ? hw : 0), z1 + (r.a.z === r.b.z ? hw : 0), r.plan ? '#5d6166' : '#6a6e72');
    }
    rect(-560, data.railZ - 1.5, 560, data.railZ + 1.5, '#7b5a3a');
    for (const b of data.buildings) {
      const sel = selected?.kind === 'building' && selected.id === b.id;
      rect(b.x - b.w / 2, b.z - b.d / 2, b.x + b.w / 2, b.z + b.d / 2, sel ? '#f6d365' : b.civic ? '#c98d5c' : '#b9a48a', sel ? '#8a5a00' : '#5b4b3b', sel ? 2 : 0.6);
      if ((b.civic && s > 1.1) || s > 3.2) text(b.name, b.x, b.z + b.d / 2 + 6 / Math.max(1, s / 2), { size: b.civic ? 11 : 10, color: '#3b2e22' });
    }
    // Street names along each road.
    for (const r of data.roads) {
      if (!r.name || s < 0.5) continue;
      const len = Math.hypot(r.b.x - r.a.x, r.b.z - r.a.z) * s;
      if (len < 90) continue;
      const mx = (r.a.x + r.b.x) / 2, mz = (r.a.z + r.b.z) / 2, vertical = r.a.x === r.b.x;
      const p = toScreen(mx, mz); ctx.save(); ctx.translate(p.x, p.y); if (vertical) ctx.rotate(-Math.PI / 2);
      ctx.font = '600 12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = '#ffffffd8'; ctx.strokeText(r.name, 0, 0); ctx.fillStyle = r.plan ? '#1f5f2c' : '#1d2a22'; ctx.fillText(r.name, 0, 0); ctx.restore();
    }
    const me = getPlayer();
    if (me) {
      const p = toScreen(me.x, me.z); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-me.yaw);
      ctx.fillStyle = '#c0392b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(7, 8); ctx.lineTo(0, 4); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    // Scale bar.
    const metres = [10, 25, 50, 100, 250, 500].find((m) => m * s >= 70) || 500;
    ctx.fillStyle = '#1d2a22'; ctx.fillRect(12, H() - 22, metres * s, 4); ctx.font = '11px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`${metres} m`, 12, H() - 30);
  }

  function hit(sx, sy) {
    const w = toWorld(sx, sy), pad = 3 / view.scale;
    const inside = (o) => Math.abs(w.x - o.x) <= o.w / 2 + pad && Math.abs(w.z - o.z) <= o.d / 2 + pad;
    const b = data.buildings.find(inside); if (b) return { kind: 'building', ...b };
    const p = data.parcels.find(inside); if (p) return { kind: 'parcel', ...p };
    const regional = hitNarromineMap(w.x, w.z, pad); if (regional) return regional;
    const road = data.roads.find((r) => { const x0 = Math.min(r.a.x, r.b.x) - r.width / 2 - pad, x1 = Math.max(r.a.x, r.b.x) + r.width / 2 + pad, z0 = Math.min(r.a.z, r.b.z) - r.width / 2 - pad, z1 = Math.max(r.a.z, r.b.z) + r.width / 2 + pad; return w.x >= x0 && w.x <= x1 && w.z >= z0 && w.z <= z1; });
    if (road) return { kind: 'road', ...road };
    const res = data.reserves.find(inside); if (res) return { kind: 'reserve', ...res };
    return null;
  }
  function show(item) {
    selected = item;
    if (!item) { info.hidden = true; draw(); return; }
    const lines = item.kind === 'parcel'
      ? [`<b>${esc(item.address || item.id)}</b>`, `${esc(item.label)} · ${Math.round(item.w)} × ${Math.round(item.d)} m (${Math.round(item.w * item.d).toLocaleString('en-AU')} m²)`, `Parcel ${esc(item.id)} · ${esc(item.status || 'master plan D')}`]
      : item.kind === 'building' ? [`<b>${esc(item.name)}</b>`, esc(item.address || ''), esc(item.detail || '')]
      : item.kind === 'narromine-place' || item.kind === 'narromine-building' || item.kind === 'region' ? [`<b>${esc(item.name)}</b>`, esc(item.address || 'Narromine, NSW'), esc(item.fact || 'Real mapped Narromine landmark')]
      : item.kind === 'road' ? [`<b>${esc(item.name || item.id)}</b>`, item.plan ? 'New master-plan road · driveable' : 'Existing town road']
      : [`<b>${esc(item.name)}</b>`, `Future land-use reserve (${esc(item.zone)}) · concept only, no road access yet`];
    info.innerHTML = lines.filter(Boolean).map((l) => `<div>${l}</div>`).join('');
    info.hidden = false; draw();
  }
  function centreOn(x, z, scale = view.scale) { view.x = x; view.z = z; view.scale = Math.min(MAX, Math.max(MIN, scale)); draw(); }
  function zoomAt(f, sx = W() / 2, sy = H() / 2) {
    const before = toWorld(sx, sy); view.scale = Math.min(MAX, Math.max(MIN, view.scale * f));
    const after = toWorld(sx, sy); view.x += before.x - after.x; view.z += before.z - after.z; draw();
  }

  // Pointer input: one pointer pans (or taps), two pointers pinch-zoom about their midpoint.
  const pts = new Map(); let pinch = null, moved = 0, last = null;
  canvas.addEventListener('pointerdown', (e) => { try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic or already-released pointer */ } pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY }); moved = 0; last = { x: e.offsetX, y: e.offsetY }; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale }; } });
  canvas.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, d = Math.hypot(a.x - b.x, a.y - b.y);
      const target = Math.min(MAX, Math.max(MIN, pinch.scale * d / Math.max(1, pinch.d)));
      zoomAt(target / view.scale, mid.x, mid.y); moved += 10; return;
    }
    const dx = e.offsetX - prev.x, dy = e.offsetY - prev.y; moved += Math.abs(dx) + Math.abs(dy);
    view.x -= dx / view.scale; view.z -= dy / view.scale; draw();
  });
  const end = (e) => {
    if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (pts.size === 0 && moved < 8 && e.type === 'pointerup' && last) show(hit(last.x, last.y));
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.offsetX, e.offsetY); }, { passive: false });
  el.querySelector('#town-map-in').onclick = () => zoomAt(1.5);
  el.querySelector('#town-map-out').onclick = () => zoomAt(1 / 1.5);
  el.querySelector('#town-map-me').onclick = () => { const me = getPlayer(); if (me) centreOn(me.x, me.z, Math.max(view.scale, 2)); };
  el.querySelector('#town-map-repo').onclick = () => { show(null); centreOn(0, 0, 1.4); };
  el.querySelector('#town-map-narromine').onclick = () => { centreOn(NARROMINE_MAP_DESTINATION.x, NARROMINE_MAP_DESTINATION.z, 1.8); show(NARROMINE_MAP_DESTINATION); };
  el.querySelector('#town-map-close').onclick = () => close();
  const search = el.querySelector('#town-map-search');
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = search.value.trim().toLowerCase(); if (!q) return;
    const all = [...data.buildings.map((b) => ({ kind: 'building', ...b })), ...data.parcels.map((p) => ({ kind: 'parcel', ...p })), ...data.roads.filter((r) => r.name).map((r) => ({ kind: 'road', ...r, x: (r.a.x + r.b.x) / 2, z: (r.a.z + r.b.z) / 2 })), ...NARROMINE_MAP_SEARCH];
    const found = all.find((o) => [o.name, o.address, o.id].some((v) => String(v || '').toLowerCase() === q))
      || all.find((o) => [o.name, o.address, o.id].some((v) => String(v || '').toLowerCase().includes(q)));
    if (found) { centreOn(found.x, found.z, Math.max(view.scale, 3)); show(found); } else { info.innerHTML = `<div>No place matches “${esc(search.value)}”.</div>`; info.hidden = false; }
  });
  // While open, the map owns the keyboard (except typing in its search box): no walking behind it.
  addEventListener('keydown', (e) => {
    if (!open) return;
    // Let the search box receive its own typing; the game's input already ignores text fields.
    if (e.target === search && e.key !== 'Escape') return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.target !== search) { if (e.key === '+' || e.key === '=') zoomAt(1.5); if (e.key === '-') zoomAt(1 / 1.5); }
    e.stopImmediatePropagation();
  }, true);
  addEventListener('resize', () => draw());

  function openMap() {
    if (open) return; open = true; data = getData(); el.hidden = false; onOpen?.();
    const me = getPlayer(); if (me) { view.x = me.x; view.z = me.z; } view.scale = view.scale === 1 ? 1.4 : view.scale;
    draw(); clearInterval(timer); timer = setInterval(draw, 400);
  }
  function close() { if (!open) return; open = false; el.hidden = true; clearInterval(timer); onClose?.(); }
  return { open: openMap, close, isOpen: () => open, view, select: (q) => { search.value = q; search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); return selected; }, selected: () => selected, zoomAt, centreOn, draw };
}
