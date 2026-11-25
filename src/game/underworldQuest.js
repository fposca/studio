export const UNDERWORLD_MAX_HEALTH = Object.freeze({ sentinel: 5, gargola: 4, testigo: 8 });

export const UNDERWORLD_INITIAL = Object.freeze({
  arrivalRead: false, visionActive: false, bridgeCrossed: false,
  enemies: [UNDERWORLD_MAX_HEALTH.sentinel, UNDERWORLD_MAX_HEALTH.sentinel],
  gargolaHealth: UNDERWORLD_MAX_HEALTH.gargola, testigoHealth: UNDERWORLD_MAX_HEALTH.testigo,
  combatVersion: 1, completed: false,
  flames: [], bridgeTrialComplete: false, ferrymanTrialStarted: false,
  memorySymbols: [], memoryClueRead: false, ferryStarted: false, ferryCompleted: false, ringSequence: [], ringMistakeCount: 0, mechanismSolved: false,
  ambushHealth: [3, 3], shieldActive: false, shieldBroken: false, witnessRunes: [],
  introSeen: false, almaMet: false, barqueroMet: false,
  barqueroHintHeard: false, barqueroAfterSentinelsHeard: false,
  testigoIntroSeen: false, testigoHalfLineSeen: false, testigoDefeatLineSeen: false,
});

const health = (value, maximum) => Number.isInteger(value) ? Math.max(0, Math.min(maximum, value)) : maximum;

export function normalizeUnderworldProgress(value, chapter10Complete = false) {
  if (!chapter10Complete) return { ...UNDERWORLD_INITIAL, enemies: [...UNDERWORLD_INITIAL.enemies] };
  const p = value && typeof value === "object" ? value : {};
  const bridgeCrossed = p.bridgeCrossed === true;
  // Previously completed saves remain complete after the new encounters are added.
  const legacyComplete = p.completed === true;
  // Upgrade partial saves proportionally. Defeated enemies stay defeated.
  const upgraded = (value, oldMax, newMax) => p.combatVersion === 1
    ? health(value, newMax) : Math.ceil(health(value, oldMax) / oldMax * newMax);
  const enemies = legacyComplete ? [0, 0] : bridgeCrossed ? [0, 1].map((index) => upgraded(p.enemies?.[index], 3, UNDERWORLD_MAX_HEALTH.sentinel))
    : [UNDERWORLD_MAX_HEALTH.sentinel, UNDERWORLD_MAX_HEALTH.sentinel];
  const gargolaHealth = bridgeCrossed || legacyComplete ? (legacyComplete ? 0 : upgraded(p.gargolaHealth, 2, UNDERWORLD_MAX_HEALTH.gargola)) : UNDERWORLD_MAX_HEALTH.gargola;
  const testigoHealth = bridgeCrossed || legacyComplete ? (legacyComplete ? 0 : upgraded(p.testigoHealth, 5, UNDERWORLD_MAX_HEALTH.testigo)) : UNDERWORLD_MAX_HEALTH.testigo;
  const flames = Array.isArray(p.flames) ? [...new Set(p.flames.filter((n) => Number.isInteger(n) && n >= 0 && n < 6))] : [];
  const memorySymbols = Array.isArray(p.memorySymbols) ? [...new Set(p.memorySymbols.filter((id) => ["memory", "oblivion", "rebirth"].includes(id)))] : [];
  const ringSequence = Array.isArray(p.ringSequence) ? p.ringSequence.filter((id) => ["memory", "oblivion", "rebirth"].includes(id)).slice(0, 2) : [];
  const witnessRunes = Array.isArray(p.witnessRunes) ? [...new Set(p.witnessRunes.filter((n) => Number.isInteger(n) && n >= 0 && n < 3))] : [];
  return {
    flames: legacyComplete ? [0, 1, 2, 3, 4, 5] : flames,
    bridgeTrialComplete: legacyComplete || p.bridgeTrialComplete === true,
    ferrymanTrialStarted: legacyComplete || p.ferrymanTrialStarted === true,
    memorySymbols: legacyComplete ? ["memory", "oblivion", "rebirth"] : memorySymbols,
    memoryClueRead: legacyComplete || p.memoryClueRead === true,
    ferryStarted: !legacyComplete && p.ferryStarted === true,
    ferryCompleted: legacyComplete || p.ferryCompleted === true,
    ringSequence: legacyComplete ? [] : ringSequence,
    ringMistakeCount: Number.isInteger(p.ringMistakeCount) ? Math.max(0, Math.min(999, p.ringMistakeCount)) : 0,
    mechanismSolved: legacyComplete || p.mechanismSolved === true,
    ambushHealth: legacyComplete ? [0, 0] : [0, 1].map((i) => health(p.ambushHealth?.[i], 3)),
    shieldActive: !legacyComplete && p.shieldActive === true,
    shieldBroken: legacyComplete || p.shieldBroken === true,
    witnessRunes: legacyComplete ? [0, 1, 2] : witnessRunes,
    arrivalRead: p.arrivalRead === true,
    visionActive: p.visionActive === true,
    bridgeCrossed: bridgeCrossed || legacyComplete,
    combatVersion: 1, enemies,
    gargolaHealth,
    testigoHealth,
    introSeen: typeof p.introSeen === "boolean" ? p.introSeen : p.arrivalRead === true || bridgeCrossed,
    almaMet: p.almaMet === true,
    barqueroMet: p.barqueroMet === true,
    barqueroHintHeard: p.barqueroHintHeard === true,
    barqueroAfterSentinelsHeard: p.barqueroAfterSentinelsHeard === true,
    testigoIntroSeen: legacyComplete || p.testigoIntroSeen === true,
    testigoHalfLineSeen: legacyComplete || p.testigoHalfLineSeen === true,
    testigoDefeatLineSeen: legacyComplete || p.testigoDefeatLineSeen === true,
    completed: legacyComplete && enemies.every((remaining) => remaining === 0) && gargolaHealth === 0 && testigoHealth === 0,
  };
}

