// Surveyed OpenStreetMap footprints, 2023 NSW Spatial Services airborne LiDAR
// heights (CC BY 4.0), and photo-interpreted architectural specifications for
// the North-West Dandaloo Street Heritage, Civic & Commercial Block
// (38–[address redacted], Narromine NSW 2821 — comparison screenshots #31–#44
// and #47–#50).
//
// FEATURE-SCOPED COORDINATION BOUNDARY (per docs/PARALLEL_AGENT_COORDINATION.md):
//   - Covers ONLY the 5 unclaimed mapped OSM buildings on West Dandaloo Street
//     between Nymagee Street and [address redacted] (`osm:179`, `osm:180`,
//     `osm:183`, `osm:184`, `osm:185`) plus the 3 unmapped North-West Dandaloo
//     Street POI sites (`Narromine Baptist Church` at 44 Dandaloo St,
//     `Narromine Battlers Mate` at 42 Dandaloo St, and `Aqua West` at
//     38–40 Dandaloo St).
//   - Explicitly EXCLUDES `osm:186` (`[address redacted]` — Narromine
//     Physiotherapy, claimed separately in PR #338) and EXCLUDES Dandaloo
//     Street road/median/kerb/lamp geometry (claimed in PR #336).
//   - No Google Street View imagery, pixels, or textures are extracted or
//     embedded; comparison screenshots #31–#50 are used strictly as visual QA
//     reference to diagnose generic-box discrepancies, and all non-surveyed
//     façade details (parapet mouldings, window/door bays, colours, signage)
//     are procedurally generated and explicitly labelled in `provenance`.

const freezePts = (pts) => Object.freeze(pts.map((p) => Object.freeze([...p])));

export const NARROMINE_NW_DANDALOO_INTEGRATION_SPEC = Object.freeze({
  featureId: 'narromine-nw-dandaloo-block',
  title: 'North-West Dandaloo Street Heritage, Civic & Commercial Block (38–[address redacted])',
  suppressedOsmBuildingIndices: Object.freeze([179, 180, 183, 184, 185]),
  excludedOsmBuildingIndices: Object.freeze([186]), // 50 Dandaloo St (Physiotherapy) owned by PR #338
  suppressedFillShopNames: Object.freeze([
    'Narromine Baptist Church',
    'Narromine Battlers Mate',
    'Aqua West',
  ]),
  licence: Object.freeze({
    osm: 'ODbL 1.0 (© OpenStreetMap contributors)',
    lidar: 'CC BY 4.0 (NSW Spatial Services Airborne LiDAR 2023)',
    visualComparison: 'Procedural geometry only; zero third-party imagery or textures embedded',
  }),
});

