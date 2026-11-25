import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { realpathSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'src/assets/neonboy-animaciones/bsas');
const cli = path.join(root, 'node_modules/@gltf-transform/cli/bin/cli.js');
const extractor = path.join(root, 'scripts/extract-record-store-roxy-animations.mjs');
const dependency = createRequire(realpathSync(cli));
const fromCli = name => import(pathToFileURL(dependency.resolve(name)).href);
const { NodeIO } = await fromCli('@gltf-transform/core');
const { ALL_EXTENSIONS } = await fromCli('@gltf-transform/extensions');
const { weld, simplify, meshopt } = await fromCli('@gltf-transform/functions');
const { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } = await fromCli('meshoptimizer');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder,
});
function run(script,args) {
  const result=spawnSync(process.execPath,[script,...args],{cwd:root,stdio:'inherit',windowsHide:true,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=8192'}});
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error('Asset step failed: '+args.join(' '));
}
function json(name) { const b=readFileSync(path.join(directory,name+'.glb')); return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString()); }
function bones(g) { return (g.skins||[]).flatMap(s=>s.joints.map(i=>g.nodes[i]?.name)); }
async function optimize(name,kind) {
  const input=path.join(directory,name+'.glb');
  const resized=path.join(directory,name+'.resize.tmp.glb');
  const textured=path.join(directory,name+'.webp.tmp.glb');
  const output=path.join(directory,name+(kind==='actor'?'.city':'.game')+'.glb');
  const width=kind==='actor'?'512':'1024';
  try {
    run(cli,['resize',input,resized,'--width',width,'--height',width]);
    run(cli,['webp',resized,textured,'--quality',kind==='actor'?'75':'78']);
    const doc=await io.read(textured);
    const ratio=kind==='actor'?1:(name==='auto-ruedas-5'?.8:name==='auto-ruedas-2'?.01:name==='auto-ruedas-3'?.012:name==='auto-ruedas-4'?.011:name==='auto-volador'?.028:.045);
    if(ratio<1) await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio,error:.03}));
    await doc.transform(meshopt({encoder:MeshoptEncoder,level:'high'}));
    await io.write(output,doc);
    let triangles=0;
    for(const mesh of doc.getRoot().listMeshes()) for(const primitive of mesh.listPrimitives()) triangles+=(primitive.getIndices()?.getCount()||0)/3;
    console.log(name,kind,Math.round(triangles),'triangles',statSync(output).size,'bytes');
  } finally { for(const temp of [resized,textured]) try { unlinkSync(temp); } catch {} }
}
const actors=[['fatman-caminando','fatman-inactivo'],['viejo-caminando','viejo-repsiando'],['viejo-loro-caminando','viejo-loro-inactivo']];
for(const [walk,idle] of actors) {
  if(JSON.stringify(bones(json(walk)))!==JSON.stringify(bones(json(idle)))) throw new Error('Incompatible rig: '+walk+'/'+idle);
  await optimize(walk,'actor');
  run(extractor,['--asset-dir',directory,idle]);
  const doc=await io.read(path.join(directory,walk+'.city.glb'));
  await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.14,error:.006}),meshopt({encoder:MeshoptEncoder,level:'high'}));
  await io.write(path.join(directory,walk+'.near.glb'),doc);
  console.log(walk,'near',statSync(path.join(directory,walk+'.near.glb')).size,'bytes');
}
for(const name of ['auto-ruedas','auto-ruedas-2','auto-ruedas-3','auto-ruedas-4','auto-ruedas-5','auto-volador']) await optimize(name,'car');
