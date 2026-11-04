import { test, expect } from "@playwright/test";

const saveKey = "neonboy.universe.saves.v1";
function seedStore(page, progress, position) {
  return page.addInitScript(({ saveKey, progress, position }) => {
    const data = {
      scene: "store", credits: 10,
      masterTape: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 },
      clubQuest: { anomalySeen: true, credentialGranted: true },
      arcadeProgress: { frequency09EventSeen: true, recordStoreFutureVisionSeen: true,
        recordStoreRevisitedAfterVision: true, ...progress },
      positions: { store: position },
    };
    localStorage.setItem(saveKey, JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  }, { saveKey, progress, position });
}
async function openSavedStore(page) {
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(store.locator("canvas")).toHaveAttribute("data-ghost-loaded", "true");
  return store;
}

test("first return plays once and Tito keeps his old topics beside the new investigation", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seedStore(page, {}, { x: -3.6, z: 9.8, yaw: Math.PI, viewYaw: 0 });
  const store = await openSavedStore(page);
  await expect(store.locator(".record-store-story-event--intro")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("altered-store-intro.png") });
  await expect(store.getByText("Hablá con Tito sobre lo que pasó.")).toBeVisible({ timeout: 12_000 });
  await expect(store.getByText(/Hablar con Tito/)).toBeVisible();
  await page.keyboard.press("e");
  const talk = store.getByRole("dialog", { name: /Conversación con Tito/ });
  await expect(talk).toBeVisible();
  await expect(talk.getByRole("button", { name: /Tenés discos de NeonBoy/ })).toBeVisible();
  await talk.getByRole("button", { name: /Tito.*Qué pasó acá/ }).click();
  await expect(talk.getByText("Parecía alguien gritando desde muy lejos.")).toBeVisible();
  await talk.getByRole("button", { name: /Qué pasó con la rockola/ }).click();
  await expect(talk.getByText(/Se encendió sin monedas/)).toBeVisible();
  await talk.getByRole("button", { name: "Cerrar conversación" }).click();
  await expect(store.getByText("Investigá la rockola.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the impossible record summons the GLB ghost once and leaves Hugo as the objective", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seedStore(page, {
    recordStoreAlteredIntroSeen: true,
    recordStoreTitoInterviewed: true,
    recordStoreJukeboxAnomalySeen: true,
  }, { x: -2.1, z: -11.05, yaw: Math.PI, viewYaw: 0 });
  const store = await openSavedStore(page);
  await expect(store.getByText("E · Examinar disco extraño")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("altered-store-wall-clue.png") });
  await page.keyboard.press("e");
  await expect(store.getByText("Esta portada no estaba antes.")).toBeVisible();
  await store.getByRole("button", { name: "Continuar" }).click();
  await page.keyboard.press("e");
  await expect(store.getByText("09 — REPRODUCIR AL REVÉS")).toBeVisible();
  await store.getByRole("button", { name: "Continuar" }).click();
  await expect(store.locator(".record-store-story-event--ghost")).toBeVisible();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: testInfo.outputPath("altered-store-ghost.png") });
  await expect(store.getByText("Creo que Hugo puede ayudarme con esto.")).toBeVisible({ timeout: 10_000 });
  await store.getByRole("button", { name: "Continuar" }).click();
  await expect(store.getByText("Volvé al estudio y hablá con Hugo Mendez sobre la señal.")).toBeVisible();
  await expect.poll(() => page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key));
    return save.slots.autosave.data.arcadeProgress.recordStoreGhostSeen;
  }, saveKey)).toBe(true);
  await store.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await expect(map).toBeVisible();
  await map.getByRole("button", { name: /Entrar a la Tienda de Discos/ }).click();
  await expect(store.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(store.locator(".record-store-story-event")).toHaveCount(0);
  await expect(store.getByText("Volvé al estudio y hablá con Hugo Mendez sobre la señal.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the first approach to the jukebox shows FREQUENCY 09 without spending coins or playing video", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seedStore(page, {
    recordStoreAlteredIntroSeen: true,
    recordStoreTitoInterviewed: true,
  }, { x: -8.1, z: 9.6, yaw: Math.PI, viewYaw: 0 });
  const store = await openSavedStore(page);
  await expect(store.locator(".record-store-story-event--jukebox")).toBeVisible();
  await page.waitForTimeout(700);
  await page.screenshot({ path: testInfo.outputPath("jukebox-anomaly.png") });
  await expect(store.getByText("Investigá la rockola.")).toHaveCount(0, { timeout: 8_000 });
  await expect(store.getByText("Examiná el disco extraño.")).toBeVisible();
  await expect(store.getByText("10/10 monedas")).toBeVisible();
  await store.getByRole("button", { name: "Abrir rockola" }).click();
  const jukebox = store.getByRole("dialog", { name: "Rockola de Neonboy" });
  await expect(jukebox).toBeVisible();
  await expect(jukebox.getByText("EN ESPERA")).toBeVisible();
  await jukebox.getByRole("button", { name: "Cerrar rockola" }).click();
  await expect(store.getByText("10/10 monedas")).toBeVisible();
  expect(errors).toEqual([]);
});

test("a missing ghost model does not advance the investigation", async ({ page }) => {
  test.setTimeout(120_000);
  await page.route("**/*fantasma*.glb", (route) => route.abort());
  await seedStore(page, {
    recordStoreAlteredIntroSeen: true,
    recordStoreTitoInterviewed: true,
    recordStoreJukeboxAnomalySeen: true,
    recordStoreStrangeRecordSeen: true,
    recordStoreReverseClueKnown: true,
  }, { x: -2.1, z: -11.05, yaw: Math.PI, viewYaw: 0 });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(store.locator("canvas")).toHaveAttribute("data-ghost-loaded", "false");
  await page.waitForTimeout(5_000);
  await expect(store.locator(".record-store-story-event--ghost")).toHaveCount(0);
  await expect(store.getByText("Investigá la aparición al fondo del local.")).toBeVisible();
  expect(await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key));
    return save.slots.autosave.data.arcadeProgress.recordStoreGhostSeen;
  }, saveKey)).not.toBe(true);
});
