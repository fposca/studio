import { test, expect } from "@playwright/test";

// Measure the rendered floor, so a UI badge alone cannot pass the Matrix-vision check.
async function greenCoverage(page) {
  const screenshot = await page.locator(".neon-throne canvas").screenshot();
  return page.evaluate(async base64 => {
    const image = new Image(); image.src = "data:image/png;base64," + base64;
    await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = 240; canvas.height = 150;
    const context = canvas.getContext("2d"); context.drawImage(image, 0, 0, 240, 150);
    const { data } = context.getImageData(65, 75, 110, 50);
    let green = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (g > 35 && g > r * 1.3 && g > b * 1.15) green++;
    }
    return green / (data.length / 4);
  }, screenshot.toString("base64"));
}

for (const stage of ["hall", "chamber", "shield", "aftermath"]) {
  test(`Chapter 13 ${stage} renders materials and energy without WebGL errors`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico"))
        errors.push(message.text() + " at " + message.location().url);
    });
    await page.addInitScript((stage) => {
      const hall = stage === "hall", final = stage === "aftermath", arena = stage === "shield" || final;
      const data = {
        scene: "abyss-throne",
        chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
          signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
        underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
          enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
        cathedralProgress: { completed: true },
        throneProgress: {
          entered: true, inscriptionRead: true, vows: hall ? [] : ["memoria", "voluntad", "libertad"], hallOpen: !hall,
          coreInspected: hall ? [] : ["origen", "eco", "enlace"], visionActive: true, reflectorIndex: 1,
          conductors: arena ? ["origen", "eco", "enlace"] : hall ? [] : ["origen"],
          throneOpen: arena, bossIntro: arena, bossDefeated: final, bossHealth: final ? 0 : arena ? 8 : 12,
          shieldActive: stage === "shield",
        },
        positions: { "abyss-throne": { x: 0, z: hall ? 8.5 : final ? -82 : arena ? -64 : -22, yaw: Math.PI, viewYaw: 0 } },
      };
      localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
        slots: { autosave: { savedAt: Date.now(), data } } }));
    }, stage);
    await page.goto("/discografia/");
    await page.getByRole("button", { name: /comenzar/i }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    const level = page.locator(".neon-throne");
    await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
    await expect(level.locator("canvas")).toHaveAttribute("data-throne-sovereign", "true");
    await page.screenshot({ path: testInfo.outputPath(`throne-${stage}.png`) });
    const matrixCoverage = stage === "chamber" ? await greenCoverage(page) : 0;
    if (stage === "chamber") expect(matrixCoverage).toBeGreaterThan(.08);
    await level.getByRole("button", { name: /VISIÓN DE FRECUENCIA/ }).click();
    await expect(level).toHaveAttribute("data-frequency-vision", "inactive");
    if (stage === "chamber") {
      await expect.poll(() => greenCoverage(page)).toBeLessThan(matrixCoverage * .4);
      await page.screenshot({ path: testInfo.outputPath("throne-chamber-normal.png") });
    }
    await expect(level.locator(".record-store-webgl-error")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
