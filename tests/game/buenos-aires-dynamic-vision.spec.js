import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test("Matrix covers loaded citizens, crowd LOD, road traffic, flying cars and the Vigilante without extra draws", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.route("**/city-dynamic-vision", route => route.fulfill({ contentType: "text/html",
    body: '<html><body style="margin:0;background:#07111f;color:white;font:14px sans-serif"><canvas></canvas></body></html>' }));
  await page.goto("/city-dynamic-vision");
  const result = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { GLTFLoader } = await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const { MeshoptDecoder } = await import("/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js");
    const { buildBuenosAires } = await import("/src/game/buenosAiresScenery.js");
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
    renderer.setSize(360, 360); renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Three.js retains a renderer-owned DFG lighting LUT after using PBR.
    // Warm it independently so city cleanup is compared against a real baseline.
    const camera = new THREE.PerspectiveCamera(45, 1, .01, 300); camera.position.z = 3;
    const baselineScene = new THREE.Scene();
    const warmup = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    baselineScene.add(warmup); renderer.render(baselineScene, camera);
    warmup.removeFromParent(); warmup.geometry.dispose(); warmup.material.dispose();
    renderer.render(baselineScene, camera);
    const baseline = { ...renderer.info.memory };
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight());
    const city = buildBuenosAires(scene);
    const player = { x: 0, z: 42 };
    const progress = { introSeen: true, visionActive: true, citizens: ["a", "b", "c"], signalFound: true };
    // Toggle BEFORE asynchronous assets finish: their very first frame must be coded.
    city.update(0, 0, progress, player, true, camera);
    await Promise.all([city.actors.load(new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)),
      city.groundVehicles.ready, city.flyingVehicles.ready, city.vigilante.loadAssets()]);
    city.update(0, 0, progress, player, true, camera);
    const meshes = root => { const out = []; root.traverse(o => { if (o.isMesh) out.push(o); }); return out; };
    const materialCoded = mesh => [mesh.material].flat().every(m => Boolean(m.defines?.INVASION_DYNAMIC));
    const near = city.actors.actors.filter(a => a.model);
    const road = city.groundVehicles.cars.filter(c => c.loaded);
    const flying = city.flyingVehicles.vehicles.filter(c => c.loaded);
    const crowds = meshes(city.actors.group).filter(o => o.isInstancedMesh);
    const loadedCoded = near.length > 0 && road.length === 16 && flying.length === 3 && crowds.length === 7 &&
      near.every(a => meshes(a.model).every(materialCoded)) && road.every(c => c.meshes.every(materialCoded)) &&
      flying.every(c => meshes(c.modelPivot).every(materialCoded)) && crowds.every(materialCoded);
    // Let the existing action fade-in reach a walking pose before comparison.
    for (let i = 0; i < 8; i++) city.update(.05, i * .05, progress, player, false, camera);
    const roadShared = road.every(car => car.meshes[0].material === road.find(c => c.config.modelIndex === car.config.modelIndex).meshes[0].material);
    const phoneColorsPreserved = city.actors.actors.every(a => !a.phoneGlow.material.defines?.INVASION_DYNAMIC &&
      a.phoneGlow.material.color.getHex() === 0x9c6aff);
    const enginesPreserved = flying.every(car => car.pulses.every(p => !p.material.defines?.INVASION_DYNAMIC));
    const studio = new THREE.Scene(); studio.background = new THREE.Color(0x07111f);
    studio.add(new THREE.HemisphereLight(0xffffff, 0x505060, 2));
    const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(3, 5, 6); studio.add(key);
    const copy = document.createElement("canvas"); copy.width = copy.height = 360;
    const ctx = copy.getContext("2d", { willReadFrequently: true });
    const gallery = document.createElement("div"); gallery.style.cssText = "display:grid;grid-template-columns:repeat(4,360px);gap:6px";
    document.body.append(gallery);
    const capture = () => {
      renderer.render(studio, camera); ctx.drawImage(renderer.domElement, 0, 0);
      return ctx.getImageData(0, 0, 360, 360).data;
    };
    const green = pixels => { let n = 0; for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i + 1] > 40 && pixels[i + 1] > pixels[i] * 1.35 && pixels[i + 1] > pixels[i + 2] * 1.2) n++; return n; };
    const different = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4)
      if (Math.abs(a[i + 1] - b[i + 1]) > 20) n++; return n; };
    const preview = label => { const panel = document.createElement("div"); panel.textContent = label;
      const img = document.createElement("img"); img.src = copy.toDataURL(); panel.append(img); gallery.append(panel); };
    function probe(node, name, crowd = false) {
      const parent = node.parent, visible = node.visible;
      scene.updateMatrixWorld(true); studio.attach(node); node.visible = true;
      let count, firstMatrix;
      if (crowd) {
        count = node.count; firstMatrix = new THREE.Matrix4(); node.getMatrixAt(0, firstMatrix);
        node.count = 1; node.setMatrixAt(0, new THREE.Matrix4()); node.instanceMatrix.needsUpdate = true;
        node.computeBoundingBox();
      }
      const bounds = new THREE.Box3().setFromObject(node), center = bounds.getCenter(new THREE.Vector3());
      const radius = bounds.getSize(new THREE.Vector3()).length() * .5;
      const direction = crowd ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(.65, .25, 1).normalize();
      camera.position.copy(center).addScaledVector(direction, radius / Math.sin(Math.PI / 8) * 1.08); camera.lookAt(center);
      // No simulation between samples: exactly the same pose, lighting and geometry.
      progress.visionActive = false; city.update(0, 0, progress, player, true, camera);
      if (crowd) { node.count = 1; node.setMatrixAt(0, new THREE.Matrix4()); node.instanceMatrix.needsUpdate = true; }
      const normal = capture(), normalCalls = renderer.info.render.calls;
      preview(name + " / normal");
      progress.visionActive = true; city.update(0, 0, progress, player, true, camera);
      // The city crowd updater writes instance transforms; isolate this one again.
      if (crowd) { node.count = 1; node.setMatrixAt(0, new THREE.Matrix4()); node.instanceMatrix.needsUpdate = true; }
      const coded = capture(), codedCalls = renderer.info.render.calls;
      preview(name + " / Matrix");
      progress.visionActive = false; city.update(0, 0, progress, player, true, camera);
      if (crowd) { node.count = 1; node.setMatrixAt(0, new THREE.Matrix4()); node.instanceMatrix.needsUpdate = true; }
      const restored = capture();
      if (crowd) { node.count = count; node.setMatrixAt(0, firstMatrix); node.instanceMatrix.needsUpdate = true; node.computeBoundingBox(); }
      parent.attach(node); node.visible = visible;
      return { name, normal: green(normal), coded: green(coded), changed: different(normal, coded),
        restored: different(normal, restored), normalCalls, codedCalls };
    }
    const samples = [];
    samples.push(probe(near[0].pivot, "Peaton animado"));
    for (let i = 0; i < 4; i++) samples.push(probe(road.find(car => car.config.modelIndex === i).group.children[0], "Transito " + (i + 1)));
    for (const car of flying) samples.push(probe(car.modelPivot, car.route.id));
    samples.push(probe(city.vigilante.body.getObjectByName("Vigilante / Meshy optimizado").parent, "Vigilante"));
    // Exercise Basic + instancing + the pre-existing atlas shader together.
    samples.push(probe(crowds.find(c => c.count > 0) || crowds[0], "Peaton LOD", true));
    const released = near.flatMap(a => meshes(a.model));
    const heldMaterials = new Map(released.map(mesh => [mesh, mesh.material]));
    // Repeated quality/distance changes must release old skeleton registrations,
    // reuse variants and keep newly acquired models coded in low/mobile profiles.
    const tiers = [];
    for (const tier of ["low", "medium", "high", "low"]) {
      player.x = tier === "high" ? 35 : -35; player.z = -24;
      city.actors.update(.5, player, progress, false, camera); city.applyQuality(tier);
      const active = city.actors.actors.filter(a => a.model);
      tiers.push({ tier, count: active.length, coded: active.every(a => meshes(a.model).every(materialCoded)) });
    }
    const activeMeshes = new Set(city.actors.actors.flatMap(a => a.model ? meshes(a.model) : []));
    const retired = released.filter(m => !activeMeshes.has(m));
    const retiredRestored = retired.length > 0 && retired.every(m => m.material !== heldMaterials.get(m) && !m.material.defines?.INVASION_DYNAMIC);
    city.dispose(); renderer.render(scene, camera);
    const remaining = { ...renderer.info.memory }; renderer.dispose(); renderer.domElement.remove();
    return { loadedCoded, roadShared, phoneColorsPreserved, enginesPreserved, samples, tiers, retiredRestored, baseline, remaining };
  });
  await writeFile(testInfo.outputPath("matrix-metrics.json"), JSON.stringify(result, null, 2));
  await testInfo.attach("dynamic-matrix-render-metrics", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath("matrix-model-comparisons.png"), fullPage: true });
  expect(result.loadedCoded).toBe(true);
  expect(result.roadShared && result.phoneColorsPreserved && result.enginesPreserved).toBe(true);
  for (const sample of result.samples) {
    expect(sample.coded, sample.name).toBeGreaterThan(sample.normal + 300);
    expect(sample.changed, sample.name).toBeGreaterThan(500);
    expect(sample.restored, sample.name).toBe(0);
    expect(sample.codedCalls, sample.name).toBe(sample.normalCalls);
  }
  expect(result.tiers.every(t => t.count > 0 && t.coded)).toBe(true);
  expect(result.retiredRestored).toBe(true);
  expect(result.remaining).toEqual(result.baseline);
  expect(errors).toEqual([]);
});
