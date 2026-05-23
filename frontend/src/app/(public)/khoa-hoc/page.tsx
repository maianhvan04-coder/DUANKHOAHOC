"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Heart, Search, Star, Users, X } from "lucide-react";

import { categoryApi, type CategoryItem } from "@/app/api/category.api";
import { cartApi } from "@/app/api/cart.api";
import {
  productApi,
  type ProductItem,
  type ProductLevel,
  type ProductMode,
  type ProductStatus,
} from "@/app/api/course.api";
import { paymentApi } from "@/app/api/payment.api";

type ApiError = {
  response?: {
    data?: {
      message?: string;
      error?: string;
      checkoutUrl?: string;
    };
  };
  message?: string;
};

type CheckoutResponse = {
  data?: {
    checkoutUrl?: string;
    data?: {
      checkoutUrl?: string;
    };
    item?: {
      checkoutUrl?: string;
    };
  };
};

const FAVORITE_STORAGE_KEY = "favorite_course_ids";
const FAVORITE_EVENT = "favorite-courses-change";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const apiError = error as ApiError;
    return (
      apiError.response?.data?.message ||
      apiError.response?.data?.error ||
      apiError.message ||
      fallback
    );
  }

  return fallback;
}

function getCheckoutUrl(response: CheckoutResponse) {
  return (
    response.data?.checkoutUrl ||
    response.data?.data?.checkoutUrl ||
    response.data?.item?.checkoutUrl ||
    ""
  );
}

function readFavoriteCourseIds() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(FAVORITE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : []
    );
  } catch {
    return new Set<string>();
  }
}

function writeFavoriteCourseIds(ids: Set<string>) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new Event(FAVORITE_EVENT));
}

