import { HALLOWEEN_NPC_IDS, PHONE_LINES } from "./halloweenSecretsLogic.js";

export const GUIDE_PEOPLE = {
  tito: "Tito", rulo: "Rulo", roxy: "Roxy", freddy: "Bones", jason: "Belfegor",
  "skeleton-holy": "el guardi\u00e1n de Holy Fire", "skeleton-unholy": "el guardi\u00e1n de Unholy Fire",
};
const step = (id, title, detail, target = null) => ({ id, title, detail, target });

// Derived from the existing save: guidance never grants items or advances a quest.
export function getHalloweenGuidance({ chest = {}, demonHealth = 3, judgePhase = "inactive", vhsCollected = false,
  discovered = new Set(), phoneRinging = false, visionPhase = "ready", belfegorAttempts = 0, secretVinylUnlocked = false } = {}) {
  if (judgePhase === "combat") return step("judge-combat", "Derrot\u00e1 al Juez", "Movete para esquivar. Apunt\u00e1 al Juez y toc\u00e1 ORBE; us\u00e1 R para recuperarlo.");
  if (["spawning", "intro", "quiz", "quiz-result", "outcome", "dying"].includes(judgePhase))
    return step("judge-dialogue", "El juicio est\u00e1 en curso", "Escuch\u00e1 al Juez y eleg\u00ed una respuesta cuando aparezcan las opciones.");
  if (judgePhase === "gone") return secretVinylUnlocked
    ? step("complete", "Todos los secretos encontrados", "Tu vinilo rosa te espera al fondo. Tambi\u00e9n pod\u00e9s seguir explorando.", { kind: "secretVinyl", label: "Vinilo rosa" })
    : step("anniversary", "Superaste el juicio", "Busc\u00e1 el vinilo de aniversario al fondo. El Archivo de secretos muestra los descubrimientos opcionales que faltan.", { kind: "vinyl", label: "Vinilo de aniversario" });
  if (!chest.keyOwned) return step("key", "Recog\u00e9 la llave", "Est\u00e1 junto a la entrada. Acercate a la se\u00f1al y toc\u00e1 Recoger llave o el bot\u00f3n E.", { kind: "realityKey", label: "Llave" });
  if (!chest.collected) return chest.open
    ? step("glasses", "Tom\u00e1 las gafas de realidad", "Esper\u00e1 a que se abra la tapa y toc\u00e1 Tomar gafas de realidad.", { kind: "glassesChest", label: "Gafas" })
    : step("chest", "Abr\u00ed el cofre con la llave", "Est\u00e1 al fondo izquierdo de la tienda. Acercate y toc\u00e1 Abrir caja o E.", { kind: "glassesChest", label: "Cofre" });
  if (phoneRinging) return step("phone", "Atend\u00e9 el tel\u00e9fono", "Est\u00e1 en el mostrador, junto a la entrada. Acercate y toc\u00e1 Atender tel\u00e9fono.", { kind: "phone", label: "Tel\u00e9fono" });
  if (demonHealth > 0) return step("demon", "Revel\u00e1 y venc\u00e9 al semidemonio", visionPhase === "cooldown"
    ? "Las gafas se est\u00e1n recargando. Esquiv\u00e1 mientras esper\u00e1s; despu\u00e9s activ\u00e1 VISI\u00d3N C y atac\u00e1 con ORBE."
    : `Solo con VISI\u00d3N C activa le hac\u00e9s da\u00f1o. Apunt\u00e1 al enemigo y toc\u00e1 ORBE. Si te cuesta apuntar, cambi\u00e1 de vista con V. Le quedan ${demonHealth} impactos.`, { kind: "demon", label: "Semidemonio" });
  if (!vhsCollected) return step("vhs", "Busc\u00e1 la cinta VHS", "Est\u00e1 al fondo izquierdo, junto al guardi\u00e1n de Holy Fire. Acercate y recogela con E.", { kind: "vhs", label: "Cinta VHS" });
  if (!discovered.has("vhs:inserted")) return step("tv", "Llev\u00e1 el VHS al televisor", "Busc\u00e1 la TV del lado izquierdo y toc\u00e1 Insertar VHS o E.", { kind: "tv", label: "Televisor" });
  const missing = HALLOWEEN_NPC_IDS.find((id) => !discovered.has(`npc-dialogue:${id}`));
  if (missing) return step(`npc:${missing}`, `Habl\u00e1 con ${GUIDE_PEOPLE[missing]}`, missing === "jason"
    ? `Toc\u00e1 Insistir hasta que responda (${Math.min(4, belfegorAttempts)}/4). Saludar una sola vez no alcanza.`
    : missing === "freddy" ? "Acercate y escuch\u00e1 a Bones. Esa charla tambi\u00e9n cuenta."
      : "Abr\u00ed la conversaci\u00f3n y eleg\u00ed un tema. El saludo solo no cuenta como charla registrada.", { kind: "npc", id: missing, label: GUIDE_PEOPLE[missing] });
  const calls = PHONE_LINES.filter((_, i) => discovered.has(`phone:${i}`)).length;
  if (calls < PHONE_LINES.length) return step("calls", "Esper\u00e1 la pr\u00f3xima llamada", `Atendiste ${calls}/${PHONE_LINES.length}. Cerr\u00e1 los paneles y segu\u00ed explorando: el tel\u00e9fono sonar\u00e1 de nuevo.`, { kind: "phone", label: "Mostrador" });
  return step("mirror", "Mir\u00e1 el espejo con VISI\u00d3N C", "Ya reuniste las pistas. Acercate al espejo de la pared derecha y miralo con las gafas activas para invocar al Juez.", { kind: "mirror", label: "Espejo" });
}

