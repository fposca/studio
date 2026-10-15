import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import ThreeDEditor from "../../src/editors/ThreeDEditor.jsx";
import NeonGame from "../../src/game/NeonGame.jsx";
import "../../src/styles.css";

function EditorFixture() {
  const [active, setActive] = useState(true);
  window.setEditorActive = setActive;
  return <>
    <div style={{ height: "100%", display: active ? "block" : "none" }}><ThreeDEditor active={active} /></div>
    {!active && <div style={{ height: "100%" }}><NeonGame onReady={(game) => { window.game = game; }} /></div>}
  </>;
}

createRoot(document.getElementById("editor-root")).render(<EditorFixture />);
