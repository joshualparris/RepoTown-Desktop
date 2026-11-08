# Steam release plan — researched 8 November 2026

## Design promise
**A living Australian town where you can work, build, belong, and affect the lives of residents.** Keep Repository Town's identity, but remove real personal data and repository-owner baggage from the commercial edition.

## Benchmarks (actual Steam games)
| Game | Why players return | What Repo Town must learn |
|---|---|---|
| Big Ambitions | Businesses, economic goals, ownership and visible progression | Jobs actually pay, stocks move, rents and profits are meaningful |
| Dinkum | Distinct Australian atmosphere, town development, co-op | Welcoming world, direct activities and joyful collaboration |
| My Time at Sandrock | Characters, relationships, quests, making things | Resident memories, real conversations and satisfying character arcs |
| Streets of Rogue | Player agency, systematic NPC reactions, emergent play | Town systems react to actions, not scripted statues |

Source Steam store pages: https://store.steampowered.com/app/1331550, https://store.steampowered.com/app/1062520, https://store.steampowered.com/app/1084600, https://store.steampowered.com/app/512900

## Status update — 8 November 2026 (post Steam-readiness sprint)

Everything Josh can control locally is now DONE and gated in CI (`npm run steam:ready`, workflow `steam-readiness.yml`):

| Item | Status |
|---|---|
| Steamworks wrapper (offline-safe, optional steamworks.js) | done — `desktop/steam.cjs` |
| 13 achievements, offline-first, local persistence + toasts | done — `desktop/achievements.cjs` + injected bridge |
| Fullscreen (F11 / Alt+Enter) + window state persistence | done — `desktop/main.cjs` |
| Local crash reports (no identifiers) | done — `userData/crash-logs` |
| Windows NSIS installer + zip + app icon | done — `package.json` build config |
| Store capsules at exact Steam dimensions | done — `store/capsules/` (`npm run store:capsules`) |
| 7 genuine in-game screenshots (1920x1080) | done — `store/screenshots/` (`npm run store:screenshots`) |
| SteamPipe preview manifest generator | done — `npm run steam:manifest` |
| Steamworks onboarding runbook (paid steps only) | done — `docs/STEAMWORKS_ONBOARDING.md` |

Still open (all require the Steam account / rights work, not code):
- Steamworks App ID + US$100 Steam Direct fee + 21-day waiting period + 2-week Coming Soon page.
- Trailer (10-second gameplay) — needs recording pass on a GPU machine.
- Audio rights audit, nested-game exclusion review (unchanged).
- Controller support/remapping, Steam Deck validation (P1, post-launch acceptable).
- The remaining P0 gameplay gates above (first 30 minutes polish, world behaviour) live in the upstream game repo, not here.

## Quality-first release gates
- **P0 Privacy and rights:** clean export from public build only; zero personal data, home locations, family recordings, credentials and private-repository content. Do not ship nested games, unreviewed music or branded commercial assets. Audit licences/credits before sale.
- **P0 First 30 minutes:** fast launch, choose character, intuitive controls and a guided first-day storyline with genuine tasks, first wage/payment and a useful purchase. Make it enjoyable without reading a manual.
- **P0 World behaviour:** villagers move purposefully, work, sit, shop, travel home, sleep, converse and react. No creepy clones, frozen shop crowds, cars merging or driving through one another.
- **P0 Geometry and visuals:** doors connect to rooms, furniture never intersects walls, windows show the outdoors, entrances/paths work, no phantom lawnmowers in homes, no black-screen interiors.
- **P0 Jobs and progress:** complete interactive job loops (work -> someone benefits -> accurate payslip -> meaningful purchase/debt repayment -> progression). Save, reload and replay without inventory/money duplication.
- **P0 Reliable offline single-player:** autosave with backups and recovery, pause/resume, save migration and crash reports without user identifiers.
- **P0 Desktop quality:** stable native Windows package; configurable resolution, windowed/fullscreen, keyboard/mouse/controller, remapping, subtitles, scalable UI, accessibility and consistently smooth FPS on minimum-spec hardware.
- **P1 Co-op:** authoritative shared server with resilient reconnect, world clock, NPC/car state, shared interactions and persistence, privacy/moderation. Don't market the current presence-only feature as full co-op.
- **P1 Steam integration:** Steamworks API, achievements, Cloud Saves, controller glyphs, Steam Deck validation, optional co-op lobbies and build/depot upload after Steam App ID, consent and tests.
- **P1 Retention:** attractive town progression, varied personalities, meaningful consequences, collections, events, optional creative building and seasonal updates. Never depend on empty busywork.
- **P1 Storefront:** compelling 10-second gameplay trailer, capsule artwork, screenshots of genuine current gameplay, accurate tags/features, demo and wishlists, support/contact and clear update notes.

## Explicit blockers before any commercial Steam upload
- There is not yet a Steamworks App ID, Steam Cloud/achievement implementation, signed distribution build or tested Windows playthrough.
- Audio is excluded until ownership, consent and distribution rights are verified; nested arcade games are excluded due to privacy and IP risks.
- Desktop packaging begins with an isolated browser engine; this **does not yet establish engine-class performance or UX**.
- Existing online multiplayer is only live player presence. Shared NPC/world authority and inventory are not done.
- User must complete Steamworks onboarding and pay the per-app **US$100 Steam Direct fee**. Steam documentation requires a 21-day initial waiting period and a public Coming Soon page for at least two weeks before release (see https://partner.steamgames.com/steamdirect).
- Steam Cloud: https://partner.steamgames.com/doc/features/cloud
- Achievements: https://partner.steamgames.com/doc/features/achievements
- Steam marketing: https://partner.steamgames.com/doc/marketing/bestpractices
- Steam release checklist: https://partner.steamgames.com/documentation/releasing

## Immediate technical scope
An isolated Electron shell serving allowlisted local assets, no browser telemetry, no arbitrary network requests, an explicit privacy gate and a reproducible one-way desktop export. The public hosted game is not changed, and the imported Git history is never copied.
