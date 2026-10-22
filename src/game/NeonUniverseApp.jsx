import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Disc3, Expand, HardDrive, MapPinned, Pause, Play, Settings2, Sparkles } from "lucide-react";
import DiscographyStore from "./DiscographyStore.jsx";
import { createNewUniverseGame, latestUniverseSave, readUniverseSavesWithLegacy, writeUniverseSave } from "./neonUniverseSaves.js";
import logoImage from "../assets/neonboy-logo.png";
import introVideo from "../assets/neonboy-animaciones/videos/intro.mp4";
import mapImage from "../assets/neonboy-animaciones/imagenes/Mapa nocturno de ciudad musical neón.png";
import "./neonUniverseApp.css";

const OPTIONS_KEY = "neonboy.universe.options.v1";
const SLOT_LABELS = { autosave: "Autoguardado", "slot-1": "Partida 1", "slot-2": "Partida 2", "slot-3": "Partida 3" };
const SCENE_LABELS = { store: "Tienda de Discos", studio: "Neon Recording Studio", club: "Club de Rock 1999" };

function readMotionSetting() {
  try { return JSON.parse(localStorage.getItem(OPTIONS_KEY) || "null")?.motion !== false; }
  catch { return true; }
}

function dateLabel(timestamp) {
  try { return new Date(timestamp).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }); }
  catch { return "Fecha desconocida"; }
}

function UniverseBrand({ small = false }) {
  return <div className={`universe-brand${small ? " is-small" : ""}`}>
    <img src={logoImage} alt="NEONBOY" />
    <span>UNIVERSE</span>
  </div>;
}

