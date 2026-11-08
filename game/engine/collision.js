// Static axis-aligned collision for a flat world. Colliders are {x0,x1,z0,z1}
// rectangles; the player is a circle. A uniform grid keeps lookups cheap with
// thousands of colliders (188 houses plus yard props).
const CELL = 8;

// A collider may carry poly: its true outline [[x,z],...]. The box is the quick first test; the outline
// is exact, so a rotated building blocks only where its walls really are.
export function circleTouchesPoly(poly, x, z, r) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[j], [bx, bz] = poly[i];
    if ((bz > z) !== (az > z) && x < ((ax - bx) * (z - bz)) / (az - bz) + bx) inside = !inside;
    const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l));
    if ((x - ax - t * dx) ** 2 + (z - az - t * dz) ** 2 < r * r) return true;
  }
  return inside;
}

export class CollisionWorld {
  constructor(colliders = []) {
    this.grid = new Map();
    this.all = [];
    for (const c of colliders) this.add(c);
  }

  add(c) {
    this.all.push(c);
    for (let gx = Math.floor(c.x0 / CELL); gx <= Math.floor(c.x1 / CELL); gx++) {
      for (let gz = Math.floor(c.z0 / CELL); gz <= Math.floor(c.z1 / CELL); gz++) {
        const k = gx + ',' + gz;
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k).push(c);
      }
    }
  }

  near(x, z, r) {
    const out = new Set();
    for (let gx = Math.floor((x - r) / CELL); gx <= Math.floor((x + r) / CELL); gx++) {
      for (let gz = Math.floor((z - r) / CELL); gz <= Math.floor((z + r) / CELL); gz++) {
        const list = this.grid.get(gx + ',' + gz);
        if (list) for (const c of list) out.add(c);
      }
    }
    return out;
  }

  // feet: the body's height above the floor. A collider with a known top (furniture, a roof) no
  // longer blocks once the feet are at or above it, so the player can jump onto it and walk across.
  // Colliders without a top (walls, the world edge) block at any height.
  hits(x, z, r, feet = 0) {
    // Dynamic AABBs (e.g. moving trucks) are queried live, not permanently
    // inserted into the static spatial index where they would leave ghosts.
    const moving = typeof this.dynamic === 'function' ? this.dynamic() : [];
    for (const c of [...this.near(x,z,r), ...moving]) {
      if (c.top != null && feet >= c.top - 0.02) continue;
      const cx = Math.max(c.x0, Math.min(x, c.x1)), cz = Math.max(c.z0, Math.min(z, c.z1));
      if ((x - cx) ** 2 + (z - cz) ** 2 < r * r && (!c.poly || circleTouchesPoly(c.poly, x, z, r))) return c;
    }
    return null;
  }

  // Moves axis by axis so the player slides along walls instead of sticking.
  // Steps are subdivided so a fast run can never tunnel through a 0.4 m wall.
  move(pos, dx, dz, r, feet = 0) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / (r * 0.5)));
    const sx = dx / steps, sz = dz / steps;
    let blocked = false;
    // Already overlapping something (a truck rolled up, or an exit point under a vehicle's box):
    // allow steps that take the player away from it, so nobody is ever pinned in place.
    const gap = (c, x, z) => (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1)
      ? -Math.min(x - c.x0, c.x1 - x, z - c.z0, c.z1 - z)          // inside the box: negative depth
      : Math.hypot(x - Math.max(c.x0, Math.min(x, c.x1)), z - Math.max(c.z0, Math.min(z, c.z1)));
    const free = (x, z) => {
      const h = this.hits(x, z, r, feet);
      if (!h) return true;
      const here = this.hits(pos.x, pos.z, r, feet);
      return !!here && here.x0 === h.x0 && here.x1 === h.x1 && here.z0 === h.z0 && here.z1 === h.z1 && gap(h, x, z) > gap(h, pos.x, pos.z) + 1e-6;
    };
    for (let i = 0; i < steps; i++) {
      if (free(pos.x + sx, pos.z)) pos.x += sx; else blocked = true;
      if (free(pos.x, pos.z + sz)) pos.z += sz; else blocked = true;
    }
    return blocked;
  }

  // The highest top the body stands on at (x, z), at or below the feet: the floor is 0.
  groundAt(x, z, r, feet = 0) {
    let floor = 0;
    for (const c of this.near(x, z, r)) {
      if (c.top == null || c.top > feet + 0.05) continue;
      const cx = Math.max(c.x0, Math.min(x, c.x1)), cz = Math.max(c.z0, Math.min(z, c.z1));
      if ((x - cx) ** 2 + (z - cz) ** 2 < (r * 0.6) ** 2 &&
          (!c.poly || circleTouchesPoly(c.poly, x, z, r * 0.6)) && c.top > floor) floor = c.top;
    }
    return floor;
  }
}
