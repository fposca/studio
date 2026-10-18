import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, Pause, Play, Square } from "lucide-react";
import { loadYouTubeIframeApi } from "./youtubeIframeApi.js";

export default function RecordStoreAlbumPlayer({ albumName, track, onPlaybackChange, playRequest }) {
  const slotRef = useRef(null);
  const playerRef = useRef(null);
  const playbackRef = useRef("loading");
  const lastPlayRequestRef = useRef(playRequest);
  const [ready, setReady] = useState(false);
  const [playback, setPlayback] = useState("loading");

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
    frame.title = `${albumName} — ${track.name}`;
    frame.src = `https://www.youtube-nocookie.com/embed/${track.videoId}?autoplay=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
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
            setReady(true);
            reportRef.current("ready");
            player.playVideo?.();
          },
          onStateChange: (event) => {
            if (cancelled) return;
            if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.BUFFERING) reportRef.current("playing");
            else if (event.data === YT.PlayerState.PAUSED && playbackRef.current !== "stopped") reportRef.current("paused");
            else if (event.data === YT.PlayerState.ENDED) reportRef.current("stopped");
          }
        }
      });
      playerRef.current = player;
    }).catch(() => {
      if (!cancelled) reportRef.current("native");
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
      slot.replaceChildren();
    };
  }, [albumName, track.videoId]);

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
    reportPlayback("stopped");
  };

  return <div className="record-store-player">
    <strong>{track.name}</strong>
    <div className="record-store-player-controls" role="group" aria-label="Controles de la canción">
      <button type="button" onClick={play} disabled={!ready || playback === "playing"} aria-label="Reproducir canción" aria-pressed={playback === "playing"}><Play size={15} fill="currentColor" /> Play</button>
      <button type="button" onClick={pause} disabled={!ready || playback !== "playing"} aria-label="Pausar canción" aria-pressed={playback === "paused"}><Pause size={15} fill="currentColor" /> Pausa</button>
      <button type="button" onClick={stop} disabled={!ready || playback === "stopped"} aria-label="Detener canción" aria-pressed={playback === "stopped"}><Square size={13} fill="currentColor" /> Stop</button>
    </div>
    <div className="record-store-player-screen" ref={slotRef} />
    {playback === "native" && <small className="record-store-player-note">Usá los controles del video para reproducirlo.</small>}
    <a href={track.url} target="_blank" rel="noopener noreferrer">Abrir en YouTube <ExternalLink size={13} /></a>
  </div>;
}
