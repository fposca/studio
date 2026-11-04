import { STORE_LAYOUT } from "../../src/game/recordStoreLayout.js";

/** @typedef {{id:string,text:string,category:'control'|'awakening'|'demonic',position:number[],rotation:number[],scale:number[],visibility:'matrix'|'near-demon'|'after-defeat',targetObjectId?:string,doubleFace?:boolean,location:string}} MatrixMessage */
const left = -STORE_LAYOUT.sideWallX + .195;
const right = STORE_LAYOUT.sideWallX - .195;
const back = STORE_LAYOUT.backWallZ + .195;
const front = STORE_LAYOUT.frontWallZ - .09;
const message = (id, text, category, position, scale, location, options = {}) => Object.freeze({
  id, text, category, position, scale, location, rotation: [0, 0, 0], visibility: "matrix", ...options,
});
// Positions are on the inner wall faces, above the album frames, or relative
// to named signs. Nothing is placed in an aisle or over an album cover.
export const MATRIX_MESSAGES = Object.freeze([
  message("entry", "NO DEBISTE ENTRAR", "demonic", [0, 3.75, front], [3.7, .55], "Entrada, sobre la puerta", { rotation: [0, Math.PI, 0] }),
  message("logo", "DESPERTÁ", "awakening", [6.65, 3.85, back], [2.7, .56], "A la derecha de NEONBOY MUSIC"),
  message("jukebox", "ELEGÍ TU DESTINO", "awakening", [0, 2.72, .675], [1.54, .17], "Franja sobre la pantalla de la rockola", { targetObjectId: "Rockola · gabinete de nogal y cromo" }),
  message("new-records", "CONSUMÍ", "control", [0, 0, .018], [2.35, .29], "Frente de NUEVOS DISCOS, estantería derecha de la entrada", { targetObjectId: "venue-sign:NUEVOS DISCOS" }),
  message("promotions", "SOS EL PRODUCTO", "control", [0, 0, .018], [2.35, .29], "Frente de EDICIONES / 90s, estantería izquierda de la entrada", { targetObjectId: "venue-sign:EDICIONES / 90s" }),
  message("rulo", "NO PIENSES", "control", [0, 0, .018], [2.35, .29], "SINGLES / NOVEDADES, junto al sector de Rulo", { targetObjectId: "venue-sign:SINGLES / NOVEDADES" }),
  message("advertising", "OBEDECÉ", "control", [0, 0, .096], [2.99, .56], "Cartel colgante INSTRUMENTALES, ambas caras", { targetObjectId: "hanging-neon-sign:INSTRUMENTALES", doubleFace: true }),
  message("tv-wall", "ABRÍ LOS OJOS", "awakening", [left, 3.74, -2.8], [3.0, .55], "Pared sobre el puesto del televisor", { rotation: [0, Math.PI / 2, 0] }),
  message("mirror", "NO CONFÍES EN TUS OJOS", "demonic", [right, 3.74, 8.55], [3.05, .62], "Pared sobre el Espejo de las Almas", { rotation: [0, -Math.PI / 2, 0] }),
  message("phone", "ELLOS ESCUCHAN", "demonic", [-7.5, 3.7, front], [3.25, .58], "Vidriera junto al mostrador y el teléfono", { rotation: [0, Math.PI, 0] }),
  message("vhs", "LA VERDAD FUE GRABADA", "awakening", [0, .17, .018], [5.6, .36], "Franja 31 OCT del fondo, detrás de la cinta VHS", { targetObjectId: "venue-sign:31 OCT · NOCHE DE DISCOS" }),
  message("archive", "EL CÓDIGO NO PUEDE\nBORRARTE", "awakening", [left, 3.74, -11.6], [3.1, .72], "Pared izquierda del fondo, zona del archivo y el vinilo", { rotation: [0, Math.PI / 2, 0] }),
  message("mask", "LA MÁSCARA MIENTE", "demonic", [right, 3.74, -11.6], [2.75, .58], "Pared del fondo a la derecha, junto al recorrido del reguetonero", { rotation: [0, -Math.PI / 2, 0] }),
  message("demon", "NO ES HUMANO", "demonic", [0, 2.55, 0], [1.85, .38], "Sobre el semidemonio al acercarse", { targetObjectId: "demon", visibility: "near-demon" }),
  message("freedom", "ELLOS CONTROLAN LA FRECUENCIA.\nVOS CONTROLÁS LA MÚSICA.", "awakening", [right, 3.82, -2.8], [4.7, .88], "Sobre el puesto de escucha derecho, tras derrotar al demonio", { rotation: [0, -Math.PI / 2, 0], visibility: "after-defeat" }),
]);

export const REQUIRED_MATRIX_MESSAGES = 2;
const discoveryIds = new Set(MATRIX_MESSAGES.filter(item => item.visibility !== "after-defeat").map(item => `matrix-message:${item.id}`));
export const countMatrixDiscoveries = (discovered) => Math.min(REQUIRED_MATRIX_MESSAGES,
  [...discovered].filter(id => discoveryIds.has(id)).length);
