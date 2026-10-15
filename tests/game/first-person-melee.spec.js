import { writeFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test("NeonBoy gloves throw forceful punches and a matching kick", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Omitir intro" }).click();
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    window.game.setPaused(true);
  });
  async function pose(name, attack) {
    const state = await page.evaluate((attack) => {
      const { world, input, renderer, scene, camera, firstPersonView } = window.game.inspect();
      const actor = { ...world.player, equipped: "unarmed", attack };
      firstPersonView.update(actor, 1, input.orbit.yaw, camera.aspect);
      firstPersonView.update(actor, 0, input.orbit.yaw, camera.aspect);
      renderer.render(scene, camera); firstPersonView.render(renderer);
      const right = firstPersonView.scene.getObjectByName("Guante derecho");
      const left = firstPersonView.scene.getObjectByName("Guante izquierdo");
      const boot = firstPersonView.scene.getObjectByName("Patada en primera persona");
      const armMaterials = [];
      right.children[0].traverse((mesh) => { if (mesh.isMesh) armMaterials.push({ opacity: mesh.material.opacity,
        transparent: mesh.material.transparent, depthWrite: mesh.material.depthWrite,
        name: mesh.material.name, textured: Boolean(mesh.material.map) }); });
      return { image: renderer.domElement.toDataURL("image/png"),
        right: right.position.toArray(), left: left.position.toArray(),
        boot: { visible: boot.visible, position: boot.position.toArray(), meshCount: boot.children.length, materials: boot.children.map((mesh) => ({ name: mesh.material.name, textured: Boolean(mesh.material.map) })), vertices: boot.children.reduce((count, mesh) => count + mesh.geometry.attributes.position.count, 0) }, armMaterials };
    }, attack);
    await writeFile(testInfo.outputPath(name + ".png"), Buffer.from(state.image.split(",")[1], "base64"));
    delete state.image;
    return state;
  }
  const idle = await pose("idle", null);
  const pulled = await pose("punch-windup", { kind: "punch", side: "Right", elapsed: 0.08 });
  const rightHit = await pose("punch-impact-right", { kind: "punch", side: "Right", elapsed: 0.2 });
  const leftHit = await pose("punch-impact-left", { kind: "punch", side: "Left", elapsed: 0.2 });
  const kick = await pose("kick-impact", { kind: "kick", elapsed: 0.34 });
  expect(idle.armMaterials.length).toBeGreaterThanOrEqual(1);
  expect(idle.armMaterials.length).toBeLessThanOrEqual(5);
  expect(idle.armMaterials.every((material) => material.opacity === 1 && !material.transparent && material.depthWrite)).toBe(true);
  expect(idle.armMaterials.some((material) => material.name === "BakedMaterial" && material.textured)).toBe(true);
  expect(pulled.right[2]).toBeGreaterThan(idle.right[2] + 0.1);
  expect(rightHit.right[2]).toBeLessThan(idle.right[2] - 0.6);
  expect(Math.abs(rightHit.right[0])).toBeLessThan(0.08);
  expect(leftHit.left[2]).toBeLessThan(idle.left[2] - 0.6);
  expect(Math.abs(leftHit.left[0])).toBeLessThan(0.08);
  expect(kick.boot.visible).toBe(true);
  expect(kick.boot.meshCount).toBeLessThanOrEqual(5);
  expect(kick.boot.vertices).toBeGreaterThan(500);
  expect(kick.boot.materials.some((material) => material.name === "BakedMaterial" && material.textured)).toBe(true);
  expect(kick.boot.position[2]).toBeLessThan(-1);
  expect(errors).toEqual([]);
});
