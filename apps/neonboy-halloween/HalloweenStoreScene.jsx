import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildRecordStore } from "../../src/game/recordStoreScenery.js";
import { createRecordStoreCharacter } from "../../src/game/recordStoreCharacter.js";
import { createRecordStoreNpcActors } from "../../src/game/recordStoreNpcActors.js";
import { createFirstPersonMotion } from "../../src/game/firstPersonMotion.js";
import { createHalloweenOrbAbility } from "./halloweenOrbReactions.js";
import { STORE_NPCS } from "../../src/game/recordStoreDialogue.js";
import { STORE_LAYOUT, STORE_ALBUM_POSITIONS, STORE_OBSTACLES } from "../../src/game/recordStoreLayout.js";
import { createHalloweenTextureCache } from "./halloweenTextures.js";
import { createHalloweenCodeVision } from "./halloweenCodeVision.js";
import { createHalloweenSecretProps, SECRET_POSITIONS } from "./halloweenSecretProps.js";
import { createHalloweenSecretCovers } from "./halloweenSecretCovers.js";
import { createHalloweenFootsteps } from "./halloweenFootsteps.js";
import { createHalloweenDemonEncounter } from "./halloweenDemonEncounter.js";
import { createHalloweenGlassesChest, REALITY_CHEST, chestBlocksMovement } from "./halloweenGlassesChest.js";
import { createHalloweenRealityKeyPickup, REALITY_KEY_POSITION } from "./halloweenRealityKeyPickup.js";
import { canRevealRealityKey } from "./halloweenBelfegorLogic.js";
import { createHalloweenJudgeEncounter } from "./halloweenJudgeEncounter.js";
import { JUDGE_ENTRANCE_SECONDS, JUDGE_RETURN_SECONDS, JUDGE_INTRO_HOLD_SECONDS, judgeEntranceCameraPose, judgeReturnCameraPose } from "./halloweenJudgeCamera.js";
import { createHalloweenMatrixMessages } from "./halloweenMatrixMessages.js";
import { HALLOWEEN_ORB_RANGE, resolveHalloweenOrbAim } from "./halloweenCombatAim.js";
import { outageLightLevel } from "./halloweenLighting.js";
import { chooseHalloweenPixelRatio } from "./halloweenRenderQuality.js";
import { disposeObjects } from "../../src/game/disposeGameObjects.js";
import { COIN_TABLE_POSITION, JUKEBOX_POSITION } from "../../src/game/recordStoreJukeboxScenery.js";

const IDLE_URL = new URL("./models/neon-inactivo-hd.mobile.glb", import.meta.url).href;
const WALK_URL = new URL("../../src/assets/neonboy-animaciones/neonboy-new-walk.anim.glb", import.meta.url).href;
const RUN_URL = new URL("../../src/assets/neonboy-animaciones/neonboy-running.anim.glb", import.meta.url).href;
const JUMP_URL = new URL("../../src/assets/neonboy-animaciones/neonboy-new-jump.anim.glb", import.meta.url).href;
const COIN_URL = new URL("../../src/assets/neonboy-animaciones/moneda.optimized.glb", import.meta.url).href;
const GLASSES_URL = new URL("./models/glasses.mobile.glb", import.meta.url).href;
const POWER_URL = new URL("../../src/assets/neonboy-animaciones/neonboy-power.anim.glb", import.meta.url).href;
const DEMON_URLS = [
  new URL("./models/reguetonero.mobile.glb", import.meta.url).href,
  new URL("./models/reguetonero-walk.anim.mobile.glb", import.meta.url).href,
  new URL("./models/reguetonero-attack.anim.mobile.glb", import.meta.url).href,
  new URL("./models/demonio-matrix.mobile.glb", import.meta.url).href,
  new URL("./models/demonio-matrix-walk.anim.mobile.glb", import.meta.url).href,
  new URL("./models/demonio-matrix-muerte.anim.glb", import.meta.url).href,
];
const JUDGE_URLS = [
  new URL("./models/demonioFinal.mobile.glb", import.meta.url).href,
  new URL("./models/demonioFinal-walk.anim.mobile.glb", import.meta.url).href,
  new URL("./models/demonFinal-attack.anim.mobile.glb", import.meta.url).href,
  new URL("./models/demonDieFinal.anim.mobile.glb", import.meta.url).href,
];
const SECRET_MODEL_URLS = {
  phone: new URL("./models/telefono.mobile.glb", import.meta.url).href,
  mirror: new URL("./models/espejo.mobile.glb", import.meta.url).href,
  tv: new URL("./models/tv.mobile.glb", import.meta.url).href,
  vhs: new URL("./models/vhs.mobile.glb", import.meta.url).href,
};
const STEP_URLS = [
  new URL("../../src/assets/neonboy-animaciones/step-1.mp3", import.meta.url).href,
  new URL("../../src/assets/neonboy-animaciones/step-2.mp3", import.meta.url).href,
];

function inPlaceClip(source, name) {
  if (!source) return null;
  const clip = source.clone();
  clip.name = name;
  const first = Math.min(...clip.tracks.map((track) => track.times[0]));
  for (const track of clip.tracks) {
    track.shift(-first);
    if (!/Hips\.position$/.test(track.name)) continue;
    const height = track.values[1];
    for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] = 0;
      track.values[i + 1] = height;
      track.values[i + 2] = 0;
    }
  }
  clip.resetDuration();
  return clip;
}

