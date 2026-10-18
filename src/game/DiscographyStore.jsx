import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Coins, Disc3, Film, Headphones, MapPinned, Maximize2, Minimize2, Music2, Play } from "lucide-react";
import RecordStoreScene from "./RecordStoreScene.jsx";
import NeonUniverseMap from "./NeonUniverseMap.jsx";
import RecordStoreJukebox from "./RecordStoreJukebox.jsx";
import RecordStoreAlbumPlayer from "./RecordStoreAlbumPlayer.jsx";
import RecordStoreConversation from "./RecordStoreConversation.jsx";
import { getStoreVoiceUrl } from "./recordStoreVoices.js";
import { STORE_NPCS, loadStoreProgress, saveStoreProgress, meetStoreNpc, getStoreDialogueNode, chooseStoreDialogue } from "./recordStoreDialogue.js";
import { ROCKOLA_VIDEOS } from "./recordStoreVideos.js";
import { BAND_LOGO, DISCOGRAPHY_ALBUMS, DISCOGRAPHY_GROUPS } from "./discographyCatalog.js";
import { STUDIO_EXAMINE } from "./studioLayout.js";
import RecordingStudioDevPanel from "./RecordingStudioDevPanel.jsx";
import { loadStudioAssetTransforms } from "./studioAssets.js";
import "./recordingStudio.css";
import "./discographyStore.css";

export { DISCOGRAPHY_ALBUMS } from "./discographyCatalog.js";

