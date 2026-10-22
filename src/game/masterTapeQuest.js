export const MASTER_TAPE_SAVE_KEY = "neonboy.universe.master-tape.v1";

const CHANNEL_IDS = ["guitar", "bass", "drums"];
const PHASES = ["new", "tape", "review", "master", "complete"];

export const INITIAL_MASTER_TAPE_PROGRESS = Object.freeze({
  phase: "new", reviewed: [], studioTokens: 0
});

export function loadMasterTapeProgress(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(MASTER_TAPE_SAVE_KEY) || "null");
    if (saved?.version !== 1 || !saved.progress) return { ...INITIAL_MASTER_TAPE_PROGRESS };
    const { phase, reviewed } = saved.progress;
    if (!PHASES.includes(phase) || !Array.isArray(reviewed)) return { ...INITIAL_MASTER_TAPE_PROGRESS };
    const unique = CHANNEL_IDS.filter((id) => reviewed.includes(id));
    if ((phase === "master" || phase === "complete") && unique.length !== CHANNEL_IDS.length)
      return { ...INITIAL_MASTER_TAPE_PROGRESS };
    return { phase, reviewed: phase === "new" || phase === "tape" ? [] : unique,
      studioTokens: phase === "master" || phase === "complete" ? 1 : 0 };
  } catch { return { ...INITIAL_MASTER_TAPE_PROGRESS }; }
}

export function saveMasterTapeProgress(progress, storage = globalThis.localStorage) {
  try { storage.setItem(MASTER_TAPE_SAVE_KEY, JSON.stringify({ version: 1, progress })); return true; }
  catch { return false; }
}

export function advanceMasterTape(progress, event) {
  if (event === "takeTape" && progress.phase === "new") return { ...progress, phase: "tape" };
  if (event === "startReview" && progress.phase === "tape") return { ...progress, phase: "review" };
  if (event?.startsWith("inspect:") && progress.phase === "review") {
    const id = event.slice(8);
    if (CHANNEL_IDS.includes(id) && !progress.reviewed.includes(id))
      return { ...progress, reviewed: [...progress.reviewed, id] };
  }
  if (event === "claimMaster" && progress.phase === "review" && progress.reviewed.length === CHANNEL_IDS.length)
    return { ...progress, phase: "master", studioTokens: 1 };
  if (event === "deliverMaster" && progress.phase === "master") return { ...progress, phase: "complete" };
  return progress;
}

export function masterTapeInventory(progress) {
  return [
    ...(progress.phase === "tape" ? ["Cinta de grabación de 1999"] : []),
    ...(progress.phase === "master" ? ["Máster restaurado de 1999"] : [])
  ];
}

export function masterTapeObjective(progress) {
  if (progress.phase === "new") return "Preguntale a Tito si tiene algo nuevo.";
  if (progress.phase === "tape") return "Llevá la cinta al estudio y hablá con Hugo.";
  if (progress.phase === "review") return progress.reviewed.length === CHANNEL_IDS.length
    ? "Los tres canales están revisados. Volvé con Hugo."
    : `Examiná guitarra, bajo y batería en la consola (${progress.reviewed.length}/3).`;
  if (progress.phase === "master") return "Llevá el máster restaurado a Tito.";
  return "Misión completada. Neon Sessions está disponible en la tienda.";
}

const option = (id, label, next, questEvent) => ({ id, label, next, questEvent });
const back = option("master:back", "Seguir hablando", "root");
const close = option("master:close", "Terminar conversación", "close");

export function masterTapeOptions(npc, progress = INITIAL_MASTER_TAPE_PROGRESS) {
  if (npc === "tito") return [
    ...(progress.phase === "new" ? [option("master:start", "¿Tenés algo nuevo para mí?", "master:tito-disc")] : []),
    ...(progress.phase === "tape" || progress.phase === "review" ? [option("master:tape-reminder", "¿Qué hago con la cinta?", "master:tito-reminder")] : []),
    ...(progress.phase === "master" ? [option("master:deliver", "Acá tenés el máster restaurado.", "master:tito-return")] : []),
    ...(progress.phase === "complete" ? [option("master:sessions", "¿Ya puedo ver Neon Sessions?", "master:tito-sessions")] : []),
    option("master:hugo", "¿Conocés a Hugo Mendez?", "master:tito-hugo")
  ];
  if (npc === "hugo") return [
    ...(progress.phase === "tape" ? [option("master:bring", "Hugo, Tito dice que mi disco suena como una licuadora.", "master:hugo-tape")] : []),
    ...(progress.phase === "review" && progress.reviewed.length < CHANNEL_IDS.length ? [option("master:channels", "¿Qué pistas tengo que revisar?", "master:hugo-channels")] : []),
    ...(progress.phase === "review" && progress.reviewed.length === CHANNEL_IDS.length ? [option("master:finish", "Bueno, Hugo, ¿cómo quedó?", "master:hugo-result")] : []),
    ...(progress.phase === "master" ? [option("master:return", "¿A quién le llevo el máster?", "master:hugo-return")] : [])
  ];
  return [];
}

