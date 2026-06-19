"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Menu,
} from "lucide-react";

import { categoryApi, type CategoryItem } from "@/app/api/category.api";
import { productApi, type ProductItem } from "@/app/api/course.api";

function filterActiveTree(items: CategoryItem[]): CategoryItem[] {
  return items
    .filter((item) => item.isActive !== false)
    .map((item) => ({
      ...item,
      children: filterActiveTree(item.children || []),
    }));
}

function CategorySkeleton() {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-6 animate-pulse rounded bg-slate-100" />
      ))}
    </div>
  );
}

function getProductCategoryId(category: ProductItem["category"]) {
  return typeof category === "string" ? category : category?._id || "";
}

function collectCategoryIds(item?: CategoryItem): string[] {
  if (!item) return [];

  return [
    item._id,
    ...(item.children || []).flatMap((child) => collectCategoryIds(child)),
  ];
}

function CourseLink({ item }: { item: ProductItem }) {
  return (
    <Link
      href={`/khoa-hoc/${item._id}`}
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 transition hover:border-[#0D6EAF]/30 hover:bg-sky-50/60 hover:shadow-sm"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#0D6EAF] transition group-hover:bg-[#0D6EAF] group-hover:text-white">
        <BookOpen className="h-4 w-4" />
      </span>
      <span className="line-clamp-2 min-w-0 flex-1 text-[14px] font-bold leading-5 text-slate-800 transition group-hover:text-[#0D6EAF]">
        {item.title}
      </span>
    </Link>
  );
}

export default function HomeCategoryPanel() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [courses, setCourses] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [activeTab, setActiveTab] = useState<"courses" | "books">("courses");

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        setLoading(true);
        const [categoryResponse, productResponse] = await Promise.all([
          categoryApi.getTree(),
          productApi.getAll({ limit: 100 }),
        ]);

        if (mounted) {
          setCategories(categoryResponse.items || []);
          setCourses(productResponse.items || []);
        }
      } catch (error) {
        console.error("Load category panel failed:", error);

        if (mounted) {
          setCategories([]);
          setCourses([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  const rootCategories = useMemo(
    () => filterActiveTree(categories),
    [categories]
  );

  useEffect(() => {
    if (!activeCategoryId && rootCategories.length) {
      setActiveCategoryId(rootCategories[0]._id);
    }
  }, [activeCategoryId, rootCategories]);

  const activeCategory =
    rootCategories.find((item) => item._id === activeCategoryId) ||
    rootCategories[0];

  const activeCategoryIds = useMemo(
    () => new Set(collectCategoryIds(activeCategory)),
    [activeCategory]
  );

  const activeCourses = useMemo(
    () =>
      courses.filter(
        (course) =>
          course.isActive !== false &&
          !course.isDeleted &&
          activeCategoryIds.has(getProductCategoryId(course.category))
      ),
    [activeCategoryIds, courses]
  );

  return (
    <div className="group/category relative h-[240px] md:h-[320px] lg:h-[420px]">
      <aside className="h-full overflow-hidden rounded-b-[4px] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.16)]">
        <div className="flex h-12 items-center gap-3 border-b border-slate-100 bg-white px-4 text-[15px] font-semibold text-slate-700">
          <Menu className="h-5 w-5 shrink-0" />
          Các khóa học
        </div>

        {loading ? (
          <CategorySkeleton />
        ) : rootCategories.length ? (
          <div className="h-[calc(100%-48px)] overflow-y-auto bg-white py-2 2xl:py-2.5">
            {rootCategories.map((item) => {
              const active = item._id === activeCategory?._id;

              return (
                <button
                  key={item._id}
                  type="button"
                  onMouseEnter={() => {
                    setActiveCategoryId(item._id);
                    setActiveTab("courses");
                  }}
                  onFocus={() => {
                    setActiveCategoryId(item._id);
                    setActiveTab("courses");
                  }}
                  className={[
                    "group/item relative flex h-10 w-full items-center gap-3 px-4 text-left text-[14px] font-medium transition",
                    active
                      ? "bg-[#eef4fa] text-[#0D6EAF]"
                      : "text-slate-700 hover:bg-[#f5f9ff] hover:text-[#0D6EAF]",
                  ].join(" ")}
                >
                  <GraduationCap
                    className={[
                      "h-4 w-4 shrink-0 transition",
                      active
                        ? "text-[#0D6EAF]"
                        : "text-slate-400 group-hover/item:text-[#0D6EAF]",
                    ].join(" ")}
                  />
                  <span className="line-clamp-1">{item.name}</span>
                  {active ? (
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-6 text-sm font-medium text-slate-500">
            Chưa có danh mục.
          </div>
        )}
      </aside>

      {rootCategories.length ? (
        <div className="invisible absolute left-full top-0 z-50 hidden h-full min-h-[420px] w-[760px] translate-x-0 overflow-hidden rounded-r-[4px] border-l-2 border-[#0D6EAF] bg-white opacity-0 shadow-[0_12px_36px_rgba(15,23,42,0.20)] transition duration-150 group-hover/category:visible group-hover/category:opacity-100 lg:block xl:w-[820px]">
          <div className="flex h-14 border-b border-slate-100">
            <button
              type="button"
              onMouseEnter={() => setActiveTab("courses")}
              onFocus={() => setActiveTab("courses")}
              className={[
                "relative h-full px-6 text-[14px] font-bold uppercase transition",
                activeTab === "courses"
                  ? "bg-[#0D6EAF] text-white"
                  : "bg-white text-slate-700 hover:text-[#0D6EAF]",
              ].join(" ")}
            >
              Khóa học
              {activeTab === "courses" ? (
                <span className="absolute bottom-[-8px] left-1/2 h-0 w-0 -translate-x-1/2 border-x-[8px] border-t-[8px] border-x-transparent border-t-[#0D6EAF]" />
              ) : null}
            </button>

            <button
              type="button"
              onMouseEnter={() => setActiveTab("books")}
              onFocus={() => setActiveTab("books")}
              className={[
                "h-full px-7 text-[14px] font-semibold uppercase transition",
                activeTab === "books"
                  ? "bg-[#0D6EAF] text-white"
                  : "bg-white text-slate-700 hover:text-[#0D6EAF]",
              ].join(" ")}
            >
              Sách
            </button>
          </div>

          {activeTab === "courses" ? (
            <div className="h-[calc(100%-56px)] overflow-y-auto px-5 py-5">
              <div className="mb-4">
                <h3 className="text-[17px] font-black uppercase tracking-[0.01em] text-[#0D6EAF]">
                  Khóa học {activeCategory?.name || ""}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Chọn khóa học để xem chi tiết và đăng ký.
                </p>
              </div>

              {activeCourses.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {activeCourses.map((course) => (
                    <CourseLink key={course._id} item={course} />
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                  <div>
                    <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-[15px] font-bold text-slate-700">
                      Chưa có khóa học trong danh mục này
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Vui lòng chọn danh mục khác hoặc quay lại sau.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[calc(100%-56px)] items-center justify-center px-8 text-center">
              <div>
                <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-[15px] font-semibold text-slate-700">
                  Sắp ra mắt
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Tủ sách học tập đang được cập nhật.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
