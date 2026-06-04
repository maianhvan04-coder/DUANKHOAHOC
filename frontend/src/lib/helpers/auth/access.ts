import type { UserAccess } from "@/app/api/auth.api";

export const STUDENT_PORTAL_ACCESS_PERMISSION = "student_portal:access";
export const TEACHER_PORTAL_ACCESS_PERMISSION = "teacher_portal:access";
export const STUDENT_PORTAL_ENTRY_PATH = "/student/bang-tin";
export const TEACHER_PORTAL_ENTRY_PATH = "/teacher/bang-tin";
export const ADMIN_ENTRY_ROLES = ["ADMIN", "MANAGER"] as const;
const PUBLIC_ONLY_ROLES = new Set(["USER", "STUDENT", "TEACHER"]);

export const STUDENT_PORTAL_PERMISSIONS = {
  ACCESS: STUDENT_PORTAL_ACCESS_PERMISSION,
  DASHBOARD_READ: "student_portal:dashboard_read",
  SCHEDULE_READ: "student_portal:schedule_read",
  GRADE_READ: "student_portal:grade_read",
  NOTIFICATION_READ: "student_portal:notification_read",
  NOTIFICATION_UPDATE: "student_portal:notification_update",
  PROFILE_READ: "student_portal:profile_read",
  PROFILE_UPDATE: "student_portal:profile_update",
  SETTING_READ: "student_portal:setting_read",
  SETTING_UPDATE: "student_portal:setting_update",
} as const;

export const TEACHER_PORTAL_PERMISSIONS = {
  ACCESS: TEACHER_PORTAL_ACCESS_PERMISSION,
  DASHBOARD_READ: "teacher_portal:dashboard_read",
  SCHEDULE_READ: "teacher_portal:schedule_read",
  CLASS_READ: "teacher_portal:class_read",
  CLASS_CREATE: "teacher_portal:class_create",
  CLASS_UPDATE: "teacher_portal:class_update",
  CLASS_CHANGE_STATUS: "teacher_portal:class_status",
  STUDENT_UPDATE: "teacher_portal:student_update",
  NOTIFICATION_READ: "teacher_portal:notification_read",
  NOTIFICATION_UPDATE: "teacher_portal:notification_update",
  SETTING_READ: "teacher_portal:setting_read",
  SETTING_UPDATE: "teacher_portal:setting_update",
} as const;

const STUDENT_PORTAL_PERMISSION_VALUES = Object.values(
  STUDENT_PORTAL_PERMISSIONS
);

const TEACHER_PORTAL_PERMISSION_VALUES = Object.values(
  TEACHER_PORTAL_PERMISSIONS
);

const STUDENT_PERMISSION_ROUTES: Array<{
  href: string;
  permissions: string[];
}> = [
  {
    href: "/student/bang-tin",
    permissions: [
      STUDENT_PORTAL_PERMISSIONS.ACCESS,
      STUDENT_PORTAL_PERMISSIONS.DASHBOARD_READ,
    ],
  },
  {
    href: "/student/lich-hoc",
    permissions: [STUDENT_PORTAL_PERMISSIONS.SCHEDULE_READ],
  },
  {
    href: "/student/xem-diem",
    permissions: [STUDENT_PORTAL_PERMISSIONS.GRADE_READ],
  },
  {
    href: "/student/thong-bao",
    permissions: [
      STUDENT_PORTAL_PERMISSIONS.NOTIFICATION_READ,
      STUDENT_PORTAL_PERMISSIONS.NOTIFICATION_UPDATE,
    ],
  },
  {
    href: "/student/thong-tin-ca-nhan",
    permissions: [
      STUDENT_PORTAL_PERMISSIONS.PROFILE_READ,
      STUDENT_PORTAL_PERMISSIONS.PROFILE_UPDATE,
    ],
  },
  {
    href: "/student/cai-dat",
    permissions: [
      STUDENT_PORTAL_PERMISSIONS.SETTING_READ,
      STUDENT_PORTAL_PERMISSIONS.SETTING_UPDATE,
    ],
  },
];

