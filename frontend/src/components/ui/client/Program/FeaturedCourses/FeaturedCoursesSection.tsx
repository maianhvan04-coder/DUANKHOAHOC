"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star, Users } from "lucide-react";

import { categoryApi, type CategoryItem } from "@/app/api/category.api";
import {
  productApi,
  type ProductItem,
  type ProductStatus,
} from "@/app/api/course.api";

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

function getStatusClass(status: ProductStatus) {
  if (status === "OPEN") return "bg-emerald-600 text-white";
  if (status === "COMING") return "bg-amber-500 text-white";
  return "bg-rose-600 text-white";
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

function FeaturedCourseCard({
  course,
  index,
  categories,
}: {
  course: ProductItem;
  index: number;
  categories: CategoryItem[];
}) {
  const image = getCourseImage(course, index);

  return (
    <article className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,35,67,0.08)]">
      <div className="px-2.5 pt-2.5">
        <div className="relative h-[110px] w-full overflow-hidden rounded-[10px] bg-slate-100">
          {image ? (
            <Image
              src={image}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <BookOpen className="h-8 w-8" />
            </div>
          )}

          <div className="absolute left-2 top-2 flex max-w-[calc(100%-16px)] flex-wrap gap-1.5">
            <span className="inline-flex rounded-full bg-[#4ea4d8]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
              {getCategoryName(course.category, categories)}
            </span>
            <span
              className={[
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
                getStatusClass(course.status),
              ].join(" ")}
            >
              {getStatusLabel(course.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 pb-3 pt-2.5">
        <h3 className="line-clamp-2 min-h-[40px] text-[13px] font-bold leading-5 tracking-[-0.02em] text-[#16243d]">
          {course.title}
        </h3>

        <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-500">
          Giảng viên: {getTeacherDisplayName(course)}
        </p>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[#ffb547] text-[#ffb547]" />
            <span>{Number(course.rating || 0).toFixed(1)}/5</span>
          </div>

          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {Number(course.studentCount || 0).toLocaleString("vi-VN")} đăng ký
            </span>
          </div>
        </div>

        <p className="mt-2 text-[14px] font-black text-[#0f2f63]">
          {typeof course.price === "number" ? formatPrice(course.price) : "Liên hệ"}
        </p>

        <Link
          href="/#khoa-hoc"
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full bg-[#0f2f63] text-[13px] font-semibold text-white transition hover:bg-[#0c2753]"
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}

function FeaturedCourseSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[260px] animate-pulse rounded-[14px] border border-slate-200 bg-white p-2.5 shadow-[0_6px_18px_rgba(15,35,67,0.08)]"
        >
          <div className="h-[110px] rounded-[10px] bg-slate-100" />
          <div className="mt-4 h-4 rounded bg-slate-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-4 h-3 w-24 rounded bg-slate-100" />
          <div className="mt-6 h-9 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function FeaturedCoursesSection() {
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
        console.error("Load program featured courses failed:", error);

        if (!mounted) return;

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

  const featuredCourses = useMemo(() => {
    return products
      .filter((item) => item.isActive !== false && !item.isDeleted)
      .slice(0, 4);
  }, [products]);

  return (
    <section
      id="khoa-hoc-noi-bat"
      className="bg-white px-4 py-10 md:px-6 lg:px-8 lg:py-14"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#16243d] md:text-[34px]">
            Các Khóa Học Nổi Bật
          </h2>
        </div>

        <div className="mt-8">
          {loading ? (
            <FeaturedCourseSkeleton />
          ) : featuredCourses.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCourses.map((course, index) => (
                <FeaturedCourseCard
                  key={course._id}
                  course={course}
                  index={index}
                  categories={categories}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
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
