import * as THREE from "three";
import defaultTransforms from "./rockClubActorTransforms.json";
import { ROCK_CLUB_NPCS } from "./rockClubDialogue.js";
import { ROCK_CLUB_BAND } from "./rockClubBand.js";
import { ROCK_CLUB_AUDIENCE, advanceRockClubPatrol } from "./rockClubAudience.js";
import { ROCK_CLUB_STAGE_HEIGHT } from "./rockClubLayout.js";
import { createInteractionPromptSprite } from "./recordStoreInteractionPrompt.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { limitRockClubTextures } from "./rockClubTextureBudget.js";
import { defaultConcertTransform } from "./rockClubConcertSettings.js";
import { findConcertBone } from "./rockClubConcertProps.js";
import { ROCK_CLUB_CONCERT_CLIPS } from "./rockClubConcertAssets.js";

const STORAGE_KEY = "neonboy-rock-club-actor-transforms-v1";
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

export function defaultRockClubActorTransform(id) {
  return structuredClone(defaultTransforms[id]);
}

export function loadRockClubActorTransforms() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { /* Keep defaults. */ }
  return Object.fromEntries(Object.entries(defaultTransforms).map(([id, base]) => {
    const stored = saved?.[id] || {};
    // Move an untouched old microphone placement with the new scene default.
    const oldSeat = (id === "lujan" && JSON.stringify(stored.position) === JSON.stringify([1.12, 1.18, -17.55])) ||
      (id === "drum-bench" && JSON.stringify(stored.position) === JSON.stringify([1.12, 0.48, -17.62]));
    const previous = oldSeat ? { ...stored, position: base.position } : id === "microphone" && JSON.stringify(stored.position) === JSON.stringify([0, 0.48, -14.1])
      ? { ...stored, position: base.position } : stored;
    const axis = (field) => base[field].map((value, index) =>
      Number.isFinite(previous[field]?.[index]) ? previous[field][index] : value);
    return [id, {
      position: axis("position"), rotation: axis("rotation"),
      scale: Number.isFinite(previous.scale) ? Math.max(0.05, Math.min(5, previous.scale)) : base.scale,
      ...(base.reach !== undefined ? { reach: Number.isFinite(previous.reach) ? Math.max(1, Math.min(4, previous.reach)) : base.reach } : {}),
    }];
  }));
}

export function saveRockClubActorTransforms(transforms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transforms));
}

function inPlaceClip(source) {
  if (!source) return null;
  const clip = source.clone();
  for (const track of clip.tracks) {
    if (!/Hips\.position$/.test(track.name)) continue;
    const y = track.values[1];
    for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] = 0;
      track.values[i + 1] = y;
      track.values[i + 2] = 0;
    }
  }
  clip.resetDuration();
  return clip;
}

