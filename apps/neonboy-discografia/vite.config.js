import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("./", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));

export default defineConfig({
  root: appRoot,
  base: "./",
  publicDir: false,
  server: { fs: { allow: [workspaceRoot] } },
  build: {
    outDir: fileURLToPath(new URL("../../dist-discografia/", import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Keep progress and save modules in the menu when they are also used by a scene.
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          const path = id.replaceAll("\\", "/");
          if (path.endsWith("/three/build/three.core.js")) return "three-core";
          if (path.endsWith("/three/build/three.module.js")) return "three-webgl";
          if (path.includes("/three/examples/jsm/")) return "three-addons";
          if (path.endsWith("/src/game/matrixScenery.js") || path.endsWith("/src/game/matrixGraphics.js")) return "matrix-world";
          return undefined;
        }
      }
    }
  }
});
