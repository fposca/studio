import React, { useEffect, useMemo, useRef, useState } from "react";
import { isSignalClean, signalInterference, SIGNAL_TARGET } from "./studioImpossibleRecording.js";
import "./studioSignalAnalyzer.css";

const BAND_LABELS = { low: "Graves", mid: "Medios", high: "Agudos" };
const INITIAL_BANDS = { low: 58, mid: 38, high: 64 };
const SIGNAL_LENGTH = 3;

function wavePath(interference) {
  const noise = interference / 100;
  return Array.from({ length: 150 }, (_, index) => {
    const t = index / 149;
    const pulse = [0.14, .35, .57, .79].reduce((sum, beat) =>
      sum + Math.exp(-Math.pow((t - beat) * 46, 2)), 0);
    const jagged = Math.sin(index * 6.2) * 13 + Math.sin(index * 17.7) * 7;
    const y = 70 - Math.sin(index * .8) * (9 + pulse * 35) - jagged * noise;
    return (index ? "L" : "M") + (t * 640).toFixed(1) + " " + y.toFixed(1);
  }).join(" ");
}

function makeSignal(context, reverse, interference) {
  const length = Math.floor(context.sampleRate * SIGNAL_LENGTH);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < length; index++) {
    const time = index / context.sampleRate;
    const pulse = [.43, 1.05, 1.69, 2.31].reduce((sum, beat) =>
      sum + Math.exp(-Math.pow((time - beat) * 15, 2)), 0);
    const carrier = Math.sin(time * Math.PI * 2 * 110) * .13 +
      Math.sin(time * Math.PI * 2 * 220) * .07;
    const staticNoise = Math.sin(index * 1.721) * Math.sin(index * .337) * .11 * interference;
    samples[reverse ? length - 1 - index : index] = (carrier + pulse * .18 + staticNoise) * .72;
  }
  return buffer;
}

