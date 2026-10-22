import * as THREE from "three";
import { clubLabel } from "./rockClubMaterials.js";

export function createRockClubDetails(scene, m) {
  const cache = new Map(), up = new THREE.Vector3(0, 1, 0);
  const geometry = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
  function box(parent, name, w, h, d, x, y, z, material) {
    const mesh = new THREE.Mesh(geometry("box:" + [w,h,d], () => new THREE.BoxGeometry(w,h,d)), material);
    mesh.name = name; mesh.position.set(x,y,z); mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(parent, name, r, h, x,y,z, material, sides = 24) {
    const mesh = new THREE.Mesh(geometry("cyl:" + [r,h,sides], () => new THREE.CylinderGeometry(r,r,h,sides)), material);
    mesh.name = name; mesh.position.set(x,y,z); mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function rod(parent, name, a, b, radius, material) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.sub(start);
    const mesh = new THREE.Mesh(geometry("rod:" + radius, () => new THREE.CylinderGeometry(radius,radius,1,10)), material);
    mesh.name = name; mesh.position.copy(start).addScaledVector(delta,.5);
    mesh.scale.y = delta.length(); mesh.quaternion.setFromUnitVectors(up,delta.normalize()); parent.add(mesh); return mesh;
  }
  function ring(parent, name, radius, tube, x,y,z, material, horizontal = false) {
    const mesh = new THREE.Mesh(geometry("ring:" + [radius,tube], () => new THREE.TorusGeometry(radius,tube,6,32)), material);
    mesh.name = name; mesh.position.set(x,y,z); if (horizontal) mesh.rotation.x = Math.PI / 2;
    parent.add(mesh); return mesh;
  }
  function plane(parent,name,w,h,x,y,z,material) {
    const mesh = new THREE.Mesh(geometry("plane:" + [w,h], () => new THREE.PlaneGeometry(w,h)),material);
    mesh.name = name; mesh.position.set(x,y,z); parent.add(mesh); return mesh;
  }
  function group(name,x,y,z,parent=scene) {
    const root = new THREE.Group(); root.name=name; root.position.set(x,y,z); parent.add(root); return root;
  }
  const badgeMaterial = new THREE.MeshBasicMaterial({map:clubLabel("NB AUDIO","LIVE SERIES / 1999"),toneMapped:false});
  const coasterMaterial = new THREE.MeshStandardMaterial({map:clubLabel("NEON","CLUB DE ROCK","#bbaa8b","#282121"),roughness:.9});
  const glassMaterial = new THREE.MeshStandardMaterial({color:0xc5d1ca,metalness:.2,roughness:.16,transparent:true,opacity:.36});
  const bottleMaterials = [0x214936,0x633b17,0x283d50].map(color => new THREE.MeshStandardMaterial({color,roughness:.16,metalness:.28}));
  const labelMaterials = ["NIGHT ALE","BACKSTAGE","1999 RESERVE"].map((title,index)=>new THREE.MeshStandardMaterial({
    map:clubLabel(title,["BOTTLED AT THE CLUB","SMALL BATCH","NEON CELLARS"][index],["#c7ae78","#a9b6a9","#c8bdb0"][index],["#302817","#182922","#272131"][index]),roughness:.9
  }));
  const bottleShape = geometry("bottle",()=>new THREE.LatheGeometry([
    new THREE.Vector2(0,0),new THREE.Vector2(.064,0),new THREE.Vector2(.077,.025),
    new THREE.Vector2(.077,.28),new THREE.Vector2(.07,.31),new THREE.Vector2(.029,.37),
    new THREE.Vector2(.027,.48),new THREE.Vector2(.033,.49),new THREE.Vector2(.033,.51),new THREE.Vector2(0,.51)
  ],16));
  const labelShape = geometry("bottle-label",()=>new THREE.CylinderGeometry(.078,.078,.13,16,1,true));
  function bottle(parent,x,y,z,index=0,scale=1) {
    const root=group("labelled bottle",x,y,z,parent); root.scale.setScalar(scale); root.rotation.y=index*.7;
    root.add(new THREE.Mesh(bottleShape,bottleMaterials[index%3]));
    const label=new THREE.Mesh(labelShape,labelMaterials[index%3]); label.position.y=.19; root.add(label);
    cylinder(root,"bottle cap",.034,.025,0,.513,0,m.brass,12); return root;
  }
  function glass(parent,x,y,z) {
    const mesh=new THREE.Mesh(geometry("glass",()=>new THREE.CylinderGeometry(.075,.052,.19,16,1,true)),glassMaterial);
    mesh.position.set(x,y+.095,z); parent.add(mesh);
    ring(parent,"glass rim",.075,.005,x,y+.19,z,m.metal,true);
  }
  function coasters(parent,x,y,z) {
    const item=plane(parent,"printed coaster",.2,.2,x,y,z,coasterMaterial); item.rotation.x=-Math.PI/2; item.rotation.z=.25;
  }
  function tables() {
    for (const [x,z] of [[-5.7,.6],[-5.5,-5.7]]) {
      const root=group("walnut cocktail table",x,0,z);
      cylinder(root,"weighted table base",.39,.055,0,.04,0,m.black);
      cylinder(root,"cast table pedestal",.065,.97,0,.54,0,m.metal);
      ring(root,"table footrest",.33,.018,0,.3,0,m.metal,true);
      cylinder(root,"walnut tabletop",.64,.085,0,1.08,0,m.wood,48);
      ring(root,"table edge band",.64,.015,0,1.095,0,m.brass,true);
      coasters(root,-.19,1.126,.12); bottle(root,.2,1.126,-.1,1,.72); glass(root,-.19,1.127,.12);
      for (const sx of [-.86,.86]) {
        cylinder(root,"stitched leather seat",.265,.12,sx,.71,.45,m.burgundy);
        ring(root,"stool piping",.255,.007,sx,.761,.45,m.brass,true);
        for (const dx of [-.15,.15]) for (const dz of [-.15,.15])
          rod(root,"stool splayed leg",[sx+dx,.65,.45+dz],[sx+dx*1.35,.04,.45+dz*1.35],.022,m.metal);
        ring(root,"stool footrest",.22,.014,sx,.25,.45,m.metal,true);
      }
    }
  }
  function batch(parent,name,shape,material,items) {
    const mesh=new THREE.InstancedMesh(shape,material,items.length), dummy=new THREE.Object3D();
    mesh.name=name;
    items.forEach((item,i)=>{
      dummy.position.set(...item.position); dummy.rotation.set(...(item.rotation||[0,0,0]));
      dummy.scale.set(...(item.scale||[1,1,1])); dummy.updateMatrix(); mesh.setMatrixAt(i,dummy.matrix);
      if(item.color!==undefined)mesh.setColorAt(i,new THREE.Color(item.color));
    });
    mesh.instanceMatrix.needsUpdate=true; parent.add(mesh); return mesh;
  }
  function consoleDesk() {
    const root=group("analog front of house console",-3.8,0,-3.3);
    const collider=box(root,"sound desk cabinet",1.7,.78,1.1,0,.39,0,m.black); collider.castShadow=true;
    for(const x of [-.83,.83]) {
      box(root,"flight case corner",.045,.78,.045,x,.4,.53,m.metal);
      box(root,"console walnut cheek",.09,.17,1.21,x,.9,0,m.wood);
    }
    const surface=group("angled mixing surface",0,.87,0,root);surface.rotation.x=.12;
    box(surface,"brushed console face",1.59,.055,1.15,0,0,0,m.metal);
    box(surface,"channel black overlay",1.42,.008,.96,-.025,.032,.04,m.black);
    const labels=clubLabel("NEON / LIVE 12","GAIN · EQ · AUX · PAN · CHANNEL · MAIN","#d0d0bd","#172026");
    const strip=plane(surface,"console title strip",1.39,.15,0,.039,-.46,new THREE.MeshBasicMaterial({map:labels}));
    strip.rotation.x=-Math.PI/2;
    const knobs=[],pointers=[],faders=[],tracks=[],ticks=[],leds=[];
    for(let channel=0;channel<12;channel++) {
      const x=-.66+channel*.103;
      for(let row=0;row<4;row++) {
        const z=-.28+row*.12;
        knobs.push({position:[x,.064,z],color:[0xc7bfa6,0x347e8b,0x9b6640,0x6c766d][row]});
        pointers.push({position:[x,.083,z-.007],scale:[.004,.003,.014]});
      }
      for(let mark=0;mark<7;mark++)ticks.push({position:[x+.025,.041,.17+mark*.04],scale:[mark===3?.025:.013,.003,.003]});
      tracks.push({position:[x,.04,.29],scale:[.014,.008,.26]});
      faders.push({position:[x,.06,.22+(channel%4)*.035],scale:[.06,.025,.035]});
      leds.push({position:[x,.055,-.385],scale:[.022,.012,.022],color:channel%4===0?0xe14a4a:0x5cda85});
    }
    const knobMaterial=new THREE.MeshStandardMaterial({color:0xeeeeee,roughness:.57,metalness:.15});
    const capMaterial=new THREE.MeshStandardMaterial({color:0xd5cdbb,roughness:.7});
    const markingsMaterial=new THREE.MeshBasicMaterial({color:0x8c9295});
    batch(surface,"console EQ and gain controls",geometry("knob",()=>new THREE.CylinderGeometry(.018,.022,.036,10)),knobMaterial,knobs);
    batch(surface,"fader grooves",geometry("unitbox",()=>new THREE.BoxGeometry(1,1,1)),m.rubber,tracks);
    batch(surface,"channel fader caps",cache.get("unitbox"),capMaterial,faders);
    batch(surface,"fader level markings",cache.get("unitbox"),markingsMaterial,ticks);
    batch(surface,"knob position markings",cache.get("unitbox"),capMaterial,pointers);
    batch(surface,"channel signal LEDs",cache.get("unitbox"),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),leds);
    for(let meter=0;meter<2;meter++) {
      box(surface,"VU meter housing",.12,.022,.3,.61+meter*.13,.05,-.17,m.rubber);
      for(let segment=0;segment<9;segment++)
        box(surface,"VU meter segment",.07,.009,.018,.61+meter*.13,.067,-.28+segment*.025,segment<6?m.green:segment<8?m.screen:m.red);
    }
    // Rack fronts and cable sockets live inside the existing console footprint.
    for(const y of [.18,.34,.5]) {
      box(root,"outboard rack face",1.45,.13,.025,0,y,.565,m.metal);
      box(root,"rack readout",.27,.065,.012,-.38,y,.585,m.black);
      for(let i=0;i<5;i++)cylinder(root,"rack processor dial",.025,.02,-.03+i*.17,y,.585,m.black,10).rotation.x=Math.PI/2;
    }
    for(let i=0;i<4;i++)rod(root,"console patch cable",[-.6+i*.16,.2,-.57],[-.6+i*.18,.03,-.8],.011,m.rubber);
    return collider;
  }
  function bar() {
    const root=group("club walnut bar",7.3,0,-3.5);
    const collider=box(root,"bar counter",1.66,1.16,6.4,0,.58,0,m.stage);collider.castShadow=true;
    box(root,"polished walnut counter",1.9,.13,6.7,0,1.23,0,m.barTop);
    for(const z of [-2.4,-.8,.8,2.4]) {
      box(root,"recessed bar panel",.035,.84,1.45,-.845,.6,z,m.black);
      for(const dz of [-.71,.71])box(root,"walnut panel stile",.06,.9,.055,-.88,.6,z+dz,m.wood);
      for(const y of [.16,1.04])box(root,"walnut panel rail",.065,.045,1.46,-.88,y,z,m.wood);
    }
    rod(root,"brass bar foot rail",[-1.08,.23,-3.15],[-1.08,.23,3.15],.032,m.brass);
    for(const z of [-2.7,-.9,.9,2.7])rod(root,"foot rail bracket",[-.81,.14,z],[-1.08,.23,z],.022,m.brass);
    box(root,"bar service mat",.42,.018,1.25,-.15,1.31,.15,m.rubber);
    for(let i=0;i<3;i++){coasters(root,-.55,1.3,-1.85+i*1.55);glass(root,-.55,1.307,-1.85+i*1.55);}
    bottle(root,.35,1.3,-2.25,0,.9);bottle(root,.44,1.3,-1.8,1,.8);
    // A small brass draught tower, tap levers and drip tray.
    cylinder(root,"draught tower",.065,.45,.28,1.53,.1,m.brass);
    rod(root,"draught crosspiece",[.28,1.74,-.12],[.28,1.74,.32],.048,m.brass);
    for(const z of [-.1,.3]) {
      rod(root,"beer tap nozzle",[.28,1.72,z],[.03,1.67,z],.022,m.metal);
      cylinder(root,"beer tap lever",.023,.18,.16,1.84,z,m.black,10);
    }
    box(root,"drip tray",.35,.025,.68,.02,1.315,.1,m.metal);
    const back=group("backbar shelves",9.48,0,-3.5);
    box(back,"smoked backbar mirror",.04,2.85,6.6,.2,2.43,0,new THREE.MeshStandardMaterial({color:0x34313b,metalness:.82,roughness:.23}));
    for(const z of [-3.35,0,3.35])box(back,"backbar brass frame",.12,2.9,.055,.12,2.43,z,m.brass);
    for(const y of [1.63,2.5,3.37]) {
      box(back,"walnut bottle shelf",.56,.075,6.7,-.1,y,0,m.wood);
      box(back,"shelf warm light",.025,.025,6.4,-.36,y-.055,0,m.screen);
      for(let i=0;i<11;i++)bottle(back,-.15,y+.038,-3.0+i*.58,i+Math.round(y*4),.72+(i%3)*.09);
    }
    return collider;
  }
  function speaker(x) {
    const root=group("detailed touring PA",x,0,-12.3);
    const body=box(root,"stage PA cabinet",1.45,2.7,1.05,0,1.35,0,m.black);body.castShadow=true;
    box(root,"PA recessed baffle",1.31,2.54,.025,0,1.35,.533,m.rubber);
    for(const y of [.63,1.55]) {
      const woofer=new THREE.Mesh(geometry("woofer dish",()=>new THREE.LatheGeometry([
        new THREE.Vector2(0,0), new THREE.Vector2(.15,0), new THREE.Vector2(.22,-.025),
        new THREE.Vector2(.39,.025), new THREE.Vector2(.418,.037)
      ],32)),m.cone);
      woofer.name="woofer paper cone";woofer.position.set(0,y,.568);woofer.rotation.x=Math.PI/2;root.add(woofer);
      ring(root,"woofer rubber surround",.418,.035,0,y,.605,m.rubber);
      ring(root,"woofer basket trim",.46,.012,0,y,.595,m.metal);
      const dome=new THREE.Mesh(geometry("dustcap",()=>new THREE.SphereGeometry(.15,16,10)),m.cone);
      dome.position.set(0,y,.61);dome.scale.z=.4;root.add(dome);
    }
    box(root,"compression horn rim",.98,.45,.05,0,2.28,.563,m.metal);
    box(root,"compression horn throat",.84,.32,.03,0,2.28,.598,m.rubber);
    const grille=plane(root,"perforated steel grille",1.29,2.5,0,1.35,.69,m.grille);
    grille.receiveShadow=false;
    plane(root,"speaker maker badge",.44,.11,0,.19,.702,badgeMaterial);
    for(const x of [-.69,.69])for(const y of [.1,2.6])
      box(root,"protective corner cap",.11,.16,.12,x,y,.5,m.metal);
    for(const side of [-1,1]) {
      box(root,"recessed carry handle",.015,.34,.34,side*.735,1.32,0,m.rubber);
      rod(root,"carry handle grip",[side*.75,1.21,-.1],[side*.75,1.21,.1],.025,m.metal);
    }
    return body;
  }
  function monitor(x) {
    const root=group("detailed floor wedge",x,.75,-12.2);root.rotation.x=-.2;
    const body=box(root,"floor monitor",1.05,.48,.8,0,0,0,m.black);body.castShadow=true;
    plane(root,"monitor steel grille",.91,.36,0,.015,.414,m.grille);
    for(const x of [-.48,.48])box(root,"monitor corner rail",.035,.42,.04,x,0,.42,m.metal);
    plane(root,"monitor badge",.26,.065,0,-.125,.426,badgeMaterial);
    return body;
  }
  function stand(parent,id) {
    // The mast and braces sit behind the instrument; only rubber pads touch it.
    rod(parent,id+" rear mast",[0,.08,-.35],[0,.93,-.35],.022,m.metal);
    for(const side of [-1,1]) {
      rod(parent,id+" base leg",[0,.09,-.34],[side*.34,.045,.23],.022,m.metal);
      cylinder(parent,id+" rubber foot",.045,.035,side*.34,.035,.23,m.rubber,12);
      rod(parent,id+" lower cradle",[side*.15,.145,-.34],[side*.15,.145,.15],.026,m.rubber);
      rod(parent,id+" cradle lip",[side*.15,.145,.15],[side*.15,.21,.17],.026,m.rubber);
    }
    rod(parent,id+" back foot",[0,.08,-.34],[0,.04,-.62],.022,m.metal);
    cylinder(parent,id+" rear rubber foot",.045,.035,0,.035,-.62,m.rubber,12);
    rod(parent,id+" neck fork stem",[0,.9,-.35],[0,.9,-.12],.022,m.metal);
    for(const side of [-1,1])rod(parent,id+" padded neck fork",[side*.075,.9,-.16],[side*.075,.9,.035],.027,m.rubber);
    cylinder(parent,id+" height collar",.034,.085,0,.62,-.35,m.black,12);
  }
  function walls() {
    for(const x of [-9.72,9.72]) {
      box(scene,"walnut lower wall rail",.095,.085,27.4,x,1.07,-5,m.wood);
      for(let z=-17.8;z<8;z+=2.1)box(scene,"wall panelling batten",.08,.7,.055,x,.65,z,m.wood);
      rod(scene,"electrical conduit",[x,4.65,-18.5],[x,4.65,8.4],.025,m.metal);
    }
  }
  return {tables,consoleDesk,bar,speaker,monitor,stand,walls};
}
