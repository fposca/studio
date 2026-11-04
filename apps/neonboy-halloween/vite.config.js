import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));
// Repoint only the standalone Halloween build to compressed character copies.
// The source modules and their full-resolution GLB files stay untouched.
const mobileModels = {
  "vendedor.store.glb": "vendedor.mobile.glb",
  "metalero.store.glb": "rulo-respira.mobile.glb",
  "mujer-quieta.store.glb": "mujer-quieta.mobile.glb",
  "freddy-quieto.store.glb": "reemplazo-freddy-respirar.mobile.glb",
  "jason-respirado.store.glb": "reemplazo-jason-respirar.mobile.glb",
  "freddy-caminar.anim.glb": "remplazo-fredy-caminar.anim.mobile.glb",
  "jason-walk.anim.glb": "reemplazo-jason-caminar.anim.mobile.glb",
  "esuqeleto-bailando.store.glb": "esuqeleto-bailando.mobile.glb"
};
function halloweenMobileModels() {
  return {
    name: "halloween-mobile-models",
    enforce: "pre",
    transform(code, id) {
      const source = id.replace(/\\/g, "/").split("?")[0];
      if (!source.endsWith("/src/game/recordStoreDialogue.js") && !source.endsWith("/src/game/recordStoreNpcActors.js")) return null;
      let updated = code;
      for (const [original, mobile] of Object.entries(mobileModels)) {
        updated = updated.replaceAll(`../assets/neonboy-animaciones/${original}`, `../../apps/neonboy-halloween/models/${mobile}`);
      }
      return updated === code ? null : { code: updated, map: null };
    }
  };
}

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  base: "/discografia/",
  publicDir: false,
  plugins: [halloweenMobileModels()],
  server: { fs: { allow: [workspaceRoot] } },
  build: {
    outDir: fileURLToPath(new URL("../../dist-halloween/", import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Some shared hosts cannot serve UTF-8 filenames from extracted ZIPs.
        // Give the voice recordings ASCII-only URLs without changing the game.
        assetFileNames(asset) {
          const name = asset.names?.[0] ?? asset.name ?? "";
          return name.toLowerCase().endsWith(".mp3")
            ? "assets/audio-[hash][extname]"
            : "assets/[name]-[hash][extname]";
        }
      }
    }
  }
});