export default function NeonUniverseApp({ embedded = false }) {
  const [screen, setScreen] = useState("intro");
  const [introReady, setIntroReady] = useState(false);
  const [introVideoFailed, setIntroVideoFailed] = useState(false);
  const [menuPage, setMenuPage] = useState("main");
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pausePage, setPausePage] = useState("main");
  const [confirm, setConfirm] = useState(null);
  const [notice, setNotice] = useState("");
  const [slots, setSlots] = useState(() => readUniverseSavesWithLegacy());
  const [session, setSession] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [motion, setMotion] = useState(readMotionSetting);
  const gameApiRef = useRef(null);
  const focusRef = useRef(null);
  const latest = latestUniverseSave(slots);

  const autosave = useCallback((data) => {
    if (!data) return;
    const result = writeUniverseSave("autosave", data);
    if (result.ok) setSlots(result.slots);
    else setNotice("No se pudo guardar. Revisá el espacio disponible del navegador.");
  }, []);

  function launch(data) {
    setSession(data);
    setSessionKey((value) => value + 1);
    setPauseOpen(false);
    setPausePage("main");
    setMenuPage("main");
    setConfirm(null);
    setScreen("game");
  }

  function startNewGame() {
    const data = createNewUniverseGame();
    const result = writeUniverseSave("autosave", data);
    if (result.ok) setSlots(result.slots);
    else setNotice("La partida comenzó, pero el navegador no permitió guardarla.");
    launch(data);
  }

  function requestNewGame() {
    if (!latest) { startNewGame(); return; }
    setConfirm({
      title: "¿Empezar una partida nueva?",
      text: "Se reemplazarán el autoguardado y el progreso actual. Las tres partidas manuales se conservarán.",
      action: startNewGame,
    });
  }

  function loadSlot(id) {
    const entry = slots[id];
    if (!entry) return;
    launch(entry.data);
  }

  function saveSlot(id) {
    const data = gameApiRef.current?.getSnapshot?.();
    if (!data) return;
    const perform = () => {
      const result = writeUniverseSave(id, data);
      if (result.ok) {
        setSlots(result.slots);
        setNotice(`${SLOT_LABELS[id]} guardada.`);
        setPausePage("main");
      } else setNotice("No se pudo guardar. Revisá el espacio disponible del navegador.");
    };
    if (slots[id]) setConfirm({ title: `¿Sobrescribir ${SLOT_LABELS[id]}?`, text: "El contenido anterior de este slot será reemplazado.", action: perform });
    else perform();
  }

  function openIntro() {
    setIntroReady(false);
    setIntroVideoFailed(false);
    setScreen("intro");
  }

  function returnToMenu() {
    autosave(gameApiRef.current?.getSnapshot?.());
    setPauseOpen(false);
    setPausePage("main");
    setScreen("menu");
  }

  function requestPause(open) {
    if (!open && confirm) { setConfirm(null); return; }
    if (!open && pausePage !== "main") { setPausePage("main"); return; }
    setPauseOpen(open);
  }

  function returnFromSubpage() {
    if (screen === "game") setPausePage("main");
    else setMenuPage("main");
  }

  function setMenuMotion(enabled) {
    setMotion(enabled);
    try { localStorage.setItem(OPTIONS_KEY, JSON.stringify({ motion: enabled })); } catch { /* The menu still works without storage. */ }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { setNotice("El navegador no permitió cambiar a pantalla completa."); }
  }

  useEffect(() => {
    if (screen !== "intro" || introReady) focusRef.current?.focus();
  }, [screen, introReady, menuPage, pauseOpen, pausePage, confirm]);
  useEffect(() => {
    if (screen !== "intro" || introReady) return undefined;
    // Keep the menu accessible if playback stalls or autoplay is blocked.
    const timer = window.setTimeout(() => setIntroReady(true), 9000);
    return () => window.clearTimeout(timer);
  }, [screen, introReady]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if (screen === "intro" && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        if (introReady) setScreen("menu");
      } else if (screen === "menu" && event.key === "Escape") {
        if (confirm) setConfirm(null);
        else if (menuPage !== "main") setMenuPage("main");
        else openIntro();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, menuPage, confirm, introReady]);

  function slotsPanel(mode, inPause) {
    const ids = mode === "save" ? ["slot-1", "slot-2", "slot-3"] : ["autosave", "slot-1", "slot-2", "slot-3"];
    return <div className="universe-subpage">
      <button ref={mode === "load" ? focusRef : undefined} className="universe-back" type="button" onClick={returnFromSubpage}><ArrowLeft size={17} /> Volver</button>
      <h2>{mode === "save" ? "Guardar partida" : "Cargar partida"}</h2>
      <p>{mode === "save" ? "Elegí uno de los tres slots manuales. El autoguardado funciona mientras jugás." : "Elegí una partida para regresar a ese momento del universo."}</p>
      <div className="universe-slot-list">{ids.map((id, index) => {
        const entry = slots[id];
        return <button key={id} type="button" ref={mode === "save" && index === 0 ? focusRef : undefined} disabled={mode === "load" && !entry}
          onClick={() => mode === "save" ? saveSlot(id) : loadSlot(id)} className="universe-slot">
          <HardDrive size={20} />
          <span><strong>{SLOT_LABELS[id]}</strong><small>{entry ? `${SCENE_LABELS[entry.data.scene]} · ${dateLabel(entry.savedAt)}` : "Vacío"}</small></span>
          <em>{mode === "save" ? entry ? "SOBRESCRIBIR" : "GUARDAR" : entry ? "CARGAR" : "SIN PARTIDA"}</em>
        </button>;
      })}</div>
      {inPause && <small className="universe-slot-note">Escape vuelve al menú de pausa.</small>}
    </div>;
  }

  function optionsPanel() {
    return <div className="universe-subpage">
      <button className="universe-back" type="button" onClick={returnFromSubpage}><ArrowLeft size={17} /> Volver</button>
      <h2>Opciones</h2>
      <p>Configuración de pantalla y controles.</p>
      <button ref={focusRef} type="button" className="universe-option" onClick={() => setMenuMotion(!motion)}>
        <Sparkles size={19} /> Animación del menú <strong>{motion ? "ACTIVADA" : "REDUCIDA"}</strong>
      </button>
      <button type="button" className="universe-option" onClick={toggleFullscreen}><Expand size={19} /> Pantalla completa <strong>CAMBIAR</strong></button>
      <p className="universe-controls">WASD caminar · Arrastrar mirar · Espacio saltar · V cambiar vista · E interactuar · M mapa · I inventario · Esc pausa</p>
    </div>;
  }

  function creditsPanel() {
    return <div className="universe-subpage">
      <button ref={focusRef} className="universe-back" type="button" onClick={returnFromSubpage}><ArrowLeft size={17} /> Volver</button>
      <h2>Créditos</h2>
      <div className="universe-credits">
        <p><strong>NeonBoy</strong><span>Universo, personaje y música</span></p>
        <p><strong>Hugo Mendez</strong><span>Música y colaboración artística</span></p>
        <p><strong>Neon Studio</strong><span>Plataforma creativa</span></p>
        <p><strong>Próximas colaboraciones</strong><span>Este espacio crecerá con el universo.</span></p>
      </div>
    </div>;
  }

  function pausePanel() {
    if (pausePage === "save" || pausePage === "load") return slotsPanel(pausePage, true);
    if (pausePage === "options") return optionsPanel();
    return <div className="universe-main-actions">
      <h2>PAUSA</h2>
      <button ref={focusRef} type="button" onClick={() => setPauseOpen(false)}><Play size={18} /> Continuar <ArrowRight size={16} /></button>
      <button type="button" onClick={() => setPausePage("save")}><HardDrive size={18} /> Guardar partida <ArrowRight size={16} /></button>
      <button type="button" onClick={() => setPausePage("load")}><BookOpen size={18} /> Cargar partida <ArrowRight size={16} /></button>
      <button type="button" onClick={() => { setPauseOpen(false); gameApiRef.current?.openMap?.(); }}><MapPinned size={18} /> Ir al mapa <ArrowRight size={16} /></button>
      <button type="button" onClick={() => setPausePage("options")}><Settings2 size={18} /> Opciones <ArrowRight size={16} /></button>
      <button type="button" onClick={returnToMenu}><ArrowLeft size={18} /> Menú principal <ArrowRight size={16} /></button>
    </div>;
  }

  if (screen === "game") return <div className={"universe-game-root" + (embedded ? " is-embedded" : "")}>
    <DiscographyStore key={sessionKey} standalone initialSession={session} gameApiRef={gameApiRef}
      onAutosave={autosave} paused={pauseOpen} onPause={requestPause} onClose={returnToMenu} />
    {!pauseOpen && <button type="button" className="universe-pause-trigger" onClick={() => setPauseOpen(true)} aria-label="Pausar juego"><Pause size={18} /> PAUSA</button>}
    {pauseOpen && <div className="universe-overlay" onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const buttons = [...event.currentTarget.querySelectorAll("button:not(:disabled)")].filter((button) => button.getClientRects().length);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}><section className="universe-panel is-pause" role="dialog" aria-modal="true" aria-label="Menú de pausa">
      <UniverseBrand small />{pausePanel()}
    </section></div>}
    {notice && <div className="universe-notice" role="status" onClick={() => setNotice("")}>{notice}</div>}
    {confirm && confirmation()}
  </div>;

  function confirmation() {
    return <div className="universe-confirm-backdrop"><section className="universe-confirm" role="alertdialog" aria-modal="true" aria-label={confirm.title}>
      <h2>{confirm.title}</h2><p>{confirm.text}</p>
      <div><button ref={focusRef} type="button" onClick={() => setConfirm(null)}>Cancelar</button>
        <button type="button" className="is-danger" onClick={() => { const action = confirm.action; setConfirm(null); action(); }}>Confirmar</button></div>
    </section></div>;
  }

  return <main className={["universe-shell", screen === "intro" ? "is-intro" : "", introReady ? "is-intro-ready" : "", motion ? "" : "is-motion-reduced", embedded ? "is-embedded" : ""].join(" ")}>
    {/* The map is the menu backdrop and also the fallback if the intro video fails. */}
    <img className="universe-backdrop-image" src={mapImage} alt="" aria-hidden="true" />
    {screen === "intro" && !introVideoFailed && <video className="universe-intro-video" src={introVideo} poster={mapImage} autoPlay muted playsInline preload="auto" aria-hidden="true"
      onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 2) setIntroReady(true); }}
      onEnded={(event) => { event.currentTarget.pause(); setIntroReady(true); }}
      onError={() => { setIntroVideoFailed(true); setIntroReady(true); }} />}
    <div className="universe-backdrop-shade" />
    <div className="universe-atmosphere" aria-hidden="true" />
    <span className="universe-edition">NEONBOY · EST. 1999</span>
    {screen === "intro" ? <div className={"universe-intro" + (introReady ? " is-revealed" : "")}>
      <UniverseBrand />
      <p>La música abre las puertas de la ciudad.</p>
      <button ref={focusRef} type="button" className="universe-start" disabled={!introReady} onClick={() => setScreen("menu")}>Presioná Enter o hacé clic para comenzar <ArrowRight size={20} /></button>
    </div> : <section className="universe-panel is-main" aria-label="Menú principal NeonBoy Universe">
      <UniverseBrand small />
      {menuPage === "load" ? slotsPanel("load", false) : menuPage === "options" ? optionsPanel() : menuPage === "credits" ? creditsPanel() :
        <div className="universe-main-actions">
          <span className="universe-panel-kicker"><Disc3 size={16} /> EL UNIVERSO TE ESPERA</span>
          <button ref={latest ? focusRef : undefined} type="button" disabled={!latest} onClick={() => launch(latest.data)}><Play size={18} /> Continuar <ArrowRight size={16} /></button>
          {!latest && <small className="universe-no-save">Todavía no hay una partida para continuar.</small>}
          <button ref={!latest ? focusRef : undefined} type="button" onClick={requestNewGame}><Sparkles size={18} /> Nueva partida <ArrowRight size={16} /></button>
          <button type="button" onClick={() => setMenuPage("load")}><HardDrive size={18} /> Cargar partida <ArrowRight size={16} /></button>
          <button type="button" onClick={() => setMenuPage("options")}><Settings2 size={18} /> Opciones <ArrowRight size={16} /></button>
          <button type="button" onClick={() => setMenuPage("credits")}><BookOpen size={18} /> Créditos <ArrowRight size={16} /></button>
          <button type="button" onClick={openIntro}><ArrowLeft size={18} /> Salir <ArrowRight size={16} /></button>
        </div>}
    </section>}
    {notice && <div className="universe-notice" role="status" onClick={() => setNotice("")}>{notice}</div>}
    {confirm && confirmation()}
    <span className="universe-footer-note">TIENDA · ESTUDIO · CLUB DE ROCK</span>
  </main>;
}
