import React, { useEffect, useMemo, useRef, useState } from "react";
import { receiveCombatDamage } from "./combatHeartsLogic.js";
import { ArrowLeft, Backpack, ChevronLeft, Coins, Disc3, Film, Headphones, MapPinned, Minimize2, Music2, Pin, Play } from "lucide-react";
import RecordStoreScene from "./RecordStoreScene.jsx";
import InteractionPrompt from "./InteractionPrompt.jsx";
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
import RooftopPuzzle from "./RooftopPuzzle.jsx";
import RooftopAtmosphere from "./RooftopAtmosphere.jsx";
import LostShipPanel from "./LostShipPanel.jsx";
import NeonOrbHud from "./NeonOrbHud.jsx";
import ParthenonPanel from "./ParthenonPanel.jsx";
import MatrixPanel from "./MatrixPanel.jsx";
import MatrixBossHud from "./MatrixBossHud.jsx";
import StoreInvasionPanel from "./StoreInvasionPanel.jsx";
import { normalizeStoreInvasionProgress, advanceStoreInvasion, storeInvasionObjective } from "./storeInvasionQuest.js";
import {normalizeMatrixProgress,advanceMatrixProgress,matrixObjective,matrixSafeCheckpoint,matrixSafePlayerSnapshot,MATRIX_INITIAL,MATRIX_HEALTH} from "./matrixQuest.js";
import {MATRIX_LAYOUT,MATRIX_ASSETS,defaultMatrixTransform,loadMatrixTransforms,saveMatrixTransforms} from "./matrixLayout.js";
import { PARTHENON_INITIAL, normalizeParthenonProgress, advanceParthenonProgress, parthenonObjective, medusaQuestObjective } from "./parthenonQuest.js";
import { HOPLITE_CONFIG } from "./parthenonCombatConfig.js";
import { PARTHENON_ASSETS, defaultParthenonTransform, loadParthenonTransforms, saveParthenonTransforms } from "./parthenonLayout.js";
import { INITIAL_LOST_SHIP_PROGRESS, normalizeLostShipProgress, advanceLostShipProgress, lostShipObjective } from "./lostShipQuest.js";
import { LOST_SHIP_ASSETS, defaultLostShipTransform, loadLostShipTransforms, saveLostShipTransforms } from "./lostShipLayout.js";
import { INITIAL_ROOFTOP_PROGRESS, normalizeRooftopProgress, advanceRooftopProgress, rooftopObjective } from "./rooftopQuest.js";
import { ROOFTOP_ASSETS, defaultRooftopTransform, loadRooftopTransforms, saveRooftopTransforms } from "./rooftopLayout.js";
import { ARCADE_NPCS, getArcadeDialogueNode, chooseArcadeDialogue } from "./arcadeDialogue.js";
import { INITIAL_ARCADE_PROGRESS, normalizeArcadeProgress, meetArcadeNpc, finishOrbitDuel, finishArcadeMiniGame, canActivateFrequency09, completeFrequency09, revisitStoreAfterVision } from "./arcadeProgress.js";
import { advanceStoreInvestigation, storeInvestigationObjective } from "./recordStoreReturn.js";
import StudioWorkbench from "./StudioWorkbench.jsx";
import StudioSignalAnalyzer from "./StudioSignalAnalyzer.jsx";
import { advanceImpossibleRecording, impossibleRecordingObjective } from "./studioImpossibleRecording.js";
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
import UniverseMissionCard from "./UniverseMissionCard.jsx";
import "./masterTapeUi.css";
import "./recordingStudio.css";
import "./rockClub.css";
import "./arcade.css";
import "./frequency09.css";
import "./rooftop.css";
import "./lostShip.css";
import "./parthenon.css";
import "./discographyStore.css";
import "./storeInvasion.css";

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
  return <UniverseMissionCard className={"club-show-hud club-show-hud--" + scene}
    title={quest.anomalySeen ? "La señal desconocida" : quest.soundcheckStarted ? "Prueba de sonido" : "La credencial del show"}
    kind={quest.anomalySeen ? "signal" : quest.soundcheckStarted ? "sound" : "show"}
    objective={objective}
    details={[
      quest.credentialGranted && "Credencial del Club de Rock",
      quest.soundcheckStarted && `Equipo · ${quest.inspected.length}/3 revisado`,
      scene === "club" && rikyProgress?.rikyFrequencyClueKnown && "Pista · Comparar las señales de las grabaciones y las pantallas.",
    ]} />;
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
  const [sidebarTab, setSidebarTab] = useState("listen");
  const [listenerMinimized, setListenerMinimized] = useState(true);
  const [listenerPinned, setListenerPinned] = useState(false);
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
  const frequencyReplayRef = useRef(false);
  const frequencyPlayerRef = useRef(null);
  const frequencySoundRef = useRef(null);
  const frequencyHumRef = useRef(null);
  const frequencyClockRef = useRef({ phase: "idle", remaining: 0, started: 0 });
  const [arcadeProgress, setArcadeProgress] = useState(() => normalizeArcadeProgress(initialSession?.arcadeProgress || INITIAL_ARCADE_PROGRESS));
  const [storeSceneReady, setStoreSceneReady] = useState(false);
  const [storeGhostLoaded, setStoreGhostLoaded] = useState(false);
  const [storeEvent, setStoreEvent] = useState(null);
  const [storeEventLine, setStoreEventLine] = useState(0);
  const [storeMessage, setStoreMessage] = useState(null);
  const storeEventRef = useRef({ type: null, age: 0 });
  const storeHumRef = useRef(null);
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
  const [studioAnalyzerOpen, setStudioAnalyzerOpen] = useState(false);
  const [studioAnomalyPhase, setStudioAnomalyPhase] = useState("idle");
  const [studioAnomalyStep, setStudioAnomalyStep] = useState(0);
  const studioAnomalyRef = useRef({ phase: "idle", age: 0 });
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
  const [rooftopTransforms, setRooftopTransforms] = useState(loadRooftopTransforms);
  const [lostShipTransforms, setLostShipTransforms] = useState(loadLostShipTransforms);
  const [rooftopProgress, setRooftopProgress] = useState(() => normalizeRooftopProgress(initialSession?.rooftopProgress || INITIAL_ROOFTOP_PROGRESS, initialSession?.studioProgress?.rooftopClueKnown));
  const [rooftopPuzzle, setRooftopPuzzle] = useState(null);
  const [lostShipProgress, setLostShipProgress] = useState(() => normalizeLostShipProgress(initialSession?.lostShipProgress || INITIAL_LOST_SHIP_PROGRESS, initialSession?.rooftopProgress?.missionCompleted));
  const [lostShipPanel, setLostShipPanel] = useState(null);
  const [orbStatus, setOrbStatus] = useState({ phase: "ready", cooldown: 0 });
  const orbApiRef = useRef(null);
  const [lostShipMessage, setLostShipMessage] = useState(null);
  const [lostShipTransition, setLostShipTransition] = useState(false);
  const lostShipEffectRef = useRef(null);
  const lostShipProgressRef = useRef(lostShipProgress);
  lostShipProgressRef.current = lostShipProgress;
  const [parthenonProgress, setParthenonProgress] = useState(() => normalizeParthenonProgress(initialSession?.parthenonProgress, initialSession?.lostShipProgress?.orbReceiverActivated));
  const parthenonProgressRef = useRef(parthenonProgress);
  parthenonProgressRef.current = parthenonProgress;
  const [parthenonPanel, setParthenonPanel] = useState(null);
  const [matrixProgress,setMatrixProgress]=useState(()=>normalizeMatrixProgress(initialSession?.matrixProgress,initialSession?.parthenonProgress?.frequencyFragment02Analyzed));
  const matrixProgressRef=useRef(matrixProgress);matrixProgressRef.current=matrixProgress;
  const [storeInvasionProgress,setStoreInvasionProgress]=useState(()=>normalizeStoreInvasionProgress(initialSession?.storeInvasionProgress,Boolean(initialSession?.matrixProgress?.archiveRead&&(initialSession?.matrixProgress?.returnedHome||initialSession?.scene==="store"))));
  const storeInvasionProgressRef=useRef(storeInvasionProgress);storeInvasionProgressRef.current=storeInvasionProgress;
  const [invasionPanel,setInvasionPanel]=useState(null);
  const [invasionCrateHeld,setInvasionCrateHeld]=useState(false);
  const [invasionNotice,setInvasionNotice]=useState(null);
  const [matrixPanel,setMatrixPanel]=useState(null);
  const [matrixMessage,setMatrixMessage]=useState(null);
  const [matrixCinematic,setMatrixCinematic]=useState(null);
  const [matrixBossStatus,setMatrixBossStatus]=useState({phase:"idle",health:MATRIX_HEALTH.boss,maxHealth:MATRIX_HEALTH.boss,nodes:[false,false,false]});
  const matrixBossHudRef=useRef(null);
  const [matrixTransforms,setMatrixTransforms]=useState(loadMatrixTransforms);
  const matrixTransformsRef=useRef(matrixTransforms);matrixTransformsRef.current=matrixTransforms;
  const matrixAssetApiRef=useRef(null);
  const matrixPlayerRef=useRef(matrixSafePlayerSnapshot(initialSession?.positions?.matrix??null,matrixProgress,matrixTransforms["checkpoint-security"]?.position));
  const [parthenonTransforms, setParthenonTransforms] = useState(loadParthenonTransforms);
  const parthenonTransformsRef = useRef(parthenonTransforms);
  parthenonTransformsRef.current = parthenonTransforms;
  const [parthenonMessage, setParthenonMessage] = useState(null);
  const [parthenonBossStatus, setParthenonBossStatus] = useState({ phase: "idle", health: 6, maxHealth: 6, petrification: 0, phaseNumber: 1 });
  const parthenonBossApiRef = useRef(null);
  const [combatHearts, setCombatHearts] = useState(initialSession?.combatHearts ?? 3);
  const combatHeartsRef = useRef(combatHearts);
  combatHeartsRef.current = combatHearts;
  const [damageTick, setDamageTick] = useState(0);
  const [combatRetryKey, setCombatRetryKey] = useState(0);
  useEffect(()=>{
    if(activeScene!=="matrix")return;
    const safe=matrixSafePlayerSnapshot(matrixPlayerRef.current,matrixProgressRef.current,matrixTransformsRef.current["checkpoint-security"]?.position);
    if(safe===matrixPlayerRef.current)return;
    matrixPlayerRef.current=safe;
    setMatrixMessage("CHECKPOINT / SEGURIDAD");
    setCombatRetryKey(key=>key+1);
  },[activeScene,matrixProgress.eliteDefeated]);
  const combatInvulnerableUntil = useRef(0);
  const parthenonPlayerRef = useRef(initialSession?.positions?.parthenon ?? null);
  const [devCombatSettings, setDevCombatSettings] = useState(() => ({...HOPLITE_CONFIG}));
  const [rooftopMessage, setRooftopMessage] = useState(null);
  const [rooftopPhase, setRooftopPhase] = useState(() => initialSession?.scene === "rooftop" ? !initialSession?.rooftopProgress?.introSeen ? "intro" : initialSession?.rooftopProgress?.frequencyDecoded && !initialSession?.rooftopProgress?.safeReached ? "danger" : initialSession?.rooftopProgress?.safeReached && !initialSession?.rooftopProgress?.anomalySeen ? "anomaly" : "idle" : "idle");
  const [rooftopPhaseAge, setRooftopPhaseAge] = useState(0);
  const rooftopProgressRef = useRef(rooftopProgress);
  rooftopProgressRef.current = rooftopProgress;
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
  const rooftopPlayerRef = useRef(initialSession?.positions?.rooftop ?? null);
  const lostShipPlayerRef = useRef(initialSession?.positions?.["lost-ship"] ?? null);
  const lostShipTransformsRef = useRef(lostShipTransforms);
  lostShipTransformsRef.current = lostShipTransforms;
  const lostShipAssetApiRef = useRef(null);
  const studioTransformsRef = useRef(studioTransforms);
  studioTransformsRef.current = studioTransforms;
  const studioAssetApiRef = useRef(null);
  const arcadeTransformsRef = useRef(arcadeTransforms);
  arcadeTransformsRef.current = arcadeTransforms;
  const arcadeAssetApiRef = useRef(null);
  const rooftopTransformsRef = useRef(rooftopTransforms);
  rooftopTransformsRef.current = rooftopTransforms;
  const rooftopAssetApiRef = useRef(null);
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
  const inventoryItems = useMemo(() => getUniverseInventory({ masterTape, clubQuest, storyProgress, credits, rooftopProgress, lostShipProgress, parthenonProgress, matrixProgress }),
    [masterTape, clubQuest, storyProgress, credits, rooftopProgress, lostShipProgress, parthenonProgress, matrixProgress]);
  const storeInvaded = Boolean(matrixProgress.archiveRead && (matrixProgress.returnedHome || activeScene === "store"));
  const storeAltered = arcadeProgress.recordStoreFutureVisionSeen || storeInvaded;
  const dialogueContext = { masterTape, clubQuest, credits,
    currentSong: currentTrack?.name || (outsideVideo?.playing ? outsideVideo.title : null),
    currentAlbum: currentTrack ? album.name : null, recordStoreAltered: storeAltered,
    storeInvestigation: arcadeProgress, storeInvaded, storeInvasionProgress };
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
    ? getStudioDialogueNode(conversation.nodeId, studioProgress, masterTape, clubQuest, { ghostSeen: arcadeProgress.recordStoreGhostSeen })
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
    ...(studioProgress.rooftopClueKnown ? ["neonboy-rooftop"] : []),
    ...(lostShipProgress.linkActivated ? ["lost-ship"] : []),
    ...(lostShipProgress.orbReceiverActivated ? ["parthenon"] : []),
    ...(parthenonProgress.frequencyFragment02Analyzed ? ["matrix"] : []),
  ])];
  const clubNoticePanel = clubNotice && <div className="club-unlock-notice" role="status">
    <strong>{clubNotice}</strong><button type="button" onClick={() => setClubNotice(null)} aria-label="Cerrar aviso del club">×</button>
  </div>;
  const studioMissionStep = !studioProgress.studioComputerUnlocked ? "Hablá con Hugo sobre la computadora" :
    !studioProgress.computerExplored ? "Explorá una sesión en la PC" :
      !studioProgress.consoleExplored ? "Examiná un canal de la consola" :
        !studioProgress.missionComplete ? "Volvé a hablar con Hugo" : "Misión completada";

  const studioChapterObjective = impossibleRecordingObjective(arcadeProgress.recordStoreGhostSeen, studioProgress);

  function advanceStudioChapter(event) {
    setStudioProgress((progress) => advanceImpossibleRecording(progress, event, arcadeProgressRef.current.recordStoreGhostSeen));
  }

  function commitRooftop(event, payload) {
    const previous = rooftopProgressRef.current;
    const next = advanceRooftopProgress(previous, event, payload);
    rooftopProgressRef.current = next;
    setRooftopProgress(next);
    if (event === "switch" && !next.powerRestored && next.switches.length === 0 && previous.switches.length > 0) setRooftopMessage("El diagrama se reinició. Seguí el orden Luna, Rayo, Antena.");
    if (event === "decode" && next.frequencyDecoded && !previous.frequencyDecoded) {
      setRooftopPuzzle(null);
      setRooftopMessage("SEÑAL IDENTIFICADA · ORIGEN DESCONOCIDO · PATRÓN 09");
      setRooftopPhaseAge(0);
      setRooftopPhase("danger");
    }
    if (event === "collect" && next.transmissionCollected) {
      setRooftopPuzzle(null);
      setRooftopMessage("MISIÓN COMPLETADA · LA TRANSMISIÓN DEL ABISMO · Hugo tiene que ver esto.");
    }
    return next;
  }
  useEffect(() => {
    if (!lostShipTransition) return undefined;
    const timer = window.setTimeout(() => setLostShipTransition(false), 1350);
    return () => window.clearTimeout(timer);
  }, [lostShipTransition]);

  function commitLostShip(event, payload) {
    const before = lostShipProgressRef.current;
    const next = advanceLostShipProgress(before, event, payload);
    lostShipProgressRef.current = next;
    setLostShipProgress(next);
    if (event === "access-open" && next.accessGranted && !before.accessGranted) setLostShipMessage("ACCESO CONCEDIDO · El pasillo central quedó abierto.");
    if (event === "circuit-restore" && next.powerRestored && !before.powerRestored) { lostShipEffectRef.current = { type: "reactor", until: performance.now() + 2600 }; setLostShipMessage("ENERGÍA PRINCIPAL RESTABLECIDA · La pantalla reprodujo un grito distorsionado y se cortó."); }
    if (event === "navigation-restore" && next.navigationRestored && !before.navigationRestored) { lostShipEffectRef.current = { type: "bridge", until: performance.now() + 2600 }; setLostShipMessage("REGISTRO 01 RECUPERADO · Un templo antiguo cruzó las pantallas durante un segundo."); }
    if (event === "archive-open" && next.archiveRecovered && !before.archiveRecovered) setLostShipMessage("PUERTA 01 COMPLETADA - Orbe Neon desbloqueado. El Viajero detectó una cámara de resonancia junto al puente.");
    return next;
  }
  useEffect(() => {
    if (activeScene === "lost-ship" && lostShipProgress.orbUnlocked && !lostShipProgress.orbAnnouncementSeen && !lostShipPanel)
      setLostShipPanel("orb");
  }, [activeScene, lostShipProgress.orbUnlocked, lostShipProgress.orbAnnouncementSeen, lostShipPanel]);
  function onOrbHit(target) {
    if (target.kind === "orb-node") {
      const before = lostShipProgressRef.current;
      const next = commitLostShip("orb-node-hit", target.index);
      if (!before.orbNodes[target.index])
        setLostShipMessage(next.orbDoorOpen ? "TRES NODOS ACTIVOS - La compuerta de la cámara de resonancia se abrió." : "NODO " + (target.index + 1) + " ACTIVO - " + next.orbNodes.filter(Boolean).length + "/3");
    } else if (target.kind === "orb-enemy") {
      const next = commitLostShip("orb-enemy-hit");
      setLostShipMessage(next.orbEnemyDefeated ? "ECO DE FRECUENCIA DISUELTO - El receptor de PUERTA 02 espera una carga." : "ECO IMPACTADO - Resistencia restante: " + next.orbEnemyHealth + "/3");
    } else if (target.kind === "orb-receiver") {
      const before = lostShipProgressRef.current;
      const next = commitLostShip("orb-receiver-hit");
      if (!before.orbReceiverActivated && next.orbReceiverActivated)
        setLostShipMessage("PUERTA 02 - ENLACE ESTABILIZADO. La coordenada quedó registrada en el diario.");
    }
  }
  function commitParthenon(event, payload) {
    const before = parthenonProgressRef.current;
    const next = advanceParthenonProgress(before, event, payload, lostShipProgressRef.current.orbReceiverActivated);
    parthenonProgressRef.current = next;
    setParthenonProgress(next);
    return next;
  }
  function onParthenonEvent(event) {
    const before = parthenonProgressRef.current;
    const next = ["wake", "medusa-seen", "cursed-hoplite-wake", "medusa-start", "medusa-defeat"].includes(event) ? commitParthenon(event) : before;
    if (event === "cursed-hoplite-wake" && !before.cursedHopliteAwake) setParthenonMessage("NEONBOY: Bueno... otra estatua que se mueve. ¡Pará, flaco! ¡Ni siquiera estoy armado! Tengo la pelotita. Algo es algo.");
    if (event === "medusa-start") setParthenonMessage(null);
    if (event === "medusa-phase-2") setParthenonMessage("MEDUSA / FASE 2: se mueve entre los altares y lanza descargas por el suelo.");
    if (event === "medusa-phase-3") setParthenonMessage("MEDUSA / FASE 3: esperá a que termine su mirada y lanzá el Orbe cuando abra la defensa. Podés usar los reflectores para alcanzarla.");
    if (event === "medusa-rejected") setParthenonMessage("El Orbe rebota en su defensa. Esperá a que termine la mirada para atacar.");
    if (event === "medusa-defeat" && !before.medusaBossDefeated) setParthenonMessage("NEONBOY: Bueno... ¡esa sí que fue complicada! Espero que no haya otra hermana esperándome afuera. ¿Qué es eso en el altar?");
    if (event === "wake" && !before.hopliteAwake && next.hopliteAwake)
      setParthenonMessage("NEONBOY: ¿En serio? ¿Ahora las estatuas también me quieren matar? USÁ EL ORBE NEÓN PARA DEFENDERTE.");
    if (event === "medusa-seen" && !before.medusaFirstEncounterSeen && next.medusaFirstEncounterSeen)
      setParthenonMessage("NEONBOY: Estas estatuas son demasiado realistas... No me gusta nada esto.");
  }
  function onParthenonOrbHit(target) {
    const before = parthenonProgressRef.current;
    if (target.kind === "parthenon-destructible") { commitParthenon("urn-hit"); setParthenonMessage("La vasija se quebró bajo la descarga del Orbe."); }
    if (target.kind === "parthenon-enemy") {
      const next = commitParthenon("hoplite-hit");
      setParthenonMessage(next.hopliteHealth === 0 ? "ESTATUA DERROTADA. NEONBOY: Bueno... parece que la pelotita funciona." : "ESTATUA IMPACTADA · resistencia " + next.hopliteHealth + "/" + HOPLITE_CONFIG.health);
    }
    if (target.kind === "parthenon-cursed-hoplite") {
      const next = commitParthenon("cursed-hoplite-hit");
      setParthenonMessage(next.cursedHopliteHealth === 0 ? "NEONBOY: Definitivamente Grecia no era un destino turístico tranquilo." : "HOPLITA MALDITO - resistencia " + next.cursedHopliteHealth + "/4");
    }
    if (target.kind === "parthenon-guardian") {
      const next = commitParthenon("guardian-hit", target.id);
      setParthenonMessage(next.guardianPuzzleCompleted ? "LOS TRES GUARDIANES RESPONDEN · La puerta de piedra se abre." : next.guardianSequence.length === 0 && before.guardianSequence.length > 0 ? "El orden no coincide. El mecanismo se reinició." : "Guardianes: " + next.guardianSequence.length + "/3");
    }
    if (target.kind === "parthenon-mirror" && !target.reflect) {
      const next = commitParthenon("mirror-hit", target.index);
      setParthenonMessage(next.mirrors.every(Boolean) ? "DOS REFLECTORES CARGADOS · Buscá el ángulo para dirigir el Orbe." : "REFLECTOR " + (target.index + 1) + " CARGADO");
    }
    if (target.kind === "parthenon-reflection") {
      const next = commitParthenon("reflection-hit");
      if (next.reflectionPuzzleCompleted) setParthenonMessage("RECEPTOR ACTIVADO · El santuario interior se abre.");
    }
    if (target.kind === "parthenon-seal") {
      const next = commitParthenon("seal-hit", target.id);
      setParthenonMessage(next.templeSealsCompleted ? "TRES SELLOS ACTIVOS · La inscripción del altar despierta." : next.sealSequence.length === 0 && before.sealSequence.length > 0 ? "Los sellos se apagaron. Revisá las tres pistas." : "Sellos: " + next.sealSequence.length + "/3");
    }
  }
  function positionMatrixBossHud({x,y,visible}){
    const node=matrixBossHudRef.current;
    if(!node)return;
    node.style.visibility=visible?'visible':'hidden';
    if(!visible)return;
    const viewportHeight=storeRef.current?.clientHeight||window.innerHeight;
    node.style.left=x+'%';
    node.style.top=Math.min(viewportHeight-55,Math.max(178,y*viewportHeight/100))+'px';
    node.style.transform=x>72?'translate(calc(-100% - 72px), -50%)':'translate(72px, -50%)';
  }
  function commitMatrix(event,value){
    const before=matrixProgressRef.current;
    const next=advanceMatrixProgress(before,event,value,parthenonProgressRef.current.frequencyFragment02Analyzed);
    matrixProgressRef.current=next;setMatrixProgress(next);
    if(event==="bridge-node")setMatrixMessage(next.bridgeOpen?"PUENTE RECONSTRUIDO / El Archivo se abre.":next.bridgeSequence.length?"NODO "+next.bridgeSequence.length+"/3 ACTIVADO":"La secuencia se reinició. Buscá ORIGEN, ECO, ENLACE.");
    if(event==="memory-select")setMatrixMessage(next.memoryOpen?"MEMORIA RECONSTRUIDA / Avanzá al Taller.":next.memorySequence.length?"RECUERDO "+next.memorySequence.length+"/3 REGISTRADO":"Orden incorrecto. Volvé al recital.");
    if(event==="block-move")setMatrixMessage(next.blocksOpen?"LAS PLACAS RESPONDEN / El taller se abre.":"Bloque reubicado. Revisá las placas.");
    if(event==="heavy-hit")setMatrixMessage(next.heavyDefeated?"ROBOT PESADO DERROTADO / El Núcleo se abre.":before.containerOnPlate&&before.coolant.every(Boolean)?"SOBRECARGA / Impacto doble · resistencia "+next.heavyHealth+"/"+MATRIX_HEALTH.heavy:"IMPACTO DEL ORBE / Resistencia "+next.heavyHealth+"/"+MATRIX_HEALTH.heavy+". Los refrigerantes duplican el daño.");
    if(event==="boss-start"&&!before.bossStarted&&next.bossStarted)setMatrixCinematic("intro");
    if((event==="boss-hit"||event==="boss-node")&&next.bossDefeated&&!before.bossDefeated)setMatrixCinematic("defeat");
    if(event==="boss-hit")setMatrixMessage(next.bossDefeated?"NEON EVIL DERROTADO / Consultá el Archivo Central.":"NEON EVIL · resistencia "+next.bossHealth+"/"+MATRIX_HEALTH.boss);
    if(event==="boss-node")setMatrixMessage(next.bossDefeated?"NEON EVIL DERROTADO / Consultá el Archivo Central.":"NÚCLEOS "+next.bossNodes.filter(Boolean).length+"/3 · Neon Evil "+next.bossHealth+"/"+MATRIX_HEALTH.boss);
    if(event==="enemy-defeat")setMatrixMessage("HOSTIL NEUTRALIZADO / "+(value?.startsWith("drone-")?"CENTINELA 09":value));
    if(event==="drone-alarm"&&!before.droneAlarm)setMatrixMessage("ALARMA DE CENTINELA 09 / Seguridad detectó tu presencia.");
    if(event==="archive-read")setMatrixMessage("NUEVA MISIÓN / Investigá la corrupción que alcanzó Buenos Aires.");
    return next;
  }
  function commitInvasion(event,value){
    if(event==="feedback"){setInvasionNotice(value);return storeInvasionProgressRef.current;}
    const before=storeInvasionProgressRef.current;
    const next=advanceStoreInvasion(before,event,value,Boolean(matrixProgressRef.current.archiveRead));
    storeInvasionProgressRef.current=next;setStoreInvasionProgress(next);
    if(event==="juke-hit"&&next.jukeboxOff&&!before.jukeboxOff)setInvasionNotice("FOCO 01 DESACTIVADO / La rockola vuelve a sonar sin interferencia.");
    if(event==="archive-node")setInvasionNotice(next.archiveOff?"FOCO 02 DESACTIVADO / NEONBOY: ¡Otra vez vos! Esta vez tengo con qué defenderme.":next.conductors.length?"CONDUCTOR "+next.conductors.length+"/3 RESTAURADO":"Secuencia incorrecta. Segú la flecha del panel.");
    if(event==="ghost-hit")setInvasionNotice(next.ghostDefeated?"NEONBOY: ¡La pelotita sigue funcionando! El fantasma se disipó.":"APARICIÓN / Resistencia "+next.ghostHealth+"/3");
    if(event==="emitter-hit")setInvasionNotice(next.transmissionOff?"FOCO 03 DESACTIVADO / NÚCLEO PRINCIPAL DETECTADO":next.emitters.length?"EMISOR "+next.emitters.length+"/3 RESTAURADO":"El orden se interrumpió. Revisá la inscripción.");
    if(event==="generator-hit")setInvasionNotice("GENERADORES / "+next.generators.filter(Boolean).length+"/2 DESACTIVADOS");
    if(event==="boss-hit")setInvasionNotice(next.bossDefeated?"ENTIDAD CORRUPTA DERROTADA / Consultá el núcleo.":next===before||next.bossHealth===before.bossHealth?"ESCUDO ACTIVO / Esperá el pulso fucsia.":"ENTIDAD / Resistencia "+next.bossHealth+"/5");
    if(event==="core-read")setInvasionNotice("SEÑAL LOCAL DESACTIVADA / CORRUPCIÓN GLOBAL ACTIVA");
    return next;
  }
  useEffect(()=>{
    if(activeScene!=="store"||!storeInvaded)return;
    if(!storeInvasionProgressRef.current.started)commitInvasion("enter");
    if(storeSceneReady&&!storeInvasionProgressRef.current.introSeen&&!storeEvent&&!paused&&!mapOpen&&!conversation&&!jukeboxOpen&&!invasionPanel)beginStoreEvent("invasion");
  },[activeScene,storeInvaded,storeSceneReady,storeInvasionProgress.introSeen,storeEvent,paused,mapOpen,conversation,jukeboxOpen,invasionPanel]);
  useEffect(()=>{if(!invasionNotice)return;const timer=window.setTimeout(()=>setInvasionNotice(null),4300);return()=>window.clearTimeout(timer);},[invasionNotice]);
  useEffect(()=>{if(!matrixCinematic)return;const timer=window.setTimeout(()=>setMatrixCinematic(null),matrixCinematic==="intro"?4500:3200);return()=>window.clearTimeout(timer);},[matrixCinematic]);
  function examineMatrix(id){
    const p=matrixProgressRef.current;
    if(id==="nex9")commitMatrix("nex-meet");
    if(id==="sentinel")commitMatrix("sentinel-meet");
    if(id==="memoryFragment"&&(!p.memoryOpen||p.memoryFragment))return;
    if(id==="module"&&(!p.blocksOpen||p.moduleTaken))return;
    if(id==="evidence"&&(!p.heavyDefeated||p.evidenceFound))return;
    if(id==="exitPortal"&&!p.archiveRead)return;
    setMatrixPanel(id);
  }
  function changeMatrixTransforms(next){setMatrixTransforms(next);matrixTransformsRef.current=next;for(const [id,transform] of Object.entries(next))matrixAssetApiRef.current?.apply(id,transform);}
  function onCombatDamage(amount = 1) {
    if (paused) return;
    const damage = receiveCombatDamage(combatHeartsRef.current, combatInvulnerableUntil.current, performance.now(), amount);
    if (!damage) return;
    combatInvulnerableUntil.current = damage.invulnerableUntil;
    const health = damage.hearts;
    combatHeartsRef.current = health;
    setCombatHearts(health);
    setDamageTick(tick => tick + 1);
    if (health === 0 && document.pointerLockElement) document.exitPointerLock();
  }
  function retryCombat() {
    combatHeartsRef.current = 3; setCombatHearts(3);
    combatInvulnerableUntil.current = performance.now() + 1800;
    if(activeScene==="store" && storeInvaded){
      commitInvasion("retry");
      storePlayerRef.current={x:0,z:storeInvasionProgressRef.current.transmissionOff?-5.5:-2,yaw:Math.PI,viewYaw:0};
      setInvasionPanel(null);setInvasionCrateHeld(false);setCombatRetryKey(key=>key+1);return;
    }
    if(activeScene==="matrix"){
      const progress=commitMatrix('retry');
      const checkpoint=matrixSafeCheckpoint(progress);
      if(checkpoint!==matrixProgressRef.current.checkpoint){
        const repaired={...matrixProgressRef.current,checkpoint};
        matrixProgressRef.current=repaired;setMatrixProgress(repaired);
      }
      const position=matrixTransformsRef.current["checkpoint-"+checkpoint]?.position||[0,0,20];
      matrixPlayerRef.current={x:position[0],z:position[2],yaw:Math.PI,viewYaw:0};
      setMatrixMessage("CHECKPOINT / "+checkpoint.toUpperCase());
      setCombatRetryKey(key=>key+1);return;
    }
    if (activeScene === "parthenon") {
      const p = parthenonProgressRef.current;
      if (p.medusaEncounterSeen && !p.medusaBossDefeated && parthenonBossApiRef.current) {
        parthenonBossApiRef.current.retry();
        setParthenonMessage("CHECKPOINT / SANTUARIO DE MEDUSA");
        return;
      }
      commitParthenon("retry");
      parthenonPlayerRef.current = {x:0,z:5,yaw:Math.PI,viewYaw:0};
      setParthenonMessage("CHECKPOINT / PATIO DE LOS GUARDIANES");
    } else {
      commitLostShip("orb-enemy-reset");
      lostShipPlayerRef.current = {x:12,z:-16,yaw:Math.PI,viewYaw:0};
      setLostShipMessage("CHECKPOINT / CÁMARA DE RESONANCIA");
    }
    setCombatRetryKey(key => key + 1);
  }
  function restartMatrixForTesting() {
    if (!import.meta.env.DEV || activeScene !== "matrix") return;
    const freshProgress = advanceMatrixProgress(MATRIX_INITIAL, "enter", true);
    matrixProgressRef.current = freshProgress;
    setMatrixProgress(freshProgress);
    matrixPlayerRef.current = { x: 0, z: MATRIX_LAYOUT.spawnZ, yaw: Math.PI, viewYaw: 0 };
    combatHeartsRef.current = 3;
    setCombatHearts(3);
    combatInvulnerableUntil.current = performance.now() + 1800;
    setMatrixPanel(null);
    setMatrixCinematic(null);
    setMatrixBossStatus({ phase: "idle", health: MATRIX_HEALTH.boss, maxHealth: MATRIX_HEALTH.boss, nodes: [false, false, false] });
    setMatrixMessage("PUERTA 03 REINICIADA / Empezá desde la Ciudad Incompleta.");
    setOrbStatus({ phase: "ready", cooldown: 0 });
    setNearby(null);
    setFirstPerson(false);
    setJumping(false);
    setDamageTick(0);
    setCombatRetryKey(key => key + 1);
  }
  function examineParthenon(id) {
    const p = parthenonProgressRef.current;
    if (id === "guardianInscription") commitParthenon("guardian-clue");
    if (id === "courtRecord") commitParthenon("seal-clue", "court");
    if (id === "reflectorRecord") commitParthenon("seal-clue", "reflector");
    if (id === "sanctuaryRecord") commitParthenon("seal-clue", "sanctuary");
    if (id === "frequencyFragment02") {
      if (!p.frequencyFragment02Collected) { commitParthenon("fragment-collect"); setParthenonMessage("NEONBOY: Esto tiene el mismo símbolo que las otras puertas. Mejor llevarlo a la nave. FRAGMENTO DE FRECUENCIA 02 OBTENIDO."); }
      return;
    }
    if (id === "sanctuaryAltar" && p.altarRead && p.cursedHopliteHealth === 0 && !p.medusaBossDefeated) {
      if (parthenonBossApiRef.current?.start()) { setParthenonPanel(null); return; }
    }
    if (id === "sanctuaryAltar" && p.templeSealsCompleted && p.medusaFirstEncounterSeen) commitParthenon("altar-read");
    setParthenonPanel(id);
  }
  function changeParthenonTransforms(next) {
    parthenonTransformsRef.current = next;
    setParthenonTransforms(next);
    for (const [id, transform] of Object.entries(next)) parthenonBossApiRef.current?.apply(id, transform);
  }
  function closeLostShipPanel() {
    if (lostShipPanel === "orb") commitLostShip("orb-acknowledge");
    setLostShipPanel(null);
  }
  function examineLostShip(id) {
    const progress = lostShipProgressRef.current;
    if (id === "returnPortal") { setLostShipPanel("return"); return; }
    if (id === "arrivalLog") { commitLostShip("access-log"); setLostShipPanel("journal"); return; }
    if (id === "arrivalConsole" || id === "accessPanel") { setLostShipPanel("access"); return; }
    if (!progress.accessGranted) { setLostShipMessage("La compuerta de llegada sigue cerrada. Buscá el registro y descifrá el acceso."); return; }
    if (id === "corridorSign") {
      commitLostShip("locker-clue", "sign");
      if (!progress.eventsSeen.includes("corridor")) {
        commitLostShip("event", "corridor");
        lostShipEffectRef.current = { type: "corridor", until: performance.now() + 2400 };
        setLostShipMessage("La luz del pasillo se apagó. Un golpe sonó detrás de una compuerta, pero no hay nadie.");
      }
      setLostShipPanel("journal"); return;
    }
    if (id === "corridorWindow") {
      if (!progress.eventsSeen.includes("window")) {
        commitLostShip("event", "window");
        lostShipEffectRef.current = { type: "window", until: performance.now() + 2500 };
        setLostShipMessage("Una silueta imposible se recorta contra el vacío. Al mirar otra vez, desapareció.");
      } else setLostShipMessage("Solo se ven las nubes violetas del vacío dimensional.");
      return;
    }
    if (id === "corridorMonitor") { commitLostShip("locker-clue", "monitor"); setLostShipPanel("journal"); return; }
    if (id === "reactor") { commitLostShip("reactor-examine"); setLostShipPanel("circuit"); return; }
    if (id === "circuit") { setLostShipPanel("circuit"); return; }
    if (id === "reactorLog") { commitLostShip("navigation-clue", "reactor"); setLostShipPanel("journal"); return; }
    if (id === "moduleCrate") {
      if (!progress.moduleTaken) {
        commitLostShip("module-take");
        setLostShipMessage("MÓDULO ENERGÉTICO OBTENIDO · Examiná el reactor y usalo desde el inventario.");
      } else setLostShipMessage("El contenedor de mantenimiento está vacío.");
      return;
    }
    if (id === "storageLog") {
      commitLostShip("locker-clue", "log");
      commitLostShip("navigation-clue", "storage");
      setLostShipPanel("journal"); return;
    }
    if (id === "locker") { setLostShipPanel("locker"); return; }
    if (id === "lifeSupport") { setLostShipPanel("life"); return; }
    if (id === "bridgeDoor") {
      if (!progress.powerRestored) setLostShipMessage("La puerta del puente necesita energía principal. Restaurá el reactor primero.");
      else if (!progress.lifeStable) setLostShipMessage("La energía ya funciona. Falta equilibrar los reguladores en D / Soporte vital y pulsar Estabilizar soporte vital.");
      else if (!progress.lockerOpened) setLostShipMessage("Falta la tarjeta del armario de seguridad.");
      else if (!progress.bridgeCardUsed) setLostShipMessage("Acercate a la puerta y usá la tarjeta desde el inventario.");
      else setLostShipMessage("La puerta del puente ya está abierta.");
      return;
    }
    if (!progress.bridgeCardUsed) { setLostShipMessage("El puente de mando sigue cerrado."); return; }
    if (id === "navigation") { commitLostShip("navigation-clue", "bridge"); setLostShipPanel(parthenonProgressRef.current.frequencyFragment02Collected ? "fragment02" : "navigation"); return; }
    if (id === "traveler") { setLostShipPanel("traveler"); return; }
    if (id === "memory") {
      if (!progress.navigationRestored) setLostShipMessage("La cápsula de memoria no responde. Restaurá la navegación primero.");
      else if (!progress.memoryTaken) { commitLostShip("memory-take"); setLostShipMessage("FRAGMENTO DE MEMORIA obtenido. Usalo en el archivo desde el inventario."); }
      else setLostShipMessage("Ya recuperaste el fragmento de memoria.");
      return;
    }
    if (id === "orbReceiver") {
      if (!progress.orbDoorOpen) setLostShipMessage("Reactivá los tres nodos con el Orbe Neon.");
      else if (!progress.orbEnemyDefeated) setLostShipMessage("El eco de frecuencia interfiere con el receptor.");
      else if (!progress.orbReceiverActivated) setLostShipMessage("Lanzale el Orbe Neon al cristal para estabilizar PUERTA 02.");
      else setLostShipPanel("door02");
      return;
    }
    if (id === "archive") { setLostShipPanel("archive"); return; }
  }
  function changeLostShipTransforms(next) {
    lostShipTransformsRef.current = next;
    setLostShipTransforms(next);
    for (const [id, transform] of Object.entries(next)) lostShipAssetApiRef.current?.apply(id, transform);
  }
  function examineRooftop(id) {
    if (rooftopPhase === "danger" && id !== "safeZone") return;
    if (id === "stairDoor") { openMap(); return; }
    if (id === "safeZone") {
      if (rooftopPhase === "danger") {
        commitRooftop("safe");
        setRooftopPhaseAge(0);
        setRooftopPhase("anomaly");
      } else setRooftopMessage("La franja verde marca un lugar protegido de la antena.");
      return;
    }
    if (id === "powerPanel") { commitRooftop("explore"); commitRooftop("panel"); setRooftopPuzzle("power"); return; }
    if (id === "mainAntenna") { if (lostShipProgressRef.current.signalDecoded) { setLostShipPanel("link"); return; } setRooftopPuzzle("antenna"); return; }
    if (id === "receiver") { setRooftopPuzzle("receiver"); return; }
    setRooftopMessage(id === "waterTank" ? "El tanque de agua retumba con cada trueno." : "Equipo de mantenimiento de finales de los 90.");
  }
  function changeRooftopTransforms(next) {
    rooftopTransformsRef.current = next;
    setRooftopTransforms(next);
    for (const [id, transform] of Object.entries(next)) rooftopAssetApiRef.current?.apply(id, transform);
  }
  useEffect(() => {
    if (activeScene !== "rooftop" || paused || mapOpen || inventoryOpen) return undefined;
    let age = 0;
    const timer = window.setInterval(() => {
      const pos = rooftopPlayerRef.current;
      const progress = rooftopProgressRef.current;
      if (rooftopPhase === "idle") {
        if (progress.introSeen && !progress.explored && pos && Math.hypot(pos.x, pos.z - 8.1) > 3.5) commitRooftop("explore");
        return;
      }
      age += .1;
      setRooftopPhaseAge(age);
      if (rooftopPhase === "intro" && age >= 7) { commitRooftop("intro"); setRooftopPhase("idle"); }
      if (rooftopPhase === "danger") {
        const safe = rooftopTransformsRef.current.safeZone?.position || [-7.4, 0, .1];
        if (pos && Math.hypot(pos.x - safe[0], pos.z - safe[2]) < 1.7) {
          commitRooftop("safe");
          setRooftopPhase("anomaly");
        } else if (age >= 12) {
          rooftopAssetApiRef.current?.teleport(safe[0], safe[2]);
          commitRooftop("safe");
          setRooftopMessage("La descarga te obligó a retroceder a una zona protegida.");
          setRooftopPhase("anomaly");
        }
      }
      if (rooftopPhase === "anomaly" && age >= 11) {
        commitRooftop("anomaly");
        setRooftopPhase("idle");
        setRooftopMessage("El receptor volvió a encenderse. Investigá la transmisión.");
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [activeScene, rooftopPhase, paused, mapOpen, inventoryOpen]);

  gameSnapshotRef.current = () => ({
    scene: activeScene === "frequency" ? "arcade" : activeScene, credits: creditsRef.current, selectedId, activeGroup,
    storyProgress, studioProgress, masterTape, clubQuest, rikyProgress, friendsProgress, arcadeProgress, rooftopProgress, lostShipProgress, parthenonProgress, matrixProgress, storeInvasionProgress, combatHearts, mapUnlocks: unlockedScenarios,
    positions: { store: storePlayerRef.current, studio: studioPlayerRef.current, club: clubPlayerRef.current, arcade: arcadePlayerRef.current, rooftop: rooftopPlayerRef.current, "lost-ship": lostShipPlayerRef.current, parthenon: parthenonPlayerRef.current, matrix: matrixPlayerRef.current },
  });
  function advanceStoreStep(event) {
    const next = advanceStoreInvestigation(arcadeProgressRef.current, event);
    if (next !== arcadeProgressRef.current) {
      arcadeProgressRef.current = next;
      setArcadeProgress(next);
    }
  }
  function beginStoreEvent(type) {
    if (storeEventRef.current.type || pausedRef.current || mapOpen) return;
    storeEventRef.current = { type, age: 0 };
    setStoreEventLine(0);
    setStoreEvent(type);
  }
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
  }, [onAutosave, activeScene, credits, selectedId, activeGroup, storyProgress, studioProgress, masterTape, clubQuest, rikyProgress, friendsProgress, arcadeProgress, rooftopProgress, lostShipProgress, parthenonProgress, matrixProgress, storeInvasionProgress, mapUnlocks]);
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
  useEffect(() => {
    if (activeScene !== "store" || !storeAltered || arcadeProgress.recordStoreRevisitedAfterVision) return;
    const next = revisitStoreAfterVision(arcadeProgressRef.current);
    arcadeProgressRef.current = next;
    setArcadeProgress(next);
  }, [activeScene, storeAltered, arcadeProgress.recordStoreRevisitedAfterVision]);
  useEffect(() => {
    if (activeScene !== "store" || !storeAltered || storeInvaded || !storeSceneReady || paused || mapOpen ||
      inventoryOpen || conversation || jukeboxOpen || archiveOpen || sessionsOpen || storeEvent || storeMessage) return;
    if (!arcadeProgress.recordStoreAlteredIntroSeen) beginStoreEvent("intro");
    else if (arcadeProgress.recordStoreTitoInterviewed && !arcadeProgress.recordStoreJukeboxAnomalySeen &&
      nearby?.kind === "jukebox") beginStoreEvent("jukebox");
    else if (storeGhostLoaded && arcadeProgress.recordStoreAlteredIntroSeen &&
      arcadeProgress.recordStoreTitoInterviewed && arcadeProgress.recordStoreJukeboxAnomalySeen &&
      arcadeProgress.recordStoreStrangeRecordSeen && arcadeProgress.recordStoreReverseClueKnown &&
      !arcadeProgress.recordStoreGhostSeen)
      beginStoreEvent("ghost");
  }, [activeScene, storeAltered, storeInvaded, storeSceneReady, paused, mapOpen, inventoryOpen, conversation,
    jukeboxOpen, archiveOpen, sessionsOpen, storeEvent, storeMessage, nearby, arcadeProgress, storeGhostLoaded]);
  useEffect(() => {
    if (!storeEvent || activeScene !== "store") return undefined;
    if (storeEventRef.current.type !== storeEvent) storeEventRef.current = { type: storeEvent, age: 0 };
    let frame;
    let last = performance.now();
    const duration = { intro: 5.1, jukebox: 3.5, ghost: 4.5, invasion: 6.3 }[storeEvent];
    const tick = (now) => {
      if (!pausedRef.current && !mapOpen) {
        storeEventRef.current.age += Math.min(1, Math.max(0, (now - last) / 1000));
        const line = storeEvent === "invasion" ? Math.min(2, Math.floor(storeEventRef.current.age / 2.1)) : storeEvent === "intro" ? Math.min(2, Math.floor(storeEventRef.current.age / 1.65)) :
          storeEvent === "ghost" ? (storeEventRef.current.age >= 3.75 ? 2 : Number(storeEventRef.current.age >= 1.7)) : 0;
        setStoreEventLine((previous) => previous === line ? previous : line);
      }
      last = now;
      if (storeEventRef.current.age >= duration) {
        if (storeEvent === "invasion") commitInvasion("intro"); else advanceStoreStep(storeEvent);
        storeEventRef.current = { type: null, age: 0 };
        setStoreEvent(null);
        if (storeEvent === "ghost") setStoreMessage({
          title: "LA PISTA PARA HUGO",
          lines: ["Había algo ahí. Y no parecía de este mundo.",
            "Una frecuencia extraña, grabaciones imposibles y un mensaje para reproducir algo al revés...",
            "Creo que Hugo puede ayudarme con esto."],
        });
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [storeEvent, activeScene, mapOpen]);
  useEffect(() => {
    if (activeScene === "store") return;
    storeEventRef.current = { type: null, age: 0 };
    setStoreEvent(null);
    setStoreSceneReady(false);
    setStoreGhostLoaded(false);
    setStoreMessage(null);
    setInvasionPanel(null);setInvasionCrateHeld(false);setInvasionNotice(null);
  }, [activeScene]);
  useEffect(() => {
    if (activeScene !== "store" || !storeAltered || paused) return undefined;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return undefined;
    const context = new AudioContext();
    const hum = context.createOscillator(), gain = context.createGain();
    hum.type = "sine"; hum.frequency.value = 86;
    gain.gain.value = .0025;
    hum.connect(gain).connect(context.destination);
    hum.start();
    context.resume().catch(() => {});
    storeHumRef.current = context;
    return () => {
      hum.stop();
      context.close().catch(() => {});
      if (storeHumRef.current === context) storeHumRef.current = null;
    };
  }, [activeScene, storeAltered, paused]);
  useEffect(() => {
    const context = storeHumRef.current;
    if (!storeEvent || !context || context.state === "closed") return undefined;
    const source = context.createOscillator(), gain = context.createGain();
    source.type = storeEvent === "jukebox" ? "sawtooth" : "triangle";
    source.frequency.setValueAtTime(storeEvent === "invasion" ? 55 : storeEvent === "ghost" ? 68 : storeEvent === "jukebox" ? 390 : 115, context.currentTime);
    if (storeEvent === "jukebox") source.frequency.exponentialRampToValueAtTime(78, context.currentTime + .65);
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.018, context.currentTime + .04);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .75);
    source.connect(gain).connect(context.destination);
    source.start();
    source.stop(context.currentTime + .78);
    let staticNoise = null;
    let staticFilter = null;
    let staticGain = null;
    if (storeEvent === "ghost" || storeEvent === "invasion") {
      const length = Math.floor(context.sampleRate * .42);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < length; index++) samples[index] = Math.random() * 2 - 1;
      staticNoise = context.createBufferSource();
      staticFilter = context.createBiquadFilter();
      staticGain = context.createGain();
      staticNoise.buffer = buffer;
      staticFilter.type = "bandpass";
      staticFilter.frequency.value = 480;
      staticFilter.Q.value = .55;
      staticGain.gain.setValueAtTime(.0001, context.currentTime);
      staticGain.gain.linearRampToValueAtTime(.014, context.currentTime + .04);
      staticGain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .42);
      staticNoise.connect(staticFilter).connect(staticGain).connect(context.destination);
      staticNoise.start();
      staticNoise.stop(context.currentTime + .42);
    }
    return () => {
      try { source.stop(); } catch { /* Already stopped. */ }
      try { staticNoise?.stop(); } catch { /* Already stopped. */ }
      source.disconnect(); gain.disconnect();
      staticNoise?.disconnect(); staticFilter?.disconnect(); staticGain?.disconnect();
    };
  }, [storeEvent]);
  useEffect(() => { if (!standalone) closeRef.current?.focus(); }, [standalone]);
  useEffect(() => {

    const onKeyDown = (event) => {
      if (combatHearts === 0 && (activeScene === "lost-ship" || activeScene === "parthenon" || activeScene === "matrix" || (activeScene === "store" && storeInvaded))) return;
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
        (inventoryOpen || (frequencyPhase === "idle" && !paused && !gameOpen && !mapOpen && !conversation && !jukeboxOpen && !archiveOpen && !sessionsOpen && !studioWorkbench && !studioAnalyzerOpen && studioAnomalyPhase === "idle" && !studioMessage && !clubMessage && !arcadeMessage && !parthenonPanel && !invasionPanel))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (inventoryOpen) closeInventory(); else openInventory();
        return;
      }
      if (event.code === "KeyM" && frequencyPhase === "idle" && !gameOpen && !paused && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "") && !event.target?.isContentEditable && (mapOpen || (!inventoryOpen && !jukeboxOpen && !conversation && !archiveOpen && !sessionsOpen && !studioWorkbench && !studioAnalyzerOpen && studioAnomalyPhase === "idle" && !parthenonPanel && !invasionPanel))) {
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
        else if (studioAnalyzerOpen) { setStudioAnalyzerOpen(false); setStudioWorkbench("computer"); }
        else if (studioWorkbench) setStudioWorkbench(null);
        else if (clubMessage) setClubMessage(null);
        else if (arcadeMessage) setArcadeMessage(null);
        else if (rooftopPuzzle) setRooftopPuzzle(null);
        else if (lostShipPanel) closeLostShipPanel();
        else if (parthenonPanel) setParthenonPanel(null);
        else if (matrixPanel) setMatrixPanel(null);
        else if (invasionPanel) setInvasionPanel(null);
        else if (studioMessage) setStudioMessage(null);
        else if (conversation) closeConversation();
        else if (jukeboxOpen) closeJukebox();
        else if (onPause) onPause(true);
        else if (activeScene === "studio" || activeScene === "club" || activeScene === "arcade" || activeScene === "rooftop" || activeScene === "lost-ship" || activeScene === "parthenon" || activeScene === "matrix") openMap();
        else onClose?.();
      }
      if (event.key === "Tab" && !paused) {
        const focusRoot = gameOpen ? storeRef.current?.querySelector(".orbit-duel-cabinet") : inventoryOpen ? storeRef.current?.querySelector(".universe-inventory") : mapOpen ? storeRef.current?.querySelector(".universe-map") : jukeboxOpen ? storeRef.current?.querySelector(".record-jukebox") : sessionsOpen ? storeRef.current?.querySelector(".neon-sessions-archive") : archiveOpen ? storeRef.current?.querySelector(".record-store-archive") : invasionPanel ? storeRef.current?.querySelector(".store-invasion-panel") : conversation ? storeRef.current?.querySelector(".record-store-conversation") : studioAnalyzerOpen ? storeRef.current?.querySelector(".studio-signal-analyzer") : studioWorkbench ? storeRef.current?.querySelector(".studio-workbench") : storeRef.current;
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
  }, [onClose, standalone, jukeboxOpen, activeVideoIndex, conversation, archiveOpen, sessionsOpen, studioWorkbench, studioAnalyzerOpen, studioAnomalyPhase, clubMessage, arcadeMessage, studioMessage, mapOpen, inventoryOpen, activeScene, paused, onPause, concertPhase, gameOpen, frequencyPhase, rooftopPuzzle, lostShipPanel, parthenonPanel, invasionPanel, storeInvaded, combatHearts]);
  useEffect(() => {
    if (studioAnomalyPhase !== "active" || activeScene !== "studio") return;
    let frame = 0;
    let last = performance.now();
    let reported = -1;
    let ended = false;
    let audioContext = null;
    let hum = null;
    let gain = null;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContext = new AudioContext();
        hum = audioContext.createOscillator();
        gain = audioContext.createGain();
        hum.type = "sawtooth";
        hum.frequency.value = 54;
        gain.gain.value = 0;
        hum.connect(gain).connect(audioContext.destination);
        hum.start();
      }
    } catch { audioContext = null; }
    const tick = (now) => {
      const delta = Math.min(.1, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) {
        const age = Math.min(12, studioAnomalyRef.current.age + delta);
        studioAnomalyRef.current = { phase: "active", age };
        const step = age < 2.6 ? 0 : age < 5.1 ? 1 : age < 7.8 ? 2 : age < 10.2 ? 3 : 4;
        if (step !== reported) { reported = step; setStudioAnomalyStep(step); }
        if (gain && audioContext) {
          gain.gain.setTargetAtTime(age > 2 && age < 10 ? .008 + .006 * Math.sin(age * 8) ** 2 : 0, audioContext.currentTime, .06);
        }
        if (age >= 12 && !ended) {
          ended = true;
          studioAnomalyRef.current = { phase: "idle", age: 0 };
          advanceStudioChapter("anomaly");
          setStudioAnomalyPhase("idle");
          setConversation({ npc: "hugo", nodeId: "chapter6:after", lastChoice: "" });
          return;
        }
      } else if (gain && audioContext) gain.gain.setTargetAtTime(0, audioContext.currentTime, .03);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      try { hum?.stop(); } catch { /* Already ended. */ }
      hum?.disconnect(); gain?.disconnect();
      audioContext?.close().catch(() => {});
      if (!ended) studioAnomalyRef.current = { phase: "idle", age: 0 };
    };
  }, [studioAnomalyPhase, activeScene]);
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
  useEffect(() => { if ((paused || jukeboxOpen || conversation || archiveOpen || sessionsOpen || studioWorkbench || studioAnalyzerOpen || studioAnomalyPhase === "active" || mapOpen || inventoryOpen) && document.pointerLockElement) document.exitPointerLock(); }, [paused, jukeboxOpen, conversation, archiveOpen, sessionsOpen, studioWorkbench, studioAnalyzerOpen, studioAnomalyPhase, mapOpen, inventoryOpen]);
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
            ? "Algo interrumpió el final del show. Hablá con Riky."
            : "La señal volvió a interrumpir el final del show.");
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
    if (inventoryOpen || studioAnalyzerOpen || lostShipPanel || parthenonPanel || combatHearts === 0 || studioAnomalyPhase === "active" || frequencyPhaseRef.current !== "idle") return;
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
    if (gameOpen || paused || mapOpen || parthenonPanel || combatHearts === 0 || conversation || jukeboxOpen || archiveOpen || sessionsOpen || studioWorkbench || lostShipPanel || studioMessage || clubMessage || arcadeMessage) return;
    inventoryReturnFocusRef.current = document.activeElement;
    if (document.pointerLockElement) document.exitPointerLock();
    setInventoryOpen(true);
  }

  function closeInventory(restoreFocus = true) {
    setInventoryOpen(false);
    if (restoreFocus) requestAnimationFrame(() => inventoryReturnFocusRef.current?.focus?.());
  }

  function useInventoryAction(actionId) {
    const context = { scene: activeScene, nearby, masterTape, clubQuest, lostShipProgress };
    if (!inventoryItems.some((item) => getUniverseInventoryAction(item, context)?.id === actionId)) return;
    closeInventory(false);
    if (actionId === "give-tape") setConversation({ npc: "hugo", nodeId: "master:hugo-tape", lastChoice: "" });
    if (actionId === "give-master") setConversation({ npc: "tito", nodeId: "master:tito-return", lastChoice: "" });
    if (actionId === "present-credential") {
      setClubQuest((progress) => advanceClubShowQuest(progress, "charlyAuthorizes", masterTape));
      setConversation({ npc: "charly", nodeId: "credential", lastChoice: "" });
    }
    if (actionId === "ship-module-use") { commitLostShip("module-use"); setLostShipMessage("El módulo encajó. Ajustá la distribución desde el panel del reactor."); }
    if (actionId === "ship-card-use") { commitLostShip("card-use"); setLostShipMessage("La tarjeta abrió el puente de mando."); }
    if (actionId === "ship-memory-use") { commitLostShip("memory-use"); setLostShipPanel("archive"); }
    if (actionId === "open-jukebox") openJukebox();
    if (actionId === "open-archive") setArchiveOpen(true);
    if (actionId === "open-sessions") setSessionsOpen(true);
  }

  function enterScenario(destination) {
    if (frequencyPhaseRef.current !== "idle") return;
    if (concertPhase !== "idle") stopConcert();
    setStudioAnalyzerOpen(false);
    setStudioAnomalyPhase("idle");
    studioAnomalyRef.current = { phase: "idle", age: 0 };
    setSessionsOpen(false);
    setClubMessage(null);
    setArcadeMessage(null);
    setArcadeGameId(null);
    setRooftopPuzzle(null);
    setLostShipPanel(null);
    setLostShipMessage(null);
    setParthenonPanel(null); setParthenonMessage(null);setMatrixPanel(null);setMatrixMessage(null);setMatrixCinematic(null); setParthenonBossStatus({ phase: "idle", health: 6, maxHealth: 6, petrification: 0, phaseNumber: 1 });
    combatHeartsRef.current = 3; setCombatHearts(3);
    if (activeScene === "rooftop") setRooftopPhase("idle");
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
    } else if (destination === "neonboy-rooftop") {
      setNearby(null); setFirstPerson(false); setJumping(false);
      const p = rooftopProgressRef.current;
      setRooftopPhase(!p.introSeen ? "intro" : p.frequencyDecoded && !p.safeReached ? "danger" : p.safeReached && !p.anomalySeen ? "anomaly" : "idle");
      setRooftopPhaseAge(0);
      setActiveScene("rooftop");
    } else if (destination === "lost-ship") {
      if (!lostShipProgressRef.current.linkActivated) { closeMap(); return; }
      setNearby(null); setFirstPerson(false); setJumping(false);
      if (!lostShipProgressRef.current.arrivalSeen) { commitLostShip("arrive"); setLostShipPanel("arrival"); setLostShipTransition(true); }
      setActiveScene("lost-ship");
    } else if (destination === "parthenon") {
      if (!lostShipProgressRef.current.orbReceiverActivated) { closeMap(); return; }
      commitParthenon("enter");
      setNearby(null); setFirstPerson(false); setJumping(false);
      setLostShipTransition(true);
      setActiveScene("parthenon");
    } else if(destination==="matrix"){
      if(!parthenonProgressRef.current.frequencyFragment02Analyzed){closeMap();return;}
      commitMatrix("enter");setNearby(null);setFirstPerson(false);setJumping(false);setActiveScene("matrix");
    } else if (destination === "discography") {
      if(matrixProgressRef.current.archiveRead)commitMatrix("return-home");
      if (arcadeProgressRef.current.recordStoreFutureVisionSeen &&
          !arcadeProgressRef.current.recordStoreAlteredIntroSeen) storePlayerRef.current = null;
      setStoreSceneReady(false);
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
      if (lostShipProgressRef.current.hugoBriefed && !lostShipProgressRef.current.signalDecoded) { setStudioWorkbench(null); setLostShipPanel("signal"); return; }
      if (arcadeProgressRef.current.recordStoreGhostSeen && studioProgress.impossibleRecordingStarted) advanceStudioChapter("computer");
      setStudioAlbumId(null);
      setStudioMessage(null);
      setStudioWorkbench("computer");
      return;
    }
    if (id === "console") { setStudioMessage(null); setStudioWorkbench("console"); return; }
    if (id === "monitors" && studioProgress.studioAnomalySeen) {
      setStudioMessage({ id, text: "Prefiero que esos parlantes se queden apagados un rato." });
      return;
    }
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

  function startFrequency09(replay = false) {
    if (frequencyPhaseRef.current !== "idle") return;
    if (replay) {
      if (!import.meta.env.DEV || !clubQuestRef.current.anomalySeen || !arcadeProgressRef.current.frequency09EventSeen) return;
    } else if (!canActivateFrequency09(clubQuestRef.current, arcadeProgressRef.current)) return;
    frequencyReplayRef.current = replay;
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
    const replay = frequencyReplayRef.current;
    frequencyReplayRef.current = false;
    if (!replay) {
      const next = completeFrequency09(arcadeProgressRef.current);
      arcadeProgressRef.current = next;
      setArcadeProgress(next);
    }
    setFrequencyPhase("idle");
    setFrequencyMessage("");
    setNearby(null);
    setFirstPerson(false);
    setActiveScene("arcade");
    setArcadeMessage({ id: "frequency09Cabinet", label: "FREQUENCY 09",
      text: replay ? "La señal volvió a cerrarse. Ya conozco lo que hay del otro lado." :
        "Eso fue real... Vi la tienda. Algo está por pasar. Tengo que volver." });
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
        ? "Qué raro... durante la prueba de sonido todo funcionaba perfectamente. Hay algo en esta señal que me recuerda a la grabación que revisamos con Hugo. Esto parece una secuencia digital... ¿Dónde más podría encontrar algo así en 1999?"
        : "Qué raro... durante la prueba de sonido todo funcionaba perfectamente. Esto parece una secuencia digital... ¿Dónde más podría encontrar algo así en 1999?" });
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
    if (rooftopProgressRef.current.missionCompleted && !lostShipProgressRef.current.hugoBriefed) { setLostShipPanel("hugo"); return; }
    if (lostShipProgressRef.current.signalDecoded && !lostShipProgressRef.current.linkActivated) { setLostShipPanel("hugo-after"); return; }
    setStudioMessage(null);
    const chapterNode = arcadeProgressRef.current.recordStoreGhostSeen && !studioProgress.impossibleRecordingStarted ? "chapter6:intro" :
      arcadeProgressRef.current.recordStoreGhostSeen && studioProgress.reversedSignalDecoded && !studioProgress.studioAnomalySeen ? "chapter6:reaction" :
        arcadeProgressRef.current.recordStoreGhostSeen && studioProgress.studioAnomalySeen && !studioProgress.rooftopClueKnown ? "chapter6:after" : null;
    setConversation({ npc: "hugo", nodeId: chapterNode || (missionReady(studioProgress) ? "mission-complete" : "greeting"), lastChoice: "" });
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
      const result = chooseStudioDialogue(conversation.nodeId, optionId, studioProgress, masterTape, clubQuest, { ghostSeen: arcadeProgressRef.current.recordStoreGhostSeen });
      if (result.questEvent) setMasterTape((progress) => advanceMasterTape(progress, result.questEvent));
      if (result.clubEvent) setClubQuest((progress) => advanceClubShowQuest(progress, result.clubEvent, masterTape));
      if (result.changed) setStudioProgress(result.progress);
      if (result.chapterEvent === "talk" || result.chapterEvent === "rooftop") advanceStudioChapter(result.chapterEvent);
      if (result.chapterEvent === "anomaly") {
        closeConversation();
        if (arcadeProgressRef.current.recordStoreGhostSeen && studioProgress.reversedSignalDecoded && !studioProgress.studioAnomalySeen && studioAnomalyRef.current.phase !== "active") {
          studioAnomalyRef.current = { phase: "active", age: 0 };
          setStudioAnomalyStep(0);
          setStudioAnomalyPhase("active");
        }
        return;
      }
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
    if (conversation.npc === "tito" && result.nodeId === "altered:tito:intro") advanceStoreStep("tito");
    if (conversation.npc === "tito" && result.nodeId === "invasion:tito:intro") commitInvasion("tito");
    if (result.nodeId === "close") { closeConversation(); return; }
    if (result.nodeId === "archive" && result.progress.archiveUnlocked) { closeConversation(); setArchiveOpen(true); return; }
    setConversation({ ...conversation, nodeId: result.nodeId, lastChoice: label });
  }
  function examineStore(id) {
    if(storeInvaded&&id?.startsWith("invasion-")){
      const p=storeInvasionProgressRef.current;
      if(id.startsWith("invasion-clue-")){
        if(!p.visionActive){setInvasionNotice("Activá C para leer el glifo oculto del cartel.");return;}
        const index=Number(id.slice(-1));
        const next=commitInvasion("juke-clue",index);
        const found=next.jukeboxClues.filter(Boolean).length;
        const glyph=["I / ONDA","II / SURCO","III / SILENCIO"][index];
        setInvasionNotice(next.jukeboxOff
          ? `PISTA ${index+1} · ${glyph} · El foco de la rockola ya está desactivado.`
          : next.jukeboxArmed
            ? `PISTAS 3/3 REGISTRADAS · ${glyph} · Dispará al núcleo fucsia de la rockola.`
            : found===3
              ? `PISTAS 3/3 REGISTRADAS · ${glyph} · Volvé a la señal de la rockola e ingresá ONDA → SURCO → SILENCIO.`
              : `PISTA ${index+1} REGISTRADA · ${glyph} · ${found}/3 carteles investigados. Buscá los otros con C activa.`);
        return;
      }
      if(id==="invasion-jukebox"){setInvasionPanel("jukebox");return;}
      if(id==="invasion-crate"){
        if(p.archiveOff){setInvasionNotice("El archivo ya está restaurado.");return;}
        setInvasionCrateHeld(value=>!value);setInvasionNotice(invasionCrateHeld?"Caja soltada.":"Caja sujeta / W y S la mueven por el riel. E la suelta.");return;
      }
      if(id==="invasion-archive-panel"){
        if(!p.visionActive){setInvasionNotice("La pared parece vacía. Activá C.");return;}
        commitInvasion("archive-inspect");setInvasionPanel("archive");return;
      }
      if(id==="invasion-inscription"){commitInvasion("emitter-clue");setInvasionPanel("inscription");return;}
      if(id==="invasion-reflector"){setInvasionPanel("reflector");return;}
      if(id==="invasion-core"&&p.bossDefeated){setInvasionPanel("core");return;}
      return;
    }
    if (id !== "strange-record" || !arcadeProgressRef.current.recordStoreJukeboxAnomalySeen) return;
    if (!arcadeProgressRef.current.recordStoreStrangeRecordSeen) {
      advanceStoreStep("record");
      setStoreMessage({ title: "UN OBJETO IMPOSIBLE", lines: [
        "Esta portada no estaba antes.", "Es el mismo símbolo de la máquina del Arcade.", "¿Cómo llegó hasta acá?",
      ] });
    } else if (!arcadeProgressRef.current.recordStoreReverseClueKnown) {
      advanceStoreStep("clue");
      setStoreMessage({ title: "INSCRIPCIÓN EN LA FUNDA", lines: [
        "09 — REPRODUCIR AL REVÉS",
        "Una frecuencia, grabaciones y equipos de estudio... esto está conectado.",
      ] });
    } else setStoreMessage({ title: "DISCO EXTRAÑO", lines: ["09 — REPRODUCIR AL REVÉS", "Tengo que hablar con Hugo."] });
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
    setSidebarTab("listen");
    setListenerMinimized(false);
    setListenerPinned(true);
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
    if (DISCOGRAPHY_GROUPS.some((group) => group.id === id)) setActiveGroup(id);
  }

  const inventoryButton = <button type="button" onClick={openInventory} aria-keyshortcuts="I"><Backpack size={17} /> INVENTARIO</button>;
  const inventoryPanel = inventoryOpen && <UniverseInventory items={inventoryItems} onClose={closeInventory}
    resolveAction={(item) => getUniverseInventoryAction(item, { scene: activeScene, nearby, masterTape, clubQuest, lostShipProgress })}
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
    {frequencyPhase === "explore" && <UniverseMissionCard className="frequency-objective"
      title="Señal fragmentada" objective="Examiná las pantallas y seguí hasta el fondo."
      details={[`${frequencyClues.length}/2 ecos encontrados`]} />}
    {nearby?.kind === "examine" && frequencyPhase === "explore" && !paused &&
      <InteractionPrompt className="studio-examine-cue">[E] EXAMINAR {nearby.label.toUpperCase()}</InteractionPrompt>}
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

  if(activeScene==="matrix")return <div ref={storeRef} className="neon-record-store neon-recording-studio neon-matrix" data-frequency-vision={matrixProgress.visionActive?"active":"inactive"} role={standalone?"region":"dialog"} aria-modal={standalone?undefined:"true"} aria-label="Puerta 03 La Realidad Fracturada">
    <RecordStoreScene key={"matrix-"+combatRetryKey} scenario="matrix" albums={DISCOGRAPHY_ALBUMS}
      onNearby={setNearby} onExamine={examineMatrix} onViewChange={setFirstPerson} onJumpChange={setJumping}
      interactionLocked={paused||mapOpen||inventoryOpen||Boolean(matrixPanel)||Boolean(matrixCinematic)||combatHearts===0}
      paused={paused||mapOpen||inventoryOpen||Boolean(matrixPanel)||Boolean(matrixCinematic)||combatHearts===0} firstPerson={firstPerson} playerSnapshotRef={matrixPlayerRef}
      lostShipProgress={lostShipProgress} orbApiRef={orbApiRef} onOrbStatus={setOrbStatus} orbStatus={orbStatus}
      matrixProgress={matrixProgress} onMatrixEvent={commitMatrix} onMatrixStatus={setMatrixBossStatus} onMatrixBossScreen={positionMatrixBossHud}
      matrixTransformsRef={matrixTransformsRef} matrixAssetApiRef={matrixAssetApiRef} onCombatDamage={onCombatDamage}/>
    <div className="matrix-frequency-overlay" aria-hidden="true"/>
    <header className="studio-header"><div><span>NEONBOY UNIVERSE / DIMENSIONES PERDIDAS</span><h2>LA REALIDAD FRACTURADA</h2><p>PUERTA 03 · memoria, código y corrupción</p></div>
      <div className="studio-header-actions">{inventoryButton}<button type="button" onClick={()=>setMatrixPanel('journal')}>DIARIO</button><button type="button" onClick={openMap}><MapPinned size={17}/> MAPA</button></div></header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; V: vista &nbsp;|&nbsp; C: visión &nbsp;|&nbsp; E: interactuar &nbsp;|&nbsp; F/Click: Orbe &nbsp;|&nbsp; R: recuperar &nbsp;|&nbsp; M: mapa</div>
    <UniverseMissionCard className="lost-ship-mission" title="PUERTA 03 / REALIDAD FRACTURADA" kind="signal" objective={matrixObjective(matrixProgress)} complete={matrixProgress.archiveRead}
      details={[matrixProgress.bridgeOpen&&"PUENTE · ACTIVO",matrixProgress.memoryOpen&&"MEMORIAS · RESTAURADAS",matrixProgress.blocksOpen&&"TALLER · ABIERTO",matrixProgress.securityOpen&&"SEGURIDAD · AUTORIZADA",matrixProgress.bossDefeated&&"NEON EVIL · DERROTADO"]}/>
    <div className="matrix-vision-control"><button type="button" className={matrixProgress.visionActive?'is-active':''} aria-pressed={matrixProgress.visionActive} disabled={!matrixProgress.visionUnlocked||paused||Boolean(matrixPanel)} onClick={()=>commitMatrix('vision-toggle')}>◈ VISIÓN DE FRECUENCIA <kbd>C</kbd> · {matrixProgress.visionActive?'ACTIVA':'INACTIVA'}</button></div>
    <MatrixBossHud progress={matrixProgress} status={matrixBossStatus} hudRef={matrixBossHudRef}/>
    <div className="parthenon-hearts" role="status" aria-label={"Salud "+combatHearts+" de 3"}>{Array.from({length:3},(_,i)=><span key={i}>{i<combatHearts?'♥':'♡'}</span>)}</div>
    <NeonOrbHud progress={lostShipProgress} status={orbStatus} label="PUERTA 03" locked={paused||mapOpen||inventoryOpen||Boolean(matrixPanel)||Boolean(matrixCinematic)||combatHearts===0} onFire={()=>orbApiRef.current?.fire()} onRecall={()=>orbApiRef.current?.recall()}/>
    {nearby?.kind==='examine'&&!matrixPanel&&<InteractionPrompt className="studio-examine-cue">[E] {nearby.label}</InteractionPrompt>}
    {matrixMessage&&<div className="studio-examine-message" role="status"><small>PUERTA 03 / REGISTRO</small><p>{matrixMessage}</p><button type="button" onClick={()=>setMatrixMessage(null)} aria-label="Cerrar aviso">&times;</button></div>}
    {matrixCinematic&&<div className="matrix-cinematic" role="status"><small>PUERTA 03 / ESPEJO DIGITAL</small>{matrixCinematic==="intro"?<><strong>EL REFLEJO</strong><p>NEONBOY: ¿Quién sos vos?</p><p>NEON EVIL: SOY LO QUE EL SISTEMA CREÓ A PARTIR DE VOS.</p><p>NEONBOY: ¡Bueno, me hizo bastante más grande!</p><p>NEON EVIL: TU EXISTENCIA DEBE SER CORREGIDA.</p></>:<><strong>IDENTIDAD NO ELIMINADA</strong><p>NEON EVIL: ERROR... IDENTIDAD NO ELIMINADA...</p><p>NEONBOY: ¡Y no pienso dejar que me borren!</p></>}</div>}
    {damageTick>0&&<div key={damageTick} className="parthenon-damage" aria-hidden="true"/>}
    {matrixPanel&&<MatrixPanel key={matrixPanel} mode={matrixPanel} progress={matrixProgress} onAction={commitMatrix} onClose={()=>setMatrixPanel(null)} onEnter={enterScenario}/>}
    {combatHearts===0&&<div className="parthenon-fallen"><section className="parthenon-fallen-card" role="dialog" aria-modal="true" aria-label="Has caído"><h2>LA SEÑAL TE ALCANZÓ</h2><p>Los acertijos y registros se conservan.</p><div className="parthenon-fallen-actions"><button type="button" onClick={retryCombat}>Reintentar desde el checkpoint</button><button type="button" onClick={()=>enterScenario('lost-ship')}>Volver a la nave</button>{import.meta.env.DEV&&<button type="button" onClick={restartMatrixForTesting}>Reiniciar Puerta 03 · DEV</button>}</div></section></div>}
    {import.meta.env.DEV&&!mapOpen&&!matrixPanel&&<div className="matrix-dev-controls"><button type="button" className="matrix-dev-restart" onClick={restartMatrixForTesting}>↻ Reiniciar Puerta 03 · DEV</button><details className="matrix-dev-jumps"><summary>Ir a sector / desarrollo</summary>{[['Ciudad',0,20],['Archivo',0,-10],['Taller',0,-30],['Seguridad',0,-55],['Espejo',0,-80]].map(([label,x,z])=><button type="button" key={label} onClick={()=>matrixAssetApiRef.current?.teleport(x,z)}>{label}</button>)}</details></div>}
    {import.meta.env.DEV&&!mapOpen&&!matrixPanel&&<RecordingStudioDevPanel transforms={matrixTransforms} onChange={changeMatrixTransforms} assets={MATRIX_ASSETS} onSave={saveMatrixTransforms} onDefault={defaultMatrixTransform} filename="matrixTransforms.json" ariaLabel="Ajustar modelos de Puerta 03" reachIds={['nex9','sentinel']} numericFields={[{field:"detect",label:"Radio de detección",min:2,max:20,step:.5},{field:"attackPower",label:"Daño por ataque",min:0,max:4,step:1},{field:"patrolRadius",label:"Radio de patrulla",min:.5,max:6,step:.2}]}/>}
    {mapOpen&&<NeonUniverseMap onClose={closeMap} onEnter={enterScenario} unlockedScenarios={unlockedScenarios}/>}
    {inventoryPanel}{inventoryToast}
    <footer className="studio-footer"><span>PUERTA 03 / SIMULACIÓN FRACTURADA</span><span>{firstPerson?'PRIMERA PERSONA':'TERCERA PERSONA'}</span><span>{matrixProgress.archiveRead?'EL ARCHIVISTA / BUENOS AIRES':'FREQUENCY 09'}</span></footer>
  </div>;

  if (activeScene === "parthenon") return <div ref={storeRef} className="neon-record-store neon-recording-studio neon-parthenon" role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label="El Partenón Maldito, Puerta 02">
    <RecordStoreScene key={"parthenon-" + combatRetryKey} scenario="parthenon" albums={DISCOGRAPHY_ALBUMS}
      onNearby={setNearby} onExamine={examineParthenon} onViewChange={setFirstPerson} onJumpChange={setJumping}
      interactionLocked={paused || mapOpen || inventoryOpen || Boolean(parthenonPanel) || combatHearts === 0}
      paused={paused || mapOpen || inventoryOpen || Boolean(parthenonPanel) || combatHearts === 0}
      firstPerson={firstPerson} playerSnapshotRef={parthenonPlayerRef}
      lostShipProgress={lostShipProgress} parthenonProgress={parthenonProgress} parthenonTransformsRef={parthenonTransformsRef}
      onParthenonEvent={onParthenonEvent} onParthenonOrbHit={onParthenonOrbHit} onParthenonBossStatus={setParthenonBossStatus} parthenonBossApiRef={parthenonBossApiRef} onCombatDamage={onCombatDamage}
      orbApiRef={orbApiRef} onOrbStatus={setOrbStatus} orbStatus={orbStatus} />
    <header className="studio-header"><div><span>NEONBOY UNIVERSE / DIMENSIONES PERDIDAS</span><h2>EL PARTENÓN MALDITO</h2><p>PUERTA 02 · El templo entre épocas</p></div>
      <div className="studio-header-actions">{inventoryButton}{storeInvaded&&<button type="button" onClick={()=>setInvasionPanel("diary")}>DIARIO</button>}<button type="button" onClick={openMap}><MapPinned size={17} /> MAPA</button></div></header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; V: vista &nbsp;|&nbsp; E: examinar &nbsp;|&nbsp; F/Click: Orbe Neon &nbsp;|&nbsp; R: recuperar &nbsp;|&nbsp; M: mapa</div>
    {!parthenonProgress.altarRead && <UniverseMissionCard className="lost-ship-mission" title="PUERTA 02 / EL PARTENÓN MALDITO" kind="signal"
      objective={parthenonObjective(parthenonProgress)} complete={parthenonProgress.altarRead}
      details={[parthenonProgress.hopliteHealth === 0 && "ESTATUA · DERROTADA", parthenonProgress.guardianPuzzleCompleted && "GUARDIANES · ALINEADOS", parthenonProgress.reflectionPuzzleCompleted && "REFLEJOS · RESUELTOS", parthenonProgress.templeSealsCompleted && "SELLOS · ACTIVOS"]} />}
    {parthenonProgress.altarRead && <UniverseMissionCard className="parthenon-boss-mission" title="PUERTA 02 / LA MALDICIÓN DE MEDUSA" kind="signal" objective={medusaQuestObjective(parthenonProgress)} complete={parthenonProgress.frequencyFragment02Analyzed}
      details={[parthenonProgress.cursedHopliteHealth === 0 && "HOPLITA - DERROTADO", parthenonProgress.medusaBossDefeated && "MEDUSA - DERROTADA", parthenonProgress.frequencyFragment02Collected && "FRAGMENTO 02 - OBTENIDO"]} />}
    {["intro", "active", "victory"].includes(parthenonBossStatus.phase) && <div className="parthenon-boss-hud" role="status" aria-label={"Medusa, fase " + parthenonBossStatus.phaseNumber}>
      <strong>MEDUSA <small>FASE {parthenonBossStatus.phaseNumber}/3</small></strong>
      <div className="parthenon-boss-health"><span style={{width: (parthenonBossStatus.health / parthenonBossStatus.maxHealth * 100) + "%"}} /></div>
      <small>{parthenonBossStatus.cycle === "vulnerable" ? (parthenonBossStatus.phaseNumber === 3 && parthenonBossStatus.health === 1 ? "GOLPE FINAL - ORBE DIRECTO O REFLEJADO" : "DEFENSA ABIERTA - LANZÁ EL ORBE") : parthenonBossStatus.cycle === "gaze" ? "MIRADA PETRIFICANTE - BUSCÁ COBERTURA" : parthenonBossStatus.coverWarning ? "LA COLUMNA ROJA NO PROTEGE" : "OBSERVÁ SU PATRÓN DE ATAQUE"}</small>
      <small>PETRIFICACIÓN</small><div className="parthenon-petrify"><span style={{width: (parthenonBossStatus.petrification * 100) + "%"}} /></div>
    </div>}
    {parthenonBossStatus.phase === "intro" && <div className="parthenon-boss-intro" role="status"><strong>LA MIRADA DE MEDUSA</strong>
      {parthenonBossStatus.introAge < 2.2 ? <><p>NEONBOY: ¿Qué es este lugar? Está lleno de estatuas...</p><p>MEDUSA: Otro visitante ha cruzado el umbral.</p></> : parthenonBossStatus.introAge < 4.3 ? <><p>NEONBOY: ¡Uh, no! ¿Vos sos Medusa?</p><p>MEDUSA: Los que contemplan mis ojos permanecen aquí para siempre.</p></> : <p>NEONBOY: Bueno, entonces voy a tratar de no mirarte.</p>}
    </div>}
    <div className="parthenon-hearts" role="status" aria-label={"Salud " + combatHearts + " de 3"}>{Array.from({length:3},(_,i)=><span key={i}>{i<combatHearts?"♥":"♡"}</span>)}</div>
    <NeonOrbHud progress={lostShipProgress} status={orbStatus} label="PUERTA 02" locked={paused || mapOpen || inventoryOpen || Boolean(parthenonPanel) || combatHearts === 0}
      onFire={() => orbApiRef.current?.fire()} onRecall={() => orbApiRef.current?.recall()} />
    {nearby?.kind === "examine" && !parthenonPanel && <InteractionPrompt className="studio-examine-cue">[E] Examinar {nearby.label}</InteractionPrompt>}
    {parthenonMessage && <div className="studio-examine-message" role="status"><small>PUERTA 02 / REGISTRO</small><p>{parthenonMessage}</p><button type="button" onClick={() => setParthenonMessage(null)} aria-label="Cerrar aviso">&times;</button></div>}
    {damageTick > 0 && <div key={damageTick} className="parthenon-damage" aria-hidden="true" />}
    {parthenonPanel && <ParthenonPanel mode={parthenonPanel} progress={parthenonProgress} onClose={() => setParthenonPanel(null)} onReturn={() => enterScenario("lost-ship")} onStartBoss={() => { if (parthenonBossApiRef.current?.start()) setParthenonPanel(null); }} />}
    {combatHearts === 0 && <div className="parthenon-fallen"><section className="parthenon-fallen-card" role="dialog" aria-modal="true" aria-label="Has caido">
      <small>PUERTA 02 / COMBATE</small><h2>DERROTA - LA MALDICIÓN DE MEDUSA</h2><p>Tu inventario y los acertijos resueltos se conservaron.</p>
      <div className="parthenon-fallen-actions"><button type="button" onClick={retryCombat}>Reintentar combate</button><button type="button" onClick={() => { combatHeartsRef.current = 3; setCombatHearts(3); parthenonBossApiRef.current?.reset(); setParthenonMessage("SANTUARIO / Podés volver a iniciar el combate desde el altar."); }}>Volver al santuario</button><button type="button" onClick={() => enterScenario("lost-ship")}>Regresar al punto seguro anterior</button></div>
    </section></div>}
    {import.meta.env.DEV && !mapOpen && !parthenonPanel && <RecordingStudioDevPanel transforms={parthenonTransforms} onChange={changeParthenonTransforms} assets={PARTHENON_ASSETS}
      onSave={saveParthenonTransforms} onDefault={defaultParthenonTransform} filename="parthenonTransforms.json" ariaLabel="Ajustar modelos del Partenón" reachIds={[]} />}
    {import.meta.env.DEV && !mapOpen && !parthenonPanel && <details className="parthenon-dev"><summary>Combate / desarrollo</summary>{[["health",1,7,1],["attackDamage",1,2,1],["speed",.5,3,.1],["detectRange",3,14,.5],["attackRange",1,3,.1],["windup",.3,2,.1],["recovery",.5,4,.1]].map(([field,min,max,step])=><label key={field}>{field}<input type="range" min={min} max={max} step={step} value={devCombatSettings[field]} onChange={e=>{const value=Number(e.target.value);HOPLITE_CONFIG[field]=value;if(field==="health")commitParthenon("dev-health",value);setDevCombatSettings({...devCombatSettings,[field]:value});}}/><span>{devCombatSettings[field]}</span></label>)}</details>}
    {lostShipTransition && <div className="lost-ship-transition" role="status"><div><strong>PUERTA 02</strong><span>EL TEMPLO ANTIGUO RESPONDE</span></div></div>}
    {mapOpen && <NeonUniverseMap onClose={closeMap} onEnter={enterScenario} unlockedScenarios={unlockedScenarios} />}
    {inventoryPanel}{inventoryToast}
    <footer className="studio-footer"><span>PUERTA 02 / TIEMPO DESCONOCIDO</span><span>{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"}</span><span>ORBE NEON</span></footer>
  </div>;

  if (activeScene === "lost-ship") return <div ref={storeRef} className="neon-record-store neon-recording-studio neon-lost-ship" role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label="La Nave Perdida, Puerta 01">
    <RecordStoreScene key={"lost-ship-" + combatRetryKey} scenario="lost-ship" albums={DISCOGRAPHY_ALBUMS} onNearby={setNearby} onExamine={examineLostShip}
      onViewChange={setFirstPerson} onJumpChange={setJumping}
      interactionLocked={paused || mapOpen || inventoryOpen || Boolean(lostShipPanel) || combatHearts === 0}
      paused={paused || mapOpen || inventoryOpen || Boolean(lostShipPanel) || combatHearts === 0} firstPerson={firstPerson} playerSnapshotRef={lostShipPlayerRef}
      lostShipProgress={lostShipProgress} lostShipEffectRef={lostShipEffectRef} orbApiRef={orbApiRef} onOrbHit={onOrbHit} onOrbStatus={setOrbStatus} orbStatus={orbStatus} onCombatDamage={onCombatDamage} lostShipTransformsRef={lostShipTransformsRef} lostShipAssetApiRef={lostShipAssetApiRef} />
    <header className="studio-header"><div><span>NEONBOY UNIVERSE / DIMENSIONES PERDIDAS</span><h2>LA NAVE PERDIDA</h2><p>PUERTA 01 · entre coordenadas</p></div>
      <div className="studio-header-actions">{inventoryButton}<button type="button" onClick={() => setLostShipPanel("journal")}>DIARIO</button><button type="button" onClick={openMap}><MapPinned size={17} /> MAPA</button></div></header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; V: vista &nbsp;|&nbsp; Espacio: saltar &nbsp;|&nbsp; E: examinar &nbsp;|&nbsp; F/Click: orbe &nbsp;|&nbsp; R: recuperar &nbsp;|&nbsp; M: mapa</div>
    <UniverseMissionCard className="lost-ship-mission" title={lostShipProgress.archiveRecovered ? "PUERTA 02 / ORBE NEON" : "PUERTA 01 / LA NAVE PERDIDA"} kind="signal" objective={lostShipObjective(lostShipProgress)} complete={lostShipProgress.orbReceiverActivated}
      details={[lostShipProgress.accessGranted && "ACCESO · CONCEDIDO", lostShipProgress.powerRestored && "REACTOR · ACTIVO", lostShipProgress.navigationRestored && "NAVEGACIÓN · RESTABLECIDA"]} />
    <div className="parthenon-hearts" role="status" aria-label={"Salud " + combatHearts + " de 3"}>{Array.from({length:3},(_,i)=><span key={i}>{i<combatHearts?"♥":"♡"}</span>)}</div>
    <NeonOrbHud progress={lostShipProgress} status={orbStatus} locked={paused || mapOpen || inventoryOpen || Boolean(lostShipPanel) || combatHearts === 0}
      onFire={() => orbApiRef.current?.fire()} onRecall={() => orbApiRef.current?.recall()} />
    {nearby?.kind === "examine" && !lostShipPanel && <InteractionPrompt className="studio-examine-cue">[E] {nearby.id === "traveler" ? "Hablar con el Viajero" : "Examinar " + nearby.label}</InteractionPrompt>}
    {lostShipMessage && <div className="studio-examine-message" role="status"><small>PUERTA 01 / REGISTRO</small><p>{lostShipMessage}</p><button type="button" onClick={() => setLostShipMessage(null)} aria-label="Cerrar aviso">&times;</button></div>}
    {damageTick > 0 && <div key={damageTick} className="parthenon-damage" aria-hidden="true" />}
    {combatHearts === 0 && <div className="parthenon-fallen"><section className="parthenon-fallen-card" role="dialog" aria-modal="true" aria-label="Has caido"><h2>HAS CAIDO</h2><p>Tu progreso se conserva.</p><div className="parthenon-fallen-actions"><button type="button" onClick={retryCombat}>Reintentar desde el checkpoint</button><button type="button" onClick={() => enterScenario("neonboy-rooftop")}>Volver a una zona segura</button></div></section></div>}
    {lostShipPanel && <LostShipPanel mode={lostShipPanel} progress={lostShipProgress} parthenonProgress={parthenonProgress} onFragmentAnalyze={() => { commitParthenon("fragment-analyze"); setLostShipMessage("FRAGMENTO 02 ANALIZADO / La señal apunta hacia PUERTA 03."); }} onAction={commitLostShip} onClose={closeLostShipPanel} onEnter={enterScenario} />}
    {lostShipTransition && <div className="lost-ship-transition" role="status"><div><strong>PUERTA 01</strong><span>ENLACE DIMENSIONAL ESTABLECIDO</span></div></div>}
    {import.meta.env.DEV && !mapOpen && !lostShipPanel && <RecordingStudioDevPanel transforms={lostShipTransforms} onChange={changeLostShipTransforms} assets={LOST_SHIP_ASSETS}
      onSave={saveLostShipTransforms} onDefault={defaultLostShipTransform} filename="lostShipTransforms.json" ariaLabel="Ajustar modelos de la nave" reachIds={["traveler"]} />}
    {mapOpen && <NeonUniverseMap onClose={closeMap} onEnter={enterScenario} unlockedScenarios={unlockedScenarios} />}
    {inventoryPanel}{inventoryToast}
    <footer className="studio-footer"><span>PUERTA 01 / ∞</span><span>{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"}{jumping ? " · SALTANDO" : ""}</span><span>{lostShipProgress.archiveRecovered ? "PUERTA 02 · DETECTADA" : "FREQUENCY 09"}</span></footer>
  </div>;

  if (activeScene === "rooftop") return <div ref={storeRef} className="neon-record-store neon-recording-studio neon-rooftop" role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label="La Azotea 1999">
    <RecordStoreScene scenario="rooftop" albums={DISCOGRAPHY_ALBUMS} onNearby={setNearby} onExamine={examineRooftop}
      onViewChange={setFirstPerson} onJumpChange={setJumping}
      interactionLocked={paused || mapOpen || inventoryOpen || Boolean(rooftopPuzzle) || Boolean(lostShipPanel) || rooftopPhase === "intro" || rooftopPhase === "anomaly"}
      paused={paused || mapOpen} firstPerson={firstPerson} playerSnapshotRef={rooftopPlayerRef}
      rooftopTransformsRef={rooftopTransformsRef} rooftopAssetApiRef={rooftopAssetApiRef}
      rooftopProgress={rooftopProgress} rooftopPhase={rooftopPhase} rooftopPhaseAge={rooftopPhaseAge} />
    <RooftopAtmosphere phase={rooftopPhase} paused={paused || mapOpen} />
    <header className="studio-header"><div><span>NEONBOY UNIVERSE / BUENOS AIRES · 1999</span><h2>LA AZOTEA 1999</h2><p>La transmisión del abismo</p></div>
      <div className="studio-header-actions">{inventoryButton}{storeInvaded&&<button type="button" onClick={()=>setInvasionPanel("diary")}>DIARIO</button>}<button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button></div></header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; V: vista &nbsp;|&nbsp; Espacio: saltar &nbsp;|&nbsp; E: examinar &nbsp;|&nbsp; M: mapa</div>
    {nearby?.kind === "examine" && !rooftopPuzzle && rooftopPhase === "idle" && <InteractionPrompt className="studio-examine-cue">[E] {nearby.id === "mainAntenna" ? (lostShipProgress.signalDecoded ? "Activar enlace dimensional" : "Ajustar antena") : nearby.id === "stairDoor" ? "Volver al mapa" : "Examinar " + nearby.label}</InteractionPrompt>}
    <UniverseMissionCard className="rooftop-mission" title="La transmisión del abismo" kind="signal" objective={rooftopObjective(rooftopProgress)} complete={rooftopProgress.missionCompleted}
      details={[rooftopProgress.powerRestored && "ENERGÍA · RESTABLECIDA", rooftopProgress.antennaAligned && "ANTENA · ORIENTADA", rooftopProgress.frequencyDecoded && "FREQUENCY 09 · DECODIFICADA"]} />
    {rooftopMessage && rooftopPhase === "idle" && <div className="studio-examine-message" role="status"><small>NEONBOY / AZOTEA 1999</small><p>{rooftopMessage}</p><button type="button" onClick={() => setRooftopMessage(null)} aria-label="Cerrar aviso">&times;</button></div>}
    {rooftopPhase === "intro" && <div className="rooftop-cinematic" role="status"><span>NEONBOY UNIVERSE · CAPÍTULO 7</span><strong>LA AZOTEA 1999</strong><span>LA TRANSMISIÓN DEL ABISMO</span><p>{rooftopPhaseAge < 2.5 ? "Qué lindo lugar para venir en medio de una tormenta..." : rooftopPhaseAge < 4.8 ? "Espero que Hugo tenga razón con esto de la antena." : "Y espero que no aparezca otro fantasma."}</p></div>}
    {rooftopPhase === "danger" && <div className="rooftop-danger" role="alert">SOBRECARGA · Alejate de la antena y alcanzá el círculo verde · {Math.max(0,Math.ceil(12-rooftopPhaseAge))} s</div>}
    {rooftopPhase === "anomaly" && <div className="rooftop-cinematic" role="status"><span>SEÑAL DESCONOCIDA · PATRÓN 09</span><strong>{rooftopPhaseAge < 3 ? "¿Qué carajo es eso...?" : rooftopPhaseAge < 5 ? "No... no puede ser." : rooftopPhaseAge < 8 ? "¡Es el mismo sonido del recital!" : "Hay algo del otro lado."}</strong><p>La distorsión se abre sobre Buenos Aires. Una silueta alada aparece a lo lejos.</p></div>}
    {rooftopPuzzle && <RooftopPuzzle mode={rooftopPuzzle} progress={rooftopProgress} onAdvance={commitRooftop} onClose={() => setRooftopPuzzle(null)} />}
    {lostShipPanel && <LostShipPanel mode={lostShipPanel} progress={lostShipProgress} onAction={commitLostShip} onClose={() => setLostShipPanel(null)} onEnter={enterScenario} />}
    {import.meta.env.DEV && !mapOpen && !rooftopPuzzle && <RecordingStudioDevPanel transforms={rooftopTransforms} onChange={changeRooftopTransforms} assets={ROOFTOP_ASSETS}
      onSave={saveRooftopTransforms} onDefault={defaultRooftopTransform} filename="rooftopTransforms.json" ariaLabel="Ajustar modelos de la azotea" reachIds={ROOFTOP_ASSETS.map(e => e.id)} />}
    {mapOpen && <NeonUniverseMap onClose={closeMap} onEnter={enterScenario} unlockedScenarios={unlockedScenarios} />}
    {inventoryPanel}{inventoryToast}
    <footer className="studio-footer"><span>BUENOS AIRES · 1999</span><span>{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"}{jumping ? " · SALTANDO" : ""}</span><span>FREQUENCY 09</span></footer>
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
      <div className="studio-header-actions">{inventoryButton}{storeInvaded&&<button type="button" onClick={()=>setInvasionPanel("diary")}>DIARIO</button>}<button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button></div>
    </header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; V: vista &nbsp;|&nbsp; Espacio: saltar &nbsp;|&nbsp; E: examinar &nbsp;|&nbsp; M: mapa &nbsp;|&nbsp; I: inventario</div>
    {nearby?.kind === "examine" && !mapOpen && !inventoryOpen && !conversation && !gameOpen && frequencyPhase === "idle" &&
      <InteractionPrompt className="studio-examine-cue">{ARCADE_NPCS.some((entry) => entry.id === nearby.id) ? "[E] HABLAR CON " + nearby.label.toUpperCase() : ARCADE_GAME_CABINETS[nearby.id] ? "[E] JUGAR " + nearby.label.toUpperCase() : nearby.id === "frequency09Cabinet" ? "[E] INTERACTUAR CON FREQUENCY 09" : nearby.id === "exit" ? "[E] Volver al mapa" : "[E] Examinar " + nearby.label}</InteractionPrompt>}
    {arcadeProgress.recordStoreFutureVisionSeen
      ? <UniverseMissionCard className="frequency-objective" title="El futuro que no existe"
          description="FREQUENCY 09 mostró la tienda destruida." objective={storeInvestigationObjective(arcadeProgress)} />
      : clubQuest.anomalySeen && <ClubShowHud quest={clubQuest} masterTape={masterTape} scene="arcade" rikyProgress={rikyProgress} />}
    {inventoryToast}
    {frequencyPhase === "intake" && <div className={"frequency-intake" + (paused ? " is-paused" : "")} role="status">
      <div className="frequency-intake-reticle" aria-hidden="true"><i /><i /></div>
      <div className="frequency-intake-title"><small>TRANSMISIÓN INTERRUMPIDA</small>
        <strong>FREQUENCY <em>09</em></strong><span>CONECTANDO CON EL OTRO LADO</span>
        <i className="frequency-intake-progress" aria-hidden="true" /></div>
      <span className="frequency-intake-code" aria-hidden="true">F/09 · NO SIGNAL · 00:09:09</span>
    </div>}
    {arcadeMessage && <div className="studio-examine-message" role="status" aria-live="polite">
      <small>NEONBOY EXAMINA / {arcadeMessage.label}</small><p>{arcadeMessage.text}</p>
      {import.meta.env.DEV && arcadeMessage.id === "frequency09Cabinet" &&
        arcadeProgress.frequency09EventSeen && clubQuest.anomalySeen &&
        <button type="button" className="frequency-replay-button" onClick={() => startFrequency09(true)}>
          Repetir secuencia (prueba)
        </button>}
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
      onViewChange={setFirstPerson} onJumpChange={setJumping} interactionLocked={paused || mapOpen || inventoryOpen || Boolean(conversation) || Boolean(studioWorkbench) || Boolean(lostShipPanel) || studioAnalyzerOpen || studioAnomalyPhase === "active" || Boolean(studioMessage)} firstPerson={firstPerson}
      playerSnapshotRef={studioPlayerRef} studioTransformsRef={studioTransformsRef} studioAssetApiRef={studioAssetApiRef}
      studioAnomalyRef={studioAnomalyRef} studioChapterSeen={studioProgress.studioAnomalySeen} paused={paused} />
    <header className="studio-header">
      <div><span>NEONBOY UNIVERSE / EST. 1999</span><h2>NEON RECORDING STUDIO</h2><p>Sala de control · Cabina de grabación</p></div>
      <div className="studio-header-actions">{inventoryButton}{storeInvaded&&<button type="button" onClick={()=>setInvasionPanel("diary")}>DIARIO</button>}<button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button></div>
    </header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; Espacio: saltar &nbsp;|&nbsp; E: examinar / hablar &nbsp;|&nbsp; M: mapa &nbsp;|&nbsp; I: inventario</div>
    {nearby?.kind === "hugo" && !conversation && !mapOpen && !studioWorkbench &&
      <span className="studio-talk-accessible" role="status">Hugo Mendez cerca. Presioná E para hablar.</span>}
    {nearby?.kind === "examine" && <InteractionPrompt className="studio-examine-cue">[E] Examinar {nearby.label}</InteractionPrompt>}
    <div className="studio-mission-stack">
      {rooftopProgress.missionCompleted && <UniverseMissionCard title={lostShipProgress.archiveRecovered ? "PUERTA 02 / ORBE NEON" : "PUERTA 01 / LA NAVE PERDIDA"} kind="signal" objective={lostShipObjective(lostShipProgress)} complete={lostShipProgress.orbReceiverActivated} />}
      {studioChapterObjective && <UniverseMissionCard title="La grabación imposible" kind="signal" objective={studioChapterObjective}
        complete={false} details={[studioProgress.reversedSignalDecoded && "PATRÓN 0-9-0-9", studioProgress.studioAnomalySeen && "Señal externa"]} />}
      <div className="studio-progress" role="status"><strong>DETRÁS DE LA MEZCLA</strong><span>{studioMissionStep}</span>
        <button type="button" onClick={() => setStudioWorkbench("archive")}>Archivo ({Number(studioProgress.wakeUpInfo) + Number(studioProgress.jesusIsKingInfo) + Number(studioProgress.newBornInfo) + Number(studioProgress.missionComplete)})</button>
      </div>
      <MasterTapeHud progress={masterTape} scene="studio" />
      <ClubShowHud quest={clubQuest} masterTape={masterTape} scene="studio" />
    </div>
    {clubNoticePanel}
    {inventoryToast}
    {studioMessage && <div className="studio-examine-message" role="status" aria-live="polite"><small>NEONBOY EXAMINA / {STUDIO_EXAMINE.find((entry) => entry.id === studioMessage.id)?.label}</small><p>{studioMessage.text}</p><button type="button" onClick={() => setStudioMessage(null)} aria-label="Cerrar examen">&times;</button></div>}
    {conversationNpc?.id === "hugo" && conversationNode && <RecordStoreConversation npc={conversationNpc} node={conversationNode} lastChoice={conversation.lastChoice}
      onChoose={chooseConversationOption} onClose={closeConversation} />}
    {studioWorkbench && <StudioWorkbench key={studioWorkbench + ":" + studioAlbumId} mode={studioWorkbench} albumId={studioAlbumId} progress={studioProgress} masterTape={masterTape}
      onClose={() => setStudioWorkbench(null)} onExplore={exploreStudioEquipment} paused={paused}
      signalAvailable={arcadeProgress.recordStoreGhostSeen && studioProgress.impossibleRecordingStarted}
      onAnalyzeSignal={() => { advanceStudioChapter("computer"); setStudioWorkbench(null); setStudioAnalyzerOpen(true); }}
      signalContextText={studioProgress.studioAnomalySeen ? "El patrón 09 sigue apareciendo, aunque la grabación haya terminado." : null} />}
    {lostShipPanel && <LostShipPanel mode={lostShipPanel} progress={lostShipProgress} onAction={commitLostShip} onClose={() => setLostShipPanel(null)} onEnter={enterScenario} />}
    {studioAnalyzerOpen && <StudioSignalAnalyzer progress={studioProgress} paused={paused} onMilestone={advanceStudioChapter}
      onBack={() => { setStudioAnalyzerOpen(false); setStudioWorkbench("computer"); }} />}
    {studioAnomalyPhase === "active" && <div className="studio-anomaly-overlay" role="status" aria-live="polite">
      <div className="studio-anomaly-overlay__panel"><small>NEON RECORDING STUDIO / SEÑAL 09</small>
        <div className="studio-anomaly-overlay__wave" aria-hidden="true"><span>F09_SIGNAL.WAV / PAUSADO</span><i /></div>
        <strong>{studioAnomalyStep < 2 ? "La señal no se detiene..." : studioAnomalyStep < 4 ? "La consola recibe algo sin entrada." : "El estudio vuelve a quedar en silencio."}</strong>
        <p>{["NEONBOY: ¡Hugo! ¡Apagá eso!", "HUGO: ¡Está apagado!", "NEONBOY: ¿Entonces de dónde viene?", "HUGO: No tengo la menor idea..."][Math.min(3, studioAnomalyStep)]}</p>
      </div></div>}
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
      <div className="studio-header-actions">{inventoryButton}{storeInvaded&&<button type="button" onClick={()=>setInvasionPanel("diary")}>DIARIO</button>}<button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button></div>
    </header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; V: vista &nbsp;|&nbsp; Espacio: saltar &nbsp;|&nbsp; E: examinar / hablar &nbsp;|&nbsp; M: mapa &nbsp;|&nbsp; I: inventario</div>
    {nearby?.kind === "club-friends" && concertPhase === "idle" && !conversation && !mapOpen &&
      <InteractionPrompt className="studio-examine-cue">[E] HABLAR CON LOS AMIGOS</InteractionPrompt>}
    {nearby?.kind === "club-npc" && concertPhase === "idle" && !conversation && !mapOpen &&
      <InteractionPrompt className="studio-examine-cue">[E] HABLAR CON {ROCK_CLUB_NPCS.find((entry) => entry.id === nearby.id)?.name.toUpperCase()}</InteractionPrompt>}
    {nearby?.kind === "examine" && concertPhase === "idle" && !mapOpen && !conversation &&
      <InteractionPrompt className="studio-examine-cue" onClick={(nearby.id === "stage" || nearby.id === "microphone") && clubQuest.clubShowReady ? startConcert : undefined}>
        {(nearby.id === "stage" || nearby.id === "microphone") && clubQuest.clubShowReady ? "Iniciar recital" : `Examinar ${nearby.label}`}
      </InteractionPrompt>}
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
    {concertPhase === "anomaly" && <div className="club-anomaly-overlay" role="status" aria-label="Interferencia desconocida"><span className="club-anomaly-symbol" aria-hidden="true">{"◇"}</span><strong>{"SEÑAL DESCONOCIDA"}</strong></div>}
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

  const invasionClueIndex=storeInvaded&&nearby?.id?.startsWith("invasion-clue-")?Number(nearby.id.slice(-1)):-1;
  const nearbyLabel=nearby?.kind === "coins" ? "E · Tomar monedas de la mesa" : nearby?.kind === "npc" ? (nearby.id === "jason" ? "E · Insistir con Jason" : "E · Hablar con " + (STORE_NPCS.find((entry) => entry.id === nearby.id)?.name || "personaje")) : nearby?.kind === "examine" ? "E · Examinar " + nearby.label : "E · Abrir la rockola";
  return <div ref={storeRef} className={"neon-record-store" + (storeAltered ? " is-altered" : "") + (storeInvaded ? " is-invaded" : "") + (listenerMinimized ? " listener-minimized" : " listener-open")} role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label="Tienda de discos Neonboy">
    <RecordStoreScene key={"store-"+(storeInvaded?combatRetryKey:0)} albums={DISCOGRAPHY_ALBUMS} playerSnapshotRef={storePlayerRef} onSelect={listenToAlbumFromScene} onNearby={setNearby}
      onOpenJukebox={openJukebox} onTakeCoins={takeCoins} onNpcInteract={openConversation} credits={credits} activeNpc={conversation?.npc || null} roxyPlaying={roxyPlaying} dancingSkeleton={dancingSkeleton} onViewChange={setFirstPerson}
      onJumpChange={setJumping} onSceneReady={({ ghostLoaded }) => { setStoreGhostLoaded(ghostLoaded); setStoreSceneReady(true); }}
      onExamine={examineStore} storeAltered={storeAltered} storeClueUnlocked={arcadeProgress.recordStoreJukeboxAnomalySeen}
      storeGhostPending={!arcadeProgress.recordStoreGhostSeen}
      storeEventRef={storeEventRef} storeInvaded={storeInvaded} storeInvasionProgress={storeInvasionProgress} storeInvasionCrateHeld={invasionCrateHeld}
      onStoreInvasionEvent={commitInvasion} onStoreInvasionCrateToggle={setInvasionCrateHeld}
      lostShipProgress={lostShipProgress} orbApiRef={orbApiRef} onOrbStatus={setOrbStatus} orbStatus={orbStatus} onCombatDamage={onCombatDamage}
      interactionLocked={paused || jukeboxOpen || Boolean(conversation) || archiveOpen || sessionsOpen || mapOpen || inventoryOpen || Boolean(storeEvent) || Boolean(storeMessage) || Boolean(invasionPanel) || (storeInvaded && combatHearts===0)} projectionPaused={jukeboxOpen} paused={paused || (storeInvaded && (mapOpen || inventoryOpen || Boolean(invasionPanel) || Boolean(conversation) || jukeboxOpen || Boolean(storeEvent) || combatHearts===0))} firstPerson={firstPerson}
      outsideVideo={outsideVideo} playbackApiRef={scenePlayerRef} />
    <div className="record-store-controls-hint">{storeInvaded ? "WASD: caminar | V: vista | C: visión | E: interactuar | F/Clic: Orbe Neon | R: recuperar | I: inventario" : firstPerson ? "WASD: caminar | Clic en escena: mirar con mouse | V: vista | Espacio: saltar | E: interactuar | I: inventario" : "WASD: caminar | Arrastrar: mirar | V: vista | Espacio: saltar | E: interactuar | I: inventario"}</div>
    {nearbyAlbum ? <div className="record-store-album-cue" role="status" aria-live="polite">
      <span className="record-store-album-cue-kicker">DISCO EN EXHIBICIÓN</span>
      <strong>{nearbyAlbum.name}</strong>
      <span className="record-store-album-cue-action">Presioná <kbd>E</kbd> {nearbyAlbum.tracks.length ? "para escuchar" : "para ver el disco"}</span>
    </div> : nearby && (storeInvaded&&nearby.kind==="examine"
      ? <InteractionPrompt className="record-store-nearby" aria-keyshortcuts="E" disabled={paused||jukeboxOpen||Boolean(conversation)||mapOpen||inventoryOpen||Boolean(invasionPanel)||Boolean(storeEvent)||combatHearts===0} onClick={()=>examineStore(nearby.id)}>{invasionClueIndex>=0&&storeInvasionProgress.jukeboxClues[invasionClueIndex]?"✓ Pista "+(invasionClueIndex+1)+" registrada · Volver a leer":nearbyLabel}</InteractionPrompt>
      : <InteractionPrompt className="record-store-nearby">{nearbyLabel}</InteractionPrompt>)}
    {encounterMessage && <div className="record-store-encounter-message" role="status" aria-live="polite">{encounterMessage}</div>}
    {storeEvent && <div className={"record-store-story-event record-store-story-event--" + storeEvent} role="status" aria-live="polite">
      <small>{storeEvent === "invasion" ? "CAPÍTULO 9 / LA INVASIÓN" : storeEvent === "intro" ? "CAPÍTULO 5" : storeEvent === "jukebox" ? "INTERFERENCIA / 09" : "UNA PRESENCIA EN LA TIENDA"}</small>
      <strong>{storeEvent === "invasion" ? "LA SEÑAL DEL ARCHIVISTA" : storeEvent === "intro" ? "EL REGRESO" : storeEvent === "jukebox" ? "LA PUERTA ESTÁ ABIERTA" : "¿QUIÉN ESTÁ AHÍ?"}</strong>
      <p>{storeEvent === "invasion" ? ["¡No puede ser! ¡La tienda de Tito!", "Esto se parece demasiado a lo que vi dentro de FREQUENCY 09.", "El Archivista llegó hasta Buenos Aires..."][storeEventLine] : storeEvent === "intro" ? ["Pará... esto no estaba así.", "Es la misma tienda que vi dentro de esa máquina.", "Pero todavía no está destruida..."][storeEventLine] :
        storeEvent === "jukebox" ? "La rockola se encendió sola. Algo responde desde FREQUENCY 09." :
          ["¿Quién está ahí?", "Eso no era una sombra...", "Había algo ahí. Y no parecía de este mundo."][storeEventLine]}</p>
      {storeEvent === "intro" && <span>Algo cruzó al otro lado.</span>}
      {storeEvent === "invasion" && <span>Los discos caídos vibran. Una sombra cruza el fondo.</span>}
    </div>}
    {storeMessage && <div className="record-store-investigation-note" role="status" aria-live="polite">
      <small>NEONBOY INVESTIGA</small><strong>{storeMessage.title}</strong>
      {storeMessage.lines.map((line) => <p key={line}>{line}</p>)}
      <button type="button" onClick={() => setStoreMessage(null)}>Continuar</button>
    </div>}
    <div className="record-store-arcade-hud"><span><Coins size={16} /> {credits}/10 monedas</span><button type="button" onClick={openJukebox}><Film size={17} /> Abrir rockola</button>{inventoryButton}{storeInvaded&&<button type="button" onClick={()=>setInvasionPanel("diary")}>DIARIO</button>}<button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button>{masterTape.phase === "complete" && <button type="button" className="neon-sessions-trigger" onClick={() => setSessionsOpen(true)}>NEON SESSIONS</button>}</div>
    <div className="record-store-status-stack">
      <div className="record-store-view-status" role="status">{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"}{jumping ? " · SALTANDO" : ""}</div>
      {storeInvaded ? <UniverseMissionCard className="store-invasion-mission" title="La señal del Archivista" kind="signal" description={storeInvasionProgress.coreNeutralized ? "Señal local desactivada / Corrupción global activa" : "Buenos Aires 1999 / Tienda invadida"} objective={storeInvasionObjective(storeInvasionProgress)} details={[`Focos ${[storeInvasionProgress.jukeboxOff,storeInvasionProgress.archiveOff,storeInvasionProgress.transmissionOff].filter(Boolean).length}/3`,storeInvasionProgress.ghostDefeated&&"Aparición disipada",storeInvasionProgress.bossDefeated&&"Entidad derrotada"]}/>
        : arcadeProgress.recordStoreFutureVisionSeen
        ? <UniverseMissionCard className="frequency-objective" title="El futuro que no existe"
          description="La visión mostró un futuro que todavía no ocurrió." objective={storeInvestigationObjective(arcadeProgress)} />
        : <ClubShowHud quest={clubQuest} masterTape={masterTape} scene="store" />}
      {!storeInvaded&&<MasterTapeHud progress={masterTape} scene="store" />}
      {storyProgress.duelCompleted && !storyProgress.archiveUnlocked && !conversation && <div className="record-store-quest-badge">✓ DUELO GANADO · Volvé con Tito</div>}
      {storyProgress.archiveUnlocked && !conversation && !archiveOpen && !jukeboxOpen && <button type="button" className="record-store-archive-trigger" onClick={() => setArchiveOpen(true)}>ARCHIVO PROHIBIDO</button>}
    </div>
    {storeInvaded&&<>
      <div className="store-invasion-vision"><button type="button" className={storeInvasionProgress.visionActive?"is-active":""} aria-pressed={storeInvasionProgress.visionActive} disabled={paused||Boolean(invasionPanel)||combatHearts===0} onClick={()=>commitInvasion("vision-toggle")}>VISI&Oacute;N DE FRECUENCIA <kbd>C</kbd> / {storeInvasionProgress.visionActive?"ACTIVA":"INACTIVA"}</button></div>
      <div className="store-invasion-hearts" role="status" aria-label={"Salud "+combatHearts+" de 3"}>{Array.from({length:3},(_,i)=><span key={i}>{i<combatHearts?"♥":"♡"}</span>)}</div>
      <NeonOrbHud progress={lostShipProgress} status={orbStatus} label="BUENOS AIRES" locked={paused||mapOpen||inventoryOpen||Boolean(conversation)||jukeboxOpen||Boolean(invasionPanel)||Boolean(storeEvent)||combatHearts===0} onFire={()=>orbApiRef.current?.fire()} onRecall={()=>orbApiRef.current?.recall()}/>
      {invasionCrateHeld&&<div className="store-invasion-crate-cue">CAJA SUJETA / W-S mover / E soltar</div>}
      {invasionNotice&&<div className="store-invasion-notice" role="status" aria-live="polite">{invasionNotice}</div>}
      {damageTick>0&&<div key={damageTick} className="parthenon-damage" aria-hidden="true"/>}
      {combatHearts===0&&<div className="parthenon-fallen"><section className="parthenon-fallen-card" role="dialog" aria-modal="true" aria-label="Has caido"><h2>LA SEÑAL TE ALCANZÓ</h2><p>Los focos y las pistas ya resueltos se conservan.</p><button type="button" onClick={retryCombat}>Reintentar desde el checkpoint</button></section></div>}
      {invasionPanel&&<StoreInvasionPanel mode={invasionPanel} progress={storeInvasionProgress} onAction={commitInvasion} onClose={()=>setInvasionPanel(null)}/>}
    </>}
    {clubNoticePanel}
    {inventoryToast}

    <header className="record-store-header">
      <div className="record-store-brand"><span>NEONBOY MUSIC · DESDE HALLOWEEN</span><h2>LA TIENDA DE LOS DISCOS</h2><p>Entrá y recorré la discografía como en una disquería de los 90.</p></div>
      {onClose && <button ref={closeRef} type="button" onClick={onClose}><ArrowLeft size={17} /> {standalone ? "Ir a Juego" : "Volver al menú"}</button>}
    </header>

    <div className="record-store-content">
      <aside className={"record-store-listener" + (listenerMinimized ? " is-minimized" : "") + (sidebarTab === "discs" ? " is-catalog-tab" : "")} aria-label="Puesto de escucha"
        onPointerEnter={(event) => { if (event.pointerType === "mouse" && !listenerPinned) setListenerMinimized(false); }}
        onPointerLeave={(event) => { if (event.pointerType === "mouse" && !listenerPinned) setListenerMinimized(true); }}>
        {listenerMinimized && <button type="button" className="record-store-listener-handle" aria-label="Abrir panel de música" aria-controls="record-store-listener-body" aria-expanded="false"
          onClick={() => { setListenerPinned(true); setListenerMinimized(false); }}><Headphones size={20} /><span>MÚSICA</span><ChevronLeft size={16} /></button>}
        <div className="record-store-listener-top">
          <Headphones size={25} />
          <div><span>PUESTO DE ESCUCHA · 199X</span><strong>ESTACIÓN DE ESCUCHA</strong><small className="record-store-listener-summary">{album.name}{currentTrack ? " · " + currentTrack.name : ""}</small></div>
          <i>{listenerStatus}</i>
          <button type="button" className={"record-store-panel-toggle record-store-panel-pin" + (listenerPinned ? " is-pinned" : "")}
            aria-label={listenerPinned ? "Desfijar panel de música" : "Fijar panel de música"} aria-pressed={listenerPinned}
            title={listenerPinned ? "Desfijar panel" : "Fijar panel abierto"} onClick={() => setListenerPinned((value) => !value)}><Pin size={14} /></button>
          <button type="button" className="record-store-panel-toggle" aria-label="Minimizar panel de música"
            title="Minimizar panel de música" onClick={() => { setListenerPinned(false); setListenerMinimized(true); }}><Minimize2 size={14} /></button>
        </div>
        <div className="record-store-sidebar-tabs" role="tablist" aria-label="Panel de la tienda">
          <button id="record-store-tab-listen" type="button" role="tab" aria-selected={sidebarTab === "listen"} aria-controls="record-store-listener-body" onClick={() => setSidebarTab("listen")}><Headphones size={15} /> Escuchar</button>
          <button id="record-store-tab-discs" type="button" role="tab" aria-selected={sidebarTab === "discs"} aria-controls="record-store-catalog-tab" onClick={() => setSidebarTab("discs")}><Disc3 size={15} /> Discos</button>
        </div>
      <section id="record-store-catalog-tab" className="record-store-wall" role="tabpanel" aria-labelledby="record-store-tab-discs" hidden={sidebarTab !== "discs"}>
        <div className="record-store-wall-heading">
          <span><Disc3 size={18} /> DISCOS / COLECCIONES</span>
          <small>{DISCOGRAPHY_ALBUMS.length} discos</small>
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

        <div id="record-store-listener-body" className="record-store-listener-body" role="tabpanel" aria-labelledby="record-store-tab-listen" hidden={sidebarTab !== "listen"}>
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
