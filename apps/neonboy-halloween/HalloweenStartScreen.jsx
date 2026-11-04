import React, { useState } from "react";
import { Disc3, Play, Plus, RotateCcw } from "lucide-react";
import { getAnniversaryProgress } from "./halloweenSecretsLogic.js";
import { HALLOWEEN_SAVE_SLOTS } from "./halloweenSaves.js";

const logo = new URL("./boot-logo.webp", import.meta.url).href;
const formatDate = (value) => new Intl.DateTimeFormat("es-AR", {
  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
}).format(value);

export default function HalloweenStartScreen({ slots, onLoad, onNew, error }) {
  const [confirmSlot, setConfirmSlot] = useState(null);
  const latest = slots.filter(Boolean).sort((a, b) => b.savedAt - a.savedAt)[0];
  const firstEmpty = slots.findIndex((entry) => !entry);
  const newGame = () => {
    if (firstEmpty >= 0) onNew(firstEmpty);
    else { setConfirmSlot(latest?.slot ?? 0); document.getElementById("halloween-save-slots")?.scrollIntoView({ behavior: "smooth" }); }
  };
  return <main className="halloween-start" aria-label="Inicio de NeonBoy Halloween">
    <div className="halloween-start-glow" aria-hidden="true" />
    <div className="halloween-start-content">
      <header className="halloween-start-header">
        <img src={logo} alt="NeonBoy" />
        <span>MUSIC / HALLOWEEN</span>
        <h1>LA TIENDA DE LOS DISCOS</h1>
        <p>Una noche para escuchar, explorar y descubrir lo que esconden los vinilos.</p>
      </header>
      <div className="halloween-start-actions">
        <button type="button" className="is-primary" disabled={!latest} onClick={() => onLoad(latest.slot)}><Play size={18} /> CONTINUAR</button>
        <button type="button" onClick={newGame}><Plus size={18} /> NUEVA PARTIDA</button>
      </div>
      <section className="halloween-start-slots" id="halloween-save-slots" aria-label="Partidas guardadas">
        {Array.from({ length: HALLOWEEN_SAVE_SLOTS }, (_, slot) => {
          const record = slots[slot];
          const progress = record?.progress;
          const summary = progress && getAnniversaryProgress({
            demonHealth: progress.demonHealth, vhsCollected: progress.vhsCollected,
            discovered: new Set(progress.discoveredSecrets), songsPlayed: Math.min(3, progress.songs.length),
          });
          return <article className="halloween-start-slot" key={slot}>
            <div className="halloween-start-slot-heading"><Disc3 size={20} /><strong>PARTIDA {String(slot + 1).padStart(2, "0")}</strong><small>{record ? formatDate(record.savedAt) : "VACÍA"}</small></div>
            {record ? <>
              <p>{progress.judgeDefeated ? "Belfegor derrotado" : progress.demonHealth === 0 ? "Misterio del espejo" : "La tienda te espera"}</p>
              <div className="halloween-start-progress"><span style={{ width: `${summary.completed / summary.total * 100}%` }} /></div>
              <small>{summary.completed}/{summary.total} secretos · {progress.phoneCalls}/4 llamadas</small>
              <div className="halloween-start-slot-actions">
                <button type="button" onClick={() => onLoad(slot)}>CARGAR</button>
                <button type="button" className="is-subtle" onClick={() => setConfirmSlot(slot)}>REINICIAR</button>
              </div>
            </> : <>
              <p>Empezá desde la entrada de la tienda.</p>
              <div className="halloween-start-slot-actions"><button type="button" onClick={() => onNew(slot)}>EMPEZAR</button></div>
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
      <footer>Las partidas se guardan en este dispositivo. El combate del jefe se reinicia al cargar.</footer>
    </div>
  </main>;
}