export function createRockClubActors(scene, club, loader, getTransforms, isAlive, getConcertTransforms = () => ({})) {
  const actors = new Map();
  let disposed = false;
  let concertActive = false;
  // One small shared radial texture grounds every performer, including those
  // outside the single shadow-casting stage spotlight.
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 96;
  const shadowContext = shadowCanvas.getContext("2d");
  const gradient = shadowContext.createRadialGradient(48, 48, 7, 48, 48, 46);
  gradient.addColorStop(0, "rgba(7, 3, 8, 0.85)");
  gradient.addColorStop(0.45, "rgba(7, 3, 8, 0.48)");
  gradient.addColorStop(1, "rgba(7, 3, 8, 0)");
  shadowContext.fillStyle = gradient;
  shadowContext.fillRect(0, 0, 96, 96);
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1,
  });
  const shadowGeometry = new THREE.PlaneGeometry(1, 1);

  function apply(id, transform) {
    const actor = actors.get(id);
    if (!actor || !transform) return;
    actor.root.position.fromArray(transform.position);
    actor.root.rotation.set(...transform.rotation.map((degrees) => THREE.MathUtils.degToRad(degrees)));
    actor.root.scale.setScalar(transform.scale);
    actor.shadow.position.set(actor.root.position.x,
      actor.interactive || actor.npc.ambient ? 0.006 : ROCK_CLUB_STAGE_HEIGHT + 0.041,
      actor.root.position.z);
    actor.shadow.scale.set(
      (actor.interactive || actor.npc.ambient ? 1.1 : 1.38) * transform.scale,
      (actor.interactive || actor.npc.ambient ? 0.68 : 0.82) * transform.scale, 1);
    actor.reach = transform.reach;
    actor.baseYaw = actor.root.rotation.y;
    actor.baseRoll = actor.root.rotation.z;
    if (actor.patrol) {
      actor.patrol.originX = actor.root.position.x;
      actor.patrol.originZ = actor.root.position.z;
      actor.patrol.progress = 0;
      actor.patrol.direction = 1;
      actor.patrol.pause = 0;
    }
    actor.obstacle.x = actor.root.position.x;
    actor.obstacle.z = actor.root.position.z;
    actor.obstacle.hx = actor.obstacle.hz = 0.32 * transform.scale;
  }

  for (const npc of [...ROCK_CLUB_NPCS, ...ROCK_CLUB_BAND, ...ROCK_CLUB_AUDIENCE]) {
    const interactive = ROCK_CLUB_NPCS.includes(npc);
    const root = new THREE.Group();
    root.name = `club-npc:${npc.id}`;
    scene.add(root);
    const marker = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.88, 6, 10),
      new THREE.MeshStandardMaterial({ color: npc.id === "charly" ? 0x704056 : 0x473350, roughness: 0.85 }));
    marker.position.y = 0.87;
    root.add(marker);
    if (npc.ambient) marker.visible = false;
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.name = `club-contact-shadow:${npc.id}`;
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 1;
    scene.add(shadow);
    if (npc.ambient) shadow.visible = false;
    const prompt = interactive ? createInteractionPromptSprite("[E] HABLAR") : null;
    if (prompt) { prompt.visible = false; root.add(prompt); }
    const obstacle = { id: npc.id, x: 0, z: 0, hx: 0.32, hz: 0.32 };
    if (!npc.ambient) club.obstacles.push(obstacle);
    actors.set(npc.id, { npc, root, marker, shadow, prompt, obstacle, interactive, reach: interactive ? 2.5 : 0, baseYaw: 0,
      animationState: npc.animationState || "idle", model: null, mixer: null, idle: null, show: null, showClip: null, dance: null, ambient: null,
      patrol: npc.walk ? { ...npc.walk, progress: 0, direction: 1, pause: 0, time: 0 } : null, baseRoll: 0 });
    apply(npc.id, getTransforms()[npc.id]);
  }

  async function loadGroup(target, onLoaded, waitForIdle) {
    const loaded = [];
    // Meshy character exports are large: decode only one at a time.
    for (const actor of actors.values()) {
      const deferred = actor.npc.deferLoad || (actor.npc.ambient && !actor.npc.loadWithScene);
      const group = actor.npc.priorityLoad ? "friends" : deferred ? "audience" : "initial";
      if (group !== target) continue;
      if (target === "audience") await waitForIdle?.();
      if (disposed || !isAlive()) break;
      try {
        const asset = await loader.loadAsync(actor.npc.model);
        if (disposed || !isAlive()) { disposeObjects([asset.scene]); break; }
        const model = asset.scene;
        limitRockClubTextures(model, actor.npc.ambient ? (actor.npc.id === "club-spectator-1" ? 1024 : 512)
          : actor.npc.deferLoad || actor.npc.id === "riky" ? 1024 : 2048);
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        if (!Number.isFinite(size.y) || size.y < 0.001) { disposeObjects([model]); continue; }
        const scale = actor.npc.fitHeight / size.y;
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
        model.traverse((object) => {
          if (object.isMesh) { object.castShadow = !actor.npc.ambient; object.receiveShadow = true; }
        });
        model.name = `club-character:${actor.npc.id}`;
        actor.root.add(model);
        actor.root.remove(actor.marker);
        actor.marker.geometry.dispose();
        actor.marker.material.dispose();
        actor.marker = null;
        actor.model = model;
        actor.modelBaseScale = model.scale.clone();
        actor.modelBasePosition = model.position.clone();
        actor.modelBaseQuaternion = model.quaternion.clone();
        if (actor.npc.ambient) {
          actor.shadow.visible = true;
          club.obstacles.push(actor.obstacle);
        }
        if (actor.npc.id === "club-spectator-1") {
          const chest = model.getObjectByName("Bone_004");
          const neck = model.getObjectByName("Bone_024");
          actor.ambient = {
            time: 0,
            chest,
            chestRest: chest?.quaternion.clone(),
            chestOffset: new THREE.Quaternion(),
            neck,
            neckRest: neck?.quaternion.clone(),
            neckOffset: new THREE.Quaternion(),
          };
        }
        // Only clips embedded in the matching model are used. Charly's real
        // Listening_Gesture is his idle gesture; there is no invented talk clip.
        const expected = actor.npc.clip || {
          "john-zool": "Long_Breathe_and_Look_Around",
          "lilith-9": "Stand_and_Chat",
          revenant: "Short_Breathe_and_Look_Around",
          lujan: "Sit_Cross_Legged",
          "club-rulo": "Alert",
          riky: "Alert",
        }[actor.npc.id];
        let idleAnimations = asset.animations;
        if (actor.npc.idleClip) {
          try { idleAnimations = (await loader.loadAsync(actor.npc.idleClip)).animations; }
          catch { /* The new model can still stand in its neutral pose. */ }
        }
        const clip = inPlaceClip(idleAnimations.find((item) => item.name === expected) ||
          (expected ? null : idleAnimations[0]));
        if (clip) {
          actor.mixer = new THREE.AnimationMixer(model);
          actor.idle = actor.mixer.clipAction(clip);
          actor.idle.play();
          if (actor.npc.ambient) {
            actor.mixer.timeScale = actor.npc.playbackRate;
            actor.mixer.setTime(clip.duration * actor.npc.phase);
          }
          // Lilith uses her matching standing chat animation while waiting.
          // Keep Lujan seated at the drum kit until a dedicated performance clip arrives.
          if (actor.npc.id === "lilith-9") actor.mixer.timeScale = 0.72;
          if (actor.npc.id === "lujan") {
            actor.mixer.setTime(clip.duration * 0.75);
            actor.mixer.timeScale = 0;

          }
        }
        if (actor.showClip) bindConcertClip(actor);
        if (concertActive) startActorConcert(actor);
        loaded.push(actor.npc.id);
        onLoaded?.(actor.npc.id);
      } catch { /* Core NPC markers remain visible; missing audience members stay hidden. */ }
    }
    return loaded;
  }

  function bindConcertClip(actor) {
    if (!actor.model || !actor.mixer || !actor.showClip || actor.show) return;
    // John Zool's performance export has extra guitar bones. Keep only tracks
    // that bind to his already loaded character model.
    const clip = actor.showClip.clone();
    clip.tracks = clip.tracks.filter((track) => actor.model.getObjectByName(track.name.split(".")[0]));
    if (!clip.tracks.length) return;
    clip.resetDuration();
    actor.show = actor.mixer.clipAction(clip);
    if (actor.npc.id === "diego") {
      actor.show.setLoop(THREE.LoopOnce, 1);
      actor.show.clampWhenFinished = true;
    }
  }

  async function loadConcertClips(loader, onPlayerClip) {
    for (const [id, source] of Object.entries(ROCK_CLUB_CONCERT_CLIPS)) {
      if (disposed || !isAlive()) break;
      try {
        const asset = await loader.loadAsync(source.url);
        const clip = inPlaceClip(asset.animations.find((item) => item.name === source.name));
        if (!clip) continue;
        if (id === "neonboy") onPlayerClip?.(clip);
        else {
          const actor = actors.get(id);
          if (actor) { actor.showClip = clip; bindConcertClip(actor); }
        }
      } catch { /* A missing reaction cannot prevent the rest of the show. */ }
    }
  }

  function startActorConcert(actor) {
    if (!actor.show) return;
    if (actor.npc.id === "diego") {
      actor.root.position.set(-6.56, 0.25, 1.05);
      actor.root.rotation.y = Math.PI;
      actor.obstacle.x = actor.shadow.position.x = actor.root.position.x;
      actor.obstacle.z = actor.shadow.position.z = actor.root.position.z;
    }
    actor.previousTimeScale = actor.mixer.timeScale;
    actor.mixer.timeScale = 1;
    actor.idle?.fadeOut(0.3);
    actor.show.reset().fadeIn(0.3).play();
  }

  function setConcertActive(active) {
    if (concertActive === active) return;
    concertActive = active;
    for (const actor of actors.values()) {
      if (!actor.show) continue;
      if (active) startActorConcert(actor);
      else {
        actor.show.fadeOut(0.3);
        actor.idle?.reset().fadeIn(0.3).play();
        if (actor.npc.id === "diego") apply("diego", getTransforms().diego);
        if (actor.npc.id === "lujan") {
          actor.show.stop();
          actor.idle.time = actor.idle.getClip().duration * 0.75;
          actor.idle.setEffectiveWeight(1);
          actor.mixer.update(0);
        }
        actor.mixer.timeScale = actor.previousTimeScale ?? 1;
      }
    }
  }

  const seatWorld = new THREE.Vector3(), hipsWorld = new THREE.Vector3();
  const seatLocal = new THREE.Vector3(), correctionLocal = new THREE.Vector3();
  const seatOffset = new THREE.Vector3(), seatQuaternion = new THREE.Quaternion();
  const seatRotation = new THREE.Euler();
  const defaultDrummerPosition = new THREE.Vector3(...defaultTransforms.lujan.position);
  let cachedBench = null;
  function alignDrummer(actor) {
    if (!actor.model) return;
    const slot = club.slots.get("drum-bench");
    const bench = slot?.anchor.getObjectByName("club-model:drum-bench") || slot?.placeholder;
    const hips = actor.hipsBone ||= findConcertBone(actor.model, "Hips");
    if (!bench || !hips) return;
    if (bench !== cachedBench) {
      const box = new THREE.Box3().setFromObject(bench);
      box.getCenter(seatLocal); seatLocal.y = box.max.y;
      slot.anchor.worldToLocal(seatLocal); cachedBench = bench;
    }
    const settings = getConcertTransforms()?.lujan || defaultConcertTransform("lujan");
    actor.model.scale.copy(actor.modelBaseScale).multiplyScalar(settings.scale);
    actor.model.position.copy(actor.modelBasePosition);
    actor.model.quaternion.copy(actor.modelBaseQuaternion).multiply(seatQuaternion.setFromEuler(
      seatRotation.set(...settings.rotation.map(THREE.MathUtils.degToRad))));
    slot.anchor.updateWorldMatrix(true, false);
    slot.anchor.localToWorld(seatWorld.copy(seatLocal));
    // Keep the regular actor editor useful: its displacement is an extra seat offset.
    seatWorld.add(seatOffset.copy(actor.root.position).sub(defaultDrummerPosition));
    seatOffset.fromArray(settings.position).applyQuaternion(slot.anchor.getWorldQuaternion(seatQuaternion));
    seatWorld.add(seatOffset);
    actor.root.updateWorldMatrix(true, true);
    hips.getWorldPosition(hipsWorld);
    actor.root.worldToLocal(correctionLocal.copy(seatWorld));
    actor.root.worldToLocal(hipsWorld);
    actor.model.position.add(correctionLocal.sub(hipsWorld));
  }

  function moveWalker(actor, dt) {
    const step = advanceRockClubPatrol(actor.patrol, dt);
    actor.root.position.x = step.x;
    actor.root.position.z = step.z;
    const difference = Math.atan2(Math.sin(step.yaw - actor.root.rotation.y), Math.cos(step.yaw - actor.root.rotation.y));
    actor.root.rotation.y += difference * Math.min(1, dt * 2.8);
    actor.root.rotation.z = actor.baseRoll + step.lean;
    actor.obstacle.x = actor.shadow.position.x = step.x;
    actor.obstacle.z = actor.shadow.position.z = step.z;
    actor.mixer.timeScale = step.paused ? 0.22 : actor.npc.playbackRate;
  }

  function update(dt, player, activeNpc, nearbyNpc, musicPlaying = false) {
    for (const actor of actors.values()) {
      if (actor.patrol && actor.model && !(concertActive && actor.show)) {
        moveWalker(actor, dt);
      } else if (!(concertActive && actor.show)) {
        const focus = actor.interactive && (activeNpc === actor.npc.id || nearbyNpc === actor.npc.id);
        const desired = focus
          ? Math.atan2(player.x - actor.root.position.x, player.z - actor.root.position.z)
          : actor.baseYaw;
        const difference = Math.atan2(Math.sin(desired - actor.root.rotation.y), Math.cos(desired - actor.root.rotation.y));
        actor.root.rotation.y += difference * Math.min(1, dt * 4);
        if (actor.ambient) {
          const pose = actor.ambient;
          pose.time += dt;
          // Small breathing and occasional glances; feet stay planted.
          const breath = Math.sin(pose.time * 1.65);
          const glance = Math.sin(pose.time * 0.48) * Math.sin(pose.time * 0.19);
          actor.root.rotation.y = actor.baseYaw + 0.025 * Math.sin(pose.time * 0.42);
          if (pose.chest) pose.chest.quaternion.copy(pose.chestRest)
            .multiply(pose.chestOffset.setFromAxisAngle(Z_AXIS, breath * 0.012));
          if (pose.neck) pose.neck.quaternion.copy(pose.neckRest)
            .multiply(pose.neckOffset.setFromAxisAngle(Y_AXIS, glance * 0.055));
        }
      }
      if (actor.prompt) actor.prompt.visible = nearbyNpc === actor.npc.id && !activeNpc;
      // A compatible dance clip can be supplied with a future club performance.
      if (actor.npc.id === "club-roxy" && actor.dance) {
        if (musicPlaying && !actor.dance.isRunning()) { actor.idle?.fadeOut(0.2); actor.dance.reset().fadeIn(0.2).play(); }
        if (!musicPlaying && actor.dance.isRunning()) { actor.dance.fadeOut(0.2); actor.idle?.reset().fadeIn(0.2).play(); }
      }
      actor.mixer?.update(dt);
      if (actor.npc.id === "lujan") alignDrummer(actor);
    }
  }

  return {
    actors, load: (onLoaded) => loadGroup("initial", onLoaded),
    loadFriends: (onLoaded) => loadGroup("friends", onLoaded),
    loadConcertClips, setConcertActive,
    loadAudience: (onLoaded, waitForIdle) => loadGroup("audience", onLoaded, waitForIdle),
    apply, update,
    getPosition: (id) => actors.get(id)?.root.position,
    getReach: (id) => actors.get(id)?.reach ?? 0,
    dispose: () => { disposed = true; actors.forEach((actor) => actor.mixer?.stopAllAction()); },
  };
}
