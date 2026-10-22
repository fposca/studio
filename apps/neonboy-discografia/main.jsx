import React from "react";
import { createRoot } from "react-dom/client";
import NeonUniverseApp from "../../src/game/NeonUniverseApp.jsx";
import "./standalone.css";

createRoot(document.getElementById("root")).render(<NeonUniverseApp />);
