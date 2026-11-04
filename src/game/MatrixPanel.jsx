import React, {useState} from 'react';
import {MATRIX_SECTORS} from './matrixLayout.js';
import {matrixHint,matrixObjective} from './matrixQuest.js';
import './matrix.css';

const NEX_TOPICS={
 place:['¿Dónde estamos?','NEX-9: En una simulación que conserva fragmentos de ciudades que nunca terminaron de existir.'],
 vision:['¿Cómo veo el puente?','NEX-9: Usá C para activar la Visión de Frecuencia. El Orbe puede despertar los nodos ocultos.'],
 archivist:['¿Quién controla este lugar?','NEX-9: El Archivista escribió estos recuerdos. Algo está reescribiendo sus instrucciones.'],
 evil:['¿Quién es ese reflejo?','NEX-9: Tiene tu forma, pero responde a otra voluntad. No lo sigas sin recuperar las memorias.'],
 hint:['Necesito orientación','NEX-9: Reconstruí el origen, el eco y el enlace. El puente recordará cómo abrirse.'],
};
const SENTINEL_TOPICS={
 place:['¿Qué protege el Núcleo?','CENTINELA 09: El acceso a las copias de seguridad y al Espejo Digital.'],
 creator:['¿Quién te construyó?','CENTINELA 09: El Archivista. Mi directiva de protección aún conserva parte de su código original.'],
 corruption:['¿Qué te pasó?','CENTINELA 09: Las órdenes están partidas. Necesito pruebas externas para separar la señal legítima.'],
 archivist:['¿El Archivista sigue aquí?','CENTINELA 09: Queda un proceso activo. Su firma también aparece en Buenos Aires.'],
 access:['¿Cómo abro el acceso?','CENTINELA 09: Recuperá fragmento, módulo y registro. Después distribuí 2, 1 y 2 unidades de energía.'],
 proof:['Tengo las pruebas','CENTINELA 09: Revisaré el registro y la distribución antes de autorizarte.'],
};
const TITLES={nex9:'NEX-9 / TESTIGO DE LA SIMULACIÓN',sentinel:'CENTINELA 09 / NÚCLEO DE SEGURIDAD',energy:'DISTRIBUCIÓN DE ENERGÍA',authorization:'TERMINAL DE AUTORIZACIÓN',centralArchive:'ARCHIVO CENTRAL',mirrorAltar:'ESPEJO DIGITAL',journal:'DIARIO / PUERTA 03'};
const HINT_STEPS=['bridge','memory','blocks','heavy','security','boss'];
export default function MatrixPanel({mode,progress:p,onAction,onClose,onEnter}){
 const [reply,setReply]=useState('');
 if(!mode)return null;
 const action=(event,value)=>{onAction(event,value);};
 const button=(label,handler,disabled=false)=> <button type="button" key={label} disabled={disabled} onClick={handler}>{label}</button>;
 const topics=mode==='nex9'?NEX_TOPICS:SENTINEL_TOPICS;
 const sector=mode==='journal'&&MATRIX_SECTORS.find(s=>s.id===p.checkpoint);
 const blockIndex=mode.startsWith('block:')?Number(mode.slice(6)):-1;
 return <div className="matrix-panel-backdrop" onClick={onClose}>
  <section className="matrix-panel" role="dialog" aria-modal="true" aria-label={TITLES[mode]||mode} onClick={e=>e.stopPropagation()}>
   <header><span>NEONBOY UNIVERSE / PUERTA 03</span><button type="button" onClick={onClose} aria-label="Cerrar">×</button></header>
   <h2>{TITLES[mode]||({memoryFragment:'FRAGMENTO DEL ARCHIVO',module:'MÓDULO ENERGÉTICO',container:'CONTENEDOR ENERGÉTICO',evidence:'REGISTRO DE CORRUPCIÓN',returnPortal:'PORTAL A LA NAVE',exitPortal:'REGRESO A BUENOS AIRES'})[mode]||(mode.startsWith('block:')?'BLOQUE DE MEMORIA':mode.startsWith('memory:')?'RECUERDO RECUPERADO':mode)}</h2>
   {mode==='nex9'&&p.nexTopics.length===0&&<div className="matrix-dialogue-intro"><p><b>NEONBOY</b> ¡Eh! ¿Vos sos de los buenos o de los malos?</p><p><b>NEX-9</b> Definí buenos.</p><p><b>NEONBOY</b> Los que no intentan matarme.</p><p><b>NEX-9</b> Entonces, según esa definición, soy de los buenos.</p><p><b>NEONBOY</b> ¡Por fin uno!</p></div>}
   {mode==='sentinel'&&p.sentinelTopics.length===0&&<div className="matrix-dialogue-intro"><p><b>CENTINELA 09</b> ACCESO DENEGADO. IDENTIDAD NO RECONOCIDA.</p><p><b>NEONBOY</b> ¡Otra vez lo mismo! Soy NeonBoy.</p><p><b>CENTINELA 09</b> IDENTIDAD INEXISTENTE EN EL REGISTRO.</p><p><b>NEONBOY</b> Bueno, agregame.</p><p><b>CENTINELA 09</b> NO POSEO AUTORIZACIÓN PARA MODIFICAR EL REGISTRO.</p><p><b>NEONBOY</b> ¡Qué sistema de mierda!</p><p><b>CENTINELA 09</b> COMENTARIO REGISTRADO.</p></div>}
   {(mode==='nex9'||mode==='sentinel')&&<><p className="matrix-dialogue-line">{mode==='nex9'?'NEX-9: Todavía puedo recordar cómo era este lugar antes de la fractura.':'CENTINELA 09: Identificate. La corrupción modificó mis protocolos.'}</p>
    {Object.entries(topics).map(([id,[label,response]])=>button(label,()=>{action(mode==='nex9'?'nex-topic':'sentinel-topic',id);setReply(response);}))}
    {reply&&<p className="matrix-reply">{reply}</p>}
    {mode==='nex9'&&!p.nexMet&&button('Aceptar ayuda de NEX-9 y activar Visión de Frecuencia',()=>{action('nex-meet');setReply('NEX-9: La visión está lista. Presioná C para ver los nodos ocultos.');})}
    {mode==='sentinel'&&<p className="matrix-evidence">Pruebas: fragmento {p.memoryFragment?'✓':'○'} · módulo {p.moduleTaken?'✓':'○'} · registro {p.evidenceFound?'✓':'○'}. Energía {p.energy.join(' / ')}.</p>}
   </>}
   {mode==='journal'&&<><p>{matrixObjective(p)}</p><p>Sector alcanzado: {sector?.label||'Ciudad Incompleta'}. Visión: {p.visionActive?'activa':'inactiva'}.</p><div className="matrix-hints">{HINT_STEPS.map(id=><div key={id}><strong>{id.toUpperCase()}</strong> {button('Pedir pista '+(p.hints[id]||0)+'/3',()=>action('hint',id),p.hints[id]>=3)}{p.hints[id]>0&&<p>{matrixHint(p,id)}</p>}</div>)}</div>{p.memoryOpen&&!p.blocksOpen&&button('Reiniciar bloques del Taller',()=>action('block-reset'))}</>}
   {mode.startsWith('memory:')&&<><p>La pantalla reproduce un hecho real de la historia de NeonBoy.</p><p>Secuencia recordada: {p.memorySequence.length}/3.</p>{button('Registrar este recuerdo',()=>{action('memory-select',mode.slice(7));onClose();},p.memoryOpen)}</>}
   {mode==='memoryFragment'&&<><p>Una copia parcial del pasado resiste la corrupción del Archivo.</p>{button('Guardar fragmento de memoria',()=>{action('memory-take');onClose();},!p.memoryOpen||p.memoryFragment)}</>}
   {blockIndex>=0&&<><p>Mové este bloque hacia una de las tres placas. Si te equivocás, podés volver a ubicarlo.</p><div className="matrix-grid">{['I / ENTRADA','II / CENTRO','III / SALIDA'].map((label,i)=>button(label,()=>{action('block-move',{index:blockIndex,slot:i});onClose();},p.blockPlacements.some((slot,j)=>j!==blockIndex&&slot===i)))}{button('Retirar de la placa',()=>{action('block-move',{index:blockIndex,slot:-1});onClose();})}</div><p>Placas correctas: {p.blockPlacements.filter(v=>v>=0).length}/3.</p></>}
   {mode==='module'&&<><p>El módulo puede estabilizar el Núcleo de Seguridad.</p>{button('Guardar módulo',()=>{action('module-take');onClose();},!p.blocksOpen||p.moduleTaken)}</>}
   {mode==='container'&&<><p>El Orbe daña al robot pesado. Si movés el contenedor a la placa y activás los dos refrigerantes, cada impacto causa el doble de daño.</p>{button(p.containerOnPlate?'Retirar contenedor':'Empujar contenedor a la placa',()=>{action('container-move');onClose();},!p.blocksOpen||p.heavyDefeated)}</>}
   {mode==='evidence'&&<><p>Registro firmado por el Archivista. El daño comenzó antes de que la señal alcanzara Buenos Aires.</p>{button('Guardar registro como evidencia',()=>{action('evidence');onClose();},!p.heavyDefeated||p.evidenceFound)}</>}
   {mode==='energy'&&<><p>Distribuí cinco unidades entre Sistemas, Memoria y Guardia. El registro del reactor conserva el orden.</p>{['Sistemas','Memoria','Guardia'].map((label,i)=><div className="matrix-energy" key={label}><span>{label}</span><button onClick={()=>action('energy-set',{index:i,amount:Math.max(0,p.energy[i]-1)})}>−</button><strong>{p.energy[i]}</strong><button onClick={()=>action('energy-set',{index:i,amount:Math.min(3,p.energy[i]+1)})}>+</button></div>)}{button('Validar distribución con el Centinela',()=>{action('sentinel-trust');setReply('CENTINELA 09: '+(p.evidenceFound&&p.energy.join(',')==='2,1,2'?'Distribución correcta. Autorización parcial concedida.':'Faltan pruebas o la energía está desbalanceada.'));})}{reply&&<p className="matrix-reply">{reply}</p>}</>}
   {mode==='authorization'&&<><p>La autorización requiere el fragmento del Archivo, el módulo del Taller y el aval del Centinela.</p>{button('Restaurar acceso al Espejo Digital',()=>{action('security-open');onClose();},!p.sentinelAllied||!p.memoryFragment||!p.moduleTaken)}</>}
   {mode==='mirrorAltar'&&<><p>Tu reflejo espera al final del corredor. El Orbe responde a tus movimientos.</p>{button(p.bossDefeated?'Combate completado':'Enfrentar a Neon Evil',()=>{action('boss-start');onClose();},!p.securityOpen||!p.eliteDefeated||p.bossDefeated)}</>}
   {mode==='centralArchive'&&<><p>ARCHIVISTA: "La simulación no contiene la corrupción. La transmite."</p><p>Una copia del patrón ya alcanzó Buenos Aires. La próxima pista está en el mundo de origen.</p>{button('Registrar revelación y nueva misión',()=>{action('archive-read');onClose();},!p.bossDefeated||p.archiveRead)}</>}
   {mode==='returnPortal'&&<><p>La nave conserva la coordenada. Tu progreso en PUERTA 03 quedará guardado.</p>{button('Volver a la Nave Perdida',()=>onEnter('lost-ship'))}</>}
   {mode==='exitPortal'&&<><p>NeonBoy regresa a Buenos Aires con la advertencia del Archivo Central.</p>{button('Regresar a la ciudad',()=>{action('return-home');onEnter('discography');},!p.archiveRead)}</>}
   <footer>{button('Cerrar / Esc',onClose)}</footer>
  </section>
 </div>;
}
