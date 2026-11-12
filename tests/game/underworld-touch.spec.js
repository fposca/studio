import { test, expect } from "@playwright/test";

test("chapter 11 uses the shared conversation panel with touch-sized actions", async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 400 });
  await page.addInitScript(() => {
    const data = {
      scene: "underworld",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { arrivalRead: true, introSeen: true, visionActive: true,
        bridgeCrossed: true, enemies: [3, 3] },
      positions: { underworld: { x: -2.6, z: 5.6, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-underworld");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(level.getByRole("button", { name: "Interactuar" })).toBeVisible();
  await level.getByRole("button", { name: "Interactuar" }).click();
  await expect(level.locator('[data-line-id="barquero-01"]')).toBeVisible();
  const dialog = level.getByRole("dialog", { name: "Conversación con Barquero" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Omitir" })).toBeVisible();
  const layout = await dialog.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const next = element.querySelector('[aria-label="Continuar"]')?.getBoundingClientRect();
    return { withinScreen: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight,
      touchHeight: next?.height ?? 0 };
  });
  expect(layout.withinScreen).toBe(true);
  expect(layout.touchHeight).toBeGreaterThanOrEqual(40);
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await expect(level.locator('[data-line-id="neonboy-barquero-01"]')).toBeVisible();
});
