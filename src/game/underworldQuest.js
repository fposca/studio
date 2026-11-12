export const UNDERWORLD_MAX_HEALTH = Object.freeze({ sentinel: 5, gargola: 4, testigo: 8 });

export const UNDERWORLD_INITIAL = Object.freeze({
  arrivalRead: false, visionActive: false, bridgeCrossed: false,
  enemies: [UNDERWORLD_MAX_HEALTH.sentinel, UNDERWORLD_MAX_HEALTH.sentinel],
  gargolaHealth: UNDERWORLD_MAX_HEALTH.gargola, testigoHealth: UNDERWORLD_MAX_HEALTH.testigo,
  combatVersion: 1, completed: false,
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
  const legacyComplete = bridgeCrossed && p.completed === true;
  // Upgrade partial saves proportionally. Defeated enemies stay defeated.
  const upgraded = (value, oldMax, newMax) => p.combatVersion === 1
    ? health(value, newMax) : Math.ceil(health(value, oldMax) / oldMax * newMax);
  const enemies = bridgeCrossed ? [0, 1].map((index) => upgraded(p.enemies?.[index], 3, UNDERWORLD_MAX_HEALTH.sentinel))
    : [UNDERWORLD_MAX_HEALTH.sentinel, UNDERWORLD_MAX_HEALTH.sentinel];
  const gargolaHealth = bridgeCrossed ? (legacyComplete ? 0 : upgraded(p.gargolaHealth, 2, UNDERWORLD_MAX_HEALTH.gargola)) : UNDERWORLD_MAX_HEALTH.gargola;
  const testigoHealth = bridgeCrossed ? (legacyComplete ? 0 : upgraded(p.testigoHealth, 5, UNDERWORLD_MAX_HEALTH.testigo)) : UNDERWORLD_MAX_HEALTH.testigo;
  return {
    arrivalRead: p.arrivalRead === true,
    visionActive: p.visionActive === true,
    bridgeCrossed,
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
  if (event === "testigo-intro-seen" && p.enemies.every((remaining) => remaining === 0) && p.gargolaHealth === 0)
    return { ...p, testigoIntroSeen: true };
  if (event === "testigo-defeat-line-seen" && p.testigoHealth === 0)
    return { ...p, testigoDefeatLineSeen: true };
  if (event === "vision-toggle") return { ...p, visionActive: !p.visionActive };
  if (event === "bridge-crossed" && p.visionActive) return { ...p, bridgeCrossed: true };
  if (event === "enemy-hit" && p.bridgeCrossed && (value === 0 || value === 1) && p.enemies[value] > 0) {
    const enemies = [...p.enemies]; enemies[value] -= 1;
    return { ...p, enemies };
  }
  if (event === "gargola-hit" && p.bridgeCrossed && p.gargolaHealth > 0)
    return { ...p, gargolaHealth: p.gargolaHealth - 1 };
  if (event === "testigo-hit" && p.bridgeCrossed && p.testigoIntroSeen && p.enemies.every((remaining) => remaining === 0) && p.gargolaHealth === 0 && p.testigoHealth > 0) {
    const testigoHealth = p.testigoHealth - 1;
    return { ...p, testigoHealth, testigoHalfLineSeen: p.testigoHalfLineSeen || testigoHealth <= UNDERWORLD_MAX_HEALTH.testigo / 2 };
  }
  if (event === "altar" && p.bridgeCrossed && p.enemies.every((remaining) => remaining === 0) && p.gargolaHealth === 0 && p.testigoHealth === 0 && p.testigoDefeatLineSeen)
    return { ...p, completed: true };
  return p;
}

export function underworldObjective(p) {
  if (p.completed) return "Atravesá la puerta roja para entrar en la Catedral de los Condenados.";
  if (!p.arrivalRead) return "Examiná la inscripción en la zona de llegada.";
  if (!p.bridgeCrossed) return "Usá la Visión de Frecuencia para revelar el puente verdadero.";
  if (p.enemies.some((remaining) => remaining > 0)) return "Derrotá a los dos centinelas con el Orbe Neón.";
  if (p.gargolaHealth > 0) return "Enfrentá a la Gárgola infernal en la arena.";
  if (p.testigoHealth > 0) return p.testigoIntroSeen ? "Vencé al Testigo de las Cenizas para liberar el altar." : "Acercate al Testigo de las Cenizas.";
  if (!p.testigoDefeatLineSeen) return "Escuchá las últimas palabras del Testigo.";
  return "Activá el altar del umbral al fondo de la ciudadela.";
}
