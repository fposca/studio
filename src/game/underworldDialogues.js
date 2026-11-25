// The audio paths are metadata only. No request is made until voice files actually exist.
const sequences = {};
const lines = {};

function register(key, { priority, mode, condition, completionEvent = null }, entries) {
  const ids = entries.map(([id, speaker, text]) => {
    lines[id] = Object.freeze({
      id, speaker, text, event: key, condition, priority,
      futureAudio: `/audio/underworld/${id}.mp3`,
    });
    return id;
  });
  sequences[key] = Object.freeze({ key, ids, priority, mode, condition, completionEvent });
}

register("intro", { priority: 30, mode: "auto", condition: "first visit", completionEvent: "intro-seen" }, [
  ["neonboy-infierno-intro-01", "NEONBOY", "Bueno... definitivamente esto no es Buenos Aires."],
  ["neonboy-infierno-intro-02", "NEONBOY", "Lava, demonios y un castillo tenebroso... Me siento como en la tapa de un disco de heavy metal."],
  ["neonboy-infierno-intro-03", "NEONBOY", "Espero que acá abajo tengan aire acondicionado."],
]);

register("alma-first", { priority: 80, mode: "conversation", condition: "first Alma encounter", completionEvent: "alma-met" }, [
  ["alma-01", "ALMA ERRANTE", "No todos los que llegaron aquí estaban muertos... Algunos simplemente atravesaron la puerta equivocada."],
  ["neonboy-alma-01", "NEONBOY", "¿Y vos? ¿Qué hacés acá?"],
  ["alma-02", "ALMA ERRANTE", "No lo recuerdo. Cada vez que intento pensar en mi pasado, escucho una frecuencia... y los recuerdos desaparecen."],
  ["neonboy-alma-02", "NEONBOY", "¿Una frecuencia? Eso ya me suena demasiado familiar."],
  ["alma-03", "ALMA ERRANTE", "Hay algo que está robando los recuerdos de quienes cruzan las dimensiones."],
  ["neonboy-alma-03", "NEONBOY", "Entonces la Anomalía también llegó hasta acá."],
  ["alma-04", "ALMA ERRANTE", "No, NeonBoy... Aquí estaba mucho antes."],
]);

register("alma-followup", { priority: 80, mode: "conversation", condition: "Alma already met" }, [
  ["alma-05", "ALMA ERRANTE", "Los muertos no son lo único que permanece atrapado. También quedan las cosas que nunca llegamos a decir."],
  ["neonboy-alma-04", "NEONBOY", "Eso fue bastante profundo... para alguien que es transparente."],
  ["alma-06", "ALMA ERRANTE", "Tené cuidado con el Testigo. Reconoce las mentiras, pero también teme ciertas verdades."],
]);

register("barquero-first", { priority: 80, mode: "conversation", condition: "first Ferryman encounter", completionEvent: "barquero-met" }, [
  ["barquero-01", "BARQUERO", "Llegás tarde, NeonBoy."],
  ["neonboy-barquero-01", "NEONBOY", "¿Nos conocemos?"],
  ["barquero-02", "BARQUERO", "Todavía no."],
  ["neonboy-barquero-02", "NEONBOY", "Genial... Otro que habla en acertijos."],
  ["barquero-03", "BARQUERO", "El río no transporta cuerpos, viajero. Transporta aquello que los cuerpos olvidaron."],
  ["neonboy-barquero-03", "NEONBOY", "¿Y adónde van todos esos recuerdos?"],
  ["barquero-04", "BARQUERO", "Al otro lado. Donde incluso los demonios temen mirar."],
  ["neonboy-barquero-04", "NEONBOY", "Bueno, suena como un destino turístico bastante recomendable."],
  ["barquero-05", "BARQUERO", "Vas a necesitar algo más que fuerza para cruzar este lugar."],
]);

register("barquero-hint", { priority: 80, mode: "conversation", condition: "Ferryman met", completionEvent: "barquero-hint-heard" }, [
  ["barquero-06", "BARQUERO", "Las piedras que ves no siempre existen. Y las que existen, no siempre pueden verse."],
  ["neonboy-barquero-05", "NEONBOY", "Visión de Frecuencia... Claro. Tendría que haberlo imaginado."],
  ["barquero-07", "BARQUERO", "Buscá el camino donde la lava parece no tocar la piedra."],
]);

register("barquero-after", { priority: 80, mode: "conversation", condition: "both sentinels defeated", completionEvent: "barquero-after-heard" }, [
  ["barquero-08", "BARQUERO", "Los guardianes han caído. Pero ellos solo custodiaban la entrada."],
  ["neonboy-barquero-06", "NEONBOY", "¿Qué hay detrás de esa puerta?"],
  ["barquero-09", "BARQUERO", "Un ser que ha visto demasiados finales... y recuerda cómo comenzaron."],
  ["neonboy-barquero-07", "NEONBOY", "Perfecto. Otro viejo con ganas de contarme su biografía."],
]);

