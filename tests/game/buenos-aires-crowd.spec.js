import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test("city crowd respects LOD budgets, moves on pavements, synchronizes once and releases GPU resources", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.route("**/city-crowd-harness", route => route.fulfill({ contentType: "text/html", body: '<html><body style="margin:0"><canvas></canvas></body></html>' }));
  await page.goto("/city-crowd-harness");
  const result = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { GLTFLoader } = await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const { MeshoptDecoder } = await import("/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js");
    const { buildBuenosAires } = await import("/src/game/buenosAiresScenery.js");
    const { canCitizenStand, populationProfile } = await import("/src/game/buenosAiresPopulation.js");
    const { initialCathedralTier } = await import("/src/game/cathedralQuality.js");
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
    renderer.setSize(1440, 900); renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.16;
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight());
    const city = buildBuenosAires(scene);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const promise = city.actors.load(loader);
    const sameLoad = promise === city.actors.load(loader);
    await promise; await city.flyingVehicles.ready;
    const camera = new THREE.PerspectiveCamera(55, 1440 / 900, .1, 230);
    let player = { x: 0, z: 42 };
    const progress = { introSeen: true, citizens: [] };
    const step = (dt = .1, paused = false) => city.update(dt, 0, progress, player, paused, camera);
    const stats = [], unsafe = [], limits = [];
    const positions = [{ x: 0, z: 42 }, { x: -35, z: -24 }, { x: 35, z: -24 }, { x: 0, z: -20 }];
    for (const tier of ["high", "medium", "low"]) {
      city.applyQuality(tier); renderer.shadowMap.enabled = tier !== "low";
      const profile = populationProfile(tier);
      for (const point of positions) {
        player = point; camera.position.set(point.x + 8, 5, point.z + 13); camera.lookAt(point.x, 1.2, point.z - 6);
        for (let i = 0; i < 160; i++) {
          step();
          const current = city.actors.getStats();
          if (current.near > profile.near || current.middle > profile.middle || current.far > profile.far || current.skeletons > profile.near || current.nearTriangles > (profile.maxNearTriangles ?? Infinity)) limits.push(current);
          for (const actor of city.actors.actors) if (!canCitizenStand(actor.root.position.x, actor.root.position.z)) unsafe.push(actor.config.id);
        }
        renderer.render(scene, camera);
        stats.push({ ...city.actors.getStats(), player, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles });
      }
    }
    city.applyQuality("high"); renderer.shadowMap.enabled = true; player = { x: -35, z: -24 }; step();
    const inactive = city.actors.actors.filter(a => a.lod === "off").map(a => ({ a, distance: a.distance }));
    for (let i = 0; i < 4; i++) step();
    const inactiveFrozen = inactive.every(({ a, distance }) => a.lod !== "off" || a.distance === distance);
    const activation = city.triggerCollectiveSynchronization({ id: "mission-test", player });
    const duplicateDuring = city.triggerCollectiveSynchronization({ id: "mission-test", player });
    const members = city.actors.actors.filter(a => a.synchronized);
    const starting = members.map(a => a.root.position.clone());
    for (let i = 0; i < 11; i++) step();
    const still = members.map(a => ({ yaw: a.root.rotation.y, time: a.mixer?.time }));
    for (let i = 0; i < 27; i++) step();
    const frozen = members.every((a, i) => a.root.position.distanceTo(starting[i]) < .00001 &&
      a.root.rotation.y === still[i].yaw && (!a.mixer || a.mixer.time === still[i].time));
    for (let i = 0; i < 8; i++) step(.1, true);
    const pausedSync = city.actors.getStats().synchronized === members.length;
    for (let i = 0; i < 80; i++) step();
    const resumed = members.some((a, i) => a.root.position.distanceTo(starting[i]) > .3);
    const duplicateAfter = city.triggerCollectiveSynchronization({ id: "mission-test", player });
    const ambientReaction = city.actors.react("ba-crowd-0", player);
    const interactions = city.actors.interactions.map(a => a.id);
    window.crowdTest = { city, scene, renderer, camera, step, setPlayer: value => { player = value; } };
    return { sameLoad, stats, unsafe: [...new Set(unsafe)], limits, inactiveFrozen,
      activation, duplicateDuring, duplicateAfter, members: members.length, frozen, resumed, pausedSync,
      unique: city.actors.actors.filter(a => a.config.type === "disconnected").length,
      disconnectedSynced: members.some(a => a.config.type === "disconnected"),
      ambientReaction, interactions, mobile: [
        initialCathedralTier({ userAgent: "Android", deviceMemory: 4, hardwareConcurrency: 4 }),
        initialCathedralTier({ userAgent: "Android", deviceMemory: 8, hardwareConcurrency: 8 }),
      ] };
  });
  await writeFile(testInfo.outputPath("population-metrics.json"), JSON.stringify(result, null, 2));
  await testInfo.attach("population-profiles-and-render-cost", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
  expect(result.sameLoad).toBe(true); expect(result.unique).toBe(1);
  expect(result.interactions).toHaveLength(11); expect(result.interactions.some(id => id.startsWith("ba-crowd"))).toBe(false);
  expect(result.unsafe).toEqual([]); expect(result.limits).toEqual([]); expect(result.inactiveFrozen).toBe(true);
  expect(result.activation).toBe(true); expect(result.members).toBeGreaterThan(3);
  expect(result.duplicateDuring).toBe(false); expect(result.duplicateAfter).toBe(false);
  expect(result.disconnectedSynced).toBe(false); expect(result.frozen).toBe(true); expect(result.pausedSync).toBe(true);
  expect(result.resumed).toBe(true); expect(result.ambientReaction).toBe(false);
  expect(result.mobile).toEqual(["low", "medium"]);
  for (const stats of result.stats) {
    expect(stats.calls).toBeLessThan(stats.tier === "low" ? 200 : 300);
    expect(stats.triangles).toBeLessThan({ high: 1_250_000, medium: 1_000_000, low: 650_000 }[stats.tier]);
  }
  await page.evaluate(() => {
    const { city, camera, renderer, scene, step, setPlayer } = window.crowdTest;
    city.applyQuality("high"); setPlayer({ x: -36, z: -23 });
    camera.position.set(-35, 2.7, -11); camera.lookAt(-43, 1.2, -31);
    for (let i = 0; i < 10; i++) step(); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("corrientes-crowd.png") });
  await page.evaluate(() => {
    const { city, camera, renderer, scene, step, setPlayer } = window.crowdTest;
    setPlayer({ x: 0, z: 38 }); camera.position.set(5, 3.2, 46); camera.lookAt(-3, 1.2, 23);
    for (let i = 0; i < 10; i++) step(); renderer.render(scene, camera);
  });
  await page.screenshot({ path: testInfo.outputPath("obelisk-crowd.png") });
  const mobile = await page.evaluate(async () => {
    const { city, renderer, scene, camera, step } = window.crowdTest;
    city.applyQuality("low"); renderer.shadowMap.enabled = false;
    renderer.setSize(800, 450); camera.aspect = 800 / 450; camera.updateProjectionMatrix();
    const times = []; let previous;
    for (let i = 0; i < 60; i++) {
      const now = await new Promise(requestAnimationFrame);
      if (previous) times.push(now - previous); previous = now;
      step(.016); renderer.render(scene, camera);
    }
    times.sort((a, b) => a - b);
    return { ...city.actors.getStats(), medianFrameMs: times[Math.floor(times.length / 2)], p95FrameMs: times[Math.floor(times.length * .95)],
      calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
  });
  await writeFile(testInfo.outputPath("mobile-metrics.json"), JSON.stringify(mobile, null, 2));
  await testInfo.attach("mobile-budget-desktop-browser-emulation", { body: JSON.stringify(mobile, null, 2), contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("mobile-crowd.png") });
  const disposed = await page.evaluate(() => {
    const { city, renderer, scene, camera } = window.crowdTest;
    city.dispose(); renderer.render(scene, camera);
    const memory = { ...renderer.info.memory }; renderer.dispose(); return memory;
  });
  expect(disposed.geometries).toBe(0);
  expect(errors).toEqual([]);
});
