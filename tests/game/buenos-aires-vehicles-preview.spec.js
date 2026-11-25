import { test, expect } from "@playwright/test";

test("optimized Meshy cars retain their painted models", async ({ page }, testInfo) => {
  await page.route("**/flying-preview", route => route.fulfill({ contentType: "text/html", body: '<html><body style="margin:0"><canvas></canvas></body></html>' }));
  await page.goto("/flying-preview");
  const assets = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { GLTFLoader } = await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const { MeshoptDecoder } = await import("/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js");
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
    renderer.setSize(1200, 700); renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x192c42);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x27384b, 3));
    const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(-4, 8, 6); scene.add(key);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const files = ["auto-volador-renault-fuego", "auto-volador-amarrillo", "bsas/auto-volador"];
    const assets = await Promise.all(files.map(async (file, i) => {
      const gltf = await loader.loadAsync(`/src/assets/neonboy-animaciones/${file}.game.glb`);
      gltf.scene.position.x = (i - 1) * 3.5; gltf.scene.scale.setScalar(1.7);
      scene.add(gltf.scene);
      const bounds = new THREE.Box3().setFromObject(gltf.scene);
      let triangles = 0;
      gltf.scene.traverse(child => { if (child.isMesh) triangles += child.geometry.index.count / 3; });
      return { file, size: bounds.getSize(new THREE.Vector3()).toArray(), triangles };
    }));
    const camera = new THREE.PerspectiveCamera(43, 1200 / 700, .1, 100);
    camera.position.set(2, 4, 11); camera.lookAt(0, 0, 0); renderer.render(scene, camera);
    window.preview = { renderer, scene, camera };
    return assets;
  });
  await testInfo.attach("optimized-car-metadata", { body: JSON.stringify(assets), contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("meshy-cars-front.png") });
  await page.evaluate(() => {
    const { renderer, scene, camera } = window.preview;
    camera.position.set(9, 4, 7); camera.lookAt(0, 0, 0); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("meshy-cars-side.png") });
  expect(assets).toHaveLength(3);
});

test("three Meshy cars fly continuously, pause cleanly and react once in view", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.route("**/flying-city-harness", route => route.fulfill({ contentType: "text/html", body: '<html><body style="margin:0"><canvas></canvas></body></html>' }));
  await page.goto("/flying-city-harness");
  const result = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { buildBuenosAires } = await import("/src/game/buenosAiresScenery.js");
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
    renderer.setSize(1440, 900); renderer.setPixelRatio(1);
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight());
    const events = [], city = buildBuenosAires(scene, { onEvent: event => events.push(event) });
    await Promise.all([city.flyingVehicles.ready, city.groundVehicles.ready]);
    const vehicles = city.flyingVehicles.vehicles;
    const loaded = vehicles.map(vehicle => ({ id: vehicle.route.id, loaded: vehicle.loaded,
      model: vehicle.modelPivot.children.some(child => child.getObjectByProperty("isMesh", true)) }));
    const camera = new THREE.PerspectiveCamera(60, 1440 / 900, .1, 230);
    camera.position.set(0, 57, 84); camera.lookAt(0, 26, -8);
    const progress = { introSeen: true, yellowCarSeen: false };
    const player = { x: 18, z: 24 };
    for (let i = 0; i < 120; i++) city.update(.1, i * .1, progress, player, false);
    const together = vehicles.map(vehicle => ({ id: vehicle.route.id, visible: vehicle.group.visible,
      position: vehicle.group.position.toArray(), trail: vehicle.trail?.visible ?? false }));
    renderer.render(scene, camera);
    const calls = renderer.info.render.calls, triangles = renderer.info.render.triangles;
    window.flightPreview = { renderer, scene, city, camera, progress, player, events };
    return { loaded, together, calls, triangles };
  });
  await testInfo.attach("flight-snapshot", { body: JSON.stringify(result), contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("three-meshy-cars-in-buenos-aires.png") });
  expect(result.loaded.every(vehicle => vehicle.loaded && vehicle.model)).toBe(true);
  expect(result.together.every(vehicle => vehicle.visible)).toBe(true);
  expect(result.together[1].trail).toBe(true);
  expect(result.calls).toBeLessThan(260);
  // This full-city view now includes all 16 optimized street cars (about
  // 577k triangles) in addition to the 380k scenery/flying-car budget.
  expect(result.triangles).toBeLessThan(980_000);
  const behavior = await page.evaluate(() => {
    const { city, camera, progress, player, events, renderer, scene } = window.flightPreview;
    const yellow = city.flyingVehicles.vehicles[1];
    const before = yellow.group.position.clone();
    city.update(3, 22, progress, player, true, camera);
    const paused = yellow.group.position.equals(before);
    camera.position.set(yellow.group.position.x, yellow.group.position.y + 2, yellow.group.position.z + 18);
    camera.lookAt(yellow.group.position);
    player.x = yellow.group.position.x; player.z = yellow.group.position.z;
    city.update(.05, 22.05, progress, player, false, camera);
    city.update(.05, 22.1, progress, player, false, camera);
    const sightings = events.filter(event => event === "yellow-car-seen").length;
    city.applyQuality("low");
    const lowTrailHidden = !yellow.trail.visible;
    renderer.setSize(390, 740); camera.aspect = 390 / 740; camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const mobileCalls = renderer.info.render.calls;
    city.dispose(); renderer.dispose();
    return { paused, sightings, lowTrailHidden, mobileCalls };
  });
  expect(behavior.paused).toBe(true);
  expect(behavior.sightings).toBe(1);
  expect(behavior.lowTrailHidden).toBe(true);
  expect(behavior.mobileCalls).toBeLessThan(170);
  expect(errors).toEqual([]);
});

