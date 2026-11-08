# Changelog

## 0.3.0 — 8 November 2026 (Steam readiness sprint)

Everything Josh controls locally before the paid Steam Direct steps.

### Steam integration (offline-safe)
- `desktop/steam.cjs`: optional `steamworks.js` integration. No dependency added — it is a dynamic require that no-ops (with a clear log line) until `steamworks.js` is installed and a real `steam_appid.txt` exists. No fake App IDs anywhere.
- 13 achievements (`desktop/achievements.cjs`), offline-first: progress persists locally in Electron `userData`, and is pushed to Steam automatically once Steamworks is wired. Definitions are pure predicates over the game's public `window.__town` API.
- Achievements bridge injected into the served HTML (never a `game/` edit): polls `window.__town.state()`, reports to the main process, renders Steam-style toasts in-game. Disable with `STEAM_ACHIEVEMENTS=0`.
- Minimal `contextBridge` preload (`desktop/preload.cjs`): reportState / onAchievement / achievementAPI only. Sandbox + contextIsolation stay on.

### Desktop shell
- F11 and Alt+Enter toggle fullscreen; window bounds + fullscreen state persist per install.
- Local crash reports (`userData/crash-logs`, no identifiers, no upload) for main-process exceptions, renderer crashes and ready failures; renderer auto-restarts.

### Packaging and store
- Windows build now produces an NSIS one-click installer plus the zip; app icon (`desktop/assets/icon.png`).
- Store capsule artwork generator (`npm run store:capsules`) renders all five Steam-required sizes at exact dimensions; drafts in `store/capsules/`.
- Genuine in-game screenshot capture (`npm run store:screenshots`): headless Chromium WebGL against the local server, scenes staged and verified via the public `__town` API; 7 shots + `captions.json` in `store/screenshots/`.

### Gates and CI
- `npm run steam:ready` (`tools/steam-readiness.mjs`): 31-point readiness gate (build config, snapshot privacy, integration surface, asset dimensions, tests, docs).
- `tests/steam-achievements.test.mjs`: achievement definition + predicate coverage, offline-first guarantees, bridge/preload safety.
- `steam-readiness.yml` workflow: weekly drift check; regenerates capsules, runs the gate, uploads the readiness report.
- `docs/STEAMWORKS_ONBOARDING.md`: step-by-step runbook for the paid Steam Direct steps (App ID, US$100 fee, achievement registration, SteamPipe upload, Coming Soon page).
- Version 0.2.0 -> 0.3.0.

## 0.2.0 — initial desktop candidate

- Isolated Electron shell (loopback server, network allowlist, sandboxed renderer).
- Privacy-gated generated `game/` snapshot, export/verify tooling, hosted preview.
