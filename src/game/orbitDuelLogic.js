export const ORBIT_WIDTH = 384;
export const ORBIT_HEIGHT = 560;
export const ORBIT_DURATION = 75;

const TYPES = [
  { kind: "scout", hp: 1, speed: 112, score: 100, radius: 13 },
  { kind: "dart", hp: 1, speed: 174, score: 150, radius: 11 },
  { kind: "guard", hp: 3, speed: 86, score: 240, radius: 18 },
];

export function createOrbitGame(random = Math.random) {
  return { time: 0, score: 0, lives: 3, phase: "playing", playerX: ORBIT_WIDTH / 2,
    invulnerable: 0, fireCooldown: 0, spawnCooldown: 0.55, enemies: [], shots: [], enemyShots: [],
    nextId: 1, random };
}

function hit(ax, ay, ar, bx, by, br) {
  const dx = ax - bx, dy = ay - by, radius = ar + br;
  return dx * dx + dy * dy < radius * radius;
}

function damage(game, events) {
  if (game.invulnerable > 0) return;
  game.lives -= 1;
  game.invulnerable = 1.45;
  events.push("hurt");
  if (game.lives <= 0) { game.phase = "ended"; events.push("end"); }
}

export function stepOrbitGame(game, seconds, input = {}) {
  const events = [];
  if (game.phase !== "playing") return events;
  const dt = Math.max(0, Math.min(seconds, 0.05));
  game.time += dt;
  game.invulnerable = Math.max(0, game.invulnerable - dt);
  game.fireCooldown = Math.max(0, game.fireCooldown - dt);
  game.spawnCooldown -= dt;
  const direction = Number(Boolean(input.right)) - Number(Boolean(input.left));
  game.playerX = Math.max(19, Math.min(ORBIT_WIDTH - 19, game.playerX + direction * 285 * dt));
  if (input.fire && game.fireCooldown <= 0) {
    game.shots.push({ x: game.playerX, y: 496, r: 4 });
    game.fireCooldown = 0.17;
    events.push("fire");
  }
  if (game.spawnCooldown <= 0) {
    const p = game.random();
    const type = p < Math.max(.06, .35 - game.time / 280) ? 0 : p < .8 ? 1 : 2;
    const spec = TYPES[type];
    game.enemies.push({ id: game.nextId++, x: 26 + game.random() * (ORBIT_WIDTH - 52), y: -24,
      hp: spec.hp, kind: spec.kind, speed: spec.speed * (1 + game.time / 160), score: spec.score,
      radius: spec.radius, wave: game.random() * Math.PI * 2, shotAt: game.time + 1 + game.random() * 1.8 });
    game.spawnCooldown = Math.max(.39, 1.03 - game.time * .007) + game.random() * .23;
  }
  for (const shot of game.shots) shot.y -= 435 * dt;
  for (const shot of game.enemyShots) shot.y += 205 * dt;
  for (const enemy of game.enemies) {
    enemy.y += enemy.speed * dt;
    enemy.x = Math.max(enemy.radius, Math.min(ORBIT_WIDTH - enemy.radius,
      enemy.x + Math.sin(game.time * 3.2 + enemy.wave) * (enemy.kind === "dart" ? 23 : 11) * dt));
    if (game.time >= enemy.shotAt && enemy.y < 450) {
      game.enemyShots.push({ x: enemy.x, y: enemy.y + enemy.radius, r: 4 });
      enemy.shotAt = game.time + 1.8 + game.random() * 1.5;
    }
    for (const shot of game.shots) {
      if (shot.dead || enemy.dead || !hit(shot.x, shot.y, shot.r, enemy.x, enemy.y, enemy.radius)) continue;
      shot.dead = true;
      enemy.hp -= 1;
      if (enemy.hp <= 0) { enemy.dead = true; game.score += enemy.score; events.push("destroy"); }
    }
    if (!enemy.dead && hit(enemy.x, enemy.y, enemy.radius, game.playerX, 506, 13)) {
      enemy.dead = true;
      damage(game, events);
    }
    if (enemy.y > ORBIT_HEIGHT + 25) enemy.dead = true;
  }
  for (const shot of game.enemyShots) {
    if (hit(shot.x, shot.y, shot.r, game.playerX, 506, 13)) { shot.dead = true; damage(game, events); }
  }
  game.shots = game.shots.filter((shot) => !shot.dead && shot.y > -12);
  game.enemyShots = game.enemyShots.filter((shot) => !shot.dead && shot.y < ORBIT_HEIGHT + 12);
  game.enemies = game.enemies.filter((enemy) => !enemy.dead);
  if (game.time >= ORBIT_DURATION && game.phase === "playing") { game.phase = "ended"; events.push("end"); }
  return events;
}
