export const SHIP_ACCESS_ORDER = ["pulse", "coil", "gate"];
export const SHIP_LOCKER_ORDER = ["triangle", "moon", "wave"];
export const SHIP_CIRCUIT_ORDER = ["internal", "life", "bridge"];
export const SHIP_NAVIGATION_ORDER = ["09", "01", "temple"];
export const SHIP_SIGNAL_ORDER = [0, 1, 2];

export const INITIAL_LOST_SHIP_PROGRESS = Object.freeze({
  hugoBriefed: false, signalSegments: [1, 2, 0], signalDecoded: false,
  linkActivated: false, arrivalSeen: false,
  accessLog: false, accessSymbols: [], accessGranted: false,
  reactorExamined: false, moduleTaken: false, moduleInstalled: false,
  circuitPath: [], powerRestored: false,
  lockerClues: [], lockerSymbols: [], lockerOpened: false, bridgeCardUsed: false,
  regulators: [0, 0, 0], lifeStable: false,
  navigationClues: [], navigationValues: [null, null, null],
  navigationRestored: false, memoryTaken: false, memoryInstalled: false, archiveRecovered: false,
  travelerMet: false, endingSeen: false, eventsSeen: [], hints: {},
  orbUnlocked: false, orbAnnouncementSeen: false, orbNodes: [false, false, false],
  orbDoorOpen: false, orbEnemyHealth: 3, orbEnemyDefeated: false, orbReceiverActivated: false,
});
const SYMBOLS = ["pulse", "coil", "gate", "triangle", "moon", "wave"];
const unique = (values, allowed) => [...new Set((Array.isArray(values) ? values : []).filter(value => allowed.includes(value)))];
const sequence = (values, allowed) => (Array.isArray(values) ? values : []).filter(value => allowed.includes(value)).slice(0, 3);
const same = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);
export const lostShipPressures = (regulators) => {
  const [a, b, c] = regulators;
  return [2 + 2 * a - b, 5 + 2 * b - c, 3 + 2 * c - a];
};
export function normalizeLostShipProgress(value, rooftopCompleted = true) {
  const source = rooftopCompleted && value && typeof value === "object" ? value : {};
  const flags = Object.keys(INITIAL_LOST_SHIP_PROGRESS).filter(key => typeof INITIAL_LOST_SHIP_PROGRESS[key] === "boolean");
  const p = { ...INITIAL_LOST_SHIP_PROGRESS };
  for (const key of flags) p[key] = source[key] === true;
  p.signalSegments = [0, 1, 2].map(index => Number.isInteger(source.signalSegments?.[index]) ? ((source.signalSegments[index] % 3) + 3) % 3 : INITIAL_LOST_SHIP_PROGRESS.signalSegments[index]);
  p.accessSymbols = sequence(source.accessSymbols, SHIP_ACCESS_ORDER);
  p.lockerSymbols = sequence(source.lockerSymbols, SHIP_LOCKER_ORDER);
  p.circuitPath = sequence(source.circuitPath, SHIP_CIRCUIT_ORDER);
  p.lockerClues = unique(source.lockerClues, ["log", "sign", "monitor"]);
  p.navigationClues = unique(source.navigationClues, ["reactor", "storage", "bridge"]);
  p.navigationValues = [0, 1, 2].map(index => ["09", "01", "temple", "void"].includes(source.navigationValues?.[index]) ? source.navigationValues[index] : null);
  p.regulators = [0, 1, 2].map(index => Number.isInteger(source.regulators?.[index]) ? Math.max(0, Math.min(3, source.regulators[index])) : 0);
  p.eventsSeen = unique(source.eventsSeen, ["corridor", "window", "reactor", "bridge"]);
  p.hints = Object.fromEntries(Object.entries(source.hints || {}).filter(([key, level]) => ["signal", "access", "circuit", "locker", "life", "navigation"].includes(key) && Number.isInteger(level)).map(([key, level]) => [key, Math.max(0, Math.min(3, level))]));
  p.signalDecoded = p.hugoBriefed && p.signalDecoded && same(p.signalSegments, SHIP_SIGNAL_ORDER);
  p.linkActivated = p.signalDecoded && p.linkActivated;
  p.arrivalSeen = p.linkActivated && p.arrivalSeen;
  p.accessLog = p.linkActivated && p.accessLog;
  p.accessSymbols = p.accessLog ? p.accessSymbols : [];
  p.accessGranted = p.accessLog && p.accessGranted && same(p.accessSymbols, SHIP_ACCESS_ORDER);
  p.reactorExamined = p.accessGranted && p.reactorExamined;
  p.moduleTaken = p.accessGranted && p.moduleTaken;
  p.moduleInstalled = p.reactorExamined && p.moduleTaken && p.moduleInstalled;
  p.circuitPath = p.moduleInstalled ? p.circuitPath : [];
  p.powerRestored = p.moduleInstalled && p.powerRestored && same(p.circuitPath, SHIP_CIRCUIT_ORDER);
  p.lockerClues = p.accessGranted ? p.lockerClues : [];
  p.lockerSymbols = p.lockerClues.length === 3 ? p.lockerSymbols : [];
  p.lockerOpened = p.lockerClues.length === 3 && p.lockerOpened && same(p.lockerSymbols, SHIP_LOCKER_ORDER);
  p.regulators = p.powerRestored ? p.regulators : [0, 0, 0];
  p.lifeStable = p.powerRestored && p.lifeStable && same(lostShipPressures(p.regulators), [5, 5, 5]);
  p.bridgeCardUsed = p.lockerOpened && p.powerRestored && p.lifeStable && p.bridgeCardUsed;
  p.navigationClues = p.accessGranted ? p.navigationClues : [];
  p.navigationValues = p.bridgeCardUsed ? p.navigationValues : [null, null, null];
  p.navigationRestored = p.bridgeCardUsed && p.navigationClues.length === 3 && p.navigationRestored && same(p.navigationValues, SHIP_NAVIGATION_ORDER);
  p.travelerMet = p.bridgeCardUsed && p.travelerMet;
  p.memoryTaken = p.navigationRestored && p.memoryTaken;
  p.memoryInstalled = p.memoryTaken && p.memoryInstalled;
  p.archiveRecovered = p.navigationRestored && p.memoryInstalled && p.travelerMet && p.archiveRecovered;
  p.endingSeen = p.archiveRecovered && p.endingSeen;
  p.orbUnlocked = p.archiveRecovered; // Existing completed saves receive the ability.
  p.orbAnnouncementSeen = p.orbUnlocked && p.orbAnnouncementSeen;
  p.orbNodes = [0, 1, 2].map(index => p.orbUnlocked && source.orbNodes?.[index] === true);
  p.orbDoorOpen = p.orbNodes.every(Boolean);
  p.orbEnemyHealth = p.orbUnlocked && Number.isInteger(source.orbEnemyHealth) ? Math.max(0, Math.min(3, source.orbEnemyHealth)) : 3;
  p.orbEnemyDefeated = p.orbUnlocked && p.orbEnemyHealth === 0;
  p.orbReceiverActivated = p.orbDoorOpen && p.orbEnemyDefeated && p.orbReceiverActivated;
  return p;
}
export function advanceLostShipProgress(current, event, payload) {
  const p = normalizeLostShipProgress(current);
  const next = { ...p, signalSegments: [...p.signalSegments], accessSymbols: [...p.accessSymbols], circuitPath: [...p.circuitPath], lockerSymbols: [...p.lockerSymbols], regulators: [...p.regulators], navigationValues: [...p.navigationValues], lockerClues: [...p.lockerClues], navigationClues: [...p.navigationClues], eventsSeen: [...p.eventsSeen], orbNodes: [...p.orbNodes], hints: { ...p.hints } };
  if (event === "hugo" && !p.hugoBriefed) next.hugoBriefed = true;
  if (event === "signal-rotate" && p.hugoBriefed && !p.signalDecoded && Number.isInteger(payload) && payload >= 0 && payload < 3)
    next.signalSegments[payload] = (next.signalSegments[payload] + 1) % 3;
  if (event === "signal-decode" && p.hugoBriefed && same(p.signalSegments, SHIP_SIGNAL_ORDER)) next.signalDecoded = true;
  if (event === "link" && p.signalDecoded && !p.linkActivated) next.linkActivated = true;
  if (event === "arrive" && p.linkActivated) next.arrivalSeen = true;
  if (event === "access-log" && p.linkActivated) next.accessLog = true;
  if (event === "access-symbol" && p.accessLog && !p.accessGranted && SHIP_ACCESS_ORDER.includes(payload))
    next.accessSymbols = [...p.accessSymbols, payload].slice(-3);
  if (event === "access-reset") next.accessSymbols = [];
  if (event === "access-open" && p.accessLog && same(p.accessSymbols, SHIP_ACCESS_ORDER)) next.accessGranted = true;
  if (event === "reactor-examine" && p.accessGranted) next.reactorExamined = true;
  if (event === "module-take" && p.accessGranted) next.moduleTaken = true;
  if (event === "module-use" && p.reactorExamined && p.moduleTaken) next.moduleInstalled = true;
  if (event === "circuit-add" && p.moduleInstalled && !p.powerRestored && SHIP_CIRCUIT_ORDER.includes(payload))
    next.circuitPath = [...p.circuitPath, payload].slice(-3);
  if (event === "circuit-reset") next.circuitPath = [];
  if (event === "circuit-restore" && p.moduleInstalled && same(p.circuitPath, SHIP_CIRCUIT_ORDER)) {
    next.powerRestored = true;
    next.eventsSeen = unique([...p.eventsSeen, "reactor"], ["corridor", "window", "reactor", "bridge"]);
  }
  if (event === "locker-clue" && p.accessGranted && ["log", "sign", "monitor"].includes(payload))
    next.lockerClues = unique([...p.lockerClues, payload], ["log", "sign", "monitor"]);
  if (event === "locker-symbol" && p.lockerClues.length === 3 && !p.lockerOpened && SHIP_LOCKER_ORDER.includes(payload))
    next.lockerSymbols = [...p.lockerSymbols, payload].slice(-3);
  if (event === "locker-reset") next.lockerSymbols = [];
  if (event === "locker-open" && p.lockerClues.length === 3 && same(p.lockerSymbols, SHIP_LOCKER_ORDER)) next.lockerOpened = true;
  if (event === "card-use" && p.lockerOpened && p.powerRestored && p.lifeStable) next.bridgeCardUsed = true;
  if (event === "regulator" && p.powerRestored && !p.lifeStable && Number.isInteger(payload?.index) && payload.index >= 0 && payload.index < 3 && Number.isInteger(payload.value))
    next.regulators[payload.index] = Math.max(0, Math.min(3, payload.value));
  if (event === "life-reset") next.regulators = [0, 0, 0];
  if (event === "life-stabilize" && p.powerRestored && same(lostShipPressures(p.regulators), [5, 5, 5])) next.lifeStable = true;
  if (event === "navigation-clue" && p.accessGranted && ["reactor", "storage", "bridge"].includes(payload))
    next.navigationClues = unique([...p.navigationClues, payload], ["reactor", "storage", "bridge"]);
  if (event === "navigation-select" && p.bridgeCardUsed && !p.navigationRestored && Number.isInteger(payload?.index) && payload.index >= 0 && payload.index < 3 && ["09", "01", "temple", "void"].includes(payload.value))
    next.navigationValues[payload.index] = payload.value;
  if (event === "navigation-restore" && p.bridgeCardUsed && p.navigationClues.length === 3 && same(p.navigationValues, SHIP_NAVIGATION_ORDER)) {
    next.navigationRestored = true;
    next.eventsSeen = unique([...p.eventsSeen, "bridge"], ["corridor", "window", "reactor", "bridge"]);
  }
  if (event === "memory-take" && p.navigationRestored) next.memoryTaken = true;
  if (event === "memory-use" && p.navigationRestored && p.memoryTaken) next.memoryInstalled = true;
  if (event === "archive-open" && p.navigationRestored && p.memoryInstalled && p.travelerMet) next.archiveRecovered = true;
  if (event === "traveler" && p.bridgeCardUsed) next.travelerMet = true;
  if (event === "ending" && p.archiveRecovered) next.endingSeen = true;
  if (event === "orb-acknowledge" && p.orbUnlocked) next.orbAnnouncementSeen = true;
  if (event === "orb-node-hit" && p.orbUnlocked && Number.isInteger(payload) && payload >= 0 && payload < 3) next.orbNodes[payload] = true;
  if (event === "orb-enemy-hit" && p.orbUnlocked && p.orbEnemyHealth > 0) next.orbEnemyHealth = p.orbEnemyHealth - 1;
  if (event === "orb-enemy-reset" && p.orbUnlocked && !p.orbEnemyDefeated) next.orbEnemyHealth = 3;
  if (event === "orb-receiver-hit" && p.orbDoorOpen && p.orbEnemyDefeated) next.orbReceiverActivated = true;
  if (event === "event" && ["corridor", "window"].includes(payload)) next.eventsSeen = unique([...p.eventsSeen, payload], ["corridor", "window", "reactor", "bridge"]);
  if (event === "hint" && ["signal", "access", "circuit", "locker", "life", "navigation"].includes(payload))
    next.hints[payload] = Math.min(3, (p.hints[payload] || 0) + 1);
  return normalizeLostShipProgress(next);
}
export function lostShipObjective(p) {
  if (!p.hugoBriefed) return "Volvé al estudio y hablá con Hugo sobre la transmisión de la azotea.";
  if (!p.signalDecoded) return "Compará los tres registros en la computadora de Hugo.";
  if (!p.linkActivated) return "Regresá a la azotea y activá el enlace en la antena.";
  if (!p.accessGranted) return "Investigá la cámara de llegada y abrí la compuerta.";
  if (!p.powerRestored) {
    if (!p.moduleTaken) return "Buscá el gabinete MÓDULO ENERGÉTICO en D / Almacén.";
    if (!p.moduleInstalled) return "Llevá el módulo a C / Reactor, examiná el reactor y usalo desde el inventario.";
    return "Activá la distribución de energía en el panel del reactor.";
  }
  if (!p.lifeStable) return "Equilibrá los reguladores de soporte vital.";
  if (!p.lockerOpened) return "Reuní tres pistas y abrí el armario del almacén.";
  if (!p.bridgeCardUsed) return "Usá la tarjeta en la puerta del puente.";
  if (!p.navigationRestored) return "Reconstruí la coordenada dimensional.";
  if (!p.travelerMet) return "Hablá con el Viajero en el puente de mando.";
  if (!p.archiveRecovered) return "Recuperá el archivo principal de la nave.";
  if (!p.orbDoorOpen) return "Investig\u00e1 el origen de PUERTA 02. Us\u00e1 el Orbe Neon para reactivar los nodos de frecuencia (" + p.orbNodes.filter(Boolean).length + "/3).";
  if (!p.orbEnemyDefeated) return "Derrot\u00e1 al eco de frecuencia con el Orbe Neon.";
  if (!p.orbReceiverActivated) return "Carg\u00e1 el receptor de PUERTA 02 con el Orbe Neon.";
  return "Entrenamiento completado. Examiná el receptor para entrar a PUERTA 02: El Partenón Maldito.";
}
