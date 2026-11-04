import React, { useEffect, useRef } from "react";

let apiPromise;
const resumePositions = new Map();

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("No se pudo cargar la API de YouTube"));
    document.head.appendChild(script);
  });
  return apiPromise;
}

export default function HalloweenYouTubePlayer({ videoId, title, onPlaybackChange }) {
  const iframeRef = useRef(null);
  const callbackRef = useRef(onPlaybackChange);
  callbackRef.current = onPlaybackChange;

  const resumeAt = Math.floor(resumePositions.get(videoId) || 0);
  useEffect(() => {
    let active = true;
    let player;
    callbackRef.current(null);
    loadYouTubeApi().then((YT) => {
      if (!active || !iframeRef.current) return;
      const report = (state) => {
        if (!active) return;
        if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) callbackRef.current(true);
        else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED || state === YT.PlayerState.CUED) callbackRef.current(false);
      };
      player = new YT.Player(iframeRef.current, {
        events: {
          onReady: (event) => report(event.target.getPlayerState()),
          onStateChange: (event) => report(event.data),
          onError: () => { if (active) callbackRef.current(false); }
        }
      });
    }).catch(() => {
      // If YouTube is blocked, keep the background paused while the iframe is open.
    });
    return () => {
      active = false;
      if (player) {
        try {
          const currentTime = player.getCurrentTime();
          if (Number.isFinite(currentTime) && currentTime > 0) resumePositions.set(videoId, currentTime);
        } catch { /* Embedded playback may already be unavailable. */ }
        player.destroy();
      }
    };
  }, [videoId]);

  return <div className="halloween-youtube-player"><iframe ref={iframeRef}
    src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&start=${resumeAt}&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
    title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>;
}
