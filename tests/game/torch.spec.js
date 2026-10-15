import { writeFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { loadLevel } from "./levelHelpers.js";

test.afterEach(async ({ page }) => { await page.evaluate(() => window.unmountGame?.()); });

test("sanctuary and cemetery pillars render animated fire at their solid positions", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  for (const [level, name, target] of [
    [2, "Nivel 2 - Santuario de Atenea", { x: -7.2, z: 11 }],
    [3, "Nivel 3 - Cementerio", { x: -15.6, z: 6 }]
  ]) {
    await loadLevel(page, level);
    const result = await page.evaluate(({ name, target }) => {
      const { scene, renderer, camera } = window.game.inspect();
      const scenery = scene.getObjectByName(name), fires = [];
      scenery.traverse((object) => { if (object.name === "Fuego de antorcha") fires.push(object); });
      const first = fires.find((fire) => Math.abs(fire.position.x - target.x) < 0.01 && Math.abs(fire.position.z - target.z) < 0.01);
      scenery.userData.animate(true, { period: "night" }, 0);
      const start = first.children.find((child) => child.isMesh).scale.y;
      scenery.userData.animate(true, { period: "night" }, 800);
      const end = first.children.find((child) => child.isMesh).scale.y;
      const oldPosition = camera.position.clone(), oldRotation = camera.quaternion.clone();
      camera.position.set(target.x + 2.1, 2.7, target.z + 3.3);
      camera.lookAt(target.x, 1.65, target.z);
      renderer.render(scene, camera);
      const image = renderer.domElement.toDataURL("image/png");
      camera.position.copy(oldPosition); camera.quaternion.copy(oldRotation);
      return { count: fires.length, layers: first.children.filter((child) => child.isMesh).length,
        sparks: first.children.some((child) => child.isPoints), light: first.children.some((child) => child.isPointLight),
        motion: Math.abs(end - start), image };
    }, { name, target });
    expect(result.count).toBe(8);
    expect(result.layers).toBeGreaterThanOrEqual(3);
    expect(result.sparks).toBe(true);
    expect(result.light).toBe(true);
    expect(result.motion).toBeGreaterThan(0.01);
    expect(result.image).toMatch(/^data:image\/png;base64,/);
    await writeFile(testInfo.outputPath(`torch-level-${level}.png`), Buffer.from(result.image.split(",")[1], "base64"));
  }
  expect(errors).toEqual([]);
});