test("both flying cars enter the unobstructed player view after loading", async ({ page }, testInfo) => {
  await page.route("**/flying-street-harness", route => route.fulfill({
    contentType: "text/html", body: '<html><body style="margin:0"><canvas></canvas></body></html>',
  }));
  await page.goto("/flying-street-harness");
  const result = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { buildBuenosAires } = await import("/src/game/buenosAiresScenery.js");
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
    renderer.setSize(1440, 900); renderer.setPixelRatio(1);
    const scene = new THREE.Scene();
    const city = buildBuenosAires(scene, {});
    const camera = new THREE.PerspectiveCamera(63, 1440 / 900, .05, 230);
    camera.position.set(0, 2.7, 46.24); camera.lookAt(0, 1.2, 42);
    const player = { x: 0, z: 42 };
    const progress = { introSeen: false, yellowCarSeen: false };
    // Keep the opening presentation active long enough for the GLBs to finish loading.
    for (let i = 0; i < 50; i++) city.update(.1, i * .1, progress, player, false, camera);
    await city.flyingVehicles.ready;
    city.update(.1, 5.1, progress, player, false, camera);
    const introHeld = city.flyingVehicles.vehicles.every(vehicle => !vehicle.group.visible);
    progress.introSeen = true;
    const assess = vehicle => {
      scene.updateMatrixWorld(true); camera.updateMatrixWorld();
      const box = new THREE.Box3().setFromObject(vehicle.modelPivot);
      const center = box.getCenter(new THREE.Vector3());
      const projected = center.clone().project(camera);
      const direction = center.clone().sub(camera.position);
      const ray = new THREE.Raycaster(camera.position, direction.normalize(), 0, direction.length() - .5);
      return { id: vehicle.route.id, visible: vehicle.group.visible,
        screenX: projected.x, screenY: projected.y, depth: projected.z,
        occluded: ray.intersectObjects(city.colliders, false).length > 0 };
    };
    city.update(.1, 5.2, progress, player, false, camera);
    const red = assess(city.flyingVehicles.vehicles[0]);
    for (let i = 0; i < 42; i++) city.update(.1, 5.2 + i * .1, progress, player, false, camera);
    const yellow = assess(city.flyingVehicles.vehicles[1]);
    renderer.render(scene, camera);
    city.dispose(); renderer.dispose();
    return { introHeld, red, yellow };
  });
  await testInfo.attach("street-view-cars", { body: JSON.stringify(result), contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("cars-from-player-camera.png") });
  expect(result.introHeld).toBe(true);
  for (const car of [result.red, result.yellow]) {
    expect(car.visible).toBe(true);
    expect(car.occluded).toBe(false);
    expect(Math.abs(car.screenX)).toBeLessThan(.9);
    expect(Math.abs(car.screenY)).toBeLessThan(.95);
    expect(car.depth).toBeGreaterThan(0);
    expect(car.depth).toBeLessThan(1);
  }
});
