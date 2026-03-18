import type { Role, UserAccess } from "@/app/api/auth.api";

export function hasRole(
  access: UserAccess | null | undefined,
  role: Role
) {
  return !!access?.roles?.includes(role);
}

export function hasAnyRole(
  access: UserAccess | null | undefined,
  roles: Role[]
) {
  if (!access) return false;
  return roles.some((role) => access.roles.includes(role));
}

export function hasPermission(
  access: UserAccess | null | undefined,
  permission: string
) {
  return !!access?.permissions?.includes(permission);
}

export function hasAnyPermission(
  access: UserAccess | null | undefined,
  permissions: string[]
) {
  if (!access) return false;
  return permissions.some((permission) =>
    access.permissions.includes(permission)
  );
}