import { mergeConfig } from "vite";
import { fileURLToPath } from "node:url";
import halloweenConfig from "./vite.config.js";

// Android only: keep the original 2K color/normal maps and use lighter 1K
// metallic/roughness maps for the four actors that still shipped a 4K map.
const androidModelNames = ["demonioFinal", "demonio-matrix", "reemplazo-freddy-respirar", "reemplazo-jason-respirar"];
function halloweenAndroidTextures() {
  return {
    name: "halloween-android-textures",
    enforce: "pre",
    transform(code, id) {
      const source = id.replace(/\\/g, "/").split("?")[0];
      if (!source.includes("/apps/neonboy-halloween/") &&
          !source.endsWith("/src/game/recordStoreDialogue.js") &&
          !source.endsWith("/src/game/recordStoreNpcActors.js")) return null;
      let updated = code;
      for (const name of androidModelNames)
        updated = updated.replaceAll(`${name}.mobile.glb`, `${name}.android.glb`);
      return updated === code ? null : { code: updated, map: null };
    },
  };
}

// Keep the website output untouched; Capacitor bundles this separate build.
export default mergeConfig(halloweenConfig, {
  base: "./",
  plugins: [halloweenAndroidTextures()],
  build: {
    outDir: fileURLToPath(new URL("../../dist-halloween-android/", import.meta.url)),
  },
});