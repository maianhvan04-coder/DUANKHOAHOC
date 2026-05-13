"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FolderKanban,
  Lock,
  LockOpen,
  Pencil,
  Plus,
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
import { toastConfirm } from "@/lib/utils/toast-confirm";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type FormMode = "create" | "edit";
type CategoryStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type CategorySortKey = "name" | "description" | "createdAt";

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
  if (sortKey === "createdAt") {
    const raw = item[sortKey];
    const date = raw ? new Date(raw).getTime() : 0;
    return Number.isNaN(date) ? 0 : date;
  }

  return String(item[sortKey] ?? "").toLowerCase();
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);

      const res = await categoryApi.getAll();

      setItems(res.items || []);
    } catch (error) {
      console.error(error);
      toast.error("Could not load categories");
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
    await loadCategories();
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
      toast.warning("Please enter category name");
      return;
    }

    try {
      setSubmitting(true);

      if (formMode === "create") {
        await categoryApi.create({ name, description });
        toast.success("Category created successfully");
      } else {
        if (!editingItem?._id) return;

        await categoryApi.update(editingItem._id, { name, description });
        toast.success("Category updated successfully");
      }

      closeForm();
      setSortKey("createdAt");
      setSortDirection("desc");
      setPage(1);
      await loadCategories();
    } catch (error) {
      console.error(error);
      toast.error(
        formMode === "create"
          ? "Create category failed"
          : "Update category failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: CategoryItem) => {
    const nextActive = item.isActive === false;
    const ok = await toastConfirm(
      nextActive ? "Unlock this category?" : "Lock this category?"
    );
    if (!ok) return;

    try {
      await categoryApi.update(item._id, { isActive: nextActive });
      await loadCategories();
      toast.success(nextActive ? "Category unlocked" : "Category locked");
    } catch (error) {
      console.error(error);
      toast.error("Update category status failed");
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
                item.isActive === false ? "text-amber-700" : "text-emerald-700"
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
        const label = item.isActive === false ? "LOCKED" : "ACTIVE";

        return (
          <AdminStatusBadge
            tone={label === "ACTIVE" ? "success" : "warning"}
          >
            {label}
          </AdminStatusBadge>
        );
      },
    },
    {
      id: "date",
      label: "Created",
      sortKey: "createdAt",
      widthClassName: "w-[150px]",
      render: (item) => formatDate(item.createdAt),
    },
    {
      id: "actions",
      label: <div className="text-right">Actions</div>,
      widthClassName: "w-[150px]",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <AdminActionIconButton
            title="Edit"
            onClick={() => openEditForm(item)}
          >
            <Pencil className="h-4 w-4" />
          </AdminActionIconButton>

          <AdminActionIconButton
            title={item.isActive === false ? "Unlock" : "Lock"}
            onClick={() => void handleToggleActive(item)}
          >
            {item.isActive === false ? (
              <LockOpen className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </AdminActionIconButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
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
          toolbarEnd={
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700"
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
          emptyText="No categories found."
          tableMinWidthClassName="min-w-[900px]"
        />
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-slate-100">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  {formMode === "create" ? "New Category" : "Edit Category"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formMode === "create"
                    ? "Create a new category."
                    : "Update category information."}
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
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Category name <span className="text-rose-600">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Enter category name"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
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
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
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
                  ? formMode === "create"
                    ? "Creating..."
                    : "Saving..."
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
