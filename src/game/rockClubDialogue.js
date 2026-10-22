import { chooseRikyDialogue, getRikyDialogueNode } from "./rockClubRiky.js";
import { ROCK_CLUB_FRIENDS, FRIENDS_TABLE_NPC, getFriendsDialogueNode, chooseFriendsDialogue } from "./rockClubFriends.js";

export const ROCK_CLUB_NPCS = [
  { id: "charly", name: 'Charly "Cable"', role: "Encargado del club", avatar: "CC",
    model: new URL("../assets/neonboy-animaciones/charly.glb", import.meta.url).href, fitHeight: 1.85 },
  { id: "club-rulo", name: 'Rulo "Distorsión"', role: "Metalero", avatar: "RD",
    model: new URL("../assets/neonboy-animaciones/club-de-rock/rulo-pose2.glb", import.meta.url).href, fitHeight: 1.86 },
  { id: "club-roxy", name: "Roxy", role: "Guitarrista", avatar: "RX",
    model: new URL("../assets/neonboy-animaciones/mujer-quieta.store.glb", import.meta.url).href, fitHeight: 1.78 },
  { id: "riky", name: "Riky", role: "Guitarrista y amigo de NeonBoy", avatar: "RK",
    model: new URL("../assets/neonboy-animaciones/club-de-rock/ricky.glb", import.meta.url).href, fitHeight: 1.82 },
  ...ROCK_CLUB_FRIENDS,
];

export const ROCK_CLUB_DIALOGUE_NPCS = [...ROCK_CLUB_NPCS, FRIENDS_TABLE_NPC];

const option = (id, label, next, event) => ({ id, label, next, event });
const back = option("back", "Seguir hablando", "root");
const bye = option("bye", "Terminar conversación", "close");
const lines = (pairs) => pairs.map(([speaker, text]) => ({ speaker, text }));

function charlyOptions(quest) {
  return [
    ...(quest.anomalySeen ? [option("post-show", "¿Qué te pareció el recital?", "post-show")] : []),
    ...(quest.soundcheckStarted && quest.inspected.length === 3 && !quest.soundcheckComplete
      ? [option("soundcheck-ready", "Charly, creo que está todo listo.", "soundcheck-ready", "completeSoundcheck")] : []),
    ...(quest.backstageAuthorized
      ? [option("credential-presented", "¿Sigue vigente mi pase?", "credential-presented")]
      : [option("credential", "Vengo de parte de Tito.", quest.credentialGranted ? "credential" : "no-credential",
        quest.credentialGranted ? "charlyAuthorizes" : undefined)]),
    option("show", "¿Puedo tocar esta noche?", "show"),
    option("equipment", "¿Qué le pasó al equipo?", "equipment"),
    option("rulo", "¿Conocés a Rulo?", "rulo"),
    option("roxy", "¿Y a Roxy?", "roxy"),
    option("backstage", "¿Dónde está el backstage?", "backstage"),
    option("bye", "Bueno, voy a revisar el lugar.", "farewell"),
  ];
}

const charlyTopics = {
  "post-show": [["NEONBOY", "¿Qué te pareció el recital?"], ["CHARLY", "Ahora sí sonaron como una banda de verdad."]],
  credential: [
    ["NEONBOY", "Vengo de parte de Tito."],
    ["CHARLY", "¿Tito? ¡Ese viejo todavía me debe plata de un amplificador!"],
    ["NEONBOY", "Me dio esta credencial."],
    ["CHARLY", "Bueno, por lo menos esta vez mandó a alguien con papeles."],
  ],
  show: [
    ["NEONBOY", "¿Puedo tocar esta noche?"],
    ["CHARLY", "¿Vos? ¿Con esa máscara? Bueno, he visto cosas peores arriba de este escenario."],
    ["NEONBOY", "¿Entonces puedo tocar?"],
    ["CHARLY", "Primero tenemos que revisar el equipo. La última banda casi prende fuego la consola."],
  ],
  equipment: [
    ["NEONBOY", "¿Qué le pasó al equipo?"],
    ["CHARLY", "Un guitarrista quiso poner todo en once. Ahora tenemos un amplificador que funciona cuando quiere y una mesa que hace ruidos de otro planeta."],
    ["NEONBOY", "Eso no suena bien."],
    ["CHARLY", "¡Exactamente! Por eso necesitamos un técnico, no otro guitarrista."],
  ],
  rulo: [
    ["NEONBOY", "¿Conocés a Rulo?"],
    ["CHARLY", "¿El de pelo largo? Viene siempre. Se pasa la noche discutiendo sobre qué guitarrista toca más rápido."],
  ],
  roxy: [
    ["NEONBOY", "¿Y a Roxy?"],
    ["CHARLY", "Sí. Viene por la música. No le gusta que la molesten, así que te recomiendo que la dejes disfrutar el recital."],
  ],
  backstage: [
    ["NEONBOY", "¿Dónde está el backstage?"],
    ["CHARLY", "Detrás del escenario. Pero no entra cualquiera. Primero demostrame que estás listo para tocar."],
  ],
  farewell: [
    ["NEONBOY", "Bueno, voy a revisar el lugar."],
    ["CHARLY", "Dale. Pero no toques ningún cable, que después el que tiene que arreglar todo soy yo."],
  ],
  "soundcheck-ready": [
    ["NEONBOY", "Charly, creo que está todo listo."],
    ["CHARLY", "Bueno, por lo menos esta vez no explotó nada."],
    ["NEONBOY", "¿Entonces puedo tocar?"],
    ["CHARLY", "Está bien. El escenario es tuyo."],
  ],
};

