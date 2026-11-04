import React from "react";
import { createRoot } from "react-dom/client";
import HalloweenStoreApp from "./HalloweenStoreApp.jsx";
import "./halloween.css";
import faviconUrl from "../../src/assets/neonboy-logo.png";

document.getElementById("halloween-favicon").href = faviconUrl;

createRoot(document.getElementById("root")).render(<HalloweenStoreApp />);
