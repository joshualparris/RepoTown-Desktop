import {VEHICLE_DYNAMICS} from '../world/vehicle-dynamics.js';
// Hidden playtest cheat menu. Unlock: tap the HUD title five times in a row, or
// press the backtick key three times; then enter the password. The game logic is in
// src/world/cheats.js; this module only draws the panel and routes its buttons.
// The password only keeps casual players out of a debug tool; it protects nothing real.
export const CHEAT_PASSWORD = 'CHEAT123';
const CSS = `
#cheat-menu{position:fixed;inset:auto 10px 10px auto;z-index:65;width:min(360px,calc(100vw - 20px));max-height:calc(100vh - 20px);overflow:auto;background:#1b1530f2;color:#f4ecff;border:2px solid #b48cff;border-radius:12px;padding:12px;font:14px system-ui,sans-serif;box-shadow:0 4px 18px #0007}
#cheat-menu[hidden]{display:none}
#cheat-menu h2{margin:0 0 8px;font-size:16px}
#cheat-menu .row{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
#cheat-menu button{min-height:38px;padding:6px 10px;border-radius:8px;border:1px solid #b48cff;background:#3a2a66;color:#fff;font:inherit}
#cheat-menu input,#cheat-menu select{flex:1;min-width:120px;padding:7px 9px;border-radius:7px;border:0;font:inherit}
#cheat-menu .msg{min-height:1.4em;margin-top:6px;color:#ffe08a}
`;

export function createCheatMenu({ trigger, actions }) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const el = document.createElement('div'); el.id = 'cheat-menu'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Cheat menu');
  document.body.appendChild(el);
  let unlocked = false;
  try { unlocked = sessionStorage.getItem('town-cheats') === '1'; } catch { unlocked = false; }

  const say = (text) => { const m = el.querySelector('.msg'); if (m) m.textContent = text || ''; };
  function renderLock() {
    el.innerHTML = `<h2>🔒 Developer menu</h2><div class="row"><input id="cheat-password" type="password" autocomplete="off" placeholder="Password" aria-label="Cheat password"><button id="cheat-unlock">Unlock</button><button id="cheat-close">✕</button></div><div class="msg"></div>`;
    const input = el.querySelector('#cheat-password');
    const tryUnlock = () => {
      if (input.value.trim().toUpperCase() === CHEAT_PASSWORD) {
        unlocked = true; try { sessionStorage.setItem('town-cheats', '1'); } catch { /* private mode */ }
        renderMenu(); say('Cheats unlocked for this session.');
      } else { say('Wrong password.'); input.select(); }
    };
    el.querySelector('#cheat-unlock').onclick = tryUnlock;
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') tryUnlock(); if (e.key === 'Escape') close(); });
    el.querySelector('#cheat-close').onclick = close;
    setTimeout(() => input.focus(), 0);
  }
  function renderMenu() {
    el.innerHTML = `<h2>🧪 Cheat menu</h2>
      <div class="row"><label for="cheat-vehicle">Vehicle model</label><select id="cheat-vehicle" aria-label="Vehicle to summon">${Object.entries(VEHICLE_DYNAMICS).map(([id,spec])=>'<option value="'+id+'">'+spec.name+' ('+spec.topKmh+' km/h max)'+ '</option>').join('')}</select></div>
      <div class="row"><button data-a="car">Summon selected vehicle</button><button data-a="carHere">Drive selected vehicle now</button><button data-a="fix">Fix &amp; fuel vehicles</button></div>
      <div class="row"><button data-a="trackMode">Toggle closed-course speed override (cheat vehicles only)</button></div>
      <div class="row"><button data-a="goNew">📍 New neighbourhood</button><button data-a="goWork">📍 Saleyards Rd</button><button data-a="goHigh">📍 High Street</button><button data-a="goGuide">📍 Town Guide</button></div>
      <div class="row"><label for="cheat-jump">Jump height</label><select id="cheat-jump" aria-label="Jump height"><option value="0">Normal (about 1.2 m)</option><option value="3">3 m</option><option value="8">8 m: house roofs</option><option value="12">12 m</option><option value="25">25 m</option><option value="50">50 m</option></select><button data-a="jump">🦘 Set jump</button></div>
      <div class="row"><button data-a="torch">🔦 Torch</button><button data-a="money">💰 +$10,000</button><button data-a="needs">🍽 Fill food &amp; rest</button></div>
      <div class="row"><button data-a="buyNear">🏠 Own nearest property</button></div>
      <div class="row"><input id="cheat-prop" placeholder="e.g. [address redacted], A1 or bakery" aria-label="Property to own"><button data-a="buyKey">Own it</button></div>
      <div class="row"><button data-a="t8">🌅 08:00</button><button data-a="t13">☀️ 13:00</button><button data-a="t20">🌙 20:00</button></div>
      <div class="row"><button data-a="map">🗺️ Open map</button><button data-a="lock">Lock</button><button data-a="close">✕ Close</button></div>
      <div class="msg"></div>`;
    el.querySelector('#cheat-prop').addEventListener('keydown', (e) => e.stopPropagation());
    el.querySelector('#cheat-vehicle').addEventListener('keydown', (e) => e.stopPropagation());
    el.querySelector('#cheat-jump').addEventListener('keydown', (e) => e.stopPropagation());
    for (const b of el.querySelectorAll('button[data-a]')) b.onclick = () => run(b.dataset.a);
  }
  function run(a) {
    if (a === 'close') return close();
    if (a === 'lock') { unlocked = false; try { sessionStorage.removeItem('town-cheats'); } catch { /* ignore */ } renderLock(); return; }
    const arg = a === 'buyKey' ? el.querySelector('#cheat-prop').value : (a === 'car' || a === 'carHere') ? el.querySelector('#cheat-vehicle').value : a === 'jump' ? el.querySelector('#cheat-jump').value : undefined;
    let result;
    try { result = actions[a]?.(arg); } catch (err) { result = { message: 'Cheat failed: ' + err.message }; }
    say(result?.message || '');
    if (result?.close) close();
  }
  function open() { el.hidden = false; unlocked ? renderMenu() : renderLock(); }
  function close() { el.hidden = true; }

  // Unlock gestures: five quick taps on the HUD title, or backtick three times.
  // Five deliberate taps on the visible HUD title. Allow slower mobile touch
  // delivery and software-rendered frames: a real person's five taps may
  // arrive over >1 second without intending to abandon the gesture.
  // Still requires all five taps on the actual title and the password.
  const TAP_GAP_MS = 2500;
  let taps = 0, lastTap = 0;
  trigger?.addEventListener('click', () => {
    const now = performance.now(); taps = now - lastTap < TAP_GAP_MS ? taps + 1 : 1; lastTap = now;
    if (taps >= 5) { taps = 0; open(); }
  });
  let ticks = [];
  addEventListener('keydown', (e) => {
    if (e.key !== '`' || e.target.closest?.('input,textarea,select,[contenteditable]')) return;
    const now = performance.now(); ticks = ticks.filter((t) => now - t < 1500); ticks.push(now);
    if (ticks.length >= 3) { ticks = []; e.preventDefault(); el.hidden ? open() : close(); }
  });
  return { open, close, isOpen: () => !el.hidden, isUnlocked: () => unlocked, run };
}
