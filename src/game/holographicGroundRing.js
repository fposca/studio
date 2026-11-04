import * as THREE from 'three';

// A single transparent surface per marker keeps the detailed rings inexpensive.
// The center stays empty, and depth testing lets feet and scenery occlude the light.
export function createHolographicGroundRing({radius=.5,color=0x65f1da,secondary=0xb5f7ff,opacity=.8,variant='actor',seed=0}={}) {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const uniforms={
    time:{value:seed},color:{value:new THREE.Color(color)},secondary:{value:new THREE.Color(secondary)},
    opacity:{value:opacity},alert:{value:0},variant:{value:variant==='altar'?2:variant==='checkpoint'?1:0},
  };
  const material=new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`
      varying vec2 vUv;
      varying float vDistance;
      void main(){vUv=uv;vec4 view=modelViewMatrix*vec4(position,1.0);vDistance=length(view.xyz);gl_Position=projectionMatrix*view;}
    `,
    fragmentShader:`
      uniform float time,opacity,alert,variant;
      uniform vec3 color,secondary;
      varying vec2 vUv;
      varying float vDistance;
      const float TAU=6.28318530718;
      float band(float r,float at,float width,float aa){return 1.0-smoothstep(width-aa,width+aa,abs(r-at));}
      float segments(float angle,float count,float fill){
        float cell=abs(fract(angle/TAU*count)-.5);
        return 1.0-smoothstep(fill*.5-.025,fill*.5+.025,cell);
      }
      void main(){
        vec2 p=(vUv-.5)*2.4;
        float r=length(p),a=atan(p.y,p.x),aa=max(fwidth(r),.002);
        if(r>1.19)discard;
        float spin=time*.24;
        float outer=band(r,.985,.009,aa)*segments(a+spin,8.0,.82);
        float track=band(r,.885,.023,aa)*segments(a-spin*.7,12.0,.70);
        float inner=band(r,.755,.008,aa)*segments(a+spin*.45,3.0,.76);
        float ticks=band(r,1.07,.028,aa)*segments(a,64.0,.12);
        float major=band(r,1.06,.066,aa)*segments(a,8.0,.10);
        float brackets=band(r,.62,.045,aa)*segments(a+TAU/16.0,4.0,.095);
        float sweep=pow(.5+.5*cos(a-spin*3.0),20.0);
        float tracer=band(r,.925,.006,aa)*( .22+sweep*.78 );
        float light=max(max(outer,track),max(inner,tracer));
        light=max(light,ticks*.52+major*.65);
        light=max(light,brackets*.7);
        float detail=0.0;
        if(variant>.5){
          detail=band(r,.53,.007,aa)*segments(a-spin*.6,6.0,.66);
          float diamond=abs(p.x)+abs(p.y);
          detail=max(detail,band(diamond,.18,.009,aa)*.7);
          detail=max(detail,band(r,.29,.005,aa)*segments(a+spin,4.0,.45));
        }
        if(variant>1.5){
          detail=max(detail,band(r,.40,.023,aa)*segments(a+spin*.9,16.0,.33));
          detail=max(detail,band(r,.68,.004,aa));
        }
        light=max(light,detail);
        float glow=exp(-abs(r-.885)*42.0)*.15+exp(-abs(r-.99)*54.0)*.08;
        float backing=band(r,.885,.055,aa)*.16;
        float alpha=clamp((light*.88+glow+backing)*opacity,0.0,.95);
        alpha*=1.0-smoothstep(26.0,55.0,vDistance);
        if(alpha<.008)discard;
        vec3 tint=mix(color,secondary,clamp(inner*.4+major*.4+sweep*.6+detail*.4,0.0,.85));
        tint=mix(vec3(.015,.035,.05),tint,clamp(light+glow*3.0,0.0,1.0));
        tint+=secondary*sweep*light*(.12+alert*.2);
        gl_FragColor=vec4(tint,alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(radius*2.4,radius*2.4),material);
  mesh.name='Holographic ring / '+variant;
  mesh.rotation.x=-Math.PI/2;mesh.position.y=.035;mesh.renderOrder=2;
  mesh.raycast=()=>{};
  return {
    mesh,
    update(dt,{color,secondary,opacity,alert=0,reducedMotion:reduce=reducedMotion}={}){
      if(!reduce)uniforms.time.value+=Math.max(0,Math.min(.05,dt));
      if(color!==undefined)uniforms.color.value.set(color);
      if(secondary!==undefined)uniforms.secondary.value.set(secondary);
      if(opacity!==undefined)uniforms.opacity.value=opacity;
      uniforms.alert.value=alert;
    },
  };
}
