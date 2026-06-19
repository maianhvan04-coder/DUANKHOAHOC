"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { blogApi, type BlogCategoryItem } from "@/app/api/blog.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import type { SortDirection } from "@/lib/utils/admin-list";
import { toastConfirm } from "@/lib/utils/toast-confirm";

type FormMode = "create" | "edit";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type BlogCategorySortKey = "name" | "description" | "updatedAt";

type BlogCategoryFormState = {
  name: string;
  description: string;
  isActive: boolean;
};

const INITIAL_FORM: BlogCategoryFormState = {
  name: "",
  description: "",
  isActive: true,
};

function getInitials(name?: string) {
  const value = String(name ?? "").trim();
  if (!value) return "CM";

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDateTime(value?: string | null) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  });
}

function getSortValue(item: BlogCategoryItem, sortKey: BlogCategorySortKey) {
  if (sortKey === "updatedAt") {
    const raw = item.updatedAt || item.createdAt;
    const date = raw ? new Date(raw).getTime() : 0;
    return Number.isNaN(date) ? 0 : date;
  }

  return String(item[sortKey] ?? "").toLowerCase();
}

export default function AdminBlogCategoriesPage() {
  const [items, setItems] = useState<BlogCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<BlogCategorySortKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<BlogCategoryItem | null>(null);
  const [form, setForm] = useState<BlogCategoryFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await blogApi.getCategoriesAdmin();
      setItems(res.items || []);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh mục bài viết");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name?.toLowerCase().includes(keyword) ||
        item.slug?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword);

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      const isActive = item.isActive !== false;
      return statusFilter === "ACTIVE" ? isActive : !isActive;
    });
  }, [items, search, statusFilter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const valueA = getSortValue(a, sortKey);
      const valueB = getSortValue(b, sortKey);
      const result =
        typeof valueA === "number" && typeof valueB === "number"
          ? valueA - valueB
          : String(valueA).localeCompare(String(valueB));

      return sortDirection === "asc" ? result : -result;
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

  const activeFilterCount = statusFilter !== "ALL" ? 1 : 0;

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "status",
        title: "Trạng thái",
        options: [
          {
            id: "status-all",
            label: "Tất cả",
            checked: statusFilter === "ALL",
            onToggle: () => {
              setStatusFilter("ALL");
              setPage(1);
            },
          },
          {
            id: "status-active",
            label: "Đang hiển thị",
            checked: statusFilter === "ACTIVE",
            onToggle: () => {
              setStatusFilter("ACTIVE");
              setPage(1);
            },
          },
          {
            id: "status-inactive",
            label: "Đang ẩn",
            checked: statusFilter === "INACTIVE",
            onToggle: () => {
              setStatusFilter("INACTIVE");
              setPage(1);
            },
          },
        ],
      },
    ],
    [statusFilter]
  );

  function openCreateForm() {
    setFormMode("create");
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setIsFormOpen(true);
  }

  function openEditForm(item: BlogCategoryItem) {
    setFormMode("edit");
    setEditingItem(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      isActive: item.isActive !== false,
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    if (submitting) return;
    setIsFormOpen(false);
    setEditingItem(null);
    setForm(INITIAL_FORM);
  }

  async function handleSubmitForm() {
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      toast.warning("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setSubmitting(true);

      if (formMode === "create") {
        await blogApi.createCategory({
          name,
          description,
          isActive: form.isActive,
        });
        toast.success("Tạo danh mục bài viết thành công");
      } else {
        if (!editingItem?._id) return;

        await blogApi.updateCategory(editingItem._id, {
          name,
          description,
          isActive: form.isActive,
        });
        toast.success("Cập nhật danh mục bài viết thành công");
      }

      closeForm();
      setSortKey("updatedAt");
      setSortDirection("desc");
      setPage(1);
      await loadCategories();
    } catch (error) {
      console.error(error);
      toast.error(
        formMode === "create"
          ? "Tạo danh mục bài viết thất bại"
          : "Cập nhật danh mục bài viết thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(item: BlogCategoryItem) {
    const nextActive = item.isActive === false;
    const ok = await toastConfirm(
      nextActive ? "Hiển thị danh mục này?" : "Ẩn danh mục này?"
    );
    if (!ok) return;

    try {
      setBusyId(item._id);
      await blogApi.updateCategory(item._id, { isActive: nextActive });
      await loadCategories();
      toast.success(nextActive ? "Đã hiển thị danh mục" : "Đã ẩn danh mục");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật trạng thái danh mục thất bại");
    } finally {
      setBusyId("");
    }
  }

  const tableColumns: AdminTableColumn<
    BlogCategoryItem,
    BlogCategorySortKey
  >[] = [
    {
      id: "category",
      label: "Danh mục",
      sortKey: "name",
      widthClassName: "w-[320px]",
      render: (item) => (
        <AdminEntityCell
          title={item.name || "--"}
          subtitle={item.slug || "--"}
          fallback={getInitials(item.name)}
          icon={<FileText className="h-4 w-4 text-slate-500" />}
        />
      ),
    },
    {
      id: "description",
      label: "Mô tả",
      sortKey: "description",
      widthClassName: "w-[420px]",
      render: (item) => (
        <div className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
          {item.description || "Không có mô tả"}
        </div>
      ),
    },
    {
      id: "status",
      label: "Trạng thái",
      widthClassName: "w-[160px]",
      render: (item) => (
        <AdminStatusBadge tone={item.isActive === false ? "warning" : "success"}>
          {item.isActive === false ? "ĐANG ẨN" : "HIỂN THỊ"}
        </AdminStatusBadge>
      ),
    },
    {
      id: "updatedAt",
      label: "Cập nhật",
      sortKey: "updatedAt",
      widthClassName: "w-[180px]",
      render: (item) => formatDateTime(item.updatedAt || item.createdAt),
    },
    {
      id: "actions",
      label: <div className="text-right">Thao tác</div>,
      widthClassName: "w-[150px]",
      align: "right",
      render: (item) => {
        const isBusy = busyId === item._id;

        return (
          <div className="flex items-center justify-end gap-2">
            <AdminActionIconButton
              title="Sửa"
              onClick={() => openEditForm(item)}
              disabled={isBusy}
            >
              <Pencil className="h-4 w-4" />
            </AdminActionIconButton>

            <AdminActionIconButton
              title={item.isActive === false ? "Hiển thị" : "Ẩn"}
              onClick={() => void handleToggleActive(item)}
              disabled={isBusy}
            >
              {item.isActive === false ? (
                <LockOpen className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </AdminActionIconButton>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <AdminListTable<BlogCategoryItem, BlogCategorySortKey>
        rows={pagedItems}
        columns={tableColumns}
        rowKey={(item) => item._id}
        loading={loading}
        searchValue={search}
        searchPlaceholder="Tìm tên danh mục, slug, mô tả..."
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
        onReload={() => void loadCategories()}
        toolbarEnd={
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <Plus className="h-4.5 w-4.5" />
            Thêm danh mục
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
        emptyText="Chưa có danh mục bài viết."
        tableMinWidthClassName="min-w-[1100px]"
      />

      {isFormOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  {formMode === "create" ? "Thêm danh mục bài viết" : "Sửa danh mục bài viết"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Danh mục này chỉ dùng cho phần bài viết.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Tên danh mục <span className="text-rose-600">*</span>
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Góc học tập"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Trạng thái
                  </span>
                  <select
                    value={form.isActive ? "ACTIVE" : "INACTIVE"}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: event.target.value === "ACTIVE",
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="ACTIVE">Hiển thị</option>
                    <option value="INACTIVE">Ẩn</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Mô tả
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Mô tả ngắn"
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-white/10">
              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => void handleSubmitForm()}
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Đang lưu..."
                  : formMode === "create"
                    ? "Thêm danh mục"
                    : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
