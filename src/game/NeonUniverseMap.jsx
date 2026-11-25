import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole, MapPinned, Sparkles, X } from "lucide-react";
import mapImage from "../assets/neonboy-animaciones/imagenes/Mapa nocturno de ciudad musical neón.png";
import { NEON_UNIVERSE_SCENARIOS, NEON_UNIVERSE_STATUS, getScenarioStatus } from "./neonUniverseScenarios.js";
import "./neonUniverseMap.css";

const ROUTE_GROUPS = [
  { title: "DIMENSIONES PERDIDAS", destinations: [
    { id: "lost-ship", label: "PUERTA 01 · LA NAVE PERDIDA" },
    { id: "parthenon", label: "PUERTA 02 · EL PARTENÓN MALDITO" },
    { id: "matrix", label: "PUERTA 03 · LA REALIDAD FRACTURADA" },
  ] },
  { title: "INFRAMUNDO", destinations: [
    { id: "underworld", label: "CAPÍTULO 11 · PUENTE DE LAS ALMAS" },
    { id: "cathedral", label: "CAPÍTULO 12 · LA CATEDRAL DE LOS CONDENADOS" },
    { id: "abyss-throne", label: "CAPÍTULO 13 · EL TRONO DEL ABISMO" },
  ] },
  { title: "FUTURO", destinations: [
    { id: "buenos-aires-2049", label: "CAP\u00cdTULO 14 \u00b7 BUENOS AIRES 2049" },
  ] },
  { title: "REGRESO A 1999", destinations: [
    { id: "chapter15-studio", label: "CAPÍTULO 15 · EL ESTUDIO ALTERADO" },
    { id: "chapter15-store", label: "CAPÍTULO 15 · LA DISQUERÍA ALTERADA" },
  ] },
];

export default function NeonUniverseMap({ onClose, onEnter, unlockedScenarios = [] }) {
  const [selectedId, setSelectedId] = useState("record-store");
  const closeButtonRef = useRef(null);
  const selected = NEON_UNIVERSE_SCENARIOS.find((scenario) => scenario.id === selectedId);
  const selectedStatus = getScenarioStatus(selected, unlockedScenarios);

  useEffect(() => { closeButtonRef.current?.focus(); }, []);

  return <div className="universe-map-backdrop">
    <section className="universe-map" role="dialog" aria-modal="true" aria-label="Mapa de NeonBoy Universe">
      <header className="universe-map-header">
        <div>
          <span className="universe-map-eyebrow"><MapPinned size={16} /> EXPLORÁ LA CIUDAD</span>
          <h2>NEONBOY <em>UNIVERSE</em></h2>
          <p>Elegí un edificio para descubrir qué hay detrás de sus puertas.</p>
        </div>
        <button ref={closeButtonRef} type="button" className="universe-map-close" onClick={onClose} aria-label="Cerrar mapa"><X size={21} /></button>
      </header>

      <div className="universe-map-body">
        <div className="universe-map-image-wrap">
          <div className="universe-map-image" aria-label="Edificios de NeonBoy Universe">
            <img src={mapImage} alt="Ciudad nocturna de NeonBoy Universe: tienda de discos, estudio, club, arcade, azotea y portal rojo" draggable="false" />
            {NEON_UNIVERSE_SCENARIOS.filter((scenario) => scenario.position).map((scenario) => <button
              key={scenario.id}
              type="button"
              className={`universe-map-marker is-${getScenarioStatus(scenario, unlockedScenarios)}${selectedId === scenario.id ? " is-selected" : ""}`}
              style={{ left: `${scenario.position.x}%`, top: `${scenario.position.y}%` }}
              aria-label={`Seleccionar ${scenario.name}`}
              aria-pressed={selectedId === scenario.id}
              onClick={() => setSelectedId(scenario.id)}
            ><span className="universe-map-marker-core" /><span className="universe-map-marker-label">{scenario.name}</span></button>)}
          </div>
          <p className="universe-map-image-note"><Sparkles size={13} /> Seleccioná los puntos luminosos para explorar cada lugar.</p>
        </div>

        <aside className="universe-map-detail" aria-live="polite">
          <span className="universe-map-detail-kicker">DESTINO SELECCIONADO</span>
          <span className={`universe-map-status is-${selectedStatus}`}>{(selectedStatus === "available" || selectedStatus === "identified") ? <Sparkles size={14} /> : <LockKeyhole size={14} />}{NEON_UNIVERSE_STATUS[selectedStatus]}</span>
          <h3>{selected.name}</h3>
          <p>{selected.description}</p>
          {selected.id === "cathedral" && selectedStatus === "available" && <div className="chapter10-map-note" role="status"><strong>CAPÍTULO 12 DISPONIBLE</strong>LA CATEDRAL DE LOS CONDENADOS<br />TRAS LA PUERTA ROJA DEL PUENTE</div>}
          {selected.id === "underworld" && selectedStatus === "available" && <div className="chapter10-map-note" role="status"><strong>CAPÍTULO 11 DISPONIBLE</strong>PUENTE DE LAS ALMAS<br />LA CIUDADELA AGUARDA DEL OTRO LADO</div>}
          <nav className="universe-map-routes" aria-label="Recorrido de escenarios">
            {ROUTE_GROUPS.map((group) => <div className="universe-map-route-group" key={group.title}>
              <span>{group.title}</span>
              <div>{group.destinations.map((route) => {
                const scenario = NEON_UNIVERSE_SCENARIOS.find((item) => item.id === route.id);
                const status = getScenarioStatus(scenario, unlockedScenarios);
                return <button type="button" key={route.id}
                  className={"universe-map-route-link is-" + status + (selectedId === route.id ? " is-selected" : "")}
                  aria-pressed={selectedId === route.id} onClick={() => setSelectedId(route.id)}>
                  <span>{route.label}</span>
                  {status === "available" ? <ArrowRight size={13} aria-hidden="true" /> : <LockKeyhole size={12} aria-hidden="true" />}
                </button>;
              })}</div>
            </div>)}
          </nav>
          <div className="universe-map-detail-bottom">
            {selectedStatus === "available" && selected.destination
              ? <button type="button" className="universe-map-enter" onClick={() => onEnter(selected.destination)}>Entrar a {selected.id === "record-store" ? "la " : ""}{selected.name} <ArrowRight size={17} /></button>
              : <span className="universe-map-unavailable">{selectedStatus === "secret" ? "El portal permanece oculto por ahora." : "Este escenario estará disponible próximamente."}</span>}
            <small>M PARA ABRIR/CERRAR · ESC PARA VOLVER</small>
          </div>
        </aside>
      </div>
    </section>
  </div>;
}
