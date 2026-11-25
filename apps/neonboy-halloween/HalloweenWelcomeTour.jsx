import React, { useEffect, useRef } from "react";
import { ArrowRight, Compass, Disc3, Headphones, MessageCircle, SkipForward } from "lucide-react";
import { WELCOME_TOUR_STEPS } from "./halloweenWelcomeTour.js";
import "./halloweenWelcomeTour.css";

export default function HalloweenWelcomeTour({ step, progressRef, onNext, onSkip, albums }) {
  const content = WELCOME_TOUR_STEPS[step] || WELCOME_TOUR_STEPS[0];
  const headingRef = useRef(null);
  const nextRef = useRef(null);
  // Keep keyboard focus in the presentation while gameplay controls are hidden.
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);
  const icons = { music: Headphones, disc: Disc3, people: MessageCircle, compass: Compass };
  const Icon = icons[content.icon];
  const records = content.group ? albums.filter(a => a.group === content.group && !a.incoming).slice(0,3) : [];
  return <section className="halloween-welcome-tour" role="dialog" aria-modal="true" aria-labelledby="welcome-tour-title" data-step={content.id}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const first = event.currentTarget.querySelector('button');
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); nextRef.current?.focus(); }
      else if (!event.shiftKey && document.activeElement === nextRef.current) { event.preventDefault(); first?.focus(); }
    }}>
    <div className="welcome-tour-shade" aria-hidden="true" />
    <header className="welcome-tour-top"><span><i /> NEONBOY <b>/</b> LA TIENDA DE LOS DISCOS</span>
      <button type="button" onClick={onSkip}>Omitir presentaci&oacute;n <SkipForward size={14} /></button></header>
    <div className="welcome-tour-card">
      <div className="welcome-tour-index"><span><Icon size={17} /> {content.eyebrow}</span><small>{String(step+1).padStart(2,"0")} / 05</small></div>
      <div key={content.id} className="welcome-tour-copy">
        <h2 id="welcome-tour-title" ref={headingRef} tabIndex={-1}>{content.title}</h2>
        <p>{content.text}</p>
        {records.length > 0 && <div className="welcome-tour-records" aria-label="Algunos discos disponibles">{records.map(album => <div key={album.id}><img src={album.cover} alt="" /><span>{album.name}</span></div>)}</div>}
        <div className="welcome-tour-action">{[1,2,3].includes(step) && <kbd>E</kbd>}<span>{content.action}</span></div>
        {content.hint && <small className="welcome-tour-hint">{content.hint}</small>}
      </div>
      <footer><div className="welcome-tour-stops" aria-label={`Parada ${step+1} de 5`}>{WELCOME_TOUR_STEPS.map((item,index)=><span key={item.id} className={index<step?'is-done':index===step?'is-current':''} title={item.label}><i ref={index===step ? progressRef : null} /></span>)}</div>
        <button ref={nextRef} type="button" onClick={onNext}>{step===4 ? "Entrar a la tienda" : "Siguiente"}<ArrowRight size={16} /></button></footer>
    </div>
    <span className="welcome-tour-caption">RECORRIDO MUSICAL <b>+</b> AVENTURA INTERACTIVA</span>
  </section>;
}
