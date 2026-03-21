"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
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
import { Toaster, toast } from "sonner";
import { http } from "@/lib/utils/http";
import StudentStudyModal from "@/components/ui/admin/students/student-study-modal";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type ViewMode = "active" | "deleted";
type FormMode = "create" | "edit";
type StatusFilter = "ALL" | "ACTIVE" | "LOCKED" | "DELETED";

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
  async listActive(): Promise<StudentItem[]> {
    const res = await http.get("/api/students");
    return pickArray(res.data).map(normalizeStudent);
  },

  async listDeleted(): Promise<StudentItem[]> {
    const res = await http.get("/api/students/deleted");
    return pickArray(res.data).map(normalizeStudent);
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {mode === "create" ? "Thêm học viên" : "Cập nhật học viên"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "create"
                ? "Tạo tài khoản học viên mới"
                : "Chỉnh sửa thông tin học viên"}
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
                Họ tên
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nhập họ tên học viên"
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Nhập email"
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {mode === "create" ? "Mật khẩu" : "Mật khẩu mới"}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder={
                  mode === "create"
                    ? "Nhập mật khẩu"
                    : "Bỏ trống nếu không đổi"
                }
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Đang lưu..."
                : mode === "create"
                ? "Tạo học viên"
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

export default function AdminStudentsPage() {
  const [items, setItems] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

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
          ? await studentApi.listActive()
          : await studentApi.listDeleted();

      setItems(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Không tải được danh sách học viên"));
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
      const matchesKeyword =
        !keyword ||
        `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? item.active && !item.deletedAt
          : statusFilter === "LOCKED"
          ? !item.active && !item.deletedAt
          : Boolean(item.deletedAt);

      return matchesKeyword && matchesStatus;
    });
  }, [items, search, statusFilter]);

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
    const ok = window.confirm(
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
    const ok = window.confirm(`Xóa mềm học viên "${item.name}"?`);
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
    const ok = window.confirm(`Khôi phục học viên "${item.name}"?`);
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
    const ok = window.confirm(
      `Xóa cứng học viên "${item.name}"?\nHành động này không thể hoàn tác.`
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

  return (
    <>
      <Toaster richColors position="top-right" />

      <div className="space-y-6">
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[30px] font-bold tracking-[-0.02em] text-slate-900">
                Student Management
              </h1>
              <p className="mt-2 text-base text-slate-500">
                Tạo, chỉnh sửa và quản lý hồ sơ học viên.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
              <UserRound className="h-4 w-4" />
              Students
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
                placeholder="Search name, email..."
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
                <option value="LOCKED">Locked</option>
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
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[70px_2.2fr_1fr_1fr_1fr_1fr_210px] items-center border-b border-slate-200 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                <div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300"
                  />
                </div>
                <div>Student</div>
                <div>Role</div>
                <div>Status</div>
                <div>Study</div>
                <div>Created</div>
                <div>Actions</div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Đang tải danh sách học viên...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Không có học viên phù hợp.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item._id}
                    className="grid grid-cols-[70px_2.2fr_1fr_1fr_1fr_1fr_210px] items-center border-b border-slate-200 px-6 py-5 last:border-b-0"
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

                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setStudyStudent({
                            id: item._id,
                            name: item.name,
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-[14px] px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-600"
                      >
                        <BookOpen className="h-4 w-4" />
                        Study
                      </button>
                    </div>

                    <div className="text-[14px] text-slate-700">
                      {formatDate(item.createdAt)}
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