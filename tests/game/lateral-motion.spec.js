import { test, expect } from "@playwright/test";

test("lateral walking remains centered and smooth on desktop and mobile", async ({ page }, testInfo) => {
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.keyboard.press("v");
  await page.evaluate(() => window.game.inspect().world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); }));

  for (const [key, width, height] of [["d", 1440, 900], ["a", 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => {
      const { world } = window.game.inspect(), actor = world.player;
      Object.assign(actor, { x: 0, y: 0, z: 13, yaw: Math.PI, velocityX: 0, velocityY: 0, velocityZ: 0, speed: 0, grounded: true });
      actor.body.setTranslation({ x: 0, y: 0.9, z: 13 }, true);
      actor.body.setNextKinematicTranslation({ x: 0, y: 0.9, z: 13 });
      world.physics.step();
    });
    await page.keyboard.down(key);
    await page.waitForTimeout(500);
    const samples = await page.evaluate(async () => {
      const THREE = await import("/node_modules/three/build/three.module.js");
      return new Promise((resolve) => {
        const values = [];
        function frame() {
          const { world, scene, renderer, camera } = window.game.inspect();
          const root = scene.getObjectByName("Neonboy");
          const screen = root.getWorldPosition(new THREE.Vector3()).project(camera);
          values.push({ x: world.player.x, screenX: screen.x, y: root.position.y, yaw: root.rotation.y });
          if (values.length < 50) requestAnimationFrame(frame);
          else {
            renderer.render(scene, camera);
            const gl = renderer.getContext(), pixels = new Uint8Array(8 * 8 * 4);
            gl.readPixels(gl.drawingBufferWidth / 2, gl.drawingBufferHeight / 2, 8, 8, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            resolve({ values, pixelMax: Math.max(...pixels.filter((_, i) => i % 4 !== 3)) });
          }
        }
        requestAnimationFrame(frame);
      });
    });
    await page.keyboard.up(key);
    const { values } = samples;
    const screenX = values.map((value) => value.screenX);
    const ys = values.map((value) => value.y);
    const yaws = values.map((value) => value.yaw);
    expect(Math.abs(values.at(-1).x - values[0].x)).toBeGreaterThan(1.8);
    expect(Math.max(...screenX) - Math.min(...screenX)).toBeLessThan(0.012);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.005);
    expect(Math.max(...yaws) - Math.min(...yaws)).toBeLessThan(0.005);
    expect(samples.pixelMax).toBeGreaterThan(25);
    await page.screenshot({ path: testInfo.outputPath(key === "d" ? "walk-right.png" : "walk-left-mobile.png") });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
