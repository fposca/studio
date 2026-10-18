import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import DiscographyStore from "./game/DiscographyStore.jsx";
import "./styles.css";

const isDiscographyRoute = /^\/discografia\/?$/i.test(window.location.pathname);

createRoot(document.getElementById("root")).render(
  isDiscographyRoute
    ? <DiscographyStore standalone onClose={() => { window.location.href = "/"; }} />
    : <AuthProvider><App /></AuthProvider>
);