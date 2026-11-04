import * as THREE from "three";
import { JUDGE_MAX_HEALTH, JUDGE_FURY_HEALTH, judgeCombatTuning, judgeHit } from "./halloweenJudgeLogic.js";
import { createHalloweenJudgeVisuals } from "./halloweenJudgeVisuals.js";

export const JUDGE_BACK_STAGE = Object.freeze({ x: 0, z: -10.1 });
export const JUDGE_REAR_LOCATIONS = Object.freeze([[0, -10.1], [-3, -10.6], [3, -10.6], [-2.2, -9.2], [2.2, -9.2]].map(Object.freeze));
const DEATH_FADE = 1.3;
const smooth = (value) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };

export function createHalloweenJudgeEncounter(scene, { isSafe = () => true, onDamage, onEvent, onHit,
  onDeathComplete, lowPower = false, isProjectileBlocked = () => false } = {}) {
  const root = new THREE.Group();
  root.name = "Halloween / Juez del Abismo";
  root.position.set(JUDGE_BACK_STAGE.x, 0, JUDGE_BACK_STAGE.z);
  root.visible = false;
  scene.add(root);
  const visuals = createHalloweenJudgeVisuals(scene, { lowPower });
  const projectile = visuals.projectile;
  const warning = new THREE.Mesh(new THREE.RingGeometry(2.62, 2.75, 64), new THREE.MeshBasicMaterial({
    color: 0xff495c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, toneMapped: false }));
  warning.userData.halloweenCodeExclude = true;
  warning.rotation.x = -Math.PI / 2;
  warning.position.y = .065;
  warning.visible = false;
  root.add(warning);
  const target = { id: "judge-of-abyss", kind: "judge-of-abyss", position: new THREE.Vector3(), radius: .9, capsuleHalfHeight: 1.05, returnHit: true };
  const projectileDirection = new THREE.Vector3();
  const bodyMeshes = [];
  const deathAnchor = new THREE.Vector3();
  let hips = null;
  let mixer = null, body = null, actions = {}, pose = "idle", health = JUDGE_MAX_HEALTH;
  let phase = "inactive", phaseTime = 0, attackTimer = 2.5, attackPoseTime = 0, warningTime = 0, attackKind = "", projectileAge = 0, projectileMaxAge = 6;
  let attackTuning = judgeCombatTuning(health), projectileSpeed = attackTuning.orbSpeed;
  let hitArmed = false, lastHitAt = -10, teleportIndex = 0, attackIndex = 0;
  let pendingTeleport = null, teleportTime = 0;
  let deathDuration = 3, deathComplete = false, bodyY = 0;

  function mount(idle, walk, attack, death) {
    body = idle.scene;
    const bounds = new THREE.Box3().setFromObject(body);
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2.75 / Math.max(bounds.getSize(new THREE.Vector3()).y, .01);
    body.scale.setScalar(scale);
    body.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    bodyY = body.position.y;
    body.traverse(object => {
      if (!object.isMesh) return;
      bodyMeshes.push(object);
      // Enable opacity before shader warmup; animated code-vision variants inherit it.
      for (const material of [object.material].flat()) material.transparent = true;
    });
    root.add(body);
    hips = body.getObjectByName("mixamorigHips") || body.getObjectByName("mixamorig:Hips");
    mixer = new THREE.AnimationMixer(body);
    const compatible = (clip) => {
      if (!clip) return null;
      const tracks = clip.tracks.filter(track => {
        const node = THREE.PropertyBinding.parseTrackName(track.name).nodeName;
        return !node || Boolean(body.getObjectByName(node));
      });
      return tracks.length ? new THREE.AnimationClip(clip.name, clip.duration, tracks) : null;
    };
    const clips = [idle, walk, attack, death].map(source => compatible(source?.animations[0]));
    actions = Object.fromEntries(["idle", "walk", "attack", "death"].map((name, i) => [name, clips[i] && mixer.clipAction(clips[i])]));
    actions.attack?.setLoop(THREE.LoopOnce, 1);
    if (actions.attack) actions.attack.clampWhenFinished = true;
    if (actions.death) {
      actions.death.setLoop(THREE.LoopOnce, 1);
      actions.death.clampWhenFinished = true;
      deathDuration = actions.death.getClip().duration;
    }
    actions.idle?.play();
    return [walk?.scene, attack?.scene, death?.scene].filter(Boolean);
  }
  function setBodyOpacity(opacity) {
    if (!body) return;
    body.visible = opacity > .001;
    for (const mesh of bodyMeshes) for (const material of [mesh.material].flat()) material.opacity = opacity;
  }
  function setPose(next) {
    if (!actions[next] || pose === next) return;
    actions[pose]?.fadeOut(.14);
    actions[next].reset().fadeIn(.14).play();
    pose = next;
  }
  function setPhase(next) {
    if (next === phase || (health === 0 && next === "combat")) return;
    if (next === "gone" && phase === "dying" && !deathComplete) return;
    phase = next;
    phaseTime = 0;
    pendingTeleport = null;
    teleportTime = 0;
    if (next === "spawning") {
      // Materialize in the clear rear aisle, away from the mirror and NPCs.
      root.position.set(JUDGE_BACK_STAGE.x, 0, JUDGE_BACK_STAGE.z);
      root.rotation.y = 0;
    }
    root.visible = !["inactive", "game-over", "gone"].includes(next);
    visuals.setPhase(next, root.position);
    if (next === "spawning") {
      root.scale.setScalar(.94); setBodyOpacity(0); projectile.visible = false; onEvent?.("spawn");
    } else if (next !== "dying") {
      root.scale.setScalar(1); setBodyOpacity(1); if (body) body.position.y = bodyY;
    }
    if (next === "combat") { attackTimer = 2.1; attackPoseTime = 0; attackIndex = 0; projectile.visible = warning.visible = false; }
    if (next === "dying") {
      deathComplete = false;
      warning.visible = projectile.visible = false;
      warningTime = 0;
      attackPoseTime = 0;
      // The final hit interrupts every looping action. Hold the last death pose.
      mixer?.stopAllAction();
      actions.death?.reset().play();
      pose = "death";
    }
    if (next === "game-over" || next === "gone") {
      projectile.visible = warning.visible = false; mixer?.stopAllAction();
    }
  }
  function armShot() { hitArmed = true; }
  function hit(now = performance.now()) {
    if (phase !== "combat" || pendingTeleport || !hitArmed || now - lastHitAt < 300) return null;
    const next = judgeHit(health);
    if (next === null) return null;
    hitArmed = false; lastHitAt = now;
    const enteringFury = health > JUDGE_FURY_HEALTH && next <= JUDGE_FURY_HEALTH;
    health = next;
    visuals.hit(root.position);
    if (enteringFury) { visuals.enrage(root.position); onEvent?.("fury"); }
    if (!health) setPhase("dying");
    onHit?.(health);
    onEvent?.("hit");
    return health;
  }
  function startAttack(kind, player) {
    attackKind = kind;
    attackTuning = judgeCombatTuning(health);
    warningTime = kind === "wave" ? attackTuning.waveWindup : attackTuning.orbWindup;
    warning.material.color.setHex(health <= JUDGE_FURY_HEALTH ? 0xff7659 : 0xff495c);
    if (actions.attack) actions.attack.timeScale = attackTuning.attackSpeed;
    attackPoseTime = actions.attack ? actions.attack.getClip().duration / attackTuning.attackSpeed : warningTime;
    warning.visible = kind === "wave";
    if (warning.visible) warning.scale.setScalar(.84 * attackTuning.waveRadius / 2.75);
    onEvent?.(kind);
    root.rotation.y = Math.atan2(player.x - root.position.x, player.z - root.position.z);
    setPose("attack");
  }
  function teleport(player, nextAttack) {
    for (let offset = 1; offset <= JUDGE_REAR_LOCATIONS.length; offset++) {
      const index = (teleportIndex + offset) % JUDGE_REAR_LOCATIONS.length;
      const [x, z] = JUDGE_REAR_LOCATIONS[index];
      if (!isSafe(x, z) || Math.hypot(player.x - x, player.z - z) < 2.2) continue;
      teleportIndex = index;
      pendingTeleport = { position: new THREE.Vector3(x, 0, z), nextAttack };
      teleportTime = judgeCombatTuning(health).vanishTime;
      visuals.teleportOut(root.position);
      root.visible = false;
      onEvent?.("teleport-out");
      return true;
    }
    return false;
  }
  function update(dt, elapsed, player, locked = false, reducedMotion = false) {
    if (["inactive", "gone", "game-over"].includes(phase)) return;
    phaseTime += dt;
    mixer?.update(dt);
    if (phase === "combat" && attackPoseTime > 0) {
      attackPoseTime = Math.max(0, attackPoseTime - dt);
      if (attackPoseTime === 0 && warningTime === 0) setPose("idle");
    }
    if (phase === "dying" && hips) hips.getWorldPosition(deathAnchor);
    else deathAnchor.copy(root.position);
    visuals.update(dt, elapsed, root.position, phaseTime, deathDuration, reducedMotion, warningTime > 0, deathAnchor, Boolean(pendingTeleport));
    if (phase === "spawning") {
      const reveal = smooth((phaseTime - .65) / 1.65);
      root.scale.setScalar(.94 + .06 * reveal);
      if (body) body.position.y = bodyY - .12 * (1 - reveal);
      setBodyOpacity(reveal);
    }
    if (phase === "dying") {
      setBodyOpacity(1 - smooth((phaseTime - deathDuration) / DEATH_FADE));
      if (!deathComplete && phaseTime >= deathDuration + DEATH_FADE + .5) {
        deathComplete = true;
        onEvent?.("death");
        onDeathComplete?.();
      }
      return;
    }
    if (phase !== "combat" || locked) return;
    if (pendingTeleport) {
      teleportTime -= dt;
      if (teleportTime <= 0) {
        const { position, nextAttack } = pendingTeleport;
        pendingTeleport = null;
        root.position.copy(position);
        root.visible = true;
        visuals.teleportIn(root.position);
        onEvent?.("teleport-in");
        startAttack(nextAttack, player);
      }
      return;
    }
    const distance = Math.hypot(player.x - root.position.x, player.z - root.position.z);
    if (projectile.visible) {
      projectileAge += dt;
      // Sweep small steps so fast frames cannot skip furniture or the player.
      const steps = Math.max(1, Math.ceil(dt * projectileSpeed / .08));
      for (let step = 0; step < steps && projectile.visible; step++) {
        projectile.position.addScaledVector(projectileDirection, dt * projectileSpeed / steps);
        const p = projectile.position;
        const blocked = isProjectileBlocked(p.x, p.z);
        const touchesPlayer = Math.hypot(p.x - player.x, p.y - player.y - 1.15, p.z - player.z) < .7;
        if (blocked || touchesPlayer) {
          visuals.impact(p); projectile.visible = false;
          if (!blocked) onDamage?.();
        }
      }
      if (projectile.visible && projectileAge > projectileMaxAge) { visuals.impact(projectile.position); projectile.visible = false; }
    }
    if (warningTime > 0) {
      warningTime = Math.max(0, warningTime - dt);
      if (attackKind === "wave") {
        warning.material.opacity = reducedMotion ? .35 : .2 + .26 * Math.sin(elapsed * 6) ** 2;
        warning.scale.setScalar((.84 + .16 * (1 - warningTime / attackTuning.waveWindup)) * attackTuning.waveRadius / 2.75);
      }
      if (warningTime === 0) {
        warning.visible = false;
        if (attackKind === "wave") { visuals.wave(root.position, attackTuning.waveRadius); if (distance < attackTuning.waveRadius) onDamage?.(); }
        if (attackKind === "orb") {
          projectile.position.set(root.position.x, 1.45, root.position.z);
          projectileDirection.set(player.x - root.position.x, player.y + 1.15 - projectile.position.y, player.z - root.position.z);
          const shotDistance = projectileDirection.length();
          projectileDirection.normalize();
          projectileAge = 0;
          projectileSpeed = attackTuning.orbSpeed;
          projectileMaxAge = Math.min(4.5, Math.max(1.2, shotDistance / projectileSpeed + .55));
          projectile.visible = true;
        }
        attackTimer = judgeCombatTuning(health).attackInterval;
      }
      return;
    }
    attackTimer -= dt;
    if (attackPoseTime > 0 || projectile.visible) return;
    if (attackTimer > 0) {
      if (distance > 2.65 && attackTimer < judgeCombatTuning(health).attackInterval * .9) {
        const dx = player.x - root.position.x, dz = player.z - root.position.z;
        const chaseSpeed = judgeCombatTuning(health).chaseSpeed;
        const nx = root.position.x + dx / distance * dt * chaseSpeed;
        const nz = root.position.z + dz / distance * dt * chaseSpeed;
        if (isSafe(nx, nz)) { root.position.x = nx; root.position.z = nz; setPose("walk"); }
        else setPose("idle");
        root.rotation.y = Math.atan2(dx, dz);
      } else setPose("idle");
      return;
    }
    const cycle = attackIndex++ % 4;
    const nextAttack = cycle === 2 && distance < 3.8 ? "wave" : "orb";
    // Two of every four turns vanish; in fury a third turn vanishes too.
    // Reappearance always leads to a telegraphed attack, never a free hit.
    if ((cycle === 1 || cycle === 3 || (health <= JUDGE_FURY_HEALTH && cycle === 2)) && teleport(player, nextAttack)) return;
    startAttack(nextAttack, player);
  }
  return {
    root, mount, setPhase, update, armShot, hit,
    getTarget() { if (phase !== "combat" || !health || pendingTeleport) return null; target.position.set(root.position.x, 1.3, root.position.z); return target; },
    get phase() { return phase; }, get health() { return health; }, get position() { return root.position; },
    stop() { mixer?.stopAllAction(); },
    dispose() { visuals.dispose(); warning.geometry.dispose(); warning.material.dispose(); warning.removeFromParent(); },
  };
}
