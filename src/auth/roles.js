export const USER_ROLES = Object.freeze({
  VIEWER: "viewer",
  TESTER: "tester",
  ADMIN: "admin"
});

export const VALID_USER_ROLES = new Set(Object.values(USER_ROLES));
