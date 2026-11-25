import * as THREE from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { CITY_WALK_ROUTES, createCityPopulation, populationProfile, sampleCityRoute } from "./buenosAiresPopulation.js";
import { planCitizenStep, moveCitizen } from "./buenosAiresPedestrianMotion.js";
import { createCityCrowdLod } from "./buenosAiresCrowdLod.js";

const FAMILIES = {
  man: { model: new URL("../assets/neonboy-animaciones/peaton-hombre-camina-celular.near.glb", import.meta.url).href,
    idle: new URL("../assets/neonboy-animaciones/peaton-hombre-quieto-celular.anim.glb", import.meta.url).href, react: new URL("../assets/neonboy-animaciones/peaton-hombre-reacciona.anim.glb", import.meta.url).href },
  woman: { model: new URL("../assets/neonboy-animaciones/peaton-mujer-camina-celular.near.glb", import.meta.url).href,
    idle: new URL("../assets/neonboy-animaciones/peaton-mujer-quieta-celular.anim.glb", import.meta.url).href, react: new URL("../assets/neonboy-animaciones/peaton-mujer-reacciona.anim.glb", import.meta.url).href },
  executive: { model: new URL("../assets/neonboy-animaciones/ejecutivo-camina-celular.near.glb", import.meta.url).href,
    idle: new URL("../assets/neonboy-animaciones/ejecutivo-quieto-celular.anim.glb", import.meta.url).href },
  elder: { model: new URL("../assets/neonboy-animaciones/senora-camina-celular.near.glb", import.meta.url).href,
    idle: new URL("../assets/neonboy-animaciones/senora-quieta-celular.anim.glb", import.meta.url).href },
  fatman: { model: new URL("../assets/neonboy-animaciones/bsas/fatman-caminando.near.glb", import.meta.url).href,
    idle: new URL("../assets/neonboy-animaciones/bsas/fatman-inactivo.anim.glb", import.meta.url).href },
  oldman: { model: new URL("../assets/neonboy-animaciones/bsas/viejo-caminando.near.glb", import.meta.url).href,
    idle: new URL("../assets/neonboy-animaciones/bsas/viejo-repsiando.anim.glb", import.meta.url).href },
  parrotman: { model: new URL("../assets/neonboy-animaciones/bsas/viejo-loro-caminando.near.glb", import.meta.url).href,
    idle: new URL("../assets/neonboy-animaciones/bsas/viejo-loro-inactivo.anim.glb", import.meta.url).href },
  disconnected: { model: new URL("../assets/neonboy-animaciones/desconectada-respira.near.glb", import.meta.url).href,
    walk: new URL("../assets/neonboy-animaciones/desconectada-camina.anim.glb", import.meta.url).href, talk: new URL("../assets/neonboy-animaciones/desconectada-habla.anim.glb", import.meta.url).href },
};
function clipInPlace(source, name) {
  if (!source) return null;
  const clip = source.clone(); clip.name = name;
  for (const track of clip.tracks) {
    if (!/(Hips|Root)\.position$/.test(track.name)) continue;
    const y = track.values[1];
    for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] = 0; track.values[i + 1] = y; track.values[i + 2] = 0;
    }
  }
  clip.resetDuration();
  return clip;
}
function setAction(actor, mode) {
  const action = actor.actions?.[mode] || actor.actions?.idle || actor.actions?.walk;
  if (!action || action === actor.currentAction) return;
  actor.currentAction?.fadeOut(.22);
  action.reset().setEffectiveTimeScale(mode === "walk" ? actor.config.speed / .8 : 1).fadeIn(.22).play();
  actor.currentAction = action;
}

