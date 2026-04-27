import { PERMISSION_GROUPS } from "./permission.groups";
import { PERMISSIONS, type PermissionKey } from "./permissions";
import { ROLES, type Role } from "./roles";

type SeedPermissionMeta = {
  key: PermissionKey;
  resource: string;
  action: string;
  label: string;
  groupKey: string;
  groupLabel: string;
  order?: number;
};

function meta(
  key: PermissionKey,
  resource: string,
  action: string,
  label: string,
  groupKey: string,
  groupLabel: string,
  order: number
): SeedPermissionMeta {
  return {
    key,
    resource,
    action,
    label,
    groupKey,
    groupLabel,
    order,
  };
}

const BASE_PERMISSION_META = Object.freeze({
  [PERMISSIONS.DASHBOARD_READ]: meta(
    PERMISSIONS.DASHBOARD_READ,
    "dashboard",
    "read",
    "Xem dashboard tổng quan",
    PERMISSION_GROUPS.DASHBOARD.key,
    PERMISSION_GROUPS.DASHBOARD.label,
    10
  ),

  // USER
  [PERMISSIONS.USER_READ]: meta(
    PERMISSIONS.USER_READ,
    "user",
    "read",
    "Xem người dùng",
    PERMISSION_GROUPS.USERS.key,
    PERMISSION_GROUPS.USERS.label,
    110
  ),
  [PERMISSIONS.USER_CREATE]: meta(
    PERMISSIONS.USER_CREATE,
    "user",
    "create",
    "Tạo người dùng",
    PERMISSION_GROUPS.USERS.key,
    PERMISSION_GROUPS.USERS.label,
    120
  ),
  [PERMISSIONS.USER_UPDATE]: meta(
    PERMISSIONS.USER_UPDATE,
    "user",
    "update",
    "Cập nhật người dùng",
    PERMISSION_GROUPS.USERS.key,
    PERMISSION_GROUPS.USERS.label,
    130
  ),
  [PERMISSIONS.USER_DELETE]: meta(
    PERMISSIONS.USER_DELETE,
    "user",
    "delete",
    "Xóa người dùng",
    PERMISSION_GROUPS.USERS.key,
    PERMISSION_GROUPS.USERS.label,
    140
  ),
  [PERMISSIONS.USER_CHANGE_STATUS]: meta(
    PERMISSIONS.USER_CHANGE_STATUS,
    "user",
    "status",
    "Đổi trạng thái người dùng",
    PERMISSION_GROUPS.USERS.key,
    PERMISSION_GROUPS.USERS.label,
    150
  ),
  [PERMISSIONS.USER_SET_ROLES]: meta(
    PERMISSIONS.USER_SET_ROLES,
    "user",
    "set_roles",
    "Gán vai trò cho người dùng",
    PERMISSION_GROUPS.USERS.key,
    PERMISSION_GROUPS.USERS.label,
    160
  ),

  // CATEGORY
  [PERMISSIONS.CATEGORY_READ]: meta(
    PERMISSIONS.CATEGORY_READ,
    "category",
    "read",
    "Xem danh mục khóa học",
    PERMISSION_GROUPS.CATEGORIES.key,
    PERMISSION_GROUPS.CATEGORIES.label,
    210
  ),
  [PERMISSIONS.CATEGORY_CREATE]: meta(
    PERMISSIONS.CATEGORY_CREATE,
    "category",
    "create",
    "Tạo danh mục khóa học",
    PERMISSION_GROUPS.CATEGORIES.key,
    PERMISSION_GROUPS.CATEGORIES.label,
    220
  ),
  [PERMISSIONS.CATEGORY_UPDATE]: meta(
    PERMISSIONS.CATEGORY_UPDATE,
    "category",
    "update",
    "Cập nhật danh mục khóa học",
    PERMISSION_GROUPS.CATEGORIES.key,
    PERMISSION_GROUPS.CATEGORIES.label,
    230
  ),
  [PERMISSIONS.CATEGORY_DELETE]: meta(
    PERMISSIONS.CATEGORY_DELETE,
    "category",
    "delete",
    "Xóa danh mục khóa học",
    PERMISSION_GROUPS.CATEGORIES.key,
    PERMISSION_GROUPS.CATEGORIES.label,
    240
  ),
  [PERMISSIONS.CATEGORY_CHANGE_STATUS]: meta(
    PERMISSIONS.CATEGORY_CHANGE_STATUS,
    "category",
    "status",
    "Đổi trạng thái danh mục khóa học",
    PERMISSION_GROUPS.CATEGORIES.key,
    PERMISSION_GROUPS.CATEGORIES.label,
    250
  ),

  // COURSE
  [PERMISSIONS.COURSE_READ]: meta(
    PERMISSIONS.COURSE_READ,
    "course",
    "read",
    "Xem khóa học",
    PERMISSION_GROUPS.COURSES.key,
    PERMISSION_GROUPS.COURSES.label,
    310
  ),
  [PERMISSIONS.COURSE_CREATE]: meta(
    PERMISSIONS.COURSE_CREATE,
    "course",
    "create",
    "Tạo khóa học",
    PERMISSION_GROUPS.COURSES.key,
    PERMISSION_GROUPS.COURSES.label,
    320
  ),
  [PERMISSIONS.COURSE_UPDATE]: meta(
    PERMISSIONS.COURSE_UPDATE,
    "course",
    "update",
    "Cập nhật khóa học",
    PERMISSION_GROUPS.COURSES.key,
    PERMISSION_GROUPS.COURSES.label,
    330
  ),
  [PERMISSIONS.COURSE_DELETE]: meta(
    PERMISSIONS.COURSE_DELETE,
    "course",
    "delete",
    "Xóa khóa học",
    PERMISSION_GROUPS.COURSES.key,
    PERMISSION_GROUPS.COURSES.label,
    340
  ),
  [PERMISSIONS.COURSE_CHANGE_STATUS]: meta(
    PERMISSIONS.COURSE_CHANGE_STATUS,
    "course",
    "status",
    "Đổi trạng thái khóa học",
    PERMISSION_GROUPS.COURSES.key,
    PERMISSION_GROUPS.COURSES.label,
    350
  ),
  [PERMISSIONS.COURSE_PUBLISH]: meta(
    PERMISSIONS.COURSE_PUBLISH,
    "course",
    "publish",
    "Xuất bản khóa học",
    PERMISSION_GROUPS.COURSES.key,
    PERMISSION_GROUPS.COURSES.label,
    360
  ),
  [PERMISSIONS.COURSE_ASSIGN_TEACHER]: meta(
    PERMISSIONS.COURSE_ASSIGN_TEACHER,
    "course",
    "assign_teacher",
    "Gán giảng viên cho khóa học",
    PERMISSION_GROUPS.COURSES.key,
    PERMISSION_GROUPS.COURSES.label,
    370
  ),

  // TEACHER
  [PERMISSIONS.TEACHER_READ]: meta(
    PERMISSIONS.TEACHER_READ,
    "teacher",
    "read",
    "Xem giảng viên",
    PERMISSION_GROUPS.TEACHERS.key,
    PERMISSION_GROUPS.TEACHERS.label,
    410
  ),
  [PERMISSIONS.TEACHER_CREATE]: meta(
    PERMISSIONS.TEACHER_CREATE,
    "teacher",
    "create",
    "Tạo giảng viên",
    PERMISSION_GROUPS.TEACHERS.key,
    PERMISSION_GROUPS.TEACHERS.label,
    420
  ),
  [PERMISSIONS.TEACHER_UPDATE]: meta(
    PERMISSIONS.TEACHER_UPDATE,
    "teacher",
    "update",
    "Cập nhật giảng viên",
    PERMISSION_GROUPS.TEACHERS.key,
    PERMISSION_GROUPS.TEACHERS.label,
    430
  ),
  [PERMISSIONS.TEACHER_DELETE]: meta(
    PERMISSIONS.TEACHER_DELETE,
    "teacher",
    "delete",
    "Xóa giảng viên",
    PERMISSION_GROUPS.TEACHERS.key,
    PERMISSION_GROUPS.TEACHERS.label,
    440
  ),
  [PERMISSIONS.TEACHER_CHANGE_STATUS]: meta(
    PERMISSIONS.TEACHER_CHANGE_STATUS,
    "teacher",
    "status",
    "Đổi trạng thái giảng viên",
    PERMISSION_GROUPS.TEACHERS.key,
    PERMISSION_GROUPS.TEACHERS.label,
    450
  ),

  // STUDENT
  [PERMISSIONS.STUDENT_READ]: meta(
    PERMISSIONS.STUDENT_READ,
    "student",
    "read",
    "Xem học viên",
    PERMISSION_GROUPS.STUDENTS.key,
    PERMISSION_GROUPS.STUDENTS.label,
    510
  ),
  [PERMISSIONS.STUDENT_CREATE]: meta(
    PERMISSIONS.STUDENT_CREATE,
    "student",
    "create",
    "Tạo học viên",
    PERMISSION_GROUPS.STUDENTS.key,
    PERMISSION_GROUPS.STUDENTS.label,
    520
  ),
  [PERMISSIONS.STUDENT_UPDATE]: meta(
    PERMISSIONS.STUDENT_UPDATE,
    "student",
    "update",
    "Cập nhật học viên",
    PERMISSION_GROUPS.STUDENTS.key,
    PERMISSION_GROUPS.STUDENTS.label,
    530
  ),
  [PERMISSIONS.STUDENT_DELETE]: meta(
    PERMISSIONS.STUDENT_DELETE,
    "student",
    "delete",
    "Xóa học viên",
    PERMISSION_GROUPS.STUDENTS.key,
    PERMISSION_GROUPS.STUDENTS.label,
    540
  ),
  [PERMISSIONS.STUDENT_CHANGE_STATUS]: meta(
    PERMISSIONS.STUDENT_CHANGE_STATUS,
    "student",
    "status",
    "Đổi trạng thái học viên",
    PERMISSION_GROUPS.STUDENTS.key,
    PERMISSION_GROUPS.STUDENTS.label,
    550
  ),

  // CLASSROOM
  [PERMISSIONS.CLASSROOM_READ]: meta(
    PERMISSIONS.CLASSROOM_READ,
    "classroom",
    "read",
    "Xem lớp học",
    PERMISSION_GROUPS.CLASSROOMS.key,
    PERMISSION_GROUPS.CLASSROOMS.label,
    560
  ),
  [PERMISSIONS.CLASSROOM_CREATE]: meta(
    PERMISSIONS.CLASSROOM_CREATE,
    "classroom",
    "create",
    "Tạo lớp học",
    PERMISSION_GROUPS.CLASSROOMS.key,
    PERMISSION_GROUPS.CLASSROOMS.label,
    570
  ),
  [PERMISSIONS.CLASSROOM_UPDATE]: meta(
    PERMISSIONS.CLASSROOM_UPDATE,
    "classroom",
    "update",
    "Cập nhật lớp học",
    PERMISSION_GROUPS.CLASSROOMS.key,
    PERMISSION_GROUPS.CLASSROOMS.label,
    580
  ),
  [PERMISSIONS.CLASSROOM_DELETE]: meta(
    PERMISSIONS.CLASSROOM_DELETE,
    "classroom",
    "delete",
    "Xóa lớp học",
    PERMISSION_GROUPS.CLASSROOMS.key,
    PERMISSION_GROUPS.CLASSROOMS.label,
    590
  ),
  [PERMISSIONS.CLASSROOM_CHANGE_STATUS]: meta(
    PERMISSIONS.CLASSROOM_CHANGE_STATUS,
    "classroom",
    "status",
    "Đổi trạng thái lớp học",
    PERMISSION_GROUPS.CLASSROOMS.key,
    PERMISSION_GROUPS.CLASSROOMS.label,
    600
  ),
  [PERMISSIONS.CLASSROOM_ASSIGN_STUDENT]: meta(
    PERMISSIONS.CLASSROOM_ASSIGN_STUDENT,
    "classroom",
    "assign_student",
    "Gán học viên vào lớp",
    PERMISSION_GROUPS.CLASSROOMS.key,
    PERMISSION_GROUPS.CLASSROOMS.label,
    610
  ),
  [PERMISSIONS.CLASSROOM_UPDATE_LEARNING]: meta(
    PERMISSIONS.CLASSROOM_UPDATE_LEARNING,
    "classroom",
    "update_learning",
    "Cập nhật điểm, tiến độ, điểm danh theo lớp",
    PERMISSION_GROUPS.CLASSROOMS.key,
    PERMISSION_GROUPS.CLASSROOMS.label,
    620
  ),
  [PERMISSIONS.CLASSROOM_UPDATE_HONOR]: meta(
    PERMISSIONS.CLASSROOM_UPDATE_HONOR,
    "classroom",
    "update_honor",
    "Bật tắt vinh danh học viên trong lớp",
    PERMISSION_GROUPS.CLASSROOMS.key,
    PERMISSION_GROUPS.CLASSROOMS.label,
    630
  ),

  // ENROLLMENT
  [PERMISSIONS.ENROLLMENT_READ]: meta(
    PERMISSIONS.ENROLLMENT_READ,
    "enrollment",
    "read",
    "Xem đăng ký khóa học",
    PERMISSION_GROUPS.ENROLLMENTS.key,
    PERMISSION_GROUPS.ENROLLMENTS.label,
    710
  ),
  [PERMISSIONS.ENROLLMENT_CREATE]: meta(
    PERMISSIONS.ENROLLMENT_CREATE,
    "enrollment",
    "create",
    "Tạo đăng ký khóa học",
    PERMISSION_GROUPS.ENROLLMENTS.key,
    PERMISSION_GROUPS.ENROLLMENTS.label,
    720
  ),
  [PERMISSIONS.ENROLLMENT_APPROVE]: meta(
    PERMISSIONS.ENROLLMENT_APPROVE,
    "enrollment",
    "approve",
    "Duyệt đăng ký khóa học",
    PERMISSION_GROUPS.ENROLLMENTS.key,
    PERMISSION_GROUPS.ENROLLMENTS.label,
    730
  ),
  [PERMISSIONS.ENROLLMENT_CANCEL]: meta(
    PERMISSIONS.ENROLLMENT_CANCEL,
    "enrollment",
    "cancel",
    "Hủy đăng ký khóa học",
    PERMISSION_GROUPS.ENROLLMENTS.key,
    PERMISSION_GROUPS.ENROLLMENTS.label,
    740
  ),
  [PERMISSIONS.ENROLLMENT_DELETE]: meta(
    PERMISSIONS.ENROLLMENT_DELETE,
    "enrollment",
    "delete",
    "Xóa đăng ký khóa học",
    PERMISSION_GROUPS.ENROLLMENTS.key,
    PERMISSION_GROUPS.ENROLLMENTS.label,
    750
  ),

  // SCHEDULE
  [PERMISSIONS.SCHEDULE_READ]: meta(
    PERMISSIONS.SCHEDULE_READ,
    "schedule",
    "read",
    "Xem lịch học",
    PERMISSION_GROUPS.SCHEDULES.key,
    PERMISSION_GROUPS.SCHEDULES.label,
    810
  ),
  [PERMISSIONS.SCHEDULE_CREATE]: meta(
    PERMISSIONS.SCHEDULE_CREATE,
    "schedule",
    "create",
    "Tạo lịch học",
    PERMISSION_GROUPS.SCHEDULES.key,
    PERMISSION_GROUPS.SCHEDULES.label,
    820
  ),
  [PERMISSIONS.SCHEDULE_UPDATE]: meta(
    PERMISSIONS.SCHEDULE_UPDATE,
    "schedule",
    "update",
    "Cập nhật lịch học",
    PERMISSION_GROUPS.SCHEDULES.key,
    PERMISSION_GROUPS.SCHEDULES.label,
    830
  ),
  [PERMISSIONS.SCHEDULE_DELETE]: meta(
    PERMISSIONS.SCHEDULE_DELETE,
    "schedule",
    "delete",
    "Xóa lịch học",
    PERMISSION_GROUPS.SCHEDULES.key,
    PERMISSION_GROUPS.SCHEDULES.label,
    840
  ),

  // NOTIFICATION
  [PERMISSIONS.NOTIFICATION_READ]: meta(
    PERMISSIONS.NOTIFICATION_READ,
    "notification",
    "read",
    "Xem thông báo hệ thống",
    PERMISSION_GROUPS.NOTIFICATIONS.key,
    PERMISSION_GROUPS.NOTIFICATIONS.label,
    845
  ),
  [PERMISSIONS.NOTIFICATION_CREATE]: meta(
    PERMISSIONS.NOTIFICATION_CREATE,
    "notification",
    "create",
    "Tạo và gửi thông báo",
    PERMISSION_GROUPS.NOTIFICATIONS.key,
    PERMISSION_GROUPS.NOTIFICATIONS.label,
    846
  ),
  [PERMISSIONS.NOTIFICATION_DELETE]: meta(
    PERMISSIONS.NOTIFICATION_DELETE,
    "notification",
    "delete",
    "Xóa thông báo",
    PERMISSION_GROUPS.NOTIFICATIONS.key,
    PERMISSION_GROUPS.NOTIFICATIONS.label,
    847
  ),

  // PAYMENT AUDIT
  [PERMISSIONS.PAYMENT_AUDIT_READ_OWN]: meta(
    PERMISSIONS.PAYMENT_AUDIT_READ_OWN,
    "payment_audit",
    "read_own",
    "Xem audit thanh toán của chính mình",
    PERMISSION_GROUPS.AUDIT.key,
    PERMISSION_GROUPS.AUDIT.label,
    850
  ),
  [PERMISSIONS.PAYMENT_AUDIT_READ_ALL]: meta(
    PERMISSIONS.PAYMENT_AUDIT_READ_ALL,
    "payment_audit",
    "read_all",
    "Xem toàn bộ audit thanh toán",
    PERMISSION_GROUPS.AUDIT.key,
    PERMISSION_GROUPS.AUDIT.label,
    860
  ),
  [PERMISSIONS.PAYMENT_AUDIT_MANAGE]: meta(
    PERMISSIONS.PAYMENT_AUDIT_MANAGE,
    "payment_audit",
    "manage",
    "Quản lý audit thanh toán",
    PERMISSION_GROUPS.AUDIT.key,
    PERMISSION_GROUPS.AUDIT.label,
    870
  ),

  // SECURITY AUDIT
  [PERMISSIONS.SECURITY_AUDIT_READ_OWN]: meta(
    PERMISSIONS.SECURITY_AUDIT_READ_OWN,
    "security_audit",
    "read_own",
    "Xem audit bảo mật của chính mình",
    PERMISSION_GROUPS.AUDIT.key,
    PERMISSION_GROUPS.AUDIT.label,
    880
  ),
  [PERMISSIONS.SECURITY_AUDIT_READ_ALL]: meta(
    PERMISSIONS.SECURITY_AUDIT_READ_ALL,
    "security_audit",
    "read_all",
    "Xem toàn bộ audit bảo mật",
    PERMISSION_GROUPS.AUDIT.key,
    PERMISSION_GROUPS.AUDIT.label,
    890
  ),
  [PERMISSIONS.SECURITY_AUDIT_MANAGE]: meta(
    PERMISSIONS.SECURITY_AUDIT_MANAGE,
    "security_audit",
    "manage",
    "Quản lý audit bảo mật",
    PERMISSION_GROUPS.AUDIT.key,
    PERMISSION_GROUPS.AUDIT.label,
    900
  ),

  // RBAC
  [PERMISSIONS.RBAC_READ]: meta(
    PERMISSIONS.RBAC_READ,
    "rbac",
    "read",
    "Xem module RBAC",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    910
  ),
  [PERMISSIONS.RBAC_MANAGE]: meta(
    PERMISSIONS.RBAC_MANAGE,
    "rbac",
    "manage",
    "Toàn quyền RBAC",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    915
  ),
  [PERMISSIONS.RBAC_CREATE_ROLE]: meta(
    PERMISSIONS.RBAC_CREATE_ROLE,
    "rbac",
    "role_create",
    "Tạo role",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    920
  ),
  [PERMISSIONS.RBAC_UPDATE_ROLE]: meta(
    PERMISSIONS.RBAC_UPDATE_ROLE,
    "rbac",
    "role_update",
    "Sửa role",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    930
  ),
  [PERMISSIONS.RBAC_DELETE_ROLE]: meta(
    PERMISSIONS.RBAC_DELETE_ROLE,
    "rbac",
    "role_delete",
    "Xóa role",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    940
  ),
  [PERMISSIONS.RBAC_READ_PERMISSION]: meta(
    PERMISSIONS.RBAC_READ_PERMISSION,
    "rbac",
    "permission_read",
    "Xem permission",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    950
  ),
  [PERMISSIONS.RBAC_SET_ROLE_PERMISSIONS]: meta(
    PERMISSIONS.RBAC_SET_ROLE_PERMISSIONS,
    "rbac",
    "set_role_permissions",
    "Gán permission cho role",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    960
  ),
  [PERMISSIONS.RBAC_SET_USER_ROLES]: meta(
    PERMISSIONS.RBAC_SET_USER_ROLES,
    "rbac",
    "set_user_roles",
    "Gán role cho user",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    970
  ),
  [PERMISSIONS.RBAC_SET_USER_OVERRIDE]: meta(
    PERMISSIONS.RBAC_SET_USER_OVERRIDE,
    "rbac",
    "set_user_override",
    "Gán override permission cho user",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    980
  ),
  [PERMISSIONS.RBAC_REMOVE_USER_OVERRIDE]: meta(
    PERMISSIONS.RBAC_REMOVE_USER_OVERRIDE,
    "rbac",
    "remove_user_override",
    "Gỡ override permission của user",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    990
  ),
  [PERMISSIONS.RBAC_SYNC_ADMIN]: meta(
    PERMISSIONS.RBAC_SYNC_ADMIN,
    "rbac",
    "sync_admin",
    "Sync quyền ADMIN",
    PERMISSION_GROUPS.SYSTEM.key,
    PERMISSION_GROUPS.SYSTEM.label,
    1000
  ),
});

