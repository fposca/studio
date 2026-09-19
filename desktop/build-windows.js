import { build, Platform } from "electron-builder";
import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryOutput = path.join(os.tmpdir(), "studio-desktop-build");
const temporaryTools = path.join(os.tmpdir(), "studio-desktop-tools");
const releaseDir = path.join(projectDir, "release");

await rm(temporaryOutput, { force: true, recursive: true });
await mkdir(temporaryOutput, { recursive: true });
await mkdir(temporaryTools, { recursive: true });
await mkdir(releaseDir, { recursive: true });
await writeFile(path.join(temporaryTools, "pnpm.cmd"), "@echo off\r\ncorepack pnpm %*\r\n", "utf8");
process.env.PATH = `${temporaryTools}${path.delimiter}${process.env.PATH}`;

await build({
  projectDir,
  targets: Platform.WINDOWS.createTarget("nsis"),
  config: {
    directories: { output: temporaryOutput }
  }
});

const artifacts = (await readdir(temporaryOutput, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.(exe|yml|blockmap)$/i.test(entry.name));

for (const artifact of artifacts) {
  await copyFile(path.join(temporaryOutput, artifact.name), path.join(releaseDir, artifact.name));
}

console.log(`Instalador listo en ${releaseDir}`);
