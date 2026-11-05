import assert from "node:assert/strict";
import test from "node:test";
import { STORE_OBSTACLES } from "./recordStoreLayout.js";
import { STORE_NPCS } from "./recordStoreDialogue.js";
import { invadedStoreObstacles, INVASION_ARCHIVE_SHELF_OBSTACLE, INVASION_NPC_PLACEMENTS, INVASION_STATIC_COUNT } from "./recordStoreInvadedLayout.js";

test("invaded layout preserves shared normal/altered furniture and NPC positions", () => {
  const original = structuredClone(STORE_OBSTACLES);
  const npcs = STORE_NPCS.map(({id,x,z}) => ({id,x,z}));
  const invaded = invadedStoreObstacles();
  assert.deepEqual(STORE_OBSTACLES, original);
  assert.deepEqual(STORE_NPCS.map(({id,x,z}) => ({id,x,z})), npcs);
  invaded.forEach((obstacle, index) => assert.notEqual(obstacle, STORE_OBSTACLES[index]));
  assert.equal(INVASION_STATIC_COUNT, 12);
  const shelf = invaded.find(o => o.id === INVASION_ARCHIVE_SHELF_OBSTACLE.id);
  assert.deepEqual(shelf, INVASION_ARCHIVE_SHELF_OBSTACLE);
  assert.ok(Math.abs(9.1 - shelf.x) < shelf.hx + .46 && Math.abs(-7.15 - shelf.z) < shelf.hz + .46);
  assert.ok(Math.abs(7.8 - shelf.x) >= shelf.hx + .46, "The archive approach stays open");
  for (const id of ["tito", "rulo"]) {
    const location = INVASION_NPC_PLACEMENTS[id];
    assert.ok(invaded.some(o => o.x === location.x && o.z === location.z));
  }
  invaded[0].x = 999;
  assert.deepEqual(STORE_OBSTACLES, original);
});

test("all invasion puzzle routes, NPC approaches and jukebox stay connected for every movable-prop position", () => {
  const goals = [[-4.9,10.65],[5.2,10.05],[4.1,10.85],[-8.15,8.05],[-8.7,5.2],[-8.7,2.4],[-8.7,-.4],[7.1,-7.2],[7.5,-8.2],[0,-11.2],[3.5,-9.4],[-6.4,-10.9],[6.4,-10.9],[0,-8.7],[0,-5],[0,5]];
  for (let crate=0;crate<3;crate++) for(let mirror=0;mirror<2;mirror++) {
    const obstacles = [...invadedStoreObstacles(), {x:8.35,z:-7.2+crate*1.1,hx:.56,hz:.51},
      {x:mirror?5.65:4.65,z:mirror?-10.25:-9.4,hx:.46,hz:.18}, {...INVASION_NPC_PLACEMENTS.roxy,hx:.44,hz:.44}];
    const cells = new Set(), queue = [[38,92]], step=.25, width=77, height=105;
    for(let i=0;i<queue.length;i++) {
      const [ix,iz]=queue[i], key=iz*width+ix;
      if(ix<0||ix>=width||iz<0||iz>=height||cells.has(key))continue;
      const x=-9.5+ix*step,z=-12+iz*step;
      if(obstacles.some(o=>Math.abs(x-o.x)<o.hx+.46&&Math.abs(z-o.z)<o.hz+.46))continue;
      cells.add(key);queue.push([ix+1,iz],[ix-1,iz],[ix,iz+1],[ix,iz-1]);
    }
    for(const [gx,gz] of goals) assert.ok([...cells].some(key=>Math.hypot(-9.5+key%width*step-gx,-12+Math.floor(key/width)*step-gz)<.4), `Blocked approach ${gx},${gz}; crate ${crate}; mirror ${mirror}`);
  }
});
