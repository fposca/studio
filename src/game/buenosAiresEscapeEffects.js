import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { escapeRoute, escapeDroneRoute, ESCAPE_PROFILES, ESCAPE_BARRIER, ESCAPE_PULSE_DURATION } from './buenosAiresEscapeLogic.js';

// A bounded pool driven by the existing city clock. Detailed static assemblies
// are merged by finish; every GPU resource belongs to this factory.
export function createEscapeEffects(parent, { reducedMotion = false } = {}) {
  const root = new THREE.Group(); root.name = 'Fuga / interceptores y energia'; parent.add(root);
  const resources = new Set(), own = resource => (resources.add(resource), resource);
  const basic = (color, opacity = 1) => own(new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1,
    depthWrite: opacity === 1, toneMapped: false, blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending }));
  const steel = own(new THREE.MeshStandardMaterial({ color: 0x647986, metalness: .78, roughness: .3, emissive: 0x203542, emissiveIntensity: .32 }));
  const carbon = own(new THREE.MeshStandardMaterial({ color: 0x101d29, metalness: .5, roughness: .46, emissive: 0x0b1721, emissiveIntensity: .35 }));
  const trim = own(new THREE.MeshStandardMaterial({ color: 0xc4d3d8, metalness: .83, roughness: .24 }));
  const cyan = basic(0x83f8ff), amber = basic(0xffa76e);
  const cube = own(new THREE.BoxGeometry(1, 1, 1));
  const bevel = own(new RoundedBoxGeometry(1, 1, 1, 2, .12));
  const cylinder = own(new THREE.CylinderGeometry(.5, .5, 1, 16));
  const torus = own(new THREE.TorusGeometry(1, .045, 6, 40));
  const ball = own(new THREE.SphereGeometry(1, 16, 10));
  const plane = own(new THREE.PlaneGeometry(1, 1));
  function mesh(geometry, material, group, position = [0,0,0], scale = [1,1,1]) {
    const result = new THREE.Mesh(geometry, material); result.position.set(...position); result.scale.set(...scale);
    result.userData.cityKeep = true; result.castShadow = false; group.add(result); return result;
  }
  function assembly(parts) {
    const pieces = parts.map(([geometry, position, scale, rotation = [0,0,0]]) => {
      const copy = geometry.index ? geometry.toNonIndexed() : geometry.clone(); copy.scale(...scale);
      copy.rotateX(rotation[0]); copy.rotateY(rotation[1]); copy.rotateZ(rotation[2]); copy.translate(...position); return copy;
    });
    const geometry = own(mergeGeometries(pieces)); pieces.forEach(piece => piece.dispose()); return geometry;
  }
  // Small shared radial texture instead of bloom/postprocessing or point lights.
  const pixels = new Uint8Array(32 * 32 * 4);
  for (let y=0;y<32;y++) for (let x=0;x<32;x++) {
    const i=(y*32+x)*4, radius=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);
    pixels[i]=pixels[i+1]=pixels[i+2]=255; pixels[i+3]=Math.round(255 * Math.max(0, Math.exp(-radius*radius*5)-Math.exp(-5)));
  }
  const glowMap = own(new THREE.DataTexture(pixels,32,32)); glowMap.needsUpdate=true;
  glowMap.magFilter=glowMap.minFilter=THREE.LinearFilter;
  const glowMaterial = color => own(new THREE.SpriteMaterial({ map:glowMap, color, transparent:true, opacity:.65, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false }));
  function glow(group, material, position, scale) { const sprite=new THREE.Sprite(material);sprite.position.set(...position);sprite.scale.set(scale,scale,1);group.add(sprite);return sprite; }

  // Bevelled titanium shell, carbon belly, swept arms, turbine cages, cooling
  // fins and a recessed optical head. Seven shared static draws per interceptor.
  const hullParts=[[bevel,[0,.04,0],[.76,.32,1.1]], [bevel,[0,.22,.1],[.52,.16,.7]]];
  const darkParts=[[bevel,[0,-.15,0],[.64,.18,.87]], [bevel,[0,.02,.57],[.5,.23,.12]]];
  const trimParts=[], lightParts=[], warningParts=[], ventParts=[];
  for (const side of [-1,1]) {
    hullParts.push([bevel,[side*.53,-.01,-.04],[.64,.14,.3],[0,side*-.3,0]], [cylinder,[side*.84,0,-.1],[.48,.72,.48],[Math.PI/2,0,0]]);
    darkParts.push([cylinder,[side*.84,0,-.48],[.37,.05,.37],[Math.PI/2,0,0]]);
    trimParts.push([torus,[side*.84,0,-.47],[.22,.22,.22]], [torus,[side*.84,0,.25],[.225,.225,.225]]);
    lightParts.push([torus,[side*.84,0,-.51],[.165,.165,.165]], [bevel,[side*.27,.28,.06],[.026,.02,.53]]);
    warningParts.push([bevel,[side*1.075,.02,-.12],[.025,.08,.19]]);
    for(let n=0;n<5;n++)ventParts.push([cube,[side*.37,.06,-.32+n*.12],[.02,.1,.025]]);
    for(const z of [-.31,.31])trimParts.push([cylinder,[side*.26,.217,z],[.038,.018,.038]]);
  }
  const hullGeo=assembly(hullParts), darkGeo=assembly(darkParts), trimGeo=assembly(trimParts);
  const lightGeo=assembly(lightParts), warningGeo=assembly(warningParts), ventGeo=assembly(ventParts);
  const rotorGeo=assembly(Array.from({length:8},(_,i)=>[bevel,[Math.sin(i*Math.PI/4)*.09,Math.cos(i*Math.PI/4)*.09,0],[.04,.14,.018],[0,0,-i*Math.PI/4]]));
  const drones=Array.from({length:3},(_,i)=>{
    const group=new THREE.Group();group.name=`Interceptor / turbinas ${i+1}`;root.add(group);group.visible=false;
    mesh(hullGeo,steel,group);mesh(darkGeo,carbon,group);mesh(trimGeo,trim,group);mesh(ventGeo,carbon,group);
    const engineMat=basic(0x75eeff), sensorMat=basic(0xff7c5f), haloMat=glowMaterial(0x45cfff);
    mesh(lightGeo,engineMat,group);mesh(warningGeo,amber,group);
    mesh(ball,sensorMat,group,[0,.02,.645],[.12,.075,.025]);
    const rotors=[];
    for(const x of [-.84,.84]) { rotors.push(mesh(rotorGeo,trim,group,[x,0,-.495]));glow(group,haloMat,[x,0,-.55],.8); }
    return {group,engineMat,sensorMat,haloMat,rotors};
  });

  const fieldVertex=`varying vec2 vUv;
    void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
  const fieldFragment=`uniform float uTime,uOpacity,uHit;
    uniform vec2 uImpact; varying vec2 vUv;
    void main(){
      vec2 p=(vUv-.5)*vec2(3.6,7.0), grid=p*3.0, cellSize=vec2(1.73205,3.0);
      vec2 a=mod(grid,cellSize)-cellSize*.5, b=mod(grid-cellSize*.5,cellSize)-cellSize*.5;
      vec2 cell=abs(dot(a,a)<dot(b,b)?a:b);
      float hex=max(cell.x,dot(cell,vec2(.5,.866025)));
      float lattice=1.0-smoothstep(.025,.09,abs(hex-.866025));
      float edge=exp(-min(vUv.x,1.0-vUv.x)*70.0)+exp(-min(vUv.y,1.0-vUv.y)*90.0);
      float scan=exp(-pow((fract(vUv.y-uTime*.16)-.5)*26.0,2.0));
      float filament=exp(-abs(p.x-.065*sin(p.y*23.0+uTime*2.0)-.03*sin(p.y*49.0-uTime))*80.0);
      float distanceToHit=length(p-uImpact);
      float ripple=exp(-pow((distanceToHit-uHit*5.5)*6.0,2.0))*step(0.0,uHit)*(1.0-clamp(uHit,0.0,1.0));
      float bars=step(.78,fract((p.x+p.y)*2.7))*smoothstep(3.22,3.43,abs(p.y));
      float alpha=(.035+lattice*.2+edge*.65+scan*.19+filament*.15+bars*.3+ripple*.75)*uOpacity;
      vec3 color=mix(vec3(.67,.07,.25),vec3(1.0,.45,.22),scan*.65+bars*.3);
      color=mix(color,vec3(.85,1.0,1.0),clamp(ripple+edge*.4,0.0,1.0));
      gl_FragColor=vec4(color,min(alpha,.85));
      #include <colorspace_fragment>
    }`;
  const frameParts=[];
  for(const x of [-ESCAPE_BARRIER.width/2,ESCAPE_BARRIER.width/2]) {
    frameParts.push([bevel,[x,0,0],[.13,7.2,.21]]);
    for(const y of [-3.45,3.45])frameParts.push([bevel,[x,y,0],[.35,.44,.3]]);
  }
  for(const y of [-3.5,3.5])frameParts.push([bevel,[0,y,0],[3.7,.13,.21]]);
  const frameGeo=assembly(frameParts);
  const emitterParts=[];
  for(const z of [-.17,.17]){
    for(const x of [-1.8,1.8]){
      emitterParts.push([cube,[x,0,z],[.035,6.6,.02]]);
      for(const y of [-3.45,3.45])emitterParts.push([bevel,[x,y,z],[.16,.22,.035]]);
    }
    for(const y of [-3.5,3.5])emitterParts.push([cube,[0,y,z],[3.3,.035,.02]]);
  }
  const emitGeo=assembly(emitterParts);
  const arrowGeo=assembly([[cube,[-.14,.2,0],[.075,.5,.04],[0,0,-.62]],[cube,[-.14,-.2,0],[.075,.5,.04],[0,0,.62]]]);
  const barriers=Array.from({length:3},()=>{
    const group=new THREE.Group();group.name='Barrera / membrana de intercepcion';root.add(group);group.visible=false;
    mesh(frameGeo,carbon,group);mesh(emitGeo,amber,group);
    const mat=own(new THREE.ShaderMaterial({ name:'Fuga / energia hexagonal con impacto',
      uniforms:{uTime:{value:0},uOpacity:{value:1},uHit:{value:-1},uImpact:{value:new THREE.Vector2()}},
      vertexShader:fieldVertex,fragmentShader:fieldFragment,transparent:true,depthWrite:false,
      blending:THREE.AdditiveBlending,side:THREE.DoubleSide,forceSinglePass:true,toneMapped:false }));
    mesh(plane,mat,group,[0,0,0],[ESCAPE_BARRIER.width,ESCAPE_BARRIER.height,1]);
    const safe=new THREE.Group();group.add(safe);safe.name='Carril libre / baliza cian';
    mesh(arrowGeo,cyan,safe);mesh(arrowGeo,cyan,safe,[.6,0,0]);
    return {group,mat,safe};
  });

  // Lens, white-hot core and tapered exhaust: four draws per pooled bolt.
  const boltCore=basic(0xffecd1), boltShell=basic(0xff9856,.32);
  const tailGeo=own(new THREE.ConeGeometry(.12,2,8,1,true)); tailGeo.rotateX(-Math.PI/2); tailGeo.translate(0,0,-1.05);
  const tailMat=own(new THREE.ShaderMaterial({ uniforms:{},vertexShader:fieldVertex,
    fragmentShader:`varying vec2 vUv; void main(){float a=pow(1.0-vUv.y,1.7)*.48;gl_FragColor=vec4(1.0,.25,.07,a);}`,
    transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,blending:THREE.AdditiveBlending,toneMapped:false }));
  const boltHalo=glowMaterial(0xff7138);
  const bolts=Array.from({length:8},()=>{
    const group=new THREE.Group();group.name='Interceptor / plasma y estela';root.add(group);group.visible=false;
    mesh(ball,boltCore,group,[0,0,0],[.065,.065,.25]);mesh(ball,boltShell,group,[0,0,0],[.15,.15,.38]);
    mesh(tailGeo,tailMat,group);glow(group,boltHalo,[0,0,0],.95);return group;
  });

  // Low-opacity ion front and a local shield. No full-screen flash or wireframe.
  const pulseMat=own(new THREE.ShaderMaterial({ uniforms:{uAge:{value:0}}, vertexShader:fieldVertex,
    fragmentShader:`uniform float uAge; varying vec2 vUv; void main(){
      vec2 p=vUv-.5;float r=length(p)*2.0;
      float front=exp(-pow((r-.84)*65.0,2.0));float wake=exp(-pow((r-.71)*18.0,2.0))*.26;
      float segments=.6+.4*pow(.5+.5*sin(atan(p.y,p.x)*32.0-uAge*2.0),4.0);
      float a=(front+wake)*segments*(1.0-uAge)*.85;
      gl_FragColor=vec4(.22,.87,1.0,a);
      #include <colorspace_fragment>
    }`, transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,blending:THREE.AdditiveBlending,toneMapped:false }));
  const pulse=mesh(own(new THREE.CircleGeometry(1,64)),pulseMat,root);pulse.name='Fuego / onda de ionizacion';pulse.rotation.x=-Math.PI/2;pulse.visible=false;
  const shieldMat=own(new THREE.ShaderMaterial({uniforms:{uStrength:{value:0},uColor:{value:new THREE.Color(0x72efff)}},
    vertexShader:`varying vec3 vNormal,vEye;varying vec2 vUv;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vEye=normalize(-p.xyz);vUv=uv;gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform float uStrength;uniform vec3 uColor;varying vec3 vNormal,vEye;varying vec2 vUv;
      void main(){float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(vEye))),2.8);
      float bands=pow(.5+.5*sin(vUv.y*100.0),18.0)*.06;
      gl_FragColor=vec4(uColor,(rim*.32+bands)*uStrength);
      #include <colorspace_fragment>
    }`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  const shield=mesh(ball,shieldMat,root,[0,0,0],[1.55,1.15,2.3]);shield.name='Fuego / escudo reactivo';shield.visible=false;
  const sparkGeo=own(new THREE.BufferGeometry()), sparkData=new Float32Array(24*3);
  sparkGeo.setAttribute('position',new THREE.BufferAttribute(sparkData,3).setUsage(THREE.DynamicDrawUsage));
  const sparkMat=own(new THREE.PointsMaterial({map:glowMap,color:0xffc49b,size:.2,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  const sparks=new THREE.Points(sparkGeo,sparkMat);sparks.frustumCulled=false;sparks.visible=false;root.add(sparks);
  const pulsePos=new THREE.Vector3(), start=new THREE.Vector3(), end=new THREE.Vector3(), impact=new THREE.Vector3();
  let lastHits=0, hitAt=-100, disposed=false;
  function reset(){lastHits=0;hitAt=-100;root.traverse(object=>{if(object.isGroup&&object!==root)object.visible=false;});pulse.visible=shield.visible=sparks.visible=false;}
  function triggerPulse(position){pulsePos.copy(position);}
  function update(state,car){
    const time=state.time, animatedTime=reducedMotion?0:time, profile=ESCAPE_PROFILES[state.tier]||ESCAPE_PROFILES.low;
    drones.forEach(({group,engineMat,sensorMat,haloMat,rotors},i)=>{
      group.visible=time>=52&&time<164&&i<profile.drones;if(!group.visible)return;
      const p=escapeDroneRoute(time,i), disabled=state.droneDisabledUntil[i]>time;
      group.position.set(p.x,p.y-(disabled?.45:0),p.z);group.rotation.set(disabled?.12:0,p.yaw,disabled?.15:Math.sin(animatedTime*1.4+i)*.035,'YXZ');
      engineMat.color.setHex(disabled?0x263948:0x75eeff);sensorMat.color.setHex(disabled?0x3c2930:0xff7c5f);
      haloMat.opacity=disabled?.08:.56+Math.sin(animatedTime*4+i)*.08;
      for(const rotor of rotors)rotor.rotation.z=disabled?0:animatedTime*8;
    });
    barriers.forEach(({group,mat,safe},i)=>{
      const b=state.barriers[i];group.visible=!!b;if(!b)return;
      const p=escapeRoute(b.due,b.side*ESCAPE_BARRIER.offset);group.position.set(p.x,p.y,p.z);group.rotation.y=p.yaw+Math.PI;
      mat.uniforms.uTime.value=animatedTime;mat.uniforms.uOpacity.value=Math.min(1,(b.due-time+1.2)*1.5);
      mat.uniforms.uHit.value=b.hit?time-b.due:-1;
      mat.uniforms.uImpact.value.set(THREE.MathUtils.clamp((b.impactLateral||0)-b.side*ESCAPE_BARRIER.offset,-ESCAPE_BARRIER.width/2,ESCAPE_BARRIER.width/2),b.impactVertical||0);
      safe.visible=time<b.due;safe.position.set(-b.side*(ESCAPE_BARRIER.offset+2.35),-.6,0);safe.rotation.z=b.side<0?Math.PI:0;
    });
    bolts.forEach((group,i)=>{
      const b=state.bolts[i];group.visible=!!b&&i<profile.bolts;if(!group.visible)return;
      const p=escapeRoute(b.due,b.lateral,b.vertical), origin=escapeDroneRoute(b.born,b.drone);
      start.set(origin.x,origin.y,origin.z);end.set(p.x,p.y,p.z);
      group.position.copy(start).lerp(end,THREE.MathUtils.clamp((time-b.born)/(b.due-b.born),0,1));group.lookAt(end);
    });
    const age=1-state.pulse/ESCAPE_PULSE_DURATION;
    pulse.visible=state.pulse>0;pulse.position.copy(pulsePos);pulse.scale.setScalar(1+age*15);pulseMat.uniforms.uAge.value=age;
    if(state.hits!==lastHits){lastHits=state.hits;hitAt=time;impact.copy(car.position);}
    const hitAge=time-hitAt, hitStrength=Math.max(0,1-hitAge/.75);
    shield.visible=hitStrength>0||state.pulse>0;shield.position.copy(car.position);shield.rotation.y=car.rotation.y;
    shieldMat.uniforms.uStrength.value=reducedMotion?Math.max(hitStrength,state.pulse)*.45:Math.max(hitStrength,state.pulse);
    shieldMat.uniforms.uColor.value.setHex(hitStrength>0?0xffa270:0x72efff);
    sparks.visible=hitAge>=0&&hitAge<.8&&!reducedMotion;
    if(sparks.visible){
      const count=state.tier==='low'?12:24;sparkGeo.setDrawRange(0,count);sparks.position.copy(impact);sparkMat.opacity=1-hitAge/.8;
      for(let i=0;i<count;i++){const a=i*2.399, speed=2+(i%5)*.6;sparkData[i*3]=Math.cos(a)*speed*hitAge;sparkData[i*3+1]=Math.sin(i*1.7)*hitAge*2-hitAge*hitAge*2;sparkData[i*3+2]=Math.sin(a)*speed*hitAge;}
      sparkGeo.attributes.position.needsUpdate=true;
    }
  }
  return {root,update,reset,triggerPulse,dispose(){if(disposed)return;disposed=true;root.removeFromParent();resources.forEach(resource=>resource.dispose());resources.clear();}};
}
