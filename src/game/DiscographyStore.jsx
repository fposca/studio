import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Backpack, Coins, Disc3, Film, Headphones, MapPinned, Maximize2, Minimize2, Music2, Play } from "lucide-react";
import RecordStoreScene from "./RecordStoreScene.jsx";
import NeonUniverseMap from "./NeonUniverseMap.jsx";
import UniverseInventory from "./UniverseInventory.jsx";
import { getUniverseInventory, getUniverseInventoryAction, newlyObtainedInventoryItems } from "./universeInventory.js";
import RecordStoreJukebox from "./RecordStoreJukebox.jsx";
import RecordStoreAlbumPlayer from "./RecordStoreAlbumPlayer.jsx";
import RecordStoreConversation from "./RecordStoreConversation.jsx";
import RockClubConcertAudio from "./RockClubConcertAudio.jsx";
import RockClubConcertEditor, { CLOSED_CONCERT_EDITOR } from "./RockClubConcertEditor.jsx";
import { loadConcertTransforms } from "./rockClubConcertSettings.js";
import { loadConcertMotion, saveConcertMotion, insertConcertMotionFrame, sampleConcertMotion } from "./rockClubConcertMotion.js";
import { loadConcertPose, saveConcertPose } from "./rockClubConcertPose.js";
import { CONCERT_SHOTS } from "./rockClubConcertCamera.js";
import { getStoreVoiceUrl } from "./recordStoreVoices.js";
import { STORE_NPCS, loadStoreProgress, saveStoreProgress, meetStoreNpc, getStoreDialogueNode, chooseStoreDialogue } from "./recordStoreDialogue.js";
import { ROCKOLA_VIDEOS } from "./recordStoreVideos.js";
import { BAND_LOGO, DISCOGRAPHY_ALBUMS, DISCOGRAPHY_GROUPS } from "./discographyCatalog.js";
import { STUDIO_EXAMINE } from "./studioLayout.js";
import { ROCK_CLUB_EXAMINE, ROCK_CLUB_FRIENDS_TABLE } from "./rockClubLayout.js";
import { ARCADE_PROPS, ARCADE_ASSETS, defaultArcadeTransform, loadArcadeTransforms, saveArcadeTransforms } from "./arcadeLayout.js";
import RecordingStudioDevPanel from "./RecordingStudioDevPanel.jsx";
import ArcadeOrbitDuel from "./ArcadeOrbitDuel.jsx";
import ArcadeMiniGame from "./ArcadeMiniGame.jsx";
import { ARCADE_NPCS, getArcadeDialogueNode, chooseArcadeDialogue } from "./arcadeDialogue.js";
import { INITIAL_ARCADE_PROGRESS, normalizeArcadeProgress, meetArcadeNpc, finishOrbitDuel, finishArcadeMiniGame, canActivateFrequency09, completeFrequency09, revisitStoreAfterVision } from "./arcadeProgress.js";
import StudioWorkbench from "./StudioWorkbench.jsx";
import { HUGO_NPC, loadStudioProgress, saveStudioProgress, missionReady, getStudioDialogueNode, chooseStudioDialogue } from "./studioDialogue.js";
import { loadStudioAssetTransforms } from "./studioAssets.js";
import { loadMasterTapeProgress, saveMasterTapeProgress, advanceMasterTape } from "./masterTapeQuest.js";
import { advanceClubShowQuest, clubShowObjective, loadClubShowQuest, saveClubShowQuest } from "./clubShowQuest.js";
import { ROCK_CLUB_NPCS, ROCK_CLUB_DIALOGUE_NPCS, getRockClubDialogueNode, chooseRockClubDialogue } from "./rockClubDialogue.js";
import { ROCK_CLUB_FRIENDS, loadFriendsProgress, saveFriendsProgress, advanceFriendsProgress } from "./rockClubFriends.js";
import { advanceRikyProgress, loadRikyProgress, saveRikyProgress } from "./rockClubRiky.js";
import { defaultRockClubActorTransform, loadRockClubActorTransforms, saveRockClubActorTransforms } from "./rockClubActors.js";
import { ROCK_CLUB_BAND } from "./rockClubBand.js";
import { ROCK_CLUB_AUDIENCE } from "./rockClubAudience.js";
import { ROCK_CLUB_PROP_ASSETS } from "./rockClubAssets.js";
import { MasterTapeHud, NeonSessionsArchive } from "./MasterTapeUi.jsx";
import "./masterTapeUi.css";
import "./recordingStudio.css";
import "./rockClub.css";
import "./arcade.css";
import "./frequency09.css";
import "./discographyStore.css";

export { DISCOGRAPHY_ALBUMS } from "./discographyCatalog.js";

const ARCADE_GAME_CABINETS = { "cabinet-left-1": "pixel", "cabinet-left-2": "orbit", "fight-cabinet": "brawl", "cabinet-left-3": "jungle" };

const ANOMALY_SOUND_URL = new URL("../assets/neonboy-animaciones/club-de-rock/sonido-anomalia.mp3", import.meta.url).href;

const CLUB_DEV_ASSETS = [
  ...ROCK_CLUB_NPCS.map(({ id, name }) => ({ id, label: name })),
  ...ROCK_CLUB_BAND.map(({ id, name, role }) => ({ id, label: `${name} ? ${role}` })),
  ...ROCK_CLUB_AUDIENCE.map(({ id, name }) => ({ id, label: name })),
  ...ROCK_CLUB_PROP_ASSETS,
];

function ClubShowHud({ quest, masterTape, scene, rikyProgress }) {
  const objective = clubShowObjective(quest, masterTape, rikyProgress);
  if (!objective) return null;
  return <aside className={"club-show-hud club-show-hud--" + scene} aria-label={quest.anomalySeen ? "Misión La señal desconocida" : "Misión La credencial del show"}>
    <strong>{quest.anomalySeen ? "LA SEÑAL DESCONOCIDA" : quest.soundcheckStarted ? "PRUEBA DE SONIDO" : "LA CREDENCIAL DEL SHOW"}</strong>
    <span>{objective}</span>
    {quest.credentialGranted && <small>INVENTARIO · CREDENCIAL DEL CLUB DE ROCK</small>}
    {quest.soundcheckStarted && <small>EQUIPO · {quest.inspected.length}/3 revisado</small>}
    {scene === "club" && rikyProgress?.rikyFrequencyClueKnown && <small>PISTA · Comparar las señales de las grabaciones y las pantallas.</small>}
  </aside>;
}

