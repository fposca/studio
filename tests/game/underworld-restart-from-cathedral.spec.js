import { test, expect } from "@playwright/test";

test("chapter 12 can confirm a restart of chapter 11 and return to the bridge", async ({ page }) => {
  await page.addInitScript(() => {
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { entered: true, inscriptionRead: true, visionActive: true,
        seals: ["memoria", "tiempo", "verdad"], memories: ["nave"] },
      positions: { cathedral: { x: 0, z: -22, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const cathedral = page.locator(".neon-cathedral");
  await expect(cathedral.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });

  await cathedral.getByRole("button", { name: "REINICIAR CAP. 11" }).click();
  await expect(cathedral.getByRole("dialog", { name: "¿Reiniciar el nivel?" })).toBeVisible();
  await cathedral.getByRole("button", { name: "Cancelar" }).click();
  await expect(cathedral).toBeVisible();

  await cathedral.getByRole("button", { name: "REINICIAR CAP. 11" }).click();
  await cathedral.getByRole("button", { name: "Sí, reiniciar" }).click();
  const bridge = page.locator(".neon-underworld:not(.neon-cathedral)");
  await expect(bridge).toBeVisible();
  await expect(bridge.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(bridge.locator(".underworld-mission")).toContainText("Examiná la inscripción");
  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data;
    return [data.scene, data.chapter10Progress.chapterCompleted,
      data.underworldProgress.completed, data.underworldProgress.arrivalRead,
      data.cathedralProgress.entered, data.cathedralProgress.memories.length];
  }), { timeout: 10_000 }).toEqual(["underworld", true, false, false, false, 0]);
});
