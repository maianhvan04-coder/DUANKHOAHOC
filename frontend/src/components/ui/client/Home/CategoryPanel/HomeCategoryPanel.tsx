"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu } from "lucide-react";

import { categoryApi, type CategoryItem } from "@/app/api/category.api";

function CategorySkeleton() {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-6 animate-pulse rounded bg-slate-100" />
      ))}
    </div>
  );
}

export default function HomeCategoryPanel() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const response = await categoryApi.getAll();
        if (mounted) setCategories(response.items || []);
      } catch (error) {
        console.error("Load home categories failed:", error);
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

  return (
    <aside className="h-full min-h-[320px] overflow-hidden rounded-b-[4px] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.16)] md:min-h-[400px] lg:min-h-[500px]">
      <div className="flex h-12 items-center gap-3 bg-slate-100 px-4 text-base font-bold text-slate-700">
        <Menu className="h-5 w-5 shrink-0" />
        Các khóa học
      </div>

      {loading ? (
        <CategorySkeleton />
      ) : categories.length ? (
        <div className="py-2 2xl:py-2.5">
          {categories.map((item) => (
            <Link
              key={item._id}
              href="/#khoa-hoc"
              className="group flex h-10 items-center gap-3 px-4 text-sm font-medium text-slate-700 transition hover:bg-[#eef7ff] hover:text-[#0D56A6]"
            >
              <GraduationCap className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#0D56A6]" />
              <span className="line-clamp-1">{item.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-sm font-medium text-slate-500">
          Chưa có danh mục.
        </div>
      )}
    </aside>
  );
}
