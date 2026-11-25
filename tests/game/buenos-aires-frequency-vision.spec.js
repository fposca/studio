import { test, expect } from "@playwright/test";

for (const tier of ["high", "low"]) {
  test(`city ${tier}: Matrix glyphs animate on the actual scenery while receivers and anomalies remain readable`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await page.route("**/city-frequency-harness", route => route.fulfill({ contentType: "text/html",
      body: '<html><body style="margin:0;background:#07111f"><canvas></canvas></body></html>' }));
    await page.goto("/city-frequency-harness");
    const result = await page.evaluate(async tier => {
      const THREE = await import("/node_modules/three/build/three.module.js");
      const { buildBuenosAires } = await import("/src/game/buenosAiresScenery.js");
      const { createBuenosAiresReflectionMap } = await import("/src/game/buenosAiresReflections.js");
      const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });
      renderer.setSize(1200, 800); renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = tier !== "low"; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.16;
      const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight());
      const source = createBuenosAiresReflectionMap(), pmrem = new THREE.PMREMGenerator(renderer);
      const environment = pmrem.fromEquirectangular(source); scene.environment = environment.texture; source.dispose(); pmrem.dispose();
      const city = buildBuenosAires(scene, { tier });
      // Keep asynchronous traffic loads out of the exact paused-frame comparison.
      await Promise.all([city.groundVehicles.ready, city.flyingVehicles.ready]);
      const camera = new THREE.PerspectiveCamera(54, 1.5, .1, 260);
      camera.position.set(4.6, 3.5, 18); camera.lookAt(0, 1.05, 8.9);
      const player = { x: 0, z: 14 }, progress = { entered: true, introSeen: true,
        disconnectedMet: true, advertisingComplete: true, trafficComplete: true, citizens: ["a", "b", "c"] };
      const copy = document.createElement("canvas"); copy.width = 1200; copy.height = 800;
      const ctx = copy.getContext("2d", { willReadFrequently: true });
      const frame = () => { renderer.render(scene, camera); ctx.drawImage(renderer.domElement, 0, 0); return ctx.getImageData(0, 0, 1200, 800).data; };
      // A floor crop excludes the HUD, floating signs, grass and Obelisk LEDs.
      const green = pixels => {
        let count = 0;
        for (let y = 590; y < 750; y++) for (let x = 130; x < 1050; x++) {
          const i = (y * 1200 + x) * 4;
          if (pixels[i + 1] > 35 && pixels[i + 1] > pixels[i] * 1.35 && pixels[i + 1] > pixels[i + 2] * 1.2) count++;
        }
        return count;
      };
      city.update(0, 0, progress, player, true, camera);
      const normal = green(frame());
      const label = scene.getObjectByName("Frecuencia decodificada / origen");
      const hiddenBefore = !label.visible;
      progress.visionActive = true;
      // Saved games with vision already active must render the correct first frame.
      city.update(0, 0, progress, player, true, camera);
      const first = frame(), coded = green(first), revealed = label.visible && label.parent.visible;
      for (let i = 0; i < 15; i++) city.update(.05, i * .05, progress, player, false, camera);
      const moving = frame(); let movingGlyphs = 0;
      for (let y = 590; y < 750; y++) for (let x = 130; x < 1050; x++) {
        const i = (y * 1200 + x) * 4;
        if (Math.abs(first[i + 1] - moving[i + 1]) > 35) movingGlyphs++;
      }
      city.update(2, 4, progress, player, true, camera);
      const paused = frame();
      let changed = 0, changedSmall = 0, maxDelta = 0;
      for (let i = 0; i < paused.length; i += 4) {
        const delta = Math.abs(paused[i] - moving[i]) + Math.abs(paused[i+1] - moving[i+1]) + Math.abs(paused[i+2] - moving[i+2]);
        if (delta > 0) changedSmall++;
        maxDelta = Math.max(maxDelta, delta);
        if (delta > 3) changed++;
      }
      const frozen = changed === 0 && changedSmall < 1000 && maxDelta <= 3;
      const activeCalls = renderer.info.render.calls;
      window.frequencyPreview = { city, renderer, scene, camera, environment, progress, player };
      return { normal, coded, hiddenBefore, revealed, movingGlyphs, frozen, changed, changedSmall, maxDelta, activeCalls };
    }, tier);
    await page.screenshot({ path: testInfo.outputPath(`city-matrix-${tier}.png`) });
    expect(result.coded).toBeGreaterThan(result.normal + 7000);
    expect(result.hiddenBefore && result.revealed).toBe(true);
    expect(result.movingGlyphs).toBeGreaterThan(1000);
    await testInfo.attach("frequency-render", { body: JSON.stringify(result), contentType: "application/json" });
    const restored = await page.evaluate(() => {
      const { city, renderer, scene, camera, progress, player } = window.frequencyPreview;
      progress.visionActive = false; city.update(0, 0, progress, player, true, camera);
      camera.position.set(1.9, 2.3, 12.8); camera.lookAt(0, 1, 9);
      renderer.render(scene, camera);
      return !scene.getObjectByName("Frecuencia decodificada / origen").visible;
    });
    expect(restored).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`city-receiver-${tier}.png`) });
    const remaining = await page.evaluate(() => {
      const { city, renderer, scene, camera, environment } = window.frequencyPreview;
      city.dispose(); environment.dispose(); scene.environment = null; renderer.render(scene, camera);
      const count = renderer.info.memory.geometries; renderer.dispose(); return count;
    });
    expect(remaining).toBe(0);
    expect(result.frozen, JSON.stringify(result)).toBe(true);
    expect(errors).toEqual([]);
  });
}
