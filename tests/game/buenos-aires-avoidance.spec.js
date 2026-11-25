import { test, expect } from "@playwright/test";

test("Meshy pedestrians pass smoothly, stay solid and respect pause", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/city-avoidance-harness", route => route.fulfill({ contentType: "text/html", body: '<html><body style="margin:0"><canvas></canvas></body></html>' }));
  await page.goto("/city-avoidance-harness");
  await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { GLTFLoader } = await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const { MeshoptDecoder } = await import("/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js");
    const { createBuenosAiresActors } = await import("/src/game/buenosAiresActors.js");
    const { sampleCityRoute } = await import("/src/game/buenosAiresPopulation.js");
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x18202b);
    scene.add(new THREE.HemisphereLight(0xc6e2ff, 0x5d6471, 2));
    const sun = new THREE.DirectionalLight(0xffeddc, 3); sun.position.set(-30, 8, 25); scene.add(sun);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 40), new THREE.MeshStandardMaterial({ color: 0x4a5260 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(-34, -.01, 25); scene.add(floor);
    const crowd = createBuenosAiresActors(scene);
    for (const actor of crowd.actors) actor.root.position.set(1000 + actor.config.index * 5, 0, 1000);
    const pair = [crowd.actors.find(a => a.config.type === "fatman"), crowd.actors.find(a => a.config.type === "oldman")];
    pair.forEach((a, i) => {
      Object.assign(a.config, { route: 0, direction: i ? -1 : 1, lane: 0, speed: .85 });
      a.distance = i ? 16 : 10;
      const point = sampleCityRoute(0, a.distance, a.config.direction);
      a.root.position.set(point.x, 0, point.z); a.target.copy(a.root.position);
      a.segment = point.segment; a.yaw = a.routeYaw = a.root.rotation.y = point.yaw;
      a.passUntil = a.lane = a.passLane = a.pause = a.blocked = 0;
    });
    const player = { x: -29, z: 25 }, camera = new THREE.PerspectiveCamera(45, 1280 / 720, .1, 100);
    camera.position.set(-26, 5, 34); camera.lookAt(-34, 1, 25);
    await crowd.load(new GLTFLoader().setMeshoptDecoder(MeshoptDecoder));
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
    renderer.setSize(1280, 720); renderer.toneMapping = THREE.ACESFilmicToneMapping;
    let minGap = Infinity, maxTurn = 0, maxStep = 0;
    const advance = frames => {
      for (let n = 0; n < frames; n++) {
        const before = pair.map(a => ({ yaw: a.root.rotation.y, pos: a.root.position.clone() }));
        crowd.update(1 / 60, player, {}, false, camera);
        minGap = Math.min(minGap, pair[0].root.position.distanceTo(pair[1].root.position));
        pair.forEach((a, i) => { maxTurn = Math.max(maxTurn, Math.abs(a.root.rotation.y - before[i].yaw)); maxStep = Math.max(maxStep, a.root.position.distanceTo(before[i].pos)); });
      }
      renderer.render(scene, camera);
    };
    window.avoidance = { crowd, pair, camera, player, advance, renderer, scene, stats: () => ({ minGap, maxTurn, maxStep }) };
    advance(240);
  });
  await page.screenshot({ path: testInfo.outputPath("pedestrians-passing.png") });
  const result = await page.evaluate(() => {
    const { crowd, pair, camera, player, advance, stats } = window.avoidance;
    advance(720);
    const positions = pair.map(a => a.root.position.clone());
    for (let i = 0; i < 60; i++) crowd.update(1 / 60, player, {}, true, camera);
    return { ...stats(), passed: pair[0].root.position.z < pair[1].root.position.z,
      loaded: pair.every(a => a.model && a.currentAction),
      paused: pair.every((a, i) => a.root.position.equals(positions[i])),
      solid: pair.every(a => !crowd.canStand(a.root.position.x, a.root.position.z)) };
  });
  expect(result.loaded).toBe(true); expect(result.passed).toBe(true);
  expect(result.minGap).toBeGreaterThanOrEqual(1.2999);
  expect(result.maxTurn).toBeLessThan(.27); expect(result.maxStep).toBeLessThan(.02);
  expect(result.paused).toBe(true); expect(result.solid).toBe(true); expect(errors).toEqual([]);
  await testInfo.attach("passing-metrics", { body: JSON.stringify(result), contentType: "application/json" });
  await page.evaluate(async () => {
    const { disposeObjects } = await import("/src/game/disposeGameObjects.js");
    const { crowd, scene, renderer } = window.avoidance;
    crowd.dispose(); disposeObjects([scene]); renderer.dispose();
  });
});
