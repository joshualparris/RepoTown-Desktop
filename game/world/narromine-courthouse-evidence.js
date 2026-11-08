// Surveyed, aerial-photo-matched, and estimated architectural & geospatial
// evidence for the Narromine Courthouse, Police & Civic Precinct on
// Section 17, DP 758759 (bounded by Burraway Street and Merilba Street,
// Narromine NSW 2821).
//
// CRITICAL BUILDING & ADDRESS DISAMBIGUATION (resolving the 35/37 Burraway St
// vs 47/49 Merilba St vs 23-29 Burraway St question using statutory NSW LEP,
// NSW Spatial Services Cadastre, G-NAF Address Points, and NSW Aerial Imagery):
//
//   1. [address redacted] (Lot 6, Section 17, DP 758759):
//      - Statutory Heritage Listing: Narromine Local Environmental Plan 2011,
//        Schedule 5, Part 1, Item No. I5 — "Courthouse (former)".
//      - Historic 1898 timber/weatherboard Former Narromine Courthouse (built
//        under NSW Government Architect Walter Liberty Vernon, later used as a
//        local museum and leased to the Narromine Car Club as clubrooms) plus
//        its historic square hipped-roof rear lock-up outbuilding.
//      - Missing from OpenStreetMap (`OSM.buildings`).
//
//   2. [address redacted] (Lot 10, Section 17, DP 758759):
//      - Operational "Narromine Courthouse" (NSW Local Court), a modern
//        T-shaped institutional brick courthouse fronting Merilba Street with a
//        covered western portico, eastern courtroom wing with raised central
//        clerestory monitor, and north-east registry/security annex.
//      - Mapped as an OSM POI (`Narromine Courthouse`, `[-4604.1, -829.1]`),
//        but its building footprint was missing from `OSM.buildings`.
//
//   3. [address redacted] / Corner of Burraway & Merilba Streets (Lot 5, Section 17, DP 758759):
//      - "Narromine Police Station" (`osm:174` / `NR-OSM-0175`), an L-shaped
//        heritage police station and residence wrapping around Lot 6 on the
//        west and north, with surveyed 2011 NSW Spatial Services LiDAR heights
//        (ground 239.40 m AHD, eave 3.16 m, ridge 6.39 m, median 4.08 m) plus a
//        northern police garage outbuilding.
//
//   4. [address redacted] (Lot 2 & Lot 12, Section 17, DP 758759):
//      - "Hub n Spoke" (`HubnSpoke` in OSM, `[-4561.0, -767.3]`), Narromine
//        Shire Council's circular radial-roofed community co-working and
//        business incubator building with a central circular open atrium oculus,
//        immediately south-east of [address redacted]. (Previously conflated
//        with [address redacted] because [address redacted] was unmapped in OSM.)
//
//   5. Adjacent Context Landmarks (not replaced by this module):
//      - 23–[address redacted] (Lot 16, DP 186682, Narromine LEP 2011 Item I4):
//        "Courthouse Hotel" (`The Court House Hotel`, `osm:172`, established 1889
//        on the opposite western corner of Burraway & Merilba Streets).
//      - [address redacted] (Lot 8, Section 17, DP 758759, `osm:39` & `osm:40`):
//        "Narromine Fire Station" (Fire & Rescue NSW Station 396).

const ORIGIN_LAT = -32.2330936;
const ORIGIN_LON = 148.2392784;
const METRES_PER_DEG_LAT = 111320;
const METRES_PER_DEG_LON = 111320 * Math.cos((ORIGIN_LAT * Math.PI) / 180);
const WORLD_OFFSET_X = -4795;
const WORLD_OFFSET_Z = -825;

export function worldToGeo([wx, wz]) {
  const dx = wx - WORLD_OFFSET_X;
  const dz = wz - WORLD_OFFSET_Z;
  const lon = ORIGIN_LON + dx / METRES_PER_DEG_LON;
  const lat = ORIGIN_LAT - dz / METRES_PER_DEG_LAT;
  return [+lat.toFixed(7), +lon.toFixed(7)];
}

export function geoToWorld([lat, lon]) {
  const x = WORLD_OFFSET_X + (lon - ORIGIN_LON) * METRES_PER_DEG_LON;
  const z = WORLD_OFFSET_Z + (ORIGIN_LAT - lat) * METRES_PER_DEG_LAT;
  return [+x.toFixed(2), +z.toFixed(2)];
}

