import { test, expect } from "@playwright/test";

test("Soberano leaves the entrance column and reaches Neonboy on the bridge", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
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
        bossIntro: true, bossHealth: 3, shieldNodes: ["origen", "eco", "enlace"] },
      positions: { "abyss-throne": { x: 0, z: -53, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-throne");
  const canvas = level.locator("canvas");
  await expect(canvas).toHaveAttribute("data-throne-sovereign", "true", { timeout: 90_000 });
  await expect.poll(async () => Number(await canvas.getAttribute("data-throne-boss-z")),
    { timeout: 20_000 }).toBeGreaterThan(-58);
  await expect(level.locator(".parthenon-hearts")).not.toHaveAttribute("aria-label", "Salud 3 de 3", { timeout: 12_000 });
  expect(errors).toEqual([]);
});
