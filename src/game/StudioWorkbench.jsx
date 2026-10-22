import React, { useEffect, useRef, useState } from "react";
import { STUDIO_CHANNELS, STUDIO_SESSIONS } from "./studioDialogue.js";
import { HUGO_ALBUMS, getHugoAlbum } from "./studioHugoCatalog.js";
import RecordStoreAlbumPlayer from "./RecordStoreAlbumPlayer.jsx";

const archiveItems = [
  { flag: "wakeUpInfo", title: "Wake Up", text: "Hugo grabó partes de guitarra, incluido un solo." },
  { flag: "jesusIsKingInfo", title: "Jesus is King", text: "Hugo contribuyó con guitarras." },
  { flag: "newBornInfo", title: "New Born", text: "Hugo participó con guitarras." }
];

export default function StudioWorkbench({ mode, albumId = null, progress, masterTape, onClose, onExplore, paused = false }) {
  const [selected, setSelected] = useState(null);
  const [activeAlbumId, setActiveAlbumId] = useState(albumId);
  const [trackIndex, setTrackIndex] = useState(null);
  const [volume, setVolume] = useState(75);
  const closeButton = useRef(null);
  useEffect(() => { closeButton.current?.focus(); }, [mode]);

  const computer = mode === "computer";
  const consoleMode = mode === "console";
  const albumMode = mode === "album";
  const title = computer ? "Archivo de sesiones" : consoleMode ? "Explorar la consola" :
    albumMode ? "Discografía de Hugo Mendez" : "Archivo del estudio";
  const items = computer ? STUDIO_SESSIONS : STUDIO_CHANNELS;
  const current = items.find((item) => item.id === selected);
  const album = getHugoAlbum(activeAlbumId);
  const track = trackIndex === null ? null : album?.tracks[trackIndex];
  const showAlbums = albumMode || (computer && activeAlbumId !== null);
  const sessionsUnlocked = progress.studioComputerUnlocked;

  function select(item) {
    setSelected(item.id);
    onExplore(computer ? "computer" : "console", item.id);
  }
  function selectAlbum(id) {
    setActiveAlbumId(id);
    setTrackIndex(null);
  }
  function adjacentTrack(delta) {
    if (!album?.tracks.length) return;
    setTrackIndex((currentIndex) => (currentIndex + delta + album.tracks.length) % album.tracks.length);
  }

  return <div className="record-store-conversation-overlay studio-workbench-overlay">
    <section className="studio-workbench" role="dialog" aria-modal="true" aria-label={title}>
      <header className="studio-workbench-bar">
        <span>NEON RECORDING STUDIO · 1999</span>
        <button ref={closeButton} type="button" onClick={onClose} aria-label={"Cerrar " + title}>×</button>
      </header>
      <div className="studio-workbench-body">
        <small>{showAlbums ? (computer ? "PC / HUGO MENDEZ / DISCOGRAFÍA" : "GALERÍA / HUGO MENDEZ / DISCOGRAFÍA") :
          computer ? "PC / ARCHIVO DE SESIONES" : consoleMode ? "CONSOLA / CANALES" : "DOCUMENTOS DESBLOQUEADOS"}</small>
        <h3>{showAlbums ? "Hugo Mendez · Discografía" : title}</h3>
        {computer && !showAlbums && <p>Una reconstrucción informativa del trabajo en el estudio. No son archivos de sesión ni pistas de audio reales.</p>}
        {consoleMode && masterTape?.phase === "review" && <p className="master-tape-console-progress">El máster perdido · Revisá guitarra, bajo y batería ({masterTape.reviewed.length}/3). Guitarra rítmica o solista cuentan como guitarra.</p>}
        {consoleMode && <p>Seleccioná un canal para entender su función. No hay stems disponibles para reproducir instrumentos por separado.</p>}
        {mode === "archive" ? <>
          {archiveItems.filter((item) => progress[item.flag]).length === 0 && !progress.missionComplete &&
            <p>Hablá con Hugo sobre sus colaboraciones para desbloquear estas fichas.</p>}
          <div className="studio-workbench-archive">
            <article><strong>Hugo Mendez — guitarrista y productor musical</strong><p>Profesor de guitarra de NeonBoy, productor y colaborador de Dock Sud, Avellaneda. Vinculado al blues. Participó con guitarras en Wake Up, Jesus is King y New Born.</p></article>
            {archiveItems.filter((item) => progress[item.flag]).map((item) =>
              <article key={item.flag}><strong>{item.title}</strong><p>{item.text}</p></article>)}
            {progress.missionComplete && <article>
              <strong>Cómo se produce la música de NeonBoy</strong>
              <p>NeonBoy compone sus temas y lleva las grabaciones y pistas al estudio. Hugo escucha las ideas, propone arreglos y mejoras, edita y trabaja con las pistas, equilibra los instrumentos y realiza mezcla y masterización. También grabó guitarras en canciones de NeonBoy.</p>
            </article>}
          </div>
        </> : showAlbums ? <>
          {computer && <button className="studio-album-back" type="button" onClick={() => { setActiveAlbumId(null); setTrackIndex(null); }}>← Volver a sesiones</button>}
          <p>Profesor de guitarra de NeonBoy, productor musical y guitarrista de blues de Dock Sud, Avellaneda. Su discografía se presenta por separado de las sesiones de NeonBoy.</p>
          <nav className="studio-album-tabs" aria-label="Discos de Hugo Mendez">
            {HUGO_ALBUMS.map((entry) => <button key={entry.id} type="button" aria-pressed={entry.id === album?.id}
              onClick={() => selectAlbum(entry.id)}>{entry.name}</button>)}
          </nav>
          {album && <div className="studio-album-detail">
            <img src={album.cover} alt={"Portada de " + album.name} />
            <div className="studio-album-info">
              <small>HUGO MENDEZ / DISCO</small>
              <h4>{album.name}</h4>
              <p><strong>Artista:</strong> {album.artist} · <strong>Año:</strong> {album.year || "No informado"}</p>
              <p><strong>Canciones:</strong> {album.totalTracks || "No informado"} · {album.status}</p>
              {album.totalTracks && album.tracks.length < album.totalTracks &&
                <p>Hay {album.totalTracks - album.tracks.length} canciones pendientes de identificar. Se muestran únicamente los enlaces recibidos.</p>}
            </div>
          </div>}
          {album?.tracks.length ? <div className="studio-album-track-layout">
            <nav aria-label={"Canciones de " + album.name} className="studio-album-tracks">
              {album.tracks.map((entry, index) => <button key={entry.videoId} type="button"
                aria-pressed={trackIndex === index} onClick={() => setTrackIndex(index)}>
                <span>{String(entry.playlistIndex || index + 1).padStart(2, "0")}</span>{entry.name}
              </button>)}
            </nav>
            <div className="studio-album-player">
              {track ? <RecordStoreAlbumPlayer paused={paused} key={album.id + ":" + track.videoId} artist={album.artist}
                albumName={album.name} track={track} volume={volume} onVolumeChange={setVolume}
                onPrevious={() => adjacentTrack(-1)} onNext={() => adjacentTrack(1)} /> :
                <p>Elegí un tema para verlo y escucharlo. La reproducción comienza al seleccionarlo.</p>}
            </div>
          </div> : <p>La portada está disponible; todavía no se recibieron enlaces para las canciones de este disco.</p>}
        </> : computer && !sessionsUnlocked ? <>
          <p>Hugo está trabajando en las sesiones de NeonBoy. Su discografía personal está abierta para escucharla.</p>
          <button className="studio-folder" type="button" onClick={() => selectAlbum(HUGO_ALBUMS[0].id)}>♫ HUGO MENDEZ — DISCOGRAFÍA</button>
        </> : <>
          {computer && <button className="studio-folder" type="button" onClick={() => selectAlbum(HUGO_ALBUMS[0].id)}>♫ HUGO MENDEZ — DISCOGRAFÍA</button>}
          <div className="studio-workbench-grid">
            <nav aria-label={computer ? "Canciones del archivo" : "Canales de la consola"}>
              {items.map((item, index) => <button key={item.id} type="button"
                aria-pressed={selected === item.id} onClick={() => select(item)}>
                <span>{String(index + 1).padStart(2, "0")}</span>{item.title}
              </button>)}
            </nav>
            <div className="studio-workbench-detail" aria-live="polite">
              {current ? <>
                <small>{computer ? "FICHA DE COLABORACIÓN" : "FUNCIÓN EN LA MEZCLA"}</small>
                <h4>{current.title}</h4>
                <p>{computer ? current.credit : current.description}</p>
                {computer && current.videoId && <a className="studio-session-video" href={"https://www.youtube.com/watch?v=" + current.videoId} target="_blank" rel="noopener noreferrer">Ver video de {current.title} en YouTube ↗</a>}
                {computer && <p>En el trabajo de producción, las pistas se escuchan, editan, ordenan y equilibran antes de la masterización.</p>}
              </> : <p>Elegí {computer ? "una canción" : "un canal"} para ver su información.</p>}
            </div>
          </div>
        </>}
      </div>
      <footer>{showAlbums ? "HUGO MENDEZ · ENLACES DE YOUTUBE PROPORCIONADOS POR EL ARTISTA" : "EXPERIENCIA EDUCATIVA · SIN AUDIO MULTIPISTA SIMULADO"}</footer>
    </section>
  </div>;
}
