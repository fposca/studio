export const HALLOWEEN_ORB_RANGE = 25;
const AIM_ASSIST_RADIANS = Math.PI / 9;

// A small correction keeps third-person shots forgiving on a touch joystick.
export function resolveHalloweenOrbHeading(facingHeading, player, target) {
  if (!target) return facingHeading;
  const dx = target.position.x - player.x;
  const dz = target.position.z - player.z;
  const distance = Math.hypot(dx, dz);
  if (distance > HALLOWEEN_ORB_RANGE || distance < .01) return facingHeading;
  const targetHeading = Math.atan2(dx, dz);
  const difference = Math.atan2(Math.sin(targetHeading - facingHeading), Math.cos(targetHeading - facingHeading));
  return Math.abs(difference) <= AIM_ASSIST_RADIANS ? targetHeading : facingHeading;
}

export function resolveHalloweenOrbAim(view, player, target) {
  const cameraHeading = Math.PI + view.yaw;
  if (view.firstPerson) {
    // The reticle is the exact camera center, so do not pull this shot toward a target.
    return { heading: cameraHeading, pitch: view.firstPitch };
  }
  const facingHeading = Number.isFinite(player.yaw) ? player.yaw : cameraHeading;
  return { heading: resolveHalloweenOrbHeading(facingHeading, player, target), pitch: 0 };
}
