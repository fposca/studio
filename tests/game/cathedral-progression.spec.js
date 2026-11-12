import { test, expect } from "@playwright/test";

test("recovering a memory is nonblocking, repeat-safe and survives reload without replay", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico")) errors.push(message.text()); });
  await page.addInitScript(() => {
    if (localStorage.getItem("neonboy.universe.saves.v1")) return;
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { entered: true, inscriptionRead: true, visionActive: true,
        seals: ["memoria", "tiempo", "verdad"], memories: [] },
      positions: { cathedral: { x: -3.4, z: -24.6, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  async function enter() {
    await page.goto("/discografia/");
    await page.getByRole("button", { name: /comenzar/i }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator(".neon-cathedral .record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  }
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data);
  await enter();
  await page.keyboard.press("e");
  await expect(page.locator(".cathedral-recall-toast")).toContainText("PRIMER RECUERDO RECUPERADO");
  await expect(page.locator(".cathedral-mission")).toContainText("1/3");
  await expect(page.locator(".underworld-conversation-overlay")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("first-memory.jpg"), quality: 85 });
  await page.keyboard.press("e");
  await expect.poll(async () => (await saved()).cathedralProgress.memories).toEqual(["nave"]);
  const start = (await saved()).positions.cathedral;
  await page.keyboard.down("s");
  await page.waitForTimeout(750);
  await page.keyboard.up("s");
  await expect.poll(async () => {
    const end = (await saved()).positions.cathedral;
    return Math.hypot(end.x - start.x, end.z - start.z);
  }).toBeGreaterThan(.1);
  await enter();
  await expect(page.locator(".cathedral-mission")).toContainText("1/3");
  await expect(page.locator(".cathedral-recall-toast")).toHaveCount(0);
  await expect(page.locator(".cathedral-skip-sequence")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the seal follows all four progress states; quality budgets and cinematic camera restore correctly", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico")) errors.push(message.text()); });
  await page.goto("/discografia/");
  const result = await page.evaluate(async () => {
    const { runCathedralProgressProbe } = await import("/tests/game/support/cathedralProgressProbe.js");
    return runCathedralProgressProbe();
  });
  expect(result.states.map(s => s.lit)).toEqual([0, 1, 2, 3]);
  expect(result.states.slice(0, 3).every(s => s.visible && s.open === 0)).toBe(true);
  expect(result.states[3].open).toBeGreaterThan(0);
  expect(result.states[3].open).toBeLessThan(1);
  expect(result.counts).toEqual([40, 30, 11]);
  expect(result).toMatchObject({ open: true, decorated: true, restored: true, skipped: true, noReplay: true, memoryEvents: 3 });
  expect(errors).toEqual([]);
});

test("the final revelation can be skipped without completing or replaying the farewell", async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("neonboy.universe.saves.v1")) return;
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { entered: true, inscriptionRead: true, visionActive: true,
        seals: ["memoria", "tiempo", "verdad"], memories: ["nave", "partenon", "fracturada"] },
      positions: { cathedral: { x: 0, z: -50.7, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  async function enter() {
    await page.goto("/discografia/");
    await page.getByRole("button", { name: /comenzar/i }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator(".neon-cathedral .record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  }
  await enter();
  await page.keyboard.press("e");
  const dialogue = page.getByRole("dialog", { name: /Conversaci.n con Custodio de los Recuerdos/ });
  for (let i = 0; i < 8; i++) await dialogue.getByRole("button", { name: "Continuar" }).click();
  await dialogue.getByRole("button", { name: "Terminar" }).click();
  await expect(page.locator(".cathedral-revelation")).toBeVisible();
  await page.getByRole("button", { name: "Omitir secuencia", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /Transmisi.n original localizada/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Escuchar al Custodio" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"))
    .slots.autosave.data.cathedralProgress.recordingHeard)).toBe(true);
  await enter();
  await expect(page.locator(".cathedral-revelation")).toHaveCount(0);
  await expect(page.locator(".cathedral-skip-sequence")).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: /Transmisi.n original localizada/ })).toHaveCount(0);
});
