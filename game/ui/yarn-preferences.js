// One preference for unsolicited NPC-to-NPC subtitles, not player-led dialogue.
// Storage is injected so behaviour remains deterministic and testable.
export const AUTO_YARN_CAPTIONS_KEY = 'repository-town.yarn-captions.v1';

export function readAutoYarnCaptions(storage, compact = false) {
  let saved = null;
  try { saved = storage?.getItem(AUTO_YARN_CAPTIONS_KEY) ?? null; }
  catch { /* browser privacy mode: retain useful defaults */ }
  if (saved === 'on') return true;
  if (saved === 'off') return false;
  return !compact; // New phone users get a clear screen; desktops keep previous behaviour.
}

export function writeAutoYarnCaptions(storage, enabled) {
  try { storage?.setItem(AUTO_YARN_CAPTIONS_KEY, enabled ? 'on' : 'off'); return true; }
  catch { return false; } // The current-session preference still works.
}

export function shouldShowAutoYarnCaption({enabled, activeId, dismissedId, elapsed, nearby, yarnPanelHidden, settingsPanelHidden}) {
  return !!enabled && !!activeId && activeId !== dismissedId &&
    elapsed >= 0 && elapsed < 15 && !!nearby && !!yarnPanelHidden && !!settingsPanelHidden;
}