function formatPrice(value?: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function getCategoryId(category: string | CategoryItem) {
  return typeof category === "string" ? category : category?._id || "";
}

function getCategoryName(category: string | CategoryItem, categories: CategoryItem[]) {
  if (typeof category !== "string") return category?.name || "Danh mục";

  return categories.find((item) => item._id === category)?.name || "Danh mục";
}

function getTeacherDisplayName(item: ProductItem) {
  if (item.teacher && typeof item.teacher !== "string") {
    return item.teacher.user?.name || item.teacherName || "Đang cập nhật";
  }

  return item.teacherName || "Đang cập nhật";
}

function getStatusLabel(status: ProductStatus) {
  if (status === "OPEN") return "Đang mở";
  if (status === "COMING") return "Sắp mở";
  return "Đã đầy";
}

function getStatusButtonLabel(status: ProductStatus) {
  if (status === "OPEN") return "Đăng ký";
  if (status === "COMING") return "Sắp mở";
  return "Đã đầy";
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

function getModeLabel(modes?: ProductMode[]) {
  if (!modes || modes.length === 0) return "Đang cập nhật";

  const modeMap: Record<ProductMode, string> = {
    ONLINE: "Online",
    OFFLINE: "Trực tiếp",
  };

  return modes.map((mode) => modeMap[mode]).join(" / ");
}

function ProductCard({
  item,
  categories,
  onViewDetails,
}: {
  item: ProductItem;
  categories: CategoryItem[];
  onViewDetails: (item: ProductItem) => void;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const canRegister = item.status === "OPEN" && item.isActive !== false;

  useEffect(() => {
    setIsFavorite(readFavoriteCourseIds().has(item._id));
  }, [item._id]);

  function toggleFavorite() {
    const ids = readFavoriteCourseIds();
    const next = !ids.has(item._id);

    if (next) {
      ids.add(item._id);
    } else {
      ids.delete(item._id);
    }

    writeFavoriteCourseIds(ids);
    setIsFavorite(next);
  }

  async function handleCheckoutNow() {
    if (!canRegister || checkingOut) return;

    try {
      setCheckingOut(true);
      setCheckoutError("");

      await cartApi.selectAll({ selected: false });
      await cartApi.addItem({ courseId: item._id, quantity: 1 });
      await cartApi.updateItemQuantity(item._id, { quantity: 1 });
      await cartApi.toggleItemSelected(item._id, { selected: true });

      const response = await paymentApi.createSession();
      const checkoutUrl = getCheckoutUrl(response);

      if (!checkoutUrl) {
        throw new Error("Không tạo được link thanh toán");
      }

      window.location.href = checkoutUrl;
    } catch (error: unknown) {
      setCheckoutError(getErrorMessage(error, "Không thể khởi tạo thanh toán"));
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <article className="grid min-h-[154px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-[#0D56A6]/40 hover:shadow-md sm:grid-cols-[42%_minmax(0,1fr)]">
      <div className="relative min-h-[154px] bg-slate-100">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[154px] items-center justify-center">
            <BookOpen size={32} className="text-slate-400" />
          </div>
        )}

        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold shadow-sm",
              getStatusClass(item.status)
            )}
          >
            {getStatusLabel(item.status)}
          </span>

          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white/95 shadow-sm transition hover:bg-rose-50",
              isFavorite
                ? "border-rose-200 text-rose-600"
                : "border-slate-200 text-slate-500 hover:text-rose-500"
            )}
          >
            <Heart
              className={cn("h-3.5 w-3.5", isFavorite && "fill-current")}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col p-3">
        <p className="mb-1 line-clamp-1 text-[11px] font-semibold text-[#0D56A6]">
          {getCategoryName(item.category, categories)}
        </p>

        <h2 className="line-clamp-2 text-[17px] font-black leading-5 text-slate-950">
          {item.title}
        </h2>

        <div className="mt-2 space-y-0.5 text-[12px] leading-5 text-slate-800">
          <p className="line-clamp-1">
            <span className="font-bold text-slate-950">Giảng viên:</span>{" "}
            {getTeacherDisplayName(item)}
          </p>
          <p>
            <span className="font-bold text-slate-950">Thời lượng:</span>{" "}
            {item.durationText || "Đang cập nhật"}
          </p>
          <p>
            <span className="font-bold text-slate-950">Trình độ:</span>{" "}
            {item.level || "Đang cập nhật"}
          </p>
          <p>
            <span className="font-bold text-slate-950">Hình thức:</span>{" "}
            {getModeLabel(item.modes)}
          </p>
          <p>
            <span className="font-bold text-slate-950">Học phí:</span>{" "}
            {typeof item.price === "number" ? formatPrice(item.price) : "Liên hệ"}
          </p>
        </div>

        <div className="mt-auto flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => onViewDetails(item)}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-[#0D56A6] bg-white px-3 text-[12px] font-bold text-[#0D56A6] transition hover:bg-[#F0F7FF]"
          >
            Xem chi tiết
          </button>

          <button
            type="button"
            onClick={() => void handleCheckoutNow()}
            disabled={!canRegister || checkingOut}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-[#0D56A6] px-3 text-[12px] font-bold text-white transition hover:bg-[#0B4A8E] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {checkingOut ? "Đang chuyển..." : getStatusButtonLabel(item.status)}
          </button>
        </div>

        {checkoutError ? (
          <p className="mt-2 line-clamp-2 text-[11px] font-semibold text-rose-600">
            {checkoutError}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function ProductsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="grid min-h-[154px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:grid-cols-[42%_minmax(0,1fr)]"
        >
          <div className="min-h-[154px] animate-pulse bg-slate-200" />
          <div className="p-3">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-5 animate-pulse rounded bg-slate-200" />
            <div className="mt-1 h-5 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 space-y-2">
              <div className="h-3 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="h-9 animate-pulse rounded bg-slate-100" />
              <div className="h-9 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function CourseDetailModal({
  item,
  categories,
  onClose,
}: {
  item: ProductItem;
  categories: CategoryItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Thông tin khóa học ${item.title}`}
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0D56A6]">
              {getCategoryName(item.category, categories)}
            </p>
            <h2 className="mt-1 line-clamp-1 text-xl font-black text-slate-950">
              {item.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(90vh-73px)] overflow-y-auto lg:grid-cols-[42%_minmax(0,1fr)]">
          <div className="relative min-h-[260px] bg-slate-100">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="h-full min-h-[260px] w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[260px] items-center justify-center">
                <BookOpen className="h-12 w-12 text-slate-400" />
              </div>
            )}

            <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full border px-3 py-1 text-xs font-bold shadow-sm",
                  getStatusClass(item.status)
                )}
              >
                {getStatusLabel(item.status)}
              </span>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 font-bold text-amber-700">
                <Star className="h-4 w-4 fill-current" />
                {Number(item.rating || 0).toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 font-bold text-[#0D56A6]">
                <Users className="h-4 w-4" />
                {Number(item.studentCount || 0).toLocaleString("vi-VN")} học viên
              </span>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              {item.shortDescription ||
                "Khóa học đang được cập nhật mô tả chi tiết. Bạn có thể xem các thông tin chính về giảng viên, thời lượng, trình độ và hình thức học bên dưới."}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailRow label="Giảng viên" value={getTeacherDisplayName(item)} />
              <DetailRow label="Thời lượng" value={item.durationText || "Đang cập nhật"} />
              <DetailRow label="Trình độ" value={item.level || "Đang cập nhật"} />
              <DetailRow label="Hình thức" value={getModeLabel(item.modes)} />
              <DetailRow
                label="Học phí"
                value={
                  typeof item.price === "number"
                    ? formatPrice(item.price)
                    : "Liên hệ"
                }
              />
              <DetailRow label="Trạng thái" value={getStatusLabel(item.status)} />
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-950">Thông tin đăng ký</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nhấn nút `Đăng ký` trên card khóa học để chuyển trực tiếp sang
                thanh toán online qua VNPAY.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const levelOptions: Array<{ value: "" | ProductLevel; label: string }> = [
  { value: "", label: "Trình độ (Tất cả)" },
  { value: "Cơ bản", label: "Cơ bản" },
  { value: "Trung cấp", label: "Trung cấp" },
  { value: "Nâng cao", label: "Nâng cao" },
];

const modeOptions: Array<{ value: "" | ProductMode; label: string }> = [
  { value: "", label: "Hình thức (Tất cả)" },
  { value: "ONLINE", label: "Online" },
  { value: "OFFLINE", label: "Trực tiếp" },
];

const statusOptions: Array<{ value: "" | ProductStatus; label: string }> = [
  { value: "", label: "Trạng thái (Tất cả)" },
  { value: "OPEN", label: "Đang mở" },
  { value: "COMING", label: "Sắp mở" },
  { value: "FULL", label: "Đã đầy" },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get("categoryId") || "";

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(selectedCategoryId);
  const [levelFilter, setLevelFilter] = useState<"" | ProductLevel>("");
  const [modeFilter, setModeFilter] = useState<"" | ProductMode>("");
  const [statusFilter, setStatusFilter] = useState<"" | ProductStatus>("");
  const [selectedCourse, setSelectedCourse] = useState<ProductItem | null>(null);

  useEffect(() => {
    setCategoryFilter(selectedCategoryId);
  }, [selectedCategoryId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [categoryRes, productRes] = await Promise.all([
          categoryApi.getAll(),
          productApi.getAll({ limit: 100 }),
        ]);

        setCategories(categoryRes.items || []);
        setProducts(productRes.items || []);
      } catch (error: unknown) {
        console.error(error);
        setCategories([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return products.filter((item) => {
      const categoryId = getCategoryId(item.category);

      if (categoryFilter && categoryId !== categoryFilter) return false;
      if (levelFilter && item.level !== levelFilter) return false;
      if (modeFilter && !item.modes?.includes(modeFilter)) return false;
      if (statusFilter && item.status !== statusFilter) return false;

      if (!query) return true;

      const searchableText = [
        item.title,
        item.shortDescription,
        getTeacherDisplayName(item),
        getCategoryName(item.category, categories),
        item.level,
        item.durationText,
        getModeLabel(item.modes),
        getStatusLabel(item.status),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    categories,
    categoryFilter,
    levelFilter,
    modeFilter,
    products,
    searchValue,
    statusFilter,
  ]);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="mx-auto max-w-[1240px] px-4 py-6 md:px-6">
        <form
          onSubmit={(event) => event.preventDefault()}
          className="mb-5 grid gap-2 lg:grid-cols-[minmax(240px,1fr)_170px_160px_190px_170px]"
        >
          <div className="flex h-10 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Tìm kiếm..."
              className="min-w-0 flex-1 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="inline-flex w-11 items-center justify-center bg-[#0D56A6] text-white transition hover:bg-[#0B4A8E]"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#0D56A6]"
          >
            <option value="">Danh mục (Tất cả)</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value as "" | ProductLevel)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#0D56A6]"
          >
            {levelOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={modeFilter}
            onChange={(event) => setModeFilter(event.target.value as "" | ProductMode)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#0D56A6]"
          >
            {modeOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "" | ProductStatus)
            }
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#0D56A6]"
          >
            {statusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </form>

        {loading ? (
          <ProductsSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <BookOpen className="text-slate-500" />
            </div>
            <h3 className="mt-4 text-[22px] font-semibold text-slate-900">
              Chưa có khóa học
            </h3>
            <p className="mt-2 text-[15px] text-slate-500">
              Không tìm thấy khóa học phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((item) => (
              <ProductCard
                key={item._id}
                item={item}
                categories={categories}
                onViewDetails={setSelectedCourse}
              />
            ))}
          </div>
        )}
      </section>

      {selectedCourse ? (
        <CourseDetailModal
          item={selectedCourse}
          categories={categories}
          onClose={() => setSelectedCourse(null)}
        />
      ) : null}
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}