export default function StudioSignalAnalyzer({ progress, paused, onMilestone, onBack }) {
  const [bands, setBands] = useState(INITIAL_BANDS);
  const [hint, setHint] = useState(0);
  const [playing, setPlaying] = useState(null);
  const [playhead, setPlayhead] = useState(0);
  const [audioNotice, setAudioNotice] = useState("");
  const audioRef = useRef({ context: null, source: null, frame: 0 });
  const closeRef = useRef(null);
  const cleaned = progress.signalAnalysisCompleted;
  const decoded = progress.reversedSignalDecoded;
  const interference = signalInterference(bands);
  const ready = isSignalClean(bands);
  const wave = useMemo(() => wavePath(cleaned ? 0 : interference), [cleaned, interference]);

  function stopPlayback() {
    const audio = audioRef.current;
    cancelAnimationFrame(audio.frame);
    if (audio.source) {
      audio.source.onended = null;
      try { audio.source.stop(); } catch { /* The fragment ended naturally. */ }
      audio.source.disconnect();
      audio.source = null;
    }
    setPlaying(null);
    setPlayhead(0);
  }
  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { if (paused) stopPlayback(); }, [paused]);
  useEffect(() => () => {
    const audio = audioRef.current;
    cancelAnimationFrame(audio.frame);
    if (audio.source) { audio.source.onended = null; try { audio.source.stop(); } catch { /* Finished. */ } audio.source.disconnect(); }
    audio.context?.close().catch(() => {});
  }, []);

  async function play(reverse = false) {
    if (paused) return;
    stopPlayback();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      setAudioNotice("El audio no está disponible. Las pistas visuales y los subtítulos siguen activos.");
      if (reverse) onMilestone("reverse");
      return;
    }
    try {
      const audio = audioRef.current;
      audio.context ||= new AudioContext();
      await audio.context.resume();
      const source = audio.context.createBufferSource();
      source.buffer = makeSignal(audio.context, reverse, cleaned ? 0 : interference / 100);
      const gain = audio.context.createGain();
      gain.gain.value = .22;
      source.connect(gain).connect(audio.context.destination);
      audio.source = source;
      const started = audio.context.currentTime;
      source.onended = () => { if (audio.source === source) { audio.source = null; setPlaying(null); setPlayhead(0); source.disconnect(); gain.disconnect(); } };
      source.start();
      setPlaying(reverse ? "reverse" : "forward");
      const tick = () => {
        if (audio.source !== source) return;
        setPlayhead(Math.min(1, (audio.context.currentTime - started) / SIGNAL_LENGTH));
        audio.frame = requestAnimationFrame(tick);
      };
      audio.frame = requestAnimationFrame(tick);
      if (reverse) onMilestone("reverse");
    } catch {
      setAudioNotice("No se pudo iniciar el audio. Podés continuar usando las pistas visuales.");
      if (reverse) onMilestone("reverse");
    }
  }

  function askHugo() {
    if (hint < 2) setHint(hint + 1);
    else { setHint(3); setBands({ ...SIGNAL_TARGET }); }
  }

  return <div className="record-store-conversation-overlay studio-signal-overlay">
    <section className="studio-signal-analyzer" role="dialog" aria-modal="true" aria-label="Analizador de la señal 09">
      <header className="studio-signal-titlebar">
        <div><small>NEON RECORDING STUDIO / 1999</small><strong>ANALIZADOR DE SEÑAL 09</strong></div>
        <button ref={closeRef} type="button" onClick={onBack} aria-label="Cerrar analizador">&times;</button>
      </header>
      <div className="studio-signal-menubar">ARCHIVO &nbsp; EDICIÓN &nbsp; FILTROS &nbsp; TRANSPORTE &nbsp; AYUDA <span>SESIÓN: F09_SIGNAL.WAV</span></div>
      <div className="studio-signal-body">
        <div className="studio-signal-screen">
          <div className="studio-signal-screen-top"><span>MONO / PCM / 00:03</span><span>{playing ? "REPRODUCIENDO" : cleaned ? "SEÑAL AISLADA" : "INTERFERENCIA DETECTADA"}</span></div>
          <svg viewBox="0 0 640 140" role="img" aria-label={cleaned ? "Forma de onda con cuatro pulsos claros" : "Forma de onda con interferencia"}>
            <path d="M0 70 H640" className="studio-signal-centerline" />
            <path d={wave} className="studio-signal-wave" />
            <path d={wave} className="studio-signal-wave-mirror" transform="translate(0 140) scale(1 -1)" />
            <line x1={playhead * 640} y1="0" x2={playhead * 640} y2="140" className="studio-signal-playhead" />
          </svg>
          <div className="studio-signal-screen-bottom"><span>CANAL 01 / ENTRADA DESCONOCIDA</span><span>{decoded ? "0 — 9 — 0 — 9" : "PATRÓN: NO IDENTIFICADO"}</span></div>
        </div>
        <div className="studio-signal-transport">
          <button type="button" onClick={() => play(false)} disabled={paused}>Escuchar fragmento</button>
          <button type="button" onClick={stopPlayback} disabled={!playing}>Detener</button>
          <span>La señal de esta misión es sintética; no proviene de una grabación real.</span>
        </div>
        <div className="studio-signal-console">
          <fieldset><legend>ECUALIZADOR / TRES BANDAS</legend>
            <p>Hugo: "Los graves tapan el pulso, los agudos traen estática. Conservá los medios."</p>
            {Object.entries(BAND_LABELS).map(([key, label]) => <label key={key}>
              <span>{label}</span><input type="range" min="0" max="100" value={bands[key]}
                onChange={(event) => setBands({ ...bands, [key]: Number(event.target.value) })}
                aria-label={label} disabled={paused} /><output>{bands[key]}%</output>
            </label>)}
            <div className="studio-signal-hint">{hint >= 1 && <p>Hugo: "Bajá graves y agudos; dejá los medios bastante arriba."</p>}
              {hint >= 2 && <p>Referencia del medidor: graves 20-30, medios 65-75, agudos 30-40.</p>}
              <button type="button" onClick={askHugo} disabled={paused || hint === 3}>{hint >= 2 ? "Hugo: mostrar ajuste" : "Pedir pista a Hugo"}</button>
            </div>
          </fieldset>
          <div className="studio-signal-result">
            <small>INTERFERENCIA</small><div className="studio-signal-meter" role="meter" aria-label="Interferencia" aria-valuenow={cleaned ? 0 : interference} aria-valuemin={0} aria-valuemax={100}><i style={{ width: (cleaned ? 0 : interference) + "%" }} /></div>
            <strong>{cleaned ? "SEÑAL RECUPERADA" : ready ? "PATRÓN ESTABLE / LISTO PARA AISLAR" : "AJUSTÁ LAS TRES BANDAS"}</strong>
            <button type="button" onClick={() => onMilestone("analyze")} disabled={paused || cleaned || !ready}>AISLAR SEÑAL</button>
            <button type="button" onClick={() => play(true)} disabled={paused || !cleaned}>REPRODUCIR AL REVÉS</button>
            {decoded && <div className="studio-signal-decoded" aria-live="polite"><small>TRANSMISIÓN / 0 — 9 — 0 — 9</small><p>NO VIENE DEL OTRO LADO...</p><strong>LA PUERTA YA ESTÁ ABIERTA.</strong><span>Estas palabras son subtítulos del capítulo; la señal generada no contiene una voz.</span></div>}
            {audioNotice && <p role="status">{audioNotice}</p>}
          </div>
        </div>
      </div>
      <footer><span>F09 / ANALIZADOR DE ESPECTRO / 1999</span><button type="button" onClick={onBack}>Volver al archivo</button></footer>
    </section>
  </div>;
}
