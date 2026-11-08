// Browser-side achievements bridge, injected by the desktop shell (never a game/ edit).
// Polls the game's public window.__town test API every few seconds and forwards a
// snapshot to the Electron main process, which evaluates the achievement set,
// persists progress and (once Steamworks is wired) tells Steam. This file renders
// the toast itself so the game snapshot stays untouched.
(function () {
  'use strict';
  if (window.__townAchievementsBridge) return;
  window.__townAchievementsBridge = true;

  var POLL_MS = 3000;
  var seen = {};
  var toast = null;
  var queue = [];
  var toastTimer = null;

  function unlockedAlready() {
    // Ask main for the API shape once; it includes what is already unlocked.
    if (!window.desktop || !window.desktop.achievementAPI) return null;
    try { return window.desktop.achievementAPI(); } catch (e) { return null; }
  }
  unlockedAlready();

  function showToast(a) {
    if (!document.body) { queue.push(a); return; }
    if (toast) { queue.push(a); return; }
    var box = document.createElement('div');
    box.setAttribute('role', 'status');
    box.style.cssText = 'position:fixed;right:18px;bottom:18px;max-width:min(360px,86vw);display:flex;gap:12px;align-items:center;'
      + 'padding:12px 16px;background:linear-gradient(135deg,#0e2430f2,#123c3cf2);color:#f3faf9;border:1px solid #52c6b5;'
      + 'border-radius:14px;box-shadow:0 10px 30px #0009;z-index:2147483647;font:14px/1.4 system-ui,sans-serif;'
      + 'pointer-events:none;opacity:0;transition:opacity .45s ease, transform .45s ease;transform:translateY(14px)';
    var medal = document.createElement('div');
    medal.style.cssText = 'flex:0 0 auto;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 34% 30%,#9fe8d8,#2f8f7f 60%,#1b5a50);'
      + 'display:flex;align-items:center;justify-content:center;font-size:19px';
    medal.textContent = '\u2605';
    var text = document.createElement('div');
    var t1 = document.createElement('div');
    t1.style.cssText = 'font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:11px;color:#8fe0cf';
    t1.textContent = 'Achievement unlocked';
    var t2 = document.createElement('div');
    t2.style.cssText = 'font-weight:700';
    t2.textContent = a.name || a.id;
    var t3 = document.createElement('div');
    t3.style.cssText = 'color:#bcd8d2;font-size:12.5px';
    t3.textContent = a.desc || '';
    text.append(t1, t2, t3);
    box.append(medal, text);
    document.body.append(box);
    toast = box;
    requestAnimationFrame(function () { box.style.opacity = '1'; box.style.transform = 'translateY(0)'; });
    toastTimer = setTimeout(function () {
      box.style.opacity = '0'; box.style.transform = 'translateY(14px)';
      setTimeout(function () { box.remove(); toast = null; if (queue.length) showToast(queue.shift()); }, 480);
    }, 4200);
  }

  function poll() {
    var town = window.__town;
    if (!town || typeof town.state !== 'function') return;
    var snap = {};
    try {
      var s = town.state();
      if (!s || !Number.isFinite(s.pos?.x)) return;
      // Keep the snapshot lean: only fields the achievement predicates read.
      snap = {
        mode: s.mode, sleeping: s.sleeping, driving: s.driving, seated: s.seated ? true : null,
        workplay: s.workplay || null, day: s.day, weekday: s.weekday, nearNPC: s.nearNPC || null,
      };
    } catch (e) { return; }
    var mp = null;
    try { if (typeof town.multiplayer === 'function') { var m = town.multiplayer(); if (m && m.connected) mp = m; } } catch (e) { /* offline is fine */ }
    try { window.desktop.reportState(snap, mp); } catch (e) { /* main not ready yet */ }
  }

  function listen() {
    if (window.desktop && typeof window.desktop.onAchievement === 'function') {
      window.desktop.onAchievement(function (a) { showToast(a); });
    }
  }

  function start() {
    listen();
    setInterval(poll, POLL_MS);
    poll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
