# Commercial content and rights review — 2026-11-08

**Result: third-party library notices and available CC0 asset records are documented. Entire game NOT certified for sale.**

## Audited dependency inventory

| Content included in current desktop export | Evidence and declared licence | Assessment |
|---|---|---|
| `game/assets/furniture` | KayKit Furniture Bits, CC0 file distributed with models | Licence record present; exact material provenance not independently compared file-by-file |
| `game/assets/people/kaykit-*.glb` | KayKit Adventurers, source commit recorded in `kaykit-manifest.json` | Licence record present |
| `game/assets/people/quaternius` | Quaternius model/animation exports; CC0 notice | Licence record present; confirm source package and transformations |
| `game/assets/vehicles` | Kenney Car Kit, CC0 notice | Licence record present |
| `game/vendor/three.module.min.js`, `GLTFLoader.js`, `SkeletonUtils.js`, `BufferGeometryUtils.js` | Three.js MIT licence and attribution | Full MIT notice added locally; original files are versioned third-party code |
| `game/vendor/hls.light.min.mjs` | hls.js Apache-2.0 | Full Apache-2.0 licence and original project's notice added locally |
| `game/world`, `game/ui`, `game/dialogue`, main town models and names | Original or modified game code, generated world data and authored dialogue | **Owner provenance and any AI-created content must be confirmed by publisher** |
| Resident voice recordings | Excluded from game files; previously source referenced externally hosted voicebank | **Replaced with local optional device narration in this Steam build; no personal voicebank URL shipped** |
| Branded businesses, real locality names and maps | Commercial representation of real-world names/places | **Trademark, map/data provenance and factual-claims review outstanding** |

## Why this is still NO-GO

An embedded CC0 label or copyright notice supports a rights audit, but does not prove every binary is actually from that source. The commercial build must also be reviewed for copied code, non-permitted graphics, AI-generated characters or dialogue, trademarks, sound effects, privacy/consent, and any generated maps or third-party geospatial data. Do not state complete legal clearance without evidence from the rights holder where necessary.

### Publisher follow-up, not something CI can attest

1. Confirm ownership and any licences for the *original game code*, world design, dialogue, artwork, name and real-world maps.
2. Review each included Quaternius GLB/GLTF against the source asset pack/version and terms, including any modified variants.
3. Assess fictional vs real businesses, names, branding, street/map source and whether store marketing could imply affiliation.
4. Disclose any **pre-generated AI art/text/audio consumed by players** and any *live* AI features accurately in Steam's Content Survey. This is separate from AI merely used to speed up development.
5. Review age and mature content in **the entire shipped build**, including any hidden content.
6. Preserve these licence/notice texts in *each* shipped Steam depot and downloadable build; automated tests check presence.

References:
- Three.js MIT licence: https://github.com/mrdoob/three.js/blob/dev/LICENSE
- HLS.js Apache notice: https://github.com/video-dev/hls.js/blob/master/LICENSE
- Apache-2.0 standard text: https://github.com/spdx/license-list-data/blob/main/text/Apache-2.0.txt
- Steam AI/mature content survey: https://partner.steamgames.com/doc/gettingstarted/contentsurvey

All unresolved rights must remain marked **not approved** in `docs/STEAM_GO_NO_GO.json`.
