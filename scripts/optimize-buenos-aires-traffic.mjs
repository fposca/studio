import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { realpathSync, statSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, "src/assets/neonboy-animaciones/bsas");
const cli = path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js");
const dependency = createRequire(realpathSync(cli));
const fromCli = name => import(pathToFileURL(dependency.resolve(name)).href);
const { NodeIO } = await fromCli("@gltf-transform/core");
const { ALL_EXTENSIONS } = await fromCli("@gltf-transform/extensions");
const { weld, simplify, meshopt } = await fromCli("@gltf-transform/functions");
const { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } = await fromCli("meshoptimizer");
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder,
});
const models = [
  ["auto-ruedas-nuevo", .009],
  ["auto-ruedas-nuevo2", .0055],
  ["auto-ruedas-nuevo3", .011],
  ["auto-ruedas-nuevo4", .016],
];
function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root, stdio: "inherit", windowsHide: true,
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("Asset step failed: " + args.join(" "));
}
for (const [name, ratio] of models) {
  const input = path.join(directory, name + ".glb");
  const resized = path.join(directory, name + ".resize.tmp.glb");
  const textured = path.join(directory, name + ".webp.tmp.glb");
  const output = path.join(directory, name + ".traffic.glb");
  try {
    run(["resize", input, resized, "--width", "1024", "--height", "1024"]);
    run(["webp", resized, textured, "--quality", "82"]);
    const doc = await io.read(textured);
    await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error: .009 }),
      meshopt({ encoder: MeshoptEncoder, level: "high" }));
    await io.write(output, doc);
    const triangles = doc.getRoot().listMeshes().flatMap(mesh => mesh.listPrimitives())
      .reduce((n, primitive) => n + (primitive.getIndices()?.getCount() || 0) / 3, 0);
    console.log(`${name}: ${Math.round(triangles)} triangles, ${(statSync(output).size / 1e6).toFixed(2)} MB`);
  } finally {
    for (const temporary of [resized, textured]) try { unlinkSync(temporary); } catch {}
  }
}
