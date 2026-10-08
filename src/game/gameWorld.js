import RAPIER from "@dimforge/rapier3d-compat";
import { CEMETERY_OBSTACLES, getLevel, LEVELS } from "./gameLevels.js";
import { parthenonColumnPositions } from "../editors/parthenonSet.js";
import { ATTACKS, BODY_OFFSET, BOUNDS, FIXED_STEP, GRAVITY, JUMP_SPEED, MAX_HEALTH, MOVE_SPEED, RUN_SPEED, canStrike, movementVector } from "./gameRules.js";

let physicsReady;
export function initializePhysics() {
  return physicsReady ||= RAPIER.init();
}

export class GameWorld {
  constructor({ level = 1, inventory = ["unarmed"], equipped = "unarmed" } = {}) {
    this.level = getLevel(level);
    this.checkpoint = [...new Set(["unarmed", ...inventory.filter((id) => ["sword", "hammer"].includes(id))])];
    this.checkpointWeapon = this.checkpoint.includes(equipped) ? equipped : "unarmed";
    this.physics = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
    this.physics.timestep = FIXED_STEP;
    this.events = [];
    this.actors = [];
    this.buildTerrain();
    this.player = this.createActor(this.level.spawn, "neonboy");
    this.enemies = this.level.enemies.map((spawn, i) => this.createActor(spawn, `${this.level.enemy}-${i}`));
    this.coins = this.level.coins.map(([x, y, z], id) => ({ x, y, z, id, collected: false }));
    this.pickups = this.level.pickups.map((pickup) => ({ ...pickup, collected: false }));
    this.reset();
  }

