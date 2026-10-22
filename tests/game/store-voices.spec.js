import { test, expect } from "@playwright/test";

test("Tito and Rulo speak, and changing or closing a dialogue stops the previous voice", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/discografia/?direct=1");
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  const prompt = shop.locator(".record-store-nearby");
  await expect(shop).toBeVisible();
  await page.evaluate(() => {
    window.storeVoiceEvents = [];
    const play = HTMLMediaElement.prototype.play;
    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.play = function (...args) {
      if (this.src.includes("/voces/")) {
        window.storeVoiceEvents.push({ type: "play", src: decodeURI(this.src) });
        return Promise.resolve();
      }
      return play.apply(this, args);
    };
    HTMLMediaElement.prototype.pause = function (...args) {
      if (this.src.includes("/voces/")) window.storeVoiceEvents.push({ type: "pause", src: decodeURI(this.src) });
      return pause.apply(this, args);
    };
  });
  await shop.getByRole("button", { name: "Reproducir Anubis Servant" }).click();
  await page.keyboard.down("a");
  await expect(prompt).toContainText("Tito", { timeout: 10_000 });
  await page.keyboard.up("a");
  await page.keyboard.press("e");
  const tito = shop.getByRole("dialog", { name: /Tito/ });
  await tito.getByRole("button", { name: /discos de NeonBoy/ }).click();
  await expect.poll(() => page.evaluate(() => window.storeVoiceEvents.some((event) => event.type === "play" && event.src.includes("tito-tengo toda la coleccion")))).toBe(true);
  await tito.getByRole("button", { name: /Repetir voz de Tito/ }).click();
  await expect.poll(() => page.evaluate(() => window.storeVoiceEvents.filter((event) => event.type === "play" && event.src.includes("tito-tengo toda la coleccion")).length)).toBe(2);
  await tito.getByRole("button", { name: /preguntas/ }).click();
  await expect.poll(() => page.evaluate(() => window.storeVoiceEvents.some((event) => event.type === "pause" && event.src.includes("tito-tengo toda la coleccion")))).toBe(true);
  await tito.getByRole("button", { name: /dueño/ }).click();
  await expect.poll(() => page.evaluate(() => window.storeVoiceEvents.some((event) => event.type === "play" && event.src.includes("tito-Soy-el-dueño")))).toBe(true);
  await tito.getByRole("button", { name: "Seguir hablando" }).click();
  await expect.poll(() => page.evaluate(() => window.storeVoiceEvents.some((event) => event.type === "play" && event.src.includes("tito-Bien,-pibe.")))).toBe(true);
  await page.keyboard.press("Escape");

  await page.keyboard.down("d");
  await page.waitForTimeout(3400);
  await page.keyboard.up("d");
  await page.keyboard.down("w");
  await expect(prompt).toContainText("Rulo", { timeout: 12_000 });
  await page.keyboard.up("w");
  await page.keyboard.press("e");
  const rulo = shop.getByRole("dialog", { name: /Rulo/ });
  await expect(rulo).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.storeVoiceEvents.some((event) => event.type === "play" && event.src.includes("rulo-eh vos")))).toBe(true);

  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => window.storeVoiceEvents.some((event) => event.type === "pause" && event.src.includes("rulo-eh vos")))).toBe(true);
});
