// Geospatial, LiDAR, cadastral, and architectural evidence model for the
// Narromine Railway Station precinct (Main Western Line, 497.554 km from Sydney).
//
// Pure data module (no Three.js or DOM dependency) so unit tests, fidelity tools,
// and the 3D precinct builder share a single auditable source of truth.
// Every record explicitly distinguishes:
//   - "surveyed": footprint geometry from OpenStreetMap (ODbL 1.0) / NSW Spatial
//     Services aerial tracing and roof heights from NSW airborne LiDAR (CC BY 4.0)
//   - "photo-matched": materials, roof form, cantilevered platform awning, and
//     NSW TrainLink coach stop function corroborated by heritage & published records
//   - "estimated": window/door bay spacing, platform length/coping profile,
//     boundary fencing, and forecourt street furniture where metric plans are absent
import { OSM, OFFSET, toWorld, geoToWorld, STREETS, RAIL } from './narromine-layout.js';

const RAD = Math.PI / 180;
const EARTH = 6371008.8;
const COS_ANCHOR = Math.cos(OSM.anchor.lat * RAD);

export function worldToGeo([wx, wz]) {
  const x = wx - OFFSET.x;
  const z = wz - OFFSET.z;
  const lat = +(OSM.anchor.lat - z / (RAD * EARTH)).toFixed(7);
  const lon = +(OSM.anchor.lon + x / (RAD * EARTH * COS_ANCHOR)).toFixed(7);
  return [lat, lon];
}

const freezePts = (pts) => Object.freeze(pts.map((p) => Object.freeze([...p])));

export const NARROMINE_RAILWAY_HERITAGE = Object.freeze({
  id: 'narromine-railway-station-precinct',
  officialName: 'Narromine Railway Station',
  historicalInitialName: 'Narramine Railway Station (1883–1889)',
  line: 'Main Western Line (with Parkes–Narromine branch junction)',
  distanceFromSydneyKm: 497.554,
  streetAddress: 'Derribong Avenue, Narromine NSW 2821',
  accessRoadName: 'Narromine Station Access',
  cadastralLot: 'Lot 4, DP 1012153',
  lepListing: Object.freeze({
    instrument: 'Narromine Local Environmental Plan 2011',
    schedule: 'Schedule 5 Environmental Heritage — Part 1 Heritage Items',
    itemNumber: 'I11',
    significance: 'Local',
    evidenceLevel: 'surveyed',
  }),
  timeline: Object.freeze([
    Object.freeze({ date: '1882-10-20', event: 'Main Western railway extended from Dubbo to Nevertire via Narromine.' }),
    Object.freeze({ date: '1883-05-01', event: 'Narromine Railway Station officially opened (originally spelled Narramine; renamed October 1889).' }),
    Object.freeze({ date: '1945', event: 'Mid-1940s replacement brick station building planned/constructed to replace earlier timber structures.' }),
    Object.freeze({ date: '1975-10-20', event: 'Closed to regular passenger train services; later restored and operated as an NSW TrainLink regional road coach stop.' }),
  ]),
  operationalStatus: Object.freeze({
    passengerTrainsActive: false,
    coachStopActive: true,
    operator: 'NSW TrainLink (regional coach stop) / ARTC (freight corridor)',
    walkInInteriorImplemented: false,
    note: 'Do not fabricate active passenger train timetables or interior booking halls without surveyed floor plans.',
  }),
});