  box(x, y, z, width, height, depth) {
    return this.physics.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2).setTranslation(x, y, z));
  }

  buildTerrain() {
    // An exact plane avoids capsule contact jitter against a very large box.
    this.physics.createCollider(new RAPIER.ColliderDesc(new RAPIER.HalfSpace({ x: 0, y: 1, z: 0 })).setTranslation(0, -0.015, 0));
    if (this.level.id === 2) {
      for (const obstacle of CEMETERY_OBSTACLES) this.box(...obstacle);
    } else {
      for (const [y, width, height, depth] of [[0.12, 22.8, 0.25, 35], [0.36, 21.9, 0.25, 34.1], [0.61, 21.1, 0.27, 33.2]]) {
        this.box(0, y, -23.6, width, height, depth);
      }
      for (const [x, z] of parthenonColumnPositions()) {
        this.physics.createCollider(RAPIER.ColliderDesc.cylinder(2.9, 0.56).setTranslation(x, 3.5, z));
      }
      this.box(0, 3.65, -12.8, 14.1, 5.8, 0.7);
      this.box(-6.85, 3.65, -25, 0.45, 5.8, 24);
      this.box(6.85, 3.65, -25, 0.45, 5.8, 24);
      this.box(0, 3.65, -37.2, 14.1, 5.8, 0.55);
      for (const x of [-11.9, 11.9]) for (const z of [-3.5, -13.5]) this.box(x, 0.75, z, 0.9, 1.5, 0.9);
    }
    // Low perimeter walls in the scene mark the playable terrace; these tall colliders contain jumps.
    this.box(BOUNDS.left - 0.3, 4, -11.25, 0.6, 10, 65.1);
    this.box(BOUNDS.right + 0.3, 4, -11.25, 0.6, 10, 65.1);
    this.box(0, 4, BOUNDS.back - 0.3, 34.2, 10, 0.6);
    this.box(0, 4, BOUNDS.front + 0.3, 34.2, 10, 0.6);
  }

  createActor(spawn, id) {
    const body = this.physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(spawn.x, spawn.y + BODY_OFFSET, spawn.z));
    const collider = this.physics.createCollider(RAPIER.ColliderDesc.capsule(0.58, 0.32), body);
    const controller = this.physics.createCharacterController(0.015);
    controller.enableAutostep(0.29, 0.16, false);
    controller.enableSnapToGround(0.3);
    controller.setMaxSlopeClimbAngle(Math.PI / 4);
    controller.setMinSlopeSlideAngle(Math.PI / 3);
    const actor = { id, spawn, body, collider, controller };
    this.actors.push(actor);
    return actor;
  }

  reset() {
    this.status = "playing";
    this.time = 0;
    this.collected = 0;
    this.events.length = 0;
    this.inventory = new Set(this.checkpoint);
    this.equipped = this.checkpointWeapon;
    this.pickupNotice = null;
    for (const actor of this.actors) {
      const maxHealth = actor === this.player ? MAX_HEALTH : this.level.enemyHealth;
      Object.assign(actor, { ...actor.spawn, yaw: Math.PI, health: maxHealth, maxHealth,
        velocityY: 0, velocityX: 0, velocityZ: 0, speed: 0, grounded: false, attack: null,
        cooldown: 0, invulnerable: 0, stun: 0, deadTime: 0, combo: 0, mode: "idle", combat: 0,
        equipped: actor === this.player ? this.equipped : "unarmed", species: actor === this.player ? "neonboy" : this.level.enemy });
      const position = { x: actor.x, y: actor.y + BODY_OFFSET, z: actor.z };
      actor.body.setTranslation(position, true);
      actor.body.setNextKinematicTranslation(position);
    }
    this.coins.forEach((coin) => { coin.collected = false; });
    this.pickups.forEach((pickup) => { pickup.collected = this.inventory.has(pickup.weapon); });
    this.physics.step();
  }

  startAttack(actor, kind) {
    if (actor === this.player) {
      if (!["punch", "kick"].includes(kind)) return false;
      if (kind === "punch" && this.equipped !== "unarmed") kind = this.equipped;
    }
    if (!ATTACKS[kind]) return false;
    if (actor.health <= 0 || actor.attack || actor.cooldown > 0 || actor.stun > 0) return false;
    if (actor === this.player) {
      const nearest = this.enemies.filter((enemy) => enemy.health > 0 && Math.hypot(enemy.x - actor.x, enemy.z - actor.z) < ATTACKS[kind].reach + 0.35 && this.hasLineOfSight(actor, enemy))
        .sort((a, b) => Math.hypot(a.x - actor.x, a.z - actor.z) - Math.hypot(b.x - actor.x, b.z - actor.z))[0];
      if (nearest) actor.yaw = Math.atan2(nearest.x - actor.x, nearest.z - actor.z);
    }
    actor.combo += 1;
    actor.combat = 2.2;
    actor.attack = { kind, elapsed: 0, hit: new Set(), variant: (actor.combo - 1) % 3,
      side: ["sword", "hammer"].includes(kind) ? "Right" : actor.combo % 2 ? "Left" : "Right" };
    this.events.push({ type: "attack", actor: actor.id, kind, x: actor.x, y: actor.y + 1, z: actor.z });
    return true;
  }

  hasLineOfSight(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    const length = Math.hypot(dx, dy, dz);
    if (length < 0.001) return true;
    const ray = new RAPIER.Ray({ x: from.x, y: from.y + 1, z: from.z }, { x: dx / length, y: dy / length, z: dz / length });
    return !this.physics.castRay(ray, length, true, undefined, undefined, undefined, undefined, (collider) => !collider.parent());
  }

  moveActor(actor, dx, dz, dt) {
    actor.velocityY = Math.max(-18, actor.velocityY - GRAVITY * dt);
    if (actor.grounded && actor.velocityY < 0) actor.velocityY = -2;
    actor.controller.computeColliderMovement(actor.collider, { x: dx * dt, y: actor.velocityY * dt, z: dz * dt });
    const movement = actor.controller.computedMovement();
    actor.grounded = actor.controller.computedGrounded();
    if (actor.grounded && actor.velocityY < 0) actor.velocityY = 0;
    if (actor.velocityY > 0 && movement.y < actor.velocityY * dt - 0.01) actor.velocityY = 0;
    const before = actor.body.translation();
    actor.body.setNextKinematicTranslation({ x: before.x + movement.x, y: before.y + movement.y, z: before.z + movement.z });
    actor.x = before.x + movement.x;
    actor.y = before.y + movement.y - BODY_OFFSET;
    actor.z = before.z + movement.z;
    actor.speed = Math.hypot(movement.x, movement.z) / dt;
  }

  damage(victim, attacker, definition) {
    if (victim.health <= 0 || victim.invulnerable > 0) return;
    victim.health = Math.max(0, victim.health - definition.damage);
    victim.invulnerable = victim === this.player ? 0.85 : 0.2;
    victim.stun = 0.28;
    victim.attack = null;
    const angle = Math.atan2(victim.x - attacker.x, victim.z - attacker.z);
    victim.velocityX = Math.sin(angle) * definition.knockback;
    victim.velocityZ = Math.cos(angle) * definition.knockback;
    victim.combat = 2.2;
    this.events.push({ type: victim.health ? "hit" : "defeat", kind: attacker.attack?.kind || "punch", actor: victim.id, x: victim.x, y: victim.y + 1, z: victim.z });
    if (!victim.health) victim.mode = "dead";
  }

  updateAttack(actor, targets, dt) {
    const attack = actor.attack;
    if (!attack) return;
    const definition = ATTACKS[attack.kind];
    attack.elapsed += dt;
    if (attack.elapsed >= definition.impact && attack.elapsed <= definition.end) {
      for (const target of targets) {
        if (target.health <= 0 || attack.hit.has(target.id) || !canStrike(actor, target, definition) || !this.hasLineOfSight(actor, target)) continue;
        attack.hit.add(target.id);
        this.damage(target, actor, definition);
      }
    }
    if (attack.elapsed >= definition.duration) {
      actor.attack = null;
      actor.cooldown = actor === this.player ? 0.07 : 0.42;
    }
  }

  step(input = {}, dt = FIXED_STEP) {
    if (this.status !== "playing") return;
    this.time += dt;
    for (const actor of this.actors) {
      actor.invulnerable = Math.max(0, actor.invulnerable - dt);
      actor.cooldown = Math.max(0, actor.cooldown - dt);
      actor.stun = Math.max(0, actor.stun - dt);
      actor.combat = Math.max(0, actor.combat - dt);
      actor.velocityX *= Math.exp(-8 * dt);
      actor.velocityZ *= Math.exp(-8 * dt);
    }
    const player = this.player;
    if (input.equip) this.equip(input.equip);
    if (input.jump && player.grounded && !player.stun && player.health > 0) {
      player.velocityY = JUMP_SPEED;
      player.grounded = false;
      this.events.push({ type: "jump" });
    }
    if (input.attack) this.startAttack(player, input.attack);
    const motion = movementVector(input.x || 0, input.z || 0, input.yaw || 0);
    const pace = (input.run ? RUN_SPEED : MOVE_SPEED) * (player.attack ? 0.23 : 1) * (player.stun ? 0 : 1);
    if (Math.hypot(motion.x, motion.z) > 0.05 && !player.attack && !player.stun) {
      const desired = Math.atan2(motion.x, motion.z);
      player.yaw += Math.atan2(Math.sin(desired - player.yaw), Math.cos(desired - player.yaw)) * Math.min(1, 16 * dt);
    }
    const wasAirborne = !player.grounded && player.velocityY < -2;
    this.moveActor(player, motion.x * pace + player.velocityX, motion.z * pace + player.velocityZ, dt);
    if (wasAirborne && player.grounded) this.events.push({ type: "land" });
    player.mode = player.attack?.kind || (!player.grounded ? "jump" : player.speed > 0.1 ? "walk" : "idle");
    for (const [index, enemy] of this.enemies.entries()) {
      if (enemy.health <= 0) {
        enemy.deadTime += dt;
        enemy.collider.setEnabled(false);
        continue;
      }
      const distance = Math.hypot(player.x - enemy.x, player.z - enemy.z);
      const chase = distance < (this.level.id === 2 ? 10 : 8.5) && player.health > 0 && this.hasLineOfSight(enemy, player);
      const patrolAngle = this.time * 0.24 + index * 1.5;
      const target = chase ? player : { x: enemy.spawn.x + Math.cos(patrolAngle) * 1.25, z: enemy.spawn.z + Math.sin(patrolAngle) * 1.8 };
      let dx = target.x - enemy.x, dz = target.z - enemy.z;
      const length = Math.hypot(dx, dz);
      if (!enemy.attack && !enemy.stun && length > 0.1) enemy.yaw = Math.atan2(dx, dz);
      if (chase && distance < (this.level.id === 2 ? 1.8 : 1.45) && Math.abs(player.y - enemy.y) < 1.1) this.startAttack(enemy, this.level.id === 2 ? "demon" : "enemy");
      const speed = enemy.attack || enemy.stun || length < 0.15 ? 0 : chase ? (this.level.id === 2 ? 2.05 : 1.85) : 0.6;
      dx = dx / Math.max(length, 0.001) * speed;
      dz = dz / Math.max(length, 0.001) * speed;
      if (enemy.attack && !enemy.stun) {
        const strike = ATTACKS[enemy.attack.kind], t = enemy.attack.elapsed;
        const lunge = t > strike.impact - 0.14 && t < strike.end ? 1.9 : 0;
        dx += Math.sin(enemy.yaw) * lunge;
        dz += Math.cos(enemy.yaw) * lunge;
      }
      this.moveActor(enemy, dx + enemy.velocityX, dz + enemy.velocityZ, dt);
      enemy.mode = enemy.attack ? "enemy" : enemy.speed > 0.1 ? "walk" : "idle";
    }
    this.physics.step();
    this.updateAttack(player, this.enemies, dt);
    for (const enemy of this.enemies) this.updateAttack(enemy, [player], dt);
    if (player.health <= 0) {
      player.mode = "dead";
      this.status = "lost";
      return;
    }
    for (const coin of this.coins) {
      if (coin.collected || Math.hypot(player.x - coin.x, player.z - coin.z) > 0.85 || Math.abs(player.y - coin.y) > 1.25) continue;
      coin.collected = true;
      this.collected += 1;
      this.events.push({ type: "coin", x: coin.x, y: coin.y + 0.85, z: coin.z });
    }
    for (const pickup of this.pickups) {
      if (pickup.collected || Math.hypot(player.x - pickup.x, player.z - pickup.z) > 1 || Math.abs(player.y - pickup.y) > 1.25) continue;
      pickup.collected = true;
      this.inventory.add(pickup.weapon);
      this.pickupNotice = { weapon: pickup.weapon, until: this.time + 4 };
      this.events.push({ type: "pickup", kind: pickup.weapon, x: pickup.x, y: pickup.y + 1, z: pickup.z });
    }
    if (this.collected === this.coins.length) { this.status = "won"; this.events.push({ type: "victory" }); }
  }

  equip(weapon) {
    if (this.status !== "playing" || !this.inventory.has(weapon) || this.player.attack || this.player.stun || this.player.health <= 0) return false;
    this.equipped = this.player.equipped = weapon;
    return true;
  }

  nextLevelOptions() {
    if (this.status !== "won" || !LEVELS.some((level) => level.id === this.level.id + 1)) return null;
    return { level: this.level.id + 1, inventory: [...this.inventory], equipped: this.equipped };
  }

  restart() {
    for (const actor of this.actors) actor.collider.setEnabled(true);
    this.reset();
  }

  snapshot() {
    return { status: this.status, health: this.player.health, coins: this.collected, total: this.coins.length,
      level: this.level.id, levelName: this.level.name, inventory: [...this.inventory], equipped: this.equipped,
      nextLevel: this.status === "won" && this.level.id < LEVELS.length,
      pickup: this.pickupNotice?.until > this.time ? this.pickupNotice.weapon : null,
      defeated: this.enemies.filter((enemy) => enemy.health <= 0).length, enemies: this.enemies.length, time: Math.floor(this.time) };
  }

  cameraDistance(origin, direction, distance) {
    const hit = this.physics.castRay(new RAPIER.Ray(origin, direction), distance, true, undefined, undefined, undefined, undefined,
      (collider) => !collider.parent());
    return hit ? Math.max(0.65, hit.timeOfImpact - 0.3) : distance;
  }

  dispose() {
    this.physics.free();
  }
}
