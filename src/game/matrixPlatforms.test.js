import assert from 'node:assert/strict';
import test from 'node:test';
import {canClearMatrixPlatform,matrixPlatformHeight} from './matrixPlatforms.js';

test('Neonboy must jump above a box before crossing and can land on its top',()=>{
  const box={id:'memory block 0',x:0,z:-38,hx:.55,hz:.55,platformTop:1.24};
  assert.equal(canClearMatrixPlatform(box,1.1),false);
  assert.equal(canClearMatrixPlatform(box,1.26),true);
  assert.equal(matrixPlatformHeight(0,-38,1.4,1.1,[box]),1.24);
  assert.equal(matrixPlatformHeight(0,-38,1.1,.9,[box]),0);
  assert.equal(matrixPlatformHeight(1.5,-38,1.4,1.1,[box]),0);
  assert.equal(matrixPlatformHeight(0,-38,1.24,1.24,[box]),1.24);
  assert.equal(matrixPlatformHeight(1.5,-38,1.24,1.24,[box]),0);
});
