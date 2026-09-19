import { USER_ROLES } from "./roles.js";

export const canUseFullWeb = (role) => role === USER_ROLES.TESTER || role === USER_ROLES.ADMIN;
export const canUseDesktop = canUseFullWeb;
export const canManageUsers = (role) => role === USER_ROLES.ADMIN;
