// Surveyed OpenStreetMap footprints, statutory NSW heritage metadata, and
// historical exhibit records for the Narromine Aviation Museum & Aerodrome
// Precinct (Tom Perry Drive / Mitchell Highway A32, Lot 122 DP 1126499,
// Narromine NSW 2821 — ICAO: YNRM, IATA: QRM).
//
// Pure data module (no Three.js or DOM dependency) so unit tests, fidelity
// audits, and the 3D precinct builder share a single auditable source of truth.
// Every record explicitly distinguishes:
//   - "surveyed": building footprint polygons and road/apron alignments from
//     OpenStreetMap (ODbL 1.0) and statutory Narromine LEP 2011 Schedule 5
//     Item I12 (Lot 122 DP 1126499)
//   - "photo-matched": hangar roof forms, Aero Club terminal wing layout,
//     outdoor CAC Sabre A94-915 gate guardian pylon, WWII RAAF No. 5 EFTS
//     33-plaque memorial wall, and documented museum aircraft exhibits
//     (1903 Wright Flyer replica, Corben Super Ace, Rolls-Royce Merlin Mk 25)
//   - "estimated": individual window/door bay spacing, hangar truss framing,
//     and procedural aircraft/engine display proportions where measured CAD
//     drawings are absent
const ANCHOR_LAT = -32.2404574;
const ANCHOR_LON = 148.2597315;
const OFFSET_X = -2870;
const OFFSET_Z = -7;
const RAD = Math.PI / 180;
const EARTH = 6371008.8;
const COS_ANCHOR = Math.cos(ANCHOR_LAT * RAD);

export function worldToGeo([wx, wz]) {
  const x = wx - OFFSET_X;
  const z = wz - OFFSET_Z;
  const lat = +(ANCHOR_LAT - z / (RAD * EARTH)).toFixed(7);
  const lon = +(ANCHOR_LON + x / (RAD * EARTH * COS_ANCHOR)).toFixed(7);
  return [lat, lon];
}

export function geoToWorld([lat, lon]) {
  const x = OFFSET_X + (lon - ANCHOR_LON) * RAD * EARTH * COS_ANCHOR;
  const z = OFFSET_Z - (lat - ANCHOR_LAT) * RAD * EARTH;
  return [+x.toFixed(2), +z.toFixed(2)];
}

const freezePts = (pts) => Object.freeze(pts.map((p) => Object.freeze([...p])));

// ── 1. Statutory Heritage & Historical Register ─────────────────────────────
export const NARROMINE_AVIATION_HERITAGE = Object.freeze({
  id: 'narromine-aviation-museum-and-aerodrome-precinct',
  officialName: 'Narromine Aviation Museum & Aerodrome Precinct',
  aerodromeCodes: Object.freeze({ icao: 'YNRM', iata: 'QRM' }),
  streetAddress: 'Tom Perry Drive (off Mitchell Highway A32), Narromine NSW 2821',
  cadastralLot: 'Lot 122, DP 1126499',
  parish: 'Wentworth / Timbrebongie',
  county: 'Narromine',
  lga: 'Narromine Shire Council',
  lepListing: Object.freeze({
    instrument: 'Narromine Local Environmental Plan 2011',
    schedule: 'Schedule 5 Environmental Heritage — Part 1 Heritage Items',
    itemNumber: 'I12',
    itemName: 'Narromine Aerodrome—World War II RAAF Base (former)',
    propertyDescription: 'Lot 122, DP 1126499, Mitchell Highway',
    significance: 'Local',
    evidenceLevel: 'surveyed',
  }),
  timeline: Object.freeze([
    Object.freeze({
      date: '1929',
      event:
        'Narromine Aero Club formed — one of Australia’s oldest regional aero clubs; visited in the 1920s–30s by Sir Charles Kingsford Smith, Nancy-Bird Walton, and Jean Batten.',
      source: 'Visit NSW / Wikipedia Narromine',
    }),
    Object.freeze({
      date: '1940-06 to 1944-07',
      event:
        'RAAF No. 5 Elementary Flying Training School (No. 5 EFTS) operated at Narromine under the Empire Air Training Scheme (EATS) flying de Havilland DH.82 Tiger Moths; trained approximately 2,800–2,850 pilots from 3,734 trainees.',
      source: 'Australian War Memorial (AWM) Places of Pride / Wikipedia No. 5 EFTS',
    }),
    Object.freeze({
      date: '1942 to 1944',
      event:
        'RAAF No. 8 Operational Training Unit (No. 8 OTU) also stationed at Narromine Aerodrome.',
      source: 'OzAtWar / AWM',
    }),
    Object.freeze({
      date: 'Post-WWII (~25 years)',
      event:
        'Designated as Qantas’s official alternate international airport for Sydney (Mascot) and developed into a world-renowned gliding and soaring centre.',
      source: 'National Science Week / Narromine Aviation Museum',
    }),
    Object.freeze({
      date: '2002-10',
      event:
        'Narromine Aviation Museum opened in a volunteer-built complex shared with the Narromine Aero Club and gliding clubs, housing the flying 1903 Wright Flyer replica, Corben Super Ace, Rolls-Royce Merlin Mk 25 engine, and outdoor CAC Sabre A94-915.',
      source: 'Narromine Aviation Museum / AWM',
    }),
  ]),
});

