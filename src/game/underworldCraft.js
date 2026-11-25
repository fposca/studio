import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const WOOD_URL = new URL("../assets/environments/ferry-oak.chapter11.jpg", import.meta.url).href;
const IRON_URL = new URL("../assets/environments/ferry-iron.chapter11.jpg", import.meta.url).href;
const BASALT_URL = new URL("../assets/environments/basalt.chapter11.jpg", import.meta.url).href;
const noiseGLSL = `
  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
      mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
  }
  float fbm(vec2 p) { return noise(p)*.57+noise(p*2.07+3.1)*.28+noise(p*4.13)*.15; }
`;
const effectVertex = `
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vUv=uv;
    vec4 mvPosition=modelViewMatrix*vec4(position,1.);
    gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
  }
`;

function addMesh(parent,geometry,material,x=0,y=0,z=0,name="") {
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);mesh.name=name;mesh.receiveShadow=true;parent.add(mesh);
  return mesh;
}
function tube(parent,points,radius,material,segments=32) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return addMesh(parent,new THREE.TubeGeometry(curve,segments,radius,6,false),material);
}
function rounded(x,y,z,radius=.012) { return new RoundedBoxGeometry(x,y,z,1,radius); }

// Bake static fittings by material, keeping the articulated lantern independent.
function batchStatic(parent,materials) {
  parent.updateMatrixWorld(true);
  const inverse=parent.matrixWorld.clone().invert();
  const collected=new Map(materials.map(material=>[material,[]])), originals=new Set();
  parent.traverse(object=>{
    if(!object.isMesh || object.isInstancedMesh || !collected.has(object.material))return;
    const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,object.matrixWorld));
    collected.get(object.material).push({object,geometry});originals.add(object.geometry);
  });
  for(const [material,parts] of collected){
    if(!parts.length)continue;
    const geometry=mergeGeometries(parts.map(part=>part.geometry),false);
    parts.forEach(({object,geometry})=>{object.removeFromParent();geometry.dispose();});
    addMesh(parent,geometry,material,0,0,0,material.name);
  }
  originals.forEach(geometry=>geometry.dispose());
}

