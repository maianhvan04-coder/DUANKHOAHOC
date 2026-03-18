export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  USER: "USER",
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

// alias để các file cũ import Role vẫn chạy
export type Role = RoleCode;