import { mergeConfig } from "vite";
import { fileURLToPath } from "node:url";
import halloweenConfig from "./vite.config.js";

// Keep the website output untouched; Capacitor bundles this separate build.
export default mergeConfig(halloweenConfig, {
  base: "./",
  build: {
    outDir: fileURLToPath(new URL("../../dist-halloween-android/", import.meta.url)),
  },
});
