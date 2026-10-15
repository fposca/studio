import { test, expect } from "@playwright/test";

test("textured hearts remain at full health, heal on contact and survive save/load", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  const initial = await page.evaluate(() => {
    const { world, scene, input } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    Object.assign(input.orbit, { yaw: 0.1, pitch: 0.18, distance: 6 });
    const heart = world.hearts[0], player = world.player;
    Object.assign(player, { x: heart.x + 2.5, y: 0, z: heart.z + 2.5, velocityX: 0, velocityY: 0, velocityZ: 0 });
    const position = { x: player.x, y: player.y + player.bodyOffset, z: player.z };
    player.body.setTranslation(position, true);
    player.body.setNextKinematicTranslation(position);
    world.physics.step();
    return { count: world.hearts.length, names: world.hearts.map((item) => scene.getObjectByName(`Vida ${item.id}`)?.name),
      textured: Boolean(scene.getObjectByName(`Vida ${heart.id}`)?.getObjectByProperty("isMesh", true)?.material?.map),
      vertices: scene.getObjectByName(`Vida ${heart.id}`)?.getObjectByProperty("isMesh", true)?.geometry.attributes.position.count };
  });
  expect(initial.count).toBe(4);
  expect(initial.names).toHaveLength(4);
  expect(initial.names.every(Boolean)).toBe(true);
  expect(initial.textured).toBe(true);
  expect(initial.vertices).toBeLessThan(100000);
  await page.waitForTimeout(450);
  await page.screenshot({ path: testInfo.outputPath("heart-desktop.jpg"), type: "jpeg", quality: 65 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const { world } = window.game.inspect(), heart = world.hearts[0], player = world.player;
    Object.assign(player, { x: heart.x + 1.5, y: 0, z: heart.z + 2.5, velocityX: 0, velocityY: 0, velocityZ: 0 });
    const position = { x: player.x, y: player.y + player.bodyOffset, z: player.z };
    player.body.setTranslation(position, true);
    player.body.setNextKinematicTranslation(position);
    world.physics.step();
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: testInfo.outputPath("heart-mobile.jpg"), type: "jpeg", quality: 65 });

  await page.evaluate(() => {
    const { world } = window.game.inspect(), heart = world.hearts[0], player = world.player;
    Object.assign(player, { x: heart.x, y: heart.y, z: heart.z, velocityX: 0, velocityY: 0, velocityZ: 0 });
    const position = { x: player.x, y: player.y + player.bodyOffset, z: player.z };
    player.body.setTranslation(position, true);
    player.body.setNextKinematicTranslation(position);
    world.physics.step();
  });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.game.inspect().world.hearts[0].collected)).toBe(false);
  await page.evaluate(() => { window.game.inspect().world.player.health = 70; });
  await page.waitForFunction(() => window.game.inspect().world.hearts[0].collected);
  const healed = await page.evaluate(() => ({ health: window.game.inspect().world.player.health,
    visible: window.game.inspect().scene.getObjectByName("Vida temple-entry").visible }));
  expect(healed).toEqual({ health: 95, visible: false });
  const saved = await page.evaluate(() => window.game.exportSave());
  expect(saved.world.hearts).toEqual(["temple-entry"]);
  await page.evaluate((value) => window.game.loadSave(value), saved);
  expect(await page.evaluate(() => window.game.inspect().world.hearts[0].collected)).toBe(true);
  expect(await page.evaluate(() => window.game.inspect().world.player.health)).toBe(95);
  await page.evaluate(() => window.game.restart());
  expect(await page.evaluate(() => window.game.inspect().world.hearts.every((heart) => !heart.collected))).toBe(true);
  expect(errors).toEqual([]);
});