function createFire(parent,seed,size=1) {
  const root=new THREE.Group();root.name="Fuego turbulento / lenguas, brasas y humo";parent.add(root);
  const clock={value:0},lit={value:0};
  const uniforms={...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uTime:clock,uLit:lit,uSeed:{value:seed}};
  const material=new THREE.ShaderMaterial({
    name:"Llama / turbulencia ascendente",uniforms,fog:true,
    transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:effectVertex,
    fragmentShader:`
      uniform float uTime,uLit,uSeed; varying vec2 vUv;
      #include <fog_pars_fragment>
    `+noiseGLSL+`
      void main(){
        float y=vUv.y,t=uTime*1.7+uSeed;
        vec2 flow=vec2(vUv.x*4.6,y*4.-t);
        float curl=fbm(flow+vec2(0.,-t*.35));
        float bend=(curl-.5)*.43*y+sin(y*7.-t*2.)*.07*y;
        float x=abs(vUv.x-.5+bend);
        float width=.34*pow(1.-y,.7)+.025;
        float body=1.-smoothstep(width*.35,width+.035,x);
        float tongues=fbm(vec2(vUv.x*8.+curl,y*5.-t*1.6));
        float density=smoothstep(.12,.72,body+(tongues-.5)*(.5+y*1.45)-y*.4);
        float alpha=density*smoothstep(0.,.07,y)*(1.-smoothstep(.83,1.,y));
        if(alpha<.015)discard;
        float heat=clamp(pow(body,2.1)*(1.-y*.9)+(tongues-.5)*.32,0.,1.);
        vec3 hot=mix(vec3(.75,.055,.003),vec3(1.,.43,.025),smoothstep(.12,.68,heat));
        hot=mix(hot,vec3(1.,.93,.61),pow(heat,5.));
        vec3 spirit=mix(vec3(.012,.24,.25),vec3(.12,.82,.65),heat);
        spirit=mix(spirit,vec3(.84,1.,.94),pow(heat,4.));
        gl_FragColor=vec4(mix(hot,spirit,uLit),alpha*.68);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  const geometry=new THREE.PlaneGeometry(.86*size,1.05*size);
  geometry.translate(0,.525*size,0);
  for(let i=0;i<3;i++){
    const layer=i===0?material:material.clone();
    layer.uniforms={...uniforms,uSeed:{value:seed+i*3.73}};
    const sheet=addMesh(root,geometry,layer);
    sheet.rotation.y=i*Math.PI/3;
    sheet.scale.setScalar([1,.86,.66][i]);
    sheet.position.x=[-.045,.035,.10][i]*size;
  }
  const smoke=new THREE.ShaderMaterial({
    name:"Humo fino de carbon",uniforms,fog:true,vertexShader:effectVertex,
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    fragmentShader:`
      uniform float uTime,uSeed; varying vec2 vUv;
      #include <fog_pars_fragment>
    `+noiseGLSL+`
      void main(){
        float y=vUv.y,bend=sin(y*5.-uTime*.7+uSeed)*y*.17;
        float cloud=fbm(vec2(vUv.x*3.1,y*3.6-uTime*.3+uSeed));
        float shape=1.-smoothstep(.09,.34+y*.2,abs(vUv.x-.5+bend));
        float alpha=shape*smoothstep(.27,.73,cloud)*sin(y*3.14159)*.2;
        gl_FragColor=vec4(vec3(.11,.09,.1),alpha);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  const smokeSheet=addMesh(root,new THREE.PlaneGeometry(1.25*size,1.7*size),smoke,0,1.12*size,0);
  const count=14,positions=new Float32Array(count*3),seeds=new Float32Array(count*3);
  for(let i=0;i<count;i++)seeds.set([(i*.618+seed*.13)%1,(i*.381+.2)%1,(i*.754+.1)%1],i*3);
  const sparksGeometry=new THREE.BufferGeometry();
  sparksGeometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
  sparksGeometry.setAttribute("seed",new THREE.BufferAttribute(seeds,3));
  const sparkMaterial=new THREE.ShaderMaterial({
    name:"Brasas / motas suaves",uniforms:{...uniforms,uSize:{value:size}},
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`
      uniform float uTime,uSize,uLit; attribute vec3 seed; varying float vFade,vLit;
      void main(){
        float age=fract(uTime*(.24+seed.y*.21)+seed.x);
        vec3 p=vec3(sin(age*5.+seed.x*21.)*.21*age,
          .05+age*1.52,cos(age*3.+seed.z*17.)*.19*age)*uSize;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(uSize*(14.+seed.y*9.)/max(1.,-mv.z),1.,5.);
        vFade=sin(age*3.14159)*(1.-age)*.85;vLit=uLit;
      }
    `,
    fragmentShader:`
      varying float vFade,vLit;
      void main(){
        float d=length(gl_PointCoord-.5)*2.;
        float alpha=(1.-smoothstep(.08,1.,d))*vFade;
        gl_FragColor=vec4(mix(vec3(1.,.48,.08),vec3(.32,.95,.79),vLit),alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const sparks=new THREE.Points(sparksGeometry,sparkMaterial);sparks.frustumCulled=false;root.add(sparks);
  const coal=new THREE.MeshStandardMaterial({
    name:"Carbon incandescente",color:0x18100b,roughness:1,emissive:0xff3911,emissiveIntensity:.8,
  });
  const coals=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.058*size,1),coal,19);
  const dummy=new THREE.Object3D();
  for(let i=0;i<19;i++){
    const angle=i*2.39996,radius=Math.sqrt(i/19)*.25*size;
    dummy.position.set(Math.cos(angle)*radius,.006+(i%3)*.009*size,Math.sin(angle)*radius);
    dummy.rotation.set(i*.8,i*.7,i*.3);dummy.scale.set(1.4,.55,1);dummy.updateMatrix();coals.setMatrixAt(i,dummy.matrix);
  }
  root.add(coals);
  return {root,update(time,activated,reducedMotion){
    clock.value=time;lit.value=activated?1:0;root.scale.setScalar(activated?1:.8);
    smokeSheet.rotation.y=.15*Math.sin(time*.2+seed)+seed;sparks.visible=!reducedMotion;
    coal.emissive.setHex(activated?0x1ca896:0xff3911);coal.emissiveIntensity=.6+Math.sin(time*4+seed)*.12;
  }};
}

function hullPoint(t,angle,inset=0) {
  const width=.08+.82*Math.pow(Math.sin(Math.PI*t),.62);
  const rise=.24*Math.pow(Math.abs(t*2-1),3);
  return new THREE.Vector3((width-inset)*Math.sin(angle),
    -.46+.82*(1.-Math.cos(angle))+rise,-2.25+t*4.5);
}
function hullPlank(index,bands=12) {
  const positions=[],uvs=[],indices=[];
  const a0=-Math.PI/2+index*Math.PI/bands+.007,a1=-Math.PI/2+(index+1)*Math.PI/bands-.007;
  for(let j=0;j<=28;j++){
    for(const a of [a0,a1]){
      const t=j/28,p=hullPoint(t,a);
      positions.push(p.x,p.y,p.z);uvs.push(t*2.5,index*.075+(a-a0)*.32);
    }
    if(j<28){const k=j*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function woodUvs(geometry) {
  const {position,normal,uv}=geometry.attributes;
  for(let i=0;i<position.count;i++)uv.setXY(i,position.getZ(i)*.65,
    Math.abs(normal.getY(i))>.5?position.getX(i)*1.7:position.getY(i)*1.7);
  return geometry;
}

export function createUnderworldCraft(parent,flamePositions) {
  const root=new THREE.Group();root.name="Artesania infernal / barca y braseros";parent.add(root);
  const wood=new THREE.MeshStandardMaterial({name:"Tablas de roble / casco curvo",color:0xc0a48c,roughness:.83,metalness:.03,bumpScale:.018,side:THREE.DoubleSide});
  const darkWood=wood.clone();darkWood.name="Cuadernas y bancos carbonizados";darkWood.color.setHex(0x766052);
  const iron=new THREE.MeshStandardMaterial({name:"Hierro forjado / oxidacion",color:0x918680,roughness:.73,metalness:.62,bumpScale:.012});
  const bronze=new THREE.MeshStandardMaterial({name:"Cantos de bronce desgastado",color:0x8d6b40,roughness:.53,metalness:.75});
  const stone=new THREE.MeshStandardMaterial({name:"Basalto tallado / braseros",color:0x8b8385,roughness:.94,bumpScale:.055});
  const rope=new THREE.MeshStandardMaterial({name:"Soga de canamo",color:0x8b7658,roughness:1});
  const textures=new Set();
  let disposed=false,time=0;
  const flames=flamePositions.map(([x,z],i)=>{
    const pedestal=new THREE.Group();pedestal.name="Llama del puente "+(i+1);
    pedestal.position.set(x,0,z);root.add(pedestal);
    addMesh(pedestal,new THREE.CylinderGeometry(.37,.44,.12,12),stone,0,.06);
    addMesh(pedestal,new THREE.CylinderGeometry(.25,.32,.49,12),stone,0,.345);
    addMesh(pedestal,new THREE.CylinderGeometry(.3,.3,.065,16),iron,0,.59);
    const profile=[[.1,0],[.22,.04],[.36,.17],[.39,.23],[.39,.27],[.34,.27],[.30,.17],[.18,.09],[.1,.085]];
    addMesh(pedestal,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),28),iron,0,.61);
    const rim=addMesh(pedestal,new THREE.TorusGeometry(.365,.028,8,32),bronze,0,.865);rim.rotation.x=Math.PI/2;
    for(let j=0;j<6;j++){
      const a=j*Math.PI/3;
      const brace=addMesh(pedestal,rounded(.035,.24,.05),bronze,Math.sin(a)*.32,.73,Math.cos(a)*.32);
      brace.rotation.set(0,a,Math.sin(a)*.14);
    }
    const fire=createFire(pedestal,i*1.71);fire.root.position.y=.80;
    batchStatic(pedestal,[stone,iron,bronze]);
    return {pedestal,fire};
  });
  const dock=new THREE.Group();dock.name="Embarcadero / tablones y soportes";
  dock.position.set(2.88,0,-11.3);root.add(dock);
  for(let i=0;i<6;i++){
    const board=addMesh(dock,woodUvs(rounded(.205,.085,1.12)),wood,0,-.015,(i-2.5)*.216);
    board.rotation.y=Math.PI/2;
  }
  for(const x of [-.39,.39])addMesh(dock,rounded(.09,.13,1.4),iron,x,-.11,0);
  batchStatic(dock,[wood,iron]);
  const boat=new THREE.Group();boat.name="Barca infernal / roble, costillas y herrajes";root.add(boat);
  for(let i=0;i<12;i++)addMesh(boat,hullPlank(i),i%3===0?darkWood:wood);
  for(const side of [-1,1]){
    const points=Array.from({length:29},(_,i)=>hullPoint(i/28,side*Math.PI/2).toArray());
    tube(boat,points,.047,darkWood,56);
    tube(boat,points.map(([x,y,z])=>[x*1.015,y+.024,z]),.018,bronze,56);
  }
  // Floor aligns with the existing passenger foot height.
  for(let i=-3;i<=3;i++)addMesh(boat,woodUvs(rounded(.176,.075,3.65-Math.abs(i)*.32)),wood,i*.184,.065,.05);
  for(const t of [.13,.25,.38,.62,.75,.87]){
    const points=Array.from({length:17},(_,i)=>hullPoint(t,-Math.PI/2+i*Math.PI/16,.035).toArray());
    tube(boat,points,.027,iron,20);
  }
  // Leave the ferryman's standing position (z=-1.15) clear of the bow seat.
  for(const [z,width] of [[-1.58,1.08],[1.14,1.42]]){
    addMesh(boat,woodUvs(rounded(width,.085,.29,.025)),darkWood,0,.29,z);
    for(const x of [-width*.42,width*.42])addMesh(boat,rounded(.06,.25,.25),iron,x,.16,z);
  }
  tube(boat,[[0,-.38,-1.97],[0,.08,-2.23],[0,.62,-2.28],[0,.94,-2.43]],.055,darkWood,24);
  tube(boat,[[0,-.38,1.97],[0,.1,2.23],[0,.64,2.28]],.047,darkWood,20);
  const rivets=new THREE.InstancedMesh(new THREE.SphereGeometry(.022,7,5),bronze,54);
  rivets.name="Remaches de la borda";
  const dummy=new THREE.Object3D();let rivet=0;
  for(const side of [-1,1])for(let i=0;i<27;i++){
    const p=hullPoint(.03+i*.94/26,side*Math.PI/2);
    dummy.position.copy(p);dummy.position.y+=.043;dummy.scale.set(1,.5,1);dummy.updateMatrix();
    rivets.setMatrixAt(rivet++,dummy.matrix);
  }
  boat.add(rivets);
  const coil=Array.from({length:121},(_,i)=>{
    const t=i/120,a=t*Math.PI*8,r=.07+t*.16;
    return [-.35+Math.cos(a)*r,.145+Math.sin(a*2)*.006,1.51+Math.sin(a)*r];
  });
  tube(boat,coil,.014,rope,120);
  tube(boat,[[-.13,.145,1.54],[.15,.14,1.68],[.25,.24,1.9],[.22,.44,2.13]],.014,rope,28);
  const oar=new THREE.Group();oar.name="Remo de madera / pala tallada";
  boat.add(oar);oar.position.set(.53,.43,-.04);oar.rotation.set(.05,.13,-.08);
  tube(oar,[[0,0,-1.5],[0,.02,1.15]],.024,wood,8);
  addMesh(oar,woodUvs(rounded(.21,.042,.69,.018)),darkWood,0,0,-1.63).rotation.y=.09;
  for(let i=0;i<4;i++){
    const wrap=addMesh(oar,new THREE.TorusGeometry(.027,.009,5,10),rope,0,.012,.71+i*.033);
    wrap.rotation.x=Math.PI/2;
  }
  tube(boat,[[.62,.25,1.48],[.62,1.13,1.48],[.56,1.28,1.48],[.39,1.29,1.48],[.34,1.15,1.48]],.02,iron,28);
  const lantern=new THREE.Group();lantern.name="Farol colgante / vidrio ambar";
  lantern.position.set(.35,1.12,1.48);boat.add(lantern);
  const ring=addMesh(lantern,new THREE.TorusGeometry(.043,.009,6,14),iron,0,-.04);ring.rotation.y=Math.PI/2;
  addMesh(lantern,new THREE.ConeGeometry(.16,.13,4),iron,0,-.15).rotation.y=Math.PI/4;
  addMesh(lantern,new THREE.CylinderGeometry(.12,.14,.045,4),iron,0,-.49).rotation.y=Math.PI/4;
  for(const x of [-.083,.083])for(const z of [-.083,.083])addMesh(lantern,new THREE.CylinderGeometry(.009,.009,.29,5),bronze,x,-.33,z);
  const glass=new THREE.MeshStandardMaterial({name:"Cristal ahumado del farol",color:0xfac780,roughness:.34,metalness:.12,transparent:true,opacity:.13,depthWrite:false});
  addMesh(lantern,new THREE.BoxGeometry(.16,.27,.16),glass,0,-.33);
  const lampFire=createFire(lantern,9.1,.2);lampFire.root.position.set(0,-.46,0);
  batchStatic(lantern,[iron,bronze]);
  const lanternParts=[];
  lantern.traverse(object=>{
    if(object.isMesh && [iron,bronze].includes(object.material)){
      lanternParts.push(object);object.material=object.material.clone();
    }
  });
  batchStatic(boat,[wood,darkWood,iron,bronze,rope]);
  const glowMaterial=new THREE.ShaderMaterial({
    name:"Reflejo de las brasas / calor en el casco",transparent:true,depthWrite:false,
    blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    uniforms:{uTime:{value:0},uTravel:{value:0}},vertexShader:effectVertex,
    fragmentShader:`
      uniform float uTime,uTravel; varying vec2 vUv;
    `+noiseGLSL+`
      void main(){
        vec2 p=(vUv-.5)*2.;float d=length(vec2(p.x,p.y*.83));
        float edge=exp(-abs(d-.7)*14.);
        float flow=fbm(vec2(vUv.x*7.,vUv.y*10.-uTime*.6));
        float alpha=edge*flow*(.09+uTravel*.16)*(1.-smoothstep(.9,1.,d));
        gl_FragColor=vec4(1.,.21,.028,alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const wake=addMesh(boat,new THREE.PlaneGeometry(2.45,5.25),glowMaterial,0,-.45,0,"Calor en el casco");
  wake.rotation.x=-Math.PI/2;
  // Fixed light budget: only the two nearest flames cast practical light.
  const lights=Array.from({length:2},()=>{
    const light=new THREE.PointLight(0xff8737,0,4.2,2);root.add(light);return light;
  });
  const candidates=flamePositions.map(([x,z],i)=>({x,y:1.08,z,seed:i,lit:false}));
  const lampCandidate={x:0,y:1,z:0,seed:9,lit:false};
  const lampWorld=new THREE.Vector3();
  async function loadAssets(isAlive=()=>true){
    await Promise.all([
      [WOOD_URL,[wood,darkWood],.018],
      [IRON_URL,[iron],.012],
      [BASALT_URL,[stone],.055],
    ].map(async([url,materials,bumpScale])=>{
      const texture=await new THREE.TextureLoader().loadAsync(url);
      if(disposed || !isAlive()){texture.dispose();return;}
      textures.add(texture);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
      texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
      for(const material of materials){
        material.map=material.bumpMap=texture;material.bumpScale=bumpScale;material.needsUpdate=true;
      }
      if(materials.includes(iron))for(const part of lanternParts)if(part.material.name===iron.name){
        part.material.map=part.material.bumpMap=texture;part.material.needsUpdate=true;
      }
    }));
    return !disposed && isAlive();
  }
  function update(dt,progress,player,paused,reducedMotion){
    if(!paused)time+=Math.max(0,Math.min(dt,.25))*(reducedMotion ? .22 : 1);
    flames.forEach(({fire},i)=>{
      const lit=progress.flames.includes(i);fire.update(time,lit,reducedMotion);candidates[i].lit=lit;
    });
    lampFire.update(time,false,reducedMotion);
    lantern.rotation.z=reducedMotion?0:Math.sin(time*1.3)*.035;
    glowMaterial.uniforms.uTime.value=time;
    glowMaterial.uniforms.uTravel.value=progress.ferryStarted&&!progress.ferryCompleted?1:0;
    boat.updateMatrixWorld(true);lampFire.root.getWorldPosition(lampWorld);
    lampCandidate.x=lampWorld.x;lampCandidate.y=lampWorld.y+.15;lampCandidate.z=lampWorld.z;
    const nearest=[...candidates,lampCandidate].sort((a,b)=>
      (a.x-player.x)**2+(a.z-player.z)**2-((b.x-player.x)**2+(b.z-player.z)**2));
    lights.forEach((light,i)=>{
      const source=nearest[i],distance=Math.hypot(source.x-player.x,source.z-player.z);
      light.position.set(source.x,source.y,source.z);
      light.color.setHex(source.lit?0x6bffe0:0xff9b50);
      light.intensity=(source===lampCandidate?1.7:4.3)*Math.max(0,1-distance/14)*(.92+.08*Math.sin(time*7.2+source.seed));
    });
  }
  return {root,boat,flames,loadAssets,update,get time(){return time;},
    dispose(){disposed=true;textures.forEach(texture=>texture.dispose());textures.clear();}};
}
