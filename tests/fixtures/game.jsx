import React from "react";
import { createRoot } from "react-dom/client";
import NeonGame from "../../src/game/NeonGame.jsx";
import "../../src/styles.css";

if (!import.meta.env.DEV) throw new Error("Development fixture only");
const root = createRoot(document.getElementById("game-root"));
window.unmountGame = () => root.unmount();
root.render(<NeonGame onReady={(game) => { window.game = game; }} />);
