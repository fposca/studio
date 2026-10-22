import React, { useEffect, useRef, useState } from "react";
import { createOrbitGame, ORBIT_DURATION, ORBIT_HEIGHT, ORBIT_WIDTH, stepOrbitGame } from "./orbitDuelLogic.js";
import { NICO_ORBIT_SCORE, orbitHighScores } from "./arcadeProgress.js";
import "./arcadeOrbitDuel.css";

const COLORS = { scout: "#f06ac8", dart: "#ffd16e", guard: "#75e5e4" };

function paint(ctx, game) {
  ctx.fillStyle = "#090d1f"; ctx.fillRect(0, 0, ORBIT_WIDTH, ORBIT_HEIGHT);
  const drift = game.time * 45;
  for (let i = 0; i < 75; i++) {
    const x = (i * 139 + 37) % ORBIT_WIDTH, y = (i * 83 + drift * (i % 3 + 1) / 3) % ORBIT_HEIGHT;
    ctx.fillStyle = i % 7 ? "#627096" : "#f9c8e7"; ctx.fillRect(x, y, i % 9 ? 1 : 2, i % 9 ? 1 : 2);
  }
  ctx.strokeStyle = "#234567"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 477); ctx.lineTo(ORBIT_WIDTH, 477); ctx.stroke();
  for (const enemy of game.enemies) {
    ctx.save(); ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = COLORS[enemy.kind]; ctx.shadowColor = COLORS[enemy.kind]; ctx.shadowBlur = 11;
    if (enemy.kind === "guard") {
      ctx.fillRect(-16, -10, 32, 18); ctx.fillRect(-21, 0, 8, 8); ctx.fillRect(13, 0, 8, 8);
      ctx.fillStyle = "#241b3f"; ctx.fillRect(-7, -5, 14, 7);
      if (enemy.hp < 3) { ctx.fillStyle = "#fff"; ctx.fillRect(-12, -13, (enemy.hp / 3) * 24, 2); }
    } else if (enemy.kind === "dart") {
      ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(-12, -8); ctx.lineTo(0, -3); ctx.lineTo(12, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#1b1031"; ctx.fillRect(-2, 2, 4, 5);
    } else {
      ctx.fillRect(-11, -7, 22, 14); ctx.fillRect(-16, -2, 5, 9); ctx.fillRect(11, -2, 5, 9);
      ctx.fillStyle = "#2e1644"; ctx.fillRect(-5, -2, 10, 5);
    }
    ctx.restore();
  }
  ctx.fillStyle = "#a2f4ff"; ctx.shadowColor = "#5ceaff"; ctx.shadowBlur = 9;
  for (const shot of game.shots) ctx.fillRect(shot.x - 2, shot.y - 7, 4, 14);
  ctx.fillStyle = "#ff755e"; ctx.shadowColor = "#ff755e";
  for (const shot of game.enemyShots) ctx.fillRect(shot.x - 3, shot.y - 3, 6, 9);
  ctx.shadowBlur = 0;
  if (game.invulnerable <= 0 || Math.floor(game.invulnerable * 12) % 2 === 0) {
    ctx.save(); ctx.translate(game.playerX, 506);
    ctx.fillStyle = "#88e6ed"; ctx.shadowColor = "#64e3ff"; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-15, 12); ctx.lineTo(0, 6); ctx.lineTo(15, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f4b3e5"; ctx.fillRect(-4, -2, 8, 9); ctx.restore();
  }
  ctx.fillStyle = "#f7e8cf"; ctx.font = "bold 15px monospace"; ctx.textAlign = "left";
  ctx.fillText(`SCORE ${String(game.score).padStart(5, "0")}`, 12, 24);
  ctx.textAlign = "right"; ctx.fillText(`♥ ${game.lives}   ${Math.max(0, Math.ceil(ORBIT_DURATION - game.time))}s`, ORBIT_WIDTH - 12, 24);
}

