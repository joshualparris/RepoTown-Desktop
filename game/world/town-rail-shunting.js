// Fictional Repository Town yard: independently testable low-speed shunting.
// No railway-safety certification or representation of actual Narromine infrastructure.
// Never connects to the timetable-controlled main line or its six road crossings.
export const TOWN_YARD = Object.freeze({
  z: -209, west: 82, east: 170, depotX: 117,
  locoLength: 13, wagonLength: 9, gap: 0.8,
  limitKmh: 8, acceleration: 0.42, serviceBrake: 0.95, resistance: 0.12
});
const L = TOWN_YARD.locoLength / 2, W = TOWN_YARD.wagonLength / 2;
const OFFSET = L + TOWN_YARD.gap + W;
const STEP = TOWN_YARD.wagonLength + TOWN_YARD.gap;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const finite = v => typeof v === 'number' && Number.isFinite(v);
const acceptable = (v, lo, hi) => finite(v) && v >= lo && v <= hi;

// Persistent state contains only fictional yard coordinates and cargo quantities.
// It is deliberately separate from TownLife's versioned save schema.
export class TownRailShunting {
  constructor(saved = null) {
    this.x = 103; this.speed = 0; this.coupled = 0;
    this.wagons = [{ id: 'RT-Y-01', x: 144, load: 0, staged: false },
      { id: 'RT-Y-02', x: 155, load: 0, staged: false }];
    this.message = '';
    if (saved?.schema === 1 &&
        acceptable(saved.x, TOWN_YARD.west + L, TOWN_YARD.east - L) &&
        Number.isInteger(saved.coupled) && saved.coupled >= 0 && saved.coupled <= 2 &&
        Array.isArray(saved.wagons) && saved.wagons.length === 2 &&
        saved.wagons.every(w => acceptable(w.x, TOWN_YARD.west + W, TOWN_YARD.east - W) &&
          Number.isInteger(w.load) && w.load >= 0 && w.load <= 4 &&
          typeof w.staged === 'boolean')) {
      this.x = saved.x; this.coupled = saved.coupled;
      this.wagons.forEach((w, i) => { w.x = saved.wagons[i].x; w.load = saved.wagons[i].load; w.staged = saved.wagons[i].staged; });
      if (this.carX(this.coupled - 1) + W > TOWN_YARD.east) this.coupled = 0;
    }
  }
  carX(i) {
    if (i < 0 || i >= this.wagons.length) return null;
    return i < this.coupled ? this.x + OFFSET + i * STEP : this.wagons[i].x;
  }
  carPositions() { return this.wagons.map((w, i) => ({ ...w, x: this.carX(i), coupled: i < this.coupled })); }
  get speedKmh() { return Math.round(this.speed * 3.6 * 10) / 10; }
  get stopped() { return Math.abs(this.speed) < 0.08; }
  snapshot() {
    return { schema: 1, x: +this.x.toFixed(3), coupled: this.coupled,
      wagons: this.carPositions().map(w => ({ x: +w.x.toFixed(3), load: w.load, staged: w.staged })) };
  }
  status() {
    return { x: this.x, z: TOWN_YARD.z, speedKmh: this.speedKmh, limitKmh: TOWN_YARD.limitKmh,
      coupled: this.coupled, wagons: this.carPositions(), message: this.message };
  }
  // W and S select traction direction. Opposing traction applies a service
  // brake first; release coasts down. This deliberately has no instant reversal.
  advance(dt, command = 0, brake = false) {
    if (!finite(dt) || dt <= 0) return;
    dt = Math.min(dt, 0.25);
    command = clamp(finite(command) ? command : 0, -1, 1);
    let v = this.speed;
    const decel = (amount) => Math.abs(v) <= amount ? 0 : v - Math.sign(v) * amount;
    if (brake) v = decel(TOWN_YARD.serviceBrake * dt);
    else if (Math.abs(command) < 0.04) v = decel(TOWN_YARD.resistance * dt);
    else if (v && Math.sign(v) !== Math.sign(command)) v = decel(TOWN_YARD.serviceBrake * Math.abs(command) * dt);
    else v += command * TOWN_YARD.acceleration * dt;
    const max = TOWN_YARD.limitKmh / 3.6;
    v = clamp(v, -max, max);
    const westLimit = TOWN_YARD.west + L + 0.3;
    const endOffset = this.coupled ? OFFSET + (this.coupled - 1) * STEP + W : L;
    const eastLimit = TOWN_YARD.east - endOffset - 0.3;
    let nextX = clamp(this.x + v * dt, westLimit, eastLimit);
    // A detached wagon is a solid obstruction, not a ghost object. Approach
    // gently, stop short of its couplers, then use the coupling action.
    const nextWagon = this.wagons[this.coupled];
    if (nextWagon && v > 0) {
      const leadOffset = this.coupled ? OFFSET + (this.coupled - 1) * STEP + W : L;
      const stopAt = nextWagon.x - W - TOWN_YARD.gap - leadOffset;
      nextX = Math.min(nextX, stopAt);
    }
    if (Math.abs(nextX - this.x) < Math.abs(v * dt) - 1e-5) {
      v = 0;
      this.message = 'Yard stop: buffer or uncoupled wagon ahead. Couple only when stationary.';
    }
    this.x = nextX; this.speed = v;
  }
  // Coupling and uncoupling are only legal at rest and close to a wagon.
  couple() {
    if (!this.stopped) return { ok: false, message: 'Stop completely before using the couplers.' };
    const w = this.wagons[this.coupled];
    if (!w) return { ok: false, message: 'All yard wagons are already coupled.' };
    const end = this.x + (this.coupled ? OFFSET + (this.coupled - 1) * STEP + W : L);
    const gap = w.x - W - end;
    if (gap < -0.05 || gap > 1.6) return { ok: false, message: 'Ease forwards until the couplers are within 1.6 m.' };
    this.coupled++;
    this.x = w.x - OFFSET - (this.coupled - 1) * STEP;
    this.speed = 0;
    this.message = w.id + ' coupled. Conduct a brake test before moving.';
    return { ok: true, message: this.message };
  }
  uncouple() {
    if (!this.stopped) return { ok: false, message: 'Stop completely before uncoupling.' };
    if (!this.coupled) return { ok: false, message: 'No wagons coupled.' };
    const i = this.coupled - 1, w = this.wagons[i];
    w.x = this.carX(i);
    this.coupled--;
    this.message = w.id + ' secured and uncoupled.';
    return { ok: true, message: this.message };
  }
  load(depot) {
    if (!this.stopped) return { ok: false, message: 'Apply the brake and stop at the freight platform.' };
    if (!this.coupled) return { ok: false, message: 'Couple a wagon before loading.' };
    const i = Array.from({ length: this.coupled }, (_, n) => n)
      .find(n => !this.wagons[n].load && !this.wagons[n].staged &&
        Math.abs(this.carX(n) - TOWN_YARD.depotX) <= 7);
    if (i === undefined) return { ok: false, message: 'Park an empty coupled wagon beside the depot loading platform.' };
    const available = depot?.out?.parcel;
    if (!Number.isFinite(available) || available < 4)
      return { ok: false, message: 'Depot needs four real parcels before a wagon can be loaded.' };
    depot.out.parcel -= 4;
    this.wagons[i].load = 4;
    this.message = 'Four depot parcels secured in ' + this.wagons[i].id + '. Shunt east to the staging stop.';
    return { ok: true, message: this.message };
  }
  stage() {
    if (!this.stopped) return { ok: false, message: 'Stop and secure the consist before staging.' };
    const i = Array.from({ length: this.coupled }, (_, n) => n)
      .find(n => this.wagons[n].load && !this.wagons[n].staged && this.carX(n) >= 147);
    if (i === undefined) return { ok: false, message: 'Take a loaded coupled wagon to the east yard staging stop.' };
    this.wagons[i].staged = true;
    this.message = this.wagons[i].id + ' staged for a future main-line pickup (not yet dispatched).';
    return { ok: true, message: this.message };
  }
}
