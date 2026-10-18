// Cinematica 3D original conservada para reutilizarla. La apertura activa usa intro.mp4.
import * as THREE from "three";
import { createGameCharacter, disposeObjects } from "./gameCharacters.js";
import { createWeaponModel } from "./gameWeapons.js";
import { ATTACKS } from "./gameRules.js";
import { createPanoramaBackdrop } from "../editors/panoramaBackdrop.js";
import { CINEMATIC_PRESETS, DEFAULT_CINEMATIC_CAMERA, frameCinematicSubjects } from "../editors/cinematicCamera.js";

export const OPENING_DURATION = 12;
const FINISHER = 7.4, THUNDER = 9.7;
const SHOTS = [
  { id: "establish", start: 0, end: 1.4 },
  { id: "villain", start: 1.4, end: 2.35 },
  { id: "shoulder", start: 2.35, end: 3.6 },
  { id: "tracking", start: 3.6, end: 5.35 },
  { id: "high", start: 5.35, end: 6.5 },
  { id: "finisher", start: 6.5, end: 8.65 },
  { id: "hero", start: 8.65, end: OPENING_DURATION }
];
const HITS = [
  { time: 2.1, type: "metal", x: 0.1, y: 2.05 },
  { time: 4.24, type: "heavy", x: 0.65, y: 1.7 },
  { time: 4.95, type: "metal", x: 0, y: 2 },
  { time: FINISHER, type: "heavy", x: 0.8, y: 1.65 }
];
const smooth = (start, end, time) => THREE.MathUtils.smoothstep(time, start, end);
const pulse = (start, peak, end, time) => smooth(start, peak, time) * (1 - smooth(peak, end, time));
const attackAt = (kind, time, start, rate = 1) => time >= start && (time - start) * rate < ATTACKS[kind].duration
  ? { kind, elapsed: (time - start) * rate, side: "Right", variant: 0 } : null;

export function openingChoreography(time) {
  const t = THREE.MathUtils.clamp(time, 0, OPENING_DURATION);
  const finish = smooth(FINISHER, 8.4, t), raise = smooth(8.65, 9.55, t);
  const circle = Math.sin(smooth(5.1, 6.6, t) * Math.PI);
  const approach = smooth(0.3, 1.4, t);
  const heroX = -1.9 + approach * 0.95 - pulse(2.7, 3.1, 3.6, t) * 0.38 - circle * 0.25 + smooth(6.5, 7.3, t) * 0.3;
  const demonX = 1.6 - approach * 0.5 + pulse(4.24, 4.45, 4.8, t) * 0.25 + finish * 1.2;
  const heroZ = circle * 0.45, demonZ = -circle * 0.35;
  const facing = Math.atan2(demonX - heroX, demonZ - heroZ);
  const shot = SHOTS.find((entry) => t < entry.end) || SHOTS.at(-1);
  const common = { y: 0.09, health: 100, maxHealth: 100, grounded: true, active: true,
    speed: 0, running: false, velocityY: 0, landing: 0, combat: 0, stun: 0, invulnerable: 0, presentation: true };
  return {
    hero: { ...common, id: "opening-neonboy", x: heroX, z: heroZ,
      yaw: facing * (1 - smooth(8.1, 8.8, t)), equipped: "hammer",
      speed: t > 0.3 && t < 1.4 ? 1 : t > 5.1 && t < 6.5 ? 0.8 : 0,
      attack: attackAt("hammer", t, 3.6) || attackAt("hammer", t, 6.6, 0.8),
      cinematic: { block: pulse(1.65, 2.05, 2.4, t) + pulse(4.65, 4.95, 5.25, t),
        dodge: pulse(2.7, 3, 3.55, t), raise } },
    demon: { ...common, id: "opening-demon", x: demonX, z: demonZ,
      yaw: facing - Math.PI, equipped: "sword", speed: t > 0.3 && t < 1.4 ? 0.7 : t > 5.1 && t < 6.5 ? 0.6 : 0,
      attack: attackAt("sword", t, 1.85) || attackAt("sword", t, 2.75) || attackAt("sword", t, 4.7),
      health: t >= FINISHER ? 0 : 100,
      // Keep the fallen opponent in the victory shot through the final fade.
      deadTime: t >= FINISHER ? Math.min(2.3, Math.max(0.001, t - FINISHER) * 0.7) : 0,
      cinematic: { dodge: pulse(4.24, 4.45, 4.8, t) * 0.85 } },
    raised: raise, defeated: t >= FINISHER,
    flash: t < THUNDER ? 0 : Math.exp(-(t - THUNDER) * 18) + (t < THUNDER + 0.15 ? 0 : 0.65 * Math.exp(-(t - THUNDER - 0.15) * 16)),
    fade: smooth(11.35, OPENING_DURATION, t), shot: shot.id, shotProgress: smooth(shot.start, shot.end, t)
  };
}