function createRetroAudio(volume) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return { play() {}, close() {}, resume() {}, pause() {}, setVolume() {} };
  let context;
  try { context = new AudioContext(); } catch { return { play() {}, close() {}, resume() {}, pause() {}, setVolume() {} }; }
  const gain = context.createGain(); gain.gain.value = 0.065 * volume; gain.connect(context.destination);
  function play(kind) {
    if (context.state !== "running") return;
    const now = context.currentTime, oscillator = context.createOscillator(), envelope = context.createGain();
    const note = { fire: [810, 320, .065], destroy: [300, 80, .16], hurt: [170, 45, .32], end: [220, 60, .42], record: [500, 1100, .45] }[kind];
    if (!note) return;
    oscillator.type = kind === "hurt" || kind === "end" ? "sawtooth" : "square";
    oscillator.frequency.setValueAtTime(note[0], now); oscillator.frequency.exponentialRampToValueAtTime(note[1], now + note[2]);
    envelope.gain.setValueAtTime(0.7, now); envelope.gain.exponentialRampToValueAtTime(.001, now + note[2]);
    oscillator.connect(envelope).connect(gain); oscillator.start(now); oscillator.stop(now + note[2] + .01);
  }
  return { play, setVolume: (next) => { gain.gain.value = 0.065 * next; }, resume: () => context.resume().catch(() => {}), pause: () => context.suspend().catch(() => {}), close: () => { gain.disconnect(); void context.close().catch(() => {}); } };
}

