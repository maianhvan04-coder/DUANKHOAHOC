"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { categoryApi, type CategoryItem } from "@/app/api/category.api";
import AdminListTable, {
  AdminActionIconButton,
  AdminEntityCell,
  AdminStatusBadge,
  type AdminFilterSection,
  type AdminTableColumn,
} from "@/components/ui/admin/admin-list-table";
import type { SortDirection } from "@/lib/utils/admin-list";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type ViewMode = "active" | "deleted";
type FormMode = "create" | "edit";
type CategoryStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type CategorySortKey = "name" | "description" | "createdAt" | "deletedAt";

type CategoryFormState = {
  name: string;
  description: string;
};

const INITIAL_FORM: CategoryFormState = {
  name: "",
  description: "",
};

function formatDate(value?: string | null) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getCategoryInitials(name?: string) {
  const value = String(name ?? "").trim();
  if (!value) return "DM";

  const parts = value.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("");
}

function getSortValue(item: CategoryItem, sortKey: CategorySortKey) {
  if (sortKey === "createdAt" || sortKey === "deletedAt") {
    const raw = item[sortKey];
    const date = raw ? new Date(raw).getTime() : 0;
    return Number.isNaN(date) ? 0 : date;
  }

  return String(item[sortKey] ?? "").toLowerCase();
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<CategoryStatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<CategorySortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState<CategoryFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = useCallback(async (mode: ViewMode) => {
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
          ? "Could not load categories"
          : "Could not load deleted categories"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories(viewMode);
  }, [loadCategories, viewMode]);

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
            id: "status-inactive",
            label: "INACTIVE",
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

  const handleRefresh = async () => {
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
      alert("Please enter category name");
      return;
    }

    try {
      setSubmitting(true);

      if (formMode === "create") {
        await categoryApi.create({ name, description });
        alert("Category created successfully");
      } else {
        if (!editingItem?._id) return;

        await categoryApi.update(editingItem._id, { name, description });
        alert("Category updated successfully");
      }

      closeForm();
      setViewMode("active");
      setSortKey("createdAt");
      setSortDirection("desc");
      setPage(1);
      await loadCategories("active");
    } catch (error) {
      console.error(error);
      alert(
        formMode === "create"
          ? "Create category failed"
          : "Update category failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    const ok = window.confirm("Move this category to Deleted?");
    if (!ok) return;

    try {
      await categoryApi.remove(id);
      await loadCategories(viewMode);
    } catch (error) {
      console.error(error);
      alert("Delete category failed");
    }
  };

  const handleRestore = async (id: string) => {
    const ok = window.confirm("Restore this category?");
    if (!ok) return;

    try {
      await categoryApi.restore(id);
      await loadCategories(viewMode);
    } catch (error) {
      console.error(error);
      alert("Restore category failed");
    }
  };

  const handleForceDelete = async (id: string) => {
    const ok = window.confirm(
      "Delete this category permanently? This action cannot be undone."
    );
    if (!ok) return;

    try {
      await categoryApi.forceRemove(id);
      await loadCategories(viewMode);
    } catch (error) {
      console.error(error);
      alert("Delete category permanently failed");
    }
  };

  const tableColumns: AdminTableColumn<CategoryItem, CategorySortKey>[] = [
    {
      id: "category",
      label: "Category",
      sortKey: "name",
      widthClassName: "w-[320px]",
      render: (item) => (
        <AdminEntityCell
          title={item.name || "--"}
          subtitle={item.slug || "--"}
          fallback={getCategoryInitials(item.name)}
          icon={
            <FolderKanban
              className={cn(
                "h-4 w-4",
                viewMode === "active" ? "text-emerald-700" : "text-rose-700"
              )}
            />
          }
        />
      ),
    },
    {
      id: "description",
      label: "Description",
      sortKey: "description",
      widthClassName: "w-[360px]",
      render: (item) => (
        <div className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
          {item.description || "No description"}
        </div>
      ),
    },
    {
      id: "status",
      label: "Status",
      widthClassName: "w-[140px]",
      render: (item) => {
        const label =
          viewMode === "deleted"
            ? "DELETED"
            : item.isActive === false
            ? "INACTIVE"
            : "ACTIVE";

        return (
          <AdminStatusBadge
            tone={
              label === "ACTIVE"
                ? "success"
                : label === "INACTIVE"
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
      id: "date",
      label: viewMode === "active" ? "Created" : "Deleted",
      sortKey: viewMode === "active" ? "createdAt" : "deletedAt",
      widthClassName: "w-[150px]",
      render: (item) =>
        viewMode === "active"
          ? formatDate(item.createdAt)
          : formatDate(item.deletedAt),
    },
    {
      id: "actions",
      label: <div className="text-right">Actions</div>,
      widthClassName: "w-[150px]",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          {viewMode === "active" ? (
            <>
              <AdminActionIconButton
                title="Edit"
                onClick={() => openEditForm(item)}
              >
                <Pencil className="h-4 w-4" />
              </AdminActionIconButton>

              <AdminActionIconButton
                danger
                title="Move to Deleted"
                onClick={() => void handleSoftDelete(item._id)}
              >
                <Trash2 className="h-4 w-4" />
              </AdminActionIconButton>
            </>
          ) : (
            <>
              <AdminActionIconButton
                title="Restore"
                onClick={() => void handleRestore(item._id)}
              >
                <RotateCcw className="h-4 w-4" />
              </AdminActionIconButton>

              <AdminActionIconButton
                danger
                title="Delete permanently"
                onClick={() => void handleForceDelete(item._id)}
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
    <>
      <div className="space-y-6">
        <section className="hidden rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex rounded-[22px] border border-slate-200 bg-slate-50 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setViewMode("active");
                  setSortKey("createdAt");
                  setSortDirection("desc");
                  setPage(1);
                }}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                  viewMode === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-slate-700 hover:bg-white"
                )}
              >
                <FolderKanban className="h-4 w-4" />
                Categories
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode("deleted");
                  setSortKey("deletedAt");
                  setSortDirection("desc");
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
                onClick={openCreateForm}
                className="inline-flex h-11 items-center gap-2 rounded-[18px] bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus className="h-4.5 w-4.5" />
                New Category
              </button>

              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={loading}
                className="inline-flex h-11 items-center gap-2 rounded-[18px] border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={cn("h-4.5 w-4.5", loading && "animate-spin")}
                />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <AdminListTable<CategoryItem, CategorySortKey>
          rows={pagedItems}
          columns={tableColumns}
          rowKey={(item) => item._id}
          loading={loading}
          searchValue={search}
          searchPlaceholder="Search category name, slug, description..."
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
          onReload={() => void handleRefresh()}
          toolbarStart={
            <div className="inline-flex rounded-[22px] border border-slate-200 bg-slate-50 p-1.5 dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => {
                  setViewMode("active");
                  setSortKey("createdAt");
                  setSortDirection("desc");
                  setPage(1);
                }}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-[16px] px-5 text-sm font-semibold transition",
                  viewMode === "active"
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
                    : "text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-white/10"
                )}
              >
                <FolderKanban className="h-4 w-4" />
                Categories
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode("deleted");
                  setSortKey("deletedAt");
                  setSortDirection("desc");
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
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-[18px] bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              <Plus className="h-4.5 w-4.5" />
              New Category
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
          emptyText={
            viewMode === "active" ? "No categories found." : "No deleted data."
          }
          tableMinWidthClassName="min-w-[1040px]"
        />
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {formMode === "create" ? "New Category" : "Edit Category"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {formMode === "create"
                    ? "Create a new category."
                    : "Update category information."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Category name <span className="text-rose-600">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Enter category name"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Enter category description"
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={() => void handleSubmitForm()}
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? formMode === "create"
                    ? "Creating..."
                    : "Saving..."
                  : formMode === "create"
                  ? "Create Category"
                  : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
