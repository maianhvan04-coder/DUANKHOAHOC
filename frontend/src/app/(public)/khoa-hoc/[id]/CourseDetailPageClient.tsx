"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { categoryApi, type CategoryItem } from "@/app/api/category.api";
import { productApi, type ProductItem } from "@/app/api/course.api";
import { CourseDetailView } from "@/components/ui/client/Home/Courses/HomeCourseSections";

type CourseDetailPageClientProps = {
  courseId: string;
};

async function loadCourse(courseId: string) {
  try {
    const data = await productApi.getById(courseId);
    return data.item;
  } catch (error) {
    const data = await productApi.getAll({ limit: 100 });
    const item = data.items.find(
      (course) => course._id === courseId || course.slug === courseId
    );
    if (!item) throw error;
    return item;
  }
}

export default function CourseDetailPageClient({
  courseId,
}: CourseDetailPageClientProps) {
  const router = useRouter();
  const [course, setCourse] = useState<ProductItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [courseItem, categoryData] = await Promise.all([
          loadCourse(courseId),
          categoryApi.getAll(),
        ]);

        if (!mounted) return;
        setCourse(courseItem);
        setCategories(categoryData.items || []);
      } catch {
        if (!mounted) return;
        setCourse(null);
        setCategories([]);
        setError("Không tìm thấy khóa học.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white py-8">
        <section className="mx-auto max-w-[1180px] px-4">
          <div className="mb-5 h-10 w-40 animate-pulse rounded bg-slate-100" />
          <div className="grid gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div>
              <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-10 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-6 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-4 aspect-video animate-pulse rounded-[2px] bg-slate-100" />
            </div>
            <div className="h-72 animate-pulse rounded-[2px] bg-slate-100 lg:mt-[118px]" />
          </div>
        </section>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="min-h-screen bg-white px-4 py-16">
        <section className="mx-auto max-w-[720px] rounded-[4px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h1 className="text-2xl font-black text-slate-900">
            Không tìm thấy khóa học
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Khóa học này không tồn tại hoặc đã bị ẩn.
          </p>
          <Link
            href="/#khoa-hoc"
            className="mt-6 inline-flex h-11 items-center rounded-[4px] bg-[#0D56A6] px-5 text-sm font-bold text-white transition hover:bg-[#0B4A8E]"
          >
            Quay lại danh sách
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <CourseDetailView
        course={course}
        index={0}
        categories={categories}
        onClose={() => router.push("/#khoa-hoc")}
      />
    </main>
  );
}
