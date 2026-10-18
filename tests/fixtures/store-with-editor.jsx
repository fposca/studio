import React, { lazy, Suspense, useState } from "react";
import { createRoot } from "react-dom/client";
import DiscographyStore from "../../src/game/DiscographyStore.jsx";
import "../../src/styles.css";

const ThreeDEditor = lazy(() => import("../../src/editors/ThreeDEditor.jsx"));
const startsInEditor = new URLSearchParams(location.search).get("start") === "editor";

function Fixture() {
  const [mode, setMode] = useState(startsInEditor ? "editor" : "store");
  const [threeOpened, setThreeOpened] = useState(startsInEditor);
  window.enterStore = () => setMode("store");
  window.openHiddenEditor = () => setThreeOpened(true);
  return <>
    <div style={{ display: mode === "editor" ? "block" : "none", height: "100dvh" }}>
      {(mode === "editor" || threeOpened) && <Suspense fallback={null}><ThreeDEditor active={mode === "editor"} /></Suspense>}
    </div>
    {mode === "store" && <DiscographyStore standalone onClose={() => {}} />}
  </>;
}

createRoot(document.getElementById("root")).render(<Fixture />);
