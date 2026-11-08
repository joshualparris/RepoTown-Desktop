import {vehicleSpec,transmissionFor} from './vehicle-dynamics.js';
// Dashboard values come from the driven car, never from an invented HUD counter.
// Game-world metres per second become Australian km/h; 30 L is the existing refuelling capacity.
export const FUEL_CAPACITY_L = 30;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const finite = (n, otherwise=0) => Number.isFinite(n) ? n : otherwise;

// Illustrative coolant model, not a real car engineering or maintenance diagnostic.
// Warms up while the engine runs, settles around normal operating temperature,
// and runs somewhat hotter under load or when the simulated vehicle is worn.
export function updateCoolantTemperature(previous, dt, speedMs, condition=100) {
  const old = clamp(finite(previous, 22), -10, 125);
  const load = clamp(Math.abs(finite(speedMs))/13, 0, 1);
  const wear = clamp(100-finite(condition,100), 0, 100);
  const target = 88 + 6*load + 0.12*wear;
  const delta = clamp(finite(dt),0,1.0);
  // Never quantise inside the simulation integrator: rounding each 0.15 s
  // frame to 0.1°C creates a 81.8°C fixed point even when the thermostat
  // target is above 94°C. Only round once when displaying the HUD.
  return old + (target-old)*(1-Math.exp(-delta/38));
}

export function vehicleTelemetry(vehicle) {
  if (!vehicle) return null;
  const speedMs=finite(vehicle.speed),spec=vehicleSpec(vehicle.model),fuel=clamp(finite(vehicle.fuel),0,spec.maxFuel);
  const transmission=transmissionFor(vehicle.model,speedMs,vehicle.speed<-.1?-.3:Math.abs(speedMs)<.25?0:.5);
  const temp=clamp(finite(vehicle.coolantTemp,22),-10,125);
  const speedKmh=Math.round(Math.abs(speedMs)*3.6);
  return {
    registration:String(vehicle.registration||''),
    model:spec.name,
    speedKmh,
    speedMs,
    direction:vehicle.gear||transmission.gear,
    rpm:Number.isFinite(vehicle.rpm)?vehicle.rpm:transmission.rpm,
    fuelLitres:Math.round(fuel*100)/100,
    fuelPercent:Math.round(100*fuel/spec.maxFuel),
    fuelCapacityL:spec.maxFuel,
    maxMechanicalSpeedKmh:spec.topKmh,
    speedLimitKmh:50,
    lowFuel:fuel<=4.5,
    coolantC:Math.round(temp),
    coolantPercent:Math.round(100*clamp((temp-40)/80,0,1)),
    hotEngine:temp>=108,
    odometerKm:Math.round(finite(vehicle.odometer)*10)/10,
    conditionPercent:Math.round(clamp(finite(vehicle.condition,100),0,100)),
    approximateRangeKm:Math.floor(fuel/(spec.kind==='bike'?1.2:vehicle.model==='truck'?4.5:3)), // compressed game economy
  };
}
