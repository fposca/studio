import { test, expect } from "@playwright/test";

test("city PBR materials and shadows render within the static draw budget and release GPU resources", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.route("**/city-graphics-harness", route => route.fulfill({ contentType: "text/html", body: '<html><body style="margin:0;background:#07111f"><canvas id="city"></canvas></body></html>' }));
  await page.goto("/city-graphics-harness");
  const budget = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { buildBuenosAires } = await import("/src/game/buenosAiresScenery.js");
    const { createBuenosAiresReflectionMap } = await import("/src/game/buenosAiresReflections.js");
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
    renderer.setSize(1440, 900); renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.16;
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight());
    const source = createBuenosAiresReflectionMap(), pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromEquirectangular(source); scene.environment = environment.texture; source.dispose(); pmrem.dispose();
    const city = buildBuenosAires(scene, { tier: "high" });
    const camera = new THREE.PerspectiveCamera(54, 1440 / 900, .1, 300);
    camera.position.set(78, 69, 118); camera.lookAt(0, 21, -10);
    city.update(.016, 0, {}, { x: 0, z: 42 }, false);
    renderer.render(scene, camera);
    window.cityGraphics = { city, renderer, scene, camera, environment };
    const geometryCosts = [];
    scene.traverse(mesh => { if (mesh.isMesh) geometryCosts.push({ name: mesh.name || mesh.material.name,
      triangles: (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3 * (mesh.isInstancedMesh ? mesh.count : 1) }); });
    return { geometryCosts: geometryCosts.sort((a, b) => b.triangles - a.triangles).slice(0, 16), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      shadowLights: scene.children[1].children.filter(object => object.isLight && object.castShadow).length };
  });
  await testInfo.attach("city-render-budget", { body: JSON.stringify(budget, null, 2), contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-aerial.png") });
  expect(budget.calls).toBeLessThan(240);
  expect(budget.triangles).toBeLessThan(220_000);
  expect(budget.shadowLights).toBe(1);
  await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.cityGraphics;
    camera.position.set(11, 4.6, 46); camera.lookAt(0, 2.35, 30);
    city.update(.6, 1, {}, { x: 0, z: 36 }, false); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-ba-garden.png") });
  const animation = await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.cityGraphics, player = { x: 0, z: 36 };
    const canvas = document.createElement("canvas"); canvas.width = 1440; canvas.height = 900;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const frame = () => {
      renderer.render(scene, camera); ctx.drawImage(renderer.domElement, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const before = frame();
    for (let i = 0; i < 25; i++) city.update(.1, i * .1, {}, player, false);
    const after = frame();
    // Separate landmark crops exclude the animated advertisements. A tiny colour
    // shift anywhere in the scene is insufficient: the moving light must be visible.
    const changedPixels = ([left, top, right, bottom]) => {
      let count = 0;
      for (let y = Math.floor(top * 900); y < bottom * 900; y++) for (let x = Math.floor(left * 1440); x < right * 1440; x++) {
        const i = (y * 1440 + x) * 4;
        if (Math.max(Math.abs(before[i] - after[i]), Math.abs(before[i + 1] - after[i + 1]), Math.abs(before[i + 2] - after[i + 2])) > 45) count++;
      }
      return count;
    };
    city.update(3, 6, {}, player, true); const paused = frame();
    let pausedPixels = 0;
    for (let i = 0; i < after.length; i += 4)
      if (Math.max(Math.abs(after[i] - paused[i]), Math.abs(after[i + 1] - paused[i + 1]), Math.abs(after[i + 2] - paused[i + 2])) > 3) pausedPixels++;
    return { ba: changedPixels([.35, .35, .69, .7]), obelisk: changedPixels([.69, .03, .83, .52]),
      paused: pausedPixels === 0, pausedPixels };
  });
  await testInfo.attach("landmark-animation-visibility", { body: JSON.stringify(animation), contentType: "application/json" });
  expect(animation.ba).toBeGreaterThan(100);
  expect(animation.obelisk).toBeGreaterThan(80);
  expect(animation.paused).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-led-animation.png") });
  await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.cityGraphics;
    camera.position.set(30, 48, 80); camera.lookAt(0, 6, 15);
    city.update(.6, 1, {}, { x: 0, z: 42 }, false); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-oval-plaza.png") });
  await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.cityGraphics;
    camera.position.set(27, 13, -59); camera.lookAt(0, 1.3, -24);
    city.update(.6, 1, {}, { x: 0, z: -35 }, false); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-north-plaza.png") });
  await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.cityGraphics;
    camera.position.set(-13.8, 2.8, 45.7); camera.lookAt(-20, .95, 39);
    city.update(.6, 1, {}, { x: -17, z: 42 }, false); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-car.png") });
  await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.cityGraphics;
    camera.position.set(-15.7, 1.9, 33.4); camera.lookAt(-20, .95, 39);
    city.update(.1, 4, {}, { x: -17, z: 38 }, false); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-car-front.png") });
  await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.cityGraphics;
    camera.position.set(-21, 14, 38); camera.lookAt(-40.5, 19, 23);
    city.update(.1, 4, {}, { x: -24, z: 25 }, false); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-screen-detail.png") });
  const hologram = await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.cityGraphics;
    const capture = document.createElement("canvas"); capture.width = 1440; capture.height = 900;
    const ctx = capture.getContext("2d", { willReadFrequently: true });
    const frame = () => {
      renderer.render(scene, camera); ctx.drawImage(renderer.domElement, 0, 0);
      // Only the circular instrument on the foreground billboard is in this crop.
      return ctx.getImageData(763, 378, 115, 144).data;
    };
    const player = { x: -24, z: 25 }, before = frame();
    for (let i = 0; i < 12; i++) city.update(.1, 4, {}, player, false);
    const after = frame(); let changed = 0;
    for (let i = 0; i < after.length; i += 4)
      if (Math.max(...[0, 1, 2].map(c => Math.abs(before[i + c] - after[i + c]))) > 24) changed++;
    city.update(3, 7, {}, player, true); const paused = frame();
    return { changed, paused: after.every((value, i) => value === paused[i]) };
  });
  expect(hologram.changed).toBeGreaterThan(80);
  expect(hologram.paused).toBe(true);
  await testInfo.attach("hologram-animation", { body: JSON.stringify(hologram), contentType: "application/json" });

  await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.cityGraphics;
    camera.position.set(-26, 2.6, 39); camera.lookAt(-33, 4, 28);
    city.update(.1, 4, {}, { x: -26, z: 39 }, false); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-street-holograms.png") });
  const low = await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.cityGraphics;
    city.applyQuality("low"); renderer.shadowMap.enabled = false;
    camera.position.set(-62, 3.2, -34); camera.lookAt(0, 25, -5);
    renderer.render(scene, camera);
    return renderer.info.render.calls;
  });
  expect(low).toBeLessThan(170);
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-corrientes.png") });
  const disposed = await page.evaluate(() => {
    const { city, renderer, scene, camera, environment } = window.cityGraphics;
    city.dispose(); environment.dispose(); scene.environment = null; renderer.render(scene, camera);
    const geometryCount = renderer.info.memory.geometries; renderer.dispose(); return geometryCount;
  });
  expect(disposed).toBe(0);
  expect(errors).toEqual([]);
});
