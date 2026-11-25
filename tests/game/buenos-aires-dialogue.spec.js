import { test, expect } from "@playwright/test";

test("an existing three-citizen save can speak to the Desconectada and keep its progress", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const data = {
      scene: "buenos-aires-2049",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { completed: true },
      throneProgress: { entered: true, inscriptionRead: true, vows: ["memoria", "voluntad", "libertad"],
        hallOpen: true, coreInspected: ["origen", "eco", "enlace"],
        conductors: ["origen", "eco", "enlace"], throneOpen: true,
        bossIntro: true, bossHealth: 0, bossDefeated: true, transmissionExamined: true, completed: true },
      cityProgress: { entered: true, introSeen: true, visionActive: true,
        citizens: ["ba-man-1", "ba-woman-1", "ba-executive-1"], signalFound: true },
      positions: { "buenos-aires-2049": { x: -34.5, z: -21, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const city = page.locator(".neon-buenos-aires");
  await expect(city.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(city.locator("canvas")).toHaveAttribute("data-city-actors", /ba-disconnected/, { timeout: 30_000 });
  await expect(city.locator(".studio-examine-cue")).toContainText("Desconectada", { timeout: 30_000 });
  await page.keyboard.press("e");
  const dialogue = city.locator(".city-dialogue");
  await expect(dialogue).toBeVisible();
  await expect(dialogue).toHaveAttribute("data-line-id", "desconectada-14-01");
  for (let i = 0; i < 9; i++) await dialogue.getByRole("button").click();
  await expect(dialogue).toHaveCount(0);
  await expect(city.getByText(/INVESTIG.*TRES TRANSMISORES/).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.cityProgress;
    return { citizens: p.citizens.length, signalFound: p.signalFound, disconnectedMet: p.disconnectedMet };
  }), { timeout: 10_000 }).toEqual({ citizens: 3, signalFound: true, disconnectedMet: true });
  expect(errors).toEqual([]);
});


test("a Corrientes billboard reveals its hidden symbol through the existing E interaction", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const data = {
      scene: "buenos-aires-2049",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { completed: true },
      throneProgress: { entered: true, inscriptionRead: true, vows: ["memoria", "voluntad", "libertad"],
        hallOpen: true, coreInspected: ["origen", "eco", "enlace"],
        conductors: ["origen", "eco", "enlace"], throneOpen: true,
        bossIntro: true, bossHealth: 0, bossDefeated: true, transmissionExamined: true, completed: true },
      cityProgress: { entered: true, introSeen: true, visionActive: true, disconnectedMet: true,
        citizens: ["ba-man-1", "ba-woman-1", "ba-executive-1"], signalFound: true },
      positions: { "buenos-aires-2049": { x: -42, z: -23.9, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const city = page.locator(".neon-buenos-aires");
  await expect(city.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(city.locator(".studio-examine-cue")).toContainText("anuncio de Corrientes", { timeout: 20_000 });
  await page.screenshot({ path: testInfo.outputPath("corrientes-transmitter.png") });
  await page.keyboard.press("e");
  await expect(city.locator(".city-notice")).toContainText("MARCA OCULTA: MIRAR");
  await city.locator(".city-notice").getByRole("button", { name: "Continuar" }).click();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.cityProgress.advertInspected
  ), { timeout: 10_000 }).toContain("mirar");
  expect(errors).toEqual([]);
});