// Surveyed OSM building footprints and NSW Spatial Services LiDAR measurements
// within the Narromine Railway Station precinct.
export const NARROMINE_RAILWAY_BUILDINGS = Object.freeze([
  Object.freeze({
    id: 'narromine-station-building',
    inventoryId: 'NR-OSM-0030',
    osmIndex: 29,
    name: 'Narromine Railway Station Building',
    role: 'primary-station-building',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'photo-matched',
    openingsEvidenceLevel: 'estimated',
    sources: Object.freeze([
      'OpenStreetMap building footprint (ODbL 1.0)',
      'NSW Spatial Services 2023 airborne LiDAR (CC BY 4.0)',
      'Narromine LEP 2011 Schedule 5 Item I11 (Lot 4 DP 1012153)',
      'Historical & NSWrail/Wikipedia documentation (brick construction, tiled hipped roof, cantilevered platform awning, single side platform)',
    ]),
    centreGeo: Object.freeze([-32.2340741, 148.2402156]),
    centreWorld: Object.freeze([-4705.5, -716.8]),
    orientationDeg: 119.8,
    footprintWorld: freezePts([
      [-4721.9, -720.7], // 0: SW forecourt corner (32.16 m forecourt edge 0->1)
      [-4694.0, -704.7], // 1: NE forecourt corner (5.06 m NE end wall 1->2)
      [-4691.5, -709.1], // 2: NE platform-side wing corner (8.19 m NE wing 2->3)
      [-4698.7, -713.0], // 3: NE re-entrant corner (4.27 m step-out 3->4)
      [-4696.4, -716.6], // 4: Central pavilion NE platform corner (15.49 m pavilion face 4->5)
      [-4709.9, -724.2], // 5: Central pavilion SW platform corner (3.91 m step-back 5->6)
      [-4712.0, -720.9], // 6: SW re-entrant corner (8.60 m SW wing 6->7)
      [-4719.5, -725.1], // 7: SW platform-side wing corner (5.01 m SW end wall 7->0)
    ]),
    footprintGeo: freezePts([
      [-32.2340390, 148.2400410],
      [-32.2341828, 148.2403377],
      [-32.2341433, 148.2403643],
      [-32.2341082, 148.2402877],
      [-32.2340758, 148.2403122],
      [-32.2340075, 148.2401686],
      [-32.2340372, 148.2401463],
      [-32.2339994, 148.2400666],
    ]),
    dimensionsM: Object.freeze({
      forecourtLength: 32.16,
      westWingLength: 8.60,
      westWingDepth: 5.01,
      centralPavilionLength: 15.49,
      centralPavilionDepth: 9.10,
      eastWingLength: 8.19,
      eastWingDepth: 5.06,
    }),
    lidar: Object.freeze({
      surveyYear: 2023,
      groundAHDm: 239.51,
      eaveProxyM: 3.45,
      ridgeProxyM: 5.85,
      medianRoofM: 4.67,
      points: 468,
      densityPtsPerM2: 2.09,
    }),
    architecture: Object.freeze({
      wallMaterial: 'red-brown face brick with cream rendered sills/lintels and darker brick plinth',
      roofShape: 'hipped main spine with projecting central platform pavilion hip',
      roofMaterial: 'terracotta / red-brown Marseilles-pattern roof tiles',
      platformVerandah: 'cantilevered steel-framed platform awning along south-east (track) elevation',
      forecourtCanopy: 'central entry porch canopy on Narromine Station Access elevation',
      colours: Object.freeze({
        brick: 0x964b3b,
        plinth: 0x6d362b,
        pier: 0x7f3d30,
        trim: 0xe6dcc8,
        roofTile: 0x8d4532,
        roofRidge: 0x733626,
        awningFascia: 0xe8e1d1,
        awningSoffit: 0xd6cfc2,
        awningRoof: 0x6e767a,
        windowFrame: 0xdad2c2,
        windowGlass: 0x2f4450,
        doorTimber: 0x543828,
      }),
    }),
    // Decomposition of the 8-vertex stepped polygon into three oriented quads
    // in world coordinates so hipped roof sections and brick walls align cleanly.
    partsWorld: Object.freeze([
      Object.freeze({
        name: 'mainSpine',
        description: 'Full 32.16 m × 5.04 m brick range along the Narromine Station Access forecourt',
        evidenceLevel: 'surveyed',
        pts: freezePts([
          [-4721.9, -720.7],
          [-4694.0, -704.7],
          [-4691.5, -709.1],
          [-4719.5, -725.1],
        ]),
        eaveH: 3.45,
        ridgeH: 5.45,
        roof: 'hip',
      }),
      Object.freeze({
        name: 'centralPlatformPavilion',
        description: 'Projecting 15.49 m × 4.10 m central brick waiting/ticket pavilion facing the platform',
        evidenceLevel: 'surveyed',
        pts: freezePts([
          [-4712.0, -720.9],
          [-4698.7, -713.0],
          [-4696.4, -716.6],
          [-4709.9, -724.2],
        ]),
        eaveH: 3.45,
        ridgeH: 5.85,
        roof: 'hip',
      }),
    ]),
  }),

  Object.freeze({
    id: 'narromine-railway-goods-office',
    inventoryId: 'NR-OSM-0029',
    osmIndex: 28,
    name: 'Eastern Railway Yard / Goods Shed Building',
    role: 'yard-goods-building',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'estimated',
    openingsEvidenceLevel: 'estimated',
    sources: Object.freeze([
      'OpenStreetMap building footprint (ODbL 1.0)',
      'NSW Spatial Services 2023 airborne LiDAR (CC BY 4.0)',
    ]),
    centreGeo: Object.freeze([-32.2346107, 148.2409523]),
    centreWorld: Object.freeze([-4636.2, -657.1]),
    orientationDeg: 120.8,
    footprintWorld: freezePts([
      [-4639.3, -667.1],
      [-4646.7, -655.4],
      [-4632.8, -647.1],
      [-4626.0, -658.9],
    ]),
    footprintGeo: freezePts([
      [-32.2345210, 148.2409193],
      [-32.2346262, 148.2408406],
      [-32.2347009, 148.2409884],
      [-32.2345947, 148.2410607],
    ]),
    dimensionsM: Object.freeze({
      length: 16.19,
      width: 13.84,
    }),
    lidar: Object.freeze({
      surveyYear: 2023,
      groundAHDm: 239.14,
      eaveProxyM: 3.10,
      ridgeProxyM: 3.65,
      medianRoofM: 3.35,
      points: 782,
      densityPtsPerM2: 3.58,
    }),
    architecture: Object.freeze({
      wallMaterial: 'corrugated galvanised/weathered steel cladding with structural framing (estimated from yard context and 3.10 m–3.65 m LiDAR profile)',
      roofShape: 'low-pitched gable roof (0.55 m rise)',
      roofMaterial: 'corrugated steel',
      colours: Object.freeze({
        wall: 0x9aa09d,
        trim: 0x5c6264,
        roof: 0x7b8285,
        door: 0x4d5457,
      }),
    }),
  }),

  Object.freeze({
    id: 'narromine-level-crossing-hut',
    inventoryId: 'NR-OSM-0199',
    osmIndex: 198,
    name: 'Dandaloo Street Level-Crossing Trackside Relay / Signal Hut',
    role: 'trackside-equipment-building',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'estimated',
    openingsEvidenceLevel: 'estimated',
    sources: Object.freeze([
      'OpenStreetMap building footprint (ODbL 1.0)',
      'NSW Spatial Services 2011 airborne LiDAR (CC BY 4.0)',
    ]),
    centreGeo: Object.freeze([-32.2336019, 148.2396567]),
    centreWorld: Object.freeze([-4758.1, -769.3]),
    orientationDeg: 118.3,
    footprintWorld: freezePts([
      [-4762.0, -774.4],
      [-4751.6, -768.8],
      [-4754.1, -764.2],
      [-4764.5, -769.8],
    ]),
    footprintGeo: freezePts([
      [-32.2335560, 148.2396147],
      [-32.2336064, 148.2397253],
      [-32.2336477, 148.2396987],
      [-32.2335974, 148.2395881],
    ]),
    dimensionsM: Object.freeze({
      length: 11.81,
      width: 5.24,
    }),
    lidar: Object.freeze({
      surveyYear: 2011,
      groundAHDm: 239.40,
      eaveProxyM: 3.28,
      ridgeProxyM: 3.67,
      medianRoofM: 3.48,
      points: 57,
      densityPtsPerM2: 0.92,
    }),
    architecture: Object.freeze({
      wallMaterial: 'weatherboard / painted masonry railway relay & signalling outbuilding (estimated)',
      roofShape: 'low-pitched gable roof (0.39 m rise)',
      roofMaterial: 'corrugated steel',
      colours: Object.freeze({
        wall: 0xc8bfa8,
        trim: 0x6e5d4f,
        roof: 0x73797c,
        door: 0x4b4239,
      }),
    }),
  }),
]);

