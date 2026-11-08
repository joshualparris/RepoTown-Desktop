// Keep helpers out of the way while visitors read or operate focused UI.
// 'card' is the floating building information card, not just the full shop panel.
export const isHudBlocked = (overlays = {}) =>
  Object.values(overlays).some(Boolean);

export function setCompanionLauncherVisibility(button, blocked, companionOpen = false) {
  if (!button) return;
  const hidden = !!blocked || !!companionOpen;
  button.hidden = hidden;
  button.disabled = hidden;
  button.setAttribute('aria-hidden', String(hidden));
}
