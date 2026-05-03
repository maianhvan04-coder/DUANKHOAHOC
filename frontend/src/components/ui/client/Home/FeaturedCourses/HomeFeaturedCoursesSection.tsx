"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star, Users } from "lucide-react";
import { categoryApi, type CategoryItem } from "@/app/api/category.api";
import { productApi, type ProductItem, type ProductStatus } from "@/app/api/course.api";

const FALLBACK_COURSE_IMAGES = [
  "/Program/FeaturedCourses/course-1.jpg",
  "/Program/FeaturedCourses/course-2.webp",
  "/Program/FeaturedCourses/course-3.jpg",
  "/Program/FeaturedCourses/course-4.png",
];

function formatPrice(value?: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function getCategoryName(category: ProductItem["category"], categories: CategoryItem[]) {
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

function isAllowedImage(src?: string | null) {
  if (!src) return false;
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function getCourseImage(item: ProductItem, index: number) {
  if (isAllowedImage(item.image)) return item.image || "";
  return FALLBACK_COURSE_IMAGES[index % FALLBACK_COURSE_IMAGES.length];
}

function CourseCard({ item, index, categories }: {
  item: ProductItem;
  index: number;
  categories: CategoryItem[];
}) {
  const image = getCourseImage(item, index);

  return (
    <article className="overflow-hidden rounded-[12px] border border-slate-200 bg-white p-2 shadow-[0_8px_22px_rgba(15,23,42,0.10)]">
      <div className="relative h-[142px] overflow-hidden rounded-[10px] bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <BookOpen className="h-8 w-8" />
          </div>
        )}

        <span className="absolute left-2 top-2 rounded-full bg-[#E6F8EA] px-2.5 py-1 text-[11px] font-bold text-emerald-700">
          {getStatusLabel(item.status)}
        </span>
      </div>

      <div className="px-2 pb-2 pt-3">
        <p className="mb-1 line-clamp-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0D56A6]">
          {getCategoryName(item.category, categories)}
        </p>
        <h3 className="line-clamp-2 min-h-10 text-[15px] font-black leading-5 text-[#16243d]">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-1 text-[12px] font-semibold text-slate-500">
          {getTeacherDisplayName(item)}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2 text-[12px] font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-[#FFC247] text-[#FFC247]" />
            {Number(item.rating || 0).toFixed(1)}/5
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4 text-slate-400" />
            {Number(item.studentCount || 0).toLocaleString("vi-VN")}
          </span>
        </div>
        <p className="mt-2 text-[15px] font-black text-[#0B2C5F]">
          {formatPrice(item.price)}
        </p>
        <Link
          href="/khoa-hoc"
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-[8px] bg-[#0D56A6] text-[13px] font-bold text-white transition hover:bg-[#0B4A8E]"
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}

function CourseSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[292px] animate-pulse rounded-[12px] border border-slate-200 bg-white p-2 shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
        >
          <div className="h-[142px] rounded-[10px] bg-slate-100" />
          <div className="mt-3 h-3 w-20 rounded bg-slate-100" />
          <div className="mt-3 h-4 rounded bg-slate-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-8 h-9 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function HomeFeaturedCoursesSection() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [categoryRes, productRes] = await Promise.all([
          categoryApi.getAll(),
          productApi.getAll({ limit: 100 }),
        ]);

        if (!mounted) return;
        setCategories(categoryRes.items || []);
        setProducts(productRes.items || []);
      } catch (error) {
        console.error("Load featured products failed:", error);
        if (!mounted) {
          return;
        }
        setCategories([]);
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredProducts = useMemo(() => {
    return products
      .filter((item) => item.isActive !== false && !item.isDeleted)
      .slice(0, 4);
  }, [products]);

  return (
    <section className="px-4 pb-14 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <h2 className="text-center text-[30px] font-black text-[#0B2C5F]">
          Các Khóa Học Nổi Bật
        </h2>

        <div className="mt-6">
          {loading ? (
            <CourseSkeleton />
          ) : featuredProducts.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((item, index) => (
                <CourseCard
                  key={item._id}
                  item={item}
                  index={index}
                  categories={categories}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <BookOpen className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-3 text-[15px] font-semibold text-slate-500">
                Chưa có khóa học nổi bật để hiển thị.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
