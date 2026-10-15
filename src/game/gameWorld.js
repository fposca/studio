import RAPIER from "@dimforge/rapier3d-compat";
import { CEMETERY_OBSTACLES, CEMETERY_TORCHES, getLevel, LEVELS, platformPositionAt } from "./gameLevels.js";
import { parthenonColumnPositions } from "../editors/parthenonSet.js";
import { CATACOMB_OBSTACLES, CATACOMB_TORCHES } from "./gameCatacombsLevel.js";
import { INTERIOR_COLUMNS, INTERIOR_OBSTACLES, INTERIOR_TORCHES, questDialogue } from "./gameInteriorLevel.js";
import { ATTACKS, BODY_OFFSET, BOUNDS, FIXED_STEP, GRAVITY, JUMP_SPEED, MAX_HEALTH, MOVE_SPEED, RUN_SPEED, canStrike, movementVector } from "./gameRules.js";

let physicsReady;
export function initializePhysics() {
  return physicsReady ||= RAPIER.init();
}

function platformCollider(width, height, depth) {
  return RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2);
}

export class GameWorld {
  constructor({ level = 1, inventory = ["unarmed"], equipped = "unarmed", score = 0 } = {}) {
    this.level = getLevel(level);
    this.checkpoint = [...new Set(["unarmed", ...inventory.filter((id) => ["sword", "axe", "hammer", "crossbow"].includes(id))])];
    this.checkpointWeapon = this.checkpoint.includes(equipped) ? equipped : "unarmed";
    this.physics = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
    this.physics.timestep = FIXED_STEP;
    this.events = [];
    this.actors = [];
    this.buildTerrain();
    this.player = this.createActor(this.level.spawn, "neonboy");
    this.enemies = this.level.enemies.map((spawn, i) => this.createActor(spawn, `${this.level.enemy}-${i}`));
    this.boss = this.enemies.find((enemy) => enemy.boss) || null;
    this.coins = this.level.coins.map(([x, y, z, platformId], id) => {
      const platform = this.platforms.find((entry) => entry.id === platformId);
      return { x, y, z, id, collected: false, platformId,
        offsetX: platform ? x - platform.definition.x : 0, offsetZ: platform ? z - platform.definition.z : 0 };
    });
    this.pickups = this.level.pickups.map((pickup) => ({ ...pickup, collected: false }));
    this.ammoPickups = (this.level.ammoPickups || []).map((pickup) => ({ ...pickup, readyAt: 0 }));
    this.hearts = this.level.hearts.map((heart) => ({ ...heart, collected: false }));
    this.artifacts = this.level.artifacts.map((artifact) => ({ ...artifact, found: false }));
    this.scoreBase = score;
    this.reset();
  }

