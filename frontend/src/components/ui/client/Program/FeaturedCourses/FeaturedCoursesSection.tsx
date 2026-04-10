"use client";

import Image from "next/image";
import { Star, Users } from "lucide-react";

type CourseItem = {
  id: number;
  title: string;
  image: string;
  category: string;
  rating: number;
  students: string;
};

const FEATURED_COURSES: CourseItem[] = [
  {
    id: 1,
    title: "Toán Tư Duy Nền Tảng",
    image: "/Program/FeaturedCourses/course-1.jpg",
    category: "TOÁN HỌC",
    rating: 4.8,
    students: "1,280",
  },
  {
    id: 2,
    title: "IELTS 7.0+ Cấp Tốc",
    image: "/Program/FeaturedCourses/course-2.webp",
    category: "TIẾNG ANH",
    rating: 4.9,
    students: "1,230",
  },
  {
    id: 3,
    title: "HSK 1 - HSK 6 Nâng Cao",
    image: "/Program/FeaturedCourses/course-3.jpg",
    category: "TIẾNG TRUNG",
    rating: 4.8,
    students: "1,256",
  },
  {
    id: 4,
    title: "Lập Trình (Cơ bản - Nâng cao)",
    image: "/Program/FeaturedCourses/course-4.png",
    category: "Lập Trình",
    rating: 4.8,
    students: "1,200",
  },
];

function FeaturedCourseCard({ course }: { course: CourseItem }) {
  return (
    <article className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,35,67,0.08)]">
      <div className="px-2.5 pt-2.5">
        <div className="relative h-[110px] w-full overflow-hidden rounded-[10px]">
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 25vw"
          />

          <span className="absolute left-2 top-2 inline-flex rounded-full bg-[#4ea4d8]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            {course.category}
          </span>
        </div>
      </div>

      <div className="px-3 pb-3 pt-2.5">
        <h3 className="line-clamp-2 min-h-[40px] text-[13px] font-bold leading-5 tracking-[-0.02em] text-[#16243d]">
          {course.title}
        </h3>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[#ffb547] text-[#ffb547]" />
            <span>{course.rating}/5</span>
          </div>

          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>{course.students} đăng ký</span>
          </div>
        </div>

        <button className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full bg-[#0f2f63] text-[13px] font-semibold text-white transition hover:bg-[#0c2753]">
          Xem chi tiết
        </button>
      </div>
    </article>
  );
}

export default function FeaturedCoursesSection() {
  return (
    <section className="bg-white px-4 py-10 md:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-[28px] font-bold tracking-[-0.03em] text-[#16243d] md:text-[34px]">
            Các Khóa Học Nổi Bật
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_COURSES.map((course) => (
            <FeaturedCourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}