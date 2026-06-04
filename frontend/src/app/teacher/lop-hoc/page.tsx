"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  AlertCircle,
  BookOpen,
  Loader2,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  School,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  classroomApi,
  type ClassroomItem,
  type ClassroomStudentStudyItem,
  type CourseOption,
  type CreateClassroomPayload,
  type StudyStatus,
  type UpdateClassroomPayload,
} from "@/app/api/classroom.api";
import { teacherApi, type TeacherItem } from "@/app/api/teacher.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import type { PaginationMeta, SortDirection } from "@/lib/utils/admin-list";
import {
  getCourseTitle,
  getErrorMessage,
  getModeLabel,
  getStudentEmail,
  getStudentName,
  getTeacherName,
} from "@/lib/helpers/teacher/classroom";

type StatusFilter = "all" | "active" | "inactive";
type ClassSortKey = "className" | "course" | "teacher" | "status" | "createdAt";
type StudentSortKey =
  | "student"
  | "status"
  | "attendance"
  | "progress"
  | "average";
type StudentStatusFilter = "all" | StudyStatus;
type FormMode = "create" | "edit";

type ClassFormState = {
  course: string;
  className: string;
  mode: "ONLINE" | "OFFLINE";
  scheduleText: string;
  room: string;
  startedAt: string;
  endedAt: string;
  maxStudents: string;
  isActive: boolean;
};

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 5,
  total: 0,
  totalPages: 1,
};

const INITIAL_FORM: ClassFormState = {
  course: "",
  className: "",
  mode: "ONLINE",
  scheduleText: "",
  room: "",
  startedAt: "",
  endedAt: "",
  maxStudents: "0",
  isActive: true,
};

const STUDY_STATUS_LABELS: Record<string, string> = {
  ENROLLED: "Đã ghi danh",
  STUDYING: "Đang học",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  DROPPED: "Đã nghỉ",
};

