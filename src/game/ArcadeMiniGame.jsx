import React, { useEffect, useRef, useState } from "react";
import { createPixelSprintGame, stepPixelSprint } from "./pixelSprintLogic.js";
import { paintPixelSprint } from "./pixelSprintPaint.js";
import { createBarrioBrawlGame, stepBarrioBrawl } from "./barrioBrawlLogic.js";
import { paintBarrioBrawl } from "./barrioBrawlPaint.js";
import { createJunglePulseGame, stepJunglePulse } from "./junglePulseLogic.js";
import { paintJunglePulse } from "./junglePulsePaint.js";
import { createJunglePulseAudio } from "./junglePulseAudio.js";
import "./arcadeMiniGame.css";

const GAMES = {
  pixel: { title: "PIXEL SPRINT", genre: "PLATAFORMAS / 16 BIT", controls: "A / D o flechas: mover | ESPACIO: saltar",
    create: createPixelSprintGame, step: stepPixelSprint, paint: paintPixelSprint,
    summary: (g) => ({ score: g.score, won: g.result === "win" }) },
  brawl: { title: "BARRIO BRAWL", genre: "PELEA CALLEJERA / 1999", controls: "A / D: mover | W: saltar | J: golpe | K: patada | L: cubrir",
    create: createBarrioBrawlGame, step: stepBarrioBrawl, paint: paintBarrioBrawl,
    summary: (g) => ({ score: g.score, won: g.result === "win", roundsWon: g.wins[0] }) },
  jungle: { title: "JUNGLE PULSE", genre: "RITMO / 120 BPM", controls: "A / S / D / F: tocar el carril cuando la nota llegue a la línea",
    create: createJunglePulseGame, step: stepJunglePulse, paint: paintJunglePulse,
    summary: (g) => ({ score: g.score, won: g.result === "win", accuracy: g.accuracy, maxCombo: g.maxCombo }) },
};

function createEffectsAudio() {
  const Constructor = window.AudioContext || window.webkitAudioContext;
  if (!Constructor) return { play() {}, pause() {}, resume() {}, close() {} };
  const context = new Constructor(), gain = context.createGain();
  gain.gain.value = .055; gain.connect(context.destination);
  const notes = { jump: [400, 720, .12], coin: [720, 1200, .11], hit: [240, 85, .19], hurt: [180, 55, .27],
    win: [490, 960, .33], end: [170, 70, .4], swing: [350, 180, .09], block: [230, 155, .11], round: [450, 180, .25] };
  return {
    play(kind) {
      if (context.state !== "running" || !notes[kind]) return;
      const [from, to, duration] = notes[kind], now = context.currentTime;
      const osc = context.createOscillator(), env = context.createGain();
      osc.type = kind === "hurt" ? "sawtooth" : "square";
      osc.frequency.setValueAtTime(from, now); osc.frequency.exponentialRampToValueAtTime(to, now + duration);
      env.gain.setValueAtTime(.7, now); env.gain.exponentialRampToValueAtTime(.001, now + duration);
      osc.connect(env).connect(gain); osc.start(now); osc.stop(now + duration + .01);
    },
    pause() { if (context.state === "running") void context.suspend().catch(() => {}); },
    resume() { if (context.state === "suspended") void context.resume().catch(() => {}); },
    close() { gain.disconnect(); void context.close().catch(() => {}); },
  };
}