// Single passenger side platform along the south-east face of osm:29 and the
// north-west side of Main Western running track RAIL[2].
// Unit vectors along the station building's 32.16 m forecourt edge:
//   u = ([-4694.0, -704.7] - [-4721.9, -720.7]) / 32.1617 = [0.86749, 0.49749]
//   n = [0.49749, -0.86749] (pointing SE from forecourt toward platform/tracks)
export const NARROMINE_RAILWAY_PLATFORM = Object.freeze({
  id: 'narromine-main-platform',
  name: 'Narromine Station Side Platform 1',
  configuration: 'single-side-platform',
  configurationEvidenceLevel: 'surveyed',
  geometryEvidenceLevel: 'estimated',
  sources: Object.freeze([
    'Wikipedia / NSWrail.net (single side platform servicing Main Western line)',
    'Constrained between surveyed osm:29 SE building face and surveyed OSM RAIL[2] track centreline',
  ]),
  lengthM: 94.0,
  rampLengthM: 5.5,
  widthMainM: 4.4,
  heightM: 0.92,
  copingOverhangM: 0.12,
  // Platform polygon in world coordinates: runs parallel to the station spine
  // from 31 m SW of the building to 31 m NE of the building, with its trackside
  // coping edge positioned 1.65 m NW of the RAIL[2] track centreline.
  ptsWorld: freezePts([
    [-4746.3, -740.5], // SW back corner (aligned with wing wall line)
    [-4664.8, -693.7], // NE back corner (aligned with wing wall line)
    [-4662.6, -697.5], // NE trackside coping corner
    [-4744.1, -744.3], // SW trackside coping corner
  ]),
  copingEdgeWorld: freezePts([
    [-4744.1, -744.3],
    [-4662.6, -697.5],
  ]),
  awningWorld: Object.freeze({
    evidenceLevel: 'photo-matched',
    description: 'Cantilevered passenger awning sheltering the central pavilion and flanking platform bays',
    lengthM: 28.0,
    depthM: 3.1,
    eaveHeightM: 3.15,
    pts: freezePts([
      [-4718.0, -724.2],
      [-4693.7, -710.3],
      [-4692.2, -713.0],
      [-4716.5, -726.9],
    ]),
  }),
  signboards: Object.freeze([
    Object.freeze({
      id: 'platform-nameboard-west',
      text: 'NARROMINE',
      subtitle: 'ALTITUDE 786 FT · 498 KM FROM SYDNEY',
      evidenceLevel: 'photo-matched',
      atWorld: Object.freeze([-4726.8, -731.9]),
      yaw: -Math.atan2(16.0, 27.9),
    }),
    Object.freeze({
      id: 'platform-nameboard-east',
      text: 'NARROMINE',
      subtitle: 'MAIN WESTERN LINE · OPENED 1883',
      evidenceLevel: 'photo-matched',
      atWorld: Object.freeze([-4681.5, -705.9]),
      yaw: -Math.atan2(16.0, 27.9),
    }),
  ]),
});

