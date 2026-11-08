// Per-viewer autosave. Storage can be unavailable (private mode, blocked site
// data), so every access is guarded and the game runs without it.
const KEY = 'repository-town.save.v2';

export function loadSave() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function writeSave(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
