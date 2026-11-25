import { test, expect } from "@playwright/test";

test("traffic and Obelisk receivers require an actual aligned orb bounce", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/city-transmitter-harness", route => route.fulfill({ contentType: "text/html", body: "<html><body></body></html>" }));
  await page.goto("/city-transmitter-harness");
  const result = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { buildBuenosAires } = await import("/src/game/buenosAiresScenery.js");
    const { createNeonOrbAbility } = await import("/src/game/neonOrbAbility.js");
    const { normalizeBuenosAiresProgress } = await import("/src/game/buenosAiresQuest.js");
    const events = [], scene = new THREE.Scene();
    const city = buildBuenosAires(scene, { onEvent: event => events.push(event), tier: "low" });
    let progress = normalizeBuenosAiresProgress({ entered: true, introSeen: true, visionActive: true, disconnectedMet: true,
      advertisingComplete: true, trafficSequence: ["senal"], trafficReflectorAligned: true }, true);
    const orb = createNeonOrbAbility(scene, { getTargets: () => city.getTargets(progress),
      getColliders: () => city.colliders, getMaxRange: () => 27,
      onHit: target => city.registerImpact(target, progress) });
    const fire = (player, yaw) => {
      orb.fire({ ...player, y: 0 }, yaw);
      for (let i = 0; i < 100; i++) orb.update(.04, { ...player, y: 0 }, i * .04);
      orb.recall();
      for (let i = 0; i < 100; i++) orb.update(.04, { ...player, y: 0 }, i * .04);
    };
    fire({ x: -32.4, z: -23 }, 0);
    const trafficBounce = events.find(event => event === "traffic-hit:ruta:1");
    progress = normalizeBuenosAiresProgress({ ...progress, trafficComplete: true, trafficSequence: ["senal", "ruta", "control"],
      coreSequence: ["origen"], coreReflectorAligned: true }, true);
    city.update(0, 0, progress, { x: 17, z: 14.5 }, true, null);
    const coreGuide = scene.getObjectByName("Guia del rebote / core");
    const routeShown = coreGuide.visible && coreGuide.getObjectByName("Rebote hacia ENLACE").visible;
    const previewCanvas = document.createElement("canvas"); document.body.append(previewCanvas);
    const previewRenderer = new THREE.WebGLRenderer({ canvas: previewCanvas, antialias: true });
    previewRenderer.setSize(1200, 675); previewRenderer.setPixelRatio(1);
    previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    scene.add(new THREE.HemisphereLight(0xcbe7ff, 0x344455, 1.2));
    const previewCamera = new THREE.PerspectiveCamera(58, 1200 / 675, .1, 180);
    previewCamera.position.set(20, 4.5, 19); previewCamera.lookAt(12.8, 1.2, 8.6);
    previewRenderer.render(scene, previewCamera);
    const previewImage = document.createElement("img"); previewImage.src = previewCanvas.toDataURL();
    document.body.append(previewImage); previewCanvas.remove(); previewRenderer.dispose();
    // A lateral shot should explain why it returns toward BA instead of ENLACE.
    fire({ x: 14, z: 8.45 }, Math.PI / 2);
    const lateralHint = events.includes("core-reflector-misdirected");
    const lateralReachedLink = events.includes("core-hit:enlace:1");
    fire({ x: 17, z: 14.5 }, Math.PI);
    const coreBounce = events.find(event => event === "core-hit:enlace:1");
    const targets = city.getTargets(progress).map(item => item.id);
    await city.flyingVehicles.ready;
    const car = city.flyingVehicles.vehicles.find(vehicle => vehicle.route.id === "renault-fuego");
    const fieldBefore = city.forceField.surface.material.uniforms.uStrength.value;
    city.update(.1, 0, { ...progress, coreComplete: true }, { x: 0, z: 14 }, false, null);
    const eventStarted = events.includes("synchronization-start");
    let stillStart, stillEnd;
    for (let i = 0; i < 80; i++) {
      city.update(.1, i * .1, { ...progress, coreComplete: true }, { x: 0, z: 14 }, false, null);
      if (i === 30) stillStart = car.group.position.clone();
      if (i === 40) stillEnd = car.group.position.clone();
    }
    const eventEnded = events.includes("synchronization-seen");
    const stoppedDistance = stillStart.distanceTo(stillEnd);
    const fieldAfter = city.forceField.surface.material.uniforms.uStrength.value;
    const resumeStart = car.group.position.clone();
    for (let i = 0; i < 20; i++) city.update(.1, 8 + i * .1,
      { ...progress, coreComplete: true, synchronizationSeen: true }, { x: 0, z: 14 }, false, null);
    const resumedDistance = resumeStart.distanceTo(car.group.position);
    orb.dispose(); city.dispose();
    return { trafficBounce, coreBounce, routeShown, lateralHint, lateralReachedLink,
      targets, fieldBefore, fieldAfter, eventStarted, eventEnded,
      stoppedDistance, resumedDistance };
  });
  await page.screenshot({ path: testInfo.outputPath("obelisk-bounce-guide.png"), fullPage: true });
  expect(result.trafficBounce).toBe("traffic-hit:ruta:1");
  expect(result.coreBounce).toBe("core-hit:enlace:1");
  expect(result.routeShown && result.lateralHint).toBe(true);
  expect(result.lateralReachedLink).toBe(false);
  expect(result.targets).toContain("ba-core-enlace");
  expect(result.fieldAfter).toBeLessThan(result.fieldBefore);
  expect(result.eventStarted && result.eventEnded).toBe(true);
  expect(result.stoppedDistance).toBeLessThan(.15);
  expect(result.resumedDistance).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});