export default function ArcadeOrbitDuel({ progress, onFinish, onClose, paused = false }) {
  const canvasRef = useRef(null), gameRef = useRef(null), keysRef = useRef(new Set()), audioRef = useRef(null);
  const frameRef = useRef(0), loopRef = useRef(null), lastRef = useRef(0), reportedRef = useRef(false), signalTimerRef = useRef(0);
  const [phase, setPhase] = useState("start"), [score, setScore] = useState(0), [lives, setLives] = useState(3), [time, setTime] = useState(ORBIT_DURATION), [signal, setSignal] = useState(false);
  const [finalBest, setFinalBest] = useState(progress.bestScore);
  const [sfxVolume, setSfxVolume] = useState(() => {
    try { const raw = localStorage.getItem("neonboy.orbit-duel.sfx-volume"); const saved = raw === null ? NaN : Number(raw); return Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : .65; }
    catch { return .65; }
  });
  useEffect(() => {
    audioRef.current?.setVolume(sfxVolume);
    try { localStorage.setItem("neonboy.orbit-duel.sfx-volume", String(sfxVolume)); } catch { /* Private storage may be unavailable. */ }
  }, [sfxVolume]);

  function report(completed = false) {
    if (reportedRef.current || !gameRef.current) return;
    reportedRef.current = true;
    const outcome = onFinish(gameRef.current.score, completed);
    if (gameRef.current.score > progress.bestScore) audioRef.current?.play("record");
    setFinalBest(Math.max(progress.bestScore, gameRef.current.score));
    if (outcome?.showSignal) {
      setSignal(true);
      signalTimerRef.current = window.setTimeout(() => setSignal(false), 1050);
    }
  }

  function start() {
    cancelAnimationFrame(frameRef.current);
    keysRef.current.clear();
    reportedRef.current = false;
    gameRef.current = createOrbitGame();
    setScore(0); setLives(3); setTime(ORBIT_DURATION); setSignal(false); setPhase("playing");
    if (!audioRef.current) audioRef.current = createRetroAudio(sfxVolume);
    void audioRef.current?.resume?.();
    lastRef.current = 0;
    const loop = (now) => {
      const game = gameRef.current;
      if (!game || game.phase !== "playing") return;
      const input = keysRef.current;
      const controls = { left: input.has("ArrowLeft") || input.has("KeyA"), right: input.has("ArrowRight") || input.has("KeyD"), fire: input.has("Space") };
      const events = [];
      let remaining = lastRef.current ? Math.min(.2, (now - lastRef.current) / 1000) : 0;
      while (remaining > 0 && game.phase === "playing") {
        const slice = Math.min(.05, remaining);
        events.push(...stepOrbitGame(game, slice, controls));
        remaining -= slice;
      }
      lastRef.current = now;
      paint(canvasRef.current.getContext("2d"), game);
      for (const event of events) audioRef.current?.play(event);
      setScore(game.score); setLives(game.lives); setTime(Math.max(0, Math.ceil(ORBIT_DURATION - game.time)));
      if (game.phase === "ended") { report(true); setPhase("ended"); return; }
      frameRef.current = requestAnimationFrame(loop);
    };
    loopRef.current = loop;
  }

  useEffect(() => {
    if (paused) {
      cancelAnimationFrame(frameRef.current); frameRef.current = 0; lastRef.current = 0; keysRef.current.clear();
      audioRef.current?.pause?.();
    } else if (phase === "playing" && loopRef.current && gameRef.current?.phase === "playing") {
      audioRef.current?.resume?.();
      lastRef.current = 0; cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(loopRef.current);
    }
  }, [paused, phase]);

  function leave() {
    if (phase === "playing") report();
    onClose();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) paint(canvas.getContext("2d"), { time: 0, score: 0, lives: 3, playerX: ORBIT_WIDTH / 2, invulnerable: 0, enemies: [], shots: [], enemyShots: [] });
    const down = (event) => {
      if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space"].includes(event.code)) {
        event.preventDefault(); keysRef.current.add(event.code);
      }
    };
    const up = (event) => keysRef.current.delete(event.code);
    const blur = () => keysRef.current.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => {
      cancelAnimationFrame(frameRef.current); clearTimeout(signalTimerRef.current);
      if (gameRef.current && !reportedRef.current) { reportedRef.current = true; onFinish(gameRef.current.score, false); }
      keysRef.current.clear(); audioRef.current?.close(); audioRef.current = null;
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur);
    };
  }, []);

  const scores = orbitHighScores({ ...progress, bestScore: Math.max(progress.bestScore, finalBest) });
  return <div className="orbit-duel-overlay" role="dialog" aria-modal="true" aria-label="ORBIT DUEL">
    <section className="orbit-duel-cabinet">
      <header><small>ARCADE 1999 · VIDEO GAME SYSTEM</small><h2>ORBIT <em>DUEL</em></h2><span>1999 EDITION</span></header>
      <div className="orbit-duel-body">
        <div className="orbit-duel-crt">
          <canvas ref={canvasRef} width={ORBIT_WIDTH} height={ORBIT_HEIGHT} aria-label="Pantalla de ORBIT DUEL" />
          {phase !== "playing" && <div className="orbit-duel-screen-message">
            {phase === "start" ? <><strong>PRESS START</strong><span>3 VIDAS · 75 SEGUNDOS</span></> : <><strong>GAME OVER</strong><span>{score > progress.bestScore ? "NEW HIGH SCORE" : "PUNTAJE " + score}</span></>}
          </div>}
          {signal && <div className="orbit-duel-signal"><strong>PLAYER 09</strong><span>WHO IS PLAYING?</span></div>}
        </div>
        <aside className="orbit-duel-panel">
          <strong>SCORE {String(score).padStart(5, "0")}</strong><span>VIDAS {lives} · TIEMPO {time}s</span>
          <h3>HIGH SCORES</h3><ol>{scores.map((row) => <li key={row.name}><span>{row.name}</span><b>{row.score}</b></li>)}</ol>
          <p>← / A y → / D: mover<br />ESPACIO: disparar<br />ESC: salir</p>
          <label className="orbit-duel-volume">EFECTOS {Math.round(sfxVolume * 100)}%<input type="range" min="0" max="100" value={Math.round(sfxVolume * 100)} onChange={(event) => setSfxVolume(Number(event.target.value) / 100)} aria-label="Volumen de efectos ORBIT DUEL" /></label>
          {phase !== "playing" && <button type="button" className="orbit-duel-start" onClick={start}>{phase === "start" ? "▶ INICIAR" : "↻ REINTENTAR"}</button>}
          <button type="button" className="orbit-duel-exit" onClick={leave}>SALIR DEL FICHÍN</button>
          <small>PARTIDA LIBRE · RÉCORD DE NICO {NICO_ORBIT_SCORE}</small>
        </aside>
      </div>
    </section>
  </div>;
}
