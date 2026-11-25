import { test, expect } from "@playwright/test";

test("Cathedral portal enters Chapter 13 and preserves the completed chapter", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { completed: true },
      positions: { cathedral: { x: 0, z: -57.7, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const cathedral = page.locator(".neon-cathedral");
  await expect(cathedral.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(cathedral.getByText(/DESTINO: TRONO DEL ABISMO/)).toBeVisible();
  await page.keyboard.press("e");
  const throne = page.locator(".neon-throne");
  await expect(throne).toBeVisible();
  await expect(throne.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(throne.locator('[data-line-id="voz-trono-01"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.cathedralProgress.completed)).toBe(true);
  expect(errors).toEqual([]);
});
