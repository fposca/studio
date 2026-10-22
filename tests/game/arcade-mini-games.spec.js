import { test, expect } from "@playwright/test";

for (const [title, id, x, z, key] of [
  ["PIXEL SPRINT", "pixel", -7.8, 3.6, "Space"],
  ["BARRIO BRAWL", "brawl", 6.4, -5.7, "KeyJ"],
  ["JUNGLE PULSE", "jungle", -7.8, -2, "KeyA"],
]) {
  test(title + " opens from its existing cabinet, plays and exits safely", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(({ x, z }) => {
      const data = { scene: "arcade", credits: 0,
        masterTape: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 },
        clubQuest: { credentialGranted: true, anomalySeen: true },
        positions: { arcade: { x, z, yaw: Math.PI, viewYaw: 0 } } };
      localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
        slots: { autosave: { savedAt: Date.now(), data } } }));
    }, { x, z });
    await page.goto("/discografia/");
    await page.getByRole("button", { name: /comenzar/i }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    const arcade = page.getByRole("region", { name: "Arcade 1999" });
    await expect(arcade.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
    await expect(arcade.getByText("[E] JUGAR " + title)).toBeVisible();
    await page.keyboard.press("e");
    const game = arcade.getByRole("dialog", { name: title });
    await expect(game.getByText("PRESS START")).toBeVisible();
    await game.getByRole("button", { name: "INICIAR PARTIDA" }).click();
    await expect(game.getByText("PRESS START")).toHaveCount(0);
    await page.keyboard.press(key);
    await expect(game.getByRole("button", { name: "REINICIAR PARTIDA" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(id + "-playing.png") });
    await page.keyboard.press("Escape");
    await expect(game).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: /pausa/i })).toHaveCount(0);
    await expect.poll(() => page.evaluate((id) => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.arcadeProgress.records[id].plays, id)).toBe(1);
    await expect(arcade.getByText("[E] JUGAR " + title)).toBeVisible();
    if (id === "pixel") {
      await page.keyboard.press("e");
      await game.getByRole("button", { name: "INICIAR PARTIDA" }).click();
      await page.evaluate(() => document.querySelector(".universe-pause-trigger").click());
      const pause = page.getByRole("dialog", { name: /pausa/i });
      await expect(pause).toBeVisible();
      await pause.getByRole("button", { name: "Ir al mapa" }).click();
      await expect(game).toHaveCount(0);
      await expect(page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