export function advanceUnderworld(progress, event, value, chapter10Complete = false) {
  const p = normalizeUnderworldProgress(progress, chapter10Complete);
  if (!chapter10Complete) return p;
  if (event === "arrival") return { ...p, arrivalRead: true };
  if (event === "intro-seen") return { ...p, introSeen: true };
  if (event === "alma-met") return { ...p, almaMet: true };
  if (event === "barquero-met") return { ...p, barqueroMet: true };
  if (event === "barquero-hint-heard") return { ...p, barqueroHintHeard: true };
  if (event === "barquero-after-heard") return { ...p, barqueroAfterSentinelsHeard: true };
  if (event === "testigo-intro-seen" && p.mechanismSolved && p.ambushHealth.every((remaining) => remaining === 0) && p.enemies.every((remaining) => remaining === 0) && p.gargolaHealth === 0)
    return { ...p, testigoIntroSeen: true };
  if (event === "testigo-defeat-line-seen" && p.testigoHealth === 0)
    return { ...p, testigoDefeatLineSeen: true };
  if (event === "vision-toggle") return { ...p, visionActive: !p.visionActive };
  if (event === "flame-activate" && Number.isInteger(value) && value >= 0 && value < 6 && !p.flames.includes(value))
    return { ...p, arrivalRead: true, flames: [...p.flames, value] };
  if (event === "bridge-trial-complete" && p.flames.length === 6 && p.visionActive)
    return { ...p, bridgeTrialComplete: true, bridgeCrossed: true };
  if (event === "ferryman-start" && p.bridgeTrialComplete) return { ...p, ferrymanTrialStarted: true };
  if (event === "memory-clue" && p.ferrymanTrialStarted) return { ...p, memoryClueRead: true };
  if (event === "symbol-memory" && p.ferrymanTrialStarted && p.memoryClueRead && !p.memorySymbols.includes("memory"))
    return { ...p, memorySymbols: [...p.memorySymbols, "memory"] };
  if (event === "symbol-oblivion" && p.ferrymanTrialStarted && p.visionActive && !p.memorySymbols.includes("oblivion"))
    return { ...p, memorySymbols: [...p.memorySymbols, "oblivion"] };
  if (event === "symbol-rebirth" && p.ferrymanTrialStarted && !p.memorySymbols.includes("rebirth"))
    return { ...p, memorySymbols: [...p.memorySymbols, "rebirth"] };
  if (event === "ferry-start" && p.memorySymbols.length === 3 && !p.ferryCompleted) return { ...p, ferryStarted: true };
  if (event === "ferry-complete" && p.memorySymbols.length === 3 && p.ferryStarted) return { ...p, ferryStarted: false, ferryCompleted: true };
  if (event === "ring-activate" && p.ferryCompleted && !p.mechanismSolved) {
    const order = ["memory", "oblivion", "rebirth"];
    const next = p.ringSequence.length;
    if (value !== order[next]) return { ...p, ringSequence: [], ringMistakeCount: Math.min(999, p.ringMistakeCount + 1) };
    return next === 2 ? { ...p, ringSequence: [], mechanismSolved: true }
      : { ...p, ringSequence: [...p.ringSequence, value] };
  }
  if (event === "ambush-hit" && p.mechanismSolved && (value === 0 || value === 1) && p.ambushHealth[value] > 0) {
    const ambushHealth = [...p.ambushHealth]; ambushHealth[value] -= 1;
    return { ...p, ambushHealth };
  }
  if (event === "witness-rune-hit" && p.shieldActive && p.visionActive && Number.isInteger(value) && value >= 0 && value < 3 && !p.witnessRunes.includes(value)) {
    const witnessRunes = [...p.witnessRunes, value];
    return { ...p, witnessRunes, shieldActive: witnessRunes.length < 3, shieldBroken: witnessRunes.length === 3 };
  }
  if (event === "bridge-crossed" && p.bridgeTrialComplete) return { ...p, bridgeCrossed: true };
  if (event === "enemy-hit" && p.mechanismSolved && (value === 0 || value === 1) && p.enemies[value] > 0) {
    const enemies = [...p.enemies]; enemies[value] -= 1;
    return { ...p, enemies };
  }
  if (event === "gargola-hit" && p.mechanismSolved && p.gargolaHealth > 0)
    return { ...p, gargolaHealth: p.gargolaHealth - 1 };
  if (event === "testigo-hit" && p.mechanismSolved && p.ambushHealth.every((remaining) => remaining === 0) && p.testigoIntroSeen && p.enemies.every((remaining) => remaining === 0) && p.gargolaHealth === 0 && p.testigoHealth > 0 && !p.shieldActive) {
    const testigoHealth = p.testigoHealth - 1;
    const shieldActive = !p.shieldBroken && testigoHealth <= 3 && testigoHealth > 0;
    return { ...p, testigoHealth, shieldActive, testigoHalfLineSeen: p.testigoHalfLineSeen || testigoHealth <= UNDERWORLD_MAX_HEALTH.testigo / 2 };
  }
  if (event === "altar" && p.flames.length === 6 && p.bridgeTrialComplete && p.memorySymbols.length === 3 && p.ferryCompleted && p.mechanismSolved && p.ambushHealth.every((remaining) => remaining === 0) && p.enemies.every((remaining) => remaining === 0) && p.gargolaHealth === 0 && p.testigoHealth === 0 && p.testigoDefeatLineSeen)
    return { ...p, completed: true };
  return p;
}

