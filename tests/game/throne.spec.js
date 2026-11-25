import { test, expect } from "@playwright/test";

test("completed Cathedral save opens Chapter 13 with the optimized Soberano", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const data = {
      scene: "abyss-throne",
      chapter10Progress: {
        coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true,
      },
      underworldProgress: {
        bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
        gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true,
      },
      cathedralProgress: { completed: true },
      throneProgress: { entered: true },
      positions: { "abyss-throne": { x: 0, z: 10.5, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-throne");
  await expect(level.getByRole("heading", { name: "EL TRONO DEL ABISMO", exact: true })).toBeVisible();
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(level.locator("canvas")).toHaveAttribute("data-throne-sovereign", "true");
  await expect(level.getByText(/Examiná la inscripción del Salón/i)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("throne-arrival.png") });
  await level.getByRole("button", { name: /VISIÓN DE FRECUENCIA/ }).click();
  await expect(level).toHaveAttribute("data-frequency-vision", "active");
  await expect(level.locator(".record-store-webgl-error")).toHaveCount(0);
  expect(errors).toEqual([]);
});
