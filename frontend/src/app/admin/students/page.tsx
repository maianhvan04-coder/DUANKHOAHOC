"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { http } from "@/lib/utils/http";
import StudentStudyModal from "@/components/ui/admin/students/student-study-modal";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import {
  makePaginationMeta,
  readPaginationMeta,
  type ListResult,
  type PaginationMeta,
  type SortDirection,
} from "@/lib/utils/admin-list";
import { toastConfirm } from "@/lib/utils/toast-confirm";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type ViewMode = "active" | "deleted";
type FormMode = "create" | "edit";
type StatusFilter = "ALL" | "ACTIVE" | "LOCKED" | "DELETED";
type StudentSortKey = "name" | "email" | "status" | "createdAt";

type UnknownRecord = Record<string, unknown>;

type StudentItem = {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type StudentFormState = {
  name: string;
  email: string;
  password: string;
  active: boolean;
};

type CreateStudentPayload = {
  name: string;
  email: string;
  password?: string;
  active?: boolean;
  role?: string;
};

type UpdateStudentPayload = {
  name?: string;
  email?: string;
  password?: string;
  active?: boolean;
};

const EMPTY_FORM: StudentFormState = {
  name: "",
  email: "",
  password: "",
  active: true,
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function pickArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (isRecord(raw)) {
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.students)) return raw.students;
    if (Array.isArray(raw.users)) return raw.users;
  }

  return [];
}