// Forecourt, NSW TrainLink coach stop bay, and pedestrian access points along
// the surveyed Narromine Station Access road.
export const NARROMINE_RAILWAY_FORECOURT = Object.freeze({
  id: 'narromine-station-forecourt',
  accessRoadName: 'Narromine Station Access',
  accessRoadEvidenceLevel: 'surveyed',
  coachStopEvidenceLevel: 'photo-matched',
  furnitureEvidenceLevel: 'estimated',
  accessRoadWorld: freezePts(
    (STREETS.find((s) => s.name === 'Narromine Station Access')?.pts) || [
      [-4794.5, -745.8], [-4726.8, -714.7], [-4702.6, -700.8], [-4696.6, -696.5],
      [-4691.8, -692.2], [-4685.9, -685.9], [-4679.5, -677.8], [-4675.2, -671.3],
      [-4671.5, -665.0], [-4668.3, -657.7], [-4659.2, -632.7], [-4658.9, -610.3],
    ]
  ),
  forecourtPavingWorld: freezePts([
    [-4726.0, -715.2],
    [-4690.8, -695.0],
    [-4687.4, -700.9],
    [-4722.6, -721.1],
  ]),
  coachStop: Object.freeze({
    id: 'nsw-trainlink-coach-stop',
    label: 'Narromine Station (NSW TrainLink Coach Stop)',
    operator: 'NSW TrainLink',
    atWorld: Object.freeze([-4712.4, -710.8]),
    shelterPtsWorld: freezePts([
      [-4715.0, -711.2],
      [-4710.6, -708.7],
      [-4709.6, -710.4],
      [-4714.0, -712.9],
    ]),
    yaw: -Math.atan2(16.0, 27.9),
  }),
  pedestrianEntryPointsWorld: Object.freeze({
    forecourtWest: Object.freeze([-4723.5, -718.5]),
    forecourtCentral: Object.freeze([-4708.8, -710.2]),
    forecourtEast: Object.freeze([-4691.0, -700.2]),
    platformWestRamp: Object.freeze([-4745.2, -742.4]),
    platformEastGate: Object.freeze([-4688.8, -707.5]),
  }),
  fencesWorld: Object.freeze([
    // White railway boundary post-and-rail fencing flanking the station building,
    // leaving generous 4 m+ pedestrian gates to the platform at both ends.
    Object.freeze({
      id: 'west-platform-fence',
      evidenceLevel: 'estimated',
      a: Object.freeze([-4743.5, -733.1]),
      b: Object.freeze([-4725.5, -722.8]),
    }),
    Object.freeze({
      id: 'east-platform-fence',
      evidenceLevel: 'estimated',
      a: Object.freeze([-4686.5, -700.4]),
      b: Object.freeze([-4666.0, -688.6]),
    }),
  ]),
});

