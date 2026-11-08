// RTU-003/004/005: deterministic, source-grounded Repository Town electricity layout.
// This is an explicitly SYNTHETIC network, NOT surveyed NSW wiring, a power-flow
// solver, or a replacement for the existing ten-edge game dispatch (RTU-006/007).
// Positions are existing game coordinate metres; every edge includes a route.
import { validateUtilityGraph } from './utility-network-schema.js';
export const ELECTRIC_SCHEMA_VERSION = 1;
export const ROAD_X = Object.freeze([-338, -208, -78, 52, 182, 312]);
export const STREET_COUNT = 8;
export const STREET_SPACING = 46;
export const WEST_END = -338;
export const EAST_END = 338;
export const INTAKE = Object.freeze({ x:-143, z:184.5, referenceSite:'B:power', status:'design_synthetic' });
export const KVA_STANDARDS = Object.freeze([100, 160, 315, 500, 630, 1000]);
const COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BAND_STARTS = [0, 7, 13, 19];
const BAND_ENDS = [6, 12, 18, 25];
const DISTRIBUTION_KV = 22, LOW_VOLTAGE_KV = 0.4;
const ROUND = (v) => Math.round(v * 1000) / 1000;
const point = (x,z) => ({ x:ROUND(x), z:ROUND(z) });
export const roadZ = row => ROUND(-145 + (row-1)*STREET_SPACING);
const validPoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.z);
const clonePoint = p => point(p.x,p.z);
const distance = (a,b) => ROUND(Math.hypot(a.x-b.x,a.z-b.z));
const maxKva = (v) => KVA_STANDARDS.find(s=>s>=v);
const isThreePhase = (r) => r.kind!=='repository-house';
const criticalSites = new Set(['B:clinic','B:waterworks','B:sewage','B:fire','B:ambulance','B:power']);
const largerSites = new Map([
  ['B:foundry',180],['B:soyplant',150],['B:waterworks',110],
  ['B:sewage',100],['B:clinic',85],['B:mill',100],['B:pub',75],
  ['B:school',75],['B:fire',55],['B:ambulance',45],['B:bakery',45],
  ['B:silo',45],['B:power',45],['B:depot',45],['B:university',90],['B:tafe',80]
]);
function assert(condition, reason) { if(!condition) throw new Error('RTU-ELECTRIC: '+reason); }
function parseAddress(address) {
  const match=/^([A-Z])([1-9])-(N|S)$/.exec(address||'');
  assert(match, 'bad addressed property '+address);
  return {column:COLS.indexOf(match[1]), row:Number(match[2]), front:match[3]};
}
function bandFor(column) { const k=BAND_ENDS.findIndex(end=>column<=end);assert(k>=0,'invalid column');return k; }
const bank = (row,band) => 'DIST-R'+row+'-B'+(band+1);
const feederName = x => x < INTAKE.x ? 'MV-WEST' : 'MV-EAST';
const phases = ['A','B','C'];
export function createElectricalServiceRegistry(records) {
  assert(Array.isArray(records) && records.length>0,'source audit records required');
  const ids=new Set(), addresses=new Set();
  return records.map(r=>{
    assert(typeof r.id==='string' && /^[HB]:[A-Za-z0-9]+$/.test(r.id),'invalid property ID '+r.id);
    assert(!ids.has(r.id), 'duplicate property '+r.id);ids.add(r.id);
    assert(!addresses.has(r.address),'duplicate address '+r.address);addresses.add(r.address);
    assert(validPoint(r.door),'missing exact door position for '+r.id);
    const a=parseAddress(r.address);
    if(r.id.startsWith('H:'))assert(a.row<=8 && a.front==='S','invalid house position '+r.id);
    if(r.id.startsWith('B:'))assert(a.row===8 || a.row===9,'invalid civic row '+r.id);
    assert( Math.abs(r.door.x - (-325+26*a.column))<12,'door column mismatch '+r.id);
    // The square is a park site, not a separate enclosed building or meter.
    const required=r.id!=='B:square';
    const home=r.kind==='repository-house';
    const assumedKva=required ? (home?5:(largerSites.get(r.id)|| (r.kind==='farm'?24:18))) : 0;
    const phase=home ? phases[a.column%3] : 'ABC';
    return {
      id:r.id, address:r.address,kind:r.kind,
      position:validPoint(r.position)?clonePoint(r.position):null,
      door:clonePoint(r.door), positionBasis:r.positionBasis||'runtime audit',
      meterPosition:required?point(r.door.x+1.25,r.door.z+(a.row===9?0.5:-0.5)):null,
      serviceId:required?'SVC:'+r.id:null,
      meterId:required?'MTR:'+r.id:null,
      switchboardId:required?'SWB:'+r.id:null,
      status:required?'design_connected':'not_required',
      statusReason:required?'modelled individual synthetic LV supply; NOT yet live game dispatch':
        'open public square: no enclosed building meter; public lighting requires separate streetlight circuit',
      sourceAudit:'RTU-001/coverage.json',provenance:'SYNTHETIC_NETWORK_FROM_RUNTIME_GEOMETRY',
      nominalSupply:required?'400/230V AC':'none',
      phase,assumedConnectedKva:assumedKva,
      designMaxCurrentA:required?Math.ceil(assumedKva*1000/(phase==='ABC'?Math.sqrt(3)*400:230)):0,
      row:a.row===9?8:a.row, side:a.row===9?'south':'north', band:bandFor(a.column),
      critical:criticalSites.has(r.id),
      customerSource:r.behaviourCustomer||null,
      existingHouseholdModels:r.householdModels||0
    };
  }).sort((a,b)=>a.id.localeCompare(b.id));
}
export function buildTownElectricalBackbone(records) {
  const services=createElectricalServiceRegistry(records);
  const nodes=[],edges=[], nodeIds=new Set(),edgeIds=new Set();
  const node=(id,type,position,kv,extra={})=>{
    assert(!nodeIds.has(id),'duplicate node '+id);nodeIds.add(id);
    assert(position===null || validPoint(position),'bad node geometry '+id);
    const item={id,type,position:position&&clonePoint(position),voltageKv:kv,condition:'design_available',...extra};
    nodes.push(item);return item;
  };
  const edge=(id,from,to,type,kv,route,extra={})=>{
    assert(!edgeIds.has(id),'duplicate edge '+id);edgeIds.add(id);
    assert(nodeIds.has(from)&&nodeIds.has(to),'orphan endpoints '+id);
    assert(Array.isArray(route)&&route.length>=2&&route.every(validPoint),'unrouted link '+id);
    const item={id,from,to,type,voltageKv:kv,route:route.map(clonePoint),
      lengthGameMetres:ROUND(route.slice(1).reduce((s,p,i)=>s+distance(route[i],p),0)),
      condition:'design_available',isolationState:'closed',assetType:type,
      capacity:Number.isFinite(extra.ampacityA)?{value:extra.ampacityA,unit:'A'}:
        Number.isFinite(extra.ratedKva)?{value:extra.ratedKva,unit:'kVA'}:
        Number.isFinite(extra.ratedMva)?{value:extra.ratedMva,unit:'MVA'}:
        {value:null,unit:'unrated'},...extra};
    edges.push(item);return item;
  };
  const base=point(INTAKE.x,INTAKE.z), root=point(INTAKE.x,roadZ(8));
  node('EXT-GRID','external_supply',null,66,{region:'NSW-NEM',importSource:'conceptual regional link',provenance:'SYNTHETIC'});
  node('ZS-66','zone_substation_66kv',base,66,{intakeSite:INTAKE.referenceSite,siteBasis:'power station door',provenance:'SYNTHETIC'});
  node('ZS-22','zone_substation_22kv',base,22,{transformerMva:5,voltageClass:'66/22 kV',provenance:'SYNTHETIC'});
  node('MV-ROOT','mv_junction',root,22,{streetRow:8,routeBasis:'existing row-[address redacted]'});
  edge('GRID-IN','EXT-GRID','ZS-66','external_not_georeferenced',66,[base,base],{ratedMva:5,isPhysicalRoute:false});
  edge('ZS-TRANSFORM','ZS-66','ZS-22','voltage_conversion',66,[base,base],{ratedMva:5,transformerRatio:'66/22'});
  edge('MV-INTAKE','ZS-22','MV-ROOT','mv_underground',22,[base,root],{ratedMva:5,feederId:'SOURCE'});
  const avenues=new Map();
  const spine=[...ROAD_X,INTAKE.x].sort((a,b)=>a-b);
  for(const x of spine){
    const id=x===INTAKE.x?'MV-ROOT':'MV-R8-X'+x;
    if(id!=='MV-ROOT')node(id,'mv_junction',point(x,roadZ(8)),22,{streetRow:8});
    avenues.set('8:'+x,id);
  }
  const rootIndex=spine.indexOf(INTAKE.x);
  for(const dir of [-1,1]){
    let from='MV-ROOT';
    for(let k=rootIndex+dir;k>=0&&k<spine.length;k+=dir){
      const x=spine[k],to=avenues.get('8:'+x);
      edge('MV-SPINE-'+(dir===-1?'W':'E')+'-'+x,from,to,'mv_underground',22,
        [nodes.find(n=>n.id===from).position,point(x,roadZ(8))],
        {feederId:dir===-1?'MV-WEST':'MV-EAST',ampacityA:160,placement:'road-center conceptual underground'});
      from=to;
    }
  }
  for(const x of ROAD_X){
    let from=avenues.get('8:'+x);
    for(let row=7;row>=1;row--){
      const to='MV-R'+row+'-X'+x,p=point(x,roadZ(row));
      node(to,'mv_junction',p,22,{streetRow:row,avenueX:x});
      edge('MV-AV-X'+x+'-R'+row,from,to,'mv_underground',22,
        [point(x,roadZ(row+1)),p],{feederId:feederName(x),ampacityA:160,placement:'existing north-south avenue'});
      avenues.set(row+':'+x,to);from=to;
    }
  }
  const active=services.filter(s=>s.status==='design_connected');
  // Critical/large electric motors and major institutions warrant their own
  // transformer/service protection rather than sharing a small-shop transformer.
  const dedicated=active.filter(s=>s.assumedConnectedKva>=85);
  const dedicatedIds=new Set(dedicated.map(s=>s.id));
  const groups=new Map();
  for(const s of active.filter(s=>!dedicatedIds.has(s.id))){const key=s.row+':'+s.band;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s);}
  const transf=[];
  for(let row=1;row<=8;row++) for(let band=0;band<BAND_STARTS.length;band++){
    const locals=groups.get(row+':'+band)||[];
    if(!locals.length)continue;
    const centerCol=(BAND_STARTS[band]+BAND_ENDS[band])/2;
    const x=ROUND(-325+centerCol*26), z=roadZ(row), at=point(x,z-6.6);
    const sourceX=ROAD_X.reduce((best,k)=>Math.abs(k-x)<Math.abs(best-x)?k:best,ROAD_X[0]);
    const upstream=avenues.get(row+':'+sourceX),mid='MV-SPUR-R'+row+'-B'+(band+1);
    const tx=bank(row,band), lv='LV-BUS-R'+row+'-B'+(band+1);
    const raw=ROUND(locals.reduce((sum,s)=>sum+s.assumedConnectedKva,0));
    const diversified=ROUND(locals.reduce((sum,s)=>sum+s.assumedConnectedKva*
      (s.kind==='repository-house'?0.4:(s.critical?0.85:0.65)),0));
    const rated=maxKva(diversified*1.2);
    assert(rated,'transformer overload by design '+tx+' '+diversified+'kVA');
    const ratedMva=ROUND(rated/1000);
    const midPoint=point(x,z);
    node(mid,'mv_tap',midPoint,22,{streetRow:row,transformerId:tx});
    node(tx,'distribution_transformer',at,0.4,
      {primaryKv:22,secondaryKv:0.4,ratedKva:rated,diversifiedDesignKva:diversified,connectedDesignKva:raw,siteCount:locals.length,feederId:feederName(sourceX),provenance:'SYNTHETIC'});
    node(lv,'lv_bus',at,0.4,{transformerId:tx,phases:'ABC'});
    const mvTravel=[point(sourceX,z),midPoint];
    edge('MV-TAP-R'+row+'-B'+(band+1),upstream,mid,'mv_underground',22,mvTravel,
      {feederId:feederName(sourceX),ampacityA:160,placement:'existing row carriageway'});
    edge('MV-TX-R'+row+'-B'+(band+1),mid,tx,'distribution_transformer_primary',22,
      [midPoint,at],{ratedKva:rated,feederId:feederName(sourceX)});
    edge('TX-LV-R'+row+'-B'+(band+1),tx,lv,'transformer_secondary',0.4,[at,at],{ratedKva:rated});
    transf.push({id:tx,row,band:band+1,position:at,primaryFeeder:feederName(sourceX),ratedKva:rated,
      diversifiedKva:diversified,rawKva:raw,customers:locals.map(s=>s.id)});
    const sideGroups=new Map([['north',locals.filter(s=>s.side==='north')],['south',locals.filter(s=>s.side==='south')]]);
    for(const [side,sideServices] of sideGroups){
      if(!sideServices.length)continue;
      const curb=point(x,z+(side==='north'?-6.6:6.6));
      const bus=side==='north'?lv:'LV-SOUTH-R'+row+'-B'+(band+1);
      if(side==='south'){
        node(bus,'lv_bus',curb,0.4,{transformerId:tx,phases:'ABC'});
        edge('LV-DUCT-R'+row+'-B'+(band+1),lv,bus,'lv_road_crossing',0.4,[at,curb],
          {ampacityA:400,routeDetail:'buried duct at distribution transformer; no overhead road obstruction'});
      }
      // A radial supply to either side of the transformer: avoid star cables crossing plots.
      const arms=[sideServices.filter(s=>s.door.x<x).sort((a,b)=>b.door.x-a.door.x),
        sideServices.filter(s=>s.door.x>=x).sort((a,b)=>a.door.x-b.door.x)];
      for(const arm of arms){
        let previous=bus,last=curb;
        for(const service of arm){
          const tapPos=point(-325+COLS.indexOf(service.address[0])*26,curb.z);
          const tap='TAP:'+service.id;
          node(tap,'lv_pillar',tapPos,0.4,{transformerId:tx,side,phases:'ABC'});
          edge('LV-MAIN:'+service.id,previous,tap,'lv_main',0.4,[last,tapPos],
            {ampacityA:400,side,transformerId:tx,provenance:'SYNTHETIC'});
          const meter=service.meterId,switchboard=service.switchboardId;
          const m=service.meterPosition;
          node(meter,'service_meter',m,0.4,{propertyId:service.id,phase:service.phase,serviceId:service.serviceId});
          node(switchboard,'switchboard',m,0.4,{propertyId:service.id,phase:service.phase});
          // One-meter, one-property; row-9 north-facing sites tap the south sidewalk.
          edge('SERVICE:'+service.id,tap,meter,service.kind==='repository-house'?'service_drop':'underground_service',0.4,
            [tapPos,point(m.x,curb.z),m],
            {phase:service.phase,ampacityA:service.phase==='ABC'?250:80,serviceId:service.serviceId,
              assumedLengthGameMetres:ROUND(Math.abs(m.z-curb.z)+Math.abs(m.x-tapPos.x))});
          edge('MAIN-SWITCH:'+service.id,meter,switchboard,'service_switchboard',0.4,[m,m],
            {phase:service.phase,ampacityA:service.phase==='ABC'?250:80});
          service.transformerId=tx;
          service.feederId=feederName(sourceX);
          service.connectionNode=switchboard;
          previous=tap;last=tapPos;
        }
      }
    }
  }
  // Independent 22 kV spur, transformer, LV tap and meter for each major facility.
  for(const s of dedicated){
    const slug=s.id.replace(/[^a-zA-Z0-9]/g,'-').toUpperCase();
    const row=s.row,z=roadZ(row),x=ROUND(s.door.x);
    const sourceX=ROAD_X.reduce((best,k)=>Math.abs(k-x)<Math.abs(best-x)?k:best,ROAD_X[0]);
    const feederId=feederName(sourceX);
    const from=avenues.get(row+':'+sourceX),tapId='MV-DED-TAP-'+slug;
    const tx='DIST-DED-'+slug,bus='LV-DED-BUS-'+slug;
    const mv=point(x,z),curb=point(x,z+(s.side==='north'?-6.6:6.6));
    const diverse=ROUND(s.assumedConnectedKva*(s.critical?0.85:0.65));
    // Dedicated industrial/essential feeders cannot assume diversity from a
    // single premises; allow its full preliminary connected kVA plus reserve.
    const rated=maxKva(s.assumedConnectedKva*1.2);
    assert(rated,'dedicated facility capacity exceeds catalogue '+s.id);
    node(tapId,'mv_tap',mv,22,{feederId,buildingSite:s.id});
    node(tx,'distribution_transformer',curb,0.4,{
      primaryKv:22,secondaryKv:0.4,ratedKva:rated,diversifiedDesignKva:diverse,
      connectedDesignKva:s.assumedConnectedKva,siteCount:1,feederId,provenance:'SYNTHETIC'});
    node(bus,'lv_bus',curb,0.4,{transformerId:tx,phases:'ABC'});
    edge('MV-DED-SPUR-'+slug,from,tapId,'mv_underground',22,[point(sourceX,z),mv],
      {feederId,ampacityA:160,placement:'existing street'});
    edge('MV-DED-TX-'+slug,tapId,tx,'distribution_transformer_primary',22,[mv,curb],
      {ratedKva:rated,feederId});
    edge('TX-DED-LV-'+slug,tx,bus,'transformer_secondary',0.4,[curb,curb],
      {ratedKva:rated});
    const tap='TAP:'+s.id,m=s.meterPosition;
    node(tap,'lv_pillar',curb,0.4,{transformerId:tx,side:s.side,phases:'ABC'});
    node(s.meterId,'service_meter',m,0.4,{propertyId:s.id,phase:s.phase,serviceId:s.serviceId});
    node(s.switchboardId,'switchboard',m,0.4,{propertyId:s.id,phase:s.phase});
    edge('LV-MAIN:'+s.id,bus,tap,'lv_main',0.4,[curb,curb],
      {ampacityA:400,side:s.side,transformerId:tx});
    edge('SERVICE:'+s.id,tap,s.meterId,'underground_service',0.4,
      [curb,point(m.x,curb.z),m],
      {phase:s.phase,ampacityA:400,serviceId:s.serviceId,
        assumedLengthGameMetres:ROUND(Math.abs(m.z-curb.z)+Math.abs(m.x-curb.x))});
    edge('MAIN-SWITCH:'+s.id,s.meterId,s.switchboardId,'service_switchboard',0.4,[m,m],
      {phase:s.phase,ampacityA:400});
    s.transformerId=tx;s.feederId=feederId;s.connectionNode=s.switchboardId;
    transf.push({id:tx,row,band:null,position:curb,primaryFeeder:feederId,
      ratedKva:rated,diversifiedKva:diverse,rawKva:s.assumedConnectedKva,
      customers:[s.id],dedicated:true});
  }
  return {
    schemaVersion:ELECTRIC_SCHEMA_VERSION,
    utility:'electricity',units:{coordinate:'game_m',voltage:'kV',power:'kVA',lineCapacity:'A'},
    tasks:['RTU-003','RTU-004','RTU-005'],
    status:'synthetic_routed_connection_design_not_live_dispatch',
    baselineSource:'audit/electricity/coverage.json (RTU-001)',geometryBasis:'existing game road and door coordinates',
    warning:'All distribution circuits, ratings, phases and cable routes are synthetic engineering assumptions. NOT a surveyed NSW electrical network or safe construction plan.',
    intake:{...INTAKE,externalSupplyKv:66,secondaryDistributionKv:22,mainTransformMva:5,
      justification:'B:power station H9-N, exact door x=-143 z=184.5; row-[address redacted] centre z=177',
      designSource:'conceptual regional NSW bulk grid (not local generator capacity assertion)'},
    nodes,edges,services,transformers:transf,
    stats:{sourceSites:services.length,designConnected:active.length,notRequired:services.length-active.length,
      distributionTransformers:transf.length,connectedKva:ROUND(active.reduce((sum,s)=>sum+s.assumedConnectedKva,0)),
      estimatedDiversifiedKva:ROUND(transf.reduce((sum,t)=>sum+t.diversifiedKva,0)),
      modelledLines:edges.length},
    engineeringRules:{
      voltage:'66kV external → synthetic 66/22kV zone transformer → 22kV MV → 22/0.4kV local transformers → 400/230V LV',
      distributionTransformersKva:[...KVA_STANDARDS], diversityHousehold:0.4,
      diversityGeneralSite:0.65, diversityCritical:0.85, reserveMultiplier:1.2,
      feederProtection:'RTU-013 future',physicsAndDemand:'RTU-006/007 future',
      rendering:'RTU-011 future',applianceWiring:'RTU-012 future',
      exportAndApproval:'No real-world GIS/survey or electrical design approval'
    }
  };
}
export function validateTownElectricNetwork(network, sourceRecords) {
  assert(network.schemaVersion===1,'schema version');
  validateUtilityGraph(network);
  assert(Array.isArray(network.nodes)&&Array.isArray(network.edges)&&Array.isArray(network.services),'missing typed arrays');
  const nodes=new Map(),incoming=new Map(),edgeIds=new Set();
  const allowedTypes=new Set(['external_supply','zone_substation_66kv','zone_substation_22kv','mv_junction',
    'mv_tap','distribution_transformer','lv_bus','lv_pillar','service_meter','switchboard']);
  const allowedEdges=new Set(['external_not_georeferenced','voltage_conversion','mv_underground',
    'distribution_transformer_primary','transformer_secondary','lv_road_crossing','lv_main',
    'service_drop','underground_service','service_switchboard']);
  for(const n of network.nodes){
    assert(typeof n.id==='string'&&!nodes.has(n.id),'duplicate node '+n.id);
    assert(allowedTypes.has(n.type),'unrecognised node type '+n.type);
    assert(n.position===null||validPoint(n.position),'bad node point '+n.id);
    assert([66,22,0.4].includes(n.voltageKv),'unsupported voltage '+n.id);
    nodes.set(n.id,n);
  }
  for(const e of network.edges){
    assert(typeof e.id==='string'&&!edgeIds.has(e.id),'duplicate edge '+e.id);edgeIds.add(e.id);
    assert(allowedEdges.has(e.type),'unrecognised edge '+e.id);
    assert(e.condition==='design_available','invalid asset condition '+e.id);
    assert(['closed','open'].includes(e.isolationState),'invalid isolator state '+e.id);
    assert(nodes.has(e.from)&&nodes.has(e.to),'orphan edge '+e.id);
    assert(e.from!==e.to,'self edge '+e.id);
    assert(!incoming.has(e.to),'nonradial multiple parents '+e.to);
    assert(Array.isArray(e.route)&&e.route.length>=2&&e.route.every(validPoint),'missing route '+e.id);
    assert(Number.isFinite(e.lengthGameMetres)&&e.lengthGameMetres>=0,'invalid cable length '+e.id);
    if(e.type==='voltage_conversion')assert(nodes.get(e.from).voltageKv===66&&nodes.get(e.to).voltageKv===22,'zone voltage conversion');
    else if(e.type==='distribution_transformer_primary')assert(nodes.get(e.from).voltageKv===22&&nodes.get(e.to).voltageKv===0.4,'local transformer conversion');
    else if(e.type==='external_not_georeferenced')assert(!e.isPhysicalRoute,'external source must not be invented surveyed line');
    else assert(nodes.get(e.from).voltageKv===nodes.get(e.to).voltageKv,'edge inconsistent voltage '+e.id);
    if(e.ampacityA!==undefined)assert(e.ampacityA>0,'invalid ampacity '+e.id);
    incoming.set(e.to,e);
  }
  const serviceIds=new Set(),meterIds=new Set(),addresses=new Set();
  const sourceIds=new Set(sourceRecords.map(r=>r.id));
  assert(sourceIds.size===sourceRecords.length,'source duplicate site');
  assert(network.services.length===sourceIds.size,'one registry record per surveyed site');
  for(const s of network.services){
    assert(sourceIds.has(s.id),'orphan service '+s.id);assert(!serviceIds.has(s.id),'duplicate service '+s.id);
    serviceIds.add(s.id);assert(!addresses.has(s.address),'duplicate address '+s.address);addresses.add(s.address);
    if(s.status==='not_required'){
      assert(!s.meterId&&!s.serviceId&&!s.connectionNode,'park incorrectly metered');
      continue;
    }
    assert(s.status==='design_connected','unconnected building '+s.id);
    assert(typeof s.meterId==='string'&&!meterIds.has(s.meterId),'duplicate/unassigned meter '+s.id);
    meterIds.add(s.meterId);assert(nodes.get(s.meterId)?.type==='service_meter','missing meter '+s.id);
    assert(nodes.get(s.connectionNode)?.type==='switchboard','missing switchboard '+s.id);
    assert(['A','B','C','ABC'].includes(s.phase),'invalid phase '+s.id);
    assert(s.designMaxCurrentA>0&&Number.isFinite(s.assumedConnectedKva),'unrated load '+s.id);
    const path=traceElectricalService(network,s.id);
    assert(path.connected,'unenergised source path '+s.id);
    assert(path.nodes.some(id=>nodes.get(id)?.type==='distribution_transformer'),'no local transformer '+s.id);
    assert(path.nodes.some(id=>nodes.get(id)?.type==='service_meter'),'no meter path '+s.id);
    assert(path.nodes.includes('ZS-22')&&path.nodes.includes('MV-ROOT'),'not connected to source '+s.id);
  }
  assert(network.services.filter(s=>s.status==='not_required').length===network.stats.notRequired,'status count');
  for(const t of network.transformers)assert(t.ratedKva>=t.diversifiedKva*1.2-0.01,'underrated transformer '+t.id);
  return {ok:true,buildingSites:network.services.length,connected:meterIds.size,
    notRequired:network.stats.notRequired,transformers:network.transformers.length,edges:network.edges.length};
}
export function traceElectricalService(network,propertyId,failedEdgeIds=[]) {
  const s=network.services.find(q=>q.id===propertyId);
  assert(s,'unknown service '+propertyId);
  if(s.status==='not_required')return {propertyId,connected:false,reason:'not_required',edges:[],nodes:[]};
  const failed=new Set(failedEdgeIds);
  const parents=new Map(network.edges.map(e=>[e.to,e]));
  const seen=new Set(),edgePath=[],nodePath=[s.connectionNode];
  let at=s.connectionNode;
  while(at!=='EXT-GRID'){
    if(seen.has(at))return {propertyId,connected:false,reason:'cycle',edges:edgePath.reverse(),nodes:nodePath.reverse()};
    seen.add(at);
    const e=parents.get(at);
    if(!e)return {propertyId,connected:false,reason:'disconnected',edges:edgePath.reverse(),nodes:nodePath.reverse()};
    if(failed.has(e.id)||e.isolationState==='open')return {propertyId,connected:false,reason:'isolated',failedAt:e.id,edges:edgePath.reverse(),nodes:nodePath.reverse()};
    edgePath.push(e.id);at=e.from;nodePath.push(at);
  }
  return {propertyId,connected:true,reason:'source_path',edges:edgePath.reverse(),nodes:nodePath.reverse()};
}
