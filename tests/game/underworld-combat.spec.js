import { test, expect } from "@playwright/test";

test("enemy orbs and fireballs hit, spread, and stop when their owner falls", async ({ page }) => {
  await page.goto("/discografia/");
  const result = await page.evaluate(async () => {
    const { exerciseEnemyProjectiles } = await import("/tests/game/support/underworldCombatHarness.js");
    return exerciseEnemyProjectiles();
  });
  expect(result.counts).toEqual({ centinela: 1, gargola: 3, testigo: 2 });
  expect(result.damage.centinela).toBe(1);
  expect(result.damage.gargola).toBeGreaterThanOrEqual(1);
  expect(result.damage.testigo).toBeGreaterThanOrEqual(1);
  expect(result.damageBehindPylon).toBe(0);
  expect(result.shotsAfterDefeat).toBe(0);
});

test("the bridge encounter loads enemy health bars and attacks without WebGL errors", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico"))
      errors.push(message.text());
  });
  await page.addInitScript(() => {
    const data = {
      scene: "underworld",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { arrivalRead: true, introSeen: true, visionActive: true,
        bridgeCrossed: true, bridgeTrialComplete: true, flames: [0,1,2,3,4,5],
        ferrymanTrialStarted: true, memorySymbols: ["memory","oblivion","rebirth"],
        ferryCompleted: true, mechanismSolved: true, ambushHealth: [0,0],
        combatVersion: 1, enemies: [5, 5], gargolaHealth: 4,
        testigoHealth: 8, testigoIntroSeen: false },
      positions: { underworld: { x: 0, z: -32, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-underworld");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  const subtitle = level.locator('[data-sequence="sentinel-0"]');
  if (await subtitle.isVisible()) await subtitle.getByRole("button", { name: "Omitir subtítulo" }).click();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: testInfo.outputPath("sentinel-combat.png") });
  await expect(level.locator(".record-store-webgl-error")).toHaveCount(0);
  expect(errors).toEqual([]);
});
