import { test, expect } from "@playwright/test";

async function loadUnderworld(page, progress, position) {
  await page.addInitScript(({ progress, position }) => {
    const data = {
      scene: "underworld",
      chapter10Progress: {
        coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true,
      },
      underworldProgress: progress,
      positions: { underworld: position },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({
      version: 1, slots: { autosave: { savedAt: Date.now(), data } },
    }));
  }, { progress, position });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-underworld");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  return level;
}

test("the first flame responds before the arrival inscription is read", async ({ page }) => {
  const level = await loadUnderworld(page,
    { arrivalRead: false, introSeen: true, flames: [], visionActive: false },
    { x: -1.15, z: 5.4, yaw: Math.PI, viewYaw: 0 });
  await expect(level.getByRole("status").filter({ hasText: /Activar llama 1/i })).toBeVisible();
  await page.keyboard.press("e");
  await expect(level.locator(".underworld-mission")).toContainText("1/6");
  await expect.poll(() => page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.underworldProgress;
    return progress.arrivalRead && progress.flames.includes(0);
  })).toBe(true);
});

test("Memoria remains visible and collectible when it is the last missing symbol", async ({ page }, testInfo) => {
  const level = await loadUnderworld(page,
    { arrivalRead: true, introSeen: true, flames: [0,1,2,3,4,5],
      bridgeTrialComplete: true, bridgeCrossed: true, ferrymanTrialStarted: true,
      memoryClueRead: false, memorySymbols: ["oblivion", "rebirth"], visionActive: false },
    { x: 0, z: 10.5, yaw: Math.PI, viewYaw: 0 });
  await expect(level.locator(".underworld-mission")).toContainText("libro plateado");
  await page.screenshot({ path: testInfo.outputPath("memory-visible-at-start.png") });
  await expect(level.locator(".studio-examine-cue")).toContainText("Memoria");
  await page.keyboard.press("e");
  await expect(level.locator(".underworld-message")).toContainText("La Memoria emerge");
  await level.locator(".underworld-message").getByRole("button", { name: "Continuar" }).click();
  await expect(level.locator(".studio-examine-cue")).toContainText("Recoger");
  await page.keyboard.press("e");
  await expect(level.locator(".underworld-mission")).toContainText("barca");
  await expect.poll(() => page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.underworldProgress;
    return progress.memorySymbols.includes("memory") && progress.memorySymbols.length === 3;
  })).toBe(true);
});

test("the Olvido symbol can be collected on the open walkway in frequency vision", async ({ page }) => {
  const level = await loadUnderworld(page,
    { arrivalRead: true, introSeen: true, flames: [0,1,2,3,4,5],
      bridgeTrialComplete: true, bridgeCrossed: true, ferrymanTrialStarted: true,
      memoryClueRead: true, memorySymbols: ["memory"], visionActive: true },
    { x: -0.6, z: -9.05, yaw: Math.PI, viewYaw: 0 });
  await expect(level.locator(".studio-examine-cue")).toContainText("Olvido");
  await page.keyboard.press("e");
  await expect(level.locator(".underworld-mission")).toContainText("Renacimiento");
  await expect.poll(() => page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.underworldProgress;
    return progress.memorySymbols.includes("oblivion");
  })).toBe(true);
});

test("the Renacimiento seal explains that it needs the Neon Orb", async ({ page }) => {
  const level = await loadUnderworld(page,
    { arrivalRead: true, introSeen: true, flames: [0,1,2,3,4,5],
      bridgeTrialComplete: true, bridgeCrossed: true, ferrymanTrialStarted: true,
      memoryClueRead: true, memorySymbols: ["memory", "oblivion"], visionActive: true },
    { x: -0.3, z: -12.1, yaw: Math.PI, viewYaw: 0 });
  await expect(level.locator(".studio-examine-cue")).toContainText("Renacimiento");
  await page.keyboard.press("e");
  await expect(level.locator(".underworld-message")).toContainText("F o clic izquierdo");
});

