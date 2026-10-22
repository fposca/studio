import { test, expect } from "@playwright/test";

test("ORBIT DUEL opens from its cabinet, accepts controls and Escape restores the Arcade", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const data = { scene: "arcade", credits: 0,
      masterTape: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 },
      clubQuest: { credentialGranted: true, anomalySeen: true },
      positions: { arcade: { x: -7.8, z: .8, yaw: Math.PI, viewYaw: 0 } } };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const arcade = page.getByRole("region", { name: "Arcade 1999" });
  await expect(arcade.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(arcade.getByText("[E] JUGAR ORBIT DUEL")).toBeVisible();
  await page.keyboard.press("e");
  const duel = arcade.getByRole("dialog", { name: "ORBIT DUEL" });
  await expect(duel.getByText("PRESS START")).toBeVisible();
  await duel.getByRole("button", { name: /INICIAR/ }).click();
  await expect(duel.getByText("PRESS START")).toHaveCount(0);
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("Space");
  await page.waitForTimeout(800);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("Space");
  await expect(duel.getByText(/TIEMPO 7[0-4]s/)).toBeVisible();
  await page.evaluate(() => document.querySelector(".universe-pause-trigger").click());
  const pause = page.getByRole("dialog", { name: /pausa/i });
  await expect(pause).toBeVisible();
  const pausedClock = await duel.locator(".orbit-duel-panel > span").textContent();
  await page.waitForTimeout(1100);
  expect(await duel.locator(".orbit-duel-panel > span").textContent()).toBe(pausedClock);
  await pause.getByRole("button", { name: "Continuar" }).click();
  await page.keyboard.press("Escape");
  await expect(duel).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.arcadeProgress.gamesPlayed)).toBe(1);
  await expect(arcade.getByText("[E] JUGAR ORBIT DUEL")).toBeVisible();
  await page.keyboard.press("e");
  await expect(duel.getByText("PRESS START")).toBeVisible();
  await duel.getByRole("button", { name: /SALIR/ }).click();
  await expect(duel).toHaveCount(0);
  expect(errors).toEqual([]);
});
