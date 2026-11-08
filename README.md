# Repository Town — Desktop / Steam Edition

**Status: pre-release port; not yet ready for commercial distribution.**

This repository is intentionally **separate from the live web game and its development history**. Its purpose is to develop, test, and eventually publish a privacy-safe Windows desktop edition of Repository Town through Steam.

## Privacy-first source policy
- Never fork, mirror, submodule, or import the original repository's Git history.
- The game snapshot must be generated from the upstream **sanitised public build** only, not from original briefs, personal/project databases, private builds, audit logs, credentials, or entire source directories.
- Exclude all nested arcade/third-party games, personal analytics and debug/administrative surfaces until separately audited and licensed.
- Run both the upstream privacy audit **and** the desktop export privacy audit *before* staging or committing any files. Fail closed: an unsafe build must never push.
- Keep gameplay saves, accounts and Steam credentials out of version control; no real personal data, email addresses, addresses, child details, logs or tokens in the export.
- No Steam credentials, signing certificates, paid integrations or publication actions without explicit approval.

## What the Steam version needs
A stable desktop client with smooth graphics, keyboard/mouse and controller support, full-screen/windowed modes, local saving and later Steam Cloud, achievements, optional multiplayer, a reliable first-hour tutorial, meaningful jobs/citizen simulation, readable characters and performant interiors. This is an ambitious milestone rather than a statement of current completion.

The original browser edition is still developed separately. This repository's own privacy-gated snapshot workflow prepares files for desktop packaging. See `docs/STEAM_RELEASE_PLAN.md` after bootstrap.

**Steam publishing is not enabled yet.** Steamworks account setup, app fee and Valve approvals are separate steps; no Steam upload or storefront release has occurred.
