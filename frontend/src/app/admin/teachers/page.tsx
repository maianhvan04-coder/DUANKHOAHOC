"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Users,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  teacherApi,
  type CreateTeacherPayload,
  type TeacherItem,
  type UpdateTeacherPayload,
} from "@/app/api/teacher.api";
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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "T";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function formatDate(value?: string) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type ViewMode = "active" | "deleted";
type FormMode = "create" | "edit";
type StatusFilter = "all" | "active" | "inactive";
type TeacherSortKey =
  | "name"
  | "specialty"
  | "courses"
  | "students"
  | "rating"
  | "createdAt";

type TeacherFormState = {
  name: string;
  email: string;
  password: string;
  specialty: string;
  phone: string;
  degree: string;
  experience: string;
  achievement: string;
  rating: string;
  active: boolean;
};

const INITIAL_FORM: TeacherFormState = {
  name: "",
  email: "",
  password: "",
  specialty: "",
  phone: "",
  degree: "",
  experience: "",
  achievement: "",
  rating: "4.8",
  active: true,
};

function buildBioFromForm(degree: string, experience: string) {
  const lines = [
    degree.trim(),
    ...experience
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  ].filter(Boolean);

  return lines.map((line) => `- ${line}`).join("\n");
}

function StatusBadge({
  active,
  disabled,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const clickable = !disabled && !!onClick;

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className={cn(
        "inline-flex min-w-22.5 items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600",
        clickable && "hover:scale-[1.02] hover:shadow-sm",
        !clickable && "cursor-default"
      )}
      title={clickable ? "Bấm để đổi trạng thái" : undefined}
    >
      {active ? "ACTIVE" : "INACTIVE"}
    </button>
  );
}

