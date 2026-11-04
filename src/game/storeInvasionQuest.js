export const INVASION_SYMBOLS = Object.freeze(['onda', 'surco', 'silencio']);
export const INVASION_EMITTER_ORDER = Object.freeze([0, 1, 2]);
export const STORE_INVASION_INITIAL = Object.freeze({
  started:false,introSeen:false,titoBriefed:false,visionActive:false,
  jukeboxClues:[false,false,false],jukeboxInput:[],jukeboxArmed:false,jukeboxOff:false,
  crateSlot:0,archivePanelSeen:false,conductors:[],archiveOff:false,
  ghostHealth:3,ghostDefeated:false,emitterClueSeen:false,reflectorSlot:0,emitters:[],transmissionOff:false,
  generators:[false,false],bossHealth:5,bossDefeated:false,coreNeutralized:false,
  hints:{jukebox:0,archive:0,transmission:0,combat:0},
});
const bool=value=>value===true;
const count=(value,max)=>Number.isInteger(value)?Math.max(0,Math.min(max,value)):0;
const prefix=(value,order)=>{const result=[];if(Array.isArray(value))for(const entry of value){if(entry!==order[result.length])break;result.push(entry);}return result;};
export function normalizeStoreInvasionProgress(value,eligible=false){
 const p=value&&typeof value==='object'?value:{};
 if(!eligible)return {...STORE_INVASION_INITIAL,jukeboxClues:[false,false,false],jukeboxInput:[],conductors:[],emitters:[],generators:[false,false],hints:{...STORE_INVASION_INITIAL.hints}};
 const jukeboxClues=[0,1,2].map(i=>bool(p.jukeboxClues?.[i]));
 const jukeboxInput=prefix(p.jukeboxInput,INVASION_SYMBOLS);
 const jukeboxArmed=bool(p.jukeboxArmed)&&jukeboxClues.every(Boolean);
 const jukeboxOff=bool(p.jukeboxOff)&&jukeboxArmed;
 const crateSlot=count(p.crateSlot,2);
 const archivePanelSeen=bool(p.archivePanelSeen)&&crateSlot===2;
 const conductors=prefix(p.conductors,[0,1,2]);
 const archiveOff=bool(p.archiveOff)&&archivePanelSeen&&conductors.length===3;
 const ghostDefeated=bool(p.ghostDefeated)&&archiveOff;
 const emitterClueSeen=bool(p.emitterClueSeen);
 const reflectorSlot=count(p.reflectorSlot,1);
 const emitters=prefix(p.emitters,INVASION_EMITTER_ORDER);
 const transmissionOff=bool(p.transmissionOff)&&jukeboxOff&&archiveOff&&ghostDefeated&&emitterClueSeen&&emitters.length===3;
 const generators=[0,1].map(i=>transmissionOff&&bool(p.generators?.[i]));
 const bossDefeated=bool(p.bossDefeated)&&generators.every(Boolean);
 return {started:bool(p.started)||bool(p.introSeen),introSeen:bool(p.introSeen),titoBriefed:bool(p.titoBriefed),visionActive:bool(p.visionActive),
  jukeboxClues,jukeboxInput,jukeboxArmed,jukeboxOff,crateSlot,archivePanelSeen,conductors,archiveOff,
  ghostHealth:ghostDefeated?0:count(p.ghostHealth??3,3),ghostDefeated,emitterClueSeen,reflectorSlot,emitters,transmissionOff,
  generators,bossHealth:bossDefeated?0:count(p.bossHealth??5,5),bossDefeated,coreNeutralized:bossDefeated&&bool(p.coreNeutralized),
  hints:Object.fromEntries(Object.keys(STORE_INVASION_INITIAL.hints).map(key=>[key,count(p.hints?.[key],3)]))};
}
export function advanceStoreInvasion(progress,event,value,eligible=true){
 const p=normalizeStoreInvasionProgress(progress,eligible);
 if(!eligible)return p;
 if(event==='enter')return {...p,started:true};
 if(!p.started)return p;
 if(event==='intro')return {...p,introSeen:true};
 if(event==='tito')return {...p,titoBriefed:true};
 if(event==='vision-toggle')return {...p,visionActive:!p.visionActive};
 if(event==='juke-clue'&&Number.isInteger(value)&&value>=0&&value<3){const clues=[...p.jukeboxClues];clues[value]=true;return {...p,jukeboxClues:clues};}
 if(event==='juke-input'&&p.visionActive&&p.jukeboxClues.every(Boolean)&&!p.jukeboxArmed&&INVASION_SYMBOLS.includes(value)){
  const next=[...p.jukeboxInput,value];
  return INVASION_SYMBOLS[next.length-1]===value?{...p,jukeboxInput:next,jukeboxArmed:next.length===3}:{...p,jukeboxInput:[]};
 }
 if(event==='juke-hit'&&p.jukeboxArmed)return {...p,jukeboxOff:true};
 if(event==='crate-step'&&Number.isInteger(value)&&Math.abs(value)===1&&!p.archiveOff)return {...p,crateSlot:count(p.crateSlot+value,2),archivePanelSeen:false,conductors:[]};
 if(event==='crate-reset'&&!p.archiveOff)return {...p,crateSlot:0,archivePanelSeen:false,conductors:[]};
 if(event==='archive-inspect'&&p.crateSlot===2&&p.visionActive)return {...p,archivePanelSeen:true};
 if(event==='archive-node'&&p.archivePanelSeen&&p.visionActive&&!p.archiveOff&&Number.isInteger(value)&&value>=0&&value<3){
  const next=value===p.conductors.length?[...p.conductors,value]:[];
  return {...p,conductors:next,archiveOff:next.length===3};
 }
 if(event==='ghost-hit'&&p.archiveOff&&!p.ghostDefeated){const health=Math.max(0,p.ghostHealth-1);return {...p,ghostHealth:health,ghostDefeated:health===0};}
 if(event==='emitter-clue')return {...p,emitterClueSeen:true};
 if(event==='reflector-set'&&Number.isInteger(value)&&value>=0&&value<=1)return {...p,reflectorSlot:value};
 if(event==='emitter-hit'&&p.jukeboxOff&&p.archiveOff&&p.ghostDefeated&&p.visionActive&&p.emitterClueSeen&&!p.transmissionOff){
  const index=value?.index,reflected=bool(value?.reflected);
  if(!Number.isInteger(index)||index<0||index>2)return p;
  const valid=index===p.emitters.length&&(index!==2||(reflected&&p.reflectorSlot===1));
  const next=valid?[...p.emitters,index]:[];
  return {...p,emitters:next,transmissionOff:next.length===3};
 }
 if(event==='generator-hit'&&p.transmissionOff&&!p.bossDefeated&&Number.isInteger(value)&&value>=0&&value<2){const generators=[...p.generators];generators[value]=true;return {...p,generators};}
 if(event==='boss-hit'&&p.generators.every(Boolean)&&!p.bossDefeated&&bool(value?.vulnerable)){
  const health=Math.max(0,p.bossHealth-1);return {...p,bossHealth:health,bossDefeated:health===0};
 }
 if(event==='core-read'&&p.bossDefeated)return {...p,coreNeutralized:true,visionActive:false};
 if(event==='retry')return p.archiveOff&&!p.ghostDefeated?{...p,ghostHealth:3}:p.transmissionOff&&!p.bossDefeated?{...p,generators:[false,false],bossHealth:5}:p;
 if(event==='hint'&&Object.hasOwn(p.hints,value))return {...p,hints:{...p.hints,[value]:Math.min(3,p.hints[value]+1)}};
 return p;
}
export function storeInvasionObjective(p){
 if(!p.started)return null;
 if(!p.introSeen)return'Observá la tienda y recuperá el control.';
 if(!p.titoBriefed)return'Hablá con Tito sobre la invasión.';
 if(!p.jukeboxOff){
  const found=p.jukeboxClues.filter(Boolean).length;
  if(found<3)return`Examiná los carteles con E y C activa: pistas ${found}/3.`;
  if(!p.jukeboxArmed)return'Pistas 3/3. Volvé a la señal de la rockola e ingresá ONDA → SURCO → SILENCIO.';
  return'Secuencia correcta. Dispará el Orbe Neon al núcleo fucsia de la rockola.';
 }
 if(!p.archiveOff)return'Mové la caja del expositor y restaurá los conductores.';
 if(!p.ghostDefeated)return'Defendete de la aparición entre las estanterías.';
 if(!p.transmissionOff)return'Restaurá los emisores ocultos y usá el reflector.';
 if(!p.bossDefeated)return'Desactivá los generadores y enfrentá a la entidad corrupta.';
 if(!p.coreNeutralized)return'Consultá y neutralizá el núcleo principal.';
 return'Investigá las nuevas anomalías de Buenos Aires.';
}
export function storeInvasionHint(p,topic){
 const level=p.hints?.[topic]||0;
 const hints={
  jukebox:['Buscá tres carteles originales cerca de la rockola.','La Visión de Frecuencia revela los glifos. Los números I, II y III dan el orden.','Ingresá ONDA, SURCO, SILENCIO y golpeá el núcleo fucsia con el orbe.'],
  archive:['La caja marcada impide ver el panel de la pared derecha.','Sujetá la caja con E, desplazala con W/S y soltala con E. Podés reiniciar su posición.','Con C activa, dispará a los conductores en el orden de la flecha: 1, 2, 3.'],
  transmission:['La inscripción del fondo describe tres alturas de la señal.','Primero dispará al emisor del suelo; después al del vidrio.','Mové el reflector a la segunda marca y lanzá el orbe hacia él para alcanzar el emisor del cielo.'],
  combat:['El fantasma solo recibe daño cuando se materializa. C ayuda a seguirlo.','Los dos generadores sostienen el escudo de la entidad final.','Tras destruirlos, esperá el pulso fucsia: esa es la ventana vulnerable.']};
 return hints[topic]?.[Math.min(level,2)]||'';
}
