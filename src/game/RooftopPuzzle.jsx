import React from "react";
import { ROOFTOP_BEARING, ROOFTOP_FREQUENCY, ROOFTOP_SWITCH_ORDER } from "./rooftopQuest.js";
const labels={luna:"I / LUNA",rayo:"II / RAYO",antena:"III / ANTENA"};
export default function RooftopPuzzle({mode,progress,onAdvance,onClose}){
  if(!mode)return null;
  const signal=Math.max(0,Math.round(100-Math.abs(progress.bearing-ROOFTOP_BEARING)*2.4));
  const clarity=Math.max(0,Math.round(100-Math.abs(progress.frequency-ROOFTOP_FREQUENCY)*7));
  return <div className="rooftop-puzzle-backdrop" role="presentation">
    <section className="rooftop-puzzle" role="dialog" aria-modal="true" aria-label={mode==="power"?"Tablero electrico":mode==="antenna"?"Ajustar antena":"Receptor de radio"}>
      <header><span>NEONBOY / AZOTEA 1999</span><button type="button" onClick={onClose} aria-label="Cerrar">&times;</button></header>
      {mode==="power"&&<>
        <h3>TABLERO DE SEÑAL</h3>
        <p>«Genial. Vine a buscar una señal demoníaca y ahora tengo que hacer de electricista.»</p>
        <div className="rooftop-puzzle-clue"><strong>Diagrama ficticio</strong><span>La señal sube por etapas: luna → rayo → antena.</span></div>
        <div className="rooftop-switches">{ROOFTOP_SWITCH_ORDER.map((id)=><button key={id} type="button" disabled={progress.powerRestored} className={progress.switches.includes(id)?"is-on":""} onClick={()=>onAdvance("switch",id)}>{labels[id]}<span>{progress.switches.includes(id)?"CONECTADO":"ACTIVAR"}</span></button>)}</div>
        <small>{progress.powerRestored?"ALIMENTACIÓN DISPONIBLE · la luz de la antena se encendió":progress.switches.length?"Etapa "+progress.switches.length+"/3 conectada":"Seguí las flechas del diagrama. Una conexión fuera de orden reinicia la secuencia."}</small>
      </>}
      {mode==="antenna"&&<>
        <h3>ANTENA PRINCIPAL</h3>
        <p>Girás la antena hacia la única fuente que destaca sobre el ruido de la ciudad.</p>
        {!progress.powerRestored?<div className="rooftop-puzzle-clue">Sin alimentación. Revisá primero el tablero.</div>:<>
          <label>Orientación <strong>{progress.bearing}°</strong><input type="range" min="-90" max="90" value={progress.bearing} disabled={progress.antennaAligned} onChange={e=>onAdvance("bearing",Number(e.target.value))}/></label>
          <div className="rooftop-meters"><span>INTENSIDAD <b>{signal}%</b><i style={{width:signal+"%"}}/></span><span>INTERFERENCIA <b>{100-signal}%</b><i style={{width:(100-signal)+"%"}}/></span></div>
          <small>{signal>=80?"Pulso 09 detectado: la señal se vuelve nítida.":"Desplazá el dial: la intensidad responde a una fuente visible sobre el skyline."}</small>
          <button type="button" className="rooftop-primary" disabled={signal<80||progress.antennaAligned} onClick={()=>onAdvance("align")}>{progress.antennaAligned?"ANTENA ORIENTADA":"ANALIZAR SEÑAL"}</button>
        </>}
      </>}
      {mode==="receiver"&&<>
        <h3>RECEPTOR / FREQUENCY 09</h3>
        {!progress.antennaAligned?<div className="rooftop-puzzle-clue">Primero orientá la antena.</div>:progress.frequencyDecoded?<div className="rooftop-puzzle-clue"><strong>SEÑAL IDENTIFICADA</strong><span>ORIGEN: DESCONOCIDO · PATRÓN: 09</span></div>:<>
          <p>Hugo registró «0-9-0-9». La máquina FREQUENCY 09 repetía el mismo número.</p>
          <label>Frecuencia digital <strong>{String(progress.frequency).padStart(2,"0")}</strong><input type="range" min="0" max="99" value={progress.frequency} onChange={e=>onAdvance("frequency",Number(e.target.value))}/></label>
          <div className="rooftop-meters"><span>CLARIDAD <b>{clarity}%</b><i style={{width:clarity+"%"}}/></span></div>
          <button type="button" className="rooftop-primary" disabled={Math.abs(progress.frequency-ROOFTOP_FREQUENCY)>1} onClick={()=>onAdvance("decode")}>DECODIFICAR SEÑAL</button>
        </>}
        {progress.anomalySeen&&!progress.transmissionCollected&&<div className="rooftop-puzzle-clue"><strong>TRANSMISIÓN RECIBIDA</strong><span>ORIGEN: FUERA DE RANGO<br/>DESTINO: DESCONOCIDO<br/>PUERTA 01: DETECTADA<br/>FREQUENCY 09</span><button type="button" className="rooftop-primary" onClick={()=>onAdvance("collect")}>Registrar en cinta para Hugo</button></div>}
        {progress.transmissionCollected&&<div className="rooftop-puzzle-clue">Registro de la transmisión 09 guardado. Hugo tiene que ver esto.</div>}
      </>}
      <footer><span>ESC / CERRAR</span><span>BUENOS AIRES · 1999</span></footer>
    </section>
  </div>;
}
