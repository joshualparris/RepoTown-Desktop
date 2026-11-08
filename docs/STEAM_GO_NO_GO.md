# Steam go / no-go review

**Current status: NO-GO for commercial publication.** The desktop edition is a tested development release candidate, not an approved Steam build. This checklist is explicit and fail-closed: `npm run steam:gate` must be green *and* Valve must approve the actual product before a live release.

## Technical work achieved
- Clean, separately versioned desktop repository, not copied Git history.
- Private project houses replaced by fictional generic homes.
- Windows game packaged and exercised in a real Electron process.
- Privacy gate and real hosted browser WebGL smoke tests.
- Optional co-presence multiplayer; no claims of shared NPC/world simulation.
- SteamPipe **preview-only** manifest preparation (requires actual Steam App/Depot IDs, no uploads).
- Desktop menu and save backups; prior progress backed up before any restore.
- First-day tutorial and genuine movement/map/wallet guidance.

## Legal, product, and Steamworks gates not yet evidenced
1. Confirm who legally owns all game code, names, characters, music, logos, textures and AI-generated artwork/dialogue. Assets marked CC0 (Kenney, KayKit, Quaternius) have licence files, but **that does not approve all game content**. Public GitHub repository content does not necessarily grant commercial republication rights. Do not upload any game bundle containing unreviewed external IP.
2. Audit Steam's **Content Survey**, including generated AI content consumed by players and any live-generated AI features, and mature/violence content. Don't declare zero AI without checking the shipped files.
3. Verify player experience: game tutorial, working jobs with wages, NPC day/night routines, no clipping/collisions, responsive controls, autosave, safe restoration, accessibility and performance on real minimum PC hardware. Existing features need human acceptance, not just code existence.
4. Register an eligible Steamworks publisher account, complete bank/tax/identity checks in Steamworks (never in GitHub), pay Steam Direct app fee, obtain real Steam App ID and Depot ID, set Windows launch executable `Repository Town.exe`, and upload only the reviewed package with the Steamworks SDK.
5. Prepare store page copy and correctly licensed images/video showing actual gameplay; configure accurate supported OS, features, age/content information, price and support contact. Do not market presence-only multiplayer as a persistent shared online world.
6. Submit store page for Valve review, publish Coming Soon long enough, submit final game build for Valve review, and manually release only after required timing and sign-off.

Official references:
- https://partner.steamgames.com/steamdirect
- https://partner.steamgames.com/doc/gettingstarted/contentsurvey
- https://partner.steamgames.com/documentation/releasing
- https://partner.steamgames.com/doc/sdk/uploading

**Timing caution:** Steam's pages have shown different initial waiting periods (21 versus 30 days). Confirm the actual Steamworks dashboard requirements for the publisher at the time of onboarding; do not assume an instant release.

## Release safety contract
The public repo contains no publisher bank details, passwords, tax documents, identity scans, or Steam logins. `STEAM_GO_NO_GO.json` should have evidence URLs or audit IDs only, not personal information. Each requirement stays false until independently verified. An automated green WebGL test is not evidence of licensable assets or quality for sale.
