import test from 'node:test';
import assert from 'node:assert/strict';
import {createStudioSignalBuffer} from './studioSignalAudio.js';
test('the original studio transmission is deterministic, reversible and bounded',()=>{
 const context={sampleRate:8000,createBuffer(channels,length,rate){const samples=new Float32Array(length);return{length,sampleRate:rate,getChannelData:()=>samples};}};
 const forward=createStudioSignalBuffer(context,false,1),reverse=createStudioSignalBuffer(context,true,1),clean=createStudioSignalBuffer(context,false,0);
 assert.equal(forward.length,24000);const a=forward.getChannelData(0),b=reverse.getChannelData(0),c=clean.getChannelData(0);
 let different=false;for(let i=0;i<a.length;i++){assert.equal(a[i],b[a.length-1-i]);assert.ok(Math.abs(a[i])<.36);different ||= a[i]!==c[i];}assert.ok(different);
});