// ── 2. Aerodrome Terminal & Apron Cadastral Envelope ────────────────────────
// Excludes procedural suburban residential filler houses (`FILL_HOUSES`) from
// spawning on the airside hangar apron and museum forecourt while preserving
// surrounding town streets.
export const NARROMINE_AVIATION_CADASTRAL_LOTS = Object.freeze([
  Object.freeze({
    lotId: '122/DP1126499-apron',
    label: 'Lot 122 DP 1126499 — Narromine Aerodrome Terminal, Museum & Hangar Apron',
    evidenceLevel: 'surveyed',
    source: 'Narromine LEP 2011 Schedule 5 Item I12 / OpenStreetMap aerodrome apron extent',
    ringWorld: freezePts([
      [-6040.0, -2115.0],
      [-5605.0, -2115.0],
      [-5605.0, -1950.0],
      [-5835.0, -1950.0],
      [-5845.0, -1870.0],
      [-6040.0, -1870.0],
      [-6040.0, -2115.0],
    ]),
  }),
]);

// ── 3. Surveyed OSM Building Footprints in the Aerodrome Precinct ───────────
export const NARROMINE_AVIATION_BUILDINGS = Object.freeze([
  Object.freeze({
    id: 'narromine-aviation-museum-hangar',
    inventoryId: 'NR-OSM-0219',
    osmIndex: 218,
    name: 'Narromine Aviation Museum — Main Exhibition Hangar',
    role: 'museum-exhibition-hangar',
    address: 'Tom Perry Drive, Narromine NSW 2821',
    cadastralLot: 'Lot 122, DP 1126499',
    lepItem: 'I12',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'photo-matched',
    openingsEvidenceLevel: 'estimated',
    sources: Object.freeze([
      'OpenStreetMap building footprint osm:218 (ODbL 1.0)',
      'Narromine LEP 2011 Schedule 5 Item I12',
      'Narromine Aviation Museum / AWM documentation (volunteer-built 2002 museum hall adjoining Aero Club)',
    ]),
    centreWorld: Object.freeze([-5724.9, -2054.2]),
    centreGeo: Object.freeze(worldToGeo([-5724.9, -2054.2])),
    footprintWorld: freezePts([
      [-5739.6, -2057.2],
      [-5739.9, -2054.7],
      [-5741.0, -2047.1],
      [-5711.5, -2042.9],
      [-5708.7, -2062.8],
      [-5727.1, -2065.4],
      [-5728.5, -2055.6],
    ]),
    mainSpanQuadWorld: freezePts([
      [-5741.0, -2047.1], // NW corner on Tom Perry Drive
      [-5711.5, -2042.9], // NE corner on Tom Perry Drive / Car Park (29.80 m)
      [-5708.7, -2062.8], // SE corner facing memorial courtyard (20.10 m)
      [-5738.2, -2067.0], // SW structural alignment
    ]),
    dimensionsM: Object.freeze({
      lengthM: 29.8,
      widthM: 20.1,
      eaveHeightM: 5.8,
      ridgeHeightM: 7.95,
    }),
    architecture: Object.freeze({
      wallMaterial: 'Colorbond cream/sand corrugated steel cladding with navy blue museum fascia trim',
      roofShape: 'Wide-span gabled exhibition hangar roof with internal steel portal trusses and skylight strips',
      openings: 'Wide open eastern bi-fold hangar doors (12.0 m clear opening) and northern visitor entrance foyer allowing direct walk-in viewing of the Wright Flyer replica, Corben Super Ace, and Merlin Mk 25 engine',
      colours: Object.freeze({
        wall: 0xe6decb,
        wainscot: 0x2b4257,
        trim: 0x1e354a,
        roof: 0xc8cbc6,
        ridge: 0x9aa0a6,
        floor: 0x8d9194,
        truss: 0x5c646b,
      }),
    }),
  }),
  Object.freeze({
    id: 'narromine-aero-club-terminal',
    inventoryId: 'NR-OSM-0002',
    osmIndex: 1,
    name: 'Narromine Aero Club & Museum Terminal Complex',
    role: 'aero-club-and-museum-terminal',
    address: 'Tom Perry Drive, Narromine NSW 2821',
    cadastralLot: 'Lot 122, DP 1126499',
    lepItem: 'I12',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'photo-matched',
    openingsEvidenceLevel: 'estimated',
    sources: Object.freeze([
      'OpenStreetMap building footprint osm:1 (ODbL 1.0)',
      'Narromine LEP 2011 Schedule 5 Item I12',
      'Visit NSW / Narromine Aero Club historical records (founded 1929)',
    ]),
    centreWorld: Object.freeze([-5753.4, -2071.1]),
    centreGeo: Object.freeze(worldToGeo([-5753.4, -2071.1])),
    footprintWorld: freezePts([
      [-5777.7, -2087.6],
      [-5736.9, -2081.8],
      [-5737.6, -2076.9],
      [-5725.7, -2075.2],
      [-5727.1, -2065.4],
      [-5728.5, -2055.6],
      [-5739.6, -2057.2],
      [-5739.9, -2054.7],
      [-5745.5, -2055.5],
      [-5745.4, -2056.3],
      [-5765.9, -2059.3],
      [-5766.0, -2058.4],
      [-5770.8, -2059.1],
      [-5770.4, -2062.3],
      [-5781.1, -2063.8],
    ]),
    wings: Object.freeze([
      Object.freeze({
        name: 'clubhouse-main-wing',
        pts: freezePts([
          [-5781.1, -2063.8], // NW corner
          [-5739.9, -2058.0], // NE corner (41.61 m)
          [-5736.9, -2081.8], // SE corner (24.00 m)
          [-5777.7, -2087.6], // SW corner
        ]),
        eaveHeightM: 4.2,
        ridgeHeightM: 6.45,
      }),
      Object.freeze({
        name: 'museum-gallery-link-wing',
        pts: freezePts([
          [-5739.6, -2057.2], // NW corner adjoining main wing
          [-5728.5, -2055.6], // NE corner adjoining osm:218 (11.21 m)
          [-5725.7, -2075.2], // SE corner facing memorial courtyard (19.80 m)
          [-5737.6, -2076.9], // SW corner
        ]),
        eaveHeightM: 3.9,
        ridgeHeightM: 5.55,
      }),
    ]),
    dimensionsM: Object.freeze({
      overallLengthM: 55.4,
      overallWidthM: 32.9,
      eaveHeightM: 4.2,
      ridgeHeightM: 6.45,
    }),
    architecture: Object.freeze({
      wallMaterial: 'Warm sand/cream masonry and weatherboard clubhouse with deep airside observation verandah and northern Tom Perry Drive entry awning',
      roofShape: 'Low-pitched hipped and gabled corrugated metal roofs',
      colours: Object.freeze({
        wall: 0xdcd1bc,
        plinth: 0x7a5240,
        trim: 0xf4f1ea,
        roof: 0x5d6970,
        ridge: 0x454f55,
        verandahPost: 0x2c4254,
        glass: 0x2a3f4d,
      }),
    }),
  }),
  Object.freeze({
    id: 'narromine-hangar-2',
    inventoryId: 'NR-OSM-0003',
    osmIndex: 2,
    name: 'Aerodrome Central Apron Hangar (osm:2)',
    role: 'aircraft-hangar',
    address: 'Tom Perry Drive, Narromine NSW 2821',
    cadastralLot: 'Lot 122, DP 1126499',
    lepItem: 'I12',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'estimated',
    openingsEvidenceLevel: 'estimated',
    centreWorld: Object.freeze([-5860.6, -1987.8]),
    centreGeo: Object.freeze(worldToGeo([-5860.6, -1987.8])),
    footprintWorld: freezePts([
      [-5872.2, -1999.0],
      [-5874.9, -1980.5],
      [-5849.0, -1976.7],
      [-5846.3, -1995.2],
    ]),
    dimensionsM: Object.freeze({ lengthM: 26.18, widthM: 18.7, eaveHeightM: 5.8, ridgeHeightM: 7.6 }),
  }),
  Object.freeze({
    id: 'narromine-hangar-3',
    inventoryId: 'NR-OSM-0004',
    osmIndex: 3,
    name: 'Aerodrome Western Maintenance Hangar (osm:3)',
    role: 'aircraft-hangar',
    address: 'Johnston Close / Aerodrome Apron, Narromine NSW 2821',
    cadastralLot: 'Lot 122, DP 1126499',
    lepItem: 'I12',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'estimated',
    openingsEvidenceLevel: 'estimated',
    centreWorld: Object.freeze([-5985.8, -1902.4]),
    centreGeo: Object.freeze(worldToGeo([-5985.8, -1902.4])),
    footprintWorld: freezePts([
      [-5999.5, -1920.2],
      [-6004.0, -1889.2],
      [-5972.1, -1884.6],
      [-5967.6, -1915.6],
    ]),
    dimensionsM: Object.freeze({ lengthM: 32.23, widthM: 31.32, eaveHeightM: 6.5, ridgeHeightM: 8.8 }),
  }),
  Object.freeze({
    id: 'narromine-hangar-4',
    inventoryId: 'NR-OSM-0005',
    osmIndex: 4,
    name: 'Aerodrome South-West Soaring Hangar (osm:4)',
    role: 'aircraft-hangar',
    address: 'Ewen Way / Aerodrome Apron, Narromine NSW 2821',
    cadastralLot: 'Lot 122, DP 1126499',
    lepItem: 'I12',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'estimated',
    openingsEvidenceLevel: 'estimated',
    centreWorld: Object.freeze([-5996.3, -2079.4]),
    centreGeo: Object.freeze(worldToGeo([-5996.3, -2079.4])),
    footprintWorld: freezePts([
      [-5989.0, -2056.2],
      [-5982.0, -2099.1],
      [-6003.5, -2102.6],
      [-6010.5, -2059.8],
    ]),
    dimensionsM: Object.freeze({ lengthM: 43.47, widthM: 21.8, eaveHeightM: 6.8, ridgeHeightM: 9.2 }),
  }),
  Object.freeze({
    id: 'narromine-hangar-5',
    inventoryId: 'NR-OSM-0006',
    osmIndex: 5,
    name: 'Aerodrome North-East Charter Hangar (osm:5)',
    role: 'aircraft-hangar',
    address: 'Mitchell Highway / Aerodrome Approach, Narromine NSW 2821',
    cadastralLot: 'Lot 122, DP 1126499',
    lepItem: 'I12',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'estimated',
    openingsEvidenceLevel: 'estimated',
    centreWorld: Object.freeze([-5675.8, -1802.2]),
    centreGeo: Object.freeze(worldToGeo([-5675.8, -1802.2])),
    footprintWorld: freezePts([
      [-5684.5, -1810.2],
      [-5665.1, -1807.3],
      [-5667.0, -1794.2],
      [-5686.5, -1797.1],
    ]),
    dimensionsM: Object.freeze({ lengthM: 19.62, widthM: 13.25, eaveHeightM: 4.8, ridgeHeightM: 6.4 }),
  }),
  Object.freeze({
    id: 'narromine-hangar-6',
    inventoryId: 'NR-OSM-0007',
    osmIndex: 6,
    name: 'Aerodrome Western Apron Hangar (osm:6)',
    role: 'aircraft-hangar',
    address: 'Ewen Way / Aerodrome Apron, Narromine NSW 2821',
    cadastralLot: 'Lot 122, DP 1126499',
    lepItem: 'I12',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'estimated',
    openingsEvidenceLevel: 'estimated',
    centreWorld: Object.freeze([-6014.3, -1986.6]),
    centreGeo: Object.freeze(worldToGeo([-6014.3, -1986.6])),
    footprintWorld: freezePts([
      [-6024.6, -2004.1],
      [-6029.7, -1973.4],
      [-6004.0, -1969.1],
      [-5998.9, -1999.8],
    ]),
    dimensionsM: Object.freeze({ lengthM: 31.12, widthM: 26.06, eaveHeightM: 6.2, ridgeHeightM: 8.4 }),
  }),
  Object.freeze({
    id: 'narromine-efts-bellman-hangar-7',
    inventoryId: 'NR-OSM-0008',
    osmIndex: 7,
    name: 'Former RAAF No. 5 EFTS Bellman-Style Hangar (osm:7)',
    role: 'heritage-raaf-hangar',
    address: 'Tom Perry Drive / Johnston Close, Narromine NSW 2821',
    cadastralLot: 'Lot 122, DP 1126499',
    lepItem: 'I12',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'photo-matched',
    openingsEvidenceLevel: 'estimated',
    centreWorld: Object.freeze([-5933.5, -1926.8]),
    centreGeo: Object.freeze(worldToGeo([-5933.5, -1926.8])),
    footprintWorld: freezePts([
      [-5953.1, -1914.9],
      [-5948.6, -1944.1],
      [-5913.9, -1938.7],
      [-5918.4, -1909.4],
    ]),
    dimensionsM: Object.freeze({ lengthM: 35.12, widthM: 29.64, eaveHeightM: 6.6, ridgeHeightM: 8.9 }),
  }),
  Object.freeze({
    id: 'narromine-gliding-clubhouse',
    inventoryId: 'NR-OSM-0218',
    osmIndex: 217,
    name: 'Narromine Gliding Club & Soaring Centre Clubhouse (osm:217)',
    role: 'gliding-clubhouse',
    address: 'Tom Perry Drive, Narromine NSW 2821',
    cadastralLot: 'Lot 122, DP 1126499',
    lepItem: 'I12',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'estimated',
    openingsEvidenceLevel: 'estimated',
    centreWorld: Object.freeze([-5628.4, -2023.2]),
    centreGeo: Object.freeze(worldToGeo([-5628.4, -2023.2])),
    footprintWorld: freezePts([
      [-5640.0, -2028.4],
      [-5615.7, -2024.6],
      [-5616.8, -2017.9],
      [-5641.0, -2021.8],
    ]),
    dimensionsM: Object.freeze({ lengthM: 24.6, widthM: 6.79, eaveHeightM: 3.5, ridgeHeightM: 4.8 }),
  }),
  Object.freeze({
    id: 'narromine-aerodrome-amenities',
    inventoryId: 'NR-OSM-0009',
    osmIndex: 8,
    name: 'Aerodrome & Gliding Club Pilots’ Amenities Block (osm:8)',
    role: 'aerodrome-amenities',
    address: 'Tom Perry Drive, Narromine NSW 2821',
    cadastralLot: 'Lot 122, DP 1126499',
    lepItem: 'I12',
    evidenceLevel: 'surveyed',
    facadeEvidenceLevel: 'estimated',
    openingsEvidenceLevel: 'estimated',
    centreWorld: Object.freeze([-5634.1, -2009.0]),
    centreGeo: Object.freeze(worldToGeo([-5634.1, -2009.0])),
    footprintWorld: freezePts([
      [-5649.5, -2008.4],
      [-5647.3, -2016.9],
      [-5618.8, -2009.6],
      [-5621.0, -2001.1],
    ]),
    dimensionsM: Object.freeze({ lengthM: 29.42, widthM: 8.78, eaveHeightM: 3.3, ridgeHeightM: 4.4 }),
  }),
]);

