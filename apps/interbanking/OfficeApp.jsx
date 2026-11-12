import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, Coffee, Eye, MessageCircle, Mouse, X } from "lucide-react";
import OfficeScene from "./OfficeScene.jsx";
import { OFFICE_ALFREDO, OFFICE_ALFREDO_DIALOGUE, OFFICE_DIALOGUE, OFFICE_LOGO_TEXT, OFFICE_ROXY, getOfficeDialogueNode } from "./officeDialogue.js";
import { OFFICE_VOICES } from "./officeVoices.js";
import { createOfficeVoicePlayer } from "./officeAudio.js";

const logoUrl = new URL("../../src/assets/neonboy-animaciones/interbanking/interbanking-logo.png", import.meta.url).href;
const NEAR_LABEL = { roxy: "Hablar con Roxy", alfredo: "Hablar con Alfredo", logo: "Inspeccionar logo", coffee: "Ver cocina" };
const AVATARS = Object.freeze({
  fernando: { name: "Fernando", description: "Avatar masculino", portrait: new URL("./avatars/fernando.png", import.meta.url).href },
  victoria: { name: "Victoria", description: "Avatar femenino", portrait: new URL("./avatars/victoria.png", import.meta.url).href },
});

function Conversation({ node, speaker = OFFICE_ROXY, avatarName, lastChoice, awaitingReply, onChoose, onClose }) {
  const firstOption = useRef(null);
  useEffect(() => { firstOption.current?.focus(); }, [node.id]);
  return <div className="office-dialogue-overlay">
    <section className="office-dialogue" role="dialog" aria-modal="true" aria-label={`Conversación con ${speaker.name}`}>
      <div className="office-dialogue-head">
        <span className="office-dialogue-avatar" aria-hidden="true">{speaker.avatar}</span>
        <div><small>{node.kicker}</small><h2><MessageCircle size={21} /> {speaker.name}</h2>
          <p>{speaker.role}</p></div>
        <button type="button" onClick={onClose} className="office-dialogue-close" aria-label="Cerrar conversación"><X size={21} /></button>
      </div>
      {lastChoice && <p className="office-dialogue-player"><strong>{avatarName.toUpperCase()}</strong>{lastChoice}</p>}
      {!awaitingReply && <p className="office-dialogue-line">{node.text}</p>}
      {!awaitingReply && <div className="office-dialogue-options" role="group" aria-label={`Respuestas de ${avatarName}`}>
        {node.options.map((option, index) => <button key={option.id} type="button"
          ref={index === 0 ? firstOption : undefined} onClick={() => onChoose(option.id)}>
          <span>{String(index + 1).padStart(2, "0")}</span>{option.label}<ArrowRight size={16} aria-hidden="true" /></button>)}
      </div>}
      <small className="office-dialogue-hint">{awaitingReply ? `${avatarName} está hablando…` : "Elegí una respuesta · Escape para cerrar"}</small>
    </section>
  </div>;
}

function InfoPanel({ kind, onClose }) {
  const isLogo = kind === "logo";
  return <div className="office-dialogue-overlay">
    <section className="office-dialogue office-info" role="dialog" aria-modal="true"
      aria-label={isLogo ? "Acerca de Interbanking" : "La cocina de la oficina"}>
      <div className="office-dialogue-head">
        <span className="office-dialogue-avatar" aria-hidden="true">{isLogo ? <Eye size={23} /> : <Coffee size={23} />}</span>
        <div><small>{isLogo ? "CONOCÉ EL LUGAR" : "UN DESCANSO PARA EMPEZAR"}</small>
          <h2>{isLogo ? "Interbanking" : "La cocina"}</h2></div>
        <button type="button" onClick={onClose} className="office-dialogue-close" aria-label="Cerrar"><X size={21} /></button>
      </div>
      {isLogo && <img src={logoUrl} alt="Logo de Interbanking" className="office-info-logo" />}
      <p className="office-info-body">{isLogo ? OFFICE_LOGO_TEXT
        : "Acá podés servirte un café, un té o alguna de las infusiones disponibles. Es un buen lugar para hacer una pausa y conocer al equipo."}</p>
      <button className="office-info-return" type="button" onClick={onClose}>Volver a la oficina <ArrowRight size={16} /></button>
    </section>
  </div>;
}

function StartScreen({ selectedAvatar, onSelect, onStart }) {
  return <section className="office-cover" aria-label="Inicio del recorrido">
    <div className="office-cover-content">
      <img src={logoUrl} className="office-cover-logo" alt="Interbanking" />
      <p className="office-cover-eyebrow">RECORRIDO INTERACTIVO <span /> PRIMER DÍA</p>
      <h1>Tu primer día<br /><em>empieza acá.</em></h1>
      <p className="office-cover-lead">Elegí tu avatar y recorré la oficina. Roxy te espera para darte la bienvenida.</p>
      <div className="office-avatar-heading"><strong>ELEGÍ TU AVATAR</strong><span>01 / 02</span></div>
      <div className="office-avatar-grid" role="group" aria-label="Selección de avatar">
        {Object.entries(AVATARS).map(([id, avatar]) => <button key={id} type="button"
          className={"office-avatar-card" + (selectedAvatar === id ? " is-selected" : "")}
          aria-pressed={selectedAvatar === id} onClick={() => onSelect(id)}>
          <span className="office-avatar-portrait"><img src={avatar.portrait} alt="" /></span>
          <span className="office-avatar-copy"><strong>{avatar.name}</strong><small>{avatar.description}</small></span>
          <span className="office-avatar-status">{selectedAvatar === id ? "SELECCIONADO" : "DISPONIBLE"}</span>
        </button>)}
      </div>
      <button type="button" className="office-cover-start" disabled={!selectedAvatar} onClick={onStart}>
        Comenzar recorrido <ArrowRight size={20} />
      </button>
      <p className="office-cover-footnote">Explorá la oficina a tu ritmo. Las conversaciones cambian según lo que preguntes.</p>
    </div>
    <div className="office-cover-side" aria-hidden="true"><span>INTERBANKING</span><strong>Un nuevo comienzo</strong><small>Oficina interactiva · Buenos Aires</small></div>
  </section>;
}

