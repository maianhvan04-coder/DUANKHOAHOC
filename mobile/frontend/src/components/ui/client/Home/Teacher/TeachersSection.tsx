"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import TeacherCard, { type TeacherItem } from "./TeacherCard";

const TEACHERS: TeacherItem[] = [
  {
    name: "Đỗ Thị Thảo Nguyên",
    role: "Giảng viên Ngoại ngữ tại Everest",
    image: "/home/teachers/teacher-1.png",
    imageAlt: "Đỗ Thị Thảo Nguyên",
    achievement: "990 TOEIC - 8.0 IELTS - HSK 5",
    certificateTitle: "Học vị",
    certificateDetail: "Thạc sĩ - Phương pháp giảng dạy Tiếng Anh",
    educationTitle: "Trình độ học vấn",
    educationDetail:
      "[Cử nhân] Sư phạm Tiếng Anh - Trường Đại học Ngoại ngữ, ĐHQGHN",
    experienceTitle: "Kinh nghiệm giảng dạy",
    experienceDetail:
      "8 năm kinh nghiệm giảng dạy ngoại ngữ cho học sinh, sinh viên và người đi làm",
  },
  {
    name: "Nguyễn Thị Lan Anh",
    role: "Giảng viên Toán học tại Everest",
    image: "/home/teachers/teacher-2.png",
    imageAlt: "Nguyễn Thị Lan Anh",
    achievement: "Giải Nhì Olympic Toán sinh viên - HSG cấp tỉnh",
    certificateTitle: "Học vị",
    certificateDetail: "Thạc sĩ - Toán học ứng dụng",
    educationTitle: "Trình độ học vấn",
    educationDetail:
      "[Cử nhân] Sư phạm Toán - Trường Đại học Sư phạm Hà Nội",
    experienceTitle: "Kinh nghiệm giảng dạy",
    experienceDetail:
      "10 năm kinh nghiệm giảng dạy Toán, luyện thi và bồi dưỡng học sinh theo lộ trình từ cơ bản đến nâng cao",
  },
  {
    name: "Nguyễn Sơn Tùng",
    role: "Giảng viên Lập trình tại Everest",
    image: "/home/teachers/teacher-3.png",
    imageAlt: "Nguyễn Sơn Tùng",
    achievement: "Top 3 Hackathon - 5 dự án Full-stack thực chiến",
    certificateTitle: "Học vị",
    certificateDetail: "Thạc sĩ - Khoa học máy tính",
    educationTitle: "Trình độ học vấn",
    educationDetail:
      "[Cử nhân] Công nghệ thông tin - Trường Đại học Công nghệ, ĐHQGHN",
    experienceTitle: "Kinh nghiệm giảng dạy",
    experienceDetail:
      "7 năm kinh nghiệm giảng dạy lập trình và hướng dẫn học viên xây dựng dự án thực tế",
  },
];

export default function TeachersSection() {
  return (
    <section className="bg-[#F6F6F6] py-16 md:py-20">
      <div className="mx-auto max-w-310 px-4 md:px-6">
        <div className="relative">
          <div className="text-center">
            <h2 className="inline-flex items-start justify-center gap-2 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#032654] md:text-[40px]">
              <span>Đội ngũ giảng viên tại Everest</span>
              <span className="translate-y-1 text-[18px] text-[#0D56A6] md:text-[22px]">
                ✦
              </span>
            </h2>
          </div>

          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 text-[16px] font-bold text-[#0D56A6] transition hover:translate-x-0.5 md:absolute md:right-0 md:top-4 md:mt-0"
          >
            Xem tất cả
            <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
          </Link>
        </div>

        <div className="mt-12 grid gap-10 xl:grid-cols-3">
          {TEACHERS.map((teacher) => (
            <TeacherCard key={teacher.name} item={teacher} />
          ))}
        </div>
      </div>
    </section>
  );
}