// ── 4. Verified Museum Aircraft, Engines & Heritage Monuments ───────────────
export const NARROMINE_AVIATION_EXHIBITS = Object.freeze([
  Object.freeze({
    id: 'cac-sabre-a94-915',
    name: 'CAC CA-27 Sabre Mk 32 (A94-915)',
    category: 'gate-guardian-aircraft',
    location: 'Museum Forecourt Lawn (Outdoor)',
    posWorld: Object.freeze([-5709.0, -2066.5]),
    posGeo: Object.freeze(worldToGeo([-5709.0, -2066.5])),
    evidenceLevel: 'photo-matched',
    proportionEvidenceLevel: 'estimated',
    historicalFact:
      'Commonwealth Aircraft Corporation CA-27 Avon-Sabre Mk 32 (RAAF serial A94-915), powered by a Rolls-Royce Avon turbojet, mounted as the outdoor gate guardian of the Narromine Aviation Museum.',
  }),
  Object.freeze({
    id: 'wright-flyer-replica-vh-xwf',
    name: '1903 Wright Flyer Full-Scale Flying Replica (VH-XWF)',
    category: 'museum-aircraft-exhibit',
    location: 'Main Exhibition Hangar (osm:218 Interior)',
    posWorld: Object.freeze([-5722.5, -2053.2]),
    posGeo: Object.freeze(worldToGeo([-5722.5, -2053.2])),
    evidenceLevel: 'photo-matched',
    proportionEvidenceLevel: 'estimated',
    historicalFact:
      'Full-scale airworthy replica of the 1903 Wright Flyer built in Narromine for the 2003 centenary of powered flight (12.3 m wingspan biplane with forward canard elevator and twin pusher propellers), displayed inside the Narromine Aviation Museum.',
  }),
  Object.freeze({
    id: 'corben-super-ace-vh-uxp',
    name: '1930s Corben Super Ace (VH-UXP)',
    category: 'museum-aircraft-exhibit',
    location: 'Main Exhibition Hangar (osm:218 Interior)',
    posWorld: Object.freeze([-5731.5, -2051.5]),
    posGeo: Object.freeze(worldToGeo([-5731.5, -2051.5])),
    evidenceLevel: 'photo-matched',
    proportionEvidenceLevel: 'estimated',
    historicalFact:
      'Historic 1930s Corben Super Ace single-seat parasol-wing sport aircraft displayed alongside the Wright Flyer replica in the Narromine Aviation Museum.',
  }),
  Object.freeze({
    id: 'rolls-royce-merlin-mk25',
    name: 'Rolls-Royce Merlin Mk 25 V12 Aero Engine',
    category: 'museum-engine-exhibit',
    location: 'Main Exhibition Hangar (osm:218 Interior)',
    posWorld: Object.freeze([-5716.2, -2058.2]),
    posGeo: Object.freeze(worldToGeo([-5716.2, -2058.2])),
    evidenceLevel: 'photo-matched',
    proportionEvidenceLevel: 'estimated',
    historicalFact:
      'Preserved WWII Rolls-Royce Merlin Mk 25 liquid-cooled V12 piston aero engine (27-litre supercharged powerplant used in Mosquito and Lancaster aircraft) mounted on an exhibition cradle inside the museum.',
  }),
  Object.freeze({
    id: 'raaf-5efts-memorial-wall',
    name: 'WWII RAAF No. 5 EFTS & No. 8 OTU Memorial Wall (33 Plaques)',
    category: 'war-memorial',
    location: 'Museum Memorial Courtyard (East of osm:1)',
    posWorld: Object.freeze([-5720.5, -2071.5]),
    posGeo: Object.freeze(worldToGeo([-5720.5, -2071.5])),
    evidenceLevel: 'photo-matched',
    proportionEvidenceLevel: 'estimated',
    plaqueCount: 33,
    historicalFact:
      'Dedicated to the ~2,800–2,850 pilots who graduated from RAAF No. 5 Elementary Flying Training School (1940–44, Tiger Moths) and No. 8 Operational Training Unit at Narromine Aerodrome during World War II; carries 33 commemorative bronze plaques.',
  }),
  Object.freeze({
    id: 'narromine-soaring-sailplane',
    name: 'Narromine Soaring Centre Standard-Class Sailplane (15 m Glider)',
    category: 'airside-glider-display',
    location: 'Gliding Club Tie-Down Apron (South of osm:217)',
    posWorld: Object.freeze([-5628.0, -2034.0]),
    posGeo: Object.freeze(worldToGeo([-5628.0, -2034.0])),
    evidenceLevel: 'estimated',
    proportionEvidenceLevel: 'estimated',
    historicalFact:
      'Represents Narromine’s post-WWII heritage as one of Australia’s premier thermal soaring and world-record gliding centres.',
  }),
]);