function getCourseId(item: ClassroomItem) {
  if (typeof item.course === "string") return item.course;
  return item.course?._id || "";
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function toIsoFromDateInput(value: string) {
  if (!value) return undefined;
  return new Date(`${value}T12:00:00`).toISOString();
}

function clampNonNegative(value: string) {
  if (value.trim() === "") return "0";

  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return String(Math.max(0, Math.trunc(num)));
}

function makeFormFromClass(item: ClassroomItem): ClassFormState {
  return {
    course: getCourseId(item),
    className: item.className || "",
    mode: item.mode || "ONLINE",
    scheduleText: item.scheduleText || "",
    room: item.room || "",
    startedAt: toDateInputValue(item.startedAt),
    endedAt: toDateInputValue(item.endedAt),
    maxStudents: String(item.maxStudents ?? 0),
    isActive: item.isActive,
  };
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(0)}%`;
}

function formatScore(value: number) {
  return Number(value || 0).toFixed(1);
}

function getClassStatusLabel(item: ClassroomItem) {
  return item.isActive ? "ACTIVE" : "LOCKED";
}

function getInitials(name?: string, email?: string) {
  const source = (name || email || "").trim();
  if (!source) return "--";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
}

function compareStudentValues(
  left: string | number,
  right: string | number,
  direction: SortDirection
) {
  const modifier = direction === "asc" ? 1 : -1;

  if (typeof left === "number" && typeof right === "number") {
    return (left - right) * modifier;
  }

  return (
    String(left).localeCompare(String(right), "vi", {
      numeric: true,
      sensitivity: "base",
    }) * modifier
  );
}

export default function TeacherClassesPage() {
  const [items, setItems] = useState<ClassroomItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [teacherMe, setTeacherMe] = useState<TeacherItem | null>(null);
  const [pagination, setPagination] =
    useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<ClassSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<ClassroomItem | null>(null);
  const [form, setForm] = useState<ClassFormState>(INITIAL_FORM);

  const [selectedClass, setSelectedClass] = useState<ClassroomItem | null>(null);

  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);

      const [classrooms, courseOptions, currentTeacher] = await Promise.all([
        classroomApi.listMinePaged({
          q: search,
          status: statusFilter === "all" ? undefined : statusFilter,
          sortBy: sortKey,
          sortOrder: sortDirection,
          page,
          limit: rowsPerPage,
        }),
        classroomApi.listCourseOptions(),
        teacherApi.getMe().catch(() => null),
      ]);

      setItems(classrooms.items);
      setPagination(classrooms.pagination);
      setCourses(courseOptions);
      setTeacherMe(currentTeacher);
    } catch (error) {
      setItems([]);
      setPagination(DEFAULT_PAGINATION);
      toast.error(getErrorMessage(error, "Không tải được danh sách lớp học"));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, sortDirection, sortKey, statusFilter]);

  useEffect(() => {
    void fetchClassrooms();
  }, [fetchClassrooms]);

  useEffect(() => {
    if (page > pagination.totalPages) setPage(pagination.totalPages);
  }, [page, pagination.totalPages]);

  function resetForm() {
    setForm(INITIAL_FORM);
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
    setForm(makeFormFromClass(item));
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formMode === "create" && !teacherMe?._id) {
      toast.warning("Không tìm thấy hồ sơ giáo viên của tài khoản này");
      return;
    }

    if (formMode === "create" && !form.course) {
      toast.warning("Vui lòng chọn khóa học");
      return;
    }

    if (!form.className.trim()) {
      toast.warning("Vui lòng nhập tên lớp");
      return;
    }

    try {
      setSaving(true);

      if (formMode === "create") {
        const payload: CreateClassroomPayload = {
          course: form.course,
          teacher: teacherMe!._id,
          className: form.className.trim(),
          mode: form.mode,
          scheduleText: form.scheduleText.trim(),
          room: form.room.trim(),
          startedAt: toIsoFromDateInput(form.startedAt),
          endedAt: toIsoFromDateInput(form.endedAt),
          maxStudents: clampNonNegative(form.maxStudents),
          isActive: form.isActive,
        };

        await classroomApi.create(payload);
        toast.success("Tạo lớp học thành công");
      } else if (editingItem) {
        const payload: UpdateClassroomPayload = {
          className: form.className.trim(),
          mode: form.mode,
          scheduleText: form.scheduleText.trim(),
          room: form.room.trim(),
          startedAt: toIsoFromDateInput(form.startedAt) ?? null,
          endedAt: toIsoFromDateInput(form.endedAt) ?? null,
          maxStudents: clampNonNegative(form.maxStudents),
          isActive: form.isActive,
        };

        await classroomApi.update(editingItem._id, payload);
        toast.success("Cập nhật lớp học thành công");
      }

      setModalOpen(false);
      resetForm();
      await fetchClassrooms();
    } catch (error) {
      toast.error(getErrorMessage(error, "Lưu lớp học thất bại"));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: ClassroomItem) {
    try {
      const nextActive = !item.isActive;
      const updated = await classroomApi.update(item._id, {
        isActive: nextActive,
      });

      setItems((prev) =>
        prev.map((current) => (current._id === item._id ? updated : current))
      );
      toast.success(nextActive ? "Đã mở khóa lớp" : "Đã khóa lớp");
    } catch (error) {
      toast.error(getErrorMessage(error, "Cập nhật trạng thái lớp thất bại"));
    }
  }

  const activeFilterCount = statusFilter !== "all" ? 1 : 0;

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "status",
        title: "Status",
        options: [
          {
            id: "status-all",
            label: "All status",
            checked: statusFilter === "all",
            onToggle: () => {
              setStatusFilter("all");
              setPage(1);
            },
          },
          {
            id: "status-active",
            label: "Active",
            checked: statusFilter === "active",
            onToggle: () => {
              setStatusFilter("active");
              setPage(1);
            },
          },
          {
            id: "status-inactive",
            label: "Locked",
            checked: statusFilter === "inactive",
            onToggle: () => {
              setStatusFilter("inactive");
              setPage(1);
            },
          },
        ],
      },
    ],
    [statusFilter]
  );

  const tableColumns = useMemo<
    AdminTableColumn<ClassroomItem, ClassSortKey>[]
  >(
    () => [
      {
        id: "className",
        label: "Class",
        sortKey: "className",
        widthClassName: "w-[260px]",
        render: (item) => (
          <AdminEntityCell
            title={item.className || "--"}
            subtitle={`Tối đa ${item.maxStudents || 0} HV`}
            icon={<School className="h-4 w-4 text-slate-500" />}
          />
        ),
      },
      {
        id: "course",
        label: "Courses",
        sortKey: "course",
        widthClassName: "w-[220px]",
        render: (item) => <div className="truncate">{getCourseTitle(item)}</div>,
      },
      {
        id: "teacher",
        label: "Teachers",
        sortKey: "teacher",
        widthClassName: "w-[180px]",
        render: (item) => (
          <div className="truncate">{getTeacherName(item) || "--"}</div>
        ),
      },
      {
        id: "status",
        label: "Status",
        sortKey: "status",
        widthClassName: "w-[140px]",
        render: (item) => (
          <AdminStatusBadge tone={item.isActive ? "success" : "neutral"}>
            {getClassStatusLabel(item)}
          </AdminStatusBadge>
        ),
      },
      {
        id: "actions",
        label: <div className="text-right">Action</div>,
        widthClassName: "w-[170px]",
        align: "right",
        render: (item) => (
          <div className="flex items-center justify-end gap-1">
            <AdminActionIconButton
              title="Quản lí học viên"
              onClick={() => setSelectedClass(item)}
            >
              <BookOpen className="h-4 w-4" />
            </AdminActionIconButton>
            <AdminActionIconButton title="Edit" onClick={() => openEdit(item)}>
              <Pencil className="h-4 w-4" />
            </AdminActionIconButton>
            <AdminActionIconButton
              title={item.isActive ? "Lock" : "Unlock"}
              onClick={() => void handleToggleActive(item)}
            >
              {item.isActive ? (
                <Lock className="h-4 w-4" />
              ) : (
                <LockOpen className="h-4 w-4" />
              )}
            </AdminActionIconButton>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <Toaster richColors position="top-right" />

      <main className="p-4 md:p-6">
        <AdminListTable<ClassroomItem, ClassSortKey>
          rows={items}
          columns={tableColumns}
          rowKey={(item) => item._id}
          loading={loading}
          searchValue={search}
          searchPlaceholder="Tìm lớp, khóa học, giáo viên..."
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          filterSections={filterSections}
          activeFilterCount={activeFilterCount}
          onApplyFilters={() => setPage(1)}
          onClearFilters={() => {
            setSearch("");
            setStatusFilter("all");
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
          toolbarEnd={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              <Plus className="h-4 w-4" />
              Add class
            </button>
          }
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            totalItems: pagination.total,
            pageSize: rowsPerPage,
            onPageSizeChange: (nextPageSize) => {
              setRowsPerPage(nextPageSize);
              setPage(1);
            },
            onPageChange: setPage,
            pageSizeOptions: [5, 10, 20],
          }}
          emptyText="Chưa có lớp học nào phù hợp."
          labels={{
            filter: "Filter",
            clear: "Clear",
            reload: "Refresh",
            rows: "Rows per page",
            showing: "Showing",
            of: "of",
            loading: "Đang tải danh sách lớp học...",
            noData: "Không có dữ liệu",
          }}
          tableMinWidthClassName="min-w-[890px]"
        />
      </main>

      {modalOpen ? (
        <ClassModal
          mode={formMode}
          form={form}
          courses={courses}
          teacher={teacherMe}
          editingItem={editingItem}
          saving={saving}
          onChange={setForm}
          onClose={() => {
            setModalOpen(false);
            resetForm();
          }}
          onSubmit={handleSubmit}
        />
      ) : null}

      {selectedClass ? (
        <StudentDrawer
          classroom={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      ) : null}
    </>
  );
}

function ClassModal({
  mode,
  form,
  courses,
  teacher,
  editingItem,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: FormMode;
  form: ClassFormState;
  courses: CourseOption[];
  teacher: TeacherItem | null;
  editingItem: ClassroomItem | null;
  saving: boolean;
  onChange: (form: ClassFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const title = mode === "create" ? "Add class" : "Edit class";

  function updateField<K extends keyof ClassFormState>(
    key: K,
    value: ClassFormState[K]
  ) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === "create"
                ? "Tạo lớp mới cho giáo viên đang đăng nhập."
                : `${editingItem?.className || "Lớp học"} · ${getCourseTitle(
                    editingItem as ClassroomItem
                  )}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {mode === "create" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Courses
                </span>
                <select
                  value={form.course}
                  onChange={(event) => updateField("course", event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Choose course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <ReadOnlyField label="Courses" value={getCourseTitle(editingItem!)} />
            )}

            <ReadOnlyField
              label="Teachers"
              value={
                teacher?.name ||
                (editingItem ? getTeacherName(editingItem) : "Giáo viên")
              }
            />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Class name
              </span>
              <input
                value={form.className}
                onChange={(event) => updateField("className", event.target.value)}
                placeholder="Example: Backend NestJS course in March"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Maximum students
              </span>
              <input
                type="number"
                min={0}
                value={form.maxStudents}
                onChange={(event) =>
                  updateField("maxStudents", event.target.value)
                }
                onBlur={() =>
                  updateField("maxStudents", clampNonNegative(form.maxStudents))
                }
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Mode
              </span>
              <select
                value={form.mode}
                onChange={(event) =>
                  updateField("mode", event.target.value as "ONLINE" | "OFFLINE")
                }
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Room
              </span>
              <input
                value={form.room}
                onChange={(event) => updateField("room", event.target.value)}
                placeholder={form.mode === "ONLINE" ? "Zoom / Google Meet" : "Phòng học"}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Schedule
              </span>
              <input
                value={form.scheduleText}
                onChange={(event) =>
                  updateField("scheduleText", event.target.value)
                }
                placeholder="Thứ 2, 4, 6 · 19:00 - 21:00"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Start date
              </span>
              <input
                type="date"
                value={form.startedAt}
                onChange={(event) => updateField("startedAt", event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                End date
              </span>
              <input
                type="date"
                value={form.endedAt}
                onChange={(event) => updateField("endedAt", event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          </div>

          <label className="mt-5 inline-flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-sky-600"
            />
            Activate after saving
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Close
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-6 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : mode === "create" ? "Create class" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        <span className="truncate">{value || "--"}</span>
      </div>
    </label>
  );
}

function StudentDrawer({
  classroom,
  onClose,
}: {
  classroom: ClassroomItem;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ClassroomStudentStudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] =
    useState<StudentStatusFilter>("all");
  const [studentSortKey, setStudentSortKey] =
    useState<StudentSortKey>("student");
  const [studentSortDirection, setStudentSortDirection] =
    useState<SortDirection>("asc");
  const [studentRowsPerPage, setStudentRowsPerPage] = useState(5);
  const [studentPage, setStudentPage] = useState(1);

  async function reloadStudents() {
    try {
      setLoading(true);
      setErrorText("");

      const data = await classroomApi.listStudents(classroom._id);
      setItems(data);
    } catch (error) {
      setItems([]);
      setErrorText(getErrorMessage(error, "Không tải được học viên trong lớp"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadStudents() {
      try {
        setLoading(true);
        setErrorText("");

        const data = await classroomApi.listStudents(classroom._id);

        if (!mounted) return;
        setItems(data);
      } catch (error) {
        if (!mounted) return;
        setItems([]);
        setErrorText(getErrorMessage(error, "Không tải được học viên trong lớp"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadStudents();

    return () => {
      mounted = false;
    };
  }, [classroom._id]);

  const filteredStudents = useMemo(() => {
    const keyword = studentSearch.trim().toLowerCase();

    const rows = items.filter((item) => {
      if (studentStatusFilter !== "all" && item.status !== studentStatusFilter) {
        return false;
      }

      if (!keyword) return true;

      return [
        getStudentName(item),
        getStudentEmail(item),
        STUDY_STATUS_LABELS[item.status] ?? item.status,
        item.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

    return [...rows].sort((left, right) => {
      switch (studentSortKey) {
        case "attendance":
          return compareStudentValues(
            left.attendancePercent,
            right.attendancePercent,
            studentSortDirection
          );
        case "progress":
          return compareStudentValues(
            left.progressPercent,
            right.progressPercent,
            studentSortDirection
          );
        case "average":
          return compareStudentValues(
            left.finalAverage,
            right.finalAverage,
            studentSortDirection
          );
        case "status":
          return compareStudentValues(
            STUDY_STATUS_LABELS[left.status] ?? left.status,
            STUDY_STATUS_LABELS[right.status] ?? right.status,
            studentSortDirection
          );
        case "student":
        default:
          return compareStudentValues(
            getStudentName(left),
            getStudentName(right),
            studentSortDirection
          );
      }
    });
  }, [
    items,
    studentSearch,
    studentSortDirection,
    studentSortKey,
    studentStatusFilter,
  ]);

  const studentPagination = useMemo<PaginationMeta>(() => {
    const total = filteredStudents.length;
    const totalPages = Math.max(
      1,
      Math.ceil(total / Math.max(studentRowsPerPage, 1))
    );
    const currentPage = Math.min(Math.max(studentPage, 1), totalPages);

    return {
      page: currentPage,
      limit: studentRowsPerPage,
      total,
      totalPages,
    };
  }, [filteredStudents.length, studentPage, studentRowsPerPage]);

  useEffect(() => {
    if (studentPage > studentPagination.totalPages) {
      setStudentPage(studentPagination.totalPages);
    }
  }, [studentPage, studentPagination.totalPages]);

  const pagedStudents = useMemo(() => {
    const start = (studentPagination.page - 1) * studentPagination.limit;
    return filteredStudents.slice(start, start + studentPagination.limit);
  }, [filteredStudents, studentPagination.limit, studentPagination.page]);

  const studentActiveFilterCount = studentStatusFilter !== "all" ? 1 : 0;

  const studentFilterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "status",
        title: "Trạng thái học viên",
        options: [
          {
            id: "status-all",
            label: "Tất cả trạng thái",
            checked: studentStatusFilter === "all",
            onToggle: () => {
              setStudentStatusFilter("all");
              setStudentPage(1);
            },
          },
          ...(
            [
              "ENROLLED",
              "STUDYING",
              "PAUSED",
              "COMPLETED",
              "DROPPED",
            ] as StudyStatus[]
          ).map((status) => ({
            id: `status-${status}`,
            label: STUDY_STATUS_LABELS[status] ?? status,
            checked: studentStatusFilter === status,
            onToggle: () => {
              setStudentStatusFilter(status);
              setStudentPage(1);
            },
          })),
        ],
      },
    ],
    [studentStatusFilter]
  );

  const studentColumns = useMemo<
    AdminTableColumn<ClassroomStudentStudyItem, StudentSortKey>[]
  >(
    () => [
      {
        id: "student",
        label: "Student",
        sortKey: "student",
        widthClassName: "w-[28%]",
        render: (item) => {
          const name = getStudentName(item);
          const email = getStudentEmail(item);

          return (
            <AdminEntityCell
              title={name}
              subtitle={email || "--"}
              fallback={getInitials(name, email)}
            />
          );
        },
      },
      {
        id: "status",
        label: "Status",
        sortKey: "status",
        widthClassName: "w-[18%]",
        render: (item) => (
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {STUDY_STATUS_LABELS[item.status] ?? item.status}
          </span>
        ),
      },
      {
        id: "attendance",
        label: "Attendance",
        sortKey: "attendance",
        widthClassName: "w-[18%]",
        align: "center",
        render: (item) => (
          <span className="font-bold text-sky-700">
            {formatPercent(item.attendancePercent)}
          </span>
        ),
      },
      {
        id: "progress",
        label: "Progress",
        sortKey: "progress",
        widthClassName: "w-[18%]",
        align: "center",
        render: (item) => (
          <span className="font-bold text-sky-700">
            {formatPercent(item.progressPercent)}
          </span>
        ),
      },
      {
        id: "average",
        label: "Average",
        sortKey: "average",
        widthClassName: "w-[18%]",
        align: "right",
        render: (item) => (
          <span className="font-bold text-slate-950 dark:text-white">
            {formatScore(item.finalAverage)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
      <div className="flex max-h-[92vh] w-full max-w-[1760px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-white/10">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-slate-950 dark:text-white">
              {classroom.className || "Lớp học"}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-500">
              {getCourseTitle(classroom)} · {getModeLabel(classroom.mode)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 py-5 dark:bg-slate-900/70">
          {errorText ? (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {errorText}
            </div>
          ) : null}

          <AdminListTable<ClassroomStudentStudyItem, StudentSortKey>
            rows={pagedStudents}
            columns={studentColumns}
            rowKey={(item) => item._id}
            loading={loading}
            searchValue={studentSearch}
            searchPlaceholder="Tìm học viên, email, trạng thái..."
            onSearchChange={(value) => {
              setStudentSearch(value);
              setStudentPage(1);
            }}
            filterSections={studentFilterSections}
            activeFilterCount={studentActiveFilterCount}
            onApplyFilters={() => setStudentPage(1)}
            onClearFilters={() => {
              setStudentSearch("");
              setStudentStatusFilter("all");
              setStudentPage(1);
            }}
            sortBy={studentSortKey}
            sortOrder={studentSortDirection}
            onSortChange={(nextSortBy, nextSortOrder) => {
              setStudentSortKey(nextSortBy);
              setStudentSortDirection(nextSortOrder);
              setStudentPage(1);
            }}
            onReload={() => void reloadStudents()}
            pagination={{
              currentPage: studentPagination.page,
              totalPages: studentPagination.totalPages,
              totalItems: studentPagination.total,
              pageSize: studentRowsPerPage,
              onPageSizeChange: (nextPageSize) => {
                setStudentRowsPerPage(nextPageSize);
                setStudentPage(1);
              },
              onPageChange: setStudentPage,
              pageSizeOptions: [5, 10, 20, 30],
            }}
            emptyText="Chưa có học viên nào phù hợp trong lớp này."
            labels={{
              showing: "Hiển thị",
              rows: "Dòng",
              of: "trên",
              filter: "Lọc",
              clear: "Xóa lọc",
              reload: "Tải lại",
              loading: "Đang tải danh sách học viên...",
              noData: "Không có dữ liệu",
            }}
            tableMinWidthClassName="min-w-[900px]"
          />

          <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-sm font-bold text-slate-950 dark:border-white/10 dark:bg-slate-950 dark:text-white">
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-center">Attendance</th>
                    <th className="px-5 py-4 text-center">Progress</th>
                    <th className="px-5 py-4 text-right">Average</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tải học viên...
                        </span>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-sm font-semibold text-slate-500"
                      >
                        Chưa có học viên trong lớp này.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item._id}
                        className="text-sm text-slate-700 dark:text-slate-200"
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-950 dark:text-white">
                            {getStudentName(item)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {getStudentEmail(item)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {STUDY_STATUS_LABELS[item.status] ?? item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-sky-700">
                          {formatPercent(item.attendancePercent)}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-sky-700">
                          {formatPercent(item.progressPercent)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-slate-950 dark:text-white">
                          {formatScore(item.finalAverage)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
