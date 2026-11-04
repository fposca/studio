import test from "node:test";
import assert from "node:assert/strict";
import { BELFEGOR_REQUIRED_ATTEMPTS, advanceBelfegorAttempt, belfegorReaction, canRevealRealityKey } from "./halloweenBelfegorLogic.js";

test("Belfegor responds only after four insistence steps", () => {
  let attempts = 0;
  for (let step = 1; step <= BELFEGOR_REQUIRED_ATTEMPTS; step++) {
    const result = advanceBelfegorAttempt(attempts);
    attempts = result.attempts;
    assert.equal(attempts, step);
    assert.equal(result.responded, step === BELFEGOR_REQUIRED_ATTEMPTS);
    assert.equal(canRevealRealityKey(attempts), result.responded, "the dropped key appears only on the fourth attempt");
    assert.match(belfegorReaction(attempts), /Belfegor/);
  }
  assert.deepEqual(advanceBelfegorAttempt(attempts), { attempts: 4, responded: true });
  assert.equal(canRevealRealityKey(0), false);
});
