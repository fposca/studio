import { test, expect } from "@playwright/test";

test("Burn Lies starts at the stage, plays the real show clips, and R restores exploration", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "" }));
  await page.addInitScript(() => {
    localStorage.setItem("neonboy.universe.master-tape.v1", JSON.stringify({ version: 1,
      progress: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 } }));
    localStorage.setItem("neonboy.universe.club-show.v1", JSON.stringify({ version: 1,
      progress: { hugoSuggestedShow: true, credentialGranted: true, charlyMet: true,
        backstageAuthorized: true, soundcheckStarted: true, inspected: ["mixer", "amplifier", "microphone"],
        soundcheckComplete: true } }));
    window.YT = {
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
      Player: class {
        constructor(frame, options) { this.options = options; window.__concertPlayer = this; setTimeout(() => options.events.onReady(), 0); }
        playVideo() { window.__concertPlayed = (window.__concertPlayed || 0) + 1; this.options.events.onStateChange({ data: 1 }); }
        pauseVideo() { window.__concertPaused = true; this.options.events.onStateChange({ data: 2 }); }
        stopVideo() { window.__concertStopped = true; }
        destroy() { window.__concertDestroyed = true; }
      },
    };
  });
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Club de Rock 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Club de Rock 1999" }).click();
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 100_000 });
  await page.keyboard.down("w");
  await expect(club.getByRole("button", { name: "[E] Iniciar recital" })).toBeVisible({ timeout: 12_000 });
  await page.waitForTimeout(1800); // Keep walking onto the microphone hotspot.
  await page.keyboard.up("w");
  await expect(club.getByRole("button", { name: "[E] Iniciar recital" })).toBeVisible();
  await page.keyboard.press("e");
  await expect(club.getByText("9th Revelation!", { exact: false })).toBeVisible({ timeout: 12_000 });
  await expect(club.getByRole("complementary", { name: "Recital Burn Lies" })).toBeVisible({ timeout: 20_000 });
  await expect(club.getByText("EN VIVO", { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(club.locator("canvas")).toHaveAttribute("data-concert", "live");
  await expect(club.locator("canvas")).toHaveAttribute("data-concert-props", "3");
  for (const id of ["john-zool", "lilith-9", "revenant", "lujan", "charly", "club-rulo", "diego", "club-drunk"])
    await expect(club.locator("canvas")).toHaveAttribute("data-concert-actors", new RegExp(id));
  await expect(club.locator(".club-concert-audio iframe")).toHaveAttribute("src", /-F3IXyy5IEE/);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: testInfo.outputPath("concert-wide.png") });
  for (const mode of ["john", "drums", "audience", "orbit"]) {
    await club.getByLabel("Cámara del recital", { exact: true }).selectOption(mode);
    await expect(club.locator("canvas")).toHaveAttribute("data-concert-camera", mode);
    await page.waitForTimeout(400);
    await page.screenshot({ path: testInfo.outputPath(`concert-${mode}.png`) });
  }
  await club.getByRole("button", { name: "Ajustar recital", exact: true }).click();
  const editor = club.getByRole("complementary", { name: "Ajustar instrumentos del recital" });
  await expect(club.locator("canvas")).toHaveAttribute("data-concert-frozen", "true");
  await expect(club.locator("canvas")).toHaveAttribute("data-concert-camera", "editor");
  await editor.getByRole("combobox").first().selectOption("john-zool");
  await editor.getByLabel("Posición Z", { exact: true }).fill("0.06");
  await editor.getByLabel("Articulacion").selectOption("RightArm");
  await editor.getByLabel("Grados hueso X").fill("35");
  await expect(club.locator("canvas")).toHaveAttribute("data-concert-pose", "john-zool:RightArm");
  await editor.getByRole("button", { name: "Rotar en escena" }).click();
  await expect(editor.getByRole("button", { name: "Cerrar rotador" })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: testInfo.outputPath("concert-pose-gizmo.png") });
  const readJoint = () => Promise.all(["X", "Y", "Z"].map((axis) => editor.getByLabel("Grados hueso " + axis).inputValue()));
  const beforeDrag = await readJoint();
  let dragged = false;
  for (const [sx, sy, ex, ey] of [[790, 444, 774, 512], [718, 374, 787, 397], [655, 444, 682, 510]]) {
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(ex, ey, { steps: 10 });
    await page.mouse.up();
    if (JSON.stringify(await readJoint()) !== JSON.stringify(beforeDrag)) { dragged = true; break; }
  }
  expect(dragged).toBe(true);
  await editor.getByRole("button", { name: "Cerrar rotador" }).click();
  await editor.getByRole("button", { name: "Guardar", exact: false }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy-rock-club-pose-v1"))?.["john-zool"]?.RightArm
    .some((value) => Math.abs(value) > 0))).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy-rock-club-concert-transforms-v1"))["john-zool"].position[2])).toBe(0.06);
  await expect(editor.getByLabel("Anclaje de guitarra")).toHaveValue("waist");
  await editor.getByLabel("Duración del movimiento").fill("3");
  await editor.getByRole("button", { name: "Grabar nueva toma" }).click();
  await expect(club.locator("canvas")).toHaveAttribute("data-concert-motion", "recording");
  await page.waitForTimeout(240);
  await editor.getByLabel("Posición X", { exact: true }).fill("0.12");
  await editor.getByLabel("Grados hueso Y").fill("-24");
  await editor.getByRole("button", { name: "Detener grabación" }).click();
  await expect(club.locator("canvas")).toHaveAttribute("data-concert-motion", "playing");
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy-rock-club-motion-v1"))?.["john-zool"]?.keyframes.length)).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy-rock-club-motion-v1"))?.["john-zool"]?.keyframes
    .some((frame) => frame.bones?.RightArm?.[1] === -24))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("concert-editor.png") });
  await editor.getByRole("button", { name: "Cerrar ajuste" }).click();
  await expect(club.locator("canvas")).toHaveAttribute("data-concert-frozen", "false");
  await club.getByLabel("Cámara del recital", { exact: true }).selectOption("auto");
  await page.keyboard.press("Escape");
  await expect(map).toBeVisible();
  await expect(club.getByRole("complementary", { name: "Recital Burn Lies" })).toHaveCount(0);
  await expect(club.locator("canvas")).toHaveAttribute("data-concert", "idle");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.club-show.v1"))?.progress?.recitalCompleted)).not.toBe(true);
  await map.getByRole("button", { name: "Seleccionar Tienda de Discos" }).click();
  await map.getByRole("button", { name: "Entrar a la Tienda de Discos" }).click();
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store).toBeVisible();
  await expect(club).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.club-show.v1"))?.progress?.recitalCompleted)).not.toBe(true);
  await store.getByRole("button", { name: "MAPA" }).click();
  await map.getByRole("button", { name: "Seleccionar Club de Rock 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Club de Rock 1999" }).click();
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 100_000 });
  await expect(club.getByRole("button", { name: "[E] Iniciar recital" })).toBeVisible({ timeout: 12_000 });
  await page.keyboard.press("e");
  await expect(club.locator("canvas")).toHaveAttribute("data-concert", "live", { timeout: 25_000 });
  await page.keyboard.press("r");
  await expect(club.getByRole("complementary", { name: "Recital Burn Lies" })).toHaveCount(0);
  await expect(club.locator("canvas")).toHaveAttribute("data-concert", "idle");
  await expect(club.locator("canvas")).toHaveAttribute("data-concert-props", "0");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.club-show.v1"))?.progress?.recitalCompleted)).not.toBe(true);
  await expect.poll(() => page.evaluate(() => window.__concertStopped && window.__concertDestroyed)).toBe(true);
  await page.keyboard.down("s");
  await expect(club.getByRole("button", { name: "[E] Iniciar recital" })).toHaveCount(0, { timeout: 6_000 });
  await page.keyboard.up("s");
  await page.keyboard.down("w");
  await expect(club.getByRole("button", { name: "[E] Iniciar recital" })).toBeVisible({ timeout: 8_000 });
  await page.keyboard.up("w");
  await page.keyboard.press("e");
  await expect(club.locator("canvas")).toHaveAttribute("data-concert", "live", { timeout: 25_000 });
  await page.evaluate(() => {
    window.__concertPlayer.options.events.onStateChange({ data: 0 });
    window.__concertPlayer.options.events.onStateChange({ data: 0 });
  });
  await expect(club.getByText("Fin del show")).toBeVisible();
  await expect(club.getByText("SE\u00d1AL DESCONOCIDA")).toBeVisible({ timeout: 8_000 });
  await expect(club.locator("canvas")).toHaveAttribute("data-concert", "idle", { timeout: 16_000 });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.club-show.v1"))?.progress?.anomalySeen)).toBe(true);
  await expect(club.locator(".club-show-hud").getByText("Habl\u00e1 con Riky", { exact: false })).toBeVisible();
  const completedProgress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy.universe.club-show.v1"))?.progress);
  await page.keyboard.press("e");
  await expect(club.locator("canvas")).toHaveAttribute("data-concert", "live", { timeout: 25_000 });
  await club.getByRole("button", { name: "Finalizar show y continuar historia" }).click();
  await expect(club.getByText("Fin del show")).toBeVisible();
  await expect(club.locator(".club-anomaly-overlay")).toBeVisible({ timeout: 8_000 });
  await expect(club.locator("canvas")).toHaveAttribute("data-concert", "idle", { timeout: 16_000 });
  expect(await page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy.universe.club-show.v1"))?.progress)).toEqual(completedProgress);
  expect(errors).toEqual([]);
});

