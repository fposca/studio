import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { disposeObjects } from "./disposeGameObjects.js";

const MODELS = [
  new URL("../assets/neonboy-animaciones/bsas/auto-ruedas-nuevo.traffic.glb", import.meta.url).href,
  new URL("../assets/neonboy-animaciones/bsas/auto-ruedas-nuevo2.traffic.glb", import.meta.url).href,
  new URL("../assets/neonboy-animaciones/bsas/auto-ruedas-nuevo3.traffic.glb", import.meta.url).href,
  new URL("../assets/neonboy-animaciones/bsas/auto-ruedas-nuevo4.traffic.glb", import.meta.url).href,
];

// A continuous one-way circuit uses both 9 de Julio carriageways. Its turns
// fit between the plaza's tips and the planted medians, without teleporting
// vehicles at the map boundary or cutting across the BA garden.
export const GROUND_CAR_LOOPS = Object.freeze([
  { id: "avenue", speed: 8.4, points: [
    [-25, 52], [-25, 35], [-25, 15], [-25, -20], [-25, -41],
    [-22, -45.5], [-10, -47.1], [0, -47.1], [10, -47.1], [22, -45.5],
    [25, -41], [25, -20], [25, 15], [25, 35], [25, 52],
    [21, 55.6], [10, 56.55], [0, 56.55], [-10, 56.55], [-21, 55.6],
  ] },
]);

// Four copies per design, evenly spaced along the full circuit. Every instance
// shares its model geometry and texture with the other copies.
export const GROUND_CAR_LAYOUT = Object.freeze(Array.from({ length: 16 }, (_, index) =>
  Object.freeze({ id: `traffic-${index + 1}`, loop: 0, modelIndex: index % MODELS.length,
    offset: (index + .58) / 16 })));

