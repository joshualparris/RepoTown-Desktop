// Narromine road traffic at realistic levels. Volumes come from the NSW "level crossings on public
// roads" register (Transport for NSW open data): Dandaloo Street 7,000 vehicles/day (crossing 717),
// Manildra Street 500/day (716), Derribong Street/Dandaloo Road 380/day (1109). Other streets use
// typical figures by road class. Cars drive on the left at the posted 50 km/h town limit (Mapillary
// speed signs), slow for turns, stop behind the player and each other, and wait at closed crossings.
// Only the area around the player (500 m) is simulated, so phones stay smooth.
import * as THREE from 'three';
import { STREETS } from './narromine-layout.js';
import { VEHICLE_MODELS, pickVehicle, pickPaint, loadVehicleModels } from './narromine-vehicle-models.js';
import { createNarromineCommute } from './narromine-commute.js';
import { AWAY_WORK } from './narromine-population.js';
import { vehicleFootprintsOverlap, carIncreasingSeparation } from './vehicle-occupancy.js';

export const DAILY_VEHICLES = Object.freeze({ 'Dandaloo Street': 7000, 'Manildra Street': 500, 'Derribong Street': 380, 'Dandaloo Road': 380 });
const CLASS_VEHICLES = { trunk: 7000, primary: 4000, secondary: 3000, tertiary: 900, unclassified: 250, residential: 150, living_street: 50, service: 40, track: 15 };
// Share of the daily total in each hour (typical Australian country-town weekday profile; sums to 1).
const HOURLY = [.006, .004, .003, .003, .006, .016, .038, .066, .079, .068, .064, .066, .068, .066, .068, .074, .08, .072, .052, .036, .028, .022, .014, .008];
const SPEED = 50 / 3.6, RADIUS = 500;

export function buildGraph() {
  const nodes = [], adj = new Map(), key = (p) => Math.round(p[0] * 2) + ',' + Math.round(p[1] * 2), index = new Map();
  const node = (p) => { const k = key(p); if (!index.has(k)) { index.set(k, nodes.length); nodes.push({ x: p[0], z: p[1] }); adj.set(nodes.length - 1, []); } return index.get(k); };
  for (const s of STREETS) {
    if (s.kind === 'track' || s.kind === 'service' || s.pts.length < 2) continue;
    const daily = DAILY_VEHICLES[s.name] ?? CLASS_VEHICLES[s.kind] ?? 150;
    let prev = node(s.pts[0]);
    for (let i = 1; i < s.pts.length; i++) {
      const id = node(s.pts[i]); if (id === prev) continue;
      const len = Math.hypot(nodes[id].x - nodes[prev].x, nodes[id].z - nodes[prev].z), e = { daily, width: s.width || 7, len, name: s.name, kind: s.kind };
      adj.get(prev).push({ to: id, ...e }); adj.get(id).push({ to: prev, ...e }); prev = id;
    }
  }
  return { nodes, adj };
}

