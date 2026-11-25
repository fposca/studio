import { test, expect } from "@playwright/test";

test("wide Obelisk has a visible animated force field, solid perimeter and reachable mission", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.route("**/obelisk-field-harness", route => route.fulfill({ contentType: "text/html",
    body: '<html><body style="margin:0;background:#040b19"><canvas></canvas></body></html>' }));
  await page.goto("/obelisk-field-harness");
  const result = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { buildBuenosAires } = await import("/src/game/buenosAiresScenery.js");
    const { OBELISK_APPROACH, canStandInBuenosAires } = await import("/src/game/buenosAiresLayout.js");
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
    renderer.setSize(1440, 900); renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.16;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight());
    const events = [], city = buildBuenosAires(scene, { onEvent: event => events.push(event) });
    await Promise.all([city.groundVehicles.ready, city.flyingVehicles.ready]);
    const camera = new THREE.PerspectiveCamera(55, 1440 / 900, .1, 240);
    camera.position.set(21, 5.2, 24); camera.lookAt(0, 3.6, -5);
    const player = { ...OBELISK_APPROACH };
    city.update(.016, 0, {}, player, false, camera);
    city.update(.016, 0, {}, player, false, camera);
    const shaft = scene.getObjectByName("Obelisco / piedra de cuatro caras");
    const size = new THREE.Box3().setFromObject(shaft).getSize(new THREE.Vector3());
    const field = city.forceField.surface;
    // Isolate the membrane to measure its animation rather than nearby LEDs.
    const fieldScene = new THREE.Scene(); fieldScene.background = new THREE.Color(0x07111b);
    const membrane = new THREE.Mesh(field.geometry, field.material);
    membrane.position.copy(city.forceField.root.position); fieldScene.add(membrane);
    const capture = document.createElement("canvas"); capture.width = 1440; capture.height = 900;
    const ctx = capture.getContext("2d", { willReadFrequently: true });
    const frame = () => { renderer.render(fieldScene, camera); ctx.drawImage(renderer.domElement, 0, 0);
      return ctx.getImageData(0, 0, 1440, 900).data; };
    const before = frame();
    for (let i = 0; i < 18; i++) city.update(.1, i * .1, {}, player, false, camera);
    const after = frame(); let changed = 0, luminous = 0;
    for (let i = 0; i < before.length; i += 4) {
      if (Math.max(...[0, 1, 2].map(c => Math.abs(before[i + c] - after[i + c]))) > 20) changed++;
      if (after[i + 1] > 80 && after[i + 2] > 100 && after[i] < after[i + 1]) luminous++;
    }
    city.update(3, 3, {}, player, true, camera); const paused = frame();
    renderer.render(scene, camera);
    window.forceFieldTest = { city, scene, camera, renderer };
    const interaction = city.interactions.find(item => item.id === "ba-obelisk");
    return { width: size.x, depth: size.z, changed, luminous, paused: after.every((v, i) => v === paused[i]),
      explorationEvents: events.filter(event => event === "obelisk-explored").length,
      accessible: canStandInBuenosAires(interaction.x, interaction.z),
      solid: !city.canStand(0, 7), transparent: field.material.transparent && !field.material.depthWrite };
  });
  await testInfo.attach("force-field-metrics", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("obelisk-force-field-close.png") });
  expect(result.width).toBeGreaterThan(19); expect(result.depth).toBeGreaterThan(19);
  expect(result.changed).toBeGreaterThan(500); expect(result.luminous).toBeGreaterThan(500);
  expect(result.paused).toBe(true); expect(result.explorationEvents).toBe(1);
  expect(result.accessible && result.solid && result.transparent).toBe(true);
  await page.evaluate(() => {
    const { city, scene, camera, renderer } = window.forceFieldTest;
    camera.position.set(43, 29, 67); camera.lookAt(0, 28, -5); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("obelisk-force-field-overview.png") });
  const memory = await page.evaluate(() => {
    const { city, scene, camera, renderer } = window.forceFieldTest;
    city.dispose(); renderer.render(scene, camera); const memory = { ...renderer.info.memory }; renderer.dispose(); return memory;
  });
  expect(memory.geometries).toBe(0); expect(errors).toEqual([]);
});
