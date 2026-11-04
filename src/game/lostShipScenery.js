import * as THREE from "three";
import { LOST_SHIP_ASSETS, LOST_SHIP_PROPS } from "./lostShipLayout.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { createVenueSignTexture } from "./venueSignage.js";
import { createLostShipGraphics, applyShipSurfaceUV } from "./lostShipGraphics.js";
import { buildLostShipOrbTrial } from "./lostShipOrbTrial.js";

const MODEL_URLS = {
  shipComputer: new URL("../assets/neonboy-animaciones/computer.ship-optimized.glb", import.meta.url).href,
  shipChair: new URL("../assets/neonboy-animaciones/sillon-nave.ship-optimized.glb", import.meta.url).href,
  hologramPlatform: new URL("../assets/neonboy-animaciones/plataforma.ship-optimized.glb", import.meta.url).href,
  traveler: new URL("../assets/neonboy-animaciones/astronauta-fuxia.glb", import.meta.url).href,
};
const NEBULA_URL = new URL("../assets/environments/sky-space-nebula-v3.png", import.meta.url).href;

export function buildLostShip(scene, { onCombatDamage } = {}) {
  const root = new THREE.Group();
  root.name = "La Nave Perdida / PUERTA 01";
  scene.add(root);
  const obstacles = [], colliders = [], interactions = LOST_SHIP_PROPS.map(item => ({
    id: item.id, label: item.label, x: item.position[0], z: item.position[2], reach: item.reach,
  }));
  const slots = new Map(), geometries = new Map();
  const tex = new THREE.TextureLoader();
  const graphics = createLostShipGraphics(root);
  const nebula = tex.load(NEBULA_URL);
  nebula.colorSpace = THREE.SRGBColorSpace;
  const mat = {
    floor: graphics.materials.floor,
    wall: graphics.materials.wall,
    trim: new THREE.MeshStandardMaterial({ color: 0x222d42, metalness: .72, roughness: .36 }),
    rib: new THREE.MeshStandardMaterial({ color: 0x3e5368, metalness: .72, roughness: .28 }),
    black: new THREE.MeshStandardMaterial({ color: 0x080c19, metalness: .32, roughness: .53 }),
    magenta: new THREE.MeshBasicMaterial({ color: 0xd943b4 }),
    cyan: new THREE.MeshBasicMaterial({ color: 0x4ccad5 }),
    red: new THREE.MeshBasicMaterial({ color: 0xd14458 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xa5b3dc, transparent: true, opacity: .13, roughness: .12, metalness: .2, depthWrite: false }),
    nebula: new THREE.MeshBasicMaterial({ map: nebula, color: 0x8d7fae, side: THREE.DoubleSide }),
  };
  function box(name, w, h, d, x, y, z, material, collision = false, parent = root) {
    const tiled = material === mat.floor || material === mat.wall;
    const key = w + "/" + h + "/" + d + (tiled ? "/surface" : "");
    if (!geometries.has(key)) {
      const geometry = new THREE.BoxGeometry(w, h, d);
      if (tiled) applyShipSurfaceUV(geometry, w, h, d);
      geometries.set(key, geometry);
    }
    const mesh = new THREE.Mesh(geometries.get(key), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = h > .4 && h < 3.7;
    parent.add(mesh);
    if (collision) {
      obstacles.push({ id: name, x, z, hx: w / 2, hz: d / 2 });
      colliders.push(mesh);
    }
    return mesh;
  }
  function wall(name, x, z, w, d) {
    box(name, w, 3.9, d, x, 1.95, z, mat.wall, true);
    box(name + " lower rail", w, .14, d + .1, x, .18, z, mat.rib);
    box(name + " upper rail", w, .14, d + .1, x, 3.75, z, mat.rib);
    graphics.wall(x, z, w, d);
  }
  function floor(name, x, z, w, d) {
    box(name, w, .22, d, x, -.13, z, mat.floor);
    box(name + " ceiling", w, .16, d, x, 4.15, z, mat.trim);
    graphics.deck(x, z, w, d);
  }
  floor("arrival deck", 0, 11, 10, 8);
  floor("central deck", 0, -2, 8, 18);
  floor("reactor deck", -10, -5.5, 12, 9);
  floor("support deck", 10, -5.5, 12, 9);
  floor("bridge deck", 0, -17, 18, 12);
  wall("arrival rear", 0, 15, 10, .36);
  wall("arrival left", -5, 11, .36, 8);
  wall("arrival right", 5, 11, .36, 8);
  wall("arrival front left", -3.35, 7, 3.3, .36);
  wall("arrival front right", 3.35, 7, 3.3, .36);
  wall("central left upper", -4, 3.8, .36, 6.4);
  wall("central left lower", -4, -8.3, .36, 5.4);
  wall("central right upper", 4, 3.8, .36, 6.4);
  wall("central right lower", 4, -8.3, .36, 5.4);
  wall("reactor rear", -10, -10, 12, .36);
  wall("reactor front", -10, -1, 12, .36);
  wall("reactor outer", -16, -5.5, .36, 9);
  wall("reactor inner back", -4, -1.95, .36, 1.9);
  wall("reactor inner front", -4, -5.7, .36, 1.9);
  wall("support rear", 10, -10, 12, .36);
  wall("support front", 10, -1, 12, .36);
  wall("support outer", 16, -5.5, .36, 9);
  wall("support inner back", 4, -1.95, .36, 1.9);
  wall("support inner front", 4, -5.7, .36, 1.9);
  wall("central bridge left", -2.75, -11, 2.5, .36);
  wall("central bridge right", 2.75, -11, 2.5, .36);
  wall("bridge front left", -6.5, -11, 5, .36);
  wall("bridge front right", 6.5, -11, 5, .36);
  wall("bridge left", -9, -17, .36, 12);
  wall("bridge right front", 9, -13.3, .36, 4.6);
  wall("bridge right rear", 9, -21.65, .36, 2.7);
  wall("bridge stern", 0, -23, 18, .36);
  const trial = buildLostShipOrbTrial(root, { box, wall, floor, obstacles, onCombatDamage });
  for (const [label, x, z, facing, width, subtitle] of [
    ["A / CÁMARA DE LLEGADA", 0, 7.22, 0, 2.65],
    ["B / PASILLO CENTRAL", 0, .3, 0, 2.9],
    ["C / REACTOR", -3.72, -3.8, Math.PI / 2, 2.15],
    ["D / ALMACÉN", 3.72, -3.8, -Math.PI / 2, 2.3, "SOPORTE VITAL"],
    ["E / PUENTE DE MANDO", 0, -10.77, 0, 2.8],
  ]) {
    const texture = createVenueSignTexture(label, { aspect: 5, pixelWidth: 512, subtitle, accent: "#b966bb", background: "#0d1828", color: "#f4dfd6" });
    const sign = new THREE.Group();
    sign.name = "ship-wayfinding:" + label;
    sign.position.set(x, 3.22, z);
    sign.rotation.y = facing;
    const faceGeometry = new THREE.PlaneGeometry(width, width / 5);
    const faceMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide, toneMapped: false });
    for (const [rotation, depth] of [[0, .02], [Math.PI, -.02]]) {
      const face = new THREE.Mesh(faceGeometry, faceMaterial);
      face.rotation.y = rotation;
      face.position.z = depth;
      sign.add(face);
    }
    root.add(sign);
  }
  const doorDefinitions = [
    ["arrival", 0, 7, 3.3, .26],
    ["bridge", 0, -11, 3.3, .26],
  ];
  const doors = Object.fromEntries(doorDefinitions.map(([id, x, z, w, d]) => {
    const mesh = box(id + " bulkhead", w, 3.45, d, x, 1.75, z, mat.trim, true);
    graphics.door(mesh, x, z, w, id);
    return [id, { mesh, obstacle: obstacles[obstacles.length - 1] }];
  }));
  // Recessed views use the existing nebula, with their fronts facing into the cabin.
  for (const [name, x, z, turn] of [["arrival", 4.78, 12.4, -Math.PI / 2], ["corridor", 3.78, 1, -Math.PI / 2], ["bridge", 0, -22.72, 0]]) {
    const frame = new THREE.Group();
    frame.position.set(x, 2.15, z);
    frame.rotation.y = turn;
    root.add(frame);
    const width = name === "bridge" ? 8.4 : 2.2;
    const height = name === "bridge" ? 1.75 : 1.25;
    box(name + " window void", width, height, .04, 0, 0, .13, mat.nebula, false, frame);
    box(name + " window glass", width, height, .015, 0, 0, .17, mat.glass, false, frame);
    graphics.windowFrame(frame, width, height);
  }
  for (let z = 5.4; z >= -10; z -= 3.1) {
    box("central overhead rib", 7.8, .22, .28, 0, 3.78, z, mat.rib);
    box("central emergency strip", 1.65, .04, .18, 0, 3.64, z, mat.red);
  }
  function terminal(name, x, z, turn, title, kind, damaged = false, deskOnly = false) {
    const sideways = Math.abs(Math.sin(turn)) > .5;
    const proxy = box(name + " collision", sideways ? .94 : 1.53, 1.66, sideways ? 1.53 : .94,
      x, .83, z, mat.black, true);
    proxy.visible = false;
    graphics.terminal(name, x, z, turn, title, kind, damaged, deskOnly);
  }
  terminal("arrival terminal", 3, 11.5, -Math.PI / 2, "RECEPCION / F09", "system", true);
  terminal("access terminal", 2.3, 7.9, 0, "CONTROL DE ACCESO", "access");
  terminal("corridor display", -2.9, -8.4, Math.PI / 2, "DIAGNOSTICO / 09", "system");
  terminal("distribution rack", -14.15, -3.1, Math.PI / 2, "DISTRIBUCION", "reactor", true);
  terminal("life support", 9.3, -2.5, -Math.PI / 2, "SOPORTE VITAL", "life");
  terminal("navigation", 0, -19.5, 0, "NAVEGACION", "nav", false, true);
  terminal("archive reader", -7.5, -20, Math.PI / 2, "ARCHIVO DIMENSIONAL", "nav");
  box("reactor base", 3.4, .42, 3.4, -11.3, .22, -5.6, mat.trim, true);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.15, 2.3, 16), mat.glass);
  core.position.set(-11.3, 1.55, -5.6);
  root.add(core);
  const coreRing = new THREE.Mesh(new THREE.TorusGeometry(1.37, .12, 8, 28), mat.magenta);
  coreRing.rotation.x = Math.PI / 2;
  coreRing.position.set(-11.3, 1.08, -5.6);
  root.add(coreRing);
  graphics.reactor();
  for (const offset of [-1, 1]) {
    box("reactor support", .21, 2.7, .22, -11.3 + offset * 1.27, 1.55, -5.6, mat.rib);
    box("bridge helm collider", 1.85, .95, 1.25, offset * 3.3, .475, -19.2, mat.trim, true).visible = false;
    graphics.bridgeRack(offset * 3.3, -19.2, offset);
  }
  for (const [x, z] of [[7.7, -7.5], [13.5, -7.3], [13.4, -2.4]]) {
    box("storage cabinet", 1.3, 1.9, .85, x, .95, z, mat.wall, true);
    box("storage cabinet rim", 1.1, .05, .9, x, 1.8, z, mat.cyan);
    graphics.cabinet(x, z, x === 7.7);
  }
  graphics.tablet(-2.8, 11.5, Math.PI / 2, "MANTENIMIENTO / LOG");
  graphics.tablet(-2.9, -2.1, Math.PI / 2, "SEGURIDAD / 09");
  graphics.tablet(-7.1, -2.2, Math.PI, "REGISTRO / REACTOR");
  graphics.tablet(3.7, -16.7, 0, "MEMORIA / ARCHIVO 01");
  graphics.arrivalPad();
  const emergency = new THREE.PointLight(0xe86c69, 10, 17, 2);
  emergency.position.set(0, 3.1, 5);
  root.add(emergency);
  const arrivalLight = new THREE.PointLight(0xb8d5e8, 18, 15, 2);
  arrivalLight.position.set(0, 3.2, 11.3);
  root.add(arrivalLight);
  const bridgeLight = new THREE.PointLight(0xa58de8, 2.5, 19, 2);
  bridgeLight.position.set(0, 3, -18);
  root.add(bridgeLight);
  const reactorLight = new THREE.PointLight(0x78c5de, 1.5, 13, 2);
  reactorLight.position.set(-11, 2.3, -5.5);
  root.add(reactorLight);
  const supportLight = new THREE.PointLight(0xa5c8dc, 4, 13, 2);
  supportLight.position.set(10, 3.4, -5.5);
  root.add(supportLight);
  // One shared shadow map grounds the character and equipment throughout the ship.
  const keyLight = new THREE.DirectionalLight(0xb8cbe1, .75);
  keyLight.position.set(-12, 20, 12);
  keyLight.target.position.set(0, 0, -4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { left: -23, right: 23, top: 26, bottom: -26, near: .5, far: 65 });
  keyLight.shadow.normalBias = .025;
  keyLight.shadow.bias = -.0003;
  root.add(keyLight, keyLight.target);
  const dimensionalPortal = new THREE.Mesh(new THREE.TorusGeometry(1.03, .025, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0xce8dca, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  dimensionalPortal.position.set(0, .045, 13.4);
  dimensionalPortal.rotation.x = -Math.PI / 2;
  root.add(dimensionalPortal);
  const archiveVision = new THREE.Group();
  archiveVision.name = "PUERTA 02 / holograma";
  archiveVision.position.set(-5.7, 1.05, -19.4);
  archiveVision.visible = false;
  root.add(archiveVision);
  const holo = new THREE.MeshBasicMaterial({ color: 0x78dce8, transparent: true, opacity: .73, depthWrite: false });
  const corruption = new THREE.MeshBasicMaterial({ color: 0xb84476, transparent: true, opacity: .48, depthWrite: false });
  box("temple ruins floor", 2.8, .08, 1.65, 0, 0, 0, holo, false, archiveVision);
  for (const side of [-1, 1]) for (const depth of [-.5, .5]) {
    box("hologram column", .13, .8, .13, side * 1.05, .43, depth, holo, false, archiveVision);
    box("hologram capital", .28, .1, .22, side * 1.05, .88, depth, holo, false, archiveVision);
  }
  box("temple lintel", 2.4, .13, .25, 0, .98, -.5, holo, false, archiveVision);
  const templePediment = new THREE.Mesh(new THREE.ConeGeometry(.92, .42, 3), holo);
  templePediment.position.set(0, 1.25, -.5);
  templePediment.rotation.y = Math.PI / 2;
  archiveVision.add(templePediment);
  const infernalShadow = new THREE.Mesh(new THREE.ConeGeometry(.22, .85, 5), corruption);
  infernalShadow.position.set(.16, .45, -.15);
  archiveVision.add(infernalShadow);
  const windowShadow = new THREE.Mesh(new THREE.PlaneGeometry(.46, 1.17), corruption);
  windowShadow.position.set(3.69, 2.05, 1.15);
  windowShadow.rotation.y = -Math.PI / 2;
  windowShadow.visible = false;
  root.add(windowShadow);
  const slotsData = {
    shipComputer: { position: [0, .96, -19.5], width: 1.8, height: 1.2 },
    shipChair: { position: [2.4, 0, -21.2], width: 1.7, height: 1.7 },
    hologramPlatform: { position: [-5.7, 0, -19.4], width: 2.5, height: 1.2 },
    traveler: { position: [6.1, 0, -18.4], width: 1.85, height: 1.85 },
  };
  // Circular floor-level blocker for the physical hologram base.
  const platformObstacle = { id: "hologramPlatform", x: -5.7, z: -19.4, radius: 1.3 };
  obstacles.push(platformObstacle);
  for (const asset of LOST_SHIP_ASSETS) {
    const slot = new THREE.Group();
    slot.name = "lost-ship-slot:" + asset.id;
    root.add(slot);
    slots.set(asset.id, slot);
    if (asset.id !== "traveler") box("placeholder " + asset.id, slotsData[asset.id].width, slotsData[asset.id].height, .75,
      0, slotsData[asset.id].height / 2, 0, mat.trim, false, slot);
    else {
      const ghost = new THREE.Mesh(new THREE.CapsuleGeometry(.35, 1.1, 4, 8), mat.magenta);
      ghost.position.y = .95;
      slot.add(ghost);
    }
  }
  function applyTransform(id, transform) {
    const slot = slots.get(id);
    if (!slot || !transform) return;
    slot.position.fromArray(transform.position);
    slot.rotation.set(...transform.rotation.map(angle => THREE.MathUtils.degToRad(angle)));
    slot.scale.setScalar(transform.scale);
    if (id === "hologramPlatform") {
      platformObstacle.x = slot.position.x;
      platformObstacle.z = slot.position.z;
      platformObstacle.radius = 1.3 * transform.scale;
      archiveVision.position.x = slot.position.x;
      archiveVision.position.z = slot.position.z;
      const archive = interactions.find(item => item.id === "archive");
      archive.x = slot.position.x;
      archive.z = slot.position.z - .6 * transform.scale;
      archive.reach = Math.max(2.7, platformObstacle.radius + .81 - .6 * transform.scale);
    }
    if (id === "traveler") {
      const spot = interactions.find(item => item.id === "traveler");
      spot.x = slot.position.x;
      spot.z = slot.position.z;
      spot.reach = transform.reach || 2.4;
    }
  }
  let travelerMixer = null;
  async function loadAssets(loader, transforms, isAlive) {
    const loaded = [];
    for (const asset of LOST_SHIP_ASSETS) {
      if (!isAlive()) break;
      try {
        const gltf = await loader.loadAsync(MODEL_URLS[asset.id]);
        if (!isAlive()) { disposeObjects([gltf.scene]); break; }
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        if (Math.max(size.x, size.y, size.z) < .001) continue;
        const target = slotsData[asset.id];
        const fit = asset.id === "traveler" ? target.height / Math.max(size.y, .001)
          : Math.min(target.width / Math.max(size.x, .001), target.height / Math.max(size.y, .001), target.width / Math.max(size.z, .001));
        model.scale.setScalar(fit);
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.set(-center.x * fit, -bounds.min.y * fit, -center.z * fit);
        model.traverse(node => { if (node.isMesh) { node.castShadow = asset.id === "traveler"; node.receiveShadow = true; } });
        const slot = slots.get(asset.id);
        slot.clear();
        slot.add(model);
        applyTransform(asset.id, transforms?.[asset.id] || asset);
        if (asset.id === "traveler" && gltf.animations?.length) {
          const source = gltf.animations.find(clip => /talk/i.test(clip.name)) || gltf.animations[0];
          const clip = source.clone();
          const hips = clip.tracks.find(track => /Hips\.position$/.test(track.name));
          if (hips) for (let i = 0; i < hips.values.length; i += 3) {
            hips.values[i] = hips.values[0];
            hips.values[i + 2] = hips.values[2];
          }
          travelerMixer = new THREE.AnimationMixer(model);
          travelerMixer.clipAction(clip).setEffectiveTimeScale(.7).play();
          travelerMixer.update(0);
        }
        loaded.push(asset.id);
      } catch { /* Procedural placeholder stays visible. */ }
    }
    return loaded;
  }
  const audio = (() => {
    let context, drone, gain;
    const start = () => {
      if (context) { if (context.state === "suspended") context.resume().catch(() => {}); return; }
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        context = new AudioContext();
        drone = context.createOscillator();
        gain = context.createGain();
        drone.type = "sine";
        drone.frequency.value = 54;
        gain.gain.value = .004;
        drone.connect(gain).connect(context.destination);
        drone.start();
      } catch { context = null; }
    };
    const knock = () => {
      start();
      if (!context) return;
      const now = context.currentTime, tone = context.createOscillator(), volume = context.createGain();
      tone.type = "triangle";
      tone.frequency.setValueAtTime(175, now);
      tone.frequency.exponentialRampToValueAtTime(65, now + .37);
      volume.gain.setValueAtTime(.0001, now);
      volume.gain.exponentialRampToValueAtTime(.065, now + .014);
      volume.gain.exponentialRampToValueAtTime(.0001, now + .43);
      tone.connect(volume).connect(context.destination);
      tone.start(now); tone.stop(now + .44);
    };
    const scream = () => {
      start();
      if (!context) return;
      const now = context.currentTime, tone = context.createOscillator(), filter = context.createBiquadFilter(), volume = context.createGain();
      tone.type = "sawtooth";
      tone.frequency.setValueAtTime(430, now);
      tone.frequency.exponentialRampToValueAtTime(87, now + .62);
      filter.type = "bandpass";
      filter.frequency.value = 620;
      volume.gain.setValueAtTime(.0001, now);
      volume.gain.linearRampToValueAtTime(.026, now + .05);
      volume.gain.setValueAtTime(.026, now + .42);
      volume.gain.linearRampToValueAtTime(0, now + .64);
      tone.connect(filter).connect(volume).connect(context.destination);
      tone.start(now); tone.stop(now + .65);
    };
    const setPaused = (paused) => { if (gain && context) gain.gain.setTargetAtTime(paused ? 0 : .004, context.currentTime, .08); };
    const dispose = () => {
      try { drone?.stop(); } catch {}
      context?.close().catch(() => {});
      context = null;
    };
    return { start, knock, scream, setPaused, dispose };
  })();
  graphics.finish();
  let previousEffect = null;
  function update(dt, elapsed, progress, paused, effect, player) {
    if (effect && effect !== previousEffect && ["corridor", "bridge"].includes(effect)) audio.knock();
    if (effect === "reactor" && effect !== previousEffect) audio.scream();
    previousEffect = effect;
    if (!paused && travelerMixer) travelerMixer.update(Math.min(dt, .08));
    const powered = Boolean(progress?.powerRestored);
    doors.arrival.mesh.visible = !progress?.accessGranted;
    doors.arrival.obstacle.x = progress?.accessGranted ? 999 : 0;
    doors.bridge.mesh.visible = !progress?.bridgeCardUsed;
    doors.bridge.obstacle.x = progress?.bridgeCardUsed ? 999 : 0;
    bridgeLight.intensity = powered ? 18 : 2.5;
    reactorLight.intensity = powered ? 14 : 1.5;
    supportLight.intensity = powered ? 13 : 4;
    graphics.update(progress, elapsed);
    trial.update(paused ? 0 : dt, elapsed, progress, player || { x: 0, z: 0 });
    emergency.intensity = effect === "corridor" ? .1 : powered ? 6 : 10 + Math.sin(elapsed * 3.5) * 1.3;
    windowShadow.visible = effect === "window";
    archiveVision.visible = Boolean(progress?.archiveRecovered);
    if (!paused && archiveVision.visible) archiveVision.rotation.y += dt * .12;
    coreRing.rotation.z += paused ? 0 : dt * .45;
    coreRing.material = powered ? mat.cyan : mat.red;
    dimensionalPortal.rotation.z += paused ? 0 : dt * .16;
    dimensionalPortal.material.opacity = .52 + Math.sin(elapsed * 2.1) * .16;
    mat.magenta.color.setHex(progress?.navigationRestored ? 0xf173de : 0x9a4a94);
  }
  return { root, obstacles, colliders, interactions, slots, trial, applyTransform, loadAssets, update,
    stopAnimations: () => travelerMixer?.stopAllAction(), audio };
}
