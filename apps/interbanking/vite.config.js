import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("./", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));

export default defineConfig({
  root: appRoot,
  base: "./",
  publicDir: fileURLToPath(new URL("./public/", import.meta.url)),
  server: { fs: { allow: [workspaceRoot] }, proxy: { "/api": "http://127.0.0.1:8787" } },
  build: {
    outDir: fileURLToPath(new URL("../../dist-interbanking/", import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
