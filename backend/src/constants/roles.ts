export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  USER: "USER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
