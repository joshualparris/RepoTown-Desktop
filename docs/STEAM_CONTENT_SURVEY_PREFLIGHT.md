# Steamworks Content Survey — preflight, NOT a submitted declaration

Date: 8 November 2026 · Version under preparation: 0.3.1.

This is a **working inventory** for the human Steamworks publisher. The publisher must
open the Content Survey in Steamworks and answer based on the complete shipped build.
A green code test is not classification approval.

## Content identified in shipped game

| Topic | Evidence seen in code | Disposition |
|---|---|---|
| Alcohol / pub | Fictional drinks, service limits, simulated responsible service of alcohol, in-game beer consumption | **Disclose applicable alcohol themes** and review rating |
| Keno-style random-number demonstration | `world/pub-venue.js` and `ui/pub-venue-panel.js`; draw of 20 numbers from 80, free tickets, *no stake, prizes or cash* | **Gambling theme present**. Review whether the implemented activity meets a jurisdiction's simulated-gambling definition; no assumed G/PG rating |
| Dice / loot / mini-games | Local random dice, arcade scores and chance-based prizes; no evidence of real-money purchases in bundled UI | Assess separately if later linked to any money/stake/purchasable item |
| Fantasy fighting | Stylised fantasy-character art and local turn-based combat activities | Review depictions of violence and any blood/gore |
| Online presence | Optional registered-account player avatars; no synchronised economy/inventory | Disclose online interactivity and actual account/data practices |
| Dialogue/creative content | Human and AI-assisted authored content may have been generated before export; exact provenance is not established | **Review and disclose pre-generated AI content consumed by players**, including artwork, narrative and voice if applicable |
| Live AI | No live generative-AI endpoint has been verified as part of this desktop candidate; optional Cloudflare service currently handles account/presence | Audit for live AI prior to marking this answer. If present, give Valve prompt/output guardrails and moderation description |
| Real people/places | Narromine names and OSM-based map geometry | Map licence + trademark and rights-of-publicity audit separate |
| Audio/voice | No real hosted voice clips included; device text-to-speech only when user presses Listen | No external recordings approved for Steam |

## Australian classification risk

From 22 September 2024, Australian Classification requires a minimum R 18+
rating for **simulated gambling**. The official FAQ gives criteria including a
gambling-like service, stake of value, random outcome and potential loss of stake.
The current Keno activity is labelled a **free demonstration with no monetary
stake or winnings**; this reduces, but does not conclusively eliminate, its rating
risk. The publisher must not market it as a licensed Keno product or make a
definitive age-rating claim without formal survey/classification.

- https://www.classification.gov.au/about-us/media-and-news/news/new-classifications-for-gambling-content-video-games
- https://www.classification.gov.au/sites/default/files/documents/game-guidelines-for-gambling-like-content-faq.pdf

## Steamworks process

The Steamworks Content Survey asks about mature content and generative AI.
Steam's current guidance distinguishes AI-generated material shipped to users
(pre-generated) from AI generated at runtime. Any material can need a
disclosure, even if produced during development, when actually consumed by
players. The publisher signs off on the actual survey in Steamworks.

- https://partner.steamgames.com/doc/gettingstarted/contentsurvey

**Blocked:** no authenticated Steamworks survey or classification outcome is available
in this chat; `AIContentSurveyAccurate` remains false.