register("sentinel-0", { priority: 20, mode: "auto", condition: "first sentinel detects NeonBoy" }, [
  ["centinela-01", "CENTINELA DEL ABISMO", "Ningún mortal atraviesa este puente."],
  ["neonboy-centinela-01", "NEONBOY", "Ya escuché eso antes... y sigo acá."],
]);
register("sentinel-1", { priority: 20, mode: "auto", condition: "second sentinel detects NeonBoy" }, [
  ["centinela-02", "CENTINELA DEL ABISMO", "Tu camino termina aquí."],
  ["neonboy-centinela-02", "NEONBOY", "¿No tienen otro discurso? Todos los demonios dicen lo mismo."],
]);
register("sentinel-extra", { priority: 20, mode: "auto", condition: "later sentinel encounter" }, [
  ["centinela-03", "CENTINELA DEL ABISMO", "El Abismo reclama tu alma."],
  ["neonboy-centinela-03", "NEONBOY", "Bueno, muchachos... Vamos a terminar con esto."],
]);

register("testigo-intro", { priority: 100, mode: "conversation", condition: "elite unlocked and approached", completionEvent: "testigo-intro-seen" }, [
  ["testigo-01", "TESTIGO DE LAS CENIZAS", "Las cenizas recuerdan tu nombre, NeonBoy."],
  ["neonboy-testigo-01", "NEONBOY", "Qué curioso... yo ni siquiera recuerdo haberte invitado."],
  ["testigo-02", "TESTIGO DE LAS CENIZAS", "Has atravesado mundos que nunca debieron estar conectados."],
  ["neonboy-testigo-02", "NEONBOY", "Y por lo visto, todavía me faltan unos cuantos."],
  ["testigo-03", "TESTIGO DE LAS CENIZAS", "La Anomalía no nació aquí. Aquí solamente aprendió a alimentarse."],
  ["neonboy-testigo-03", "NEONBOY", "Entonces sabés quién está detrás de todo esto."],
  ["testigo-04", "TESTIGO DE LAS CENIZAS", "Conozco su primera voz. Y también conozco la última."],
  ["neonboy-testigo-04", "NEONBOY", "¿Podés hablar como una persona normal por cinco segundos?"],
  ["testigo-05", "TESTIGO DE LAS CENIZAS", "Si deseás conocer la verdad... tendrás que sobrevivir."],
]);
register("testigo-half", { priority: 35, mode: "auto", condition: "elite health reaches two", completionEvent: null }, [
  ["testigo-combate-01", "TESTIGO DE LAS CENIZAS", "La señal te reconoce... Eso no debería ser posible."],
]);
register("testigo-defeat", { priority: 100, mode: "conversation", condition: "elite defeated", completionEvent: "testigo-defeat-line-seen" }, [
  ["testigo-derrota-01", "TESTIGO DE LAS CENIZAS", "No estás buscando el origen, NeonBoy... El origen te está buscando a vos."],
  ["neonboy-testigo-05", "NEONBOY", "Fantástico... Ahora resulta que tengo admiradores interdimensionales."],
]);