// Surveyed railway tracks passing through the station precinct
// (clipped to the precinct bounding box x in [-4850, -4450], z in [-820, -560]).
export const NARROMINE_RAILWAY_TRACKS = Object.freeze(
  RAIL.map((r, index) => {
    const pts = r.pts.filter(([x, z]) => x >= -4855 && x <= -4450 && z >= -820 && z <= -560);
    return pts.length >= 2
      ? Object.freeze({
          id: `narromine-rail-segment-${index}`,
          railIndex: index,
          role: index === 2 || index === 7 ? 'main-western-running-line' : 'yard-loop-or-siding',
          evidenceLevel: 'surveyed',
          ptsWorld: freezePts(pts),
        })
      : null;
  }).filter(Boolean)
);

// Precinct envelope polygon encompassing the station building, side platform,
// forecourt along Narromine Station Access, and eastern goods office.
export const NARROMINE_RAILWAY_PRECINCT_BOUNDARY_WORLD = freezePts([
  [-4770.0, -780.0],
  [-4758.0, -748.0],
  [-4728.0, -712.0],
  [-4688.0, -684.0],
  [-4620.0, -640.0],
  [-4612.0, -668.0],
  [-4672.0, -718.0],
  [-4752.0, -782.0],
]);

export const NARROMINE_RAILWAY_PRECINCT_BOUNDARY_GEO = freezePts(
  NARROMINE_RAILWAY_PRECINCT_BOUNDARY_WORLD.map(worldToGeo)
);

// Build a standard WGS84 GeoJSON FeatureCollection ([lon, lat] per RFC 7946)
// for GIS verification and audit tools.
const toGeoJsonCoord = ([lat, lon]) => [lon, lat];
const closedRing = (latLonPts) => {
  const ring = latLonPts.map(toGeoJsonCoord);
  if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) {
    ring.push([...ring[0]]);
  }
  return ring;
};

