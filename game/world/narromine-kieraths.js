// Live Three.js geometry for Kierath's Shopping Square. The route is OPEN AIR:
// no solid box spans the courtyard. seven traced exterior bays (1–4, 8–10) frame it, with a separate
// round kiosk and a genuinely open arched rear canopy (rather than a blocked shed).
import * as THREE from 'three';
import { geoToWorld, DETAILED } from './narromine-layout.js';
import { siteToGeo, KIERATHS_ROUTE, KIERATHS_SHOPS, KIERATHS_KIOSK,
  KIERATHS_CANOPY, KIERATHS_REAR_PARKING, KIERATHS_COURTYARD, KIERATHS_UNIT_IDS } from './narromine-kieraths-data.js';

const world = p => geoToWorld(...siteToGeo(p));
const V = p => { const [x, z] = world(p); return new THREE.Vector3(x, 0, z); };
const BRICK = 0x995741, ROOF = 0x929ba0, FASCIA = 0xe2e1dc;
const FRAME = 0x58636a, GLASS = 0x354e5d, STEEL = 0x687579;

export function buildKieraths({ box, push, strip, flatPoly, plane, boardTexture, colliders, spots }) {
  const line = (colour, a, b, width = 0.1) => {
    const v0 = V(a), v1 = V(b), dx = v1.x - v0.x, dz = v1.z - v0.z;
    strip(colour, v0.x, v0.z, v1.x, v1.z, width, 0.14, 0.04);
    return { dx, dz };
  };
  const place = (colour, w, h, d, p, y, ry = 0) => {
    const [x, z] = world(p); box(colour, w, h, d, x, y, z, ry);
  };
  const beam = (colour, from, to, radius = 0.055) => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const v = b.clone().sub(a), length = v.length();
    if (length < 0.005) return;
    const g = new THREE.CylinderGeometry(radius, radius, length, 6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()));
    g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    push(colour, g);
  };
  const wp = (p, y) => { const [x, z] = world(p); return [x, y, z]; };

  // The aerial-traced 76 Dandaloo parcel is a built shopping-centre precinct,
  // not lawns between shops. One flush base-paving polygon prevents exposed green
  // triangles wherever the irregular arcade footprints turn or recede. Keep the
  // later asphalt parking surface slightly above it and open passages collision-free.
  const shoppingSite = DETAILED.find(b => b.id === 'dandaloo-76');
  if (shoppingSite) flatPoly(0xbca28e, shoppingSite.boundary, 0.074);

  // Rear parking forecourt, not an extra arbitrary shopping-centre footprint.
  flatPoly(0x616366, KIERATHS_REAR_PARKING.map(world), 0.083);
  for (let k = 0; k < 3; k++) {
    const x = -57 + k * 4.5;
    line(0xd5d2c8, [x, -40.4], [x + 1.2, -34.0], 0.13);
  }

  // Plan-fit OPEN courtyard, beside the genuinely narrow/recessed walk-through.
  // Brick-red paving with flush joints; no floor or collider across any doorway.
  flatPoly(0xbca28e, KIERATHS_COURTYARD.map(world), 0.088);
  for (let i = 1; i < KIERATHS_ROUTE.length; i++) {
    const a = world(KIERATHS_ROUTE[i - 1]), b = world(KIERATHS_ROUTE[i]);
    strip(0xbca28e, ...a, ...b, i < 5 ? 2.45 : 3.65, 0.092, 0.05);
    // Paver joint: unlike the former single centre stripe these cross the path.
    const start = KIERATHS_ROUTE[i - 1], finish = KIERATHS_ROUTE[i];
    const dx = finish[0] - start[0], dz = finish[1] - start[1], length = Math.hypot(dx, dz);
    for (let at = 0.65; at < length; at += 0.67) {
      const p = [start[0] + at * dx / length, start[1] + at * dz / length];
      const nx = -dz / length, nz = dx / length, half = i < 5 ? 1.16 : 1.72;
      const left = world([p[0] - nx * half, p[1] - nz * half]);
      const right = world([p[0] + nx * half, p[1] + nz * half]);
      strip(0x9e8777, ...left, ...right, 0.018, 0.113, 0.003);
    }
  }

  // Seven *physical* small shop structures match the diagram, not ten identical
  // freestanding cuboids. Plan labels 5–7 fall within the blue Coles/M01 tenancy
  // and are not invented as duplicate external buildings.
  // Exact frontage positions are provisional until aerial photo tie-points exist.
  const frontEdges = { 1: 1, 2: 2, 3: 5, 4: 4, 8: 3, 9: 3, 10: 3 };
  for (const bay of KIERATHS_SHOPS) {
    const footprint = bay.pts.map(world);
    const shape = new THREE.Shape(footprint.map(([x,z]) => new THREE.Vector2(x, -z)));
    const wallHeight = bay.number === 10 ? 3.65 : 3.46;
    const mass = new THREE.ExtrudeGeometry(shape, { depth: wallHeight, bevelEnabled: false });
    mass.rotateX(-Math.PI / 2); push(BRICK, mass);
    // Polygon roof follows each angled footprint; no over-wide rectangular mass.
    const roof = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false });
    roof.rotateX(-Math.PI / 2); roof.translate(0, wallHeight + 0.02, 0);
    push(ROOF, roof);
    const edge = frontEdges[bay.number];
    const a = bay.pts[edge], b = bay.pts[(edge + 1) % bay.pts.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    if (len < 0.9) continue;
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const nearest = KIERATHS_ROUTE.reduce((best, p) => {
      const distance = Math.hypot(p[0]-mid[0],p[1]-mid[1]);
      return distance < best.distance ? { p, distance } : best;
    }, { p: KIERATHS_ROUTE[0], distance: Infinity }).p;
    const sign = ((nearest[0]-mid[0]) * -dz + (nearest[1]-mid[1]) * dx) >= 0 ? 1 : -1;
    const normal = [-dz / len * sign, dx / len * sign];
    const outward = (distance) => [mid[0] + normal[0] * distance, mid[1] + normal[1] * distance];
    const yaw = -Math.atan2(dz, dx);
    // Photo: silver/grey fascia, glazed display, dark narrow mullions, brick piers.
    const facadeH = Math.min(1.82, wallHeight - 1.18);
    place(GLASS, len - 0.3, facadeH, 0.07, outward(0.09), 1.84, yaw);
    const panes = Math.max(2, Math.round(len / 1.1));
    for (let n = 0; n <= panes; n++) {
      const t = n / panes;
      const pos = [a[0] + dx*t + normal[0]*0.16, a[1] + dz*t + normal[1]*0.16];
      place(FRAME, 0.06, facadeH + 0.1, 0.09, pos, 1.84, yaw);
    }
    place(FRAME, len-0.28, 0.06, 0.1, outward(0.15), 2.77, yaw);
    place(FASCIA, len+0.15, 0.42, 0.16, outward(0.16), wallHeight - 0.38, yaw);
    // The visible grey awnings project out over the walkway but have no roof
    // collisions; narrow steel supports are placed only at their end points.
    place(ROOF, len+0.20, 0.105, 1.26, outward(0.70), 3.02, yaw);
    for (const t of [0.06, 0.94]) {
      const p = [a[0] + dx*t + normal[0]*1.24, a[1] + dz*t + normal[1]*1.24];
      // Narrow historic arcade passages must stay traversable. The unit 2
      // corner post would otherwise sit 0.29m from the route centreline.
      const edgeDistance = (v, a, b) => {
        const ddx = b[0]-a[0], ddz = b[1]-a[1], len2 = ddx*ddx+ddz*ddz || 1;
        const u = Math.max(0, Math.min(1, ((v[0]-a[0])*ddx+(v[1]-a[1])*ddz)/len2));
        return Math.hypot(v[0]-a[0]-u*ddx,v[1]-a[1]-u*ddz);
      };
      const routeDistance = Math.min(...KIERATHS_ROUTE.slice(1).map((q,i) =>
        edgeDistance(p, KIERATHS_ROUTE[i], q)));
      if (routeDistance < 1.1) continue; // cantilever from wall; no obstruction
      place(STEEL, 0.085, 2.94, 0.085, p, 1.48);
      const [x,z] = world(p);
      colliders.push({ x0:x-0.09, x1:x+0.09, z0:z-0.09, z1:z+0.09 });
    }
    // Thin wall-segment colliders follow the real polygon edges without
    // blocking the courtyard with the shop's bounding rectangle.
    for (let k = 0; k < bay.pts.length; k++) {
      const p = world(bay.pts[k]), q = world(bay.pts[(k+1)%bay.pts.length]);
      const count = Math.max(1, Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1]) / 0.65));
      for (let j = 0; j < count; j++) {
        const t0 = j/count, t1 = (j+1)/count;
        const x0 = p[0]+(q[0]-p[0])*t0, x1 = p[0]+(q[0]-p[0])*t1;
        const z0 = p[1]+(q[1]-p[1])*t0, z1 = p[1]+(q[1]-p[1])*t1;
        colliders.push({ x0:Math.min(x0,x1)-0.12, x1:Math.max(x0,x1)+0.12,
          z0:Math.min(z0,z1)-0.12, z1:Math.max(z0,z1)+0.12 });
      }
    }
  }

  // Round front kiosk. Only the kiosk itself collides; the forecourt remains walkable.
  const kiosk = KIERATHS_KIOSK, [kx, kz] = world(kiosk.at);
  const base = new THREE.CylinderGeometry(kiosk.radius, kiosk.radius, kiosk.height, 18);
  base.translate(kx, kiosk.height / 2, kz); push(0xb7a99a, base);
  const glazing = new THREE.CylinderGeometry(kiosk.radius + 0.025, kiosk.radius + 0.025, 1.4, 18);
  glazing.translate(kx, 1.72, kz); push(GLASS, glazing);
  const cap = new THREE.CylinderGeometry(kiosk.radius + 0.28, kiosk.radius + 0.25, 0.18, 20);
  cap.translate(kx, kiosk.height + 0.05, kz); push(FASCIA, cap);
  for (let i = 0; i < 12; i++) {
    const t = i / 12 * Math.PI * 2;
    place(FRAME, 0.075, 1.45, 0.075, [kiosk.at[0] + Math.cos(t) * kiosk.radius, kiosk.at[1] + Math.sin(t) * kiosk.radius], 1.72);
  }
  colliders.push({ x0: kx - kiosk.radius, x1: kx + kiosk.radius, z0: kz - kiosk.radius, z1: kz + kiosk.radius });

  // Real arched ENTRANCE shelter: a thin curved metal skin above an open walkway.
  // Long axis follows the diagonal rear-passage route, not the map's x/y axes.
  const canopy = KIERATHS_CANOPY, p = canopy.back, q = canopy.front;
  const dx = q[0] - p[0], dz = q[1] - p[1], length = Math.hypot(dx, dz);
  const nx = -dz / length, nz = dx / length;
  const at = (t, cross) => [p[0] + dx * t + nx * cross, p[1] + dz * t + nz * cross];
  const archY = cross => canopy.eaves + (canopy.crown - canopy.eaves) * (1 - Math.pow(2 * cross / canopy.width, 2));
  const mesh = [];
  const widthSteps = 16;
  for (let j = 0; j < widthSteps; j++) {
    const c0 = (j / widthSteps - 0.5) * canopy.width, c1 = ((j + 1) / widthSteps - 0.5) * canopy.width;
    const a = wp(at(0, c0), archY(c0)), b = wp(at(1, c0), archY(c0));
    const c = wp(at(1, c1), archY(c1)), d = wp(at(0, c1), archY(c1));
    mesh.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  const shell = new THREE.BufferGeometry();
  shell.setAttribute('position', new THREE.Float32BufferAttribute(mesh, 3));
  shell.computeVertexNormals(); push(0xc2c9c9, shell);
  for (const t of [0, 0.5, 1]) {
    for (let i = 0; i < widthSteps; i++) {
      const c0 = (i / widthSteps - 0.5) * canopy.width, c1 = ((i + 1) / widthSteps - 0.5) * canopy.width;
      beam(STEEL, wp(at(t, c0), archY(c0) - 0.09), wp(at(t, c1), archY(c1) - 0.09), 0.065);
    }
    for (const edge of [-canopy.width / 2, canopy.width / 2]) {
      const foot = at(t, edge), [x, z] = world(foot);
      beam(STEEL, [x, 0.1, z], [x, canopy.eaves, z], 0.092);
      if (t !== 0.5) colliders.push({ x0: x - 0.12, x1: x + 0.12, z0: z - 0.12, z1: z + 0.12 });
    }
  }
  for (const edge of [-canopy.width / 2, canopy.width / 2])
    beam(STEEL, wp(at(0, edge), canopy.eaves), wp(at(1, edge), canopy.eaves), 0.07);
  if (typeof document !== 'undefined') {
    const tex = boardTexture(["KIERATH'S", "SHOPPING SQUARE"], { bg: '#eeeeea', fg: '#234d40', border: '#eeeeea', w: 600, h: 230 });
    const [x, z] = world(at(0, 0));
    // Rear-facing sign, visible on foot from the rear car park.
    plane(tex, 3.75, 1.42, x - 0.25, 4.22, z - 0.04, -Math.PI / 2 + Math.atan2(dz, dx));
  }

  // Historic photograph: a small grey roller shutter with a red-and-yellow
  // Liquorland band immediately to the RIGHT of the rear canopy. Its business
  // sign is a dated visual reference, NOT a statement about current occupancy.
  // Placed outside the arch's pedestrian opening and inside the traced parcel.
  const shutter = [canopy.back[0] + 4.0, canopy.back[1] - 6.8], rearYaw = -Math.PI / 2;
  place(0xb0b1ae, 4.55, 4.15, 0.21, shutter, 2.07, rearYaw);
  place(0x88949a, 3.47, 2.72, 0.26, [shutter[0]-0.13, shutter[1]], 1.57, rearYaw);
  for (let k = 0; k < 14; k++)
    place(k % 2 ? 0x6c7b83 : 0xc0c6c5, 3.39, 0.028, 0.03,
      [shutter[0]-0.29, shutter[1]], 0.31 + 0.19 * k, rearYaw);
  for (const z of [shutter[1]-1.83, shutter[1]+1.83])
    place(0x8a8c89, 0.2, 2.9, 0.18, [shutter[0]-0.29, z], 1.52, rearYaw);
  if (typeof document !== 'undefined') {
    const historicalSign = boardTexture(['LIQUORLAND'], {
      bg: '#b02525', fg: '#ffdd54', border: '#d9c14a', w: 768, h: 170
    });
    const [x,z] = world([shutter[0]-0.31, shutter[1]]);
    plane(historicalSign, 3.83, 0.76, x, 3.55, z, -Math.PI / 2);
  }
  // The rear shutter is a wall, not a walk-through doorway. Keep its thin
  // collision rectangle separate from the nearby open arch.
  const [shx, shz] = world(shutter);
  colliders.push({ x0: shx - 0.16, x1: shx + 0.16,
    z0: shz - 2.3, z1: shz + 2.3 });

  // The rear-facing white Coles gable sign and metal plant visible in historic photos.
  if (typeof document !== 'undefined') {
    const tex = boardTexture(['coles'], { bg: '#f7f7f7', fg: '#cf1836', border: '#f7f7f7', w: 512, h: 180 });
    const [x, z] = world([-45, 7.4]);
    plane(tex, 5.4, 1.65, x - 0.2, 7.85, z, -Math.PI / 2);
  }
  for (const [sx, sz, w, d] of [[-32, 3, 4.5, 2.8], [-26, 4.5, 3.1, 3.2], [-19, 8, 2.5, 2.1]]) {
    place(0x9bacae, w, 1.0, d, [sx, sz], 8.65);
    place(0x5c6971, w - 0.35, 0.08, d - 0.35, [sx, sz], 9.18);
  }

  const [sx, sz] = world([-14, -27.4]);
  spots.push({ key: 'narromine:kieraths-shopping-square', label: "Kierath's Shopping Square",
    pos: new THREE.Vector3(sx, 0, sz), text: "Kierath's Shopping Square · Historic open-air arcade beside Coles; ten numbered plan areas (seven distinct exterior units), a round front kiosk and the arched rear-car-park entrance. Shop occupancies and exact dimensions not verified." });
}
