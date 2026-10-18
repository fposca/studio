import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Coins, ExternalLink, Pause, Play, RotateCcw, SkipBack, SkipForward, Square, X } from "lucide-react";
import { BAND_LOGO } from "./discographyCatalog.js";
import { ROCKOLA_VIDEOS } from "./recordStoreVideos.js";
import { loadYouTubeIframeApi } from "./youtubeIframeApi.js";
import "./recordStoreJukebox.css";

function VideoScreen({ video, onStateChange, startAt = 0, startPlaying = true, apiRef }) {
  const slotRef = useRef(null);
  const playerRef = useRef(null);
  const playingRef = useRef(startPlaying);
  const [ready, setReady] = useState(false);
  const reportPlaying = (value) => { playingRef.current = value; onStateChange?.(value); };

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return undefined;
    let cancelled = false;
    const frame = document.createElement("iframe");
    frame.width = "640";
    frame.height = "360";
    frame.title = video.title + " · Neonboy";
    frame.src = `https://www.youtube.com/embed/${video.videoId}?autoplay=${startPlaying ? 1 : 0}&playsinline=1&enablejsapi=1&start=${Math.floor(startAt)}&origin=${encodeURIComponent(window.location.origin)}`;
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    slot.replaceChildren(frame);
    setReady(false);

    playingRef.current = startPlaying;
    apiRef.current = { videoId: video.videoId, getSnapshot: () => ({ seconds: playerRef.current?.getCurrentTime?.() ?? startAt, playing: playingRef.current }) };
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(frame, {
        events: {
          onReady: () => { if (!cancelled) { setReady(true); if (startAt > 0) playerRef.current?.seekTo?.(startAt, true); if (!startPlaying) playerRef.current?.pauseVideo?.(); } },
          onStateChange: (event) => { if (!cancelled) { if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.BUFFERING) reportPlaying(true); else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) reportPlaying(false); } }
        }
      });
    }).catch(() => { /* The embedded player's native controls remain available. */ });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      if (apiRef.current?.videoId === video.videoId) apiRef.current = null;
      slot.replaceChildren();
    };
  }, [video.videoId, video.title, startAt, apiRef]);


  const command = (method) => playerRef.current?.[method]?.();
  const seek = (seconds) => {
    const player = playerRef.current;
    if (!player?.seekTo) return;
    player.seekTo(Math.max(0, player.getCurrentTime() + seconds), true);
  };

  return <>
    <div className="record-jukebox-screen" ref={slotRef} />
    <div className="record-jukebox-controls" role="group" aria-label="Controles del video">
      <button type="button" onClick={() => { command("playVideo"); reportPlaying(true); }} disabled={!ready} aria-label="Reproducir video"><Play size={18} /> Reproducir</button>
      <button type="button" onClick={() => { command("pauseVideo"); reportPlaying(false); }} disabled={!ready} aria-label="Pausar video"><Pause size={18} /> Pausar</button>
      <button type="button" onClick={() => seek(-10)} disabled={!ready} aria-label="Retroceder 10 segundos"><RotateCcw size={18} /> −10 s</button>
      <button type="button" onClick={() => seek(10)} disabled={!ready} aria-label="Adelantar 10 segundos"><SkipForward size={18} /> +10 s</button>
      <button type="button" onClick={() => { command("stopVideo"); reportPlaying(false); }} disabled={!ready} aria-label="Detener video"><Square size={17} /> Detener</button>
    </div>
    {!ready && <p className="record-jukebox-api-note">Usá los controles del video mientras carga la rockola.</p>}
  </>;
}

