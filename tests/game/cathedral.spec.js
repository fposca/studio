import { test, expect } from "@playwright/test";

test("Chapter 11 red door opens the Cathedral and preserves the playable scene", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico")) errors.push(message.text());
  });
  await page.addInitScript(() => {
    const data = {
      scene: "underworld",
      chapter10Progress: {
        coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true,
      },
      underworldProgress: {
        bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
        gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true, introSeen: true,
      },
      positions: { underworld: { x: 0, z: -47.9, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const bridge = page.locator(".neon-underworld:not(.neon-cathedral)");
  await expect(bridge.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(bridge.getByText(/cruzar la puerta roja/i)).toBeVisible();
  await page.keyboard.press("e");
  const cathedral = page.locator(".neon-cathedral");
  await expect(cathedral).toBeVisible();
  await expect(cathedral.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(cathedral.getByRole("heading", { name: "LA CATEDRAL DE LOS CONDENADOS" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("cathedral-arrival.png") });
  await cathedral.getByRole("button", { name: "Continuar" }).click();
  await cathedral.getByRole("button", { name: /VISI.N DE FRECUENCIA/ }).click();
  await expect(cathedral).toHaveAttribute("data-frequency-vision", "active");
  await expect(cathedral.locator(".record-store-webgl-error")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.mapUnlocks.includes("cathedral"))).toBe(true);
  expect(errors).toEqual([]);
});

test("the optimized Custodian speaks in the Archive and unlocks the Anomaly conversation", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
        gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { entered: true, inscriptionRead: true, seals: ["memoria", "tiempo", "verdad"] },
      positions: { cathedral: { x: 3.5, z: -34.5, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-cathedral");
  const canvas = level.locator(".record-store-3d");
  await expect(canvas).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(canvas.locator("canvas")).toHaveAttribute("data-cathedral-custodian", "true");
  await expect(level.getByText(/Custodio de los Recuerdos/i)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("custodian-archive.png") });
  await page.keyboard.press("e");
  await expect(level.locator('[data-line-id="custodio-01"]')).toBeVisible();
  await expect(canvas.locator("canvas")).toHaveAttribute("data-cathedral-animation", "talk");
  await page.keyboard.press("e");
  await expect(level.locator('[data-line-id="neonboy-custodio-01"]')).toBeVisible();
  const dialogue = level.getByRole("dialog", { name: /Conversaci.n con Custodio de los Recuerdos/ });
  for (let i = 0; i < 8; i++) await dialogue.getByRole("button", { name: "Continuar" }).click();
  await dialogue.getByRole("button", { name: "Terminar" }).click();
  await level.getByRole("button", { name: "DIARIO", exact: true }).click();
  await expect(level.getByText(/las puertas no fueron creadas por demonios/i)).toBeVisible();
  await level.getByRole("button", { name: "DIARIO", exact: true }).click();
  await page.keyboard.press("e");
  await expect(level.locator('[data-line-id="neonboy-custodio-06"]')).toBeVisible();
});

test.describe("compact touch layout", () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

  test("Cathedral keeps touch movement, interaction, vision and diary available", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const data = {
        scene: "cathedral",
        chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
          signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
        underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
          gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
        cathedralProgress: { entered: true, seals: [], memories: [] },
        positions: { cathedral: { x: 0, z: 10, yaw: Math.PI, viewYaw: 0 } },
      };
      localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
        slots: { autosave: { savedAt: Date.now(), data } } }));
    });
    await page.goto("/discografia/");
    await page.getByRole("button", { name: /comenzar/i }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    const level = page.locator(".neon-cathedral");
    await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
    const resetChapter = level.getByRole("button", { name: "Reiniciar capitulo 12" });
    await expect(resetChapter).toBeVisible();
    await resetChapter.click();
    await expect(level.getByRole("dialog", { name: /Reiniciar el cap.tulo 12/ })).toBeVisible();
    await level.getByRole("button", { name: "Cancelar" }).click();
    await expect(level.locator(".record-store-mobile-move")).toBeVisible();
    await expect(level.getByRole("button", { name: "Interactuar" })).toBeVisible();
    await level.getByRole("button", { name: /VISI.N DE FRECUENCIA/ }).click();
    await expect(level).toHaveAttribute("data-frequency-vision", "active");
    await level.getByRole("button", { name: "DIARIO", exact: true }).click();
    await expect(level.getByText("DIARIO DE NEONBOY")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("Custodian touch interaction", () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

  test("the altar hint plays the pointing gesture and remains readable on touch", async ({ page }) => {
    await page.addInitScript(() => {
      const data = {
        scene: "cathedral",
        chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
          signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
        underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
          gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
        cathedralProgress: { entered: true, inscriptionRead: true, visionActive: true,
          seals: ["memoria", "tiempo", "verdad"], memories: ["nave", "partenon", "fracturada"],
          custodianMet: true, anomalyHeard: true },
        positions: { cathedral: { x: 3.5, z: -34.5, yaw: Math.PI, viewYaw: 0 } },
      };
      localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
        slots: { autosave: { savedAt: Date.now(), data } } }));
    });
    await page.goto("/discografia/");
    await page.getByRole("button", { name: /comenzar/i }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    const level = page.locator(".neon-cathedral");
    const canvas = level.locator(".record-store-3d");
    await expect(canvas).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
    await level.getByRole("button", { name: "Interactuar" }).click();
    await expect(level.locator('[data-line-id="custodio-10"]')).toBeVisible();
    const dialogue = level.getByRole("dialog", { name: /Conversaci.n con Custodio de los Recuerdos/ });
    for (let i = 0; i < 4; i++) await dialogue.getByRole("button", { name: "Continuar" }).click();
    await expect(level.locator('[data-line-id="custodio-12"]')).toBeVisible();
    await expect(canvas.locator("canvas")).toHaveAttribute("data-cathedral-pointed", "true");
    await dialogue.getByRole("button", { name: "Continuar" }).click();
    await dialogue.getByRole("button", { name: "Terminar" }).click();
    await level.getByRole("button", { name: "DIARIO", exact: true }).click();
    await expect(level.getByText(/Custodio se.al. el Altar de la Primera Voz/)).toBeVisible();
  });
});

test("an old save inside the altar stone is moved outside and cannot walk back through it", async ({ page }) => {
  await page.addInitScript(() => {
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
        gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { entered: true, inscriptionRead: true, seals: ["memoria", "tiempo", "verdad"],
        archiveOpen: true, visionActive: true, memories: ["nave", "partenon", "fracturada"], altarOpen: true },
      positions: { cathedral: { x: 0, z: -52.1, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-cathedral");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  const savedZ = () => page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.positions.cathedral.z);
  await expect.poll(savedZ, { timeout: 10_000 }).toBeGreaterThan(-50.44);
  const beforeMoveSave = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.savedAt);
  await page.keyboard.down("w");
  await page.waitForTimeout(1600);
  await page.keyboard.up("w");
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.savedAt),
  { timeout: 12_000 }).toBeGreaterThan(beforeMoveSave);
  expect(await savedZ()).toBeGreaterThan(-50.44);
});

test("the altar dialogue completes Chapter 12 and persists the next destination", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
        gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { entered: true, inscriptionRead: true, seals: ["memoria", "tiempo", "verdad"],
        archiveOpen: true, visionActive: true, memories: ["nave", "partenon", "fracturada"], altarOpen: true, altarActivated: true },
      positions: { cathedral: { x: 0, z: -50.7, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-cathedral");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(level.getByText(/Altar de la Primera Voz/).last()).toBeVisible();
  await page.keyboard.press("e");
  await expect(level.locator('[data-line-id="registro-primera-voz"]')).toBeVisible();
  await expect(level.locator(".record-store-3d canvas")).toHaveAttribute("data-cathedral-invoked", "true");
  for (let i = 0; i < 8; i++) await level.getByRole("dialog", { name: /Conversaci.n con Custodio de los Recuerdos/ })
    .getByRole("button", { name: "Continuar" }).click();
  await level.getByRole("dialog", { name: /Conversaci.n con Custodio de los Recuerdos/ })
    .getByRole("button", { name: "Terminar" }).click();
  await expect(level.getByRole("dialog", { name: /Transmisi.n original localizada/ })).toContainText("REGISTRO TEMPORAL: INCOMPATIBLE");
  await level.getByRole("button", { name: "Escuchar al Custodio" }).click();
  for (let i = 0; i < 3; i++) await level.getByRole("dialog", { name: /Conversaci.n con Custodio de los Recuerdos/ })
    .getByRole("button", { name: "Continuar" }).click();
  await level.getByRole("dialog", { name: /Conversaci.n con Custodio de los Recuerdos/ })
    .getByRole("button", { name: "Terminar" }).click();
  await expect(level.getByRole("dialog", { name: /Transmisi.n original localizada/ })).toContainText(/CAP.TULO 12 COMPLETADO/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.cathedralProgress.completed)).toBe(true);
  await level.getByRole("button", { name: "Seguir explorando" }).click();
  await level.getByRole("button", { name: "MAPA" }).click();
  await page.getByRole("button", { name: /DESTINO SIGUIENTE . EL TRONO DEL ABISMO/ }).click();
  await expect(page.getByRole("heading", { name: "El Trono del Abismo" })).toBeVisible();
  await expect(page.getByText(/pr.ximamente/i)).toBeVisible();
  expect(errors).toEqual([]);
});



test("the first altar resonator is reachable and persists its tuning step", async ({ page }) => {
  await page.addInitScript(() => {
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
        gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { entered: true, inscriptionRead: true, visionActive: true,
        seals: ["memoria", "tiempo", "verdad"], memories: ["nave", "partenon", "fracturada"],
        altarTuning: true },
      positions: { cathedral: { x: 0, z: -48.7, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-cathedral");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(level.getByText(/resonador PULSO/i)).toBeVisible();
  await page.keyboard.press("e");
  await expect(level.getByText(/RESONADOR ALINEADO/)).toBeVisible();
  await expect(level.getByText(/SINTON.A . 1\/3/)).toBeVisible();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.cathedralProgress.altarSequence),
  { timeout: 10_000 }).toEqual(["pulso"]);
});

test("the final resonator starts the original recording only after the saved sequence", async ({ page }) => {
  await page.addInitScript(() => {
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
        gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { entered: true, inscriptionRead: true, visionActive: true,
        seals: ["memoria", "tiempo", "verdad"], memories: ["nave", "partenon", "fracturada"],
        altarTuning: true, altarSequence: ["pulso", "eco"] },
      positions: { cathedral: { x: -2.35, z: -48.7, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-cathedral");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(level.getByText(/resonador ORIGEN/i)).toBeVisible();
  await page.keyboard.press("e");
  await expect(level.locator('[data-line-id="registro-primera-voz"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.cathedralProgress.altarActivated),
  { timeout: 10_000 }).toBe(true);
});

test("NeonBoy cannot walk through a resonator and can still tune it", async ({ page }) => {
  await page.addInitScript(() => {
    const data = {
      scene: "cathedral",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
        gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { entered: true, inscriptionRead: true, visionActive: true,
        seals: ["memoria", "tiempo", "verdad"], memories: ["nave", "partenon", "fracturada"],
        altarTuning: true },
      positions: { cathedral: { x: 0, z: -47.2, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-cathedral");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.down("w");
  await page.waitForTimeout(1700);
  await page.keyboard.up("w");
  await expect(level.getByText(/resonador PULSO/i)).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const position = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"))
      .slots.autosave.data.positions.cathedral;
    return position.z < -47.5 && position.z > -48.43 && Math.abs(position.x) < .1;
  }), { timeout: 12_000 }).toBe(true);
  await page.keyboard.press("e");
  await expect(level.getByText(/RESONADOR ALINEADO/)).toBeVisible();
});
