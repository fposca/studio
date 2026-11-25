import { test, expect } from "@playwright/test";

test.use({ hasTouch: true });

test("Chapter 13 keeps combat controls and the boss bar usable on a phone-sized screen", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(() => {
    const data = {
      scene: "abyss-throne",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { completed: true },
      throneProgress: { entered: true, inscriptionRead: true,
        vows: ["memoria", "voluntad", "libertad"], hallOpen: true,
        coreInspected: ["origen", "eco", "enlace"],
        conductors: ["origen", "eco", "enlace"], throneOpen: true,
        bossIntro: true, bossHealth: 12 },
      positions: { "abyss-throne": { x: 0, z: -64, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-throne");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(level.locator("canvas")).toHaveAttribute("data-throne-sovereign", "true");
  await expect(level.getByRole("button", { name: "Mover \u2191" })).toBeVisible();
  await expect(level.getByRole("button", { name: "Interactuar" })).toBeVisible();
  for (const label of ["Mover \u2191", "Interactuar"]) {
    const control = level.getByRole("button", { name: label });
    const accessible = await control.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return { reachable: top === button || button.contains(top), cover: top?.className || top?.tagName, rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height}, viewport: {width: innerWidth, height: innerHeight} };
    });
    expect(accessible, label + " must be reachable by touch: " + JSON.stringify(accessible)).toMatchObject({ reachable: true });
  }
  const bar = level.locator(".throne-boss-health");
  await expect(bar).toBeVisible();
  const bounds = await bar.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(844);
  const mission = await level.locator(".throne-mission").boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(mission.x + mission.width);
  const up = await level.getByRole("button", { name: "Mover \u2191" }).boundingBox();
  expect(up.y).toBeGreaterThanOrEqual(mission.y + mission.height);
  await page.screenshot({ path: testInfo.outputPath("throne-phone.png") });
  await level.getByRole("button", { name: /VISIÓN DE FRECUENCIA/ }).click();
  await expect(level).toHaveAttribute("data-frequency-vision", "active");
});
