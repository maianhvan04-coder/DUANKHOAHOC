"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react";
import {
  categoryApi,
  type CategoryItem,
} from "@/app/api/category.api";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type ViewMode = "active" | "deleted";
type FormMode = "create" | "edit";

type CategoryFormState = {
  name: string;
  description: string;
};

const INITIAL_FORM: CategoryFormState = {
  name: "",
  description: "",
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState<CategoryFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async (mode: ViewMode = viewMode) => {
    try {
      setLoading(true);

      const res =
        mode === "active"
          ? await categoryApi.getAll()
          : await categoryApi.getDeleted();

      setItems(res.items || []);
    } catch (error) {
      console.error(error);
      alert(
        mode === "active"
          ? "Không tải được danh mục"
          : "Không tải được danh mục đã xóa"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories(viewMode);
  }, [viewMode]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const keyword = search.trim().toLowerCase();
      if (!keyword) return true;

      return (
        item.name?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword)
      );
    });
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const from = filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, filteredItems.length);

  const handleRefresh = async () => {
    setSearch("");
    setPage(1);
    await loadCategories(viewMode);
  };

  const openCreateForm = () => {
    setFormMode("create");
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setIsFormOpen(true);
  };

  const openEditForm = (item: CategoryItem) => {
    setFormMode("edit");
    setEditingItem(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) return;
    setIsFormOpen(false);
    setEditingItem(null);
    setForm(INITIAL_FORM);
  };

  const handleSubmitForm = async () => {
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      alert("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setSubmitting(true);

      if (formMode === "create") {
        await categoryApi.create({
          name,
          description,
        });

        alert("Thêm danh mục thành công");
      } else {
        if (!editingItem?._id) return;

        await categoryApi.update(editingItem._id, {
          name,
          description,
        });

        alert("Cập nhật danh mục thành công");
      }

      closeForm();
      await loadCategories("active");
      setViewMode("active");
      setPage(1);
    } catch (error) {
      console.error(error);
      alert(
        formMode === "create"
          ? "Thêm danh mục thất bại"
          : "Cập nhật danh mục thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    const ok = window.confirm("Bạn có chắc muốn xóa mềm danh mục này?");
    if (!ok) return;

    try {
      await categoryApi.remove(id);
      await loadCategories(viewMode);
    } catch (error) {
      console.error(error);
      alert("Xóa mềm danh mục thất bại");
    }
  };

  const handleRestore = async (id: string) => {
    const ok = window.confirm("Bạn có chắc muốn khôi phục danh mục này?");
    if (!ok) return;

    try {
      await categoryApi.restore(id);
      await loadCategories(viewMode);
    } catch (error) {
      console.error(error);
      alert("Khôi phục danh mục thất bại");
    }
  };

  const handleForceDelete = async (id: string) => {
    const ok = window.confirm(
      "Bạn có chắc muốn xóa cứng danh mục này? Hành động này không thể hoàn tác."
    );
    if (!ok) return;

    try {
      await categoryApi.forceRemove(id);
      await loadCategories(viewMode);
    } catch (error) {
      console.error(error);
      alert("Xóa cứng danh mục thất bại");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-3 md:p-4">
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Category Management
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Create, edit and manage categories.
                </p>

                <div className="mt-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("active");
                      setPage(1);
                    }}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium transition",
                      viewMode === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "text-slate-600"
                    )}
                  >
                    <FolderKanban className="h-4 w-4" />
                    Categories
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("deleted");
                      setPage(1);
                    }}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium transition",
                      viewMode === "deleted"
                        ? "bg-rose-100 text-rose-700"
                        : "text-slate-600"
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                    Deleted
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {viewMode === "active" ? (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800"
                  >
                    <Plus className="h-4 w-4" />
                    New Category
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full max-w-[420px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search category name, description..."
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
                />
              </div>

              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 px-4 text-xs font-semibold text-slate-700">
                {filteredItems.length} FOUND
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="w-[50px] px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </th>
                    <th className="min-w-[280px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Category
                    </th>
                    <th className="min-w-[320px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description
                    </th>
                    <th className="min-w-[150px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {viewMode === "active" ? "Created" : "Deleted"}
                    </th>
                    <th className="min-w-[120px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-200">
                        <td className="px-4 py-4" colSpan={5}>
                          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  ) : pagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center text-sm text-slate-500">
                        {viewMode === "active"
                          ? "Không có danh mục nào"
                          : "Không có dữ liệu"}
                      </td>
                    </tr>
                  ) : (
                    pagedItems.map((item) => (
                      <tr
                        key={item._id}
                        className="border-b border-slate-200 last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                viewMode === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              )}
                            >
                              <FolderKanban className="h-4 w-4" />
                            </div>

                            <div className="text-sm font-semibold text-slate-900">
                              {item.name}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          <div className="line-clamp-2">
                            {item.description || "Chưa có mô tả"}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {viewMode === "active"
                            ? item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "--"
                            : item.deletedAt
                            ? new Date(item.deletedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "--"}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {viewMode === "active" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditForm(item)}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void handleSoftDelete(item._id)}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleRestore(item._id)}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-emerald-700 transition hover:bg-slate-50"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void handleForceDelete(item._id)}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-rose-700 transition hover:bg-slate-50"
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

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span>
                  Showing <span className="font-semibold text-slate-900">{from}-{to}</span> of{" "}
                  <span className="font-semibold text-slate-900">{filteredItems.length}</span>
                </span>

                <div className="flex items-center gap-2">
                  <span>Rows</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex h-9 min-w-[40px] items-center justify-center rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white">
                  {currentPage}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-3">
          <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {formMode === "create" ? "New Category" : "Edit Category"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formMode === "create"
                    ? "Create a new category."
                    : "Update category information."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Category name <span className="text-rose-600">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nhập tên danh mục"
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Nhập mô tả danh mục"
                  rows={4}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleSubmitForm()}
                disabled={submitting}
                className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {submitting
                  ? formMode === "create"
                    ? "Creating..."
                    : "Updating..."
                  : formMode === "create"
                  ? "Create Category"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}