  box(x, y, z, width, height, depth) {
    return this.physics.createCollider(RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2).setTranslation(x, y, z));
  }

  buildTerrain() {
    // The controller carries riders explicitly; fixed bodies prevent Rapier from adding a second carry.
    this.platforms = (this.level.platforms || []).map((definition) => {
      const body = this.physics.createRigidBody(RAPIER.RigidBodyDesc.fixed()
        .setTranslation(definition.x, definition.y - definition.height / 2, definition.z));
      const collider = this.physics.createCollider(platformCollider(definition.width, definition.height, definition.depth), body);
      return { ...definition, definition, body, collider, previous: { x: definition.x, y: definition.y, z: definition.z }, dx: 0, dz: 0 };
    });
    this.platformByCollider = new Map(this.platforms.map((platform) => [platform.collider.handle, platform]));
    this.hazards = (this.level.hazards || []).map((definition) => {
      const body = this.physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(definition.x, definition.y, definition.z));
      const collider = this.physics.createCollider(RAPIER.ColliderDesc.cuboid(definition.width / 2, definition.height / 2, definition.depth / 2).setSensor(true), body);
      return { ...definition, body, collider, angle: 0, previousAngle: 0 };
    });
    // An exact plane avoids capsule contact jitter against a very large box.
    this.physics.createCollider(new RAPIER.ColliderDesc(new RAPIER.HalfSpace({ x: 0, y: 1, z: 0 })).setTranslation(0, -0.015, 0));
    const dragon = this.level.dragon;
    this.dragonCollider = dragon ? this.physics.createCollider(RAPIER.ColliderDesc.cylinder(1.4, 0.9)
      .setTranslation(dragon.x, dragon.y + 1.4, dragon.z)) : null;
    this.dragonCollider?.setEnabled(false);
    this.secretDoors = (this.level.secretDoors || []).map((door) => ({ ...door, broken: false,
      collider: this.box(door.x, door.height / 2, door.z, door.width, door.height, door.depth) }));
    if (this.level.id === 4) {
      for (const obstacle of CATACOMB_OBSTACLES) this.box(...obstacle);
      for (const [x, z] of CATACOMB_TORCHES) this.box(x, 0.88, z, 0.74, 1.76, 0.74);
    } else if (this.level.id === 3) {
      for (const obstacle of CEMETERY_OBSTACLES) this.box(...obstacle);
      for (const [x, z] of CEMETERY_TORCHES) this.box(x, 0.88, z, 0.74, 1.76, 0.74);
    } else if (this.level.id === 2) {
      for (const obstacle of INTERIOR_OBSTACLES) this.box(...obstacle);
      for (const [x, z] of INTERIOR_TORCHES) {
        this.physics.createCollider(RAPIER.ColliderDesc.cylinder(0.84, 0.42).setTranslation(x, 0.84, z));
      }
      for (const [x, z] of INTERIOR_COLUMNS) {
        this.physics.createCollider(RAPIER.ColliderDesc.cylinder(4, 0.65).setTranslation(x, 4, z));
      }
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
    const scale = spawn.scale || 1, bodyOffset = BODY_OFFSET * scale;
    const body = this.physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(spawn.x, spawn.y + bodyOffset, spawn.z));
    const collider = this.physics.createCollider(RAPIER.ColliderDesc.capsule(0.58 * scale, 0.32 * scale), body);
    const controller = this.physics.createCharacterController(0.015);
    controller.enableAutostep(0.29, 0.16, false);
    controller.enableSnapToGround(0.3);
    controller.setMaxSlopeClimbAngle(Math.PI / 4);
    controller.setMinSlopeSlideAngle(Math.PI / 3);
    const actor = { id, spawn, body, collider, controller, bodyOffset, boss: Boolean(spawn.boss) };
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
    this.ammoNotice = 0;
    this.questStage = this.level.quest ? "unstarted" : null;
    this.adviceIndex = 0;
    this.dragonMet = false;
    this.dragonDepartureTime = null;
    this.ammo = this.level.id === 4 ? 10 : 0;
    this.arrows = [];
    this.ammoPickups.forEach((pickup) => { pickup.readyAt = 0; });
    this.dialogue = null;
    this.secretDoors.forEach((door) => { door.broken = false; door.collider.setEnabled(true); });
    this.jumpBuffer = 0;
    this.coyoteTime = 0;
    for (const actor of this.actors) {
      const maxHealth = actor === this.player ? MAX_HEALTH : actor.spawn.maxHealth || this.level.enemyHealth;
      Object.assign(actor, { ...actor.spawn, yaw: Math.PI, health: maxHealth, maxHealth,
        velocityY: 0, velocityX: 0, velocityZ: 0, speed: 0, grounded: false, attack: null, landing: 0,
        cooldown: 0, invulnerable: 0, stun: 0, deadTime: 0, combo: 0, mode: "idle", combat: 0, running: false,
        platformId: null, active: !actor.boss,
        equipped: actor === this.player ? this.equipped : "unarmed", species: actor === this.player ? "neonboy" : actor.spawn.species || this.level.enemy });
      actor.collider.setEnabled(actor.active);
      const position = { x: actor.x, y: actor.y + actor.bodyOffset, z: actor.z };
      actor.body.setTranslation(position, true);
      actor.body.setNextKinematicTranslation(position);
    }
    this.coins.forEach((coin) => { coin.collected = false; });
    this.pickups.forEach((pickup) => { pickup.collected = this.inventory.has(pickup.weapon); });
    this.hearts.forEach((heart) => { heart.collected = false; });
    this.artifacts.forEach((artifact) => { artifact.found = false; });
    this.updateChallenges(true);
    this.physics.step();
  }

  updateChallenges(teleport = false) {
    for (const platform of this.platforms) {
      const next = platformPositionAt(platform.definition, this.time);
      platform.previous = teleport ? { ...next } : { x: platform.x, y: platform.y, z: platform.z };
      platform.dx = next.x - platform.previous.x;
      platform.dz = next.z - platform.previous.z;
      Object.assign(platform, next);
      const position = { x: next.x, y: next.y - platform.height / 2, z: next.z };
      platform.body.setTranslation(position, true);
    }
    for (const hazard of this.hazards) {
      const angle = hazard.period ? this.time * Math.PI * 2 / hazard.period : 0;
      hazard.previousAngle = teleport ? angle : hazard.angle;
      hazard.angle = angle;
      const rotation = { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) };
      if (teleport) hazard.body.setRotation(rotation, true);
      hazard.body.setNextKinematicRotation(rotation);
    }
    for (const coin of this.coins) {
      const platform = this.platforms.find((entry) => entry.id === coin.platformId);
      if (platform) { coin.x = platform.x + coin.offsetX; coin.y = platform.y; coin.z = platform.z + coin.offsetZ; }
    }
    if (this.dragonCollider && this.dragonCollider.isEnabled() !== (this.time >= this.level.dragon.landingTime && !this.dragonMet))
      this.dragonCollider.setEnabled(this.time >= this.level.dragon.landingTime && !this.dragonMet);
    this.physics.propagateModifiedBodyPositionsToColliders();
  }

  separateActorsFromPlatforms() {
    // A fixed slab can move into an idle kinematic actor. The controller only
    // checks requested movement, so clear those overlaps before its next step.
    for (const actor of this.actors) {
      if (!actor.active || actor.health <= 0) continue;
      const scale = actor.spawn.scale || 1;
      const radius = 0.32 * scale;
      for (const platform of this.platforms) {
        if (actor.platformId === platform.id && actor.grounded) continue;
        if (actor.y >= platform.y - 0.06 || actor.y + 1.8 * scale <= platform.y - platform.height + 0.02) continue;
        const overlapX = platform.width / 2 + radius - Math.abs(actor.x - platform.x);
        const overlapZ = platform.depth / 2 + radius - Math.abs(actor.z - platform.z);
        if (overlapX <= 0 || overlapZ <= 0) continue;
        if (overlapX < overlapZ) actor.x += (actor.x < platform.x ? -1 : 1) * (overlapX + 0.025);
        else actor.z += (actor.z < platform.z ? -1 : 1) * (overlapZ + 0.025);
        const position = { x: actor.x, y: actor.y + actor.bodyOffset, z: actor.z };
        actor.body.setTranslation(position, true);
        actor.body.setNextKinematicTranslation(position);
      }
    }
    this.physics.propagateModifiedBodyPositionsToColliders();
  }

  startAttack(actor, kind) {
    if (actor === this.player) {
      if (!["punch", "kick"].includes(kind)) return false;
      if (kind === "punch" && this.equipped !== "unarmed") kind = this.equipped;
    }
    if (!ATTACKS[kind]) return false;
    if (actor.health <= 0 || actor.attack || actor.cooldown > 0 || actor.stun > 0) return false;
    if (actor === this.player && kind === "crossbow") {
      if (!this.ammo) { this.events.push({ type: "empty", x: actor.x, y: actor.y + 1, z: actor.z }); return false; }
      this.ammo--;
      actor.yaw = this.aimYaw ?? actor.yaw;
    }
    if (actor === this.player && this.firstPerson) actor.yaw = this.aimYaw;
    if (actor === this.player && kind !== "crossbow" && !this.firstPerson) {
      const nearest = this.enemies.filter((enemy) => enemy.active && enemy.health > 0 && Math.hypot(enemy.x - actor.x, enemy.z - actor.z) < ATTACKS[kind].reach + 0.35 && this.hasLineOfSight(actor, enemy))
        .sort((a, b) => Math.hypot(a.x - actor.x, a.z - actor.z) - Math.hypot(b.x - actor.x, b.z - actor.z))[0];
      if (nearest) actor.yaw = Math.atan2(nearest.x - actor.x, nearest.z - actor.z);
    }
    actor.combo += 1;
    actor.combat = 2.2;
    actor.attack = { kind, elapsed: 0, hit: new Set(), variant: (actor.combo - 1) % 3,
      side: ["sword", "axe", "hammer", "crossbow", "mummyChief"].includes(kind) ? "Right" : actor.combo % 2 ? "Left" : "Right" };
    this.events.push({ type: "attack", actor: actor.id, kind, x: actor.x, y: actor.y + 1, z: actor.z });
    return true;
  }

  hasLineOfSight(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    const length = Math.hypot(dx, dy, dz);
    if (length < 0.001) return true;
    const ray = new RAPIER.Ray({ x: from.x, y: from.y + 1, z: from.z }, { x: dx / length, y: dy / length, z: dz / length });
    return !this.physics.castRay(ray, length, true, undefined, undefined, undefined, undefined,
      (collider) => !collider.isSensor() && (!collider.parent() || this.platformByCollider.has(collider.handle)));
  }

  moveActor(actor, dx, dz, dt) {
    const platform = actor.grounded && this.platforms.find((entry) => entry.id === actor.platformId);
    const carryX = platform ? platform.dx : 0, carryZ = platform ? platform.dz : 0;
    const falling = actor === this.player && !actor.grounded && actor.velocityY < 0;
    actor.velocityY = Math.max(-18, actor.velocityY - GRAVITY * (falling ? 1.2 : 1) * dt);
    if (actor.grounded && actor.velocityY < 0) actor.velocityY = -2;
    actor.controller.computeColliderMovement(actor.collider, { x: dx * dt + carryX, y: actor.velocityY * dt, z: dz * dt + carryZ },
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS);
    const movement = actor.controller.computedMovement();
    actor.grounded = actor.controller.computedGrounded();
    if (actor.grounded && actor.velocityY < 0) actor.velocityY = 0;
    if (actor.velocityY > 0 && movement.y < actor.velocityY * dt - 0.01) actor.velocityY = 0;
    const before = actor.body.translation();
    actor.body.setNextKinematicTranslation({ x: before.x + movement.x, y: before.y + movement.y, z: before.z + movement.z });
    actor.x = before.x + movement.x;
    actor.y = before.y + movement.y - actor.bodyOffset;
    actor.z = before.z + movement.z;
    actor.speed = Math.hypot(movement.x - carryX, movement.z - carryZ) / dt;
    actor.platformId = null;
    if (actor.grounded) for (let i = 0; i < actor.controller.numComputedCollisions(); i++) {
      const contact = actor.controller.computedCollision(i);
      const support = this.platformByCollider.get(contact.collider?.handle);
      if (support && contact.normal1.y > 0.5) { actor.platformId = support.id; break; }
    }
  }

  damage(victim, attacker, definition) {
    if (victim.health <= 0 || victim.invulnerable > 0) return;
    const previousHealth = victim.health;
    victim.health = Math.max(0, victim.health - definition.damage);
    victim.invulnerable = victim === this.player ? 0.85 : 0.2;
    victim.stun = victim.boss ? 0.08 : 0.28;
    if (!victim.boss || !victim.health) victim.attack = null;
    const angle = Math.atan2(victim.x - attacker.x, victim.z - attacker.z);
    const knockback = definition.knockback * (victim.stationary ? 0 : victim.boss ? 0.2 : 1);
    victim.velocityX = Math.sin(angle) * knockback;
    victim.velocityZ = Math.cos(angle) * knockback;
    victim.combat = 2.2;
    this.events.push({ type: victim.health ? "hit" : "defeat", kind: definition.kind || attacker.attack?.kind || "punch", actor: victim.id, amount: previousHealth - victim.health, previousHealth, x: victim.x, y: victim.y + 1, z: victim.z });
    if (!victim.health) victim.mode = "dead";
  }

  updateAttack(actor, targets, dt) {
    const attack = actor.attack;
    if (!attack) return;
    const definition = ATTACKS[attack.kind];
    attack.elapsed += dt;
    if (attack.kind === "crossbow" && !attack.fired && attack.elapsed >= definition.impact) {
      attack.fired = true;
      this.arrows.push({ x: actor.x, y: actor.y + (this.firstPerson ? 1.62 : 1.3),
        z: actor.z, yaw: actor.yaw, pitch: this.firstPerson ? this.aimPitch : 0, age: 0 });
      this.events.push({ type: "shot", x: actor.x, y: actor.y + 1.3, z: actor.z });
    }
    if (actor === this.player && this.firstPerson && attack.kind === "hammer" && !attack.impacted && attack.elapsed >= definition.impact) {
      attack.impacted = true;
      this.events.push({ type: "hammerImpact", actor: actor.id, x: actor.x + Math.sin(actor.yaw) * 1.15,
        y: actor.y + 0.5, z: actor.z + Math.cos(actor.yaw) * 1.15 });
    }
    if (attack.kind !== "crossbow" && attack.elapsed >= definition.impact && attack.elapsed <= definition.end) {
      if (actor === this.player && ["hammer", "axe"].includes(attack.kind)) {
        for (const door of this.secretDoors) {
          if (door.broken || attack.kind !== (door.breakWith || "hammer") || !canStrike(actor, door, definition)) continue;
          door.broken = true;
          door.collider.setEnabled(false);
          this.events.push({ type: "secret", x: door.x, y: 1, z: door.z });
        }
      }
      for (const target of targets) {
        if (!target.active || target.health <= 0 || attack.hit.has(target.id) || !canStrike(actor, target, definition) || !this.hasLineOfSight(actor, target)) continue;
        attack.hit.add(target.id);
        this.damage(target, actor, definition);
      }
    }
    if (attack.elapsed >= definition.duration) {
      actor.attack = null;
      actor.cooldown = actor === this.player ? 0.07 : 0.42;
    }
  }

  updateArrows(dt) {
    const speed = 23;
    this.arrows = this.arrows.filter((arrow) => {
      const distance = speed * dt;
      const pitch = arrow.pitch || 0;
      const dx = Math.sin(arrow.yaw) * Math.cos(pitch), dy = Math.sin(pitch), dz = Math.cos(arrow.yaw) * Math.cos(pitch);
      const ray = new RAPIER.Ray({ x: arrow.x, y: arrow.y, z: arrow.z }, { x: dx, y: dy, z: dz });
      // One nearest-hit ray handles walls and actors in 3D, including elevated targets.
      const wall = this.physics.castRay(ray, distance, true, undefined, undefined, undefined, undefined,
        (collider) => !collider.isSensor() && (!collider.parent() || this.platformByCollider.has(collider.handle) ||
          this.enemies.some((enemy) => enemy.active && enemy.health > 0 && enemy.collider.handle === collider.handle)));
      const hitEnemy = wall && this.enemies.find((enemy) => enemy.collider.handle === wall.collider.handle);
      if (hitEnemy) {
        this.damage(hitEnemy, this.player, { ...ATTACKS.crossbow, kind: "crossbow" });
        return false;
      }
      if (wall) {
        const door = this.secretDoors.find((entry) => entry.collider.handle === wall.collider?.handle);
        if (door && !door.broken && door.breakWith === "crossbow") {
          door.broken = true; door.collider.setEnabled(false);
          this.events.push({ type: "secret", x: door.x, y: 1.6, z: door.z });
        }
        return false;
      }
      arrow.x += dx * distance; arrow.y += dy * distance; arrow.z += dz * distance; arrow.age += dt;
      return arrow.age < 1.35;
    });
  }

  step(input = {}, dt = FIXED_STEP) {
    if (this.status !== "playing" || this.dialogue) return;
    const dragon = this.level.dragon;
    if (dragon && !this.dragonMet && this.time >= dragon.landingTime &&
      Math.hypot(this.player.x - dragon.x, this.player.z - dragon.z) < 3.6 &&
      Math.abs(this.player.y - dragon.y) < 1.8) {
      this.dialogue = { speaker: "Drag\u00f3n", title: "Un amigo entre las nubes",
        text: "Soy tu amigo, Neonboy. Te vi subir desde el Parten\u00f3n. Segu\u00ed tu camino: volveremos a encontrarnos en los pr\u00f3ximos niveles.",
        action: "Hasta pronto", dragon: true };
      this.events.push({ type: "dialogue" });
      return;
    }
    const quest = this.level.quest;
    if (quest && ["unstarted", "returning"].includes(this.questStage) &&
      Math.hypot(this.player.x - quest.x, this.player.z - quest.z) < 3.25 && Math.abs(this.player.y - quest.y) < 1.5) {
      this.dialogue = questDialogue(this.questStage);
      this.events.push({ type: "dialogue" });
      return;
    }
    const advisor = this.level.advisor;
    if (advisor && this.adviceIndex < advisor.tips.length &&
      (this.adviceIndex === 0 ? Math.hypot(this.player.x - advisor.x, this.player.z - advisor.z) < 4.7 :
        this.adviceIndex === 1 ? this.player.z < -12 : this.player.z < -31)) {
      this.dialogue = { speaker: "Platon", ...advisor.tips[this.adviceIndex], advisor: true };
      this.events.push({ type: "dialogue" });
      return;
    }
    this.time += dt;
    this.aimYaw = (input.yaw || 0) + Math.PI;
    this.firstPerson = Boolean(input.firstPerson);
    this.aimPitch = Math.max(-1.25, Math.min(1.25, input.aimPitch || 0));
    if (this.firstPerson) this.player.yaw = this.aimYaw;
    this.updateChallenges();
    this.separateActorsFromPlatforms();
    for (const actor of this.actors) {
      actor.invulnerable = Math.max(0, actor.invulnerable - dt);
      actor.cooldown = Math.max(0, actor.cooldown - dt);
      actor.stun = Math.max(0, actor.stun - dt);
      actor.combat = Math.max(0, actor.combat - dt);
      actor.landing = Math.max(0, actor.landing - dt);
      actor.velocityX *= Math.exp(-8 * dt);
      actor.velocityZ *= Math.exp(-8 * dt);
    }
    const player = this.player;
    if (input.equip) this.equip(input.equip);
    this.jumpBuffer = input.jump ? 0.12 : Math.max(0, this.jumpBuffer - dt);
    this.coyoteTime = player.grounded ? 0.08 : Math.max(0, this.coyoteTime - dt);
    if (this.jumpBuffer > 0 && this.coyoteTime > 0 && !player.stun && player.health > 0) {
      player.velocityY = JUMP_SPEED;
      player.grounded = false;
      player.landing = 0;
      this.jumpBuffer = this.coyoteTime = 0;
      this.events.push({ type: "jump" });
      player.platformId = null;
    }
    if (input.attack) this.startAttack(player, input.attack);
    const motion = movementVector(input.x || 0, input.z || 0, input.yaw || 0);
    const pace = (input.run ? RUN_SPEED : MOVE_SPEED) * (player.attack ? 0.23 : 1) * (player.stun ? 0 : 1);
    if (this.equipped === "crossbow" && !player.attack) player.yaw = this.aimYaw;
    if (Math.hypot(motion.x, motion.z) > 0.05 && !player.attack && !player.stun && this.equipped !== "crossbow" && !this.firstPerson) {
      const desired = Math.atan2(motion.x, motion.z);
      player.yaw += Math.atan2(Math.sin(desired - player.yaw), Math.cos(desired - player.yaw)) * Math.min(1, 16 * dt);
    }
    const wasAirborne = !player.grounded && player.velocityY < -2;
    this.moveActor(player, motion.x * pace + player.velocityX, motion.z * pace + player.velocityZ, dt);
    if (wasAirborne && player.grounded) { player.landing = 0.24; this.events.push({ type: "land" }); }
    player.running = Boolean(input.run && player.grounded && !player.attack && !player.stun && player.speed > MOVE_SPEED + 0.1);
    player.mode = player.attack?.kind || (!player.grounded ? "jump" : player.running ? "run" : player.speed > 0.1 ? "walk" : "idle");
    for (const [index, enemy] of this.enemies.entries()) {
      if (enemy.health <= 0) {
        enemy.deadTime += dt;
        enemy.collider.setEnabled(false);
        continue;
      }
      if (!enemy.active) continue;
      const demon = enemy.species === "demon";
      const attackKind = enemy.species === "mummyChief" ? "mummyChief" : enemy.species === "zombieBoss" ? (enemy.combo % 2 ? "zombieCrush" : "zombieSweep") :
        ["hoplite", "statue", "medusa", "zombie", "mummy"].includes(enemy.species) ? enemy.species : enemy.boss ? "boss" : demon ? "demon" : "enemy";
      const distance = Math.hypot(player.x - enemy.x, player.z - enemy.z);
      const chase = distance < (enemy.boss ? 13 : demon ? 10 : enemy.species === "zombie" ? 9.5 : 8.5) && player.health > 0 && this.hasLineOfSight(enemy, player);
      const patrolAngle = this.time * 0.24 + index * 1.5;
      const target = chase ? player : { x: enemy.spawn.x + Math.cos(patrolAngle) * 1.25, z: enemy.spawn.z + Math.sin(patrolAngle) * 1.8 };
      let dx = target.x - enemy.x, dz = target.z - enemy.z;
      const length = Math.hypot(dx, dz);
      if (!enemy.attack && !enemy.stun && length > 0.1 && (!enemy.stationary || chase)) enemy.yaw = Math.atan2(dx, dz);
      if (chase && distance < ATTACKS[attackKind].reach - 0.25 && Math.abs(player.y - enemy.y) < 1.1) this.startAttack(enemy, attackKind);
      const speed = enemy.stationary || enemy.attack || enemy.stun || length < 0.15 ? 0 : chase ? (enemy.boss ? 2.25 : demon ? 2.05 : enemy.species === "zombie" ? 1.7 : 1.85) : 0.6;
      dx = dx / Math.max(length, 0.001) * speed;
      dz = dz / Math.max(length, 0.001) * speed;
      if (enemy.attack && !enemy.stun && !enemy.stationary) {
        const strike = ATTACKS[enemy.attack.kind], t = enemy.attack.elapsed;
        const lunge = t > strike.impact - 0.14 && t < strike.end ? enemy.boss ? 2.8 : 1.9 : 0;
        dx += Math.sin(enemy.yaw) * lunge;
        dz += Math.cos(enemy.yaw) * lunge;
      }
      this.moveActor(enemy, dx + enemy.velocityX, dz + enemy.velocityZ, dt);
      enemy.mode = enemy.attack ? "enemy" : enemy.speed > 0.1 ? "walk" : "idle";
    }
    this.physics.step();
    this.updateAttack(player, this.enemies, dt);
    for (const enemy of this.enemies) this.updateAttack(enemy, [player], dt);
    this.updateArrows(dt);
    for (const hazard of this.hazards) {
      if (player.collider.intersectsShape(hazard.collider.shape, hazard.collider.translation(), hazard.collider.rotation())) {
        this.damage(player, hazard, { damage: hazard.damage, knockback: 2 });
      }
    }
    if (player.health <= 0) {
      player.mode = "dead";
      this.status = "lost";
      return;
    }
    for (const coin of this.coins) {
      if (coin.collected || Math.hypot(player.x - coin.x, player.z - coin.z) > 0.85 || Math.abs(player.y - coin.y) > (coin.platformId ? 0.6 : 1.25)) continue;
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
    for (const pickup of this.ammoPickups) {
      if (this.time < pickup.readyAt || this.ammo >= 10 || !this.inventory.has("crossbow") ||
        Math.hypot(player.x - pickup.x, player.z - pickup.z) > 0.95 || Math.abs(player.y - pickup.y) > 1.25) continue;
      this.ammo = Math.min(10, this.ammo + pickup.amount);
      pickup.readyAt = this.time + 22;
      this.ammoNotice = this.time + 2.5;
      this.events.push({ type: "ammo", amount: pickup.amount, x: pickup.x, y: pickup.y + 0.8, z: pickup.z });
    }
    for (const heart of this.hearts) {
      if (heart.collected || player.health >= player.maxHealth ||
        Math.hypot(player.x - heart.x, player.z - heart.z) > 0.9 || Math.abs(player.y - heart.y) > 1.25) continue;
      const restored = Math.min(player.maxHealth - player.health, player.maxHealth * 0.25);
      player.health += restored;
      heart.collected = true;
      this.events.push({ type: "heal", amount: restored, x: heart.x, y: heart.y + 0.85, z: heart.z });
    }
    let foundArtifact = false;
    for (const artifact of this.artifacts) {
      if (!this.artifactAvailable(artifact) || Math.hypot(player.x - artifact.x, player.z - artifact.z) > 1.05 || Math.abs(player.y - artifact.y) > 1.25) continue;
      artifact.found = true;
      if (artifact.questItem) this.questStage = "returning";
      foundArtifact = true;
      this.events.push({ type: "discovery", id: artifact.id, x: artifact.x, y: artifact.y + 1, z: artifact.z });
    }
    const guardsDefeated = this.enemies.every((enemy) => enemy.boss || enemy.health <= 0);
    if (quest) {
      if (guardsDefeated && this.questStage === "searching" && player.z < -26 && this.boss.health > 0 && !this.boss.active) this.activateBoss();
    } else {
      if (guardsDefeated && this.boss?.health > 0 && !this.boss.active) this.activateBoss();
      if (this.collected === this.coins.length && (!this.boss || this.boss.health <= 0) && !foundArtifact) {
        this.status = "won"; this.events.push({ type: "victory" });
      }
    }
  }

  activateBoss() {
    this.boss.active = true;
    this.boss.cooldown = 1.2;
    this.boss.collider.setEnabled(true);
    this.events.push({ type: "boss", x: this.boss.x, y: this.boss.y, z: this.boss.z });
  }

  artifactAvailable(artifact) {
    return !artifact.found && (!artifact.secret || this.secretDoors.some((door) => door.id === artifact.secret && door.broken)) &&
      (!artifact.questItem || (this.questStage === "searching" && this.boss?.health <= 0));
  }

  answerDialogue() {
    if (!this.dialogue) return false;
    const advisor = this.dialogue.advisor;
    const dragon = this.dialogue.dragon;
    this.dialogue = null;
    if (dragon) { this.dragonMet = true; this.dragonDepartureTime = this.time; this.dragonCollider?.setEnabled(false); return true; }
    if (advisor) { this.adviceIndex++; return true; }
    if (this.questStage === "unstarted") this.questStage = "searching";
    else if (this.questStage === "returning") {
      this.questStage = "complete";
      this.status = "won";
      this.events.push({ type: "victory" });
    }
    return true;
  }

  equip(weapon) {
    if (this.status !== "playing" || !this.inventory.has(weapon) || this.player.attack || this.player.stun || this.player.health <= 0) return false;
    this.equipped = this.player.equipped = weapon;
    return true;
  }

  nextLevelOptions() {
    if (this.status !== "won" || !LEVELS.some((level) => level.id === this.level.id + 1)) return null;
    return { level: this.level.id + 1, inventory: [...this.inventory], equipped: this.equipped, score: this.snapshot().score };
  }

  restart() {
    for (const actor of this.actors) actor.collider.setEnabled(true);
    this.reset();
  }

  snapshot() {
    return { status: this.status, health: this.player.health, coins: this.collected, total: this.coins.length,
      level: this.level.id, levelName: this.level.name, inventory: [...this.inventory], equipped: this.equipped,
      score: this.scoreBase + this.artifacts.reduce((sum, artifact) => sum + (artifact.found ? artifact.points : 0), 0) +
        (this.questStage === "complete" ? this.level.quest.reward : 0),
      quest: this.questStage ? { stage: this.questStage, text: { unstarted: "Habla con Platon", searching: "Recupera el Sello de Atenea", returning: "Regresa con Platon", complete: "Sello entregado" }[this.questStage] } : null,
      dialogue: this.dialogue, dragonMet: this.dragonMet, guardsRemaining: this.enemies.filter((enemy) => !enemy.boss && enemy.health > 0).length, ammo: this.ammo, ammoNotice: this.ammoNotice > this.time, maxAmmo: this.level.id === 4 ? 10 : 0, secrets: this.secretDoors.filter((door) => door.broken).length,
      discoveries: this.artifacts.filter((artifact) => artifact.found).length, discoveryTotal: this.artifacts.length,
      nextLevel: this.status === "won" && this.level.id < LEVELS.length,
      nextLevelName: LEVELS.find((level) => level.id === this.level.id + 1)?.name,
      boss: this.boss ? { name: this.boss.spawn.name, active: this.boss.active, health: this.boss.health,
        maxHealth: this.boss.maxHealth, attack: this.boss.attack?.kind || null, distance: Math.round(Math.hypot(this.player.x - this.boss.x, this.player.z - this.boss.z)) } : null,
      pickup: this.pickupNotice?.until > this.time ? this.pickupNotice.weapon : null,
      defeated: this.enemies.filter((enemy) => enemy.health <= 0).length, enemies: this.enemies.length, time: Math.floor(this.time) };
  }

  serialize() {
    if (this.status !== "playing" || this.player.health <= 0) throw new Error("Solo se puede guardar una partida en curso.");
    const serializeActor = ({ x, y, z, yaw, health, velocityY, grounded }) => ({ x, y, z, yaw, health, velocityY, grounded });
    return { level: this.level.id, layoutVersion: 3, inventory: [...this.inventory], equipped: this.equipped,
      questStage: this.questStage, adviceIndex: this.adviceIndex, dragonMet: this.dragonMet, dragonDepartureTime: this.dragonDepartureTime, ammo: this.ammo,
      ammoPickups: this.ammoPickups.map((pickup) => ({ id: pickup.id, readyAt: pickup.readyAt })), bossActive: this.boss?.active || false, secretDoors: this.secretDoors.filter((door) => door.broken).map((door) => door.id),
      checkpoint: [...this.checkpoint], checkpointWeapon: this.checkpointWeapon, time: this.time,
      player: serializeActor(this.player), enemies: this.enemies.map(serializeActor),
      coins: this.coins.filter((coin) => coin.collected).map((coin) => coin.id),
      hearts: this.hearts.filter((heart) => heart.collected).map((heart) => heart.id),
      artifacts: this.artifacts.filter((artifact) => artifact.found).map((artifact) => artifact.id), scoreBase: this.scoreBase };
  }

  restore(saved) {
    // Called on a fresh world after schema validation, so physics handles are never deserialized.
    if (saved.level !== this.level.id) throw new Error("El nivel guardado no coincide.");
    this.inventory = new Set(saved.inventory);
    this.equipped = this.player.equipped = saved.equipped;
    this.checkpoint = [...saved.checkpoint];
    this.checkpointWeapon = saved.checkpointWeapon;
    this.time = saved.time;
    this.questStage = saved.questStage ?? this.questStage;
    this.adviceIndex = saved.adviceIndex ?? 0;
    this.dragonMet = saved.dragonMet ?? false;
    this.dragonDepartureTime = saved.dragonDepartureTime ?? (this.dragonMet ? 0 : null);
    this.ammo = saved.ammo ?? (this.level.id === 4 ? 10 : 0);
    this.ammoPickups.forEach((pickup) => { pickup.readyAt = saved.ammoPickups?.find((entry) => entry.id === pickup.id)?.readyAt ?? 0; });
    this.arrows = [];
    this.secretDoors.forEach((door) => { door.broken = saved.secretDoors?.includes(door.id) || false; door.collider.setEnabled(!door.broken); });
    this.updateChallenges(true);
    this.coins.forEach((coin) => { coin.collected = saved.coins.includes(coin.id); });
    this.hearts.forEach((heart) => { heart.collected = saved.hearts?.includes(heart.id) || false; });
    this.collected = saved.coins.length;
    this.scoreBase = saved.scoreBase;
    this.artifacts.forEach((artifact) => { artifact.found = saved.artifacts.includes(artifact.id); });
    this.pickups.forEach((pickup) => { pickup.collected = this.inventory.has(pickup.weapon); });
    this.actors.forEach((actor, index) => {
      Object.assign(actor, index === 0 ? saved.player : saved.enemies[index - 1]);
      actor.cooldown = 0.4;
      actor.invulnerable = index === 0 ? 0.4 : 0;
      actor.deadTime = actor.health <= 0 ? 3 : 0;
      actor.mode = actor.health <= 0 ? "dead" : actor.grounded ? "idle" : "jump";
      actor.active = !actor.boss || saved.bossActive;
      actor.collider.setEnabled(actor.health > 0 && actor.active);
      actor.platformId = actor.grounded ? this.platforms.find((platform) => Math.abs(actor.y - platform.y) < 0.1
        && Math.abs(actor.x - platform.x) < platform.width / 2 + 0.2 && Math.abs(actor.z - platform.z) < platform.depth / 2 + 0.2)?.id || null : null;
      const position = { x: actor.x, y: actor.y + actor.bodyOffset, z: actor.z };
      actor.body.setTranslation(position, true);
      actor.body.setNextKinematicTranslation(position);
    });
    this.physics.step();
  }

  cameraDistance(origin, direction, distance) {
    const hit = this.physics.castRay(new RAPIER.Ray(origin, direction), distance, true, undefined, undefined, undefined, undefined,
      (collider) => !collider.isSensor() && (!collider.parent() || this.platformByCollider.has(collider.handle)));
    return hit ? Math.max(0.65, hit.timeOfImpact - 0.3) : distance;
  }

  dispose() {
    this.physics.free();
  }
}