const PERMISSION_META = Object.freeze({
  ...BASE_PERMISSION_META,
});

const PERMISSION_META_LIST = Object.freeze(Object.values(PERMISSION_META));

const DEFAULT_ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),

  [ROLES.MANAGER]: [
    PERMISSIONS.DASHBOARD_READ,

    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_CHANGE_STATUS,

    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CATEGORY_CHANGE_STATUS,

    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.COURSE_CHANGE_STATUS,
    PERMISSIONS.COURSE_PUBLISH,
    PERMISSIONS.COURSE_ASSIGN_TEACHER,

    PERMISSIONS.TEACHER_READ,
    PERMISSIONS.TEACHER_CREATE,
    PERMISSIONS.TEACHER_UPDATE,
    PERMISSIONS.TEACHER_CHANGE_STATUS,

    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.STUDENT_CHANGE_STATUS,

    PERMISSIONS.CLASSROOM_READ,
    PERMISSIONS.CLASSROOM_CREATE,
    PERMISSIONS.CLASSROOM_UPDATE,
    PERMISSIONS.CLASSROOM_CHANGE_STATUS,
    PERMISSIONS.CLASSROOM_ASSIGN_STUDENT,
    PERMISSIONS.CLASSROOM_UPDATE_LEARNING,
    PERMISSIONS.CLASSROOM_UPDATE_HONOR,

    PERMISSIONS.ENROLLMENT_READ,
    PERMISSIONS.ENROLLMENT_APPROVE,
    PERMISSIONS.ENROLLMENT_CANCEL,

    PERMISSIONS.SCHEDULE_READ,
    PERMISSIONS.SCHEDULE_CREATE,
    PERMISSIONS.SCHEDULE_UPDATE,

    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_CREATE,
    PERMISSIONS.NOTIFICATION_DELETE,

    PERMISSIONS.RBAC_READ,
    PERMISSIONS.RBAC_READ_PERMISSION,
  ],

  [ROLES.TEACHER]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.CLASSROOM_READ,
    PERMISSIONS.CLASSROOM_UPDATE_LEARNING,
    PERMISSIONS.CLASSROOM_UPDATE_HONOR,
    PERMISSIONS.ENROLLMENT_READ,
    PERMISSIONS.SCHEDULE_READ,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_CREATE,
    PERMISSIONS.NOTIFICATION_DELETE,
  ],

  [ROLES.STUDENT]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.ENROLLMENT_CREATE,
    PERMISSIONS.ENROLLMENT_READ,
    PERMISSIONS.SCHEDULE_READ,
  ],

  [ROLES.USER]: [PERMISSIONS.CATEGORY_READ, PERMISSIONS.COURSE_READ],
};

