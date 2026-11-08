# Repository Town — draft privacy notice (NOT approved for storefront)

This draft describes currently inspected code and must be reviewed with the
actual publisher, Cloudflare data settings, live backend and applicable law
before publication. **No personal address, real player's credentials or
private email belongs in this repository.**

## What the offline desktop game stores
- Character position, local town/mission state, progression and settings in
  local Chromium/Electron browser storage on the player's own computer.
- Optional user-triggered JSON progress exports and backup files in a local
  folder. The export schema expressly excludes account sessions, passwords,
  chat and unrelated browser storage.
- Optional system-provided text-to-speech when requested by the player.
  The Steam edition does not ship or contact the previously hosted voicebank.

No Steam Cloud integration is currently active. Do not claim Steam Cloud saves
until that feature, account consent and conflicts are tested and approved.

## Optional online presence
The current multiplayer Cloudflare Worker accepts a chosen username and
password; the account service stores a salted PBKDF2-SHA-256 password hash,
account identifier and creation time. It stores hashed bearer sessions with
a seven-day expiry. It also hashes the network address for login rate limiting
and periodically removes older rate-limit entries. Signed-in players'
display names, approximate 3D world positions/orientation and presence are
shared with nearby players through WebSockets.

No real-name or email field is required by the current account API.
The underlying Cloudflare/network service may process connection identifiers
and security logs outside the game database. The publisher must verify actual
Cloudflare retention, locations, subprocessors and access controls.

The current backend has sign-in and sign-out but **does not yet provide
self-service account deletion or a publisher-confirmed privacy contact**.
Do not publish this as a completed policy until there is a documented,
working data deletion/contact process and the publisher approves it.

## Before the Steam release
- Provide a dedicated public support/privacy address **owned by the
  publisher**, without exposing a personal mailbox.
- Implement and test account deletion, session revocation, retention policy
  and data request workflow, including a clear explanation to players.
- Test networking/analytics/recordings in the *actual signed Windows build*.
- Document Steamworks and Cloudflare as separate services with their own
  data handling; disclose optional online-account data accurately.
- Establish versioned policy, effective date, incident reporting and
  applicable privacy-law compliance (including Australian requirements).

**Status: DRAFT / NOT FOR PUBLIC STORE PAGE.**
