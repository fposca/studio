import { test, expect } from "@playwright/test";

const masterTape = { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 };
const clubQuest = {
  hugoSuggestedShow: true, credentialGranted: true, charlyMet: true,
  backstageAuthorized: true, soundcheckStarted: true,
  inspected: ["mixer", "amplifier", "microphone"], soundcheckComplete: true,
  recitalCompleted: true, anomalySeen: true,
};

test("the anomaly unlocks Arcade 1999 on the map and the exit returns to the map", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(({ masterTape, clubQuest }) => {
    localStorage.setItem("neonboy.universe.master-tape.v1", JSON.stringify({ version: 1, progress: masterTape }));
    localStorage.setItem("neonboy.universe.club-show.v1", JSON.stringify({ version: 1, progress: clubQuest }));
  }, { masterTape, clubQuest });
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Arcade 1999" }).click();
  await expect(map.getByRole("button", { name: "Entrar a Arcade 1999" })).toBeEnabled();
  await map.getByRole("button", { name: "Entrar a Arcade 1999" }).click();
  const arcade = page.getByRole("region", { name: "Arcade 1999" });
  await expect(arcade.locator('.record-store-3d')).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(arcade.getByText("ARCADE 1999", { exact: true })).toBeVisible();
  await expect(arcade.getByText("[E] Volver al mapa")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("arcade-entrance.png") });
  await page.keyboard.press("e");
  await expect(map).toBeVisible();
  await map.getByRole("button", { name: "Seleccionar Arcade 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Arcade 1999" }).click();
  await expect(arcade.locator('.record-store-3d')).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.down("w");
  try {
    await expect(arcade.getByText("[E] Examinar FREQUENCY 09")).toBeVisible({ timeout: 18_000 });
  } finally {
    await page.keyboard.up("w");
  }
  await arcade.getByRole("button", { name: "MAPA" }).click();
  await map.getByRole("button", { name: "Seleccionar Tienda de Discos" }).click();
  await map.getByRole("button", { name: "Entrar a la Tienda de Discos" }).click();
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store.locator('.record-store-3d')).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await store.getByRole("button", { name: "MAPA" }).click();
  await map.getByRole("button", { name: "Seleccionar Arcade 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Arcade 1999" }).click();
  await expect(arcade.locator('.record-store-3d')).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(arcade.getByText("[E] Examinar FREQUENCY 09")).toBeVisible();
  expect(errors).toEqual([]);
});

test("saved player and edited cabinet positions survive the redesign and E advances its lines", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.addInitScript(({ masterTape, clubQuest }) => {
    const data = { scene: "arcade", credits: 4, masterTape, clubQuest,
      positions: { arcade: { x: 2.5, z: -15.1, yaw: Math.PI, viewYaw: 0 } } };
    localStorage.setItem("neonboy-arcade-1999-transforms-v1", JSON.stringify({
      frequency09Cabinet: { position: [2.5, 0, -17], rotation: [0, 0, 0], scale: 1.1, reach: 2.25 },
    }));
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  }, { masterTape, clubQuest });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const arcade = page.getByRole("region", { name: "Arcade 1999" });
  await expect(arcade.locator('.record-store-3d')).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(arcade.getByText("[E] Examinar FREQUENCY 09")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("frequency-09.png") });
  for (const line of ["no recuerdo haber visto", "símbolo parecido", "antes de meter una ficha"]) {
    await page.keyboard.press("e");
    await expect(arcade.locator('.studio-examine-message')).toContainText(line);
  }
  await page.keyboard.press("Escape");
  await expect(arcade.locator('.studio-examine-message')).toHaveCount(0);
  const transforms = await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy-arcade-1999-transforms-v1")));
  expect(transforms.frequency09Cabinet.position).toEqual([2.5, 0, -17]);
  expect(transforms.frequency09Cabinet.scale).toBe(1.1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Menú de pausa" })).toBeVisible();
});
