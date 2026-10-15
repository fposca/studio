import { test, expect } from "@playwright/test";

test.afterEach(async ({ page }) => { await page.evaluate(() => window.unmountGame?.()); });

test("the title menu opens levels 2, 3 and 4 directly without campaign progress", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  const picker = page.getByRole("group", { name: "Elegir escenario" });
  await expect(picker).toBeVisible({ timeout: 15_000 });
  await expect(picker.getByRole("button")).toHaveCount(4);
  await expect(picker.getByRole("button", { name: "Nivel 1: El Partenon" })).toHaveAttribute("aria-pressed", "true");

  await picker.getByRole("button", { name: "Nivel 2: El santuario de Atenea" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nivel 2", exact: true })).toBeVisible({ timeout: 90_000 });
  expect(await page.evaluate(() => {
    const world = window.game.inspect().world;
    return { level: world.level.id, inventory: [...world.inventory], quest: world.questStage, score: world.scoreBase };
  })).toEqual({ level: 2, inventory: ["unarmed"], quest: "unstarted", score: 0 });
  await page.getByRole("button", { name: "Omitir intro" }).click();

  await page.evaluate(() => window.game.showTitle());
  await expect(picker.getByRole("button", { name: "Nivel 2: El santuario de Atenea" })).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 320, height: 640 });
  for (const button of await picker.getByRole("button").all()) {
    const bounds = await button.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(640);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

  await picker.getByRole("button", { name: "Nivel 3: El cementerio" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nivel 3", exact: true })).toBeVisible({ timeout: 90_000 });
  expect(await page.evaluate(() => {
    const world = window.game.inspect().world;
    return { level: world.level.id, inventory: [...world.inventory], coins: world.coins.length,
      enemies: world.enemies.length, pickup: world.pickups[0].weapon };
  })).toEqual({ level: 3, inventory: ["unarmed"], coins: 42, enemies: 12, pickup: "axe" });
  await page.getByRole("button", { name: "Omitir intro" }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0);
  await page.evaluate(() => window.game.showTitle());
  await picker.getByRole("button", { name: "Nivel 4: Las catacumbas" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nivel 4", exact: true })).toBeVisible({ timeout: 90_000 });
  expect(await page.evaluate(() => {
    const world = window.game.inspect().world;
    return { level: world.level.id, ammo: world.ammo, enemies: world.enemies.length,
      weapon: world.pickups[0].weapon, secrets: world.secretDoors.length };
  })).toEqual({ level: 4, ammo: 10, enemies: 9, weapon: "crossbow", secrets: 2 });
  await page.getByRole("button", { name: "Omitir intro" }).click();
  expect(errors).toEqual([]);
});
