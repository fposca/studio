import React from "react";
import { CHAPTER15_DIALOGUES } from "./chapter15Dialogues.js";
import { CHAPTER15_EVIDENCE, CHAPTER15_SUSPECTS, chapter15Objective } from "./chapter15Quest.js";

export function Chapter15Mission({ progress }) {
  return <section className="chapter15-mission" aria-label="Objetivo del capítulo 15">
    <small>NEONBOY UNIVERSE / CAPÍTULO 15</small>
    <strong>EL ORIGEN DE LA SEÑAL</strong>
    <p>{chapter15Objective(progress)}</p>
    <span>{progress.evidence.length}/3 EVIDENCIAS · {progress.talked.length}/3 CONVERSACIONES</span>
  </section>;
}

export function Chapter15Dialogue({ panel, onNext, onClose }) {
  if (!panel) return null;
  const lines = CHAPTER15_DIALOGUES[panel.kind];
  if (!lines) return null;
  const entry = lines[Math.min(panel.index, lines.length - 1)];
  return <div className={"chapter15-dialogue" + (panel.kind === "arrival" ? " is-arrival" : panel.kind === "storeArrival" ? " is-temporal-arrival" : "")} role="dialog" aria-modal="true" aria-label={panel.kind === "arrival" ? "Llegada a 1999" : panel.kind === "storeArrival" ? "Regreso a la disquería" : `Conversación con ${panel.kind}`}>
    <small>{panel.kind === "arrival" ? "CAPÍTULO 15 · EL ORIGEN DE LA SEÑAL · BUENOS AIRES — 1999" : panel.kind === "storeArrival" ? "1999 / ANTES DE LA DESTRUCCIÓN" : `REGISTRO DE INVESTIGACIÓN / ${entry.audioId}`}</small>
    <strong>{entry.speaker}</strong><p>{entry.text}</p>
    <div className="chapter15-dialogue-actions"><span>{panel.index + 1} / {lines.length}</span><button type="button" onClick={onNext}>{panel.index === lines.length - 1 ? "Continuar" : "Siguiente"}</button><button type="button" onClick={onClose} aria-label="Cerrar diálogo">Cerrar</button></div>
  </div>;
}

export function Chapter15Console({ progress, onAction, onClose }) {
  const ready = progress.consoleExamined && progress.noteRead && progress.hiddenChannelSeen && progress.visionActive;
  return <div className="chapter15-panel-backdrop"><section className="chapter15-console" role="dialog" aria-modal="true" aria-label="Consola del cuarto canal">
    <header><small>NEON RECORDING STUDIO / CINTA 1999</small><button type="button" onClick={onClose}>Cerrar</button></header>
    <h2>EL CUARTO CANAL</h2>
    <p>GUITARRA · BAJO · BATERÍA · <em>{progress.hiddenChannelSeen ? "CANAL DESCONOCIDO" : "????????"}</em></p>
    <div className="chapter15-console-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
    {progress.noteRead ? <blockquote>“Lo que se escucha no siempre es lo que se grabó. Para aislar la señal, primero apagá el ruido, después recuperá el pulso y finalmente abrí el canal oculto.”</blockquote> : <blockquote>La nota de Hugo todav&iacute;a no fue examinada.</blockquote>}
    <p className="chapter15-console-hint">{!progress.noteRead ? "Encontrá la nota técnica de Hugo junto a la consola." : !progress.visionActive ? "Activá Visión de Frecuencia con C o el botón de la escena." : !progress.hiddenChannelSeen ? "Examiná el canal desconocido visible en la consola." : progress.channelIsolated ? "ARCHIVO NO IDENTIFICADO · FECHA ORIGINAL: INCOMPATIBLE · REFERENCIA: DISQUERÍA — 1999" : "Ajustá los controles según la nota. Un error reinicia la mezcla."}</p>
    <div className="chapter15-console-sequence">{["SILENCIO", "PULSO", "CANAL OCULTO"].map((label, index) => <span key={label} className={progress.mixSequence.length > index ? "is-done" : ""}>{label}</span>)}</div>
    <div className="chapter15-console-controls">
      <button type="button" disabled={!ready || progress.channelIsolated} onClick={() => onAction("mix:silence")}>Apagar ruido</button>
      <button type="button" disabled={!ready || progress.channelIsolated} onClick={() => onAction("mix:pulse")}>Recuperar pulso</button>
      <button type="button" disabled={!ready || progress.channelIsolated} onClick={() => onAction("mix:hidden")}>Abrir canal oculto</button>
    </div>
    {progress.channelIsolated && <button className="chapter15-console-finish" type="button" onClick={onClose}>Buscar la cinta alterada</button>}
  </section></div>;
}

export function Chapter15Diary({ progress, onCompare, onClose }) {
  const ready = progress.evidence.length === 3 && progress.talked.length === 3;
  return <div className="chapter15-panel-backdrop"><section className="chapter15-diary" role="dialog" aria-modal="true" aria-label="Diario del capítulo 15">
    <header><small>DIARIO / EL ORIGEN DE LA SEÑAL</small><button type="button" onClick={onClose}>Cerrar</button></header>
    <h2>RASTROS DE 1999</h2>
    {progress.storeArrivalSeen && <p>El salto desde 2049 nos trajo a un momento de 1999 anterior a la destrucción de la disquería. La tienda sigue intacta; con Visión de Frecuencia aparecen ecos de aquel futuro.</p>}
    <p>El registro recuperado en 2049 se parece a una frecuencia escondida en una grabación del estudio.</p>
    <ul>{CHAPTER15_SUSPECTS.map(id => <li key={id}><strong>{CHAPTER15_EVIDENCE[id].name}</strong><span>{progress.evidence.includes(id) ? CHAPTER15_EVIDENCE[id].clue : "Pendiente de examinar"}</span><small>{progress.talked.includes(id) ? "TESTIMONIO REGISTRADO" : "HABLAR CON " + id.toUpperCase()}</small></li>)}</ul>
    {ready && !progress.compared && <button className="chapter15-console-finish" type="button" onClick={onCompare}>Comparar con el registro de 2049</button>}
    {progress.compared && <p className="chapter15-comparison">Coincidencia detectada. La confrontación está disponible para la siguiente etapa de la historia.</p>}
  </section></div>;
}
