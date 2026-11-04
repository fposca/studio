import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const TAU=Math.PI*2;
const vertexShader=`varying vec2 vUv; void main(){
 vUv=uv;vec4 localPosition=vec4(position,1.);
 #ifdef USE_INSTANCING
 localPosition=instanceMatrix*localPosition;
 #endif
 gl_Position=projectionMatrix*modelViewMatrix*localPosition;
}`;

// Geometric fixtures share meshes/materials; the light comes from bounded emissive surfaces.
function parts(parent){
 const batches=new Map();
 const add=(geometry,material,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{
  if(!batches.has(geometry))batches.set(geometry,new Map());
  const byMaterial=batches.get(geometry);
  if(!byMaterial.has(material))byMaterial.set(material,[]);
  byMaterial.get(material).push([x,y,z,sx,sy,sz,rx,ry,rz]);
 };
 add.flush=()=>{
  const transform=new THREE.Object3D();
  for(const [geometry,materials] of batches)for(const [material,items] of materials){
   const mesh=new THREE.InstancedMesh(geometry,material,items.length);
   mesh.name='Matrix / power assembly';mesh.receiveShadow=true;
   items.forEach(([x,y,z,sx,sy,sz,rx,ry,rz],i)=>{
    transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);transform.rotation.set(rx,ry,rz);
    transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
   });
   mesh.computeBoundingSphere();parent.add(mesh);
  }
  batches.clear();
 };
 return add;
}
function mesh(parent,geometry,material,x=0,y=0,z=0){
 const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;
}
function decal(paint,w=512,h=128){
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 paint(canvas.getContext('2d'),w,h);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 return new THREE.MeshBasicMaterial({map,toneMapped:false});
}
function armorGeometry(w,h){
 const c=.22,s=new THREE.Shape();
 s.moveTo(-w/2+c,-h/2);s.lineTo(w/2-c,-h/2);s.lineTo(w/2,-h/2+c);
 s.lineTo(w/2,h/2-c);s.lineTo(w/2-c,h/2);s.lineTo(-w/2+c,h/2);
 s.lineTo(-w/2,h/2-c);s.lineTo(-w/2,-h/2+c);s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:.055,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.025,bevelThickness:.025});
 return g;
}

