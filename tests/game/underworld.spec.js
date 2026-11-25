import { test, expect } from "@playwright/test";

test("chapter 11 loads optimized actors and lets NeonBoy talk to the ferryman", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const data = {
      scene: "underworld",
      chapter10Progress: {
        coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true,
      },
      underworldProgress: { arrivalRead: true, visionActive: true, bridgeCrossed: true, enemies: [3, 3] },
      positions: { underworld: { x: 3, z: -10.2, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-underworld");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(level.locator("canvas")).toHaveAttribute("data-underworld-models", /centinelas,alma,barquero,gargola,testigo/);
  await expect(level.getByRole("status").filter({ hasText: /Barquero/ })).toBeVisible();
  await page.keyboard.press("e");
  await expect(level.getByRole("dialog", { name: "Conversación con Barquero" })).toContainText("Llegás tarde, NeonBoy.");
  expect(errors).toEqual([]);
});
