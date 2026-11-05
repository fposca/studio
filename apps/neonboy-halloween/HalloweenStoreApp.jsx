import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUp, Coins, Disc3, ExternalLink, Headphones, MessageCircle, Phone, PhoneOff, Play, Radio, Save, ScanEye, Volume2, VolumeX, X } from "lucide-react";
import HalloweenStoreScene from "./HalloweenStoreScene.jsx";
import InteractionPrompt from "../../src/game/InteractionPrompt.jsx";
import { advanceVisionClock, toggleVisionClock } from "./halloweenEncounterLogic.js";
import { SECRET_COVERS, MIRROR_MESSAGES, PHONE_LINES, HALLOWEEN_NPC_IDS, nextPhoneInterval, getAnniversaryProgress, canSummonJudge, canUnlockSecretVinyl } from "./halloweenSecretsLogic.js";
import { createHalloweenSfx } from "./halloweenSfx.js";
import { COMBAT_MAX_HEARTS, receiveCombatDamage } from "../../src/game/combatHeartsLogic.js";
import HalloweenJoystick from "./HalloweenJoystick.jsx";
import { Capacitor } from "@capacitor/core";
import HalloweenConversation from "./HalloweenConversation.jsx";
import { advanceBelfegorAttempt, canRevealRealityKey } from "./halloweenBelfegorLogic.js";
import HalloweenRealityKey from "./HalloweenRealityKey.jsx";
import { advanceRealityChest, EMPTY_REALITY_CHEST } from "./halloweenRealityChestLogic.js";
import HalloweenYouTubePlayer from "./HalloweenYouTubePlayer.jsx";
import { findDemonVoiceUrl } from "./halloweenDemonVoices.js";
import { NEONBOY_VOICES, chooseExplorationCue, chooseDemonVictoryCue, resolveCombatCue } from "./halloweenNeonboyVoices.js";
import { JUDGE_MAX_HEALTH, JUDGE_FURY_HEALTH, JUDGE_QUESTIONS, judgeAnswer } from "./halloweenJudgeLogic.js";
import { CONVERSATIONS as conversations, AMBIENT_CONVERSATIONS, ANNIVERSARY_LINES, getHalloweenVoiceUrl } from "./halloweenDialogue.js";
import { BAND_LOGO, DISCOGRAPHY_ALBUMS, DISCOGRAPHY_GROUPS } from "../../src/game/discographyCatalog.js";
import { STORE_NPCS } from "../../src/game/recordStoreDialogue.js";
import { ROCKOLA_VIDEOS } from "../../src/game/recordStoreVideos.js";

const FREDDY_LAUGH_URL = new URL("../../src/assets/neonboy-animaciones/voces/freddy/Fredy-laugh.mp3", import.meta.url).href;
const JASON_SOUND_URL = new URL("../../src/assets/neonboy-animaciones/voces/jason/jason.mp3", import.meta.url).href;
const FREEZER_URL = new URL("../../halloween/freezer.mp3", import.meta.url).href;
const NEONBOY_LOGO = new URL("../../src/assets/neonboy-logo.png", import.meta.url).href;
const FREEZER_VOLUME = 0.12;
const FREEZER_DIALOGUE_VOLUME = 0.025;
const PHONE_VOICE_URLS = import.meta.glob([
  "./audio/phone/telefono-0*.mp3",
  "../../src/assets/neonboy-animaciones/voces/telefono/*.mp3"
], { eager: true, query: "?url", import: "default" });
function findPhoneVoice(index) {
  const numbered = PHONE_VOICE_URLS[`./audio/phone/telefono-${String(index + 1).padStart(2, "0")}.mp3`];
  if (numbered) return numbered;
  const tokens = ["hola", "estas-escuchando", "cuatro-anos", "los-discos"];
  return Object.entries(PHONE_VOICE_URLS).find(([path]) =>
    path.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(tokens[index]))?.[1] || null;
}
const VHS_VIDEO_URL = new URL("./media/video-vhs.mp4", import.meta.url).href;
const HERO_AUDIO_FILES = import.meta.glob("./audio/neonboy/*.mp3", { eager: true, query: "?url", import: "default" });
const HERO_AUDIO_URLS = Object.fromEntries(Object.entries(HERO_AUDIO_FILES).map(([path, url]) => [path.split("/").at(-1), url]));
const DEMON_VOICE_URLS = import.meta.glob(["./voices/demon-regueton-*.mp3", "../../halloween/demon-regueton-*.mp3", "../../halloween/Venezolano-*.mp3"], { eager: true, query: "?url", import: "default" });
const JUDGE_VOICES = import.meta.glob(["./voices/dialogo-juez-*.mp3", "./audio/judge/dialogo-juez-*.mp3"], { eager: true, query: "?url", import: "default" });
const getJudgeVoiceUrl = (id) => Object.entries(JUDGE_VOICES).find(([path]) => path.endsWith(`/${id}.mp3`))?.[1] || null;
const JUDGE_INTRO = [
  { id: "dialogo-juez-01", speaker: "El Juez del Abismo", text: "As\u00ed que derrotaste a mi peque\u00f1o sirviente... Qu\u00e9 conmovedor. Pero la fuerza no demuestra sabidur\u00eda." },
  { id: "dialogo-juez-02", speaker: "El Juez del Abismo", text: "Cinco preguntas sobre la existencia. Cinco oportunidades para demostrar que tu alma vale algo." },
  { id: "dialogo-juez-03", speaker: "El Juez del Abismo", text: "Y cuidado con tus respuestas... llevo siglos escuchando mentiras." },
];
const JUDGE_VICTORY = [
  { id: "dialogo-juez-victoria-01", speaker: "El Juez del Abismo", text: "\u00a1Imposible! \u00a1Nadie hab\u00eda superado mi juicio!" },
  { id: "dialogo-juez-victoria-02", speaker: "El Juez del Abismo", text: "\u00bfCre\u00edste que iba a dejarte marchar por responder cinco preguntitas?" },
  { id: "dialogo-juez-victoria-03", speaker: "El Juez del Abismo", text: "\u00a1YO NO PIERDO JAM\u00c1S!" },
];
const JUDGE_DEFEAT = [
  { id: "dialogo-juez-derrota-01", speaker: "El Juez del Abismo", text: "\u00a1Ja, ja, ja! \u00a1La ignorancia humana nunca deja de sorprenderme!" },
  { id: "dialogo-juez-derrota-02", speaker: "El Juez del Abismo", text: "Tu alma no ha superado mi juicio." },
  { id: "dialogo-juez-derrota-03", speaker: "El Juez del Abismo", text: "Pero no te preocupes... \u00a1tambi\u00e9n disfruto destruyendo a los que fracasan!" },
];
const JUDGE_FINAL = [{ id: "dialogo-juez-final", speaker: "El Juez del Abismo", text: "\u00a1No puede ser!... \u00a1Un simple m\u00fasico derrotando al guardi\u00e1n del abismo!" }];
const DEMON_LINES = {
  1: "\u00a1Ey, m\u00e1scara! \u00bfQu\u00e9 hac\u00e9s en mi territorio? \u00a1Ac\u00e1 mando yo, pap\u00e1!",
  2: "\u00a1\u00bfC\u00f3mo hiciste para ver mi verdadera forma?! \u00a1Eso no estaba en el contrato!",
  3: "\u00a1Ey, ey, ey! \u00a1Tranquilo con esa lucecita, que me arruin\u00e1s el flow!",
  4: "\u00a1Nooo! \u00a1Me est\u00e1n borrando del sistema! \u00a1Mi autotuneee!",
};



