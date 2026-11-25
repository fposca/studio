import { test, expect } from "@playwright/test";

test("Chapter 13 transmission opens navigable Buenos Aires 2049 and saves Obelisk exploration", async ({ page }, testInfo) => {
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
        bossIntro: true, bossHealth: 0, bossDefeated: true,
        transmissionExamined: true, completed: true },
      positions: { "buenos-aires-2049": { x: 0, z: 42, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const city = page.locator(".neon-buenos-aires");
  await expect(city.getByRole("heading", { name: "BUENOS AIRES 2049", level: 2 })).toBeVisible();
  await expect(city.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(city.locator("canvas")).toHaveAttribute("data-city-actors", /ba-man-1.*ba-disconnected/, { timeout: 30_000 });
  await expect(city.locator(".city-arrival, .city-subtitle")).toHaveCount(0, { timeout: 30_000 });
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-spawn.png") });
  await page.keyboard.down("Shift"); await page.keyboard.down("w");
  await expect(city.getByText(/Reconoc.*el Obelisco/)).toBeVisible({ timeout: 20_000 });
  await page.keyboard.up("w"); await page.keyboard.up("Shift");
  await city.getByRole("button", { name: "Continuar" }).click();
  await expect(city.getByText("OBELISCO / RECONOCIDO")).toBeVisible();
  const before = Number(await city.locator("canvas").getAttribute("data-city-player-z"));
  await page.keyboard.down("s");
  await page.waitForTimeout(1300);
  await page.keyboard.up("s");
  await expect.poll(async () => Number(await city.locator("canvas").getAttribute("data-city-player-z")), { timeout: 10_000 }).toBeGreaterThan(before);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.cityProgress.obeliskExplored), { timeout: 10_000 }).toBe(true);
  await city.getByRole("button", { name: "MAPA" }).click();
  await city.getByRole("button", { name: /CAP.*TULO 14.*BUENOS AIRES 2049/ }).click();
  await expect(city.getByRole("button", { name: /Entrar a Buenos Aires 2049/ })).toBeVisible();
  await city.getByRole("button", { name: "Cerrar mapa" }).click();
  await page.screenshot({ path: testInfo.outputPath("buenos-aires-2049.png") });
  expect(errors).toEqual([]);
});

test("the completed Chapter 13 transmission travels directly to Chapter 14", async ({ page }) => {
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
        bossIntro: true, bossDefeated: true, transmissionExamined: true, completed: true },
      positions: { "abyss-throne": { x: 0, z: -86, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const throne = page.locator(".neon-throne");
  await expect(throne.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.press("e");
  await expect(throne.getByRole("dialog", { name: /Cap.*tulo 13 completado/i })).toBeVisible();
  await throne.getByRole("button", { name: "Viajar a Buenos Aires 2049" }).click();
  await expect(page.locator(".neon-buenos-aires .record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
});

test("Chapter 14 keeps its touch controls and frequency vision at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
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
        bossIntro: true, bossDefeated: true, transmissionExamined: true, completed: true },
      cityProgress: { entered: true, introSeen: true },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const city = page.locator(".neon-buenos-aires");
  await expect(city.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(city.getByRole("button", { name: /Mover/ }).first()).toBeVisible();
  await city.getByRole("button", { name: "Cambiar vista" }).click();
  await expect(city.locator(".record-store-3d")).toHaveAttribute("data-view", "primera");
  await city.getByRole("button", { name: /VISI.*N DE FRECUENCIA/ }).click();
  await expect(city).toHaveAttribute("data-frequency-vision", "active");
});
