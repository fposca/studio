import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import DiscographyStore from "./game/DiscographyStore.jsx";
import NeonUniverseApp from "./game/NeonUniverseApp.jsx";
import "./styles.css";

const isDiscographyRoute = /^\/discografia\/?$/i.test(window.location.pathname);
const directScene = new URLSearchParams(window.location.search).get("direct") === "1";

createRoot(document.getElementById("root")).render(
  isDiscographyRoute
    ? (directScene ? <DiscographyStore standalone onClose={() => { window.location.href = "/"; }} /> : <NeonUniverseApp />)
    : <AuthProvider><App /></AuthProvider>
);