import { test, expect } from "@playwright/test";

for (const reducedMotion of [false, true]) {
  test(`enemy plasma, fire and impact render and release GPU resources (reduced motion: ${reducedMotion})`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico")) errors.push(message.text());
    });
    await page.goto("/discografia/");
    await page.evaluate(async reduced => {
      const { createEnemyProjectilePreview } = await import("/tests/game/support/enemyProjectilePreview.js");
      window.projectilePreview = createEnemyProjectilePreview(reduced);
    }, reducedMotion);
    const canvas = page.locator("#enemy-projectile-preview");
    await canvas.screenshot({ path: testInfo.outputPath("enemy-orbs-flight.png") });
    const impact = await page.evaluate(() => window.projectilePreview.showImpact());
    expect(impact.hits).toBe(1);
    expect(impact.impactVisible).toBe(true);
    await canvas.screenshot({ path: testInfo.outputPath("enemy-orbs-impact.png") });
    const disposed = await page.evaluate(() => window.projectilePreview.dispose());
    expect(disposed).toEqual({ remainingGeometry: 0, remainingTextures: 0 });
    expect(errors).toEqual([]);
  });
}