export function getHalloweenChecklist({ chest = {}, demonHealth = 3, vhsCollected = false, discovered = new Set(), judgePhase = "inactive" } = {}) {
  const calls = PHONE_LINES.filter((_, i) => discovered.has(`phone:${i}`)).length;
  const people = HALLOWEEN_NPC_IDS.filter((id) => discovered.has(`npc-dialogue:${id}`)).length;
  return [
    { label: "Llave y gafas de realidad", done: !!chest.collected, value: chest.collected ? "Listo" : chest.keyOwned ? "Faltan las gafas" : "Falta la llave" },
    { label: "Semidemonio derrotado", done: demonHealth === 0, value: `${3 - demonHealth}/3 impactos` },
    { label: "VHS en el televisor", done: vhsCollected && discovered.has("vhs:inserted"), value: discovered.has("vhs:inserted") ? "Listo" : vhsCollected ? "Llevalo a la TV" : "Busc\u00e1 la cinta" },
    { label: "Charlas con personajes distintos", done: people === HALLOWEEN_NPC_IDS.length, value: `${people}/${HALLOWEEN_NPC_IDS.length}` },
    { label: "Llamadas del mostrador", done: calls === PHONE_LINES.length, value: `${calls}/${PHONE_LINES.length}` },
    { label: "Juicio del espejo", done: judgePhase === "gone", value: judgePhase === "gone" ? "Superado" : "Pendiente" },
  ];
}


export const GUIDE_REVEAL_IDS = Object.freeze(["welcome", "demon", "people", "mirror"]);
export function pendingGuideReveal({ chest = {}, demonHealth = 3, vhsCollected = false, discovered = new Set(), judgePhase = "inactive" }, seen = []) {
  if (judgePhase !== "inactive" || !chest.collected) return null;
  if (demonHealth > 0) return seen.includes("demon") ? null : { kind: "demon" };
  if (!vhsCollected || !discovered.has("vhs:inserted")) return null;
  const missing = HALLOWEEN_NPC_IDS.find(id => !discovered.has(`npc-dialogue:${id}`));
  if (missing) return seen.includes("people") ? null : { kind: "people", npcId: missing };
  if (PHONE_LINES.some((_, i) => !discovered.has(`phone:${i}`))) return null;
  return seen.includes("mirror") ? null : { kind: "mirror" };
}

export function guideRevealCopy(kind, { npcId, discovered = new Set() } = {}) {
  if (kind === "demon") return {
    eyebrow: "GAFAS DE REALIDAD / APREND\u00c9 A ATACAR", title: "Con VISI\u00d3N C, s\u00ed le hac\u00e9s da\u00f1o",
    text: "Este es el semidemonio. Activ\u00e1 las gafas con VISI\u00d3N C, apuntale y toc\u00e1 ORBE. Sin la visi\u00f3n activa, su escudo rechaza el ataque.",
    tip: "La visi\u00f3n dura 10 s y se recarga en 20 s. Esquiv\u00e1 mientras recarga. El tiempo est\u00e1 pausado durante esta ayuda.",
  };
  if (kind === "people") {
    const count = HALLOWEEN_NPC_IDS.filter(id => discovered.has(`npc-dialogue:${id}`)).length;
    return { eyebrow: `CONVERSACIONES / ${count} DE ${HALLOWEEN_NPC_IDS.length} COMPLETADAS`, title: `Te falta hablar con ${GUIDE_PEOPLE[npcId] || "este personaje"}`,
      text: "Ten\u00e9s que hablar con los siete personajes distintos. Acercate, toc\u00e1 Hablar o E y eleg\u00ed un tema; el saludo solo no alcanza.",
      tip: npcId === "jason" ? "Con Belfegor, insist\u00ed cuatro veces hasta que responda. GU\u00cdA te muestra qui\u00e9nes faltan."
        : npcId === "freddy" ? "Con Bones alcanza con escucharlo. GU\u00cdA te muestra qui\u00e9nes faltan."
        : "Con Bones alcanza con escucharlo; con Belfegor, insist\u00ed cuatro veces. Consult\u00e1 los nombres pendientes en GU\u00cdA." };
  }
  if (kind === "mirror") return {
    eyebrow: "PISTAS REUNIDAS / EL ESPEJO TE ESPERA", title: "Mir\u00e1 este espejo con las gafas activas",
    text: "Ya venciste al semidemonio, atendiste las cuatro llamadas, insertaste el VHS y hablaste con todos. Volv\u00e9 al personaje y acercate a este espejo.",
    tip: "Activ\u00e1 VISI\u00d3N C y orient\u00e1 la c\u00e1mara hacia el espejo: as\u00ed comienza el juicio. Esta vista de ayuda no lo activa.",
  };
  return { eyebrow: "LLAVE RECUPERADA / DESTINO REVELADO", title: "Este es el cofre de las gafas", text: "Al fondo izquierdo. Acercate y toc\u00e1 Abrir caja.", tip: "" };
}
