# Steamworks onboarding runbook — 8 November 2026

The technical build pipeline and store-media drafts are prepared, but
the complete game is **NOT approved for commercial release**. Steamworks
onboarding, rights-holder/source provenance, a playable first-hour experience,
representative hardware tests, actual Steam SDK tests, and Valve review remain.

This is a process runbook, not a certification of game quality or rights.
Nothing here commits credentials: the repo never stores Steam keys.

## Development components (local technical checks only)

| Area | Status |
|---|---|
| Electron shell | Sandbox + contextIsolation on, loopback-only server, network allowlist (multiplayer host only) |
| Steamworks wrapper | `desktop/steam.cjs` — optional `steamworks.js` require, offline no-op, `steam_appid.txt` auto-detect |
| Achievements | 13 defined (`desktop/achievements.cjs`), offline-first, unlocked locally in `userData`; Steam upload not yet verified against a real App ID; in-game toasts via injected bridge (`desktop/assets/achievements-bridge.js`) — no `game/` edits |
| Fullscreen / window | F11 and Alt+Enter toggle fullscreen; bounds + fullscreen state persist per install |
| Crash reports | Local JSON in `userData/crash-logs`, not uploaded; crash-details privacy review required |
| Windows package | NSIS one-click installer + zip, `desktop/assets/icon.png` |
| Store assets | Art generator outputs current Steam dimensions (`store/capsules/`); visuals still need a human trademark/accuracy review; 6 accepted in-game screenshots and 1 draft (`store/screenshots/`), regenerate any time: `npm run store:capsules`, `npm run store:screenshots` |
| SteamPipe manifest | `npm run steam:manifest` (needs real App ID + Depot ID env vars) |

## Step-by-step (requires the Steam account + US$100)

1. **Steam Direct signup** — https://partner.steamgames.com/steamdirect. Pay the
   US$100 per-app fee (recoupable after US$1,000 revenue). Note the initial waiting period (Steam's current Steam Direct page says 21 days, but other localisation pages have stated 30 days). Confirm your dashboard's actual eligibility date; start it EARLY.
2. **Create the app** — name "Repository Town", type Game. Record the App ID
   and the Depot ID from the Steamworks dashboard.
3. **Register the achievements** — Steamworks dashboard, Achievement Progress
   page. Create these 13 exactly (IDs must match `desktop/achievements.cjs`;
   Steam calls them "API names"):
   TOWN_ARRIVAL, HOME_VISIT, MEET_NEIGHBOUR, STORE_KEEPER, BARISTA, DISHES,
   TAKE_A_SEAT, ON_THE_ROAD, SUNDAY_DRIVER, SLEEP_TIGHT, DAY_TWO,
   GOING_PUBLIC, PLAY_TOGETHER.
   Copy each name/description from `desktop/achievements.cjs`; upload a
   64x64 unlocked + locked icon per achievement (the capsule palette works).
4. **Wire Steamworks into the build**:
   ```bash
   npm i steamworks.js
   echo <APPID> > steam_appid.txt        # never commit this file
   npm run package:windows               # electron-builder rebuilds native deps
   ```
   `desktop/steam.cjs` picks it up automatically; the log line
   `[steam] Steamworks initialised (app …)` confirms it.
5. **SteamPipe upload** — generate the manifest with real IDs:
   ```bash
   STEAM_APP_ID=<appid> STEAM_DEPOT_ID=<depotid> npm run steam:manifest
   ```
   then follow https://partner.steamgames.com/doc/sdk/api/uploading to push the
   `release/` output to the depot. Keep `publish: null` in package.json —
   uploads are always a deliberate manual step.
6. **Steam Cloud (optional, NOT configured)** — the game stores player progress primarily in
   Chromium localStorage, with achievements and logs in Electron `userData`.
   **Do not sync all userData**: that may include authentication information,
   crash logs or unrelated browser state. Build and test an explicit
   game-only Cloud save export/import protocol with conflict handling first.
   See https://partner.steamgames.com/doc/features/cloud.
7. **Store page** — upload `store/capsules/*.png` (dimensions already exact),
   the screenshots from `store/screenshots/` (captions in `captions.json`),
   write the description from `docs/STEAM_RELEASE_PLAN.md`'s design promise.
   Publish a Coming Soon page and leave it public at least 2 weeks before
   release (Steam requirement).
8. **Launch the Coming Soon page** — then wait out the dashboard's actual first-app waiting period,
   validate the depot build via "View Diff / install run", then release.

## Verification checklist before pressing release

- `npm run steam:ready` — all local checks green.
- `npm run test:steam-ready` — shell + privacy + achievements tests green.
- Fresh Windows VM: install the NSIS build, play offline (achievements unlock
  locally, no error dialogs), then online once (multiplayer connects, chat works
  after the JoshMemory v3 worker deploy).
- Steam client running: achievements appear in the Steam overlay as they unlock.
- Steam Deck (optional but good): run the zip build through Proton and confirm
  keyboard/mouse prompts are acceptable; full Deck certification is P1.

## What deliberately stays out of scope

- No Steam credentials, signing certificates or auto-publication in this repo.
- Audio stays excluded until the rights audit is done (see release plan P0).
- Nested arcade games stay excluded (privacy/IP risk).

## Remaining non-account blockers — do not skip

- **Commercial rights:** verify and document ownership of original code, AI-assisted content, real shop/brand names, map derivatives, marketing artwork, fonts and 3D binaries. An automated CC0 / MIT / Apache notice test is not legal clearance.
- **Quality:** complete an observed first-hour playtest; measure minimum-PC FPS and crashes; certify jobs, NPC activity, vehicle pathfinding, interior windows and save recovery. The CI smoke test cannot attest enjoyment.
- **Store media:** current capsules are artwork drafts, not Valve-approved assets. Check current dimensions and content against [store graphical asset documentation](https://partner.steamgames.com/doc/store/assets).
- **Steamworks:** achievement activation/overlay, game build uploads and Cloud saves require a *real* Steam App ID and test installation. Until then the app is not a Steam-integrated release.
- **Reviews:** the Coming Soon page and game build must each pass Valve's actual review. Confirm any game classification or tax questions with Steamworks; do not store personal documents in this public repo.

The separate fail-closed commercial publication gate is `npm run steam:gate`; **it is intentionally red** until real evidence is supplied.
