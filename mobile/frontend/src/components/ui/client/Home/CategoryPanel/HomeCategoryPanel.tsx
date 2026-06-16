"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Layers3,
  Menu,
} from "lucide-react";

import { categoryApi, type CategoryItem } from "@/app/api/category.api";

function getCategoryHref() {
  return "/#khoa-hoc";
}

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

function RecursiveCategoryLinks({
  items,
  depth = 0,
}: {
  items: CategoryItem[];
  depth?: number;
}) {
  return (
    <div className={depth === 0 ? "grid gap-x-8 gap-y-1.5 md:grid-cols-2 xl:grid-cols-3" : "mt-1 space-y-1 border-l border-slate-100 pl-4"}>
      {items.map((item) => {
        const children = item.children || [];
        const Icon = depth === 0 ? BookOpen : Layers3;

        return (
          <div key={item._id} className="min-w-0">
            <Link
              href={getCategoryHref()}
              className="group flex min-h-8 items-center gap-2 text-[14px] font-medium leading-5 text-slate-700 transition hover:text-[#0D6EAF]"
            >
              <Icon className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-[#0D6EAF]" />
              <span className="line-clamp-2">{item.name}</span>
            </Link>

            {children.length ? (
              <RecursiveCategoryLinks items={children} depth={depth + 1} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CategoryGroup({ item }: { item: CategoryItem }) {
  const children = item.children || [];

  return (
    <section>
      <h3 className="text-[16px] font-bold uppercase tracking-[0.01em] text-[#0D6EAF]">
        {item.name}
      </h3>

      <div className="mt-2">
        {children.length ? (
          <RecursiveCategoryLinks items={children} />
        ) : (
          <RecursiveCategoryLinks items={[item]} />
        )}
      </div>
    </section>
  );
}

export default function HomeCategoryPanel() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [activeTab, setActiveTab] = useState<"courses" | "books">("courses");

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        setLoading(true);
        const response = await categoryApi.getTree();

        if (mounted) setCategories(response.items || []);
      } catch (error) {
        console.error("Load category tree failed:", error);

        if (mounted) setCategories([]);
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

  const panelGroups =
    activeCategory?.children?.length ? activeCategory.children : rootCategories;

  return (
    <div className="group/category relative h-full min-h-[320px] md:min-h-[400px] lg:min-h-[500px]">
      <aside className="h-full overflow-hidden rounded-b-[4px] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.16)]">
        <div className="flex h-12 items-center gap-3 bg-slate-100 px-4 text-[15px] font-semibold text-slate-700">
          <Menu className="h-5 w-5 shrink-0" />
          Các khóa học
        </div>

        {loading ? (
          <CategorySkeleton />
        ) : rootCategories.length ? (
          <div className="max-h-[calc(100%-48px)] overflow-y-auto py-2 2xl:py-2.5">
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
              <div className="space-y-5">
                {panelGroups.map((item) => (
                  <CategoryGroup key={item._id} item={item} />
                ))}
              </div>
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
