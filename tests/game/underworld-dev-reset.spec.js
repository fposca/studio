import { test, expect } from "@playwright/test";

test("chapter 11 restart confirms the action and preserves previous chapter progress", async ({ page }) => {
  await page.addInitScript(() => {
    const data = {
      scene: "underworld",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { arrivalRead: true, introSeen: true, visionActive: true,
        bridgeCrossed: true, combatVersion: 1, enemies: [0, 0], gargolaHealth: 0,
        testigoHealth: 8, testigoIntroSeen: true },
      combatHearts: 1,
      positions: { underworld: { x: 0, z: 10.5, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-underworld");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(level.getByRole("button", { name: /Reiniciar nivel/i })).toBeVisible();
  await level.getByRole("button", { name: /Reiniciar nivel/i }).click();
  await expect(level.getByRole("dialog", { name: "¿Reiniciar el nivel?" })).toBeVisible();
  await level.getByRole("button", { name: "Cancelar" }).click();
  await expect(level.locator(".underworld-mission")).not.toContainText("Examiná la inscripción");
  await level.getByRole("button", { name: /Reiniciar nivel/i }).click();
  await level.getByRole("button", { name: "Sí, reiniciar" }).click();
  await expect(level.locator(".underworld-mission")).toContainText("Examiná la inscripción");
  await expect(level.locator(".parthenon-hearts")).toHaveAttribute("aria-label", "Salud 3 de 3");
  await expect(level).toHaveAttribute("data-frequency-vision", "inactive");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect.poll(() => page.evaluate(() => {
    const { autosave } = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots;
    const data = autosave.data;
    return [data.chapter10Progress.chapterCompleted, data.underworldProgress.arrivalRead,
      data.underworldProgress.bridgeCrossed, data.underworldProgress.enemies.join(","),
      data.underworldProgress.gargolaHealth, data.underworldProgress.testigoHealth,
      data.combatHearts, data.positions.underworld.z];
  }), { timeout: 10_000 }).toEqual([true, false, false, "5,5", 4, 8, 3, 10.5]);
});
