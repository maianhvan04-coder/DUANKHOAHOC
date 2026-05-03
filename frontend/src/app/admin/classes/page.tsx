"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  School,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  classroomApi,
  type AttendanceStatus,
  type ClassMode,
  type ClassroomItem,
  type ClassroomSessionItem,
  type ClassroomStudentStudyItem,
  type CourseOption,
  type CreateClassroomPayload,
  type HomeworkStatus,
  type StudyStatus,
  type TeacherOption,
  type UpdateClassroomPayload,
  type UpdateStudentHonorPayload,
  type UpdateStudentSessionPayload,
  type UpdateStudentTestsPayload,
} from "@/app/api/classroom.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import {
  makePaginationMeta,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/utils/admin-list";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";

  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTodayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function toIsoFromDateInput(value: string) {
  if (!value) return new Date().toISOString();
  return new Date(`${value}T12:00:00`).toISOString();
}

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return e?.response?.data?.message || e?.message || fallback;
}

function clampNumber(value: string, min: number, max: number) {
  if (value.trim() === "") return String(min);

  const num = Number(value);
  if (!Number.isFinite(num)) return String(min);
  return String(Math.max(min, Math.min(max, num)));
}

function getCourseTitle(item: ClassroomItem | ClassroomStudentStudyItem) {
  if (item.course && typeof item.course === "object") {
    return item.course.title || "Khóa học";
  }

  return "Khóa học";
}

function getTeacherName(item: ClassroomItem | ClassroomStudentStudyItem) {
  if (item.teacher && typeof item.teacher === "object") {
    return item.teacher.user?.name || "";
  }

  return "";
}

function getStudentName(item: ClassroomStudentStudyItem) {
  if (item.student && typeof item.student === "object") {
    return item.student.name || "Học viên";
  }

  return "Học viên";
}

function getStudentEmail(item: ClassroomStudentStudyItem) {
  if (item.student && typeof item.student === "object") {
    return item.student.email || "";
  }

  return "";
}

function getClassStatusLabel(item: ClassroomItem, viewMode: ViewMode) {
  if (viewMode === "deleted" || item.isDeleted) return "ĐÃ XÓA";
  return item.isActive ? "ACTIVE" : "TẠM TẮT";
}

function getClassStatusStyle(item: ClassroomItem, viewMode: ViewMode) {
  if (viewMode === "deleted" || item.isDeleted) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return item.isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-600";
}

function getAttendanceLabel(value?: AttendanceStatus | string) {
  switch (value) {
    case "PRESENT":
      return "Có mặt";
    case "LATE":
      return "Muộn";
    case "ABSENT":
      return "Vắng";
    default:
      return "--";
  }
}

function getHomeworkLabel(value?: HomeworkStatus | string) {
  switch (value) {
    case "DONE":
      return "Đã làm";
    case "MISSING":
      return "Chưa làm";
    default:
      return "--";
  }
}

