"use client";

import Link from "next/link";
import StudentAchievementCard, {
  type StudentAchievementItem,
} from "./StudentAchievementCard";

const ACHIEVEMENTS: StudentAchievementItem[] = [
  {
    name: "Đoàn Phương Anh",
    role: "Học viên Ngoại ngữ tại Everest",
    image: "/home/students/student-1.png",
    imageAlt: "Đoàn Phương Anh",
    score: "8.0",
    exam: "IELTS",
    skill: "Ngoại ngữ",
  },
  {
    name: "Nguyễn Tú Ngọc",
    role: "Học viên Ngoại ngữ tại Everest",
    image: "/home/students/student-2.png",
    imageAlt: "Nguyễn Tú Ngọc",
    score: "950",
    exam: "TOEIC",
    skill: "L&R",
  },
  {
    name: "Nguyễn Đỗ Tuệ Linh",
    role: "Học viên Toán học tại Everest",
    image: "/home/students/student-3.png",
    imageAlt: "Nguyễn Đỗ Tuệ Linh",
    score: "9.6",
    exam: "Toán",
    skill: "Học kỳ",
  },
  {
    name: "Vũ Phương Huy",
    role: "Học viên Toán học tại Everest",
    image: "/home/students/student-4.png",
    imageAlt: "Vũ Phương Huy",
    score: "Top 5",
    exam: "Olympic",
    skill: "Toán",
  },
  {
    name: "Nguyễn Thùy Ngân",
    role: "Học viên Lập trình tại Everest",
    image: "/home/students/student-5.png",
    imageAlt: "Nguyễn Thùy Ngân",
    score: "Top 3",
    exam: "Hackathon",
    skill: "Web",
  },
  {
    name: "Trần Thùy Linh",
    role: "Học viên Lập trình tại Everest",
    image: "/home/students/student-6.png",
    imageAlt: "Trần Thùy Linh",
    score: "3",
    exam: "Dự án",
    skill: "Code",
  },
];

export default function StudentAchievementsSection() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-310 px-4 md:px-6">
        <div className="text-center">
          <h2 className="inline-flex items-start justify-center gap-2 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#032654] md:text-[40px]">
            <span>Thành tích học viên tại Everest</span>
            <span className="translate-y-1 text-[18px] text-[#0D56A6] md:text-[22px]">
              ✦
            </span>
          </h2>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
          {ACHIEVEMENTS.map((item) => (
            <StudentAchievementCard
              key={`${item.name}-${item.score}-${item.exam}`}
              item={item}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#0D56A6] px-8 text-[16px] font-bold text-white transition hover:bg-[#0A478A]"
          >
            Xem tất cả
          </Link>
        </div>
      </div>
    </section>
  );
}