export function getRockClubDialogueNode(npcId, nodeId, quest, storeProgress = {}, rikyProgress, masterTape, friendsProgress, friendsContext) {
  if (!ROCK_CLUB_DIALOGUE_NPCS.some((npc) => npc.id === npcId)) return null;
  if (npcId === "riky") return getRikyDialogueNode(nodeId, rikyProgress, masterTape, quest);
  if (npcId === "friendsTable" || ROCK_CLUB_FRIENDS.some((npc) => npc.id === npcId))
    return getFriendsDialogueNode(npcId, nodeId, friendsProgress, friendsContext);
  if (npcId === "charly") {
    if (nodeId === "greeting" || nodeId === "root") return {
      id: nodeId, kicker: "CLUB DE ROCK · 1999",
      text: nodeId === "greeting" && !quest.charlyMet
        ? "¡Eh, vos! ¿Qué hacés acá? Si venís a probar sonido, llegaste tarde. Si venís a tocar, llegaste demasiado temprano."
        : "No toques los cables sin avisarme. ¿Qué necesitás?",
      options: charlyOptions(quest),
    };
    if (nodeId === "credential-presented" && quest.backstageAuthorized) return {
      id: nodeId, kicker: "ACCESO AUTORIZADO",
      text: "Sí, ya vi tu credencial. Podés pasar a la zona de preparación; no me hagas pedirla de nuevo.",
      options: [back, bye],
    };
    if (nodeId === "no-credential") return {
      id: nodeId, kicker: "ACCESO AL CLUB",
      text: "Si venís de parte de Tito, primero pedile la credencial. Sin eso no te puedo dejar pasar a la zona de preparación.",
      options: [back, bye],
    };
    if (charlyTopics[nodeId]) return {
      id: nodeId, kicker: nodeId === "soundcheck-ready" ? "PRUEBA DE SONIDO COMPLETADA" : undefined,
      lines: lines(charlyTopics[nodeId]),
      options: nodeId === "farewell" ? [option("close", "Cerrar conversación", "close")] : [back, bye],
    };
    return null;
  }
  if (npcId === "club-rulo") {
    if (nodeId === "greeting" || nodeId === "root") return {
      id: nodeId, text: storeProgress.duelCompleted
        ? "¡Ahí está el de la máscara! Espero que toques tan bien como contestás."
        : storeProgress.metalheadMet ? "¡Vos también por acá!" : "No me tapes la vista del escenario, pibe.",
      options: [option("club-rulo", "¿Vos también venís acá?", "club-rulo"),
        ...(quest.anomalySeen ? [option("post-show", "¿Y el recital?", "post-show")] : []), bye],
    };
    if (nodeId === "post-show" && quest.anomalySeen) return {
      id: nodeId, lines: lines([["NEONBOY", "¿Y el final del recital?"],
        ["RULO", "¡Eso sí fue un recital! Aunque el final estuvo medio raro..."]]), options: [back, bye],
    };
    if (nodeId === "club-rulo") return {
      id: nodeId, lines: lines([
        ["NEONBOY", "¿Vos también venís acá?"],
        ["RULO", "¡Obvio! Acá por lo menos ponen música de verdad."],
        ["NEONBOY", "Voy a tocar esta noche."],
        ["RULO", "¿Vos? Bueno, espero que tus solos sean tan buenos como decís."],
      ]), options: [back, bye],
    };
  }
  if (npcId === "club-roxy") {
    if (nodeId === "greeting" || nodeId === "root") return {
      id: nodeId, text: "Vine a escuchar música. No te agrandés.",
      options: [option("club-roxy", "¡Roxy! ¿Viniste a verme tocar?", "club-roxy"), bye],
    };
    if (nodeId === "club-roxy") return {
      id: nodeId, lines: lines([
        ["NEONBOY", "¡Roxy! ¿Viniste a verme tocar?"],
        ["ROXY", "Vine a escuchar música. No te agrandés."],
        ["NEONBOY", "¿Y si toco un solo espectacular?"],
        ["ROXY", "Probá. Pero no esperes que te aplauda."],
      ]), options: [back, bye],
    };
  }
  return null;
}

export function chooseRockClubDialogue(npcId, nodeId, optionId, quest, storeProgress, rikyProgress, masterTape, friendsProgress, friendsContext) {
  if (npcId === "riky") return chooseRikyDialogue(nodeId, optionId, rikyProgress, masterTape, quest);
  if (npcId === "friendsTable" || ROCK_CLUB_FRIENDS.some((npc) => npc.id === npcId))
    return chooseFriendsDialogue(npcId, nodeId, optionId, friendsProgress, friendsContext);
  const node = getRockClubDialogueNode(npcId, nodeId, quest, storeProgress);
  const chosen = node?.options.find((option) => option.id === optionId);
  return chosen ? { nodeId: chosen.next, clubEvent: chosen.event } : { nodeId };
}
