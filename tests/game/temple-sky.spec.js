import { test, expect } from "@playwright/test";

test("level one climbs through mist and clouds to a flying dragon that lands", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  const skipIntro = page.getByRole("button", { name: "Omitir intro" });
  if (await skipIntro.isVisible()) await skipIntro.click({ timeout: 3000 }).catch(() => {});
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  const initial = await page.evaluate(() => {
    const { world, scene } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    return { platforms: world.platforms.length, coins: world.coins.length,
      clouds: scene.getObjectByName("Ascenso entre neblina y nubes")?.children.filter((object) => object.isSprite).length,
      dragon: Boolean(scene.getObjectByName("Dragon aliado")) };
  });
  expect(initial.platforms).toBe(25);
  expect(initial.coins).toBe(56);
  expect(initial.clouds).toBeGreaterThanOrEqual(40);
  expect(initial.dragon).toBe(true);
  async function perch(id, time, met = true) {
    await page.evaluate(({ id, time, met }) => {
      const { world } = window.game.inspect();
      world.time = time; world.dragonMet = met; world.updateChallenges(true);
      const platform = world.platforms.find((entry) => entry.id === id), player = world.player;
      Object.assign(player, { x: platform.x, y: platform.y + 0.015, z: platform.z,
        velocityY: 0, velocityX: 0, velocityZ: 0, grounded: true, platformId: platform.id, invulnerable: 0 });
      const position = { x: player.x, y: player.y + player.bodyOffset, z: player.z };
      player.body.setTranslation(position, true); player.body.setNextKinematicTranslation(position);
      world.physics.step();
    }, { id, time, met });
    await page.waitForTimeout(250);
  }
  await perch("sky-5", 12);
  expect(await page.evaluate(() => window.game.inspect().scene.fog.near)).toBeLessThan(50);
  expect(await page.evaluate(() => window.game.inspect().scene.getObjectByName("Dragon aliado").position.y)).toBeGreaterThan(20);
  await page.screenshot({ path: testInfo.outputPath("mist-ascent.png") });
  await perch("sky-16", 27, false);
  const landed = await page.evaluate(() => {
    const { scene, world } = window.game.inspect();
    const dragon = scene.getObjectByName("Dragon aliado");
    return { x: dragon.position.x, y: dragon.position.y, z: dragon.position.z,
      playerY: world.player.y, fogNear: scene.fog.near };
  });
  expect(landed.y).toBeCloseTo(18.95, 1);
  expect(landed.z).toBeCloseTo(-29.4, 1);
  expect(landed.playerY).toBeGreaterThan(17);
  expect(landed.fogNear).toBeGreaterThan(45);
  await page.screenshot({ path: testInfo.outputPath("dragon-in-clouds.png") });
  await perch("dragon-perch", 28, false);
  await expect(page.getByRole("dialog")).toContainText("Soy tu amigo, Neonboy");
  await expect(page.getByRole("img", { name: "Retrato del dragon" })).toBeVisible();
  expect(await page.getByRole("dialog").evaluate((element) => getComputedStyle(element).animationName)).toBe("friend-card-in");
  await page.waitForTimeout(750);
  await page.screenshot({ path: testInfo.outputPath("dragon-dialogue.png") });
  await expect(page.getByRole("dialog")).toContainText("pr\u00f3ximos niveles");
  await page.getByRole("button", { name: "Hasta pronto" }).click();
  expect(await page.evaluate(() => window.game.inspect().world.dragonMet)).toBe(true);
  expect(await page.evaluate(() => window.game.inspect().world.dragonCollider.isEnabled())).toBe(false);
  await page.evaluate(() => { const { world } = window.game.inspect(); world.time = world.dragonDepartureTime + 2; });
  await page.waitForTimeout(100);
  const wingPose = () => page.evaluate(() => window.game.inspect().scene.getObjectByName("Dragon aliado").getObjectByName("Bone_042").quaternion.toArray());
  const wingBefore = await wingPose();
  await page.waitForTimeout(240);
  const wingAfter = await wingPose();
  expect(Math.max(...wingBefore.map((value, index) => Math.abs(value - wingAfter[index])))).toBeGreaterThan(0.08);
  await page.screenshot({ path: testInfo.outputPath("dragon-flapping-away.jpg"), type: "jpeg", quality: 65 });
  await page.evaluate(() => { const { world } = window.game.inspect(); world.time = world.dragonDepartureTime + 3; });
  await page.waitForFunction(() => { const { scene, world } = window.game.inspect(); return scene.getObjectByName("Dragon aliado").position.y > world.level.dragon.y + 3; });
  await page.evaluate(() => { const { world } = window.game.inspect(); world.time = world.dragonDepartureTime + 7; });
  await page.waitForFunction(() => !window.game.inspect().scene.getObjectByName("Dragon aliado").visible);
  expect(errors).toEqual([]);
});