// ── 5. Pedestrian & Vehicle Access Corridors ────────────────────────────────
export const NARROMINE_AVIATION_ACCESS = Object.freeze({
  tomPerryDriveApproachWorld: Object.freeze([-5726.5, -2040.5]),
  hangarNorthDoorEntryWorld: Object.freeze([-5726.5, -2045.0]),
  hangarEastDoorEntryWorld: Object.freeze([-5709.5, -2052.5]),
  hangarInteriorCenterWorld: Object.freeze([-5722.5, -2053.2]),
  sabreForecourtViewingWorld: Object.freeze([-5710.5, -2064.5]),
  memorialWallViewingWorld: Object.freeze([-5720.5, -2068.0]),
  aeroClubNorthEntryWorld: Object.freeze([-5758.0, -2056.0]),
  glidingClubEntryWorld: Object.freeze([-5628.4, -2016.0]),
  walkableCorridorWaypoints: freezePts([
    [-5726.5, -2040.5], // Tom Perry Drive north approach
    [-5726.5, -2045.0], // North visitor foyer doorway
    [-5722.5, -2053.2], // Inside Museum Exhibition Hangar (Wright Flyer & Merlin Mk 25)
    [-5706.0, -2052.5], // Out through eastern bi-fold hangar doors
    [-5706.0, -2064.5], // Eastern forecourt promenade past SE hangar corner
    [-5710.5, -2064.5], // CAC Sabre A94-915 gate guardian viewing point
    [-5720.5, -2068.0], // RAAF No. 5 EFTS 33-plaque Memorial Wall viewing point
  ]),
});

