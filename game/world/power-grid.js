// Deterministic, capacity-limited distribution model. This is an *integer
// allocation graph*, NOT an AC load-flow or electrical-safety calculation.
// Power quantities are fictional game power units per simulated hour.
export const POWER_EDGES = Object.freeze([
  // Day-14 Sunday 09:00 peak was 130 units; a 160-unit trunk with 72-unit
  // housing feeders leaves headroom while retaining finite overload/fault limits.
  // These are fictional game units, NOT a certified electrical design.
  { id:'main-feed', from:'generator', to:'junction', capacity:160 },
  { id:'critical-feed', from:'junction', to:'critical', capacity:16 },
  { id:'clinic-feed', from:'critical', to:'clinic', capacity:4 },
  { id:'waterworks-feed', from:'critical', to:'waterworks', capacity:6 },
  { id:'sewage-feed', from:'critical', to:'sewage', capacity:5 },
  { id:'business-feed', from:'junction', to:'businesses', capacity:24 },
  { id:'bakery-feed', from:'businesses', to:'bakery', capacity:8 },
  { id:'industry-feed', from:'businesses', to:'industry', capacity:9 },
  { id:'west-feeder', from:'junction', to:'west-homes', capacity:72 },
  { id:'east-feeder', from:'junction', to:'east-homes', capacity:72 },
]);
export const POWER_LINE_IDS = Object.freeze(POWER_EDGES.map(e => e.id));
export const GRID_FAULT_COST = Object.freeze({ credits:90, parts:2 });

function whole(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(name + ' must be a non-negative safe integer');
  return value;
}
function pathTo(node, edges, residual) {
  const frontier = [{ at:'generator', path:[] }], visited = new Set(['generator']);
  for (let i=0; i<frontier.length; i++) {
    const here = frontier[i];
    if (here.at === node) return here.path;
    for (const e of edges) {
      if (e.from !== here.at || residual[e.id] <= 0 || visited.has(e.to)) continue;
      visited.add(e.to);
      frontier.push({ at:e.to, path:[...here.path,e.id] });
    }
  }
  return null;
}

// Highest-priority facilities first. A feeder fault leaves unaffected branches
// operational; edge flow, total generation and each customer's demand reconcile.
export function distributePower({ generation, demands, failedLines = {} }) {
  whole(generation,'generation');
  if (!demands || typeof demands !== 'object' || Array.isArray(demands)) throw new TypeError('demands object required');
  const edges = POWER_EDGES, residual = {}, flows = {}, consumers = [];
  for (const e of edges) { residual[e.id] = failedLines[e.id] ? 0 : e.capacity; flows[e.id] = 0; }
  for (const [id, spec] of Object.entries(demands)) {
    if (!spec || typeof spec !== 'object') throw new TypeError('invalid customer '+id);
    whole(spec.demand,'demand '+id);
    if (!Number.isSafeInteger(spec.priority) || spec.priority < 0) throw new RangeError('priority '+id);
    if (!edges.some(e => e.to === id)) throw new Error('customer '+id+' is not connected to the grid');
    consumers.push({ id, name:String(spec.name||id), demand:spec.demand, priority:spec.priority });
  }
  consumers.sort((a,b)=>a.priority-b.priority || a.id.localeCompare(b.id));
  let available=generation, used=0;
  const customers={};
  for (const c of consumers) {
    const path=pathTo(c.id,edges,residual);
    const routeCapacity=path ? Math.min(...path.map(id=>residual[id])) : 0;
    const served=Math.min(available,c.demand,routeCapacity);
    available-=served; used+=served;
    for (const edgeId of path||[]) { residual[edgeId]-=served; flows[edgeId]+=served; }
    customers[c.id]={ name:c.name, demand:c.demand, served, unserved:c.demand-served,
      priority:c.priority, path:path||[], status:served===c.demand?'supplied':served===0?'out':'limited' };
  }
  const totalDemand=consumers.reduce((n,c)=>n+c.demand,0);
  const edgeStatus=edges.map(e=>({ ...e, failed:!!failedLines[e.id], flow:flows[e.id],
    availableCapacity:failedLines[e.id]?0:e.capacity }));
  if (used>generation || used>totalDemand) throw new Error('power accounting invariant');
  for (const e of edgeStatus) if(e.flow<0||e.flow>e.availableCapacity) throw new Error('grid edge over capacity: '+e.id);
  return { generation, demand:totalDemand, served:used, unserved:totalDemand-used,
    curtailed:generation-used, customers, edges:edgeStatus,
    affected:Object.entries(customers).filter(([,c])=>c.unserved>0).map(([id])=>id) };
}
export function townPowerDemands(hour, total) {
  whole(total,'town demand');
  if (!Number.isSafeInteger(hour) || hour<0 || hour>23) throw new RangeError('hour');
  // Abstract allocations, NOT kWh or real measured Dubbo power use.
  // Facility demand totals 16 units; household load takes the hourly remainder.
  let remaining=total;
  const allot=n=>{const taken=Math.min(remaining,n);remaining-=taken;return taken;};
  const clinic=allot(2),waterworks=allot(4),sewage=allot(3),bakery=allot(5),industry=allot(2);
  const homeLoad=remaining;
  return {
    clinic:{name:'Town Clinic',demand:clinic,priority:0},
    waterworks:{name:'Water Works pumps',demand:waterworks,priority:0},
    sewage:{name:'Wastewater Works',demand:sewage,priority:0},
    bakery:{name:'Mill and Bakery',demand:bakery,priority:1},
    'west-homes':{name:'West neighbourhood',demand:Math.floor(homeLoad/2),priority:1},
    'east-homes':{name:'East neighbourhood',demand:homeLoad-Math.floor(homeLoad/2),priority:1},
    industry:{name:'Foundry and workshops',demand:industry,priority:2},
  };
}
