import React from "react";
import { createRoot } from "react-dom/client";
import DiscographyStore from "../../src/game/DiscographyStore.jsx";
import "./standalone.css";

createRoot(document.getElementById("root")).render(<DiscographyStore standalone />);
