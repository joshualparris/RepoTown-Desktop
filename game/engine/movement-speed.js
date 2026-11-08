// An optional per-device preference. It changes the *visitor's* walking/running
// pace, not traffic, town clock, animation speed, or NPC movement.
export const MOVEMENT_SPEED_KEY = 'repository-town.movement-speed.v1';
export const MOVEMENT_SPEED_DEFAULT = 1;
export const MOVEMENT_SPEED_MIN = 0.1;
export const MOVEMENT_SPEED_MAX = 5;

export function normaliseMovementSpeed(value) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return MOVEMENT_SPEED_DEFAULT;
  return Math.round(Math.max(MOVEMENT_SPEED_MIN, Math.min(MOVEMENT_SPEED_MAX, number)) * 10) / 10;
}

export function loadMovementSpeed(storage) {
  try {
    const stored = storage?.getItem(MOVEMENT_SPEED_KEY);
    return stored === null || stored === undefined ? MOVEMENT_SPEED_DEFAULT : normaliseMovementSpeed(stored);
  } catch {
    return MOVEMENT_SPEED_DEFAULT; // Private browsing can block storage.
  }
}

export function saveMovementSpeed(storage, value) {
  const amount = normaliseMovementSpeed(value);
  try { storage?.setItem(MOVEMENT_SPEED_KEY, String(amount)); } catch { /* session still works */ }
  return amount;
}

// Existing need-related fatigue effects stay intact; the user controls pace.
export function movementSpeedFactor(preference, hunger = 0, fatigue = 0) {
  const needsFactor = Math.max(0.45, 1 - (hunger > 80 ? 0.23 : 0) - (fatigue > 75 ? 0.32 : 0));
  return normaliseMovementSpeed(preference) * needsFactor;
}