// ── 6. Shared Scene Integration Contract ────────────────────────────────────
export const NARROMINE_AVIATION_INTEGRATION_SPEC = Object.freeze({
  suppressedOsmBuildingIndices: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 217, 218]),
  suppressedInventoryIds: Object.freeze([
    'NR-OSM-0002',
    'NR-OSM-0003',
    'NR-OSM-0004',
    'NR-OSM-0005',
    'NR-OSM-0006',
    'NR-OSM-0007',
    'NR-OSM-0008',
    'NR-OSM-0009',
    'NR-OSM-0218',
    'NR-OSM-0219',
  ]),
  places: Object.freeze([
    Object.freeze({
      name: 'Narromine Aviation Museum',
      kind: 'museum',
      kindLabel: 'Aviation museum (LEP Item I12)',
      address: 'Tom Perry Drive (Lot 122 DP 1126499)',
      x: -5722.5,
      z: -2053.2,
      fact: 'Opened in October 2002 at Narromine Aerodrome (Narromine LEP 2011 Heritage Item I12, Lot 122 DP 1126499), former base of WWII RAAF No. 5 Elementary Flying Training School (1940–44, ~2,800 Tiger Moth graduates) and No. 8 OTU. Exhibits include CAC Sabre A94-915, a full-scale 1903 Wright Flyer replica, a 1930s Corben Super Ace, a Rolls-Royce Merlin Mk 25 V12 engine, and the RAAF No. 5 EFTS 33-plaque Memorial Wall. (Narromine Aviation Museum / AWM)',
    }),
    Object.freeze({
      name: 'Narromine Aero Club',
      kind: 'aeroclub',
      kindLabel: 'Historic aero club (est. 1929)',
      address: 'Tom Perry Drive (Lot 122 DP 1126499)',
      x: -5758.0,
      z: -2056.0,
      fact: 'Founded in 1929 — one of Australia’s oldest regional aero clubs, visited by Sir Charles Kingsford Smith, Nancy-Bird Walton, and Jean Batten, sharing the aerodrome terminal complex with the Narromine Aviation Museum. (Visit NSW / Wikipedia)',
    }),
    Object.freeze({
      name: 'Narromine Gliding Club',
      kind: 'aerodrome',
      kindLabel: 'Gliding & soaring centre',
      address: 'Tom Perry Drive (Lot 122 DP 1126499)',
      x: -5628.4,
      z: -2023.2,
      fact: 'Post-WWII thermal soaring and gliding headquarters at Narromine Aerodrome (YNRM), hosting national and international gliding championships and weekend joy flights. (Visit NSW / Narromine Aviation Museum)',
    }),
  ]),
});

