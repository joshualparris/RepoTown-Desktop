// "Start a new game" (Settings). The button sets a one-shot flag and reloads; this script runs
// before the game's modules, so the old town is cleared before anything reads it and a final
// autosave from the page being left cannot bring it back. Preferences (sound, music, movement
// speed, camera views, captions, resident style) stay; progress goes.
(function () {
  var FLAG = 'repository-town.new-game';
  var PROGRESS = ['repository-town.save.v2', 'repository-town.life.v1', 'repository-town.errands.v1', 'repository-town.social.v1',
    'repository-town.expedition.v1', 'repository-town:npc-badges:v1', 'repository-town.npc-chats', 'town-cheats'];
  try { if (sessionStorage.getItem(FLAG) !== '1') return; sessionStorage.removeItem(FLAG); } catch (e) { return; }
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (PROGRESS.indexOf(k) >= 0 || /^repository-town-progress/.test(k)) localStorage.removeItem(k);
    }
    try { sessionStorage.removeItem('town-cheats'); } catch (e) { /* ignore */ }
    window.__townNewGame = true;
  } catch (e) { /* storage unavailable: nothing saved to clear */ }
})();
