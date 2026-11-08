// Repository Town-only minimap visibility. This script deliberately does not
// change 3D geometry, camera controls, navigation or the geographic compass.
// The canvas shows Repository Town lots; it is NOT a map of real Narromine.
(() => {
  'use strict';
  const map = document.getElementById('minimap');
  if (!map) return;
  const STORAGE_KEY = 'repository-town.minimap-hidden.v1';
  const WESTERN_REGION_X = -1300; // Narromine scene starts here (SHOW_WEST_OF in narromine.js).
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'minimap-toggle';
  button.setAttribute('aria-controls', 'minimap');
  document.body.append(button);

  let savedHidden = false;
  try { savedHidden = localStorage.getItem(STORAGE_KEY) === '1'; }
  catch { /* private browsers may disallow local storage */ }
  let priorNarromine = false;
  let localShowInNarromine = false;

  // Local interior positions no longer represent the street coordinates.
  // Check their save identity, rather than accidentally showing the town map
  // while visiting the real Narromine Post Office or Coles.
  function isNarromine(gameState) {
    if (!gameState) return false;
    const savedPlace = String(gameState.coordinate || '').toUpperCase();
    if (savedPlace.startsWith('NARROMINE') || savedPlace.includes('ST-MARYS')) return true;
    const x = Number(gameState.pos?.x);
    return gameState.mode === 'town' && Number.isFinite(x) && x < WESTERN_REGION_X;
  }
  function getGameState() {
    try { return window.__town?.state?.() || null; }
    catch { return null; }
  }
  function apply() {
    const state = getGameState();
    const narromine = isNarromine(state);
    if (narromine !== priorNarromine) {
      priorNarromine = narromine;
      localShowInNarromine = false; // Always start hidden on each Narromine visit.
    }
    const showMap = narromine ? localShowInNarromine : !savedHidden;
    document.body.classList.toggle('narromine-minimap-zone', narromine);
    document.body.classList.toggle('minimap-is-hidden', !showMap);
    map.hidden = !showMap;
    button.setAttribute('aria-pressed', String(showMap));
    button.textContent = showMap ? 'Hide map' : '🗺 Show map';
    button.setAttribute('aria-label', showMap
      ? 'Hide Repository Town minimap'
      : 'Show Repository Town minimap');
    button.title = narromine
      ? 'This map shows Repository Town, not Narromine. Show it temporarily if you wish.'
      : (showMap ? 'Hide the mini town map (saved on this device)' : 'Show the mini town map (saved on this device)');
  }
  button.addEventListener('click', () => {
    if (document.pointerLockElement) document.exitPointerLock?.();
    if (priorNarromine) {
      localShowInNarromine = !localShowInNarromine;
    } else {
      savedHidden = !savedHidden;
      try { localStorage.setItem(STORAGE_KEY, savedHidden ? '1' : '0'); }
      catch { /* keep preference for this page */ }
    }
    apply();
  });
  // No calls into game physics or render loop. The HUD has always updated
  // independently of the world, including when load/save/teleport occurs.
  apply();
  setInterval(apply, 250);
})();