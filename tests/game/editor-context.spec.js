import { test, expect } from "@playwright/test";

test("hidden Studio 3D releases WebGL and restores its canvas when opened again", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/editor.html");
  const canvas = page.locator(".three-viewport canvas");
  await expect(canvas).toBeVisible({ timeout: 90_000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".three-viewport canvas");
    return canvas?.width > 100 && !canvas.getContext("webgl2")?.isContextLost();
  });
  const initial = await canvas.screenshot({ path: testInfo.outputPath("studio-before.png") });
  expect(initial.length).toBeGreaterThan(10_000);
  await page.evaluate(() => { window.editorCanvas = document.querySelector(".three-viewport canvas"); window.setEditorActive(false); });
  await page.waitForFunction(() => window.editorCanvas.getContext("webgl2").isContextLost());
  await expect(page.locator(".three-webgl-error")).toHaveCount(0);
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await expect(page.getByRole("heading", { name: "NeonBoy", exact: true })).toBeVisible({ timeout: 15_000 });
  const gameImage = await page.locator(".neon-game-canvas").screenshot({ path: testInfo.outputPath("game-between.png") });
  expect(gameImage.length).toBeGreaterThan(10_000);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.waitForFunction(() => window.game.inspect().world.time > 0.1);
  await page.evaluate(() => window.setEditorActive(true));
  await page.waitForFunction(() => !window.editorCanvas.getContext("webgl2").isContextLost());
  await expect(canvas).toBeVisible();
  expect(await page.evaluate(() => document.querySelector(".three-viewport canvas") === window.editorCanvas)).toBe(true);
  await page.waitForTimeout(500);
  const restored = await canvas.screenshot({ path: testInfo.outputPath("studio-restored.png") });
  expect(restored.length).toBeGreaterThan(10_000);
  await expect(page.locator(".three-webgl-error")).toHaveCount(0);
  expect(errors).toEqual([]);
});