export default function HalloweenStoreScene({ albums, vision, damageActive, locked, credits, onSelectAlbum, onInteract, onNearby, onReady, onProgress, onViewChange, lightingEvent, reduceFlashing, onAmbientOpportunity, touchRun, touchMoveRef, onOrbStatus, glassesCollected, chestOpen, realityKeyOwned, belfegorAttempts, visionActivation, hideDefeatedDemon, onDemonApproach, onDemonHit, onDemonTaunt, onDemonShieldHit, onPlayerDamage, judgePhase, onJudgeHit, onJudgeEvent, onJudgeDeathComplete, vhsCollected, anniversaryUnlocked, secretVinylUnlocked, phoneRinging, onSecretDiscovered, onMirrorWhisper, onContextChange }) {
  const canvasRef = useRef(null);
  const propsRef = useRef(null);
  propsRef.current = { vision, locked, credits, onSelectAlbum, onInteract, onNearby, onReady, onProgress, onViewChange, lightingEvent, reduceFlashing, onAmbientOpportunity, touchRun, touchMoveRef, onOrbStatus, glassesCollected, chestOpen, realityKeyOwned, belfegorAttempts, visionActivation, hideDefeatedDemon, onDemonApproach, onDemonHit, onDemonTaunt, onDemonShieldHit, onPlayerDamage, judgePhase, onJudgeHit, onJudgeEvent, onJudgeDeathComplete, vhsCollected, anniversaryUnlocked, secretVinylUnlocked, phoneRinging, onSecretDiscovered, onMirrorWhisper, onContextChange };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer;
    const touchDevice = window.matchMedia("(pointer: coarse)").matches;
    const lowPowerMobile = touchDevice && ((navigator.deviceMemory || 4) <= 2 || (navigator.hardwareConcurrency || 8) <= 4);
    const renderRatio = (width, height) => chooseHalloweenPixelRatio(width, height, window.devicePixelRatio || 1, touchDevice, lowPowerMobile);
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !touchDevice, powerPreference: "high-performance" }); }
    catch { propsRef.current.onReady?.(false); return; }
    renderer.setPixelRatio(renderRatio(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = lowPowerMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    const scene = new THREE.Scene();
    const normalBackground = new THREE.Color(0x120d18);
    const normalFog = new THREE.Fog(0x211824, 20, 48);
    scene.background = normalBackground;
    scene.fog = normalFog;
    const ambient = new THREE.HemisphereLight(0xd7cfe3, 0x554234, 1.04);
    scene.add(ambient);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnvironment = new RoomEnvironment();
    let environment = pmrem.fromScene(roomEnvironment, .04);
    roomEnvironment.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = .3;
    const shop = buildRecordStore(scene, albums, STORE_ALBUM_POSITIONS, STORE_OBSTACLES);
    const secretProps = createHalloweenSecretProps(scene, { mobile: touchDevice, lowPower: lowPowerMobile, reflectionEnabled: false });
    const secretCovers = createHalloweenSecretCovers(scene, shop, albums);
    // Each coin-table sign needs its own readable back face; DoubleSide mirrors text.
    for (const front of [...shop.table.children]) {
      if (!front.isMesh || front.geometry.type !== "PlaneGeometry" || !front.material?.map ||
        ![0.63, 1.55].some((y) => Math.abs(front.position.y - y) < 0.001)) continue;
      front.material.side = THREE.FrontSide;
      const back = new THREE.Mesh(front.geometry.clone(), front.material.clone());
      back.position.copy(front.position);
      back.position.z -= 0.008;
      back.rotation.y = Math.PI;
      back.name = "Coin table sign, readable reverse";
      shop.table.add(back);
    }
    const fills = [[0, -9, 0xffe2b9], [-7, -1, 0xcba9e1], [7, 4, 0xffcd9b], [0, 11, 0xffddb1]].map(([x, z, color]) => {
      const light = new THREE.PointLight(color, 24, 15, 2);
      light.position.set(x, 4.3, z);
      scene.add(light);
      return { light, color };
    });
    const playerLight = new THREE.PointLight(0xd7bbff, 11, 5, 2);
    scene.add(playerLight);
    const fixtureLights = new Set(shop.ceilingFixtures.map(({ light }) => light).filter(Boolean));
    const regularLights = [];
    scene.traverse((object) => {
      if (object.isLight && object !== playerLight && !fixtureLights.has(object)) regularLights.push([object, object.intensity]);
    });
    const fixtureColors = shop.ceilingFixtures.map(({ material }) => material.color.clone());
    const fixtureBaseIntensities = shop.ceilingFixtures.map(({ light }) => light?.intensity || 0);
    const anniversaryLights = [[0, -13.2, 0xb779ff], [3.8, 1.6, 0xffcc81]].map(([x, z, color]) => {
      const light = new THREE.PointLight(color, 0, 4.5, 2);
      light.position.set(x, 3.45, z);
      scene.add(light);
      return light;
    });
    const anniversarySignMaterials = new Map();
    for (const name of ["venue-sign:NEONBOY MUSIC", "hanging-neon-sign:9TH REVELATION"]) {
      scene.getObjectByName(name)?.traverse((object) => {
        const material = object.material;
        if (material?.isMeshBasicMaterial && material.map && !anniversarySignMaterials.has(material))
          anniversarySignMaterials.set(material, { color: material.color.clone(), opacity: material.opacity });
      });
    }
    let lightingFactor = 1;
    let anniversaryGlow = 0;
    const textureCache = createHalloweenTextureCache();
    textureCache.prepare(scene);
    const codeVision = createHalloweenCodeVision(scene);
    const footsteps = createHalloweenFootsteps(STEP_URLS);
    canvas.dataset.frequencyVision = "inactive";
    let contextLost = false;
    const onContextLost = (event) => { event.preventDefault(); contextLost = true; propsRef.current.onContextChange?.(true); };
    const onContextRestored = () => {
      textureCache.restore();
      secretProps.invalidateReflection();
      // PMREM is a GPU render target; its lighting must also be redrawn.
      const restoredRoom = new RoomEnvironment();
      const previousEnvironment = environment;
      environment = pmrem.fromScene(restoredRoom, .04);
      scene.environment = environment.texture;
      restoredRoom.dispose();
      previousEnvironment.dispose();
      contextLost = false;
      propsRef.current.onContextChange?.(false);
      orbGraphicsPrepared = false;
      renderer.shadowMap.needsUpdate = true;
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const npcNames = {
      freddy: { name: "Bones" },
      jason: { name: "Belfegor" },
      rulo: { name: "Rulo \"Distorsi\u00f3n\"" },
      "skeleton-holy": { role: "Guardi\u00e1n de los discos" },
      "skeleton-unholy": { role: "Guardi\u00e1n de los discos" }
    };
    const npcs = STORE_NPCS.map((npc) => ({ ...npc, ...npcNames[npc.id] }));
    const playerUrls = [IDLE_URL, WALK_URL, RUN_URL, JUMP_URL, POWER_URL];
    // The NPC loader adds five animation files to the unique NPC model files.
    const expectedModels = playerUrls.length + new Set(npcs.map((npc) => npc.model)).size + 5 + 2 + DEMON_URLS.length + JUDGE_URLS.length + Object.keys(SECRET_MODEL_URLS).length;
    const modelFractions = new Map();
    let alive = true, coversLoaded = false, assetsReady = false, playerFailed = false, loadFinished = false, orbGraphicsPrepared = false;
    let lastPercent = -1, lastLabel = "", finishTimer = 0;
    function publishProgress(label) {
      if (!alive) return;
      const loaded = [...modelFractions.values()].reduce((sum, fraction) => sum + fraction, 0);
      const percent = Math.min(98, Math.floor(loaded / expectedModels * 92 + (coversLoaded ? 6 : 0)));
      if (percent < lastPercent || (percent === lastPercent && label === lastLabel)) return;
      lastPercent = percent;
      lastLabel = label;
      propsRef.current.onProgress?.({ percent, label });
    }
    function loadModel(url) {
      modelFractions.set(url, modelFractions.get(url) ?? 0);
      return loader.loadAsync(url, (event) => {
        if (!event.total) return;
        modelFractions.set(url, Math.max(modelFractions.get(url) || 0, Math.min(1, event.loaded / event.total)));
        publishProgress(coversLoaded ? "Cargando personajes..." : "Cargando portadas y personajes...");
      }).then((asset) => {
        modelFractions.set(url, 1);
        publishProgress(coversLoaded ? "Cargando personajes..." : "Cargando portadas y personajes...");
        return asset;
      }).catch((error) => {
        modelFractions.set(url, 1);
        publishProgress("Preparando la tienda...");
        throw error;
      });
    }
    const npcActors = createRecordStoreNpcActors(scene, { loadAsync: loadModel }, shop.clickable, disposeObjects, { deferLoad: true, npcs });
    const demon = createHalloweenDemonEncounter(scene);
    const glassesChest = createHalloweenGlassesChest(scene);
    const realityKey = createHalloweenRealityKeyPickup(scene);
    codeVision.register(glassesChest.root);
    codeVision.register(realityKey.root);
    const onDebugJudge = () => { if (import.meta.env.DEV) { demon.debugDefeat(); player.x = 0; player.z = -6.8; } };
    window.addEventListener("neonboy-halloween-debug-judge", onDebugJudge);
    const judge = createHalloweenJudgeEncounter(scene, {
      lowPower: touchDevice,
      onDeathComplete: () => propsRef.current.onJudgeDeathComplete?.(),
      isSafe: (x, z) => Math.abs(x) < STORE_LAYOUT.playerLimitX - .8 && z > STORE_LAYOUT.playerBackZ + .7 && z < STORE_LAYOUT.playerFrontZ - .7 &&
        !chestBlocksMovement(x, z, 1.15) &&
        !STORE_OBSTACLES.some((obstacle) => Math.abs(x - obstacle.x) < obstacle.hx + 1.15 && Math.abs(z - obstacle.z) < obstacle.hz + 1.15) &&
        !["roxy", "freddy", "jason"].some((id) => { const npc = npcActors.getPosition(id); return npc && Math.hypot(x - npc.x, z - npc.z) < 2.1; }),
      isProjectileBlocked: (x, z) => chestBlocksMovement(x, z, .16) || STORE_OBSTACLES.some((obstacle) => Math.abs(x - obstacle.x) < obstacle.hx + .16 && Math.abs(z - obstacle.z) < obstacle.hz + .16),
      onDamage: () => propsRef.current.onPlayerDamage?.(),
      onEvent: (event) => propsRef.current.onJudgeEvent?.(event),
      onHit: (health) => propsRef.current.onJudgeHit?.(health),
    });
    const onDebugJudgeCombat = () => { if (import.meta.env.DEV) { demon.debugDefeat(); player.x = 0; player.z = -6.8; judge.setPhase("combat"); } };
    window.addEventListener("neonboy-halloween-debug-judge-combat", onDebugJudgeCombat);
    const onDebugJudgeHit = () => { if (import.meta.env.DEV && judge.phase === "combat") { judge.armShot(); judge.hit(); } };
    window.addEventListener("neonboy-halloween-debug-judge-hit", onDebugJudgeHit);
    const messageOccluders = [];
    shop.root.traverse(object => {
      if (object.isMesh && ["BoxGeometry", "RoundedBoxGeometry", "ExtrudeGeometry", "CylinderGeometry", "CapsuleGeometry", "SphereGeometry"].includes(object.geometry.type) &&
          ![object.material].flat().some(material => material.transparent && material.opacity < .9)) messageOccluders.push(object);
    });
    const matrixMessages = createHalloweenMatrixMessages(scene, {
      demon, getOccluders: () => messageOccluders,
      onDiscover: (...args) => propsRef.current.onSecretDiscovered?.(...args),
    });
    const ruloRestYaw = npcs.find((npc) => npc.id === "rulo")?.yaw ?? 0;
    let ruloFacingYaw = ruloRestYaw;
    let character = null;
    const playerPromise = Promise.all(playerUrls.map(loadModel)).then(([idle, walk, run, jump, power]) => {
      if (!alive) { disposeObjects([idle.scene, walk.scene, run.scene, jump.scene, power.scene]); return; }
      const idleClip = inPlaceClip(idle.animations.find((clip) => clip.duration > .25), "idle");
      const walkClip = inPlaceClip(walk.animations.find((clip) => clip.duration > .25), "walk");
      const runClip = inPlaceClip(run.animations.find((clip) => clip.duration > .25), "run");
      const jumpClip = inPlaceClip(jump.animations.find((clip) => clip.duration > .25), "jump");
      const powerClip = inPlaceClip(power.animations.find((clip) => clip.duration > .25), "power");
      if (idleClip && walkClip && jumpClip) {
        character = createRecordStoreCharacter({ scene: idle.scene, idleClip, walkClip, runClip, jumpClip, powerClip });
        scene.add(character.root);
        secretProps.setMirrorPlayer(character.root);
        textureCache.prepare(character.root);
        codeVision.register(character.root, { profile: "player" });
      } else playerFailed = true;
      disposeObjects([walk.scene, run.scene, jump.scene, power.scene]);
    }).catch(() => { playerFailed = true; });
    const coinPromise = loadModel(COIN_URL).then(({ scene: coinModel }) => {
      if (!alive) { disposeObjects([coinModel]); return; }
      const bounds = new THREE.Box3().setFromObject(coinModel);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = .27 / Math.max(size.x, size.y, size.z, .001);
      coinModel.traverse((object) => {
        if (!object.isMesh) return;
        for (const material of [object.material].flat()) {
          material.color?.set(0xffd17c);
          material.metalness = .58;
          material.roughness = .31;
          material.emissiveMap = null;
          material.emissive?.set(0x80501a);
          material.emissiveIntensity = .25;
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
      textureCache.prepare(scene);
      codeVision.register();
    }).catch(() => { /* Keep the visible gold coins if the optional model fails. */ });
    const glassesPromise = loadModel(GLASSES_URL).then(({ scene: model }) => {
      if (!alive) { disposeObjects([model]); return; }
      demon.mountGlasses(model);
      textureCache.prepare(demon.glasses);
      codeVision.register(demon.glasses);
    }).catch(() => { /* Keep the lightweight pickup marker if the model fails. */ });
    const coverPromise = Promise.resolve(shop.ready).then(() => {
      coversLoaded = true;
      publishProgress("Cargando personajes...");
    });
    textureCache.prepare(scene);
    const npcPromise = npcActors.load().then(() => {
      if (alive) { textureCache.prepare(scene); codeVision.register(); }
    });
    const demonPromise = Promise.all(DEMON_URLS.map(loadModel)).then(([normal, normalWalk, normalAttack, evil, evilWalk, evilDeath]) => {
      if (!alive) { disposeObjects([normal.scene, normalWalk.scene, normalAttack.scene, evil.scene, evilWalk.scene, evilDeath.scene]); return; }
      disposeObjects([...demon.mountForm(normal, normalWalk, normalAttack), ...demon.mountForm(evil, evilWalk, normalAttack, evilDeath)]);
      textureCache.prepare(demon.root);
      codeVision.register(demon.root, { profile: "demon" });
    });
    const judgePromise = Promise.all(JUDGE_URLS.map(loadModel)).then(([idle, walk, attack, death]) => {
      if (!alive) { disposeObjects([idle.scene, walk.scene, attack.scene, death.scene]); return; }
      disposeObjects(judge.mount(idle, walk, attack, death));
      textureCache.prepare(judge.root);
      codeVision.register(judge.root, { profile: "demon" });
    });
    const secretPropPromise = Promise.all(Object.entries(SECRET_MODEL_URLS).map(async ([kind, url]) => {
      try {
        const { scene: model } = await loadModel(url);
        if (!alive) { disposeObjects([model]); return; }
        secretProps.mount(kind, model);
        textureCache.prepare(model);
        codeVision.register(model);
      } catch { /* The procedural prop remains visible when an optional GLB fails. */ }
    }));
    Promise.all([playerPromise, coverPromise, npcPromise, coinPromise, glassesPromise, demonPromise, judgePromise, secretPropPromise]).then(() => {
      if (!alive) return;
      assetsReady = true;
      publishProgress("Preparando la escena...");
    }).catch(() => { if (alive) propsRef.current.onReady?.(false); });

    const camera = new THREE.PerspectiveCamera(63, 1, .05, 75);
    const player = { x: 0, y: 0, z: STORE_LAYOUT.spawnZ, yaw: Math.PI, speed: 0, grounded: true, running: false, velocityY: 0, landing: 0, raiseArmsOnJump: true };
    const view = { yaw: 0, pitch: .34, firstPitch: 0, distance: 4.5, firstPerson: false };
    const firstMotion = createFirstPersonMotion();
    const held = new Set();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const lookAt = new THREE.Vector3();
    const desiredCamera = new THREE.Vector3();
    const judgeCameraStart = new THREE.Vector3();
    const judgeCameraStartTarget = new THREE.Vector3();
    const judgeCameraReturnStart = new THREE.Vector3();
    const judgeCameraReturnLook = new THREE.Vector3();
    const judgePlayerLook = new THREE.Vector3();
    let judgeCameraMode = "inactive", judgeCameraStartTime = 0;
    let previousFrameTime = performance.now();
    let dragging = null, nearKey = "", nearInteraction = null, nearPairKey = null, nextAmbientScan = 0, frameId = 0, elapsed = 0, nextResourceScan = 0;
    let lastMirrorWhisperActivation = -1;
    const mirrorProjection = new THREE.Vector3();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canMove = (x, z) => Math.abs(x) < STORE_LAYOUT.playerLimitX && z > STORE_LAYOUT.playerBackZ && z < STORE_LAYOUT.playerFrontZ &&
      !chestBlocksMovement(x, z) &&
      !STORE_OBSTACLES.some((obstacle) => Math.abs(x - obstacle.x) < obstacle.hx + .46 && Math.abs(z - obstacle.z) < obstacle.hz + .46) &&
      (demon.defeated || Math.hypot(x - demon.position.x, z - demon.position.z) > (propsRef.current.vision ? 1 : .7)) &&
      (judge.phase !== "combat" || Math.hypot(x - judge.position.x, z - judge.position.z) > .95) &&
      !["roxy", "freddy", "jason"].some((id) => {
        const position = npcActors.getPosition(id);
        return position && Math.hypot(x - position.x, z - position.z) < .73;
      });
    // Lightweight collision proxies keep the original orb from flying through displays.
    // They are not added to the scene, so they cannot alter the shop or Matrix vision.
    const orbColliderMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const makeOrbCollider = (x, y, z, width, height, depth) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), orbColliderMaterial);
      mesh.position.set(x, y, z);
      mesh.updateMatrixWorld(true);
      return mesh;
    };
    const orbColliders = [
      makeOrbCollider(REALITY_CHEST.x, REALITY_CHEST.height / 2, REALITY_CHEST.z, REALITY_CHEST.hx * 2, REALITY_CHEST.height, REALITY_CHEST.hz * 2),
      ...STORE_OBSTACLES.filter(({ x, z }) => !npcs.some((npc) => npc.x === x && npc.z === z))
        .map(({ x, z, hx, hz }) => makeOrbCollider(x, 1.05, z, hx * 2, 2.1, hz * 2)),
      makeOrbCollider(0, 2.2, STORE_LAYOUT.backWallZ, STORE_LAYOUT.roomWidth, 4.4, .2),
      makeOrbCollider(0, 2.2, STORE_LAYOUT.frontWallZ, STORE_LAYOUT.roomWidth, 4.4, .2),
      makeOrbCollider(-STORE_LAYOUT.sideWallX, 2.2, STORE_LAYOUT.roomCenterZ, .2, 4.4, STORE_LAYOUT.roomDepth),
      makeOrbCollider(STORE_LAYOUT.sideWallX, 2.2, STORE_LAYOUT.roomCenterZ, .2, 4.4, STORE_LAYOUT.roomDepth),
    ];
    const orb = createHalloweenOrbAbility(scene, {
      demon,
      onTaunt: () => propsRef.current.onDemonTaunt?.(),
      onShieldHit: () => propsRef.current.onDemonShieldHit?.(),
      getTargets: () => [demon.getOrbTarget(), judge.getTarget()].filter(Boolean),
      getMaxRange: () => HALLOWEEN_ORB_RANGE,
      getColliders: () => [...orbColliders, ...glassesChest.lid.children],
      onHit: (target) => {
        if (target.kind === "judge-of-abyss") { judge.hit(); return; }
        if (target.kind !== "halloween-demon") return;
        const health = demon.hit();
        if (health !== null) {
          codeVision.hitDemon();
          propsRef.current.onDemonHit?.(health);
        }
      },
      onStatus: (status) => propsRef.current.onOrbStatus?.(status),
    });
    function prepareOrbGraphics() {
      const effects = scene.getObjectByName("NeonBoy / efectos del orbe");
      if (!effects) return;
      const parent = effects.parent;
      const warmupScene = new THREE.Scene();
      const hidden = [];
      effects.traverse((object) => {
        if (!object.visible) { hidden.push(object); object.visible = true; }
      });
      const originalPosition = effects.position.clone();
      warmupScene.add(effects);
      effects.position.copy(camera.position).addScaledVector(camera.getWorldDirection(new THREE.Vector3()), 3);
      try {
        // Compile only orb materials; rendering the entire shop again with
        // every effect visible can overwhelm the WebGL context.
        renderer.render(warmupScene, camera);
      } finally {
        parent.add(effects);
        effects.position.copy(originalPosition);
        hidden.forEach((object) => { object.visible = false; });
      }
    }
    const orbEye = new THREE.Vector3();
    function fireOrb() {
      if (propsRef.current.locked) return false;
      const { heading, pitch } = resolveHalloweenOrbAim(view, player, demon.getOrbTarget() || judge.getTarget());
      const eye = view.firstPerson ? orbEye.copy(camera.position) : null;
      if (!orb.fire(player, heading, pitch, eye)) return false;
      player.yaw = heading;
      judge.armShot();
      character?.playPower();
      return true;
    }
    function dispatch(target) {
      if (!target) return;
      if (target.kind === "album") propsRef.current.onSelectAlbum?.(target.id);
      else propsRef.current.onInteract?.(target);
    }
    function selectAt(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(shop.clickable, false)[0];
      if (!hit) return false;
      if (hit.object.userData.albumId) dispatch({ kind: "album", id: hit.object.userData.albumId });
      else if (hit.object.userData.shopAction) dispatch({ kind: hit.object.userData.shopAction, id: hit.object.userData.npcId });
      return true;
    }
    function onKeyDown(event) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      if (!propsRef.current.locked && ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) footsteps.unlock();
      held.add(event.code);
      if (event.code === "KeyE" && !event.repeat && !propsRef.current.locked) dispatch(nearInteraction);
      if (event.code === "KeyF" && !event.repeat) { event.preventDefault(); fireOrb(); }
      if (event.code === "KeyR" && !event.repeat && !propsRef.current.locked) { event.preventDefault(); orb.recall(); }
      if (event.code === "KeyV") {
        view.firstPerson = !view.firstPerson;
        firstMotion.reset(view.yaw, view.firstPitch);
        if (!view.firstPerson && document.pointerLockElement === canvas) document.exitPointerLock();
        propsRef.current.onViewChange?.(view.firstPerson);
      }
      if (event.code === "Space" && player.grounded && !propsRef.current.locked) { player.grounded = false; player.velocityY = 6.4; }
    }
    function onKeyUp(event) { held.delete(event.code); }
    function onPointerDown(event) {
      if (event.button !== 0 || propsRef.current.locked) return;
      dragging = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false };
      if (view.firstPerson && event.pointerType === "mouse") canvas.requestPointerLock?.();
      else canvas.setPointerCapture?.(event.pointerId);
    }
    function onPointerMove(event) {
      if (!dragging && document.pointerLockElement !== canvas) return;
      if (dragging && Math.hypot(event.clientX - dragging.startX, event.clientY - dragging.startY) > 4) dragging.moved = true;
      const dx = document.pointerLockElement === canvas ? event.movementX : event.clientX - dragging.x;
      const dy = document.pointerLockElement === canvas ? event.movementY : event.clientY - dragging.y;
      if (document.pointerLockElement !== canvas) { dragging.x = event.clientX; dragging.y = event.clientY; }
      if (view.firstPerson) firstMotion.look(dx, dy);
      else { view.yaw -= dx * .004; view.pitch = THREE.MathUtils.clamp(view.pitch + dy * .003, -.18, .85); }
    }
    function onPointerUp(event) {
      if (dragging && !dragging.moved && !propsRef.current.locked && event.pointerType === "mouse" &&
        (view.firstPerson || !selectAt(event))) fireOrb();
      dragging = null;
    }
    function onWheel(event) { view.distance = THREE.MathUtils.clamp(view.distance + event.deltaY * .005, 3, 7); }
    function onBlur() { held.clear(); dragging = null; firstMotion.reset(view.yaw, view.firstPitch); footsteps.reset(); }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: true });

    function frame() {
      frameId = requestAnimationFrame(frame);
      const frameTime = performance.now();
      const dt = Math.min((frameTime - previousFrameTime) / 1000, .05);
      previousFrameTime = frameTime;
      elapsed += dt;
      if (contextLost) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const ratio = renderRatio(rect.width, rect.height);
        if (Math.abs(renderer.getPixelRatio() - ratio) > .015) renderer.setPixelRatio(ratio);
        if (canvas.width !== Math.round(rect.width * renderer.getPixelRatio()) || canvas.height !== Math.round(rect.height * renderer.getPixelRatio())) {
          renderer.setSize(rect.width, rect.height, false);
          camera.aspect = rect.width / rect.height;
          camera.updateProjectionMatrix();
        }
      }
      if (elapsed >= nextResourceScan) {
        textureCache.prepare(scene);
        codeVision.register();
        nextResourceScan = elapsed + .75;
      }
      codeVision.setActive(propsRef.current.vision);
      secretCovers.setActive(propsRef.current.vision);
      secretProps.setVision(propsRef.current.vision);
      secretProps.setReflectionEnabled(assetsReady && !propsRef.current.locked);
      secretProps.setVhsCollected(propsRef.current.vhsCollected);
      secretProps.setAnniversaryUnlocked(propsRef.current.anniversaryUnlocked);
      secretProps.setSecretVinylUnlocked(propsRef.current.secretVinylUnlocked);
      secretProps.update(propsRef.current.locked ? 0 : dt, elapsed);
      glassesChest.update(dt, propsRef.current.chestOpen);
      realityKey.setAvailable(canRevealRealityKey(propsRef.current.belfegorAttempts) && !propsRef.current.realityKeyOwned);
      demon.setChestOpen(glassesChest.accessible);
      demon.setVision(propsRef.current.vision);
      judge.setPhase(propsRef.current.judgePhase || "inactive");
      matrixMessages.setActive(propsRef.current.vision);
      if (propsRef.current.hideDefeatedDemon) demon.hideDefeated();
      if (propsRef.current.glassesCollected && !demon.glassesCollected) demon.collect();
      codeVision.update(dt, player, reducedMotion, demon.root, propsRef.current.reduceFlashing);
      canvas.dataset.frequencyVision = propsRef.current.vision ? "active" : "inactive";
      const motionLocked = propsRef.current.locked;
      const touchMove = propsRef.current.touchMoveRef?.current;
      const touchActive = touchMove && Math.hypot(touchMove.x, touchMove.y) > 0;
      const forward = motionLocked ? 0 : touchActive ? touchMove.y : Number(held.has("KeyW") || held.has("ArrowUp")) - Number(held.has("KeyS") || held.has("ArrowDown"));
      const right = motionLocked ? 0 : touchActive ? touchMove.x : Number(held.has("KeyD") || held.has("ArrowRight")) - Number(held.has("KeyA") || held.has("ArrowLeft"));
      const speed = held.has("ShiftLeft") || held.has("ShiftRight") || propsRef.current.touchRun ? 5 : 2.8;
      const px = player.x, pz = player.z;
      let dx, dz;
      if (view.firstPerson) {
        const motion = firstMotion.update(dt, forward, right, speed);
        view.yaw = motion.yaw; view.firstPitch = motion.pitch;
        dx = motion.dx; dz = motion.dz;
      } else {
        const length = Math.max(1, Math.hypot(forward, right));
        dx = (right * Math.cos(view.yaw) - forward * Math.sin(view.yaw)) / length * speed * dt;
        dz = (-right * Math.sin(view.yaw) - forward * Math.cos(view.yaw)) / length * speed * dt;
      }
      if (canMove(player.x + dx, player.z)) player.x += dx;
      if (canMove(player.x, player.z + dz)) player.z += dz;
      const movementDistance = Math.hypot(player.x - px, player.z - pz);
      player.speed = dt > 0 ? movementDistance / dt : 0;
      player.running = speed > 4;
      if (view.firstPerson) player.yaw = Math.PI + view.yaw;
      else if (player.speed > .2) player.yaw = Math.atan2(player.x - px, player.z - pz);
      if (!player.grounded) {
        player.velocityY -= 18 * dt;
        player.y = Math.max(0, player.y + player.velocityY * dt);
        if (player.y === 0) { player.velocityY = 0; player.grounded = true; player.landing = .24; }
      }
      player.landing = Math.max(0, player.landing - dt);
      footsteps.update(movementDistance, player.grounded, player.running);
      if (propsRef.current.judgePhase === "intro" && judgeCameraMode === "spawning") {
        judgeCameraReturnStart.copy(camera.position);
        judgeCameraReturnLook.copy(lookAt);
      }
      if (view.firstPerson) {
        desiredCamera.set(player.x, player.y + 1.68, player.z);
        camera.position.lerp(desiredCamera, 1 - Math.exp(-18 * dt));
        lookAt.set(camera.position.x - Math.sin(view.yaw) * Math.cos(view.firstPitch), camera.position.y - Math.sin(view.firstPitch), camera.position.z - Math.cos(view.yaw) * Math.cos(view.firstPitch));
      } else {
        desiredCamera.set(player.x + Math.sin(view.yaw) * view.distance, player.y + 2.5 + Math.sin(view.pitch) * 1.5, Math.min(player.z + Math.cos(view.yaw) * view.distance, 14.95));
        camera.position.lerp(desiredCamera, 1 - Math.exp(-9 * dt));
        lookAt.set(player.x, player.y + 1.2, player.z);
      }
      const cameraJudgePhase = propsRef.current.judgePhase || "inactive";
      if (cameraJudgePhase === "spawning") {
        if (judgeCameraMode !== "spawning") {
          judgeCameraMode = "spawning";
          judgeCameraStartTime = performance.now();
          judgeCameraStart.copy(camera.position);
          judgeCameraStartTarget.copy(lookAt);
        }
        judgeEntranceCameraPose(judgeCameraStart, judgeCameraStartTarget, judge.position,
          reducedMotion ? JUDGE_ENTRANCE_SECONDS : (performance.now() - judgeCameraStartTime) / 1000, camera.position, lookAt);
      } else if (cameraJudgePhase === "intro" && (judgeCameraMode === "spawning" || judgeCameraMode === "return")) {
        if (judgeCameraMode === "spawning") { judgeCameraMode = "return"; judgeCameraStartTime = performance.now(); }
        if (view.firstPerson) judgePlayerLook.set(
          desiredCamera.x - Math.sin(view.yaw) * Math.cos(view.firstPitch),
          desiredCamera.y - Math.sin(view.firstPitch),
          desiredCamera.z - Math.cos(view.yaw) * Math.cos(view.firstPitch));
        else judgePlayerLook.set(player.x, player.y + 1.2, player.z);
        if (judgeReturnCameraPose(judge.position, judgeCameraReturnStart, judgeCameraReturnLook, desiredCamera, judgePlayerLook,
          reducedMotion ? JUDGE_RETURN_SECONDS : Math.max(0, (performance.now() - judgeCameraStartTime) / 1000 - JUDGE_INTRO_HOLD_SECONDS), camera.position, lookAt)) judgeCameraMode = "done";
      } else if (cameraJudgePhase !== "intro") judgeCameraMode = "inactive";
      camera.lookAt(lookAt);
      playerLight.position.set(player.x - .8, player.y + 2.65, player.z + 1.45);
      character?.update(player, dt);
      orb.update(motionLocked ? 0 : dt, player, elapsed);
      demon.update(motionLocked ? 0 : dt, elapsed, player, propsRef.current.vision, motionLocked, () => propsRef.current.onPlayerDamage?.(), reducedMotion || propsRef.current.reduceFlashing);
      judge.update(dt, elapsed, player, motionLocked, reducedMotion || propsRef.current.reduceFlashing);
      matrixMessages.update(dt, camera, player, { reducedMotion: reducedMotion || propsRef.current.reduceFlashing, locked: motionLocked });
      if (!motionLocked && !demon.defeated && Math.hypot(player.x - demon.position.x, player.z - demon.position.z) < 3.2) propsRef.current.onDemonApproach?.();
      if (character) character.root.visible = !view.firstPerson && !(cameraJudgePhase === "spawning" || (cameraJudgePhase === "intro" && judgeCameraMode === "return"));

      let closest = null, nearest = Infinity;
      for (const spot of shop.albumTargets) {
        const distance = Math.hypot(player.x - spot.x, player.z - spot.z);
        if (distance < spot.reach && distance < nearest) { nearest = distance; closest = { kind: "album", id: spot.id }; }
      }
      for (const [kind, position, reach] of [["jukebox", JUKEBOX_POSITION, 2.8], ["coins", COIN_TABLE_POSITION, 2.45]]) {
        const distance = Math.hypot(player.x - position.x, player.z - position.z);
        if (distance < reach && distance < nearest) { nearest = distance; closest = { kind }; }
      }
      for (const npc of npcs) {
        const position = npcActors.getPosition(npc.id);
        if (!position) continue;
        const distance = Math.hypot(player.x - position.x, player.z - position.z);
        if (distance < npc.reach && distance < nearest) { nearest = distance; closest = { kind: "npc", id: npc.id }; }
      }
      if (canRevealRealityKey(propsRef.current.belfegorAttempts) && !propsRef.current.realityKeyOwned) {
        const keyDistance = Math.hypot(player.x - REALITY_KEY_POSITION.x, player.z - REALITY_KEY_POSITION.z);
        if (keyDistance < REALITY_KEY_POSITION.reach && keyDistance < nearest) {
          nearest = keyDistance;
          closest = { kind: "realityKey" };
        }
      }
      const chestDistance = Math.hypot(player.x - REALITY_CHEST.x, player.z - REALITY_CHEST.z);
      if (chestDistance < REALITY_CHEST.reach && chestDistance < nearest) {
        nearest = chestDistance;
        closest = { kind: propsRef.current.chestOpen && glassesChest.accessible && !propsRef.current.glassesCollected ? "glasses" : "glassesChest" };
      }
      for (const [kind, position] of Object.entries(SECRET_POSITIONS)) {
        if (kind === "vhs" && propsRef.current.vhsCollected) continue;
        if (kind === "vinyl" && !propsRef.current.anniversaryUnlocked) continue;
        if (kind === "secretVinyl" && !propsRef.current.secretVinylUnlocked) continue;
        if (kind === "phone" && !propsRef.current.phoneRinging) continue;
        if (kind === "tv" && !propsRef.current.vhsCollected) continue;
        const distance = Math.hypot(player.x - position.x, player.z - position.z);
        if (distance < position.reach && distance < nearest) { nearest = distance; closest = { kind }; }
      }
      if (!propsRef.current.locked) {
        secretCovers.discover(player, propsRef.current.onSecretDiscovered);
        if (propsRef.current.vision && lastMirrorWhisperActivation !== propsRef.current.visionActivation &&
          player.x < SECRET_POSITIONS.mirror.x - .4 &&
          Math.hypot(player.x - SECRET_POSITIONS.mirror.x, player.z - SECRET_POSITIONS.mirror.z) < 4.5) {
          mirrorProjection.set(SECRET_POSITIONS.mirror.x - .06, SECRET_POSITIONS.mirror.y, SECRET_POSITIONS.mirror.z).project(camera);
          if (mirrorProjection.z > 0 && mirrorProjection.z < 1 &&
              Math.abs(mirrorProjection.x) < .38 && Math.abs(mirrorProjection.y) < .42) {
            lastMirrorWhisperActivation = propsRef.current.visionActivation;
            propsRef.current.onMirrorWhisper?.();
          }
        }
      }
      nearInteraction = closest;
      const key = closest ? `${closest.kind}:${closest.id || ""}` : "";
      if (key !== nearKey) { nearKey = key; propsRef.current.onNearby?.(closest); }
      npcActors.update(dt, player, null, !propsRef.current.locked && closest?.kind === "npc" ? closest.id : null, false, null);
      // In Halloween, Rulo turns to face NeonBoy as he approaches, even when
      // another interactive object is closer. His position stays unchanged.
      const ruloRoot = npcActors.actors.get("rulo")?.root;
      if (ruloRoot) {
        const dx = player.x - ruloRoot.position.x;
        const dz = player.z - ruloRoot.position.z;
        const targetYaw = Math.hypot(dx, dz) < 3.6 ? Math.atan2(dx, dz) : ruloRestYaw;
        const turn = Math.atan2(Math.sin(targetYaw - ruloFacingYaw), Math.cos(targetYaw - ruloFacingYaw));
        ruloFacingYaw += turn * Math.min(1, dt * 3.2);
        ruloRoot.rotation.y = ruloFacingYaw;
      }
      if (elapsed >= nextAmbientScan) {
        nextAmbientScan = elapsed + .75;
        const rulo = npcActors.getPosition("rulo"), roxy = npcActors.getPosition("roxy");
        const pair = rulo && roxy && Math.hypot(rulo.x - roxy.x, rulo.z - roxy.z) < 7
          && Math.hypot(player.x - rulo.x, player.z - rulo.z) < 3.8
          && Math.hypot(player.x - roxy.x, player.z - roxy.z) < 3.8 ? "duo-01" : null;
        if (pair !== nearPairKey) { nearPairKey = pair; propsRef.current.onAmbientOpportunity?.(pair); }
      }
      shop.coinGroup.visible = propsRef.current.credits < 10;
      shop.coinSpinners.forEach((spinner, index) => {
        spinner.rotation.y += dt * (2.8 + index % 3 * .25);
        spinner.position.y = spinner.userData.baseY + Math.sin(elapsed * 3.2 + index * .58) * .025;
      });
      shop.atmosphere?.update(elapsed, reducedMotion, false, false);
      const event = propsRef.current.lightingEvent;
      const age = event ? (performance.now() - event.startedAt) / 1000 : 0;
      const target = propsRef.current.judgePhase === "spawning" ? .42
        : ["intro", "quiz", "quiz-result", "outcome"].includes(propsRef.current.judgePhase) ? .76
        : event?.kind === "outage" ? outageLightLevel(age, reducedMotion || propsRef.current.reduceFlashing)
        : event?.kind === "anniversary" ? .72 : 1;
      lightingFactor += (target - lightingFactor) * (1 - Math.exp(-6 * dt));
      anniversaryGlow += ((event?.kind === "anniversary" ? 1 : 0) - anniversaryGlow) * (1 - Math.exp(-3 * dt));
      if (!event && Math.abs(1 - lightingFactor) < .001) lightingFactor = 1;
      if (!event && anniversaryGlow < .001) anniversaryGlow = 0;
      for (const [light, original] of regularLights) light.intensity = original * lightingFactor;
      playerLight.intensity = 11 * (.35 + .65 * lightingFactor);
      shop.ceilingFixtures.forEach(({ material, light, pattern }, index) => {
        if (pattern < 0) material.color.copy(fixtureColors[index]);
        material.color.multiplyScalar(lightingFactor);
        if (light) light.intensity = (pattern < 0 ? fixtureBaseIntensities[index] : light.intensity) * lightingFactor;
      });
      scene.environmentIntensity = .3 * (.36 + .64 * lightingFactor);
      anniversaryLights.forEach((light, index) => { light.intensity = anniversaryGlow * (index ? 7 : 6); });
      for (const [material, original] of anniversarySignMaterials) {
        material.color.copy(original.color).multiplyScalar(1 + anniversaryGlow * .18);
        material.opacity = Math.min(1, original.opacity + anniversaryGlow * .16);
      }
      canvas.dataset.lightingEvent = propsRef.current.judgePhase === "spawning" ? "judge" : event?.kind || "none";
      if (assetsReady && !orbGraphicsPrepared) {
        propsRef.current.onProgress?.({ percent: 98, label: "Preparando efectos del orbe..." });
        prepareOrbGraphics();
        orbGraphicsPrepared = true;
      }
      renderer.render(scene, camera);
      if (assetsReady && !loadFinished) {
        loadFinished = true;
        if (playerFailed) propsRef.current.onReady?.(false);
        else {
          propsRef.current.onProgress?.({ percent: 100, label: "La tienda est\u00e1 lista" });
          finishTimer = window.setTimeout(() => { if (alive) propsRef.current.onReady?.(true); }, 300);
        }
      }
    }
    camera.position.set(0, 2.7, 15.1);
    frame();
    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      window.clearTimeout(finishTimer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      npcActors.dispose();
      window.removeEventListener("neonboy-halloween-debug-judge", onDebugJudge);
      window.removeEventListener("neonboy-halloween-debug-judge-hit", onDebugJudgeHit);
      window.removeEventListener("neonboy-halloween-debug-judge-combat", onDebugJudgeCombat);
      demon.stop();
      judge.stop();
      judge.dispose();
      matrixMessages.dispose();
      secretCovers.reset();
      secretProps.dispose();
      codeVision.dispose();
      footsteps.dispose();
      orb.dispose();
      orbColliders.forEach((mesh) => mesh.geometry.dispose());
      orbColliderMaterial.dispose();
      character?.dispose();
      environment.dispose();
      pmrem.dispose();
      disposeObjects([scene]);
      textureCache.dispose();
      renderer.dispose();
    };
  }, [albums]);

  return <canvas ref={canvasRef} className={`halloween-scene-canvas${damageActive ? " is-hurt" : ""}`} aria-label="Tienda de los Discos de NeonBoy en 3D" />;
}



