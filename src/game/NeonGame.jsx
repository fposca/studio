import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Axe, Camera, Coins, Crosshair, Disc3, FolderOpen, Footprints, Gem, Hammer, Hand, Heart, Home, Loader2, LockKeyhole, Maximize, MessageCircle, Minimize, Moon, Pause, Play, RotateCcw, Save, ScrollText, Skull, Sun, Sunset, Sword, Trophy, Volume2, VolumeX } from "lucide-react";
import { createNeonGame } from "./createNeonGame.js";
import GameLevelIntro from "./GameLevelIntro.jsx";
import DiscographyStore from "./DiscographyStore.jsx";
import { LEVELS } from "./gameLevels.js";
import neonboyLogoUrl from "../assets/neonboy-logo.png";
import introVideoUrl from "../assets/neonboy-animaciones/nueva-intro.mp4";
import dragonAvatarUrl from "./avatars/dragon.svg";
import platonAvatarUrl from "./avatars/platon.svg";
import { MAX_HEALTH, WEAPONS } from "./gameRules.js";
import { GAME_SAVE_KEY, readGameSave, writeGameSave } from "./gameSave.js";
import "./neonGame.css";

const WEAPON_ICONS = { unarmed: Hand, sword: Sword, crossbow: Crosshair, axe: Axe, hammer: Hammer };

function GameButton({ label, children, ...props }) {
  return <button aria-label={label} title={label} type="button" {...props}>{children}</button>;
}

function Joystick({ onMove, disabled }) {
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const pointer = useRef(null);
  function move(event) {
    if (disabled || pointer.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2, dy = event.clientY - rect.top - rect.height / 2;
    const radius = rect.width * 0.32, length = Math.max(radius, Math.hypot(dx, dy));
    const x = dx / length, y = dy / length;
    setStick({ x: x * radius, y: y * radius });
    onMove(x, y);
  }
  function reset() { pointer.current = null; setStick({ x: 0, y: 0 }); onMove(0, 0); }
  useEffect(() => { if (disabled) reset(); }, [disabled]);
  return <div className="neon-game-joystick" role="group" aria-label="Mover Neonboy"
    onPointerDown={(event) => { if (disabled) return; pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); move(event); }}
    onPointerMove={move} onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset}>
    <span className="neon-game-stick" style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }} />
  </div>;
}

