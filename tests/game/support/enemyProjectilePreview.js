import * as THREE from "three";
import { createUnderworldCombat } from "../../../src/game/underworldCombat.js";
import { disposeObjects } from "../../../src/game/disposeGameObjects.js";

// A deterministic WebGL preview of the actual combat effects, including the
// three-way fire volley. No live gameplay or timers can hide shader errors.
export function createEnemyProjectilePreview(reducedMotion = false) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100d19);
  const camera = new THREE.PerspectiveCamera(40, 1000 / 650, .1, 80);
  camera.position.set(25, 10, 12);
  camera.lookAt(23, 1, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1000, 650);
  renderer.setPixelRatio(1);
  renderer.domElement.id = "enemy-projectile-preview";
  Object.assign(renderer.domElement.style, { position: "fixed", inset: "0", zIndex: "99999" });
  document.body.append(renderer.domElement);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 15),
    new THREE.MeshBasicMaterial({ color: 0x1c1827 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(24, -.01, 0);
  const grid = new THREE.GridHelper(16, 16, 0x54425e, 0x2b2536);
  grid.position.x = 24;
  scene.add(floor, grid);
  let hits = 0;
  const combat = createUnderworldCombat(scene, () => { hits++; });
  ["centinela", "gargola", "testigo"].forEach((type, index) => {
    const z = (index - 1) * 3.2;
    const actor = { type, group: { position: new THREE.Vector3(20, 0, z) }, hp: () => 5 };
    combat.fire(actor, { x: 28, y: 0, z });
  });
  const player = { x: 26, y: 0, z: 0 };
  const render = () => renderer.render(scene, camera);
  for (let frame = 0; frame < 25; frame++) combat.update(1 / 60, player, {}, reducedMotion);
  render();
  function showImpact() {
    for (let frame = 0; frame < 90 && !hits; frame++) combat.update(1 / 60, player, {}, reducedMotion);
    for (let frame = 0; frame < 5; frame++) combat.update(1 / 60, player, {}, reducedMotion);
    render();
    let impactVisible = false;
    scene.traverse(object => { if (object.name === "Enemy orb / impact" && object.visible) impactVisible = true; });
    return { hits, impactVisible };
  }
  function dispose() {
    combat.dispose();
    disposeObjects([floor, grid]);
    scene.remove(floor, grid);
    render();
    const remainingGeometry = renderer.info.memory.geometries;
    const remainingTextures = renderer.info.memory.textures;
    renderer.dispose();
    renderer.domElement.remove();
    return { remainingGeometry, remainingTextures };
  }
  return { showImpact, dispose };
}
