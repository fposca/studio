import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { realpathSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'src/assets/neonboy-animaciones/bsas');
const cli = path.join(root, 'node_modules/@gltf-transform/cli/bin/cli.js');
const dependency = createRequire(realpathSync(cli));
const fromCli = name => import(pathToFileURL(dependency.resolve(name)).href);
const { NodeIO } = await fromCli('@gltf-transform/core');
const { ALL_EXTENSIONS } = await fromCli('@gltf-transform/extensions');
const { weld, simplify, meshopt } = await fromCli('@gltf-transform/functions');
const { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } = await fromCli('meshoptimizer');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const names = ['respira','camina','ataca','golpea','dano','muerte'];
let rig;
for (const name of names) {
  const b=readFileSync(path.join(directory,`vigilante-${name}.glb`));
  const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
  const current=JSON.stringify(g.skins.flatMap(s=>s.joints.map(i=>g.nodes[i])));
  if(rig && rig!==current) throw new Error('Incompatible skeleton: '+name);
  rig=current;
}
function run(script,args) {
  const r=spawnSync(process.execPath,['--no-opt',script,...args],{cwd:root,stdio:'inherit',windowsHide:true});
  if(r.status!==0) throw new Error('Asset step failed: '+args.join(' '));
}
run(path.join(root,'scripts/extract-record-store-roxy-animations.mjs'),['--asset-dir',directory,...names.slice(1).map(n=>'vigilante-'+n)]);
const input=path.join(directory,'vigilante-respira.glb');
const resized=path.join(directory,'vigilante.resize.tmp.glb'),textured=path.join(directory,'vigilante.webp.tmp.glb');
try {
  run(cli,['resize',input,resized,'--width','1024','--height','1024']);
  run(cli,['webp',resized,textured,'--quality','80']);
  const doc=await io.read(textured);
  await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.18,error:.008}),meshopt({encoder:MeshoptEncoder,level:'high'}));
  const output=path.join(directory,'vigilante.mobile.glb'); await io.write(output,doc);
  const triangles=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((n,p)=>n+p.getIndices().getCount()/3,0);
  console.log('VIGILANTE',triangles,'triangles',statSync(output).size,'bytes');
} finally {
  // These two explicit temporary files are inside the verified asset directory.
  for(const temp of [resized,textured]) try {unlinkSync(temp);} catch {}
}