export function underworldObjective(p) {
  if (p.completed) return "Atraves\u00e1 la puerta roja para entrar en la Catedral de los Condenados.";
  if (!p.arrivalRead) return "Examin\u00e1 la inscripci\u00f3n de llegada o encend\u00e9 una llama del puente.";
  if (p.flames.length < 6) return "Activ\u00e1 las seis llamas del puente (" + p.flames.length + "/6).";
  if (!p.bridgeTrialComplete) return "Us\u00e1 la Visi\u00f3n de Frecuencia y cruz\u00e1 el puente de los condenados.";
  if (!p.ferrymanTrialStarted) return "Busc\u00e1 al Barquero y escuch\u00e1 su prueba.";
  if (p.memorySymbols.length < 3) {
    if (!p.memoryClueRead) return "Memoria: examin\u00e1 el libro plateado al inicio del puente.";
    if (!p.memorySymbols.includes("memory")) return "Volv\u00e9 a interactuar con el libro para recoger la Memoria.";
    if (!p.memorySymbols.includes("oblivion")) return p.visionActive
      ? "Olvido: busc\u00e1 el s\u00edmbolo violeta antes de la barca."
      : "Activ\u00e1 la Visi\u00f3n de Frecuencia (C) para revelar el Olvido.";
    return "Renacimiento: dispar\u00e1 el Orbe Ne\u00f3n (F) al s\u00edmbolo naranja.";
  }
  if (!p.ferryCompleted) return "Abord\u00e1 la barca del Barquero y cruz\u00e1 el r\u00edo de lava.";
  if (!p.mechanismSolved) return "Resolv\u00e9 el mecanismo de las Tres Almas.";
  if (p.ambushHealth.some((remaining) => remaining > 0)) return "Super\u00e1 la emboscada de las dos g\u00e1rgolas.";
  if (p.enemies.some((remaining) => remaining > 0)) return "Derrot\u00e1 a los dos centinelas con el Orbe Ne\u00f3n.";
  if (p.gargolaHealth > 0) return "Enfrent\u00e1 a la G\u00e1rgola infernal en la arena.";
  if (p.shieldActive) return "Revel\u00e1 y destru\u00ed las tres runas del escudo (" + p.witnessRunes.length + "/3).";
  if (p.testigoHealth > 0) return p.testigoIntroSeen ? "Venc\u00e9 al Testigo de las Cenizas para liberar el altar." : "Acercate al Testigo de las Cenizas.";
  if (!p.testigoDefeatLineSeen) return "Escuch\u00e1 las \u00faltimas palabras del Testigo.";
  return "Activ\u00e1 el altar del umbral al fondo de la ciudadela.";
}