export default function OfficeApp() {
  const [started, setStarted] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("fernando");
  const [firstPerson, setFirstPerson] = useState(false);
  const [nearby, setNearby] = useState(null);
  const [panel, setPanel] = useState(null);
  const [nodeId, setNodeId] = useState("welcome");
  const [lastChoice, setLastChoice] = useState("");
  const [awaitingReply, setAwaitingReply] = useState(false);
  const voicePlayer = useRef(null);
  if (!voicePlayer.current) voicePlayer.current = createOfficeVoicePlayer();

  function closePanel() {
    voicePlayer.current.stop();
    setAwaitingReply(false);
    setPanel(null);
  }
  function interact(kind) {
    if (!started || !kind || panel) return;
    voicePlayer.current.stop();
    if (kind === "roxy" || kind === "alfredo") {
      setNodeId("welcome");
      setLastChoice("");
      setAwaitingReply(false);
      if (kind === "roxy") voicePlayer.current.play([selectedAvatar === "victoria" ? OFFICE_VOICES.roxy.welcomeVictoria : OFFICE_VOICES.roxy.welcome]);
    }
    setPanel(kind);
  }
  function choose(id) {
    if (awaitingReply) return;
    if (panel === "alfredo") {
      const choice = OFFICE_ALFREDO_DIALOGUE[nodeId].options.find(option => option.id === id);
      if (!choice) return;
      setLastChoice(choice.spoken);
      if (choice.next) setNodeId(choice.next);
      else setPanel(null);
      return;
    }
    const choice = OFFICE_DIALOGUE[nodeId].options.find(option => option.id === id);
    if (!choice) return;
    setLastChoice(choice.spoken);
    setAwaitingReply(true);
    const avatarVoice = OFFICE_VOICES[selectedAvatar][nodeId][choice.id];
    voicePlayer.current.play([avatarVoice], () => {
      if (!choice.next) {
        setAwaitingReply(false);
        setPanel(null);
        return;
      }
      setNodeId(choice.next);
      setAwaitingReply(false);
      voicePlayer.current.play([choice.next === "welcome" && selectedAvatar === "victoria" ? OFFICE_VOICES.roxy.welcomeVictoria : OFFICE_VOICES.roxy[choice.next]]);
    });
  }
  useEffect(() => {
    const onEscape = event => {
      if (event.key !== "Escape") return;
      voicePlayer.current.stop();
      setAwaitingReply(false);
      setPanel(null);
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
      voicePlayer.current?.stop();
    };
  }, []);

  return <main className={"office-app" + (!started ? " is-on-cover" : "")}>
    <OfficeScene avatar={selectedAvatar} firstPerson={firstPerson} locked={!started || Boolean(panel)}
      onInteract={interact} onNearby={setNearby} onViewChange={setFirstPerson} />
    <header className="office-header">
      <div className="office-brand"><img src={logoUrl} alt="Interbanking" /><span>RECORRIDO INTERACTIVO</span></div>
      <div className="office-header-right"><span className="office-live-dot" /> Oficina · Primer día</div>
    </header>
    {started && <button type="button" className="office-view-button" aria-pressed={firstPerson}
      aria-label={firstPerson ? "Volver a tercera persona (C)" : "Ver en primera persona (C)"}
      onClick={() => setFirstPerson(value => !value)}>
      <Camera size={16} aria-hidden="true" /><span>{firstPerson ? "VOLVER A TERCERA PERSONA" : "VER EN PRIMERA PERSONA"}</span><kbd>C</kbd>
    </button>}
    <aside className="office-controls" aria-label="Controles">
      <span><kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd> Mover</span>
      <span><kbd>SHIFT</kbd> Caminar rápido</span>
      <span><Mouse size={14} /> Arrastrar para mirar</span>
      <span><kbd>E</kbd> Interactuar</span>
      <span><kbd>C</kbd> Cambiar vista</span>
    </aside>
    {nearby && !panel && <button type="button" className="office-nearby" onClick={() => interact(nearby)}>
      <kbd>E</kbd><span>{NEAR_LABEL[nearby]}</span><ArrowRight size={17} aria-hidden="true" />
    </button>}
    <footer className="office-footer"><span>{AVATARS[selectedAvatar].name.toUpperCase()} · PRIMER DÍA</span><span>INTERBANKING</span></footer>
    {panel === "roxy" && <Conversation node={getOfficeDialogueNode(nodeId, selectedAvatar)} avatarName={AVATARS[selectedAvatar].name} lastChoice={lastChoice}
      awaitingReply={awaitingReply} onChoose={choose} onClose={closePanel} />}
    {panel === "alfredo" && <Conversation node={OFFICE_ALFREDO_DIALOGUE[nodeId]} speaker={OFFICE_ALFREDO}
      avatarName={AVATARS[selectedAvatar].name} lastChoice={lastChoice} awaitingReply={false} onChoose={choose} onClose={closePanel} />}
    {(panel === "logo" || panel === "coffee") && <InfoPanel kind={panel} onClose={closePanel} />}
    {!started && <StartScreen selectedAvatar={selectedAvatar} onSelect={setSelectedAvatar} onStart={() => setStarted(true)} />}
  </main>;
}
