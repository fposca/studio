// Vite serves these user-provided recordings as assets, including filenames with accents.
const voiceAssets = import.meta.glob("../assets/neonboy-animaciones/voces/*/*.mp3", {
  eager: true,
  query: "?url",
  import: "default"
});

const voiceByName = Object.fromEntries(Object.entries(voiceAssets).map(([path, url]) => [
  path.split("/").at(-1).toLocaleLowerCase(), url
]));

const VOICE_PREFIX = {
  freddy: { greeting: "fredy-laugh", root: "fredy-laugh" },
  jason: { sound: "jason" },
  "skeleton-holy": { greeting: "esqueleto-neonboy", root: "esqueleto-neonboy" },
  "skeleton-unholy": { greeting: "esqueleto-neonboy", root: "esqueleto-neonboy" },
  tito: {
    root: "tito-bien,-pibe.",
    "reply:tito:owner": "tito-soy-el-dueño",
    "reply:tito:discs": "tito-tengo toda la coleccion",
    "reply:tito:time": "tito-pibe este local vende musica",
    "reply:tito:heavy": "tito-holy fire la ultima vez que lo puse",
    "reply:tito:discount": "tito-claro, te cobro el doble",
    "reply:tito:door": "tito-el deposito de discos prohibidos",
    "reply:tito:metalhead": "tito-hace 8 horas esta escuchando",
    "reply:tito:coin": "tito-yo no toco las monedas del suelo"
  },
  roxy: {
    "reply:roxy:visits": "roxy-sí.-hasta-que-llegaste-vos",
    "reply:roxy:records": "roxy-felicitaciones.",
    "reply:roxy:solo": "roxyprefiero-escuchar-cómo-te-alejás."
  },
  rulo: {
    root: "rulo-bien pibe que mas queres",
    more: "ruo-elegi bien no todas las preguntas",
    "reply:rulo:music": "rulo-heavy metal trash",
    "reply:rulo:neonboy": "rulo-escuche algunos solos",
    "reply:rulo:mask": "rulo-parece-que-darth-vader",
    "reply:rulo:year": "rulo-y-no-pienso-discutirlo",
    "reply:rulo:identity": "rulo-y-yo-soy-el-guitarrista",
    "reply:rulo:coin": "rulo-vi-una-moneda-debajo",
    "reply:rulo:modern": "rulo-en-mis-tiempos",
    "modernReply:0": "rulo-es-un-solo-muy-complicado",
    "modernReply:1": "rulo-puede-ser",
    "modernReply:2": "rulo-no-confundas",
    mystery: "rulo-ese disco es una leyenda",
    "duel:0": "rulo-con esa mascara seguro no ves",
    "duel:1": "rulo-tu guitarra suena como una licuadora",
    "duelSuccess:0": "rulo-ja esa estuvo buna",
    "duelFailure:0": "rulo-flojo pibe",
    "duelFailure:1": "rulo-una espuesta tan debil"
  }
};

export function getStoreVoiceUrl(npcId, node) {
  if (!node) return null;
  let prefix = VOICE_PREFIX[npcId]?.[node.id];
  if (node.id === "greeting" && npcId === "tito" && node.text.startsWith("¿Otra vez vos?")) {
    prefix = "tito-otra vez vos";
  }
  if (node.id === "greeting" && npcId === "rulo" && node.text.startsWith("¡Eh, vos!")) {
    prefix = "rulo-eh vos, que haces vestido asi";
  }
  if (npcId === "roxy" && (node.id === "greeting" || node.id === "root") && node.text?.startsWith("¿Otra vez vos?")) {
    prefix = "roxy¿otra-vez-vos";
  }
  if (npcId === "rulo" && node.id === "greeting" && node.text?.includes("Justo estaba por decir algo inteligente.")) {
    prefix = "rulo-volvi\u00f3-el-de-la-m\u00e1scara";
  }
  if (!prefix) return null;
  const match = Object.entries(voiceByName).find(([name]) => name.startsWith(prefix));
  return match?.[1] ?? null;
}