test("finish-story button completes a short show once and stops YouTube audio", async ({ page }) => {
  test.setTimeout(150_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "" }));
  await page.addInitScript(() => {
    localStorage.setItem("neonboy.universe.master-tape.v1", JSON.stringify({ version: 1,
      progress: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 } }));
    localStorage.setItem("neonboy.universe.club-show.v1", JSON.stringify({ version: 1,
      progress: { hugoSuggestedShow: true, credentialGranted: true, charlyMet: true,
        backstageAuthorized: true, soundcheckStarted: true, inspected: ["mixer", "amplifier", "microphone"],
        soundcheckComplete: true } }));
    window.YT = {
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
      Player: class {
        constructor(frame, options) { this.options = options; window.__concertPlayer = this; setTimeout(() => options.events.onReady(), 0); }
        playVideo() { window.__concertPlayed = (window.__concertPlayed || 0) + 1; this.options.events.onStateChange({ data: 1 }); }
        pauseVideo() {}
        stopVideo() { window.__concertStopped = (window.__concertStopped || 0) + 1; }
        destroy() { window.__concertDestroyed = (window.__concertDestroyed || 0) + 1; }
      },
    };
  });
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Club de Rock 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Club de Rock 1999" }).click();
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 75_000 });
  await page.keyboard.down("w");
  await expect(club.getByRole("button", { name: "[E] Iniciar recital" })).toBeVisible({ timeout: 12_000 });
  await page.waitForTimeout(1800);
  await page.keyboard.up("w");
  await expect(club.getByRole("button", { name: "[E] Iniciar recital" })).toBeVisible();
  await page.keyboard.press("e");
  await expect(club.getByText("EN VIVO", { exact: true })).toBeVisible({ timeout: 30_000 });
  const anomalySound = page.waitForResponse((response) =>
    response.url().includes("sonido-anomalia") && response.ok(), { timeout: 10_000 });
  await club.getByRole("button", { name: "Finalizar show y continuar historia" }).click();
  await expect(club.getByText("Fin del show")).toBeVisible();
  await anomalySound;
  await expect.poll(() => page.evaluate(() => window.__concertStopped && window.__concertDestroyed)).toBeTruthy();
  await expect(club.locator(".club-concert-audio iframe")).toHaveCount(0);
  await expect(club.locator(".club-anomaly-overlay")).toBeVisible({ timeout: 8_000 });
  await expect(club.locator("canvas")).toHaveAttribute("data-concert", "idle", { timeout: 16_000 });
  await expect.poll(() => page.evaluate(() => {
    const quest = JSON.parse(localStorage.getItem("neonboy.universe.club-show.v1"))?.progress;
    return quest?.recitalCompleted && quest?.anomalySeen;
  })).toBe(true);
  await expect(club.locator(".club-concert-finish")).toHaveCount(0);
  expect(errors).toEqual([]);
});
