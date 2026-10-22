import { test, expect } from "@playwright/test";

test("Roxy patrols, answers NeonBoy and plays guitar only while the jukebox sounds", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.YT = {
      PlayerState: { PLAYING: 1, BUFFERING: 3, PAUSED: 2, ENDED: 0 },
      Player: class {
        constructor(_frame, options) { window.setTimeout(() => options.events.onReady(), 0); }
        playVideo() {}
        pauseVideo() {}
        stopVideo() {}
        getCurrentTime() { return 4; }
        seekTo() {}
        destroy() {}
      }
    };
  });
  await page.route("https://www.youtube.com/embed/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>Mock YouTube</title>" }));
  await page.goto("/discografia/?direct=1");
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  const canvas = shop.locator(".record-store-3d canvas");
  const prompt = shop.locator(".record-store-nearby");
  await expect(shop).toBeVisible();
  await expect(canvas).toHaveAttribute("data-roxy-state", /idle|walk/);
  await expect(canvas).toHaveAttribute("data-roxy-ready", "true", { timeout: 25_000 });
  await page.evaluate(() => {
    window.roxyVoiceEvents = [];
    const play = HTMLMediaElement.prototype.play;
    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.play = function (...args) {
      if (this.src.includes("/voces/roxy/")) {
        window.roxyVoiceEvents.push({ type: "play", src: decodeURI(this.src) });
        return Promise.resolve();
      }
      return play.apply(this, args);
    };
    HTMLMediaElement.prototype.pause = function (...args) {
      if (this.src.includes("/voces/roxy/")) window.roxyVoiceEvents.push({ type: "pause", src: decodeURI(this.src) });
      return pause.apply(this, args);
    };
  });

  await page.keyboard.down("w");
  await expect(prompt).toContainText("Roxy", { timeout: 12_000 });
  await page.keyboard.up("w");
  await page.keyboard.press("e");

  const roxy = shop.getByRole("dialog", { name: /Roxy/ });
  await expect(roxy).toBeVisible();
  await expect(roxy.locator(".record-store-voice-button")).toHaveCount(0);
  await roxy.getByRole("button", { name: /venís seguido/ }).click();
  await expect(roxy).toContainText("Sí. Hasta que llegaste vos.");
  await expect.poll(() => page.evaluate(() => window.roxyVoiceEvents.some((event) => event.type === "play" && event.src.includes("Hasta-que-llegaste-vos")))).toBe(true);
  await roxy.getByRole("button", { name: "Seguir hablando" }).click();
  await roxy.getByRole("button", { name: /Tengo varios discos/ }).click();
  await expect(roxy).toContainText("¿Querés una medalla o que te deje de hablar?");
  await expect.poll(() => page.evaluate(() => window.roxyVoiceEvents.some((event) => event.type === "play" && event.src.includes("roxy-Felicitaciones.")))).toBe(true);
  await roxy.getByRole("button", { name: "Seguir hablando" }).click();
  await roxy.getByRole("button", { name: /solos de guitarra/ }).click();
  await expect(roxy).toContainText("Prefiero escuchar cómo te alejás. ¡Largo!");
  await expect.poll(() => page.evaluate(() => window.roxyVoiceEvents.some((event) => event.type === "play" && event.src.includes("roxyPrefiero-escuchar")))).toBe(true);
  await roxy.getByRole("button", { name: "Terminar conversación" }).click();
  await expect(prompt).toContainText("Roxy");
  await page.keyboard.press("e");
  await expect(roxy).toContainText("¿Otra vez vos? ¿No te había dicho que te fueras?");
  await expect.poll(() => page.evaluate(() => window.roxyVoiceEvents.some((event) => event.type === "play" && event.src.includes("Otra-vez-vos")))).toBe(true);
  await page.keyboard.press("Escape");

  await shop.getByRole("button", { name: "Abrir rockola" }).click();
  const jukebox = page.getByRole("dialog", { name: "Rockola de Neonboy" });
  await jukebox.getByRole("button", { name: "Tomar monedas de la mesa" }).click();
  await jukebox.getByRole("button", { name: "Elegir video New Born" }).click();
  await expect(canvas).toHaveAttribute("data-roxy-state", "guitar");
  await jukebox.getByRole("button", { name: "Pausar video" }).click();
  await expect(canvas).toHaveAttribute("data-roxy-state", /idle|walk/);

  await jukebox.getByRole("button", { name: "Reproducir video" }).click();
  await expect(canvas).toHaveAttribute("data-roxy-state", "guitar");
  await jukebox.getByRole("button", { name: "Cerrar rockola" }).click();
  await expect(canvas).toHaveAttribute("data-roxy-state", "guitar");
  await shop.getByRole("button", { name: "Abrir rockola" }).click();
  await jukebox.getByRole("button", { name: "Detener video" }).click();
  await expect(canvas).toHaveAttribute("data-roxy-state", /idle|walk/);

  expect(errors).toEqual([]);
});
