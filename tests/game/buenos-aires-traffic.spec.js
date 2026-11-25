import { test, expect } from "@playwright/test";

test("new avenue traffic loads four designs, circulates continuously and yields safely", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/city-traffic-harness", route => route.fulfill({ contentType: "text/html", body: '<html><body style="margin:0"><canvas></canvas></body></html>' }));
  await page.goto("/city-traffic-harness");
  const result = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { buildBuenosAires } = await import("/src/game/buenosAiresScenery.js");
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xc4dfff, 0x32465a, 1.2));
    const city = buildBuenosAires(scene, { tier: "high" });
    await city.groundVehicles.ready;
    const traffic = city.groundVehicles;
    const count = traffic.cars.filter(car => car.loaded).length;
    const dimensions = traffic.cars.slice(0, 4).map(car => {
      const box = new THREE.Box3().setFromObject(car.group);
      return { model: car.config.modelIndex, size: box.getSize(new THREE.Vector3()).toArray(),
        halfWidth: car.halfWidth, halfLength: car.halfLength };
    });
    let minDistance = Infinity, movingFrames = 0, unsafe = 0;
    const before = traffic.cars.map(car => car.group.position.clone());
    for (let i = 0; i < 1200; i++) {
      traffic.update(1 / 60, { x: 0, z: 42 }, false);
      for (let a = 0; a < traffic.cars.length; a++) for (let b = a + 1; b < traffic.cars.length; b++)
        minDistance = Math.min(minDistance, traffic.cars[a].group.position.distanceTo(traffic.cars[b].group.position));
      movingFrames += traffic.cars.filter((car, index) => car.group.position.distanceTo(before[index]) > .01).length;
      for (let index = 0; index < traffic.cars.length; index++) before[index].copy(traffic.cars[index].group.position);
      unsafe += traffic.cars.filter(car => !Number.isFinite(car.group.position.x) || !Number.isFinite(car.group.position.z)).length;
    }
    const car = traffic.cars.find(item => item.group.position.z > 0 && item.group.position.x < 0);
    const player = { x: car.group.position.x, z: car.group.position.z - 7 };
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, .1, 160);
    camera.position.set(car.group.position.x + 8, 3.5, car.group.position.z + 10);
    camera.lookAt(car.group.position.x, 1, car.group.position.z);
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
    renderer.setSize(1280, 720); renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.render(scene, camera);
    window.trafficPreview = { city, renderer };
    const yielding = traffic.cars.find(item => item.group.position.z < 0 && item.group.position.x < 0);
    const next = yielding.curve.getPointAt(((yielding.distance + .1 * yielding.route.speed) % yielding.length) / yielding.length);
    const hold = yielding.group.position.clone();
    traffic.update(.1, { x: next.x, z: next.z }, false);
    return { count, visible: traffic.cars.filter(car => car.group.visible).length, dimensions,
      minDistance, movingFrames, unsafe, yielded: yielding.group.position.distanceTo(hold) < .001,
      fourEach: [0, 1, 2, 3].map(index => traffic.cars.filter(car => car.config.modelIndex === index).length),
      sharedGeometry: traffic.cars.filter(car => car.config.modelIndex === 0).map(car => car.meshes[0]?.geometry.uuid) };
  });
  await testInfo.attach("traffic-metrics", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("traffic-close.png") });
  expect(result.count).toBe(16); expect(result.visible).toBe(16);
  expect(result.fourEach).toEqual([4, 4, 4, 4]);
  expect(new Set(result.sharedGeometry).size).toBe(1);
  expect(result.dimensions.every(car => car.halfLength > 2.25 && car.halfLength < 2.4)).toBe(true);
  expect(result.minDistance).toBeGreaterThan(4.9);
  expect(result.movingFrames).toBeGreaterThan(12000);
  expect(result.unsafe).toBe(0); expect(result.yielded).toBe(true);
  expect(errors).toEqual([]);
  await page.evaluate(() => { const { city, renderer } = window.trafficPreview; city.dispose(); renderer.dispose(); });
});
