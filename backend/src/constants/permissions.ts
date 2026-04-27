export const PERMISSIONS = Object.freeze({
  DASHBOARD_READ: "dashboard:read",

  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_CHANGE_STATUS: "user:status",
  USER_SET_ROLES: "user:set_roles",

  CATEGORY_READ: "category:read",
  CATEGORY_CREATE: "category:create",
  CATEGORY_UPDATE: "category:update",
  CATEGORY_DELETE: "category:delete",
  CATEGORY_CHANGE_STATUS: "category:status",

  COURSE_READ: "course:read",
  COURSE_CREATE: "course:create",
  COURSE_UPDATE: "course:update",
  COURSE_DELETE: "course:delete",
  COURSE_CHANGE_STATUS: "course:status",
  COURSE_PUBLISH: "course:publish",
  COURSE_ASSIGN_TEACHER: "course:assign_teacher",

  TEACHER_READ: "teacher:read",
  TEACHER_CREATE: "teacher:create",
  TEACHER_UPDATE: "teacher:update",
  TEACHER_DELETE: "teacher:delete",
  TEACHER_CHANGE_STATUS: "teacher:status",

  STUDENT_READ: "student:read",
  STUDENT_CREATE: "student:create",
  STUDENT_UPDATE: "student:update",
  STUDENT_DELETE: "student:delete",
  STUDENT_CHANGE_STATUS: "student:status",

  CLASSROOM_READ: "classroom:read",
  CLASSROOM_CREATE: "classroom:create",
  CLASSROOM_UPDATE: "classroom:update",
  CLASSROOM_DELETE: "classroom:delete",
  CLASSROOM_CHANGE_STATUS: "classroom:status",
  CLASSROOM_ASSIGN_STUDENT: "classroom:assign_student",
  CLASSROOM_UPDATE_LEARNING: "classroom:update_learning",
  CLASSROOM_UPDATE_HONOR: "classroom:update_honor",

  ENROLLMENT_READ: "enrollment:read",
  ENROLLMENT_CREATE: "enrollment:create",
  ENROLLMENT_APPROVE: "enrollment:approve",
  ENROLLMENT_CANCEL: "enrollment:cancel",
  ENROLLMENT_DELETE: "enrollment:delete",

  SCHEDULE_READ: "schedule:read",
  SCHEDULE_CREATE: "schedule:create",
  SCHEDULE_UPDATE: "schedule:update",
  SCHEDULE_DELETE: "schedule:delete",

  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_CREATE: "notification:create",
  NOTIFICATION_DELETE: "notification:delete",

  PAYMENT_AUDIT_READ_OWN: "payment_audit:read_own",
  PAYMENT_AUDIT_READ_ALL: "payment_audit:read_all",
  PAYMENT_AUDIT_MANAGE: "payment_audit:manage",

  SECURITY_AUDIT_READ_OWN: "security_audit:read_own",
  SECURITY_AUDIT_READ_ALL: "security_audit:read_all",
  SECURITY_AUDIT_MANAGE: "security_audit:manage",

  RBAC_READ: "rbac:read",
  RBAC_MANAGE: "rbac:manage",
  RBAC_CREATE_ROLE: "rbac:role_create",
  RBAC_UPDATE_ROLE: "rbac:role_update",
  RBAC_DELETE_ROLE: "rbac:role_delete",
  RBAC_READ_PERMISSION: "rbac:permission_read",
  RBAC_SET_ROLE_PERMISSIONS: "rbac:set_role_permissions",
  RBAC_SET_USER_ROLES: "rbac:set_user_roles",
  RBAC_SET_USER_OVERRIDE: "rbac:set_user_override",
  RBAC_REMOVE_USER_OVERRIDE: "rbac:remove_user_override",
  RBAC_SYNC_ADMIN: "rbac:sync_admin",
} as const);

export type PermissionKey =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type PermissionCode = PermissionKey;
