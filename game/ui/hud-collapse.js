// Accessible, local-first HUD minimise toggle. Runs before the 3D game starts,
// so the menu remains usable even if WebGL fails to load.
(() => {
  const hud = document.getElementById('hud');
  const toggle = document.getElementById('btn-hud-toggle');
  if (!hud || !toggle) return;
  const key = 'repository-town.hud-minimised.v1';
  let saved = null;
  try { saved = localStorage.getItem(key); } catch { /* storage may be blocked */ }
  // Start compact on every screen to maximise the playable area. Respect an existing preference.
  let minimised = saved !== '0';
  const render = () => {
    hud.classList.toggle('hud-minimised', minimised);
    toggle.textContent = minimised ? '+' : '−';
    toggle.setAttribute('aria-expanded', String(!minimised));
    toggle.setAttribute('aria-label', minimised ? 'Expand town controls' : 'Minimise town controls');
    toggle.title = minimised ? 'Show the town controls' : 'Hide the town controls';
  };
  // Choosing a full-screen tool on phones should automatically clear the huge
  // expanded menu so it cannot obscure the Grid panel or Town Companion.
  document.addEventListener('town:collapse-hud', () => {
    if (!matchMedia('(max-width: 700px)').matches || minimised) return;
    minimised = true;
    render();
    try { localStorage.setItem(key, '1'); } catch { /* storage blocked */ }
  });
  toggle.addEventListener('click', () => {
    // A captured pointer cannot be used to press an ordinary menu button.
    if (document.pointerLockElement) document.exitPointerLock?.();
    minimised = !minimised;
    render();
    try { localStorage.setItem(key, minimised ? '1' : '0'); } catch { /* use current-session setting */ }
  });
  render();
})();
