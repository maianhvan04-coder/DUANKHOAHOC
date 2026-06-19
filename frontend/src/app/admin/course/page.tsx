"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  ImageIcon,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  categoryApi,
  type CategoryItem,
} from "@/app/api/category.api";
import {
  productApi,
  type ProductItem,
  type ProductStatus,
} from "@/app/api/course.api";
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
import { toastConfirm } from "@/lib/utils/toast-confirm";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) return fallback;

  const maybeError = error as {
    message?: string;
    response?: {
      data?: {
        message?: string;
        error?: string;
        errors?: Array<{ message?: string }>;
      };
    };
  };
  const data = maybeError.response?.data;

  return (
    data?.errors?.find((item) => item.message)?.message ||
    data?.message ||
    data?.error ||
    maybeError.message ||
    fallback
  );
}

type ViewMode = "active" | "deleted";
type FormMode = "create" | "edit";
type ImageSource = "file" | "url";
type ProductSortKey =
  | "title"
  | "category"
  | "status"
  | "price"
  | "createdAt";

type ProductFormState = {
  title: string;
  category: string;
  imageSource: ImageSource;
  image: File | null;
  imageUrl: string;
  shortDescription: string;
  durationText: string;
  status: ProductStatus;
  price: string;
  studentCount: string;
};

const INITIAL_FORM: ProductFormState = {
  title: "",
  category: "",
  imageSource: "file",
  image: null,
  imageUrl: "",
  shortDescription: "",
  durationText: "",
  status: "OPEN",
  price: "",
  studentCount: "0",
};

