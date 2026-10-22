import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole, MapPinned, Sparkles, X } from "lucide-react";
import mapImage from "../assets/neonboy-animaciones/imagenes/Mapa nocturno de ciudad musical neón.png";
import { NEON_UNIVERSE_SCENARIOS, NEON_UNIVERSE_STATUS, getScenarioStatus } from "./neonUniverseScenarios.js";
import "./neonUniverseMap.css";

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
            {NEON_UNIVERSE_SCENARIOS.map((scenario) => <button
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
          <span className={`universe-map-status is-${selectedStatus}`}>{selectedStatus === "available" ? <Sparkles size={14} /> : <LockKeyhole size={14} />}{NEON_UNIVERSE_STATUS[selectedStatus]}</span>
          <h3>{selected.name}</h3>
          <p>{selected.description}</p>
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
