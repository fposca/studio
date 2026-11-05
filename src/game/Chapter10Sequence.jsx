import React, { useEffect, useState } from "react";
import "./chapter10.css";

const recordings = import.meta.glob("../assets/neonboy-animaciones/voces/**/*-cap10-*.mp3", { eager: true, query: "?url", import: "default" });
const voiceByFile = Object.fromEntries(Object.entries(recordings).map(([path, url]) => [path.split("/").at(-1).toLowerCase(), url]));

const SCENES = {
  core: [
    ["ARCHIVISTA", "Los tres focos fueron neutralizados. Pero hay algo que no encaja... La señal no se originó en esta dimensión.", "archivista-cap10-01.mp3"],
    ["NEONBOY", "¿Y ahora qué? ¿Otra nave? ¿Otra ciudad llena de robots?", "neonboy-cap10-01.mp3"],
    ["ARCHIVISTA", "No. Esta frecuencia es mucho más antigua. Y parece estar respondiendo a tu presencia.", "archivista-cap10-02.mp3"],
  ],
  hugo: [
    ["HUGO", "¿Te acordás de aquella grabación imposible? La que apareció cuando investigábamos la anomalía del Arcade...", "hugo-cap10-01.mp3"],
    ["NEONBOY", "Sí. Todavía no entiendo de dónde salió.", "neonboy-cap10-02.mp3"],
    ["HUGO", "Analicé la señal. Hay algo detrás de la música. Una frecuencia que no conseguimos identificar.", "hugo-cap10-02.mp3"],
    ["NEONBOY", "¿Y qué encontraste?", "neonboy-cap10-03.mp3"],
    ["HUGO", "Que alguien está utilizando esa frecuencia para abrir puertas entre realidades.", "hugo-cap10-03.mp3"],
    ["NEONBOY", "Entonces todo está conectado... La nave, el Partenón, la ciudad fracturada...", "neonboy-cap10-04.mp3"],
    ["HUGO", "Eso parece. Pero todavía nos falta una pieza. Y creo que está escondida en los fragmentos que trajiste.", "hugo-cap10-04.mp3"],
    ["HUGO", "Necesitamos reconstruir la señal original. Ayudame con la consola.", "hugo-cap10-05.mp3"],
  ],
  finale: [
    ["HUGO", "¡Ahí está! Los tres fragmentos están sincronizados.", "hugo-cap10-06.mp3"],
    ["NEONBOY", "¿Y de dónde viene esa frecuencia?", "neonboy-cap10-05.mp3"],
    ["HUGO", "No lo sé... Pero el sistema acaba de identificar una nueva dimensión.", "hugo-cap10-07.mp3"],
    ["NEONBOY", "Mostrame.", "neonboy-cap10-06.mp3"],
    ["VOZ DESCONOCIDA", "Atravesaste el tiempo. Desafiaste a la muerte. Venciste a tu propio reflejo... Pero todavía no conocés tu verdadero origen.", "voz-abismo-cap10-01.mp3"],
    ["NEONBOY", "Otro demonio con discursos... Qué novedad.", "neonboy-cap10-07.mp3"],
  ],
};

export default function Chapter10Sequence({ scene, onFinish }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const lines = SCENES[scene] || [];
  const line = lines[index];
  const next = () => index + 1 < lines.length ? setIndex(index + 1) : onFinish();
  useEffect(() => { setIndex(0); }, [scene]);
  useEffect(() => {
    if (!line) return undefined;
    const url = voiceByFile[line[2].toLowerCase()];
    const duration = Math.max(3200, Math.min(7200, line[1].length * 47));
    let timeout;
    let alive = true;
    let voice;
    const advance = () => { if (alive) setAutoAdvance(true); };
    setAutoAdvance(false);
    setPlaying(false);
    if (url) {
      voice = new Audio(url);
      voice.volume = 0.78;
      voice.onended = advance;
      voice.onerror = () => { timeout = window.setTimeout(advance, duration); };
      voice.play().then(() => { if (alive) setPlaying(true); }).catch(() => { timeout = window.setTimeout(advance, duration); });
    } else timeout = window.setTimeout(advance, duration);
    return () => { alive = false; window.clearTimeout(timeout); if (voice) { voice.pause(); voice.onended = null; voice.onerror = null; } };
  }, [scene, index]);
  useEffect(() => {
    if (!autoAdvance || scene === "complete") return undefined;
    const timer = window.setTimeout(() => {
      if (index + 1 < lines.length) setIndex(index + 1);
      else onFinish();
    }, 650);
    return () => window.clearTimeout(timer);
  }, [autoAdvance, scene, index]);
  if (scene === "complete") return <div className="chapter10-complete"><section role="dialog" aria-modal="true" aria-label="Capítulo 10 completado"><small>NEONBOY UNIVERSE / NUEVA DIMENSIÓN IDENTIFICADA</small><h2>CAPÍTULO 10 COMPLETADO</h2><p>LA FRECUENCIA DEL ABISMO</p><strong>INFRAMUNDO</strong><p>El portal respondió a la señal. La aventura continúa.</p><button type="button" onClick={onFinish}>CONTINUAR EXPLORANDO</button></section></div>;
  if (!line) return null;
  return <div className="chapter10-backdrop">
    <section className="chapter10-panel" role="dialog" aria-modal="true" aria-label="Capítulo 10: La frecuencia del Abismo">
      <header><small>NEONBOY UNIVERSE / CAPÍTULO 10</small><h2>LA FRECUENCIA DEL ABISMO</h2></header>
      <div className="chapter10-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="chapter10-readout" aria-live="polite">
        <span>{scene === "core" ? "HOLOGRAMA / SEÑAL DESCONOCIDA" : scene === "hugo" ? "NEON RECORDING STUDIO / ANÁLISIS" : "DESTINO IDENTIFICADO / INFRAMUNDO"}</span>
        <strong>FRECUENCIA: 666</strong><span>ORIGEN: {scene === "finale" ? "INFRAMUNDO" : "DIMENSIÓN NO IDENTIFICADA"}</span>
        <span>ESTADO: {scene === "finale" ? "ENLACE DIMENSIONAL DISPONIBLE" : "TRANSMISIÓN INCOMPLETA"}</span>
      </div>
      <div className="chapter10-subtitle"><small>{line[0]} · {String(index + 1).padStart(2, "0")}/{String(lines.length).padStart(2, "0")}</small><p>{line[1]}</p></div>
      <footer><span>{playing ? "VOZ EN REPRODUCCIÓN" : "SUBTÍTULOS / AUDIO PENDIENTE"}</span><button type="button" onClick={next}>{index + 1 === lines.length ? "Continuar" : autoAdvance ? "Siguiente ›" : "Siguiente / omitir ›"}</button></footer>
    </section>
  </div>;
}
