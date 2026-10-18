import { test, expect } from "@playwright/test";

test("the supplied intro video plays before the menu, keeps its audio available and ends in the Parthenon", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  const video = page.getByLabel("Intro de Neonboy");
  await expect(video).toBeVisible();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toHaveCount(0);
  await expect(page.locator(".neon-game-hud")).toHaveCount(0);
  await page.waitForFunction(() => {
    const video = document.querySelector(".neon-game-opening-video");
    return video?.currentTime > 0.5 && video.videoWidth > 0 && !video.paused;
  }, null, { timeout: 15_000 });
  await video.evaluate((element) => element.pause());
  const media = await video.evaluate((element) => ({ width: element.videoWidth, height: element.videoHeight,
    duration: element.duration, muted: element.muted, source: new URL(element.currentSrc).pathname }));
  expect(media).toMatchObject({ width: 2944, height: 1248, muted: true });
  expect(media.duration).toBeGreaterThan(4);
  expect(media.duration).toBeLessThan(5);
  expect(media.source).toContain("nueva-intro.mp4");
  expect(await page.evaluate(() => window.game.inspect().world.time)).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("video-intro.jpg"), type: "jpeg", quality: 70 });
  await page.getByRole("button", { name: "Activar sonido" }).click();
  await expect.poll(() => video.evaluate((element) => element.muted)).toBe(false);
  await page.getByRole("button", { name: "Silenciar" }).click();
  await expect.poll(() => video.evaluate((element) => element.muted)).toBe(true);

  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible({ timeout: 10_000 });
  expect(await page.evaluate(() => {
    const { world, phase } = window.game.inspect();
    return { time: world.time, health: world.player.health, equipped: world.equipped, phase };
  })).toEqual({ time: 0, health: 100, equipped: "unarmed", phase: "title" });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByRole("progressbar", { name: "Vida" })).toBeVisible();
  await page.waitForFunction(() => window.game.inspect().world.time > 0.1);
  expect(errors).toEqual([]);
});

test("the new opening can be skipped on mobile without affecting the game", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.waitForFunction(() => document.querySelector(".neon-game-opening-video")?.currentTime >= 0.75);
  await page.screenshot({ path: testInfo.outputPath("video-intro-mobile.jpg"), type: "jpeg", quality: 65 });
  await page.getByRole("button", { name: "Omitir cinematica" }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect(page.locator(".neon-game-opening")).toHaveCount(0);
  expect(await page.evaluate(() => window.game.inspect().world.time)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
