from pathlib import Path
import os

def write(p,s):
 p=Path(p);p.write_text(s,encoding='utf-8')
 with p.open('r+b') as f:f.flush();os.fsync(f.fileno())
p=Path('src/game/buenosAiresEscapeScene.js');s=p.read_text(encoding='utf-8')
s=s.replace("pulseMesh = mesh(own(new THREE.SphereGeometry(1,16,10)),pulseMat,root);\n  pulseMat.wireframe = true;", "pulseMesh = mesh(ring,pulseMat,root);\n  pulseMesh.rotation.x = Math.PI / 2;")
s=s.replace('car.rotation.y=pose.yaw;car.rotation.x=0;', 'const yawDelta = Math.atan2(Math.sin(pose.yaw-car.rotation.y),Math.cos(pose.yaw-car.rotation.y));\n    car.rotation.y += yawDelta * (1-Math.exp(-9*step)); car.rotation.x=0;')
write(p,s)
p=Path('src/game/studioSignalAudio.js');s=p.read_text(encoding='utf-8').replace('if (source) { try { source.stop(); }', 'if (source) { source.onended = null; try { source.stop(); }');write(p,s)
