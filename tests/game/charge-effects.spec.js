import { test, expect } from "@playwright/test";

test("coin sparks bloom and holding the attack button builds a violet aura", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  const skipIntro = page.getByRole("button", { name: "Omitir intro" });
  if (await skipIntro.isVisible()) await skipIntro.click({ timeout: 3000 }).catch(() => {});
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    for (const enemy of world.enemies) { enemy.health = 0; enemy.collider.setEnabled(false); }
    const player = world.player;
    Object.assign(player, { x: 0, y: 0, z: 10, grounded: false, velocityY: 0, velocityX: 0, velocityZ: 0 });
    const position = { x: 0, y: player.bodyOffset, z: 10 };
    player.body.setTranslation(position, true);
    player.body.setNextKinematicTranslation(position);
    world.physics.step();
  });
  await page.waitForFunction(() => window.game.inspect().world.coins[0].collected);
  const sparkle = await page.evaluate(() => {
    const { scene } = window.game.inspect();
    const cloud = scene.getObjectByName("Chispas de monedas y combate");
    return { active: [...cloud.geometry.attributes.aAlpha.array].filter((value) => value > 0).length,
      rings: scene.children.filter((object) => object.isMesh && object.geometry?.type === "RingGeometry" && object.visible).length };
  });
  expect(sparkle.active).toBeGreaterThan(15);
  expect(sparkle.rings).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath("coin-sparks.jpg"), type: "jpeg", quality: 75 });

  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.inventory.add("sword");
    world.equip("sword");
  });
  const button = page.locator(".neon-game-primary-action");
  await button.click();
  await page.waitForFunction(() => window.game.inspect().world.player.attack?.kind === "sword");
  expect(await page.evaluate(() => window.game.inspect().world.player.attack.charged)).toBe(false);
  await page.waitForFunction(() => !window.game.inspect().world.player.attack && window.game.inspect().world.player.cooldown === 0);
  await button.hover();
  await page.mouse.down();
  await page.waitForFunction(() => window.game.inspect().world.snapshot().chargeReady, null, { timeout: 10_000 });
  await expect(page.getByRole("progressbar", { name: "Carga de poder" })).toHaveAttribute("aria-valuenow", "100");
  expect(await page.evaluate(() => window.game.inspect().scene.getObjectByName("Aura violeta de Neonboy").visible)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("violet-charge.jpg"), type: "jpeg", quality: 80 });
  await page.mouse.up();
  await page.waitForFunction(() => window.game.inspect().world.player.attack?.charged === true, null, { timeout: 2000 });
  expect(await page.evaluate(() => window.game.inspect().world.chargeTime)).toBe(0);
  expect(errors).toEqual([]);
});
