"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CircleCheckBig,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  studentStudyApi,
  type ClassRoomOption,
  type CreateStudentStudyPayload,
  type StudentStudyItem,
  type StudyMode,
  type StudyStatus,
} from "@/app/api/student-study.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import type { SortDirection } from "@/lib/utils/admin-list";
import { toastConfirm } from "@/lib/utils/toast-confirm";

type Props = {
  open: boolean;
  studentId: string;
  studentName: string;
  onClose: () => void;
};

type FormMode = "create" | "edit";
type StudySortKey = "course" | "classRoom" | "teacher" | "status" | "progress";
type StudyStatusFilter = "ALL" | StudyStatus;

type FormState = {
  classRoom: string;
  status: StudyStatus;
  note: string;
  isActive: boolean;
};

const INITIAL_FORM: FormState = {
  classRoom: "",
  status: "ENROLLED",
  note: "",
  isActive: true,
};

const STATUS_OPTIONS: Array<{ value: StudyStatus; label: string }> = [
  { value: "ENROLLED", label: "Đã ghi danh" },
  { value: "STUDYING", label: "Đang học" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "DROPPED", label: "Đã nghỉ" },
];

type ErrorLike = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as ErrorLike;
  return e?.response?.data?.message || e?.message || fallback;
}

function getStatusLabel(value?: string) {
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

function getStatusTone(value?: string): "success" | "warning" | "neutral" | "info" | "danger" {
  switch (value) {
    case "STUDYING":
    case "COMPLETED":
      return "success";
    case "PAUSED":
      return "warning";
    case "DROPPED":
      return "danger";
    case "ENROLLED":
    default:
      return "info";
  }
}

function getPerformanceLabel(value?: string) {
  switch (value) {
    case "EXCELLENT":
      return "Xuất sắc";
    case "GOOD":
      return "Tốt";
    default:
      return "Bình thường";
  }
}

function getCourseTitle(item: StudentStudyItem) {
  if (item.course && typeof item.course === "object") {
    return item.course.title || "Khóa học";
  }

  if (item.classRoom && typeof item.classRoom === "object") {
    if (item.classRoom.course && typeof item.classRoom.course === "object") {
      return item.classRoom.course.title || "Khóa học";
    }
  }

  return "Khóa học";
}

function getTeacherName(item: StudentStudyItem) {
  if (item.teacher && typeof item.teacher === "object") {
    return item.teacher.user?.name || "";
  }

  if (item.classRoom && typeof item.classRoom === "object") {
    if (item.classRoom.teacher && typeof item.classRoom.teacher === "object") {
      return item.classRoom.teacher.user?.name || "";
    }
  }

  return "";
}

function getClassRoomName(item: StudentStudyItem) {
  if (item.classRoom && typeof item.classRoom === "object") {
    return item.classRoom.className || item.className || "—";
  }

  return item.className || "—";
}

function getModeLabel(mode?: StudyMode) {
  return mode === "OFFLINE" ? "Trực tiếp" : "Trực tuyến";
}

function getInitials(name?: string) {
  const source = (name || "KH").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function getScheduleText(item: StudentStudyItem) {
  if (item.classRoom && typeof item.classRoom === "object") {
    return item.classRoom.scheduleText || item.scheduleText || "—";
  }

  return item.scheduleText || "—";
}

function getRoomText(item: StudentStudyItem) {
  if (item.classRoom && typeof item.classRoom === "object") {
    return item.classRoom.room || item.room || "—";
  }

  return item.room || "—";
}

function getInitialForm(
  mode: FormMode,
  initialData: StudentStudyItem | null
): FormState {
  if (mode === "edit" && initialData) {
    return {
      classRoom:
        initialData.classRoom && typeof initialData.classRoom === "object"
          ? initialData.classRoom._id || ""
          : "",
      status: initialData.status || "ENROLLED",
      note: initialData.note || "",
      isActive: initialData.isActive ?? true,
    };
  }

  return INITIAL_FORM;
}

function getCourseTitleFromClassRoom(classRoom: ClassRoomOption | null) {
  if (!classRoom) return "";
  if (classRoom.course && typeof classRoom.course === "object") {
    return classRoom.course.title || "";
  }
  return "";
}

function getTeacherNameFromClassRoom(classRoom: ClassRoomOption | null) {
  if (!classRoom) return "";
  if (classRoom.teacher && typeof classRoom.teacher === "object") {
    return classRoom.teacher.user?.name || "";
  }
  return "";
}

type StudyFormProps = {
  mode: FormMode;
  initialData: StudentStudyItem | null;
  studentId: string;
  classRooms: ClassRoomOption[];
  saving: boolean;
  onDone: () => Promise<void>;
  onCloseForm: () => void;
};

function StudyForm({
  mode,
  initialData,
  studentId,
  classRooms,
  saving,
  onDone,
  onCloseForm,
}: StudyFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    getInitialForm(mode, initialData)
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedClassRoom = useMemo(
    () => classRooms.find((item) => item._id === form.classRoom) || null,
    [classRooms, form.classRoom]
  );

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.classRoom) {
      toast.error("Vui lòng chọn lớp học");
      return;
    }

    const payload: CreateStudentStudyPayload = {
      classRoom: form.classRoom,
      status: form.status,
      note: form.note.trim(),
      isActive: form.isActive,
    };

    try {
      setSubmitting(true);

      if (mode === "edit" && initialData?._id) {
        await studentStudyApi.update(initialData._id, payload);
        toast.success("Cập nhật hồ sơ học tập thành công");
      } else {
        await studentStudyApi.create(studentId, payload);
        toast.success("Gán học viên vào lớp thành công");
      }

      await onDone();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Lưu hồ sơ học tập thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Lớp học
        </label>
        <select
          value={form.classRoom}
          onChange={(e) => setField("classRoom", e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">Chọn lớp học</option>
          {classRooms.map((item) => (
            <option key={item._id} value={item._id}>
              {item.className}
              {getCourseTitleFromClassRoom(item)
                ? ` - ${getCourseTitleFromClassRoom(item)}`
                : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Khóa học
          </label>
          <input
            readOnly
            value={getCourseTitleFromClassRoom(selectedClassRoom)}
            placeholder="Tự động theo lớp"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Giảng viên
          </label>
          <input
            readOnly
            value={getTeacherNameFromClassRoom(selectedClassRoom)}
            placeholder="Tự động theo lớp"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Hình thức
          </label>
          <input
            readOnly
            value={selectedClassRoom ? getModeLabel(selectedClassRoom.mode) : ""}
            placeholder="Tự động theo lớp"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Lịch học
          </label>
          <input
            readOnly
            value={selectedClassRoom?.scheduleText || ""}
            placeholder="Tự động theo lớp"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Phòng học
          </label>
          <input
            readOnly
            value={selectedClassRoom?.room || ""}
            placeholder="Tự động theo lớp"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Trạng thái
        </label>
        <select
          value={form.status}
          onChange={(e) => setField("status", e.target.value as StudyStatus)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
        >
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Ghi chú
        </label>
        <textarea
          value={form.note}
          onChange={(e) => setField("note", e.target.value)}
          rows={4}
          placeholder="Nhập ghi chú thêm..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
      />
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setField("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Hồ sơ học tập đang hoạt động
      </label>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
        <button
          type="button"
          onClick={onCloseForm}
          disabled={saving || submitting}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Đóng
        </button>

        <button
          type="submit"
          disabled={saving || submitting}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving || submitting
            ? "Đang lưu..."
            : mode === "edit"
              ? "Lưu thay đổi"
              : "Gán học viên vào lớp"}
        </button>
      </div>
    </form>
  );
}

export default function StudentStudyModal({
  open,
  studentId,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<StudentStudyItem[]>([]);
  const [classRooms, setClassRooms] = useState<ClassRoomOption[]>([]);

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<StudentStudyItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudyStatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<StudySortKey>("course");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const loadData = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      const [studyItems, classRoomItems] = await Promise.all([
        studentStudyApi.listByStudent(studentId),
        studentStudyApi.listClassRoomOptions(),
      ]);

      setItems(studyItems);
      setClassRooms(classRoomItems.filter((item) => item.isDeleted !== true));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không tải được hồ sơ học tập"));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!open) return;
    setFormMode("create");
    setEditingItem(null);
    setFormOpen(false);
    void loadData();
  }, [loadData, open]);

  const formKey = useMemo(() => {
    return `${formMode}-${editingItem?._id ?? "new"}-${studentId}`;
  }, [formMode, editingItem, studentId]);

  const openCreate = useCallback(() => {
    setFormMode("create");
    setEditingItem(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((item: StudentStudyItem) => {
    setFormMode("edit");
    setEditingItem(item);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setFormMode("create");
    setEditingItem(null);
  }, []);

  const handleDelete = useCallback(async (item: StudentStudyItem) => {
    const title = getCourseTitle(item);
    const ok = await toastConfirm(`Xóa hồ sơ học tập "${title}"?`);
    if (!ok) return;

    try {
      await studentStudyApi.remove(item._id);
      toast.success("Xóa hồ sơ học tập thành công");
      await loadData();
      setFormMode("create");
      setEditingItem(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Xóa hồ sơ học tập thất bại"));
    }
  }, [loadData]);

  async function handleDone() {
    setSaving(true);
    try {
      await loadData();
      setFormMode("create");
      setEditingItem(null);
      setFormOpen(false);
      setPage(1);
    } finally {
      setSaving(false);
    }
  }

  const activeFilterCount = statusFilter !== "ALL" ? 1 : 0;

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "status",
        title: "Trạng thái học tập",
        options: STATUS_OPTIONS.map((item) => ({
          id: item.value,
          label: item.label,
          checked: statusFilter === item.value,
          onToggle: () => {
            setPage(1);
            setStatusFilter((prev) =>
              prev === item.value ? "ALL" : item.value
            );
          },
        })),
      },
    ],
    [statusFilter]
  );

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }

      if (!keyword) return true;

      return [
        getCourseTitle(item),
        getClassRoomName(item),
        getTeacherName(item),
        getScheduleText(item),
        getRoomText(item),
        getStatusLabel(item.status),
        getPerformanceLabel(item.performanceStatus),
        item.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [items, search, statusFilter]);

  const sortedItems = useMemo(() => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    return [...filteredItems].sort((a, b) => {
      let left: string | number = "";
      let right: string | number = "";

      if (sortKey === "course") {
        left = getCourseTitle(a);
        right = getCourseTitle(b);
      } else if (sortKey === "classRoom") {
        left = getClassRoomName(a);
        right = getClassRoomName(b);
      } else if (sortKey === "teacher") {
        left = getTeacherName(a);
        right = getTeacherName(b);
      } else if (sortKey === "status") {
        left = a.status;
        right = b.status;
      } else {
        left = Number(a.progressPercent || 0);
        right = Number(b.progressPercent || 0);
      }

      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * multiplier;
      }

      return String(left).localeCompare(String(right), "vi") * multiplier;
    });
  }, [filteredItems, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedItems]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const columns = useMemo<AdminTableColumn<StudentStudyItem, StudySortKey>[]>(
    () => [
      {
        id: "course",
        label: "Khóa học",
        sortKey: "course",
        widthClassName: "w-[28%]",
        render: (item) => (
          <AdminEntityCell
            title={getCourseTitle(item)}
            subtitle={getClassRoomName(item)}
            meta={item.isHonored ? item.honorTitle || "Vinh danh" : undefined}
            fallback={getInitials(getCourseTitle(item))}
            icon={item.isHonored ? <Trophy className="h-4 w-4" /> : undefined}
          />
        ),
      },
      {
        id: "teacher",
        label: "Giảng viên",
        sortKey: "teacher",
        widthClassName: "w-[22%]",
        render: (item) => (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
              {getTeacherName(item) || "—"}
            </div>
            <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {getModeLabel(item.mode)} · {getScheduleText(item)}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        label: "Trạng thái",
        sortKey: "status",
        widthClassName: "w-[15%]",
        render: (item) => (
          <div className="space-y-1">
            <AdminStatusBadge tone={getStatusTone(item.status)}>
              {getStatusLabel(item.status)}
            </AdminStatusBadge>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
              {getPerformanceLabel(item.performanceStatus)}
            </div>
          </div>
        ),
      },
      {
        id: "progress",
        label: "Tiến độ",
        sortKey: "progress",
        widthClassName: "w-[18%]",
        render: (item) => (
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span>{item.progressPercent}%</span>
              <span>{item.score}/100</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-sky-600"
                style={{
                  width: `${Math.max(0, Math.min(100, item.progressPercent))}%`,
                }}
              />
            </div>
            <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              Điểm danh {item.attendancePercent}%
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        label: "Hành động",
        widthClassName: "w-[17%]",
        align: "right",
        render: (item) => (
          <div className="flex items-center justify-end gap-1">
            <AdminActionIconButton title="Sửa" onClick={() => openEdit(item)}>
              <Pencil className="h-4 w-4" />
            </AdminActionIconButton>
            <AdminActionIconButton
              danger
              title="Xóa"
              onClick={() => void handleDelete(item)}
            >
              <Trash2 className="h-4 w-4" />
            </AdminActionIconButton>
          </div>
        ),
      },
    ],
    [handleDelete, openEdit]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Gán học viên vào lớp
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <AdminListTable<StudentStudyItem, StudySortKey>
            rows={pagedItems}
            columns={columns}
            rowKey={(item) => item._id}
            loading={loading}
            searchValue={search}
            searchPlaceholder="Tìm khóa học, lớp, giảng viên, lịch học..."
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            filterSections={filterSections}
            activeFilterCount={activeFilterCount}
            onApplyFilters={() => setPage(1)}
            onClearFilters={() => {
              setSearch("");
              setStatusFilter("ALL");
              setPage(1);
            }}
            sortBy={sortKey}
            sortOrder={sortDirection}
            onSortChange={(nextSortBy, nextSortOrder) => {
              setSortKey(nextSortBy);
              setSortDirection(nextSortOrder);
            }}
            onReload={() => void loadData()}
            toolbarEnd={
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                Gán học viên vào lớp
              </button>
            }
            pagination={{
              currentPage,
              totalPages,
              totalItems: sortedItems.length,
              pageSize,
              onPageSizeChange: (nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              },
              onPageChange: setPage,
              pageSizeOptions: [5, 10, 20],
            }}
            emptyText="Chưa có hồ sơ học tập phù hợp"
            labels={{
              apply: "Áp dụng",
              clear: "Xóa lọc",
              filter: "Lọc",
              loading: "Đang tải hồ sơ học tập...",
              noData: "Không có dữ liệu",
              of: "trên",
              reload: "Làm mới",
              rows: "Dòng",
              search: "Tìm kiếm",
              showing: "Hiển thị",
            }}
            tableMinWidthClassName="min-w-full"
          />

          {!loading && items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
              <BookOpen className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-3">
                Bấm “Gán học viên vào lớp” để thêm lớp học cho học viên.
              </p>
            </div>
          ) : null}

        </div>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <CircleCheckBig className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  {formMode === "edit"
                    ? "Cập nhật hồ sơ học tập"
                    : "Gán học viên vào lớp"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <StudyForm
                key={formKey}
                mode={formMode}
                initialData={editingItem}
                studentId={studentId}
                classRooms={classRooms}
                saving={saving}
                onDone={handleDone}
                onCloseForm={closeForm}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
