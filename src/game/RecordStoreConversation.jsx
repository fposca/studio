import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Volume2, X } from "lucide-react";
import { getStoreVoiceUrl } from "./recordStoreVoices.js";

export default function RecordStoreConversation({ npc, node, lastChoice, onChoose, onClose, onVoiceEnded }) {
  const firstOption = useRef(null);
  const voiceRef = useRef(null);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const voiceUrl = getStoreVoiceUrl(npc.id, node);
  useEffect(() => { firstOption.current?.focus(); }, [npc.id, node.id]);
  useEffect(() => {
    if (!voiceUrl) {
      setVoiceStatus("idle");
      return;
    }
    const voice = new Audio(voiceUrl);
    voiceRef.current = voice;
    voice.preload = "auto";
    let current = true;
    const onEnded = () => { if (current) { setVoiceStatus("ended"); onVoiceEnded?.(npc.id); } };
    const onError = () => { if (current) setVoiceStatus("error"); };
    voice.addEventListener("ended", onEnded);
    voice.addEventListener("error", onError);
    setVoiceStatus("loading");
    Promise.resolve(voice.play()).then(
      () => { if (current) setVoiceStatus("playing"); },
      () => { if (current) setVoiceStatus("blocked"); }
    );
    return () => {
      current = false;
      voice.pause();
      voice.removeEventListener("ended", onEnded);
      voice.removeEventListener("error", onError);
      if (voiceRef.current === voice) voiceRef.current = null;
    };
  }, [voiceUrl]);

  function replayVoice() {
    const voice = voiceRef.current;
    if (!voice) return;
    voice.currentTime = 0;
    Promise.resolve(voice.play()).then(
      () => setVoiceStatus("playing"),
      () => setVoiceStatus("blocked")
    );
  }

  return <div className="record-store-conversation-overlay">
    <section className="record-store-conversation" role="dialog" aria-modal="true" aria-label={`Conversación con ${npc.name}`}>
      <div className="record-store-conversation-head">
        <span className="record-store-conversation-avatar" aria-hidden="true">{npc.id === "tito" ? "TS" : npc.id === "rulo" ? "RD" : npc.id === "roxy" ? "RX" : npc.id === "freddy" ? "FR" : npc.id === "skeleton-holy" ? "HF" : "UF"}</span>
        <div><small>{node.kicker || `${npc.role} · 1999`}</small><h3><MessageCircle size={18} /> {npc.name}</h3></div>
        <button type="button" className="record-store-conversation-close" onClick={onClose} aria-label="Cerrar conversación"><X size={20} /></button>
      </div>
      {lastChoice && <p className="record-store-neonboy-line"><strong>NEONBOY</strong> {lastChoice}</p>}
      {node.text && <p className="record-store-conversation-line">{node.text}</p>}
      {voiceUrl && <button type="button" className="record-store-voice-button" onClick={replayVoice}
        aria-label={(voiceStatus === "blocked" ? "Escuchar" : "Repetir") + " voz de " + npc.name}>
        <Volume2 size={16} aria-hidden="true" /> {voiceStatus === "blocked" ? "Escuchar voz" : "Repetir voz"}
      </button>}
      <div className="record-store-dialogue-options" role="group" aria-label="Respuestas de Neonboy">
        {node.options.map((choice, index) => <button key={choice.id} type="button" ref={index === 0 ? firstOption : undefined}
          onClick={() => onChoose(choice.id, choice.label)}><span>{String(index + 1).padStart(2, "0")}</span>{choice.label}</button>)}
      </div>
      <small className="record-store-conversation-hint">Elegí una respuesta · Escape para salir</small>
    </section>
  </div>;
}