export const NARROMINE_NW_DANDALOO_BUILDINGS = Object.freeze([
  // ── 1. [address redacted] (NW Corner Dandaloo St & Nymagee St) — osm:179 ──
  Object.freeze({
    id: 'dandaloo-68-wardi-chillrite',
    osmIndex: 179,
    inventoryId: 'NR-OSM-0180',
    name: 'Former Bank Corner Building (Wardi Insurance & Ag Commodities / Chill-Rite)',
    address: '[address redacted] (corner Nymagee Street), Narromine NSW 2821',
    comparisonFrames: Object.freeze([31, 32, 33, 34, 35, 36]),
    pts: freezePts([
      [-4801.8, -989.3], // 0: NW rear
      [-4776.3, -985.0], // 1: NE Dandaloo St corner
      [-4778.0, -974.6], // 2: SE corner (Dandaloo St & Nymagee St)
      [-4803.6, -978.9], // 3: SW Nymagee St rear corner
    ]),
    frontageEdge: Object.freeze([1, 2]),
    returnEdge: Object.freeze([2, 3]),
    lidar: Object.freeze({
      surveyYear: 2023,
      groundAhdM: 238.94,
      eaveM: 4.17,
      ridgeM: 10.86,
      medianM: 9.05,
      sampleCount: 745,
      densityPtsPerM2: 2.73,
    }),
    architecture: Object.freeze({
      storeys: 2,
      style: 'Federation Classical Two-Storey Red-Brick Corner Bank & Commercial Building',
      wallHeightM: 8.45,
      pedimentApexM: 10.20,
      chimneyTopM: 10.86,
      rearSingleStoreyEaveM: 4.17,
      chillRiteWorkshopPts: freezePts([
        [-4794.0, -995.8],
        [-4775.4, -992.7],
        [-4776.3, -985.0],
        [-4795.0, -988.1],
      ]),
      chillRiteEaveM: 3.55,
      chillRiteRidgeM: 4.95,
    }),
    provenance: Object.freeze({
      footprint: 'surveyed-osm-polygon (osm:179)',
      heights: 'surveyed-nsw-lidar-2023 (eave 4.17 m, median 9.05 m, ridge 10.86 m)',
      facadeAndSignage: 'photo-interpreted-procedural-estimate (screenshots #31–#35)',
    }),
  }),

  // ── 2. 60–[address redacted] — Macquarie Clothing — osm:180 ────────────────
  Object.freeze({
    id: 'dandaloo-60-macquarie-clothing',
    osmIndex: 180,
    inventoryId: 'NR-OSM-0181',
    name: 'Macquarie Clothing',
    address: '60–[address redacted], Narromine NSW 2821',
    comparisonFrames: Object.freeze([35, 36, 37]),
    pts: freezePts([
      [-4791.2, -1006.7], // 0: NW rear
      [-4773.9, -1003.7], // 1: NE Dandaloo St corner
      [-4775.1, -996.9],  // 2: SE Dandaloo St corner
      [-4792.4, -999.9],  // 3: SW rear
    ]),
    frontageEdge: Object.freeze([1, 2]),
    lidar: Object.freeze({
      surveyYear: 2023,
      groundAhdM: 239.00,
      eaveM: 3.45,
      ridgeM: 5.94,
      medianM: 5.17,
      sampleCount: 342,
      densityPtsPerM2: 2.82,
    }),
    architecture: Object.freeze({
      storeys: 1,
      style: 'White-Painted Brick Stepped-Parapet Retail Shopfront with Post-Supported Verandah',
      wallHeightM: 4.45,
      wingParapetM: 5.17,
      centralParapetM: 5.94,
      verandahHeightM: 3.28,
      verandahDepthM: 3.10,
    }),
    provenance: Object.freeze({
      footprint: 'surveyed-osm-polygon (osm:180)',
      heights: 'surveyed-nsw-lidar-2023 (eave 3.45 m, median 5.17 m, ridge 5.94 m)',
      facadeAndSignage: 'photo-interpreted-procedural-estimate (screenshots #35–#37)',
    }),
  }),

  // ── 3. [address redacted] — Narromine Men's Shed — osm:183 ─────────────────
  Object.freeze({
    id: 'dandaloo-56-mens-shed',
    osmIndex: 183,
    inventoryId: 'NR-OSM-0184',
    name: "Narromine Men's Shed",
    address: '[address redacted], Narromine NSW 2821',
    comparisonFrames: Object.freeze([37, 38, 39]),
    pts: freezePts([
      [-4791.5, -1034.3],
      [-4782.1, -1033.0],
      [-4783.6, -1022.5],
      [-4778.2, -1021.8],
      [-4777.8, -1024.5],
      [-4770.5, -1023.5], // 5: NE Dandaloo St corner
      [-4771.6, -1015.6], // 6: SE Dandaloo St corner
      [-4777.9, -1016.5], // 7: Inner SE step
      [-4779.5, -1005.4], // 8: South workshop SE corner
      [-4814.0, -1010.3], // 9: SW rear corner
      [-4811.4, -1028.6], // 10: NW rear corner
      [-4792.7, -1026.0],
    ]),
    frontageEdge: Object.freeze([5, 6]),
    recessedEdge: Object.freeze([7, 8]),
    lidar: Object.freeze({
      surveyYear: 2023,
      groundAhdM: 239.00,
      eaveM: 3.92,
      ridgeM: 5.66,
      medianM: 4.64,
      sampleCount: 2828,
      densityPtsPerM2: 3.70,
    }),
    architecture: Object.freeze({
      storeys: 1,
      style: 'Cream-Rendered Mid-Century Commercial & Community Workshop with Stepped Parapet and Canopy',
      wallHeightM: 4.64,
      parapetHeightM: 5.66,
      canopyHeightM: 3.35,
      canopyDepthM: 3.20,
    }),
    provenance: Object.freeze({
      footprint: 'surveyed-osm-polygon (osm:183)',
      heights: 'surveyed-nsw-lidar-2023 (eave 3.92 m, median 4.64 m, ridge 5.66 m)',
      facadeAndSignage: 'photo-interpreted-procedural-estimate (screenshots #37–#39)',
    }),
  }),

  // ── 4. [address redacted] — Narromine USMC — osm:184 ───────────────────────
  Object.freeze({
    id: 'dandaloo-58-usmc',
    osmIndex: 184,
    inventoryId: 'NR-OSM-0185',
    name: 'Narromine United Services Memorial Club (USMC)',
    address: '[address redacted], Narromine NSW 2821',
    comparisonFrames: Object.freeze([40, 41, 42, 43]),
    pts: freezePts([
      [-4816.7, -1044.9], // 0: SW rear
      [-4767.5, -1036.8], // 1: SE Dandaloo St corner
      [-4762.4, -1067.9], // 2: NE Dandaloo St corner
      [-4811.6, -1076.0], // 3: NW rear
    ]),
    frontageEdge: Object.freeze([1, 2]),
    lidar: Object.freeze({
      surveyYear: 2023,
      groundAhdM: 239.02,
      eaveM: 4.41,
      ridgeM: 9.41,
      medianM: 8.07,
      sampleCount: 4710,
      densityPtsPerM2: 3.00,
    }),
    architecture: Object.freeze({
      storeys: 2,
      style: 'Two-Storey Memorial Club with Vertical-Ribbed Zincalume Upper Screen, Cream-Brick Ground Colonnade, Planters, Northern Portico & Three Flagpoles',
      groundStoreyHeightM: 4.15,
      porticoFasciaTopM: 4.41,
      upperScreenTopM: 8.35,
      roofPlantRidgeM: 9.41,
      flagpoleHeightM: 8.20,
      flagpoleCount: 3,
    }),
    provenance: Object.freeze({
      footprint: 'surveyed-osm-polygon (osm:184)',
      heights: 'surveyed-nsw-lidar-2023 (eave 4.41 m, median 8.07 m, ridge 9.41 m)',
      facadeAndSignage: 'photo-interpreted-procedural-estimate (screenshots #40–#43)',
    }),
  }),

  // ── 5. [address redacted] — Red-Brick Hipped Cottage — osm:185 ─────────────
  Object.freeze({
    id: 'dandaloo-52-cottage',
    osmIndex: 185,
    inventoryId: 'NR-OSM-0186',
    name: '[address redacted] Red-Brick Cottage',
    address: '[address redacted], Narromine NSW 2821',
    comparisonFrames: Object.freeze([44]),
    pts: freezePts([
      [-4800.2, -1083.8], // 0: NW rear
      [-4763.4, -1078.2], // 1: NE Dandaloo St corner
      [-4764.5, -1070.9], // 2: SE Dandaloo St corner
      [-4801.3, -1076.5], // 3: SW rear
    ]),
    frontageEdge: Object.freeze([1, 2]),
    lidar: Object.freeze({
      surveyYear: 2023,
      groundAhdM: 239.06,
      eaveM: 3.38,
      ridgeM: 5.86,
      medianM: 4.41,
      sampleCount: 974,
      densityPtsPerM2: 3.55,
    }),
    architecture: Object.freeze({
      storeys: 1,
      style: 'Single-Storey Red-Brick Hipped-Roof Cottage with Front Verandah Porch and Low Brick/Pier Boundary Fence',
      eaveHeightM: 3.38,
      ridgeHeightM: 5.86,
      verandahHeightM: 2.85,
      fenceHeightM: 0.95,
    }),
    provenance: Object.freeze({
      footprint: 'surveyed-osm-polygon (osm:185)',
      heights: 'surveyed-nsw-lidar-2023 (eave 3.38 m, median 4.41 m, ridge 5.86 m)',
      facadeAndSignage: 'photo-interpreted-procedural-estimate (screenshot #44)',
    }),
  }),

  // ── 6. [address redacted] — Narromine Baptist Church (unmapped POI) ────────
  Object.freeze({
    id: 'dandaloo-44-baptist-church',
    osmIndex: null,
    replaceFillShopName: 'Narromine Baptist Church',
    name: 'Narromine Baptist Church',
    address: '[address redacted], Narromine NSW 2821',
    comparisonFrames: Object.freeze([47, 48]),
    pts: freezePts([
      [-4775.6, -1110.9], // 0: NW rear
      [-4759.8, -1108.5], // 1: NE Dandaloo St front (set back behind hedge)
      [-4761.2, -1099.3], // 2: SE Dandaloo St front
      [-4777.0, -1101.7], // 3: SW rear
    ]),
    frontageEdge: Object.freeze([1, 2]),
    lidar: null,
    architecture: Object.freeze({
      storeys: 1,
      style: 'Gable-Fronted Red-Brick & White-Gable Church Hall with Northern Covered Entry Porch and Manicured Front Hedge',
      brickWallHeightM: 3.15,
      gableApexHeightM: 6.15,
      porchHeightM: 2.95,
      hedgeHeightM: 1.25,
    }),
    provenance: Object.freeze({
      footprint: 'osm-poi-anchored-parcel-estimate (replaces generic FILL_SHOPS box)',
      heights: 'photo-interpreted-procedural-estimate',
      facadeAndSignage: 'photo-interpreted-procedural-estimate (screenshots #47–#48)',
    }),
  }),

  // ── 7. [address redacted] — Narromine Battlers Mate (unmapped POI) ─────────
  Object.freeze({
    id: 'dandaloo-42-battlers-mate',
    osmIndex: null,
    replaceFillShopName: 'Narromine Battlers Mate',
    name: 'Narromine Battlers Mate',
    address: '[address redacted], Narromine NSW 2821',
    comparisonFrames: Object.freeze([48, 49]),
    pts: freezePts([
      [-4772.2, -1125.6], // 0: NW rear
      [-4756.4, -1123.2], // 1: NE Dandaloo St front
      [-4757.9, -1113.4], // 2: SE Dandaloo St front
      [-4773.7, -1115.8], // 3: SW rear
    ]),
    frontageEdge: Object.freeze([1, 2]),
    lidar: null,
    architecture: Object.freeze({
      storeys: 1,
      style: 'White-Painted Gable-Roofed Charity Shop & Plant Nursery with Dark-Green Trim and Shadecloth Security Fence',
      eaveHeightM: 3.35,
      ridgeHeightM: 5.65,
      verandahHeightM: 3.05,
      fenceHeightM: 1.85,
    }),
    provenance: Object.freeze({
      footprint: 'osm-poi-anchored-parcel-estimate (replaces generic FILL_SHOPS box)',
      heights: 'photo-interpreted-procedural-estimate',
      facadeAndSignage: 'photo-interpreted-procedural-estimate (screenshots #48–#49)',
    }),
  }),

  // ── 8. 38–[address redacted] — Aqua West Pumping & Irrigation ──────────────
  Object.freeze({
    id: 'dandaloo-38-aqua-west',
    osmIndex: null,
    replaceFillShopName: 'Aqua West',
    name: 'Aqua West Pumping & Irrigation Specialists',
    address: '38–[address redacted], Narromine NSW 2821',
    comparisonFrames: Object.freeze([50]),
    pts: freezePts([
      [-4768.2, -1149.2], // 0: NW rear
      [-4751.4, -1146.7], // 1: NE Dandaloo St front
      [-4753.3, -1134.1], // 2: SE Dandaloo St front
      [-4770.1, -1136.6], // 3: SW rear
    ]),
    frontageEdge: Object.freeze([1, 2]),
    lidar: null,
    architecture: Object.freeze({
      storeys: 1,
      style: 'Crisp White Stepped-Parapet Irrigation Showroom with Peaked Central Gable and Royal-Blue Cantilevered Awning',
      wingParapetHeightM: 4.95,
      centralGableApexM: 6.35,
      awningHeightM: 3.28,
      awningDepthM: 3.20,
    }),
    provenance: Object.freeze({
      footprint: 'osm-poi-anchored-parcel-estimate (replaces generic FILL_SHOPS box)',
      heights: 'photo-interpreted-procedural-estimate',
      facadeAndSignage: 'photo-interpreted-procedural-estimate (screenshot #50)',
    }),
  }),
]);
