import * as THREE from 'three';
import { ESCAPE_JUMP_START } from './buenosAiresEscapeLogic.js';

const PROFILES={low:{arcs:8,streaks:24},medium:{arcs:12,streaks:48},high:{arcs:18,streaks:80}};
const smooth=(a,b,value)=>THREE.MathUtils.smoothstep(value,a,b);
// Camera-aligned interior, instanced light arcs and one batch of streaks.
// The vehicle keeps its real route; the tunnel never moves gameplay objects.
export function createTimeTunnel(parent,{reducedMotion=false}={}){
  const root=new THREE.Group();root.name='Salto temporal / corredor 1999';parent.add(root);root.visible=false;
  const resources=new Set(), own=r=>(resources.add(r),r);
  const uniforms={uTime:{value:0},uTravel:{value:0},uFade:{value:0},uSpeed:{value:12}};
  const positions=[],uvs=[],indices=[];
  const around=64,along=36,length=170;
  for(let j=0;j<=along;j++)for(let i=0;i<=around;i++){
    const a=i/around*Math.PI*2,depth=j/along*length;
    positions.push(Math.cos(a)*9,Math.sin(a)*9,-depth);uvs.push(i/around,depth);
    if(i<around&&j<along){const n=j*(around+1)+i;indices.push(n,n+1,n+around+1,n+1,n+around+2,n+around+1);}
  }
  const shellGeo=own(new THREE.BufferGeometry());shellGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));shellGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));shellGeo.setIndex(indices);
  const bendShader=`vec2 bend(float depth,float time){float amount=pow(depth/170.0,2.0);return vec2(sin(depth*.035+time*.08)*5.0,cos(depth*.028+time*.06)*3.0)*amount;}`;
  const shellMat=own(new THREE.ShaderMaterial({name:'Salto / plasma volumetrico aparente',uniforms,
    vertexShader:`uniform float uTime;varying vec2 vTunnel;${bendShader}
      void main(){vTunnel=uv;vec3 p=position;p.xy+=bend(-p.z,uTime);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`uniform float uTime,uTravel,uFade;varying vec2 vTunnel;
      void main(){
        float a=vTunnel.x*6.283185,depth=vTunnel.y;
        float swirl=a+depth*.032-uTime*.10;
        float cloud=.5+.23*sin(swirl*3.0+sin(depth*.07-uTime*.16))+.18*sin(swirl*8.0-depth*.031+uTime*.27);
        float veins=pow(.5+.5*sin(swirl*9.0+sin(depth*.11+uTime*.25)*1.4),18.0);
        float wisps=pow(.5+.5*sin(a*17.0-depth*.045+sin(a*5.0+uTime*.2)),28.0);
        float band=exp(-pow((fract((depth+uTravel)/13.0)-.5)*32.0,2.0));
        float flow=pow(.5+.5*sin(depth*.15+uTime*.7+a*2.0),4.0);
        vec3 base=mix(vec3(.008,.018,.055),vec3(.055,.03,.15),cloud);
        vec3 ion=mix(vec3(.04,.36,.59),vec3(.22,.08,.48),.5+.5*sin(a*2.0+depth*.04));
        vec3 color=base+ion*(veins*.6+wisps*.22)*(.45+flow*.55)+vec3(.12,.29,.4)*band*.24;
        color+=vec3(.04,.12,.2)*smoothstep(45.0,170.0,depth);
        gl_FragColor=vec4(color,uFade*.99);
        #include <colorspace_fragment>
      }`,side:THREE.DoubleSide,forceSinglePass:true,transparent:true,depthWrite:false,toneMapped:false}));
  const shell=new THREE.Mesh(shellGeo,shellMat);shell.name='Salto / membrana envolvente';shell.renderOrder=0;shell.frustumCulled=false;root.add(shell);
  const arcGeo=own(new THREE.TorusGeometry(1,.007,4,80,Math.PI*1.68));
  const arcMat=own(new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  const arcs=new THREE.InstancedMesh(arcGeo,arcMat,18);arcs.name='Salto / arcos de fase';arcs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);arcs.frustumCulled=false;arcs.renderOrder=1;root.add(arcs);
  for(let i=0;i<18;i++)arcs.setColorAt(i,new THREE.Color());
  arcs.instanceColor.setUsage(THREE.DynamicDrawUsage);
  const streakGeo=own(new THREE.BufferGeometry()),seeds=[];
  for(let i=0;i<80;i++){const a=i*2.399963;for(const tail of [0,1])seeds.push(a,(i*19.731)%150,tail);}
  streakGeo.setAttribute('position',new THREE.Float32BufferAttribute(seeds,3));
  const streakMat=own(new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
    vertexShader:`uniform float uTime,uTravel,uSpeed,uFade;varying float vAlpha;varying float vWarm;${bendShader}
      void main(){float seed=position.x;float depth=mod(position.y-uTravel*(1.0+fract(seed*2.7)*.3)+1000.0,150.0)+1.0;
        depth+=position.z*(.9+uSpeed*.05);float a=seed+uTime*.12;float r=5.0+fract(seed*7.3)*2.6;
        vec3 p=vec3(cos(a)*r,sin(a)*r,-depth);p.xy+=bend(depth,uTime);
        vAlpha=(1.0-position.z*.86)*smoothstep(0.0,8.0,depth)*(1.0-smoothstep(110.0,150.0,depth))*uFade;
        vWarm=fract(seed*1.7);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`varying float vAlpha,vWarm;void main(){gl_FragColor=vec4(mix(vec3(.24,.85,1.0),vec3(.65,.42,1.0),vWarm),vAlpha*.72);
      #include <colorspace_fragment>
    }`}));
  const streaks=new THREE.LineSegments(streakGeo,streakMat);streaks.name='Salto / estelas de velocidad';streaks.frustumCulled=false;streaks.renderOrder=1;root.add(streaks);
  const coreMat=own(new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float uTime,uFade;varying vec2 vUv;void main(){
      vec2 p=(vUv-.5)*2.0;float r=length(p),a=atan(p.y,p.x);
      float corona=exp(-abs(r-.19)*42.0);float glow=exp(-r*5.0);
      float rays=pow(.5+.5*sin(a*12.0+uTime*.25+r*10.0),9.0)*glow;
      vec3 color=vec3(.015,.04,.09)+vec3(.08,.4,.65)*glow+vec3(.42,.87,1.0)*corona*.55+vec3(.18,.2,.4)*rays;
      color+=vec3(.65,.86,.95)*exp(-r*r*280.0);
      gl_FragColor=vec4(color,uFade*.995);
      #include <colorspace_fragment>
    }`,side:THREE.DoubleSide,forceSinglePass:true}));
  const core=new THREE.Mesh(own(new THREE.CircleGeometry(14,64)),coreMat);core.name='Salto / horizonte temporal';core.frustumCulled=false;core.renderOrder=-1;root.add(core);
  const dummy=new THREE.Object3D(),color=new THREE.Color();let disposed=false;
  function center(depth,time,target){const amount=(depth/170)**2;target.set(Math.sin(depth*.035+time*.08)*5*amount,Math.cos(depth*.028+time*.06)*3*amount,-depth);}
  function update(state,camera){
    if(disposed)return;
    const age=state.time-ESCAPE_JUMP_START;root.visible=age>=0;if(!root.visible)return;
    const profile=PROFILES[state.tier]||PROFILES.low, time=reducedMotion?age*.08:age;
    const travel=reducedMotion?age*2:age*(12+Math.min(age,14)*.8);
    uniforms.uTime.value=time;uniforms.uTravel.value=travel;uniforms.uSpeed.value=reducedMotion?2:12+Math.min(age,14)*1.6;
    uniforms.uFade.value=smooth(0,2.1,age);
    root.position.copy(camera.position);root.quaternion.copy(camera.quaternion);
    arcs.count=profile.arcs;arcMat.opacity=uniforms.uFade.value*(reducedMotion?.36:.68);
    for(let i=0;i<profile.arcs;i++){
      const depth=(i/profile.arcs*150-travel+3000)%150+1;
      center(depth,time,dummy.position);dummy.rotation.set(Math.sin(i*1.7)*.035,Math.cos(i*2.1)*.035,i*1.83+time*.12);
      dummy.scale.set(8.4,8.4*(1+Math.sin(i)*.035),8.4);dummy.updateMatrix();arcs.setMatrixAt(i,dummy.matrix);
      const fade=smooth(1,9,depth)*(1-smooth(110,151,depth));
      color.setRGB((i%3===0?.52:.16)*fade,(i%3===0?.27:.7)*fade,.92*fade);arcs.setColorAt(i,color);
    }
    arcs.instanceMatrix.needsUpdate=true;arcs.instanceColor.needsUpdate=true;
    streaks.visible=!reducedMotion;streakGeo.setDrawRange(0,profile.streaks*2);
    center(169,time,core.position);
  }
  return {root,update,get stats(){return{visible:root.visible,arcs:arcs.count,streaks:streaks.visible?streakGeo.drawRange.count/2:0,opacity:uniforms.uFade.value};},
    dispose(){if(disposed)return;disposed=true;root.removeFromParent();arcs.dispose();resources.forEach(r=>r.dispose());resources.clear();}};
}


// Preserve the real car, effects and lighting while hiding the exterior behind
// the fully formed corridor. Reapply after city updates, restore on every exit.
export function createTunnelBackdrop(cityRoot,protectedRoots){
 const hidden=new Map();let active=false;
 function hide(){
  if(!active){
   active=true;const keep=new Set(protectedRoots),ancestors=new Set();
   cityRoot.traverse(object=>{if(object.isLight)keep.add(object);});
   for(const object of keep)for(let node=object;node;node=node.parent){ancestors.add(node);if(node===cityRoot)break;}
   function visit(node){
    if(keep.has(node))return;
    for(const child of node.children){
     if(ancestors.has(child))visit(child);
     else hidden.set(child,child.visible);
    }
   }
   visit(cityRoot);
  }
  for(const object of hidden.keys())object.visible=false;
 }
 function restore(){for(const [object,visible] of hidden)object.visible=visible;hidden.clear();active=false;}
 return{hide,restore,get active(){return active;}};
}
