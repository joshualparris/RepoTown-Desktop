# Steamworks onboarding runbook — 8 November 2026

Everything in this repo is now ready for Steam EXCEPT the steps that legally
require a paid Steam account. This runbook is the exact order to do them in.
Nothing here commits credentials: the repo never stores Steam keys.

## What is already done (verified by `npm run steam:ready`)

| Area | Status |
|---|---|
| Electron shell | Sandbox + contextIsolation on, loopback-only server, network allowlist (multiplayer host only) |
| Steamworks wrapper | `desktop/steam.cjs` — optional `steamworks.js` require, offline no-op, `steam_appid.txt` auto-detect |
| Achievements | 13 defined (`desktop/achievements.cjs`), offline-first, unlocked locally in `userData`, pushed to Steam once wired; in-game toasts via injected bridge (`desktop/assets/achievements-bridge.js`) — no `game/` edits |
| Fullscreen / window | F11 and Alt+Enter toggle fullscreen; bounds + fullscreen state persist per install |
| Crash reports | Local JSON files in `userData/crash-logs`, no identifiers, no upload |
| Windows package | NSIS one-click installer + zip, `desktop/assets/icon.png` |
| Store assets | Capsules at exact Steam dims (`store/capsules/`), 7 in-game screenshots (`store/screenshots/`), regenerate any time: `npm run store:capsules`, `npm run store:screenshots` |
| SteamPipe manifest | `npm run steam:manifest` (needs real App ID + Depot ID env vars) |

## Step-by-step (requires the Steam account + US$100)

1. **Steam Direct signup** — https://partner.steamgames.com/steamdirect. Pay the
   US$100 per-app fee (recoupable after US$1,000 revenue). Note the 21-day
   initial waiting period; start it EARLY.
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
6. **Steam Cloud (optional, recommended)** — the game already stores progress in
   `userData` (`steam-achievements.json`, saves). Auto-Cloud the whole userData
   directory: https://partner.steamgames.com/doc/features/cloud. The game's own
   storage stays local-first, so Cloud is additive.
7. **Store page** — upload `store/capsules/*.png` (dimensions already exact),
   the screenshots from `store/screenshots/` (captions in `captions.json`),
   write the description from `docs/STEAM_RELEASE_PLAN.md`'s design promise.
   Publish a Coming Soon page and leave it public at least 2 weeks before
   release (Steam requirement).
8. **Launch the Coming Soon page** — then wait out the 21-day review window,
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
