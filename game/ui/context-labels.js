import * as THREE from 'three';

// The HUD already describes the closest usable object. World-space nameplates
// are secondary: at most one short label, directly ahead, and never through walls.
// This policy also covers NPC tags nested inside moving character groups.
export function focusInteriorLabels(root, { target, player, forward, modal = false, currentRoom = null, canSee = () => true }) {
  const at = new THREE.Vector3();
  let best = null, bestScore = Infinity;
  const dx = target ? target.x - player.x : 0;
  const dz = target ? target.z - player.z : 0;
  const distance = Math.hypot(dx, dz);
  const facing = distance > 0.01 ? (dx * forward.x + dz * forward.z) / distance : 1;
  const focused = !modal && target && distance >= 1.65 && distance <= 3.4 && facing >= 0.42;
  root.traverse(sprite => {
    if (!sprite.isSprite || typeof sprite.userData?.text !== 'string') return;
    sprite.visible = false;
    // Long workstation descriptions belong in the bottom action prompt, not
    // large floating billboards that obscure other customers or furniture.
    if (!focused || (currentRoom != null && sprite.userData.labelRoom != null && sprite.userData.labelRoom !== currentRoom) || sprite.userData.labelKind !== 'interactive' || sprite.userData.text.length > 24) return;
    if (sprite.getWorldPosition) sprite.getWorldPosition(at);
    else at.copy(sprite.position);
    const offset = Math.hypot(at.x - target.x, at.z - target.z);
    if (offset > 0.85 || !canSee(at)) return;
    const score = offset + Math.abs(at.y - 1.75) * 0.015;
    if (score < bestScore) { bestScore = score; best = sprite; }
  });
  if (best) best.visible = true;
  return best;
}

export function showNearbyHouseLabel({ distance, facing, nearest, overview = false, modal = false }) {
  return !overview && !modal && nearest && distance <= 6.5 && facing >= 0.2;
}
