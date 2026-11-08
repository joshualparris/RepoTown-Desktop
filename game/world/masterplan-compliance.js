// Evidence, NOT consent: NSW/Dubbo residential-subdivision screening for the in-game 195 lots.
// All linear measurements are fictional metres. LEP lot-size/zoning is spatially variable;
// never turn a geometry assertion into a legal compliance certificate.
import {CORE_ROADS,SELECTED_PLAN,graph,rect,overlap,roadRect,frontage} from './masterplan-model.js';
import {PLAN_ROADS,PLAN_PARCELS,PLAN_HOMES} from './masterplan-built.js';
import {countryInteriorPlan} from './country-interiors.js';

export const PLANNING_EVIDENCE_SOURCES=Object.freeze({
 LEP:'https://www.dubbo.nsw.gov.au/Builders-Developers/Planning-Controls-Tools-and-Resources/Dubbo-Regional-Local-Environmental-Plan-2022',
 DCP:'https://www.dubbo.nsw.gov.au/Builders-Developers/Planning-Controls-Tools-and-Resources/development-control-plan',
 engineering:'https://www.dubbo.nsw.gov.au/Builders-Developers/Planning-Controls-Tools-and-Resources/engineering-standards-drawings',
 NCC:'https://www.nsw.gov.au/housing-and-construction/compliance-and-regulation/how-to-comply-national-construction-code',
 BASIX:'https://www.planning.nsw.gov.au/the-planning-system/buildings/sustainable-buildings-sepp/sustainability-standards-residential-development-basix',
 road:'https://austroads.gov.au/safety-and-design/road-design/guide-to-road-design'
});
const round=n=>Math.round(n*100)/100;
export function masterplanComplianceEvidence(){
 const homes=PLAN_HOMES.map(h=>{
  const p=PLAN_PARCELS.find(x=>x.id===h.parcelId);
  const r=PLAN_ROADS.find(x=>x.id===p.roadId);
  const interior=countryInteriorPlan(h);
  const actualFrontage=frontage(p,r);
  const outerFootprint={x0:h.x-h.design.w/2,x1:h.x+h.design.w/2,
     z0:(h.facesNorth?h.frontZ+h.design.d/2:h.frontZ-h.design.d/2)-h.design.d/2,
     z1:(h.facesNorth?h.frontZ+h.design.d/2:h.frontZ-h.design.d/2)+h.design.d/2};
  const clearOfReserve=!PLAN_ROADS.some(rd=>overlap(outerFootprint,roadRect(rd,true)));
  const withinLot=!overlap(outerFootprint,{x0:-Infinity,x1:p.x-p.w/2,z0:-Infinity,z1:Infinity}) &&
   outerFootprint.x0>=p.x-p.w/2 && outerFootprint.x1<=p.x+p.w/2 &&
   outerFootprint.z0>=p.z-p.d/2 && outerFootprint.z1<=p.z+p.d/2;
  return Object.freeze({
   id:h.parcelId,address:h.address,country:h.country,tradition:h.tradition,
   lotAreaM2:p.areaM2,frontageM:actualFrontage,footprintM2:round(h.design.w*h.design.d),
   storeysModelled:h.design.floors,storeysPlayable:interior.floorsPlayable,
   geometry:{roadFrontage:actualFrontage>0,lotFit:withinLot,roadReserveClear:clearOfReserve,interiorContained:interior.w<=h.design.w&&interior.d<=h.design.d},
   planningStatus:'UNVERIFIED',buildingStatus:'UNVERIFIED',
   missing:['legal lot/zone/site coordinates','LEP minimum lot size','surveyed levels','stormwater & flood','soil & foundations','bushfire assessment if mapped','utility service connections','BASIX/NatHERS','NCC 2022 Amendment 2 fire, structure, access and amenity','engineer/certifier approval',...(h.design.floors>1?['upper-storey stair/egress structural design and playable access']:[])]
  });
 });
 const totalRoadLengthM=round(PLAN_ROADS.reduce((n,r)=>n+Math.hypot(r.b.x-r.a.x,r.b.z-r.a.z),0));
 const serviceFrontage=round(PLAN_PARCELS.filter(p=>p.use==='residential').reduce((n,p)=>n+frontage(p,PLAN_ROADS.find(r=>r.id===p.roadId)),0));
 const park=PLAN_PARCELS.find(p=>p.use==='park');
 const parkDistances=PLAN_HOMES.map(h=>round(Math.hypot(h.x-park.x,h.frontZ-park.z)));
 const parkAccess={method:'straight-line to eastern park; NOT a footpath network or DCP-compliance test',
   parkAddress:park.address,parkAreaM2:park.areaM2,
   homesBeyond400mStraightLine:parkDistances.filter(d=>d>400).length,
   farthestHomeStraightLineM:Math.max(...parkDistances),
   additionalWesternPublicSpaceNeeded:true};
 const roadSurfaceM2=round(PLAN_ROADS.reduce((n,r)=>n+Math.hypot(r.b.x-r.a.x,r.b.z-r.a.z)*r.width,0));
 const reservedRoadAreaM2=round(PLAN_ROADS.reduce((n,r)=>n+Math.hypot(r.b.x-r.a.x,r.b.z-r.a.z)*r.reserve,0));
 const g=graph([...CORE_ROADS,...PLAN_ROADS]);
 const distinctRoadIds=PLAN_ROADS.map(r=>r.id);
 const roadClosure=distinctRoadIds.map(id=>{
  const remaining=graph([...CORE_ROADS,...PLAN_ROADS.filter(r=>r.id!==id)]);
  return {road:id,frontingLotsOnClosedRoad:PLAN_PARCELS.filter(p=>p.roadId===id).length,components:remaining.components.length};
 });
 const lots=PLAN_PARCELS.filter(p=>p.use==='residential');
 return Object.freeze({
  scope:'fictional game-only 195-home, 199-parcel stage',
  date:'2026-10-27', planningStatus:'NOT CERTIFIED; zoning and serviced subdivision remain unverified',
  buildingsStatus:'NOT NCC CERTIFIED; only ground-floor interiors playable',
  units:'fictional metres',
  parcels:PLAN_PARCELS.length,dwellings:lots.length,countryDesigns:new Set(homes.map(h=>h.country)).size,
  area:{residentialLotM2:lots.reduce((n,p)=>n+p.areaM2,0),allParcelsM2:PLAN_PARCELS.reduce((n,p)=>n+p.areaM2,0),
        roadLengthM:totalRoadLengthM,roadCarriagewayM2:roadSurfaceM2,roadReservationGrossM2:reservedRoadAreaM2,
        residentialFrontageM:serviceFrontage},
  lotSizeHistogram:Object.fromEntries([...new Set(lots.map(p=>p.areaM2))].sort((a,b)=>a-b).map(x=>[x,lots.filter(p=>p.areaM2===x).length])),
  traffic:{mode:'illustrative sensitivity, not forecast/transport impact assessment',siteTripsOtherPeakHour:50,
    scenarios:[.4,.8,1.2].map(rate=>({dwellingTripsPeakHour:rate,dwellingTrips:round(rate*lots.length),totalWithOther:round(rate*lots.length+50),ifEvenlySplitThreeEntrances:round((rate*lots.length+50)/3)})),
    requires:['observed trip generation and direction split','intersection turning counts and delays','service/emergency vehicle swept paths','parking and active-travel review']},
  network:{connectedComponents:g.components.length,roadClosure,serviceStatus:'proposed in game only',parkAccess},
  stormwater:{modelled:false,hydrology:false,pitPipeInvertDesign:false,downstreamLegalDischarge:false,overlandFlowRouting:false},
  water:{allLotsConnected:false,hydraulicCapacityVerified:false},sewer:{allLotsConnected:false,downstreamCapacityVerified:false},
  electricity:{allLotsConnected:false,capacityVerified:false},telecommunications:{allLotsConnected:false},
  geotechnicalAndHazardMaps:{surveyedTerrain:false,flood:false,bushfire:false,salinity:false,heritage:false,biodiversity:false},
  checks:{countryCount195:homes.length===195&&new Set(homes.map(h=>h.country)).size===195,
    allLotsPhysicallyFrontStreet:homes.every(h=>h.geometry.roadFrontage),
    buildingsWhollyOnLots:homes.every(h=>h.geometry.lotFit),
    buildingsClearRoadReserves:homes.every(h=>h.geometry.roadReserveClear),
    allInteriorFootprintsFit:homes.every(h=>h.geometry.interiorContained),
    connectedRoadGraph:g.components.length===1,
    allPlansFullyServiced:false,approvedUnderLEP:false,NCCCompliant:false},
  blocked:['real NSW parcel cadastre/zone & lot size map','Dubbo Council latest detailed engineering drawings (request required)','site survey/levels and geotechnical test','stormwater design and discharge approvals','utility providers and hydraulic calculations','road design and turning simulation','certified NCC/BASIX architectural packages'],
  homes,sources:PLANNING_EVIDENCE_SOURCES
 });
}
