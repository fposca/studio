import { test, expect } from "@playwright/test";
import { openCity } from "./citySession.js";

const repaired = {
  vigilanteEncountered: true, vigilanteStarted: true, vigilanteHealth: 0, vigilanteDefeated: true,
  fuegoStarted: true, fuegoKeyDiscovered: true, fuegoKeyTaken: true, fuegoKeyInstalled: true,
  fuegoPowerTerminalExamined: true, fuegoPowerMaintenanceOpen: true, fuegoPowerCellTaken: true, fuegoPowerCellInstalled: true,
  fuegoNavigationClues: ["calle", "cielo", "libertad"], fuegoNavigationSequence: ["calle", "cielo", "libertad"],
  fuegoNavigationModuleTaken: true, fuegoNavigationModuleInstalled: true, fuegoRecordShown: true,
  fuegoPowered: true, fuegoFlightUnlocked: true, fuegoFlightStarted: true,
  originTransmissionRecovered: true, fuegoChaseCompleted: true,
};

test("studio ambience produces real audio, responds to the console, pauses and remembers mute", async ({ page }, info) => {
  test.setTimeout(180000);
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  // Instrument native Web Audio only in this test: measure the real output and
  // graph, rather than accepting a UI label or an unexecuted controller state.
  await page.addInitScript(() => {
    const Native = window.AudioContext; window.audioContexts = [];
    window.AudioContext = class extends Native {
      constructor(...args) { super(...args); this.sources = []; this.gains = []; window.audioContexts.push(this); }
      createBufferSource() { const source = super.createBufferSource(); this.sources.push(source); return source; }
      createGain() { const gain = super.createGain(); this.gains.push(gain); return gain; }
    };
  });
  await openCity(page, repaired, 3);
  await page.evaluate(() => {
    const storage = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    const data = storage.slots.autosave.data;
    data.scene = "chapter15-studio";
    data.chapter15Progress = { started: true, arrived: true, hugoConsulted: true, consoleExamined: true,
      noteRead: true, hiddenChannelSeen: true, mixSequence: [], visionActive: false };
    data.positions["chapter15-studio"] = { x: .6, z: 1.47, yaw: Math.PI, viewYaw: 0 };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify(storage));
  });
  const launch = async () => {
    await page.reload();
    await page.getByRole("button", { name: /comenzar/i }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator(".neon-chapter15 .record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90000 });
  };
  const sample = () => page.evaluate(() => {
    const context = window.audioContexts.find(c => c.sources.filter(s => s.loop).length === 4);
    if (!context) return { state: "not-created", loops: 0, levels: [], rms: 0 };
    if (!context.probe) { context.probe = context.createAnalyser(); context.probe.fftSize = 2048; context.gains[0].connect(context.probe); }
    const data = new Float32Array(2048); context.probe.getFloatTimeDomainData(data);
    return { state: context.state, loops: context.sources.filter(s => s.loop).length,
      levels: context.gains.slice(0, 5).map(n => n.gain.value), rms: Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length) };
  });
  await launch();
  await page.keyboard.press("Shift"); // also verifies the fallback gesture unlock
  await expect.poll(async () => (await sample()).state).toBe("running");
  await expect.poll(async () => (await sample()).rms).toBeGreaterThan(.001);
  const normal = await sample();
  await page.keyboard.press("c");
  await expect.poll(async () => (await sample()).levels[4]).toBeGreaterThan(.10);
  const matrix = await sample();
  await expect(page.locator(".chapter15-cue")).toContainText("Consola");
  await page.locator(".chapter15-cue").click();
  const consolePanel = page.getByRole("dialog", { name: "Consola del cuarto canal" });
  await consolePanel.getByRole("button", { name: "Apagar ruido" }).click();
  await expect.poll(async () => (await sample()).levels[2]).toBeLessThan(.01);
  expect((await sample()).state).toBe("running");
  await consolePanel.getByRole("button", { name: "Recuperar pulso" }).click();
  await expect.poll(async () => (await sample()).levels[3]).toBeGreaterThan(.16);
  const pulsing = await sample();
  await consolePanel.getByRole("button", { name: "Abrir canal oculto" }).click();
  await expect.poll(async () => (await sample()).levels[4]).toBeLessThan(.025);
  await consolePanel.getByRole("button", { name: "Buscar la cinta alterada" }).click();
  const mute = page.getByRole("button", { name: "Sonido ambiente", exact: true });
  await mute.click(); await expect(mute).toHaveAttribute("aria-pressed", "false");
  await expect.poll(async () => (await sample()).state).toBe("suspended");
  await mute.click(); await expect.poll(async () => (await sample()).state).toBe("running");
  await page.getByRole("button", { name: "Pausar juego" }).click();
  await expect.poll(async () => (await sample()).state).toBe("suspended");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect.poll(async () => (await sample()).state).toBe("running");
  expect((await sample()).loops).toBe(4);
  await mute.click();
  await launch();
  await expect(mute).toHaveAttribute("aria-pressed", "false");
  expect((await sample()).loops).toBe(0);
  await mute.click(); await expect.poll(async () => (await sample()).rms).toBeGreaterThan(.001);
  // Restoring a solved save must keep the noise off immediately.
  expect((await sample()).levels[2]).toBe(0);
  await info.attach("native-audio-measurements", { body: JSON.stringify({ normal, matrix, pulsing, restored: await sample() }, null, 2), contentType: "application/json" });
  await page.screenshot({ path: info.outputPath("studio-ambient-control.png") });
  expect(errors).toEqual([]);
});
