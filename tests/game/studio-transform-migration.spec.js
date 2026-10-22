import { test, expect } from "@playwright/test";

test("old Hugo and chair settings migrate without losing other model edits", async ({ page }) => {
  await page.goto("/src/game/studioAssetTransforms.json");
  const result = await page.evaluate(async () => {
    const key = "neonboy-recording-studio-transforms-v1";
    localStorage.setItem(key, JSON.stringify({
      chair: { position: [0, 0, 0], rotation: [0, 180, 0], scale: 1 },
      hugo: { position: [-0.35, 0.16, 0.22], rotation: [0, 0, 0], scale: 1.6, reach: 1.8, indicator: [0, 1.12, 0] },
      "monitor-right": { position: [0.25, -0.23, 0], rotation: [0, -12, 0], scale: 1 },
      sofa: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 }
    }));
    const studio = await import("/src/game/studioAssets.js");
    const loaded = studio.loadStudioAssetTransforms();
    studio.saveStudioAssetTransforms(loaded);
    const saved = JSON.parse(localStorage.getItem(key));
    // A later manual rotation in the transform editor remains the user's choice.
    saved.sofa.rotation = [0, 0, 0];
    localStorage.setItem(key, JSON.stringify(saved));
    const manualRotation = studio.loadStudioAssetTransforms().sofa.rotation;
    return { loaded, saved, manualRotation };
  });
  expect(result.loaded.chair.scale).toBe(0.8);
  expect(result.loaded.hugo).toMatchObject({ position: [0, 0, 0], scale: 1.5, reach: 1.5 });
  expect(result.loaded["monitor-right"].position[0]).toBe(0.25);
  expect(result.loaded.sofa.rotation).toEqual([0, -90, 0]);
  expect(result.saved.__sofaWallPlacement).toBe(1);
  expect(result.manualRotation).toEqual([0, 0, 0]);
  expect(result.saved.__producerCalibration).toBe(5);
});
