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
import { STUDIO_LAYOUT } from "./studioLayout.js";
import { ROCK_CLUB_LAYOUT, rockClubFloorHeight } from "./rockClubLayout.js";
import { buildRockClub } from "./rockClubScenery.js";
import { applyRockClubPropTransform, loadRockClubAssets } from "./rockClubAssets.js";
import { createRockClubActors } from "./rockClubActors.js";
import { ROCK_CLUB_STAGE_MARKS } from "./rockClubBand.js";
import { createConcertCamera } from "./rockClubConcertCamera.js";
import { createRockClubConcertProps, findConcertBone } from "./rockClubConcertProps.js";
import { createRockClubConcertPoseController } from "./rockClubConcertPoseController.js";
import { sampleConcertMotion } from "./rockClubConcertMotion.js";
import { ARCADE_LAYOUT } from "./arcadeLayout.js";
import { buildArcade } from "./arcadeScenery.js";
import { createArcadeActors } from "./arcadeActors.js";
import { buildFrequency09Realm, FREQUENCY09_LAYOUT } from "./frequency09Realm.js";

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

export default function RecordStoreScene({ scenario = "store", albums, onSelect, onNearby, onOpenJukebox, onTakeCoins, onNpcInteract, onHugoInteract, onExamine, onViewChange, onJumpChange, credits = 0, activeNpc = null, roxyPlaying = false, dancingSkeleton = null, interactionLocked = false, projectionPaused = false, paused = false, firstPerson = false, outsideVideo = null, playbackApiRef, playerSnapshotRef, studioTransformsRef, studioAssetApiRef, clubTransformsRef, clubAssetApiRef, arcadeTransformsRef, arcadeAssetApiRef, arcadeAltered = false, onArcadeEvent, frequencyPhase = "idle", onConcertStart, concertReady = false, concertActive = false, concertEffectRef, concertTransformsRef, concertMotionRef, concertPoseRef, motionPlaybackOffsetsRef, motionRecordingId = null, concertCameraMode = "auto", concertEditor = null, onPoseGizmoChange }) {
  const isStudio = scenario === "studio";
  const isClub = scenario === "rock-club";
  const isArcade = scenario === "arcade";
  const isRealm = scenario === "frequency-09";
  const isInterior = isStudio || isClub || isArcade || isRealm;
  const canvasRef = useRef(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [rendererVersion, setRendererVersion] = useState(0);
  const callbacks = useRef({ onSelect, onNearby, onOpenJukebox, onTakeCoins, onNpcInteract, onHugoInteract, onExamine, onViewChange, onJumpChange, credits, activeNpc, roxyPlaying, dancingSkeleton, interactionLocked, projectionPaused, paused, outsideVideo, arcadeAltered, onArcadeEvent, frequencyPhase, onConcertStart, concertReady, concertActive, concertEffectRef, concertCameraMode, concertEditor, motionRecordingId, onPoseGizmoChange });
  const actions = useRef({});
  const keys = useRef(new Set());
  callbacks.current = { onSelect, onNearby, onOpenJukebox, onTakeCoins, onNpcInteract, onHugoInteract, onExamine, onViewChange, onJumpChange, credits, activeNpc, roxyPlaying, dancingSkeleton, interactionLocked, projectionPaused, paused, outsideVideo, arcadeAltered, onArcadeEvent, frequencyPhase, onConcertStart, concertReady, concertActive, concertEffectRef, concertCameraMode, concertEditor, motionRecordingId, onPoseGizmoChange };

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
    scene.background = new THREE.Color(isClub ? 0x0e0b12 : isArcade ? 0x130d1a : isStudio ? 0x15121b : 0x120d18);
    scene.fog = new THREE.Fog(isClub ? 0x211319 : isArcade ? 0x241829 : isStudio ? 0x17111e : 0x211824, isClub ? 18 : 20, 48);
    scene.add(new THREE.HemisphereLight(0xd7cfe3, 0x554234, isClub ? 0.95 : isArcade || isRealm ? 0.34 : isStudio ? 0.88 : 1.04));
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = isArcade ? 0.18 : 0.3;
    room.dispose(); pmrem.dispose();
    const shop = isInterior ? null : buildRecordStore(scene, albums, STORE_ALBUM_POSITIONS, STORE_OBSTACLES);
    const studio = isStudio ? buildRecordingStudio(scene) : null;
    const club = isClub ? buildRockClub(scene) : null;
    const arcade = isArcade ? buildArcade(scene, callbacks.current.arcadeAltered) : null;
    const realm = isRealm ? buildFrequency09Realm(scene) : null;
    if (arcade) for (const [id, transform] of Object.entries(arcadeTransformsRef?.current || {})) arcade.applyTransform(id, transform);
    if (arcade && arcadeAssetApiRef) arcadeAssetApiRef.current = { apply: (id, transform) => arcade.applyTransform(id, transform) };
    if (club) for (const [id, transform] of Object.entries(clubTransformsRef?.current || {}))
      applyRockClubPropTransform(club, id, transform);
    if (studio && studioAssetApiRef) studioAssetApiRef.current = { apply: (id, transform) => applyStudioAssetTransform(studio, id, transform) };
    const coinParticles = isInterior ? null : createGameParticles(scene);
    const videoProjection = isInterior ? null : createRecordStoreVideoProjection(canvas.parentElement, shop.jukebox, shop.standbyLabel);
    if (playbackApiRef && videoProjection) playbackApiRef.current = { getSnapshot: videoProjection.getSnapshot };
    for (const [x, z, color] of (isInterior ? [] : [[0, -9, 0xffe2b9], [-7, -1, 0xcba9e1], [7, 4, 0xffcd9b], [0, 11, 0xffddb1]])) {
      const light = new THREE.PointLight(color, 24, 15, 2);
      light.position.set(x, 4.3, z);
      scene.add(light);
    }
    const camera = new THREE.PerspectiveCamera(63, 1, 0.05, 75);
    const layout = isStudio ? STUDIO_LAYOUT : isClub ? ROCK_CLUB_LAYOUT : isArcade ? ARCADE_LAYOUT : isRealm ? FREQUENCY09_LAYOUT : STORE_LAYOUT;
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
    const view = { yaw: snapshot?.viewYaw ?? 0, pitch: isArcade ? 0.18 : 0.34, firstPitch: 0, firstPerson: false, distance: 4.5, bobPhase: 0, bobWeight: 0 };
    camera.position.set(player.x + Math.sin(view.yaw) * view.distance, 2.7, Math.min(player.z + 4, isInterior ? layout.cameraFrontZ : 15.1));
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
    const npcActors = isInterior ? null : createRecordStoreNpcActors(scene, loader, shop.clickable, disposeObjects, { deferLoad: true });
    const clubActors = club ? createRockClubActors(scene, club, loader, () => clubTransformsRef?.current || {}, () => alive, () => concertTransformsRef?.current || {}) : null;
    const arcadeActors = arcade ? createArcadeActors(arcade, loader, () => alive) : null;
    let concertClipsPromise = null, concertProps = null, poseController = null, concertWasActive = false, concertPerforming = false, savedConcertPlayer = null, motionClock = 0;
    function prepareConcert() {
      if (!clubActors || !character) return Promise.resolve(false);
      if (!concertClipsPromise) concertClipsPromise = clubActors.loadConcertClips(loader, (clip) => character?.setConcertClip(clip))
        .then(() => alive && Boolean(character));
      return concertClipsPromise;
    }
    if (clubActors && clubAssetApiRef) clubAssetApiRef.current = { prepareConcert, getMotionTime: () => motionClock, getPoseBones: (id) => poseController?.available(id) || [], apply: (id, transform) => {
      clubActors.apply(id, transform);
      applyRockClubPropTransform(club, id, transform);
    } };
    const studioReady = studio ? loadStudioAssets(studio, loader, () => studioTransformsRef?.current || {}, () => alive).then((loaded) => {
      if (alive) {
        canvas.dataset.studioModels = loaded.join(",");
        studio.hugoInteraction.enabled = loaded.includes("hugo");
        if (studio.hugoInteraction.enabled) {
          studio.obstacles.push({ id: "hugo", x: -1.5, z: 0.65, hx: 0.37, hz: 0.32, baseHx: 0.37, baseHz: 0.32 });
          applyStudioAssetTransform(studio, "hugo", studioTransformsRef?.current?.hugo);
        }
        canvas.dataset.hugoReady = String(loaded.includes("hugo"));
      }
    }) : Promise.resolve();
    let audienceReadyAt = Infinity;
    let lastPlayerActivity = performance.now();
    const waitForAudienceIdle = () => new Promise((resolve) => {
      const check = () => {
        if (!alive || (!callbacks.current.interactionLocked &&
          performance.now() - Math.max(audienceReadyAt, lastPlayerActivity) > 1200)) resolve();
        else window.setTimeout(check, 250);
      };
      check();
    });
    const clubReady = club ? loadRockClubAssets(club, loader, () => alive).then(async (loaded) => {
      if (!alive) return;
      canvas.dataset.clubModels = loaded.join(",");
      const characters = await clubActors.load();
      if (!alive) return;
      canvas.dataset.clubActors = characters.join(",");
      // Friends are interactive: load them even while NeonBoy keeps walking.
      // Keep the larger ambient crowd on the idle-only queue.
      void clubActors.loadFriends((id) => {
        if (alive) canvas.dataset.clubActors += `,${id}`;
      }).then(() => {
        if (!alive) return;
        audienceReadyAt = performance.now();
        void clubActors.loadAudience((id) => {
          if (alive) {
            canvas.dataset.clubActors += `,${id}`;
            audienceReadyAt = performance.now();
          }
        }, waitForAudienceIdle);
      });
    }).catch(() => { /* Procedural props and NPC markers remain usable. */ }) : Promise.resolve();
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
    const coinReady = isInterior ? Promise.resolve() : loader.loadAsync(COIN_URL).then(({ scene: coinModel }) => {
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
    Promise.all([playerReady, coinReady, studioReady, clubReady, shop?.ready || Promise.resolve()]).then(() => {
      if (!alive) return;
      setSceneReady(true);
      npcActors?.load();
      if (arcadeActors) void arcadeActors.load().then((loaded) => { if (alive) canvas.dataset.arcadeActors = loaded.join(","); });
    });

    const isField = (target) => /INPUT|TEXTAREA|SELECT/.test(target?.tagName);
    const interact = (target) => {
      if (!target) return;
      if (target.kind === "hugo") callbacks.current.onHugoInteract?.();
      if (target.kind === "examine") {
        if (club && (target.id === "stage" || target.id === "microphone") && callbacks.current.concertReady) callbacks.current.onConcertStart?.();
        else callbacks.current.onExamine?.(target.id);
      }
      if (target.kind === "album") callbacks.current.onSelect(target.id);
      if (target.kind === "jukebox") callbacks.current.onOpenJukebox();
      if (target.kind === "coins" && callbacks.current.onTakeCoins() > 0) {
        shop.coinGroup.visible = false;
        for (const offset of [-0.26, 0, 0.26]) {
          coinParticles.emit({ type: "coin", x: COIN_TABLE_POSITION.x + offset, y: 1.26, z: COIN_TABLE_POSITION.z }, "neonboy");
        }
      }
      if (target.kind === "club-friends") callbacks.current.onNpcInteract?.("friendsTable");
      if (target.kind === "club-npc") {
        const position = clubActors?.getPosition(target.id);
        if (position && Math.hypot(player.x - position.x, player.z - position.z) <= clubActors.getReach(target.id))
          callbacks.current.onNpcInteract?.(target.id);
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
      const rect = canvas.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      if (isStudio) {
        if (nearInteraction?.kind !== "hugo" || !studio.hugoPrompt.visible) return false;
        if (!raycaster.intersectObject(studio.hugoPrompt).length) return false;
        interact(nearInteraction);
        return true;
      }
      if (isClub || isArcade || isRealm) return false;
      const hit = raycaster.intersectObjects(shop.clickable, false)[0];
      if (hit?.object.userData.albumId) interact({ kind: "album", id: hit.object.userData.albumId });
      else if (hit?.object.userData.shopAction) interact({ kind: hit.object.userData.shopAction, id: hit.object.userData.npcId });
      return Boolean(hit);
    };
    const onPointerDown = (event) => {
      if (poseController?.isGizmoActive() || callbacks.current.interactionLocked || selectAt(event)) return;
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

    const obstacles = studio?.obstacles || club?.obstacles || arcade?.obstacles || realm?.obstacles || STORE_OBSTACLES;
    const canMove = (x, z) => Math.abs(x) < layout.playerLimitX && z > layout.playerBackZ && z < layout.playerFrontZ &&
      !obstacles.some((obstacle) => Math.abs(x - obstacle.x) < obstacle.hx + 0.46 && Math.abs(z - obstacle.z) < obstacle.hz + 0.46) &&
      (isInterior || !["roxy", "freddy", "jason"].some((id) => {
        const position = npcActors.getPosition(id);
        return position && Math.hypot(x - position.x, z - position.z) < 0.88;
      }));
    const lookAt = new THREE.Vector3();
    const desiredCamera = new THREE.Vector3();
    const concertCamera = createConcertCamera(camera, (id, target) => {
      if (id === "band") return target.set(0, 1.55, -15.25);
      if (id === "audience") return target.set(-2.8, 1.1, -3.6);
      if (id === "friends") return target.set(-5.4, 1.15, 1.1);
      if (id.endsWith("-guitar") && concertProps?.getTarget(id.slice(0, -7), target)) return target;
      if (id.startsWith("pose:")) {
        const [, actorId, boneId] = id.split(":");
        const root = actorId === "neonboy" ? character?.root : clubActors?.actors.get(actorId)?.model;
        const bone = findConcertBone(root, boneId);
        if (bone) { bone.getWorldPosition(target); return target; }
      }
      const actorId = id.replace(/-guitar$/, "");
      const root = actorId === "neonboy" ? character?.root : clubActors?.actors.get(actorId)?.root;
      if (actorId === "lujan") {
        const hips = findConcertBone(root, "Hips");
        if (hips) { hips.getWorldPosition(target); target.y += 0.35; return target; }
      }
      if (root) { root.getWorldPosition(target); target.y += 1.15; return target; }
      return target.set(0, 1.55, -15.25);
    }, reducedMotion);
    const cameraRay = new THREE.Raycaster();
    const cameraDirection = new THREE.Vector3();
    function animate(now) {
      if (!alive) return;
      const frameSeconds = Math.max(0, (now - (last || now)) / 1000);
      const dt = Math.min(frameSeconds, 0.05);
      last = now;
      if (arcade && callbacks.current.paused) {
        keys.current.clear();
        frame = requestAnimationFrame(animate);
        return;
      }
      elapsed += dt;
      const held = keys.current;
      if (held.size || dragging) lastPlayerActivity = now;
      if (callbacks.current.interactionLocked) held.clear();
      if (club && concertWasActive !== callbacks.current.concertActive) {
        concertWasActive = callbacks.current.concertActive;
        canvas.dataset.concert = concertWasActive ? "live" : "idle";
        if (concertWasActive) {
          concertPerforming = true;
          savedConcertPlayer = { x: player.x, y: player.y, z: player.z, yaw: player.yaw,
            viewYaw: view.yaw, viewPitch: view.pitch, firstPerson: view.firstPerson };
          Object.assign(player, ROCK_CLUB_STAGE_MARKS.neonboy, { speed: 0, grounded: true, velocityY: 0 });
          view.firstPerson = false;
          callbacks.current.onViewChange?.(false);
          clubActors.setConcertActive(true);
          club.atmosphere.setConcertActive(true);
          character?.setConcertActive(true);
          concertCamera.reset();
          motionClock = 0;
          poseController ||= createRockClubConcertPoseController(scene, character, clubActors,
            camera, canvas, (id, bone, angles) => callbacks.current.onPoseGizmoChange?.(id, bone, angles));
          concertProps ||= createRockClubConcertProps(scene, club, clubActors, character, () => concertTransformsRef?.current || {}, () => concertMotionRef?.current || {}, () => motionPlaybackOffsetsRef?.current || {});
          canvas.dataset.concertProps = String(concertProps.start());
          canvas.dataset.concertActors = [...clubActors.actors.values()].filter((actor) => actor.show?.isRunning()).map((actor) => actor.npc.id).join(",");
          held.clear();
        } else {
          concertPerforming = false;
          poseController?.hide();
          concertProps?.stop();
          canvas.dataset.concertProps = "0";
          club.atmosphere.setConcertActive(false);
          clubActors.setConcertActive(false);
          character?.setConcertActive(false);
          if (savedConcertPlayer) {
            Object.assign(player, { x: savedConcertPlayer.x, y: savedConcertPlayer.y,
              z: savedConcertPlayer.z, yaw: savedConcertPlayer.yaw, speed: 0 });
            view.yaw = savedConcertPlayer.viewYaw;
            view.pitch = savedConcertPlayer.viewPitch;
            view.firstPerson = savedConcertPlayer.firstPerson;
            callbacks.current.onViewChange?.(view.firstPerson);
          }
          savedConcertPlayer = null;
        }
      }
      const forward = Number(held.has("KeyW") || held.has("ArrowUp")) - Number(held.has("KeyS") || held.has("ArrowDown"));
      const right = Number(held.has("KeyD") || held.has("ArrowRight")) - Number(held.has("KeyA") || held.has("ArrowLeft"));
      if (held.has("KeyQ")) view.yaw += dt * 1.8;
      const length = Math.hypot(forward, right) || 1;
      const speed = held.has("ShiftLeft") || held.has("ShiftRight") ? 5 : 2.8;
      const previousX = player.x, previousZ = player.z;
      // Large NPCs can stall one render frame while their GLB is decoded.
      // Catch up a bounded amount of held-key travel in collision-safe slices.
      const movementDt = club && (forward || right) ? Math.min(frameSeconds, 0.24) : dt;
      const dx = (right * Math.cos(view.yaw) - forward * Math.sin(view.yaw)) / length * speed * movementDt;
      const dz = (-right * Math.sin(view.yaw) - forward * Math.cos(view.yaw)) / length * speed * movementDt;
      const slices = club ? Math.max(1, Math.ceil(movementDt / 0.04)) : 1;
      for (let slice = 0; slice < slices; slice += 1) {
        if (canMove(player.x + dx / slices, player.z)) player.x += dx / slices;
        if (canMove(player.x, player.z + dz / slices)) player.z += dz / slices;
      }
      if (club && player.grounded) player.y = rockClubFloorHeight(player.x, player.z);
      const moved = Math.hypot(player.x - previousX, player.z - previousZ);
      player.speed = moved / Math.max(movementDt, 0.001);
      player.running = speed > 4;
      if (playerSnapshotRef && !concertWasActive) playerSnapshotRef.current = { x: player.x, z: player.z, yaw: player.yaw, viewYaw: view.yaw };
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
        const groundY = club ? rockClubFloorHeight(player.x, player.z) : 0;
        player.y = Math.max(groundY, player.y + player.velocityY * dt);
        if (player.y === groundY && player.velocityY < 0) {
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
      const nextFov = concertWasActive ? camera.fov : view.firstPerson ? 76 : 63;
      if (camera.fov !== nextFov) { camera.fov = nextFov; camera.updateProjectionMatrix(); }
      if (concertWasActive) {
        // The director updates after the animated bones and props below.
      } else if (view.firstPerson) {
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
        desiredCamera.x = THREE.MathUtils.clamp(desiredCamera.x, isInterior ? -layout.cameraLimitX : -10.35, isInterior ? layout.cameraLimitX : 10.35);
        desiredCamera.z = THREE.MathUtils.clamp(desiredCamera.z, isInterior ? layout.cameraBackZ : -13.2, isInterior ? layout.cameraFrontZ : 15.1);
        if (studio || club || arcade || realm) {
          const rayLength = cameraDirection.copy(desiredCamera).sub(lookAt).length();
          cameraRay.set(lookAt, cameraDirection.normalize());
          cameraRay.far = rayLength;
          const hit = cameraRay.intersectObjects((studio || club || arcade || realm).colliders, false)[0];
          if (hit) desiredCamera.copy(lookAt).addScaledVector(cameraDirection, Math.max(0.55, hit.distance - 0.28));
        }
        camera.position.lerp(desiredCamera, Math.min(1, dt * 10));
        camera.lookAt(lookAt);
      }
      if (arcade && callbacks.current.frequencyPhase === "intake") {
        const machine = arcade.slots.get("frequency09Cabinet");
        const target = new THREE.Vector3(machine.position.x + .25, 1.6, machine.position.z + 2.65);
        camera.position.lerp(target, Math.min(1, dt * 1.1));
        camera.lookAt(machine.position.x, 1.5, machine.position.z);
        if (!reducedMotion) camera.position.x += Math.sin(elapsed * 24) * .016;
      }
      if (realm && callbacks.current.frequencyPhase === "collapse" && !reducedMotion) {
        camera.position.x += Math.sin(elapsed * 27) * .025;
        camera.position.y += Math.sin(elapsed * 19) * .015;
      }
      playerLight.position.set(player.x - 0.8, player.y + 2.65, player.z + 1.45);
      studio?.mixers.forEach((mixer) => mixer.update(dt));
      club?.mixers.forEach((mixer) => mixer.update(dt));
      const posePaused = callbacks.current.paused || (concertWasActive && callbacks.current.concertEditor?.open && callbacks.current.concertEditor?.frozen);
      poseController?.clear();
      character?.update(player, posePaused ? 0 : dt, camera, elapsed);
      if (character) {
        character.root.visible = !view.firstPerson;
        character.root.rotation.x = player.grounded ? 0 : -Math.sin(Math.min(1, player.jumpAge / 0.72) * Math.PI) * 0.16;
      }
      let closest = null, distance = Infinity;
      for (const spot of shop?.albumTargets || []) {
        const gap = Math.hypot(player.x - spot.x, player.z - spot.z);
        if (gap < spot.reach && gap < distance) { distance = gap; closest = { kind: "album", id: spot.id }; }
      }
      for (const [kind, position, reach] of (isInterior ? [] : [["jukebox", JUKEBOX_POSITION, 2.8], ["coins", COIN_TABLE_POSITION, 2.45]])) {
        const gap = Math.hypot(player.x - position.x, player.z - position.z);
        if (gap < reach && gap < distance) { distance = gap; closest = { kind }; }
      }
      for (const npc of (isInterior ? [] : STORE_NPCS)) {
        const position = npcActors.getPosition(npc.id);
        if (!position) continue;
        const gap = Math.hypot(player.x - position.x, player.z - position.z);
        if (gap < npc.reach && gap < distance) { distance = gap; closest = { kind: "npc", id: npc.id }; }
      }
      for (const actor of clubActors?.actors.values() || []) {
        if (!actor.interactive) continue;
        const gap = Math.hypot(player.x - actor.root.position.x, player.z - actor.root.position.z);
        if (gap < actor.reach && gap < distance) { distance = gap; closest = { kind: "club-npc", id: actor.npc.id }; }
      }
      for (const spot of studio?.interactions || club?.interactions || arcade?.interactions || realm?.interactions || []) {
        const gap = Math.hypot(player.x - spot.x, player.z - spot.z);
        if (gap < spot.reach && (gap < distance || (spot.id === "friendsTable" && closest?.kind === "club-npc") || (arcade && spot.id === "pixel"))) { distance = gap; closest = { kind: spot.id === "friendsTable" ? "club-friends" : "examine", id: spot.id, label: spot.label }; }
      }
      if (studio?.hugoInteraction?.enabled) {
        const spot = studio.hugoInteraction;
        const gap = Math.hypot(player.x - spot.x, player.z - spot.z);
        if (gap < spot.reach && gap < distance) { distance = gap; closest = { kind: "hugo", id: "hugo" }; }
      }
      if (studio) {
        const showHugoPrompt = closest?.kind === "hugo" && !callbacks.current.interactionLocked;
        studio.hugoPrompt.visible = showHugoPrompt;
        if (canvas.dataset.hugoPrompt !== String(showHugoPrompt)) canvas.dataset.hugoPrompt = String(showHugoPrompt);
      }
      if (concertPerforming && callbacks.current.concertEffectRef?.current?.phase === "outro"
        && callbacks.current.concertEffectRef.current.elapsed > .65) {
        concertPerforming = false;
        clubActors.setConcertActive(false);
        character?.setConcertActive(false);
      }
      clubActors?.update(posePaused ? 0 : dt, player, callbacks.current.activeNpc, closest?.kind === "club-npc" ? closest.id : null);
      arcadeActors?.update(posePaused ? 0 : dt, callbacks.current.activeNpc);
      if (concertWasActive) {
        if (!posePaused) motionClock += dt;
        const animatedBones = {};
        for (const id of ["neonboy", "john-zool", "revenant"]) {
          const track = concertMotionRef?.current?.[id];
          if (!track?.enabled || callbacks.current.motionRecordingId === id) continue;
          const editor = callbacks.current.concertEditor;
          const scrub = editor?.open && editor.frozen && editor.selected === id ? editor.scrub : null;
          const framePose = sampleConcertMotion(track, scrub ?? motionClock - (motionPlaybackOffsetsRef?.current?.[id] || 0));
          if (framePose?.bones) animatedBones[id] = framePose.bones;
        }
        const editor = callbacks.current.concertEditor;
        poseController?.apply(concertPoseRef?.current, animatedBones,
          editor?.open && editor.poseEditing ? { id: editor.poseActor, bone: editor.poseBone, gizmo: editor.gizmo } : null);
        canvas.dataset.concertPose = editor?.open && editor.poseEditing ? editor.poseActor + ":" + editor.poseBone : "off";
        concertProps?.update(callbacks.current.concertEditor, motionClock, callbacks.current.motionRecordingId);
        canvas.dataset.concertCamera = concertCamera.update(posePaused ? 0 : dt, callbacks.current.concertCameraMode, callbacks.current.concertEditor);
        canvas.dataset.concertFrozen = String(posePaused);
        canvas.dataset.concertMotion = callbacks.current.motionRecordingId ? "recording" : "playing";
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
      if (club) {
        const effect = callbacks.current.concertEffectRef?.current;
        const anomaly = effect?.phase === "anomaly" ? Math.min(1, effect.elapsed / 1.3, (9 - effect.elapsed) / 1.1) : 0;
        club.atmosphere.setAnomalyIntensity(Math.max(0, anomaly));
        const sign = club.showSign;
        if (sign) {
          const glitch = anomaly && !reducedMotion && Math.sin(effect.elapsed * 19) > .48;
          sign.position.x = glitch ? .035 * Math.sin(effect.elapsed * 71) : 0;
          sign.material.opacity = glitch ? .72 : 1;
        }
        if (anomaly && !reducedMotion && callbacks.current.concertActive) {
          camera.position.x += Math.sin(effect.elapsed * 32) * .025 * anomaly;
          camera.rotation.z += Math.sin(effect.elapsed * 23) * .003 * anomaly;
        }
        club.atmosphere.update(dt, reducedMotion, callbacks.current.paused, camera);
      }
      realm?.update(dt, elapsed, callbacks.current.frequencyPhase, reducedMotion);
      if (arcade?.update(dt, elapsed, callbacks.current.arcadeAltered, player.z, reducedMotion, callbacks.current.paused, callbacks.current.frequencyPhase === "intake")) callbacks.current.onArcadeEvent?.();
      if (shop) shop.glow.intensity = 4.4 + Math.sin(elapsed * 2.4) * 0.6;
      videoProjection?.setVideo(callbacks.current.projectionPaused ? null : callbacks.current.outsideVideo);
      videoProjection?.setPaused(callbacks.current.paused);
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
      concertProps?.stop();
      poseController?.dispose();
      character?.dispose();
      npcActors?.dispose();
      clubActors?.dispose();
      arcadeActors?.dispose();
      if (clubAssetApiRef) clubAssetApiRef.current = null;
      studio?.mixers.forEach((mixer) => mixer.stopAllAction());
      club?.mixers.forEach((mixer) => mixer.stopAllAction());
      videoProjection?.dispose();
      if (playbackApiRef) playbackApiRef.current = null;
      if (studioAssetApiRef) studioAssetApiRef.current = null;
      if (arcadeAssetApiRef) arcadeAssetApiRef.current = null;
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
  }, [albums, isStudio, isClub, isArcade, isRealm, rendererVersion]);

  const hold = (code, pressed) => { if (pressed) keys.current.add(code); else keys.current.delete(code); };
  return <div className="record-store-3d" data-scenario={scenario} data-view={firstPerson ? "primera" : "tercera"} data-ready={sceneReady} aria-busy={!sceneReady}>
    <canvas key={`${scenario}-${rendererVersion}`} ref={canvasRef} aria-label={isStudio ? "Neon Recording Studio 3D recorrible" : isClub ? "Club de Rock 1999 3D recorrible" : isArcade ? "Arcade 1999 3D recorrible" : isRealm ? "FREQUENCY 09, dimensión 3D recorrible" : "Disquería 3D recorrible de Neonboy"} />
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
        <strong>{isClub ? "Preparando el club de rock" : isArcade ? "Preparando Arcade 1999" : isRealm ? "Entrando en FREQUENCY 09" : isStudio ? "Preparando el estudio" : "Preparando la disquería"}</strong>
        <small>{isClub ? "Cargando escenario, luces y NeonBoy…" : isStudio ? "Cargando sala de control, cabina y NeonBoy…" : "Cargando discos, personajes y escenario…"}</small>
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