const freezePts = (pts) => Object.freeze(pts.map((p) => Object.freeze([...p])));

// ── 1. Statutory & Cadastral Building Disambiguation Register ───────────────
export const NARROMINE_COURTHOUSE_DISAMBIGUATION = Object.freeze({
  precinctName: 'Narromine Courthouse, Police & Civic Precinct (Section 17, DP 758759)',
  cadastralSection: 'Section 17, DP 758759',
  parish: 'Narromine',
  county: 'Narromine',
  lga: 'Narromine Shire Council',
  disambiguationSummary:
    'Narromine has two distinct courthouse buildings on Section 17, DP 758759 plus the adjacent Hub n Spoke co-working hub at [address redacted] and the Courthouse Hotel across Merilba Street at 23–[address redacted]. There is no active museum titled "Court House Museum" today: the 1898 Former Courthouse at [address redacted] (LEP Item I5, Lot 6 Sec 17 DP 758759) previously served as a local historical museum and is now leased to the Narromine Car Club, while the operational NSW Local Court sits at [address redacted] (Lot 10 Sec 17 DP 758759) and Hub n Spoke occupies the circular atrium building at [address redacted] (Lot 2 Sec 17 DP 758759).',
  sites: Object.freeze({
    formerCourthouse35Burraway: Object.freeze({
      address: '[address redacted], Narromine NSW 2821',
      cadastralLot: 'Lot 6, Section 17, DP 758759',
      lepItem: 'I5',
      lepName: 'Courthouse (former)',
      lepSignificance: 'Local',
      constructionYear: 1898,
      architect: 'Walter Liberty Vernon (NSW Government Architect, 1890–1911)',
      historicalAndCurrentUse:
        'Built c. 1898 as the original timber Narromine Court House and rear lock-up adjoining the police station; subsequently used as a local historical museum and leased by Narromine Shire Council to the Narromine Car Club as clubrooms.',
      gnafCoordGeo: Object.freeze([-32.233555, 148.241560]),
      gnafCoordWorld: Object.freeze([-4579.03, -774.51]),
      evidenceLevel: 'surveyed',
    }),
    operationalCourthouse47Merilba: Object.freeze({
      address: '[address redacted], Narromine NSW 2821',
      cadastralLot: 'Lot 10, Section 17, DP 758759',
      lepItem: null,
      officialName: 'Narromine Courthouse (Narromine Local Court)',
      historicalAndCurrentUse:
        'Operational NSW Local Court house handling magistrate, criminal, traffic, and civil sittings on Merilba Street immediately north of Narromine Police Station.',
      gnafCoordGeo: Object.freeze([-32.233035, 148.241474]),
      gnafCoordWorld: Object.freeze([-4587.11, -832.30]),
      osmPoiWorld: Object.freeze([-4604.1, -829.1]),
      evidenceLevel: 'surveyed',
    }),
    policeStation49Merilba: Object.freeze({
      address: '[address redacted] (corner Burraway & Merilba Streets), Narromine NSW 2821',
      cadastralLot: 'Lot 5, Section 17, DP 758759',
      officialName: 'Narromine Police Station & Lock-up Residence',
      osmIndex: 174,
      inventoryId: 'NR-OSM-0175',
      gnafCoordGeo: Object.freeze([-32.233329, 148.241487]),
      gnafCoordWorld: Object.freeze([-4585.93, -799.60]),
      osmPoiWorld: Object.freeze([-4608.9, -789.5]),
      evidenceLevel: 'surveyed',
    }),
    hubNSpoke37Burraway: Object.freeze({
      address: '[address redacted], Narromine NSW 2821',
      cadastralLot: 'Lot 2 & Lot 12, Section 17, DP 758759',
      officialName: 'Hub n Spoke (Narromine Shire Council Co-Working & Business Incubator)',
      historicalAndCurrentUse:
        'Distinctive circular radial-roofed building with central open atrium oculus managed by Narromine Shire Council as a co-working space and regional office hub.',
      gnafCoordGeo: Object.freeze([-32.233448, 148.241846]),
      gnafCoordWorld: Object.freeze([-4552.16, -786.46]),
      osmPoiWorld: Object.freeze([-4561.0, -767.3]),
      evidenceLevel: 'surveyed',
    }),
    courthouseHotel23Burraway: Object.freeze({
      address: '23–[address redacted], Narromine NSW 2821',
      cadastralLot: 'Lot 16, DP 186682',
      lepItem: 'I4',
      lepName: 'Courthouse Hotel',
      osmIndex: 172,
      inventoryId: 'NR-OSM-0173',
      note: 'Two-storey 1889 hotel on the western corner of Burraway & Merilba Streets; modelled separately in main streetscape.',
    }),
  }),
});

