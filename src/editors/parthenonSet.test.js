import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  bindParthenonLighting,
  createFlutedDoricShaftGeometry,
  createWeatheredSlabGeometry,
  createParthenonSet,
  normalizeParthenonLighting,
  parthenonColumnPositions,
  PARTHENON_PERIODS
} from "./parthenonSet.js";
import { parthenonTerrainHeight, createParthenonTerrain } from "./parthenonLandscape.js";

test("the Parthenon has the historical eight-by-seventeen Doric colonnade", () => {
  const positions = parthenonColumnPositions();
  assert.equal(positions.length, 46);
  assert.equal(positions.filter(([, z]) => z === -8.1).length, 8);
  assert.equal(positions.filter(([, z]) => z === -39.1).length, 8);
  assert.equal(new Set(positions.map(([x, z]) => `${x},${z}`)).size, positions.length);
});

test("column shafts have actual fluted relief and valid surface normals", () => {
  const geometry = createFlutedDoricShaftGeometry();
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const middleRadii = [];
  for (let index = 0; index < position.count; index += 1) {
    if (Math.abs(position.getY(index)) < 0.01) {
      const radius = Math.hypot(position.getX(index), position.getZ(index));
      if (radius > 0.2) middleRadii.push(radius);
    }
    assert.ok(Number.isFinite(normal.getX(index)));
    assert.ok(Number.isFinite(normal.getY(index)));
    assert.ok(Number.isFinite(normal.getZ(index)));
  }
  assert.ok(Math.max(...middleRadii) - Math.min(...middleRadii) > 0.025);
  geometry.dispose();
});

test("day, sunset and night remain distinct and invalid saved modes fall back to day", () => {
  assert.deepEqual(PARTHENON_PERIODS.map(({ id }) => id), ["day", "sunset", "night"]);
  assert.deepEqual(normalizeParthenonLighting({ period: "night" }), { period: "night" });
  assert.deepEqual(normalizeParthenonLighting({ period: "invalid" }), { period: "day" });
  assert.notEqual(PARTHENON_PERIODS[0].skyTop, PARTHENON_PERIODS[2].skyTop);
  const set = createParthenonSet();
  assert.equal(set.visible, false);
  assert.equal(set.children.length, 0);
  set.userData.animate(false, { period: "night" });
  assert.equal(set.children.length, 0);
  set.userData.dispose();
});

test("Parthenon lighting applies only while visible and restores shared scene lights", () => {
  const scene = new THREE.Scene();
  scene.environmentIntensity = 0.8;
  const ambient = new THREE.HemisphereLight(0xffffff, 0x555555, 1.2);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2);
  keyLight.castShadow = true;
  const floor = new THREE.Object3D();
  const set = new THREE.Group();
  set.userData.period = "night";
  const original = {
    ambient: ambient.intensity, ambientColor: ambient.color.clone(), groundColor: ambient.groundColor.clone(),
    key: keyLight.intensity, keyColor: keyLight.color.clone(), environment: scene.environmentIntensity
  };
  const before = scene.onBeforeRender, after = scene.onAfterRender;
  const detach = bindParthenonLighting(scene, set, { ambient, keyLight, floor });
  set.visible = false;
  scene.onBeforeRender();
  assert.equal(ambient.intensity, original.ambient);
  assert.equal(floor.visible, true);
  set.visible = true;
  scene.onBeforeRender();
  assert.ok(ambient.intensity < original.ambient);
  assert.ok(keyLight.intensity < original.key);
  assert.ok(scene.environmentIntensity < original.environment);
  assert.equal(floor.visible, false);
  assert.equal(keyLight.castShadow, false);
  scene.onAfterRender();
  assert.equal(ambient.intensity, original.ambient);
  assert.ok(ambient.color.equals(original.ambientColor));
  assert.ok(ambient.groundColor.equals(original.groundColor));
  assert.equal(keyLight.intensity, original.key);
  assert.ok(keyLight.color.equals(original.keyColor));
  assert.equal(scene.environmentIntensity, original.environment);
  assert.equal(floor.visible, true);
  assert.equal(keyLight.castShadow, true);
  detach();
  assert.equal(scene.onBeforeRender, before);
  assert.equal(scene.onAfterRender, after);
});

