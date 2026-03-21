"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  School,
  Search,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  classroomApi,
  type ClassroomItem,
  type ClassroomStudentStudyItem,
  type ClassMode,
  type CourseOption,
  type CreateClassroomPayload,
  type StudyStatus,
  type TeacherOption,
  type UpdateClassroomPayload,
} from "@/app/api/classroom.api";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type ViewMode = "active" | "deleted";
type FormMode = "create" | "edit";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "DELETED";

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

type LearningFormState = {
  score: string;
  progressPercent: string;
  attendancePercent: string;
  status: StudyStatus;
  isHonored: boolean;
  honorTitle: string;
  showHonorOnUserPage: boolean;
};

const EMPTY_CLASS_FORM: ClassFormState = {
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

const STATUS_OPTIONS: Array<{ value: StudyStatus; label: string }> = [
  { value: "ENROLLED", label: "Đã ghi danh" },
  { value: "STUDYING", label: "Đang học" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "DROPPED", label: "Đã nghỉ" },
];

function toDateInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return e?.response?.data?.message || e?.message || fallback;
}

function getInitialClassForm(
  mode: FormMode,
  initialData: ClassroomItem | null
): ClassFormState {
  if (mode === "edit" && initialData) {
    return {
      course:
        initialData.course && typeof initialData.course === "object"
          ? initialData.course._id || ""
          : "",
      teacher:
        initialData.teacher && typeof initialData.teacher === "object"
          ? initialData.teacher._id || ""
          : "",
      className: initialData.className || "",
      mode: initialData.mode || "ONLINE",
      scheduleText: initialData.scheduleText || "",
      room: initialData.room || "",
      startedAt: toDateInput(initialData.startedAt),
      endedAt: toDateInput(initialData.endedAt),
      maxStudents: String(initialData.maxStudents ?? 0),
      isActive: initialData.isActive ?? true,
    };
  }

  return EMPTY_CLASS_FORM;
}

function getClassStatusLabel(item: ClassroomItem, viewMode: ViewMode) {
  if (viewMode === "deleted" || item.isDeleted) return "DELETED";
  return item.isActive ? "ACTIVE" : "INACTIVE";
}

function getClassStatusStyle(item: ClassroomItem, viewMode: ViewMode) {
  if (viewMode === "deleted" || item.isDeleted) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return item.isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

function getStudyStatusLabel(value?: string) {
  switch (value) {
    case "ENROLLED":
      return "Đã ghi danh";
    case "STUDYING":
      return "Đang học";
    case "PAUSED":
      return "Tạm dừng";
    case "COMPLETED":
      return "Hoàn thành";
    case "DROPPED":
      return "Đã nghỉ";
    default:
      return value || "Không rõ";
  }
}

function getStudyStatusStyle(value?: string) {
  switch (value) {
    case "ENROLLED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "STUDYING":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PAUSED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "COMPLETED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "DROPPED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getCourseTitle(item: ClassroomItem) {
  if (item.course && typeof item.course === "object") {
    return item.course.title || "Khóa học";
  }
  return "Khóa học";
}

function getTeacherName(item: ClassroomItem) {
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

function getTeacherOptionLabel(item: TeacherOption) {
  return item.user?.name || "Giảng viên";
}

type ClassroomFormModalProps = {
  open: boolean;
  mode: FormMode;
  initialData: ClassroomItem | null;
  courses: CourseOption[];
  teachers: TeacherOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ClassFormState) => Promise<void>;
};

function ClassroomFormModal({
  open,
  mode,
  initialData,
  courses,
  teachers,
  saving,
  onClose,
  onSubmit,
}: ClassroomFormModalProps) {
  const [form, setForm] = useState<ClassFormState>(() =>
    getInitialClassForm(mode, initialData)
  );

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.course) {
      toast.error("Vui lòng chọn khóa học");
      return;
    }

    if (!form.teacher) {
      toast.error("Vui lòng chọn giảng viên");
      return;
    }

    if (!form.className.trim()) {
      toast.error("Vui lòng nhập tên lớp");
      return;
    }

    await onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-4xl rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === "create" ? "Tạo lớp học" : "Cập nhật lớp học"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý khóa học, giảng viên và lịch học theo từng lớp.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Khóa học
              </label>
              <select
                value={form.course}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, course: e.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="">Chọn khóa học</option>
                {courses.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Giảng viên
              </label>
              <select
                value={form.teacher}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, teacher: e.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="">Chọn giảng viên</option>
                {teachers.map((item) => (
                  <option key={item._id} value={item._id}>
                    {getTeacherOptionLabel(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tên lớp
              </label>
              <input
                value={form.className}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, className: e.target.value }))
                }
                placeholder="Ví dụ: NextJS tối 2-4-6"
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Hình thức
              </label>
              <select
                value={form.mode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mode: e.target.value as ClassMode,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Lịch học
              </label>
              <input
                value={form.scheduleText}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, scheduleText: e.target.value }))
                }
                placeholder="Ví dụ: T2 - T4 - T6 | 18:30 - 20:00"
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phòng học
              </label>
              <input
                value={form.room}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, room: e.target.value }))
                }
                placeholder="Ví dụ: Phòng 203"
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={form.startedAt}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startedAt: e.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={form.endedAt}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endedAt: e.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Số lượng tối đa
              </label>
              <input
                type="number"
                min={0}
                value={form.maxStudents}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, maxStudents: e.target.value }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Lớp đang hoạt động
          </label>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tạo lớp học"
                  : "Lưu thay đổi"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ClassStudentsModalProps = {
  open: boolean;
  classRoom: ClassroomItem | null;
  onClose: () => void;
};

