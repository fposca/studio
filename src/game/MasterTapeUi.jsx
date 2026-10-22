import React, { useEffect, useRef } from "react";
import { masterTapeInventory, masterTapeObjective } from "./masterTapeQuest.js";

const SECTIONS = [
  ["Demos", "Bocetos y primeras versiones"],
  ["Solos", "Guitarras destacadas"],
  ["Detrás de escena", "Momentos del estudio"],
  ["Grabaciones especiales", "Sesiones fuera del catálogo"],
  ["Curiosidades de producción", "Historias de las mezclas"]
];

export function MasterTapeHud({ progress, scene }) {
  if (progress.phase === "new") return null;
  const inventory = masterTapeInventory(progress);
  return <aside className={"master-tape-hud master-tape-hud--" + scene} aria-label="Misión El máster perdido">
    <strong>EL MÁSTER PERDIDO</strong>
    <span>{masterTapeObjective(progress)}</span>
    {inventory.length > 0 && <small>INVENTARIO · {inventory.join(" · ")}</small>}
    <small>FICHAS DE ESTUDIO · {progress.studioTokens}</small>
  </aside>;
}

export function NeonSessionsArchive({ progress, onClose }) {
  const closeButton = useRef(null);
  useEffect(() => { closeButton.current?.focus(); }, []);
  return <div className="record-store-conversation-overlay neon-sessions-overlay">
    <section className="neon-sessions-archive" role="dialog" aria-modal="true" aria-label="Neon Sessions — Archivo de grabaciones">
      <header><small>LA TIENDA DE LOS DISCOS · ARCHIVO ESPECIAL</small><h3>NEON SESSIONS</h3><p>ARCHIVO DE GRABACIONES</p></header>
      <div className="neon-sessions-categories">
        {SECTIONS.map(([title, description]) => <article key={title}>
          <span aria-hidden="true">✦</span><div><strong>{title}</strong><small>{description}</small></div>
          <em>PENDIENTE</em>
        </article>)}
      </div>
      <p className="neon-sessions-pending">Archivo pendiente. Todavía no hay grabaciones adicionales cargadas. Tus discos y videoclips principales siguen disponibles en la tienda.</p>
      <footer><span>Fichas de estudio: {progress.studioTokens}</span><button ref={closeButton} type="button" onClick={onClose}>Cerrar Neon Sessions</button></footer>
    </section>
  </div>;
}
