# OpenStreetMap provenance and distribution review

The playable Narromine town contains roads, places and/or building footprints
identified in source code as OSM-derived. The OpenStreetMap Foundation permits
commercial use under the Open Database License (ODbL), subject to attribution
and potentially derived database share-alike.

### Changes already implemented
- A visible, legible game overlay acknowledges © OpenStreetMap contributors
  and links to the OSM copyright/licence page.
- `game/world/OSM-ATTRIBUTION.txt` is included with distributed world data.
- The Steam rights gate rejects a new export without these notices.
- The original private source, photos and personal projects remain excluded.

### Still requires an accountable publisher/provenance review
- Establish the exact data source(s), acquisition dates and attribution terms
  for every item in `game/world/narromine-*` and
  `game/narromine-building-inventory.json`.
- Determine which modified maps, roads and building datasets constitute
  ODbL Derivative Databases and, where necessary, provide them on ODbL terms
  through an accessible distribution location.
- Check independent photographs, aerial imagery, government data and
  map-derived styling for their own reuse conditions.
- Confirm no Google Street View screenshots or other proprietary map imagery
  are actually shipped. The Steam edition excludes old comparison pages.
- Verify every Steam screenshot/trailer based on map content carries suitable
  credit if required; do not imply OSM is affiliated with the game.

OSM Foundation attribution guidelines:
https://osmfoundation.org/wiki/Attribution_Guidelines
OSM licence:
https://www.openstreetmap.org/copyright

**Status:** attribution added and automatically tested; database provenance
and derivative licensing not yet approved for commercial sale.
