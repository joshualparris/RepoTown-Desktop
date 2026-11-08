# itch.io release runbook (free path)

itch.io is the cheapest way to ship Repository Town today: publishing costs
nothing, there is no review queue, and you choose the revenue share (0-100%,
default 10%). This runbook takes the tested Windows build and the generated
artwork and turns them into a live itch.io page in about an hour. Nothing here
costs money.

Steam is not cancelled — the Steamworks layer from PR #9 still works and the
Steam Direct fee (US$100, about AU$150) is recoupable once the game earns
US$1,000. Revisit Steam after itch.io proves demand. GOG is also free to submit,
but curated; see the end of this document.

## 0. What you need

- The tested Windows build: download the `RepoTown-Desktop-tested-Windows`
  artifact from the latest successful
  [windows-release-candidate run](https://github.com/joshualparris/RepoTown-Desktop/actions/workflows/windows-release-candidate.yml)
  (~230 MiB, inside the 1 GiB per-file limit new itch.io accounts get), or build
  locally with `npm run package:windows` and use the zip in `release/`.
- Artwork, already generated in this repo:
  - `store/itch/cover.png` (630x500, itch's recommended cover size; 315:250 aspect)
  - `store/itch/social.png` (1200x630 share card)
  - `store/itch/banner.png` (1920x480 page banner)
  - `store/screenshots/01..05*.png` (1920x1080 — itch recommends 3-5; skip the
    draft `06` chat screenshot)
- Regenerate any time: `npm run itch:assets`. Validate everything: `npm run itch:ready`.

## 1. Create the project page (free)

1. Sign up / log in at [itch.io](https://itch.io) (free).
2. Dashboard -> **Create new project**.
3. Title: `Repository Town`. URL: `repository-town`.
4. Kind of project: **Downloadable** (the Windows build). A browser build is
   possible later — see "Optional: browser build" below.
5. Upload the Windows zip as the main file. Set:
   - "This file will be playable in the browser": off
   - Release status: **Draft** while you set the page up.
6. Embed cover image: `store/itch/cover.png`. Media: the five screenshots.
7. Description (adapt freely):

   > A calm, offline-friendly life sim in a small town that runs itself.
   > Restock the store, pull espresso shots, drive the loop, meet the
   > neighbours — the town keeps simulating whether you're there or not.
   > Single-player first; multiplayer arrives as the hosted service comes online.
   > Works fully offline. Saves locally. Windows 10/11.

8. Tags: `life-sim`, `simulation`, `singleplayer`, `relaxing` (itch requires
   at least a few tags for browse discovery).
9. Custom page banner: `store/itch/banner.png`; social card: `store/itch/social.png`
   (Edit -> Metadata -> Promo images).

## 2. Pricing (still free)

- **$0 or Donate** (recommended to start): anyone can download free; supporters
  can pay before downloading. Set a suggested price of a few dollars.
- Or **Paid** with a minimum price if you want to gate downloads.
- Revenue share to itch.io: your choice, 0-100%. The default 10% is fair; 0% is
  allowed. Payment processor fees still apply (PayPal/Stripe ~$0.30 + 2.9% per
  transaction) — that is the only unavoidable cost, and only on paid sales.

## 3. Payments and payouts

- Seller settings -> Payments: pick **Direct to you** (each purchase goes
  straight to your PayPal/Stripe) or **Collected by itch.io, paid later**.
- Tax interview is required before your first payout (free, just forms).
- Australia: PayPal/Stripe handle currency conversion; expect small FX fees.

## 4. Publish

1. Save, then **View page** and proof everything (download the zip from the
   page and run it once).
2. Release status: **Published**. Share the link.
3. Optional: butler (itch's CLI) can push future builds from CI without manual
   upload — add later if updates become frequent.

## Optional: browser build

The game also runs as a static web build (it already runs on GitHub Pages).
itch.io can host it as an embedded "Run in browser" project: zip the static
build's files (game snapshot output, not the Electron shell) and upload as a
second file with "playable in the browser" on. Only do this after checking that
every feature the page promises works without desktop-only APIs — the Electron
shell is the fully tested configuration.

## GOG later (also free to submit)

GOG costs nothing to submit but is curated — they review a ~15-question form
at [gog.com/submit-your-game](https://www.gog.com/submit-your-game), take weeks
to months, and reject many games. They explicitly encourage submitting once the
game is finished or **already released elsewhere**, so an itch.io release with
some traction strengthens the pitch. Their requirements fit this game well:
fully playable offline (yes), DRM-free (yes), no microtransactions (yes).
Revenue split starts at 70/30. Submit after the itch.io page has been live and
stable for a while.

## Steam later (US$100, recoupable)

The entire Steamworks layer (13 achievements, optional steamworks.js hook,
packaged NSIS installer + zip, 34/34 readiness gate) is merged and dormant —
nothing expires. When itch.io sales justify it, follow
`docs/STEAMWORKS_ONBOARDING.md`. The US$100 Steam Direct fee is per-app and is
repaid as a credit once the game earns US$1,000.
