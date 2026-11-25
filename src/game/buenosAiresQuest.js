import { FUEGO_INITIAL, normalizeFuegoProgress, advanceFuegoProgress, countFuegoComponents, countFuegoInstalled } from "./buenosAiresFuegoQuest.js";
import { VIGILANTE_MAX_HEALTH, VIGILANTE_NODES, vigilanteShielded } from "./buenosAiresVigilanteCombat.js";
export const ADVERT_ORDER = ["mirar", "desear", "consumir"];
export const TRAFFIC_ORDER = ["senal", "ruta", "control"];
export const CORE_ORDER = ["origen", "enlace", "nucleo"];
const citizenId = /^ba-(man|woman|executive|elder)-\d$/;
const validPrefix = (value, order) => {
  const items = Array.isArray(value) ? value.filter(item => typeof item === "string").slice(0, order.length) : [];
  return items.every((item, index) => item === order[index]) ? items : [];
};
const seenItems = (value, order) => [...new Set((Array.isArray(value) ? value : []).filter(item => order.includes(item)))];

export const BUENOS_AIRES_INITIAL = Object.freeze({
  entered: false, introSeen: false, obeliskExplored: false, visionActive: false,
  yellowCarSeen: false, citizens: [], signalFound: false, disconnectedMet: false,
  advertInspected: [], advertSequence: [], advertisingComplete: false,
  trafficSequence: [], trafficReflectorAligned: false, trafficComplete: false,
  coreSequence: [], coreReflectorAligned: false, coreComplete: false,
  synchronizationSeen: false, refugeUnlocked: false,
  vigilanteEncountered: false, vigilanteStarted: false, vigilanteHealth: VIGILANTE_MAX_HEALTH,
  vigilanteNodes: [], vigilantePhaseSeen: false, vigilanteDefeated: false,
  record1999Found: false, escapeUnlocked: false, escapeBriefed: false,
  ...FUEGO_INITIAL,
});

export function normalizeBuenosAiresProgress(value, throneCompleted = false) {
  if (!throneCompleted) return { ...BUENOS_AIRES_INITIAL, citizens: [], advertInspected: [], advertSequence: [], trafficSequence: [], coreSequence: [] };
  const p = value && typeof value === "object" ? value : {};
  const advertisingComplete = p.advertisingComplete === true;
  const trafficComplete = advertisingComplete && p.trafficComplete === true;
  const coreComplete = trafficComplete && p.coreComplete === true;
  const synchronizationSeen = coreComplete && p.synchronizationSeen === true;
  const vigilanteEncountered = synchronizationSeen && p.vigilanteEncountered === true;
  const vigilanteStarted = vigilanteEncountered && p.vigilanteStarted === true;
  const vigilanteDefeated = vigilanteStarted && p.vigilanteDefeated === true;
  const vigilanteHealth = vigilanteDefeated ? 0 : vigilanteStarted && Number.isFinite(p.vigilanteHealth)
    ? Math.max(0, Math.min(VIGILANTE_MAX_HEALTH, Math.floor(p.vigilanteHealth))) : VIGILANTE_MAX_HEALTH;
  return {
    entered: p.entered === true, introSeen: p.introSeen === true,
    obeliskExplored: p.obeliskExplored === true, visionActive: p.visionActive === true,
    yellowCarSeen: p.yellowCarSeen === true,
    citizens: [...new Set((Array.isArray(p.citizens) ? p.citizens : []).filter(id => typeof id === "string" && citizenId.test(id)))].slice(0, 3),
    signalFound: p.signalFound === true, disconnectedMet: p.disconnectedMet === true,
    advertInspected: advertisingComplete ? [...ADVERT_ORDER] : seenItems(p.advertInspected, ADVERT_ORDER),
    advertSequence: advertisingComplete ? [...ADVERT_ORDER] : validPrefix(p.advertSequence, ADVERT_ORDER),
    advertisingComplete,
    trafficSequence: trafficComplete ? [...TRAFFIC_ORDER] : validPrefix(p.trafficSequence, TRAFFIC_ORDER),
    trafficReflectorAligned: p.trafficReflectorAligned === true, trafficComplete,
    coreSequence: coreComplete ? [...CORE_ORDER] : validPrefix(p.coreSequence, CORE_ORDER),
    coreReflectorAligned: p.coreReflectorAligned === true, coreComplete,
    synchronizationSeen, refugeUnlocked: synchronizationSeen,
    vigilanteEncountered, vigilanteStarted, vigilanteHealth, vigilanteDefeated,
    vigilanteNodes: vigilanteStarted && vigilanteHealth <= 4 ? seenItems(p.vigilanteNodes, VIGILANTE_NODES.map(n => n.id)) : [],
    vigilantePhaseSeen: vigilanteStarted && p.vigilantePhaseSeen === true,
    record1999Found: vigilanteDefeated && (p.record1999Found === true || p.record1999Found === undefined),
    escapeUnlocked: vigilanteDefeated && normalizeFuegoProgress(p, vigilanteDefeated).fuegoPowered,
    ...normalizeFuegoProgress(p, vigilanteDefeated),
    escapeBriefed: vigilanteDefeated && normalizeFuegoProgress(p, vigilanteDefeated).fuegoPowered && p.escapeBriefed === true,
  };
}