export function createBuenosAiresGroundVehicles(parent, { tier = "high", glowMap, codeVision } = {}) {
  const root = new THREE.Group(); root.name = "Buenos Aires / transito de la avenida"; parent.add(root);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const routes = GROUND_CAR_LOOPS.map(config => {
    const curve = new THREE.CatmullRomCurve3(
      config.points.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "centripetal");
    curve.arcLengthDivisions = 512;
    return { ...config, curve, length: curve.getLength() };
  });
  const cars = GROUND_CAR_LAYOUT.map((config, index) => {
    const route = routes[config.loop];
    const group = new THREE.Group(); group.name = `Auto de calle / ${config.id}`;
    group.userData.cityKeep = true; group.visible = false; root.add(group);
    const distance = route.length * config.offset;
    route.curve.getPointAt(config.offset, group.position);
    const tangent = route.curve.getTangentAt(config.offset, new THREE.Vector3());
    group.rotation.y = Math.atan2(tangent.x, tangent.z);
    return { config, index, route, curve: route.curve, length: route.length, group, distance,
      motionSpeed: route.speed, loaded: false, meshes: [], halfWidth: 1.1, halfLength: 2.35 };
  });
  const point = new THREE.Vector3(), tangent = new THREE.Vector3();
  let disposed = false, currentTier = tier;
  const templates = new Array(MODELS.length);
  const shadowGeometry = new THREE.PlaneGeometry(1, 1);
  const shadowMaterial = glowMap ? new THREE.MeshBasicMaterial({ map: glowMap, color: 0x03080d,
    transparent: true, opacity: .72, depthWrite: false }) : null;

  function setPose(car) {
    car.curve.getPointAt(car.distance / car.length, car.group.position);
    car.curve.getTangentAt(car.distance / car.length, tangent);
    car.group.rotation.y = Math.atan2(tangent.x, tangent.z);
  }
  function refreshVisibility(player) {
    const limit = currentTier === "high" ? 16 : currentTier === "medium" ? 12 : 8;
    const ordered = cars.filter(car => car.loaded).sort((a, b) =>
      (player ? a.group.position.distanceToSquared({ x: player.x, y: 0, z: player.z }) : a.index) -
      (player ? b.group.position.distanceToSquared({ x: player.x, y: 0, z: player.z }) : b.index));
    for (const car of cars) car.group.visible = false;
    for (const car of ordered.slice(0, limit)) car.group.visible = true;
  }
  const ready = Promise.allSettled(MODELS.map(async (url, modelIndex) => {
    try {
      const asset = await loader.loadAsync(url);
      if (disposed) { disposeObjects([asset.scene]); return; }
      const scene = asset.scene, bounds = new THREE.Box3().setFromObject(scene);
      const size = bounds.getSize(new THREE.Vector3()), centre = bounds.getCenter(new THREE.Vector3());
      const lengthOnX = size.x > size.z;
      const rawLength = Math.max(size.x, size.z);
      const scale = 4.65 / Math.max(rawLength, .01);
      templates[modelIndex] = scene;
      for (const car of cars.filter(car => car.config.modelIndex === modelIndex)) {
        const pivot = new THREE.Group(); pivot.rotation.y = lengthOnX ? Math.PI / 2 : 0;
        const model = scene.clone(true);
        model.scale.setScalar(scale);
        model.position.set(-centre.x * scale, -bounds.min.y * scale, -centre.z * scale);
        pivot.add(model); car.group.add(pivot);
        codeVision?.register(model, "dynamic");
        car.halfLength = rawLength * scale / 2;
        car.halfWidth = (lengthOnX ? size.z : size.x) * scale / 2;
        model.traverse(object => {
          if (!object.isMesh) return;
          object.userData.cityKeep = true;
          object.castShadow = currentTier === "high" && car.index % 4 === 0;
          object.receiveShadow = true;
          car.meshes.push(object);
        });
        if (shadowMaterial) {
          const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
          shadow.userData.cityKeep = true;
          shadow.rotation.x = -Math.PI / 2;
          shadow.scale.set(car.halfWidth * 2.8, car.halfLength * 2.5, 1);
          shadow.position.y = .013; car.group.add(shadow);
        }
        car.loaded = true;
      }
      refreshVisibility(null);
    } catch (error) {
      if (!disposed) console.warn(`No se pudo cargar el modelo de transito ${modelIndex + 1}:`, error);
    }
  }));

  function blocked(car, x, z, margin = .46) {
    if (!car.loaded || !car.group.visible) return false;
    const dx = x - car.group.position.x, dz = z - car.group.position.z;
    const c = Math.cos(car.group.rotation.y), s = Math.sin(car.group.rotation.y);
    return Math.abs(dx * c - dz * s) < car.halfWidth + margin &&
      Math.abs(dx * s + dz * c) < car.halfLength + margin;
  }
  function canStand(x, z, fromX = x, fromZ = z) {
    return !cars.some(car => {
      if (!blocked(car, x, z)) return false;
      if (!blocked(car, fromX, fromZ)) return true;
      const before = Math.hypot(fromX - car.group.position.x, fromZ - car.group.position.z);
      const after = Math.hypot(x - car.group.position.x, z - car.group.position.z);
      return after <= before + .0001;
    });
  }
  function update(dt, player, paused, pedestrians = []) {
    if (disposed || paused) return;
    const step = Math.min(Math.max(dt, 0), .1);
    if (step === 0) return;
    for (const car of cars) {
      if (!car.loaded) continue;
      let desiredSpeed = car.route.speed;
      const nextCar = cars.reduce((gap, other) => {
        if (other === car || !other.loaded || other.config.loop !== car.config.loop) return gap;
        const ahead = (other.distance - car.distance + car.length) % car.length;
        return ahead > .01 ? Math.min(gap, ahead) : gap;
      }, Infinity);
      desiredSpeed = Math.min(desiredSpeed, Math.max(0, (nextCar - 8) * 1.5));
      car.curve.getTangentAt(car.distance / car.length, tangent);
      const forwardX = tangent.x, forwardZ = tangent.z;
      const yieldTo = (x, z, margin) => {
        const dx = x - car.group.position.x, dz = z - car.group.position.z;
        const ahead = dx * forwardX + dz * forwardZ;
        const side = Math.abs(dx * forwardZ - dz * forwardX);
        if (ahead > -1 && ahead < 12 && side < car.halfWidth + margin)
          desiredSpeed = Math.min(desiredSpeed, Math.max(0, (ahead - car.halfLength - margin) * 1.7));
      };
      if (player) yieldTo(player.x, player.z, 1.2);
      for (const pedestrian of pedestrians) if (pedestrian.lod !== "off") {
        const p = pedestrian.root.position;
        if (Math.abs(p.x - car.group.position.x) < 12 && Math.abs(p.z - car.group.position.z) < 12)
          yieldTo(p.x, p.z, 1.15);
      }
      car.motionSpeed += THREE.MathUtils.clamp(desiredSpeed - car.motionSpeed, -11 * step, 3.5 * step);
      const next = (car.distance + Math.max(0, car.motionSpeed) * step) % car.length;
      car.curve.getPointAt(next / car.length, point);
      if (player && Math.hypot(point.x - player.x, point.z - player.z) < car.halfLength + 1.2) {
        car.motionSpeed = 0; continue;
      }
      if (pedestrians.some(actor => actor.lod !== "off" &&
          Math.hypot(point.x - actor.root.position.x, point.z - actor.root.position.z) < car.halfLength + .9)) {
        car.motionSpeed = 0; continue;
      }
      car.distance = next; setPose(car);
    }
    refreshVisibility(player);
  }
  function applyQuality(next) {
    currentTier = next;
    for (const car of cars) for (const mesh of car.meshes)
      mesh.castShadow = next === "high" && car.index % 4 === 0;
    refreshVisibility(null);
  }
  return { root, cars, ready, update, canStand, applyQuality,
    dispose() { disposed = true; codeVision?.unregister(root); templates.length = 0; } };
}