export function createMatrixEnergySystem(root){
 const plane=new THREE.PlaneGeometry(1,1),box=new THREE.BoxGeometry(1,1,1),ring=new THREE.TorusGeometry(1,.045,8,48);
 const rounded=new RoundedBoxGeometry(1,1,1,1,.06);
 const cylinder=new THREE.CylinderGeometry(1,1,1,32,1,true);
 const bolt=new THREE.CylinderGeometry(.032,.032,.025,6);
 const armor=armorGeometry(5.72,3.22),inset=armorGeometry(4.05,2.15);
 const steel=new THREE.MeshStandardMaterial({color:0x617d8c,metalness:.72,roughness:.32});
 const shell=new THREE.MeshStandardMaterial({color:0x213747,metalness:.72,roughness:.38});
 const pale=new THREE.MeshStandardMaterial({color:0x81949e,metalness:.65,roughness:.36});
 const black=new THREE.MeshStandardMaterial({color:0x07121d,metalness:.45,roughness:.5});
 const copper=new THREE.MeshStandardMaterial({color:0xb98e63,metalness:.78,roughness:.3});
 const blue=new THREE.MeshBasicMaterial({color:0x397181,toneMapped:false});
 const white=new THREE.MeshBasicMaterial({color:0xb1f7fc,toneMapped:false});
 const time={value:0};
 const plasma=new THREE.ShaderMaterial({
  uniforms:{time},vertexShader,side:THREE.DoubleSide,toneMapped:false,
  fragmentShader:`varying vec2 vUv; uniform float time;
   void main(){
    float helix=pow(.5+.5*sin(vUv.x*25.13274+vUv.y*21.-time*1.7),18.);
    float filaments=pow(.5+.5*sin(vUv.x*56.5487-vUv.y*31.+time*2.2),34.);
    float flow=pow(.5+.5*sin(vUv.y*50.-time*3.),10.);
    float ends=smoothstep(0.,.12,vUv.y)*smoothstep(0.,.12,1.-vUv.y);
    vec3 color=vec3(.015,.085,.12)+vec3(.09,.5,.64)*(.22+helix*.65);
    color+=vec3(.6,.85,1.)*filaments*.7+vec3(.12,.2,.27)*flow;
    color=mix(vec3(.015,.04,.065),color,ends);
    gl_FragColor=vec4(color,1.);
    #include <colorspace_fragment>
   }`
 });
 const conduit=new THREE.ShaderMaterial({
  uniforms:{time},vertexShader,toneMapped:false,
  fragmentShader:`varying vec2 vUv;uniform float time;
   void main(){float head=pow(.5+.5*sin(vUv.y*18.-time*2.8),24.);
    vec3 color=vec3(.025,.16,.22)+vec3(.35,.7,.8)*head;
    gl_FragColor=vec4(color,1.);
    #include <colorspace_fragment>
   }`
 });
 const warning=decal(c=>{
  c.fillStyle='#091720';c.fillRect(0,0,512,128);c.fillStyle='#afc1c6';
  c.font='bold 29px monospace';c.fillText('NEX / FLUX CELL',25,46);
  c.fillStyle='#65e5ee';c.font='18px monospace';c.fillText('09.03  |  PLASMA CONTAINMENT',25,83);
  c.fillStyle='#b99463';for(let i=0;i<22;i++)c.fillRect(25+i*21,105,12,4);
 });
 const serial=decal(c=>{
  c.fillStyle='#172a36';c.fillRect(0,0,512,128);c.fillStyle='#afc2cb';
  c.font='bold 34px monospace';c.fillText('NEX // AIRLOCK',20,49);
  c.fillStyle='#6d95a5';c.font='18px monospace';c.fillText('PRESSURE SEAL  /  TYPE 03',20,85);
  for(let i=0;i<40;i++){c.fillStyle=i%3?'#4a6b7c':'#a7bec5';c.fillRect(20+i*8,105,i%3?3:5,10);}
 });
 const status=['ACCESO BLOQUEADO','ABRIENDO COMPUERTA','ENLACE HABILITADO'].map((title,i)=>decal(c=>{
  c.fillStyle='#08141e';c.fillRect(0,0,512,128);c.fillStyle=i===2?'#93f2e4':i===1?'#edc88c':'#dc8bb9';
  c.fillRect(16,20,5,87);c.font='bold 29px monospace';c.fillText(title,39,62);
  c.font='16px monospace';c.fillText(i===2?'TRANSFERENCIA SEGURA':'F09 / CONTROL DE ENLACE',39,94);
 }));
 const gates=[],towerRoots=[];

 function createTower(object,index=towerRoots.length){
  const {width:w,height:h,depth:d}=object.geometry.parameters;
  // Retain the original solid bounds for player/orb/camera collision; replace its visible box.
  object.material=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false});object.castShadow=false;
  const assembly=new THREE.Group();assembly.name='Reactor de flujo / '+index;object.add(assembly);towerRoots.push(assembly);
  const p=parts(assembly),b=(m,x,y,z,sx,sy,sz,ry=0,rz=0)=>p(box,m,x,y,z,sx,sy,sz,0,ry,rz);
  const bodyHeight=h-1.05,r=Math.min(w,d)*.21;
  // Recessed core, ceramic containment rings, copper busbars and four structural corner spines.
  mesh(assembly,cylinder,plasma).scale.set(r*.98,bodyHeight,r*.98);
  for(let y=-bodyHeight/2+.12;y<bodyHeight/2;y+=.57){
   p(ring,steel,0,y,0,r*1.6,r*1.6,r*1.6,Math.PI/2);
   p(ring,blue,0,y+.075,0,r*1.38,r*1.38,r*1.38,Math.PI/2);
   for(const x of [-1,1])for(const z of [-1,1])b(copper,x*r*.86,y,z*r*.86,.09,.2,.09);
  }
  for(const x of [-1,1])for(const z of [-1,1]){
   b(shell,x*(w/2-.12),0,z*(d/2-.12),.2,h-.2,.2);
   b(pale,x*(w/2-.045),0,z*(d/2-.14),.07,h-.35,.13);
   b(copper,x*r*.94,0,z*r*.94,.065,bodyHeight,.065);
  }
  for(const y of [-1,1]){
   p(rounded,shell,0,y*(h/2-.18),0,w,.36,d);
   p(rounded,steel,0,y*(h/2-.35),0,w-.06,.08,d-.06);
   b(black,0,y*(h/2-.49),0,w*.74,.18,d*.74);
   p(ring,white,0,y*(h/2-.51),0,r*1.25,r*1.25,r*1.25,Math.PI/2);
  }
  for(let face=0;face<4;face++){
   const panel=new THREE.Group();panel.rotation.y=face*Math.PI/2;assembly.add(panel);
   const span=face%2?d:w,depth=(face%2?w:d)/2;
   const trim=parts(panel),bar=(m,x,y,z,sx,sy,sz)=>trim(box,m,x,y,z,sx,sy,sz);
   // Every face is detailed, including the broad sides visible from the central walkway.
   for(const side of [-1,1]){
    bar(black,side*(span*.5-.28),0,depth-.15,.23,h-.85,.18);
    bar(steel,side*(span*.5-.4),0,depth-.065,.045,h-.9,.1);
    const strip=mesh(panel,plane,conduit,side*(span*.5-.25),0,depth-.035);strip.scale.set(.055,h-.95,1);
    strip.name='Conducto de transferencia animado';
    for(let y=-h/2+.85;y<h/2-.65;y+=.38){
     bar(shell,side*(span*.5-.28),y,depth-.015,.1,.05,.09);
     bar(copper,side*(span*.5-.37),y,depth-.01,.055,.13,.08);
    }
   }
   // Armored waist collars bridge the frame while leaving the plasma visible.
   for(const y of [-h*.27,h*.27]){
    bar(shell,0,y,depth-.06,span-.25,.16,.14);
    bar(blue,0,y+.035,depth+.015,span*.5,.018,.016);
   }
   const tag=mesh(panel,plane,warning,0,h/2-.62,depth+.012);tag.scale.set(span-.45,(span-.45)/4,1);
   tag.name='Flux cell / identification';
   for(let i=0;i<7;i++)bar(i===3?white:blue,(i-3)*.16,-h/2+.21,depth+.015,.09,.04,.025);
   trim.flush();
  }
  p.flush();return assembly;
 }

 // These fixtures are static. Instance their repeated parts across the sector instead of
 // submitting hundreds of individual strips, fins and rings every frame.
 function finishTowers(){
  root.updateWorldMatrix(true,true);
  const inverse=root.matrixWorld.clone().invert(),batches=new Map();
  const collect=(object,matrix)=>{
   if(!batches.has(object.geometry))batches.set(object.geometry,new Map());
   const materials=batches.get(object.geometry);
   if(!materials.has(object.material))materials.set(object.material,[]);
   materials.get(object.material).push(matrix);
  };
  for(const assembly of towerRoots)assembly.traverse(object=>{
   if(!object.isMesh)return;
   const local=inverse.clone().multiply(object.matrixWorld);
   if(object.isInstancedMesh){for(let i=0;i<object.count;i++){
    const transform=new THREE.Matrix4();object.getMatrixAt(i,transform);collect(object,local.clone().multiply(transform));
   }}else collect(object,local);
  });
  for(const assembly of towerRoots)assembly.clear();
  const group=new THREE.Group();group.name='Matrix / instanced reactor network';root.add(group);
  for(const [geometry,materials] of batches)for(const [material,transforms] of materials){
   const mesh=new THREE.InstancedMesh(geometry,material,transforms.length);
   transforms.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.receiveShadow=true;
   mesh.computeBoundingSphere();group.add(mesh);
  }
 }

 function createGate(config,colliders,obstacles){
  const group=new THREE.Group();group.name='Compuerta espacial / '+config.id;group.position.z=config.z;root.add(group);
  const stateMaterial=new THREE.MeshBasicMaterial({color:0xcc72a6,toneMapped:false});
  const light=new THREE.MeshStandardMaterial({color:0x536e7a,emissive:0xcc72a6,emissiveIntensity:1.1,metalness:.45,roughness:.3});
  const fixed=parts(group),b=(m,x,y,z,w,h,d,ry=0,rz=0)=>fixed(box,m,x,y,z,w,h,d,0,ry,rz);
  for(const side of [-1,1]){
   b(shell,side*6.1,1.9,0,.36,3.8,1.1);b(pale,side*5.99,1.85,.53,.08,3.65,.08);
   for(const face of [-1,1]){
    b(black,side*6.1,1.92,face*.59,.19,2.9,.12);
    for(let i=0;i<7;i++)b(stateMaterial,side*6.1,.55+i*.43,face*.66,.06,.23,.018);
    b(copper,side*6.1,.26,face*.59,.23,.18,.12);
   }
   for(let y=.7;y<3.7;y+=1.1)b(shell,side*6.22,y,0,.35,.18,1.16);
  }
  b(shell,0,3.95,0,12.55,.58,1.15);b(pale,0,4.24,0,12.7,.06,1.18);
  b(black,0,.035,0,12,.07,1.1);
  for(const face of [-1,1]){
   b(steel,0,.075,face*.5,12,.045,.08);
   b(stateMaterial,0,.09,face*.47,11.6,.015,.025);
   for(const side of [-1,1]){
    b(black,side*3.6,3.96,face*.6,4.5,.27,.07);
    for(let i=0;i<12;i++)b(i%3===0?stateMaterial:steel,side*(1.55+i*.35),3.96,face*.66,.14,.12,.035,0,side*.4);
   }
  }
  const displays=[];
  for(const face of [-1,1]){
   const display=mesh(group,new THREE.PlaneGeometry(2.65,.44),status[0],0,3.96,face*.64);display.rotation.y=face<0?Math.PI:0;displays.push(display);
  }
  const leaves=[-1,1].map(side=>{
   const slab=mesh(group,new THREE.BoxGeometry(5.98,3.6,1.06),new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}),side*3,1.8,0);
   const body=mesh(slab,new THREE.BoxGeometry(5.98,3.6,.42),shell);body.castShadow=true;body.receiveShadow=true;
   slab.name='gate '+config.id+' / '+(side<0?'left':'right');slab.castShadow=false;
   colliders.push(slab);
   const obstacle={id:slab.name,x:side*3,z:config.z,hx:2.99,hz:.53};obstacles.push(obstacle);
   for(const face of [-1,1]){
    const skin=new THREE.Group();skin.rotation.y=face<0?Math.PI:0;skin.position.z=face*.225;slab.add(skin);
    const s=side*face,detail=parts(skin),q=(m,x,y,z,w,h,d,rz=0)=>detail(box,m,x,y,z,w,h,d,0,0,rz);
    mesh(skin,armor,steel,0,0,.005);
    mesh(skin,inset,shell,-s*.42,0,.095);
    // Recessed diagonal ribs, service hatch, mechanical locking fingers and seal at the seam.
    for(const y of [-.92,.92]){
     q(black,-s*.4,y,.17,3.8,.035,.04);
     q(pale,-s*.45,y+.07,.17,2.5,.035,.035);
     q(shell,s*1.74,y*.75,.16,.16,.8,.11,s*.48);
    }
    for(let i=0;i<7;i++)q(black,s*2.19,-.58+i*.18,.13,.42,.055,.04);
    q(copper,s*2.19,-.95,.14,.42,.07,.045);
    q(black,-s*2.68,0,.13,.17,2.9,.09);
    q(light,-s*2.69,0,.19,.05,2.75,.035);
    for(const y of [-1.24,1.24]){
     q(black,-s*2.25,y,.14,.5,.28,.09);
     q(pale,-s*2.24,y,.2,.32,.1,.055);
     q(copper,-s*2.24,y+.07,.21,.23,.025,.03);
    }
    const dial=new THREE.TorusGeometry(.52,.065,8,32,Math.PI);
    const half=mesh(skin,dial,black,-s*3,0,.17);half.rotation.z=s<0?Math.PI/2:-Math.PI/2;
    const halfLight=mesh(skin,new THREE.TorusGeometry(.43,.018,6,32,Math.PI),stateMaterial,-s*3,0,.24);halfLight.rotation.z=half.rotation.z;
    const info=mesh(skin,new THREE.PlaneGeometry(1.52,.38),serial,s*.4,.18,.185);info.name='Airlock / identification';
    for(const x of [-2.55,2.55])for(const y of [-1.4,1.4])detail(bolt,copper,x,y,.13,1,1,1,Math.PI/2);
    detail.flush();
   }
   return {slab,obstacle,side};
  });
  fixed.flush();
  const gate={...config,group,leaves,displays,stateMaterial,light,amount:null};gates.push(gate);return gate;
 }

 function update(dt,elapsed,progress,reducedMotion=false){
  time.value=elapsed;
  for(const gate of gates){
   const open=!!gate.open(progress),target=open?1:0;
   // A loaded save starts in its actual state. Pausing stops travel; reduced motion snaps.
   if(gate.amount===null||reducedMotion)gate.amount=target;
   else gate.amount=THREE.MathUtils.clamp(gate.amount+(open?1:-1)*dt/1.3,0,1);
   const eased=gate.amount*gate.amount*(3-2*gate.amount);
   for(const {slab,obstacle,side} of gate.leaves){
    slab.position.x=side*(3+eased*6.15);obstacle.x=slab.position.x;
   }
   const state=open?(gate.amount>=1?2:1):0;
   const color=state===2?0x8ae4df:state===1?0xe7bd7e:0xc76c9f;
   gate.stateMaterial.color.setHex(color);gate.light.emissive.setHex(color);
   for(const display of gate.displays)display.material=status[state];
  }
 }
 // Alternate status textures are not all attached to the scene when it is disposed.
 function dispose(){for(const material of status){material.map.dispose();material.dispose();}}
 return {createTower,finishTowers,createGate,update,dispose};
}