test("the sixth flame wakes the dangerous bridge without completing chapter 11", async ({ page }, testInfo) => {
  const level = await loadUnderworld(page,
    { arrivalRead: true, introSeen: true, flames: [0, 1, 2, 3, 4], visionActive: false },
    { x: 1.45, z: -7.6, yaw: Math.PI, viewYaw: 0 });
  await expect(level.getByRole("status").filter({ hasText: /llama 6/i })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("bridge-flames-before-activation.png") });
  await page.keyboard.press("e");
  await expect(level.locator(".underworld-mission")).toContainText("Visión de Frecuencia");
  await expect(level.locator(".underworld-mission")).toContainText("LLAMAS · 6/6");
  await expect(level).toHaveAttribute("data-frequency-vision", "inactive");
  await page.screenshot({ path: testInfo.outputPath("bridge-awakened.png") });
});

test("the ferry crosses the lava and restores normal control at the ritual platform", async ({ page }, testInfo) => {
  const level = await loadUnderworld(page,
    { arrivalRead: true, introSeen: true, flames: [0,1,2,3,4,5], visionActive: true,
      bridgeTrialComplete: true, bridgeCrossed: true, ferrymanTrialStarted: true,
      memoryClueRead: true, memorySymbols: ["memory", "oblivion", "rebirth"],
      ferryStarted: false, ferryCompleted: false },
    { x: 2.55, z: -11.3, yaw: Math.PI, viewYaw: 0 });
  await expect(level.getByRole("status").filter({ hasText: /barca infernal/i })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("ferry-docked.png") });
  await page.keyboard.press("e");
  await expect(level.locator('[data-sequence="ferry-ride"]')).toBeVisible();
  await expect(level.locator("canvas")).toHaveAttribute("data-underworld-transporting", "true");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: testInfo.outputPath("ferry-underway.png") });
  await expect(level.locator(".underworld-mission")).toContainText("mecanismo de las Tres Almas", { timeout: 25_000 });
  await expect(level.locator(".underworld-mission")).toContainText("BARCA · CRUZADA");
  await expect(level.locator("canvas")).toHaveAttribute("data-underworld-transporting", "false");
  await page.screenshot({ path: testInfo.outputPath("ritual-landing.png") });
  await expect.poll(() => page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.underworldProgress;
    return progress.ferryCompleted;
  }), { timeout: 10_000 }).toBe(true);
});

test("the final ritual ring awakens the ambush only after the saved order", async ({ page }, testInfo) => {
  const level = await loadUnderworld(page,
    { arrivalRead: true, introSeen: true, flames: [0,1,2,3,4,5], visionActive: true,
      bridgeTrialComplete: true, bridgeCrossed: true, ferrymanTrialStarted: true,
      memorySymbols: ["memory", "oblivion", "rebirth"], ferryCompleted: true,
      ringSequence: ["memory", "oblivion"], mechanismSolved: false },
    { x: -1.8, z: -35.6, yaw: Math.PI, viewYaw: 0 });
  await expect(level.getByRole("status").filter({ hasText: /anillo del Renacimiento/i })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("ritual-altars.png") });
  await page.keyboard.press("e");
  await expect(level.locator(".underworld-mission")).toContainText("emboscada de las dos", { timeout: 10_000 });
  await expect(level.locator(".underworld-mission")).toContainText("ANILLOS");
  await expect(level.locator(".underworld-mission")).toContainText("EMBOSCADA");
  await expect(level.locator(".record-store-webgl-error")).toHaveCount(0);
});

test("the Witness shield and frequency runes render without WebGL errors", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const level = await loadUnderworld(page,
    { arrivalRead: true, introSeen: true, flames: [0,1,2,3,4,5], visionActive: true,
      bridgeTrialComplete: true, bridgeCrossed: true, ferrymanTrialStarted: true,
      memorySymbols: ["memory","oblivion","rebirth"], ferryCompleted: true,
      mechanismSolved: true, ambushHealth: [0,0], combatVersion: 1,
      enemies: [0,0], gargolaHealth: 0, testigoHealth: 3,
      testigoIntroSeen: true, shieldActive: true, witnessRunes: [] },
    { x: 0, z: -42.6, yaw: Math.PI, viewYaw: 0 });
  await expect(level.locator(".underworld-mission")).toContainText("runas del escudo");
  await page.screenshot({ path: testInfo.outputPath("witness-shield.png") });
  await expect(level.locator(".record-store-webgl-error")).toHaveCount(0);
  expect(errors).toEqual([]);
});
