// Playtest cheats (opened from the hidden HUD cheat menu, src/ui/cheat-menu.js). They change
// game state directly and say so in the town log; nothing here touches real money or accounts.
import { DRIVEABLE_RECTS, PLAN_PARCELS, PLAN_HOMES } from './masterplan-built.js';
import { registry } from './property.js';
import {vehicleSpec,VEHICLE_DYNAMICS} from './vehicle-dynamics.js';

const r2 = (n) => Math.round(n * 100) / 100;

// The nearest point that is genuinely on a road (inset from the edges so the whole car fits).
export function nearestRoadPoint(x, z, clear = () => true) {
  let best = null, dist = Infinity;
  for (const b of DRIVEABLE_RECTS) {
    const inset = 2.2, x0 = b.x0 + inset, x1 = b.x1 - inset, z0 = b.z0 + inset, z1 = b.z1 - inset;
    if (x0 > x1 || z0 > z1) continue;
    // The closest point on this road, then points further along it, so an occupied spot is skipped.
    const horizontal = x1 - x0 > z1 - z0, c = { x: Math.min(x1, Math.max(x0, x)), z: Math.min(z1, Math.max(z0, z)) };
    for (const shift of [0, 7, -7, 14, -14, 21, -21, 28, -28]) {
      const p = horizontal ? { x: Math.min(x1, Math.max(x0, c.x + shift)), z: c.z } : { x: c.x, z: Math.min(z1, Math.max(z0, c.z + shift)) };
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < dist && clear(p.x, p.z)) { dist = d; best = { ...p, horizontal }; }
    }
  }
  return best;
}

// A registered, fuelled car parked on the road nearest (x, z).
export function summonCar(life, x, z, { model = 'sedan', clear } = {}) {
  const motor = life.civic.motor; if (!motor) return { ok: false, message: 'Vehicles are not available in this save.' };
  if(!Object.hasOwn(VEHICLE_DYNAMICS,model))return {ok:false,message:'Unknown vehicle model.'};
  // Never park on top of another vehicle (that used to leave the new car unable to move).
  const free = (px, pz) => (!clear || clear(px, pz)) && !(motor.owned || []).some((o) => Number.isFinite(o.x) && Math.hypot(o.x - px, o.z - pz) < 6);
  const spot = nearestRoadPoint(x, z, free);
  if (!spot) return { ok: false, message: 'No clear road nearby to park a car.' };
  const spec=vehicleSpec(model);
  const vehicle = {
    stockId: 'cheat-' + motor.next, model, condition: 100, odometer: 0, price: 0,
    registration: 'CHEAT-' + String(motor.next++).padStart(3, '0'), owner: 'visitor',
    regoUntil: life.day + 365, lastService: life.day, serviceDue: life.day + 365, roadworthy: true,
    x: spot.x, z: spot.z, yaw: spot.horizontal ? Math.PI / 2 : 0, speed: 0, fuel: spec.maxFuel, parkingPending: false, cheat: true, cheatUnrestricted:false,
  };
  motor.owned.push(vehicle);
  life.log(`Cheat: ${vehicle.registration} summoned.`);
  return { ok: true, vehicle, message: `${spec.name} (${vehicle.registration}) is parked nearby. Maximum mechanical speed ${spec.topKmh} km/h; Town roads are posted at 50 km/h. Walk up and use the hand control to drive.` };
}

// Transfer a title outright: no deposit, no mortgage, existing tenants keep their lease.
// New master-plan homes become titles (P:<parcel id>) the first time they are claimed, so
// existing saves and the normal property market are unchanged until a player asks for one.
function ensurePlanTitle(s, key) {
  if (s.parcels[key] || !key.startsWith('P:')) return;
  const lot = PLAN_PARCELS.find((p) => 'P:' + p.id === key);
  if (!lot) return;
  const home = PLAN_HOMES.find((h) => h.parcelId === lot.id);
  s.parcels[key] = { id: key, name: `${lot.address} · ${home ? 'new ' + home.style + ' home' : lot.label}`, address: lot.address, kind: 'house',
    owner: 'Town Property Cooperative', tenant: null, occupants: [], jointOwners: [], occupied: false,
    value: Math.round(lot.areaM2 * 9), rent: 0, listed: false, protected: false, condition: 100, masterPlan: true };
}
export function planTitleKey(text) {
  const q = String(text || '').trim().toLowerCase();
  const lot = PLAN_PARCELS.find((p) => p.address && p.address.toLowerCase() === q);
  return lot ? 'P:' + lot.id : null;
}

export function claimProperty(life, key) {
  const s = registry(life); ensurePlanTitle(s, key);
  const p = s.parcels[key];
  if (!p) return { ok: false, message: `No property ${key}.` };
  if (p.owner === 'visitor') return { ok: false, message: `You already own ${p.name}.` };
  const previous = p.owner;
  p.owner = 'visitor'; p.jointOwners = []; p.listed = false;
  delete s.liens[key];
  s.journal.unshift({ day: life.day, text: `Cheat: title to ${p.name} transferred from ${previous} to you, debt-free.` });
  life.log(`Cheat: you now own ${p.name}.`);
  return { ok: true, message: `You now own ${p.name} outright${p.tenant ? '; the tenant keeps their lease' : ''}.` };
}

export function nearestPropertyKey(life, x, z, positions) {
  const s = registry(life);
  let best = null, dist = Infinity;
  for (const [key, pos] of positions) {
    if (!s.parcels[key] && !key.startsWith('P:')) continue;
    const d = Math.hypot(pos.x - x, pos.z - z);
    if (d < dist) { dist = d; best = key; }
  }
  return best;
}

export function addMoney(life, amount = 10000) {
  const me = life.civic.player; me.wallet = r2((me.wallet || 0) + amount);
  life.log(`Cheat: $${amount} added to your wallet.`);
  return { ok: true, message: `+$${amount.toLocaleString('en-AU')}. Wallet $${me.wallet.toLocaleString('en-AU')}.` };
}

export function refreshNeeds(life) {
  const me = life.civic.player; me.hunger = 0; me.fatigue = 0; me.lastSleptDay = life.day;
  return { ok: true, message: 'Fed and fully rested.' };
}

export function fixAllCars(life) {
  const owned = life.civic.motor?.owned || [];
  for (const v of owned) Object.assign(v, { condition: 100, fuel: vehicleSpec(v.model).maxFuel, roadworthy: true, regoUntil: life.day + 365, serviceDue: life.day + 365 });
  return { ok: true, message: owned.length ? `${owned.length} car${owned.length > 1 ? 's' : ''} repaired, refuelled and registered for a year.` : 'You have no cars yet. Summon one first.' };
}

export function setClock(life, minute) {
  life.minute = ((minute % 1440) + 1440) % 1440;
  return { ok: true, message: `Time set to ${String(Math.floor(life.minute / 60)).padStart(2, '0')}:${String(life.minute % 60).padStart(2, '0')}.` };
}