test("weathered paving stays under character feet and has bevels and finite UVs", () => {
  const geometry = createWeatheredSlabGeometry(1.92, 1.105, 2);
  geometry.computeBoundingBox();
  assert.ok(geometry.boundingBox.max.y <= 0.007);
  assert.ok(geometry.boundingBox.min.y > -0.15);
  assert.ok(geometry.attributes.position.count > 36);
  for (const value of geometry.attributes.uv.array) assert.ok(Number.isFinite(value));
  geometry.dispose();
});

test("terrain keeps the stage flat while giving the distant landscape actual relief", () => {
  for (const [x, z] of [[0, 0], [-10, 5], [10, -20], [0, -39]]) {
    assert.equal(parthenonTerrainHeight(x, z), -0.15);
  }
  const heights = [80, 110, 170, 220].map(x => parthenonTerrainHeight(x, -80));
  assert.ok(Math.max(...heights) - Math.min(...heights) > 4);
  const material = new THREE.MeshStandardMaterial();
  const terrain = createParthenonTerrain(material);
  for (const value of terrain.geometry.attributes.normal.array) assert.ok(Number.isFinite(value));
  terrain.geometry.dispose();
  material.dispose();
});

test("period changes move the shadow light, pause is deterministic, and disposal releases resources", (t) => {
  t.mock.method(THREE.TextureLoader.prototype, "load", () => new THREE.Texture());
  const set = createParthenonSet();
  set.userData.animate(true, { period: "day" }, 1000);
  const sun = set.userData.sunLight;
  assert.equal(sun.castShadow, true);
  const daylight = sun.position.clone();
  set.userData.animate(true, { period: "sunset" }, 1000);
  assert.ok(sun.position.y < daylight.y);
  set.userData.animate(true, { period: "night" }, 1800);
  assert.notEqual(sun.position.x, daylight.x);
  const fire = set.getObjectByName("Fuego del brasero");
  const pausedScale = fire.scale.y;
  set.userData.animate(true, { period: "night" }, 1800);
  assert.equal(fire.scale.y, pausedScale);
  set.userData.animate(true, { period: "night" }, 1950);
  assert.notEqual(fire.scale.y, pausedScale);
  const shaft = set.getObjectByName("Columnas doricas estriadas");
  let geometryDisposed = 0, textureDisposed = 0, shadowDisposed = 0;
  shaft.geometry.addEventListener("dispose", () => geometryDisposed++);
  shaft.material.map.addEventListener("dispose", () => textureDisposed++);
  sun.shadow.map = new THREE.WebGLRenderTarget(16, 16);
  sun.shadow.map.addEventListener("dispose", () => shadowDisposed++);
  set.userData.dispose();
  assert.equal(geometryDisposed, 1);
  assert.equal(textureDisposed, 1);
  assert.equal(shadowDisposed, 1);
  set.userData.animate(true, { period: "day" });
  assert.equal(set.visible, false);
});

test("render-scoped floor and fog are restored on detach and user fog is preserved", () => {
  const scene = new THREE.Scene();
  const floor = new THREE.Object3D();
  const ambient = new THREE.HemisphereLight();
  const keyLight = new THREE.DirectionalLight();
  const set = new THREE.Group();
  set.userData.atmosphere = new THREE.Fog(0xaabbcc, 70, 280);
  const detach = bindParthenonLighting(scene, set, { ambient, keyLight, floor });
  scene.onBeforeRender();
  assert.equal(scene.fog, set.userData.atmosphere);
  scene.onAfterRender();
  assert.equal(scene.fog, null);
  const userFog = new THREE.FogExp2(0xabcdef, 0.01);
  scene.fog = userFog;
  floor.visible = false;
  scene.onBeforeRender();
  assert.equal(scene.fog, userFog);
  detach();
  assert.equal(floor.visible, false);
  assert.equal(scene.fog, userFog);
});
