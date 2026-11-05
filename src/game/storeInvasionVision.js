import * as THREE from 'three';

const VARYINGS = 'varying vec3 vInvasionWorld;\nvarying vec3 vInvasionLocal;\n';
const FRAGMENT = `
uniform sampler2D invasionAtlas;
uniform float invasionAmount;
uniform float invasionTime;
float invasionHash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
`;
const CODE = `
if(invasionAmount > .001) {
  vec3 normalCode = normalize(cross(dFdx(vInvasionWorld),dFdy(vInvasionWorld)));
  vec3 positionCode = vInvasionWorld;
  vec3 axes = abs(normalCode);
  #ifdef INVASION_PLAYER
    positionCode = vInvasionLocal;
    axes = abs(normalize(cross(dFdx(vInvasionLocal),dFdy(vInvasionLocal))));
  #endif
  bool horizontal = axes.y > .65;
  vec2 surface = horizontal ? positionCode.xz : (axes.x > axes.z ? positionCode.zy : positionCode.xy);
  vec2 grid = surface * (horizontal ? vec2(3.8) : vec2(5.0,6.0));
  #ifdef INVASION_PLAYER
    grid = surface * vec2(16.0,20.0);
  #endif
  vec2 cell = floor(grid);
  float seed = invasionHash(vec2(cell.x, floor(dot(positionCode,axes)*.5)));
  float trail = mod(cell.y + invasionTime*(2.0+seed*3.0) + seed*24.0,24.0);
  float head = 1.0-smoothstep(.0,1.3,trail);
  float glyphId = floor(invasionHash(cell+floor(invasionTime*.45))*32.0);
  vec2 uv = clamp(fract(grid),vec2(.03),vec2(.97));
  float glyph = texture2D(invasionAtlas,vec2((glyphId+uv.x)/32.0,uv.y)).a;
  // Fade subpixel symbols instead of producing noisy distant surfaces.
  float detail = 1.0-smoothstep(.45,1.3,max(fwidth(grid.x),fwidth(grid.y)));
  float rim = pow(1.0-abs(dot(normalCode,normalize(cameraPosition-vInvasionWorld))),2.6);
  float relief = clamp(dot(outgoingLight,vec3(.2126,.7152,.0722)),0.0,1.0);
  vec3 base = outgoingLight*.24 + vec3(.015,.055,.032)*(relief+.3);
  vec3 ink = mix(vec3(.09,.58,.31),vec3(.52,.94,.73),head);
  vec3 decoded = base + ink*glyph*(.10+exp(-trail*.19)*.57)*detail;
  decoded += vec3(.01,.06,.033)*rim;
  #ifdef INVASION_PLAYER
    base = outgoingLight*.52 + vec3(.23,.075,.012)*relief;
    base += vec3(.15,.05,.005)*rim;
    ink = mix(vec3(.92,.30,.055),vec3(1.0,.74,.35),head);
    decoded = base + ink*glyph*(.26+exp(-trail*.16)*.7)*detail;
  #endif
  outgoingLight = mix(outgoingLight,decoded,invasionAmount);
}
`;

export function createStoreInvasionVision(scene, scenery) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=32;
  const c=canvas.getContext('2d');
  c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.font='bold 25px monospace';
  Array.from('0123456789ABCDEF<>/+=[]{}:;?!%#*@~').slice(0,32)
    .forEach((glyph,i)=>c.fillText(glyph,i*32+16,17,24));
  const atlas=new THREE.CanvasTexture(canvas);atlas.anisotropy=4;
  const uniforms={
    invasionAtlas:{value:atlas},invasionAmount:{value:0},invasionTime:{value:0},
    invasionPose:{value:new THREE.Vector4()},
  };
  const originals=new Map(),variants=new Map();
  const background=scene.background?.clone(),fog=scene.fog?.color.clone();
  const greenBackground=new THREE.Color(0x07120e),greenFog=new THREE.Color(0x0d241b);
  let initialized=false;
  function register(root,profile='world'){
    root.traverse(object=>{
      if(!object.isMesh||object.userData.invasionVisionPreserve||originals.has(object))return;
      const original=object.material;
      const convert=material=>{
        // Basic UI, video, lettering, glass and effects keep their legibility and colors.
        if(!material?.isMeshStandardMaterial||material.transparent||material.blending!==THREE.NormalBlending)return material;
        let profiles=variants.get(material);
        if(!profiles){profiles=new Map();variants.set(material,profiles);}
        if(profiles.has(profile))return profiles.get(profile);
        const coded=material.clone(),compile=material.onBeforeCompile,key=material.customProgramCacheKey.call(material);
        coded.name='Invasion / '+profile+' / '+material.name;
        if(profile==='player')coded.defines={...coded.defines,INVASION_PLAYER:1};
        coded.onBeforeCompile=function(shader,renderer){
          compile.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);
          shader.vertexShader=VARYINGS+'uniform vec4 invasionPose;\n'+shader.vertexShader;
          shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
            #include <project_vertex>
            vec4 invasionWorld=vec4(transformed,1.0);
            #ifdef USE_INSTANCING
              invasionWorld=instanceMatrix*invasionWorld;
            #endif
            vInvasionWorld=(modelMatrix*invasionWorld).xyz;
            vec3 relativeCode=vInvasionWorld-invasionPose.xyz;
            float cs=cos(invasionPose.w),sn=sin(invasionPose.w);
            vInvasionLocal=vec3(relativeCode.x*cs-relativeCode.z*sn,relativeCode.y,relativeCode.x*sn+relativeCode.z*cs);
          `);
          shader.fragmentShader=VARYINGS+FRAGMENT+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',CODE+'\n#include <opaque_fragment>');
        };
        coded.customProgramCacheKey=()=>key+'/invasion-code-v1/'+profile;
        profiles.set(profile,coded);return coded;
      };
      originals.set(object,original);
      object.material=Array.isArray(original)?original.map(convert):convert(original);
    });
  }
  register(scenery);
  return {register,update(dt,enabled,player,reducedMotion){
    const amount=!initialized||reducedMotion||dt===0?Number(enabled):THREE.MathUtils.damp(uniforms.invasionAmount.value,Number(enabled),7,dt);
    initialized=true;uniforms.invasionAmount.value=amount;
    if(!reducedMotion)uniforms.invasionTime.value+=dt;
    uniforms.invasionPose.value.set(player.x,player.y??0,player.z,player.yaw??0);
    if(background)scene.background.copy(background).lerp(greenBackground,amount);
    if(fog)scene.fog.color.copy(fog).lerp(greenFog,amount);
  },dispose(){
    for(const [object,original] of originals)object.material=original;
    for(const profiles of variants.values())for(const material of profiles.values())material.dispose();
    originals.clear();variants.clear();atlas.dispose();
    if(background)scene.background.copy(background);
    if(fog)scene.fog.color.copy(fog);
  }};
}
