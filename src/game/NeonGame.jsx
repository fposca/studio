import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Axe, Coins, Crosshair, Footprints, Hammer, Hand, Heart, Loader2, LockKeyhole, Maximize, Minimize, Moon, Pause, Play, RotateCcw, Skull, Sun, Sunset, Sword, Trophy, Volume2, VolumeX } from "lucide-react";
import { createNeonGame } from "./createNeonGame.js";
import { MAX_HEALTH, WEAPONS } from "./gameRules.js";
import "./neonGame.css";

const WEAPON_ICONS = { unarmed: Hand, sword: Sword, hammer: Hammer, crossbow: Crosshair, axe: Axe };

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
  const canvasRef = useRef(null), shellRef = useRef(null), gameRef = useRef(null), onReadyRef = useRef(onReady);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [state, setState] = useState({ health: MAX_HEALTH, coins: 0, total: 24, enemies: 4, defeated: 0, time: 0, status: "playing", paused: false, period: "day", level: 1, levelName: "El Partenon", inventory: ["unarmed"], equipped: "unarmed" });
  useEffect(() => {
    const controller = new AbortController();
    setReady(false);
    setError("");
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
      if (!controller.signal.aborted) { console.error(caught); setError("No se pudieron cargar el escenario o los personajes."); }
    });
    return () => { controller.abort(); gameRef.current = null; };
  }, [attempt]);
  useEffect(() => { gameRef.current?.setMuted(muted); }, [muted, ready]);
  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  const blocked = !ready || Boolean(error) || state.paused || state.status !== "playing";
  const EquippedIcon = WEAPON_ICONS[state.equipped] || Hand;
  const equippedWeapon = WEAPONS.find((weapon) => weapon.id === state.equipped);
  function toggleFullscreen() {
    const request = document.fullscreenElement ? document.exitFullscreen?.() : shellRef.current?.requestFullscreen?.();
    request?.catch(() => {});
  }
  function hold(kind, event) {
    if (blocked) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gameRef.current?.hold(kind, true);
  }
  return <section ref={shellRef} className="neon-game" aria-label={`Neonboy: ${state.levelName}`}>
    <canvas key={attempt} ref={canvasRef} className="neon-game-canvas" tabIndex={0} aria-label="Escenario 3D de Neonboy" />
    <div className={`neon-game-hud${state.health <= 25 ? " is-danger" : ""}`}>
      <div className="neon-game-vitals">
        <div className="neon-game-name"><Heart size={17} fill="currentColor" /><strong>NEONBOY</strong><span>{state.health}<small> / {MAX_HEALTH}</small></span></div>
        <div className="neon-game-health" role="progressbar" aria-label="Vida" aria-valuenow={state.health} aria-valuemin={0} aria-valuemax={MAX_HEALTH}><i style={{ width: `${state.health}%` }} /></div>
      </div>
      <div className="neon-game-objective"><span>NIVEL {state.level} - {state.levelName.toUpperCase()}</span><strong><Coins size={22} /> {state.coins}<small> / {state.total}</small></strong><span className="neon-game-enemies"><Skull size={13} /> {state.defeated} / {state.enemies}</span></div>
      <div className="neon-game-tools">
        <div className="neon-game-period" role="group" aria-label="Hora del dia">
          {[['day', 'Dia', Sun], ['sunset', 'Atardecer', Sunset], ['night', 'Noche', Moon]].map(([id, label, Icon]) => <GameButton key={id} label={label} disabled={!ready || Boolean(error)} aria-pressed={state.period === id} onClick={() => gameRef.current?.setPeriod(id)}><Icon size={17} /></GameButton>)}
        </div>
        <GameButton label={state.paused ? "Continuar (P)" : "Pausar (P)"} disabled={!ready || Boolean(error) || state.status !== "playing"} onClick={() => gameRef.current?.setPaused()}>{state.paused ? <Play size={18} /> : <Pause size={18} />}</GameButton>
        <GameButton label="Reiniciar partida" disabled={!ready || Boolean(error)} onClick={() => gameRef.current?.restart()}><RotateCcw size={18} /></GameButton>
        <GameButton label={muted ? "Activar sonido" : "Silenciar"} aria-pressed={muted} onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</GameButton>
        <GameButton label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"} onClick={toggleFullscreen}>{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</GameButton>
      </div>
    </div>
    {state.pickup && <div className="neon-game-pickup" role="status"><EquippedPickup weapon={state.pickup} /></div>}
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
        <GameButton label={`${state.equipped === "unarmed" ? "Punetazo" : equippedWeapon.name} (J o clic)`} className="neon-game-primary-action" disabled={blocked} onPointerDown={(event) => hold("punch", event)}
          onPointerUp={() => gameRef.current?.hold("punch", false)} onPointerCancel={() => gameRef.current?.hold("punch", false)} onLostPointerCapture={() => gameRef.current?.hold("punch", false)}
          onClick={(event) => { if (event.detail === 0) gameRef.current?.action("punch"); }}><EquippedIcon size={27} /></GameButton>
      </div>
    </div>
    {(!ready || error) && <div className="neon-game-overlay" role={error ? "alert" : "status"}>
      <div className="neon-game-dialog">
        {error ? <><h2>No se pudo iniciar</h2><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}><RotateCcw size={17} /> Reintentar</button></>
          : <><Loader2 className="spin" size={27} /><h2>El Partenon</h2><progress aria-label="Cargando partida" value={progress} max="100" /><span>{progress}%</span></>}
      </div>
    </div>}
    {ready && !error && (state.paused || state.status !== "playing") && <div className="neon-game-overlay">
      <div className="neon-game-dialog" role="dialog" aria-modal="true" aria-labelledby="neon-game-result">
        {state.status === "won" ? <Trophy size={36} className="neon-game-trophy" /> : state.status === "lost" ? <Heart size={32} /> : <Pause size={30} />}
        <h2 id="neon-game-result">{state.status === "won" ? "Tesoro recuperado" : state.status === "lost" ? "Neonboy ha caido" : "En pausa"}</h2>
        <div className="neon-game-results"><span><Coins size={18} /> {state.coins} / {state.total}</span><span><Skull size={18} /> {state.defeated} / {state.enemies}</span><span>{Math.floor(state.time / 60)}:{String(state.time % 60).padStart(2, "0")}</span></div>
        {state.paused && <button autoFocus type="button" onClick={() => { gameRef.current?.setPaused(false); canvasRef.current?.focus(); }}><Play size={17} /> Continuar</button>}
        {state.nextLevel && <button autoFocus type="button" onClick={() => gameRef.current?.nextLevel()}><ArrowRight size={17} /> Nivel 2: Cementerio</button>}
        <button type="button" onClick={() => gameRef.current?.restart()}><RotateCcw size={17} /> Volver a empezar</button>
      </div>
    </div>}
  </section>;
}

function EquippedPickup({ weapon }) {
  const Icon = WEAPON_ICONS[weapon], name = WEAPONS.find((entry) => entry.id === weapon)?.name;
  return <><Icon size={20} /><span>{name} {weapon === "sword" ? "recogida" : "recogido"}</span></>;
}
