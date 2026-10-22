export const JUNGLE_WIDTH = 640;
export const JUNGLE_HEIGHT = 400;
export const JUNGLE_DURATION = 64;
export const JUNGLE_BEAT = .5;
export const JUNGLE_LANES = ["A", "S", "D", "F"];

export function createJunglePulseChart() {
  const notes = [];
  for (let beat = 4; beat < 122; beat++) {
    const time = beat * JUNGLE_BEAT;
    notes.push({ lane: (beat * 3 + Math.floor(beat / 8)) % 4, time, judged: null });
    if (beat >= 40 && beat % 4 === 2) notes.push({ lane: (beat + 2) % 4, time: time + .25, judged: null });
    if (beat >= 80 && beat % 8 === 0) notes.push({ lane: (beat + 1) % 4, time, judged: null });
  }
  return notes.sort((a, b) => a.time - b.time);
}

export function createJunglePulseGame() {
  return { phase: "playing", result: null, time: 0, score: 0, combo: 0, maxCombo: 0,
    perfect: 0, good: 0, misses: 0, extraMisses: 0, judged: 0, lastJudge: "", judgeUntil: 0,
    notes: createJunglePulseChart(), rank: "D", accuracy: 0 };
}

function judge(game, note, rating) {
  if (note) note.judged = rating;
  else game.extraMisses += 1;
  game.judged += 1;
  game.lastJudge = rating.toUpperCase();
  game.judgeUntil = game.time + .5;
  if (rating === "miss") { game.misses++; game.combo = 0; return "miss"; }
  game.combo++;
  game.maxCombo = Math.max(game.maxCombo, game.combo);
  game[rating]++;
  game.score += (rating === "perfect" ? 100 : 60) * Math.min(4, 1 + Math.floor(game.combo / 10));
  return rating;
}

export function stepJunglePulse(game, audioTime, presses = []) {
  if (game.phase !== "playing") return [];
  game.time = Math.max(game.time, Math.min(JUNGLE_DURATION, audioTime));
  const events = [];
  for (const press of presses) {
    const lane = Number(press.lane), time = Number.isFinite(press.time) ? press.time : game.time;
    let closest = null, distance = .185;
    for (const note of game.notes) {
      if (note.judged || note.lane !== lane) continue;
      const gap = Math.abs(note.time - time);
      if (gap < distance) { closest = note; distance = gap; }
    }
    events.push(judge(game, closest, closest ? distance <= .075 ? "perfect" : "good" : "miss"));
  }
  for (const note of game.notes) {
    if (!note.judged && game.time > note.time + .185) events.push(judge(game, note, "miss"));
  }
  if (game.time >= JUNGLE_DURATION) {
    for (const note of game.notes) if (!note.judged) judge(game, note, "miss");
    const total = game.notes.length + game.extraMisses;
    game.accuracy = total ? Math.round((game.perfect + game.good * .65) / total * 100) : 0;
    game.rank = game.accuracy >= 96 ? "S" : game.accuracy >= 85 ? "A" : game.accuracy >= 70 ? "B" : game.accuracy >= 50 ? "C" : "D";
    game.phase = "ended"; game.result = game.rank === "S" || game.rank === "A" ? "win" : "loss";
    events.push("end");
  }
  return events;
}
