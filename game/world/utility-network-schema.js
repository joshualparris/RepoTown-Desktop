// RTU-004: small reusable contract for town utility networks.
// Domain-specific physics/phase/pipe validations run on top of this graph
// and never treat a topological connection as sufficient supply.
export const UTILITY_GRAPH_SCHEMA_VERSION = 1;
export const UTILITY_KINDS = Object.freeze(['electricity','water','wastewater','gas']);
export const CONNECTION_STATES = Object.freeze(['closed','open']);
export const CONDITIONS = Object.freeze(['design_available','in_service','failed','under_repair']);
const check=(yes,msg)=>{if(!yes)throw new Error('UTILITY-SCHEMA: '+msg);};
const pt=p=>p!==null && p && Number.isFinite(p.x)&&Number.isFinite(p.z);
export function validateUtilityGraph(graph){
  check(graph && typeof graph==='object' && !Array.isArray(graph),'graph object required');
  check(graph.schemaVersion===UTILITY_GRAPH_SCHEMA_VERSION,'unsupported version');
  check(UTILITY_KINDS.includes(graph.utility),'invalid utility medium');
  check(graph.units && graph.units.coordinate==='game_m','coordinate units required');
  check(Array.isArray(graph.nodes)&&graph.nodes.length>0,'missing nodes');
  check(Array.isArray(graph.edges),'missing edges');
  check(Array.isArray(graph.services),'missing property service registry');
  const nodeIds=new Set(),edges=new Set(),parents=new Map();
  for(const n of graph.nodes){
    check(typeof n.id==='string'&&n.id.length>0,'invalid node ID');
    check(!nodeIds.has(n.id),'duplicate node '+n.id);nodeIds.add(n.id);
    check(typeof n.type==='string'&&n.type.length>0,'missing node type '+n.id);
    check(n.position===null||pt(n.position),'invalid node coordinates '+n.id);
    check(CONDITIONS.includes(n.condition),'invalid node condition '+n.id);
    if(n.voltageKv!==undefined)check(Number.isFinite(n.voltageKv)&&n.voltageKv>0,'invalid voltage '+n.id);
  }
  for(const e of graph.edges){
    check(typeof e.id==='string'&&e.id.length>0,'invalid edge ID');
    check(!edges.has(e.id),'duplicate edge '+e.id);edges.add(e.id);
    check(nodeIds.has(e.from)&&nodeIds.has(e.to)&&e.from!==e.to,'orphan/self edge '+e.id);
    check(!parents.has(e.to),'two upstream parents / electrical loop '+e.to);parents.set(e.to,e.from);
    check(typeof e.type==='string'&&e.type.length>0,'missing edge type '+e.id);
    check(Array.isArray(e.route)&&e.route.length>=2&&e.route.every(pt),'invalid route '+e.id);
    check(CONDITIONS.includes(e.condition),'invalid edge condition '+e.id);
    check(CONNECTION_STATES.includes(e.isolationState),'invalid isolation state '+e.id);
    check(e.capacity && (e.capacity.value===null||(Number.isFinite(e.capacity.value)&&e.capacity.value>=0)),
      'invalid capacity '+e.id);
    check(['A','kVA','MVA','kW','L/s','kPa','m3/h','MJ/h','unrated'].includes(e.capacity.unit),
      'unsupported capacity units '+e.id);
  }
  const propertyIds=new Set(),meterIds=new Set();
  for(const s of graph.services){
    check(typeof s.id==='string'&&!propertyIds.has(s.id),'duplicate/invalid property '+s.id);
    propertyIds.add(s.id);
    check(['design_connected','connected','not_required','off_grid','unconnected'].includes(s.status),
      'invalid property status '+s.id);
    if(s.meterId){
      check(typeof s.meterId==='string'&&!meterIds.has(s.meterId),'duplicate meter '+s.id);
      meterIds.add(s.meterId);check(nodeIds.has(s.meterId),'orphan meter '+s.id);
    }
  }
  // A graph with multiple distinct sources is allowed. Single-parent directed
  // topology is required for these early radial networks; meshed utility graph
  // support will need an explicit new schema version and flow solver.
  const complete=new Set();
  for(const id of nodeIds){
    let cursor=id;const visited=new Set();
    while(parents.has(cursor)){
      check(!visited.has(cursor),'cycle at '+cursor);visited.add(cursor);
      cursor=parents.get(cursor);
    }
    complete.add(cursor);
  }
  return {ok:true,utility:graph.utility,nodes:nodeIds.size,edges:edges.size,
    propertySites:propertyIds.size,meters:meterIds.size,sourceRoots:[...complete].sort()};
}