function formatPrice(value?: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function getCategoryName(category: string | CategoryItem) {
  return typeof category === "string" ? category : category?.name || "Danh mục";
}

function getCategoryId(category: string | CategoryItem) {
  return typeof category === "string" ? category : category?._id || "";
}

function getStatusClass(status: ProductStatus, isActive = true) {
  if (!isActive) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "OPEN") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "COMING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<ProductSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [serverPagination, setServerPagination] = useState<PaginationMeta>(
    makePaginationMeta(0, 1, 5)
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [form, setForm] = useState<ProductFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const objectUrlRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const setPreviewFromFile = (file: File | null, fallback = "") => {
    clearObjectUrl();

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setImagePreview(objectUrl);
      return;
    }

    setImagePreview(fallback);
  };

  const clearSelectedImageFile = () => {
    clearObjectUrl();
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setForm((prev) => ({ ...prev, image: null }));
    setImagePreview(editingItem?.image || "");
  };

  useEffect(() => {
    return () => {
      clearObjectUrl();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productRes, categoryRes] = await Promise.all([
        productApi.getAll({
          q: search,
          categoryId: categoryFilter,
          status: statusFilter,
          sortBy: sortKey,
          sortOrder: sortDirection,
          page,
          limit: pageSize,
        }),
        categoryApi.getAll(),
      ]);

      setProducts(productRes.items || []);
      setServerPagination(
        productRes.pagination ?? makePaginationMeta(productRes.items?.length || 0, page, pageSize)
      );
      setCategories(categoryRes.items || []);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được khóa học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [
    categoryFilter,
    page,
    pageSize,
    search,
    sortDirection,
    sortKey,
    statusFilter,
  ]);

  const pagedProducts = products;
  const totalPages = serverPagination.totalPages;
  const currentPage = serverPagination.page;
  const from =
    serverPagination.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, serverPagination.total);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetForm = () => {
    clearObjectUrl();
    setIsFormOpen(false);
    setFormMode("create");
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setImagePreview("");
  };

  const openCreateForm = () => {
    clearObjectUrl();
    setFormMode("create");
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setImagePreview("");
    setIsFormOpen(true);
  };

  const openEditForm = (item: ProductItem) => {
    clearObjectUrl();

    setFormMode("edit");
    setEditingItem(item);
    setForm({
      title: item.title || "",
      category: getCategoryId(item.category),
      imageSource: "file",
      image: null,
      imageUrl: "",
      shortDescription: item.shortDescription || "",
      durationText: item.durationText || "",
      status: item.status || "OPEN",
      price: String(item.price ?? ""),
      studentCount: String(item.studentCount ?? 0),
    });
    setImagePreview(item.image || "");
    setIsFormOpen(true);
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleSubmitForm = async () => {
    const title = form.title.trim();
    const category = form.category;
    const shortDescription = form.shortDescription.trim();
    const durationText = form.durationText.trim();

    if (!title) {
      toast.warning("Vui lòng nhập tên khóa học");
      return;
    }

    if (!category) {
      toast.warning("Vui lòng chọn danh mục");
      return;
    }

    if (Number(form.price || 0) < 0) {
      toast.warning("Học phí không được âm");
      return;
    }

    if (Number(form.studentCount || 0) < 0) {
      toast.warning("Số học viên không được âm");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title,
        category,
        image: form.imageSource === "file" ? form.image : null,
        imageUrl:
          form.imageSource === "url" ? form.imageUrl.trim() || undefined : undefined,
        shortDescription,
        durationText,
        status: form.status,
        price: form.price || "0",
        studentCount: form.studentCount || "0",
      };

      if (formMode === "create") {
        await productApi.create(payload);
        toast.success("Thêm khóa học thành công");
      } else {
        if (!editingItem?._id) return;
        await productApi.update(editingItem._id, payload);
        toast.success("Cập nhật khóa học thành công");
      }

      resetForm();
      setPage(1);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(
        getErrorMessage(
          error,
          formMode === "create"
            ? "Thêm khóa học thất bại"
            : "Cập nhật khóa học thất bại"
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: ProductItem) => {
    const nextActive = item.isActive === false;
    const ok = await toastConfirm(
      nextActive ? "Mở khóa khóa học này?" : "Khóa khóa học này?"
    );
    if (!ok) return;

    try {
      await productApi.update(item._id, { isActive: nextActive });
      await loadData();
      toast.success(nextActive ? "Đã mở khóa khóa học" : "Đã khóa khóa học");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật trạng thái khóa học thất bại");
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
      isActive: true,
    });
  };

  const openCategoryModal = () => {
    resetCategoryForm();
    setIsCategoryOpen(true);
  };

  const startEditCategory = (item: CategoryItem) => {
    setEditingCategory(item);
    setCategoryForm({
      name: item.name || "",
      description: item.description || "",
      isActive: item.isActive !== false,
    });
  };

  const handleSubmitCategory = async () => {
    const name = categoryForm.name.trim();
    const description = categoryForm.description.trim();

    if (!name) {
      toast.warning("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setCategorySubmitting(true);

      if (editingCategory) {
        await categoryApi.update(editingCategory._id, {
          name,
          description,
          isActive: categoryForm.isActive,
        });
        toast.success("Cập nhật danh mục thành công");
      } else {
        await categoryApi.create({
          name,
          description,
          isActive: categoryForm.isActive,
        });
        toast.success("Tạo danh mục thành công");
      }

      resetCategoryForm();
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(editingCategory ? "Cập nhật danh mục thất bại" : "Tạo danh mục thất bại");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleToggleCategoryActive = async (item: CategoryItem) => {
    const nextActive = item.isActive === false;
    const ok = await toastConfirm(
      nextActive ? "Mở khóa danh mục này?" : "Khóa danh mục này?"
    );
    if (!ok) return;

    try {
      setCategorySubmitting(true);
      await categoryApi.update(item._id, { isActive: nextActive });
      await loadData();
      toast.success(nextActive ? "Đã mở khóa danh mục" : "Đã khóa danh mục");
      if (editingCategory?._id === item._id) {
        setCategoryForm((prev) => ({ ...prev, isActive: nextActive }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật trạng thái danh mục thất bại");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    const ok = await toastConfirm("Bạn có chắc muốn xóa mềm khóa học này?");
    if (!ok) return;

    try {
      await productApi.remove(id);
      await loadData();
      toast.success("Đã xóa mềm khóa học");
    } catch (error) {
      console.error(error);
      toast.error("Xóa mềm khóa học thất bại");
    }
  };

  const handleRestore = async (id: string) => {
    const ok = await toastConfirm("Bạn có chắc muốn khôi phục khóa học này?");
    if (!ok) return;

    try {
      await productApi.restore(id);
      await loadData();
      toast.success("Đã khôi phục khóa học");
    } catch (error) {
      console.error(error);
      toast.error("Khôi phục khóa học thất bại");
    }
  };

  const handleForceDelete = async (id: string) => {
    const ok = await toastConfirm(
      "Bạn có chắc muốn xóa cứng khóa học này? Hành động này không thể hoàn tác."
    );
    if (!ok) return;

    try {
      await productApi.forceRemove(id);
      await loadData();
      toast.success("Đã xóa cứng khóa học");
    } catch (error) {
      console.error(error);
      toast.error("Xóa cứng khóa học thất bại");
    }
  };

  const activeFilterCount =
    (categoryFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0);

  const filterSections = useMemo<AdminFilterSection[]>(
    () => [
      {
        id: "category",
        title: "Category",
        options: [
          {
            id: "category-all",
            label: "All Category",
            checked: categoryFilter === "ALL",
            onToggle: () => {
              setCategoryFilter("ALL");
              setPage(1);
            },
          },
          ...categories.map((category) => ({
            id: `category-${category._id}`,
            label: category.name,
            checked: categoryFilter === category._id,
            onToggle: () => {
              setCategoryFilter(category._id);
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
            checked: statusFilter === "ALL",
            onToggle: () => {
              setStatusFilter("ALL");
              setPage(1);
            },
          },
          {
            id: "status-open",
            label: "OPEN",
            checked: statusFilter === "OPEN",
            onToggle: () => {
              setStatusFilter("OPEN");
              setPage(1);
            },
          },
          {
            id: "status-coming",
            label: "COMING",
            checked: statusFilter === "COMING",
            onToggle: () => {
              setStatusFilter("COMING");
              setPage(1);
            },
          },
          {
            id: "status-full",
            label: "FULL",
            checked: statusFilter === "FULL",
            onToggle: () => {
              setStatusFilter("FULL");
              setPage(1);
            },
          },
        ],
      },
    ],
    [categories, categoryFilter, statusFilter]
  );

  const tableColumns: AdminTableColumn<ProductItem, ProductSortKey>[] = [
      {
        id: "course",
        label: "Course",
        sortKey: "title",
        widthClassName: "w-[25%]",
        render: (item) => (
          <AdminEntityCell
            title={item.title || "--"}
            subtitle={item.durationText || item.shortDescription || undefined}
            image={item.image}
            icon={<BookOpen className="h-4 w-4 text-slate-500 dark:text-slate-300" />}
          />
        ),
      },
      {
        id: "category",
        label: "Category",
        sortKey: "category",
        widthClassName: "w-[13%]",
        render: (item) => (
          <div className="truncate">{getCategoryName(item.category)}</div>
        ),
      },
      {
        id: "status",
        label: "Status",
        sortKey: "status",
        widthClassName: "w-[14%]",
        render: (item) => (
          <AdminStatusBadge
            tone={
              item.isActive === false
                ? "warning"
                : item.status === "OPEN"
                ? "success"
                : item.status === "COMING"
                  ? "warning"
                  : "danger"
            }
          >
            {item.isActive === false ? "LOCKED" : item.status}
          </AdminStatusBadge>
        ),
      },
      {
        id: "tuition",
        label: "Tuition",
        sortKey: "price",
        widthClassName: "w-[11%]",
        render: (item) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {formatPrice(item.price)}
          </span>
        ),
      },
      {
        id: "created",
        label: "Created",
        sortKey: "createdAt",
        widthClassName: "w-[11%]",
        render: (item) => {
          const value = item.createdAt;
          return value ? new Date(value).toLocaleDateString("vi-VN") : "--";
        },
      },
      {
        id: "actions",
        label: <div className="text-right">Actions</div>,
        widthClassName: "w-[10%]",
        align: "right",
        render: (item) => (
          <div className="flex items-center justify-end gap-1">
            <AdminActionIconButton title="Edit" onClick={() => openEditForm(item)}>
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
        <div className="space-y-4">
          <section className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
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
                      : "text-slate-600 hover:bg-white"
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  Courses
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
                      : "text-slate-600 hover:bg-white"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  Deleted
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {viewMode === "active" ? (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800"
                  >
                    <Plus className="h-4 w-4" />
                    New Course
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

          <AdminListTable<ProductItem, ProductSortKey>
            rows={pagedProducts}
            columns={tableColumns}
            rowKey={(item) => item._id}
            loading={loading}
            searchValue={search}
            searchPlaceholder="Search title, category..."
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            filterSections={filterSections}
            activeFilterCount={activeFilterCount}
            onApplyFilters={() => setPage(1)}
            onClearFilters={() => {
              setSearch("");
              setCategoryFilter("ALL");
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
                <Plus className="h-4 w-4" />
                New Course
              </button>
            }
            pagination={{
              currentPage,
              totalPages,
              totalItems: serverPagination.total,
              pageSize,
              onPageSizeChange: (nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              },
              onPageChange: setPage,
              pageSizeOptions: [5, 10, 20],
            }}
            emptyText="Không có khóa học nào"
            tableMinWidthClassName="min-w-full"
          />

          <section className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Course Management
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Tạo, sửa và quản lý khóa học.
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
                    <BookOpen className="h-4 w-4" />
                    Courses
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
                    New Course
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

          <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="w-[50px] px-4 py-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                    </th>
                    <th className="min-w-[300px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Course
                    </th>
                    <th className="min-w-[160px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Category
                    </th>
                    <th className="min-w-[140px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="min-w-[150px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tuition
                    </th>
                    <th className="min-w-[160px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                        <td className="px-4 py-4" colSpan={7}>
                          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  ) : pagedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">
                        {viewMode === "active"
                          ? "Không có khóa học nào"
                          : "Không có dữ liệu"}
                      </td>
                    </tr>
                  ) : (
                    pagedProducts.map((item) => (
                      <tr key={item._id} className="border-b border-slate-200 last:border-b-0">
                        <td className="px-4 py-4">
                          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <BookOpen className="h-4 w-4" />
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {item.title}
                              </div>
                              <div className="mt-0.5 text-sm text-slate-500">
                                {item.durationText || item.shortDescription || "--"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700">
                          {getCategoryName(item.category)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium",
                              getStatusClass(item.status)
                            )}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                          {formatPrice(item.price)}
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
                  <span className="font-semibold text-slate-900">{serverPagination.total}</span>
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

      {isCategoryOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  Danh mục khóa học
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tạo danh mục để chọn khi thêm hoặc sửa khóa học.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryOpen(false)}
                disabled={categorySubmitting}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-154px)] overflow-y-auto p-6">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Tên danh mục <span className="text-rose-600">*</span>
                    </span>
                    <input
                      value={categoryForm.name}
                      onChange={(event) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      placeholder="IELTS"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Mô tả
                    </span>
                    <input
                      value={categoryForm.description}
                      onChange={(event) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      placeholder="Mô tả ngắn"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={categoryForm.isActive}
                      onChange={(event) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          isActive: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Hoạt động
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleSubmitCategory()}
                    disabled={categorySubmitting}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {categorySubmitting
                      ? "Đang lưu..."
                      : editingCategory
                      ? "Lưu danh mục"
                      : "Tạo danh mục"}
                  </button>
                  {editingCategory ? (
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      disabled={categorySubmitting}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      Hủy sửa
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3">Danh mục</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {categories.length ? (
                      categories.map((item) => (
                        <tr key={item._id}>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                              {item.description || item.slug || "--"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-3 py-1 text-xs font-black",
                                item.isActive === false
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              )}
                            >
                              {item.isActive === false ? "Khóa" : "Hoạt động"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <AdminActionIconButton
                                title="Sửa danh mục"
                                onClick={() => startEditCategory(item)}
                                disabled={categorySubmitting}
                              >
                                <Pencil className="h-4 w-4" />
                              </AdminActionIconButton>
                              <AdminActionIconButton
                                title={item.isActive === false ? "Mở khóa" : "Khóa"}
                                onClick={() => void handleToggleCategoryActive(item)}
                                disabled={categorySubmitting}
                              >
                                {item.isActive === false ? (
                                  <LockOpen className="h-4 w-4" />
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                              </AdminActionIconButton>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                        >
                          Chưa có danh mục khóa học.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  {formMode === "create" ? "New Course" : "Edit Course"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formMode === "create"
                    ? "Tạo khóa học mới."
                    : "Cập nhật thông tin khóa học."}
                </p>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={resetForm}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Tên khóa học <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Nhập tên khóa học"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Danh mục <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Chọn danh mục</option>
                    {categories
                      .filter((item) => item.isActive !== false || item._id === form.category)
                      .map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Trạng thái
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value as ProductStatus,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="COMING">COMING</option>
                    <option value="FULL">FULL</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Thời lượng
                  </label>
                  <input
                    value={form.durationText}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, durationText: e.target.value }))
                    }
                    placeholder="Ví dụ: 3 tháng"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="md:col-span-2 grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="relative pt-2">
                    <label className="absolute left-4 top-0 z-10 bg-white px-2 text-sm font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                      Ảnh <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.imageSource}
                        onChange={(e) => {
                          const imageSource = e.target.value as ImageSource;
                          clearObjectUrl();
                          setForm((prev) => ({
                            ...prev,
                            imageSource,
                            image: null,
                            imageUrl: imageSource === "file" ? "" : prev.imageUrl,
                          }));
                          setImagePreview(
                            imageSource === "url"
                              ? form.imageUrl.trim() || editingItem?.image || ""
                              : editingItem?.image || ""
                          );
                        }}
                        className="h-14 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm font-bold text-slate-900 outline-none transition focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="file">Tệp</option>
                        <option value="url">Đường dẫn</option>
                      </select>
                      <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                    </div>
                  </div>

                  {form.imageSource === "file" ? (
                    <div className="relative pt-2">
                      <label className="absolute left-4 top-0 z-10 bg-white px-2 text-sm font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                        Tệp ảnh <span className="text-rose-600">*</span>
                      </label>
                      <div className="flex h-14 w-full items-center overflow-hidden rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 transition focus-within:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
                        <span className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-300">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Xem trước ảnh"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate px-4">
                          {form.image?.name ||
                            (editingItem?.image ? "Ảnh hiện tại" : "Chọn tệp")}
                        </span>
                        {form.image ? (
                          <button
                            type="button"
                            onClick={clearSelectedImageFile}
                            className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-100"
                            aria-label="Bỏ ảnh đã chọn"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                        <label
                          htmlFor="course-image-upload"
                          className="mr-4 cursor-pointer rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
                        >
                          Chọn
                        </label>
                        <input
                          ref={imageInputRef}
                          id="course-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setForm((prev) => ({
                              ...prev,
                              image: file,
                              imageUrl: "",
                            }));
                            setPreviewFromFile(file, editingItem?.image || "");
                          }}
                          className="sr-only"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative pt-2">
                      <label className="absolute left-4 top-0 z-10 bg-white px-2 text-sm font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                        URL ảnh banner <span className="text-rose-600">*</span>
                      </label>
                      <div className="flex gap-3">
                        <input
                          value={form.imageUrl}
                          onChange={(e) => {
                            const imageUrl = e.target.value;
                            clearObjectUrl();
                            setForm((prev) => ({
                              ...prev,
                              image: null,
                              imageUrl,
                            }));
                            setImagePreview(
                              imageUrl.trim() || editingItem?.image || ""
                            );
                          }}
                          placeholder="https://..."
                          className="h-14 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-300 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Xem trước ảnh"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Học phí <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Số học viên
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.studentCount}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, studentCount: e.target.value }))
                    }
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Mô tả ngắn
                  </label>
                  <textarea
                    value={form.shortDescription}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        shortDescription: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Nhập mô tả ngắn"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-white/10">
              <button
                type="button"
                onClick={resetForm}
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
                    : "Updating..."
                  : formMode === "create"
                  ? "Create Course"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
