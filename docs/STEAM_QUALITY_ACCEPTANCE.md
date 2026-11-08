# Steam gameplay quality gates — evidence not marketing

This is a measurable testing baseline, not a declaration that the game is finished.

## Automatic Windows and browser tests

- The actual packaged Windows executable must open its 3D world, spawn the player,
  accept keyboard movement, operate the first-day tutorial and retain local
  settings/saves over reload.
- The full 188-home world and 60 fictionalised private-home replacements must
  remain present and privacy-audited on both Windows and hosted GitHub Pages.
- The Windows simulation test checks actual residents, NPC position distribution,
  a running animation frame loop, 15 minutes of genuine world-clock advancement,
  and entering a fictional residence with non-empty rooms, furnishings and windows.
- Save transfers may only contain game-progress keys. Before restoring a save,
  a crash-safe private backup must succeed. No accounts or chat content are copied.
- Bundled libraries must have complete Three.js MIT and hls.js Apache-2.0 notices;
  CC0 model assets must retain their licence files. Voicebank remote references
  and unreviewed recordings are excluded; OSM credits are visible.
- Each release's gameplay evidence is uploaded to GitHub Actions as a QA
  artefact (including observed FPS/NPC movement and one actual home screenshot).

## Mandatory human playtests still open

These require real people with different GPUs, gamepads and accessibility needs.
No automatic test can certify that the game is engaging.

- A complete 45–60 minute fresh save, including first paid job, receipt, second
  job/day, shopping, home interior, NPC conversation and quit/reload.
- At least three distinct jobs with actual hand-driven tasks, wages and meaningful
  spending/progression; no instant unearned click-to-win tasks.
- NPCs commutes, shops, school and business staff, chairs and queues; report
  any statue-like crowds, identical NPCs, overlapping walkers and unsafe vehicles.
- Doors line up with room thresholds; windows visibly show outside; furniture,
  tools and vehicles never clip through walls or occupants.
- Capture actual 1% low and median FPS on minimum/recommended Windows PCs for
  busy Narromine, indoor scenes and a one-hour session. SwiftShader GitHub
  Actions frame rate is NOT hardware qualification.
- Test full-screen, resolution/scaling, Steam Input controller support,
  keyboard remapping, subtitles, narration, colour contrast, low-vision
  accessibility and Steam Deck separately.
- Verify offline single-player (no network), save version migrations,
  interrupted writes, power loss, update/reinstall and performance soak.
- Co-op authority is still limited to player presence. World clock, NPCs,
  inventory, economy, jobs, vehicles and recovery from disconnections are not
  authoritative/shared across accounts.

## Release decision

Never set `gameplayQualityAndAccessibilityAccepted` to true on the basis of a
green unit/CI test alone. Human acceptance evidence and measured performance
are required for a commercial release. Use `npm run steam:gate` to see blocked
publication requirements.
