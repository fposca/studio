import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Shield, Pause, RotateCcw } from 'lucide-react';
import './buenosAiresEscape.css';
const stages = {startup:'ENCENDIDO / ESTABILIZANDO',departure:'DESPEGUE / SALIR DEL PER\u00cdMETRO',avenue:'9 DE JULIO / ESQUIV\u00c1 LAS BARRERAS',interception:'INTERCEPCI\u00d3N / DEFEND\u00c9 EL FUEGO','signal-break':'RUPTURA DE SE\u00d1AL / RECUPERANDO ORIGEN','time-jump':'SALTO TEMPORAL / 1999'};
export default function BuenosAiresEscapeHud({ state:s, apiRef, paused, onPause, onExit }) {
  useEffect(()=>()=>apiRef.current?.clearInput(),[apiRef]);
  if(!s)return null;
  const finished=s.status==='complete', failed=s.status==='failed', flying=s.status==='playing';
  function hold(event,axis,value){if(paused)return;event.currentTarget.setPointerCapture(event.pointerId);apiRef.current?.input(axis,value);}
  function release(axis){apiRef.current?.input(axis,0);}
  return <div className="city-flight" data-stage={s.stage} data-status={s.status} data-progress={s.progress}>
    <div className="city-flight-warp" style={{opacity:s.timeJump ? .1*(1-s.fade):0}} aria-hidden="true" />
    <div className="city-flight-black" style={{opacity:s.fade}} aria-hidden="true" />
    {flying && <>
      <header className="city-flight-header"><div><small>NEONBOY UNIVERSE / CAP&Iacute;TULO 14</small><strong>FUGA DE LA RED</strong><span>{stages[s.stage]}</span></div>
        <div className="city-flight-toolbar"><button type="button" onClick={()=>onPause?.(!paused)}><Pause size={16}/>{paused?'Continuar':'Pausa'}</button><button type="button" onClick={onExit}>Volver al Fuego</button></div></header>
      <aside className={'city-flight-instruments'+(s.hit?' is-hit':'')}>
        <div><span>INTEGRIDAD / FUEGO</span><strong>{s.integrity}%</strong></div>
        <div className="city-flight-integrity" role="progressbar" aria-label="Integridad del Fuego" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.integrity}><i style={{width:s.integrity+'%'}}/></div>
        <small>{s.hit?s.lastDamage:'NAVEGACI\u00d3N ASISTIDA / EVASI\u00d3N MANUAL'}</small>
        <div className="city-flight-route"><i style={{width:s.progress+'%'}}/></div>
        <p>A / D &middot; esquivar <span>W / S &middot; altura</span></p>
      </aside>
      {s.warning && <div className="city-flight-warning" role="status"><small>BARRERA ADELANTE</small><strong>{s.warning==='IZQUIERDA'?<ArrowLeft/>:<ArrowRight/>} ESQUIV&Aacute; A LA {s.warning}</strong></div>}
      {s.caption && <aside className="city-flight-caption" role="log" aria-live="polite" aria-atomic="true" data-caption={s.caption.id}><small>{s.caption.speaker}</small><p>{s.caption.text}</p></aside>}
      {s.archive && <aside className="city-flight-archive"><small>ARCHIVO DE ORIGEN</small><strong>NEON RECORDING STUDIO</strong><span>A&Ntilde;O 1999</span><p>SE&Ntilde;AL ORIGINAL &mdash; DATOS CORRUPTOS</p></aside>}
      {!s.timeJump && <div className="city-flight-controls">
        <div className="city-flight-directions">{[['horizontal',-1,'Volar a la izquierda',ArrowLeft],['horizontal',1,'Volar a la derecha',ArrowRight],['vertical',1,'Subir vuelo',ArrowUp],['vertical',-1,'Bajar vuelo',ArrowDown]].map(([axis,value,label,Icon])=>
          <button key={label} type="button" aria-label={label} disabled={paused} onPointerDown={e=>hold(e,axis,value)} onPointerUp={()=>release(axis)} onPointerCancel={()=>release(axis)} onLostPointerCapture={()=>release(axis)}><Icon size={23}/></button>)}</div>
        <button type="button" className="city-flight-pulse" disabled={paused||s.cooldown>0||['startup','departure'].includes(s.stage)} onClick={()=>apiRef.current?.pulse()}><Shield size={22}/><span>PULSO DEFENSIVO<small>{s.cooldown?'RECARGA '+s.cooldown+' s':'LISTO / F o clic'}</small></span></button>
      </div>}
      {s.stage==='avenue'&&s.progress<15&&<div className="city-flight-tip">El auto avanza solo. Esquiv&aacute; con A / D o las flechas. El pulso neutraliza drones y proyectiles cercanos.</div>}
    </>}
    {(s.status==='boarding'||s.status==='load-error')&&<div className="city-flight-outcome"><section role="status"><small>RENAULT FUEGO / DOS PASAJEROS</small><h2>{s.status==='boarding'?'PREPARANDO EL DESPEGUE':'NO SE PUDO PREPARAR EL VUELO'}</h2><p>{s.status==='boarding'?'Preparando a NeonBoy, la Desconectada y los sistemas del Fuego.':'Falta cargar un recurso de la ciudad. Podés volver al auto e intentar nuevamente.'}</p><button type="button" onClick={onExit}>Volver al Fuego</button></section></div>}
    {(failed||finished)&&<div className="city-flight-outcome"><section role="dialog" aria-modal="true" aria-label={finished?'Cap\u00edtulo 14 completado':'Veh\u00edculo interceptado'}>
      <small>{finished?'NEONBOY UNIVERSE / FIN DEL CAP\u00cdTULO 14':'PROTOCOLO DE INTERCEPCI\u00d3N'}</small>
      <h2>{finished?'CAP\u00cdTULO 14 COMPLETADO':'VEH\u00cdCULO INTERCEPTADO'}</h2>
      {finished?<><p>SIGUIENTE DESTINO</p><h3>BUENOS AIRES &mdash; 1999</h3><p>EL ORIGEN DE LA SE&Ntilde;AL &mdash; PR&Oacute;XIMAMENTE</p><span className="city-flight-saved">Transmisi&oacute;n de origen recuperada. Salto temporal desbloqueado. Progreso guardado.</span></>:
      <><p>La Red inmoviliz&oacute; el Fuego. Las reparaciones y tus misiones siguen guardadas.</p><span className="city-flight-saved">Esquiv&aacute; las barreras hacia el lado indicado. Movete cuando los drones disparen y us&aacute; el pulso cerca del impacto.</span></>}
      <div><button type="button" autoFocus onClick={()=>apiRef.current?.retry()}><RotateCcw size={18}/>{finished?'Repetir la fuga':'Reintentar persecuci\u00f3n'}</button><button type="button" onClick={onExit}>Volver a la ciudad</button></div>
    </section></div>}
  </div>;
}
