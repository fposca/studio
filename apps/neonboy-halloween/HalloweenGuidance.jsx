import React from "react";
import { GUIDE_PEOPLE } from "./halloweenGuidance.js";
import { ArrowUpRight, Check, Compass, KeyRound, X } from "lucide-react";

export function HalloweenObjective({ guide, onOpen }) {
  return <button type="button" className="halloween-objective" onClick={onOpen} aria-label={`Ver gu\u00eda: ${guide.title}`}>
    <span className="halloween-objective-icon"><Compass size={20} /></span>
    <span><small>SIGUIENTE PASO</small><strong aria-live="polite">{guide.title}</strong><em>{guide.detail}</em></span>
    <ArrowUpRight size={17} className="halloween-objective-more" />
  </button>;
}
export function HalloweenGuidePanel({ guide, checklist, onClose, onReveal, canTour, canReveal, archive, canShowDemon, canShowMirror, discovered }) {
  return <div className="halloween-guide-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="halloween-guide-panel" role="dialog" aria-modal="true" aria-labelledby="halloween-guide-title">
      <header><div><small>NEONBOY / GU&Iacute;A DE LA TIENDA</small><h2 id="halloween-guide-title">Tu pr&oacute;ximo paso</h2></div><button type="button" onClick={onClose} aria-label="Cerrar gu&iacute;a"><X size={20} /></button></header>
      <div className="halloween-guide-body">
        <div className="halloween-guide-current"><Compass size={26} /><h3>{guide.title}</h3><p>{guide.detail}</p>
          {canTour && <button type="button" onClick={() => onReveal("welcome")}><Compass size={16} /> Ver presentaci&oacute;n de la tienda</button>}
          {canReveal && <button type="button" onClick={() => onReveal("chest")}><KeyRound size={16} /> Mostrar el cofre</button>}
          {canShowDemon && <button type="button" onClick={() => onReveal("demon")}><Compass size={16} /> C&oacute;mo atacar al semidemonio</button>}
          {canShowMirror && <button type="button" onClick={() => onReveal("mirror")}><Compass size={16} /> Mostrar el espejo</button>}
          <small>La se&ntilde;al indica el destino. Rode&aacute; los muebles para llegar hasta &eacute;l.</small>
        </div>
        <div className="halloween-guide-checklist"><h3>Para completar la historia</h3><ul>{checklist.map((item) => <li key={item.label} className={item.done ? "is-done" : ""}><span className="guide-check">{item.done ? <Check size={14} /> : null}</span><span>{item.label}<small>{item.value}</small></span></li>)}</ul><details className="halloween-guide-people"><summary>Personajes: qui&eacute;nes faltan</summary><p>Una charla con cada uno. Eleg&iacute; un tema; con Bones, escuchalo; con Belfegor, insist&iacute; cuatro veces.</p>
          <ul>{Object.entries(GUIDE_PEOPLE).map(([id, name]) => {
            const done = discovered.has(`npc-dialogue:${id}`);
            return <li key={id}><span>{name}</span>{done ? <span className="guide-person-done"><Check size={14} /> Listo</span> : <button type="button" onClick={() => onReveal("people", id)} aria-label={`Mostrar a ${name}`}>Mostrar <ArrowUpRight size={14} /></button>}</li>;
          })}</ul></details><details className="halloween-guide-optional"><summary>Secretos opcionales / vinilo rosa</summary><p>Se pueden completar despu&eacute;s de la historia.</p><ul>
          <li>Mensajes Matrix <b>{archive.matrixMessages}/2</b></li><li>Portadas Matrix <b>{archive.covers}/4</b></li><li>Mensajes del espejo <b>{archive.mirrors}/5</b></li><li>Temas distintos <b>{archive.songs}/3</b></li>
          </ul></details></div>
      </div>
      <footer><p>Mov&eacute; el joystick para caminar y arrastr&aacute; la pantalla para mirar. Acercate a la se&ntilde;al y toc&aacute; el bot&oacute;n con el nombre de la acci&oacute;n o E.</p><button type="button" onClick={onClose}>Seguir jugando <ArrowUpRight size={16} /></button></footer>
    </section>
  </div>;
}