function normalizeStudent(raw: unknown): StudentItem {
  const obj = isRecord(raw) ? raw : {};

  return {
    _id: asString(obj._id) || asString(obj.id),
    name: asString(obj.name),
    email: asString(obj.email),
    role: asString(obj.role, "STUDENT"),
    active: asBoolean(obj.active, asBoolean(obj.isActive, true)),
    deletedAt: typeof obj.deletedAt === "string" ? obj.deletedAt : null,
    createdAt: asString(obj.createdAt),
    updatedAt: asString(obj.updatedAt),
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (!isRecord(error)) return fallback;

  const response = error.response;
  if (isRecord(response)) {
    const data = response.data;
    if (isRecord(data) && typeof data.message === "string") {
      return data.message;
    }
  }

  if (typeof error.message === "string") {
    return error.message;
  }

  return fallback;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase();
}

function getStatusLabel(item: StudentItem, viewMode: ViewMode): string {
  if (viewMode === "deleted" || item.deletedAt) return "DELETED";
  return item.active ? "ACTIVE" : "LOCKED";
}

function getStatusStyle(item: StudentItem, viewMode: ViewMode): string {
  if (viewMode === "deleted" || item.deletedAt) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return item.active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

function getInitialForm(mode: FormMode, initialData: StudentItem | null): StudentFormState {
  if (mode === "edit" && initialData) {
    return {
      name: initialData.name,
      email: initialData.email,
      password: "",
      active: initialData.active,
    };
  }

  return EMPTY_FORM;
}

const studentApi = {
  async listActive(query?: {
    q?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: SortDirection;
    page?: number;
    limit?: number;
  }): Promise<ListResult<StudentItem>> {
    const res = await http.get("/api/students", { params: query });
    const items = pickArray(res.data).map(normalizeStudent);
    return {
      items,
      pagination: readPaginationMeta(res.data, items.length, query?.page, query?.limit),
    };
  },

  async listDeleted(query?: {
    q?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: SortDirection;
    page?: number;
    limit?: number;
  }): Promise<ListResult<StudentItem>> {
    const res = await http.get("/api/students/deleted", { params: query });
    const items = pickArray(res.data).map(normalizeStudent);
    return {
      items,
      pagination: readPaginationMeta(res.data, items.length, query?.page, query?.limit),
    };
  },

  async create(payload: CreateStudentPayload): Promise<void> {
    await http.post("/api/students", payload);
  },

  async update(id: string, payload: UpdateStudentPayload): Promise<void> {
    await http.put(`/api/students/${id}`, payload);
  },

  async setActive(id: string, active: boolean): Promise<void> {
    await http.patch(`/api/students/${id}/active`, { active });
  },

  async softDelete(id: string): Promise<void> {
    await http.delete(`/api/students/${id}`);
  },

  async restore(id: string): Promise<void> {
    await http.patch(`/api/students/${id}/restore`);
  },

  async forceDelete(id: string): Promise<void> {
    await http.delete(`/api/students/${id}/force`);
  },
};

type StudentFormModalProps = {
  open: boolean;
  mode: FormMode;
  initialData: StudentItem | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: StudentFormState) => Promise<void>;
};

function StudentFormModal({
  open,
  mode,
  initialData,
  saving,
  onClose,
  onSubmit,
}: StudentFormModalProps) {
  const [form, setForm] = useState<StudentFormState>(() =>
    getInitialForm(mode, initialData)
  );
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    if (mode === "create" && !form.password.trim()) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }

    await onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      active: form.active,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
          <div>
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {mode === "create" ? "Thêm học viên" : "Cập nhật học viên"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === "create"
                ? "Tạo tài khoản học viên mới"
                : "Chỉnh sửa thông tin học viên"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Họ tên
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nhập họ tên học viên"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Nhập email"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {mode === "create" ? "Mật khẩu" : "Đổi mật khẩu"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder={
                    mode === "create"
                      ? "Nhập mật khẩu"
                      : "Nhập mật khẩu mới..."
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white py-0 pl-4 pr-12 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={saving}
                  className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-2xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {mode === "edit" ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Bỏ trống nếu không muốn đổi mật khẩu.
                </p>
              ) : null}
            </div>
          </div>

          <div className="-mx-6 mt-6 flex items-center justify-end gap-3 border-t border-slate-200 px-6 pt-4 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Đóng
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Đang lưu..."
                : mode === "create"
                ? "Tạo học viên"
                : "Lưu thay đổi"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminStudentsPage() {
  const [items, setItems] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<StudentSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [serverPagination, setServerPagination] = useState<PaginationMeta>(
    makePaginationMeta(0, 1, 10)
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<StudentItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [studyStudent, setStudyStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  async function loadData() {
    setLoading(true);

    try {
      const data =
        viewMode === "active"
          ? await studentApi.listActive({
              q: search,
              status: statusFilter,
              sortBy: sortKey,
              sortOrder: sortDirection,
              page,
              limit: rowsPerPage,
            })
          : await studentApi.listDeleted({
              q: search,
              status: statusFilter,
              sortBy: sortKey,
              sortOrder: sortDirection,
              page,
              limit: rowsPerPage,
            });

      setItems(data.items);
      setServerPagination(data.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không tải được danh sách học viên"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [viewMode, search, statusFilter, sortKey, sortDirection, page, rowsPerPage]);

  const pagedItems = items;
  const totalPages = serverPagination.totalPages;
  const currentPage = serverPagination.page;
  const from =
    serverPagination.total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const to = Math.min(currentPage * rowsPerPage, serverPagination.total);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function openCreate() {
    setFormMode("create");
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: StudentItem) {
    setFormMode("edit");
    setEditingItem(item);
    setFormOpen(true);
  }

  async function handleSubmitForm(values: StudentFormState) {
    setSaving(true);

    try {
      if (formMode === "create") {
        await studentApi.create({
          name: values.name,
          email: values.email,
          password: values.password,
          active: values.active,
          role: "STUDENT",
        });
        toast.success("Tạo học viên thành công");
      } else if (editingItem) {
        const payload: UpdateStudentPayload = {
          name: values.name,
          email: values.email,
          active: values.active,
        };

        if (values.password.trim()) {
          payload.password = values.password.trim();
        }

        await studentApi.update(editingItem._id, payload);
        toast.success("Cập nhật học viên thành công");
      }

      setFormOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Lưu học viên thất bại"));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: StudentItem) {
    const nextActive = !item.active;
    const ok = await toastConfirm(
      nextActive
        ? `Mở hoạt động cho "${item.name}"?`
        : `Khóa hoạt động của "${item.name}"?`
    );

    if (!ok) return;

    try {
      await studentApi.setActive(item._id, nextActive);
      toast.success(nextActive ? "Đã mở hoạt động" : "Đã khóa học viên");
      await loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Cập nhật trạng thái thất bại"));
    }
  }

  async function handleSoftDelete(item: StudentItem) {
    const ok = await toastConfirm(`Xóa mềm học viên "${item.name}"?`);
    if (!ok) return;

    try {
      await studentApi.softDelete(item._id);
      toast.success("Đã xóa mềm học viên");
      await loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Xóa mềm thất bại"));
    }
  }

  async function handleRestore(item: StudentItem) {
    const ok = await toastConfirm(`Khôi phục học viên "${item.name}"?`);
    if (!ok) return;

    try {
      await studentApi.restore(item._id);
      toast.success("Khôi phục học viên thành công");
      await loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Khôi phục thất bại"));
    }
  }

  async function handleForceDelete(item: StudentItem) {
    const ok = await toastConfirm(
      `Xóa cứng học viên "${item.name}"? Hành động này không thể hoàn tác.`
    );
    if (!ok) return;

    try {
      await studentApi.forceDelete(item._id);
      toast.success("Đã xóa cứng học viên");
      await loadData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Xóa cứng thất bại"));
    }
  }

  const activeFilterCount = statusFilter !== "ALL" ? 1 : 0;

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "status",
        title: "Status",
        options: [
          {
            id: "status-all",
            label: "All Status",
            checked: statusFilter === "ALL",
            onToggle: () => {
              setStatusFilter("ALL");
              setPage(1);
            },
          },
          {
            id: "status-active",
            label: "ACTIVE",
            checked: statusFilter === "ACTIVE",
            onToggle: () => {
              setStatusFilter("ACTIVE");
              setPage(1);
            },
          },
          {
            id: "status-locked",
            label: "LOCKED",
            checked: statusFilter === "LOCKED",
            onToggle: () => {
              setStatusFilter("LOCKED");
              setPage(1);
            },
          },
        ],
      },
    ],
    [statusFilter]
  );

  const tableColumns: AdminTableColumn<StudentItem, StudentSortKey>[] = [
      {
        id: "student",
        label: "Student",
        sortKey: "name",
        widthClassName: "w-[31%]",
        render: (item) => (
          <AdminEntityCell
            title={item.name || "--"}
            subtitle={item.email || "--"}
            fallback={getInitials(item.name)}
          />
        ),
      },
      {
        id: "role",
        label: "Role",
        widthClassName: "w-[13%]",
        render: (item) => (
          <AdminStatusBadge tone="neutral" className="min-w-[92px]">
            {item.role || "STUDENT"}
          </AdminStatusBadge>
        ),
      },
      {
        id: "status",
        label: "Status",
        sortKey: "status",
        widthClassName: "w-[14%]",
        render: (item) => {
          const label = getStatusLabel(item, viewMode);
          return (
            <AdminStatusBadge
              tone={
                label === "ACTIVE"
                  ? "success"
                  : label === "LOCKED"
                    ? "warning"
                    : "danger"
              }
            >
              {label}
            </AdminStatusBadge>
          );
        },
      },
      {
        id: "created",
        label: "Created",
        sortKey: "createdAt",
        widthClassName: "w-[13%]",
        render: (item) => formatDate(item.createdAt),
      },
      {
        id: "actions",
        label: <div className="text-right">Actions</div>,
        widthClassName: "w-[24%]",
        align: "right",
        render: (item) => (
          <div className="flex items-center justify-end gap-1">
            <AdminActionIconButton
              title="Gán học viên vào lớp"
              onClick={() =>
                setStudyStudent({
                  id: item._id,
                  name: item.name,
                })
              }
            >
              <BookOpen className="h-4 w-4" />
            </AdminActionIconButton>
            <AdminActionIconButton title="Edit" onClick={() => openEdit(item)}>
              <Pencil className="h-4 w-4" />
            </AdminActionIconButton>
            <AdminActionIconButton
              title={item.active ? "Lock" : "Unlock"}
              onClick={() => void handleToggleActive(item)}
            >
              {item.active ? (
                <Lock className="h-4 w-4" />
              ) : (
                <LockOpen className="h-4 w-4" />
              )}
            </AdminActionIconButton>
          </div>
        ),
      },
  ];

  return (
    <>

      <div className="space-y-6">
        <section className="hidden rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="hidden">
              <p className="mt-2 text-base text-slate-500">
                Tạo, chỉnh sửa và quản lý hồ sơ học viên.
              </p>
            </div>

            <div className="inline-flex rounded-[22px] border border-slate-200 bg-slate-50 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setViewMode("active");
                  setPage(1);
                }}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                  viewMode === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-slate-700 hover:bg-white"
                )}
              >
                <UserRound className="h-4 w-4" />
                Students
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode("deleted");
                  setPage(1);
                }}
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

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 items-center gap-2 rounded-[18px] bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus className="h-4.5 w-4.5" />
                New Student
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

          <div className="hidden">
            <button
              type="button"
              onClick={() => {
                setViewMode("active");
                setPage(1);
              }}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                viewMode === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-700 hover:bg-white"
              )}
            >
              <UserRound className="h-4 w-4" />
              Students
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("deleted");
                setPage(1);
              }}
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

        <AdminListTable<StudentItem, StudentSortKey>
          rows={pagedItems}
          columns={tableColumns}
          rowKey={(item) => item._id}
          loading={loading}
          searchValue={search}
          searchPlaceholder="Search name, email..."
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
            setPage(1);
          }}
          onReload={() => void loadData()}
          toolbarEnd={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              <Plus className="h-4.5 w-4.5" />
              New Student
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
          emptyText="Không có học viên phù hợp."
          tableMinWidthClassName="min-w-full"
        />

        <section className="hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_190px_140px_140px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email..."
                className="h-[54px] w-full rounded-[20px] border border-slate-300 bg-white pl-14 pr-4 text-[15px] outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(1);
                }}
                className="h-[54px] w-full appearance-none rounded-[20px] border border-slate-300 bg-white px-5 pr-12 text-[15px] outline-none transition focus:border-slate-400"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="LOCKED">Locked</option>
                <option value="DELETED">Deleted</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            </div>

            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value as StudentSortKey);
                  setPage(1);
                }}
                className="h-[54px] w-full appearance-none rounded-[20px] border border-slate-300 bg-white px-5 pr-12 text-[15px] outline-none transition focus:border-slate-400"
              >
                <option value="createdAt">Sort: Created</option>
                <option value="name">Sort: Name</option>
                <option value="email">Sort: Email</option>
                <option value="status">Sort: Status</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            </div>

            <div className="relative">
              <select
                value={sortDirection}
                onChange={(e) => {
                  setSortDirection(e.target.value as SortDirection);
                  setPage(1);
                }}
                className="h-[54px] w-full appearance-none rounded-[20px] border border-slate-300 bg-white px-5 pr-12 text-[15px] outline-none transition focus:border-slate-400"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            </div>

            <div className="flex h-[54px] items-center justify-center rounded-[20px] bg-slate-100 px-5 text-[15px] font-bold text-slate-700">
              {serverPagination.total} FOUND
            </div>
          </div>
        </section>

        <section className="hidden overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[70px_2.2fr_1fr_1fr_1fr_260px] items-center border-b border-slate-200 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                <div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300"
                  />
                </div>
                <div>Student</div>
                <div>Role</div>
                <div>Status</div>
                <div>Created</div>
                <div>Actions</div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Đang tải danh sách học viên...
                </div>
              ) : pagedItems.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Không có học viên phù hợp.
                </div>
              ) : (
                pagedItems.map((item) => (
                  <div
                    key={item._id}
                    className="grid grid-cols-[70px_2.2fr_1fr_1fr_1fr_260px] items-center border-b border-slate-200 px-6 py-5 last:border-b-0"
                  >
                    <div>
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-slate-300"
                      />
                    </div>

                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-sky-100 to-indigo-100 text-sm font-bold text-slate-700">
                        {getInitials(item.name)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-[17px] font-semibold text-slate-900">
                          {item.name}
                        </h3>
                        <p className="truncate text-[14px] text-slate-500">
                          {item.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-[15px] text-slate-700">
                      {item.role || "STUDENT"}
                    </div>

                    <div>
                      <span
                        className={cn(
                          "inline-flex min-w-[108px] items-center justify-center rounded-full border px-4 py-2 text-[13px] font-semibold",
                          getStatusStyle(item, viewMode)
                        )}
                      >
                        {getStatusLabel(item, viewMode)}
                      </span>
                    </div>

                    <div className="text-[14px] text-slate-700">
                      {formatDate(item.createdAt)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setStudyStudent({
                            id: item._id,
                            name: item.name,
                          })
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                        title="Gán học viên vào lớp"
                      >
                        <BookOpen className="h-4 w-4" />
                      </button>
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
                            onClick={() => void handleToggleActive(item)}
                            className={cn(
                              "inline-flex h-10 w-10 items-center justify-center rounded-[14px] border transition",
                              item.active
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            )}
                            title={item.active ? "Lock" : "Unlock"}
                          >
                            {item.active ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <LockOpen className="h-4 w-4" />
                            )}
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

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {from}-{to}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {serverPagination.total}
                </span>
              </span>

              <span>Rows</span>
              <div className="relative w-24">
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-10 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-3 pr-8 text-sm outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-emerald-700 px-3 text-sm font-semibold text-white">
                {currentPage} / {totalPages}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <StudentFormModal
        key={`${formMode}-${editingItem?._id ?? "new"}-${formOpen ? "open" : "closed"}`}
        open={formOpen}
        mode={formMode}
        initialData={editingItem}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmitForm}
      />

      <StudentStudyModal
        open={Boolean(studyStudent)}
        studentId={studyStudent?.id ?? ""}
        studentName={studyStudent?.name ?? ""}
        onClose={() => setStudyStudent(null)}
      />
    </>
  );
}