export default function HalloweenStoreApp({ initialSave, saveSlot, onSave, onExit, onRetry }) {
  const [visionClock, setVisionClock] = useState(() => ({ phase: initialSave?.chest?.collected ? "ready" : "locked", remaining: 0, activation: 0 }));
  const visionClockRef = useRef(visionClock);
  visionClockRef.current = visionClock;
  const vision = visionClock.phase === "active";
  const [realityChest, setRealityChest] = useState(initialSave?.chest || EMPTY_REALITY_CHEST);
  const realityChestRef = useRef(initialSave?.chest || EMPTY_REALITY_CHEST);
  const updateRealityChest = (action) => {
    const next = advanceRealityChest(realityChestRef.current, action);
    realityChestRef.current = next;
    setRealityChest(next);
    return next;
  };
  const glassesCollected = realityChest.collected;
  const [demonHealth, setDemonHealth] = useState(initialSave?.demonHealth ?? 3);
  const [judgePhase, setJudgePhase] = useState(initialSave?.judgeDefeated ? "gone" : "inactive");
  const judgePhaseRef = useRef(initialSave?.judgeDefeated ? "gone" : "inactive");
  judgePhaseRef.current = judgePhase;
  const [judgeHealth, setJudgeHealth] = useState(initialSave?.judgeDefeated ? 0 : JUDGE_MAX_HEALTH);
  const [judgeQuestion, setJudgeQuestion] = useState(0);
  const [judgeCorrect, setJudgeCorrect] = useState(0);
  const [judgeReaction, setJudgeReaction] = useState("");
  const judgeAnswerLockedRef = useRef(false);
  const judgeDeathRef = useRef({ animation: false });
  const judgeTimersRef = useRef(new Set());
  const scheduleJudge = (callback, delay) => {
    const id = window.setTimeout(() => { judgeTimersRef.current.delete(id); callback(); }, delay);
    judgeTimersRef.current.add(id);
    return id;
  };
  const [hideDefeatedDemon, setHideDefeatedDemon] = useState(initialSave?.demonHealth === 0);
  const [combatHearts, setCombatHearts] = useState(initialSave?.hearts ?? COMBAT_MAX_HEARTS);
  const [damageActive, setDamageActive] = useState(false);
  const damageTimerRef = useRef(0);
  const combatHeartsRef = useRef(initialSave?.hearts ?? COMBAT_MAX_HEARTS);
  const invulnerableUntilRef = useRef(0);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);
  const [encounterKey, setEncounterKey] = useState(0);
  const [demonSubtitle, setDemonSubtitle] = useState(null);
  const [heroSubtitle, setHeroSubtitle] = useState(null);
  const heroVoiceRef = useRef(null);
  const heroCurrentIdRef = useRef(null);
  const heroQueueRef = useRef([]);
  const heroLastPlayedRef = useRef(new Map());
  const heroLastRandomRef = useRef(null);
  const heroRandomRemainingRef = useRef(90 + Math.random() * 60);
  const heroIntroQueuedRef = useRef(false);
  const heroCombatQueuedRef = useRef(false);
  const heroJudgeVictoryQueuedRef = useRef(false);
  const judgeFinalVoiceDoneRef = useRef(false);
  const heroSubtitleTimerRef = useRef(0);
  const heroTryRef = useRef(null);
  const heroContextRef = useRef(null);
  const [vhsCollected, setVhsCollected] = useState(initialSave?.vhsCollected ?? false);
  const [anniversaryUnlocked, setAnniversaryUnlocked] = useState(initialSave?.judgeDefeated ?? false);
  const judgeStatusRef = useRef(null);
  judgeStatusRef.current = { phase: judgePhase, health: judgeHealth, anniversaryUnlocked };
  const [discoveredSecrets, setDiscoveredSecrets] = useState(() => new Set(initialSave?.discoveredSecrets || []));
  const [mirrorMessage, setMirrorMessage] = useState("");
  const mirrorIndexRef = useRef((initialSave?.discoveredSecrets || []).filter((id) => id.startsWith("mirror:")).length % MIRROR_MESSAGES.length);
  const [phoneRinging, setPhoneRinging] = useState(false);
  const phoneRingingRef = useRef(false);
  const phoneCallIndexRef = useRef(initialSave?.phoneCalls ?? 0);
  const [phoneLine, setPhoneLine] = useState("");
  const phoneTimerRef = useRef(0);
  const vhsVideoRef = useRef(null);
  const vhsHostRef = useRef(null);
  const [vhsAutoplayBlocked, setVhsAutoplayBlocked] = useState(false);
  const sfxRef = useRef(null);
  if (!sfxRef.current) sfxRef.current = createHalloweenSfx();
  const demonSubtitleTimerRef = useRef(0);
  const demonDeathFallbackRef = useRef(0);
  const demonVoicePlayedRef = useRef(new Set());
  const clockPausedRef = useRef(false);
  const lastClockTickRef = useRef(performance.now());
  const [firstPerson, setFirstPerson] = useState(initialSave?.firstPerson ?? false);
  const [touchRun, setTouchRun] = useState(false);
  const [orbStatus, setOrbStatus] = useState({ phase: "ready", cooldown: 0 });
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const nativeAndroid = Capacitor.getPlatform() === "android";
  const [ready, setReady] = useState(null);
  const [contextLost, setContextLost] = useState(false);
  const [loading, setLoading] = useState({ percent: 0, label: "Preparando la tienda..." });
  const [nearby, setNearby] = useState(null);
  const [panel, setPanel] = useState(null);
  const [selectedId, setSelectedId] = useState(DISCOGRAPHY_ALBUMS[0]?.id);
  const [trackIndex, setTrackIndex] = useState(null);
  const [videoIndex, setVideoIndex] = useState(null);
  const [credits, setCredits] = useState(initialSave?.credits ?? 0);
  const [coinNotice, setCoinNotice] = useState(null);
  const [jukeboxMessage, setJukeboxMessage] = useState("Tomá las fichas de la mesa. Cada video cuesta una ficha.");
  const creditsRef = useRef(initialSave?.credits ?? 0);
  const activeVideoRef = useRef(null);
  const [npcId, setNpcId] = useState(null);
  const [topicIndex, setTopicIndex] = useState(null);
  const jasonAttemptsRef = useRef(initialSave?.belfegorAttempts ?? 0);
  const [belfegorAttempts, setBelfegorAttempts] = useState(initialSave?.belfegorAttempts ?? 0);
  const [jasonResponded, setJasonResponded] = useState((initialSave?.belfegorAttempts ?? 0) >= 4);
  const specialAudioRef = useRef(null);
  const pendingVoiceRef = useRef(null);
  const freezerRef = useRef(null);
  const freezerShouldPlayRef = useRef(false);
  const [ambientEnabled, setAmbientEnabled] = useState(initialSave?.ambientEnabled ?? true);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [musicPlayback, setMusicPlayback] = useState({ key: null, playing: null });
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [showHelp, setShowHelp] = useState(!initialSave || (initialSave.demonHealth === 3 && initialSave.discoveredSecrets.length === 0));
  const [reduceFlashing, setReduceFlashing] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [lightingEvent, setLightingEvent] = useState(null);
  const lightingRef = useRef(null);
  const [sequence, setSequence] = useState(null);
  const sequenceRef = useRef(null);
  sequenceRef.current = sequence;
  const [nearPair, setNearPair] = useState(null);
  const lastAmbientRef = useRef({ id: null, at: 0 });
  const playedSongsRef = useRef(new Set(initialSave?.songs || []));
  const [songsPlayed, setSongsPlayed] = useState(Math.min(3, initialSave?.songs?.length || 0));
  const [anniversaryStatus, setAnniversaryStatus] = useState(initialSave?.judgeDefeated ? "done" : "waiting");
  const anniversaryStatusRef = useRef("waiting");
  anniversaryStatusRef.current = anniversaryStatus;
  const [secretRewardPending, setSecretRewardPending] = useState(false);
  const [anniversaryMessage, setAnniversaryMessage] = useState(false);
  const anniversaryTimerRef = useRef(0);
  const panelRef = useRef(panel);
  panelRef.current = panel;
  const albums = useMemo(() => DISCOGRAPHY_ALBUMS, []);
  const selected = albums.find((album) => album.id === selectedId) || albums[0];
  const matrixCover = (album) => vision && SECRET_COVERS[album.id]?.alternateId
    ? albums.find((candidate) => candidate.id === SECRET_COVERS[album.id].alternateId)?.cover || album.cover
    : album.cover;
  const archiveProgress = getAnniversaryProgress({ demonHealth, vhsCollected, discovered: discoveredSecrets, songsPlayed });
  const judgeCluesComplete = archiveProgress.demonDefeated && archiveProgress.calls === PHONE_LINES.length &&
    archiveProgress.vhsInserted && archiveProgress.npcDialogues === HALLOWEEN_NPC_IDS.length;
  const secretVinylUnlocked = canUnlockSecretVinyl({ judgeDefeated: anniversaryUnlocked, demonHealth, vhsCollected, discovered: discoveredSecrets, songsPlayed });
  const secretVinylWasUnlockedRef = useRef(secretVinylUnlocked);
  const playerPositionRef = useRef(initialSave?.player || { x: 0, z: 11.1, yaw: Math.PI });
  const saveSnapshotRef = useRef(null);
  saveSnapshotRef.current = {
    chest: realityChest, demonHealth, judgeDefeated: judgePhase === "gone",
    hearts: combatHearts, credits, belfegorAttempts, discoveredSecrets: [...discoveredSecrets],
    phoneCalls: phoneCallIndexRef.current, vhsCollected, songs: [...playedSongsRef.current],
    player: playerPositionRef.current, firstPerson, ambientEnabled,
  };
  const saveNowRef = useRef(null);
  saveNowRef.current = (announce = false) => {
    if (ready !== true || gameOverRef.current) return false;
    const saved = onSave(saveSlot, { ...saveSnapshotRef.current, player: playerPositionRef.current, phoneCalls: phoneCallIndexRef.current, songs: [...playedSongsRef.current] });
    if (announce) setCoinNotice(saved ? `PARTIDA ${saveSlot + 1} GUARDADA` : "NO SE PUDO GUARDAR LA PARTIDA");
    return saved;
  };
  useEffect(() => {
    if (ready !== true || gameOver) return;
    const timer = window.setInterval(() => saveNowRef.current?.(), 15000);
    const onPageHide = () => saveNowRef.current?.();
    window.addEventListener("pagehide", onPageHide);
    const onHidden = () => { if (document.hidden) saveNowRef.current?.(); };
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [ready, gameOver, saveSlot]);
  const goToMenu = () => { if (!gameOverRef.current) saveNowRef.current?.(); onExit(); };
  const activeGroup = selected.group;
  const visibleAlbums = albums.filter((album) => album.group === activeGroup);
  const npc = npcId ? conversations[npcId] : null;
  const activeTrack = trackIndex === null ? null : selected?.tracks?.[trackIndex];
  const video = videoIndex === null ? null : ROCKOLA_VIDEOS[videoIndex];
  const musicKey = panel === "album" && activeTrack ? `album:${activeTrack.videoId}`
    : panel === "jukebox" && video ? `jukebox:${video.videoId}` : null;
  const musicBusy = Boolean(musicKey) && (musicPlayback.key !== musicKey || musicPlayback.playing !== false);
  const freezerShouldPlay = ready !== null && ambientEnabled && pageVisible && !gameOver && !musicBusy && !["vhs", "phone"].includes(panel);
  const dialogueActive = voicePlaying || Boolean(phoneLine) || Boolean(demonSubtitle) || Boolean(sequence && sequence.index < sequence.lines.length);
  const audioBusyRef = useRef(false);
  audioBusyRef.current = dialogueActive || musicBusy;
  clockPausedRef.current = Boolean(panel) || !pageVisible || gameOver || ["spawning", "intro", "quiz", "quiz-result", "outcome", "dying"].includes(judgePhase);
  freezerShouldPlayRef.current = freezerShouldPlay;
  heroContextRef.current = { ready, pageVisible, panel, sequence, judgePhase, demonHealth, demonSubtitle, phoneLine, phoneRinging, musicBusy, lightingEvent, gameOver };

  useEffect(() => {
    const audio = new Audio(FREEZER_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    freezerRef.current = audio;
    const unlock = () => {
      if (freezerShouldPlayRef.current && audio.paused) Promise.resolve(audio.play()).catch(() => {});
    };
    const onVisibility = () => setPageVisible(!document.hidden);
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", onVisibility);
      audio.pause();
      audio.src = "";
      freezerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = freezerRef.current;
    if (!audio) return;
    if (!freezerShouldPlay) {
      audio.pause();
      audio.volume = 0;
      return;
    }
    audio.volume = dialogueActive ? FREEZER_DIALOGUE_VOLUME : FREEZER_VOLUME;
    if (audio.paused) Promise.resolve(audio.play()).catch(() => {});
  }, [freezerShouldPlay, dialogueActive]);

  useEffect(() => {
    // Prepare the media element before the TV interaction so play() runs inside
    // the user's E/tap gesture (required for audio autoplay on Android).
    const video = document.createElement("video");
    video.src = VHS_VIDEO_URL;
    video.preload = "auto";
    video.controls = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-label", "Video VHS de NeonBoy con audio");
    vhsVideoRef.current = video;
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
      vhsVideoRef.current = null;
    };
  }, []);

  useEffect(() => {
    const video = vhsVideoRef.current;
    if (!video) return;
    if (panel === "vhs") {
      if (vhsHostRef.current) vhsHostRef.current.appendChild(video);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [panel]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1, (now - lastClockTickRef.current) / 1000);
      lastClockTickRef.current = now;
      setVisionClock((clock) => advanceVisionClock(clock, dt, clockPausedRef.current));
    }, 100);
    return () => window.clearInterval(timer);
  }, []);
  const chooseGroup = (id) => {
    if (id === activeGroup) return;
    const firstAlbum = albums.find((album) => album.group === id);
    if (!firstAlbum) return;
    setSelectedId(firstAlbum.id);
    setTrackIndex(null);
  };

  const stopNpcSound = () => {
    if (specialAudioRef.current === heroVoiceRef.current && heroVoiceRef.current) {
      // A blocked intro stays pending until a real user gesture can play it.
      if (heroCurrentIdRef.current === "neonboy-intro-01" && !heroLastPlayedRef.current.has("neonboy-intro-01") &&
          !heroQueueRef.current.some((entry) => entry.id === "neonboy-intro-01")) {
        heroQueueRef.current.unshift({ id: "neonboy-intro-01", expiresAt: Infinity });
      }
      heroVoiceRef.current = null;
      heroCurrentIdRef.current = null;
    }
    window.clearTimeout(heroSubtitleTimerRef.current);
    setHeroSubtitle(null);
    pendingVoiceRef.current = null;
    specialAudioRef.current?.pause();
    specialAudioRef.current = null;
    setVoicePlaying(false);
  };
  const playNpcSound = (url, onBlocked) => {
    stopNpcSound();
    const voice = new Audio(url);
    voice.preload = "auto";
    specialAudioRef.current = voice;
    voice.addEventListener("playing", () => { if (specialAudioRef.current === voice) setVoicePlaying(true); });
    for (const event of ["pause", "ended", "error"]) {
      voice.addEventListener(event, () => { if (specialAudioRef.current === voice) setVoicePlaying(false); });
    }
    Promise.resolve(voice.play()).catch((error) => {
      if (specialAudioRef.current !== voice) return;
      if (error?.name === "NotAllowedError") pendingVoiceRef.current = voice;
      onBlocked?.(error);
    });
    return voice;
  };
  // NeonBoy uses the same voice channel as every NPC. Important NPC lines can
  // interrupt him, while queued hero lines wait until the channel is free.
  const queueHeroVoice = (id) => {
    const cue = NEONBOY_VOICES[id];
    if (!cue || gameOverRef.current) return;
    const now = performance.now();
    if (now - (heroLastPlayedRef.current.get(id) ?? -Infinity) < cue.cooldownMs) return;
    if (heroQueueRef.current.some((entry) => entry.id === id) || heroVoiceRef.current && heroSubtitle?.id === id) return;
    const ttl = cue.category === "intro" ? Infinity : cue.category === "victory" ? 90000 : cue.category === "combat" ? 45000 : cue.category === "damage" ? 10000 : 12000;
    heroQueueRef.current.push({ id, expiresAt: now + ttl });
    heroQueueRef.current.sort((a, b) => NEONBOY_VOICES[b.id].priority - NEONBOY_VOICES[a.id].priority);
  };
  const tryPlayHeroVoice = () => {
    const context = heroContextRef.current;
    if (!context?.ready || !context.pageVisible || context.panel || context.sequence || context.musicBusy ||
      context.demonSubtitle || context.phoneLine || context.phoneRinging || context.lightingEvent ||
      context.gameOver || gameOverRef.current || heroVoiceRef.current || pendingVoiceRef.current ||
      specialAudioRef.current && !specialAudioRef.current.paused && !specialAudioRef.current.ended) return;
    const now = performance.now();
    heroQueueRef.current = heroQueueRef.current.filter((entry) => entry.expiresAt > now);
    const index = heroQueueRef.current.findIndex(({ id }) => {
      const category = NEONBOY_VOICES[id].category;
      if (category === "exploration") return context.judgePhase === "inactive" && !(demonVoicePlayedRef.current.has(1) && context.demonHealth > 0);
      if (category === "intro") return context.judgePhase === "inactive";
      if (id === "neonboy-special-02") return context.judgePhase === "gone";
      return !["spawning", "intro", "quiz", "quiz-result", "outcome", "dying", "game-over"].includes(context.judgePhase);
    });
    if (index < 0) return;
    const [{ id }] = heroQueueRef.current.splice(index, 1);
    const cue = NEONBOY_VOICES[id];
    const url = cue.file && HERO_AUDIO_URLS[cue.file];
    if (!url) {
      setHeroSubtitle({ id, text: cue.text });
      heroSubtitleTimerRef.current = window.setTimeout(() => setHeroSubtitle((current) => current?.id === id ? null : current), 3200);
      heroLastPlayedRef.current.set(id, now);
      return;
    }
    let voice;
    const fail = () => {
      if (heroVoiceRef.current !== voice) return;
      heroVoiceRef.current = null;
      heroCurrentIdRef.current = null;
      heroLastPlayedRef.current.set(id, performance.now());
      setHeroSubtitle({ id, text: cue.text });
      heroSubtitleTimerRef.current = window.setTimeout(() => setHeroSubtitle((current) => current?.id === id ? null : current), 3200);
    };
    voice = playNpcSound(url, (error) => { if (error?.name !== "NotAllowedError") fail(); });
    heroVoiceRef.current = voice;
    heroCurrentIdRef.current = id;
    voice.addEventListener("playing", () => {
      if (heroVoiceRef.current !== voice) return;
      window.clearTimeout(heroSubtitleTimerRef.current);
      setHeroSubtitle({ id, text: cue.text });
      heroLastPlayedRef.current.set(id, performance.now());
    });
    const finish = () => {
      if (heroVoiceRef.current !== voice) return;
      heroVoiceRef.current = null;
      heroCurrentIdRef.current = null;
      setHeroSubtitle((current) => current?.id === id ? null : current);
    };
    voice.addEventListener("ended", finish, { once: true });
    voice.addEventListener("error", fail, { once: true });
  };
  heroTryRef.current = tryPlayHeroVoice;
  useEffect(() => {
    if (ready !== true || heroIntroQueuedRef.current) return;
    heroIntroQueuedRef.current = true;
    queueHeroVoice("neonboy-intro-01");
  }, [ready, encounterKey]);
  useEffect(() => {
    if (ready !== true) return;
    const timer = window.setInterval(() => {
      heroTryRef.current?.();
      const context = heroContextRef.current;
      if (!context?.pageVisible || context.panel || context.sequence || context.musicBusy || context.demonSubtitle ||
        context.phoneLine || context.phoneRinging || context.lightingEvent || context.gameOver || gameOverRef.current ||
        context.judgePhase !== "inactive" || demonVoicePlayedRef.current.has(1) && context.demonHealth > 0 ||
        heroVoiceRef.current || pendingVoiceRef.current || specialAudioRef.current && !specialAudioRef.current.paused && !specialAudioRef.current.ended) return;
      heroRandomRemainingRef.current -= 1;
      if (heroRandomRemainingRef.current > 0) return;
      heroRandomRemainingRef.current = 90 + Math.random() * 60;
      const id = chooseExplorationCue(heroLastRandomRef.current);
      heroLastRandomRef.current = id;
      queueHeroVoice(id);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [ready, encounterKey]);
  useEffect(() => () => {
    window.clearTimeout(heroSubtitleTimerRef.current);
    heroQueueRef.current = [];
    if (heroVoiceRef.current) heroVoiceRef.current.pause();
  }, []);
  useEffect(() => {
    const retryOnGesture = () => {
      const voice = pendingVoiceRef.current;
      if (!voice || specialAudioRef.current !== voice) return;
      pendingVoiceRef.current = null;
      Promise.resolve(voice.play()).catch((error) => {
        if (error?.name === "NotAllowedError" && specialAudioRef.current === voice) pendingVoiceRef.current = voice;
      });
    };
    window.addEventListener("pointerdown", retryOnGesture, true);
    window.addEventListener("keydown", retryOnGesture, true);
    return () => {
      window.removeEventListener("pointerdown", retryOnGesture, true);
      window.removeEventListener("keydown", retryOnGesture, true);
    };
  }, []);
  const showDemonLine = (id) => {
    if (demonVoicePlayedRef.current.has(id)) return;
    demonVoicePlayedRef.current.add(id);
    window.clearTimeout(demonSubtitleTimerRef.current);
    stopNpcSound();
    setDemonSubtitle({ id, text: DEMON_LINES[id] });
    let demonVoice = null, finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(demonDeathFallbackRef.current);
      if (gameOverRef.current) return;
      if (pendingVoiceRef.current === demonVoice) pendingVoiceRef.current = null;
      window.clearTimeout(demonSubtitleTimerRef.current);
      setDemonSubtitle((current) => current?.id === id ? null : current);
      if (id === 4) {
        queueHeroVoice(chooseDemonVictoryCue());
        setHideDefeatedDemon(true);
        setCoinNotice("EL SEMIDEMONIO CAY\u00d3. EL ESPEJO EXIGE LAS CUATRO LLAMADAS, EL VHS EN LA TV Y SIETE CHARLAS.");
      }
    };
    const scheduleFinish = (delay) => {
      window.clearTimeout(demonSubtitleTimerRef.current);
      demonSubtitleTimerRef.current = window.setTimeout(finish, delay);
    };
    if (id === 4) demonDeathFallbackRef.current = window.setTimeout(finish, 15000);
    const url = findDemonVoiceUrl(DEMON_VOICE_URLS, id);
    if (!url) { scheduleFinish(Math.max(2800, DEMON_LINES[id].length * 55)); return; }
    demonVoice = playNpcSound(url, () => scheduleFinish(Math.max(2800, DEMON_LINES[id].length * 55)));
    demonVoice.addEventListener("playing", () => window.clearTimeout(demonSubtitleTimerRef.current));
    demonVoice.addEventListener("ended", finish, { once: true });
    demonVoice.addEventListener("error", () => scheduleFinish(3000), { once: true });
  };
  function beginJudgeSpawn() {
    if (judgePhaseRef.current !== "inactive" || gameOverRef.current) return;
    judgePhaseRef.current = "spawning";
    setJudgePhase("spawning");
    sfxRef.current?.stop("telefono-ring");
    phoneRingingRef.current = false;
    setPhoneRinging(false);
    if (visionClockRef.current.phase === "active") {
      const next = toggleVisionClock(visionClockRef.current);
      visionClockRef.current = next;
      setVisionClock(next);
    }
    scheduleJudge(() => {
      if (gameOverRef.current) return;
      judgePhaseRef.current = "intro";
      setJudgePhase("intro");
      setSequence({ id: "judge-intro", index: 0, lines: JUDGE_INTRO, kind: "judge-intro" });
    }, 5000);
  }
  const chooseJudgeAnswer = (index) => {
    if (judgePhaseRef.current !== "quiz" || judgeAnswerLockedRef.current) return;
    const answer = judgeAnswer(judgeQuestion, index);
    if (!answer) return;
    judgeAnswerLockedRef.current = true;
    judgePhaseRef.current = "quiz-result";
    setJudgePhase("quiz-result");
    setJudgeReaction(answer.reaction);
    if (answer.correct) setJudgeCorrect((value) => value + 1);
    sfxRef.current?.play(answer.correct ? "boss-correct" : "boss-wrong");
    const url = getJudgeVoiceUrl(`dialogo-juez-pregunta-${judgeQuestion + 1}-${answer.correct ? "correcta" : "incorrecta"}`);
    let advanced = false;
    const advance = () => {
      if (advanced || gameOverRef.current) return;
      advanced = true;
      setJudgeReaction("");
      if (judgeQuestion + 1 < JUDGE_QUESTIONS.length) {
        setJudgeQuestion(judgeQuestion + 1);
        judgeAnswerLockedRef.current = false;
        judgePhaseRef.current = "quiz";
        setJudgePhase("quiz");
        sfxRef.current?.play("boss-question");
      } else {
        judgePhaseRef.current = "outcome";
        setJudgePhase("outcome");
        setSequence({ id: "judge-outcome", index: 0, lines: judgeCorrect + Number(answer.correct) === 5 ? JUDGE_VICTORY : JUDGE_DEFEAT, kind: "judge-outcome" });
      }
    };
    const delay = Math.max(2800, Math.min(6500, answer.reaction.length * 50));
    let fallback = scheduleJudge(advance, delay);
    if (url) {
      const audio = playNpcSound(url);
      audio.addEventListener("playing", () => { window.clearTimeout(fallback); judgeTimersRef.current.delete(fallback); fallback = 0; }, { once: true });
      audio.addEventListener("ended", () => { if (fallback) { window.clearTimeout(fallback); judgeTimersRef.current.delete(fallback); } advance(); }, { once: true });
      audio.addEventListener("error", () => { if (!fallback) fallback = scheduleJudge(advance, delay); }, { once: true });
    }
  };
  const judgeChoiceRef = useRef(null);
  judgeChoiceRef.current = chooseJudgeAnswer;
  useEffect(() => {
    if (judgePhase !== "quiz") return;
    const url = getJudgeVoiceUrl(`dialogo-juez-pregunta-${judgeQuestion + 1}`);
    if (!url) return;
    const voice = playNpcSound(url);
    return () => {
      if (specialAudioRef.current === voice) stopNpcSound();
      else voice.pause();
    };
  }, [judgePhase, judgeQuestion]);
  const maybeQueueJudgeVictory = () => {
    if (!judgeFinalVoiceDoneRef.current || judgePhaseRef.current !== "gone" || heroJudgeVictoryQueuedRef.current) return;
    heroJudgeVictoryQueuedRef.current = true;
    queueHeroVoice("neonboy-special-02");
  };
  const finishJudgeDeath = () => {
    if (judgePhaseRef.current !== "dying" || !judgeDeathRef.current.animation) return;
    judgePhaseRef.current = "gone";
    setJudgePhase("gone");
    setAnniversaryUnlocked(true);
    anniversaryStatusRef.current = "done";
    setAnniversaryStatus("done");
    sfxRef.current?.play("anniversary-unlock");
    maybeQueueJudgeVictory();
  };
  const onJudgeDeathComplete = () => {
    judgeDeathRef.current.animation = true;
    finishJudgeDeath();
  };
  const onJudgeHit = (health) => {
    setJudgeHealth(health);
    if (health !== 0 || judgePhaseRef.current !== "combat") return;
    judgeDeathRef.current = { animation: false };
    judgeFinalVoiceDoneRef.current = false;
    judgePhaseRef.current = "dying";
    setJudgePhase("dying");
    setSequence(null);
    const finalVoice = getJudgeVoiceUrl(JUDGE_FINAL[0].id);
    if (finalVoice) {
      const voice = playNpcSound(finalVoice);
      const complete = () => { judgeFinalVoiceDoneRef.current = true; maybeQueueJudgeVictory(); };
      voice.addEventListener("ended", complete, { once: true });
      voice.addEventListener("error", complete, { once: true });
    } else { judgeFinalVoiceDoneRef.current = true; maybeQueueJudgeVictory(); }
  };
  const onJudgeEvent = (event) => {
    if (event === "teleport-out") sfxRef.current?.stop("boss-teleport-in");
    if (event === "teleport-in") sfxRef.current?.stop("boss-teleport-out");
    sfxRef.current?.play({ spawn: "boss-spawn", hit: "boss-hit", death: "boss-death", orb: "boss-orb", wave: "boss-wave", "teleport-out": "boss-teleport-out", "teleport-in": "boss-teleport-in", fury: "boss-fury" }[event]);
  };
  const wasVisionRef = useRef(false);
  useEffect(() => {
    if (wasVisionRef.current && !vision) sfxRef.current?.play("matrix-deactivate");
    wasVisionRef.current = vision;
  }, [vision]);
  const toggleVision = () => {
    if (gameOverRef.current || panelRef.current || ["spawning", "intro", "quiz", "quiz-result", "outcome", "dying"].includes(judgePhaseRef.current)) return;
    const current = visionClockRef.current;
    const next = toggleVisionClock(current);
    if (next === current) return;
    visionClockRef.current = next;
    setVisionClock(next);
    if (next.phase === "active") sfxRef.current?.play("matrix-activate");
    if (next.phase === "active") { showDemonLine(2); sfxRef.current?.play("matrix-glitch"); }
  };
  const onDemonHit = (health) => {
    setDemonHealth(health);
    sfxRef.current?.play(health === 0 ? "demon-death" : "demon-code-hit");
    if (health === 2) showDemonLine(3);
    if (health === 0) showDemonLine(4);
  };
  const onPlayerDamage = () => {
    if (gameOverRef.current) return;
    const damage = receiveCombatDamage(combatHeartsRef.current, invulnerableUntilRef.current, performance.now());
    if (!damage) return;
    combatHeartsRef.current = damage.hearts;
    invulnerableUntilRef.current = damage.invulnerableUntil;
    setCombatHearts(damage.hearts);
    window.clearTimeout(damageTimerRef.current);
    setDamageActive(true);
    damageTimerRef.current = window.setTimeout(() => setDamageActive(false), 520);
    if (damage.hearts === 0) {
      stopNpcSound();
      window.clearTimeout(phoneTimerRef.current);
      phoneRingingRef.current = false;
      setPhoneRinging(false);
      setPhoneLine("");
      sfxRef.current?.stopAll();
      sfxRef.current?.play("game-over", { force: true });
      gameOverRef.current = true;
      judgePhaseRef.current = "game-over";
      setJudgePhase("game-over");
      setSequence(null);
      setGameOver(true);
    } else {
      sfxRef.current?.play("heart-lost");
      queueHeroVoice("neonboy-damage-02");
    }
  };
  const replayNpcSound = () => {
    const voice = specialAudioRef.current;
    if (!voice) return;
    voice.currentTime = 0;
    Promise.resolve(voice.play()).catch(() => {});
  };
  const toggleNpcSound = () => {
    const voice = specialAudioRef.current;
    if (!voice) return;
    if (voice.paused) Promise.resolve(voice.play()).catch(() => {});
    else voice.pause();
  };
  const markNpcDialogue = (id) => {
    if (!HALLOWEEN_NPC_IDS.includes(id)) return;
    setDiscoveredSecrets((current) => current.has(`npc-dialogue:${id}`)
      ? current : new Set([...current, `npc-dialogue:${id}`]));
  };
  const tryJason = () => {
    if (jasonResponded) {
      playNpcSound(JASON_SOUND_URL);
      return;
    }
    const { attempts, responded } = advanceBelfegorAttempt(jasonAttemptsRef.current);
    jasonAttemptsRef.current = attempts;
    setBelfegorAttempts(attempts);
    if (responded) {
      setJasonResponded(true);
      markNpcDialogue("jason");
      playNpcSound(JASON_SOUND_URL);
    } else stopNpcSound();
  };
  const playDialogueId = (id) => {
    const url = id ? getHalloweenVoiceUrl(id) : null;
    if (url) playNpcSound(url);
    else stopNpcSound();
  };
  const close = () => {
    if (panelRef.current === "phone") {
      window.clearTimeout(phoneTimerRef.current);
      setPhoneLine("");
      sfxRef.current?.play("telefono-hangup");
      if (phoneCallIndexRef.current >= PHONE_LINES.length && judgePhaseRef.current === "inactive") {
        setCoinNotice("CUATRO LLAMADAS ATENDIDAS. FALTAN EL VHS EN LA TV Y LAS CHARLAS CON LOS PERSONAJES.");
      }
    }
    stopNpcSound();
    const revealSecret = secretRewardPending && panelRef.current !== "secret-vinyl";
    setPanel(revealSecret ? "secret-vinyl" : null);
    if (revealSecret || panelRef.current === "secret-vinyl") setSecretRewardPending(false);
    setNpcId(null);
    setTopicIndex(null);
    setVideoIndex(null);
    activeVideoRef.current = null;
  };
  const openAlbum = (id) => {
    stopNpcSound();
    setSelectedId(id);
    if (id !== selectedId) setTrackIndex(null);
    setPanel("album");
    setShowHelp(false);
  };
  const openNpc = (id) => {
    if (!conversations[id]) return;
    stopNpcSound();
    setNpcId(id);
    setTopicIndex(null);
    setPanel("npc");
    setShowHelp(false);
    if (sequenceRef.current) {
      if (sequenceRef.current.kind === "anniversary") finishAnniversary();
      setSequence(null);
    }
    if (id === "freddy") { markNpcDialogue(id); playNpcSound(FREDDY_LAUGH_URL); }
    else if (id === "jason") tryJason();
    else playDialogueId(conversations[id].introId);
  };
  useEffect(() => () => {
    specialAudioRef.current?.pause();
    window.clearTimeout(demonSubtitleTimerRef.current);
    window.clearTimeout(demonDeathFallbackRef.current);
    window.clearTimeout(anniversaryTimerRef.current);
    window.clearTimeout(phoneTimerRef.current);
    window.clearTimeout(damageTimerRef.current);
    for (const timer of judgeTimersRef.current) window.clearTimeout(timer);
    judgeTimersRef.current.clear();
    sfxRef.current?.dispose();
  }, []);
  const markSongPlayed = (id) => {
    if (!id || playedSongsRef.current.has(id)) return;
    playedSongsRef.current.add(id);
    setSongsPlayed(Math.min(3, playedSongsRef.current.size));
  };
  const startAmbient = (conversation) => {
    if (!conversation || sequenceRef.current) return;
    stopNpcSound();
    setPanel(null);
    setNpcId(null);
    setSequence({ id: conversation.id, index: 0, lines: conversation.lines, kind: "ambient" });
    lastAmbientRef.current = { id: conversation.id, at: Date.now() };
  };
  const takeCoins = () => {
    const added = Math.max(0, 10 - creditsRef.current);
    if (!added) { setJukeboxMessage("La bolsa ya está llena. Usá una ficha para recargarla."); return; }
    creditsRef.current = 10;
    setCredits(10);
    setCoinNotice(`Guardaste ${added} fichas. Ya podés usar la rockola.`);
    setJukeboxMessage(`Guardaste ${added} fichas. Elegí un video.`);
  };
  const selectVideo = (index) => {
    if (index === activeVideoRef.current) return;
    stopNpcSound();
    if (creditsRef.current < 1) {
      setJukeboxMessage("Te faltan fichas. Tomá las de la mesa para escuchar otro video.");
      return;
    }
    creditsRef.current -= 1;
    setCredits(creditsRef.current);
    activeVideoRef.current = index;
    setVideoIndex(index);
    markSongPlayed(ROCKOLA_VIDEOS[index].videoId);
    setJukeboxMessage(`Ficha aceptada. Ahora suena ${ROCKOLA_VIDEOS[index].title}.`);
  };
  const toggleAmbient = () => {
    if (!ambientEnabled && ready !== null && pageVisible && !musicBusy) {
      Promise.resolve(freezerRef.current?.play()).catch(() => {});
    }
    setAmbientEnabled((value) => !value);
  };
  const onSecretDiscovered = (id, message, { silent = false } = {}) => {
    setDiscoveredSecrets((current) => {
      if (current.has(id)) return current;
      if (!silent) { sfxRef.current?.play("matrix-secret"); setCoinNotice(message); }
      return new Set([...current, id]);
    });
  };
  const judgeReadyAtMirror = () => canSummonJudge({
    demonDefeated: demonHealth === 0 && hideDefeatedDemon,
    callsAnswered: phoneCallIndexRef.current,
    vhsInserted: archiveProgress.vhsInserted,
    npcDialogues: archiveProgress.npcDialogues,
    visionActive: vision,
    mirrorInView: true,
    judgePhase: judgePhaseRef.current,
  });
  const onMirrorWhisper = () => {
    if (judgeReadyAtMirror()) { beginJudgeSpawn(); return; }
    sfxRef.current?.play("mirror-whisper");
    if (judgePhaseRef.current === "inactive") {
      setCoinNotice(demonHealth > 0 ? "EL ESPEJO ESPERA: DERROT\u00c1 AL SEMIDEMONIO." :
        phoneCallIndexRef.current < PHONE_LINES.length ? `EL ESPEJO ESPERA: ATEND\u00c9 LAS ${PHONE_LINES.length} LLAMADAS (${phoneCallIndexRef.current}/${PHONE_LINES.length}).` :
        !archiveProgress.vhsInserted ? "EL ESPEJO ESPERA: INSERT\u00c1 EL VHS EN LA TV." :
        archiveProgress.npcDialogues < HALLOWEEN_NPC_IDS.length ? `EL ESPEJO ESPERA: HABL\u00c1 CON TODOS (${archiveProgress.npcDialogues}/${HALLOWEEN_NPC_IDS.length}).` :
        "EL ESPEJO ESPERA A QUE TERMINE LA \u00daLTIMA VOZ.");
    }
  };
  useEffect(() => {
    if (secretVinylUnlocked && !secretVinylWasUnlockedRef.current) {
      sfxRef.current?.play("anniversary-unlock");
      setCoinNotice("ARCHIVO COMPLETO: APARECI\u00d3 UN VINILO ROSA EN EL FONDO DE LA TIENDA.");
      if (panelRef.current) setSecretRewardPending(true);
      else setPanel("secret-vinyl");
    }
    secretVinylWasUnlockedRef.current = secretVinylUnlocked;
  }, [secretVinylUnlocked]);
  useEffect(() => {
    if (ready !== true || gameOver) return;
    let remaining = nextPhoneInterval(Math.random, true);
    const timer = window.setInterval(() => {
      if (phoneCallIndexRef.current >= PHONE_LINES.length) return;
      if (phoneRingingRef.current) {
        sfxRef.current?.play("telefono-ring", { loop: true });
        return;
      }
      if (clockPausedRef.current || audioBusyRef.current || judgePhaseRef.current !== "inactive") return;
      remaining -= 1;
      if (remaining > 0) return;
      remaining = nextPhoneInterval();
      phoneRingingRef.current = true;
      setPhoneRinging(true);
      sfxRef.current?.play("telefono-ring", { loop: true });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [ready, gameOver, encounterKey]);
  const onInteract = (target) => {
    if (target.kind === "realityKey") {
      if (!canRevealRealityKey(jasonAttemptsRef.current)) return;
      if (!realityChestRef.current.keyOwned) {
        updateRealityChest("takeKey");
        sfxRef.current?.play("reality-key");
        setPanel("reality-key");
      }
      return;
    }
    if (target.kind === "glassesChest") {
      const current = realityChestRef.current;
      if (!current.keyOwned) {
        sfxRef.current?.play("chest-locked");
        setCoinNotice("Est\u00e1 cerrada.");
      } else {
        const next = updateRealityChest("toggle");
        sfxRef.current?.stop(next.open ? "chest-close" : "chest-open");
        sfxRef.current?.play(next.open ? "chest-open" : "chest-close", { force: true });
      }
      return;
    }
    if (target.kind === "glasses") {
      const wasCollected = realityChestRef.current.collected;
      const next = updateRealityChest("collect");
      if (!wasCollected && next.collected) {
        sfxRef.current?.play("vhs-pickup");
        setVisionClock((clock) => clock.phase === "locked" ? { ...clock, phase: "ready" } : clock);
        setCoinNotice("GAFAS DE REALIDAD OBTENIDAS. Presion\u00e1 C para ver la verdad.");
      }
      return;
    }
    if (target.kind === "phone" && phoneRingingRef.current && phoneCallIndexRef.current < PHONE_LINES.length) {
      phoneRingingRef.current = false;
      setPhoneRinging(false);
      sfxRef.current?.stop("telefono-ring");
      sfxRef.current?.play("telefono-pickup");
      setPanel("phone");
      const index = phoneCallIndexRef.current++;
      setPhoneLine(PHONE_LINES[index]);
      setDiscoveredSecrets((current) => new Set([...current, `phone:${index}`]));
      phoneTimerRef.current = window.setTimeout(() => {
        if (panelRef.current !== "phone") return;
        sfxRef.current?.play("telefono-static");
        phoneTimerRef.current = window.setTimeout(() => {
          if (panelRef.current !== "phone") return;
          const url = findPhoneVoice(index);
          if (url) {
            const voice = playNpcSound(url);
            voice.addEventListener("ended", () => { if (panelRef.current === "phone") close(); }, { once: true });
            voice.addEventListener("error", () => { if (panelRef.current === "phone") close(); }, { once: true });
          } else phoneTimerRef.current = window.setTimeout(() => { if (panelRef.current === "phone") close(); }, Math.max(4200, PHONE_LINES[index].length * 70));
        }, 1300);
      }, 550);
      return;
    }
    if (target.kind === "mirror") {
      if (!vision) { setCoinNotice("EL ESPEJO SOLO RESPONDE EN VISIÓN MATRIX"); return; }
      const index = mirrorIndexRef.current++ % MIRROR_MESSAGES.length;
      setMirrorMessage(MIRROR_MESSAGES[index]);
      setDiscoveredSecrets((current) => new Set([...current, `mirror:${index}`]));
      sfxRef.current?.play("mirror-reveal");
      setPanel("mirror");
      return;
    }
    if (target.kind === "vhs") {
      setVhsCollected(true);
      sfxRef.current?.play("vhs-pickup");
      setCoinNotice("ENCONTRASTE UNA CINTA VHS. LLEVALA AL TELEVISOR.");
      return;
    }
    if (target.kind === "tv") {
      stopNpcSound();
      setDiscoveredSecrets((current) => new Set([...current, "vhs:inserted"]));
      freezerShouldPlayRef.current = false;
      freezerRef.current?.pause();
      const video = vhsVideoRef.current;
      if (video) {
        video.currentTime = 0;
        // Invoke play before React mounts the panel; this is still the interaction gesture.
        Promise.resolve(video.play())
          .then(() => setVhsAutoplayBlocked(false))
          .catch(() => setVhsAutoplayBlocked(true));
      }
      setPanel("vhs");
      sfxRef.current?.play("vhs-insert");
      return;
    }
    if (target.kind === "vinyl") { setPanel("anniversary-vinyl"); return; }
    if (target.kind === "secretVinyl") { setSecretRewardPending(false); setPanel("secret-vinyl"); return; }
    if (target.kind === "npc") openNpc(target.id);
    if (target.kind === "coins") takeCoins();
    if (target.kind === "jukebox") { setPanel("jukebox"); setShowHelp(false); }
  };
  useEffect(() => {
    const onKey = (event) => {
      if (event.repeat) return;
      if (judgePhaseRef.current === "quiz" && /^(Digit|Numpad)[123]$/.test(event.code)) {
        event.preventDefault();
        judgeChoiceRef.current?.(Number(event.code.at(-1)) - 1);
        return;
      }
      if (event.code === "KeyC" && !event.altKey && !event.ctrlKey && !event.metaKey) toggleVision();
      if (event.code === "Escape" && panelRef.current) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!coinNotice || panel) return;
    const timeout = window.setTimeout(() => setCoinNotice(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [coinNotice, panel]);

  const finishAnniversary = () => {
    window.clearTimeout(anniversaryTimerRef.current);
    setAnniversaryMessage(false);
    lightingRef.current = null;
    setLightingEvent(null);
    anniversaryStatusRef.current = "done";
    setAnniversaryStatus("done");
    setAnniversaryUnlocked(true);
    sfxRef.current?.play("anniversary-unlock");
    setCoinNotice("DESBLOQUEASTE EL VINILO DEL CUARTO ANIVERSARIO");
  };
  useEffect(() => {
    if (ready !== true) return;
    let timer = 0, endTimer = 0, alive = true;
    const schedule = (delay) => { timer = window.setTimeout(tick, delay); };
    const tick = () => {
      if (!alive) return;
      if (judgePhaseRef.current !== "inactive") { schedule(10000); return; }
      if (lightingRef.current?.kind === "outage") return;
      if (lightingRef.current || anniversaryStatusRef.current === "running" || sequenceRef.current || panelRef.current === "npc") { schedule(10000); return; }
      const event = { kind: "outage", startedAt: performance.now() };
      sfxRef.current?.play("electric-flicker");
      lightingRef.current = event;
      setLightingEvent(event);
      let outageVoice = null;
      if (!panelRef.current) {
        const cue = ["electric-buzz", "electric-spark", "blackout-ambient"].map(getHalloweenVoiceUrl).find(Boolean);
        if (cue) outageVoice = playNpcSound(cue);
      }
      endTimer = window.setTimeout(() => {
        if (outageVoice && specialAudioRef.current === outageVoice) stopNpcSound();
        lightingRef.current = null;
        setLightingEvent(null);
        schedule(90000 + Math.random() * 90000);
      }, 6600);
    };
    schedule(90000 + Math.random() * 90000);
    if (import.meta.env.DEV) window.__neonboyHalloweenDev = {
      triggerBlackout: () => { window.clearTimeout(timer); tick(); },
      startJudge: () => { window.dispatchEvent(new Event("neonboy-halloween-debug-judge")); setDemonHealth(0); setHideDefeatedDemon(true); beginJudgeSpawn(); },
      hitJudge: () => window.dispatchEvent(new Event("neonboy-halloween-debug-judge-hit")),
      judgeStatus: () => judgeStatusRef.current,
      startJudgeCombat: () => { window.dispatchEvent(new Event("neonboy-halloween-debug-judge-combat")); setDemonHealth(0); setHideDefeatedDemon(true); judgePhaseRef.current = "combat"; setJudgePhase("combat"); }
    };
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.clearTimeout(endTimer);
      if (import.meta.env.DEV) delete window.__neonboyHalloweenDev;
    };
  }, [ready]);
  useEffect(() => {
    if (!nearPair || panel || sequence || lightingEvent || judgePhase !== "inactive") return;
    if (Date.now() - lastAmbientRef.current.at < 120000) return;
    const conversation = AMBIENT_CONVERSATIONS.find((entry) => entry.id === nearPair);
    if (conversation) startAmbient(conversation);
  }, [nearPair, panel, sequence, lightingEvent]);
  useEffect(() => {
    if (anniversaryStatus !== "pending" || panel || sequence || lightingEvent) return;
    const event = { kind: "anniversary", startedAt: performance.now() };
    lightingRef.current = event;
    setLightingEvent(event);
    anniversaryStatusRef.current = "running";
    setAnniversaryStatus("running");
    setSequence({ id: "anniversary", index: 0, lines: ANNIVERSARY_LINES, kind: "anniversary" });
  }, [anniversaryStatus, panel, sequence, lightingEvent]);
  useEffect(() => {
    if (!sequence) return;
    if (sequence.index >= sequence.lines.length) {
      setSequence(null);
      if (sequence.kind === "judge-intro") {
        judgePhaseRef.current = "quiz";
        setJudgePhase("quiz");
        sfxRef.current?.play("boss-question");
      }
      if (sequence.kind === "judge-outcome") {
        judgePhaseRef.current = "combat";
        setJudgePhase("combat");
        sfxRef.current?.play("boss-fury");
        if (!heroCombatQueuedRef.current) {
          heroCombatQueuedRef.current = true;
          queueHeroVoice(resolveCombatCue(HERO_AUDIO_URLS));
        }
      }
      if (sequence.kind === "anniversary") {
        setAnniversaryMessage(true);
        anniversaryTimerRef.current = window.setTimeout(finishAnniversary, 4400);
      }
      return;
    }
    const line = sequence.lines[sequence.index];
    const estimate = Math.max(2300, Math.min(8200, line.text.length * 57));
    const url = getJudgeVoiceUrl(line.id) || getHalloweenVoiceUrl(line.id);
    let timer = 0, finished = false, voice = null;
    const advance = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSequence((current) => current?.id === sequence.id && current.index === sequence.index
        ? { ...current, index: current.index + 1 } : current), 250);
    };
    const fallback = () => { if (!timer && !finished) timer = window.setTimeout(advance, estimate); };
    if (url) {
      voice = playNpcSound(url);
      voice.addEventListener("ended", advance, { once: true });
      voice.addEventListener("error", fallback, { once: true });
      Promise.resolve(voice.play()).catch(fallback);
    } else timer = window.setTimeout(advance, estimate);
    return () => {
      window.clearTimeout(timer);
      if (voice) {
        if (specialAudioRef.current === voice) stopNpcSound();
        else voice.pause();
      }
    };
  }, [sequence?.id, sequence?.index]);

  const touchInput = (code, pressed) => window.dispatchEvent(new KeyboardEvent(pressed ? "keydown" : "keyup", { code, bubbles: true }));
  const touchButton = (code, label, className = "", ariaLabel = label) => <button type="button" className={className} aria-label={ariaLabel}
    onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); touchInput(code, true); }}
    onPointerUp={() => touchInput(code, false)} onPointerCancel={() => touchInput(code, false)}>{label}</button>;

  const nearPrompt = nearby?.kind === "album" ? `Ver ${albums.find((album) => album.id === nearby.id)?.name || "disco"}`
    : nearby?.kind === "npc" ? nearby.id === "jason" ? "Insistir con Belfegor" : `Hablar con ${conversations[nearby.id]?.name || "personaje"}`
      : nearby?.kind === "coins" ? (credits < 10 ? "Tomar fichas de la mesa" : null)
        : nearby?.kind === "realityKey" ? "Recoger llave" : nearby?.kind === "jukebox" ? "Abrir la rockola" : nearby?.kind === "glasses" ? "Tomar gafas de realidad" : nearby?.kind === "glassesChest" ? realityChest.open ? "Cerrar caja" : "Abrir caja"
          : nearby?.kind === "phone" ? "Atender teléfono" : nearby?.kind === "mirror" ? judgeCluesComplete ? "Mirar el espejo con visi\u00f3n C" : "Examinar espejo"
            : nearby?.kind === "vhs" ? "Recoger VHS" : nearby?.kind === "tv" ? "Insertar VHS"
              : nearby?.kind === "vinyl" ? "Ver vinilo del cuarto aniversario" : nearby?.kind === "secretVinyl" ? "Ver vinilo rosa de los secretos" : null;

  return <main className={`halloween-game${vision ? " is-matrix" : ""}${reduceFlashing ? " is-reduced-flashing" : ""}${["spawning", "intro", "quiz", "quiz-result", "outcome", "dying"].includes(judgePhase) ? " is-judge-dialogue" : ""}${judgePhase === "combat" ? " is-judge-combat" : ""}`}>
    <HalloweenStoreScene key={encounterKey} initialSave={initialSave} onPlayerPosition={(position) => { playerPositionRef.current = position; }} albums={albums} vision={vision} damageActive={damageActive} locked={Boolean(panel) || gameOver || !pageVisible || ["spawning", "intro", "quiz", "quiz-result", "outcome", "dying"].includes(judgePhase)} glassesCollected={glassesCollected} chestOpen={realityChest.open} realityKeyOwned={realityChest.keyOwned} belfegorAttempts={belfegorAttempts} visionActivation={visionClock.activation} hideDefeatedDemon={hideDefeatedDemon} onDemonApproach={() => {
      showDemonLine(1);
      if (!heroCombatQueuedRef.current) {
        heroCombatQueuedRef.current = true;
        queueHeroVoice(resolveCombatCue(HERO_AUDIO_URLS));
      }
    }} onDemonHit={onDemonHit} onDemonTaunt={() => sfxRef.current?.play("demon-taunt")} onDemonShieldHit={() => sfxRef.current?.play("demon-shield")} onPlayerDamage={onPlayerDamage} judgePhase={judgePhase} onJudgeHit={onJudgeHit} onJudgeEvent={onJudgeEvent} onJudgeDeathComplete={onJudgeDeathComplete} credits={credits} onSelectAlbum={openAlbum} onInteract={onInteract} onNearby={setNearby} onReady={setReady} onProgress={setLoading} onViewChange={setFirstPerson} lightingEvent={lightingEvent} reduceFlashing={reduceFlashing} onAmbientOpportunity={setNearPair} touchRun={touchRun} touchMoveRef={touchMoveRef} onOrbStatus={setOrbStatus} vhsCollected={vhsCollected} anniversaryUnlocked={anniversaryUnlocked} phoneRinging={phoneRinging} onSecretDiscovered={onSecretDiscovered} onMirrorWhisper={onMirrorWhisper} secretVinylUnlocked={secretVinylUnlocked} onContextChange={setContextLost} />
    <div className="halloween-vignette" aria-hidden="true" />
    <div className={`halloween-damage-overlay${damageActive ? " is-active" : ""}`} aria-hidden="true" />
    <div className="halloween-ui">
      {firstPerson && ready === true && !panel && !gameOver && <div className={`halloween-aim-reticle${orbStatus.phase === "ready" ? "" : " is-cooling"}`} aria-hidden="true" />}
      <header className="halloween-header">
        <div className="halloween-title"><div className="halloween-brandline"><img src={NEONBOY_LOGO} alt="NeonBoy" /><small>MUSIC / HALLOWEEN</small></div><h1>LA TIENDA DE LOS DISCOS</h1><p>Explorá la discografía como en una disquería de los 90.</p></div>
        <nav className="halloween-nav" aria-label="Acciones de la tienda">
          <button type="button" onClick={() => { stopNpcSound(); setPanel("album"); }}><Disc3 size={17} /> DISCOS</button>
          <button id="halloween-people-button" type="button" onClick={() => { stopNpcSound(); setPanel("people"); }}><MessageCircle size={17} /> PERSONAJES</button>
          <span className="halloween-credit-counter" role="status" aria-live="polite"><Coins size={17} /> {credits}/10 FICHAS</span>
          <button type="button" className="halloween-save-nav" onClick={() => setPanel("save")}><Save size={17} /> PARTIDA</button>
          <button type="button" onClick={() => { stopNpcSound(); setPanel("jukebox"); }}><Radio size={17} /> ROCKOLA</button>
          <button type="button" className={`halloween-ambient-toggle${ambientEnabled ? " is-ambient-on" : ""}`} onClick={toggleAmbient}
            aria-pressed={ambientEnabled} aria-label={ambientEnabled ? "Silenciar música ambiental Freezer" : "Activar música ambiental Freezer"}
            title={ambientEnabled ? "Silenciar Freezer" : "Activar Freezer"}>
            {ambientEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />} <span>AMBIENTE</span>
          </button>
          <button type="button" className={vision ? "is-active" : ""} onClick={toggleVision} disabled={visionClock.phase === "locked" || visionClock.phase === "cooldown" || gameOver} aria-pressed={vision} title={visionClock.phase === "locked" ? "Recoger los anteojos 3D" : "Visi\u00f3n Matrix"}><ScanEye size={17} /> VISIÓN C {visionClock.phase === "active" || visionClock.phase === "cooldown" ? `${Math.ceil(visionClock.remaining)}s` : visionClock.phase === "locked" ? "LOCK" : ""}</button>
          <button type="button" onClick={() => setReduceFlashing((value) => !value)} aria-pressed={!reduceFlashing} title="Accesibilidad: desactivar parpadeos">PARPADEO {reduceFlashing ? "OFF" : "ON"}</button>
        </nav>
        <div className="halloween-combat-hearts" role="status" aria-label={`Salud ${combatHearts} de ${COMBAT_MAX_HEARTS}`}>{Array.from({ length: COMBAT_MAX_HEARTS }, (_, index) => <span key={index}>{index < combatHearts ? "\u2665" : "\u2661"}</span>)}</div>
        {judgePhase === "combat" && <div className={`halloween-judge-health${judgeHealth <= JUDGE_FURY_HEALTH ? " is-furious" : ""}`} role="progressbar" aria-label="Vida del Juez del Abismo" aria-valuemin="0" aria-valuemax={JUDGE_MAX_HEALTH} aria-valuenow={judgeHealth}><strong>EL JUEZ DEL ABISMO{judgeHealth <= JUDGE_FURY_HEALTH ? " / FURIA" : ""}</strong><span>{judgeHealth}/{JUDGE_MAX_HEALTH}</span><div><i style={{ width: `${judgeHealth / JUDGE_MAX_HEALTH * 100}%` }} /></div></div>}
      </header>
      <details className="halloween-archive-status">
        <summary>ARCHIVO DE SECRETOS <strong>{archiveProgress.completed}/{archiveProgress.total}</strong></summary>
        <div className="halloween-archive-list">
          <span>Mensajes ocultos <strong>{archiveProgress.matrixMessages}/2</strong></span>
          <span>Portadas Matrix <strong>{archiveProgress.covers}/4</strong></span>
          <span>Mensajes del espejo <strong>{archiveProgress.mirrors}/{MIRROR_MESSAGES.length}</strong></span>
          <span>Llamadas del mostrador <strong>{archiveProgress.calls}/{PHONE_LINES.length}</strong></span>
          <span>VHS en el televisor <strong>{archiveProgress.vhsInserted ? "LISTO" : "PENDIENTE"}</strong></span>
          <span>Charlas con personajes <strong>{archiveProgress.npcDialogues}/{HALLOWEEN_NPC_IDS.length}</strong></span>
          <span>Semidemonio <strong>{archiveProgress.demonDefeated ? "DERROTADO" : "PENDIENTE"}</strong></span>
          <span>Temas distintos <strong>{archiveProgress.songs}/3</strong></span>
          <span>Juez: semidemonio + 4 llamadas + VHS + 7 charlas + espejo con C</span>
        </div>
      </details>
      {showHelp && !panel && judgePhase === "inactive" && <section className="halloween-help" aria-label="Cómo jugar"><button className="halloween-help-close" onClick={() => setShowHelp(false)} aria-label="Cerrar ayuda"><X size={16} /></button><strong>ENTRÁ Y RECORRÉ LA TIENDA</strong><p>Acercate a los discos y a los personajes para descubrir sus historias.</p><span className="halloween-keyboard-hint">WASD caminar · Shift correr &nbsp;|&nbsp; Arrastrar mirar &nbsp;|&nbsp; E interactuar &nbsp;|&nbsp; F/Clic orbe · R recuperar &nbsp;|&nbsp; V vista &nbsp;|&nbsp; C visión Matrix</span><span className="halloween-touch-hint">{nativeAndroid ? "Mové la ruedita para caminar; cuanto más la desplaces, más rápido avanzás. Tocá CORRER para correr, ORBE para disparar y R para recuperarlo; arrastrá para mirar." : "Usá las flechas para moverte. Tocá CORRER para alternar entre caminar y correr; arrastrá para mirar."}</span></section>}
      {!panel && !["spawning", "intro", "quiz", "quiz-result", "outcome", "dying"].includes(judgePhase) && <div className="halloween-touch-controls" aria-label="Controles tactiles">{nativeAndroid ? <HalloweenJoystick inputRef={touchMoveRef} /> : <div className="halloween-touch-pad">
        {touchButton("KeyW", "\u2191", "up")}{touchButton("KeyA", "\u2190", "left")}{touchButton("KeyS", "\u2193", "down")}{touchButton("KeyD", "\u2192", "right")}
      </div>}<div className="halloween-touch-actions"><button type="button" className={touchRun ? "run-toggle is-active" : "run-toggle"} aria-label="Correr" aria-pressed={touchRun} onClick={() => setTouchRun((value) => !value)}><ChevronsUp size={17} /><span>CORRER</span></button><button type="button" className="orb-fire" aria-label="Lanzar Orbe Neón" disabled={orbStatus.phase !== "ready"} onClick={() => { touchInput("KeyF", true); touchInput("KeyF", false); }}><span className="orb-fire-icon" aria-hidden="true" /><small>ORBE</small></button><button type="button" className="orb-recall" aria-label="Recuperar Orbe Neón" disabled={!(["launching", "traveling"].includes(orbStatus.phase))} onClick={() => { touchInput("KeyR", true); touchInput("KeyR", false); }}>R</button>{touchButton("KeyV", "V", "view", "Cambiar de vista")}<button type="button" className="interact" aria-label="Interactuar" onClick={() => { touchInput("KeyE", true); touchInput("KeyE", false); }}>E</button></div></div>}
      {ready === false && <div className="halloween-load-status" role="status">No se pudo iniciar la escena 3D en este navegador. Podés explorar los discos y personajes desde los botones superiores.</div>}

      {nearPrompt && !panel && <div className="halloween-interaction-dock">
        <InteractionPrompt className="halloween-prompt" disabled={gameOver || ready !== true} onClick={() => { touchInput("KeyE", true); touchInput("KeyE", false); }}>{nearPrompt}</InteractionPrompt>
        {nearby?.kind === "glasses" && realityChest.open && <button type="button" className="halloween-chest-close" disabled={gameOver || ready !== true} onClick={() => onInteract({ kind: "glassesChest" })}>Cerrar caja</button>}
      </div>}
      {phoneRinging && !panel && <div className={nativeAndroid ? "halloween-phone-ring is-android" : "halloween-phone-ring"} role="status">
        {nativeAndroid && <Phone size={17} aria-hidden="true" />}
        <div><strong>TELÉFONO 1999 / LLAMADA {Math.min(phoneCallIndexRef.current + 1, PHONE_LINES.length)}/{PHONE_LINES.length}</strong><span>{nativeAndroid ? "Mostrador · acercate y tocá E" : "Suena junto al mostrador. Acercate y presioná E."}</span></div>
      </div>}
      {coinNotice && !panel && <div className="halloween-coin-notice" role="status"><Coins size={18} /> {coinNotice}</div>}
      {sequence && sequence.index < sequence.lines.length && <div className="halloween-ambient-subtitle" role="status" aria-live="polite"><strong>{sequence.lines[sequence.index].speaker.toUpperCase()}</strong><span>{sequence.lines[sequence.index].text}</span>{!sequence.kind.startsWith("judge-") && <button type="button" onClick={() => { if (sequence.kind === "anniversary") finishAnniversary(); setSequence(null); }} aria-label="Omitir charla"><X size={15} /></button>}</div>}
      {anniversaryMessage && <div className="halloween-anniversary" role="status"><strong>NEONBOY — 4 AÑOS</strong><span>Gracias por escuchar y ser parte de esta historia.</span><small>2022 — 2026</small></div>}
      {["quiz", "quiz-result"].includes(judgePhase) && <div className="halloween-judge-quiz" role="dialog" aria-modal="true" aria-label="Juicio del Abismo">
        <small>EL JUEZ DEL ABISMO / PREGUNTA {judgeQuestion + 1}/{JUDGE_QUESTIONS.length} / RECONOCIDAS {judgeCorrect}</small>
        <h2>{JUDGE_QUESTIONS[judgeQuestion].title}</h2>
        <p>{JUDGE_QUESTIONS[judgeQuestion].prompt}</p>
        {judgeReaction ? <blockquote>{judgeReaction}</blockquote> : <div className="halloween-judge-options">{JUDGE_QUESTIONS[judgeQuestion].options.map((option, index) => <button type="button" key={option} onClick={() => chooseJudgeAnswer(index)}><span>{"ABC"[index]}</span>{option}</button>)}</div>}
      </div>}
      {demonSubtitle && !panel && <div className="halloween-demon-subtitle" role="status" aria-live="polite"><strong>EL REGUETONERO</strong><span>{demonSubtitle.text}</span></div>}
      {heroSubtitle && !panel && !demonSubtitle && !sequence && <div className="halloween-demon-subtitle halloween-hero-subtitle" role="status" aria-live="polite"><strong>NEONBOY</strong><span>{heroSubtitle.text}</span></div>}
      {vision && demonHealth > 0 && <div className="halloween-demon-health" role="status" aria-label={`Demonio: ${demonHealth} de 3 vidas`}>DEMONIO <span>{"\u25c6".repeat(demonHealth)}{"\u25c7".repeat(3 - demonHealth)}</span></div>}
      {vision && <div className="halloween-matrix-hud"><span>SECUENCIA ACTIVA</span><strong>REALIDAD / CÓDIGO</strong><small>C PARA VOLVER</small></div>}
      <footer className="halloween-footer"><span>✦ NACIDO EN HALLOWEEN ✦</span><span>{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"} &nbsp; / &nbsp; {vision ? "VISIÓN DE FRECUENCIA" : "TIENDA ORIGINAL"}</span><span>NEONBOY MUSIC</span></footer>
    </div>
    {contextLost && <div className="halloween-context-lost" role="alert">
      <strong>Se interrumpió la imagen 3D</strong>
      <span>Intentando recuperar el escenario...</span>
      <button type="button" onClick={() => window.location.reload()}>Recargar la tienda</button>
    </div>}
    {gameOver && <div className="halloween-game-over" role="alertdialog" aria-modal="true"><strong>GAME OVER</strong><span>NEONBOY HA SIDO DERROTADO</span><small>Podés volver al último guardado o elegir otra partida.</small><div className="halloween-game-over-actions"><button type="button" onClick={onRetry}>REINTENTAR</button><button type="button" onClick={onExit}>IR AL INICIO</button></div></div>}
    {ready === null && <div className="halloween-loading-screen">
      <div className="halloween-loading-card">
        <div className="halloween-loading-brand"><img src={NEONBOY_LOGO} alt="NeonBoy" /><small>MUSIC / HALLOWEEN</small></div>
        <div className="halloween-loading-vinyl" aria-hidden="true"><span /></div>
        <h2>LA TIENDA DE LOS DISCOS</h2>
        <p>{loading.label}</p>
        <div className="halloween-loading-meta"><span>CARGANDO LA EXPERIENCIA</span><strong>{loading.percent}%</strong></div>
        <div className="halloween-loading-track" role="progressbar" aria-label="Carga de la tienda" aria-valuemin="0" aria-valuemax="100" aria-valuenow={loading.percent}>
          <span style={{ width: `${loading.percent}%` }} />
        </div>
        <small className="halloween-loading-hint">Preparando discos, personajes y escenario</small>
      </div>
    </div>}
    {panel && <div className="halloween-panel-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className={`halloween-panel${panel === "npc" ? " halloween-conversation-panel" : ""}${panel === "npc" && !npc?.topics.length ? " is-quiet-conversation" : ""}${panel === "phone" ? " halloween-phone-dialog" : ""}`} role="dialog" aria-modal="true" aria-labelledby={panel === "npc" ? "halloween-dialogue-title" : undefined} aria-label={panel === "album" ? "Discograf\u00eda" : panel === "npc" ? "Conversaci\u00f3n" : panel === "jukebox" ? "Rockola" : panel === "phone" ? "Llamada telef\u00f3nica" : panel === "mirror" ? "Espejo de las almas" : panel === "vhs" ? "Archivo VHS" : panel === "anniversary-vinyl" ? "Vinilo del cuarto aniversario" : panel === "secret-vinyl" ? "Vinilo rosa de los secretos" : panel === "reality-key" ? "Llave de la realidad" : panel === "save" ? "Partida guardada" : "Personajes"}>
        {panel !== "npc" && <div className="halloween-panel-top"><div><small>NEONBOY MUSIC / HALLOWEEN</small><h2>{panel === "album" ? "LOS DISCOS" : panel === "npc" ? npc?.name : panel === "jukebox" ? "LA ROCKOLA" : panel === "save" ? "TU PARTIDA" : panel === "phone" ? "LLAMADA DESCONOCIDA" : panel === "mirror" ? "EL ESPEJO DE LAS ALMAS" : panel === "vhs" ? "ARCHIVO VHS" : panel === "anniversary-vinyl" ? "VINILO DEL CUARTO ANIVERSARIO" : panel === "secret-vinyl" ? "VINILO ROSA / ARCHIVO COMPLETO" : panel === "reality-key" ? "LA LLAVE DE LA REALIDAD" : "LA GENTE DE LA TIENDA"}</h2></div><button onClick={close} aria-label="Cerrar"><X size={22} /></button></div>}
        {panel === "album" && <div className="halloween-album-layout">
          <div className="halloween-album-catalog">
            <div className="halloween-album-groups" role="group" aria-label="Tipo de discos">
              {DISCOGRAPHY_GROUPS.map((group) => <button type="button" key={group.id}
                aria-pressed={activeGroup === group.id} onClick={() => chooseGroup(group.id)}>
                {group.id === "band" ? <img src={BAND_LOGO} alt="" /> : <Headphones size={30} aria-hidden="true" />}
                <span><strong>{group.name}</strong><small>{group.description}</small>
                  <em>{albums.filter((album) => album.group === group.id).length} discos</em></span>
              </button>)}
            </div>
            <div className="halloween-album-grid" aria-label="Discografía">{visibleAlbums.map((album) => <button type="button" key={album.id} className={album.id === selected.id ? "is-selected" : ""} onClick={() => { setSelectedId(album.id); setTrackIndex(null); }} aria-pressed={album.id === selected.id}><img src={matrixCover(album)} alt="" /><span>{album.name}</span></button>)}</div>
          </div>
          <div className="halloween-album-detail"><img src={matrixCover(selected)} alt={`Portada de ${selected.name}`} /><div><small>NEONBOY / {selected.group === "band" ? "9TH REVELATION" : "INSTRUMENTAL"}</small><h3>{selected.name}</h3><p>Elegí un tema para escucharlo.</p></div><div className="halloween-track-list">{selected.tracks.map((track, index) => <button key={`${track.name}-${index}`} className={trackIndex === index ? "is-active" : ""} onClick={() => { setTrackIndex(index); markSongPlayed(track.videoId); }}><span>{String(index + 1).padStart(2, "0")}</span><Play size={14} />{track.name}</button>)}</div>{activeTrack && <div className="halloween-video"><HalloweenYouTubePlayer key={activeTrack.videoId} videoId={activeTrack.videoId} title={`${selected.name} - ${activeTrack.name}`} onPlaybackChange={(playing) => setMusicPlayback({ key: `album:${activeTrack.videoId}`, playing })} /><a href={activeTrack.url} target="_blank" rel="noopener noreferrer">Abrir en YouTube <ExternalLink size={13} /></a></div>}</div>
        </div>}
        {panel === "people" && <div className="halloween-people-grid">{STORE_NPCS.map((person) => <button key={person.id} onClick={() => openNpc(person.id)}><span className="halloween-person-icon"><MessageCircle size={20} /></span><strong>{conversations[person.id]?.name || person.name}</strong><small>{discoveredSecrets.has(`npc-dialogue:${person.id}`) ? "CHARLA REGISTRADA" : conversations[person.id]?.role || person.role}</small><span>{person.id === "freddy" ? "Escuchar risa" : person.id === "jason" ? "Acercarse" : "Conversar"} →</span></button>)}</div>}
        {panel === "npc" && npc && <HalloweenConversation
          npc={npc} npcId={npcId} topicIndex={topicIndex} voice={specialAudioRef.current} voicePlaying={voicePlaying}
          jasonResponded={jasonResponded} belfegorAttempts={belfegorAttempts} conversations={conversations}
          ambientConversations={AMBIENT_CONVERSATIONS.filter((entry) => entry.participants.includes(npcId))}
          onSelectTopic={(index) => { setTopicIndex(index); markNpcDialogue(npcId); playDialogueId(npc.topics[index][2]); }}
          onGreeting={() => { setTopicIndex(null); playDialogueId(npc.introId); }}
          onReplay={replayNpcSound} onToggleVoice={toggleNpcSound} onInsist={tryJason} onAmbient={startAmbient} onClose={close}
        />}
        {panel === "save" && <div className="halloween-save-panel">
          <div className="halloween-save-disc" aria-hidden="true"><Disc3 size={48} /></div>
          <small>ESPACIO {String(saveSlot + 1).padStart(2, "0")} / GUARDADO LOCAL</small>
          <h3>Tu historia sigue acá</h3>
          <p>Se guarda automáticamente cada 15 segundos en este dispositivo. También podés guardar ahora o volver a la pantalla de inicio.</p>
          <div className="halloween-save-actions">
            <button type="button" onClick={() => { if (saveNowRef.current?.(true)) setPanel(null); }}><Save size={18} /> GUARDAR AHORA</button>
            <button type="button" onClick={() => { if (saveNowRef.current?.(true)) onExit(); }}>GUARDAR Y VOLVER AL INICIO</button>
          </div>
          <small>Si guardás durante el combate final, el encuentro vuelve a empezar al cargar.</small>
        </div>}
        {panel === "reality-key" && <div className="halloween-secret-panel halloween-key-panel">
          <HalloweenRealityKey />
          <button type="button" onClick={close}>Volver a la tienda</button>
        </div>}
        {panel === "phone" && <div className="halloween-phone-panel">
          <div className="halloween-phone-art" aria-hidden="true">
            <span className="halloween-phone-art-label">NEONBOY / 1999</span>
            <div className="halloween-phone-orbit"><span><Phone size={45} strokeWidth={1.5} /></span></div>
            <div className="halloween-phone-art-number">{String(Math.min(phoneCallIndexRef.current, PHONE_LINES.length)).padStart(2, "0")} <small>/ {String(PHONE_LINES.length).padStart(2, "0")}</small></div>
            <span className="halloween-phone-art-foot">ORIGEN NO IDENTIFICADO</span>
          </div>
          <div className="halloween-phone-content">
            <div className="halloween-phone-status"><span className="halloween-phone-live" /> L&Iacute;NEA CONECTADA <span className="halloween-phone-year">BUENOS AIRES / 1999</span></div>
            <div className="halloween-phone-message"><span>VOZ DESCONOCIDA</span><p>{phoneLine}</p></div>
            <div className={`halloween-phone-wave${voicePlaying ? " is-playing" : ""}`} aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <i key={index} style={{ height: `${8 + (index * 17 + index * index * 3) % 34}px` }} />)}</div>
            <div className="halloween-phone-bottom"><span>LLAMADA {Math.min(phoneCallIndexRef.current, PHONE_LINES.length)} DE {PHONE_LINES.length} <b>·</b> SEÑAL INTERCEPTADA</span><button type="button" onClick={close}><PhoneOff size={17} aria-hidden="true" /> Colgar</button></div>
          </div>
        </div>}
        {panel === "mirror" && <div className="halloween-secret-panel halloween-mirror-panel">
          <small>SECUENCIA REVELADA</small><p>{mirrorMessage}</p><span>El reflejo vuelve a oscurecerse cuando termina la visi&oacute;n.</span>
        </div>}
        {panel === "vhs" && <div className="halloween-secret-panel halloween-vhs-panel">
          <div className="halloween-vhs-screen" ref={vhsHostRef} />
          <p>{vhsAutoplayBlocked ? "Toc\u00e1 reproducir para ver y escuchar la cinta." : "La cinta se est\u00e1 reproduciendo."}</p>
        </div>}
        {panel === "anniversary-vinyl" && <div className="halloween-secret-panel halloween-vinyl-panel">
          <Disc3 size={82} aria-hidden="true" /><strong>NEONBOY</strong><h3>4 A&Ntilde;OS</h3><span>2022 &mdash; 2026</span>
          <p>Gracias por acompa&ntilde;ar estos cuatro a&ntilde;os de NeonBoy. Cada disco y cada historia existen gracias a quienes estuvieron ah&iacute;.</p>
          <div className="halloween-vinyl-actions"><button type="button" onClick={close}>SEGUIR EXPLORANDO</button><button type="button" onClick={goToMenu}>VOLVER AL INICIO</button></div>
        </div>}
        {panel === "secret-vinyl" && <div className="halloween-secret-panel halloween-vinyl-panel halloween-secret-vinyl-panel">
          <div className="halloween-pink-record" aria-hidden="true"><span>NEONBOY</span></div>
          <strong>ARCHIVO COMPLETO</strong><h3>&iexcl;FELICITACIONES!</h3>
          <p>Descubriste todos los secretos de NeonBoy.</p>
          <div className="halloween-vinyl-actions"><button type="button" onClick={close}>SEGUIR EXPLORANDO</button><button type="button" onClick={goToMenu}>VOLVER AL INICIO</button></div>
        </div>}
        {panel === "jukebox" && <div className="halloween-jukebox">
          <div className="halloween-jukebox-screen">{video ? <><HalloweenYouTubePlayer key={video.videoId} videoId={video.videoId} title={video.title} onPlaybackChange={(playing) => setMusicPlayback({ key: `jukebox:${video.videoId}`, playing })} /><strong>{video.title}</strong><a href={video.url} target="_blank" rel="noopener noreferrer">Abrir en YouTube <ExternalLink size={13} /></a></> : <div className="halloween-jukebox-idle"><Disc3 size={68} /><strong>NEONBOY VISION</strong><span>Insertá una ficha para empezar.</span></div>}</div>
          <div className="halloween-jukebox-side">
            <div className="halloween-jukebox-wallet"><Coins size={22} /><strong>{credits} / 10 <small>FICHAS</small></strong><button type="button" onClick={takeCoins} disabled={credits === 10}>Tomar fichas</button></div>
            <p className="halloween-jukebox-message" role="status">{jukeboxMessage}</p>
            <div className="halloween-jukebox-list">{ROCKOLA_VIDEOS.map((item, index) => <button key={item.videoId} className={videoIndex === index ? "is-active" : ""} onClick={() => selectVideo(index)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><small>{item.album}</small></div><Play size={16} /></button>)}</div>
          </div>
        </div>}
      </section>
    </div>}
  </main>;
}


