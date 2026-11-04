import * as THREE from "three";
import { createNeonOrbAbility } from "../../src/game/neonOrbAbility.js";
import { segmentVerticalCapsuleHit } from "../../src/game/neonOrbLogic.js";

// Keep the original orb, effects and cooldowns. Only Halloween adds this shield.
export function createHalloweenOrbAbility(scene, { demon, onTaunt, onShieldHit, getTargets, onHit, ...options }) {
  let cooldown = 0, returnSide = 0;
  const previous = new THREE.Vector3(), destination = new THREE.Vector3(), step = new THREE.Vector3();
  const radial = new THREE.Vector3(), tangent = new THREE.Vector3(), waypoint = new THREE.Vector3();
  function block(at) {
    if (!demon.blockOrb(at)) return;
    onShieldHit?.();
    if (cooldown <= 0) { cooldown = 2.8; onTaunt?.(); }
  }
  const orb = createNeonOrbAbility(scene, {
    ...options,
    getTargets: () => {
      const shield = demon.getShieldTarget();
      const targets = getTargets?.() || [];
      return shield ? [...targets, shield] : targets;
    },
    onHit: (target) => {
      if (target.kind === "halloween-demon-shield") { block(projectile.position); return; }
      return onHit?.(target);
    },
  });
  const projectile = scene.getObjectByName("NeonBoy / Orbe Neon");
  // The shop already has many point lights. A moving light would make every
  // material compile a second shader variant on the first shot, exhausting
  // WebGL on smaller GPUs. The emissive plasma and glow remain visible.
  projectile.children.find((child) => child.isPointLight)?.removeFromParent();
  return {
    ...orb,
    fire(...args) {
      if (!orb.fire(...args)) return false;
      returnSide = 0;
      return true;
    },
    update(dt, player, elapsed) {
      cooldown = Math.max(0, cooldown - dt);
      const shield = demon.getShieldTarget();
      let returnPlayer = player;
      // If NeonBoy moves behind the protected demon, route the returning orb
      // around the field instead of letting its homing path cut through it.
      if (dt > 0 && shield && ["returning", "impact"].includes(orb.getStatus().phase)) {
        previous.copy(projectile.position);
        destination.set(player.x, player.y + 1.18, player.z);
        const gap = previous.distanceTo(destination);
        step.copy(previous).lerp(destination, Math.min(1, 15 * dt / Math.max(gap, .0001)));
        const collision = segmentVerticalCapsuleHit(previous, step, shield.position, shield.radius + .16, shield.capsuleHalfHeight);
        radial.copy(previous).sub(shield.position); radial.y = 0;
        const movingOut = step.clone().sub(previous).dot(radial) > 0;
        const blocked = segmentVerticalCapsuleHit(previous, destination, shield.position, shield.radius + .16, shield.capsuleHalfHeight) !== null;
        if (!blocked || movingOut) returnSide = 0;
        if (returnSide || (collision !== null && !movingOut)) {
          if (!returnSide) {
            const contact = previous.clone().lerp(step, collision);
            block(contact);
            const dx = destination.x - shield.position.x, dz = destination.z - shield.position.z;
            returnSide = Math.sign(radial.z * dx - radial.x * dz) || 1;
          }
          if (radial.lengthSq() < .0001) radial.set(0, 0, 1);
          radial.normalize();
          tangent.set(radial.z * returnSide, 0, -radial.x * returnSide);
          const orbitRadius = shield.radius + .5;
          // A small outward deflection keeps each segment outside the shield.
          projectile.position.x = shield.position.x + radial.x * Math.max(orbitRadius, Math.hypot(previous.x - shield.position.x, previous.z - shield.position.z));
          projectile.position.z = shield.position.z + radial.z * Math.max(orbitRadius, Math.hypot(previous.x - shield.position.x, previous.z - shield.position.z));
          waypoint.copy(shield.position).addScaledVector(radial, Math.cos(.65) * orbitRadius).addScaledVector(tangent, Math.sin(.65) * orbitRadius);
          waypoint.y = projectile.position.y;
          waypoint.sub(projectile.position).normalize().multiplyScalar(Math.max(5, 15 * dt + 1)).add(projectile.position);
          returnPlayer = { x: waypoint.x, y: waypoint.y - 1.18, z: waypoint.z };
        }
      } else returnSide = 0;
      orb.update(dt, returnPlayer, elapsed);
    },
  };
}