export default function DiscographyStore({ onClose, standalone = false, initialSession, gameApiRef, onAutosave, paused = false, onPause }) {
  const [selectedId, setSelectedId] = useState(initialSession?.selectedId ?? DISCOGRAPHY_ALBUMS[0].id);
  const [activeGroup, setActiveGroup] = useState(initialSession?.activeGroup ?? "instrumental");
  const [trackIndex, setTrackIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [listenerPlayback, setListenerPlayback] = useState("stopped");
  const [listenerPlayRequest, setListenerPlayRequest] = useState(0);
  const [nearby, setNearby] = useState(null);
  const [credits, setCredits] = useState(initialSession?.credits ?? 0);
  const [jukeboxOpen, setJukeboxOpen] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(null);
  const [jukeboxPlaying, setJukeboxPlaying] = useState(false);
  const [outsideVideo, setOutsideVideo] = useState(null);
  const [firstPerson, setFirstPerson] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [albumsMinimized, setAlbumsMinimized] = useState(false);
  const [listenerMinimized, setListenerMinimized] = useState(false);
  const [storyProgress, setStoryProgress] = useState(() => initialSession?.storyProgress ?? loadStoreProgress());
  const [conversation, setConversation] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryNotice, setInventoryNotice] = useState(null);
  const [activeScene, setActiveScene] = useState(initialSession?.scene ?? "store");
  const [studioMessage, setStudioMessage] = useState(null);
  const [clubMessage, setClubMessage] = useState(null);
  const [arcadeMessage, setArcadeMessage] = useState(null);
  const [frequencyPhase, setFrequencyPhase] = useState("idle");
  const [frequencyClues, setFrequencyClues] = useState([]);
  const [frequencyMessage, setFrequencyMessage] = useState("");
  const frequencyPhaseRef = useRef("idle");
  const frequencyPlayerRef = useRef(null);
  const frequencySoundRef = useRef(null);
  const frequencyHumRef = useRef(null);
  const frequencyClockRef = useRef({ phase: "idle", remaining: 0, started: 0 });
  const [arcadeProgress, setArcadeProgress] = useState(() => normalizeArcadeProgress(initialSession?.arcadeProgress || INITIAL_ARCADE_PROGRESS));
  const arcadeProgressRef = useRef(arcadeProgress);
  arcadeProgressRef.current = arcadeProgress;
  const [arcadeGameId, setArcadeGameId] = useState(null);
  const gameOpen = Boolean(arcadeGameId);
  const [clubNotice, setClubNotice] = useState(null);
  const [concertPhase, setConcertPhase] = useState("idle");
  const [concertRun, setConcertRun] = useState(0);
  const [concertError, setConcertError] = useState(false);
  const [concertTransforms, setConcertTransforms] = useState(loadConcertTransforms);
  const [concertMotion, setConcertMotion] = useState(loadConcertMotion);
  const [concertPose, setConcertPose] = useState(loadConcertPose);
  const concertPoseRef = useRef(concertPose);
  concertPoseRef.current = concertPose;
  const concertMotionRef = useRef(concertMotion);
  concertMotionRef.current = concertMotion;
  const motionPlaybackOffsetsRef = useRef({});
  const [motionRecording, setMotionRecording] = useState(null);
  const [motionCursor, setMotionCursor] = useState(0);
  const [concertCameraMode, setConcertCameraMode] = useState("auto");
  const [concertEditor, setConcertEditor] = useState(CLOSED_CONCERT_EDITOR);
  const concertTransformsRef = useRef(concertTransforms);
  concertTransformsRef.current = concertTransforms;
  const [studioWorkbench, setStudioWorkbench] = useState(null);
  const [studioAlbumId, setStudioAlbumId] = useState(null);
  const [studioProgress, setStudioProgress] = useState(() => initialSession?.studioProgress ?? loadStudioProgress());
  const [masterTape, setMasterTape] = useState(() => initialSession?.masterTape ?? loadMasterTapeProgress());
  const [clubQuest, setClubQuest] = useState(() => initialSession?.clubQuest ?? loadClubShowQuest());
  const clubQuestRef = useRef(clubQuest);
  clubQuestRef.current = clubQuest;
  const [rikyProgress, setRikyProgress] = useState(() => initialSession?.rikyProgress ?? loadRikyProgress());
  const [friendsProgress, setFriendsProgress] = useState(() => initialSession?.friendsProgress ?? loadFriendsProgress());
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [studioTransforms, setStudioTransforms] = useState(() => loadStudioAssetTransforms());
  const [clubTransforms, setClubTransforms] = useState(() => loadRockClubActorTransforms());
  const [arcadeTransforms, setArcadeTransforms] = useState(loadArcadeTransforms);
  const [encounterMessage, setEncounterMessage] = useState(null);
  const [dancingSkeleton, setDancingSkeleton] = useState(null);
  const [mapUnlocks] = useState(() => initialSession?.mapUnlocks ?? []);
  const creditsRef = useRef(initialSession?.credits ?? 0);
  const gameSnapshotRef = useRef(null);
  const openMapRef = useRef(null);
  const jukeboxPlayerRef = useRef(null);
  const scenePlayerRef = useRef(null);
  const playbackRef = useRef({ seconds: 0, playing: true });
  const storeRef = useRef(null);
  const closeRef = useRef(null);
  const mapReturnFocusRef = useRef(null);
  const inventoryReturnFocusRef = useRef(null);
  const inventorySeenRef = useRef(null);
  const pendingInventoryNoticesRef = useRef([]);
  const storePlayerRef = useRef(initialSession?.positions?.store ?? null);
  const studioPlayerRef = useRef(initialSession?.positions?.studio ?? null);
  const clubPlayerRef = useRef(initialSession?.positions?.club ?? null);
  const arcadePlayerRef = useRef(initialSession?.positions?.arcade ?? null);
  const studioTransformsRef = useRef(studioTransforms);
  studioTransformsRef.current = studioTransforms;
  const studioAssetApiRef = useRef(null);
  const arcadeTransformsRef = useRef(arcadeTransforms);
  arcadeTransformsRef.current = arcadeTransforms;
  const arcadeAssetApiRef = useRef(null);
  const clubTransformsRef = useRef(clubTransforms);
  clubTransformsRef.current = clubTransforms;
  const clubAssetApiRef = useRef(null);
  const jasonAttemptsRef = useRef(0);
  const encounterTimerRef = useRef(null);
  const danceTimerRef = useRef(null);
  const specialAudioRef = useRef(null);
  const concertTokenRef = useRef(0);
  const concertIntroTimerRef = useRef(null);
  const concertEndingRef = useRef(false);
  const concertEffectRef = useRef({ phase: "idle", elapsed: 0 });
  const anomalyAudioRef = useRef(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const album = DISCOGRAPHY_ALBUMS.find((entry) => entry.id === selectedId) || DISCOGRAPHY_ALBUMS[0];
  const tracks = album.tracks;
  const visibleAlbums = DISCOGRAPHY_ALBUMS.filter((entry) => entry.group === activeGroup);
  const nearbyAlbum = nearby?.kind === "album" ? DISCOGRAPHY_ALBUMS.find((entry) => entry.id === nearby.id) : null;
  const currentTrack = listening ? tracks[trackIndex] : null;
  const listenerStatus = !currentTrack ? "STANDBY" : ({ playing: "ON AIR", paused: "PAUSA", stopped: "STOP", ready: "LISTO", native: "VIDEO" })[listenerPlayback] || "CARGANDO";
  const roxyPlaying = jukeboxOpen ? jukeboxPlaying : Boolean(outsideVideo?.playing);
  const inventoryItems = useMemo(() => getUniverseInventory({ masterTape, clubQuest, storyProgress, credits }),
    [masterTape, clubQuest, storyProgress, credits]);
  const dialogueContext = { masterTape, clubQuest, credits, currentSong: currentTrack?.name || (outsideVideo?.playing ? outsideVideo.title : null), currentAlbum: currentTrack ? album.name : null };
  const friendsContext = {
    signalKnown: masterTape.phase === "complete" && rikyProgress.signalKnown,
    recitalCompleted: clubQuest.recitalCompleted === true,
    anomalySeen: clubQuest.anomalySeen === true,
    rikyNearby: Math.hypot((clubTransforms.riky?.position?.[0] ?? 99) - ROCK_CLUB_FRIENDS_TABLE.x,
      (clubTransforms.riky?.position?.[2] ?? 99) - ROCK_CLUB_FRIENDS_TABLE.z) < 4,
  };
  const conversationNpc = conversation && (conversation.npc === "hugo" ? HUGO_NPC :
    ROCK_CLUB_DIALOGUE_NPCS.find((entry) => entry.id === conversation.npc) || ARCADE_NPCS.find((entry) => entry.id === conversation.npc) || STORE_NPCS.find((entry) => entry.id === conversation.npc));
  const conversationNode = conversation && (conversation.npc === "hugo"
    ? getStudioDialogueNode(conversation.nodeId, studioProgress, masterTape, clubQuest)
    : ROCK_CLUB_DIALOGUE_NPCS.some((entry) => entry.id === conversation.npc)
      ? getRockClubDialogueNode(conversation.npc, conversation.nodeId, clubQuest, storyProgress, rikyProgress, masterTape, friendsProgress, friendsContext)
      : ARCADE_NPCS.some((entry) => entry.id === conversation.npc)
        ? getArcadeDialogueNode(conversation.npc, conversation.nodeId, arcadeProgress, clubQuest.anomalySeen)
        : getStoreDialogueNode(conversation.npc, conversation.nodeId, storyProgress, dialogueContext));
  const unlockedScenarios = [...new Set([
    ...mapUnlocks.filter((id) => id !== "rock-club" || clubQuest.credentialGranted),
    ...(masterTape.phase === "new" ? [] : ["recording-studio"]),
    ...(clubQuest.credentialGranted ? ["rock-club"] : []),
    ...(clubQuest.anomalySeen ? ["arcade-1999"] : []),
  ])];
  const clubNoticePanel = clubNotice && <div className="club-unlock-notice" role="status">
    <strong>{clubNotice}</strong><button type="button" onClick={() => setClubNotice(null)} aria-label="Cerrar aviso del club">×</button>
  </div>;
  const studioMissionStep = !studioProgress.studioComputerUnlocked ? "Hablá con Hugo sobre la computadora" :
    !studioProgress.computerExplored ? "Explorá una sesión en la PC" :
      !studioProgress.consoleExplored ? "Examiná un canal de la consola" :
        !studioProgress.missionComplete ? "Volvé a hablar con Hugo" : "Misión completada";

  gameSnapshotRef.current = () => ({
    scene: activeScene === "frequency" ? "arcade" : activeScene, credits: creditsRef.current, selectedId, activeGroup,
    storyProgress, studioProgress, masterTape, clubQuest, rikyProgress, friendsProgress, arcadeProgress, mapUnlocks: unlockedScenarios,
    positions: { store: storePlayerRef.current, studio: studioPlayerRef.current, club: clubPlayerRef.current, arcade: arcadePlayerRef.current },
  });
  openMapRef.current = openMap;
  useEffect(() => {
    if (!gameApiRef) return undefined;
    gameApiRef.current = {
      getSnapshot: () => gameSnapshotRef.current?.(),
      openMap: () => openMapRef.current?.(),
    };
    return () => { gameApiRef.current = null; };
  }, [gameApiRef]);
  useEffect(() => {
    if (!onAutosave) return undefined;
    const timer = window.setTimeout(() => onAutosave(gameSnapshotRef.current?.()), 700);
    return () => window.clearTimeout(timer);
  }, [onAutosave, activeScene, credits, selectedId, activeGroup, storyProgress, studioProgress, masterTape, clubQuest, rikyProgress, friendsProgress, arcadeProgress, mapUnlocks]);
  useEffect(() => () => onAutosave?.(gameSnapshotRef.current?.()), [onAutosave]);
  useEffect(() => {
    if (!onAutosave) return undefined;
    const timer = window.setInterval(() => onAutosave(gameSnapshotRef.current?.()), 7000);
    return () => window.clearInterval(timer);
  }, [onAutosave]);

  useEffect(() => {
    if (paused || frequencyPhase === "idle" || frequencyPhase === "explore") return undefined;
    const next = {
      intake: [5400, () => { setActiveScene("frequency"); setFrequencyPhase("explore"); setFrequencyMessage("¿Dónde estoy...? Esto no parece parte del Arcade."); }],
      vision: [4400, () => { setFrequencyPhase("presence"); setFrequencyMessage(""); }],
      presence: [4300, () => setFrequencyPhase("collapse")],
      collapse: [3800, () => finishFrequency09()],
    }[frequencyPhase];
    if (!next) return undefined;
    const clock = frequencyClockRef.current;
    if (clock.phase !== frequencyPhase) {
      clock.phase = frequencyPhase;
      clock.remaining = next[0];
    }
    clock.started = performance.now();
    const timer = window.setTimeout(next[1], clock.remaining);
    return () => {
      window.clearTimeout(timer);
      clock.remaining = Math.max(0, clock.remaining - (performance.now() - clock.started));
    };
  }, [frequencyPhase, paused]);
  useEffect(() => {
    if (frequencyPhase === "presence" && !paused && frequencySoundRef.current) {
      frequencySoundRef.current.currentTime = 0;
      frequencySoundRef.current.play().catch(() => {});
    }
  }, [frequencyPhase, paused]);
  useEffect(() => {
    const sound = frequencySoundRef.current;
    if (sound) { if (paused) sound.pause(); else if (frequencyPhase === "intake") sound.play().catch(() => {}); }
    const hum = frequencyHumRef.current?.context;
    if (hum) { if (paused) hum.suspend().catch(() => {}); else hum.resume().catch(() => {}); }
  }, [paused]);
  useEffect(() => () => stopFrequencyAudio(), []);
  useEffect(() => { if (!standalone) closeRef.current?.focus(); }, [standalone]);
  useEffect(() => {

    const onKeyDown = (event) => {
      if (activeScene === "frequency" && event.key === "Escape" && !paused) {
        event.preventDefault(); event.stopImmediatePropagation(); onPause?.(true); return;
      }
      if (gameOpen && !paused && event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); closeArcadeGame(); return; }
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "") || event.target?.isContentEditable;
      if (event.code === "KeyR" && activeScene === "club" && concertPhase !== "idle" && !paused && !event.repeat && !typing) {
        event.preventDefault();
        event.stopImmediatePropagation();
        stopConcert();
        return;
      }
      if (event.code === "KeyI" && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && !typing &&
        (inventoryOpen || (frequencyPhase === "idle" && !paused && !gameOpen && !mapOpen && !conversation && !jukeboxOpen && !archiveOpen && !sessionsOpen && !studioWorkbench && !studioMessage && !clubMessage && !arcadeMessage))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (inventoryOpen) closeInventory(); else openInventory();
        return;
      }
      if (event.code === "KeyM" && frequencyPhase === "idle" && !gameOpen && !paused && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "") && !event.target?.isContentEditable && (mapOpen || (!inventoryOpen && !jukeboxOpen && !conversation && !archiveOpen && !sessionsOpen && !studioWorkbench))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (mapOpen) closeMap(); else openMap();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (paused) onPause?.(false);
        else if (mapOpen) closeMap();
        else if (inventoryOpen) closeInventory();
        else if (archiveOpen) setArchiveOpen(false);
        else if (sessionsOpen) setSessionsOpen(false);
        else if (studioWorkbench) setStudioWorkbench(null);
        else if (clubMessage) setClubMessage(null);
        else if (arcadeMessage) setArcadeMessage(null);
        else if (studioMessage) setStudioMessage(null);
        else if (conversation) closeConversation();
        else if (jukeboxOpen) closeJukebox();
        else if (onPause) onPause(true);
        else if (activeScene === "studio" || activeScene === "club" || activeScene === "arcade") openMap();
        else onClose?.();
      }
      if (event.key === "Tab" && !paused) {
        const focusRoot = gameOpen ? storeRef.current?.querySelector(".orbit-duel-cabinet") : inventoryOpen ? storeRef.current?.querySelector(".universe-inventory") : mapOpen ? storeRef.current?.querySelector(".universe-map") : jukeboxOpen ? storeRef.current?.querySelector(".record-jukebox") : sessionsOpen ? storeRef.current?.querySelector(".neon-sessions-archive") : archiveOpen ? storeRef.current?.querySelector(".record-store-archive") : conversation ? storeRef.current?.querySelector(".record-store-conversation") : studioWorkbench ? storeRef.current?.querySelector(".studio-workbench") : storeRef.current;
        const focusable = [...(focusRoot?.querySelectorAll("button:not(:disabled), a[href]") || [])]
          .filter((element) => element.getClientRects().length);
        const index = focusable.indexOf(document.activeElement);
        if (!focusable.length) return;
        if (event.shiftKey && index <= 0) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
        else if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); focusable[0].focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose, standalone, jukeboxOpen, activeVideoIndex, conversation, archiveOpen, sessionsOpen, studioWorkbench, clubMessage, arcadeMessage, studioMessage, mapOpen, inventoryOpen, activeScene, paused, onPause, concertPhase, gameOpen, frequencyPhase]);
  useEffect(() => { saveStoreProgress(storyProgress); }, [storyProgress]);
  useEffect(() => { saveStudioProgress(studioProgress); }, [studioProgress]);
  useEffect(() => { saveMasterTapeProgress(masterTape); }, [masterTape]);
  useEffect(() => { saveClubShowQuest(clubQuest); }, [clubQuest]);
  useEffect(() => { saveRikyProgress(rikyProgress); }, [rikyProgress]);
  useEffect(() => { saveFriendsProgress(friendsProgress); }, [friendsProgress]);
  useEffect(() => () => {
    clearTimeout(concertIntroTimerRef.current);
    clearTimeout(encounterTimerRef.current);
    clearTimeout(danceTimerRef.current);
    specialAudioRef.current?.pause();
  }, []);
  useEffect(() => { if ((paused || jukeboxOpen || conversation || archiveOpen || sessionsOpen || studioWorkbench || mapOpen || inventoryOpen) && document.pointerLockElement) document.exitPointerLock(); }, [paused, jukeboxOpen, conversation, archiveOpen, sessionsOpen, studioWorkbench, mapOpen, inventoryOpen]);
  useEffect(() => {
    const nextIds = new Set(inventoryItems.map((item) => item.id));
    if (inventorySeenRef.current) pendingInventoryNoticesRef.current.push(
      ...newlyObtainedInventoryItems(inventorySeenRef.current, inventoryItems).map((item) => item.name));
    inventorySeenRef.current = nextIds;
  }, [inventoryItems]);
  useEffect(() => {
    if (inventoryNotice || !pendingInventoryNoticesRef.current.length || paused || mapOpen || inventoryOpen || conversation ||
      jukeboxOpen || archiveOpen || sessionsOpen || studioWorkbench) return;
    setInventoryNotice(pendingInventoryNoticesRef.current.shift());
  }, [inventoryItems, inventoryNotice, paused, mapOpen, inventoryOpen, conversation, jukeboxOpen, archiveOpen, sessionsOpen, studioWorkbench]);
  useEffect(() => {
    if (!inventoryNotice) return undefined;
    const timer = window.setTimeout(() => setInventoryNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [inventoryNotice]);

  useEffect(() => {
    if (concertPhase !== "live") return undefined;
    const timer = window.setInterval(() => {
      const now = clubAssetApiRef.current?.getMotionTime?.() || 0;
      setMotionCursor(now);
      if (motionRecording) {
        const track = concertMotionRef.current[motionRecording.id];
        if (now - motionRecording.start >= (track?.duration || 8)) stopMotionRecording();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [concertPhase, motionRecording]);

  useEffect(() => {
    if (concertPhase !== "outro" && concertPhase !== "anomaly") return undefined;
    const token = concertTokenRef.current;
    const phase = concertPhase;
    const duration = phase === "outro" ? 2.7 : 9;
    concertEffectRef.current = { phase, elapsed: 0 };
    let frame;
    let previous = performance.now();
    const tick = (now) => {
      if (token !== concertTokenRef.current) return;
      if (!pausedRef.current) concertEffectRef.current.elapsed += Math.min((now - previous) / 1000, .1);
      previous = now;
      if (concertEffectRef.current.elapsed >= duration) {
        if (phase === "outro") {
          setConcertPhase("anomaly");
        } else {
          const firstAnomaly = !clubQuestRef.current.anomalySeen;
          if (firstAnomaly) setClubQuest((progress) => {
            if (progress.anomalySeen) return progress;
            const completed = advanceClubShowQuest(progress, "completeRecital", masterTape);
            return advanceClubShowQuest(completed, "seeAnomaly", masterTape);
          });
          setConcertPhase("idle");
          setClubNotice(firstAnomaly
            ? "Algo interrumpi\u00f3 el final del show. Habl\u00e1 con Riky."
            : "La se\u00f1al volvi\u00f3 a interrumpir el final del show.");
          concertEndingRef.current = false;
          concertEffectRef.current = { phase: "idle", elapsed: 0 };
        }
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [concertPhase, masterTape]);

  useEffect(() => {
    if (concertPhase !== "anomaly") return undefined;
    const audio = new Audio(ANOMALY_SOUND_URL);
    audio.preload = "auto";
    audio.volume = .8;
    anomalyAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      if (anomalyAudioRef.current === audio) anomalyAudioRef.current = null;
    };
  }, [concertPhase]);

  useEffect(() => {
    const audio = anomalyAudioRef.current;
    if (!audio) return;
    if (paused) audio.pause();
    else if (!audio.ended) audio.play().catch(() => {});
  }, [concertPhase, paused]);

  function setRecordedMotion(updater) {
    const next = updater(concertMotionRef.current);
    concertMotionRef.current = next;
    setConcertMotion(next);
    return next;
  }
  function changeConcertPoseVector(id, boneId, values) {
    if (!Array.isArray(values) || values.length !== 3 || values.some((value) => !Number.isFinite(value)) ||
      motionRecording && motionRecording.id !== id) return;
    const previous = concertPoseRef.current;
    const joint = values.map((value) => Math.max(-180, Math.min(180, value)));
    const next = { ...previous, [id]: { ...previous[id], [boneId]: joint } };
    concertPoseRef.current = next;
    setConcertPose(next);
    if (motionRecording?.id === id) {
      const time = Math.max(0, (clubAssetApiRef.current?.getMotionTime?.() || 0) - motionRecording.start);
      setRecordedMotion((tracks) => ({ ...tracks, [id]: insertConcertMotionFrame(
        tracks[id], time, concertTransformsRef.current[id], next[id]) }));
    } else if (concertMotionRef.current[id]?.enabled) {
      setRecordedMotion((tracks) => ({ ...tracks, [id]: { ...tracks[id], enabled: false } }));
    }
  }
  function changeConcertPose(id, boneId, axis, degrees) {
    const joint = [...(concertPoseRef.current[id]?.[boneId] || [0, 0, 0])];
    joint[axis] = degrees;
    changeConcertPoseVector(id, boneId, joint);
  }
  function resetConcertPose(id, boneId = null) {
    if (motionRecording) return;
    const joints = { ...concertPoseRef.current[id] };
    if (boneId) delete joints[boneId];
    const next = { ...concertPoseRef.current, [id]: boneId ? joints : {} };
    concertPoseRef.current = next;
    setConcertPose(next);
    if (concertMotionRef.current[id]?.enabled)
      setRecordedMotion((tracks) => ({ ...tracks, [id]: { ...tracks[id], enabled: false } }));
  }
  function changeConcertTransforms(next) {
    const id = concertEditor.selected;
    concertTransformsRef.current = next;
    setConcertTransforms(next);
    if (motionRecording?.id === id) {
      const time = Math.max(0, (clubAssetApiRef.current?.getMotionTime?.() || 0) - motionRecording.start);
      setRecordedMotion((previous) => ({ ...previous, [id]: insertConcertMotionFrame(previous[id], time, next[id], concertPoseRef.current[id]) }));
    } else if (concertMotionRef.current[id]?.enabled) {
      setRecordedMotion((previous) => ({ ...previous, [id]: { ...previous[id], enabled: false } }));
    }
  }
  function startMotionRecording() {
    const id = concertEditor.selected;
    if (id === "lujan") return;
    const start = clubAssetApiRef.current?.getMotionTime?.() || 0;
    const duration = concertMotionRef.current[id]?.duration || 8;
    setRecordedMotion((previous) => ({ ...previous,
      [id]: insertConcertMotionFrame({ duration, keyframes: [], enabled: true }, 0, concertTransformsRef.current[id], concertPoseRef.current[id]),
    }));
    setConcertEditor((previous) => ({ ...previous, poseActor: id, frozen: false, scrub: 0 }));
    setMotionRecording({ id, start });
  }
  function stopMotionRecording() {
    if (!motionRecording) return;
    motionPlaybackOffsetsRef.current[motionRecording.id] = clubAssetApiRef.current?.getMotionTime?.() || 0;
    setMotionRecording(null);
    saveConcertMotion(concertMotionRef.current);
  }
  function changeMotionDuration(id, duration) {
    if (!Number.isFinite(duration) || motionRecording) return;
    const safe = Math.max(2, Math.min(30, duration));
    setRecordedMotion((previous) => ({ ...previous, [id]: { duration: safe,
      enabled: previous[id]?.enabled ?? false,
      keyframes: (previous[id]?.keyframes || []).filter((frame) => frame.time <= safe),
    } }));
  }
  function captureMotionFrame() {
    const id = concertEditor.selected;
    if (id === "lujan") return;
    const track = concertMotionRef.current[id] || { duration: 8, keyframes: [] };
    const time = motionRecording?.id === id
      ? (clubAssetApiRef.current?.getMotionTime?.() || 0) - motionRecording.start : concertEditor.scrub || 0;
    setRecordedMotion((previous) => ({ ...previous,
      [id]: insertConcertMotionFrame(track, time, concertTransformsRef.current[id], concertPoseRef.current[id]),
    }));
  }
  function toggleMotionPlayback() {
    const id = concertEditor.selected;
    const track = concertMotionRef.current[id];
    if (!track?.keyframes?.length || motionRecording) return;
    motionPlaybackOffsetsRef.current[id] = clubAssetApiRef.current?.getMotionTime?.() || 0;
    setRecordedMotion((previous) => ({ ...previous, [id]: { ...track, enabled: !track.enabled } }));
  }
  function loadMotionFrame() {
    const id = concertEditor.selected;
    const track = concertMotionRef.current[id];
    const frame = sampleConcertMotion(track, concertEditor.scrub || 0);
    if (!frame) return;
    changeConcertTransforms({ ...concertTransformsRef.current,
      [id]: { ...concertTransformsRef.current[id], position: frame.position,
        rotation: frame.rotation, scale: frame.scale } });
    if (frame.bones && Object.keys(frame.bones).length) {
      const next = { ...concertPoseRef.current, [id]: frame.bones };
      concertPoseRef.current = next;
      setConcertPose(next);
    }
  }

  function deleteMotionFrame() {
    const id = concertEditor.selected;
    const track = concertMotionRef.current[id];
    if (!track?.keyframes?.length || motionRecording) return;
    const cursor = concertEditor.scrub || 0;
    const nearest = track.keyframes.reduce((best, frame) =>
      Math.abs(frame.time - cursor) < Math.abs(best.time - cursor) ? frame : best);
    setRecordedMotion((previous) => ({
      ...previous, [id]: {
        ...previous[id],
        keyframes: previous[id].keyframes.filter((frame) => frame.time !== nearest.time),
      },
    }));
  }

  function stopConcert() {
    if (concertPhase === "idle") return;
    if (motionRecording) saveConcertMotion(concertMotionRef.current);
    concertTokenRef.current += 1;
    concertEndingRef.current = false;
    concertEffectRef.current = { phase: "idle", elapsed: 0 };
    window.clearTimeout(concertIntroTimerRef.current);
    setConcertPhase("idle");
    setConcertEditor(CLOSED_CONCERT_EDITOR);
    setMotionRecording(null);
    setConcertError(false);
  }

  function beginConcertEnding() {
    if (concertEndingRef.current || (concertPhase !== "live" && concertPhase !== "waiting-audio")) return;
    concertEndingRef.current = true;
    if (motionRecording) saveConcertMotion(concertMotionRef.current);
    setMotionRecording(null);
    setConcertEditor(CLOSED_CONCERT_EDITOR);
    setConcertCameraMode("wide");
    setConcertPhase("outro");
  }

  function startConcert() {
    if (activeScene !== "club" || !clubQuest.clubShowReady || concertPhase !== "idle" || paused || mapOpen || conversation) return;
    const token = ++concertTokenRef.current;
    concertEndingRef.current = false;
    setClubMessage(null);
    setConcertError(false);
    setConcertCameraMode("auto");
    setConcertEditor(CLOSED_CONCERT_EDITOR);
    setMotionRecording(null);
    motionPlaybackOffsetsRef.current = {};
    setConcertPhase("intro");
    Promise.resolve(clubAssetApiRef.current?.prepareConcert?.()).then((ready) => {
      if (token !== concertTokenRef.current) return;
      if (!ready) { setConcertPhase("idle"); setClubNotice("No se pudieron preparar las animaciones del escenario."); return; }
      concertIntroTimerRef.current = window.setTimeout(() => {
        if (token !== concertTokenRef.current) return;
        setConcertRun((run) => run + 1);
        setConcertPhase("waiting-audio");
      }, 1100);
    }).catch(() => {
      if (token === concertTokenRef.current) { setConcertPhase("idle"); setClubNotice("No se pudo preparar el recital."); }
    });
  }

  function openMap() {
    if (inventoryOpen || frequencyPhaseRef.current !== "idle") return;
    if (gameOpen) setArcadeGameId(null);
    if (concertPhase !== "idle") stopConcert();
    mapReturnFocusRef.current = document.activeElement;
    if (document.pointerLockElement) document.exitPointerLock();
    setMapOpen(true);
  }

  function closeMap() {
    setMapOpen(false);
    requestAnimationFrame(() => mapReturnFocusRef.current?.focus?.());
  }

  function openInventory() {
    if (gameOpen || paused || mapOpen || conversation || jukeboxOpen || archiveOpen || sessionsOpen || studioWorkbench || studioMessage || clubMessage || arcadeMessage) return;
    inventoryReturnFocusRef.current = document.activeElement;
    if (document.pointerLockElement) document.exitPointerLock();
    setInventoryOpen(true);
  }

  function closeInventory(restoreFocus = true) {
    setInventoryOpen(false);
    if (restoreFocus) requestAnimationFrame(() => inventoryReturnFocusRef.current?.focus?.());
  }

  function useInventoryAction(actionId) {
    const context = { scene: activeScene, nearby, masterTape, clubQuest };
    if (!inventoryItems.some((item) => getUniverseInventoryAction(item, context)?.id === actionId)) return;
    closeInventory(false);
    if (actionId === "give-tape") setConversation({ npc: "hugo", nodeId: "master:hugo-tape", lastChoice: "" });
    if (actionId === "give-master") setConversation({ npc: "tito", nodeId: "master:tito-return", lastChoice: "" });
    if (actionId === "present-credential") {
      setClubQuest((progress) => advanceClubShowQuest(progress, "charlyAuthorizes", masterTape));
      setConversation({ npc: "charly", nodeId: "credential", lastChoice: "" });
    }
    if (actionId === "open-jukebox") openJukebox();
    if (actionId === "open-archive") setArchiveOpen(true);
    if (actionId === "open-sessions") setSessionsOpen(true);
  }

  function enterScenario(destination) {
    if (frequencyPhaseRef.current !== "idle") return;
    if (concertPhase !== "idle") stopConcert();
    setSessionsOpen(false);
    setClubMessage(null);
    setArcadeMessage(null);
    setArcadeGameId(null);
    setConversation(null);
    if (destination === "recording-studio") {
      const snapshot = scenePlayerRef.current?.getSnapshot?.();
      if (snapshot) {
        playbackRef.current = snapshot;
        const video = activeVideoIndex === null ? null : ROCKOLA_VIDEOS[activeVideoIndex];
        setOutsideVideo(video ? { ...video, ...snapshot } : null);
      }
      setListening(false);
      setListenerPlayback("stopped");
      setNearby(null);
      setFirstPerson(false);
      setJumping(false);
      setStudioMessage(null);
      setStudioWorkbench(null);
      setStudioAlbumId(null);
      setActiveScene("studio");
    } else if (destination === "rock-club") {
      setNearby(null);
      setFirstPerson(false);
      setJumping(false);
      setActiveScene("club");
    } else if (destination === "arcade-1999") {
      setNearby(null);
      setFirstPerson(false);
      setJumping(false);
      setClubNotice(null);
      setActiveScene("arcade");
    } else if (destination === "discography") {
      if (arcadeProgressRef.current.recordStoreFutureVisionSeen) {
        const next = revisitStoreAfterVision(arcadeProgressRef.current);
        arcadeProgressRef.current = next;
        setArcadeProgress(next);
      }
      setNearby(null);
      setFirstPerson(false);
      setJumping(false);
      setActiveScene("store");
    }
    closeMap();
  }

  function changeStudioTransforms(next) {
    studioTransformsRef.current = next;
    setStudioTransforms(next);
    for (const [id, transform] of Object.entries(next)) studioAssetApiRef.current?.apply(id, transform);
  }

  function examineStudio(id) {
    if (id.startsWith("hugo-album:")) {
      setStudioAlbumId(id.slice("hugo-album:".length));
      setStudioMessage(null);
      setStudioWorkbench("album");
      return;
    }
    if (id === "computer") {
      setStudioAlbumId(null);
      setStudioMessage(null);
      setStudioWorkbench("computer");
      return;
    }
    if (id === "console") { setStudioMessage(null); setStudioWorkbench("console"); return; }
    const item = STUDIO_EXAMINE.find((entry) => entry.id === id);
    if (item) setStudioMessage({ id, text: item.text });
  }

  function changeArcadeTransforms(next) {
    arcadeTransformsRef.current = next;
    setArcadeTransforms(next);
    for (const [id, transform] of Object.entries(next)) arcadeAssetApiRef.current?.apply(id, transform);
  }

  function stopFrequencyAudio() {
    frequencySoundRef.current?.pause();
    frequencySoundRef.current = null;
    const hum = frequencyHumRef.current;
    frequencyHumRef.current = null;
    if (hum) {
      try { hum.oscillator.stop(); } catch {}
      hum.context.close().catch(() => {});
    }
  }

  function startFrequency09() {
    if (frequencyPhaseRef.current !== "idle" || !canActivateFrequency09(clubQuestRef.current, arcadeProgressRef.current)) return;
    frequencyPhaseRef.current = "intake";
    frequencyClockRef.current = { phase: "idle", remaining: 0, started: 0 };
    frequencyPlayerRef.current = null;
    setFrequencyPhase("intake");
    setFrequencyClues([]);
    setFrequencyMessage("");
    setArcadeMessage(null);
    setNearby(null);
    if (document.pointerLockElement) document.exitPointerLock();
    const sound = new Audio(ANOMALY_SOUND_URL);
    sound.volume = .38;
    frequencySoundRef.current = sound;
    sound.play().catch(() => {});
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.value = 55;
      filter.type = "lowpass";
      filter.frequency.value = 170;
      gain.gain.value = .012;
      oscillator.connect(filter); filter.connect(gain); gain.connect(context.destination);
      oscillator.start();
      frequencyHumRef.current = { context, oscillator };
    } catch { /* The visual sequence still works if Web Audio is unavailable. */ }
  }

  function finishFrequency09() {
    if (frequencyPhaseRef.current === "idle") return;
    frequencyPhaseRef.current = "idle";
    stopFrequencyAudio();
    const next = completeFrequency09(arcadeProgressRef.current);
    arcadeProgressRef.current = next;
    setArcadeProgress(next);
    setFrequencyPhase("idle");
    setFrequencyMessage("");
    setNearby(null);
    setFirstPerson(false);
    setActiveScene("arcade");
    setArcadeMessage({ id: "frequency09Cabinet", label: "FREQUENCY 09",
      text: "Eso fue real... Vi la tienda. Algo está por pasar. Tengo que volver." });
    requestAnimationFrame(() => storeRef.current?.focus());
  }

  function examineFrequency(id) {
    if (frequencyPhase !== "explore") return;
    if (id === "future-store") {
      if (frequencyClues.length < 2) {
        setFrequencyMessage("La señal está incompleta. Revisá las dos pantallas antes de avanzar.");
        return;
      }
      setFrequencyMessage("");
      setFrequencyPhase("vision");
      frequencyPhaseRef.current = "vision";
      return;
    }
    if (id === "signal-club" || id === "signal-time") {
      setFrequencyClues((current) => current.includes(id) ? current : [...current, id]);
      setFrequencyMessage(id === "signal-club"
        ? "Es el mismo pulso que escuché al terminar Burn Lies."
        : "La imagen marca una fecha que todavía no llegó.");
    }
  }

  function examineArcade(id) {
    if (ARCADE_NPCS.some((entry) => entry.id === id)) {
      if (!conversation && !gameOpen) { setArcadeMessage(null); setConversation({ npc: id, nodeId: "greeting", lastChoice: "" }); }
      return;
    }
    if (ARCADE_GAME_CABINETS[id]) {
      setArcadeMessage(null);
      setArcadeGameId(ARCADE_GAME_CABINETS[id]);
      if (document.pointerLockElement) document.exitPointerLock();
      return;
    }
    if (id === "exit") { openMap(); return; }
    const item = ARCADE_PROPS.find((entry) => entry.id === id);
    if (!item) return;
    if (id === "frequency09Cabinet") {
      if (arcadeProgressRef.current.frequency09EventSeen) {
        setArcadeMessage({ id, label: item.label, text: "La pantalla sigue emitiendo interferencia. Ya vi lo que había del otro lado." });
      } else if (!canActivateFrequency09(clubQuestRef.current, arcadeProgressRef.current)) {
        setArcadeMessage({ id, label: item.label, text: "Mejor no tocar esto todavía. Primero tengo que entender qué está pasando." });
      } else startFrequency09();
      return;
    }
    setArcadeMessage({ id, label: item.label, text: item.text });
  }

  function closeArcadeGame() {
    setArcadeGameId(null);
    requestAnimationFrame(() => storeRef.current?.focus());
  }

  function finishNewArcadeGame(id, result) {
    const next = finishArcadeMiniGame(arcadeProgressRef.current, id, result);
    arcadeProgressRef.current = next;
    setArcadeProgress(next);
    return next;
  }

  function finishArcadeOrbit(score, allowSignal = false) {
    const result = finishOrbitDuel(arcadeProgressRef.current, score, clubQuestRef.current.anomalySeen && allowSignal);
    arcadeProgressRef.current = result.progress;
    setArcadeProgress(result.progress);
    return result;
  }

  function onArcadePulse() {
    if (!arcadeMessage) setArcadeMessage({ id: "interference", label: "Interferencia", text: "Una máquina al fondo se encendió sola... y volvió a apagarse." });
  }

  function changeClubTransforms(next) {
    clubTransformsRef.current = next;
    setClubTransforms(next);
    for (const [id, transform] of Object.entries(next)) clubAssetApiRef.current?.apply(id, transform);
  }

  function examineClub(id) {
    const item = ROCK_CLUB_EXAMINE.find((entry) => entry.id === id);
    if (!item) return;
    if (id === "mixer" && clubQuest.anomalySeen && rikyProgress.postShowSeen) {
      setClubMessage({ ...item, text: masterTape.phase === "complete"
        ? "Qu\u00e9 raro... durante la prueba de sonido todo funcionaba perfectamente. Hay algo en esta se\u00f1al que me recuerda a la grabaci\u00f3n que revisamos con Hugo. Esto parece una secuencia digital... \u00bfD\u00f3nde m\u00e1s podr\u00eda encontrar algo as\u00ed en 1999?"
        : "Qu\u00e9 raro... durante la prueba de sonido todo funcionaba perfectamente. Esto parece una secuencia digital... \u00bfD\u00f3nde m\u00e1s podr\u00eda encontrar algo as\u00ed en 1999?" });
      setClubQuest((progress) => advanceClubShowQuest(progress, "inspectAnomaly", masterTape));
      return;
    }
    setClubMessage(id === "backstage" ? {
      ...item, text: clubQuest.backstageAuthorized
        ? "Charly me autorizó a pasar."
        : "Todavía no tengo permiso para entrar.",
    } : item);
    if (["mixer", "amplifier", "microphone"].includes(id))
      setClubQuest((progress) => advanceClubShowQuest(progress, "inspect:" + id, masterTape));
  }

  function openClubConversation(npcId) {
    if (conversation || mapOpen || paused || !ROCK_CLUB_DIALOGUE_NPCS.some((entry) => entry.id === npcId)) return;
    setClubMessage(null);
    setConversation({ npc: npcId, nodeId: "greeting", lastChoice: "" });
  }

  function openStudioConversation() {
    if (conversation || studioWorkbench || mapOpen) return;
    setStudioMessage(null);
    setConversation({ npc: "hugo", nodeId: missionReady(studioProgress) ? "mission-complete" : "greeting", lastChoice: "" });
  }

  function exploreStudioEquipment(kind, channelId) {
    if (kind === "console") {
      const questChannel = channelId === "rhythm" || channelId === "lead" ? "guitar" : channelId;
      setMasterTape((progress) => advanceMasterTape(progress, "inspect:" + questChannel));
    }
    setStudioProgress((progress) => {
      if (kind === "computer" && progress.studioComputerUnlocked && !progress.computerExplored)
        return { ...progress, computerExplored: true };
      if (kind === "console" && progress.computerExplored && !progress.consoleExplored)
        return { ...progress, consoleExplored: true };
      return progress;
    });
  }

  function openConversation(npcId) {
    if (conversation || jukeboxOpen || archiveOpen || sessionsOpen || !STORE_NPCS.some((entry) => entry.id === npcId)) return;
    if (npcId === "jason") {
      jasonAttemptsRef.current += 1;
      const responds = jasonAttemptsRef.current >= 4;
      if (responds) {
        jasonAttemptsRef.current = 0;
        specialAudioRef.current?.pause();
        const url = getStoreVoiceUrl("jason", { id: "sound" });
        if (url) {
          const voice = new Audio(url);
          specialAudioRef.current = voice;
          voice.play().catch(() => {});
        }
      }
      setEncounterMessage(responds ? "Jason no habla. Por fin deja escapar su sonido inquietante." : `Jason te ignora. Insistí un poco más (${jasonAttemptsRef.current}/4).`);
      clearTimeout(encounterTimerRef.current);
      encounterTimerRef.current = setTimeout(() => setEncounterMessage(null), 3300);
      return;
    }
    setEncounterMessage(null);
    setConversation({ npc: npcId, nodeId: "greeting", lastChoice: "" });
  }

  function onNpcVoiceEnded(npcId) {
    if (!npcId.startsWith("skeleton-")) return;
    setDancingSkeleton(npcId);
    clearTimeout(danceTimerRef.current);
    danceTimerRef.current = setTimeout(() => setDancingSkeleton(null), 6500);
  }

  function closeConversation() {
    if (conversation?.npc === "hugo") {
      setStudioProgress((progress) => ({ ...progress, hugoMet: true, greetingCount: progress.greetingCount + 1 }));
    } else if (ARCADE_NPCS.some((entry) => entry.id === conversation?.npc)) {
      setArcadeProgress((progress) => meetArcadeNpc(progress, conversation.npc));
    } else if (conversation?.npc === "riky") {
      setRikyProgress((progress) => advanceRikyProgress(progress, "meet", masterTape, clubQuest));
    } else if (conversation?.npc === "charly") {
      setClubQuest((progress) => advanceClubShowQuest(progress, "meetCharly", masterTape));
    } else if (conversation?.npc === "friendsTable" || ROCK_CLUB_FRIENDS.some((entry) => entry.id === conversation?.npc)) {
      setFriendsProgress((progress) => advanceFriendsProgress(progress, "meet:" + conversation.npc));
    } else if (conversation && STORE_NPCS.some((entry) => entry.id === conversation.npc)) {
      setStoryProgress((progress) => meetStoreNpc(progress, conversation.npc));
    }
    setConversation(null);
  }

  function chooseConversationOption(optionId, label) {
    if (!conversation) return;
    if (ARCADE_NPCS.some((entry) => entry.id === conversation.npc)) {
      const result = chooseArcadeDialogue(conversation.npc, conversation.nodeId, optionId);
      if (result.nodeId === "close") { closeConversation(); return; }
      if (conversation.nodeId === "greeting" && result.nodeId === "menu") setArcadeProgress((progress) => meetArcadeNpc(progress, conversation.npc));
      setConversation({ ...conversation, nodeId: result.nodeId, lastChoice: "" });
      return;
    }
    if (ROCK_CLUB_DIALOGUE_NPCS.some((entry) => entry.id === conversation.npc)) {
      const result = chooseRockClubDialogue(conversation.npc, conversation.nodeId, optionId, clubQuest, storyProgress, rikyProgress, masterTape, friendsProgress, friendsContext);
      if (conversation.nodeId === "greeting" && (conversation.npc === "friendsTable" || ROCK_CLUB_FRIENDS.some((entry) => entry.id === conversation.npc)))
        setFriendsProgress((progress) => advanceFriendsProgress(progress, "meet:" + conversation.npc));
      if (result.friendsEvent) setFriendsProgress((progress) => advanceFriendsProgress(progress, result.friendsEvent));
      if (result.rikyEvent) {
        setRikyProgress((progress) => advanceRikyProgress(progress, result.rikyEvent, masterTape, clubQuest));
        if (result.rikyEvent === "clue" && !rikyProgress.rikyFrequencyClueKnown)
          setClubNotice("NUEVA PISTA DESCUBIERTA · Riky sugirió comparar las señales de las grabaciones y las pantallas.");
      }
      if (result.clubEvent) {
        setClubQuest((progress) => advanceClubShowQuest(progress, result.clubEvent, masterTape));
        if (result.clubEvent === "completeSoundcheck" && !clubQuest.clubShowReady)
          setClubNotice("PRUEBA DE SONIDO COMPLETADA · El escenario está listo para NeonBoy.");
      }
      if (result.nodeId === "close") { closeConversation(); return; }
      setConversation({ ...conversation, nodeId: result.nodeId, lastChoice: result.nodeId === "no-credential" ? label : "" });
      return;
    }
    if (conversation.npc === "hugo") {
      const result = chooseStudioDialogue(conversation.nodeId, optionId, studioProgress, masterTape, clubQuest);
      if (result.questEvent) setMasterTape((progress) => advanceMasterTape(progress, result.questEvent));
      if (result.clubEvent) setClubQuest((progress) => advanceClubShowQuest(progress, result.clubEvent, masterTape));
      if (result.changed) setStudioProgress(result.progress);
      if (result.nodeId === "close") { closeConversation(); return; }
      setConversation({ ...conversation, nodeId: result.nodeId, lastChoice: result.nodeId.startsWith("master:") ? label : "" });
      return;
    }
    const result = chooseStoreDialogue(conversation.npc, conversation.nodeId, optionId, storyProgress, dialogueContext);
    if (result.questEvent) setMasterTape((progress) => advanceMasterTape(progress, result.questEvent));
    if (result.clubEvent) {
      setClubQuest((progress) => advanceClubShowQuest(progress, result.clubEvent, masterTape));
      if (result.clubEvent === "titoGrantsCredential" && !clubQuest.credentialGranted)
        setClubNotice("NUEVO ESCENARIO · Club de Rock 1999 desbloqueado. Credencial guardada en el inventario.");
    }
    if (result.changed) setStoryProgress(result.progress);
    if (result.nodeId === "close") { closeConversation(); return; }
    if (result.nodeId === "archive" && result.progress.archiveUnlocked) { closeConversation(); setArchiveOpen(true); return; }
    setConversation({ ...conversation, nodeId: result.nodeId, lastChoice: label });
  }
  function takeCoins() {
    const added = Math.max(0, 10 - creditsRef.current);
    creditsRef.current = 10;
    setCredits(10);
    return added;
  }

  function spendCoin() {
    if (creditsRef.current < 1) return false;
    creditsRef.current -= 1;
    setCredits(creditsRef.current);
    return true;
  }

  function openJukebox() {
    const snapshot = scenePlayerRef.current?.getSnapshot?.();
    if (snapshot) playbackRef.current = snapshot;
    setOutsideVideo(null);
    setListening(false);
    setListenerPlayback("stopped");
    setJukeboxPlaying(activeVideoIndex !== null && playbackRef.current.playing !== false);
    setJukeboxOpen(true);
  }

  function closeJukebox() {
    const snapshot = jukeboxPlayerRef.current?.getSnapshot?.();
    if (snapshot) playbackRef.current = snapshot;
    const video = activeVideoIndex === null ? null : ROCKOLA_VIDEOS[activeVideoIndex];
    setOutsideVideo(video ? { ...video, ...playbackRef.current } : null);
    setJukeboxPlaying(false);
    setJukeboxOpen(false);
  }

  function selectJukeboxVideo(index) {
    playbackRef.current = { seconds: 0, playing: true };
    setActiveVideoIndex(index);
    setJukeboxPlaying(true);
  }
  function chooseAlbum(id) {
    const next = DISCOGRAPHY_ALBUMS.find((entry) => entry.id === id);
    if (!next) return;
    setSelectedId(id);
    setListenerMinimized(false);
    setActiveGroup(next.group);
    setTrackIndex(0);
    setListening(false);
    setListenerPlayback("stopped");
    setOutsideVideo(null);
  }

  function listenToAlbumFromScene(id) {
    const selected = DISCOGRAPHY_ALBUMS.find((entry) => entry.id === id);
    chooseAlbum(id);
    if (selected?.tracks.length) {
      setListening(true);
      setListenerPlayback("loading");
      setListenerPlayRequest((value) => value + 1);
    }
  }

  function chooseGroup(id) {
    const first = DISCOGRAPHY_ALBUMS.find((entry) => entry.group === id);
    if (first) chooseAlbum(first.id);
  }

  const inventoryButton = <button type="button" onClick={openInventory} aria-keyshortcuts="I"><Backpack size={17} /> INVENTARIO</button>;
  const inventoryPanel = inventoryOpen && <UniverseInventory items={inventoryItems} onClose={closeInventory}
    resolveAction={(item) => getUniverseInventoryAction(item, { scene: activeScene, nearby, masterTape, clubQuest })}
    onAction={useInventoryAction} />;
  const inventoryToast = inventoryNotice && <div className="universe-inventory-notice" role="status" aria-live="polite">
    <small>OBJETO OBTENIDO</small><strong>{inventoryNotice}</strong>
  </div>;

  if (activeScene === "frequency") return <div ref={storeRef}
    className="neon-record-store neon-recording-studio neon-frequency-realm" tabIndex={-1}
    role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"}
    aria-label="Interior de FREQUENCY 09">
    <RecordStoreScene scenario="frequency-09" albums={DISCOGRAPHY_ALBUMS}
      onNearby={setNearby} onExamine={examineFrequency} onViewChange={setFirstPerson}
      onJumpChange={setJumping} firstPerson={firstPerson} frequencyPhase={frequencyPhase}
      interactionLocked={paused || frequencyPhase !== "explore"} paused={paused}
      playerSnapshotRef={frequencyPlayerRef} />
    <header className="studio-header"><div><span>SEÑAL INESTABLE / 09</span>
      <h2>FREQUENCY 09</h2><p>Un lugar que no debería existir.</p></div></header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; E: examinar &nbsp;|&nbsp; Esc: pausa</div>
    {frequencyPhase === "explore" && <aside className="frequency-objective" role="status">
      <strong>SEÑAL FRAGMENTADA</strong><span>Examiná las pantallas y seguí hasta el fondo.</span>
      <small>{frequencyClues.length}/2 ecos encontrados</small></aside>}
    {nearby?.kind === "examine" && frequencyPhase === "explore" && !paused &&
      <div className="studio-examine-cue" role="status">[E] EXAMINAR {nearby.label.toUpperCase()}</div>}
    {frequencyMessage && frequencyPhase === "explore" && <div className="frequency-thought" role="status">
      <span>NEONBOY</span><p>{frequencyMessage}</p>
      <button type="button" onClick={() => setFrequencyMessage("")} aria-label="Cerrar mensaje">&times;</button></div>}
    {["vision", "presence", "collapse"].includes(frequencyPhase) && <div className={"frequency-distortion frequency-distortion--" + frequencyPhase + (paused ? " is-paused" : "")} aria-hidden="true" />}
    {["vision", "presence", "collapse"].includes(frequencyPhase) && <div className={"frequency-sequence frequency-sequence--" + frequencyPhase + (paused ? " is-paused" : "")} role="status" aria-live="polite">
      <strong>{frequencyPhase === "vision" ? "ESTO TODAVÍA NO SUCEDIÓ" :
        frequencyPhase === "presence" ? "TU MÚSICA ABRIÓ LA PUERTA" : "LA SEÑAL SE DERRUMBA"}</strong>
      <span>{frequencyPhase === "vision" ? "La Tienda de los Discos... destruida." :
        frequencyPhase === "presence" ? "Hay algo observando desde el fondo." : "NeonBoy vuelve al Arcade."}</span>
    </div>}
    <footer className="studio-footer"><span>FREQUENCY 09</span><span>DIMENSIÓN INTERIOR</span><span>1999 / ?</span></footer>
  </div>;

  if (activeScene === "arcade") return <div ref={storeRef} className="neon-record-store neon-recording-studio neon-arcade" tabIndex={-1} role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label="Arcade 1999">
    <RecordStoreScene scenario="arcade" albums={DISCOGRAPHY_ALBUMS} onNearby={setNearby} onExamine={examineArcade}
      onArcadeEvent={onArcadePulse} arcadeAltered={clubQuest.anomalySeen}
      onViewChange={setFirstPerson} onJumpChange={setJumping}
      interactionLocked={paused || mapOpen || inventoryOpen || Boolean(conversation) || gameOpen || frequencyPhase !== "idle"}
      frequencyPhase={frequencyPhase} activeNpc={conversation?.npc || null} paused={paused || gameOpen} firstPerson={firstPerson}
      playerSnapshotRef={arcadePlayerRef} arcadeTransformsRef={arcadeTransformsRef} arcadeAssetApiRef={arcadeAssetApiRef} />
    <header className="studio-header">
      <div><span>NEONBOY UNIVERSE / BUENOS AIRES · 1999</span><h2>ARCADE 1999</h2><p>Hay algo extraño en las máquinas...</p></div>
      <div className="studio-header-actions">{inventoryButton}<button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button></div>
    </header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; V: vista &nbsp;|&nbsp; Espacio: saltar &nbsp;|&nbsp; E: examinar &nbsp;|&nbsp; M: mapa &nbsp;|&nbsp; I: inventario</div>
    {nearby?.kind === "examine" && !mapOpen && !inventoryOpen && !conversation && !gameOpen && frequencyPhase === "idle" &&
      <div className="studio-examine-cue" role="status">{ARCADE_NPCS.some((entry) => entry.id === nearby.id) ? "[E] HABLAR CON " + nearby.label.toUpperCase() : ARCADE_GAME_CABINETS[nearby.id] ? "[E] JUGAR " + nearby.label.toUpperCase() : nearby.id === "frequency09Cabinet" ? "[E] INTERACTUAR CON FREQUENCY 09" : nearby.id === "exit" ? "[E] Volver al mapa" : "[E] Examinar " + nearby.label}</div>}
    {arcadeProgress.recordStoreFutureVisionSeen
      ? <aside className="frequency-objective" role="status"><strong>EL FUTURO QUE NO EXISTE</strong><small>FREQUENCY 09 mostró la tienda destruida.</small><span>{arcadeProgress.recordStoreRevisitedAfterVision ? "La tienda sigue intacta... por ahora." : "Volvé a la Tienda de los Discos."}</span></aside>
      : clubQuest.anomalySeen && <ClubShowHud quest={clubQuest} masterTape={masterTape} scene="arcade" rikyProgress={rikyProgress} />}
    {inventoryToast}
    {frequencyPhase === "intake" && <div className={"frequency-intake" + (paused ? " is-paused" : "")} role="status"><strong>FREQUENCY 09</strong><span>SEÑAL NO IDENTIFICADA</span></div>}
    {arcadeMessage && <div className="studio-examine-message" role="status" aria-live="polite">
      <small>NEONBOY EXAMINA / {arcadeMessage.label}</small><p>{arcadeMessage.text}</p>
      <button type="button" onClick={() => setArcadeMessage(null)} aria-label="Cerrar examen">&times;</button>
    </div>}
    {conversationNpc && ARCADE_NPCS.some((entry) => entry.id === conversationNpc.id) && conversationNode &&
      <RecordStoreConversation npc={conversationNpc} node={conversationNode} lastChoice={conversation.lastChoice}
        onChoose={chooseConversationOption} onClose={closeConversation} />}
    {arcadeGameId === "orbit" && <ArcadeOrbitDuel progress={arcadeProgress} onFinish={finishArcadeOrbit} onClose={closeArcadeGame} paused={paused} />}
    {arcadeGameId && arcadeGameId !== "orbit" && <ArcadeMiniGame id={arcadeGameId} progress={arcadeProgress} onFinish={finishNewArcadeGame} onClose={closeArcadeGame} paused={paused} />}
    {import.meta.env.DEV && !mapOpen && !inventoryOpen && !conversation && !gameOpen &&
      <RecordingStudioDevPanel transforms={arcadeTransforms} onChange={changeArcadeTransforms}
        assets={ARCADE_ASSETS} onSave={saveArcadeTransforms} onDefault={defaultArcadeTransform}
        filename="arcadeTransforms.json" ariaLabel="Ajustar modelos del Arcade" reachIds={ARCADE_ASSETS.map((entry) => entry.id)} />}
    {mapOpen && <NeonUniverseMap onClose={closeMap} onEnter={enterScenario} unlockedScenarios={unlockedScenarios} />}
    {inventoryPanel}
    <footer className="studio-footer"><span>ARCADE 1999 · BUENOS AIRES</span><span>{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"}{jumping ? " · SALTANDO" : ""}</span><span>{clubQuest.anomalySeen ? "SEÑAL ALTERADA" : "MODO NORMAL"}</span></footer>
  </div>;

  if (activeScene === "studio") return <div ref={storeRef} className="neon-record-store neon-recording-studio" role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label="Neon Recording Studio 1999">
    <RecordStoreScene scenario="studio" albums={DISCOGRAPHY_ALBUMS} onNearby={setNearby} onExamine={examineStudio} onHugoInteract={openStudioConversation}
      onViewChange={setFirstPerson} onJumpChange={setJumping} interactionLocked={paused || mapOpen || inventoryOpen || Boolean(conversation) || Boolean(studioWorkbench)} firstPerson={firstPerson}
      playerSnapshotRef={studioPlayerRef} studioTransformsRef={studioTransformsRef} studioAssetApiRef={studioAssetApiRef} />
    <header className="studio-header">
      <div><span>NEONBOY UNIVERSE / EST. 1999</span><h2>NEON RECORDING STUDIO</h2><p>Sala de control · Cabina de grabación</p></div>
      <div className="studio-header-actions">{inventoryButton}<button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button></div>
    </header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; Espacio: saltar &nbsp;|&nbsp; E: examinar / hablar &nbsp;|&nbsp; M: mapa &nbsp;|&nbsp; I: inventario</div>
    {nearby?.kind === "hugo" && !conversation && !mapOpen && !studioWorkbench &&
      <span className="studio-talk-accessible" role="status">Hugo Mendez cerca. Presioná E para hablar.</span>}
    {nearby?.kind === "examine" && <div className="studio-examine-cue" role="status">[E] Examinar {nearby.label}</div>}
    <div className="studio-progress" role="status"><strong>DETRÁS DE LA MEZCLA</strong><span>{studioMissionStep}</span>
      <button type="button" onClick={() => setStudioWorkbench("archive")}>Archivo ({Number(studioProgress.wakeUpInfo) + Number(studioProgress.jesusIsKingInfo) + Number(studioProgress.newBornInfo) + Number(studioProgress.missionComplete)})</button>
    </div>
    <MasterTapeHud progress={masterTape} scene="studio" />
    <ClubShowHud quest={clubQuest} masterTape={masterTape} scene="studio" />
    {clubNoticePanel}
    {inventoryToast}
    {studioMessage && <div className="studio-examine-message" role="status" aria-live="polite"><small>NEONBOY EXAMINA / {STUDIO_EXAMINE.find((entry) => entry.id === studioMessage.id)?.label}</small><p>{studioMessage.text}</p><button type="button" onClick={() => setStudioMessage(null)} aria-label="Cerrar examen">&times;</button></div>}
    {conversationNpc?.id === "hugo" && conversationNode && <RecordStoreConversation npc={conversationNpc} node={conversationNode} lastChoice={conversation.lastChoice}
      onChoose={chooseConversationOption} onClose={closeConversation} />}
    {studioWorkbench && <StudioWorkbench key={studioWorkbench + ":" + studioAlbumId} mode={studioWorkbench} albumId={studioAlbumId} progress={studioProgress} masterTape={masterTape}
      onClose={() => setStudioWorkbench(null)} onExplore={exploreStudioEquipment} paused={paused} />}
    {import.meta.env.DEV && !mapOpen && !conversation && !studioWorkbench && <RecordingStudioDevPanel transforms={studioTransforms} onChange={changeStudioTransforms} />}
    {mapOpen && <NeonUniverseMap onClose={closeMap} onEnter={enterScenario} unlockedScenarios={unlockedScenarios} />}
    {inventoryPanel}
    <footer className="studio-footer"><span>CONTROL ROOM · 1999</span><span>{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"}{jumping ? " · SALTANDO" : ""}</span><span>NEONBOY RECORDING</span></footer>
  </div>;

  if (activeScene === "club") return <div ref={storeRef} className={"neon-record-store neon-recording-studio neon-rock-club" + (concertEditor.open ? " concert-editing" : "")} role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label="Club de Rock 1999">
    <RecordStoreScene scenario="rock-club" albums={DISCOGRAPHY_ALBUMS} onNearby={setNearby} onExamine={examineClub}
      onNpcInteract={openClubConversation} activeNpc={conversation?.npc || null}
      onViewChange={setFirstPerson} onJumpChange={setJumping} interactionLocked={paused || mapOpen || inventoryOpen || Boolean(conversation) || concertPhase !== "idle"}
      onConcertStart={startConcert} concertReady={clubQuest.clubShowReady} concertActive={["live", "outro", "anomaly"].includes(concertPhase)} concertEffectRef={concertEffectRef}
      concertTransformsRef={concertTransformsRef} concertMotionRef={concertMotionRef} concertPoseRef={concertPoseRef}
      motionPlaybackOffsetsRef={motionPlaybackOffsetsRef}
      motionRecordingId={motionRecording?.id} concertCameraMode={concertCameraMode} concertEditor={concertEditor}
      onPoseGizmoChange={changeConcertPoseVector}
      paused={paused} firstPerson={firstPerson} playerSnapshotRef={clubPlayerRef} clubTransformsRef={clubTransformsRef} clubAssetApiRef={clubAssetApiRef} />
    <header className="studio-header">
      <div><span>NEONBOY UNIVERSE / EN VIVO DESDE 1999</span><h2>CLUB DE ROCK 1999</h2><p>Una noche para tocar fuerte.</p></div>
      <div className="studio-header-actions">{inventoryButton}<button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button></div>
    </header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; V: vista &nbsp;|&nbsp; Espacio: saltar &nbsp;|&nbsp; E: examinar / hablar &nbsp;|&nbsp; M: mapa &nbsp;|&nbsp; I: inventario</div>
    {nearby?.kind === "club-friends" && concertPhase === "idle" && !conversation && !mapOpen &&
      <div className="studio-examine-cue" role="status">[E] HABLAR CON LOS AMIGOS</div>}
    {nearby?.kind === "club-npc" && concertPhase === "idle" && !conversation && !mapOpen &&
      <div className="studio-examine-cue" role="status">[E] HABLAR CON {ROCK_CLUB_NPCS.find((entry) => entry.id === nearby.id)?.name.toUpperCase()}</div>}
    {nearby?.kind === "examine" && concertPhase === "idle" && !mapOpen && !conversation &&
      <div className="studio-examine-cue" role="status">
        {(nearby.id === "stage" || nearby.id === "microphone") && clubQuest.clubShowReady
          ? <button type="button" className="club-concert-start" onClick={startConcert}>[E] Iniciar recital</button>
          : `[E] Examinar ${nearby.label}`}
      </div>}
    {concertPhase === "idle" && <ClubShowHud quest={clubQuest} masterTape={masterTape} scene="club" rikyProgress={rikyProgress} />}
    {concertPhase === "intro" && <div className="club-concert-intro" role="status"><small>CHARLY PRESENTA</small><strong>¡Con ustedes, 9th Revelation!</strong></div>}
    {(concertPhase === "waiting-audio" || concertPhase === "live") && <aside className="club-concert-panel" aria-label="Recital Burn Lies">
      <span className="club-concert-kicker">9TH REVELATION / CLUB DE ROCK 1999</span>
      <strong>BURN LIES</strong>
      <em className={concertPhase === "live" ? "is-live" : ""}>{concertPhase === "live" ? "EN VIVO" : "SINTONIZANDO"}</em>
      <RockClubConcertAudio key={concertRun} paused={paused || (concertEditor.open && concertEditor.frozen)}
        onPlaying={() => { if (concertPhase === "waiting-audio") setConcertPhase("live"); }}
        onEnded={beginConcertEnding} onError={() => setConcertError(true)} />
      <label className="club-concert-camera-label">Cámara del recital
        <select aria-label="Cámara del recital" value={concertCameraMode} onChange={(event) => setConcertCameraMode(event.target.value)}>
          <option value="auto">Planos automáticos</option>{CONCERT_SHOTS.map((shot) => <option key={shot.id} value={shot.id}>{shot.label}</option>)}
        </select>
      </label>
      {concertError && <small>Si el video no arranca, usá Play o abrilo en YouTube.</small>}
      <button type="button" className="club-concert-finish" onClick={beginConcertEnding}>Finalizar show y continuar historia</button>
      <button type="button" className="club-concert-cancel" onClick={stopConcert}>[R] Cancelar recital</button>
    </aside>}
    {concertPhase === "outro" && <div className="club-concert-finale" role="status"><small>9TH REVELATION</small><strong>Fin del show</strong></div>}
    {concertPhase === "anomaly" && <div className="club-anomaly-overlay" role="status" aria-label="Interferencia desconocida"><span className="club-anomaly-symbol" aria-hidden="true">{"\u25c7"}</span><strong>{"SE\u00d1AL DESCONOCIDA"}</strong></div>}
    {(clubNotice || clubMessage) && <div className="club-feedback-stack">
      {clubNoticePanel}
      {clubMessage && <div className="studio-examine-message" role="status" aria-live="polite">
        <small>NEONBOY EXAMINA / {clubMessage.label}</small><p>{clubMessage.text}</p>
        <button type="button" onClick={() => setClubMessage(null)} aria-label="Cerrar examen">&times;</button>
      </div>}
    </div>}
    {inventoryToast}
    {conversationNpc && ROCK_CLUB_DIALOGUE_NPCS.some((entry) => entry.id === conversationNpc.id) && conversationNode &&
      <RecordStoreConversation npc={conversationNpc} node={conversationNode} lastChoice={conversation.lastChoice}
        onChoose={chooseConversationOption} onClose={closeConversation} />}
    {import.meta.env.DEV && !mapOpen && !conversation && concertPhase === "idle" &&
      <RecordingStudioDevPanel transforms={clubTransforms} onChange={changeClubTransforms}
        assets={CLUB_DEV_ASSETS} onSave={saveRockClubActorTransforms} onDefault={defaultRockClubActorTransform}
        filename="rockClubActorTransforms.json" ariaLabel="Ajustar modelos del club" reachIds={ROCK_CLUB_NPCS.map((entry) => entry.id)} />}
    {import.meta.env.DEV && !mapOpen && !conversation && concertPhase === "live" &&
      <RockClubConcertEditor transforms={concertTransforms} onChange={changeConcertTransforms} view={concertEditor} onViewChange={setConcertEditor}
        pose={concertPose} onPoseChange={changeConcertPose} onPoseReset={resetConcertPose}
        availablePoseBones={clubAssetApiRef.current?.getPoseBones?.(concertEditor.poseActor || concertEditor.selected) || []}
        motion={concertMotion} recording={motionRecording} cursor={motionCursor} onStartRecording={startMotionRecording}
        onStopRecording={stopMotionRecording} onCaptureFrame={captureMotionFrame} onDurationChange={changeMotionDuration}
        onTogglePlayback={toggleMotionPlayback} onLoadFrame={loadMotionFrame} onDeleteFrame={deleteMotionFrame} />}
    {mapOpen && <NeonUniverseMap onClose={closeMap} onEnter={enterScenario} unlockedScenarios={unlockedScenarios} />}
    {inventoryPanel}
    <footer className="studio-footer"><span>CLUB DE ROCK · 1999</span><span>{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"}{jumping ? " · SALTANDO" : ""}</span><span>NEONBOY EN VIVO</span></footer>
  </div>;

  return <div ref={storeRef} className={"neon-record-store" + (albumsMinimized ? " albums-minimized" : "") + (listenerMinimized ? " listener-minimized" : "")} role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label="Tienda de discos Neonboy">
    <RecordStoreScene albums={DISCOGRAPHY_ALBUMS} playerSnapshotRef={storePlayerRef} onSelect={listenToAlbumFromScene} onNearby={setNearby}
      onOpenJukebox={openJukebox} onTakeCoins={takeCoins} onNpcInteract={openConversation} credits={credits} activeNpc={conversation?.npc || null} roxyPlaying={roxyPlaying} dancingSkeleton={dancingSkeleton} onViewChange={setFirstPerson}
      onJumpChange={setJumping} interactionLocked={paused || jukeboxOpen || Boolean(conversation) || archiveOpen || sessionsOpen || mapOpen || inventoryOpen} projectionPaused={jukeboxOpen} paused={paused} firstPerson={firstPerson}
      outsideVideo={outsideVideo} playbackApiRef={scenePlayerRef} />
    <div className="record-store-controls-hint">{firstPerson ? "WASD: caminar · Clic en escena: mirar con mouse · V: vista · Espacio: saltar · E: interactuar · I: inventario" : "WASD: caminar · Arrastrar: mirar · V: vista · Espacio: saltar · E: interactuar · I: inventario"}</div>
    <div className="record-store-view-status" role="status">{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"}{jumping ? " · SALTANDO" : ""}</div>
    {nearbyAlbum ? <div className="record-store-album-cue" role="status" aria-live="polite">
      <span className="record-store-album-cue-kicker">DISCO EN EXHIBICIÓN</span>
      <strong>{nearbyAlbum.name}</strong>
      <span className="record-store-album-cue-action">Presioná <kbd>E</kbd> {nearbyAlbum.tracks.length ? "para escuchar" : "para ver el disco"}</span>
    </div> : nearby && <div className="record-store-nearby" role="status">{nearby.kind === "coins" ? "E · Tomar monedas de la mesa" : nearby.kind === "npc" ? (nearby.id === "jason" ? "E · Insistir con Jason" : "E · Hablar con " + (STORE_NPCS.find((entry) => entry.id === nearby.id)?.name || "personaje")) : "E · Abrir la rockola"}</div>}
    {encounterMessage && <div className="record-store-encounter-message" role="status" aria-live="polite">{encounterMessage}</div>}
    <div className="record-store-arcade-hud"><span><Coins size={16} /> {credits}/10 monedas</span><button type="button" onClick={openJukebox}><Film size={17} /> Abrir rockola</button>{inventoryButton}<button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button>{masterTape.phase === "complete" && <button type="button" className="neon-sessions-trigger" onClick={() => setSessionsOpen(true)}>NEON SESSIONS</button>}</div>
    <MasterTapeHud progress={masterTape} scene="store" />
    {arcadeProgress.recordStoreFutureVisionSeen
      ? <aside className="frequency-objective" role="status"><strong>EL FUTURO QUE NO EXISTE</strong><small>La visión mostró un futuro que todavía no ocurrió.</small><span>La tienda sigue intacta... por ahora.</span></aside>
      : <ClubShowHud quest={clubQuest} masterTape={masterTape} scene="store" />}
    {clubNoticePanel}
    {inventoryToast}

    <header className="record-store-header">
      <div className="record-store-brand"><span>NEONBOY MUSIC · DESDE HALLOWEEN</span><h2>LA TIENDA DE LOS DISCOS</h2><p>Entrá y recorré la discografía como en una disquería de los 90.</p></div>
      {onClose && <button ref={closeRef} type="button" onClick={onClose}><ArrowLeft size={17} /> {standalone ? "Ir a Juego" : "Volver al menú"}</button>}
    </header>

    <div className="record-store-content">
      <section className={"record-store-wall" + (albumsMinimized ? " is-minimized" : "")} aria-label="Discografía de Neonboy">
        <div className="record-store-wall-heading">
          <span><Disc3 size={18} /> DISCOS / COLECCIONES</span>
          <div className="record-store-panel-actions">
            <small>{DISCOGRAPHY_ALBUMS.length} discos en la tienda</small>
            <button type="button" className="record-store-panel-toggle" aria-label={albumsMinimized ? "Maximizar discos" : "Minimizar discos"}
              aria-controls="record-store-catalog-body" aria-expanded={!albumsMinimized} onClick={() => setAlbumsMinimized((value) => !value)}>
              {albumsMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              {albumsMinimized ? "Maximizar" : "Minimizar"}
            </button>
          </div>
        </div>
        <div id="record-store-catalog-body" className="record-store-wall-body">
        <div className="record-store-groups" role="group" aria-label="Elegir discografía">
          {DISCOGRAPHY_GROUPS.map((group) => <button type="button" key={group.id}
            aria-pressed={activeGroup === group.id} onClick={() => chooseGroup(group.id)}>
            {group.id === "band" && <img src={BAND_LOGO} alt="" />}
            <span><strong>{group.name}</strong><small>{group.description} · {DISCOGRAPHY_ALBUMS.filter((entry) => entry.group === group.id).length} discos</small></span>
          </button>)}
        </div>
        <div className="record-store-albums">
          {visibleAlbums.map((entry) => <button type="button" key={entry.id}
            className={"record-store-album" + (selectedId === entry.id ? " is-selected" : "") + (entry.incoming ? " is-incoming" : "")}
            aria-label={"Disco " + entry.name + (entry.incoming ? ", próximo lanzamiento" : "")}
            aria-pressed={selectedId === entry.id} onClick={() => chooseAlbum(entry.id)}>
            <span className="record-store-sleeve">
              <img src={entry.cover} alt={"Tapa de " + entry.name} loading="lazy" />
              {entry.incoming && <span className="record-store-incoming">INCOMING</span>}
            </span>
            <span className="record-store-album-label"><strong>{entry.name}</strong><small>{entry.incoming ? "PRÓXIMAMENTE" : entry.tracks.length ? "ESCUCHAR" : "TEMAS PENDIENTES"}</small></span>
          </button>)}
        </div>
        <div className="record-store-shelf" aria-hidden="true" />
        </div>
      </section>

      <aside className={"record-store-listener" + (listenerMinimized ? " is-minimized" : "")} aria-label="Puesto de escucha">
        <div className="record-store-listener-top">
          <Headphones size={25} />
          <div><span>PUESTO DE ESCUCHA · 199X</span><strong>ESTACIÓN DE ESCUCHA</strong><small className="record-store-listener-summary">{album.name}{currentTrack ? " · " + currentTrack.name : ""}</small></div>
          <i>{listenerStatus}</i>
          <button type="button" className="record-store-panel-toggle" aria-label={listenerMinimized ? "Maximizar discografía lateral" : "Minimizar discografía lateral"}
            aria-controls="record-store-listener-body" aria-expanded={!listenerMinimized} title={listenerMinimized ? "Maximizar discografía lateral" : "Minimizar discografía lateral"} onClick={() => setListenerMinimized((value) => !value)}>
            {listenerMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}

          </button>
        </div>
        <div id="record-store-listener-body" className="record-store-listener-body">
        <div className="record-store-selected">
          <div className="record-store-selected-cover"><img src={album.cover} alt={"Tapa de " + album.name} /></div>
          <div><small>{album.group === "band" ? "9TH REVELATION" : "NEONBOY · INSTRUMENTAL"} / CATÁLOGO {album.number}</small><h3>{album.name}</h3><p>{album.incoming ? "INCOMING · Próximo lanzamiento" : tracks.length ? tracks.length + (tracks.length === 1 ? " tema para escuchar" : " temas para escuchar") : "Portada en exposición · temas pendientes"}</p></div>
        </div>
        {album.group === "band" && <img className="record-store-band-logo" src={BAND_LOGO} alt="Logo de 9th Revelation" />}

        {album.incoming ? <div className="record-store-message incoming-message"><Disc3 size={22} /><strong>INCOMING</strong><p>Unholy Fire está en proceso. Sus canciones aparecerán acá cuando se publiquen.</p></div>
          : tracks.length ? <>
            <div className="record-store-tracklist"><span>ELEGÍ UNA CANCIÓN</span>
              {tracks.map((track, index) => <button type="button" key={track.videoId}
                className={currentTrack?.videoId === track.videoId ? "is-active" : ""}
                aria-label={"Reproducir " + track.name}
                onClick={() => { setTrackIndex(index); setListening(true); setListenerPlayback("loading"); setListenerPlayRequest((value) => value + 1); setOutsideVideo(null); }}>
                <span>{String(index + 1).padStart(2, "0")}</span><Play size={12} aria-hidden="true" />{track.name}
              </button>)}
            </div>
            {currentTrack ? <RecordStoreAlbumPlayer key={album.id + ":" + currentTrack.videoId} albumName={album.name} track={currentTrack} onPlaybackChange={setListenerPlayback} playRequest={listenerPlayRequest} paused={paused} /> : <p className="record-store-play-hint">Elegí una canción para escucharla acá.</p>}
          </> : <div className="record-store-message"><Music2 size={22} /><strong>ESCUCHA PENDIENTE</strong><p>Los enlaces de este disco se incorporarán cuando estén disponibles.</p></div>}
        <div className="record-store-disc" aria-hidden="true"><span>NEONBOY RECORDS</span><i /></div>
        <div className="record-store-deck" aria-hidden="true"><span>NEONBOY STEREO</span><i /><i /><i /><b>● ● ● ● ● ● ●</b></div>
        </div>
      </aside>
    </div>

    {storyProgress.duelCompleted && !storyProgress.archiveUnlocked && !conversation && <div className="record-store-quest-badge">✓ DUELO GANADO · Volvé con Tito</div>}
    {storyProgress.archiveUnlocked && !conversation && !archiveOpen && !jukeboxOpen && <button type="button" className="record-store-archive-trigger" onClick={() => setArchiveOpen(true)}>ARCHIVO PROHIBIDO</button>}
    {conversationNpc && conversationNode && <RecordStoreConversation npc={conversationNpc} node={conversationNode} lastChoice={conversation.lastChoice}
      onChoose={chooseConversationOption} onClose={closeConversation} onVoiceEnded={onNpcVoiceEnded} />}
    {archiveOpen && <div className="record-store-conversation-overlay"><section className="record-store-archive" role="dialog" aria-modal="true" aria-label="Archivo Prohibido de Neonboy">
      <small>LA TIENDA DE LOS DISCOS · 1999</small><h3>ARCHIVO PROHIBIDO — NEONBOY</h3>
      <p>Archivo prohibido desbloqueado. Próximamente, una nueva grabación de NeonBoy.</p>
      <button type="button" onClick={() => setArchiveOpen(false)}>Cerrar archivo</button>
    </section></div>}
    {sessionsOpen && <NeonSessionsArchive progress={masterTape} onClose={() => setSessionsOpen(false)} />}
    {jukeboxOpen && <RecordStoreJukebox credits={credits} onCollect={takeCoins} onSpend={spendCoin} onClose={closeJukebox}
      activeIndex={activeVideoIndex} onActiveChange={selectJukeboxVideo} startAt={playbackRef.current.seconds} startPlaying={playbackRef.current.playing}
      onPlaybackChange={setJukeboxPlaying} playerApiRef={jukeboxPlayerRef} />}
    {mapOpen && <NeonUniverseMap onClose={closeMap} onEnter={enterScenario} unlockedScenarios={unlockedScenarios} />}
    {inventoryPanel}
    <footer className="record-store-footer"><span>✦ NACIDO EN HALLOWEEN ✦</span><span>NEONBOY · DISCOS, MISTERIO Y VOLUMEN</span><span>31 OCT / ABIERTO TODA LA NOCHE</span></footer>
  </div>;
}