function ClassStudentsModal({
  open,
  classRoom,
  onClose,
}: ClassStudentsModalProps) {
  const [items, setItems] = useState<ClassroomStudentStudyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const classRoomId = classRoom?._id ?? "";

  useEffect(() => {
    if (!open || !classRoomId) return;

    async function loadStudents() {
      setLoading(true);
      try {
        const data = await classroomApi.listStudents(classRoomId);
        setItems(data);
      } catch (error) {
        toast.error(getErrorMessage(error, "Không tải được học viên trong lớp"));
      } finally {
        setLoading(false);
      }
    }

    void loadStudents();
  }, [open, classRoomId]);

  if (!open || !classRoom) return null;

  async function handleUpdateLearning(
    item: ClassroomStudentStudyItem,
    next: LearningFormState
  ) {
    if (!classRoomId) return;

    try {
      setSavingId(item._id);

      await classroomApi.updateStudentLearning(item._id, {
        score: next.score,
        progressPercent: next.progressPercent,
        attendancePercent: next.attendancePercent,
        status: next.status,
      });

      await classroomApi.updateStudentHonor(item._id, {
        isHonored: next.isHonored,
        honorTitle: next.honorTitle,
        showHonorOnUserPage: next.showHonorOnUserPage,
      });

      const fresh = await classroomApi.listStudents(classRoomId);
      setItems(fresh);
      toast.success("Cập nhật học viên thành công");
    } catch (error) {
      toast.error(getErrorMessage(error, "Cập nhật học viên thất bại"));
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] bg-slate-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Học viên trong lớp
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {classRoom.className} · {getCourseTitle(classRoom)} ·{" "}
              {getTeacherName(classRoom)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Đang tải danh sách học viên...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Chưa có học viên nào trong lớp này.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <ClassStudentCard
                  key={item._id}
                  item={item}
                  saving={savingId === item._id}
                  onSave={handleUpdateLearning}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ClassStudentCardProps = {
  item: ClassroomStudentStudyItem;
  saving: boolean;
  onSave: (
    item: ClassroomStudentStudyItem,
    values: LearningFormState
  ) => Promise<void>;
};

function ClassStudentCard({
  item,
  saving,
  onSave,
}: ClassStudentCardProps) {
  const [form, setForm] = useState<LearningFormState>({
    score: String(item.score ?? 0),
    progressPercent: String(item.progressPercent ?? 0),
    attendancePercent: String(item.attendancePercent ?? 0),
    status: item.status || "ENROLLED",
    isHonored: item.isHonored ?? false,
    honorTitle: item.honorTitle || "Học viên xuất sắc",
    showHonorOnUserPage: item.showHonorOnUserPage ?? false,
  });

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-bold text-slate-900">
              {getStudentName(item)}
            </h4>

            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                getStudyStatusStyle(item.status)
              )}
            >
              {getStudyStatusLabel(item.status)}
            </span>

            {item.isHonored && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Trophy className="h-3.5 w-3.5" />
                {item.honorTitle || "Học viên xuất sắc"}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {getStudentEmail(item) || "Không có email"}
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Điểm
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.score}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, score: e.target.value }))
                }
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tiến độ (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.progressPercent}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    progressPercent: e.target.value,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Điểm danh (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.attendancePercent}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    attendancePercent: e.target.value,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as StudyStatus,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Danh hiệu
              </label>
              <input
                value={form.honorTitle}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, honorTitle: e.target.value }))
                }
                placeholder="Ví dụ: Học viên xuất sắc"
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isHonored}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isHonored: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              Học viên xuất sắc
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
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
              Hiển thị bên user
            </label>
          </div>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave(item, form)}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu cập nhật"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminClassesPage() {
  const [items, setItems] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<ClassroomItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [studentsModalClass, setStudentsModalClass] =
    useState<ClassroomItem | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [classrooms, courseOptions, teacherOptions] = await Promise.all([
        viewMode === "active"
          ? classroomApi.list()
          : classroomApi.listDeleted(),
        classroomApi.listCourseOptions(),
        classroomApi.listTeacherOptions(),
      ]);

      setItems(classrooms);
      setCourses(courseOptions);
      setTeachers(teacherOptions);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không tải được dữ liệu lớp học"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [viewMode]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const teacherName = getTeacherName(item).toLowerCase();
      const courseTitle = getCourseTitle(item).toLowerCase();

      const matchesKeyword =
        !keyword ||
        `${item.className} ${item.scheduleText} ${item.room} ${teacherName} ${courseTitle}`
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
            ? item.isActive && !item.isDeleted
            : statusFilter === "INACTIVE"
              ? !item.isActive && !item.isDeleted
              : Boolean(item.isDeleted);

      return matchesKeyword && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const formKey = useMemo(() => {
    return `${formMode}-${editingItem?._id ?? "new"}-${formOpen ? "open" : "closed"}`;
  }, [formMode, editingItem, formOpen]);

  function openCreate() {
    setFormMode("create");
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: ClassroomItem) {
    setFormMode("edit");
    setEditingItem(item);
    setFormOpen(true);
  }

  async function handleSubmitForm(values: ClassFormState) {
    setSaving(true);

    try {
      if (formMode === "create") {
        const payload: CreateClassroomPayload = {
          course: values.course,
          teacher: values.teacher,
          className: values.className.trim(),
          mode: values.mode,
          scheduleText: values.scheduleText.trim(),
          room: values.room.trim(),
          startedAt: values.startedAt || undefined,
          endedAt: values.endedAt || undefined,
          maxStudents: values.maxStudents,
          isActive: values.isActive,
        };

        await classroomApi.create(payload);
        toast.success("Tạo lớp học thành công");
      } else if (editingItem) {
        const payload: UpdateClassroomPayload = {
          course: values.course,
          teacher: values.teacher,
          className: values.className.trim(),
          mode: values.mode,
          scheduleText: values.scheduleText.trim(),
          room: values.room.trim(),
          startedAt: values.startedAt || undefined,
          endedAt: values.endedAt || undefined,
          maxStudents: values.maxStudents,
          isActive: values.isActive,
        };

        await classroomApi.update(editingItem._id, payload);
        toast.success("Cập nhật lớp học thành công");
      }

      setFormOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Lưu lớp học thất bại"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSoftDelete(item: ClassroomItem) {
    const ok = window.confirm(`Xóa mềm lớp "${item.className}"?`);
    if (!ok) return;

    try {
      await classroomApi.softDelete(item._id);
      toast.success("Đã xóa mềm lớp học");
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Xóa mềm thất bại"));
    }
  }

  async function handleRestore(item: ClassroomItem) {
    const ok = window.confirm(`Khôi phục lớp "${item.className}"?`);
    if (!ok) return;

    try {
      await classroomApi.restore(item._id);
      toast.success("Khôi phục lớp học thành công");
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Khôi phục thất bại"));
    }
  }

  async function handleForceDelete(item: ClassroomItem) {
    const ok = window.confirm(
      `Xóa cứng lớp "${item.className}"?\nHành động này không thể hoàn tác.`
    );
    if (!ok) return;

    try {
      await classroomApi.forceDelete(item._id);
      toast.success("Đã xóa cứng lớp học");
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Xóa cứng thất bại"));
    }
  }

  return (
    <>
      <Toaster richColors position="top-right" />

      <div className="space-y-6">
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[30px] font-bold tracking-[-0.02em] text-slate-900">
                Classroom Management
              </h1>
              <p className="mt-2 text-base text-slate-500">
                Tạo lớp học, gán giáo viên và quản lý học viên theo từng lớp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 items-center gap-2 rounded-[18px] bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus className="h-4.5 w-4.5" />
                New Class
              </button>

              <button
                type="button"
                onClick={() => void loadData()}
                className="inline-flex h-11 items-center gap-2 rounded-[18px] border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4.5 w-4.5" />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-6 inline-flex rounded-[22px] border border-slate-200 bg-slate-50 p-1.5">
            <button
              type="button"
              onClick={() => setViewMode("active")}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                viewMode === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-700 hover:bg-white"
              )}
            >
              <School className="h-4 w-4" />
              Classes
            </button>

            <button
              type="button"
              onClick={() => setViewMode("deleted")}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                viewMode === "deleted"
                  ? "bg-rose-100 text-rose-700"
                  : "text-slate-700 hover:bg-white"
              )}
            >
              <Trash2 className="h-4 w-4" />
              Deleted
            </button>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_140px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search class, course, teacher..."
                className="h-[54px] w-full rounded-[20px] border border-slate-300 bg-white pl-14 pr-4 text-[15px] outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-[54px] w-full appearance-none rounded-[20px] border border-slate-300 bg-white px-5 pr-12 text-[15px] outline-none transition focus:border-slate-400"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DELETED">Deleted</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            </div>

            <div className="flex h-[54px] items-center justify-center rounded-[20px] bg-slate-100 px-5 text-[15px] font-bold text-slate-700">
              {filteredItems.length} FOUND
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[1240px]">
              <div className="grid grid-cols-[2fr_1.3fr_1.3fr_1.2fr_1fr_1fr_220px] items-center border-b border-slate-200 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                <div>Class</div>
                <div>Course</div>
                <div>Teacher</div>
                <div>Schedule</div>
                <div>Status</div>
                <div>Students</div>
                <div>Actions</div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Đang tải danh sách lớp học...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Không có lớp học phù hợp.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item._id}
                    className="grid grid-cols-[2fr_1.3fr_1.3fr_1.2fr_1fr_1fr_220px] items-center border-b border-slate-200 px-6 py-5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-[17px] font-semibold text-slate-900">
                        {item.className}
                      </h3>
                      <p className="truncate text-[14px] text-slate-500">
                        {item.mode === "ONLINE" ? "Online" : "Offline"}
                        {item.room ? ` · ${item.room}` : ""}
                      </p>
                    </div>

                    <div className="min-w-0 text-[15px] text-slate-700">
                      {getCourseTitle(item)}
                    </div>

                    <div className="min-w-0 text-[15px] text-slate-700">
                      {getTeacherName(item) || "—"}
                    </div>

                    <div className="min-w-0 text-[14px] text-slate-700">
                      {item.scheduleText || "—"}
                    </div>

                    <div>
                      <span
                        className={cn(
                          "inline-flex min-w-[108px] items-center justify-center rounded-full border px-4 py-2 text-[13px] font-semibold",
                          getClassStatusStyle(item, viewMode)
                        )}
                      >
                        {getClassStatusLabel(item, viewMode)}
                      </span>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setStudentsModalClass(item)}
                        className="inline-flex items-center gap-2 rounded-[14px] px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-600"
                      >
                        <Users className="h-4 w-4" />
                        Học viên
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {viewMode === "active" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleSoftDelete(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleRestore(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50"
                            title="Restore"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleForceDelete(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                            title="Delete permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <ClassroomFormModal
        key={formKey}
        open={formOpen}
        mode={formMode}
        initialData={editingItem}
        courses={courses}
        teachers={teachers}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmitForm}
      />

      <ClassStudentsModal
        open={Boolean(studentsModalClass)}
        classRoom={studentsModalClass}
        onClose={() => setStudentsModalClass(null)}
      />
    </>
  );
}