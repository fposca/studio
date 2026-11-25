import { test, expect } from "@playwright/test";

test("Soberano stands above the arena floor with an active health bar", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const data = {
      scene: "abyss-throne",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { completed: true },
      throneProgress: { entered: true, inscriptionRead: true, vows: ["memoria", "voluntad", "libertad"],
        hallOpen: true, coreInspected: ["origen", "eco", "enlace"],
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
  await expect(level.getByRole("status", { name: /Vida del Soberano 12 de 12/ })).toBeVisible();
  await expect(level.locator(".parthenon-hearts")).not.toHaveAttribute("aria-label", "Salud 3 de 3", { timeout: 12_000 });
  await page.waitForTimeout(7000); // Let a full volley and blink cycle run.
  await expect(level.locator("canvas")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("throne-boss.png") });
  expect(errors).toEqual([]);
});