// ── 2. Surveyed NSW Cadastral Lots (Section 17, DP 758759) ──────────────────
export const NARROMINE_COURTHOUSE_CADASTRAL_LOTS = Object.freeze([
  Object.freeze({
    lotId: '6/17/DP758759',
    label: 'Lot 6 Sec 17 DP 758759 — [address redacted] (Former Courthouse, LEP Item I5)',
    evidenceLevel: 'surveyed',
    source: 'NSW Spatial Services Land Parcel Property Theme (CC BY 4.0)',
    ringWorld: freezePts([
      [-4567.37, -790.03],
      [-4567.39, -789.92],
      [-4584.72, -760.32],
      [-4595.24, -766.52],
      [-4577.95, -796.13],
      [-4567.37, -790.03],
    ]),
  }),
  Object.freeze({
    lotId: '5/17/DP758759',
    label: 'Lot 5 Sec 17 DP 758759 — [address redacted] (Narromine Police Station)',
    evidenceLevel: 'surveyed',
    source: 'NSW Spatial Services Land Parcel Property Theme (CC BY 4.0)',
    ringWorld: freezePts([
      [-4560.93, -833.11],
      [-4567.37, -790.03],
      [-4577.95, -796.13],
      [-4595.24, -766.52],
      [-4610.93, -775.77],
      [-4604.39, -819.53],
      [-4574.30, -814.99],
      [-4571.37, -834.68],
      [-4560.93, -833.11],
    ]),
  }),
  Object.freeze({
    lotId: '10/17/DP758759',
    label: 'Lot 10 Sec 17 DP 758759 — [address redacted] (Narromine Courthouse / Local Court)',
    evidenceLevel: 'surveyed',
    source: 'NSW Spatial Services Land Parcel Property Theme (CC BY 4.0)',
    ringWorld: freezePts([
      [-4571.37, -834.68],
      [-4574.30, -814.99],
      [-4604.39, -819.53],
      [-4599.90, -849.62],
      [-4569.82, -845.06],
      [-4571.37, -834.68],
    ]),
  }),
  Object.freeze({
    lotId: '2/17/DP758759',
    label: 'Lot 2 Sec 17 DP 758759 — [address redacted] (Hub n Spoke)',
    evidenceLevel: 'surveyed',
    source: 'NSW Spatial Services Land Parcel Property Theme (CC BY 4.0)',
    ringWorld: freezePts([
      [-4551.82, -831.73],
      [-4537.48, -829.57],
      [-4544.41, -783.21],
      [-4550.82, -740.35],
      [-4572.85, -753.33],
      [-4567.39, -789.92],
      [-4567.37, -790.03],
      [-4560.93, -833.11],
      [-4551.82, -831.73],
    ]),
  }),
]);

