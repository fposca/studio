import { test, expect } from "@playwright/test";

for (const reducedMotion of [false, true]) {
  test("Cathedral energy renders, preserves clues, pauses and releases GPU resources; reduced motion: " + reducedMotion, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico")) errors.push(message.text());
    });
    await page.goto("/discografia/");
    const initial = await page.evaluate(async reduced => {
      const { createCathedralEnergyPreview } = await import("/tests/game/support/cathedralEnergyPreview.js");
      window.cathedralEnergyPreview = createCathedralEnergyPreview(reduced);
      return { ...window.cathedralEnergyPreview.initial, pausedStill: window.cathedralEnergyPreview.pausedStill };
    }, reducedMotion);
    expect(initial).toEqual({ clueVisible: false, portalVisible: false, moves: !reducedMotion, pausedStill: true });
    const canvas = page.locator("#cathedral-energy-preview");
    await canvas.screenshot({ path: testInfo.outputPath("relics.png") });
    const revealed = await page.evaluate(() => window.cathedralEnergyPreview.reveal());
    expect(revealed).toEqual({ clueVisible: true, portalVisible: true, restored: true });
    await canvas.screenshot({ path: testInfo.outputPath("relics-and-portal.png") });
    const remaining = await page.evaluate(() => window.cathedralEnergyPreview.dispose());
    expect(remaining).toEqual({ geometries: 0, textures: 0 });
    expect(errors).toEqual([]);
  });
}