const TEACHER_PERMISSION_ROUTES: Array<{
  href: string;
  permissions: string[];
}> = [
  {
    href: "/teacher/bang-tin",
    permissions: [
      TEACHER_PORTAL_PERMISSIONS.ACCESS,
      TEACHER_PORTAL_PERMISSIONS.DASHBOARD_READ,
    ],
  },
  {
    href: "/teacher/lich-day",
    permissions: [TEACHER_PORTAL_PERMISSIONS.SCHEDULE_READ],
  },
  {
    href: "/teacher/lop-hoc",
    permissions: [
      TEACHER_PORTAL_PERMISSIONS.CLASS_READ,
      TEACHER_PORTAL_PERMISSIONS.CLASS_CREATE,
      TEACHER_PORTAL_PERMISSIONS.CLASS_UPDATE,
      TEACHER_PORTAL_PERMISSIONS.CLASS_CHANGE_STATUS,
      TEACHER_PORTAL_PERMISSIONS.STUDENT_UPDATE,
    ],
  },
  {
    href: "/teacher/thong-bao",
    permissions: [
      TEACHER_PORTAL_PERMISSIONS.NOTIFICATION_READ,
      TEACHER_PORTAL_PERMISSIONS.NOTIFICATION_UPDATE,
    ],
  },
  {
    href: "/teacher/cai-dat",
    permissions: [
      TEACHER_PORTAL_PERMISSIONS.SETTING_READ,
      TEACHER_PORTAL_PERMISSIONS.SETTING_UPDATE,
    ],
  },
];

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
  { href: "/admin/payment-methods", prefixes: ["payment_method:"] },
  { href: "/admin/payment-audits", prefixes: ["payment_audit:"] },
  { href: "/admin/security-audits", prefixes: ["security_audit:"] },
  { href: "/admin/rbac", prefixes: ["rbac:"] },
];

function isAdminPermission(permission: string) {
  return (
    !permission.startsWith("student_portal:") &&
    !permission.startsWith("teacher_portal:")
  );
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
  return hasAnyPermission(access, STUDENT_PORTAL_PERMISSION_VALUES);
}

export function getStudentEntryPath(access: UserAccess | null | undefined) {
  if (!canAccessStudentPortal(access)) return null;

  if (
    hasAnyPermission(access, [
      STUDENT_PORTAL_PERMISSIONS.ACCESS,
      STUDENT_PORTAL_PERMISSIONS.DASHBOARD_READ,
    ])
  ) {
    return STUDENT_PORTAL_ENTRY_PATH;
  }

  return (
    STUDENT_PERMISSION_ROUTES.find((route) =>
      hasAnyPermission(access, route.permissions)
    )?.href ?? null
  );
}

export function hasStudentPortalPermission(
  access: UserAccess | null | undefined,
  permission: string
) {
  return hasPermission(access, permission);
}

export function hasAnyStudentPortalPermission(
  access: UserAccess | null | undefined,
  permissions: string[]
) {
  return hasAnyPermission(access, permissions);
}

export function canAccessStudentPath(
  access: UserAccess | null | undefined,
  pathname: string
) {
  if (!canAccessStudentPortal(access)) return false;

  const normalizedPathname =
    pathname === "/student" ? STUDENT_PORTAL_ENTRY_PATH : pathname;
  const route = STUDENT_PERMISSION_ROUTES.find((item) =>
    normalizedPathname.startsWith(item.href)
  );

  if (!route) return false;
  return hasAnyPermission(access, route.permissions);
}

export function canAccessTeacherPortal(access: UserAccess | null | undefined) {
  return hasAnyPermission(access, TEACHER_PORTAL_PERMISSION_VALUES);
}

export function getTeacherEntryPath(access: UserAccess | null | undefined) {
  if (!canAccessTeacherPortal(access)) return null;

  if (
    hasAnyPermission(access, [
      TEACHER_PORTAL_PERMISSIONS.ACCESS,
      TEACHER_PORTAL_PERMISSIONS.DASHBOARD_READ,
    ])
  ) {
    return TEACHER_PORTAL_ENTRY_PATH;
  }

  return (
    TEACHER_PERMISSION_ROUTES.find((route) =>
      hasAnyPermission(access, route.permissions)
    )?.href ?? null
  );
}

export function hasTeacherPortalPermission(
  access: UserAccess | null | undefined,
  permission: string
) {
  return hasPermission(access, permission);
}

export function hasAnyTeacherPortalPermission(
  access: UserAccess | null | undefined,
  permissions: string[]
) {
  return hasAnyPermission(access, permissions);
}

export function canAccessTeacherPath(
  access: UserAccess | null | undefined,
  pathname: string
) {
  if (!canAccessTeacherPortal(access)) return false;

  const normalizedPathname =
    pathname === "/teacher" ? TEACHER_PORTAL_ENTRY_PATH : pathname;
  const route = TEACHER_PERMISSION_ROUTES.find((item) =>
    normalizedPathname.startsWith(item.href)
  );

  if (!route) return false;
  return hasAnyPermission(access, route.permissions);
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
