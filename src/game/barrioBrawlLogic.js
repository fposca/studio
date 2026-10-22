export const BRAWL_WIDTH = 640;
export const BRAWL_HEIGHT = 400;
export const BRAWL_ROUND_SECONDS = 45;
const FLOOR = 324;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function fighter(x, facing) {
  return { x, y: FLOOR, vy: 0, facing, hp: 100, guard: false, cooldown: 0,
    attack: null, hitFlash: 0, state: "idle" };
}

export function createBarrioBrawlGame(random = Math.random) {
  return { phase: "playing", result: null, score: 0, round: 1, wins: [0, 0], time: BRAWL_ROUND_SECONDS,
    player: fighter(180, 1), foe: fighter(460, -1), aiTimer: 1.5, aiState: "approach",
    announcement: "READY", announcementTime: 1, roundBreak: 0, random };
}

function strike(game, source, target, kind, events) {
  if (source.cooldown > 0 || source.attack || source.hitFlash > .12) return;
  source.attack = { kind, time: 0, hit: false };
  source.cooldown = kind === "kick" ? .66 : .47;
  source.state = kind;
  events.push("swing");
}

function landHit(game, source, target, events) {
  const attack = source.attack;
  if (!attack || attack.hit || attack.time < .08) return;
  attack.hit = true;
  const reach = attack.kind === "kick" ? 68 : 48;
  const distance = Math.abs(source.x - target.x);
  const front = Math.sign(target.x - source.x) === source.facing;
  const height = Math.abs(source.y - target.y);
  if (!front || distance > reach || height > 35) return;
  const damage = attack.kind === "kick" ? 16 : 10;
  target.hp = Math.max(0, target.hp - (target.guard ? Math.ceil(damage * .2) : damage));
  target.hitFlash = target.guard ? .09 : .22;
  if (source === game.player) game.score += target.guard ? 15 : damage * 10;
  events.push(target.guard ? "block" : "hit");
}

function endRound(game, events) {
  const won = game.player.hp > game.foe.hp || game.foe.hp <= 0;
  game.wins[won ? 0 : 1] += 1;
  if (won) game.score += 250 + Math.floor(game.player.hp * 2) + Math.ceil(game.time) * 3;
  if (game.wins[0] >= 2 || game.wins[1] >= 2) {
    game.phase = "ended"; game.result = game.wins[0] >= 2 ? "win" : "loss";
    game.announcement = game.result === "win" ? "YOU WIN" : "GAME OVER";
    events.push(game.result === "win" ? "win" : "end");
  } else {
    game.announcement = game.player.hp <= 0 || game.foe.hp <= 0 ? "K.O." : won ? "ROUND WON" : "ROUND LOST";
    game.roundBreak = 2.2; events.push("round");
  }
}

export function stepBarrioBrawl(game, seconds, input = {}) {
  if (game.phase !== "playing") return [];
  const dt = clamp(seconds, 0, .05), events = [];
  if (game.roundBreak > 0) {
    game.roundBreak -= dt;
    if (game.roundBreak <= 0) {
      game.round += 1; game.time = BRAWL_ROUND_SECONDS;
      game.player = fighter(180, 1); game.foe = fighter(460, -1);
      game.aiTimer = 1.5; game.announcement = "FIGHT"; game.announcementTime = .8;
    }
    return events;
  }
  if (game.announcementTime > 0) {
    game.announcementTime -= dt;
    if (game.announcementTime <= 0) {
      if (game.announcement === "READY") { game.announcement = "FIGHT"; game.announcementTime = .65; }
      else game.announcement = "";
    }
    return events;
  }
  game.time = Math.max(0, game.time - dt);
  const p = game.player, foe = game.foe;
  for (const f of [p, foe]) {
    f.cooldown = Math.max(0, f.cooldown - dt);
    f.hitFlash = Math.max(0, f.hitFlash - dt);
    if (f.attack) {
      f.attack.time += dt;
      if (f.attack.time >= .27) { f.attack = null; f.state = "idle"; }
    }
    f.vy += 900 * dt; f.y = Math.min(FLOOR, f.y + f.vy * dt);
    if (f.y >= FLOOR) f.vy = 0;
  }
  p.facing = foe.x >= p.x ? 1 : -1;
  foe.facing = p.x >= foe.x ? 1 : -1;
  p.guard = Boolean(input.guard) && p.y === FLOOR && !p.attack;
  if (input.jump && p.y === FLOOR && !p.guard) { p.vy = -380; events.push("jump"); }
  if (!p.guard && !p.attack) {
    p.x = clamp(p.x + (Number(Boolean(input.right)) - Number(Boolean(input.left))) * 185 * dt, 35, BRAWL_WIDTH - 35);
  }
  if (input.punch && !p.guard) strike(game, p, foe, "punch", events);
  else if (input.kick && !p.guard) strike(game, p, foe, "kick", events);
  const distance = Math.abs(p.x - foe.x);
  game.aiTimer -= dt;
  if (game.aiTimer <= 0) {
    const choice = game.random();
    game.aiState = distance > 95 ? "approach" : choice < .18 ? "defend" : choice < .34 ? "retreat" : "attack";
    game.aiTimer = .5 + game.random() * .65;
  }
  foe.guard = game.aiState === "defend" && !foe.attack;
  if (!foe.attack && !foe.guard) {
    if (distance > 63) foe.x = clamp(foe.x + foe.facing * Math.min(145 * dt, distance - 61), 35, BRAWL_WIDTH - 35);
    else if (game.aiState === "retreat") foe.x = clamp(foe.x - foe.facing * 95 * dt, 35, BRAWL_WIDTH - 35);
    else if (game.aiState === "attack" && foe.cooldown <= 0) {
      strike(game, foe, p, game.random() < .45 ? "kick" : "punch", events);
      game.aiTimer = 1 + game.random() * .75;
    }
  }
  if (Math.abs(p.x - foe.x) < 34) {
    const midpoint = (p.x + foe.x) / 2;
    p.x = clamp(midpoint - p.facing * 17, 35, BRAWL_WIDTH - 35);
    foe.x = clamp(midpoint + p.facing * 17, 35, BRAWL_WIDTH - 35);
  }
  landHit(game, p, foe, events);
  landHit(game, foe, p, events);
  if (p.hp <= 0 || foe.hp <= 0 || game.time <= 0) endRound(game, events);
  return events;
}
