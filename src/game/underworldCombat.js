import * as THREE from "three";
import { segmentSphereHit } from "./neonOrbLogic.js";
import { UNDERWORLD_PYLONS } from "./underworldLayout.js";
import { createEnemyOrbVisual } from "./enemyOrbVisuals.js";
import { createOrbGlowTexture, createPlasmaOrb } from "./neonOrbVisuals.js";
import { disposeObjects } from "./disposeGameObjects.js";

const STYLES = {
  centinela: { slots: 4, size: 1.45, palette: {
    accent: 0xff3d9e, deep: 0x340b29, glow: 0xe73b93, arc: 0xffc1e2, tail: 0x911e91,
  } },
  gargola: { slots: 6, size: 1.6, flame: true, palette: {
    accent: 0xff8b23, deep: 0x461308, glow: 0xff751c, arc: 0xffdd97, tail: 0xb32608,
  } },
  testigo: { slots: 4, size: 1.7, palette: {
    accent: 0xb56aff, deep: 0x1d0c3c, glow: 0x9a4ce2, arc: 0xe4ceff, tail: 0x5c27b3,
  } },
};

export function createEnemyHealthBar(actor) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 112;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true,
    depthWrite: false, depthTest: true, sizeAttenuation: false, fog: false, toneMapped: false });
  const sprite = new THREE.Sprite(material);
  sprite.name = `${actor.name} / barra de vida`;
  sprite.position.y = actor.height + .18;
  sprite.scale.set(window.innerWidth < 900 ? .34 : .22, window.innerWidth < 900 ? .075 : .05, 1);
  sprite.raycast = () => {};
  actor.group.add(sprite);
  const accent = actor.type === "gargola" ? "#ffad60" : actor.type === "testigo" ? "#cf97ff" : "#ff7eb8";
  const label = actor.type === "centinela" ? (actor.id.endsWith("0") ? "CENTINELA I" : "CENTINELA II")
    : actor.type === "gargola" ? "GÁRGOLA" : "TESTIGO";
  function update(remaining) {
    const ratio = THREE.MathUtils.clamp(remaining / actor.maxHp, 0, 1);
    context.clearRect(0, 0, 512, 112);
    context.fillStyle = "rgba(13,9,23,.9)";
    context.fillRect(4, 4, 504, 104);
    context.strokeStyle = accent;
    context.lineWidth = 3;
    context.strokeRect(5, 5, 502, 102);
    context.font = "bold 34px Arial, sans-serif";
    context.fillStyle = "#fff1e8";
    context.fillText(label, 22, 41);
    context.textAlign = "right";
    context.fillStyle = accent;
    context.fillText(`${remaining}/${actor.maxHp}`, 490, 41);
    context.textAlign = "left";
    context.fillStyle = "#3a293a";
    context.fillRect(22, 62, 468, 23);
    const fill = context.createLinearGradient(22, 0, 490, 0);
    fill.addColorStop(0, accent);
    fill.addColorStop(1, "#fff1c9");
    context.fillStyle = fill;
    context.fillRect(22, 62, 468 * ratio, 23);
    texture.needsUpdate = true;
  }
  return { sprite, update };
}

// Prefer a flank beside the player, never the lava or an invisible bridge.
export function chooseEnemyReappearance(actor, player, visionActive, canStand) {
  const towardEnemy = Math.atan2(actor.group.position.x - player.x, actor.group.position.z - player.z);
  for (const turn of [1.15, -1.15, 2.05, -2.05, 0]) {
    const angle = towardEnemy + turn;
    for (const radius of [3.4, 2.8]) {
      const x = player.x + Math.sin(angle) * radius;
      const z = player.z + Math.cos(angle) * radius;
      if (Math.abs(z - actor.homeZ) <= 13 && canStand(x, z, visionActive, 1.45)) return { x, z };
    }
  }
  return null;
}

