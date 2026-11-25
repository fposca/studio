import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Disc3, Play, Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import HalloweenStartScene from "./HalloweenStartScene.jsx";
import HalloweenFullscreenButton from "./HalloweenFullscreenButton.jsx";
import { getAnniversaryProgress } from "./halloweenSecretsLogic.js";
import "./halloweenStart.css";

const logo = new URL("./boot-logo.webp", import.meta.url).href;
const formatDate = (value) => new Intl.DateTimeFormat("es-AR", {
  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
}).format(value);

export default function HalloweenStartScreen({ slots, onLoad, onNew, onDelete, error }) {
  const [confirmSlot, setConfirmSlot] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmationRef = useRef(null);
  const confirmOpen = confirmSlot !== null || confirmDelete;
  const cancelConfirmation = () => { setConfirmSlot(null); setConfirmDelete(false); };
  useEffect(() => {
    const dialog = confirmationRef.current;
    if (confirmOpen && !dialog.open) dialog.showModal();
    else if (!confirmOpen && dialog.open) dialog.close();
  }, [confirmOpen]);
  const latest = slots.filter(Boolean).sort((a, b) => b.savedAt - a.savedAt)[0];
  const progress = latest?.progress;
  const summary = progress && getAnniversaryProgress({ demonHealth:progress.demonHealth, vhsCollected:progress.vhsCollected,
    discovered:new Set(progress.discoveredSecrets), songsPlayed:Math.min(3,progress.songs.length) });
  const newGame = () => {
    if (!latest) {
      onNew(0);
      return;
    }
    setConfirmSlot(latest.slot);
  };
  return <main className="halloween-start" aria-label="Inicio de NeonBoy Halloween">
    <div className="halloween-start-grain" aria-hidden="true" />
    <div className="halloween-start-content">
      <div className="halloween-start-masthead">
        <img src={logo} alt="NeonBoy" />
        <div className="halloween-start-masthead-actions"><span className="halloween-start-edition"><i /> HALLOWEEN <b>31 / 10</b></span><HalloweenFullscreenButton className="halloween-fullscreen-start" /></div>
      </div>
      <div className="halloween-start-hero">
        <div className="halloween-start-copy">
          <header className="halloween-start-header">
            <span className="halloween-start-eyebrow">MÚSICA. MISTERIO. OTRA REALIDAD.</span>
            <h1>LA TIENDA<br />DE LOS <em>DISCOS</em></h1>
            <p>La música te trajo hasta acá.<br /><strong>Lo que esconde esta tienda te hará quedarte.</strong></p>
          </header>
          <div className="halloween-start-actions">
            {latest && <button type="button" className="is-primary" onClick={() => onLoad(latest.slot)}><Play size={16} fill="currentColor" /> CONTINUAR <ArrowUpRight size={16} /></button>}
            <button type="button" className={latest ? "" : "is-primary"} onClick={newGame}><Plus size={17} /> NUEVA PARTIDA</button>
          </div>
          <a className="halloween-start-privacy-link" href="https://neonboy.com.ar/privacidad-neonboy-universe/"><ShieldCheck size={15} /> Política de privacidad <ArrowUpRight size={13} /></a>
          <div className="halloween-start-tags" aria-hidden="true"><span>EXPLORÁ</span><i /><span>ESCUCHÁ</span><i /><span>DESCUBRÍ</span></div>
        </div>
        <HalloweenStartScene />
      </div>
      <section className="halloween-start-save-summary" aria-label="Partida guardada">
        <Disc3 size={21} aria-hidden="true" />
        <div><strong>{latest ? "TU PARTIDA" : "TU PRIMERA NOCHE"}</strong><span>{latest ? (latest.progress.judgeDefeated ? "Juez del Abismo derrotado" : latest.progress.demonHealth === 0 ? "Misterio del espejo" : "La tienda te espera") : "Escuchá, explorá y descubrí."}</span></div>
        {latest && <div className="halloween-start-save-meta"><span>{formatDate(latest.savedAt)}</span><small>{summary.completed}/{summary.total} secretos &middot; {progress.phoneCalls}/4 llamadas</small></div>}
      </section>
      {error && <p className="halloween-start-error" role="alert">{error}</p>}
      <footer><span>Guardado local. El encuentro final se reinicia al cargar.</span><div className="halloween-start-footer-actions"><button type="button" className="halloween-start-delete" onClick={() => setConfirmDelete(true)} disabled={!latest}><Trash2 size={13} /> Borrar datos locales</button><strong>NEONBOY MUSIC <b>©</b> 2026</strong></div></footer>
      <dialog ref={confirmationRef} className="halloween-start-confirm-dialog" aria-labelledby="halloween-start-confirm-title" onCancel={cancelConfirmation} onClose={cancelConfirmation}>
        <div className="halloween-start-confirm-icon">{confirmDelete ? <Trash2 size={23} /> : <RotateCcw size={23} />}</div>
        <small>NEONBOY / TU HISTORIA</small>
        <h2 id="halloween-start-confirm-title">{confirmDelete ? "¿Borrar la partida?" : "¿Empezar una nueva noche?"}</h2>
        <p>{confirmDelete ? "Se borrará el progreso guardado en este dispositivo." : "La nueva partida reemplazará tu progreso actual. Si querés seguir donde estabas, elegí Cancelar y después Continuar."}</p>
        <div className="halloween-start-confirm-actions">
          <button type="button" autoFocus onClick={cancelConfirmation}>Cancelar</button>
          <button type="button" className="is-confirm" onClick={() => {
            if (confirmDelete) { if (onDelete(latest.slot)) cancelConfirmation(); }
            else { const slot = confirmSlot; cancelConfirmation(); onNew(slot); }
          }}>{confirmDelete ? "Sí, borrar datos" : "Empezar nueva partida"}<ArrowUpRight size={16} /></button>
        </div>
      </dialog>
    </div>
  </main>;
}
