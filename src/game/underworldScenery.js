import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createPanoramaBackdrop } from "../editors/panoramaBackdrop.js";
import { UNDERWORLD_INTERACTIONS, UNDERWORLD_PYLONS, canStandInUnderworld } from "./underworldLayout.js";
import { createUnderworldActors } from "./underworldActors.js";
import { createUnderworldAtmosphere } from "./underworldAtmosphere.js";
import { createStoreInvasionVision } from "./storeInvasionVision.js";

const CITADEL_URL = new URL("../assets/3destatic/crimson-citadel.chapter11.glb", import.meta.url).href;
const SKY_URL = new URL("../assets/environments/sky-infernal.chapter11.jpg", import.meta.url).href;
const FLOOR_URL = new URL("../assets/environments/infernal-floor.chapter11.jpg", import.meta.url).href;

const STONE_URL = new URL("../assets/environments/bridge-stone.chapter11.jpg", import.meta.url).href;
const BASALT_URL = new URL("../assets/environments/basalt.chapter11.jpg", import.meta.url).href;

// World-scale UVs keep stones the same size on the approach, bridge and arena.
function stoneUvs(geometry, x = 0, z = 0) {
  const { position, normal, uv } = geometry.attributes;
  for (let i = 0; i < position.count; i++) {
    if (Math.abs(normal.getY(i)) > .5) uv.setXY(i, (position.getX(i) + x) / 3.6, (position.getZ(i) + z) / 3.6);
    else if (Math.abs(normal.getX(i)) > .5) uv.setXY(i, (position.getZ(i) + z) / 3.6, position.getY(i) / 3.6);
    else uv.setXY(i, (position.getX(i) + x) / 3.6, position.getY(i) / 3.6);
  }
  return geometry;
}