// ── 3. Precinct Building Footprints, Heights & Architectural Profiles ───────
export const NARROMINE_COURTHOUSE_BUILDINGS = Object.freeze([
  // 1) [address redacted] — Former Narromine Courthouse (1898, LEP Item I5)
  Object.freeze({
    id: 'narromine-former-courthouse-1898',
    name: 'Former Narromine Courthouse (1898 Heritage Item I5)',
    address: '[address redacted]',
    cadastralLot: 'Lot 6, Section 17, DP 758759',
    lepItem: 'I5',
    osmIndex: null,
    role: 'heritage-former-courthouse',
    footprintEvidenceLevel: 'photo-matched', // Georeferenced from NSW Spatial Services orthophoto inside surveyed Lot 6
    heightEvidenceLevel: 'estimated',        // Constrained by adjacent 2011 LiDAR on osm:174 (eave 3.16 m, ridge 6.39 m)
    facadeEvidenceLevel: 'estimated',
    sources: Object.freeze([
      'Narromine Local Environmental Plan 2011 Schedule 5 Item I5 (Lot 6, Section 17, DP 758759)',
      'NSW Spatial Services Cadastral Parcel 6/17/DP758759 & G-NAF Address Point (CC BY 4.0)',
      'NSW Spatial Services Six Maps Orthophoto (148.2410,-32.23405 to 148.2423,-32.23275, CC BY 4.0)',
    ]),
    centreWorld: Object.freeze([-4585.8, -777.8]),
    centreGeo: Object.freeze(worldToGeo([-4585.8, -777.8])),
    orientationDeg: 120.5, // Aligned with Lot [address redacted]
    footprintWorld: freezePts([
      [-4591.8, -772.0], // SW front corner facing Burraway Street
      [-4585.5, -768.2], // SE front corner facing Burraway Street
      [-4577.8, -781.0], // NE rear corner
      [-4584.1, -784.8], // NW rear corner
    ]),
    verandahWorld: freezePts([
      [-4593.1, -769.8], // SW verandah edge toward Burraway Street
      [-4586.8, -766.0], // SE verandah edge toward Burraway Street
      [-4585.5, -768.2],
      [-4591.8, -772.0],
    ]),
    lockupWorld: freezePts([
      [-4580.4, -789.2], // SW corner of 1898 rear lock-up outbuilding on Lot 6
      [-4574.2, -785.5], // SE corner
      [-4571.5, -790.0], // NE corner
      [-4577.7, -793.7], // NW corner
    ]),
    dimensionsM: Object.freeze({
      mainLength: 14.95,
      mainWidth: 7.35,
      verandahDepth: 2.55,
      lockupLength: 7.22,
      lockupWidth: 5.25,
      eaveHeightM: 3.35,
      ridgeHeightM: 5.45,
      lockupEaveM: 2.85,
      lockupRidgeM: 4.10,
    }),
    architecture: Object.freeze({
      wallMaterial: 'painted weatherboard / heritage masonry-plinth timber courthouse construction',
      roofShape: 'corrugated galvanised iron hipped roof with front bullnose/skillion Burraway Street verandah',
      roofMaterial: 'weathered galvanised corrugated steel (visible in NSW Spatial Services aerial imagery)',
    }),
  }),

  // 2) [address redacted] — Narromine Police Station & Lock-up Residence (osm:174)
  Object.freeze({
    id: 'narromine-police-station',
    name: 'Narromine Police Station & Residence',
    address: '[address redacted] (corner Burraway & Merilba Streets)',
    cadastralLot: 'Lot 5, Section 17, DP 758759',
    lepItem: null,
    osmIndex: 174,
    inventoryId: 'NR-OSM-0175',
    role: 'police-station',
    footprintEvidenceLevel: 'surveyed', // Surveyed OSM footprint + NSW Spatial Services aerial verification
    heightEvidenceLevel: 'surveyed',    // Surveyed 2011 NSW Spatial Services LiDAR
    facadeEvidenceLevel: 'estimated',
    sources: Object.freeze([
      'OpenStreetMap building footprint osm:174 (ODbL 1.0)',
      'NSW Spatial Services 2011 Airborne LiDAR (ground 239.40 m AHD, eave 3.16 m, ridge 6.39 m, median 4.08 m, CC BY 4.0)',
      'NSW Spatial Services Cadastral Parcel 5/17/DP758759 & G-NAF Address Point [address redacted] (CC BY 4.0)',
    ]),
    centreWorld: Object.freeze([-4598.7, -791.5]),
    centreGeo: Object.freeze(worldToGeo([-4598.7, -791.5])),
    orientationDeg: 30.8,
    footprintWorld: freezePts([
      [-4603.4, -807.6],
      [-4581.4, -794.5],
      [-4594.6, -772.5],
      [-4606.9, -779.9],
      [-4598.2, -794.3],
      [-4607.9, -800.1],
    ]),
    partsWorld: Object.freeze([
      // South-west hipped main police residence/station block facing Burraway & Merilba corner
      Object.freeze({
        id: 'police-main-wing',
        pts: freezePts([
          [-4606.9, -779.9],
          [-4594.6, -772.5],
          [-4586.0, -786.8],
          [-4598.2, -794.3],
        ]),
        eaveH: 3.16,
        ridgeH: 5.95,
        roofType: 'hipped',
      }),
      // North-west to south-east gabled administrative & charge-room wing
      Object.freeze({
        id: 'police-north-wing',
        pts: freezePts([
          [-4607.9, -800.1],
          [-4586.0, -786.8],
          [-4581.4, -794.5],
          [-4603.4, -807.6],
        ]),
        eaveH: 3.16,
        ridgeH: 6.39,
        roofType: 'gable',
      }),
    ]),
    garageWorld: freezePts([
      [-4600.4, -818.8],
      [-4594.0, -817.8],
      [-4594.8, -812.0],
      [-4601.2, -813.0],
    ]),
    lidar: Object.freeze({
      surveyYear: 2011,
      groundAHDm: 239.40,
      eaveProxyM: 3.16,
      ridgeProxyM: 6.39,
      medianRoofM: 4.08,
      points: 275,
      densityPtsPerM2: 0.59,
    }),
  }),

  // 3) [address redacted] — Operational Narromine Courthouse (NSW Local Court)
  Object.freeze({
    id: 'narromine-local-court-47-merilba',
    name: 'Narromine Courthouse (NSW Local Court)',
    address: '[address redacted]',
    cadastralLot: 'Lot 10, Section 17, DP 758759',
    lepItem: null,
    osmIndex: null,
    role: 'operational-local-court',
    footprintEvidenceLevel: 'photo-matched', // Georeferenced from NSW Spatial Services orthophoto inside surveyed Lot 10
    heightEvidenceLevel: 'estimated',
    facadeEvidenceLevel: 'estimated',
    sources: Object.freeze([
      'NSW Spatial Services Cadastral Parcel 10/17/DP758759 & G-NAF Address Point [address redacted] (CC BY 4.0)',
      'NSW Spatial Services Six Maps Orthophoto (CC BY 4.0)',
      'OpenStreetMap POI "Narromine Courthouse" ([-4604.1, -829.1], ODbL 1.0)',
    ]),
    centreWorld: Object.freeze([-4590.5, -833.5]),
    centreGeo: Object.freeze(worldToGeo([-4590.5, -833.5])),
    orientationDeg: 8.6, // Aligned with Merilba Street & Lot 10 boundary
    spineWorld: freezePts([
      [-4597.5, -847.8], // NW corner
      [-4586.2, -845.9], // NE corner
      [-4589.8, -820.2], // SE corner
      [-4601.1, -822.1], // SW corner
    ]),
    porticoWorld: freezePts([
      [-4601.6, -839.2], // NW portico edge facing Merilba Street
      [-4598.3, -838.6],
      [-4600.4, -822.2],
      [-4603.7, -822.8], // SW portico edge facing Merilba Street
    ]),
    eastWingWorld: freezePts([
      [-4587.8, -837.5],
      [-4578.7, -835.9],
      [-4580.0, -826.9],
      [-4589.1, -828.5],
    ]),
    clerestoryWorld: freezePts([
      [-4593.0, -836.9],
      [-4583.7, -835.2],
      [-4584.5, -829.6],
      [-4593.8, -831.3],
    ]),
    annexWorld: freezePts([
      [-4584.4, -845.8],
      [-4578.2, -844.8],
      [-4579.4, -837.4],
      [-4585.6, -838.4],
    ]),
    dimensionsM: Object.freeze({
      spineLength: 26.0,
      spineWidth: 11.45,
      eastWingLength: 9.25,
      eastWingWidth: 9.15,
      eaveHeightM: 3.65,
      ridgeHeightM: 4.55,
      clerestoryTopM: 5.75,
      porticoEaveM: 3.15,
      annexEaveM: 3.05,
    }),
  }),

  // 4) [address redacted] — Hub n Spoke Circular Atrium Co-Working Building
  Object.freeze({
    id: 'narromine-hub-n-spoke-37-burraway',
    name: 'Hub n Spoke ([address redacted])',
    address: '[address redacted]',
    cadastralLot: 'Lot 2 & Lot 12, Section 17, DP 758759',
    lepItem: null,
    osmIndex: null,
    role: 'council-coworking-hub',
    footprintEvidenceLevel: 'photo-matched', // Georeferenced from NSW Spatial Services orthophoto + council architectural description
    heightEvidenceLevel: 'estimated',
    facadeEvidenceLevel: 'photo-matched',
    sources: Object.freeze([
      'NSW Spatial Services Cadastral Parcel 2/17/DP758759 & G-NAF Address Point [address redacted] (CC BY 4.0)',
      'NSW Spatial Services Six Maps Orthophoto showing circular radial roof & central circular atrium oculus (CC BY 4.0)',
      'Narromine Shire Council / Hub n Spoke architectural description (round building with central atrium and circular desk layout)',
    ]),
    centreWorld: Object.freeze([-4559.8, -769.7]),
    centreGeo: Object.freeze(worldToGeo([-4559.8, -769.7])),
    dimensionsM: Object.freeze({
      coreOuterRadiusM: 8.40,
      atriumInnerRadiusM: 2.35,
      fanWingOuterRadiusM: 13.20,
      coreEaveHeightM: 3.40,
      coreApexHeightM: 4.85,
      fanWingEaveHeightM: 3.05,
      segments: 16,
    }),
  }),
]);

