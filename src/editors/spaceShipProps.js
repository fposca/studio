import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import computerUrl from "../assets/neonboy-animaciones/computer.ship-optimized.glb?url";
import platformUrl from "../assets/neonboy-animaciones/plataforma.ship-optimized.glb?url";
import humanUrl from "../assets/neonboy-animaciones/hombre-holograma.ship-optimized.glb?url";

const loader = new GLTFLoader();

function fitModel(root, height, floorY = 0) {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  if (size.y <= 0) throw new Error("El modelo de la nave no tiene altura");
  const scale = height / size.y;
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, floorY - bounds.min.y * scale, -center.z * scale);
  return size.multiplyScalar(scale);
}

export function createSpaceShipProps(loadModel = (url) => loader.loadAsync(url)) {
  const group = new THREE.Group();
  group.name = "Equipo de nave";
  group.userData.editorHelper = true;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const holograms = [];
  const lights = [];
  let loading = null;
  let disposed = false;
  const register = (root) => root.traverse((item) => {
    if (!item.isMesh) return;
    geometries.add(item.geometry);
    const mats = Array.isArray(item.material) ? item.material : [item.material];
    for (const mat of mats) {
      if (!mat) continue;
      materials.add(mat);
      Object.values(mat).forEach((value) => { if (value?.isTexture) textures.add(value); });
    }
  });
  const disposeResources = () => {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
  };
  const prepareHologram = (root) => {
    root.traverse((item) => {
      if (!item.isMesh) return;
      item.castShadow = false;
      item.receiveShadow = false;
    });
  };
  // The computer GLB contains anatomy; the metal station is the computer shown in the reference.
  const build = (anatomy, platform, human) => {
    for (const root of [anatomy, platform, human]) register(root);
    const metalStation = (height) => {
      const model = platform.clone(true);
      fitModel(model, height, 0.02);
      model.traverse((item) => { if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; } });
      return model;
    };

    const computer = new THREE.Group();
    computer.name = "Computadora central";
    computer.position.set(0, 0, -11);
    computer.add(metalStation(5));
    group.add(computer);

    for (const [index, side] of [-1, 1].entries()) {
      const station = new THREE.Group();
      station.name = side < 0 ? "Plataforma izquierda" : "Plataforma derecha";
      station.position.set(side * 9, 0, -10.2);
      station.add(metalStation(1.12));

      const pivot = new THREE.Group();
      pivot.name = side < 0 ? "Holograma reptiliano" : "Holograma humano";
      pivot.position.y = 1.35;
      const model = side < 0 ? anatomy : human;
      fitModel(model, 3.4, 0.2);
      const color = side < 0 ? 0x68e9ff : 0x9cd5ff;
      prepareHologram(model);
      pivot.add(model);
      station.add(pivot);

      const emitter = new THREE.Mesh(
        new THREE.TorusGeometry(1.12, 0.035, 8, 64),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.74, depthWrite: false })
      );
      emitter.name = "Anillo proyector";
      emitter.rotation.x = Math.PI / 2;
      emitter.position.y = 1.22;
      geometries.add(emitter.geometry);
      materials.add(emitter.material);
      station.add(emitter);
      const light = new THREE.PointLight(color, 6, 6, 2);
      light.position.y = 1.65;
      station.add(light);
      lights.push(light);
      group.add(station);
      holograms.push({ pivot, emitter, light, phase: index * 1.7 });
    }
  };

  group.userData.load = () => {
    if (disposed) return Promise.resolve();
    if (!loading) loading = Promise.all([computerUrl, platformUrl, humanUrl].map(loadModel))
      .then((results) => {
        const roots = results.map((result) => result.scene);
        if (disposed) { roots.forEach(register); disposeResources(); return; }
        build(...roots);
      })
      .catch((error) => { console.error("No se pudo cargar el equipo de la nave", error); });
    return loading;
  };
  group.userData.animate = (time, active) => {
    group.visible = Boolean(active && !disposed);
    if (!group.visible) return;
    group.userData.load();
    const seconds = time * 0.001;
    holograms.forEach(({ pivot, emitter, light, phase }) => {
      pivot.rotation.y = seconds * 0.28 + phase;
      pivot.position.y = 1.35 + Math.sin(seconds * 1.9 + phase) * 0.085;
      emitter.material.opacity = 0.66 + Math.sin(seconds * 2.2 + phase) * 0.14;
      light.intensity = 6 + Math.sin(seconds * 2.2 + phase) * 0.7;
    });
  };
  group.userData.dispose = () => {
    if (disposed) return;
    disposed = true;
    group.visible = false;
    group.clear();
    disposeResources();
    lights.forEach((light) => light.dispose());
  };
  return group;
}
