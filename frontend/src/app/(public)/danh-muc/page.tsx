"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FolderKanban } from "lucide-react";
import { categoryApi, type CategoryItem } from "@/app/api/category.api";

export default function CategoriesPage() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await categoryApi.getAll();
        setItems(res.items || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  return (
    <main className="min-h-screen bg-[#F3F4F6]">
      <section className="mx-auto max-w-300 px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#1F2937]">
            Danh mục khóa học
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Chọn danh mục để xem sản phẩm bên trong
          </p>
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-65 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
            <p className="text-slate-500">Chưa có danh mục nào</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item._id}
                href={`/products?categoryId=${item._id}`}
                className="group rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1677FF] text-white">
                  <FolderKanban size={22} />
                </div>

                <h3 className="mt-4 text-lg font-bold text-[#1F2937]">
                  {item.name}
                </h3>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                  {item.description || "Danh mục này đang được cập nhật mô tả."}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1677FF]">
                  Xem khóa học
                  <ArrowRight
                    size={16}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}