// ── 4. Pedestrian Forecourts, Entry Paths & Fencing ─────────────────────────
export const NARROMINE_COURTHOUSE_ACCESS = Object.freeze({
  burrawayEntryPathsWorld: Object.freeze([
    // Entry path from Burraway Street footpath into [address redacted] (Former Courthouse)
    Object.freeze({
      id: 'path-35-burraway-former-courthouse',
      pts: freezePts([
        [-4593.8, -761.6],
        [-4590.8, -759.8],
        [-4587.6, -767.4],
        [-4590.6, -769.2],
      ]),
    }),
    // Entry path from Merilba Street footpath into [address redacted] (Narromine Police Station)
    Object.freeze({
      id: 'path-49-merilba-police-station',
      pts: freezePts([
        [-4615.0, -790.5],
        [-4601.5, -785.5],
        [-4600.2, -788.8],
        [-4613.8, -793.8],
      ]),
    }),
    // Entry plaza from Burraway Street footpath into [address redacted] (Hub n Spoke)
    Object.freeze({
      id: 'path-37-burraway-hub-n-spoke',
      pts: freezePts([
        [-4569.5, -752.8],
        [-4559.5, -747.0],
        [-4556.0, -754.5],
        [-4566.0, -760.2],
      ]),
    }),
    // Entry forecourt from Merilba Street footpath into [address redacted] (Narromine Courthouse)
    Object.freeze({
      id: 'path-47-merilba-local-court',
      pts: freezePts([
        [-4610.5, -835.0],
        [-4601.5, -836.2],
        [-4602.8, -824.5],
        [-4611.8, -823.3],
      ]),
    }),
  ]),
  pedestrianEntryPointsWorld: Object.freeze({
    formerCourthouseFront: Object.freeze([-4590.5, -766.5]),
    policeStationCorner: Object.freeze([-4608.9, -789.5]),
    localCourtFront: Object.freeze([-4605.8, -829.5]),
    hubNSpokeFront: Object.freeze([-4563.5, -753.5]),
  }),
  fencesWorld: Object.freeze([
    // Heritage picket/rail boundary fence along Lot 6 ([address redacted]) side boundaries
    Object.freeze({
      id: 'fence-lot6-west',
      a: Object.freeze([-4594.0, -768.2]),
      b: Object.freeze([-4578.8, -794.5]),
    }),
    Object.freeze({
      id: 'fence-lot6-east',
      a: Object.freeze([-4584.2, -762.5]),
      b: Object.freeze([-4568.5, -789.2]),
    }),
    // Civic fence between [address redacted] Local Court and [address redacted] Police yard
    Object.freeze({
      id: 'fence-lot10-south',
      a: Object.freeze([-4603.5, -819.4]),
      b: Object.freeze([-4574.8, -815.1]),
    }),
  ]),
});

