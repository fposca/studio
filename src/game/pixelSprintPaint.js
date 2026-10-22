import { PIXEL_GROUND, PIXEL_HEIGHT, PIXEL_LEVEL, PIXEL_LIMIT, PIXEL_WIDTH, PIXEL_WORLD } from "./pixelSprintLogic.js";

export function paintPixelSprint(ctx, game) {
  const { cameraX: cam, player: p } = game;
  ctx.imageSmoothingEnabled = false;
  const sky = ctx.createLinearGradient(0, 0, 0, PIXEL_HEIGHT);
  sky.addColorStop(0, "#100c31"); sky.addColorStop(.65, "#352062"); sky.addColorStop(1, "#98365a");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, PIXEL_WIDTH, PIXEL_HEIGHT);
  ctx.fillStyle = "#f9b8eb"; ctx.fillRect(526, 42, 32, 32); ctx.fillStyle = "#d668ba"; ctx.fillRect(544, 42, 16, 32);
  for (let i = -1; i < 18; i++) {
    const x = i * 52 - ((cam * .19) % 52);
    const h = 74 + (i * 43 % 82);
    ctx.fillStyle = i % 3 ? "#171431" : "#221b42";
    ctx.fillRect(x, 310 - h, 44, h);
    ctx.fillStyle = "#76547c";
    for (let y = 318 - h; y < 296; y += 16) for (let dx = 7; dx < 40; dx += 13)
      if ((i + y + dx) % 4) ctx.fillRect(x + dx, y, 4, 5);
  }
  for (let i = -1; i < 10; i++) {
    const x = i * 94 - ((cam * .47) % 94);
    ctx.fillStyle = "#39274d"; ctx.fillRect(x, 267, 85, 60);
    ctx.fillStyle = i % 2 ? "#ea70bd" : "#65dce5";
    ctx.fillRect(x + 18, 283, 48, 4); ctx.fillRect(x + 18, 296, 31, 3);
  }
  for (let x = Math.floor(cam / 64) * 64 - 64; x < cam + PIXEL_WIDTH + 64; x += 64) {
    const gap = PIXEL_LEVEL.gaps.some((g) => x + 32 > g.x && x + 32 < g.x + g.w);
    if (gap) continue;
    const sx = Math.round(x - cam);
    ctx.fillStyle = "#44324f"; ctx.fillRect(sx, PIXEL_GROUND, 64, 72);
    ctx.fillStyle = "#ef8cc9"; ctx.fillRect(sx, PIXEL_GROUND, 64, 5);
    ctx.fillStyle = "#725174"; ctx.fillRect(sx + 2, PIXEL_GROUND + 15, 60, 3);
    ctx.fillStyle = "#291e40"; ctx.fillRect(sx + 28, PIXEL_GROUND + 33, 4, 29);
  }
  for (const block of PIXEL_LEVEL.blocks) {
    const x = Math.round(block.x - cam);
    if (x < -40 || x > 650) continue;
    ctx.fillStyle = "#0f1b32"; ctx.fillRect(x, block.y, block.w, block.h);
    ctx.fillStyle = "#ff9a66"; ctx.fillRect(x, block.y, block.w, 5);
    ctx.fillStyle = "#ec5da5"; ctx.fillRect(x + 5, block.y + 12, 7, 4);
  }
  for (const platform of PIXEL_LEVEL.platforms) {
    const x = Math.round(platform.x - cam);
    if (x + platform.w < 0 || x > PIXEL_WIDTH) continue;
    ctx.fillStyle = "#371d56"; ctx.fillRect(x, platform.y, platform.w, 14);
    ctx.fillStyle = "#85e8e3"; ctx.fillRect(x, platform.y, platform.w, 4);
    ctx.fillStyle = "#c755aa";
    for (let dx = 8; dx < platform.w; dx += 24) ctx.fillRect(x + dx, platform.y + 7, 7, 3);
  }
  for (const coin of game.coins) {
    if (coin.taken) continue;
    const x = Math.round(coin.x - cam);
    if (x < -10 || x > 650) continue;
    ctx.fillStyle = "#fff1aa"; ctx.fillRect(x - 6, coin.y - 7, 12, 14);
    ctx.fillStyle = "#ffbc55"; ctx.fillRect(x - 4, coin.y - 6, 8, 12);
    ctx.fillStyle = "#875137"; ctx.fillRect(x - 1, coin.y - 3, 2, 7);
  }
  for (const enemy of game.enemies) {
    if (!enemy.alive) continue;
    const x = Math.round(enemy.x + Math.sin(game.time * 2 + enemy.x) * 16 - cam);
    if (x < -30 || x > 660) continue;
    ctx.fillStyle = "#1a1127"; ctx.fillRect(x - 12, enemy.y + 8, 24, 16);
    ctx.fillStyle = "#a04ee0"; ctx.fillRect(x - 11, enemy.y, 22, 15);
    ctx.fillStyle = "#f9d2ed"; ctx.fillRect(x - 7, enemy.y + 5, 4, 4); ctx.fillRect(x + 3, enemy.y + 5, 4, 4);
    ctx.fillStyle = "#f05a9e"; ctx.fillRect(x - 14, enemy.y + 16, 5, 4); ctx.fillRect(x + 9, enemy.y + 16, 5, 4);
  }
  const px = Math.round(p.x - cam), py = Math.round(p.y);
  if (p.invulnerable <= 0 || Math.floor(game.time * 12) % 2 === 0) {
    ctx.fillStyle = "#151124"; ctx.fillRect(px + 2, py + 19, 8, 13); ctx.fillRect(px + 13, py + 19, 8, 13);
    ctx.fillStyle = "#d84e9a"; ctx.fillRect(px + 2, py + 10, 19, 13);
    ctx.fillStyle = "#f9bb86"; ctx.fillRect(px + 7, py + 2, 12, 11);
    ctx.fillStyle = "#1c1128"; ctx.fillRect(px + 4, py, 16, 6); ctx.fillRect(px + 1, py + 5, 5, 8);
    ctx.fillStyle = "#7af0ea"; ctx.fillRect(px + 13, py + 7, 5, 3);
    ctx.fillStyle = "#151124"; ctx.fillRect(px + 1, py + 29, 10, 4); ctx.fillRect(px + 13, py + 29, 10, 4);
  }
  ctx.fillStyle = "#0b0d23"; ctx.fillRect(0, 0, PIXEL_WIDTH, 39);
  ctx.fillStyle = "#ffdf9c"; ctx.font = "bold 15px monospace"; ctx.textAlign = "left";
  ctx.fillText("PIXEL SPRINT", 12, 25);
  ctx.fillStyle = "#f7e7d8"; ctx.fillText("SCORE " + String(game.score).padStart(5, "0"), 175, 25);
  ctx.fillStyle = "#f472b9"; ctx.fillText("VIDAS " + game.lives, 365, 25);
  ctx.fillStyle = "#83e9e6"; ctx.fillText(Math.max(0, Math.ceil(PIXEL_LIMIT - game.time)) + "s", 540, 25);
  ctx.fillStyle = "#281639"; ctx.fillRect(10, 383, 620, 6);
  ctx.fillStyle = "#ed6db7"; ctx.fillRect(10, 383, 620 * p.x / PIXEL_WORLD, 6);
}
