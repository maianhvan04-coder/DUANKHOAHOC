import type { UserAccess } from "@/app/api/auth.api";

export const STUDENT_PORTAL_ACCESS_PERMISSION = "student_portal:access";
export const ADMIN_ENTRY_ROLES = ["ADMIN", "MANAGER", "TEACHER"] as const;
const PUBLIC_ONLY_ROLES = new Set(["USER", "STUDENT"]);

const ADMIN_PERMISSION_ROUTES: Array<{
  href: string;
  prefixes: string[];
}> = [
  { href: "/admin/dashboard", prefixes: ["dashboard:"] },
  { href: "/admin/users", prefixes: ["user:"] },
  { href: "/admin/students", prefixes: ["student:"] },
  { href: "/admin/teachers", prefixes: ["teacher:"] },
  {
    href: "/admin/course",
    prefixes: ["category:", "course:", "enrollment:"],
  },
  { href: "/admin/blog", prefixes: ["blog:", "blog_category:"] },
  { href: "/admin/classes", prefixes: ["classroom:"] },
  { href: "/admin/schedule", prefixes: ["schedule:"] },
  { href: "/admin/notification", prefixes: ["notification:"] },
  { href: "/admin/payment-audits", prefixes: ["payment_audit:"] },
  { href: "/admin/security-audits", prefixes: ["security_audit:"] },
  { href: "/admin/rbac", prefixes: ["rbac:"] },
];

function isAdminPermission(permission: string) {
  return permission !== STUDENT_PORTAL_ACCESS_PERMISSION;
}

function hasCustomAdminRole(access: UserAccess) {
  const roles = new Set([access.primaryRole, ...access.roles]);
  return Array.from(roles).some((role) => !PUBLIC_ONLY_ROLES.has(role));
}

export function hasRole(
  access: UserAccess | null | undefined,
  role: string
) {
  return access?.primaryRole === role || !!access?.roles?.includes(role);
}

export function hasAnyRole(
  access: UserAccess | null | undefined,
  roles: readonly string[]
) {
  if (!access) return false;
  return roles.some(
    (role) => access.primaryRole === role || access.roles.includes(role)
  );
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

export function canAccessStudentPortal(access: UserAccess | null | undefined) {
  return (
    access?.primaryRole === "STUDENT" ||
    hasRole(access, "STUDENT") ||
    hasPermission(access, STUDENT_PORTAL_ACCESS_PERMISSION)
  );
}

export function canAccessAdmin(access: UserAccess | null | undefined) {
  if (!access) return false;

  const hasAdminPermission = access.permissions.some(isAdminPermission);
  if (!hasAdminPermission) return false;

  if (hasAnyRole(access, ADMIN_ENTRY_ROLES)) return true;
  return hasCustomAdminRole(access);
}

export function getAdminEntryPath(access: UserAccess | null | undefined) {
  if (!access || !canAccessAdmin(access)) return null;

  const permissions = access.permissions.filter(isAdminPermission);
  const route = ADMIN_PERMISSION_ROUTES.find((item) =>
    permissions.some((permission) =>
      item.prefixes.some((prefix) => permission.startsWith(prefix))
    )
  );

  return route?.href ?? null;
}
