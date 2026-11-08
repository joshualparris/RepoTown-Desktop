// Preload for the sandboxed game window. contextIsolation + sandbox stay on;
// the ONLY bridge into the page is this minimal, reviewable surface:
//   window.desktop.reportState(state, multiplayer) -> void (achievement polling; no reply channel)
//   window.desktop.onAchievement(cb) -> cb({id,name,desc}) when an achievement unlocks
//   window.desktop.achievementAPI() -> full achievement list (for an in-game progress view)
//   window.desktop.version() -> desktop build version
// Nothing else - no Node, no filesystem, no arbitrary IPC channels from the page.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  version: () => process.env.DESKTOP_VERSION || null,
  achievementAPI: () => ipcRenderer.invoke('desktop:achievement-api'),
  reportState: (state, multiplayer) => ipcRenderer.send('desktop:state', { state, multiplayer }),
  onAchievement: (cb) => ipcRenderer.on('desktop:achievement', (e, a) => { try { cb(a); } catch {} }),
});
