export async function loadLevel(page, level) {
  await page.evaluate(async (id) => {
    const { GameWorld } = await import("/src/game/gameWorld.js");
    const previous = window.game.inspect().world.snapshot();
    const world = new GameWorld({ level: id, inventory: previous.inventory, equipped: previous.equipped, score: previous.score });
    const save = { version: 1, savedAt: Date.now(), period: "night", camera: { yaw: 0.15, pitch: 0.26, distance: 7.5 }, world: world.serialize() };
    world.dispose();
    await window.game.loadSave(save); window.game.setPaused(false);
  }, level);
}
