import { test, expect } from "@playwright/test";

const levels = [
  { id: 3, name: "El cementerio", coins: 88, enemies: 21, platforms: 19,
    gallery: { x: 8, z: -54 }, boss: { x: 0, z: -86 } },
  { id: 4, name: "Las catacumbas", coins: 83, enemies: 19, platforms: 18,
    gallery: { x: -7, z: -57 }, boss: { x: 0, z: -88 } }
];

async function place(page, destination) {
  await page.evaluate(({ x, z }) => {
    const { world, input } = window.game.inspect(), player = world.player;
    Object.assign(player, { x, y: 0, z, velocityY: 0, velocityX: 0, velocityZ: 0 });
    const position = { x, y: player.bodyOffset, z };
    player.body.setTranslation(position, true);
    player.body.setNextKinematicTranslation(position);
    world.physics.step();
    Object.assign(input.orbit, { yaw: 0, pitch: 0.27, distance: 9 });
  }, destination);
  await page.waitForTimeout(250);
}

test.afterEach(async ({ page }) => { await page.evaluate(() => window.unmountGame?.()); });

test("the expanded cemetery and catacombs render their galleries and distant boss rooms", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  for (const level of levels) {
    await page.getByRole("group", { name: "Elegir escenario" })
      .getByRole("button", { name: `Nivel ${level.id}: ${level.name}` }).click();
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await page.getByRole("button", { name: "Omitir intro" }).click();
    if (level.id === 4) {
      await page.getByRole("button", { name: "Entrar" }).click();
      await page.evaluate(() => { window.game.inspect().world.adviceIndex = 3; });
    }
    await expect(page.locator(".neon-game-level-intro")).toHaveCount(0);
    expect(await page.evaluate(() => {
      const { world } = window.game.inspect();
      return { coins: world.coins.length, enemies: world.enemies.length,
        platforms: world.platforms.length, doors: world.secretDoors.length };
    })).toEqual({ coins: level.coins, enemies: level.enemies, platforms: level.platforms, doors: 4 });
    await page.evaluate(() => {
      const { world } = window.game.inspect();
      for (const enemy of world.enemies) { enemy.stationary = true; enemy.cooldown = 100; }
    });
    await place(page, level.gallery);
    await page.screenshot({ path: testInfo.outputPath(`level-${level.id}-gallery.jpg`), type: "jpeg" });
    await page.evaluate(() => {
      const { world } = window.game.inspect();
      for (const enemy of world.enemies) if (!enemy.boss) {
        enemy.health = 0; enemy.collider.setEnabled(false);
      }
      world.activateBoss();
      world.boss.cooldown = 100;
    });
    await place(page, level.boss);
    await expect(page.getByRole("progressbar", { name: "Vida del jefe" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`level-${level.id}-boss.jpg`), type: "jpeg" });
    if (level.id === 3) await page.evaluate(() => window.game.showTitle());
  }
  expect(errors).toEqual([]);
});
