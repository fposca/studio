import * as THREE from "three";
import { createHalloweenDemonShield, DEMON_SHIELD } from "./halloweenDemonShield.js";

import { CONTAINED_GLASSES_POSITION } from "./halloweenGlassesChest.js";
export const GLASSES_POSITION = CONTAINED_GLASSES_POSITION;
export const GLASSES_PICKUP_WIDTH = 0.48;
const DEMON_ROUTE = [[7.1, -8.8], [8.4, -8.8], [8.4, -5.8], [7.1, -5.8]];
export function createHalloweenDemonEncounter(scene) {
  const root = new THREE.Group();
  root.name = "Halloween / Reguetonero demoníaco";
  root.position.set(DEMON_ROUTE[0][0], 0, DEMON_ROUTE[0][1]);
  scene.add(root);
  const shield = createHalloweenDemonShield(scene, root);
  const glasses = new THREE.Group();
  glasses.name = "Halloween / Glasses";
  glasses.position.set(GLASSES_POSITION.x, GLASSES_POSITION.y, GLASSES_POSITION.z);
  scene.add(glasses);
  glasses.rotation.set(-.15, -Math.PI / 2, 0);
  glasses.visible = false;
  const fallbackGlasses = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x191327, metalness: .8, roughness: .25, emissive: 0x612a94, emissiveIntensity: .5 });
  const cyan = new THREE.MeshPhysicalMaterial({ color: 0x48daef, transparent: true, opacity: .58, metalness: .1, roughness: .12, side: THREE.DoubleSide });
  const red = new THREE.MeshPhysicalMaterial({ color: 0xff5366, transparent: true, opacity: .58, metalness: .1, roughness: .12, side: THREE.DoubleSide });
  const lensGeo = new THREE.BoxGeometry(.49, .27, .035);
  const edgeGeo = new THREE.BoxGeometry(.52, .3, .045);
  for (const [x, mat] of [[-.29, cyan], [.29, red]]) {
    const rim = new THREE.Mesh(edgeGeo, frameMat); rim.position.x = x; fallbackGlasses.add(rim);
    const lens = new THREE.Mesh(lensGeo, mat); lens.position.set(x, 0, .027); fallbackGlasses.add(lens);
  }
  for (const [x, w, z] of [[0, .12, .01], [-.69, .27, -.07], [.69, .27, -.07]]) {
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(w, .045, .045), frameMat);
    bridge.position.set(x, .09, z); fallbackGlasses.add(bridge);
  }
  fitGlassesPickup(fallbackGlasses);
  glasses.add(fallbackGlasses);
  // Use the shop lighting: opening the lid must not recompile every lit material.
  const pulse = new THREE.Mesh(new THREE.RingGeometry(.9, 1.04, 48), new THREE.MeshBasicMaterial({ color: 0xff517f, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  pulse.rotation.x = -Math.PI / 2; pulse.position.y = .055; pulse.visible = false; scene.add(pulse);
  const forms = [];
  const orbTarget = {
    id: "halloween-demon", kind: "halloween-demon",
    position: new THREE.Vector3(), radius: .94, capsuleHalfHeight: .9, returnHit: true,
  };
  const shieldTarget = {
    id: "halloween-demon-shield", kind: "halloween-demon-shield",
    position: new THREE.Vector3(), radius: DEMON_SHIELD.radius,
    capsuleHalfHeight: DEMON_SHIELD.halfHeight, returnHit: false,
  };
  let routeIndex = 1, wait = 1.5, health = 3, deathRemaining = 0, hideRequested = false, attackCooldown = 2, telegraph = 0, attackRecovery = 0;
  let revealed = false, collected = false, defeatedHidden = false, chestOpen = false;

  function mountForm(idle, walk, attack = null, death = null) {
    const body = idle.scene;
    const bounds = new THREE.Box3().setFromObject(body);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    // Keep the real-world disguise at its original size; the revealed form towers over it.
    const scale = (forms.length === 0 ? 1.84 : 2.75) / Math.max(size.y, .01);
    body.scale.setScalar(scale);
    body.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    root.add(body);
    const mixer = new THREE.AnimationMixer(body);
    const idleClip = idle.animations[0], walkClip = walk.animations[0];
    // Optional clips may use a different exported rig; bind only tracks found on this body.
    const compatibleClip = (clip) => {
      const tracks = clip?.tracks.filter((track) => {
        const name = THREE.PropertyBinding.parseTrackName(track.name).nodeName;
        return !name || Boolean(body.getObjectByName(name));
      });
      return tracks?.length ? new THREE.AnimationClip(clip.name, clip.duration, tracks) : null;
    };
    const attackClip = compatibleClip(attack?.animations[0]);
    const deathClip = compatibleClip(death?.animations[0]);
    const actions = {
      idle: idleClip ? mixer.clipAction(idleClip) : null,
      walk: walkClip ? mixer.clipAction(walkClip) : null,
      attack: attackClip ? mixer.clipAction(attackClip) : null,
      death: deathClip ? mixer.clipAction(deathClip) : null,
    };
    for (const action of [actions.attack, actions.death]) {
      if (!action) continue;
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
    }
    actions.idle?.play();
    forms.push({ body, mixer, actions, current: "idle" });
    body.visible = !defeatedHidden && forms.length === 1;
    return [walk.scene, attack?.scene, death?.scene].filter(Boolean);
  }
  function setPose(form, walking, attacking) {
    const next = attacking && form.actions.attack ? "attack" : walking ? "walk" : "idle";
    if (form.current === next) return;
    form.actions[form.current]?.fadeOut(.12);
    form.actions[next]?.reset().fadeIn(.12).play();
    form.current = next;
  }
  function setVision(active) {
    revealed = active;
    shield.setDisabled(active || health <= 0);
    forms.forEach((form, i) => { form.body.visible = !defeatedHidden && ((health === 0 || active) ? i === 1 : i === 0); });
  }
  function mountGlasses(model) {
    fitGlassesPickup(model);
    model.traverse((object) => { if (object.isMesh) { object.castShadow = false; object.receiveShadow = false; } });
    glasses.add(model);
    fallbackGlasses.visible = false;
  }
  function collect() { collected = true; glasses.visible = false; }
  function setChestOpen(open) { chestOpen = open; glasses.visible = chestOpen && !collected; }
  function hit() {
    if (!revealed || health <= 0) return null;
    health -= 1;
    if (health === 0) {
      forms.forEach((form) => form.mixer.stopAllAction());
      telegraph = 0; attackRecovery = 0; pulse.visible = false;
      shield.setDisabled(true);
      const deathForm = forms[1];
      if (deathForm?.actions.death) {
        deathForm.actions.death.reset().play();
        deathForm.current = "death";
        deathRemaining = deathForm.actions.death.getClip().duration;
      }
    }
    return health;
  }
  function restoreHealth(value) {
    health = Math.min(3, Math.max(0, Number.isFinite(value) ? Math.trunc(value) : 3));
    deathRemaining = 0;
    hideRequested = defeatedHidden = health === 0;
    telegraph = attackRecovery = 0;
    pulse.visible = false;
    shield.setDisabled(health === 0);
    if (defeatedHidden) forms.forEach((form) => { form.body.visible = false; form.mixer.stopAllAction(); });
  }
  function hideDefeated() {
    if (health !== 0) return;
    hideRequested = true;
    if (deathRemaining > 0) return;
    defeatedHidden = true;
    forms.forEach((form) => { form.body.visible = false; });
  }
  function update(dt, elapsed, player, active, locked, onDamage, reduceFlashing = false) {
    shield.update(dt, reduceFlashing);
    glasses.visible = chestOpen && !collected;
    if (health <= 0) {
      if (deathRemaining > 0) {
        const step = Math.min(dt, deathRemaining);
        forms[1]?.mixer.update(step);
        deathRemaining = Math.max(0, deathRemaining - step);
        if (deathRemaining === 0 && hideRequested) hideDefeated();
      }
      return;
    }
    if (locked) return;
    const distance = Math.hypot(player.x - root.position.x, player.z - root.position.z);
    const attacking = telegraph > 0 || attackRecovery > 0;
    let walking = false;
    if (attacking) {
      // The kick faces NeonBoy and holds the actor in place through the follow-through.
      root.rotation.y = Math.atan2(player.x - root.position.x, player.z - root.position.z);
    } else {
      const [tx, tz] = DEMON_ROUTE[routeIndex];
      const dx = tx - root.position.x, dz = tz - root.position.z;
      if (wait > 0) wait = Math.max(0, wait - dt);
      else if (Math.hypot(dx, dz) < .12) { routeIndex = (routeIndex + 1) % DEMON_ROUTE.length; wait = 1.1; }
      else {
        const step = Math.min(Math.hypot(dx, dz), dt * 1.12);
        root.position.x += dx / Math.hypot(dx, dz) * step;
        root.position.z += dz / Math.hypot(dx, dz) * step;
        root.rotation.y = Math.atan2(dx, dz);
        walking = true;
      }
    }
    pulse.position.x = root.position.x; pulse.position.z = root.position.z;
    if (telegraph > 0) {
      telegraph = Math.max(0, telegraph - dt);
      pulse.visible = telegraph > 0;
      pulse.scale.setScalar(1 + (1 - telegraph / .8) * 1.15);
      pulse.material.opacity = .26 + Math.sin(elapsed * 17) * .14;
      if (!telegraph) {
        attackRecovery = .6;
        attackCooldown = 2.8;
        if (distance < 2.25) onDamage?.();
      }
    } else if (attackRecovery > 0) attackRecovery = Math.max(0, attackRecovery - dt);
    else if (attackCooldown > 0) attackCooldown = Math.max(0, attackCooldown - dt);
    else if (distance < 2.55) {
      telegraph = .8;
      pulse.visible = true;
    }
    for (const form of forms) {
      setPose(form, walking, telegraph > 0 || attackRecovery > 0);
      form.mixer.update(dt);
    }
  }
  return {
    root, glasses, mountForm, mountGlasses, setVision, collect, setChestOpen, hit, update, restoreHealth,
    getOrbTarget() {
      if (!revealed || health <= 0) return null;
      orbTarget.position.set(root.position.x, 1.35, root.position.z);
      orbTarget.radius = 1.08;
      orbTarget.capsuleHalfHeight = 1.15;
      return orbTarget;
    },
    getShieldTarget() {
      if (revealed || health <= 0) return null;
      shieldTarget.position.copy(root.position);
      shieldTarget.position.y += DEMON_SHIELD.centerY;
      return shieldTarget;
    },
    blockOrb(worldHit) {
      if (revealed || health <= 0) return false;
      return shield.flash(worldHit);
    },
    get health() { return health; }, get defeated() { return health <= 0; },
    get position() { return root.position; },
    get glassesCollected() { return collected; },
    hideDefeated,
    debugDefeat() { health = 0; defeatedHidden = true; shield.setDisabled(true); forms.forEach((form) => { form.body.visible = false; form.mixer.stopAllAction(); }); },
    stop() { shield.setDisabled(true); forms.forEach((form) => form.mixer.stopAllAction()); },
  };
}

function fitGlassesPickup(model) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = GLASSES_PICKUP_WIDTH / Math.max(size.x, .01);
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
}
