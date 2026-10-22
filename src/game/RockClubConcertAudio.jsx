import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { loadYouTubeIframeApi } from "./youtubeIframeApi.js";
import { DISCOGRAPHY_ALBUMS } from "./discographyCatalog.js";

const burnLies = DISCOGRAPHY_ALBUMS.find((album) => album.name === "Holy Fire")?.tracks.find((track) => track.name === "Burn Lies");

export default function RockClubConcertAudio({ paused, onPlaying, onEnded, onError }) {
  const slotRef = useRef(null);
  const playerRef = useRef(null);
  const callbacksRef = useRef({ onPlaying, onEnded, onError, paused });
  const wasPausedRef = useRef(paused);
  const [status, setStatus] = useState("loading");
  callbacksRef.current = { onPlaying, onEnded, onError, paused };

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || !burnLies) return undefined;
    let cancelled = false;
    const frame = document.createElement("iframe");
    frame.title = "Burn Lies - 9th Revelation";
    frame.src = `https://www.youtube-nocookie.com/embed/${burnLies.videoId}?autoplay=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    slot.replaceChildren(frame);
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled) return;
      const player = new YT.Player(frame, {
        events: {
          onReady: () => {
            if (cancelled) return;
            playerRef.current = player;
            setStatus("ready");
            if (!callbacksRef.current.paused) player.playVideo?.();
          },
          onStateChange: (event) => {
            if (cancelled) return;
            if (event.data === YT.PlayerState.PLAYING && callbacksRef.current.paused) { playerRef.current?.pauseVideo?.(); return; }
            if (event.data === YT.PlayerState.PLAYING) { setStatus("playing"); callbacksRef.current.onPlaying?.(); }
            else if (event.data === YT.PlayerState.ENDED) { setStatus("ended"); callbacksRef.current.onEnded?.(); }
            else if (event.data === YT.PlayerState.PAUSED) setStatus("paused");
          },
          onError: () => { if (!cancelled) { setStatus("error"); callbacksRef.current.onError?.(); } },
        },
      });
      playerRef.current = player;
    }).catch(() => { if (!cancelled) { setStatus("native"); callbacksRef.current.onError?.(); } });
    return () => {
      cancelled = true;
      playerRef.current?.stopVideo?.();
      playerRef.current?.destroy?.();
      playerRef.current = null;
      slot.replaceChildren();
    };
  }, []);

  useEffect(() => {
    const wasPaused = wasPausedRef.current;
    wasPausedRef.current = paused;
    if (paused && !wasPaused) playerRef.current?.pauseVideo?.();
    else if (!paused && wasPaused) playerRef.current?.playVideo?.();
  }, [paused]);

  return <div className="club-concert-audio">
    <div className="club-concert-audio-screen" ref={slotRef} />
    {status !== "playing" && <button type="button" disabled={paused} onClick={() => playerRef.current?.playVideo?.()}>
      <Play size={13} /> {paused ? "Audio en pausa" : status === "error" || status === "native" ? "Usar Play en el video" : "Reproducir Burn Lies"}
    </button>}
    <a href={burnLies?.url} target="_blank" rel="noopener noreferrer">Abrir tema <ExternalLink size={12} /></a>
  </div>;
}
