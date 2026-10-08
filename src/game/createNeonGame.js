import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createParthenonSet, PARTHENON_PERIODS } from "../editors/parthenonSet.js";
import { BOUNDS, FIXED_STEP } from "./gameRules.js";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { createGameCharacter, disposeObjects, loadGameCharacters } from "./gameCharacters.js";
import { createGameInput } from "./gameInput.js";

function createSound() {
  let context, muted = false;
  const unlock = () => {
    if (muted) return;
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === "suspended") context.resume().catch(() => {});
    } catch { /* Audio is optional when the device cannot provide a context. */ }
  };
  return {
    unlock,
    setMuted(value) { muted = value; },
    play(kind) {
      if (muted || context?.state !== "running") return;
      const tones = { coin: [850, 1400, 0.12], hit: [130, 45, 0.1], defeat: [180, 45, 0.22], jump: [240, 390, 0.11], attack: [190, 65, 0.07] };
      const tone = tones[kind];
      if (!tone) return;
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = kind === "coin" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(tone[0], context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(tone[1], context.currentTime + tone[2]);
      gain.gain.setValueAtTime(0.045, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + tone[2]);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + tone[2]);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    },
    dispose() { context?.close().catch(() => {}); }
  };
}

function createCoins(scene, world) {
  const material = new THREE.MeshStandardMaterial({ color: 0xffcd50, metalness: 0.8, roughness: 0.25, emissive: 0x9c5a09, emissiveIntensity: 0.24 });
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xffe7a0, metalness: 0.8, roughness: 0.25 });
  const disk = new THREE.CylinderGeometry(0.23, 0.23, 0.07, 24);
  disk.rotateX(Math.PI / 2);
  const rim = new THREE.TorusGeometry(0.19, 0.012, 6, 24);
  const stamp = new THREE.OctahedronGeometry(0.09);
  return world.coins.map((coin) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(disk, material);
    body.castShadow = true;
    group.add(body);
    for (const side of [-1, 1]) {
      const border = new THREE.Mesh(rim, rimMaterial);
      border.position.z = side * 0.038;
      group.add(border);
    }
    const emblem = new THREE.Mesh(stamp, rimMaterial);
    emblem.scale.z = 0.5;
    group.add(emblem);
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
      const color = new THREE.Color(event.type === "coin" ? 0xffda5c : 0x78efca);
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
  const resources = await Promise.allSettled([initializePhysics(), loadGameCharacters((value) => {
    if (!signal.aborted) onProgress?.(Math.round(15 + value * 70));
  })]);
  const failed = resources.find((result) => result.status === "rejected");
  const assets = resources[1].status === "fulfilled" ? resources[1].value : null;
  if (failed || signal.aborted) {
    assets?.dispose();
    if (failed && !signal.aborted) throw failed.reason;
    return null;
  }
  let world, renderer, scene, environment, input, observer, raf, stopped = false;
  const characters = [];
  const sound = createSound();
  function dispose() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    observer?.disconnect();
    input?.dispose();
    sound.dispose();
    characters.forEach((character) => character.dispose());
    if (scene) disposeObjects([scene]);
    assets.dispose();
    environment?.dispose();
    world?.dispose();
    renderer?.dispose();
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
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
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
    const temple = createParthenonSet();
    scene.add(temple);
    const ambient = new THREE.HemisphereLight(0xc5dcf4, 0x827563, 1.1);
    scene.add(ambient);
    createPerimeter(scene);
    const coins = createCoins(scene, world);
    const particles = createParticles(scene);
    for (const actor of world.actors) {
      const character = createGameCharacter(actor === world.player ? assets.player : assets.enemy, actor !== world.player);
      scene.add(character.root);
      characters.push(character);
    }
    let paused = false, period = "day", previous = 0, accumulator = 0, lastHud = 0;
    let cameraInitialized = false;
    const focus = new THREE.Vector3(), desiredFocus = new THREE.Vector3(), direction = new THREE.Vector3(), desiredCamera = new THREE.Vector3();
    const publish = () => onChange?.({ ...world.snapshot(), paused, period });
    function setPaused(value = !paused) {
      if (world.status !== "playing") return;
      paused = value;
      input?.setEnabled(!paused);
      accumulator = 0;
      publish();
    }
    input = createGameInput(canvas, setPaused, sound.unlock);
    function setPeriod(next) {
      const mode = PARTHENON_PERIODS.find((entry) => entry.id === next) || PARTHENON_PERIODS[0];
      period = mode.id;
      temple.userData.animate(true, { period }, world.time * 1000);
      ambient.color.set(mode.skyLight);
      ambient.groundColor.set(mode.ground);
      ambient.intensity = period === "night" ? 0.55 : 1.1;
      scene.environmentIntensity = period === "night" ? 0.2 : 0.3;
      scene.fog = temple.userData.atmosphere;
      renderer.toneMappingExposure = period === "night" ? 1.35 : 1.1;
      publish();
    }
    setPeriod("day");
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    function updateCamera(dt) {
      const player = world.player;
      desiredFocus.set(player.x, player.y + 1.05, player.z);
      if (!cameraInitialized) focus.copy(desiredFocus);
      else focus.lerp(desiredFocus, 1 - Math.exp(-12 * dt));
      const orbit = input.orbit;
      direction.set(Math.sin(orbit.yaw) * Math.cos(orbit.pitch), Math.sin(orbit.pitch), Math.cos(orbit.yaw) * Math.cos(orbit.pitch));
      const distance = world.cameraDistance(focus, direction, orbit.distance);
      desiredCamera.copy(focus).addScaledVector(direction, distance);
      camera.position.copy(desiredCamera);
      camera.lookAt(focus);
      cameraInitialized = true;
    }
    function frame(timestamp) {
      if (stopped) return;
      try {
        const dt = previous ? Math.min((timestamp - previous) / 1000, 0.1) : FIXED_STEP;
        previous = timestamp;
        if (!paused && world.status === "playing") {
          accumulator += dt;
          while (accumulator >= FIXED_STEP) {
            world.step(input.read(FIXED_STEP));
            accumulator -= FIXED_STEP;
          }
          const events = world.events.splice(0);
          for (const event of events) {
            if (event.type !== "attack" || event.actor === "neonboy") sound.play(event.type);
            if (["coin", "hit", "defeat"].includes(event.type)) particles.emit(event);
          }
          if (world.status !== "playing") { input.setEnabled(false); publish(); }
        }
        const visualDt = paused ? 0 : dt;
        updateCamera(dt);
        characters.forEach((character, index) => character.update(world.actors[index], visualDt, camera, world.time));
        coins.forEach((mesh, index) => {
          const coin = world.coins[index];
          mesh.visible = !coin.collected;
          mesh.position.set(coin.x, coin.y + 0.8 + Math.sin(world.time * 2.8 + index) * 0.12, coin.z);
          mesh.rotation.y = world.time * 1.7 + index;
        });
        temple.userData.animate(true, { period }, world.time * 1000);
        particles.update(visualDt);
        renderer.render(scene, camera);
        if (timestamp - lastHud > 100) { publish(); lastHud = timestamp; }
        raf = requestAnimationFrame(frame);
      } catch (error) { onError?.(error); dispose(); }
    }
    signal.addEventListener("abort", dispose, { once: true });
    canvas.addEventListener("webglcontextlost", contextLost);
    updateCamera(FIXED_STEP);
    characters.forEach((character, index) => character.update(world.actors[index], 0, camera, 0));
    renderer.render(scene, camera);
    onProgress?.(100);
    publish();
    raf = requestAnimationFrame(frame);
    return {
      setPaused, setPeriod,
      setMuted(value) { sound.setMuted(value); if (!value) sound.unlock(); },
      action(kind) { input.action(kind); canvas.focus(); },
      hold(kind, pressed) { input.hold(kind, pressed); },
      move(x, z) { input.touch.x = x; input.touch.z = z; sound.unlock(); },
      restart() {
        world.restart();
        input.clear();
        input.setEnabled(true);
        Object.assign(input.orbit, { yaw: 0.15, pitch: 0.26, distance: 7.5 });
        paused = false;
        accumulator = 0;
        cameraInitialized = false;
        particles.clear();
        publish();
        canvas.focus();
      },
      dispose,
      ...(import.meta.env.DEV ? { inspect: () => ({ world, scene, renderer, camera, input }) } : {})
    };
  } catch (error) { dispose(); throw error; }
}
