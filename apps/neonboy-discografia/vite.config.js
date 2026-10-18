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
    assetsInlineLimit: 0
  }
});
