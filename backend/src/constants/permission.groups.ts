export const PERMISSION_GROUPS = Object.freeze({
  DASHBOARD: { key: "DASHBOARD", label: "Tổng quan", icon: "home", order: 5 },
  USERS: { key: "USERS", label: "Người dùng", icon: "users", order: 10 },
  CATEGORIES: { key: "CATEGORIES", label: "Danh mục", icon: "folder", order: 20 },
  COURSES: { key: "COURSES", label: "Khóa học", icon: "book-open", order: 30 },
  TEACHERS: { key: "TEACHERS", label: "Giảng viên", icon: "graduation-cap", order: 40 },
  STUDENTS: { key: "STUDENTS", label: "Học viên", icon: "user-check", order: 50 },
  CLASSROOMS: { key: "CLASSROOMS", label: "Lớp học", icon: "school", order: 55 },
  ENROLLMENTS: { key: "ENROLLMENTS", label: "Đăng ký học", icon: "clipboard-list", order: 60 },
  SCHEDULES: { key: "SCHEDULES", label: "Lịch học", icon: "calendar-days", order: 70 },
  AUDIT: { key: "AUDIT", label: "Audit", icon: "clipboard-check", order: 80 },
  SYSTEM: { key: "SYSTEM", label: "Hệ thống", icon: "shield", order: 99 },
});