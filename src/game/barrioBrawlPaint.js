import { BRAWL_HEIGHT, BRAWL_WIDTH } from "./barrioBrawlLogic.js";

function fighter(ctx, fighter, colors, time) {
  const x = Math.round(fighter.x), y = Math.round(fighter.y);
  ctx.save(); ctx.translate(x, y); ctx.scale(fighter.facing, 1);
  if (fighter.hitFlash > 0 && Math.floor(time * 14) % 2) ctx.globalAlpha = .5;
  const step = fighter.state === "idle" ? Math.sin(time * 7 + x) * 3 : 0;
  ctx.fillStyle = "#100e1e"; ctx.fillRect(-17, -4, 37, 5);
  ctx.fillStyle = colors.pants;
  ctx.fillRect(-12, -30, 10, 27 + step); ctx.fillRect(4, -30, 10, 27 - step);
  ctx.fillStyle = "#151122"; ctx.fillRect(-15, -4 + step, 14, 6); ctx.fillRect(3, -4 - step, 15, 6);
  ctx.fillStyle = colors.coat; ctx.fillRect(-17, -67, 34, 39);
  ctx.fillStyle = colors.trim; ctx.fillRect(-3, -65, 6, 31); ctx.fillRect(-17, -35, 34, 5);
  ctx.fillStyle = colors.skin; ctx.fillRect(-12, -91, 24, 26);
  ctx.fillStyle = colors.hair; ctx.fillRect(-15, -97, 28, 13); ctx.fillRect(-16, -84, 5, 29);
  ctx.fillStyle = "#121225"; ctx.fillRect(5, -80, 4, 3);
  ctx.fillStyle = colors.coat;
  if (fighter.guard) { ctx.fillRect(10, -81, 12, 29); ctx.fillRect(-25, -79, 12, 28); }
  else if (fighter.attack?.kind === "punch") { ctx.fillRect(13, -65, 35, 9); ctx.fillStyle = colors.skin; ctx.fillRect(44, -65, 9, 9); }
  else if (fighter.attack?.kind === "kick") {
    ctx.fillRect(12, -61, 12, 31); ctx.fillStyle = colors.pants; ctx.fillRect(8, -28, 38, 10);
    ctx.fillStyle = "#151122"; ctx.fillRect(42, -29, 13, 12);
  } else { ctx.fillRect(15, -65, 10, 31); ctx.fillRect(-25, -65, 10, 31); }
  ctx.restore();
}

export function paintBarrioBrawl(ctx, game) {
  const w = BRAWL_WIDTH, h = BRAWL_HEIGHT;
  ctx.imageSmoothingEnabled = false;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#15102c"); sky.addColorStop(.7, "#472147"); sky.addColorStop(1, "#a84a57");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 15; i++) {
    const x = i * 47, bh = 70 + (i * 29 % 80);
    ctx.fillStyle = i % 2 ? "#251b37" : "#352139"; ctx.fillRect(x, 257 - bh, 43, bh);
    ctx.fillStyle = "#bf7985";
    for (let y = 262 - bh; y < 247; y += 16) if (i % 3) ctx.fillRect(x + 9, y, 5, 7);
  }
  ctx.fillStyle = "#513a46"; ctx.fillRect(0, 249, 640, 77);
  ctx.fillStyle = "#694b54";
  for (let y = 254; y < 318; y += 16) { ctx.fillRect(0, y, 640, 2); for (let x = (y % 32 ? 0 : 25); x < 640; x += 50) ctx.fillRect(x, y, 2, 16); }
  ctx.fillStyle = "#2a1c34"; ctx.fillRect(201, 262, 238, 65);
  for (let y = 267; y < 326; y += 8) { ctx.fillStyle = "#806476"; ctx.fillRect(207, y, 226, 2); }
  ctx.fillStyle = "#f877bd"; ctx.font = "bold 19px monospace"; ctx.fillText("BARRIO", 268, 235);
  ctx.fillStyle = "#8be5e1"; ctx.fillText("1999", 340, 257);
  ctx.fillStyle = "#101624"; ctx.fillRect(32, 175, 10, 147); ctx.fillRect(599, 175, 10, 147);
  ctx.fillStyle = "#ffd39c"; ctx.fillRect(23, 167, 28, 10); ctx.fillRect(590, 167, 28, 10);
  ctx.fillStyle = "#382a3b"; ctx.fillRect(0, 324, 640, 76);
  ctx.fillStyle = "#ad6771"; ctx.fillRect(0, 324, 640, 5);
  for (let y = 340; y < 400; y += 18) { ctx.fillStyle = "#704e5c"; ctx.fillRect(0, y, 640, 2); }
  fighter(ctx, game.player, { coat: "#27172e", trim: "#f35aaf", pants: "#25344f", skin: "#e9aa85", hair: "#17111f" }, BRAWL_ROUND_TIME(game));
  fighter(ctx, game.foe, { coat: "#40528c", trim: "#8ce0ee", pants: "#364659", skin: "#d58c66", hair: "#31201f" }, BRAWL_ROUND_TIME(game));
  ctx.fillStyle = "#0b0a1a"; ctx.fillRect(0, 0, 640, 71);
  ctx.fillStyle = "#eeb7d9"; ctx.font = "bold 15px monospace"; ctx.textAlign = "left";
  ctx.fillText("NEON ROCK", 14, 19); ctx.textAlign = "right"; ctx.fillText("EL RIVAL", 626, 19);
  ctx.fillStyle = "#37273c"; ctx.fillRect(14, 26, 255, 17); ctx.fillRect(371, 26, 255, 17);
  ctx.fillStyle = "#f062ad"; ctx.fillRect(15, 27, 253 * game.player.hp / 100, 15);
  ctx.fillStyle = "#69d9e9"; ctx.fillRect(372 + 253 * (1 - game.foe.hp / 100), 27, 253 * game.foe.hp / 100, 15);
  ctx.textAlign = "center"; ctx.fillStyle = "#fff1ce"; ctx.font = "bold 23px monospace";
  ctx.fillText(String(Math.ceil(game.time)), 320, 40);
  ctx.font = "bold 13px monospace"; ctx.fillStyle = "#ef9dcf";
  ctx.fillText("ROUND " + game.round + "  |  " + game.wins[0] + " - " + game.wins[1] + "  |  SCORE " + game.score, 320, 63);
  if (game.announcement) {
    ctx.fillStyle = "#0a081ab9"; ctx.fillRect(163, 137, 314, 73);
    ctx.strokeStyle = "#e964bb"; ctx.lineWidth = 3; ctx.strokeRect(163, 137, 314, 73);
    ctx.fillStyle = "#fff1d7"; ctx.font = "bold 35px monospace";
    ctx.fillText(game.announcement, 320, 185);
  }
}

function BRAWL_ROUND_TIME(game) { return game.round * 45 - game.time; }
