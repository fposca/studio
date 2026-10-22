export const PIXEL_WIDTH = 640;
export const PIXEL_HEIGHT = 400;
export const PIXEL_WORLD = 11500;
export const PIXEL_GROUND = 328;
export const PIXEL_LIMIT = 100;

const GAPS = Array.from({ length: 9 }, (_, i) => ({ x: 910 + i * 1090, w: 88 }));
const PLATFORMS = [
  ...GAPS.map(({ x, w }) => ({ x: x - 30, y: 270, w: w + 60 })),
  ...Array.from({ length: 12 }, (_, i) => ({ x: 360 + i * 820, y: 250 - (i % 2) * 32, w: 130 })),
];
const BLOCKS = Array.from({ length: 13 }, (_, i) => ({ x: 520 + i * 830, y: 291, w: 28, h: 37 }));
const COINS = Array.from({ length: 60 }, (_, i) => ({ x: 185 + i * 188, y: (i % 5 === 0 ? 219 : i % 3 === 0 ? 267 : 296) }));
const ENEMIES = Array.from({ length: 13 }, (_, i) => ({ x: 650 + i * 850, y: 303, alive: true }));

const overlaps = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

export function createPixelSprintGame() {
  return { phase: "playing", result: null, time: 0, score: 0, lives: 3,
    player: { x: 48, y: PIXEL_GROUND - 32, vx: 0, vy: 0, grounded: true, invulnerable: 0 },
    checkpoint: 48, coins: COINS.map((coin) => ({ ...coin, taken: false })),
    enemies: ENEMIES.map((enemy) => ({ ...enemy })), cameraX: 0 };
}

export function stepPixelSprint(game, seconds, input = {}) {
  if (game.phase !== "playing") return [];
  const dt = Math.max(0, Math.min(.05, seconds));
  const events = [];
  game.time += dt;
  const p = game.player;
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.vx = (Number(Boolean(input.right)) - Number(Boolean(input.left))) * 190;
  if (input.jump && p.grounded) { p.vy = -430; p.grounded = false; events.push("jump"); }
  const oldX = p.x, oldBottom = p.y + 32;
  p.x = Math.max(0, Math.min(PIXEL_WORLD - 24, p.x + p.vx * dt));
  p.vy = Math.min(700, p.vy + 950 * dt);
  p.y += p.vy * dt;
  p.grounded = false;
  const footX = p.x + 11;
  const gap = GAPS.some(({ x, w }) => footX > x && footX < x + w);
  if (!gap && p.vy >= 0 && oldBottom <= PIXEL_GROUND + 5 && p.y + 32 >= PIXEL_GROUND) {
    p.y = PIXEL_GROUND - 32; p.vy = 0; p.grounded = true;
  }
  for (const surface of [...PLATFORMS, ...BLOCKS]) {
    if (p.vy < 0 || oldBottom > surface.y + 5 || p.y + 32 < surface.y) continue;
    if (p.x + 22 > surface.x + 3 && p.x < surface.x + surface.w - 3) {
      p.y = surface.y - 32; p.vy = 0; p.grounded = true;
    }
  }
  function hurt() {
    if (p.invulnerable > 0) return;
    game.lives -= 1; p.invulnerable = 1.5; events.push("hurt");
    if (game.lives <= 0) { game.phase = "ended"; game.result = "loss"; events.push("end"); return; }
    p.x = game.checkpoint; p.y = PIXEL_GROUND - 32; p.vy = 0; p.grounded = true;
  }
  if (p.y > PIXEL_HEIGHT + 80) hurt();
  for (const block of BLOCKS) {
    if (Math.abs(p.x - block.x) > 40) continue;
    if (overlaps(p.x, p.y, 22, 32, block.x, block.y, block.w, block.h) && oldBottom > block.y + 5) hurt();
  }
  for (const enemy of game.enemies) {
    if (!enemy.alive || Math.abs(p.x - enemy.x) > 55) continue;
    const ex = enemy.x + Math.sin(game.time * 2 + enemy.x) * 16;
    if (!overlaps(p.x, p.y, 22, 32, ex - 12, enemy.y, 24, 24)) continue;
    if (p.vy > 60 && oldBottom < enemy.y + 13) {
      enemy.alive = false; p.vy = -265; game.score += 150; events.push("hit");
    } else hurt();
  }
  for (const coin of game.coins) {
    if (!coin.taken && Math.abs(p.x - coin.x) < 26 && overlaps(p.x, p.y, 22, 32, coin.x - 8, coin.y - 8, 16, 16)) {
      coin.taken = true; game.score += 50; events.push("coin");
    }
  }
  if (p.x > game.checkpoint + 1260) game.checkpoint = Math.floor(p.x / 1250) * 1250 + 48;
  if (p.x >= PIXEL_WORLD - 90) {
    game.phase = "ended"; game.result = "win";
    game.score += Math.max(0, Math.floor((PIXEL_LIMIT - game.time) * 15)) + game.lives * 300;
    events.push("win");
  } else if (game.time >= PIXEL_LIMIT) {
    game.phase = "ended"; game.result = "loss"; events.push("end");
  }
  game.cameraX = Math.max(0, Math.min(PIXEL_WORLD - PIXEL_WIDTH, p.x - 160));
  return events;
}

export const PIXEL_LEVEL = { gaps: GAPS, platforms: PLATFORMS, blocks: BLOCKS };