// ── 7. Complete WGS84 GeoJSON FeatureCollection ─────────────────────────────
export const NARROMINE_AVIATION_GEOJSON = Object.freeze({
  type: 'FeatureCollection',
  name: 'Narromine Aviation Museum & Aerodrome Precinct (LEP Item I12)',
  features: Object.freeze([
    ...NARROMINE_AVIATION_BUILDINGS.map((b) =>
      Object.freeze({
        type: 'Feature',
        id: b.id,
        properties: Object.freeze({
          inventoryId: b.inventoryId,
          osmIndex: b.osmIndex,
          name: b.name,
          role: b.role,
          cadastralLot: b.cadastralLot,
          lepItem: b.lepItem,
          evidenceLevel: b.evidenceLevel,
          facadeEvidenceLevel: b.facadeEvidenceLevel,
          openingsEvidenceLevel: b.openingsEvidenceLevel,
          eaveHeightM: b.dimensionsM.eaveHeightM,
          ridgeHeightM: b.dimensionsM.ridgeHeightM,
        }),
        geometry: Object.freeze({
          type: 'Polygon',
          coordinates: Object.freeze([
            Object.freeze(
              [...b.footprintWorld, b.footprintWorld[0]].map((pt) => {
                const [lat, lon] = worldToGeo(pt);
                return Object.freeze([lon, lat]);
              })
            ),
          ]),
        }),
      })
    ),
    ...NARROMINE_AVIATION_EXHIBITS.map((ex) => {
      const [lat, lon] = ex.posGeo;
      return Object.freeze({
        type: 'Feature',
        id: ex.id,
        properties: Object.freeze({
          name: ex.name,
          category: ex.category,
          location: ex.location,
          evidenceLevel: ex.evidenceLevel,
          proportionEvidenceLevel: ex.proportionEvidenceLevel,
          historicalFact: ex.historicalFact,
        }),
        geometry: Object.freeze({
          type: 'Point',
          coordinates: Object.freeze([lon, lat]),
        }),
      });
    }),
  ]),
});
