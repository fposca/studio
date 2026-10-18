import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import RecordStoreAlbumPlayer from "../../src/game/RecordStoreAlbumPlayer.jsx";
import "../../src/game/discographyStore.css";

const tracks = [
  { name: "Anubis Servant", videoId: "bjlfrB-15P4", url: "https://www.youtube.com/watch?v=bjlfrB-15P4" },
  { name: "Udjat", videoId: "gkcQWmWGUSY", url: "https://www.youtube.com/watch?v=gkcQWmWGUSY" }
];

function Fixture() {
  const [index, setIndex] = useState(0);
  const [playback, setPlayback] = useState("loading");
  return <main className="neon-record-store" style={{ position: "relative", minHeight: "100vh" }}>
    <aside className="record-store-listener" style={{ position: "relative", inset: "auto", width: 305, height: 690 }}>
      <output data-testid="playback">{playback}</output>
      <button type="button" onClick={() => { setIndex(1); setPlayback("loading"); }}>Elegir Udjat</button>
      <RecordStoreAlbumPlayer key={tracks[index].videoId} albumName="Glowshine" track={tracks[index]} onPlaybackChange={setPlayback} playRequest={index} />
    </aside>
  </main>;
}

createRoot(document.getElementById("root")).render(<Fixture />);