const geoJsonFeatures = [
  {
    type: 'Feature',
    properties: {
      id: 'narromine-railway-precinct-boundary',
      label: 'Narromine Railway Station Precinct Envelope',
      confidence: 'surveyed',
      source: 'Composite envelope of OSM rail/access corridor and Lot 4 DP 1012153 station precinct',
      lepItem: 'I11',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [closedRing(NARROMINE_RAILWAY_PRECINCT_BOUNDARY_GEO)],
    },
  },
  ...NARROMINE_RAILWAY_BUILDINGS.map((b) => ({
    type: 'Feature',
    properties: {
      id: b.id,
      inventoryId: b.inventoryId,
      osmIndex: b.osmIndex,
      label: b.name,
      role: b.role,
      confidence: b.evidenceLevel,
      facadeConfidence: b.facadeEvidenceLevel,
      openingsConfidence: b.openingsEvidenceLevel,
      eaveHeightM: b.lidar.eaveProxyM,
      ridgeHeightM: b.lidar.ridgeProxyM,
      groundAHDm: b.lidar.groundAHDm,
      lidarSurveyYear: b.lidar.surveyYear,
      lidarPoints: b.lidar.points,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [closedRing(b.footprintGeo)],
    },
  })),
  {
    type: 'Feature',
    properties: {
      id: NARROMINE_RAILWAY_PLATFORM.id,
      label: NARROMINE_RAILWAY_PLATFORM.name,
      confidence: NARROMINE_RAILWAY_PLATFORM.geometryEvidenceLevel,
      configurationConfidence: NARROMINE_RAILWAY_PLATFORM.configurationEvidenceLevel,
      lengthM: NARROMINE_RAILWAY_PLATFORM.lengthM,
      heightM: NARROMINE_RAILWAY_PLATFORM.heightM,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [closedRing(NARROMINE_RAILWAY_PLATFORM.ptsWorld.map(worldToGeo))],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'narromine-station-access-road',
      label: 'Narromine Station Access (OSM service road)',
      confidence: 'surveyed',
      source: 'OpenStreetMap highway=service (ODbL 1.0)',
    },
    geometry: {
      type: 'LineString',
      coordinates: NARROMINE_RAILWAY_FORECOURT.accessRoadWorld.map((p) => toGeoJsonCoord(worldToGeo(p))),
    },
  },
  {
    type: 'Feature',
    properties: {
      id: NARROMINE_RAILWAY_FORECOURT.coachStop.id,
      label: NARROMINE_RAILWAY_FORECOURT.coachStop.label,
      confidence: 'photo-matched',
      operator: NARROMINE_RAILWAY_FORECOURT.coachStop.operator,
    },
    geometry: {
      type: 'Point',
      coordinates: toGeoJsonCoord(worldToGeo(NARROMINE_RAILWAY_FORECOURT.coachStop.atWorld)),
    },
  },
  ...NARROMINE_RAILWAY_TRACKS.map((t) => ({
    type: 'Feature',
    properties: {
      id: t.id,
      railIndex: t.railIndex,
      role: t.role,
      confidence: t.evidenceLevel,
      source: 'OpenStreetMap railway=rail (ODbL 1.0)',
    },
    geometry: {
      type: 'LineString',
      coordinates: t.ptsWorld.map((p) => toGeoJsonCoord(worldToGeo(p))),
    },
  })),
];

export const NARROMINE_RAILWAY_PRECINCT_GEOJSON = Object.freeze({
  type: 'FeatureCollection',
  name: 'Narromine Railway Station Precinct Evidence Layer (WGS84)',
  features: Object.freeze(geoJsonFeatures),
});

// Explicit integration contract so that when shared files (narromine.js,
// narromine-layout.js, narromine-buildings-data.js) are free of concurrent PR
// claims, live integration suppresses the generic OSM extrusions for osm:28,
// osm:29, and osm:198 and mounts buildNarromineRailwayPrecinct() without
// creating duplicate station meshes.
export const NARROMINE_RAILWAY_INTEGRATION_SPEC = Object.freeze({
  status: 'standalone-ready-for-coordinated-integration',
  suppressedOsmBuildingIndices: Object.freeze([28, 29, 198]),
  suppressedInventoryIds: Object.freeze(['NR-OSM-0029', 'NR-OSM-0030', 'NR-OSM-0199']),
  duplicatePreventionRule:
    'When mounting buildNarromineRailwayPrecinct in src/world/narromine.js, filter out OSM building indices 28, 29, and 198 (or include NARROMINE_RAILWAY_PRECINCT_BOUNDARY_GEO in DETAILED boundaries) so generic OSM extrusions never double the detailed station, goods shed, or crossing hut.',
});
