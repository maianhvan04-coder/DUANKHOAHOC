"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
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
import {
  teacherApi,
  type TeacherItem,
} from "@/app/api/teacher.api";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type ViewMode = "active" | "deleted";
type FormMode = "create" | "edit";

type ProductFormState = {
  title: string;
  teacher: string;
  category: string;
  image: File | null;
  shortDescription: string;
  durationText: string;
  status: ProductStatus;
  price: string;
  rating: string;
  studentCount: string;
};

const INITIAL_FORM: ProductFormState = {
  title: "",
  teacher: "",
  category: "",
  image: null,
  shortDescription: "",
  durationText: "",
  status: "OPEN",
  price: "",
  rating: "0",
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

function getTeacherId(teacher: ProductItem["teacher"]) {
  if (!teacher) return "";
  return typeof teacher === "string" ? teacher : teacher._id || "";
}

function getTeacherDisplayName(item: ProductItem) {
  if (item.teacher && typeof item.teacher !== "string") {
    return item.teacher.user?.name || item.teacherName || "Chưa có giảng viên";
  }

  return item.teacherName || "Chưa có giảng viên";
}

function getTeacherOptionLabel(item: TeacherItem) {
  return item.specialty
    ? `${item.name} - ${item.specialty}`
    : item.name || "Giảng viên";
}

function getStatusClass(status: ProductStatus) {
  if (status === "OPEN") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "COMING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="relative min-w-[160px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-emerald-600"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [form, setForm] = useState<ProductFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const objectUrlRef = useRef<string | null>(null);

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

  useEffect(() => {
    return () => {
      clearObjectUrl();
    };
  }, []);

  const loadData = async (mode: ViewMode = viewMode) => {
    try {
      setLoading(true);

      const [productRes, categoryRes, teacherRes] = await Promise.all([
        mode === "active"
          ? productApi.getAll({ limit: 100 })
          : productApi.getDeleted(),
        categoryApi.getAll(),
        teacherApi.list(),
      ]);

      setProducts(productRes.items || []);
      setCategories(categoryRes.items || []);
      setTeachers(teacherRes || []);
    } catch (error) {
      console.error(error);
      alert(
        mode === "active"
          ? "Không tải được khóa học"
          : "Không tải được khóa học đã xóa"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(viewMode);
  }, [viewMode]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const keyword = search.trim().toLowerCase();

      const matchSearch =
        !keyword ||
        item.title?.toLowerCase().includes(keyword) ||
        getTeacherDisplayName(item).toLowerCase().includes(keyword) ||
        getCategoryName(item.category).toLowerCase().includes(keyword);

      const matchCategory =
        categoryFilter === "ALL" || getCategoryId(item.category) === categoryFilter;

      const matchStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const from = filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, filteredProducts.length);

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
      teacher: getTeacherId(item.teacher),
      category: getCategoryId(item.category),
      image: null,
      shortDescription: item.shortDescription || "",
      durationText: item.durationText || "",
      status: item.status || "OPEN",
      price: String(item.price ?? ""),
      rating: String(item.rating ?? 0),
      studentCount: String(item.studentCount ?? 0),
    });
    setImagePreview(item.image || "");
    setIsFormOpen(true);
  };

  const handleRefresh = async () => {
    setSearch("");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
    await loadData(viewMode);
  };

  const handleSubmitForm = async () => {
    const title = form.title.trim();
    const teacher = form.teacher.trim();
    const category = form.category;
    const shortDescription = form.shortDescription.trim();
    const durationText = form.durationText.trim();

    if (!title) {
      alert("Vui lòng nhập tên khóa học");
      return;
    }

    if (!category) {
      alert("Vui lòng chọn danh mục");
      return;
    }

    if (!teacher) {
      alert("Vui lòng chọn giảng viên mặc định");
      return;
    }

    if (Number(form.price || 0) < 0) {
      alert("Học phí không được âm");
      return;
    }

    if (Number(form.rating || 0) < 0) {
      alert("Rating không được âm");
      return;
    }

    if (Number(form.studentCount || 0) < 0) {
      alert("Số học viên không được âm");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title,
        teacher,
        category,
        image: form.image,
        shortDescription,
        durationText,
        status: form.status,
        price: form.price || "0",
        rating: form.rating || "0",
        studentCount: form.studentCount || "0",
      };

      if (formMode === "create") {
        await productApi.create(payload);
        alert("Thêm khóa học thành công");
      } else {
        if (!editingItem?._id) return;
        await productApi.update(editingItem._id, payload);
        alert("Cập nhật khóa học thành công");
      }

      resetForm();
      setViewMode("active");
      setPage(1);
      await loadData("active");
    } catch (error) {
      console.error(error);
      alert(
        formMode === "create"
          ? "Thêm khóa học thất bại"
          : "Cập nhật khóa học thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    const ok = window.confirm("Bạn có chắc muốn xóa mềm khóa học này?");
    if (!ok) return;

    try {
      await productApi.remove(id);
      await loadData(viewMode);
    } catch (error) {
      console.error(error);
      alert("Xóa mềm khóa học thất bại");
    }
  };

  const handleRestore = async (id: string) => {
    const ok = window.confirm("Bạn có chắc muốn khôi phục khóa học này?");
    if (!ok) return;

    try {
      await productApi.restore(id);
      await loadData(viewMode);
    } catch (error) {
      console.error(error);
      alert("Khôi phục khóa học thất bại");
    }
  };

  const handleForceDelete = async (id: string) => {
    const ok = window.confirm(
      "Bạn có chắc muốn xóa cứng khóa học này? Hành động này không thể hoàn tác."
    );
    if (!ok) return;

    try {
      await productApi.forceRemove(id);
      await loadData(viewMode);
    } catch (error) {
      console.error(error);
      alert("Xóa cứng khóa học thất bại");
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

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-col gap-3 lg:flex-row">
                <div className="relative w-full max-w-[420px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search title, teacher, category..."
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
                  />
                </div>

                <FilterSelect
                  value={categoryFilter}
                  onChange={(value) => {
                    setCategoryFilter(value);
                    setPage(1);
                  }}
                  options={[
                    { label: "All Category", value: "ALL" },
                    ...categories.map((item) => ({
                      label: item.name,
                      value: item._id,
                    })),
                  ]}
                />

                <FilterSelect
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                  options={[
                    { label: "All Status", value: "ALL" },
                    { label: "Open", value: "OPEN" },
                    { label: "Coming", value: "COMING" },
                    { label: "Full", value: "FULL" },
                  ]}
                />
              </div>

              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 px-4 text-xs font-semibold text-slate-700">
                {filteredProducts.length} FOUND
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                                {getTeacherDisplayName(item)}
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
                  <span className="font-semibold text-slate-900">{filteredProducts.length}</span>
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
          <div className="w-full max-w-[560px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {formMode === "create" ? "New Course" : "Edit Course"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formMode === "create"
                    ? "Tạo khóa học mới."
                    : "Cập nhật thông tin khóa học."}
                </p>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={resetForm}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tên khóa học <span className="text-rose-600">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Nhập tên khóa học"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Giảng viên mặc định <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={form.teacher}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, teacher: e.target.value }))
                    }
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-600"
                  >
                    <option value="">Chọn giảng viên</option>
                    {teachers.map((item) => (
                      <option key={item._id} value={item._id}>
                        {getTeacherOptionLabel(item)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Danh mục <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-600"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
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
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-600"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="COMING">COMING</option>
                    <option value="FULL">FULL</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Thời lượng
                  </label>
                  <input
                    value={form.durationText}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, durationText: e.target.value }))
                    }
                    placeholder="Ví dụ: 3 tháng"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Ảnh
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setForm((prev) => ({ ...prev, image: file }));
                      setPreviewFromFile(file, editingItem?.image || "");
                    }}
                    className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
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
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Rating
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={form.rating}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, rating: e.target.value }))
                    }
                    placeholder="0"
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
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
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
                  />
                </div>

                {imagePreview ? (
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Preview
                    </label>
                    <div className="h-[120px] w-full overflow-hidden rounded-md border border-slate-300 bg-slate-100">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={resetForm}
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