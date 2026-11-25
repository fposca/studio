import { test } from "node:test";
import assert from "node:assert/strict";
import { CUSTOM_AVATAR_DEFAULTS, normalizeAvatarCustomization, readOfficeAvatarPreferences,
  saveOfficeAvatarPreferences } from "./avatarCustomization.js";

test("invalid or unavailable browser storage falls back to a usable avatar", () => {
  const badJson = { getItem: () => "{broken" };
  assert.deepEqual(readOfficeAvatarPreferences(badJson), {
    selectedAvatar: "fernando", customization: CUSTOM_AVATAR_DEFAULTS,
  });
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  assert.equal(readOfficeAvatarPreferences(blocked).selectedAvatar, "fernando");
  assert.equal(saveOfficeAvatarPreferences({ selectedAvatar: "custom" }, blocked), false);
});

test("saved options are limited to valid styles, colors and a short name", () => {
  const appearance = normalizeAvatarCustomization({
    name: "  Ana  ", hairStyle: "unknown", beardStyle: "full", glasses: "round",
    shirtColor: "#D75228", pantsColor: "red", shoesColor: "#348dd3",
  });
  assert.equal(appearance.name, "Ana");
  assert.equal(appearance.hairStyle, "none");
  assert.equal(appearance.beardStyle, "full");
  assert.equal(appearance.glasses, "round");
  assert.equal(appearance.shirtColor, "#d75228");
  assert.equal(appearance.pantsColor, CUSTOM_AVATAR_DEFAULTS.pantsColor);
  assert.equal(appearance.shoesColor, "#348dd3");
  assert.equal(normalizeAvatarCustomization({ name: "x".repeat(100) }).name.length, 24);
});