export function createBuenosAiresActors(root, { glowMap, tier = "high", canAvoid = () => true, codeVision } = {}) {
  let combatArea = null;
  const environmentAvoid = canAvoid;
  const inCombatArea = (x, z) => combatArea && x > combatArea.minX - 1.5 && x < combatArea.maxX + 1.5 && z > combatArea.minZ - 1.5 && z < combatArea.maxZ + 1.5;
  canAvoid = (x, z) => environmentAvoid(x, z) && !inCombatArea(x, z);
  const group = new THREE.Group(); group.name = "Buenos Aires 2049 / ciudadanos Meshy"; root.add(group);
  const sources = new THREE.Group(); sources.visible = false; group.add(sources);
  const glowMaterial = new THREE.SpriteMaterial({ map: glowMap, color: 0x9c6aff, transparent: true,
    opacity: .78, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const signalMaterial = new THREE.LineBasicMaterial({ color: 0xb876ff, transparent: true, opacity: .45,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  let disposed = false, currentTier = tier, speaking = null, signalReported = false;
  let clock = 0, populationTick = 1, loadPromise = null, synchronization = null, dialogueSpeaking = false;
  const templates = new Map(), loaded = [], usedSynchronizations = new Set();
  const sample = {}, lastPlayer = { x: 0, z: 42 };
  const actors = createCityPopulation().map(config => {
    const actorRoot = new THREE.Group(); actorRoot.name = "Ciudadano / " + config.id;
    actorRoot.userData.cityKeep = true; group.add(actorRoot);
    const route = config.route == null ? null : CITY_WALK_ROUTES[config.route];
    const distance = route ? route.length * config.offset : 0;
    if (route) sampleCityRoute(config.route, distance, config.direction, config.lane, sample);
    else Object.assign(sample, { x: config.x, z: config.z, yaw: 0, segment: -1 });
    actorRoot.position.set(sample.x, 0, sample.z); actorRoot.rotation.y = sample.yaw;
    const actor = { config, root: actorRoot, distance, pause: 0, reactUntil: 0, yaw: sample.yaw,
      colliderRadius: ["fatman", "parrotman"].includes(config.type) ? 1.25 : 1.1,
      lane: config.lane, passLane: config.lane, passUntil: 0, routeYaw: sample.yaw,
      segment: sample.segment, actions: {}, mixer: null, model: null, pivot: null,
      lod: "off", target: actorRoot.position.clone(), aiTime: 0, poseTime: config.index * .137,
      poseTick: 0, blocked: 0, waiting: false, synchronized: false, proximity: Infinity };
    const phoneGlow = new THREE.Sprite(glowMaterial);
    phoneGlow.position.set(.24, 1.25, .12); phoneGlow.scale.set(.28, .28, 1);
    phoneGlow.visible = false; actorRoot.add(phoneGlow); actor.phoneGlow = phoneGlow;
    // Only the established citizens have dialogue/quest identities.
    if (!config.ambient) {
      actor.interaction = { id: config.id, label: "Hablar con " + config.label,
        x: sample.x, z: sample.z, reach: 0 };
      if (route) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
        actor.signal = new THREE.Line(geometry, signalMaterial);
        actor.signal.frustumCulled = false; actor.signal.visible = false; group.add(actor.signal);
      }
    }
    return actor;
  });
  const byId = new Map(actors.map(actor => [actor.config.id, actor]));
  const interactions = actors.flatMap(actor => actor.interaction ? [actor.interaction] : []);
  const crowd = createCityCrowdLod(group, actors.length, { codeVision });

  function releaseModel(actor) {
    if (!actor.model) return;
    codeVision?.unregister(actor.model);
    actor.mixer.stopAllAction(); actor.mixer.uncacheRoot(actor.model);
    // Geometry/material/textures are owned by the hidden source templates.
    // Dispose only the independently cloned bone textures here.
    const skeletons = new Set();
    actor.model.traverse(object => { if (object.skeleton) skeletons.add(object.skeleton); });
    skeletons.forEach(skeleton => skeleton.dispose());
    actor.pivot.removeFromParent();
    actor.model = actor.mixer = actor.pivot = actor.currentAction = null; actor.actions = {};
  }
  function acquireModel(actor) {
    const template = templates.get(actor.config.type);
    if (actor.model || !template) return;
    const model = cloneSkeleton(template.scene), pivot = new THREE.Group();
    pivot.scale.setScalar(template.scale); model.position.y -= template.minY;
    pivot.add(model); actor.root.add(pivot);
    codeVision?.register(model, "dynamic");
    model.traverse(object => {
      if (object.isMesh) { object.castShadow = false; object.receiveShadow = false; }
    });
    actor.model = model; actor.pivot = pivot; actor.mixer = new THREE.AnimationMixer(model);
    actor.actions = Object.fromEntries(Object.entries(template.clips).filter(([, value]) => value)
      .map(([name, value]) => [name, actor.mixer.clipAction(value)]));
    setAction(actor, actor.config.type === "disconnected" || actor.pause > 0 ? "idle" : "walk");
    actor.mixer.update(actor.poseTime % (actor.currentAction?.getClip().duration || 1));
  }
  function refreshPopulation(player) {
    const profile = populationProfile(combatArea && currentTier === "high" ? "medium" : currentTier), counts = { near: 0, middle: 0, far: 0, triangles: 0 };
    for (const actor of actors) {
      actor.proximity = Math.hypot(player.x - actor.root.position.x, player.z - actor.root.position.z);
      actor.nextLod = "off";
    }
    // Hysteresis favours already-near models, preventing LOD churn when two
    // citizens are almost the same distance from NeonBoy.
    const ordered = [...actors].sort((a, b) => {
      const priority = actor => actor.boarded || actor.passengerPending || actor.config.id === speaking ? -100 : actor.proximity - (actor.lod === "near" ? 2 : 0);
      return priority(a) - priority(b);
    });
    for (const actor of ordered) {
      if (!templates.has(actor.config.type)) continue;
      const d = actor.proximity, triangles = templates.get(actor.config.type).triangles;
      // A moving crowd can bring several of the heavier citizens into view at
      // once. Keep the mobile budget by reusing their existing billboard LOD.
      const fitsGeometry = counts.triangles + triangles <= (profile.maxNearTriangles ?? Infinity);
      if (fitsGeometry && counts.near < profile.near && (d < profile.nearRadius + (actor.lod === "near" ? 2 : 0) || actor.config.id === speaking || actor.boarded || actor.passengerPending)) {
        actor.nextLod = "near"; counts.near++; counts.triangles += triangles;
      } else if (actor.config.type !== "disconnected" && crowd.batches.has(actor.config.type)) {
        if (d < profile.middleRadius && counts.middle < profile.middle) { actor.nextLod = "middle"; counts.middle++; }
        else if (d < profile.farRadius && counts.far < profile.far) { actor.nextLod = "far"; counts.far++; }
      }
    }
    // Release before acquiring: even transiently we never exceed the skeleton cap.
    for (const actor of actors) if (actor.nextLod !== "near") releaseModel(actor);
    for (const actor of actors) {
      actor.lod = actor.nextLod; actor.root.visible = actor.lod !== "off";
      if (actor.lod === "near") acquireModel(actor);
      if (actor.boarded) { actor.root.visible = false; continue; }
      if (actor.lod === "off") { actor.aiTime = 0; actor.target.copy(actor.root.position); }
      if (actor.interaction) actor.interaction.reach = actor.model && actor.root.visible ? 2.9 : 0;
    }
    let shadowBudget = currentTier === "low" ? 0 : currentTier === "medium" ? 3 : 6;
    for (const actor of ordered) if (actor.model) {
      const cast = shadowBudget > 0 && actor.proximity < 18;
      if (cast) shadowBudget--;
      actor.model.traverse(object => { if (object.isMesh) object.castShadow = cast; });
    }
  }
  async function loadAssets(loader, isAlive) {
    for (const [type, files] of Object.entries(FAMILIES)) {
      if (disposed || !isAlive()) break;
      let base;
      try {
        base = await loader.loadAsync(files.model);
        if (disposed || !isAlive()) { disposeObjects([base.scene]); break; }
        const clips = { [type === "disconnected" ? "idle" : "walk"]:
          clipInPlace(base.animations[0], type === "disconnected" ? "idle" : "walk") };
        for (const key of ["idle", "walk", "talk", "react"]) {
          if (!files[key]) continue;
          const asset = await loader.loadAsync(files[key]);
          clips[key] = clipInPlace(asset.animations[0], key); disposeObjects([asset.scene]);
          if (disposed || !isAlive()) break;
        }
        if (disposed || !isAlive()) { disposeObjects([base.scene]); break; }
        const box = new THREE.Box3().setFromObject(base.scene);
        sources.add(base.scene);
        let triangles = 0;
        base.scene.traverse(object => {
          if (object.isMesh) triangles += (object.geometry.index?.count || object.geometry.attributes.position.count) / 3;
        });
        templates.set(type, { scene: base.scene, clips, triangles, minY: box.min.y, scale: 1.85 / Math.max(.01, box.max.y - box.min.y) });
        for (const actor of actors) if (actor.config.type === type && !actor.config.ambient) loaded.push(actor.config.id);
        refreshPopulation(lastPlayer);
      } catch (error) {
        if (base && !templates.has(type)) disposeObjects([base.scene]);
        if (!disposed) console.warn("No se pudo cargar el personaje " + type + ":", error);
      }
    }
    await crowd.ready;
    if (!disposed && isAlive()) refreshPopulation(lastPlayer);
    return loaded;
  }
  function load(loader, isAlive = () => true) {
    // A second caller reuses the promise instead of creating duplicate citizens.
    return loadPromise ||= loadAssets(loader, isAlive);
  }
  function react(id, player) {
    const actor = byId.get(id);
    if (!actor || actor.config.ambient || disposed) return false;
    speaking = id; actor.target.copy(actor.root.position); actor.pause = 4.2; actor.reactUntil = id === "ba-disconnected" ? 2.3 : 1.1;
    refreshPopulation(player || lastPlayer);
    if (player) actor.root.rotation.y = Math.atan2(player.x - actor.root.position.x, player.z - actor.root.position.z);
    setAction(actor, id === "ba-disconnected" ? "talk" : actor.actions.react ? "react" : "idle");
    return true;
  }
  function setDialogueSpeaking(active) {
    const next = Boolean(active);
    if (next === dialogueSpeaking) return;
    dialogueSpeaking = next;
    const actor = byId.get("ba-disconnected");
    if (actor && !disposed) {
      if (next) actor.target.copy(actor.root.position);
      setAction(actor, next ? "talk" : "idle");
    }
  }
  function canStand(x, z, fromX = x, fromZ = z) {
    return !actors.some(actor => {
      if (actor.boarded || actor.lod === "off") return false;
      const next = Math.hypot(actor.root.position.x - x, actor.root.position.z - z);
      if (next >= actor.colliderRadius) return false;
      const current = Math.hypot(actor.root.position.x - fromX, actor.root.position.z - fromZ);
      return current >= actor.colliderRadius || next <= current + .0001;
    });
  }
  // Mission-facing, one-shot hook. The caller owns persistence/progression.
  // The Desconectada is intentionally unaffected by the collective behaviour.
  function triggerCollectiveSynchronization({ id, player = lastPlayer, radius = 24, duration = 4 } = {}) {
    if (disposed || !id || synchronization || usedSynchronizations.has(id)) return false;
    const participants = actors.filter(actor => actor.lod !== "off" && actor.config.type !== "disconnected" &&
      Math.hypot(player.x - actor.root.position.x, player.z - actor.root.position.z) <= radius);
    if (!participants.length) return false;
    usedSynchronizations.add(id);
    synchronization = { id, elapsed: 0, duration, player: { x: player.x, z: player.z }, participants };
    for (const actor of participants) {
      actor.synchronized = true; actor.target.copy(actor.root.position); setAction(actor, "idle");
    }
    return true;
  }
  function update(dt, player, progress, paused, camera) {
    if (disposed) return null;
    Object.assign(lastPlayer, { x: player.x, z: player.z });
    const movingDt = paused ? 0 : Math.min(Math.max(dt, 0), .1);
    clock += movingDt; populationTick += movingDt;
    if (populationTick >= .4) { populationTick = 0; refreshPopulation(player); }
    const vision = progress?.visionActive && (progress?.citizens?.length || 0) >= 3;
    let event = null;
    if (!paused && vision && !progress.signalFound && !signalReported && Math.hypot(player.x, player.z + 5) < 34) {
      signalReported = true; event = "signal-found";
    }
    if (progress?.signalFound) signalReported = true;
    if (synchronization) {
      synchronization.elapsed += movingDt;
      if (synchronization.elapsed >= synchronization.duration) {
        for (const actor of synchronization.participants) { actor.synchronized = false; setAction(actor, actor.pause > 0 ? "idle" : "walk"); }
        synchronization = null;
      }
    }
    const profile = populationProfile(combatArea && currentTier === "high" ? "medium" : currentTier);
    for (const actor of actors) {
      const { root: actorRoot, config } = actor;
      if (actor.boarded) { actorRoot.visible = false; continue; }
      if (actor.lod === "off") {
        actor.phoneGlow.visible = false; if (actor.signal) actor.signal.visible = false;
        continue;
      }
      let animationDt = paused && config.type === "disconnected" && dialogueSpeaking ? Math.min(Math.max(dt, 0), .1) : movingDt;
      if (actor.synchronized && synchronization) {
        actor.yaw = Math.atan2(synchronization.player.x - actorRoot.position.x, synchronization.player.z - actorRoot.position.z);
        if (synchronization.elapsed >= 1) animationDt = 0;
      } else if (actor.missionAnchor) {
        actorRoot.position.set(actor.missionAnchor.x, 0, actor.missionAnchor.z);
        actor.target.copy(actorRoot.position); actor.pause = 1; actor.waiting = true; setAction(actor, "idle");
      } else if (movingDt > 0 && inCombatArea(actorRoot.position.x, actorRoot.position.z)) {
        const direction = actorRoot.position.x < 0 ? -1 : 1;
        const x = actorRoot.position.x + direction * movingDt * 1.35;
        if (environmentAvoid(x, actorRoot.position.z)) actorRoot.position.x = x;
        actor.yaw = direction * Math.PI / 2; actor.target.copy(actorRoot.position); setAction(actor, "walk");
      } else if (movingDt > 0) {
        if (actor.pause > 0) {
          actor.pause = Math.max(0, actor.pause - movingDt); actor.reactUntil = Math.max(0, actor.reactUntil - movingDt);
          if (actor.pause === 0) { if (speaking === config.id) speaking = null; setAction(actor, config.route == null ? "idle" : "walk"); }
          else if (actor.reactUntil === 0) setAction(actor, "idle");
        } else {
          actor.aiTime += movingDt;
          const interval = actor.lod === "near" ? 1 / 15 : 1 / (actor.lod === "middle" ? profile.middleHz : profile.farHz);
          if (actor.aiTime >= interval) { planCitizenStep(actor, actors, lastPlayer, actor.aiTime, clock, canAvoid); actor.aiTime = 0; }
        }
        if (actor.pause === 0 && config.route != null) {
          moveCitizen(actor, actors, lastPlayer, movingDt, clock, canAvoid);
          setAction(actor, actor.waiting ? "idle" : "walk");
          if (!actor.waiting && actor.currentAction && actor.currentAction === actor.actions.walk)
            actor.currentAction.setEffectiveTimeScale(Math.max(.2, actor.motionSpeed / .8));
        }
      }
      if (movingDt > 0 && (speaking !== config.id || actor.synchronized) &&
          (!actor.synchronized || synchronization.elapsed < 1)) {
        const delta = Math.atan2(Math.sin(actor.yaw - actorRoot.rotation.y), Math.cos(actor.yaw - actorRoot.rotation.y));
        actorRoot.rotation.y += delta * Math.min(1, movingDt * (actor.synchronized ? 2.5 : 5));
      }
      if (actor.interaction) {
        actor.interaction.x = actorRoot.position.x; actor.interaction.z = actorRoot.position.z;
      }
      if (actor.mixer) actor.mixer.update(paused && speaking === config.id ? Math.min(Math.max(dt, 0), .05) : animationDt);
      actor.poseTick += animationDt;
      if (actor.poseTick >= (actor.lod === "far" ? .5 : .12)) {
        if (!actor.pause && !actor.waiting) actor.poseTime += actor.poseTick * config.speed;
        actor.poseTick = 0;
      }
      actor.phoneGlow.visible = Boolean(vision && ["man", "woman", "executive", "elder"].includes(config.type) && actor.lod === "near");
      if (actor.signal) {
        actor.signal.visible = actor.phoneGlow.visible && currentTier !== "low";
        if (actor.signal.visible) {
          const pos = actor.signal.geometry.attributes.position;
          pos.setXYZ(0, actorRoot.position.x, 1.25, actorRoot.position.z);
          pos.setXYZ(1, actorRoot.position.x, 5.2, actorRoot.position.z); pos.setXYZ(2, 0, 8, -5); pos.needsUpdate = true;
        }
      }
    }
    crowd.update(actors, camera, player);
    return event;
  }
  function applyQuality(next) {
    currentTier = next; refreshPopulation(lastPlayer);
  }
  function getStats() {
    const counts = { near: 0, middle: 0, far: 0, off: 0 };
    for (const actor of actors) counts[actor.lod]++;
    return { tier: currentTier, ...counts, skeletons: actors.filter(actor => actor.model).length,
      nearTriangles: actors.reduce((sum, actor) => sum + (actor.model ? templates.get(actor.config.type).triangles : 0), 0),
      total: actors.length, logicalCitizens: interactions.length, synchronized: synchronization?.participants.length || 0 };
  }
  function dispose() {
    if (disposed) return;
    disposed = true; synchronization = null; crowd.dispose();
    for (const actor of actors) releaseModel(actor);
    // Templates, source textures, sprites and instanced geometry are disposed
    // exactly once by the caller's disposeObjects(root) traversal.
  }
  return { preparePassenger(id, pending = true) { const actor = byId.get(id); if (!actor) return false; actor.passengerPending = pending; refreshPopulation(lastPlayer); return !!actor.model; }, setBoarded(id, value) { const actor = byId.get(id); if(actor) { actor.boarded = value; actor.root.visible = !value && actor.lod !== "off"; } }, group, actors, interactions, load, update, react, applyQuality, dispose, getStats, canStand,
    setMissionAnchor(id, position) {
      const actor = byId.get(id); if (!actor) return;
      if (actor.missionAnchor?.x === position.x && actor.missionAnchor?.z === position.z) return;
      actor.missionAnchor = { ...position }; actor.root.position.set(position.x, 0, position.z);
      actor.target.copy(actor.root.position); actor.pause = 1; actor.waiting = true;
      refreshPopulation(lastPlayer);
    },
    setCombatArea(area) { combatArea = area; },
    triggerCollectiveSynchronization, setDialogueSpeaking, get pedestrianGreen() { return clock % 20 >= 12; },
    loadedIds: loaded, getPosition: id => byId.get(id)?.root.position };
}