export function advanceBuenosAires(progress, event, throneCompleted = true) {
  const p = normalizeBuenosAiresProgress(progress, throneCompleted);
  if (!throneCompleted) return p;
  if (event.startsWith("fuego-")) return advanceFuegoProgress(p, event);
  if (event === "vigilante-encounter" && p.synchronizationSeen) return { ...p, vigilanteEncountered: true };
  if (event === "vigilante-start" && p.vigilanteEncountered && !p.vigilanteDefeated) return { ...p, vigilanteStarted: true };
  if (event === "vigilante-phase-seen" && p.vigilanteStarted && p.vigilanteHealth <= 4) return { ...p, vigilantePhaseSeen: true };
  if (event === "vigilante-hit" && p.vigilanteStarted && !p.vigilanteDefeated && !vigilanteShielded(p))
    return { ...p, vigilanteHealth: Math.max(0, p.vigilanteHealth - 1) };
  if (event.startsWith("vigilante-node:") && p.visionActive && vigilanteShielded(p)) {
    const id = event.slice(15);
    if (VIGILANTE_NODES.some(n => n.id === id) && !p.vigilanteNodes.includes(id)) return { ...p, vigilanteNodes: [...p.vigilanteNodes, id] };
  }
  if (event === "vigilante-defeated" && p.vigilanteStarted && p.vigilanteHealth === 0)
    return { ...p, vigilanteDefeated: true, record1999Found: true };
  if (event === "escape-briefed" && p.fuegoPowered) return { ...p, escapeBriefed: true };
  if (event === "vigilante-retry" && p.synchronizationSeen && !p.vigilanteDefeated)
    return { ...p, vigilanteHealth: VIGILANTE_MAX_HEALTH, vigilanteNodes: [], vigilantePhaseSeen: false };
  if (event === "enter") return { ...p, entered: true };
  if (event === "intro-seen") return { ...p, introSeen: true };
  if (event === "obelisk-explored") return { ...p, obeliskExplored: true };
  if (event === "vision-toggle") return { ...p, visionActive: !p.visionActive };
  if (event === "yellow-car-seen") return { ...p, yellowCarSeen: true };
  if (event.startsWith("citizen:")) {
    const id = event.slice(8);
    if (!citizenId.test(id) || p.citizens.includes(id) || p.citizens.length >= 3) return p;
    return { ...p, citizens: [...p.citizens, id] };
  }
  if (event === "signal-found" && p.citizens.length >= 3 && p.visionActive && !p.signalFound) return { ...p, signalFound: true };
  if (event === "disconnected-met" && p.signalFound && !p.disconnectedMet) return { ...p, disconnectedMet: true };
  if (event.startsWith("advert-inspect:") && p.disconnectedMet && p.visionActive) {
    const id = event.slice(15);
    if (!ADVERT_ORDER.includes(id) || p.advertInspected.includes(id)) return p;
    return { ...p, advertInspected: [...p.advertInspected, id] };
  }
  if (event.startsWith("advert-activate:") && p.disconnectedMet && p.visionActive && !p.advertisingComplete && p.advertInspected.length === 3) {
    const id = event.slice(16), expected = ADVERT_ORDER[p.advertSequence.length];
    if (!ADVERT_ORDER.includes(id)) return p;
    const next = id === expected ? [...p.advertSequence, id] : [];
    return { ...p, advertSequence: next, advertisingComplete: next.length === 3 };
  }
  if (event === "traffic-align" && p.advertisingComplete && p.visionActive && !p.trafficComplete)
    return { ...p, trafficReflectorAligned: !p.trafficReflectorAligned };
  if (event.startsWith("traffic-hit:") && p.advertisingComplete && p.visionActive && !p.trafficComplete) {
    const [, id, ricochets] = event.split(":"), expected = TRAFFIC_ORDER[p.trafficSequence.length];
    if (!TRAFFIC_ORDER.includes(id)) return p;
    const valid = id === expected && (id !== "ruta" || p.trafficReflectorAligned && Number(ricochets) > 0);
    const next = valid ? [...p.trafficSequence, id] : [];
    return { ...p, trafficSequence: next, trafficComplete: next.length === 3 };
  }
  if (event === "core-align" && p.trafficComplete && p.visionActive && !p.coreComplete)
    return { ...p, coreReflectorAligned: !p.coreReflectorAligned };
  if (event.startsWith("core-hit:") && p.trafficComplete && p.visionActive && !p.coreComplete) {
    const [, id, ricochets] = event.split(":"), expected = CORE_ORDER[p.coreSequence.length];
    if (!CORE_ORDER.includes(id)) return p;
    const valid = id === expected && (id !== "enlace" || p.coreReflectorAligned && Number(ricochets) > 0);
    const next = valid ? [...p.coreSequence, id] : [];
    return { ...p, coreSequence: next, coreComplete: next.length === 3 };
  }
  if (event === "synchronization-seen" && p.coreComplete && !p.synchronizationSeen)
    return { ...p, synchronizationSeen: true, refugeUnlocked: true };
  return p;
}

