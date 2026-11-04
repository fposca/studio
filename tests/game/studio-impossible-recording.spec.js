import { test, expect } from "@playwright/test";

const saveKey = "neonboy.universe.saves.v1";
function seedStudio(page, studioProgress, position) {
  return page.addInitScript(({ saveKey, studioProgress, position }) => {
    const data = {
      scene: "studio", credits: 0,
      studioProgress,
      masterTape: { phase: "tape", reviewed: [], studioTokens: 0 },
      arcadeProgress: {
        recordStoreFutureVisionSeen: true, recordStoreRevisitedAfterVision: true,
        recordStoreGhostSeen: true,
      },
      positions: { studio: position },
    };
    localStorage.setItem(saveKey, JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  }, { saveKey, studioProgress, position });
}
async function enterStudio(page) {
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const studio = page.getByRole("region", { name: "Neon Recording Studio 1999" });
  await expect(studio.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  return studio;
}

test("the ghost unlocks Hugo's chapter without hiding his other topics", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seedStudio(page, {}, { x: -1.5, z: 1.9, yaw: Math.PI, viewYaw: 0 });
  const studio = await enterStudio(page);
  await expect(studio.getByText(/Habl.* con Hugo sobre la se.al/)).toBeVisible();
  await page.keyboard.press("e");
  const dialog = studio.getByRole("dialog", { name: /Conversaci.n con Hugo/ });
  await expect(dialog.getByText(/Hugo! Necesito que escuches algo/)).toBeVisible();
  await dialog.getByRole("button", { name: /Vamos a revisar la se.al/ }).click();
  await expect(studio.getByText(/Examin.* la computadora del estudio/)).toBeVisible();
  await dialog.getByRole("button", { name: /Seguir preguntando/ }).click();
  await expect(dialog.getByRole("button", { name: /Puedo ver las sesiones/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the CRT offers a three-band puzzle and reveals the message only after decoding", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seedStudio(page, { impossibleRecordingStarted: true }, { x: 5, z: -2.45, yaw: Math.PI, viewYaw: 0 });
  const studio = await enterStudio(page);
  await page.keyboard.press("e");
  const workbench = studio.getByRole("dialog", { name: "Archivo de sesiones" });
  await expect(workbench.getByText("F09_SIGNAL.WAV")).toBeVisible();
  await workbench.getByRole("button", { name: /Analizar se.al/ }).click();
  const analyzer = studio.getByRole("dialog", { name: /Analizador de la se.al 09/ });
  await expect(analyzer.getByRole("button", { name: /AISLAR SE.AL/ })).toBeDisabled();
  for (let index = 0; index < 3; index++) await analyzer.getByRole("button", { name: /Pedir pista a Hugo|Hugo: mostrar ajuste/ }).click();
  await expect(analyzer.getByRole("button", { name: /AISLAR SE.AL/ })).toBeEnabled();
  await analyzer.getByRole("button", { name: /AISLAR SE.AL/ }).click();
  await expect(analyzer.getByRole("button", { name: /REPRODUCIR AL REV.S/ })).toBeEnabled();
  await analyzer.getByRole("button", { name: /REPRODUCIR AL REV.S/ }).click();
  await expect(analyzer.getByText(/LA PUERTA YA EST.* ABIERTA/)).toBeVisible();
  await analyzer.getByRole("button", { name: "Volver al archivo" }).click();
  await workbench.getByRole("button", { name: "Cerrar Archivo de sesiones" }).click();
  await expect(studio.getByText(/Contale a Hugo lo que apareci./)).toBeVisible();
  expect(errors).toEqual([]);
});

test("Hugo's reaction triggers the studio anomaly once and saves the rooftop clue", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seedStudio(page, {
    impossibleRecordingStarted: true, signalComputerExamined: true,
    signalAnalysisCompleted: true, reversedSignalDecoded: true,
  }, { x: -1.5, z: 1.9, yaw: Math.PI, viewYaw: 0 });
  const studio = await enterStudio(page);
  await page.keyboard.press("e");
  const reaction = studio.getByRole("dialog", { name: /Conversaci.n con Hugo/ });
  await expect(reaction.getByText("Esto no tiene sentido.")).toBeVisible();
  await reaction.getByRole("button", { name: /deten.* la reproducci.n/ }).click();
  await expect(studio.locator(".studio-anomaly-overlay")).toBeVisible();
  await expect(studio.locator(".studio-anomaly-overlay")).toHaveCount(0, { timeout: 20_000 });
  const after = studio.getByRole("dialog", { name: /Conversaci.n con Hugo/ });
  await expect(after.getByText(/llegando desde afuera del estudio/)).toBeVisible();
  await after.getByRole("button", { name: /Buscar un punto elevado/ }).click();
  await expect(studio.getByText(/Investig.* el origen de la se.al desde un punto elevado/)).toBeVisible();
  await expect.poll(() => page.evaluate((key) =>
    JSON.parse(localStorage.getItem(key))?.slots?.autosave?.data?.studioProgress?.rooftopClueKnown, saveKey
  )).toBe(true);
  expect(errors).toEqual([]);
});
