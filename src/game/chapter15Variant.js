import * as THREE from "three";
import { STORE_OBSTACLES } from "./recordStoreLayout.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { createChapter15StoreEvidence } from "./chapter15StoreEvidence.js";
import { createChapter15Evidence } from "./chapter15Evidence.js";
import { createChapter15Visuals } from "./chapter15Visuals.js";

const COMPANION_URL = new URL("../assets/neonboy-animaciones/desconectada-respira.near.glb", import.meta.url).href;

// Each chapter-15 scene owns these objects. The original studio and store builders
// are reused without changing their geometry, materials, NPCs or interactions.
export function createChapter15Variant(scene, mode, base, loader, isAlive, tier = "high") {
  const remaster = createChapter15Visuals(scene, mode, base, tier);
  const root = new THREE.Group();
  root.name = `chapter-15-${mode}`;
  scene.add(root);
  const vision = [];
  const interactions = mode === "studio" ? [
    { id: "ch15-note", label: "nota técnica de Hugo", x: 4.25, z: -.65, reach: 1.9 },
    { id: "ch15-channel", label: "canal desconocido", x: -4.15, z: -.75, reach: 2.15 },
    { id: "ch15-tape", label: "cinta alterada", x: 2.2, z: .6, reach: 1.75 },
    { id: "ch15-clock", label: "reloj detenido", x: 9.70, z: -3.1, reach: 2 },
  ] : [
    { id: "ch15-evidence-tito", label: "registro de ventas", x: -8.9, z: 10.9, reach: 2.25 },
    { id: "ch15-evidence-roxy", label: "letra manuscrita", x: 2.55, z: 3.25, reach: 1.95 },
    { id: "ch15-evidence-rulo", label: "funda de cinta", x: 7.55, z: -1.7, reach: 2.2 },
    { id: "ch15-clock", label: "reloj invertido", x: -10.84, z: -7.2, reach: 2.15 },
  ];
  const obstacles = mode === "studio" ? base.obstacles : STORE_OBSTACLES.map(entry => ({ ...entry }));
  const companion = new THREE.Group();
  companion.position.set(mode === "studio" ? -6 : -6.5, 0, mode === "studio" ? 1.75 : 8.4);
  companion.rotation.y = mode === "studio" ? 1.05 : -.6;
  root.add(companion);
  obstacles.push({ id: "ch15-companion", x: companion.position.x, z: companion.position.z, radius: .47 });
  loader.load(COMPANION_URL, gltf => {
    if (!isAlive()) { disposeObjects([gltf.scene]); return; }
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(1.74 / Math.max(size.y, .1));
    box.setFromObject(model);
    model.position.y -= box.min.y;
    model.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
    companion.add(model);
    remaster.registerActor(model);
    if (gltf.animations?.[0]) {
      const mixer = new THREE.AnimationMixer(model);
      mixer.clipAction(gltf.animations[0]).play();
      mixers.push(mixer);
    }
  }, undefined, () => {});
  const mixers = [];

  const evidence = mode === "studio" ? createChapter15Evidence(base, interactions)
    : createChapter15StoreEvidence(base, interactions, obstacles);
  if (mode !== "studio") {
    // Narrow labels sit on three existing sleeves; the original cover maps stay untouched.
    const dateMark = (text, color) => {
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 52;
      const context = canvas.getContext("2d");
      context.fillStyle = "#101826ee"; context.fillRect(0, 0, 320, 52);
      context.strokeStyle = color; context.lineWidth = 3; context.strokeRect(2, 2, 316, 48);
      context.fillStyle = color; context.font = "bold 25px Arial, sans-serif";
      context.textAlign = "center"; context.textBaseline = "middle";
      context.fillText(text, 160, 27);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    };
    for (const [index, normal, revealed] of [[0, "ED. 1999", "FECHA 2049"], [4, "ED. 2001", "ORIGEN 1999"], [8, "SIN FECHA", "CODIGO 2049"]]) {
      const display = base.wallDisplays?.[index];
      if (!display) continue;
      const plane = new THREE.PlaneGeometry(.97, .16);
      const ordinary = new THREE.Mesh(plane, dateMark(normal, "#e9cfae"));
      ordinary.position.set(-.22, -.5, .07); display.add(ordinary);
      const anomaly = new THREE.Mesh(plane.clone(), dateMark(revealed, "#a5f5ee"));
      anomaly.position.set(-.22, -.5, .073); display.add(anomaly); vision.push(anomaly);
    }
  }
  for (const mesh of vision) mesh.visible = false;

  return {
    interactions, obstacles, visuals: remaster,
    onStudioAssetsLoaded() { remaster.onStudioAssetsLoaded(); evidence?.settle(); },
    update(dt, elapsed, progress, paused, reducedMotion, playingVideo = false, player) {
      if (!paused) {
        for (const mixer of mixers) mixer.update(dt);
      }
      for (const mesh of vision) mesh.visible = Boolean(progress?.visionActive);
      evidence?.update(progress);
      remaster.update(dt, progress, paused, reducedMotion, playingVideo, player);
    },
    dispose() { remaster.dispose(); evidence?.dispose(); for (const mixer of mixers) mixer.stopAllAction(); },
  };
}
