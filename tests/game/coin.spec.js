import { test, expect } from "@playwright/test";
import { loadLevel } from "./levelHelpers.js";

test("the imported coin renders at pickup size, animates and disappears when collected", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  const inspect = () => page.evaluate(async () => {
    const T = await import("/node_modules/three/build/three.module.js");
    const { scene, world, renderer, camera } = window.game.inspect();
    renderer.render(scene, camera);
    const coin = scene.getObjectByName("Moneda 1"), second = scene.getObjectByName("Moneda 2");
    const model = coin.getObjectByName("Modelo moneda");
    const mesh = model.getObjectByProperty("isMesh", true);
    const other = second.getObjectByName("Modelo moneda").getObjectByProperty("isMesh", true);
    const size = new T.Box3().setFromObject(model).getSize(new T.Vector3());
    return { visible: coin.visible, count: world.coins.length, vertices: mesh.geometry.attributes.position.count,
      diameter: Math.max(size.x, size.y, size.z), mapWidth: mesh.material.map.image.width,
      textured: Boolean(mesh.material.normalMap && mesh.material.metalnessMap),
      sharedGeometry: mesh.geometry === other.geometry, rotation: coin.rotation.y,
      glLost: renderer.getContext().isContextLost(), triangles: renderer.info.render.triangles };
  });
  const initial = await inspect();
  expect(initial.visible).toBe(true);
  expect(initial.count).toBe(56);
  expect(initial.vertices).toBeGreaterThan(1000);
  expect(initial.vertices).toBeLessThan(3000);
  expect(initial.diameter).toBeCloseTo(0.5, 1);
  expect(initial.mapWidth).toBe(512);
  expect(initial.textured).toBe(true);
  expect(initial.sharedGeometry).toBe(true);
  expect(initial.glLost).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("coin-desktop.jpg") });
  await page.waitForTimeout(220);
  expect((await inspect()).rotation).not.toBe(initial.rotation);
  await page.keyboard.down("w");
  await page.waitForFunction(() => window.game.inspect().world.coins[0].collected);
  await page.keyboard.up("w");
  expect((await inspect()).visible).toBe(false);
  await loadLevel(page, 3);
  const cemetery = await inspect();
  expect(cemetery.visible).toBe(true);
  expect(cemetery.count).toBe(42);
  expect(cemetery.sharedGeometry).toBe(true);
  expect(cemetery.glLost).toBe(false);
  await page.evaluate(() => window.unmountGame());
  expect(errors).toEqual([]);
});