const CAR_COLOURS = [0xe8e8e4, 0x9aa3ab, 0x2f3b4a, 0x7a1e1e, 0x1f3f6b, 0x3b3b3b, 0xd8d2c0, 0x5c6b52];
const MAX_CARS = 400;
// Most cars are residents' own (narromine-commute.js): each is driven by a named person from home to a real
// destination, then parks. Only Mitchell Highway (trunk) traffic is through traffic: trucks and travellers
// passing through, about half of the highway's counted volume.
const THROUGH_SHARE = 0.5;
export function createNarromineTraffic(parent, { blocked = () => false, models = typeof document !== 'undefined', residents = true, activity, parkingClear = () => true } = {}) {
  // Real vehicle models load in the background; until then (and in Node tests) cars are drawn as
  // simple boxes: two instanced meshes, bodies and cabins.
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.75, 4.4), new THREE.MeshLambertMaterial({ color: 0xffffff }), MAX_CARS);
  const cabins = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.55, 2.0), new THREE.MeshLambertMaterial({ color: 0x9dc3d4 }), MAX_CARS);
  bodies.count = cabins.count = 0; bodies.frustumCulled = cabins.frustumCulled = false; bodies.name = 'Narromine traffic'; parent.add(bodies, cabins);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), tint = new THREE.Color();
  let real = null;
  if (models) loadVehicleModels(parent).then(r => { real = r; bodies.visible = cabins.visible = false; }).catch(e => console.warn('Narromine vehicle models did not load; keeping simple cars', e));
  function draw() {
    if (real) { real.draw(parked.length ? cars.concat(parked) : cars); return; }
    const n = Math.min(cars.length, MAX_CARS);
    for (let i = 0; i < n; i++) {
      const c = cars[i]; q.setFromAxisAngle(up, c.yaw);
      m4.compose(new THREE.Vector3(c.x, 0.65, c.z), q, new THREE.Vector3(1, 1, 1)); bodies.setMatrixAt(i, m4); bodies.setColorAt(i, tint.setHex(c.colour));
      const back = c.ute ? 0.6 : 0.2;   // utes have a short cab
      m4.compose(new THREE.Vector3(c.x + Math.sin(c.yaw) * back, 1.28, c.z + Math.cos(c.yaw) * back), q, new THREE.Vector3(1, 1, c.ute ? 0.8 : 1.15)); cabins.setMatrixAt(i, m4);
    }
    bodies.count = cabins.count = n; bodies.instanceMatrix.needsUpdate = cabins.instanceMatrix.needsUpdate = true; if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  }
  const graph = buildGraph(), { nodes, adj } = graph;
  const commute = residents ? createNarromineCommute(graph) : null;
  let parked = [];
  const edges = []; for (const [from, list] of adj) for (const e of list) if (from < e.to) edges.push({ from, ...e });
  const cars = []; let serial = 0, seed = 1234567;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;     // deterministic, so tests repeat
  const posOf = (c) => { const a = nodes[c.from], b = nodes[c.to], t = c.s / c.len; return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, ux: (b.x - a.x) / c.len, uz: (b.z - a.z) / c.len }; };
  function place(c) {
    const p = posOf(c), off = Math.min(c.width / 4, 1.9);            // keep left: left of travel is (uz, -ux)
    c.x = p.x + p.uz * off; c.z = p.z - p.ux * off; c.yaw = Math.atan2(-p.ux, -p.uz) + Math.PI; c.ux = p.ux; c.uz = p.uz;
  }
  function nextEdge(c) {
    if (c.route) {                                                    // a resident follows their own route
      c.ri++;
      const to = c.route[c.ri + 1];
      return to === undefined ? null : adj.get(c.to).find(e => e.to === to);
    }
    const options = adj.get(c.to).filter(e => e.to !== c.from);
    if (!options.length) return adj.get(c.to)[0];                      // dead end: turn round
    // Busy roads attract through traffic: weight choices by daily volume.
    const total = options.reduce((s, e) => s + e.daily, 0); let r = rand() * total;
    for (const e of options) if ((r -= e.daily) <= 0) return e;
    return options[0];
  }
  function spawn(e, s, forward) {
    const from = forward ? e.from : e.to, to = forward ? e.to : e.from;
    const model = pickVehicle(rand), heavy = VEHICLE_MODELS[model].length > 6.5 || /tractor/.test(VEHICLE_MODELS[model].file);
    const c = { id: serial++, from, to, s, len: e.len, width: e.width, model, L: VEHICLE_MODELS[model].length, speed: SPEED * (heavy ? 0.7 : 0.85 + rand() * 0.2), v: SPEED * 0.8,
      colour: VEHICLE_MODELS[model].paint ? pickPaint(rand) : 0xffffff, ute: /truck/.test(VEHICLE_MODELS[model].file) };
    if (/tractor/.test(VEHICLE_MODELS[model].file)) { c.speed = 25 / 3.6; c.colour = rand() < 0.5 ? 0x2f6b2a : 0xb3262b; }
    // Random traffic must never materialise already inside another vehicle.
    // If an edge is full, leave capacity unmet until the next refill instead.
    place(c);
    if (cars.some(o=>vehicleFootprintsOverlap(c,o,0.5)) ||
        parked.some(o=>vehicleFootprintsOverlap(c,o,0.5))) return null;
    cars.push(c); return c;
  }
  // Expected cars on an edge right now: vehicles per hour per metre at town speed, both directions.
  const expected = (e, hour) => e.daily * HOURLY[hour] / (SPEED * 3600) * e.len;
  function populate(player, hour) {
    // Count cars per edge once (an edge is the unordered node pair).
    const onEdge = new Map(); for (const c of cars) { const k = Math.min(c.from, c.to) + ':' + Math.max(c.from, c.to); onEdge.set(k, (onEdge.get(k) || 0) + 1); }
    for (const e of edges) {
      const a = nodes[e.from], b = nodes[e.to], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
      if (Math.hypot(mx - player.x, mz - player.z) > RADIUS) continue;
      if (commute && e.daily < 7000 && !/trunk/.test(e.kind || '')) continue;     // side streets carry residents only
      const have = onEdge.get(Math.min(e.from, e.to) + ':' + Math.max(e.from, e.to)) || 0;
      let want = expected(e, hour) * (commute ? THROUGH_SHARE : 1) * (activity?.limits.share ?? 1); want = Math.floor(want) + (rand() < want % 1 ? 1 : 0);
      for (let k = have; k < want; k++) {
        if (cars.length >= (activity?.limits.movingCars ?? MAX_CARS)) break;
        const s = rand() * e.len, fwd = rand() < 0.5, p = { x: a.x + (b.x - a.x) * s / e.len, z: a.z + (b.z - a.z) * s / e.len };
        if (Math.hypot(p.x - player.x, p.z - player.z) < 40) continue;          // never pop in beside the player
        spawn(e, fwd ? s : e.len - s, fwd);
      }
    }
  }
  // Residents' cars: spawn those whose trip is under way near the player, at the point they have reached.
  const live = new Set();
  function spawnResidents(player, weekday, minute) {
    for (const t of commute.trips(weekday)) {
      if (cars.length >= (activity?.limits.movingCars ?? MAX_CARS)) break;
      if (activity && !activity.admits(t.car)) continue;
      if (minute < t.depart || minute >= t.depart + t.duration || live.has(t.id)) continue;
      let s = (minute - t.depart) * 60 * (50 / 3.6), i = 0;
      while (i < t.path.length - 2) { const a = nodes[t.path[i]], b = nodes[t.path[i + 1]], L = Math.hypot(b.x - a.x, b.z - a.z); if (s < L) break; s -= L; i++; }
      const a = nodes[t.path[i]], b = nodes[t.path[i + 1]]; if (!b) continue;
      if (Math.hypot((a.x + b.x) / 2 - player.x, (a.z + b.z) / 2 - player.z) > RADIUS) continue;
      const e = adj.get(t.path[i]).find(x => x.to === t.path[i + 1]); if (!e) continue;
      const car = commute.population.cars[+t.car.slice(4)], driver = t.person ? commute.population.people[+t.person.slice(3)] : { name: t.driverName };
      const c = { id: serial++, trip: t.id, route: t.path, ri: i, from: t.path[i], to: t.path[i + 1], s: Math.min(s, e.len), len: e.len, width: e.width, model: car.model, L: car.length,
        speed: SPEED * 0.95, v: SPEED * 0.8, colour: car.colour, ute: /truck/.test(VEHICLE_MODELS[car.model].file), carId: car.id, driver: driver.name, passengers: (t.passengers || []).map(k => commute.population.people[+k.slice(3)].first), purpose: t.purpose, destination: t.to === 'home' ? 'home (' + (commute.population.households[+car.household?.slice(3)]?.street || 'out of town') + ')' : t.to === 'coles' ? 'Coles' : t.to === 'repotown' ? (driver.repoTownJob?.name || 'work') + ', Repository Town' : AWAY_WORK.some(a => a.id === t.to) ? 'work: ' + AWAY_WORK.find(a => a.id === t.to).name : commute.population.workplaces.find(w => w.id === t.to)?.name || t.to };
      if (Math.hypot(nodes[c.from].x - player.x, nodes[c.from].z - player.z) < 40 && c.s < 5) continue;   // don't pop in beside the player
      place(c);
      if (cars.some(o=>vehicleFootprintsOverlap(c,o,0.5)) ||
          parked.some(o=>vehicleFootprintsOverlap(c,o,0.5))) continue;
      live.add(t.id); cars.push(c);
    }
  }
  // Collision of actual oriented vehicle footprints, not a centre-distance proxy.
  // A 4.5 m car can overlap another even when their centres are 3 m apart.
  function parkedFootprintsOverlap(a, b) {
    const dir = c => [Math.sin(c.yaw), Math.cos(c.yaw)];
    const ua = dir(a), ub = dir(b);
    const axes = [ua, [-ua[1], ua[0]], ub, [-ub[1], ub[0]]];
    const radius = (c, axis) => {
      const u = dir(c), v = [-u[1], u[0]];
      return (c.L || 4.4) * 0.5 * Math.abs(axis[0] * u[0] + axis[1] * u[1]) +
        0.95 * Math.abs(axis[0] * v[0] + axis[1] * v[1]);
    };
    return axes.every(axis => Math.abs((a.x - b.x) * axis[0] + (a.z - b.z) * axis[1]) <
      radius(a, axis) + radius(b, axis) + 0.1);
  }
  // Parked residents' cars within 300 m: at home in the driveway, or at work, school or Coles.
  function parkResidents(player, weekday, minute) {
    const pop = commute.population, out = [], bays = new Map(), taken = [];
    // Homes are fixed, so reserve their real driveway footprints before fitting kerbside bays.
    const parkedCars = pop.cars.map(car => ({ car, st: commute.carState(car.id, weekday, minute) }))
      .filter(p => p.st.parked);
    parkedCars.sort((a, b) => Number(b.st.parked === 'home') - Number(a.st.parked === 'home'));
    for (const { car, st } of parkedCars) {
      if (out.length >= (activity?.limits.parkedCars ?? Infinity)) break;
      if (activity && !activity.admits(car.id)) continue;
      // Only allocate nearby resident parking meshes; scanning all out-of-range
      // vehicle routes every few seconds is expensive on low-end phones.
      const destination = st.parked === 'home'
        ? pop.homes[+car.home.slice(5)]
        : nodes[st.trip?.path?.at(-1)];
      if (!destination || Math.hypot(destination.x - player.x, destination.z - player.z) > 330) continue;
      let x, z, yaw = 0;
      if (st.parked === 'home') {
        // On the driveway: 7.[address redacted] centreline (past the verge), side by side, nose to the street.
        const h = pop.homes[+car.home.slice(5)], k = h.kerb, D = Math.hypot(h.x - k.x, h.z - k.z) || 1, dx = (h.x - k.x) / D, dz = (h.z - k.z) / D;
        const n = pop.households[+car.household.slice(3)].cars.indexOf(car.id), into = Math.min(7.5, D - h.d / 2 - 1) + Math.floor(n / 2) * 5.5, side = (n % 2 - 0.5) * 2.9;
        x = k.x + dx * into - dz * side; z = k.z + dz * into + dx * side; yaw = Math.atan2(-dx, -dz);
      }
      else {
        // Kerbside on the street they arrived by: each car takes the next free 6.5 m bay back from the
        // destination, continuing round corners along its route, so parked cars never overlap.
        const P = st.trip.path, endNode = P[P.length - 1];
        let placed = false;
        for (let tries = 0; tries < 96; tries++) {
          const bay = bays.get(endNode) || 0; bays.set(endNode, bay + 1);
          let back = 4 + bay * 6.5, i = P.length - 1;
          while (i > 1) {
            const a = nodes[P[i - 1]], b = nodes[P[i]], L = Math.hypot(b.x - a.x, b.z - a.z);
            if (back <= L - 1) break;
            back -= L; i--;
          }
          const b = nodes[P[i]], a = nodes[P[i - 1]];
          if (!a || !b) break;
          const L = Math.hypot(b.x - a.x, b.z - a.z);
          if (L < 2 || back < 1 || back > L - 1) continue;
          const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L;
          // A true full-width vehicle needs a bay BEYOND both carriageway and
          // footpath (pedestrian centre = road half-width + 1.6 m), not its
          // centre on the white road-edge line.
          const e = adj.get(P[i - 1])?.find(q => q.to === P[i]), off = (e?.width || 7) / 2 + 3.6;
          x = b.x - ux * back + uz * off; z = b.z - uz * back - ux * off; yaw = Math.atan2(ux, uz);
          if (!taken.some(q => parkedFootprintsOverlap(q, { x, z, yaw, L: car.length })) &&
              !cars.some(q => vehicleFootprintsOverlap(q,{x,z,yaw,L:car.length},0.35)) &&
              parkingClear({x,z,yaw,L:car.length})) {
            placed = true; break;
          }
        }
        // If there is no genuine free bay on the route, do not render two cars in one space.
        if (!placed) continue;
      }
      if (Math.hypot(x - player.x, z - player.z) > 300) continue;
      if (st.parked==='home' && (cars.some(q=>vehicleFootprintsOverlap(q,{x,z,yaw,L:car.length},0.35)) ||
          taken.some(q=>parkedFootprintsOverlap(q,{x,z,yaw,L:car.length})) ||
          !parkingClear({x,z,yaw,L:car.length})))continue;
      taken.push({ x, z, yaw, L: car.length });
      out.push({ x, z, yaw, model: car.model, colour: car.colour, L: car.length, ux: Math.sin(yaw), uz: Math.cos(yaw), parked: true, carId: car.id });
    }
    parked = out;
  }
  let filled = false, refill = 0, refillParked = 0;
  let lastDay = null, lastMinute = null, lastWeekday = null;
  // A trip ID is unique within a simulated day, not for the resident's entire lifetime.
  // On a new day (including the same weekday next week), allow that vehicle to travel
  // again. Discard only the previous day's resident trips, keeping through traffic.
  function update(dt, player, minute, weekday = 2, day = null) {
    if (!player) return;
    const now = (minute ?? 600) % 1440, hour = Math.floor(now / 60);
    const dateChanged = day != null && lastDay != null && day !== lastDay;
    const weekChanged = lastWeekday != null && weekday !== lastWeekday;
    const clockRewound = lastMinute != null && now + 0.5 < lastMinute;
    if (commute && (dateChanged || weekChanged || clockRewound)) {
      live.clear();
      for (let i = cars.length - 1; i >= 0; i--) if (cars[i].trip) cars.splice(i, 1);
      // Parked vehicles belong to the prior day too. Clear their old snapshots
      // before generating this morning's journeys, then replenish after spawn.
      parked = [];
      refillParked = 0;
    }
    if (day != null) lastDay = day;
    lastWeekday = weekday; lastMinute = now;
    if (!filled || (refill -= dt) <= 0) { populate(player, hour); filled = true; refill = 4; }
    if (commute) { spawnResidents(player, weekday, now); if ((refillParked -= dt) <= 0) { parkResidents(player, weekday, now); refillParked = 3; } }
    // Spatial buckets (20 m) so each car only checks its neighbours for the car ahead.
    const grid = new Map();
    for (const c of cars) for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) { const k = (Math.floor(c.x / 20) + dx) + ',' + (Math.floor(c.z / 20) + dz); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(c); }
    // Mutable actors stay in the grid by reference; compare the whole oriented
    // body, not just the bumper point. Nearby parked cars use the same buckets.
    const parkedGrid=new Map();
    for(const c of parked)for(const dx of [-1,0,1])for(const dz of [-1,0,1]){
      const k=(Math.floor(c.x/20)+dx)+','+(Math.floor(c.z/20)+dz);
      if(!parkedGrid.has(k))parkedGrid.set(k,[]);
      parkedGrid.get(k).push(c);
    }
    function occupied(candidate,before) {
      const key=Math.floor(candidate.x/20)+','+Math.floor(candidate.z/20);
      for(const actor of [...(grid.get(key)||[]),...(parkedGrid.get(key)||[])]){
        if(actor===candidate)continue;
        const reach=(candidate.L+actor.L)/2+3;
        if(Math.abs(candidate.x-actor.x)>reach||Math.abs(candidate.z-actor.z)>reach)continue;
        if(!vehicleFootprintsOverlap(candidate,actor,0.25))continue;
        // A preexisting overlap can escape only by increasing centre separation.
        if(before&&vehicleFootprintsOverlap(before,actor,0.25)&&
           carIncreasingSeparation(before,candidate,actor))continue;
        return true;
      }
      return false;
    }
    // When one car moves into a different bucket, keep the neighbours' lookup
    // current for later cars in this frame; Map sets avoid repeated references.
    function register(c){
      for(const dx of [-1,0,1])for(const dz of [-1,0,1]){
        const key=(Math.floor(c.x/20)+dx)+','+(Math.floor(c.z/20)+dz);
        if(!grid.has(key))grid.set(key,[]);
        if(!grid.get(key).includes(c))grid.get(key).push(c);
      }
    }
    for (let i = cars.length - 1; i >= 0; i--) {
      const c = cars[i];
      if (Math.hypot(c.x - player.x, c.z - player.z) > RADIUS + 100) { cars.splice(i, 1); continue; }
      // Stop for the player, the car ahead in the same direction, or a closed level crossing just ahead.
      const reach = c.L / 2 + 4.5, ax = c.x + c.ux * reach, az = c.z + c.uz * reach;
      const ahead = Math.hypot(player.x - ax, player.z - az) < 5 || (grid.get(Math.floor(ax / 20) + ',' + Math.floor(az / 20)) || []).some(o => o !== c && (o.ux * c.ux + o.uz * c.uz) > 0.7 && Math.hypot(o.x - ax, o.z - az) < o.L / 2 + 1.5) || blocked(ax, az);
      const remaining = c.len - c.s, turnSlow = remaining < 15 ? 0.55 : 1;
      const target = ahead ? 0 : c.speed * turnSlow;
      const stepTime=Math.max(0,Math.min(dt,0.25));
      c.v += Math.max(-6 * stepTime, Math.min(2 * stepTime, target - c.v));
      // Substeps avoid a fast crossing car tunnelling through a stationary or
      // moving body. Restore road segment and route index if the next step is occupied.
      const travel=Math.max(0,c.v*stepTime);
      const steps=Math.max(1,Math.ceil(travel/0.65));
      let arrived=false;
      c.braking=!!ahead;
      for(let step=0;step<steps;step++){
        const before={x:c.x,z:c.z,yaw:c.yaw,L:c.L,widthM:c.widthM??1.9};
        const snapshot={s:c.s,from:c.from,to:c.to,len:c.len,width:c.width,ri:c.ri};
        c.s+=travel/steps;
        while(c.s>c.len){
          const e=nextEdge(c);
          if(!e){arrived=true;break;}
          c.s-=c.len;c.from=c.to;c.to=e.to;c.len=e.len;c.width=e.width;
        }
        if(arrived)break;
        place(c);
        if(occupied(c,before)){
          Object.assign(c,snapshot);
          place(c);
          c.v=0;c.braking=true;
          break;
        }
      }
      if(arrived){cars.splice(i,1);continue;}                 // parked version takes over at destination
      register(c);
    }
    draw();
  }
  // Solid boxes for vehicles near the player, so the player's car and the player can't drive through them.
  const colliders = (player) => cars.concat(parked).filter(c => Math.hypot(c.x - player.x, c.z - player.z) < 60).map(c => {
    const hl = c.L / 2, hw = 0.95, ux = c.ux ?? Math.sin(c.yaw), uz = c.uz ?? Math.cos(c.yaw);
    const poly = [[hl, hw], [-hl, hw], [-hl, -hw], [hl, -hw]].map(([a, b]) => [c.x + ux * a - uz * b, c.z + uz * a + ux * b]);
    const xs = poly.map(p => p[0]), zs = poly.map(p => p[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), poly, traffic: true };
  });
  return { update, colliders, get count() { return cars.length; }, get modelsLoaded() { return !!real; }, get parked() { return parked; }, cars, expected, edges, commute, graph };
}