export function createUnderworldCombat(root, onDamage) {
  const effects = new THREE.Group();
  effects.name = "Combate del Inframundo / orbes, fuego y avisos";
  root.add(effects);
  const texture = createOrbGlowTexture();
  // Enough slots for overlapping volleys and their fading impacts. Allocate once,
  // so repeated attacks do not create textures, lights or geometry during combat.
  const shots = Object.entries(STYLES).flatMap(([type, style]) =>
    Array.from({ length: style.slots }, (_, index) => {
      const visual = createEnemyOrbVisual(texture, index * 1.7, style);
      visual.root.name = type === "gargola" ? "Llama infernal" : "Orbe hostil / " + type;
      effects.add(visual.root);
      return { type, visual, active: false, owner: null, direction: new THREE.Vector3(), life: 0, speed: 0 };
    }),
  );
  const chargeRoots = [];
  const previous = new THREE.Vector3(), destination = new THREE.Vector3();
  const target = new THREE.Vector3(), source = new THREE.Vector3();
  let clock = 0;

  function createCharge(type) {
    const style = STYLES[type];
    const plasma = createPlasmaOrb({ radius: .14, texture });
    plasma.setPalette(style.palette);
    plasma.root.name = "Aviso de ataque a distancia / plasma";
    plasma.root.position.set(0, 1.4, .45);
    plasma.root.visible = false;
    chargeRoots.push(plasma.root);
    function update(progress, elapsed, reducedMotion = false) {
      // Gather energy before launch, then contract instead of lingering as a
      // second projectile in front of the enemy.
      const energy = progress < .71 ? progress / .71 : (1 - progress) / .29;
      plasma.root.scale.setScalar(style.size * (.35 + .85 * energy));
      plasma.update(reducedMotion ? 0 : elapsed, .8 + energy * .6);
    }
    return { root: plasma.root, update };
  }

  function fire(actor, player) {
    const count = actor.type === "gargola" ? 3 : actor.type === "testigo" ? 2 : 1;
    source.set(actor.group.position.x, 1.4, actor.group.position.z);
    const heading = Math.atan2(player.x - source.x, player.z - source.z);
    for (let index = 0; index < count; index++) {
      const available = shot => shot.type === actor.type && !shot.active;
      const shot = shots.find(shot => available(shot) && !shot.visual.root.visible)
        || shots.find(available);
      if (!shot) continue;
      const angle = heading + (index - (count - 1) / 2) * (actor.type === "gargola" ? .23 : .2);
      shot.direction.set(Math.sin(angle), 0, Math.cos(angle));
      shot.owner = actor;
      shot.speed = actor.type === "testigo" ? 8 : actor.type === "gargola" ? 6.4 : 7;
      shot.life = 3.1;
      shot.active = true;
      shot.visual.start(source, shot.direction);
    }
  }

  function update(dt, player, progress, reducedMotion = false) {
    if (!dt || !player) return;
    clock += dt;
    target.set(player.x, (player.y || 0) + 1.2, player.z);
    for (const shot of shots) {
      if (shot.owner && shot.owner.hp(progress) <= 0) {
        shot.active = false;
        shot.owner = null;
        shot.visual.clear();
      }
      if (shot.active) {
        previous.copy(shot.visual.body.position);
        shot.life -= dt;
        destination.copy(previous).addScaledVector(shot.direction, shot.speed * dt);
        const hit = segmentSphereHit(previous, destination, target, .72);
        let obstacleHit = null;
        for (const pillar of UNDERWORLD_PYLONS) {
          const impact = segmentSphereHit(previous, destination,
            { x: pillar.x, y: 1.4, z: pillar.z }, .85);
          if (impact !== null && (obstacleHit === null || impact < obstacleHit)) obstacleHit = impact;
        }
        const blocked = obstacleHit !== null && (hit === null || obstacleHit <= hit);
        const contact = blocked ? obstacleHit : hit;
        if (contact !== null) {
          // Burst at the first contact point, including pillars used as cover.
          shot.visual.body.position.lerpVectors(previous, destination, contact);
          shot.visual.update(0, clock, reducedMotion);
          shot.active = false;
          shot.visual.finish(true);
          if (!blocked) onDamage?.(1);
        } else {
          shot.visual.body.position.copy(destination);
          if (shot.life <= 0) {
            shot.active = false;
            shot.visual.finish(false);
          }
        }
      }
      // Impacts and trails finish fading even after the projectile stops dealing damage.
      shot.visual.update(dt, clock, reducedMotion);
    }
  }

  function dispose() {
    disposeObjects([effects, ...chargeRoots]);
    effects.removeFromParent();
    for (const charge of chargeRoots) charge.removeFromParent();
    shots.length = chargeRoots.length = 0;
  }
  return { fire, update, createCharge, dispose,
    get activeCount() { return shots.reduce((count, shot) => count + Number(shot.active), 0); } };
}