export default function NeonGame({ onReady }) {
  const canvasRef = useRef(null), videoRef = useRef(null), shellRef = useRef(null), gameRef = useRef(null), onReadyRef = useRef(onReady);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [openingAudioEnabled, setOpeningAudioEnabled] = useState(false);
  const [openingNeedsPlay, setOpeningNeedsPlay] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [slot, setSlot] = useState(() => readGameSave());
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showDiscography, setShowDiscography] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [state, setState] = useState({ phase: "opening", health: MAX_HEALTH, coins: 0, total: 24, score: 0, discoveries: 0, discoveryTotal: 2, discovery: null, enemies: 4, defeated: 0, time: 0, status: "playing", paused: false, period: "night", level: 1, levelName: "El Partenon", inventory: ["unarmed"], equipped: "unarmed" });
  useEffect(() => {
    const controller = new AbortController();
    setReady(false);
    setError("");
    setConfirmation(null);
    setProgress(5);
    createNeonGame({ canvas: canvasRef.current, signal: controller.signal,
      onProgress: (value) => { if (!controller.signal.aborted) setProgress(value); },
      onChange: (value) => { if (!controller.signal.aborted) setState(value); },
      onError: (caught) => { if (!controller.signal.aborted) { console.error(caught); setError(caught.message || "No se pudo iniciar el juego."); } }
    }).then((game) => {
      if (!game || controller.signal.aborted) return;
      gameRef.current = game;
      setReady(true);
      canvasRef.current?.focus();
      onReadyRef.current?.(game);
    }).catch((caught) => {
      if (!controller.signal.aborted) { console.error(caught); setError(caught.name === "WebGLUnavailableError" ? caught.message : "No se pudieron cargar el escenario o los personajes."); }
    });
    return () => { controller.abort(); gameRef.current = null; };
  }, [attempt]);
  useEffect(() => { gameRef.current?.setMuted(muted); }, [muted, ready]);
  useEffect(() => {
    if (!ready || state.phase !== "opening") return;
    let active = true;
    videoRef.current?.play()?.catch(() => { if (active) setOpeningNeedsPlay(true); });
    return () => { active = false; };
  }, [ready, state.phase]);
  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  useEffect(() => {
    const change = (event) => { if (event.key === GAME_SAVE_KEY || event.key === null) setSlot(readGameSave()); };
    window.addEventListener("storage", change);
    return () => window.removeEventListener("storage", change);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const dialog = shellRef.current?.querySelector('[role="dialog"]');
    if (!dialog) return;
    const buttons = () => [...dialog.querySelectorAll("button:not(:disabled), a[href]")];
    buttons()[0]?.focus();
    const key = (event) => {
      if (confirmation && ["Escape", "KeyP"].includes(event.code)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.code === "Escape") cancelConfirmation();
      }
      if (event.key !== "Tab") return;
      const all = buttons(), index = all.indexOf(document.activeElement);
      event.preventDefault();
      all[(index + (event.shiftKey ? all.length - 1 : 1)) % all.length]?.focus();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [confirmation, state.discovery, state.dialogue, state.paused, state.status, state.phase, state.loadingLevel, ready, error]);
  const opening = state.phase === "opening";
  const title = state.phase === "title";
  const introducing = state.phase === "level-intro";
  const finishLevelIntro = useCallback(() => gameRef.current?.finishLevelIntro(), []);
  const blocked = !ready || Boolean(error) || opening || title || introducing || state.paused || state.loadingLevel || state.status !== "playing";
  const EquippedIcon = WEAPON_ICONS[state.equipped] || Hand;
  const equippedWeapon = WEAPONS.find((weapon) => weapon.id === state.equipped);
  function finishOpeningVideo() {
    videoRef.current?.pause();
    gameRef.current?.skipOpening();
  }
  function toggleOpeningAudio() {
    const enable = muted || !openingAudioEnabled;
    setOpeningAudioEnabled(enable);
    setMuted(!enable);
    if (videoRef.current) videoRef.current.muted = !enable;
    gameRef.current?.setMuted(!enable);
    if (enable) videoRef.current?.play()?.catch(() => setOpeningNeedsPlay(true));
  }
  function toggleFullscreen() {
    const request = document.fullscreenElement ? document.exitFullscreen?.() : shellRef.current?.requestFullscreen?.();
    request?.catch(() => {});
  }
  function hold(kind, event) {
    if (blocked) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gameRef.current?.hold(kind, true);
  }
  function save() {
    try {
      const saved = writeGameSave(gameRef.current.exportSave());
      setSlot({ save: saved, error: "" });
      setNotice("Partida guardada en este navegador.");
    } catch (caught) { setNotice(caught.message); }
  }
  async function load() {
    const current = readGameSave();
    setSlot(current);
    if (!current.save) { setNotice(current.error || "No hay una partida guardada."); return; }
    try { await gameRef.current.loadSave(current.save); setNotice("Partida cargada."); }
    catch (caught) { setNotice(caught.message); }
  }
  function requestAction(kind) {
    if (title || state.status !== "playing") { performAction(kind); return; }
    setConfirmation({ kind, wasPaused: state.paused });
    gameRef.current?.setPaused(true);
  }
  function performAction(kind) {
    setConfirmation(null);
    if (kind === "load") load();
    if (kind === "home") gameRef.current?.showTitle();
    if (kind === "restart") gameRef.current?.restart();
  }
  function cancelConfirmation() {
    const resume = confirmation && !confirmation.wasPaused;
    setConfirmation(null);
    if (resume) { gameRef.current?.setPaused(false); canvasRef.current?.focus(); }
  }
  return <section ref={shellRef} className="neon-game" aria-label={`Neonboy: ${state.levelName}`}>
    <canvas key={attempt} ref={canvasRef} className={`neon-game-canvas${state.damage && !blocked ? " is-hit" : ""}`} tabIndex={0} aria-label="Escenario 3D de Neonboy" />
    {ready && !error && opening && <div className="neon-game-opening" aria-label="Cinematica de apertura">
      <video ref={videoRef} className="neon-game-opening-video" src={introVideoUrl} autoPlay muted={!openingAudioEnabled || muted}
        playsInline preload="auto" aria-label="Intro de Neonboy" onEnded={finishOpeningVideo} onError={finishOpeningVideo} />
      {openingNeedsPlay && <button className="neon-game-opening-play" type="button" onClick={() => {
        videoRef.current?.play()?.then(() => setOpeningNeedsPlay(false)).catch(() => setOpeningNeedsPlay(true));
      }}><Play size={22} /> Reproducir intro</button>}
      <div className="neon-game-opening-tools"><GameButton label={muted || !openingAudioEnabled ? "Activar sonido" : "Silenciar"}
        onClick={toggleOpeningAudio}>{muted || !openingAudioEnabled ? <VolumeX size={18} /> : <Volume2 size={18} />}</GameButton></div>
      <button autoFocus className="neon-game-opening-skip" type="button" onClick={finishOpeningVideo}>Omitir cinematica <ArrowRight size={16} /></button>
    </div>}
    {ready && !error && !state.loadingLevel && title && <div className="neon-game-title">
      <div className="neon-game-title-brand"><h1 aria-label="NeonBoy"><img src={neonboyLogoUrl} alt="" /></h1><p lang="en">Ancient nightmare</p></div>
      <div className="neon-game-title-tools">
        <GameButton label={muted ? "Activar sonido" : "Silenciar"} aria-pressed={muted} onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</GameButton>
        <GameButton label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"} onClick={toggleFullscreen}>{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</GameButton>
      </div>
      <div className="neon-game-title-actions">
        <div className="neon-game-level-picker" role="group" aria-label="Elegir escenario">
          <span>Eleg� un escenario</span>
          <div>{LEVELS.map((level) => <button key={level.id} type="button"
            aria-label={`Nivel ${level.id}: ${level.name}`} aria-pressed={selectedLevel === level.id}
            onClick={() => setSelectedLevel(level.id)}><strong>NIVEL {String(level.id).padStart(2, "0")}</strong><small>{level.name}</small></button>)}
            <button className="neon-game-discography-option" type="button" aria-label="Escenario extra: Tienda de discos" aria-pressed={selectedLevel === "discography"} onClick={() => setSelectedLevel("discography")}><Disc3 size={18} /><strong>ESCENARIO EXTRA</strong><small>Tienda de discos · Halloween</small></button></div>
        </div>
        <button className="neon-game-play" type="button" onClick={() => { setNotice(""); if (selectedLevel === "discography") setShowDiscography(true); else gameRef.current?.start(selectedLevel); }}>{selectedLevel === "discography" ? <Disc3 size={22} /> : <Play size={22} fill="currentColor" />}{selectedLevel === "discography" ? "Entrar a la tienda" : "Play"}</button>

        <button type="button" disabled={!slot.save} onClick={load}><FolderOpen size={18} /> Cargar partida</button>
        <span className="neon-game-save-meta">{slot.save ? `Nivel ${slot.save.world.level} - ${slot.save.world.coins.length} monedas - ${new Date(slot.save.savedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}` : slot.error || "Sin partida guardada"}</span>
      </div>
    </div>}
    {ready && !error && title && showDiscography && <DiscographyStore onClose={() => setShowDiscography(false)} />}
    {!opening && !title && !introducing && <>
    {state.health <= 25 && state.health > 0 && !blocked && <div className="neon-game-critical" aria-hidden="true" />}
    {state.damage && !state.paused && !state.loadingLevel && <div key={state.damage.id} className="neon-game-damage" aria-hidden="true" />}
    <div className={`neon-game-hud${state.health <= 25 ? " is-danger" : ""}`}>
      <div className={`neon-game-vitals${state.damage ? " is-hit" : ""}`}>
        <div className="neon-game-name"><Heart size={21} fill="currentColor" /><strong>VIDA</strong><span>NEONBOY</span></div>
        <div className="neon-game-health-reading"><strong>{state.health}<small> / {MAX_HEALTH}</small></strong>
          {state.damage ? <span key={state.damage.id} className="neon-game-health-damage" aria-label="Vida perdida">-{state.damage.amount}</span> :
            <span className="neon-game-health-status">{state.health <= 25 ? "VIDA CRITICA" : state.health <= 50 ? "HERIDO" : ""}</span>}
        </div>
        <div className="neon-game-health" role="progressbar" aria-label="Vida" aria-valuenow={state.health} aria-valuemin={0} aria-valuemax={MAX_HEALTH}>
          {state.damage && <span key={state.damage.id} className="neon-game-health-loss" style={{ "--health-from": `${state.damage.previousHealth}%`, "--health-to": `${state.health}%` }} />}
          <i style={{ width: `${state.health}%` }} />
        </div>
      </div>
      <div className="neon-game-objective"><span>NIVEL {state.level} - {state.levelName.toUpperCase()}</span><strong><Coins size={22} /> {state.coins}<small> / {state.total}</small></strong><span className="neon-game-score"><Gem size={13} /> {state.score} pts <span>Hallazgos {state.discoveries}/{state.discoveryTotal}</span></span><span className="neon-game-enemies"><Skull size={13} /> {state.defeated} / {state.enemies}</span></div>
      <div className="neon-game-tools">
        <div className="neon-game-period" role="group" aria-label="Hora del dia">
          {[['day', 'Dia', Sun], ['sunset', 'Atardecer', Sunset], ['night', 'Noche', Moon]].map(([id, label, Icon]) => <GameButton key={id} label={label} disabled={!ready || Boolean(error)} aria-pressed={state.period === id} onClick={() => gameRef.current?.setPeriod(id)}><Icon size={17} /></GameButton>)}
        </div>
        <GameButton label={state.firstPerson ? "Ver en tercera persona (V)" : "Ver en primera persona (V)"} aria-pressed={state.firstPerson} disabled={!ready || Boolean(error) || state.loadingLevel} onClick={() => gameRef.current?.toggleView()}><Camera size={18} /></GameButton>
        <GameButton label={state.paused ? "Continuar (P)" : "Pausar (P)"} disabled={!ready || Boolean(error) || state.status !== "playing"} onClick={() => gameRef.current?.setPaused()}>{state.paused ? <Play size={18} /> : <Pause size={18} />}</GameButton>
        <GameButton label="Guardar partida" disabled={!ready || Boolean(error) || state.status !== "playing"} onClick={save}><Save size={18} /></GameButton>
        <GameButton label="Cargar partida" disabled={!ready || Boolean(error) || !slot.save} onClick={() => requestAction("load")}><FolderOpen size={18} /></GameButton>
        <GameButton label="Reiniciar partida" disabled={!ready || Boolean(error)} onClick={() => requestAction("restart")}><RotateCcw size={18} /></GameButton>
        <GameButton label={muted ? "Activar sonido" : "Silenciar"} aria-pressed={muted} onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</GameButton>
        <GameButton label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"} onClick={toggleFullscreen}>{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</GameButton>
      </div>
      {state.quest && <div className="neon-game-mission"><ScrollText size={15} /><span>{state.quest.text}</span><small>Secretos {state.secrets}/{state.secretTotal}</small></div>}
      {state.boss && !state.boss.active && state.guardsRemaining > 0 && state.status === "playing" &&
        <div className="neon-game-mission neon-game-boss-gate"><Skull size={15} /><span>Derrota a los enemigos para atraer al jefe.</span><small>{state.guardsRemaining} restantes</small></div>}
    {state.level === 4 && <div className="neon-game-mission"><Crosshair size={15} /><span>Ballesta: {state.ammo}/{state.maxAmmo} flechas. Dispara a las runas y busca municion.</span><small>Secretos {state.secrets}/{state.secretTotal}</small></div>}
    {state.boss?.active && state.boss.health > 0 && state.status === "playing" && <div className="neon-game-boss">
      <div><strong>{state.boss.name}</strong><span>{state.boss.health} / {state.boss.maxHealth}</span></div>
      <div className="neon-game-boss-health" role="progressbar" aria-label="Vida del jefe" aria-valuemin={0}
        aria-valuemax={state.boss.maxHealth} aria-valuenow={state.boss.health}><i style={{ width: `${state.boss.health / state.boss.maxHealth * 100}%` }} /></div>
      <small>{state.level === 2 ? "Camara del sello" : state.level === 3 ? "Osario final" : state.level === 4 ? "Cripta final" : "Frente al templo"} - {state.boss.distance} m
        {state.level === 3 && state.boss.attack && ` - ${state.boss.attack === "zombieSweep" ? "Barrido" : "Golpe aplastante"}`}</small>
    </div>}
    </div>
    {state.pickup && <div className="neon-game-pickup" role="status"><EquippedPickup weapon={state.pickup} /></div>}
    {state.ammoNotice && <div className="neon-game-ammo-notice" role="status">Flechas recogidas: {state.ammo}/{state.maxAmmo}</div>}
    {(state.firstPerson || state.equipped === "crossbow") && state.phase === "game" && state.status === "playing" && !state.paused && !state.dialogue && !state.discovery && <div className={`neon-game-reticle${state.firstPerson ? " is-first-person" : ""}`} style={{ left: `${state.reticle?.x ?? 50}%`, top: `${state.reticle?.y ?? 48}%` }} aria-label={state.equipped === "crossbow" ? "Mira de ballesta" : "Mira de combate"}><i />{state.equipped === "crossbow" && <b>{state.ammo} / {state.maxAmmo}</b>}</div>}
    {state.charge > 0 && !blocked && state.equipped !== "unarmed" &&
      <div className={`neon-game-charge${state.chargeReady ? " is-ready" : ""}`} role="progressbar" aria-label="Carga de poder"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.charge * 100)}>
        <span>{state.chargeReady ? "PODER LISTO · SOLTÁ PARA GOLPEAR" : "CARGANDO PODER VIOLETA"}</span>
        <div><i style={{ width: `${state.charge * 100}%` }} /></div>
      </div>}
    {state.firstPerson && !blocked && <div className="neon-game-view-hint"><strong>{equippedWeapon.name}</strong><span>{state.equipped === "unarmed" ? "Mouse: apuntar | Clic/J: atacar | V: vista | Esc: pausa" : "Mantené clic/J 2,5 s y soltá: golpe potente | V: vista"}</span></div>}
    <div className="neon-game-bottom">
      <Joystick disabled={blocked} onMove={(x, z) => gameRef.current?.move(x, z)} />
      <div className="neon-game-weapons" role="group" aria-label="Armas">
        {WEAPONS.map((weapon) => { const Icon = WEAPON_ICONS[weapon.id], owned = state.inventory.includes(weapon.id); return <GameButton key={weapon.id}
          label={owned ? `${weapon.name} (${weapon.key})` : `${weapon.name}: ${weapon.key ? "sin recoger" : "proximamente"}`}
          disabled={blocked || !owned} aria-pressed={state.equipped === weapon.id}
          onClick={() => gameRef.current?.equip(weapon.id)}
          className={!owned ? "is-locked" : state.equipped === weapon.id ? "is-equipped" : ""}><Icon size={23} />{!owned && <LockKeyhole className="neon-game-lock" size={10} />}</GameButton>; })}
      </div>
      <div className="neon-game-actions">
        <GameButton label="Saltar (Espacio)" disabled={blocked} onClick={() => gameRef.current?.action("jump")}><ArrowUp size={25} /></GameButton>
        <GameButton label="Patada (K)" disabled={blocked} onPointerDown={(event) => hold("kick", event)}
          onPointerUp={() => gameRef.current?.hold("kick", false)} onPointerCancel={() => gameRef.current?.hold("kick", false)} onLostPointerCapture={() => gameRef.current?.hold("kick", false)}
          onClick={(event) => { if (event.detail === 0) gameRef.current?.action("kick"); }}><Footprints size={23} /></GameButton>
        <GameButton label={`${state.equipped === "unarmed" ? "Punetazo" : equippedWeapon.name} (J o clic; mantené 2,5 s para cargar)`} className={`neon-game-primary-action${state.charge > 0 ? " is-charging" : ""}${state.chargeReady ? " is-ready" : ""}`} disabled={blocked} onPointerDown={(event) => hold("punch", event)}
          onPointerUp={() => gameRef.current?.hold("punch", false)} onPointerCancel={() => gameRef.current?.cancelHold("punch")} onLostPointerCapture={() => gameRef.current?.cancelHold("punch")}
          onClick={(event) => { if (event.detail === 0) gameRef.current?.action("punch"); }}><EquippedIcon size={27} /></GameButton>
      </div>
    </div>
    </>}
    {ready && !error && !state.loadingLevel && introducing && <GameLevelIntro key={state.level} level={state.level} name={state.levelName} onComplete={finishLevelIntro} />}
    {notice && <div className="neon-game-notice" role="status">{notice}</div>}
    {(!ready || error || state.loadingLevel) && <div className="neon-game-overlay" role={error ? "alert" : "status"}>
      <div className="neon-game-dialog">
        {error ? <><h2>No se pudo iniciar</h2><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}><RotateCcw size={17} /> Reintentar</button></>
          : <><Loader2 className="spin" size={27} /><h2>{state.loadingName || "El Partenon"}</h2><progress aria-label="Cargando partida" value={progress} max="100" /><span>{progress}%</span></>}
      </div>
    </div>}
    {ready && !error && !state.loadingLevel && !opening && !title && !introducing && !confirmation && state.dialogue && <div className="neon-game-overlay neon-game-conversation">
      <div key={state.dialogue.title} className={`neon-game-dialog neon-game-lore neon-game-friend-dialog ${state.dialogue.dragon ? "is-dragon" : "is-platon"}`} role="dialog" aria-modal="true" aria-labelledby="neon-game-dialogue-title">
        <div className="neon-game-dialog-avatar"><img src={state.dialogue.dragon ? dragonAvatarUrl : platonAvatarUrl} alt={state.dialogue.dragon ? "Retrato del dragon" : "Retrato de Platon"} /></div>
        <span className="neon-game-lore-kicker"><MessageCircle size={17} /> {state.dialogue.speaker}</span>
        <h2 id="neon-game-dialogue-title">{state.dialogue.title}</h2>
        <p>{state.dialogue.text}</p>
        <button type="button" onClick={() => gameRef.current?.answerDialogue()}><ArrowRight size={17} /> {state.dialogue.action}</button>
      </div>
    </div>}
    {ready && !error && !state.loadingLevel && !opening && !title && !introducing && !confirmation && !state.dialogue && state.discovery && <div className="neon-game-overlay">
      <div className="neon-game-dialog neon-game-lore" role="dialog" aria-modal="true" aria-labelledby="neon-game-lore-title">
        <span className="neon-game-lore-kicker"><ScrollText size={17} /> {state.discovery.questItem ? "OBJETO DE MISION" : state.discovery.secret ? "TESORO SECRETO" : "HALLAZGO HISTORICO"}</span>
        <h2 id="neon-game-lore-title">{state.discovery.title}</h2>
        <p>{state.discovery.text}</p>
        <strong className="neon-game-lore-points"><Gem size={18} /> +{state.discovery.points} puntos</strong>
        <button type="button" onClick={() => gameRef.current?.resumeDiscovery()}><Play size={17} /> Volver al juego</button>
        {state.discovery.url && <a href={state.discovery.url} target="_blank" rel="noreferrer">Fuente: {state.discovery.source}</a>}
      </div>
    </div>}
    {ready && !error && !state.loadingLevel && !opening && !title && !introducing && !confirmation && !state.discovery && !state.dialogue && (state.paused || state.status !== "playing") && <div className="neon-game-overlay">
      <div className="neon-game-dialog" role="dialog" aria-modal="true" aria-labelledby="neon-game-result">
        {state.status === "won" ? <Trophy size={36} className="neon-game-trophy" /> : state.status === "lost" ? <Heart size={32} /> : <Pause size={30} />}
        <h2 id="neon-game-result">{state.status === "won" ? "Tesoro recuperado" : state.status === "lost" ? "Neonboy ha caido" : "En pausa"}</h2>
        <div className="neon-game-results"><span><Coins size={18} /> {state.coins} / {state.total}</span><span><Skull size={18} /> {state.defeated} / {state.enemies}</span><span>{Math.floor(state.time / 60)}:{String(state.time % 60).padStart(2, "0")}</span></div>
        {state.paused && <button autoFocus type="button" onClick={() => { gameRef.current?.setPaused(false); canvasRef.current?.focus(); }}><Play size={17} /> Continuar</button>}
        {state.nextLevel && <button autoFocus type="button" onClick={() => gameRef.current?.nextLevel()}><ArrowRight size={17} /> Nivel {state.level + 1}: {state.nextLevelName}</button>}
        <div className="neon-game-save-actions">
          <button type="button" disabled={state.status !== "playing"} onClick={save}><Save size={17} /> Guardar</button>
          <button type="button" disabled={!slot.save} onClick={() => requestAction("load")}><FolderOpen size={17} /> Cargar</button>
        </div>
        <button type="button" onClick={() => requestAction("restart")}><RotateCcw size={17} /> Volver a empezar</button>
        <button type="button" onClick={() => requestAction("home")}><Home size={17} /> Inicio</button>
      </div>
    </div>}
    {confirmation && <div className="neon-game-overlay"><div className="neon-game-dialog" role="dialog" aria-modal="true" aria-labelledby="neon-game-confirm">
      <h2 id="neon-game-confirm">{confirmation.kind === "load" ? "Cargar partida?" : confirmation.kind === "home" ? "Volver al inicio?" : "Reiniciar partida?"}</h2>
      <p>Se perdera el progreso que no hayas guardado.</p>
      <button type="button" onClick={cancelConfirmation}>Cancelar</button>
      <button type="button" onClick={() => performAction(confirmation.kind)}>{confirmation.kind === "load" ? <FolderOpen size={17} /> : confirmation.kind === "home" ? <Home size={17} /> : <RotateCcw size={17} />} Confirmar</button>
    </div></div>}
  </section>;
}

function EquippedPickup({ weapon }) {
  const Icon = WEAPON_ICONS[weapon], name = WEAPONS.find((entry) => entry.id === weapon)?.name;
  return <><Icon size={20} /><span>{name} {["sword", "axe"].includes(weapon) ? "recogida" : "recogido"}</span></>;
}
