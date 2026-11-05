import React, { useState } from "react";
import { ArrowUpRight, Disc3, HardDrive, Play, Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import HalloweenStartScene from "./HalloweenStartScene.jsx";
import { getAnniversaryProgress } from "./halloweenSecretsLogic.js";
import { HALLOWEEN_SAVE_SLOTS } from "./halloweenSaves.js";
import "./halloweenStart.css";

const logo = new URL("./boot-logo.webp", import.meta.url).href;
const formatDate = (value) => new Intl.DateTimeFormat("es-AR", {
  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
}).format(value);

export default function HalloweenStartScreen({ slots, onLoad, onNew, onDelete, error }) {
  const [confirmSlot, setConfirmSlot] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const latest = slots.filter(Boolean).sort((a, b) => b.savedAt - a.savedAt)[0];
  const newGame = () => {
    if (!latest) {
      onNew(0);
      return;
    }
    setConfirmSlot(0);
    document.getElementById("halloween-save-slots")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  return <main className="halloween-start" aria-label="Inicio de NeonBoy Halloween">
    <div className="halloween-start-grain" aria-hidden="true" />
    <div className="halloween-start-content">
      <div className="halloween-start-masthead">
        <img src={logo} alt="NeonBoy" />
        <span className="halloween-start-edition"><i /> HALLOWEEN <b>31 / 10</b></span>
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
      <div className="halloween-start-archive-heading"><span>TU HISTORIA <b>/</b> PARTIDA ACTUAL</span><small><HardDrive size={12} /> EN ESTE DISPOSITIVO</small></div>
      <section className="halloween-start-slots" id="halloween-save-slots" aria-label="Partida guardada">
        {Array.from({ length: HALLOWEEN_SAVE_SLOTS }, (_, slot) => {
          const record = slots[slot];
          const progress = record?.progress;
          const summary = progress && getAnniversaryProgress({
            demonHealth: progress.demonHealth, vhsCollected: progress.vhsCollected,
            discovered: new Set(progress.discoveredSecrets), songsPlayed: Math.min(3, progress.songs.length),
          });
          return <article className={"halloween-start-slot" + (record ? " is-saved" : " is-empty") + (latest?.slot === slot ? " is-latest" : "")} key={slot}>
            <div className="halloween-start-slot-heading"><Disc3 size={19} /><strong>PARTIDA ACTUAL</strong><small>{record ? formatDate(record.savedAt) : "LIBRE"}</small></div>
            {record ? <>
              <p>{progress.judgeDefeated ? "Juez del Abismo derrotado" : progress.demonHealth === 0 ? "Misterio del espejo" : "La tienda te espera"}</p>
              <div className="halloween-start-progress" role="progressbar" aria-label="Secretos descubiertos" aria-valuemin={0} aria-valuemax={summary.total} aria-valuenow={summary.completed}><span style={{ width: summary.completed / summary.total * 100 + "%" }} /></div>
              <small>{summary.completed}/{summary.total} secretos <b>·</b> {progress.phoneCalls}/4 llamadas</small>
              <div className="halloween-start-slot-actions">
                <button type="button" aria-label="Cargar partida" onClick={() => onLoad(slot)}>CARGAR <ArrowUpRight size={13} /></button>
                <button type="button" className="is-subtle" aria-label="Reiniciar partida" onClick={() => setConfirmSlot(slot)}><RotateCcw size={12} /> REINICIAR</button>
              </div>
            </> : <>
              <p>Una nueva noche.<br /><span>Todos los secretos por descubrir.</span></p>
              <div className="halloween-start-slot-actions"><button type="button" aria-label="Empezar partida" onClick={() => onNew(slot)}><Plus size={14} /> EMPEZAR</button></div>
            </>}
            {confirmSlot === slot && <div className="halloween-start-confirm">
              <span>Se reemplazará esta partida guardada.</span>
              <button type="button" onClick={() => { setConfirmSlot(null); onNew(slot); }}>SÍ, EMPEZAR DE NUEVO</button>
              <button type="button" onClick={() => setConfirmSlot(null)}>CANCELAR</button>
            </div>}
          </article>;
        })}
      </section>
      {error && <p className="halloween-start-error" role="alert">{error}</p>}
      <footer><span>Guardado local. El encuentro final se reinicia al cargar.</span><div className="halloween-start-footer-actions"><button type="button" className="halloween-start-delete" onClick={() => setConfirmDelete(true)} disabled={!latest}><Trash2 size={13} /> Borrar datos locales</button><strong>NEONBOY MUSIC <b>©</b> 2026</strong></div></footer>
      {confirmDelete && <div className="halloween-start-delete-confirm" role="group" aria-label="Confirmar borrado de datos locales"><span>Se borrará la partida guardada en este dispositivo. Esta acción no se puede deshacer.</span><div><button type="button" onClick={() => { if (onDelete(0)) { setConfirmDelete(false); setConfirmSlot(null); } }}>SÍ, BORRAR DATOS</button><button type="button" onClick={() => setConfirmDelete(false)}>CANCELAR</button></div></div>}
    </div>
  </main>;
}
