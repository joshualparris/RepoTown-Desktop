import * as THREE from 'three';
// Camera-relative compass for Repository Town and real Narromine
// world. World -Z is geographic north, +X east. Use the *camera* look direction,
// not the walking avatar's yaw: chase, rider and high driving views can differ.
export const COMPASS_STORAGE_KEY = 'repository-town.compass-visible.v1';

export function compassHeading(x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || Math.hypot(x, z) < 1e-7) return 0;
  return ((Math.atan2(x, -z) * 180 / Math.PI) % 360 + 360) % 360;
}

export function compassCardinal(heading) {
  if (!Number.isFinite(heading)) return 'N';
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round((((heading % 360) + 360) % 360) / 45) % 8];
}

export function compassVisiblePreference(storage) {
  try { return storage?.getItem(COMPASS_STORAGE_KEY) !== 'false'; }
  catch { return true; } // private browsing or blocked storage must not crash gameplay
}

export function createCompass({ element, checkbox, camera, storage, getView = () => null, getPostalInterior = () => false }) {
  if (!element || !checkbox || !camera) throw new Error('Compass requires DOM elements and camera');
  const rose = element.querySelector('.compass-rose');
  const reading = element.querySelector('.compass-reading');
  if (!rose || !reading) throw new Error('Compass markup is missing a dial or heading');
  let enabled = compassVisiblePreference(storage), last = NaN;
  checkbox.checked = enabled;
  const sync = () => {
    element.ownerDocument.body?.classList.toggle('compass-on', enabled);
    element.hidden = !enabled;
    checkbox.checked = enabled;
    checkbox.setAttribute('aria-checked', String(enabled));
    if (enabled) last = NaN;
  };
  checkbox.addEventListener('change', () => {
    enabled = checkbox.checked;
    try { storage?.setItem(COMPASS_STORAGE_KEY, String(enabled)); } catch {}
    sync();
  });
  sync();

  // Allocated once; called during the normal frame with no extra rendering.
  const forward = new THREE.Vector3();
  const update = () => {
    if (!enabled || element.hidden) return;
    camera.getWorldDirection(forward);
    let x = forward.x, z = forward.z;
    // Most house/shop interiors have a known outdoor rotation for their
    // windows. Convert their *local* room heading back to map north.
    const view = getView();
    if (view) {
      const a = view.point(0, 0), b = view.point(x, z);
      x = b.x - a.x; z = b.z - a.z;
    } else if (getPostalInterior()) {
      // The Narromine Post Office's public north-facing entrance is the
      // room's local +Z. Its approximate street alignment faces north.
      x = -x; z = -z;
    }
    const degrees = compassHeading(x, z);
    if (Number.isFinite(last) && Math.abs((((degrees - last) + 540) % 360) - 180) < .2) return;
    last = degrees;
    rose.style.transform = 'rotate(' + (-degrees).toFixed(2) + 'deg)';
    const nearest = Math.round(degrees) % 360;
    const direction = compassCardinal(degrees);
    reading.textContent = direction + ' · ' + String(nearest).padStart(3, '0') + '°';
    element.setAttribute('aria-label', 'Compass: facing ' + direction + ', ' + nearest + ' degrees clockwise from north');
    element.dataset.heading = String(nearest);
    element.dataset.direction = direction;
  };
  return {
    update,
    get enabled() { return enabled; },
    setEnabled(value) {
      checkbox.checked = !!value;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    },
  };
}
