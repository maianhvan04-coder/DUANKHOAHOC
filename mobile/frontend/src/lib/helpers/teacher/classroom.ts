import type {
  ClassroomItem,
  ClassroomStudentStudyItem,
} from "@/app/api/classroom.api";

export function getCourseTitle(item: ClassroomItem | ClassroomStudentStudyItem) {
  if (item.course && typeof item.course === "object") {
    return item.course.title || "Khóa học";
  }

  return "Khóa học";
}

export function getTeacherName(item: ClassroomItem | ClassroomStudentStudyItem) {
  if (item.teacher && typeof item.teacher === "object") {
    return (
      item.teacher.name ||
      item.teacher.user?.name ||
      item.teacher.email ||
      item.teacher.user?.email ||
      "Giáo viên"
    );
  }

  return "Giáo viên";
}

export function getStudentName(item: ClassroomStudentStudyItem) {
  if (item.student && typeof item.student === "object") {
    return item.student.name || item.student.email || "Học viên";
  }

  return "Học viên";
}

export function getStudentEmail(item: ClassroomStudentStudyItem) {
  if (item.student && typeof item.student === "object") {
    return item.student.email || "";
  }

  return "";
}

export function getClassStatusLabel(item: ClassroomItem) {
  return item.isActive ? "Đang mở" : "Tạm khóa";
}

export function getClassStatusClass(item: ClassroomItem) {
  return item.isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-600";
}

export function getModeLabel(mode?: string) {
  if (mode === "ONLINE") return "Online";
  if (mode === "OFFLINE") return "Offline";
  return "--";
}

export function formatDate(value?: string | null) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
        };
      };
      message?: unknown;
    };

    const responseMessage = maybe.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }

    const responseError = maybe.response?.data?.error;
    if (typeof responseError === "string" && responseError.trim()) {
      return responseError;
    }

    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }

  return fallback;
}
