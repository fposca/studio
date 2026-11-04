import React from "react";
import { storeInvasionHint, storeInvasionObjective } from "./storeInvasionQuest.js";

const topics = [
  ["jukebox", "Rockola"], ["archive", "Archivo de discos"],
  ["transmission", "Transmisión oculta"], ["combat", "Entidades"],
];
const symbols = ["onda", "surco", "silencio"];
export default function StoreInvasionPanel({ mode, progress:p, onAction, onClose }) {
  if (!mode) return null;
  const title = { jukebox:"Rockola intervenida", archive:"Panel de conductores", inscription:"Inscripción de la señal", reflector:"Reflector de frecuencia", core:"Núcleo del Archivista", diary:"Diario / La señal del Archivista" }[mode];
  return <div className="store-invasion-panel-backdrop" onMouseDown={onClose}>
    <section className="store-invasion-panel" role="dialog" aria-modal="true" aria-label={title} onMouseDown={event=>event.stopPropagation()}>
      <small>CAPÍTULO 9 / BUENOS AIRES</small><button className="store-invasion-close" onClick={onClose} aria-label="Cerrar">×</button><h2>{title}</h2>
      {mode==="jukebox"&&<>
        <p>La música sigue disponible desde la rockola. Esta consola aísla la señal ajena sin gastar monedas.</p>
        <p>Portadas originales investigadas: {p.jukeboxClues.filter(Boolean).length}/3. {p.visionActive?"Visión de Frecuencia activa.":"Activá C para revelar los glifos."}</p>
        <div className="store-invasion-sequence">{[0,1,2].map(i=><span key={i}>{p.jukeboxInput[i]?.toUpperCase()||"?"}</span>)}</div>
        <div className="store-invasion-actions">{symbols.map(symbol=><button key={symbol} type="button" disabled={p.jukeboxOff||p.jukeboxArmed||!p.visionActive||!p.jukeboxClues.every(Boolean)} onClick={()=>onAction("juke-input",symbol)}>{symbol.toUpperCase()}</button>)}</div>
        <p className="store-invasion-status">{p.jukeboxOff?"FOCO 01 DESACTIVADO":p.jukeboxArmed?"Secuencia correcta. Cerrá el panel y dispará al núcleo fucsia de la rockola.":"Los números I, II y III en los carteles indican un orden."}</p>
      </>}
      {mode==="archive"&&<><p>La caja del expositor bloquea los circuitos. Sujetala con E, movela con W/S y soltala con E. El panel solo se revela con C.</p><p>Conductores restaurados: {p.conductors.length}/3. Segú la flecha de la pared: 1 → 2 → 3.</p><p className="store-invasion-status">{p.archiveOff?"FOCO 02 DESACTIVADO":p.crateSlot===2&&p.visionActive?"Cerrá el panel y apuntá el orbe a los conductores visibles.":"Desplazá la caja hasta la segunda marca y activá C."}</p><button type="button" disabled={p.archiveOff} onClick={()=>onAction("crate-reset")}>Reiniciar posición de la caja</button></>}
      {mode==="inscription"&&<><p>La señal sube por tres estratos. La escritura del muro marca el recorrido:</p><div className="store-invasion-sequence"><span>1. SUELO</span><span>2. VIDRIO</span><span>3. CIELO</span></div><p>El emisor del cielo está protegido. Mové el reflector y hacé rebotar el orbe. C revela los blancos.</p><p className="store-invasion-status">{p.transmissionOff?"FOCO 03 DESACTIVADO":`Emisores restaurados: ${p.emitters.length}/3`}</p></>}
      {mode==="reflector"&&<><p>Un módulo móvil desvía el Orbe Neon hacia el emisor alto. El reflejo solo funciona desde la segunda marca.</p><div className="store-invasion-actions"><button type="button" disabled={p.reflectorSlot===0} onClick={()=>onAction("reflector-set",0)}>Marca I</button><button type="button" disabled={p.reflectorSlot===1} onClick={()=>onAction("reflector-set",1)}>Marca II</button></div></>}
      {mode==="core"&&<><p>La tienda es apenas un nodo. El holograma detecta otras dos interferencias en Buenos Aires: Neon Recording Studio y Club de Rock 1999.</p><div className="store-invasion-map"><span>TIENDA / SEÑAL LOCAL</span><span>ESTUDIO / INTERFERENCIA</span><span>CLUB / INTERFERENCIA</span></div><p>NEONBOY: ¡Listo! La tienda está a salvo.</p><p>NEONBOY: No... pará. ¡Esto está pasando en toda Buenos Aires!</p><button type="button" disabled={p.coreNeutralized} onClick={()=>{onAction("core-read");onClose();}}>Neutralizar señal local</button><p className="store-invasion-status">{p.coreNeutralized?"SEÑAL LOCAL DESACTIVADA / CORRUPCIÓN GLOBAL ACTIVA":"El Archivista permanece oculto."}</p></>}
      {mode==="diary"&&<><p>{storeInvasionObjective(p)}</p><div className="store-invasion-progress">{[["Rockola",p.jukeboxOff],["Archivo",p.archiveOff],["Fantasma",p.ghostDefeated],["Transmisión",p.transmissionOff],["Entidad",p.bossDefeated],["Núcleo",p.coreNeutralized]].map(([label,done])=><span key={label} className={done?"done":""}>{done?"✓":"○"} {label}</span>)}</div>{topics.map(([topic,label])=><div key={topic} className="store-invasion-hint"><strong>{label}</strong><p>{storeInvasionHint(p,topic)}</p><button type="button" onClick={()=>onAction("hint",topic)}>Pista siguiente</button></div>)}</>}
      <button type="button" className="store-invasion-dismiss" onClick={onClose}>Volver al juego</button>
    </section>
  </div>;
}
