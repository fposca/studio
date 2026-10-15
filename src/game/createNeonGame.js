import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createParthenonSet, PARTHENON_PERIODS } from "../editors/parthenonSet.js";
import { BOUNDS, FIXED_STEP } from "./gameRules.js";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { LEVELS } from "./gameLevels.js";
import { createGameCharacter, createPlato, disposeObjects, loadGameCharacters, loadInteriorCharacters, loadCemeteryCharacters, loadCatacombCharacters } from "./gameCharacters.js";
import { createFirstPersonView } from "./gameFirstPerson.js";
import { hammerMotion } from "./gameHammerMotion.js";
import { createGameInput } from "./gameInput.js";
import { createGameSound } from "./gameSound.js";
import { createGameCemetery } from "./gameCemetery.js";
import { createGameCatacombs } from "./gameCatacombs.js";
import { createCatacombAmmo, createArrowVisuals } from "./gameAmmo.js";
import { createGameTempleInterior } from "./gameTempleInterior.js";
import { createWeaponPickups } from "./gameWeapons.js";
import { createHealthPickups } from "./gameHealth.js";
import { createGameArtifacts } from "./gameArtifacts.js";
import { createGameChallenges } from "./gameChallenges.js";
import { createGameTempleSky } from "./gameTempleSky.js";
import { validateGameSave } from "./gameSave.js";
import { createGameOpening, OPENING_DURATION } from "./gameOpening.js";

const WEBGL_MESSAGE = "Chrome no pudo iniciar WebGL 2. Revisa chrome://settings/system y activa la aceleracion grafica; reinicia Chrome y pulsa Reintentar. Podes comprobar WebGL 2 en chrome://gpu.";

function requireWebGL2(canvas) {
  let context;
  try { context = canvas.getContext("webgl2", { antialias: true, powerPreference: "high-performance" }); }
  catch { /* Some browsers throw instead of returning null when graphics are blocked. */ }
  if (context) return context;
  const error = new Error(WEBGL_MESSAGE);
  error.name = "WebGLUnavailableError";
  throw error;
}

function createCoins(scene, world, template) {
  const bounds = new THREE.Box3().setFromObject(template);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 0.5 / Math.max(size.x, size.y, size.z);
  return world.coins.map((coin) => {
    const group = new THREE.Group();
    const model = template.clone(true);
    model.name = "Modelo moneda";
    model.scale.setScalar(scale);
    model.position.copy(center).multiplyScalar(-scale);
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.userData.sharedGameAsset = true;
    });
    group.add(model);
    group.name = `Moneda ${coin.id + 1}`;
    scene.add(group);
    return group;
  });
}

function createPerimeter(scene) {
  const map = new THREE.TextureLoader().load(new URL("../assets/environments/parthenon-weathered-stone-v2.png", import.meta.url).href);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 1);
  map.anisotropy = 8;
  const material = new THREE.MeshStandardMaterial({ map, color: 0x959184, roughness: 0.96, bumpMap: map, bumpScale: 0.03 });
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1.95, 0.68, 0.6);
  for (const x of [BOUNDS.left - 0.3, BOUNDS.right + 0.3]) for (let z = -42.5; z < 21; z += 2) {
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, 0.22, z);
    block.rotation.y = Math.PI / 2;
    group.add(block);
  }
  for (const z of [BOUNDS.back - 0.3, BOUNDS.front + 0.3]) for (let x = -16; x < 17; x += 2) {
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, 0.22, z);
    group.add(block);
  }
  group.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  scene.add(group);
}

