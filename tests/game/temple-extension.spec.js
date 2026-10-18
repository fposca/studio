import { test, expect } from "@playwright/test";

test("extended Parthenon patio renders behind the solid roof", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  const skipIntro = page.getByRole("button", { name: "Omitir intro" });
  if (await skipIntro.isVisible()) await skipIntro.click({ timeout: 3000 }).catch(() => {});
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  const layout = await page.evaluate(() => {
    const { world, scene } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    const player = world.player;
    Object.assign(player, { x: 0, y: 0, z: -66, grounded: false, velocityY: 0, velocityX: 0, velocityZ: 0 });
    const position = { x: 0, y: player.bodyOffset, z: -66 };
    player.body.setTranslation(position, true);
    player.body.setNextKinematicTranslation(position);
    world.physics.step();
    return { patio: Boolean(scene.getObjectByName("Patio posterior del Partenon")),
      back: world.level.bounds.back, bossZ: world.boss.spawn.z,
      rearCoins: world.coins.filter((coin) => coin.z < -45).length };
  });
  expect(layout.patio).toBe(true);
  expect(layout.back).toBe(-92);
  expect(layout.bossZ).toBe(-85);
  expect(layout.rearCoins).toBeGreaterThan(20);
  await page.waitForTimeout(600);
  await page.screenshot({ path: testInfo.outputPath("temple-rear-patio.jpg"), type: "jpeg", quality: 76 });
  expect(errors).toEqual([]);
});
