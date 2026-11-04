import { countMatrixDiscoveries, REQUIRED_MATRIX_MESSAGES } from "./halloweenMatrixMessagesConfig.js";

export const SECRET_COVERS = Object.freeze({
  "holy-fire": { alternateId: "unholy-fire", message: "EL FUEGO TIENE DOS CARAS" },
  glowshine: { alternateId: null, message: "LA M\u00daSICA ES LA LLAVE" },
  gloom: { alternateId: null, message: "ESCUCH\u00c1 M\u00c1S ALL\u00c1" },
  secrets: { alternateId: null, message: "NO TODO EST\u00c1 EN LA PORTADA" },
});
export const MIRROR_MESSAGES = Object.freeze([
  "NO TODOS LOS QUE VES EST\u00c1N VIVOS",
  "EL REFLEJO CONOCE TU VERDAD",
  "HAY ALGO DETR\u00c1S DE VOS",
  "DESPERT\u00c1, NEONBOY",
  "EL ESPEJO TE EST\u00c1 OBSERVANDO",
]);
export const PHONE_LINES = Object.freeze([
  "\u00bfHola?... \u00bfNeonBoy?... Todav\u00eda no escuchaste el \u00faltimo disco...",
  "Est\u00e1s escuchando algo que no deber\u00edas... Pero ya es demasiado tarde.",
  "Cuatro a\u00f1os... Cuatro a\u00f1os desde que todo comenz\u00f3. Y todav\u00eda no entendiste lo que despertaste.",
  "Los discos guardan recuerdos... Algunos deber\u00edan permanecer enterrados.",
]);
export const HALLOWEEN_NPC_IDS = Object.freeze([
  "tito", "rulo", "roxy", "freddy", "jason", "skeleton-holy", "skeleton-unholy",
]);
export const countNpcDialogues = (discovered) =>
  HALLOWEEN_NPC_IDS.filter((id) => discovered.has(`npc-dialogue:${id}`)).length;

export const nextPhoneInterval = (random = Math.random, firstCall = false) =>
  (firstCall ? 12 : 18) + Math.min(1, Math.max(0, random())) * 12;

export function getAnniversaryProgress({ demonHealth, vhsCollected, discovered, songsPlayed }) {
  const matrixMessages = countMatrixDiscoveries(discovered);
  const covers = Object.keys(SECRET_COVERS).filter((id) => discovered.has(id)).length;
  const mirrors = MIRROR_MESSAGES.filter((_, index) => discovered.has(`mirror:${index}`)).length;
  const calls = PHONE_LINES.filter((_, index) => discovered.has(`phone:${index}`)).length;
  const vhsInserted = vhsCollected && discovered.has("vhs:inserted");
  const npcDialogues = countNpcDialogues(discovered);
  const demonDefeated = demonHealth === 0;
  const songs = Math.min(3, songsPlayed ?? 0);
  return {
    covers, mirrors, calls, vhsInserted, npcDialogues, demonDefeated, songs, matrixMessages,
    completed: covers + mirrors + calls + Number(vhsInserted) + npcDialogues + Number(demonDefeated) + songs + matrixMessages,
    total: Object.keys(SECRET_COVERS).length + MIRROR_MESSAGES.length + PHONE_LINES.length + 5 + REQUIRED_MATRIX_MESSAGES + HALLOWEEN_NPC_IDS.length,
  };
}

export const canUnlockAnniversary = (state) => state.judgeDefeated === true;

export function canSummonJudge({ demonDefeated, callsAnswered, vhsInserted, npcDialogues, visionActive, mirrorInView, judgePhase }) {
  return demonDefeated === true && callsAnswered >= PHONE_LINES.length &&
    vhsInserted === true && npcDialogues === HALLOWEEN_NPC_IDS.length &&
    visionActive === true && mirrorInView === true && judgePhase === "inactive";
}

export function canUnlockSecretVinyl(state) {
  if (!canUnlockAnniversary(state)) return false;
  const progress = getAnniversaryProgress(state);
  return progress.completed === progress.total;
}