export function getMasterTapeDialogueNode(npc, nodeId, progress = INITIAL_MASTER_TAPE_PROGRESS) {
  if (!nodeId?.startsWith("master:")) return null;
  const node = (text, options, kicker = "EL MÁSTER PERDIDO") => ({ id: nodeId, text, options, kicker });
  if (npc === "tito") {
    if (nodeId === "master:tito-disc" && progress.phase === "new") return node("Che, NeonBoy, tengo un disco tuyo que suena horrible. Parece grabado adentro de una licuadora.", [option("master:clean", "¿Y no probaste limpiarlo?", "master:tito-tape", "takeTape"), back]);
    if (nodeId === "master:tito-tape" && progress.phase === "tape") return node("¡Está limpio! ¡El problema es la mezcla! Tomá esta cinta de grabación de 1999 y llevásela a Hugo.", [back, close]);
    if (nodeId === "master:tito-reminder") return node("Llevásela a Hugo Mendez, en Neon Recording Studio. Él puede revisar la mezcla.", [back, close]);
    if (nodeId === "master:tito-return" && progress.phase === "master") return node("¡Ahora sí suena bien! Aunque sigo pensando que tenés demasiados solos de guitarra.", [option("master:reply", "¡Nunca son demasiados!", "master:tito-complete", "deliverMaster"), back]);
    if (nodeId === "master:tito-complete" && progress.phase === "complete") return node("Quedó archivado. Ya podés entrar a NEON SESSIONS — ARCHIVO DE GRABACIONES.", [back, close], "MISIÓN COMPLETADA");
    if (nodeId === "master:tito-sessions" && progress.phase === "complete") return node("Sí. El archivo Neon Sessions ya está abierto en la tienda; el material adicional llegará pronto.", [back, close]);
    if (nodeId === "master:tito-hugo") return node("¿Conocés a Hugo Mendez? Es el violero que te ayuda con las grabaciones. Tiene sus propios discos también.", [option("master:hugo-info", "¿Dónde escucho sus discos?", "master:tito-hugo-info"), back]);
    if (nodeId === "master:tito-hugo-info") return node("Abrí MAPA y entrá a Neon Recording Studio. Su colección está en la computadora y en los cuadros del estudio.", [back, close], "HUGO MENDEZ · ARTISTA INVITADO");
  }
  if (npc === "hugo") {
    if (nodeId === "master:hugo-tape" && progress.phase === "tape") return node("Bueno, traé la grabación. Vamos a ver qué pasa.", [option("master:fix", "¿Se puede arreglar?", "master:hugo-review", "startReview"), back]);
    if (nodeId === "master:hugo-review" && progress.phase === "review") return node("Primero revisemos las pistas. Después vemos qué necesita. Examiná guitarra, bajo y batería en la consola.", [back, close]);
    if (nodeId === "master:hugo-channels" && progress.phase === "review") return node(`Guitarra, bajo y batería. Ya revisaste ${progress.reviewed.length} de 3. Acercate a la consola y seleccioná cada canal.`, [back, close]);
    if (nodeId === "master:hugo-result" && progress.phase === "review" && progress.reviewed.length === CHANNEL_IDS.length) return node("Mucho mejor. Ahora los instrumentos tienen su lugar.", [option("master:what-now", "¿Y qué hacemos con la grabación?", "master:hugo-reward", "claimMaster"), back]);
    if (nodeId === "master:hugo-reward" && progress.phase === "master") return node("Llevásela a Tito. Y tomá esta ficha, que te la ganaste trabajando. Recibiste el Máster restaurado de 1999 y 1 ficha de estudio.", [back, close], "MÁSTER RESTAURADO · +1 FICHA DE ESTUDIO");
    if (nodeId === "master:hugo-return" && progress.phase === "master") return node("Lleváselo a Tito, en la Tienda de los Discos. Ya tiene la mezcla corregida.", [back, close]);
  }
  return null;
}