export default function RecordStoreJukebox({ credits, onCollect, onSpend, onClose, activeIndex, onActiveChange, startAt = 0, startPlaying = true, onPlaybackChange, playerApiRef }) {
  const [message, setMessage] = useState("Tomá las monedas de la mesa y elegí un video. Cada estreno cuesta una moneda.");
  const [playing, setPlaying] = useState(activeIndex !== null && startPlaying);
  const [coinPulse, setCoinPulse] = useState(0);
  const closeRef = useRef(null);
  const activeVideo = activeIndex === null ? null : ROCKOLA_VIDEOS[activeIndex];

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { onPlaybackChange?.(playing); }, [onPlaybackChange, playing]);

  function selectVideo(index) {
    if (index === activeIndex) return;
    if (!onSpend()) { setMessage("Faltan monedas. Tomá otras de la mesa para seguir escuchando."); return; }
    onActiveChange(index);
    setPlaying(true);
    setCoinPulse((value) => value + 1);
    setMessage(`Moneda aceptada. Ahora suena ${ROCKOLA_VIDEOS[index].title}.`);
  }

  function takeCoins() {
    const added = onCollect();
    setMessage(added ? `Guardaste ${added} monedas. Tenés hasta 10 reproducciones en la bolsa.` : "La bolsa ya está llena. Usá una moneda para volver a recargarla.");
  }

  return <div className="record-jukebox-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="record-jukebox" role="dialog" aria-modal="true" aria-label="Rockola de Neonboy">
      <div className="record-jukebox-arch" aria-hidden="true" />
      <header className="record-jukebox-header">
        <div><span className="record-jukebox-eyebrow">VIDEO JUKEBOX · NEONBOY MUSIC</span><h2>LA ROCKOLA</h2><p>10 videos · un crédito por video</p></div>
        <img src={BAND_LOGO} alt="9th Revelation" />
        <button type="button" className="record-jukebox-mobile-collect" onClick={takeCoins} aria-label="Tomar monedas de la mesa"><Coins size={15} /> {credits}/10 · TOMAR</button>
        <button ref={closeRef} type="button" className="record-jukebox-close" aria-label="Cerrar rockola" onClick={onClose}><X size={20} /></button>
      </header>
      <div className="record-jukebox-body">
        {coinPulse > 0 && <span key={coinPulse} className="record-jukebox-coin-drop" aria-hidden="true" />}
        <div className="record-jukebox-tv">
          <div className="record-jukebox-bezel">
            <div className="record-jukebox-bezel-top"><span>NEONBOY VISION</span><i>COLOR · STEREO</i></div>
            {activeVideo ? <VideoScreen key={activeVideo.videoId} video={activeVideo} onStateChange={setPlaying} startAt={startAt} startPlaying={playing} apiRef={playerApiRef} />
              : <div className="record-jukebox-standby"><span>NB</span><strong>INSERTÁ UNA MONEDA</strong><small>Elegí un video en la lista para comenzar</small></div>}
          </div>
          <div className="record-jukebox-now" aria-live="polite"><span className={playing ? "is-on" : ""} />{activeVideo ? `${activeVideo.title} · ${activeVideo.album}` : "EN ESPERA"}</div>
          {activeVideo && <a className="record-jukebox-youtube" href={activeVideo.url} target="_blank" rel="noopener noreferrer">Abrir video en YouTube <ExternalLink size={14} /></a>}
        </div>
        <aside className="record-jukebox-selections" aria-label="Videos de la rockola">
          <div className="record-jukebox-wallet"><Coins size={24} /><div><strong>{credits} / 10</strong><span>MONEDAS</span></div><button type="button" onClick={takeCoins}>Tomar monedas de la mesa</button></div>
          <p className="record-jukebox-message" role="status">{message}</p>
          <div className="record-jukebox-list">
            {ROCKOLA_VIDEOS.map((video, index) => <button type="button" key={video.videoId} className={activeIndex === index ? "is-active" : ""} onClick={() => selectVideo(index)} aria-label={`Elegir video ${video.title}`}>
              <span>{String(index + 1).padStart(2, "0")}</span><span><strong>{video.title}</strong><small>{video.album}</small></span><Play size={15} />
            </button>)}
          </div>
          <div className="record-jukebox-transport" role="group" aria-label="Cambiar video">
            <button type="button" disabled={activeIndex === null} onClick={() => selectVideo((activeIndex + ROCKOLA_VIDEOS.length - 1) % ROCKOLA_VIDEOS.length)}><SkipBack size={17} /> Anterior · 1 moneda</button>
            <button type="button" disabled={activeIndex === null} onClick={() => selectVideo((activeIndex + 1) % ROCKOLA_VIDEOS.length)}>Siguiente · 1 moneda <SkipForward size={17} /></button>
          </div>
        </aside>
      </div>
      <footer className="record-jukebox-footer"><span>NEONBOY · DESDE HALLOWEEN</span><button type="button" onClick={onClose}><ArrowLeft size={16} /> Volver a la tienda</button></footer>
    </section>
  </div>;
}
