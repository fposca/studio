import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createRecordStoreCharacter } from "./recordStoreCharacter.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { createGameParticles } from "./gameParticles.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildRecordStore } from "./recordStoreScenery.js";
import { COIN_TABLE_POSITION, JUKEBOX_POSITION } from "./recordStoreJukeboxScenery.js";
import { STORE_LAYOUT, STORE_ALBUM_POSITIONS, STORE_OBSTACLES } from "./recordStoreLayout.js";
import { createRecordStoreVideoProjection } from "./recordStoreVideoProjection.js";
import { createRecordStoreNpcActors } from "./recordStoreNpcActors.js";
import { STORE_NPCS } from "./recordStoreDialogue.js";
import { buildRecordingStudio } from "./recordingStudioScenery.js";
import { applyStudioAssetTransform, loadStudioAssets } from "./studioAssets.js";
import { STUDIO_LAYOUT, STUDIO_OBSTACLES } from "./studioLayout.js";

const IDLE_URL = new URL("../assets/neonboy-animaciones/neon-inactivo-hd.store.glb", import.meta.url).href;
const WALK_URL = new URL("../assets/neonboy-animaciones/neonboy-new-walk.anim.glb", import.meta.url).href;
const JUMP_URL = new URL("../assets/neonboy-animaciones/neonboy-new-jump.anim.glb", import.meta.url).href;
const STEP_URLS = [
  new URL("../assets/neonboy-animaciones/step-1.mp3", import.meta.url).href,
  new URL("../assets/neonboy-animaciones/step-2.mp3", import.meta.url).href
];

const COIN_URL = new URL("../assets/neonboy-animaciones/moneda.optimized.glb", import.meta.url).href;
function inPlaceClip(source, name) {
  if (!source) return null;
  const clip = source.clone();
  clip.name = name;
  const first = Math.min(...clip.tracks.map((track) => track.times[0]));
  for (const track of clip.tracks) {
    track.shift(-first);
    if (/Hips\.position$/.test(track.name)) {
      const y = track.values[1];
      for (let i = 0; i < track.values.length; i += 3) {
        track.values[i] = 0;
        if (name === "jump") track.values[i + 1] = y;
        track.values[i + 2] = 0;
      }
    }
  }
  clip.resetDuration();
  return clip;
}

