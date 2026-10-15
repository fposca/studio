import { test, expect } from "@playwright/test";

test.afterEach(async ({ page }) => {
  await page.evaluate(() => window.unmountGame?.());
});

test("each level introduces itself before gameplay, can be skipped, and replays on restart", async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  const intro = page.locator(".neon-game-level-intro");
  const snapshot = () => page.evaluate(() => {
    const { world } = window.game.inspect();
    return { time: world.time, health: world.player.health, x: world.player.x, z: world.player.z,
      enemies: world.enemies.map(({ x, z, health }) => ({ x, z, health })) };
  });
  for (const level of [1, 2, 3]) {
    await expect(page.getByRole("heading", { name: `Nivel ${level}`, exact: true })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole("button", { name: "Omitir intro" })).toBeFocused();
    const before = await snapshot();
    expect(before.time).toBe(0);
    await page.evaluate(() => { window.game.action("jump"); window.game.hold("punch", true); window.game.move(1, 0); });
    await page.waitForTimeout(200);
    if (await intro.count()) {
      expect(await snapshot()).toEqual(before);
      await expect(page.getByRole("progressbar", { name: "Vida", exact: true })).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath(`level-${level}-intro.png`) });
    }
    if (level === 1) await expect(intro).toHaveCount(0, { timeout: 6000 });
    else if (await intro.count()) await page.getByRole("button", { name: "Omitir intro" }).click();
    await expect(intro).toHaveCount(0);
    if (level === 2) await page.getByRole("button", { name: "Aceptar mision" }).click();
    await page.waitForFunction(() => window.game.inspect().world.time > 0);
    await page.keyboard.press("p");
    await expect(page.getByRole("heading", { name: "En pausa" })).toBeVisible();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(intro).toHaveCount(0);
    if (level < 3) {
      await page.evaluate(() => { window.game.inspect().world.status = "won"; });
      await page.getByRole("button", { name: new RegExp(`^Nivel ${level + 1}:`) }).click();
    }
  }
  await page.getByRole("button", { name: "Reiniciar partida", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nivel 3", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Omitir intro" }).press("Enter");
  await expect(intro).toHaveCount(0);
  await expect(page.locator(".neon-game-canvas")).toBeFocused();
  expect(errors).toEqual([]);
});

test("intro fits portrait and landscape screens and respects reduced motion", async ({ page }, testInfo) => {
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  for (const [index, size] of [{ width: 390, height: 844 }, { width: 320, height: 640 }, { width: 844, height: 390 }].entries()) {
    await page.setViewportSize(size);
    if (index === 0) await page.getByRole("button", { name: "Play", exact: true }).click();
    else await page.evaluate(() => window.game.restart());
    await expect(page.getByRole("heading", { name: "Nivel 1", exact: true })).toBeVisible();
    await page.waitForTimeout(1100);
    for (const selector of [".neon-level-copy", ".neon-level-number", ".neon-level-footer button"]) {
      const rect = await page.locator(selector).boundingBox();
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(size.width);
      expect(rect.y + rect.height).toBeLessThanOrEqual(size.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(size.width);
    await page.screenshot({ path: testInfo.outputPath(`intro-${size.width}x${size.height}.png`) });
    await page.getByRole("button", { name: "Omitir intro" }).click();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => window.game.restart());
  await expect(page.getByRole("heading", { name: "Nivel 1", exact: true })).toBeVisible();
  expect(await page.locator(".neon-game-level-intro").evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 4000 });
  await page.waitForFunction(() => window.game.inspect().world.time > 0);
});