export async function createGameOpening(assets, environment) {
  const loader = new THREE.TextureLoader();
  const loaded = await Promise.allSettled([
    loader.loadAsync(new URL("../assets/environments/sky-infernal-sharp.png", import.meta.url).href),
    loader.loadAsync(new URL("../assets/environments/infernal-floor-texture.png", import.meta.url).href),
    loader.loadAsync(new URL("../assets/environments/volcanic-black-earth-v1.png", import.meta.url).href)
  ]);
  const failure = loaded.find((result) => result.status === "rejected");
  if (failure) { loaded.forEach((result) => { if (result.status === "fulfilled") result.value.dispose(); }); throw failure.reason; }
  const [skyTexture, floorTexture, rockTexture] = loaded.map((result) => result.value);
  skyTexture.colorSpace = floorTexture.colorSpace = rockTexture.colorSpace = THREE.SRGBColorSpace;
  rockTexture.wrapS = rockTexture.wrapT = THREE.RepeatWrapping; rockTexture.anisotropy = 8;
  const rockRelief = rockTexture.clone(); rockRelief.colorSpace = THREE.NoColorSpace;
  rockRelief.repeat.set(2.5, 2.5);
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; floorTexture.repeat.set(14, 14);
  floorTexture.anisotropy = 8;
  const scene = new THREE.Scene(); scene.name = "Duelo infernal";
  scene.environment = environment; scene.environmentIntensity = 0.7;
  scene.background = new THREE.Color(0x230605); scene.fog = new THREE.Fog(0x35100b, 18, 65);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.08, 250);
  const panorama = createPanoramaBackdrop({ name: "Panorama infernal", horizontalRepeat: 2.7,
    horizontalMirror: true, horizonCompression: 2.5 });
  panorama.userData.setTexture(skyTexture, 0.68); scene.add(panorama);
  const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, bumpMap: floorTexture,
    bumpScale: 0.13, roughness: 0.94, color: 0x8b6555, emissive: 0xff4a17, emissiveMap: floorTexture, emissiveIntensity: 0.58 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), floorMaterial);
  floor.name = "Lava infernal"; floor.rotation.x = -Math.PI / 2; floor.position.y = -0.08; floor.receiveShadow = true; scene.add(floor);
  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0xc9c1c7, roughness: 0.94,
    map: rockTexture, bumpMap: rockRelief, bumpScale: 0.22, metalness: 0.06 });
  rockMaterial.name = "Basalto volcanico rugoso";
  const arenaGeometry = new THREE.CylinderGeometry(5.4, 5.7, 0.2, 64);
  const arenaUv = arenaGeometry.attributes.uv, arenaVertex = new THREE.Vector3();
  for (let i = 0; i < arenaUv.count; i++) {
    arenaVertex.fromBufferAttribute(arenaGeometry.attributes.position, i);
    arenaUv.setXY(i, arenaVertex.x / 3, arenaVertex.z / 3);
  }
  const arena = new THREE.Mesh(arenaGeometry, rockMaterial);
  arena.name = "Arena de obsidiana"; arena.position.y = -0.03; arena.receiveShadow = true; scene.add(arena);
  const hemi = new THREE.HemisphereLight(0xd4c0f0, 0xa72a0d, 1.15); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffd6bd, 3.8); key.position.set(-3, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = key.shadow.camera.bottom = -8;
  key.shadow.camera.right = key.shadow.camera.top = 8; key.shadow.bias = -0.0008; scene.add(key);
  const rim = new THREE.DirectionalLight(0xff4a17, 4.8); rim.position.set(3, 4, -5); scene.add(rim);
  const fill = new THREE.PointLight(0x9d70ff, 28, 14, 2); fill.position.set(-3, 2.8, 2); scene.add(fill);
  const thunderLight = new THREE.PointLight(0xdde6ff, 0, 24, 2); scene.add(thunderLight);

  const hero = createGameCharacter(assets.player);
  const demon = createGameCharacter({ ...assets.templeBoss, weaponScene: assets.weapons.sword, weaponKind: "sword" }, true, { boss: true });
  hero.root.name = "Neonboy cinematica"; demon.root.name = "Demonio final cinematica"; scene.add(hero.root, demon.root);
  const droppedSword = createWeaponModel("sword", assets.weapons.sword); droppedSword.name = "Espada caida";
  droppedSword.visible = false; scene.add(droppedSword);
  const hammer = hero.root.getObjectByName("Arma hammer");
  const hammerBounds = new THREE.Box3(), hammerHead = new THREE.Vector3();

  const bolt = new THREE.Group(); bolt.name = "Rayo al martillo"; scene.add(bolt);
  const boltCore = new THREE.MeshBasicMaterial({ color: 0xeff5ff, toneMapped: false });
  const boltGlow = new THREE.MeshBasicMaterial({ color: 0x9a79ff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const boltPoints = [[0, 0, 0], [0.25, 0.65, 0], [-0.22, 1.25, 0.08], [0.42, 1.85, 0], [-0.35, 2.5, -0.1], [0.5, 3.3, 0], [-0.3, 4.5, 0.15], [0.6, 6.1, 0], [-0.5, 8, 0], [0.2, 13, 0]];
  const curve = new THREE.CurvePath();
  for (let i = 1; i < boltPoints.length; i++) curve.add(new THREE.LineCurve3(new THREE.Vector3(...boltPoints[i - 1]), new THREE.Vector3(...boltPoints[i])));
  bolt.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.018, 5, false), boltCore),
    new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.06, 5, false), boltGlow));
  const branchCurve = new THREE.CurvePath();
  [[[-0.22, 1.25, 0.08], [-0.9, 1.7, 0]], [[-0.9, 1.7, 0], [-0.65, 2.1, 0]], [[-0.65, 2.1, 0], [-1.5, 2.8, 0]]]
    .forEach(([a, b]) => branchCurve.add(new THREE.LineCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b))));
  bolt.add(new THREE.Mesh(new THREE.TubeGeometry(branchCurve, 12, 0.015, 4, false), boltCore));

  const emberPositions = new Float32Array(180 * 3);
  const emberGeometry = new THREE.BufferGeometry(); emberGeometry.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));
  const embers = new THREE.Points(emberGeometry, new THREE.PointsMaterial({ color: 0xff9b32, size: 0.035, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }));
  embers.name = "Brasas de la intro"; scene.add(embers);
  const sparkPositions = new Float32Array(36 * 3);
  const sparkGeometry = new THREE.BufferGeometry(); sparkGeometry.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
  const sparks = new THREE.Points(sparkGeometry, new THREE.PointsMaterial({ color: 0xffe2aa, size: 0.065, transparent: true, opacity: 1, depthWrite: false, toneMapped: false }));
  sparks.name = "Chispas del combate"; sparks.frustumCulled = false; scene.add(sparks);
  const shockwave = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 64),
    new THREE.MeshBasicMaterial({ color: 0xcbb0ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  shockwave.rotation.x = -Math.PI / 2; shockwave.position.set(-0.6, 0.1, 0); scene.add(shockwave);

  const proxyGeometry = new THREE.BoxGeometry(1, 1, 1), proxyMaterial = new THREE.MeshBasicMaterial();
  const heroFrame = new THREE.Mesh(proxyGeometry, proxyMaterial);
  const demonFrame = new THREE.Mesh(proxyGeometry, proxyMaterial);
  const victoryFrame = new THREE.Mesh(proxyGeometry, proxyMaterial);
  victoryFrame.scale.set(1.7, 3.5, 1.2); victoryFrame.position.set(-0.65, 1.75, 0);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cameraPaths = new Map();
  let aspect = 0, previousTime = -0.001, disposed = false;
  const battle = CINEMATIC_PRESETS.find((preset) => preset.id === "battle");
  const heroic = CINEMATIC_PRESETS.find((preset) => preset.id === "epic-hero");
  const villain = CINEMATIC_PRESETS.find((preset) => preset.id === "villain");
  const cues = [{ time: 0.25, type: "boss" }, { time: 1.88, type: "sword" },
    { time: 2.8, type: "sword" }, { time: 3.8, type: "hammer" }, { time: 4.75, type: "sword" },
    { time: 7, type: "hammer" }, { time: 7.8, type: "defeat" }, { time: THUNDER, type: "thunder" }, ...HITS];
  function frameCamera() {
    // Each take has its own lens and a small dolly/orbit, with deliberate cuts on action.
    for (const shot of SHOTS) {
      const actorPose = openingChoreography((shot.start + shot.end) / 2);
      heroFrame.scale.set(0.95, 1.95, 0.8); heroFrame.position.set(actorPose.hero.x, 1.05, actorPose.hero.z);
      demonFrame.scale.set(2, 3.8, 1.5); demonFrame.position.set(actorPose.demon.x, 1.95, actorPose.demon.z);
      heroFrame.rotation.y = 0; demonFrame.rotation.y = shot.id === "villain" ? actorPose.demon.yaw : 0;
      let subjects = [heroFrame, demonFrame], settings, endSettings;
      switch (shot.id) {
        case "establish":
          settings = { ...battle, shot: "two", lens: 30, azimuth: 8, elevation: 12, distance: 1.13 };
          endSettings = { azimuth: -4, elevation: 3, distance: 1.02 }; break;
        case "villain":
          subjects = [demonFrame];
          settings = { ...villain, shot: "medium-close", lens: 58, azimuth: -28, elevation: -8, distance: 1.06, roll: -3 };
          endSettings = { azimuth: -19, distance: 0.98 }; break;
        case "shoulder":
          // Hero's shoulder in the foreground, sword-bearing demon in the reverse field.
          settings = { shot: "ots", lens: aspect < 0.8 ? 25 : 28, lookAt: "chest", distance: 1.65, height: 0.1 };
          endSettings = { distance: 1.45, height: 0.14 }; break;
        case "tracking":
          settings = { ...battle, shot: "two", lens: 36, azimuth: -28, elevation: 2, distance: 0.96, roll: -3 };
          endSettings = { azimuth: 18, elevation: 7, distance: 0.94, roll: 2 }; break;
        case "high":
          settings = { shot: "two", lens: 30, azimuth: 24, elevation: 53, distance: 0.94 };
          endSettings = { azimuth: 40, elevation: 42, distance: 0.9 }; break;
        case "finisher":
          settings = { ...battle, shot: "two", lens: 32, azimuth: -13, elevation: -6, distance: 0.92, roll: -4 };
          endSettings = { azimuth: 6, elevation: -9, distance: 0.86, roll: 0 }; break;
        default:
          subjects = [victoryFrame];
          settings = { ...heroic, shot: "full", lookAt: "center", lens: 32, azimuth: -23, elevation: -11, distance: 1.15 };
          endSettings = { azimuth: -9, elevation: -8, distance: 1.04 }; break;
      }
      const config = { ...DEFAULT_CINEMATIC_CAMERA, ...settings, composition: 0 };
      if (reducedMotion) { config.roll = 0; endSettings = {}; }
      cameraPaths.set(shot.id, [frameCinematicSubjects(subjects, camera, config),
        frameCinematicSubjects(subjects, camera, { ...config, ...endSettings })]);
    }
  }
  return {
    scene, camera, hero, demon, state: null,
    resize(nextAspect) { camera.aspect = nextAspect; camera.updateProjectionMatrix(); aspect = nextAspect; frameCamera(); },
    update(time, dt) {
      if (disposed) return [];
      const state = openingChoreography(time); this.state = state;
      if (!aspect) this.resize(1);
      hero.update(state.hero, dt, camera, time); demon.update(state.demon, dt, camera, time);
      const drop = smooth(FINISHER, 8.2, time);
      droppedSword.visible = state.defeated;
      droppedSword.position.set(1.8 + drop * 1.3, 0.16 + (1 - drop) * 1.1, 0.6);
      droppedSword.rotation.set(0.2, -0.6 + drop * 2, -drop * Math.PI / 2);
      const [from, to] = cameraPaths.get(state.shot), travel = reducedMotion ? 0 : state.shotProgress;
      camera.fov = THREE.MathUtils.lerp(from.fov, to.fov, travel); camera.updateProjectionMatrix();
      camera.position.lerpVectors(from.position, to.position, travel); camera.quaternion.slerpQuaternions(from.quaternion, to.quaternion, travel);
      const impact = HITS.reduce((strength, hit) => Math.max(strength, 1 - Math.abs(time - hit.time) / 0.14), 0);
      if (!reducedMotion) camera.position.x += Math.sin(time * 95) * (impact * 0.055 + state.flash * 0.035);
      scene.updateMatrixWorld(true);
      hammerBounds.setFromObject(hammer); hammerBounds.getCenter(hammerHead); hammerHead.y = hammerBounds.max.y;
      bolt.position.copy(hammerHead); bolt.visible = state.flash > 0.035;
      thunderLight.position.copy(hammerHead); thunderLight.intensity = state.flash * (reducedMotion ? 28 : 95);
      hemi.intensity = 1.15 + state.flash * (reducedMotion ? 0.25 : 1.4);
      floorMaterial.emissiveIntensity = 0.55 + Math.sin(time * 1.7) * 0.07;
      for (let i = 0; i < 180; i++) {
        const angle = i * 2.39996, radius = 2.8 + i % 13;
        emberPositions.set([Math.cos(angle) * radius + Math.sin(time + i) * 0.2,
          (i * 0.37 + time * (0.4 + i % 4 * 0.1)) % 9, Math.sin(angle) * radius], i * 3);
      }
      emberGeometry.attributes.position.needsUpdate = true;
      const hit = HITS.findLast((entry) => time >= entry.time), age = hit ? time - hit.time : -1;
      sparks.visible = age >= 0 && age < 0.45;
      if (sparks.visible) {
        sparks.material.opacity = 1 - age / 0.45;
        for (let i = 0; i < 36; i++) sparkPositions.set([hit.x + Math.cos(i * 2.4) * age * 3,
          hit.y + Math.sin(i * 1.7) * age * 2 - age * age * 4, Math.sin(i * 2.4) * age * 3], i * 3);
        sparkGeometry.attributes.position.needsUpdate = true;
      }
      const wave = smooth(THUNDER, THUNDER + 0.8, time); shockwave.visible = time >= THUNDER;
      shockwave.scale.setScalar(0.5 + wave * 4.5); shockwave.material.opacity = (1 - wave) * 0.55;
      const events = cues.filter((cue) => cue.time > previousTime && cue.time <= time);
      previousTime = time;
      return events;
    },
    dispose() {
      if (disposed) return; disposed = true;
      hero.root.removeFromParent(); demon.root.removeFromParent(); hero.dispose(); demon.dispose();
      proxyGeometry.dispose(); proxyMaterial.dispose(); skyTexture.dispose();
      disposeObjects([scene]); scene.clear();
    }
  };
}
