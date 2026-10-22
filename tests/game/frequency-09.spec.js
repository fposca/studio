import { test, expect } from "@playwright/test";

test("FREQUENCY 09 absorbs NeonBoy, reveals the future and returns with saved progress", async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const data = {
      scene: "arcade", credits: 0,
      masterTape: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 },
      clubQuest: {
        hugoSuggestedShow: true, credentialGranted: true, charlyMet: true,
        backstageAuthorized: true, soundcheckStarted: true,
        inspected: ["mixer", "amplifier", "microphone"], soundcheckComplete: true,
        clubShowReady: true, recitalCompleted: true, anomalySeen: true,
        anomalyInvestigated: true, arcadeClueKnown: true,
      },
      positions: { arcade: { x: 0, z: -16.65, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const arcade = page.getByRole("region", { name: "Arcade 1999" });
  await expect(arcade.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(arcade.getByText("[E] INTERACTUAR CON FREQUENCY 09")).toBeVisible();
  await page.keyboard.press("e");
  await expect(arcade.locator(".frequency-intake")).toBeVisible();
  await page.getByRole("button", { name: "Pausar juego" }).click();
  await expect(page.getByRole("dialog", { name: /pausa/i })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(arcade.locator(".frequency-intake")).toBeVisible();
  await page.getByRole("dialog", { name: /pausa/i }).getByRole("button", { name: "Continuar" }).click();
  await page.keyboard.press("e");
  await expect(page.getByRole("region", { name: "Interior de FREQUENCY 09" })).toBeVisible({ timeout: 12_000 });
  const realm = page.getByRole("region", { name: "Interior de FREQUENCY 09" });
  await expect(realm.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(realm.getByText("0/2 ecos encontrados")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("frequency-realm.png") });
  const walk = async (duration) => {
    await page.keyboard.down("w");
    await page.waitForTimeout(duration);
    await page.keyboard.up("w");
  };
  await walk(2200);
  await expect(realm.getByText(/EXAMINAR ECO DEL CLUB/)).toBeVisible();
  await page.keyboard.press("e");
  await expect(realm.getByText("1/2 ecos encontrados")).toBeVisible();
  await walk(1900);
  await expect(realm.getByText(/EXAMINAR PANTALLA DEL TIEMPO/)).toBeVisible();
  await page.keyboard.press("e");
  await expect(realm.getByText("2/2 ecos encontrados")).toBeVisible();
  await walk(2000);
  await expect(realm.getByText(/EXAMINAR VISI/)).toBeVisible();
  await page.keyboard.press("e");
  await expect(realm.getByText("ESTO TODAV\u00cdA NO SUCEDI\u00d3")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("frequency-vision.png") });
  await expect(arcade).toBeVisible({ timeout: 20_000 });
  await expect(arcade.getByText("EL FUTURO QUE NO EXISTE")).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    return save.slots.autosave.data.arcadeProgress.recordStoreFutureVisionSeen;
  })).toBe(true);
  await page.keyboard.press("e");
  await expect(arcade.locator(".frequency-intake")).toHaveCount(0);
  await arcade.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: /Entrar a la Tienda de Discos/ }).click();
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store.getByText("La tienda sigue intacta... por ahora.")).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    return save.slots.autosave.data.arcadeProgress.recordStoreRevisitedAfterVision;
  })).toBe(true);
  expect(errors).toEqual([]);
});

test("FREQUENCY 09 stays dormant before the recital anomaly", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    const data = {
      scene: "arcade", credits: 0,
      masterTape: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 },
      clubQuest: { anomalySeen: false },
      positions: { arcade: { x: 0, z: -16.65, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const arcade = page.getByRole("region", { name: "Arcade 1999" });
  await expect(arcade.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(arcade.getByText("[E] INTERACTUAR CON FREQUENCY 09")).toBeVisible();
  await page.keyboard.press("e");
  await expect(arcade.getByText(/Mejor no tocar esto todav/)).toBeVisible();
  await expect(arcade.locator(".frequency-intake")).toHaveCount(0);
});
