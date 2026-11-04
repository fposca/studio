export const MATRIX_LAYOUT = {
  playerLimitX: 15.7, playerBackZ: -105, playerFrontZ: 24, spawnZ: 20,
  cameraLimitX: 15.9, cameraBackZ: -105.3, cameraFrontZ: 24.3,
};
export const MATRIX_SECTORS = [
  {id:'city',label:'LA CIUDAD INCOMPLETA',z:12,from:24,to:-2},
  {id:'archive',label:'EL ARCHIVO DE LOS RECUERDOS',z:-14,from:-2,to:-26},
  {id:'workshop',label:'EL TALLER DE CORRUPCI\u00d3N',z:-39,from:-26,to:-51},
  {id:'security',label:'EL N\u00daCLEO DE SEGURIDAD',z:-64,from:-51,to:-77},
  {id:'mirror',label:'EL ESPEJO DIGITAL',z:-91,from:-77,to:-105},
];
export const MATRIX_ASSETS = [
  {id:'nex9',label:'NEX-9',position:[5,0,17],rotation:[0,180,0],scale:1,reach:2.4,file:'robot-bueno.glb',height:2.1},
  {id:'zombie-city',label:'Robot zombie / ciudad',position:[6,0,11.5],rotation:[0,0,0],scale:1,file:'robot-zombie-walk.glb',attack:'robot-zombie-patada.glb',height:2.3,detect:10,attackPower:1},
  {id:'zombie-workshop',label:'Robot zombie / taller',position:[-6,0,-34],rotation:[0,0,0],scale:1,file:'robot-zombie-walk.glb',attack:'robot-zombie-patada.glb',height:2.3,detect:10,attackPower:1},
  {id:'spectre-archive',label:'Espectro / archivo',position:[5,0,-16],rotation:[0,0,0],scale:1,file:'espectro-walk.glb',attack:'espectro-ataque.glb',height:2.25,detect:11,attackPower:1},
  {id:'heavy',label:'Robot zombie pesado',position:[1,0,-46],rotation:[0,0,0],scale:1,file:'robot2-zombie-walk.glb',attack:'roboto2-zombie-ataque.glb',height:3.15,detect:10.5,attackPower:1},
  {id:'sentinel',label:'Centinela 09',position:[0,1.6,-57],rotation:[0,180,0],scale:1,reach:2.5,file:'centinela-09.glb',height:.58},
  {id:'drone-workshop',label:'Centinela 09 / taller',position:[7,1.6,-37],rotation:[0,180,0],scale:1,detect:12,attackPower:1,file:'centinela-09.glb',height:.58},
  {id:'drone-security',label:'Centinela 09 / seguridad',position:[-7,1.6,-65],rotation:[0,180,0],scale:1,detect:12,attackPower:1,file:'centinela-09.glb',height:.58},
  {id:'elite',label:'Robot maligno fucsia',position:[5,0,-70],rotation:[0,0,0],scale:1,file:'robot-maligno-fuxia-walk.glb',attack:'robot-maligno-fuxia-patada.glb',height:2.65,detect:14,attackPower:1},
  {id:'neon-evil',label:'Neon Evil',position:[0,0,-95],rotation:[0,180,0],scale:1,file:'neon-maligno-walk.glb',attack:'neon-maligno-atack.glb',height:3.2,detect:15,attackPower:1},
  {id:'bridge-node-1',label:'Nodo del puente / origen',position:[-3,1.45,9.5],rotation:[0,0,0],scale:1},
  {id:'bridge-node-2',label:'Nodo del puente / eco',position:[0,1.45,9.5],rotation:[0,0,0],scale:1},
  {id:'bridge-node-3',label:'Nodo del puente / enlace',position:[3,1.45,9.5],rotation:[0,0,0],scale:1},
  {id:'memory-block-0',label:'Bloque de memoria / pulso',position:[-4,.62,-38],rotation:[0,0,0],scale:1},
  {id:'memory-block-1',label:'Bloque de memoria / eco',position:[0,.62,-38],rotation:[0,0,0],scale:1},
  {id:'memory-block-2',label:'Bloque de memoria / enlace',position:[4,.62,-38],rotation:[0,0,0],scale:1},
  {id:'memory-plate-0',label:'Placa de memoria / entrada',position:[-4,.02,-40],rotation:[0,0,0],scale:1},
  {id:'memory-plate-1',label:'Placa de memoria / centro',position:[0,.02,-40],rotation:[0,0,0],scale:1},
  {id:'memory-plate-2',label:'Placa de memoria / salida',position:[4,.02,-40],rotation:[0,0,0],scale:1},
  {id:'coolant-1',label:'Refrigeraci\u00f3n / norte',position:[-5,1.45,-48],rotation:[0,0,0],scale:1},
  {id:'coolant-2',label:'Refrigeraci\u00f3n / sur',position:[5,1.45,-48],rotation:[0,0,0],scale:1},
  {id:'container',label:'Contenedor energ\u00e9tico',position:[-8,.75,-45],rotation:[0,0,0],scale:1},
  {id:'container-plate',label:'Placa del contenedor',position:[-4,.025,-47],rotation:[0,0,0],scale:1},
  {id:'energy-terminal',label:'Distribución de energía',position:[7,1.2,-62],rotation:[0,0,0],scale:1},
  {id:'authorization',label:'Terminal de autorizaci\u00f3n',position:[0,1,-65],rotation:[0,0,0],scale:1},
  {id:'boss-node-1',label:'Núcleo final / 1',position:[-4.8,1.5,-94],rotation:[0,0,0],scale:1},
  {id:'boss-node-2',label:'Núcleo final / 2',position:[0,1.5,-94],rotation:[0,0,0],scale:1},
  {id:'boss-node-3',label:'Núcleo final / 3',position:[4.8,1.5,-94],rotation:[0,0,0],scale:1},
  {id:'mirror-altar',label:'Altar del Espejo Digital',position:[0,.04,-81],rotation:[-90,0,0],scale:1},
  {id:'checkpoint-workshop',label:'Checkpoint / antes del robot pesado',position:[0,.04,-30],rotation:[-90,0,0],scale:1},
  {id:'checkpoint-security',label:'Checkpoint / antes del robot fucsia',position:[0,.04,-55],rotation:[-90,0,0],scale:1},
  {id:'checkpoint-mirror',label:'Checkpoint / antes de Neon Evil',position:[0,.04,-80],rotation:[-90,0,0],scale:1},
  {id:'portal-return',label:'Portal de regreso',position:[-10,1.8,20],rotation:[0,0,0],scale:1},
  {id:'portal-exit',label:'Portal de salida',position:[10,1.8,-100],rotation:[0,0,0],scale:1},
];
const KEY='neonboy-matrix-transforms-v1';
const LEGACY_DETECTION={'zombie-city':[6.5,9],'zombie-workshop':[6.5,9],'spectre-archive':[7,10],heavy:[6.5,9.5],'drone-workshop':[8,11],'drone-security':[8,11],elite:[10,13],'neon-evil':[12,14]};
export function defaultMatrixTransform(id) {
  const asset=MATRIX_ASSETS.find(item=>item.id===id);
  return asset && {position:[...asset.position],rotation:[...asset.rotation],scale:asset.scale,...(asset.reach?{reach:asset.reach}:{}),...(Number.isFinite(asset.detect)?{detect:asset.detect,attackPower:asset.attackPower}:{}),...(Number.isFinite(asset.patrolRadius)?{patrolRadius:asset.patrolRadius}:{})};
}
export function loadMatrixTransforms() {
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
  return Object.fromEntries(MATRIX_ASSETS.map(asset=>{
    const base=defaultMatrixTransform(asset.id),value=saved[asset.id]||{};
    const position=base.position.map((number,i)=>Number.isFinite(value.position?.[i])?Math.max(-110,Math.min(110,value.position[i])):number);
    // Migrate the original spawn, which overlapped the solid bridge railing.
    if(asset.id==='zombie-city'&&position[0]===4&&position[1]===0&&position[2]===7)position.splice(0,3,...base.position);
    const wasOldDrone=asset.id.startsWith('drone-')&&[0,2.8].includes(position[1]);
    if(wasOldDrone||asset.id==='sentinel'&&position[1]===0)position[1]=base.position[1];
    if(asset.id.startsWith('bridge-node-')&&position[0]===base.position[0]&&position[1]===1.45&&position[2]===5)position[2]=base.position[2];
    return [asset.id,{position,
      rotation:wasOldDrone?[...base.rotation]:base.rotation.map((number,i)=>Number.isFinite(value.rotation?.[i])?value.rotation[i]:number),
      scale:Number.isFinite(value.scale)?Math.max(.2,Math.min(3,value.scale)):base.scale,
      ...(asset.reach?{reach:Number.isFinite(value.reach)?Math.max(1,Math.min(5,value.reach)):base.reach}:{}),
      ...(Number.isFinite(asset.detect)?{detect:Number.isFinite(value.detect)&&!LEGACY_DETECTION[asset.id]?.includes(value.detect)?Math.max(2,Math.min(20,value.detect)):asset.detect,attackPower:Number.isFinite(value.attackPower)?Math.max(0,Math.min(4,value.attackPower)):asset.attackPower}:{}),
      ...(Number.isFinite(asset.patrolRadius)?{patrolRadius:Number.isFinite(value.patrolRadius)?Math.max(.5,Math.min(6,value.patrolRadius)):asset.patrolRadius}:{})}];
  }));
}
export function saveMatrixTransforms(value){localStorage.setItem(KEY,JSON.stringify(value));}
