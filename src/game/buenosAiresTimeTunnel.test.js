import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTimeTunnel, createTunnelBackdrop } from './buenosAiresTimeTunnel.js';

test('time tunnel fades in, follows the camera and scales its fixed pool to device quality',()=>{
 const root=new THREE.Group(),camera=new THREE.PerspectiveCamera(),fx=createTimeTunnel(root);
 camera.position.set(12,28,42);camera.rotation.set(.12,.8,0);
 fx.update({time:163,tier:'high'},camera);assert.equal(fx.stats.visible,false);
 fx.update({time:164,tier:'high'},camera);assert.equal(fx.stats.opacity,0);
 fx.update({time:165,tier:'high'},camera);assert.ok(fx.stats.opacity>0&&fx.stats.opacity<1);
 for(const [tier,arcs,streaks] of [['low',8,24],['medium',12,48],['high',18,80]]){
  fx.update({time:170,tier},camera);assert.equal(fx.stats.arcs,arcs);assert.equal(fx.stats.streaks,streaks);assert.equal(fx.stats.opacity,1);
  assert.deepEqual(fx.root.position.toArray(),camera.position.toArray());assert.deepEqual(fx.root.quaternion.toArray(),camera.quaternion.toArray());
 }
 fx.dispose();assert.equal(root.children.length,0);
});

test('reduced motion removes speed streaks and all tunnel resources are released',()=>{
 const parent=new THREE.Group(),fx=createTimeTunnel(parent,{reducedMotion:true}),camera=new THREE.PerspectiveCamera(),resources=new Set();
 fx.root.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material);if(o.isInstancedMesh)resources.add(o);});
 const counts=new Map();for(const r of resources)r.addEventListener('dispose',()=>counts.set(r,(counts.get(r)||0)+1));
 for(let i=0;i<600;i++)fx.update({time:164+i/60,tier:'low'},camera);
 assert.equal(fx.stats.streaks,0);fx.dispose();fx.dispose();for(const r of resources)assert.equal(counts.get(r),1);
});


test('the temporal backdrop hides the city, preserves the real car and lights, and restores original visibility',()=>{
 const city=new THREE.Group(),traffic=new THREE.Group(),car=new THREE.Group(),otherCar=new THREE.Group(),effects=new THREE.Group(),building=new THREE.Group(),dark=new THREE.Group();
 const light=new THREE.PointLight();building.add(light);city.add(building,dark,traffic,effects);traffic.add(car,otherCar);dark.visible=false;
 const wall=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());building.add(wall);
 const mask=createTunnelBackdrop(city,[car,effects]);mask.hide();
 assert.ok(car.visible&&effects.visible&&light.visible&&building.visible);assert.equal(wall.visible,false);assert.equal(otherCar.visible,false);assert.equal(mask.active,true);
 otherCar.visible=true;mask.hide();assert.equal(otherCar.visible,false,'city updates cannot reveal outside traffic');
 mask.restore();assert.ok(wall.visible&&otherCar.visible);assert.equal(dark.visible,false);assert.equal(mask.active,false);
 mask.hide();mask.restore();assert.ok(car.visible);wall.geometry.dispose();wall.material.dispose();
});
