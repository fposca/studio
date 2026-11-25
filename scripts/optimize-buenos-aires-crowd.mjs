// Rebuild crowd LODs from the existing Meshy assets; originals remain intact.
import { createRequire } from "node:module";
import { realpathSync, statSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const dependency = createRequire(realpathSync(path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js")));
const fromCli = name => import(pathToFileURL(dependency.resolve(name)).href);
const { NodeIO } = await fromCli("@gltf-transform/core");
const { ALL_EXTENSIONS } = await fromCli("@gltf-transform/extensions");
const { weld, simplify, meshopt } = await fromCli("@gltf-transform/functions");
const { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } = await fromCli("meshoptimizer");
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder,
});
const families = ["peaton-hombre-camina-celular", "peaton-mujer-camina-celular",
  "ejecutivo-camina-celular", "senora-camina-celular", "desconectada-respira"];
for (const name of families) {
  for (const lod of ["near"]) {
    const input = path.join(root, "src/assets/neonboy-animaciones", name + ".city.glb");
    const output = path.join(root, "src/assets/neonboy-animaciones", name + "." + lod + ".glb");
    const document = await io.read(input);
    await document.transform(weld(), simplify({ simplifier: MeshoptSimplifier,
      ratio: lod === "near" ? .14 : .018, error: lod === "near" ? .005 : .035 }),
      meshopt({ encoder: MeshoptEncoder, level: "high" }));
    const triangles = document.getRoot().listMeshes().reduce((sum, mesh) => sum +
      mesh.listPrimitives().reduce((n, primitive) => n + primitive.getIndices().getCount() / 3, 0), 0);
    if (!document.getRoot().listSkins().length || !document.getRoot().listAnimations().length)
      throw new Error("Missing rig or animation: " + name);
    await io.write(output, document);
    console.log(name, lod, triangles, "triangles", statSync(output).size, "bytes");
  }
}
