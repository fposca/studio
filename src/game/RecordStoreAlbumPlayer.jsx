import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, Pause, Play, SkipBack, SkipForward, Square, Volume2 } from "lucide-react";
import { loadYouTubeIframeApi } from "./youtubeIframeApi.js";

export default function RecordStoreAlbumPlayer({
  albumName, artist, track, onPlaybackChange = () => {}, playRequest = 0,
  onPrevious, onNext, volume = 100, onVolumeChange, paused = false
}) {
  const slotRef = useRef(null);
  const playerRef = useRef(null);
  const playbackRef = useRef("loading");
  const lastPlayRequestRef = useRef(playRequest);
  const pausedRef = useRef(paused);
  const resumeAfterPauseRef = useRef(false);
  pausedRef.current = paused;
  const nextRef = useRef(onNext);
  nextRef.current = onNext;
  const [ready, setReady] = useState(false);
  const [playback, setPlayback] = useState("loading");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const reportPlayback = (next) => {
    playbackRef.current = next;
    setPlayback(next);
    onPlaybackChange(next);
  };
  const reportRef = useRef(reportPlayback);
  reportRef.current = reportPlayback;

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return undefined;
    let cancelled = false;
    const frame = document.createElement("iframe");
    frame.title = albumName + " — " + track.name;
    frame.src = "https://www.youtube-nocookie.com/embed/" + track.videoId + "?autoplay=1&playsinline=1&enablejsapi=1&origin=" + encodeURIComponent(window.location.origin);
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allowFullscreen = true;
    slot.replaceChildren(frame);

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled) return;
      const player = new YT.Player(frame, {
        events: {
          onReady: () => {
            if (cancelled) return;
            player.setVolume?.(volume);
            setReady(true);
            reportRef.current("ready");
            if (pausedRef.current) { resumeAfterPauseRef.current = true; player.pauseVideo?.(); }
            else player.playVideo?.();
          },
          onStateChange: (event) => {
            if (cancelled) return;
            if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.BUFFERING) reportRef.current("playing");
            else if (event.data === YT.PlayerState.PAUSED && playbackRef.current !== "stopped") reportRef.current("paused");
            else if (event.data === YT.PlayerState.ENDED) {
              reportRef.current("stopped");
              nextRef.current?.();
            }
          }
        }
      });
      playerRef.current = player;
    }).catch(() => {
      if (!cancelled) reportRef.current("native");
    });
    const clock = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || cancelled) return;
      const current = Number(player.getCurrentTime?.());
      const length = Number(player.getDuration?.());
      if (Number.isFinite(current)) setPosition(current);
      if (Number.isFinite(length)) setDuration(length);
    }, 500);

    return () => {
      cancelled = true;
      window.clearInterval(clock);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      slot.replaceChildren();
    };
  }, [albumName, track.videoId]);

  useEffect(() => { if (ready) playerRef.current?.setVolume?.(volume); }, [ready, volume]);
  useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (paused) {
      resumeAfterPauseRef.current ||= ["playing", "loading", "ready"].includes(playbackRef.current);
      playerRef.current.pauseVideo?.();
    } else if (resumeAfterPauseRef.current) {
      resumeAfterPauseRef.current = false;
      playerRef.current.playVideo?.();
    }
  }, [paused, ready]);

  const play = () => {
    const player = playerRef.current;
    if (!ready || !player) return;
    if (playbackRef.current === "stopped") player.seekTo?.(0, true);
    player.playVideo?.();
    reportPlayback("playing");
  };

  useEffect(() => {
    if (playRequest === lastPlayRequestRef.current) return;
    lastPlayRequestRef.current = playRequest;
    if (ready) play();
  }, [playRequest, ready]);

  const pause = () => {
    if (!ready || !playerRef.current) return;
    playerRef.current.pauseVideo?.();
    reportPlayback("paused");
  };
  const stop = () => {
    if (!ready || !playerRef.current) return;
    playerRef.current.stopVideo?.();
    setPosition(0);
    reportPlayback("stopped");
  };
  const seek = (event) => {
    const seconds = Number(event.target.value);
    setPosition(seconds);
    playerRef.current?.seekTo?.(seconds, true);
  };
  const clockLabel = (seconds) => Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");

  return <div className="record-store-player">
    <strong>{track.name}</strong>
    {artist && <small>{artist} · {albumName}</small>}
    <div className="record-store-player-controls" role="group" aria-label="Controles de la canción">
      {onPrevious && <button type="button" onClick={onPrevious} aria-label="Tema anterior"><SkipBack size={15} /></button>}
      <button type="button" onClick={play} disabled={!ready || playback === "playing"} aria-label="Reproducir canción" aria-pressed={playback === "playing"}><Play size={15} fill="currentColor" /> Play</button>
      <button type="button" onClick={pause} disabled={!ready || playback !== "playing"} aria-label="Pausar canción" aria-pressed={playback === "paused"}><Pause size={15} fill="currentColor" /> Pausa</button>
      <button type="button" onClick={stop} disabled={!ready || playback === "stopped"} aria-label="Detener canción" aria-pressed={playback === "stopped"}><Square size={13} fill="currentColor" /> Stop</button>
      {onNext && <button type="button" onClick={onNext} aria-label="Tema siguiente"><SkipForward size={15} /></button>}
    </div>
    <div className="record-store-player-screen" ref={slotRef} />
    <div className="record-store-player-timeline">
      <span>{clockLabel(position)}</span>
      <input type="range" aria-label="Progreso de la canción" min="0" max={Math.max(1, duration)} step="1" value={Math.min(position, Math.max(1, duration))} onChange={seek} disabled={!ready || !duration} />
      <span>{clockLabel(duration)}</span>
    </div>
    {onVolumeChange && <label className="record-store-player-volume"><Volume2 size={15} aria-hidden="true" /> Volumen
      <input type="range" aria-label="Volumen de la canción" min="0" max="100" value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} />
      <span>{volume}%</span>
    </label>}
    {playback === "native" && <small className="record-store-player-note">Usá los controles del video para reproducirlo.</small>}
    <a href={track.url} target="_blank" rel="noopener noreferrer">Abrir en YouTube <ExternalLink size={13} /></a>
  </div>;
}