function createParticles(scene) {
  const count = 160;
  const positions = new Float32Array(count * 3);
  positions.fill(-1000);
  const colors = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  const particles = Array.from({ length: count }, () => ({ life: 0, vx: 0, vy: 0, vz: 0 }));
  let cursor = 0;
  return {
    emit(event) {
      const color = new THREE.Color(event.type === "coin" ? 0xffda5c : event.type === "heal" ? 0xff6f95 : event.type === "hammerImpact" ? 0xe8be8a : 0x78efca);
      for (let j = 0; j < 12; j += 1) {
        const i = cursor++ % count;
        positions.set([event.x, event.y, event.z], i * 3);
        colors.set([color.r, color.g, color.b], i * 3);
        Object.assign(particles[i], { life: 0.45, vx: Math.sin(j * 2.4) * 1.8, vy: 1 + (j % 4) * 0.5, vz: Math.cos(j * 2.4) * 1.8 });
      }
      geometry.attributes.color.needsUpdate = true;
    },
    clear() { particles.forEach((particle) => { particle.life = 0; }); positions.fill(-1000); geometry.attributes.position.needsUpdate = true; },
    update(dt) {
      particles.forEach((particle, i) => {
        if (particle.life <= 0) return;
        particle.life -= dt;
        positions[i * 3] += particle.vx * dt;
        positions[i * 3 + 1] += particle.vy * dt;
        positions[i * 3 + 2] += particle.vz * dt;
        particle.vy -= dt * 8;
        if (particle.life <= 0) positions[i * 3 + 1] = -1000;
      });
      geometry.attributes.position.needsUpdate = true;
    }
  };
}

