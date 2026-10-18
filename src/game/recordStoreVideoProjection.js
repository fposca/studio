import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import { loadYouTubeIframeApi } from "./youtubeIframeApi.js";

const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 360;
const WORLD_WIDTH = 1.46;
const WORLD_HEIGHT = 0.82;

export function createRecordStoreVideoProjection(container, jukebox, standbyLabel) {
  const renderer = new CSS3DRenderer();
  renderer.domElement.className = "record-store-video-layer";
  renderer.domElement.style.pointerEvents = "none";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const shell = document.createElement("div");
  shell.className = "record-store-projected-screen";
  shell.style.width = `${SCREEN_WIDTH}px`;
  shell.style.height = `${SCREEN_HEIGHT}px`;
  shell.style.pointerEvents = "none";
  shell.style.display = "none";
  const screen = new CSS3DObject(shell);
  screen.position.copy(jukebox.localToWorld(new THREE.Vector3(0, 1.92, 0.8)));
  jukebox.getWorldQuaternion(screen.quaternion);
  const worldScale = jukebox.getWorldScale(new THREE.Vector3()).x;
  screen.scale.set(WORLD_WIDTH * worldScale / SCREEN_WIDTH, WORLD_HEIGHT * worldScale / SCREEN_HEIGHT, 1);
  scene.add(screen);

  const front = new THREE.Vector3(0, 0, 1).applyQuaternion(screen.quaternion);
  const toCamera = new THREE.Vector3();
  const toScreen = new THREE.Vector3();
  let key = null;
  let player = null;
  let firstSeconds = 0;
  let startedAt = 0;
  let playing = false;
  let disposed = false;

  function clear() {
    key = null;
    player?.destroy?.();
    player = null;
    shell.replaceChildren();
    shell.style.display = "none";
    standbyLabel.visible = true;
  }

  function setVideo(video) {
    const nextKey = video ? `${video.videoId}:${Math.floor(video.seconds || 0)}:${video.playing !== false}` : null;
    if (key === nextKey) return;
    clear();
    if (!video) return;
    key = nextKey;
    firstSeconds = Math.max(0, video.seconds || 0);
    startedAt = performance.now();
    playing = video.playing !== false;
    standbyLabel.visible = false;
    shell.style.display = "block";
    const frame = document.createElement("iframe");
    frame.width = String(SCREEN_WIDTH);
    frame.height = String(SCREEN_HEIGHT);
    frame.title = `${video.title} · pantalla de la rockola`;
    frame.src = `https://www.youtube.com/embed/${video.videoId}?autoplay=${playing ? 1 : 0}&playsinline=1&controls=0&enablejsapi=1&start=${Math.floor(firstSeconds)}&origin=${encodeURIComponent(window.location.origin)}`;
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.tabIndex = -1;
    shell.appendChild(frame);
    loadYouTubeIframeApi().then((YT) => {
      if (disposed || key !== nextKey) return;
      player = new YT.Player(frame, {
        events: {
          onReady: () => {
            if (disposed || key !== nextKey) return;
            if (firstSeconds > 0) player?.seekTo?.(firstSeconds, true);
            if (playing) player?.playVideo?.();
            else player?.pauseVideo?.();
          },
          onStateChange: (event) => {
            if (disposed || key !== nextKey) return;
            const seconds = player?.getCurrentTime?.();
            if (Number.isFinite(seconds)) firstSeconds = seconds;
            startedAt = performance.now();
            if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.BUFFERING) playing = true;
            else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) playing = false;
          }
        }
      });
    }).catch(() => { /* The embedded video remains visible without API controls. */ });
  }

  function getSnapshot() {
    const reported = player?.getCurrentTime?.();
    const seconds = Number.isFinite(reported) ? reported : firstSeconds + (playing ? (performance.now() - startedAt) / 1000 : 0);
    return key ? { seconds: Math.max(0, seconds), playing } : null;
  }

  function render(camera) {
    if (!key) return;
    toCamera.subVectors(camera.position, screen.position);
    camera.getWorldDirection(toScreen);
    const inFront = toScreen.dot(toCamera.clone().negate().normalize()) > 0;
    shell.style.visibility = inFront && front.dot(toCamera) > 0.15 && toCamera.length() < 21 ? "visible" : "hidden";
    renderer.render(scene, camera);
  }

  function resize(width, height) { renderer.setSize(width, height); }

  function dispose() {
    disposed = true;
    clear();
    renderer.domElement.remove();
  }

  return { setVideo, getSnapshot, render, resize, dispose, element: renderer.domElement };
}