const BASE_ADMIN_SCREENS = Object.freeze({
  DASHBOARD: {
    key: "dashboard",
    label: "Dashboard",
    icon: "home",
    order: 0,
    routes: ["/admin/dashboard"],
    public: false,
    accessAny: [PERMISSIONS.DASHBOARD_READ],
    actions: {
      view: [PERMISSIONS.DASHBOARD_READ],
    },
  },

  USERS: {
    key: "users",
    group: PERMISSION_GROUPS.USERS.key,
    label: "Người dùng",
    icon: "users",
    order: 10,
    routes: ["/admin/users", "/admin/users/:id"],
    accessAny: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.USER_CHANGE_STATUS,
      PERMISSIONS.USER_SET_ROLES,
    ],
    actions: {
      view: [PERMISSIONS.USER_READ],
      create: [PERMISSIONS.USER_CREATE],
      update: [PERMISSIONS.USER_UPDATE],
      delete: [PERMISSIONS.USER_DELETE],
      changeStatus: [PERMISSIONS.USER_CHANGE_STATUS],
      setRoles: [PERMISSIONS.USER_SET_ROLES],
    },
  },

  CATEGORIES: {
    key: "categories",
    group: PERMISSION_GROUPS.CATEGORIES.key,
    label: "Danh mục",
    icon: "folder-kanban",
    order: 20,
    routes: ["/admin/categories", "/admin/categories/:id"],
    accessAny: [
      PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.CATEGORY_CREATE,
      PERMISSIONS.CATEGORY_UPDATE,
      PERMISSIONS.CATEGORY_DELETE,
      PERMISSIONS.CATEGORY_CHANGE_STATUS,
    ],
    actions: {
      view: [PERMISSIONS.CATEGORY_READ],
      create: [PERMISSIONS.CATEGORY_CREATE],
      update: [PERMISSIONS.CATEGORY_UPDATE],
      delete: [PERMISSIONS.CATEGORY_DELETE],
      changeStatus: [PERMISSIONS.CATEGORY_CHANGE_STATUS],
    },
  },

  COURSES: {
    key: "courses",
    group: PERMISSION_GROUPS.COURSES.key,
    label: "Khóa học",
    icon: "book-open",
    order: 30,
    routes: ["/admin/courses", "/admin/courses/:id"],
    accessAny: [
      PERMISSIONS.COURSE_READ,
      PERMISSIONS.COURSE_CREATE,
      PERMISSIONS.COURSE_UPDATE,
      PERMISSIONS.COURSE_DELETE,
      PERMISSIONS.COURSE_CHANGE_STATUS,
      PERMISSIONS.COURSE_PUBLISH,
      PERMISSIONS.COURSE_ASSIGN_TEACHER,
    ],
    actions: {
      view: [PERMISSIONS.COURSE_READ],
      create: [PERMISSIONS.COURSE_CREATE],
      update: [PERMISSIONS.COURSE_UPDATE],
      delete: [PERMISSIONS.COURSE_DELETE],
      changeStatus: [PERMISSIONS.COURSE_CHANGE_STATUS],
      publish: [PERMISSIONS.COURSE_PUBLISH],
      assignTeacher: [PERMISSIONS.COURSE_ASSIGN_TEACHER],
    },
  },

  TEACHERS: {
    key: "teachers",
    group: PERMISSION_GROUPS.TEACHERS.key,
    label: "Giảng viên",
    icon: "graduation-cap",
    order: 40,
    routes: ["/admin/teachers", "/admin/teachers/:id"],
    accessAny: [
      PERMISSIONS.TEACHER_READ,
      PERMISSIONS.TEACHER_CREATE,
      PERMISSIONS.TEACHER_UPDATE,
      PERMISSIONS.TEACHER_DELETE,
      PERMISSIONS.TEACHER_CHANGE_STATUS,
    ],
    actions: {
      view: [PERMISSIONS.TEACHER_READ],
      create: [PERMISSIONS.TEACHER_CREATE],
      update: [PERMISSIONS.TEACHER_UPDATE],
      delete: [PERMISSIONS.TEACHER_DELETE],
      changeStatus: [PERMISSIONS.TEACHER_CHANGE_STATUS],
    },
  },

  STUDENTS: {
    key: "students",
    group: PERMISSION_GROUPS.STUDENTS.key,
    label: "Học viên",
    icon: "users-round",
    order: 50,
    routes: ["/admin/students", "/admin/students/:id"],
    accessAny: [
      PERMISSIONS.STUDENT_READ,
      PERMISSIONS.STUDENT_CREATE,
      PERMISSIONS.STUDENT_UPDATE,
      PERMISSIONS.STUDENT_DELETE,
      PERMISSIONS.STUDENT_CHANGE_STATUS,
    ],
    actions: {
      view: [PERMISSIONS.STUDENT_READ],
      create: [PERMISSIONS.STUDENT_CREATE],
      update: [PERMISSIONS.STUDENT_UPDATE],
      delete: [PERMISSIONS.STUDENT_DELETE],
      changeStatus: [PERMISSIONS.STUDENT_CHANGE_STATUS],
    },
  },

  CLASSROOMS: {
    key: "classrooms",
    group: PERMISSION_GROUPS.CLASSROOMS.key,
    label: "Lớp học",
    icon: "school",
    order: 55,
    routes: ["/admin/classes", "/admin/classes/:id", "/admin/classes/:id/students"],
    accessAny: [
      PERMISSIONS.CLASSROOM_READ,
      PERMISSIONS.CLASSROOM_CREATE,
      PERMISSIONS.CLASSROOM_UPDATE,
      PERMISSIONS.CLASSROOM_DELETE,
      PERMISSIONS.CLASSROOM_CHANGE_STATUS,
      PERMISSIONS.CLASSROOM_ASSIGN_STUDENT,
      PERMISSIONS.CLASSROOM_UPDATE_LEARNING,
      PERMISSIONS.CLASSROOM_UPDATE_HONOR,
    ],
    actions: {
      view: [PERMISSIONS.CLASSROOM_READ],
      create: [PERMISSIONS.CLASSROOM_CREATE],
      update: [PERMISSIONS.CLASSROOM_UPDATE],
      delete: [PERMISSIONS.CLASSROOM_DELETE],
      changeStatus: [PERMISSIONS.CLASSROOM_CHANGE_STATUS],
      assignStudent: [PERMISSIONS.CLASSROOM_ASSIGN_STUDENT],
      updateLearning: [PERMISSIONS.CLASSROOM_UPDATE_LEARNING],
      updateHonor: [PERMISSIONS.CLASSROOM_UPDATE_HONOR],
    },
  },

  ENROLLMENTS: {
    key: "enrollments",
    group: PERMISSION_GROUPS.ENROLLMENTS.key,
    label: "Đăng ký học",
    icon: "clipboard-list",
    order: 60,
    routes: ["/admin/enrollments", "/admin/enrollments/:id"],
    accessAny: [
      PERMISSIONS.ENROLLMENT_READ,
      PERMISSIONS.ENROLLMENT_CREATE,
      PERMISSIONS.ENROLLMENT_APPROVE,
      PERMISSIONS.ENROLLMENT_CANCEL,
      PERMISSIONS.ENROLLMENT_DELETE,
    ],
    actions: {
      view: [PERMISSIONS.ENROLLMENT_READ],
      create: [PERMISSIONS.ENROLLMENT_CREATE],
      approve: [PERMISSIONS.ENROLLMENT_APPROVE],
      cancel: [PERMISSIONS.ENROLLMENT_CANCEL],
      delete: [PERMISSIONS.ENROLLMENT_DELETE],
    },
  },

  SCHEDULES: {
    key: "schedules",
    group: PERMISSION_GROUPS.SCHEDULES.key,
    label: "Lịch học",
    icon: "calendar-days",
    order: 70,
    routes: ["/admin/schedules", "/admin/schedules/:id"],
    accessAny: [
      PERMISSIONS.SCHEDULE_READ,
      PERMISSIONS.SCHEDULE_CREATE,
      PERMISSIONS.SCHEDULE_UPDATE,
      PERMISSIONS.SCHEDULE_DELETE,
    ],
    actions: {
      view: [PERMISSIONS.SCHEDULE_READ],
      create: [PERMISSIONS.SCHEDULE_CREATE],
      update: [PERMISSIONS.SCHEDULE_UPDATE],
      delete: [PERMISSIONS.SCHEDULE_DELETE],
    },
  },

  NOTIFICATIONS: {
    key: "notifications",
    group: PERMISSION_GROUPS.NOTIFICATIONS.key,
    label: "Thông báo",
    icon: "bell",
    order: 75,
    routes: ["/admin/notification"],
    accessAny: [
      PERMISSIONS.NOTIFICATION_READ,
      PERMISSIONS.NOTIFICATION_CREATE,
      PERMISSIONS.NOTIFICATION_DELETE,
    ],
    actions: {
      view: [PERMISSIONS.NOTIFICATION_READ],
      create: [PERMISSIONS.NOTIFICATION_CREATE],
      delete: [PERMISSIONS.NOTIFICATION_DELETE],
    },
  },

  PAYMENT_AUDITS: {
    key: "payment-audits",
    group: PERMISSION_GROUPS.AUDIT.key,
    label: "Audit thanh toán",
    icon: "receipt-text",
    order: 80,
    routes: ["/admin/payment-audits", "/admin/payment-audits/:paymentCode"],
    accessAny: [
      PERMISSIONS.PAYMENT_AUDIT_READ_ALL,
      PERMISSIONS.PAYMENT_AUDIT_MANAGE,
    ],
    actions: {
      view: [PERMISSIONS.PAYMENT_AUDIT_READ_ALL],
      manage: [PERMISSIONS.PAYMENT_AUDIT_MANAGE],
    },
  },

  SECURITY_AUDITS: {
    key: "security-audits",
    group: PERMISSION_GROUPS.AUDIT.key,
    label: "Audit bảo mật",
    icon: "shield-alert",
    order: 85,
    routes: ["/admin/security-audits"],
    accessAny: [
      PERMISSIONS.SECURITY_AUDIT_READ_ALL,
      PERMISSIONS.SECURITY_AUDIT_MANAGE,
    ],
    actions: {
      view: [PERMISSIONS.SECURITY_AUDIT_READ_ALL],
      manage: [PERMISSIONS.SECURITY_AUDIT_MANAGE],
    },
  },

  RBAC: {
    key: "rbac",
    group: PERMISSION_GROUPS.SYSTEM.key,
    label: "Phân quyền",
    icon: "shield",
    order: 90,
    routes: [
      "/admin/rbac",
      "/admin/rbac/roles",
      "/admin/rbac/permissions",
      "/admin/rbac/user-roles",
      "/admin/rbac/role-permissions",
    ],
    accessAny: [
      PERMISSIONS.RBAC_READ,
      PERMISSIONS.RBAC_MANAGE,
      PERMISSIONS.RBAC_CREATE_ROLE,
      PERMISSIONS.RBAC_UPDATE_ROLE,
      PERMISSIONS.RBAC_DELETE_ROLE,
      PERMISSIONS.RBAC_READ_PERMISSION,
      PERMISSIONS.RBAC_SET_ROLE_PERMISSIONS,
      PERMISSIONS.RBAC_SET_USER_ROLES,
      PERMISSIONS.RBAC_SET_USER_OVERRIDE,
      PERMISSIONS.RBAC_REMOVE_USER_OVERRIDE,
      PERMISSIONS.RBAC_SYNC_ADMIN,
    ],
    actions: {
      view: [PERMISSIONS.RBAC_READ],
      manage: [PERMISSIONS.RBAC_MANAGE],
      createRole: [PERMISSIONS.RBAC_CREATE_ROLE],
      updateRole: [PERMISSIONS.RBAC_UPDATE_ROLE],
      deleteRole: [PERMISSIONS.RBAC_DELETE_ROLE],
      readPermissions: [PERMISSIONS.RBAC_READ_PERMISSION],
      setRolePermissions: [PERMISSIONS.RBAC_SET_ROLE_PERMISSIONS],
      setUserRoles: [PERMISSIONS.RBAC_SET_USER_ROLES],
      setUserOverride: [PERMISSIONS.RBAC_SET_USER_OVERRIDE],
      removeUserOverride: [PERMISSIONS.RBAC_REMOVE_USER_OVERRIDE],
      syncAdmin: [PERMISSIONS.RBAC_SYNC_ADMIN],
    },
  },
});

const ADMIN_SCREENS = Object.freeze({
  ...BASE_ADMIN_SCREENS,
});

export {
  PERMISSION_GROUPS,
  PERMISSION_META,
  PERMISSION_META_LIST,
  DEFAULT_ROLE_PERMISSIONS,
  ADMIN_SCREENS,
};
