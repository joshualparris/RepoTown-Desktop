// Read-only game-road accessibility screen for a PROPOSED 195-home estate.
// These are road-centreline graph distances, not built/accessible pedestrian
// footpaths, legally certified crossings, surveyed paths or planning approvals.
import { CORE_ROADS, accessPoint, graph, distances, frontage } from './masterplan-model.js';
import { PLAN_ROADS, PLAN_PARCELS, PLAN_HOMES } from './masterplan-built.js';

const round = n => Math.round(n * 100) / 100;
const percentile = (sorted, q) => sorted.length
  ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))] : null;
const key = p => String(p.x) + ',' + String(p.z);
export function proposedParkRouteBaseline({ removeRoad = null } = {}) {
  const parks = PLAN_PARCELS.filter(p => p.use === 'park');
  if (parks.length !== 1) throw Error('Park count changed; review baseline and entrances');
  const park = parks[0];
  const planned = removeRoad ? PLAN_ROADS.filter(r => r.id !== removeRoad) : PLAN_ROADS;
  const roads = [...CORE_ROADS, ...planned];
  const byId = new Map(PLAN_PARCELS.map(p => [p.id, p]));
  const byRoad = new Map(roads.map(r => [r.id, r]));
  const parkRoad = byRoad.get(park.roadId);
  if (!parkRoad || frontage(park, parkRoad) <= 0)
    return { method:'conceptual-road-centreline', removeRoad, sourceCount:PLAN_HOMES.length, reachableCount:0,
      missingParkFrontage:true, routes:[], caveat:'No documented park-road access after removal' };
  const parkRoadPoint = accessPoint(park, parkRoad);
  const entries = PLAN_HOMES.map(h => {
    const parcel = byId.get(h.parcelId);
    if (!parcel) throw Error('No planned parcel for home ' + h.parcelId);
    const road = byRoad.get(parcel.roadId);
    const validFrontage = !!road && frontage(parcel, road) > 0;
    return { home:h, parcel, road, validFrontage, roadPoint:validFrontage ? accessPoint(parcel, road) : null };
  });
  const g = graph(roads, [parkRoadPoint, ...entries.filter(e=>e.validFrontage).map(e=>e.roadPoint)]);
  const distanceFromPark = distances(g, key(parkRoadPoint));
  // The park's legal frontage reaches the edge of its road reservation, not
  // the centreline. This optimistic 10 m access segment is a MODEL estimate,
  // not a mapped or inspectable pedestrian crossing.
  const reserveHalfWidthM = (parkRoad.reserve ?? parkRoad.width) / 2;
  const routes = entries.map(e => {
    const homeApproachM = e.roadPoint ? Math.hypot(e.home.x-e.roadPoint.x,e.home.frontZ-e.roadPoint.z) : null;
    const centrelineM = e.roadPoint ? distanceFromPark.get(key(e.roadPoint)) : null;
    const reachable = e.validFrontage && Number.isFinite(centrelineM);
    const travelM = reachable ? round(homeApproachM + centrelineM + reserveHalfWidthM) : null;
    const directM = round(Math.hypot(e.home.x - parkRoadPoint.x,e.home.frontZ - parkRoadPoint.z));
    return Object.freeze({
      parcelId:e.home.parcelId,
      address:e.home.address,
      parkParcelId:park.id,
      roadId:e.parcel.roadId,
      streetFrontageValid:e.validFrontage,
      roadCentrelineDistanceM:reachable?round(centrelineM):null,
      houseApproachM:e.validFrontage?round(homeApproachM):null,
      proposedParkEntranceOffsetM:reserveHalfWidthM,
      totalProposedWalkingM:travelM,
      directToParkRoadPointM:directM,
      reachableOnModel:reachable,
      approval:'NOT APPROVED, NO PEDESTRIAN ACCESS VERIFIED',
    });
  });
  const measured=routes.filter(r=>r.reachableOnModel).map(r=>r.totalProposedWalkingM).sort((a,b)=>a-b);
  return Object.freeze({
    method:'axis-aligned proposed/existing game-road centreline + house approach + park road-reserve crossing estimate',
    sourceCount:PLAN_HOMES.length,
    planningParcelCount:PLAN_PARCELS.length,
    roadCount:roads.length,
    parkParcelId:park.id,
    parkRoadId:park.roadId,
    removeRoad,
    roadGraphComponents:g.components.length,
    reachableCount:measured.length,
    unreachableCount:PLAN_HOMES.length-measured.length,
    homesBeyond400mByProposedRoad:measured.filter(d=>d>400).length,
    p50ProposedWalkingM:percentile(measured,.50),
    p90ProposedWalkingM:percentile(measured,.90),
    longestProposedWalkingM:measured.at(-1) ?? null,
    routes,
    caveat:'Distances describe fictional proposed game road centreline routes. These are NOT footpath edges, crossing delays, gradients, ramps, safe pedestrian connectivity or NSW planning compliance. No travel-time/accessible service claims.',
  });
}