register("flames-awaken", { priority: 55, mode: "auto", condition: "six flames lit" }, [
  ["neonboy-puente-nuevo-01", "NEONBOY", "Genial... Encend\u00ed las luces y ahora parece que el puente quiere matarme."],
]);
register("bridge-trial-end", { priority: 55, mode: "auto", condition: "dangerous bridge crossed" }, [
  ["neonboy-puente-nuevo-02", "NEONBOY", "Sobreviv\u00ed al puente. Ahora tengo que encontrar al Barquero."],
]);
register("barquero-prueba", { priority: 85, mode: "conversation", condition: "bridge trial completed", completionEvent: "ferryman-start" }, [
  ["barquero-prueba-01", "BARQUERO", "Encendiste las llamas. Pero todav\u00eda no ganaste el derecho a cruzar."],
  ["neonboy-prueba-01", "NEONBOY", "\u00bfAhora tambi\u00e9n hay que sacar turno para cruzar el infierno?"],
  ["barquero-prueba-02", "BARQUERO", "Tres recuerdos fueron arrancados de este lugar. Recuperalos y el r\u00edo abrir\u00e1 su camino."],
  ["neonboy-prueba-02", "NEONBOY", "Perfecto... Una b\u00fasqueda del tesoro en un horno gigante."],
]);
register("barquero-memory-hint", { priority: 70, mode: "conversation", condition: "symbol hunt active" }, [
  ["barquero-prueba-03", "BARQUERO", "El primer recuerdo duerme en una inscripci\u00f3n; el segundo solo existe en otra frecuencia. El tercero espera al Orbe Ne\u00f3n."],
  ["barquero-prueba-04", "BARQUERO", "El ciclo nunca termina. Solo cambia de forma."],
]);
register("barquero-ready", { priority: 80, mode: "conversation", condition: "all three symbols recovered" }, [
  ["barquero-listo-01", "BARQUERO", "Los recuerdos han regresado. La traves\u00eda puede comenzar."],
  ["neonboy-listo-01", "NEONBOY", "Espero que esta cosa tenga seguro contra incendios."],
]);
register("ferry-ride", { priority: 50, mode: "auto", condition: "ferry boarded" }, [
  ["neonboy-barca-01", "NEONBOY", "Che, \u00bfy hace cu\u00e1nto trabaj\u00e1s de esto?"],
  ["barquero-barca-01", "BARQUERO", "Desde antes de que existiera el tiempo."],
  ["neonboy-barca-02", "NEONBOY", "\u00bfY vacaciones?"],
  ["barquero-barca-02", "BARQUERO", "No existen."],
  ["neonboy-barca-03", "NEONBOY", "Bueno... Ahora entiendo esa cara."],
]);
register("alma-mecanismo", { priority: 80, mode: "conversation", condition: "ritual mechanism encountered" }, [
  ["alma-mecanismo-01", "ALMA ERRANTE", "Primero recordamos qui\u00e9nes fuimos. Despu\u00e9s olvidamos. Y al final... algo vuelve a nacer."],
]);
register("ambush-start", { priority: 40, mode: "auto", condition: "three rings aligned" }, [
  ["neonboy-emboscada-01", "NEONBOY", "\u00a1Dale! \u00a1Ni en el infierno me dejan terminar un tr\u00e1mite tranquilo!"],
]);
register("testigo-shield", { priority: 60, mode: "auto", condition: "witness enters second phase" }, [
  ["testigo-escudo-01", "TESTIGO DE LAS CENIZAS", "La se\u00f1al te reconoce... Pero todav\u00eda no comprende lo que sos."],
  ["neonboy-escudo-01", "NEONBOY", "Yo tampoco, amigo. Pero tengo una guitarra y bastante mala paciencia."],
]);
const randomEntries = [
  ["neonboy-infierno-random-01", "NEONBOY", "Si salgo vivo de esta, voy a necesitar unas vacaciones."],
  ["neonboy-infierno-random-02", "NEONBOY", "Con este calor, hasta mi amplificador se derretiría."],
  ["neonboy-infierno-random-03", "NEONBOY", "Los demonios tienen el infierno... Yo tengo mi guitarra."],
  ["neonboy-infierno-random-04", "NEONBOY", "Me pregunto si acá conocen a Black Sabbath."],
  ["neonboy-infierno-random-05", "NEONBOY", "Entre robots, fantasmas y demonios... Creo que necesito cambiar de representante."],
];
for (const [id, speaker, text] of randomEntries)
  register(id, { priority: 5, mode: "auto", condition: "100–160 seconds of active exploration" }, [[id, speaker, text]]);

export const UNDERWORLD_CONVERSATION_NPCS = Object.freeze({
  alma: Object.freeze({ id: "underworld-alma", name: "Alma Errante", role: "Puente de las Almas", avatar: "AE" }),
  barquero: Object.freeze({ id: "underworld-barquero", name: "Barquero", role: "Guardián del río", avatar: "BR" }),
  testigo: Object.freeze({ id: "underworld-testigo", name: "Testigo de las Cenizas", role: "Acceso a la Catedral", avatar: "TC" }),
});

export const UNDERWORLD_DIALOGUES = Object.freeze(lines);
export const UNDERWORLD_SEQUENCES = Object.freeze(sequences);
export const UNDERWORLD_RANDOM_IDS = Object.freeze(randomEntries.map(([id]) => id));
export const UNDERWORLD_FUTURE_CREATURE_AUDIO = Object.freeze([
  "/audio/underworld/gargola-alerta.wav",
  "/audio/underworld/gargola-ataque.wav",
  "/audio/underworld/gargola-derrota.wav",
]);

export function underworldConversationFor(id, progress) {
  if (id === "alma") return progress?.ferryCompleted && !progress?.mechanismSolved ? "alma-mecanismo" : progress?.almaMet ? "alma-followup" : "alma-first";
  if (id === "barquero") {
    if (!progress?.barqueroMet) return "barquero-first";
    if (progress?.bridgeTrialComplete && !progress?.ferrymanTrialStarted) return "barquero-prueba";
    if (progress?.ferrymanTrialStarted && progress?.memorySymbols?.length === 3 && !progress?.ferryCompleted) return "barquero-ready";
    if (progress?.ferrymanTrialStarted && progress?.memorySymbols?.length < 3) return "barquero-memory-hint";
    if (progress?.enemies?.every((health) => health === 0) && !progress?.barqueroAfterSentinelsHeard)
      return "barquero-after";
    return "barquero-hint";
  }
  return null;
}

export function underworldSubtitleDuration(text) {
  return Math.max(2200, Math.min(6500, 1250 + String(text).length * 38));
}

export function chooseUnderworldRandom(previousId, random = Math.random) {
  const candidates = UNDERWORLD_RANDOM_IDS.filter((id) => id !== previousId);
  return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
}
