import assert from 'node:assert/strict';
import test from 'node:test';
import { canMatrixEnemyStand } from './matrixEnemyMovement.js';

test('enemies cross the workshop threshold when its gate opens, but not while it is closed', () => {
  const left = {id:'gate memory / left',x:-3,z:-25.8,hx:2.99,hz:.53};
  const right = {id:'gate memory / right',x:3,z:-25.8,hx:2.99,hz:.53};
  const obstacles = [left,right];
  assert.equal(canMatrixEnemyStand(0,-25.8,obstacles,null),false);
  left.x=-9.15;right.x=9.15;
  for(let z=-29;z<=-23;z+=.5)assert.equal(canMatrixEnemyStand(0,z,obstacles,null),true);
  assert.equal(canMatrixEnemyStand(-9.15,-25.8,obstacles,null),false);
});

test('the fuchsia elite and final boss cannot cross memory boxes', () => {
  const box = {id:'memory block 0',x:0,z:-38,hx:.55,hz:.55};
  assert.equal(canMatrixEnemyStand(0,-38,[box],null),false);
  assert.equal(canMatrixEnemyStand(0,-38,[box],null,true),true);
  assert.equal(canMatrixEnemyStand(2,-38,[box],null),true);
});
