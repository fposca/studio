import { JUNGLE_DURATION, JUNGLE_LANES } from "./junglePulseLogic.js";

const COLORS = ["#ee75bd", "#6adce1", "#ffcb76", "#b18aff"];
export function paintJunglePulse(ctx, game) {
  const width = 640, height = 400;
  ctx.imageSmoothingEnabled = false;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0d1b2c"); gradient.addColorStop(.55, "#173744"); gradient.addColorStop(1, "#291739");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 13; i++) {
    const x = i * 60 + Math.sin(i * 3) * 12;
    ctx.strokeStyle = i % 2 ? "#225b58" : "#374c61"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x, 310); ctx.lineTo(x - 15, 165); ctx.stroke();
    ctx.strokeStyle = "#346a60"; ctx.lineWidth = 3;
    for (let branch = 0; branch < 3; branch++) {
      const y = 180 + branch * 33;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (branch % 2 ? 35 : -35), y - 30); ctx.stroke();
    }
  }
  ctx.fillStyle = "#07111edc"; ctx.fillRect(0, 0, 640, 44);
  ctx.fillStyle = "#fff1d6"; ctx.font = "bold 17px monospace"; ctx.textAlign = "left";
  ctx.fillText("JUNGLE PULSE", 14, 28);
  ctx.fillStyle = "#97eadc"; ctx.fillText("SCORE " + game.score, 255, 28);
  ctx.fillStyle = "#f5b9de"; ctx.fillText("x" + Math.min(4, 1 + Math.floor(game.combo / 10)) + "  COMBO " + game.combo, 490, 28);
  const start = 112, laneW = 103, targetY = 314;
  for (let lane = 0; lane < 4; lane++) {
    const x = start + lane * laneW;
    ctx.fillStyle = lane % 2 ? "#061a27df" : "#15122ddd"; ctx.fillRect(x, 48, laneW - 5, 310);
    ctx.fillStyle = COLORS[lane] + "44"; ctx.fillRect(x, 48, 3, 310);
    ctx.fillStyle = COLORS[lane]; ctx.font = "bold 23px monospace"; ctx.textAlign = "center";
    ctx.fillText(JUNGLE_LANES[lane], x + 49, 347);
    ctx.strokeStyle = COLORS[lane]; ctx.lineWidth = 3; ctx.strokeRect(x + 7, targetY - 11, laneW - 20, 22);
  }
  ctx.fillStyle = "#f8d6eb"; ctx.fillRect(start, targetY, laneW * 4 - 5, 2);
  for (const note of game.notes) {
    if (note.judged) continue;
    const y = targetY - (note.time - game.time) * 155;
    if (y < 50 || y > 330) continue;
    const x = start + note.lane * laneW + 17;
    ctx.shadowColor = COLORS[note.lane]; ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS[note.lane]; ctx.fillRect(x, y - 9, laneW - 39, 18);
    ctx.fillStyle = "#fff5ea"; ctx.fillRect(x + 7, y - 5, laneW - 53, 4);
    ctx.shadowBlur = 0;
  }
  if (game.lastJudge && game.judgeUntil > game.time) {
    ctx.fillStyle = game.lastJudge === "PERFECT" ? "#ffdc8f" : game.lastJudge === "GOOD" ? "#a3f3ed" : "#ff788a";
    ctx.font = "bold 24px monospace"; ctx.textAlign = "center";
    ctx.fillText(game.lastJudge, 320, 90);
  }
  ctx.fillStyle = "#0a0d1f"; ctx.fillRect(112, 372, 412, 7);
  ctx.fillStyle = "#f178bd"; ctx.fillRect(112, 372, 412 * Math.min(1, game.time / JUNGLE_DURATION), 7);
  ctx.fillStyle = "#e8e4dc"; ctx.font = "bold 11px monospace"; ctx.textAlign = "left";
  ctx.fillText("PERFECT " + game.perfect + "  GOOD " + game.good + "  MISS " + game.misses, 12, 391);
  ctx.textAlign = "right"; ctx.fillText(Math.ceil(JUNGLE_DURATION - game.time) + "s", 627, 391);
}
