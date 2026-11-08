'use strict';
// The game is served only from the Electron loopback origin. Allow the
// Pointer Lock API for that one top-level document, never for embedded or
// remote content. Other browser permissions remain denied.
function canUseGamePointerLock({
  contents, gameContents, permission, requestingUrl, isMainFrame,
  gameOrigin, requestingOrigin,
}) {
  if (permission !== 'pointerLock' || !gameContents ||
      contents !== gameContents || isMainFrame !== true) return false;
  // Match the exact playable document, not a similar localhost hostname,
  // another port, a query-string URL or a cross-origin iframe.
  if (requestingUrl !== gameOrigin + '/index.html') return false;
  if (requestingOrigin !== undefined && requestingOrigin !== gameOrigin) return false;
  return true;
}
module.exports = { canUseGamePointerLock };