export function buenosAiresObjective(progress) {
  const p = progress || BUENOS_AIRES_INITIAL;
  if (p.completed) return "CAP\u00cdTULO 14 COMPLETADO. Siguiente destino: Buenos Aires, 1999 / pr\u00f3ximamente.";
  if (p.fuegoFlightUnlocked) return "VOLV\u00c9 AL FUEGO. Puls\u00e1 E para iniciar la fuga de la Red.";
  if (p.escapeUnlocked) return "ESCAPÁ DE BUENOS AIRES 2049. Renault Fuego operativo. Ruta de fuga preparada.";
  if (p.fuegoStarted && countFuegoInstalled(p) === 3) return "INICIÁ EL SISTEMA DE VUELO del Renault Fuego.";
  if (p.fuegoStarted && countFuegoComponents(p) === 3) return "VOLVÉ AL RENAULT FUEGO. Instalá los componentes (" + countFuegoInstalled(p) + "/3).";
  if (p.fuegoStarted) return "CONSEGUÍ LOS TRES COMPONENTES DEL RENAULT FUEGO (" + countFuegoComponents(p) + "/3).";
  if (p.vigilanteDefeated) return "REVISÁ EL RENAULT FUEGO frente al Obelisco.";
  if (p.vigilanteStarted && p.vigilanteHealth === 0) return "El Vigilante está cayendo. Escuchá su registro final.";
  if (vigilanteShielded(p)) return "Revelá los tres nodos con C y golpealos con el Orbe para desactivar el escudo (" + p.vigilanteNodes.length + "/3).";
  if (p.vigilanteStarted) return "Derrotá al Vigilante de la Red. Esquivá sus ataques y acertá el Orbe.";
  if (p.synchronizationSeen) return "La Red envió un Vigilante. Acercate a la explanada entre el Obelisco y las letras BA.";
  if (p.refugeUnlocked) return "BUSC\u00c1 REFUGIO CON LA DESCONECTADA. Quedate cerca de ella mientras preparamos la salida.";
  if (p.coreComplete) return "La Red reacciona. Observ\u00e1 la sincronizaci\u00f3n de la ciudad.";
  if (p.trafficComplete) return "DESACTIV\u00c1 EL N\u00daCLEO DEL OBELISCO con Visi\u00f3n de Frecuencia, reflector y Orbe Ne\u00f3n (" + p.coreSequence.length + "/3).";
  if (p.advertisingComplete) return "LIBER\u00c1 EL CONTROL DE TR\u00c1NSITO: aline\u00e1 el reflector y acert\u00e1 los nodos con el Orbe (" + p.trafficSequence.length + "/3).";
  if (p.disconnectedMet && p.advertInspected.length === 3) return "ACTIV\u00c1 MIRAR, DESEAR Y CONSUMIR en las pantallas de Corrientes (" + p.advertSequence.length + "/3).";
  if (p.disconnectedMet) return "INVESTIG\u00c1 LOS TRES TRANSMISORES DE LA RED. Examin\u00e1 los anuncios de Corrientes con Visi\u00f3n de Frecuencia (" + p.advertInspected.length + "/3).";
  if (p.signalFound) return "Habl\u00e1 con la Desconectada cerca de Corrientes.";
  if (p.citizens.length >= 3) return "Investig\u00e1 la extra\u00f1a conducta de los ciudadanos con Visi\u00f3n de Frecuencia.";
  return "Habl\u00e1 con tres ciudadanos distintos (" + p.citizens.length + "/3).";
}