function TeacherModal({
  open,
  mode,
  value,
  saving,
  avatarFile,
  currentAvatar,
  onClose,
  onChange,
  onPickAvatar,
  onSubmit,
}: {
  open: boolean;
  mode: FormMode;
  value: TeacherFormState;
  saving: boolean;
  avatarFile: File | null;
  currentAvatar?: string;
  onClose: () => void;
  onChange: (patch: Partial<TeacherFormState>) => void;
  onPickAvatar: (file: File | null) => void;
  onSubmit: () => void;
}) {
  const previewUrl = useMemo(() => {
    if (!avatarFile) return "";
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!open) return null;

  const displayAvatar = previewUrl || currentAvatar || "";

  return (
    <div className="fixed inset-0 z-200 bg-slate-950/40 p-3 md:p-5">
      <div className="flex h-full items-center justify-center">
        <div className="flex h-[92vh] w-full max-w-215 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-5">
            <div className="pr-3">
              <h2 className="text-[18px] font-bold text-slate-900">
                {mode === "create" ? "Thêm giảng viên" : "Cập nhật giảng viên"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {mode === "create"
                  ? "Tạo hồ sơ giảng viên mới."
                  : "Chỉnh sửa thông tin giảng viên."}
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
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Họ tên
                </label>
                <input
                  value={value.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder="Nhập tên giảng viên"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  value={value.email}
                  onChange={(e) => onChange({ email: e.target.value })}
                  disabled={mode === "edit"}
                  placeholder="teacher@email.com"
                  className={cn(
                    "h-11 w-full rounded-2xl border px-4 text-sm outline-none transition",
                    mode === "edit"
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                      : "border-slate-200 bg-white focus:border-emerald-500"
                  )}
                />
                {mode === "edit" && (
                  <p className="mt-1 text-xs text-slate-500">
                    Email không được thay đổi sau khi tạo.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {mode === "create" ? "Mật khẩu" : "Mật khẩu mới"}
                </label>
                <input
                  type="password"
                  value={value.password}
                  onChange={(e) => onChange({ password: e.target.value })}
                  placeholder="******"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Chuyên môn
                </label>
                <input
                  value={value.specialty}
                  onChange={(e) => onChange({ specialty: e.target.value })}
                  placeholder="IELTS, Web, Marketing..."
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Điện thoại
                </label>
                <input
                  value={value.phone}
                  onChange={(e) => onChange({ phone: e.target.value })}
                  placeholder="09xxxxxxxx"
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Bằng cấp
                </label>
                <textarea
                  rows={3}
                  value={value.degree}
                  onChange={(e) => onChange({ degree: e.target.value })}
                  placeholder="Ví dụ: Cử nhân CNTT"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Đánh giá
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={value.rating}
                  onChange={(e) =>
                    onChange({ rating: e.target.value.replace(",", ".") })
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Ảnh đại diện
                </label>

                <div className="rounded-2xl border border-slate-200 p-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-600
                      file:mr-3 file:rounded-xl file:border-0
                      file:bg-emerald-50 file:px-3.5 file:py-2
                      file:font-semibold file:text-emerald-700
                      hover:file:bg-emerald-100"
                  />

                  {avatarFile && (
                    <p className="mt-2 text-xs text-slate-500">
                      Đã chọn:{" "}
                      <span className="font-medium">{avatarFile.name}</span>
                    </p>
                  )}

                  {displayAvatar ? (
                    <div className="mt-3 flex items-start gap-3">
                      {displayAvatar.startsWith("blob:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={displayAvatar}
                          alt="Teacher preview"
                          className="h-24 w-24 rounded-2xl border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200">
                          <Image
                            src={displayAvatar}
                            alt="Teacher preview"
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="text-xs text-slate-500">
                          Xem trước ảnh đại diện
                        </p>

                        {avatarFile && (
                          <button
                            type="button"
                            onClick={() => onPickAvatar(null)}
                            className="mt-2 inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Bỏ ảnh mới chọn
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Kinh nghiệm
                </label>
                <textarea
                  rows={5}
                  value={value.experience}
                  onChange={(e) => onChange({ experience: e.target.value })}
                  placeholder="Mỗi dòng là một ý kinh nghiệm..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Award className="h-4 w-4" />
                  Thành tích
                </label>
                <textarea
                  rows={4}
                  value={value.achievement}
                  onChange={(e) => onChange({ achievement: e.target.value })}
                  placeholder="Ví dụ: Top giảng viên xuất sắc, đào tạo hơn 1000 học viên..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                />
              </div>

              <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={value.active}
                  onChange={(e) => onChange({ active: e.target.checked })}
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
                  ? "Tạo giảng viên"
                  : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTeachersPage() {
  const [items, setItems] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<TeacherSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [serverPagination, setServerPagination] = useState<PaginationMeta>(
    makePaginationMeta(0, 1, 5)
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAvatar, setEditingAvatar] = useState("");
  const [form, setForm] = useState<TeacherFormState>(INITIAL_FORM);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await teacherApi.listPaged({
        deleted: viewMode === "deleted",
        q: search,
        specialty: specialtyFilter,
        status: statusFilter,
        sortBy: sortKey,
        sortOrder: sortDirection,
        page,
        limit: rowsPerPage,
      });
      setItems(data.items);
      setServerPagination(data.pagination);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách giảng viên");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    search,
    sortDirection,
    sortKey,
    specialtyFilter,
    statusFilter,
    viewMode,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const specialties = useMemo(() => {
    const unique = new Set<string>();
    items.forEach((item) => {
      if (item.specialty?.trim()) unique.add(item.specialty.trim());
    });
    return ["all", ...Array.from(unique)];
  }, [items]);

  const pagedItems = items;
  const totalPages = serverPagination.totalPages;

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setEditingAvatar("");
    setFormMode("create");
    setAvatarFile(null);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(item: TeacherItem) {
    setFormMode("edit");
    setEditingId(item._id);
    setEditingAvatar(item.avatar || "");
    setForm({
      name: item.name,
      email: item.email,
      password: "",
      specialty: item.specialty,
      phone: item.phone,
      degree: item.degree || "",
      experience: item.experience || "",
      achievement: item.achievement || "",
      rating: String(item.rating || 4.8),
      active: item.active,
    });
    setAvatarFile(null);
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) return toast.warning("Vui lòng nhập họ tên");
    if (!form.email.trim() && formMode === "create") {
      return toast.warning("Vui lòng nhập email");
    }
    if (formMode === "create" && !form.password.trim()) {
      return toast.warning("Vui lòng nhập mật khẩu");
    }

    const rating = Number(String(form.rating || "4.8").replace(",", "."));
    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      return toast.warning("Rating phải nằm trong khoảng 0 đến 5");
    }

    try {
      setSaving(true);

      if (formMode === "create") {
        const body: CreateTeacherPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          specialty: form.specialty.trim(),
          phone: form.phone.trim(),
          degree: form.degree.trim(),
          experience: form.experience.trim(),
          achievement: form.achievement.trim(),
          bio: buildBioFromForm(form.degree, form.experience),
          rating,
          active: form.active,
          avatarFile,
        };

        const created = await teacherApi.create(body);

        if (viewMode === "active") {
          setItems((prev) => [created, ...prev]);
        }

        toast.success("Tạo giảng viên thành công");
      } else if (editingId) {
        const body: UpdateTeacherPayload = {
          name: form.name.trim(),
          specialty: form.specialty.trim(),
          phone: form.phone.trim(),
          degree: form.degree.trim(),
          experience: form.experience.trim(),
          achievement: form.achievement.trim(),
          bio: buildBioFromForm(form.degree, form.experience),
          rating,
          active: form.active,
          avatarFile,
        };

        if (form.password.trim()) {
          body.password = form.password;
        }

        const updated = await teacherApi.update(editingId, body);

        setItems((prev) =>
          prev.map((item) => (item._id === editingId ? updated : item))
        );

        toast.success("Cập nhật giảng viên thành công");
      }

      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Lưu giảng viên thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(item: TeacherItem) {
    const nextActive = !item.active;

    setItems((prev) =>
      prev.map((x) => (x._id === item._id ? { ...x, active: nextActive } : x))
    );

    try {
      await teacherApi.setStatus(item._id, nextActive);
      toast.success(
        nextActive ? "Đã kích hoạt giảng viên" : "Đã ngừng hoạt động giảng viên"
      );
    } catch (error) {
      console.error(error);
      setItems((prev) =>
        prev.map((x) => (x._id === item._id ? { ...x, active: item.active } : x))
      );
      toast.error("Đổi trạng thái thất bại");
    }
  }

  async function handleSoftDelete(item: TeacherItem) {
    if (!window.confirm(`Xóa mềm giảng viên "${item.name}"?`)) return;

    try {
      await teacherApi.softDelete(item._id);
      setItems((prev) => prev.filter((x) => x._id !== item._id));
      toast.success("Xóa mềm thành công");
    } catch (error) {
      console.error(error);
      toast.error("Xóa mềm thất bại");
    }
  }

  async function handleRestore(item: TeacherItem) {
    try {
      await teacherApi.restore(item._id);
      setItems((prev) => prev.filter((x) => x._id !== item._id));
      toast.success("Khôi phục thành công");
    } catch (error) {
      console.error(error);
      toast.error("Khôi phục thất bại");
    }
  }

  async function handleHardDelete(item: TeacherItem) {
    if (!window.confirm(`Xóa cứng "${item.name}"?`)) return;

    try {
      await teacherApi.hardDelete(item._id);
      setItems((prev) => prev.filter((x) => x._id !== item._id));
      toast.success("Xóa cứng thành công");
    } catch (error) {
      console.error(error);
      toast.error("Xóa cứng thất bại");
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectPage() {
    const pageIds = pagedItems.map((item) => item._id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  }

  const allPageSelected =
    pagedItems.length > 0 &&
    pagedItems.every((item) => selectedIds.includes(item._id));

  const activeFilterCount =
    (specialtyFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0);

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "specialty",
        title: "Specialty",
        options: [
          {
            id: "specialty-all",
            label: "All Specialty",
            checked: specialtyFilter === "all",
            onToggle: () => {
              setSpecialtyFilter("all");
              setPage(1);
            },
          },
          ...specialties
            .filter((specialty) => specialty !== "all")
            .map((specialty) => ({
              id: `specialty-${specialty}`,
              label: specialty,
              checked: specialtyFilter === specialty,
              onToggle: () => {
                setSpecialtyFilter(specialty);
                setPage(1);
              },
            })),
        ],
      },
      {
        id: "status",
        title: "Status",
        options: [
          {
            id: "status-all",
            label: "All Status",
            checked: statusFilter === "all",
            onToggle: () => {
              setStatusFilter("all");
              setPage(1);
            },
          },
          {
            id: "status-active",
            label: "ACTIVE",
            checked: statusFilter === "active",
            onToggle: () => {
              setStatusFilter("active");
              setPage(1);
            },
          },
          {
            id: "status-inactive",
            label: "INACTIVE",
            checked: statusFilter === "inactive",
            onToggle: () => {
              setStatusFilter("inactive");
              setPage(1);
            },
          },
        ],
      },
    ],
    [specialties, specialtyFilter, statusFilter]
  );

  const tableColumns: AdminTableColumn<TeacherItem, TeacherSortKey>[] = [
      {
        id: "select",
        label: (
          <input
            type="checkbox"
            checked={allPageSelected}
            onChange={toggleSelectPage}
            className="h-4 w-4 rounded border-slate-300"
          />
        ),
        widthClassName: "w-[56px]",
        render: (item) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(item._id)}
            onChange={() => toggleSelectOne(item._id)}
            className="h-4 w-4 rounded border-slate-300"
          />
        ),
      },
      {
        id: "teacher",
        label: "Teacher",
        sortKey: "name",
        widthClassName: "w-[340px]",
        render: (item) => (
          <AdminEntityCell
            title={item.name || "--"}
            subtitle={item.email || "--"}
            meta={item.achievement ? `Thanh tich: ${item.achievement}` : undefined}
            image={item.avatar}
            fallback={getInitials(item.name)}
          />
        ),
      },
      {
        id: "specialty",
        label: "Specialty",
        sortKey: "specialty",
        widthClassName: "w-[160px]",
        render: (item) => (
          <div className="truncate text-sm">{item.specialty || "--"}</div>
        ),
      },
      {
        id: "courses",
        label: "Courses",
        sortKey: "courses",
        widthClassName: "w-[110px]",
        align: "center",
        render: (item) => (
          <span className="font-semibold">{formatNumber(item.productCount)}</span>
        ),
      },
      {
        id: "students",
        label: "Students",
        sortKey: "students",
        widthClassName: "w-[120px]",
        align: "center",
        render: (item) => (
          <span className="font-semibold">{formatNumber(item.totalStudents)}</span>
        ),
      },
      {
        id: "rating",
        label: "Rating",
        sortKey: "rating",
        widthClassName: "w-[100px]",
        align: "center",
        render: (item) => item.rating.toFixed(1),
      },
      {
        id: "status",
        label: "Status",
        widthClassName: "w-[130px]",
        align: "center",
        render: (item) => (
          <AdminStatusBadge tone={item.active ? "success" : "neutral"}>
            {item.active ? "ACTIVE" : "INACTIVE"}
          </AdminStatusBadge>
        ),
      },
      {
        id: "created",
        label: "Created",
        sortKey: "createdAt",
        widthClassName: "w-[130px]",
        align: "center",
        render: (item) => formatDate(item.createdAt),
      },
      {
        id: "actions",
        label: <div className="text-right">Actions</div>,
        widthClassName: "w-[130px]",
        align: "right",
        render: (item) => (
          <div className="flex items-center justify-end gap-2">
            {viewMode === "active" ? (
              <>
                <AdminActionIconButton title="Edit" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </AdminActionIconButton>
                <AdminActionIconButton
                  danger
                  title="Delete"
                  onClick={() => handleSoftDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </AdminActionIconButton>
              </>
            ) : (
              <>
                <AdminActionIconButton title="Restore" onClick={() => handleRestore(item)}>
                  <RotateCcw className="h-4 w-4" />
                </AdminActionIconButton>
                <AdminActionIconButton
                  danger
                  title="Delete permanently"
                  onClick={() => handleHardDelete(item)}
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

      <section className="hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setViewMode("active");
                  setSelectedIds([]);
                  setPage(1);
                }}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition",
                  viewMode === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-slate-600 hover:bg-white"
                )}
              >
                <Users className="h-4 w-4" />
                Teachers
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode("deleted");
                  setSelectedIds([]);
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
                Deleted
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
              New Teacher
            </button>

            <button
              type="button"
              onClick={loadData}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <AdminListTable<TeacherItem, TeacherSortKey>
        rows={pagedItems}
        columns={tableColumns}
        rowKey={(item) => item._id}
        loading={loading}
        searchValue={search}
        searchPlaceholder="Search name, email, specialty, achievement..."
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filterSections={filterSections}
        activeFilterCount={activeFilterCount}
        onApplyFilters={() => setPage(1)}
        onClearFilters={() => {
          setSearch("");
          setSpecialtyFilter("all");
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
        onReload={loadData}
        toolbarStart={
          <div className="inline-flex rounded-[22px] border border-slate-200 bg-slate-50 p-1.5 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => {
                setViewMode("active");
                setSelectedIds([]);
                setPage(1);
              }}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                viewMode === "active"
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
                  : "text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-white/10"
              )}
            >
              <Users className="h-4 w-4" />
              Teachers
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("deleted");
                setSelectedIds([]);
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
              Deleted
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
            New Teacher
          </button>
        }
        pagination={{
          currentPage: page,
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
        emptyText="Không có dữ liệu phù hợp"
        tableMinWidthClassName="min-w-[1280px]"
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
              placeholder="Search name, email, specialty, achievement..."
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div className="relative w-full xl:w-55">
            <select
              value={specialtyFilter}
              onChange={(e) => {
                setSpecialtyFilter(e.target.value);
                setPage(1);
              }}
              className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="all">All Specialty</option>
              {specialties
                .filter((x) => x !== "all")
                .map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="relative w-full xl:w-42.5">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
              className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="relative w-full xl:w-45">
            <select
              value={sortKey}
              onChange={(e) => {
                setSortKey(e.target.value as TeacherSortKey);
                setPage(1);
              }}
              className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="createdAt">Sort: Created</option>
              <option value="name">Sort: Name</option>
              <option value="specialty">Sort: Specialty</option>
              <option value="courses">Sort: Courses</option>
              <option value="students">Sort: Students</option>
              <option value="rating">Sort: Rating</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="relative w-full xl:w-35">
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
            {serverPagination.total} FOUND
          </div>
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-265 w-full table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                <th className="w-13 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectPage}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                </th>
                <th className="w-82.5 px-4 py-4 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Teacher
                </th>
                <th className="w-37.5 px-4 py-4 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Specialty
                </th>
                <th className="w-27.5 px-4 py-4 text-center text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Courses
                </th>
                <th className="w-31.25 px-4 py-4 text-center text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Students
                </th>
                <th className="w-27.5 px-4 py-4 text-center text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Rating
                </th>
                <th className="w-35 px-4 py-4 text-center text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="w-30 px-4 py-4 text-center text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </th>
                <th className="w-32.5 px-4 py-4 text-right text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Không có dữ liệu phù hợp
                  </td>
                </tr>
              ) : (
                pagedItems.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-200 transition hover:bg-slate-50/60 last:border-b-0"
                  >
                    <td className="px-4 py-3.5 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => toggleSelectOne(item._id)}
                        className="h-5 w-5 rounded border-slate-300"
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {item.avatar ? (
                          <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                            <Image
                              src={item.avatar}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-base font-semibold text-slate-700">
                            {getInitials(item.name)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="truncate text-[16px] font-semibold text-slate-900">
                            {item.name}
                          </div>
                          <div className="truncate text-[13px] text-slate-500">
                            {item.email}
                          </div>
                          {item.achievement ? (
                            <div className="mt-1 truncate text-[12px] text-slate-500">
                              <span className="font-medium text-slate-700">
                                Thành tích:
                              </span>{" "}
                              {item.achievement}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 ">
                      <div className="truncate text-sm text-slate-700">
                        {item.specialty || "--"}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 text-sm text-slate-800">
                        <BookOpen className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">{item.productCount}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 text-sm text-slate-800">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">
                          {formatNumber(item.totalStudents)}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-800">
                        <Star className="h-4 w-4 fill-current text-amber-500" />
                        {item.rating.toFixed(1)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge
                        active={item.active}
                        disabled={viewMode !== "active"}
                        onClick={() => handleToggleStatus(item)}
                      />
                    </td>

                    <td className="px-4 py-3.5 text-center text-sm text-slate-600">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {viewMode === "active" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition hover:bg-slate-50"
                              title="Sửa"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSoftDelete(item)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
                              title="Xóa mềm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestore(item)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition hover:bg-slate-50"
                              title="Khôi phục"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleHardDelete(item)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
                              title="Xóa cứng"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {serverPagination.total === 0 ? 0 : (page - 1) * rowsPerPage + 1}-
                {Math.min(page * rowsPerPage, serverPagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {serverPagination.total}
              </span>
            </span>

            <span>Rows</span>

            <div className="relative w-20.5">
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
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-emerald-700 px-3 text-sm font-semibold text-white">
              {page}
            </div>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <TeacherModal
        open={modalOpen}
        mode={formMode}
        value={form}
        saving={saving}
        avatarFile={avatarFile}
        currentAvatar={editingAvatar}
        onClose={() => setModalOpen(false)}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onPickAvatar={setAvatarFile}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
