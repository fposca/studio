import{C as Z,ad as oe,D as de,i as Q,b4 as re,cG as Y,d7 as Pe,d6 as qe,d9 as we,S as Ie,cH as ue,aA as Be,aw as Ve,$ as Se,c$ as He,m as ee,a$ as ne,c_ as se,f as J,j as be,af as te,dj as xe,cF as Re,aX as Xe,k as ge,cY as ze,cz as ae,dl as Ke,d2 as je,M as Ye,cp as _e,cs as Ze,ae as $e}from"./three-core-Cq6uGRVY.js";import{e as Ae}from"./matrixQuest-DX4xwLgA.js";import{R as Qe}from"./three-addons-SKiuUWjo.js";function mt({radius:o=.5,color:a=6681050,secondary:n=11925503,opacity:t=.8,variant:r="actor",seed:s=0}={}){const i=typeof window<"u"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches,l={time:{value:s},color:{value:new Z(a)},secondary:{value:new Z(n)},opacity:{value:t},alert:{value:0},variant:{value:r==="altar"?2:r==="checkpoint"?1:0}},f=new oe({uniforms:l,transparent:!0,depthWrite:!1,depthTest:!0,side:de,toneMapped:!1,vertexShader:`
      varying vec2 vUv;
      varying float vDistance;
      void main(){vUv=uv;vec4 view=modelViewMatrix*vec4(position,1.0);vDistance=length(view.xyz);gl_Position=projectionMatrix*view;}
    `,fragmentShader:`
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
    `}),d=new Q(new re(o*2.4,o*2.4),f);return d.name="Holographic ring / "+r,d.rotation.x=-Math.PI/2,d.position.y=.035,d.renderOrder=2,d.raycast=()=>{},{mesh:d,update(m,{color:v,secondary:u,opacity:y,alert:x=0,reducedMotion:e=i}={}){e||(l.time.value+=Math.max(0,Math.min(.05,m))),v!==void 0&&l.color.value.set(v),u!==void 0&&l.secondary.value.set(u),y!==void 0&&(l.opacity.value=y),l.alert.value=x}}}function Je(){const o=document.createElement("canvas");o.width=o.height=256;const a=o.getContext("2d");for(let t=0;t<20;t++){const r=t*2.39996,s=16+t%5*12,i=128+Math.cos(r)*s,l=128+Math.sin(r)*s*.6,f=a.createRadialGradient(i,l,0,i,l,58+t%4*9);f.addColorStop(0,"rgba(255,255,255,.13)"),f.addColorStop(.45,"rgba(255,255,255,.07)"),f.addColorStop(1,"rgba(255,255,255,0)"),a.fillStyle=f,a.fillRect(0,0,256,256)}const n=new we(o);return n.colorSpace=Ie,n}function vt(o,a,{name:n="low drifting smoke",floorHeight:t=()=>0}={}){const r=new Y;r.name=n,o.add(r);const s=Je(),i=a.map((d,m)=>{const v=new Pe({map:s,color:d.color??8551062,transparent:!0,opacity:d.opacity??.3,depthWrite:!1,fog:!1}),u=new qe(v);return u.name=n+" bank "+m,u.raycast=()=>{},r.add(u),{...d,phase:d.phase??m*2.39996,sprite:u}});let l=0;function f(d,m=!1,v=!1,u=null,y=null){v||(l+=d);const x=m?0:l;for(const e of i){const{sprite:c,x:T,z:E,phase:p}=e,q=Math.sin(x*.13+p)*(e.driftX??.65),G=Math.cos(x*.09+p)*(e.driftZ??.6);c.position.set(T+q,t(T,E)+(e.y??.58+Math.sin(p)*.16),E+G),c.scale.set((e.width??6.6)+Math.sin(x*.17+p)*(e.widthDrift??.45),e.height??1.8,1);const R=u?ue.smoothstep(u.position.distanceTo(c.position),1.3,4.3):1;c.material.opacity=(y?y(e):e.opacity??.3)*R}}return f(0),{root:r,update:f}}function pt(){const a=new Uint8Array(36864);for(let t=0;t<96;t+=1)for(let r=0;r<96;r+=1){const s=Math.hypot((r+.5)/96*2-1,(t+.5)/96*2-1),i=Math.max(0,Math.exp(-s*s*5.5)-Math.exp(-5.5)),l=(t*96+r)*4;a.set([255,255,255,Math.round(i*255)],l)}const n=new Be(a,96,96,Ve);return n.minFilter=Se,n.magFilter=Se,n.needsUpdate=!0,n}function Me(o,a,n,t=.4){const r=new qe(new Pe({map:o,color:a,transparent:!0,opacity:t,blending:ne,depthWrite:!1,toneMapped:!1}));return r.scale.setScalar(n),r}function et({radius:o=.18,texture:a,phase:n=0,active:t=!1}){const r=new Y,s=new oe({uniforms:{uTime:{value:n},uEnergy:{value:.8},uAccent:{value:new Z(t?5826815:14832346)},uDeep:{value:new Z(t?474202:2363713)}},vertexShader:`
      varying vec3 vNormal;
      varying vec3 vLocal;
      varying vec3 vView;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vLocal = normalize(position);
        vView = cameraPosition - world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,fragmentShader:`
      uniform float uTime;
      uniform float uEnergy;
      uniform vec3 uAccent;
      uniform vec3 uDeep;
      varying vec3 vNormal;
      varying vec3 vLocal;
      varying vec3 vView;
      float hash(vec3 p) {
        p = fract(p * .3183099 + vec3(.13, .47, .73));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      void main() {
        vec3 n = normalize(vNormal);
        vec3 p = vLocal * 4.5 + vec3(uTime * .21, -uTime * .32, uTime * .13);
        float flow = noise(p) + .45 * noise(p * 2.1 + uTime * .11);
        float veins = pow(1.0 - abs(sin(flow * 12.0 + vLocal.y * 5.0)), 8.0);
        float rim = pow(1.0 - max(0.0, dot(n, normalize(vView))), 2.5);
        float key = .35 + .65 * max(0.0, dot(n, normalize(vec3(-.4, .7, .8))));
        vec3 color = uDeep * (.65 + key) + uAccent * (flow * .16 + veins * .54) * uEnergy;
        color += mix(uAccent, vec3(.7, .94, 1.0), .7) * (rim * .66 + pow(veins, 3.0) * .28) * uEnergy;
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,toneMapped:!1}),i=new Q(new He(o,32,24),s),l=Me(a,t?6807039:13323482,o*7,.32),f=new ee({color:t?10155775:15835887,transparent:!0,opacity:.6,blending:ne,depthWrite:!1,toneMapped:!1}),d=new se(o*1.22,o*.026,6,48,Math.PI*1.25),m=[new Q(d,f),new Q(d,f)];m[0].rotation.set(.8,.3,n),m[1].rotation.set(-.6,1.1,n+2.4),r.add(i,l,...m);let v=t;function u(e){v!==e&&(v=e,s.uniforms.uAccent.value.set(e?5826815:14832346),s.uniforms.uDeep.value.set(e?474202:2363713),l.material.color.set(e?6807039:13323482),f.color.set(e?10155775:15835887))}function y(e,c=1){s.uniforms.uTime.value=e+n,s.uniforms.uEnergy.value=c,i.rotation.y=e*.24+n,i.rotation.z=Math.sin(e*.7+n)*.08,m[0].rotation.z=e*.9+n,m[1].rotation.y=-e*.65+n,l.material.opacity=.2+c*.16+Math.sin(e*3+n)*.025,l.scale.setScalar(o*(6.7+Math.sin(e*2+n)*.2))}function x({accent:e,deep:c,glow:T,arc:E}){s.uniforms.uAccent.value.set(e),s.uniforms.uDeep.value.set(c),l.material.color.set(T),f.color.set(E)}return{root:r,core:i,halo:l,setActive:u,setPalette:x,update:y}}function tt({width:o=.14,spacing:a=.065}={}){const t=Array.from({length:28},()=>new J),r=new Float32Array(168),s=new Float32Array(168),i=new Float32Array(112),l=[];for(let e=0;e<28;e+=1)if(i.set([0,e/27,1,e/27],e*4),e<27){const c=e*2;l.push(c,c+1,c+2,c+1,c+3,c+2)}const f=new be;f.setAttribute("position",new te(r,3).setUsage(xe)),f.setAttribute("tangent",new te(s,3).setUsage(xe)),f.setAttribute("uv",new te(i,2)),f.setIndex(l);const d=new oe({uniforms:{uReturning:{value:0},uOpacity:{value:1},uWidth:{value:o},uHead:{value:new Z().setRGB(.45,.92,1)},uTail:{value:new Z().setRGB(.56,.055,.72)},uCore:{value:new Z().setRGB(.8,.96,1)}},vertexShader:`
      attribute vec3 tangent;
      uniform float uWidth;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 side = cross(tangent, cameraPosition - position);
        if (dot(side, side) < .00001) side = cross(tangent, vec3(0., 1., .01));
        side = normalize(side);
        float width = uWidth * pow(1.0 - uv.y, .7) + .004;
        vec3 p = position + side * (uv.x * 2.0 - 1.0) * width;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }
    `,fragmentShader:`
      uniform float uReturning;
      uniform float uOpacity;
      uniform vec3 uHead;
      uniform vec3 uTail;
      uniform vec3 uCore;
      varying vec2 vUv;
      void main() {
        float across = abs(vUv.x * 2.0 - 1.0);
        float core = pow(1.0 - across, 5.0);
        float soft = pow(1.0 - across, 1.5);
        vec3 tail = mix(uTail, vec3(.07, .3, .65), uReturning);
        vec3 color = mix(uHead, tail, vUv.y);
        color = mix(color, uCore, core * .65);
        float alpha = (soft * .38 + core * .6) * pow(1.0 - vUv.y, 1.35);
        gl_FragColor = vec4(color, alpha * mix(1., .65, uReturning) * uOpacity);
        #include <colorspace_fragment>
      }
    `,transparent:!0,blending:ne,depthWrite:!1,side:de,toneMapped:!1}),m=new Q(f,d);m.name="Orbe Neon / estela",m.frustumCulled=!1,m.visible=!1;const v=new J;let u=0;function y(e){t.forEach(c=>c.copy(e)),u=0,m.visible=!1}function x(e,c,T){const E=e.distanceTo(c);if(E>0){for(let p=a-u;p<=E;p+=a){for(let q=27;q>0;q-=1)t[q].copy(t[q-1]);t[0].lerpVectors(e,c,p/E)}u=(u+E)%a}for(let p=0;p<28;p+=1){const q=p===0?c:t[p-1],G=p<=1?c:t[p-2];v.subVectors(G,t[p]).normalize(),v.lengthSq()<.001&&v.set(0,0,1),q.toArray(r,p*6),q.toArray(r,p*6+3),v.toArray(s,p*6),v.toArray(s,p*6+3)}f.attributes.position.needsUpdate=!0,f.attributes.tangent.needsUpdate=!0,d.uniforms.uReturning.value=T?1:0,m.visible=!0}return{mesh:m,reset:y,update:x}}function Te(o,a=!1,{glowColor:n=a?7728639:15766507,ringColor:t=a?9105407:16037614,sparkColor:r=15569636,highlightColor:s=11006975}={}){const i=new Y;i.visible=!1;const l=a?.48:.24,f=Me(o,n,1,0),d=new ee({color:t,transparent:!0,blending:ne,depthWrite:!1,toneMapped:!1}),m=new Q(new se(1,.016,6,64),d),v=a?22:12,u=new Float32Array(v*3),y=new Float32Array(v*3),x=new Float32Array(v*3),e=new Float32Array(v),c=new Z;for(let _=0;_<v;_+=1){const k=_*2.39996,L=.8+_%5*.28;y.set([Math.cos(k)*L,Math.sin(k)*L,.3+_%4*.27],_*3),c.set(_%3===0?r:s).toArray(x,_*3),e[_]=.04+_%4*.018}const T=new be;T.setAttribute("position",new te(u,3).setUsage(xe)),T.setAttribute("color",new te(x,3)),T.setAttribute("size",new te(e,1));const E=new oe({uniforms:{uFade:{value:1}},vertexShader:`
      attribute vec3 color;
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 p = modelViewMatrix * vec4(position, 1.);
        gl_PointSize = clamp(size * 680. / max(.1, -p.z), 1., 20.);
        gl_Position = projectionMatrix * p;
      }
    `,fragmentShader:`
      uniform float uFade;
      varying vec3 vColor;
      void main() {
        float r = length(gl_PointCoord - .5) * 2.;
        float alpha = max(0., exp(-r * r * 4.) - .018) * uFade;
        gl_FragColor = vec4(vColor, alpha);
        #include <colorspace_fragment>
      }
    `,transparent:!0,blending:ne,depthWrite:!1,toneMapped:!1}),p=new Re(T,E);p.frustumCulled=!1,i.add(f,m,p);const q=new J(0,0,1),G=new J;let R=l;function K(_,k){R=0,i.position.copy(_),a&&i.position.addScaledVector(k,-.04),G.copy(k).multiplyScalar(a?-1:1),i.quaternion.setFromUnitVectors(q,G),i.visible=!0,H(0)}function H(_){if(!i.visible)return;R+=_;const k=Math.min(1,R/l);i.visible=k<1,m.scale.setScalar(.08+(a?.72:.34)*(1-(1-k)**2)),d.opacity=(1-k)**2*.7,f.scale.setScalar((a?.85:.6)+k*.7),f.material.opacity=(1-k)**3*.65,E.uniforms.uFade.value=(1-k)**1.4;for(let L=0;L<v;L+=1)u[L*3]=y[L*3]*R,u[L*3+1]=y[L*3+1]*R-R*R*.45,u[L*3+2]=y[L*3+2]*R;T.attributes.position.needsUpdate=!0}return{root:i,trigger:K,update:H}}const ot=new Set(["island floor"]);function ht(o,a,n,t,r=!1){return o<=-13||o>=13||a<=Ae.playerBackZ+1||a>=Ae.playerFrontZ-1?!1:!n.some(s=>s===t||s.x===999||ot.has(s.id)||r&&s.id?.startsWith("memory block ")?!1:s.radius?Math.hypot(o-s.x,a-s.z)<s.radius+.52:Math.abs(o-s.x)<s.hx+.52&&Math.abs(a-s.z)<s.hz+.52)}function Ce(o,a,n,t){const r=a.x-o.x,s=a.y-o.y,i=a.z-o.z,l=o.x-n.x,f=o.y-n.y,d=o.z-n.z,m=r*r+s*s+i*i;if(m<1e-9)return l*l+f*f+d*d<=t*t?0:null;const v=2*(l*r+f*s+d*i),u=l*l+f*f+d*d-t*t;if(u<=0)return 0;const y=v*v-4*m*u;if(y<0)return null;const x=(-v-Math.sqrt(y))/(2*m);return x>=0&&x<=1?x:null}function at(o,a,n,t,r){const s=n.y-r,i=n.y+r,l=Ce(o,a,{x:n.x,y:s,z:n.z},t),f=Ce(o,a,{x:n.x,y:i,z:n.z},t);let d=Math.min(l??1/0,f??1/0);const m=a.x-o.x,v=a.z-o.z,u=o.x-n.x,y=o.z-n.z,x=m*m+v*v,e=u*u+y*y-t*t;if(e<=0&&o.y>=s&&o.y<=i)return 0;if(x>1e-9){const c=2*(u*m+y*v),T=c*c-4*x*e;if(T>=0){const E=Math.sqrt(T);for(const p of[(-c-E)/(2*x),(-c+E)/(2*x)]){const q=o.y+(a.y-o.y)*p;p>=0&&p<=1&&q>=s&&q<=i&&(d=Math.min(d,p))}}}return Number.isFinite(d)?d:null}function gt(o,a,n,t,r,s=[]){const i=new J().subVectors(a,o),l=i.length();if(l<1e-9)return null;i.divideScalar(l),r.set(o,i),r.far=l;const f=r.intersectObjects(t,!1)[0];let d=f?.distance??1/0,m=f?.point??null;const v=new J;for(const e of s){const c=e.containsPoint(o)?o:r.ray.intersectBox(e,v);if(!c)continue;const T=o.distanceTo(c);T<=l&&T<d&&(d=T,m=c.clone())}const u={x:n.x,y:n.y+1.18,z:n.z},y=at(o,a,u,.55,.2),x=y===null?1/0:y*l;return m&&d<=x?{kind:"cover",point:m}:y!==null?{kind:"player",point:o.clone().lerp(a,y)}:null}function nt(o=0){const a=new Y;a.name="Enemy orb / infernal flame";const n=new re(.85,1.5);n.translate(0,.75,0),n.rotateX(-Math.PI/2);const t=new oe({uniforms:{uTime:{value:o},uFade:{value:1}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,fragmentShader:`
      uniform float uTime;
      uniform float uFade;
      varying vec2 vUv;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
          mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
      }
      void main() {
        float t = vUv.y;
        vec2 flow = vec2(vUv.x * 6., t * 6. - uTime * 4.);
        float turbulence = noise(flow) * .67 + noise(flow * 2.3) * .33;
        float bend = sin(t * 12. - uTime * 6.) * t * .055;
        float width = .32 * (1. - t) + sin(t * 3.14159) * .14;
        float edge = abs(vUv.x - .5 + bend) + turbulence * t * .24;
        float flame = 1. - smoothstep(width * .3, width + .035, edge);
        flame *= smoothstep(0., .06, t) * (1. - smoothstep(.65, 1., t));
        float heat = clamp(flame * .9 + (1. - t) * .35, 0., 1.);
        vec3 color = mix(vec3(.65, .014, .002), vec3(1., .23, .014), heat);
        color = mix(color, vec3(1., .86, .48), pow(heat, 4.));
        gl_FragColor = vec4(color, flame * uFade * .78);
        #include <colorspace_fragment>
      }
    `,transparent:!0,blending:Xe,side:de,depthWrite:!1,toneMapped:!1}),r=new Q(n,t),s=new Q(n,t);s.rotation.z=Math.PI/2,a.add(r,s);function i(l,f){t.uniforms.uTime.value=l+o,t.uniforms.uFade.value=f}return{root:a,update:i}}const Fe={plasma:{accent:16733835,deep:3280210,glow:14366847,arc:16761262,tail:10236362},corrupted:{accent:16724317,deep:2557986,glow:15018340,arc:16755331,tail:8266933}},it={glowColor:16733315,ringColor:16758172,sparkColor:16014242,highlightColor:16769208},ce=.28;function yt(o,a=0,{palette:n,size:t=1,flame:r=!1}={}){const s=new Y;s.name="Enemy orb / effects";const i=new Y;i.name="Enemy orb / plasma";const l=et({radius:.16,texture:o,phase:a}),f=Me(o,16769731,.28,.7);f.position.z=.13,i.add(l.root,f);const d=r?nt(a):null;d&&i.add(d.root);const m=r?.16:.105,v=tt({width:m,spacing:.055});v.mesh.name="Enemy orb / energy wake";const u=v.mesh.material.uniforms;u.uCore.value.set(16768964);const y=n?{glowColor:n.glow,ringColor:n.arc,sparkColor:n.accent,highlightColor:n.arc}:it,x=Te(o,!1,y),e=Te(o,!0,y);x.root.name="Enemy orb / discharge",e.root.name="Enemy orb / impact";const c=24,T=new Float32Array(c*3);for(let h=0;h<c;h+=1)T.set([h/c,h*2.39996,.5+h%5*.12],h*3);const E=new be;E.setAttribute("position",new te(new Float32Array(c*3),3)),E.setAttribute("seed",new te(T,3));const p=new oe({uniforms:{uTime:{value:0},uFade:{value:1},uColor:{value:new Z(16751744)}},vertexShader:`
      attribute vec3 seed;
      uniform float uTime;
      varying float vFade;
      void main() {
        float age = fract(seed.x + uTime * 1.4);
        float angle = seed.y + age * 2.5;
        float radius = .07 + age * .18;
        vec3 p = vec3(cos(angle) * radius, sin(angle) * radius, -.08 - age * .95);
        vec4 view = modelViewMatrix * vec4(p, 1.);
        vFade = pow(1. - age, 1.5) * smoothstep(0., .12, age);
        gl_PointSize = clamp((.022 + seed.z * .022) * 680. / max(.1, -view.z), 1., 12.);
        gl_Position = projectionMatrix * view;
      }
    `,fragmentShader:`
      uniform float uFade;
      uniform vec3 uColor;
      varying float vFade;
      void main() {
        float r = length(gl_PointCoord - .5) * 2.;
        float glow = max(0., exp(-r * r * 5.) - .007);
        vec3 color = mix(uColor, vec3(1., .87, .73), pow(glow, 3.));
        gl_FragColor = vec4(color, glow * vFade * uFade);
        #include <colorspace_fragment>
      }
    `,transparent:!0,blending:ne,depthWrite:!1,toneMapped:!1}),q=new Re(E,p);q.frustumCulled=!1,i.add(q),s.add(i,v.mesh,x.root,e.root);const G=new J,R=new J(0,0,1),K=new J(0,0,1);let H=!1,_=ce,k=1,L=!1;function ie(){H=!1,L=!1,_=ce,s.visible=i.visible=v.mesh.visible=x.root.visible=e.root.visible=!1}function w(h,g,A=!1){ie();const S=n||(A?Fe.corrupted:Fe.plasma);k=t*(A?1.65:1),R.copy(g).normalize(),R.lengthSq()<.001&&R.copy(K),i.position.copy(h),i.quaternion.setFromUnitVectors(K,R),i.scale.setScalar(k),G.copy(h),l.setPalette(S),f.material.color.set(r?16766610:16769731),u.uHead.value.set(S.arc),u.uTail.value.set(S.tail),u.uWidth.value=m*k,u.uOpacity.value=.85,p.uniforms.uColor.value.set(S.arc),v.reset(h),x.trigger(h,R),s.visible=i.visible=H=!0,_=0,U(0,0)}function P(h=!1){H&&(H=!1,_=0,L=!h,h&&(i.visible=!1,e.trigger(i.position,R)))}function U(h,g,A=!1){if(!s.visible)return;x.update(h),e.update(h),H?(v.update(G,i.position,!1),G.copy(i.position)):_=Math.min(ce,_+h);const S=H?1:1-_/ce,C=A?a:g;l.update(C,(A?1:1.15)*S),l.halo.material.opacity*=S,f.material.opacity=.72*S,d?.update(C,S*(A?.65:1)),p.uniforms.uTime.value=C+a,p.uniforms.uFade.value=S*(A?.25:.85),u.uOpacity.value=S*(A?.4:.85),L&&(i.scale.setScalar(k*S),i.visible=S>0),!H&&S===0&&(i.visible=v.mesh.visible=!1,s.visible=x.root.visible||e.root.visible)}return ie(),{root:s,body:i,start:w,finish:P,update:U,clear:ie}}const Ee=`varying vec2 vUv; void main(){
 vUv=uv;vec4 localPosition=vec4(position,1.);
 #ifdef USE_INSTANCING
 localPosition=instanceMatrix*localPosition;
 #endif
 gl_Position=projectionMatrix*modelViewMatrix*localPosition;
}`;function fe(o){const a=new Map,n=(t,r,s,i,l,f=1,d=1,m=1,v=0,u=0,y=0)=>{a.has(t)||a.set(t,new Map);const x=a.get(t);x.has(r)||x.set(r,[]),x.get(r).push([s,i,l,f,d,m,v,u,y])};return n.flush=()=>{const t=new Ze;for(const[r,s]of a)for(const[i,l]of s){const f=new _e(r,i,l.length);f.name="Matrix / power assembly",f.receiveShadow=!0,l.forEach(([d,m,v,u,y,x,e,c,T],E)=>{t.position.set(d,m,v),t.scale.set(u,y,x),t.rotation.set(e,c,T),t.updateMatrix(),f.setMatrixAt(E,t.matrix)}),f.computeBoundingSphere(),o.add(f)}a.clear()},n}function j(o,a,n,t=0,r=0,s=0){const i=new Q(a,n);return i.position.set(t,r,s),o.add(i),i}function ye(o,a=512,n=128){const t=document.createElement("canvas");t.width=a,t.height=n,o(t.getContext("2d"),a,n);const r=new we(t);return r.colorSpace=Ie,r.anisotropy=4,new ee({map:r,toneMapped:!1})}function Ue(o,a){const t=new Ke;return t.moveTo(-o/2+.22,-a/2),t.lineTo(o/2-.22,-a/2),t.lineTo(o/2,-a/2+.22),t.lineTo(o/2,a/2-.22),t.lineTo(o/2-.22,a/2),t.lineTo(-o/2+.22,a/2),t.lineTo(-o/2,a/2-.22),t.lineTo(-o/2,-a/2+.22),t.closePath(),new je(t,{depth:.055,steps:1,bevelEnabled:!0,bevelSegments:1,bevelSize:.025,bevelThickness:.025})}function xt(o){const a=new re(1,1),n=new ge(1,1,1),t=new se(1,.045,8,48),r=new Qe(1,1,1,1,.06),s=new ze(1,1,1,32,1,!0),i=new ze(.032,.032,.025,6),l=Ue(5.72,3.22),f=Ue(4.05,2.15),d=new ae({color:6389132,metalness:.72,roughness:.32}),m=new ae({color:2176839,metalness:.72,roughness:.38}),v=new ae({color:8492190,metalness:.65,roughness:.36}),u=new ae({color:463389,metalness:.45,roughness:.5}),y=new ae({color:12160611,metalness:.78,roughness:.3}),x=new ee({color:3764609,toneMapped:!1}),e=new ee({color:11663356,toneMapped:!1}),c={value:0},T=new oe({uniforms:{time:c},vertexShader:Ee,side:de,toneMapped:!1,fragmentShader:`varying vec2 vUv; uniform float time;
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
   }`}),E=new oe({uniforms:{time:c},vertexShader:Ee,toneMapped:!1,fragmentShader:`varying vec2 vUv;uniform float time;
   void main(){float head=pow(.5+.5*sin(vUv.y*18.-time*2.8),24.);
    vec3 color=vec3(.025,.16,.22)+vec3(.35,.7,.8)*head;
    gl_FragColor=vec4(color,1.);
    #include <colorspace_fragment>
   }`}),p=ye(w=>{w.fillStyle="#091720",w.fillRect(0,0,512,128),w.fillStyle="#afc1c6",w.font="bold 29px monospace",w.fillText("NEX / FLUX CELL",25,46),w.fillStyle="#65e5ee",w.font="18px monospace",w.fillText("09.03  |  PLASMA CONTAINMENT",25,83),w.fillStyle="#b99463";for(let P=0;P<22;P++)w.fillRect(25+P*21,105,12,4)}),q=ye(w=>{w.fillStyle="#172a36",w.fillRect(0,0,512,128),w.fillStyle="#afc2cb",w.font="bold 34px monospace",w.fillText("NEX // AIRLOCK",20,49),w.fillStyle="#6d95a5",w.font="18px monospace",w.fillText("PRESSURE SEAL  /  TYPE 03",20,85);for(let P=0;P<40;P++)w.fillStyle=P%3?"#4a6b7c":"#a7bec5",w.fillRect(20+P*8,105,P%3?3:5,10)}),G=["ACCESO BLOQUEADO","ABRIENDO COMPUERTA","ENLACE HABILITADO"].map((w,P)=>ye(U=>{U.fillStyle="#08141e",U.fillRect(0,0,512,128),U.fillStyle=P===2?"#93f2e4":P===1?"#edc88c":"#dc8bb9",U.fillRect(16,20,5,87),U.font="bold 29px monospace",U.fillText(w,39,62),U.font="16px monospace",U.fillText(P===2?"TRANSFERENCIA SEGURA":"F09 / CONTROL DE ENLACE",39,94)})),R=[],K=[];function H(w,P=K.length){const{width:U,height:h,depth:g}=w.geometry.parameters;w.material=new ee({colorWrite:!1,depthWrite:!1}),w.castShadow=!1;const A=new Y;A.name="Reactor de flujo / "+P,w.add(A),K.push(A);const S=fe(A),C=(F,M,b,I,$,B,W,z=0,X=0)=>S(n,F,M,b,I,$,B,W,0,z,X),N=h-1.05,O=Math.min(U,g)*.21;j(A,s,T).scale.set(O*.98,N,O*.98);for(let F=-N/2+.12;F<N/2;F+=.57){S(t,d,0,F,0,O*1.6,O*1.6,O*1.6,Math.PI/2),S(t,x,0,F+.075,0,O*1.38,O*1.38,O*1.38,Math.PI/2);for(const M of[-1,1])for(const b of[-1,1])C(y,M*O*.86,F,b*O*.86,.09,.2,.09)}for(const F of[-1,1])for(const M of[-1,1])C(m,F*(U/2-.12),0,M*(g/2-.12),.2,h-.2,.2),C(v,F*(U/2-.045),0,M*(g/2-.14),.07,h-.35,.13),C(y,F*O*.94,0,M*O*.94,.065,N,.065);for(const F of[-1,1])S(r,m,0,F*(h/2-.18),0,U,.36,g),S(r,d,0,F*(h/2-.35),0,U-.06,.08,g-.06),C(u,0,F*(h/2-.49),0,U*.74,.18,g*.74),S(t,e,0,F*(h/2-.51),0,O*1.25,O*1.25,O*1.25,Math.PI/2);for(let F=0;F<4;F++){const M=new Y;M.rotation.y=F*Math.PI/2,A.add(M);const b=F%2?g:U,I=(F%2?U:g)/2,$=fe(M),B=(z,X,D,me,le,ve,pe)=>$(n,z,X,D,me,le,ve,pe);for(const z of[-1,1]){B(u,z*(b*.5-.28),0,I-.15,.23,h-.85,.18),B(d,z*(b*.5-.4),0,I-.065,.045,h-.9,.1);const X=j(M,a,E,z*(b*.5-.25),0,I-.035);X.scale.set(.055,h-.95,1),X.name="Conducto de transferencia animado";for(let D=-h/2+.85;D<h/2-.65;D+=.38)B(m,z*(b*.5-.28),D,I-.015,.1,.05,.09),B(y,z*(b*.5-.37),D,I-.01,.055,.13,.08)}for(const z of[-h*.27,h*.27])B(m,0,z,I-.06,b-.25,.16,.14),B(x,0,z+.035,I+.015,b*.5,.018,.016);const W=j(M,a,p,0,h/2-.62,I+.012);W.scale.set(b-.45,(b-.45)/4,1),W.name="Flux cell / identification";for(let z=0;z<7;z++)B(z===3?e:x,(z-3)*.16,-h/2+.21,I+.015,.09,.04,.025);$.flush()}return S.flush(),A}function _(){o.updateWorldMatrix(!0,!0);const w=o.matrixWorld.clone().invert(),P=new Map,U=(g,A)=>{P.has(g.geometry)||P.set(g.geometry,new Map);const S=P.get(g.geometry);S.has(g.material)||S.set(g.material,[]),S.get(g.material).push(A)};for(const g of K)g.traverse(A=>{if(!A.isMesh)return;const S=w.clone().multiply(A.matrixWorld);if(A.isInstancedMesh)for(let C=0;C<A.count;C++){const N=new Ye;A.getMatrixAt(C,N),U(A,S.clone().multiply(N))}else U(A,S)});for(const g of K)g.clear();const h=new Y;h.name="Matrix / instanced reactor network",o.add(h);for(const[g,A]of P)for(const[S,C]of A){const N=new _e(g,S,C.length);C.forEach((O,F)=>N.setMatrixAt(F,O)),N.receiveShadow=!0,N.computeBoundingSphere(),h.add(N)}}function k(w,P,U){const h=new Y;h.name="Compuerta espacial / "+w.id,h.position.z=w.z,o.add(h);const g=new ee({color:13398694,toneMapped:!1}),A=new ae({color:5467770,emissive:13398694,emissiveIntensity:1.1,metalness:.45,roughness:.3}),S=fe(h),C=(M,b,I,$,B,W,z,X=0,D=0)=>S(n,M,b,I,$,B,W,z,0,X,D);for(const M of[-1,1]){C(m,M*6.1,1.9,0,.36,3.8,1.1),C(v,M*5.99,1.85,.53,.08,3.65,.08);for(const b of[-1,1]){C(u,M*6.1,1.92,b*.59,.19,2.9,.12);for(let I=0;I<7;I++)C(g,M*6.1,.55+I*.43,b*.66,.06,.23,.018);C(y,M*6.1,.26,b*.59,.23,.18,.12)}for(let b=.7;b<3.7;b+=1.1)C(m,M*6.22,b,0,.35,.18,1.16)}C(m,0,3.95,0,12.55,.58,1.15),C(v,0,4.24,0,12.7,.06,1.18),C(u,0,.035,0,12,.07,1.1);for(const M of[-1,1]){C(d,0,.075,M*.5,12,.045,.08),C(g,0,.09,M*.47,11.6,.015,.025);for(const b of[-1,1]){C(u,b*3.6,3.96,M*.6,4.5,.27,.07);for(let I=0;I<12;I++)C(I%3===0?g:d,b*(1.55+I*.35),3.96,M*.66,.14,.12,.035,0,b*.4)}}const N=[];for(const M of[-1,1]){const b=j(h,new re(2.65,.44),G[0],0,3.96,M*.64);b.rotation.y=M<0?Math.PI:0,N.push(b)}const O=[-1,1].map(M=>{const b=j(h,new ge(5.98,3.6,1.06),new ee({colorWrite:!1,depthWrite:!1}),M*3,1.8,0),I=j(b,new ge(5.98,3.6,.42),m);I.castShadow=!0,I.receiveShadow=!0,b.name="gate "+w.id+" / "+(M<0?"left":"right"),b.castShadow=!1,P.push(b);const $={id:b.name,x:M*3,z:w.z,hx:2.99,hz:.53};U.push($);for(const B of[-1,1]){const W=new Y;W.rotation.y=B<0?Math.PI:0,W.position.z=B*.225,b.add(W);const z=M*B,X=fe(W),D=(V,he,ke,Ne,De,Ge,Le,We=0)=>X(n,V,he,ke,Ne,De,Ge,Le,0,0,We);j(W,l,d,0,0,.005),j(W,f,m,-z*.42,0,.095);for(const V of[-.92,.92])D(u,-z*.4,V,.17,3.8,.035,.04),D(v,-z*.45,V+.07,.17,2.5,.035,.035),D(m,z*1.74,V*.75,.16,.16,.8,.11,z*.48);for(let V=0;V<7;V++)D(u,z*2.19,-.58+V*.18,.13,.42,.055,.04);D(y,z*2.19,-.95,.14,.42,.07,.045),D(u,-z*2.68,0,.13,.17,2.9,.09),D(A,-z*2.69,0,.19,.05,2.75,.035);for(const V of[-1.24,1.24])D(u,-z*2.25,V,.14,.5,.28,.09),D(v,-z*2.24,V,.2,.32,.1,.055),D(y,-z*2.24,V+.07,.21,.23,.025,.03);const me=new se(.52,.065,8,32,Math.PI),le=j(W,me,u,-z*3,0,.17);le.rotation.z=z<0?Math.PI/2:-Math.PI/2;const ve=j(W,new se(.43,.018,6,32,Math.PI),g,-z*3,0,.24);ve.rotation.z=le.rotation.z;const pe=j(W,new re(1.52,.38),q,z*.4,.18,.185);pe.name="Airlock / identification";for(const V of[-2.55,2.55])for(const he of[-1.4,1.4])X(i,y,V,he,.13,1,1,1,Math.PI/2);X.flush()}return{slab:b,obstacle:$,side:M}});S.flush();const F={...w,group:h,leaves:O,displays:N,stateMaterial:g,light:A,amount:null};return R.push(F),F}function L(w,P,U,h=!1){c.value=P;for(const g of R){const A=!!g.open(U),S=A?1:0;g.amount===null||h?g.amount=S:g.amount=ue.clamp(g.amount+(A?1:-1)*w/1.3,0,1);const C=g.amount*g.amount*(3-2*g.amount);for(const{slab:F,obstacle:M,side:b}of g.leaves)F.position.x=b*(3+C*6.15),M.x=F.position.x;const N=A?g.amount>=1?2:1:0,O=N===2?9102559:N===1?15187326:13069471;g.stateMaterial.color.setHex(O),g.light.emissive.setHex(O);for(const F of g.displays)F.material=G[N]}}function ie(){for(const w of G)w.map.dispose(),w.dispose()}return{createTower:H,finishTowers:_,createGate:k,update:L,dispose:ie}}const rt="0123456789ABCDEF<>/+ｱｳｶｿﾆﾎﾐﾝｦﾅﾘﾒ",Oe=`
varying vec3 vFrequencyPosition;
varying vec3 vFrequencyNormal;
`,st=`
${Oe}
uniform sampler2D frequencyAtlas;
uniform float frequencyAmount;
uniform float frequencyTime;
uniform vec2 frequencyOrigin;
float frequencyHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`,lt=`
if (frequencyAmount > .001) {
  vec3 surfaceNormal = abs(normalize(vFrequencyNormal));
  float horizontal = step(.65, surfaceNormal.y);
  vec2 surface = horizontal > .5 ? vFrequencyPosition.xz
    : (surfaceNormal.x > surfaceNormal.z ? vFrequencyPosition.zy : vFrequencyPosition.xy);
  vec2 grid = surface * mix(3.6, 2.5, horizontal);
  vec2 cell = floor(grid);
  float seed = frequencyHash(vec2(cell.x, floor(dot(vFrequencyPosition, surfaceNormal) * .25)));
  float scroll = frequencyTime * (2.5 + seed * 4.0);
  float trail = mod(cell.y + scroll + seed * 28.0, 28.0);
  float ink = .055 + exp(-trail * .19) * .76;
  float head = 1.0 - smoothstep(.05, 1.1, trail);
  float glyphId = floor(frequencyHash(cell + floor(frequencyTime * .8)) * 32.0);
  vec2 glyphUv = clamp(fract(grid), vec2(.025), vec2(.975));
  float glyph = texture2D(frequencyAtlas, vec2((glyphId + glyphUv.x) / 32.0, glyphUv.y)).a;
  float nearFade = 1.0 - smoothstep(24.0, 52.0, distance(vFrequencyPosition.xz, frequencyOrigin));
  float density = mix(1.0, .36, horizontal);
  float luminance = dot(outgoingLight, vec3(.2126, .7152, .0722));
  vec3 decoded = mix(outgoingLight * .28, luminance * vec3(.18, .63, .34), .78);
  decoded += vec3(.018, .052, .028);
  decoded += (vec3(.06, .85, .31) * ink + vec3(.50, 1.0, .72) * head * .52) * glyph * density * nearFade;
  float distanceFromScan = abs(distance(vFrequencyPosition.xz, frequencyOrigin) - mod(frequencyTime * 5.0, 44.0));
  float scan = (1.0 - smoothstep(.08, .65, distanceFromScan)) * .14;
  decoded += vec3(.12, .7, .32) * scan * nearFade;
  outgoingLight = mix(outgoingLight, decoded, frequencyAmount);
}
`;function ct(){const o=document.createElement("canvas");o.width=1024,o.height=32;const a=o.getContext("2d");a.fillStyle="#fff",a.textAlign="center",a.textBaseline="middle",a.font="bold 26px Consolas, monospace",Array.from(rt).forEach((t,r)=>a.fillText(t,r*32+16,17,25));const n=new we(o);return n.anisotropy=4,n}function wt(o,{key:a,fill:n,accents:t,streams:r,particles:s}){const i=ct(),l={frequencyAtlas:{value:i},frequencyAmount:{value:0},frequencyTime:{value:0},frequencyOrigin:{value:new $e}},f=new Set;o.traverse(e=>{if(!e.isSkinnedMesh)for(const c of[e.material].flat())c?.isMeshStandardMaterial&&f.add(c)});const d=[];for(const e of f){const c=e.onBeforeCompile,T=e.customProgramCacheKey,E=T.call(e);d.push({material:e,compile:c,cacheKey:T}),e.onBeforeCompile=function(p,q){c.call(this,p,q),Object.assign(p.uniforms,l),p.vertexShader=Oe+p.vertexShader,p.vertexShader=p.vertexShader.replace("#include <project_vertex>",`
        #include <project_vertex>
        vec4 frequencyWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          frequencyWorld = instanceMatrix * frequencyWorld;
        #endif
        vFrequencyPosition = (modelMatrix * frequencyWorld).xyz;
        vFrequencyNormal = inverseTransformDirection(transformedNormal, viewMatrix);
      `),p.fragmentShader=st+p.fragmentShader,p.fragmentShader=p.fragmentShader.replace("#include <opaque_fragment>",lt+`
#include <opaque_fragment>`)},e.customProgramCacheKey=()=>E+"/matrix-frequency-vision-v1",e.needsUpdate=!0}const m=o.parent,v=[[a.color,11005883],[n.color,7530914],[n.groundColor,1194788],[t[0].color,4323987],[t[1].color,6414262],[s.material.color,8454061],[m.background,135177],[m.fog.color,400145],...r.map(e=>[e.color,4915079])].map(([e,c])=>({target:e,original:e.clone(),active:new Z(c)})),u=r.map(e=>e.opacity);let y=!1,x=0;return{update(e,c,T,E){const p=c.visionActive?1:0,q=!y||E||e===0?p:ue.damp(l.frequencyAmount.value,p,7,e);y=!0,E||(x+=e),l.frequencyAmount.value=q,l.frequencyTime.value=x,l.frequencyOrigin.value.set(T.x,T.z);for(const{target:G,original:R,active:K}of v)G.copy(R).lerp(K,q);r.forEach((G,R)=>{G.opacity=ue.lerp(u[R],.58,q)})},dispose(){for(const{material:e,compile:c,cacheKey:T}of d)e.onBeforeCompile=c,e.customProgramCacheKey=T;for(const{target:e,original:c}of v)e.copy(c);r.forEach((e,c)=>{e.opacity=u[c]}),i.dispose()}}}export{vt as a,wt as b,Me as c,xt as d,pt as e,et as f,mt as g,yt as h,gt as i,ht as j,Te as k,tt as l,at as m,Ce as s};
