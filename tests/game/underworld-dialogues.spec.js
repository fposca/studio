import { test, expect } from "@playwright/test";

function chapter11Save(progress, position) {
  return {
    scene: "underworld",
    chapter10Progress: {
      coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
      signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true,
    },
    underworldProgress: progress,
    positions: { underworld: position },
  };
}

async function enterChapter(page, data) {
  await page.addInitScript((save) => {
    const key = "neonboy.universe.saves.v1";
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version: 1, slots: { autosave: { savedAt: Date.now(), data: save } },
    }));
  }, data);
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-underworld");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  return level;
}

test("the first-visit introduction can be skipped and stays completed after reload", async ({ page }) => {
  const data = chapter11Save(
    { arrivalRead: false, introSeen: false, visionActive: false, bridgeCrossed: false, enemies: [3, 3] },
    { x: 0, z: 10.5, yaw: Math.PI, viewYaw: 0 },
  );
  let level = await enterChapter(page, data);
  await expect(level.locator('[data-sequence="intro"]')).toBeVisible();
  await expect(level.locator('[data-line-id="neonboy-infierno-intro-01"]')).toContainText("Buenos Aires");
  await level.getByRole("button", { name: "Omitir subtítulo" }).click();
  await expect(level.locator('[data-sequence="intro"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.underworldProgress.introSeen)).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  level = page.locator(".neon-underworld");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.waitForTimeout(1100);
  await expect(level.locator('[data-sequence="intro"]')).toHaveCount(0);
});

test("Alma replies in order and the second interaction uses the follow-up", async ({ page }) => {
  const data = chapter11Save(
    { arrivalRead: true, introSeen: true, visionActive: false, bridgeCrossed: false, enemies: [3, 3] },
    { x: -1.1, z: -4.4, yaw: Math.PI, viewYaw: 0 },
  );
  const level = await enterChapter(page, data);
  await expect(level.getByRole("status").filter({ hasText: /Alma Errante/ })).toBeVisible();
  await page.keyboard.press("e");
  await expect(level.locator('[data-line-id="alma-01"]')).toBeVisible();
  await level.getByRole("button", { name: "Continuar" }).click();
  await expect(level.locator('[data-line-id="neonboy-alma-01"]')).toBeVisible();
  await level.getByRole("button", { name: "Omitir" }).click();
  await expect(level.locator(".underworld-conversation-overlay")).toHaveCount(0);
  await expect(level.getByRole("status").filter({ hasText: /Alma Errante/ })).toBeVisible();
  await page.keyboard.press("e");
  await expect(level.locator('[data-line-id="alma-05"]')).toBeVisible();
});

test("the Witness warns NeonBoy before combat and remembers the encounter", async ({ page }) => {
  const data = chapter11Save(
    { arrivalRead: true, introSeen: true, visionActive: true, bridgeCrossed: true,
      flames: [0,1,2,3,4,5], bridgeTrialComplete: true, ferrymanTrialStarted: true,
      memoryClueRead: true, memorySymbols: ["memory","oblivion","rebirth"], ferryCompleted: true,
      mechanismSolved: true, ambushHealth: [0,0], enemies: [0, 0], gargolaHealth: 0,
      testigoHealth: 5, testigoIntroSeen: false },
    { x: 0, z: -43, yaw: Math.PI, viewYaw: 0 },
  );
  const level = await enterChapter(page, data);
  await expect(level.locator('[data-line-id="testigo-01"]')).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("e");
  await expect(level.locator('[data-line-id="neonboy-testigo-01"]')).toBeVisible();
  await level.getByRole("button", { name: "Omitir" }).click();
  await expect(level.locator('[data-sequence="testigo-intro"]')).toHaveCount(0);
  await expect(level.getByText(/Vencé al Testigo/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.underworldProgress.testigoIntroSeen)).toBe(true);
});