export default function ArcadeMiniGame({ id, progress, onFinish, onClose, paused = false }) {
  const config = GAMES[id];
  const canvasRef = useRef(null), canvasFocusRef = useRef(null), gameRef = useRef(null), audioRef = useRef(null);
  const keysRef = useRef(new Set()), freshRef = useRef(new Set()), pressesRef = useRef([]);
  const rafRef = useRef(0), lastRef = useRef(0), lastHudRef = useRef(0), reportedRef = useRef(false);
  const phaseRef = useRef("start"), pausedRef = useRef(paused), finishRef = useRef(onFinish), tickRef = useRef(null);
  const [phase, setPhase] = useState("start"), [snapshot, setSnapshot] = useState(null);
  const [record, setRecord] = useState(progress.records[id]);
  finishRef.current = onFinish;
  pausedRef.current = paused;

  function report() {
    if (reportedRef.current || !gameRef.current) return;
    reportedRef.current = true;
    const result = finishRef.current(id, config.summary(gameRef.current));
    setRecord(result?.records?.[id] || progress.records[id]);
  }

  function stop() {
    cancelAnimationFrame(rafRef.current); rafRef.current = 0; lastRef.current = 0;
    keysRef.current.clear(); freshRef.current.clear(); pressesRef.current = [];
    audioRef.current?.close(); audioRef.current = null;
  }

  function start() {
    if (phaseRef.current === "playing") report();
    stop();
    reportedRef.current = false;
    const game = config.create();
    gameRef.current = game;
    audioRef.current = id === "jungle" ? createJunglePulseAudio() : createEffectsAudio();
    if (id === "jungle") audioRef.current.start();
    else audioRef.current.resume();
    config.paint(canvasRef.current.getContext("2d"), game);
    phaseRef.current = "playing"; setPhase("playing"); setSnapshot({ ...game });
    requestAnimationFrame(() => canvasFocusRef.current?.focus());
  }

  function leave() {
    if (phaseRef.current === "playing") report();
    stop(); phaseRef.current = "closed"; onClose();
  }

  tickRef.current = (now) => {
    if (phaseRef.current !== "playing" || pausedRef.current || document.hidden) return;
    const game = gameRef.current;
    const events = [];
    if (id === "jungle") {
      audioRef.current?.tick();
      const time = audioRef.current?.time() ?? game.time;
      events.push(...config.step(game, time, pressesRef.current.splice(0)));
      for (const event of events) if (["perfect", "good", "miss"].includes(event)) audioRef.current?.hit(event);
    } else {
      let remaining = lastRef.current ? Math.min(.12, (now - lastRef.current) / 1000) : 0;
      const held = keysRef.current, fresh = freshRef.current;
      const input = id === "pixel"
        ? { left: held.has("KeyA") || held.has("ArrowLeft"), right: held.has("KeyD") || held.has("ArrowRight"), jump: fresh.has("Space") }
        : { left: held.has("KeyA") || held.has("ArrowLeft"), right: held.has("KeyD") || held.has("ArrowRight"),
          jump: fresh.has("KeyW") || fresh.has("ArrowUp"), punch: fresh.has("KeyJ"), kick: fresh.has("KeyK"), guard: held.has("KeyL") };
      do {
        const slice = Math.min(.05, Math.max(0, remaining));
        events.push(...config.step(game, slice, input));
        input.jump = false; input.punch = false; input.kick = false;
        remaining -= slice;
      } while (remaining > .0001 && game.phase === "playing");
      for (const event of events) audioRef.current?.play(event);
    }
    freshRef.current.clear(); lastRef.current = now;
    config.paint(canvasRef.current.getContext("2d"), game);
    if (now - lastHudRef.current > 100 || game.phase === "ended") {
      setSnapshot({ ...game }); lastHudRef.current = now;
    }
    if (game.phase === "ended") {
      phaseRef.current = "ended"; setPhase("ended"); report();
      audioRef.current?.pause();
      return;
    }
    rafRef.current = requestAnimationFrame(tickRef.current);
  };

  useEffect(() => {
    config.paint(canvasRef.current.getContext("2d"), config.create());
    const controls = new Set(["KeyA", "KeyS", "KeyD", "KeyF", "KeyW", "KeyJ", "KeyK", "KeyL", "ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);
    const down = (event) => {
      if (!controls.has(event.code) || phaseRef.current !== "playing" || pausedRef.current) return;
      event.preventDefault();
      keysRef.current.add(event.code);
      if (event.repeat) return;
      freshRef.current.add(event.code);
      if (id === "jungle") {
        const lane = ["KeyA", "KeyS", "KeyD", "KeyF"].indexOf(event.code);
        if (lane >= 0) pressesRef.current.push({ lane, time: audioRef.current?.time() ?? 0 });
      }
    };
    const up = (event) => keysRef.current.delete(event.code);
    const blur = () => { keysRef.current.clear(); freshRef.current.clear(); pressesRef.current = []; };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; audioRef.current?.pause(); blur(); }
      else if (phaseRef.current === "playing" && !pausedRef.current) {
        audioRef.current?.resume(); lastRef.current = 0; rafRef.current = requestAnimationFrame(tickRef.current);
      }
    };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    window.addEventListener("blur", blur); document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (phaseRef.current === "playing" && !reportedRef.current && gameRef.current) {
        reportedRef.current = true; finishRef.current(id, config.summary(gameRef.current));
      }
      audioRef.current?.close(); audioRef.current = null;
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility);
    };
  }, [id]);

  useEffect(() => {
    if (paused) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; lastRef.current = 0; keysRef.current.clear(); freshRef.current.clear(); pressesRef.current = []; audioRef.current?.pause(); }
    else if (phase === "playing" && !document.hidden) {
      audioRef.current?.resume(); lastRef.current = 0;
      cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(tickRef.current);
    }
  }, [paused, phase]);

  return <div className="orbit-duel-overlay arcade-mini-overlay" role="dialog" aria-modal="true" aria-label={config.title}>
    <section className="orbit-duel-cabinet arcade-mini-cabinet" tabIndex={-1}>
      <header><small>ARCADE 1999 / VIDEO GAME SYSTEM</small><h2>{config.title}</h2><span>{config.genre}</span></header>
      <div className="orbit-duel-body arcade-mini-body">
        <div className="orbit-duel-crt arcade-mini-crt">
          <canvas ref={canvasRef} tabIndex={0} width={640} height={400} aria-label={"Pantalla de " + config.title} />
          {phase !== "playing" && <div className="orbit-duel-screen-message arcade-mini-message">
            {phase === "start" ? <><strong>PRESS START</strong><span>{config.controls}</span></> :
              <><strong>{id === "pixel" ? snapshot?.result === "win" ? "META ALCANZADA" : "GAME OVER"
                : id === "brawl" ? snapshot?.result === "win" ? "YOU WIN" : "GAME OVER"
                  : "RANGO " + (snapshot?.rank || "D")}</strong>
                <span>SCORE {snapshot?.score || 0}{id === "jungle" ? " / PRECISIÓN " + (snapshot?.accuracy || 0) + "%" : ""}</span></>}
          </div>}
        </div>
        <aside className="orbit-duel-panel arcade-mini-panel">
          <strong>SCORE {snapshot?.score || 0}</strong>
          <span>{id === "pixel" ? "VIDAS " + (snapshot?.lives ?? 3) + " / META AL FINAL DEL NIVEL"
            : id === "brawl" ? "ROUND " + (snapshot?.round ?? 1) + " / " + (snapshot?.wins?.join("-") || "0-0")
              : "COMBO " + (snapshot?.combo || 0) + " / MISS " + (snapshot?.misses || 0)}</span>
          <h3>RECORD PERSONAL</h3>
          <p>Mejor puntaje: <b>{record.bestScore}</b><br />
            {id === "jungle" ? <>Mejor precisión: <b>{record.bestAccuracy}%</b><br />Mejor combo: <b>{record.bestCombo}</b></>
              : id === "brawl" ? <>Rounds ganados: <b>{record.bestRounds}</b></> : <>Victorias: <b>{record.wins}</b></>}</p>
          <p>{config.controls}<br />ESC: salir</p>
          {id === "jungle" && phase === "ended" && <p>PERFECT {snapshot?.perfect} / GOOD {snapshot?.good} / MISS {snapshot?.misses}<br />COMBO MAX {snapshot?.maxCombo} / RANGO {snapshot?.rank}</p>}
          {phase === "start" && <button type="button" className="orbit-duel-start" onClick={start}>INICIAR PARTIDA</button>}
          {phase !== "start" && <button type="button" className="orbit-duel-start" onClick={start}>REINICIAR PARTIDA</button>}
          <button type="button" onClick={leave}>SALIR DEL FICHÍN</button>
          <small>PARTIDA LIBRE / SIN FICHAS / ESC PARA VOLVER</small>
        </aside>
      </div>
    </section>
  </div>;
}
