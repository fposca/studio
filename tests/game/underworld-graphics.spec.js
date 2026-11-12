import { test, expect } from "@playwright/test";

async function openBridge(page) {
  await page.addInitScript(() => {
    const data = {
      scene: "underworld",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { arrivalRead: true, introSeen: true, visionActive: true,
        bridgeCrossed: false, enemies: [3, 3] },
      positions: { underworld: { x: 0, z: -13.2, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-underworld");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  return level;
}

for (const compact of [false, true]) {
  test(`underworld materials compile in both visions (${compact ? "compact / reduced motion" : "desktop"})`, async ({ page }, testInfo) => {
    if (compact) {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      // The development shell has no favicon; all scene and shader errors still fail.
      if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico"))
        errors.push(message.text() + " " + message.location().url);
    });
    const level = await openBridge(page);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: testInfo.outputPath("bridge-frequency.png") });
    await level.getByRole("button", { name: /VISIÓN DE FRECUENCIA/ }).click();
    await expect(level).toHaveAttribute("data-frequency-vision", "inactive");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: testInfo.outputPath("bridge-normal.png") });
    await level.getByRole("button", { name: /VISIÓN DE FRECUENCIA/ }).click();
    await expect(level).toHaveAttribute("data-frequency-vision", "active");
    await page.waitForTimeout(300);
    await expect(level.locator(".record-store-webgl-error")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
