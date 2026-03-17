"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Star,
  Users,
} from "lucide-react";

import {
  categoryApi,
  type CategoryItem,
} from "@/app/api/category.api";
import {
  productApi,
  type ProductItem,
  type ProductStatus,
} from "@/app/api/product.api";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatPrice(value?: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatNumber(value?: number) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function getCategoryId(category: string | CategoryItem) {
  return typeof category === "string" ? category : category?._id || "";
}

function getStatusLabel(status: ProductStatus) {
  if (status === "OPEN") return "Đang mở";
  if (status === "COMING") return "Sắp mở";
  return "Đã đầy";
}

function getStatusClass(status: ProductStatus) {
  if (status === "OPEN") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "COMING") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-rose-50 text-rose-700 border-rose-200";
}

function getDiscountPercent(originalPrice?: number, price?: number) {
  const original = Number(originalPrice || 0);
  const sale = Number(price || 0);

  if (!original || !sale || sale >= original) return 0;

  return Math.round(((original - sale) / original) * 100);
}

function ProductCard({ item }: { item: ProductItem }) {
  const discount = getDiscountPercent(item.originalPrice, item.price);

  return (
    <article className="group w-[280px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="relative h-[160px] overflow-hidden bg-slate-100">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen size={32} className="text-slate-400" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              getStatusClass(item.status)
            )}
          >
            {getStatusLabel(item.status)}
          </span>

          {discount > 0 ? (
            <span className="rounded-full bg-[#111827] px-2.5 py-1 text-[11px] font-semibold text-white">
              -{discount}%
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[48px] text-[16px] font-semibold leading-6 text-slate-900">
          {item.title}
        </h3>

        <p className="mt-1 line-clamp-1 text-[13px] text-slate-500">
          {item.teacherName || "Đang cập nhật giảng viên"}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-slate-500">
          <span className="flex items-center gap-1">
            <Star size={13} className="text-amber-500" />
            <span>{item.rating || 0}</span>
          </span>

          <span className="flex items-center gap-1">
            <Users size={13} />
            <span>{formatNumber(item.studentCount)}</span>
          </span>

          <span className="flex items-center gap-1">
            <Clock3 size={13} />
            <span>{item.durationText || "--"}</span>
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="min-h-[16px] text-[12px] text-slate-400 line-through">
              {Number(item.originalPrice || 0) > Number(item.price || 0)
                ? formatPrice(item.originalPrice)
                : ""}
            </p>
            <p className="text-[22px] font-bold leading-none text-[#DC2626]">
              {formatPrice(item.price)}
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Xem khóa học
          </button>
        </div>
      </div>
    </article>
  );
}

function CategorySection({
  category,
  items,
  sectionId,
}: {
  category: CategoryItem;
  items: ProductItem[];
  sectionId: string;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = rowRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    updateScrollState();

    const el = rowRef.current;
    if (!el) return;

    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [items.length]);

  const scrollRow = (direction: "left" | "right") => {
    if (!rowRef.current) return;

    rowRef.current.scrollBy({
      left: direction === "left" ? -620 : 620,
      behavior: "smooth",
    });
  };

  return (
    <section
      id={sectionId}
      className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 md:p-6"
    >
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-600">
            {items.length} khóa học
          </div>

          <h2 className="text-[24px] font-bold leading-tight text-slate-900 md:text-[28px]">
            {category.name}
          </h2>

          <p className="mt-1 text-[14px] text-slate-500">
            {category.description || "Danh sách khóa học trong danh mục này"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollRow("left")}
            disabled={!canScrollLeft}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => scrollRow("right")}
            disabled={!canScrollRight}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <ProductCard key={item._id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6"
        >
          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-3 h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />

          <div className="mt-6 flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((__, j) => (
              <div
                key={j}
                className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="h-[160px] animate-pulse bg-slate-200" />
                <div className="p-4">
                  <div className="h-5 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="mt-5 h-10 animate-pulse rounded bg-slate-100" />
                  <div className="mt-4 h-8 w-24 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get("categoryId") || "";

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState("");

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
      } catch (error) {
        console.error(error);
        setCategories([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const sections = useMemo(() => {
    const grouped = new Map<string, ProductItem[]>();

    for (const product of products) {
      const categoryId = getCategoryId(product.category);
      if (!categoryId) continue;

      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }

      grouped.get(categoryId)?.push(product);
    }

    return categories
      .map((category) => ({
        category,
        items: grouped.get(category._id) || [],
      }))
      .filter((section) => section.items.length > 0);
  }, [categories, products]);

  const totalStudents = useMemo(() => {
    return products.reduce(
      (sum, item) => sum + Number(item.studentCount || 0),
      0
    );
  }, [products]);

  const scrollToCategory = (categoryId: string) => {
    const el = document.getElementById(`category-${categoryId}`);
    if (!el) return;

    setActiveCategoryId(categoryId);

    el.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    if (loading) return;
    if (!selectedCategoryId) return;

    const timer = window.setTimeout(() => {
      scrollToCategory(selectedCategoryId);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [loading, selectedCategoryId]);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[760px]">
              <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Danh sách khóa học
              </p>

              <h1 className="mt-2 text-[30px] font-bold leading-tight text-slate-900 md:text-[40px]">
                Chọn khóa học phù hợp với mục tiêu của bạn
              </h1>

              <p className="mt-3 text-[15px] leading-7 text-slate-600">
                Tổng hợp các khóa học theo từng danh mục, hiển thị rõ giảng viên,
                số lượng học viên, đánh giá và học phí để người dùng dễ lựa chọn.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[12px] text-slate-500">Danh mục</p>
                <p className="mt-1 text-[24px] font-bold text-slate-900">
                  {formatNumber(categories.length)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[12px] text-slate-500">Khóa học</p>
                <p className="mt-1 text-[24px] font-bold text-slate-900">
                  {formatNumber(products.length)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[12px] text-slate-500">Học viên</p>
                <p className="mt-1 text-[24px] font-bold text-slate-900">
                  {formatNumber(totalStudents)}
                </p>
              </div>
            </div>
          </div>

          {!loading && sections.length > 0 ? (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <p className="mb-3 text-[14px] font-semibold text-slate-900">
                Danh mục khóa học
              </p>

              <div className="flex flex-wrap gap-3">
                {sections.map((section) => (
                  <button
                    key={section.category._id}
                    type="button"
                    onClick={() => scrollToCategory(section.category._id)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-[14px] font-semibold transition",
                      activeCategoryId === section.category._id ||
                        selectedCategoryId === section.category._id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {section.category.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {loading ? (
          <ProductsSkeleton />
        ) : sections.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <BookOpen className="text-slate-500" />
            </div>
            <h3 className="mt-4 text-[22px] font-semibold text-slate-900">
              Chưa có khóa học
            </h3>
            <p className="mt-2 text-[15px] text-slate-500">
              Hiện chưa có dữ liệu để hiển thị.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <CategorySection
                key={section.category._id}
                category={section.category}
                items={section.items}
                sectionId={`category-${section.category._id}`}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}