// ── 5. Integration Specification ────────────────────────────────────────────
export const NARROMINE_COURTHOUSE_INTEGRATION_SPEC = Object.freeze({
  description:
    'When integrating buildNarromineCourthousePrecinct into src/world/narromine.js, suppress generic OSM extrusion index 174 (osm:174 / NR-OSM-0175 at [address redacted]) so the detailed Police Station model replaces the plain beige box without duplication. Buildings at [address redacted] (Former Courthouse, LEP I5), [address redacted] (Narromine Local Court), and [address redacted] (Hub n Spoke) had no OSM building polygons and therefore fill previously empty civic lots.',
  suppressedOsmBuildingIndices: Object.freeze([174]),
  suppressedInventoryIds: Object.freeze(['NR-OSM-0175']),
});

// ── 6. WGS84 GeoJSON FeatureCollection ──────────────────────────────────────
const toGeoRing = (ptsWorld) => {
  const ring = ptsWorld.map((p) => {
    const [lat, lon] = worldToGeo(p);
    return [lon, lat];
  });
  if (
    ring.length > 0 &&
    (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])
  ) {
    ring.push([...ring[0]]);
  }
  return ring;
};

export const NARROMINE_COURTHOUSE_PRECINCT_GEOJSON = Object.freeze({
  type: 'FeatureCollection',
  name: 'narromine-courthouse-precinct',
  features: Object.freeze([
    ...NARROMINE_COURTHOUSE_CADASTRAL_LOTS.map((lot) =>
      Object.freeze({
        type: 'Feature',
        properties: Object.freeze({
          id: `cadastral-${lot.lotId.replace(/\//g, '-')}`,
          lotId: lot.lotId,
          label: lot.label,
          featureType: 'cadastral_lot',
          evidenceLevel: lot.evidenceLevel,
        }),
        geometry: Object.freeze({
          type: 'Polygon',
          coordinates: Object.freeze([toGeoRing(lot.ringWorld)]),
        }),
      })
    ),
    Object.freeze({
      type: 'Feature',
      properties: Object.freeze({
        id: 'narromine-former-courthouse-1898',
        name: 'Former Narromine Courthouse (1898)',
        address: '[address redacted]',
        cadastralLot: 'Lot 6, Section 17, DP 758759',
        lepItem: 'I5',
        featureType: 'building',
        evidenceLevel: 'photo-matched',
      }),
      geometry: Object.freeze({
        type: 'Polygon',
        coordinates: Object.freeze([toGeoRing(NARROMINE_COURTHOUSE_BUILDINGS[0].footprintWorld)]),
      }),
    }),
    Object.freeze({
      type: 'Feature',
      properties: Object.freeze({
        id: 'narromine-former-courthouse-lockup-1898',
        name: 'Former Courthouse Rear Lock-up (1898)',
        address: '[address redacted]',
        cadastralLot: 'Lot 6, Section 17, DP 758759',
        lepItem: 'I5',
        featureType: 'building',
        evidenceLevel: 'photo-matched',
      }),
      geometry: Object.freeze({
        type: 'Polygon',
        coordinates: Object.freeze([toGeoRing(NARROMINE_COURTHOUSE_BUILDINGS[0].lockupWorld)]),
      }),
    }),
    Object.freeze({
      type: 'Feature',
      properties: Object.freeze({
        id: 'narromine-police-station',
        name: 'Narromine Police Station & Residence',
        address: '[address redacted]',
        cadastralLot: 'Lot 5, Section 17, DP 758759',
        osmIndex: 174,
        inventoryId: 'NR-OSM-0175',
        featureType: 'building',
        evidenceLevel: 'surveyed',
      }),
      geometry: Object.freeze({
        type: 'Polygon',
        coordinates: Object.freeze([toGeoRing(NARROMINE_COURTHOUSE_BUILDINGS[1].footprintWorld)]),
      }),
    }),
    Object.freeze({
      type: 'Feature',
      properties: Object.freeze({
        id: 'narromine-local-court-47-merilba',
        name: 'Narromine Courthouse (NSW Local Court)',
        address: '[address redacted]',
        cadastralLot: 'Lot 10, Section 17, DP 758759',
        featureType: 'building',
        evidenceLevel: 'photo-matched',
      }),
      geometry: Object.freeze({
        type: 'Polygon',
        coordinates: Object.freeze([toGeoRing(NARROMINE_COURTHOUSE_BUILDINGS[2].spineWorld)]),
      }),
    }),
  ]),
});
