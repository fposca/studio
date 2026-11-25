import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import redCarUrl from "../assets/neonboy-animaciones/auto-volador-renault-fuego.game.glb?url";
import yellowCarUrl from "../assets/neonboy-animaciones/auto-volador-amarrillo.game.glb?url";
import newCarUrl from "../assets/neonboy-animaciones/bsas/auto-volador.game.glb?url";
import { disposeObjects } from "./disposeGameObjects.js";
import { BUENOS_AIRES_FLIGHT_ROUTES } from "./buenosAiresLayout.js";
import { createFuegoArt } from "./buenosAiresFuegoArt.js";

const MODELS = { "renault-fuego": redCarUrl, "yellow-tesla": yellowCarUrl, "new-flyer": newCarUrl };
const CAR_SCALE = 1.9; // Uniform scale preserves the original Meshy proportions.
// The GLB's quantized bounds, after its node scale and CAR_SCALE, are about
// 3.6 m long, 2.2 m wide and 1.6 m tall. Its wheel bottom is near local Y=-.8.
const FUEGO_THRUSTER_Y = -.56;
const FUEGO_GLOW_Y = -.78;
const TRAIL_POINTS = 8;

export function createBuenosAiresFlyingVehicles(parent, { onEvent, tier = "high", glowMap, occluders = [], codeVision } = {}) {
  const root = new THREE.Group(); root.name = "Buenos Aires / autos voladores Meshy"; parent.add(root);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const pulseGeometry = new THREE.SphereGeometry(.13, 8, 6);
  const glowMaterial = new THREE.SpriteMaterial({ map: glowMap, color: 0x69dfff,
    transparent: true, opacity: .2, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  let age = 0, disposed = false, currentTier = tier, yellowReported = false, synchronization = false, timeScale = 1, trafficPulse = 0;
  let escapeRequested = false, escapeStage = 0, escapeReady = false;
  let flightClaimed = false;
  let startupAge = 0, powerKnown = false, wasPowered = false, ignitionReported = false;
  const fuegoArt = createFuegoArt();
  const fuegoSystems = fuegoArt.createVehicleSystems({
    dashboardPosition: [0, .84, .35],
    navigationPosition: [-1.11, .20, .35],
    thrusterY: FUEGO_THRUSTER_Y,
    headlightZ: 1.83,
  });
  // The roof and near-side window face the sidewalk camera at the parking spot.
  fuegoSystems.getObjectByName("Tablero encendido").rotation.x = -Math.PI / 2;
  fuegoSystems.getObjectByName("Navegacion independiente").rotation.y = -Math.PI / 2;
  fuegoSystems.getObjectByName("Faros / sistema operativo").children.forEach(part => {
    if (part.isMesh) part.position.y = -.12;
  });
  const escapeInteraction = { id: "ba-escape-fuego", label: "Revisar veh\u00edculo / Renault Fuego", x: -6, z: 26.5, reach: 0 };
  const escapeWaypoint = new THREE.Vector3(), escapeParking = new THREE.Vector3(-6,.88,23);
  const projected = new THREE.Vector3(), sample = new THREE.Vector3(), tangent = new THREE.Vector3();
  const nextTangent = new THREE.Vector3(), sightDirection = new THREE.Vector3();
  const sightRay = new THREE.Raycaster();

  const vehicles = BUENOS_AIRES_FLIGHT_ROUTES.map(route => {
    const curve = new THREE.CatmullRomCurve3(route.points.map(point => new THREE.Vector3(...point)), true, "centripetal");
    curve.arcLengthDivisions = 256;
    const length = curve.getLength(), duration = length / route.speed;
    const group = new THREE.Group(); group.name = `Auto volador / ${route.id}`;
    group.visible = false; root.add(group);
    if (route.id === "renault-fuego") group.add(fuegoSystems);
    const modelPivot = new THREE.Group(); modelPivot.rotation.y = Math.PI / 2;
    modelPivot.scale.setScalar(CAR_SCALE); group.add(modelPivot);
    const yellow = route.id === "yellow-tesla";
    // A short-range, shadowless fill reveals the original metallic paint at night.
    // It only contributes while this car's group is active.
    const paintFill = new THREE.PointLight(yellow ? 0xf1f7ff : 0xffe6d6, 28, 7, 2);
    paintFill.position.set(0, 2.1, 0); paintFill.castShadow = false; group.add(paintFill);
    const pulseMaterial = new THREE.MeshBasicMaterial({ color: yellow ? 0x8cecff : 0x68d8f5,
      transparent: true, opacity: .58, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const pulses = [], halos = [];
    for (const x of [-.65, .65]) {
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.position.set(x, route.id === "renault-fuego" ? FUEGO_GLOW_Y : -1.72, .55); pulse.scale.set(1.4, .22, 1.7);
      pulse.userData.cityKeep = true; // Static city batching must not detach moving engines.
      group.add(pulse); pulses.push(pulse);
      const halo = new THREE.Sprite(glowMaterial);
      halo.position.set(x, route.id === "renault-fuego" ? FUEGO_GLOW_Y - .06 : -1.78, .55); halo.scale.set(1.25, 1.25, 1);
      group.add(halo); halos.push(halo);
    }
    let trail, trailPositions;
    if (yellow) {
      const geometry = new THREE.BufferGeometry(), colors = [];
      trailPositions = new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3).setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute("position", trailPositions);
      for (let i = 0; i < TRAIL_POINTS; i++) {
        const light = (1 - i / (TRAIL_POINTS - 1)) ** 1.7;
        colors.push(.35 * light, .9 * light, light);
      }
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      trail = new THREE.Line(geometry, new THREE.LineBasicMaterial({ vertexColors: true,
        transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      trail.name = "Tesla amarillo / estela corta"; trail.frustumCulled = false; trail.visible = false;
      root.add(trail);
    }
    return { route, curve, length, duration, group, modelPivot, pulses, halos, trail, trailPositions, loaded: false };
  });

  const fuegoVehicle = vehicles.find(vehicle => vehicle.route.id === "renault-fuego");

  const ready = Promise.allSettled(vehicles.map(async vehicle => {
    try {
      const asset = await loader.loadAsync(MODELS[vehicle.route.id]);
      if (disposed) { disposeObjects([asset.scene]); return; }
      asset.scene.traverse(object => { if (object.isMesh) object.castShadow = false; });
      vehicle.modelPivot.add(asset.scene);
      codeVision?.register(asset.scene, "dynamic");
      vehicle.loadedAt = age;
      vehicle.loaded = true;
    } catch (error) {
      if (!disposed) console.warn(`No se pudo cargar ${vehicle.route.id}:`, error);
    }
  }));

  function update(dt, player, camera, progress, paused) {
    if (disposed) return;
    const powered = !!progress?.fuegoPowered;
    escapeInteraction.label = progress?.fuegoRecordShown && progress?.fuegoKeyInstalled && progress?.fuegoPowerCellInstalled && progress?.fuegoNavigationModuleInstalled ? progress?.completed ? "Repetir fuga / Renault Fuego" : "Iniciar sistema de vuelo" : "Revisar veh\u00edculo / Renault Fuego";
    const powerChanged = powered !== wasPowered;
    let justRestored = false;
    fuegoSystems.userData.setState({
      keyInstalled: !!progress?.fuegoKeyInstalled,
      powerInstalled: !!progress?.fuegoPowerCellInstalled,
      navigationInstalled: !!progress?.fuegoNavigationModuleInstalled,
      powered,
    });
    // Restore the parked car immediately, including during a paused or dt=0 update.
    if (escapeRequested && escapeStage === 0 && progress?.fuegoStarted) {
      fuegoVehicle.group.position.copy(escapeParking);
      fuegoVehicle.group.rotation.set(0, Math.PI / 2, 0);
      fuegoVehicle.group.visible = fuegoVehicle.loaded;
      escapeStage = 3;
      justRestored = fuegoVehicle.loaded;
    }
    if (escapeStage === 3 && progress?.fuegoStarted && fuegoVehicle.loaded && !escapeReady) {
      fuegoVehicle.group.visible = true;
      escapeReady = true;
      justRestored = true;
      escapeInteraction.reach = 3.5;
    }
    if (escapeReady) {
      const enginesVisible = !!progress?.fuegoPowerCellInstalled;
      fuegoVehicle.pulses.forEach(pulse => { pulse.visible = enginesVisible; });
      fuegoVehicle.halos.forEach(halo => { halo.visible = enginesVisible; });
    }
    if (powered && !wasPowered) startupAge = !powerKnown || paused || dt <= 0 ? 2.5 : 0;
    if (!powered) startupAge = 0;
    powerKnown = true; wasPowered = powered;
    const step = paused ? 0 : Math.min(Math.max(dt, 0), .1);
    if (powered) startupAge = Math.min(3, startupAge + step);
    fuegoArt.update(step);
    if (!flightClaimed && escapeReady && (!paused || justRestored || powerChanged)) {
      const rise = powered ? .25 * THREE.MathUtils.smoothstep(startupAge, .2, 1.6) : 0;
      const floating = powered && startupAge > 1.6 ? Math.sin(age * 2.8) * .018 : 0;
      const vibration = powered && startupAge < 1.6 ? Math.sin(startupAge * 48) * .012 * (1 - startupAge / 1.6) : 0;
      fuegoVehicle.group.position.y = escapeParking.y + rise + floating + vibration;
    }
    if (!flightClaimed && !paused && progress?.introSeen && powered && escapeReady && startupAge >= 3 && !progress?.escapeBriefed && !ignitionReported) {
      ignitionReported = true;
      onEvent?.("fuego-ignition-ready");
    }
    if (paused || !progress?.introSeen) return;
    trafficPulse = Math.max(0, trafficPulse - Math.max(0, dt));
    timeScale = THREE.MathUtils.damp(timeScale, synchronization ? 0 : trafficPulse > 0 ? .42 : 1,
      synchronization ? 1.8 : 1.1, Math.max(dt, 0));
    age += Math.min(Math.max(dt, 0), .1) * timeScale;
    for (const vehicle of vehicles) {
      if (!vehicle.loaded) continue;
      const { route, curve, length, duration, group, pulses, trail, trailPositions } = vehicle;
      if (flightClaimed && route.id === "renault-fuego") continue;
      if ((escapeRequested || escapeStage > 0) && route.id === "renault-fuego") {
        if (!escapeStage) {
          // Join the fixed parking approach from the existing street corridor.
          if (!group.visible) {
            // Continue from a real point on the existing street corridor.
            const elapsed = Math.max(0, age - vehicle.loadedAt - route.startDelay);
            curve.getPointAt(((elapsed % duration) * route.speed) / length, group.position);
          }
          escapeStage = 1;
        }
        group.visible = true;
        if (escapeReady) {
          group.rotation.y = THREE.MathUtils.damp(group.rotation.y, Math.PI / 2, 2, step);
          continue;
        }
        if (escapeStage === 1) escapeWaypoint.set(-23, 6, group.position.z);
        else if (escapeStage === 2) escapeWaypoint.set(-23, 6, 23);
        else if (player && Math.hypot(player.x - escapeParking.x, player.z - escapeParking.z) < 3)
          escapeWaypoint.set(-14, 6, 23);
        else escapeWaypoint.copy(escapeParking);
        const remaining = group.position.distanceTo(escapeWaypoint);
        sightDirection.subVectors(escapeWaypoint, group.position);
        if (remaining > .035) {
          group.position.addScaledVector(sightDirection.normalize(), Math.min(remaining, step * Math.min(8, Math.max(.55, remaining * 1.5))));
          const yaw = Math.atan2(sightDirection.x, sightDirection.z);
          group.rotation.y += Math.atan2(Math.sin(yaw-group.rotation.y), Math.cos(yaw-group.rotation.y)) * Math.min(1,step*2.5);
          group.rotation.x = THREE.MathUtils.damp(group.rotation.x,0,3,step);
          group.rotation.z = THREE.MathUtils.damp(group.rotation.z,0,3,step);
        } else if (escapeStage < 3) escapeStage++;
        else if (!player || Math.hypot(player.x - escapeParking.x, player.z - escapeParking.z) >= 3) {
          escapeReady = true;
          escapeInteraction.reach = 3.5;
          const enginesVisible = !!progress?.fuegoPowerCellInstalled;
          pulses.forEach(pulse => { pulse.visible = enginesVisible; });
          vehicle.halos.forEach(halo => { halo.visible = enginesVisible; });
          group.rotation.y = THREE.MathUtils.damp(group.rotation.y, Math.PI / 2, 2, step);
        }
        continue;
      }
      const sinceStart = age - vehicle.loadedAt - route.startDelay;
      const phase = sinceStart < 0 ? -1 : sinceStart % duration;
      const active = phase >= 0;
      group.visible = active;
      if (trail) trail.visible = active && currentTier !== "low";
      if (!active) continue;
      const distance = phase * route.speed, t = distance / length;
      curve.getPointAt(t, group.position);
      group.position.y += Math.sin(age * 1.7 + route.startDelay) * .1;
      curve.getTangentAt(t, tangent);
      curve.getTangentAt((t + .012) % 1, nextTangent);
      group.rotation.set(-tangent.y * .18, Math.atan2(tangent.x, tangent.z),
        THREE.MathUtils.clamp(tangent.x * nextTangent.z - tangent.z * nextTangent.x, -.25, .25) * .18,
        "YXZ");
      pulses.forEach((pulse, i) => { pulse.scale.y = .18 + .055 * Math.sin(age * 4.4 + i * 2); });
      if (trail?.visible) {
        for (let i = 0; i < TRAIL_POINTS; i++) {
          const behind = THREE.MathUtils.euclideanModulo(distance - i * .7, length);
          curve.getPointAt(behind / length, sample);
          trailPositions.setXYZ(i, sample.x, sample.y - 1.6, sample.z);
        }
        trailPositions.needsUpdate = true;
      }
      if (route.id !== "yellow-tesla" || yellowReported || progress?.yellowCarSeen || !progress?.introSeen || !camera || !player) continue;
      if (Math.hypot(group.position.x - player.x, group.position.z - player.z) > 58 ||
          camera.position.distanceTo(group.position) > 65) continue;
      camera.updateMatrixWorld();
      projected.copy(group.position).project(camera);
      if (projected.z >= -1 && projected.z <= 1 && Math.abs(projected.x) < .78 && Math.abs(projected.y) < .78) {
        sightDirection.subVectors(group.position, camera.position);
        sightRay.set(camera.position, sightDirection.normalize()); sightRay.far = camera.position.distanceTo(group.position) - 1;
        if (sightRay.intersectObjects(occluders, false).length === 0) {
          yellowReported = true; onEvent?.("yellow-car-seen");
        }
      }
    }
  }

  return {
    root, vehicles, ready, update,
    fuego: fuegoVehicle.group,
    claimFlight() { if (!fuegoVehicle.loaded || !escapeReady) return false; flightClaimed = true; escapeInteraction.reach = 0; return true; },
    releaseFlight() { flightClaimed = false; fuegoVehicle.group.position.copy(escapeParking); fuegoVehicle.group.rotation.set(0, Math.PI / 2, 0); escapeInteraction.reach = escapeReady ? 3.5 : 0; },
    escapeInteraction, escapeParking, get escapeReady() { return escapeReady; },
    get fuegoStartupAge() { return startupAge; },
    get fuegoOperational() { return escapeReady && wasPowered && startupAge >= 3; },
    prepareEscape(active) { escapeRequested = Boolean(active); },
    canStand(x,z,fromX=x,fromZ=z) {
      if(flightClaimed || !escapeReady)return true;
      const next=Math.hypot(x-escapeParking.x,z-escapeParking.z),previous=Math.hypot(fromX-escapeParking.x,fromZ-escapeParking.z);
      return next>2.4||next>previous;
    },
    setSynchronization(active) { synchronization = Boolean(active); },
    triggerTrafficPulse() { trafficPulse = 1.6; },
    applyQuality(next) { currentTier = next; if (next === "low") vehicles.forEach(vehicle => { if (vehicle.trail) vehicle.trail.visible = false; }); },
    dispose() { disposed = true; codeVision?.unregister(root); fuegoArt.dispose(); },
  };
}