export async function createNeonGame({ canvas, signal, onChange, onProgress, onError }) {
  const webgl = requireWebGL2(canvas);
  const resources = await Promise.allSettled([initializePhysics(), loadGameCharacters((value) => {
    if (!signal.aborted) onProgress?.(Math.round(15 + value * 70));
  })]);
  const failed = resources.find((result) => result.status === "rejected");
  const assets = resources[1].status === "fulfilled" ? resources[1].value : null;
  if (failed || signal.aborted) {
    assets?.dispose();
    webgl.getExtension("WEBGL_lose_context")?.loseContext();
    if (failed && !signal.aborted) throw failed.reason;
    return null;
  }
  let world, renderer, scene, environment, input, observer, raf, levelGroup, scenery, stopped = false;
  let interiorAssets = null, cemeteryAssets = null, catacombAssets = null, plato = null, templeSky = null;
  let firstPersonView, opening;
  let animatePickups = () => {};
  const characters = [];
  const sound = createGameSound();
  function clearLevel() {
    firstPersonView?.dispose(); firstPersonView = null;
    animatePickups?.dispose?.();
    if (plato) { plato.root.removeFromParent(); plato.dispose(); plato = null; }
    templeSky?.dispose(); templeSky = null;
    for (const character of characters.splice(0)) { character.root.removeFromParent(); character.dispose(); }
    scenery?.userData.dispose?.();
    if (levelGroup) { levelGroup.removeFromParent(); disposeObjects([levelGroup]); }
  }
  function dispose() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    observer?.disconnect();
    input?.dispose();
    sound.dispose();
    opening?.dispose(); opening = null;
    clearLevel();
    if (scene) disposeObjects([scene]);
    assets.dispose();
    interiorAssets?.dispose(); interiorAssets = null;
    cemeteryAssets?.dispose(); cemeteryAssets = null;
    catacombAssets?.dispose(); catacombAssets = null;
    environment?.dispose();
    world?.dispose();
    renderer?.dispose();
    if (renderer) renderer.forceContextLoss();
    else webgl.getExtension("WEBGL_lose_context")?.loseContext();
    signal.removeEventListener("abort", dispose);
    canvas.removeEventListener("webglcontextlost", contextLost);
  }
  function contextLost(event) {
    event.preventDefault();
    onError?.(new Error("Se interrumpio el motor 3D. Volve a cargar la partida."));
    dispose();
  }
  try {
    world = new GameWorld();
    renderer = new THREE.WebGLRenderer({ canvas, context: webgl, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.08, 800);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.3;
    room.dispose();
    pmrem.dispose();
    const ambient = new THREE.HemisphereLight(0xc5dcf4, 0x827563, 1.1);
    scene.add(ambient);
    let coins = [], collectibles, animateAmmo = () => {}, animateArrows = () => {}, animateHearts = () => {}, animateArtifacts = () => {}, animateChallenges = () => {};
    const particles = createParticles(scene);
    let phase = "opening", introTime = 0, openingTime = 0;
    let paused = false, discovery = null, loadingLevel = false, loadingName = "", period = "night", previous = 0, accumulator = 0, lastHud = 0;
    const portraitLight = new THREE.PointLight(0xf4f8ff, 22, 9, 2);
    portraitLight.position.set(-1.6, 2.8, 16);
    scene.add(portraitLight);
    let cameraInitialized = false;
    let reticle = { x: 50, y: 48 };
    let damage = null, damageSequence = 0, damageRemaining = 0;
    const aimPoint = new THREE.Vector3();
    const focus = new THREE.Vector3(), desiredFocus = new THREE.Vector3(), direction = new THREE.Vector3(), desiredCamera = new THREE.Vector3();
    const previousActors = [], renderActors = [];
    function rememberActorTransforms() {
      world.actors.forEach((actor, index) => {
        const previous = previousActors[index] ||= {};
        previous.x = actor.x; previous.y = actor.y; previous.z = actor.z; previous.yaw = actor.yaw;
      });
    }
    function interpolateActors(alpha) {
      world.actors.forEach((actor, index) => {
        const previous = previousActors[index] || actor;
        const pose = renderActors[index] ||= {};
        Object.assign(pose, actor);
        pose.x = THREE.MathUtils.lerp(previous.x, actor.x, alpha);
        pose.y = THREE.MathUtils.lerp(previous.y, actor.y, alpha);
        pose.z = THREE.MathUtils.lerp(previous.z, actor.z, alpha);
        pose.yaw = previous.yaw + Math.atan2(Math.sin(actor.yaw - previous.yaw), Math.cos(actor.yaw - previous.yaw)) * alpha;
      });
      renderActors.length = world.actors.length;
      previousActors.length = world.actors.length;
    }
    const publish = () => onChange?.({ ...world.snapshot(), paused, discovery, period, phase, openingTime, soundReady: sound.ready, openingFade: opening?.state?.fade || 0, loadingLevel, loadingName, reticle, damage, firstPerson: input?.orbit.firstPerson ?? false });
    function finishOpening() {
      if (phase !== "opening" || stopped) return;
      opening?.dispose(); opening = null;
      phase = "title"; introTime = 0; accumulator = 0;
      sound.setPaused(true);
      setPeriod("night"); updateCamera(0); updateCharacters(0);
      renderer.render(scene, camera); publish();
    }
    function finishLevelIntro() {
      if (phase !== "level-intro" || loadingLevel || stopped) return;
      phase = "game";
      paused = document.hidden;
      accumulator = 0;
      rememberActorTransforms();
      input.setEnabled(!paused);
      sound.setPaused(paused);
      publish();
      if (!paused) canvas.focus();
    }
    function setPaused(value = !paused) {
      if (phase !== "game" || world.status !== "playing" || loadingLevel) return;
      if ((discovery || world.dialogue) && !value) return;
      paused = value;
      if (!paused) rememberActorTransforms();
      sound.setPaused(paused);
      input?.setEnabled(!paused);
      accumulator = 0;
      publish();
    }
    function toggleView() {
      if (phase !== "game" || loadingLevel) return;
      input.setFirstPerson(!input.orbit.firstPerson);
      cameraInitialized = false;
      updateCamera(0); updateCharacters(0); publish();
      canvas.focus();
    }
    input = createGameInput(canvas, setPaused, sound.unlock, toggleView);
    input.setEnabled(false);
    function setPeriod(next) {
      const mode = PARTHENON_PERIODS.find((entry) => entry.id === next) || PARTHENON_PERIODS[0];
      period = mode.id;
      scenery.userData.animate(true, { period }, world.time * 1000);
      ambient.color.set(mode.skyLight);
      ambient.groundColor.set(mode.ground);
      ambient.intensity = period === "night" ? 0.55 : 1.1;
      scene.environmentIntensity = period === "night" ? 0.2 : 0.3;
      if (world.level.id === 2) { ambient.intensity = 0.12; scene.environmentIntensity = 0.12; }
      if (world.level.id === 4) { ambient.intensity = 0.32; scene.environmentIntensity = 0.17; }
      scene.fog = scenery.userData.atmosphere;
      renderer.toneMappingExposure = period === "night" ? 1.35 : 1.1;
      if (world.level.id === 2) renderer.toneMappingExposure = 1.1;
      publish();
    }
    function buildLevel() {
      firstPersonView = createFirstPersonView(assets.weapons, environment.texture, assets.player);
      levelGroup = new THREE.Group();
      scenery = world.level.id === 2 ? createGameTempleInterior(world) : world.level.id === 3 ? createGameCemetery(world) : world.level.id === 4 ? createGameCatacombs(world) : createParthenonSet();
      levelGroup.add(scenery);
      scene.add(levelGroup);
      if (world.level.id === 1) templeSky = createGameTempleSky(levelGroup, world, assets.dragon);
      if (world.level.id === 1 || world.level.id === 3) createPerimeter(levelGroup);
      if (world.level.quest || world.level.advisor) { plato = createPlato(world.level.advisor ? catacombAssets.plato : interiorAssets.plato, world.level.advisor || world.level.quest); levelGroup.add(plato.root); }
      collectibles = new THREE.Group();
      levelGroup.add(collectibles);
      coins = createCoins(collectibles, world, assets.coin);
      animatePickups = createWeaponPickups(collectibles, world, assets.weapons);
      animateAmmo = createCatacombAmmo(collectibles, world);
      animateArrows = createArrowVisuals(levelGroup, world);
      animateHearts = createHealthPickups(collectibles, world, assets.heart);
      animateArtifacts = createGameArtifacts(collectibles, world);
      animateChallenges = createGameChallenges(levelGroup, world);
      animateChallenges(1);
      for (const actor of world.actors) {
        const asset = actor === world.player ? assets.player : interiorAssets?.[actor.species] || cemeteryAssets?.[actor.species] || catacombAssets?.[actor.species] || (actor.species === "templeBoss" ? assets.templeBoss : actor.species === "demon" ? assets.demon : assets.enemy);
        const character = createGameCharacter(asset, actor !== world.player, { boss: actor.boss });
        scene.add(character.root);
        characters.push(character);
      }
      setPeriod("night");
    }
    buildLevel();
    rememberActorTransforms();
    interpolateActors(1);
    opening = await createGameOpening(assets, environment.texture);
    if (signal.aborted) { dispose(); return null; }
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      opening?.resize(width / height);
    };
    observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    function updateCamera(dt) {
      const firstPerson = phase !== "title" && input.orbit.firstPerson;
      const fov = firstPerson ? 78 : 55;
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      if (phase === "title") {
        const height = canvas.clientHeight, portrait = canvas.clientWidth <= 520;
        const landscape = height <= 540 && !portrait;
        // Reserve the title and action area while keeping the entire animated model in view.
        const top = height * (portrait ? 0.1 : 0.05) + (portrait ? 72 : 96);
        const bottom = height * 0.96 - 144;
        const focal = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        const distance = landscape ? 3.15 : Math.max(portrait ? 3.55 : 3.3, 1.95 * focal / Math.max(130, bottom - top));
        const targetY = landscape ? 0.98 : 0.94 + ((top + bottom) / 2 - height / 2) * distance / focal;
        const targetX = landscape ? -0.95 : 0;
        camera.position.set(targetX + Math.sin(introTime * 0.12) * 0.16, targetY + 0.09, 13 + distance);
        camera.lookAt(targetX, targetY, 13);
        return;
      }
      const player = renderActors[0] || world.player;
      if (firstPerson) {
        const { yaw, lookPitch } = input.orbit;
        const hammerAttack = world.player.attack;
        const shock = hammerAttack?.kind === "hammer" ? hammerMotion(hammerAttack.elapsed).jolt : 0;
        camera.position.set(player.x, player.y + 1.62 - shock * 0.028, player.z);
        direction.set(-Math.sin(yaw) * Math.cos(lookPitch), Math.sin(lookPitch), -Math.cos(yaw) * Math.cos(lookPitch));
        camera.lookAt(aimPoint.copy(camera.position).add(direction));
        if (shock) camera.rotateZ(shock * 0.008);
        camera.updateMatrixWorld();
        reticle = { x: 50, y: 50 };
        cameraInitialized = false;
        return;
      }
      desiredFocus.set(player.x, player.y + 1.05, player.z);
      if (!cameraInitialized) focus.copy(desiredFocus);
      else focus.lerp(desiredFocus, 1 - Math.exp(-12 * dt));
      const orbit = input.orbit;
      direction.set(Math.sin(orbit.yaw) * Math.cos(orbit.pitch), Math.sin(orbit.pitch), Math.cos(orbit.yaw) * Math.cos(orbit.pitch));
      const distance = world.cameraDistance(focus, direction, orbit.distance);
      desiredCamera.copy(focus).addScaledVector(direction, distance);
      camera.position.copy(desiredCamera);
      camera.lookAt(focus);
      camera.updateMatrixWorld();
      if (world.equipped === "crossbow") {
        const yaw = orbit.yaw + Math.PI;
        aimPoint.set(player.x + Math.sin(yaw) * 10, player.y + 1.3, player.z + Math.cos(yaw) * 10).project(camera);
        reticle = { x: THREE.MathUtils.clamp((aimPoint.x + 1) * 50, 10, 90),
          y: THREE.MathUtils.clamp((1 - aimPoint.y) * 50, 10, 78) };
      }
      cameraInitialized = true;
    }
    function frame(timestamp) {
      if (stopped) return;
      try {
        const dt = previous ? Math.min((timestamp - previous) / 1000, 0.1) : FIXED_STEP;
        previous = timestamp;
        if (phase === "opening") {
          const motionDt = document.hidden ? 0 : dt;
          openingTime = Math.min(OPENING_DURATION, openingTime + motionDt);
          for (const event of opening.update(openingTime, motionDt)) sound.play(event, opening.state.hero);
          renderer.toneMappingExposure = 1.05;
          renderer.render(opening.scene, opening.camera);
          if (openingTime >= OPENING_DURATION) finishOpening();
          else if (timestamp - lastHud > 60) { publish(); lastHud = timestamp; }
          raf = requestAnimationFrame(frame);
          return;
        }
        if (phase === "game" && !paused && !loadingLevel && world.status === "playing") {
          accumulator += dt;
          while (accumulator >= FIXED_STEP) {
            rememberActorTransforms();
            world.step(input.read(FIXED_STEP));
            accumulator -= FIXED_STEP;
            if (world.events.some((event) => ["discovery", "dialogue"].includes(event.type))) { accumulator = 0; break; }
          }
          const events = world.events.splice(0);
          let found = null;
          for (const event of events) {
            sound.play(event, world.player, input.orbit.yaw);
            if (["hit", "defeat"].includes(event.type) && event.actor === world.player.id) {
              damage = { id: ++damageSequence, amount: event.amount, previousHealth: event.previousHealth };
              damageRemaining = 0.65;
              publish();
            }
            if (["coin", "pickup", "heal", "hit", "defeat", "secret", "hammerImpact"].includes(event.type)) particles.emit(event);
            if (event.type === "discovery") found = world.artifacts.find((artifact) => artifact.id === event.id);
          }
          if (found && world.status === "playing") { discovery = found; setPaused(true); }
          if (world.dialogue) setPaused(true);
          if (world.status !== "playing") { input.setEnabled(false); publish(); }
        }
        if (damage) {
          damageRemaining -= dt;
          if (damageRemaining <= 0) { damage = null; publish(); }
        }
        const visualDt = paused || phase === "level-intro" ? 0 : dt;
        if (phase === "title") introTime += dt;
        const renderAlpha = phase === "game" && !paused && world.status === "playing" ? Math.min(1, accumulator / FIXED_STEP) : 1;
        interpolateActors(renderAlpha);
        animateChallenges(renderAlpha);
        updateCamera(visualDt);
        updateCharacters(visualDt);
        plato?.update(world.player, world.level.advisor ? (world.adviceIndex === 0 ? "unstarted" : "searching") : world.questStage, visualDt, world.time);
        coins.forEach((mesh, index) => {
          const coin = world.coins[index];
          mesh.visible = !coin.collected;
          const platform = world.platforms.find((entry) => entry.id === coin.platformId);
          const x = platform ? THREE.MathUtils.lerp(platform.previous.x, platform.x, renderAlpha) + coin.offsetX : coin.x;
          const z = platform ? THREE.MathUtils.lerp(platform.previous.z, platform.z, renderAlpha) + coin.offsetZ : coin.z;
          mesh.position.set(x, coin.y + 0.8 + Math.sin(world.time * 2.8 + index) * 0.12, z);
          mesh.rotation.y = world.time * 1.7 + index;
        });
        animatePickups(world.time);
        animateAmmo(world.time);
        animateArrows();
        animateHearts(world.time);
        animateArtifacts(world.time);
        scenery.userData.animate(true, { period }, (phase === "title" ? introTime : world.time) * 1000);
        templeSky?.update(phase, period, world.time, world.player, scene);
        particles.update(visualDt);
        renderer.render(scene, camera);
        if (phase === "game" && input.orbit.firstPerson && world.player.health > 0 && !loadingLevel) {
          firstPersonView.update(renderActors[0] || world.player, visualDt, input.orbit.yaw, camera.aspect);
          firstPersonView.render(renderer);
        }
        if (timestamp - lastHud > 100) { publish(); lastHud = timestamp; }
        raf = requestAnimationFrame(frame);
      } catch (error) { onError?.(error); dispose(); }
    }
    function updateCharacters(dt) {
      const title = phase === "title";
      portraitLight.visible = title || (phase === "game" && world.equipped === "crossbow");
      if (title) {
        portraitLight.color.set(0xf4f8ff); portraitLight.intensity = 22;
        portraitLight.position.set(-1.6, 2.8, 16);
      } else if (portraitLight.visible) {
        const yaw = input.orbit.yaw;
        portraitLight.color.set(0xf0d1a3); portraitLight.intensity = 5;
        portraitLight.position.set(world.player.x + Math.sin(yaw) * 1.5 + Math.cos(yaw) * 0.8,
          world.player.y + 2.1, world.player.z + Math.cos(yaw) * 1.5 - Math.sin(yaw) * 0.8);
      }
      collectibles.visible = !title;
      characters.forEach((character, index) => {
        character.root.visible = !title || index === 0;
        if (!character.root.visible) return;
        const actor = title ? { ...world.player, x: 0, y: 0, z: 13, yaw: Math.sin(introTime * 0.3) * 0.09,
          speed: 0, running: false, grounded: true, velocityY: 0, landing: 0, combat: 0,
          attack: null, equipped: "unarmed", presentation: true } : renderActors[index] || world.actors[index];
        character.update(actor, dt, camera, title ? introTime : world.time);
        if (!title && index === 0 && input.orbit.firstPerson) character.root.visible = false;
      });
    }
    signal.addEventListener("abort", dispose, { once: true });
    canvas.addEventListener("webglcontextlost", contextLost);
    opening.update(0, 0);
    renderer.toneMappingExposure = 1.05;
    renderer.render(opening.scene, opening.camera);
    onProgress?.(100);
    publish();
    raf = requestAnimationFrame(frame);
    function resetView() {
      damage = null; damageRemaining = 0;
      input.setFirstPerson(false);
      input.setEnabled(phase === "game");
      Object.assign(input.orbit, { yaw: 0.15, pitch: 0.26, distance: 7.5, lookPitch: 0 });
      paused = false;
      discovery = null;
      sound.setPaused(phase !== "game");
      accumulator = 0;
      cameraInitialized = false;
      rememberActorTransforms();
      interpolateActors(1);
      particles.clear();
      publish();
      canvas.focus();
    }
    async function replaceWorld(next, { introduce = false } = {}) {
      if (loadingLevel || stopped) { next.dispose(); return false; }
      loadingLevel = true; loadingName = next.level.name;
      const previousPause = paused;
      paused = true; input.setEnabled(false); sound.setPaused(true); accumulator = 0;
      onProgress?.(5); publish();
      try {
        if (next.level.id === 2 && !interiorAssets) {
          const loaded = await loadInteriorCharacters((fraction) => { if (!stopped) onProgress?.(Math.round(5 + fraction * 90)); });
          if (stopped) { loaded.dispose(); next.dispose(); return false; }
          interiorAssets = loaded;
        }
        if (next.level.id === 3 && !cemeteryAssets) {
          const loaded = await loadCemeteryCharacters((fraction) => { if (!stopped) onProgress?.(Math.round(5 + fraction * 90)); });
          if (stopped) { loaded.dispose(); next.dispose(); return false; }
          cemeteryAssets = loaded;
        }
        if (next.level.id === 4 && !catacombAssets) {
          const loaded = await loadCatacombCharacters((fraction) => { if (!stopped) onProgress?.(Math.round(5 + fraction * 90)); });
          if (stopped) { loaded.dispose(); next.dispose(); return false; }
          catacombAssets = loaded;
          assets.weapons.crossbow = loaded.crossbowScene;
        }
        clearLevel();
        if (next.level.id !== 2 && interiorAssets) { interiorAssets.dispose(); interiorAssets = null; }
        if (next.level.id !== 3 && cemeteryAssets) { cemeteryAssets.dispose(); cemeteryAssets = null; }
        if (next.level.id !== 4 && catacombAssets) { catacombAssets.dispose(); catacombAssets = null; delete assets.weapons.crossbow; }
        world.dispose(); world = next;
        if (introduce) phase = "level-intro";
        buildLevel(); resetView();
        return true;
      } catch (error) {
        if (world !== next) next.dispose();
        paused = previousPause; input.setEnabled(phase === "game" && !paused && world.status === "playing"); sound.setPaused(paused);
        throw error;
      } finally { loadingLevel = false; if (!stopped) publish(); }
    }
    return {
      setPaused, setPeriod, finishLevelIntro, toggleView, skipOpening: finishOpening,
      answerDialogue() {
        if (!world.answerDialogue()) return;
        paused = false; accumulator = 0; rememberActorTransforms();
        input.setEnabled(world.status === "playing"); sound.setPaused(false);
        for (const event of world.events.splice(0)) sound.play(event, world.player, input.orbit.yaw);
        publish(); canvas.focus();
      },
      resumeDiscovery() {
        if (!discovery) return;
        discovery = null;
        setPaused(false);
        canvas.focus();
      },
      async start(level = 1) {
        if (phase !== "title" || loadingLevel || !LEVELS.some((entry) => entry.id === level)) return false;
        sound.unlock();
        if (level === 1) {
          phase = "level-intro";
          world.restart();
          setPeriod("night");
          resetView();
          return true;
        }
        try { return await replaceWorld(new GameWorld({ level }), { introduce: true }); }
        catch (error) { onError?.(error); return false; }
      },
      async showTitle() {
        if (loadingLevel) return;
        if (phase === "opening") { finishOpening(); return; }
        phase = "title";
        introTime = 0;
        await replaceWorld(new GameWorld());
      },
      exportSave() {
        if (phase !== "game" || loadingLevel) throw new Error("Espera a que termine de cargar la partida.");
        return validateGameSave({ version: 1, savedAt: Date.now(), world: world.serialize(), period, camera: { ...input.orbit } });
      },
      async loadSave(value) {
        if (phase === "opening") finishOpening();
        if (loadingLevel) throw new Error("Hay un nivel cargando.");
        const saved = validateGameSave(value);
        const next = new GameWorld({ level: saved.world.level });
        try { next.restore(saved.world); } catch (error) { next.dispose(); throw error; }
        phase = "game";
        if (!await replaceWorld(next)) return;
        Object.assign(input.orbit, { firstPerson: false, lookPitch: 0 }, saved.camera);
        setPeriod(saved.period);
        setPaused(true);
        updateCamera(0);
        updateCharacters(0);
        sound.unlock();
      },
      setMuted(value) { sound.setMuted(value); if (!value) sound.unlock(); },
      action(kind) { input.action(kind); canvas.focus(); },
      hold(kind, pressed) { input.hold(kind, pressed); },
      move(x, z) { if (phase !== "game" || paused || loadingLevel) return; input.touch.x = x; input.touch.z = z; sound.unlock(); },
      equip(weapon) { input.equip(weapon); canvas.focus(); },
      async nextLevel() {
        const options = world.nextLevelOptions();
        if (!options || loadingLevel) return false;
        try {
          const next = new GameWorld(options);
          return await replaceWorld(next, { introduce: true });
        } catch (error) { onError?.(error); dispose(); return false; }
      },
      restart() {
        if (loadingLevel || phase === "level-intro") return;
        world.restart();
        phase = "level-intro";
        resetView();
      },
      dispose,
      ...(import.meta.env.DEV ? { inspect: () => ({ world, scene, renderer, camera, input, firstPersonView, opening, openingTime, phase }) } : {})
    };
  } catch (error) { dispose(); throw error; }
}
