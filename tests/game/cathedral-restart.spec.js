import { test, expect } from "@playwright/test";

test("restart Chapter 12 returns to its entrance without erasing Chapter 11", async ({ page }) => {
  await page.addInitScript(() => {
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { completed: true },
      mapUnlocks: ["cathedral", "abyss-throne"],
      positions: { cathedral: { x: 0, z: -50.7, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const level = page.locator(".neon-cathedral");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  const restart = level.getByRole("button", { name: "Reiniciar capitulo 12" });
  await restart.click();
  const confirm = level.getByRole("dialog", { name: /Reiniciar el cap.tulo 12/ });
  await expect(confirm).toContainText(/cap.tulo 11.*conservar.n/);
  await confirm.getByRole("button", { name: "Cancelar" }).click();
  await expect(level.locator(".cathedral-mission")).toContainText(/COMPLETADA/);
  await restart.click();
  await confirm.getByRole("button", { name: /reiniciar cap. 12/i }).click();
  await expect(confirm).toHaveCount(0);
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(level.locator(".cathedral-mission")).toContainText(/Examin.*inscripci/);
  await expect.poll(() => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data;
    return [data.scene, data.chapter10Progress.chapterCompleted, data.underworldProgress.completed,
      data.cathedralProgress.entered, data.cathedralProgress.inscriptionRead,
      data.cathedralProgress.seals.length, data.cathedralProgress.memories.length,
      data.cathedralProgress.altarSequence.length, data.cathedralProgress.completed,
      data.positions.cathedral.z, data.mapUnlocks.includes("abyss-throne")];
  }), { timeout: 12_000 }).toEqual(["cathedral", true, true, true, false, 0, 0, 0, false, 10, false]);
  await level.getByRole("button", { name: "MAPA" }).click();
  await expect(page.getByRole("button", { name: /DESTINO SIGUIENTE.*TRONO DEL ABISMO/ })).toHaveCount(0);
});
