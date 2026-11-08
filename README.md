# Repository Town — Desktop / Steam Edition

**Status: pre-release port; not yet ready for commercial distribution.**

This repository is intentionally **separate from the live web game and its development history**. Its purpose is to develop, test, and eventually publish a privacy-safe Windows desktop edition of Repository Town through Steam.

## Play the game

- **[Play the independently hosted Steam-edition preview](https://joshualparris.github.io/repository-town/steam-preview/)** — public, no Steam installation required. GitHub Pages is verified by a real Chromium game startup and privacy test; best on a computer. The [Vercel preview](https://repotown-desktop-preview.vercel.app/) is a backup that may lag the latest edition when deployment limits are reached.
- **[Download the latest tested Windows playtest release](https://github.com/joshualparris/RepoTown-Desktop/releases)** — extract it and launch `Repository Town.exe`. New versions can be found on [Releases](https://github.com/joshualparris/RepoTown-Desktop/releases). No Steam account is required. It has passed an actual packaged Electron game-load and local-storage-reload test.
- **Status:** playable development build, **not** a released Steam product. Steamworks onboarding, commercial asset rights, a complete shared-world simulation, and gameplay polish are still required.
- **Steam tooling:** local technical scaffolding and automated tests are prepared — optional Steamworks wrapper, 13 offline-first achievements with in-game toasts, fullscreen + window-state persistence, local crash reports, NSIS installer, store capsules and genuine screenshots. Run `npm run steam:ready` for the full gate; the remaining steps also include rights, gameplay, Steamworks account setup and Valve approval in `docs/STEAMWORKS_ONBOARDING.md`.

The [independent GitHub Pages test](https://github.com/joshualparris/RepoTown-Desktop/actions/workflows/verify-steam-pages.yml) rechecks online loading, the 188-house world, fictionalised private-house placeholders, working offline interactions and game save transfer every day.

## Security update — candidate 0.4.1

The Electron wrapper is upgraded from the unsupported Electron 39 to pinned,
supported Electron 45.2.3, which includes modern Chromium security updates.
Windows startup, save persistence, Steam achievements, NPC/gameplay smoke
tests and the artwork gate must pass again after this upgrade. The Steam
publisher account, actual Steam client and Valve approvals remain separate
blocked release requirements.

Official runtime support: https://releases.electronjs.org/schedule

## Desktop candidate 0.3.1 — rights and quality checks

This development update replaces the previously shipped voicebank integration with
optional local device speech, adds in-game OpenStreetMap map attribution, ships the
required complete Three.js and hls.js licence notices, and tests the actual
Windows 3D simulation including residents and a fictional house interior.

The machine-readable release gate and Steamworks publisher approvals still say
**NO-GO** for commercial release. See [rights review](docs/COMMERCIAL_RIGHTS_AUDIT.md),
[OSM map provenance](docs/OSM_DATA_RIGHTS.md) and
[Steam quality acceptance](docs/STEAM_QUALITY_ACCEPTANCE.md).

## Desktop candidate 0.3

This development candidate adds first-day onboarding, a genuine Game menu to back up or restore approved game progress, an automatic private backup before importing a saved game, and basic gamepad support (left stick movement, right stick camera, right shoulder run, A jump, X interact, B back, Y map).

**Commercial readiness is explicitly blocked** until the Steamworks, legal-content and gameplay requirements in [Steam go/no-go](docs/STEAM_GO_NO_GO.md) are independently evidenced. Run `npm run steam:gate` to see the remaining requirements; this check is intentionally red for now.

## Privacy-first source policy
- Never fork, mirror, submodule, or import the original repository's Git history.
- The game snapshot must be generated from the upstream **sanitised public build** only, not from original briefs, personal/project databases, private builds, audit logs, credentials, or entire source directories.
- Exclude all nested arcade/third-party games, personal analytics and debug/administrative surfaces until separately audited and licensed.
- Run both the upstream privacy audit **and** the desktop export privacy audit *before* staging or committing any files. Fail closed: an unsafe build must never push.
- Keep gameplay saves, accounts and Steam credentials out of version control; no real personal data, email addresses, addresses, child details, logs or tokens in the export.
- No Steam credentials, signing certificates, paid integrations or publication actions without explicit approval.

## What the Steam version needs
A stable desktop client with smooth graphics, keyboard/mouse and controller support, full-screen/windowed modes, local saving and later Steam Cloud, achievements, optional multiplayer, a reliable first-hour tutorial, meaningful jobs/citizen simulation, readable characters and performant interiors.

Current state of that list: full-screen/windowed (F11 / Alt+Enter, persisted), local saving, achievements (13, offline-first, Steam-ready), optional multiplayer presence, crash reports and the native Windows installer are done; controller support, Steam Cloud and Steam Deck validation remain, plus the gameplay polish gates tracked in `docs/STEAM_RELEASE_PLAN.md`.

The original browser edition is still developed separately. This repository's own privacy-gated snapshot workflow prepares files for desktop packaging. See `docs/STEAM_RELEASE_PLAN.md` after bootstrap.

**Steam publishing is not enabled yet.** Steamworks account setup, app fee and Valve approvals are separate steps; no Steam upload or storefront release has occurred.
