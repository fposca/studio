export const BRIDGE_ORDER=['origin','echo','link'];
export const MEMORY_ORDER=['concert','store','ship'];
export const BLOCK_ORDER=[1,2,0];
export const ENERGY_ORDER=[2,1,2];
export const MATRIX_HEALTH={heavy:4,elite:6,boss:12};
export const MATRIX_BOSS_PHASE={unstable:8,nodes:4};
const HINTS={
  bridge:[
    'El puente recuerda de d\u00f3nde vino la se\u00f1al. Le\u00e9 los tres monolitos.',
    'Los s\u00edmbolos relatan un origen, un eco y un enlace. El orden importa.',
    'Lanz\u00e1 el Orbe a ORIGEN, luego ECO y finalmente ENLACE con la visi\u00f3n activa.',
  ],
  memory:[
    'La memoria del Archivo conserva sucesos que NeonBoy ya vivi\u00f3.',
    'Primero ocurri\u00f3 la anomal\u00eda en el Club; la tienda cambi\u00f3 despu\u00e9s.',
    'Orden: recital de Burn Lies, visi\u00f3n de la tienda y transmisi\u00f3n de PUERTA 01.',
  ],
  blocks:[
    'Cada bloque tiene un s\u00edmbolo y cada placa cuenta una funci\u00f3n.',
    'El pulso alimenta la salida, el eco verifica la entrada y el enlace une el centro.',
    'Placas de izquierda a derecha: ENLACE, PULSO, ECO. Pod\u00e9s retirar y recolocar bloques.',
  ],
  heavy:[
    'El robot recibe impactos del Orbe. Sobrecargarlo con los dos refrigerantes duplica el da\u00f1o.',
    'Para duplicar el da\u00f1o, pon\u00e9 el contenedor en la placa y activ\u00e1 ambos refrigerantes.',
    'Pod\u00e9s derrotarlo con el Orbe, o mover el contenedor y activar ambos refrigerantes para hacerlo m\u00e1s r\u00e1pido.',
  ],
  security:[
    'El Centinela comprueba evidencias, permisos y distribuci\u00f3n de energ\u00eda.',
    'El Archivo guarda un fragmento, el Taller un m\u00f3dulo y el Centinela la autorizaci\u00f3n parcial.',
    'Reun\u00ed las tres evidencias y distribu\u00ed la energ\u00eda 2 / 1 / 2.',
  ],
  boss:[
    'El reflejo abre su defensa entre ataques. Observ\u00e1 el ritmo.',
    'En la segunda fase, la Visi\u00f3n distingue el suelo estable. En la tercera, aparecen nodos.',
    'Cada impacto directo quita energ\u00eda; con el escudo abierto quita el doble. Los nodos visibles con C tambi\u00e9n le hacen da\u00f1o.',
  ],
};
export function matrixSafeCheckpoint(progress){
  const checkpoint=['city','workshop','security','mirror'].includes(progress?.checkpoint)?progress.checkpoint:'city';
  return checkpoint==='mirror'&&!progress?.eliteDefeated?(progress?.heavyDefeated?'security':'workshop'):checkpoint;
}
export function matrixSafePlayerSnapshot(snapshot,progress,securityPosition=[0,0,-55]){
  if(!snapshot||progress?.eliteDefeated||!Number.isFinite(snapshot.z)||snapshot.z>=-77.6)return snapshot;
  return {x:securityPosition[0],z:securityPosition[2],yaw:Math.PI,viewYaw:0};
}
export const MATRIX_INITIAL={
  entered:false,nexMet:false,nexTopics:[],visionUnlocked:false,visionActive:false,
  bridgeSequence:[],bridgeOpen:false,memorySequence:[],memoryOpen:false,memoryFragment:false,
  blockPlacements:[-1,-1,-1],blocksOpen:false,moduleTaken:false,containerOnPlate:false,
  coolant:[false,false],heavyHealth:MATRIX_HEALTH.heavy,heavyDefeated:false,sentinelMet:false,sentinelTopics:[],
  evidenceFound:false,energy:[0,0,0],sentinelAllied:false,securityOpen:false,
  eliteHealth:MATRIX_HEALTH.elite,eliteDefeated:false,bossStarted:false,bossHealth:MATRIX_HEALTH.boss,bossNodes:[false,false,false],bossDefeated:false,
  archiveRead:false,returnedHome:false,hints:{bridge:0,memory:0,blocks:0,heavy:0,security:0,boss:0},
  defeated:[],checkpoint:'city',droneAlarm:false,combatBalance:2,
};
const uniq=(value,allowed,max=20)=>Array.isArray(value)?[...new Set(value.filter(x=>allowed.includes(x)))].slice(0,max):[];
const clamp=(n,min,max)=>Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;
const combatHealth=(value,oldMax,newMax,current)=>!Number.isFinite(value)?newMax:current?clamp(value,0,newMax):Math.ceil(clamp(value,0,oldMax)*newMax/oldMax);
export function normalizeMatrixProgress(raw,fragmentAnalyzed=false){
  const p=raw&&typeof raw==='object'?raw:{};
  const currentBalance=p.combatBalance===2;

  const result={...MATRIX_INITIAL,
    entered:Boolean(p.entered)&&fragmentAnalyzed,
    nexMet:Boolean(p.nexMet),nexTopics:uniq(p.nexTopics,['place','vision','archivist','evil','hint']),
    visionUnlocked:Boolean(p.visionUnlocked||p.nexMet),visionActive:Boolean(p.visionActive)&&Boolean(p.visionUnlocked||p.nexMet),
    bridgeSequence:uniq(p.bridgeSequence,BRIDGE_ORDER,3),bridgeOpen:Boolean(p.bridgeOpen),
    memorySequence:uniq(p.memorySequence,MEMORY_ORDER,3),memoryOpen:Boolean(p.memoryOpen),memoryFragment:Boolean(p.memoryFragment),
    blockPlacements:Array.from({length:3},(_,i)=>[-1,0,1,2].includes(p.blockPlacements?.[i])?p.blockPlacements[i]:-1),
    blocksOpen:Boolean(p.blocksOpen),moduleTaken:Boolean(p.moduleTaken),containerOnPlate:Boolean(p.containerOnPlate),
    coolant:[0,1].map(i=>Boolean(p.coolant?.[i])),heavyHealth:combatHealth(p.heavyHealth,3,MATRIX_HEALTH.heavy,currentBalance),heavyDefeated:Boolean(p.heavyDefeated),
    sentinelMet:Boolean(p.sentinelMet),sentinelTopics:uniq(p.sentinelTopics,['place','creator','corruption','archivist','access','proof']),
    evidenceFound:Boolean(p.evidenceFound),energy:[0,1,2].map(i=>clamp(p.energy?.[i],0,3)),
    sentinelAllied:Boolean(p.sentinelAllied),securityOpen:Boolean(p.securityOpen),
    eliteHealth:combatHealth(p.eliteHealth,4,MATRIX_HEALTH.elite,currentBalance),eliteDefeated:Boolean(p.eliteDefeated),
    bossStarted:Boolean(p.bossStarted),bossHealth:combatHealth(p.bossHealth,9,MATRIX_HEALTH.boss,currentBalance),bossNodes:[0,1,2].map(i=>Boolean(p.bossNodes?.[i])),
    bossDefeated:Boolean(p.bossDefeated),archiveRead:Boolean(p.archiveRead),returnedHome:Boolean(p.returnedHome),
    hints:Object.fromEntries(Object.keys(HINTS).map(id=>[id,clamp(p.hints?.[id],0,3)])),
    defeated:uniq(p.defeated,['zombie-city','zombie-workshop','spectre-archive','drone-workshop','drone-security']),
    checkpoint:['city','workshop','security','mirror'].includes(p.checkpoint)?p.checkpoint:'city',droneAlarm:Boolean(p.droneAlarm),combatBalance:2,
  };
  if(!fragmentAnalyzed)return {...MATRIX_INITIAL};
  if(result.bridgeOpen)result.bridgeSequence=[...BRIDGE_ORDER];
  if(result.memoryOpen)result.memorySequence=[...MEMORY_ORDER];
  if(result.blocksOpen)result.blockPlacements=[...BLOCK_ORDER];
  if(result.heavyDefeated)result.heavyHealth=0;
  if(result.eliteDefeated)result.eliteHealth=0;
  if(result.bossDefeated){result.bossHealth=0;result.bossStarted=true;}
  result.checkpoint=matrixSafeCheckpoint(result);
  return result;
}
export function advanceMatrixProgress(raw,event,value,fragmentAnalyzed=true){
  const p=normalizeMatrixProgress(raw,fragmentAnalyzed);
  if(!fragmentAnalyzed)return p;
  const next={...p};
  if(event==='enter')next.entered=true;
  else if(event==='retry'){
    if(!p.heavyDefeated)next.heavyHealth=MATRIX_HEALTH.heavy;
    if(!p.eliteDefeated)next.eliteHealth=MATRIX_HEALTH.elite;
    if(!p.bossDefeated){next.bossStarted=false;next.bossHealth=MATRIX_HEALTH.boss;next.bossNodes=[false,false,false];}
  }
  else if(event==='nex-meet'){next.nexMet=true;next.visionUnlocked=true;}
  else if(event==='nex-topic'&&['place','vision','archivist','evil','hint'].includes(value))next.nexTopics=uniq([...p.nexTopics,value],['place','vision','archivist','evil','hint']);
  else if(event==='vision-toggle'&&p.visionUnlocked)next.visionActive=!p.visionActive;
  else if(event==='bridge-node'&&p.visionActive&&!p.bridgeOpen&&BRIDGE_ORDER.includes(value)){
    next.bridgeSequence=value===BRIDGE_ORDER[p.bridgeSequence.length]?[...p.bridgeSequence,value]:[];
    next.bridgeOpen=next.bridgeSequence.length===3;
  }
  else if(event==='memory-select'&&p.bridgeOpen&&!p.memoryOpen&&MEMORY_ORDER.includes(value)){
    next.memorySequence=value===MEMORY_ORDER[p.memorySequence.length]?[...p.memorySequence,value]:[];
    next.memoryOpen=next.memorySequence.length===3;
  }
  else if(event==='memory-take'&&p.memoryOpen)next.memoryFragment=true;
  else if(event==='block-move'&&p.memoryOpen&&!p.blocksOpen){
    const {index,slot}=value||{};
    if(Number.isInteger(index)&&index>=0&&index<3&&Number.isInteger(slot)&&[-1,0,1,2].includes(slot)
      &&(slot===-1||!p.blockPlacements.some((v,i)=>i!==index&&v===slot))){
      next.blockPlacements=[...p.blockPlacements];next.blockPlacements[index]=slot;
      next.blocksOpen=next.blockPlacements.every((v,i)=>v===BLOCK_ORDER[i]);
    }
  }
  else if(event==='block-reset'&&p.memoryOpen&&!p.blocksOpen)next.blockPlacements=[-1,-1,-1];
  else if(event==='module-take'&&p.blocksOpen)next.moduleTaken=true;
  else if(event==='container-move'&&p.blocksOpen)next.containerOnPlate=!p.containerOnPlate;
  else if(event==='coolant-hit'&&p.containerOnPlate&&!p.heavyDefeated&&[0,1].includes(value)){
    next.coolant=[...p.coolant];next.coolant[value]=true;
  }
  else if(event==='heavy-hit'&&p.blocksOpen&&!p.heavyDefeated){
    const overloaded=p.containerOnPlate&&p.coolant.every(Boolean);
    next.heavyHealth=Math.max(0,p.heavyHealth-(overloaded?2:1));next.heavyDefeated=next.heavyHealth===0;
    if(overloaded)next.coolant=[false,false];
    if(next.heavyDefeated)next.checkpoint='security';
  }
  else if(event==='sentinel-meet'&&p.heavyDefeated)next.sentinelMet=true;
  else if(event==='sentinel-topic'&&p.sentinelMet&&['place','creator','corruption','archivist','access','proof'].includes(value))next.sentinelTopics=uniq([...p.sentinelTopics,value],['place','creator','corruption','archivist','access','proof']);
  else if(event==='evidence'&&p.heavyDefeated)next.evidenceFound=true;
  else if(event==='energy-set'&&p.heavyDefeated&&Number.isInteger(value?.index)&&value.index>=0&&value.index<3){
    next.energy=[...p.energy];next.energy[value.index]=clamp(value.amount,0,3);
  }
  else if(event==='sentinel-trust'&&p.evidenceFound&&p.energy.every((v,i)=>v===ENERGY_ORDER[i]))next.sentinelAllied=true;
  else if(event==='security-open'&&p.sentinelAllied&&p.memoryFragment&&p.moduleTaken){next.securityOpen=true;next.checkpoint='security';}
  else if(event==='elite-hit'&&p.securityOpen&&!p.eliteDefeated){
    next.eliteHealth=Math.max(0,p.eliteHealth-1);next.eliteDefeated=next.eliteHealth===0;
    if(next.eliteDefeated)next.checkpoint='mirror';
  }
  else if(event==='boss-start'&&p.securityOpen&&p.eliteDefeated&&!p.bossDefeated)next.bossStarted=true;
  else if(event==='boss-node'&&p.bossStarted&&!p.bossDefeated&&p.bossHealth<=MATRIX_BOSS_PHASE.nodes&&[0,1,2].includes(value)&&!p.bossNodes[value]){
    next.bossNodes=[...p.bossNodes];next.bossNodes[value]=true;
    next.bossHealth=Math.max(0,p.bossHealth-1);next.bossDefeated=next.bossHealth===0;
    if(next.bossDefeated)next.bossStarted=false;
  }
  else if(event==='boss-hit'&&p.bossStarted&&!p.bossDefeated){
    next.bossHealth=Math.max(0,p.bossHealth-(value?.shieldOpen?2:1));next.bossDefeated=next.bossHealth===0;
    if(next.bossDefeated)next.bossStarted=false;
  }
  else if(event==='archive-read'&&p.bossDefeated)next.archiveRead=true;
  else if(event==='return-home'&&p.archiveRead)next.returnedHome=true;
  else if(event==='enemy-defeat'&&['zombie-city','zombie-workshop','spectre-archive','drone-workshop','drone-security'].includes(value))next.defeated=uniq([...p.defeated,value],['zombie-city','zombie-workshop','spectre-archive','drone-workshop','drone-security']);
  else if(event==='drone-alarm')next.droneAlarm=true;
  else if(event==='checkpoint'&&['city','workshop','security','mirror'].includes(value)&&!(value==='mirror'&&!p.eliteDefeated)) {
    const order=['city','workshop','security','mirror'];
    if(order.indexOf(value)>order.indexOf(p.checkpoint))next.checkpoint=value;
  }
  else if(event==='hint'&&Object.hasOwn(HINTS,value))next.hints={...p.hints,[value]:Math.min(3,p.hints[value]+1)};
  return next;
}
export const matrixHint=(p,id)=>HINTS[id]?.[(p.hints?.[id]||0)-1]||'';
export function matrixObjective(p){
  if(!p.nexMet)return'Habl\u00e1 con NEX-9 en la Ciudad Incompleta.';
  if(!p.bridgeOpen)return'Activ\u00e1 los tres nodos del puente con el Orbe Neon y la Visi\u00f3n de Frecuencia.';
  if(!p.memoryOpen)return'Reconstru\u00ed la secuencia de recuerdos en el Archivo.';
  if(!p.memoryFragment)return'Recog\u00e9 el fragmento del Archivo de los Recuerdos.';
  if(!p.blocksOpen)return'Mov\u00e9 los tres bloques a las placas correctas del Taller.';
  if(!p.moduleTaken)return'Recog\u00e9 el m\u00f3dulo energ\u00e9tico del Taller.';
  if(!p.heavyDefeated)return'Derrot\u00e1 al robot pesado con el Orbe. Los refrigerantes duplican el da\u00f1o.';
  if(!p.sentinelAllied)return'Encontr\u00e1 la evidencia y resolv\u00e9 la energ\u00eda del Centinela.';
  if(!p.securityOpen)return'Reconstru\u00ed la autorizaci\u00f3n del N\u00facleo.';
  if(!p.eliteDefeated)return'Derrot\u00e1 al robot fucsia en Seguridad.';
  if(!p.bossDefeated)return'Enfrent\u00e1 a Neon Evil en el Espejo Digital.';
  if(!p.archiveRead)return'Consult\u00e1 el Archivo Central.';
  if(p.returnedHome)return'Investig\u00e1 la corrupci\u00f3n del Archivista en Buenos Aires.';
  return'Regres\u00e1 a Buenos Aires y segu\u00ed la corrupci\u00f3n del mundo de origen.';
}
