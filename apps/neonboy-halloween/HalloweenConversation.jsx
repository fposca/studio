import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Disc3, MessageCircle, Pause, Play, RotateCcw, X } from "lucide-react";
import "./halloweenConversation.css";
import { BELFEGOR_REQUIRED_ATTEMPTS, belfegorReaction } from "./halloweenBelfegorLogic.js";

const ACCENTS = { tito: "#e8b58d", rulo: "#ed9aa5", roxy: "#c6a6ed", freddy: "#eda47f", jason: "#9bc9bc" };
const formatTime = (value) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;

function DialogueAudio({ voice, playing, name, onToggle, onReplay }) {
  const [time, setTime] = useState({ current: 0, duration: 0 });
  useEffect(() => {
    const update = () => setTime({ current: voice?.currentTime || 0, duration: Number.isFinite(voice?.duration) ? voice.duration : 0 });
    update();
    if (!voice) return;
    const events = ["timeupdate", "loadedmetadata", "durationchange", "ended", "emptied"];
    events.forEach((event) => voice.addEventListener(event, update));
    return () => events.forEach((event) => voice.removeEventListener(event, update));
  }, [voice]);
  if (!voice) return null;
  const progress = time.duration > 0 ? Math.min(100, time.current / time.duration * 100) : 0;
  return <div className={`dialogue-audio${playing ? " is-playing" : ""}`}>
    <button type="button" className="dialogue-audio-play" onClick={onToggle} aria-label={playing ? "Pausar voz" : "Escuchar voz"}>
      {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
    </button>
    <div className="dialogue-audio-info">
      <div className="dialogue-audio-meta"><span>{playing ? "ESCUCHANDO" : time.current > 0 && time.current < time.duration ? "EN PAUSA" : "VOZ DEL PERSONAJE"}</span>
        <time>{formatTime(time.current)}{time.duration > 0 && ` / ${formatTime(time.duration)}`}</time></div>
      <div className="dialogue-audio-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
    </div>
    <button type="button" className="dialogue-audio-replay" onClick={onReplay} aria-label={`Repetir sonido de ${name}`} title="Volver a escuchar"><RotateCcw size={17} /></button>
  </div>;
}

export default function HalloweenConversation({ npc, npcId, topicIndex, voice, voicePlaying, jasonResponded, belfegorAttempts,
  reward, ambientConversations, conversations, onSelectTopic, onGreeting, onReplay, onToggleVoice, onInsist, onAmbient, onClose }) {
  const rootRef = useRef(null);
  const titleRef = useRef(null);
  const textRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      const target = previousFocus?.isConnected ? previousFocus : document.getElementById("halloween-people-button");
      target?.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => { if (textRef.current) textRef.current.scrollTop = 0; }, [topicIndex, npcId]);
  const containFocus = (event) => {
    if (event.key !== "Tab") return;
    const buttons = [...rootRef.current.querySelectorAll("button:not(:disabled), a[href], [tabindex='0']")];
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  };
  return <div ref={rootRef} className={`halloween-dialogue${npc.topics.length ? "" : " is-quiet"}`}
    style={{ "--dialogue-accent": ACCENTS[npcId] || "#e8a4d3" }} onKeyDown={containFocus}>
    <header className="dialogue-header">
      <div className="dialogue-record" aria-hidden="true"><Disc3 size={27} strokeWidth={1.3} /></div>
      <div className="dialogue-identity"><span>NEONBOY MUSIC <i /> HALLOWEEN</span>
        <h2 id="halloween-dialogue-title" ref={titleRef} tabIndex={-1}>{npc.name}</h2><p>{npc.role}</p></div>
      <button type="button" className="dialogue-close" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
    </header>

    <div className="dialogue-body">
      <section className="dialogue-response" aria-label="Respuesta del personaje">
        <div className="dialogue-response-label"><span className="dialogue-status-dot" />{topicIndex === null ? "EL ENCUENTRO" : npc.topics[topicIndex][0]}</div>
        <div className="dialogue-quote" ref={textRef}>
          <span className="dialogue-quote-mark" aria-hidden="true">“</span>
          <p aria-live="polite" aria-atomic="true">{topicIndex === null ? npc.intro : npc.topics[topicIndex][1]}</p>
          {npcId === "jason" && <div className="dialogue-jason" role="status">
            <span>{belfegorReaction(belfegorAttempts)}</span>
            <div className="dialogue-attempt-progress"><strong>{jasonResponded ? "RESPUESTA OBTENIDA" : "INSISTENCIA"}</strong><span>{belfegorAttempts}/{BELFEGOR_REQUIRED_ATTEMPTS}</span></div>
            <div className="dialogue-attempts" aria-label={`Insistencia ${belfegorAttempts} de ${BELFEGOR_REQUIRED_ATTEMPTS}`}>
              {Array.from({ length: BELFEGOR_REQUIRED_ATTEMPTS }, (_, index) => <i key={index} className={index < belfegorAttempts ? "is-filled" : ""} />)}
            </div>
          </div>}
          {reward}
        </div>
        <DialogueAudio voice={voice} playing={voicePlaying} name={npc.name} onToggle={onToggleVoice} onReplay={onReplay} />
        {npcId === "jason" && !jasonResponded && <button type="button" className="dialogue-insist" onClick={onInsist}><MessageCircle size={16} /> Insistir <small>{Math.min(BELFEGOR_REQUIRED_ATTEMPTS, belfegorAttempts + 1)}/{BELFEGOR_REQUIRED_ATTEMPTS}</small><ChevronRight size={16} /></button>}
      </section>

      {npc.topics.length > 0 && <aside className="dialogue-topics" aria-label="Temas de conversación">
        <div className="dialogue-topics-heading"><h3>¿De qué hablamos?</h3><span>{npc.topics.length} TEMAS</span></div>
        <div className="dialogue-topic-grid">{npc.topics.map(([label], index) => <button type="button" key={npc.topics[index][2] || index}
          className={topicIndex === index ? "is-selected" : ""} aria-pressed={topicIndex === index} onClick={() => onSelectTopic(index)}>
          <span className="dialogue-topic-number">{String(index + 1).padStart(2, "0")}</span><span className="dialogue-topic-label">{label}</span><ChevronRight size={14} />
        </button>)}</div>
        {ambientConversations.length > 0 && <div className="dialogue-ambient-links"><h4>CHARLAS EN LA TIENDA</h4>
          {ambientConversations.map((entry) => <button type="button" key={entry.id} onClick={() => onAmbient(entry)}><MessageCircle size={16} />
            <span>Escuchar con {entry.participants.filter((id) => id !== npcId).map((id) => conversations[id].name).join(" y ")}</span><ChevronRight size={14} /></button>)}
        </div>}
      </aside>}
    </div>

    <footer className="dialogue-footer">
      {topicIndex !== null ? <button type="button" className="dialogue-greeting" onClick={onGreeting}><ArrowLeft size={15} /> Volver al saludo</button>
        : <span className="dialogue-footer-hint">Tomate tu tiempo. Cada charla tiene su historia.</span>}
      <button type="button" className="dialogue-return" onClick={onClose}>Volver a la tienda <ChevronRight size={15} /></button>
    </footer>
  </div>;
}
