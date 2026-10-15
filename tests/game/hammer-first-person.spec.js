import { writeFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test("first-person hammer rises overhead, slams with one hand and recovers", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Omitir intro" }).click();
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    world.inventory.add("hammer"); world.equip("hammer");
    window.game.setPaused(true);
  });
  async function pose(elapsed, name) {
    const value = await page.evaluate((elapsed) => {
      const { world, input, renderer, scene, camera, firstPersonView } = window.game.inspect();
      const actor = { ...world.player, attack: elapsed === null ? null : { kind: "hammer", elapsed } };
      firstPersonView.update(actor, 0, input.orbit.yaw, camera.aspect);
      renderer.render(scene, camera); firstPersonView.render(renderer);
      const right = firstPersonView.scene.getObjectByName("Guante derecho");
      const left = firstPersonView.scene.getObjectByName("Guante izquierdo");
      return { x: right.position.x, y: right.position.y, z: right.position.z, tilt: right.rotation.x,
        offhand: left.visible,
        image: renderer.domElement.toDataURL("image/png") };
    }, elapsed);
    await writeFile(testInfo.outputPath(`hammer-${name}.png`), Buffer.from(value.image.split(",")[1], "base64"));
    delete value.image;
    return value;
  }
  const idle = await pose(null, "idle");
  const raised = await pose(0.38, "windup");
  const falling = await pose(0.55, "falling");
  const impact = await pose(0.64, "impact");
  const recovered = await pose(1.15, "recovered");
  expect(idle.offhand).toBe(false);
  expect(raised.offhand).toBe(false);
  expect(impact.offhand).toBe(false);
  expect(raised.y - idle.y).toBeGreaterThan(0.25);
  expect(raised.tilt - idle.tilt).toBeLessThan(-0.85);
  expect(impact.x).toBeLessThan(idle.x - 0.24);
  expect(impact.tilt - raised.tilt).toBeGreaterThan(2.3);
  expect(falling.tilt).toBeGreaterThan(raised.tilt);
  expect(impact.z).toBeLessThan(idle.z - 0.23);
  expect(recovered.x).toBeCloseTo(idle.x, 3);
  expect(recovered.y).toBeCloseTo(idle.y, 3);
  expect(recovered.tilt).toBeCloseTo(idle.tilt, 3);
  expect(errors).toEqual([]);
});