export default function RecordStoreScene({ scenario = "store", albums, onSelect, onNearby, onOpenJukebox, onTakeCoins, onNpcInteract, onExamine, onViewChange, onJumpChange, credits = 0, activeNpc = null, roxyPlaying = false, dancingSkeleton = null, interactionLocked = false, projectionPaused = false, firstPerson = false, outsideVideo = null, playbackApiRef, playerSnapshotRef, studioTransformsRef, studioAssetApiRef }) {
  const isStudio = scenario === "studio";
  const canvasRef = useRef(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [rendererVersion, setRendererVersion] = useState(0);
  const callbacks = useRef({ onSelect, onNearby, onOpenJukebox, onTakeCoins, onNpcInteract, onExamine, onViewChange, onJumpChange, credits, activeNpc, roxyPlaying, dancingSkeleton, interactionLocked, projectionPaused, outsideVideo });
  const actions = useRef({});
  const keys = useRef(new Set());
  callbacks.current = { onSelect, onNearby, onOpenJukebox, onTakeCoins, onNpcInteract, onExamine, onViewChange, onJumpChange, credits, activeNpc, roxyPlaying, dancingSkeleton, interactionLocked, projectionPaused, outsideVideo };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    setSceneReady(false);
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
    catch { setSceneReady(true); setWebglError(true); return undefined; }
    setWebglError(false);
    const onContextLost = (event) => { event.preventDefault(); setWebglError(true); };
    const onContextRestored = () => {
      renderer.resetState();
      renderer.shadowMap.needsUpdate = true;
      setWebglError(false);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isStudio ? 0x15121b : 0x120d18);
    scene.fog = new THREE.Fog(isStudio ? 0x17111e : 0x211824, 20, 48);
    scene.add(new THREE.HemisphereLight(0xd7cfe3, 0x554234, isStudio ? 0.88 : 1.04));
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.3;
    room.dispose(); pmrem.dispose();
    const shop = isStudio ? null : buildRecordStore(scene, albums, STORE_ALBUM_POSITIONS, STORE_OBSTACLES);
    const studio = isStudio ? buildRecordingStudio(scene) : null;
    if (studio && studioAssetApiRef) studioAssetApiRef.current = { apply: (id, transform) => applyStudioAssetTransform(studio, id, transform) };
    const coinParticles = isStudio ? null : createGameParticles(scene);
    const videoProjection = isStudio ? null : createRecordStoreVideoProjection(canvas.parentElement, shop.jukebox, shop.standbyLabel);
    if (playbackApiRef && videoProjection) playbackApiRef.current = { getSnapshot: videoProjection.getSnapshot };
    for (const [x, z, color] of (isStudio ? [] : [[0, -9, 0xffe2b9], [-7, -1, 0xcba9e1], [7, 4, 0xffcd9b], [0, 11, 0xffddb1]])) {
      const light = new THREE.PointLight(color, 24, 15, 2);
      light.position.set(x, 4.3, z);
      scene.add(light);
    }
    const camera = new THREE.PerspectiveCamera(63, 1, 0.05, 75);
    const layout = isStudio ? STUDIO_LAYOUT : STORE_LAYOUT;
    const snapshot = playerSnapshotRef?.current;
    const player = { x: snapshot?.x ?? 0, y: 0, z: snapshot?.z ?? layout.spawnZ, yaw: snapshot?.yaw ?? Math.PI, health: 100, grounded: true, speed: 0,
      running: false, attack: null, stun: 0, equipped: "unarmed", combat: 0, velocityY: 0, landing: 0, jumpAge: 0, raiseArmsOnJump: false };
    const playerLight = new THREE.PointLight(0xd7bbff, 11, 5, 2);
    scene.add(playerLight);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stepSounds = STEP_URLS.map((url) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.volume = 0.36;
      return audio;
    });
    let stepTravel = 0.35, nextStep = 0;
    const view = { yaw: snapshot?.viewYaw ?? 0, pitch: 0.34, firstPitch: 0, firstPerson: false, distance: 4.5, bobPhase: 0, bobWeight: 0 };
    camera.position.set(player.x + Math.sin(view.yaw) * view.distance, 2.7, Math.min(player.z + 4, isStudio ? layout.cameraFrontZ : 15.1));
    camera.lookAt(player.x, player.y + 1.2, player.z);
    let character = null, idleAsset = null, walkAsset = null, jumpAsset = null, alive = true, frame = 0, last = 0, elapsed = 0;
    let dragging = null, nearKey = null, nearInteraction = null;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      videoProjection?.resize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const npcActors = isStudio ? null : createRecordStoreNpcActors(scene, loader, shop.clickable, disposeObjects, { deferLoad: true });
    const studioReady = studio ? loadStudioAssets(studio, loader, () => studioTransformsRef?.current || {}, () => alive).then((loaded) => {
      if (alive) canvas.dataset.studioModels = loaded.join(",");
    }) : Promise.resolve();
    const playerReady = Promise.all([loader.loadAsync(IDLE_URL), loader.loadAsync(WALK_URL), loader.loadAsync(JUMP_URL)]).then(([idle, walk, jump]) => {
      idleAsset = idle;
      walkAsset = walk;
      jumpAsset = jump;

      if (!alive) { disposeObjects([idle.scene, walk.scene, jump.scene]); return; }
      const idleClip = inPlaceClip(idle.animations.find((clip) => clip.duration > 0.25), "idle");
      const walkClip = inPlaceClip(walk.animations.find((clip) => clip.duration > 0.25), "walk");
      const jumpClip = inPlaceClip(jump.animations.find((clip) => clip.duration > 0.25), "jump");

      if (!idleClip || !walkClip || !jumpClip) return;
      character = createRecordStoreCharacter({ scene: idle.scene, idleClip, walkClip, jumpClip });
      scene.add(character.root);
      disposeObjects([walk.scene, jump.scene]);
      walkAsset = null;
      jumpAsset = null;

    }).catch(() => { /* The shop remains navigable if a character animation cannot load. */ });
    const coinReady = isStudio ? Promise.resolve() : loader.loadAsync(COIN_URL).then(({ scene: coinModel }) => {
      if (!alive) { disposeObjects([coinModel]); return; }
      const bounds = new THREE.Box3().setFromObject(coinModel);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 0.27 / Math.max(size.x, size.y, size.z, 0.001);
      coinModel.traverse((object) => {
        if (!object.isMesh) return;
        for (const material of [object.material].flat()) {
          material.color?.set(0xffd17c);
          material.metalness = 0.58;
          material.roughness = 0.31;
          material.emissiveMap = null;
          material.emissive?.set(0x80501a);
          material.emissiveIntensity = 0.25;
          material.needsUpdate = true;
        }
      });
      shop.fallbackCoins.forEach((coin) => { coin.parent?.remove(coin); coin.geometry.dispose(); });
      shop.fallbackCoins[0]?.material.dispose();
      for (const spinner of shop.coinSpinners) {
        const coin = coinModel.clone(true);
        coin.scale.setScalar(scale);
        coin.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        spinner.add(coin);
      }
    }).catch(() => { /* Gold fallback coins remain on the table. */ });
    Promise.all([playerReady, coinReady, studioReady, shop?.ready || Promise.resolve()]).then(() => {
      if (!alive) return;
      setSceneReady(true);
      npcActors?.load();
    });

    const isField = (target) => /INPUT|TEXTAREA|SELECT/.test(target?.tagName);
    const interact = (target) => {
      if (!target) return;
      if (target.kind === "examine") callbacks.current.onExamine?.(target.id);
      if (target.kind === "album") callbacks.current.onSelect(target.id);
      if (target.kind === "jukebox") callbacks.current.onOpenJukebox();
      if (target.kind === "coins" && callbacks.current.onTakeCoins() > 0) {
        shop.coinGroup.visible = false;
        for (const offset of [-0.26, 0, 0.26]) {
          coinParticles.emit({ type: "coin", x: COIN_TABLE_POSITION.x + offset, y: 1.26, z: COIN_TABLE_POSITION.z }, "neonboy");
        }
      }
      if (target.kind === "npc") {
        const npc = STORE_NPCS.find((entry) => entry.id === target.id);
        const position = npc && npcActors?.getPosition(npc.id);
        if (npc && position && Math.hypot(player.x - position.x, player.z - position.z) <= npc.reach) callbacks.current.onNpcInteract(npc.id);
      }
    };
    const toggleView = () => {
      view.firstPerson = !view.firstPerson;
      if (!view.firstPerson && document.pointerLockElement === canvas) document.exitPointerLock();
      callbacks.current.onViewChange(view.firstPerson);
    };
    const jump = () => {
      if (!player.grounded) return;
      player.grounded = false;
      player.velocityY = 6.4;
      player.jumpAge = 0;
      player.landing = 0;
      callbacks.current.onJumpChange(true);
    };
    actions.current = { toggleView, jump, interact: () => interact(nearInteraction) };
    const onKeyDown = (event) => {
      if (callbacks.current.interactionLocked || isField(event.target)) return;
      if (event.code === "KeyV" && !event.repeat) { event.preventDefault(); toggleView(); return; }
      if (event.code === "Space" && !event.repeat) { event.preventDefault(); jump(); return; }
      if (event.code === "KeyE" && !event.repeat) { event.preventDefault(); interact(nearInteraction); return; }
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight", "KeyQ"].includes(event.code)) {
        event.preventDefault();
        keys.current.add(event.code);
      }
    };
    const onKeyUp = (event) => keys.current.delete(event.code);
    const onBlur = () => keys.current.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    const selectAt = (event) => {
      if (isStudio) return false;
      const rect = canvas.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(shop.clickable, false)[0];
      if (hit?.object.userData.albumId) interact({ kind: "album", id: hit.object.userData.albumId });
      else if (hit?.object.userData.shopAction) interact({ kind: hit.object.userData.shopAction, id: hit.object.userData.npcId });
      return Boolean(hit);
    };
    const onPointerDown = (event) => {
      if (callbacks.current.interactionLocked || selectAt(event)) return;
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY };
      if (view.firstPerson && event.pointerType === "mouse" && canvas.requestPointerLock) canvas.requestPointerLock().catch(() => {});
      else canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (callbacks.current.interactionLocked) return;
      const locked = document.pointerLockElement === canvas;
      if (!locked && (!dragging || dragging.id !== event.pointerId)) return;
      const deltaX = locked ? event.movementX : event.clientX - dragging.x;
      const deltaY = locked ? event.movementY : event.clientY - dragging.y;
      view.yaw -= deltaX * 0.004;
      if (view.firstPerson) view.firstPitch = THREE.MathUtils.clamp(view.firstPitch + deltaY * 0.003, -0.95, 0.95);
      else view.pitch = THREE.MathUtils.clamp(view.pitch + deltaY * 0.003, 0.12, 0.75);
      if (!locked) { dragging.x = event.clientX; dragging.y = event.clientY; }
    };
    const onPointerUp = () => { dragging = null; };
    const onWheel = (event) => {
      if (callbacks.current.interactionLocked) return;
      event.preventDefault();
      if (!view.firstPerson) view.distance = THREE.MathUtils.clamp(view.distance + event.deltaY * 0.005, 3, 7);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    const obstacles = isStudio ? STUDIO_OBSTACLES : STORE_OBSTACLES;
    const canMove = (x, z) => Math.abs(x) < layout.playerLimitX && z > layout.playerBackZ && z < layout.playerFrontZ &&
      !obstacles.some((obstacle) => Math.abs(x - obstacle.x) < obstacle.hx + 0.46 && Math.abs(z - obstacle.z) < obstacle.hz + 0.46) &&
      (isStudio || !["roxy", "freddy", "jason"].some((id) => {
        const position = npcActors.getPosition(id);
        return position && Math.hypot(x - position.x, z - position.z) < 0.88;
      }));
    const lookAt = new THREE.Vector3();
    const desiredCamera = new THREE.Vector3();
    const cameraRay = new THREE.Raycaster();
    const cameraDirection = new THREE.Vector3();
    function animate(now) {
      if (!alive) return;
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      elapsed += dt;
      const held = keys.current;
      if (callbacks.current.interactionLocked) held.clear();
      const forward = Number(held.has("KeyW") || held.has("ArrowUp")) - Number(held.has("KeyS") || held.has("ArrowDown"));
      const right = Number(held.has("KeyD") || held.has("ArrowRight")) - Number(held.has("KeyA") || held.has("ArrowLeft"));
      if (held.has("KeyQ")) view.yaw += dt * 1.8;
      const length = Math.hypot(forward, right) || 1;
      const speed = held.has("ShiftLeft") || held.has("ShiftRight") ? 5 : 2.8;
      const previousX = player.x, previousZ = player.z;
      const dx = (right * Math.cos(view.yaw) - forward * Math.sin(view.yaw)) / length * speed * dt;
      const dz = (-right * Math.sin(view.yaw) - forward * Math.cos(view.yaw)) / length * speed * dt;
      if (canMove(player.x + dx, player.z)) player.x += dx;
      if (canMove(player.x, player.z + dz)) player.z += dz;
      const moved = Math.hypot(player.x - previousX, player.z - previousZ);
      player.speed = moved / Math.max(dt, 0.001);
      player.running = speed > 4;
      if (playerSnapshotRef) playerSnapshotRef.current = { x: player.x, z: player.z, yaw: player.yaw, viewYaw: view.yaw };
      if (player.grounded && player.speed > 0.2) {
        stepTravel += moved;
        const stride = player.running ? 0.84 : 0.98;
        if (stepTravel >= stride) {
          const sound = stepSounds[nextStep++ % stepSounds.length];
          sound.currentTime = 0;
          sound.play().catch(() => { /* Browser audio permission can block footsteps. */ });
          stepTravel %= stride;
        }
      } else stepTravel = 0.35;
      if (view.firstPerson) player.yaw = Math.PI + view.yaw;
      else if (player.speed > 0.1) {
        const nextYaw = Math.atan2(dx, dz);
        player.yaw += Math.atan2(Math.sin(nextYaw - player.yaw), Math.cos(nextYaw - player.yaw)) * Math.min(1, dt * 12);
      }
      if (!player.grounded) {
        player.jumpAge += dt;
        player.velocityY -= 18 * dt;
        player.y = Math.max(0, player.y + player.velocityY * dt);
        if (player.y === 0 && player.velocityY < 0) {
          player.velocityY = 0;
          player.grounded = true;
          player.landing = 0.17;
          callbacks.current.onJumpChange(false);
        }
      }
      player.landing = Math.max(0, player.landing - dt);
      const bobTarget = view.firstPerson && player.grounded && player.speed > 0.1 && !reducedMotion ? Math.min(1.3, player.speed / 2.8) : 0;
      view.bobWeight = THREE.MathUtils.damp(view.bobWeight, bobTarget, 10, dt);
      if (bobTarget > 0) view.bobPhase += player.speed * dt * 2.75;
      const nextFov = view.firstPerson ? 76 : 63;
      if (camera.fov !== nextFov) { camera.fov = nextFov; camera.updateProjectionMatrix(); }
      if (view.firstPerson) {
        const headY = player.y + 1.68;
        const sway = Math.sin(view.bobPhase) * 0.058 * view.bobWeight;
        const rise = Math.cos(view.bobPhase * 2) * 0.072 * view.bobWeight;
        const eyeX = player.x + Math.cos(view.yaw) * sway;
        const eyeZ = player.z - Math.sin(view.yaw) * sway;
        camera.position.set(eyeX, headY + rise, eyeZ);
        lookAt.set(eyeX - Math.sin(view.yaw) * 10, headY + rise - Math.tan(view.firstPitch) * 10, eyeZ - Math.cos(view.yaw) * 10);
        camera.lookAt(lookAt);
        camera.rotateZ(Math.sin(view.bobPhase) * 0.018 * view.bobWeight);
      } else {
        lookAt.set(player.x, player.y + 1.2, player.z);
        desiredCamera.set(player.x + Math.sin(view.yaw) * view.distance * Math.cos(view.pitch),
          player.y + 1.2 + Math.sin(view.pitch) * view.distance,
          player.z + Math.cos(view.yaw) * view.distance * Math.cos(view.pitch));
        desiredCamera.x = THREE.MathUtils.clamp(desiredCamera.x, isStudio ? -layout.cameraLimitX : -10.35, isStudio ? layout.cameraLimitX : 10.35);
        desiredCamera.z = THREE.MathUtils.clamp(desiredCamera.z, isStudio ? layout.cameraBackZ : -13.2, isStudio ? layout.cameraFrontZ : 15.1);
        if (studio) {
          const rayLength = cameraDirection.copy(desiredCamera).sub(lookAt).length();
          cameraRay.set(lookAt, cameraDirection.normalize());
          cameraRay.far = rayLength;
          const hit = cameraRay.intersectObjects(studio.colliders, false)[0];
          if (hit) desiredCamera.copy(lookAt).addScaledVector(cameraDirection, Math.max(0.55, hit.distance - 0.28));
        }
        camera.position.lerp(desiredCamera, Math.min(1, dt * 10));
        camera.lookAt(lookAt);
      }
      playerLight.position.set(player.x - 0.8, player.y + 2.65, player.z + 1.45);
      character?.update(player, dt, camera, elapsed);
      if (character) {
        character.root.visible = !view.firstPerson;
        character.root.rotation.x = player.grounded ? 0 : -Math.sin(Math.min(1, player.jumpAge / 0.72) * Math.PI) * 0.16;
      }
      let closest = null, distance = Infinity;
      for (const spot of shop?.albumTargets || []) {
        const gap = Math.hypot(player.x - spot.x, player.z - spot.z);
        if (gap < spot.reach && gap < distance) { distance = gap; closest = { kind: "album", id: spot.id }; }
      }
      for (const [kind, position, reach] of (isStudio ? [] : [["jukebox", JUKEBOX_POSITION, 2.8], ["coins", COIN_TABLE_POSITION, 2.45]])) {
        const gap = Math.hypot(player.x - position.x, player.z - position.z);
        if (gap < reach && gap < distance) { distance = gap; closest = { kind }; }
      }
      for (const npc of (isStudio ? [] : STORE_NPCS)) {
        const position = npcActors.getPosition(npc.id);
        if (!position) continue;
        const gap = Math.hypot(player.x - position.x, player.z - position.z);
        if (gap < npc.reach && gap < distance) { distance = gap; closest = { kind: "npc", id: npc.id }; }
      }
      for (const spot of studio?.interactions || []) {
        const gap = Math.hypot(player.x - spot.x, player.z - spot.z);
        if (gap < spot.reach && gap < distance) { distance = gap; closest = { kind: "examine", id: spot.id, label: spot.label }; }
      }
      if (npcActors) {
        const liveRoxyPlaying = callbacks.current.projectionPaused ? callbacks.current.roxyPlaying :
          callbacks.current.outsideVideo ? (videoProjection.getSnapshot()?.playing ?? callbacks.current.roxyPlaying) : false;
        npcActors.update(dt, player, callbacks.current.activeNpc, closest?.kind === "npc" ? closest.id : null, liveRoxyPlaying, callbacks.current.dancingSkeleton);
        const roxyActor = npcActors.actors.get("roxy");
        const roxyState = roxyActor?.state || "idle";
        if (canvas.dataset.roxyState !== roxyState) canvas.dataset.roxyState = roxyState;
        const roxyReady = String(Boolean(roxyActor?.model && roxyActor.actions.walk && roxyActor.actions.guitar));
        if (canvas.dataset.roxyReady !== roxyReady) canvas.dataset.roxyReady = roxyReady;
      }
      const nextKey = closest ? closest.kind + (closest.id || "") : null;
      if (nextKey !== nearKey) { nearKey = nextKey; nearInteraction = closest; callbacks.current.onNearby(closest); }
      shop?.bulbs.forEach((bulb, index) => { bulb.scale.setScalar(0.95 + Math.sin(elapsed * 1.8 + index * 0.9) * 0.05); });
      shop?.records.forEach((record) => { record.rotation.z -= dt * 3.49; });
      if (shop) shop.coinGroup.visible = callbacks.current.credits < 10;
      shop?.coinSpinners.forEach((spinner, index) => {
        spinner.rotation.y += dt * (2.8 + index % 3 * 0.25);
        spinner.position.y = spinner.userData.baseY + Math.sin(elapsed * 3.2 + index * 0.58) * 0.025;
      });
      coinParticles?.update(dt);
      shop?.atmosphere.update(elapsed, reducedMotion);
      if (shop) shop.glow.intensity = 4.4 + Math.sin(elapsed * 2.4) * 0.6;
      videoProjection?.setVideo(callbacks.current.projectionPaused ? null : callbacks.current.outsideVideo);
      renderer.render(scene, camera);
      videoProjection?.render(camera);
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      keys.current.clear();
      stepSounds.forEach((sound) => sound.pause());
      actions.current = {};
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      character?.dispose();
      npcActors?.dispose();
      videoProjection?.dispose();
      if (playbackApiRef) playbackApiRef.current = null;
      if (studioAssetApiRef) studioAssetApiRef.current = null;
      disposeObjects([scene]);
      if (idleAsset) disposeObjects([idleAsset.scene]);
      if (walkAsset) disposeObjects([walkAsset.scene]);
      if (jumpAsset) disposeObjects([jumpAsset.scene]);

      environment.dispose();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [albums, isStudio, rendererVersion]);

  const hold = (code, pressed) => { if (pressed) keys.current.add(code); else keys.current.delete(code); };
  return <div className="record-store-3d" data-scenario={scenario} data-view={firstPerson ? "primera" : "tercera"} data-ready={sceneReady} aria-busy={!sceneReady}>
    <canvas key={`${scenario}-${rendererVersion}`} ref={canvasRef} aria-label={isStudio ? "Neon Recording Studio 3D recorrible" : "Disquería 3D recorrible de Neonboy"} />
    {webglError && <div className="record-store-webgl-error" role="alert">
      <div className="record-store-loading-panel">
        <strong>La escena 3D se interrumpi&oacute;</strong>
        <p>Chrome perdi&oacute; la conexi&oacute;n con la placa de video.</p>
        <button type="button" onClick={() => { setSceneReady(false); setWebglError(false); setRendererVersion((version) => version + 1); }}>Recuperar escena</button>
      </div>
    </div>}
    {!sceneReady && !webglError && <div className="record-store-loading" role="status" aria-live="polite">
      <div className="record-store-loading-panel">
        <span className="record-store-loading-label">NEONBOY MUSIC · 199X</span>
        <span className="record-store-loading-vinyl" aria-hidden="true"><i /></span>
        <strong>{isStudio ? "Preparando el estudio" : "Preparando la disquería"}</strong>
        <small>{isStudio ? "Cargando sala de control, cabina y NeonBoy…" : "Cargando discos, personajes y escenario…"}</small>
        <span className="record-store-loading-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span>
      </div>
    </div>}
    {firstPerson && <span className="record-store-crosshair" aria-hidden="true" />}
    <div className="record-store-mobile-move" aria-label="Moverse por la disquería">
      {[["↑", "KeyW"], ["←", "KeyA"], ["↓", "KeyS"], ["→", "KeyD"]].map(([symbol, code]) =>
        <button key={code} type="button" aria-label={`Mover ${symbol}`} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); hold(code, true); }}
          onPointerUp={() => hold(code, false)} onPointerCancel={() => hold(code, false)} onLostPointerCapture={() => hold(code, false)}>{symbol}</button>)}
    </div>
    <div className="record-store-mobile-actions" aria-label="Acciones en la disquería">
      <button type="button" onClick={() => actions.current.toggleView?.()} aria-label="Cambiar vista">{firstPerson ? "3ª persona" : "1ª persona"}</button>
      <button type="button" onClick={() => actions.current.jump?.()} aria-label="Saltar">Saltar</button>
      <button type="button" onClick={() => actions.current.interact?.()} aria-label="Interactuar">E · Usar</button>
    </div>
  </div>;
}