function getAttendanceStyle(value?: AttendanceStatus | string) {
  switch (value) {
    case "PRESENT":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "LATE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ABSENT":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

function getHomeworkStyle(value?: HomeworkStatus | string) {
  switch (value) {
    case "DONE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "MISSING":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

function getSessionByNo(
  item: ClassroomStudentStudyItem,
  sessionNo: number
): ClassroomSessionItem {
  if (Array.isArray(item.sessions)) {
    const found = item.sessions.find(
      (session) => Number(session.sessionNo || 0) === Number(sessionNo)
    );

    if (found) return found;
  }

  return {
    sessionNo,
    date: null,
    attendanceStatus: "ABSENT",
    homeworkStatus: "MISSING",
    progressScore: 0,
    teacherNote: "",
  };
}

function ProgressBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[15px] font-semibold text-slate-800">
          {label}
        </span>

        <span className="text-[16px] font-bold leading-none text-slate-950">
          {safeValue}%
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function SessionStatusSelect({
  value,
  type,
  disabled,
  onChange,
}: {
  value?: AttendanceStatus | HomeworkStatus;
  type: "attendance" | "homework";
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const isAttendance = type === "attendance";
  const label = isAttendance
    ? getAttendanceLabel(value as AttendanceStatus | undefined)
    : getHomeworkLabel(value as HomeworkStatus | undefined);

  const style = isAttendance
    ? getAttendanceStyle(value as AttendanceStatus | undefined)
    : getHomeworkStyle(value as HomeworkStatus | undefined);

  return (
    <div className="relative inline-flex">
      <select
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 min-w-[132px] appearance-none rounded-full border px-4 pr-10 text-center text-sm font-semibold outline-none transition",
          style,
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        )}
      >
        <option value="" disabled>
          {label}
        </option>

        {isAttendance ? (
          <>
            <option value="PRESENT">Có mặt</option>
            <option value="LATE">Muộn</option>
            <option value="ABSENT">Vắng</option>
          </>
        ) : (
          <>
            <option value="DONE">Đã làm</option>
            <option value="MISSING">Chưa làm</option>
          </>
        )}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-current opacity-70" />
    </div>
  );
}

type ViewMode = "active" | "deleted";
type FormMode = "create" | "edit";
type StatusFilter = "all" | "active" | "inactive" | "deleted";
type StudentFilter = "all" | StudyStatus;
type ClassSortKey =
  | "className"
  | "course"
  | "teacher"
  | "schedule"
  | "room"
  | "status"
  | "createdAt";

type ClassFormState = {
  course: string;
  teacher: string;
  className: string;
  mode: ClassMode;
  scheduleText: string;
  room: string;
  startedAt: string;
  endedAt: string;
  maxStudents: string;
  isActive: boolean;
};

type StudentEditFormState = {
  status: StudyStatus;
  isHonored: boolean;
  honorTitle: string;
  showHonorOnUserPage: boolean;
};

const INITIAL_CLASS_FORM: ClassFormState = {
  course: "",
  teacher: "",
  className: "",
  mode: "ONLINE",
  scheduleText: "",
  room: "",
  startedAt: "",
  endedAt: "",
  maxStudents: "0",
  isActive: true,
};

const STUDY_STATUS_OPTIONS: Array<{ value: StudyStatus; label: string }> = [
  { value: "ENROLLED", label: "Đã ghi danh" },
  { value: "STUDYING", label: "Đang học" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "DROPPED", label: "Đã nghỉ" },
];

const EMPTY_STUDENT_STUDY_ITEM: ClassroomStudentStudyItem = {
  _id: "",
  student: null,
  course: null,
  classRoom: null,
  teacher: null,

  className: "",
  mode: "ONLINE",
  scheduleText: "",
  room: "",

  status: "ENROLLED",
  completionStatus: "NOT_COMPLETED",
  completedAt: null,

  score: 0,
  progressPercent: 0,
  attendancePercent: 0,

  test1: 0,
  test2: 0,
  test3: 0,
  finalAverage: 0,
  academicLevel: "AVERAGE",

  sessions: [],

  rank: null,
  performanceStatus: "NORMAL",
  isHonored: false,
  honorTitle: "",
  showHonorOnUserPage: false,

  startedAt: null,
  endedAt: null,
  note: "",
  isActive: true,

  createdAt: "",
  updatedAt: "",
};

function getInitialClassForm(
  mode: FormMode,
  initialData: ClassroomItem | null
): ClassFormState {
  if (mode === "edit" && initialData) {
    return {
      course:
        initialData.course && typeof initialData.course === "object"
          ? initialData.course._id
          : "",
      teacher:
        initialData.teacher && typeof initialData.teacher === "object"
          ? initialData.teacher._id
          : "",
      className: initialData.className || "",
      mode: initialData.mode || "ONLINE",
      scheduleText: initialData.scheduleText || "",
      room: initialData.room || "",
      startedAt: initialData.startedAt ? initialData.startedAt.slice(0, 10) : "",
      endedAt: initialData.endedAt ? initialData.endedAt.slice(0, 10) : "",
      maxStudents: String(initialData.maxStudents ?? 0),
      isActive: initialData.isActive ?? true,
    };
  }

  return INITIAL_CLASS_FORM;
}

function getInitialStudentEditForm(
  item: ClassroomStudentStudyItem
): StudentEditFormState {
  return {
    status: item.status || "ENROLLED",
    isHonored: Boolean(item.isHonored),
    honorTitle: item.honorTitle || "Học viên xuất sắc",
    showHonorOnUserPage: Boolean(item.showHonorOnUserPage),
  };
}

function ClassroomModal({
  open,
  mode,
  value,
  saving,
  courses,
  teachers,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  mode: FormMode;
  value: ClassFormState;
  saving: boolean;
  courses: CourseOption[];
  teachers: TeacherOption[];
  onClose: () => void;
  onChange: (patch: Partial<ClassFormState>) => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/40 p-3 md:p-5">
      <div className="flex h-full items-center justify-center">
        <div className="flex h-[92vh] w-full max-w-[860px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-5">
            <div className="pr-3">
              <h2 className="text-[18px] font-bold text-slate-900">
                {mode === "create" ? "Thêm lớp học" : "Cập nhật lớp học"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Tạo lớp mới, gán khóa học, giảng viên và lịch học.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Khóa học
                </label>
                <select
                  value={value.course}
                  onChange={(e) => onChange({ course: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                >
                  <option value="">Chọn khóa học</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Giảng viên
                </label>
                <select
                  value={value.teacher}
                  onChange={(e) => onChange({ teacher: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                >
                  <option value="">Chọn giảng viên</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.user?.name || "Giảng viên"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Tên lớp
                </label>
                <input
                  value={value.className}
                  onChange={(e) => onChange({ className: e.target.value })}
                  placeholder="Ví dụ: KH Backend NestJS tháng 3"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Hình thức
                </label>
                <select
                  value={value.mode}
                  onChange={(e) =>
                    onChange({ mode: e.target.value as ClassMode })
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Lịch học
                </label>
                <input
                  value={value.scheduleText}
                  onChange={(e) => onChange({ scheduleText: e.target.value })}
                  placeholder="T2 - T4 - T6 | 18:30 - 20:00"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Phòng học / Link học
                </label>
                <input
                  value={value.room}
                  onChange={(e) => onChange({ room: e.target.value })}
                  placeholder="Phòng 203 / Google Meet"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={value.startedAt}
                  onChange={(e) => onChange({ startedAt: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={value.endedAt}
                  onChange={(e) => onChange({ endedAt: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Số lượng tối đa
                </label>
                <input
                  type="number"
                  min={0}
                  value={value.maxStudents}
                  onChange={(e) => onChange({ maxStudents: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={value.isActive}
                  onChange={(e) => onChange({ isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Kích hoạt sau khi lưu
              </label>
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-4 md:px-5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onSubmit}
              className="inline-flex h-10 items-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tạo lớp học"
                  : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentEditModal({
  open,
  item,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  item: ClassroomStudentStudyItem | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: StudentEditFormState) => Promise<void>;
}) {
  const initialForm = getInitialStudentEditForm(
    item ?? EMPTY_STUDENT_STUDY_ITEM
  );
  const [form, setForm] = useState<StudentEditFormState>(initialForm);

  if (!open || !item) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-[140] bg-slate-950/45 p-3 md:p-5">
      <div className="flex h-full items-center justify-center">
        <div className="flex h-[88vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-5">
            <div className="pr-3">
              <h2 className="text-[18px] font-bold text-slate-900">
                Cập nhật học viên
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {getStudentName(item)} ·{" "}
                {getTeacherName(item) || "Chưa có giảng viên"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5"
          >
            <div className="grid gap-3 xl:grid-cols-4">
              <ProgressBar label="Chuyên cần" value={item.attendancePercent} />
              <ProgressBar label="Tiến độ" value={item.progressPercent} />

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[15px] font-semibold text-slate-800">
                  Điểm quy đổi
                </div>

                <div className="mt-3 text-[28px] font-bold leading-none text-slate-950">
                  {Number(item.score || 0).toFixed(1)}
                </div>

                <div className="mt-2 text-sm text-slate-500">Thang 100</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[15px] font-semibold text-slate-800">
                  Điểm tổng kết
                </div>

                <div className="mt-3 text-[28px] font-bold leading-none text-slate-950">
                  {Number(item.finalAverage || 0).toFixed(1)}
                </div>

                <div className="mt-2 text-sm text-slate-500">Thang 10</div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 text-[15px] font-semibold text-slate-800">
                  Trạng thái học
                </div>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as StudyStatus,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
                >
                  {STUDY_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 text-[15px] font-semibold text-slate-800">
                  Vinh danh học viên
                </div>

                <div className="space-y-3">
                  <input
                    value={form.honorTitle}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        honorTitle: e.target.value,
                      }))
                    }
                    placeholder="Học viên xuất sắc"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
                  />

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isHonored}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isHonored: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Đánh dấu học viên xuất sắc
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.showHonorOnUserPage}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          showHonorOnUserPage: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Hiển thị bên người dùng
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[15px] font-semibold text-slate-800">
                  Điểm kiểm tra
                </div>
                <div className="text-xs text-slate-500">Chỉ xem</div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 px-3 py-3">
                  <div className="text-sm font-semibold text-slate-700">
                    Bài KT 1
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">
                    {Number(item.test1 || 0).toFixed(1)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 px-3 py-3">
                  <div className="text-sm font-semibold text-slate-700">
                    Bài KT 2
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">
                    {Number(item.test2 || 0).toFixed(1)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 px-3 py-3">
                  <div className="text-sm font-semibold text-slate-700">
                    Bài KT 3
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">
                    {Number(item.test3 || 0).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-[15px] font-semibold text-slate-800">
                Danh sách 30 buổi học
              </div>

              <div className="space-y-2">
                {Array.from({ length: 30 }, (_, index) => index + 1).map(
                  (sessionNo) => {
                    const session = getSessionByNo(item, sessionNo);

                    return (
                      <div
                        key={`${item._id}-${sessionNo}`}
                        className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 md:grid-cols-[80px_130px_140px_160px_1fr]"
                      >
                        <div className="font-semibold">Buổi {sessionNo}</div>
                        <div>{formatDate(session.date)}</div>
                        <div>{getAttendanceLabel(session.attendanceStatus)}</div>
                        <div>{getHomeworkLabel(session.homeworkStatus)}</div>
                        <div>{session.teacherNote || "--"}</div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </form>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3 md:px-5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void onSubmit(form)}
              className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu cập nhật"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function StudentsModal({
  open,
  classRoom,
  onClose,
}: {
  open: boolean;
  classRoom: ClassroomItem | null;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ClassroomStudentStudyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentFilter>("all");
  const [editingItem, setEditingItem] =
    useState<ClassroomStudentStudyItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingSessionKey, setSavingSessionKey] = useState<string | null>(null);
  const [savingTestsKey, setSavingTestsKey] = useState<string | null>(null);

  const [selectedSessionNo, setSelectedSessionNo] = useState(1);
  const [selectedSessionDate, setSelectedSessionDate] = useState(
    getTodayInputValue()
  );

  const [testDrafts, setTestDrafts] = useState<
    Record<
      string,
      {
        test1: string;
        test2: string;
        test3: string;
      }
    >
  >({});

  const classRoomId = classRoom?._id ?? "";

  async function fetchStudents() {
    if (!classRoomId) return;

    try {
      setLoading(true);
      const data = await classroomApi.listStudents(classRoomId);
      setItems(data);

      const drafts: Record<
        string,
        {
          test1: string;
          test2: string;
          test3: string;
        }
      > = {};

      for (const item of data) {
        drafts[item._id] = {
          test1: String(item.test1 ?? 0),
          test2: String(item.test2 ?? 0),
          test3: String(item.test3 ?? 0),
        };
      }

      setTestDrafts(drafts);

      const firstHasDate = data
        .map((item) => getSessionByNo(item, selectedSessionNo))
        .find((session) => Boolean(session.date));

      if (firstHasDate?.date) {
        setSelectedSessionDate(toDateInputValue(firstHasDate.date));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Không tải được học viên trong lớp"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !classRoomId) return;

    void fetchStudents();
  }, [open, classRoomId]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const currentSession = getSessionByNo(item, selectedSessionNo);

      const matchKeyword =
        !keyword ||
        [
          getStudentName(item),
          getStudentEmail(item),
          getTeacherName(item),
          currentSession.teacherNote,
          item.honorTitle,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchStatus =
        statusFilter === "all" ? true : item.status === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [items, search, statusFilter, selectedSessionNo]);

  if (!open || !classRoom) return null;

  function handleSessionNoChange(nextSessionNo: number) {
    setSelectedSessionNo(nextSessionNo);

    const firstHasDate = items
      .map((item) => getSessionByNo(item, nextSessionNo))
      .find((session) => Boolean(session.date));

    if (firstHasDate?.date) {
      setSelectedSessionDate(toDateInputValue(firstHasDate.date));
      return;
    }

    setSelectedSessionDate(getTodayInputValue());
  }

  async function handleDelete(item: ClassroomStudentStudyItem) {
    const ok = window.confirm(`Xóa học viên "${getStudentName(item)}" khỏi lớp?`);
    if (!ok) return;

    try {
      await classroomApi.removeStudentStudy(item._id);
      toast.success("Đã xóa học viên khỏi lớp");
      await fetchStudents();
    } catch (error) {
      toast.error(getErrorMessage(error, "Xóa học viên thất bại"));
    }
  }

  async function handleSaveEdit(values: StudentEditFormState) {
    if (!editingItem) return;

    try {
      setSavingEdit(true);

      await classroomApi.updateStudentLearning(editingItem._id, {
        status: values.status,
      });

      const honorPayload: UpdateStudentHonorPayload = {
        isHonored: values.isHonored,
        honorTitle: values.honorTitle.trim(),
        showHonorOnUserPage: values.showHonorOnUserPage,
      };

      await classroomApi.updateStudentHonor(editingItem._id, honorPayload);

      toast.success("Đã cập nhật học viên");
      await fetchStudents();
      setEditingItem(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Cập nhật học viên thất bại"));
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleQuickSessionChange(
    item: ClassroomStudentStudyItem,
    field: "attendanceStatus" | "homeworkStatus",
    value: string
  ) {
    if (!value) return;

    const session = getSessionByNo(item, selectedSessionNo);
    const savingKey = `${item._id}-${field}`;

    try {
      setSavingSessionKey(savingKey);

      const payload: UpdateStudentSessionPayload = {
        sessionNo: selectedSessionNo,
        date: toIsoFromDateInput(selectedSessionDate),
        attendanceStatus:
          field === "attendanceStatus"
            ? (value as AttendanceStatus)
            : (session.attendanceStatus ?? "ABSENT"),
        homeworkStatus:
          field === "homeworkStatus"
            ? (value as HomeworkStatus)
            : (session.homeworkStatus ?? "MISSING"),
        progressScore: Number(session.progressScore || 0),
        teacherNote: session.teacherNote || "",
      };

      await classroomApi.updateStudentSession(item._id, payload);
      await fetchStudents();
      toast.success(`Đã cập nhật buổi ${selectedSessionNo}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Cập nhật trạng thái thất bại"));
    } finally {
      setSavingSessionKey(null);
    }
  }

  function handleTestDraftChange(
    itemId: string,
    field: "test1" | "test2" | "test3",
    value: string
  ) {
    setTestDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ?? { test1: "0", test2: "0", test3: "0" }),
        [field]: clampNumber(value, 0, 10),
      },
    }));
  }

  async function handleSaveTests(item: ClassroomStudentStudyItem) {
    const draft = testDrafts[item._id];
    if (!draft) return;

    try {
      setSavingTestsKey(item._id);

      const payload: UpdateStudentTestsPayload = {
        test1: Number(clampNumber(draft.test1, 0, 10)),
        test2: Number(clampNumber(draft.test2, 0, 10)),
        test3: Number(clampNumber(draft.test3, 0, 10)),
      };

      await classroomApi.updateStudentTests(item._id, payload);
      await fetchStudents();
      toast.success("Đã lưu điểm kiểm tra");
    } catch (error) {
      toast.error(getErrorMessage(error, "Lưu điểm kiểm tra thất bại"));
    } finally {
      setSavingTestsKey(null);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[130] bg-slate-950/45 p-3 md:p-5">
        <div className="flex h-full items-center justify-center">
          <div className="flex h-[94vh] w-full max-w-[1760px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 md:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-[22px] font-bold text-slate-900">
                    Quản lý điểm danh học viên
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {classRoom.className} · {getCourseTitle(classRoom)} ·{" "}
                    {getTeacherName(classRoom) || "Chưa có giảng viên"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_160px_180px_120px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm học viên, giáo viên, nhận xét..."
                    className="h-11 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as StudentFilter)
                    }
                    className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 pr-10 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    {STUDY_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>

                <div className="relative">
                  <select
                    value={selectedSessionNo}
                    onChange={(e) =>
                      handleSessionNoChange(Number(e.target.value))
                    }
                    className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 pr-10 text-sm outline-none focus:border-emerald-500"
                  >
                    {Array.from({ length: 30 }, (_, index) => index + 1).map(
                      (sessionNo) => (
                        <option key={sessionNo} value={sessionNo}>
                          Buổi {sessionNo}
                        </option>
                      )
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>

                <input
                  type="date"
                  value={selectedSessionDate}
                  onChange={(e) => setSelectedSessionDate(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500"
                />

                <button
                  type="button"
                  onClick={() => void fetchStudents()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 md:px-5">
              {loading ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                  Đang tải danh sách học viên...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-sm text-slate-500">
                    Chưa có học viên nào phù hợp trong lớp này.
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="min-w-[1820px]">
                    <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_120px_120px_120px_260px] items-center gap-x-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      <div>Họ tên</div>
                      <div>Giáo viên</div>
                      <div>Điểm danh</div>
                      <div>BTVN</div>
                      <div>Ngày</div>
                      <div>Bài KT 1</div>
                      <div>Bài KT 2</div>
                      <div>Bài KT 3</div>
                      <div>Action</div>
                    </div>

                    {filteredItems.map((item) => {
                      const currentSession = getSessionByNo(item, selectedSessionNo);
                      const currentDraft = testDrafts[item._id] ?? {
                        test1: String(item.test1 ?? 0),
                        test2: String(item.test2 ?? 0),
                        test3: String(item.test3 ?? 0),
                      };

                      return (
                        <div
                          key={item._id}
                          className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_120px_120px_120px_260px] items-center gap-x-4 border-b border-slate-200 px-6 py-4 text-sm last:border-b-0"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">
                              {getStudentName(item)}
                            </div>
                            <div className="truncate text-slate-500">
                              {getStudentEmail(item) || "--"}
                            </div>
                          </div>

                          <div className="truncate text-slate-700">
                            {getTeacherName(item) || "--"}
                          </div>

                          <div>
                            <SessionStatusSelect
                              type="attendance"
                              value={currentSession.attendanceStatus}
                              disabled={
                                savingSessionKey === `${item._id}-attendanceStatus`
                              }
                              onChange={(value) =>
                                void handleQuickSessionChange(
                                  item,
                                  "attendanceStatus",
                                  value
                                )
                              }
                            />
                          </div>

                          <div>
                            <SessionStatusSelect
                              type="homework"
                              value={currentSession.homeworkStatus}
                              disabled={
                                savingSessionKey === `${item._id}-homeworkStatus`
                              }
                              onChange={(value) =>
                                void handleQuickSessionChange(
                                  item,
                                  "homeworkStatus",
                                  value
                                )
                              }
                            />
                          </div>

                          <div className="text-slate-700">
                            {formatDate(
                              selectedSessionDate
                                ? toIsoFromDateInput(selectedSessionDate)
                                : currentSession.date || item.updatedAt
                            )}
                          </div>

                          <div>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step="0.1"
                              value={currentDraft.test1}
                              disabled={savingTestsKey === item._id}
                              onChange={(e) =>
                                handleTestDraftChange(
                                  item._id,
                                  "test1",
                                  e.target.value
                                )
                              }
                              onBlur={() => void handleSaveTests(item)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void handleSaveTests(item);
                                }
                              }}
                              className="h-10 w-full min-w-[110px] rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step="0.1"
                              value={currentDraft.test2}
                              disabled={savingTestsKey === item._id}
                              onChange={(e) =>
                                handleTestDraftChange(
                                  item._id,
                                  "test2",
                                  e.target.value
                                )
                              }
                              onBlur={() => void handleSaveTests(item)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void handleSaveTests(item);
                                }
                              }}
                              className="h-10 w-full min-w-[110px] rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step="0.1"
                              value={currentDraft.test3}
                              disabled={savingTestsKey === item._id}
                              onChange={(e) =>
                                handleTestDraftChange(
                                  item._id,
                                  "test3",
                                  e.target.value
                                )
                              }
                              onBlur={() => void handleSaveTests(item)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void handleSaveTests(item);
                                }
                              }}
                              className="h-10 w-full min-w-[110px] rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="flex items-center gap-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDelete(item)}
                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <StudentEditModal
        key={editingItem?._id ?? "student-edit"}
        open={Boolean(editingItem)}
        item={editingItem}
        saving={savingEdit}
        onClose={() => setEditingItem(null)}
        onSubmit={handleSaveEdit}
      />
    </>
  );
}

export default function AdminClassesPage() {
  const [items, setItems] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<ClassSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [serverPagination, setServerPagination] = useState<PaginationMeta>(
    makePaginationMeta(0, 1, 5)
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<ClassroomItem | null>(null);
  const [form, setForm] = useState<ClassFormState>(INITIAL_CLASS_FORM);

  const [studentsModalClass, setStudentsModalClass] =
    useState<ClassroomItem | null>(null);

  async function fetchClassrooms() {
    try {
      setLoading(true);

      const [classrooms, courseOptions, teacherOptions] = await Promise.all([
        viewMode === "active"
          ? classroomApi.listPaged({
              q: search,
              status: statusFilter,
              sortBy: sortKey,
              sortOrder: sortDirection,
              page,
              limit: rowsPerPage,
            })
          : classroomApi.listDeletedPaged({
              q: search,
              status: statusFilter,
              sortBy: sortKey,
              sortOrder: sortDirection,
              page,
              limit: rowsPerPage,
            }),
        classroomApi.listCourseOptions(),
        classroomApi.listTeacherOptions(),
      ]);

      setItems(classrooms.items);
      setServerPagination(classrooms.pagination);
      setCourses(courseOptions);
      setTeachers(teacherOptions);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không tải được dữ liệu lớp học"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchClassrooms();
  }, [page, rowsPerPage, search, sortDirection, sortKey, statusFilter, viewMode]);

  const pagedItems = items;
  const totalPages = serverPagination.totalPages;
  const currentPage = serverPagination.page;
  const from =
    serverPagination.total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const to = Math.min(currentPage * rowsPerPage, serverPagination.total);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function resetForm() {
    setForm(INITIAL_CLASS_FORM);
    setEditingItem(null);
    setFormMode("create");
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(item: ClassroomItem) {
    setFormMode("edit");
    setEditingItem(item);
    setForm(getInitialClassForm("edit", item));
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!form.course) {
      toast.warning("Vui lòng chọn khóa học");
      return;
    }

    if (!form.teacher) {
      toast.warning("Vui lòng chọn giảng viên");
      return;
    }

    if (!form.className.trim()) {
      toast.warning("Vui lòng nhập tên lớp");
      return;
    }

    try {
      setSaving(true);

      if (formMode === "create") {
        const body: CreateClassroomPayload = {
          course: form.course,
          teacher: form.teacher,
          className: form.className.trim(),
          mode: form.mode,
          scheduleText: form.scheduleText.trim(),
          room: form.room.trim(),
          startedAt: form.startedAt || undefined,
          endedAt: form.endedAt || undefined,
          maxStudents: form.maxStudents,
          isActive: form.isActive,
        };

        const created = await classroomApi.create(body);

        if (viewMode === "active") {
          setItems((prev) => [created, ...prev]);
        }

        toast.success("Tạo lớp học thành công");
      } else if (editingItem) {
        const body: UpdateClassroomPayload = {
          course: form.course,
          teacher: form.teacher,
          className: form.className.trim(),
          mode: form.mode,
          scheduleText: form.scheduleText.trim(),
          room: form.room.trim(),
          startedAt: form.startedAt || undefined,
          endedAt: form.endedAt || undefined,
          maxStudents: form.maxStudents,
          isActive: form.isActive,
        };

        const updated = await classroomApi.update(editingItem._id, body);

        setItems((prev) =>
          prev.map((item) => (item._id === editingItem._id ? updated : item))
        );

        toast.success("Cập nhật lớp học thành công");
      }

      setModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Lưu lớp học thất bại"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSoftDelete(item: ClassroomItem) {
    if (!window.confirm(`Xóa mềm lớp "${item.className}"?`)) return;

    try {
      await classroomApi.softDelete(item._id);
      setItems((prev) => prev.filter((x) => x._id !== item._id));
      toast.success("Xóa mềm thành công");
    } catch (error) {
      toast.error(getErrorMessage(error, "Xóa mềm thất bại"));
    }
  }

  async function handleRestore(item: ClassroomItem) {
    try {
      await classroomApi.restore(item._id);
      setItems((prev) => prev.filter((x) => x._id !== item._id));
      toast.success("Khôi phục thành công");
    } catch (error) {
      toast.error(getErrorMessage(error, "Khôi phục thất bại"));
    }
  }

  async function handleHardDelete(item: ClassroomItem) {
    if (!window.confirm(`Xóa cứng "${item.className}"?`)) return;

    try {
      await classroomApi.forceDelete(item._id);
      setItems((prev) => prev.filter((x) => x._id !== item._id));
      toast.success("Xóa cứng thành công");
    } catch (error) {
      toast.error(getErrorMessage(error, "Xóa cứng thất bại"));
    }
  }

  const activeFilterCount = statusFilter !== "all" ? 1 : 0;

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "status",
        title: "Trạng thái",
        options: [
          {
            id: "status-all",
            label: "Tất cả trạng thái",
            checked: statusFilter === "all",
            onToggle: () => {
              setStatusFilter("all");
              setPage(1);
            },
          },
          {
            id: "status-active",
            label: "Đang hoạt động",
            checked: statusFilter === "active",
            onToggle: () => {
              setStatusFilter("active");
              setPage(1);
            },
          },
          {
            id: "status-inactive",
            label: "Tạm tắt",
            checked: statusFilter === "inactive",
            onToggle: () => {
              setStatusFilter("inactive");
              setPage(1);
            },
          },
          {
            id: "status-deleted",
            label: "Đã xóa",
            checked: statusFilter === "deleted",
            onToggle: () => {
              setStatusFilter("deleted");
              setPage(1);
            },
          },
        ],
      },
    ],
    [statusFilter]
  );

  const tableColumns: AdminTableColumn<ClassroomItem, ClassSortKey>[] = [
      {
        id: "class",
        label: "Lớp",
        sortKey: "className",
        widthClassName: "w-[260px]",
        render: (item) => (
          <AdminEntityCell
            title={item.className || "--"}
            subtitle={`${item.mode} · ${item.maxStudents} HV`}
            icon={<School className="h-4 w-4 text-slate-500" />}
          />
        ),
      },
      {
        id: "course",
        label: "Khóa học",
        sortKey: "course",
        widthClassName: "w-[220px]",
        render: (item) => <div className="truncate">{getCourseTitle(item)}</div>,
      },
      {
        id: "teacher",
        label: "Giảng viên",
        sortKey: "teacher",
        widthClassName: "w-[180px]",
        render: (item) => <div className="truncate">{getTeacherName(item) || "--"}</div>,
      },
      {
        id: "schedule",
        label: "Lịch",
        sortKey: "schedule",
        widthClassName: "w-[190px]",
        render: (item) => <div className="truncate">{item.scheduleText || "--"}</div>,
      },
      {
        id: "room",
        label: "Phòng",
        sortKey: "room",
        widthClassName: "w-[140px]",
        render: (item) => <div className="truncate">{item.room || "--"}</div>,
      },
      {
        id: "status",
        label: "Trạng thái",
        sortKey: "status",
        widthClassName: "w-[140px]",
        render: (item) => (
          <AdminStatusBadge
            tone={
              viewMode === "deleted" || item.isDeleted
                ? "danger"
                : item.isActive
                  ? "success"
                  : "neutral"
            }
          >
            {getClassStatusLabel(item, viewMode)}
          </AdminStatusBadge>
        ),
      },
      {
        id: "actions",
        label: <div className="text-right">Action</div>,
        widthClassName: "w-[170px]",
        align: "right",
        render: (item) => (
          <div className="flex items-center justify-end gap-2">
            {viewMode === "active" ? (
              <>
                <AdminActionIconButton
                  title="Học viên"
                  onClick={() => setStudentsModalClass(item)}
                >
                  <Users className="h-4 w-4" />
                </AdminActionIconButton>
                <AdminActionIconButton title="Edit" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </AdminActionIconButton>
                <AdminActionIconButton
                  danger
                  title="Delete"
                  onClick={() => void handleSoftDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </AdminActionIconButton>
              </>
            ) : (
              <>
                <AdminActionIconButton
                  title="Restore"
                  onClick={() => void handleRestore(item)}
                >
                  <RotateCcw className="h-4 w-4" />
                </AdminActionIconButton>
                <AdminActionIconButton
                  danger
                  title="Delete"
                  onClick={() => void handleHardDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </AdminActionIconButton>
              </>
            )}
          </div>
        ),
      },
  ];

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-right" />

      <section className="hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="hidden text-[28px] font-semibold leading-tight text-slate-900 md:text-[32px]">
              Quản lý lớp học
            </h1>
            <p className="hidden mt-1.5 text-sm text-slate-500">
              Tạo, sửa và quản lý lớp học cùng danh sách học viên.
            </p>

            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setViewMode("active");
                  setStatusFilter("all");
                  setPage(1);
                }}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition",
                  viewMode === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-slate-600 hover:bg-white"
                )}
              >
                <School className="h-4 w-4" />
                Lớp học
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode("deleted");
                  setStatusFilter("deleted");
                  setPage(1);
                }}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition",
                  viewMode === "deleted"
                    ? "bg-rose-100 text-rose-700"
                    : "text-slate-600 hover:bg-white"
                )}
              >
                <Trash2 className="h-4 w-4" />
                Đã xóa
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Thêm lớp
            </button>

            <button
              type="button"
              onClick={() => void fetchClassrooms()}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <AdminListTable<ClassroomItem, ClassSortKey>
        rows={pagedItems}
        columns={tableColumns}
        rowKey={(item) => item._id}
        loading={loading}
        searchValue={search}
        searchPlaceholder="Tìm lớp, khóa học, giảng viên, phòng..."
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterSections={filterSections}
        activeFilterCount={activeFilterCount}
        onApplyFilters={() => setPage(1)}
        onClearFilters={() => {
          setSearch("");
          setStatusFilter(viewMode === "deleted" ? "deleted" : "all");
          setPage(1);
        }}
        sortBy={sortKey}
        sortOrder={sortDirection}
        onSortChange={(nextSortBy, nextSortOrder) => {
          setSortKey(nextSortBy);
          setSortDirection(nextSortOrder);
          setPage(1);
        }}
        onReload={() => void fetchClassrooms()}
        toolbarStart={
          <div className="inline-flex rounded-[22px] border border-slate-200 bg-slate-50 p-1.5 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => {
                setViewMode("active");
                setStatusFilter("all");
                setPage(1);
              }}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                viewMode === "active"
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
                  : "text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-white/10"
              )}
            >
              <School className="h-4 w-4" />
              Lớp học
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("deleted");
                setStatusFilter("deleted");
                setPage(1);
              }}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                viewMode === "deleted"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200"
                  : "text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-white/10"
              )}
            >
              <Trash2 className="h-4 w-4" />
              Đã xóa
            </button>
          </div>
        }
        toolbarEnd={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center gap-2 rounded-[18px] bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Thêm lớp
          </button>
        }
        pagination={{
          currentPage,
          totalPages,
          totalItems: serverPagination.total,
          pageSize: rowsPerPage,
          onPageSizeChange: (nextPageSize) => {
            setRowsPerPage(nextPageSize);
            setPage(1);
          },
          onPageChange: setPage,
          pageSizeOptions: [5, 10, 20],
        }}
        emptyText="Chua co lop hoc nao phu hop."
        labels={{ showing: "Hiển thị", rows: "Số dòng / trang" }}
        tableMinWidthClassName="min-w-[1220px]"
      />

      <section className="hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm lớp, khóa học, giảng viên, phòng..."
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div className="relative w-full xl:w-[220px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
              className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm tắt</option>
              <option value="deleted">Đã xóa</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="relative w-full xl:w-[220px]">
            <select
              value={sortKey}
              onChange={(e) => {
                setSortKey(e.target.value as ClassSortKey);
                setPage(1);
              }}
              className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="createdAt">
                {viewMode === "active" ? "Sort: Ngày tạo" : "Sort: Ngày xóa"}
              </option>
              <option value="className">Sort: Lớp</option>
              <option value="course">Sort: Khóa học</option>
              <option value="teacher">Sort: Giảng viên</option>
              <option value="schedule">Sort: Lịch</option>
              <option value="room">Sort: Phòng</option>
              <option value="status">Sort: Trạng thái</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="relative w-full xl:w-[150px]">
            <select
              value={sortDirection}
              onChange={(e) => {
                setSortDirection(e.target.value as SortDirection);
                setPage(1);
              }}
              className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="ml-auto inline-flex h-10 items-center rounded-2xl bg-slate-100 px-4 text-[13px] font-semibold text-slate-700">
            {serverPagination.total} KẾT QUẢ
          </div>
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1250px]">
            <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr_1fr_1fr_220px] items-center border-b border-slate-200 bg-slate-50 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              <div>Lớp</div>
              <div>Khóa học</div>
              <div>Giảng viên</div>
              <div>Lịch</div>
              <div>Phòng</div>
              <div>Trạng thái</div>
              <div>Action</div>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Đang tải dữ liệu lớp học...
              </div>
            ) : pagedItems.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Chưa có lớp học nào phù hợp.
              </div>
            ) : (
              pagedItems.map((item) => (
                <div
                  key={item._id}
                  className="grid grid-cols-[2fr_1.4fr_1fr_1fr_1fr_1fr_220px] items-center border-b border-slate-200 px-6 py-4 text-sm last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900">
                      {item.className}
                    </div>
                    <div className="truncate text-slate-500">
                      {item.mode} · {item.maxStudents} HV
                    </div>
                  </div>

                  <div className="truncate text-slate-700">
                    {getCourseTitle(item)}
                  </div>

                  <div className="truncate text-slate-700">
                    {getTeacherName(item) || "--"}
                  </div>

                  <div className="text-slate-700">
                    {item.scheduleText || "--"}
                  </div>

                  <div className="text-slate-700">{item.room || "--"}</div>

                  <div>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                        getClassStatusStyle(item, viewMode)
                      )}
                    >
                      {getClassStatusLabel(item, viewMode)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {viewMode === "active" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setStudentsModalClass(item)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-sky-200 px-4 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                        >
                          <Users className="h-4 w-4" />
                          Học viên
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleSoftDelete(item)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleRestore(item)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleHardDelete(item)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>
              Hiển thị{" "}
              <span className="font-semibold text-slate-900">
                {from}-{to}
              </span>{" "}
              /{" "}
              <span className="font-semibold text-slate-900">
                {serverPagination.total}
              </span>
            </span>

            <span>Số dòng / trang</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 px-3 outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="inline-flex h-10 items-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage((prev) => Math.min(totalPages, prev + 1))
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <ClassroomModal
        open={modalOpen}
        mode={formMode}
        value={form}
        saving={saving}
        courses={courses}
        teachers={teachers}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={() => void handleSubmit()}
      />

      <StudentsModal
        open={Boolean(studentsModalClass)}
        classRoom={studentsModalClass}
        onClose={() => setStudentsModalClass(null)}
      />
    </div>
  );
}