export default function DiscographyStore({ onClose, standalone = false }) {
  const [selectedId, setSelectedId] = useState(DISCOGRAPHY_ALBUMS[0].id);
  const [activeGroup, setActiveGroup] = useState("instrumental");
  const [trackIndex, setTrackIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [listenerPlayback, setListenerPlayback] = useState("stopped");
  const [listenerPlayRequest, setListenerPlayRequest] = useState(0);
  const [nearby, setNearby] = useState(null);
  const [credits, setCredits] = useState(0);
  const [jukeboxOpen, setJukeboxOpen] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(null);
  const [jukeboxPlaying, setJukeboxPlaying] = useState(false);
  const [outsideVideo, setOutsideVideo] = useState(null);
  const [firstPerson, setFirstPerson] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [albumsMinimized, setAlbumsMinimized] = useState(false);
  const [listenerMinimized, setListenerMinimized] = useState(false);
  const [storyProgress, setStoryProgress] = useState(() => loadStoreProgress());
  const [conversation, setConversation] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [activeScene, setActiveScene] = useState("store");
  const [studioMessage, setStudioMessage] = useState(null);
  const [studioTransforms, setStudioTransforms] = useState(() => loadStudioAssetTransforms());
  const [encounterMessage, setEncounterMessage] = useState(null);
  const [dancingSkeleton, setDancingSkeleton] = useState(null);
  const creditsRef = useRef(0);
  const jukeboxPlayerRef = useRef(null);
  const scenePlayerRef = useRef(null);
  const playbackRef = useRef({ seconds: 0, playing: true });
  const storeRef = useRef(null);
  const closeRef = useRef(null);
  const mapReturnFocusRef = useRef(null);
  const storePlayerRef = useRef(null);
  const studioPlayerRef = useRef(null);
  const studioTransformsRef = useRef(studioTransforms);
  studioTransformsRef.current = studioTransforms;
  const studioAssetApiRef = useRef(null);
  const jasonAttemptsRef = useRef(0);
  const encounterTimerRef = useRef(null);
  const danceTimerRef = useRef(null);
  const specialAudioRef = useRef(null);

  const album = DISCOGRAPHY_ALBUMS.find((entry) => entry.id === selectedId) || DISCOGRAPHY_ALBUMS[0];
  const tracks = album.tracks;
  const visibleAlbums = DISCOGRAPHY_ALBUMS.filter((entry) => entry.group === activeGroup);
  const nearbyAlbum = nearby?.kind === "album" ? DISCOGRAPHY_ALBUMS.find((entry) => entry.id === nearby.id) : null;
  const currentTrack = listening ? tracks[trackIndex] : null;
  const listenerStatus = !currentTrack ? "STANDBY" : ({ playing: "ON AIR", paused: "PAUSA", stopped: "STOP", ready: "LISTO", native: "VIDEO" })[listenerPlayback] || "CARGANDO";
  const roxyPlaying = jukeboxOpen ? jukeboxPlaying : Boolean(outsideVideo?.playing);
  const dialogueContext = { credits, currentSong: currentTrack?.name || (outsideVideo?.playing ? outsideVideo.title : null), currentAlbum: currentTrack ? album.name : null };
  const conversationNpc = conversation && STORE_NPCS.find((entry) => entry.id === conversation.npc);
  const conversationNode = conversation && getStoreDialogueNode(conversation.npc, conversation.nodeId, storyProgress, dialogueContext);

  useEffect(() => { if (!standalone) closeRef.current?.focus(); }, [standalone]);
  useEffect(() => {

    const onKeyDown = (event) => {
      if (event.code === "KeyM" && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "") && !event.target?.isContentEditable && (mapOpen || (!jukeboxOpen && !conversation && !archiveOpen))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (mapOpen) closeMap(); else openMap();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (mapOpen) closeMap();
        else if (archiveOpen) setArchiveOpen(false);
        else if (conversation) closeConversation();
        else if (jukeboxOpen) closeJukebox();
        else if (activeScene === "studio") openMap();
        else onClose?.();
      }
      if (event.key === "Tab") {
        const focusRoot = mapOpen ? storeRef.current?.querySelector(".universe-map") : jukeboxOpen ? storeRef.current?.querySelector(".record-jukebox") : archiveOpen ? storeRef.current?.querySelector(".record-store-archive") : conversation ? storeRef.current?.querySelector(".record-store-conversation") : storeRef.current;
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
  }, [onClose, standalone, jukeboxOpen, activeVideoIndex, conversation, archiveOpen, mapOpen, activeScene]);
  useEffect(() => { saveStoreProgress(storyProgress); }, [storyProgress]);
  useEffect(() => () => {
    clearTimeout(encounterTimerRef.current);
    clearTimeout(danceTimerRef.current);
    specialAudioRef.current?.pause();
  }, []);
  useEffect(() => { if ((jukeboxOpen || conversation || archiveOpen || mapOpen) && document.pointerLockElement) document.exitPointerLock(); }, [jukeboxOpen, conversation, archiveOpen, mapOpen]);

  function openMap() {
    mapReturnFocusRef.current = document.activeElement;
    if (document.pointerLockElement) document.exitPointerLock();
    setMapOpen(true);
  }

  function closeMap() {
    setMapOpen(false);
    requestAnimationFrame(() => mapReturnFocusRef.current?.focus?.());
  }

  function enterScenario(destination) {
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
      setActiveScene("studio");
    } else if (destination === "discography") {
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
    const item = STUDIO_EXAMINE.find((entry) => entry.id === id);
    if (item) setStudioMessage({ id, text: item.text });
  }

  function openConversation(npcId) {
    if (conversation || jukeboxOpen || archiveOpen || !STORE_NPCS.some((entry) => entry.id === npcId)) return;
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
    if (conversation) setStoryProgress((progress) => meetStoreNpc(progress, conversation.npc));
    setConversation(null);
  }

  function chooseConversationOption(optionId, label) {
    if (!conversation) return;
    const result = chooseStoreDialogue(conversation.npc, conversation.nodeId, optionId, storyProgress, dialogueContext);
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

  if (activeScene === "studio") return <div ref={storeRef} className="neon-record-store neon-recording-studio" role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label="Neon Recording Studio 1999">
    <RecordStoreScene scenario="studio" albums={DISCOGRAPHY_ALBUMS} onNearby={setNearby} onExamine={examineStudio}
      onViewChange={setFirstPerson} onJumpChange={setJumping} interactionLocked={mapOpen} firstPerson={firstPerson}
      playerSnapshotRef={studioPlayerRef} studioTransformsRef={studioTransformsRef} studioAssetApiRef={studioAssetApiRef} />
    <header className="studio-header">
      <div><span>NEONBOY UNIVERSE / EST. 1999</span><h2>NEON RECORDING STUDIO</h2><p>Sala de control · Cabina de grabación</p></div>
      <button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button>
    </header>
    <div className="studio-control-hint">WASD: caminar &nbsp;|&nbsp; Arrastrar: mirar &nbsp;|&nbsp; Espacio: saltar &nbsp;|&nbsp; E: examinar &nbsp;|&nbsp; M: mapa</div>
    {nearby?.kind === "examine" && <div className="studio-examine-cue" role="status">[E] Examinar {nearby.label}</div>}
    {studioMessage && <div className="studio-examine-message" role="status" aria-live="polite"><small>NEONBOY EXAMINA / {STUDIO_EXAMINE.find((entry) => entry.id === studioMessage.id)?.label}</small><p>{studioMessage.text}</p><button type="button" onClick={() => setStudioMessage(null)} aria-label="Cerrar examen">&times;</button></div>}
    {import.meta.env.DEV && !mapOpen && <RecordingStudioDevPanel transforms={studioTransforms} onChange={changeStudioTransforms} />}
    {mapOpen && <NeonUniverseMap onClose={closeMap} onEnter={enterScenario} />}
    <footer className="studio-footer"><span>CONTROL ROOM · 1999</span><span>{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"}{jumping ? " · SALTANDO" : ""}</span><span>NEONBOY RECORDING</span></footer>
  </div>;

  return <div ref={storeRef} className={"neon-record-store" + (albumsMinimized ? " albums-minimized" : "") + (listenerMinimized ? " listener-minimized" : "")} role={standalone ? "region" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label="Tienda de discos Neonboy">
    <RecordStoreScene albums={DISCOGRAPHY_ALBUMS} playerSnapshotRef={storePlayerRef} onSelect={listenToAlbumFromScene} onNearby={setNearby}
      onOpenJukebox={openJukebox} onTakeCoins={takeCoins} onNpcInteract={openConversation} credits={credits} activeNpc={conversation?.npc || null} roxyPlaying={roxyPlaying} dancingSkeleton={dancingSkeleton} onViewChange={setFirstPerson}
      onJumpChange={setJumping} interactionLocked={jukeboxOpen || Boolean(conversation) || archiveOpen || mapOpen} projectionPaused={jukeboxOpen} firstPerson={firstPerson}
      outsideVideo={outsideVideo} playbackApiRef={scenePlayerRef} />
    <div className="record-store-controls-hint">{firstPerson ? "WASD: caminar · Clic en escena: mirar con mouse · V: vista · Espacio: saltar · E: interactuar" : "WASD: caminar · Arrastrar: mirar · V: vista · Espacio: saltar · E: interactuar"}</div>
    <div className="record-store-view-status" role="status">{firstPerson ? "PRIMERA PERSONA" : "TERCERA PERSONA"}{jumping ? " · SALTANDO" : ""}</div>
    {nearbyAlbum ? <div className="record-store-album-cue" role="status" aria-live="polite">
      <span className="record-store-album-cue-kicker">DISCO EN EXHIBICIÓN</span>
      <strong>{nearbyAlbum.name}</strong>
      <span className="record-store-album-cue-action">Presioná <kbd>E</kbd> {nearbyAlbum.tracks.length ? "para escuchar" : "para ver el disco"}</span>
    </div> : nearby && <div className="record-store-nearby" role="status">{nearby.kind === "coins" ? "E · Tomar monedas de la mesa" : nearby.kind === "npc" ? (nearby.id === "jason" ? "E · Insistir con Jason" : "E · Hablar con " + (STORE_NPCS.find((entry) => entry.id === nearby.id)?.name || "personaje")) : "E · Abrir la rockola"}</div>}
    {encounterMessage && <div className="record-store-encounter-message" role="status" aria-live="polite">{encounterMessage}</div>}
    <div className="record-store-arcade-hud"><span><Coins size={16} /> {credits}/10 monedas</span><button type="button" onClick={openJukebox}><Film size={17} /> Abrir rockola</button><button type="button" onClick={openMap} aria-keyshortcuts="M"><MapPinned size={17} /> MAPA</button></div>

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
            {currentTrack ? <RecordStoreAlbumPlayer key={album.id + ":" + currentTrack.videoId} albumName={album.name} track={currentTrack} onPlaybackChange={setListenerPlayback} playRequest={listenerPlayRequest} /> : <p className="record-store-play-hint">Elegí una canción para escucharla acá.</p>}
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
    {jukeboxOpen && <RecordStoreJukebox credits={credits} onCollect={takeCoins} onSpend={spendCoin} onClose={closeJukebox}
      activeIndex={activeVideoIndex} onActiveChange={selectJukeboxVideo} startAt={playbackRef.current.seconds} startPlaying={playbackRef.current.playing}
      onPlaybackChange={setJukeboxPlaying} playerApiRef={jukeboxPlayerRef} />}
    {mapOpen && <NeonUniverseMap onClose={closeMap} onEnter={enterScenario} />}
    <footer className="record-store-footer"><span>✦ NACIDO EN HALLOWEEN ✦</span><span>NEONBOY · DISCOS, MISTERIO Y VOLUMEN</span><span>31 OCT / ABIERTO TODA LA NOCHE</span></footer>
  </div>;
}
