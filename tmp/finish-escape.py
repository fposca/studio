from pathlib import Path
import os

def write(name, text):
 p=Path(name);p.write_text(text,encoding='utf-8')
 with p.open('r+b') as f:f.flush();os.fsync(f.fileno())
# Share the exact encoded pulse from the existing studio analyzer, rather than
# creating a second synthetic recording or adding any audio assets.
p=Path('src/game/StudioSignalAnalyzer.jsx');s=p.read_text(encoding='utf-8')
a=s.index('function makeSignal(');b=s.index('\nexport default function StudioSignalAnalyzer',a)
source=s[a:b].replace('function makeSignal(', 'export function createStudioSignalBuffer(').replace('SIGNAL_LENGTH', '3')
write('src/game/studioSignalAudio.js',source+"""
// Short, optional playback. The existing studio signal is reused at low volume.
export function createOriginInterferenceAudio() {
  let context = null, source = null, gain = null, disposed = false;
  function unlock() {
    if (disposed) return;
    try {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) return;
      context ||= new Context();
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch { /* Audio availability never blocks the mission. */ }
  }
  function stop() {
    if (source) { try { source.stop(); } catch {} source.disconnect(); source = null; }
    gain?.disconnect(); gain = null;
  }
  return {
    unlock,
    play() {
      if (disposed || !context || context.state !== 'running') return false;
      stop(); source = context.createBufferSource(); gain = context.createGain();
      source.buffer = createStudioSignalBuffer(context, false, 1);
      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.16, now + .15);
      gain.gain.setValueAtTime(.16, now + 2.6); gain.gain.linearRampToValueAtTime(0, now + 3);
      source.connect(gain).connect(context.destination); source.start();
      source.onended = stop; return true;
    },
    setPaused(paused) {
      if (!context || context.state === 'closed') return;
      if (paused && context.state === 'running') context.suspend().catch(() => {});
      else if (!paused && context.state === 'suspended') context.resume().catch(() => {});
    },
    stop,
    dispose() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); context = null; },
  };
}
""")
write(str(p),s[:a]+s[b:])
p=Path('src/game/StudioSignalAnalyzer.jsx');s=p.read_text(encoding='utf-8').replace('makeSignal(', 'createStudioSignalBuffer(')
write(str(p),'import { createStudioSignalBuffer } from "./studioSignalAudio.js";\n'+s)
p=Path('src/game/buenosAiresEscapeScene.js');s=p.read_text(encoding='utf-8')
s='import { createOriginInterferenceAudio } from "./studioSignalAudio.js";\n'+s
s=s.replace("  const root = new THREE.Group();", "  const audio = createOriginInterferenceAudio();\n  const root = new THREE.Group();",1)
s=s.replace("    if (state) cancel();", "    if (state) cancel();\n    audio.unlock();")
s=s.replace('if(!state)return;restore();', 'if(!state)return;audio.stop();restore();')
s=s.replace('    suspended=paused||document.hidden;', '    suspended=paused||document.hidden; audio.setPaused(suspended);')
s=s.replace('    for(const {actor} of passengers)actor.visible=false;', "    passengers.forEach(({actor},i)=>{actor.visible=false;actor.position.set(i ? .4 : -.4,-.65,.05);actor.quaternion.identity();});")
s=s.replace("originSent=true;onEvent?.('fuego-origin-recovered');", "originSent=true;audio.play();onEvent?.('fuego-origin-recovered');")
s=s.replace('cancel();disposed=true;root.removeFromParent();', 'cancel();audio.dispose();disposed=true;root.removeFromParent();')
write(str(p),s)
p=Path('src/game/buenosAiresEscape.css');s=p.read_text(encoding='utf-8')
s+='\n@media(min-width:601px) and (max-width:760px){.city-flight-instruments{width:170px}.city-flight-caption{width:185px}.city-flight-warning{padding:6px 8px}.city-flight-warning strong{font-size:9px;gap:5px}}\n'
write(str(p),s)

# Keep pursuing drones ahead of the chase camera and outside its center line.
p=Path('src/game/buenosAiresEscapeScene.js');s=p.read_text(encoding='utf-8')
s=s.replace("const p=escapeRoute(state.time-.8-i*.22,[-2.7,2.7,0][i],1.8+Math.sin(state.time+i)*.2);", "const p=escapeRoute(state.time-.25-i*.07,[-4.7,4.7,0][i],i===2?4.2:.8+Math.sin(state.time+i)*.2);")
s=s.replace("start=escapeRoute(b.born-.8,[-2.7,2.7,0][b.drone],1.8)", "start=escapeRoute(b.born-.25-b.drone*.07,[-4.7,4.7,0][b.drone],b.drone===2?4.2:.8)")
s=s.replace("silver = material(0x536e80);", "silver = own(new THREE.MeshStandardMaterial({color:0x5a7183,metalness:.72,roughness:.34}));")
write(str(p),s)
