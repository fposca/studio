import * as THREE from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { createPanoramaBackdrop } from "../editors/panoramaBackdrop.js";
import { UNDERWORLD_INTERACTIONS, canStandInUnderworld } from "./underworldLayout.js";

const CITADEL_URL = new URL("../assets/3destatic/crimson-citadel.chapter11.glb", import.meta.url).href;
const SENTINEL_URL = new URL("../assets/neonboy-animaciones/infernal-sentinel.chapter11.glb", import.meta.url).href;
const SKY_URL = new URL("../assets/environments/sky-infernal.chapter11.jpg", import.meta.url).href;
const FLOOR_URL = new URL("../assets/environments/infernal-floor.chapter11.jpg", import.meta.url).href;

export function buildUnderworld(scene, { onEvent, onDamage } = {}) {
  scene.name = "Capítulo 11 / Puente de las Almas";
  scene.background = new THREE.Color(0x210505);
  scene.fog = new THREE.FogExp2(0x330a0b, 0.011);
  const root = new THREE.Group(); root.name = "Inframundo / escenario"; scene.add(root);
  const panorama = createPanoramaBackdrop({ name: "Cielo infernal existente", horizontalRepeat: 2.7,
    horizontalMirror: true, horizonCompression: 2.5 });
  root.add(panorama);
  const lavaMaterial = new THREE.MeshStandardMaterial({ color: 0x9d230a, emissive: 0xf7470a,
    emissiveIntensity: .72, roughness: .88 });
  const basalt = new THREE.MeshStandardMaterial({ color: 0x211b25, roughness: .93,
    metalness: .13, flatShading: true });
  const edge = new THREE.MeshStandardMaterial({ color: 0x7b3131, emissive: 0x6c160d,
    emissiveIntensity: .45, roughness: .66 });
  const bridgeGlow = new THREE.LineBasicMaterial({ color: 0x83f4da, transparent: true,
    opacity: .78, depthWrite: false });
  const runeMaterial = new THREE.MeshBasicMaterial({ color: 0x83f4da, toneMapped: false });
  const portalMaterial = new THREE.MeshBasicMaterial({ color: 0xe9273a, transparent: true,
    opacity: .57, side: THREE.DoubleSide, depthWrite: false });
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), lavaMaterial);
  lava.name = "Río de lava / suelo ambiental"; lava.rotation.x = -Math.PI / 2;
  lava.position.y = -3.1; root.add(lava);
  function slab(name, x, z, width, depth, material = basalt) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, .55, depth), material);
    mesh.name = name; mesh.position.set(x, -.31, z); mesh.receiveShadow = true; root.add(mesh);
    return mesh;
  }
  slab("Llegada de obsidiana", 0, 7.2, 11.6, 13.2);
  slab("Acceso al puente", 0, -7.6, 6.5, 16.6);
  const bridge = [
    slab("Puente revelado / I", 0, -17.6, 3.5, 5.7),
    slab("Puente revelado / II", 0, -23.1, 3.5, 5.7),
    slab("Puente revelado / III", 0, -28.6, 3.5, 5.7),
  ];
  const bridgeRims = bridge.map((platform) => {
    const rim = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.46, .11, 5.62)), bridgeGlow);
    rim.name = "Código del puente verdadero"; rim.position.set(0, .02, platform.position.z);
    root.add(rim); return rim;
  });
  const runes = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, .018, .045), runeMaterial, 12);
  const runeDummy = new THREE.Object3D();
  bridge.forEach((platform, index) => {
    for (let stripe = 0; stripe < 4; stripe++) {
      runeDummy.position.set(0, .055, platform.position.z - 1.8 + stripe * 1.2);
      runeDummy.updateMatrix(); runes.setMatrixAt(index * 4 + stripe, runeDummy.matrix);
    }
  });
  runes.name = "Glifos revelados / puente"; root.add(runes);
  slab("Arena de la ciudadela", 0, -38.2, 14.3, 15.5);
  slab("Acceso al altar", 0, -49.2, 7.3, 7.2);
  const decoys = [-1, 1].map((side) => {
    const mesh = slab("Espejismo / camino falso", side * 4.4, -22.8, 2.2, 9.3, edge);
    mesh.position.y = -1.5; return mesh;
  });
  const pylonGeometry = new THREE.CylinderGeometry(.42, .7, 3.6, 7);
  const pylons = new THREE.InstancedMesh(pylonGeometry, basalt, 16);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1, lane = Math.floor(i / 2);
    dummy.position.set(side * (lane < 3 ? 3.9 : lane < 6 ? 2.6 : 7.7), 1.45,
      8 - lane * 7.7); dummy.rotation.y = i * 1.3; dummy.updateMatrix(); pylons.setMatrixAt(i, dummy.matrix);
  }
  pylons.name = "Columnas de obsidiana"; root.add(pylons);
  const chains = new THREE.Group(); chains.name = "Cadenas del puente"; root.add(chains);
  const chainMaterial = new THREE.MeshStandardMaterial({ color: 0x5f4546, metalness: .64, roughness: .42 });
  const link = new THREE.TorusGeometry(.32, .055, 6, 10);
  for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(link, chainMaterial);
    ring.position.set(side * 2.15, 2.7 - i * .52, -14.7 - i * 1.35);
    ring.rotation.set(Math.PI / 2, i * .31, 0); chains.add(ring);
  }
  const altar = new THREE.Group(); altar.name = "Altar del umbral";
  altar.position.set(0, 0, -50.7); root.add(altar);
  const altarBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.85, .7, 10), basalt);
  altarBase.position.y = .18; altar.add(altarBase);
  const portal = new THREE.Mesh(new THREE.TorusGeometry(2.45, .26, 10, 42), edge);
  portal.position.set(0, 3.1, -1.05); altar.add(portal);
  const portalCore = new THREE.Mesh(new THREE.CircleGeometry(2.18, 48), portalMaterial);
  portalCore.position.set(0, 3.1, -1.08); altar.add(portalCore);
  const portalLight = new THREE.PointLight(0xff392c, 4.2, 13, 2);
  portalLight.position.set(0, 3.1, -1); altar.add(portalLight);
  const sun = new THREE.DirectionalLight(0xff7648, 2.4); sun.position.set(-9, 15, -22); scene.add(sun);
  const fill = new THREE.PointLight(0x9b3fbb, 7, 18, 2); fill.position.set(-5, 4, -38); scene.add(fill);
  const sentinels = [-1, 1].map((side, index) => {
    const group = new THREE.Group(); group.name = `Centinela infernal ${index + 1}`;
    group.position.set(side * 3.5, 0, -38 - index * 4);
    root.add(group);
    return { group, homeX: side * 3.5, homeZ: -38 - index * 4, cooldown: 0, hit: 0, mixer: null };
  });
  let citadel = null, skyTexture = null, floorTexture = null, disposed = false, loadError = null;
  const targetPosition = new THREE.Vector3();
  const colliders = [];
  async function loadAssets(loader, isAlive = () => true) {
    try {
      const [citadelData, sentinelData, sky, floor] = await Promise.all([
        loader.loadAsync(CITADEL_URL), loader.loadAsync(SENTINEL_URL),
        new THREE.TextureLoader().loadAsync(SKY_URL), new THREE.TextureLoader().loadAsync(FLOOR_URL),
      ]);
      if (disposed || !isAlive()) {
        sky.dispose(); floor.dispose(); return false;
      }
      skyTexture = sky; floorTexture = floor;
      sky.colorSpace = floor.colorSpace = THREE.SRGBColorSpace;
      panorama.userData.setTexture(sky, .75);
      floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(18, 18);
      lavaMaterial.map = floor; lavaMaterial.emissiveMap = floor; lavaMaterial.needsUpdate = true;
      citadel = citadelData.scene;
      citadel.name = "Ciudadela infernal original / modelo reutilizado";
      citadel.scale.setScalar(25); citadel.position.set(0, 23.8, -71);
      citadel.traverse((part) => { if (part.isMesh) { part.castShadow = false; part.receiveShadow = false; part.frustumCulled = true; } });
      root.add(citadel);
      const original = sentinelData.scene;
      const bounds = new THREE.Box3().setFromObject(original);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 2.65 / Math.max(.01, size.y);
      sentinels.forEach((sentinel) => {
        const model = cloneSkeleton(original);
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
        model.traverse((part) => { if (part.isMesh) { part.castShadow = false; part.frustumCulled = false; } });
        sentinel.group.add(model);
        if (sentinelData.animations.length) {
          sentinel.mixer = new THREE.AnimationMixer(model);
          sentinel.mixer.clipAction(sentinelData.animations[0]).play();
        }
      });
      return true;
    } catch (error) { loadError = error; return false; }
  }
  function getTargets(progress) {
    if (!progress?.bridgeCrossed) return [];
    return sentinels.flatMap((sentinel, index) => progress.enemies[index] > 0
      ? [{ id: `underworld-${index}`, position: targetPosition.clone().set(sentinel.group.position.x, 1.25, sentinel.group.position.z), radius: .75, capsuleHalfHeight: .8 }]
      : []);
  }
  function registerImpact(target) {
    const index = Number(target.id?.split("-")[1]);
    if (index !== 0 && index !== 1) return;
    sentinels[index].hit = .32;
    onEvent?.("enemy-hit", index);
  }
  function update(dt, elapsed, progress, player, paused) {
    const step = paused ? 0 : dt;
    const vision = progress?.visionActive === true;
    bridge.forEach((mesh) => { mesh.visible = vision; });
    bridgeRims.forEach((mesh) => { mesh.visible = vision; mesh.material.opacity = .58 + .2 * Math.sin(elapsed * 3); });
    runes.visible = vision;
    decoys.forEach((mesh) => { mesh.visible = !vision; });
    portalCore.material.opacity = progress?.completed ? .68 : .28 + .08 * Math.sin(elapsed * 2.2);
    portal.rotation.z += step * (progress?.completed ? .32 : .08);
    sentinels.forEach((sentinel, index) => {
      sentinel.group.visible = progress?.enemies[index] > 0;
      if (!sentinel.group.visible || paused) return;
      sentinel.mixer?.update(step);
      sentinel.hit = Math.max(0, sentinel.hit - step);
      sentinel.cooldown = Math.max(0, sentinel.cooldown - step);
      const group = sentinel.group;
      if (progress.bridgeCrossed) {
        const distance = Math.hypot(player.x - group.position.x, player.z - group.position.z);
        if (distance < 7 && distance > 1.3) {
          const dx = (player.x - group.position.x) / distance, dz = (player.z - group.position.z) / distance;
          group.position.x = THREE.MathUtils.clamp(group.position.x + dx * step * 1.45, sentinel.homeX - 3, sentinel.homeX + 3);
          group.position.z = THREE.MathUtils.clamp(group.position.z + dz * step * 1.45, sentinel.homeZ - 3, sentinel.homeZ + 3);
        }
        if (distance < 1.9 && sentinel.cooldown === 0) {
          sentinel.cooldown = 2.2;
          onDamage?.(1);
        }
        group.rotation.y = Math.atan2(player.x - group.position.x, player.z - group.position.z);
      }
      group.position.y = Math.sin(elapsed * 2.2 + index) * .055 + sentinel.hit * .45;
    });
    if (player.z < -31.5 && !progress?.bridgeCrossed) onEvent?.("bridge-crossed");
  }
  return {
    interactions: UNDERWORLD_INTERACTIONS, obstacles: [], colliders,
    canStand: canStandInUnderworld, loadAssets, getTargets, registerImpact, update,
    get loadError() { return loadError; },
    dispose() {
      disposed = true;
      sentinels.forEach((sentinel) => sentinel.mixer?.stopAllAction());
      skyTexture?.dispose(); floorTexture?.dispose();
      panorama.userData.dispose?.();
    },
  };
}
