export const NICO_ORBIT_SCORE = 1700;
export const PIXEL_ORBIT_SCORE = 1000;

export const INITIAL_ARCADE_PROGRESS = Object.freeze({
  met: [], bestScore: 0, lastScore: null, gamesPlayed: 0,
  beatNico: false, signalSeen: false,
  frequency09EventSeen: false, recordStoreFutureVisionSeen: false, recordStoreRevisitedAfterVision: false,
  records: { pixel: { bestScore: 0, plays: 0, wins: 0 }, brawl: { bestScore: 0, bestRounds: 0, plays: 0, wins: 0 }, jungle: { bestScore: 0, bestAccuracy: 0, bestCombo: 0, plays: 0, wins: 0 } },
});

const safeInt = (value, max = 999999) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;

function normalizeRecord(value, id) {
  return {
    bestScore: safeInt(value?.bestScore), plays: safeInt(value?.plays, 99999), wins: safeInt(value?.wins, 99999),
    ...(id === "brawl" ? { bestRounds: safeInt(value?.bestRounds, 2) } : {}),
    ...(id === "jungle" ? { bestAccuracy: safeInt(value?.bestAccuracy, 100), bestCombo: safeInt(value?.bestCombo, 9999) } : {}),
  };
}

export function normalizeArcadeProgress(value) {
  const met = Array.isArray(value?.met) ? value.met.filter((id) => ["pixel", "nico", "vicky"].includes(id)) : [];
  const bestScore = Number.isFinite(value?.bestScore) ? Math.max(0, Math.min(999999, Math.floor(value.bestScore))) : 0;
  const lastScore = Number.isFinite(value?.lastScore) ? Math.max(0, Math.min(999999, Math.floor(value.lastScore))) : null;
  return {
    met: [...new Set(met)], bestScore, lastScore,
    gamesPlayed: Number.isFinite(value?.gamesPlayed) ? Math.max(0, Math.min(99999, Math.floor(value.gamesPlayed))) : 0,
    beatNico: bestScore > NICO_ORBIT_SCORE,
    signalSeen: value?.signalSeen === true,
    frequency09EventSeen: value?.frequency09EventSeen === true,
    recordStoreFutureVisionSeen: value?.recordStoreFutureVisionSeen === true,
    recordStoreRevisitedAfterVision: value?.recordStoreFutureVisionSeen === true && value?.recordStoreRevisitedAfterVision === true,
    records: Object.fromEntries(Object.keys(INITIAL_ARCADE_PROGRESS.records).map((id) => [id, normalizeRecord(value?.records?.[id], id)])),
  };
}

export function meetArcadeNpc(progress, id) {
  const current = normalizeArcadeProgress(progress);
  return current.met.includes(id) ? current : { ...current, met: [...current.met, id] };
}

export function finishOrbitDuel(progress, score, signalEligible = false) {
  const current = normalizeArcadeProgress(progress);
  const nextScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  const bestScore = Math.max(current.bestScore, nextScore);
  const firstNicoWin = !current.beatNico && bestScore > NICO_ORBIT_SCORE;
  const showSignal = bestScore > NICO_ORBIT_SCORE && signalEligible && !current.signalSeen;
  return {
    progress: { ...current, bestScore, lastScore: nextScore, gamesPlayed: current.gamesPlayed + 1,
      beatNico: bestScore > NICO_ORBIT_SCORE, signalSeen: current.signalSeen || showSignal },
    firstNicoWin, showSignal,
  };
}

export function finishArcadeMiniGame(progress, id, result) {
  if (!INITIAL_ARCADE_PROGRESS.records[id]) return normalizeArcadeProgress(progress);
  const current = normalizeArcadeProgress(progress);
  const previous = current.records[id];
  const score = safeInt(result?.score);
  const next = {
    ...previous, bestScore: Math.max(previous.bestScore, score),
    plays: previous.plays + 1, wins: previous.wins + Number(result?.won === true),
  };
  if (id === "brawl") next.bestRounds = Math.max(previous.bestRounds, safeInt(result?.roundsWon, 2));
  if (id === "jungle") {
    next.bestAccuracy = Math.max(previous.bestAccuracy, safeInt(result?.accuracy, 100));
    next.bestCombo = Math.max(previous.bestCombo, safeInt(result?.maxCombo, 9999));
  }
  return { ...current, records: { ...current.records, [id]: next } };
}

export function orbitHighScores(progress) {
  const best = normalizeArcadeProgress(progress).bestScore;
  return [
    { name: "NICO", score: NICO_ORBIT_SCORE },
    { name: "PIXEL", score: PIXEL_ORBIT_SCORE },
    { name: "NEONBOY", score: best },
  ].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function canActivateFrequency09(clubQuest, progress) {
  return clubQuest?.anomalySeen === true && !normalizeArcadeProgress(progress).frequency09EventSeen;
}

export function completeFrequency09(progress) {
  const current = normalizeArcadeProgress(progress);
  return { ...current, frequency09EventSeen: true, recordStoreFutureVisionSeen: true };
}

export function revisitStoreAfterVision(progress) {
  const current = normalizeArcadeProgress(progress);
  return current.recordStoreFutureVisionSeen ? { ...current, recordStoreRevisitedAfterVision: true } : current;
}