export function buildUnderworld(scene, { onEvent, onDamage } = {}) {
  scene.name = "Capítulo 11 / Puente de las Almas";
  scene.background = new THREE.Color(0x210505);
  scene.fog = new THREE.FogExp2(0x3b252b, .016);
  const root = new THREE.Group(); root.name = "Inframundo / escenario"; scene.add(root);
  const architecture = new THREE.Group(); architecture.name = "Arquitectura / código de frecuencia"; root.add(architecture);
  const panorama = createPanoramaBackdrop({ name: "Cielo infernal existente", horizontalRepeat: 2.7,
    horizontalMirror: true, horizonCompression: 2.5, horizonFade: .08, horizonColor: "#3b252b" });
  root.add(panorama);
  const atmosphere = createUnderworldAtmosphere(scene, root);
  const deckMaterial = new THREE.MeshStandardMaterial({ color: 0x9c96a4, roughness: .92,
    metalness: .025, bumpScale: .075 });
  const basalt = new THREE.MeshStandardMaterial({ color: 0x99949d, roughness: .9,
    metalness: .08, bumpScale: .1 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x75645c, emissive: 0x42170e,
    emissiveIntensity: .17, roughness: .76, metalness: .24 });
  const bridgeGlow = new THREE.LineBasicMaterial({ color: 0x57ef97, transparent: true,
    opacity: .4, depthWrite: false, toneMapped: false });
  const portalMaterial = new THREE.MeshBasicMaterial({ color: 0xe9273a, transparent: true,
    opacity: .57, side: THREE.DoubleSide, depthWrite: false });
  function slab(name, x, z, width, depth, material = deckMaterial) {
    const geometry = stoneUvs(new RoundedBoxGeometry(width, .55, depth, 1, .075), x, z);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name; mesh.position.set(x, -.31, z); mesh.receiveShadow = true; architecture.add(mesh);
    if (material === deckMaterial) for (const side of [-1, 1]) {
      const borderX = side * (width * .5 - .14);
      const border = new THREE.Mesh(stoneUvs(new RoundedBoxGeometry(.22, .16, depth - .12, 1, .035), x + borderX, z), basalt);
      border.name = "Canto tallado / borde del camino";
      border.position.set(borderX, .29, 0);
      mesh.add(border);
    }
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
    architecture.add(rim); return rim;
  });
  slab("Arena de la ciudadela", 0, -38.2, 14.3, 15.5);
  slab("Acceso al altar", 0, -49.2, 7.3, 7.2);
  const decoys = [-1, 1].map((side) => {
    const mesh = slab("Espejismo / camino falso", side * 4.4, -22.8, 2.2, 9.3, edge);
    mesh.position.y = -1.5; return mesh;
  });
  const pylonGeometry = new THREE.CylinderGeometry(.42, .7, 3.6, 9);
  const pylons = new THREE.InstancedMesh(pylonGeometry, basalt, 16);
  const pylonCaps = new THREE.InstancedMesh(new THREE.CylinderGeometry(.5, .54, .17, 9), edge, 16);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 16; i++) {
    const pillar = UNDERWORLD_PYLONS[i];
    dummy.position.set(pillar.x, 1.45, pillar.z); dummy.rotation.y = i * 1.3; dummy.updateMatrix(); pylons.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 3.12; dummy.updateMatrix(); pylonCaps.setMatrixAt(i, dummy.matrix);
  }
  pylons.name = "Columnas de obsidiana"; architecture.add(pylons);
  pylonCaps.name = "Remates de hierro envejecido"; architecture.add(pylonCaps);
  const chains = new THREE.Group(); chains.name = "Cadenas del puente"; architecture.add(chains);
  const chainMaterial = new THREE.MeshStandardMaterial({ color: 0x5f4546, metalness: .64, roughness: .42 });
  const link = new THREE.TorusGeometry(.32, .055, 6, 10);
  for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(link, chainMaterial);
    ring.position.set(side * 2.15, 2.7 - i * .52, -14.7 - i * 1.35);
    ring.rotation.set(Math.PI / 2, i * .31, 0); chains.add(ring);
  }
  const altar = new THREE.Group(); altar.name = "Altar del umbral";
  altar.position.set(0, 0, -50.7); architecture.add(altar);
  const altarBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.85, .7, 10), basalt);
  altarBase.position.y = .18; altar.add(altarBase);
  const portal = new THREE.Mesh(new THREE.TorusGeometry(2.45, .26, 10, 42), edge);
  portal.position.set(0, 3.1, -1.05); altar.add(portal);
  const portalCore = new THREE.Mesh(new THREE.CircleGeometry(2.18, 48), portalMaterial);
  portalCore.position.set(0, 3.1, -1.08); altar.add(portalCore);
  const portalLight = new THREE.PointLight(0xff392c, 4.2, 13, 2);
  portalLight.position.set(0, 3.1, -1); altar.add(portalLight);
  const sun = new THREE.DirectionalLight(0xffad78, 1.8); sun.position.set(-9, 15, -22); scene.add(sun);
  const fill = new THREE.PointLight(0x9b3fbb, 7, 18, 2); fill.position.set(-5, 4, -38); scene.add(fill);
  const actors = createUnderworldActors(root, { onEvent, onDamage });
  let citadel = null, skyTexture = null, floorTexture = null, stoneTexture = null, basaltTexture = null, disposed = false, loadError = null;
  let codeVision = null, visionClock = 0;
  const colliders = [];
  const interactions = [...UNDERWORLD_INTERACTIONS.map((spot) => ({ ...spot })), ...actors.interactions];
  const cathedralDoor = interactions.find((spot) => spot.id === "cathedral-door");
  cathedralDoor.reach = 0;
  async function loadAssets(loader, isAlive = () => true) {
    try {
      const [citadelData, actorsReady, sky, floor, stone, rock] = await Promise.all([
        loader.loadAsync(CITADEL_URL), actors.loadAssets(loader, isAlive),
        new THREE.TextureLoader().loadAsync(SKY_URL), new THREE.TextureLoader().loadAsync(FLOOR_URL),
        new THREE.TextureLoader().loadAsync(STONE_URL), new THREE.TextureLoader().loadAsync(BASALT_URL),
      ]);
      if (disposed || !isAlive() || !actorsReady) {
        sky.dispose(); floor.dispose(); stone.dispose(); rock.dispose(); return false;
      }
      skyTexture = sky; floorTexture = floor; stoneTexture = stone; basaltTexture = rock;
      for (const texture of [sky, floor, stone, rock]) texture.colorSpace = THREE.SRGBColorSpace;
      panorama.userData.setTexture(sky, .75);
      for (const texture of [floor, stone, rock]) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 4;
        texture.needsUpdate = true;
      }
      deckMaterial.map = deckMaterial.bumpMap = stone;
      basalt.map = basalt.bumpMap = rock;
      deckMaterial.needsUpdate = basalt.needsUpdate = true;
      atmosphere.setLavaTexture(floor);
      citadel = citadelData.scene;
      citadel.name = "Ciudadela infernal original / modelo reutilizado";
      citadel.scale.setScalar(25); citadel.position.set(0, 23.8, -71);
      citadel.traverse((part) => { if (part.isMesh) { part.castShadow = false; part.receiveShadow = false; part.frustumCulled = true; } });
      architecture.add(citadel);
      // Register after the textures and imported scenery are ready. The special
      // bridge material shares the same atlas and animation as the previous level.
      codeVision = createStoreInvasionVision(scene);
      bridge.forEach((platform) => codeVision.register(platform, "bridge"));
      codeVision.register(architecture);
      return true;
    } catch (error) { loadError = error; return false; }
  }
  function update(dt, elapsed, progress, player, paused, camera, reducedMotion = false) {
    const step = paused ? 0 : dt;
    atmosphere.update(dt, paused, camera, reducedMotion, player);
    const vision = progress?.visionActive === true;
    bridge.forEach((mesh) => { mesh.visible = vision; });
    if (!reducedMotion) visionClock += step;
    codeVision?.update(step, vision, player, reducedMotion);
    bridgeRims.forEach((mesh) => { mesh.visible = vision; mesh.material.opacity = .38 + .05 * Math.sin(visionClock * .9); });
    decoys.forEach((mesh) => { mesh.visible = !vision; });
    cathedralDoor.reach = progress?.completed ? 1.8 : 0;
    portalCore.material.opacity = progress?.completed ? .68 : .28 + .08 * Math.sin(elapsed * 2.2);
    portal.rotation.z += step * (progress?.completed ? .32 : .08);
    actors.update(dt, elapsed, progress, player, paused, reducedMotion);
    if (player.z < -31.5 && !progress?.bridgeCrossed) onEvent?.("bridge-crossed");
  }
  return {
    interactions, obstacles: [], colliders,
    canStand: canStandInUnderworld, loadAssets, getTargets: actors.getTargets, registerImpact: actors.registerImpact, update,
    get loadError() { return loadError; },
    dispose() {
      disposed = true;
      actors.dispose();
      codeVision?.dispose();
      skyTexture?.dispose(); floorTexture?.dispose(); stoneTexture?.dispose(); basaltTexture?.dispose();
      panorama.userData.dispose?.();
    },
  };
}
